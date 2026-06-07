import { jsonResponse } from "../lib/shared.js";

const apiUrl = "https://v3.football.api-sports.io/fixtures";
const liveStatuses = new Set(["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"]);
const liveCacheSeconds = 300;
const idleCacheSeconds = 900;
const rateLimitCacheSeconds = 600;
const allowedParameters = [
  "id",
  "ids",
  "league",
  "season",
  "date",
  "from",
  "to",
  "live",
  "timezone",
  "team",
  "status",
  "round",
  "next",
  "last",
];

function normalizeFixture(entry) {
  return {
    fixtureId: entry.fixture?.id || null,
    date: entry.fixture?.date || null,
    timestamp: entry.fixture?.timestamp || null,
    status: entry.fixture?.status?.short || null,
    statusLabel: entry.fixture?.status?.long || null,
    minute: entry.fixture?.status?.elapsed ?? null,
    leagueId: entry.league?.id || null,
    league: entry.league?.name || null,
    round: entry.league?.round || null,
    home: {
      id: entry.teams?.home?.id || null,
      name: entry.teams?.home?.name || null,
    },
    away: {
      id: entry.teams?.away?.id || null,
      name: entry.teams?.away?.name || null,
    },
    goals: {
      home: entry.goals?.home ?? null,
      away: entry.goals?.away ?? null,
    },
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "GET") return jsonResponse(405, { error: "Methode nicht erlaubt." });

  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return jsonResponse(503, {
      error: "Live-Ergebnisse sind noch nicht konfiguriert.",
      details: "Bitte API_FOOTBALL_KEY als Environment Variable in Cloudflare hinterlegen.",
    });
  }

  const sourceParams = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  allowedParameters.forEach((name) => {
    const value = sourceParams.get(name);
    if (value !== null && value !== "") query.set(name, value);
  });

  if (!query.size) {
    query.set("league", "1");
    query.set("season", "2026");
    query.set("timezone", "Europe/Berlin");
  }

  try {
    const cache = caches.default;
    const cacheKey = new Request(`${new URL(request.url).origin}/api/results?${query}`);
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) return cachedResponse;

    const apiResponse = await fetch(`${apiUrl}?${query}`, {
      headers: {
        "x-apisports-key": apiKey,
      },
    });
    const data = await apiResponse.json().catch(() => ({}));
    const errorText = JSON.stringify(data.errors || data.message || "").toLowerCase();
    const rateLimited = apiResponse.status === 429 || errorText.includes("too many requests") || errorText.includes("rate limit");

    if (rateLimited) {
      const response = jsonResponse(429, {
        error: "Live-Ergebnisse werden später aktualisiert.",
        retryAfterSeconds: rateLimitCacheSeconds,
      });
      response.headers.set("Cache-Control", `public, max-age=${rateLimitCacheSeconds}`);
      response.headers.set("Retry-After", String(rateLimitCacheSeconds));
      context.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    }

    if (!apiResponse.ok || data.errors?.length || Object.keys(data.errors || {}).length) {
      return jsonResponse(apiResponse.ok ? 502 : apiResponse.status, {
        error: "API-Football konnte keine Live-Ergebnisse liefern.",
        details: data.errors || data.message || `HTTP ${apiResponse.status}`,
      });
    }

    const fixtures = Array.isArray(data.response) ? data.response.map(normalizeFixture) : [];
    const hasLiveMatches = fixtures.some((fixture) => liveStatuses.has(fixture.status));
    const cacheSeconds = hasLiveMatches ? liveCacheSeconds : idleCacheSeconds;
    const response = jsonResponse(200, {
      results: Number(data.results || 0),
      fixtures,
      hasLiveMatches,
      nextUpdateSeconds: cacheSeconds,
    });
    response.headers.set("Cache-Control", `public, max-age=${cacheSeconds}`);
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    return jsonResponse(502, {
      error: "API-Football ist momentan nicht erreichbar.",
      details: error.message,
    });
  }
}

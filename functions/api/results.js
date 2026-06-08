import { jsonResponse, supabase } from "../lib/shared.js";

const apiUrl = "https://v3.football.api-sports.io/fixtures";
const liveStatuses = new Set(["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE", "live"]);
const liveCacheSeconds = 300;
const idleCacheSeconds = 900;
const rateLimitCacheSeconds = 600;
const allowedParameters = [
  "id", "ids", "league", "season", "date", "from", "to", "live", "timezone",
  "team", "status", "round", "next", "last",
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
    home: { id: entry.teams?.home?.id || null, name: entry.teams?.home?.name || null },
    away: { id: entry.teams?.away?.id || null, name: entry.teams?.away?.name || null },
    goals: { home: entry.goals?.home ?? null, away: entry.goals?.away ?? null },
  };
}

function normalizeManualResult(entry) {
  const hasScore = entry.status !== "open";
  return {
    matchId: entry.match_id,
    status: entry.status,
    statusLabel: "Manuell eingetragen",
    minute: entry.minute ?? null,
    goals: {
      home: hasScore ? Number(entry.home_score) : null,
      away: hasScore ? Number(entry.away_score) : null,
    },
    manual: true,
  };
}

function mergedResponse(apiData, manualFixtures) {
  const fixtures = [...(apiData.fixtures || []), ...manualFixtures];
  const response = jsonResponse(200, {
    ...apiData,
    fixtures,
    hasLiveMatches: fixtures.some((fixture) => liveStatuses.has(fixture.status)),
    manualResults: manualFixtures.length,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "GET") return jsonResponse(405, { error: "Methode nicht erlaubt." });

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
    let manualRows = [];
    try {
      manualRows = await supabase(
        env,
        "manual_results?select=match_id,home_score,away_score,status,minute,updated_at&order=match_id.asc",
      );
    } catch (error) {
      console.warn("Manuelle Ergebnisse sind noch nicht eingerichtet.", error.message);
    }
    const manualFixtures = manualRows.map(normalizeManualResult);
    const apiKey = env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return mergedResponse({
        results: 0,
        warning: "Live-Ergebnisse sind noch nicht konfiguriert. Manuelle Ergebnisse werden verwendet.",
        nextUpdateSeconds: idleCacheSeconds,
      }, manualFixtures);
    }

    const cache = caches.default;
    const cacheKey = new Request(`${new URL(request.url).origin}/api/results?${query}`);
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) return mergedResponse(await cachedResponse.json(), manualFixtures);

    const apiResponse = await fetch(`${apiUrl}?${query}`, {
      headers: { "x-apisports-key": apiKey },
    });
    const data = await apiResponse.json().catch(() => ({}));
    const errorText = JSON.stringify(data.errors || data.message || "").toLowerCase();
    const rateLimited = apiResponse.status === 429 || errorText.includes("too many requests") || errorText.includes("rate limit");

    if (rateLimited) {
      const apiData = {
        fixtures: [],
        warning: "Live-Ergebnisse werden später aktualisiert. Manuelle Ergebnisse werden verwendet.",
        rateLimited: true,
        retryAfterSeconds: rateLimitCacheSeconds,
        nextUpdateSeconds: rateLimitCacheSeconds,
      };
      const cachedRateLimit = jsonResponse(200, apiData);
      cachedRateLimit.headers.set("Cache-Control", `public, max-age=${rateLimitCacheSeconds}`);
      context.waitUntil(cache.put(cacheKey, cachedRateLimit));
      return mergedResponse(apiData, manualFixtures);
    }

    if (!apiResponse.ok || data.errors?.length || Object.keys(data.errors || {}).length) {
      return mergedResponse({
        fixtures: [],
        warning: "API-Football konnte keine Live-Ergebnisse liefern. Manuelle Ergebnisse werden verwendet.",
        nextUpdateSeconds: idleCacheSeconds,
      }, manualFixtures);
    }

    const fixtures = Array.isArray(data.response) ? data.response.map(normalizeFixture) : [];
    const hasLiveMatches = fixtures.some((fixture) => liveStatuses.has(fixture.status));
    const cacheSeconds = hasLiveMatches ? liveCacheSeconds : idleCacheSeconds;
    const apiData = {
      results: Number(data.results || 0),
      fixtures,
      hasLiveMatches,
      nextUpdateSeconds: cacheSeconds,
    };
    const cachedApiResponse = jsonResponse(200, apiData);
    cachedApiResponse.headers.set("Cache-Control", `public, max-age=${cacheSeconds}`);
    context.waitUntil(cache.put(cacheKey, cachedApiResponse));
    return mergedResponse(apiData, manualFixtures);
  } catch (error) {
    return jsonResponse(502, {
      error: "Ergebnisse sind momentan nicht erreichbar.",
      details: error.message,
    });
  }
}

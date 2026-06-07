import { jsonResponse } from "../lib/shared.js";

const apiUrl = "https://v3.football.api-sports.io/fixtures";
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
    const apiResponse = await fetch(`${apiUrl}?${query}`, {
      headers: {
        "x-apisports-key": apiKey,
      },
    });
    const data = await apiResponse.json().catch(() => ({}));

    if (!apiResponse.ok || data.errors?.length || Object.keys(data.errors || {}).length) {
      return jsonResponse(apiResponse.ok ? 502 : apiResponse.status, {
        error: "API-Football konnte keine Live-Ergebnisse liefern.",
        details: data.errors || data.message || `HTTP ${apiResponse.status}`,
      });
    }

    return jsonResponse(200, {
      results: Number(data.results || 0),
      fixtures: Array.isArray(data.response) ? data.response.map(normalizeFixture) : [],
    });
  } catch (error) {
    return jsonResponse(502, {
      error: "API-Football ist momentan nicht erreichbar.",
      details: error.message,
    });
  }
}

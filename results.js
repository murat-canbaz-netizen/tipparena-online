const { headers, response } = require("./_shared");

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

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };
  if (event.httpMethod !== "GET") return response(405, { error: "Methode nicht erlaubt." });

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return response(503, {
      error: "Live-Ergebnisse sind noch nicht konfiguriert.",
      details: "Bitte API_FOOTBALL_KEY als Environment Variable in Netlify hinterlegen.",
    });
  }

  const query = new URLSearchParams();
  allowedParameters.forEach((name) => {
    const value = event.queryStringParameters?.[name];
    if (value !== undefined && value !== "") query.set(name, String(value));
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
      return response(apiResponse.ok ? 502 : apiResponse.status, {
        error: "API-Football konnte keine Live-Ergebnisse liefern.",
        details: data.errors || data.message || `HTTP ${apiResponse.status}`,
      });
    }

    return response(200, {
      results: Number(data.results || 0),
      fixtures: Array.isArray(data.response) ? data.response.map(normalizeFixture) : [],
    });
  } catch (error) {
    return response(502, {
      error: "API-Football ist momentan nicht erreichbar.",
      details: error.message,
    });
  }
};

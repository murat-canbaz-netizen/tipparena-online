import { jsonResponse, supabase } from "../lib/shared.js";
import { refreshLeaderboardSnapshots } from "../lib/leaderboard.js";
import { matchCatalog } from "../lib/matches.js";

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

function fixtureMatchId(fixture) {
  if (fixture.matchId) return String(fixture.matchId).trim().toLowerCase();
  return matchCatalog.find(
    (match) =>
      normalizedResultName(match.home) === normalizedResultName(fixture.home?.name) &&
      normalizedResultName(match.away) === normalizedResultName(fixture.away?.name),
  )?.id || null;
}

function normalizedResultName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function fixtureResult(fixture) {
  if (fixture.status === "open") return null;
  const home = Number(fixture.goals?.home);
  const away = Number(fixture.goals?.away);
  return Number.isFinite(home) && Number.isFinite(away) ? { home, away } : null;
}

function resultDiagnostics(fixtures) {
  const byMatch = new Map();
  fixtures.forEach((fixture) => {
    const matchId = fixtureMatchId(fixture);
    if (!matchId) return;
    byMatch.set(matchId, fixture);
  });

  const finished = matchCatalog
    .map((match, index) => {
      const fixture = byMatch.get(match.id);
      const result = fixture ? fixtureResult(fixture) : null;
      const isFinished = fixture?.status === "finished" || ["FT", "AET", "PEN"].includes(fixture?.status);
      return {
        order: index,
        matchId: match.id,
        teams: `${match.home} - ${match.away}`,
        result: result ? `${result.home}:${result.away}` : null,
        status: fixture?.status || "open",
        source: fixture?.manual ? "manual_results" : fixture ? "api_football" : "none",
        counted: Boolean(result),
        finished: Boolean(isFinished && result),
      };
    })
    .filter((entry) => entry.finished);

  const lastFinished = finished.at(-1) || null;
  return {
    manualResultCount: fixtures.filter((fixture) => fixture.manual).length,
    latestCountedMatch: lastFinished
      ? {
          matchId: lastFinished.matchId,
          teams: lastFinished.teams,
          result: lastFinished.result,
          source: lastFinished.source,
        }
      : null,
    lastFinishedMatches: finished.slice(-10).map(({ order, ...entry }) => entry),
  };
}

async function mergedResponse(env, apiData, manualFixtures, updateSnapshot = true, includeDiagnostics = false) {
  const fixtures = [...(apiData.fixtures || []), ...manualFixtures];
  if (updateSnapshot) {
    try {
      await refreshLeaderboardSnapshots(env, fixtures);
    } catch (error) {
      console.error("Ranglisten-Snapshot konnte nicht aktualisiert werden.", error.message);
    }
  }
  const response = jsonResponse(200, {
    ...apiData,
    fixtures,
    hasLiveMatches: fixtures.some((fixture) => liveStatuses.has(fixture.status)),
    manualResults: manualFixtures.length,
    ...(includeDiagnostics ? { resultDiagnostics: resultDiagnostics(fixtures) } : {}),
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function sanitizeDiagnostic(value, apiKey) {
  if (Array.isArray(value)) return value.map((entry) => sanitizeDiagnostic(entry, apiKey));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sanitizeDiagnostic(entry, apiKey)]));
  }
  if (typeof value === "string" && apiKey) return value.replaceAll(apiKey, "[REDACTED]");
  return value;
}

function apiErrorDetails(apiResponse, data, query, apiKey) {
  const rawErrors = data.errors || data.message || null;
  const errorText = JSON.stringify(rawErrors || "").toLowerCase();
  let category = "api_error";
  let message = "API-Football hat einen unbekannten Fehler gemeldet.";

  if (apiResponse.status === 429 || errorText.includes("too many requests") || errorText.includes("rate limit")) {
    category = "rate_limit";
    message = "Das API-Football-Anfragelimit wurde erreicht.";
  } else if (apiResponse.status === 401 || errorText.includes("invalid key") || errorText.includes("application key") || errorText.includes("unauthorized")) {
    category = "invalid_key";
    message = "Der API-Football-Key fehlt oder ist ungültig.";
  } else if (apiResponse.status === 403 || errorText.includes("plan") || errorText.includes("subscription") || errorText.includes("access")) {
    category = "plan_restriction";
    message = "Der API-Football-Tarif erlaubt diese Anfrage wahrscheinlich nicht.";
  } else if (errorText.includes("league") || errorText.includes("season")) {
    category = "invalid_competition";
    message = "League oder Season wird von API-Football nicht akzeptiert.";
  }

  return sanitizeDiagnostic({
    category,
    message,
    httpStatus: apiResponse.status,
    query: Object.fromEntries(query),
    apiErrors: rawErrors,
  }, apiKey);
}

function adminTestMode(request, env) {
  const enabled = new URL(request.url).searchParams.get("adminTest") === "1";
  if (!enabled) return { enabled: false, authorized: false };
  const adminKey = String(env.ADMIN_DASHBOARD_KEY || "");
  const submittedKey = String(request.headers.get("X-Admin-Code") || "");
  return { enabled: true, authorized: Boolean(adminKey) && submittedKey === adminKey };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "GET") return jsonResponse(405, { error: "Methode nicht erlaubt." });

  const sourceParams = new URL(request.url).searchParams;
  const adminTest = adminTestMode(request, env);
  const includeResultDiagnostics = adminTest.authorized || sourceParams.get("debug") === "1";
  if (adminTest.enabled && !adminTest.authorized) {
    return jsonResponse(401, { error: "Admin-Testmodus ist nicht autorisiert." });
  }

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
      const diagnostic = {
        category: "missing_key",
        message: "API_FOOTBALL_KEY ist in der Cloudflare-Umgebung nicht gesetzt.",
        query: Object.fromEntries(query),
      };
      console.error("API-Football Diagnose", diagnostic);
      return await mergedResponse(env, {
        results: 0,
        warning: "Live-Ergebnisse sind noch nicht konfiguriert. Manuelle Ergebnisse werden verwendet.",
        ...(adminTest.authorized ? { diagnostic } : {}),
        nextUpdateSeconds: idleCacheSeconds,
      }, manualFixtures, true, includeResultDiagnostics);
    }

    const cache = caches.default;
    const cacheKey = new Request(`${new URL(request.url).origin}/api/results?${query}`);
    const cachedResponse = adminTest.authorized ? null : await cache.match(cacheKey);
    if (cachedResponse) {
      const cachedData = await cachedResponse.json();
      return await mergedResponse(
        env,
        cachedData,
        manualFixtures,
        !cachedData.rateLimited && Boolean(cachedData.fixtures?.length),
        includeResultDiagnostics,
      );
    }

    const apiResponse = await fetch(`${apiUrl}?${query}`, {
      headers: { "x-apisports-key": apiKey },
    });
    const data = await apiResponse.json().catch(() => ({}));
    const errorText = JSON.stringify(data.errors || data.message || "").toLowerCase();
    const rateLimited = apiResponse.status === 429 || errorText.includes("too many requests") || errorText.includes("rate limit");

    if (rateLimited) {
      const diagnostic = apiErrorDetails(apiResponse, data, query, apiKey);
      console.error("API-Football Diagnose", diagnostic);
      const apiData = {
        fixtures: [],
        warning: "Live-Ergebnisse werden später aktualisiert. Manuelle Ergebnisse werden verwendet.",
        rateLimited: true,
        retryAfterSeconds: rateLimitCacheSeconds,
        nextUpdateSeconds: rateLimitCacheSeconds,
        ...(adminTest.authorized ? { diagnostic } : {}),
      };
      const cachedRateLimit = jsonResponse(200, apiData);
      cachedRateLimit.headers.set("Cache-Control", `public, max-age=${rateLimitCacheSeconds}`);
      if (!adminTest.authorized) context.waitUntil(cache.put(cacheKey, cachedRateLimit));
      return await mergedResponse(env, apiData, manualFixtures, false, includeResultDiagnostics);
    }

    if (!apiResponse.ok || data.errors?.length || Object.keys(data.errors || {}).length) {
      const diagnostic = apiErrorDetails(apiResponse, data, query, apiKey);
      console.error("API-Football Diagnose", diagnostic);
      return await mergedResponse(env, {
        fixtures: [],
        warning: "API-Football konnte keine Live-Ergebnisse liefern. Manuelle Ergebnisse werden verwendet.",
        ...(adminTest.authorized ? { diagnostic } : {}),
        nextUpdateSeconds: idleCacheSeconds,
      }, manualFixtures, false, includeResultDiagnostics);
    }

    const fixtures = Array.isArray(data.response) ? data.response.map(normalizeFixture) : [];
    const diagnostic = fixtures.length
      ? null
      : {
          category: "no_data",
          message: "API-Football hat die Anfrage akzeptiert, aber keine Fixtures gefunden.",
          httpStatus: apiResponse.status,
          query: Object.fromEntries(query),
          apiResults: Number(data.results || 0),
        };
    if (diagnostic) console.warn("API-Football Diagnose", diagnostic);
    const hasLiveMatches = fixtures.some((fixture) => liveStatuses.has(fixture.status));
    const cacheSeconds = hasLiveMatches ? liveCacheSeconds : idleCacheSeconds;
    const apiData = {
      results: Number(data.results || 0),
      fixtures,
      hasLiveMatches,
      nextUpdateSeconds: cacheSeconds,
      ...(adminTest.authorized && diagnostic ? { diagnostic } : {}),
    };
    const cachedApiResponse = jsonResponse(200, apiData);
    cachedApiResponse.headers.set("Cache-Control", `public, max-age=${cacheSeconds}`);
    if (!adminTest.authorized) context.waitUntil(cache.put(cacheKey, cachedApiResponse));
    return await mergedResponse(env, apiData, manualFixtures, fixtures.length > 0, includeResultDiagnostics);
  } catch (error) {
    const diagnostic = {
      category: "network_or_server_error",
      message: "Die Verbindung zu API-Football oder die Ergebnisverarbeitung ist fehlgeschlagen.",
      details: error.message,
    };
    console.error("API-Football Diagnose", diagnostic);
    return jsonResponse(502, {
      error: "Ergebnisse sind momentan nicht erreichbar.",
      ...(adminTest.authorized ? { diagnostic } : {}),
    });
  }
}

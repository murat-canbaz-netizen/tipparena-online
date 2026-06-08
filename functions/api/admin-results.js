import { jsonResponse, supabase } from "../lib/shared.js";
import { matchKickoff } from "../lib/matches.js";

const allowedStatuses = new Set(["open", "live", "finished"]);

function cleanScore(value) {
  const score = Number(value);
  return Number.isInteger(score) && score >= 0 && score <= 20 ? score : null;
}

function cleanMinute(value) {
  if (value === "" || value === null || value === undefined) return null;
  const minute = Number(value);
  return Number.isInteger(minute) && minute >= 0 && minute <= 150 ? minute : null;
}

function authenticate(body, env) {
  const adminKey = String(env.ADMIN_DASHBOARD_KEY || "");
  if (!adminKey) return jsonResponse(503, { error: "Der private Adminbereich ist noch nicht konfiguriert." });
  if (!body.adminCode || String(body.adminCode) !== adminKey) {
    return jsonResponse(401, { error: "Admin-Code ist nicht korrekt." });
  }
  return null;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") return jsonResponse(405, { error: "Methode nicht erlaubt." });

  const body = await request.json().catch(() => ({}));
  const authError = authenticate(body, env);
  if (authError) return authError;

  try {
    if (body.action === "list") {
      const results = await supabase(env, "manual_results?select=match_id,home_score,away_score,status,minute,updated_at&order=match_id.asc");
      const response = jsonResponse(200, { results });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    if (body.action !== "save") return jsonResponse(400, { error: "Unbekannte Admin-Aktion." });

    const matchId = String(body.matchId || "").trim().toLowerCase();
    const homeScore = cleanScore(body.homeScore);
    const awayScore = cleanScore(body.awayScore);
    const status = String(body.status || "").trim().toLowerCase();
    const minute = cleanMinute(body.minute);

    if (matchKickoff(matchId) === null) return jsonResponse(400, { error: "Unbekannte Spiel-ID." });
    if (homeScore === null || awayScore === null) return jsonResponse(400, { error: "Bitte gültige Ergebnisse zwischen 0 und 20 eingeben." });
    if (!allowedStatuses.has(status)) return jsonResponse(400, { error: "Ungültiger Spielstatus." });
    if (body.minute !== "" && body.minute !== null && body.minute !== undefined && minute === null) {
      return jsonResponse(400, { error: "Bitte eine gültige Spielminute eingeben." });
    }

    const rows = await supabase(env, "manual_results?on_conflict=match_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        status,
        minute,
        updated_at: new Date().toISOString(),
      }),
    });

    const response = jsonResponse(200, { success: true, result: rows[0] });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return jsonResponse(500, { error: error.message });
  }
}

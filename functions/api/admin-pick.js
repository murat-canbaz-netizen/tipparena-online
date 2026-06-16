import { jsonResponse, supabase } from "../lib/shared.js";
import { matchKickoff } from "../lib/matches.js";
import { refreshLeaderboardSnapshotsForPickChange } from "../lib/leaderboard.js";

function validScore(value) {
  const score = Number(value);
  return Number.isInteger(score) && score >= 0 && score <= 20 ? score : null;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") return jsonResponse(405, { error: "Methode nicht erlaubt." });

  const body = await request.json().catch(() => ({}));
  const adminKey = String(env.ADMIN_DASHBOARD_KEY || "");
  const submittedKey = String(body.adminCode || "");
  const roomCode = String(body.roomCode || "").trim().toUpperCase();
  const playerId = String(body.playerId || "").trim();
  const matchId = String(body.matchId || "").trim().toLowerCase();
  const homeScore = validScore(body.homeScore);
  const awayScore = validScore(body.awayScore);
  const overwrite = body.overwrite === true;

  if (!adminKey) return jsonResponse(503, { error: "Der private Adminbereich ist noch nicht konfiguriert." });
  if (!submittedKey || submittedKey !== adminKey) return jsonResponse(401, { error: "Admin-Code ist nicht korrekt." });
  if (!roomCode || !playerId) return jsonResponse(400, { error: "Raum oder Spieler fehlt." });
  if (matchKickoff(matchId) === null) return jsonResponse(400, { error: "Unbekannte Spiel-ID." });
  if (homeScore === null || awayScore === null) {
    return jsonResponse(400, { error: "Bitte gültige Tore zwischen 0 und 20 eingeben." });
  }

  try {
    const encodedRoom = encodeURIComponent(roomCode);
    const encodedPlayer = encodeURIComponent(playerId);
    const encodedMatch = encodeURIComponent(matchId);
    const player = await supabase(
      env,
      `players?id=eq.${encodedPlayer}&room_code=eq.${encodedRoom}&select=id,nickname&limit=1`,
    );
    if (!player.length) return jsonResponse(404, { error: "Dieser Spieler wurde in dem Raum nicht gefunden." });

    const existing = await supabase(
      env,
      `picks?player_id=eq.${encodedPlayer}&match_id=eq.${encodedMatch}&select=home_score,away_score&limit=1`,
    );
    if (existing.length && !overwrite) {
      return jsonResponse(409, {
        error: "Für dieses Kind gibt es bereits einen Tipp. Wirklich überschreiben?",
        existingPick: {
          homeScore: Number(existing[0].home_score),
          awayScore: Number(existing[0].away_score),
        },
      });
    }

    const saved = await supabase(env, "picks?on_conflict=player_id,match_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        room_code: roomCode,
        player_id: playerId,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        updated_at: new Date().toISOString(),
      }),
    });
    let leaderboardWarning = null;
    try {
      await refreshLeaderboardSnapshotsForPickChange(env);
    } catch (error) {
      console.error("Admin-Tipp gespeichert, Rangliste konnte aber nicht aktualisiert werden", { error: error.message });
      leaderboardWarning = "Der Tipp wurde gespeichert, die Rangliste konnte aber nicht sofort aktualisiert werden.";
    }

    const response = jsonResponse(200, {
      success: true,
      overwritten: existing.length > 0,
      pick: saved[0],
      ...(leaderboardWarning ? { warning: leaderboardWarning } : {}),
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return jsonResponse(500, { error: error.message });
  }
}

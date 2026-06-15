import { jsonResponse, supabase } from "../lib/shared.js";
import { matchKickoff } from "../lib/matches.js";

function cleanScore(value) {
  return Math.max(0, Math.min(20, Number(value || 0)));
}

function noStoreJson(status, body) {
  const response = jsonResponse(status, body);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });

  try {
    if (request.method === "GET") {
      const room = String(new URL(request.url).searchParams.get("room") || "").trim().toUpperCase();
      if (!room) return noStoreJson(400, { error: "Raumcode fehlt." });

      const encodedRoom = encodeURIComponent(room);
      const [players, picks, snapshots] = await Promise.all([
        supabase(
          env,
          `players?room_code=eq.${encodedRoom}&select=id,nickname,avatar,created_at&order=created_at.asc`,
        ),
        supabase(
          env,
          `picks?room_code=eq.${encodedRoom}&select=player_id,match_id,home_score,away_score,updated_at`,
        ),
        supabase(
          env,
          `leaderboard_snapshots?room_code=eq.${encodedRoom}&select=snapshot&limit=1`,
        ),
      ]);
      return noStoreJson(200, { players, picks, leaderboard: snapshots[0]?.snapshot || [] });
    }

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const roomCode = String(body.roomCode || "").trim().toUpperCase();
      const playerId = String(body.playerId || "").trim();
      const rows = Array.isArray(body.picks) ? body.picks : [body];

      if (!roomCode || !playerId) return noStoreJson(400, { error: "Raum oder Spieler fehlt." });
      const matchIds = rows.map((pick) => String(pick.matchId || "").trim().toLowerCase());
      const unknownMatchId = matchIds.find((matchId) => matchKickoff(matchId) === null);
      if (unknownMatchId !== undefined) {
        return noStoreJson(400, { error: "Unbekannte Spiel-ID. Der Tipp wurde nicht gespeichert." });
      }
      const now = Date.now();
      if (matchIds.some((matchId) => now >= matchKickoff(matchId))) {
        return noStoreJson(409, { error: "Dieses Spiel hat bereits begonnen. Dein Tipp wurde nicht gespeichert." });
      }

      const player = await supabase(
        env,
        `players?id=eq.${encodeURIComponent(playerId)}&room_code=eq.${encodeURIComponent(roomCode)}&select=id&limit=1`,
      );
      if (!player.length) return noStoreJson(403, { error: "Dieser Spieler gehört nicht zu diesem Klassenraum." });

      const payload = rows
        .map((pick) => ({
          room_code: roomCode,
          player_id: playerId,
          match_id: String(pick.matchId).trim().toLowerCase(),
          home_score: cleanScore(pick.homeScore),
          away_score: cleanScore(pick.awayScore),
          updated_at: new Date().toISOString(),
        }));

      if (!payload.length) return noStoreJson(200, { picks: [] });

      const saved = await supabase(env, "picks?on_conflict=player_id,match_id", {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(payload),
      });

      const allSaved = Array.isArray(saved)
        && saved.length === payload.length
        && payload.every((expected) => saved.some((entry) => (
          String(entry.player_id) === expected.player_id
          && String(entry.match_id).toLowerCase() === expected.match_id
          && Number(entry.home_score) === expected.home_score
          && Number(entry.away_score) === expected.away_score
        )));
      if (!allSaved) {
        return noStoreJson(500, { error: "Der Tipp konnte nicht sicher bestätigt werden." });
      }
      return noStoreJson(200, { picks: saved });
    }

    return noStoreJson(405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    return noStoreJson(500, { error: error.message });
  }
}

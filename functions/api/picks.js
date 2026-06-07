import { jsonResponse, supabase } from "../lib/shared.js";

function cleanScore(value) {
  return Math.max(0, Math.min(20, Number(value || 0)));
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });

  try {
    if (request.method === "GET") {
      const room = String(new URL(request.url).searchParams.get("room") || "").trim().toUpperCase();
      if (!room) return jsonResponse(400, { error: "Raumcode fehlt." });

      const encodedRoom = encodeURIComponent(room);
      const players = await supabase(
        env,
        `players?room_code=eq.${encodedRoom}&select=id,nickname,avatar,created_at&order=created_at.asc`,
      );
      const picks = await supabase(
        env,
        `picks?room_code=eq.${encodedRoom}&select=player_id,match_id,home_score,away_score,updated_at`,
      );
      return jsonResponse(200, { players, picks });
    }

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const roomCode = String(body.roomCode || "").trim().toUpperCase();
      const playerId = String(body.playerId || "").trim();
      const rows = Array.isArray(body.picks) ? body.picks : [body];

      if (!roomCode || !playerId) return jsonResponse(400, { error: "Raum oder Spieler fehlt." });
      const player = await supabase(
        env,
        `players?id=eq.${encodeURIComponent(playerId)}&room_code=eq.${encodeURIComponent(roomCode)}&select=id&limit=1`,
      );
      if (!player.length) return jsonResponse(403, { error: "Dieser Spieler gehört nicht zu diesem Klassenraum." });

      const payload = rows
        .filter((pick) => pick.matchId)
        .map((pick) => ({
          room_code: roomCode,
          player_id: playerId,
          match_id: String(pick.matchId),
          home_score: cleanScore(pick.homeScore),
          away_score: cleanScore(pick.awayScore),
          updated_at: new Date().toISOString(),
        }));

      if (!payload.length) return jsonResponse(200, { picks: [] });

      const saved = await supabase(env, "picks?on_conflict=player_id,match_id", {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(payload),
      });

      return jsonResponse(200, { picks: saved });
    }

    return jsonResponse(405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    return jsonResponse(500, { error: error.message });
  }
}

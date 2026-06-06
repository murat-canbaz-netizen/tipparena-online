const { headers, response, parseBody, supabase } = require("./_shared");

function cleanScore(value) {
  return Math.max(0, Math.min(20, Number(value || 0)));
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };

  try {
    if (event.httpMethod === "GET") {
      const room = String(event.queryStringParameters?.room || "").trim().toUpperCase();
      if (!room) return response(400, { error: "Raumcode fehlt." });
      const encodedRoom = encodeURIComponent(room);
      const players = await supabase(
        `players?room_code=eq.${encodedRoom}&select=id,nickname,avatar,created_at&order=created_at.asc`,
      );
      const picks = await supabase(
        `picks?room_code=eq.${encodedRoom}&select=player_id,match_id,home_score,away_score,updated_at`,
      );
      return response(200, { players, picks });
    }

    if (event.httpMethod === "POST") {
      const body = parseBody(event);
      const roomCode = String(body.roomCode || "").trim().toUpperCase();
      const playerId = String(body.playerId || "").trim();
      const rows = Array.isArray(body.picks) ? body.picks : [body];

      if (!roomCode || !playerId) return response(400, { error: "Raum oder Spieler fehlt." });
      const player = await supabase(
        `players?id=eq.${encodeURIComponent(playerId)}&room_code=eq.${encodeURIComponent(roomCode)}&select=id&limit=1`,
      );
      if (!player.length) return response(403, { error: "Dieser Spieler gehört nicht zu diesem Klassenraum." });

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

      if (!payload.length) return response(200, { picks: [] });

      const saved = await supabase("picks?on_conflict=player_id,match_id", {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(payload),
      });

      return response(200, { picks: saved });
    }

    return response(405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    return response(500, { error: error.message });
  }
};

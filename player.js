const { headers, response, parseBody, supabase, cleanString } = require("./_shared");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };
  if (event.httpMethod !== "POST") return response(405, { error: "Methode nicht erlaubt." });

  try {
    const body = parseBody(event);
    const roomCode = cleanString(body.roomCode).toUpperCase();
    const nickname = cleanString(body.nickname);
    if (!roomCode) return response(400, { error: "Klassencode fehlt." });
    if (!nickname) return response(400, { error: "Spitzname fehlt." });
    const rooms = await supabase(`rooms?code=eq.${encodeURIComponent(roomCode)}&limit=1`);
    const room = rooms[0];
    if (!room) return response(404, { error: "Dieser Klassenraum wurde nicht gefunden." });
    const existing = await supabase(
      `players?room_code=eq.${encodeURIComponent(roomCode)}&nickname=ilike.${encodeURIComponent(nickname)}&limit=1`,
    );
    if (existing.length && existing[0].id !== cleanString(body.playerId)) {
      return response(409, { error: "Dieser Spitzname ist in der Klasse schon vergeben." });
    }

    const payload = {
      room_code: roomCode,
      nickname,
      avatar: cleanString(body.avatar, "panda"),
    };

    const players = existing.length
      ? await supabase(`players?id=eq.${encodeURIComponent(existing[0].id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ avatar: payload.avatar }),
        })
      : await supabase("players", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payload),
        });

    return response(200, { room, player: players[0] });
  } catch (error) {
    return response(500, { error: error.message });
  }
};

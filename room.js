const { headers, response, parseBody, supabase } = require("./_shared");
const { createRoom } = require("./_shared");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };

  try {
    if (event.httpMethod === "POST") {
      const room = await createRoom(parseBody(event));
      return response(201, { room });
    }

    if (event.httpMethod === "GET") {
      const code = String(event.queryStringParameters?.code || "").trim().toUpperCase();
      const teacherCode = String(event.queryStringParameters?.teacherCode || "").trim().toUpperCase();
      if (!code && !teacherCode) return response(400, { error: "Klassen- oder Lehrer-Code fehlt." });

      let room = null;
      if (teacherCode) {
        const mappings = await supabase(
          `rooms?code=eq.${encodeURIComponent(`T-${teacherCode}`)}&class_name=eq.__TEACHER__&select=school&limit=1`,
        );
        if (mappings[0]) {
          const rooms = await supabase(`rooms?code=eq.${encodeURIComponent(mappings[0].school)}&limit=1`);
          room = rooms[0] ? { ...rooms[0], id: rooms[0].code, teacher_code: teacherCode } : null;
        }
      } else {
        const rooms = await supabase(`rooms?code=eq.${encodeURIComponent(code)}&limit=1`);
        room = rooms[0] ? { ...rooms[0], id: rooms[0].code } : null;
      }
      if (!room) return response(404, { error: teacherCode ? "Lehrer-Code nicht gefunden." : "Klassencode nicht gefunden." });
      const roomCode = room.code;
      const players = await supabase(
        `players?room_code=eq.${encodeURIComponent(roomCode)}&select=id,nickname,avatar,created_at&order=created_at.asc`,
      );
      const picks = teacherCode
        ? await supabase(`picks?room_code=eq.${encodeURIComponent(roomCode)}&select=player_id,match_id,home_score,away_score,updated_at`)
        : [];
      return response(200, { room, players, picks });
    }

    return response(405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    return response(error.statusCode || 500, { error: error.message });
  }
};

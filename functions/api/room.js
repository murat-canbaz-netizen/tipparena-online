import { createRoom, jsonResponse, supabase } from "../lib/shared.js";

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });

  try {
    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const room = await createRoom(env, body);
      return jsonResponse(201, { room });
    }

    if (request.method === "GET") {
      const searchParams = new URL(request.url).searchParams;
      const code = String(searchParams.get("code") || "").trim().toUpperCase();
      const teacherCode = String(searchParams.get("teacherCode") || "").trim().toUpperCase();
      if (!code && !teacherCode) return jsonResponse(400, { error: "Klassen- oder Lehrer-Code fehlt." });

      let room = null;
      if (teacherCode) {
        const mappings = await supabase(
          env,
          `rooms?code=eq.${encodeURIComponent(`T-${teacherCode}`)}&class_name=eq.__TEACHER__&select=school&limit=1`,
        );
        if (mappings[0]) {
          const rooms = await supabase(env, `rooms?code=eq.${encodeURIComponent(mappings[0].school)}&limit=1`);
          room = rooms[0] ? { ...rooms[0], id: rooms[0].code, teacher_code: teacherCode } : null;
        }
      } else {
        const rooms = await supabase(env, `rooms?code=eq.${encodeURIComponent(code)}&limit=1`);
        room = rooms[0] ? { ...rooms[0], id: rooms[0].code } : null;
      }

      if (!room) {
        return jsonResponse(404, { error: teacherCode ? "Lehrer-Code nicht gefunden." : "Klassencode nicht gefunden." });
      }

      const roomCode = room.code;
      const players = await supabase(
        env,
        `players?room_code=eq.${encodeURIComponent(roomCode)}&select=id,nickname,avatar,created_at&order=created_at.asc`,
      );
      const picks = teacherCode
        ? await supabase(
            env,
            `picks?room_code=eq.${encodeURIComponent(roomCode)}&select=player_id,match_id,home_score,away_score,updated_at`,
          )
        : [];
      return jsonResponse(200, { room, players, picks });
    }

    return jsonResponse(405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    return jsonResponse(error.statusCode || 500, { error: error.message });
  }
}

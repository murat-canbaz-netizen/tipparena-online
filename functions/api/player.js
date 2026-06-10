import { cleanString, jsonResponse, supabase } from "../lib/shared.js";

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") return jsonResponse(405, { error: "Methode nicht erlaubt." });

  try {
    const body = await request.json().catch(() => ({}));
    const roomCode = cleanString(body.roomCode).toUpperCase();
    const nickname = cleanString(body.nickname);
    if (!roomCode) return jsonResponse(400, { error: "Klassencode fehlt." });
    if (!nickname) return jsonResponse(400, { error: "Spitzname fehlt." });

    const rooms = await supabase(env, `rooms?code=eq.${encodeURIComponent(roomCode)}&limit=1`);
    const room = rooms[0];
    if (!room) return jsonResponse(404, { error: "Dieser Klassenraum wurde nicht gefunden." });

    const existing = await supabase(
      env,
      `players?room_code=eq.${encodeURIComponent(roomCode)}&nickname=ilike.${encodeURIComponent(nickname)}&limit=1`,
    );
    if (existing.length) {
      return jsonResponse(200, { room, player: existing[0], existing: true });
    }

    const payload = {
      room_code: roomCode,
      nickname,
      avatar: cleanString(body.avatar, "panda"),
    };

    const players = await supabase(env, "players", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });

    return jsonResponse(200, { room, player: players[0], existing: false });
  } catch (error) {
    return jsonResponse(500, { error: error.message });
  }
}

import { cleanString, jsonResponse, supabase } from "../lib/shared.js";

function normalizeNickname(value) {
  return cleanString(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function nicknameKey(value) {
  return normalizeNickname(value).toLocaleLowerCase("de-DE");
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") return jsonResponse(405, { error: "Methode nicht erlaubt." });

  try {
    const body = await request.json().catch(() => ({}));
    const roomCode = cleanString(body.roomCode).toUpperCase();
    const nickname = normalizeNickname(body.nickname);
    if (!roomCode) return jsonResponse(400, { error: "Klassencode fehlt." });
    if (!nickname) return jsonResponse(400, { error: "Spitzname fehlt." });

    const rooms = await supabase(env, `rooms?code=eq.${encodeURIComponent(roomCode)}&limit=1`);
    const room = rooms[0];
    if (!room) return jsonResponse(404, { error: "Dieser Klassenraum wurde nicht gefunden." });

    const playersInRoom = await supabase(
      env,
      `players?room_code=eq.${encodeURIComponent(roomCode)}&select=id,room_code,nickname,avatar,created_at&order=created_at.asc`,
    );
    const existing = playersInRoom.find((player) => nicknameKey(player.nickname) === nicknameKey(nickname));
    if (existing) {
      console.info("Spieler-Wiederanmeldung", {
        roomCode,
        nicknameNormalized: nicknameKey(nickname),
        playerId: existing.id,
        existing: true,
      });
      return jsonResponse(200, { room, player: existing, existing: true });
    }

    if (playersInRoom.length >= Number(room.student_count)) {
      return jsonResponse(409, { error: "Der Raum ist voll. Bitte wende dich an deine Lehrkraft." });
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

    console.info("Spieler erstellt", {
      roomCode,
      nicknameNormalized: nicknameKey(nickname),
      playerId: players[0]?.id || null,
      existing: false,
    });
    return jsonResponse(200, { room, player: players[0], existing: false });
  } catch (error) {
    console.error("Spieler-Anmeldung fehlgeschlagen", { error: error.message });
    return jsonResponse(500, { error: error.message });
  }
}

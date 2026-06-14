import { jsonResponse, supabase } from "../lib/shared.js";

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") return jsonResponse(405, { error: "Methode nicht erlaubt." });

  const body = await request.json().catch(() => ({}));
  const submittedKey = String(body.adminCode || "");
  const adminKey = String(env.ADMIN_DASHBOARD_KEY || "");
  const roomCode = String(body.roomCode || "").trim().toUpperCase();
  const playerLimit = Number(body.playerLimit);

  if (!adminKey) return jsonResponse(503, { error: "Der private Adminbereich ist noch nicht konfiguriert." });
  if (!submittedKey || submittedKey !== adminKey) return jsonResponse(401, { error: "Admin-Code ist nicht korrekt." });
  if (!roomCode) return jsonResponse(400, { error: "Raum-Code fehlt." });
  if (!Number.isInteger(playerLimit) || playerLimit < 1 || playerLimit > 35) {
    return jsonResponse(400, { error: "Das Schülerlimit muss eine ganze Zahl zwischen 1 und 35 sein." });
  }

  try {
    const encodedRoom = encodeURIComponent(roomCode);
    const [rooms, players] = await Promise.all([
      supabase(
        env,
        `rooms?code=eq.${encodedRoom}&class_name=neq.__TEACHER__&select=code,student_count&limit=1`,
      ),
      supabase(env, `players?room_code=eq.${encodedRoom}&select=id`),
    ]);
    if (!rooms.length) return jsonResponse(404, { error: "Klassenraum wurde nicht gefunden." });
    if (playerLimit < players.length) {
      return jsonResponse(409, {
        error: `Das Limit darf nicht kleiner als die aktuelle Spielerzahl (${players.length}) sein.`,
      });
    }

    const updatedRooms = await supabase(env, `rooms?code=eq.${encodedRoom}&class_name=neq.__TEACHER__`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ student_count: playerLimit }),
    });

    const response = jsonResponse(200, {
      success: true,
      roomCode,
      playerCount: players.length,
      playerLimit: Number(updatedRooms[0]?.student_count || playerLimit),
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return jsonResponse(500, { error: error.message });
  }
}

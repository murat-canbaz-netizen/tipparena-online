import { jsonResponse, supabase } from "../lib/shared.js";

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") return jsonResponse(405, { error: "Methode nicht erlaubt." });

  const body = await request.json().catch(() => ({}));
  const submittedKey = String(body.adminCode || "");
  const adminKey = String(env.ADMIN_DASHBOARD_KEY || "");
  const roomCode = String(body.roomCode || "").trim().toUpperCase();

  if (!adminKey) {
    return jsonResponse(503, { error: "Der private Adminbereich ist noch nicht konfiguriert." });
  }
  if (!submittedKey || submittedKey !== adminKey) {
    return jsonResponse(401, { error: "Admin-Code ist nicht korrekt." });
  }
  if (!roomCode) return jsonResponse(400, { error: "Raum-Code fehlt." });

  try {
    const encodedRoom = encodeURIComponent(roomCode);
    const rooms = await supabase(
      env,
      `rooms?code=eq.${encodedRoom}&class_name=neq.__TEACHER__&select=code,school,class_name&limit=1`,
    );
    if (!rooms.length) return jsonResponse(404, { error: "Klassenraum wurde nicht gefunden." });

    const [players, picks] = await Promise.all([
      supabase(env, `players?room_code=eq.${encodedRoom}&select=id`),
      supabase(env, `picks?room_code=eq.${encodedRoom}&select=match_id`),
    ]);

    const teacherMappings = await supabase(
      env,
      `rooms?school=eq.${encodedRoom}&class_name=eq.__TEACHER__&select=code`,
      {
        method: "DELETE",
        headers: { Prefer: "return=representation" },
      },
    );
    const deletedRooms = await supabase(env, `rooms?code=eq.${encodedRoom}&class_name=neq.__TEACHER__&select=code`, {
      method: "DELETE",
      headers: { Prefer: "return=representation" },
    });

    if (!deletedRooms.length) return jsonResponse(409, { error: "Klassenraum konnte nicht gelöscht werden." });

    const response = jsonResponse(200, {
      success: true,
      roomCode,
      deletedRooms: deletedRooms.length,
      deletedPlayers: players.length,
      deletedPicks: picks.length,
      deletedTeacherMappings: Array.isArray(teacherMappings) ? teacherMappings.length : 0,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return jsonResponse(500, { error: error.message });
  }
}

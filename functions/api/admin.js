import { jsonResponse, supabase } from "../lib/shared.js";

function latestDate(...values) {
  return values
    .filter(Boolean)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] || null;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") return jsonResponse(405, { error: "Methode nicht erlaubt." });

  const body = await request.json().catch(() => ({}));
  const submittedKey = String(body.adminCode || "");
  const adminKey = String(env.ADMIN_DASHBOARD_KEY || "");

  if (!adminKey) {
    return jsonResponse(503, { error: "Der private Adminbereich ist noch nicht konfiguriert." });
  }
  if (!submittedKey || submittedKey !== adminKey) {
    return jsonResponse(401, { error: "Admin-Code ist nicht korrekt." });
  }

  try {
    const [roomRows, players, picks] = await Promise.all([
      supabase(env, "rooms?select=code,school,class_name,created_at&order=created_at.desc"),
      supabase(env, "players?select=room_code,created_at"),
      supabase(env, "picks?select=room_code,updated_at"),
    ]);

    const teacherCodes = new Map(
      roomRows
        .filter((room) => room.class_name === "__TEACHER__")
        .map((room) => [room.school, String(room.code || "").replace(/^T-/, "")]),
    );
    const rooms = roomRows
      .filter((room) => room.class_name !== "__TEACHER__")
      .map((room) => {
        const roomPlayers = players.filter((player) => player.room_code === room.code);
        const roomPicks = picks.filter((pick) => pick.room_code === room.code);
        return {
          roomCode: room.code,
          teacherCode: teacherCodes.get(room.code) || null,
          schoolName: room.school,
          className: room.class_name,
          createdAt: room.created_at || null,
          playerCount: roomPlayers.length,
          pickCount: roomPicks.length,
          lastActivity: latestDate(
            room.created_at,
            ...roomPlayers.map((player) => player.created_at),
            ...roomPicks.map((pick) => pick.updated_at),
          ),
        };
      });

    const response = jsonResponse(200, {
      totalRooms: rooms.length,
      totalPlayers: players.length,
      totalPicks: picks.length,
      rooms,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return jsonResponse(500, { error: error.message });
  }
}

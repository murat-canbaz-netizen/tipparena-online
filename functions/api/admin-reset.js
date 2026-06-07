import { jsonResponse, supabase } from "../lib/shared.js";

async function deleteAll(env, table, identityColumn) {
  const rows = await supabase(env, `${table}?${identityColumn}=not.is.null&select=${identityColumn}`, {
    method: "DELETE",
    headers: { Prefer: "return=representation" },
  });
  return Array.isArray(rows) ? rows.length : 0;
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
  if (String(body.confirmation || "") !== "RESET") {
    return jsonResponse(400, { error: "Zur Bestätigung muss RESET eingegeben werden." });
  }

  try {
    const deletedPicks = await deleteAll(env, "picks", "match_id");
    const deletedPlayers = await deleteAll(env, "players", "id");
    const deletedRooms = await deleteAll(env, "rooms", "code");
    const response = jsonResponse(200, {
      success: true,
      deletedRooms,
      deletedPlayers,
      deletedPicks,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return jsonResponse(500, { error: error.message });
  }
}

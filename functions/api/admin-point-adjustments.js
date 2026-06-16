import { jsonResponse, supabase } from "../lib/shared.js";
import { refreshLeaderboardSnapshotsForPickChange } from "../lib/leaderboard.js";

function noStoreJson(status, body) {
  const response = jsonResponse(status, body);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

function cleanPoints(value) {
  const points = Number(value);
  return Number.isInteger(points) && points >= -50 && points <= 50 ? points : null;
}

function cleanReason(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 160);
}

function tableMissing(error) {
  return String(error?.message || "").includes("point_adjustments");
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") return noStoreJson(405, { error: "Methode nicht erlaubt." });

  const body = await request.json().catch(() => ({}));
  const adminKey = String(env.ADMIN_DASHBOARD_KEY || "");
  const submittedKey = String(body.adminCode || "");
  const action = String(body.action || "save");
  const roomCode = String(body.roomCode || "").trim().toUpperCase();
  const playerId = String(body.playerId || "").trim();

  if (!adminKey) return noStoreJson(503, { error: "Der private Adminbereich ist noch nicht konfiguriert." });
  if (!submittedKey || submittedKey !== adminKey) return noStoreJson(401, { error: "Admin-Code ist nicht korrekt." });
  if (!roomCode || !playerId) return noStoreJson(400, { error: "Raum oder Spieler fehlt." });

  try {
    const encodedRoom = encodeURIComponent(roomCode);
    const encodedPlayer = encodeURIComponent(playerId);
    const player = await supabase(
      env,
      `players?id=eq.${encodedPlayer}&room_code=eq.${encodedRoom}&select=id,nickname&limit=1`,
    );
    if (!player.length) return noStoreJson(404, { error: "Dieser Spieler wurde in dem Raum nicht gefunden." });

    if (action === "list") {
      const adjustments = await supabase(
        env,
        `point_adjustments?room_code=eq.${encodedRoom}&player_id=eq.${encodedPlayer}&select=id,room_code,player_id,points,reason,created_at,created_by&order=created_at.desc`,
      );
      return noStoreJson(200, { success: true, adjustments });
    }

    if (action === "delete") {
      const adjustmentId = String(body.adjustmentId || "").trim();
      if (!adjustmentId) return noStoreJson(400, { error: "Korrektur fehlt." });
      await supabase(
        env,
        `point_adjustments?id=eq.${encodeURIComponent(adjustmentId)}&room_code=eq.${encodedRoom}&player_id=eq.${encodedPlayer}`,
        {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
        },
      );
      await refreshLeaderboardSnapshotsForPickChange(env);
      return noStoreJson(200, { success: true, deleted: true });
    }

    const points = cleanPoints(body.points);
    const reason = cleanReason(body.reason);
    if (points === null || points === 0) return noStoreJson(400, { error: "Bitte eine Korrektur zwischen -50 und +50 eingeben, aber nicht 0." });
    if (!reason) return noStoreJson(400, { error: "Bitte einen Grund für die Korrektur eingeben." });

    const rows = await supabase(env, "point_adjustments", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        room_code: roomCode,
        player_id: playerId,
        points,
        reason,
        created_by: "admin",
      }),
    });
    await refreshLeaderboardSnapshotsForPickChange(env);
    return noStoreJson(200, { success: true, adjustment: rows[0] });
  } catch (error) {
    if (tableMissing(error)) {
      return noStoreJson(503, {
        error: "Die Tabelle point_adjustments fehlt noch. Bitte zuerst supabase-point-adjustments.sql in Supabase ausführen.",
      });
    }
    return noStoreJson(500, { error: error.message });
  }
}

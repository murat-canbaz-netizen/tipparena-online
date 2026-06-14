import { jsonResponse, supabase } from "../lib/shared.js";
import { matchCatalog } from "../lib/matches.js";

function latestDate(...values) {
  return values
    .filter(Boolean)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] || null;
}

function scorePick(pick, result) {
  if (!pick || !result) return 0;
  const [homePick, awayPick] = pick;
  const [homeResult, awayResult] = result;
  const pickDiff = homePick - awayPick;
  const resultDiff = homeResult - awayResult;
  if (homePick === homeResult && awayPick === awayResult) return 3;
  if (resultDiff === 0) return pickDiff === 0 ? 1 : 0;
  if (pickDiff === resultDiff) return 2;
  if (Math.sign(pickDiff) === Math.sign(resultDiff)) return 1;
  return 0;
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
    const [roomRows, players, picks, manualResults] = await Promise.all([
      supabase(env, "rooms?select=code,school,class_name,student_count,created_at&order=created_at.desc"),
      supabase(env, "players?select=id,room_code,nickname,avatar,created_at"),
      supabase(env, "picks?select=room_code,player_id,match_id,home_score,away_score,updated_at"),
      supabase(env, "manual_results?select=match_id,home_score,away_score,status"),
    ]);
    const resultsByMatch = new Map(
      manualResults
        .filter((result) => result.status !== "open")
        .map((result) => [result.match_id, [Number(result.home_score), Number(result.away_score)]]),
    );

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
        const now = Date.now();
        return {
          roomCode: room.code,
          teacherCode: teacherCodes.get(room.code) || null,
          schoolName: room.school,
          className: room.class_name,
          createdAt: room.created_at || null,
          playerCount: roomPlayers.length,
          playerLimit: Number(room.student_count || 0),
          pickCount: roomPicks.length,
          players: roomPlayers
            .map((player) => {
              const playerPicks = roomPicks.filter((pick) => pick.player_id === player.id);
              const pickedMatchIds = new Set(playerPicks.map((pick) => pick.match_id));
              const missingPicks = matchCatalog
                .filter((match) => !pickedMatchIds.has(match.id))
                .map((match) => ({
                  ...match,
                  closed: now >= Date.parse(match.kickoff),
                }));
              return {
                id: player.id,
                nickname: player.nickname,
                avatar: player.avatar,
                pickCount: playerPicks.length,
                totalMatchCount: matchCatalog.length,
                missingOpenCount: missingPicks.filter((match) => !match.closed).length,
                missingClosedCount: missingPicks.filter((match) => match.closed).length,
                missingPicks,
                points: playerPicks.reduce(
                  (sum, pick) => sum + scorePick(
                    [Number(pick.home_score), Number(pick.away_score)],
                    resultsByMatch.get(pick.match_id),
                  ),
                  0,
                ),
              };
            })
            .sort((left, right) => left.nickname.localeCompare(right.nickname, "de")),
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

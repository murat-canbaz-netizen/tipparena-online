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

function normalizeNickname(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function nicknameKey(value) {
  return normalizeNickname(value).toLocaleLowerCase("de-DE");
}

function nicknameSimilarityKey(value) {
  return nicknameKey(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

async function loadPointAdjustments(env) {
  try {
    return await supabase(env, "point_adjustments?select=id,room_code,player_id,points,reason,created_at,created_by");
  } catch (error) {
    if (String(error.message || "").includes("point_adjustments")) return [];
    throw error;
  }
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
    const [roomRows, players, picks, manualResults, pointAdjustments] = await Promise.all([
      supabase(env, "rooms?select=code,school,class_name,student_count,created_at&order=created_at.desc"),
      supabase(env, "players?select=id,room_code,nickname,avatar,created_at"),
      supabase(env, "picks?select=room_code,player_id,match_id,home_score,away_score,updated_at"),
      supabase(env, "manual_results?select=match_id,home_score,away_score,status"),
      loadPointAdjustments(env),
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
        const roomPicksByPlayer = roomPicks.reduce((map, pick) => {
          map[pick.player_id] = map[pick.player_id] || [];
          map[pick.player_id].push(pick);
          return map;
        }, {});
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
              const playerPicks = roomPicksByPlayer[player.id] || [];
              const playerAdjustments = pointAdjustments
                .filter((entry) => entry.room_code === room.code && entry.player_id === player.id)
                .map((entry) => ({
                  id: entry.id,
                  points: Number(entry.points || 0),
                  reason: entry.reason || "",
                  createdAt: entry.created_at || null,
                  createdBy: entry.created_by || null,
                }))
                .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
              const adjustmentPoints = playerAdjustments.reduce((sum, entry) => sum + entry.points, 0);
              const pickedMatchIds = new Set(playerPicks.map((pick) => pick.match_id));
              const pickDetails = playerPicks
                .map((pick) => {
                  const match = matchCatalog.find((entry) => entry.id === pick.match_id);
                  const result = resultsByMatch.get(pick.match_id);
                  const tip = [Number(pick.home_score), Number(pick.away_score)];
                  return {
                    matchId: pick.match_id,
                    group: match?.group || "",
                    home: match?.home || "",
                    away: match?.away || "",
                    homeScore: tip[0],
                    awayScore: tip[1],
                    result: result ? { homeScore: result[0], awayScore: result[1] } : null,
                    points: scorePick(tip, result),
                    source: "picks",
                    updatedAt: pick.updated_at || null,
                  };
                })
                .sort((left, right) => left.matchId.localeCompare(right.matchId));
              const lastPickAt = latestDate(...playerPicks.map((pick) => pick.updated_at));
              const missingPicks = matchCatalog
                .filter((match) => !pickedMatchIds.has(match.id))
                .map((match) => ({
                  ...match,
                  closed: now >= Date.parse(match.kickoff),
                }));
              const tipPoints = playerPicks.reduce(
                (sum, pick) => sum + scorePick(
                  [Number(pick.home_score), Number(pick.away_score)],
                  resultsByMatch.get(pick.match_id),
                ),
                0,
              );
              const valuedPickCount = pickDetails.filter((pick) => pick.result).length;
              const normalized = nicknameKey(player.nickname);
              const similar = nicknameSimilarityKey(player.nickname);
              const duplicateProfiles = roomPlayers
                .filter((candidate) => candidate.id !== player.id && (
                  nicknameKey(candidate.nickname) === normalized || nicknameSimilarityKey(candidate.nickname) === similar
                ))
                .map((candidate) => {
                  const candidatePicks = roomPicksByPlayer[candidate.id] || [];
                  const candidateAdjustments = pointAdjustments
                    .filter((entry) => entry.room_code === room.code && entry.player_id === candidate.id)
                    .reduce((sum, entry) => sum + Number(entry.points || 0), 0);
                  const candidateTipPoints = candidatePicks.reduce(
                    (sum, pick) => sum + scorePick(
                      [Number(pick.home_score), Number(pick.away_score)],
                      resultsByMatch.get(pick.match_id),
                    ),
                    0,
                  );
                  return {
                    id: candidate.id,
                    nickname: candidate.nickname,
                    normalizedNickname: nicknameKey(candidate.nickname),
                    avatar: candidate.avatar,
                    createdAt: candidate.created_at || null,
                    pickCount: candidatePicks.length,
                    valuedPickCount: candidatePicks.filter((pick) => resultsByMatch.has(pick.match_id)).length,
                    tipPoints: candidateTipPoints,
                    adjustmentPoints: candidateAdjustments,
                    totalPoints: candidateTipPoints + candidateAdjustments,
                    lastPickAt: latestDate(...candidatePicks.map((pick) => pick.updated_at)),
                  };
                })
                .sort((left, right) => Number(right.pickCount || 0) - Number(left.pickCount || 0));
              return {
                id: player.id,
                nickname: player.nickname,
                normalizedNickname: normalized,
                similarNicknameKey: similar,
                avatar: player.avatar,
                pickCount: playerPicks.length,
                valuedPickCount,
                lastPickAt,
                duplicateProfiles,
                pickDetails,
                tipPoints,
                adjustmentPoints,
                totalPoints: tipPoints + adjustmentPoints,
                pointAdjustments: playerAdjustments,
                totalMatchCount: matchCatalog.length,
                missingOpenCount: missingPicks.filter((match) => !match.closed).length,
                missingClosedCount: missingPicks.filter((match) => match.closed).length,
                missingPicks,
                points: tipPoints + adjustmentPoints,
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

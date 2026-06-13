import { supabase } from "./shared.js";
import { matchCatalog } from "./matches.js";

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

function normalizedTeam(name) {
  const aliases = {
    "argentina": "argentinien",
    "algeria": "algerien",
    "australia": "australien",
    "austria": "osterreich",
    "belgium": "belgien",
    "bosnia-herzegovina": "bosnien-herzeg",
    "bosnia-and-herzegovina": "bosnien-herzeg",
    "brazil": "brasilien",
    "canada": "kanada",
    "cape-verde": "kap-verde",
    "colombia": "kolumbien",
    "cote-d-ivoire": "elfenbeink",
    "cote-divoire": "elfenbeink",
    "croatia": "kroatien",
    "czechia": "tschechien",
    "czech-republic": "tschechien",
    "dr-congo": "dr-kongo",
    "egypt": "agypten",
    "france": "frankreich",
    "germany": "deutschland",
    "ivory-coast": "elfenbeink",
    "iraq": "irak",
    "jordan": "jordanien",
    "korea-republic": "sudkorea",
    "mexico": "mexiko",
    "morocco": "marokko",
    "netherlands": "niederlande",
    "new-zealand": "neuseeland",
    "norway": "norwegen",
    "qatar": "katar",
    "saudi-arabia": "saudi-arabien",
    "scotland": "schottland",
    "south-korea": "sudkorea",
    "south-africa": "sudafrika",
    "spain": "spanien",
    "sweden": "schweden",
    "switzerland": "schweiz",
    "tunisia": "tunesien",
    "turkey": "turkei",
    "turkiye": "turkei",
    "united-states": "usa",
    "uzbekistan": "usbekistan",
  };
  const normalized = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return aliases[normalized] || normalized;
}

function fixtureMatchId(fixture) {
  if (fixture.matchId) return String(fixture.matchId).trim().toLowerCase();
  return matchCatalog.find(
    (match) =>
      normalizedTeam(match.home) === normalizedTeam(fixture.home?.name) &&
      normalizedTeam(match.away) === normalizedTeam(fixture.away?.name),
  )?.id || null;
}

function fixtureResult(fixture) {
  if (fixture.status === "open") return null;
  const home = Number(fixture.goals?.home);
  const away = Number(fixture.goals?.away);
  return Number.isFinite(home) && Number.isFinite(away) ? [home, away] : null;
}

export function resultMapFromFixtures(fixtures = []) {
  const results = new Map();
  fixtures.forEach((fixture) => {
    const matchId = fixtureMatchId(fixture);
    if (!matchId) return;
    const result = fixtureResult(fixture);
    if (result) results.set(matchId, result);
    else results.delete(matchId);
  });
  return results;
}

function resultFingerprint(results) {
  return JSON.stringify([...results.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function manualResultFingerprint(results) {
  return `manual:${JSON.stringify(
    results
      .map((entry) => ({
        matchId: entry.match_id,
        homeScore: Number(entry.home_score),
        awayScore: Number(entry.away_score),
        status: entry.status === "open" ? "open" : "scored",
      }))
      .sort((left, right) => left.matchId.localeCompare(right.matchId)),
  )}`;
}

function manualResultMap(results) {
  return new Map(
    results
      .filter((entry) => entry.status !== "open")
      .map((entry) => [entry.match_id, [Number(entry.home_score), Number(entry.away_score)]]),
  );
}

function rankRoom(players, picks, results, previous = [], preserveUnchangedMovement = false) {
  const previousByPlayer = new Map(previous.map((entry) => [entry.playerId, entry]));
  return players
    .map((player, order) => {
      const scores = {};
      picks
        .filter((pick) => pick.player_id === player.id)
        .forEach((pick) => {
          const result = results.get(pick.match_id);
          if (!result) return;
          scores[pick.match_id] = scorePick(
            [Number(pick.home_score), Number(pick.away_score)],
            result,
          );
        });
      return {
        playerId: player.id,
        nickname: player.nickname,
        points: Object.values(scores).reduce((sum, points) => sum + points, 0),
        scores,
        order,
      };
    })
    .sort((left, right) => right.points - left.points || left.order - right.order)
    .map((player, index) => {
      const previousPlayer = previousByPlayer.get(player.playerId);
      const rank = index + 1;
      const sameScores = JSON.stringify(previousPlayer?.scores || {}) === JSON.stringify(player.scores);
      return {
        playerId: player.playerId,
        nickname: player.nickname,
        rank,
        points: player.points,
        movement: previousPlayer
          ? previousPlayer.rank - rank
            || (preserveUnchangedMovement && sameScores ? Number(previousPlayer.movement || 0) : 0)
          : 0,
        scores: player.scores,
      };
    });
}

async function loadLeaderboardData(env) {
  const [rooms, players, picks, snapshots] = await Promise.all([
    supabase(env, "rooms?class_name=neq.__TEACHER__&select=code"),
    supabase(env, "players?select=id,room_code,nickname,created_at&order=created_at.asc"),
    supabase(env, "picks?select=room_code,player_id,match_id,home_score,away_score"),
    supabase(env, "leaderboard_snapshots?select=room_code,result_fingerprint,snapshot"),
  ]);
  return { rooms, players, picks, snapshots };
}

async function loadRoomsAndSnapshots(env) {
  const [rooms, snapshots] = await Promise.all([
    supabase(env, "rooms?class_name=neq.__TEACHER__&select=code"),
    supabase(env, "leaderboard_snapshots?select=room_code,result_fingerprint,snapshot"),
  ]);
  return { rooms, snapshots };
}

async function saveSnapshots(env, rows) {
  if (!rows.length) return;
  await supabase(env, "leaderboard_snapshots?on_conflict=room_code", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
}

export async function refreshLeaderboardSnapshots(env, fixtures = []) {
  const results = resultMapFromFixtures(fixtures);
  const fingerprint = resultFingerprint(results);
  const existing = await loadRoomsAndSnapshots(env);
  const snapshotByRoom = new Map(existing.snapshots.map((row) => [row.room_code, row]));
  if (existing.rooms.every((room) => snapshotByRoom.get(room.code)?.result_fingerprint === fingerprint)) return;
  const [players, picks] = await Promise.all([
    supabase(env, "players?select=id,room_code,nickname,created_at&order=created_at.asc"),
    supabase(env, "picks?select=room_code,player_id,match_id,home_score,away_score"),
  ]);

  const updatedAt = new Date().toISOString();
  const rows = existing.rooms.map((room) => {
    const previousRow = snapshotByRoom.get(room.code);
    const previous = previousRow?.snapshot || [];
    return {
      room_code: room.code,
      result_fingerprint: fingerprint,
      snapshot: rankRoom(
        players.filter((player) => player.room_code === room.code),
        picks.filter((pick) => pick.room_code === room.code),
        results,
        previous,
        String(previousRow?.result_fingerprint || "").startsWith("manual:"),
      ),
      updated_at: updatedAt,
    };
  });
  await saveSnapshots(env, rows);
}

export async function ensureLeaderboardSnapshotsBeforeManualResult(env) {
  const data = await loadLeaderboardData(env);
  const snapshotByRoom = new Map(data.snapshots.map((row) => [row.room_code, row]));
  const missingRooms = data.rooms.filter((room) => !snapshotByRoom.has(room.code));
  if (!missingRooms.length) return;

  const manualResults = await supabase(
    env,
    "manual_results?select=match_id,home_score,away_score,status,minute&order=match_id.asc",
  );
  const results = manualResultMap(manualResults);
  const updatedAt = new Date().toISOString();
  await saveSnapshots(env, missingRooms.map((room) => ({
    room_code: room.code,
    result_fingerprint: manualResultFingerprint(manualResults),
    snapshot: rankRoom(
      data.players.filter((player) => player.room_code === room.code),
      data.picks.filter((pick) => pick.room_code === room.code),
      results,
    ),
    updated_at: updatedAt,
  })));
}

export async function refreshLeaderboardSnapshotsForManualResult(env) {
  const data = await loadLeaderboardData(env);
  const manualResults = await supabase(
    env,
    "manual_results?select=match_id,home_score,away_score,status,minute&order=match_id.asc",
  );
  const fingerprint = manualResultFingerprint(manualResults);
  const snapshotByRoom = new Map(data.snapshots.map((row) => [row.room_code, row]));
  const updatedAt = new Date().toISOString();
  const rows = data.rooms.flatMap((room) => {
    const previousRow = snapshotByRoom.get(room.code);
    if (previousRow?.result_fingerprint === fingerprint) return [];

    const previous = previousRow?.snapshot || [];
    const previousByPlayer = new Map(previous.map((entry) => [entry.playerId, entry]));
    const players = data.players.filter((player) => player.room_code === room.code);
    const roomPicks = data.picks.filter((pick) => pick.room_code === room.code);
    const current = players
      .map((player, order) => {
        const previousPlayer = previousByPlayer.get(player.id);
        const scores = { ...(previousPlayer?.scores || {}) };
        manualResults.forEach((manualResult) => {
          const pick = roomPicks.find(
            (entry) => entry.player_id === player.id && entry.match_id === manualResult.match_id,
          );
          if (pick && manualResult.status !== "open") {
            scores[manualResult.match_id] = scorePick(
              [Number(pick.home_score), Number(pick.away_score)],
              [Number(manualResult.home_score), Number(manualResult.away_score)],
            );
          } else {
            delete scores[manualResult.match_id];
          }
        });
        return {
          playerId: player.id,
          nickname: player.nickname,
          points: Object.values(scores).reduce((sum, points) => sum + points, 0),
          scores,
          order,
        };
      })
      .sort((left, right) => right.points - left.points || left.order - right.order)
      .map((player, index) => {
        const previousPlayer = previousByPlayer.get(player.playerId);
        const rank = index + 1;
        return {
          playerId: player.playerId,
          nickname: player.nickname,
          rank,
          points: player.points,
          movement: previousPlayer ? previousPlayer.rank - rank : 0,
          scores: player.scores,
        };
      });
    return {
      room_code: room.code,
      result_fingerprint: fingerprint,
      snapshot: current,
      updated_at: updatedAt,
    };
  });
  await saveSnapshots(env, rows);
}

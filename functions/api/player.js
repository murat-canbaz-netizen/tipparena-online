import { cleanString, jsonResponse, supabase } from "../lib/shared.js";

function normalizeNickname(value) {
  return cleanString(value)
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

function pickStatsForPlayers(picks = []) {
  return picks.reduce((stats, pick) => {
    const playerId = pick.player_id;
    if (!playerId) return stats;
    const entry = stats[playerId] || { pickCount: 0, lastPickAt: null };
    entry.pickCount += 1;
    if (pick.updated_at && (!entry.lastPickAt || new Date(pick.updated_at) > new Date(entry.lastPickAt))) {
      entry.lastPickAt = pick.updated_at;
    }
    stats[playerId] = entry;
    return stats;
  }, {});
}

function chooseExistingPlayer(candidates, pickStats) {
  return [...candidates].sort((left, right) => {
    const leftStats = pickStats[left.id] || {};
    const rightStats = pickStats[right.id] || {};
    const pickDelta = Number(rightStats.pickCount || 0) - Number(leftStats.pickCount || 0);
    if (pickDelta) return pickDelta;
    const timeDelta = new Date(rightStats.lastPickAt || 0).getTime() - new Date(leftStats.lastPickAt || 0).getTime();
    if (timeDelta) return timeDelta;
    return new Date(left.created_at || 0).getTime() - new Date(right.created_at || 0).getTime();
  })[0];
}

function playerDiagnostics(players, pickStats, selected, nickname) {
  const submittedKey = nicknameKey(nickname);
  const submittedSimilarityKey = nicknameSimilarityKey(nickname);
  const matchingPlayers = players
    .filter((player) => nicknameKey(player.nickname) === submittedKey || nicknameSimilarityKey(player.nickname) === submittedSimilarityKey)
    .map((player) => ({
      playerId: player.id,
      nickname: player.nickname,
      normalizedNickname: nicknameKey(player.nickname),
      similarNicknameKey: nicknameSimilarityKey(player.nickname),
      avatar: player.avatar,
      createdAt: player.created_at || null,
      pickCount: Number(pickStats[player.id]?.pickCount || 0),
      lastPickAt: pickStats[player.id]?.lastPickAt || null,
      selected: player.id === selected?.id,
    }));
  return {
    submittedNickname: nickname,
    normalizedNickname: submittedKey,
    similarNicknameKey: submittedSimilarityKey,
    matchingPlayerCount: matchingPlayers.length,
    matchingPlayers,
  };
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
    const exactMatches = playersInRoom.filter((player) => nicknameKey(player.nickname) === nicknameKey(nickname));
    const similarMatches = exactMatches.length ? exactMatches : playersInRoom.filter((player) => (
      nicknameSimilarityKey(player.nickname) === nicknameSimilarityKey(nickname)
    ));
    const matchingPicks = similarMatches.length
      ? await supabase(
        env,
        `picks?room_code=eq.${encodeURIComponent(roomCode)}&select=player_id,updated_at`,
      )
      : [];
    const pickStats = pickStatsForPlayers(matchingPicks);
    const existing = similarMatches.length ? chooseExistingPlayer(similarMatches, pickStats) : null;
    if (existing) {
      const diagnostic = playerDiagnostics(playersInRoom, pickStats, existing, nickname);
      console.info("Spieler-Wiederanmeldung", {
        roomCode,
        nicknameNormalized: nicknameKey(nickname),
        playerId: existing.id,
        matchingPlayerCount: diagnostic.matchingPlayerCount,
        existing: true,
      });
      return jsonResponse(200, {
        room,
        player: existing,
        existing: true,
        playerDiagnostic: {
          ...diagnostic,
          selectedBy: exactMatches.length ? "normalized_nickname" : "similar_nickname",
        },
      });
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
    return jsonResponse(200, {
      room,
      player: players[0],
      existing: false,
      playerDiagnostic: playerDiagnostics([...playersInRoom, players[0]], {}, players[0], nickname),
    });
  } catch (error) {
    console.error("Spieler-Anmeldung fehlgeschlagen", { error: error.message });
    return jsonResponse(500, { error: error.message });
  }
}

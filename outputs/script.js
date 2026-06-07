const classState = {
  school: "",
  className: "",
  code: "",
  studentCount: 24,
  joinedName: "",
  playerId: "",
  avatar: "panda",
  activeGroup: "A",
};

const storageKey = "tipparena-session";
const adminRoomsKey = "tipparena-admin-rooms";

const flags = {
  Mexiko: "🇲🇽",
  "Südafrika": "🇿🇦",
  "Südkorea": "🇰🇷",
  Tschechien: "🇨🇿",
  Kanada: "🇨🇦",
  "Bosnien-Herzeg.": "🇧🇦",
  Katar: "🇶🇦",
  Schweiz: "🇨🇭",
  Brasilien: "🇧🇷",
  Marokko: "🇲🇦",
  Haiti: "🇭🇹",
  Schottland: "🏴",
  USA: "🇺🇸",
  Paraguay: "🇵🇾",
  Australien: "🇦🇺",
  "Türkei": "🇹🇷",
  Deutschland: "🇩🇪",
  Curacao: "🇨🇼",
  "Elfenbeink.": "🇨🇮",
  Ecuador: "🇪🇨",
  Niederlande: "🇳🇱",
  Japan: "🇯🇵",
  Schweden: "🇸🇪",
  Tunesien: "🇹🇳",
  Belgien: "🇧🇪",
  "Ägypten": "🇪🇬",
  Iran: "🇮🇷",
  Neuseeland: "🇳🇿",
  Spanien: "🇪🇸",
  "Kap Verde": "🇨🇻",
  "Saudi-Arabien": "🇸🇦",
  Uruguay: "🇺🇾",
  Frankreich: "🇫🇷",
  Senegal: "🇸🇳",
  Irak: "🇮🇶",
  Norwegen: "🇳🇴",
  Argentinien: "🇦🇷",
  Algerien: "🇩🇿",
  "Österreich": "🇦🇹",
  Jordanien: "🇯🇴",
  Portugal: "🇵🇹",
  "DR Kongo": "🇨🇩",
  Usbekistan: "🇺🇿",
  Kolumbien: "🇨🇴",
  England: "🏴",
  Kroatien: "🇭🇷",
  Ghana: "🇬🇭",
  Panama: "🇵🇦",
};

const teamCodes = {
  Mexiko: "MEX",
  "Südafrika": "RSA",
  "Südkorea": "KOR",
  Tschechien: "CZE",
  Kanada: "CAN",
  "Bosnien-Herzeg.": "BIH",
  Katar: "QAT",
  Schweiz: "SUI",
  Brasilien: "BRA",
  Marokko: "MAR",
  Haiti: "HAI",
  Schottland: "SCO",
  USA: "USA",
  Paraguay: "PAR",
  Australien: "AUS",
  "Türkei": "TUR",
  Deutschland: "GER",
  Curacao: "CUW",
  "Elfenbeink.": "CIV",
  Ecuador: "ECU",
  Niederlande: "NED",
  Japan: "JPN",
  Schweden: "SWE",
  Tunesien: "TUN",
  Belgien: "BEL",
  "Ägypten": "EGY",
  Iran: "IRN",
  Neuseeland: "NZL",
  Spanien: "ESP",
  "Kap Verde": "CPV",
  "Saudi-Arabien": "KSA",
  Uruguay: "URU",
  Frankreich: "FRA",
  Senegal: "SEN",
  Irak: "IRQ",
  Norwegen: "NOR",
  Argentinien: "ARG",
  Algerien: "ALG",
  "Österreich": "AUT",
  Jordanien: "JOR",
  Portugal: "POR",
  "DR Kongo": "COD",
  Usbekistan: "UZB",
  Kolumbien: "COL",
  England: "ENG",
  Kroatien: "CRO",
  Ghana: "GHA",
  Panama: "PAN",
};

const flagCodes = {
  Mexiko: "mx",
  "Südafrika": "za",
  "Südkorea": "kr",
  Tschechien: "cz",
  Kanada: "ca",
  "Bosnien-Herzeg.": "ba",
  Katar: "qa",
  Schweiz: "ch",
  Brasilien: "br",
  Marokko: "ma",
  Haiti: "ht",
  Schottland: "gb-sct",
  USA: "us",
  Paraguay: "py",
  Australien: "au",
  "Türkei": "tr",
  Deutschland: "de",
  Curacao: "cw",
  "Elfenbeink.": "ci",
  Ecuador: "ec",
  Niederlande: "nl",
  Japan: "jp",
  Schweden: "se",
  Tunesien: "tn",
  Belgien: "be",
  "Ägypten": "eg",
  Iran: "ir",
  Neuseeland: "nz",
  Spanien: "es",
  "Kap Verde": "cv",
  "Saudi-Arabien": "sa",
  Uruguay: "uy",
  Frankreich: "fr",
  Senegal: "sn",
  Irak: "iq",
  Norwegen: "no",
  Argentinien: "ar",
  Algerien: "dz",
  "Österreich": "at",
  Jordanien: "jo",
  Portugal: "pt",
  "DR Kongo": "cd",
  Usbekistan: "uz",
  Kolumbien: "co",
  England: "gb-eng",
  Kroatien: "hr",
  Ghana: "gh",
  Panama: "pa",
};

const rawMatches = [
  ["A", "11.06.2026", "21:00", "Mexiko", "Südafrika"],
  ["A", "12.06.2026", "04:00", "Südkorea", "Tschechien"],
  ["A", "18.06.2026", "18:00", "Tschechien", "Südafrika"],
  ["A", "19.06.2026", "03:00", "Mexiko", "Südkorea"],
  ["A", "25.06.2026", "03:00", "Tschechien", "Mexiko"],
  ["A", "25.06.2026", "03:00", "Südafrika", "Südkorea"],
  ["B", "12.06.2026", "21:00", "Kanada", "Bosnien-Herzeg."],
  ["B", "13.06.2026", "21:00", "Katar", "Schweiz"],
  ["B", "18.06.2026", "21:00", "Schweiz", "Bosnien-Herzeg."],
  ["B", "19.06.2026", "00:00", "Kanada", "Katar"],
  ["B", "24.06.2026", "21:00", "Schweiz", "Kanada"],
  ["B", "24.06.2026", "21:00", "Bosnien-Herzeg.", "Katar"],
  ["C", "14.06.2026", "00:00", "Brasilien", "Marokko"],
  ["C", "14.06.2026", "03:00", "Haiti", "Schottland"],
  ["C", "20.06.2026", "00:00", "Schottland", "Marokko"],
  ["C", "20.06.2026", "23:00", "Brasilien", "Haiti"],
  ["C", "25.06.2026", "00:00", "Schottland", "Brasilien"],
  ["C", "25.06.2026", "00:00", "Marokko", "Haiti"],
  ["D", "13.06.2026", "03:00", "USA", "Paraguay"],
  ["D", "14.06.2026", "06:00", "Australien", "Türkei"],
  ["D", "19.06.2026", "21:00", "USA", "Australien"],
  ["D", "20.06.2026", "05:00", "Türkei", "Paraguay"],
  ["D", "26.06.2026", "04:00", "Türkei", "USA"],
  ["D", "26.06.2026", "04:00", "Paraguay", "Australien"],
  ["E", "14.06.2026", "19:00", "Deutschland", "Curacao"],
  ["E", "15.06.2026", "01:00", "Elfenbeink.", "Ecuador"],
  ["E", "20.06.2026", "22:00", "Deutschland", "Elfenbeink."],
  ["E", "21.06.2026", "21:00", "Ecuador", "Curacao"],
  ["E", "25.06.2026", "22:00", "Ecuador", "Deutschland"],
  ["E", "25.06.2026", "22:00", "Curacao", "Elfenbeink."],
  ["F", "14.06.2026", "22:00", "Niederlande", "Japan"],
  ["F", "15.06.2026", "04:00", "Schweden", "Tunesien"],
  ["F", "20.06.2026", "19:00", "Niederlande", "Schweden"],
  ["F", "21.06.2026", "06:00", "Tunesien", "Japan"],
  ["F", "26.06.2026", "01:00", "Tunesien", "Niederlande"],
  ["F", "26.06.2026", "01:00", "Japan", "Schweden"],
  ["G", "15.06.2026", "21:00", "Belgien", "Ägypten"],
  ["G", "16.06.2026", "03:00", "Iran", "Neuseeland"],
  ["G", "21.06.2026", "21:00", "Belgien", "Iran"],
  ["G", "22.06.2026", "03:00", "Neuseeland", "Ägypten"],
  ["G", "27.06.2026", "05:00", "Neuseeland", "Belgien"],
  ["G", "27.06.2026", "05:00", "Ägypten", "Iran"],
  ["H", "15.06.2026", "18:00", "Spanien", "Kap Verde"],
  ["H", "16.06.2026", "00:00", "Saudi-Arabien", "Uruguay"],
  ["H", "21.06.2026", "18:00", "Spanien", "Saudi-Arabien"],
  ["H", "22.06.2026", "00:00", "Uruguay", "Kap Verde"],
  ["H", "27.06.2026", "02:00", "Uruguay", "Spanien"],
  ["H", "27.06.2026", "02:00", "Kap Verde", "Saudi-Arabien"],
  ["I", "16.06.2026", "21:00", "Frankreich", "Senegal"],
  ["I", "17.06.2026", "00:00", "Irak", "Norwegen"],
  ["I", "22.06.2026", "23:00", "Frankreich", "Irak"],
  ["I", "23.06.2026", "21:00", "Norwegen", "Senegal"],
  ["I", "26.06.2026", "21:00", "Norwegen", "Frankreich"],
  ["I", "26.06.2026", "21:00", "Senegal", "Irak"],
  ["J", "17.06.2026", "03:00", "Argentinien", "Algerien"],
  ["J", "17.06.2026", "06:00", "Österreich", "Jordanien"],
  ["J", "22.06.2026", "19:00", "Argentinien", "Österreich"],
  ["J", "23.06.2026", "05:00", "Jordanien", "Algerien"],
  ["J", "28.06.2026", "04:00", "Jordanien", "Argentinien"],
  ["J", "28.06.2026", "04:00", "Algerien", "Österreich"],
  ["K", "17.06.2026", "19:00", "Portugal", "DR Kongo"],
  ["K", "18.06.2026", "04:00", "Usbekistan", "Kolumbien"],
  ["K", "23.06.2026", "19:00", "Portugal", "Usbekistan"],
  ["K", "24.06.2026", "03:00", "Kolumbien", "DR Kongo"],
  ["K", "28.06.2026", "01:00", "Kolumbien", "Portugal"],
  ["K", "28.06.2026", "01:00", "DR Kongo", "Usbekistan"],
  ["L", "17.06.2026", "22:00", "England", "Kroatien"],
  ["L", "18.06.2026", "01:00", "Ghana", "Panama"],
  ["L", "23.06.2026", "22:00", "England", "Ghana"],
  ["L", "24.06.2026", "01:00", "Panama", "Kroatien"],
  ["L", "27.06.2026", "23:00", "Panama", "England"],
  ["L", "27.06.2026", "23:00", "Kroatien", "Ghana"],
];

const groupMatchCounter = {};
const matches = rawMatches.map(([group, date, time, home, away]) => {
  groupMatchCounter[group] = (groupMatchCounter[group] || 0) + 1;
  const id = `${group.toLowerCase()}${groupMatchCounter[group]}`;
  const results = {};
  return {
    id,
    group,
    date,
    time,
    home,
    away,
    status: "open",
    minute: "",
    result: results[id] || null,
  };
});

function buildPicks(seed) {
  return Object.fromEntries(
    matches.map((match) => [
      match.id,
      [0, 0],
    ]),
  );
}

const participants = [
  { name: "LenaKick", avatar: "giraffe", movement: 1, picks: buildPicks(1) },
  { name: "TorTiger", avatar: "shark", movement: -1, picks: buildPicks(2) },
  { name: "BallBasti", avatar: "lion", movement: 0, picks: buildPicks(3) },
  { name: "Mila10", avatar: "koala", movement: 1, picks: buildPicks(4) },
  { name: "FinalFynn", avatar: "rhino", movement: -1, picks: buildPicks(5) },
];

const avatarPool = ["panda", "koala", "shark", "lion", "croc", "giraffe", "rhino", "axolotl"];

const demoNames = [
  "NoahGoal",
  "MiaKick",
  "Emil10",
  "LaraFC",
  "BenBall",
  "Sofia11",
  "LeoPower",
  "NinaTor",
  "MaxArena",
  "EllaCup",
  "Tom90",
  "JuleWin",
  "FinnStar",
  "Maja7",
  "LuisPro",
  "AylinKick",
  "PaulTippt",
  "KiraBall",
  "JonasGoal",
  "HannaFC",
  "Oskar11",
  "LeaArena",
  "TimCup",
  "MilaGoal",
  "Anton10",
  "SelinWin",
  "ErikBall",
  "ClaraFC",
  "Moritz7",
  "LinaPro",
];

const userPicks = buildPicks(2);
const remoteState = {
  online: true,
  players: [],
  picksByPlayer: {},
};
const pendingPickTimers = new Map();

const heroJoinForm = document.querySelector("#heroJoinForm");
const teacherLinkForm = document.querySelector("#teacherLinkForm");
const heroJoinMessage = document.querySelector("#heroJoinMessage");
const heroClassPass = document.querySelector("#heroClassPass");
const generatedLink = document.querySelector("#generatedLink");
const teacherOverview = document.querySelector("#teacherOverview");
const className = document.querySelector("#className");
const avatarValue = document.querySelector("#avatarValue");
const avatarPreview = document.querySelector("#avatarPreview");
const arenaStatus = document.querySelector("#arenaStatus");
const groupTabs = document.querySelector("#groupTabs");
const matchList = document.querySelector("#matchList");
const leaderboard = document.querySelector("#leaderboard");
const adminStats = document.querySelector("#adminStats");
const adminRooms = document.querySelector("#adminRooms");
const homeTabs = document.querySelectorAll("[data-home-tab]");
const homePanels = document.querySelectorAll("[data-home-panel]");
const appTabs = document.querySelectorAll("[data-app-tab]");

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function createClassCode(school, classNameValue) {
  const cleanSchool = slugify(school).toUpperCase() || "SCHULE";
  const cleanClass = slugify(classNameValue).toUpperCase() || "KLASSE";
  return `${cleanSchool}-${cleanClass}`;
}

function classRoomUrl(code) {
  return `${window.location.origin}/klasse/${encodeURIComponent(code)}`;
}

function studentCountFromCode(code) {
  const match = String(code || "").match(/-(\d{1,2})$/);
  if (!match) return 24;
  return Math.max(3, Math.min(35, Number(match[1])));
}

function titleFromSlug(value) {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function schoolFromCode(code, classNameValue) {
  const parts = String(code || "").split("-").filter(Boolean);
  if (/^\d{1,2}$/.test(parts.at(-1) || "")) parts.pop();
  const cleanClass = slugify(classNameValue).toUpperCase();
  if (parts.at(-1) === cleanClass) parts.pop();
  return titleFromSlug(parts.join("-")) || "Schule";
}

function setHomeTab(tabName) {
  homeTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.homeTab === tabName);
  });
  homePanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.homePanel === tabName);
  });
}

function selectedAvatarValue() {
  return heroJoinForm.querySelector('input[name="avatar"]:checked')?.value || "panda";
}

function updateAvatarPreview() {
  if (!avatarValue || !avatarPreview) return;
  const value = selectedAvatarValue();
  avatarValue.value = value;
  const selected = heroJoinForm.querySelector('input[name="avatar"]:checked');
  const image = avatarPreview.querySelector("img");
  if (image) image.src = selected?.dataset.avatarSrc || avatarImageSrc(value);
}

function setupAvatarImages() {
  document.querySelectorAll(".image-avatar-grid label").forEach((label) => {
    const image = label.querySelector("img");
    if (!image) return;
    image.addEventListener("load", () => label.classList.add("is-ready"), { once: true });
    image.addEventListener("error", () => {
      label.classList.add("is-missing");
      const input = label.querySelector("input");
      if (input?.checked) {
        const nextInput = document.querySelector(".image-avatar-grid label:not(.is-missing) input");
        if (nextInput) {
          nextInput.checked = true;
          updateAvatarPreview();
        }
      }
    }, { once: true });
    if (image.complete && image.naturalWidth > 0) label.classList.add("is-ready");
  });
}

function avatarImageSrc(value) {
  const name = String(value || "panda").split("|")[0];
  return `${name}.png?v=5`;
}

function avatarMarkup(value) {
  return `
    <span class="player-avatar image-player-avatar">
      <img src="${avatarImageSrc(value)}" alt="" />
    </span>
  `;
}

async function apiRequest(path, options = {}, endpoint = `/.netlify/functions/${path}`) {
  if (!remoteState.online) return null;
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { error: data.error || "Online-Speicherung nicht erreichbar.", status: response.status };
    return data;
  } catch (error) {
    remoteState.online = false;
    console.warn("TippArena speichert lokal, bis die Online-Datenbank verbunden ist.", error);
    return null;
  }
}

function applyRoom(room) {
  if (!room) return;
  classState.code = room.code || classState.code;
  classState.school = room.school || classState.school;
  classState.className = room.class_name || room.className || classState.className;
  classState.studentCount = Number(room.student_count || room.studentCount || classState.studentCount);
}

function remotePicksForPlayer(playerId) {
  const picks = {};
  (remoteState.picksByPlayer[playerId] || []).forEach((pick) => {
    picks[pick.match_id] = [Number(pick.home_score), Number(pick.away_score)];
  });
  return picks;
}

function setRemotePicks(picks = []) {
  remoteState.picksByPlayer = picks.reduce((map, pick) => {
    map[pick.player_id] = map[pick.player_id] || [];
    map[pick.player_id].push(pick);
    return map;
  }, {});
}

async function syncRoom() {
  if (!classState.code) return;
  const data = await apiRequest("room", {}, `/api/room?code=${encodeURIComponent(classState.code)}`);
  if (!data || data.error) return;
  applyRoom(data.room);
  remoteState.players = data.players || [];
  renderAll();
}

async function syncPicks() {
  if (!classState.code) return;
  const data = await apiRequest(`picks?room=${encodeURIComponent(classState.code)}`);
  if (!data || data.error) return;
  remoteState.players = data.players || remoteState.players;
  setRemotePicks(data.picks || []);

  if (classState.playerId) {
    const savedPicks = remotePicksForPlayer(classState.playerId);
    Object.entries(savedPicks).forEach(([matchId, pick]) => {
      userPicks[matchId] = pick;
    });
  }
  renderAll();
}

const resultTeamAliases = {
  "bosnia-and-herzegovina": "bosnien-herzeg",
  "cote-divoire": "elfenbeink",
  "czech-republic": "tschechien",
  "dr-congo": "dr-kongo",
  "ivory-coast": "elfenbeink",
  "korea-republic": "sudkorea",
  "south-korea": "sudkorea",
  "turkiye": "turkei",
};

function normalizedResultTeam(name) {
  const normalized = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return resultTeamAliases[normalized] || normalized;
}

function applyLiveFixture(fixture) {
  const match = matches.find(
    (entry) =>
      normalizedResultTeam(entry.home) === normalizedResultTeam(fixture.home?.name) &&
      normalizedResultTeam(entry.away) === normalizedResultTeam(fixture.away?.name),
  );
  if (!match) return false;

  const finishedStatuses = new Set(["FT", "AET", "PEN"]);
  const liveStatuses = new Set(["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"]);
  const hasScore = Number.isFinite(fixture.goals?.home) && Number.isFinite(fixture.goals?.away);
  match.result = hasScore ? [fixture.goals.home, fixture.goals.away] : null;
  match.status = finishedStatuses.has(fixture.status) ? "done" : liveStatuses.has(fixture.status) ? "live" : "open";
  match.minute = fixture.minute ?? "";
  return true;
}

async function syncResults() {
  try {
    const response = await fetch("/.netlify/functions/results");
    if (!response.ok) return;
    const data = await response.json();
    let changed = false;
    (data.fixtures || []).forEach((fixture) => {
      changed = applyLiveFixture(fixture) || changed;
    });
    if (changed) {
      renderMatches();
      renderLeaderboard();
    }
  } catch {
    // Live results are optional until the server-side integration is configured.
  }
}

async function createRemoteRoom(room) {
  const data = await apiRequest(
    "room",
    {
      method: "POST",
      body: JSON.stringify(room),
    },
    "/api/room",
  );
  if (data?.room) applyRoom(data.room);
  return data;
}

async function createRemotePlayer(nickname, avatar) {
  const data = await apiRequest("player", {
    method: "POST",
    body: JSON.stringify({
      roomCode: classState.code,
      school: classState.school,
      className: classState.className,
      studentCount: classState.studentCount,
      nickname,
      avatar,
      playerId: classState.playerId,
    }),
  });
  if (!data?.player) return data;
  applyRoom(data.room);
  classState.playerId = data.player.id;
  remoteState.players = [
    ...remoteState.players.filter((player) => player.id !== data.player.id),
    data.player,
  ];
  return data.player;
}

function saveRemotePick(matchId) {
  if (!classState.code || !classState.playerId || !remoteState.online) return;
  const match = matches.find((entry) => entry.id === matchId);
  if (!match || isMatchClosed(match)) return;
  clearTimeout(pendingPickTimers.get(matchId));
  pendingPickTimers.set(
    matchId,
    setTimeout(async () => {
      const pick = userPicks[matchId] || [0, 0];
      const data = await apiRequest("picks", {
        method: "POST",
        body: JSON.stringify({
          roomCode: classState.code,
          playerId: classState.playerId,
          matchId,
          homeScore: pick[0],
          awayScore: pick[1],
        }),
      });
      if (data?.picks) {
        await syncPicks();
      }
    }, 350),
  );
}

function showLockedMatchMessage(matchId) {
  const card = matchList.querySelector(`[data-match-card="${matchId}"]`);
  const message = card?.querySelector(".match-lock-message");
  if (!message) return;
  message.classList.add("is-visible");
  setTimeout(() => message.classList.remove("is-visible"), 1800);
}

async function saveAllRemotePicks() {
  if (!classState.code || !classState.playerId || !remoteState.online) return;
  const picks = Object.entries(userPicks).map(([matchId, pick]) => ({
    matchId,
    homeScore: pick[0],
    awayScore: pick[1],
  }));
  await apiRequest("picks", {
    method: "POST",
    body: JSON.stringify({
      roomCode: classState.code,
      playerId: classState.playerId,
      picks,
    }),
  });
  await syncPicks();
}

function activeAppView() {
  if (window.location.hash === "#admin") return "admin";
  return window.location.hash === "#rangliste" ? "rangliste" : "arena";
}

function updateAppView() {
  const view = activeAppView();
  document.body.classList.toggle("view-table", view === "rangliste");
  document.body.classList.toggle("view-admin", view === "admin");
  appTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.appTab === view);
  });
}

function updateClassDisplay() {
  const hasClass = Boolean(classState.code);
  heroJoinForm.classList.toggle("is-locked", !hasClass);
  heroClassPass.textContent = hasClass
    ? "Anmeldung nur mit Klassenlink"
    : "Nur mit Klassenlink";
  className.textContent = hasClass
    ? `${classState.school} - Klasse ${classState.className}`
    : "Noch keine Klasse aktiv";
}

function rememberSession() {
  if (!classState.code || !classState.joinedName) return;
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      code: classState.code,
      className: classState.className,
      school: classState.school,
      nickname: classState.joinedName,
      playerId: classState.playerId,
      avatar: classState.avatar,
    }),
  );
}

function readAdminRooms() {
  return JSON.parse(localStorage.getItem(adminRoomsKey) || "[]");
}

function writeAdminRoom(room) {
  const rooms = readAdminRooms().filter((savedRoom) => savedRoom.code !== room.code);
  rooms.unshift(room);
  localStorage.setItem(adminRoomsKey, JSON.stringify(rooms.slice(0, 20)));
}

function adminRoomFallback() {
  if (!classState.code) return [];
  return [{
    school: classState.school,
    className: classState.className,
    code: classState.code,
    studentCount: classState.studentCount,
    createdAt: new Date().toISOString(),
    url: window.location.href.replace(/#.*$/, ""),
  }];
}

function restoreSession() {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
  if (!saved || saved.code !== classState.code) return;
  classState.school = saved.school || classState.school;
  classState.className = saved.className || classState.className;
  classState.joinedName = saved.nickname || "";
  classState.playerId = saved.playerId || "";
  classState.avatar = saved.avatar || classState.avatar;
}

function statusLabel(match) {
  if (isMatchClosed(match)) return match.result ? "Endstand" : "Tipp geschlossen";
  if (match.status === "live") return `Live ${match.minute || ""}`.trim();
  return "Tipp offen";
}

function resultLabel(match) {
  if (!match.result) return "- : -";
  return `${match.result[0]} : ${match.result[1]}`;
}

function matchStartTime(match) {
  const [day, month, year] = match.date.split(".").map(Number);
  const [hour, minute] = match.time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime();
}

function isMatchClosed(match) {
  if (match.status === "done") return true;
  return Date.now() >= matchStartTime(match);
}

function countdownContent(startTime) {
  const diff = Math.max(0, startTime - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  const units = [
    ["Tage", days],
    ["Std.", hours],
    ["Min.", minutes],
    ["Sek.", seconds],
  ];

  return `
    <span>Spiel beginnt in:</span>
    <div>
      ${units.map(([label, value]) => `<b>${String(value).padStart(2, "0")}<small>${label}</small></b>`).join("")}
    </div>
  `;
}

function countdownMarkup(match) {
  const startTime = matchStartTime(match);
  return `<div class="match-countdown" data-start="${startTime}">${countdownContent(startTime)}</div>`;
}

function updateCountdowns() {
  document.querySelectorAll(".match-countdown[data-start]").forEach((countdown) => {
    countdown.innerHTML = countdownContent(Number(countdown.dataset.start));
  });
}

function scorePick(pick, result) {
  if (!pick || !result) return 0;
  const [homePick, awayPick] = pick;
  const [homeResult, awayResult] = result;
  const pickDiff = homePick - awayPick;
  const resultDiff = homeResult - awayResult;
  if (homePick === homeResult && awayPick === awayResult) return 3;
  if (pickDiff === resultDiff) return 2;
  if (Math.sign(pickDiff) === Math.sign(resultDiff)) return 1;
  return 0;
}

function totalPoints(picks) {
  return matches.reduce((sum, match) => sum + scorePick(picks[match.id], match.result), 0);
}

function flagMarkup(name, withCode = true) {
  const code = flagCodes[name];
  const image = code
    ? `<img src="https://flagcdn.com/w80/${code}.png" alt="Flagge ${name}" />`
    : `<span>${flags[name] || "🏳"}</span>`;
  return `
    ${image}
    ${withCode ? `<small>${teamCodes[name] || name.slice(0, 3).toUpperCase()}</small>` : ""}
  `;
}

function teamMarkup(name, side) {
  return `
    <div class="team ${side}">
      <span class="flag" aria-label="Flagge ${name}">
        ${flagMarkup(name)}
      </span>
      <strong>${name}</strong>
    </div>
  `;
}

function renderGroupTabs() {
  const groups = [...new Set(matches.map((match) => match.group))];
  groupTabs.innerHTML = groups
    .map(
      (group) => `
        <button class="${group === classState.activeGroup ? "is-active" : ""}" type="button" data-group="${group}">
          Gruppe ${group}
        </button>
      `,
    )
    .join("");
}

function renderMatches() {
  const group = classState.activeGroup;
  const groupMatches = matches.filter((match) => match.group === group);
  const groupFlags = [...new Set(groupMatches.flatMap((match) => [match.home, match.away]))]
    .map((team) => `<span class="flag mini">${flagMarkup(team, false)}</span>`)
    .join("");

  matchList.innerHTML = `
    <section class="group-card" id="group-${group}">
      <header class="group-card-header">
        <div>
          <span>Gruppe ${group}</span>
          <div class="group-flags">${groupFlags}</div>
        </div>
      </header>
      <div class="group-match-list">
        ${groupMatches.map(renderMatchCard).join("")}
      </div>
    </section>
  `;
  updateCountdowns();
}

function renderMatchCard(match) {
  const pick = userPicks[match.id] || [0, 0];
  const points = scorePick(pick, match.result);
  const locked = isMatchClosed(match);
  const pointClass = match.result ? `points-${points}` : "";
  const bravo = points === 3 && match.result ? `<span class="bravo-badge">Bravo!</span>` : "";
  return `
    <article class="match-card ${match.status} ${locked ? "locked" : ""} ${pointClass}" data-match-card="${match.id}">
      <div class="match-meta">
        <div class="match-kickoff">
          <span>${match.date}</span>
          <strong>${match.time}</strong>
        </div>
        ${countdownMarkup(match)}
        <em>${statusLabel(match)}</em>
      </div>
      <div class="scoreline">
        ${teamMarkup(match.home, "home")}
        <span class="match-score">${resultLabel(match)}</span>
        ${teamMarkup(match.away, "away")}
      </div>
      <div class="pick-line">
        <span>Dein Tipp</span>
        <div class="score-inputs" aria-label="Tipp fuer ${match.home} gegen ${match.away}">
          <button class="score-step" type="button" aria-label="Tipp ${match.home} verringern" data-match="${match.id}" data-side="0" data-step="-1" ${locked ? "disabled" : ""}>−</button>
          <input type="text" inputmode="numeric" pattern="[0-9]*" value="${pick[0]}" aria-label="Tore ${match.home}" data-match="${match.id}" data-side="0" ${locked ? "disabled" : ""} />
          <button class="score-step" type="button" aria-label="Tipp ${match.home} erhöhen" data-match="${match.id}" data-side="0" data-step="1" ${locked ? "disabled" : ""}>+</button>
          <b>:</b>
          <button class="score-step" type="button" aria-label="Tipp ${match.away} verringern" data-match="${match.id}" data-side="1" data-step="-1" ${locked ? "disabled" : ""}>−</button>
          <input type="text" inputmode="numeric" pattern="[0-9]*" value="${pick[1]}" aria-label="Tore ${match.away}" data-match="${match.id}" data-side="1" ${locked ? "disabled" : ""} />
          <button class="score-step" type="button" aria-label="Tipp ${match.away} erhöhen" data-match="${match.id}" data-side="1" data-step="1" ${locked ? "disabled" : ""}>+</button>
        </div>
        <strong>${points} Pkt.</strong>
        ${bravo}
      </div>
      ${locked ? `<p class="match-lock-message">Dieses Spiel kann nicht mehr getippt werden.</p>` : ""}
    </article>
  `;
}

function movementMarkup(movement, rank, totalRanks) {
  let visibleMovement = movement;
  if (rank === 1 && visibleMovement < 0) visibleMovement = 0;
  if (rank === totalRanks && visibleMovement > 0) visibleMovement = 0;

  if (visibleMovement > 0) return `<span class="move up">↑ +${visibleMovement}</span>`;
  if (visibleMovement < 0) return `<span class="move down">↓ ${visibleMovement}</span>`;
  return `<span class="move same">→ 0</span>`;
}

function exactStreak(picks) {
  let current = 0;
  let best = 0;
  matches.forEach((match) => {
    if (!match.result) return;
    if (scorePick(picks[match.id], match.result) === 3) {
      current += 1;
      best = Math.max(best, current);
      return;
    }
    current = 0;
  });
  return best;
}

function winnerHits(picks) {
  return matches.filter((match) => match.result && scorePick(picks[match.id], match.result) > 0).length;
}

function playerStory(player, rank, ranked) {
  const streak = exactStreak(player.picks);
  const hits = winnerHits(player.picks);
  const podiumGap = Math.max(0, (ranked[2]?.points || 0) - player.points + 1);
  if (rank === 1) return "Tabellenboss: Alle jagen diesen Platz.";
  if (streak >= 3) return `${streak} perfekte Tipps hintereinander.`;
  if (streak === 2) return "Doppel-Treffer: zweimal exakt richtig.";
  if (player.movement > 0) return "Aufholjagd läuft: heute nach oben geklettert.";
  if (hits >= 3) return `${hits} Spiele richtig gelesen.`;
  if (podiumGap > 0) return `Noch ${podiumGap} Punkte bis zum Podium.`;
  return "Ein perfekter Tipp kann alles drehen.";
}

function renderLeaderboard() {
  const hasCurrentPlayer = Boolean(classState.joinedName);
  const hasClassRoom = Boolean(classState.code);
  const remoteRows = remoteState.players.map((player) => ({
    name: player.nickname,
    avatar: player.avatar,
    picks: player.id === classState.playerId || player.nickname === classState.joinedName ? userPicks : remotePicksForPlayer(player.id),
    movement: 0,
    current: player.id === classState.playerId || player.nickname === classState.joinedName,
  }));
  const hasRemoteRows = remoteRows.length > 0;
  const rows = hasClassRoom
    ? [...remoteRows]
    : participants.slice(0, Math.max(0, classState.studentCount - (hasCurrentPlayer ? 1 : 0)));

  if (hasCurrentPlayer && !rows.some((player) => player.current || player.name === classState.joinedName)) {
    rows.push({ name: classState.joinedName, avatar: classState.avatar, picks: userPicks, movement: 0, current: true });
  }

  let seed = 6;
  while (!hasClassRoom && rows.length < classState.studentCount) {
    const name = demoNames[(rows.length - participants.length) % demoNames.length];
    rows.push({
      name,
      avatar: avatarPool[rows.length % avatarPool.length],
      movement: (rows.length % 3) - 1,
      picks: buildPicks(seed),
    });
    seed += 1;
  }

  const ranked = rows
    .map((player) => ({ ...player, points: totalPoints(player.picks) }))
    .sort((a, b) => {
      if (a.empty && !b.empty) return 1;
      if (!a.empty && b.empty) return -1;
      return b.points - a.points;
    });

  if (!ranked.length) {
    leaderboard.innerHTML = `
      <div class="leaderboard-empty">
        <strong>Noch niemand in der Tabelle</strong>
        <span>Sobald sich ein Kind mit Spitznamen einloggt, erscheint es hier.</span>
      </div>
    `;
    return;
  }

  const podium = ranked.slice(0, 3);
  const currentRank = ranked.findIndex((player) => player.current) + 1;
  const currentPlayer = ranked[currentRank - 1];
  const topPlayer = ranked[0];
  const hottestPlayer = ranked
    .map((player) => ({ ...player, streak: exactStreak(player.picks) }))
    .sort((a, b) => b.streak - a.streak || b.points - a.points)[0];
  const pointsToTop = currentPlayer ? Math.max(0, topPlayer.points - currentPlayer.points) : 0;

  leaderboard.innerHTML = `
    <div class="leaderboard-hype" aria-label="Tabellen-Statistiken">
      <article>
        <span>Dein Ziel</span>
        <strong>${currentRank ? `Platz ${currentRank}` : "Noch einsteigen"}</strong>
        <small>${currentPlayer ? `${pointsToTop} Punkte bis Platz 1` : "Mit Spitznamen starten"}</small>
      </article>
      <article>
        <span>Heißeste Serie</span>
        <strong>${hottestPlayer.streak || 1}x exakt</strong>
        <small>${hottestPlayer.name} ist gerade im Flow</small>
      </article>
      <article>
        <span>Challenge</span>
        <strong>3er-Serie</strong>
        <small>Schaffst du drei perfekte Tipps nacheinander?</small>
      </article>
    </div>
    <div class="leaderboard-podium" aria-label="Podium">
      ${podium
        .map(
          (player, index) => `
            <article class="podium-card podium-${index + 1}">
              <span class="podium-rank">${index === 0 ? "Champion" : `Platz ${index + 1}`}</span>
              <strong>${player.avatar ? avatarMarkup(player.avatar) : ""}${player.name}</strong>
              <b>${player.points} Punkte</b>
              <small>${playerStory(player, index + 1, ranked)}</small>
            </article>
          `,
        )
        .join("")}
    </div>
    <div class="leaderboard-table">
      ${ranked
    .map(
      (player, index) => `
        <article class="leader-row rank-${index + 1} ${player.current ? "current-player" : ""}">
          <span class="rank">Platz ${index + 1}</span>
          <div class="leader-player">
            <strong>${player.avatar ? avatarMarkup(player.avatar) : ""}${player.name}</strong>
            <small>${playerStory(player, index + 1, ranked)}</small>
          </div>
          ${movementMarkup(player.movement, index + 1, ranked.length)}
          <span class="leader-points">${player.points} Punkte</span>
        </article>
      `,
    )
    .join("")}
    </div>
  `;
}

function renderAdminDashboard() {
  if (!adminStats || !adminRooms) return;
  const rooms = readAdminRooms();
  const visibleRooms = rooms.length ? rooms : adminRoomFallback();
  const totalStudents = visibleRooms.reduce((sum, room) => sum + Number(room.studentCount || 0), 0);
  const activeRooms = visibleRooms.length;
  const joined = visibleRooms.reduce(
    (sum, room, index) => sum + Math.min(Number(room.studentCount || 0), Math.max(3, Number(room.joinedCount || 0) || 8 + index * 3)),
    0,
  );

  adminStats.innerHTML = `
    <article><span>Klassenlinks</span><strong>${activeRooms}</strong><small>generiert</small></article>
    <article><span>Schülerzahl</span><strong>${totalStudents}</strong><small>geplante Plätze</small></article>
    <article><span>Im Raum</span><strong>${joined}</strong><small>Demo-Live-Stand</small></article>
  `;

  adminRooms.innerHTML = visibleRooms
    .map((room, index) => {
      const joinedCount = Math.min(Number(room.studentCount || 0), Math.max(3, Number(room.joinedCount || 0) || 8 + index * 3));
      return `
        <article class="admin-room">
          <div>
            <span>${room.school}</span>
            <strong>Klasse ${room.className}</strong>
            <small>${room.code}</small>
          </div>
          <div class="room-meter" style="--room-fill:${Math.round((joinedCount / Number(room.studentCount || 1)) * 100)}%">
            <span>${joinedCount}/${room.studentCount}</span>
            <b></b>
          </div>
          <a href="${room.url}#arena">Klassenraum öffnen</a>
        </article>
      `;
    })
    .join("");
}

function renderAll() {
  document.body.classList.toggle("is-authenticated", Boolean(classState.joinedName));
  document.body.classList.toggle("is-admin", new URLSearchParams(window.location.search).has("admin"));
  updateAppView();
  updateClassDisplay();
  renderGroupTabs();
  renderMatches();
  renderLeaderboard();
  renderAdminDashboard();
  if (arenaStatus) {
    arenaStatus.innerHTML = classState.joinedName
      ? `${avatarMarkup(classState.avatar)}<span>${classState.joinedName}</span>`
      : "Live-Sync aktiv";
  }
}

async function joinArena(nickname, avatar, messageTarget) {
  if (!classState.code) {
    messageTarget.textContent = "Bitte den Klassenlink der Lehrkraft benutzen.";
    messageTarget.style.color = "#d95c4f";
    return;
  }
  if (!nickname) {
    messageTarget.textContent = "Bitte waehle zuerst einen Spitznamen.";
    messageTarget.style.color = "#d95c4f";
    return;
  }
  messageTarget.textContent = "Wird gespeichert...";
  messageTarget.style.color = "#b8ff4d";
  const selectedAvatar = avatar || classState.avatar;
  const player = await createRemotePlayer(nickname, selectedAvatar);
  if (!player || player.error) {
    messageTarget.textContent = player?.error || "Der Klassenraum ist gerade nicht erreichbar.";
    messageTarget.style.color = "#ff8278";
    return;
  }
  classState.joinedName = nickname;
  classState.avatar = selectedAvatar;
  rememberSession();
  messageTarget.textContent = `${nickname} ist drin.`;
  messageTarget.style.color = "#b8ff4d";
  renderAll();
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}#arena`);
  updateAppView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

heroJoinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(heroJoinForm);
  const classLink = String(formData.get("classLink") || "").trim();
  if (classLink && !(await applyClassLink(classLink, heroJoinMessage))) {
    return;
  }
  const nickname = String(formData.get("nickname")).trim();
  const avatar = String(formData.get("avatar") || "panda");
  await joinArena(nickname, avatar, heroJoinMessage);
});

async function applyClassLink(classLink, messageTarget) {
  try {
    const raw = String(classLink || "").trim();
    let code = raw.toUpperCase();
    if (raw.includes("/") || raw.includes("?")) {
      const url = new URL(raw, window.location.origin);
      const pathMatch = url.pathname.match(/\/klasse\/([^/]+)/i);
      code = decodeURIComponent(pathMatch?.[1] || url.searchParams.get("code") || "").toUpperCase();
    }
    if (!code) {
      messageTarget.textContent = "Bitte einen Klassencode oder Klassenlink eingeben.";
      messageTarget.style.color = "#d95c4f";
      return false;
    }
    classState.code = code;
    const data = await apiRequest("room", {}, `/api/room?code=${encodeURIComponent(code)}`);
    if (!data?.room) {
      messageTarget.textContent = data?.error || "Dieser Klassencode wurde nicht gefunden.";
      messageTarget.style.color = "#d95c4f";
      classState.code = "";
      return false;
    }
    applyRoom(data.room);
    remoteState.players = data.players || [];
    history.replaceState(null, "", `/klasse/${encodeURIComponent(code)}`);
    renderAll();
    return true;
  } catch {
    messageTarget.textContent = "Bitte einen gültigen Klassenlink einfügen.";
    messageTarget.style.color = "#d95c4f";
    return false;
  }
}

teacherLinkForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(teacherLinkForm);
  const school = String(formData.get("school")).trim();
  const classValue = String(formData.get("className")).trim();
  const studentCount = String(formData.get("studentCount")).trim();
  const room = {
    school,
    className: classValue,
    studentCount: Number(studentCount),
  };
  generatedLink.innerHTML = `<p class="teacher-feedback">Klassenraum wird erstellt...</p>`;
  const data = await createRemoteRoom(room);
  if (!data?.room) {
    generatedLink.innerHTML = `<p class="teacher-feedback is-error">${data?.error || "Klassenraum konnte nicht erstellt werden."}</p>`;
    return;
  }
  writeAdminRoom({ ...room, code: data.room.code, createdAt: data.room.created_at });
  renderAdminDashboard();
  renderTeacherOverview(data.room, [], [], generatedLink);
});

function renderTeacherOverview(room, players = [], picks = [], target = teacherOverview) {
  const url = classRoomUrl(room.code);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(url)}`;
  const pickCounts = picks.reduce((map, pick) => {
    map[pick.player_id] = (map[pick.player_id] || 0) + 1;
    return map;
  }, {});
  target.innerHTML = `
    <section class="teacher-room-card">
      <div class="teacher-room-head"><span>Dein Klassenraum</span><h3>${room.school} - ${room.class_name}</h3></div>
      <div class="teacher-code-grid">
        <div><small>Klassencode</small><strong>${room.code}</strong></div>
        <div><small>Lehrer-Code</small><strong>${room.teacher_code}</strong></div>
      </div>
      <label>Klassenlink<input readonly value="${url}" /></label>
      <div class="teacher-action-grid">
        <button class="button secondary copy-link-button" type="button">Link kopieren</button>
        <button class="button secondary toggle-qr-button" type="button">QR-Code anzeigen</button>
        <button class="button secondary print-qr-button" type="button">QR-Code ausdrucken</button>
        <a class="button primary" href="${url}#arena">Tippbereich öffnen</a>
      </div>
      <div class="qr-card is-hidden"><img src="${qrUrl}" alt="QR-Code für die Klasse" /><b>QR-Code für die Klasse</b></div>
      ${players.length ? `<div class="teacher-students"><h4>Schülerliste</h4>${players.map((player) => `<div>${avatarMarkup(player.avatar)}<b>${player.nickname}</b><span>${pickCounts[player.id] || 0} Tipps</span></div>`).join("")}</div>` : ""}
    </section>
  `;
}

async function handleTeacherOverviewClick(event) {
  const button = event.target.closest(".copy-link-button");
  const container = event.currentTarget;
  if (button) {
    const input = container.querySelector("input[readonly]");
    input.select();
    await navigator.clipboard?.writeText(input.value).catch(() => document.execCommand("copy"));
    button.textContent = "Kopiert";
  }
  if (event.target.closest(".toggle-qr-button")) container.querySelector(".qr-card")?.classList.toggle("is-hidden");
  if (event.target.closest(".print-qr-button")) {
    container.querySelector(".qr-card")?.classList.remove("is-hidden");
    window.print();
  }
}

generatedLink.addEventListener("click", handleTeacherOverviewClick);
teacherOverview.addEventListener("click", handleTeacherOverviewClick);

teacherLinkForm.querySelector(".manage-class-button").addEventListener("click", async () => {
  const teacherCode = String(teacherLinkForm.elements.teacherCode.value || "").trim().toUpperCase();
  teacherOverview.innerHTML = `<p class="teacher-feedback">Klassenraum wird geladen...</p>`;
  const data = await apiRequest("room", {}, `/api/room?teacherCode=${encodeURIComponent(teacherCode)}`);
  if (!data?.room) {
    teacherOverview.innerHTML = `<p class="teacher-feedback is-error">${data?.error || "Lehrer-Code nicht gefunden."}</p>`;
    return;
  }
  renderTeacherOverview(data.room, data.players || [], data.picks || [], teacherOverview);
});

teacherLinkForm.addEventListener("click", (event) => {
  const button = event.target.closest("[data-count-step]");
  if (!button) return;
  const input = teacherLinkForm.querySelector('input[name="studentCount"]');
  const nextValue = Math.max(3, Math.min(35, Number(input.value || 3) + Number(button.dataset.countStep)));
  input.value = nextValue;
});

teacherLinkForm.querySelector('input[name="studentCount"]').addEventListener("input", (event) => {
  event.target.value = event.target.value.replace(/\D/g, "").slice(0, 2);
});

teacherLinkForm.querySelector('input[name="studentCount"]').addEventListener("focusout", (event) => {
  const value = Number(event.target.value || 24);
  event.target.value = Math.max(3, Math.min(35, value));
});

homeTabs.forEach((tab) => {
  tab.addEventListener("click", () => setHomeTab(tab.dataset.homeTab));
});

heroJoinForm.addEventListener("change", (event) => {
  if (event.target.name?.startsWith("avatar")) updateAvatarPreview();
});

heroJoinForm.addEventListener("click", (event) => {
  const button = event.target.closest(".random-avatar-tile");
  if (!button) return;
  const avatarInputs = [...heroJoinForm.querySelectorAll('.image-avatar-grid input[name="avatar"]')]
    .filter((input) => !input.closest("label")?.classList.contains("is-missing"));
  if (!avatarInputs.length) return;
  const randomInput = avatarInputs[Math.floor(Math.random() * avatarInputs.length)];
  randomInput.checked = true;
  updateAvatarPreview();
});

avatarPreview?.addEventListener("pointermove", (event) => {
  const rect = avatarPreview.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  avatarPreview.style.setProperty("--avatar-ry", `${x * 10}deg`);
  avatarPreview.style.setProperty("--avatar-rx", `${y * -10}deg`);
});

avatarPreview?.addEventListener("pointerleave", () => {
  avatarPreview.style.setProperty("--avatar-ry", "0deg");
  avatarPreview.style.setProperty("--avatar-rx", "0deg");
});

document.querySelector('[data-app-tab="rangliste"]')?.addEventListener("click", (event) => {
  event.preventDefault();
  history.pushState(null, "", `${window.location.pathname}${window.location.search}#rangliste`);
  updateAppView();
  window.scrollTo({ top: 0 });
});

window.addEventListener("hashchange", updateAppView);

groupTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-group]");
  if (!button) return;
  classState.activeGroup = button.dataset.group;
  renderAll();
});

matchList.addEventListener("input", (event) => {
  const field = event.target;
  if (!field.dataset.match) return;
  const matchId = field.dataset.match;
  const match = matches.find((entry) => entry.id === matchId);
  if (!match || isMatchClosed(match)) {
    showLockedMatchMessage(matchId);
    renderMatches();
    return;
  }
  const side = Number(field.dataset.side);
  field.value = field.value.replace(/\D/g, "").slice(0, 2);
  const value = field.value === "" ? 0 : Math.max(0, Math.min(20, Number(field.value)));
  userPicks[matchId] = userPicks[matchId] || [0, 0];
  userPicks[matchId][side] = value;
  renderLeaderboard();
  saveRemotePick(matchId);
});

matchList.addEventListener("focusout", (event) => {
  if (!event.target.dataset.match) return;
  renderMatches();
});

matchList.addEventListener("click", (event) => {
  const button = event.target.closest(".score-step");
  if (!button || button.disabled) return;
  const matchId = button.dataset.match;
  const match = matches.find((entry) => entry.id === matchId);
  if (!match || isMatchClosed(match)) {
    showLockedMatchMessage(matchId);
    return;
  }
  const side = Number(button.dataset.side);
  const step = Number(button.dataset.step);
  userPicks[matchId] = userPicks[matchId] || [0, 0];
  userPicks[matchId][side] = Math.max(0, Math.min(20, Number(userPicks[matchId][side] || 0) + step));
  renderMatches();
  renderLeaderboard();
  saveRemotePick(matchId);
});

const params = new URLSearchParams(window.location.search);
const pathClassCode = decodeURIComponent(window.location.pathname.match(/\/klasse\/([^/]+)/i)?.[1] || "");
if (pathClassCode || params.has("code")) {
  classState.code = (pathClassCode || params.get("code")).toUpperCase();
  restoreSession();
}

setupAvatarImages();
updateAvatarPreview();
renderAll();
syncRoom().then(syncPicks);
syncResults();

setInterval(updateCountdowns, 1000);
setInterval(syncResults, 300_000);

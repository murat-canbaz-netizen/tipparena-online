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
const windowSessionPrefix = "tipparena-session:";
const adminRoomsKey = "tipparena-admin-rooms";
const debugMode = new URLSearchParams(window.location.search).get("debug") === "1";
const debugState = {
  scriptVersion: "94",
  sessionSource: "keine",
  sessionAvailable: false,
  storageAvailable: "unbekannt",
  windowNameAvailable: "unbekannt",
  fetchAvailable: typeof window.fetch === "function",
  userAgent: navigator.userAgent.slice(0, 120),
  loadedPickCount: 0,
  loadedMatchIds: [],
  lastSavedMatchId: "-",
  lastSaveVerification: "noch nicht gespeichert",
  lastPicksGetAt: "-",
  lastAction: "-",
  lastButtonDisabled: "-",
  lastPostStartedAt: "-",
  lastPostStatus: "-",
  lastPostResponse: "-",
  lastErrorText: "-",
  matchStates: [],
};

function updateDebugPanel() {
  if (!debugMode) return;
  let panel = document.querySelector("#tipparenaDebugPanel");
  if (!panel) {
    panel = document.createElement("aside");
    panel.id = "tipparenaDebugPanel";
    panel.style.cssText = "position:fixed;z-index:9999;right:10px;bottom:10px;max-width:min(420px,calc(100vw - 20px));max-height:45vh;overflow:auto;padding:12px;border:1px solid #8fa3bb;border-radius:12px;background:#f7faff;color:#172033;font:12px/1.45 system-ui;box-shadow:0 10px 30px rgba(15,23,42,.22);white-space:pre-wrap";
    document.body.append(panel);
  }
  panel.textContent = [
    "TippArena Diagnose",
    `Script-Version: v=${debugState.scriptVersion}`,
    `Raumcode: ${classState.code || "-"}`,
    `Spitzname: ${classState.joinedName || "-"}`,
    `playerId: ${classState.playerId || "-"}`,
    `User-Agent: ${debugState.userAgent}`,
    `sessionStorage verfuegbar: ${debugState.storageAvailable}`,
    `window.name verfuegbar: ${debugState.windowNameAvailable}`,
    `fetch verfuegbar: ${debugState.fetchAvailable ? "ja" : "nein"}`,
    `Session vorhanden: ${debugState.sessionAvailable ? "ja" : "nein"} (${debugState.sessionSource})`,
    `Geladene Tipps: ${debugState.loadedPickCount}`,
    `Geladene matchIds: ${debugState.loadedMatchIds.join(", ") || "-"}`,
    `Zuletzt gespeichert: ${debugState.lastSavedMatchId}`,
    `Letzte Speicherprüfung: ${debugState.lastSaveVerification}`,
    `Letzter GET /api/picks: ${debugState.lastPicksGetAt}`,
    `Letzte Aktion: ${debugState.lastAction}`,
    `Button disabled: ${debugState.lastButtonDisabled}`,
    `Letzter POST Start: ${debugState.lastPostStartedAt}`,
    `Letzter POST Status: ${debugState.lastPostStatus}`,
    `Letzte POST-Antwort: ${debugState.lastPostResponse}`,
    `Letzter Fehler: ${debugState.lastErrorText}`,
    ...(debugState.matchStates.length ? ["", "Aktuelle Spielkarten:", ...debugState.matchStates] : []),
  ].join("\n");
}

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

window.tipparenaMatchCatalog = matches.map(({ id, group, date, time, home, away }) => ({ id, group, date, time, home, away }));

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

const userPicks = {};
const draftPicks = {};
const locallyConfirmedPicks = {};
const pendingPickSaves = new Set();
const pickSaveMessages = {};
const exactCelebrationStorageKey = "tipparenaExactCelebrations";
const confettiPaths = [
  [-112, 74, -150], [-88, 112, 120], [-64, 58, 210], [-42, 126, -90],
  [-18, 86, 170], [14, 132, -210], [36, 68, 110], [58, 118, -160],
  [78, 82, 220], [96, 126, -100], [116, 62, 150], [132, 104, -230],
];
const exactCelebrations = new Set(loadExactCelebrations());
const remoteState = {
  online: true,
  players: [],
  picksByPlayer: {},
  adjustmentsByPlayer: {},
  leaderboardByPlayer: {},
};
let liveResultsTimer = null;
let liveResultsRequestPending = false;
let lastVisibleResultsRefresh = 0;

function normalizedMatchId(matchId) {
  return String(matchId || "").trim().toLowerCase();
}

function normalizedPick(pick) {
  if (!Array.isArray(pick) || pick.length < 2) return null;
  return [
    Math.max(0, Math.min(20, Number(pick[0]) || 0)),
    Math.max(0, Math.min(20, Number(pick[1]) || 0)),
  ];
}

function samePick(left, right) {
  return Array.isArray(left) && Array.isArray(right) && left[0] === right[0] && left[1] === right[1];
}

function setUserPick(matchId, pick, { locallyConfirmed = false } = {}) {
  const key = normalizedMatchId(matchId);
  const value = normalizedPick(pick);
  if (!key || !value) return;
  userPicks[key] = value;
  if (locallyConfirmed) {
    locallyConfirmedPicks[key] = { pick: [...value], confirmedAt: Date.now() };
  }
}

function setDraftPick(matchId, pick) {
  const key = normalizedMatchId(matchId);
  const value = normalizedPick(pick);
  if (!key || !value) return;
  draftPicks[key] = value;
}

function refreshStorageDebugState() {
  try {
    const probeKey = "tipparena-storage-test";
    sessionStorage.setItem(probeKey, "1");
    sessionStorage.removeItem(probeKey);
    debugState.storageAvailable = "ja";
  } catch {
    debugState.storageAvailable = "nein";
  }
  try {
    const previous = window.name;
    window.name = previous;
    debugState.windowNameAvailable = "ja";
  } catch {
    debugState.windowNameAvailable = "nein";
  }
  debugState.fetchAvailable = typeof window.fetch === "function";
}

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

function normalizeClassName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function validClassName(value) {
  return value.length >= 1 && value.length <= 40 && /^[\p{L}\p{N} _./-]+$/u.test(value);
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

async function apiRequest(path, options = {}, endpoint = `/api/${path}`) {
  const isPost = String(options.method || "GET").toUpperCase() === "POST";
  if (isPost) {
    debugState.lastPostStartedAt = new Date().toLocaleTimeString("de-DE");
    debugState.lastPostStatus = "laeuft";
    debugState.lastPostResponse = "-";
    debugState.lastErrorText = "-";
    updateDebugPanel();
  }
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (isPost) {
      debugState.lastPostStatus = String(response.status);
      debugState.lastPostResponse = JSON.stringify(data).slice(0, 240);
      if (!response.ok) debugState.lastErrorText = data.error || `HTTP ${response.status}`;
      updateDebugPanel();
    }
    if (!response.ok) return { error: data.error || "Online-Speicherung nicht erreichbar.", status: response.status };
    remoteState.online = true;
    return data;
  } catch (error) {
    console.warn("TippArena-Anfrage fehlgeschlagen. Die nächste Anfrage versucht es erneut.", error);
    if (isPost) {
      debugState.lastPostStatus = "Netzwerkfehler";
      debugState.lastErrorText = error?.message || "Netzwerkfehler";
      updateDebugPanel();
    }
    return { error: "Internetverbindung prüfen und erneut speichern.", networkError: true };
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
    const matchId = normalizedMatchId(pick.match_id);
    const value = normalizedPick([pick.home_score, pick.away_score]);
    if (matchId && value) picks[matchId] = value;
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

function setRemoteAdjustments(adjustments = []) {
  remoteState.adjustmentsByPlayer = adjustments.reduce((map, entry) => {
    const playerId = entry.player_id;
    map[playerId] = (map[playerId] || 0) + Number(entry.points || 0);
    return map;
  }, {});
}

function adjustmentPointsForPlayer(playerId) {
  return Number(remoteState.adjustmentsByPlayer[playerId] || 0);
}

async function syncRoom() {
  if (!classState.code) return;
  const data = await apiRequest("room", {}, `/api/room?code=${encodeURIComponent(classState.code)}`);
  if (!data || data.error) return;
  applyRoom(data.room);
  remoteState.players = data.players || [];
  renderAll();
}

async function syncPicks({ render = true, replaceUserPicks = true } = {}) {
  if (!classState.code) return { synced: false, error: "Klassenraum fehlt." };
  const data = await apiRequest(
    "picks",
    { cache: "no-store" },
    `/api/picks?room=${encodeURIComponent(classState.code)}&t=${Date.now()}`,
  );
  if (!data || data.error) {
    debugState.lastPicksGetAt = `${new Date().toLocaleTimeString("de-DE")} (Fehler)`;
    updateDebugPanel();
    return { synced: false, error: data?.error || "Serverstand konnte nicht geladen werden." };
  }
  remoteState.players = data.players || remoteState.players;
  setRemotePicks(data.picks || []);
  setRemoteAdjustments(data.adjustments || []);
  remoteState.leaderboardByPlayer = (data.leaderboard || []).reduce((map, entry) => {
    map[entry.playerId] = entry;
    return map;
  }, {});

  if (classState.playerId) {
    const savedPicks = remotePicksForPlayer(classState.playerId);
    debugState.loadedPickCount = Object.keys(savedPicks).length;
    debugState.loadedMatchIds = Object.keys(savedPicks);
    if (replaceUserPicks) {
      Object.keys(userPicks).forEach((matchId) => delete userPicks[matchId]);
      Object.entries(savedPicks).forEach(([matchId, pick]) => {
        const localPick = locallyConfirmedPicks[matchId]?.pick;
        if (localPick && !samePick(localPick, pick)) {
          userPicks[matchId] = [...localPick];
          return;
        }
        userPicks[matchId] = [...pick];
      });
      Object.entries(locallyConfirmedPicks).forEach(([matchId, entry]) => {
        if (!userPicks[matchId]) {
          userPicks[matchId] = [...entry.pick];
        }
      });
    }
  }
  debugState.lastPicksGetAt = new Date().toLocaleTimeString("de-DE");
  updateDebugPanel();
  if (render) renderAll();
  return { synced: true };
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
  const match = matches.find((entry) => entry.id === fixture.matchId) || matches.find(
    (entry) =>
      normalizedResultTeam(entry.home) === normalizedResultTeam(fixture.home?.name) &&
      normalizedResultTeam(entry.away) === normalizedResultTeam(fixture.away?.name),
  );
  if (!match) return false;

  const finishedStatuses = new Set(["FT", "AET", "PEN", "finished"]);
  const liveStatuses = new Set(["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"]);
  liveStatuses.add("live");
  const hasScore = fixture.status !== "open" && Number.isFinite(fixture.goals?.home) && Number.isFinite(fixture.goals?.away);
  match.result = hasScore ? [fixture.goals.home, fixture.goals.away] : null;
  match.status = finishedStatuses.has(fixture.status) ? "done" : liveStatuses.has(fixture.status) ? "live" : "open";
  match.minute = fixture.minute ?? "";
  return true;
}

function scheduleLiveResultsUpdate(delay) {
  clearTimeout(liveResultsTimer);
  liveResultsTimer = setTimeout(syncResults, delay);
}

function showLiveResultsNotice() {
  if (!arenaStatus) return;
  let notice = arenaStatus.querySelector(".live-results-notice");
  if (!notice) {
    notice = document.createElement("small");
    notice.className = "live-results-notice";
    arenaStatus.append(notice);
  }
  notice.textContent = "Live-Ergebnisse werden später aktualisiert.";
}

async function syncResults() {
  if (liveResultsRequestPending) return;
  liveResultsRequestPending = true;
  try {
    const response = await fetch("/api/results");
    const data = await response.json();
    if (response.status === 429) {
      showLiveResultsNotice();
      scheduleLiveResultsUpdate(Math.max(600, Number(data.retryAfterSeconds || 600)) * 1000);
      return;
    }
    if (!response.ok) {
      scheduleLiveResultsUpdate(900_000);
      return;
    }
    (data.fixtures || []).forEach((fixture) => {
      applyLiveFixture(fixture);
    });
    await syncPicks();
    renderMatches();
    renderLeaderboard();
    scheduleLiveResultsUpdate(data.rateLimited ? 600_000 : data.hasLiveMatches ? 300_000 : 900_000);
  } catch {
    scheduleLiveResultsUpdate(900_000);
  } finally {
    liveResultsRequestPending = false;
  }
}

async function refreshResultsNow() {
  const response = await fetch(`/api/results?t=${Date.now()}`, { cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Ergebnisse konnten nicht aktualisiert werden.");

  (data.fixtures || []).forEach((fixture) => applyLiveFixture(fixture));
  await syncPicks();
  renderMatches();
  renderLeaderboard();
  scheduleLiveResultsUpdate(data.rateLimited ? 600_000 : data.hasLiveMatches ? 300_000 : 900_000);
  return data;
}

window.tipparenaRefreshResults = refreshResultsNow;
window.tipparenaRefreshPicks = async function refreshPicksNow() {
  await syncPicks();
  renderMatches();
  renderLeaderboard();
};

function refreshVisibleResults() {
  if (document.visibilityState !== "visible") return;
  if (Date.now() - lastVisibleResultsRefresh < 20_000) return;
  lastVisibleResultsRefresh = Date.now();
  refreshResultsNow().catch(() => {
    scheduleLiveResultsUpdate(900_000);
  });
}

document.addEventListener("visibilitychange", refreshVisibleResults);
setInterval(refreshVisibleResults, 30_000);

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
  const data = await apiRequest(
    "player",
    {
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
    },
    "/api/player",
  );
  if (!data?.player) return data;
  applyRoom(data.room);
  classState.playerId = data.player.id;
  remoteState.players = [
    ...remoteState.players.filter((player) => player.id !== data.player.id),
    data.player,
  ];
  return { ...data.player, existing: Boolean(data.existing) };
}

async function ensurePlayerSessionForSave() {
  if (classState.playerId) return { ok: true };
  if (!classState.code || !classState.joinedName) {
    const message = "Bitte melde dich noch einmal mit deinem gleichen Spitznamen an.";
    debugState.lastErrorText = message;
    updateDebugPanel();
    return { ok: false, error: message };
  }
  debugState.lastAction = "playerId fehlt - Wiederherstellung";
  debugState.lastSaveVerification = "Spieler wird wiederhergestellt";
  updateDebugPanel();
  const player = await createRemotePlayer(classState.joinedName, classState.avatar);
  if (!player || player.error || !classState.playerId) {
    const message = player?.error || "Bitte melde dich noch einmal mit deinem gleichen Spitznamen an.";
    debugState.lastErrorText = message;
    updateDebugPanel();
    return { ok: false, error: message };
  }
  rememberSession();
  await syncPicks({ render: false });
  return { ok: true };
}

async function saveRemotePick(matchId, pick) {
  const key = normalizedMatchId(matchId);
  const value = normalizedPick(pick);
  if (!classState.code) {
    return { saved: false, error: "Bitte öffne den Klassenlink erneut und versuche es noch einmal." };
  }
  const sessionReady = await ensurePlayerSessionForSave();
  if (!sessionReady.ok) {
    return { saved: false, error: sessionReady.error };
  }
  const match = matches.find((entry) => normalizedMatchId(entry.id) === key);
  if (!match || isMatchClosed(match) || !value) {
    return { saved: false, status: 409, error: "Dieses Spiel hat bereits begonnen. Dein Tipp wurde nicht gespeichert." };
  }
  const data = await apiRequest(
    "picks",
    {
      method: "POST",
      cache: "no-store",
      body: JSON.stringify({
        roomCode: classState.code,
        playerId: classState.playerId,
        matchId: key,
        homeScore: value[0],
        awayScore: value[1],
      }),
    },
    "/api/picks",
  );
  if (!Array.isArray(data?.picks)) {
    return {
      saved: false,
      status: data?.status,
      networkError: Boolean(data?.networkError),
      error: data?.networkError
        ? "Internetverbindung prüfen und erneut speichern."
        : data?.status === 409
          ? data.error
          : data?.error || "Speichern hat nicht geklappt. Bitte öffne den Link direkt im Browser und versuche es erneut.",
    };
  }
  const confirmedPick = data.picks.find((savedPick) => (
    normalizedMatchId(savedPick.match_id || savedPick.matchId) === key
    && Number(savedPick.home_score ?? savedPick.homeScore) === value[0]
    && Number(savedPick.away_score ?? savedPick.awayScore) === value[1]
    && (!savedPick.player_id || String(savedPick.player_id) === String(classState.playerId))
  ));
  return confirmedPick
    ? { saved: true, confirmedByPost: true }
    : { saved: false, submitted: true, verification: verifySavedPick(key, value) };
}

function waitForPickVerification(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

async function verifySavedPick(matchId, pick) {
  const key = normalizedMatchId(matchId);
  const value = normalizedPick(pick);
  if (!key || !value) return false;
  const startedAt = Date.now();
  for (const retryAt of [0, 800, 2000]) {
    const delay = retryAt - (Date.now() - startedAt);
    if (delay > 0) await waitForPickVerification(delay);
    const syncResult = await syncPicks({ render: false, replaceUserPicks: false });
    if (!syncResult.synced) continue;
    const verifiedPick = remotePicksForPlayer(classState.playerId)[key];
    if (samePick(verifiedPick, value)) return true;
  }
  return false;
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
  await apiRequest(
    "picks",
    {
      method: "POST",
      cache: "no-store",
      body: JSON.stringify({
        roomCode: classState.code,
        playerId: classState.playerId,
        picks,
      }),
    },
    "/api/picks",
  );
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
  if (!classState.code || !classState.joinedName) return false;
  try {
    sessionStorage.setItem(
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
    window.name = `${windowSessionPrefix}${JSON.stringify({
      code: classState.code,
      className: classState.className,
      school: classState.school,
      nickname: classState.joinedName,
      playerId: classState.playerId,
      avatar: classState.avatar,
    })}`;
    debugState.sessionAvailable = true;
    debugState.sessionSource = "sessionStorage + Tab-Fallback";
    updateDebugPanel();
    return true;
  } catch {
    try {
      window.name = `${windowSessionPrefix}${JSON.stringify({
        code: classState.code,
        className: classState.className,
        school: classState.school,
        nickname: classState.joinedName,
        playerId: classState.playerId,
        avatar: classState.avatar,
      })}`;
      debugState.sessionAvailable = true;
      debugState.sessionSource = "Tab-Fallback";
      updateDebugPanel();
      return true;
    } catch {
      return false;
    }
  }
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
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // Alte dauerhafte Sitzungen werden ignoriert, wenn localStorage blockiert ist.
  }
  let saved = null;
  try {
    saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
  } catch {
    saved = null;
  }
  if (saved?.code === classState.code) {
    debugState.sessionSource = "sessionStorage";
  } else if (window.name.startsWith(windowSessionPrefix)) {
    try {
      const windowSaved = JSON.parse(window.name.slice(windowSessionPrefix.length));
      saved = windowSaved?.code === classState.code ? windowSaved : null;
      if (saved) debugState.sessionSource = "Tab-Fallback";
    } catch {
      saved = null;
    }
  }
  if (!saved || saved.code !== classState.code) {
    debugState.sessionAvailable = false;
    debugState.sessionSource = "keine";
    updateDebugPanel();
    return false;
  }
  classState.school = saved.school || classState.school;
  classState.className = saved.className || classState.className;
  classState.joinedName = saved.nickname || "";
  classState.playerId = saved.playerId || "";
  classState.avatar = saved.avatar || classState.avatar;
  debugState.sessionAvailable = Boolean(classState.playerId);
  updateDebugPanel();
  return Boolean(classState.playerId);
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
  if (match.status === "done" || (match.result && match.status !== "live")) {
    return '<div class="match-countdown match-ended"><span>Endstand eingetragen</span></div>';
  }
  if (match.status === "live") {
    return '<div class="match-countdown match-ended"><span>Spiel läuft</span></div>';
  }
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
  if (resultDiff === 0) return pickDiff === 0 ? 1 : 0;
  if (pickDiff === resultDiff) return 2;
  if (Math.sign(pickDiff) === Math.sign(resultDiff)) return 1;
  return 0;
}

function loadExactCelebrations() {
  try {
    return JSON.parse(sessionStorage.getItem(exactCelebrationStorageKey) || "[]");
  } catch {
    return [];
  }
}

function rememberExactCelebrations() {
  try {
    sessionStorage.setItem(exactCelebrationStorageKey, JSON.stringify([...exactCelebrations]));
  } catch {
    // The in-memory Set still prevents repeated celebrations during this page session.
  }
}

function exactCelebrationMarkup(match, points) {
  if (points !== 3 || !match.result) return "";
  const celebrationId = `${classState.code}:${classState.playerId || classState.joinedName}:${match.id}`;
  if (exactCelebrations.has(celebrationId)) return "";
  exactCelebrations.add(celebrationId);
  rememberExactCelebrations();
  return `
    <span class="exact-confetti" aria-hidden="true">
      ${confettiPaths.map(([x, y, rotation], index) => `<i style="--piece:${index};--dx:${x}px;--dy:${y}px;--rotation:${rotation}deg"></i>`).join("")}
    </span>
  `;
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
    .map((group) => {
      const teams = [...new Set(matches
        .filter((match) => match.group === group)
        .flatMap((match) => [match.home, match.away]))];
      const groupFlags = teams
        .map((team) => `<span class="group-card__flag" title="${team}">${flagMarkup(team, false)}</span>`)
        .join("");
      return `
        <button class="group-card ${group === classState.activeGroup ? "group-card--active is-active" : ""}" type="button" data-group="${group}">
          <span class="group-card__top">
            <strong class="group-card__title">Gruppe ${group}</strong>
          </span>
          <span class="group-card__flags">${groupFlags}</span>
        </button>
      `;
    })
    .join("");
}

function renderMatches() {
  const group = classState.activeGroup;
  const groupMatches = matches.filter((match) => match.group === group);
  debugState.matchStates = groupMatches.map((match) => {
    const matchId = normalizedMatchId(match.id);
    const draft = draftPicks[matchId];
    const saved = userPicks[matchId];
    const message = pickSaveMessages[matchId] || "-";
    return `${matchId}: Draft ${draft ? draft.join(":") : "-"} | userPicks ${saved ? saved.join(":") : "-"} | Status ${message}`;
  });
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
  updateDebugPanel();
}

function renderMatchCard(match) {
  const matchId = normalizedMatchId(match.id);
  const savedPick = userPicks[matchId];
  const draftPick = draftPicks[matchId];
  const hasDraft = Object.prototype.hasOwnProperty.call(draftPicks, matchId);
  const pick = hasDraft ? draftPick : savedPick || [0, 0];
  const isSaved = Boolean(savedPick);
  const hasUnsavedChanges = hasDraft && (!savedPick || !samePick(draftPick, savedPick));
  const isSaving = pendingPickSaves.has(matchId);
  const points = scorePick(savedPick, match.result);
  const locked = isMatchClosed(match);
  const pointClass = match.result ? `points-${points}` : "";
  const bravo = points === 3 && match.result ? `<span class="bravo-badge">Volltreffer!</span>` : "";
  const celebration = exactCelebrationMarkup(match, points);
  const newExactSuccess = Boolean(celebration);
  const pointsLabel = points === 3 ? "Volltreffer! 3 Pkt. 🎉" : `${points} Pkt.`;
  const lockMessage = points === 3
    ? "Endstand erreicht – dein Tipp wurde ausgewertet."
    : "Dieses Spiel kann nicht mehr getippt werden.";
  const saveLabel = locked
    ? isSaved ? "Gespeichert ✓" : "Nicht getippt"
    : isSaving
      ? "Speichere deinen Tipp..."
      : pickSaveMessages[matchId]
        || (isSaved && !hasUnsavedChanges ? "Gespeichert ✓" : hasUnsavedChanges ? "Noch nicht gespeichert – Tipp speichern" : "Tipp speichern");
  return `
    <article class="match-card ${match.status} ${locked ? "locked" : ""} ${pointClass} ${newExactSuccess ? "new-exact-success" : ""}" data-match-card="${match.id}">
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
        <strong class="${points === 3 ? `exact-points-badge ${newExactSuccess ? "is-new-exact" : ""}` : ""}">${pointsLabel}</strong>
        <button class="save-pick-button ${isSaved && !hasUnsavedChanges ? "is-saved" : ""}" type="button" data-save-pick="${match.id}" ${locked || isSaving ? "disabled" : ""}>${saveLabel}</button>
        ${bravo}
      </div>
      ${locked ? `<p class="match-lock-message">${lockMessage}</p>` : ""}
      ${celebration}
    </article>
  `;
}

function movementMarkup(movement, rank, totalRanks) {
  let visibleMovement = movement;
  if (rank === 1 && visibleMovement < 0) visibleMovement = 0;
  if (rank === totalRanks && visibleMovement > 0) visibleMovement = 0;

  if (visibleMovement > 0) return `<span class="move up">↑ +${visibleMovement}</span>`;
  if (visibleMovement < 0) return `<span class="move down">↓ -${Math.abs(visibleMovement)}</span>`;
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

const placementMessages = {
  1: [
    "Tabellenboss: Alle jagen diesen Platz.",
    "Goldmodus aktiviert – heute bist du ganz oben.",
    "Hier thront der Tippkönig des Tages.",
    "Spitze! Heute führt kein Weg an dir vorbei.",
    "Ganz oben gelandet – stark getippt!",
  ],
  2: [
    "Ganz nah dran – der Spitzenplatz wackelt schon.",
    "Silber-Blitz: Ein kleiner Sprung fehlt noch nach ganz oben.",
    "Direkt hinter dem Thron – du bist auf Verfolgungsjagd.",
    "Stark unterwegs – Platz 1 ist in Sichtweite.",
  ],
  3: [
    "Treppchen erreicht – stark gemacht!",
    "Bronze-Power: Du spielst ganz vorne mit.",
    "Oben dabei – das Siegerpodest gehört dir.",
    "Top 3! Jetzt geht’s vielleicht noch höher hinaus.",
  ],
  4: [
    "Knapp am Treppchen vorbei – aber voll im Rennen.",
    "Fast auf dem Podium – ein guter Tipp bringt dich hoch.",
    "Nur ein kleiner Sprung bis zu den Top 3.",
  ],
  5: [
    "Starkes Mittelfeld? Nein – du greifst schon oben an!",
    "Top 5 – da geht noch was!",
    "Du bist auf Tuchfühlung mit den Besten.",
  ],
  middle: [
    "Mitten im Rennen – der nächste Volltreffer wartet schon.",
    "Noch ist alles drin – ein paar starke Tipps und du kletterst hoch.",
    "Angriff läuft – die oberen Plätze kommen näher.",
    "Solide unterwegs – jetzt kommt die Aufholjagd.",
  ],
  chase: [
    "Nicht aufgeben – Tabellenklettern beginnt genau hier.",
    "Von hier aus startet oft die spannendste Aufholjagd.",
    "Noch ist alles offen – ein guter Spieltag kann alles ändern.",
    "Du sammelst Anlauf – der nächste Sprung kommt bestimmt.",
  ],
  last: [
    "Hinten heißt nicht verloren – jetzt beginnt die Aufholshow.",
    "Mut nicht verlieren – große Comebacks starten oft von hinten.",
    "Jeder Volltreffer zählt – dein Aufstieg kann sofort starten.",
    "Die Tabelle schläft nie – dein Sprung nach oben kann gleich beginnen.",
  ],
};

function stableMessageIndex(value, length) {
  const hash = [...String(value)].reduce((sum, character) => ((sum * 31) + character.charCodeAt(0)) >>> 0, 0);
  return hash % length;
}

function playerStory(player, rank) {
  const messages = placementMessages[rank]
    || (rank <= 8 ? placementMessages.middle : rank <= 12 ? placementMessages.chase : placementMessages.last);
  return messages[stableMessageIndex(`${player.id || player.name}-${rank}`, messages.length)];
}

function latestFinishedMatch() {
  return matches.reduce((latest, match) => {
    if (match.status !== "done" || !match.result) return latest;
    if (!latest || matchStartTime(match) >= matchStartTime(latest)) return match;
    return latest;
  }, null);
}

function latestFinishedPickMarkup(player, match) {
  const pick = match && player.picks?.[match.id];
  if (!match) return '<small class="latest-finished-pick">–</small>';
  const homeCode = teamCodes[match.home] || match.home.slice(0, 3).toUpperCase();
  const awayCode = teamCodes[match.away] || match.away.slice(0, 3).toUpperCase();
  const matchLabel = `${homeCode}–${awayCode}:`;
  if (!pick) return `<small class="latest-finished-pick">${matchLabel} –</small>`;
  const points = scorePick(pick, match.result);
  return `<small class="latest-finished-pick ${points === 3 ? "is-perfect" : ""}">${matchLabel} ${pick[0]}:${pick[1]} · +${points} Pkt.</small>`;
}

function adjustmentPointsMarkup(player) {
  const adjustment = Number(player.adjustmentPoints || 0);
  if (!adjustment) return "";
  return `<small class="leader-adjustment">inkl. ${adjustment > 0 ? "+" : ""}${adjustment} Korrektur</small>`;
}

function leaderboardPlayerKey(player) {
  return player.id || player.name;
}

function rankLeaderboardRows(rows, pointsForPlayer) {
  return rows
    .map((player, order) => ({ ...player, points: pointsForPlayer(player), leaderboardOrder: order }))
    .sort((a, b) => {
      if (a.empty && !b.empty) return 1;
      if (!a.empty && b.empty) return -1;
      return b.points - a.points || a.leaderboardOrder - b.leaderboardOrder;
    });
}

function applyLastFinishedMatchMovement(ranked, rows, lastFinishedMatch) {
  if (!lastFinishedMatch?.result) {
    return ranked.map((player) => ({ ...player, movement: 0, movementMatchId: null }));
  }
  const previousRankByPlayer = new Map(
    rankLeaderboardRows(
      rows,
      (player) => totalPoints(player.picks)
        - scorePick(player.picks?.[lastFinishedMatch.id], lastFinishedMatch.result)
        + Number(player.adjustmentPoints || 0),
    ).map((player, index) => [leaderboardPlayerKey(player), index + 1]),
  );
  return ranked.map((player, index) => ({
    ...player,
    movement: (previousRankByPlayer.get(leaderboardPlayerKey(player)) || index + 1) - (index + 1),
    movementMatchId: lastFinishedMatch.id,
  }));
}

function renderLeaderboard() {
  const hasCurrentPlayer = Boolean(classState.joinedName);
  const hasClassRoom = Boolean(classState.code);
  const remoteRows = remoteState.players.map((player) => ({
    id: player.id,
    name: player.nickname,
    avatar: player.avatar,
    picks: player.id === classState.playerId || player.nickname === classState.joinedName ? userPicks : remotePicksForPlayer(player.id),
    movement: Number(remoteState.leaderboardByPlayer[player.id]?.movement || 0),
    movementMatchId: remoteState.leaderboardByPlayer[player.id]?.movementMatchId || null,
    adjustmentPoints: adjustmentPointsForPlayer(player.id),
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

  const lastFinishedMatch = latestFinishedMatch();
  const ranked = applyLastFinishedMatchMovement(
    rankLeaderboardRows(rows, (player) => totalPoints(player.picks) + Number(player.adjustmentPoints || 0)),
    rows,
    lastFinishedMatch,
  );

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
  const hottestPlayer = ranked
    .map((player) => ({ ...player, streak: exactStreak(player.picks) }))
    .sort((a, b) => b.streak - a.streak || b.points - a.points)[0];
  const biggestPositiveMovement = Math.max(0, ...ranked.map((player) => player.movement));
  const comebackPlayers = ranked.filter((player) => player.movement === biggestPositiveMovement && biggestPositiveMovement > 0);
  const comebackNames = comebackPlayers.map((player) => player.name).join(" & ");
  const nextOpponent = currentPlayer
    ? ranked.slice(0, Math.max(0, currentRank - 1)).reverse().find((player) => player.points > currentPlayer.points)
    : null;
  const pointsToNextOpponent = nextOpponent && currentPlayer
    ? nextOpponent.points - currentPlayer.points
    : 0;
  const nextDuel = !currentPlayer
    ? { headline: "Melde dich an", detail: "Dann siehst du dein nächstes Duell." }
    : ranked.length === 1
      ? { headline: "Noch kein Duell", detail: "Sobald andere mitspielen, startet die Jagd." }
      : currentRank === 1
        ? { headline: "Du wirst gejagt!", detail: "Verteidige deinen Spitzenplatz." }
        : !nextOpponent
          ? { headline: "Du bist ganz oben!", detail: "Niemand ist punktmäßig vor dir." }
        : {
            headline: `Du jagst ${nextOpponent.name}`,
            detail: `Nur ${pointsToNextOpponent} ${pointsToNextOpponent === 1 ? "Punkt" : "Punkte"} Abstand`,
          };

  leaderboard.innerHTML = `
    <div class="leaderboard-hype" aria-label="Tabellen-Statistiken">
      <article>
        <span>Nächstes Duell</span>
        <strong>${nextDuel.headline}</strong>
        <small>${nextDuel.detail}</small>
      </article>
      <article>
        <span>Heißeste Serie</span>
        <strong>${hottestPlayer.streak || 1}x exakt</strong>
        <small>${hottestPlayer.name} ist gerade im Flow</small>
      </article>
      <article>
        <span>🚀 Aufholjäger</span>
        <strong>${comebackPlayers.length ? comebackNames : "Noch kein Aufholjäger."}</strong>
        <small>${comebackPlayers.length
    ? `<b>+${biggestPositiveMovement} ${biggestPositiveMovement === 1 ? "Platz" : "Plätze"}</b><br>Größter Sprung nach oben seit dem letzten Ergebnis.`
    : "Beim nächsten Ergebnis kann sich alles ändern."}</small>
      </article>
    </div>
    <div class="leaderboard-podium" aria-label="Podium">
      ${podium
        .map(
          (player, index) => `
            <article class="podium-card podium-${index + 1} ${player.current ? "current-player" : ""}">
              ${player.current ? '<span class="current-player-badge">DU</span>' : ""}
              <span class="podium-rank">${index === 0 ? "Champion" : `Platz ${index + 1}`}</span>
              <strong>${player.avatar ? avatarMarkup(player.avatar) : ""}${player.name}</strong>
              <b>${player.points} Punkte</b>
              ${adjustmentPointsMarkup(player)}
              <small class="placement-message">${playerStory(player, index + 1)}</small>
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
          ${player.current ? '<span class="current-player-badge">DU</span>' : ""}
          <span class="rank">Platz ${index + 1}</span>
          <div class="leader-player">
            <strong>${player.avatar ? avatarMarkup(player.avatar) : ""}${player.name}</strong>
            ${latestFinishedPickMarkup(player, matches.find((match) => match.id === player.movementMatchId) || lastFinishedMatch)}
            ${adjustmentPointsMarkup(player)}
            <small class="placement-message">${playerStory(player, index + 1)}</small>
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
  updateDebugPanel();
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
  classState.joinedName = player.nickname || nickname;
  classState.avatar = player.avatar || selectedAvatar;
  rememberSession();
  Object.keys(userPicks).forEach((matchId) => delete userPicks[matchId]);
  Object.keys(draftPicks).forEach((matchId) => delete draftPicks[matchId]);
  Object.keys(locallyConfirmedPicks).forEach((matchId) => delete locallyConfirmedPicks[matchId]);
  await syncPicks();
  messageTarget.textContent = player.existing ? `${classState.joinedName} ist wieder drin.` : `${classState.joinedName} ist drin.`;
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

function normalizeClassCodeInput(value) {
  const raw = String(value || "").trim().replace(/\/+$/, "");
  if (!raw) return "";

  let candidate = raw;
  if (/\/klasse\//i.test(raw)) {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    candidate = decodeURIComponent(url.pathname.match(/\/klasse\/([^/]+)/i)?.[1] || "");
  }

  const code = candidate.trim().replace(/\/+$/, "").toUpperCase();
  return /^[A-Z0-9]+(?:-[A-Z0-9]+)+$/.test(code) ? code : "";
}

async function applyClassLink(classLink, messageTarget) {
  try {
    const code = normalizeClassCodeInput(classLink);
    if (!code) {
      messageTarget.textContent = "Bitte gib einen gültigen Klassencode oder Klassenlink ein.";
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
    messageTarget.textContent = "Bitte gib einen gültigen Klassencode oder Klassenlink ein.";
    messageTarget.style.color = "#d95c4f";
    return false;
  }
}

teacherLinkForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(teacherLinkForm);
  const school = String(formData.get("school")).trim();
  const classValue = normalizeClassName(formData.get("className"));
  const studentCount = String(formData.get("studentCount")).trim();
  if (!validClassName(classValue)) {
    generatedLink.innerHTML = '<p class="teacher-feedback is-error">Bitte einen Klassennamen mit 1 bis 40 Zeichen eingeben. Erlaubt sind Buchstaben, Zahlen, Leerzeichen sowie -, _, / und .</p>';
    return;
  }
  teacherLinkForm.elements.className.value = classValue;
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

appTabs.forEach((tab) => {
  tab.addEventListener("click", (event) => {
    event.preventDefault();
    history.pushState(null, "", `${window.location.pathname}${window.location.search}#${tab.dataset.appTab}`);
    updateAppView();
    window.scrollTo({ top: 0 });
  });
});

window.addEventListener("hashchange", updateAppView);

window.addEventListener("beforeunload", (event) => {
  if (!Object.keys(draftPicks).length && !pendingPickSaves.size) return;
  event.preventDefault();
  event.returnValue = "Es gibt noch ungespeicherte Tipps.";
});

groupTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-group]");
  if (!button) return;
  classState.activeGroup = button.dataset.group;
  renderAll();
});

matchList.addEventListener("input", (event) => {
  const field = event.target;
  if (!field.dataset.match) return;
  const matchId = normalizedMatchId(field.dataset.match);
  const match = matches.find((entry) => normalizedMatchId(entry.id) === matchId);
  if (!match || isMatchClosed(match)) {
    showLockedMatchMessage(matchId);
    renderMatches();
    return;
  }
  const side = Number(field.dataset.side);
  field.value = field.value.replace(/\D/g, "").slice(0, 2);
  const value = field.value === "" ? 0 : Math.max(0, Math.min(20, Number(field.value)));
  setDraftPick(matchId, draftPicks[matchId] || userPicks[matchId] || [0, 0]);
  draftPicks[matchId][side] = value;
  delete pickSaveMessages[matchId];
  const saveButton = matchList.querySelector(`[data-save-pick="${matchId}"]`);
  if (saveButton) {
    saveButton.textContent = "Noch nicht gespeichert – Tipp speichern";
    saveButton.classList.remove("is-saved");
  }
});

matchList.addEventListener("focusout", (event) => {
  if (!event.target.dataset.match) return;
  renderMatches();
});

matchList.addEventListener("pointerdown", (event) => {
  const saveButton = event.target.closest("[data-save-pick]");
  if (!saveButton) return;
  debugState.lastAction = `saveButton touched (${normalizedMatchId(saveButton.dataset.savePick)})`;
  debugState.lastButtonDisabled = saveButton.disabled ? "ja" : "nein";
  updateDebugPanel();
});

matchList.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save-pick]");
  if (saveButton) {
    const matchId = normalizedMatchId(saveButton.dataset.savePick);
    debugState.lastAction = `saveButton clicked (${matchId})`;
    debugState.lastButtonDisabled = saveButton.disabled ? "ja" : "nein";
    debugState.lastSavedMatchId = matchId;
    updateDebugPanel();
    if (saveButton.disabled) return;
    if (pendingPickSaves.has(matchId)) return;
    const match = matches.find((entry) => normalizedMatchId(entry.id) === matchId);
    if (!match || isMatchClosed(match)) {
      showLockedMatchMessage(matchId);
      return;
    }
    const pickToSave = normalizedPick(draftPicks[matchId] || userPicks[matchId] || [0, 0]);
    setDraftPick(matchId, pickToSave);
    pendingPickSaves.add(matchId);
    delete pickSaveMessages[matchId];
    saveButton.disabled = true;
    saveButton.textContent = "Speichere deinen Tipp...";
    saveRemotePick(matchId, pickToSave).then(async (result) => {
      debugState.lastSavedMatchId = matchId;
      if (result.submitted && result.verification) {
        debugState.lastSaveVerification = "Nachprüfung läuft";
        updateDebugPanel();
        pickSaveMessages[matchId] = "Speichern wird geprüft...";
        renderMatches();
        const verified = await result.verification;
        pendingPickSaves.delete(matchId);
        if (!verified) {
          debugState.lastSaveVerification = "nicht bestätigt";
          updateDebugPanel();
          pickSaveMessages[matchId] = "Speichern hat nicht geklappt. Bitte versuche es noch einmal.";
          renderMatches();
          return;
        }
        debugState.lastSaveVerification = "Server bestätigt";
        updateDebugPanel();
        setUserPick(matchId, pickToSave, { locallyConfirmed: true });
        const currentDraft = draftPicks[matchId];
        if (samePick(currentDraft, pickToSave)) {
          delete draftPicks[matchId];
        }
        delete pickSaveMessages[matchId];
        renderMatches();
        renderLeaderboard();
        return;
      }

      pendingPickSaves.delete(matchId);
      if (!result.saved) {
        debugState.lastSaveVerification = "Speicherfehler";
        updateDebugPanel();
        saveButton.disabled = result.status === 409;
        pickSaveMessages[matchId] = result.status === 409
          ? result.error
          : result.error || "Speichern hat nicht geklappt. Bitte versuche es noch einmal.";
        saveButton.textContent = pickSaveMessages[matchId];
        return;
      }
      debugState.lastSaveVerification = "Server bestätigt";
      updateDebugPanel();
      setUserPick(matchId, pickToSave, { locallyConfirmed: true });
      const currentDraft = draftPicks[matchId];
      if (samePick(currentDraft, pickToSave)) {
        delete draftPicks[matchId];
      }
      delete pickSaveMessages[matchId];
      renderMatches();
      renderLeaderboard();
      syncPicks({ render: false });
    }).catch(() => {
      debugState.lastSavedMatchId = matchId;
      debugState.lastSaveVerification = "Netzwerk-/Speicherfehler";
      updateDebugPanel();
      pendingPickSaves.delete(matchId);
      pickSaveMessages[matchId] = "Speichern hat nicht geklappt. Bitte versuche es noch einmal.";
      saveButton.disabled = false;
      saveButton.textContent = pickSaveMessages[matchId];
    });
    return;
  }

  const button = event.target.closest(".score-step");
  if (!button || button.disabled) return;
  const matchId = normalizedMatchId(button.dataset.match);
  const match = matches.find((entry) => normalizedMatchId(entry.id) === matchId);
  if (!match || isMatchClosed(match)) {
    showLockedMatchMessage(matchId);
    return;
  }
  const side = Number(button.dataset.side);
  const step = Number(button.dataset.step);
  setDraftPick(matchId, draftPicks[matchId] || userPicks[matchId] || [0, 0]);
  draftPicks[matchId][side] = Math.max(0, Math.min(20, Number(draftPicks[matchId][side] || 0) + step));
  delete pickSaveMessages[matchId];
  renderMatches();
});

const params = new URLSearchParams(window.location.search);
const pathClassCode = decodeURIComponent(window.location.pathname.match(/\/klasse\/([^/]+)/i)?.[1] || "");
refreshStorageDebugState();
if (pathClassCode || params.has("code")) {
  classState.code = (pathClassCode || params.get("code")).toUpperCase();
  restoreSession();
  if (!classState.playerId && heroJoinMessage) {
    heroJoinMessage.textContent = "Bitte melde dich noch einmal mit deinem gleichen Spitznamen an.";
    heroJoinMessage.style.color = "#b8ff4d";
  }
}

setupAvatarImages();
updateAvatarPreview();
renderAll();
syncRoom().then(syncPicks);
syncResults();

window.addEventListener("tipparena:manual-result", (event) => {
  if (!applyLiveFixture(event.detail || {})) return;
  renderMatches();
  renderLeaderboard();
});

setInterval(updateCountdowns, 1000);

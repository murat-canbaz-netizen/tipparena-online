const superAdminSection = document.querySelector("#superadmin");
const superAdminForm = document.querySelector("#superAdminForm");
const superAdminMessage = document.querySelector("#superAdminMessage");
const superAdminStats = document.querySelector("#superAdminStats");
const superAdminRooms = document.querySelector("#superAdminRooms");
const adminSessionKey = "tipparenaAdminCode";
let superAdminResults = null;
let superAdminResultDiagnostics = null;
const expandedAdminRooms = new Set();
const allowedAdminAvatars = new Set(["panda", "koala", "shark", "lion", "croc", "giraffe", "rhino", "axolotl"]);

function storedAdminCode() {
  try {
    return sessionStorage.getItem(adminSessionKey) || "";
  } catch {
    return "";
  }
}

function storeAdminCode(adminCode) {
  try {
    sessionStorage.setItem(adminSessionKey, adminCode);
  } catch {
    // The admin flow still works when session storage is unavailable.
  }
}

function clearAdminCode() {
  try {
    sessionStorage.removeItem(adminSessionKey);
  } catch {
    // Nothing else is required when session storage is unavailable.
  }
}

function isSuperAdminView() {
  return window.location.hash === "#superadmin";
}

function updateSuperAdminView() {
  document.body.classList.toggle("is-superadmin", isSuperAdminView());
}

function escapeAdminText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatAdminDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

function formatAdminKickoff(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

function adminMatchKickoff(match) {
  if (!match) return null;
  if (match.kickoff) {
    const parsed = Date.parse(match.kickoff);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (!match.date || !match.time) return null;
  const [day, month, year] = String(match.date).split(".").map(Number);
  const [hour, minute] = String(match.time).split(":").map(Number);
  const parsed = new Date(year, month - 1, day, hour, minute).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function adminMatchKickoffLabel(match) {
  if (!match) return "-";
  if (match.kickoff) return formatAdminKickoff(match.kickoff);
  return `${match.date || "-"} ${match.time || ""}`.trim();
}

function adminAvatarPath(avatar) {
  const safeAvatar = allowedAdminAvatars.has(String(avatar)) ? String(avatar) : "panda";
  return `/avatars/${safeAvatar}.png`;
}

function renderMissingPicks(player) {
  const missingPicks = Array.isArray(player.missingPicks) ? player.missingPicks : [];
  if (!missingPicks.length) return '<p class="superadmin-picks-complete">Alle Spiele wurden getippt.</p>';
  return `
    <details class="superadmin-missing-picks">
      <summary>Fehlende Tipps anzeigen (${missingPicks.length})</summary>
      <div class="superadmin-missing-list">
        ${missingPicks.map((match) => `
          <div class="${match.closed ? "is-closed" : "is-open"}">
            <span>Gruppe ${escapeAdminText(match.group)} · ${escapeAdminText(formatAdminDate(match.kickoff))}</span>
            <strong>${escapeAdminText(match.home)} – ${escapeAdminText(match.away)}</strong>
            <em>${match.closed ? "bereits geschlossen" : "noch tippbar"}</em>
          </div>`).join("")}
      </div>
    </details>`;
}

function renderPickDiagnostics(player) {
  const picks = Array.isArray(player.pickDetails) ? player.pickDetails : [];
  const adjustments = Array.isArray(player.pointAdjustments) ? player.pointAdjustments : [];
  const adjustmentRows = adjustments.length
    ? adjustments.map((entry) => `
        <tr>
          <td>${Number(entry.points || 0) > 0 ? "+" : ""}${Number(entry.points || 0)}</td>
          <td>${escapeAdminText(entry.reason || "-")}</td>
          <td>${escapeAdminText(formatAdminDate(entry.createdAt))}</td>
          <td><button type="button" data-delete-adjustment="${escapeAdminText(entry.id)}" data-player-id="${escapeAdminText(player.id)}">Löschen</button></td>
        </tr>`).join("")
    : '<tr><td colspan="4">Keine Korrekturen gespeichert.</td></tr>';
  return `
    <details class="superadmin-pick-debug">
      <summary>Gespeicherte Tipps prüfen</summary>
      <div class="superadmin-pick-debug-meta">playerId: <code>${escapeAdminText(player.id)}</code></div>
      <div class="superadmin-points-summary">
        <span>Tipp-Punkte <b>${Number(player.tipPoints || 0)}</b></span>
        <span>Korrekturpunkte <b>${Number(player.adjustmentPoints || 0) > 0 ? "+" : ""}${Number(player.adjustmentPoints || 0)}</b></span>
        <span>Gesamt <b>${Number((player.totalPoints ?? player.points) || 0)}</b></span>
      </div>
      ${picks.length ? `<div class="superadmin-pick-debug-scroll">
        <table>
          <thead><tr><th>Spiel</th><th>matchId</th><th>Tipp</th><th>Ergebnis</th><th>Punkte</th></tr></thead>
          <tbody>
            ${picks.map((pick) => {
              const matchLabel = pick.home && pick.away
                ? `${pick.home} – ${pick.away}`
                : pick.matchId;
              const resultLabel = pick.result
                ? `${Number(pick.result.homeScore)}:${Number(pick.result.awayScore)}`
                : "kein Ergebnis";
              return `
                <tr>
                  <td><span>Gruppe ${escapeAdminText(pick.group || "-")}</span><strong>${escapeAdminText(matchLabel)}</strong></td>
                  <td><code>${escapeAdminText(pick.matchId)}</code></td>
                  <td>${Number(pick.homeScore)}:${Number(pick.awayScore)}</td>
                  <td>${escapeAdminText(resultLabel)}</td>
                  <td><b>${Number(pick.points || 0)} Pkt.</b></td>
                </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>` : '<p class="superadmin-pick-debug-empty">Noch keine gespeicherten Tipps für diesen Spieler.</p>'}
      <div class="superadmin-pick-debug-scroll superadmin-adjustment-history">
        <table>
          <thead><tr><th>Korrektur</th><th>Grund</th><th>Datum</th><th>Aktion</th></tr></thead>
          <tbody>${adjustmentRows}</tbody>
        </table>
      </div>
    </details>`;
}

function renderPointAdjustmentForm(player, room) {
  const adjustmentPoints = Number(player.adjustmentPoints || 0);
  return `
    <details class="superadmin-point-adjustment">
      <summary>Punkte korrigieren</summary>
      <form data-point-adjustment="${escapeAdminText(player.id)}" data-room-code="${escapeAdminText(room.roomCode)}">
        <label>Punkte<input name="points" type="number" min="-50" max="50" step="1" placeholder="+2" required /></label>
        <label>Grund<input name="reason" type="text" maxlength="160" placeholder="z. B. Neuseeland – Iran" required /></label>
        <button type="submit">Korrektur speichern</button>
        <p>Korrektur aktuell: <b>${adjustmentPoints > 0 ? "+" : ""}${adjustmentPoints}</b></p>
      </form>
    </details>`;
}

function renderPlayerProfileDiagnostics(player) {
  const duplicates = Array.isArray(player.duplicateProfiles) ? player.duplicateProfiles : [];
  return `
    <details class="superadmin-profile-debug ${duplicates.length ? "has-duplicates" : ""}">
      <summary>Spielerprofil prÃ¼fen</summary>
      ${duplicates.length ? '<p class="superadmin-profile-warning">Achtung: Es gibt mehrere Profile mit Ã¤hnlichem Nicknamen.</p>' : ""}
      <div class="superadmin-profile-grid">
        <span>playerId <code>${escapeAdminText(player.id)}</code></span>
        <span>Normalisierter Name <b>${escapeAdminText(player.normalizedNickname || "-")}</b></span>
        <span>Gespeicherte Tipps <b>${Number(player.pickCount || 0)}</b></span>
        <span>Gewertete Tipps <b>${Number(player.valuedPickCount || 0)}</b></span>
        <span>Tipp-Punkte <b>${Number(player.tipPoints || 0)}</b></span>
        <span>Korrekturpunkte <b>${Number(player.adjustmentPoints || 0) > 0 ? "+" : ""}${Number(player.adjustmentPoints || 0)}</b></span>
        <span>Gesamtpunkte <b>${Number((player.totalPoints ?? player.points) || 0)}</b></span>
        <span>Letzte Speicherung <b>${escapeAdminText(formatAdminDate(player.lastPickAt))}</b></span>
      </div>
      ${duplicates.length ? `
        <div class="superadmin-profile-duplicates">
          <strong>MÃ¶gliche doppelte Profile</strong>
          <table>
            <thead><tr><th>Nickname</th><th>playerId</th><th>Tipps</th><th>Gewertet</th><th>Punkte</th><th>Letzte Speicherung</th></tr></thead>
            <tbody>
              ${duplicates.map((entry) => `
                <tr>
                  <td>${escapeAdminText(entry.nickname)}</td>
                  <td><code>${escapeAdminText(entry.id)}</code></td>
                  <td>${Number(entry.pickCount || 0)}</td>
                  <td>${Number(entry.valuedPickCount || 0)}</td>
                  <td>${Number(entry.totalPoints || 0)}</td>
                  <td>${escapeAdminText(formatAdminDate(entry.lastPickAt))}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>` : '<p class="superadmin-profile-ok">Keine Ã¤hnlichen Profile in diesem Raum gefunden.</p>'}
    </details>`;
}

function renderAdminPlayers(room) {
  const players = Array.isArray(room.players) ? room.players : [];
  if (!players.length) return '<p class="superadmin-player-empty">Noch keine Spieler in diesem Raum.</p>';
  const matches = window.tipparenaMatchCatalog || [];
  return `
    <div class="superadmin-player-list">
      ${players.map((player) => {
        const pickCount = Number(player.pickCount || 0);
        const missingOpenCount = Number(player.missingOpenCount || 0);
        const statusClass = pickCount === 0 ? "is-empty" : missingOpenCount === 0 ? "is-complete" : "is-partial";
        const statusText = pickCount === 0
          ? "Noch keine Tipps gespeichert"
          : missingOpenCount === 0
            ? "Alle offenen Spiele getippt"
            : `${missingOpenCount} offene Tipps fehlen`;
        return `
        <article class="superadmin-player ${statusClass}">
          <img src="${adminAvatarPath(player.avatar)}" alt="" />
          <strong>${escapeAdminText(player.nickname)}</strong>
          <span><b>${pickCount}</b> Tipps gespeichert</span>
          <span><b>${Number((player.totalPoints ?? player.points) || 0)}</b> Punkte gesamt</span>
          <small class="superadmin-player-points">Tipp-Punkte: ${Number(player.tipPoints || 0)} · Korrektur: ${Number(player.adjustmentPoints || 0) > 0 ? "+" : ""}${Number(player.adjustmentPoints || 0)}</small>
          <p class="superadmin-pick-status">${escapeAdminText(statusText)}</p>
          ${renderMissingPicks(player)}
          ${renderPlayerProfileDiagnostics(player)}
          ${renderPickDiagnostics(player)}
          ${renderPointAdjustmentForm(player, room)}
          <details class="superadmin-admin-pick">
            <summary>Tipp nachtragen</summary>
            <form data-admin-pick="${escapeAdminText(player.id)}" data-room-code="${escapeAdminText(room.roomCode)}">
              <label class="superadmin-admin-pick-match">Spiel<select name="matchId" required>
                <option value="">Spiel auswählen</option>
                ${matches.map((match) => `<option value="${escapeAdminText(match.id)}">Gruppe ${escapeAdminText(match.group)} · ${escapeAdminText(match.home)} – ${escapeAdminText(match.away)}</option>`).join("")}
              </select></label>
              <label class="superadmin-admin-pick-score">Heim<input name="homeScore" type="number" min="0" max="20" value="0" required /></label>
              <label class="superadmin-admin-pick-score">Auswärts<input name="awayScore" type="number" min="0" max="20" value="0" required /></label>
              <button class="superadmin-admin-pick-save" type="submit" name="adminPickAction" value="save">Tipp speichern</button>
              <button class="superadmin-admin-pick-test" type="submit" name="adminPickAction" value="test">Speicher-Test</button>
              <p role="status"></p>
            </form>
          </details>
        </article>`;
      }).join("")}
    </div>`;
}

function renderSuperAdmin(data) {
  superAdminStats.innerHTML = `
    <article><span>Klassenräume gesamt</span><strong>${Number(data.totalRooms || 0)}</strong></article>
    <article><span>Spieler gesamt</span><strong>${Number(data.totalPlayers || 0)}</strong></article>
    <article><span>Tipps gesamt</span><strong>${Number(data.totalPicks || 0)}</strong></article>
  `;

  const rooms = Array.isArray(data.rooms) ? data.rooms : [];
  superAdminRooms.innerHTML = rooms.length
    ? `
      <div class="superadmin-table-wrap">
        <table class="superadmin-table">
          <thead><tr><th>Schule</th><th>Klasse</th><th>Raum-Code</th><th>Lehrer-Code</th><th>Spieler</th><th>Tipps</th><th>Erstellt am</th><th>Letzte Aktivität</th><th>Aktion</th></tr></thead>
          <tbody>${rooms.map((room) => {
            const expanded = expandedAdminRooms.has(room.roomCode);
            const playerCount = Number(room.playerCount || 0);
            const playerLimit = Number(room.playerLimit || 0);
            const limitExceeded = playerLimit > 0 && playerCount > playerLimit;
            return `
            <tr class="superadmin-room-row${limitExceeded ? " is-over-capacity" : ""}">
              <td>${escapeAdminText(room.schoolName)}</td>
              <td>${escapeAdminText(room.className)}</td>
              <td><code>${escapeAdminText(room.roomCode)}</code></td>
              <td><code>${escapeAdminText(room.teacherCode || "-")}</code></td>
              <td>
                <button class="superadmin-player-toggle" type="button" data-toggle-players="${escapeAdminText(room.roomCode)}" aria-expanded="${expanded}">${expanded ? "Spieler ausblenden" : `${playerCount} / ${playerLimit || "–"} Spieler`}</button>
                ${limitExceeded ? '<small class="superadmin-capacity-warning">Limit überschritten</small>' : ""}
                <form class="superadmin-limit-form" data-room-limit="${escapeAdminText(room.roomCode)}">
                  <label>Limit ändern<input name="playerLimit" type="number" min="${Math.max(1, playerCount)}" max="35" value="${playerLimit || Math.max(1, playerCount)}" required /></label>
                  <button type="submit">Speichern</button>
                </form>
              </td>
              <td>${Number(room.pickCount || 0)}</td>
              <td>${escapeAdminText(formatAdminDate(room.createdAt))}</td>
              <td>${escapeAdminText(formatAdminDate(room.lastActivity))}</td>
              <td><button class="superadmin-room-delete" type="button" data-delete-room="${escapeAdminText(room.roomCode)}" data-room-school="${escapeAdminText(room.schoolName)}" data-room-class="${escapeAdminText(room.className)}">Raum löschen</button></td>
            </tr>
            <tr class="superadmin-player-detail"${expanded ? "" : " hidden"} data-player-detail="${escapeAdminText(room.roomCode)}">
              <td colspan="9">${renderAdminPlayers(room)}</td>
            </tr>`;
          }).join("")}</tbody>
        </table>
      </div>`
    : '<p class="superadmin-empty">Noch keine Klassenräume vorhanden.</p>';
}

function addResultsSection() {
  if (!superAdminSection || superAdminResults) return;
  superAdminResults = document.createElement("section");
  superAdminResults.className = "superadmin-results";
  superAdminResults.innerHTML = `
    <div class="superadmin-results-heading">
      <div><span>Notlösung</span><h3>Spielergebnisse manuell eintragen</h3></div>
      <p>Manuelle Ergebnisse haben Vorrang vor API-Football.</p>
    </div>
    <div id="superAdminResultDiagnostics"></div>
    <div id="superAdminResultsList"></div>
    <p id="superAdminResultsMessage" role="status"></p>
  `;
  superAdminRooms?.after(superAdminResults);
}

function buildEvaluationAudit(manualResults, apiFixtures, overview) {
  const matches = window.tipparenaMatchCatalog || [];
  const matchById = new Map(matches.map((match) => [String(match.id), match]));
  const apiByMatch = new Map(
    (Array.isArray(apiFixtures) ? apiFixtures : [])
      .filter((fixture) => fixture?.matchId)
      .map((fixture) => [String(fixture.matchId), fixture]),
  );
  const pickCountByMatch = new Map();
  const rooms = Array.isArray(overview?.rooms) ? overview.rooms : [];
  rooms.forEach((room) => {
    (Array.isArray(room.players) ? room.players : []).forEach((player) => {
      (Array.isArray(player.pickDetails) ? player.pickDetails : []).forEach((pick) => {
        const matchId = String(pick.matchId || "");
        if (!matchId) return;
        pickCountByMatch.set(matchId, (pickCountByMatch.get(matchId) || 0) + 1);
      });
    });
  });

  const manualRows = (Array.isArray(manualResults) ? manualResults : [])
    .map((result) => {
      const matchId = String(result.match_id || "");
      const match = matchById.get(matchId);
      const fixture = apiByMatch.get(matchId);
      const apiScoreReady = Number.isFinite(Number(fixture?.goals?.home)) && Number.isFinite(Number(fixture?.goals?.away));
      const manualScoreReady = Number.isFinite(Number(result.home_score)) && Number.isFinite(Number(result.away_score));
      const inCatalog = Boolean(match);
      const inApiResults = Boolean(fixture);
      const finished = result.status === "finished";
      const counted = inCatalog && inApiResults && fixture?.status === "finished" && apiScoreReady;
      const problems = [];
      if (!inCatalog) problems.push("matchId nicht im Spielkatalog");
      if (!finished) problems.push("Status nicht finished");
      if (!manualScoreReady) problems.push("Ergebnis fehlt");
      if (!inApiResults) problems.push("nicht von /api/results geliefert");
      if (inApiResults && fixture?.status !== "finished") problems.push("in /api/results nicht finished");
      if (inApiResults && !apiScoreReady) problems.push("Ergebnis in /api/results fehlt");
      const pickCount = pickCountByMatch.get(matchId) || 0;
      if (counted && pickCount === 0) problems.push("keine Tipps vorhanden");
      return {
        matchId,
        match,
        teams: match ? `${match.home} - ${match.away}` : "Unbekannt",
        result: manualScoreReady ? `${Number(result.home_score)}:${Number(result.away_score)}` : "-",
        status: result.status || "-",
        source: fixture?.manual ? "manual_results" : fixture ? "api_football" : "manual_results",
        inCatalog,
        inApiResults,
        counted,
        pickCount,
        problem: problems.length ? problems.join("; ") : "-",
        updatedAt: result.updated_at || null,
        kickoffTime: adminMatchKickoff(match),
      };
    })
    .sort((left, right) => (left.kickoffTime ?? Number.MAX_SAFE_INTEGER) - (right.kickoffTime ?? Number.MAX_SAFE_INTEGER) || left.matchId.localeCompare(right.matchId));

  const countedRows = manualRows.filter((row) => row.counted);
  const latestCounted = countedRows.reduce((latest, row) => {
    if (!latest) return row;
    const left = row.kickoffTime ?? -Infinity;
    const right = latest.kickoffTime ?? -Infinity;
    return left > right ? row : latest;
  }, null);
  const recentManual = [...manualRows]
    .filter((row) => row.updatedAt)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 10);

  return {
    totalManual: manualRows.length,
    inCatalog: manualRows.filter((row) => row.inCatalog).length,
    inApiResults: manualRows.filter((row) => row.inApiResults).length,
    counted: countedRows.length,
    notCounted: manualRows.filter((row) => !row.counted).length,
    rows: manualRows,
    latestCounted,
    lastCountedByKickoff: countedRows.slice(-10),
    recentManual,
    playerPoints: rooms.flatMap((room) => (Array.isArray(room.players) ? room.players : []).map((player) => ({
      roomCode: room.roomCode,
      nickname: player.nickname,
      pickCount: Number(player.pickCount || 0),
      valuedPickCount: (Array.isArray(player.pickDetails) ? player.pickDetails : []).filter((pick) => pick.result).length,
      tipPoints: Number(player.tipPoints || 0),
      adjustmentPoints: Number(player.adjustmentPoints || 0),
      totalPoints: Number((player.totalPoints ?? player.points) || 0),
    }))),
  };
}

function renderResultDiagnostics(diagnostics, manualResults = [], apiFixtures = [], overview = {}) {
  addResultsSection();
  superAdminResultDiagnostics = diagnostics || null;
  const target = superAdminResults?.querySelector("#superAdminResultDiagnostics");
  if (!target) return;
  if (!diagnostics) {
    target.innerHTML = "";
    return;
  }
  const audit = buildEvaluationAudit(manualResults, apiFixtures, overview);
  const latest = diagnostics.latestCountedMatch;
  const rows = Array.isArray(diagnostics.lastFinishedMatches) ? diagnostics.lastFinishedMatches : [];
  target.innerHTML = `
    <details class="superadmin-result-diagnostics" open>
      <summary>Ergebnis-Diagnose</summary>
      <div class="superadmin-result-diagnostics-summary">
        <span>Manuelle Ergebnisse: <b>${Number(diagnostics.manualResultCount || 0)}</b></span>
        <span>Letztes gewertetes Spiel: <b>${latest ? `${escapeAdminText(latest.matchId)} · ${escapeAdminText(latest.teams)} · ${escapeAdminText(latest.result || "-")}` : "-"}</b></span>
      </div>
      <div class="superadmin-result-diagnostics-scroll">
        <table>
          <thead><tr><th>matchId</th><th>Gruppe</th><th>Kickoff</th><th>Spiel</th><th>Ergebnis</th><th>Status</th><th>Quelle</th><th>Gewertet</th></tr></thead>
          <tbody>
            ${rows.length ? rows.map((entry) => `
              <tr>
                <td><code>${escapeAdminText(entry.matchId)}</code></td>
                <td>${escapeAdminText(entry.group || "-")}</td>
                <td>${escapeAdminText(formatAdminKickoff(entry.kickoff))}</td>
                <td>${escapeAdminText(entry.teams)}</td>
                <td>${escapeAdminText(entry.result || "-")}</td>
                <td>${escapeAdminText(entry.status || "-")}</td>
                <td>${escapeAdminText(entry.source || "-")}</td>
                <td>${entry.counted ? "ja" : "nein"}</td>
              </tr>`).join("") : '<tr><td colspan="8">Noch keine beendeten Spiele erkannt.</td></tr>'}
          </tbody>
        </table>
      </div>
    </details>
    <details class="superadmin-result-diagnostics superadmin-evaluation-audit" open>
      <summary>BewertungsprÃ¼fung</summary>
      <div class="superadmin-result-diagnostics-summary superadmin-audit-grid">
        <span>Manuelle Ergebnisse insgesamt <b>${audit.totalManual}</b></span>
        <span>Im Spielkatalog gefunden <b>${audit.inCatalog}</b></span>
        <span>Von /api/results geladen <b>${audit.inApiResults}</b></span>
        <span>FÃ¼r Rangliste gewertet <b>${audit.counted}</b></span>
        <span>Nicht gewertet <b>${audit.notCounted}</b></span>
        <span>Letztes gewertetes Spiel <b>${audit.latestCounted ? `${escapeAdminText(audit.latestCounted.matchId)} Â· ${escapeAdminText(audit.latestCounted.teams)} Â· ${escapeAdminText(audit.latestCounted.result)}` : "-"}</b></span>
      </div>
      <div class="superadmin-result-diagnostics-scroll">
        <table>
          <thead><tr><th>MatchId</th><th>Spiel</th><th>Kickoff</th><th>Ergebnis</th><th>Status</th><th>Quelle</th><th>In /api/results</th><th>Wird gewertet</th><th>Tipps</th><th>Problem</th></tr></thead>
          <tbody>
            ${audit.rows.length ? audit.rows.map((row) => `
              <tr class="${row.counted ? "is-counted" : "is-not-counted"}">
                <td><code>${escapeAdminText(row.matchId)}</code></td>
                <td>${escapeAdminText(row.teams)}</td>
                <td>${escapeAdminText(adminMatchKickoffLabel(row.match))}</td>
                <td>${escapeAdminText(row.result)}</td>
                <td>${escapeAdminText(row.status)}</td>
                <td>${escapeAdminText(row.source)}</td>
                <td>${row.inApiResults ? "ja" : "nein"}</td>
                <td>${row.counted ? "ja" : "nein"}</td>
                <td>${row.pickCount}</td>
                <td>${escapeAdminText(row.problem)}</td>
              </tr>`).join("") : '<tr><td colspan="10">Keine manuellen Ergebnisse gespeichert.</td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="superadmin-audit-columns">
        <section>
          <h4>Letzte 10 gewerteten Spiele nach Kickoff</h4>
          <ul>${audit.lastCountedByKickoff.length ? audit.lastCountedByKickoff.map((row) => `<li><code>${escapeAdminText(row.matchId)}</code> ${escapeAdminText(adminMatchKickoffLabel(row.match))} Â· ${escapeAdminText(row.teams)} Â· ${escapeAdminText(row.result)}</li>`).join("") : "<li>-</li>"}</ul>
        </section>
        <section>
          <h4>Letzte 10 manuelle Ergebnisse nach Speicherung</h4>
          <ul>${audit.recentManual.length ? audit.recentManual.map((row) => `<li><code>${escapeAdminText(row.matchId)}</code> ${escapeAdminText(formatAdminDate(row.updatedAt))} Â· ${escapeAdminText(row.teams)} Â· ${escapeAdminText(row.result)}</li>`).join("") : "<li>-</li>"}</ul>
        </section>
      </div>
      <details class="superadmin-player-points-audit">
        <summary>PunkteprÃ¼fung pro Spieler</summary>
        <div class="superadmin-result-diagnostics-scroll">
          <table>
            <thead><tr><th>Raum</th><th>Spieler</th><th>Tipps</th><th>Gewertete Tipps</th><th>Tipp-Punkte</th><th>Korrektur</th><th>Gesamt</th></tr></thead>
            <tbody>
              ${audit.playerPoints.length ? audit.playerPoints.map((player) => `
                <tr>
                  <td><code>${escapeAdminText(player.roomCode)}</code></td>
                  <td>${escapeAdminText(player.nickname)}</td>
                  <td>${player.pickCount}</td>
                  <td>${player.valuedPickCount}</td>
                  <td>${player.tipPoints}</td>
                  <td>${player.adjustmentPoints > 0 ? "+" : ""}${player.adjustmentPoints}</td>
                  <td><b>${player.totalPoints}</b></td>
                </tr>`).join("") : '<tr><td colspan="7">Noch keine Spieler vorhanden.</td></tr>'}
            </tbody>
          </table>
        </div>
      </details>
    </details>
  `;
}

function renderAdminResults(results) {
  addResultsSection();
  const list = superAdminResults?.querySelector("#superAdminResultsList");
  if (!list) return;
  const savedByMatch = new Map((results || []).map((result) => [result.match_id, result]));
  const matches = window.tipparenaMatchCatalog || [];
  list.innerHTML = matches.map((match) => {
    const saved = savedByMatch.get(match.id) || {};
    const status = saved.status || "open";
    return `
      <form class="superadmin-result-row" data-admin-result="${escapeAdminText(match.id)}">
        <div class="superadmin-result-match">
          <span>Gruppe ${escapeAdminText(match.group)} · ${escapeAdminText(match.date)} · ${escapeAdminText(match.time)}</span>
          <strong>${escapeAdminText(match.home)} – ${escapeAdminText(match.away)}</strong>
        </div>
        <label>Heim<input name="homeScore" type="number" min="0" max="20" value="${Number(saved.home_score ?? 0)}" required /></label>
        <label>Gast<input name="awayScore" type="number" min="0" max="20" value="${Number(saved.away_score ?? 0)}" required /></label>
        <label>Status<select name="status">
          <option value="open"${status === "open" ? " selected" : ""}>Offen</option>
          <option value="live"${status === "live" ? " selected" : ""}>Live</option>
          <option value="finished"${status === "finished" ? " selected" : ""}>Beendet</option>
        </select></label>
        <label>Minute<input name="minute" type="number" min="0" max="150" value="${saved.minute ?? ""}" /></label>
        <button type="submit">Ergebnis speichern</button>
      </form>`;
  }).join("");
}

async function loadAdminOverview(adminCode) {
  const options = (body) => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const [overviewResponse, resultsResponse, diagnosisResponse] = await Promise.all([
    fetch("/api/admin", { ...options({ adminCode }), cache: "no-store" }),
    fetch("/api/admin-results", { ...options({ adminCode, action: "list" }), cache: "no-store" }),
    fetch(`/api/results?debug=1&t=${Date.now()}`, { cache: "no-store" }),
  ]);
  const overview = await overviewResponse.json().catch(() => ({}));
  const resultData = await resultsResponse.json().catch(() => ({}));
  const diagnosisData = await diagnosisResponse.json().catch(() => ({}));
  if (!overviewResponse.ok) {
    const error = new Error(overview.error || "Adminbereich konnte nicht geladen werden.");
    error.status = overviewResponse.status;
    throw error;
  }
  if (!resultsResponse.ok) {
    const error = new Error(resultData.error || "Manuelle Ergebnisse konnten nicht geladen werden.");
    error.status = resultsResponse.status;
    throw error;
  }
  renderSuperAdmin(overview);
  renderResultDiagnostics(diagnosisData.resultDiagnostics || null, resultData.results, diagnosisData.fixtures, overview);
  renderAdminResults(resultData.results);
}

async function refreshAdminAndLeaderboard(adminCode) {
  await loadAdminOverview(adminCode);
  try {
    if (typeof window.tipparenaRefreshResults === "function") {
      await window.tipparenaRefreshResults();
    } else if (typeof window.tipparenaRefreshPicks === "function") {
      await window.tipparenaRefreshPicks();
    }
  } catch {
    if (typeof window.tipparenaRefreshPicks === "function") await window.tipparenaRefreshPicks();
  }
}

function addDangerZone() {
  if (!superAdminSection || document.querySelector("#superAdminResetForm")) return;
  const dangerZone = document.createElement("section");
  dangerZone.className = "superadmin-danger-zone";
  dangerZone.innerHTML = `
    <div>
      <span>Gefahr-Zone</span>
      <h3>Alle Klassenräume vollständig löschen</h3>
      <p>Entfernt alle Räume, Spieler, Tipps und Lehrer-Zuordnungen unwiderruflich.</p>
    </div>
    <form id="superAdminResetForm">
      <label>Admin-Code<input name="adminCode" type="password" autocomplete="current-password" required /></label>
      <label>Zur Bestätigung RESET eingeben<input name="confirmation" autocomplete="off" required /></label>
      <button class="superadmin-delete-button" type="submit">Alle Räume löschen</button>
      <p id="superAdminResetMessage" role="status"></p>
    </form>
  `;
  superAdminSection.querySelector(".superadmin-shell")?.append(dangerZone);

  dangerZone.querySelector("#superAdminResetForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const adminCode = String(formData.get("adminCode") || "");
    const confirmation = String(formData.get("confirmation") || "");
    const message = dangerZone.querySelector("#superAdminResetMessage");

    if (confirmation !== "RESET") {
      message.textContent = "Bitte RESET exakt eingeben.";
      return;
    }
    if (!window.confirm("Bist du sicher? Alle Räume, Spieler und Tipps werden gelöscht.")) return;

    message.textContent = "Alle Daten werden gelöscht...";
    try {
      const response = await fetch("/api/admin-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminCode, confirmation }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        message.textContent = data.error || "Löschen ist fehlgeschlagen.";
        return;
      }
      await loadAdminOverview(adminCode);
      message.textContent = `${data.deletedRooms} Räume, ${data.deletedPlayers} Spieler und ${data.deletedPicks} Tipps gelöscht.`;
      form.reset();
    } catch (error) {
      message.textContent = error.message || "Löschen ist fehlgeschlagen.";
    }
  });
}

superAdminForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const adminCode = String(new FormData(superAdminForm).get("adminCode") || "");
  superAdminMessage.textContent = "Übersicht wird geladen...";
  try {
    await loadAdminOverview(adminCode);
    storeAdminCode(adminCode);
    superAdminMessage.textContent = "Private Übersicht geladen.";
    superAdminForm.reset();
  } catch (error) {
    if (error.status === 401) clearAdminCode();
    superAdminMessage.textContent = error.message || "Adminbereich ist momentan nicht erreichbar.";
  }
});

superAdminSection?.addEventListener("submit", async (event) => {
  const pickForm = event.target.closest("[data-admin-pick]");
  if (pickForm) {
    event.preventDefault();
    const adminCode = storedAdminCode();
    const message = pickForm.querySelector('[role="status"]');
    if (!adminCode) {
      message.textContent = "Bitte zuerst den Admin-Code oben eingeben.";
      return;
    }
    const action = event.submitter?.value === "test" ? "test" : "save";
    const button = event.submitter || pickForm.querySelector("button");
    const originalLabel = button.textContent;
    const values = new FormData(pickForm);
    const payload = {
      adminCode,
      roomCode: pickForm.dataset.roomCode,
      playerId: pickForm.dataset.adminPick,
      matchId: values.get("matchId"),
      homeScore: values.get("homeScore"),
      awayScore: values.get("awayScore"),
      action,
      overwrite: false,
    };
    button.disabled = true;
    button.textContent = action === "test" ? "Teste..." : "Speichere...";
    message.textContent = action === "test" ? "Speicher-Test läuft..." : "Tipp wird gespeichert...";
    try {
      let response = await fetch("/api/admin-pick", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data = await response.json().catch(() => ({}));
      if (action === "test") {
        if (!response.ok) {
          if (response.status === 401) clearAdminCode();
          throw new Error(data.error || "Speicher-Test konnte nicht ausgeführt werden.");
        }
        message.textContent = `${data.wouldSave ? "Würde speichern: ja" : "Würde speichern: nein"} · ${data.reason || "-"}${data.existingPick ? ` · vorhandener Tipp: ${data.existingPick.homeScore}:${data.existingPick.awayScore}` : ""}`;
        return;
      }
      if (response.status === 409) {
        if (!window.confirm(data.error || "Für dieses Kind gibt es bereits einen Tipp. Wirklich überschreiben?")) {
          message.textContent = "Bestehender Tipp wurde nicht verändert.";
          return;
        }
        response = await fetch("/api/admin-pick", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, overwrite: true }),
        });
        data = await response.json().catch(() => ({}));
      }
      if (!response.ok) {
        if (response.status === 401) clearAdminCode();
        throw new Error(data.error || "Tipp konnte nicht gespeichert werden.");
      }
      await refreshAdminAndLeaderboard(adminCode);
      superAdminMessage.textContent = data.overwritten ? "Tipp überschrieben ✓" : "Tipp nachgetragen ✓";
    } catch (error) {
      message.textContent = error.message || "Tipp konnte nicht gespeichert werden.";
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
    return;
  }

  const adjustmentForm = event.target.closest("[data-point-adjustment]");
  if (adjustmentForm) {
    event.preventDefault();
    const adminCode = storedAdminCode();
    const message = adjustmentForm.querySelector("p");
    if (!adminCode) {
      message.textContent = "Bitte zuerst den Admin-Code oben eingeben.";
      return;
    }
    const button = adjustmentForm.querySelector("button");
    const originalLabel = button.textContent;
    const values = new FormData(adjustmentForm);
    button.disabled = true;
    button.textContent = "Speichere...";
    message.textContent = "Korrektur wird gespeichert...";
    try {
      const response = await fetch("/api/admin-point-adjustments", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminCode,
          action: "save",
          roomCode: adjustmentForm.dataset.roomCode,
          playerId: adjustmentForm.dataset.pointAdjustment,
          points: values.get("points"),
          reason: values.get("reason"),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) clearAdminCode();
        throw new Error(data.error || "Korrektur konnte nicht gespeichert werden.");
      }
      await refreshAdminAndLeaderboard(adminCode);
      superAdminMessage.textContent = "Punkte-Korrektur gespeichert ✓";
    } catch (error) {
      message.textContent = error.message || "Korrektur konnte nicht gespeichert werden.";
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
    return;
  }

  const limitForm = event.target.closest("[data-room-limit]");
  if (limitForm) {
    event.preventDefault();
    const adminCode = storedAdminCode();
    if (!adminCode) {
      superAdminMessage.textContent = "Bitte zuerst den Admin-Code oben eingeben.";
      return;
    }
    const button = limitForm.querySelector("button");
    const originalLabel = button.textContent;
    const playerLimit = Number(new FormData(limitForm).get("playerLimit"));
    button.disabled = true;
    button.textContent = "Speichere...";
    superAdminMessage.textContent = "Schülerlimit wird gespeichert...";
    try {
      const response = await fetch("/api/admin-room-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminCode, roomCode: limitForm.dataset.roomLimit, playerLimit }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) clearAdminCode();
        throw new Error(data.error || "Schülerlimit konnte nicht gespeichert werden.");
      }
      await loadAdminOverview(adminCode);
      superAdminMessage.textContent = `Schülerlimit auf ${data.playerLimit} gesetzt ✓`;
    } catch (error) {
      button.disabled = false;
      button.textContent = originalLabel;
      superAdminMessage.textContent = error.message || "Schülerlimit konnte nicht gespeichert werden.";
    }
    return;
  }

  const form = event.target.closest("[data-admin-result]");
  if (!form) return;
  event.preventDefault();
  const message = superAdminResults?.querySelector("#superAdminResultsMessage");
  const adminCode = storedAdminCode();
  if (!adminCode) {
    if (message) message.textContent = "Bitte zuerst den Admin-Code oben eingeben.";
    return;
  }

  const button = form.querySelector("button");
  const values = new FormData(form);
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Speichere...";
  if (message) message.textContent = "Speichere...";
  try {
    const response = await fetch("/api/admin-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminCode,
        action: "save",
        matchId: form.dataset.adminResult,
        homeScore: values.get("homeScore"),
        awayScore: values.get("awayScore"),
        status: values.get("status"),
        minute: values.get("minute"),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) clearAdminCode();
      throw new Error(data.error || "Ergebnis konnte nicht gespeichert werden.");
    }
    await refreshAdminAndLeaderboard(adminCode);
    button.textContent = "Ergebnis gespeichert ✓";
    if (message) message.textContent = data.warning || "Ergebnis gespeichert ✓";
  } catch (error) {
    if (message) message.textContent = error.message || "Ergebnis konnte nicht gespeichert werden.";
    button.textContent = "Speichern fehlgeschlagen";
  } finally {
    button.disabled = false;
    setTimeout(() => {
      button.textContent = originalLabel;
    }, 1800);
  }
});

superAdminRooms?.addEventListener("click", async (event) => {
  const adjustmentDelete = event.target.closest("[data-delete-adjustment]");
  if (adjustmentDelete) {
    const adminCode = storedAdminCode();
    if (!adminCode) {
      superAdminMessage.textContent = "Bitte zuerst den Admin-Code oben eingeben.";
      return;
    }
    if (!window.confirm("Diese Punkte-Korrektur wirklich löschen?")) return;
    const roomCode = adjustmentDelete.closest("[data-player-detail]")?.dataset.playerDetail || "";
    adjustmentDelete.disabled = true;
    superAdminMessage.textContent = "Korrektur wird gelöscht...";
    try {
      const response = await fetch("/api/admin-point-adjustments", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminCode,
          action: "delete",
          roomCode,
          playerId: adjustmentDelete.dataset.playerId,
          adjustmentId: adjustmentDelete.dataset.deleteAdjustment,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) clearAdminCode();
        throw new Error(data.error || "Korrektur konnte nicht gelöscht werden.");
      }
      await refreshAdminAndLeaderboard(adminCode);
      superAdminMessage.textContent = "Punkte-Korrektur gelöscht ✓";
    } catch (error) {
      superAdminMessage.textContent = error.message || "Korrektur konnte nicht gelöscht werden.";
      adjustmentDelete.disabled = false;
    }
    return;
  }

  const toggle = event.target.closest("[data-toggle-players]");
  if (toggle) {
    const roomCode = toggle.dataset.togglePlayers;
    const detail = superAdminRooms.querySelector(`[data-player-detail="${CSS.escape(roomCode)}"]`);
    const willExpand = detail?.hidden ?? false;
    if (willExpand) expandedAdminRooms.add(roomCode);
    else expandedAdminRooms.delete(roomCode);
    if (detail) detail.hidden = !willExpand;
    toggle.setAttribute("aria-expanded", String(willExpand));
    toggle.textContent = willExpand ? "Spieler ausblenden" : `${detail?.querySelectorAll(".superadmin-player").length || 0} Spieler anzeigen`;
    return;
  }

  const button = event.target.closest("[data-delete-room]");
  if (!button) return;

  const adminCode = storedAdminCode();
  if (!adminCode) {
    superAdminMessage.textContent = "Bitte zuerst den Admin-Code oben eingeben.";
    return;
  }

  const roomCode = button.dataset.deleteRoom;
  const school = button.dataset.roomSchool;
  const className = button.dataset.roomClass;
  const confirmation = [
    "Möchtest du diesen Raum wirklich löschen?",
    `Schule: ${school}`,
    `Klasse: ${className}`,
    `Raum-Code: ${roomCode}`,
    "Dabei werden alle Spieler und Tipps dieses Raums gelöscht.",
  ].join("\n");
  if (!window.confirm(confirmation)) return;

  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Lösche...";
  superAdminMessage.textContent = "Raum wird gelöscht...";
  try {
    const response = await fetch("/api/admin-room-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminCode, roomCode }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) clearAdminCode();
      throw new Error(data.error || "Raum konnte nicht gelöscht werden.");
    }
    await loadAdminOverview(adminCode);
    superAdminMessage.textContent = "Raum gelöscht ✓";
  } catch (error) {
    button.disabled = false;
    button.textContent = originalLabel;
    superAdminMessage.textContent = error.message || "Raum konnte nicht gelöscht werden.";
  }
});

window.addEventListener("hashchange", updateSuperAdminView);
addDangerZone();
addResultsSection();
updateSuperAdminView();

const sessionAdminCode = storedAdminCode();
if (sessionAdminCode) {
  superAdminMessage.textContent = "Private Übersicht wird geladen...";
  loadAdminOverview(sessionAdminCode)
    .then(() => {
      superAdminMessage.textContent = "Private Übersicht geladen.";
    })
    .catch((error) => {
      if (error.status === 401) clearAdminCode();
      superAdminMessage.textContent = error.message || "Adminbereich ist momentan nicht erreichbar.";
    });
}

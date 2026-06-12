const superAdminSection = document.querySelector("#superadmin");
const superAdminForm = document.querySelector("#superAdminForm");
const superAdminMessage = document.querySelector("#superAdminMessage");
const superAdminStats = document.querySelector("#superAdminStats");
const superAdminRooms = document.querySelector("#superAdminRooms");
const adminSessionKey = "tipparenaAdminCode";
let superAdminResults = null;
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

function renderAdminPlayers(room) {
  const players = Array.isArray(room.players) ? room.players : [];
  if (!players.length) return '<p class="superadmin-player-empty">Noch keine Spieler in diesem Raum.</p>';
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
          <span><b>${Number(player.points || 0)}</b> Punkte</span>
          <p class="superadmin-pick-status">${escapeAdminText(statusText)}</p>
          ${renderMissingPicks(player)}
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
            return `
            <tr class="superadmin-room-row">
              <td>${escapeAdminText(room.schoolName)}</td>
              <td>${escapeAdminText(room.className)}</td>
              <td><code>${escapeAdminText(room.roomCode)}</code></td>
              <td><code>${escapeAdminText(room.teacherCode || "-")}</code></td>
              <td><button class="superadmin-player-toggle" type="button" data-toggle-players="${escapeAdminText(room.roomCode)}" aria-expanded="${expanded}">${expanded ? "Spieler ausblenden" : `${Number(room.playerCount || 0)} Spieler anzeigen`}</button></td>
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
    <div id="superAdminResultsList"></div>
    <p id="superAdminResultsMessage" role="status"></p>
  `;
  superAdminRooms?.after(superAdminResults);
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
  const [overviewResponse, resultsResponse] = await Promise.all([
    fetch("/api/admin", options({ adminCode })),
    fetch("/api/admin-results", options({ adminCode, action: "list" })),
  ]);
  const overview = await overviewResponse.json().catch(() => ({}));
  const resultData = await resultsResponse.json().catch(() => ({}));
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
  renderAdminResults(resultData.results);
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
    if (typeof window.tipparenaRefreshResults !== "function") {
      throw new Error("Ergebnis wurde gespeichert, konnte aber nicht sofort aktualisiert werden.");
    }
    await window.tipparenaRefreshResults();
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

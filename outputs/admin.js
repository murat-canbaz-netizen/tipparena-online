const superAdminSection = document.querySelector("#superadmin");
const superAdminForm = document.querySelector("#superAdminForm");
const superAdminMessage = document.querySelector("#superAdminMessage");
const superAdminStats = document.querySelector("#superAdminStats");
const superAdminRooms = document.querySelector("#superAdminRooms");
let superAdminResults = null;

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
          <thead><tr><th>Schule</th><th>Klasse</th><th>Raum-Code</th><th>Lehrer-Code</th><th>Spieler</th><th>Tipps</th><th>Erstellt am</th><th>Letzte Aktivität</th></tr></thead>
          <tbody>${rooms.map((room) => `
            <tr>
              <td>${escapeAdminText(room.schoolName)}</td>
              <td>${escapeAdminText(room.className)}</td>
              <td><code>${escapeAdminText(room.roomCode)}</code></td>
              <td><code>${escapeAdminText(room.teacherCode || "-")}</code></td>
              <td>${Number(room.playerCount || 0)}</td>
              <td>${Number(room.pickCount || 0)}</td>
              <td>${escapeAdminText(formatAdminDate(room.createdAt))}</td>
              <td>${escapeAdminText(formatAdminDate(room.lastActivity))}</td>
            </tr>`).join("")}</tbody>
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
  if (!overviewResponse.ok) throw new Error(overview.error || "Adminbereich konnte nicht geladen werden.");
  if (!resultsResponse.ok) throw new Error(resultData.error || "Manuelle Ergebnisse konnten nicht geladen werden.");
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
    superAdminMessage.textContent = "Private Übersicht geladen.";
    superAdminForm.reset();
  } catch (error) {
    superAdminMessage.textContent = error.message || "Adminbereich ist momentan nicht erreichbar.";
  }
});

superAdminSection?.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-admin-result]");
  if (!form) return;
  event.preventDefault();
  const adminCode = window.prompt("Admin-Code zum Speichern eingeben:");
  if (!adminCode) return;

  const message = superAdminResults?.querySelector("#superAdminResultsMessage");
  const button = form.querySelector("button");
  const values = new FormData(form);
  button.disabled = true;
  if (message) message.textContent = "Ergebnis wird gespeichert...";
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
    if (!response.ok) throw new Error(data.error || "Ergebnis konnte nicht gespeichert werden.");
    const result = data.result;
    window.dispatchEvent(new CustomEvent("tipparena:manual-result", {
      detail: {
        matchId: result.match_id,
        status: result.status,
        minute: result.minute,
        goals: result.status === "open"
          ? { home: null, away: null }
          : { home: Number(result.home_score), away: Number(result.away_score) },
        manual: true,
      },
    }));
    if (message) message.textContent = "Ergebnis gespeichert. Die Rangliste wurde aktualisiert.";
  } catch (error) {
    if (message) message.textContent = error.message || "Ergebnis konnte nicht gespeichert werden.";
  } finally {
    button.disabled = false;
  }
});

window.addEventListener("hashchange", updateSuperAdminView);
addDangerZone();
addResultsSection();
updateSuperAdminView();

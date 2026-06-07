const superAdminSection = document.querySelector("#superadmin");
const superAdminForm = document.querySelector("#superAdminForm");
const superAdminMessage = document.querySelector("#superAdminMessage");
const superAdminStats = document.querySelector("#superAdminStats");
const superAdminRooms = document.querySelector("#superAdminRooms");

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

superAdminForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const adminCode = String(new FormData(superAdminForm).get("adminCode") || "");
  superAdminMessage.textContent = "Übersicht wird geladen...";
  try {
    const response = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminCode }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      superAdminMessage.textContent = data.error || "Adminbereich konnte nicht geladen werden.";
      return;
    }
    superAdminMessage.textContent = "Private Übersicht geladen.";
    renderSuperAdmin(data);
    superAdminForm.reset();
  } catch {
    superAdminMessage.textContent = "Adminbereich ist momentan nicht erreichbar.";
  }
});

window.addEventListener("hashchange", updateSuperAdminView);
updateSuperAdminView();

import { db, auth } from "./admin-firebase-config.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  collection, query, where, orderBy, limit, getDocs,
  deleteDoc, doc, Timestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


const ADMIN_UID = "ZfM9Ok4YYvPsEivfjY0YeEtgBG33";

const STALE_SOS_HOURS = 6;

const REASON_LABELS = {
  oxygen: "Oxygen concentrator", fridge: "Fridge-stored medication",
  medical: "Other medical device", other: "Other emergency"
};

let allReports = [];   // cached last full fetch, filtered/searched client-side
let reportsFilter = "all";
let reportsSearchTerm = "";
let serviceChart = null;
let statusChart = null;

function timeAgo(ts) {
  if (!ts) return "—";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = mins / 60;
  if (hrs < 24) return `${Math.round(hrs)}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
function hoursSince(ts) {
  if (!ts) return 0;
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return (Date.now() - date.getTime()) / 3600000;
}

// ---------------------------------------------------------------
// Reverse geocoding — simple sequential queue (bounded list sizes here,
// so no need for the dedup complexity the main app's live map needs).
// ---------------------------------------------------------------
const geocodeCache = {};
async function geocodeRows(rows, cellKeyFn, onEach) {
  for (const row of rows) {
    const key = cellKeyFn(row);
    if (geocodeCache[key]) { onEach(row, geocodeCache[key]); continue; }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${row.lat}&lon=${row.lng}&zoom=15&addressdetails=1`);
      const data = await res.json();
      const a = data.address || {};
      const label = a.suburb || a.neighbourhood || a.quarter || a.town || a.village
        || a.city_district || a.municipality || a.city || a.county
        || (data.display_name ? data.display_name.split(",")[0] : null)
        || `${row.lat.toFixed(2)}, ${row.lng.toFixed(2)}`;
      geocodeCache[key] = label;
      onEach(row, label);
    } catch (err) {
      onEach(row, `${row.lat.toFixed(2)}, ${row.lng.toFixed(2)}`);
    }
    await new Promise((r) => setTimeout(r, 1100));
  }
}

function showLogin(errorMsg) {
  document.getElementById("adminLogin").classList.remove("hidden");
  document.getElementById("adminDashboard").classList.add("hidden");
  const errEl = document.getElementById("adminLoginError");
  if (errorMsg) { errEl.textContent = errorMsg; errEl.classList.remove("hidden"); }
  else { errEl.classList.add("hidden"); }
}

function showDashboard() {
  document.getElementById("adminLogin").classList.add("hidden");
  document.getElementById("adminDashboard").classList.remove("hidden");
  loadEverything();
}

// ---------------------------------------------------------------
// Auth
// ---------------------------------------------------------------
document.getElementById("adminLoginBtn").onclick = async () => {
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;
  if (!email || !password) return;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    showLogin("Sign-in failed — check your email and password.");
  }
};
document.getElementById("adminLogoutBtn").onclick = () => signOut(auth);
document.getElementById("adminRefreshBtn").onclick = () => loadEverything();

onAuthStateChanged(auth, (user) => {
  if (user && user.uid === ADMIN_UID) {
    showDashboard();
  } else if (user) {
    signOut(auth);
    showLogin("This account is not authorized as admin.");
  } else {
    showLogin();
  }
});

// ---------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------
document.querySelectorAll(".admin-tab").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".admin-tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".admin-tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab" + btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1)).classList.add("active");
  };
});

// ---------------------------------------------------------------
// Load everything
// ---------------------------------------------------------------
async function loadEverything() {
  document.getElementById("adminLastRefresh").textContent = "Loading…";
  await Promise.all([loadStatsAndCharts(), loadFlaggedSOS(), loadActiveSOS(), loadRecentReports()]);
  document.getElementById("adminLastRefresh").textContent = `Updated ${new Date().toLocaleTimeString()}`;
}

// ---------------------------------------------------------------
// Stats + charts
// ---------------------------------------------------------------
async function loadStatsAndCharts() {
  try {
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 12 * 3600 * 1000));
    const [reportsSnap, sosSnap, flaggedSnap] = await Promise.all([
      getDocs(query(collection(db, "reports"), where("updatedAt", ">=", cutoff))),
      getDocs(query(collection(db, "sos"), where("active", "==", true))),
      getDocs(query(collection(db, "sos"), where("flags", ">", 0)))
    ]);

    const reports = [];
    reportsSnap.forEach((d) => reports.push(d.data()));

    const sosD = [];
    sosSnap.forEach((d) => sosD.push(d.data()));
    const staleCount = sosD.filter((s) => hoursSince(s.createdAt) > STALE_SOS_HOURS).length;

    document.getElementById("statActiveReports").textContent = reportsSnap.size;
    document.getElementById("statActiveSOS").textContent = sosSnap.size;
    document.getElementById("statFlagged").textContent = flaggedSnap.size;
    document.getElementById("statStaleSOS").textContent = staleCount;

    const counts = {
      power_out: 0, power_on: 0, water_out: 0, water_on: 0
    };
    reports.forEach((r) => {
      const key = `${r.service}_${r.type}`;
      if (key in counts) counts[key]++;
    });

    renderCharts(counts);
  } catch (err) {
    console.error("loadStatsAndCharts failed:", err);
  }
}

function renderCharts(counts) {
  const powerTotal = counts.power_out + counts.power_on;
  const waterTotal = counts.water_out + counts.water_on;

  const serviceCtx = document.getElementById("serviceChart");
  if (serviceChart) serviceChart.destroy();
  serviceChart = new Chart(serviceCtx, {
    type: "doughnut",
    data: {
      labels: ["⚡ Power", "💧 Water"],
      datasets: [{
        data: [powerTotal, waterTotal],
        backgroundColor: ["#E63946", "#3B82F6"],
        borderColor: "#0B1220",
        borderWidth: 2
      }]
    },
    options: {
      plugins: { legend: { labels: { color: "#F2F0EA", font: { size: 12 } } } }
    }
  });

  const statusCtx = document.getElementById("statusChart");
  if (statusChart) statusChart.destroy();
  statusChart = new Chart(statusCtx, {
    type: "bar",
    data: {
      labels: ["Power out", "Power on", "Water out", "Water on"],
      datasets: [{
        data: [counts.power_out, counts.power_on, counts.water_out, counts.water_on],
        backgroundColor: ["#E63946", "#3DDC97", "#E63946", "#3DDC97"],
        borderRadius: 6
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#8A93A6" }, grid: { display: false } },
        y: { ticks: { color: "#8A93A6", stepSize: 1 }, grid: { color: "#263252" }, beginAtZero: true }
      }
    }
  });
}

// ---------------------------------------------------------------
// Flagged SOS
// ---------------------------------------------------------------
async function loadFlaggedSOS() {
  const el = document.getElementById("flaggedList");
  try {
    const snap = await getDocs(query(collection(db, "sos"), where("flags", ">", 0), orderBy("flags", "desc"), limit(20)));
    if (snap.empty) {
      el.innerHTML = `<p class="admin-empty">No flagged SOS right now.</p>`;
      return;
    }
    const rows = [];
    snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
    renderSosRows(el, rows);
  } catch (err) {
    console.error("loadFlaggedSOS failed:", err);
    el.innerHTML = `<p class="admin-empty">Couldn't load flagged SOS.</p>`;
  }
}

// ---------------------------------------------------------------
// All active SOS (this is what makes the admin "active SOS" count
// actually inspectable, instead of just a mystery number)
// ---------------------------------------------------------------
async function loadActiveSOS() {
  const el = document.getElementById("activeSosList");
  try {
    // Deliberately no orderBy here — combining it with the active==true
    // filter would require creating a new Firestore composite index.
    // Sorting the (small) result client-side avoids that entirely.
    const snap = await getDocs(query(collection(db, "sos"), where("active", "==", true)));
    if (snap.empty) {
      el.innerHTML = `<p class="admin-empty">No active SOS right now.</p>`;
      return;
    }
    const rows = [];
    snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
    rows.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    renderSosRows(el, rows);
  } catch (err) {
    console.error("loadActiveSOS failed:", err);
    el.innerHTML = `<p class="admin-empty">Couldn't load active SOS.</p>`;
  }
}

function renderSosRows(el, rows) {
  el.innerHTML = rows.map((r) => {
    const stale = hoursSince(r.createdAt) > STALE_SOS_HOURS;
    return `
      <div class="admin-row" data-id="${r.id}">
        <div class="admin-row-main">
          <strong>${REASON_LABELS[r.reason] || "Emergency"}</strong>
          ${stale ? `<span class="admin-badge admin-badge-warn">Stale — ${Math.round(hoursSince(r.createdAt))}h old</span>` : ""}
          <span class="admin-row-meta">${r.flags || 0} flag${(r.flags || 0) === 1 ? "" : "s"} · ${r.helpersCount || 0} helpers · ${timeAgo(r.createdAt)} · lat ${r.lat}, lng ${r.lng}</span>
          ${r.note ? `<span class="admin-row-note">"${r.note}"</span>` : ""}
        </div>
        <button class="admin-delete-btn" data-collection="sos" data-id="${r.id}">Delete</button>
      </div>
    `;
  }).join("");
  wireDeleteButtons();
}

// ---------------------------------------------------------------
// Recent reports — with geocoded area names, service filter, search
// ---------------------------------------------------------------
async function loadRecentReports() {
  const el = document.getElementById("reportsList");
  try {
    const snap = await getDocs(query(collection(db, "reports"), orderBy("updatedAt", "desc"), limit(50)));
    allReports = [];
    snap.forEach((d) => allReports.push({ id: d.id, ...d.data(), areaLabel: null }));

    if (allReports.length === 0) {
      el.innerHTML = `<p class="admin-empty">No reports yet.</p>`;
      return;
    }

    renderReportsList();

    // Resolve area names in the background; each row updates itself once
    // its lookup completes, without blocking the initial render.
    geocodeRows(
      allReports,
      (r) => `${r.lat.toFixed(2)}_${r.lng.toFixed(2)}`,
      (row, label) => {
        row.areaLabel = label;
        const cell = document.querySelector(`.admin-row[data-id="${row.id}"] .admin-area-name`);
        if (cell) cell.textContent = label;
      }
    );
  } catch (err) {
    console.error("loadRecentReports failed:", err);
    el.innerHTML = `<p class="admin-empty">Couldn't load reports.</p>`;
  }
}

function renderReportsList() {
  const el = document.getElementById("reportsList");
  let rows = allReports;
  if (reportsFilter !== "all") rows = rows.filter((r) => r.service === reportsFilter);
  if (reportsSearchTerm) {
    const term = reportsSearchTerm.toLowerCase();
    rows = rows.filter((r) => (r.areaLabel || "").toLowerCase().includes(term));
  }

  if (rows.length === 0) {
    el.innerHTML = `<p class="admin-empty">No reports match this filter.</p>`;
    return;
  }

  el.innerHTML = rows.map((r) => `
    <div class="admin-row" data-id="${r.id}">
      <div class="admin-row-main">
        <strong>${r.service === "water" ? "💧" : "⚡"} <span class="admin-area-name">${r.areaLabel || `${r.lat.toFixed(2)}, ${r.lng.toFixed(2)}`}</span></strong>
        <span class="admin-row-meta">${r.type === "out" ? "No " + r.service : r.service + " back on"} · ${timeAgo(r.updatedAt)} · uid ${r.uid ? r.uid.slice(0, 8) : "?"}…</span>
      </div>
      <button class="admin-delete-btn" data-collection="reports" data-id="${r.id}">Delete</button>
    </div>
  `).join("");
  wireDeleteButtons();
}

document.querySelectorAll("#reportsServiceFilter .filter-chip").forEach((chip) => {
  chip.onclick = () => {
    document.querySelectorAll("#reportsServiceFilter .filter-chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    reportsFilter = chip.dataset.filter;
    renderReportsList();
  };
});
document.getElementById("reportsSearch").addEventListener("input", (e) => {
  reportsSearchTerm = e.target.value.trim();
  renderReportsList();
});

// ---------------------------------------------------------------
// Delete handling (shared by all lists)
// ---------------------------------------------------------------
function wireDeleteButtons() {
  document.querySelectorAll(".admin-delete-btn").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Delete this permanently? This can't be undone.")) return;
      try {
        await deleteDoc(doc(db, btn.dataset.collection, btn.dataset.id));
        btn.closest(".admin-row").remove();
        loadStatsAndCharts();
      } catch (err) {
        console.error("delete failed:", err);
        alert("Couldn't delete — check the console for details.");
      }
    };
  });
}

import { db, auth, authReady } from "./firebase-config.js";
import {
  collection, doc, setDoc, updateDoc, onSnapshot,
  query, where, Timestamp, serverTimestamp, increment, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// ---------------------------------------------------------------
// Config
// ---------------------------------------------------------------
const STALE_HOURS = 4;          // outage reports older than this stop counting
const GRID_PRECISION = 2;       // ~1.1km grid cells for grouping + SOS privacy
const TUNISIA_CENTER = [34.0, 9.4];
const DEFAULT_ZOOM = 7;

let uid = null;
let map, reportLayer, sosLayer;
let unsubscribeReports = null;
let unsubscribeSOS = null;
let pendingReportType = null; // 'out' | 'on' | null — set when waiting for a map tap
let selectedSOSReason = null;
let mySOSDocId = null;

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function snap(lat, lng) {
  const f = Math.pow(10, GRID_PRECISION);
  return {
    lat: Math.round(lat * f) / f,
    lng: Math.round(lng * f) / f
  };
}
function cellKey(lat, lng) {
  const s = snap(lat, lng);
  return `${s.lat.toFixed(GRID_PRECISION)}_${s.lng.toFixed(GRID_PRECISION)}`;
}
function timeAgo(ts) {
  if (!ts) return "just now";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}
function showToast(msg, ms = 3200) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(showToast._h);
  showToast._h = setTimeout(() => t.classList.add("hidden"), ms);
}
function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("no geolocation"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// ---------------------------------------------------------------
// Map setup
// ---------------------------------------------------------------
function initMap() {
  map = L.map("map", { zoomControl: true, attributionControl: true })
    .setView(TUNISIA_CENTER, DEFAULT_ZOOM);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: "abcd",
    maxZoom: 19
  }).addTo(map);

  reportLayer = L.layerGroup().addTo(map);
  sosLayer = L.layerGroup().addTo(map);

  map.on("click", (e) => {
    if (pendingReportType) {
      submitReport(pendingReportType, e.latlng.lat, e.latlng.lng);
      pendingReportType = null;
      document.body.classList.remove("picking");
      showToast("Report placed. Thanks for helping the map!");
    }
  });
}

function makeDivIcon(className, label) {
  return L.divIcon({
    className: "",
    html: `<div class="nour-dot ${className}" style="width:${label ? 30 : 16}px;height:${label ? 30 : 16}px;font-size:12px;">${label || ""}</div>`,
    iconSize: label ? [30, 30] : [16, 16]
  });
}

// ---------------------------------------------------------------
// Reports: submit
// ---------------------------------------------------------------
async function submitReport(type, lat, lng) {
  await authReady;
  const key = cellKey(lat, lng);
  const s = snap(lat, lng);
  const docId = `${uid}_${key}`;
  try {
    await setDoc(doc(db, "reports", docId), {
      uid, cell: key, lat: s.lat, lng: s.lng, type,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error(err);
    showToast("Couldn't send report — check your connection.");
  }
}

async function handleFabReport(type) {
  try {
    const loc = await getLocation();
    await submitReport(type, loc.lat, loc.lng);
    showToast(type === "out" ? "Marked: no power at your location." : "Marked: power confirmed back on.");
  } catch (err) {
    showToast("Location unavailable — tap the map to mark the spot.");
    pendingReportType = type;
    document.body.classList.add("picking");
  }
}

// ---------------------------------------------------------------
// Reports: live sync + clustering + render
// ---------------------------------------------------------------
function subscribeReports() {
  if (unsubscribeReports) unsubscribeReports();
  const cutoff = Timestamp.fromDate(new Date(Date.now() - STALE_HOURS * 3600 * 1000));
  const q = query(collection(db, "reports"), where("updatedAt", ">=", cutoff));
  unsubscribeReports = onSnapshot(q, (snap_) => {
    const docs = [];
    snap_.forEach((d) => docs.push({ id: d.id, ...d.data() }));
    renderReports(docs);
    renderFeed(docs);
  }, (err) => console.error("reports subscribe error", err));
}

function renderReports(docs) {
  reportLayer.clearLayers();

  const cells = {};
  for (const r of docs) {
    if (!r.cell || !r.updatedAt) continue;
    if (!cells[r.cell]) cells[r.cell] = { lat: r.lat, lng: r.lng, out: 0, on: 0, lastUpdate: r.updatedAt };
    if (r.type === "out") cells[r.cell].out++;
    if (r.type === "on") cells[r.cell].on++;
    if (r.updatedAt.toMillis && r.updatedAt.toMillis() > cells[r.cell].lastUpdate.toMillis()) {
      cells[r.cell].lastUpdate = r.updatedAt;
    }
  }

  let darkZones = 0;
  for (const key in cells) {
    const c = cells[key];
    let cls, label;
    if (c.out > c.on && c.out >= 2) { cls = "out"; label = c.out; darkZones++; }
    else if (c.out > c.on) { cls = "out-weak"; label = c.out; darkZones++; }
    else { cls = "on"; label = "✓"; }

    const marker = L.marker([c.lat, c.lng], { icon: makeDivIcon(cls, label) });
    marker.bindPopup(`
      <p class="popup-title">${cls === "on" ? "Power confirmed on" : "Power outage " + (cls === "out" ? "(confirmed)" : "(unconfirmed)")}</p>
      <p class="popup-meta">${c.out} outage report${c.out === 1 ? "" : "s"} · ${c.on} restored report${c.on === 1 ? "" : "s"} · updated ${timeAgo(c.lastUpdate)}</p>
      <button class="popup-btn" data-action="still-out" data-lat="${c.lat}" data-lng="${c.lng}">Still out</button>
      <button class="popup-btn safe" data-action="its-on" data-lat="${c.lat}" data-lng="${c.lng}">Power's back</button>
    `);
    marker.on("popupopen", () => bindPopupButtons());
    marker.addTo(reportLayer);
  }
  document.getElementById("statDark").textContent = darkZones;
}

function bindPopupButtons() {
  document.querySelectorAll(".popup-btn[data-action]").forEach((btn) => {
    btn.onclick = async () => {
      const lat = parseFloat(btn.dataset.lat);
      const lng = parseFloat(btn.dataset.lng);
      const type = btn.dataset.action === "still-out" ? "out" : "on";
      await submitReport(type, lat, lng);
      showToast("Thanks — report updated.");
      map.closePopup();
    };
  });
}

function renderFeed(reportDocs) {
  const list = document.getElementById("feedList");
  const items = [...reportDocs]
    .filter((d) => d.updatedAt)
    .sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis())
    .slice(0, 8);

  if (items.length === 0) {
    list.innerHTML = `<li class="feed-empty">No reports yet — be the first tonight.</li>`;
    return;
  }
  list.innerHTML = items.map((it) => `
    <li>${it.type === "out" ? "⚡ Power out reported" : "✅ Power restored reported"}
      <span class="feed-time">${timeAgo(it.updatedAt)}</span>
    </li>
  `).join("");
}

// ---------------------------------------------------------------
// SOS: submit
// ---------------------------------------------------------------
function openSOSSheet() {
  document.getElementById("sheetOverlay").classList.remove("hidden");
}
function closeSOSSheet() {
  document.getElementById("sheetOverlay").classList.add("hidden");
  selectedSOSReason = null;
  document.querySelectorAll("#sosReasonChips .chip").forEach((c) => c.classList.remove("selected"));
  document.getElementById("sosSubmit").disabled = true;
  document.getElementById("sosNote").value = "";
  document.getElementById("sosContact").value = "";
}

async function submitSOS() {
  await authReady;
  try {
    const loc = await getLocation();
    const s = snap(loc.lat, loc.lng);
    const note = document.getElementById("sosNote").value.trim();
    const contact = document.getElementById("sosContact").value.trim();
    const docId = uid;
    await setDoc(doc(db, "sos", docId), {
      uid, lat: s.lat, lng: s.lng,
      reason: selectedSOSReason, note, contact,
      active: true, helpersCount: 0,
      createdAt: serverTimestamp()
    });
    mySOSDocId = docId;
    localStorage.setItem("nour_active_sos", docId);
    closeSOSSheet();
    showToast("SOS sent. Nearby people can now see you may need help.");
  } catch (err) {
    console.error(err);
    showToast("Location is required to send an SOS. Please enable location access.");
  }
}

async function markSafe() {
  if (!mySOSDocId) return;
  try {
    await deleteDoc(doc(db, "sos", mySOSDocId));
    localStorage.removeItem("nour_active_sos");
    mySOSDocId = null;
    showToast("Marked safe. Your SOS has been cleared.");
    map.closePopup();
  } catch (err) {
    console.error(err);
  }
}

async function offerHelp(sosId) {
  try {
    await updateDoc(doc(db, "sos", sosId), { helpersCount: increment(1) });
    showToast("Thanks — the person will know help may be on the way. Reach out if you can.");
  } catch (err) {
    console.error(err);
  }
}

// ---------------------------------------------------------------
// SOS: live sync + render
// ---------------------------------------------------------------
function subscribeSOS() {
  if (unsubscribeSOS) unsubscribeSOS();
  const q = query(collection(db, "sos"), where("active", "==", true));
  unsubscribeSOS = onSnapshot(q, (snap_) => {
    sosLayer.clearLayers();
    let count = 0;
    snap_.forEach((d) => {
      const s = d.data();
      count++;
      const mine = s.uid === uid;
      if (mine) mySOSDocId = d.id;

      const marker = L.marker([s.lat, s.lng], { icon: makeDivIcon("sos", "🆘") });
      const reasonLabel = {
        oxygen: "Needs oxygen concentrator power",
        fridge: "Fridge-stored medication at risk",
        medical: "Depends on another medical device",
        other: "Other emergency"
      }[s.reason] || "Emergency";

      marker.bindPopup(`
        <p class="popup-title">${reasonLabel}</p>
        <p class="popup-meta">Reported ${timeAgo(s.createdAt)} · ${s.helpersCount || 0} people offered help</p>
        ${s.note ? `<p class="popup-note">"${escapeHtml(s.note)}"</p>` : ""}
        ${mine
          ? `<button class="popup-btn safe" data-sos-safe="1">I'm safe now</button>`
          : `<button class="popup-btn help" data-sos-help="${d.id}">I can help</button>
             ${s.contact ? "" : `<p class="popup-meta">Contact revealed once you offer to help.</p>`}`
        }
      `);
      marker.on("popupopen", () => {
        const helpBtn = document.querySelector(`[data-sos-help="${d.id}"]`);
        if (helpBtn) helpBtn.onclick = async () => {
          await offerHelp(d.id);
          if (s.contact) {
            const p = document.createElement("p");
            p.className = "popup-note";
            p.textContent = `Contact: ${s.contact}`;
            helpBtn.after(p);
          }
          helpBtn.disabled = true;
        };
        const safeBtn = document.querySelector('[data-sos-safe="1"]');
        if (safeBtn) safeBtn.onclick = markSafe;
      });
      marker.addTo(sosLayer);
    });
    document.getElementById("statSOS").textContent = count;
  }, (err) => console.error("sos subscribe error", err));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------
// UI wiring
// ---------------------------------------------------------------
function wireUI() {
  document.getElementById("fabReportOut").onclick = () => handleFabReport("out");
  document.getElementById("fabReportOn").onclick = () => handleFabReport("on");
  document.getElementById("fabSOS").onclick = openSOSSheet;

  document.getElementById("menuToggle").onclick = () => {
    document.getElementById("panel").classList.toggle("panel-hidden");
  };
  document.getElementById("panelClose").onclick = () => {
    document.getElementById("panel").classList.add("panel-hidden");
  };

  document.getElementById("sosCancel").onclick = closeSOSSheet;
  document.getElementById("sosSubmit").onclick = submitSOS;

  document.querySelectorAll("#sosReasonChips .chip").forEach((chip) => {
    chip.onclick = () => {
      document.querySelectorAll("#sosReasonChips .chip").forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
      selectedSOSReason = chip.dataset.reason;
      document.getElementById("sosSubmit").disabled = false;
    };
  });
}

// ---------------------------------------------------------------
// Boot
// ---------------------------------------------------------------
async function boot() {
  await authReady;
  uid = auth.currentUser ? auth.currentUser.uid : (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()));
  mySOSDocId = localStorage.getItem("nour_active_sos") || null;

  initMap();
  wireUI();
  subscribeReports();
  subscribeSOS();

  // slide the "stale reports" time window forward periodically
  setInterval(subscribeReports, 5 * 60 * 1000);
}

boot();

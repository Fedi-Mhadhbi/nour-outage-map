import { db, auth, authReady } from "./firebase-config.js";
import {
  collection, doc, setDoc, updateDoc, onSnapshot,
  query, where, orderBy, Timestamp, serverTimestamp, increment, deleteDoc, addDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// ---------------------------------------------------------------
// Config
// ---------------------------------------------------------------
const STALE_HOURS = 4;          // outage reports older than this stop counting
const GRID_PRECISION = 2;       // ~1.1km grid cells for grouping + SOS privacy
const TUNISIA_CENTER = [34.0, 9.4];
const DEFAULT_ZOOM = 7;

let uid = null;
let map, reportLayer, sosLayer, searchMarker;
let unsubscribeReports = null;
let unsubscribeSOS = null;
let unsubscribeComments = null;
let pendingReportType = null; // 'out' | 'on' | null — set when waiting for a map tap
let selectedSOSReason = null;
let mySOSDocId = null;
let lastKnownLocation = null;   // {lat, lng} — used to sort the SOS list by distance
let cellsData = {};             // latest aggregated outage cells, cached for the table view
let sosData = [];                // latest active SOS docs
let outageFilter = "all";
let activeSOSDetailId = null;
let searchedLocation = null;    // {lat, lng, label} picked from the search bar

// ---------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------
function snap(lat, lng) {
  const f = Math.pow(10, GRID_PRECISION);
  return { lat: Math.round(lat * f) / f, lng: Math.round(lng * f) / f };
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
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
      (pos) => { lastKnownLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }; resolve(lastKnownLocation); },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------
// Reverse geocoding (cell -> human-readable area name), rate limited
// ---------------------------------------------------------------
const geocodeCache = {};
const geocodeQueue = [];
let geocodeBusy = false;

function requestReverseGeocode(cell, lat, lng, cb) {
  if (geocodeCache[cell]) { cb(geocodeCache[cell]); return; }
  geocodeQueue.push({ cell, lat, lng, cb });
  processGeocodeQueue();
}
async function processGeocodeQueue() {
  if (geocodeBusy || geocodeQueue.length === 0) return;
  geocodeBusy = true;
  const item = geocodeQueue.shift();
  if (geocodeCache[item.cell]) {
    item.cb(geocodeCache[item.cell]);
    geocodeBusy = false;
    processGeocodeQueue();
    return;
  }
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${item.lat}&lon=${item.lng}&zoom=15&addressdetails=1`);
    const data = await res.json();
    const a = data.address || {};
    const label = a.suburb || a.neighbourhood || a.quarter || a.town || a.village
      || a.city_district || a.municipality || a.city || a.county
      || (data.display_name ? data.display_name.split(",")[0] : null)
      || `${item.lat.toFixed(2)}, ${item.lng.toFixed(2)}`;
    geocodeCache[item.cell] = label;
    item.cb(label);
  } catch (err) {
    const fallback = `${item.lat.toFixed(2)}, ${item.lng.toFixed(2)}`;
    geocodeCache[item.cell] = fallback;
    item.cb(fallback);
  }
  setTimeout(() => { geocodeBusy = false; processGeocodeQueue(); }, 1100);
}

// ---------------------------------------------------------------
// Forward geocoding (search bar)
// ---------------------------------------------------------------
let searchDebounceTimer = null;

function wireSearch() {
  const input = document.getElementById("searchInput");
  const clearBtn = document.getElementById("searchClear");
  const resultsEl = document.getElementById("searchResults");

  input.addEventListener("input", () => {
    const q = input.value.trim();
    clearBtn.classList.toggle("hidden", q.length === 0);
    clearTimeout(searchDebounceTimer);
    if (q.length < 3) { hideResults(); return; }
    resultsEl.innerHTML = `<li class="search-loading">Searching…</li>`;
    resultsEl.classList.remove("hidden");
    searchDebounceTimer = setTimeout(() => doSearch(q), 450);
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    clearBtn.classList.add("hidden");
    hideResults();
  });

  function hideResults() {
    resultsEl.classList.add("hidden");
    resultsEl.innerHTML = "";
  }

  async function doSearch(q) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&countrycodes=tn&addressdetails=1&limit=6`);
      const data = await res.json();
      if (!data.length) {
        resultsEl.innerHTML = `<li class="search-empty">No matches found in Tunisia.</li>`;
        return;
      }
      resultsEl.innerHTML = data.map((r, i) => {
        const main = r.address?.suburb || r.address?.neighbourhood || r.address?.town || r.address?.village || r.address?.city || r.name || r.display_name.split(",")[0];
        return `<li class="search-result-item" data-idx="${i}">
          ${escapeHtml(main)}
          <span class="search-result-sub">${escapeHtml(r.display_name)}</span>
        </li>`;
      }).join("");
      resultsEl.querySelectorAll(".search-result-item").forEach((el) => {
        el.onclick = () => {
          const r = data[parseInt(el.dataset.idx, 10)];
          selectSearchResult(r);
          hideResults();
        };
      });
    } catch (err) {
      resultsEl.innerHTML = `<li class="search-empty">Search failed — check your connection.</li>`;
    }
  }
}

function selectSearchResult(r) {
  const lat = parseFloat(r.lat);
  const lng = parseFloat(r.lon);
  const label = r.address?.suburb || r.address?.neighbourhood || r.address?.town || r.address?.village || r.address?.city || r.display_name.split(",")[0];
  searchedLocation = { lat, lng, label };

  map.flyTo([lat, lng], 15, { duration: 0.8 });

  if (searchMarker) map.removeLayer(searchMarker);
  searchMarker = L.marker([lat, lng], {
    icon: L.divIcon({ className: "", html: `<div class="nour-dot" style="width:14px;height:14px;background:#fff;box-shadow:0 0 10px #fff;"></div>`, iconSize: [14, 14] })
  }).addTo(map);

  document.getElementById("searchConfirmTitle").textContent = label;
  document.getElementById("searchConfirmSub").textContent = "Report the current power status for this area.";
  document.getElementById("searchConfirmOverlay").classList.remove("hidden");
}

// ---------------------------------------------------------------
// Map setup
// ---------------------------------------------------------------
function initMap() {
  map = L.map("map", { zoomControl: true, attributionControl: true })
    .setView(TUNISIA_CENTER, DEFAULT_ZOOM);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
    subdomains: "abc",
    maxZoom: 19,
    className: "dark-tiles"
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
// Reports: live sync + clustering + render (map, table, feed)
// ---------------------------------------------------------------
function subscribeReports() {
  if (unsubscribeReports) unsubscribeReports();
  const cutoff = Timestamp.fromDate(new Date(Date.now() - STALE_HOURS * 3600 * 1000));
  const q = query(collection(db, "reports"), where("updatedAt", ">=", cutoff));
  unsubscribeReports = onSnapshot(q, (snap_) => {
    const docs = [];
    snap_.forEach((d) => docs.push({ id: d.id, ...d.data() }));
    aggregateAndRender(docs);
  }, (err) => console.error("reports subscribe error", err));
}

function aggregateAndRender(docs) {
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
  cellsData = cells;
  renderMapMarkers();
  renderFeed(docs);
  renderOutagesTable();
}

function renderMapMarkers() {
  reportLayer.clearLayers();
  let darkZones = 0;
  for (const key in cellsData) {
    const c = cellsData[key];
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

function renderOutagesTable() {
  const body = document.getElementById("outagesTableBody");
  const keys = Object.keys(cellsData);
  const rows = keys.map((key) => {
    const c = cellsData[key];
    const status = c.out > c.on ? "out" : "on";
    return { key, ...c, status };
  }).filter((r) => outageFilter === "all" ? true : r.status === outageFilter)
    .sort((a, b) => b.lastUpdate.toMillis() - a.lastUpdate.toMillis());

  if (rows.length === 0) {
    body.innerHTML = `<tr><td colspan="4" class="table-empty">No reports match this filter.</td></tr>`;
    return;
  }

  body.innerHTML = rows.map((r) => `
    <tr data-lat="${r.lat}" data-lng="${r.lng}" data-key="${r.key}">
      <td class="area-name" data-key="${r.key}">Locating…</td>
      <td>
        <span class="status-cell">
          <span class="dot ${r.status === "out" ? (r.out >= 2 ? "dot-out" : "dot-out-weak") : "dot-on"}"></span>
          ${r.status === "out" ? "No power" : "Power on"}
        </span>
      </td>
      <td>${timeAgo(r.lastUpdate)}</td>
      <td><button class="row-btn" data-goto-lat="${r.lat}" data-goto-lng="${r.lng}">View</button></td>
    </tr>
  `).join("");

  // resolve area names lazily/asynchronously so the table renders instantly
  rows.forEach((r) => {
    requestReverseGeocode(r.key, r.lat, r.lng, (label) => {
      const cell = body.querySelector(`.area-name[data-key="${r.key}"]`);
      if (cell) cell.textContent = label;
    });
  });

  body.querySelectorAll("[data-goto-lat]").forEach((btn) => {
    btn.onclick = () => {
      const lat = parseFloat(btn.dataset.gotoLat);
      const lng = parseFloat(btn.dataset.gotoLng);
      document.getElementById("panel").classList.add("panel-hidden");
      map.flyTo([lat, lng], 15, { duration: 0.8 });
      setTimeout(() => {
        reportLayer.eachLayer((m) => {
          const ll = m.getLatLng();
          if (Math.abs(ll.lat - lat) < 0.001 && Math.abs(ll.lng - lng) < 0.001) m.openPopup();
        });
      }, 900);
    };
  });
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

async function markSafe(sosId) {
  const id = sosId || mySOSDocId;
  if (!id) return;
  try {
    await deleteDoc(doc(db, "sos", id));
    if (id === mySOSDocId) { localStorage.removeItem("nour_active_sos"); mySOSDocId = null; }
    showToast("Marked safe. Your SOS has been cleared.");
    closeSOSDetail();
    map.closePopup();
  } catch (err) {
    console.error(err);
  }
}

async function offerHelp(sosId) {
  try {
    await updateDoc(doc(db, "sos", sosId), { helpersCount: increment(1) });
  } catch (err) {
    console.error(err);
  }
}

// ---------------------------------------------------------------
// SOS: live sync + render (map pins, list tab)
// ---------------------------------------------------------------
function subscribeSOS() {
  if (unsubscribeSOS) unsubscribeSOS();
  const q = query(collection(db, "sos"), where("active", "==", true));
  unsubscribeSOS = onSnapshot(q, (snap_) => {
    const docs = [];
    snap_.forEach((d) => docs.push({ id: d.id, ...d.data() }));
    sosData = docs;
    renderSOSMarkers();
    renderSOSList();
  }, (err) => console.error("sos subscribe error", err));
}

const reasonLabels = {
  oxygen: "Needs oxygen concentrator power",
  fridge: "Fridge-stored medication at risk",
  medical: "Depends on another medical device",
  other: "Other emergency"
};

function renderSOSMarkers() {
  sosLayer.clearLayers();
  sosData.forEach((s) => {
    const mine = s.uid === uid;
    if (mine) mySOSDocId = s.id;
    const marker = L.marker([s.lat, s.lng], { icon: makeDivIcon("sos", "🆘") });
    marker.on("click", () => openSOSDetail(s.id));
    marker.addTo(sosLayer);
  });
  document.getElementById("statSOS").textContent = sosData.length;
}

function renderSOSList() {
  const list = document.getElementById("sosListItems");
  if (sosData.length === 0) {
    list.innerHTML = `<li class="feed-empty">No active SOS right now.</li>`;
    return;
  }
  const withDistance = sosData.map((s) => ({
    ...s,
    dist: lastKnownLocation ? distanceKm(lastKnownLocation.lat, lastKnownLocation.lng, s.lat, s.lng) : null
  }));
  withDistance.sort((a, b) => {
    if (a.dist == null && b.dist == null) return b.createdAt?.toMillis() - a.createdAt?.toMillis();
    if (a.dist == null) return 1;
    if (b.dist == null) return -1;
    return a.dist - b.dist;
  });

  list.innerHTML = withDistance.map((s) => `
    <li class="sos-item" data-id="${s.id}">
      <div class="sos-item-top">
        <span class="sos-item-reason">${reasonLabels[s.reason] || "Emergency"}</span>
        ${s.dist != null ? `<span class="sos-item-dist">${s.dist < 1 ? Math.round(s.dist * 1000) + "m" : s.dist.toFixed(1) + "km"}</span>` : ""}
      </div>
      <div class="sos-item-meta">${timeAgo(s.createdAt)} · ${s.helpersCount || 0} people offered help</div>
    </li>
  `).join("");

  list.querySelectorAll(".sos-item").forEach((el) => {
    el.onclick = () => openSOSDetail(el.dataset.id);
  });
}

// ---------------------------------------------------------------
// SOS detail sheet + comments
// ---------------------------------------------------------------
function openSOSDetail(sosId) {
  const s = sosData.find((x) => x.id === sosId);
  if (!s) return;
  activeSOSDetailId = sosId;
  const mine = s.uid === uid;

  document.getElementById("sosDetailTitle").textContent = reasonLabels[s.reason] || "Emergency";
  document.getElementById("sosDetailMeta").textContent =
    `Reported ${timeAgo(s.createdAt)} · ${s.helpersCount || 0} people offered help${s.contact ? " · contact shared with helpers" : ""}`;
  document.getElementById("sosDetailNote").textContent = s.note ? `"${s.note}"` : "";
  document.getElementById("sosDetailOwnerActions").classList.toggle("hidden", !mine);

  document.getElementById("sosDetailMarkSafe").onclick = () => markSafe(sosId);

  document.getElementById("commentInput").value = "";
  document.getElementById("commentSend").onclick = () => sendComment(sosId, s.contact, mine);

  subscribeComments(sosId);
  document.getElementById("sosDetailOverlay").classList.remove("hidden");

  if (!mine) offerHelp(sosId);
}

function closeSOSDetail() {
  document.getElementById("sosDetailOverlay").classList.add("hidden");
  if (unsubscribeComments) unsubscribeComments();
  activeSOSDetailId = null;
}

function subscribeComments(sosId) {
  if (unsubscribeComments) unsubscribeComments();
  const q = query(collection(db, "sos", sosId, "comments"), orderBy("createdAt", "asc"));
  unsubscribeComments = onSnapshot(q, (snap_) => {
    const list = document.getElementById("commentList");
    if (snap_.empty) {
      list.innerHTML = `<li class="feed-empty">No messages yet.</li>`;
      return;
    }
    const items = [];
    snap_.forEach((d) => items.push(d.data()));
    list.innerHTML = items.map((c) => `
      <li>${escapeHtml(c.text)}<span class="comment-time">${timeAgo(c.createdAt)}</span></li>
    `).join("");
    list.scrollTop = list.scrollHeight;
  }, (err) => console.error("comments subscribe error", err));
}

async function sendComment(sosId, ownerContact, isOwner) {
  await authReady;
  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!text) return;
  try {
    await addDoc(collection(db, "sos", sosId, "comments"), {
      uid, text, createdAt: serverTimestamp()
    });
    input.value = "";
    if (!isOwner) showToast("Message sent — the person will see it.");
  } catch (err) {
    console.error(err);
    showToast("Couldn't send message — check your connection.");
  }
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

  document.getElementById("sosDetailClose").onclick = closeSOSDetail;

  // Tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab" + btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1)).classList.add("active");
      if (btn.dataset.tab === "sos") renderSOSList();
      if (btn.dataset.tab === "outages") renderOutagesTable();
    };
  });

  // Outages table filter chips
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.onclick = () => {
      document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      outageFilter = chip.dataset.filter;
      renderOutagesTable();
    };
  });

  // Search bar
  wireSearch();

  // Search confirm sheet
  document.getElementById("searchConfirmCancel").onclick = () => {
    document.getElementById("searchConfirmOverlay").classList.add("hidden");
    if (searchMarker) { map.removeLayer(searchMarker); searchMarker = null; }
  };
  document.getElementById("searchConfirmOut").onclick = async () => {
    if (!searchedLocation) return;
    await submitReport("out", searchedLocation.lat, searchedLocation.lng);
    showToast(`Marked: no power in ${searchedLocation.label}.`);
    document.getElementById("searchConfirmOverlay").classList.add("hidden");
  };
  document.getElementById("searchConfirmOn").onclick = async () => {
    if (!searchedLocation) return;
    await submitReport("on", searchedLocation.lat, searchedLocation.lng);
    showToast(`Marked: power confirmed on in ${searchedLocation.label}.`);
    document.getElementById("searchConfirmOverlay").classList.add("hidden");
  };
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

  // try to get location quietly in the background so the SOS list can sort by distance
  getLocation().catch(() => {});

  // slide the "stale reports" time window forward periodically
  setInterval(subscribeReports, 5 * 60 * 1000);
}

boot();

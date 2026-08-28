import { db, auth, authReady } from "./firebase-config.js";
import {
  collection, doc, setDoc, updateDoc, onSnapshot,
  query, where, orderBy, Timestamp, serverTimestamp, increment, arrayUnion,
  deleteDoc, addDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { t, setLang, currentLang, applyStaticTranslations } from "./i18n.js";

// ---------------------------------------------------------------
// Config
// ---------------------------------------------------------------
const STALE_HOURS = 4;            // outage reports older than this stop counting
const GRID_PRECISION = 2;         // ~1.1km grid cells for grouping + SOS privacy
const TUNISIA_CENTER = [34.0, 9.4];
const DEFAULT_ZOOM = 7;
const SERVICES = ["power", "water"];

const SOS_TTL_HOURS = 8;          // SOS auto-expires after this long
const SOS_CHECKIN_HOURS = 2;      // nudge the owner to confirm after this long
const SOS_COOLDOWN_MIN = 2;       // wait this long after resolving before sending another
const SOS_FLAG_HIDE_THRESHOLD = 3; // hide an SOS from everyone but its owner after this many reports

let uid = null;
let map, reportLayer, sosLayer, searchMarker;
let unsubscribeReports = null;
let unsubscribeSOS = null;
let unsubscribeThreadsList = null;
let unsubscribeThreadMessages = null;
let pendingReportType = null;      // 'out' | 'on' | null — set when waiting for a map tap
let selectedSOSReason = null;
let selectedSOSUrgency = "normal"; // 'normal' | 'urgent'
let mySOSDocId = null;
let lastKnownLocation = null;      // {lat, lng} — used to sort the SOS list by distance
let cellsData = {};                // latest aggregated outage cells (keyed "service_cell"), cached for table view
let sosData = [];                  // latest active, non-expired, non-hidden SOS docs
let outageFilter = "all";
let activeSOSDetailId = null;
let activeThreadHelperUid = null;  // which private thread is currently open
let searchedLocation = null;       // {lat, lng, label} picked from the search bar
let activeService = "power";       // 'power' | 'water' — what the FABs/map are currently reporting/showing
let checkinNudgedThisSession = false;

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
  if (!ts) return t("time_just_now");
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return t("time_just_now");
  if (mins < 60) return t("time_m_ago", { m: mins });
  const hrs = Math.round(mins / 60);
  return t("time_h_ago", { h: hrs });
}
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function showToast(msg, ms = 3200) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(showToast._h);
  showToast._h = setTimeout(() => el.classList.add("hidden"), ms);
}
// The topbar's height changes with viewport width (it wraps to 3 rows on
// mobile), font-load timing, and which language is active (French/Arabic
// labels run longer than English ones). A fixed pixel offset for the
// search bar drifts out of sync with all of that, so measure the topbar's
// real rendered height instead and position the search bar right below it.
function positionSearchBar() {
  const topbar = document.getElementById("topbar");
  const searchWrap = document.getElementById("searchWrap");
  if (!topbar || !searchWrap) return;
  const height = topbar.getBoundingClientRect().height;
  searchWrap.style.top = `${Math.round(height) + 10}px`;
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
function serviceLabel(service) {
  return t(`service_label_${service}`);
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
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${item.lat}&lon=${item.lng}&zoom=15&addressdetails=1&accept-language=${currentLang}`);
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
    resultsEl.innerHTML = `<li class="search-loading">${t("search_searching")}</li>`;
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
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&countrycodes=tn&addressdetails=1&limit=6&accept-language=${currentLang}`);
      const data = await res.json();
      if (!data.length) {
        resultsEl.innerHTML = `<li class="search-empty">${t("search_no_matches")}</li>`;
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
      resultsEl.innerHTML = `<li class="search-empty">${t("search_failed")}</li>`;
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
  document.getElementById("searchConfirmSub").textContent = t("search_confirm_sub");
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
      submitReport(pendingReportType, e.latlng.lat, e.latlng.lng, activeService);
      pendingReportType = null;
      document.body.classList.remove("picking");
      showToast(t("toast_report_placed"));
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
// Service switcher (power / water)
// ---------------------------------------------------------------
function updateServiceUI() {
  document.getElementById("fabReportOut").textContent = t(`fab_out_${activeService}`);
  document.getElementById("fabReportOn").textContent = t(`fab_on_${activeService}`);
  document.getElementById("fabReportOut").classList.toggle("fab-water", activeService === "water");
  document.getElementById("fabReportOn").classList.toggle("fab-water", activeService === "water");

  const showing = document.getElementById("legendShowing");
  if (showing) showing.textContent = t("legend_showing", { service: t(`service_${activeService}`) });

  const outRow = document.getElementById("legendOutConfirmedRow");
  const unconfirmedRow = document.getElementById("legendOutUnconfirmedRow");
  if (outRow) outRow.querySelector(".dot").className = "dot " + (activeService === "water" ? "dot-water-out" : "dot-out");
  if (unconfirmedRow) unconfirmedRow.querySelector(".dot").className = "dot " + (activeService === "water" ? "dot-water-out-weak" : "dot-out-weak");
}

function wireServiceSwitch() {
  document.querySelectorAll(".service-btn").forEach((btn) => {
    btn.onclick = () => {
      activeService = btn.dataset.service;
      document.querySelectorAll(".service-btn").forEach((b) => b.classList.toggle("active", b === btn));
      updateServiceUI();
      renderMapMarkers();
      renderOutagesTable();
      requestAnimationFrame(positionSearchBar);
    };
  });
}

// ---------------------------------------------------------------
// Reports: submit
// ---------------------------------------------------------------
async function submitReport(type, lat, lng, service) {
  await authReady;
  const svc = service || activeService;
  const key = cellKey(lat, lng);
  const s = snap(lat, lng);
  const docId = `${uid}_${svc}_${key}`;
  const lastCellStorageKey = `nour_last_report_cell_${svc}`;
  try {
    // If this device's last report for this service landed in a *different*
    // nearby cell (GPS drift between visits, or reporting from phone vs PC),
    // remove the old one so it doesn't keep showing a stale/contradicting status.
    const prevKey = localStorage.getItem(lastCellStorageKey);
    if (prevKey && prevKey !== key) {
      try { await deleteDoc(doc(db, "reports", `${uid}_${svc}_${prevKey}`)); } catch (e) { /* may not exist / may already be stale, ignore */ }
    }

    await setDoc(doc(db, "reports", docId), {
      uid, cell: key, lat: s.lat, lng: s.lng, type, service: svc,
      updatedAt: serverTimestamp()
    });
    localStorage.setItem(lastCellStorageKey, key);
  } catch (err) {
    console.error(err);
    showToast(t("toast_report_failed"));
  }
}

async function handleFabReport(type) {
  try {
    const loc = await getLocation();
    await submitReport(type, loc.lat, loc.lng, activeService);
    showToast(type === "out" ? t("toast_report_out", { service: serviceLabel(activeService) }) : t("toast_report_on", { service: serviceLabel(activeService) }));
  } catch (err) {
    showToast(t("toast_location_unavailable"));
    pendingReportType = type;
    document.body.classList.add("picking");
  }
}

let lastReportDocs = [];

// ---------------------------------------------------------------
// Reports: live sync + clustering + render (map, table, feed)
// ---------------------------------------------------------------
function subscribeReports() {
  if (unsubscribeReports) unsubscribeReports();
  const cutoff = Timestamp.fromDate(new Date(Date.now() - STALE_HOURS * 3600 * 1000));
  const q = query(collection(db, "reports"), where("updatedAt", ">=", cutoff));
  unsubscribeReports = onSnapshot(q, (snap_) => {
    const docs = [];
    snap_.forEach((d) => docs.push({ id: d.id, ...d.data(), service: d.data().service || "power" }));
    aggregateAndRender(docs);
  }, (err) => console.error("reports subscribe error", err));
}

function aggregateAndRender(docs) {
  lastReportDocs = docs;
  const cells = {};
  for (const r of docs) {
    if (!r.cell || !r.updatedAt) continue;
    const svc = r.service || "power";
    const key = `${svc}_${r.cell}`;
    if (!cells[key]) cells[key] = { lat: r.lat, lng: r.lng, out: 0, on: 0, lastUpdate: r.updatedAt, service: svc, cell: r.cell };
    if (r.type === "out") cells[key].out++;
    if (r.type === "on") cells[key].on++;
    if (r.updatedAt.toMillis && r.updatedAt.toMillis() > cells[key].lastUpdate.toMillis()) {
      cells[key].lastUpdate = r.updatedAt;
    }
  }
  cellsData = cells;
  renderMapMarkers();
  renderFeed(docs);
  renderOutagesTable();
}

// Small deterministic offset so multiple reports at (near) the same spot
// render as separate visible dots instead of stacking into one marker.
function offsetForIndex(i, n) {
  if (n <= 1) return { dLat: 0, dLng: 0 };
  const radius = 0.0009; // ~90-100m ring around the true location
  const angle = (2 * Math.PI * i) / n;
  return { dLat: Math.sin(angle) * radius, dLng: Math.cos(angle) * radius };
}

function renderMapMarkers() {
  reportLayer.clearLayers();
  let darkZones = 0;

  // group the raw (per-user) reports by service+cell so every individual
  // report gets its own marker, even when several land in the same grid cell
  const byCell = {};
  for (const r of lastReportDocs) {
    if (!r.cell || !r.updatedAt) continue;
    if ((r.service || "power") !== activeService) continue;
    const key = `${r.service || "power"}_${r.cell}`;
    (byCell[key] = byCell[key] || []).push(r);
  }

  for (const key in cellsData) {
    const c = cellsData[key];
    if (c.service !== activeService) continue;
    // A cell renders red "out" markers on the map as soon as it has ANY out
    // report (see the marker-coloring logic below, which never nets out
    // reports against on reports) — so the "zones dark" stat has to use the
    // same rule, or it reads 0 while a red marker is clearly visible.
    const cellIsOut = c.out > 0;
    if (cellIsOut) darkZones++;

    const reportsHere = (byCell[key] || []).slice().sort((a, b) => (a.uid || "").localeCompare(b.uid || ""));
    const n = reportsHere.length || 1;

    const meta = t("popup_reports", {
      out: c.out, outS: c.out === 1 ? "" : "s",
      on: c.on, onS: c.on === 1 ? "" : "s",
      time: timeAgo(c.lastUpdate)
    });

    reportsHere.forEach((r, i) => {
      const { dLat, dLng } = offsetForIndex(i, n);
      const lat = c.lat + dLat;
      const lng = c.lng + dLng;

      const isOut = r.type === "out";
      const isWater = activeService === "water";
      const cls = isOut ? (c.out >= 2 ? (isWater ? "water-out" : "out") : (isWater ? "water-out-weak" : "out-weak")) : "on";
      const label = isOut ? (isWater ? "💧" : "⚡") : "✓";

      const marker = L.marker([lat, lng], { icon: makeDivIcon(cls, label) });
      const title = isOut
        ? (c.out >= 2 ? t("popup_out_confirmed", { service: t(`service_${activeService}`) }) : t("popup_out_unconfirmed", { service: t(`service_${activeService}`) }))
        : t("popup_on", { service: t(`service_${activeService}`) });

      marker.bindPopup(`
        <p class="popup-title">${title}</p>
        <p class="popup-meta">${meta}</p>
        <button class="popup-btn" data-action="still-out" data-lat="${c.lat}" data-lng="${c.lng}" data-service="${c.service}">${t("popup_still_out")}</button>
        <button class="popup-btn safe" data-action="its-on" data-lat="${c.lat}" data-lng="${c.lng}" data-service="${c.service}">${t("popup_power_back")}</button>
      `);
      marker.on("popupopen", () => bindPopupButtons());
      marker.addTo(reportLayer);
    });

    // Fallback: if for some reason we have aggregate data but no matching
    // raw docs (e.g. race on first load), still show one summary marker.
    if (reportsHere.length === 0) {
      const isWater = activeService === "water";
      const cls = cellIsOut ? (c.out >= 2 ? (isWater ? "water-out" : "out") : (isWater ? "water-out-weak" : "out-weak")) : "on";
      const marker = L.marker([c.lat, c.lng], { icon: makeDivIcon(cls, cellIsOut ? c.out : "✓") });
      marker.bindPopup(`<p class="popup-title">${cellIsOut ? t("popup_out_confirmed", { service: t(`service_${activeService}`) }) : t("popup_on", { service: t(`service_${activeService}`) })}</p><p class="popup-meta">${meta}</p>`);
      marker.addTo(reportLayer);
    }
  }
  document.getElementById("statDark").textContent = darkZones;
}

function bindPopupButtons() {
  document.querySelectorAll(".popup-btn[data-action]").forEach((btn) => {
    btn.onclick = async () => {
      const lat = parseFloat(btn.dataset.lat);
      const lng = parseFloat(btn.dataset.lng);
      const service = btn.dataset.service || activeService;
      const type = btn.dataset.action === "still-out" ? "out" : "on";
      await submitReport(type, lat, lng, service);
      showToast(t("toast_report_updated"));
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
    list.innerHTML = `<li class="feed-empty">${t("feed_empty")}</li>`;
    return;
  }
  list.innerHTML = items.map((it) => {
    const svc = it.service || "power";
    const key = it.type === "out" ? `feed_out_reported_${svc}` : `feed_on_reported_${svc}`;
    return `<li>${t(key)}
      <span class="feed-time">${timeAgo(it.updatedAt)}</span>
    </li>`;
  }).join("");
}

function renderOutagesTable() {
  const body = document.getElementById("outagesTableBody");

  // One row per individual report (not per grid cell), so the table
  // matches what's now shown on the map — two nearby reports = two rows.
  const rows = lastReportDocs
    .filter((r) => r.cell && r.updatedAt)
    .map((r) => {
      const svc = r.service || "power";
      const c = cellsData[`${svc}_${r.cell}`];
      return {
        id: r.id, cell: r.cell, lat: r.lat, lng: r.lng, service: svc,
        status: r.type,
        confirmed: c ? c.out >= 2 : false,
        updatedAt: r.updatedAt
      };
    })
    .filter((r) => outageFilter === "all" ? true : r.status === outageFilter)
    .sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());

  if (rows.length === 0) {
    body.innerHTML = `<tr><td colspan="5" class="table-empty">${lastReportDocs.length === 0 ? t("table_empty") : t("table_filtered_empty")}</td></tr>`;
    return;
  }

  body.innerHTML = rows.map((r) => `
    <tr data-lat="${r.lat}" data-lng="${r.lng}">
      <td class="area-name" data-cell="${r.cell}" data-row="${r.id}">${t("locating")}</td>
      <td>${r.service === "water" ? "💧" : "⚡"}</td>
      <td>
        <span class="status-cell">
          <span class="dot ${r.status === "out" ? (r.confirmed ? (r.service === "water" ? "dot-water-out" : "dot-out") : (r.service === "water" ? "dot-water-out-weak" : "dot-out-weak")) : "dot-on"}"></span>
          ${r.status === "out" ? t(r.service === "water" ? "status_no_water" : "status_no_power") : t(r.service === "water" ? "status_water_on" : "status_power_on")}
        </span>
      </td>
      <td>${timeAgo(r.updatedAt)}</td>
      <td><button class="row-btn" data-goto-lat="${r.lat}" data-goto-lng="${r.lng}" data-goto-service="${r.service}">${t("table_view")}</button></td>
    </tr>
  `).join("");

  // geocode once per cell, then fill in every row that shares that cell
  const seenCells = new Set();
  rows.forEach((r) => {
    if (seenCells.has(r.cell)) return;
    seenCells.add(r.cell);
    requestReverseGeocode(r.cell, r.lat, r.lng, (label) => {
      body.querySelectorAll(`.area-name[data-cell="${r.cell}"]`).forEach((cell) => {
        cell.textContent = label;
      });
    });
  });

  body.querySelectorAll("[data-goto-lat]").forEach((btn) => {
    btn.onclick = () => {
      const lat = parseFloat(btn.dataset.gotoLat);
      const lng = parseFloat(btn.dataset.gotoLng);
      const svc = btn.dataset.gotoService;
      if (svc && svc !== activeService) {
        activeService = svc;
        document.querySelectorAll(".service-btn").forEach((b) => b.classList.toggle("active", b.dataset.service === svc));
        updateServiceUI();
        renderMapMarkers();
      }
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
function sosCooldownRemainingMs() {
  const until = parseInt(localStorage.getItem("nour_sos_cooldown_until") || "0", 10);
  return Math.max(0, until - Date.now());
}

function openSOSSheet() {
  const remaining = sosCooldownRemainingMs();
  if (remaining > 0) {
    showToast(t("toast_sos_cooldown"));
    return;
  }
  document.getElementById("sheetOverlay").classList.remove("hidden");
}
function closeSOSSheet() {
  document.getElementById("sheetOverlay").classList.add("hidden");
  selectedSOSReason = null;
  selectedSOSUrgency = "normal";
  document.querySelectorAll("#sosReasonChips .chip").forEach((c) => c.classList.remove("selected"));
  document.querySelectorAll("#sosUrgencyChips .chip").forEach((c) => c.classList.toggle("selected", c.dataset.urgency === "normal"));
  document.getElementById("sosSubmit").disabled = true;
  document.getElementById("sosNote").value = "";
}

async function submitSOS() {
  await authReady;
  if (sosCooldownRemainingMs() > 0) {
    showToast(t("toast_sos_cooldown"));
    return;
  }
  try {
    const loc = await getLocation();
    const s = snap(loc.lat, loc.lng);
    const note = document.getElementById("sosNote").value.trim();
    const docId = uid;
    await setDoc(doc(db, "sos", docId), {
      uid, lat: s.lat, lng: s.lng,
      reason: selectedSOSReason,
      urgency: selectedSOSUrgency,
      note,
      active: true, helpersCount: 0, flags: 0, flaggedBy: [],
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + SOS_TTL_HOURS * 3600 * 1000)
    });
    mySOSDocId = docId;
    localStorage.setItem("nour_active_sos", docId);
    closeSOSSheet();
    showToast(t("toast_sos_sent"));
  } catch (err) {
    console.error(err);
    showToast(t("toast_sos_location_required"));
  }
}

async function markSafe(sosId) {
  const id = sosId || mySOSDocId;
  if (!id) return;
  try {
    await deleteDoc(doc(db, "sos", id));
    if (id === mySOSDocId) {
      localStorage.removeItem("nour_active_sos");
      localStorage.setItem("nour_sos_cooldown_until", String(Date.now() + SOS_COOLDOWN_MIN * 60 * 1000));
      mySOSDocId = null;
    }
    showToast(t("toast_safe_marked"));
    closeSOSDetail();
    map.closePopup();
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
    const now = Date.now();
    const docs = [];
    snap_.forEach((d) => {
      const data = { id: d.id, ...d.data() };
      const isMine = data.uid === uid;
      const isExpired = data.expiresAt && data.expiresAt.toMillis && data.expiresAt.toMillis() < now;
      if (isExpired) {
        // best-effort self-cleanup so stale SOS docs don't linger
        if (isMine) deleteDoc(doc(db, "sos", data.id)).catch(() => {});
        return;
      }
      const isHidden = !isMine && (data.flags || 0) >= SOS_FLAG_HIDE_THRESHOLD;
      if (isHidden) return;
      docs.push(data);
    });
    sosData = docs;
    renderSOSMarkers();
    renderSOSList();
    maybeNudgeCheckin();
  }, (err) => console.error("sos subscribe error", err));
}

function reasonLabel(reason) {
  return t(`reason_${reason}_full`);
}

function renderSOSMarkers() {
  sosLayer.clearLayers();
  sosData.forEach((s) => {
    const mine = s.uid === uid;
    if (mine) mySOSDocId = s.id;
    const cls = s.urgency === "urgent" ? "sos urgent" : "sos";
    const marker = L.marker([s.lat, s.lng], { icon: makeDivIcon(cls, "🆘") });
    marker.on("click", () => openSOSDetail(s.id));
    marker.addTo(sosLayer);
  });
  document.getElementById("statSOS").textContent = sosData.length;
}

function renderSOSList() {
  const list = document.getElementById("sosListItems");
  if (sosData.length === 0) {
    list.innerHTML = `<li class="feed-empty">${t("sos_empty")}</li>`;
    return;
  }
  const withDistance = sosData.map((s) => ({
    ...s,
    dist: lastKnownLocation ? distanceKm(lastKnownLocation.lat, lastKnownLocation.lng, s.lat, s.lng) : null
  }));
  withDistance.sort((a, b) => {
    if (a.urgency === "urgent" && b.urgency !== "urgent") return -1;
    if (b.urgency === "urgent" && a.urgency !== "urgent") return 1;
    if (a.dist == null && b.dist == null) return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
    if (a.dist == null) return 1;
    if (b.dist == null) return -1;
    return a.dist - b.dist;
  });

  list.innerHTML = withDistance.map((s) => `
    <li class="sos-item ${s.urgency === "urgent" ? "urgent" : ""}" data-id="${s.id}">
      <div class="sos-item-top">
        <span class="sos-item-reason">${s.urgency === "urgent" ? `<span class="urgent-badge">${t("sos_urgent_badge")}</span>` : ""}${reasonLabel(s.reason)}</span>
        ${s.dist != null ? `<span class="sos-item-dist">${s.dist < 1 ? Math.round(s.dist * 1000) + "m" : s.dist.toFixed(1) + "km"}</span>` : ""}
      </div>
      <div class="sos-item-meta">${timeAgo(s.createdAt)} · ${t("sos_helpers", { n: s.helpersCount || 0 })}</div>
    </li>
  `).join("");

  list.querySelectorAll(".sos-item").forEach((el) => {
    el.onclick = () => openSOSDetail(el.dataset.id);
  });
}

// Gently nudge someone whose own SOS has been active a while — once per session.
function maybeNudgeCheckin() {
  if (checkinNudgedThisSession) return;
  const mine = sosData.find((s) => s.uid === uid);
  if (!mine || !mine.createdAt) return;
  const ageHours = (Date.now() - mine.createdAt.toMillis()) / 3600000;
  if (ageHours >= SOS_CHECKIN_HOURS) {
    checkinNudgedThisSession = true;
    showToast(t("sos_checkin_prompt"), 5000);
  }
}

// ---------------------------------------------------------------
// SOS detail sheet: owner sees a list of private helper threads,
// a helper goes straight into their own 1-on-1 thread with the owner.
// ---------------------------------------------------------------
function openSOSDetail(sosId) {
  const s = sosData.find((x) => x.id === sosId);
  if (!s) return;
  activeSOSDetailId = sosId;
  const mine = s.uid === uid;

  document.getElementById("sosDetailTitle").textContent = (s.urgency === "urgent" ? "🔴 " : "") + reasonLabel(s.reason);
  document.getElementById("sosDetailMeta").textContent = t("sos_detail_meta", {
    time: timeAgo(s.createdAt),
    n: s.helpersCount || 0
  });
  document.getElementById("sosDetailNote").textContent = s.note ? `"${s.note}"` : "";

  const ageHours = s.createdAt ? (Date.now() - s.createdAt.toMillis()) / 3600000 : 0;
  const showCheckin = mine && ageHours >= SOS_CHECKIN_HOURS;
  document.getElementById("sosCheckinBanner").classList.toggle("hidden", !showCheckin);
  document.getElementById("checkinStillNeed").onclick = () => {
    document.getElementById("sosCheckinBanner").classList.add("hidden");
    showToast(t("toast_checkin_ack"));
  };
  document.getElementById("checkinSafe").onclick = () => markSafe(sosId);

  document.getElementById("sosDetailOwnerActions").classList.toggle("hidden", !mine);
  document.getElementById("sosDetailMarkSafe").onclick = () => markSafe(sosId);

  const flagBtn = document.getElementById("sosFlagBtn");
  const alreadyFlagged = (s.flaggedBy || []).includes(uid);
  flagBtn.classList.toggle("hidden", mine);
  flagBtn.onclick = () => flagSOS(sosId, alreadyFlagged);

  document.getElementById("sosThreadBack").classList.add("hidden");

  if (mine) {
    document.getElementById("threadsListWrap").classList.remove("hidden");
    document.getElementById("threadWrap").classList.add("hidden");
    subscribeThreadsList(sosId);
  } else {
    document.getElementById("threadsListWrap").classList.add("hidden");
    openThread(sosId, uid, false);
  }

  document.getElementById("sosDetailOverlay").classList.remove("hidden");
}

function closeSOSDetail() {
  document.getElementById("sosDetailOverlay").classList.add("hidden");
  if (unsubscribeThreadsList) { unsubscribeThreadsList(); unsubscribeThreadsList = null; }
  if (unsubscribeThreadMessages) { unsubscribeThreadMessages(); unsubscribeThreadMessages = null; }
  activeSOSDetailId = null;
  activeThreadHelperUid = null;
}

async function flagSOS(sosId, alreadyFlagged) {
  if (alreadyFlagged) {
    showToast(t("toast_flag_already"));
    return;
  }
  // Flagging is what eventually hides someone's emergency from the map
  // (see SOS_FLAG_HIDE_THRESHOLD), so require a deliberate confirmation
  // rather than acting on a single accidental tap.
  const confirmed = window.confirm(t("sos_flag_confirm"));
  if (!confirmed) return;
  try {
    await updateDoc(doc(db, "sos", sosId), { flags: increment(1), flaggedBy: arrayUnion(uid) });
    showToast(t("toast_flag_sent"));
    closeSOSDetail();
  } catch (err) {
    console.error(err);
  }
}

// Owner's view: list of helpers who have opened a private thread with them.
function subscribeThreadsList(sosId) {
  if (unsubscribeThreadsList) unsubscribeThreadsList();
  const q = query(collection(db, "sos", sosId, "threads"), orderBy("lastMessageAt", "desc"));
  unsubscribeThreadsList = onSnapshot(q, (snap_) => {
    const list = document.getElementById("threadsList");
    if (snap_.empty) {
      list.innerHTML = `<li class="feed-empty">${t("sos_no_helpers_yet")}</li>`;
      return;
    }
    const items = [];
    snap_.forEach((d) => items.push({ id: d.id, ...d.data() }));
    list.innerHTML = items.map((th) => `
      <li class="thread-item" data-helper="${th.id}">
        <span class="thread-item-preview">${escapeHtml(th.lastMessageText || "")}</span>
        <span class="thread-item-time">${timeAgo(th.lastMessageAt)}</span>
      </li>
    `).join("");
    list.querySelectorAll(".thread-item").forEach((el) => {
      el.onclick = () => openThread(sosId, el.dataset.helper, true);
    });
  }, (err) => console.error("threads list subscribe error", err));
}

// Opens the 1-on-1 private thread between the SOS owner and one helper.
// helperUid identifies the thread; only that helper and the SOS owner can see it.
function openThread(sosId, helperUid, cameFromList) {
  activeThreadHelperUid = helperUid;
  document.getElementById("threadsListWrap").classList.add("hidden");
  document.getElementById("threadWrap").classList.remove("hidden");
  document.getElementById("sosThreadBack").classList.toggle("hidden", !cameFromList);
  document.getElementById("sosThreadBack").onclick = () => {
    if (unsubscribeThreadMessages) { unsubscribeThreadMessages(); unsubscribeThreadMessages = null; }
    document.getElementById("threadWrap").classList.add("hidden");
    document.getElementById("threadsListWrap").classList.remove("hidden");
    activeThreadHelperUid = null;
  };

  document.getElementById("commentInput").value = "";
  const isOwnerOfSOS = document.getElementById("sosDetailOwnerActions").classList.contains("hidden") === false;
  document.getElementById("commentSend").onclick = () => sendThreadMessage(sosId, helperUid, isOwnerOfSOS);

  subscribeThreadMessages(sosId, helperUid);
}

let currentThreadMessageCount = 0;

function subscribeThreadMessages(sosId, helperUid) {
  if (unsubscribeThreadMessages) unsubscribeThreadMessages();
  const q = query(collection(db, "sos", sosId, "threads", helperUid, "messages"), orderBy("createdAt", "asc"));
  unsubscribeThreadMessages = onSnapshot(q, (snap_) => {
    currentThreadMessageCount = snap_.size;
    const list = document.getElementById("commentList");
    if (snap_.empty) {
      list.innerHTML = `<li class="feed-empty">${t("sos_thread_empty")}</li>`;
      return;
    }
    const items = [];
    snap_.forEach((d) => items.push({ id: d.id, ...d.data() }));
    list.innerHTML = items.map((c) => {
      const own = c.uid === uid;
      return `<li class="${own ? "own" : ""}" data-msg-id="${c.id}">
        ${escapeHtml(c.text)}
        <span class="comment-time">${timeAgo(c.createdAt)}</span>
        ${own ? `<button class="comment-delete-btn" data-msg-id="${c.id}" title="${t("comment_delete")}">✕</button>` : ""}
      </li>`;
    }).join("");
    list.scrollTop = list.scrollHeight;
    list.querySelectorAll(".comment-delete-btn").forEach((btn) => {
      btn.onclick = () => deleteDoc(doc(db, "sos", sosId, "threads", helperUid, "messages", btn.dataset.msgId)).catch((e) => console.error(e));
    });
  }, (err) => console.error("thread messages subscribe error", err));
}

async function sendThreadMessage(sosId, helperUid, isOwner) {
  await authReady;
  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!text) return;
  try {
    const wasFirstMessageFromHelper = !isOwner && currentThreadMessageCount === 0;
    await addDoc(collection(db, "sos", sosId, "threads", helperUid, "messages"), {
      uid, text, createdAt: serverTimestamp()
    });
    await setDoc(doc(db, "sos", sosId, "threads", helperUid), {
      helperUid, lastMessageAt: serverTimestamp(), lastMessageText: text, lastMessageBy: uid
    }, { merge: true });
    if (wasFirstMessageFromHelper) {
      await updateDoc(doc(db, "sos", sosId), { helpersCount: increment(1) }).catch(() => {});
    }
    input.value = "";
    if (isOwner) showToast(t("toast_message_sent"));
  } catch (err) {
    console.error(err);
    showToast(t("toast_message_failed"));
  }
}

// ---------------------------------------------------------------
// Language switching
// ---------------------------------------------------------------
function wireLangSwitch() {
  const buttons = document.querySelectorAll(".lang-btn");
  function refreshActive() {
    buttons.forEach((b) => b.classList.toggle("active", b.dataset.lang === currentLang));
  }
  buttons.forEach((btn) => {
    btn.onclick = () => {
      setLang(btn.dataset.lang);
      applyStaticTranslations();
      refreshActive();
      updateServiceUI();
      renderMapMarkers();
      renderFeed(lastReportDocs);
      renderOutagesTable();
      renderSOSList();
      // Different languages have different label lengths, which can
      // change how many lines the topbar wraps to.
      requestAnimationFrame(positionSearchBar);
    };
  });
  refreshActive();
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

  document.querySelectorAll("#sosUrgencyChips .chip").forEach((chip) => {
    chip.onclick = () => {
      document.querySelectorAll("#sosUrgencyChips .chip").forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
      selectedSOSUrgency = chip.dataset.urgency;
    };
  });

  document.getElementById("sosDetailClose").onclick = closeSOSDetail;

  const TAB_PANEL_IDS = { legend: "tabLegend", outages: "tabOutages", sos: "tabSOS" };
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const panelId = TAB_PANEL_IDS[btn.dataset.tab];
      const panel = panelId && document.getElementById(panelId);
      if (panel) panel.classList.add("active");
      if (btn.dataset.tab === "sos") renderSOSList();
      if (btn.dataset.tab === "outages") renderOutagesTable();
    };
  });

  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.onclick = () => {
      document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      outageFilter = chip.dataset.filter;
      renderOutagesTable();
    };
  });

  wireSearch();
  wireLangSwitch();
  wireServiceSwitch();

  document.getElementById("searchConfirmCancel").onclick = () => {
    document.getElementById("searchConfirmOverlay").classList.add("hidden");
    if (searchMarker) { map.removeLayer(searchMarker); searchMarker = null; }
  };
  document.getElementById("searchConfirmOut").onclick = async () => {
    if (!searchedLocation) return;
    await submitReport("out", searchedLocation.lat, searchedLocation.lng, activeService);
    showToast(t("toast_search_out", { label: searchedLocation.label, service: serviceLabel(activeService) }));
    document.getElementById("searchConfirmOverlay").classList.add("hidden");
  };
  document.getElementById("searchConfirmOn").onclick = async () => {
    if (!searchedLocation) return;
    await submitReport("on", searchedLocation.lat, searchedLocation.lng, activeService);
    showToast(t("toast_search_on", { label: searchedLocation.label, service: serviceLabel(activeService) }));
    document.getElementById("searchConfirmOverlay").classList.add("hidden");
  };
}

// ---------------------------------------------------------------
// Boot
// ---------------------------------------------------------------
async function boot() {
  setLang(currentLang);
  applyStaticTranslations();

  await authReady;
  uid = auth.currentUser ? auth.currentUser.uid : (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()));
  mySOSDocId = localStorage.getItem("nour_active_sos") || null;

  initMap();
  wireUI();
  updateServiceUI();
  subscribeReports();
  subscribeSOS();

  positionSearchBar();
  window.addEventListener("resize", positionSearchBar);
  window.addEventListener("orientationchange", () => setTimeout(positionSearchBar, 200));
  // Fonts (Space Grotesk / Noto Sans Arabic) can finish loading after first
  // paint and change the topbar's height slightly — re-measure once they're in.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(positionSearchBar).catch(() => {});
  }

  getLocation().catch(() => {});

  setInterval(subscribeReports, 5 * 60 * 1000);
}

boot();

import { db, auth } from "./admin-firebase-config.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  collection, query, where, orderBy, limit, getDocs,
  deleteDoc, doc, Timestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


const ADMIN_UID = "ZfM9Ok4YYvPsEivfjY0YeEtgBG33";

const REASON_LABELS = {
  oxygen: "Oxygen concentrator", fridge: "Fridge-stored medication",
  medical: "Other medical device", other: "Other emergency"
};

function timeAgo(ts) {
  if (!ts) return "—";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
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
  loadStats();
  loadFlaggedSOS();
  loadRecentReports();
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
// Stats
// ---------------------------------------------------------------
async function loadStats() {
  try {
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 12 * 3600 * 1000));
    const [reportsSnap, sosSnap, flaggedSnap] = await Promise.all([
      getDocs(query(collection(db, "reports"), where("updatedAt", ">=", cutoff))),
      getDocs(query(collection(db, "sos"), where("active", "==", true))),
      getDocs(query(collection(db, "sos"), where("flags", ">", 0)))
    ]);
    document.getElementById("statActiveReports").textContent = reportsSnap.size;
    document.getElementById("statActiveSOS").textContent = sosSnap.size;
    document.getElementById("statFlagged").textContent = flaggedSnap.size;
  } catch (err) {
    console.error("loadStats failed:", err);
  }
}


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
    el.innerHTML = rows.map((r) => `
      <div class="admin-row" data-id="${r.id}">
        <div class="admin-row-main">
          <strong>${REASON_LABELS[r.reason] || "Emergency"}</strong>
          <span class="admin-row-meta">${r.flags} flag${r.flags === 1 ? "" : "s"} · ${timeAgo(r.createdAt)} · lat ${r.lat}, lng ${r.lng}</span>
          ${r.note ? `<span class="admin-row-note">"${r.note}"</span>` : ""}
        </div>
        <button class="admin-delete-btn" data-collection="sos" data-id="${r.id}">Delete</button>
      </div>
    `).join("");
    wireDeleteButtons();
  } catch (err) {
    console.error("loadFlaggedSOS failed:", err);
    el.innerHTML = `<p class="admin-empty">Couldn't load flagged SOS.</p>`;
  }
}

// ---------------------------------------------------------------
// Recent reports moderation
// ---------------------------------------------------------------
async function loadRecentReports() {
  const el = document.getElementById("reportsList");
  try {
    const snap = await getDocs(query(collection(db, "reports"), orderBy("updatedAt", "desc"), limit(50)));
    if (snap.empty) {
      el.innerHTML = `<p class="admin-empty">No reports yet.</p>`;
      return;
    }
    const rows = [];
    snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
    el.innerHTML = rows.map((r) => `
      <div class="admin-row" data-id="${r.id}">
        <div class="admin-row-main">
          <strong>${r.service === "water" ? "💧" : "⚡"} ${r.type === "out" ? "Out" : "Back on"}</strong>
          <span class="admin-row-meta">lat ${r.lat}, lng ${r.lng} · ${timeAgo(r.updatedAt)} · uid ${r.uid ? r.uid.slice(0, 8) : "?"}…</span>
        </div>
        <button class="admin-delete-btn" data-collection="reports" data-id="${r.id}">Delete</button>
      </div>
    `).join("");
    wireDeleteButtons();
  } catch (err) {
    console.error("loadRecentReports failed:", err);
    el.innerHTML = `<p class="admin-empty">Couldn't load reports.</p>`;
  }
}

function wireDeleteButtons() {
  document.querySelectorAll(".admin-delete-btn").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Delete this permanently? This can't be undone.")) return;
      try {
        await deleteDoc(doc(db, btn.dataset.collection, btn.dataset.id));
        btn.closest(".admin-row").remove();
        loadStats();
      } catch (err) {
        console.error("delete failed:", err);
        alert("Couldn't delete — check the console for details.");
      }
    };
  });
}

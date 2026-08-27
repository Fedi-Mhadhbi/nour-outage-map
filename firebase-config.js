// ============================================================
// 1. Go to https://console.firebase.google.com
// 2. Create a project (free "Spark" plan is enough)
// 3. Project settings > General > "Your apps" > Web app (</>) icon
// 4. Copy the config object it gives you and paste it below
// 5. In the Firebase console, enable:
//      - Build > Authentication > Sign-in method > Anonymous > Enable
//      - Build > Firestore Database > Create database (start in production mode)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDK4ZoE5brtruQ8O3EX0ZrGFZZiQM4OzQ",
  authDomain: "nour-outage-map.firebaseapp.com",
  projectId: "nour-outage-map",
  storageBucket: "nour-outage-map.firebasestorage.app",
  messagingSenderId: "615520296779",
  appId: "1:615520296779:web:0ec80819f8f24c4db552ce"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

// Anonymous sign-in so every device has a stable uid without needing
// an account. This is what lets us stop the same person voting twice
// and lets someone clear their own SOS later.
export const authReady = signInAnonymously(auth).catch((err) => {
  console.error("Anonymous sign-in failed:", err);
});

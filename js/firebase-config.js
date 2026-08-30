

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCfNKdDoGxMJhztHRcyLcB5UG7wN7-y8Pk",
  authDomain: "nour-outage-map.firebaseapp.com",
  projectId: "nour-outage-map",
  storageBucket: "nour-outage-map.firebasestorage.app",
  messagingSenderId: "615520296779",
  appId: "1:615520296779:web:0ec80819f8f24c4db552ce"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);


export const authReady = signInAnonymously(auth).catch((err) => {
  console.error("Anonymous sign-in failed:", err);
});

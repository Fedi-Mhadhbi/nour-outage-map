
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCfNKdDoGxMJhztHRcyLcB5UG7wN7-y8Pk",
  authDomain: "nour-outage-map.firebaseapp.com",
  projectId: "nour-outage-map",
  storageBucket: "nour-outage-map.firebasestorage.app",
  messagingSenderId: "615520296779",
  appId: "1:615520296779:web:0ec80819f8f24c4db552ce"
};

// Named secondary app instance so this can never collide with the main
// app's Firebase instance, even if both ever ended up loaded together.
export const adminFirebaseApp = initializeApp(firebaseConfig, "adminApp");
export const db = getFirestore(adminFirebaseApp);
export const auth = getAuth(adminFirebaseApp);

// Nour service worker — caches the app shell (HTML/CSS/JS) so the interface
// loads instantly and the "Install" prompt becomes available. Live data
// (Firestore, search, geocoding) always goes over the network as normal —
// this only ever caches the static files that make up the app itself.

const CACHE_NAME = "nour-shell-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/i18n.js",
  "./js/firebase-config.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only manage requests for our own app-shell files. Everything else
  // (Firestore, Nominatim search, OpenStreetMap tiles, Google fonts) is
  // left completely alone and goes straight to the network as normal.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      // Cache-first for instant loads, but always refresh in the background
      // so an update deployed to GitHub Pages doesn't stay stuck forever.
      return cached || network;
    })
  );
});

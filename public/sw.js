// Minimal service worker: makes the app installable. Offline caching and push
// come later — keep this boring until there's a real requirement.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

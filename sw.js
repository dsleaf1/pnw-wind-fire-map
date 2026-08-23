const CACHE_VERSION = "pnwwind-shell-v2";

const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => Promise.allSettled(
        SHELL.map((u) => cache.add(new Request(u, { cache: "no-cache" })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith("pnwwind-shell-") && k !== CACHE_VERSION)
            .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    const last = url.pathname.split("/").pop();
    const isAppDoc = last === "" || last === "index.html";
    if (isAppDoc) {
      event.respondWith(
        caches.match(req, { ignoreSearch: true })
          .then((r) => r || caches.match("./index.html", { ignoreSearch: true }))
          .then((r) => r || fetch(req))
      );
      return;
    }
  }

  const last = url.pathname.split("/").pop();
  const isShell = SHELL.some((s) => s.endsWith(last));
  if (isShell) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((cached) => cached || fetch(req))
    );
  } else {
    event.respondWith(
      fetch(req).catch(() => caches.match(req, { ignoreSearch: true }))
    );
  }
});

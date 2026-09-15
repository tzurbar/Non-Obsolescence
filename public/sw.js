// Service worker for the installed/home-screen app.
//
// Network-first, cache as fallback: the site rebuilds on every content
// change, so a reachable server must always win over a cached copy. The
// cache exists for the case this site is actually built for - standing in
// front of the thing you're repairing, with no usable signal - where any
// guide you've already opened should still come up.
//
// Never cached: /api/* (submissions must reach the real server) and
// /manager/* (admin-only, sits behind Cloudflare Access - a cached copy
// has no business living on a device).

const CACHE = 'non-obsolescence-v1';
const SHELL = ['/', '/guides', '/data', '/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  // Individual failures shouldn't abort the whole install.
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname === '/manager' || url.pathname.startsWith('/manager/')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // An unvisited page while offline: fall back to the home page so
        // the app opens to something usable rather than a browser error.
        if (request.mode === 'navigate') {
          const home = await caches.match('/');
          if (home) return home;
        }
        return Response.error();
      })
  );
});

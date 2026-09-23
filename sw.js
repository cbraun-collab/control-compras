const CACHE_NAME = 'control-compras-senercom-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// Network-first: siempre intenta traer la versión más nueva; si falla, usa caché.
// El Cache API del navegador solo acepta guardar respuestas de peticiones GET —
// intentar cache.put() con un POST (como los que ahora usa callBackend hacia Apps
// Script) lanza "Failed to execute 'put' on 'Cache': Request method 'POST' is
// unsupported". Los POST nunca deben cachearse de todas formas (son llamadas al
// backend, no archivos de la app), así que simplemente no se guardan en caché;
// solo se dejan pasar directo a la red.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

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
// backend, no archivos de la app), así que simplemente no se guardan en caché.
//
// Además: las llamadas a Apps Script NUNCA deben pasar por el Service Worker en
// absoluto. Apps Script responde con un redirect 302 hacia una URL de un solo uso
// (script.googleusercontent.com/echo?...&user_content_key=...). Si el Service Worker
// intercepta la petición y hace su propio fetch(e.request), termina duplicando esa
// petición — el navegador sigue el redirect por su cuenta Y el Service Worker vuelve
// a pedir lo mismo, y la copia que llega segunda se encuentra la URL de un solo uso ya
// gastada → 404 intermitente y esperas de hasta 45s. Por eso estas llamadas se dejan
// pasar de largo, sin e.respondWith(), para que el navegador las maneje directo, sin
// el Service Worker en medio.
self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  if (url.includes('script.google.com') || url.includes('script.googleusercontent.com')) {
    return; // no interceptar — se deja pasar nativo, fuera del Service Worker
  }
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

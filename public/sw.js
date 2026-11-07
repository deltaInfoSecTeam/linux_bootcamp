const CACHE_NAME = 'linux-bootcamp-v175';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './generator.html',
  './manifest.json',
  './css/styles.css',
  './js/boot.js',
  './js/auth.js',
  './js/core.js',
  './js/questions.js',
  './js/quiz.js',
  './js/llm.js',
  './js/stats.js',
  './js/main.js',
  './js/generator.js',
  './img/favicon.jpg',
  './img/wappen.png',
  './img/tux_army_avatar.png',
  './img/drill_tutor_tux.jpg',
  './img/tux_aap_logo.png',
  './img/tux_passport.jpg',
  './img/fbi_penguin_logo.jpg',
  './img/ranks/Schuetze.svg',
  './img/ranks/Gefreiter.svg',
  './img/ranks/Obergefreiter.svg',
  './img/ranks/Hauptgefreiter.svg',
  './img/ranks/Stabsgefreiter.svg',
  './img/ranks/Oberstabsgefreiter.svg',
  './img/ranks/Unteroffizier.svg',
  './img/ranks/Stabsunteroffizier.svg',
  './img/ranks/Feldwebel.svg',
  './img/ranks/Oberfeldwebel.svg',
  './img/ranks/Hauptfeldwebel.svg',
  './img/ranks/Stabsfeldwebel.svg',
  './img/ranks/Oberstabsfeldwebel.svg',
  './img/ranks/Leutnant.svg',
  './img/ranks/Oberleutnant.svg',
  './img/ranks/Hauptmann.svg',
  './img/ranks/Major.svg',
  './img/ranks/Oberstleutnant.svg',
  './img/ranks/Oberst.svg',
  './img/ranks/Brigadegeneral.svg',
  './img/ranks/Generalmajor.svg',
  './img/ranks/Generalleutnant.svg',
  './img/ranks/General.svg'
];

// Installation: Assets cachen und sofort übernehmen
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Aktivierung: Alte Caches löschen und Kontrolle übernehmen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: Aus Cache laden, falls vorhanden (Offline-First)
self.addEventListener('fetch', (event) => {
  // Nur eigene GET-Anfragen aus dem Cache bedienen; API und fremde Hosts immer live
  const reqUrl = new URL(event.request.url);
  if (event.request.method !== 'GET' || reqUrl.origin !== self.location.origin || reqUrl.pathname.startsWith('/api/')) {
      return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

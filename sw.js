const CACHE_NAME = 'linux-bootcamp-v174';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './generator.html',
  './styles.css',
  './app.js',
  './auth.js',
  './generator.js',
  './manifest.json',
  './tux_army_avatar.png',
  './drill_tutor_tux.jpg',
  './public/wappen.png',
  './public/ranks/Schuetze.svg',
  './public/ranks/Gefreiter.svg',
  './public/ranks/Obergefreiter.svg',
  './public/ranks/Hauptgefreiter.svg',
  './public/ranks/Stabsgefreiter.svg',
  './public/ranks/Unteroffizier.svg',
  './public/ranks/Feldwebel.svg',
  './public/ranks/Leutnant.svg',
  './public/ranks/Oberleutnant.svg',
  './public/ranks/Hauptmann.svg',
  './public/ranks/Major.svg',
  './public/ranks/Oberstleutnant.svg',
  './public/ranks/Oberst.svg',
  './public/ranks/Brigadegeneral.svg',
  './public/ranks/Generalmajor.svg',
  './public/ranks/Generalleutnant.svg',
  './public/ranks/General.svg'
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
  // Ignoriere API-Anfragen an externe Dienste
  if (event.request.url.includes('googleapis.com') || event.request.url.includes('openai.com')) {
      return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

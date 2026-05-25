const CACHE = 'rutinas-v1';
const ASSETS = [
  '/Rutinas/',
  '/Rutinas/index.html',
  '/Rutinas/manifest.json',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/fonts/tabler-icons.woff2'
];

// Install: cache all assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS.filter(function(a) {
        return !a.startsWith('http');
      }));
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
          .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        if (response && response.status === 200 && e.request.method === 'GET') {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        return caches.match('/Rutinas/index.html');
      });
    })
  );
});

// Push notifications
self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Mis Rutinas', {
      body: data.body || '¡Es hora de tu rutina!',
      icon: '/Rutinas/icons/icon-192.png',
      badge: '/Rutinas/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'rutina',
      renotify: true,
      data: { url: '/Rutinas/' }
    })
  );
});

// Notification click
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/Rutinas/');
    })
  );
});

// Daily alarm simulation via periodic sync (if supported)
self.addEventListener('periodicsync', function(e) {
  if (e.tag === 'daily-reminder') {
    e.waitUntil(
      self.registration.showNotification('Mis Rutinas', {
        body: '¡No olvides completar tus hábitos de hoy!',
        icon: '/Rutinas/icons/icon-192.png',
        tag: 'daily'
      })
    );
  }
});

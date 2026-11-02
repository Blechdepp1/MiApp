// Ersetzt den Service Worker der alten Vorschau-Adresse: meldet sich ab und leitet um
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      await self.registration.unregister();
      for (const c of await self.clients.matchAll({ type: 'window' }))
        c.navigate('/MiApp-Vorschau/');
    })(),
  );
});

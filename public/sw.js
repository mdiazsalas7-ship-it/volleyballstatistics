// Service worker mínimo para habilitar instalación (PWA).
// En la Etapa 2 se amplía con caché offline y notificaciones push (FCM).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

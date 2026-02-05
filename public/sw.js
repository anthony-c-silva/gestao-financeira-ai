// public/sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // O navegador exige este evento para considerar o app instalável
  // Aqui você poderia configurar cache offline no futuro
});
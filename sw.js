// Service Worker — Controle de Empréstimos
// Suba a versão do cache sempre que publicar uma alteração no app,
// para forçar o navegador a buscar os arquivos novos.
const CACHE_VERSION = 'v1';
const CACHE_NAME = `emprestimos-${CACHE_VERSION}`;

// Arquivos do próprio app (mesma origem)
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];

// Bibliotecas externas usadas para exportar XLSX/PDF/imagem.
// Ficam cacheadas também, para exportar mesmo sem internet depois do 1º uso.
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    // Cada asset de CDN é buscado separadamente: se um CDN falhar (rede lenta
    // na primeira instalação), o app shell principal ainda fica disponível offline.
    await Promise.all(CDN_ASSETS.map(async url => {
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) await cache.put(url, res);
      } catch (e) { /* será buscado normalmente na próxima vez online */ }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Navegação (abrir/recarregar o app): tenta a rede primeiro, cai para o
  // index.html do cache se estiver offline.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (e) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Demais arquivos (CSS/JS/ícones/CDN): cache-first, com atualização em
  // segundo plano quando online (stale-while-revalidate).
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    const network = fetch(req).then(res => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return cached || (await network) || Response.error();
  })());
});

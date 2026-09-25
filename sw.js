// Interview Coach service worker: offline app shell + best-effort daily nudge.
const VERSION = 'ic-v6';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon-180.png', './favicon-32.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== 'ic-status' && k !== 'ic-runtime').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {   // network first for the page, so updates arrive; cache when offline
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', cp)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  if (url.origin === location.origin) { e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req))); return; }
  if (/fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(url.host)) {   // fonts + resume-reader libraries: cache after first use
    e.respondWith(caches.open('ic-runtime').then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }))));
  }
});
// The page posts today's status; periodic sync (Chrome on Android/desktop, installed app only) uses it.
self.addEventListener('message', e => { if (e.data && e.data.type === 'status') caches.open('ic-status').then(c => c.put('./__status', new Response(JSON.stringify(e.data.status)))); });
async function nudge() {
  const c = await caches.open('ic-status'); const r = await c.match('./__status'); if (!r) return;
  const s = await r.json(); const now = new Date(); const pad = n => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const hm = pad(now.getHours()) + ':' + pad(now.getMinutes());
  const done = s.date === today && s.minutes >= s.minMinutes;
  if (done || hm < (s.prefTime || '19:00') || hm >= '23:00' || s.lastNudge === today) return;
  s.lastNudge = today; await c.put('./__status', new Response(JSON.stringify(s)));
  const left = s.date === today ? Math.max(1, s.minMinutes - s.minutes) : s.minMinutes;
  await self.registration.showNotification('Interview prep: ' + left + ' minutes keeps your streak', { body: s.streak ? `You're on a ${s.streak}-day streak. Tap to start.` : 'Tap to start today\'s plan.', icon: 'icon-192.png', badge: 'icon-192.png', tag: 'daily', data: { url: './?go=start' } });
}
self.addEventListener('periodicsync', e => { if (e.tag === 'daily-nudge') e.waitUntil(nudge()); });
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window' }).then(ws => { for (const w of ws) { if ('focus' in w) { w.postMessage({ type: 'go', to: 'start' }); return w.focus(); } } return self.clients.openWindow(e.notification.data?.url || './'); })); });

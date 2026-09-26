// Interview Coach service worker: offline app shell + best-effort daily nudge that respects today's status.
const VERSION = 'ic-v12';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon-180.png', './favicon-32.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== 'ic-status' && k !== 'ic-runtime').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') { e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', cp)); return r; }).catch(() => caches.match('./index.html'))); return; }
  if (url.origin === location.origin) { e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req))); return; }
  if (/fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(url.host)) {
    e.respondWith(caches.open('ic-runtime').then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }))));
  }
});
// The page posts getTodayStudyStatus() here; the background nudge uses the same answer.
self.addEventListener('message', e => { if (e.data && e.data.type === 'status') caches.open('ic-status').then(c => c.put('./__status', new Response(JSON.stringify(e.data.status)))); });
const pad = n => String(n).padStart(2, '0');
function inQuiet(s, hm) { const a = s.quietStart || '23:00', b = s.quietEnd || '07:00'; return a < b ? (hm >= a && hm < b) : (hm >= a || hm < b); }
async function nudge() {
  const c = await caches.open('ic-status'); const r = await c.match('./__status'); if (!r) return;
  const s = await r.json(), now = new Date(), today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, hm = pad(now.getHours()) + ':' + pad(now.getMinutes());
  const doneToday = s.date === today && (s.minDone || s.excused);
  if (doneToday || hm < (s.prefTime || '19:00') || inQuiet(s, hm) || s.lastNudge === today) return;
  s.lastNudge = today; await c.put('./__status', new Response(JSON.stringify(s)));
  await self.registration.showNotification(`Interview prep: ${s.minMinutes || 15} minutes keeps today`, { body: `${s.consistency != null ? s.consistency + '/7 days this week. ' : ''}Tap to start.`, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'ipcoach', vibrate: [200], actions: [{ action: 'start', title: 'Start now' }, { action: 'snooze', title: 'Later' }], data: { url: './?go=start' } });
}
self.addEventListener('periodicsync', e => { if (e.tag === 'daily-nudge') e.waitUntil(nudge()); });
self.addEventListener('notificationclick', e => {
  e.notification.close(); const act = e.action === 'snooze' ? 'snooze' : 'start';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    for (const w of ws) { if ('focus' in w) { w.postMessage({ type: act === 'snooze' ? 'snooze' : 'go', to: act }); return w.focus(); } }
    return self.clients.openWindow('./?go=' + act);
  }));
});

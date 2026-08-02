// v2: navigations are NETWORK-FIRST. The old cache-first strategy served the
// cached index.html before ever asking the network, so every device ran one
// deploy behind — a critical fix reached volunteers only on their SECOND visit.
// Now a navigation tries the network (3s budget) and falls back to cache only
// when genuinely offline; hashed assets stay cache-first (their names change
// per build, so they can never be stale).
const CACHE_NAME = 'hnps-band-v2';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Network with a timeout: hall wifi stalls rather than fails, and a volunteer
// opening the app should not stare at nothing for 30s when a cached copy
// exists. 3s is enough for a healthy connection to answer.
function networkFirst(request, timeoutMs = 3000) {
  return new Promise(resolve => {
    let settled = false;
    const timer = setTimeout(async () => {
      const cached = await caches.match(request);
      if (!settled && cached) { settled = true; resolve(cached); }
    }, timeoutMs);

    fetch(request).then(res => {
      clearTimeout(timer);
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
      }
      if (!settled) { settled = true; resolve(res); }
    }).catch(async () => {
      clearTimeout(timer);
      const cached = await caches.match(request);
      if (!settled) { settled = true; resolve(cached || Response.error()); }
    });
  });
}

self.addEventListener('fetch', e => {
  // Never intercept non-GETs (cache.put throws on them) and never touch API calls.
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase.co')) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // Static assets: cache-first with background refresh (stale-while-revalidate).
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});

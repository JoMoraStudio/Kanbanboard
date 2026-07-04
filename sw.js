const SHELL_CACHE = "kanban-shell-v1";
const DATA_CACHE = "kanban-data-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.png"
];
const DATA_URL = new URL("./__kanban_data__", self.registration.scope).href;

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function(cache){
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== SHELL_CACHE && k !== DATA_CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event){
  var req = event.request;

  // Fake data-store endpoint, intercepted here instead of hitting the network.
  // Workaround for iOS treating localStorage differently between Safari and
  // a standalone home-screen app: Cache Storage is not split that way, so
  // it is (ab)used here as a tiny key-value store.
  if (req.url === DATA_URL){
    if (req.method === "POST"){
      event.respondWith(
        req.clone().text().then(function(body){
          return caches.open(DATA_CACHE).then(function(cache){
            var stored = new Response(body, { headers: { "Content-Type": "application/json" } });
            return cache.put(DATA_URL, stored).then(function(){
              return new Response("ok");
            });
          });
        })
      );
      return;
    }
    event.respondWith(
      caches.open(DATA_CACHE).then(function(cache){
        return cache.match(DATA_URL).then(function(res){
          return res || new Response("null", { headers: { "Content-Type": "application/json" } });
        });
      })
    );
    return;
  }

  // app shell: cache-first
  event.respondWith(
    caches.match(req).then(function(cached){
      return cached || fetch(req);
    })
  );
});

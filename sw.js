// Teardown service worker. Deploy this once to remove the previously
// installed service worker (app-shell + cache-storage data endpoint)
// now that the project has moved back to a single self-contained
// index.html with no service worker at all.
self.addEventListener("install", function(event){
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(keys.map(function(k){ return caches.delete(k); }));
      })
      .then(function(){ return self.registration.unregister(); })
      .then(function(){ return self.clients.matchAll(); })
      .then(function(clientList){
        clientList.forEach(function(client){ client.navigate(client.url); });
      })
  );
});

/* Netz zuerst, ohne Netz die letzte gespeicherte Fassung. */
var CACHE = "habitgrid-v7";
var FILES = ["./", "./index.html", "./icon.png", "./manifest.webmanifest",
             "./ico-connect.jpg", "./ico-disconnect.jpg", "./ico-refresh.jpg", "./ico-share.jpg", "./ico-info.png",
             "./toggle-on.jpg", "./toggle-off.jpg"];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); }).catch(function(){}));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  if (e.request.method !== "GET") return;
  /* GitHub-Aufrufe nie abfangen und nie zwischenspeichern. */
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copy); }).catch(function(){});
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(hit){
        return hit || caches.match("./index.html");
      });
    })
  );
});

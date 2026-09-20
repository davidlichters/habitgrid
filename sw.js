/* Netz zuerst, ohne Netz die letzte gespeicherte Fassung.
 *
 * 20.09.2026: Auf Davids iPhone kam wochenlang keine neue Fassung an, egal wie
 * oft er die App schloss. Ursache war NICHT dieser Dienst, sondern der
 * HTTP-Zwischenspeicher darunter: `fetch(e.request)` benutzt ihn, GitHub Pages
 * schickt `max-age=600`, und ein iOS-Heimbildschirm-Fenster haelt so eine
 * Seite deutlich laenger fest. Deshalb holen Seiten und Skripte sich jetzt mit
 * `no-store`, also garantiert vom Server.
 */
var CACHE = "habitgrid-v50";
var FILES = ["./", "./index.html", "./icon.png", "./manifest.webmanifest",
             "./ico-connect.jpg", "./ico-disconnect.jpg", "./ico-refresh.jpg", "./ico-share.jpg", "./ico-info.png", "./sheet-bar.jpg", "./cloud.jpg",
             "./toggle-on.jpg", "./toggle-off.jpg", "./toggle-on.mp4", "./toggle-off.mp4"];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); }).catch(function(){}));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

/* Die Seite selbst, das Verzeichnis und alles, was Code ist, darf nie aus
   einem Zwischenspeicher kommen. Bilder und Filme duerfen. */
function frisch(url, req){
  var p = new URL(url).pathname;
  return req.mode === "navigate" || p.endsWith("/") || /\.(html|js|webmanifest|json)$/i.test(p);
}

self.addEventListener("fetch", function(e){
  if (e.request.method !== "GET") return;
  /* GitHub-Aufrufe nie abfangen und nie zwischenspeichern. */
  if (new URL(e.request.url).origin !== self.location.origin) return;
  var anfrage = frisch(e.request.url, e.request)
    ? new Request(e.request.url, { cache: "no-store", credentials: "same-origin" })
    : e.request;
  e.respondWith(
    fetch(anfrage).then(function(res){
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

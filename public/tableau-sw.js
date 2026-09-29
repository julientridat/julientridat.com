/* Le tableau — notifications (service worker, portée /tableau).
   Reçoit les notifications envoyées par le serveur, les affiche, et ouvre le tableau au toucher. */
"use strict";

self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { corps: e.data ? e.data.text() : "" }; }
  e.waitUntil(
    self.registration.showNotification(d.titre || "Le tableau", {
      body: d.corps || "",
      tag: d.tag || undefined,
      renotify: !!d.tag,
      icon: "/tableau-192.png",
      badge: "/tableau-192.png",
      lang: "fr",
      data: { url: d.url || "/tableau" },
    })
  );
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || "/tableau";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (fenetres) {
      for (var i = 0; i < fenetres.length; i++) {
        if (fenetres[i].url.indexOf("/tableau") >= 0 && "focus" in fenetres[i]) return fenetres[i].focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

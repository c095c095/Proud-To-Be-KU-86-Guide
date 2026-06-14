/* Service Worker — Proud to be KU 86 guide
   เปลี่ยนเลขเวอร์ชัน (v1 -> v2 ...) ทุกครั้งที่อัปเดตเนื้อหา เพื่อเคลียร์แคชเก่า */
var CACHE = "ptbku86-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "./qrcode/qr-eval.png",
  "./qrcode/qr-health.png",
  "./qrcode/qr-wellness.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () { /* ignore asset that fails to precache */ })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) { return caches.delete(k); }
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") { return; }

  // Navigation (เปิดหน้าเว็บ): เน็ต-ก่อน เพื่อให้ได้เวอร์ชันล่าสุดเมื่อออนไลน์, ถ้าไม่มีเน็ตใช้แคช
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put("./index.html", copy); });
        return res;
      }).catch(function () {
        return caches.match("./index.html").then(function (m) { return m || caches.match("./"); });
      })
    );
    return;
  }

  // ไฟล์อื่น ๆ (รูป/ฯลฯ): แคช-ก่อน เร็วและใช้ได้ออฟไลน์
  e.respondWith(
    caches.match(req).then(function (cached) {
      return cached || fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
    })
  );
});

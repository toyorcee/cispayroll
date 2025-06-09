// Basic service worker
self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  // Claim clients to ensure the service worker controls all pages
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Don't intercept API requests
  if (event.request.url.includes("/api/")) {
    return;
  }

  // For navigation requests, use network-first strategy
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If fetch fails, return the cached version if available
        return caches.match(event.request);
      })
    );
    return;
  }

  // For other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Cache the response for future use
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open("v1").then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

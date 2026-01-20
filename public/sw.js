// Volga Services - Production Service Worker for TWA/Android AAB
// Version 3 - Optimized for Trusted Web Activity
const CACHE_NAME = 'volga-services-v3';
const OFFLINE_URL = '/offline.html';

// Critical assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/lovable-uploads/59c9df84-8fe5-4586-8345-8d4dc6f37535.png'
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching critical assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately without waiting
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - Network first, cache fallback strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (API calls, analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // Skip Supabase/API calls - these should always be fresh
  if (url.pathname.includes('/rest/') || 
      url.pathname.includes('/auth/') ||
      url.pathname.includes('/functions/')) {
    return;
  }

  // For navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version or offline page
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // For static assets (JS, CSS, images)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Return cached version if available
        return caches.match(request);
      })
  );
});

// Background sync for offline bookings (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncPendingBookings());
  }
});

async function syncPendingBookings() {
  // Placeholder for offline booking sync
  console.log('[SW] Syncing pending bookings...');
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from Volga Services',
      icon: '/lovable-uploads/59c9df84-8fe5-4586-8345-8d4dc6f37535.png',
      badge: '/lovable-uploads/59c9df84-8fe5-4586-8345-8d4dc6f37535.png',
      vibrate: [100, 50, 100],
      tag: data.tag || 'volga-notification',
      renotify: true,
      requireInteraction: data.requireInteraction || false,
      data: {
        url: data.url || '/',
        bookingId: data.bookingId
      },
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Volga Services', options)
    );
  } catch (e) {
    console.error('[SW] Push notification error:', e);
  }
});

// Notification click handler - navigate to relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  
  // Handle action buttons
  if (event.action === 'view-booking' && event.notification.data?.bookingId) {
    const bookingUrl = `/dashboard?booking=${event.notification.data.bookingId}`;
    event.waitUntil(clients.openWindow(bookingUrl));
    return;
  }

  // Default: open the URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow(urlToOpen);
    })
  );
});

// Handle app updates gracefully
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const CACHE_NAME = 'food-alert-v1';
const urlsToCache = [
    '/',
    '/static/app.js',
    '/static/manifest.json',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Install service worker and cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch strategy: Cache first, then network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if found
                if (response) {
                    return response;
                }

                // Clone the request because it's a stream and can only be consumed once
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response because it's a stream
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            // Don't cache API responses
                            if (!event.request.url.includes('/api/')) {
                                cache.put(event.request, responseToCache);
                            }
                        });

                    return response;
                });
            })
    );
});

// Handle background sync for offline actions
self.addEventListener('sync', event => {
    if (event.tag === 'sync-food-postings') {
        event.waitUntil(syncFoodPostings());
    }
});

// Sync food postings when back online
async function syncFoodPostings() {
    try {
        const offlinePostings = await getOfflinePostings();
        for (const posting of offlinePostings) {
            await fetch('/api/food-postings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(posting)
            });
        }
        await clearOfflinePostings();
    } catch (error) {
        console.error('Error syncing postings:', error);
    }
}

// Helper functions for offline storage
async function getOfflinePostings() {
    return new Promise((resolve) => {
        const request = indexedDB.open('FoodAlertDB', 1);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['offlinePostings'], 'readonly');
            const store = transaction.objectStore('offlinePostings');
            const getAll = store.getAll();
            getAll.onsuccess = () => resolve(getAll.result);
        };
    });
}

async function clearOfflinePostings() {
    return new Promise((resolve) => {
        const request = indexedDB.open('FoodAlertDB', 1);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['offlinePostings'], 'readwrite');
            const store = transaction.objectStore('offlinePostings');
            store.clear();
            transaction.oncomplete = () => resolve();
        };
    });
}

// Push notification handling
self.addEventListener('push', event => {

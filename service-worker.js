/**
 * KOLBY'S POKÉDX - SERVICE WORKER
 * =================================
 * 
 * This service worker provides comprehensive offline functionality and caching
 * strategies for the Pokédex application. It implements multiple cache strategies
 * to optimize performance and ensure the app works seamlessly offline.
 * 
 * Caching Strategy:
 * - Cache First: For static assets (CSS, JS, images) that rarely change
 * - Network First: For HTML pages to get fresh content when online
 * - Stale While Revalidate: For API responses to balance freshness and speed
 * 
 * Cache Types:
 * - Static Cache: Application shell (HTML, CSS, JS, fonts, icons)
 * - Dynamic Cache: User-generated content and navigation-based resources
 * - API Cache: PokeAPI responses with intelligent invalidation
 * 
 * Features:
 * - Automatic cache management with versioning
 * - Intelligent cache strategy selection based on resource type
 * - Graceful fallbacks for offline scenarios
 * - Background sync for pending requests when connectivity returns
 * - Cache size management to prevent storage bloat
 * 
 * @author Kolby Landon
 * @version 3.0
 * @since 2023
 */

// ====================================
// CACHE CONFIGURATION AND VERSIONING
// ====================================

const CACHE_NAME = 'pokedex-cache-v21';
const STATIC_CACHE = 'pokedex-static-v21';
const DYNAMIC_CACHE = 'pokedex-dynamic-v21';
const API_CACHE = 'pokedex-api-v21';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/Pages/index.html',
  '/StyleSheets/style.css',
  '/Scripts/main.js',
  '/Scripts/pokemon.js',
  '/Scripts/requests.js',
  '/Scripts/statsChart.js',
  '/Scripts/performance.js',
  '/Scripts/utils/dom-utils.js',
  '/Scripts/utils/audio-utils.js',
  '/Scripts/utils/data-utils.js',
  '/Scripts/utils/navigation-utils.js',
  '/Scripts/utils/storage-utils.js',
  '/Scripts/utils/color-utils.js',
  '/Images/pokeball.png',
  '/Images/pokeball-bullet.png',
  '/manifest.json'
];

// API patterns that should be cached
const API_PATTERNS = [
  /^https:\/\/pokeapi\.co\/api\/v2\//
];

// Maximum cache sizes to prevent storage bloat
const MAX_CACHE_SIZE = {
  [DYNAMIC_CACHE]: 50,
  [API_CACHE]: 150
};

// ====================================
// SERVICE WORKER EVENT HANDLERS
// ====================================

/**
 * Install event: cache static assets
 * Handles initial caching of static application resources
 */
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[ServiceWorker] Caching static assets');
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn('[ServiceWorker] Failed to cache:', url, err);
              return null;
            })
          )
        );
      }),
      // Initialize other caches
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE)
    ]).then(() => {
      console.log('[ServiceWorker] Installation complete');
      return self.skipWaiting();
    }).catch(err => {
      console.error('[ServiceWorker] Installation failed:', err);
    })
  );
});

/**
 * Activate event: clean up old caches and claim clients
 * Handles cache cleanup and client claiming for immediate control
 */
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating...');
  
  const expectedCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => !expectedCaches.includes(cacheName))
            .map(cacheName => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ]).then(() => {
      console.log('[ServiceWorker] Activation complete');
    }).catch(err => {
      console.error('[ServiceWorker] Activation failed:', err);
    })
  );
});

/**
 * Fetch event: implement different caching strategies
 * Main request interceptor that applies appropriate caching strategies
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

// ====================================
// CACHING STRATEGY IMPLEMENTATIONS
// ====================================

/**
 * Main fetch handler that routes requests to appropriate caching strategies
 * @param {Request} request - The fetch request to handle
 * @returns {Promise<Response>} - The response from cache or network
 */
async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Static assets: Cache First strategy
    if (isStaticAsset(request)) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // API requests: Stale While Revalidate strategy
    if (isApiRequest(request)) {
      return await staleWhileRevalidate(request, API_CACHE);
    }
    
    // HTML documents: Network First strategy
    if (request.destination === 'document') {
      return await networkFirst(request, DYNAMIC_CACHE);
    }
    
    // Other requests: Network First strategy
    return await networkFirst(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);
    
    // Return offline fallback if available
    if (request.destination === 'document') {
      const cache = await caches.open(STATIC_CACHE);
      const fallback = await cache.match('/Pages/index.html');
      if (fallback) {
        return fallback;
      }
    }
    
    // Return a basic offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This content is not available offline'
      }), 
      { 
        status: 503, 
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

/**
 * Cache First strategy: Try cache first, fallback to network
 * Optimized for static assets that rarely change
 * @param {Request} request - The request to handle
 * @param {string} cacheName - Name of the cache to use
 * @returns {Promise<Response>} - Cached or network response
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Validate cache freshness for static assets
    const cachedDate = new Date(cachedResponse.headers.get('date') || 0);
    const now = new Date();
    const hoursSinceCached = (now - cachedDate) / (1000 * 60 * 60);
    
    // Return cached response if less than 24 hours old
    if (hoursSinceCached < 24) {
      return cachedResponse;
    }
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      // Clone once and cache asynchronously for better performance
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone).catch(err => 
        console.warn('[ServiceWorker] Cache put failed:', err)
      );
    }
    return networkResponse;
  } catch (error) {
    // Return stale cache if network fails
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Network First strategy: Try network first, fallback to cache
 * Optimized for dynamic content that should be fresh when possible
 * @param {Request} request - The request to handle
 * @param {string} cacheName - Name of the cache to use
 * @returns {Promise<Response>} - Network or cached response
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Stale While Revalidate strategy: Return cache immediately, update in background
 * Optimized for API responses to balance freshness and speed
 * @param {Request} request - The request to handle
 * @param {string} cacheName - Name of the cache to use
 * @returns {Promise<Response>} - Cached response with background update
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
      limitCacheSize(cacheName);
    }
    return networkResponse;
  }).catch(err => {
    console.warn('[ServiceWorker] Background fetch failed:', err);
  });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cached response, wait for network
  return await fetchPromise;
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

/**
 * Check if a request is for a static asset
 * @param {Request} request - The request to check
 * @returns {boolean} - True if the request is for a static asset
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  
  // Check if it's in our static assets list
  if (STATIC_ASSETS.some(asset => request.url.includes(asset) || url.pathname === asset)) {
    return true;
  }
  
  // Check file extensions
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

/**
 * Check if a request is for an API endpoint
 * @param {Request} request - The request to check
 * @returns {boolean} - True if the request is for an API
 */
function isApiRequest(request) {
  return API_PATTERNS.some(pattern => pattern.test(request.url));
}

/**
 * Limit cache size to prevent storage bloat
 * @param {string} cacheName - Name of the cache to limit
 */
async function limitCacheSize(cacheName) {
  const maxSize = MAX_CACHE_SIZE[cacheName];
  if (!maxSize) return;
  
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    const deleteCount = keys.length - maxSize;
    const keysToDelete = keys.slice(0, deleteCount);
    
    await Promise.all(
      keysToDelete.map(key => cache.delete(key))
    );
    
    console.log(`[ServiceWorker] Cleaned ${deleteCount} entries from ${cacheName}`);
  }
}

// ====================================
// MESSAGE HANDLING
// ====================================

/**
 * Message handling for cache updates and commands
 * Provides communication interface between main thread and service worker
 */
self.addEventListener('message', event => {
  const { data } = event;
  
  if (data && data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (data && data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('[ServiceWorker] All caches cleared');
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      }).catch(err => {
        console.error('[ServiceWorker] Failed to clear caches:', err);
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: err.message });
        }
      })
    );
  }
  
  if (data && data.type === 'GET_CACHE_STATUS') {
    event.waitUntil(
      Promise.all([
        caches.open(STATIC_CACHE).then(cache => cache.keys()),
        caches.open(DYNAMIC_CACHE).then(cache => cache.keys()),
        caches.open(API_CACHE).then(cache => cache.keys())
      ]).then(([staticKeys, dynamicKeys, apiKeys]) => {
        const status = {
          [STATIC_CACHE]: staticKeys.length,
          [DYNAMIC_CACHE]: dynamicKeys.length,
          [API_CACHE]: apiKeys.length,
          total: staticKeys.length + dynamicKeys.length + apiKeys.length
        };
        
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true, status });
        }
      }).catch(err => {
        console.error('[ServiceWorker] Failed to get cache status:', err);
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: err.message });
        }
      })
    );
  }
});

// ====================================
// BACKGROUND SYNC
// ====================================

/**
 * Background sync for offline actions
 * Handles data synchronization when connectivity is restored
 */
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * Perform background synchronization tasks
 * Preloads popular Pokemon data when back online
 */
async function doBackgroundSync() {
  try {
    // Preload popular Pokemon data when back online
    const popularPokemon = [
      'https://pokeapi.co/api/v2/pokemon/pikachu',
      'https://pokeapi.co/api/v2/pokemon/charizard',
      'https://pokeapi.co/api/v2/pokemon/blastoise',
      'https://pokeapi.co/api/v2/pokemon/venusaur',
      'https://pokeapi.co/api/v2/pokemon/mewtwo'
    ];
    
    const cache = await caches.open(API_CACHE);
    
    for (const url of popularPokemon) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log('[ServiceWorker] Background sync cached:', url);
        }
      } catch (error) {
        console.warn('[ServiceWorker] Background sync failed for:', url, error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error);
  }
}

// ====================================
// ERROR HANDLING
// ====================================

/**
 * Global error handling for service worker
 */
self.addEventListener('error', event => {
  console.error('[ServiceWorker] Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[ServiceWorker] Unhandled rejection:', event.reason);
  event.preventDefault();
});

console.log('[ServiceWorker] Service Worker script loaded');

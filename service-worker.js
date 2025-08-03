/**
 * KOLBY'S POKÉDEX - SERVICE WORKER SCRIPT
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
  /^https:\/\/pokeapi\.co\/api\/v2\//,
  /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/cries\//,
  /^https:\/\/pokemoncries\.com\//,
  /^https:\/\/play\.pokemonshowdown\.com\/audio\//
];

// Maximum cache sizes to prevent storage bloat
const MAX_CACHE_SIZE = {
  [DYNAMIC_CACHE]: 75,
  [API_CACHE]: 200
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRY = {
  STATIC: 24 * 60 * 60 * 1000,  // 24 hours
  DYNAMIC: 2 * 60 * 60 * 1000,  // 2 hours
  API: 30 * 60 * 1000           // 30 minutes
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
 * Cache First strategy with TTL: Try cache first, check expiry, fallback to network
 * @param {Request} request - The request to handle
 * @param {string} cacheName - Name of the cache to use
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Promise<Response>} - Cached or network response
 */
async function cacheFirstWithTTL(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cache is still fresh
    const cachedDate = new Date(cachedResponse.headers.get('sw-cache-date') || cachedResponse.headers.get('date') || 0);
    const now = new Date();
    const age = now - cachedDate;
    
    if (age < ttl) {
      return cachedResponse;
    }
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Add cache timestamp
      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'sw-cache-date': new Date().toISOString()
        }
      });
      
      cache.put(request, responseWithTimestamp.clone());
      await limitCacheSize(cacheName);
      return responseWithTimestamp;
    }
  } catch (error) {
    console.warn('[ServiceWorker] Network failed, returning stale cache:', error);
  }
  
  // Return stale cache if network fails
  if (cachedResponse) {
    return cachedResponse;
  }
  
  throw new Error('No cache available and network failed');
}

/**
 * Network First strategy with TTL: Try network first, fallback to cache
 * @param {Request} request - The request to handle
 * @param {string} cacheName - Name of the cache to use
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Promise<Response>} - Network or cached response
 */
async function networkFirstWithTTL(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Add cache timestamp
      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'sw-cache-date': new Date().toISOString()
        }
      });
      
      cache.put(request, responseWithTimestamp.clone());
      await limitCacheSize(cacheName);
      return responseWithTimestamp;
    }
    
    return networkResponse;
  } catch (error) {
    // Check if cached response is still valid
    if (cachedResponse) {
      const cachedDate = new Date(cachedResponse.headers.get('sw-cache-date') || cachedResponse.headers.get('date') || 0);
      const age = new Date() - cachedDate;
      
      if (age < ttl * 2) { // Allow stale content up to 2x TTL when offline
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

/**
 * Stale While Revalidate strategy with TTL: Return cache immediately, update in background
 * @param {Request} request - The request to handle
 * @param {string} cacheName - Name of the cache to use
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Promise<Response>} - Cached response with background update
 */
async function staleWhileRevalidateWithTTL(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Check cache freshness
  let shouldRevalidate = true;
  if (cachedResponse) {
    const cachedDate = new Date(cachedResponse.headers.get('sw-cache-date') || cachedResponse.headers.get('date') || 0);
    const age = new Date() - cachedDate;
    shouldRevalidate = age > ttl;
  }
  
  // Background revalidation if needed
  if (shouldRevalidate) {
    fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        const responseWithTimestamp = new Response(networkResponse.body, {
          status: networkResponse.status,
          statusText: networkResponse.statusText,
          headers: {
            ...Object.fromEntries(networkResponse.headers.entries()),
            'sw-cache-date': new Date().toISOString()
          }
        });
        
        cache.put(request, responseWithTimestamp);
        limitCacheSize(cacheName);
      }
    }).catch(err => {
      console.warn('[ServiceWorker] Background revalidation failed:', err);
    });
  }
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cached response, wait for network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'sw-cache-date': new Date().toISOString()
        }
      });
      
      cache.put(request, responseWithTimestamp.clone());
      return responseWithTimestamp;
    }
    return networkResponse;
  } catch (error) {
    throw error;
  }
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
 * Enhanced cache size limiting with LRU eviction
 * @param {string} cacheName - Name of the cache to limit
 */
async function limitCacheSize(cacheName) {
  const maxSize = MAX_CACHE_SIZE[cacheName];
  if (!maxSize) return;
  
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Sort by last access time (LRU)
    const keyDates = await Promise.all(
      keys.map(async key => {
        const response = await cache.match(key);
        const date = response ? response.headers.get('sw-cache-date') || response.headers.get('date') : null;
        return { key, date: new Date(date || 0) };
      })
    );
    
    // Sort oldest first
    keyDates.sort((a, b) => a.date - b.date);
    
    const deleteCount = keys.length - maxSize;
    const keysToDelete = keyDates.slice(0, deleteCount).map(item => item.key);
    
    await Promise.all(
      keysToDelete.map(key => cache.delete(key))
    );
    
    console.log(`[ServiceWorker] Cleaned ${deleteCount} entries from ${cacheName}`);
  }
}

/**
 * Performance monitoring for cache operations
 * @param {string} operation - Operation name
 * @param {Function} fn - Function to measure
 * @returns {Promise<any>} - Function result
 */
async function measurePerformance(operation, fn) {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`[ServiceWorker] ${operation} took ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[ServiceWorker] ${operation} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Cache health check and cleanup
 */
async function performCacheHealthCheck() {
  try {
    const cacheNames = await caches.keys();
    let totalEntries = 0;
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      totalEntries += keys.length;
      
      // Clean up expired entries
      await limitCacheSize(cacheName);
    }
    
    console.log(`[ServiceWorker] Cache health check: ${cacheNames.length} caches, ${totalEntries} total entries`);
    
    // Report storage usage if available
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usageInMB = (estimate.usage / (1024 * 1024)).toFixed(2);
      const quotaInMB = (estimate.quota / (1024 * 1024)).toFixed(2);
      console.log(`[ServiceWorker] Storage usage: ${usageInMB}MB / ${quotaInMB}MB`);
    }
  } catch (error) {
    console.error('[ServiceWorker] Cache health check failed:', error);
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
  
  if (event.tag === 'cache-update') {
    event.waitUntil(updateStaleCache());
  }
});

/**
 * Perform background synchronization tasks
 * Preloads popular Pokemon data when back online
 */
async function doBackgroundSync() {
  try {
    console.log('[ServiceWorker] Starting background sync...');
    
    // Check if we're online
    if (!navigator.onLine) {
      console.log('[ServiceWorker] Still offline, skipping background sync');
      return;
    }
    
    // Preload popular Pokemon data when back online
    const popularPokemon = [
      'https://pokeapi.co/api/v2/pokemon/1',      // Bulbasaur
      'https://pokeapi.co/api/v2/pokemon/4',      // Charmander
      'https://pokeapi.co/api/v2/pokemon/7',      // Squirtle
      'https://pokeapi.co/api/v2/pokemon/25',     // Pikachu
      'https://pokeapi.co/api/v2/pokemon/150',    // Mewtwo
      'https://pokeapi.co/api/v2/pokemon/6',      // Charizard
      'https://pokeapi.co/api/v2/pokemon/9',      // Blastoise
      'https://pokeapi.co/api/v2/pokemon/3'       // Venusaur
    ];
    
    const cache = await caches.open(API_CACHE);
    let successCount = 0;
    
    for (const url of popularPokemon) {
      try {
        const response = await fetch(url, { 
          method: 'GET',
          headers: { 'Cache-Control': 'max-age=300' }
        });
        
        if (response.ok) {
          const responseWithTimestamp = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: {
              ...Object.fromEntries(response.headers.entries()),
              'sw-cache-date': new Date().toISOString()
            }
          });
          
          await cache.put(url, responseWithTimestamp);
          successCount++;
          console.log('[ServiceWorker] Background sync cached:', url);
        }
      } catch (error) {
        console.warn('[ServiceWorker] Background sync failed for:', url, error.message);
      }
    }
    
    console.log(`[ServiceWorker] Background sync completed: ${successCount}/${popularPokemon.length} successful`);
    
    // Perform cache health check
    await performCacheHealthCheck();
    
  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error);
  }
}

/**
 * Update stale cache entries in background
 */
async function updateStaleCache() {
  try {
    const cache = await caches.open(API_CACHE);
    const keys = await cache.keys();
    
    for (const request of keys) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        const cachedDate = new Date(cachedResponse.headers.get('sw-cache-date') || cachedResponse.headers.get('date') || 0);
        const age = new Date() - cachedDate;
        
        // Update if older than 15 minutes
        if (age > 15 * 60 * 1000) {
          try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
              const responseWithTimestamp = new Response(networkResponse.body, {
                status: networkResponse.status,
                statusText: networkResponse.statusText,
                headers: {
                  ...Object.fromEntries(networkResponse.headers.entries()),
                  'sw-cache-date': new Date().toISOString()
                }
              });
              
              await cache.put(request, responseWithTimestamp);
              console.log('[ServiceWorker] Updated stale cache for:', request.url);
            }
          } catch (error) {
            console.warn('[ServiceWorker] Failed to update stale cache for:', request.url, error.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Stale cache update failed:', error);
  }
}

// Periodic cache health check (every 30 minutes)
setInterval(() => {
  performCacheHealthCheck();
}, 30 * 60 * 1000);

// ====================================
// ERROR HANDLING AND NETWORK MONITORING
// ====================================

/**
 * Global error handling for service worker
 */
self.addEventListener('error', event => {
  console.error('[ServiceWorker] Error:', event.error);
  
  // Report critical errors to main thread if possible
  if (self.clients) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_ERROR',
          error: {
            message: event.error.message,
            stack: event.error.stack,
            timestamp: new Date().toISOString()
          }
        });
      });
    });
  }
});

self.addEventListener('unhandledrejection', event => {
  console.error('[ServiceWorker] Unhandled rejection:', event.reason);
  event.preventDefault();
  
  // Report to main thread
  if (self.clients) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_UNHANDLED_REJECTION',
          reason: event.reason?.message || String(event.reason),
          timestamp: new Date().toISOString()
        });
      });
    });
  }
});

/**
 * Network state monitoring
 */
let isOnline = true;

// Monitor network state changes
self.addEventListener('online', () => {
  isOnline = true;
  console.log('[ServiceWorker] Network online - starting background sync');
  
  // Trigger background sync when coming back online
  if (self.registration && self.registration.sync) {
    self.registration.sync.register('background-sync').catch(err => {
      console.warn('[ServiceWorker] Failed to register background sync:', err);
    });
  }
});

self.addEventListener('offline', () => {
  isOnline = false;
  console.log('[ServiceWorker] Network offline - entering offline mode');
});

/**
 * Enhanced fetch with retry logic and timeout
 * @param {Request} request - Request to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} - Response
 */
async function enhancedFetch(request, options = {}) {
  const {
    timeout = 10000,
    retries = 2,
    retryDelay = 1000
  } = options;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(request, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status === 304) {
        return response;
      }
      
      if (response.status >= 400 && response.status < 500) {
        // Client errors - don't retry
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Server errors - retry
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`[ServiceWorker] Request timeout after ${timeout}ms:`, request.url);
      }
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
}

console.log('[ServiceWorker] Service Worker script loaded - Enhanced version with TTL caching, performance monitoring, and error handling');

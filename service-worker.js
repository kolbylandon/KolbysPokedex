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

'use strict';

// ====================================
// CACHE CONFIGURATION AND VERSIONING
// ====================================

const CACHE_NAME = 'pokedex-cache-v24';
const STATIC_CACHE = 'pokedex-static-v24';
const DYNAMIC_CACHE = 'pokedex-dynamic-v24';
const API_CACHE = 'pokedex-api-v24';

// Static assets to cache immediately
const STATIC_ASSETS = [
  './',
  './index.html',
  './Pages/pokedex.html',
  './StyleSheets/main.css',
  './Scripts/main.js',
  './Scripts/pokemon.js',
  './Scripts/requests.js',
  './Scripts/statsChart.js',
  './Scripts/performance.js',
  './Scripts/sw-manager.js',
  './Scripts/utils/dom-utils.js',
  './Scripts/utils/audio-utils.js',
  './Scripts/utils/data-utils.js',
  './Scripts/utils/navigation-utils.js',
  './Scripts/utils/storage-utils.js',
  './Scripts/utils/color-utils.js',
  './Scripts/utils/placeholder-utils.js',
  './Scripts/utils/pokemon-names.js',
  './Images/pokeball.png',
  './Images/pokeball-bullet.png',
  './manifest.json',
  './offline.html'
];

// API patterns that should be cached
const API_PATTERNS = [
  /^https:\/\/pokeapi\.co\/api\/v2\//,
  /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/cries\//,
  /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\//,
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


// Modular event handlers
self.addEventListener('install', event => {
  event.waitUntil(handleInstall());
});

self.addEventListener('activate', event => {
  event.waitUntil(handleActivate());
});

self.addEventListener('fetch', event => {
  event.respondWith(handleFetchEvent(event));
});

// Modularized install logic
async function handleInstall() {
  try {
    const staticCache = await caches.open(STATIC_CACHE);
    try {
      await staticCache.addAll(STATIC_ASSETS);
    } catch (addAllError) {
      // Try to cache assets one by one and log failures
      for (const asset of STATIC_ASSETS) {
        try {
          await staticCache.add(asset);
        } catch (assetError) {
          log('error', `Failed to cache asset: ${asset}`, assetError);
        }
      }
    }
    await Promise.all([
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE)
    ]);
    await self.skipWaiting();
    log('info', 'ServiceWorker installed and static assets cached');
  } catch (err) {
    log('error', 'Install failed:', err);
  }
}

// Modularized activate logic
async function handleActivate() {
  log('info', 'Activating...');
  const expectedCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(cacheName => !expectedCaches.includes(cacheName))
        .map(cacheName => {
          log('info', 'Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
    );
    await self.clients.claim();
    log('info', 'Activation complete');
  } catch (err) {
    log('error', 'Activation failed:', err);
  }
}

// Modularized fetch logic
async function handleFetchEvent(event) {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return fetch(request);
  if (url.searchParams.has('sw-bypass') || url.pathname.includes('sw-bypass')) return fetch(request);
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('cdn.jsdelivr.net')) return fetch(request);

  // Serve placeholder for known external sprite hosts when they fail
  const isSpriteHost = url.hostname.includes('raw.githubusercontent.com') || url.hostname.includes('play.pokemonshowdown.com') || url.hostname.includes('pokemoncries.com');

  // Offline fallback for navigation requests (HTML)
  if (request.mode === 'navigate' || request.destination === 'document') {
    try {
      const response = await enhancedFetch(request);
      if (response && response.ok) {
        // Clone immediately to avoid body used errors when cache.put runs asynchronously
        const responseForCache = response.clone();
        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseForCache));
        return response;
      }
      throw new Error('Network response not ok');
    } catch (err) {
      log('warn', 'Network failed, serving cache or offline page:', err);
      const cached = await caches.match(request);
      if (cached) return cached;
      const offlinePage = await caches.match('./offline.html');
      if (offlinePage) return offlinePage;
      return caches.match('./index.html');
    }
  }
  // For other requests, use main handler
  // If it's an image (sprite) request, try network but fallback to cached placeholder on failure
  if (request.destination === 'image' || isSpriteHost || url.pathname.match(/\.png$|\.jpg$|\.jpeg$|\.gif$/i)) {
    try {
      const response = await enhancedFetch(request);
      if (response && response.ok) {
        // cache sprite responses in dynamic cache
        const cache = await caches.open(DYNAMIC_CACHE);
        const responseForCache = response.clone();
        cache.put(request, responseForCache).catch(() => {});
        return response;
      }
      throw new Error('Sprite network response not ok');
    } catch (err) {
      log('warn', 'Sprite fetch failed, returning placeholder:', err, request.url);
      const placeholder = await caches.match('./Images/pokeball.png');
      if (placeholder) return placeholder;
      return new Response('', { status: 503, statusText: 'Sprite unavailable' });
    }
  }

  return handleFetch(request);
}

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
    if (isStaticAsset(request)) {
      return cacheFirst(request, STATIC_CACHE);
    }
    if (isApiRequest(request)) {
      return staleWhileRevalidate(request, API_CACHE);
    }
    // Default: network first for HTML
    if (request.destination === 'document' || request.url.includes('.html')) {
      return networkFirst(request, DYNAMIC_CACHE);
    }
    // Fallback: cache first for other assets
    return cacheFirst(request, DYNAMIC_CACHE);
  } catch (error) {
    // If offline, try to serve from cache
    return caches.match(request).then(cached => {
      if (cached) return cached;
      // Fallback to main page for navigation requests
      if (request.mode === 'navigate' || request.destination === 'document') {
        return caches.match('./index.html');
      }
      // Fallback to a generic offline response for other assets
      return new Response('Offline. Resource unavailable.', { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/plain' } });
    });
  }
}

// ====================================
// SIMPLE CACHING STRATEGIES (NO TTL)
// ====================================

/**
 * Cache First strategy: Try cache first, fallback to network
 * @param {Request} request - The request to handle
 * @param {string} cacheName - Name of the cache to use
 * @returns {Promise<Response>} - Cached or network response
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request, {ignoreSearch: true});
  if (cachedResponse) return cachedResponse;
  try {
    const response = await enhancedFetch(request);
    if (response && response.ok) {
      // Clone immediately for caching
      const responseForCache = response.clone();
      cache.put(request, responseForCache);
      limitCacheSize(cacheName);
    }
    return response;
  } catch (error) {
    log('warn', 'cacheFirst failed, serving cache if available:', error);
    return cachedResponse || Response.error();
  }
}

/**
 * Network First strategy: Try network first, fallback to cache
 * @param {Request} request - The request to handle
 * @param {string} cacheName - Name of the cache to use
 * @returns {Promise<Response>} - Network or cached response
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await enhancedFetch(request);
    if (response && response.ok) {
      // Clone immediately for caching
      const responseForCache = response.clone();
      cache.put(request, responseForCache);
      limitCacheSize(cacheName);
    }
    return response;
  } catch (error) {
    log('warn', 'networkFirst failed, serving cache if available:', error);
    const cachedResponse = await cache.match(request, {ignoreSearch: true});
    return cachedResponse || Response.error();
  }
}

/**
 * Stale While Revalidate strategy: Return cache immediately, update in background
 * @param {Request} request - The request to handle
 * @param {string} cacheName - Name of the cache to use
 * @returns {Promise<Response>} - Cached response (network update happens in background)
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request, {ignoreSearch: true});
  const ttl = CACHE_EXPIRY.API || (30 * 60 * 1000);
  if (isFresh(cachedResponse, ttl)) {
    Promise.resolve().then(() => {
      enhancedFetch(request).then(response => {
          if (response && response.ok) {
          // Clone immediately for caching
          const responseForCache = response.clone();
          cache.put(request, responseForCache);
          limitCacheSize(cacheName);
        }
      });
    });
    return cachedResponse;
  }
  try {
    const response = await enhancedFetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
      limitCacheSize(cacheName);
    }
    return response;
  } catch (error) {
    log('warn', 'staleWhileRevalidate failed, serving cache if available:', error);
    return cachedResponse || Response.error();
  }
}


// Removed unused TTL strategy functions for clarity

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
    // Delete oldest entries in parallel
    await Promise.all(keys.slice(0, keys.length - maxSize).map(key => cache.delete(key)));
  }
}

function isFresh(response, ttl) {
  if (!response) return false;
  const dateHeader = response.headers.get('sw-cache-date') || response.headers.get('date');
  if (!dateHeader) return false;
  const age = Date.now() - new Date(dateHeader).getTime();
  return age < ttl;
}


// Unified logging utility
function log(level, ...args) {
  if (isDev()) {
    switch (level) {
      case 'info':
        console.info('[ServiceWorker]', ...args);
        break;
      case 'warn':
        console.warn('[ServiceWorker]', ...args);
        break;
      case 'error':
        console.error('[ServiceWorker]', ...args);
        break;
      default:
        console.log('[ServiceWorker]', ...args);
    }
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
            // Create a fresh response body by reading the body as a blob then creating a new Response
            const cloned = response.clone();
            const bodyBlob = await cloned.blob();
            const headers = new Headers(response.headers);
            headers.set('sw-cache-date', new Date().toISOString());
            const responseWithTimestamp = new Response(bodyBlob, {
              status: response.status,
              statusText: response.statusText,
              headers
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
              // Safely create a fresh response body by cloning and reading as blob
              const clonedNetworkResp = networkResponse.clone();
              const bodyBlob = await clonedNetworkResp.blob();
              const headers = new Headers(networkResponse.headers);
              headers.set('sw-cache-date', new Date().toISOString());
              const responseWithTimestamp = new Response(bodyBlob, {
                status: networkResponse.status,
                statusText: networkResponse.statusText,
                headers
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

function isDev() {
  return typeof process === 'undefined' || process.env.NODE_ENV !== 'production';
}

console.log('[ServiceWorker] Service Worker script loaded - Enhanced version with TTL caching, performance monitoring, and error handling');
// Example usage:
// if (isDev()) console.log('message');
// if (isDev()) console.warn('message');
// if (isDev()) console.error('message');

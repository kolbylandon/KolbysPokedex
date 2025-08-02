/**
 * CACHE INVALIDATION SCRIPT
 * =========================
 * 
 * This script helps clear browser caches and service worker caches
 * to resolve the duplicate export error caused by stale cached modules.
 * 
 * Run this in the browser console to force cache clearing.
 */

console.log('🔄 Starting cache invalidation...');

// 1. Clear service worker caches
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      console.log('🗑️ Unregistering service worker...');
      registration.unregister();
    }
  });
}

// 2. Clear all caches
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    return Promise.all(
      cacheNames.map(function(cacheName) {
        console.log('🗑️ Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }).then(function() {
    console.log('✅ All caches cleared');
  });
}

// 3. Clear localStorage for this domain
localStorage.clear();
console.log('🗑️ localStorage cleared');

// 4. Clear sessionStorage
sessionStorage.clear();
console.log('🗑️ sessionStorage cleared');

// 5. Force reload without cache
setTimeout(() => {
  console.log('🔄 Force reloading page...');
  window.location.reload(true);
}, 1000);

console.log(`
✅ CACHE INVALIDATION COMPLETE!

The page will reload in 1 second with fresh caches.
This should resolve the duplicate export error.
`);

export const CACHE_INVALIDATION_COMPLETE = true;

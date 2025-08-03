/**
 * KOLBY'S POKÉDEX - SERVICE WORKER MANAGER
 * ======================================
 * 
 * This module manages service worker registration, lifecycle events, and provides
 * a unified interface for Progressive Web App functionality. It handles automatic
 * updates, offline detection, and communication between the main thread and service worker.
 * 
 * Features:
 * - Automatic service worker registration and lifecycle management
 * - Update detection and user notification for new app versions
 * - Offline/online status monitoring with UI feedback
 * - Graceful fallbacks for browsers without service worker support
 * - Debug utilities for development and troubleshooting
 * 
 * Update Strategy:
 * - Automatic detection of service worker updates
 * - User-friendly prompts for app refresh when updates are available
 * - Skip waiting functionality for immediate update activation
 * - Proper cleanup of old caches during updates
 * 
 * Error Handling:
 * - Comprehensive error handling for service worker failures
 * - Graceful degradation when service workers are not supported
 * - Debug logging for development and troubleshooting
 * 
 * @author Kolby Landon
 * @version 2.0
 * @since 2023
 */

// ====================================
// SERVICE WORKER STATE MANAGEMENT
// ====================================

/**
 * Service Worker Manager Functions
 * Global variables for tracking service worker state and functionality
 */
/** @type {ServiceWorkerRegistration|null} Service worker registration instance */
let swRegistration = null;

/** @type {boolean} Flag indicating if an app update is available */
let isUpdateAvailable = false;

/** @type {boolean} Current offline status of the application */
let isOffline = !navigator.onLine;

/**
 * Initialize the service worker manager and set up all related functionality
 * Handles service worker registration, update detection, and offline monitoring
 * Provides comprehensive error handling and graceful degradation
 * @returns {Promise<boolean>} True if initialization successful, false otherwise
 * @example
 * const success = await initializeServiceWorker();
 * if (success) {
 *   console.log('PWA features are active');
 * }
 */
async function initializeServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return false;
  }

  try {
    await registerServiceWorker();
    setupUpdateListener();
    setupOfflineListener();
    console.log('Service Worker Manager initialized');
    return true;
  } catch (error) {
    console.error('Service Worker initialization failed:', error);
    return false;
  }
}

/**
 * Register the service worker
 */
async function registerServiceWorker() {
  try {
    swRegistration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    console.log('ServiceWorker registered successfully with scope:', swRegistration.scope);

    // Handle different registration states
    if (swRegistration.installing) {
      console.log('ServiceWorker installing...');
      trackInstallProgress(swRegistration.installing);
    } else if (swRegistration.waiting) {
      console.log('ServiceWorker waiting...');
      showUpdateAvailable();
    } else if (swRegistration.active) {
      console.log('ServiceWorker active');
      showInstallSuccess();
    }

    return swRegistration;
  } catch (error) {
    console.error('ServiceWorker registration failed:', error);
    throw error;
  }
}

/**
 * Track service worker installation progress
 */
function trackInstallProgress(worker) {
  worker.addEventListener('statechange', function() {
    if (worker.state === 'installed') {
      if (navigator.serviceWorker.controller) {
        // New update available
        showUpdateAvailable();
      } else {
        // First time installation
        showInstallSuccess();
      }
    }
  });
}

/**
 * Setup update listener for service worker updates
 */
function setupUpdateListener() {
  if (!swRegistration) return;

  swRegistration.addEventListener('updatefound', function() {
    const newWorker = swRegistration.installing;
    console.log('New ServiceWorker found');
    
    newWorker.addEventListener('statechange', function() {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          showUpdateAvailable();
        }
      }
    });
  });
}

/**
 * Setup offline/online event listeners
 */
function setupOfflineListener() {
  window.addEventListener('online', function() {
    isOffline = false;
    showOnlineStatus();
    triggerBackgroundSync();
  });

  window.addEventListener('offline', function() {
    isOffline = true;
    showOfflineStatus();
  });
}

/**
 * Show update available notification
 */
function showUpdateAvailable() {
  isUpdateAvailable = true;
  
  // Create update notification if it doesn't exist
  let notification = document.getElementById('sw-update-notification');
  if (!notification) {
    notification = createUpdateNotification();
    document.body.appendChild(notification);
  }
  
  notification.classList.add('show');
  
  // Trigger custom event
  window.dispatchEvent(new CustomEvent('sw-update-available'));
}

/**
 * Create update notification element
 */
function createUpdateNotification() {
  const notification = document.createElement('div');
  notification.id = 'sw-update-notification';
  notification.className = 'sw-notification';
  notification.innerHTML = `
    <div class="sw-notification-content">
      <span class="sw-notification-text">A new version is available!</span>
      <div class="sw-notification-buttons">
        <button id="sw-update-button" class="sw-button sw-button-primary">Update</button>
        <button id="sw-dismiss-button" class="sw-button sw-button-secondary">Dismiss</button>
      </div>
    </div>
  `;

  // Add event listeners
  notification.querySelector('#sw-update-button').addEventListener('click', applyUpdate);
  notification.querySelector('#sw-dismiss-button').addEventListener('click', dismissUpdate);

  return notification;
}

/**
 * Apply the pending service worker update
 */
function applyUpdate() {
  if (!swRegistration || !swRegistration.waiting) {
    console.warn('No service worker update available');
    return;
  }

  try {
    // Tell the waiting service worker to take control
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Wait for the new service worker to take control
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      window.location.reload();
    });
    
  } catch (error) {
    console.error('Failed to apply service worker update:', error);
  }
}

/**
 * Dismiss the update notification
 */
function dismissUpdate() {
  const notification = document.getElementById('sw-update-notification');
  if (notification) {
    notification.classList.remove('show');
  }
  isUpdateAvailable = false;
}

/**
 * Show installation success message
 */
function showInstallSuccess() {
  showToast('App is ready for offline use!', 'success');
}

/**
 * Show online status
 */
function showOnlineStatus() {
  showToast('You are back online!', 'success');
  updateConnectionIndicator(true);
}

/**
 * Show offline status
 */
function showOfflineStatus() {
  showToast('You are offline. Some features may be limited.', 'warning');
  updateConnectionIndicator(false);
}

/**
 * Update connection indicator in UI
 */
function updateConnectionIndicator(isOnline) {
  let indicator = document.getElementById('connection-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'connection-indicator';
    indicator.className = 'connection-indicator';
    document.body.appendChild(indicator);
  }

  indicator.className = 'connection-indicator ' + (isOnline ? 'online' : 'offline');
  indicator.textContent = isOnline ? 'Online' : 'Offline';
  indicator.style.display = isOnline ? 'none' : 'block';
}

/**
 * Trigger background sync
 */
function triggerBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    if (swRegistration && swRegistration.sync) {
      swRegistration.sync.register('background-sync').then(function() {
        console.log('Background sync registered');
      }).catch(function(error) {
        console.warn('Background sync registration failed:', error);
      });
    }
  }
}

/**
 * Get cache status from service worker
 */
function getCacheStatus() {
  return new Promise(function(resolve, reject) {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('No active service worker'));
      return;
    }

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = function(event) {
      if (event.data.success) {
        resolve(event.data.status);
      } else {
        reject(new Error(event.data.error || 'Failed to get cache status'));
      }
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_CACHE_STATUS' },
      [messageChannel.port2]
    );
  });
}

/**
 * Clear all caches
 */
function clearCaches() {
  return new Promise(function(resolve, reject) {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('No active service worker'));
      return;
    }

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = function(event) {
      if (event.data.success) {
        resolve();
      } else {
        reject(new Error(event.data.error || 'Failed to clear caches'));
      }
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'CLEAR_CACHE' },
      [messageChannel.port2]
    );
  });
}

/**
 * Preload important resources
 */
function preloadResources(urls) {
  if (!urls || !Array.isArray(urls)) return Promise.resolve();

  return caches.open('pokedex-dynamic-v3').then(function(cache) {
    return Promise.allSettled(
      urls.map(function(url) {
        return fetch(url).then(function(response) {
          if (response.ok) {
            return cache.put(url, response);
          }
        }).catch(function(err) {
          console.warn('Failed to preload:', url, err);
        });
      })
    );
  }).then(function() {
    console.log('Resources preloaded successfully');
  }).catch(function(error) {
    console.error('Failed to preload resources:', error);
  });
}

/**
 * Show toast notification
 */
function showToast(message, type) {
  type = type || 'info';
  
  let toast = document.getElementById('sw-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'sw-toast';
    toast.className = 'sw-toast';
    document.body.appendChild(toast);
  }

  toast.className = 'sw-toast sw-toast-' + type + ' show';
  toast.textContent = message;

  // Auto hide after 5 seconds
  setTimeout(function() {
    toast.classList.remove('show');
  }, 5000);
}

/**
 * Get service worker status
 */
function getServiceWorkerStatus() {
  return {
    isSupported: 'serviceWorker' in navigator,
    isRegistered: !!swRegistration,
    isUpdateAvailable: isUpdateAvailable,
    isOffline: isOffline,
    registration: swRegistration
  };
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeServiceWorker();
});

// Global object for external access
window.ServiceWorkerManager = {
  initialize: initializeServiceWorker,
  register: registerServiceWorker,
  applyUpdate: applyUpdate,
  dismissUpdate: dismissUpdate,
  getCacheStatus: getCacheStatus,
  clearCaches: clearCaches,
  preloadResources: preloadResources,
  getStatus: getServiceWorkerStatus,
  showToast: showToast
};

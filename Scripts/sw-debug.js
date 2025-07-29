/**
 * Service Worker Debug Console
 * Development tools for debugging service worker functionality
 */

// Debug console for service worker operations
const SWDebug = {
  // Debug flag - set to false in production
  enabled: true,

  /**
   * Initialize debug console
   */
  init: function() {
    if (!this.enabled) return;
    
    console.log('%c[SW Debug] Debug console initialized', 'color: #4CAF50; font-weight: bold;');
    this.addDebugUI();
    this.monitorCacheChanges();
    this.setupConsoleCommands();
  },

  /**
   * Add debug UI to the page
   */
  addDebugUI: function() {
    // Only add debug UI in development
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      return;
    }

    const debugPanel = document.createElement('div');
    debugPanel.id = 'sw-debug-panel';
    debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      max-width: 300px;
      border: 1px solid #444;
    `;

    debugPanel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold;">SW Debug Console</div>
      <button onclick="SWDebug.inspectCaches()" style="margin: 2px; padding: 5px; font-size: 10px;">Inspect Caches</button>
      <button onclick="SWDebug.clearAllCaches()" style="margin: 2px; padding: 5px; font-size: 10px;">Clear Caches</button>
      <button onclick="SWDebug.simulateOffline()" style="margin: 2px; padding: 5px; font-size: 10px;">Simulate Offline</button>
      <button onclick="SWDebug.preloadTest()" style="margin: 2px; padding: 5px; font-size: 10px;">Preload Test</button>
      <button onclick="SWDebug.toggle()" style="margin: 2px; padding: 5px; font-size: 10px;">Hide</button>
      <div id="sw-debug-output" style="margin-top: 10px; font-size: 10px; max-height: 200px; overflow-y: auto;"></div>
    `;

    document.body.appendChild(debugPanel);
  },

  /**
   * Toggle debug panel visibility
   */
  toggle: function() {
    const panel = document.getElementById('sw-debug-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  },

  /**
   * Log debug message
   */
  log: function(message, data) {
    if (!this.enabled) return;
    
    console.log('%c[SW Debug]', 'color: #2196F3; font-weight: bold;', message, data || '');
    
    const output = document.getElementById('sw-debug-output');
    if (output) {
      const time = new Date().toLocaleTimeString();
      const logEntry = document.createElement('div');
      logEntry.style.cssText = 'margin: 2px 0; padding: 2px; border-left: 2px solid #2196F3;';
      logEntry.innerHTML = `<span style="color: #888;">${time}</span> ${message}`;
      output.appendChild(logEntry);
      output.scrollTop = output.scrollHeight;
    }
  },

  /**
   * Inspect all caches
   */
  inspectCaches: async function() {
    try {
      this.log('Inspecting caches...');
      
      const cacheNames = await caches.keys();
      this.log(`Found ${cacheNames.length} cache(s): ${cacheNames.join(', ')}`);
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        this.log(`Cache "${cacheName}" contains ${keys.length} entries`);
        
        keys.forEach((request, index) => {
          if (index < 5) { // Show first 5 entries
            this.log(`  - ${request.url}`);
          }
        });
        
        if (keys.length > 5) {
          this.log(`  ... and ${keys.length - 5} more entries`);
        }
      }
      
      // Get cache status from service worker
      if (window.ServiceWorkerManager && window.ServiceWorkerManager.getCacheStatus) {
        const status = await window.ServiceWorkerManager.getCacheStatus();
        this.log('Cache status from SW:', status);
      }
      
    } catch (error) {
      this.log('Error inspecting caches:', error.message);
    }
  },

  /**
   * Clear all caches
   */
  clearAllCaches: async function() {
    try {
      this.log('Clearing all caches...');
      
      if (window.ServiceWorkerManager && window.ServiceWorkerManager.clearCaches) {
        await window.ServiceWorkerManager.clearCaches();
        this.log('Caches cleared via Service Worker');
      } else {
        // Fallback: clear caches directly
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        this.log(`Cleared ${cacheNames.length} caches directly`);
      }
      
    } catch (error) {
      this.log('Error clearing caches:', error.message);
    }
  },

  /**
   * Simulate offline mode
   */
  simulateOffline: function() {
    this.log('Simulating offline mode...');
    
    // Override fetch for testing
    const originalFetch = window.fetch;
    let isOfflineSimulation = false;
    
    window.fetch = function(...args) {
      if (isOfflineSimulation) {
        return Promise.reject(new Error('Simulated offline'));
      }
      return originalFetch.apply(this, args);
    };
    
    // Toggle offline simulation
    isOfflineSimulation = !isOfflineSimulation;
    
    if (isOfflineSimulation) {
      this.log('Offline simulation enabled');
      window.dispatchEvent(new Event('offline'));
    } else {
      this.log('Offline simulation disabled');
      window.fetch = originalFetch;
      window.dispatchEvent(new Event('online'));
    }
  },

  /**
   * Test preloading functionality
   */
  preloadTest: async function() {
    try {
      this.log('Testing preload functionality...');
      
      const testUrls = [
        'https://pokeapi.co/api/v2/pokemon/pikachu',
        'https://pokeapi.co/api/v2/pokemon/charizard'
      ];
      
      if (window.ServiceWorkerManager && window.ServiceWorkerManager.preloadResources) {
        await window.ServiceWorkerManager.preloadResources(testUrls);
        this.log('Preload test completed');
      } else {
        this.log('ServiceWorkerManager not available for preload test');
      }
      
    } catch (error) {
      this.log('Preload test failed:', error.message);
    }
  },

  /**
   * Monitor cache changes
   */
  monitorCacheChanges: function() {
    // Override cache.put to monitor cache writes
    if ('caches' in window) {
      const originalPut = Cache.prototype.put;
      Cache.prototype.put = function(request, response) {
        SWDebug.log(`Cache PUT: ${request.url || request}`);
        return originalPut.call(this, request, response);
      };
    }
  },

  /**
   * Setup console commands for debugging
   */
  setupConsoleCommands: function() {
    // Add global debug commands
    window.swDebug = {
      inspectCaches: () => this.inspectCaches(),
      clearCaches: () => this.clearAllCaches(),
      getStatus: () => {
        if (window.ServiceWorkerManager) {
          return window.ServiceWorkerManager.getStatus();
        }
        return { error: 'ServiceWorkerManager not available' };
      },
      simulateOffline: () => this.simulateOffline(),
      testPreload: () => this.preloadTest(),
      help: () => {
        console.log(`
%cService Worker Debug Commands:
%cswDebug.inspectCaches() - Inspect all caches
swDebug.clearCaches() - Clear all caches
swDebug.getStatus() - Get SW status
swDebug.simulateOffline() - Toggle offline simulation
swDebug.testPreload() - Test preload functionality
swDebug.help() - Show this help
        `, 'color: #4CAF50; font-weight: bold;', 'color: inherit;');
      }
    };
    
    this.log('Debug commands available via swDebug object');
    this.log('Type swDebug.help() for available commands');
  },

  /**
   * Test service worker functionality
   */
  runTests: async function() {
    this.log('Running service worker tests...');
    
    const tests = [
      {
        name: 'Service Worker Registration',
        test: async () => {
          return 'serviceWorker' in navigator && navigator.serviceWorker.controller;
        }
      },
      {
        name: 'Cache API Support',
        test: async () => {
          return 'caches' in window;
        }
      },
      {
        name: 'Background Sync Support',
        test: async () => {
          return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
        }
      },
      {
        name: 'Cache Storage',
        test: async () => {
          const cacheName = 'test-cache';
          const cache = await caches.open(cacheName);
          await cache.put('/test', new Response('test'));
          const stored = await cache.match('/test');
          await caches.delete(cacheName);
          return !!stored;
        }
      }
    ];
    
    for (const test of tests) {
      try {
        const result = await test.test();
        this.log(`✓ ${test.name}: ${result ? 'PASS' : 'FAIL'}`);
      } catch (error) {
        this.log(`✗ ${test.name}: ERROR - ${error.message}`);
      }
    }
    
    this.log('Test suite completed');
  }
};

// Auto-initialize debug console
document.addEventListener('DOMContentLoaded', function() {
  SWDebug.init();
});

// Make SWDebug globally available
window.SWDebug = SWDebug;

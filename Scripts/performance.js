/**
 * PERFORMANCE.JS - Application Performance Monitoring and Optimization
 * ====================================================================
 * 
 * This module provides comprehensive performance monitoring, optimization
 * utilities, and development tools for the Pokédex application. It tracks
 * various performance metrics, implements lazy loading, and provides
 * debugging tools for performance analysis.
 * 
 * Key Features:
 * - Real-time performance metric tracking and logging
 * - Intersection Observer API for lazy loading optimization
 * - Performance Observer integration for advanced monitoring
 * - Function execution timing with duration measurement
 * - Memory usage tracking and reporting
 * - Throttling and debouncing utilities for event optimization
 * - Navigation and paint timing analysis
 * - Developer-friendly performance summary reporting
 * 
 * Performance Metrics Tracked:
 * - DOM Content Loaded timing
 * - Load event completion timing
 * - First Paint and First Contentful Paint
 * - JavaScript heap memory usage
 * - Custom function execution times
 * 
 * @author Kolby Landon
 * @version 2.0
 * @since 2023
 */

'use strict';

// ====================================
// PERFORMANCE MONITORING CLASS
// ====================================

/**
 * Comprehensive performance monitoring and optimization utilities
 * Provides timing, lazy loading, and performance analysis capabilities
 */
class PerformanceMonitor {
  constructor() {
    /** @type {Map<string, number>} Storage for timing measurements */
    this.metrics = new Map();
    
    /** @type {Map<string, Observer>} Storage for various observer instances */
    this.observers = new Map();
    
    /** @type {boolean} Global enable/disable flag for performance monitoring */
    this.enabled = true;
  }

  // ====================================
  // TIMING MEASUREMENT METHODS
  // ====================================

  /**
   * Start timing a performance metric using high-resolution timestamps
   * @param {string} label - Unique identifier for the timing measurement
   */
  startTiming(label) {
    if(!this.enabled) {
      return;
    }
    
    this.metrics.set(label, performance.now());
  }

  /**
   * End timing and log the result
   */
  endTiming(label) {
    if(!this.enabled) {
      return;
    }    
    
    const startTime = this.metrics.get(label);
    if(startTime) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if(isDev()) {
        console.log(`⚡ ${label}: ${duration.toFixed(2)}ms`);
      }
      
      this.metrics.delete(label);
      
      return duration;
    }
  }

  /**
   * Measure function execution time with support for sync and async functions
   * Automatically handles timing measurement and cleanup for both synchronous
   * and asynchronous function execution
   * @param {string} label - Unique identifier for the measurement
   * @param {Function} fn - Function to measure (can be sync or async)
   * @returns {*} - The result of the function execution
   * @example
   * // Measure synchronous function
   * const result = monitor.measure('calculation', () => {
   *   return complexCalculation();
   * });
   * 
   * // Measure asynchronous function
   * const data = await monitor.measure('api-call', async () => {
   *   return await fetch('/api/data');
   * });
   */
  measure(label, fn) {
    if(!this.enabled) {
      return fn();
    }

    this.startTiming(label);
    const result = fn();
    
    if(result && typeof result.then === 'function') {
      return result.finally(() => this.endTiming(label));
    } else {
      this.endTiming(label);

      return result;
    }
  }

  /**
   * Setup Intersection Observer for lazy loading of images
   * Implements efficient lazy loading by observing when images enter the viewport
   * Automatically converts data-src attributes to src when images become visible
   * Improves initial page load performance by deferring off-screen image loading
   * @example
   * // HTML: <img data-src="image.jpg" class="lazy" alt="description">
   * // Will automatically load when scrolled into view
   */
  setupLazyLoading() {
    if('IntersectionObserver' in window) {
      const lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if(entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        lazyImageObserver.observe(img);
      });

      this.observers.set('lazyImages', lazyImageObserver);
    }
  }

  /**
   * Setup Performance Observer for monitoring browser performance metrics
   * Observes and logs performance measurements and navigation timing
   * Provides insights into application performance for optimization
   * Gracefully handles browsers that don't support PerformanceObserver
   * @example
   * // Automatically logs performance measurements like:
   * // "📊 api-request: 245.67ms"
   * // "📊 dom-render: 89.12ms"
   */
  setupPerformanceObserver() {
    if('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if(entry.entryType === 'measure') {
              if(isDev()) {
                console.log(`📊 ${entry.name}: ${entry.duration.toFixed(2)}ms`);
              }
            }
          });
        });

        observer.observe({ entryTypes: ['measure', 'navigation'] });
        this.observers.set('performance', observer);
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  /**
   * Throttle function execution to improve performance
   * Limits function calls to once per specified time period
   * Useful for expensive operations triggered by frequent events (scroll, resize)
   * @param {Function} func - Function to throttle
   * @param {number} limit - Minimum time between function calls in milliseconds
   * @returns {Function} - Throttled version of the original function
   * @example
   * const throttledScroll = monitor.throttle(handleScroll, 100);
   * window.addEventListener('scroll', throttledScroll);
   */
  throttle(func, limit) {
    let inThrottle;

    return function() {
      const args = arguments;
      const context = this;

      if(!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Debounce function execution to optimize performance
   * Delays function execution until after specified time has passed since last call
   * Perfect for search inputs, form validation, and API calls triggered by user input
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds before function execution
   * @returns {Function} - Debounced version of the original function
   * @example
   * const debouncedSearch = monitor.debounce(performSearch, 300);
   * searchInput.addEventListener('input', debouncedSearch);
   */
  debounce(func, delay) {
    let timeoutId;

    return function() {
      const args = arguments;
      const context = this;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(context, args), delay);
    };
  }

  /**
   * Get comprehensive performance metrics from the browser
   * Collects navigation timing, paint timing, and memory usage information
   * Provides detailed insights into page load performance and resource consumption
   * @returns {Object} Performance metrics object containing navigation, paint, and memory data
   * @example
   * const metrics = monitor.getMetrics();
   * console.log('DOM loaded in:', metrics.navigation.domContentLoadedEventEnd, 'ms');
   * console.log('Memory usage:', metrics.memory.usedJSHeapSize, 'bytes');
   */
  getMetrics() {
    if(!('performance' in window)) {
      return {};
    }
    
    return {
      navigation: performance.getEntriesByType('navigation')[0],
      paint: performance.getEntriesByType('paint'),
      memory: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null
    };
  }

  /**
   * Log comprehensive performance summary to console
   * Displays formatted performance metrics including load times, paint events, and memory usage
   * Provides organized output for debugging and optimization analysis
   * Called automatically after page load for development insights
   * @example
   * // Console output:
   * // 🚀 Performance Summary
   * //   DOM Content Loaded: 245.67ms
   * //   Load Complete: 892.34ms
   * //   first-paint: 156.23ms
   * //   Memory Usage: 12.45MB
   */
  logSummary() {
    const metrics = this.getMetrics();
    console.group('🚀 Performance Summary');
    
    if(metrics.navigation) {
      console.log(`DOM Content Loaded: ${metrics.navigation.domContentLoadedEventEnd.toFixed(2)}ms`);
      console.log(`Load Complete: ${metrics.navigation.loadEventEnd.toFixed(2)}ms`);
    }
    
    if(metrics.paint) {
      metrics.paint.forEach(paint => {
        console.log(`${paint.name}: ${paint.startTime.toFixed(2)}ms`);
      });
    }
    
    if(metrics.memory) {
      console.log(`Memory Usage: ${(metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    console.groupEnd();
  }

  /**
   * Initialize all performance monitoring systems
   * Sets up lazy loading, performance observers, and automatic logging
   * Called automatically on DOMContentLoaded for seamless integration
   * Provides comprehensive performance monitoring with minimal setup
   * @example
   * // Manual initialization (not needed with auto-initialization)
   * const monitor = new PerformanceMonitor();
   * monitor.init();
   */
  init() {
    this.setupLazyLoading();
    this.setupPerformanceObserver();
    
    // Log summary after page load
    window.addEventListener('load', () => {
      setTimeout(() => this.logSummary(), 1000);
    });
  }
}

// ====================================
// GLOBAL INSTANCE AND AUTO-INITIALIZATION
// ====================================

/**
 * Create global performance monitor instance
 * Makes the performance monitor available throughout the application
 * Provides both instance and class access for flexibility
 */
const performanceMonitor = new PerformanceMonitor();
window.performanceMonitor = performanceMonitor;
window.PerformanceMonitor = PerformanceMonitor;

/**
 * Auto-initialize performance monitoring on DOM ready
 * Ensures performance monitoring starts as soon as the DOM is available
 * Provides seamless integration without manual setup required
 */
document.addEventListener('DOMContentLoaded', () => {
  performanceMonitor.init();
});

/**
 * Check if the application is in development mode
 * @returns {boolean} True if in development mode, false if in production
 * @example
 * if(isDev()) {
 *   console.log('Development mode active');
 * }
 */
function isDev() {
  return typeof process === 'undefined' || process.env.NODE_ENV !== 'production';
}

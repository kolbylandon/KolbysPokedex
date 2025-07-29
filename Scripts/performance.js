'use strict';

/**
 * Performance monitoring and optimization utilities
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.enabled = true;
  }

  /**
   * Start timing a performance metric
   */
  startTiming(label) {
    if (!this.enabled) return;
    this.metrics.set(label, performance.now());
  }

  /**
   * End timing and log the result
   */
  endTiming(label) {
    if (!this.enabled) return;
    const startTime = this.metrics.get(label);
    if (startTime) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`⚡ ${label}: ${duration.toFixed(2)}ms`);
      this.metrics.delete(label);
      return duration;
    }
  }

  /**
   * Measure function execution time
   */
  measure(label, fn) {
    if (!this.enabled) return fn();
    
    this.startTiming(label);
    const result = fn();
    
    if (result && typeof result.then === 'function') {
      return result.finally(() => this.endTiming(label));
    } else {
      this.endTiming(label);
      return result;
    }
  }

  /**
   * Setup intersection observer for lazy loading
   */
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
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
   * Setup performance observer for monitoring
   */
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'measure') {
              console.log(`📊 ${entry.name}: ${entry.duration.toFixed(2)}ms`);
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
   * Throttle function execution
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Debounce function execution
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
   * Get performance metrics
   */
  getMetrics() {
    if (!('performance' in window)) return {};

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
   * Log performance summary
   */
  logSummary() {
    const metrics = this.getMetrics();
    console.group('🚀 Performance Summary');
    
    if (metrics.navigation) {
      console.log(`DOM Content Loaded: ${metrics.navigation.domContentLoadedEventEnd.toFixed(2)}ms`);
      console.log(`Load Complete: ${metrics.navigation.loadEventEnd.toFixed(2)}ms`);
    }
    
    if (metrics.paint) {
      metrics.paint.forEach(paint => {
        console.log(`${paint.name}: ${paint.startTime.toFixed(2)}ms`);
      });
    }
    
    if (metrics.memory) {
      console.log(`Memory Usage: ${(metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    console.groupEnd();
  }

  /**
   * Initialize all performance monitoring
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

// Create global instance and make it available globally
const performanceMonitor = new PerformanceMonitor();
window.performanceMonitor = performanceMonitor;
window.PerformanceMonitor = PerformanceMonitor;

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  performanceMonitor.init();
});

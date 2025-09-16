/**
 * DOM UTILITIES MODULE
 * ====================
 * 
 * This module handles DOM element caching, manipulation, and utility functions
 * for improved performance and cleaner code organization. It provides a centralized
 * system for accessing frequently used DOM elements and managing their visibility
 * and interaction states.
 * 
 * Key Features:
 * - Performance-optimized DOM element caching
 * - Element visibility management utilities
 * - UI state management functions
 * - Device-responsive layout adjustments
 * - Toast notification system
 * 
 * @author Kolby Landon
 * @version 1.0
 * @since 2025
 */

'use strict';

// ====================================
// DOM ELEMENT CACHING SYSTEM
// ====================================

/**
 * Cache frequently accessed DOM elements for better performance
 * This reduces repeated DOM queries and improves application speed
 * All elements are cached once during module initialization
 */
export const DOM_CACHE = {
  // Core browser APIs
  synth: window.speechSynthesis,
  body: document.body,
  
  // Type display elements
  typeText: document.getElementById('type-text'),
  typeText2: document.getElementById('type-text-2'),
  typeHeader: document.getElementById('type-header'),
  
  // Chart and visualization elements
  statsChart: document.getElementById('stats-chart'),
  
  // List containers for Pokemon data
  abilitiesUnorderedList: document.getElementById('abilities-unordered-list'),
  abilitiesHeader: document.getElementById('abilities-header'),
  heldItemsUnorderedList: document.getElementById('held-items-unordered-list'),
  formsUnorderedList: document.getElementById('forms-unordered-list'),
  heldItemsHeader: document.getElementById('held-items-header'),
  formsHeader: document.getElementById('forms-header'),
  
  // Notification elements
  toastText: document.getElementById('toast-text'),
  
  // User interface controls
  textbox: document.getElementById('pokemon-textbox'),
  toast: document.getElementById('toast'),
  goButton: document.getElementById('go-button'),
  randomPokemonButton: document.getElementById('random-pokemon-button'),
  previousButton: document.getElementById('previous-button'),
  nextButton: document.getElementById('next-button'),
  recallButton: document.getElementById('recall-button'),
  readEntryButton: document.getElementById('read-entry-button'),
  clearButton: document.getElementById('clear-button'),
  cryButton: document.getElementById('cry-button')
};

// ====================================
// BACKWARDS COMPATIBILITY ALIASES
// ====================================

/**
 * Legacy aliases for existing code compatibility
 * These maintain the same interface as the original helpers.js
 */
export const Synth = DOM_CACHE.synth;
export const Body = DOM_CACHE.body;
export const TypeText = DOM_CACHE.typeText;
export const TypeText2 = DOM_CACHE.typeText2;
export const TypeHeader = DOM_CACHE.typeHeader;
export const StatsChart = DOM_CACHE.statsChart;
export const AbilitiesUnorderedList = DOM_CACHE.abilitiesUnorderedList;
export const AbilitiesHeader = DOM_CACHE.abilitiesHeader;
export const HeldItemsUnorderedList = DOM_CACHE.heldItemsUnorderedList;
export const FormsUnorderedList = DOM_CACHE.formsUnorderedList;
export const HeldItemsHeader = DOM_CACHE.heldItemsHeader;
export const FormsHeader = DOM_CACHE.formsHeader;
export const ToastText = DOM_CACHE.toastText;
export const Textbox = DOM_CACHE.textbox;
export const Toast = DOM_CACHE.toast;
export const GoButton = DOM_CACHE.goButton;
export const RandomPokemonButton = DOM_CACHE.randomPokemonButton;
export const PreviousButton = DOM_CACHE.previousButton;
export const NextButton = DOM_CACHE.nextButton;
export const RecallButton = DOM_CACHE.recallButton;
export const ReadEntryButton = DOM_CACHE.readEntryButton;
export const ClearButton = DOM_CACHE.clearButton;
export const CryButton = DOM_CACHE.cryButton;

// ====================================
// ELEMENT VISIBILITY UTILITIES
// ====================================

/**
 * Create an array of DOM elements for batch operations
 * Useful for applying the same operation to multiple elements
 * @param {Element[]} elements - Array of DOM elements to process
 * @returns {Element[]} - The same array for method chaining
 * @example
 * const buttons = createArray([button1, button2, button3]);
 * getElementVisibility(buttons, 'visible');
 */
export function createArray(elements) {
  const array = Array.from(elements);
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    window.requestAnimationFrame(() => {
      array.forEach((element, index) => {
        // Only log in development
        if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') {
          console.log(`Element ${index}: ${element.id || element.tagName} with classes: ${element.className}`);
        }
      });
    });
  } else {
    array.forEach((element, index) => {
      if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') {
        console.log(`Element ${index}: ${element.id || element.tagName} with classes: ${element.className}`);
      }
    });
  }
  return array;
}

/**
 * Set visibility state for multiple DOM elements simultaneously
 * Efficiently manages show/hide operations for UI elements
 * @param {Element[]} elements - Array of DOM elements to modify
 * @param {string} visibility - Visibility state ('visible' or 'hidden')
 * @example
 * // Show navigation buttons
 * getElementVisibility([PreviousButton, NextButton], 'visible');
 * 
 * // Hide action buttons
 * getElementVisibility([CryButton, ReadEntryButton], 'hidden');
 */
export function getElementVisibility(elements, visibility) {
  if (!Array.isArray(elements)) {
    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') {
      console.warn('getElementVisibility: elements should be an array');
    }
    return;
  }
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    window.requestAnimationFrame(() => {
      elements.forEach((element, index) => {
        if (element) {
          if (visibility === 'visible') {
            element.classList.remove('hidden-element');
            element.classList.add('visible-element');
          } else if (visibility === 'hidden') {
            element.classList.remove('visible-element');
            element.classList.add('hidden-element');
          }
        }
      });
    });
  } else {
    elements.forEach((element, index) => {
      if (element) {
        if (visibility === 'visible') {
          element.classList.remove('hidden-element');
          element.classList.add('visible-element');
        } else if (visibility === 'hidden') {
          element.classList.remove('visible-element');
          element.classList.add('hidden-element');
        }
      }
    });
  }
}

/**
 * Manage button visibility based on Pokemon ID and gender differences
 * Controls which action buttons are shown based on Pokemon availability
 * @param {number} id - Pokemon ID number
 * @param {boolean} hasGenderDifferences - Whether Pokemon has gender differences
 * @example
 * // Hide buttons for invalid Pokemon ID
 * makeButtonsDisappear(0, false);
 * 
 * // Show appropriate buttons for valid Pokemon
 * makeButtonsDisappear(25, true); // Pikachu with gender differences
 */
export function makeButtonsDisappear(id, hasGenderDifferences) {
  const MaximumId = 1025; // Import this from constants if needed
  
  if (id === 0 || id > MaximumId) {
    // Hide all action buttons for invalid Pokemon
    getElementVisibility([
      PreviousButton, NextButton, RecallButton, 
      CryButton, ReadEntryButton, ClearButton
    ], 'hidden');
  } else {
    // Show appropriate buttons for valid Pokemon
    const buttonsToShow = [
      PreviousButton, NextButton, RecallButton, 
      CryButton, ReadEntryButton, ClearButton
    ];
    
    getElementVisibility(buttonsToShow, 'visible');
  }
}

// ====================================
// TOAST NOTIFICATION SYSTEM
// ====================================

/**
 * Display a toast notification to the user
 * Provides non-intrusive user feedback for actions and errors
 * @param {string} text - Message text to display in the toast
 * @example
 * showToast('Pokemon loaded successfully!');
 * showToast('Error: Pokemon not found');
 */
export function showToast(text) {
  console.log(`🍞 [Toast] Displaying message: "${text}"`);
  
  if (!text || typeof text !== 'string') {
    console.warn('⚠️ [Toast] Invalid text provided:', text);
    return;
  }
  
  // Set toast message text
  ToastText.textContent = text;
  console.log(`📝 [Toast] Text content set`);
  
  // Show toast with animation
  Toast.classList.remove('hidden');
  Toast.classList.add('show');
  console.log(`✅ [Toast] Toast displayed`);
  
  // Auto-hide toast after 3 seconds
  setTimeout(() => {
    console.log(`⏰ [Toast] Auto-hiding toast after 3 seconds`);
    Toast.classList.remove('show');
    setTimeout(() => {
      Toast.classList.add('hidden');
      console.log(`🔇 [Toast] Toast hidden completely`);
    }, 300); // Wait for fade-out animation
  }, 3000);
}

// ====================================
// DEVICE DETECTION AND RESPONSIVE LAYOUT
// ====================================

/**
 * Detect the current device type for responsive design
 * Determines device category based on screen size and user agent
 * @returns {string} Device type: 'mobile', 'tablet', or 'desktop'
 * @example
 * const device = getDeviceType();
 * if (device === 'mobile') {
 *   // Apply mobile-specific styling
 * }
 */
export function getDeviceType() {
  const width = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check for mobile devices
  if (width <= 768 || /android|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent)) {
    if (width <= 480) {
      return 'mobile';
    } else if (width <= 768) {
      return 'tablet';
    }
  }
  
  return 'desktop';
}

/**
 * Apply responsive header layout based on device type
 * Adjusts header button layout and spacing for different screen sizes
 * @param {string} deviceType - Device type from getDeviceType()
 * @example
 * const device = getDeviceType();
 * headerLayout(device);
 */
export function headerLayout(deviceType) {
  const header = document.getElementById('header');
  if (!header) return;
  
  // Remove existing device classes
  header.classList.remove('mobile-layout', 'tablet-layout', 'desktop-layout');
  
  // Apply appropriate layout class
  switch (deviceType) {
    case 'mobile':
      header.classList.add('mobile-layout');
      break;
    case 'tablet':
      header.classList.add('tablet-layout');
      break;
    case 'desktop':
    default:
      header.classList.add('desktop-layout');
      break;
  }
}

// ====================================
// INPUT VALIDATION UTILITIES
// ====================================

/**
 * Validate if the current textbox contains a valid Pokédex number
 * Checks against the valid range of Pokemon IDs
 * @returns {boolean} True if the input is a valid Pokédex number
 * @example
 * if (validPokedexNumberCheck()) {
 *   // Process valid Pokemon ID
 * } else {
 *   showToast('Invalid Pokédex number');
 * }
 */
export function validPokedexNumberCheck() {
  const MinimumId = 1;
  const MaximumId = 1025;
  const input = Textbox.value.trim();
  const id = parseInt(input, 10);
  
  return !isNaN(id) && id >= MinimumId && id <= MaximumId;
}

// ====================================
// MODULE INITIALIZATION
// ====================================

/**
 * Initialize DOM utilities module
 * Sets up event listeners and initial responsive layout
 */
export function initializeDOMUtils() {
  // Set up responsive layout on load and resize
  const updateLayout = () => {
    const deviceType = getDeviceType();
    headerLayout(deviceType);
  };
  
  // Initial layout setup
  updateLayout();
  
  // Update layout on window resize
  window.addEventListener('resize', updateLayout);
  
  console.log('DOM utilities module initialized');
}

// Auto-initialize on module load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initializeDOMUtils);
}

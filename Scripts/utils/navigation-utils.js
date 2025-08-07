/**
 * DEVICE & NAVIGATION UTILITIES MODULE
 * ====================================
 * 
 * This module provides device detection, responsive UI management, navigation
 * controls, and input validation for the Pokemon application. It handles
 * device-specific optimizations, button layouts, and user interaction patterns
 * across desktop, tablet, and mobile platforms.
 * 
 * Key Features:
 * - Device type detection (desktop/tablet/mobile)
 * - Responsive button layouts and UI optimization
 * - Pokemon navigation and generation controls
 * - Input validation and sanitization
 * - User feedback and error handling
 * 
 * @author Kolby Landon
 * @version 3.2 (Added tooltips for secondary buttons and renamed file)
 * @since 2025
 * @updated 2025-08-01T06:00:00Z
 */

'use strict';

// Import required dependencies
import { showToast } from './dom-utils.js';
import { requestPokemon } from '../requests.js';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from './storage-utils.js?v=20250802h';
import { normalizePokemonName } from './pokemon-names.js';

// ====================================
// NAVIGATION CONSTANTS
// ====================================

/** @type {number} Minimum Pokemon ID (Bulbasaur) */
const MINIMUM_ID = 1;

/** @type {number} Maximum ID for original 151 Pokemon */
export const ORIGINAL_MAXIMUM_ID = 151;

/** @type {number} Current maximum Pokemon ID (all generations) */
let MAXIMUM_ID = 1025;

/** @type {string} Standard text color for input validation */
const TEXT_COLOR = 'rgba(98, 98, 98, 0.95)';

/** @type {string} Error color for invalid input */
const ERROR_COLOR = 'rgba(255, 111, 97, 0.95)';

// ====================================
// ADDITIONAL EXPORTS
// ====================================

export { MINIMUM_ID, MAXIMUM_ID };

// ====================================
// DEVICE DETECTION
// ====================================

/**
 * Detects user device type for responsive UI optimization
 * Uses comprehensive user agent analysis for accurate device categorization
 * @returns {string} Device type: "desktop", "tablet", or "mobile"
 * @example
 * const deviceType = getDeviceType();
 * console.log(`User is on: ${deviceType}`); // "mobile", "tablet", or "desktop"
 */
export function getDeviceType() {
  console.log('🔍 [Device Detection] Starting device type detection...');
  const agent = navigator.userAgent;
  console.log('🔍 [Device Detection] User agent:', agent);
  
  // Enhanced regular expressions for better device detection
  const tabletRegex = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))|kindle|nook|gt-|sm-t|nexus (?=7|9|10)|xoom|sch-i800|playstation|nintendo|wiiu/i;
  const mobileRegex = /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)|Windows Phone/i;
  
  // Check for specific device characteristics
  const screenWidth = window.screen ? window.screen.width : window.innerWidth;
  const screenHeight = window.screen ? window.screen.height : window.innerHeight;
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  console.log('🔍 [Device Detection] Screen dimensions:', { 
    width: screenWidth, 
    height: screenHeight, 
    devicePixelRatio 
  });
  
  // Enhanced detection logic
  if (tabletRegex.test(agent)) {
    console.log('📱 [Device Detection] Detected as TABLET via user agent');
    return 'tablet';
  }
  
  if (mobileRegex.test(agent)) {
    console.log('📱 [Device Detection] Detected as MOBILE via user agent');
    return 'mobile';
  }
  
  // Fallback to screen size detection for edge cases
  const maxDimension = Math.max(screenWidth, screenHeight);
  const minDimension = Math.min(screenWidth, screenHeight);
  
  // Consider high-DPI mobile devices
  const effectiveWidth = screenWidth / devicePixelRatio;
  const effectiveHeight = screenHeight / devicePixelRatio;
  
  console.log('🔍 [Device Detection] Fallback detection values:', {
    maxDimension,
    minDimension,
    effectiveWidth,
    effectiveHeight
  });
  
  if (effectiveWidth <= 480 || (maxDimension <= 896 && minDimension <= 414)) {
    console.log('📱 [Device Detection] Detected as MOBILE via screen size');
    return 'mobile';
  }
  
  if (effectiveWidth <= 1024 || (maxDimension <= 1366 && minDimension <= 768)) {
    console.log('📱 [Device Detection] Detected as TABLET via screen size');
    return 'tablet';
  }
  
  console.log('🖥️ [Device Detection] Detected as DESKTOP (default)');
  return 'desktop';
}

/**
 * Checks if the device supports touch input
 * @returns {boolean} True if touch is supported
 * @example
 * if (isTouchDevice()) {
 *   // Optimize for touch interactions
 * }
 */
export function isTouchDevice() {
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 || 
         navigator.msMaxTouchPoints > 0;
}

/**
 * Gets device orientation information
 * @returns {Object} Orientation data including type and angle
 * @example
 * const orientation = getDeviceOrientation();
 * console.log(orientation.type); // "portrait" or "landscape"
 */
export function getDeviceOrientation() {
  const screenOrientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
  
  let orientationType = 'unknown';
  let angle = 0;
  
  if (screenOrientation) {
    orientationType = screenOrientation.type || screenOrientation;
    angle = screenOrientation.angle || 0;
  } else {
    // Fallback detection
    const width = window.innerWidth;
    const height = window.innerHeight;
    orientationType = width > height ? 'landscape' : 'portrait';
  }
  
  return {
    type: orientationType.includes('landscape') ? 'landscape' : 'portrait',
    angle: angle,
    raw: orientationType
  };
}

// ====================================
// RESPONSIVE UI MANAGEMENT
// ====================================

/**
 * Button configuration templates for different device types
 * Optimizes button content and icons based on screen size and interaction method
 * 
 * Secondary buttons (readEntry, clear, cry, recall, previous/next on mobile/tablet)
 * include title attributes for tooltips to provide user guidance when text is hidden.
 * 
 * @type {Object} Device-specific button template configurations
 */
const BUTTON_TEMPLATES = {
  mobile: {
    go: `<span id='go-button-top' class='button-top'><i class='fa-solid fa-search'></i></span>`,
    random: `<span id='random-pokemon-button-top' class='button-top'><i class='fa-solid fa-shuffle'></i></span>`,
    previous: `<span id='previous-button-top' class='button-top' title='Go to previous Pokémon'><i class='fa-solid fa-chevron-left'></i></span>`,
    next: `<span id='next-button-top' class='button-top' title='Go to next Pokémon'><i class='fa-solid fa-chevron-right'></i></span>`,
    readEntry: `<span id='read-entry-button-top' class='button-top' title='Read Pokédex entry aloud'><i class='fa-solid fa-book-open'></i></span>`,
    clear: `<span id='clear-button-top' class='button-top' title='Clear all data and reset view'><i class='fa-solid fa-xmark'></i></span>`,
    cry: `<span id='cry-button-top' class='button-top' title='Play Pokémon cry sound'><i class='fa-solid fa-volume-high'></i></span>`,
    recall: `<span id='recall-button-top' class='button-top' title='Show last viewed Pokémon'><i class='fa-solid fa-history'></i></span>`
  },
  tablet: {
    go: `<span id='go-button-top' class='button-top'><i class='fa-solid fa-search'></i> Search</span>`,
    random: `<span id='random-pokemon-button-top' class='button-top'><i class='fa-solid fa-shuffle'></i> Random</span>`,
    previous: `<span id='previous-button-top' class='button-top' title='Go to previous Pokémon'><i class='fa-solid fa-chevron-left'></i></span>`,
    next: `<span id='next-button-top' class='button-top' title='Go to next Pokémon'><i class='fa-solid fa-chevron-right'></i></span>`,
    readEntry: `<span id='read-entry-button-top' class='button-top' title='Read Pokédex entry aloud'><i class='fa-solid fa-book-open'></i></span>`,
    clear: `<span id='clear-button-top' class='button-top' title='Clear all data and reset view'><i class='fa-solid fa-xmark'></i></span>`,
    cry: `<span id='cry-button-top' class='button-top' title='Play Pokémon cry sound'><i class='fa-solid fa-volume-high'></i></span>`,
    recall: `<span id='recall-button-top' class='button-top' title='Show last viewed Pokémon'><i class='fa-solid fa-history'></i></span>`
  },
  desktop: {
    go: `<span id='go-button-top' class='button-top'><i class='fa-solid fa-search'></i> Search</span>`,
    random: `<span id='random-pokemon-button-top' class='button-top'><i class='fa-solid fa-shuffle'></i> Random</span>`,
    previous: `<span id='previous-button-top' class='button-top'><i class='fa-solid fa-chevron-left'></i></span>`,
    next: `<span id='next-button-top' class='button-top'><i class='fa-solid fa-chevron-right'></i></span>`,
    readEntry: `<span id='read-entry-button-top' class='button-top' title='Read Pokédex entry aloud'><i class='fa-solid fa-book-open'></i></span>`,
    clear: `<span id='clear-button-top' class='button-top' title='Clear all data and reset view'><i class='fa-solid fa-xmark'></i></span>`,
    cry: `<span id='cry-button-top' class='button-top' title='Play Pokémon cry sound'><i class='fa-solid fa-volume-high'></i></span>`,
    recall: `<span id='recall-button-top' class='button-top' title='Show last viewed Pokémon'><i class='fa-solid fa-history'></i></span>`
  }
};

/**
 * Applies device-specific button layouts and content
 * Optimizes UI elements based on detected device type and screen real estate
 * @param {string} deviceType - Device type from getDeviceType()
 * @example
 * const deviceType = getDeviceType();
 * applyResponsiveLayout(deviceType);
 */
export function applyResponsiveLayout(deviceType) {
  console.log(`🎨 [Responsive Layout] Applying layout for device type: ${deviceType}`);
  const templates = BUTTON_TEMPLATES[deviceType] || BUTTON_TEMPLATES.desktop;
  
  if (!BUTTON_TEMPLATES[deviceType]) {
    console.warn(`⚠️ [Responsive Layout] Unknown device type '${deviceType}', using desktop template`);
  }
  
  // Get button span elements with error checking
  const buttonTops = {
    go: document.getElementById('go-button-top'),
    random: document.getElementById('random-pokemon-button-top'),
    previous: document.getElementById('previous-button-top'),
    next: document.getElementById('next-button-top'),
    readEntry: document.getElementById('read-entry-button-top'),
    clear: document.getElementById('clear-button-top'),
    cry: document.getElementById('cry-button-top'),
    recall: document.getElementById('recall-button-top')
  };
  
  console.log('🔍 [Responsive Layout] Found button elements:', 
    Object.entries(buttonTops).map(([key, element]) => `${key}: ${element ? 'found' : 'missing'}`).join(', '));
  
  // Apply templates to available button tops
  let appliedCount = 0;
  Object.keys(templates).forEach(buttonKey => {
    const buttonTop = buttonTops[buttonKey];
    if (buttonTop && templates[buttonKey]) {
      // Extract just the inner content from the template (remove the span wrapper)
      const templateContent = templates[buttonKey].replace(/^<span[^>]*>|<\/span>$/g, '');
      const oldContent = buttonTop.innerHTML;
      buttonTop.innerHTML = templateContent;
      console.log(`🔄 [Responsive Layout] Updated ${buttonKey} button: "${oldContent}" → "${templateContent}"`);
      appliedCount++;
    } else if (!buttonTop) {
      console.warn(`⚠️ [Responsive Layout] Button element '${buttonKey}' not found in DOM`);
    }
  });
  
  console.log(`✅ [Responsive Layout] Applied templates to ${appliedCount} buttons`);
  
  // Apply device-specific CSS classes
  const body = document.body;
  const oldClasses = Array.from(body.classList).filter(cls => cls.startsWith('device-'));
  body.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
  body.classList.add(`device-${deviceType}`);
  
  console.log(`🎨 [Responsive Layout] Updated body classes: removed [${oldClasses.join(', ')}], added [device-${deviceType}]`);
  
  // Apply touch-specific optimizations
  if (isTouchDevice()) {
    body.classList.add('touch-device');
    console.log('👆 [Responsive Layout] Touch device detected, adding touch optimizations');
    
    // Increase button targets for better touch interaction
    const allButtons = document.querySelectorAll('button, .button');
    allButtons.forEach(button => {
      button.classList.add('touch-optimized');
    });
    console.log(`👆 [Responsive Layout] Applied touch optimization to ${allButtons.length} buttons`);
  } else {
    console.log('🖱️ [Responsive Layout] Non-touch device, skipping touch optimizations');
  }
  
  console.log(`✅ [Responsive Layout] Successfully applied responsive layout for: ${deviceType}`);
}

// ====================================
// POKEMON NAVIGATION
// ====================================

/**
 * Validates Pokemon ID/name and initiates Pokemon data request
 * Handles both numeric IDs and Pokemon names with flexible validation
 * @param {number|string} id - Pokemon ID (1-1025) or Pokemon name (case-insensitive)
 * @param {string} visibility - Visibility state for generated Pokemon UI
 * @param {boolean} skipIdValidation - Whether to skip ID boundary validation
 * @example
 * generatePokemon(25, 'visible', false);        // Normal ID validation
 * generatePokemon('pikachu', 'visible', false);  // Pokemon name search
 * generatePokemon(152, 'visible', true);        // Skip validation for forms
 */
export function generatePokemon(id, visibility = 'visible', skipIdValidation = false) {
  console.log(`🔍 [Generate Pokemon] Request for: ${id}, visibility: ${visibility}, skipValidation: ${skipIdValidation}`);
  
  // Get input textbox for color feedback
  const textbox = document.getElementById('pokemon-textbox');
  console.log(`🔍 [Generate Pokemon] Textbox element: ${textbox ? 'found' : 'not found'}`);
  
  try {
    // Handle string input (Pokemon names)
    if (typeof id === 'string' && isNaN(parseInt(id, 10))) {
      console.log(`🔤 [Generate Pokemon] String input detected: "${id}", treating as Pokemon name`);
      
      // Clean up and normalize the Pokemon name
      const pokemonName = normalizePokemonName(id);
      
      if (pokemonName === '') {
        console.warn(`⚠️ [Generate Pokemon] Empty or invalid string provided: "${id}"`);
        showToast('Please enter a valid Pokémon name or ID');
        if (textbox) textbox.style.color = ERROR_COLOR;
        return;
      }
      
      console.log(`✅ [Generate Pokemon] Requesting Pokemon by name: "${pokemonName}" (normalized from "${id}")`);
      requestPokemon(pokemonName, visibility);
      if (textbox) {
        textbox.style.color = TEXT_COLOR;
        console.log(`🎨 [Generate Pokemon] Set textbox color to success state for name search`);
      }
      return;
    }
    
    // Handle numeric input (Pokemon IDs)
    const pokemonId = typeof id === 'string' ? parseInt(id, 10) : id;
    console.log(`🔢 [Generate Pokemon] Numeric ID: ${pokemonId} (type: ${typeof pokemonId})`);
    
    // Validate ID is a number
    if (isNaN(pokemonId)) {
      console.error(`❌ [Generate Pokemon] Invalid input provided: ${id} → ${pokemonId} (NaN)`);
      showToast('Please enter a valid Pokémon name or ID');
      if (textbox) textbox.style.color = ERROR_COLOR;
      return;
    }
    
    // Handle validation based on skipIdValidation flag
    if (!skipIdValidation) {
      console.log(`✅ [Generate Pokemon] Performing ID validation (range: ${MINIMUM_ID}-${MAXIMUM_ID})`);
      // Normal validation - check boundaries
      if (pokemonId >= MINIMUM_ID && pokemonId <= MAXIMUM_ID) {
        console.log(`✅ [Generate Pokemon] ID ${pokemonId} is within valid range, requesting Pokemon data`);
        requestPokemon(pokemonId, visibility);
        if (textbox) {
          textbox.style.color = TEXT_COLOR;
          console.log(`🎨 [Generate Pokemon] Reset textbox color to success state`);
        }
        return;
      } else {
        // ID out of bounds
        console.warn(`⚠️ [Generate Pokemon] ID ${pokemonId} is out of bounds (${MINIMUM_ID}-${MAXIMUM_ID})`);
        showToast(`Please enter a number between ${MINIMUM_ID} and ${MAXIMUM_ID} or a Pokémon name`);
        if (textbox) {
          textbox.style.color = ERROR_COLOR;
          console.log(`🎨 [Generate Pokemon] Set textbox color to error state`);
        }
        return;
      }
    } else {
      console.log(`⏭️ [Generate Pokemon] Skipping validation, requesting Pokemon data directly`);
      // Skip validation - used for forms, evolutions, etc.
      requestPokemon(pokemonId, visibility);
      if (textbox) {
        textbox.style.color = TEXT_COLOR;
        console.log(`🎨 [Generate Pokemon] Set textbox color to success state`);
      }
      return;
    }
  } catch (error) {
    console.error('❌ [Generate Pokemon] Error in generatePokemon:', error);
    showToast('Error loading Pokemon data');
    if (textbox) {
      textbox.style.color = ERROR_COLOR;
      console.log(`🎨 [Generate Pokemon] Set textbox color to error state due to exception`);
    }
  }
}

/**
 * Generates a random Pokemon ID within the current Pokédex range
 * Respects the current Pokédex type setting (original 151 vs all Pokemon)
 * @returns {number} Random Pokemon ID between MINIMUM_ID and MAXIMUM_ID
 * @example
 * const randomId = getRandomPokemon(); // Returns 1-151 or 1-1025 depending on settings
 * generatePokemon(randomId, 'visible', false);
 */
export function getRandomPokemon() {
  const range = MAXIMUM_ID - MINIMUM_ID + 1;
  return Math.floor(Math.random() * range) + MINIMUM_ID;
}

/**
 * Sets the Pokédex type and updates the maximum ID boundary
 * @param {boolean|string} showOnlyOriginal - Whether to limit to original 151 Pokemon
 * @returns {number} The new maximum ID limit
 * @example
 * const maxId = setPokedexType(true);   // Limit to 151, returns 151
 * const maxId = setPokedexType(false);  // All Pokemon, returns 1025
 */
export function setPokedexType(showOnlyOriginal) {
  const useOriginal = showOnlyOriginal === true || showOnlyOriginal === 'true';
  
  if (useOriginal) {
    MAXIMUM_ID = ORIGINAL_MAXIMUM_ID;
    console.log('Pokédex limited to original 151 Pokemon');
  } else {
    MAXIMUM_ID = 1025; // Current total as of Gen 9
    console.log('Pokédex set to include all Pokemon');
  }
  
  // Update UI if maximum ID display exists
  const maxIdDisplay = document.getElementById('max-id-display');
  if (maxIdDisplay) {
    maxIdDisplay.textContent = MAXIMUM_ID;
  }
  
  return MAXIMUM_ID;
}

/**
 * Controls navigation button visibility based on current Pokemon ID and constraints
 * Manages Previous/Next button states and Recall button availability
 * @param {number} currentId - Current Pokemon ID
 * @param {boolean} hasGenderDifferences - Whether Pokemon has gender differences (legacy parameter)
 * @example
 * updateNavigationButtons(1);    // Hides Previous button (at minimum)
 * updateNavigationButtons(151);  // Hides Next button (if using original Pokédex)
 */
export function updateNavigationButtons(currentId, hasGenderDifferences = false) {
  console.log(`🧭 [Navigation Buttons] Updating for Pokemon ID: ${currentId}, range: ${MINIMUM_ID}-${MAXIMUM_ID}`);
  
  // Get navigation button elements
  const previousButton = document.getElementById('previous-button');
  const nextButton = document.getElementById('next-button');
  const recallButton = document.getElementById('recall-button');
  
  console.log(`🔍 [Navigation Buttons] Button elements found:`, {
    previous: previousButton ? 'found' : 'missing',
    next: nextButton ? 'found' : 'missing',
    recall: recallButton ? 'found' : 'missing'
  });
  
  // Validate current ID
  if (typeof currentId !== 'number' || isNaN(currentId)) {
    console.warn(`⚠️ [Navigation Buttons] Invalid current ID provided: ${currentId} (type: ${typeof currentId})`);
    return;
  }
  
  // Show/hide Previous button based on minimum ID boundary
  if (previousButton) {
    const showPrevious = currentId > MINIMUM_ID;
    previousButton.style.display = showPrevious ? 'inline-block' : 'none';
    console.log(`⬅️ [Navigation Buttons] Previous button: ${showPrevious ? 'shown' : 'hidden'} (ID ${currentId} ${showPrevious ? '>' : '<='} ${MINIMUM_ID})`);
  }
  
  // Show/hide Next button based on maximum ID boundary  
  if (nextButton) {
    const showNext = currentId < MAXIMUM_ID;
    nextButton.style.display = showNext ? 'inline-block' : 'none';
    console.log(`➡️ [Navigation Buttons] Next button: ${showNext ? 'shown' : 'hidden'} (ID ${currentId} ${showNext ? '<' : '>='} ${MAXIMUM_ID})`);
  }
  
  // Show/hide Recall button based on stored Pokemon data
  if (recallButton) {
    const lastPokemon = getStorageItem(STORAGE_KEYS.LAST_POKEMON);
    const currentPokemon = getStorageItem(STORAGE_KEYS.CURRENT_POKEMON);
    
    // Enhanced check: show if lastPokemon exists, is valid, and is different from current
    const showRecall = lastPokemon && 
                      lastPokemon !== '' && 
                      lastPokemon !== currentPokemon &&
                      lastPokemon !== '0' &&
                      lastPokemon !== 'null' &&
                      currentPokemon !== 'null';
    
    if (showRecall) {
      recallButton.style.display = 'inline-block';
      console.log(`🔄 [Navigation Buttons] Recall button: shown (last: ${lastPokemon}, current: ${currentPokemon})`);
    } else {
      recallButton.style.display = 'none';
      console.log(`🔄 [Navigation Buttons] Recall button: hidden (last: ${lastPokemon}, current: ${currentPokemon})`);
    }
  }
  
  console.log(`✅ [Navigation Buttons] Update complete for Pokemon ${currentId}`);
}

// ====================================
// INPUT VALIDATION
// ====================================

/**
 * Validates numeric input and removes non-digit characters
 * Prevents users from entering invalid characters in Pokemon ID input
 * @param {HTMLInputElement|string} input - Input element or input string to validate
 * @example
 * // Used as event handler:
 * textbox.addEventListener('input', (e) => validateNumericInput(e.target));
 */
export function validateNumericInput(input) {
  // Handle both element and string inputs
  const inputElement = typeof input === 'string' ? null : input;
  const inputValue = typeof input === 'string' ? input : input.value;
  
  if (!inputValue) return;
  
  // RegEx to match any non-digit character
  const nonDigitRegex = /\D/g;
  
  // Check if input contains non-digits
  if (nonDigitRegex.test(inputValue)) {
    const cleanValue = inputValue.replace(nonDigitRegex, '');
    
    if (inputElement) {
      inputElement.value = cleanValue;
      // Trigger input event to update any listeners
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    return cleanValue;
  }
  
  return inputValue;
}

/**
 * Validates Pokédex number input and provides visual feedback
 * Changes input field color based on validity of entered Pokemon ID
 * @param {HTMLInputElement} textboxElement - Input element to validate
 * @returns {boolean} True if the input is valid, false otherwise
 * @example
 * const isValid = validatePokedexNumber(textbox);
 * if (isValid) {
 *   generatePokemon(textbox.value, 'visible', false);
 * }
 */
export function validatePokedexNumber(textboxElement) {
  if (!textboxElement) {
    console.warn('validatePokedexNumber: No textbox element provided');
    return false;
  }
  
  const value = parseInt(textboxElement.value, 10);
  
  // Check if value is within valid range
  const isValid = !isNaN(value) && value >= MINIMUM_ID && value <= MAXIMUM_ID;
  
  // Apply appropriate color based on validity
  textboxElement.style.color = isValid ? TEXT_COLOR : ERROR_COLOR;
  
  return isValid;
}

// ====================================
// RESPONSIVE EVENT HANDLERS
// ====================================

/**
 * Sets up responsive behavior that adapts to device changes
 * Handles orientation changes, window resizing, and device detection updates
 * @example
 * initializeResponsiveBehavior(); // Call once during app initialization
 */
export function initializeResponsiveBehavior() {
  // Initial responsive setup
  const initialDeviceType = getDeviceType();
  applyResponsiveLayout(initialDeviceType);
  
  // Handle orientation changes
  const handleOrientationChange = () => {
    setTimeout(() => {
      const deviceType = getDeviceType();
      applyResponsiveLayout(deviceType);
      console.log('Orientation changed, updated layout for:', deviceType);
    }, 100); // Small delay to let orientation change complete
  };
  
  // Handle window resize
  const handleResize = () => {
    const deviceType = getDeviceType();
    applyResponsiveLayout(deviceType);
  };
  
  // Add event listeners
  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleResize);
  
  // Handle visibility change (when switching between apps)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // App became visible again, recheck device type
      const deviceType = getDeviceType();
      applyResponsiveLayout(deviceType);
    }
  });
  
  console.log('Responsive behavior initialized for:', initialDeviceType);
}

// ====================================
// BACKWARD COMPATIBILITY EXPORTS
// ====================================

// Legacy function aliases for backward compatibility
export { generatePokemon as generatePokemonLegacy };
export { getRandomPokemon as getRandomPokemonLegacy };
export { updateNavigationButtons as makeButtonsDisappear, updateNavigationButtons as makeButtonsDisappearLegacy };
export { validateNumericInput as inputCheck, validateNumericInput as inputCheckLegacy };
export { validatePokedexNumber as validPokedexNumberCheck, validatePokedexNumber as validPokedexNumberCheckLegacy };
export { applyResponsiveLayout as headerLayout, applyResponsiveLayout as headerLayoutLegacy };
export { setPokedexType as getPokedexType };

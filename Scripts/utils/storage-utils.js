/**
 * STORAGE UTILITIES MODULE
 * ========================
 * 
 * This module handles local storage management, geolocation services, and
 * data persistence for the Pokemon application. It provides secure and
 * reliable methods for storing user preferences, Pokemon data, and location
 * information while handling errors and edge cases gracefully.
 * 
 * Key Features:
 * - Local storage management with error handling
 * - Geolocation services for location-based features
 * - Date/time formatting and persistence
 * - Storage quota management and cleanup
 * - Cross-browser compatibility for storage APIs
 * 
 * @author Kolby Landon
 * @version 1.1 (Renamed from storage-helpers to storage-utils for consistency)
 * @since 2025
 * @updated 2025-08-01T06:15:00Z
 */

'use strict';

// Import required dependencies
import { showToast } from './dom-utils.js';

// ====================================
// STORAGE SYSTEM CONSTANTS
// ====================================

/** @type {string} Prefix for all Pokemon app storage keys */
const STORAGE_PREFIX = 'pokemon_app_';

/** @type {number} Maximum age for cached data in milliseconds (24 hours) */
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000;

/** @type {Object} Storage key constants for consistent access */
export const STORAGE_KEYS = {
  CURRENT_POKEMON: `${STORAGE_PREFIX}currentPokemon`,
  LAST_POKEMON: `${STORAGE_PREFIX}lastPokemon`,
  DATE_TIME: `${STORAGE_PREFIX}dateTime`,
  COORDINATES: `${STORAGE_PREFIX}coordinates`,
  USER_PREFERENCES: `${STORAGE_PREFIX}userPreferences`,
  POKEMON_CACHE: `${STORAGE_PREFIX}pokemonCache`,
  POKEDEX_TYPE: `${STORAGE_PREFIX}pokedexType`,
  AUDIO_ENABLED: `${STORAGE_PREFIX}audioEnabled`,
  SPEECH_ENABLED: `${STORAGE_PREFIX}speechEnabled`
};

/** @type {Object} Default user preferences */
const DEFAULT_PREFERENCES = {
  showOnlyOriginal: false,
  audioEnabled: true,
  speechEnabled: true,
  autoPlayCries: false,
  theme: 'auto'
};

// ====================================
// LOCAL STORAGE MANAGEMENT
// ====================================

/**
 * Stores current Pokemon data and timestamp in browser local storage
 * Also initiates geolocation capture for location-based features
 * @param {number|string} pokemonId - Pokemon ID to store as current Pokemon
 * @example
 * populateLocalStorage(25); // Stores Pikachu as current Pokemon
 */
export function populateLocalStorage(pokemonId) {
  if (!pokemonId) {
    console.warn('populateLocalStorage: No Pokemon ID provided');
    return;
  }

  try {
    // Store current Pokemon with validation
    const validId = parseInt(pokemonId, 10);
    if (isNaN(validId) || validId < 1) {
      console.error('populateLocalStorage: Invalid Pokemon ID');
      return;
    }
    
    setStorageItem(STORAGE_KEYS.CURRENT_POKEMON, validId.toString());
    setStorageItem(STORAGE_KEYS.DATE_TIME, getDateTime());
    
    // Capture current location for location-based features
    getGeoLocation();
    
    console.log(`Stored Pokemon ${validId} in local storage`);
  } catch (error) {
    console.error('Error populating local storage:', error);
    showToast('Failed to save Pokemon data');
  }
}

/**
 * Safely sets an item in local storage with error handling
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 * @returns {boolean} True if successfully stored, false otherwise
 * @example
 * const success = setStorageItem('myKey', 'myValue');
 */
export function setStorageItem(key, value) {
  if (!isStorageAvailable()) {
    console.warn('Local storage not available');
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('Error setting storage item:', error);
    
    // Handle specific storage errors
    if (error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, attempting cleanup');
      cleanupExpiredCache();
      
      // Try again after cleanup
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryError) {
        console.error('Storage still full after cleanup:', retryError);
        showToast('Storage full - please clear browser data');
      }
    }
    
    return false;
  }
}

/**
 * Safely gets an item from local storage with error handling
 * @param {string} key - Storage key
 * @param {string} defaultValue - Default value if key doesn't exist
 * @returns {string|null} Stored value or default value
 * @example
 * const currentPokemon = getStorageItem(STORAGE_KEYS.CURRENT_POKEMON, '1');
 */
export function getStorageItem(key, defaultValue = null) {
  if (!isStorageAvailable()) {
    console.warn('Local storage not available');
    return defaultValue;
  }

  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (error) {
    console.error('Error getting storage item:', error);
    return defaultValue;
  }
}

/**
 * Removes an item from local storage safely
 * @param {string} key - Storage key to remove
 * @returns {boolean} True if successfully removed, false otherwise
 * @example
 * const removed = removeStorageItem(STORAGE_KEYS.COORDINATES);
 */
export function removeStorageItem(key) {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing storage item:', error);
    return false;
  }
}

/**
 * Clears all Pokemon app data from local storage
 * @returns {boolean} True if successfully cleared, false otherwise
 * @example
 * clearAllStorageData(); // Removes all app data
 */
export function clearAllStorageData() {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    const keys = Object.keys(localStorage);
    const appKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));
    
    appKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Cleared ${appKeys.length} Pokemon app storage items`);
    showToast('App data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing storage data:', error);
    showToast('Failed to clear app data');
    return false;
  }
}

// ====================================
// USER PREFERENCES MANAGEMENT
// ====================================

/**
 * Gets user preferences with defaults for missing values
 * @returns {Object} User preferences object
 * @example
 * const prefs = getUserPreferences();
 * console.log(prefs.audioEnabled); // true/false
 */
export function getUserPreferences() {
  try {
    const stored = getStorageItem(STORAGE_KEYS.USER_PREFERENCES);
    if (!stored) {
      return { ...DEFAULT_PREFERENCES };
    }
    
    const parsed = JSON.parse(stored);
    
    // Merge with defaults to ensure all properties exist
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch (error) {
    console.error('Error parsing user preferences:', error);
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Saves user preferences to local storage
 * @param {Object} preferences - Preferences object to save
 * @returns {boolean} True if successfully saved
 * @example
 * const success = setUserPreferences({ audioEnabled: false });
 */
export function setUserPreferences(preferences) {
  if (!preferences || typeof preferences !== 'object') {
    console.error('setUserPreferences: Invalid preferences object');
    return false;
  }

  try {
    const current = getUserPreferences();
    const updated = { ...current, ...preferences };
    
    const success = setStorageItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
    
    if (success) {
      console.log('User preferences updated:', updated);
    }
    
    return success;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
}

// ====================================
// POKEMON DATA CACHING
// ====================================

/**
 * Caches Pokemon data for faster subsequent loads
 * @param {number} pokemonId - Pokemon ID
 * @param {Object} pokemonData - Pokemon data to cache
 * @returns {boolean} True if successfully cached
 * @example
 * const success = cachePokemonData(25, pikachuData);
 */
export function cachePokemonData(pokemonId, pokemonData) {
  if (!pokemonId || !pokemonData) {
    console.warn('cachePokemonData: Missing required parameters');
    return false;
  }

  try {
    const cacheKey = `${STORAGE_KEYS.POKEMON_CACHE}_${pokemonId}`;
    const cacheData = {
      data: pokemonData,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    return setStorageItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching Pokemon data:', error);
    return false;
  }
}

/**
 * Retrieves cached Pokemon data if not expired
 * @param {number} pokemonId - Pokemon ID to retrieve
 * @returns {Object|null} Cached Pokemon data or null if not found/expired
 * @example
 * const cachedData = getCachedPokemonData(25);
 * if (cachedData) {
 *   // Use cached data
 * } else {
 *   // Fetch from API
 * }
 */
export function getCachedPokemonData(pokemonId) {
  if (!pokemonId) {
    return null;
  }

  try {
    const cacheKey = `${STORAGE_KEYS.POKEMON_CACHE}_${pokemonId}`;
    const cached = getStorageItem(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    const cacheData = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - cacheData.timestamp > CACHE_EXPIRY_TIME) {
      removeStorageItem(cacheKey);
      return null;
    }
    
    return cacheData.data;
  } catch (error) {
    console.error('Error retrieving cached Pokemon data:', error);
    return null;
  }
}

/**
 * Cleans up expired cache entries to free storage space
 * @returns {number} Number of expired entries removed
 * @example
 * const removed = cleanupExpiredCache();
 * console.log(`Removed ${removed} expired cache entries`);
 */
export function cleanupExpiredCache() {
  if (!isStorageAvailable()) {
    return 0;
  }

  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.POKEMON_CACHE));
    const now = Date.now();
    let removed = 0;
    
    cacheKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const cacheData = JSON.parse(cached);
          if (now - cacheData.timestamp > CACHE_EXPIRY_TIME) {
            localStorage.removeItem(key);
            removed++;
          }
        }
      } catch (error) {
        // Remove invalid cache entries
        localStorage.removeItem(key);
        removed++;
      }
    });
    
    console.log(`Cleaned up ${removed} expired cache entries`);
    return removed;
  } catch (error) {
    console.error('Error cleaning up cache:', error);
    return 0;
  }
}

// ====================================
// DATE/TIME UTILITIES
// ====================================

/**
 * Generates formatted timestamp for data persistence
 * @returns {string} Formatted date and time string
 * @example
 * const timestamp = getDateTime(); // "2025/1/15 14:30:25"
 */
export function getDateTime() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error generating timestamp:', error);
    return new Date().toISOString(); // Fallback to ISO string
  }
}

/**
 * Parses stored datetime string back to Date object
 * @param {string} dateTimeString - Formatted datetime string from getDateTime()
 * @returns {Date|null} Date object or null if parsing fails
 * @example
 * const date = parseDateTime("2025/1/15 14:30:25");
 */
export function parseDateTime(dateTimeString) {
  if (!dateTimeString || typeof dateTimeString !== 'string') {
    return null;
  }

  try {
    // Parse format: "YYYY/MM/DD HH:mm:ss"
    const [datePart, timePart] = dateTimeString.split(' ');
    const [year, month, day] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');
    
    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1, // Months are 0-indexed
      parseInt(day, 10),
      parseInt(hours, 10),
      parseInt(minutes, 10),
      parseInt(seconds, 10)
    );
  } catch (error) {
    console.error('Error parsing datetime:', error);
    return null;
  }
}

// ====================================
// GEOLOCATION SERVICES
// ====================================

/**
 * Initiates geolocation request for location-based features
 * Handles both success and error scenarios with appropriate timeouts
 * @param {Object} options - Geolocation options (optional)
 * @example
 * getGeoLocation({ timeout: 10000, enableHighAccuracy: true });
 */
export function getGeoLocation(options = {}) {
  if (!navigator.geolocation) {
    console.warn('Geolocation not supported by this browser');
    setStorageItem(STORAGE_KEYS.COORDINATES, 'Geolocation not supported');
    return;
  }

  // Default geolocation options
  const defaultOptions = {
    enableHighAccuracy: false,
    timeout: 10000,        // 10 second timeout
    maximumAge: 300000     // 5 minute cache
  };
  
  const geoOptions = { ...defaultOptions, ...options };
  
  console.log('Requesting geolocation...');
  
  navigator.geolocation.getCurrentPosition(
    onGeoSuccess,
    onGeoError,
    geoOptions
  );
}

/**
 * Success callback for geolocation request
 * Stores coordinates in local storage for location-based features
 * @param {GeolocationPosition} position - Geolocation position object
 * @example
 * // This function is called automatically by getGeoLocation()
 */
export function onGeoSuccess(position) {
  try {
    const { latitude, longitude, accuracy } = position.coords;
    
    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Invalid coordinates received');
    }
    
    const locationData = {
      latitude: latitude.toFixed(6),      // 6 decimal places for ~1 meter accuracy
      longitude: longitude.toFixed(6),
      accuracy: accuracy ? Math.round(accuracy) : null,
      timestamp: Date.now()
    };
    
    const coordinatesString = `${locationData.latitude}, ${locationData.longitude}`;
    setStorageItem(STORAGE_KEYS.COORDINATES, coordinatesString);
    
    console.log('Geolocation captured:', locationData);
    
    // Store detailed location data separately for advanced features
    setStorageItem(`${STORAGE_PREFIX}locationData`, JSON.stringify(locationData));
    
  } catch (error) {
    console.error('Error processing geolocation:', error);
    onGeoError({ code: 0, message: 'Error processing location data' });
  }
}

/**
 * Error callback for geolocation request
 * Stores appropriate error message based on error type
 * @param {GeolocationPositionError} error - Geolocation error object
 * @example
 * // This function is called automatically by getGeoLocation()
 */
export function onGeoError(error) {
  let errorMessage = 'Failed to get your location';
  
  // Provide specific error messages based on error code
  switch (error.code) {
    case error.PERMISSION_DENIED:
      errorMessage = 'Location access denied by user';
      console.warn('Geolocation permission denied');
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage = 'Location information unavailable';
      console.warn('Geolocation position unavailable');
      break;
    case error.TIMEOUT:
      errorMessage = 'Location request timed out';
      console.warn('Geolocation request timed out');
      break;
    default:
      errorMessage = 'Unknown location error occurred';
      console.error('Unknown geolocation error:', error);
      break;
  }
  
  setStorageItem(STORAGE_KEYS.COORDINATES, errorMessage);
  console.log('Geolocation error stored:', errorMessage);
}

/**
 * Gets stored location data as an object
 * @returns {Object|null} Location data object or null if not available
 * @example
 * const location = getStoredLocation();
 * if (location) {
 *   console.log(`Lat: ${location.latitude}, Lng: ${location.longitude}`);
 * }
 */
export function getStoredLocation() {
  try {
    const locationData = getStorageItem(`${STORAGE_PREFIX}locationData`);
    return locationData ? JSON.parse(locationData) : null;
  } catch (error) {
    console.error('Error parsing stored location:', error);
    return null;
  }
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

/**
 * Checks if local storage is available and functional
 * @returns {boolean} True if local storage is available
 * @example
 * if (isStorageAvailable()) {
 *   setStorageItem('key', 'value');
 * }
 */
export function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    console.warn('Local storage not available:', error);
    return false;
  }
}

/**
 * Gets storage usage information
 * @returns {Object} Storage usage statistics
 * @example
 * const usage = getStorageUsage();
 * console.log(`Using ${usage.used} of ${usage.quota} bytes`);
 */
export function getStorageUsage() {
  if (!isStorageAvailable()) {
    return { used: 0, quota: 0, percentage: 0 };
  }

  try {
    let used = 0;
    
    // Calculate used storage by measuring all localStorage items
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    
    // Estimate quota (browsers typically allow 5-10MB for localStorage)
    const quota = 10 * 1024 * 1024; // Assume 10MB quota
    const percentage = (used / quota) * 100;
    
    return {
      used,
      quota,
      percentage: Math.round(percentage * 100) / 100,
      usedFormatted: formatBytes(used),
      quotaFormatted: formatBytes(quota)
    };
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return { used: 0, quota: 0, percentage: 0 };
  }
}

/**
 * Formats byte values into human-readable strings
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string (e.g., "1.5 KB", "2.3 MB")
 * @example
 * const formatted = formatBytes(1536); // "1.5 KB"
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ====================================
// BACKWARD COMPATIBILITY EXPORTS
// ====================================

// Maintain backward compatibility with existing code
export { populateLocalStorage as populateLocalStorageLegacy };
export { getDateTime as getDateTimeLegacy };
export { getGeoLocation as getGeoLocationLegacy };
export { onGeoSuccess as onGeoSuccessLegacy };
export { onGeoError as onGeoErrorLegacy };

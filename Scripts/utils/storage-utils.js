/**
 * STORAGE-UTILS.JS - Local Storage Management Utilities
 * ====================================================
 * 
 * This module provides a centralized interface for managing browser local storage,
 * specifically for Pokemon data persistence and user preferences.
 * Handles current Pokemon tracking, recall functionality, and location services.
 * 
 * Key Features:
 * - Prefixed storage keys to avoid conflicts with other applications
 * - Type-safe storage operations with error handling
 * - Pokemon recall system with last-viewed tracking
 * - Geolocation capture and storage
 * - User preferences management
 * - Storage quota monitoring and cleanup
 * 
 * Dependencies:
 * - dom-utils.js: showToast function for user notifications
 * 
 * @author Kolby Landon
 * @version 2.0
 * @since 2023
 */

'use strict';

// ====================================
// MODULE IMPORTS
// ====================================
import { showToast } from './dom-utils.js?v=20250801i';

// ====================================
// STORAGE CONFIGURATION
// ====================================

/** @type {string} Storage key prefix to avoid conflicts with other applications */
const STORAGE_PREFIX = 'pokemon_app_';

/** @type {Object} Centralized storage keys with consistent naming */
export const STORAGE_KEYS = {
  CURRENT_POKEMON: `${STORAGE_PREFIX}currentPokemon`,
  LAST_POKEMON: `${STORAGE_PREFIX}lastPokemon`,
  DATE_TIME: `${STORAGE_PREFIX}dateTime`,
  COORDINATES: `${STORAGE_PREFIX}coordinates`,
  USER_IP: `${STORAGE_PREFIX}userIP`,
  USER_PREFERENCES: `${STORAGE_PREFIX}userPreferences`,
  POKEMON_CACHE: `${STORAGE_PREFIX}pokemonCache`,
  POKEDEX_TYPE: `${STORAGE_PREFIX}pokedexType`,
  AUDIO_ENABLED: `${STORAGE_PREFIX}audioEnabled`,
  SPEECH_ENABLED: `${STORAGE_PREFIX}speechEnabled`
};

// ====================================
// CORE STORAGE FUNCTIONS
// ====================================

// Flag to track when we're in a recall/swap operation
let isInRecallOperation = false;

export function populateLocalStorage(pokemonId, isRecall = false) {
  if (!pokemonId) return;

  const validId = parseInt(pokemonId, 10);
  if (isNaN(validId) || validId < 1) return;

  // If this is a recall operation, don't modify the storage - it's already been set by swapCurrentAndLastPokemon
  if (isRecall || isInRecallOperation) {
    setStorageItem(STORAGE_KEYS.DATE_TIME, getDateTime());
    getGeoLocation();
    getUserIP();
    return;
  }

  const oldCurrent = getStorageItem(STORAGE_KEYS.CURRENT_POKEMON);
  
  // Simple rule: if we have an old current and it's different from new, store it as last
  if (oldCurrent && oldCurrent !== validId.toString()) {
    setStorageItem(STORAGE_KEYS.LAST_POKEMON, oldCurrent);
  } else {
    // If no old current or they're the same, clear last to prevent duplicates
    // This ensures CURRENT and LAST are never the same
    setStorageItem(STORAGE_KEYS.LAST_POKEMON, '');
  }
  
  // Set new current
  setStorageItem(STORAGE_KEYS.CURRENT_POKEMON, validId.toString());
  setStorageItem(STORAGE_KEYS.DATE_TIME, getDateTime());
  
  getGeoLocation();
  getUserIP();
}

export function swapCurrentAndLastPokemon() {
  const currentPokemon = getStorageItem(STORAGE_KEYS.CURRENT_POKEMON);
  const lastPokemon = getStorageItem(STORAGE_KEYS.LAST_POKEMON);
  
  // Check if both values exist and are valid (not null, empty, "null" string, or "0")
  if (currentPokemon && lastPokemon && 
      currentPokemon !== lastPokemon && 
      lastPokemon !== '' && 
      lastPokemon !== '0' &&
      lastPokemon !== 'null' &&
      currentPokemon !== 'null') {
    
    // Set flag to prevent populateLocalStorage from interfering
    isInRecallOperation = true;
    
    // Swap the values
    setStorageItem(STORAGE_KEYS.CURRENT_POKEMON, lastPokemon);
    setStorageItem(STORAGE_KEYS.LAST_POKEMON, currentPokemon);
    setStorageItem(STORAGE_KEYS.DATE_TIME, getDateTime());
    
    getGeoLocation();
    
    // Clear flag after a short delay to allow generatePokemon to complete
    setTimeout(() => {
      isInRecallOperation = false;
    }, 100);
    
    return lastPokemon; // Return the new current pokemon
  }
  
  return null; // No swap possible
}

export function setStorageItem(key, value) {
  if (!isStorageAvailable()) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('Error setting storage item:', error);
    return false;
  }
}

export function getStorageItem(key) {
  if (!isStorageAvailable()) return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Error getting storage item:', error);
    return null;
  }
}

function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, 'test');
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

function getDateTime() {
  return new Date().toISOString();
}

function getGeoLocation() {
  // Simplified geolocation
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude},${position.coords.longitude}`;
        setStorageItem(STORAGE_KEYS.COORDINATES, coords);
      },
      () => {} // Silent fail
    );
  }
}

/**
 * Fetches the user's IP address and stores it in local storage
 * Uses multiple fallback services for reliability
 */
async function getUserIP() {
  // Check if IP is already stored and still fresh (within 24 hours)
  const existingIP = getStorageItem(STORAGE_KEYS.USER_IP);
  if (existingIP) {
    try {
      const storedData = JSON.parse(existingIP);
      const now = new Date().getTime();
      const storedTime = new Date(storedData.timestamp).getTime();
      const hoursSinceStored = (now - storedTime) / (1000 * 60 * 60);
      
      // If IP was stored less than 24 hours ago, don't fetch again
      if (hoursSinceStored < 24) {
        console.log('Using cached IP address:', storedData.ip);
        return;
      }
    } catch (error) {
      console.log('Invalid stored IP data, fetching fresh');
    }
  }

  // Array of IP services to try (in order of preference)
  const ipServices = [
    'https://api.ipify.org?format=json',
    'https://ipinfo.io/json',
    'https://api.ip.sb/ip',
    'https://httpbin.org/ip'
  ];

  for (const service of ipServices) {
    try {
      console.log(`Attempting to fetch IP from: ${service}`);
      const response = await fetch(service, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      let ip = null;

      // Parse IP from different response formats
      if (data.ip) {
        ip = data.ip;
      } else if (data.origin) {
        ip = data.origin;
      } else if (typeof data === 'string') {
        ip = data.trim();
      }

      if (ip && isValidIP(ip)) {
        const ipData = {
          ip: ip,
          timestamp: new Date().toISOString(),
          source: service
        };
        
        setStorageItem(STORAGE_KEYS.USER_IP, JSON.stringify(ipData));
        console.log(`✅ User IP stored: ${ip} (via ${service})`);
        
        // Show toast notification (optional)
        // showToast(`IP detected: ${ip}`);
        return;
      }
    } catch (error) {
      console.warn(`Failed to fetch IP from ${service}:`, error.message);
      continue; // Try next service
    }
  }

  console.error('❌ Failed to fetch IP address from all services');
}

/**
 * Validates if a string is a valid IP address (IPv4 or IPv6)
 * @param {string} ip - IP address to validate
 * @returns {boolean} True if valid IP address
 */
function isValidIP(ip) {
  if (!ip || typeof ip !== 'string') return false;
  
  // IPv4 pattern
  const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

/**
 * Gets the stored IP address information
 * @returns {Object|null} IP data object or null if not available
 */
export function getStoredIP() {
  const storedIP = getStorageItem(STORAGE_KEYS.USER_IP);
  if (!storedIP) return null;
  
  try {
    return JSON.parse(storedIP);
  } catch (error) {
    console.error('Error parsing stored IP data:', error);
    return null;
  }
}

/**
 * Forces a refresh of the IP address (ignores cache)
 * @returns {Promise<void>}
 */
export async function refreshUserIP() {
  // Clear existing IP data
  setStorageItem(STORAGE_KEYS.USER_IP, '');
  
  // Fetch fresh IP
  await getUserIP();
}

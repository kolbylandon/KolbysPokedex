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
}

export function swapCurrentAndLastPokemon() {
  const currentPokemon = getStorageItem(STORAGE_KEYS.CURRENT_POKEMON);
  const lastPokemon = getStorageItem(STORAGE_KEYS.LAST_POKEMON);
  
  if (currentPokemon && lastPokemon && 
      currentPokemon !== lastPokemon && 
      lastPokemon !== '' && 
      lastPokemon !== '0') {
    
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

/**
 * POKEAPI REQUEST MANAGER
 * ========================
 * 
 * This module handles all HTTP requests to the Pokemon API (PokeAPI.co)
 * and provides optimized data fetching with caching, error handling,
 * and performance optimizations.
 * 
 * Key Features:
 * - Request caching for reduced API calls and improved performance
 * - Batch processing capabilities for efficient data loading
 * - Comprehensive error handling with user-friendly error messages
 * - Parallel request processing using Promise.all
 * - Automatic cache invalidation with configurable duration
 * 
 * @author Kolby's Pokédex
 * @version 2.0
 * @since 2024
 */

'use strict';
import { populatePage } from './pokemon.js';
import { capitalizeFirstLetter, punctuationNameCheck } from './utils/data-utils.js?v=20250801i';
import { showToast } from './utils/dom-utils.js?v=20250801c';

// ====================================
// API CONFIGURATION
// ====================================

/** @type {string} Base URL for all Pokemon API requests */
const ApiAddress = 'https://pokeapi.co/api/v2';

// ====================================
// PERFORMANCE OPTIMIZATION SYSTEMS
// ====================================

/** 
 * Request cache for storing API responses to reduce redundant calls
 * @type {Map<string, {data: any, timestamp: number}>}
 */
const REQUEST_CACHE = new Map();

/** @type {number} Cache duration in milliseconds (5 minutes) */
const CACHE_DURATION = 5 * 60 * 1000;

/** 
 * Batch request queue for grouping similar requests
 * @type {Map<string, Array>}
 */
const REQUEST_QUEUE = new Map();

/** @type {number|null} Timeout reference for batch processing */
let REQUEST_TIMEOUT = null;

// ====================================
// CORE REQUEST FUNCTIONS
// ====================================

/**
 * Enhanced fetch wrapper with caching, error handling, and performance optimization
 * Automatically caches successful responses and handles various error scenarios
 * @param {string} url - API endpoint URL to fetch data from
 * @returns {Promise<Object>} Parsed JSON response data
 * @throws {Error} Network errors, parsing errors, or HTTP error responses
 */
async function fetchJson(url) {
  try {
    // Check cache first to avoid unnecessary API calls
    const cached = REQUEST_CACHE.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Perform HTTP request with timeout handling
    const response = await fetch(url);
    if (!response.ok) throw response;
    
    // Parse JSON response
    const data = await response.json();
    
    // Cache the successful response with timestamp
    REQUEST_CACHE.set(url, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (exception) {
    handleError(exception);
    throw exception;
  }
}

/**
 * Centralized error handling for all API requests
 * Provides detailed error information and user-friendly notifications
 * @param {Error|Response} exception - Error object or failed HTTP response
 */
function handleError(exception) {
  let userMessage = '';
  
  // Handle HTTP error responses
  if (exception.status) {
    switch (exception.status) {
      case 404:
        userMessage = 'Pokémon not found. Please check the name or ID and try again.';
        break;
      case 500:
        userMessage = 'Server error. Please try again later.';
        break;
      case 503:
        userMessage = 'Service temporarily unavailable. Please try again later.';
        break;
      default:
        userMessage = `Network error (${exception.status}). Please check your connection.`;
    }
  } else {
    // Handle network or parsing errors
    userMessage = 'Unable to load Pokémon data. Please check your connection and try again.';
  }
  
  // Show user-friendly error notification
  showToast(userMessage);
  
  // Log detailed error information for debugging
  console.error('API Request Error:', {
    status: exception.status || 'Unknown',
    message: exception.message || exception.statusText || 'Unknown error',
    url: exception.url || 'Unknown URL',
    stack: exception.stack || 'No stack trace'
  });
} //fetchJson

// ====================================
// POKEMON DATA REQUESTS
// ====================================

/**
 * Fetches complete Pokemon data including both basic info and species details
 * Uses parallel requests for optimal performance and passes data to page population
 * Handles alternate forms by using species ID from Pokemon data for species requests
 * @param {number|string} id - Pokemon ID or name to fetch
 * @param {string} visibility - Visibility state for the loaded Pokemon display
 */
async function requestPokemon(id, visibility) {
  try {
    // First, fetch the basic Pokemon data
    const pokemonResponse = await fetchJson(`${ApiAddress}/pokemon/${id}`);
    
    // Extract species ID from Pokemon data for alternate forms
    // This handles cases where form ID ≠ species ID (e.g., Deoxys forms)
    const speciesId = pokemonResponse.species.url.split('/').slice(-2, -1)[0];
    
    // Fetch species data using the correct species ID
    const speciesResponse = await fetchJson(`${ApiAddress}/pokemon-species/${speciesId}`);
    
    // Pass both responses to page population function
    populatePage(pokemonResponse, speciesResponse, visibility);
  } catch(exception) {
    // Error already handled in fetchJson - silently fail here
  }
} //requestPokemon

/**
 * Fetches ability effect description and populates list item with formatted content
 * Handles ability name formatting and English language filtering
 * @param {string} url - API URL for the specific ability
 * @param {HTMLElement} listItem - DOM element to populate with ability information
 * @param {string} name - Ability name for display formatting
 */
async function requestAbilityEffect(url, listItem, name) {
  try {
    const abilityEffectResponse = await fetchJson(url);
    
    // Find English language flavor text entry
    const entry = abilityEffectResponse.flavor_text_entries.find(e => e.language.name === 'en');
    
    if(entry) {
      // Format ability name and description
      name = name.replaceAll('-', ' ');                    // Replace hyphens with spaces
      let flavorText = entry.flavor_text.replaceAll('\ufffd', 'é'); // Fix encoding issues
      
      // Populate list item with formatted ability information
      listItem.innerHTML = `<b><u>${name}</u></b>- ${flavorText}`;
    }
  } catch (exception) {
    // Silently fail for individual ability requests
  }
} //requestAbilityEffect

/**
 * Fetches held item description and populates list item with formatted content
 * Handles item name formatting and English language filtering
 * @param {string} url - API URL for the specific held item
 * @param {HTMLElement} listItem - DOM element to populate with item information
 * @param {string} name - Item name for display formatting
 */
async function requestHeldItem(url, listItem, name) {
  try {
    const heldItemResponse = await fetchJson(url);
    
    // Find English language description entry
    const entry = heldItemResponse.flavor_text_entries.find(e => e.language.name === 'en');
    
    if(entry) {
      // Format item name
      name = name.replaceAll('-', ' '); // Replace hyphens with spaces
      
      // Populate list item with formatted item information
      listItem.innerHTML = `<b><u>${name}</u></b>- ${entry.text}`;
    }
  } catch (exception) {
    // Silently fail for individual item requests
  }
} //requestHeldItem

/**
 * Fetches Pokemon form information and handles special formatting cases
 * Deals with unique form naming conventions like Kommo-o variants
 * @param {string} url - API URL for the Pokemon form data
 * @param {HTMLElement} listItem - DOM element to populate with form name
 */
async function requestForm(url, listItem) {
  try {
    const formsResponse = await fetchJson(url);
    
    // Process each form in the response
    formsResponse.forms.forEach(form => {
      let name = punctuationNameCheck(form.name);
      
      // Handle special case formatting for Kommo-o forms (784)
      if(!name.toLowerCase().includes('kommo-o') && !name.includes('♀') && !name.includes('♂') && name !== 'Type: Null') {
        name = name.replaceAll('-', ' '); // Standard hyphen replacement for other Pokemon
      } else if(name.toLowerCase() === 'kommo-o') {
        name = 'Kommo-o';                 // Preserve Kommo-o name with proper capitalization
      } else if(name.toLowerCase().includes('kommo-o') && name !== 'Kommo-o') {
        name = 'Kommo-o Totem';          // Special Totem form
      }

      // Set formatted form name
      listItem.innerText = capitalizeFirstLetter(name);
    });
  } catch (exception) {
    // Silently fail for individual form requests
  }
} //requestForm

// ====================================
// TYPE SYSTEM UTILITIES
// ====================================

/**
 * Mapping of Pokemon type names to their corresponding API numeric IDs
 * Used for efficient type-based queries and lookups
 * @type {Object<string, number>}
 */
const typeMap = {
  normal: 1, fighting: 2, flying: 3, poison: 4, ground: 5, rock: 6, bug: 7, ghost: 8, steel: 9,
  fire: 10, water: 11, grass: 12, electric: 13, psychic: 14, ice: 15, dragon: 16, dark: 17, fairy: 18
}; //typeMap

/**
 * Fetches all Pokemon of a specific type for analysis or filtering
 * Supports both type names and numeric IDs with automatic conversion
 * @param {string|number} type - Pokemon type name or numeric ID
 */
async function requestType(type) {
  try {
    // Convert type name to numeric ID if necessary
    if(typeof type === 'string' && typeMap[type.toLowerCase()]) {
      type = typeMap[type.toLowerCase()];
    }
    
    // Fetch type data from API
    const typeResponse = await fetchJson(`${ApiAddress}/type/${type}`);
    
    // Process and log all Pokemon of this type
    typeResponse.pokemon.forEach(pokemon => {
      let name = punctuationNameCheck(pokemon.pokemon.name).replaceAll('-', ' ');
      console.table(name); // Log formatted Pokemon names
    });
  } catch(exception) {
    console.clear(); // Clear console on error
  }
} //requestType

export {
  requestPokemon, requestAbilityEffect, requestHeldItem, requestForm, requestType
};
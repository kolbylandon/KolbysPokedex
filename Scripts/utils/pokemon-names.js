/**
 * POKEMON NAMES UTILITY MODULE
 * ============================
 * 
 * This module provides utilities for handling Pokemon names, including
 * common variations, autocomplete suggestions, and name validation.
 * 
 * @author Kolby Landon
 * @version 1.0
 * @since 2025
 */

'use strict';

// ====================================
// POPULAR POKEMON NAMES
// ====================================

/**
 * List of popular Pokemon names for suggestions and examples
 * Includes Generation 1 favorites and commonly searched Pokemon
 */
export const POPULAR_POKEMON = [
  'pikachu', 'charizard', 'blastoise', 'venusaur', 'mewtwo', 'mew',
  'eevee', 'lucario', 'garchomp', 'dragonite', 'gengar', 'alakazam',
  'machamp', 'golem', 'lapras', 'snorlax', 'articuno', 'zapdos', 'moltres',
  'gyarados', 'vaporeon', 'jolteon', 'flareon', 'espeon', 'umbreon'
];

/**
 * Common Pokemon name variations and their correct API names
 * Helps users find Pokemon even if they use common misspellings or variations
 */
export const NAME_VARIATIONS = {
  // Generation 1 variations
  'mr-mime': 'mr-mime',
  'mrmime': 'mr-mime',
  'mr.mime': 'mr-mime',
  'mr mime': 'mr-mime',
  'farfetchd': 'farfetchd',
  'farfetch-d': 'farfetchd',
  "farfetch'd": 'farfetchd',
  'farfetch d': 'farfetchd',
  
  // Gender variations
  'nidoran-f': 'nidoran-f',
  'nidoran-female': 'nidoran-f',
  'nidoran♀': 'nidoran-f',
  'nidoran-m': 'nidoran-m',
  'nidoran-male': 'nidoran-m',
  'nidoran♂': 'nidoran-m',
  
  // Type: Null variations
  'type-null': 'type-null',
  'typenull': 'type-null',
  'type null': 'type-null',
  'type:null': 'type-null',
  
  // Mime Jr variations
  'mime-jr': 'mime-jr',
  'mimejr': 'mime-jr',
  'mime jr': 'mime-jr',
  'mime-junior': 'mime-jr',
  'mimejunior': 'mime-jr',
  'mime junior': 'mime-jr',

  // Ho-Oh variations
  'ho-oh': 'ho-oh',
  'hooh': 'ho-oh',
  'ho oh': 'ho-oh',

  // Porygon2 variations
  'porygon2': 'porygon2',
  'porygon-2': 'porygon2',
  'porygon 2': 'porygon2',
  
  // Porygon-Z variations
  'porygon-z': 'porygon-z',
  'porygonz': 'porygon-z',
  'porygon z': 'porygon-z',
  
  // Flabébé variations
  'flabebe': 'flabébé',
  'flabébe': 'flabébé',
  'flabébé': 'flabébé',
};

/**
 * Normalizes a Pokemon name for API requests
 * Handles common variations, special characters, and formatting
 * @param {string} name - Raw Pokemon name input
 * @returns {string} Normalized Pokemon name for API
 */
export function normalizePokemonName(name) {
  if (!name || typeof name !== 'string') return '';
  
  // Basic cleanup
  let normalized = name.toLowerCase().trim();
  
  if (normalized === '') return '';
  
  // Check if it's already in our variations map
  if (NAME_VARIATIONS[normalized]) {
    return NAME_VARIATIONS[normalized];
  }
  
  // Handle special characters and formatting
  normalized = normalized.replace(/[\s\-_\.]/g, '-'); // Convert spaces and punctuation to hyphens
  normalized = normalized.replace(/[''′]/g, ''); // Remove apostrophes and similar characters
  normalized = normalized.replace(/[♀]/g, '-f'); // Handle female symbol
  normalized = normalized.replace(/[♂]/g, '-m'); // Handle male symbol
  normalized = normalized.replace(/:/g, '-'); // Convert colons to hyphens
  
  // Remove multiple consecutive hyphens
  normalized = normalized.replace(/-+/g, '-');
  
  // Remove leading/trailing hyphens
  normalized = normalized.replace(/^-+|-+$/g, '');
  
  // Check variations map again after normalization
  if (NAME_VARIATIONS[normalized]) {
    return NAME_VARIATIONS[normalized];
  }
  
  return normalized;
}

/**
 * Gets a random popular Pokemon name for examples
 * @returns {string} Random popular Pokemon name
 */
export function getRandomPopularPokemon() {
  return POPULAR_POKEMON[Math.floor(Math.random() * POPULAR_POKEMON.length)];
}

/**
 * Suggests similar Pokemon names based on input
 * Simple implementation using string similarity
 * @param {string} input - User input
 * @param {number} maxSuggestions - Maximum number of suggestions to return
 * @returns {string[]} Array of suggested Pokemon names
 */
export function suggestPokemonNames(input, maxSuggestions = 5) {
  if (!input || input.length < 2) return [];
  
  const normalizedInput = input.toLowerCase().trim();
  const suggestions = [];
  
  // First, check for exact starts
  for (const pokemon of POPULAR_POKEMON) {
    if (pokemon.startsWith(normalizedInput)) {
      suggestions.push(pokemon);
    }
  }
  
  // Then check for contains
  for (const pokemon of POPULAR_POKEMON) {
    if (!suggestions.includes(pokemon) && pokemon.includes(normalizedInput)) {
      suggestions.push(pokemon);
    }
  }
  
  return suggestions.slice(0, maxSuggestions);
}

/**
 * Development utility function
 * @returns {boolean} True if in development mode, false otherwise
 */
function isDev() {
  return typeof process === 'undefined' || process.env.NODE_ENV !== 'production';
}

// Example usage:
// if (isDev()) console.log('message');
// if (isDev()) console.warn('message');
// if (isDev()) console.error('message');

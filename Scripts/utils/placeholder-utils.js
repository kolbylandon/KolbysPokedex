/**
 * PLACEHOLDER ROTATION UTILITY
 * =============================
 * 
 * This utility manages dynamic placeholder text rotation for the Pokemon search input,
 * showing users different Pokemon examples to encourage exploration.
 * 
 * @author Kolby Landon
 * @version 1.0
 * @since 2025
 */

'use strict';

import { getRandomPopularPokemon, POPULAR_POKEMON } from './pokemon-names.js';

/**
 * List of placeholder examples to rotate through
 */
const PLACEHOLDER_EXAMPLES = [
  'Try: pikachu, charizard, or 25...',
  'Try: eevee, lucario, or 150...',
  'Try: garchomp, mewtwo, or 1...',
  'Try: gengar, dragonite, or 144...',
  'Try: alakazam, gyarados, or 6...'
];

/**
 * Initializes dynamic placeholder rotation for the search input
 * @param {HTMLInputElement} inputElement - The search input element
 * @param {number} intervalMs - Rotation interval in milliseconds (default: 3000)
 */
export function initializePlaceholderRotation(inputElement, intervalMs = 3000) {
  if(!inputElement) {
    return;
  }
  
  let currentIndex = 0;
  
  const rotatePlaceholder = () => {
    // Only rotate if input is not focused and empty
    if(document.activeElement !== inputElement && inputElement.value === '') {
      inputElement.placeholder = PLACEHOLDER_EXAMPLES[currentIndex];
      currentIndex = (currentIndex + 1) % PLACEHOLDER_EXAMPLES.length;
    }
  };
  
  // Set initial placeholder
  rotatePlaceholder();
  
  // Start rotation interval
  const interval = setInterval(rotatePlaceholder, intervalMs);
  
  // Stop rotation when user focuses input
  inputElement.addEventListener('focus', () => {
    inputElement.placeholder = 'Enter Pokémon name or ID...';
  });
  
  // Resume rotation when user leaves empty input
  inputElement.addEventListener('blur', () => {
    if(inputElement.value === '') {
      setTimeout(rotatePlaceholder, 500); // Small delay before resuming rotation
    }
  });
  
  // Return interval ID so it can be cleared if needed
  return interval;
}

/**
 * Creates a placeholder text with random Pokemon examples
 * @returns {string} Placeholder text with random examples
 */
export function createRandomPlaceholder() {
  const pokemon1 = getRandomPopularPokemon();
  const pokemon2 = getRandomPopularPokemon();
  const randomId = Math.floor(Math.random() * 150) + 1;
  
  return `Try: ${pokemon1}, ${pokemon2}, or ${randomId}...`;
}

/**
 * Checks if the environment is development mode
 * @returns {boolean} True if in development mode, false otherwise
 */
function isDev() {
  return typeof process === 'undefined' || process.env.NODE_ENV !== 'production';
}

// Example usage:
// if(isDev()) console.log('message');
// if(isDev()) console.warn('message');
// if(isDev()) console.error('message');

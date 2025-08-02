/**
 * AUDIO UTILITIES MODULE
 * ======================
 * 
 * This module provides comprehensive audio functionality for the Pokemon application,
 * including Pokemon cry playback, text-to-speech for Pokédex entries, and audio
 * error handling with fallback sources.
 * 
 * Key Features:
 * - Pokemon cry audio with multiple fallback sources
 * - Text-to-speech for Pokemon names and Pokédex entries
 * - Comprehensive error handling and user feedback
 * - Audio loading state management and user notifications
 * - Cross-platform compatibility for different audio formats
 * 
 * @author Kolby Landon
 * @version 2.1 (Renamed from audio-helpers to audio-utils for consistency)
 * @since 2025
 * @updated 2025-08-01T06:15:00Z
 */

'use strict';

'use strict';

// Import required dependencies
import { 
  showToast 
} from './dom-utils.js';
import { capitalizeFirstLetter } from './data-utils.js?v=20250801i';

// ====================================
// AUDIO SYSTEM CONSTANTS
// ====================================

/** @type {SpeechSynthesis} Web Speech API synthesis interface */
export const Synth = window.speechSynthesis;

/** @type {number} Default volume level for Pokemon cries (0.0 to 1.0) */
const DEFAULT_CRY_VOLUME = 0.7;

/** @type {Array<string>} Alternative audio sources for fallback support */
const ALTERNATIVE_CRY_SOURCES = [
  'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/',
  'https://pokemoncries.com/cries/',
  'https://play.pokemonshowdown.com/audio/cries/'
];

/** @type {Array<string>} Supported audio formats in order of preference */
const SUPPORTED_AUDIO_FORMATS = ['.ogg', '.mp3', '.wav'];

// ====================================
// POKEMON CRY PLAYBACK
// ====================================

/**
 * Plays the audio cry for the currently displayed Pokemon
 * Uses global pokemon object if available, otherwise extracts data from DOM
 * Attempts multiple fallback audio sources if primary source fails
 * @example
 * playCurrentPokemonCry(); // Plays cry for currently displayed Pokemon
 */
export function playCurrentPokemonCry() {
  try {
    let pokemonData = null;
    
    // First try to get global pokemon object if available
    if (typeof window !== 'undefined' && window.pokemon) {
      pokemonData = window.pokemon;
      console.log('Using global pokemon object:', pokemonData);
    } else {
      // Fallback: Extract Pokemon data from DOM elements
      const nameElement = document.getElementById('name-header');
      const numberElement = document.getElementById('number-header');
      
      let pokemonName = '';
      let pokemonId = '';
      
      if (nameElement && nameElement.textContent) {
        pokemonName = nameElement.textContent.trim().toLowerCase();
        // Clean up name - remove any extra characters
        pokemonName = pokemonName.replace(/[^\w\s-]/g, '').trim();
        console.log('Extracted Pokemon name:', pokemonName);
      }
      
      if (numberElement && numberElement.textContent) {
        const numberMatch = numberElement.textContent.match(/\d+/);
        if (numberMatch) {
          pokemonId = parseInt(numberMatch[0]);
          console.log('Extracted Pokemon ID:', pokemonId);
        }
      }
      
      console.log('Extracted Pokemon data from DOM:', { name: pokemonName, id: pokemonId });
      
      if (!pokemonName || !pokemonId) {
        console.error('Could not extract Pokemon data from DOM - Name:', nameElement?.textContent, 'Number:', numberElement?.textContent);
        showToast('Cannot play cry: Pokemon data not found');
        return;
      }
      
      // Create Pokemon object for audio playback without hardcoded cry URL
      pokemonData = { 
        name: pokemonName, 
        id: pokemonId,
        cry: null // Let the function use fallback sources
      };
    }
    
    playPokemonCryWithData(pokemonData);
  } catch (error) {
    console.error('Error in playCurrentPokemonCry:', error);
    showToast('Error playing Pokemon cry');
  }
}

/**
 * Plays Pokemon cry audio with comprehensive error handling and fallback sources
 * Manages button states during playback and provides user feedback via toast notifications
 * @param {Object} pokemon - Pokemon data object containing cry URL and basic info
 * @example
 * const pokemon = { 
 *   name: 'pikachu', 
 *   id: 25, 
 *   cry: 'https://example.com/pikachu.ogg' 
 * };
 * playPokemonCryWithData(pokemon);
 */
export function playPokemonCryWithData(pokemon) {
  if (!pokemon || (!pokemon.name && !pokemon.id)) {
    console.error('Invalid Pokemon data for cry playback');
    showToast('Cannot play cry: Invalid Pokemon data');
    return;
  }

  const cryButton = document.getElementById('cry-button');
  const cryButtonTop = document.getElementById('cry-button-top');
  
  if (!cryButton || !cryButtonTop) {
    console.error('Cry button elements not found');
    return;
  }

  // Store original button state for restoration
  const originalHTML = cryButtonTop.innerHTML;
  
  // Set loading state
  cryButtonTop.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  cryButton.disabled = true;
  cryButton.classList.add('loading');
  
  // Function to reset button state
  function resetButtonState() {
    cryButtonTop.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
    cryButton.disabled = false;
    cryButton.classList.remove('loading');
  }

  try {
    // If no cry URL is provided or it's null, go directly to alternative sources
    if (!pokemon.cry) {
      console.log('No primary cry URL available, using alternative sources');
      resetButtonState();
      tryAlternativeCry(pokemon);
      return;
    }

    // Create audio element for primary cry source
    const audio = new Audio();
    
    // Set up event handlers for audio loading and playback
    audio.addEventListener('error', (e) => {
      console.error('Error loading Pokémon cry:', e);
      resetButtonState();
      tryAlternativeCry(pokemon); // Attempt fallback sources
    });
    
    audio.addEventListener('loadstart', () => {
      console.log('Loading Pokémon cry...');
    });
    
    audio.addEventListener('canplay', () => {
      console.log('Pokémon cry ready to play');
      resetButtonState();
    });
    
    audio.addEventListener('ended', () => {
      resetButtonState(); // Reset when audio finishes
    });
    
    // Configure audio properties for optimal playback
    audio.volume = DEFAULT_CRY_VOLUME;     // Set to 70% volume
    audio.preload = 'auto';                // Preload for faster playback
    audio.crossOrigin = 'anonymous';       // Enable CORS for external sources
    
    // Set the audio source
    audio.src = pokemon.cry;
    
    // Attempt to play with promise handling (required for modern browsers)
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log(`Playing ${pokemon.name}'s cry`);
          showToast(`Playing ${capitalizeFirstLetter(pokemon.name)}'s cry! 🔊`);
          cryButtonTop.innerHTML = `<i class="fa-solid fa-play"></i>`;
          cryButton.classList.remove('loading');
        })
        .catch((error) => {
          console.error('Error playing Pokémon cry:', error);
          resetButtonState();
          
          // Handle specific error types with appropriate user feedback
          if (error.name === 'NotAllowedError') {
            showToast('Please interact with the page first, then try again');
          } else if (error.name === 'NotSupportedError') {
            showToast('Audio format not supported by your browser');
          } else {
            showToast('Failed to play Pokémon cry');
            // Try alternative sources on play failure
            tryAlternativeCry(pokemon);
          }
        });
    }
  } catch (error) {
    console.error('Error creating audio for Pokémon cry:', error);
    // Reset button state on any error
    cryButtonTop.innerHTML = originalHTML;
    cryButton.disabled = pokemon.cry ? false : true;
    cryButton.classList.remove('loading');
    showToast('Error loading Pokémon cry');
    
    // Attempt alternative sources if available
    if (pokemon.name || pokemon.id) {
      tryAlternativeCry(pokemon);
    }
  }
}

/**
 * Attempts to play Pokemon cry using alternative audio sources
 * Fallback function when primary cry source fails, tries multiple formats and sources
 * @param {Object} pokemon - Pokemon data object with id and name
 * @example
 * const pokemon = { name: 'pikachu', id: 25 };
 * tryAlternativeCry(pokemon);
 */
export function tryAlternativeCry(pokemon) {
  console.log(`🔄 [Alternative Cry] Starting fallback audio for:`, pokemon);
  
  if (!pokemon || !pokemon.id) {
    console.error('❌ [Alternative Cry] Invalid Pokemon data for alternative cry:', pokemon);
    return;
  }
  
  const cryButton = document.getElementById('cry-button');
  const cryButtonTop = document.getElementById('cry-button-top');
  
  if (!cryButton || !cryButtonTop) {
    console.error('❌ [Alternative Cry] Cry button elements not found in DOM');
    return;
  }
  
  // Generate all possible alternative URLs
  const alternativeUrls = [];
  ALTERNATIVE_CRY_SOURCES.forEach(baseUrl => {
    SUPPORTED_AUDIO_FORMATS.forEach(format => {
      if (baseUrl.includes('pokemonshowdown')) {
        // Pokemon Showdown uses name-based URLs
        const url = `${baseUrl}${pokemon.name.toLowerCase()}${format}`;
        alternativeUrls.push(url);
        console.log(`🎵 [Alternative Cry] Generated showdown URL: ${url}`);
      } else {
        // Other sources use ID-based URLs
        const url = `${baseUrl}${pokemon.id}${format}`;
        alternativeUrls.push(url);
        console.log(`🎵 [Alternative Cry] Generated ID-based URL: ${url}`);
      }
    });
  });
  
  console.log(`🎵 [Alternative Cry] Generated ${alternativeUrls.length} alternative URLs`);
  showToast('Trying alternative audio sources...');
  
  let currentIndex = 0;
  
  // Recursive function to try each alternative source
  function tryNext() {
    if (currentIndex >= alternativeUrls.length) {
      // All sources failed - disable cry feature
      console.error(`❌ [Alternative Cry] All ${alternativeUrls.length} sources failed`);
      showToast('No working cry audio found for this Pokémon');
      cryButtonTop.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
      cryButton.disabled = true;
      cryButton.classList.add('cry-unavailable');
      return;
    }
    
    const currentUrl = alternativeUrls[currentIndex];
    console.log(`🎵 [Alternative Cry] Trying source ${currentIndex + 1}/${alternativeUrls.length}: ${currentUrl}`);
    
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.volume = DEFAULT_CRY_VOLUME;
    
    // Set up timeout for slow-loading sources
    const timeout = setTimeout(() => {
      console.warn(`⏰ [Alternative Cry] Timeout for source ${currentIndex + 1}: ${currentUrl}`);
      currentIndex++;
      tryNext();
    }, 5000); // 5 second timeout
    
    audio.addEventListener('error', (error) => {
      console.warn(`❌ [Alternative Cry] Error with source ${currentIndex + 1}: ${currentUrl}`, error);
      clearTimeout(timeout);
      currentIndex++;
      tryNext(); // Try next source on error
    });
    
    audio.addEventListener('canplay', () => {
      console.log(`✅ [Alternative Cry] Source ${currentIndex + 1} ready: ${currentUrl}`);
      clearTimeout(timeout);
      audio.play()
        .then(() => {
          console.log(`🔊 [Alternative Cry] Successfully playing ${pokemon.name}'s cry from source ${currentIndex + 1}`);
          showToast(`Playing ${capitalizeFirstLetter(pokemon.name)}'s cry! 🔊`);
          cryButtonTop.innerHTML = `<i class="fa-solid fa-play"></i>`;
          cryButton.disabled = false;
          cryButton.classList.remove('cry-unavailable');
          
          audio.addEventListener('ended', () => {
            console.log(`🔇 [Alternative Cry] Audio playback ended for ${pokemon.name}`);
            cryButtonTop.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
          });
        })
        .catch((playError) => {
          console.warn(`❌ [Alternative Cry] Play error for source ${currentIndex + 1}: ${currentUrl}`, playError);
          currentIndex++;
          tryNext(); // Try next source on play error
        });
    });
    
    audio.src = currentUrl;
  }
  
  tryNext();
}

// ====================================
// TEXT-TO-SPEECH FUNCTIONALITY
// ====================================

/**
 * Initiates text-to-speech reading of Pokemon entry information
 * Reads Pokemon name, genus, and Pokédx entry using Web Speech API
 * @param {string} name - Pokemon name to announce
 * @param {string} genus - Pokemon genus classification (e.g., "Seed Pokémon")
 * @param {string} entry - Pokédx entry text to read
 * @example
 * startReadingEntry('Bulbasaur', 'Seed Pokémon', 'A strange seed was planted...');
 */
export function startReadingEntry(name, genus, entry) {
  if (!name || !genus || !entry) {
    console.warn('Missing required text for speech synthesis');
    showToast('Cannot read entry: missing information');
    return;
  }

  // Cancel any ongoing speech before starting new reading
  Synth.cancel();
  
  try {
    // Create utterances for each part of the reading
    const nameUtterance = new SpeechSynthesisUtterance(name);
    const genusUtterance = new SpeechSynthesisUtterance(`The ${genus}`);
    const entryUtterance = new SpeechSynthesisUtterance(entry);
    
    // Configure speech parameters for better listening experience
    [nameUtterance, genusUtterance, entryUtterance].forEach(utterance => {
      utterance.rate = 0.9;    // Slightly slower for clarity
      utterance.pitch = 1.0;   // Normal pitch
      utterance.volume = 0.8;  // 80% volume
    });
    
    // Add event listeners for user feedback
    nameUtterance.addEventListener('start', () => {
      console.log('Starting to read Pokemon entry');
      showToast('Reading Pokemon entry...');
    });
    
    entryUtterance.addEventListener('end', () => {
      console.log('Finished reading Pokemon entry');
      showToast('Finished reading entry');
    });
    
    entryUtterance.addEventListener('error', (error) => {
      console.error('Speech synthesis error:', error);
      showToast('Error reading entry');
    });
    
    // Queue speech synthesis utterances in sequence
    Synth.speak(nameUtterance);
    Synth.speak(genusUtterance);
    
    // Brief pause between genus and entry for better flow
    setTimeout(() => {
      Synth.speak(entryUtterance);
    }, 100);
    
  } catch (error) {
    console.error('Error setting up speech synthesis:', error);
    showToast('Text-to-speech not available');
  }
}

/**
 * Stops any currently playing text-to-speech
 * Provides immediate cancellation of ongoing speech synthesis
 * @example
 * stopReadingEntry(); // Immediately stops any current speech
 */
export function stopReadingEntry() {
  if (Synth.speaking) {
    Synth.cancel();
    console.log('Speech synthesis cancelled');
    showToast('Stopped reading entry');
  }
}

/**
 * Toggles text-to-speech playback state
 * Pauses if speaking, resumes if paused, starts if stopped
 * @returns {string} Current state after toggle ('playing', 'paused', 'stopped')
 * @example
 * const state = toggleSpeechPlayback();
 * console.log(`Speech is now: ${state}`);
 */
export function toggleSpeechPlayback() {
  if (Synth.speaking && !Synth.paused) {
    // Currently speaking - pause it
    Synth.pause();
    showToast('Paused reading');
    return 'paused';
  } else if (Synth.paused) {
    // Currently paused - resume it
    Synth.resume();
    showToast('Resumed reading');
    return 'playing';
  } else {
    // Not speaking - already stopped
    showToast('No active reading to toggle');
    return 'stopped';
  }
}

// ====================================
// AUDIO UTILITY FUNCTIONS
// ====================================

/**
 * Checks if the browser supports audio playback
 * Tests for HTML5 audio support and common formats
 * @returns {boolean} True if audio is supported, false otherwise
 * @example
 * if (isAudioSupported()) {
 *   playPokemonCry(pokemon);
 * } else {
 *   showToast('Audio not supported in this browser');
 * }
 */
export function isAudioSupported() {
  const audio = document.createElement('audio');
  return !!(audio.canPlayType && (
    audio.canPlayType('audio/mpeg;').replace(/no/, '') ||
    audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, '') ||
    audio.canPlayType('audio/wav; codecs="1"').replace(/no/, '')
  ));
}

/**
 * Checks if the browser supports the Web Speech API
 * @returns {boolean} True if speech synthesis is supported
 * @example
 * if (isSpeechSupported()) {
 *   startReadingEntry(name, genus, entry);
 * } else {
 *   showToast('Text-to-speech not supported');
 * }
 */
export function isSpeechSupported() {
  return 'speechSynthesis' in window;
}

/**
 * Preloads a Pokemon cry audio file for faster playback
 * Useful for preloading next/previous Pokemon cries
 * @param {string} cryUrl - URL of the cry audio file to preload
 * @returns {Promise<Audio>} Promise that resolves with preloaded audio object
 * @example
 * preloadPokemonCry('https://example.com/pikachu.ogg')
 *   .then(audio => console.log('Cry preloaded successfully'))
 *   .catch(error => console.log('Failed to preload cry'));
 */
export function preloadPokemonCry(cryUrl) {
  return new Promise((resolve, reject) => {
    if (!cryUrl) {
      reject(new Error('No cry URL provided'));
      return;
    }
    
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    
    audio.addEventListener('canplaythrough', () => {
      resolve(audio);
    });
    
    audio.addEventListener('error', (error) => {
      reject(error);
    });
    
    audio.src = cryUrl;
  });
}

// ====================================
// BACKWARD COMPATIBILITY EXPORTS
// ====================================

// Export for main.js compatibility - maps to current Pokemon cry function
export { playCurrentPokemonCry as playPokemonCry };

// Maintain backward compatibility with existing code
export { playCurrentPokemonCry as playPokemonCryLegacy };
export { tryAlternativeCry as tryAlternativeCryLegacy };
export { startReadingEntry as startReadingEntryLegacy };

// Global constants for backward compatibility
export const POKEMON_CRY_VOLUME = DEFAULT_CRY_VOLUME;
export const SPEECH_SYNTH = Synth;

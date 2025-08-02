/**
 * MAIN.JS - Primary Application Entry Point
 * =============================================
 * This is the main JavaScript file for Kolby's Pokédex application.
 * It handles all user interactions, event listeners, and coordinates
 * between different modules to create a cohesive Pokédex experience.
 * 
 * Key Features:
 * - User input handling and validation
 * - Navigation between Pokémon entries
 * - Speech synthesis for Pokédex entries
 * - Responsive design adjustments
 * - Local storage management
 * - Progressive Web App functionality
 * 
 * @author Kolby Landon
 * @version 2.3 (Fixed recall button to never recall same Pokemon)
 * @since 2023
 * @updated 2025-08-02T02:00:00Z
 */

'use strict';

// Import utility functions and constants from helper modules
import { showToast, getElementVisibility, Body, createArray } from './utils/dom-utils.js?v=20250802b';
import { playPokemonCry, startReadingEntry, Synth } from './utils/audio-utils.js?v=20250802b';
import { convertHexToRgba } from './utils/color-utils.js?v=20250802b';
import { 
  STORAGE_KEYS, getStorageItem, setStorageItem, populateLocalStorage, swapCurrentAndLastPokemon
} from './utils/storage-utils.js?v=20250802h';
import { 
  generatePokemon, getRandomPokemon, getDeviceType, 
  applyResponsiveLayout as headerLayout, validateNumericInput as inputCheck,
  validatePokedexNumber as validPokedexNumberCheck,
  ORIGINAL_MAXIMUM_ID as OriginalMaximumId, MAXIMUM_ID as MaximumId
} from './utils/navigation-utils.js?v=20250802b';

// Import API request functions
import { 
  requestType 
} from './requests.js';

// ====================================
// DOM ELEMENT REFERENCES
// ====================================
// These constants store references to frequently accessed DOM elements
// to improve performance and code readability

/** @type {HTMLInputElement} Main search input for Pokémon ID or name */
const Textbox = document.getElementById('pokemon-textbox');

/** @type {HTMLButtonElement} Primary search button */
const GoButton = document.getElementById('go-button');
const GoButtonTop = document.getElementById('go-button-top');

/** @type {HTMLButtonElement} Random Pokémon generator button */
const RandomPokemonButton = document.getElementById('random-pokemon-button');
const RandomPokemonButtonTop = document.getElementById('random-pokemon-button-top');

/** @type {HTMLButtonElement} Navigation button for previous Pokémon */
const PreviousButton = document.getElementById('previous-button');
const PreviousButtonTop = document.getElementById('previous-button-top');

/** @type {HTMLButtonElement} Navigation button for next Pokémon */
const NextButton = document.getElementById('next-button');
const NextButtonTop = document.getElementById('next-button-top');

/** @type {HTMLButtonElement} Audio playback button for Pokémon cries */
const CryButton = document.getElementById('cry-button');
const CryButtonTop = document.getElementById('cry-button-top');

/** @type {HTMLButtonElement} Text-to-speech button for Pokédex entries */
const ReadEntryButton = document.getElementById('read-entry-button');
const ReadEntryButtonTop = document.getElementById('read-entry-button-top');

/** @type {HTMLButtonElement} Button to recall last viewed Pokémon */
const RecallButton = document.getElementById('recall-button');
const RecallButtonTop = document.getElementById('recall-button-top');

/** @type {HTMLButtonElement} Button to clear current display */
const ClearButton = document.getElementById('clear-button');
const ClearButtonTop = document.getElementById('clear-button-top');

/** @type {HTMLElement} Toast notification container */
const Toast = document.getElementById('toast');
const ToastCloseButton = document.getElementById('toast-close-button');

/** @type {HTMLElement} Display elements for Pokémon information */
const NumberHeader = document.getElementById('number-header');
const NameHeader = document.getElementById('name-header');
const PokemonEntryText = document.getElementById('pokedex-entry-text');
const GenusSubHeader = document.getElementById('genus-sub-header');

/** @type {HTMLCanvasElement} Chart.js canvas for stats visualization */
const StatsChart = document.getElementById('stats-chart');

/** @type {HTMLTableElement} Container for Pokémon artwork display */
const ArtworkTable = document.getElementById('artwork-table');

/** @type {Array} Collection of elements that can be hidden/shown */
const HiddenElementsArray = createArray(document.getElementsByClassName('hidden-element'));

/** @type {HTMLElement} Type badge display elements */
const TypeText = document.getElementById('type-text');
const TypeText2 = document.getElementById('type-text-2');

// ====================================
// APPLICATION STATE VARIABLES
// ====================================

/** @type {string|null} Current device type (mobile, tablet, desktop) */
let deviceType = null;

/** @type {number|null} Current Pokémon ID being displayed */
let id = null;

// ====================================
// APPLICATION INITIALIZATION
// ====================================
/**
 * Immediately Invoked Function Expression (IIFE) to initialize the application
 * Sets up event listeners, checks system information, and loads saved data
 */
(() => { 
  // Initialize UI state and system checks
  getElementVisibility(HiddenElementsArray, 'hidden');
  getSystemInformation();
  checkLocalStorageItems();
  loadLastViewedPokemon();
  
  // ====================================
  // BUTTON EVENT LISTENERS
  // ====================================
  // Direct event listeners for better compatibility across browsers
  
  /** Primary search button - handles Pokémon lookup by ID or name */
  GoButton.addEventListener('click', () => {
    buttonClick('Go', true, true);
  });
  
  /** Random Pokémon button - generates a random Pokémon for discovery */
  RandomPokemonButton.addEventListener('click', () => {
    buttonClick('Random', true, true);
  });
  
  /** Previous button - navigates to the previous Pokémon in the Pokédex */
  PreviousButton.addEventListener('click', () => {
    buttonClick('Previous', true, true);
  });
  
  /** Next button - navigates to the next Pokémon in the Pokédex */
  NextButton.addEventListener('click', () => {
    console.log('🔘 [Button Click] Next button clicked');
    buttonClick('Next', true, true);
  });
  
  /** Recall button - loads the last viewed Pokémon from local storage */
  RecallButton.addEventListener('click', () => {
    console.log('🔘 [Button Click] Recall button clicked');
    buttonClick('Recall', true, true);
  });
  
  /** Cry button - plays the Pokémon's cry audio */
  CryButton.addEventListener('click', () => {
    console.log('🔘 [Button Click] Cry button clicked');
    buttonClick('Cry', true, false);
  });
  
  /** Read Entry button - uses text-to-speech for Pokédx entries */
  ReadEntryButton.addEventListener('click', () => {
    console.log('🔘 [Button Click] Read Entry button clicked');
    buttonClick('ReadEntry', false, false);
  });
  
  /** Clear button - resets the display and hides all cards */
  ClearButton.addEventListener('click', () => {
    console.log('🔘 [Button Click] Clear button clicked');
    buttonClick('Clear', true, false);
  });
  
  /** Type badges - clickable elements that could show type information */
  TypeText.addEventListener('click', () => {
    console.log('🔘 [Button Click] Type badge 1 clicked');
    buttonClick('TypeText', true, false);
  });
  TypeText2.addEventListener('click', () => {
    console.log('🔘 [Button Click] Type badge 2 clicked');
    buttonClick('TypeText2', true, false);
  });
  
  /** Toast notification controls */
  ToastCloseButton.addEventListener('click', () => {
    console.log('🔘 [Button Click] Toast close button clicked');
    buttonClick('ToastClose', true, false);
  });
  Toast.addEventListener('click', () => {
    console.log('🔘 [Button Click] Toast notification clicked');
    buttonClick('Toast', true, false);
  });
  
  /** Chart and artwork click handlers - scroll to top for better UX */
  StatsChart.addEventListener('click', () => {
    console.log('🔘 [Click] Stats chart clicked, scrolling to top');
    window.scroll(0, 0);
  });
  ArtworkTable.addEventListener('click', () => {
    console.log('🔘 [Click] Artwork table clicked, scrolling to top');
    window.scroll(0, 0);
  });
  
  // ====================================
  // INPUT EVENT LISTENERS
  // ====================================
  /** Search textbox input validation and handling */
  Textbox.addEventListener('input', handleTextboxInput);
  Textbox.addEventListener('focus', handleTextboxFocus);
  Textbox.addEventListener('blur', handleTextboxBlur);
  Textbox.addEventListener('keydown', handleTextboxKeydown);
  
  // ====================================
  // WINDOW EVENT LISTENERS
  // ====================================
  /** Resize event with throttling to improve performance */
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      getSystemInformation();
    }, 250); // Throttle to 250ms for better performance
  });
  
  // Set initial focus to search input for immediate user interaction
  Textbox.focus();
})();

// ====================================
// INPUT EVENT HANDLER FUNCTIONS
// ====================================

/**
 * Handles input changes in the search textbox
 * Validates input and updates UI state accordingly
 */
function handleTextboxInput() {
  inputCheck(Textbox.value); // Validate input format
  validPokedexNumberCheck(Textbox); // Check if number is within valid range
}

/**
 * Handles focus event on search textbox
 * Clears the input for new user entry
 */
function handleTextboxFocus() {
  Textbox.value = ''; // Clear for new input
  validPokedexNumberCheck(Textbox); // Update validation state
}

/**
 * Handles blur (focus loss) event on search textbox
 * Restores current Pokémon ID if input is empty
 */
function handleTextboxBlur() {
  if (Textbox.value === '') {
    Textbox.value = id; // Restore current ID if empty
    validPokedexNumberCheck(Textbox); // Update validation state
  }
}

/**
 * Handles keydown events in search textbox
 * Enables Enter key submission for better UX
 * @param {KeyboardEvent} event - The keyboard event object
 */
function handleTextboxKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent form submission
    GoButton.click(); // Trigger search
  }
}

// ====================================
// SYSTEM INFORMATION FUNCTIONS
// ====================================

/**
 * Determines and stores system information including device type
 * Updates UI layout based on device capabilities
 * Stores information in localStorage for persistence
 */
function getSystemInformation() {
  deviceType = getDeviceType(); // Detect mobile/tablet/desktop
  setStorageItem('deviceType', deviceType); // Store for future use
  headerLayout(deviceType); // Adjust header layout
  
  // Make device type available globally for other modules
  if (!window.pokemonApp) window.pokemonApp = {};
  window.pokemonApp.deviceType = deviceType;
} //getSystemInformation

// ====================================
// LOCAL STORAGE MANAGEMENT FUNCTIONS
// ====================================

/**
 * Loads the last viewed Pokémon from localStorage
 * Automatically displays it if available, providing continuity between sessions
 */
function loadLastViewedPokemon() {
  const storedId = getStorageItem('id'); // Legacy key support
  if(storedId) {
    id = storedId;
    generatePokemon(id, 'visible', false); // Load last viewed Pokémon
  }
} //loadLastViewedPokemon

/**
 * Checks and validates localStorage items
 * Prevents duplicate entries and manages Pokédex version settings
 */
function checkLocalStorageItems() {
  // Remove duplicate Pokémon entries
  if(localStorage.getItem('currentPokémon') === localStorage.getItem('lastPokémon')) {
    localStorage.removeItem('lastPokémon');
  }
  
  // Handle original vs modern Pokédex mode
  if('originalPokédex' in localStorage && localStorage.getItem('originalPokédex') === 'true') {
    localStorage.setItem('originalPokédex', true);
    localStorage.setItem('maximumId', OriginalMaximumId); // Generation 1 limit
    return;
  } else {
    localStorage.setItem('originalPokédex', false);
    localStorage.setItem('maximumId', MaximumId); // All generations
    return;
  }
} //checkLocalStorageItems

// ====================================
// BUTTON CLICK HANDLER
// ====================================

/**
 * Central button click handler that manages all user interactions
 * Coordinates between different button actions and maintains application state
 * 
 * @param {string} buttonClicked - Identifier for which button was clicked
 * @param {boolean} cancelSynth - Whether to stop text-to-speech synthesis
 * @param {boolean} callGeneratePokemon - Whether to call generatePokemon after processing
 */
function buttonClick(buttonClicked, cancelSynth, callGeneratePokemon) {
  console.log(`🔄 [Button Handler] Processing: ${buttonClicked}, cancelSynth: ${cancelSynth}, callGenerate: ${callGeneratePokemon}`);
  
  let id;
  
  // Stop any ongoing text-to-speech if requested
  if(cancelSynth) {
    console.log('🔇 [Button Handler] Canceling speech synthesis');
    Synth.cancel();
  }
  
  // Handle different button actions
  switch(buttonClicked) {
    case 'Go':
    case 'Enter':
      // Store current Pokémon as last viewed before switching (only if different from new search)
      if(ClearButton.style.display !== 'none') {
        const currentDisplayedId = NumberHeader.innerText ? NumberHeader.innerText.substring(1) : null;
        const newSearchId = Textbox.value;
        
        // Only store if we have a current Pokemon and it's different from the new search
        // If searching for the same Pokemon, preserve the existing LAST_POKEMON for toggle functionality
        if(currentDisplayedId && currentDisplayedId !== newSearchId) {
          setStorageItem(STORAGE_KEYS.LAST_POKEMON, currentDisplayedId);
        }
        // Note: When searching for same Pokemon, we intentionally don't modify LAST_POKEMON
      }
      id = Textbox.value; // Use entered value
      break;
      
    case 'Random':
      // Store current for recall functionality (only if different)
      const currentIdForRandom = NumberHeader.innerText ? NumberHeader.innerText.substring(1) : Textbox.value;
      if(currentIdForRandom && currentIdForRandom !== '') {
        setStorageItem(STORAGE_KEYS.LAST_POKEMON, currentIdForRandom);
      }
      id = getRandomPokemon(); // Generate random ID
      Textbox.value = id;
      break;
      
    case 'Previous':
      // Navigate to previous Pokémon in sequence
      const currentIdForPrev = NumberHeader.innerText ? NumberHeader.innerText.substring(1) : Textbox.value;
      if(currentIdForPrev && currentIdForPrev !== '') {
        setStorageItem(STORAGE_KEYS.LAST_POKEMON, currentIdForPrev);
      }
      id = (parseInt(NumberHeader.innerText.substring(1)) - 1).toString();
      Textbox.value = id;
      break;
      
    case 'Next':
      // Navigate to next Pokémon in sequence
      const currentIdForNext = NumberHeader.innerText ? NumberHeader.innerText.substring(1) : Textbox.value;
      if(currentIdForNext && currentIdForNext !== '') {
        setStorageItem(STORAGE_KEYS.LAST_POKEMON, currentIdForNext);
      }
      id = (parseInt(NumberHeader.innerText.substring(1)) + 1).toString();
      Textbox.value = id;
      break;
      
    case 'Recall':
      const recalledPokemonId = swapCurrentAndLastPokemon();
      
      if(recalledPokemonId) {
        id = recalledPokemonId;
        Textbox.value = id;
        generatePokemon(id, 'visible', false);
      } else {
        showToast('No different Pokémon available to recall.');
      }
      break;
      
    case 'Cry':
      // Play Pokémon's cry audio
      playPokemonCry();
      break;
      
    case 'ReadEntry':
      // Toggle text-to-speech for Pokédex entry
      Synth.speaking ? Synth.cancel() : startReadingEntry(NameHeader.textContent, GenusSubHeader.textContent, PokemonEntryText.textContent);
      break;
      
    case 'Clear':
      // Reset application to initial state
      Textbox.value = '';
      Body.style.background = convertHexToRgba('#ffffff', 1); // Reset background
      setStorageItem(STORAGE_KEYS.LAST_POKEMON, Textbox.value);
      id = null;
      ToastCloseButton.click(); // Hide any active toasts
      console.log('Clearing elements, HiddenElementsArray length:', HiddenElementsArray.length);
      getElementVisibility(HiddenElementsArray, 'hidden'); // Hide all cards
      setStorageItem(STORAGE_KEYS.CURRENT_POKEMON, null); // Clear stored state
      setStorageItem(STORAGE_KEYS.LAST_POKEMON, null);
      setStorageItem('id', null); // Clear legacy id storage
      break;
      
    case 'TypeText':
      // Handle first type badge click - could show type information
      requestType(TypeText.innerText);
      break;
      
    case 'TypeText2':
      // Handle second type badge click - could show type information
      requestType(TypeText2.innerText);
      break;
      
    case 'ToastClose':
    case 'Toast':
      // Return focus to search input when toast is dismissed
      Textbox.focus();
      break;
  }
  
  // Generate Pokémon data if requested (most navigation actions)
  if(callGeneratePokemon) {
    generatePokemon(id, 'visible', false);
  }
  
  // Hide any active toast notifications
  Toast.classList.remove('toast-active');
} //buttonClick

// ====================================
// GLOBAL APPLICATION STATE
// ====================================
/**
 * Make elements globally available to avoid circular dependencies
 * This provides a centralized way for other modules to access UI elements
 * and application state without creating import cycles
 */
window.pokemonApp = {
  // UI Element References
  HiddenElementsArray, 
  Textbox, 
  Toast, 
  
  // Button References
  GoButton, 
  GoButtonTop, 
  RandomPokemonButton, 
  RandomPokemonButtonTop, 
  PreviousButton, 
  PreviousButtonTop, 
  NextButton, 
  NextButtonTop, 
  ReadEntryButton, 
  ReadEntryButtonTop, 
  RecallButton, 
  RecallButtonTop, 
  ClearButton, 
  ClearButtonTop, 
  CryButton, 
  CryButtonTop, 
  
  // Application State
  deviceType
};

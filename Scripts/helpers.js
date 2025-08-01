/**
 * HELPERS.JS - Utility Functions and DOM Manipulation
 * ====================================================
 * This module contains all utility functions for the Pokédex application,
 * including DOM manipulation, data processing, text-to-speech functionality,
 * device detection, and various helper functions for Pokemon data handling.
 * 
 * Key Features:
 * - DOM element caching for improved performance
 * - Text-to-speech synthesis for Pokédex entries
 * - Device type detection for responsive design
 * - Data formatting and validation utilities
 * - Pokemon data display and manipulation functions
 * - Background color management based on Pokemon types
 * - Local storage management utilities
 * 
 * @author Kolby Landon
 * @version 2.0
 * @since 2023
 */

'use strict';

// Import required modules
import { 
  requestAbilityEffect, requestForm, requestHeldItem, requestPokemon, 
} from './requests.js';
import {
  pokemon
} from './pokemon.js';

// ====================================
// DOM ELEMENT CACHING
// ====================================
/**
 * Cache frequently accessed DOM elements for better performance
 * This reduces repeated DOM queries and improves application speed
 */
const DOM_CACHE = {
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
  
  // User interface controls (cached to avoid circular imports)
  textbox: document.getElementById('pokemon-textbox'),
  toast: document.getElementById('toast'),
  goButton: document.getElementById('go-button'),
  randomPokemonButton: document.getElementById('random-pokemon-button'),
  previousButton: document.getElementById('previous-button'),
  nextButton: document.getElementById('next-button'),
  recallButton: document.getElementById('recall-button'),
  readEntryButton: document.getElementById('read-entry-button'),
  clearButton: document.getElementById('clear-button')
};

// ====================================
// BACKWARDS COMPATIBILITY ALIASES
// ====================================
/**
 * Maintain backwards compatibility with existing code
 * These aliases provide the same interface as before the DOM_CACHE refactor
 */
const Synth = DOM_CACHE.synth;
const Body = DOM_CACHE.body;
const TypeText = DOM_CACHE.typeText;
const TypeText2 = DOM_CACHE.typeText2;
const TypeHeader = DOM_CACHE.typeHeader;
const StatsChart = DOM_CACHE.statsChart;
const AbilitiesUnorderedList = DOM_CACHE.abilitiesUnorderedList;
const AbilitiesHeader = DOM_CACHE.abilitiesHeader;
const HeldItemsUnorderedList = DOM_CACHE.heldItemsUnorderedList;
const FormsUnorderedList = DOM_CACHE.formsUnorderedList;
const HeldItemsHeader = DOM_CACHE.heldItemsHeader;
const FormsHeader = DOM_CACHE.formsHeader;
const ToastText = DOM_CACHE.toastText;

// Button references for UI interaction
const Textbox = DOM_CACHE.textbox;
const Toast = DOM_CACHE.toast;
const GoButton = DOM_CACHE.goButton;
const RandomPokemonButton = DOM_CACHE.randomPokemonButton;
const PreviousButton = DOM_CACHE.previousButton;
const NextButton = DOM_CACHE.nextButton;
const RecallButton = DOM_CACHE.recallButton;
const ReadEntryButton = DOM_CACHE.readEntryButton;
const ClearButton = DOM_CACHE.clearButton;

// ====================================
// APPLICATION CONSTANTS
// ====================================
/** @type {string} Standard text color for most Pokemon information */
const TextColor = 'rgba(98, 98, 98, 0.95)';

/** @type {string} Special color for hidden abilities to distinguish them */
const HiddenAbilityTextColor = 'rgba(255, 111, 97, 0.95)';

/** @type {string} Transparent color for background elements */
const TransparentColor = 'rgba(0, 0, 0, 0)';

/** @type {number} Minimum valid Pokédex number */
const MinimumId = 1;

/** @type {number} Maximum Pokédex number for original 151 Pokemon */
const OriginalMaximumId = 151;

/** @type {number} Maximum Pokédex number including all generations */
const MaximumId = 1025;

// ====================================
// POKEMON DATA DISPLAY FUNCTIONS
// ====================================

/**
 * Generates and displays the abilities list for a Pokemon
 * Creates clickable list items with ability descriptions and proper styling
 * @param {Array} abilities - Array of ability objects from Pokemon API
 */
function getAbilityList(abilities) {
  // Set appropriate header text based on number of abilities
  AbilitiesHeader.innerText = abilities.length === 1 ? 'Ability:' : 'Abilities:';
  AbilitiesUnorderedList.innerHTML = `<ul id='abilities-unordered-list' class='list-bulleted'></ul>`;
  
  // Use DocumentFragment for better DOM performance
  const fragment = document.createDocumentFragment();
  
  abilities.forEach((ability, index) => {
    const ListItem = document.createElement('li');
    ListItem.id = `flavor-text-${index + 1}`;
    ListItem.classList.add('flavor-text');
    
    // Format ability name with proper capitalization
    let name = capitalizeAfterHyphen(capitalizeFirstLetter(ability.ability.name));
    if (ability.is_hidden) {
      name += ' (Hidden)'; // Mark hidden abilities
    }
    
    // Request and display ability effect description
    requestAbilityEffect(ability.ability.url, ListItem, name);
    
    // Apply different colors for hidden vs normal abilities
    ListItem.style.color = ability.is_hidden === false ? TextColor : HiddenAbilityTextColor;
    fragment.appendChild(ListItem);
  });
  
  // Add all ability items to DOM at once for better performance
  AbilitiesUnorderedList.appendChild(fragment);
} //getAbilityList

/**
 * Determines which Pokédex version to use (original 151 or all Pokemon)
 * @param {string} showOnlyOriginalPokemon - String indicating preference for original Pokédex
 * @returns {number} Maximum ID limit for the selected Pokédex version
 */
function getPokedexType(showOnlyOriginalPokemon) {
  if(showOnlyOriginalPokemon === 'true') {
    return MaximumId = OriginalMaximumId; // Limit to original 151
  } else {
    return MaximumId = 1025; // Include all generations
  }
} //getPokedexType

/**
 * Generates and displays the held items list for a Pokemon
 * Handles cases where Pokemon have no held items by hiding the section
 * @param {Array} heldItems - Array of held item objects from Pokemon API
 */
function getHeldItemList(heldItems) {
  // Hide section if no held items exist
  if (heldItems.length === 0) {
    HeldItemsHeader.style.display = 'none';
    HeldItemsUnorderedList.style.display = 'none';
    return;
  }
  
  // Show section and set appropriate header text
  HeldItemsHeader.innerText = heldItems.length === 1 ? 'Held Item:' : 'Held Items:';
  HeldItemsUnorderedList.innerHTML = `<ul id='held-items-unordered-list' class='list-bulleted'></ul>`;
  HeldItemsHeader.style.display = 'block';
  HeldItemsUnorderedList.style.display = 'block';
  
  // Use DocumentFragment for better DOM performance
  const fragment = document.createDocumentFragment();
  
  heldItems.forEach((heldItem, index) => {
    const ListItem = document.createElement('li');
    ListItem.id = `held-item-text-${index + 1}`;
    ListItem.classList.add('held-item-text');
    
    // Format item name and request details from API
    requestHeldItem(heldItem.item.url, ListItem, capitalizeAfterHyphen(capitalizeFirstLetter(heldItem.item.name)));
    ListItem.style.color = TextColor;
    fragment.appendChild(ListItem);
  });
  
  // Add all held item elements to DOM at once
  HeldItemsUnorderedList.appendChild(fragment);
} //getHeldItemList

/**
 * Generates and displays the alternate forms list for a Pokemon
 * Hides the section if Pokemon only has one form (the default form)
 * @param {Array} forms - Array of form objects from Pokemon API
 */
function getFormList(forms) {
  // Hide section if only default form exists
  if (forms.length === 1) {
    FormsHeader.style.display = 'none';
    FormsUnorderedList.style.display = 'none';
    return;
  }
  
  // Show section and prepare for form display
  FormsHeader.style.display = 'block';
  FormsUnorderedList.style.display = 'block';
  FormsUnorderedList.innerHTML = `<ul id='forms-unordered-list' class='list-bulleted'></ul>`;
  
  // Use DocumentFragment for better DOM performance
  const fragment = document.createDocumentFragment();
  
  forms.forEach((form, index) => {
    const ListItem = document.createElement('li');
    ListItem.id = `forms-text-${index + 1}`;
    ListItem.classList.add('form-text');
    
    // Request form details and make clickable
    requestForm(form.pokemon.url, ListItem);
    ListItem.style.color = TextColor;
    
    // Add click event with optimized URL parsing for Pokemon ID extraction
    ListItem.addEventListener('click', () => {
      const pokemonId = form.pokemon.url.split('/').slice(-2, -1)[0];
      generatePokemon(pokemonId, 'visible', true);
    });
    
    fragment.appendChild(ListItem);
  });
  
  // Add all form elements to DOM at once
  FormsUnorderedList.appendChild(fragment);
} //getFormList

/**
 * Calculates the total base stat value for a Pokemon
 * Sums all individual base stats (HP, Attack, Defense, etc.)
 * @param {Array} stats - Array of stat objects from Pokemon API
 * @returns {number} Total of all base stat values
 */
function getStatTotal(stats) {
  let statTotal = 0;
  
  // Sum all base stat values
  stats.forEach(stat => {
    statTotal += stat.base_stat;
  });
  
  return statTotal;
} //getStatTotal

/**
 * Extracts and formats Pokédex entry text from flavor text entries
 * Filters for English entries and cleans up formatting/whitespace
 * @param {Array} flavorTextEntries - Array of flavor text objects from Pokemon species API
 * @returns {string} Formatted Pokédex entry text
 */
function getPokedexEntry(flavorTextEntries) {
  // RegEx pattern to remove various Unicode whitespace and control characters
  const RegEx = /[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000\u000c\n]/g;
  let entriesArray = [];
  let entry = ``;
  
  // Extract English language entries
  for(let index in flavorTextEntries) {
    if(flavorTextEntries[index].language.name === 'en') {
      entriesArray.push(flavorTextEntries[index].flavor_text);
    }
  }
  
  // Select random entry from available English entries
  entry = entriesArray[~~(Math.random() * entriesArray.length)].replaceAll(RegEx, ' ');
  
  // Fix common formatting issues with Pokemon name
  if(entry.includes('POKéMON')) {
    entry = entry.replaceAll('POKéMON', 'Pokémon');
  }
  
  return entry;
} //getPokedexEntry

/**
 * Extracts the genus (species classification) for a Pokemon
 * Filters for English language genus entries
 * @param {Array} genera - Array of genus objects from Pokemon species API
 * @returns {string} English genus classification (e.g., "Seed Pokémon")
 */
function getGenus(genera) {
  // Find and return English genus entry
  for(let index in genera) {
    if(genera[index].language.name === 'en') {
      return genera[index].genus;
    }
  }
} //getGenus

/**
 * Converts Pokemon height from decimeters to feet and inches
 * Handles both tall Pokemon (feet + inches) and short Pokemon (inches only)
 * @param {number} height - Height in decimeters from Pokemon API
 * @returns {string} Formatted height string (e.g., "5'7\"" or "11\"")
 */
function getHeight(height) {
  // Convert decimeters to inches, then calculate feet and remaining inches
  let feet = ~~(Math.round(height * 3.93701) / 12); // Floor division for feet
  let inches = Math.round(height * 3.93701) % 12;   // Remainder for inches
  
  // Format based on whether Pokemon is tall enough to show feet
  return feet > 0 ? `${feet}'${inches}"` : `${inches}"`;
} //getHeight

/**
 * Converts Pokemon weight from hectograms to pounds
 * @param {number} weight - Weight in hectograms from Pokemon API  
 * @returns {string} Weight in pounds formatted to 1 decimal place
 */
function getWeight(weight) {
  // Convert hectograms to pounds (1 hectogram = 0.220462 pounds)
  return Math.round((weight / 4.536), 2).toFixed(1);
} //getWeight

// ====================================
// STRING FORMATTING UTILITIES
// ====================================

/**
 * Handles special punctuation and formatting for Pokemon names
 * Corrects common naming conventions and special characters
 * @param {string} name - Raw Pokemon name from API
 * @returns {string} Properly formatted Pokemon name with correct punctuation
 */
function punctuationNameCheck(name) {
  // Apply hyphen capitalization first
  name = capitalizeAfterHyphen(name);
  
  // Handle specific Pokemon name formatting cases
  return name.includes('mr-') ? name.replace('mr-', 'Mr. ') :      // Mr. Mime (121) / Mr. Rime (866)
    name.includes('-Jr') ? name.replace('-Jr', ' Jr.') :           // Mime Jr. (439)
    name.includes('-Phd') ? name.replace('-Phd', ' Ph.D.') :       // Pikachu Ph.D. (25)
    name.includes('hd') ? name.replace('hd', `h'd`) :              // Farfetch'd (83) / Sirfetch'd (865)
    name.includes('o-O') ? name.replace('o-O', 'o-o') :            // Kommo-o (784)
    name;
} //punctuationNameCheck

// ====================================
// TYPE SYSTEM AND VISUAL STYLING
// ====================================

/**
 * Processes Pokemon types and applies visual styling to the interface
 * Sets type badges, background gradients, and handles single vs dual types
 * @param {Array} types - Array of type objects from Pokemon API
 * @returns {Array} Array containing hex color values for both types
 */
function getTypes(types) {
  // Process first type (always present)
  const FirstType = types[0].type.name;
  let firstColor = getTypeColor(FirstType);
  let firstBackgroundColor = convertHexToRgba(firstColor, 0.3);
  
  // Set first type badge styling
  TypeText.innerText = FirstType;
  TypeText.style.backgroundColor = convertHexToRgba(firstColor, 0.6);
  
  let secondColor = null;
  let secondBackgroundColor = null;
  
  // Handle single type Pokemon
  if(types.length === 1) {
    TypeHeader.innerText = 'Type:';
    TypeText2.hidden = true;
    secondColor = firstColor;           // Use same color for gradient
    secondBackgroundColor = firstBackgroundColor;
  } else {
    // Handle dual-type Pokemon
    const SecondType = types[1].type.name;
    secondColor = getTypeColor(SecondType);
    secondBackgroundColor = convertHexToRgba(secondColor, 0.3);
    
    // Set second type badge styling
    TypeText2.innerText = SecondType;
    TypeText2.style.backgroundColor = convertHexToRgba(secondColor, 0.6);
    TypeHeader.innerText = 'Types:';
    TypeText2.hidden = false;
  }
  
  // Apply radial gradient background based on type colors
  Body.style.background = `radial-gradient(circle, ${firstBackgroundColor} 0%, ${secondBackgroundColor} 100%)`;
  
  return [firstColor, secondColor];
} //getTypes

// ====================================
// UTILITY FUNCTIONS
// ====================================

/**
 * Generates a random Pokemon ID within the current Pokédex range
 * @returns {number} Random Pokemon ID between 1 and MaximumId
 */
function getRandomPokemon() {
  return ~~(Math.random() * MaximumId) + 1; // Bitwise floor for performance
} //getRandomPokemon

/**
 * Capitalizes the first letter after each hyphen in a string
 * Used for proper Pokemon name formatting (e.g., "ho-oh" becomes "Ho-Oh")
 * @param {string} hyphenatedString - String potentially containing hyphens
 * @returns {string} String with proper capitalization after hyphens
 */
function capitalizeAfterHyphen(hyphenatedString) {
  const RegEx = /\-[a-z]/g; // Match hyphen followed by lowercase letter
  
  return hyphenatedString.replaceAll(RegEx, match => {
    return match.toUpperCase(); // Convert matched portion to uppercase
  });
} //capitalizeAfterHyphen

/**
 * Validates numeric input and removes non-digit characters
 * Prevents users from entering invalid characters in Pokemon ID input
 * @param {string} input - User input string to validate
 */
function inputCheck(input) {
  const RegEx = /\D/g; // Match any non-digit character
  
  // Remove last character if it's not a digit
  if(RegEx.test(input)) {
    Textbox.value = input.slice(0, -1);
  }
} //inputCheck

// ====================================
// COLOR UTILITY FUNCTIONS
// ====================================

/**
 * Converts hexadecimal color values to RGBA format with specified alpha
 * @param {string} color - Hexadecimal color value (e.g., "#FF0000")
 * @param {number} alpha - Alpha transparency value (0.0 to 1.0)
 * @returns {string} RGBA color string (e.g., "rgba(255, 0, 0, 0.5)")
 */
function convertHexToRgba(color, alpha) {
  // Extract RGB components using bitwise operations for performance
  let r = (`0x${color.substring(1).split('').join('')}` >> 16) & 255; // Red component
  let g = (`0x${color.substring(1).split('').join('')}` >> 8) & 255;  // Green component  
  let b = (`0x${color.substring(1).split('').join('')}`) & 255;       // Blue component
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
} //convertHexToRgba

/**
 * Returns the associated color for each Pokemon type
 * Used for type badges and background gradient generation
 * @param {string} type - Pokemon type name (e.g., "fire", "water")
 * @returns {string} Hexadecimal color value for the specified type
 */
function getTypeColor(type) {
  // Pokemon type color palette following official game colors
  const Types = {
    'normal': '#ADA480',     // Light brown/tan
    'fighting': '#C22F26',   // Red
    'flying': '#B49AF6',     // Light purple
    'poison': '#A43FA4',     // Purple
    'ground': '#DEBE63',     // Yellow-brown
    'rock': '#B49E38',       // Brown
    'bug': '#A8B531',        // Yellow-green
    'ghost': '#6E5391',      // Dark purple
    'steel': '#B8B5CF',      // Light gray
    'fire': '#F07D33',       // Orange-red
    'water': '#6D88F8',      // Blue
    'grass': '#81CB5B',      // Green
    'electric': '#E9D436',   // Yellow
    'psychic': '#FF598D',    // Pink
    'ice': '#9AD9DA',        // Light blue
    'dragon': '#723EFC',     // Purple-blue
    'fairy': '#E1A4E1',      // Light pink
    'dark': '#2B1E16',       // Dark brown
  };
  
  return Types[type];
} //getTypeColor

// ====================================
// CHART AND DATA UTILITIES
// ====================================

/**
 * Finds the largest stat value and rounds to nearest 25 for chart scaling
 * Ensures chart axes have appropriate maximum values for stat visualization
 * @param {Array} statsArray - Array of stat values
 * @returns {number} Rounded maximum value for chart scaling
 */
function getLargestStat(statsArray) {
  // Find maximum stat value and round up to nearest 25
  return Math.round(statsArray.reduce((stat, max) => {
    return stat > max ? stat : max;
  }, 0) / 25) * 25;
} //getLargestStat

/**
 * Converts HTMLCollection or NodeList to a standard Array
 * Enables use of array methods on DOM element collections
 * @param {HTMLCollection|NodeList} elements - Collection of DOM elements
 * @returns {Array} Standard JavaScript array of elements
 */
function createArray(elements) {
  // Use Array.from for better performance than for-in loop
  return Array.from(elements);
} //createArray

// ====================================
// DOM MANIPULATION AND UI UTILITIES
// ====================================

/**
 * Sets visibility for arrays of elements with performance optimization and speech cancellation
 * Cancels any active speech synthesis and uses requestAnimationFrame for smooth DOM updates
 * @param {Array} elements - Array of DOM elements to modify
 * @param {string} visibility - CSS visibility value ("visible" or "hidden")
 */
function getElementVisibility(elements, visibility) {
  // Cancel any ongoing text-to-speech to prevent conflicts
  Synth.cancel();
  
  if (Array.isArray(elements)) {
    // Use requestAnimationFrame for better performance when manipulating many elements
    requestAnimationFrame(() => {
      elements.forEach(element => {
        if (element && element.style !== undefined) {
          element.style.visibility = visibility;
        }
      });
    });
  }
} //getElementVisibility

/**
 * Controls navigation button visibility based on current Pokemon ID and constraints
 * Hides Previous button at minimum ID, Next button at maximum ID
 * @param {number} id - Current Pokemon ID
 * @param {boolean} hasGenderDifferences - Whether Pokemon has gender differences (unused parameter)
 */
function makeButtonsDisappear(id, hasGenderDifferences) {
  // Show/hide Previous button based on minimum ID boundary
  id !== MinimumId ? PreviousButton.style.display = 'inline-block' : PreviousButton.style.display = 'none';
  
  // Show/hide Next button based on maximum ID boundary  
  id !== MaximumId ? NextButton.style.display = 'inline-block' : NextButton.style.display = 'none';
  
  // Early return if no last Pokemon stored
  if(localStorage.getItem('lastPokémon') === null) {
    return;
  }
  
  // Show/hide Recall button based on stored Pokemon data
  localStorage.getItem('lastPokémon').length !== 0 ? RecallButton.style.display = 'inline-block' : RecallButton.style.display = 'none';
} //makeButtonsDisappear

// ====================================
// LOCAL STORAGE AND DATA PERSISTENCE  
// ====================================

/**
 * Stores current Pokemon data and timestamp in browser local storage
 * Also initiates geolocation capture for location-based features
 * @param {number} id - Pokemon ID to store as current Pokemon
 */
function populateLocalStorage(id) {
  localStorage.setItem('currentPokémon', id);
  localStorage.setItem('dateTime', getDateTime());
  getGeoLocation(); // Capture current location
} //populateLocalStorage

/**
 * Generates formatted timestamp for data persistence
 * @returns {string} Formatted date and time string
 */
function getDateTime() {
  const Now = new Date();
  return `${Now.getFullYear()}/${Now.getMonth() - 1}/${Now.getDate()} ${Now.getHours()}:${Now.getMinutes()}:${Now.getSeconds()}`;
} //getDateTime

/**
 * Initiates geolocation request for location-based features
 * Handles both success and error scenarios
 */
function getGeoLocation() {
  navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);
} //getGeoLocation

/**
 * Success callback for geolocation request
 * Stores coordinates in local storage for location-based features
 * @param {GeolocationPosition} position - Geolocation position object
 */
function onGeoSuccess(position) {
  const { latitude, longitude } = position.coords;
  localStorage.setItem('coordinates', `${latitude}, ${longitude}`);
} //onGeoSuccess

/**
 * Error callback for geolocation request
 * Stores error message when location access fails
 */
function onGeoError() {
  localStorage.setItem('coordinates', 'Failed to get your location!');
} //onGeoError

// ====================================
// POKEMON GENERATION AND VALIDATION
// ====================================

/**
 * Validates Pokemon ID and initiates Pokemon data request
 * Handles ID validation logic and error messaging
 * @param {number} id - Pokemon ID to generate
 * @param {string} visibility - Visibility state for generated Pokemon
 * @param {boolean} skipIdValidation - Whether to skip ID boundary validation
 */
function generatePokemon(id, visibility, skipIdValidation) {
  // Handle normal validation path
  if(skipIdValidation === false && (id >= MinimumId || id <= MaximumId)) {
    requestPokemon(id, visibility);
    Textbox.style.color = TextColor; // Reset input color on success
    return;
  } else if(skipIdValidation === true) {
    // Handle forced generation (for forms, evolutions, etc.)
    requestPokemon(id, visibility);
    Textbox.style.color = TextColor;
    return;
  }
  
  // Show error for invalid ID
  showToast('Please enter a valid Pokédex number');
} //generatePokemon

/**
 * Displays toast notification with specified message
 * Activates toast animation and schedules automatic dismissal
 * @param {string} text - Message to display in toast notification
 */
function showToast(text) {
  ToastText.innerText = text;
  Toast.classList.add('toast-active');
  Textbox.focus(); // Return focus to input field
} //showToast

// ====================================
// AUDIO FEATURES
// ====================================

/**
 * Plays Pokemon cry audio with comprehensive error handling and fallback options
 * Includes loading states, alternative audio sources, and user feedback
 */
function playPokemonCry() {
  // Validate Pokemon data availability
  if (!pokemon || !pokemon.cry) {
    console.warn('No cry audio available for this Pokémon');
    showToast('Cry audio not available for this Pokémon');
    return;
  }

  // Get cry button elements for state management
  const cryButton = document.getElementById('cry-button');
  const cryButtonTop = document.getElementById('cry-button-top');
  const originalHTML = cryButtonTop.innerHTML;
  
  // Show loading state with spinning icon
  cryButtonTop.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  cryButton.disabled = true;
  cryButton.classList.add('loading');

  try {
    const audio = new Audio();
    
    // Function to reset button state
    function resetButtonState() {
      cryButtonTop.innerHTML = originalHTML;
      cryButton.disabled = pokemon.cry ? false : true;
      cryButton.classList.remove('loading');
    }
    
    // Add comprehensive error handling
    audio.addEventListener('error', (e) => {
      console.error('Error loading Pokémon cry:', e);
      resetButtonState();
      tryAlternativeCry(); // Attempt fallback sources
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
    audio.volume = 0.7;                    // Set to 70% volume
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
  }
}

/**
 * Attempts to play Pokemon cry using alternative audio sources
 * Fallback function when primary cry source fails
 */
function tryAlternativeCry() {
  if (!pokemon || !pokemon.id) return;
  
  const cryButton = document.getElementById('cry-button');
  const cryButtonTop = document.getElementById('cry-button-top');
  
  // Alternative cry URLs from various Pokemon audio databases
  const alternativeUrls = [
    `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon.id}.ogg`,
    `https://pokemoncries.com/cries/${pokemon.id}.mp3`,
    `https://play.pokemonshowdown.com/audio/cries/${pokemon.name.toLowerCase()}.mp3`
  ];
  
  console.log('Trying alternative cry sources...');
  showToast('Trying alternative audio sources...');
  
  let currentIndex = 0;
  
  // Recursive function to try each alternative source
  function tryNext() {
    if (currentIndex >= alternativeUrls.length) {
      // All sources failed - disable cry feature
      showToast('No working cry audio found for this Pokémon');
      cryButtonTop.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
      cryButton.disabled = true;
      cryButton.classList.add('cry-unavailable');
      return;
    }
    
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.volume = 0.7;
    
    audio.addEventListener('error', () => {
      currentIndex++;
      tryNext(); // Try next source on error
    });
    
    audio.addEventListener('canplay', () => {
      audio.play()
        .then(() => {
          showToast(`Playing ${capitalizeFirstLetter(pokemon.name)}'s cry! 🔊`);
          cryButtonTop.innerHTML = `<i class="fa-solid fa-play"></i>`;
          cryButton.disabled = false;
          cryButton.classList.remove('cry-unavailable');
          
          audio.addEventListener('ended', () => {
            cryButtonTop.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
          });
        })
        .catch(() => {
          currentIndex++;
          tryNext(); // Try next source on play error
        });
    });
    
    audio.src = alternativeUrls[currentIndex];
  }
  
  tryNext();
} //playPokemonCry

/**
 * Initiates text-to-speech reading of Pokemon entry information
 * Reads Pokemon name, genus, and Pokédex entry using Web Speech API
 * @param {string} name - Pokemon name to announce
 * @param {string} genus - Pokemon genus classification
 * @param {string} entry - Pokédex entry text to read
 */
function startReadingEntry(name, genus, entry) {
  // Queue speech synthesis utterances in sequence
  Synth.speak(new SpeechSynthesisUtterance(name));
  Synth.speak(new SpeechSynthesisUtterance(`The ${genus}`));
  Synth.pause();  // Brief pause for better flow
  Synth.resume();
  Synth.speak(new SpeechSynthesisUtterance(entry));
} //startReadingEntry

// ====================================
// DEVICE DETECTION AND RESPONSIVE UI
// ====================================

/**
 * Detects user device type for responsive UI optimization
 * Uses user agent string analysis to determine device category
 * @returns {string} Device type: "desktop", "tablet", or "mobile"
 */
function getDeviceType() {
  const Agent = navigator.userAgent;
  
  // Regular expressions for device detection
  const RegExTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i;
  const RegExMobile = /Mobile|iP(hone|od)|Android|Blackberry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i;
  
  // Return device type based on user agent matching
  if(RegExTablet.test(Agent)) {
    return 'tablet';
  } else if(RegExMobile.test(Agent)) {
    return 'mobile';
  }
  return 'desktop';
} //getDeviceType

/**
 * Button configuration templates for different device types
 * Optimizes button content and icons based on screen size and interaction method
 */
const BUTTON_TEMPLATES = {
  mobile: {
    go: `<span id='go-button-top' class='button-top'><i class='fa-solid fa-search'></i></span>`,
    random: `<span id='random-pokemon-button-top' class='button-top'><i class='fa-solid fa-shuffle'></i></span>`,
    previous: `<span id='previous-button-top' class='button-top'><i class='fa-solid fa-chevron-left'></i></span>`,
    next: `<span id='next-button-top' class='button-top'><i class='fa-solid fa-chevron-right'></i></span>`,
    readEntry: `<span id='read-entry-button-top' class='button-top'><i class='fa-solid fa-book-open'></i></span>`,
    clear: `<span id='clear-button-top' class='button-top'><i class='fa-solid fa-xmark'></i></span>`
  },
  tablet: {
    go: `<span id='go-button-top' class='button-top'><i class='fa-solid fa-search'></i> Search</span>`,
    random: `<span id='random-pokemon-button-top' class='button-top'><i class='fa-solid fa-shuffle'></i> Random</span>`,
    previous: `<span id='previous-button-top' class='button-top'><i class='fa-solid fa-chevron-left'></i></span>`,
    next: `<span id='next-button-top' class='button-top'><i class='fa-solid fa-chevron-right'></i></span>`,
    readEntry: `<span id='read-entry-button-top' class='button-top'><i class='fa-solid fa-book-open'></i></span>`,
    clear: `<span id='clear-button-top' class='button-top'><i class='fa-solid fa-xmark'></i></span>`
  },
  desktop: {
    go: `<span id='go-button-top' class='button-top'><i class='fa-solid fa-search'></i> Search</span>`,
    random: `<span id='random-pokemon-button-top' class='button-top'><i class='fa-solid fa-shuffle'></i> Random</span>`,
    previous: `<span id='previous-button-top' class='button-top'><i class='fa-solid fa-chevron-left'></i></span>`,
    next: `<span id='next-button-top' class='button-top'><i class='fa-solid fa-chevron-right'></i></span>`,
    readEntry: `<span id='read-entry-button-top' class='button-top'><i class='fa-solid fa-book-open'></i></span>`,
    clear: `<span id='clear-button-top' class='button-top'><i class='fa-solid fa-xmark'></i></span>`
  }
};

/**
 * Applies device-specific button layouts and content
 * Optimizes UI elements based on detected device type
 * @param {string} deviceType - Device type from getDeviceType()
 */
function headerLayout(deviceType) {
  const templates = BUTTON_TEMPLATES[deviceType] || BUTTON_TEMPLATES.desktop;
  
  // Apply button templates based on device type
  if (deviceType === 'mobile') {
    // Mobile: Icon-only buttons for space efficiency
    GoButton.innerHTML = templates.go;
    RandomPokemonButton.innerHTML = templates.random;
    PreviousButton.innerHTML = templates.previous;
    NextButton.innerHTML = templates.next;
    ReadEntryButton.innerHTML = templates.readEntry;
    ClearButton.innerHTML = templates.clear;
  } else if (deviceType === 'tablet') {
    // Tablet: Icons with text for some buttons
    GoButton.innerHTML = templates.go;
    RandomPokemonButton.innerHTML = templates.random;
    PreviousButton.innerHTML = templates.previous;
    NextButton.innerHTML = templates.next;
    ReadEntryButton.innerHTML = templates.readEntry;
    ClearButton.innerHTML = templates.clear;
  } else {
    // Desktop: Full text labels with icons
    GoButton.innerHTML = templates.go;
    RandomPokemonButton.innerHTML = templates.random;
    PreviousButton.innerHTML = templates.previous;
    NextButton.innerHTML = templates.next;
    ReadEntryButton.innerHTML = templates.readEntry;
    ClearButton.innerHTML = templates.clear;
  }
} //headerLayout

// ====================================
// INPUT VALIDATION UTILITIES
// ====================================

/**
 * Validates Pokédex number input and provides visual feedback
 * Changes input field color based on validity of entered Pokemon ID
 * @returns {string} Color value applied to input field
 */
function validPokedexNumberCheck() {
  return (Textbox.value < MinimumId || Textbox.value > MaximumId)
    ? Textbox.style.color = HiddenAbilityTextColor  // Red for invalid
    : Textbox.style.color = TextColor;              // Normal for valid
} //validPokedexNumberCheck

/**
 * Capitalizes the first letter of a string
 * @param {string} string - String to capitalize
 * @returns {string} String with first letter capitalized
 */
function capitalizeFirstLetter(string) {
  return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
} //capitalizeFirstLetter

export {
  getStatTotal, getPokedexEntry, getElementVisibility, playPokemonCry, tryAlternativeCry,
  convertHexToRgba, getHeight, getWeight, getTypes, punctuationNameCheck,
  getLargestStat, createArray, generatePokemon, makeButtonsDisappear,
  startReadingEntry, getAbilityList, getGenus, getRandomPokemon, inputCheck,
  headerLayout, getDeviceType, getHeldItemList, showToast, getFormList,
  capitalizeFirstLetter, populateLocalStorage, validPokedexNumberCheck, getPokedexType,
  TextColor, HiddenAbilityTextColor, StatsChart, Synth, MinimumId, OriginalMaximumId,
  MaximumId, TransparentColor, Body,
};
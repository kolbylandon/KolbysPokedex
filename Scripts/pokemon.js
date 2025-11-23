/**
 * POKEMON.JS - Pokemon Data Processing and Display Management
 * ===========================================================
 * 
 * This module handles the processing and display of Pokemon data retrieved
 * from the PokeAPI. It manages the population of the UI with Pokemon information,
 * artwork display, stats visualization, and responsive design adjustments.
 * 
 * Key Features:
 * - Complete Pokemon data object creation and management
 * - Responsive artwork display with default and shiny variants
 * - Dynamic UI population based on Pokemon characteristics
 * - Stats chart generation and visualization
 * - Device-specific layout optimizations
 * - Audio cry button management and functionality
 * - Generation detection and classification
 * 
 * Dependencies:
 * - helpers.js: Utility functions for data processing and UI manipulation
 * - statsChart.js: Chart.js integration for Pokemon stats visualization
 * 
 * @author Kolby Landon
 * @version 2.0
 * @since 2023
 */

'use strict';

// ====================================
// MODULE IMPORTS
// ====================================
import { getElementVisibility, showToast } from './utils/dom-utils.js?v=20250801i';
import { 
  getAbilityList, getFormList, getGenus, getHeight, getHeldItemList, 
  getLargestStat, getPokedexEntry, getStatTotal, getTypes, getWeight,
  punctuationNameCheck, capitalizeFirstLetter
} from './utils/data-utils.js?v=20250801i';
import { convertHexToRgba } from './utils/color-utils.js?v=20250801i';
import { populateLocalStorage } from './utils/storage-utils.js?v=20250802h';
import { updateNavigationButtons as makeButtonsDisappear, getDeviceType } from './utils/navigation-utils.js?v=20250801i';
import { displayStatsChart, } from './statsChart.js';
import { startMatrixEffect, stopMatrixEffect } from './matrix-bg.js';
import { showSnowIfBabyOrIce } from './particles.js';

// ====================================
// DOM ELEMENT REFERENCES
// ====================================
// Get references from DOM directly to avoid circular dependencies with main.js

/** @type {Array<HTMLElement>} All elements that can be hidden/shown during Pokemon display */
const HiddenElementsArray = Array.from(document.getElementsByClassName('hidden-element'));

/** @type {HTMLButtonElement} Button for playing Pokemon cry audio */
const CryButton = document.getElementById('cry-button');
const CryButtonTop = document.getElementById('cry-button-top');

// ====================================
// DEVICE DETECTION UTILITY
// ====================================

// ====================================
// POKEMON DISPLAY ELEMENT REFERENCES
// ====================================

/** @type {HTMLElement} Pokemon number display header */
const NumberHeader = document.getElementById('number-header');

/** @type {HTMLElement} Pokemon name display header */
const NameHeader = document.getElementById('name-header');

/** @type {HTMLElement} Pokemon genus/species subtitle */
const GenusSubHeader = document.getElementById('genus-sub-header');

/** @type {HTMLElement} Generation information display */
const GenerationText = document.getElementById('generation-text');

/** @type {HTMLElement} Pokédex entry flavor text display */
const PokedexEntryText = document.getElementById('pokedex-entry-text');

/** @type {HTMLElement} Height measurement display */
const HeightText = document.getElementById('height-text');

/** @type {HTMLElement} Weight measurement display */
const WeightText = document.getElementById('weight-text');

/** @type {HTMLElement} Base stat total display */
const StatsText = document.getElementById('stats-text');

/** @type {HTMLImageElement} Default (normal) Pokemon artwork display */
const DefaultArtworkElement = document.getElementById('default-artwork');

/** @type {HTMLImageElement} Shiny Pokemon artwork display */
const ShinyArtworkElement = document.getElementById('shiny-artwork');

// ====================================
// POKEMON ARTWORK URL CONSTANTS
// ====================================

/** @type {string} Base URL for default Pokemon official artwork from PokeAPI sprites */
const DefaultArtworkUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';

/** @type {string} Base URL for shiny Pokemon official artwork from PokeAPI sprites */
const ShinyArtworkUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/';

// ====================================
// GLOBAL POKEMON DATA OBJECT
// ====================================

/** @type {Object|null} Current Pokemon data object containing all processed information */
let pokemon = null;

// ====================================
// SPRITE DISPLAY STATE
// ====================================

/** @type {string} Current sprite display state - 'default', 'alternate', or 'artwork' */
let currentSpriteState = 'artwork';

// ====================================
// MAIN PAGE POPULATION FUNCTION
// ====================================

/**
 * Primary function for populating the page with Pokemon data
 * Processes API responses, creates Pokemon object, and updates all UI elements
 * @param {Object} pokemonResponse - Raw Pokemon data from PokeAPI /pokemon/ endpoint
 * @param {Object} speciesResponse - Raw species data from PokeAPI /pokemon-species/ endpoint
 * @param {string} visibility - CSS visibility value for showing/hiding elements
 */
function populatePage(pokemonResponse, speciesResponse, visibility) {
  // Reset sprite display state for new Pokemon
  currentSpriteState = 'artwork';
  if(isDev()) {
    console.log('🔄 [Sprite State] Reset to artwork for new Pokemon');
  }

  // Matrix background for Porygon family
  const porygonNames = ['porygon', 'porygon2', 'porygon-z'];
  if(porygonNames.includes(pokemonResponse.name.toLowerCase())) {
    startMatrixEffect();
  } else {
    stopMatrixEffect();
  }
  
  // Process raw API data into usable formats
  const statTotal = getStatTotal(pokemonResponse.stats);
  const entry = getPokedexEntry(speciesResponse.flavor_text_entries);
  const height = getHeight(pokemonResponse.height);
  const weight = getWeight(pokemonResponse.weight);
  const genus = getGenus(speciesResponse.genera);
  
  // Create comprehensive Pokemon object with all processed data
  getPokemonObject(pokemonResponse, speciesResponse, statTotal, entry, height, weight, genus);
  
  // Process Pokemon types and generate color scheme
  const types = getTypes(pokemon.types);
    // Show snow effect if Pokémon is baby or ice type
    showSnowIfBabyOrIce({
      is_baby: speciesResponse.is_baby,
      types: pokemonResponse.types,
      isLegendary: speciesResponse.is_legendary,
      isMythical: speciesResponse.is_mythical
    });
    
  const backgroundColor = convertHexToRgba(types[0], 0.35);
  const borderColor = convertHexToRgba(types[1], 0.55);
  
  // Generate and display stats chart with appropriate scaling
  const max = getLargestStat(pokemon.statsArray);
  displayStatsChart(backgroundColor, borderColor, pokemon.statsArray, max, pokemon.name);
  
  // Populate all Pokemon attribute displays
  displayAttributes();
  
  // Configure navigation button visibility based on Pokemon ID (AFTER storage is updated)
  makeButtonsDisappear(pokemon.id, pokemon.hasGenderDifferences);
  
  // Populate specialized data lists
  getAbilityList(pokemon.abilities);     // Pokemon abilities with descriptions
  getHeldItemList(pokemon.heldItems);    // Items that can be held by this Pokemon
  getFormList(pokemon.forms);            // Alternate forms if available
  
  // Make all Pokemon information visible with specified visibility setting
  getElementVisibility(HiddenElementsArray, visibility);
  
  // Capitalize Pokemon name in entry text if it appears
  if(entry.includes(pokemon.name)) {
    capitalizeFirstLetter(pokemon.name);
  }
  
  // Configure cry button based on audio availability
  if(pokemon.cry) {
    // Audio available - show enabled cry button
    CryButtonTop.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
    CryButton.title = `Play ${capitalizeFirstLetter(pokemon.name)}'s cry`;
    CryButton.setAttribute('aria-label', `Play ${capitalizeFirstLetter(pokemon.name)}'s cry`);
    CryButton.disabled = false;
    CryButton.classList.remove('cry-unavailable');
  } else {
    // No audio available - show disabled cry button
    CryButtonTop.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
    CryButton.title = `${capitalizeFirstLetter(pokemon.name)}'s cry not available`;
    CryButton.setAttribute('aria-label', `${capitalizeFirstLetter(pokemon.name)}'s cry not available`);
    CryButton.disabled = true;
    CryButton.classList.add('cry-unavailable');
  }
} //populatePage

// ====================================
// POKEMON ATTRIBUTE DISPLAY FUNCTIONS
// ====================================

/**
 * Populates all Pokemon attribute displays with formatted data
 * Handles responsive text formatting based on device type
 */
function displayAttributes() {
  const deviceType = getDeviceType();
  // Efficiently update only if values changed
  const idText = `#${pokemon.id} `;
  if(NumberHeader.innerText !== idText) {
    NumberHeader.innerText = idText;
  }

  const fixedName = punctuationNameCheck(pokemon.name);
  const nameText = fixedName.toUpperCase();

  if(NameHeader.innerText !== nameText) { 
    NameHeader.innerText = nameText;
  }
  if(GenusSubHeader.innerText !== pokemon.genus) {
    GenusSubHeader.innerText = pokemon.genus;
  }
  if(GenerationText.innerText !== pokemon.generation) {
    GenerationText.innerText = pokemon.generation;
  }
  if(PokedexEntryText.innerText !== pokemon.pokedexEntry) {
    PokedexEntryText.innerText = pokemon.pokedexEntry;
  }
  if(HeightText.innerText !== pokemon.height) {
    HeightText.innerText = pokemon.height;
  }

  const weightVal = `${pokemon.weight.substring(0, pokemon.weight.length - 2)} lbs`;
  
  if(WeightText.innerText !== weightVal) {
    WeightText.innerText = weightVal;
  }
  if(deviceType === 'mobile') {
    WeightText.innerHTML += '<br>';
  }
  if(StatsText.innerText !== `${pokemon.baseStatTotal}`) {
    StatsText.innerText = `${pokemon.baseStatTotal}`;
  }
  if(deviceType === 'mobile' || deviceType === 'tablet') {
    StatsText.innerHTML += '<br>';
  }

  // Sprite logic
  const hasDefaultSprite = !!pokemon.FrontDefaultSprite;
  const hasShinySprite = !!pokemon.FrontShinySprite;
  const hasArtwork = !!pokemon.FrontDefaultOfficialArtwork;
  const hasShinyArtwork = !!pokemon.FrontShinyOfficialArtwork;

  // Remove previous click handler
  DefaultArtworkElement.onclick = null;
  DefaultArtworkElement.removeEventListener('click', DefaultArtworkElement._toggleHandler);
  DefaultArtworkElement._showingShiny = false;
  DefaultArtworkElement._toggleHandler = null;

  // Helper for setting up toggle
  function setToggle(handler, cursor, title) {
    DefaultArtworkElement.style.cursor = cursor;
    DefaultArtworkElement.title = title;
    DefaultArtworkElement._toggleHandler = handler;
    DefaultArtworkElement.addEventListener('click', handler);
  }

  if(hasDefaultSprite && hasShinySprite) {
    currentSpriteState = 'default';
    configureArtworkElement(DefaultArtworkElement, pokemon.FrontDefaultSprite, 'Default Sprite');
    DefaultArtworkElement.style.display = '';
    setToggle(() => {
      DefaultArtworkElement._showingShiny = !DefaultArtworkElement._showingShiny;
      
      if(DefaultArtworkElement._showingShiny) {
        configureArtworkElement(DefaultArtworkElement, pokemon.FrontShinySprite, 'Shiny Default Sprite');
        DefaultArtworkElement.title = 'Click to show default sprite';
      } else {
        configureArtworkElement(DefaultArtworkElement, pokemon.FrontDefaultSprite, 'Default Sprite');
        DefaultArtworkElement.title = 'Click to show shiny sprite';
      }
    }, 'pointer', 'Click to show shiny sprite');
  } else if(hasDefaultSprite) {
    currentSpriteState = 'default';
    configureArtworkElement(DefaultArtworkElement, pokemon.FrontDefaultSprite, 'Default Sprite');
    
    DefaultArtworkElement.style.display = '';
    DefaultArtworkElement.style.cursor = 'default';
    DefaultArtworkElement.title = 'Default Sprite';
  } else if(hasArtwork && hasShinyArtwork) {
    currentSpriteState = 'artwork';
    configureArtworkElement(DefaultArtworkElement, pokemon.FrontDefaultOfficialArtwork, 'Default Official Artwork');
    DefaultArtworkElement.style.display = '';
    
    setToggle(() => {
      DefaultArtworkElement._showingShiny = !DefaultArtworkElement._showingShiny;
      
      if(DefaultArtworkElement._showingShiny) {
        configureArtworkElement(DefaultArtworkElement, pokemon.FrontShinyOfficialArtwork, 'Shiny Official Artwork');
        DefaultArtworkElement.title = 'Click to show default artwork';
      } else {
        configureArtworkElement(DefaultArtworkElement, pokemon.FrontDefaultOfficialArtwork, 'Default Official Artwork');
        DefaultArtworkElement.title = 'Click to show shiny artwork';
      }
    }, 'pointer', 'Click to show shiny artwork');
  } else if(hasArtwork) {
    currentSpriteState = 'artwork';
    configureArtworkElement(DefaultArtworkElement, pokemon.FrontDefaultOfficialArtwork, 'Default Official Artwork');

    DefaultArtworkElement.style.display = '';
    DefaultArtworkElement.style.cursor = 'default';
    DefaultArtworkElement.title = 'Default Official Artwork';
  }
  // Always hide the shiny artwork image element
  if(ShinyArtworkElement) {
    ShinyArtworkElement.style.display = 'none';
    ShinyArtworkElement.src = '';
  }
  // Remove sprite click listeners and interaction (only show default sprite)
  DefaultArtworkElement.removeEventListener('click', cycleSpriteDisplay);
  DefaultArtworkElement.style.cursor = 'default';
  DefaultArtworkElement.title = 'Default Sprite';
} //displayAttributes

// ====================================
// POKEMON OBJECT CREATION
// ====================================

/**
 * Creates comprehensive Pokemon data object from API responses
 * Combines data from both Pokemon and species endpoints into unified object
 * @param {Object} pokemonResponse - Raw Pokemon data from PokeAPI
 * @param {Object} speciesResponse - Raw species data from PokeAPI  
 * @param {number} statTotal - Calculated base stat total
 * @param {string} entry - Processed Pokédex entry text
 * @param {string} height - Formatted height string
 * @param {string} weight - Formatted weight string
 * @param {string} genus - Pokemon genus/species classification
 */
function getPokemonObject(pokemonResponse, speciesResponse, statTotal, entry, height, weight, genus) {
  // Handle Pokemon cry audio with fallback options
  let cryUrl = null;
  if(pokemonResponse.cries) {
    // Prefer latest cry format, fallback to legacy if needed
    cryUrl = pokemonResponse.cries.latest || pokemonResponse.cries.legacy || null;
  }
  
  // Create comprehensive Pokemon object with all relevant data
  pokemon = {
    // Basic identification
    id: speciesResponse.id,
    name: pokemonResponse.species.name,
    genus: genus,
    
    // Pokemon characteristics
    abilities: pokemonResponse.abilities,
    heldItems: pokemonResponse.held_items,
    height: height,
    weight: weight,
    
    // Special classifications
    isBaby: speciesResponse.is_baby,
    isLegendary: speciesResponse.is_legendary,
    isMythical: speciesResponse.is_mythical,
    
    // Type and form data
    types: pokemonResponse.types,
    forms: speciesResponse.varieties,
    
    // Audio and multimedia
    cry: cryUrl,
    
    // Battle statistics
    statsArray: pokemonResponse.stats.map(stat => stat.base_stat),
    baseStatTotal: statTotal,
    
    // Game and lore information
    generation: speciesResponse.generation.name.substring(11).toUpperCase(), // Extract generation number
    pokedexEntry: entry,
    
    // Sprite URLs (prioritized for display)
    FrontDefaultSprite: pokemonResponse.sprites.front_default || `${DefaultArtworkUrl}${speciesResponse.id}.png`,
    FrontShinySprite: pokemonResponse.sprites.front_shiny || `${ShinyArtworkUrl}${speciesResponse.id}.png`,
    BackDefaultSprite: pokemonResponse.sprites.back_default,
    BackShinySprite: pokemonResponse.sprites.back_shiny,

    // Artwork URLs (always valid fallback)
    FrontDefaultOfficialArtwork: `${DefaultArtworkUrl}${speciesResponse.id}.png`,
    FrontShinyOfficialArtwork: `${ShinyArtworkUrl}${speciesResponse.id}.png`,
    
    // Gender differences (for sprite cycling)
    hasGenderDifferences: speciesResponse.has_gender_differences,
    defaultGender: null,     // Will be set by setGenderDifferenceSprites
    alternateGender: null,   // Will be set by setGenderDifferenceSprites
    
    // Male sprites (typically the default sprites)
    frontMaleSprite: null,
    backMaleSprite: null,
    frontMaleShinySprite: null,
    backMaleShinySprite: null,
    
    // Female sprites (alternate sprites)
    frontFemaleSprite: null,
    backFemaleSprite: null,
    frontFemaleShinySprite: null,
    backFemaleShinySprite: null,
  };
  
  // Set gender-specific sprites if Pokemon has gender differences
  setGenderDifferenceSprites(pokemon, pokemonResponse);
  
  // Store Pokemon data in local storage for recall functionality
  populateLocalStorage(pokemon.id);
  
  // Log Pokemon object for debugging purposes
  console.table(pokemon);
  
  return pokemon;
} //getPokemonObject

// ====================================
// GENDER DIFFERENCES SUPPORT (FUTURE FEATURE)
// ====================================

/**
 * Sets gender-specific sprite URLs for Pokemon with gender differences
 * Determines which gender the default sprite represents by comparing URLs
 * @param {Object} pokemonObj - Pokemon object to modify
 * @param {Object} pokemonResponse - Raw Pokemon response containing sprite data
 */
function setGenderDifferenceSprites(pokemonObj, pokemonResponse) {
  // Only set female sprites if Pokemon has gender differences
  if(pokemonObj.hasGenderDifferences) {
    // Get male and female sprite URLs
    pokemonObj.frontMaleSprite = pokemonResponse.sprites.front_default; // Male is typically the default
    pokemonObj.backMaleSprite = pokemonResponse.sprites.back_default;
    pokemonObj.frontMaleShinySprite = pokemonResponse.sprites.front_shiny;
    pokemonObj.backMaleShinySprite = pokemonResponse.sprites.back_shiny;
    
    pokemonObj.frontFemaleSprite = pokemonResponse.sprites.front_female;
    pokemonObj.backFemaleSprite = pokemonResponse.sprites.back_female;
    pokemonObj.frontFemaleShinySprite = pokemonResponse.sprites.front_shiny_female;
    pokemonObj.backFemaleShinySprite = pokemonResponse.sprites.back_shiny_female;
    
    // Determine if default sprite is male or female by comparing URLs
    // If female sprites exist and are different from default, then default is male
    const defaultIsMale = pokemonObj.frontFemaleSprite && 
                          pokemonObj.frontFemaleSprite !== pokemonObj.FrontDefaultSprite;
    
    pokemonObj.defaultGender = defaultIsMale ? 'male' : 'female';
    pokemonObj.alternateGender = defaultIsMale ? 'female' : 'male';
    
    const hasUsableAlternateSprites = defaultIsMale ? 
      (pokemonObj.frontFemaleSprite || pokemonObj.frontFemaleShinySprite) :
      (pokemonObj.frontMaleSprite || pokemonObj.frontMaleShinySprite);
    
    if(isDev()) console.log(`👫 [Gender Sprites] ${pokemonObj.name} has gender differences:`, {
      defaultGender: pokemonObj.defaultGender,
      alternateGender: pokemonObj.alternateGender,
      frontMale: pokemonObj.frontMaleSprite ? 'available' : 'null',
      backMale: pokemonObj.backMaleSprite ? 'available' : 'null',
      frontShinyMale: pokemonObj.frontMaleShinySprite ? 'available' : 'null',
      backShinyMale: pokemonObj.backMaleShinySprite ? 'available' : 'null',
      frontFemale: pokemonObj.frontFemaleSprite ? 'available' : 'null',
      backFemale: pokemonObj.backFemaleSprite ? 'available' : 'null',
      frontShinyFemale: pokemonObj.frontFemaleShinySprite ? 'available' : 'null',
      backShinyFemale: pokemonObj.backFemaleShinySprite ? 'available' : 'null',
      cycleWillIncludeAlternate: hasUsableAlternateSprites
    });
  } else {
    if(isDev()) {
      console.log(`👤 [Gender Sprites] ${pokemonObj.name} has no gender differences`);
    }
  }
} //setGenderDifferenceSprites

// ====================================
// SPRITE INTERACTION HANDLERS
// ====================================

/**
 * Adds click event listeners to sprite images for cycling through display states
 * Cycles through artwork → default sprites → alternate gender sprites (for Pokemon with differences)
 * Cycles through artwork → default sprites (for Pokemon without gender differences)
 */
function addSpriteClickListeners() {
  // Remove sprite click listeners and interaction (only show default sprite)
  DefaultArtworkElement.removeEventListener('click', cycleSpriteDisplay);
  DefaultArtworkElement.style.cursor = 'default';
  DefaultArtworkElement.title = 'Default Sprite';
}

/**
 * Cycles through sprite display states: artwork → default → alternate → artwork
 * For Pokemon without gender differences or alternate sprites: artwork → default → artwork (repeat)
 */
function cycleSpriteDisplay() {
  if(!pokemon) {
    console.warn('⚠️ [Sprite Cycle] Cannot cycle - No Pokemon loaded');
    return;
  }
  
  // Check if alternate gender sprites actually exist
  const hasAlternateSprites = pokemon.hasGenderDifferences && pokemon.alternateGender && (
    (pokemon.alternateGender === 'female' && (pokemon.frontFemaleSprite || pokemon.frontFemaleShinySprite)) ||
    (pokemon.alternateGender === 'male' && (pokemon.frontMaleSprite || pokemon.frontMaleShinySprite))
  );
  
  // Determine next state based on current state and available sprites
  let nextState;
  if(hasAlternateSprites) {
    // Cycle: artwork → default → alternate → artwork
    switch (currentSpriteState) {
      case 'artwork':
        nextState = 'default';
        break;
      case 'default':
        nextState = 'alternate';
        break;
      case 'alternate':
        nextState = 'artwork';
        break;
      default:
        nextState = 'artwork';
    }
  } else {
    // Cycle: artwork → default → artwork (no alternate sprites available)
    switch (currentSpriteState) {
      case 'artwork':
        nextState = 'default';
        break;
      case 'default':
        nextState = 'artwork';
        break;
      default:
        nextState = 'artwork';
    }
  }
  currentSpriteState = nextState;
  
  if(isDev()) {
    console.log(`🔄 [Sprite Cycle] Switching to ${currentSpriteState} display for ${pokemon.name}`);
  }

  // Update sprites based on new state
  updateSpriteDisplay();
  
  // Show user feedback
  let displayText;
  switch (currentSpriteState) {
    case 'default':
      displayText = `🎮 Default sprites (${pokemon.defaultGender || 'default'})`;
      break;
    case 'alternate':
      const genderIcon = pokemon.alternateGender === 'female' ? '♀️' : '♂️';
      displayText = `${genderIcon} ${pokemon.alternateGender || 'Alternate'} sprites`;
      break;
    case 'artwork':
      displayText = '🖼️ Official artwork';
      break;
  }
  
  if(typeof showToast !== 'undefined') {
    showToast(`${displayText} displayed`);
  }
}

/**
 * Updates the sprite display based on the current sprite state
 */
function updateSpriteDisplay() {
  let defaultImage, shinyImage, defaultAlt, shinyAlt;
  
  switch (currentSpriteState) {
    case 'default':
      defaultImage = pokemon.FrontDefaultSprite;
      shinyImage = pokemon.FrontShinySprite;
      defaultAlt = `Default Sprite (${pokemon.defaultGender || 'default'})`;
      shinyAlt = `Shiny Default Sprite (${pokemon.defaultGender || 'default'})`;
      break;      
    case 'alternate':
      // Use alternate gender sprites based on what the alternate gender is
      if(pokemon.alternateGender === 'female') {
        defaultImage = pokemon.frontFemaleSprite;
        shinyImage = pokemon.frontFemaleShinySprite;
        defaultAlt = 'Female Default Sprite';
        shinyAlt = 'Female Shiny Sprite';
      } else if(pokemon.alternateGender === 'male') {
        defaultImage = pokemon.frontMaleSprite;
        shinyImage = pokemon.frontMaleShinySprite;
        defaultAlt = 'Male Default Sprite';
        shinyAlt = 'Male Shiny Sprite';
      }
      break;      
    case 'artwork':
      defaultImage = null; // Force artwork loading
      shinyImage = null;   // Force artwork loading
      defaultAlt = 'Default Official Artwork';
      shinyAlt = 'Shiny Official Artwork';
      break;      
    default:
      defaultImage = pokemon.FrontDefaultSprite;
      shinyImage = pokemon.FrontShinySprite;
      defaultAlt = 'Default Sprite';
      shinyAlt = 'Shiny Sprite';
  }
  
  // Update default image
  if(currentSpriteState === 'artwork' || !defaultImage) {
    if(isDev()) {
      console.log(`🖼️ [Sprite Update] Loading default artwork`);
    }
    configureArtworkElement(
      DefaultArtworkElement,
      pokemon.FrontDefaultOfficialArtwork,
      defaultAlt
    );
  } else {
    if(isDev()) {
      console.log(`🎮 [Sprite Update] Loading ${currentSpriteState} default sprite`);
    }
    configurePriorityArtworkElement(
      DefaultArtworkElement,
      defaultImage,
      pokemon.FrontDefaultOfficialArtwork,
      defaultAlt
    );
  }
  
  // Update shiny image
  if(currentSpriteState === 'artwork' || !shinyImage) {
    if(isDev()) {
      console.log(`✨ [Sprite Update] Loading shiny artwork`);
    }
    configureArtworkElement(
      ShinyArtworkElement,
      pokemon.FrontShinyOfficialArtwork,
      shinyAlt
    );
  } else {
    if(isDev()) {
      console.log(`✨ [Sprite Update] Loading ${currentSpriteState} shiny sprite`);
    }
    configurePriorityArtworkElement(
      ShinyArtworkElement,
      shinyImage,
      pokemon.FrontShinyOfficialArtwork,
      shinyAlt
    );
  }
}

// ====================================
// ARTWORK LOADING UTILITIES
// ====================================

/**
 * Configures artwork element to prioritize sprites over official artwork
 * Tries to load sprite first, falls back to official artwork if sprite fails
 * @param {HTMLImageElement} element - The image element to configure
 * @param {string} spriteUrl - Primary sprite URL to try first
 * @param {string} artworkUrl - Fallback official artwork URL
 * @param {string} altText - Alt text for accessibility
 */
function configurePriorityArtworkElement(element, spriteUrl, artworkUrl, altText) {
  // Clear any existing handlers
  element.onerror = null;
  element.onload = null;
  
  // Set initial attributes
  element.setAttribute('alt', altText);
  
  // Configure element sizing
  element.style.width = element.parentElement.style.width;
  element.style.height = element.parentElement.style.height;
  
  // Android and mobile detection for optimization
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isMobile = window.deviceType === 'mobile';
  
  // Function to attempt loading official artwork as fallback
  const loadOfficialArtwork = () => {
    if(isDev()) {
      console.log(`🖼️ Loading official artwork fallback: ${altText}`);
    }

    element.onload = function() {
      if(isDev()) {
        console.log(`✅ Official artwork loaded: ${altText}`);
      }
    };
    
    element.onerror = function() {
      console.warn(`❌ Both sprite and artwork failed: ${altText}`);
      element.style.opacity = '0.5';
      element.style.filter = 'grayscale(100%)';
    };
    
    element.src = artworkUrl;
  };
  
  // Try sprite first, fallback to artwork on failure
  if(spriteUrl && spriteUrl !== null) {
    if(isDev()) {
      console.log(`🎮 Attempting sprite load: ${altText}`);
    }

    element.onload = function() {
      if(isDev()) {
        console.log(`✅ Sprite loaded successfully: ${altText}`);
      }
    };
    
    element.onerror = function() {
      console.warn(`❌ Sprite failed, trying official artwork: ${altText}`);
      loadOfficialArtwork();
    };
    
    // Android-specific optimizations
    if(isAndroid) {
      element.crossOrigin = 'anonymous';
      element.loading = 'lazy';
    }
    
    // Mobile optimizations
    if(isMobile) {
      element.decoding = 'async';
      element.style.willChange = 'transform';
    }
    
    element.src = spriteUrl;
  } else {
    // No sprite available, go straight to official artwork
    console.log(`📷 No sprite available, loading official artwork: ${altText}`);
    loadOfficialArtwork();
  }
}

/**
 * Configures artwork element with Android-specific error handling and fallback loading
 * @param {HTMLImageElement} element - The image element to configure
 * @param {string} imageUrl - Primary image URL to load
 * @param {string} altText - Alt text for accessibility
 */
function configureArtworkElement(element, imageUrl, altText) {
  // Clear any existing error handlers
  element.onerror = null;
  element.onload = null;
  
  // Set initial attributes
  element.setAttribute('alt', altText);
  
  // Configure artwork element sizing to match container dimensions
  element.style.width = element.parentElement.style.width;
  element.style.height = element.parentElement.style.height;
  
  // Android-specific: Add loading strategies for better compatibility
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isMobile = window.deviceType === 'mobile';
  
  if(isAndroid) {
    if(isDev()) {
      console.log('🤖 [Android] Configuring artwork with Android-specific loading strategy');
    }
    
    // Android-specific: Set longer timeout and add crossorigin
    element.crossOrigin = 'anonymous';
    element.loading = 'lazy';
    
    // Android-specific: Add retry mechanism
    let retryCount = 0;
    const maxRetries = 3;
    
    function attemptLoad() {
      // Add cache-busting for Android if this is a retry
      const urlToLoad = retryCount > 0 ? `${imageUrl}?retry=${retryCount}&t=${Date.now()}` : imageUrl;
      
      element.onload = function() {
        if(isDev()) {
          console.log(`✅ [Android] Artwork loaded successfully: ${element.alt}`);
        }

        // Android-specific: Force a repaint to ensure visibility
        element.style.display = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.display = '';
      };
      
      element.onerror = function() {
        retryCount++;
        console.warn(`❌ [Android] Artwork load failed (attempt ${retryCount}): ${element.alt}`);
        
        if(retryCount <= maxRetries) {
          console.log(`🔄 [Android] Retrying artwork load in ${retryCount * 1000}ms...`);
          
          setTimeout(() => {
            attemptLoad();
          }, retryCount * 1000); // Progressive delay: 1s, 2s, 3s
        } else {
          console.error(`💥 [Android] All artwork load attempts failed for: ${element.alt}`);
          // Set a placeholder or hide the element
          element.style.opacity = '0.3';
          element.style.filter = 'grayscale(100%)';
          
          // Show user feedback
          if(typeof showToast !== 'undefined') {
            showToast('Some artwork may not load properly on this device');
          }
        }
      };
      
      // Set the source to start loading
      element.src = urlToLoad;
    }
    
    // Start the loading process
    attemptLoad();
    
  } else {
    // Non-Android devices: Standard loading
    element.onload = function() {
      if(isDev()) {
        console.log(`✅ Artwork loaded: ${element.alt}`);
      }
    };
    
    element.onerror = function() {
      console.warn(`❌ Artwork load failed: ${element.alt}`);
      element.style.opacity = '1';
      element.style.filter = '';
      
      // Set Pokeball placeholder image
      element.src = '/Images/pokeball.png';
      element.alt = 'Pokeball Placeholder';
    };
    
    // Set the source
    element.src = imageUrl;
  }
  
  // Additional mobile optimizations
  if(isMobile) {
    // Mobile-specific: Preload hint for better performance
    element.decoding = 'async';
    element.style.willChange = 'transform';
  }
}

// ====================================
// DEV UTILITY
// ====================================

/**
 * Development utility function for enabling/disabling dev-only logging
 * @returns {boolean} True if in development mode, false otherwise
 */
function isDev() {
  return typeof process === 'undefined' || process.env.NODE_ENV !== 'production';
}

// ====================================
// MODULE EXPORTS
// ====================================

export {
  populatePage,    // Main function for populating page with Pokemon data
  pokemon,         // Current Pokemon object for external access
};

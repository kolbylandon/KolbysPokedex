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
import { getElementVisibility } from './utils/dom-utils.js?v=20250801i';
import { 
  getAbilityList, getFormList, getGenus, getHeight, getHeldItemList, 
  getLargestStat, getPokedexEntry, getStatTotal, getTypes, getWeight,
  punctuationNameCheck, capitalizeFirstLetter
} from './utils/data-utils.js?v=20250801i';
import { convertHexToRgba } from './utils/color-utils.js?v=20250801i';
import { populateLocalStorage } from './utils/storage-utils.js?v=20250802h';
import { updateNavigationButtons as makeButtonsDisappear, getDeviceType } from './utils/navigation-utils.js?v=20250801i';
import { 
  displayStatsChart, 
} from './statsChart.js';

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
  const backgroundColor = convertHexToRgba(types[0], 0.35);
  const borderColor = convertHexToRgba(types[1], 0.55);
  
  // Generate and display stats chart with appropriate scaling
  const max = getLargestStat(pokemon.statsArray);
  displayStatsChart(backgroundColor, borderColor, pokemon.statsArray, max + 25, pokemon.name);
  
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
  if (pokemon.cry) {
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
  const deviceType = getDeviceType(); // Get device type for responsive adjustments
  
  // Display Pokemon identification
  NumberHeader.innerText = `#${pokemon.id} `;
  pokemon.name = punctuationNameCheck(pokemon.name);         // Fix special characters
  NameHeader.innerText = pokemon.name.toUpperCase();         // Display name in caps
  GenusSubHeader.innerText = pokemon.genus;                  // Species classification
  
  // Display Pokemon details
  GenerationText.innerText = pokemon.generation;             // Generation info
  PokedexEntryText.innerText = pokemon.pokedexEntry;        // Flavor text description
  HeightText.innerText = pokemon.height;                     // Height in feet/inches
  
  // Weight display with responsive line breaks
  WeightText.innerText = `${pokemon.weight.substring(0, pokemon.weight.length - 2)} lbs`;
  if(deviceType === 'mobile') {
    WeightText.innerHTML += '<br>';  // Add line break on mobile for better layout
  }
  
  // Stats total display with responsive line breaks
  StatsText.innerText = `${pokemon.baseStatTotal}`;
  if(deviceType === 'mobile' || deviceType === 'tablet') {
    StatsText.innerHTML += '<br>';   // Add line break on mobile/tablet
  }
  
  // Configure default (normal) Pokemon artwork
  DefaultArtworkElement.setAttribute('src', pokemon.FrontDefaultOfficialArtwork);
  DefaultArtworkElement.setAttribute('alt', 'Official Artwork Not Available');
  // Configure artwork element sizing to match container dimensions
  DefaultArtworkElement.style.width = DefaultArtworkElement.parentElement.style.width;
  DefaultArtworkElement.style.height = DefaultArtworkElement.parentElement.style.height;
  
  // Configure shiny Pokemon artwork
  ShinyArtworkElement.setAttribute('src', pokemon.FrontShinyOfficialArtwork);
  ShinyArtworkElement.setAttribute('alt', 'Shiny Official Artwork Not Available');
  ShinyArtworkElement.style.width = ShinyArtworkElement.parentElement.style.width;
  ShinyArtworkElement.style.height = ShinyArtworkElement.parentElement.style.height;
  
  // Legacy sprite code (preserved for potential future use)
  // FrontDefault.setAttribute('src', pokemon.FrontDefaultSprite);
  // FrontDefault.setAttribute('alt', 'Front Sprite Not Available');
  // FrontShiny.setAttribute('src', pokemon.FrontShinySprite);
  // FrontShiny.setAttribute('alt', 'Front Shiny Sprite Not Available');
  // BackDefault.setAttribute('src', pokemon.BackDefaultSprite);
  // BackDefault.setAttribute('alt', 'Back Sprite Not Available');
  // BackShiny.setAttribute('src', pokemon.BackShinySprite);
  // BackShiny.setAttribute('alt', 'Back Shiny Sprite Not Available');
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
  if (pokemonResponse.cries) {
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
    
    // Artwork URLs (using official artwork for better quality)
    FrontDefaultOfficialArtwork: `${DefaultArtworkUrl}${speciesResponse.id}.png`,
    FrontShinyOfficialArtwork: `${ShinyArtworkUrl}${speciesResponse.id}.png`,
    
    // Gender differences (for future implementation)
    hasGenderDifferences: speciesResponse.has_gender_differences,
    
    // Legacy sprite URLs (preserved for potential future use)
    // FrontDefaultSprite: pokemonResponse.sprites.front_default,
    // BackDefaultSprite: pokemonResponse.sprites.back_default,
    // FrontShinySprite: pokemonResponse.sprites.front_shiny,
    // BackShinySprite: pokemonResponse.sprites.back_shiny,
    // frontFemaleSprite: null,
    // backFemaleSprite: null,
    // frontFemaleShinySprite: null,
    // backFemaleShinySprite: null,
  };
  
  // Set gender-specific sprites if Pokemon has gender differences (future feature)
  // setGenderDifferenceSprites(pokemon, pokemonResponse);
  
  // Legacy sprites array (preserved for potential future use)
  // spritesArray = [
  //   pokemon.FrontDefaultSprite,
  //   pokemon.BackDefaultSprite,
  //   pokemon.FrontShinySprite,
  //   pokemon.BackShinySprite,
  //   pokemon.FrontDefaultOfficialArtwork,
  //   pokemon.FrontShinyOfficialArtwork,
  //   pokemon.frontFemaleSprite,
  //   pokemon.backFemaleSprite,
  //   pokemon.frontFemaleShinySprite,
  //   pokemon.backFemaleShinySprite
  // ];
  
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
 * Currently preserved for future implementation of gender selection feature
 * @param {Object} pokemonObj - Pokemon object to modify
 * @param {Object} pokemonResponse - Raw Pokemon response containing sprite data
 */
function setGenderDifferenceSprites(pokemonObj, pokemonResponse) {
  // Only set female sprites if Pokemon has gender differences
  if (pokemonObj.hasGenderDifferences) {
    pokemonObj.frontFemaleSprite = pokemonResponse.sprites.front_female;
    pokemonObj.backFemaleSprite = pokemonResponse.sprites.back_female;
    pokemonObj.frontFemaleShinySprite = pokemonResponse.sprites.front_shiny_female;
    pokemonObj.backFemaleShinySprite = pokemonResponse.sprites.back_shiny_female;
  }
} //setGenderDifferenceSprites

// ====================================
// MODULE EXPORTS
// ====================================

export {
  populatePage,    // Main function for populating page with Pokemon data
  pokemon,         // Current Pokemon object for external access
};

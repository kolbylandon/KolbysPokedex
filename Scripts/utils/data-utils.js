/**
 * DATA UTILITIES MODULE
 * =====================
 * 
 * This module handles Pokemon data processing, formatting, and display logic.
 * It contains functions for processing API responses and converting raw Pokemon
 * data into user-friendly formats for display in the application.
 * 
 * Key Features:
 * - Pokemon data formatting and validation
 * - Ability, held item, and form list generation
 * - Height/weight unit conversion (metric to imperial)
 * - Pokédex entry text processing and cleanup
 * - Type system processing and visual styling
 * - Statistical data processing and calculation
 * 
 * @author Kolby Landon
 * @version 1.1 (Renamed from data-processing to data-utils for consistency)
 * @since 2025
 * @updated 2025-08-01T06:15:00Z
 */

'use strict';

// Import required dependencies
import { 
  requestAbilityEffect, 
  requestForm, 
  requestHeldItem 
} from '../requests.js';

import { 
  AbilitiesHeader, 
  AbilitiesUnorderedList,
  HeldItemsHeader,
  HeldItemsUnorderedList,
  FormsHeader,
  FormsUnorderedList,
  TypeText,
  TypeText2,
  TypeHeader,
  Body
} from './dom-utils.js';

import { 
  getTypeColor, 
  convertHexToRgba 
} from './color-utils.js';

// ====================================
// APPLICATION CONSTANTS
// ====================================

/** @type {string} Standard text color for most Pokemon information */
const TextColor = 'rgba(98, 98, 98, 0.95)';

/** @type {string} Special color for hidden abilities to distinguish them */
const HiddenAbilityTextColor = 'rgba(255, 111, 97, 0.95)';

/** @type {number} Maximum Pokédex number for original 151 Pokemon */
const OriginalMaximumId = 151;

/** @type {number} Maximum Pokédex number including all generations */
let MaximumId = 1025;

// ====================================
// POKEMON ABILITY PROCESSING
// ====================================

/**
 * Generates and displays the abilities list for a Pokemon
 * Handles both normal and hidden abilities with appropriate styling
 * @param {Array} abilities - Array of ability objects from Pokemon API
 * @example
 * const abilities = [
 *   { ability: { name: 'overgrow', url: '...' }, is_hidden: false },
 *   { ability: { name: 'chlorophyll', url: '...' }, is_hidden: true }
 * ];
 * getAbilityList(abilities);
 */
export function getAbilityList(abilities) {
  if (!abilities || !Array.isArray(abilities)) {
    console.warn('getAbilityList: Invalid abilities array provided');
    return;
  }

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
}

// ====================================
// HELD ITEMS PROCESSING
// ====================================

/**
 * Generates and displays the held items list for a Pokemon
 * Handles cases where Pokemon have no held items by hiding the section
 * @param {Array} heldItems - Array of held item objects from Pokemon API
 * @example
 * const heldItems = [
 *   { item: { name: 'light-ball', url: '...' } }
 * ];
 * getHeldItemList(heldItems);
 */
export function getHeldItemList(heldItems) {
  if (!heldItems || !Array.isArray(heldItems)) {
    console.warn('getHeldItemList: Invalid held items array provided');
    return;
  }

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
}

// ====================================
// POKEMON FORMS PROCESSING
// ====================================

/**
 * Generates and displays the alternate forms list for a Pokemon
 * Hides the section if Pokemon only has one form (the default form)
 * @param {Array} forms - Array of form objects from Pokemon API
 * @example
 * const forms = [
 *   { pokemon: { name: 'deoxys-normal', url: '...' } },
 *   { pokemon: { name: 'deoxys-attack', url: '...' } }
 * ];
 * getFormList(forms);
 */
export function getFormList(forms) {
  if (!forms || !Array.isArray(forms)) {
    console.warn('getFormList: Invalid forms array provided');
    return;
  }

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
      // Use dynamic import to avoid circular dependency
      import('./navigation-utils.js?v=20250801i').then(({ generatePokemon }) => {
        generatePokemon(pokemonId, 'visible', true);
      });
    });
    
    fragment.appendChild(ListItem);
  });
  
  // Add all form elements to DOM at once
  FormsUnorderedList.appendChild(fragment);
}

// ====================================
// STATISTICAL DATA PROCESSING
// ====================================

/**
 * Calculates the total base stat value for a Pokemon
 * Sums all individual base stats (HP, Attack, Defense, etc.)
 * @param {Array} stats - Array of stat objects from Pokemon API
 * @returns {number} Total of all base stat values
 * @example
 * const stats = [
 *   { base_stat: 45, stat: { name: 'hp' } },
 *   { base_stat: 49, stat: { name: 'attack' } }
 * ];
 * const total = getStatTotal(stats); // Returns 94
 */
export function getStatTotal(stats) {
  if (!stats || !Array.isArray(stats)) {
    console.warn('getStatTotal: Invalid stats array provided');
    return 0;
  }

  let statTotal = 0;
  
  // Sum all base stat values
  stats.forEach(stat => {
    if (stat && typeof stat.base_stat === 'number') {
      statTotal += stat.base_stat;
    }
  });
  
  return statTotal;
}

/**
 * Find the highest base stat value from a Pokemon's stats array
 * Useful for determining a Pokemon's strongest stat for visualization
 * @param {Array} statsArray - Array of base stat values
 * @returns {number} The highest stat value
 * @example
 * const statValues = [45, 49, 49, 65, 65, 45];
 * const highest = getLargestStat(statValues); // Returns 65
 */
export function getLargestStat(statsArray) {
  if (!statsArray || !Array.isArray(statsArray)) {
    console.warn('getLargestStat: Invalid stats array provided');
    return 0;
  }

  return Math.max(...statsArray.filter(stat => typeof stat === 'number'));
}

// ====================================
// POKÉDEX ENTRY PROCESSING
// ====================================

/**
 * Extracts and formats Pokédex entry text from flavor text entries
 * Filters for English entries and cleans up formatting/whitespace
 * @param {Array} flavorTextEntries - Array of flavor text objects from Pokemon species API
 * @returns {string} Formatted Pokédex entry text
 * @example
 * const entries = [
 *   { flavor_text: 'A strange seed was planted...', language: { name: 'en' } }
 * ];
 * const entry = getPokedexEntry(entries);
 */
export function getPokedexEntry(flavorTextEntries) {
  if (!flavorTextEntries || !Array.isArray(flavorTextEntries)) {
    console.warn('getPokedexEntry: Invalid flavor text entries provided');
    return 'No Pokédex entry available.';
  }

  // RegEx pattern to remove various Unicode whitespace and control characters
  const RegEx = /[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000\u000c\n]/g;
  let entriesArray = [];
  let entry = '';
  
  // Extract English language entries
  for (let index in flavorTextEntries) {
    if (flavorTextEntries[index].language.name === 'en') {
      entriesArray.push(flavorTextEntries[index].flavor_text);
    }
  }
  
  if (entriesArray.length === 0) {
    return 'No English Pokédex entry available.';
  }
  
  // Select random entry from available English entries
  entry = entriesArray[~~(Math.random() * entriesArray.length)].replaceAll(RegEx, ' ');
  
  // Fix common formatting issues with Pokemon name
  if (entry.includes('POKéMON')) {
    entry = entry.replaceAll('POKéMON', 'Pokémon');
  }
  
  return entry;
}

/**
 * Extracts the genus (species classification) for a Pokemon
 * Filters for English language genus entries
 * @param {Array} genera - Array of genus objects from Pokemon species API
 * @returns {string} English genus classification (e.g., "Seed Pokémon")
 * @example
 * const genera = [
 *   { genus: 'Seed Pokémon', language: { name: 'en' } }
 * ];
 * const genus = getGenus(genera); // Returns "Seed Pokémon"
 */
export function getGenus(genera) {
  if (!genera || !Array.isArray(genera)) {
    console.warn('getGenus: Invalid genera array provided');
    return 'Unknown Pokémon';
  }

  // Find and return English genus entry
  for (let index in genera) {
    if (genera[index].language.name === 'en') {
      return genera[index].genus;
    }
  }
  
  return 'Unknown Pokémon';
}

// ====================================
// UNIT CONVERSION UTILITIES
// ====================================

/**
 * Converts Pokemon height from decimeters to feet and inches
 * Handles both tall Pokemon (feet + inches) and short Pokemon (inches only)
 * @param {number} height - Height in decimeters from Pokemon API
 * @returns {string} Formatted height string (e.g., "5'7\"" or "11\"")
 * @example
 * const height = getHeight(17); // 1.7 meters
 * console.log(height); // "5'7\""
 */
export function getHeight(height) {
  if (typeof height !== 'number' || height < 0) {
    console.warn('getHeight: Invalid height value provided');
    return '0"';
  }

  // Convert decimeters to inches, then calculate feet and remaining inches
  let feet = ~~(Math.round(height * 3.93701) / 12); // Floor division for feet
  let inches = Math.round(height * 3.93701) % 12;   // Remainder for inches
  
  // Format based on whether Pokemon is tall enough to show feet
  return feet > 0 ? `${feet}'${inches}"` : `${inches}"`;
}

/**
 * Converts Pokemon weight from hectograms to pounds
 * @param {number} weight - Weight in hectograms from Pokemon API  
 * @returns {string} Weight in pounds formatted to 1 decimal place
 * @example
 * const weight = getWeight(69); // 6.9 kg
 * console.log(weight); // "15.2 lbs"
 */
export function getWeight(weight) {
  if (typeof weight !== 'number' || weight < 0) {
    console.warn('getWeight: Invalid weight value provided');
    return '0.0';
  }

  // Convert hectograms to pounds (1 hectogram = 0.220462 pounds)
  return Math.round((weight / 4.536), 2).toFixed(1);
}

// ====================================
// TYPE SYSTEM PROCESSING
// ====================================

/**
 * Processes Pokemon types and applies visual styling to the interface
 * Sets type badges, background gradients, and handles single vs dual types
 * @param {Array} types - Array of type objects from Pokemon API
 * @returns {Array} Array containing hex color values for both types
 * @example
 * const types = [
 *   { type: { name: 'grass' } },
 *   { type: { name: 'poison' } }
 * ];
 * const colors = getTypes(types); // Returns ['#78C850', '#A040A0']
 */
export function getTypes(types) {
  if (!types || !Array.isArray(types) || types.length === 0) {
    console.warn('getTypes: Invalid types array provided');
    return ['#000000', '#000000'];
  }

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
  if (types.length === 1) {
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
}

// ====================================
// POKÉDEX CONFIGURATION
// ====================================

/**
 * Determines which Pokédex version to use (original 151 or all Pokemon)
 * @param {string} showOnlyOriginalPokemon - String indicating preference for original Pokédex
 * @returns {number} Maximum ID limit for the selected Pokédex version
 * @example
 * const maxId = getPokedexType('true'); // Returns 151
 * const maxId = getPokedexType('false'); // Returns 1025
 */
export function getPokedexType(showOnlyOriginalPokemon) {
  if (showOnlyOriginalPokemon === 'true') {
    MaximumId = OriginalMaximumId; // Limit to original 151
    return MaximumId;
  } else {
    MaximumId = 1025; // Include all generations
    return MaximumId;
  }
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

/**
 * Generates a random Pokemon ID within the current Pokédex range
 * @returns {number} Random Pokemon ID between 1 and MaximumId
 * @example
 * const randomId = getRandomPokemon(); // Returns number between 1-1025
 */
export function getRandomPokemon() {
  return ~~(Math.random() * MaximumId) + 1; // Bitwise floor for performance
}

/**
 * Capitalize the first letter of a string
 * @param {string} string - String to capitalize
 * @returns {string} String with first letter capitalized
 * @example
 * const name = capitalizeFirstLetter('pikachu'); // Returns 'Pikachu'
 */
export function capitalizeFirstLetter(string) {
  if (!string || typeof string !== 'string') {
    return string;
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Capitalize text after hyphens in Pokemon names
 * @param {string} hyphenatedString - String that may contain hyphens
 * @returns {string} String with proper capitalization after hyphens
 * @example
 * const name = capitalizeAfterHyphen('ho-oh'); // Returns 'Ho-Oh'
 */
export function capitalizeAfterHyphen(hyphenatedString) {
  if (!hyphenatedString || typeof hyphenatedString !== 'string') {
    return hyphenatedString;
  }
  
  return hyphenatedString
    .split('-')
    .map(part => capitalizeFirstLetter(part))
    .join('-');
}

/**
 * Handles special punctuation and formatting for Pokemon names
 * Corrects common naming conventions and special characters
 * @param {string} name - Raw Pokemon name from API
 * @returns {string} Properly formatted Pokemon name with correct punctuation
 * @example
 * const name = punctuationNameCheck('mr-mime'); // Returns 'Mr. Mime'
 */
export function punctuationNameCheck(name) {
  if (!name || typeof name !== 'string') {
    return name;
  }

  // Apply hyphen capitalization first
  name = capitalizeAfterHyphen(name);
  
  // Handle specific Pokemon name formatting cases
  return name.toLowerCase().includes('mr-') ? name.replace(/mr-/i, 'Mr. ') :  // Mr. Mime (122) / Mr. Rime (866)
    name.includes('-Jr') ? name.replace('-Jr', ' Jr.') :                      // Mime Jr. (439)
    name.includes('-Phd') ? name.replace('-Phd', ' Ph.D.') :                  // Pikachu Ph.D. (25)
    name.includes('hd') ? name.replace('hd', `h'd`) :                         // Farfetch'd (83) / Sirfetch'd (865)
    name.includes('o-O') ? name.replace('o-O', 'o-o') :                       // Kommo-o (784)
    name.toLowerCase().includes('type-null') ? 'Type: Null' :                 // Type: Null (772)
    name.toLowerCase().includes('nidoran-f') ? 'Nidoran♀' :                   // Nidoran♀ (29)
    name.toLowerCase().includes('nidoran-m') ? 'Nidoran♂' :                   // Nidoran♂ (32)
    name.toLowerCase().includes('flabebe') ? 'Flabébé' :                      // Flabébé (669)
    name;
}

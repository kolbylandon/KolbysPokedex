'use strict';
import { populatePage } from './pokemon.js';
import { capitalizeFirstLetter, punctuationNameCheck, showToast } from './helpers.js';

const ApiAddress = 'https://pokeapi.co/api/v2';

// Request cache for better performance
const REQUEST_CACHE = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Batch request queue to reduce API calls
const REQUEST_QUEUE = new Map();
let REQUEST_TIMEOUT = null;

async function fetchJson(url) {
  try {
    // Check cache first
    const cached = REQUEST_CACHE.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const response = await fetch(url);
    if (!response.ok) throw response;
    
    const data = await response.json();
    
    // Cache the response
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

function handleError(exception) {
  const ErrorMessage = `Line Number: ${exception.lineNumber || ''}\n\nMessage: ${exception.message || exception.statusText}\n\nStack: ${exception.stack || ''}`;
  showToast(ErrorMessage);
  console.table(exception);
} //fetchJson

async function requestPokemon(id, visibility) {
  try {
    // Use Promise.all for parallel requests to improve performance
    const [pokemonResponse, speciesResponse] = await Promise.all([
      fetchJson(`${ApiAddress}/pokemon/${id}`),
      fetchJson(`${ApiAddress}/pokemon-species/${id}`)
    ]);
    
    populatePage(pokemonResponse, speciesResponse, visibility);
  } catch(exception) {
    // Error handled in fetchJson
  }
} //requestPokemon

async function requestAbilityEffect(url, listItem, name) {
  try {
    const abilityEffectResponse = await fetchJson(url);
    const entry = abilityEffectResponse.flavor_text_entries.find(e => e.language.name === 'en');
    if(entry) {
      name = name.replaceAll('-', ' ');
      let flavorText = entry.flavor_text.replaceAll('\ufffd', 'é');
      listItem.innerHTML = `<b><u>${name}</u></b>- ${flavorText}`;
    }
  } catch (exception) {}
} //requestAbilityEffect

async function requestHeldItem(url, listItem, name) {
  try {
    const heldItemResponse = await fetchJson(url);
    const entry = heldItemResponse.flavor_text_entries.find(e => e.language.name === 'en');
    if(entry) {
      name = name.replaceAll('-', ' ');
      listItem.innerHTML = `<b><u>${name}</u></b>- ${entry.text}`;
    }
  } catch (exception) {}
} //requestHeldItem

async function requestForm(url, listItem) {
  try {
    const formsResponse = await fetchJson(url);
    formsResponse.forms.forEach(form => {
      let name = punctuationNameCheck(form.name);
      if(!name.includes('kommo-o')) {
        name = name.replaceAll('-', ' ');
      } else if(name === 'kommo-o') {
        name = 'kommo-o';
      } else {
        name = 'kommo-o Totem';
      }
      listItem.innerText = capitalizeFirstLetter(name);
    });
  } catch (exception) {}
} //requestForm

const typeMap = {
  normal: 1, fighting: 2, flying: 3, poison: 4, ground: 5, rock: 6, bug: 7, ghost: 8, steel: 9,
  fire: 10, water: 11, grass: 12, electric: 13, psychic: 14, ice: 15, dragon: 16, dark: 17, fairy: 18
}; //typeMap

async function requestType(type) {
  try {
    if(typeof type === 'string' && typeMap[type.toLowerCase()]) {
      type = typeMap[type.toLowerCase()];
    }
    const typeResponse = await fetchJson(`${ApiAddress}/type/${type}`);
    typeResponse.pokemon.forEach(pokemon => {
      let name = punctuationNameCheck(pokemon.pokemon.name).replaceAll('-', ' ');
      console.table(name);
    });
  } catch(exception) {
    console.clear();
  }
} //requestType

export {
  requestPokemon, requestAbilityEffect, requestHeldItem, requestForm, requestType
};
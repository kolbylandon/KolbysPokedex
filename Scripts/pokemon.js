'use strict';
import { 
  convertHexToRgba, getAbilityList, getElementVisibility, getFormList, getGenus,
  getHeight, getHeldItemList, getLargestStat, getPokedexEntry, getStatTotal, getTypes, 
  getWeight, makeButtonsDisappear, punctuationNameCheck, populateLocalStorage, capitalizeFirstLetter,
} from './helpers.js';
import { 
  displayStatsChart, 
} from './statsChart.js';

// Get references from DOM directly instead of importing from main.js to avoid circular dependencies
const HiddenElementsArray = Array.from(document.getElementsByClassName('hidden-element'));
const CryButton = document.getElementById('cry-button');
const CryButtonTop = document.getElementById('cry-button-top');

// Function to get device type when needed
function getDeviceType() {
  if (window.pokemonApp && window.pokemonApp.deviceType) {
    return window.pokemonApp.deviceType;
  }
  // Fallback device detection
  const width = window.innerWidth;
  if (width <= 768) return 'mobile';
  if (width <= 1024) return 'tablet';
  return 'desktop';
}

const NumberHeader = document.getElementById('number-header');
const NameHeader = document.getElementById('name-header');
const GenusSubHeader = document.getElementById('genus-sub-header');
const GenerationText = document.getElementById('generation-text');
const PokedexEntryText = document.getElementById('pokedex-entry-text');
const HeightText = document.getElementById('height-text');
const WeightText = document.getElementById('weight-text');
const StatsText = document.getElementById('stats-text');
const DefaultArtworkElement = document.getElementById('default-artwork');
const ShinyArtworkElement = document.getElementById('shiny-artwork');
const DefaultArtworkUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
const ShinyArtworkUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/';
let pokemon = null;

function populatePage(pokemonResponse, speciesResponse, visibility) {
  const statTotal = getStatTotal(pokemonResponse.stats);
  const entry = getPokedexEntry(speciesResponse.flavor_text_entries);
  const height = getHeight(pokemonResponse.height);
  const weight = getWeight(pokemonResponse.weight);
  const genus = getGenus(speciesResponse.genera);
  getPokemonObject(pokemonResponse, speciesResponse, statTotal, entry, height, weight, genus);
  const types = getTypes(pokemon.types);
  const backgroundColor = convertHexToRgba(types[0], 0.35);
  const borderColor = convertHexToRgba(types[1], 0.55);
  const max = getLargestStat(pokemon.statsArray);
  displayStatsChart(backgroundColor, borderColor, pokemon.statsArray, max + 25, pokemon.name);
  displayAttributes();
  makeButtonsDisappear(pokemon.id, pokemon.hasGenderDifferences);
  getAbilityList(pokemon.abilities);
  getHeldItemList(pokemon.heldItems);
  getFormList(pokemon.forms);
  getElementVisibility(HiddenElementsArray, visibility);
  if(entry.includes(pokemon.name)) {
    capitalizeFirstLetter(pokemon.name);
  }
  CryButtonTop.innerText = `${capitalizeFirstLetter(pokemon.name)}'s Cry`;
} //populatePage

function displayAttributes() {
  const deviceType = getDeviceType(); // Get device type when needed
  
  NumberHeader.innerText = `#${pokemon.id} `;
  pokemon.name = punctuationNameCheck(pokemon.name);
  NameHeader.innerText = pokemon.name.toUpperCase();
  GenusSubHeader.innerText = pokemon.genus;
  GenerationText.innerText = pokemon.generation;
  PokedexEntryText.innerText = pokemon.pokedexEntry;
  HeightText.innerText = pokemon.height;
  WeightText.innerText = `${pokemon.weight.substring(0, pokemon.weight.length - 2)} lbs`;
  if(deviceType === 'mobile') {
    WeightText.innerHTML += '<br>';
  }
  StatsText.innerText = `${pokemon.baseStatTotal}`;
  if(deviceType === 'mobile' || deviceType === 'tablet') {
    StatsText.innerHTML += '<br>';
  }
  
  // Set default artwork
  DefaultArtworkElement.setAttribute('src', pokemon.FrontDefaultOfficialArtwork);
  DefaultArtworkElement.setAttribute('alt', 'Official Artwork Not Available');
  DefaultArtworkElement.style.width = DefaultArtworkElement.parentElement.style.width;
  DefaultArtworkElement.style.height = DefaultArtworkElement.parentElement.style.height;
  
  // Set shiny artwork
  ShinyArtworkElement.setAttribute('src', pokemon.FrontShinyOfficialArtwork);
  ShinyArtworkElement.setAttribute('alt', 'Shiny Official Artwork Not Available');
  ShinyArtworkElement.style.width = ShinyArtworkElement.parentElement.style.width;
  ShinyArtworkElement.style.height = ShinyArtworkElement.parentElement.style.height;
  // FrontDefault.setAttribute('src', pokemon.FrontDefaultSprite);
  // FrontDefault.setAttribute('alt', 'Front Sprite Not Available');
  // FrontDefault.style.width = FrontDefault.parentElement.style.width;
  // FrontDefault.style.height = FrontDefault.parentElement.style.height;
  // FrontShiny.setAttribute('src', pokemon.FrontShinySprite);
  // FrontShiny.setAttribute('alt', 'Front Shiny Sprite Not Available');
  // FrontShiny.style.width = FrontShiny.parentElement.style.width;
  // FrontShiny.style.height = FrontShiny.parentElement.style.height;
  // BackDefault.setAttribute('src', pokemon.BackDefaultSprite);
  // BackDefault.setAttribute('alt', 'Back Sprite Not Available');
  // BackDefault.style.width = BackDefault.parentElement.style.width;
  // BackDefault.style.height = BackDefault.parentElement.style.height;
  // BackShiny.setAttribute('src', pokemon.BackShinySprite);
  // BackShiny.setAttribute('alt', 'Back Shiny Sprite Not Available');
  // BackShiny.style.width = BackShiny.parentElement.style.width;
  // BackShiny.style.height = BackShiny.parentElement.style.height;
} //displayAttributes

function getPokemonObject(pokemonResponse, speciesResponse, statTotal, entry, height, weight, genus) {
  pokemon = {
    id: speciesResponse.id,
    name: pokemonResponse.species.name,
    genus: genus,
    abilities: pokemonResponse.abilities,
    heldItems: pokemonResponse.held_items,
    height: height,
    weight: weight,
    isBaby: speciesResponse.is_baby,
    isLegendary: speciesResponse.is_legendary,
    isMythical: speciesResponse.is_mythical,
    types: pokemonResponse.types,
    forms: speciesResponse.varieties,
    cry: pokemonResponse.cries.latest,
    statsArray: pokemonResponse.stats.map(stat => stat.base_stat),
    baseStatTotal: statTotal,
    generation: speciesResponse.generation.name.substring(11).toUpperCase(),
    pokedexEntry: entry,
    // FrontDefaultSprite: pokemonResponse.sprites.front_default,
    // BackDefaultSprite: pokemonResponse.sprites.back_default,
    // FrontShinySprite: pokemonResponse.sprites.front_shiny,
    // BackShinySprite: pokemonResponse.sprites.back_shiny,
    FrontDefaultOfficialArtwork: `${DefaultArtworkUrl}${speciesResponse.id}.png`,
    FrontShinyOfficialArtwork: `${ShinyArtworkUrl}${speciesResponse.id}.png`,
    hasGenderDifferences: speciesResponse.has_gender_differences,
    // frontFemaleSprite: null,
    // backFemaleSprite: null,
    // frontFemaleShinySprite: null,
    // backFemaleShinySprite: null,
  };
  // setGenderDifferenceSprites(pokemon, pokemonResponse);
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
  populateLocalStorage(pokemon.id);
  console.table(pokemon);
  return pokemon;
} //getPokemonObject

function setGenderDifferenceSprites(pokemonObj, pokemonResponse) {
  if (pokemonObj.hasGenderDifferences) {
    pokemonObj.frontFemaleSprite = pokemonResponse.sprites.front_female;
    pokemonObj.backFemaleSprite = pokemonResponse.sprites.back_female;
    pokemonObj.frontFemaleShinySprite = pokemonResponse.sprites.front_shiny_female;
    pokemonObj.backFemaleShinySprite = pokemonResponse.sprites.back_shiny_female;
  }
} //setGenderDifferenceSprites

export {
  populatePage, pokemon, 
};

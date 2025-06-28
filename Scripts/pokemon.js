'use strict';
import { 
  convertHexToRgba, getAbilityList, getElementVisibility, getFormList, getGenus,
  getHeight, getHeldItemList, getLargestStat, getPokedexEntry, getStatTotal, getTypes, 
  getWeight, makeButtonsDisappear, punctuationNameCheck, populateLocalStorage, capitalizeFirstLetter,
} from './helpers.js';
import { 
  displayStatsChart, 
} from './statsChart.js';
import { 
  deviceType, HiddenElementsArray, CryButton, CryButtonTop,
} from './main.js';

const NumberHeader = document.getElementById('number-header');
const NameHeader = document.getElementById('name-header');
const GenusSubHeader = document.getElementById('genus-sub-header');
const GenerationText = document.getElementById('generation-text');
const PokedexEntryText = document.getElementById('pokedex-entry-text');
const HeightText = document.getElementById('height-text');
const WeightText = document.getElementById('weight-text');
const StatsText = document.getElementById('stats-text');
const FrontDefault = document.getElementById('front-default');
const FrontShiny = document.getElementById('front-shiny');
const BackDefault = document.getElementById('back-default');
const BackShiny = document.getElementById('back-shiny');
const DefaultArtwork = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
const ShinyArtwork = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/';
let pokemon = null;
let spritesArray = null;

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
  if (entry.includes(pokemon.name)) {
    capitalizeFirstLetter(pokemon.name);
  }
  CryButtonTop.innerText = `${capitalizeFirstLetter(pokemon.name)}'s Cry`;
}

function displayAttributes() {
  NumberHeader.innerText = `#${pokemon.id} `;
  pokemon.name = punctuationNameCheck(pokemon.name);
  NameHeader.innerText = pokemon.name.toUpperCase();
  GenusSubHeader.innerText = pokemon.genus;
  GenerationText.innerText = pokemon.generation;
  PokedexEntryText.innerText = pokemon.pokedexEntry;
  HeightText.innerText = pokemon.height;
  WeightText.innerText = `${pokemon.weight.substring(0, pokemon.weight.length - 2)} lbs`;
  if (deviceType === 'mobile') {
    WeightText.innerHTML += '<br>';
  }
  StatsText.innerText = `${pokemon.baseStatTotal}`;
  if (deviceType === 'mobile' || deviceType === 'tablet') {
    StatsText.innerHTML += '<br>';
  }
  FrontDefault.setAttribute('src', pokemon.FrontDefaultSprite);
  FrontDefault.setAttribute('alt', 'Front Sprite Not Available');
  FrontDefault.style.width = FrontDefault.parentElement.style.width;
  FrontDefault.style.height = FrontDefault.parentElement.style.height;
  FrontShiny.setAttribute('src', pokemon.FrontShinySprite);
  FrontShiny.setAttribute('alt', 'Front Shiny Sprite Not Available');
  FrontShiny.style.width = FrontShiny.parentElement.style.width;
  FrontShiny.style.height = FrontShiny.parentElement.style.height;
  BackDefault.setAttribute('src', pokemon.BackDefaultSprite);
  BackDefault.setAttribute('alt', 'Back Sprite Not Available');
  BackDefault.style.width = BackDefault.parentElement.style.width;
  BackDefault.style.height = BackDefault.parentElement.style.height;
  BackShiny.setAttribute('src', pokemon.BackShinySprite);
  BackShiny.setAttribute('alt', 'Back Shiny Sprite Not Available');
  BackShiny.style.width = BackShiny.parentElement.style.width;
  BackShiny.style.height = BackShiny.parentElement.style.height;
}

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
    FrontDefaultSprite: pokemonResponse.sprites.front_default,
    BackDefaultSprite: pokemonResponse.sprites.back_default,
    FrontShinySprite: pokemonResponse.sprites.front_shiny,
    BackShinySprite: pokemonResponse.sprites.back_shiny,
    FrontDefaultOfficialArtwork: `${DefaultArtwork}${speciesResponse.id}.png`,
    FrontShinyOfficialArtwork: `${ShinyArtwork}${speciesResponse.id}.png`,
    hasGenderDifferences: speciesResponse.has_gender_differences,
    frontFemaleSprite: null,
    backFemaleSprite: null,
    frontFemaleShinySprite: null,
    backFemaleShinySprite: null,
  };
  setGenderDifferenceSprites(pokemon, pokemonResponse);
  spritesArray = [
    pokemon.FrontDefaultSprite,
    pokemon.BackDefaultSprite,
    pokemon.FrontShinySprite,
    pokemon.BackShinySprite,
    pokemon.FrontDefaultOfficialArtwork,
    pokemon.FrontShinyOfficialArtwork,
    pokemon.frontFemaleSprite,
    pokemon.backFemaleSprite,
    pokemon.frontFemaleShinySprite,
    pokemon.backFemaleShinySprite
  ];
  populateLocalStorage(pokemon.id);
  console.table(pokemon);
  return pokemon;
}

function setGenderDifferenceSprites(pokemonObj, pokemonResponse) {
  if (pokemonObj.hasGenderDifferences) {
    pokemonObj.frontFemaleSprite = pokemonResponse.sprites.front_female;
    pokemonObj.backFemaleSprite = pokemonResponse.sprites.back_female;
    pokemonObj.frontFemaleShinySprite = pokemonResponse.sprites.front_shiny_female;
    pokemonObj.backFemaleShinySprite = pokemonResponse.sprites.back_shiny_female;
  }
}

export {
  populatePage, pokemon, 
};

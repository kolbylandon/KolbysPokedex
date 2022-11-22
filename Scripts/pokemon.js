'use strict';
import { convertHexToRgba, getAbilityList, getElementVisibility, getFormList, getGenus, 
  getHeight, getHeldItemList, getLargestStat, getPokedexEntry, getStatTotal, getTypes, 
  getWeight, makeButtonsDisappear, punctuationNameCheck, populateLocalStorage, } from './helpers.js';
import { displayStatsChart, } from './statsChart.js';
import { deviceType, HiddenElementsArray, } from './main.js';

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
let pokemon = null;

function populatePage(pokemonResponse, speciesResponse, visibility) {
  let statTotal = getStatTotal(pokemonResponse.stats);
  let entry = getPokedexEntry(speciesResponse.flavor_text_entries);
  let height = getHeight(pokemonResponse.height);
  let weight = getWeight(pokemonResponse.weight);
  let genus = getGenus(speciesResponse.genera);
  getPokemonObject(pokemonResponse, speciesResponse, statTotal, entry, height, weight, genus);
  let types = getTypes(pokemon.types);
  let backgroundColor =  convertHexToRgba(types[0], 0.35)
  let borderColor = convertHexToRgba(types[1], 0.55)
  let max = getLargestStat(pokemon.statsArray);
  displayStatsChart(backgroundColor, borderColor, pokemon.statsArray, max + 25, pokemon.name);
  displayAttributes();
  makeButtonsDisappear(pokemon.id, pokemon.hasGenderDifferences);
  getAbilityList(pokemon.abilities);
  getHeldItemList(pokemon.heldItems);
  getFormList(pokemon.forms);
  getElementVisibility(HiddenElementsArray, visibility);
} //populatePage

function displayAttributes() {
  NumberHeader.innerText = `#${pokemon.id} `;
  pokemon.name = punctuationNameCheck(pokemon.name);
  NameHeader.innerText = pokemon.name.toUpperCase();
  GenusSubHeader.innerText = `The ${pokemon.genus}`;
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
    statsArray: [pokemonResponse.stats[0].base_stat, pokemonResponse.stats[1].base_stat, 
      pokemonResponse.stats[2].base_stat, pokemonResponse.stats[3].base_stat, 
      pokemonResponse.stats[4].base_stat, pokemonResponse.stats[5].base_stat],
    baseStatTotal: statTotal,
    generation: speciesResponse.generation.name.substring(11).toUpperCase(),
    pokedexEntry: entry,
    FrontDefaultSprite: pokemonResponse.sprites.front_default,
    BackDefaultSprite: pokemonResponse.sprites.back_default,
    FrontShinySprite: pokemonResponse.sprites.front_shiny,
    BackShinySprite: pokemonResponse.sprites.back_shiny,
    hasGenderDifferences: speciesResponse.has_gender_differences,
  };
  checkForGenderDifferences(pokemonResponse);
  populateLocalStorage(pokemon.id);
  return pokemon;
} //getPokemonObject

function checkForGenderDifferences(pokemonResponse) {
  if(pokemon.hasGenderDifferences) {
    pokemon.frontFemaleSprite = pokemonResponse.sprites.front_female;
    pokemon.backFemaleSprite = pokemonResponse.sprites.back_female;
    pokemon.frontFemaleShinySprite = pokemonResponse.sprites.front_shiny_female;
    pokemon.backFemaleShinySprite = pokemonResponse.sprites.back_shiny_female;
  } else {
    pokemon.frontFemaleSprite = null;
    pokemon.backFemaleSprite = null;
    pokemon.frontFemaleShinySprite = null;
    pokemon.backFemaleShinySprite = null;
  }
} //checkForGenderDifferences

export {
  populatePage, pokemon, 
};

'use strict';
import * as helpers from './helpers.js';
import * as statsChart from './statsChart.js';
import * as main from './main.js';

const pokeballPath = '../Images/pokeball.png';
const numberHeader = document.getElementById('number-header');
const nameHeader = document.getElementById('name-header');
const genusSubHeader = document.getElementById('genus-sub-header');
const generationText = document.getElementById('generation-text');
const pokedexEntryText = document.getElementById('pokedex-entry-text');
const heightText = document.getElementById('height-text');
const weightText = document.getElementById('weight-text');
const statsText = document.getElementById('stats-text');
const frontDefault = document.getElementById('front-default');
const frontShiny = document.getElementById('front-shiny');
const backDefault = document.getElementById('back-default');
const backShiny = document.getElementById('back-shiny');
let pokemon = null;

function populatePage(pokemonResponse, speciesResponse, state) {
  let statTotal = helpers.getStatTotal(pokemonResponse.stats);
  let entry = helpers.getPokedexEntry(speciesResponse.flavor_text_entries);
  let height = helpers.getHeight(pokemonResponse.height);
  let weight = helpers.getWeight(pokemonResponse.weight);
  let genus = helpers.getGenus(speciesResponse.genera);
  getPokemonObject(pokemonResponse, speciesResponse, statTotal, entry, height, weight, genus);
  let types = helpers.getTypes(pokemon.types);
  let backgroundColor =  helpers.convertHexToRgba(types[0], 0.35)
  let borderColor = helpers.convertHexToRgba(types[1], 0.55)
  let statsArray = [pokemon.hp, pokemon.attack, pokemon.defense, pokemon.spAttack, pokemon.spDefense, pokemon.speed];
  let max = helpers.getLargestStat(statsArray);
  statsChart.displayStatsChart(backgroundColor, borderColor, statsArray, max + 25);
  displayAttributes();
  helpers.makeButtonsDisappear(pokemon.id);
  helpers.getAbilityList(pokemon.abilities);
  helpers.getElementState(main.hiddenElements, state);
}

function displayAttributes() {
  numberHeader.innerText = `#${pokemon.id} `;
  pokemon.name = pokemon.name.includes('mr-') ? pokemon.name.replace('mr-', 'mr. ') :
    pokemon.name.includes('-jr') ? pokemon.name.replace('-jr', ' jr.') :
    pokemon.name;
  nameHeader.innerText = `${pokemon.name.toUpperCase()}`;
  genusSubHeader.innerText = `The ${pokemon.genus}`;
  generationText.innerText = `${pokemon.generation}`;
  pokedexEntryText.innerText = `${pokemon.pokedexEntry}`;
  heightText.innerText = `${pokemon.height}`;
  weightText.innerText = `${pokemon.weight.substring(0, pokemon.weight.length - 2)} lbs`;
  statsText.innerText = `${pokemon.baseStatTotal}`;
  if(main.deviceType === 'mobile') {
    weightText.innerHTML += '<br>';
    statsText.innerHTML += '<br>';
  }
  if(main.deviceType === 'tablet') {
    statsText.innerHTML += '<br>';
  }
  frontDefault.setAttribute('src', pokemon.frontDefaultSprite);
  frontDefault.style.width = frontDefault.parentElement.style.width;
  frontDefault.style.height = frontDefault.parentElement.style.height;
  frontShiny.setAttribute('src', pokemon.frontShinySprite);
  pokemon.backDefaultSprite = pokemon.backDefaultSprite === null ? pokeballPath : pokemon.backDefaultSprite;
  frontShiny.style.width = frontShiny.parentElement.style.width;
  frontShiny.style.height = frontShiny.parentElement.style.height;
  backDefault.setAttribute('src', pokemon.backDefaultSprite);
  pokemon.backShinySprite = pokemon.backShinySprite === null ? pokeballPath : pokemon.backShinySprite;
  backDefault.style.width = backDefault.parentElement.style.width;
  backDefault.style.height = backDefault.parentElement.style.height;
  backShiny.setAttribute('src', pokemon.backShinySprite);
  backShiny.style.width = backShiny.parentElement.style.width;
  backShiny.style.height = backShiny.parentElement.style.height;
}

function getPokemonObject(pokemonResponse, speciesResponse, statTotal, entry, height, weight, genus) {
  pokemon = {
    id: pokemonResponse.id,
    name: pokemonResponse.name,
    genus: genus,
    abilities: pokemonResponse.abilities,
    heldItems: pokemonResponse.held_items,
    height: height,
    weight: weight,
    isBaby: speciesResponse.is_baby,
    isLegendary: speciesResponse.is_legendary,
    isMythical: speciesResponse.is_mythical,
    types: pokemonResponse.types,
    hp: pokemonResponse.stats[0].base_stat,
    attack: pokemonResponse.stats[1].base_stat,
    defense: pokemonResponse.stats[2].base_stat,
    spAttack: pokemonResponse.stats[3].base_stat,
    spDefense: pokemonResponse.stats[4].base_stat,
    speed: pokemonResponse.stats[5].base_stat,
    hasGenderDifferences: speciesResponse.has_gender_differences,
    frontDefaultSprite: pokemonResponse.sprites.front_default,
    backDefaultSprite: pokemonResponse.sprites.back_default,
    frontShinySprite: pokemonResponse.sprites.front_shiny,
    backShinySprite: pokemonResponse.sprites.back_shiny,
    generation: speciesResponse.generation.name.substring(11).toUpperCase(),
    baseStatTotal: statTotal,
    pokedexEntry: entry,
  };
  return pokemon;
}

export {
  populatePage, getPokemonObject, pokemon,
};

import * as helpers from './helpers.js';
import * as statsChart from './statsChart.js';
import * as main from './main.js';

const pokeballPath = '../Images/pokeball.png';
var pokemon = null;

function populatePage(pokemonResponse, speciesResponse, state) {
  let statTotal = helpers.getStatTotal(pokemonResponse.stats);
  let entry = helpers.getPokedexEntry(speciesResponse.flavor_text_entries);
  let height = helpers.getHeight(pokemonResponse.height);
  let weight = helpers.getWeight(pokemonResponse.weight);
  let genus = helpers.getGenus(speciesResponse.genera);
  getPokemonObject(pokemonResponse, speciesResponse, statTotal, entry, height, weight, genus);
  let types = helpers.getTypes(pokemon.types);
  statsChart.displayStatsChart(types, pokemon.hp, pokemon.attack, pokemon.defense, pokemon.spAttack, pokemon.spDefense, pokemon.speed);
  displayAttributes(pokemon);
  helpers.makeButtonsDisappear(pokemon.id);
  helpers.getAbilityList(pokemon.abilities);
  helpers.getElementState(main.hiddenElements, state);
}

function displayAttributes(pokemon) {
  document.getElementById('number-header').innerText = `#${pokemon.id} `;
  pokemon.name = pokemon.name.includes('mr-') ? pokemon.name.replace('mr-', 'mr. ') :
    pokemon.name.includes('-jr') ? pokemon.name.replace('-jr', ' jr.') :
    pokemon.name;
  document.getElementById('name-header').innerText = `${pokemon.name.toUpperCase()}`;
  document.getElementById('genus-sub-header').innerText = `The ${pokemon.genus}`;
  document.getElementById('generation-text').innerText = `${pokemon.generation}`;
  document.getElementById('pokedex-entry-text').innerText = `${pokemon.pokedexEntry}`;
  document.getElementById('height-text').innerText = `${pokemon.height}`;
  document.getElementById('weight-text').innerText = `${pokemon.weight.substring(0, pokemon.weight.length - 2)}`;
  if(main.deviceType === 'mobile') {
    document.getElementById('weight-text').innerText += '<br>';
  }
  document.getElementById('stats-text').innerText = `${pokemon.baseStatTotal}`;
  if(main.deviceType === 'desktop') {
    document.getElementById('stats-text').innerText += '<br>';
  }
  // if(main.deviceType === 'mobile' || main.deviceType === 'tablet') {
  //   if(main.deviceType === 'mobile') {
  //     document.getElementById('weight-text').innerHTML = `<span id='weight-text' class='text'>${pokemon.weight.substring(0, pokemon.weight.length - 2)} lbs</span><br>`;
  //   } else {
  //     document.getElementById('weight-text').innerHTML = `<span id='weight-text' class='text'>${pokemon.weight.substring(0, pokemon.weight.length - 2)} lbs</span>`;
  //   }
  //   document.getElementById('stats-text').innerHTML = `<span id='stats-text' class='text'>${pokemon.baseStatTotal}</span><br>`;
  // } else {
  //   document.getElementById('weight-text').innerHTML = `<span id='weight-text' class='text'>${pokemon.weight.substring(0, pokemon.weight.length - 2)} lbs</span>`;
  //   document.getElementById('stats-text').innerHTML = `<span id='stats-text' class='text'>${pokemon.baseStatTotal}</span>`;
  // }
  document.getElementById('front-default').setAttribute('src', pokemon.frontDefaultSprite);
  document.getElementById('front-shiny').setAttribute('src', pokemon.frontShinySprite);
  pokemon.backDefaultSprite = pokemon.backDefaultSprite === null ? pokeballPath : pokemon.backDefaultSprite;
  document.getElementById('back-default').setAttribute('src', pokemon.backDefaultSprite);
  pokemon.backShinySprite = pokemon.backShinySprite === null ? pokeballPath : pokemon.backShinySprite;
  document.getElementById('back-shiny').setAttribute('src', pokemon.backShinySprite);
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
  console.clear();
  console.table(pokemon);
  return pokemon;
}

export {
  populatePage, getPokemonObject, pokemon,
};

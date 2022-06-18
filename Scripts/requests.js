'use strict';
import * as pokemon from './pokemon.js';

const headers = {
  accept: 'text/html,application/xhtml+xml',
  method: 'GET',
  connection: 'keep-alive',
  host: 'pokeapi.co',
};

async function requestPokemon(pokedexNumber, state) {
  let pokemonResponse  = null;
  // let speciesResponse = null;
  await fetch(`https://pokeapi.co/api/v2/pokemon/${pokedexNumber}/`, headers)
  .then(response => {
    return response.ok ? Promise.resolve(response.json()) : Promise.reject(response);
  })
  .then(data => {
    pokemonResponse = data;
    return fetch(pokemonResponse.species.url, headers);
  })
  .then(response => {
    return response.ok ? Promise.resolve(response.json()) : Promise.reject(response);
  })
  .then(speciesResponse => {
    return pokemon.populatePage(pokemonResponse, speciesResponse, state);
  })
  .catch(exception => {
    const errorMessage = `Status ${exception.status}: '${exception.url}' is ${exception.statusText}`;
    alert(errorMessage); //!Replace with a modal or toast
    console.error(errorMessage);
  });
}

async function requestAbilityEffect(url, listItem, name) {
  // let abilityEffectResponse = null;
  await fetch(url, headers)
  .then(response => {
    return response.ok ? Promise.resolve(response.json()) : Promise.reject(response);
  })
  .then(abilityEffectResponse => {
    for(let index in abilityEffectResponse.flavor_text_entries) {
      if(abilityEffectResponse.flavor_text_entries[index].language.name === 'en') {
        listItem.innerHTML = `<u>${name}:</u> ${abilityEffectResponse.flavor_text_entries[index].flavor_text}`;
      }
    }
  })
  .catch(exception => {
    const errorMessage = `Status ${exception.status}: '${exception.url}' is ${exception.statusText}`;
    alert(errorMessage); //!Replace with a modal or toast
    console.error(errorMessage);
  });
}

export {
  requestPokemon, requestAbilityEffect,
};

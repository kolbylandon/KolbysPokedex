'use strict';
import * as pokemon from './pokemon.js';
import * as helpers from './helpers.js';

const headers = {
  accept: 'text/html,application/xhtml+xml',
  method: 'GET',
  connection: 'keep-alive',
  host: 'pokeapi.co',
};

async function requestPokemon(pokedexNumber, state) {
  let pokemonResponse  = null;
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
    const errorMessage = `Line Number: ${exception.lineNumber}\n\nMessage: ${exception.message}\n\nStack: ${exception.stack}`;
    helpers.showToast(errorMessage);
    console.error(errorMessage);
  });
}

async function requestAbilityEffect(url, listItem, name) {
  await fetch(url, headers)
  .then(response => {
    return response.ok ? Promise.resolve(response.json()) : Promise.reject(response);
  })
  .then(abilityEffectResponse => {
    abilityEffectResponse.flavor_text_entries.forEach(element => {
      if(element.language.name === 'en') {
        listItem.innerHTML = `<u>${name}:</u> ${element.flavor_text}`;
      }
    });
    for(let index in abilityEffectResponse.effect_entries) {
      if(abilityEffectResponse.effect_entries[index].language.name === 'en') {
        console.info(`${name}: ${abilityEffectResponse.effect_entries[index].short_effect}`);
      }
    }
  })
  .catch(exception => {
    const errorMessage = `Line Number: ${exception.lineNumber}\n\nMessage: ${exception.message}\n\nStack: ${exception.stack}`;
    helpers.showToast(errorMessage);
    console.error(errorMessage);
  });
}

export {
  requestPokemon, requestAbilityEffect,
};

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
  await fetch(`https://pokeapi.co/api/v2/pokemon/${pokedexNumber}`, headers)
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
    console.table(exception);
  });
}

async function requestAbilityEffect(url, listItem, name) {
  await fetch(url, headers)
  .then(response => {
    return response.ok ? Promise.resolve(response.json()) : Promise.reject(response);
  })
  .then(abilityEffectResponse => {
    abilityEffectResponse.flavor_text_entries.forEach(entry => {
      if(entry.language.name === 'en') {
        listItem.innerHTML = `<u>${name}-</u> ${entry.flavor_text}`;
        return;
      }
    });
  })
  .catch(exception => {
    const errorMessage = `Line Number: ${exception.lineNumber}\n\nMessage: ${exception.message}\n\nStack: ${exception.stack}`;
    helpers.showToast(errorMessage);
    console.table(exception);
  });
}

async function requestHeldItem(url, listItem, name) {
  await fetch(url, headers)
  .then(response => {
    return response.ok ? Promise.resolve(response.json()) : Promise.reject(response);
  })
  .then(heldItemResponse => {
    heldItemResponse.effect_entries.forEach(entry => {
      if(entry.language.name === 'en') {
        listItem.innerHTML = `<u>${name}-</u> ${entry.effect}`;
        return;
      }
    });
  })
  .catch(exception => {
    const errorMessage = `Line Number: ${exception.lineNumber}\n\nMessage: ${exception.message}\n\nStack: ${exception.stack}`;
    helpers.showToast(errorMessage);
    console.table(exception);
  });
}

async function requestForm(url, listItem) {
  await fetch(url, headers)
  .then(response => {
    return response.ok ? Promise.resolve(response.json()) : Promise.reject(response);
  })
  .then(formsResponse => {
    formsResponse.forms.forEach(form => {
      let name = helpers.upperCaseAfterHyphen(helpers.capitalize(form.name));
      name = name.replaceAll('-', ' ');
      listItem.innerText = name;
      return;
    });
  })
  .catch(exception => {
    const errorMessage = `Line Number: ${exception.lineNumber}\n\nMessage: ${exception.message}\n\nStack: ${exception.stack}`;
    helpers.showToast(errorMessage);
    console.table(exception);
  });
}

export {
  requestPokemon, requestAbilityEffect, requestHeldItem, requestForm,
};

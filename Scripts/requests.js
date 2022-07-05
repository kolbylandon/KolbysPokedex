'use strict';
import { populatePage, } from './pokemon.js';
import { capitalize, punctuationNameCheck, showToast, } from './helpers.js';

const Headers = {
  'accept': 'text/html,application/xhtml+xml',
  'accept-encoding': 'gzip, deflate, compress, br',
  'connection': 'keep-alive',
  'content-encoding': 'br',
  'host': 'pokeapi.co',
  'method': 'GET',
};

async function requestPokemon(id, visibility) {
  let pokemonResponse  = null;
  await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`, Headers)
  .then(response => {
    return response.ok ? Promise.resolve(response.json()) : Promise.reject(response);
  })
  .then(data => {
    pokemonResponse = data;
    return fetch(pokemonResponse.species.url, Headers);
  })
  .then(response => {
    return response.ok ? Promise.resolve(response.json()) : Promise.reject(response);
  })
  .then(speciesResponse => {
    return populatePage(pokemonResponse, speciesResponse, visibility);
  })
  .catch(exception => {
    const ErrorMessage = `Line Number: ${exception.lineNumber}\n\nMessage: ${exception.message}\n\nStack: ${exception.stack}`;
    showToast(ErrorMessage);
    console.table(exception);
  });
}

async function requestAbilityEffect(url, listItem, name) {
  await fetch(url, Headers)
  .then(response => {
    return response.ok ? Promise.resolve(response.json()) : Promise.reject(response);
  })
  .then(abilityEffectResponse => {
    abilityEffectResponse.flavor_text_entries.forEach(entry => {
      if(entry.language.name === 'en') {
        name = name.replaceAll('-', ' ');
        listItem.innerHTML = `<u>${name}-</u> ${entry.flavor_text}`;
        return;
      }
    });
  })
  .catch(exception => {
    const ErrorMessage = `Line Number: ${exception.lineNumber}\n\nMessage: ${exception.message}\n\nStack: ${exception.stack}`;
    showToast(ErrorMessage);
    console.table(exception);
  });
}

async function requestHeldItem(url, listItem, name) {
  await fetch(url, Headers)
  .then(response => {
    return response.ok ? Promise.resolve(response.json()) : Promise.reject(response);
  })
  .then(heldItemResponse => {
    heldItemResponse.effect_entries.forEach(entry => {
      if(entry.language.name === 'en') {
        name = name.replaceAll('-', ' ');
        listItem.innerHTML = `<u>${name}-</u> ${entry.effect}`;
        return;
      }
    });
  })
  .catch(exception => {
    const ErrorMessage = `Line Number: ${exception.lineNumber}\n\nMessage: ${exception.message}\n\nStack: ${exception.stack}`;
    showToast(ErrorMessage);
    console.table(exception);
  });
}

async function requestForm(url, listItem) {
  await fetch(url, Headers)
  .then(response => {
    return response.ok ? Promise.resolve(response.json()) : Promise.reject(response);
  })
  .then(formsResponse => {
    formsResponse.forms.forEach(form => {
      let name = punctuationNameCheck(form.name);
      name = name.replaceAll('-', ' ');
      listItem.innerText = capitalize(name);
      return;
    });
  })
  .catch(exception => {
    const ErrorMessage = `Line Number: ${exception.lineNumber}\n\nMessage: ${exception.message}\n\nStack: ${exception.stack}`;
    showToast(ErrorMessage);
    console.table(exception);
  });
}

export {
  requestPokemon, requestAbilityEffect, requestHeldItem, requestForm,
};

'use strict';
import * as helpers from './helpers.js';
import * as pokemon from './pokemon.js';

const textbox = document.getElementById('pokemon-textbox');
const goButton = document.getElementById('go-button');
const randomPokemonButton = document.getElementById('random-pokemon-button');
const previousButton = document.getElementById('previous-button');
const nextButton = document.getElementById('next-button');
const readEntryButton = document.getElementById('read-entry-button');
const clearButton = document.getElementById('clear-button');
const hiddenElements = helpers.createArray(document.getElementsByClassName('hidden-element'));
const screenElements = helpers.createArray(document.getElementsByClassName('screen'));
let deviceType = null;

(() => {
  let id = null;
  textbox.focus();
  getSystemInformation();
  goButton.onclick = () => {
    id = textbox.value;
    helpers.stopReadingEntry();
    helpers.generatePokemon(textbox.value, 'visible');
  };
  randomPokemonButton.onclick = () => {
    helpers.stopReadingEntry();
    id = ~~(Math.random() * 898) + 1;
    textbox.value = id;
    helpers.generatePokemon(id, 'visible');
  };
  previousButton.onclick = () => {
    helpers.stopReadingEntry();
    id = pokemon.pokemon.id;
    helpers.generatePokemon(--id, 'visible');
    textbox.value = id;
  };
  nextButton.onclick = () => {
    helpers.stopReadingEntry();
    id = pokemon.pokemon.id;
    helpers.generatePokemon(++id, 'visible');
    textbox.value = id;
  };
  readEntryButton.onclick = () => {
    helpers.readPokedexEntry();
  };
  clearButton.onclick = () => {
    helpers.stopReadingEntry();
    textbox.value = '';
    helpers.getElementState(hiddenElements, 'hidden');
    textbox.focus();
    console.clear();
  };
  textbox.addEventListener('focus', () => {
    textbox.value = '';
  });
  helpers.getElementState(hiddenElements, 'hidden');
}) ();

window.onresize = () => {
  getSystemInformation();
}

function getSystemInformation() {
  deviceType = helpers.getDeviceType();
  helpers.headerLayout(deviceType, goButton, randomPokemonButton, previousButton, nextButton, readEntryButton, clearButton);
}

export {
  hiddenElements, textbox,
  previousButton, nextButton,
  screenElements, deviceType,
}

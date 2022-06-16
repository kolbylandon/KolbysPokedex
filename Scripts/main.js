'use strict'
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
let screenWidth = window.innerWidth;
let deviceType = null;

(() => {
  getSystemInformation();
  goButton.onclick = () => {
    helpers.stopReadingEntry();
    helpers.generatePokemon(textbox.value, 'visible');
  };
  randomPokemonButton.onclick = () => {
    helpers.stopReadingEntry();
    let randomPokemon = ~~(Math.random() * 898) + 1;
    textbox.value = randomPokemon
    helpers.generatePokemon(randomPokemon, 'visible');
  };
  previousButton.onclick = () => {
    helpers.stopReadingEntry();
    let id = pokemon.pokemon.id;
    helpers.generatePokemon(--id, 'visible');
    textbox.value = id;
  };
  nextButton.onclick = () => {
    helpers.stopReadingEntry();
    let id = pokemon.pokemon.id;
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
  screenElements, deviceType
  }

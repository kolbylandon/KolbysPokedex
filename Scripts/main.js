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
const closeButton = document.getElementById('close-button');
const toast = document.getElementById('toast');
const hiddenElements = helpers.createArray(document.getElementsByClassName('hidden-element'));
let deviceType = null;
let id = null;

(() => {
  getSystemInformation();
  if(localStorage.getItem('id')) {
    id = localStorage.getItem('id');
    helpers.generatePokemon(id, 'visible');
  }
  goButton.addEventListener('click', () => {
    id = textbox.value;
    helpers.stopReadingEntry();
    helpers.generatePokemon(id, 'visible');
  });
  randomPokemonButton.addEventListener('click', () => {
    helpers.stopReadingEntry();
    id = helpers.getRandomPokemon();
    textbox.value = id;
    helpers.generatePokemon(id, 'visible');
  });
  previousButton.addEventListener('click', () => {
    helpers.stopReadingEntry();
    id = --pokemon.pokemon.id;
    textbox.value = id;
    helpers.generatePokemon(id, 'visible');
  });
  nextButton.addEventListener('click', () => {
    helpers.stopReadingEntry();
    id = ++pokemon.pokemon.id;
    textbox.value = id;
    helpers.generatePokemon(id, 'visible');
  });
  readEntryButton.addEventListener('click', () => {
    helpers.readPokedexEntry();
  });
  clearButton.addEventListener('click', () => {
    helpers.stopReadingEntry();
    id = null;
    helpers.getElementState(hiddenElements, 'hidden');
    closeButton.click();
    localStorage.removeItem('id');
    console.clear();
  });
  closeButton.addEventListener('click', () => {
    toast.classList.remove('toast-active');
    textbox.focus();
  });
  textbox.addEventListener('focus', () => {
    textbox.value = '';
  });
  textbox.addEventListener('blur', () => {
    if(textbox.value === '') {
      textbox.value = id;
    }
  });
  helpers.getElementState(hiddenElements, 'hidden');
  textbox.focus();
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
  deviceType,
}

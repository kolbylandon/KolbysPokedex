'use strict';
import { createArray, generatePokemon, getElementVisibility, inputCheck,
  getRandomPokemon, readPokedexEntry, Synth, getSystemInformation, 
  validPokedexNumberCheck, } from './helpers.js';
import { pokemon, } from './pokemon.js';

const Textbox = document.getElementById('pokemon-textbox');
const GoButton = document.getElementById('go-button');
const GoButtonTop = document.getElementById('go-button-top');
const RandomPokemonButton = document.getElementById('random-pokemon-button');
const RandomPokemonButtonTop = document.getElementById('random-pokemon-button-top');
const PreviousButton = document.getElementById('previous-button');
const PreviousButtonTop = document.getElementById('previous-button-top');
const NextButton = document.getElementById('next-button');
const NextButtonTop = document.getElementById('next-button-top');
const ReadEntryButton = document.getElementById('read-entry-button');
const ReadEntryButtonTop = document.getElementById('read-entry-button-top');
const RecallButton = document.getElementById('recall-button');
const RecallButtonTop = document.getElementById('recall-button-top');
const FemaleSpritesButton = document.getElementById('female-sprite-button');
const FemaleSpritesButtonTop = document.getElementById('female-sprite-button-top');
const ClearButton = document.getElementById('clear-button');
const ClearButtonTop = document.getElementById('clear-button-top');
const CloseButton = document.getElementById('close-button');
const Toast = document.getElementById('toast');
const StatsChart = document.getElementById('stats-chart');
const SpriteTable = document.getElementById('sprite-table');
const HiddenElementsArray = createArray(document.getElementsByClassName('hidden-element'));
let deviceType = null;
let id = null;

(async () => { //! Combine some of the event listeners into one function
  getSystemInformation();
  if(localStorage.getItem('id')) {
    id = localStorage.getItem('id');
    generatePokemon(id, 'visible', false);
  }
  GoButton.addEventListener('click', () => {
    Synth.cancel();
    id = Textbox.value;
    generatePokemon(id, 'visible', false);
  });
  RandomPokemonButton.addEventListener('click', () => {
    Synth.cancel();
    localStorage.setItem('lastPokemon', Textbox.value);
    id = getRandomPokemon();
    Textbox.value = id;
    generatePokemon(id, 'visible', false);
  });
  PreviousButton.addEventListener('click', () => {
    Synth.cancel();
    localStorage.setItem('lastPokemon', Textbox.value);
    id = --pokemon.id;
    Textbox.value = id;
    generatePokemon(id, 'visible', false);
  });
  NextButton.addEventListener('click', () => {
    Synth.cancel();
    localStorage.setItem('lastPokemon', Textbox.value);
    id = ++pokemon.id;
    Textbox.value = id;
    generatePokemon(id, 'visible', false);
  });
  RecallButton.addEventListener('click', () => {
    Synth.cancel();
    id = localStorage.getItem('lastPokemon');
    Textbox.value = id;
    generatePokemon(id, 'visible', false);
  });
  ReadEntryButton.addEventListener('click', () => {
    readPokedexEntry();
  });
  FemaleSpritesButton.addEventListener('click', () => {
    Synth.cancel();
    alert('Hello! Fix me!'); //! Create a function in helpers.js to add functionality
  });
  ClearButton.addEventListener('click', () => {
    Synth.cancel();
    localStorage.setItem('lastPokemon', Textbox.value);
    id = null;
    getElementVisibility(HiddenElementsArray, 'hidden');
    CloseButton.click();
    localStorage.removeItem('id');
    console.clear();
  });
  CloseButton.addEventListener('click', () => {
    Toast.classList.remove('toast-active');
  });
  Toast.addEventListener('click', () => {
    Toast.classList.remove('toast-active');
    Textbox.focus();
  });
  StatsChart.addEventListener('click', () => {
    window.scroll(0, 0);
  });
  SpriteTable.addEventListener('click', () => {
    window.scroll(0, 0);
  });
  Textbox.addEventListener('input', () => {
    inputCheck(Textbox.value)
    validPokedexNumberCheck();
  });
  Textbox.addEventListener('focus', () => {
    Textbox.value = '';
  });
  Textbox.addEventListener('blur', () => {
    if(Textbox.value === '') {
      Textbox.value = id;
      validPokedexNumberCheck();
    }
  });
  window.onresize = () => {
    getSystemInformation();
  }
  getElementVisibility(HiddenElementsArray, 'hidden');
  Textbox.focus();
})();

export {
  HiddenElementsArray, Textbox, Toast, GoButton, GoButtonTop, RandomPokemonButton, 
  RandomPokemonButtonTop, PreviousButton, PreviousButtonTop, NextButton, NextButtonTop, 
  ReadEntryButton, ReadEntryButtonTop, FemaleSpritesButton, FemaleSpritesButtonTop, 
  RecallButton, RecallButtonTop, ClearButton, ClearButtonTop, deviceType, 
}

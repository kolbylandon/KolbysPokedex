'use strict';
import { createArray, generatePokemon, getElementVisibility, inputCheck,
  getRandomPokemon, readPokedexEntry, Synth, getSystemInformation, 
  validPokedexNumberCheck, } from './helpers.js';
import { pokemon, } from './pokemon.js';

const Textbox = document.getElementById('pokemon-textbox');
const GoButton = document.getElementById('go-button');
const RandomPokemonButton = document.getElementById('random-pokemon-button');
const PreviousButton = document.getElementById('previous-button');
const NextButton = document.getElementById('next-button');
const ReadEntryButton = document.getElementById('read-entry-button');
const FemaleSpritesButton = document.getElementById('female-sprite-button');
const ClearButton = document.getElementById('clear-button');
const CloseButton = document.getElementById('close-button');
const Toast = document.getElementById('toast');
const HiddenElementsArray = createArray(document.getElementsByClassName('hidden-element'));
let deviceType = null;
let id = null;

(() => { //! Combine some of the event listeners into one function
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
    id = getRandomPokemon();
    Textbox.value = id;
    generatePokemon(id, 'visible', false);
  });
  PreviousButton.addEventListener('click', () => {
    Synth.cancel();
    id = --pokemon.id;
    Textbox.value = id;
    generatePokemon(id, 'visible', false);
  });
  NextButton.addEventListener('click', () => {
    Synth.cancel();
    id = ++pokemon.id;
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
  HiddenElementsArray, Textbox, Toast, GoButton, RandomPokemonButton, 
  PreviousButton, NextButton, ReadEntryButton, FemaleSpritesButton, 
  ClearButton, deviceType, 
}

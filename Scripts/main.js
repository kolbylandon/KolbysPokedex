'use strict';
import { createArray, generatePokemon, getDeviceType, getElementVisibility,
  getRandomPokemon, headerLayout, readPokedexEntry, Synth, } from './helpers.js';
import { pokemon } from './pokemon.js';

const Textbox = document.getElementById('pokemon-textbox');
const GoButton = document.getElementById('go-button');
const RandomPokemonButton = document.getElementById('random-pokemon-button');
const PreviousButton = document.getElementById('previous-button');
const NextButton = document.getElementById('next-button');
const ReadEntryButton = document.getElementById('read-entry-button');
const ClearButton = document.getElementById('clear-button');
const CloseButton = document.getElementById('close-button');
const Toast = document.getElementById('toast');
const HiddenElementsArray = createArray(document.getElementsByClassName('hidden-element'));
let skipIdValidation = false;
let deviceType = null;
let id = null;

//! Combine some of the Event listeners into one function
(() => {
  getSystemInformation();
  if(localStorage.getItem('id')) {
    id = localStorage.getItem('id');
    generatePokemon(id, 'visible', skipIdValidation);
  }
  GoButton.addEventListener('click', () => {
    Synth.cancel();
    id = Textbox.value;
    generatePokemon(id, 'visible', skipIdValidation);
  });
  RandomPokemonButton.addEventListener('click', () => {
    Synth.cancel();
    id = getRandomPokemon();
    Textbox.value = id;
    generatePokemon(id, 'visible', skipIdValidation);
  });
  PreviousButton.addEventListener('click', () => {
    Synth.cancel();
    id = --pokemon.id;
    Textbox.value = id;
    generatePokemon(id, 'visible', skipIdValidation);
  });
  NextButton.addEventListener('click', () => {
    Synth.cancel();
    id = ++pokemon.id;
    Textbox.value = id;
    generatePokemon(id, 'visible', skipIdValidation);
  });
  ReadEntryButton.addEventListener('click', () => {
    readPokedexEntry();
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
    Toast.classList.remove('Toast-active');
  });
  Toast.addEventListener('click', () => {
    Toast.classList.remove('Toast-active');
    Textbox.focus();
  });
  Textbox.addEventListener('focus', () => {
    Textbox.value = '';
  });
  Textbox.addEventListener('blur', () => {
    if(Textbox.value === '') {
      Textbox.value = id;
    }
  });
  getElementVisibility(HiddenElementsArray, 'hidden');
  Textbox.focus();
}) ();

window.onresize = () => {
  getSystemInformation();
}

//! Move getSystemInformation to helpers.js
function getSystemInformation() {
  deviceType = getDeviceType();
  headerLayout(deviceType, GoButton, RandomPokemonButton, PreviousButton, NextButton, ReadEntryButton, ClearButton);
}

export {
  HiddenElementsArray, PreviousButton, NextButton, Textbox, Toast, deviceType,
}

'use strict';
import { createArray, generatePokemon, getElementVisibility, getRandomPokemon, 
  startReadingEntry, Synth, inputCheck, validPokedexNumberCheck, showToast, 
  getDeviceType, headerLayout } from './helpers.js';
import { requestType } from './requests.js';

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
// const FemaleSpritesButton = document.getElementById('female-sprite-button');
// const FemaleSpritesButtonTop = document.getElementById('female-sprite-button-top');
const ClearButton = document.getElementById('clear-button');
const ClearButtonTop = document.getElementById('clear-button-top');
const Toast = document.getElementById('toast');
const ToastCloseButton = document.getElementById('toast-close-button');
const NumberHeader = document.getElementById('number-header');
const NameHeader = document.getElementById('name-header');
const PokemonEntryText = document.getElementById('pokedex-entry-text');
const GenusSubHeader = document.getElementById('genus-sub-header');
const StatsChart = document.getElementById('stats-chart');
const SpriteTable = document.getElementById('sprite-table');
const HiddenElementsArray = createArray(document.getElementsByClassName('hidden-element'));
const TypeText = document.getElementById('type-text');
const TypeText2 = document.getElementById('type-text-2');
let deviceType = null;
let id = null;

(() => { //! Combine some of the event listeners into one function
  getSystemInformation();
  checkLocalStorageItems();
  loadLastViewedPokemon();
  GoButton.addEventListener('click', () => {
    buttonClick('Go', true, true);
  });
  RandomPokemonButton.addEventListener('click', () => {
    buttonClick('Random', true, true);
  });
  PreviousButton.addEventListener('click', () => {
    buttonClick('Previous', true, true);
  });
  NextButton.addEventListener('click', () => {
    buttonClick('Next', true, true);
  });
  RecallButton.addEventListener('click', () => {
    buttonClick('Recall', true, true);
  });
  ReadEntryButton.addEventListener('click', () => {
    buttonClick('ReadEntry', false, false);
  });
  // FemaleSpritesButton.addEventListener('click', () => {
  //   buttonClick('FemaleSprites', false, false);
  // });
  ClearButton.addEventListener('click', () => {
    buttonClick('Clear', true, false);
  });
  TypeText.addEventListener('click', () => {
    buttonClick('TypeText', true, false);
  });
  TypeText2.addEventListener('click', () => {
    buttonClick('TypeText2', true, false);
  });
  ToastCloseButton.addEventListener('click', () => {
    buttonClick('ToastClose', true, false);
  });
  Toast.addEventListener('click', () => {
    buttonClick('Toast', true, false);
  });
  StatsChart.addEventListener('click', () => {
    window.scroll(0, 0);
  });
  SpriteTable.addEventListener('click', () => {
    window.scroll(0, 0);
  });
  Textbox.addEventListener('input', () => {
    inputCheck(Textbox.value);
    validPokedexNumberCheck();
  });
  Textbox.addEventListener('focus', () => {
    Textbox.value = '';
    validPokedexNumberCheck();
  });
  Textbox.addEventListener('blur', () => {
    if(Textbox.value === '') {
      Textbox.value = id;
      validPokedexNumberCheck();
    }
  });
  Textbox.addEventListener('keydown', (event) => { //! Fix this
    if(event.key === 'Enter') {
      buttonClick('Enter', true, true);
    }
  });
  window.onresize = () => {
    getSystemInformation();
  }
  getElementVisibility(HiddenElementsArray, 'hidden');
  Textbox.focus();
})();

function getSystemInformation() {
  let deviceType = getDeviceType();
  headerLayout(deviceType);
} //getSystemInformation

function loadLastViewedPokemon() {
  if(localStorage.getItem('id')) {
    id = localStorage.getItem('id');
    generatePokemon(id, 'visible', false);
  }
} //loadLastViewedPokemon

function checkLocalStorageItems() {
  if(localStorage.getItem('id') === localStorage.getItem('lastPokemon')) {
    localStorage.removeItem('lastPokemon');
  }
} //checkLocalStorageItems

function buttonClick(buttonClicked, cancelSynth, callGeneratePokemon) {
  if(cancelSynth) {
    Synth.cancel();
  }
  switch(buttonClicked) {
    case 'Go':
    case 'Enter':
      if(ClearButton.style.display !== 'none') {
        localStorage.setItem('lastPokemon', NumberHeader.innerText.substring(1));
      }
      id = Textbox.value;
      break;
    case 'Random':
      localStorage.setItem('lastPokemon', Textbox.value);
      id = getRandomPokemon();
      Textbox.value = id;
      break;
    case 'Previous':
      localStorage.setItem('lastPokemon', Textbox.value);
      id = (parseInt(Textbox.value) - 1).toString();
      Textbox.value = id;
      break;
    case 'Next':
      localStorage.setItem('lastPokemon', Textbox.value);
      id = (parseInt(Textbox.value) + 1).toString();
      Textbox.value = id;
      break;
    case 'Recall':
      if(localStorage.getItem('lastPokemon') !== null && localStorage.getItem('lastPokemon') !== localStorage.getItem('id') && localStorage.getItem('lastPokemon') !== '') {
        let currentNumber = localStorage.getItem('id');
        id = localStorage.getItem('lastPokemon');
        Textbox.value = id;
        localStorage.setItem('lastPokemon', currentNumber);
        generatePokemon(id, 'visible', false);
      } else {
        showToast('No previous Pokémon to recall.');
      }
      break;
    case 'ReadEntry':
      Synth.speaking ? Synth.cancel() : startReadingEntry(NameHeader.textContent, GenusSubHeader.textContent, PokemonEntryText.textContent);
      break;
    case 'FemaleSprites':
      alert('This feature is not yet implemented.'); //! Create a function in helpers.js to add functionality
      break;
    case 'Clear':
      Textbox.value = '';
      localStorage.setItem('lastPokemon', Textbox.value);
      id = null;
      ToastCloseButton.click();
      getElementVisibility(HiddenElementsArray, 'hidden');
      localStorage.removeItem('id');
      localStorage.removeItem('lastPokemon');
      console.clear();
      break;
    case 'TypeText':
      requestType(TypeText.innerText);
      break;
    case 'TypeText2':
      requestType(TypeText2.innerText);
      break;
    case 'ToastClose':
    case 'Toast':
      Toast.classList.remove('toast-active');
      Textbox.focus();
      break;
  }
  if(callGeneratePokemon) {
    generatePokemon(id, 'visible', false);
  }
} //buttonClick

export {
  HiddenElementsArray, Textbox, Toast, GoButton, GoButtonTop, RandomPokemonButton, 
  RandomPokemonButtonTop, PreviousButton, PreviousButtonTop, NextButton, NextButtonTop, 
  ReadEntryButton, ReadEntryButtonTop, //FemaleSpritesButton, FemaleSpritesButtonTop, 
  RecallButton, RecallButtonTop, ClearButton, ClearButtonTop, deviceType, 
}

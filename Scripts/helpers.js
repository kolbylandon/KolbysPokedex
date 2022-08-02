'use strict';
import { NextButton, PreviousButton, Textbox, Toast, } from './main.js';
import { requestAbilityEffect, requestForm, requestHeldItem, requestPokemon } from './requests.js';

const Synth = window.speechSynthesis;
const SpriteScreen = document.getElementById('sprite-screen');
const TypeText = document.getElementById('type-text');
const TypeText2 = document.getElementById('type-text-2');
const TypeHeader = document.getElementById('type-header');
const InfoScreen = document.getElementById('info-screen');
const StatsScreen = document.getElementById('stats-screen');
const StatsChart = document.getElementById('stats-chart');
const AbilitiesUnorderedList = document.getElementById('abilities-unordered-list');
const AbilitiesHeader = document.getElementById('abilities-header');
const HeldItemsUnorderedList = document.getElementById('held-items-unordered-list');
const FormsUnorderedList = document.getElementById('forms-unordered-list');
const HeldItemsHeader = document.getElementById('held-items-header');
const NameHeader = document.getElementById('name-header');
const FormsHeader = document.getElementById('forms-header');
const PokemonEntryText = document.getElementById('pokedex-entry-text');
const GenusSubHeader = document.getElementById('genus-sub-header');
const ToastText = document.getElementById('toast-text');
const TextColor = '#606060';
const HiddenAbilityTextColor = '#ff6f61';
const MinimumId = 1;
const MaximumId = 905;

function getAbilityList(abilities) {
  AbilitiesHeader.innerText = abilities.length === 1 ? 'Ability:' : 'Abilities:';
  AbilitiesUnorderedList.innerHTML = `<ul id='abilities-unordered-list' class='list-bulleted'></ul>`;
  let counter = 0;
  abilities.forEach(ability => {
    const ListItem = document.createElement('li');
    ListItem.id = `flavor-text-${++counter}`;
    ListItem.classList.add('flavor-text');
    const Name = capitalizeAfterHyphen(ability.ability.name.capitalize());
    requestAbilityEffect(ability.ability.url, ListItem, Name);
    ListItem.style.color = ability.is_hidden === false ? TextColor : HiddenAbilityTextColor;
    AbilitiesUnorderedList.appendChild(ListItem);
  });
}

function getHeldItemList(heldItems) {
  if(heldItems.length === 0) {
    HeldItemsHeader.style.display = 'none';
    HeldItemsUnorderedList.style.display = 'none';
    return;
  } else if(heldItems.length === 1) {
    HeldItemsHeader.innerText = 'Held Item:';
  } else {
    HeldItemsHeader.innerText = 'Held Items:';
  }
  HeldItemsUnorderedList.innerHTML = `<ul id='held-items-unordered-list' class='list-bulleted'></ul>`;
  HeldItemsHeader.style.display = 'block';
  HeldItemsUnorderedList.style.display = 'block';
  let counter = 0;
  heldItems.forEach(heldItem => {
    const ListItem = document.createElement('li');
    ListItem.id = `held-item-text-${++counter}`;
    ListItem.classList.add('held-item-text');
    const Name = capitalizeAfterHyphen(heldItem.item.name.capitalize());
    requestHeldItem(heldItem.item.url, ListItem, Name);
    ListItem.style.color = TextColor;
    HeldItemsUnorderedList.appendChild(ListItem);
  });
}

function getFormList(forms) {
  if(forms.length === 1) {
    FormsHeader.style.display = 'none';
    FormsUnorderedList.style.display = 'none';
    return;
  } else {
    FormsHeader.style.display = 'block';
    FormsUnorderedList.style.display = 'block';
  }
  FormsUnorderedList.innerHTML = `<ul id='forms-unordered-list' class='list-bulleted'></ul>`;
  let counter = 0;
  forms.forEach(form => {
    const ListItem = document.createElement('li');
    ListItem.id = `forms-text-${++counter}`;
    ListItem.classList.add('form-text');
    requestForm(form.pokemon.url, ListItem);
    ListItem.style.color = TextColor;
    FormsUnorderedList.appendChild(ListItem);
    ListItem.addEventListener('click', () => {
      generatePokemon(form.pokemon.url.substring(34).replaceAll('/', ''), 'visible', true);
    });
  });
}

function getStatTotal(stats) {
  let statTotal = 0;
  stats.forEach(stat => {
    statTotal += stat.base_stat;
  });
  return statTotal;
}

function getPokedexEntry(flavorTextEntries) { //! Look at the different english pokemon entries
  const RegEx = /[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000\u000c\n]/g;
  for(let index in flavorTextEntries) { //! Try map instead of for loop
    if(flavorTextEntries[index].language.name === 'en') {
      return flavorTextEntries[index].flavor_text.replaceAll(RegEx, ' ');
    }
  }
}

function getGenus(genera) {
  for(let index in genera) {
    if(genera[index].language.name === 'en') {
      return genera[index].genus;
    }
  }
}

function getHeight(height) {
  let feet = ~~(Math.round(height * 3.93701) / 12);
  let inches = Math.round(height * 3.93701) % 12;
  return feet > 0 ? `${feet}'${inches}"` : `${inches}"`;
}

function getWeight(weight) {
  return Math.round((weight / 4.536), 2).toFixed(1);
}

function punctuationNameCheck(name) {
  name = capitalizeAfterHyphen(name);
  return name.includes('mr-') ? name.replace('mr-', 'Mr. ') : name.includes('-Jr') ? name.replace('-Jr', ' Jr.') : name.includes('hd') ? name.replace('hd', "h'd") : name;
}

function getTypes(types) {
  const FirstType = types[0].type.name;
  let firstColor = getTypeColor(FirstType);
  let firstBorderColor = convertHexToRgba(firstColor, 1);
  TypeText.innerText = FirstType;
  TypeText.style.backgroundColor = convertHexToRgba(firstColor, 0.6);
  let secondColor = null;
  let secondBorderColor = null;
  if(types.length === 1) {
    TypeHeader.innerText = 'Type:';
    TypeText2.hidden = true;
    secondColor = firstColor;
    secondBorderColor = firstBorderColor;
  } else {
    const SecondType = types[1].type.name;
    secondColor = getTypeColor(SecondType);
    secondBorderColor = convertHexToRgba(secondColor, 1);
    TypeText2.innerText = SecondType;
    TypeText2.style.backgroundColor = convertHexToRgba(secondColor, 0.6);
    TypeHeader.innerText = 'Types:';
    TypeText2.hidden = false;
  }
  InfoScreen.style.borderImage = `linear-gradient(${firstBorderColor}, ${secondBorderColor}) 1`;
  SpriteScreen.style.borderImage = `linear-gradient(${firstBorderColor}, ${secondBorderColor}) 1`;
  StatsScreen.style.borderImage = `linear-gradient(${firstBorderColor}, ${secondBorderColor}) 1`;
  return [firstColor, secondColor];
}

function getRandomPokemon() {
  return ~~(Math.random() * MaximumId) + 1;
}

function capitalizeAfterHyphen(hyphenatedString) {
  const RegEx = /\-[a-z]/g;
  return hyphenatedString.replaceAll(RegEx, match => {
    return match.toUpperCase();
  });
}

function convertHexToRgba(color, alpha) {
  let r = (`0x${color.substring(1).split('').join('')}`>>16)&255;
  let g = (`0x${color.substring(1).split('').join('')}`>>8)&255;
  let b = (`0x${color.substring(1).split('').join('')}`)&255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getTypeColor(type) {
  const Types = {
    'normal': '#ADA480',
    'fighting': '#C22F26',
    'flying': '#B49AF6',
    'poison': '#A43FA4',
    'ground': '#DEBE63',
    'rock': '#B49E38',
    'bug': '#A8B531',
    'ghost': '#6E5391',
    'steel': '#B8B5CF',
    'fire': '#F07D33',
    'water': '#6D88F8',
    'grass': '#81CB5B',
    'electric': '#E9D436',
    'psychic': '#FF598D',
    'ice': '#9AD9DA',
    'dragon': '#723EFC',
    'fairy': '#E1A4E1',
    'dark': '#2B1E16',
  };
  return Types[type];
}

function getLargestStat(statsArray) {
  return Math.round(statsArray.reduce((stat, max) => {
    return stat > max ? stat : max;
  }, 0) / 25) * 25;
}

function createArray(elements) {
  let elementArray = [];
  for(let index in elements) {
    elementArray.push(elements[index]);
  }
  return elementArray;
}

function getElementVisibility(elements, visibility) {
  Synth.cancel();
  elements.forEach(element => {
    if(typeof element.style !== 'undefined') {
      element.style.visibility = visibility;
    }
  });
  window.scrollTo(0, 0);
}

function makeButtonsDisappear(id) {
  id === MinimumId ? PreviousButton.style.display = 'none' : PreviousButton.style.display = 'inline-block';
  id === MaximumId ? NextButton.style.display = 'none' : NextButton.style.display = 'inline-block';
}

//! Is there a localStorage.replace() function?
function populateStorage(id) {
  localStorage.removeItem('id');
  localStorage.setItem('id', id);
}

//! Fix generatePokemon
function generatePokemon(id, visibility, skipIdValidation) {
  window.scrollTo(0, 0);
  if(skipIdValidation === false && (id >= MinimumId || id <= MaximumId)) {
    requestPokemon(id, visibility);
    return;
  } else if(skipIdValidation === true) {
    requestPokemon(id, visibility);
    return;
  }
    showToast('Please enter a valid Pokédex number');
}

function readPokedexEntry() {
  Synth.speaking ? Synth.cancel() : startReadingEntry(NameHeader.textContent, GenusSubHeader.textContent, PokemonEntryText.textContent);
}

function showToast(text) {
  ToastText.innerText = text;
  Toast.classList.add('toast-active');
  Textbox.focus();
}

function startReadingEntry(name, genus, entry) {
  Synth.speak(new SpeechSynthesisUtterance(name));
  Synth.speak(new SpeechSynthesisUtterance(genus));
  Synth.pause();
  Synth.resume();
  Synth.speak(new SpeechSynthesisUtterance(entry));
}

function getDeviceType() {
  const Agent = navigator.userAgent;
  if(/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(Agent)) {
    return 'tablet';
  } else if(/Mobile|iP(hone|od)|Android|Blackberry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(Agent)) {
    return 'mobile';
  }
  return 'desktop';
}

function headerLayout(deviceType, goButton, randomPokemonButton, PreviousButton, NextButton, readEntryButton, clearButton) {
  if(deviceType === 'mobile') {
    goButton.innerHTML = '<span class="button-top"><i class="fa-solid fa-magnifying-glass"></i></span>';
    randomPokemonButton.innerHTML = '<span class="button-top"><i class="fa-solid fa-shuffle"></i></span>';
    PreviousButton.innerHTML = '<span class="button-top"><i class="fa-solid fa-angle-left"></i></span>';
    NextButton.innerHTML = '<span class="button-top"><i class="fa-solid fa-angle-right"></i></span>';
    readEntryButton.innerHTML = '<span class="button-top"><i class="fa-solid fa-book-open-reader"></i></span>';
    clearButton.innerHTML = '<span class="button-top"><i class="fa-solid fa-x"></i></span>';
    return;
  } else if(deviceType === 'tablet') {
    randomPokemonButton.innerHTML = '<span class="button-top">Random</span>';
    PreviousButton.innerHTML = '<span class="button-top">Prev</span>';
  } else {
    randomPokemonButton.innerHTML = '<span class="button-top">Random Pokémon</span>';
    PreviousButton.innerHTML = '<span class="button-top">Previous</span>';
  }
  goButton.innerHTML = '<span class="button-top">Go</span>';
  NextButton.innerHTML = '<span class="button-top">Next</span>';
  readEntryButton.innerHTML = '<span class="button-top">Read Entry</span>';
  clearButton.innerHTML = '<span class="button-top"> X </span>';
}

String.prototype.capitalize = function () {
  return `${this.charAt(0).toUpperCase()}${this.slice(1)}`;
}

function capitalize(string) {
  return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
}

export {
  getStatTotal, getPokedexEntry, getElementVisibility,
  convertHexToRgba, getHeight, getWeight, getTypes, punctuationNameCheck,
  getLargestStat, createArray, generatePokemon, makeButtonsDisappear,
  readPokedexEntry, getAbilityList, getGenus, getRandomPokemon,
  headerLayout, getDeviceType, getHeldItemList, showToast, getFormList,
  capitalize, populateStorage, TextColor, StatsChart, Synth, MinimumId, MaximumId,
};

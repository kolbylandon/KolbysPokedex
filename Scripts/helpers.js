'use strict';
import {
  Textbox, Toast, GoButton, RandomPokemonButton, PreviousButton, NextButton,
  RecallButton, ReadEntryButton, //FemaleSpritesButton, 
  ClearButton,
} from './main.js';
import { requestAbilityEffect, requestForm, requestHeldItem, requestPokemon, } from './requests.js';

const Synth = window.speechSynthesis;
const Body = document.body;
const TypeText = document.getElementById('type-text');
const TypeText2 = document.getElementById('type-text-2');
const TypeHeader = document.getElementById('type-header');
const StatsChart = document.getElementById('stats-chart');
const AbilitiesUnorderedList = document.getElementById('abilities-unordered-list');
const AbilitiesHeader = document.getElementById('abilities-header');
const HeldItemsUnorderedList = document.getElementById('held-items-unordered-list');
const FormsUnorderedList = document.getElementById('forms-unordered-list');
const HeldItemsHeader = document.getElementById('held-items-header');
const FormsHeader = document.getElementById('forms-header');
const ToastText = document.getElementById('toast-text');
const TextColor = 'rgba(98, 98, 98, 0.95)'
const HiddenAbilityTextColor = 'rgba(255, 111, 97, 0.95)';
const TransparentColor = 'rgba(0, 0, 0, 0)';
const MinimumId = 1;
let MaximumId = localStorage.getItem('maximumId');

function getAbilityList(abilities) {
  AbilitiesHeader.innerText = abilities.length === 1 ? 'Ability:' : 'Abilities:';
  AbilitiesUnorderedList.innerHTML = `<ul id='abilities-unordered-list' class='list-bulleted'></ul>`;
  let counter = 0;
  abilities.forEach(ability => {
    const ListItem = document.createElement('li');
    ListItem.id = `flavor-text-${++counter}`;
    ListItem.classList.add('flavor-text');
    const Name = capitalizeAfterHyphen(capitalizeFirstLetter(ability.ability.name));
    requestAbilityEffect(ability.ability.url, ListItem, Name);
    ListItem.style.color = ability.is_hidden === false ? TextColor : HiddenAbilityTextColor;
    AbilitiesUnorderedList.appendChild(ListItem);
  });
} //getAbilityList

function getPokedexType(showOnlyOriginalPokemon) {
  if (showOnlyOriginalPokemon === 'true') {
    return MaximumId = 151;
  } else {
    return MaximumId = 1010;
  }
} //getPokedexType

function getHeldItemList(heldItems) {
  if (heldItems.length === 0) {
    HeldItemsHeader.style.display = 'none';
    HeldItemsUnorderedList.style.display = 'none';
    return;
  } else if (heldItems.length === 1) {
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
    // const Name = capitalizeAfterHyphen(capitalizeFirstLetter(heldItem.item.name));
    // requestHeldItem(heldItem.item.url, ListItem, Name);
    requestHeldItem(heldItem.item.url, ListItem, capitalizeAfterHyphen(capitalizeFirstLetter(heldItem.item.name)));
    ListItem.style.color = TextColor;
    HeldItemsUnorderedList.appendChild(ListItem);
  });
} //getHeldItemList

function getFormList(forms) {
  if(forms.length === 1 || localStorage.getItem('originalPokedex') === 'true') {
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
} //getFormList

function getStatTotal(stats) {
  let statTotal = 0;
  stats.forEach(stat => {
    statTotal += stat.base_stat;
  });
  return statTotal;
} //getStatTotal

function getPokedexEntry(flavorTextEntries) { //! Look at randomizing the different english pokemon entries
  const RegEx = /[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000\u000c\n]/g;
  for (let index in flavorTextEntries) { //! Try map instead of for loop
    if (flavorTextEntries[index].language.name === 'en') {
      return flavorTextEntries[index].flavor_text.replaceAll(RegEx, ' ');
    }
  }
} //getPokedexEntry

function getGenus(genera) {
  for (let index in genera) {
    if (genera[index].language.name === 'en') {
      return genera[index].genus;
    }
  }
} //getGenus

function getHeight(height) {
  let feet = ~~(Math.round(height * 3.93701) / 12);
  let inches = Math.round(height * 3.93701) % 12;
  return feet > 0 ? `${feet}'${inches}"` : `${inches}"`;
} //getHeight

function getWeight(weight) {
  return Math.round((weight / 4.536), 2).toFixed(1);
} //getWeight

function punctuationNameCheck(name) {
  name = capitalizeAfterHyphen(name);
  return name.includes('mr-') ? name.replace('mr-', 'Mr. ') : name.includes('-Jr') ? name.replace('-Jr', ' Jr.') :
    name.includes('-Phd') ? name.replace('-Phd', ' Ph.D.') : name.includes('hd') ? name.replace('hd', `h'd`) : name;
} //punctuationNameCheck

function getTypes(types) {
  const FirstType = types[0].type.name;
  let firstColor = getTypeColor(FirstType);
  let firstBackgroundColor = convertHexToRgba(firstColor, 0.3);
  TypeText.innerText = FirstType;
  TypeText.style.backgroundColor = convertHexToRgba(firstColor, 0.6);
  let secondColor = null;
  let secondBackgroundColor = null;
  if (types.length === 1) {
    TypeHeader.innerText = 'Type:';
    TypeText2.hidden = true;
    secondColor = firstColor;
    secondBackgroundColor = firstBackgroundColor;
  } else {
    const SecondType = types[1].type.name;
    secondColor = getTypeColor(SecondType);
    secondBackgroundColor = convertHexToRgba(secondColor, 0.3);
    TypeText2.innerText = SecondType;
    TypeText2.style.backgroundColor = convertHexToRgba(secondColor, 0.6);
    TypeHeader.innerText = 'Types:';
    TypeText2.hidden = false;
  }

  Body.style.background = `radial-gradient(circle, ${firstBackgroundColor} 0%, ${secondBackgroundColor} 100%)`;
  return [firstColor, secondColor];
} //getTypes

function getRandomPokemon() {
  return ~~(Math.random() * MaximumId) + 1;
} //getRandomPokemon

function capitalizeAfterHyphen(hyphenatedString) {
  const RegEx = /\-[a-z]/g;
  return hyphenatedString.replaceAll(RegEx, match => {
    return match.toUpperCase();
  });
} //capitalizeAfterHyphen

function inputCheck(input) {
  const RegEx = /\D/g;
  if (RegEx.test(input)) {
    Textbox.value = input.slice(0, -1);
  }
} //inputCheck

function convertHexToRgba(color, alpha) {
  let r = (`0x${color.substring(1).split('').join('')}` >> 16) & 255;
  let g = (`0x${color.substring(1).split('').join('')}` >> 8) & 255;
  let b = (`0x${color.substring(1).split('').join('')}`) & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
} //convertHexToRgba

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
} //getTypeColor

function getLargestStat(statsArray) {
  return Math.round(statsArray.reduce((stat, max) => {
    return stat > max ? stat : max;
  }, 0) / 25) * 25;
} //getLargestStat

function createArray(elements) {
  let elementArray = [];
  for (let index in elements) {
    elementArray.push(elements[index]);
  }
  return elementArray;
} //createArray

function getElementVisibility(elements, visibility) {
  Synth.cancel();
  if (Array.isArray(elements)) {
    elements.forEach(element => {
      if (element.style !== undefined) {
        element.style.visibility = visibility;
      }
    });
  }
} //getElementVisibility

function makeButtonsDisappear(id, hasGenderDifferences) {
  id !== MinimumId ? PreviousButton.style.display = 'inline-block' : PreviousButton.style.display = 'none';
  id !== MaximumId ? NextButton.style.display = 'inline-block' : NextButton.style.display = 'none';
  // hasGenderDifferences ? FemaleSpritesButton.style.display = 'inline-block' : FemaleSpritesButton.style.display = 'none';
  localStorage.getItem('lastPokemon').length !== 0 ? RecallButton.style.display = 'inline-block' : RecallButton.style.display = 'none';
} //makeButtonsDisappear

function populateLocalStorage(id) {
  localStorage.setItem('id', id);
  localStorage.setItem('dateTime', getDateTime());
  getGeoLocation();
} //populateLocalStorage

function getDateTime() {
  let now = new Date();
  return `${now.getFullYear()}/${now.getMonth() - 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
} //getDateTime

function getGeoLocation() {
  navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);
} //getGeoLocation

function onGeoSuccess(position) {
  const { latitude, longitude } = position.coords;
  localStorage.setItem('coordinates', `${latitude}, ${longitude}`);
} //onGeoSuccess

function onGeoError() {
  localStorage.setItem('coordinates', 'Failed to get your location!');
} //onGeoError

//! Does this need to be refactored
function generatePokemon(id, visibility, skipIdValidation) { //! Fix generatePokemon for all sizes of windows and have all pokemon show sprites and all the same sizes- #773
  if (skipIdValidation === false && (id >= MinimumId || id <= MaximumId)) { //! Refactor this and see about adding an else and creating a toast notifier
    requestPokemon(id, visibility);
    Textbox.style.color = TextColor;
    return;
  } else if (skipIdValidation === true) {
    requestPokemon(id, visibility);
    Textbox.style.color = TextColor;
    return;
  }
  showToast('Please enter a valid Pokédex number');
} //generatePokemon

function showToast(text) {
  ToastText.innerText = text;
  Toast.classList.add('toast-active');
  Textbox.focus();
} //showToast

function startReadingEntry(name, genus, entry) {
  Synth.speak(new SpeechSynthesisUtterance(name));
  Synth.speak(new SpeechSynthesisUtterance(genus));
  Synth.pause();
  Synth.resume();
  Synth.speak(new SpeechSynthesisUtterance(entry));
} //startReadingEntry

function getDeviceType() {
  const Agent = navigator.userAgent;
  const RegExTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i;
  const RegExMobile = /Mobile|iP(hone|od)|Android|Blackberry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i;
  if (RegExTablet.test(Agent)) {
    return 'tablet';
  } else if (RegExMobile.test(Agent)) {
    return 'mobile';
  }
  return 'desktop';
} //getDeviceType

function headerLayout(deviceType) {
  if (deviceType === 'mobile') {
    GoButton.innerHTML = `<span id='go-button-top' class='button-top'><i class='fa-solid fa-magnifying-glass'></i></span>`;
    RandomPokemonButton.innerHTML = `<span id='random-pokemon-button-top' class='button-top'><i class='fa-solid fa-shuffle'></i></span>`;
    PreviousButton.innerHTML = `<span id='previous-button-top' class='button-top'><i class='fa-solid fa-angle-left'></i></span>`;
    NextButton.innerHTML = `<span id='next-button-top' class='button-top'><i class='fa-solid fa-angle-right'></i></span>`;
    ReadEntryButton.innerHTML = `<span id='read-entry-button-top' class='button-top'><i class='fa-solid fa-book-open-reader'></i></span>`;
    ClearButton.innerHTML = `<span id='clear-button-top' class='button-top'><i class='fa-solid fa-x'></i></span>`;
    return;
  } else if (deviceType === 'tablet') {
    RandomPokemonButton.innerHTML = `<span id='random-pokemon-button-top' class='button-top'>Random</span>`;
    PreviousButton.innerHTML = `<span id='previous-button-top' class='button-top'>Prev</span>`;
  }
} //headerLayout

function validPokedexNumberCheck() {
  return (Textbox.value < MinimumId || Textbox.value > MaximumId) ? Textbox.style.color = HiddenAbilityTextColor : Textbox.style.color = TextColor;
} //validPokedexNumberCheck

function capitalizeFirstLetter(string) {
  return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
} //capitalize

export {
  getStatTotal, getPokedexEntry, getElementVisibility,
  convertHexToRgba, getHeight, getWeight, getTypes, punctuationNameCheck,
  getLargestStat, createArray, generatePokemon, makeButtonsDisappear,
  startReadingEntry, getAbilityList, getGenus, getRandomPokemon, inputCheck,
  headerLayout, getDeviceType, getHeldItemList, showToast, getFormList,
  capitalizeFirstLetter, populateLocalStorage, validPokedexNumberCheck, getPokedexType,
  TextColor, HiddenAbilityTextColor, StatsChart, Synth, MinimumId, MaximumId, TransparentColor, Body,
};

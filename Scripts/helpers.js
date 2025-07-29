'use strict';

import { 
  requestAbilityEffect, requestForm, requestHeldItem, requestPokemon, 
} from './requests.js';
import {
  pokemon
} from './pokemon.js';

// Cache DOM elements for better performance
const DOM_CACHE = {
  synth: window.speechSynthesis,
  body: document.body,
  typeText: document.getElementById('type-text'),
  typeText2: document.getElementById('type-text-2'),
  typeHeader: document.getElementById('type-header'),
  statsChart: document.getElementById('stats-chart'),
  abilitiesUnorderedList: document.getElementById('abilities-unordered-list'),
  abilitiesHeader: document.getElementById('abilities-header'),
  heldItemsUnorderedList: document.getElementById('held-items-unordered-list'),
  formsUnorderedList: document.getElementById('forms-unordered-list'),
  heldItemsHeader: document.getElementById('held-items-header'),
  formsHeader: document.getElementById('forms-header'),
  toastText: document.getElementById('toast-text'),
  // Add button references directly here instead of importing
  textbox: document.getElementById('pokemon-textbox'),
  toast: document.getElementById('toast'),
  goButton: document.getElementById('go-button'),
  randomPokemonButton: document.getElementById('random-pokemon-button'),
  previousButton: document.getElementById('previous-button'),
  nextButton: document.getElementById('next-button'),
  recallButton: document.getElementById('recall-button'),
  readEntryButton: document.getElementById('read-entry-button'),
  clearButton: document.getElementById('clear-button')
};

// Maintain backwards compatibility
const Synth = DOM_CACHE.synth;
const Body = DOM_CACHE.body;
const TypeText = DOM_CACHE.typeText;
const TypeText2 = DOM_CACHE.typeText2;
const TypeHeader = DOM_CACHE.typeHeader;
const StatsChart = DOM_CACHE.statsChart;
const AbilitiesUnorderedList = DOM_CACHE.abilitiesUnorderedList;
const AbilitiesHeader = DOM_CACHE.abilitiesHeader;
const HeldItemsUnorderedList = DOM_CACHE.heldItemsUnorderedList;
const FormsUnorderedList = DOM_CACHE.formsUnorderedList;
const HeldItemsHeader = DOM_CACHE.heldItemsHeader;
const FormsHeader = DOM_CACHE.formsHeader;
const ToastText = DOM_CACHE.toastText;

// Button references
const Textbox = DOM_CACHE.textbox;
const Toast = DOM_CACHE.toast;
const GoButton = DOM_CACHE.goButton;
const RandomPokemonButton = DOM_CACHE.randomPokemonButton;
const PreviousButton = DOM_CACHE.previousButton;
const NextButton = DOM_CACHE.nextButton;
const RecallButton = DOM_CACHE.recallButton;
const ReadEntryButton = DOM_CACHE.readEntryButton;
const ClearButton = DOM_CACHE.clearButton;
const TextColor = 'rgba(98, 98, 98, 0.95)';
const HiddenAbilityTextColor = 'rgba(255, 111, 97, 0.95)';
const TransparentColor = 'rgba(0, 0, 0, 0)';
const MinimumId = 1;
const OriginalMaximumId = 151;
const MaximumId = 1025;

function getAbilityList(abilities) {
  AbilitiesHeader.innerText = abilities.length === 1 ? 'Ability:' : 'Abilities:';
  AbilitiesUnorderedList.innerHTML = `<ul id='abilities-unordered-list' class='list-bulleted'></ul>`;
  
  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();
  
  abilities.forEach((ability, index) => {
    const ListItem = document.createElement('li');
    ListItem.id = `flavor-text-${index + 1}`;
    ListItem.classList.add('flavor-text');
    let name = capitalizeAfterHyphen(capitalizeFirstLetter(ability.ability.name));
    if (ability.is_hidden) {
      name += ' (Hidden)';
    }
    requestAbilityEffect(ability.ability.url, ListItem, name);
    ListItem.style.color = ability.is_hidden === false ? TextColor : HiddenAbilityTextColor;
    fragment.appendChild(ListItem);
  });
  
  AbilitiesUnorderedList.appendChild(fragment);
} //getAbilityList

function getPokedexType(showOnlyOriginalPokemon) {
  if(showOnlyOriginalPokemon === 'true') {
    return MaximumId = OriginalMaximumId;
  } else {
    return MaximumId = 1025;
  }
} //getPokedexType

function getHeldItemList(heldItems) {
  if (heldItems.length === 0) {
    HeldItemsHeader.style.display = 'none';
    HeldItemsUnorderedList.style.display = 'none';
    return;
  }
  
  HeldItemsHeader.innerText = heldItems.length === 1 ? 'Held Item:' : 'Held Items:';
  HeldItemsUnorderedList.innerHTML = `<ul id='held-items-unordered-list' class='list-bulleted'></ul>`;
  HeldItemsHeader.style.display = 'block';
  HeldItemsUnorderedList.style.display = 'block';
  
  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();
  
  heldItems.forEach((heldItem, index) => {
    const ListItem = document.createElement('li');
    ListItem.id = `held-item-text-${index + 1}`;
    ListItem.classList.add('held-item-text');
    requestHeldItem(heldItem.item.url, ListItem, capitalizeAfterHyphen(capitalizeFirstLetter(heldItem.item.name)));
    ListItem.style.color = TextColor;
    fragment.appendChild(ListItem);
  });
  
  HeldItemsUnorderedList.appendChild(fragment);
} //getHeldItemList

function getFormList(forms) {
  if (forms.length === 1) {
    FormsHeader.style.display = 'none';
    FormsUnorderedList.style.display = 'none';
    return;
  }
  
  FormsHeader.style.display = 'block';
  FormsUnorderedList.style.display = 'block';
  FormsUnorderedList.innerHTML = `<ul id='forms-unordered-list' class='list-bulleted'></ul>`;
  
  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();
  
  forms.forEach((form, index) => {
    const ListItem = document.createElement('li');
    ListItem.id = `forms-text-${index + 1}`;
    ListItem.classList.add('form-text');
    requestForm(form.pokemon.url, ListItem);
    ListItem.style.color = TextColor;
    
    // Add click event with optimized URL parsing
    ListItem.addEventListener('click', () => {
      const pokemonId = form.pokemon.url.split('/').slice(-2, -1)[0];
      generatePokemon(pokemonId, 'visible', true);
    });
    
    fragment.appendChild(ListItem);
  });
  
  FormsUnorderedList.appendChild(fragment);
} //getFormList

function getStatTotal(stats) {
  let statTotal = 0;
  stats.forEach(stat => {
    statTotal += stat.base_stat;
  });
  return statTotal;
} //getStatTotal

function getPokedexEntry(flavorTextEntries) {
  const RegEx = /[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000\u000c\n]/g;
  let entriesArray = [];
  let entry = ``;
  for(let index in flavorTextEntries) {
    if(flavorTextEntries[index].language.name === 'en') {
      entriesArray.push(flavorTextEntries[index].flavor_text);
    }
  }
  entry = entriesArray[~~(Math.random() * entriesArray.length)].replaceAll(RegEx, ' ');
  if(entry.includes('POKéMON')) {
    entry = entry.replaceAll('POKéMON', 'Pokémon');
  }
  return entry;
} //getPokedexEntry

function getGenus(genera) {
  for(let index in genera) {
    if(genera[index].language.name === 'en') {
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
  return name.includes('mr-') ? name.replace('mr-', 'Mr. ') : //Mr. Mime (121) / Mr. Rime (866)
    name.includes('-Jr') ? name.replace('-Jr', ' Jr.') :      //Mime Jr. (439)
    name.includes('-Phd') ? name.replace('-Phd', ' Ph.D.') :  //Pikachu Ph.D. (25)
    name.includes('hd') ? name.replace('hd', `h'd`) :         //Farfetch'd (83) / Sirfetch'd (865)
    name.includes('o-O') ? name.replace('o-O', 'o-o') :       //Kommo-o (784)
    name;
} //punctuationNameCheck

function getTypes(types) {
  const FirstType = types[0].type.name;
  let firstColor = getTypeColor(FirstType);
  let firstBackgroundColor = convertHexToRgba(firstColor, 0.3);
  TypeText.innerText = FirstType;
  TypeText.style.backgroundColor = convertHexToRgba(firstColor, 0.6);
  let secondColor = null;
  let secondBackgroundColor = null;
  if(types.length === 1) {
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
  if(RegEx.test(input)) {
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
  // Use Array.from for better performance than for-in loop
  return Array.from(elements);
} //createArray

function getElementVisibility(elements, visibility) {
  Synth.cancel();
  if (Array.isArray(elements)) {
    // Use requestAnimationFrame for better performance when manipulating many elements
    requestAnimationFrame(() => {
      elements.forEach(element => {
        if (element && element.style !== undefined) {
          element.style.visibility = visibility;
        }
      });
    });
  }
} //getElementVisibility

function makeButtonsDisappear(id, hasGenderDifferences) {
  id !== MinimumId ? PreviousButton.style.display = 'inline-block' : PreviousButton.style.display = 'none';
  id !== MaximumId ? NextButton.style.display = 'inline-block' : NextButton.style.display = 'none';
  if(localStorage.getItem('lastPokémon') === null) {
    return;
  }
  localStorage.getItem('lastPokémon').length !== 0 ? RecallButton.style.display = 'inline-block' : RecallButton.style.display = 'none';
} //makeButtonsDisappear

function populateLocalStorage(id) {
  localStorage.setItem('currentPokémon', id);
  localStorage.setItem('dateTime', getDateTime());
  getGeoLocation();
} //populateLocalStorage

function getDateTime() {
  const Now = new Date();
  return `${Now.getFullYear()}/${Now.getMonth() - 1}/${Now.getDate()} ${Now.getHours()}:${Now.getMinutes()}:${Now.getSeconds()}`;
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

function generatePokemon(id, visibility, skipIdValidation) {
  if(skipIdValidation === false && (id >= MinimumId || id <= MaximumId)) {
    requestPokemon(id, visibility);
    Textbox.style.color = TextColor;
    return;
  } else if(skipIdValidation === true) {
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

function playPokemonCry() {
  let audio = new Audio(pokemon.cry);
  audio.play();
} //playPokemonCry

function startReadingEntry(name, genus, entry) {
  Synth.speak(new SpeechSynthesisUtterance(name));
  Synth.speak(new SpeechSynthesisUtterance(`The ${genus}`));
  Synth.pause();
  Synth.resume();
  Synth.speak(new SpeechSynthesisUtterance(entry));
} //startReadingEntry

function getDeviceType() {
  const Agent = navigator.userAgent;
  const RegExTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i;
  const RegExMobile = /Mobile|iP(hone|od)|Android|Blackberry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i;
  if(RegExTablet.test(Agent)) {
    return 'tablet';
  } else if(RegExMobile.test(Agent)) {
    return 'mobile';
  }
  return 'desktop';
} //getDeviceType

// Button configuration templates for better performance
const BUTTON_TEMPLATES = {
  mobile: {
    go: `<span id='go-button-top' class='button-top'><i class='fa-solid fa-magnifying-glass'></i></span>`,
    random: `<span id='random-pokemon-button-top' class='button-top'><i class='fa-solid fa-shuffle'></i></span>`,
    previous: `<span id='previous-button-top' class='button-top'><i class='fa-solid fa-angle-left'></i></span>`,
    next: `<span id='next-button-top' class='button-top'><i class='fa-solid fa-angle-right'></i></span>`,
    readEntry: `<span id='read-entry-button-top' class='button-top'><i class='fa-solid fa-book-open-reader'></i></span>`,
    clear: `<span id='clear-button-top' class='button-top'><i class='fa-solid fa-x'></i></span>`
  },
  tablet: {
    random: `<span id='random-pokemon-button-top' class='button-top'>Random</span>`,
    previous: `<span id='previous-button-top' class='button-top'>Prev</span>`
  }
};

function headerLayout(deviceType) {
  if (deviceType === 'mobile') {
    const templates = BUTTON_TEMPLATES.mobile;
    GoButton.innerHTML = templates.go;
    RandomPokemonButton.innerHTML = templates.random;
    PreviousButton.innerHTML = templates.previous;
    NextButton.innerHTML = templates.next;
    ReadEntryButton.innerHTML = templates.readEntry;
    ClearButton.innerHTML = templates.clear;
    return;
  } else if (deviceType === 'tablet') {
    const templates = BUTTON_TEMPLATES.tablet;
    RandomPokemonButton.innerHTML = templates.random;
    PreviousButton.innerHTML = templates.previous;
    return;
  }
} //headerLayout

function validPokedexNumberCheck() {
  return (Textbox.value < MinimumId || Textbox.value > MaximumId)
    ? Textbox.style.color = HiddenAbilityTextColor
    : Textbox.style.color = TextColor;
} //validPokedexNumberCheck

function capitalizeFirstLetter(string) {
  return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
} //capitalizeFirstLetter

export {
  getStatTotal, getPokedexEntry, getElementVisibility, playPokemonCry,
  convertHexToRgba, getHeight, getWeight, getTypes, punctuationNameCheck,
  getLargestStat, createArray, generatePokemon, makeButtonsDisappear,
  startReadingEntry, getAbilityList, getGenus, getRandomPokemon, inputCheck,
  headerLayout, getDeviceType, getHeldItemList, showToast, getFormList,
  capitalizeFirstLetter, populateLocalStorage, validPokedexNumberCheck, getPokedexType,
  TextColor, HiddenAbilityTextColor, StatsChart, Synth, MinimumId, OriginalMaximumId,
  MaximumId, TransparentColor, Body,
};
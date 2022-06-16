import * as main from './main.js';
import * as request from './requests.js';

const synth = window.speechSynthesis;
const spriteScreen = document.getElementById('sprite-screen');
const typeText = document.getElementById('type-text');
const typeText2 = document.getElementById('type-text-2');
const typeHeader = document.getElementById('type-header');
const infoScreen = document.getElementById('info-screen');
const statsScreen = document.getElementById('stats-screen');
const statsChart = document.getElementById('stats-chart');
const abilitiesUnorderedList = document.getElementById('abilities-unordered-list');
const abilitiesHeader = document.getElementById('abilities-header');
const nameHeader = document.getElementById('name-header');
const pokemonEntryText = document.getElementById('pokedex-entry-text');
const genusSubHeader = document.getElementById('genus-sub-header');
const textColor = '#606060';
const hiddenAbilityTextColor = '#ff6f61';

function getAbilityList(abilities) {
  abilitiesHeader.innerText = abilities.length === 1 ? 'Ability:' : 'Abilities:';
  abilitiesUnorderedList.innerHTML = `<ul id='abilities-unordered-list' class='list-bulleted'></ul>`;
  for(let index in abilities) {
    let listItem = document.createElement('li');
    let name = upperCaseAfterHyphen(abilities[index].ability.name.capitalize());
    request.requestAbilityEffect(abilities[index].ability.url, listItem, name);
    listItem.style.color = abilities[index].is_hidden === false ? textColor : hiddenAbilityTextColor;
    abilitiesUnorderedList.appendChild(listItem);
  }
}

function getStatTotal(stats) {
  let statTotal = 0;
  for(let index in stats) {
    statTotal += stats[index].base_stat;
  }
  return statTotal;
}

function getPokedexEntry(flavorTextEntries) {
  const regex = /[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000\u000c\n]/g;
  for(let index in flavorTextEntries) {
    if(flavorTextEntries[index].language.name === 'en') {
      return checkTextForUnwantedCharacters(flavorTextEntries[index].flavor_text, regex, ' ');
    }
  }
  return null;
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

function getTypes(types) {
  let typeArray = [];
  let firstType = types[0].type.name;
  let firstColor = getTypeColor(firstType);
  typeArray.push(firstColor);
  // spriteScreen.style.borderColor = firstColor;
  typeText.innerText = firstType;
  typeText.style.backgroundColor = convertHexToRgba(firstColor, 0.6);
  typeHeader.innerText = 'Type:';
  // infoScreen.style.borderColor = firstColor;
  // statsScreen.style.borderColor = firstColor;
  infoScreen.style.borderImage = 'linear-gradient(' + convertHexToRgba(firstColor, 1) + ', ' + convertHexToRgba(firstColor, 1) + ') 1';
  statsScreen.style.borderImage = 'linear-gradient(' + convertHexToRgba(firstColor, 1) + ', ' + convertHexToRgba(firstColor, 1) + ') 1';
  spriteScreen.style.borderImage = 'linear-gradient(' + convertHexToRgba(firstColor, 1) + ', ' + convertHexToRgba(firstColor, 1) + ') 1';
  typeText2.hidden = true;
  if(types.length === 2) {
    let secondType = types[1].type.name;
    let secondColor = getTypeColor(secondType);
    typeHeader.innerText = 'Types:';
    infoScreen.style.borderColor = secondColor;
    typeText2.innerText = secondType;
    typeText2.style.backgroundColor = convertHexToRgba(secondColor, 0.6);
    typeText2.hidden = false;
    infoScreen.style.borderImage = 'linear-gradient(' + convertHexToRgba(firstColor, 1) + ', ' + convertHexToRgba(secondColor, 1) + ') 1';
    statsScreen.style.borderImage = 'linear-gradient(' + convertHexToRgba(firstColor, 1) + ', ' + convertHexToRgba(secondColor, 1) + ') 1';
    spriteScreen.style.borderImage = 'linear-gradient(' + convertHexToRgba(firstColor, 1) + ', ' + convertHexToRgba(secondColor, 1) + ') 1';
    typeArray.push(secondColor);
    console.log(typeArray)
    return secondColor;
  }
  return firstColor;
}

function checkTextForUnwantedCharacters(text, regex, replacementCharacter) {
  return text.replace(regex, replacementCharacter);
}

function upperCaseAfterHyphen(hyphenatedString) {
  return hyphenatedString.replace(/\-[a-z]/g, (match) => {
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
  const cases = {
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
  return cases[type];
}

function getLargestStat(hp, attack, defense, spAttack, spDefense, speed) {
  const statsArray = [
    hp,
    attack,
    defense,
    spAttack,
    spDefense,
    speed,
  ];
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


function getElementState(elements, state) {
  elements.forEach(element => {
    if(typeof element.style !== 'undefined') {
      element.style.visibility = state;
    }
  });
  scrollToTop();
}

function makeButtonsDisappear(id) {
  id === 1 ? main.previousButton.style.display = 'none' : main.previousButton.style.display = 'inline-block';
  id === 898 ? main.nextButton.style.display = 'none' : main.nextButton.style.display = 'inline-block';
}

function generatePokemon(pokedexNumber, state) {
  pokedexNumber >= 1 && pokedexNumber <= 898 ? request.requestPokemon(pokedexNumber, state) : alert(`Please enter a valid Pokédex number`); //!Replace with a modal or toast
  scrollToTop();
}

function readPokedexEntry() {
  synth.speaking ? stopReadingEntry() : startReadingEntry(nameHeader.textContent, genusSubHeader.textContent, pokemonEntryText.textContent);
}

function stopReadingEntry() {
  synth.cancel();
}

function startReadingEntry(name, genus, entry) {
  synth.speak(new SpeechSynthesisUtterance(name));
  synth.speak(new SpeechSynthesisUtterance(genus));
  synth.pause();
  synth.resume();
  synth.speak(new SpeechSynthesisUtterance(entry));
}

function getDeviceType() {
  const agent = navigator.userAgent;
  if(/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(agent)) {
    return 'tablet';
  } else if(/Mobile|iP(hone|od)|Android|Blackberry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(agent)) {
    return 'mobile';
  }
  return 'desktop'
}

function headerLayout(deviceType, goButton, randomPokemonButton, previousButton, nextButton, readEntryButton, clearButton) {
  if(deviceType === 'mobile') {//(screenWidth <= 480) {
    goButton.innerHTML = '<span class="button-top"><i class="fa-solid fa-magnifying-glass"></i></span>';
    randomPokemonButton.innerHTML = '<span class="button-top"><i class="fa-solid fa-shuffle"></i></span>';
    previousButton.innerHTML = '<span class="button-top"><i class="fa-solid fa-angle-left"></i></span>';
    nextButton.innerHTML = '<span class="button-top"><i class="fa-solid fa-angle-right"></i></span>'
    readEntryButton.innerHTML = '<span class="button-top"><i class="fa-solid fa-book-open-reader"></i></span>';
    clearButton.innerHTML = '<span class="button-top"><i class="fa-solid fa-x"></i></span>';
  } else if(deviceType === 'tablet') {//(screenWidth >= 481 && screenWidth <= 768) {
    previousButton.innerText = 'Prev';
    readEntryButton.innerText = 'Read Entry';
  } else {
    goButton.innerHTML = 'Go';
    randomPokemonButton.innerHTML = 'Random Pokémon';
    previousButton.innerHTML = 'Previous';
    nextButton.innerHTML = 'Next';
    readEntryButton.innerHTML = 'Read Entry';
    clearButton.innerHTML = ' X ';
  }
}

function scrollToTop() {
  window.scrollTo(0, 0);
}

String.prototype.capitalize = function() {
  return `${this.charAt(0).toUpperCase()}${this.slice(1)}`;
}

export {
  checkTextForUnwantedCharacters, getStatTotal,
  getPokedexEntry, getElementState, upperCaseAfterHyphen,
  convertHexToRgba, getHeight, getWeight, getTypes,
  getTypeColor, getLargestStat, createArray, generatePokemon,
  makeButtonsDisappear, readPokedexEntry, stopReadingEntry,
  getAbilityList, getGenus, headerLayout, getDeviceType,
  textColor, hiddenAbilityTextColor, statsChart,
};

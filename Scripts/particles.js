// particles.js snow effect integration for Kolby's Pokedex
export function showSnowIfBabyOrIce(pokemonObject) {
  const isIceType = pokemonObject.types && pokemonObject.types.some(type => {
    if (type.type && type.type.name) {
      return type.type.name.toLowerCase() === 'ice';
    }
    return String(type).toLowerCase() === 'ice';
  });
  const isLegendary = pokemonObject.isLegendary || pokemonObject.is_legendary;
  const isMythical = pokemonObject.isMythical || pokemonObject.is_mythical;
    if (isDev()) console.log('[Particles.js] isIceType:', isIceType, 'isLegendary:', isLegendary, 'isMythical:', isMythical);

  if ((isIceType && (isLegendary || isMythical))) {
    // Ice AND legendary/mythical: show legendary/mythical background
    if (!window.particlesJS) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js';
      script.onload = () => initLegendaryParticles();
      document.body.appendChild(script);
    } else {
      initLegendaryParticles();
    }
  } else if (isIceType) {
    // Ice only: show snow
    if (!window.particlesJS) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js';
      script.onload = () => initSnowParticles();
      document.body.appendChild(script);
    } else {
      initSnowParticles();
    }
  } else if (isLegendary || isMythical) {
    // Legendary/mythical only: show legendary/mythical background
    if (!window.particlesJS) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js';
      script.onload = () => initLegendaryParticles();
      document.body.appendChild(script);
    } else {
      initLegendaryParticles();
    }
  } else {
    const snowDiv = document.getElementById('snow-bg');
    if (snowDiv) snowDiv.style.display = 'none';
  }
}

function initSnowParticles() {
  let snowDiv = document.getElementById('snow-bg');
  if (!snowDiv) {
    snowDiv = document.createElement('div');
    snowDiv.id = 'snow-bg';
    snowDiv.style.position = 'fixed';
    snowDiv.style.top = '0';
    snowDiv.style.left = '0';
    snowDiv.style.width = '100vw';
    snowDiv.style.height = '100vh';
    snowDiv.style.zIndex = '-10';
    snowDiv.style.pointerEvents = 'none';
    // Make the background more visible for snow
    snowDiv.style.background = 'linear-gradient(rgba(200,220,255,0.5), rgba(255,255,255,0.2))';
    document.body.appendChild(snowDiv);
  } else {
    snowDiv.style.display = 'block';
    snowDiv.style.background = 'linear-gradient(rgba(200,220,255,0.5), rgba(255,255,255,0.2))';
  }
  snowDiv.style.width = '100vw';
  snowDiv.style.height = '100vh';
  snowDiv.style.zIndex = '-10';
  snowDiv.style.pointerEvents = 'none';
  document.body.insertBefore(snowDiv, document.body.firstChild);

  window.particlesJS('snow-bg', {
    particles: {
      number: { value: 400, density: { enable: true, value_area: 800 } }, // more snowflakes
      color: { value: '#fff' },
      shape: { type: 'circle' },
      opacity: { value: 0.95, random: true, anim: { enable: true, speed: 1.2, opacity_min: 0.7, sync: false } }, // brighter
      size: { value: 7, random: true, anim: { enable: true, speed: 3, size_min: 2, sync: false } }, // larger
      move: { direction: 'bottom', speed: 2.5, straight: false, out_mode: 'out' } // faster
    },
    interactivity: { detect_on: 'canvas', events: { onhover: { enable: false } } },
    retina_detect: true
  });
}
window.initSnowParticles = initSnowParticles;

function initLegendaryParticles() {
  let snowDiv = document.getElementById('snow-bg');
  if (!snowDiv) {
    snowDiv = document.createElement('div');
    snowDiv.id = 'snow-bg';
    snowDiv.style.position = 'fixed';
    snowDiv.style.top = '0';
    snowDiv.style.left = '0';
    snowDiv.style.width = '100vw';
    snowDiv.style.height = '100vh';
    snowDiv.style.zIndex = '-10';
    snowDiv.style.pointerEvents = 'none';
    document.body.insertBefore(snowDiv, document.body.firstChild);
  } else {
    snowDiv.style.zIndex = '-10';
    document.body.insertBefore(snowDiv, document.body.firstChild);
  }
  snowDiv.style.display = 'block';

  window.particlesJS('snow-bg', {
    particles: {
      number: { value: 120, density: { enable: true, value_area: 800 } },
      color: { value: '#ffd700' }, // gold for legendary/mythical
      shape: { type: 'star' },
      opacity: { value: 0.8, random: true },
      size: { value: 6, random: true },
      move: { direction: 'top', speed: 1.5 }
    },
    interactivity: { detect_on: 'canvas', events: { onhover: { enable: false } } },
    retina_detect: true
  });
}
window.initLegendaryParticles = initLegendaryParticles;

function isDev() {
  return typeof process === 'undefined' || process.env.NODE_ENV !== 'production';
}

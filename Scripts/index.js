/*
  KOLBY'S POKÉDEX - INDEX PAGE SCRIPTS
  ====================================
  
  JavaScript for the index redirect page providing fallback redirect
  functionality in case meta refresh doesn't work.
  
  @author Kolby Landon
  @version 2.0
  @since 2023
*/

'use strict';

// Development utility function
function isDev() {
  return typeof process === 'undefined' || process.env.NODE_ENV !== 'production';
}

// Fallback redirect in case meta refresh doesn't work
setTimeout(() => {
  window.location.href = 'Pages/pokedex.html';
}, 1000);

// Example usage:
// if(isDev()) console.log('message');
// if(isDev()) console.warn('message');
// if(isDev()) console.error('message');

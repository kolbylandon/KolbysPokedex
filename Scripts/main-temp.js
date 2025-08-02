/**
 * MAIN.JS - Primary Application Entry Point
 * =============================================
 * This is the main JavaScript file for Kolby's Pokédx application.
 * It handles all user interactions, event listeners, and coordinates
 * between different modules to create a cohesive Pokédx experience.
 * 
 * Key Features:
 * - User input handling and validation
 * - Navigation between Pokémon entries
 * - Speech synthesis for Pokédx entries
 * - Responsive design adjustments
 * - Local storage management
 * - Progressive Web App functionality
 * 
 * @author Kolby Landon
 * @version 2.1 (Fixed header corruption and updated imports)
 * @since 2023
 * @updated 2025-08-01T06:20:00Z
 */

'use strict';

// Import utility functions and constants from helper modules
import { showToast, getElementVisibility, Body } from './utils/dom-utils.js?v=20250801i';
import { playPokemonCry, startReadingEntry, Synth } from './utils/audio-utils.js?v=20250801i';
import { convertHexToRgba } from './utils/color-utils.js?v=20250801i';
import { 
  generatePokemon, getRandomPokemon, getDeviceType, 
  applyResponsiveLayout as headerLayout, validateNumericInput as inputCheck,
  validatePokedexNumber as validPokedexNumberCheck,
  ORIGINAL_MAXIMUM_ID as OriginalMaximumId, MAXIMUM_ID as MaximumId
} from './utils/navigation-utils.js?v=20250801i';

// Import API request functions
import { 
  requestType 
} from './requests.js';

/**
 * COLOR UTILITIES MODULE
 * ======================
 * 
 * This module handles all color-related functionality for the Pokemon application,
 * including Pokemon type colors, hex to RGBA conversion, and visual theming.
 * It provides the official Pokemon type color palette and utility functions
 * for color manipulation and transparency effects.
 * 
 * Key Features:
 * - Official Pokemon type color mappings
 * - Hex to RGBA conversion with alpha transparency
 * - Color validation and fallback handling
 * - Consistent color theming across the application
 * - Performance-optimized color calculations
 * 
 * @author Kolby Landon
 * @version 1.0
 * @since 2025
 */

'use strict';

// ====================================
// COLOR SYSTEM CONSTANTS
// ====================================

/** @type {string} Default fallback color for unknown or invalid types */
const DEFAULT_TYPE_COLOR = '#68A090'; // Neutral gray-green

/** @type {string} Transparent color for fallback scenarios */
export const TRANSPARENT_COLOR = 'rgba(0, 0, 0, 0)';

/**
 * Official Pokemon Type Color Palette
 * Colors follow the official Pokemon game design system for consistency
 * and brand recognition across all type badges and UI elements
 */
const POKEMON_TYPE_COLORS = {
  // Physical Types
  'normal':   '#ADA480',   // Light brown/tan - represents ordinary nature
  'fighting': '#C22F26',   // Bold red - represents strength and combat
  'rock':     '#B49E38',   // Earth brown - represents solid stone
  'ground':   '#DEBE63',   // Sandy yellow-brown - represents earth and soil
  'steel':    '#B8B5CF',   // Metallic gray - represents metal and machinery
  
  // Elemental Types  
  'fire':     '#F07D33',   // Orange-red - represents flames and heat
  'water':    '#6D88F8',   // Ocean blue - represents seas and rivers
  'grass':    '#81CB5B',   // Natural green - represents plants and nature
  'electric': '#E9D436',   // Bright yellow - represents lightning and energy
  'ice':      '#9AD9DA',   // Pale blue - represents frost and cold
  
  // Special Types
  'psychic':  '#FF598D',   // Vibrant pink - represents mental powers
  'dragon':   '#723EFC',   // Royal purple-blue - represents legendary power
  'fairy':    '#E1A4E1',   // Soft pink - represents magic and wonder
  'dark':     '#2B1E16',   // Deep brown - represents shadows and night
  'ghost':    '#6E5391',   // Mystical purple - represents spirits
  
  // Nature Types
  'flying':   '#B49AF6',   // Sky purple - represents air and flight
  'bug':      '#A8B531',   // Natural green-yellow - represents insects
  'poison':   '#A43FA4',   // Toxic purple - represents venom and toxins
};

// ====================================
// TYPE COLOR FUNCTIONS
// ====================================

/**
 * Returns the official color for a specific Pokemon type
 * Provides consistent theming across type badges and backgrounds
 * @param {string} type - Pokemon type name (e.g., "fire", "water", "grass")
 * @returns {string} Hexadecimal color value for the specified type
 * @example
 * const fireColor = getTypeColor('fire');     // Returns '#F07D33'
 * const waterColor = getTypeColor('water');   // Returns '#6D88F8'
 * const invalidColor = getTypeColor('invalid'); // Returns default color
 */
export function getTypeColor(type) {
  // Validate input parameter
  if (!type || typeof type !== 'string') {
    console.warn('getTypeColor: Invalid type parameter provided');
    return DEFAULT_TYPE_COLOR;
  }
  
  // Normalize type name (lowercase, trim whitespace)
  const normalizedType = type.toLowerCase().trim();
  
  // Return type color or default if type not found
  const color = POKEMON_TYPE_COLORS[normalizedType];
  
  if (!color) {
    console.warn(`getTypeColor: Unknown Pokemon type '${type}', using default color`);
    return DEFAULT_TYPE_COLOR;
  }
  
  return color;
}

/**
 * Gets all available Pokemon type colors as an object
 * Useful for building color palettes or validation
 * @returns {Object} Complete mapping of type names to hex colors
 * @example
 * const allColors = getAllTypeColors();
 * console.log(allColors.fire); // '#F07D33'
 */
export function getAllTypeColors() {
  // Return a copy to prevent external modification
  return { ...POKEMON_TYPE_COLORS };
}

/**
 * Validates if a given string is a valid Pokemon type
 * @param {string} type - Type name to validate
 * @returns {boolean} True if the type exists in the color system
 * @example
 * const isValid = isValidPokemonType('fire');    // Returns true
 * const isInvalid = isValidPokemonType('light'); // Returns false
 */
export function isValidPokemonType(type) {
  if (!type || typeof type !== 'string') {
    return false;
  }
  
  return type.toLowerCase().trim() in POKEMON_TYPE_COLORS;
}

// ====================================
// COLOR CONVERSION FUNCTIONS
// ====================================

/**
 * Converts hexadecimal color values to RGBA format with specified alpha transparency
 * Uses bitwise operations for optimal performance and supports both 3 and 6 digit hex
 * @param {string} hexColor - Hexadecimal color value (e.g., "#FF0000" or "#F00")
 * @param {number} alpha - Alpha transparency value (0.0 to 1.0)
 * @returns {string} RGBA color string (e.g., "rgba(255, 0, 0, 0.5)")
 * @example
 * const fireRGBA = convertHexToRgba('#F07D33', 0.3);  // Semi-transparent fire color
 * const waterRGBA = convertHexToRgba('#6D88F8', 0.6); // More opaque water color
 */
export function convertHexToRgba(hexColor, alpha) {
  // Validate hex color input
  if (!hexColor || typeof hexColor !== 'string') {
    console.warn('convertHexToRgba: Invalid hex color provided');
    return TRANSPARENT_COLOR;
  }
  
  // Validate alpha value
  if (typeof alpha !== 'number' || alpha < 0 || alpha > 1) {
    console.warn('convertHexToRgba: Invalid alpha value, must be between 0 and 1');
    alpha = 1; // Default to fully opaque
  }
  
  // Remove hash symbol if present
  let cleanHex = hexColor.replace('#', '');
  
  // Handle 3-digit hex shorthand (e.g., "#F00" -> "#FF0000")
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  
  // Validate hex format (must be 6 characters after expansion)
  if (cleanHex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    console.warn('convertHexToRgba: Invalid hex color format');
    return TRANSPARENT_COLOR;
  }
  
  try {
    // Extract RGB components using bitwise operations for performance
    const hexValue = parseInt(cleanHex, 16);
    const r = (hexValue >> 16) & 255;  // Extract red component
    const g = (hexValue >> 8) & 255;   // Extract green component  
    const b = hexValue & 255;          // Extract blue component
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (error) {
    console.error('convertHexToRgba: Error converting hex to RGBA:', error);
    return TRANSPARENT_COLOR;
  }
}

/**
 * Converts RGBA color string back to hexadecimal format
 * Useful for storage or systems that require hex colors
 * @param {string} rgbaColor - RGBA color string (e.g., "rgba(255, 0, 0, 0.5)")
 * @returns {string} Hexadecimal color value without alpha information
 * @example
 * const hexColor = convertRgbaToHex('rgba(240, 125, 51, 0.3)'); // Returns '#F07D33'
 */
export function convertRgbaToHex(rgbaColor) {
  if (!rgbaColor || typeof rgbaColor !== 'string') {
    console.warn('convertRgbaToHex: Invalid RGBA color provided');
    return '#000000';
  }
  
  // Extract RGB values using regex
  const rgbaMatch = rgbaColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  
  if (!rgbaMatch) {
    console.warn('convertRgbaToHex: Invalid RGBA format');
    return '#000000';
  }
  
  const r = parseInt(rgbaMatch[1], 10);
  const g = parseInt(rgbaMatch[2], 10);
  const b = parseInt(rgbaMatch[3], 10);
  
  // Validate RGB values
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    console.warn('convertRgbaToHex: Invalid RGB values');
    return '#000000';
  }
  
  // Convert to hex with padding
  const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  return `#${hex.toUpperCase()}`;
}

// ====================================
// COLOR UTILITY FUNCTIONS
// ====================================

/**
 * Calculates the luminance of a color to determine if it's light or dark
 * Useful for choosing appropriate text colors for accessibility
 * @param {string} hexColor - Hexadecimal color value
 * @returns {number} Luminance value between 0 (dark) and 1 (light)
 * @example
 * const luminance = getColorLuminance('#F07D33');
 * const textColor = luminance > 0.5 ? '#000000' : '#FFFFFF'; // Black or white text
 */
export function getColorLuminance(hexColor) {
  if (!hexColor || typeof hexColor !== 'string') {
    return 0;
  }
  
  // Remove hash and convert to RGB
  const cleanHex = hexColor.replace('#', '');
  if (cleanHex.length !== 6) {
    return 0;
  }
  
  const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
  const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
  
  // Apply gamma correction and calculate luminance
  const getRGBValue = (colorValue) => {
    return colorValue <= 0.03928 
      ? colorValue / 12.92 
      : Math.pow((colorValue + 0.055) / 1.055, 2.4);
  };
  
  return 0.2126 * getRGBValue(r) + 0.7152 * getRGBValue(g) + 0.0722 * getRGBValue(b);
}

/**
 * Determines if a color is considered "light" based on luminance
 * @param {string} hexColor - Hexadecimal color value
 * @param {number} threshold - Luminance threshold (default: 0.5)
 * @returns {boolean} True if the color is light, false if dark
 * @example
 * const isLight = isLightColor('#F07D33');     // Check if fire color is light
 * const shouldUseWhiteText = !isLightColor(backgroundColor);
 */
export function isLightColor(hexColor, threshold = 0.5) {
  return getColorLuminance(hexColor) > threshold;
}

/**
 * Generates a complementary color that provides good contrast
 * @param {string} hexColor - Base hexadecimal color
 * @returns {string} Complementary color in hex format
 * @example
 * const complementary = getComplementaryColor('#F07D33'); // Returns contrasting color
 */
export function getComplementaryColor(hexColor) {
  if (!hexColor || typeof hexColor !== 'string') {
    return '#FFFFFF';
  }
  
  const cleanHex = hexColor.replace('#', '');
  if (cleanHex.length !== 6) {
    return '#FFFFFF';
  }
  
  // Calculate complementary color by inverting RGB values
  const r = 255 - parseInt(cleanHex.substr(0, 2), 16);
  const g = 255 - parseInt(cleanHex.substr(2, 2), 16);
  const b = 255 - parseInt(cleanHex.substr(4, 2), 16);
  
  const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  return `#${hex.toUpperCase()}`;
}

/**
 * Creates a gradient background style from two Pokemon types
 * @param {string} type1 - First Pokemon type
 * @param {string} type2 - Second Pokemon type (optional)
 * @param {number} alpha - Alpha transparency for colors (default: 0.3)
 * @returns {string} CSS background gradient string
 * @example
 * const gradient = createTypeGradient('fire', 'flying', 0.4);
 * element.style.background = gradient;
 */
export function createTypeGradient(type1, type2, alpha = 0.3) {
  const color1 = getTypeColor(type1);
  const color2 = type2 ? getTypeColor(type2) : color1;
  
  const rgba1 = convertHexToRgba(color1, alpha);
  const rgba2 = convertHexToRgba(color2, alpha);
  
  return `radial-gradient(circle, ${rgba1} 0%, ${rgba2} 100%)`;
}

// ====================================
// BACKWARD COMPATIBILITY EXPORTS
// ====================================

// Maintain backward compatibility with existing code
export { getTypeColor as getTypeColorLegacy };
export { convertHexToRgba as convertHexToRgbaLegacy };

// Constants for backward compatibility
export const TYPE_COLORS = POKEMON_TYPE_COLORS;
export const DEFAULT_COLOR = DEFAULT_TYPE_COLOR;

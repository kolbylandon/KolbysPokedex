/**
 * STATSCHART.JS - Pokemon Statistics Visualization
 * ================================================
 * 
 * This module handles the creation and management of Pokemon base stats
 * visualization using Chart.js radar charts. It provides an interactive
 * and visually appealing way to display Pokemon battle statistics.
 * 
 * Key Features:
 * - Radar chart generation for Pokemon base stats
 * - Dynamic color theming based on Pokemon types
 * - Performance optimized chart rendering
 * - Responsive chart sizing and scaling
 * - Proper chart cleanup and memory management
 * 
 * Chart Components:
 * - HP (Hit Points)
 * - Attack (Physical attack power)
 * - Defense (Physical defense)
 * - Special Attack (Special move power)
 * - Special Defense (Special move resistance)
 * - Speed (Turn order determination)
 * 
 * @author Kolby Landon
 * @version 2.0
 * @since 2023
 */

'use strict';

// ====================================
// MODULE IMPORTS
// ====================================
import { capitalizeFirstLetter, punctuationNameCheck } from './utils/data-utils.js?v=20250801i';
import { TRANSPARENT_COLOR as TransparentColor } from './utils/color-utils.js?v=20250801';

// Constants
const TextColor = 'rgba(98, 98, 98, 0.95)';

// ====================================
// CHART ELEMENT REFERENCES
// ====================================

/** @type {HTMLCanvasElement} Canvas element for Chart.js radar chart */
const RadarChart = document.getElementById('stats-chart');

/** @type {Chart|null} Chart.js instance for Pokemon stats visualization */
let statsChart = null;

// ====================================
// STATS CHART GENERATION
// ====================================

/**
 * Creates and displays a radar chart for Pokemon base statistics
 * Efficiently manages chart lifecycle with proper cleanup and optimization
 * @param {string} backgroundColor - RGBA background color for chart area
 * @param {string} borderColor - RGBA border color for chart lines
 * @param {Array<number>} stats - Array of six base stat values [HP, Atk, Def, SpAtk, SpDef, Speed]
 * @param {number} max - Maximum value for chart scaling (rounded to nearest 25)
 * @param {string} name - Pokemon name for chart title
 */
function displayStatsChart(backgroundColor, borderColor, stats, max, name) {
  // Efficiently destroy existing chart instance to prevent memory leaks
  if (statsChart) {
    statsChart.destroy();
    statsChart = null;
  }
  
  // Apply punctuation fixes to Pokemon name for proper display
  name = punctuationNameCheck(name);
  const chart = RadarChart;
  
  // Pre-configure chart data structure for optimal performance
  const chartData = {
    // Pokemon stat labels in standard order
    labels: ['HP', 'Attack', 'Defense', 'Sp.Atk', 'Sp.Def', 'Speed'],
    datasets: [{
      data: stats,                 // Base stat values array
      backgroundColor,             // Fill color based on Pokemon type
      borderColor,                 // Border color based on Pokemon type
    }],
  };

  // Configure chart appearance and behavior options
  const chartOptions = {
    responsive: false,             // Disable auto-resizing for performance
    animation: {
      duration: 300                // Reduce animation time for better performance
    },
    elements: {
      point: {
        radius: 4,                 // Data point size
        pointStyle: 'star',        // Star-shaped data points for visual appeal
      },
    },
    plugins: {
      title: {
        display: true,
        text: `Stats For ${capitalizeFirstLetter(name)}`,  // Dynamic title with Pokemon name
      },
      legend: {
        display: false,            // Hide legend since we only have one dataset
      },
    },
    layout: {
      padding: 10,                 // Chart padding for better spacing
    },
    font: {
      size: 24,                    // Font size for chart text
      family: 'Montserrat',        // Match application font family
    },
    scales: {
      r: {                         // Radial scale configuration
        min: 0,                    // Always start from 0
        max,                       // Dynamic maximum based on highest stat
        ticks: {
          fontColor: TextColor,    // Tick mark color
          backdropColor: TransparentColor,  // Transparent tick backgrounds
          stepSize: 25,            // Grid lines every 25 points
        },
        grid: {
          color: TextColor,        // Grid line color
        },
      },
    },
  };
  
  // Create new Chart.js radar chart with optimized settings
  statsChart = new Chart(chart, {
    type: 'radar',
    data: chartData,
    options: chartOptions,
  });
  
  // Ensure chart sizing matches its container
  chart.style.width = chart.parentElement.style.width;
  chart.style.height = chart.parentElement.style.height;
} //displayStatsChart

// ====================================
// MODULE EXPORTS
// ====================================

export {
  displayStatsChart,  // Main function for creating Pokemon stats charts
};

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
/**
 * Dynamically loads Chart.js and displays a radar chart for Pokémon stats
 */
async function displayStatsChart(backgroundColor, borderColor, stats, max, name) {
  // Dynamically import Chart.js only when rendering stats
  // Dynamically import Chart.js ESM build only when rendering stats
  const ChartModule = await import('https://cdn.jsdelivr.net/npm/chart.js@3.3.0/dist/chart.esm.js');
  // Use registerables to register all chart components including controllers
  const { Chart, registerables } = ChartModule;
  Chart.register(...registerables);
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
    responsive: true,              // Enable responsiveness
    maintainAspectRatio: false,    // Allow dynamic sizing
    animation: {
      duration: 500                // Smooth animation
    },
    elements: {
      line: {
        borderWidth: 2,            // Thicker line
        tension: 0.4               // Smooth curves
      },
      point: {
        radius: 5,                 // Larger data points
        pointStyle: 'circle',      // Circular points
        backgroundColor: borderColor, // Match point color
        borderColor: borderColor,
        borderWidth: 1
      },
    },
    plugins: {
      title: {
        display: true,
        text: `Stats For ${capitalizeFirstLetter(name)}`,
        color: TextColor,
        font: { size: 20, weight: '600' }
      },
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: borderColor,
        borderWidth: 1,
        callbacks: {
          label: context => `${context.label}: ${context.formattedValue}`
        }
      }
    },
    layout: {
      padding: 10,                 // Chart padding for better spacing
    },
    font: {
      size: 24,                    // Font size for chart text
      family: 'Montserrat',        // Match application font family
    },
    scales: {
      r: {
        min: 0,
        max,
        angleLines: {             // Style radial angle lines
          color: 'rgba(98, 98, 98, 0.3)'
        },
        grid: {
          circular: true,         // Circular grid
          color: 'rgba(98, 98, 98, 0.2)'
        },
        ticks: {
          color: TextColor,
          backdropColor: TransparentColor,
          stepSize: 25
        }
      }
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

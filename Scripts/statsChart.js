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
// DEVICE DETECTION HELPERS
// ====================================

/**
 * Detects device type for optimized chart rendering
 * @returns {string} Device type: 'mobile', 'tablet', or 'desktop'
 */
function getDeviceTypeForChart() {
  const width = window.innerWidth;
  if (width <= 480) return 'mobile';
  if (width <= 1024) return 'tablet';
  return 'desktop';
}

/**
 * Gets responsive chart configuration based on device type
 * @param {string} deviceType - Current device type
 * @returns {Object} Configuration object with responsive settings
 */
function getResponsiveChartConfig(deviceType) {
  const configs = {
    mobile: {
      lineWidth: 3,
      pointRadius: 6,
      pointBorderWidth: 2,
      pointHoverRadius: 8,
      titleFontSize: 16,
      labelFontSize: 12,
      tickFontSize: 10,
      padding: 15,
      backdropPadding: 4,
      tooltipPadding: 12,
      titlePadding: { top: 10, bottom: 10 }
    },
    tablet: {
      lineWidth: 2.5,
      pointRadius: 5,
      pointBorderWidth: 1.5,
      pointHoverRadius: 7,
      titleFontSize: 18,
      labelFontSize: 14,
      tickFontSize: 12,
      padding: 15,
      backdropPadding: 4,
      tooltipPadding: 12,
      titlePadding: { top: 15, bottom: 15 }
    },
    desktop: {
      lineWidth: 2,
      pointRadius: 4,
      pointBorderWidth: 1,
      pointHoverRadius: 6,
      titleFontSize: 20,
      labelFontSize: 16,
      tickFontSize: 14,
      padding: 10,
      backdropPadding: 3,
      tooltipPadding: 10,
      titlePadding: { top: 20, bottom: 20 }
    }
  };
  
  return configs[deviceType] || configs.desktop;
}

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
  cleanupStatsChart();
  
  // Get device-specific configuration
  const deviceType = getDeviceTypeForChart();
  const config = getResponsiveChartConfig(deviceType);
  
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

  // Configure chart appearance and behavior options with responsive settings
  const chartOptions = {
    responsive: true,              // Enable responsiveness
    maintainAspectRatio: false,    // Allow dynamic sizing
    devicePixelRatio: window.devicePixelRatio || 2, // Better quality on high-DPI screens
    animation: {
      duration: deviceType === 'mobile' ? 300 : 500 // Faster animations on mobile
    },
    interaction: {
      intersect: false,            // Better touch interaction
      mode: 'nearest'              // Improved mobile touch response
    },
    elements: {
      line: {
        borderWidth: config.lineWidth, // Responsive line width
        tension: 0.4               // Smooth curves
      },
      point: {
        radius: config.pointRadius, // Responsive point size
        pointStyle: 'circle',      // Circular points
        backgroundColor: borderColor, // Match point color
        borderColor: borderColor,
        borderWidth: config.pointBorderWidth, // Responsive border width
        hoverRadius: config.pointHoverRadius   // Responsive hover radius
      },
    },
    plugins: {
      title: {
        display: true,
        text: `Stats For ${capitalizeFirstLetter(name)}`,
        color: TextColor,
        font: { 
          size: config.titleFontSize, // Responsive title font size
          weight: '600' 
        },
        padding: config.titlePadding // Responsive padding
      },
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: borderColor,
        borderWidth: 1,
        cornerRadius: deviceType === 'mobile' ? 6 : 8,
        padding: config.tooltipPadding, // Responsive padding
        titleFont: {
          size: config.titleFontSize - 2 // Slightly smaller than title
        },
        bodyFont: {
          size: config.labelFontSize // Match label font size
        },
        callbacks: {
          label: context => `${context.label}: ${context.formattedValue}`
        }
      }
    },
    layout: {
      padding: config.padding, // Responsive padding
    },
    // Global font configuration
    font: {
      family: deviceType === 'mobile' ? 
        "'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" : 
        "'Montserrat', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    },
    scales: {
      r: {
        min: 0,
        max,
        angleLines: {             // Style radial angle lines
          color: 'rgba(98, 98, 98, 0.3)',
          lineWidth: deviceType === 'mobile' ? 1.5 : 1 // Thicker lines on mobile
        },
        grid: {
          circular: true,         // Circular grid
          color: 'rgba(98, 98, 98, 0.2)',
          lineWidth: deviceType === 'mobile' ? 1.5 : 1 // Thicker grid lines on mobile
        },
        pointLabels: {
          color: TextColor,
          font: {
            size: config.labelFontSize, // Responsive label size
            weight: '500'
          },
          padding: deviceType === 'mobile' ? 8 : 5 // More padding on mobile
        },
        ticks: {
          color: TextColor,
          backdropColor: TransparentColor,
          stepSize: 10, // Step size for ticks
          font: {
            size: config.tickFontSize // Responsive tick size
          },
          showLabelBackdrop: deviceType === 'mobile', // Show backdrop on mobile for better readability
          backdropPadding: config.backdropPadding
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
  
  // Add resize listener for responsive updates
  const resizeHandler = () => {
    if (statsChart) {
      const newDeviceType = getDeviceTypeForChart();
      if (newDeviceType !== deviceType) {
        // Redraw chart with new responsive settings if device type changed
        setTimeout(() => {
          displayStatsChart(backgroundColor, borderColor, stats, max, name);
        }, 100);
      } else {
        // Just resize the chart if device type hasn't changed
        statsChart.resize();
      }
    }
  };
  
  // Remove any existing resize listeners to prevent duplicates
  window.removeEventListener('resize', resizeHandler);
  window.addEventListener('resize', resizeHandler);
  
  // Store reference for cleanup
  statsChart._resizeHandler = resizeHandler;
} //displayStatsChart

// ====================================
// CHART MANAGEMENT FUNCTIONS
// ====================================

/**
 * Cleans up the current chart instance and removes event listeners
 * Call this before creating a new chart to prevent memory leaks
 */
function cleanupStatsChart() {
  if (statsChart) {
    // Remove resize listener if it exists
    if (statsChart._resizeHandler) {
      window.removeEventListener('resize', statsChart._resizeHandler);
    }
    // Destroy the chart instance
    statsChart.destroy();
    statsChart = null;
  }
}

// ====================================
// MODULE EXPORTS
// ====================================

export {
  displayStatsChart,  // Main function for creating Pokemon stats charts
  cleanupStatsChart,  // Function for cleaning up chart instances
};

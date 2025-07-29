'use strict';
import { 
  capitalizeFirstLetter, punctuationNameCheck, TextColor, TransparentColor, 
} from './helpers.js';

const RadarChart = document.getElementById('stats-chart');
let statsChart = null;

function displayStatsChart(backgroundColor, borderColor, stats, max, name) {
  // Efficiently destroy existing chart
  if (statsChart) {
    statsChart.destroy();
    statsChart = null;
  }
  
  name = punctuationNameCheck(name);
  const chart = RadarChart;
  
  // Pre-configure chart data for better performance
  const chartData = {
    labels: ['HP', 'Attack', 'Defense', 'Sp.Atk', 'Sp.Def', 'Speed'],
    datasets: [{
      data: stats,
      backgroundColor,
      borderColor,
    }],
  };

  const chartOptions = {
    responsive: false,
    animation: {
      duration: 300 // Reduce animation time for better performance
    },
    elements: {
      point: {
        radius: 4,
        pointStyle: 'star',
      },
    },
    plugins: {
      title: {
        display: true,
        text: `Stats For ${capitalizeFirstLetter(name)}`,
      },
      legend: {
        display: false,
      },
    },
    layout: {
      padding: 10,
    },
    font: {
      size: 24,
      family: 'Montserrat',
    },
    scales: {
      r: {
        min: 0,
        max,
        ticks: {
          fontColor: TextColor,
          backdropColor: TransparentColor,
          stepSize: 25,
        },
        grid: {
          color: TextColor,
        },
      },
    },
  };
  
  // Create chart with optimized settings
  statsChart = new Chart(chart, {
    type: 'radar',
    data: chartData,
    options: chartOptions,
  });
  
  chart.style.width = chart.parentElement.style.width;
  chart.style.height = chart.parentElement.style.height;
} //displayStatsChart

export {
  displayStatsChart,
};

'use strict';
import { 
  capitalizeFirstLetter, punctuationNameCheck, TextColor, TransparentColor, 
} from './helpers.js';

const RadarChart = document.getElementById('stats-chart');
let statsChart = null;

function displayStatsChart(backgroundColor, borderColor, stats, max, name) {
  if(statsChart != null) {
    statsChart.destroy();
  }
  name = punctuationNameCheck(name);
  const chart = RadarChart;
  const data = {
    labels: [ 
      'HP', 
      'Attack', 
      'Defense', 
      'Sp.Atk', 
      'Sp.Def', 
      'Speed', 
    ],
    datasets: [{
      data: [ 
        stats[0], 
        stats[1], 
        stats[2], 
        stats[3], 
        stats[4], 
        stats[5], 
      ],
      backgroundColor,
      borderColor,
    }],
  };

  const options = {
    responsive: false,
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
  statsChart = new Chart(chart, {
    type: 'radar',
    data: data,
    options: options,
  });
  chart.style.width = chart.parentElement.style.width;
  chart.style.height = chart.parentElement.style.height;
} //displayStatsChart

export {
  displayStatsChart,
};

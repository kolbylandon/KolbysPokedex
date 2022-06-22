'use strict';
import * as helpers from './helpers.js';

let statsChart = null;

function displayStatsChart(backgroundColor, borderColor, stats, max) {
  if(statsChart != null) {
    statsChart.destroy();
  }
  let chart = helpers.statsChart;
  let data = {
    labels: [ 'HP', 'Attack', 'Defense', 'Sp.Atk', 'Sp.Def', 'Speed', ],
    datasets: [{
      data: [ stats[0], stats[1], stats[2], stats[3], stats[4], stats[5], ],
      backgroundColor,
      borderColor,
    }],
  };
  let options = {
    responsive: false,
    elements: {
      point: {
        radius: 4,
        pointStyle: 'star',
      },
    },
    plugins: {
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
          color: helpers.textColor,
          stepSize: 25,
        },
        grid: {
          color: helpers.textColor,
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
}

export {
  displayStatsChart,
};

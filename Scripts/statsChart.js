import * as helpers from './helpers.js';

let statsChart = null;

function displayStatsChart(color, hp, attack, defense, spAttack, spDefense, speed) {
  if(statsChart != null) {
    statsChart.destroy();
  }
  let chart = helpers.statsChart;
  let data = {
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
        hp,
        attack,
        defense,
        spAttack,
        spDefense,
        speed,
      ],
      backgroundColor: helpers.convertHexToRgba(color, 0.35),
      borderColor: helpers.convertHexToRgba(color, 0.55),
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
        max: helpers.getLargestStat(hp, attack, defense, spAttack, spDefense, speed) + 25,
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

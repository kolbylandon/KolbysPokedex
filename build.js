// build.js
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: [
    'Scripts/index.js',
    'Scripts/main.js',
    'Scripts/matrix-bg.js',
    'Scripts/particles.js',
    'Scripts/performance.js',
    'Scripts/pokemon.js',
    'Scripts/requests.js',
    'Scripts/statsChart.js',
    'Scripts/sw-manager.js',
  ],
  bundle: true,
  minify: true,
  outdir: 'dist',
  sourcemap: false,
  splitting: true,
  format: 'esm',
}).catch(() => process.exit(1));

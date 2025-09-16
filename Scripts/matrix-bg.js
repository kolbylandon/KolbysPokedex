// matrix-bg.js: Matrix background animation for Porygon family


function startMatrixEffect() {
  const container = document.getElementById('matrix-bg');
  const canvas = document.getElementById('matrix-canvas');
  if (!container || !canvas) return;

  const ctx = canvas.getContext('2d');
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789亜愛安以衣位宇雲永炎王音下化花会海学楽漢気空月見語国山子時食新人水生青石赤先川千村天電土東日白百文木目友力林話';
  const fontSize = 16;
  let columns, drops;

  function resizeMatrixCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);
  }
  resizeMatrixCanvas();
  container.style.display = 'block';

  // Throttle resize events
  let resizeTimeout = null;
  function handleResize() {
    if (resizeTimeout) return;
    resizeTimeout = setTimeout(() => {
      resizeMatrixCanvas();
      resizeTimeout = null;
    }, 100);
  }
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);

  // Animation loop using requestAnimationFrame
  let running = true;
  function drawMatrix() {
    if (!running) return;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontSize + 'px monospace';
    ctx.fillStyle = '#00FF41';
    for (let i = 0; i < columns; i++) {
      const text = letters[Math.floor(Math.random() * letters.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
    window.matrixFrame = requestAnimationFrame(drawMatrix);
  }

  running = true;
  window.matrixFrame = requestAnimationFrame(drawMatrix);
  window.matrixResizeHandler = handleResize;
}

function stopMatrixEffect() {
  const container = document.getElementById('matrix-bg');
  if (container) container.style.display = 'none';
  if (window.matrixFrame) {
    cancelAnimationFrame(window.matrixFrame);
    window.matrixFrame = null;
  }
  if (window.matrixResizeHandler) {
    window.removeEventListener('resize', window.matrixResizeHandler);
    window.removeEventListener('orientationchange', window.matrixResizeHandler);
    window.matrixResizeHandler = null;
  }
}

function isDev() {
  return typeof process === 'undefined' || process.env.NODE_ENV !== 'production';
}

// Example usage:
// if (isDev()) console.log('message');
// if (isDev()) console.warn('message');
// if (isDev()) console.error('message');

export { startMatrixEffect, stopMatrixEffect };

// matrix-bg.js: Matrix background animation for Porygon family

function startMatrixEffect() {
  const container = document.getElementById('matrix-bg');
  const canvas = document.getElementById('matrix-canvas');
  if (!container || !canvas) return;

  function resizeMatrixCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeMatrixCanvas();
  container.style.display = 'block';
  const ctx = canvas.getContext('2d');
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const fontSize = 16;
  let columns = Math.floor(canvas.width / fontSize);
  let drops = Array(columns).fill(1);

  function drawMatrix() {
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
  }

  function handleResize() {
    resizeMatrixCanvas();
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);
  }
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);

  if (window.matrixInterval) clearInterval(window.matrixInterval);
  window.matrixInterval = setInterval(drawMatrix, 50);
  window.matrixResizeHandler = handleResize;
}

function stopMatrixEffect() {
  const container = document.getElementById('matrix-bg');
  if (container) container.style.display = 'none';
  if (window.matrixInterval) {
    clearInterval(window.matrixInterval);
    window.matrixInterval = null;
  }
  if (window.matrixResizeHandler) {
    window.removeEventListener('resize', window.matrixResizeHandler);
    window.removeEventListener('orientationchange', window.matrixResizeHandler);
    window.matrixResizeHandler = null;
  }
}

export { startMatrixEffect, stopMatrixEffect };

// ===== DIGITAL RAIN BACKGROUND =====
const canvas = document.getElementById('matrix-rain');
const ctx = canvas.getContext('2d');

const WORD = 'JOHNWICK';   // the text that falls in every column
const fontSize = 16;
let drops = [];    // how far down each column has fallen
let offsets = [];  // which letter each column starts on

// Size the canvas to the window and set up one "drop" per column
function setupRain() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const columns = Math.floor(canvas.width / fontSize);
  drops = [];
  offsets = [];
  for (let i = 0; i < columns; i++) {
    drops.push(Math.floor(Math.random() * -50));               // random start above the screen
    offsets.push(Math.floor(Math.random() * WORD.length));     // random starting letter
  }
}

// Draw one frame of the animation
function drawRain() {
  // Paint a see-through black layer so old letters slowly fade
  ctx.fillStyle = 'rgba(1, 3, 2, 0.08)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#00ff66';
  ctx.font = fontSize + 'px monospace';

  for (let i = 0; i < drops.length; i++) {
    // Only draw once the drop has reached the visible screen
    if (drops[i] >= 0) {
      const letterIndex = (drops[i] + offsets[i]) % WORD.length;
      ctx.fillText(WORD[letterIndex], i * fontSize, drops[i] * fontSize);
    }

    // When a drop falls off the bottom, sometimes restart it at the top
    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }
}

// Respect people who've asked their device for less motion
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion) {
  setupRain();
  window.addEventListener('resize', setupRain);
  setInterval(drawRain, 50);
}
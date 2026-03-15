// ===== PARTICLE BACKGROUND =====
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
let animFrame;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 1.5 + 0.3;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.opacity = Math.random() * 0.4 + 0.1;
    this.hue = Math.random() > 0.5 ? 255 : 200;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
      this.reset();
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.hue === 255 ? '108,92,231' : '9,132,227'}, ${this.opacity})`;
    ctx.fill();
  }
}

for (let i = 0; i < 60; i++) {
  particles.push(new Particle());
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });

  // Draw connections
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(108, 92, 231, ${0.06 * (1 - dist / 120)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
  animFrame = requestAnimationFrame(animateParticles);
}
animateParticles();

// ===== MASCOT GREETING =====
const greetings = [
  "Hey there, student! Ready to learn something amazing today?",
  "Namaste! Apna Browser is here to help you ace your studies!",
  "Welcome back! What would you like to explore today?",
  "Hi there! Let's make today's study session productive!",
  "Padhai ka time hai! Let's get started with Apna Browser!"
];

const greetingText = document.getElementById('greeting-text');
const greeting = greetings[Math.floor(Math.random() * greetings.length)];
let charIndex = 0;

function typeGreeting() {
  if (charIndex < greeting.length) {
    greetingText.textContent += greeting[charIndex];
    charIndex++;
    setTimeout(typeGreeting, 30 + Math.random() * 30);
  }
}
setTimeout(typeGreeting, 800);

// ===== SEARCH =====
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (query) {
      window.electronAPI.tab.navigate(query);
    }
  }
});

// ===== SUBJECT CARDS =====
document.querySelectorAll('.subject-card').forEach(card => {
  card.addEventListener('click', () => {
    const url = card.dataset.url;
    if (url) window.electronAPI.tab.navigate(url);
  });
});

// ===== PLATFORM CARDS =====
document.querySelectorAll('.platform-card').forEach(card => {
  card.addEventListener('click', () => {
    const url = card.dataset.url;
    if (url) window.electronAPI.tab.navigate(url);
  });
});

// ===== BOOKMARKS =====
document.querySelectorAll('.bookmark').forEach(bm => {
  bm.addEventListener('click', (e) => {
    e.preventDefault();
    const url = bm.dataset.url;
    if (url) window.electronAPI.tab.navigate(url);
  });
});

// ===== POMODORO TIMER =====
const timerDisplay = document.getElementById('timer-display');
const timerProgress = document.getElementById('timer-progress');
const timerStatus = document.getElementById('timer-status');
const btnStart = document.getElementById('timer-start');
const btnPause = document.getElementById('timer-pause');
const btnReset = document.getElementById('timer-reset');

const CIRCUMFERENCE = 2 * Math.PI * 52; // radius 52
let timerMinutes = 25;
let totalTime = timerMinutes * 60;
let timeLeft = totalTime;
let timerInterval = null;
let isRunning = false;

function updateTimerDisplay() {
  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  timerDisplay.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

  // Update ring
  const progress = 1 - (timeLeft / totalTime);
  const offset = CIRCUMFERENCE * progress;
  timerProgress.style.strokeDashoffset = CIRCUMFERENCE - (CIRCUMFERENCE * (timeLeft / totalTime));
}

document.querySelectorAll('.timer-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    if (isRunning) return;
    timerMinutes = parseInt(btn.dataset.minutes);
    totalTime = timerMinutes * 60;
    timeLeft = totalTime;
    updateTimerDisplay();
    document.querySelectorAll('.timer-preset').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

document.querySelector('.timer-preset[data-minutes="25"]').classList.add('active');

btnStart.addEventListener('click', () => {
  if (isRunning) return;
  isRunning = true;
  btnStart.disabled = true;
  btnPause.disabled = false;
  timerStatus.textContent = 'Focus mode active — stay focused!';
  window.electronAPI.focus.toggle();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      btnStart.disabled = false;
      btnPause.disabled = true;
      timerStatus.textContent = 'Great job! Session complete. Take a break!';
      timeLeft = totalTime;
      updateTimerDisplay();
    }
  }, 1000);
});

btnPause.addEventListener('click', () => {
  if (!isRunning) return;
  clearInterval(timerInterval);
  isRunning = false;
  btnStart.disabled = false;
  btnPause.disabled = true;
  timerStatus.textContent = 'Paused';
});

btnReset.addEventListener('click', () => {
  clearInterval(timerInterval);
  isRunning = false;
  timeLeft = totalTime;
  updateTimerDisplay();
  btnStart.disabled = false;
  btnPause.disabled = true;
  timerStatus.textContent = '';
});

updateTimerDisplay();

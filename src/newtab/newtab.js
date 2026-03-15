const searchInput = document.getElementById('search-input');
const timerDisplay = document.getElementById('timer-display');
const timerStatus = document.getElementById('timer-status');
const btnStart = document.getElementById('timer-start');
const btnPause = document.getElementById('timer-pause');
const btnReset = document.getElementById('timer-reset');

let timerMinutes = 25;
let timeLeft = timerMinutes * 60;
let timerInterval = null;
let isRunning = false;

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (query) {
      window.electronAPI.tab.navigate(query);
    }
  }
});

document.querySelectorAll('.subject-card').forEach(card => {
  card.addEventListener('click', () => {
    const url = card.dataset.url;
    if (url) window.electronAPI.tab.navigate(url);
  });
});

document.querySelectorAll('.bookmark').forEach(bm => {
  bm.addEventListener('click', (e) => {
    e.preventDefault();
    const url = bm.dataset.url;
    if (url) window.electronAPI.tab.navigate(url);
  });
});

document.querySelectorAll('.timer-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    if (isRunning) return;
    timerMinutes = parseInt(btn.dataset.minutes);
    timeLeft = timerMinutes * 60;
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
  timerStatus.textContent = 'Focus mode activated';
  window.electronAPI.focus.toggle();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      btnStart.disabled = false;
      btnPause.disabled = true;
      timerStatus.textContent = 'Session complete! Take a break.';
      timeLeft = timerMinutes * 60;
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
  timeLeft = timerMinutes * 60;
  updateTimerDisplay();
  btnStart.disabled = false;
  btnPause.disabled = true;
  timerStatus.textContent = '';
});

function updateTimerDisplay() {
  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  timerDisplay.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

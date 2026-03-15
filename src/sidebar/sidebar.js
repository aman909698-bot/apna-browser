const chatMessages = document.getElementById('chat-messages');
const questionInput = document.getElementById('question-input');

function addMessage(text, type) {
  const existing = chatMessages.querySelector('.message.loading');
  if (existing) existing.remove();

  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showLoading() {
  const msg = document.createElement('div');
  msg.className = 'message loading';
  msg.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

document.getElementById('btn-summarize').addEventListener('click', () => {
  addMessage('Summarize this page', 'user');
  showLoading();
  window.electronAPI.sidebar.ask({ action: 'summarize' });
});

document.getElementById('btn-explain').addEventListener('click', () => {
  addMessage('Explain this content simply', 'user');
  showLoading();
  window.electronAPI.sidebar.ask({ action: 'explain' });
});

document.getElementById('btn-send').addEventListener('click', sendQuestion);
questionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendQuestion();
});

function sendQuestion() {
  const question = questionInput.value.trim();
  if (!question) return;
  addMessage(question, 'user');
  showLoading();
  window.electronAPI.sidebar.ask({ action: 'ask', question });
  questionInput.value = '';
}

window.electronAPI.sidebar.onResponse((data) => {
  if (data.error) {
    addMessage(data.error, 'error');
  } else {
    addMessage(data.text, 'ai');
  }
});

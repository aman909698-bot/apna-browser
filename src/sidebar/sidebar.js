const chatMessages = document.getElementById('chat-messages');
const questionInput = document.getElementById('question-input');
const btnVoice = document.getElementById('btn-voice');
let isRecording = false;
let recognition = null;

// Speech Recognition setup
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-IN';

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    questionInput.value = transcript;
    stopRecording();
  };

  recognition.onerror = () => {
    stopRecording();
  };

  recognition.onend = () => {
    stopRecording();
  };
}

function startRecording() {
  if (!recognition) {
    addMessage('Speech recognition not supported in this browser.', 'error');
    return;
  }
  isRecording = true;
  btnVoice.classList.add('recording');
  recognition.start();
}

function stopRecording() {
  isRecording = false;
  btnVoice.classList.remove('recording');
  if (recognition) {
    try { recognition.stop(); } catch {}
  }
}

btnVoice.addEventListener('click', () => {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});

// Text-to-Speech
function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.lang = 'en-IN';
  window.speechSynthesis.speak(utterance);
}

function addMessage(text, type) {
  const existing = chatMessages.querySelector('.message.loading');
  if (existing) existing.remove();

  const msg = document.createElement('div');
  msg.className = `message ${type}`;

  const textEl = document.createElement('div');
  textEl.className = 'msg-text';
  textEl.textContent = text;
  msg.appendChild(textEl);

  // Add TTS button for AI responses
  if (type === 'ai') {
    const controls = document.createElement('div');
    controls.className = 'msg-controls';

    const ttsBtn = document.createElement('button');
    ttsBtn.className = 'tts-btn';
    ttsBtn.title = 'Read aloud';
    ttsBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polygon points="1,4.5 1,9.5 4,9.5 8,12.5 8,1.5 4,4.5" fill="currentColor"/><path d="M10 4.5a3.5 3.5 0 010 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M11.5 3a5.5 5.5 0 010 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
    ttsBtn.addEventListener('click', () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        ttsBtn.classList.remove('speaking');
      } else {
        ttsBtn.classList.add('speaking');
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 0.95;
        utt.lang = 'en-IN';
        utt.onend = () => ttsBtn.classList.remove('speaking');
        window.speechSynthesis.speak(utt);
      }
    });

    const copyBtn = document.createElement('button');
    copyBtn.className = 'tts-btn';
    copyBtn.title = 'Copy';
    copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M10 4V2.5A1.5 1.5 0 008.5 1H2.5A1.5 1.5 0 001 2.5v6A1.5 1.5 0 002.5 10H4" stroke="currentColor" stroke-width="1.3"/></svg>';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(text);
      copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      setTimeout(() => {
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M10 4V2.5A1.5 1.5 0 008.5 1H2.5A1.5 1.5 0 001 2.5v6A1.5 1.5 0 002.5 10H4" stroke="currentColor" stroke-width="1.3"/></svg>';
      }, 2000);
    });

    controls.appendChild(ttsBtn);
    controls.appendChild(copyBtn);
    msg.appendChild(controls);
  }

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

document.getElementById('btn-ask-page').addEventListener('click', () => {
  questionInput.focus();
  questionInput.placeholder = 'Type your question about this page...';
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

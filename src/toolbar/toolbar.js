const tabsContainer = document.getElementById('tabs-container');
const urlBar = document.getElementById('url-bar');
const btnFocus = document.getElementById('btn-focus');
const btnSidebar = document.getElementById('btn-sidebar');

const tabs = new Map();
let activeTabId = null;

function createTabElement(id, title) {
  const tab = document.createElement('div');
  tab.className = 'tab';
  tab.dataset.id = id;

  const titleSpan = document.createElement('span');
  titleSpan.className = 'tab-title';
  titleSpan.textContent = title || 'New Tab';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'tab-close';
  closeBtn.textContent = '\u00d7';
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.electronAPI.tab.close(id);
  });

  tab.appendChild(titleSpan);
  tab.appendChild(closeBtn);

  tab.addEventListener('click', () => {
    window.electronAPI.tab.switch(id);
  });

  tabsContainer.appendChild(tab);
  tabs.set(id, { element: tab, title, url: '' });
}

window.electronAPI.tab.onUpdate((data) => {
  let tabData = tabs.get(data.id);
  if (!tabData) {
    createTabElement(data.id, data.title);
    tabData = tabs.get(data.id);
  }

  tabData.title = data.title;
  tabData.url = data.url;

  const titleEl = tabData.element.querySelector('.tab-title');
  const existingLoader = tabData.element.querySelector('.tab-loading');

  if (data.loading && !existingLoader) {
    const loader = document.createElement('div');
    loader.className = 'tab-loading';
    tabData.element.insertBefore(loader, titleEl);
  } else if (!data.loading && existingLoader) {
    existingLoader.remove();
  }

  titleEl.textContent = data.title || 'New Tab';

  if (data.isActive) {
    setActiveTab(data.id);
    updateUrlBar(data.url);
  }
});

window.electronAPI.tab.onRemoved((id) => {
  const tabData = tabs.get(id);
  if (tabData) {
    tabData.element.remove();
    tabs.delete(id);
  }
});

window.electronAPI.tab.onSwitched((id) => {
  setActiveTab(id);
  const tabData = tabs.get(id);
  if (tabData) updateUrlBar(tabData.url);
});

function setActiveTab(id) {
  activeTabId = id;
  tabs.forEach((data, tabId) => {
    data.element.classList.toggle('active', tabId === id);
  });
}

function updateUrlBar(url) {
  if (!url) { urlBar.value = ''; return; }
  if (url.startsWith('file://')) {
    urlBar.value = '';
  } else {
    urlBar.value = url;
  }
}

document.getElementById('new-tab-btn').addEventListener('click', () => {
  window.electronAPI.tab.create();
});

document.getElementById('btn-back').addEventListener('click', () => {
  window.electronAPI.nav.back();
});

document.getElementById('btn-forward').addEventListener('click', () => {
  window.electronAPI.nav.forward();
});

document.getElementById('btn-reload').addEventListener('click', () => {
  window.electronAPI.nav.reload();
});

urlBar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const value = urlBar.value.trim();
    if (value) {
      window.electronAPI.tab.navigate(value);
      urlBar.blur();
    }
  }
});

urlBar.addEventListener('focus', () => {
  urlBar.select();
});

btnFocus.addEventListener('click', () => {
  window.electronAPI.focus.toggle();
});

btnSidebar.addEventListener('click', () => {
  window.electronAPI.sidebar.toggle();
});

window.electronAPI.sidebar.onToggled((open) => {
  btnSidebar.classList.toggle('sidebar-active', open);
});

document.getElementById('btn-screenshot').addEventListener('click', () => {
  window.electronAPI.screenshot.take();
});

window.electronAPI.screenshot.onDone((filePath) => {
  const btn = document.getElementById('btn-screenshot');
  btn.style.color = '#00cec9';
  setTimeout(() => { btn.style.color = ''; }, 1500);
});

document.getElementById('btn-reports').addEventListener('click', () => {
  window.electronAPI.reports.open();
});

// Focus mode visual feedback
let focusActive = false;
window.electronAPI.focus.onStatus((active) => {
  focusActive = active;
  btnFocus.classList.toggle('focus-active', active);
  btnFocus.title = active ? 'Focus Mode ON — Only edu sites allowed' : 'Focus Mode — Block Distractions';
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 't': e.preventDefault(); window.electronAPI.tab.create(); break;
      case 'w': e.preventDefault(); if (activeTabId) window.electronAPI.tab.close(activeTabId); break;
      case 'l': e.preventDefault(); urlBar.focus(); break;
      case 'b': e.preventDefault(); window.electronAPI.sidebar.toggle(); break;
      case 'r': e.preventDefault(); window.electronAPI.nav.reload(); break;
      case '=': case '+': e.preventDefault(); window.electronAPI.zoom.in(); break;
      case '-': e.preventDefault(); window.electronAPI.zoom.out(); break;
      case '0': e.preventDefault(); window.electronAPI.zoom.reset(); break;
    }
    if (e.shiftKey && e.key === 'S') {
      e.preventDefault();
      window.electronAPI.screenshot.take();
    }
  }
});

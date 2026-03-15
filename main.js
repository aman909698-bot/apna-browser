const { app, BaseWindow, WebContentsView, ipcMain, session } = require('electron');
const path = require('path');
const TabManager = require('./lib/tab-manager');
const blocker = require('./lib/blocker');
const activityTracker = require('./lib/activity-tracker');
const aiService = require('./lib/ai-service');

const TOOLBAR_HEIGHT = 82;
let mainWindow = null;
let tabManager = null;
let toolbarView = null;
let sidebarView = null;

function createWindow() {
  mainWindow = new BaseWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Apna Browser',
    backgroundColor: '#0a0e27',
    autoHideMenuBar: true
  });

  toolbarView = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const [winWidth] = mainWindow.getSize();
  toolbarView.setBounds({ x: 0, y: 0, width: winWidth, height: TOOLBAR_HEIGHT });
  mainWindow.contentView.addChildView(toolbarView);
  toolbarView.webContents.loadFile(path.join(__dirname, 'src', 'toolbar', 'toolbar.html'));

  sidebarView = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  sidebarView.webContents.loadFile(path.join(__dirname, 'src', 'sidebar', 'sidebar.html'));

  tabManager = new TabManager(mainWindow, TOOLBAR_HEIGHT);
  tabManager.toolbarView = toolbarView;
  tabManager.sidebarView = sidebarView;

  tabManager.onTabUpdate = (data) => {
    toolbarView.webContents.send('tab:update', data);
  };
  tabManager.onTabRemoved = (id) => {
    toolbarView.webContents.send('tab:removed', id);
  };
  tabManager.onTabSwitched = (id) => {
    toolbarView.webContents.send('tab:switched', id);
  };

  tabManager.createTab();

  mainWindow.on('resize', () => {
    tabManager.handleResize();
  });

  setupBlockerInterceptor();
  seedDemoDataIfNeeded();
}

function setupBlockerInterceptor() {
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    if (details.resourceType === 'mainFrame' && blocker.isBlocked(details.url)) {
      blocker.recordBlocked();
      callback({
        redirectURL: `file://${path.join(__dirname, 'src', 'blocked', 'blocked.html')}?url=${encodeURIComponent(details.url)}`
      });
    } else {
      callback({});
    }
  });
}

function seedDemoDataIfNeeded() {
  const store = require('./lib/store');
  if (!store.get('demoSeeded')) {
    activityTracker.seedDemoData();
    store.set('demoSeeded', true);
  }
}

ipcMain.on('tab:create', (_, url) => { tabManager.createTab(url); });
ipcMain.on('tab:close', (_, id) => { tabManager.closeTab(id); });
ipcMain.on('tab:switch', (_, id) => { tabManager.switchTab(id); });
ipcMain.on('tab:navigate', (_, url) => { tabManager.navigate(url); });

ipcMain.on('nav:back', () => { tabManager.goBack(); });
ipcMain.on('nav:forward', () => { tabManager.goForward(); });
ipcMain.on('nav:reload', () => { tabManager.reload(); });

ipcMain.on('focus:toggle', () => {
  const active = blocker.toggle();
  if (active) activityTracker.recordFocusSession();
  toolbarView.webContents.send('focus:status', active);
});

ipcMain.on('sidebar:toggle', () => {
  const open = tabManager.toggleSidebar();
  toolbarView.webContents.send('sidebar:toggled', open);
  sidebarView.webContents.send('sidebar:toggled', open);
});

ipcMain.on('sidebar:ask', async (_, payload) => {
  const pageText = await tabManager.getActivePageText();
  let result;
  if (payload.action === 'summarize') {
    result = await aiService.summarize(pageText);
  } else if (payload.action === 'explain') {
    result = await aiService.explain(pageText);
  } else {
    result = await aiService.ask(pageText, payload.question);
  }
  sidebarView.webContents.send('sidebar:response', result);
});

ipcMain.on('reports:open', () => {
  const reportsUrl = `file://${path.join(__dirname, 'src', 'reports', 'reports.html')}`;
  tabManager.createTab(reportsUrl);
});

ipcMain.handle('activity:get-summary', () => {
  return activityTracker.getSummary();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});

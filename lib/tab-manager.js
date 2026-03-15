const { WebContentsView } = require('electron');
const path = require('path');
const blocker = require('./blocker');
const activityTracker = require('./activity-tracker');

class TabManager {
  constructor(mainWindow, toolbarHeight) {
    this.window = mainWindow;
    this.toolbarHeight = toolbarHeight;
    this.tabs = new Map();
    this.activeTabId = null;
    this.nextId = 1;
    this.sidebarOpen = false;
    this.sidebarWidth = 360;
    this.toolbarView = null;
    this.sidebarView = null;
    this.onTabUpdate = null;
    this.onTabRemoved = null;
    this.onTabSwitched = null;
  }

  _getTabBounds() {
    const [winWidth, winHeight] = this.window.getSize();
    const sidebarW = this.sidebarOpen ? this.sidebarWidth : 0;
    return {
      x: 0,
      y: this.toolbarHeight,
      width: winWidth - sidebarW,
      height: winHeight - this.toolbarHeight
    };
  }

  _getSidebarBounds() {
    const [winWidth, winHeight] = this.window.getSize();
    return {
      x: winWidth - this.sidebarWidth,
      y: this.toolbarHeight,
      width: this.sidebarWidth,
      height: winHeight - this.toolbarHeight
    };
  }

  createTab(url) {
    const id = this.nextId++;
    const isInternal = !url || url === 'newtab';
    const loadUrl = isInternal
      ? `file://${path.join(__dirname, '..', 'src', 'newtab', 'newtab.html')}`
      : this._normalizeUrl(url);

    const view = new WebContentsView({
      webPreferences: {
        preload: isInternal
          ? path.join(__dirname, '..', 'preload.js')
          : path.join(__dirname, '..', 'preload-tab.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    });

    view.setBounds(this._getTabBounds());
    this.tabs.set(id, { id, view, title: 'New Tab', url: loadUrl, loading: true, isInternal });

    view.webContents.on('page-title-updated', (_, title) => {
      const tab = this.tabs.get(id);
      if (tab) {
        tab.title = title;
        this._emitUpdate(id);
      }
    });

    view.webContents.on('did-navigate', (_, navUrl) => {
      this._handleNavigation(id, navUrl);
    });

    view.webContents.on('did-navigate-in-page', (_, navUrl) => {
      this._handleNavigation(id, navUrl);
    });

    view.webContents.on('did-start-loading', () => {
      const tab = this.tabs.get(id);
      if (tab) { tab.loading = true; this._emitUpdate(id); }
    });

    view.webContents.on('did-stop-loading', () => {
      const tab = this.tabs.get(id);
      if (tab) { tab.loading = false; this._emitUpdate(id); }
    });

    view.webContents.on('did-fail-load', (_, errorCode, errorDesc, validatedUrl) => {
      if (errorCode === -3) return; // aborted, ignore
      const tab = this.tabs.get(id);
      if (tab) { tab.loading = false; this._emitUpdate(id); }
    });

    view.webContents.setWindowOpenHandler(({ url: newUrl }) => {
      this.createTab(newUrl);
      return { action: 'deny' };
    });

    view.webContents.loadURL(loadUrl);
    this.switchTab(id);

    return id;
  }

  _handleNavigation(id, navUrl) {
    const tab = this.tabs.get(id);
    if (!tab) return;

    if (blocker.isBlocked(navUrl)) {
      blocker.recordBlocked();
      const blockedPath = `file://${path.join(__dirname, '..', 'src', 'blocked', 'blocked.html')}?url=${encodeURIComponent(navUrl)}`;
      tab.view.webContents.loadURL(blockedPath);
      return;
    }

    tab.url = navUrl;
    activityTracker.trackVisit(navUrl);
    this._emitUpdate(id);
  }

  _normalizeUrl(url) {
    if (!url) return `file://${path.join(__dirname, '..', 'src', 'newtab', 'newtab.html')}`;
    url = url.trim();
    if (url.startsWith('file://')) return url;
    if (/^https?:\/\//i.test(url)) return url;
    if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(url)) return 'https://' + url;
    return 'https://www.google.com/search?q=' + encodeURIComponent(url);
  }

  closeTab(id) {
    const tab = this.tabs.get(id);
    if (!tab) return;

    this.window.contentView.removeChildView(tab.view);
    tab.view.webContents.close();
    this.tabs.delete(id);

    if (this.onTabRemoved) this.onTabRemoved(id);

    if (this.tabs.size === 0) {
      this.createTab();
      return;
    }

    if (this.activeTabId === id) {
      const remaining = Array.from(this.tabs.keys());
      this.switchTab(remaining[remaining.length - 1]);
    }
  }

  switchTab(id) {
    const tab = this.tabs.get(id);
    if (!tab) return;

    if (this.activeTabId !== null && this.activeTabId !== id) {
      const prevTab = this.tabs.get(this.activeTabId);
      if (prevTab) {
        this.window.contentView.removeChildView(prevTab.view);
      }
    }

    tab.view.setBounds(this._getTabBounds());
    this.window.contentView.addChildView(tab.view);

    if (this.sidebarView && this.sidebarOpen) {
      this.window.contentView.removeChildView(this.sidebarView);
      this.window.contentView.addChildView(this.sidebarView);
    }

    this.activeTabId = id;
    if (this.onTabSwitched) this.onTabSwitched(id);
    this._emitUpdate(id);
  }

  navigate(url) {
    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return;

    const normalized = this._normalizeUrl(url);

    if (blocker.isBlocked(normalized)) {
      blocker.recordBlocked();
      const blockedPath = `file://${path.join(__dirname, '..', 'src', 'blocked', 'blocked.html')}?url=${encodeURIComponent(url)}`;
      tab.view.webContents.loadURL(blockedPath);
      return;
    }

    tab.isInternal = false;
    tab.view.webContents.loadURL(normalized);
  }

  goBack() {
    const tab = this.tabs.get(this.activeTabId);
    if (tab && tab.view.webContents.canGoBack()) tab.view.webContents.goBack();
  }

  goForward() {
    const tab = this.tabs.get(this.activeTabId);
    if (tab && tab.view.webContents.canGoForward()) tab.view.webContents.goForward();
  }

  reload() {
    const tab = this.tabs.get(this.activeTabId);
    if (tab) tab.view.webContents.reload();
  }

  async getActivePageText() {
    const tab = this.tabs.get(this.activeTabId);
    if (!tab || tab.isInternal) return '';
    try {
      const text = await tab.view.webContents.executeJavaScript(
        `(function() {
          const clone = document.body.cloneNode(true);
          clone.querySelectorAll('script,style,noscript,iframe,svg').forEach(e => e.remove());
          return clone.innerText.substring(0, 8000);
        })()`
      );
      return text || '';
    } catch {
      return '';
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this._relayout();
    return this.sidebarOpen;
  }

  _relayout() {
    const bounds = this._getTabBounds();
    for (const [, tab] of this.tabs) {
      if (tab.id === this.activeTabId) {
        tab.view.setBounds(bounds);
      }
    }
    if (this.sidebarView) {
      if (this.sidebarOpen) {
        this.sidebarView.setBounds(this._getSidebarBounds());
        this.window.contentView.addChildView(this.sidebarView);
      } else {
        this.window.contentView.removeChildView(this.sidebarView);
      }
    }
  }

  handleResize() {
    if (this.toolbarView) {
      const [winWidth] = this.window.getSize();
      this.toolbarView.setBounds({ x: 0, y: 0, width: winWidth, height: this.toolbarHeight });
    }
    this._relayout();
  }

  _emitUpdate(id) {
    const tab = this.tabs.get(id);
    if (!tab || !this.onTabUpdate) return;
    this.onTabUpdate({
      id: tab.id,
      title: tab.title,
      url: tab.url,
      loading: tab.loading,
      isActive: tab.id === this.activeTabId
    });
  }

  getAllTabInfo() {
    const info = [];
    for (const [, tab] of this.tabs) {
      info.push({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        loading: tab.loading,
        isActive: tab.id === this.activeTabId
      });
    }
    return info;
  }
}

module.exports = TabManager;

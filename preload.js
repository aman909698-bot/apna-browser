const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  tab: {
    create: (url) => ipcRenderer.send('tab:create', url),
    close: (id) => ipcRenderer.send('tab:close', id),
    switch: (id) => ipcRenderer.send('tab:switch', id),
    navigate: (url) => ipcRenderer.send('tab:navigate', url),
    onUpdate: (cb) => ipcRenderer.on('tab:update', (_, data) => cb(data)),
    onRemoved: (cb) => ipcRenderer.on('tab:removed', (_, id) => cb(id)),
    onSwitched: (cb) => ipcRenderer.on('tab:switched', (_, id) => cb(id))
  },
  nav: {
    back: () => ipcRenderer.send('nav:back'),
    forward: () => ipcRenderer.send('nav:forward'),
    reload: () => ipcRenderer.send('nav:reload')
  },
  focus: {
    toggle: () => ipcRenderer.send('focus:toggle'),
    onStatus: (cb) => ipcRenderer.on('focus:status', (_, active) => cb(active))
  },
  sidebar: {
    toggle: () => ipcRenderer.send('sidebar:toggle'),
    ask: (payload) => ipcRenderer.send('sidebar:ask', payload),
    onResponse: (cb) => ipcRenderer.on('sidebar:response', (_, data) => cb(data)),
    onToggled: (cb) => ipcRenderer.on('sidebar:toggled', (_, open) => cb(open))
  },
  reports: {
    open: () => ipcRenderer.send('reports:open'),
    getSummary: () => ipcRenderer.invoke('activity:get-summary')
  }
});

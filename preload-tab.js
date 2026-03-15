const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('apnaBrowser', {
  getPageText: () => {
    const body = document.body;
    if (!body) return '';
    const clone = body.cloneNode(true);
    const removable = clone.querySelectorAll('script, style, noscript, iframe, svg');
    removable.forEach(el => el.remove());
    return clone.innerText.substring(0, 8000);
  }
});

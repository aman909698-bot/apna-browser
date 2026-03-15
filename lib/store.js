const Store = require('electron-store');

const store = new Store({
  defaults: {
    bookmarks: [],
    focusMode: false,
    activityLog: [],
    dailyGoals: [],
    settings: {
      aiProvider: 'gemini',
      pomodoroMinutes: 25
    }
  }
});

module.exports = store;

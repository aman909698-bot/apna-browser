const store = require('./store');

const EDUCATIONAL_DOMAINS = [
  'youtube.com', 'khanacademy.org', 'wikipedia.org', 'ncert.nic.in',
  'coursera.org', 'geeksforgeeks.org', 'stackoverflow.com', 'wolframalpha.com',
  'eklavya.io', 'apnipathshala.org', 'w3schools.com', 'github.com',
  'scholar.google.com', 'docs.google.com', 'edx.org', 'brilliant.org'
];

const BLOCKED_DOMAINS = [
  'instagram.com', 'facebook.com', 'twitter.com', 'x.com',
  'tiktok.com', 'snapchat.com', 'reddit.com', 'twitch.tv',
  'discord.com', 'netflix.com', 'hotstar.com'
];

class ActivityTracker {
  constructor() {
    this.currentDomain = null;
    this.currentStart = null;
    this.focusSessions = store.get('focusSessions', 0);
  }

  categorize(domain) {
    const d = domain.toLowerCase().replace(/^www\./, '');
    if (EDUCATIONAL_DOMAINS.some(ed => d === ed || d.endsWith('.' + ed))) return 'educational';
    if (BLOCKED_DOMAINS.some(bd => d === bd || d.endsWith('.' + bd))) return 'blocked';
    return 'neutral';
  }

  trackVisit(url) {
    try {
      const domain = new URL(url).hostname.replace(/^www\./, '');
      if (!domain || domain === this.currentDomain) return;

      this._flushCurrent();
      this.currentDomain = domain;
      this.currentStart = Date.now();
    } catch {}
  }

  _flushCurrent() {
    if (!this.currentDomain || !this.currentStart) return;
    const duration = Math.round((Date.now() - this.currentStart) / 1000);
    if (duration < 2) return;

    const entry = {
      domain: this.currentDomain,
      category: this.categorize(this.currentDomain),
      start: this.currentStart,
      duration: duration,
      date: new Date(this.currentStart).toISOString().split('T')[0]
    };

    const log = store.get('activityLog', []);
    log.push(entry);
    if (log.length > 5000) log.splice(0, log.length - 5000);
    store.set('activityLog', log);

    this.currentDomain = null;
    this.currentStart = null;
  }

  recordFocusSession() {
    this.focusSessions++;
    store.set('focusSessions', this.focusSessions);
  }

  getSummary() {
    this._flushCurrent();
    const log = store.get('activityLog', []);
    const now = new Date();

    const todayStr = now.toISOString().split('T')[0];
    const todayEntries = log.filter(e => e.date === todayStr);

    const totals = { educational: 0, neutral: 0, blocked: 0 };
    todayEntries.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.duration; });

    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayEntries = log.filter(e => e.date === dateStr);
      const dayTotal = dayEntries.reduce((sum, e) => sum + (e.category === 'educational' ? e.duration : 0), 0);
      weeklyData.push({
        date: dateStr,
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        studySeconds: dayTotal
      });
    }

    const siteMap = {};
    todayEntries.forEach(e => {
      if (!siteMap[e.domain]) siteMap[e.domain] = { domain: e.domain, category: e.category, duration: 0 };
      siteMap[e.domain].duration += e.duration;
    });
    const topSites = Object.values(siteMap).sort((a, b) => b.duration - a.duration).slice(0, 10);

    return {
      today: totals,
      weekly: weeklyData,
      topSites: topSites,
      focusSessions: this.focusSessions,
      blockedAttempts: store.get('blockedAttempts', 0)
    };
  }

  seedDemoData() {
    const log = [];
    const domains = {
      educational: ['youtube.com', 'khanacademy.org', 'wikipedia.org', 'ncert.nic.in', 'geeksforgeeks.org', 'stackoverflow.com'],
      neutral: ['google.com', 'gmail.com', 'translate.google.com', 'docs.google.com'],
      blocked: ['instagram.com', 'reddit.com', 'twitter.com']
    };

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const eduCount = 4 + Math.floor(Math.random() * 4);
      for (let j = 0; j < eduCount; j++) {
        const domain = domains.educational[Math.floor(Math.random() * domains.educational.length)];
        log.push({
          domain,
          category: 'educational',
          start: d.getTime() + j * 3600000,
          duration: 600 + Math.floor(Math.random() * 2400),
          date: dateStr
        });
      }

      const neutralCount = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < neutralCount; j++) {
        const domain = domains.neutral[Math.floor(Math.random() * domains.neutral.length)];
        log.push({
          domain,
          category: 'neutral',
          start: d.getTime() + (eduCount + j) * 3600000,
          duration: 120 + Math.floor(Math.random() * 600),
          date: dateStr
        });
      }

      if (Math.random() > 0.4) {
        const domain = domains.blocked[Math.floor(Math.random() * domains.blocked.length)];
        log.push({
          domain,
          category: 'blocked',
          start: d.getTime() + 50000000,
          duration: 5 + Math.floor(Math.random() * 30),
          date: dateStr
        });
      }
    }

    store.set('activityLog', log);
    store.set('focusSessions', 12 + Math.floor(Math.random() * 8));
    store.set('blockedAttempts', 15 + Math.floor(Math.random() * 20));
    this.focusSessions = store.get('focusSessions');
  }
}

module.exports = new ActivityTracker();

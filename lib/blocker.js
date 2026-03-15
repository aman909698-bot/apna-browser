const store = require('./store');

const BLOCKED_DOMAINS = [
  'instagram.com', 'www.instagram.com',
  'facebook.com', 'www.facebook.com', 'm.facebook.com',
  'twitter.com', 'www.twitter.com', 'x.com', 'www.x.com',
  'tiktok.com', 'www.tiktok.com',
  'snapchat.com', 'www.snapchat.com',
  'reddit.com', 'www.reddit.com', 'old.reddit.com',
  'twitch.tv', 'www.twitch.tv',
  'discord.com', 'www.discord.com',
  'netflix.com', 'www.netflix.com',
  'hotstar.com', 'www.hotstar.com', 'www.hotstar.disney.com',
  'miniclip.com', 'www.miniclip.com',
  'poki.com', 'www.poki.com',
  'crazygames.com', 'www.crazygames.com'
];

const EDUCATIONAL_WHITELIST = [
  'youtube.com', 'www.youtube.com', 'm.youtube.com',
  'khanacademy.org', 'www.khanacademy.org',
  'wikipedia.org', 'en.wikipedia.org',
  'ncert.nic.in', 'www.ncert.nic.in',
  'coursera.org', 'www.coursera.org',
  'geeksforgeeks.org', 'www.geeksforgeeks.org',
  'stackoverflow.com', 'www.stackoverflow.com',
  'wolframalpha.com', 'www.wolframalpha.com',
  'eklavya.io', 'www.eklavya.io',
  'apnipathshala.org', 'www.apnipathshala.org',
  'w3schools.com', 'www.w3schools.com',
  'github.com', 'www.github.com',
  'docs.google.com', 'scholar.google.com'
];

class Blocker {
  constructor() {
    this.active = false;
    this.blockedAttempts = store.get('blockedAttempts', 0);
  }

  isBlocked(url) {
    if (!this.active) return false;
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      if (EDUCATIONAL_WHITELIST.some(d => hostname === d || hostname.endsWith('.' + d))) {
        return false;
      }
      return BLOCKED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
    } catch {
      return false;
    }
  }

  toggle() {
    this.active = !this.active;
    store.set('focusMode', this.active);
    return this.active;
  }

  setActive(state) {
    this.active = state;
    store.set('focusMode', this.active);
  }

  recordBlocked() {
    this.blockedAttempts++;
    store.set('blockedAttempts', this.blockedAttempts);
  }

  getBlockedCount() {
    return this.blockedAttempts;
  }
}

module.exports = new Blocker();

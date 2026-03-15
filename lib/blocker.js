const store = require('./store');

// Adult/18+ sites — ALWAYS blocked regardless of focus mode
const ADULT_BLOCKED = [
  'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com',
  'redtube.com', 'youporn.com', 'tube8.com', 'spankbang.com',
  'eporner.com', 'porntrex.com', 'hqporner.com', 'beeg.com',
  'brazzers.com', 'realitykings.com', 'bangbros.com',
  'chaturbate.com', 'livejasmin.com', 'stripchat.com', 'bongacams.com',
  'onlyfans.com', 'fansly.com',
  'rule34.xxx', 'e-hentai.org', 'nhentai.net', 'gelbooru.com',
  'literotica.com', 'sexstories.com',
  'omegle.com', 'chatroulette.com',
  '4chan.org', '8chan.moe', '8kun.top'
];

// Adult keywords in domain — if any of these appear in hostname, block it
const ADULT_KEYWORDS = [
  'porn', 'xxx', 'sex', 'nude', 'naked', 'hentai', 'erotic',
  'adult', 'nsfw', 'milf', 'cam4', 'camgirl', 'livecam',
  'escort', 'hookup', 'dating-adult'
];

// Entertainment/social media — blocked only in focus mode
const ENTERTAINMENT_BLOCKED = [
  'instagram.com', 'facebook.com', 'm.facebook.com',
  'twitter.com', 'x.com',
  'tiktok.com', 'snapchat.com',
  'reddit.com', 'old.reddit.com',
  'twitch.tv', 'discord.com',
  'netflix.com', 'hotstar.com', 'disneyplus.com', 'primevideo.com',
  'jiocinema.com', 'sonyliv.com', 'zee5.com', 'mxplayer.in',
  'voot.com', 'altbalaji.com',
  'spotify.com', 'gaana.com', 'wynk.in', 'jiosaavn.com',
  'miniclip.com', 'poki.com', 'crazygames.com',
  'roblox.com', 'steam.com', 'epicgames.com',
  'pinterest.com', 'tumblr.com',
  'telegram.org', 'web.telegram.org',
  'whatsapp.com', 'web.whatsapp.com',
  'amazon.in', 'amazon.com', 'flipkart.com', 'myntra.com',
  'ajio.com', 'meesho.com', 'nykaa.com'
];

// Gambling/betting — ALWAYS blocked
const GAMBLING_BLOCKED = [
  'dream11.com', 'bet365.com', '1xbet.com', 'betway.com',
  'stake.com', 'pokerstars.com', 'casumo.com',
  'jeetwin.com', 'parimatch.com', 'mostbet.com',
  'fairplay.co.in', '10cric.com', 'betway.co.in'
];

// Educational whitelist — allowed even in focus mode
const EDUCATIONAL_WHITELIST = [
  'khanacademy.org',
  'wikipedia.org', 'en.wikipedia.org', 'hi.wikipedia.org',
  'ncert.nic.in', 'cbse.gov.in', 'cbse.nic.in',
  'coursera.org', 'edx.org', 'udemy.com',
  'geeksforgeeks.org', 'leetcode.com', 'hackerrank.com', 'codechef.com',
  'stackoverflow.com', 'stackexchange.com',
  'wolframalpha.com', 'mathway.com', 'symbolab.com',
  'eklavya.io', 'apnipathshala.org',
  'w3schools.com', 'mdn.io', 'developer.mozilla.org',
  'github.com', 'gitlab.com',
  'docs.google.com', 'scholar.google.com', 'classroom.google.com',
  'drive.google.com', 'slides.google.com',
  'youtube.com', 'm.youtube.com',
  'byjus.com', 'unacademy.com', 'vedantu.com', 'toppr.com',
  'physicswallah.com', 'pw.live',
  'doubtnut.com', 'askiitians.com', 'embibe.com',
  'nptel.ac.in', 'swayam.gov.in', 'nios.ac.in',
  'sciencedirect.com', 'researchgate.net', 'jstor.org', 'arxiv.org',
  'britannica.com', 'dictionary.com', 'merriam-webster.com',
  'quizlet.com', 'brainly.in', 'brainly.com',
  'notion.so', 'notion.site',
  'canva.com',
  'translate.google.com',
  'desmos.com', 'geogebra.org',
  'codecademy.com', 'freecodecamp.org', 'replit.com',
  'tutorialspoint.com', 'javatpoint.com',
  'shiksha.com', 'collegedunia.com', 'careers360.com',
  'nta.ac.in', 'jeemain.nta.nic.in', 'neet.nta.nic.in'
];

function matchesDomain(hostname, domainList) {
  return domainList.some(d => {
    const clean = d.replace(/^www\./, '');
    return hostname === clean || hostname === 'www.' + clean || hostname.endsWith('.' + clean);
  });
}

function hasAdultKeyword(hostname) {
  return ADULT_KEYWORDS.some(kw => hostname.includes(kw));
}

class Blocker {
  constructor() {
    this.active = false;
    this.blockedAttempts = store.get('blockedAttempts', 0);
  }

  isBlocked(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();

      // Internal pages are never blocked
      if (url.startsWith('file://')) return false;

      // ALWAYS block adult content & gambling
      if (matchesDomain(hostname, ADULT_BLOCKED)) return 'adult';
      if (matchesDomain(hostname, GAMBLING_BLOCKED)) return 'adult';
      if (hasAdultKeyword(hostname)) return 'adult';

      // If focus mode is off, allow everything else
      if (!this.active) return false;

      // Focus mode ON: check if site is educational
      if (matchesDomain(hostname, EDUCATIONAL_WHITELIST)) return false;

      // Block entertainment sites explicitly
      if (matchesDomain(hostname, ENTERTAINMENT_BLOCKED)) return 'focus';

      // In focus mode, block ALL non-whitelisted sites
      return 'focus';
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

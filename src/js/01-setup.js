  /* ===== LEADERBOARD SETUP =====
     To share scores on your own website, paste your Supabase Project URL and publishable key between the quotes.
     Example: const SUPABASE_URL = 'https://abcdefgh.supabase.co';
     Leave them empty to keep scores on each player's device. Never paste the secret (service_role) key here. */
  const SUPABASE_URL = 'https://bpspwjzxglazmonacbtr.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_PCt45qNSdR6dPRehXvr4KQ_YeLWpE9Q';

  // Links only make sense when the game is the top-level page (your own site), not inside a frame.
  const TOP_LEVEL = window.self === window.top && /^https?:$/.test(location.protocol);
  const SHARE_URL = TOP_LEVEL ? location.origin + location.pathname : '';
  const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const STANDALONE = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  const $ = id => document.getElementById(id);
  const cv = $('c'), ctx = cv.getContext('2d');
  const PHONE = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  const fog = document.createElement('canvas'), fctx = fog.getContext('2d');
  const stage = $('stage'), scoreEl = $('score'), bestEl = $('best'), overlay = $('overlay'), panel = $('panel');
  const boostBtn = $('boost'), pauseBtn = $('pauseBtn'), musicBtn = $('musicBtn'), sfxBtn = $('sfxBtn');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Math.floor(n).toLocaleString('en-US');

  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth || 360; H = stage.clientHeight || 600;
    cv.width = fog.width = Math.round(W * dpr); cv.height = fog.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }


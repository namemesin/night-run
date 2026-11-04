  /* ================= save data ================= */
  const DEF_UP = { flare: 0, magnet: 0, combo: 0, shield: 0, soft: 0, lucky: 0, grind: 0 };
  let save = { best: 0, top: [], done: [], board: 0, muted: false, music: true, coins: 0, up: Object.assign({}, DEF_UP), bought: false };
  try {
    const raw = localStorage.getItem('nightrun-save3');
    if (raw) { const p = JSON.parse(raw); save = Object.assign(save, p); save.up = Object.assign({}, DEF_UP, p.up || {}); }
    else save.best = +localStorage.getItem('nightrun-best2') || 0;
  } catch (e) {}
  if (!Array.isArray(save.top)) save.top = [];
  if (!Array.isArray(save.done)) save.done = [];
  if (!save.bs || typeof save.bs !== 'object') save.bs = {};
  const LIFE_KEYS = ['runs', 'meters', 'flakes', 'lanterns', 'tricks', 'rails', 'gates', 'nearMiss', 'smashes', 'score', 'airs', 'saves', 'flares', 'shields', 'magnets', 'doubles', 'crashes', 'secs', 'ghostPasses', 'bcVisits', 'dailyDays', 'dailyStreak', 'spent', 'challenges', 'summitVisits', 'leaps', 'missions', 'sweeps', 'races', 'raceWins', 'ghostWins'];
  { const l = save.life && typeof save.life === 'object' ? save.life : {}; save.life = {}; for (const k of LIFE_KEYS) save.life[k] = Math.max(0, Math.floor(+l[k] || 0)); }
  if (!Array.isArray(save.skins)) save.skins = [];
  if (typeof save.skin !== 'string') save.skin = 'classic';
  // When the skin and board were last picked, so the newest pick wins when devices sync.
  if (!save.picked || typeof save.picked !== 'object') save.picked = {};
  save.picked = ['skin', 'board', 'color', 'title', 'trail', 'crash'].reduce((o, k) => (o[k] = Math.max(0, +save.picked[k] || 0), o), {});
  if (!Array.isArray(save.boardsOwned)) save.boardsOwned = [];
  if (!save.v || save.v < 2) {
    const oldR = [0, 3, 6, 9, 12, 15, 19, 24, 28], n = new Set(save.done).size;
    oldR.forEach((r, i) => { if (n >= r && !save.boardsOwned.includes(i)) save.boardsOwned.push(i); });
    save.v = 2;
  }
  if (save.mode !== 'daily') save.mode = 'free';
  if (typeof save.music !== 'boolean') save.music = true;
  // Device settings (not synced to the account): volumes, key bindings, and comfort options.
  const DEF_KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], flare: ['Space', 'ShiftLeft'], pause: ['KeyP', 'Escape'], restart: ['KeyR', ''] };
  const KEY_ACTIONS = [['left', 'Steer left'], ['right', 'Steer right'], ['flare', 'Fire Flare'], ['pause', 'Pause'], ['restart', 'Restart run']];
  const defSettings = () => ({ music: 80, sfx: 80, shake: true, ghost: true, fx: 'full', stats: true, steer: 'drag', keys: JSON.parse(JSON.stringify(DEF_KEYS)) });
  (() => {
    const d = defSettings(), st = save.settings && typeof save.settings === 'object' ? save.settings : {};
    const vol = v => Number.isFinite(+v) ? Math.max(0, Math.min(100, Math.round(+v))) : null;
    d.music = vol(st.music) ?? d.music; d.sfx = vol(st.sfx) ?? d.sfx;
    if (typeof st.shake === 'boolean') d.shake = st.shake;
    if (typeof st.ghost === 'boolean') d.ghost = st.ghost;
    if (typeof st.stats === 'boolean') d.stats = st.stats;
    if (st.steer === 'sides') d.steer = 'sides';
    if (st.fx === 'low') d.fx = 'low';
    if (st.keys && typeof st.keys === 'object') for (const [a] of KEY_ACTIONS) {
      const k = st.keys[a];
      if (Array.isArray(k)) d.keys[a] = [0, 1].map(i => typeof k[i] === 'string' ? k[i].slice(0, 24) : '');
    }
    save.settings = d;
  })();
  // A random id for this device, so player data can tell riders apart without knowing who anyone is.
  if (typeof save.dev !== 'string' || !/^[a-z0-9]{8,40}$/.test(save.dev)) save.dev = 'd' + Array.from({ length: 15 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
  // Flakes, XP and bought boosts are each kept as a ledger: what each copy of the progress has added and taken away.
  // Merging two devices takes the higher number for each entry, so a purchase on one device can't be undone by
  // another device's older copy, and flakes earned on two devices at once both count.
  const cleanCounts = o => { const r = {}; if (o && typeof o === 'object') for (const k in o) if (/^[a-z0-9]{8,40}$/.test(k)) { const v = Math.floor(+o[k]); if (v > 0) r[k] = v; } return r; };
  const sumCounts = o => Object.values(o).reduce((n, v) => n + v, 0);
  const pnClean = L => L && typeof L === 'object' ? { base: Math.max(0, Math.floor(+L.base || 0)), e: cleanCounts(L.e), s: cleanCounts(L.s) } : { base: 0, e: {}, s: {} };
  const pnRaw = L => L.base + sumCounts(L.e) - sumCounts(L.s);
  const pnVal = L => Math.max(0, pnRaw(L));
  function pnMerge(L, R) {
    R = pnClean(R); L.base = Math.max(L.base, R.base);
    for (const k in R.e) L.e[k] = Math.max(L.e[k] || 0, R.e[k]);
    for (const k in R.s) L.s[k] = Math.max(L.s[k] || 0, R.s[k]);
  }
  // Two devices spending the same flakes at once (or an admin taking more than you have) can push a total below zero.
  // That debt is forgiven, so the next flakes you earn show up instead of filling the hole.
  function pnHeal(L) { const r = pnRaw(L); if (r < 0) L.base -= r; }
  // Entries an admin added or took live under this key. Every other key belongs to one copy of the progress.
  const ADM = 'zadmin00';
  // The key this copy of the progress books under. It changes after every log out, so a guest's earnings on
  // this device can never be confused with an account's older entries from the same device.
  const newKey = () => 'k' + Array.from({ length: 15 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
  if (typeof save.lk !== 'string' || !/^[a-y0-9][a-z0-9]{7,39}$/.test(save.lk)) save.lk = save.dev;
  save.ledger = save.ledger && typeof save.ledger === 'object' ? pnClean(save.ledger) : { base: Math.max(0, Math.floor(+save.coins || 0)), e: {}, s: {} };
  const ledgerCoins = () => pnVal(save.ledger);
  save.coins = ledgerCoins();
  let coinMark = save.coins;
  // Books any change to save.coins since the last save as earned or spent by this copy.
  function settleCoins() {
    const d = Math.floor(+save.coins || 0) - coinMark, L = save.ledger;
    if (d > 0) L.e[save.lk] = (L.e[save.lk] || 0) + d;
    else if (d < 0) L.s[save.lk] = (L.s[save.lk] || 0) - d;
    save.coins = coinMark = ledgerCoins();
  }
  // Rewards that can only be earned once (an achievement, one of the day's missions) are booked under a key of their own,
  // so two devices that both earn the same one before they sync still only pay it once.
  const onceKey = (p, id) => { let h = 2166136261; for (const c of String(id)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return p + h.toString(36).padStart(7, '0'); };
  function bookOnce(key, amount) {
    settleCoins();
    const L = save.ledger; L.e[key] = Math.max(L.e[key] || 0, Math.floor(amount));
    save.coins = coinMark = ledgerCoins();
  }
  // Rider level. Every finished run earns XP for how far you rode and how many points you scored:
  // 1 XP per 10 m plus 1 XP per 30 points. Each level costs more than the one before it. Going from level L to L+1
  // takes 60·L^1.8 XP, so level 2 comes in a run or two, level 10 takes a few hours, and 50 is a long road.
  const XP_AT = [0, 0]; for (let L = 2; L <= 100; L++) XP_AT.push(XP_AT[L - 1] + Math.round(60 * (L - 1) ** 1.8));
  const xpAt = lv => XP_AT[Math.max(1, Math.min(100, lv | 0))];
  const levelFor = xp => { let L = 1; while (L < 99 && xp >= XP_AT[L + 1]) L++; return L; };
  const runXP = (meters, score) => Math.max(1, Math.floor((+meters || 0) / 10 + (+score || 0) / 30));
  const riderXP = () => pnVal(save.xpl);
  const riderLevel = () => levelFor(riderXP());
  // Riders from before this XP system keep at least the level they had.
  const oldLevel = l => Math.min(99, Math.floor((1 + Math.sqrt(1 + 4 * ((l.runs || 0) * 10 + Math.floor((l.meters || 0) / 25)) / 50)) / 2));
  const lifeXP = l => Math.max(Math.floor((l.meters || 0) / 10 + (l.score || 0) / 30), xpAt(oldLevel(l)));
  // xplMig: this copy worked its XP out from its own career stats just now. The account's copy wins the first time they meet.
  let xplMig = false;
  if (save.xpl && typeof save.xpl === 'object') save.xpl = pnClean(save.xpl);
  else { save.xpl = { base: lifeXP(save.life), e: {}, s: {} }; xplMig = true; }
  // Whose progress this is: an account id, or empty for a guest. ownerName covers copies saved before ids were kept.
  if (typeof save.owner !== 'string') save.owner = save.acct && save.acct.id ? String(save.acct.id) : '';
  if (typeof save.ownerName !== 'string') save.ownerName = save.acct ? String(save.acct.username || '') : String(save.name || '');
  save.epoch = Math.max(0, Math.floor(+save.epoch || 0)); save.gseen = Math.max(0, Math.floor(+save.gseen || 0));
  const KEY_NAMES = { ArrowLeft: '\u2190', ArrowRight: '\u2192', ArrowUp: '\u2191', ArrowDown: '\u2193', Space: 'Space', ShiftLeft: 'Left Shift', ShiftRight: 'Right Shift',
    ControlLeft: 'Left Ctrl', ControlRight: 'Right Ctrl', AltLeft: 'Left Alt', AltRight: 'Right Alt', MetaLeft: 'Left Cmd', MetaRight: 'Right Cmd', Escape: 'Esc', Enter: 'Enter',
    Tab: 'Tab', Backspace: 'Backspace', CapsLock: 'Caps Lock', Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Minus: '-', Equal: '=', Backquote: '`', Backslash: '\\' };
  const keyLabel = c => !c ? 'Not set' : KEY_NAMES[c] || (/^Key[A-Z]$/.test(c) ? c.slice(3) : /^Digit\d$/.test(c) ? c.slice(5) : /^Numpad/.test(c) ? 'Num ' + c.slice(6) : c);
  const keyFor = a => keyLabel(save.settings.keys[a].find(Boolean) || '');
  const keysFor = a => save.settings.keys[a].filter(Boolean).map(keyLabel);
  const cleanName = v => String(v || '').replace(/\s+/g, ' ').trim();
  const NAME_OK = /^[A-Za-z0-9 _.\-]{2,16}$/;
  save.name = NAME_OK.test(cleanName(save.name)) ? cleanName(save.name) : '';
  const saveLocal = () => { settleCoins(); try { localStorage.setItem('nightrun-save3', JSON.stringify(save)); } catch (e) { try { logError('E400', e); } catch (_) {} } };
  const persist = () => { saveLocal(); pushProgress(); };
  bestEl.textContent = fmt(save.best);

  const BOARDS = [
    { n: 'Mint', c: '#5cf2b0', r: 0 },
    { n: 'Ember', c: '#ff7a3d', r: 5 },
    { n: 'Glacier', c: '#8fd3ff', r: 12 },
    { n: 'Violet', c: '#b48cff', r: 20 },
    { n: 'Gold', c: '#ffd24a', r: 35 },
    { n: 'Crimson', c: '#ff4466', r: 50 },
    { n: 'Midnight', c: '#5a6fd6', r: 75 },
    { n: 'Aurora', c: 'aurora', r: 110, sw: 'linear-gradient(90deg,#5cf2b0,#4aa3ff,#b48cff)' },
    { n: 'Plasma', c: 'plasma', r: 150, sw: 'linear-gradient(90deg,#ff4fa3,#ffb347)' },
  ];

  // ---------- rider skins ----------
  // how: free, a flake price, an achievement id, or a number of achievements.
  const SKINS = [
    { id: 'classic', n: 'Classic', jacket: '#ffb347', stripe: '#ff7a3d', helmet: '#e8eef7', goggle: '#121c34' },
    { id: 'midnight', n: 'Midnight', rim: true, jacket: '#2b3a67', stripe: '#8fd3ff', helmet: '#e8eef7', goggle: '#8fd3ff', cost: 150 },
    { id: 'glacier', n: 'Glacier', jacket: '#8fd3ff', stripe: '#ffffff', helmet: '#ffffff', goggle: '#2b3a67', cost: 250 },
    { id: 'forest', n: 'Forest', jacket: '#2f6b55', stripe: '#ffd24a', helmet: '#e8eef7', goggle: '#121c34', extra: 'beanie', hat: '#ff7a3d', cost: 250 },
    { id: 'sunset', n: 'Sunset', jacket: '#ff6b8b', stripe: '#ffb347', helmet: '#fff2b0', goggle: '#5a2a4a', cost: 400 },
    { id: 'tux', n: 'Tuxedo', rim: true, jacket: '#1a1f2b', stripe: '#ffffff', helmet: '#1a1f2b', goggle: '#e8eef7', extra: 'bowtie', cost: 400 },
    { id: 'bee', n: 'Bumblebee', jacket: '#ffd24a', stripe: '#1a1f2b', helmet: '#1a1f2b', goggle: '#ffd24a', pattern: 'stripes', cost: 600 },
    { id: 'candy', n: 'Candy Cane', jacket: '#ff4466', stripe: '#ffffff', helmet: '#ffffff', goggle: '#ff4466', pattern: 'stripes', extra: 'beanie', hat: '#ff4466', cost: 600 },
    { id: 'cozy', n: 'Cozy', jacket: '#b48cff', stripe: '#e8eef7', helmet: '#e8eef7', goggle: '#121c34', extra: 'scarf', scarf: '#ffd24a', cost: 700 },
    { id: 'neon', n: 'Neon', jacket: '#ff2bd6', stripe: '#2bf5ff', helmet: '#2bf5ff', goggle: '#1a1f2b', glow: '255,43,214', cost: 900 },
    { id: 'medalist', n: 'Gold Medalist', jacket: '#ffd24a', stripe: '#ff7a3d', helmet: '#fff2b0', goggle: '#121c34', extra: 'medal', ach: 's12k' },
    { id: 'wildfire', n: 'Wildfire', jacket: '#ff4b2b', stripe: '#ffb347', helmet: '#1a1f2b', goggle: '#ffb347', extra: 'flames', ach: 'combo-25' },
    { id: 'ghostly', n: 'Ghostly', jacket: '#b48cff', stripe: '#e8eef7', helmet: '#e8eef7', goggle: '#3a2a6a', alpha: .55, ach: 'ghosts-25' },
    { id: 'lantern', n: 'Lantern Keeper', jacket: '#ffb347', stripe: '#ffe0a8', helmet: '#e8eef7', goggle: '#121c34', extra: 'lantern', ach: 'llant-500' },
    { id: 'snowman', n: 'Snowman', jacket: '#f4f8ff', stripe: '#1a1f2b', helmet: '#f4f8ff', goggle: '#121c34', pattern: 'buttons', extra: 'tophat', nose: true, ach: 'dstreak-7' },
    { id: 'phantom', n: 'Phantom', rim: true, jacket: '#141826', stripe: '#ff4466', helmet: '#141826', goggle: '#ff4466', extra: 'cape', glowEyes: true, ach: 'bcv-25' },
    { id: 'royal', n: 'Royal', jacket: '#7a3fd6', stripe: '#ffd24a', helmet: '#e8eef7', goggle: '#121c34', extra: 'crown', achCount: 100 },
    { id: 'aurora', n: 'Aurora', jacket: 'aurora', stripe: '#ffffff', helmet: '#e8eef7', goggle: '#121c34', achCount: 150 },
    { id: 'champion', n: 'Champion', jacket: '#ffd24a', stripe: '#ffffff', helmet: '#ffffff', goggle: '#121c34', extra: 'crown', halo: true, ach: 'all' },
  ];
  const skinById = id => SKINS.find(s => s.id === id) || SKINS[0];
  // ---------- flex: name colors and titles (everyone sees them on the boards), trails and crash effects ----------
  const COLORS = [
    { id: 'ice', n: 'Ice', c: '#8fd3ff', cost: 2000 }, { id: 'aurora', n: 'Aurora', c: '#5cf2b0', cost: 2000 },
    { id: 'flare', n: 'Flare', c: '#ffb347', cost: 3000 }, { id: 'violet', n: 'Violet', c: '#b48cff', cost: 4000 },
    { id: 'crimson', n: 'Crimson', c: '#ff4466', cost: 5000 }, { id: 'gold', n: 'Gold', c: '#ffd24a', cost: 6000 },
    { id: 'rainbow', n: 'Rainbow', c: 'rainbow', cost: 15000 },
  ];
  const TITLES = [
    { id: 'shredder', n: 'Shredder', cost: 2000 }, { id: 'powder', n: 'Powder Hound', cost: 3000 },
    { id: 'railrat', n: 'Rail Rat', cost: 3000, ach: 'rails-5' }, { id: 'nightowl', n: 'Night Owl', cost: 3000, ach: 'owl' },
    { id: 'lantern', n: 'Lantern Keeper', cost: 5000, ach: 'llant-100' }, { id: 'jumper', n: 'Crevasse Jumper', cost: 8000, ach: 'leap-5' },
    { id: 'legend', n: 'Summit Legend', cost: 15000, ach: 'summit' }, { id: 'king', n: 'Mountain King', cost: 25000 },
  ];
  const TRAILS = [
    { id: 'classic', n: 'Classic', c: '#8fb3d9', a: .3 }, { id: 'frost', n: 'Frost', c: '#cfeeff', a: .55, cost: 1000 },
    { id: 'gold', n: 'Gold Dust', c: '#ffd24a', a: .55, spark: '#fff2b0', cost: 2000 }, { id: 'neon', n: 'Neon', c: '#ff2bd6', a: .75, w: 4, cost: 3000 },
    { id: 'ember', n: 'Ember', c: '#ff7a3d', a: .6, fire: true, cost: 3500 }, { id: 'sparkle', n: 'Sparkle', c: '#ffffff', a: .45, spark: '#ffffff', cost: 4000 },
    { id: 'rainbow', n: 'Rainbow', c: 'rainbow', a: .65, w: 3.5, cost: 8000 },
  ];
  const CRASHES = [
    { id: 'classic', n: 'Classic', sw: ['#e8eef7', '#8fd3ff', '#ffb347'] }, { id: 'snow', n: 'Snow Bomb', sw: ['#ffffff', '#cfeeff', '#e8eef7'], cost: 1500 },
    { id: 'confetti', n: 'Confetti', sw: ['#ff4466', '#ffd24a', '#5cf2b0', '#4aa3ff', '#b48cff'], cost: 3000 },
    { id: 'shatter', n: 'Ice Shatter', sw: ['#8fd3ff', '#cfeeff', '#ffffff'], cost: 4000 }, { id: 'fireworks', n: 'Fireworks', sw: ['#ffb347', '#ff4466', '#ffd24a', '#7fe8ff'], cost: 6000 },
  ];
  const FLEX = { color: COLORS, title: TITLES, trail: TRAILS, crash: CRASHES };
  const flexItem = (kind, id) => (FLEX[kind] || []).find(x => x.id === id);
  {
    const o = save.owned && typeof save.owned === 'object' ? save.owned : {}, st = save.style && typeof save.style === 'object' ? save.style : {};
    save.owned = {}; save.style = {};
    for (const k in FLEX) {
      save.owned[k] = Array.isArray(o[k]) ? [...new Set(o[k].filter(id => typeof id === 'string' && flexItem(k, id) && flexItem(k, id).cost))] : [];
      const want = typeof st[k] === 'string' ? st[k] : '', ok = want && flexItem(k, want) && (!flexItem(k, want).cost || save.owned[k].includes(want));
      save.style[k] = ok ? want : (k === 'trail' || k === 'crash' ? 'classic' : '');
    }
  }
  const flexOwned = (kind, id) => { const it = flexItem(kind, id); return !!it && (!it.cost || save.owned[kind].includes(id)); };
  const nameHTML = (name, colorId, titleId) => {
    const c = flexItem('color', colorId), t = flexItem('title', titleId);
    const cls = c && c.c === 'rainbow' ? 'nm nm-rainbow' : 'nm', st = c && c.c !== 'rainbow' ? ` style="color:${c.c}"` : '';
    return `<b class="${cls}"${st}>${esc(name)}</b>${t ? ` <span class="ttl">${esc(t.n)}</span>` : ''}`;
  };
  // ---------- run boosts (Free ride only, so the daily course stays fair) ----------
  const HEAD_START = 650;
  const BOOSTS = [
    { id: 'head', n: 'Head start', short: 'Head start', cost: 300, d: 'Drop in at Black diamond (650 m). Distance achievements and missions only count what you ride.' },
    { id: 'lant', n: 'Full lanterns', short: '3 lanterns', cost: 150, d: 'Start with 3 lanterns, so your first Flare is ready to fire.' },
    { id: 'spare', n: 'Extra shield', short: 'Shield', cost: 200, d: 'A shield that kicks in when you have none, so with Starter Shield you get two.' },
    { id: 'revive', n: 'Second chance', short: '2nd chance', d: 'Keep riding after one crash. It waits until a crash uses it, even across runs. The price doubles each time you buy one in a day.' },
  ];
  // Boosts you've bought and haven't used yet. Each one is a ledger (bought or put back, minus used or refunded),
  // so a boost bought on your phone is waiting on your computer too. save.kit and save.kitPaid are worked out from it.
  const KIT_IDS = BOOSTS.map(b => b.id);
  const freshKit = () => { const kc = {}, kp = {}; for (const id of KIT_IDS) { kc[id] = { base: 0, e: {}, s: {} }; kp[id] = { at: 0, v: 0 }; } return { kc, kp }; };
  {
    const k = save.kit && typeof save.kit === 'object' ? save.kit : {}, pd = save.kitPaid && typeof save.kitPaid === 'object' ? save.kitPaid : {};
    const kc = save.kc && typeof save.kc === 'object' ? save.kc : null, kp = save.kp && typeof save.kp === 'object' ? save.kp : {};
    const f = freshKit(); save.kc = f.kc; save.kp = f.kp;
    for (const id of KIT_IDS) {
      if (kc) save.kc[id] = pnClean(kc[id]);
      else if (k[id] === true) save.kc[id].e[save.lk] = 1; // a boost bought before boosts synced
      const q = kp[id];
      save.kp[id] = q && typeof q === 'object' ? { at: Math.max(0, +q.at || 0), v: Math.max(0, Math.floor(+q.v || 0)) } : { at: 0, v: k[id] === true ? Math.max(0, Math.floor(+pd[id] || 0)) : 0 };
    }
    save.kit = {}; save.kitPaid = {};
    delete save.boosts;
    if (!save.revives || typeof save.revives !== 'object' || typeof save.revives.day !== 'string') save.revives = { day: '', n: 0 };
  }
  function kitSync() { for (const id of KIT_IDS) { save.kit[id] = pnVal(save.kc[id]) > 0; save.kitPaid[id] = save.kit[id] ? save.kp[id].v : 0; } }
  function kitAdd(id, paid) { const L = save.kc[id]; L.e[save.lk] = (L.e[save.lk] || 0) + 1; if (paid != null) save.kp[id] = { at: Date.now(), v: paid }; kitSync(); }
  function kitUse(id) { const L = save.kc[id]; L.s[save.lk] = (L.s[save.lk] || 0) + 1; pnHeal(L); kitSync(); }
  kitSync();
  function skinOwned(s) {
    if (!s.cost && !s.ach && !s.achCount) return true;
    if (Array.isArray(save.skins) && save.skins.includes(s.id)) return true;
    if (s.ach) return save.done.includes(s.ach);
    if (s.achCount) return achCount() >= s.achCount;
    return false;
  }
  const ownedSkinCount = () => SKINS.filter(skinOwned).length;
  const skinHow = s => s.cost ? `${fmt(s.cost)} flakes` : s.ach ? 'Unlock: ' + ((ACH.find(a => a.id === s.ach) || {}).n || 'achievement') : s.achCount ? `Unlock ${s.achCount} achievements` : 'Free';
  // Boards unlock by achievement count. Boards you've ever unlocked stay unlocked.
  const boardOwned = i => !!BOARDS[i] && ((Array.isArray(save.boardsOwned) && save.boardsOwned.includes(i)) || achCount() >= BOARDS[i].r);
  const boardFill = (b, now) => b.c === 'aurora' ? `hsl(${(now / 12) % 360},90%,65%)` : b.c === 'plasma' ? `hsl(${330 + Math.sin(now / 300) * 30},95%,62%)` : b.c;


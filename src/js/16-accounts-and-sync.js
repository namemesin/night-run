  // ---------- accounts (your own site, backed by Supabase) ----------
  // On claude.ai the page uses Claude's own sign-in instead, so accounts only switch on for self-hosted copies.
  const ACCOUNTS = sbReady && !(window.claude && typeof window.claude.use === 'function');
  let guest = false, authMode = 'register', authBusy = false, authErr = '', authUser = '', acctMsg = null, pushTimer = null;
  async function sbCall(fn, body) {
    const r = await fetch(sbBase + 'rpc/' + fn, { method: 'POST', headers: sbHeaders(), body: JSON.stringify(body) });
    const txt = await r.text();
    let data = null; try { data = txt ? JSON.parse(txt) : null; } catch (e) {}
    if (!r.ok) throw new Error((data && data.message) || txt || 'HTTP ' + r.status);
    return data;
  }
  const loggedOut = e => /Not logged in/.test(String(e && e.message));
  // ---------- game-wide message and events (set in the Admin panel) ----------
  let cfg = { msg: '', msgEnds: 0, ev: '', evEnds: 0 }, cfgKey = '';
  async function loadConfig() {
    if (backend !== 'sb') return;
    try {
      const c = await sbCall('nr_config', {});
      if (!c) return;
      const now = Date.parse(c.now) || Date.now(), rel = t => t ? Date.now() + (Date.parse(t) - now) : 0;
      cfg = { msg: c.message ? String(c.message).slice(0, 200) : '', msgEnds: rel(c.message_until), ev: /^(flakes|xp|both)[23]$/.test(c.event || '') ? c.event : '', evEnds: rel(c.event_until) };
      const k = cfg.msg + '|' + cfg.ev;
      if (k !== cfgKey) { cfgKey = k; refresh(); }
    } catch (e) {} // an older database script has no events yet
  }
  // 2 or 3 during a double or triple event for that kind ('xp' or 'flakes'), otherwise 1.
  function evMult(kind) {
    if (!cfg.ev || cfg.evEnds <= Date.now()) return 1;
    const m = /^(flakes|xp|both)([23])$/.exec(cfg.ev);
    return m && (m[1] === kind || m[1] === 'both') ? +m[2] : 1;
  }
  function evLabel(ev) {
    const m = /^(flakes|xp|both)([23])$/.exec(ev || ''); if (!m) return '';
    return (m[2] === '3' ? 'Triple ' : 'Double ') + (m[1] === 'xp' ? 'XP' : m[1] === 'flakes' ? 'flakes' : 'flakes and XP');
  }
  const leftText = ms => { const m = Math.max(1, Math.round(ms / 60000)); return m < 60 ? `${m} min` : m < 2880 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} days`; };
  function homeNotes() {
    let h = '';
    const g = giftNote;
    if (g && g.wiped) h += `<div class="box gift" role="status"><h3>Fresh start</h3><p>An admin reset your progress, so your level, flakes and items start over.</p><button class="buy" type="button" data-act="giftok">Got it</button></div>`;
    else if (g) {
      const parts = [];
      if (g.f > 0) parts.push(`+${fmt(g.f)} flakes`); if (g.f < 0) parts.push(`${fmt(-g.f)} flakes taken`);
      if (g.x > 0) parts.push(`+${fmt(g.x)} XP`); if (g.x < 0) parts.push(`${fmt(-g.x)} XP taken`);
      if (g.items) parts.push('new items');
      const head = g.f < 0 || g.x < 0 ? 'A note from an admin' : g.everyone ? 'A gift for everyone' : 'A gift for you';
      h += `<div class="box gift" role="status"><h3>${head}${parts.length ? ` <b>${parts.join(' · ')}</b>` : ''}</h3>${g.t ? `<p>“${esc(g.t)}”</p>` : ''}<p class="sub">From ${esc(g.by || 'an admin')}</p><button class="buy" type="button" data-act="giftok">Nice</button></div>`;
    }
    if (cfg.msg && cfg.msgEnds > Date.now()) h += `<div class="box notice"><h3>Announcement</h3><p>${esc(cfg.msg)}</p></div>`;
    if (evMult('xp') > 1 || evMult('flakes') > 1) h += `<div class="box event"><h3>${esc(evLabel(cfg.ev))} on every run <b>${leftText(cfg.evEnds - Date.now())} left</b></h3></div>`;
    return h;
  }
  function setAccount(res, token) {
    save.acct = { id: res.id, username: res.username, token, admin: !!res.admin };
    save.name = res.username; myId = res.id; guest = false;
    if (save.pid === res.id) { delete save.pid; delete save.psecret; }
    persist();
  }
  // msg set: the server already ended the login. No msg: the rider pressed Log out.
  let clearLater = null;
  function clearAccount(msg) {
    // mid-run, wait for the run to end so its flakes and XP go with the account
    if (state === 'run' || state === 'crash') { clearLater = msg === undefined ? '' : msg; return; }
    const t = save.acct && save.acct.token;
    if (race) raceLeave();
    fr.list = []; fr.incoming = []; fr.outgoing = []; fr.loaded = false; fr.st = 'idle'; raceInvites = [];
    clearTimeout(pushTimer);
    // Whatever this device has for the account is put aside under that account and the device starts clean,
    // so the next person to log in here only ever gets their own level, flakes and items.
    stashProgress();
    save.acct = null; myId = null; myOnline = myDaily = myRank = myDailyRank = 0; guest = false; syncRev = null; lastSynced = '';
    resetLocalProgress();
    if (t && msg === undefined) sbCall('nr_logout', { p_token: t }).catch(() => {});
    authErr = msg || ''; authMode = 'login'; view = 'home'; acctMsg = null;
    if (!overlay.hidden && state !== 'paused') renderPanel();
  }
  // Name color and title live on the server too, so other riders see them on the boards.
  function pushFlair() {
    if (backend !== 'sb' || !save.acct) return;
    const lv = riderLevel(), key = (save.style.color || '') + '|' + (save.style.title || '') + '|' + lv;
    if (save.acct.flair === key) return;
    const acct = save.acct;
    sbCall('nr_set_flair', { p_token: acct.token, p_color: save.style.color || null, p_title: save.style.title || null, p_level: lv })
      .then(() => { if (save.acct === acct) { acct.flair = key; saveLocal(); sbLoad(false); } }).catch(() => {});
  }
  // Log out: sync one last time, then clear this device's progress so whoever logs in next only gets their own.
  // Boosts you bought stay with the account. If the sync can't reach the server, the progress waits on this
  // device under your account and merges back the next time you log in here.
  async function logOut() {
    if (authBusy || !save.acct) return;
    authBusy = true; renderPanel();
    clearTimeout(pushTimer);
    saveLocal();
    if (backend === 'sb') await Promise.race([syncProgress(), new Promise(r => setTimeout(r, 8000))]);
    authBusy = false;
    clearAccount();
  }
  const ownerKey = () => save.owner || (save.ownerName ? 'n:' + save.ownerName.toLowerCase() : '');
  function stashProgress() {
    const k = ownerKey(); if (!k) return;
    try {
      const all = JSON.parse(localStorage.getItem('nightrun-stash') || '{}') || {};
      all[k] = { at: Date.now(), p: collectProgress() };
      for (const x of Object.keys(all).sort((a, b) => all[b].at - all[a].at).slice(6)) delete all[x];
      localStorage.setItem('nightrun-stash', JSON.stringify(all));
    } catch (e) {}
  }
  function takeStash(k) {
    try {
      const all = JSON.parse(localStorage.getItem('nightrun-stash') || '{}') || {}, st = all[k];
      if (!st) return null;
      delete all[k]; localStorage.setItem('nightrun-stash', JSON.stringify(all));
      return st.p;
    } catch (e) { return null; }
  }
  // Logging in: if this device holds someone else's progress, it's put aside first. A guest's progress joins the account.
  function adoptOwner(res, registering) {
    const id = String(res.id), nm = String(res.username || '').toLowerCase(), ep = Math.max(0, Math.floor(+(res.grants && res.grants.epoch) || 0));
    const mine = save.owner ? save.owner === id : save.ownerName ? save.ownerName.toLowerCase() === nm : false;
    const other = save.owner ? save.owner !== id : !!save.ownerName && !mine && !registering;
    if (other) { stashProgress(); resetLocalProgress(); }
    else if (mine && (save.epoch || 0) < ep) resetLocalProgress();
    save.owner = id; save.ownerName = String(res.username || '');
    save.epoch = Math.max(save.epoch || 0, ep);
    const st = takeStash(id) || takeStash('n:' + nm);
    if (st) mergeProgress(st, true);
  }
  // What an admin gave or took. It's kept apart from progress on the server and added on top every sync.
  let giftNote = null;
  function applyEpoch(g) {
    const ep = Math.max(0, Math.floor(+(g && g.epoch) || 0));
    if (ep > (save.epoch || 0)) { resetLocalProgress(true); save.epoch = ep; giftNote = { wiped: true }; }
  }
  function applyGrants(g) {
    if (!g || typeof g !== 'object') return;
    const n = v => Math.max(0, Math.floor(+v || 0)), up = (o, v) => { if (v > (o[ADM] || 0)) o[ADM] = v; };
    settleCoins();
    up(save.ledger.e, n(g.fe)); up(save.ledger.s, n(g.fs)); pnHeal(save.ledger);
    save.coins = coinMark = ledgerCoins();
    up(save.xpl.e, n(g.xe)); up(save.xpl.s, n(g.xs)); pnHeal(save.xpl);
    if (g.kit && typeof g.kit === 'object') for (const id of KIT_IDS) up(save.kc[id].e, n(g.kit[id]));
    kitSync();
    const all = g.all === true;
    const skins = all ? SKINS.filter(k => k.cost || k.ach || k.achCount).map(k => k.id) : Array.isArray(g.skins) ? g.skins.filter(id => SKINS.some(k => k.id === id)) : [];
    if (skins.length) save.skins = [...new Set(save.skins.concat(skins))];
    const boards = all ? BOARDS.map((b, i) => i) : Array.isArray(g.boards) ? g.boards.filter(i => Number.isInteger(i) && BOARDS[i]) : [];
    if (boards.length) save.boardsOwned = [...new Set(save.boardsOwned.concat(boards))];
    for (const k in FLEX) {
      const ids = all ? FLEX[k].filter(it => it.cost).map(it => it.id) : g.owned && Array.isArray(g.owned[k]) ? g.owned[k].filter(id => typeof id === 'string' && flexItem(k, id) && flexItem(k, id).cost) : [];
      if (ids.length) save.owned[k] = [...new Set(save.owned[k].concat(ids))].sort();
    }
    const m = g.msg;
    if (m && typeof m === 'object' && n(m.n) > (save.gseen || 0)) {
      save.gseen = n(m.n);
      if (Date.now() - (Date.parse(m.at) || 0) < 14 * 864e5) { giftNote = { t: String(m.t || '').slice(0, 140), f: Math.floor(+m.f || 0), x: Math.floor(+m.x || 0), items: !!m.items, by: String(m.by || ''), everyone: !!m.everyone }; initAudio(); tone(988, .08, 'triangle', .05); tone(1480, .2, 'triangle', .05, 0, .1); }
    }
  }
  // keepAcct: an admin wiped this account, so the login stays and only the progress starts over.
  function resetLocalProgress(keepAcct) {
    const keep = { settings: save.settings, dev: save.dev, muted: save.muted, music: save.music, mode: save.mode, v: save.v, name: '', acct: null,
      owner: '', ownerName: '', lk: newKey(), epoch: 0, gseen: 0, xpl: { base: 0, e: {}, s: {} } };
    if (keepAcct) Object.assign(keep, { name: save.name, acct: save.acct, owner: save.owner, ownerName: save.ownerName, epoch: save.epoch, gseen: save.gseen });
    const life = {}; for (const k of LIFE_KEYS) life[k] = 0;
    save = Object.assign({ best: 0, top: [], done: [], board: 0, coins: 0, up: Object.assign({}, DEF_UP), bought: false, bs: {}, life, skins: [], skin: 'classic', picked: { skin: 0, board: 0, color: 0, title: 0, trail: 0, crash: 0 }, owned: { color: [], title: [], trail: [], crash: [] }, style: { color: '', title: '', trail: 'classic', crash: 'classic' }, kit: {}, kitPaid: {}, revives: { day: '', n: 0 }, boardsOwned: [0], missions: null, ledger: { base: 0, e: {}, s: {} }, dlast: '', dstreak: 0 }, freshKit(), keep);
    kitSync(); coinMark = 0; ghostFree = ghostDaily = null; xplMig = false;
    try { localStorage.removeItem('nightrun-ghost'); localStorage.removeItem('nightrun-dghost'); } catch (e) {}
    saveLocal(); bestEl.textContent = fmt(0);
    if (!overlay.hidden && state !== 'paused') renderPanel();
  }
  function collectProgress() {
    settleCoins();
    return { v: 4, epoch: save.epoch || 0, coins: Math.floor(save.coins), ledger: save.ledger, xpl: save.xpl, kc: save.kc, kp: save.kp, revives: save.revives, gseen: save.gseen || 0, up: save.up, done: [...new Set(save.done.filter(isAch))].sort(), board: save.board, best: Math.floor(save.best), bs: save.bs, top: save.top, bought: !!save.bought,
      life: save.life, skins: [...new Set(save.skins)].sort(), skin: save.skin, boardsOwned: [...new Set(save.boardsOwned)].sort((a, b) => a - b), dlast: save.dlast || '', dstreak: save.dstreak || 0, missions: save.missions || null, picked: save.picked, owned: save.owned, style: save.style };
  }
  // Combine the account's saved progress with this device's: nothing earned on either side is lost.
  function mergeProgress(p, quiet) {
    if (!p || typeof p !== 'object') return;
    const n = v => Math.max(0, Math.floor(+v || 0));
    if (n(p.epoch) < (save.epoch || 0)) return; // a copy from before an admin wiped this account
    if (Array.isArray(p.done)) save.done = [...new Set(save.done.concat(p.done.filter(id => typeof id === 'string' && isAch(id))))];
    if (p.up && typeof p.up === 'object') for (const u of UPG) save.up[u.id] = Math.min(u.max, Math.max(save.up[u.id] || 0, n(p.up[u.id])));
    settleCoins();
    if (p.ledger && typeof p.ledger === 'object') {
      const L = save.ledger, R = { base: n(p.ledger.base), e: cleanCounts(p.ledger.e), s: cleanCounts(p.ledger.s) };
      L.base = Math.max(L.base, R.base);
      for (const k in R.e) L.e[k] = Math.max(L.e[k] || 0, R.e[k]);
      for (const k in R.s) L.s[k] = Math.max(L.s[k] || 0, R.s[k]);
    } else if (n(p.coins) > ledgerCoins()) save.ledger.base += n(p.coins) - ledgerCoins(); // a copy from an older game version
    pnHeal(save.ledger);
    save.coins = coinMark = ledgerCoins();
    if (p.xpl && typeof p.xpl === 'object') {
      // This copy only guessed its XP from career stats, so the account's own number wins.
      if (xplMig) { const R = pnClean(p.xpl); save.xpl.base = R.base; }
      pnMerge(save.xpl, p.xpl); pnHeal(save.xpl);
    }
    xplMig = false;
    if (p.kc && typeof p.kc === 'object') for (const id of KIT_IDS) if (p.kc[id]) { pnMerge(save.kc[id], p.kc[id]); pnHeal(save.kc[id]); }
    if (p.kp && typeof p.kp === 'object') for (const id of KIT_IDS) { const q = p.kp[id]; if (q && +q.at > save.kp[id].at) save.kp[id] = { at: +q.at, v: n(q.v) }; }
    kitSync();
    const RV = p.revives;
    if (RV && typeof RV.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(RV.day)) {
      if (RV.day > save.revives.day) save.revives = { day: RV.day, n: n(RV.n) };
      else if (RV.day === save.revives.day) save.revives.n = Math.max(save.revives.n, n(RV.n));
    }
    save.gseen = Math.max(save.gseen || 0, n(p.gseen));
    save.best = Math.max(n(save.best), n(p.best));
    if (p.bs && typeof p.bs === 'object') for (const k in p.bs) save.bs[k] = Math.max(save.bs[k] || 0, n(p.bs[k]));
    if (Array.isArray(p.top)) {
      const seen = new Set(), all = save.top.concat(p.top.filter(t => t && typeof t === 'object').map(t => ({ s: n(t.s), z: n(t.z), d: n(t.d), m: t.m === 'daily' ? 'daily' : 'free' })));
      save.top = all.sort((a, b) => b.s - a.s).filter(t => { const k = t.s + ':' + t.d; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 5);
    }
    if (p.life && typeof p.life === 'object') for (const k of LIFE_KEYS) save.life[k] = Math.max(save.life[k] || 0, n(p.life[k]));
    if (Array.isArray(p.skins)) save.skins = [...new Set(save.skins.concat(p.skins.filter(id => typeof id === 'string' && SKINS.some(k => k.id === id))))];
    if (Array.isArray(p.boardsOwned)) save.boardsOwned = [...new Set(save.boardsOwned.concat(p.boardsOwned.filter(i => Number.isInteger(i) && BOARDS[i])))];
    if (typeof p.dlast === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.dlast) && (!save.dlast || p.dlast > save.dlast)) { save.dlast = p.dlast; save.dstreak = n(p.dstreak); }
    const R = p.missions;
    if (R && typeof R === 'object' && typeof R.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(R.day) && Array.isArray(R.prog) && Array.isArray(R.done)) {
      const L = save.missions;
      if (!L || R.day > L.day) save.missions = { day: R.day, prog: [0, 1, 2].map(i => n(R.prog[i])), done: [0, 1, 2].map(i => !!R.done[i]), bonus: !!R.bonus };
      else if (R.day === L.day) { for (let i = 0; i < 3; i++) { L.prog[i] = Math.max(L.prog[i], n(R.prog[i])); L.done[i] = L.done[i] || !!R.done[i]; } L.bonus = L.bonus || !!R.bonus; }
    }
    // Skin and board: the most recent pick wins. A copy with no pick times (older version) only fills in a device that never picked.
    const RP = p.picked && typeof p.picked === 'object' ? p.picked : {}, rs = n(RP.skin), rb = n(RP.board);
    if (Number.isInteger(p.board) && boardOwned(p.board) && (rb > save.picked.board || !save.picked.board)) { save.board = p.board; save.picked.board = Math.max(save.picked.board, rb); }
    if (typeof p.skin === 'string' && skinOwned(skinById(p.skin)) && (rs > save.picked.skin || !save.picked.skin)) { save.skin = p.skin; save.picked.skin = Math.max(save.picked.skin, rs); }
    if (p.owned && typeof p.owned === 'object') for (const k in FLEX) if (Array.isArray(p.owned[k])) save.owned[k] = [...new Set(save.owned[k].concat(p.owned[k].filter(id => typeof id === 'string' && flexItem(k, id) && flexItem(k, id).cost)))].sort();
    if (p.style && typeof p.style === 'object') for (const k in FLEX) {
      const v = p.style[k], rt = n(RP[k]);
      if (typeof v === 'string' && (v === '' || flexOwned(k, v)) && rt > save.picked[k]) { save.style[k] = v || (k === 'trail' || k === 'crash' ? 'classic' : ''); save.picked[k] = rt; }
    }
    save.bought = !!(save.bought || p.bought);
    if (quiet) saveLocal(); else persist();
    bestEl.textContent = fmt(save.best);
  }
  // Called from persist(): syncs with the account a moment after progress changes.
  function pushProgress(now) {
    try {
      if (backend !== 'sb' || !save.acct) return;
      clearTimeout(pushTimer);
      pushTimer = setTimeout(syncProgress, now ? 0 : 700);
    } catch (e) {}
  }
  // Every sync first pulls the account's copy and merges it, then saves with the save number it merged.
  // If another device saved in between, the server says so and this device merges again before saving,
  // so nothing another device did is ever overwritten. It only uploads when this device has something new.
  let syncing = null, syncQueued = null, syncRev = null, revOK = true, lastSynced = '', syncedAt = 0;
  const canon = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, key) => (o[key] = x[key], o), {}) : x);
  function syncProgress() {
    if (backend !== 'sb' || !save.acct) return Promise.resolve(false);
    if (syncing) { if (!syncQueued) syncQueued = syncing.then(() => { syncQueued = null; return syncProgress(); }); return syncQueued; }
    syncing = doSync().finally(() => { syncing = null; });
    return syncing;
  }
  async function saveCall(token, data) {
    if (!revOK) return sbCall('nr_save_progress', { p_token: token, p_data: data });
    try { return await sbCall('nr_save_progress', { p_token: token, p_data: data, p_rev: syncRev }); }
    catch (e) {
      // the database script from before save numbers: save the old way until it's updated
      if (/p_rev|nr_save_progress|schema cache|function/i.test(String(e && e.message)) && !loggedOut(e)) { revOK = false; return sbCall('nr_save_progress', { p_token: token, p_data: data }); }
      throw e;
    }
  }
  async function doSync() {
    const token = save.acct.token;
    try {
      for (let tries = 0; tries < 4; tries++) {
        const me = await sbCall('nr_whoami', { p_token: token });
        if (!save.acct || save.acct.token !== token) return false;
        if (me && me.error) { clearAccount('You were logged out. Log in again to keep your progress synced.'); return false; }
        if (!me) return false;
        save.acct.admin = !!me.admin;
        // an admin wiped this account: wait for the run to end before starting over
        if (Math.floor(+((me.grants || {}).epoch) || 0) > (save.epoch || 0) && (state === 'run' || state === 'crash')) return false;
        const before = canon(collectProgress()), lv0 = riderLevel();
        applyEpoch(me.grants);
        if (me.progress) mergeProgress(me.progress, true);
        applyGrants(me.grants);
        syncRev = me.rev == null ? null : +me.rev;
        const mine = collectProgress(), c = canon(mine);
        if (c !== canon(me.progress)) {
          const r = await saveCall(token, mine);
          if (!save.acct || save.acct.token !== token) return false;
          if (r && r.stale) continue; // another device saved first: merge its copy, then try again
          if (r && r.rev != null) syncRev = +r.rev;
        }
        lastSynced = c; syncedAt = Date.now();
        saveLocal(); pushFlair();
        if ((c !== before || giftNote || riderLevel() !== lv0) && state !== 'run' && state !== 'crash') refresh();
        return true;
      }
    } catch (e) {
      if (loggedOut(e)) { clearAccount('You were logged out. Log in again to keep your progress synced.'); return false; }
      logError('E202', e);
    }
    return false;
  }
  // When the game is put away (phone locked, tab switched), anything not yet saved goes out right away.
  // It carries the last save number, so it can't overwrite another device's newer copy.
  function flushProgress() {
    try {
      if (backend !== 'sb' || !save.acct || syncRev == null || !revOK || syncing) return;
      const mine = collectProgress(), c = canon(mine);
      if (c === lastSynced) return;
      saveLocal();
      fetch(sbBase + 'rpc/nr_save_progress', { method: 'POST', headers: sbHeaders(), keepalive: true, body: JSON.stringify({ p_token: save.acct.token, p_data: mine, p_rev: syncRev }) }).catch(() => {});
      lastSynced = c;
    } catch (e) {}
  }
  async function doAuth(mode, user, pass) {
    authBusy = true; authErr = ''; renderPanel();
    try {
      const body = mode === 'register'
        ? { p_username: user, p_password: pass, p_legacy_id: save.pid || null, p_legacy_secret: save.psecret || null }
        : { p_username: user, p_password: pass };
      const res = await sbCall(mode === 'register' ? 'nr_register' : 'nr_login', body);
      if (res && res.token && res.id) {
        adoptOwner(res, mode === 'register');
        setAccount(res, res.token);
        if (res.progress) mergeProgress(res.progress, true);
        applyGrants(res.grants);
        syncRev = res.rev == null ? null : +res.rev;
        checkAch(Object.assign(blankStats(), save.bs), true); newDone = [];
        pushProgress(true);
        myOnline = myDaily = myRank = myDailyRank = 0; authUser = ''; authBusy = false;
        tone(784, .08, 'triangle', .05); tone(1175, .14, 'triangle', .05, 0, .08);
        renderPanel();
        const g = panel.querySelector('.modes .go:not(.alt)'); if (g && g.focus) g.focus({ preventScroll: true });
        loadFriends(); uploadGhost('free'); uploadGhost('daily');
        await sbLoad(true);
        return;
      }
      authErr = (res && res.error) || 'Something went wrong. Try again.';
    } catch (e) { authErr = withCode("Couldn't reach the server. Check your connection and try again.", 'E203'); logError('E203', e, { action: mode }); }
    authBusy = false; renderPanel();
    const p = panel.querySelector('#upass'); if (p && p.focus) p.focus();
  }
  async function acctAction(kind, a, b) {
    if (authBusy || !save.acct) return;
    authBusy = true; acctMsg = null; renderPanel();
    try {
      if (kind === 'rename') {
        const res = await sbCall('nr_change_username', { p_token: save.acct.token, p_username: a });
        if (res && res.error) acctMsg = { t: res.error };
        else { save.acct.username = save.name = res.username; persist(); acctMsg = { ok: true, t: `You're now ${res.username} on every board.` }; sbLoad(false); }
      } else {
        const res = await sbCall('nr_change_password', { p_token: save.acct.token, p_old: a, p_new: b });
        acctMsg = res && res.error ? { t: res.error } : { ok: true, t: 'Password changed. Any other devices were logged out.' };
      }
    } catch (e) {
      authBusy = false;
      if (loggedOut(e)) return clearAccount('You were logged out. Log in again.');
      acctMsg = { t: withCode("Couldn't reach the server. Check your connection and try again.", 'E204') }; logError('E204', e, { action: kind });
    }
    authBusy = false;
    if (view === 'account') renderPanel();
  }

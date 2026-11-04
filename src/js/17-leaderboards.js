  async function sbLoad(first) {
    rollDay();
    lbBusy = true;
    try {
      const boards = () => Promise.all([
        sbGet(`scores?select=${sbCols}&order=best.desc&limit=10`),
        sbGet(`daily_scores?select=${sbCols}&day=eq.${dayKey}&order=best.desc&limit=10`),
      ]);
      let a, b;
      for (;;) {
        try { [a, b] = await boards(); break; }
        catch (e) { const i = SB_COLS_ALL.indexOf(sbCols); if (i < 0 || i === SB_COLS_ALL.length - 1 || !/HTTP 400/.test(e.message)) throw e; sbCols = SB_COLS_ALL[i + 1]; }
      }
      lb = a.map(v => clampRow(v.player_id, v)); dlb = b.map(v => clampRow(v.player_id, v));
      if (first && myId) {
        const [m, md] = await Promise.all([
          sbGet(`scores?select=best,name&player_id=eq.${myId}`),
          sbGet(`daily_scores?select=best&player_id=eq.${myId}&day=eq.${dayKey}`),
        ]);
        if (m[0]) myOnline = +m[0].best || 0;
        if (md[0]) myDaily = +md[0].best || 0;
      }
      await sbRanks();
      lbState = dlbState = 'ready'; lbUpdated = Date.now();
      if (myId) checkAch(blankStats(), state === 'menu');
      lbFails = 0;
    } catch (e) {
      // One blip (a phone waking up, a flaky connection) gets a quiet retry. Only real outages get logged:
      // the board never loading at all, or three refreshes in a row failing.
      lbFails++;
      if (lbState !== 'ready' && lbFails === 1) { lbBusy = false; setTimeout(() => sbLoad(first), 2500); return; }
      if (lbState !== 'ready') { lbState = dlbState = 'error'; logError('E200', e, { tries: lbFails }); }
      else if (lbFails >= 3) logError('E200', e, { tries: lbFails, background: true });
    }
    lbBusy = false;
    refresh();
  }
  // Exact row counts come back in the Content-Range header ("0-0/37").
  async function sbCount(path) {
    const r = await fetch(sbBase + path, { headers: Object.assign(sbHeaders(), { Prefer: 'count=exact' }) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const m = (r.headers.get('content-range') || '').match(/\/(\d+)$/);
    return m ? +m[1] : null;
  }
  async function sbRanks() {
    try {
      const none = Promise.resolve(null);
      const [tot, dtot, above, dabove] = await Promise.all([
        sbCount('scores?select=player_id&limit=1'),
        sbCount(`daily_scores?select=player_id&day=eq.${dayKey}&limit=1`),
        myOnline > 0 ? sbCount(`scores?select=player_id&best=gt.${myOnline}&limit=1`) : none,
        myDaily > 0 ? sbCount(`daily_scores?select=player_id&day=eq.${dayKey}&best=gt.${myDaily}&limit=1`) : none,
      ]);
      riderCount = tot || 0; dailyCount = dtot || 0;
      myRank = above == null ? 0 : above + 1;
      myDailyRank = dabove == null ? 0 : dabove + 1;
    } catch (e) {}
  }

  (async () => {
    const C = window.claude;
    if (C && typeof C.use === 'function') {
      backend = 'claude';
      lbState = 'loading'; dlbState = 'loading';
      const timer = setTimeout(() => { if (lbState === 'loading') lbState = 'off'; if (dlbState === 'loading') dlbState = 'off'; refresh(); }, 10000);
      try {
        db = await C.use('db');
        usr = await C.use('user');
        if (!db) { clearTimeout(timer); lbState = dlbState = 'off'; refresh(); return; }
        myId = usr ? await usr.id() : null;
        if (myId) {
          try {
            const d = await db.doc('scores/' + myId).get();
            if (d.exists) { const v = d.data() || {}; myOnline = +v.best || 0; if (save.name && v.name !== save.name) db.doc('scores/' + myId).update({ name: save.name }).catch(() => {}); }
          } catch (e) {}
          try {
            const d = await db.doc('daily/' + myId).get();
            if (d.exists) { const v = d.data() || {}; if (v.date === dayKey) myDaily = +v.best || 0; }
          } catch (e) {}
        }
        db.collection('scores').orderBy('best', 'desc').limit(10).onSnapshot(async snap => {
          clearTimeout(timer);
          lb = snap.docs.map(mapRow); lbState = 'ready'; lbUpdated = Date.now();
          await resolveNames(lb); await claudeRanks(); refresh();
        }, () => { lbState = 'error'; refresh(); });
        db.collection('daily').where('date', '==', dayKey).limit(100).onSnapshot(async snap => {
          dlbAll = snap.docs.map(mapRow).sort((a, b) => b.best - a.best); dlb = dlbAll.slice(0, 10); dlbState = 'ready';
          dailyCount = dlbAll.length; myDailyRank = myDaily > 0 ? dlbAll.filter(r => r.best > myDaily).length + 1 : 0;
          await resolveNames(dlb); refresh();
        }, () => { dlbState = 'error'; refresh(); });
      } catch (e) { clearTimeout(timer); lbState = dlbState = 'off'; refresh(); }
    } else if (sbReady) {
      backend = 'sb';
      flushErrors(); flushRuns();
      if (save.acct && save.acct.token) {
        myId = save.acct.id;
        try {
          const me = await sbCall('nr_whoami', { p_token: save.acct.token });
          if (me && me.id) {
            save.acct.username = save.name = save.ownerName = me.username; save.acct.admin = !!me.admin; myId = me.id; save.owner = String(me.id);
            applyEpoch(me.grants); mergeProgress(me.progress, true); applyGrants(me.grants); syncRev = me.rev == null ? null : +me.rev;
            persist(); loadFriends(); uploadGhost('free'); uploadGhost('daily');
          }
          else clearAccount('Your login expired. Log in again.');
        } catch (e) { logError('E206', e); } // offline: keep the saved login and try again later
        const typingNow = document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName || '');
        if (!overlay.hidden && state !== 'paused' && !typingNow) renderPanel();
      }
      lbState = dlbState = 'loading';
      loadConfig();
      await sbLoad(true);
      setInterval(() => { if (state !== 'run' && state !== 'crash' && !document.hidden) { sbLoad(false); pushProgress(true); loadConfig(); } }, 30000);
      setInterval(pollRaces, 6000);
      setInterval(() => { if (state === 'menu' && !document.hidden && canSocial()) loadFriends(); }, 60000);
    }
  })();
  async function claudeRanks() {
    try {
      const all = await db.collection('scores').limit(1000).get();
      riderCount = all.size;
      myRank = myOnline > 0 ? all.docs.filter(d => (+(d.data() || {}).best || 0) > myOnline).length + 1 : 0;
    } catch (e) {}
  }
  // Your spot on a board: exact position when you're in the visible top 10, counted rank otherwise.
  function rankOn(daily) {
    const list = daily ? dlb : lb, pos = myId ? list.findIndex(r => r.id === myId) : -1;
    return pos >= 0 ? pos + 1 : (daily ? myDailyRank : myRank);
  }
  function refresh() {
    const typing = ACCOUNTS ? ((view === 'home' && !save.acct && !guest) || view === 'account') : (view === 'home' && (renaming || !save.name));
    if (!overlay.hidden && state !== 'paused' && !typing && ['leader', 'home', 'shop', 'skins', 'boards'].includes(view)) renderPanel();
  }
  const viewOnlyNote = 'Your score could not be posted. People with view-only access can see the board but not post to it.';
  // Claude backend: each board keeps a rider's best.
  function postOnline(s) {
    if (!db || !myId) return 'off';
    if (s <= myOnline) return 'kept';
    const prev = myOnline; myOnline = s;
    db.doc('scores/' + myId).set({ name: save.name, best: s, dist: Math.floor(dist), zone: zoneIdx, board: save.board, at: Date.now() })
      .catch(() => { myOnline = prev; if (lastResult) lastResult.posted = 'failed'; lbNote = viewOnlyNote; refresh(); });
    return 'posted';
  }
  function postDaily(s) {
    if (!db || !myId) return 'off';
    if (s <= myDaily) return 'kept';
    const prev = myDaily; myDaily = s;
    db.doc('daily/' + myId).set({ name: save.name, date: dayKey, best: s, dist: Math.floor(dist), zone: zoneIdx, board: save.board, at: Date.now() })
      .catch(() => { myDaily = prev; if (lastResult) lastResult.dposted = 'failed'; lbNote = viewOnlyNote; refresh(); });
    return 'posted';
  }
  // Posts automatically after every run, to whichever backend is live.
  function submitRun(s) {
    const daily = runMode === 'daily';
    if (backend === 'claude') return { posted: postOnline(s), dposted: daily ? postDaily(s) : null };
    if (backend !== 'sb') return { posted: 'off', dposted: daily ? 'off' : null };
    if (!save.acct) return { posted: 'guest', dposted: daily ? 'guest' : null };
    const allNew = s > myOnline, dayNew = daily && s > myDaily;
    const res = { posted: allNew ? 'posted' : 'kept', dposted: daily ? (dayNew ? 'posted' : 'kept') : null };
    if (!allNew && !dayNew) return res;
    const prevA = myOnline, prevD = myDaily;
    if (allNew) myOnline = s;
    if (dayNew) myDaily = s;
    sbCall('nr_submit', { p_token: save.acct.token, p_score: s, p_dist: Math.floor(dist), p_zone: zoneIdx, p_board: save.board, p_day: daily ? dayKey : null, p_secs: Math.round(runT / 6) / 10 })
      .then(() => { lbNote = ''; sbLoad(false); })
      .catch(e => {
        myOnline = prevA; myDaily = prevD;
        if (lastResult) { if (allNew) lastResult.posted = 'failed'; if (dayNew) lastResult.dposted = 'failed'; }
        if (loggedOut(e)) return clearAccount("You were logged out, so that run wasn't posted. Log in again.");
        const cheat = /cheat check/.test(e.message);
        logError(cheat ? 'E205' : 'E201', e, { score: s, meters: Math.floor(dist), seconds: Math.round(runT / 6) / 10, daily });
        lbNote = cheat ? withCode("That run didn't pass the cheat check, so it wasn't posted.", 'E205')
          : withCode("Couldn't reach the leaderboard, so that run wasn't posted. Check your connection and ride again.", 'E201');
        refresh();
      });
    return res;
  }
  function saveName(raw) {
    const n = cleanName(raw);
    if (!NAME_OK.test(n)) return 'Use 2 to 16 letters, numbers, spaces, dots, dashes or underscores.';
    save.name = n; persist(); renaming = false;
    if (backend === 'claude' && db && myId) {
      if (myOnline > 0) db.doc('scores/' + myId).update({ name: n }).catch(() => {});
      if (myDaily > 0) db.doc('daily/' + myId).update({ name: n }).catch(() => {});
    } else if (backend === 'sb' && (myOnline > 0 || myDaily > 0)) sbRename(n);
    return '';
  }
  function focusName() { const i = panel.querySelector('#uname'); if (i && i.focus) i.focus({ preventScroll: true }); }


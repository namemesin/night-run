  /* ================= friends, ghosts and live races ================= */
  const fr = { list: [], incoming: [], outgoing: [], st: 'idle', msg: null, busy: false, confirm: '', loaded: false };
  const friendCount = () => fr.list.length;
  const tokenNow = () => (save.acct && save.acct.token) || '';
  const canSocial = () => backend === 'sb' && !!save.acct;
  async function loadFriends() {
    if (!canSocial()) return;
    try {
      const r = await sbCall('nr_friends', { p_token: tokenNow(), p_day: dayKey });
      if (r && !r.error) { fr.list = r.friends || []; fr.incoming = r.incoming || []; fr.outgoing = r.outgoing || []; fr.st = 'ready'; fr.loaded = true; checkAch(blankStats(), state === 'menu'); }
    } catch (e) { if (loggedOut(e)) return clearAccount('You were logged out. Log in again.'); fr.st = fr.loaded ? 'ready' : 'error'; }
    if (view === 'friends' || view === 'home') refresh();
  }
  async function friendDo(fn, args, okText) {
    if (fr.busy || !canSocial()) return;
    fr.busy = true; fr.msg = null; fr.confirm = ''; renderPanel();
    try {
      const r = await sbCall(fn, Object.assign({ p_token: tokenNow() }, args));
      fr.msg = r && r.error ? { t: r.error } : okText ? { ok: true, t: typeof okText === 'function' ? okText(r) : okText } : null;
    } catch (e) { if (loggedOut(e)) { fr.busy = false; return clearAccount('You were logged out. Log in again.'); } fr.msg = { t: withCode("That didn't go through. Check your connection and try again.", 'E209') }; logError('E209', e, { action: fn }); }
    fr.busy = false;
    await loadFriends();
    if (view === 'friends') renderPanel();
  }
  function uploadGhost(kind) {
    if (!canSocial()) return;
    const g = kind === 'daily' ? ghostDaily : ghostFree;
    if (!g || !Array.isArray(g.r) || g.r.length < 4) return;
    sbCall('nr_save_ghost', { p_token: tokenNow(), p_kind: kind, p_day: kind === 'daily' ? g.date : null, p_score: g.s, p_data: packGhost(g.r) }).catch(() => {});
  }
  async function raceGhost(id, kind) {
    if (!canSocial()) return;
    fr.msg = { t: 'Loading their ghost…' }; renderPanel();
    try {
      const g = await sbCall('nr_get_ghost', { p_token: tokenNow(), p_id: id, p_kind: kind, p_day: kind === 'daily' ? dayKey : null });
      if (!g || g.error) { fr.msg = { t: (g && g.error) || 'No ghost to race yet.' }; return renderPanel(); }
      fr.msg = null;
      ghostRace = { name: g.name, s: g.score, r: unpackGhost(g.data), kind };
      start(kind === 'daily' ? 'daily' : 'free');
    } catch (e) { fr.msg = { t: withCode("Couldn't load that ghost. Try again in a minute.", 'E209') }; logError('E209', e, { action: 'ghost' }); renderPanel(); }
  }

  // ---------- live channels (Supabase Realtime): positions travel straight between the two riders ----------
  function liveChannel(topic, onEvent) {
    const url = SUPABASE_URL.replace(/^https/, 'wss').replace(/\/$/, '') + '/realtime/v1/websocket?apikey=' + encodeURIComponent(SUPABASE_KEY) + '&vsn=1.0.0';
    const full = 'realtime:' + topic;
    let ws = null, ref = 0, joinRef = null, joined = false, closed = false, hb = null, tries = 0;
    function open() {
      if (closed) return;
      try { ws = new WebSocket(url); } catch (e) { return retry(); }
      ws.onopen = () => {
        joinRef = String(++ref);
        ws.send(JSON.stringify({ topic: full, event: 'phx_join', payload: { config: { broadcast: { self: false, ack: false }, presence: { key: '' }, private: false } }, ref: joinRef, join_ref: joinRef }));
        clearInterval(hb); hb = setInterval(() => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++ref) })); }, 25000);
      };
      ws.onmessage = m => {
        let d; try { d = JSON.parse(m.data); } catch (e) { return; }
        if (d.event === 'phx_reply' && d.ref === joinRef) { joined = !!(d.payload && d.payload.status === 'ok'); if (joined) { tries = 0; onEvent('_joined', {}); } }
        else if (d.event === 'broadcast' && d.payload && typeof d.payload.event === 'string') onEvent(d.payload.event, d.payload.payload || {});
      };
      ws.onclose = () => { joined = false; clearInterval(hb); retry(); };
      ws.onerror = () => {};
    }
    function retry() { if (!closed && tries++ < 8) setTimeout(open, Math.min(4000, 400 * tries)); }
    open();
    return {
      send(event, payload) { if (joined && ws && ws.readyState === 1) ws.send(JSON.stringify({ topic: full, event: 'broadcast', payload: { type: 'broadcast', event, payload }, ref: String(++ref), join_ref: joinRef })); },
      get joined() { return joined; },
      close() { closed = true; clearInterval(hb); try { if (ws) ws.close(); } catch (e) {} },
    };
  }

  // ---------- live races ----------
  // The host invites a friend and waits. The friend accepts and says "ready", the host says "go", and after a 3 second
  // countdown both drop into the same seeded course. Positions go out 5 times a second. Highest score wins.
  let race = null, raceInvites = [], raceDismissed = new Set(), raceTimer = null;
  const friendById = id => fr.list.find(f => f.id === id) || {};
  const oppInfo = (id, name) => { const f = friendById(id); return { id, name: name || f.name || 'Friend', color: f.color || '', title: f.title || '', skin: f.skin || 'classic', board: f.board || 0, level: f.level || 0 }; };
  function raceEvent(ev, p) {
    const R = race; if (!R) return;
    R.heard = Date.now();
    if (ev === '_joined' && R.role === 'guest') R.ch.send('ready', {});
    else if (ev === 'ready' && R.role === 'host' && R.phase === 'waiting') { R.phase = 'countdown'; R.goAt = Date.now() + 3000; R.ch.send('go', { in: 3000 }); if (view === 'race') renderPanel(); }
    else if (ev === 'go' && R.role === 'guest' && R.phase === 'joining') { R.phase = 'countdown'; R.goAt = Date.now() + Math.max(500, Math.min(3000, +p.in || 3000)); if (view === 'race') renderPanel(); }
    else if (ev === 'pos' && (R.phase === 'running' || R.phase === 'done')) { const now = performance.now(); R.oppPrev = R.oppPos; R.oppPos = { d: +p.d || 0, x: +p.x || 500, s: +p.s || 0, z: p.z | 0, t: now }; rivalTake(R, p, now); }
    else if (ev === 'pi' && Number.isFinite(+p.a)) R.ch.send('po', { a: +p.a, b: Math.round(performance.now() * 10) / 10 });
    else if (ev === 'po' && Number.isFinite(+p.a) && Number.isFinite(+p.b)) {
      // a round trip: how long messages take, and how far apart the two clocks are
      const now = performance.now(), rtt = now - p.a;
      if (rtt >= 0 && rtt < 4000) { R.pings = (R.pings || []).concat([{ rtt, off: p.b - (+p.a + rtt / 2) }]).slice(-8); R.clk = R.pings.reduce((a, b) => b.rtt < a.rtt ? b : a); }
    }
    else if (ev === 'done') { if (!R.oppDone) { R.oppDone = { s: Math.max(0, +p.s || 0), d: Math.max(0, +p.d || 0) }; raceSettle(); } }
    else if (ev === 'bye' && (R.phase === 'waiting' || R.phase === 'joining' || R.phase === 'countdown')) { R.phase = 'cancelled'; R.note = `${R.opp.name} left the race.`; if (view === 'race') renderPanel(); }
  }
  function raceStartTicker() {
    clearInterval(raceTimer);
    raceTimer = setInterval(() => {
      const R = race; if (!R) { clearInterval(raceTimer); raceTimer = null; return; }
      const now = Date.now();
      if (R.phase === 'waiting' && now - R.since > 120000) { R.phase = 'expired'; R.note = `${R.opp.name} didn't answer in time.`; R.ch.close(); }
      if (R.phase === 'joining') { if (R.ch.joined && now - (R.pinged || 0) > 900) { R.pinged = now; R.ch.send('ready', {}); } if (now - R.since > 20000) { R.phase = 'cancelled'; R.note = `Couldn't reach ${R.opp.name}. Try again.`; R.ch.close(); } }
      if ((R.phase === 'countdown' || R.phase === 'running') && R.ch && now - (R.pingAt || 0) > ((R.pings || []).length >= 3 ? 3000 : 700)) { R.pingAt = now; R.ch.send('pi', { a: Math.round(performance.now() * 10) / 10 }); }
      if (R.phase === 'countdown') {
        if (R.role === 'host' && now - (R.pinged || 0) > 600) { R.pinged = now; R.ch.send('go', { in: Math.max(0, R.goAt - now) }); }
        if (now >= R.goAt) { R.phase = 'running'; R.heard = now; start('race'); return; }
      }
      if (R.phase === 'done' && !R.oppDone) {
        if (now - (R.polled || 0) > 4000) { R.polled = now; sbCall('nr_race_status', { p_token: tokenNow(), p_id: R.id }).then(row => raceFromRow(row)).catch(() => {}); }
        if (now - R.heard > 30000 && !R.oppLeft) { R.oppLeft = true; raceSettle(); }
        if (!R.result && view === 'home' && state === 'over' && now - (R.drawn || 0) > 1000) { R.drawn = now; renderPanel(); }
      }
      if (view === 'race' && (R.phase === 'waiting' || R.phase === 'countdown')) renderPanel();
    }, 200);
  }
  const KIND = { distance: { n: 'Distance race', short: 'distance', win: 'Farthest wins.', unit: ' m' }, score: { n: 'Score race', short: 'score', win: 'Highest score wins.', unit: '' } };
  const kindOf = k => KIND[k] ? k : 'score';
  const raceVal = (R, who) => { const v = who === 'me' ? R.me : R.oppDone || (R.oppLeft && R.oppPos) || null; return v ? (R.kind === 'distance' ? Math.floor(v.d) : v.s) : null; };
  async function raceInvite(friendId, kind) {
    kind = kindOf(kind);
    if (!canSocial() || fr.busy) return;
    if (race) raceLeave();
    fr.busy = true; renderPanel();
    try {
      const r = await sbCall('nr_race_invite', { p_token: tokenNow(), p_friend: friendId, p_kind: kind });
      fr.busy = false;
      if (!r || r.error) { fr.msg = { t: (r && r.error) || 'Something went wrong.' }; return renderPanel(); }
      race = { id: r.id, seed: r.seed, kind: kindOf(r.kind || kind), role: 'host', opp: oppInfo(friendId, r.guest_name), phase: 'waiting', since: Date.now(), heard: Date.now() };
      race.ch = liveChannel('nr-race-' + r.id, raceEvent);
      view = 'race'; renderPanel(); overlay.scrollTop = 0; raceStartTicker();
    } catch (e) { fr.busy = false; fr.msg = { t: withCode("Couldn't start the race. Check your connection.", 'E209') }; logError('E209', e, { action: 'race invite' }); renderPanel(); }
  }
  async function raceAccept(raceId) {
    const inv = raceInvites.find(i => i.id === raceId); if (!inv || !canSocial()) return;
    if (race) raceLeave();
    raceInvites = raceInvites.filter(i => i.id !== raceId);
    try {
      const r = await sbCall('nr_race_answer', { p_token: tokenNow(), p_id: raceId, p_accept: true });
      if (!r || r.error) { fr.msg = { t: (r && r.error) || 'That race invite expired.' }; view = 'friends'; return renderPanel(); }
      race = { id: r.id, seed: r.seed, kind: kindOf(r.kind || inv.kind), role: 'guest', opp: oppInfo(r.host, r.host_name), phase: 'joining', since: Date.now(), heard: Date.now() };
      race.ch = liveChannel('nr-race-' + r.id, raceEvent);
      view = 'race'; renderPanel(); overlay.scrollTop = 0; raceStartTicker();
    } catch (e) { fr.msg = { t: withCode("Couldn't join the race. Check your connection.", 'E209') }; logError('E209', e, { action: 'race accept' }); view = 'friends'; renderPanel(); }
  }
  function raceDecline(raceId) {
    raceDismissed.add(raceId); raceInvites = raceInvites.filter(i => i.id !== raceId); renderPanel();
    if (canSocial()) sbCall('nr_race_answer', { p_token: tokenNow(), p_id: raceId, p_accept: false }).catch(() => {});
  }
  function raceLeave() {
    const R = race; if (!R) return;
    if (R.phase !== 'done' && R.phase !== 'running') { try { R.ch.send('bye', {}); } catch (e) {} if (canSocial() && (R.phase === 'waiting' || R.phase === 'joining' || R.phase === 'countdown')) sbCall('nr_race_cancel', { p_token: tokenNow(), p_id: R.id }).catch(() => {}); }
    try { R.ch.close(); } catch (e) {}
    race = null; clearInterval(raceTimer); raceTimer = null;
  }
  function raceFinished(s, d) {
    const R = race; R.phase = 'done'; R.me = { s, d }; R.heard = Math.max(R.heard || 0, Date.now() - 15000);
    const send = () => { if (race === R) R.ch.send('done', { s, d }); };
    send(); setTimeout(send, 400); setTimeout(send, 1200);
    if (canSocial()) sbCall('nr_race_finish', { p_token: tokenNow(), p_id: R.id, p_score: s, p_dist: d, p_secs: Math.round(runT / 6) / 10 }).then(raceFromRow).catch(e => logError('E209', e, { action: 'race finish' }));
    raceSettle();
  }
  function raceFromRow(row) {
    const R = race; if (!R || !row || row.error) return;
    const theirs = R.role === 'host' ? row.guest_score : row.host_score, theirD = R.role === 'host' ? row.guest_dist : row.host_dist;
    if (theirs != null && !R.oppDone) { R.oppDone = { s: theirs, d: theirD || 0 }; raceSettle(); }
  }
  // Decides the race once both scores are in (or the other rider has been silent for 30 seconds).
  function raceSettle() {
    const R = race; if (!R || !R.me) { if (view === 'home' && state === 'over') renderPanel(); return; }
    const mine = raceVal(R, 'me'), theirs = raceVal(R, 'them') ?? (R.oppLeft ? 0 : null);
    if (theirs == null) { if (state === 'over' && view === 'home') renderPanel(); return; }
    R.result = mine > theirs ? 'win' : mine < theirs ? 'loss' : 'tie'; R.mine = mine; R.theirs = theirs;
    if (!R.counted) { R.counted = true; if (R.result === 'win') { save.life.raceWins++; tone(784, .1, 'triangle', .06); tone(1175, .3, 'triangle', .06, 0, .1); } checkAch(blankStats(), true); persist(); }
    if (state === 'over' && view === 'home') renderPanel();
  }
  async function pollRaces() {
    if (!canSocial() || document.hidden || state === 'run' || state === 'crash' || (!fr.list.length && !race)) return;
    try {
      const r = await sbCall('nr_race_inbox', { p_token: tokenNow() });
      const fresh = (r && r.incoming || []).filter(i => !raceDismissed.has(i.id) && !(race && race.id === i.id));
      const isNew = fresh.some(i => !raceInvites.some(j => j.id === i.id));
      raceInvites = fresh;
      if (isNew) { initAudio(); tone(988, .1, 'triangle', .06); tone(1319, .2, 'triangle', .06, 0, .1); }
      if (race && race.role === 'host' && race.phase === 'waiting' && r && r.mine && r.mine.id === race.id && r.mine.status === 'declined') { race.phase = 'declined'; race.note = `${race.opp.name} can't race right now.`; race.ch.close(); }
      if ((isNew || race) && (view === 'home' || view === 'friends' || view === 'race') && state !== 'paused') renderPanel();
    } catch (e) {}
  }
  function raceInviteHTML() {
    if (!raceInvites.length || state === 'run' || state === 'paused') return '';
    const i = raceInvites[0];
    return `<div class="raceinv"><span><b>${nameHTML(i.name, i.color, '')}</b> wants a ${KIND[kindOf(i.kind)].short} race right now. ${KIND[kindOf(i.kind)].win}</span><div><button type="button" class="buy" data-act="racc-${esc(i.id)}">Race</button><button type="button" class="back" data-act="rdec-${esc(i.id)}">Not now</button></div></div>`;
  }
  function raceHTML() {
    const R = race;
    if (!R) return `${back}<h2>Race</h2><p class="sub">No race right now.</p>`;
    const opp = nameHTML(R.opp.name, R.opp.color, R.opp.title);
    let body;
    if (R.phase === 'waiting') { const left = Math.max(0, 120 - Math.floor((Date.now() - R.since) / 1000)); body = `<p>Waiting for ${opp} to accept…</p><p class="sub">The invite lasts ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}. They'll see it on their home screen.</p><button class="go alt" type="button" data-act="rcancel">Cancel race</button>`; }
    else if (R.phase === 'joining') body = `<p>Joining ${opp}'s race…</p><button class="go alt" type="button" data-act="rcancel">Cancel</button>`;
    else if (R.phase === 'countdown') { const n = Math.max(1, Math.ceil((R.goAt - Date.now()) / 1000)); body = `<div class="countdown">${n}</div><p>Same course, same moment. ${KIND[R.kind].win}</p>`; }
    else body = `<p>${esc(R.note || 'The race is off.')}</p><button class="go alt" type="button" data-act="rback">Back to friends</button>`;
    return `<h2>${KIND[R.kind].n} vs ${esc(R.opp.name)}</h2>${body}`;
  }
  function raceResultHTML() {
    const R = race; if (!R || !R.me) return '';
    const opp = nameHTML(R.opp.name, R.opp.color, '');
    const K = KIND[R.kind], u = K.unit, val = v => fmt(v) + u;
    if (!R.result) return `<div class="box raceres"><h3>${K.n}</h3><p>You got <b>${val(raceVal(R, 'me'))}</b>. Waiting for ${opp} to finish${R.oppPos ? ` (they're at ${val(R.kind === 'distance' ? Math.floor(R.oppPos.d) : R.oppPos.s)})` : ''}…</p></div>`;
    const head = R.result === 'win' ? 'You win!' : R.result === 'loss' ? `${esc(R.opp.name)} wins` : "It's a tie";
    const note = R.oppLeft && !R.oppDone ? `<p class="sub">${esc(R.opp.name)}'s connection dropped, so their last score counts.</p>` : '';
    return `<div class="box raceres ${R.result}"><h3>${K.n} <b>${head}</b></h3><div class="vs"><span>You<b>${val(R.mine)}</b></span><span>${opp}<b>${val(R.theirs)}</b></span></div>${note}<button class="go alt" type="button" data-act="rinv${R.kind === 'distance' ? 'd' : 's'}-${esc(R.opp.id)}">Rematch</button></div>`;
  }
  function friendsHTML() {
    const top = `${back}<h2>Friends</h2>`;
    if (!canSocial()) return top + `<p>${backend === 'sb' ? 'Log in to add friends, race their ghosts and race them live.' : "Friends work on the game's own site."}</p>`;
    const m = fr.msg ? `<p class="${fr.msg.ok ? 'sub ok' : 'err'}" role="alert">${esc(fr.msg.t)}</p>` : '';
    const add = `<form class="box namebox" id="friendForm" novalidate><label for="friendName">Add a friend</label><div class="namerow"><input id="friendName" type="text" maxlength="16" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Their username"><button class="buy" type="submit" ${fr.busy ? 'disabled' : ''}>Add</button></div></form>`;
    const reqs = fr.incoming.length || fr.outgoing.length ? `<div class="box"><h3>Requests</h3><ul class="frq">${fr.incoming.map(r => `<li><span><b>${esc(r.name)}</b> wants to be friends</span><button type="button" class="buy" data-act="fryes-${esc(r.id)}">Accept</button><button type="button" class="back" data-act="frno-${esc(r.id)}">No</button></li>`).join('')}${fr.outgoing.map(r => `<li><span>Waiting on <b>${esc(r.name)}</b></span><button type="button" class="back" data-act="frno-${esc(r.id)}">Cancel</button></li>`).join('')}</ul></div>` : '';
    const me = { id: myId, name: save.name, color: save.style.color, title: save.style.title, level: riderLevel(), best: myOnline || save.best, daily: myDaily, me: true };
    const all = fr.list.concat([me]).sort((a, b) => (b.best || 0) - (a.best || 0));
    const rows = all.map((f, i) => {
      const lv = f.level ? `<span class="lvl">Lv ${f.level}</span>` : '';
      const stats = `<span class="tiny">Best ${f.best ? fmt(f.best) : '–'} · Today ${f.daily ? fmt(f.daily) : '–'}${f.me ? '' : f.last_seen ? ' · seen ' + esc(sinceText(f.last_seen)) : ''}</span>`;
      const acts = f.me ? '' : `<div class="fracts">
          <button type="button" class="buy" data-act="rinvd-${esc(f.id)}" ${fr.busy ? 'disabled' : ''}>Race: distance</button>
          <button type="button" class="buy" data-act="rinvs-${esc(f.id)}" ${fr.busy ? 'disabled' : ''}>Race: score</button>
          ${f.ghost_daily ? `<button type="button" class="admbtn" data-act="gday-${esc(f.id)}">Ghost: today</button>` : ''}
          ${f.ghost_free ? `<button type="button" class="admbtn" data-act="gbest-${esc(f.id)}">Ghost: best run</button>` : ''}
          <button type="button" class="admbtn" data-act="prof-${esc(f.id)}">Profile</button>
          <button type="button" class="admbtn${fr.confirm === 'frrm-' + f.id ? ' armed' : ''}" data-act="frrm-${esc(f.id)}">${fr.confirm === 'frrm-' + f.id ? 'Tap again' : 'Remove'}</button>
        </div>`;
      return `<div class="friend${f.me ? ' me' : ''}"><div class="frtop"><span class="n">${i + 1}</span>${lv}${nameHTML(f.name || 'Rider', f.color, f.title)}${f.me ? ' (you)' : ''}</div>${stats}${acts}</div>`;
    }).join('');
    const list = fr.list.length ? `<div class="box"><h3>Your crew <b>${fr.list.length} friend${fr.list.length === 1 ? '' : 's'}</b></h3><div class="friends">${rows}</div><p class="hint">Live races drop you both into the same course at the same moment. In a distance race the one who gets farthest wins; in a score race the higher score wins. Ghost races replay their best run next to you.</p></div>`
      : fr.st === 'ready' ? `<p class="sub">No friends yet. Add someone by their username, or tap a name on the leaderboard and add them from their profile.</p>` : `<p class="sub">Loading your friends…</p>`;
    return top + raceInviteHTML() + m + add + reqs + list;
  }


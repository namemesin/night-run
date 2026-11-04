  /* ---------- admin panel (only shows for admin accounts; the server checks every call) ---------- */
  const adm = { st: 'idle', ov: null, res: [], q: '', msg: null, busy: false, confirm: '', edit: null, err: '', stats: null, statsErr: '', days: 7, pl: null, plSt: '', draft: {} };
  // Typed values survive the panel redrawing (a two-tap button, a reload).
  const ADM_FIELDS = ['admFlk', 'admLvl', 'admXp', 'admNote', 'admAnnText', 'admAnnHrs', 'admEv', 'admEvHrs', 'admGiftAmt', 'admGiftNote'];
  function admKeep() { for (const id of ADM_FIELDS) { const el = panel.querySelector('#' + id); if (el) adm.draft[id] = el.value; } }
  const admVal = (id, d = '') => adm.draft[id] != null ? adm.draft[id] : d;
  const admNum = id => { const v = String(admVal(id)).replace(/[, ]/g, ''); return /^-?\d+$/.test(v) ? parseInt(v, 10) : NaN; };
  // A rider's flakes, XP and level from the account's copy plus what admins gave, worked out the same way their game does.
  function admTotals(P) {
    const pr = P && P.progress && typeof P.progress === 'object' ? P.progress : {}, g = (P && P.grants) || {}, n = v => Math.max(0, Math.floor(+v || 0));
    const top = (L, a, b) => { L.e[ADM] = Math.max(L.e[ADM] || 0, n(a)); L.s[ADM] = Math.max(L.s[ADM] || 0, n(b)); pnHeal(L); return pnVal(L); };
    const life = pr.life && typeof pr.life === 'object' ? pr.life : {};
    const flakes = top(pr.ledger ? pnClean(pr.ledger) : { base: n(pr.coins), e: {}, s: {} }, g.fe, g.fs);
    const xp = top(pr.xpl ? pnClean(pr.xpl) : { base: lifeXP(life), e: {}, s: {} }, g.xe, g.xs);
    const kit = KIT_IDS.filter(id => top(pr.kc && pr.kc[id] ? pnClean(pr.kc[id]) : { base: 0, e: {}, s: {} }, g.kit && g.kit[id], 0) > 0);
    return { flakes, xp, level: levelFor(xp), runs: n(life.runs), ach: Array.isArray(pr.done) ? pr.done.length : 0, kit, skins: Array.isArray(pr.skins) ? pr.skins.length : 0 };
  }
  async function admPlayer(id, quiet) {
    if (!quiet) { adm.pl = null; adm.plSt = 'loading'; if (view === 'admin') renderPanel(); }
    try {
      const r = await sbCall('nr_admin_player', { p_token: admTok(), p_id: id, p_day: dayKey });
      if (!adm.edit || adm.edit.id !== id) return;
      if (r && r.error) { adm.plSt = 'error'; adm.pl = null; adm.msg = { t: r.error }; }
      else { adm.pl = r; adm.plSt = 'ready'; }
    } catch (e) {
      if (admFail(e, 'player')) return;
      adm.plSt = 'error';
      adm.msg = { t: /nr_admin_player|function|schema cache/i.test(String(e && e.message)) ? 'Run the newest database script to turn on the player editor.' : withCode("Couldn't load that rider.", 'E208') };
    }
    if (view === 'admin') { admKeep(); renderPanel(); }
  }
  // Give or take: flakes and XP can be negative. Changes reach their game on its next sync (within about 30 seconds).
  function admGrant(id, args, okText) {
    const note = String(admVal('admNote')).trim().slice(0, 140);
    return admDo('nr_admin_grant', Object.assign({ p_id: id, p_flakes: 0, p_xp: 0, p_items: null, p_note: note || null, p_level: null }, args), okText, () => {
      adm.draft.admNote = '';
      admPlayer(id, true);
      if (id === myId) pushProgress(true);
    });
  }
  function admEditHTML(u) {
    if (adm.plSt === 'loading' || !adm.pl) return `<div class="admedit"><p class="hint">${adm.plSt === 'error' ? "Couldn't load this rider." : 'Loading their progress…'}</p></div>`;
    const P = adm.pl, T = admTotals(P), id = esc(u.id), dis = adm.busy ? 'disabled' : '';
    const tile = (label, v) => `<div class="pstat"><span>${label}</span><b>${v}</b></div>`;
    const arm = (key, label, armed) => `<button type="button" class="admbtn${adm.confirm === key ? ' armed' : ''}" data-act="${key}" ${dis}>${adm.confirm === key ? armed : label}</button>`;
    const btn = (act, label) => `<button type="button" class="admbtn" data-act="${act}-${id}" ${dis}>${label}</button>`;
    const kitBtns = BOOSTS.map(b => btn('adm-kit' + b.id, b.short)).join('');
    return `<div class="admedit">
        <div class="pstats">${tile('Level', T.level)}${tile('XP', fmt(T.xp))}${tile('Flakes', fmt(T.flakes))}${tile('Runs', fmt(T.runs))}${tile('Achievements', fmt(T.ach))}${tile('Logged in on', fmt(P.devices || 0))}</div>
        <p class="hint">${T.kit.length ? 'Boosts waiting: ' + T.kit.map(k => esc(BOOSTS.find(b => b.id === k).short)).join(', ') + '. ' : ''}Changes show up in their game the next time it syncs, usually within 30 seconds.</p>
        <p class="admlab">Flakes</p>
        <div class="admline"><input id="admFlk" type="text" inputmode="numeric" autocomplete="off" placeholder="Amount" value="${esc(admVal('admFlk'))}" aria-label="Flakes">${btn('adm-fgive', 'Give')}${btn('adm-ftake', 'Take')}${btn('adm-fset', 'Set to')}</div>
        <p class="admlab">Level and XP</p>
        <div class="admline"><input id="admLvl" type="text" inputmode="numeric" autocomplete="off" placeholder="Level 1–99" value="${esc(admVal('admLvl'))}" aria-label="Level">${btn('adm-lset', 'Set level')}<input id="admXp" type="text" inputmode="numeric" autocomplete="off" placeholder="XP" value="${esc(admVal('admXp'))}" aria-label="XP">${btn('adm-xgive', 'Give XP')}${btn('adm-xtake', 'Take XP')}</div>
        <p class="admlab">Give a boost</p>
        <div class="admline">${kitBtns}${arm('adm-all-' + id, 'Unlock everything', 'Tap again: every skin, board and style')}</div>
        <p class="admlab">Note they see with your next change (optional)</p>
        <div class="admline"><input id="admNote" class="wide" type="text" maxlength="140" autocomplete="off" placeholder="Nice run yesterday!" value="${esc(admVal('admNote'))}" aria-label="Note"></div>
        <p class="admlab">Account</p>
        <div class="admacts">
          ${u.id === myId ? '' : arm('adm-kick-' + id, 'Log out everywhere', 'Tap again to log them out')}
          ${u.id === myId ? '' : P.is_admin ? arm('adm-rmadm-' + id, 'Remove admin', 'Tap again to remove') : arm('adm-mkadm-' + id, 'Make admin', 'Tap again: full admin powers')}
          ${arm('adm-wipeall-' + id, 'Wipe progress', 'Tap again: level, flakes, items all gone')}
          ${u.id === myId || P.is_admin ? '' : arm('adm-del-' + id, 'Delete account', 'Tap again to delete for good')}
        </div></div>`;
  }
  function admGameHTML() {
    const dis = adm.busy ? 'disabled' : '', hrs = (id, d) => `<select id="${id}" aria-label="How long">${[[1, '1 hour'], [6, '6 hours'], [24, '24 hours'], [72, '3 days'], [168, '1 week']].map(([h, l]) => `<option value="${h}"${String(admVal(id, d)) === String(h) ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
    const evOn = cfg.ev && cfg.evEnds > Date.now(), msgOn = cfg.msg && cfg.msgEnds > Date.now();
    const evs = ['xp2', 'flakes2', 'both2', 'xp3', 'flakes3', 'both3'].map(e => `<option value="${e}"${admVal('admEv', 'xp2') === e ? ' selected' : ''}>${evLabel(e)}</option>`).join('');
    const arm = (key, label, armed) => `<button type="button" class="admbtn${adm.confirm === key ? ' armed' : ''}" data-act="${key}" ${dis}>${adm.confirm === key ? armed : label}</button>`;
    return `<div class="box"><h3>Whole game</h3><div class="admgame">
        <p class="admlab">Announcement on everyone's home screen</p>
        <textarea id="admAnnText" class="admta" maxlength="200" placeholder="New skins this weekend. Go get them!" aria-label="Announcement">${esc(admVal('admAnnText', msgOn ? cfg.msg : ''))}</textarea>
        <div class="admline">${hrs('admAnnHrs', 24)}<button type="button" class="admbtn" data-act="adm-annon" ${dis}>${msgOn ? 'Update' : 'Post'}</button>${msgOn ? `<button type="button" class="admbtn" data-act="adm-annoff" ${dis}>Take down</button>` : ''}</div>
        ${msgOn ? `<p class="now">Showing now, ${leftText(cfg.msgEnds - Date.now())} left.</p>` : ''}
        <p class="admlab">Event: extra flakes or XP on every run</p>
        <div class="admline"><select id="admEv" aria-label="Event">${evs}</select>${hrs('admEvHrs', 24)}<button type="button" class="admbtn" data-act="adm-evon" ${dis}>${evOn ? 'Switch' : 'Start'}</button>${evOn ? `<button type="button" class="admbtn" data-act="adm-evoff" ${dis}>End it</button>` : ''}</div>
        ${evOn ? `<p class="now">${esc(evLabel(cfg.ev))} is on, ${leftText(cfg.evEnds - Date.now())} left.</p>` : ''}
        <p class="admlab">Gift every account</p>
        <div class="admline"><input id="admGiftAmt" type="text" inputmode="numeric" autocomplete="off" placeholder="Flakes" value="${esc(admVal('admGiftAmt'))}" aria-label="Flakes for everyone"><input id="admGiftNote" class="wide" type="text" maxlength="140" autocomplete="off" placeholder="Note (optional)" value="${esc(admVal('admGiftNote'))}" aria-label="Gift note">${arm('adm-giftall', 'Send to everyone', 'Tap again to send')}</div>
      </div></div>`;
  }
  const admTok = () => (save.acct && save.acct.token) || '';
  function admFail(e, action) {
    if (loggedOut(e)) { clearAccount('You were logged out. Log in again.'); return true; }
    if (/Not an admin/.test(String(e && e.message))) { if (save.acct) save.acct.admin = false; persist(); view = 'account'; acctMsg = { t: "This account isn't an admin anymore." }; renderPanel(); return true; }
    logError('E208', e, { action });
    return false;
  }
  async function admLoad(quiet) {
    if (!save.acct) return;
    if (!quiet) { adm.st = adm.ov ? 'ready' : 'loading'; adm.busy = true; if (view === 'admin') renderPanel(); }
    try {
      const [ov, res, st] = await Promise.all([
        sbCall('nr_admin_overview', { p_token: admTok(), p_day: dayKey }),
        sbCall('nr_admin_search', { p_token: admTok(), p_query: adm.q, p_day: dayKey }),
        admStatsCall(),
      ]);
      adm.ov = ov || {}; adm.res = Array.isArray(res) ? res : []; adm.st = 'ready';
      admTakeStats(st);
      await loadConfig();
    } catch (e) {
      adm.busy = false;
      if (admFail(e, 'load')) return;
      adm.st = 'error'; adm.err = withCode("Couldn't load the admin panel. If you just added the admin tools, run the new database script first.", 'E208');
    }
    adm.busy = false;
    if (view === 'admin') { admKeep(); renderPanel(); }
  }
  async function admDo(fn, args, okText, after) {
    if (adm.busy || !save.acct) return;
    admKeep();
    adm.busy = true; adm.msg = null; adm.confirm = ''; renderPanel();
    try {
      const r = await sbCall(fn, Object.assign({ p_token: admTok() }, args));
      if (r && r.error) adm.msg = { t: r.error };
      else { adm.msg = { ok: true, t: typeof okText === 'function' ? okText(r) : okText }; if (!after) adm.edit = null; else after(r); }
      adm.busy = false;
      await admLoad(true);
      if (backend === 'sb') sbLoad(false);
      return;
    } catch (e) {
      adm.busy = false;
      if (admFail(e, fn)) return;
      adm.msg = { t: /function|schema cache/i.test(String(e && e.message)) ? 'Run the newest database script to turn this on.' : withCode("That didn't go through. Check your connection and try again.", 'E208') };
    }
    if (view === 'admin') { admKeep(); renderPanel(); }
  }
  // Player stats load on their own, so a missing stats function (old database script) doesn't break the panel.
  const admStatsCall = () => sbCall('nr_admin_stats', { p_token: admTok(), p_days: adm.days }).catch(e => ({ failed: e }));
  function admTakeStats(st) {
    if (st && st.failed) {
      const m = String(st.failed.message || '');
      if (/Not an admin|Not logged in/.test(m)) throw st.failed;
      adm.stats = null;
      adm.statsErr = /nr_admin_stats|function|schema cache|404/i.test(m) ? 'Run the newest database script to start collecting player data.' : withCode("Couldn't load player stats.", 'E208');
      if (!/nr_admin_stats|function|schema cache|404/i.test(m)) logError('E208', st.failed, { action: 'stats' });
    } else { adm.stats = st || null; adm.statsErr = ''; }
  }
  async function admStats(days) {
    adm.days = days; adm.stats = null; adm.statsErr = ''; renderPanel();
    try { admTakeStats(await admStatsCall()); } catch (e) { if (admFail(e, 'stats')) return; }
    if (view === 'admin') renderPanel();
  }
  const CAUSES = [['tree', 'Trees', '#3fae7c'], ['rock', 'Rocks', '#8a9ab3'], ['skier', 'Skiers', '#ff4466'], ['landing', 'Bad landings', '#ffd24a'], ['crevasse', 'Crevasses', '#cdb4ff'], ['restart', 'Restarted', '#4aa3ff'], ['quit', 'Quit', '#ff7a3d']];
  const pctText = p => p >= .1 || p === 0 ? Math.round(p * 100) + '%' : (p * 100).toFixed(1) + '%';
  const versionLabel = v => {
    const m = /^(\d{4})\.(\d{2})\.(\d{2})-(\d{2})(\d{2})/.exec(v || '');
    if (!m) return v || 'Unknown';
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  function statsHTML() {
    const S = adm.stats, days = adm.days;
    const range = [1, 7, 30].map(d => `<button type="button" data-act="adm-days-${d}" aria-pressed="${days === d}">${d === 1 ? '24 hours' : d + ' days'}</button>`).join('');
    const head = `<div class="box"><h3>Player stats</h3><div class="tabs three">${range}</div>`;
    if (!S) return head + `<p class="empty" style="margin-top:10px">${esc(adm.statsErr || 'Loading…')}</p></div>`;
    if (!S.runs) return head + `<p class="empty" style="margin-top:10px">No finished runs in this window yet. Stats fill in as people play the new version.</p></div>`;
    const runs = S.runs, t = (label, v) => `<div class="pstat"><span>${label}</span><b>${v}</b></div>`;
    const tiles = `<div class="pstats">${t('Runs', fmt(runs))}${t('Riders', fmt(S.riders || 0))}${t('Median run', fmt(S.medianM || 0) + ' m')}${t('Median time', fmt(S.medianS || 0) + ' s')}${t('Restarts', fmt(S.restarts || 0))}${t('Quit mid-run', fmt(S.quits || 0))}</div>`;
    // funnel: share of runs that got at least this far
    const funnel = (S.reach || []).filter(r => r.z > 0 && ZONES[r.z]).map(r => {
      const p = r.n / runs;
      return `<div class="sbar"><span>${ZONES[r.z].name}</span><div class="strack"><i style="width:${(p * 100).toFixed(1)}%;background:${ZONES[r.z].color}"></i></div><b>${pctText(p)}</b></div>`;
    }).join('');
    // where runs end, in 250 m steps
    const cnt = Array(25).fill(0); (S.buckets || []).forEach(b => { if (b.b >= 0 && b.b < 25) cnt[b.b] = b.n; });
    const peak = Math.max(1, ...cnt), top = cnt.indexOf(peak);
    const zoneAt = m => ZONES.reduce((a, z, i) => m >= z.at ? i : a, 0);
    const bars = cnt.map((n, i) => `<i style="height:${Math.max(n ? 3 : 0, n / peak * 100).toFixed(1)}%;background:${ZONES[zoneAt(i * 250)].color}" title="${fmt(i * 250)}${i === 24 ? '+' : '–' + fmt(i * 250 + 250)} m: ${fmt(n)} run${n === 1 ? '' : 's'}"></i>`).join('');
    const axis = [0, 1, 2, 3, 4, 5].map(k => `<span style="grid-column:${k * 4 + 1} / span 4">${k ? k + ' km' : '0'}</span>`).join('') + `<span style="grid-column:25">6+</span>`;
    const peakText = `Most runs end at ${fmt(top * 250)}${top === 24 ? '+' : '–' + fmt(top * 250 + 250)} m, in ${ZONES[zoneAt(top * 250)].name}.`;
    // what ends runs, per zone
    const byZone = ZONES.map(() => ({})), zoneTot = ZONES.map(() => 0);
    (S.causes || []).forEach(c => { if (!byZone[c.z]) return; byZone[c.z][c.c] = (byZone[c.z][c.c] || 0) + c.n; zoneTot[c.z] += c.n; });
    const color = c => (CAUSES.find(x => x[0] === c) || [0, 0, '#56657c'])[2], label = c => (CAUSES.find(x => x[0] === c) || [0, c])[1];
    const legend = CAUSES.filter(([c]) => byZone.some(z => z[c])).map(([c, l, col]) => `<span><i style="background:${col}"></i>${l}</span>`).join('');
    const stacks = ZONES.map((z, i) => {
      if (!zoneTot[i]) return '';
      const segs = Object.entries(byZone[i]).sort((a, b) => b[1] - a[1]).map(([c, n]) => `<i style="width:${(n / zoneTot[i] * 100).toFixed(2)}%;background:${color(c)}" title="${esc(label(c))}: ${fmt(n)} (${pctText(n / zoneTot[i])})"></i>`).join('');
      const [bc, bn] = Object.entries(byZone[i]).sort((a, b) => b[1] - a[1])[0];
      return `<div class="sbar stackrow"><span>${z.name}</span><div class="strack stack">${segs}</div><b>${fmt(zoneTot[i])}</b></div><p class="stip">Most common: ${esc(label(bc)).toLowerCase()} (${pctText(bn / zoneTot[i])})</p>`;
    }).join('');
    const row = (a, b, c) => `<li><span class="who">${a}</span><span>${b}</span><span>${c}</span></li>`;
    const versions = (S.versions || []).map(v => row(`${esc(versionLabel(v.version))}${v.version === APP_VERSION ? ' (this one)' : ''}`, `${fmt(v.n)} run${v.n === 1 ? "" : "s"}`, `${fmt(v.med || 0)} m · ${pctText(v.n ? v.bc / v.n : 0)} BC`)).join('');
    const devices = (S.devices || []).map(d => row(d.touch ? 'Phones &amp; tablets' : d.touch === false ? 'Keyboard &amp; mouse' : 'Unknown', `${fmt(d.n)} run${d.n === 1 ? "" : "s"}`, `${fmt(d.med || 0)} m`)).join('');
    const exp = (S.experience || []).map(x => row(['', 'First 10 runs', 'Runs 11–50', '51+ runs'][x.g] || '?', `${fmt(x.n)} run${x.n === 1 ? "" : "s"}`, `${fmt(x.med || 0)} m`)).join('');
    const sideTot = (S.sides || []).reduce((n, x) => n + x.n, 0) || 1, sideCnt = Array(5).fill(0); (S.sides || []).forEach(x => { if (x.s >= 0 && x.s < 5) sideCnt[x.s] = x.n; });
    const sides = sideCnt.map(n => `<div><div class="sb"><i style="height:${(n / Math.max(1, ...sideCnt) * 100).toFixed(1)}%"></i></div><span>${pctText(n / sideTot)}</span></div>`).join('');
    return head + `<div class="admstats">${tiles}
      <h4>How far runs get</h4>${funnel}
      <h4>Where runs end</h4><div class="hist">${bars}</div><div class="haxis">${axis}</div><p class="stip">${peakText}</p>
      <h4>What ends runs, by zone</h4><div class="legend">${legend}</div>${stacks}
      <h4>Where on the slope crashes happen</h4><div class="sides">${sides}</div><div class="sidelab"><span>Left edge</span><span>Middle</span><span>Right edge</span></div>
      ${versions ? `<h4>By game version</h4><ol class="slist">${versions}</ol><p class="stip">BC is the share of runs that reached the Backcountry. Use this to see if a change made the game easier or harder.</p>` : ''}
      ${devices ? `<h4>Phones vs keyboards</h4><ol class="slist">${devices}</ol>` : ''}
      ${exp ? `<h4>New vs experienced riders</h4><ol class="slist">${exp}</ol>` : ''}
      </div></div>`;
  }
  // Destructive buttons need two taps: the first arms it, the second does it.
  function admArm(key, run) {
    if (adm.confirm === key) run();
    else { adm.confirm = key; renderPanel(); }
  }
  function adminHTML() {
    const ov = adm.ov || {}, q = esc(adm.q);
    const m = adm.msg ? `<p class="${adm.msg.ok ? 'sub ok' : 'err'}" role="alert">${esc(adm.msg.t)}</p>` : '';
    const tile = (label, v) => `<div class="pstat"><span>${label}</span><b>${v == null ? '–' : fmt(v)}</b></div>`;
    const arm = (key, label, armed) => `<button type="button" class="admbtn${adm.confirm === key ? ' armed' : ''}" data-act="${key}" ${adm.busy ? 'disabled' : ''}>${adm.confirm === key ? armed : label}</button>`;
    const riders = adm.res.map(u => {
      const id = esc(u.id), tags = [u.is_admin ? 'admin' : '', u.banned ? 'banned' : '', u.locked ? 'locked out' : '', u.account ? '' : 'old entry'].filter(Boolean);
      let edit = '';
      if (adm.edit && adm.edit.id === u.id && adm.edit.kind === 'rename') edit = `<form class="namerow admform" id="admRename"><input id="admNewName" type="text" maxlength="16" autocomplete="off" spellcheck="false" value="${esc(u.name || '')}" aria-label="New username"><button class="buy" type="submit" ${adm.busy ? 'disabled' : ''}>Rename</button></form>`;
      if (adm.edit && adm.edit.id === u.id && adm.edit.kind === 'reset') edit = `<form class="namerow admform" id="admReset"><input id="admNewPass" type="text" maxlength="72" autocomplete="off" spellcheck="false" placeholder="Temporary password" aria-label="Temporary password"><button class="buy" type="submit" ${adm.busy ? 'disabled' : ''}>Set</button></form><p class="hint">Give them this password, then they can change it on their Account page. Their other logins end.</p>`;
      if (adm.edit && adm.edit.id === u.id && adm.edit.kind === 'player') edit = admEditHTML(u);
      return `<div class="admrow">
        <div class="admtop">${u.level ? `<span class="lvl">${u.level}</span>` : ''}<button type="button" class="linkbtn admname" data-act="prof-${id}">${esc(u.name || 'Rider')}</button>${tags.map(t => `<span class="tag">${t}</span>`).join('')}<span class="admbest">${u.best ? fmt(u.best) : 'no score'}</span></div>
        <p class="sub">${u.daily ? `Today ${fmt(u.daily)} · ` : ''}${u.last_seen ? 'Seen ' + esc(sinceText(u.last_seen)) : u.joined ? 'Joined ' + esc(sinceText(u.joined)) : ''}</p>
        <div class="admacts">
          ${u.best || u.daily ? arm(`adm-wipe-${id}`, 'Remove scores', 'Tap again to remove') : ''}
          ${u.daily ? arm(`adm-wday-${id}`, "Remove today's", 'Tap again to remove') : ''}
          ${u.account ? `<button type="button" class="admbtn" data-act="adm-edit-${id}" ${adm.busy ? 'disabled' : ''} aria-expanded="${!!(adm.edit && adm.edit.id === u.id && adm.edit.kind === 'player')}">Edit progress</button>` : ''}
          ${u.account ? `<button type="button" class="admbtn" data-act="adm-ren-${id}" ${adm.busy ? 'disabled' : ''}>Rename</button>` : ''}
          ${u.account ? `<button type="button" class="admbtn" data-act="adm-pw-${id}" ${adm.busy ? 'disabled' : ''}>Reset password</button>` : ''}
          ${u.id === myId ? '' : u.banned ? arm(`adm-unban-${id}`, 'Unban', 'Tap again to unban') : arm(`adm-ban-${id}`, 'Ban', 'Tap again to ban')}
        </div>${edit}</div>`;
    }).join('') || `<p class="empty">${adm.st === 'loading' ? 'Loading riders…' : 'No riders match that.'}</p>`;
    const codes = (ov.errorCodes || []).map(c => `<li><span class="n">${esc(c.code)}</span><span class="who">${esc(c.message)}</span><span>${fmt(c.n)}</span></li>`).join('');
    const errs = (ov.recentErrors || []).map(e => `<div class="admerr"><b>${esc(e.code)}</b> <span>${esc(sinceText(e.created_at))}${e.username ? ' · ' + esc(e.username) : ''}${e.version ? ' · v' + esc(e.version) : ''}</span><p>${esc(e.message)}${e.detail ? ': ' + esc(String(e.detail).split('\n')[0].slice(0, 140)) : ''}</p></div>`).join('');
    const log = (ov.log || []).map(l => `<li><span class="who">${esc(l.admin_name || 'Admin')} · ${esc(l.action)}${l.target_name ? ' · ' + esc(l.target_name) : ''}${l.detail && l.action !== 'remove score' ? ' (' + esc(l.detail) + ')' : ''}</span><span>${esc(sinceText(l.created_at))}</span></li>`).join('');
    if (adm.st === 'error') return `<button class="back" type="button" data-act="v-account">← Account</button><h2>Admin</h2><p class="err">${esc(adm.err)}</p><button class="go alt" type="button" data-act="adm-reload">Try again</button>`;
    return `<button class="back" type="button" data-act="v-account">← Account</button><h2>Admin</h2>
      <p class="sub">Only admin accounts see this. Everything you do here is logged.</p>
      ${m}
      <div class="box"><h3>Right now <button type="button" class="linkbtn" data-act="adm-reload" ${adm.busy ? 'disabled' : ''}>${adm.busy ? 'Loading…' : 'Refresh'}</button></h3>
        <div class="pstats">${tile('Accounts', ov.accounts)}${tile('On the board', ov.onBoard)}${tile("Today's course", ov.dailyToday)}${tile('Played today', ov.activeToday)}${tile('Banned', ov.banned)}${tile('Errors (24 h)', ov.errors24h)}</div></div>
      ${admGameHTML()}
      ${statsHTML()}
      <div class="box"><h3>Riders</h3>
        <form class="namerow admform" id="admSearch"><input id="admQ" type="search" maxlength="16" autocomplete="off" spellcheck="false" placeholder="Search usernames" value="${q}" aria-label="Search usernames"><button class="buy" type="submit" ${adm.busy ? 'disabled' : ''}>Search</button></form>
        <div class="admlist">${riders}</div></div>
      <div class="box"><h3>Errors this week</h3>${codes ? `<ol>${codes}</ol>` : '<p class="empty">No errors this week.</p>'}${errs ? `<div class="admerrs">${errs}</div>` : ''}</div>
      <div class="box"><h3>Admin log</h3>${log ? `<ol class="admlog">${log}</ol>` : '<p class="empty">Nothing yet.</p>'}</div>`;
  }
  function admRider(id) { return adm.res.find(u => u.id === id) || {}; }
  function adminClick(a) {
    admKeep();
    const id = a.replace(/^adm-[a-z]+-/, ''), u = admRider(id), nm = u.name || 'that rider';
    if (a === 'adm-reload') return admLoad();
    if (a.startsWith('adm-edit-')) {
      const open = adm.edit && adm.edit.id === id && adm.edit.kind === 'player';
      adm.edit = open ? null : { id, kind: 'player' }; adm.confirm = ''; adm.msg = null;
      if (open) return renderPanel();
      adm.draft.admLvl = adm.draft.admFlk = adm.draft.admXp = adm.draft.admNote = '';
      return admPlayer(id);
    }
    const T = adm.pl && adm.edit && adm.edit.id === id ? admTotals(adm.pl) : null;
    const bad = t => { adm.msg = { t }; renderPanel(); };
    if (/^adm-(fgive|ftake|fset)-/.test(a)) {
      const v = admNum('admFlk');
      if (!T) return; if (!(v >= 0) || (a.startsWith('adm-fset') ? v > 100000000 : v < 1 || v > 100000000)) return bad('Type a number of flakes first.');
      const delta = a.startsWith('adm-fgive') ? v : a.startsWith('adm-ftake') ? -Math.min(v, T.flakes) : v - T.flakes;
      if (!delta) return bad(`${nm} already has ${fmt(T.flakes)} flakes.`);
      return admGrant(id, { p_flakes: delta }, delta > 0 ? `Gave ${nm} ${fmt(delta)} flakes.` : `Took ${fmt(-delta)} flakes from ${nm}.`);
    }
    if (a.startsWith('adm-lset-')) {
      const v = admNum('admLvl');
      if (!T) return; if (!(v >= 1 && v <= 99)) return bad('Pick a level from 1 to 99.');
      const delta = xpAt(v) - T.xp;
      if (T.level === v && delta >= 0) return bad(`${nm} is already level ${v}.`);
      return admGrant(id, { p_xp: delta, p_level: v }, `${nm} is now level ${v}.`);
    }
    if (/^adm-x(give|take)-/.test(a)) {
      const v = admNum('admXp');
      if (!T) return; if (!(v >= 1 && v <= 2000000000)) return bad('Type an amount of XP first.');
      const delta = a.startsWith('adm-xgive') ? v : -Math.min(v, T.xp);
      return admGrant(id, { p_xp: delta, p_level: levelFor(T.xp + delta) }, delta > 0 ? `Gave ${nm} ${fmt(delta)} XP. They're level ${levelFor(T.xp + delta)} now.` : `Took ${fmt(-delta)} XP from ${nm}.`);
    }
    if (a.startsWith('adm-kit')) { const k = a.slice(7, a.indexOf('-', 4)), b = BOOSTS.find(x => x.id === k); if (b) return admGrant(id, { p_items: { kit: { [k]: 1 } } }, `Gave ${nm} a ${b.short} boost.`); return; }
    if (a.startsWith('adm-all-')) return admArm(a, () => admGrant(id, { p_items: { all: true } }, `Unlocked every skin, board and style for ${nm}.`));
    if (a.startsWith('adm-kick-')) return admArm(a, () => admDo('nr_admin_kick', { p_id: id }, r => `Logged ${nm} out on ${fmt((r && r.devices) || 0)} device${r && r.devices === 1 ? '' : 's'}.`, () => admPlayer(id, true)));
    if (a.startsWith('adm-mkadm-')) return admArm(a, () => admDo('nr_admin_set_admin', { p_id: id, p_admin: true }, `${nm} is an admin now.`, () => admPlayer(id, true)));
    if (a.startsWith('adm-rmadm-')) return admArm(a, () => admDo('nr_admin_set_admin', { p_id: id, p_admin: false }, `${nm} isn't an admin anymore.`, () => admPlayer(id, true)));
    if (a.startsWith('adm-wipeall-')) return admArm(a, () => admDo('nr_admin_wipe', { p_id: id }, `Wiped ${nm}'s progress. Their scores are still on the boards.`, () => { admPlayer(id, true); if (id === myId) pushProgress(true); }));
    if (a.startsWith('adm-del-')) return admArm(a, () => admDo('nr_admin_delete', { p_id: id }, `Deleted ${nm}'s account.`));
    if (a === 'adm-annon') {
      const t = String(admVal('admAnnText')).trim(), h = +admVal('admAnnHrs', 24) || 24;
      if (!t) return bad('Type the announcement first.');
      return admDo('nr_admin_announce', { p_message: t, p_hours: h }, 'Posted. Everyone sees it on their home screen within a minute.', () => loadConfig());
    }
    if (a === 'adm-annoff') return admDo('nr_admin_announce', { p_message: '', p_hours: 0 }, 'Announcement taken down.', () => { adm.draft.admAnnText = ''; loadConfig(); });
    if (a === 'adm-evon') {
      const e = admVal('admEv', 'xp2'), h = +admVal('admEvHrs', 24) || 24;
      return admDo('nr_admin_event', { p_event: e, p_hours: h }, `${evLabel(e)} is on for everyone.`, () => loadConfig());
    }
    if (a === 'adm-evoff') return admDo('nr_admin_event', { p_event: 'off', p_hours: 0 }, 'Event ended.', () => loadConfig());
    if (a === 'adm-giftall') {
      const v = admNum('admGiftAmt');
      if (!(v >= 1 && v <= 1000000)) return bad('Type how many flakes everyone gets (1 to 1,000,000).');
      return admArm(a, () => admDo('nr_admin_gift_all', { p_flakes: v, p_note: String(admVal('admGiftNote')).trim() || null }, r => `Sent ${fmt(v)} flakes to ${fmt((r && r.riders) || 0)} riders.`, () => { adm.draft.admGiftNote = ''; pushProgress(true); }));
    }
    if (a.startsWith('adm-days-')) return admStats(+a.slice(9) || 7);
    if (a.startsWith('adm-find-')) { const r = (prof && prof.data && prof.data.name) || (prof && prof.row && prof.row.name) || ''; adm.q = r; adm.msg = null; adm.edit = null; adm.confirm = ''; view = 'admin'; renderPanel(); overlay.scrollTop = 0; return admLoad(); }
    if (a.startsWith('adm-wipe-')) return admArm(a, () => admDo('nr_admin_remove_score', { p_id: id, p_which: 'all', p_day: dayKey }, `Removed ${nm}'s scores from every board.`));
    if (a.startsWith('adm-wday-')) return admArm(a, () => admDo('nr_admin_remove_score', { p_id: id, p_which: 'daily', p_day: dayKey }, `Removed ${nm}'s run from today's course.`));
    if (a.startsWith('adm-ban-')) return admArm(a, () => admDo('nr_admin_ban', { p_id: id, p_banned: true }, `${nm} is banned. Their scores are gone and new ones won't post.`));
    if (a.startsWith('adm-unban-')) return admArm(a, () => admDo('nr_admin_ban', { p_id: id, p_banned: false }, `${nm} can post scores again.`));
    if (a.startsWith('adm-ren-') || a.startsWith('adm-pw-')) {
      const kind = a.startsWith('adm-ren-') ? 'rename' : 'reset';
      adm.edit = adm.edit && adm.edit.id === id && adm.edit.kind === kind ? null : { id, kind }; adm.confirm = ''; renderPanel();
      const f = panel.querySelector(kind === 'rename' ? '#admNewName' : '#admNewPass'); if (f && f.focus) f.focus();
    }
  }
  // Buys a flex item, or puts it on if you own it. Tapping the name color or title you're using takes it off.
  function flexTap(kind, id) {
    if (kind === 'color' && id === 'none') { save.style.color = ''; save.picked.color = Date.now(); persist(); pushFlair(); return renderPanel(); }
    const it = flexItem(kind, id); if (!it) return;
    if (!flexOwned(kind, id)) {
      if (it.ach && !save.done.includes(it.ach)) return;
      if (save.coins < it.cost) return;
      save.coins -= it.cost; save.life.spent += it.cost; save.owned[kind].push(id); save.owned[kind].sort();
      initAudio(); tone(988, .08, 'triangle', .05); tone(1480, .16, 'triangle', .05, 0, .08);
      save.style[kind] = id;
    } else if (save.style[kind] === id && (kind === 'color' || kind === 'title')) save.style[kind] = '';
    else { save.style[kind] = id; initAudio(); tone(1046, .08, 'triangle', .04); }
    save.picked[kind] = Date.now();
    checkAch(blankStats()); persist();
    if (kind === 'color' || kind === 'title') pushFlair();
    renderPanel();
  }
  function buySkin(id) {
    const sk = SKINS.find(k => k.id === id); if (!sk || !sk.cost || skinOwned(sk) || save.coins < sk.cost) return;
    save.coins -= sk.cost; save.life.spent += sk.cost; save.skins.push(sk.id); save.skin = sk.id; save.picked.skin = Date.now();
    initAudio(); tone(988, .08, 'triangle', .05); tone(1480, .16, 'triangle', .05, 0, .08);
    checkAch(blankStats()); persist(); renderPanel();
  }
  function buy(id) {
    const u = UPG.find(x => x.id === id); if (!u) return;
    const lv = save.up[id] || 0; if (lv >= u.max) return;
    const cost = u.cost[lv]; if (save.coins < cost) return;
    save.coins -= cost; save.up[id] = lv + 1; save.bought = true; save.life.spent += cost;
    initAudio(); tone(988, .08, 'triangle', .05); tone(1480, .16, 'triangle', .05, 0, .08);
    checkAch(blankStats()); persist(); renderPanel();
  }
  panel.addEventListener('click', e => {
    const b = e.target.closest('button[data-act]'); if (!b || b.disabled) return;
    const a = b.dataset.act;
    if (a === 'start') start();
    else if (a === 'start-free') start('free');
    else if (a === 'start-daily') start('daily');
    else if (a === 'resume') resume();
    else if (a === 'challenge') shareChallenge();
    else if (a === 'giftok') { giftNote = null; renderPanel(); }
    else if (a === 'auth-register' || a === 'auth-login') { const u = panel.querySelector('#uname'); if (u) authUser = u.value; authMode = a.slice(5); authErr = ''; renderPanel(); focusName(); }
    else if (a === 'guest') { guest = true; renderPanel(); }
    else if (a === 'to-login') { guest = false; authMode = 'login'; authErr = ''; renderPanel(); focusName(); }
    else if (a === 'logout') logOut();
    else if (a === 'rename') { renaming = true; renderPanel(); focusName(); }
    else if (a === 'cancel-name') { renaming = false; renderPanel(); }
    else if (a === 'tab-all' || a === 'tab-daily') { lbTab = a.slice(4); renderPanel(); }
    else if (a === 'lb-refresh') refreshBoards();
    else if (a === 'restart') restartRun();
    else if (a === 'update-now') applyUpdate();
    else if (a === 'quit') quitRun();
    else if (a === 'open-settings') openSettings();
    else if (a.startsWith('bind-')) { const [, act, slot] = a.split('-'); capturing = { act, slot: +slot }; renderPanel(); }
    else if (a === 'keys-reset') { save.settings.keys = JSON.parse(JSON.stringify(DEF_KEYS)); capturing = null; persist(); renderPanel(); }
    else if (a === 'set-steer') { save.settings.steer = save.settings.steer === 'sides' ? 'drag' : 'sides'; stick = null; touchDir = 0; persist(); renderPanel(); }
    else if (a === 'set-shake' || a === 'set-ghost' || a === 'set-stats') { const k = a.slice(4); save.settings[k] = !save.settings[k]; persist(); renderPanel(); }
    else if (a === 'set-fx') { save.settings.fx = save.settings.fx === 'low' ? 'full' : 'low'; persist(); renderPanel(); }
    else if (a === 'settings-reset') { save.settings = defSettings(); save.music = true; save.muted = false; capturing = null; persist(); syncToggles(); applyVolumes(); renderPanel(); }
    else if (a.startsWith('prof-')) openProfile(a.slice(5));
    else if (a.startsWith('rinvd-')) raceInvite(a.slice(6), 'distance');
    else if (a.startsWith('rinvs-')) raceInvite(a.slice(6), 'score');
    else if (a.startsWith('racc-')) raceAccept(a.slice(5));
    else if (a.startsWith('rdec-')) raceDecline(a.slice(5));
    else if (a === 'rcancel' || a === 'rback') { raceLeave(); view = 'friends'; renderPanel(); loadFriends(); }
    else if (a.startsWith('gday-')) raceGhost(a.slice(5), 'daily');
    else if (a.startsWith('gbest-')) raceGhost(a.slice(6), 'free');
    else if (a.startsWith('fryes-')) friendDo('nr_friend_respond', { p_id: a.slice(6), p_accept: true }, "You're friends now.");
    else if (a.startsWith('frno-')) friendDo('nr_friend_remove', { p_id: a.slice(5) }, null);
    else if (a.startsWith('frrm-')) { if (fr.confirm === a) friendDo('nr_friend_remove', { p_id: a.slice(5) }, 'Removed.'); else { fr.confirm = a; renderPanel(); } }
    else if (a.startsWith('fradd-')) { const nm = (prof && prof.data && prof.data.name) || (prof && prof.row && prof.row.name) || ''; view = 'friends'; friendDo('nr_friend_request', { p_username: nm }, r => r.friends ? `You and ${r.name} are friends now.` : `Request sent to ${r.name}.`); }
    else if (a.startsWith('adm-')) adminClick(a);
    else if (a.startsWith('v-')) {
      view = a.slice(2); renaming = false; acctMsg = null;
      if (view === 'admin') { adm.msg = null; adm.edit = null; adm.confirm = ''; }
      renderPanel(); overlay.scrollTop = 0;
      if (view === 'leader') refreshBoards();
      if (view === 'admin') admLoad();
      if (view === 'shop' || view === 'skins' || view === 'boards') pushProgress(true); // spend from the newest flakes total
      if (view === 'friends') { fr.msg = null; fr.confirm = ''; loadFriends(); pollRaces(); }
      if (updateReady && view === 'home') onUpdateReady();
    }
    else if (a.startsWith('buy-')) buy(a.slice(4));
    else if (a.startsWith('board-')) { const i = +a.slice(6); if (boardOwned(i)) { save.board = i; save.picked.board = Date.now(); if (!save.boardsOwned.includes(i)) save.boardsOwned.push(i); for (const k in skinPreviews) delete skinPreviews[k]; persist(); renderPanel(); } }
    else if (a.startsWith('skintab-')) { skinTab = a.slice(8); renderPanel(); }
    else if (a.startsWith('shoptab-')) { shopTab = a.slice(8); renderPanel(); }
    else if (a.startsWith('boost-')) kitTap(a.slice(6));
    else if (a.startsWith('flex-')) { const [, kind, id] = a.match(/^flex-([a-z]+)-([a-z]+)$/) || []; if (kind) flexTap(kind, id); }
    else if (a.startsWith('skinbuy-')) buySkin(a.slice(8));
    else if (a.startsWith('skin-')) { const sk = skinById(a.slice(5)); if (skinOwned(sk)) { save.skin = sk.id; save.picked.skin = Date.now(); persist(); tone(1046, .08, 'triangle', .04); renderPanel(); } }
    else if (a === 'achf-all' || a === 'achf-locked' || a === 'achf-done') { achFilter = a.slice(5); renderPanel(); }
  });

  // Challenge always brags about your best (today's best on the daily course) and ends on the link.
  function challengeText(withLink) {
    const r = lastResult; if (!r) return '';
    const end = withLink ? ':' : '.';
    if (r.mode === 'daily') {
      const best = Math.max(myDaily || 0, ghostDaily && ghostDaily.date === dayKey ? ghostDaily.s : 0, r.s);
      return `I put up ${fmt(best)} on today's Night Run course. Same mountain, same obstacles, and you've got until it changes tomorrow to beat me${end}`;
    }
    const best = Math.max(save.best || 0, myOnline || 0, r.s);
    return `My Night Run high score is ${fmt(best)}. You won't make it past the first rail. Prove me wrong${end}`;
  }
  // Share sheet on phones (when the page is its own site), clipboard everywhere else, selectable text as a last resort.
  function shareChallenge() {
    const r = lastResult; if (!r) return;
    save.life.challenges++; checkAch(blankStats()); persist();
    const url = SHARE_URL ? SHARE_URL + (r.mode === 'daily' ? '#daily' : '') : '', text = challengeText(!!url);
    const full = url ? `${text} ${url}` : text;
    const box = panel.querySelector('#chMsg');
    const say = h => { if (box) box.innerHTML = h; };
    const showText = () => {
      say(`<p class="sub">Copy this and send it:</p><textarea class="chbox" readonly rows="3">${esc(full)}</textarea>`);
      const ta = box && box.querySelector('textarea'); if (ta && ta.select) { ta.focus(); ta.select(); }
    };
    const copy = () => {
      try {
        navigator.clipboard.writeText(full).then(() => { say(`<p class="sub ok">Copied. Paste it into a text or group chat.</p>`); tone(1175, .08, 'triangle', .04); }, showText);
      } catch (e) { showText(); }
    };
    if (navigator.share && TOP_LEVEL && matchMedia('(pointer: coarse)').matches) {
      navigator.share(url ? { text, url } : { text }).then(() => say(`<p class="sub ok">Shared.</p>`), e => { if (!e || e.name !== 'AbortError') showText(); });
      return;
    }
    copy();
  }

  // Volume sliders update live; letting go plays a sample so you can hear the new level.
  panel.addEventListener('input', e => {
    const id = e.target && e.target.id;
    if (id === 'admQ') { adm.q = e.target.value; return; }
    if (id === 'achQ') { achQuery = e.target.value; const box = panel.querySelector('#achList'); if (box && 'innerHTML' in box) box.innerHTML = achGroupsHTML(); else renderPanel(); return; }
    if (id !== 'volMusic' && id !== 'volSfx') return;
    const v = Math.max(0, Math.min(100, Math.round(+e.target.value || 0)));
    if (id === 'volMusic') { save.settings.music = v; save.music = v > 0; } else { save.settings.sfx = v; save.muted = v === 0; }
    const out = panel.querySelector('#' + id + 'Out'); if (out) out.textContent = v ? v + '%' : 'Off';
    syncToggles(); applyVolumes(); persist();
  });
  // <details> toggles don't bubble, so listen while the event travels down
  panel.addEventListener('toggle', e => { const d = e.target; if (d && d.classList && d.classList.contains('achgroup') && !achQuery.trim() && achFilter === 'all') { if (d.open) achOpen.add(d.dataset.cat); else achOpen.delete(d.dataset.cat); } }, true);
  panel.addEventListener('change', e => {
    if (e.target && e.target.id === 'volSfx') { initAudio(); applyVolumes(); tone(880, .12, 'triangle', .08); tone(1320, .12, 'triangle', .06, 0, .08); }
  });
  panel.addEventListener('submit', e => {
    e.preventDefault();
    const formId = (e.target && e.target.id) || 'nameForm';
    const val = q => { const el = panel.querySelector(q); return el ? el.value : ''; };
    if (formId === 'authForm') { if (!authBusy) { authUser = val('#uname'); initAudio(); doAuth(authMode, authUser, val('#upass')); } return; }
    if (formId === 'renameForm') { acctAction('rename', val('#newName')); return; }
    if (formId === 'passForm') { acctAction('pass', val('#oldPass'), val('#newPass')); return; }
    if (formId === 'friendForm') { const nm = val('#friendName').trim(); if (nm) friendDo('nr_friend_request', { p_username: nm }, r => r.friends ? `You and ${r.name} are friends now.` : `Request sent to ${r.name}. They'll see it on their Friends screen.`); return; }
    if (formId === 'admSearch') { adm.q = val('#admQ').trim(); adm.edit = null; adm.confirm = ''; adm.msg = null; admLoad(); return; }
    if (formId === 'admRename' && adm.edit) { const u = admRider(adm.edit.id); admDo('nr_admin_rename', { p_id: adm.edit.id, p_username: val('#admNewName') }, `Renamed ${u.name || 'that rider'} to ${cleanName(val('#admNewName'))}.`); return; }
    if (formId === 'admReset' && adm.edit) { const u = admRider(adm.edit.id), pw = val('#admNewPass'); admDo('nr_admin_reset_password', { p_id: adm.edit.id, p_password: pw }, `${u.name || 'Their'} password is now "${pw}". Send it to them privately.`); return; }
    const input = panel.querySelector('#uname'), errEl = panel.querySelector('#nameErr');
    const err = saveName(input ? input.value : '');
    if (err) { if (errEl) errEl.textContent = err; if (input && input.focus) input.focus(); return; }
    initAudio(); tone(784, .08, 'triangle', .05); tone(1175, .14, 'triangle', .05, 0, .08);
    renderPanel();
    const g = panel.querySelector('.modes .go:not(.alt)'); if (g && g.focus) g.focus({ preventScroll: true });
  });


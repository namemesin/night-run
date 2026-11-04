  /* ================= flow ================= */
  function start(mode) {
    if (updateReady && mode !== 'race') { if (mode === 'daily' || mode === 'free') { save.mode = mode; persist(); } return applyUpdate(); }
    if (ACCOUNTS ? (!save.acct && !guest) : !save.name) { view = 'home'; if (!ACCOUNTS) renaming = true; renderPanel(); focusName(); return; }
    initAudio();
    runMode = mode === 'daily' || mode === 'free' ? mode : save.mode;
    if (save.mode !== runMode) { save.mode = runMode; persist(); }
    if (ghostRace && (mode === 'race' || (ghostRace.kind === 'daily' && runMode !== 'daily') || (ghostRace.kind === 'free' && runMode !== 'free'))) ghostRace = null;
    rollDay();
    if (mode !== 'race' && race) raceLeave();
    runMode = mode === 'race' && race ? 'race' : runMode;
    rand = runMode === 'daily' ? seeded('nightrun-' + dayKey) : runMode === 'race' ? seeded('race-' + race.seed) : Math.random;
    resize(); reset(); state = 'run'; overlay.hidden = true; pauseBtn.hidden = runMode === 'race';
    { const hr = new Date().getHours(); run.owl = hr < 4 ? 1 : 0; run.early = hr >= 5 && hr < 8 ? 1 : 0; }
    if (ghostRace) { ghost = ghostRace; gh.on = ghost.r.length >= 4; gh.done = false; gh.passed = false; gh.name = ghostRace.name; toast(`RACING ${ghostRace.name.toUpperCase()}'S GHOST · BEAT ${fmt(ghostRace.s)}`, '#7fe8ff', 160); }
    else gh.name = '';
    if (runMode === 'race') { gh.on = false; toast(`${KIND[race.kind].n.toUpperCase()} VS ${race.opp.name.toUpperCase()} · ${KIND[race.kind].win.toUpperCase().replace('.', '')}`, '#ffd24a', 160); }
    if (runMode === 'daily') { run.daily = 1; if (!ghostRace) toast(`DAILY COURSE · ${dayLabel.toUpperCase()}`, '#b48cff', 130); }
    else if (runMode === 'free' && !ghostRace) applyBoosts();
    if (runMode !== 'race' && (evMult('xp') > 1 || evMult('flakes') > 1)) toast(evLabel(cfg.ev).toUpperCase() + ' EVENT', '#5cf2b0', 120);
    last = performance.now();
    tone(523, .1, 'triangle', .06); tone(784, .14, 'triangle', .06, 0, .09);
    musicStart();
    kickLoop();
  }
  // A Free ride uses up the boosts you bought. Second chance stays until a crash uses it.
  function applyBoosts() {
    for (const b of BOOSTS) if (b.cost && save.kit[b.id]) { boostOn[b.id] = true; usedKit.push(b.id); kitUse(b.id); }
    boostOn.revive = !!save.kit.revive;
    if (usedKit.length) { saveLocal(); toast(`BOOSTS ON: ${usedKit.map(id => BOOSTS.find(b => b.id === id).short.toUpperCase()).join(', ')}`, '#7fe8ff', 130); }
    if (boostOn.head) {
      // the run clock starts as if you rode here, so the server's cheat check still adds up
      dist = startDist = HEAD_START; runT = nextSample = runT0 = 360; gh.on = false; run.boosted = 1;
    }
    if (boostOn.lant) { lanternsHeld = 3; boostBtn.hidden = false; }
    if (boostOn.spare) player.spares = 1;
  }
  // Restarting or quitting before you've really ridden puts the boosts back, ready for the next run.
  function refundBoosts() {
    if (!usedKit.length || dist - startDist >= 100) return;
    for (const id of usedKit) kitAdd(id);
    usedKit = []; persist();
  }
  const reviveCost = () => Math.min(9600, 300 * 2 ** (save.revives.day === dayKey ? save.revives.n : 0));
  // Buy a boost for your next Free ride, or tap a bought one to get your flakes back.
  function kitTap(id) {
    const b = BOOSTS.find(x => x.id === id); if (!b || state === 'run' || state === 'crash') return;
    if (save.kit[id]) {
      const paid = save.kitPaid[id] || 0;
      kitUse(id); save.coins += paid; save.life.spent = Math.max(0, save.life.spent - paid);
      if (id === 'revive' && save.revives.day === dayKey) save.revives.n = Math.max(0, save.revives.n - 1);
      initAudio(); tone(520, .08, 'triangle', .04);
    } else {
      const price = id === 'revive' ? reviveCost() : b.cost;
      if (save.coins < price) return;
      kitAdd(id, price); save.coins -= price; save.life.spent += price;
      if (id === 'revive') { if (save.revives.day !== dayKey) save.revives = { day: dayKey, n: 0 }; save.revives.n++; }
      initAudio(); tone(988, .08, 'triangle', .05); tone(1480, .16, 'triangle', .05, 0, .08);
    }
    checkAch(blankStats()); persist(); pushProgress(true); renderPanel();
  }
  const kitReady = () => BOOSTS.filter(b => save.kit[b.id]);
  function secondChance() {
    kitUse('revive'); boostOn.revive = false; run.revived = 1; saveLocal();
    for (const o of obs) if (!o.hit && o.y > player.y - 40 && o.y < player.y + 280 && (o.kind === 'tree' || o.kind === 'rock' || o.kind === 'skier' || o.kind === 'crevasse')) { o.hit = true; burst(o.x, o.y, 10, ['#7fe8ff', '#e8eef7'], 4, 25, 2); }
    player.air = 0; player.spin = 0; player.grind = null; inv = 120; flash = .7; shake = 10; punch = 1; cause = '';
    float(player.x, player.y - 34, 'SECOND CHANCE', '#7fe8ff', true);
    tone(392, .2, 'triangle', .06); tone(784, .3, 'triangle', .06, 0, .15); tone(1175, .4, 'triangle', .05, 0, .3);
  }
  function pause() {
    if (state !== 'run' || runMode === 'race') return;
    state = 'paused'; musicStop(); pauseBtn.hidden = true; view = 'home'; capturing = null;
    renderPanel(); overlay.hidden = false;
    const b = panel.querySelector('[data-act="resume"]'); if (b) b.focus({ preventScroll: true });
  }
  function resume() {
    if (state !== 'paused') return;
    initAudio();
    state = 'run'; overlay.hidden = true; pauseBtn.hidden = false; last = performance.now();
    musicStart(); kickLoop();
  }
  // Throws the current run away (no score, no flakes) and drops in again on the same course type.
  function restartRun() {
    if (state !== 'run' && state !== 'paused') return;
    if (runMode === 'race') return;
    if (dist - startDist > 30) logRun('restart');
    refundBoosts();
    musicStop(true); boostBtn.hidden = true;
    start(runMode);
  }
  function quitRun() {
    if (state !== 'paused') return;
    if (dist - startDist > 30) logRun('quit');
    refundBoosts(); ghostRace = null;
    loopId++; state = 'menu'; view = 'home'; capturing = null;
    pauseBtn.hidden = true; boostBtn.hidden = true;
    renderPanel(); overlay.hidden = false; overlay.scrollTop = 0;
    idleStart();
    if (updateReady) onUpdateReady();
  }
  function openSettings() {
    if (state === 'run') pause();
    view = 'settings'; capturing = null; renderPanel(); overlay.hidden = false; overlay.scrollTop = 0;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); flushProgress(); } else { checkForUpdate(); if (state !== 'run') { pushProgress(true); pollRaces(); loadConfig(); } } });
  addEventListener('pagehide', flushProgress);
  // Coming back to this window (another device may have changed something meanwhile).
  let focusSync = 0;
  addEventListener('focus', () => { if (state !== 'run' && state !== 'crash' && Date.now() - focusSync > 3000) { focusSync = Date.now(); pushProgress(true); } });

  function crash() {
    if (state === 'run' && boostOn.revive && save.kit.revive && !run.revived) return secondChance();
    state = 'crash'; crashT = 70; shake = 16; flash = .8; player.grind = null; buzz([40, 30, 60]);
    if (runMode === 'race' && race) raceSend(0, true);
    const ce = save.style.crash, px = player.x, py = player.y;
    if (ce === 'snow') { burst(px, py, 110, ['#ffffff', '#e8eef7', '#cfeeff'], 11, 75, 5); flash = 1; }
    else if (ce === 'confetti') burst(px, py, 90, ['#ff4466', '#ffd24a', '#5cf2b0', '#4aa3ff', '#b48cff', '#ff7a3d'], 9, 85, 4);
    else if (ce === 'shatter') { burst(px, py, 26, ['#8fd3ff', '#cfeeff', '#ffffff'], 12, 60, 8); burst(px, py, 40, ['#e8f4ff'], 5, 40, 2); }
    else if (ce === 'fireworks') {
      burst(px, py, 40, ['#ffb347', '#ffe0a8'], 7, 55, 3);
      pops = [[12, -40, -50, ['#ff4466', '#ffd2dc']], [24, 45, -70, ['#7fe8ff', '#e0f8ff']], [36, -10, -110, ['#ffd24a', '#fff2b0']]].map(([t, dx, dy, c]) => ({ t, x: px + dx, y: py + dy, c }));
    }
    else burst(px, py, 60, ['#e8eef7', '#8fd3ff', '#ffb347'], 8, 60, 4);
    noise(.5, .2); tone(160, .5, 'sawtooth', .08, -120);
    boostBtn.hidden = true; pauseBtn.hidden = true;
    musicStop();
  }

  function checkAch(s, quiet) {
    let any = false;
    for (const a of lockedAch()) {
      if (!achPass(a, s)) continue;
      const tier = TIERS[a.tier];
      save.done.push(a.id); newDone.push(a.id); any = true;
      if (quiet) { bookOnce(onceKey('a', a.id), tier.r); continue; }
      bookOnce(onceKey('a', a.id), tier.r); achFlakes += tier.r;
      toasts.push({ kind: 'ach', a, life: 190, max: 190 });
      const unlocked = BOARDS.find(b => b.r === achCount());
      if (unlocked) toast(unlocked.n.toUpperCase() + ' BOARD UNLOCKED', '#ffd24a');
      const skinNow = SKINS.find(k => (k.ach === a.id || k.achCount === achCount()) && !save.skins.includes(k.id));
      if (skinNow) toast(skinNow.n.toUpperCase() + ' SKIN UNLOCKED', '#ff5cf0');
      const base = ({ b: 523, s: 587, g: 659, p: 698, m: 784 })[a.tier];
      tone(base, .1, 'triangle', .06); tone(base * 1.26, .1, 'triangle', .06, 0, .1); tone(base * 1.5, .1, 'triangle', .06, 0, .2);
      tone(base * 2, .4, 'triangle', .06, 0, .3);
      if (a.tier === 'g' || a.tier === 'p' || a.tier === 'm') { tone(base * 2.52, .5, 'square', .03, 0, .42); flash = Math.max(flash, a.tier === 'm' ? .9 : .4); }
      if (a.tier === 'm') { tone(base * 3, .8, 'sawtooth', .03, 0, .6); shake = Math.max(shake, 10); }
    }
    if (any) persist();
  }
  function updateBest(s) {
    for (const k in s) if (typeof s[k] === 'number') save.bs[k] = Math.max(save.bs[k] || 0, Math.floor(s[k]));
  }
  const prevDay = k => { const [y, m, d] = k.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10); };
  // Career totals, added up when a run ends (restarted or quit runs don't count).
  function addLife(r) {
    const L = save.life;
    L.runs++; L.meters += r.meters; L.flakes += r.flakes; L.lanterns += r.lanterns; L.tricks += r.tricks; L.rails += r.rails;
    L.gates += r.gates; L.nearMiss += r.nearMiss; L.smashes += r.smashes; L.score += Math.floor(r.score); L.airs += r.airs; L.saves += r.saves;
    L.flares += r.flaresFired; L.shields += r.shields; L.magnets += r.magnets; L.doubles += r.doubles; L.crashes++;
    L.secs += Math.round((runT - runT0) / 60); L.ghostPasses += r.passedGhost; if (r.zone >= 4) L.bcVisits++;
    L.leaps += r.leaps || 0; if (r.zone >= 5) L.summitVisits++;
    if (runMode === 'daily' && save.dlast !== dayKey) {
      save.dstreak = save.dlast === prevDay(dayKey) ? (save.dstreak || 0) + 1 : 1;
      save.dlast = dayKey; L.dailyDays++; L.dailyStreak = Math.max(L.dailyStreak, save.dstreak);
    }
  }

  function end() {
    state = 'over';
    const s = Math.floor(run.score), isBest = s > save.best;
    if (isBest) save.best = s;
    const xp0 = riderXP(), lv0 = riderLevel();
    const gr = ghostRace; ghostRace = null;
    if (gr && s > gr.s) save.life.ghostWins++;
    if (runMode === 'race') save.life.races++;
    const xpGain = Math.round(runXP(run.meters, s) * evMult('xp'));
    save.xpl.e[save.lk] = (save.xpl.e[save.lk] || 0) + xpGain;
    updateBest(run); addLife(run); missionTick(run, true); checkAch(run);
    logRun(cause || 'crash');
    const earned = Math.round((run.flakes + Math.floor(s / 250)) * (1 + .1 * (save.up.lucky || 0)) * evMult('flakes'));
    save.coins += earned;
    save.top.push({ s, z: zoneIdx, d: Math.floor(dist), m: runMode });
    save.top.sort((a, b) => b.s - a.s); save.top = save.top.slice(0, 5);
    persist(); bestEl.textContent = fmt(save.best);
    let newGhost = false;
    if (rec.length >= 4 && !startDist) {
      if (runMode === 'daily') { if (!ghostDaily || s > ghostDaily.s) { ghostDaily = { date: dayKey, s, r: rec }; saveJSON('nightrun-dghost', ghostDaily); newGhost = true; uploadGhost('daily'); } }
      else if (runMode === 'free' && (!ghostFree || s > ghostFree.s)) { ghostFree = { s, r: rec }; saveJSON('nightrun-ghost', ghostFree); newGhost = true; uploadGhost('free'); }
    }
    const title = isBest ? 'New best!' : (runMode === 'daily' && newGhost) ? 'Daily best!' : cause === 'landing' ? 'Bailed the landing' : cause === 'skier' ? 'Took out a skier' : cause === 'crevasse' ? 'Fell into a crevasse' : 'Wipeout';
    lastResult = { s, isBest, earned, title, d: Math.floor(dist), z: zoneIdx, stats: run, mode: runMode, newGhost, ach: newDone.slice(), achFlakes, missions: runMissions.slice(),
      xp: riderXP() - xp0, lv: riderLevel(), levelUp: riderLevel() > lv0, ghostRace: gr ? { name: gr.name, s: gr.s, beat: s > gr.s } : null,
      evF: evMult('flakes'), evX: evMult('xp') };
    if (runMode === 'race' && race) raceFinished(s, Math.floor(dist));
    Object.assign(lastResult, submitRun(s));
    checkForUpdate();
    view = 'home'; renderPanel(); overlay.hidden = false; overlay.scrollTop = 0;
    const g = panel.querySelector('.modes .go:not(.alt)'); if (g) g.focus({ preventScroll: true });
    idleStart();
    if (clearLater !== null) { const m = clearLater; clearLater = null; clearAccount(m); }
  }


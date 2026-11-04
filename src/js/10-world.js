  /* ================= world ================= */
  const snowfall = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.7 + .3 }));
  const grooves = Array.from({ length: 14 }, () => ({ x: Math.random(), y: Math.random(), l: 20 + Math.random() * 60 }));

  function reset() {
    player = { x: W / 2, y: H * 0.3, vx: 0, tilt: 0, air: 0, airMax: 1, spin: 0, shield: save.up.shield > 0, grind: null, spares: 0 };
    obs = []; parts = []; texts = []; trail = []; toasts = [];
    dist = 0; speed = 3.4; spawnT = 30; t0 = performance.now();
    combo = 0; comboT = 0; lanternsHeld = 0; flareT = 0; shake = 0; inv = 0; gateChain = 0;
    zoneIdx = 0; bannerT = 120; crashT = 0; flash = 0; cause = '';
    magnetT = 0; dblT = 0; darkA = 0; freeze = 0; punch = 0; summitA = 0;
    reserveX = -999; reserveT = 0; patternCd = 100; grindPts = 0;
    startDist = 0; runT0 = 0; usedKit = []; boostOn = {}; pops = [];
    run = blankStats(); newDone = []; achFlakes = 0; runMissions = [];
    rec = []; runT = 0; nextSample = 0;
    ghost = runMode === 'daily' ? ghostDaily : ghostFree;
    gh.on = save.settings.ghost && !!(ghost && ghost.r && ghost.r.length >= 4); gh.done = false; gh.passed = false; gh.x = W / 2; gh.d = 0;
    boostBtn.hidden = true;
  }

  const SIZES = { lantern: 9, shield: 9, coin: 7, magnet: 10, dbl: 10, ramp: 16, gate: 0, skier: 14, rail: 0 };
  function add(kind, x, yOff = 0, extra) {
    let s = SIZES[kind];
    if (kind === 'tree') s = 14 + rand() * 16;
    else if (kind === 'rock') s = 14 + rand() * 14;
    const o = Object.assign({ kind, x, y: H + 50 + yOff, s, hit: false, passed: false, wob: rand() * 6 }, extra || {});
    obs.push(o); return o;
  }
  function freeX(m) {
    for (let i = 0; i < 6; i++) {
      const x = m + rand() * Math.max(1, W - 2 * m);
      if (reserveT <= 0 || Math.abs(x - reserveX) > 48) return x;
    }
    return reserveX < W / 2 ? W - m - rand() * 30 : m + rand() * 30;
  }
  const reserve = (x, len) => { reserveX = x; reserveT = (len + 140) / Math.max(speed, 1); };

  // Crevasses: wide cracks in the Summit. Ride around them, or be in the air when you cross.
  function addCrevasse(yOff, x) {
    const w = 86 + rand() * 80, h = 16 + rand() * 8, jag = [];
    for (let i = 0; i <= 8; i++) jag.push((rand() - .5) * h * .4);
    const cx = x == null ? freeX(w / 2 + 10) : Math.max(w / 2 + 8, Math.min(W - w / 2 - 8, x));
    return add('crevasse', cx, yOff, { w, h, jag });
  }
  const crevNear = () => obs.some(o => o.kind === 'crevasse' && o.y > H - 200);
  function spawnOne() {
    // crevasses stay well apart, so there's always a way through
    if (zoneIdx >= 5 && rand() < .12 && !crevNear()) { addCrevasse(0); return; }
    const hard = Math.min(1, dist / 1500), r = rand(), y = zoneIdx === 4 ? .04 : 0;
    if (r < 0.07 + y) add('lantern', freeX(20));
    else if (r < 0.095 + y) add('shield', freeX(20));
    else if (r < 0.115 + y) { if (save.up.magnet > 0) add('magnet', freeX(20)); else add('coin', freeX(20)); }
    else if (r < 0.135) add('dbl', freeX(20));
    else if (r < 0.18 + y) add('ramp', freeX(34), 0, { w: 54 });
    else if (r < 0.22 && dist > 120) { const w = 112 - hard * 34; add('gate', w / 2 + 22 + rand() * Math.max(1, W - w - 44), 0, { w }); }
    else if (r < 0.47 + (dist > 400 ? .05 : 0)) {
      if (dist > 400 && rand() < .35) add('skier', freeX(20), 0, { vx: (rand() < .5 ? -1 : 1) * (1 + rand() * 1.2) });
      else add('rock', freeX(20));
    }
    else add('tree', freeX(20));
  }

  function spawnPattern() {
    const p = rand();
    if (zoneIdx >= 5 && p < .3 && !crevNear()) {
      // ramp lined up with a crevasse: hit the kicker and clear it, or steer around
      const x = Math.max(100, Math.min(W - 100, freeX(70)));
      for (let i = 0; i < 3; i++) add('coin', x, i * 24);
      add('ramp', x, 84, { w: 54 });
      addCrevasse(250, x);
      for (let i = 0; i < 4; i++) add('coin', x, 180 + i * 42);
      reserve(x, 340);
      return;
    }
    if (p < 0.22) { const x = freeX(40); for (let i = 0; i < 6; i++) add('coin', x, i * 26); reserve(x, 160); }
    else if (p < 0.42) { const x = Math.max(70, Math.min(W - 70, freeX(70))); for (let i = 0; i < 9; i++) add('coin', x + Math.sin(i * .75) * 40, i * 24); reserve(x, 220); }
    else if (p < 0.66) { const x = freeX(50); for (let i = 0; i < 3; i++) add('coin', x, i * 24); add('ramp', x, 84, { w: 54 }); for (let i = 0; i < 5; i++) add('coin', x, 140 + i * 26); reserve(x, 280); }
    else if (p < 0.86) { const x = freeX(40), len = 150 + rand() * 110; add('rail', x, 0, { len }); for (let i = 0; i * 30 < len; i++) add('coin', x, 12 + i * 30); reserve(x, len); }
    else {
      const w = Math.max(84, 112 - Math.min(1, dist / 1500) * 30), sw = Math.max(0, Math.min(90, W / 2 - w / 2 - 22));
      for (let i = 0; i < 4; i++) add('gate', W / 2 + (i % 2 ? sw : -sw), i * 130, { w });
    }
  }

  function closeCall(x, y) {
    combo = Math.min(combo + 1, 30); comboT = comboWin(); run.maxCombo = Math.max(run.maxCombo, combo); run.nearMiss++;
    if (dblT > 0 && combo >= 10) run.combo2x = 1;
    const pts = 10 * combo; addScore(pts);
    float(x, y, combo > 1 ? `CLOSE x${combo} +${pts}` : `CLOSE +${pts}`, '#5cf2b0');
    tone(880 + Math.min(combo, 20) * 40, .08, 'square', .025);
  }
  function burst(x, y, n, colors, spd = 4, life = 40, size = 3) {
    if (reduce || save.settings.fx === 'low') n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = Math.random() * spd;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, c: colors[i % colors.length], s: Math.random() * size + 1 });
    }
    if (parts.length > 600) parts.splice(0, parts.length - 600);
  }
  const float = (x, y, text, c, big) => texts.push({ x, y, text, c, life: big ? 70 : 50, big });
  const toast = (text, c = '#5cf2b0', life = 150) => toasts.push({ text, c, life });
  const addScore = n => { run.score += n * (dblT > 0 ? 2 : 1); };

  function fireFlare() {
    if (lanternsHeld < 3 || flareT > 0 || state !== 'run') return;
    lanternsHeld = 0; flareT = flareDur(); flash = 1; shake = 8; punch = 1; boostBtn.hidden = true; run.flaresFired++;
    burst(player.x, player.y, 40, ['#ffb347', '#ffe0a8', '#ff7a3d'], 7, 45, 4);
    float(player.x, player.y - 30, 'FLARE!', '#ffb347', true);
    tone(220, .5, 'sawtooth', .07, 600); tone(440, .4, 'square', .03, 400);
  }

  function launch(x, y, dur) {
    player.air = dur; player.airMax = dur; player.spin = 0;
    burst(x, y, 14, ['#e8eef7', '#b9c9de'], 3, 25, 2);
    tone(300, .35, 'triangle', .06, 500);
  }

  function land() {
    const rot = Math.abs(player.spin) / TAU;
    const a = ((player.spin % TAU) + TAU) % TAU, off = Math.min(a, TAU - a);
    burst(player.x, player.y + 8, 16, ['#e8eef7', '#b9c9de'], 3.5, 26, 2);
    player.spin = 0;
    if (off < landTol()) {
      const n = Math.round(rot);
      run.airs++; run.maxAir = Math.max(run.maxAir, Math.round(player.airMax));
      if (n === 0) { addScore(50); float(player.x, player.y - 30, 'AIR +50', '#e8eef7'); }
      else {
        const pts = 250 * n * (n + 1) / 2;
        addScore(pts); run.tricks++; run.maxRot = Math.max(run.maxRot, n); buzz(15);
        float(player.x, player.y - 34, `${n * 360} +${pts}`, '#5cf2b0', true);
        shake = Math.max(shake, 4); punch = Math.min(1.4, .5 + n * .3);
        tone(523, .1, 'square', .04); tone(659, .1, 'square', .04, 0, .08); tone(784, .2, 'square', .04, 0, .16);
        if (n >= 2) tone(1046, .3, 'square', .035, 0, .26);
      }
    } else if (flareT > 0) float(player.x, player.y - 30, 'SAVED BY FLARE', '#ffb347');
    else if (player.shield) { useShield(); run.sketchy = 1; float(player.x, player.y - 30, 'SKETCHY', '#8fd3ff'); }
    else { cause = 'landing'; crash(); }
  }

  function endGrind() {
    const pts = Math.floor(grindPts);
    player.grind = null; run.rails++; run.maxGrind = Math.max(run.maxGrind, pts);
    float(player.x, player.y - 30, 'GRIND +' + pts, '#e8eef7', true);
    punch = Math.max(punch, .4);
    launch(player.x, player.y, 26 + speed * 2.5);
  }

  function useShield() {
    player.shield = false; inv = 60; run.saves++; shake = 10; flash = .5; buzz(30);
    burst(player.x, player.y, 30, ['#8fd3ff', '#e8eef7'], 6, 40, 3);
    tone(900, .3, 'sine', .07, -600);
  }

  function pickup(o) {
    const k = o.kind;
    if (k === 'coin') {
      run.flakes++; addScore(5);
      burst(o.x, o.y, 5, ['#dff3ff', '#8fd3ff'], 2, 18, 2);
      tone(1500 + (run.flakes % 6) * 110, .05, 'triangle', .03);
    } else if (k === 'lantern') {
      addScore(40); run.lanterns++; lanternsHeld = Math.min(3, lanternsHeld + 1);
      burst(o.x, o.y, 18, ['#ffb347', '#ffe0a8'], 4, 30, 3);
      float(o.x, o.y - 14, lanternsHeld === 3 ? 'FLARE READY' : '+40', '#ffb347');
      tone(660 + lanternsHeld * 220, .14, 'triangle', .06);
      if (lanternsHeld === 3 && flareT <= 0) { boostBtn.hidden = false; tone(1320, .3, 'triangle', .05); }
    } else if (k === 'shield') {
      player.shield = true; run.shields++; burst(o.x, o.y, 18, ['#8fd3ff', '#e8eef7'], 4, 30, 3);
      float(o.x, o.y - 14, 'SHIELD', '#8fd3ff'); tone(520, .2, 'sine', .06, 400);
    } else if (k === 'magnet') {
      magnetT = magnetDur(); run.magnets++; burst(o.x, o.y, 18, ['#ff4466', '#e8eef7'], 4, 30, 3);
      float(o.x, o.y - 14, 'MAGNET', '#ff6680'); tone(300, .25, 'square', .04, 300);
    } else if (k === 'dbl') {
      dblT = 420; run.doubles++; burst(o.x, o.y, 18, ['#ffd24a', '#fff2b0'], 4, 30, 3);
      float(o.x, o.y - 14, '2X POINTS', '#ffd24a', true); tone(784, .1, 'triangle', .05); tone(1175, .2, 'triangle', .05, 0, .1);
    }
  }


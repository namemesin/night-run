  /* ================= loop ================= */
  let loopId = 0;
  function kickLoop() {
    const id = ++loopId;
    const step = now => {
      if (id !== loopId || (state !== 'run' && state !== 'crash')) return;
      const dt = Math.min((now - last) / 16.67, 3); last = now;
      if (freeze > 0) freeze -= dt; else update(dt, now);
      draw(now);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function update(dt, now) {
    shake = Math.max(0, shake - dt * 0.8);
    flash = Math.max(0, flash - dt * 0.04);
    punch = Math.max(0, punch - dt * 0.05);
    const pdt = state === 'crash' ? dt * .5 : dt;
    for (const p of parts) { p.x += p.vx * pdt; p.y += p.vy * pdt - (state === 'run' ? speed * pdt * .5 : 0); p.vx *= .96; p.vy *= .96; p.life -= pdt; }
    parts = parts.filter(p => p.life > 0);
    for (const t of texts) { t.y -= 1.1 * dt; t.life -= dt; }
    texts = texts.filter(t => t.life > 0);
    if (toasts.length) { toasts[0].life -= dt; toasts = toasts.filter(t => t.life > 0); }

    if (pops.length) {
      for (const p of pops) { p.t -= dt; if (p.t <= 0) { burst(p.x, p.y, 34, p.c, 6, 55, 3); tone(500 + Math.random() * 500, .15, 'triangle', .04); } }
      pops = pops.filter(p => p.t > 0);
    }
    if (state === 'crash') { crashT -= dt; if (crashT <= 0) end(); return; }

    const boosting = flareT > 0, inAir = player.air > 0;
    flareT = Math.max(0, flareT - dt); inv = Math.max(0, inv - dt);
    if (!player.shield && player.spares > 0 && inv <= 0) { player.shield = true; player.spares--; float(player.x, player.y - 30, 'EXTRA SHIELD', '#8fd3ff'); tone(520, .2, 'sine', .05, 400); }
    magnetT = Math.max(0, magnetT - dt); dblT = Math.max(0, dblT - dt);
    if (!boosting && lanternsHeld === 3) boostBtn.hidden = false;
    // same pace as always for the first 800 m, then it builds a bit more gradually
    speed = baseSpeed(dist) * (boosting ? 1.6 : 1);
    dist += speed * dt * 0.1;
    addScore(speed * dt * 0.1 * (1 + combo * 0.1));
    run.meters = Math.floor(dist - startDist);
    if (runMode === 'daily') run.dailyScore = Math.floor(run.score);
    if (!run.grounded && run.score >= 5000 && !run.airs && !run.rails && player.air <= 0) run.grounded = 1;

    // ghost: record this run, replay the best one (1 m of distance = 10 px on screen)
    runT += dt;
    while (runT >= nextSample && rec.length < 60000) { rec.push(Math.round(player.x / W * 1000), Math.round(dist * 10)); nextSample += 4; }
    if (gh.on) {
      const n = ghost.r.length / 2, f = runT / 4, i = Math.floor(f);
      if (i < n - 1) {
        const k = f - i, x0 = ghost.r[i * 2], x1 = ghost.r[i * 2 + 2];
        gh.x = (x0 + (x1 - x0) * k) / 1000 * W; gh.d = (ghost.r[i * 2 + 1] + (ghost.r[i * 2 + 3] - ghost.r[i * 2 + 1]) * k) / 10;
      } else { gh.done = true; gh.x = ghost.r[(n - 1) * 2] / 1000 * W; gh.d = ghost.r[(n - 1) * 2 + 1] / 10; }
      if (gh.done && !gh.passed && dist > gh.d) {
        gh.passed = true;
        if (gh.name) toast(`PASSED ${gh.name.toUpperCase()}'S GHOST`, '#7fe8ff', 130);
        else { run.passedGhost = 1; toast('PASSED YOUR BEST RUN', '#b48cff', 130); }
        tone(660, .12, 'triangle', .05); tone(880, .12, 'triangle', .05, 0, .1); tone(1320, .3, 'triangle', .05, 0, .2);
      }
    }

    const nz = ZONES.reduce((a, z, i) => dist >= z.at ? i : a, 0);
    if (nz !== zoneIdx) {
      zoneIdx = nz; run.zone = nz; bannerT = 140;
      if (nz >= 3 && !run.shields && !run.saves && !save.up.shield) run.noShield = 1;
      if (nz >= 4 && !run.flaresFired) run.purist = 1;
      tone(392, .15, 'triangle', .06); tone(587, .25, 'triangle', .06, 0, .12);
      if (nz === 4) toast('LIGHTS OUT. FOLLOW THE LANTERNS.', '#ffb347', 180);
      if (nz === 5) toast('SUMMIT. JUMP OR DODGE THE CREVASSES.', '#cdb4ff', 200);
    }
    bannerT = Math.max(0, bannerT - dt);
    darkA += ((zoneIdx === 4 ? .9 : 0) - darkA) * Math.min(1, .015 * dt);
    summitA += ((zoneIdx >= 5 ? 1 : 0) - summitA) * Math.min(1, .01 * dt);


    // steering, grinding, air
    const dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0) || touchDir;
    if (player.grind) {
      const r = player.grind;
      player.x += (r.x - player.x) * Math.min(1, .4 * dt); player.vx = 0;
      const g = .5 * speed * dt * (1 + .25 * (save.up.grind || 0)); grindPts += g; addScore(g);
      if (Math.random() < .9 * dt) parts.push({ x: player.x + (Math.random() - .5) * 8, y: player.y + 8, vx: (Math.random() - .5) * 3, vy: -Math.random() * 2.5, life: 18, max: 18, c: Math.random() < .5 ? '#ffd24a' : '#ffffff', s: Math.random() * 2 + 1 });
      if (r.y + r.len < player.y - 2) endGrind();
    } else if (inAir) {
      player.spin += dir * 0.19 * dt;
      if (!dir && touchUsed) { const a = ((player.spin % TAU) + TAU) % TAU, toward = a < Math.PI ? -a : TAU - a; player.spin += toward * Math.min(1, .09 * dt); }
      player.vx *= Math.pow(0.99, dt);
      player.air -= dt;
      if (player.air <= 0) { player.air = 0; land(); if (state !== 'run') return; }
    } else {
      player.vx += dir * 0.95 * dt;
      player.vx *= Math.pow(0.86, dt);
    }
    player.x += player.vx * dt;
    if (player.x < 10 || player.x > W - 10) { player.x = Math.max(10, Math.min(W - 10, player.x)); player.vx *= -0.4; }
    player.tilt += (player.vx * 0.07 - player.tilt) * Math.min(1, 0.3 * dt);

    const grounded = player.air <= 0 && !player.grind;
    if (grounded && Math.abs(player.vx) > 3 && Math.random() < 0.6 * dt) {
      parts.push({ x: player.x - Math.sign(player.vx) * 10, y: player.y + 8, vx: -player.vx * .3 + (Math.random() - .5), vy: Math.random() * 1.5, life: 22, max: 22, c: '#e8eef7', s: Math.random() * 2 + 1 });
    }
    if (skinById(save.skin).extra === 'flames' && !reduce && Math.random() < .7 * dt) {
      parts.push({ x: player.x + (Math.random() - .5) * 8, y: player.y - 10, vx: (Math.random() - .5) * .8, vy: -1 - Math.random() * 1.5, life: 18, max: 18, c: Math.random() < .5 ? '#ff4b2b' : '#ffb347', s: Math.random() * 3 + 1.5 });
    }
    if (boosting && Math.random() < 0.8 * dt) {
      parts.push({ x: player.x + (Math.random() - .5) * 10, y: player.y - 4, vx: (Math.random() - .5) * 1.5, vy: -Math.random() * 2, life: 26, max: 26, c: Math.random() < .5 ? '#ffb347' : '#ff7a3d', s: Math.random() * 3 + 1 });
    }

    const board = BOARDS[save.board] || BOARDS[0];
    const tr = flexItem('trail', save.style.trail) || TRAILS[0], plain = tr.id === 'classic';
    const tc = boosting ? '#ff9640' : plain ? (combo >= 5 ? boardFill(board, now) : tr.c) : tr.c === 'rainbow' ? `hsl(${(now / 5) % 360},90%,65%)` : tr.c;
    trail.push({ x: player.x, y: player.y + 8, gap: !grounded, c: tc, a: boosting || (plain && combo >= 5) ? .6 : tr.a, w: tr.w });
    if (grounded && !reduce && save.settings.fx !== 'low') {
      if (tr.spark && Math.random() < .45 * dt) parts.push({ x: player.x + (Math.random() - .5) * 10, y: player.y + 8, vx: (Math.random() - .5) * .6, vy: Math.random() * .6, life: 30, max: 30, c: tr.spark, s: Math.random() * 1.8 + .6 });
      if (tr.fire && Math.random() < .6 * dt) parts.push({ x: player.x + (Math.random() - .5) * 8, y: player.y + 9, vx: (Math.random() - .5) * .8, vy: -.4 - Math.random(), life: 20, max: 20, c: Math.random() < .5 ? '#ff4b2b' : '#ffb347', s: Math.random() * 2.5 + 1 });
    }
    for (const t of trail) t.y -= speed * dt;
    while (trail.length && trail[0].y < -10) trail.shift();

    if (combo > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }

    // spawning
    spawnT -= dt; patternCd -= dt; reserveT -= dt;
    if (spawnT <= 0) {
      if (patternCd <= 0 && rand() < .32) { spawnPattern(); patternCd = 420 / speed + 60; }
      else {
        spawnOne();
        if (dist > 300 && rand() < .4) spawnOne();
        if (dist > 1300 && rand() < .3) spawnOne();
      }
      spawnT = Math.max(70, 190 - dist / 18) / speed * (0.6 + rand() * 0.8);
    }

    // collisions
    const magR = magnetT > 0 ? 150 : 0, airNow = player.air > 0;
    for (const o of obs) {
      o.y -= speed * dt;
      if (o.kind === 'skier') { o.x += o.vx * dt; if (o.x < 14 || o.x > W - 14) o.vx *= -1; }
      if (o.hit) continue;
      const k = o.kind;
      if (magR && (k === 'coin' || k === 'lantern')) {
        const mx = player.x - o.x, my = player.y - o.y, md = Math.hypot(mx, my);
        if (md < magR && md > 1) { const pull = Math.min(md, (6 + speed) * dt); o.x += mx / md * pull; o.y += my / md * pull; }
      }
      const dx = o.x - player.x, dy = (o.y - (k === 'tree' ? o.s * 0.2 : 0)) - player.y;

      if (k === 'ramp') {
        if (!airNow && !player.grind && Math.abs(dx) < o.w / 2 && Math.abs(dy) < 12) { o.hit = true; launch(o.x, o.y, 46 + speed * 6); }
        continue;
      }
      if (k === 'rail') {
        if (!airNow && !player.grind && Math.abs(dx) < 12 && player.y > o.y && player.y < o.y + o.len - 8) {
          player.grind = o; grindPts = 0; player.vx = 0;
          tone(180, .25, 'sawtooth', .04, 80); float(player.x, player.y - 24, 'GRIND', '#e8eef7');
        }
        continue;
      }
      if (k === 'gate') {
        if (!o.passed && o.y < player.y) {
          o.passed = true;
          if (Math.abs(dx) < o.w / 2) {
            gateChain++; run.gates++; run.gateMax = Math.max(run.gateMax, gateChain);
            const pts = 30 * gateChain; addScore(pts);
            float(o.x, o.y - 10, gateChain > 1 ? `GATE x${gateChain} +${pts}` : `GATE +${pts}`, '#4aa3ff');
            tone(700 + Math.min(gateChain, 12) * 50, .1, 'triangle', .05);
          } else if (gateChain > 0) { gateChain = 0; float(o.x, o.y - 10, 'MISSED GATE', '#7b8ca6'); }
        }
        continue;
      }
      if (k === 'crevasse') {
        const ax = Math.abs(dx), over = ax < o.w / 2 - 6 && Math.abs(dy) < o.h / 2 + 2;
        if (over && !airNow && !player.grind && inv <= 0) {
          if (flareT > 0) { if (!o.bridged) { o.bridged = true; float(player.x, player.y - 30, 'FLARE BRIDGE', '#ffb347'); } }
          else if (player.shield) { useShield(); o.saved = true; float(player.x, player.y - 30, 'CAUGHT THE EDGE', '#8fd3ff'); }
          else { cause = 'crevasse'; crash(); return; }
        }
        if (!o.passed && o.y + o.h / 2 < player.y) {
          o.passed = true;
          if (airNow && ax < o.w / 2 && !o.saved) {
            run.leaps++; addScore(100);
            float(o.x, o.y - 12, run.leaps > 1 ? `LEAP x${run.leaps} +100` : 'LEAP +100', '#cdb4ff', true);
            tone(988, .1, 'triangle', .05); tone(1480, .2, 'triangle', .05, 0, .08);
          } else if (!airNow && !player.grind && ax >= o.w / 2 - 6 && ax - o.w / 2 < 16) closeCall(player.x, o.y);
        }
        continue;
      }
      if (k === 'coin' || k === 'lantern' || k === 'shield' || k === 'magnet' || k === 'dbl') {
        if (dx * dx + dy * dy < (o.s + 14) ** 2) { o.hit = true; pickup(o); }
        continue;
      }
      // solid obstacles: tree, rock, skier
      if (airNow || player.grind) continue;
      const rad = o.s * 0.5 + 6, d2 = dx * dx + dy * dy;
      if (d2 < rad * rad && inv <= 0) {
        if (flareT > 0 || player.shield) {
          o.hit = true; addScore(25); shake = Math.max(shake, 5); freeze = 3; punch = Math.max(punch, .5);
          if (flareT > 0) { run.smashes++; float(o.x, o.y - 14, 'SMASH +25', '#ff7a3d'); } else useShield();
          burst(o.x, o.y, 22, k === 'tree' ? ['#2f6b55', '#e8eef7', '#3a2a1e'] : k === 'skier' ? ['#ff4466', '#e8eef7'] : ['#56657c', '#e8eef7'], 6, 35, 3);
          noise(.15, .1);
        } else { cause = k; crash(); return; }
      } else if (!o.passed && o.y < player.y) {
        o.passed = true;
        if (Math.sqrt(d2) - rad < 16) closeCall(o.x, o.y);
      }
    }
    obs = obs.filter(o => o.y + (o.len || 0) > -70 && !(o.hit && o.kind !== 'ramp'));

    moveAmbient(dt);
    scoreEl.textContent = fmt(run.score);
    checkAch(run);
    missionTick(run, false);
    if (runMode === 'race' && race && race.ch) raceSend(dir, false);
  }

  function moveAmbient(dt) {
    if (reduce) return;
    const drift = .0004;
    for (const f of snowfall) { f.y -= (speed * 0.0015 + f.r * 0.0008) * dt; f.x += drift * dt * (f.r / 1.5); if (f.y < 0) { f.y = 1; f.x = Math.random(); } if (f.x > 1) f.x -= 1; if (f.x < 0) f.x += 1; }
    for (const g of grooves) { g.y -= speed * dt / H; if (g.y < -0.1) { g.y = 1.1; g.x = Math.random(); } }
  }

  // attract mode behind the menus
  let idleOn = false;
  function idleStart() {
    if (idleOn) return;
    idleOn = true;
    let lt = performance.now(), it = 0;
    const tick = now => {
      if (state !== 'menu' && state !== 'over') { idleOn = false; return; }
      const dt = Math.min((now - lt) / 16.67, 3); lt = now; it += dt;
      if (!reduce) {
        speed = 2.4;
        for (const o of obs) { o.y -= speed * dt; if (o.kind === 'skier') { o.x += o.vx * dt; if (o.x < 14 || o.x > W - 14) o.vx *= -1; } }
        obs = obs.filter(o => o.y + (o.len || 0) > -70 && !o.hit);
        if (obs.length < 14 && Math.random() < .05 * dt) { const r = Math.random(); add(r < .55 ? 'tree' : r < .75 ? 'rock' : r < .9 ? 'coin' : 'lantern', 20 + Math.random() * (W - 40)); }
        for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
        parts = parts.filter(p => p.life > 0);
        texts = []; toasts = [];
        player.air = 0; player.grind = null; player.spin = 0;
        player.x = W / 2 + Math.sin(it / 90) * W * .28; player.vx = Math.cos(it / 90) * 3;
        player.tilt = player.vx * .07; player.y = H * .3;
        trail.push({ x: player.x, y: player.y + 8, gap: false, c: '#8fb3d9', a: .3 });
        for (const t of trail) t.y -= speed * dt;
        while (trail.length && trail[0].y < -10) trail.shift();
        darkA += (0 - darkA) * .05; summitA += (0 - summitA) * .05; shake = 0; flash = Math.max(0, flash - dt * .04);
        moveAmbient(dt);
      }
      draw(now);
      if (!reduce) requestAnimationFrame(tick); else idleOn = false;
    };
    requestAnimationFrame(tick);
  }


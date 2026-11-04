  /* ================= drawing ================= */
  function rr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
  function zoneIcon(z, x, y, r) {
    ctx.fillStyle = z.color;
    if (z.shape === 'circle') { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
    else if (z.shape === 'square') ctx.fillRect(x - r, y - r, r * 2, r * 2);
    else if (z.shape === 'peak') {
      ctx.beginPath(); ctx.moveTo(x - r * 1.35, y + r); ctx.lineTo(x - r * .35, y - r * .35); ctx.lineTo(x - r * .05, y); ctx.lineTo(x + r * .45, y - r * 1.15); ctx.lineTo(x + r * 1.35, y + r); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x + r * .45, y - r * 1.15); ctx.lineTo(x + r * .8, y - r * .45); ctx.lineTo(x + r * .45, y - r * .6); ctx.lineTo(x + r * .15, y - r * .5); ctx.closePath(); ctx.fill();
    } else if (z.shape === 'warn') {
      ctx.beginPath(); ctx.moveTo(x, y - r * 1.2); ctx.lineTo(x + r * 1.2, y + r); ctx.lineTo(x - r * 1.2, y + r); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0a1020'; ctx.fillRect(x - r * .12, y - r * .45, r * .24, r * .8); ctx.fillRect(x - r * .12, y + r * .5, r * .24, r * .22);
    } else {
      const d = cx => { ctx.beginPath(); ctx.moveTo(cx, y - r * 1.2); ctx.lineTo(cx + r, y); ctx.lineTo(cx, y + r * 1.2); ctx.lineTo(cx - r, y); ctx.fill(); };
      if (z.shape === 'diamond') d(x); else { d(x - r * 1.1); d(x + r * 1.1); }
    }
  }
  function flag(x, y, c, side) {
    ctx.strokeStyle = '#b9c9de'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x, y - 18); ctx.stroke();
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x + 12 * side, y - 13); ctx.lineTo(x, y - 8); ctx.fill();
  }
  function glow(x, y, r, rgb, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }

  function drawFlat(o) {
    if (o.kind === 'ramp') {
      const hw = o.w / 2;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(o.x - hw + 4, o.y + 10, o.w, 6);
      ctx.fillStyle = '#c7d3e4';
      ctx.beginPath(); ctx.moveTo(o.x - hw, o.y + 10); ctx.lineTo(o.x + hw, o.y + 10); ctx.lineTo(o.x + hw - 6, o.y - 10); ctx.lineTo(o.x - hw + 6, o.y - 10); ctx.fill();
      ctx.fillStyle = '#e8eef7'; ctx.fillRect(o.x - hw + 6, o.y + 6, o.w - 12, 4);
      ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2.5;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(o.x + i * 14 - 5, o.y - 3); ctx.lineTo(o.x + i * 14, o.y + 3); ctx.lineTo(o.x + i * 14 + 5, o.y - 3); ctx.stroke(); }
    } else if (o.kind === 'rail') {
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(o.x + 4, o.y + 4); ctx.lineTo(o.x + 4, o.y + o.len + 4); ctx.stroke();
      ctx.fillStyle = '#3a4a64';
      for (let p = 10; p < o.len; p += 48) ctx.fillRect(o.x - 4, o.y + p, 8, 4);
      ctx.strokeStyle = '#a9b8cf'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x, o.y + o.len); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(o.x - 1, o.y + 2); ctx.lineTo(o.x - 1, o.y + o.len - 2); ctx.stroke();
      ctx.fillStyle = '#ffb347'; ctx.fillRect(o.x - 5, o.y + o.len - 3, 10, 3); ctx.fillRect(o.x - 5, o.y, 10, 3);
    } else if (o.kind === 'crevasse') {
      const hw = o.w / 2, hh = o.h / 2, n = o.jag.length - 1;
      const px = i => o.x - hw + (i / n) * o.w, taper = i => Math.pow(Math.sin(Math.PI * i / n), .6);
      const crack = (scale, lift) => {
        ctx.beginPath(); ctx.moveTo(px(0), o.y + o.jag[0]);
        for (let i = 1; i <= n; i++) ctx.lineTo(px(i), o.y + o.jag[i] - hh * scale * taper(i) + lift);
        for (let i = n - 1; i >= 1; i--) ctx.lineTo(px(i), o.y + o.jag[i] * .6 + hh * scale * taper(i) + lift);
        ctx.closePath();
      };
      crack(1.25, 1); ctx.fillStyle = 'rgba(205,180,255,.16)'; ctx.fill();
      crack(1, 0);
      const g = ctx.createLinearGradient(0, o.y - hh, 0, o.y + hh);
      g.addColorStop(0, '#5b7fb8'); g.addColorStop(.45, '#15233f'); g.addColorStop(1, '#03050c');
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(232,244,255,.85)'; ctx.lineWidth = 1.5; ctx.stroke();
      crack(.45, hh * .25); ctx.fillStyle = '#020309'; ctx.fill();
    } else if (o.kind === 'gate' && !o.passed) {
      ctx.strokeStyle = 'rgba(74,163,255,.25)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(o.x - o.w / 2, o.y + 8); ctx.lineTo(o.x + o.w / 2, o.y + 8); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  function drawObj(o, now) {
    const k = o.kind;
    if (k === 'tree') {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(o.x + 4, o.y + o.s * .55, o.s * .55, o.s * .16, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3a2a1e'; ctx.fillRect(o.x - 2, o.y + o.s * 0.2, 4, o.s * 0.4);
      for (let i = 0; i < 3; i++) {
        const w = o.s * (1 - i * 0.22), top = o.y - o.s * 0.9 + i * o.s * 0.35;
        ctx.fillStyle = i % 2 ? '#2a6050' : '#2f6b55';
        ctx.beginPath(); ctx.moveTo(o.x, top - o.s * 0.3); ctx.lineTo(o.x - w * 0.6, top + o.s * 0.5); ctx.lineTo(o.x + w * 0.6, top + o.s * 0.5); ctx.fill();
        ctx.fillStyle = 'rgba(232,238,247,.55)'; ctx.fillRect(o.x - w * 0.5, top + o.s * 0.45, w, 2);
      }
      ctx.fillStyle = 'rgba(232,238,247,.85)';
      ctx.beginPath(); ctx.moveTo(o.x, o.y - o.s * 1.2); ctx.lineTo(o.x - o.s * .18, o.y - o.s * .9); ctx.lineTo(o.x + o.s * .18, o.y - o.s * .9); ctx.fill();
    } else if (k === 'rock') {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(o.x + 3, o.y + o.s * .3, o.s * .7, o.s * .25, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#56657c'; ctx.beginPath(); ctx.ellipse(o.x, o.y, o.s * .7, o.s * .45, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3f4b5e'; ctx.beginPath(); ctx.ellipse(o.x + o.s * .2, o.y + o.s * .12, o.s * .35, o.s * .22, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e8eef7'; ctx.beginPath(); ctx.ellipse(o.x - 2, o.y - o.s * .22, o.s * .45, o.s * .16, 0, 0, TAU); ctx.fill();
    } else if (k === 'skier') {
      const s = Math.sign(o.vx) || 1;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(o.x + 3, o.y + 10, 12, 3, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#b9c9de'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(o.x - 12, o.y + 7 - s * 2); ctx.lineTo(o.x + 12, o.y + 7 + s * 2); ctx.moveTo(o.x - 12, o.y + 10 - s * 2); ctx.lineTo(o.x + 12, o.y + 10 + s * 2); ctx.stroke();
      ctx.fillStyle = '#ff4466'; ctx.fillRect(o.x - 4, o.y - 8, 8, 14);
      ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(o.x, o.y - 11, 4.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#7b8ca6'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(o.x - 5, o.y - 2); ctx.lineTo(o.x - 10 * s, o.y + 9); ctx.moveTo(o.x + 5, o.y - 2); ctx.lineTo(o.x + 2 * s, o.y + 10); ctx.stroke();
    } else if (k === 'gate') {
      flag(o.x - o.w / 2, o.y, '#ff4466', 1); flag(o.x + o.w / 2, o.y, '#4aa3ff', -1);
    } else if (k === 'coin') {
      glow(o.x, o.y, 14, '143,211,255', .35);
      ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(reduce ? 0 : now / 600 + o.wob);
      ctx.strokeStyle = '#e6f6ff'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-o.s, 0); ctx.lineTo(o.s, 0); ctx.stroke(); }
      ctx.restore();
    } else if (k === 'lantern' || k === 'shield') {
      const pulse = reduce ? 1 : 1 + Math.sin(now / 160 + o.wob) * .18;
      glow(o.x, o.y, o.s * 3 * pulse, k === 'lantern' ? '255,179,71' : '143,211,255', .85);
      if (k === 'lantern') { ctx.fillStyle = '#ffe0a8'; ctx.beginPath(); ctx.arc(o.x, o.y, o.s * .55, 0, TAU); ctx.fill(); }
      else { ctx.fillStyle = '#e0f4ff'; ctx.beginPath(); ctx.moveTo(o.x, o.y - 8); ctx.lineTo(o.x + 6, o.y); ctx.lineTo(o.x, o.y + 8); ctx.lineTo(o.x - 6, o.y); ctx.fill(); }
    } else if (k === 'magnet') {
      glow(o.x, o.y, 26, '255,68,102', .5);
      ctx.strokeStyle = '#ff4466'; ctx.lineWidth = 5; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.arc(o.x, o.y - 2, 7, Math.PI, 0, true); ctx.stroke();
      ctx.fillStyle = '#e8eef7'; ctx.fillRect(o.x - 9.5, o.y - 2, 5, 5); ctx.fillRect(o.x + 4.5, o.y - 2, 5, 5);
    } else if (k === 'dbl') {
      glow(o.x, o.y, 26, '255,210,74', .5);
      ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(o.x, o.y, 10, 0, TAU); ctx.fill();
      ctx.fillStyle = '#0a1020'; ctx.font = '9px "Bungee", Impact, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('2X', o.x, o.y + .5); ctx.textBaseline = 'alphabetic';
    }
  }


  // Draws the rider and board centered on the current origin. Used in game and for skin previews.
  function drawRider(c, sk, board, now) {
    const jacket = sk.jacket === 'aurora' ? `hsl(${(now / 10) % 360},85%,62%)` : sk.jacket;
    if (sk.alpha) c.globalAlpha *= sk.alpha;
    if (sk.glow) { const g = c.createRadialGradient(0, -4, 2, 0, -4, 24); g.addColorStop(0, `rgba(${sk.glow},.45)`); g.addColorStop(1, `rgba(${sk.glow},0)`); c.fillStyle = g; c.beginPath(); c.arc(0, -4, 24, 0, TAU); c.fill(); }
    if (sk.extra === 'lantern') { const g = c.createRadialGradient(0, -4, 2, 0, -4, 22); g.addColorStop(0, 'rgba(255,179,71,.55)'); g.addColorStop(1, 'rgba(255,179,71,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, -4, 22, 0, TAU); c.fill(); }
    if (sk.extra === 'cape') { c.fillStyle = '#8a1c3c'; c.beginPath(); c.moveTo(-5, -9); c.lineTo(5, -9); c.lineTo(9, 9 + Math.sin(now / 120) * 2); c.lineTo(-9, 9 - Math.sin(now / 120) * 2); c.closePath(); c.fill(); }
    c.fillStyle = boardFill(board, now); rr(c, -15, 5, 30, 6, 3); c.fill();
    c.fillStyle = 'rgba(10,16,32,.35)'; c.fillRect(-15, 8, 30, 1);
    c.fillStyle = jacket; c.fillRect(-5, -10, 10, 16);
    if (sk.rim) { c.strokeStyle = 'rgba(232,238,247,.55)'; c.lineWidth = .9; c.strokeRect(-5, -10, 10, 16); c.beginPath(); c.arc(0, -14, 5, 0, TAU); c.stroke(); }
    c.fillStyle = sk.stripe;
    if (sk.pattern === 'stripes') { c.fillRect(-5, -7, 10, 2); c.fillRect(-5, -2, 10, 2); c.fillRect(-5, 3, 10, 2); }
    else if (sk.pattern === 'buttons') { c.beginPath(); c.arc(0, -6, 1.2, 0, TAU); c.arc(0, -2, 1.2, 0, TAU); c.arc(0, 2, 1.2, 0, TAU); c.fill(); }
    else c.fillRect(-5, -4, 10, 3);
    if (sk.extra === 'medal') { c.fillStyle = '#4aa3ff'; c.fillRect(-1, -10, 2, 5); c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(0, -4, 2.4, 0, TAU); c.fill(); }
    if (sk.extra === 'bowtie') { c.fillStyle = '#ff4466'; c.beginPath(); c.moveTo(0, -9); c.lineTo(-3.5, -11); c.lineTo(-3.5, -7); c.closePath(); c.moveTo(0, -9); c.lineTo(3.5, -11); c.lineTo(3.5, -7); c.closePath(); c.fill(); }
    if (sk.extra === 'scarf') { c.fillStyle = sk.scarf; c.fillRect(-5.5, -11, 11, 3); c.save(); c.translate(4, -10); c.rotate(-.5 + Math.sin(now / 140) * .25); c.fillRect(0, 0, 7, 2.5); c.restore(); }
    if (sk.extra === 'lantern') { c.fillStyle = '#3a2a1e'; c.fillRect(5, -7, 1, 4); c.fillStyle = '#ffe0a8'; c.fillRect(4, -4, 3.5, 4); }
    c.fillStyle = sk.helmet; c.beginPath(); c.arc(0, -14, 5, 0, TAU); c.fill();
    c.fillStyle = sk.goggle; c.fillRect(-4, -16, 8, 3);
    if (sk.glowEyes) { c.fillStyle = 'rgba(255,68,102,.5)'; c.fillRect(-5, -17, 10, 5); c.fillStyle = sk.goggle; c.fillRect(-4, -16, 8, 3); }
    if (sk.nose) { c.fillStyle = '#ff7a3d'; c.beginPath(); c.moveTo(1, -13); c.lineTo(6, -12); c.lineTo(1, -11); c.closePath(); c.fill(); }
    if (sk.extra === 'beanie') { c.fillStyle = sk.hat; c.beginPath(); c.arc(0, -15, 5.4, Math.PI, 0); c.fill(); c.fillRect(-5.4, -16, 10.8, 2); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, -21, 2, 0, TAU); c.fill(); }
    if (sk.extra === 'tophat') { c.fillStyle = '#1a1f2b'; c.fillRect(-6.5, -19.5, 13, 2); c.fillRect(-4, -27, 8, 8); c.fillStyle = '#ff4466'; c.fillRect(-4, -21.5, 8, 1.5); }
    if (sk.extra === 'crown') { c.fillStyle = '#ffd24a'; c.beginPath(); c.moveTo(-5, -18); c.lineTo(-5, -23); c.lineTo(-2.5, -20.5); c.lineTo(0, -24.5); c.lineTo(2.5, -20.5); c.lineTo(5, -23); c.lineTo(5, -18); c.closePath(); c.fill(); c.fillStyle = '#ff4466'; c.beginPath(); c.arc(0, -20, 1, 0, TAU); c.fill(); }
    if (sk.halo) { c.strokeStyle = 'rgba(255,224,130,.9)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, -28, 6, 2, 0, 0, TAU); c.stroke(); }
  }
  const skinPreviews = {};
  function skinPreview(sk, bi = save.board) {
    const key = sk.id + ':' + bi;
    if (skinPreviews[key] !== undefined) return skinPreviews[key];
    let url = '';
    try {
      const c = document.createElement('canvas'); c.width = 96; c.height = 96;
      const x = c.getContext('2d'); x.translate(48, 60); x.scale(2.2, 2.2);
      drawRider(x, sk, BOARDS[bi] || BOARDS[0], 0);
      url = c.toDataURL('image/png');
    } catch (e) {}
    return (skinPreviews[key] = url || '');
  }
  function drawPlayer(now) {
    const board = BOARDS[save.board] || BOARDS[0];
    const prog = player.air > 0 ? 1 - player.air / player.airMax : 0;
    const z = player.air > 0 ? Math.sin(Math.PI * prog) * (14 + player.airMax * .2) : player.grind ? 5 : 0;
    const sc = 1 + z / 55, py = player.y - z;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(player.x + 3 + z * .3, player.y + 11, 15 / sc, 4 / sc, 0, 0, TAU); ctx.fill();
    if (flareT > 0) {
      const r = 22 + Math.sin(now / 60) * 3;
      const sg = ctx.createRadialGradient(player.x, py, 4, player.x, py, r);
      sg.addColorStop(0, 'rgba(255,179,71,0)'); sg.addColorStop(.7, 'rgba(255,140,60,.35)'); sg.addColorStop(1, 'rgba(255,140,60,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(player.x, py, r, 0, TAU); ctx.fill();
    }
    if (magnetT > 0) {
      ctx.strokeStyle = `rgba(255,68,102,${.15 + Math.sin(now / 120) * .08})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(player.x, player.y, 150, 0, TAU); ctx.stroke();
    }
    if (player.shield) {
      ctx.strokeStyle = `rgba(143,211,255,${.5 + Math.sin(now / 150) * .2})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(player.x, py - 2, 20 * sc, 0, TAU); ctx.stroke();
    }
    ctx.save(); ctx.translate(player.x, py); ctx.rotate(player.tilt + player.spin); ctx.scale(sc, sc);
    if (inv > 0 && Math.floor(now / 80) % 2) ctx.globalAlpha = .4;
    drawRider(ctx, skinById(save.skin), board, now);
    ctx.restore(); ctx.globalAlpha = 1;
    if (player.air > 0) {
      const a = ((player.spin % TAU) + TAU) % TAU, off = Math.min(a, TAU - a);
      ctx.font = '10px "DM Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = off < landTol() ? '#5cf2b0' : '#ff4466';
      ctx.fillText(Math.round(Math.abs(player.spin) / TAU * 36) * 10 + '°', player.x, py - 30 * sc);
    }
  }

  function drawDark() {
    if (darkA < .01) return;
    fctx.globalCompositeOperation = 'source-over';
    fctx.clearRect(0, 0, W, H);
    fctx.fillStyle = `rgba(3,5,12,${darkA})`; fctx.fillRect(0, 0, W, H);
    fctx.globalCompositeOperation = 'destination-out';
    const light = (x, y, r, a) => {
      const g = fctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      fctx.fillStyle = g; fctx.beginPath(); fctx.arc(x, y, r, 0, TAU); fctx.fill();
    };
    if (player && state !== 'crash') {
      light(player.x, player.y, 64, 1);
      fctx.save(); fctx.translate(player.x, player.y); fctx.rotate(-player.tilt * .8);
      const g = fctx.createLinearGradient(0, 0, 0, H * .62);
      g.addColorStop(0, 'rgba(0,0,0,.95)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      fctx.fillStyle = g; fctx.beginPath(); fctx.moveTo(-10, 4); fctx.lineTo(-W * .3, H * .62); fctx.lineTo(W * .3, H * .62); fctx.lineTo(10, 4); fctx.closePath(); fctx.fill();
      fctx.restore();
      if (flareT > 0) light(player.x, player.y, 230, 1);
    }
    for (const o of obs) {
      if (o.hit) continue;
      if (o.kind === 'lantern') light(o.x, o.y, 80, .95);
      else if (o.kind === 'coin' || o.kind === 'shield' || o.kind === 'magnet' || o.kind === 'dbl') light(o.x, o.y, 26, .8);
    }
    fctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(fog, 0, 0, W, H);
  }

  function draw(now) {
    const t = (now - t0) / 1000;
    const playing = state === 'run' || state === 'crash';
    ctx.save();
    if (punch > 0 && !reduce && save.settings.shake) { const z = 1 + punch * .05; ctx.translate(W / 2, H * .35); ctx.scale(z, z); ctx.translate(-W / 2, -H * .35); }
    if (shake > 0 && !reduce && save.settings.shake) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#121c34'); g.addColorStop(1, '#0a1020');
    ctx.fillStyle = g; ctx.fillRect(-40, -40, W + 80, H + 80);

    ctx.globalCompositeOperation = 'lighter';
    const hues = ['92,242,176', '120,140,255', '92,242,176'];
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const base = H * (0.12 + i * 0.07);
      ctx.moveTo(-20, base);
      for (let x = -20; x <= W + 20; x += 20) ctx.lineTo(x, base + Math.sin(x * 0.012 + t * (0.4 + i * .2) + i) * (22 + summitA * 16));
      ctx.lineTo(W + 20, -40); ctx.lineTo(-20, -40); ctx.closePath();
      ctx.fillStyle = `rgba(${hues[i]},${[.05, .04, .03][i] * (1 + summitA * 2.6)})`; ctx.fill();
    }
    // at the Summit the aurora blazes, with a magenta band on top
    if (summitA > .02) {
      ctx.beginPath(); const base = H * .24; ctx.moveTo(-20, base);
      for (let x = -20; x <= W + 20; x += 20) ctx.lineTo(x, base + Math.sin(x * .009 - t * .5) * 30 + Math.sin(x * .03 + t) * 6);
      ctx.lineTo(W + 20, -40); ctx.lineTo(-20, -40); ctx.closePath();
      ctx.fillStyle = `rgba(255,92,240,${.06 * summitA})`; ctx.fill();
    }
    // shooting stars streak through the aurora now and then
    if (!reduce) {
      if (!shooter && Math.random() < .004) {
        const dir = Math.random() < .5 ? -1 : 1;
        shooter = { x: dir > 0 ? Math.random() * W * .5 : W * .5 + Math.random() * W * .5, y: Math.random() * H * .18, vx: dir * (6 + Math.random() * 4), vy: 1.5 + Math.random() * 1.5, life: 40 };
      }
      if (shooter) {
        const s = shooter, a = Math.min(1, s.life / 15);
        const sg = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 8, s.y - s.vy * 8);
        sg.addColorStop(0, `rgba(255,255,255,${.9 * a})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = sg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 8, s.y - s.vy * 8); ctx.stroke();
        s.x += s.vx; s.y += s.vy; s.life -= 1;
        if (s.life <= 0 || s.x < -60 || s.x > W + 60) shooter = null;
      }
    }
    ctx.globalCompositeOperation = 'source-over';

    ctx.strokeStyle = 'rgba(143,179,217,.07)'; ctx.lineWidth = 1;
    for (const gr of grooves) { ctx.beginPath(); ctx.moveTo(gr.x * W, gr.y * H); ctx.lineTo(gr.x * W, gr.y * H + gr.l * (speed / 4)); ctx.stroke(); }
    if (playing && speed > 7 && !reduce) {
      ctx.strokeStyle = `rgba(232,238,247,${Math.min(.16, (speed - 7) * .04)})`;
      for (let i = 0; i < 8; i++) { const x = (i * 97 + t * 400) % W, y = (i * 131 + t * speed * 120) % H; ctx.beginPath(); ctx.moveTo(x, H - y); ctx.lineTo(x, H - y - 40); ctx.stroke(); }
    }

    for (const o of obs) drawFlat(o);

    ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1], b = trail[i];
      if (b.gap || a.gap) continue;
      ctx.globalAlpha = b.a; ctx.strokeStyle = b.c; ctx.lineWidth = b.w || 2.5;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const o of obs) drawObj(o, now);

    for (const p of parts) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.c; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
    ctx.globalAlpha = 1;

    if (playing) { drawGhost(now); drawRival(now); }
    if (player && state !== 'crash') drawPlayer(now);

    ctx.fillStyle = 'rgba(232,238,247,.5)';
    for (let i = 0, n = save.settings.fx === 'low' ? 30 : snowfall.length; i < n; i++) { const f = snowfall[i]; ctx.beginPath(); ctx.arc(f.x * W, f.y * H, f.r, 0, TAU); ctx.fill(); }

    ctx.restore();
    drawDark();

    ctx.textAlign = 'center';
    for (const tx of texts) {
      ctx.font = (tx.big ? '18px' : '13px') + ' "Bungee", Impact, sans-serif';
      ctx.globalAlpha = Math.min(1, tx.life / 20); ctx.fillStyle = tx.c; ctx.fillText(tx.text, tx.x, tx.y);
    }
    ctx.globalAlpha = 1;

    if (flash > 0) { ctx.fillStyle = `rgba(255,224,168,${flash * .35})`; ctx.fillRect(0, 0, W, H); }

    if (playing) drawHUD(now);
  }

  function bar(x, y, w, frac, col, label) {
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(x - w, y, w, 4);
    ctx.fillStyle = col; ctx.fillRect(x - w, y, w * Math.max(0, Math.min(1, frac)), 4);
    ctx.font = '9px "DM Mono", monospace'; ctx.textAlign = 'right'; ctx.fillText(label, x - w - 6, y + 5);
  }

  let shooter = null;

  // Translucent rider replaying your best run; an X marks where it wiped out.
  function drawGhost(now) {
    if (!gh.on || !player) return;
    const gy = player.y + (gh.d - dist) * 10, rgb = gh.name ? '127,232,255' : '180,140,255';
    if (gy < -30 || gy > H + 30) return;
    if (gh.done) {
      ctx.strokeStyle = `rgba(${rgb},.7)`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(gh.x - 7, gy - 7); ctx.lineTo(gh.x + 7, gy + 7); ctx.moveTo(gh.x + 7, gy - 7); ctx.lineTo(gh.x - 7, gy + 7); ctx.stroke();
      ctx.font = '9px "Bungee", Impact, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(${rgb},.85)`;
      ctx.fillText(gh.name ? gh.name.toUpperCase() + ' CRASHED HERE' : 'BEST RUN ENDED', gh.x, gy - 14);
      return;
    }
    ctx.save(); ctx.globalAlpha = .38 + Math.sin(now / 200) * .06; ctx.translate(gh.x, gy);
    ctx.fillStyle = `rgb(${rgb})`; rr(ctx, -15, 5, 30, 6, 3); ctx.fill();
    ctx.fillRect(-5, -10, 10, 16);
    ctx.beginPath(); ctx.arc(0, -14, 5, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.font = '9px "Bungee", Impact, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(${rgb},.8)`;
    ctx.fillText(gh.name ? gh.name.toUpperCase() : 'GHOST', gh.x, gy - 24);
  }
  // ---------- live race rival, kept smooth ----------
  // Every update carries the rider's position, speed, steering and jump, stamped with their clock. This device runs
  // the same physics forward from it, so the rival moves every frame instead of hopping between updates, and it sits
  // where they are right now rather than where they were when the update left. When a new update shows the guess
  // was off, the difference fades out over a few frames instead of snapping.
  function baseSpeed(d) { return 3.4 + 7 * (1 - Math.exp(-(d < 800 ? d : 800 + (d - 800) * .75) / 1200)); }
  function rivalStep(S, n) {
    const w = S.w;
    for (let i = 0; i < 40 && n > 0; i++) {
      const dt = Math.min(1, n); n -= dt;
      if (S.c) return; // crashed: they stay put
      S.d += baseSpeed(S.d) * (S.fb > 0 ? 1.6 : 1) * dt * 0.1;
      S.fb = Math.max(0, S.fb - dt);
      if (S.g) S.vx = 0;
      else if (S.a > 0) { S.sp += S.dr * 0.19 * dt; S.vx *= Math.pow(0.99, dt); S.a -= dt; if (S.a <= 0) { S.a = 0; S.sp = 0; } }
      else { S.vx += S.dr * 0.95 * dt; S.vx *= Math.pow(0.86, dt); }
      S.x += S.vx * dt;
      if (S.x < 10 || S.x > w - 10) { S.x = Math.max(10, Math.min(w - 10, S.x)); S.vx *= -0.4; }
    }
  }
  // Their clock minus ours. Round trips give the best answer; until the first one, the quickest update so far stands in.
  function raceClock(R, t, now) {
    if (R.clk) return R.clk.off;
    const o = t - now; R.offGuess = R.offGuess == null ? o : Math.max(R.offGuess, o);
    return R.offGuess;
  }
  function rivalTake(R, p, now) {
    const w = Math.max(200, Math.min(5000, +p.w || 1000)), num = (v, d) => Number.isFinite(+v) ? +v : d;
    const T = { x: Math.max(0, Math.min(1000, num(p.x, 500))) / 1000 * w, vx: num(p.vx, 0), d: Math.max(0, num(p.d, 0)), dr: Math.max(-1, Math.min(1, num(p.dr, 0))),
      a: Math.max(0, num(p.a, 0)), am: Math.max(1, num(p.am, 1)), sp: num(p.sp, 0), g: p.g ? 1 : 0, fb: Math.max(0, num(p.fb, 0)), c: p.c ? 1 : 0, w };
    // how long ago they sent it, in frames, so the guess lands on where they are now
    const age = p.t != null && Number.isFinite(+p.t) ? Math.max(0, Math.min(18, (now + raceClock(R, +p.t, now) - p.t) / (1000 / 60))) : 0;
    rivalStep(T, age);
    const S = R.sim;
    if (!S) { R.sim = Object.assign(T, { ex: 0, ed: 0, tilt: T.vx * .07, seen: now, last: now }); return; }
    const k = w / S.w; // their screen changed size (a phone turned sideways)
    S.ex = (S.x + S.ex) * k - T.x; S.ed += S.d - T.d;
    Object.assign(S, T);
    if (Math.abs(S.ex) > w * .3 || Math.abs(S.ed) > 25) { S.ex = 0; S.ed = 0; } // a big jump (second chance, lost connection): snap
    S.seen = now;
  }
  // Up to 8 updates a second while you're close, 3 when you're far apart, plus one right away whenever you
  // change direction, jump, land, grind, Flare or crash. Two riders stay well under Supabase's free message limit.
  let raceSent = null;
  function raceSend(dir, force) {
    const R = race; if (!R || !R.ch || !player) return;
    const now = performance.now(), L = raceSent, c = state === 'crash' ? 1 : 0, air = player.air > 0 ? 1 : 0, g = player.grind ? 1 : 0, fb = flareT > 0 ? 1 : 0;
    const near = !R.oppPos || !!R.oppDone || Math.abs(R.oppPos.d - dist) < 90;
    if (!force && L) {
      const since = now - L.at, changed = Math.abs(dir - L.dir) > .3 || air !== L.air || g !== L.g || fb !== L.fb || c !== L.c;
      if (since < (near ? 120 : 340) && !(changed && near && since >= 60)) return;
    }
    raceSent = { at: now, dir, air, g, fb, c };
    R.ch.send('pos', { t: Math.round(now * 10) / 10, d: Math.round(dist * 100) / 100, x: Math.round(player.x / W * 10000) / 10, w: Math.round(W),
      vx: Math.round(player.vx * 1000) / 1000, dr: Math.round(dir * 100) / 100, a: Math.round(player.air * 10) / 10, am: Math.round(player.airMax * 10) / 10,
      sp: Math.round(player.spin * 1000) / 1000, g, fb: Math.round(flareT), c, s: Math.floor(run.score), z: zoneIdx });
  }
  // Your friend in a live race, drawn with their own skin, leaning, jumping and spinning like they are.
  function drawRival(now) {
    if (runMode !== 'race' || !race || !race.oppPos || !player) return;
    const R = race, o = R.opp, t = performance.now();
    let S = R.sim;
    if (!S) { rivalTake(R, Object.assign({}, R.oppPos, { t: null }), t); S = R.sim; }
    const f = Math.min(6, Math.max(0, (t - (S.last || t)) / (1000 / 60))); S.last = t;
    if (t - S.seen > 350) S.dr = 0;       // no word for a moment: stop guessing at their steering
    if (t - S.seen < 3000) rivalStep(S, f); // no word for 3 seconds: hold them where they were
    // fade any correction out over a few frames, never faster than about 6 px a frame, so the rival never jerks
    const fade = 1 - Math.pow(.82, f), cx = S.ex * fade, cd = S.ed * fade;
    S.ex -= Math.sign(cx) * Math.min(Math.abs(cx), 6 * f); S.ed -= Math.sign(cd) * Math.min(Math.abs(cd), .6 * f);
    S.tilt += (S.vx * 0.07 - S.tilt) * Math.min(1, 0.3 * f);
    const d = R.oppDone ? R.oppDone.d : S.d + S.ed, x = Math.max(10, Math.min(W - 10, (S.x + S.ex) / S.w * W));
    R.ox = x; R.od = d;
    const y = player.y + (d - dist) * 10, c = flexItem('color', o.color), col = c && c.c !== 'rainbow' ? c.c : '#ffd24a';
    if (y < -30 || y > H + 30) return;
    if (race.oppDone) {
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 7, y - 7); ctx.lineTo(x + 7, y + 7); ctx.moveTo(x + 7, y - 7); ctx.lineTo(x - 7, y + 7); ctx.stroke();
      ctx.font = '9px "Bungee", Impact, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText(o.name.toUpperCase() + ' IS OUT', x, y - 14);
      return;
    }
    const prog = S.a > 0 ? 1 - S.a / S.am : 0, z = S.a > 0 ? Math.sin(Math.PI * prog) * (14 + S.am * .2) : S.g ? 5 : 0, sc = 1 + z / 55, py = y - z;
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x + 3 + z * .3, y + 11, 15 / sc, 4 / sc, 0, 0, TAU); ctx.fill();
    if (S.fb > 0) {
      const r = 22 + Math.sin(now / 60) * 3, sg = ctx.createRadialGradient(x, py, 4, x, py, r);
      sg.addColorStop(0, 'rgba(255,179,71,0)'); sg.addColorStop(.7, 'rgba(255,140,60,.3)'); sg.addColorStop(1, 'rgba(255,140,60,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x, py, r, 0, TAU); ctx.fill();
    }
    ctx.save(); ctx.globalAlpha = .85; ctx.translate(x, py); ctx.rotate(S.tilt + S.sp); ctx.scale(sc, sc); drawRider(ctx, skinById(o.skin), BOARDS[o.board || 0] || BOARDS[0], now); ctx.restore(); ctx.globalAlpha = 1;
    ctx.font = '10px "Bungee", Impact, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText(o.name.toUpperCase(), x, py - 26 * sc);
  }

  function drawAchCard(tt) {
    const a = tt.a, tier = TIERS[a.tier], age = tt.max - tt.life;
    const slide = reduce ? 1 : Math.min(1, age / 14), fade = Math.min(1, tt.life / 20);
    const w = Math.min(W - 24, 320), h = 58, x = W / 2 - w / 2, y = 62 - (1 - slide) * 90;
    ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(10,16,32,.94)'; rr(ctx, x, y, w, h, 8); ctx.fill();
    ctx.strokeStyle = tier.c; ctx.lineWidth = 1.5; ctx.stroke();
    if (!reduce && age < 40) { const sw = (age / 40) * (w + 80) - 40; const sh = ctx.createLinearGradient(x + sw - 40, 0, x + sw + 40, 0); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.5, 'rgba(255,255,255,.12)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sh; rr(ctx, x, y, w, h, 8); ctx.fill(); }
    const mx = x + 30, my = y + h / 2;
    glow(mx, my, 26, a.tier === 'g' ? '255,210,74' : a.tier === 's' ? '201,214,232' : '208,138,78', .45);
    ctx.fillStyle = tier.c; ctx.beginPath(); ctx.arc(mx, my, 15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0a1020'; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.6 : 8.5, an = -Math.PI / 2 + i * Math.PI / 5; ctx[i ? 'lineTo' : 'moveTo'](mx + Math.cos(an) * r, my + Math.sin(an) * r); }
    ctx.closePath(); ctx.fill();
    ctx.textAlign = 'left';
    ctx.font = '9px "DM Mono", monospace'; ctx.fillStyle = tier.c; ctx.fillText(`${tier.n.toUpperCase()} ACHIEVEMENT`, x + 54, y + 19);
    ctx.font = Math.round(Math.min(15, w / 20)) + 'px "Bungee", Impact, sans-serif'; ctx.fillStyle = '#e8eef7'; ctx.fillText(a.n.toUpperCase(), x + 54, y + 37);
    ctx.font = '10px "DM Mono", monospace'; ctx.fillStyle = '#8fd3ff'; ctx.fillText(`+${tier.r} flakes`, x + 54, y + 51);
    ctx.globalAlpha = 1;
  }

  function drawHUD(now) {
    const zz = ZONES[zoneIdx];
    zoneIcon(zz, 20, 22, 6);
    ctx.textAlign = 'left'; ctx.font = '11px "DM Mono", monospace'; ctx.fillStyle = '#b9c9de';
    ctx.fillText(zz.name.toUpperCase() + ' · ' + Math.floor(dist) + ' M', 36, 26);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.arc(W - 20 - i * 18, 22, 6, 0, TAU);
      ctx.fillStyle = i < lanternsHeld ? '#ffb347' : 'rgba(255,179,71,.15)'; ctx.fill();
    }
    let ry = 40;
    if (boostOn.revive && save.kit.revive && !run.revived && state === 'run') { ctx.textAlign = 'right'; ctx.fillStyle = '#7fe8ff'; ctx.font = '10px "DM Mono", monospace'; ctx.fillText('2ND CHANCE READY', W - 12, ry + 6); ry += 13; }
    if (lanternsHeld === 3 && flareT <= 0 && state === 'run') { ctx.textAlign = 'right'; ctx.fillStyle = '#ffb347'; ctx.font = '11px "DM Mono", monospace'; ctx.fillText(keyFor('flare').toUpperCase() + ': FLARE', W - 12, ry + 6); ry += 14; }
    if (flareT > 0) { bar(W - 12, ry, 54, flareT / flareDur(), '#ffb347', 'FLARE'); ry += 12; }
    if (magnetT > 0) { bar(W - 12, ry, 54, magnetT / magnetDur(), '#ff6680', 'MAGNET'); ry += 12; }
    if (dblT > 0) { bar(W - 12, ry, 54, dblT / 420, '#ffd24a', '2X'); ry += 12; }

    let hy = 52;
    if (combo > 1) {
      ctx.textAlign = 'left'; ctx.font = '16px "Bungee", Impact, sans-serif'; ctx.fillStyle = combo >= 10 ? '#ffd24a' : '#5cf2b0';
      ctx.fillText('COMBO x' + combo, 14, hy);
      ctx.fillStyle = 'rgba(92,242,176,.25)'; ctx.fillRect(14, hy + 6, 80, 3);
      ctx.fillStyle = combo >= 10 ? '#ffd24a' : '#5cf2b0'; ctx.fillRect(14, hy + 6, 80 * comboT / comboWin(), 3);
      hy += 26;
    }
    if (gateChain > 1) { ctx.textAlign = 'left'; ctx.font = '12px "Bungee", Impact, sans-serif'; ctx.fillStyle = '#4aa3ff'; ctx.fillText('GATES x' + gateChain, 14, hy); hy += 18; }
    if (player.grind) { ctx.textAlign = 'left'; ctx.font = '12px "Bungee", Impact, sans-serif'; ctx.fillStyle = '#e8eef7'; ctx.fillText('GRINDING ' + Math.floor(grindPts), 14, hy); }

    if (gh.on && state === 'run') {
      const gap = Math.round(gh.d - dist), gy = player.y + (gh.d - dist) * 10;
      ctx.font = '10px "Bungee", Impact, sans-serif'; ctx.textAlign = 'center';
      if (gy > H + 30) {
        const x = Math.max(80, Math.min(W - 110, gh.x));
        ctx.fillStyle = 'rgba(180,140,255,.85)';
        ctx.beginPath(); ctx.moveTo(x, H - 18); ctx.lineTo(x - 7, H - 28); ctx.lineTo(x + 7, H - 28); ctx.fill();
        ctx.fillText(`${gh.name ? gh.name.toUpperCase() + "'S GHOST" : 'GHOST'} ${gap} M AHEAD`, x, H - 34);
      } else if (gy < -30 && !gh.done) {
        ctx.fillStyle = 'rgba(180,140,255,.75)'; ctx.fillText(`${-gap} M AHEAD OF ${gh.name ? gh.name.toUpperCase() + "'S GHOST" : 'YOUR GHOST'}`, W / 2, H * .12 + 34);
      }
    }
    if (runMode === 'race' && race && state === 'run') {
      const o = race.opp, byDist = race.kind === 'distance', u = byDist ? ' M' : '', src = race.oppDone || race.oppPos;
      const theirs = src ? (byDist ? Math.floor(race.oppDone ? src.d : race.od != null ? race.od : src.d) : src.s) : 0, lead = (byDist ? Math.floor(dist) : Math.floor(run.score)) - theirs;
      ctx.textAlign = 'left'; ctx.font = '11px "Bungee", Impact, sans-serif';
      ctx.fillStyle = '#ffd24a'; ctx.fillText(`VS ${o.name.toUpperCase()} ${fmt(theirs)}${u}${race.oppDone ? ' (OUT)' : ''}`, 14, hy);
      ctx.font = '10px "DM Mono", monospace'; ctx.fillStyle = lead >= 0 ? '#5cf2b0' : '#ff6680'; ctx.fillText(lead >= 0 ? `YOU LEAD BY ${fmt(lead)}${u}` : `BEHIND BY ${fmt(-lead)}${u}`, 14, hy + 14);
      hy += 32;
      if (race.oppPos && !race.oppDone) {
        const gap = Math.round((race.od != null ? race.od : race.oppPos.d) - dist), ry2 = player.y + gap * 10;
        ctx.font = '10px "Bungee", Impact, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd24a';
        if (ry2 > H + 30) { const x = Math.max(80, Math.min(W - 110, race.ox || W / 2)); ctx.beginPath(); ctx.moveTo(x, H - 18); ctx.lineTo(x - 7, H - 28); ctx.lineTo(x + 7, H - 28); ctx.fill(); ctx.fillText(`${o.name.toUpperCase()} ${gap} M AHEAD`, x, H - 34); }
        else if (ry2 < -30) ctx.fillText(`${-gap} M AHEAD OF ${o.name.toUpperCase()}`, W / 2, H * .12 + 48);
      }
    }
    if (bannerT > 0 && state === 'run') {
      const a = Math.min(1, bannerT / 30, (140 - bannerT) / 15 + .2);
      ctx.globalAlpha = a; ctx.textAlign = 'center';
      zoneIcon(zz, W / 2, H * .58 - 34, 12);
      ctx.font = Math.round(Math.min(30, W / 14)) + 'px "Bungee", Impact, sans-serif';
      ctx.fillStyle = zz.color; ctx.fillText(zz.name.toUpperCase(), W / 2, H * .58);
      ctx.globalAlpha = 1;
    }
    const achT = toasts[0] && toasts[0].kind === 'ach' ? toasts[0] : null;
    if (stick && state === 'run') {
      const dx = Math.max(-STICK_R, Math.min(STICK_R, stick.x - stick.ox));
      ctx.globalAlpha = .22; ctx.strokeStyle = '#e8eef7'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(stick.ox - STICK_R, stick.y); ctx.lineTo(stick.ox + STICK_R, stick.y); ctx.stroke();
      ctx.globalAlpha = .5; ctx.fillStyle = '#e8eef7'; ctx.beginPath(); ctx.arc(stick.ox + dx, stick.y, 9, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (achT) drawAchCard(achT);
    toasts.filter(tt => tt.kind !== 'ach').slice(0, 2).forEach((tt, i) => {
      ctx.globalAlpha = i === 0 && !achT ? Math.min(1, tt.life / 25) : .55;
      ctx.font = Math.round(Math.min(12, W / 34)) + 'px "Bungee", Impact, sans-serif'; ctx.textAlign = 'center';
      const w = Math.min(W - 24, ctx.measureText(tt.text).width + 24), y = H - 74 - i * 32;
      ctx.fillStyle = 'rgba(10,16,32,.88)'; rr(ctx, W / 2 - w / 2, y - 17, w, 25, 4); ctx.fill();
      ctx.strokeStyle = tt.c; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = tt.c; ctx.fillText(tt.text, W / 2, y);
      ctx.globalAlpha = 1;
    });
  }


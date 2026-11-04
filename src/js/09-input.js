  /* ================= input ================= */
  const keys = { l: false, r: false };
  let touchDir = 0;
  let capturing = null; // { act, slot } while a key box in Settings waits for a key
  const codeOf = e => e.code || ({ ' ': 'Space', Shift: 'ShiftLeft', Escape: 'Escape', Enter: 'Enter' }[e.key]
    || (/^Arrow/.test(e.key) ? e.key : e.key && e.key.length === 1 && /[a-z]/i.test(e.key) ? 'Key' + e.key.toUpperCase() : e.key && /^\d$/.test(e.key) ? 'Digit' + e.key : e.key || ''));
  const bound = (act, c) => !!c && save.settings.keys[act].includes(c);
  addEventListener('keydown', e => {
    const c = codeOf(e);
    if (capturing) {
      e.preventDefault();
      if (c !== 'Escape' && c) {
        for (const [a] of KEY_ACTIONS) save.settings.keys[a] = save.settings.keys[a].map(k => k === c ? '' : k);
        save.settings.keys[capturing.act][capturing.slot] = c;
        persist(); tone(988, .06, 'triangle', .04); checkAch(blankStats());
      }
      capturing = null; renderPanel();
      return;
    }
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || '')) return;
    if (bound('left', c) || bound('right', c)) touchUsed = false;
    if (bound('left', c)) keys.l = true;
    if (bound('right', c)) keys.r = true;
    if (state === 'run') {
      if (['left', 'right', 'flare', 'pause', 'restart'].some(a => bound(a, c))) e.preventDefault();
      if (bound('flare', c)) fireFlare();
      if (bound('pause', c)) pause();
      else if (bound('restart', c)) restartRun();
      return;
    }
    if (state === 'paused' && view !== 'settings') {
      if (bound('restart', c)) { e.preventDefault(); restartRun(); return; }
      if (bound('pause', c)) { e.preventDefault(); resume(); return; }
    }
    const onButton = e.target && e.target.tagName === 'BUTTON';
    if (state === 'over' && bound('restart', c) && !onButton && view === 'home') { e.preventDefault(); start(); return; }
    if (c === 'Enter' && !onButton) {
      if (state === 'menu' || state === 'over') { e.preventDefault(); start(); }
      else if (state === 'paused') { e.preventDefault(); resume(); }
    }
  });
  addEventListener('keyup', e => {
    const c = codeOf(e);
    if (bound('left', c)) keys.l = false;
    if (bound('right', c)) keys.r = false;
  });
  // Phone steering. "Drag" (the default): put a finger down anywhere and slide. How far you slide sets how hard you
  // turn, and the center follows your finger if you slide past the edge, so you never have to cross back.
  // "Sides": hold the left or right half of the screen, the original controls.
  const STICK_R = 38;
  let stick = null, touchUsed = false;
  addEventListener('blur', () => { keys.l = keys.r = false; touchDir = 0; stick = null; });
  const localX = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width || W }; };
  cv.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') touchUsed = true;
    const p = localX(e);
    if (save.settings.steer === 'sides') { touchDir = p.x < p.w / 2 ? -1 : 1; stick = null; }
    else { stick = { id: e.pointerId, ox: p.x, x: p.x, y: p.y }; touchDir = 0; }
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  });
  cv.addEventListener('pointermove', e => {
    const p = localX(e);
    if (save.settings.steer === 'sides') { if (touchDir) touchDir = p.x < p.w / 2 ? -1 : 1; return; }
    if (!stick || e.pointerId !== stick.id) return;
    let dx = p.x - stick.ox;
    if (dx > STICK_R) { stick.ox = p.x - STICK_R; dx = STICK_R; } else if (dx < -STICK_R) { stick.ox = p.x + STICK_R; dx = -STICK_R; }
    stick.x = p.x;
    touchDir = Math.abs(dx) < 4 ? 0 : Math.max(-1, Math.min(1, (dx - Math.sign(dx) * 4) / (STICK_R - 4)));
  });
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, e => { if (stick && e && e.pointerId !== undefined && e.pointerId !== stick.id) return; stick = null; touchDir = 0; }));
  const buzz = ms => { try { if (touchUsed && save.settings.shake && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
  boostBtn.addEventListener('pointerdown', e => { e.preventDefault(); fireFlare(); });
  pauseBtn.addEventListener('click', () => pause());


  /* ================= audio ================= */
  let ac = null, sfxBus = null, musBus = null, noiseBuf = null;
  function initAudio() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      sfxBus = ac.createGain(); sfxBus.gain.value = save.settings.sfx / 100; sfxBus.connect(ac.destination);
      musBus = ac.createGain(); musBus.gain.value = 0; musBus.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ac = null; logError('E300', e); }
  }
  function tone(freq, dur = .12, type = 'sine', vol = .08, slide = 0, delay = 0) {
    if (save.muted || !ac) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(sfxBus); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur = .4, vol = .15, hp = 0) {
    if (save.muted || !ac) return;
    const t = ac.currentTime, s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = noiseBuf; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let node = s;
    if (hp) { const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; s.connect(f); node = f; }
    node.connect(g).connect(sfxBus); s.start(t); s.stop(t + dur);
  }

  // Procedural soundtrack: i-VI-III-VII in A minor, layers added per trail rating, tense progression in the Backcountry.
  const music = { timer: null, step: 0, next: 0 };
  const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  const TENSE = [[57, 60, 64], [58, 62, 65], [57, 60, 63], [56, 59, 63]];
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function mnote(f, t, dur, type, vol) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(musBus); o.start(t); o.stop(t + dur + .05);
  }
  function mhat(t, vol) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 7000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .05);
    s.connect(f).connect(g).connect(musBus); s.start(t, Math.random() * .5); s.stop(t + .06);
  }
  function mkick(t) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + .15);
    g.gain.setValueAtTime(.32, t); g.gain.exponentialRampToValueAtTime(.0001, t + .18);
    o.connect(g).connect(musBus); o.start(t); o.stop(t + .2);
  }
  function musicStep(t, sp) {
    const lvl = Math.min(4, zoneIdx);
    const bar = Math.floor(music.step / 16) % 4, s = music.step % 16;
    const ch = (zoneIdx === 4 ? TENSE : PROG)[bar];
    if (s === 0) ch.forEach(m => mnote(mtof(m), t, sp * 16, 'sine', .026));
    if ([0, 3, 6, 8, 11, 14].includes(s)) mnote(mtof(ch[0] - 24), t, sp * 1.6, 'triangle', .2);
    if (s % 2 === 1) mhat(t, s % 4 === 3 ? .045 : .022);
    if (lvl >= 1 && s % 2 === 0) mnote(mtof(ch[(s / 2) % 3] + 12 + ((s >> 3) & 1) * 12), t, sp * 1.2, 'square', .026);
    if (lvl >= 2 && s % 4 === 0) mkick(t);
    if (lvl >= 3 && (s === 0 || s === 6 || s === 10)) mnote(mtof(ch[(s / 2) % 3] + 24), t, sp * 3, 'sawtooth', .016);
    if (lvl >= 4 && s % 2 === 1) mnote(mtof(ch[0] + 36), t, sp * .6, 'square', .01);
  }
  function musicTick() {
    if (!ac) return;
    const bpm = 116 + zoneIdx * 8, sp = 60 / bpm / 4;
    if (music.next < ac.currentTime) music.next = ac.currentTime + .02;
    while (music.next < ac.currentTime + .15) { musicStep(music.next, sp); music.next += sp; music.step = (music.step + 1) % 64; }
  }
  function musicStart() {
    if (!ac || !save.music) return;
    musicStop(true);
    music.step = 0; music.next = ac.currentTime + .05;
    const t = ac.currentTime;
    musBus.gain.cancelScheduledValues(t); musBus.gain.setValueAtTime(musBus.gain.value, t); musBus.gain.linearRampToValueAtTime(musicLevel(), t + .3);
    music.timer = setInterval(musicTick, 30);
  }
  function musicStop(fast) {
    if (music.timer) { clearInterval(music.timer); music.timer = null; }
    if (ac && musBus) { const t = ac.currentTime; musBus.gain.cancelScheduledValues(t); musBus.gain.setValueAtTime(musBus.gain.value, t); musBus.gain.linearRampToValueAtTime(0, t + (fast ? .02 : .6)); }
  }
  const musicLevel = () => .9 * save.settings.music / 100;
  function applyVolumes() {
    if (!ac) return;
    const t = ac.currentTime;
    if (sfxBus) { sfxBus.gain.cancelScheduledValues(t); sfxBus.gain.setValueAtTime(save.settings.sfx / 100, t); }
    if (musBus && music.timer) { musBus.gain.cancelScheduledValues(t); musBus.gain.setValueAtTime(musicLevel(), t); }
  }
  function syncToggles() {
    musicBtn.setAttribute('aria-pressed', save.music); musicBtn.textContent = save.music ? 'Music' : 'Music off';
    sfxBtn.setAttribute('aria-pressed', !save.muted); sfxBtn.textContent = save.muted ? 'Sound off' : 'Sound';
  }
  $('setBtn').addEventListener('click', () => openSettings());
  musicBtn.addEventListener('click', () => {
    save.music = !save.music; if (save.music && !save.settings.music) save.settings.music = 80; persist(); syncToggles(); applyVolumes();
    if (save.music && state === 'run') { initAudio(); musicStart(); } else if (!save.music) musicStop();
  });
  sfxBtn.addEventListener('click', () => { save.muted = !save.muted; if (!save.muted && !save.settings.sfx) save.settings.sfx = 80; persist(); syncToggles(); applyVolumes(); if (view === 'settings' && !overlay.hidden) renderPanel(); });
  syncToggles();


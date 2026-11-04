  /* ================= daily course + ghost ================= */
  // Seeded RNG so everyone gets the same obstacle sequence on the daily course.
  function seeded(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    let a = h >>> 0;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  // The daily course runs on Denver time: a new course and an empty daily board at 12:00 AM Mountain.
  const DAILY_TZ = 'America/Denver';
  const todayKey = (when = new Date()) => {
    try {
      const p = {}; new Intl.DateTimeFormat('en-US', { timeZone: DAILY_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(when).forEach(x => { p[x.type] = x.value; });
      return `${p.year}-${p.month}-${p.day}`;
    } catch (e) { return new Date(when.getTime() - 7 * 3600000).toISOString().slice(0, 10); }
  };
  const labelFor = k => new Date(k + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  let dayKey = todayKey(), dayLabel = labelFor(dayKey);
  let rand = Math.random, runMode = 'free';
  const loadJSON = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const saveJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let ghostFree = loadJSON('nightrun-ghost'), ghostDaily = loadJSON('nightrun-dghost');
  if (ghostDaily && ghostDaily.date !== dayKey) ghostDaily = null;
  let ghost = null, rec = [], runT = 0, nextSample = 0;
  function rollDay() {
    const k = todayKey();
    if (k === dayKey) return false;
    dayKey = k; dayLabel = labelFor(k);
    if (ghostDaily && ghostDaily.date !== dayKey) ghostDaily = null;
    try { myDaily = 0; myDailyRank = 0; dlb = []; dlbAll = []; dailyCount = 0; } catch (e) {}
    return true;
  }
  const gh = { x: 0, d: 0, done: false, on: false, passed: false, name: '' };
  let ghostRace = null; // a friend's ghost you're racing this run
  // Ghosts travel as base64: the start distance, then 3 bytes per sample (x across the slope 0–1000, and how far it moved in tenths of a meter).
  function packGhost(r) {
    const n = Math.floor(r.length / 2), b = new Uint8Array(4 + n * 3), d0 = Math.max(0, r[1] | 0);
    b[0] = d0 >>> 24 & 255; b[1] = d0 >>> 16 & 255; b[2] = d0 >>> 8 & 255; b[3] = d0 & 255;
    let prev = d0;
    for (let i = 0; i < n; i++) {
      const x = Math.max(0, Math.min(1000, r[i * 2] | 0)), dd = Math.max(0, Math.min(255, (r[i * 2 + 1] | 0) - prev));
      prev += dd; b[4 + i * 3] = x >> 8; b[5 + i * 3] = x & 255; b[6 + i * 3] = dd;
    }
    let str = ''; for (let i = 0; i < b.length; i += 8192) str += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
    return btoa(str);
  }
  function unpackGhost(str) {
    const bin = atob(str), r = [];
    let d = ((bin.charCodeAt(0) << 24) | (bin.charCodeAt(1) << 16) | (bin.charCodeAt(2) << 8) | bin.charCodeAt(3)) >>> 0;
    for (let i = 4; i + 2 < bin.length; i += 3) { d += bin.charCodeAt(i + 2); r.push(Math.min(1000, (bin.charCodeAt(i) << 8) | bin.charCodeAt(i + 1)), d); }
    return r;
  }


  /* ================= daily missions ================= */
  // Three a day (easy, medium, hard), the same for everyone, picked from the Denver date.
  // 'run' missions need it in a single run. 'day' missions add up over today's finished runs.
  const MISSION_POOL = [
    ['m-dist', 'run', 'meters', 'Ride {n} m in one run', 700, 1500, 2800],
    ['m-score', 'run', 'score', 'Score {n} in one run', 1500, 4000, 9000],
    ['m-combo', 'run', 'maxCombo', 'Get a x{n} near-miss combo', 4, 8, 14],
    ['m-tricks', 'run', 'tricks', 'Land {n} spin trick{s} in one run', 1, 3, 6],
    ['m-gates', 'run', 'gateMax', 'Clear {n} slalom gates in a row', 3, 6, 10],
    ['m-rails', 'run', 'rails', 'Grind {n} rail{s} in one run', 1, 3, 6],
    ['m-flakes', 'run', 'flakes', 'Grab {n} flakes in one run', 25, 60, 120],
    ['m-lant', 'run', 'lanterns', 'Grab {n} lanterns in one run', 4, 9, 16],
    ['m-zone', 'run', 'zone', 'Reach {zone}', 2, 3, 4],
    ['m-miss', 'run', 'nearMiss', 'Pull off {n} near misses in one run', 10, 25, 50],
    ['d-runs', 'day', 'runs', 'Finish {n} runs today', 3, 6, 10],
    ['d-dist', 'day', 'meters', 'Ride {n} m today', 3000, 8000, 16000],
    ['d-flakes', 'day', 'flakes', 'Grab {n} flakes today', 80, 200, 400],
    ['d-airs', 'day', 'airs', 'Land {n} jumps today', 8, 20, 40],
    ['d-gates', 'day', 'gates', 'Clear {n} slalom gates today', 15, 40, 80],
    ['d-daily', 'day', 'daily', 'Ride the daily course {n} times today', 1, 2, 4],
  ];
  const MISSION_PAY = [50, 100, 200], MISSION_BONUS = 150, MISSION_TIER = ['Easy', 'Medium', 'Hard'];
  function missionsFor(k) {
    const r = seeded('missions-' + k), pool = MISSION_POOL.slice(), used = new Set(), out = [];
    for (let tier = 0; tier < 3; tier++) {
      const ok = pool.filter(m => !used.has(m[2])), m = ok[Math.floor(r() * ok.length)];
      pool.splice(pool.indexOf(m), 1); used.add(m[2]);
      const g = m[4 + tier];
      const t = m[3].replace('{n}', fmt(g)).replace('{s}', g === 1 ? '' : 's').replace('{zone}', (ZONES[g] || ZONES[0]).name).replace('1 times today', 'once today');
      out.push({ id: m[0], scope: m[1], k: m[2], g, t, tier, pay: MISSION_PAY[tier] });
    }
    return out;
  }
  {
    const M = save.missions;
    if (!M || typeof M !== 'object' || typeof M.day !== 'string' || !Array.isArray(M.prog) || !Array.isArray(M.done)) save.missions = null;
    else { M.prog = [0, 1, 2].map(i => Math.max(0, Math.floor(+M.prog[i] || 0))); M.done = [0, 1, 2].map(i => !!M.done[i]); M.bonus = !!M.bonus; }
  }
  let missions = [], missionsDay = '', runMissions = [];
  function curMissions() {
    if (missionsDay !== dayKey) { missions = missionsFor(dayKey); missionsDay = dayKey; }
    if (!save.missions || save.missions.day !== dayKey) save.missions = { day: dayKey, prog: [0, 0, 0], done: [false, false, false], bonus: false };
    return missions;
  }
  function missionVal(m, i, s, ending) {
    const base = save.missions.prog[i] || 0, v = s ? (s[m.k] || 0) : 0;
    if (m.scope === 'run') return Math.max(base, Math.floor(v));
    if (m.k === 'runs') return base + (ending ? 1 : 0);
    if (m.k === 'daily') return base + (ending && runMode === 'daily' ? 1 : 0);
    return base + Math.floor(v);
  }
  // Runs every frame during a run, and once more when it ends (that's when day totals are banked).
  function missionTick(s, ending) {
    const ms = curMissions(), M = save.missions;
    let changed = false;
    ms.forEach((m, i) => {
      const v = missionVal(m, i, s, ending);
      if (ending && M.prog[i] !== v) { M.prog[i] = v; changed = true; }
      if (M.done[i] || v < m.g) return;
      M.done[i] = true; changed = true;
      bookOnce('m' + M.day.replace(/-/g, '') + 'x' + i, m.pay); save.life.missions++; runMissions.push({ t: m.t, pay: m.pay });
      if (!ending) { toast(`MISSION DONE · +${m.pay} FLAKES`, '#5cf2b0', 170); tone(784, .1, 'triangle', .05); tone(1175, .1, 'triangle', .05, 0, .1); tone(1568, .25, 'triangle', .05, 0, .2); }
    });
    if (!M.bonus && M.done.every(Boolean)) {
      M.bonus = true; changed = true; bookOnce('m' + M.day.replace(/-/g, '') + 'xb', MISSION_BONUS); save.life.sweeps++;
      runMissions.push({ t: 'All three missions done', pay: MISSION_BONUS });
      if (!ending) toast(`ALL MISSIONS DONE · +${MISSION_BONUS} FLAKES`, '#ffd24a', 190);
    }
    if (changed) persist();
  }
  function missionsHTML() {
    rollDay();
    const ms = curMissions(), M = save.missions, n = M.done.filter(Boolean).length;
    const rows = ms.map((m, i) => {
      const done = M.done[i], v = Math.min(m.g, missionVal(m, i, null, false));
      const p = done ? 1 : m.g ? v / m.g : 0;
      const shown = m.k === 'zone' ? (v ? ZONES[v].name : 'Not yet') : `${fmt(v)} / ${fmt(m.g)}`;
      return `<div class="mission${done ? ' done' : ''}"><span class="mt t${m.tier}">${MISSION_TIER[m.tier]}</span><div><b>${esc(m.t)}</b><div class="prog"><i style="width:${(p * 100).toFixed(0)}%"></i></div>${done ? '' : `<span>${m.scope === 'run' ? 'Best today' : 'Today'}: ${esc(shown)}</span>`}</div><span class="mp">${done ? 'Done' : '+' + m.pay}</span></div>`;
    }).join('');
    return `<div class="box missions"><h3>Today's missions <b>${n}/3${M.bonus ? ' · bonus paid' : ` · all 3 pays +${MISSION_BONUS}`}</b></h3>${rows}<p class="hint">Same missions for everyone. New ones at midnight Denver time.</p></div>`;
  }


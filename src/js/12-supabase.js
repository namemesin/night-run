  /* ================= shared leaderboards ================= */
  // Two backends: Claude's artifact database when the page runs on claude.ai, Supabase anywhere else (like Netlify).
  let backend = 'none', db = null, usr = null, myId = null, lb = [], lbState = 'off', names = {}, myOnline = 0, lbNote = '';
  let dlb = [], dlbAll = [], dlbState = 'off', myDaily = 0, lbTab = 'all';
  let myRank = 0, myDailyRank = 0, riderCount = 0, dailyCount = 0, lbUpdated = 0, lbBusy = false, lbFails = 0;
  const clampRow = (id, v) => ({ id: String(id), name: cleanName(v.name).slice(0, 16), level: Math.max(0, Math.min(99, v.level | 0)), color: flexItem('color', v.color) ? v.color : '', title: flexItem('title', v.title) ? v.title : '', best: Math.max(0, +v.best || 0), zone: Math.max(0, Math.min(ZONES.length - 1, v.zone | 0)), board: Math.max(0, Math.min(BOARDS.length - 1, v.board | 0)), d: Math.max(0, v.dist | 0) });
  const mapRow = d => clampRow(d.id, d.data() || {});
  async function resolveNames(rows) {
    try {
      const ids = rows.filter(r => !r.name).map(r => r.id);
      if (usr && ids.length) { const ps = await usr.profiles(ids); ids.forEach(id => { names[id] = (ps && ps[id] && ps[id].name) || ''; }); }
    } catch (e) {}
  }

  // --- Supabase (self-hosted copies) ---
  const sbReady = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(SUPABASE_URL) && SUPABASE_KEY.length > 20;
  const sbBase = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/';
  const SB_COLS = 'player_id,name,best,dist,zone,board';
  const SB_COLS_ALL = [SB_COLS + ',color,title,level', SB_COLS + ',color,title', SB_COLS];
  let sbCols = SB_COLS_ALL[0]; // steps back to older columns until the newest database script is run
  function sbHeaders() {
    const h = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };
    if (SUPABASE_KEY.startsWith('eyJ')) h.Authorization = 'Bearer ' + SUPABASE_KEY; // older "anon" keys
    return h;
  }
  async function sbGet(path) { const r = await fetch(sbBase + path, { headers: sbHeaders() }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }

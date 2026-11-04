  // ---------- player data ----------
  // When a run ends (crash, quit or restart) the game sends how far it got and what ended it, so the
  // Admin panel can show where riders struggle. Runs sent while offline wait in a small queue.
  const runQueue = () => { try { const q = JSON.parse(localStorage.getItem('nightrun-runq') || '[]'); return Array.isArray(q) ? q : []; } catch (e) { return []; } };
  function sendRun(item) {
    return fetch(sbBase + 'rpc/nr_log_run', { method: 'POST', headers: sbHeaders(), keepalive: true, body: JSON.stringify(item) }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); });
  }
  function logRun(ending) {
    try {
      if (!sbReady || !save.settings.stats || !player) return;
      const d = { end: ending, v: APP_VERSION, mode: runMode, m: Math.floor(dist), s: Math.floor(run.score), z: zoneIdx, t: Math.round(runT / 6) / 10,
        x: Math.round(Math.max(0, Math.min(1, player.x / (W || 1))) * 1000), n: save.life.runs, boosts: Object.keys(boostOn).filter(k => boostOn[k]).join(',') || null, revived: run.revived, touch: !!(window.matchMedia && matchMedia('(pointer: coarse)').matches),
        sp: Math.round(speed * 10) / 10, air: player.air > 0, flare: flareT > 0, shield: !!player.shield, ghost: !!gh.on, at: Date.now(),
        combo: run.maxCombo, tricks: run.tricks, airs: run.airs, rails: run.rails, flakes: run.flakes, lanterns: run.lanterns, gates: run.gates,
        near: run.nearMiss, smashes: run.smashes, flares: run.flaresFired, saves: run.saves, leaps: run.leaps || 0,
        ach: achCount(), up: upgradeLevels(save), board: save.board, skin: save.skin };
      const item = { p_data: d, p_device: save.dev, p_token: save.acct ? save.acct.token : null };
      sendRun(item).catch(() => { try { const q = runQueue(); q.push(item); localStorage.setItem('nightrun-runq', JSON.stringify(q.slice(-30))); } catch (e) {} });
    } catch (e) {}
  }
  function flushRuns() {
    const q = runQueue(); if (!q.length || !sbReady) return;
    try { localStorage.removeItem('nightrun-runq'); } catch (e) {}
    q.forEach((item, i) => setTimeout(() => sendRun(item).catch(() => {}), i * 2100)); // the server takes one run per device every 2 s
  }


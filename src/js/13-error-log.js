  // ---------- error log ----------
  // Problems are sent to the error_logs table in Supabase with a code, a plain description and details.
  // If the device is offline, they wait in a small queue and go out the next time the game loads or reconnects.
  const APP_VERSION = 'dev'; // the publish step replaces this with the real version number
  const ERRORS = {
    E100: 'The game hit an unexpected error',
    E101: 'A background task failed without being handled',
    E200: "The leaderboard couldn't load",
    E201: "A score couldn't be posted",
    E202: "Progress couldn't sync to the account",
    E203: "Couldn't reach the server to log in or sign up",
    E204: "An account change couldn't be saved",
    E205: 'A score was rejected by the cheat check',
    E206: "A saved login couldn't be checked",
    E207: "A rider profile couldn't load",
    E208: "An admin action didn't go through",
    E209: "A friends or race request didn't go through",
    E300: "Sound couldn't start",
    E400: "Browser storage isn't working, so progress may not save",
    E500: "Offline support couldn't install",
  };
  let errSent = 0; const errSeen = new Set();
  const errQueue = () => { try { const q = JSON.parse(localStorage.getItem('nightrun-errq') || '[]'); return Array.isArray(q) ? q : []; } catch (e) { return []; } };
  function sendError(item) {
    return fetch(sbBase + 'rpc/nr_log_error', { method: 'POST', headers: sbHeaders(), keepalive: true, body: JSON.stringify(item) }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); });
  }
  function logError(code, err, extra) {
    try {
      if (!sbReady) return;
      const detail = String((err && (err.stack || err.message)) || err || '').slice(0, 2000);
      const sig = code + '|' + detail.slice(0, 160);
      if (errSeen.has(sig) || errSent >= 25) return;
      errSeen.add(sig); errSent++;
      const context = Object.assign({ version: APP_VERSION, state, view, mode: runMode, zone: zoneIdx, meters: Math.floor(dist), at: new Date().toISOString(),
        browser: String(navigator.userAgent || '').slice(0, 300), screen: `${window.innerWidth || 0}x${window.innerHeight || 0}`, homeScreenApp: STANDALONE, online: navigator.onLine !== false }, extra || {});
      const item = { p_code: code, p_message: ERRORS[code] || 'Unknown problem', p_detail: detail || null, p_context: context, p_token: save.acct ? save.acct.token : null };
      sendError(item).catch(() => {
        try { const q = errQueue(); q.push(item); localStorage.setItem('nightrun-errq', JSON.stringify(q.slice(-20))); } catch (e) {}
      });
    } catch (e) {}
  }
  function flushErrors() {
    const q = errQueue(); if (!q.length || !sbReady) return;
    try { localStorage.removeItem('nightrun-errq'); } catch (e) {}
    q.forEach(item => sendError(item).catch(() => {}));
  }
  const withCode = (msg, code) => `${msg} (error ${code})`;


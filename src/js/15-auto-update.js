  // ---------- auto-update ----------
  // Each build writes version.json next to the game. When it no longer matches this page's version,
  // the game refreshes itself as soon as that won't interrupt anything.
  let updateReady = false, updateChecking = false, updating = false;
  async function checkForUpdate() {
    if (!TOP_LEVEL || updateReady || updateChecking || APP_VERSION.startsWith('dev')) return;
    updateChecking = true;
    try {
      const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
      if (r.ok) {
        const v = await r.json();
        if (v && typeof v.version === 'string' && v.version && v.version !== APP_VERSION) { updateReady = true; onUpdateReady(); }
      }
    } catch (e) {}
    updateChecking = false;
  }
  function safeToUpdate() {
    const el = document.activeElement, typing = el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || '');
    return state === 'menu' && !typing && !capturing && !authBusy && !adm.busy && !race && view !== 'settings' && view !== 'account' && view !== 'admin' && view !== 'friends';
  }
  function applyUpdate() {
    if (updating) return;
    updating = true; loopId++;
    try { pushProgress(true); } catch (e) {}
    panel.innerHTML = `<h2>Updating</h2><p>Loading the newest version of Night Run. Your progress is saved.</p>`;
    overlay.hidden = false; pauseBtn.hidden = true; boostBtn.hidden = true;
    setTimeout(() => location.reload(), 700);
  }
  function onUpdateReady() {
    if (safeToUpdate()) return applyUpdate();
    if (state === 'run') toast('UPDATE READY · LOADS AFTER THIS RUN', '#7fe8ff', 160);
    else if (!overlay.hidden && !(view === 'home' && ACCOUNTS && !save.acct && !guest) && view !== 'settings' && view !== 'account' && view !== 'admin') renderPanel();
  }
  const updateBanner = () => updateReady && state !== 'run'
    ? `<div class="update"><span>A new version of Night Run is ready.</span><button type="button" class="buy" data-act="update-now">Update</button></div>` : '';
  addEventListener('error', e => logError('E100', e.error || e.message, { file: String(e.filename || '').slice(-80), line: e.lineno, col: e.colno }));
  addEventListener('unhandledrejection', e => logError('E101', e.reason));
  addEventListener('online', () => { flushErrors(); flushRuns(); });
  window.nrLogError = (code, err) => logError(code, err);


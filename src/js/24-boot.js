  /* ================= boot ================= */
  addEventListener('resize', () => { resize(); if (state !== 'run') draw(performance.now()); });
  resize(); reset(); bannerT = 0;
  for (let i = 0; i < 10; i++) { const r = Math.random(); const o = add(r < .6 ? 'tree' : r < .8 ? 'rock' : 'coin', 20 + Math.random() * (W - 40)); o.y = H * (0.35 + Math.random() * 0.65); }
  if (location.hash === '#daily') save.mode = 'daily';
  setTimeout(checkForUpdate, 4000);
  setInterval(() => { if (!document.hidden) checkForUpdate(); }, 5 * 60 * 1000);
  addEventListener('online', () => checkForUpdate());
  // New achievements your past bests already earned unlock right away.
  checkAch(Object.assign(blankStats(), save.bs), true); newDone = [];
  renderPanel();
  draw(performance.now());
  idleStart();

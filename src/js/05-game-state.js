  /* ================= game state ================= */
  let state = 'menu', view = 'home', lastResult = null, renaming = false;
  let player = null, obs = [], parts = [], texts = [], trail = [], toasts = [];
  let dist = 0, speed = 3.4, spawnT = 0, last = 0, t0 = 0;
  let combo = 0, comboT = 0, lanternsHeld = 0, flareT = 0, shake = 0, inv = 0, gateChain = 0;
  let zoneIdx = 0, bannerT = 0, crashT = 0, flash = 0, cause = '';
  let magnetT = 0, dblT = 0, darkA = 0, freeze = 0, punch = 0, summitA = 0;
  let reserveX = -999, reserveT = 0, patternCd = 0, grindPts = 0;
  let startDist = 0, runT0 = 0, usedKit = [], boostOn = {}, pops = [], raceTick = 0;
  let run = blankStats(), newDone = [], achFlakes = 0;

  function blankStats() {
    return { score: 0, maxCombo: 0, tricks: 0, maxRot: 0, gateMax: 0, smashes: 0, lanterns: 0, zone: 0, meters: 0, saves: 0, airs: 0, rails: 0, flakes: 0, maxGrind: 0, passedGhost: 0, daily: 0,
      nearMiss: 0, gates: 0, flaresFired: 0, shields: 0, magnets: 0, doubles: 0, maxAir: 0, dailyScore: 0, sketchy: 0, purist: 0, noShield: 0, grounded: 0, combo2x: 0, owl: 0, early: 0, leaps: 0, revived: 0, boosted: 0 };
  }


  /* ================= menus ================= */
  const back = `<button class="back" type="button" data-act="v-home">← Back</button>`;
  const medal = (a, unlocked) => `<span class="medal" style="${unlocked ? `background:${TIERS[a.tier].c}` : `border-color:${TIERS[a.tier].c}`}">${unlocked ? '★' : ''}</span>`;
  function renderPanel() {
    let h;
    if (view === 'settings') h = settingsHTML();
    else if (state === 'paused') h = `<h2>Paused</h2><p>${fmt(run.score)} points · ${Math.floor(dist)} m · ${ZONES[zoneIdx].name}${runMode === 'daily' ? ' · Daily course' : ''}</p>
      <button class="go" data-act="resume" type="button">Resume</button>
      <div class="pausegrid"><button class="go alt" data-act="restart" type="button">Restart run</button><button class="go alt" data-act="v-settings" type="button">Settings</button><button class="go alt" data-act="quit" type="button">Quit to menu</button></div>
      <p class="sub">Press <kbd>${esc(keyFor('pause'))}</kbd> to resume or <kbd>${esc(keyFor('restart'))}</kbd> to restart. Restarting or quitting doesn't post this run.</p>`;
    else if (view === 'shop') h = shopHTML();
    else if (view === 'boards' || view === 'skins') h = skinsHTML();
    else if (view === 'leader') h = leaderHTML();
    else if (view === 'ach') h = achHTML();
    else if (view === 'account' && save.acct) h = accountHTML();
    else if (view === 'admin' && save.acct && save.acct.admin) h = adminHTML();
    else if (view === 'profile' && prof) h = profileHTML();
    else if (view === 'friends') h = friendsHTML();
    else if (view === 'race') h = raceHTML();
    else h = homeHTML();
    panel.innerHTML = updateBanner() + h;
  }
  const kitChip = b => { const on = save.kit[b.id], price = b.cost || reviveCost();
    return `<button type="button" data-act="boost-${b.id}" aria-pressed="${on}" ${!on && save.coins < price ? 'disabled' : ''} aria-label="${b.n}: ${on ? 'bought, tap to get your flakes back' : 'buy for ' + fmt(price) + ' flakes'}">${b.short}<small>${on ? 'Ready' : fmt(price)}</small></button>`; };
  function homeHTML() {
    let head;
    if (state === 'over' && lastResult) {
      const r = lastResult, z = ZONES[r.z], s = r.stats, nm = `<b style="color:var(--snow)">${esc(save.name)}</b>`;
      const post = p => p === 'posted' ? 'new best posted' : p === 'kept' ? 'best still stands' : p === 'failed' ? "couldn't post" : 'saved on this device';
      let line = r.posted === 'guest' ? 'You played as a guest, so this run stayed on this device. Log in to post scores.'
        : `All-time board: ${post(r.posted)} as ${nm}.`;
      if (r.mode === 'daily' && r.dposted !== 'guest') line += `<br>Today's course: ${post(r.dposted)}.`;
      const rk = rankOn(false), drk = rankOn(true), ofN = n => n ? ` of ${fmt(n)}` : '';
      const ranks = [];
      if (rk && r.posted !== 'failed') ranks.push(`<b style="color:var(--flare)">#${rk}</b>${ofN(riderCount)} all-time`);
      if (r.mode === 'daily' && drk && r.dposted !== 'failed') ranks.push(`<b style="color:var(--flare)">#${drk}</b>${ofN(dailyCount)} on today's course`);
      if (ranks.length) line += `<br>You're ${ranks.join(' and ')}.`;
      if (r.newGhost) line += `<br>This run is now your ghost${r.mode === 'daily' ? " on today's course" : ''}.`;
      head = `<h2>${r.title}</h2>
        <div><div class="big">${fmt(r.s)}</div>
        <p>${r.d} m, reached <b style="color:${z.color}">${z.name}</b>${r.mode === 'daily' ? ' on the daily course' : ''} · <span class="flk">+${r.earned} flakes${r.evF > 1 ? ` (${r.evF}×)` : ''}</span></p>
        <p class="sub">Combo x${s.maxCombo} · ${s.tricks} tricks · ${s.rails} rails · gate streak ${s.gateMax} · ${s.flakes} flakes grabbed</p></div>
        <p class="sub">${line}</p>
        <div class="xpline"><span class="lvl">Lv ${r.lv}</span><div class="prog"><i style="width:${Math.min(100, (riderXP() - xpAt(r.lv)) / Math.max(1, xpAt(r.lv + 1) - xpAt(r.lv)) * 100).toFixed(0)}%"></i></div><span>+${fmt(r.xp)} XP${r.evX > 1 ? ` (${r.evX}×)` : ''}${r.levelUp ? ' · <b>Level up!</b>' : ''}</span></div>
        ${r.mode === 'race' ? raceResultHTML() : ''}
        ${r.ghostRace ? `<div class="box raceres ${r.ghostRace.beat ? 'win' : 'loss'}"><h3>Ghost race <b>${r.ghostRace.beat ? 'You beat it!' : 'Not this time'}</b></h3><div class="vs"><span>You<b>${fmt(r.s)}</b></span><span>${esc(r.ghostRace.name)}'s ghost<b>${fmt(r.ghostRace.s)}</b></span></div></div>` : ''}
        <div class="challenge"><button class="go share" type="button" data-act="challenge">${r.mode === 'daily' ? "Challenge a friend to today's course" : 'Challenge a friend'}</button><div id="chMsg" class="chmsg" aria-live="polite"></div></div>`;
      if (r.missions && r.missions.length) {
        const list = r.missions.map(m => `<li class="done">${esc(m.t)}<span class="tiny"> +${m.pay}</span></li>`).join('');
        head += `<div class="box"><h3>Missions done <b>+${fmt(r.missions.reduce((n, m) => n + m.pay, 0))} flakes</b></h3><ul>${list}</ul></div>`;
      }
      if (r.ach.length) {
        const list = r.ach.map(id => ACH.find(a => a.id === id)).filter(Boolean).map(a => `<li class="done">${esc(a.n)}<span class="tiny"> ${TIERS[a.tier].n}</span></li>`).join('');
        head += `<div class="box"><h3>Unlocked this run <b>+${fmt(r.achFlakes)} flakes</b></h3><ul>${list}</ul></div>`;
      }
    } else {
      const how = PHONE
        ? (save.settings.steer === 'drag' ? 'Put a finger down anywhere and slide left or right to steer. In the air, sliding spins you, and letting go straightens the board.' : 'Hold the left or right side of the screen to steer. In the air, steering spins you, so land facing downhill.') + ' Tap the Flare button once you hold 3 lanterns.'
        : `Steer with <kbd>${esc(keyFor('left'))}</kbd> <kbd>${esc(keyFor('right'))}</kbd>. In the air, steering spins you, so land facing downhill. <kbd>${esc(keyFor('flare'))}</kbd> fires a Flare once you hold 3 lanterns, and <kbd>${esc(keyFor('restart'))}</kbd> restarts.`;
      head = `<h2>Drop in</h2>
        <p>${how}</p>
        <p class="sub">Grind rails, thread gates, skim obstacles for combos and grab flakes for the shop. Race the ghost of your best run. Past 2,400 m the lights go out, and at 4,000 m you reach the Summit.</p>`;
      if (IS_IOS && TOP_LEVEL && !STANDALONE) head += `<p class="sub tip">Play it like an app: tap the Share button in Safari, then <b>Add to Home Screen</b>.</p>`;
    }
    head = homeNotes() + head;
    let action;
    if (ACCOUNTS && !save.acct && !guest) action = authHTML();
    else if (!ACCOUNTS && (!save.name || renaming)) {
      action = `<form class="box namebox" id="nameForm" novalidate>
          <label for="uname">${save.name ? 'Change your username' : 'Pick a username to ride'}</label>
          <div class="namerow"><input id="uname" name="uname" type="text" maxlength="16" autocomplete="off" spellcheck="false" placeholder="PowderHound" value="${esc(save.name)}"><button class="buy" type="submit">${save.name ? 'Save' : 'Let’s go'}</button></div>
          <p class="err" id="nameErr" role="alert"></p>
          <p class="hint">Your best runs post to the leaderboards under this name automatically.</p>
        </form>` + (save.name ? `<button class="back" type="button" data-act="cancel-name" style="justify-self:center">Cancel</button>` : '');
    } else {
      const free = save.mode !== 'daily';
      action = `<div class="modes">
          <button class="go${free ? '' : ' alt'}" data-act="start-free" type="button">Free ride<small>${kitReady().length ? `${kitReady().length} boost${kitReady().length > 1 ? 's' : ''} ready` : ghostFree ? 'Ghost: ' + fmt(ghostFree.s) : 'Endless run'}</small></button>
          <button class="go${free ? ' alt' : ''}" data-act="start-daily" type="button">Daily course<small>${dayLabel} · same for everyone</small></button>
        </div>
        <div class="boostrow"><span>Buy boosts</span>${BOOSTS.map(kitChip).join('')}</div>
        ${!ACCOUNTS ? `<div class="rider"><span class="lvl">Lv ${riderLevel()}</span>Riding as <b>${esc(save.name)}</b><button type="button" data-act="rename">Change</button></div>`
          : save.acct ? `<div class="rider"><span class="lvl" title="${fmt(riderXP() - xpAt(riderLevel()))} / ${fmt(xpAt(riderLevel() + 1) - xpAt(riderLevel()))} XP to level ${riderLevel() + 1}">Lv ${riderLevel()}</span>Logged in as <b>${esc(save.name)}</b><button type="button" data-act="v-account">Account</button></div>`
          : `<div class="rider">Playing as a guest<button type="button" data-act="to-login">Log in to post scores</button></div>`}`;
    }
    const myPos = lbState === 'ready' ? rankOn(false) - 1 : -1;
    const nav = `<div class="nav">
      <button type="button" data-act="v-ach">Achievements<b>${achCount()}/${ACH.length}</b></button>
      <button type="button" data-act="v-leader">Leaderboard<b>${myPos >= 0 ? '#' + (myPos + 1) : lbState === 'ready' ? 'Top 10' : 'Local'}</b></button>
      <button type="button" data-act="v-shop">Shop<b>${fmt(save.coins)}</b></button>
      <button type="button" data-act="v-skins">Skins<b>${ownedSkinCount()}/${SKINS.length}</b></button>
      <button type="button" data-act="v-friends">Friends<b>${fr.incoming.length + raceInvites.length ? `${fr.incoming.length + raceInvites.length} new` : canSocial() ? fr.list.length : 'Race'}</b></button>
      <button type="button" data-act="v-settings">Settings<b>Sound &amp; keys</b></button>
    </div>`;
    return raceInviteHTML() + head + action + nav + missionsHTML() + achSummaryHTML() + `<p class="ver">Version ${esc(APP_VERSION)}</p>`;
  }
  function settingsHTML() {
    const st = save.settings;
    const backBtn = `<button class="back" type="button" data-act="v-home">\u2190 ${state === 'paused' ? 'Back to pause menu' : 'Back'}</button>`;
    const slider = (id, label, v) => `<div class="slider"><label for="${id}">${label}</label><input type="range" id="${id}" min="0" max="100" step="5" value="${v}"><output id="${id}Out">${v ? v + '%' : 'Off'}</output></div>`;
    const keyRows = KEY_ACTIONS.map(([a, label]) => `<div class="keyrow"><span>${label}</span>${[0, 1].map(i => {
      const listening = capturing && capturing.act === a && capturing.slot === i, k = st.keys[a][i];
      return `<button type="button" class="keycap${listening ? ' listening' : ''}${k ? '' : ' empty'}" data-act="bind-${a}-${i}" aria-label="${label}, ${i ? 'second' : 'main'} key: ${esc(keyLabel(k))}">${listening ? 'Press a key\u2026' : esc(k ? keyLabel(k) : '+ Add')}</button>`;
    }).join('')}</div>`).join('');
    const sw = (act, label, on, onText = 'On', offText = 'Off') => `<div class="setrow"><span>${label}</span><button type="button" class="switch" data-act="${act}" aria-pressed="${on}">${on ? onText : offText}</button></div>`;
    return `${backBtn}<h2>Settings</h2>
      <div class="box set"><h3>Sound</h3>${slider('volMusic', 'Music', st.music)}${slider('volSfx', 'Sound effects', st.sfx)}</div>
      <div class="box set"><h3>Controls <button type="button" class="linkbtn" data-act="keys-reset">Reset keys</button></h3>
        ${keyRows}
        <p class="hint">Click a key box, then press the key you want. <kbd>Esc</kbd> cancels. A key can only do one thing, so picking one that's in use moves it here.</p>
        ${sw('set-steer', 'Phone steering', st.steer === 'drag', 'Drag', 'Sides')}
        <p class="hint">${st.steer === 'drag' ? 'Drag: put a finger down anywhere and slide left or right. Slide further to turn harder. Let go in the air and the board straightens itself.' : 'Sides: hold the left or right half of the screen to steer.'}</p></div>
      <div class="box set"><h3>Gameplay</h3>
        ${sw('set-shake', 'Shake and vibration', st.shake)}
        ${sw('set-ghost', 'Ghost of your best run', st.ghost)}
        ${sw('set-fx', 'Effects', st.fx === 'full', 'Full', 'Reduced')}
        ${sw('set-stats', 'Share run stats', st.stats)}
        <p class="hint">Run stats are how far you got and what ended the run. They help balance the game and never include personal info.</p>
      </div>
      <button class="back" type="button" data-act="settings-reset" style="justify-self:center">Reset all settings</button>
      <p class="ver">Version ${esc(APP_VERSION)}</p>`;
  }
  function authHTML() {
    const reg = authMode === 'register';
    return `<form class="box namebox" id="authForm" novalidate>
        <div class="tabs"><button type="button" data-act="auth-register" aria-pressed="${reg}">Create account</button><button type="button" data-act="auth-login" aria-pressed="${!reg}">Log in</button></div>
        <label for="uname">Username</label>
        <input id="uname" name="username" type="text" maxlength="16" autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="PowderHound" value="${esc(authUser)}">
        <label for="upass">Password</label>
        <input id="upass" name="password" type="password" maxlength="72" autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="${reg ? 'At least 6 characters' : 'Your password'}">
        <p class="err" id="nameErr" role="alert">${esc(authErr)}</p>
        <button class="go" type="submit" ${authBusy ? 'disabled' : ''}>${authBusy ? 'One sec…' : reg ? 'Create account' : 'Log in'}</button>
        <p class="hint">${reg ? "Your scores, flakes and achievements follow your account to any device. There's no password reset, so pick one you'll remember." : 'Log in on any device to pick up where you left off.'}</p>
      </form>
      <button class="back" type="button" data-act="guest" style="justify-self:center">Play as guest (scores won't post)</button>`;
  }
  function accountHTML() {
    const m = acctMsg ? `<p class="${acctMsg.ok ? 'sub ok' : 'err'}" role="alert">${esc(acctMsg.t)}</p>` : '';
    return `${back}<h2>Account</h2>
      <p>Logged in as <b style="color:var(--snow)">${esc(save.name)}</b>. Your scores, flakes, upgrades, achievements and boards are saved to this account.</p>
      ${m}
      <form class="box namebox" id="renameForm" novalidate>
        <label for="newName">Change username</label>
        <div class="namerow"><input id="newName" type="text" maxlength="16" autocomplete="username" autocapitalize="off" spellcheck="false" value="${esc(save.name)}"><button class="buy" type="submit" ${authBusy ? 'disabled' : ''}>Save</button></div>
      </form>
      <form class="box namebox" id="passForm" novalidate>
        <label for="oldPass">Change password</label>
        <input id="oldPass" type="password" maxlength="72" autocomplete="current-password" placeholder="Current password">
        <input id="newPass" type="password" maxlength="72" autocomplete="new-password" placeholder="New password (6+ characters)">
        <button class="buy" type="submit" ${authBusy ? 'disabled' : ''}>Change password</button>
      </form>
      ${save.acct.admin ? `<button class="go alt" type="button" data-act="v-admin">Admin panel</button>` : ''}
      <button class="go alt" type="button" data-act="logout">Log out</button>`;
  }
  function achSummaryHTML() {
    const locked = lockedAch();
    if (!locked.length) return `<div class="box"><h3>Achievements <b>${ACH.length} / ${ACH.length}</b></h3><p class="empty">Every achievement unlocked. The mountain is yours.</p></div>`;
    const next = locked.map((a, i) => ({ a, i, p: Math.max(0, achProg(a)) })).sort((x, y) => (y.p - x.p) || (x.i - y.i)).slice(0, 3);
    const rows = next.map(({ a, p }) => `<div class="mini">${medal(a, false)}<div><b>${esc(a.n)}</b><span>${esc(a.t)}${achProg(a) >= 0 ? ` · ${achProgText(a)}` : ''}</span>${achProg(a) >= 0 ? `<div class="prog"><i style="width:${(p * 100).toFixed(0)}%"></i></div>` : ''}</div></div>`).join('');
    return `<div class="box"><h3>Up next <b>${achCount()} / ${ACH.length}</b></h3><div class="minis">${rows}</div></div>`;
  }
  let achFilter = 'all', achQuery = '';
  const achOpen = new Set(); // groups you've opened stay open when the screen redraws
  function achGroupsHTML() {
    const done = new Set(save.done), q = achQuery.trim().toLowerCase();
    const row = a => {
      const un = done.has(a.id), p = achProg(a);
      return `<div class="ach${un ? '' : ' locked'} t-${a.tier}">${medal(a, un)}<div><h4>${esc(a.n)}</h4><p>${esc(a.t)}</p>${!un && p >= 0 ? `<div class="prog"><i style="width:${(p * 100).toFixed(0)}%"></i></div><div class="pt">${a.scope === 'life' ? 'Total' : 'Best'} ${achProgText(a)}</div>` : ''}</div><span class="rw">${un ? 'Unlocked' : TIERS[a.tier].n + ' +' + fmt(TIERS[a.tier].r)}</span></div>`;
    };
    const match = a => !q || a.n.toLowerCase().includes(q) || a.t.toLowerCase().includes(q) || a.cat.toLowerCase().includes(q) || TIERS[a.tier].n.toLowerCase() === q;
    const html = ACH_CATS.map(cat => {
      const all = ACH.filter(a => a.cat === cat), got = all.filter(a => done.has(a.id)).length;
      const shown = all.filter(a => (achFilter === 'all' || (achFilter === 'done') === done.has(a.id)) && match(a));
      if (!shown.length) return '';
      const open = q || achFilter !== 'all' || achOpen.has(cat);
      return `<details class="achgroup" data-cat="${esc(cat)}"${open ? ' open' : ''}><summary><span>${esc(cat)}</span><b>${q ? shown.length + ' found' : got + '/' + all.length}</b></summary><div class="achs">${shown.map(row).join('')}</div></details>`;
    }).join('');
    return html || `<p class="empty">${q ? `No achievements match "${esc(achQuery.trim())}".` : 'Nothing here yet.'}</p>`;
  }
  function achHTML() {
    const done = new Set(save.done);
    const earned = ACH.filter(a => done.has(a.id)).reduce((n, a) => n + TIERS[a.tier].r, 0);
    const tierCount = t => ACH.filter(a => a.tier === t && done.has(a.id)).length + '/' + ACH.filter(a => a.tier === t).length;
    const f = (id, label) => `<button type="button" data-act="achf-${id}" aria-pressed="${achFilter === id}">${label}</button>`;
    return `${back}<h2>Achievements</h2>
      <p>${achCount()} of ${ACH.length} unlocked · ${fmt(earned)} flakes earned</p>
      <div class="tiers">${['b', 's', 'g', 'p', 'm'].map(t => `<span><i style="background:${TIERS[t].c}"></i>${TIERS[t].n} ${tierCount(t)}</span>`).join('')}</div>
      <p class="sub">Bronze pays 25 flakes, silver 75, gold 200, platinum 500 and mythic 1,500. Mythic ones are meant to take a long time.</p>
      <input id="achQ" class="achsearch" type="search" maxlength="40" autocomplete="off" spellcheck="false" placeholder="Search achievements" value="${esc(achQuery)}" aria-label="Search achievements">
      <div class="tabs three">${f('all', 'All')}${f('locked', 'Still to get')}${f('done', 'Unlocked')}</div>
      <div id="achList" class="achlist">${achGroupsHTML()}</div>`;
  }
  let shopTab = 'upg';
  function shopHTML() {
    const tabs = `<div class="tabs three"><button type="button" data-act="shoptab-upg" aria-pressed="${shopTab === 'upg'}">Upgrades</button><button type="button" data-act="shoptab-boosts" aria-pressed="${shopTab === 'boosts'}">Boosts</button><button type="button" data-act="shoptab-flex" aria-pressed="${shopTab === 'flex'}">Flex</button></div>`;
    const have = `<p>You have <span class="flk">${fmt(save.coins)} flakes</span>.</p>`;
    if (shopTab === 'boosts') {
      const rows = BOOSTS.map(b => {
        const on = save.kit[b.id], price = b.cost || reviveCost();
        const btn = on ? `<button type="button" class="switch" data-act="boost-${b.id}" aria-pressed="true">Ready</button>`
          : `<button type="button" class="buy" data-act="boost-${b.id}" ${save.coins < price ? 'disabled' : ''}>${fmt(price)} flakes</button>`;
        return `<div class="box item"><div><h4>${b.n}</h4><p>${b.d}</p>${on ? `<p class="kitnote">Bought for your next Free ride. Tap Ready to get your ${fmt(save.kitPaid[b.id] || 0)} flakes back.</p>` : ''}</div>${btn}</div>`;
      }).join('');
      return `${back}<h2>Ski shop</h2>${tabs}${have}<p class="sub">Each boost lasts one Free ride, so buy it again for the next one. Restart or quit in the first 100 m and it's saved for your next run. Boosts never work on the daily course, so it stays fair.</p><div class="shop">${rows}</div>`;
    }
    if (shopTab === 'flex') {
      const loggedIn = !ACCOUNTS || !!save.acct;
      const colorChips = COLORS.map(c => {
        const own = flexOwned('color', c.id), on = save.style.color === c.id;
        return `<button type="button" class="chip${on ? ' on' : ''}" data-act="flex-color-${c.id}" ${!own && save.coins < c.cost ? 'disabled' : ''}><i class="${c.c === 'rainbow' ? 'sw-rainbow' : ''}" style="${c.c === 'rainbow' ? '' : 'background:' + c.c}"></i><b>${c.n}</b><span>${on ? 'Using' : own ? 'Use' : fmt(c.cost)}</span></button>`;
      }).join('');
      const titleRows = TITLES.map(t => {
        const own = flexOwned('title', t.id), on = save.style.title === t.id, locked = t.ach && !own && !save.done.includes(t.ach);
        const need = locked ? `Unlock "${esc((ACH.find(a => a.id === t.ach) || {}).n || 'an achievement')}" first` : '';
        const btn = on ? `<button type="button" class="buy" data-act="flex-title-${t.id}">Take off</button>` : own ? `<button type="button" class="buy" data-act="flex-title-${t.id}">Use</button>`
          : `<button type="button" class="buy" data-act="flex-title-${t.id}" ${locked || save.coins < t.cost ? 'disabled' : ''}>${fmt(t.cost)} flakes</button>`;
        return `<div class="titlerow${on ? ' on' : ''}"><span class="ttl big">${esc(t.n)}</span><span class="tiny">${need}</span>${btn}</div>`;
      }).join('');
      return `${back}<h2>Ski shop</h2>${tabs}${have}
        <div class="box flexprev"><h3>How you look on the boards</h3><div class="prevname">${nameHTML(save.name || 'You', save.style.color, save.style.title)}</div>${loggedIn ? '' : '<p class="sub">Log in so other riders can see these.</p>'}</div>
        <div class="box"><h3>Name colors${save.style.color ? ` <button type="button" class="linkbtn" data-act="flex-color-none">Plain name</button>` : ''}</h3><div class="chips">${colorChips}</div></div>
        <div class="box"><h3>Titles</h3><div class="titles">${titleRows}</div></div>`;
    }
    const items = UPG.map(u => {
      const lv = save.up[u.id] || 0, maxed = lv >= u.max, cost = u.cost[lv];
      const pips = Array.from({ length: u.max }, (_, i) => `<span class="${i < lv ? 'on' : ''}"></span>`).join('');
      return `<div class="box item"><div><h4>${u.n}</h4><p>${u.d(lv)}</p><div class="pips">${pips}</div></div>
        <button class="buy" type="button" data-act="buy-${u.id}" ${maxed || save.coins < cost ? 'disabled' : ''}>${maxed ? 'Maxed' : fmt(cost) + ' flakes'}</button></div>`;
    }).join('');
    return `${back}<h2>Ski shop</h2>${tabs}
      <p>You have <span class="flk">${fmt(save.coins)} flakes</span>. Grab them on the slope, unlock achievements, and every run pays 1 extra per 250 points.</p>
      <div class="shop">${items}</div>`;
  }
  let skinTab = 'rider';
  function skinsHTML() {
    const tab = (id, label) => `<button type="button" data-act="skintab-${id}" aria-pressed="${skinTab === id}">${label}</button>`;
    const tabs = `<div class="tabs four">${tab('rider', 'Rider')}${tab('board', 'Board')}${tab('trail', 'Trail')}${tab('crash', 'Crash')}</div>`;
    let body;
    if (skinTab === 'trail' || skinTab === 'crash') {
      const kind = skinTab, list = FLEX[kind];
      body = `<div class="skins">` + list.map(it => {
        const own = flexOwned(kind, it.id), on = save.style[kind] === it.id;
        const pic = kind === 'trail'
          ? `<div class="trailpic"><i class="${it.c === 'rainbow' ? 'sw-rainbow' : ''}" style="${it.c === 'rainbow' ? '' : `background:${it.c};`}height:${it.w || 2.5}px;opacity:${Math.min(1, it.a + .3)}"></i>${it.spark || it.fire ? [0, 1, 2, 3].map(k => `<b style="left:${22 + k * 11}px;top:${34 + (k % 2) * 12}px;background:${it.fire ? (k % 2 ? '#ff4b2b' : '#ffb347') : it.spark}"></b>`).join('') : ''}</div>`
          : `<div class="crashpic">${it.sw.map((c, k) => `<i style="background:${c};left:${18 + (k * 37) % 46}px;top:${14 + (k * 23) % 40}px"></i>`).join('')}</div>`;
        const btn = on ? `<span class="tag on">Using</span>` : own ? `<button type="button" class="buy" data-act="flex-${kind}-${it.id}">Use</button>`
          : `<button type="button" class="buy" data-act="flex-${kind}-${it.id}" ${save.coins < it.cost ? 'disabled' : ''}>${fmt(it.cost)} flakes</button>`;
        return `<div class="skin${on ? ' on' : ''}${own ? '' : ' locked'}">${pic}<b>${esc(it.n)}</b>${btn}</div>`;
      }).join('') + `</div><p class="sub">You have <span class="flk">${fmt(save.coins)} flakes</span>. ${kind === 'trail' ? 'Trails follow your board on every run.' : 'This plays when you wipe out.'}</p>`;
    } else if (skinTab === 'rider') {
      body = `<div class="skins">` + SKINS.map(sk => {
        const own = skinOwned(sk), on = save.skin === sk.id, img = skinPreview(sk);
        const btn = on ? `<span class="tag on">Wearing</span>` : own ? `<button type="button" class="buy" data-act="skin-${sk.id}">Wear</button>`
          : sk.cost ? `<button type="button" class="buy" data-act="skinbuy-${sk.id}" ${save.coins < sk.cost ? 'disabled' : ''}>${fmt(sk.cost)} flakes</button>` : `<span class="tag">${esc(skinHow(sk))}</span>`;
        return `<div class="skin${on ? ' on' : ''}${own ? '' : ' locked'}">${img ? `<img src="${img}" alt="" width="72" height="72">` : '<div class="noimg"></div>'}<b>${esc(sk.n)}</b>${btn}</div>`;
      }).join('') + `</div><p class="sub">You have <span class="flk">${fmt(save.coins)} flakes</span>. Prize skins unlock from hard achievements.</p>`;
    } else {
      body = `<div class="boards">` + BOARDS.map((bd, i) => {
        const locked = !boardOwned(i);
        return `<button class="board" type="button" data-act="board-${i}" aria-pressed="${save.board === i}" ${locked ? 'disabled' : ''} aria-label="${bd.n}${locked ? ', unlocks at ' + bd.r + ' achievements' : ''}"><i style="background:${locked ? '#2a3650' : (bd.sw || bd.c)}"></i>${locked ? bd.r + ' ach.' : bd.n}</button>`;
      }).join('') + `</div><p class="sub">Boards unlock as you collect achievements. You have ${achCount()}.</p>`;
    }
    return `${back}<h2>Skins</h2>${tabs}${body}`;
  }
  function agoText(t) {
    const sec = Math.max(0, Math.round((Date.now() - t) / 1000));
    return sec < 10 ? 'just now' : sec < 60 ? `${sec}s ago` : sec < 3600 ? `${Math.floor(sec / 60)} min ago` : 'a while ago';
  }
  async function refreshBoards() {
    if (lbBusy) return;
    if (backend === 'sb') { const p = sbLoad(false); renderPanel(); await p; }
    else if (backend === 'claude' && db) { lbBusy = true; renderPanel(); await claudeRanks(); lbUpdated = Date.now(); lbBusy = false; refresh(); }
  }
  function boardList(rows, state, emptyMsg, daily) {
    if (state === 'ready') {
      let h = rows.length ? `<ol>${rows.map((r, i) => {
        const me = r.id === myId, b = BOARDS[r.board], nm = r.name || names[r.id] || 'Rider';
        return `<li class="hasbtn${me ? ' me' : ''}"><button type="button" class="lbrow" data-act="prof-${esc(r.id)}" aria-label="${esc(nm)}, ${fmt(r.best)} points. Open profile"><span class="n">${i + 1}</span><span class="sw" style="background:${b.sw || b.c}"></span><span class="who">${(me ? riderLevel() : r.level) ? `<span class="lvl">${me ? riderLevel() : r.level}</span>` : ''}${nameHTML(nm, me && backend === 'sb' ? save.style.color : r.color, me && backend === 'sb' ? save.style.title : r.title)}${me ? ' (you)' : ''} · ${ZONES[r.zone].name}</span><span>${fmt(r.best)}</span></button></li>`;
      }).join('')}</ol>` : `<p class="empty">${emptyMsg}</p>`;
      const rk = rankOn(daily), mine = daily ? myDaily : myOnline, total = daily ? dailyCount : riderCount;
      if (rk > rows.length && mine > 0) h += `<ol class="mine"><li class="me hasbtn"><button type="button" class="lbrow" data-act="prof-${esc(myId || '')}"><span class="n">${rk}</span><span class="sw" style="background:${(BOARDS[save.board] || BOARDS[0]).sw || (BOARDS[save.board] || BOARDS[0]).c}"></span><span class="who">${nameHTML(save.name || 'You', save.style.color, save.style.title)} (you)${total ? ` · of ${fmt(total)} riders` : ''}</span><span>${fmt(mine)}</span></button></li></ol>`;
      if (lbNote) h += `<p class="empty" style="margin-top:8px">${esc(lbNote)}</p>`;
      return h;
    }
    if (state === 'loading') return `<p class="empty">Loading the shared board…</p>`;
    if (state === 'error') return `<p class="empty">Couldn't load the shared board right now. Try again in a minute. Your own top runs are below. (error E200)</p>`;
    return `<p class="empty">The shared board isn't available here. Your own top runs are below.</p>`;
  }
  function leaderHTML() {
    const daily = lbTab === 'daily';
    const online = daily ? boardList(dlb, dlbState, `Nobody has ridden the ${dayLabel} course yet. Be the first.`, true) : boardList(lb, lbState, 'No runs posted yet. Finish a run to take first place.', false);
    const total = daily ? dailyCount : riderCount;
    const local = save.top.length ? `<ol>${save.top.map((t, i) => {
      const z = ZONES[Math.max(0, Math.min(ZONES.length - 1, t.z | 0))];
      return `<li><span class="n">${i + 1}</span><span class="sw" style="background:${z.color}"></span><span class="who">${z.name}, ${t.d} m${t.m === 'daily' ? ' · daily' : ''}</span><span>${fmt(t.s)}</span></li>`;
    }).join('')}</ol>` : `<p class="empty">No runs yet.</p>`;
    return `${back}<h2>Leaderboard</h2>
      <div class="tabs"><button type="button" data-act="tab-all" aria-pressed="${!daily}">All-time</button><button type="button" data-act="tab-daily" aria-pressed="${daily}">Today's course</button></div>
      ${backend !== 'none' ? `<div class="lbbar"><span>${lbBusy ? 'Checking for new scores…' : lbUpdated ? 'Updated ' + agoText(lbUpdated) : ''}</span><button type="button" class="back" data-act="lb-refresh" ${lbBusy ? 'disabled' : ''}>${lbBusy ? 'Refreshing…' : 'Refresh'}</button></div>` : ''}
      <div class="box"><h3>${daily ? `Daily course · ${dayLabel}` : 'All riders'} <b>${total > 10 ? `Top 10 of ${fmt(total)}` : 'Top 10'}</b></h3>${online}</div>
      <p class="sub">Tap a rider to see their profile.</p>
      <div class="box"><h3>Your top runs</h3>${local}</div>`;
  }


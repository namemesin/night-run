  /* ---------- rider profiles ---------- */
  let prof = null;
  function openProfile(id) {
    if (!id) return;
    const row = lb.concat(dlb, dlbAll).find(r => r.id === id) || (id === myId ? { id, name: save.name, best: myOnline, zone: 0, board: save.board } : { id });
    const p = prof = { id, row, data: null, st: backend === 'sb' ? 'loading' : 'ready', err: '' };
    view = 'profile'; renderPanel(); overlay.scrollTop = 0;
    if (backend !== 'sb') return;
    const done = () => { if (prof === p && view === 'profile') renderPanel(); };
    sbCall('nr_profile', { p_id: id, p_day: dayKey }).then(d => {
      if (d && d.error) { p.st = 'error'; p.err = d.error; } else { p.data = d || {}; p.st = 'ready'; }
      done();
    }).catch(e => { p.st = 'error'; p.err = withCode("Couldn't load this rider's profile. Try again in a minute.", 'E207'); logError('E207', e); done(); });
  }
  const sinceText = ts => {
    const t = Date.parse(ts); if (!t) return '';
    const m = Math.max(0, Math.round((Date.now() - t) / 60000));
    return m < 2 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : m < 43200 ? `${Math.round(m / 1440)} days ago` : new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  function profileHTML() {
    const p = prof, r = p.row || {}, d = p.data || {};
    const name = d.name || r.name || names[r.id] || 'Rider', me = p.id === myId;
    const bi = Math.max(0, Math.min(BOARDS.length - 1, (d.board ?? r.board ?? 0) | 0)), zi = Math.max(0, Math.min(ZONES.length - 1, (d.zone ?? r.zone ?? 0) | 0));
    const sk = skinById(d.skin || (me ? save.skin : 'classic')), img = skinPreview(sk, bi), z = ZONES[zi];
    const best = d.best ?? r.best;
    const stat = (label, v) => v === undefined || v === null || v === '' ? '' : `<div class="pstat"><span>${label}</span><b>${v}</b></div>`;
    const hrs = d.secs ? (d.secs >= 3600 ? `${(d.secs / 3600).toFixed(1)} h` : `${Math.round(d.secs / 60)} min`) : null;
    let body = `<div class="pcard"><div class="pimg">${img ? `<img src="${img}" alt="" width="96" height="96">` : ''}</div><div>
        <h2 class="pname">${(() => { const fc = me ? save.style.color : (d.color ?? r.color), ft = me ? save.style.title : (d.title ?? r.title), c = flexItem('color', fc), t = flexItem('title', ft);
          return `<span class="${c && c.c === 'rainbow' ? 'nm-rainbow' : ''}"${c && c.c !== 'rainbow' ? ` style="color:${c.c}"` : ''}>${esc(name)}</span>${t ? `<span class="ptitle">${esc(t.n)}</span>` : ''}`; })()}</h2>
        <p class="sub">${me ? 'This is you · ' : ''}${esc(sk.n)} skin on a ${esc(BOARDS[bi].n)} board${d.joined ? ` · joined ${esc(sinceText(d.joined))}` : ''}</p>
        ${d.banned ? `<p class="err">Banned from the leaderboards</p>` : ''}</div></div>
      <div class="pstats">
        ${stat('Rider level', me ? riderLevel() : d.level || null)}
        ${stat('Best score', best ? fmt(best) : null)}
        ${stat('Best run', (d.dist ?? r.d) ? fmt(d.dist ?? r.d) + ' m' : null)}
        ${stat('Furthest zone', best ? `<span style="color:${z.color}">${z.name}</span>` : null)}
        ${stat("Today's course", d.daily ? fmt(d.daily) : p.data ? 'Not yet' : null)}
        ${stat('Achievements', p.data ? `${fmt(d.achievements || 0)} / ${ACH.length}` : null)}
        ${stat('Runs', d.runs ? fmt(d.runs) : null)}
        ${stat('Total distance', d.meters ? (d.meters >= 10000 ? (d.meters / 1000).toFixed(1) + ' km' : fmt(d.meters) + ' m') : null)}
        ${stat('Time riding', hrs)}
        ${stat('Daily streak', d.streak ? d.streak + (d.streak === 1 ? ' day' : ' days') : null)}
        ${stat('Missions done', d.missions ? fmt(d.missions) : null)}
      </div>`;
    if (p.st === 'loading') body += `<p class="sub">Loading their stats…</p>`;
    if (p.st === 'error') body += `<p class="sub">${esc(p.err)}</p>`;
    if (p.data && !d.account && !me) body += `<p class="sub">This rider posted before accounts existed, so only their board entry is shown.</p>`;
    const adminBtn = save.acct && save.acct.admin && !me ? `<button class="go alt" type="button" data-act="adm-find-${esc(p.id)}">Manage in admin panel</button>` : '';
    const isFriend = fr.list.some(f => f.id === p.id), pending = fr.outgoing.some(f => f.id === p.id);
    const friendBtn = canSocial() && !me && (d.account || p.data == null) ? (isFriend ? `<div class="racebtns"><button class="go" type="button" data-act="rinvd-${esc(p.id)}">Race: distance</button><button class="go" type="button" data-act="rinvs-${esc(p.id)}">Race: score</button></div>`
      : pending ? `<p class="sub">Friend request sent.</p>` : `<button class="go alt" type="button" data-act="fradd-${esc(p.id)}">Add friend</button>`) : '';
    return `<button class="back" type="button" data-act="v-leader">← Leaderboard</button>${body}${friendBtn}${adminBtn}`;
  }


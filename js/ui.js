/* OceanQuest – Benutzeroberfläche: Menüs, Delfin, Shop, Bosskampf, Ergebnisse, Prüfung, Urkunde */
(function (root) {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => MathGen.fmt(n);
  const fmtTime = s => { s = Math.floor(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const S = () => Save.data;
  const COLOR_KEYS = ['blau', 'rosa', 'gruen', 'lila', 'gelb'];
  let ui, mode = 'menu', screen = 'main', anims = [], menuBg = null;

  const UI = {
    get mode() { return mode; },
    init() {
      ui = $('#ui');
      ui.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.disabled) { Sound.sfx('click'); act(b.dataset.act, b.dataset.arg, b); } });
      $('#btn-music').addEventListener('click', () => Sound.next());
      $('#btn-pause').addEventListener('click', () => UI.togglePause());
      Sound.onChange = (t, i, silent) => { $('#track-name').textContent = t.title; if (!silent) toast('♫ ' + t.title); };
      $('#track-name').textContent = Sound.current().title;
      Input.bindTouch($('#touch'));
      Game.hooks = { dialog: showDialog, bossMath, results: showResults, toast };
      document.addEventListener('keydown', onKey);
      document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'game' && !Game.paused && Game.L && Game.L.state === 'play') UI.togglePause(); });
      show('main');
    },
    togglePause() {
      if (mode === 'finale') {
        if (Finale.paused) { Finale.paused = false; closeOverlay(); return; }
        Finale.paused = true; overlay(`<div class="panel pause"><h2>Pause</h2><button class="btn big" data-act="resume">▶ Weiter</button><button class="btn" data-act="final">⟲ Finale neu starten</button><button class="btn" data-act="music">${Sound.music ? '♫ Musik aus' : '♫ Musik an'}</button><button class="btn" data-act="quit">⌂ Zur Weltkarte</button></div>`); return;
      }
      if (mode !== 'game') return;
      const L = Game.L; if (!L) return;
      if (Game.paused) { Game.paused = false; closeOverlay(); updateChrome(); return; }
      if (['dialog', 'math', 'victory'].includes(L.state)) return;
      Game.paused = true; overlay(`<div class="panel pause"><h2>Pause</h2>
        <button class="btn big" data-act="resume">▶ Weiter</button>
        <button class="btn" data-act="cprestart">↺ Zum Checkpoint</button>
        <button class="btn" data-act="restartlvl">⟲ Level neu starten</button>
        <button class="btn" data-act="music">${Sound.music ? '♫ Musik aus' : '♫ Musik an'}</button>
        <button class="btn" data-act="quit">⌂ Zur Weltkarte</button></div>`); updateChrome();
    },
    back() { if (screen !== 'main' && !['finale', 'cert'].includes(screen)) show('main'); },
    renderMenu(ctx, dt) { renderMenuScene(ctx, dt); },
    toast
  };

  /* ---------- Hilfsfunktionen ---------- */
  function toast(text) { const t = $('#toast'); t.textContent = text; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); }
  function overlay(html) { let o = $('#overlay'); if (!o) { o = document.createElement('div'); o.id = 'overlay'; ui.appendChild(o); } o.innerHTML = html; o.style.display = 'flex'; return o; }
  function closeOverlay() { const o = $('#overlay'); if (o) { o.style.display = 'none'; o.innerHTML = ''; } }
  function updateChrome() {
    const st = S().settings; const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const showTouch = mode === 'game' && !Game.paused && (st.touch === 'an' || (st.touch === 'auto' && isTouch)) && Game.L && ['play', 'collect', 'title'].includes(Game.L.state);
    $('#touch').style.display = showTouch ? 'block' : 'none';
    $('#btn-pause').style.display = mode === 'game' || mode === 'finale' ? 'flex' : 'none';
  }
  setInterval(() => updateChrome(), 300);
  function miniCanvas(w, h, draw, animate) {
    const c = document.createElement('canvas'); const dpr = Math.min(2, window.devicePixelRatio || 1); c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px';
    const ctx = c.getContext('2d'); const paint = t => { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); draw(ctx, t); };
    paint(0); if (animate) anims.push({ c, paint }); return c;
  }
  function tickAnims(t) { anims = anims.filter(a => a.c.isConnected); anims.forEach(a => a.paint(t)); }
  function dolphinCanvas(w, h, scale, opts) { return miniCanvas(w, h, (ctx, t) => Art.drawDolphin(ctx, Object.assign({ x: w / 2, y: h / 2 + Math.sin(t * 2) * 4, facing: 1, color: S().color, t, cos: Save.cosmetics(), scale, speed: 0.35 }, opts || {})), true); }
  function bossCanvas(id, w, h, s, grey) { return miniCanvas(w, h, (ctx, t) => { if (grey) ctx.filter = 'grayscale(1) brightness(0.55)'; Art.drawBoss(ctx, id, w / 2, h / 2 + 8, s, { t: grey ? 0 : t }); ctx.filter = 'none'; }, !grey); }
  function onKey(e) {
    const dlg = $('#dialog');
    if (dlg && dlg.style.display !== 'none' && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) { e.preventDefault(); dlg.click(); return; }
    const kp = document.querySelector('.numpad'); const active = document.activeElement && document.activeElement.tagName === 'INPUT';
    if (kp && !active) {
      if (/^(Digit|Numpad)\d$/.test(e.code)) { kp.dispatchEvent(new CustomEvent('key', { detail: e.code.slice(-1) })); e.preventDefault(); }
      else if (e.code === 'Backspace') { kp.dispatchEvent(new CustomEvent('key', { detail: 'del' })); e.preventDefault(); }
      else if (e.code === 'Enter' || e.code === 'NumpadEnter') { kp.dispatchEvent(new CustomEvent('key', { detail: 'ok' })); e.preventDefault(); }
    } else if (!active && (e.code === 'Enter' || e.code === 'NumpadEnter')) { const def = ui.querySelector('[data-default]'); if (def) { e.preventDefault(); def.click(); } }
    const choiceKeys = { KeyA: 0, KeyB: 1, KeyC: 2, KeyD: 3, Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
    if (!kp && !active && choiceKeys[e.code] !== undefined) { const ch = ui.querySelectorAll('.choices .choice'); const b = ch[choiceKeys[e.code]]; if (b && mode === 'game') b.click(); }
  }

  /* ---------- Aktionen ---------- */
  function act(a, arg, el) {
    switch (a) {
      case 'new': if (S().created && S().defeated.some(Boolean)) { overlay(`<div class="panel"><h2>Neues Spiel?</h2><p>Dein bisheriger Fortschritt (${Save.pearls()} Perlen) wird gelöscht. Muschel-Coins und Shop-Items bleiben erhalten.</p><div class="row"><button class="btn" data-act="closeov">Abbrechen</button><button class="btn warn" data-act="newyes">Ja, neu beginnen</button></div></div>`); } else show('create', { fresh: true }); break;
      case 'newyes': { const keep = { coins: S().coins, owned: S().owned, equipped: S().equipped }; Save.resetProgress(); Object.assign(S(), keep); Save.save(); closeOverlay(); show('create', { fresh: true }); break; }
      case 'continue': if (!S().created) show('create', { fresh: true }); else show('worlds'); break;
      case 'goto': if (arg === 'main') SCREENS._from = 0; show(arg); break;
      case 'shopafter': SCREENS._from = +arg; Game.stop(); show('shop', { from: +arg }); break;
      case 'closeov': closeOverlay(); break;
      case 'color': S().color = arg; Save.save(); ui.querySelectorAll('.swatch').forEach(s => s.classList.toggle('sel', s.dataset.arg === arg)); break;
      case 'createdone': {
        const n = ($('#dname').value || '').trim().slice(0, 16); if (!n) { toast('Gib deinem Delfin einen Namen!'); $('#dname').focus(); return; }
        S().name = n; S().childName = ($('#cname').value || '').trim().slice(0, 30); const first = !S().created; S().created = true; Save.save();
        if (first || el.dataset.fresh) startWorld(1); else show('main'); break;
      }
      case 'play': startWorld(+arg); break;
      case 'locked': toast('Besiege zuerst den Boss der vorherigen Welt!'); break;
      case 'resume': UI.togglePause(); break;
      case 'cprestart': Game.paused = false; closeOverlay(); Game.respawnAtCheckpoint(); break;
      case 'restartlvl': Game.paused = false; closeOverlay(); startWorld(Game.L.wid); break;
      case 'quit': Game.paused = false; Finale.paused = false; Finale.stop(); closeOverlay(); Game.stop(); mode = 'menu'; Sound.forWorld(0); show('worlds'); break;
      case 'music': S().settings.music = !S().settings.music; Sound.setMusic(S().settings.music); Save.save(); if (el) el.textContent = S().settings.music ? '♫ Musik aus' : '♫ Musik an'; if (screen === 'settings' && mode === 'menu') show('settings'); break;
      case 'sfx': S().settings.sfx = !S().settings.sfx; Sound.setSfx(S().settings.sfx); Save.save(); show('settings'); break;
      case 'touch': S().settings.touch = arg; Save.save(); show('settings'); break;
      case 'nexttrack': Sound.next(); break;
      case 'reset': overlay(`<div class="panel"><h2>Alles zurücksetzen?</h2><p>Alle Welten, Perlen, Bestzeiten, Coins und Items werden gelöscht.</p><div class="row"><button class="btn" data-act="closeov">Abbrechen</button><button class="btn warn" data-act="resetyes">Ja, alles löschen</button></div></div>`); break;
      case 'resetyes': Save.resetProgress(); closeOverlay(); toast('Spielstand gelöscht.'); show('main'); break;
      case 'shopcat': show('shop', { cat: arg }); break;
      case 'buy': buy(arg); break;
      case 'nextworld': startWorld(Math.min(8, +arg + 1)); break;
      case 'final': Finale.paused = false; Game.stop(); startFinal(); break;
      case 'kickoff': closeOverlay(); Finale.kickoff(); break;
      case 'cert': show('cert'); break;
      case 'print': printCert(); break;
      case 'pdf': pdfCert(); break;
    }
  }

  function startWorld(w) {
    if (w > S().unlocked) { toast('Diese Welt ist noch gesperrt.'); return; }
    mode = 'game'; screen = 'game'; ui.innerHTML = ''; ui.className = 'ingame';
    Game.start(w); updateChrome();
  }

  /* ---------- Bildschirme ---------- */
  function show(name, opts) {
    opts = opts || {}; mode = 'menu'; screen = name; ui.className = 'menu scr-' + name; closeOverlay();
    const f = SCREENS[name]; ui.innerHTML = ''; f(opts); updateChrome();
  }
  const header = (title, sub) => `<div class="hdr"><button class="btn back" data-act="goto" data-arg="main" aria-label="Zurück">←</button><h1 class="plank">${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
  const coinsChip = () => `<div class="coins"><span class="shell-ico"></span>${fmt(S().coins)}</div>`;

  const SCREENS = {
    main() {
      const has = S().created;
      ui.innerHTML = `<div class="title-wrap"><div class="logo">OceanQuest</div><div class="plank subtitle">Die 8 Prüfungen der Tiefsee</div></div>
      <nav class="mainmenu">
        <button class="btn big" data-act="new" ${has ? '' : 'data-default'}>▶ Neues Spiel</button>
        <button class="btn" data-act="continue" ${has ? 'data-default' : 'disabled'}>⟳ Spiel fortsetzen</button>
        <button class="btn" data-act="goto" data-arg="create">🐬 Mein Delfin</button>
        <button class="btn" data-act="goto" data-arg="shop">🐚 Delfin-Shop</button>
        <button class="btn" data-act="${has ? 'goto' : 'continue'}" data-arg="worlds">🗺 Welten</button>
        <button class="btn" data-act="goto" data-arg="scores">🏆 Bestleistungen</button>
        <button class="btn" data-act="goto" data-arg="settings">⚙ Einstellungen</button>
        <button class="btn" data-act="goto" data-arg="help">📖 Anleitung</button>
      </nav>
      <div class="pearlbar">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<span class="pearl ${S().defeated[i] ? 'got' : ''}" title="Perle ${i + 1}"></span>`).join('')}</div>
      ${has ? `<div class="hello">Hallo, <b>${esc(S().name)}</b>! ${coinsChip()}</div>` : ''}
      <footer>ein Lernspiel von <b>VoytsQuest</b></footer>`;
    },
    create(o) {
      ui.innerHTML = header('Dein Delfin') + `<div class="panel create"><div class="cl">
        <div class="preview" id="dprev"></div>
        <div class="arrows"><button class="btn round" data-act="color" data-arg="${COLOR_KEYS[(COLOR_KEYS.indexOf(S().color) + 4) % 5]}" aria-label="Vorherige Farbe">‹</button><button class="btn round" data-act="color" data-arg="${COLOR_KEYS[(COLOR_KEYS.indexOf(S().color) + 1) % 5]}" aria-label="Nächste Farbe">›</button></div>
        <div class="lbl">Farbe wählen:</div>
        <div class="swatches">${COLOR_KEYS.map(k => `<button class="swatch ${S().color === k ? 'sel' : ''}" data-act="color" data-arg="${k}" style="--c:${Art.COLORS[k].body}"><span></span>${Art.COLORS[k].name}</button>`).join('')}</div></div>
        <div class="cr"><label class="lbl">Name deines Delfins:<input id="dname" maxlength="16" value="${esc(S().created ? S().name : '')}" placeholder="z. B. Flipper" autocomplete="off"></label>
        <label class="lbl small">Dein Name für die Urkunde (freiwillig):<input id="cname" maxlength="30" value="${esc(S().childName)}" placeholder="optional" autocomplete="off"></label>
        <p class="note">Die Farbe gilt auch im Spiel. Mützen, Brillen und Looks gibt es im Delfin-Shop.</p>
        <button class="btn big gold" data-act="createdone" ${o.fresh ? 'data-fresh="1"' : ''} data-default>Los geht's!</button></div></div>`;
      $('#dprev').appendChild(dolphinCanvas(460, 260, 2.3));
      ui.querySelectorAll('.arrows .btn').forEach(b => b.addEventListener('click', () => setTimeout(() => show('create', o), 0)));
      $('#dname').addEventListener('keydown', e => { if (e.key === 'Enter') ui.querySelector('[data-act=createdone]').click(); });
      if (!S().created) setTimeout(() => $('#dname').focus(), 50);
    },
    worlds() {
      const d = S();
      ui.innerHTML = header('Die 8 Meereswelten', `${esc(d.name)} · ${Save.pearls()} von 8 magischen Perlen`) + `<div class="worldgrid">${WORLDS.map(w => {
        const open = w.id <= d.unlocked, done = d.defeated[w.id - 1], b = d.best[w.id];
        return `<button class="wcard ${open ? '' : 'locked'} ${done ? 'done' : ''}" data-act="${open ? 'play' : 'locked'}" data-arg="${w.id}">
          <div class="wc-boss" data-boss="${w.boss}" data-grey="${open ? 0 : 1}"></div>
          <div class="wc-name">${w.id}. ${w.bossName}<small>${w.short}</small></div>
          <div class="wc-info">${open ? (b ? `${'★'.repeat(b.stars)}${'☆'.repeat(3 - b.stars)} · ${fmtTime(b.time)}` : 'Neu!') : '🔒 gesperrt'}</div>
          ${done ? '<span class="wc-pearl" title="Perle erhalten"></span>' : ''}</button>`;
      }).join('')}</div>
      <div class="examrow">${d.exam.unlocked ? `<button class="btn big gold" data-act="final">⚽ Großes Finale: Fußball gegen Mbappé</button>${d.exam.passed ? '<button class="btn" data-act="cert">📜 Urkunde ansehen</button>' : ''}` : '<div class="note">Besiege alle 8 Bosse – dann wartet Mbappé zum großen Fußball-Finale.</div>'}</div>`;
      ui.querySelectorAll('.wc-boss').forEach(el => el.appendChild(bossCanvas(el.dataset.boss, 200, 130, 0.42, el.dataset.grey === '1')));
    },
    shop(o) {
      const cat = o.cat || SCREENS._cat || 'aussehen'; SCREENS._from = o.from !== undefined ? o.from : SCREENS._from;
      const items = Save.ITEMS.filter(i => cat === 'alle' || i.cat === cat);
      const from = SCREENS._from; const nextBtn = from ? `<button class="btn gold shopnext" data-act="${from >= 8 ? 'final' : 'nextworld'}" data-arg="${from}">${from >= 8 ? '⚽ Zum Finale ▶' : 'Weiter zu Welt ' + (from + 1) + ' ▶'}</button>` : '';
      ui.innerHTML = header('Delfin-Shop', 'Gib deine Muschel-Coins aus und mache deinen Delfin einzigartig!') + coinsChip() + nextBtn + `<div class="shop">
        <div class="shopside"><div class="preview" id="sprev"></div>
          ${[['aussehen', '👒 Aussehen'], ['trikots', '⚽ Trikots'], ['baden', '👙 Badeanzüge'], ['perruecken', '💇 Perücken'], ['effekte', '✨ Effekte'], ['begleiter', '🐢 Begleiter'], ['alle', '🧰 Alle Items']].map(([k, l]) => `<button class="btn ${k === cat ? 'sel' : ''}" data-act="shopcat" data-arg="${k}">${l}</button>`).join('')}
          <p class="note">Coins verdienst du mit Muscheln, Perlen und richtigen Antworten.</p></div>
        <div class="itemgrid">${items.map(it => {
          const own = S().owned.includes(it.id), eq = S().equipped[it.slot] === it.id;
          return `<button class="item ${own ? 'own' : ''} ${eq ? 'eq' : ''} ${it.premium ? 'premium' : ''}" data-act="buy" data-arg="${it.id}" title="${esc(it.hint || it.name)}">${it.premium ? '<span class="ptag">Premium</span>' : ''}<div class="ico" data-ico="${it.id}"></div><div class="iname">${it.name}</div>
            <div class="price">${eq ? '✔ angelegt' : own ? 'Anlegen' : `<span class="shell-ico"></span>${fmt(it.price)}`}</div></button>`;
        }).join('')}</div></div>`;
      $('#sprev').appendChild(miniCanvas(300, 190, (ctx, t) => { const c = Save.cosmetics(); if (c.companion) Art.drawCompanion(ctx, c.companion, 62, 132, t, 1); Art.drawDolphin(ctx, { x: 160, y: 95 + Math.sin(t * 2) * 5, facing: 1, color: S().color, t, cos: c, scale: 1.45, speed: 0.4 }); }, true));
      ui.querySelectorAll('.ico').forEach(el => el.appendChild(miniCanvas(150, 86, (ctx, t) => Art.drawItemIcon(ctx, el.dataset.ico, 75, 46, 1, t), true)));
      SCREENS._cat = cat;
    },
    scores() {
      const d = S(); const total = WORLDS.reduce((a, w) => a + (d.best[w.id] ? d.best[w.id].score : 0), 0);
      ui.innerHTML = header('Bestleistungen', esc(d.name)) + `<div class="panel scores"><table><thead><tr><th>Welt</th><th>Boss</th><th>Bestzeit</th><th>Punkte</th><th>Sterne</th></tr></thead><tbody>
        ${WORLDS.map(w => { const b = d.best[w.id]; return `<tr><td>${w.id}. ${w.short}</td><td>${d.defeated[w.id - 1] ? '✔ ' : ''}${w.bossName}</td><td>${b ? fmtTime(b.time) : '–'}</td><td>${b ? fmt(b.score) : '–'}</td><td class="stars">${b ? '★'.repeat(b.stars) + '☆'.repeat(3 - b.stars) : '–'}</td></tr>`; }).join('')}
        </tbody></table><div class="sumrow"><span>Gesamtpunkte: <b>${fmt(total)}</b></span><span>Perlen: <b>${Save.pearls()}/8</b></span><span>Spielzeit: <b>${fmtTime(d.playTime)}</b></span><span>Finale: <b>${d.exam.passed ? 'gewonnen ' + esc(d.exam.score) : '–'}</b></span></div></div>`;
    },
    settings() {
      const st = S().settings;
      ui.innerHTML = header('Einstellungen') + `<div class="panel settings">
        <div class="setrow"><span>Musik</span><button class="btn small" data-act="music">${st.music ? 'An ✔' : 'Aus'}</button><input type="range" min="0" max="1" step="0.05" value="${st.musicVol}" id="mvol" aria-label="Musiklautstärke"></div>
        <div class="setrow"><span>Aktueller Track</span><b id="trk">${esc(Sound.current().title)}</b><button class="btn small" data-act="nexttrack">⏭ Nächster (M)</button></div>
        <div class="setrow"><span>Soundeffekte</span><button class="btn small" data-act="sfx">${st.sfx ? 'An ✔' : 'Aus'}</button><input type="range" min="0" max="1" step="0.05" value="${st.sfxVol}" id="svol" aria-label="Effektlautstärke"></div>
        <div class="setrow"><span>Touch-Steuerung</span>${['auto', 'an', 'aus'].map(k => `<button class="btn small ${st.touch === k ? 'sel' : ''}" data-act="touch" data-arg="${k}">${k === 'auto' ? 'Automatisch' : k === 'an' ? 'Immer an' : 'Aus'}</button>`).join('')}</div>
        <div class="setrow"><span>Spielstand</span><button class="btn small warn" data-act="reset">Alles zurücksetzen</button></div>
        <p class="note">Der Spielstand wird nur auf diesem Gerät gespeichert. Es werden keine Daten übertragen.</p></div>`;
      $('#mvol').addEventListener('input', e => { st.musicVol = +e.target.value; Sound.setMusicVol(st.musicVol); Save.save(); });
      $('#svol').addEventListener('input', e => { st.sfxVol = +e.target.value; Sound.setSfxVol(st.sfxVol); Save.save(); });
    },
    help() {
      ui.innerHTML = header('Anleitung') + `<div class="panel help"><div class="cols">
        <div><h3>Steuerung</h3><table class="keys">
          <tr><td><kbd>↑</kbd> <kbd>W</kbd></td><td>nach oben schwimmen</td></tr>
          <tr><td><kbd>←</kbd><kbd>→</kbd> <kbd>A</kbd><kbd>D</kbd></td><td>nach links / rechts</td></tr>
          <tr><td><kbd>↓</kbd> <kbd>S</kbd></td><td>nach unten tauchen</td></tr>
          <tr><td><kbd class="wide">Leertaste</kbd></td><td>Flossenschlag: kleine Gegner wegschieben, Schalter drücken, Kisten schieben</td></tr>
          <tr><td><kbd>M</kbd></td><td>nächster Musik-Track</td></tr>
          <tr><td><kbd>Esc</kbd></td><td>Pause</td></tr></table>
          <p>Auf dem iPad erscheinen Touch-Tasten: links das Steuerkreuz, rechts die große Action-Taste.</p></div>
        <div><h3>So geht's</h3><ul class="checks">
          <li>Schwimme frei in alle Richtungen.</li><li>Sammle Muscheln (10 Punkte) und Perlen (50 Punkte).</li>
          <li>Große Gegner (Aale, Riesenfische) und Seeigel sind geschützt – schwimm drumherum!</li>
          <li>Checkpoints (Fahnen) merken sich deinen Fortschritt.</li>
          <li>Am Ende jeder Welt wartet ein Boss. Besiege ihn mit richtigen Rechnungen!</li>
          <li>Falsche Antwort? Kein Problem – du bekommst einen Tipp und darfst es nochmal versuchen.</li></ul>
          <div class="goal"><b>Dein Ziel:</b> Besiege alle 8 Meeresbosse, bestehe die große Prüfung und erhalte die Urkunde „Meister der 8 Meere“!</div></div></div></div>`;
    },
    cert() { renderCertScreen(); },
    exam() { }
  };

  function buy(id) {
    const it = Save.ITEMS.find(i => i.id === id); const d = S();
    if (d.owned.includes(id)) { d.equipped[it.slot] = d.equipped[it.slot] === id ? null : id; Save.save(); Sound.sfx('switch'); }
    else if (d.coins >= it.price) { d.coins -= it.price; d.owned.push(id); d.equipped[it.slot] = id; Save.save(); Sound.sfx('buy'); toast(it.name + ' gekauft!'); }
    else { toast(`Dir fehlen noch ${fmt(it.price - d.coins)} Muschel-Coins.`); return; }
    show('shop', { cat: SCREENS._cat });
  }

  /* ---------- Bosskampf ---------- */
  function showDialog(W, lines, done) {
    let i = 0; const box = document.createElement('div'); box.id = 'dialog'; box.className = 'dialog';
    box.innerHTML = `<div class="dportrait"></div><div class="dbody"><div class="dname">${W.bossName} <small>${W.bossTitle}</small></div><div class="dtext"></div><div class="dnext">Weiter ▶ <small>(Klick / Leertaste)</small></div></div>`;
    ui.appendChild(box); box.querySelector('.dportrait').appendChild(bossCanvas(W.boss, 150, 120, 0.36));
    const txt = box.querySelector('.dtext'); let typing = null;
    const showLine = () => {
      Game.setTalk(true); if (W.boss === 'herbert') Game.setLamp(i !== 0);
      const full = lines[i]; let k = 0; clearInterval(typing); txt.textContent = '';
      typing = setInterval(() => { k += 2; txt.textContent = full.slice(0, k); if (k >= full.length) { clearInterval(typing); typing = null; Game.setTalk(false); } }, 22);
    };
    box.addEventListener('click', () => {
      if (typing) { clearInterval(typing); typing = null; txt.textContent = lines[i]; Game.setTalk(false); return; }
      i++; if (i >= lines.length) { box.remove(); Game.setTalk(false); Game.setLamp(true); done && done(); } else showLine();
    });
    showLine();
  }

  function bossMath(W, boss) {
    const panel = document.createElement('div'); panel.className = 'mathpanel'; ui.appendChild(panel);
    let task, attempts = 0;
    const say = (text, cls) => { const b = panel.querySelector('.bubble'); b.textContent = text; b.className = 'bubble ' + (cls || ''); };
    const next = () => {
      task = MathGen.generate(W.id); attempts = 0;
      panel.innerHTML = `<div class="mp-head"><span class="tag">${esc(task.label)}</span><span class="hp">${W.bossName}: ${'❤'.repeat(boss.hp)}<span class="lost">${'❤'.repeat(boss.max - boss.hp)}</span></span></div>
        <div class="bubble"></div><div class="task"></div><div class="fb" aria-live="polite"></div>`;
      say(boss.hp === boss.max ? 'Löse meine Aufgabe, ' + S().name + '!' : 'Noch ' + boss.hp + ' Aufgabe' + (boss.hp > 1 ? 'n' : '') + ' bis zum Sieg!');
      const api = renderTask(panel.querySelector('.task'), task, submit);
      UI._cur = { task, solve: () => submit(answerOf(task), api) };
    };
    const submit = (input, api) => {
      const fb = panel.querySelector('.fb');
      if (MathGen.check(task, input)) {
        Sound.sfx('correct'); Game.bossHit(); api.lock(true);
        fb.className = 'fb ok'; fb.innerHTML = '✔ Richtig! <b>+100</b>'; say(W.hits[Math.floor(Math.random() * W.hits.length)], 'hit');
        if (boss.hp <= 0) setTimeout(() => { panel.remove(); showDialog(W, [W.defeat], () => Game.bossDefeat()); }, 1500);
        else setTimeout(next, 1600);
      } else {
        Sound.sfx('wrong'); Game.bossMiss(); attempts++;
        say(W.wrong[Math.floor(Math.random() * W.wrong.length)], 'laugh');
        if (attempts < 3) { fb.className = 'fb bad'; fb.innerHTML = `✘ Noch nicht richtig. <span class="hint">${esc(task.hint)}</span>`; api.reset(); }
        else { api.lock(true); fb.className = 'fb bad'; fb.innerHTML = `${esc(task.solution)} <button class="btn small" data-default id="nt">Neue Aufgabe ▶</button>`; fb.querySelector('#nt').onclick = () => { Sound.sfx('click'); next(); }; }
      }
    };
    next();
  }

  /* Antwortformate: choice | brackets | input | order | pyramid */
  function renderTask(el, task, submit) {
    let locked = false; const api = { lock(v) { locked = v; el.classList.toggle('locked', v); }, reset() { } };
    const prompt = `<div class="prompt">${esc(task.prompt).replace(/\n/g, '<br>').replace(/___/g, '<span class="gap">?</span>')}</div>`;
    if (task.format === 'choice' || task.format === 'brackets') {
      el.innerHTML = prompt + `<div class="choices ${task.choices.some(c => c.label.length > 14) ? 'wide' : ''}">${task.choices.map((c, i) => `<button class="choice" data-v="${esc(c.value)}"><span class="letter">${'ABCD'[i]}</span>${esc(c.label)}</button>`).join('')}</div>`;
      el.querySelectorAll('.choice').forEach(b => b.onclick = () => { if (locked) return; el.querySelectorAll('.choice').forEach(x => x.classList.remove('picked', 'wrong')); b.classList.add('picked'); const ok = MathGen.check(task, b.dataset.v); if (!ok) b.classList.add('wrong'); submit(b.dataset.v, api); });
    } else if (task.format === 'input') {
      el.innerHTML = prompt + `<div class="inputrow"><div class="answer" id="ans"></div></div>` + numpad();
      let v = ''; const ans = el.querySelector('#ans'); const upd = () => ans.textContent = v || ' ';
      api.reset = () => { v = ''; upd(); ans.classList.add('shake'); setTimeout(() => ans.classList.remove('shake'), 400); };
      bindPad(el, k => { if (locked) return; if (k === 'del') v = v.slice(0, -1); else if (k === 'ok') { if (v) submit(v, api); } else if (v.length < 5) v += k; upd(); }); upd();
    } else if (task.format === 'order') {
      el.innerHTML = prompt + `<div class="orderitems">${task.items.map((s, i) => `<button class="oitem" data-i="${i}"><span class="badge"></span>${esc(s)}</button>`).join('')}</div><div class="row"><button class="btn small" id="ordreset">↺ Zurücksetzen</button><button class="btn small gold" id="ordok" disabled>Prüfen ✔</button></div>`;
      let seq = []; const btns = [...el.querySelectorAll('.oitem')];
      const upd = () => { btns.forEach((b, i) => { const p = seq.indexOf(i); b.classList.toggle('sel', p >= 0); b.querySelector('.badge').textContent = p >= 0 ? p + 1 : ''; }); el.querySelector('#ordok').disabled = seq.length !== task.items.length; };
      btns.forEach((b, i) => b.onclick = () => { if (locked || seq.includes(i)) return; seq.push(i); upd(); });
      el.querySelector('#ordreset').onclick = () => { if (!locked) { seq = []; upd(); } };
      el.querySelector('#ordok').onclick = () => { if (!locked) submit(seq.slice(), api); };
      api.reset = () => { seq = []; upd(); };
    } else if (task.format === 'pyramid') {
      const { rows, blanks } = task.pyramid; const isBlank = (r, c) => blanks.some(([a, b]) => a === r && b === c);
      let vals = {}; let sel = blanks[0][0] + ',' + blanks[0][1];
      el.innerHTML = prompt + `<div class="pyr">${rows.map((row, r) => ({ row, r })).reverse().map(({ row, r }) => `<div class="prow">${row.map((v, c) => isBlank(r, c) ? `<button class="pcell blank" data-k="${r},${c}"></button>` : `<div class="pcell">${v}</div>`).join('')}</div>`).join('')}</div>` + numpad();
      const cells = [...el.querySelectorAll('.pcell.blank')];
      const upd = () => cells.forEach(c => { c.textContent = vals[c.dataset.k] || ''; c.classList.toggle('sel', c.dataset.k === sel); });
      cells.forEach(c => c.onclick = () => { if (!locked) { sel = c.dataset.k; upd(); } });
      api.reset = () => { vals = {}; sel = cells[0].dataset.k; upd(); };
      bindPad(el, k => {
        if (locked) return; const cur = vals[sel] || '';
        if (k === 'del') vals[sel] = cur.slice(0, -1);
        else if (k === 'ok') { const filled = cells.every(c => vals[c.dataset.k]); if (!filled) { const empty = cells.find(c => !vals[c.dataset.k]); sel = empty.dataset.k; upd(); toast('Fülle zuerst alle leeren Steine aus.'); return; } submit(Object.assign({}, vals), api); return; }
        else if (cur.length < 4) { vals[sel] = cur + k; }
        upd();
      });
      upd();
    }
    return api;
  }
  const answerOf = t => t.format === 'order' ? t.answer.slice() : t.format === 'pyramid' ? Object.assign({}, t.answer) : String(t.answer);
  const numpad = () => `<div class="numpad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map(k => `<button class="key ${k}" data-key="${k}">${k === 'del' ? '⌫' : k === 'ok' ? 'OK' : k}</button>`).join('')}</div>`;
  function bindPad(el, fn) { const pad = el.querySelector('.numpad'); pad.querySelectorAll('.key').forEach(b => b.onclick = () => fn(b.dataset.key)); pad.addEventListener('key', e => fn(e.detail)); }

  /* ---------- Ergebnis ---------- */
  function showResults(st) {
    const d = S(); const w = st.world; const prev = d.best[w];
    const isBest = !prev || st.score > prev.score;
    d.best[w] = { time: prev ? Math.min(prev.time, st.time) : st.time, score: prev ? Math.max(prev.score, st.score) : st.score, stars: prev ? Math.max(prev.stars, st.stars) : st.stars };
    const firstWin = !d.defeated[w - 1]; d.defeated[w - 1] = true;
    let unlockedMsg = '';
    if (w < 8 && d.unlocked < w + 1) { d.unlocked = w + 1; unlockedMsg = `🔓 Welt ${w + 1} freigeschaltet: ${WORLDS[w].name}!`; }
    if (w === 8 && !d.exam.unlocked) { d.exam.unlocked = true; unlockedMsg = '⚽ Das große Finale gegen Mbappé ist freigeschaltet!'; }
    d.coins += st.coins; d.playTime += st.time; d.score = WORLDS.reduce((a, x) => a + (d.best[x.id] ? d.best[x.id].score : 0), 0); Save.save();
    if (unlockedMsg) setTimeout(() => Sound.sfx('unlock'), 600);
    const o = overlay(`<div class="panel results"><h2>${WORLDS[w - 1].bossName} besiegt!</h2>
      <div class="bigstars">${[1, 2, 3].map(i => `<span class="${i <= st.stars ? 'on' : ''}" style="animation-delay:${i * 0.25}s">★</span>`).join('')}</div>
      <div class="magic">${firstWin ? '✨ Du hast die ' + Save.pearls() + '. magische Perle erhalten!' : 'Welt erneut gemeistert!'}</div>
      <table class="rt"><tr><td>Benötigte Zeit</td><td>${fmtTime(st.time)}</td></tr><tr><td>Muscheln</td><td>${st.shells} / ${st.totalShells}</td></tr><tr><td>Perlen</td><td>${st.pearls}</td></tr>
      <tr><td>Richtige Rechenantworten</td><td>${st.correct}</td></tr><tr><td>Fehlversuche</td><td>${st.fails}</td></tr><tr><td>Zeitbonus</td><td>+${fmt(st.timeBonus)}</td></tr>
      <tr class="tot"><td>Punkte</td><td>${fmt(st.score)}${isBest ? ' <span class="nb">Rekord!</span>' : ''}</td></tr><tr><td>Muschel-Coins verdient</td><td>+${fmt(st.coins)}</td></tr>${st.egg ? `<tr><td>🥚 Easter Egg „${st.egg}“</td><td>gefunden!</td></tr>` : ''}</table>
      ${unlockedMsg ? `<div class="unlock">${unlockedMsg}</div>` : ''}
      <div class="row">${w < 8 ? `<button class="btn big gold" data-act="nextworld" data-arg="${w}" data-default>Nächste Welt ▶</button>` : `<button class="btn big gold" data-act="final" data-default>⚽ Zum großen Finale ▶</button>`}
      <button class="btn" data-act="play" data-arg="${w}">⟲ Nochmal</button><button class="btn" data-act="quit">🗺 Weltkarte</button></div>
      <button class="shopbar" data-act="shopafter" data-arg="${w}"><span class="sb-ico"></span><span class="sb-txt"><b>Delfin-Shop</b><small>Trikots, Perücken, Begleiter & mehr</small></span><span class="sb-coins"><span class="shell-ico"></span>${fmt(d.coins)}</span><span class="sb-go">Einkaufen ▶</span></button></div>`);
    o.classList.add('celebrate');
  }

  /* ---------- Großes Finale: Fußball gegen Mbappé ---------- */
  function startFinal() {
    const d = S(); if (!d.exam.unlocked) { toast('Besiege zuerst alle 8 Bosse!'); return; }
    closeOverlay(); mode = 'finale'; screen = 'finale'; ui.innerHTML = ''; ui.className = 'ingame';
    Finale.start((won, score) => {
      if (won) { d.exam.passed = true; d.exam.score = score; d.exam.date = new Date().toLocaleDateString('de-DE'); d.coins += 1000; Save.save(); }
      overlay(`<div class="panel results"><h2>${won ? '🏆 Du hast gewonnen!' : 'Mbappé gewinnt …'}</h2><div class="bignum">${score}</div>
        <p>${won ? `Du hast Mbappé im großen Unterwasser-Finale geschlagen. Du bist der wahre Meister der acht Meere! <b>+1.000 Muschel-Coins</b>` : 'Knapp! Mbappé ist schnell – aber er lässt hinten Lücken. Versuch es nochmal!'}</p>
        <div class="row">${won ? '<button class="btn big gold" data-act="cert" data-default>📜 Zur Urkunde</button>' : '<button class="btn big gold" data-act="final" data-default>⟲ Revanche!</button>'}<button class="btn" data-act="quit">🗺 Weltkarte</button></div></div>`);
      if (won) confetti();
    });
    overlay(`<div class="panel"><h2>⚽ Das große Finale</h2>
      <p>Mbappé fordert dich zum Unterwasser-Fußball heraus! Schieß den Ball in sein Tor rechts und verteidige dein Tor links.<br><b>Wer zuerst 5 Tore schießt, gewinnt.</b></p>
      <table class="keys"><tr><td><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> / <kbd>WASD</kbd></td><td>schwimmen</td></tr><tr><td><kbd class="wide">Leertaste</kbd></td><td>kurzer Sprint</td></tr><tr><td>👆 Finger / Maus</td><td>auf deiner Hälfte ziehen</td></tr></table>
      <div class="row"><button class="btn big gold" data-act="kickoff" data-default>Anpfiff! ▶</button></div></div>`);
  }
  function confetti() {
    const box = document.createElement('div'); box.className = 'confetti'; ui.appendChild(box);
    for (let i = 0; i < 80; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = ['#ffd23a', '#ff5a8a', '#5ad1ff', '#7aff9a', '#c89aff'][i % 5]; s.style.animationDelay = Math.random() * 2 + 's'; s.style.animationDuration = 2.5 + Math.random() * 2 + 's'; box.appendChild(s); }
  }

  /* ---------- Urkunde ---------- */
  function drawCertificate(cv) {
    const ctx = cv.getContext('2d'); const W = cv.width, H = cv.height; const d = S(); const k = W / 1600;
    ctx.save(); ctx.scale(k, k); const w = 1600, h = 1131;
    const g = ctx.createRadialGradient(w / 2, h / 2, 200, w / 2, h / 2, 1000); g.addColorStop(0, '#fff8e2'); g.addColorStop(1, '#ecd49a'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const r = Art.rng(42); for (let i = 0; i < 400; i++) { ctx.fillStyle = `rgba(150,110,40,${r() * 0.06})`; ctx.beginPath(); ctx.arc(r() * w, r() * h, 2 + r() * 30, 0, 7); ctx.fill(); }
    ctx.lineWidth = 14; ctx.strokeStyle = '#b8860b'; ctx.strokeRect(40, 40, w - 80, h - 80); ctx.lineWidth = 4; ctx.strokeStyle = '#7a5a10'; ctx.strokeRect(64, 64, w - 128, h - 128);
    ctx.lineWidth = 2; ctx.strokeStyle = '#d4a940'; ctx.strokeRect(76, 76, w - 152, h - 152);
    [[90, 90, 1, 1], [w - 90, 90, -1, 1], [90, h - 90, 1, -1], [w - 90, h - 90, -1, -1]].forEach(([x, y, sx, sy]) => { ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); ctx.beginPath(); ctx.moveTo(0, 70); ctx.quadraticCurveTo(0, 0, 70, 0); ctx.moveTo(10, 50); ctx.quadraticCurveTo(20, 20, 50, 10); ctx.lineWidth = 5; ctx.strokeStyle = '#b8860b'; ctx.stroke(); Art.ell(ctx, 18, 18, 9, 9); ctx.fillStyle = '#d4a940'; ctx.fill(); ctx.restore(); });
    // Korallen
    const coral = (x, s, col) => { ctx.save(); ctx.translate(x, h - 82); ctx.scale(s, s); ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = 12; [[0, -120, -40], [0, -90, 40], [-30, -60, -70], [30, -50, 70]].forEach(([x0, y1, x2]) => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(x0, y1 * 0.6, x2 * 0.6, y1); ctx.stroke(); }); ctx.restore(); };
    coral(150, 1, '#e86a6a'); coral(230, 0.7, '#ff9a5a'); coral(w - 150, 1, '#c86ae8'); coral(w - 230, 0.7, '#e86a9a');
    ctx.textAlign = 'center';
    const gt = ctx.createLinearGradient(0, 120, 0, 220); gt.addColorStop(0, '#2a8ad8'); gt.addColorStop(1, '#0a4a8a');
    ctx.font = 'bold 110px Fredoka, sans-serif'; ctx.lineWidth = 10; ctx.strokeStyle = '#ffd23a'; ctx.strokeText('OCEANQUEST', w / 2, 210); ctx.fillStyle = gt; ctx.fillText('OCEANQUEST', w / 2, 210);
    ctx.font = 'bold 56px Fredoka, sans-serif'; ctx.fillStyle = '#7a4a10'; ctx.fillText('MEISTER DER 8 MEERE', w / 2, 290);
    ctx.font = '600 30px Fredoka, sans-serif'; ctx.fillStyle = '#4a3010'; ctx.fillText('Herzlichen Glückwunsch!', w / 2, 360);
    const nm = d.childName ? `${d.childName} mit Delfin ${d.name}` : `Delfin ${d.name}`;
    ctx.font = 'bold 64px Fredoka, sans-serif'; ctx.fillStyle = '#0a3a6a'; ctx.fillText(nm, w / 2, 445);
    ctx.beginPath(); ctx.moveTo(w / 2 - 420, 470); ctx.lineTo(w / 2 + 420, 470); ctx.lineWidth = 3; ctx.strokeStyle = '#b8860b'; ctx.stroke();
    ctx.font = '500 28px Fredoka, sans-serif'; ctx.fillStyle = '#3a2a10';
    ['Du hast alle acht Meeresbosse besiegt, die Geheimnisse der Tiefsee entdeckt', 'und Mbappé im großen Unterwasser-Finale ' + (d.exam.score || '') + ' geschlagen.', 'Du bist ein wahrer Meister der acht Meere!'].forEach((l, i) => ctx.fillText(l, w / 2, 520 + i * 42));
    // Bosse
    WORLDS.forEach((W, i) => { const x = 330 + i * 134, y = 735; Art.ell(ctx, x, y, 56, 56); Art.fillS(ctx, '#0a4a7a', 5, '#d4a940'); ctx.save(); ctx.beginPath(); ctx.arc(x, y, 52, 0, 7); ctx.clip(); Art.drawBoss(ctx, W.boss, x, y + 6, 0.22, { t: 0 }); ctx.restore(); ctx.font = 'bold 20px Fredoka, sans-serif'; ctx.fillStyle = '#3a2a10'; ctx.fillText(W.bossName + ' ✔', x, y + 82); });
    // Werte
    ctx.font = '600 26px Fredoka, sans-serif'; ctx.fillStyle = '#3a2a10';
    const total = WORLDS.reduce((a, x) => a + (d.best[x.id] ? d.best[x.id].score : 0), 0);
    ctx.fillText(`Gesamtpunktzahl: ${fmt(total)}   ·   Gesamtspielzeit: ${fmtTime(d.playTime)}   ·   Finale: ${d.exam.score || '–'}`, w / 2, 885);
    ctx.textAlign = 'left'; ctx.fillText('Datum: ' + (d.exam.date || new Date().toLocaleDateString('de-DE')), 150, 990);
    ctx.textAlign = 'center'; ctx.font = 'bold 34px Fredoka, sans-serif'; ctx.fillStyle = '#0a4a8a'; ctx.fillText('VoytsQuest', w / 2, 1000); ctx.font = '500 18px Fredoka, sans-serif'; ctx.fillStyle = '#5a4a2a'; ctx.fillText('Lernspiele mit Abenteuer', w / 2, 1026);
    // Delfin + Siegel
    Art.drawDolphin(ctx, { x: 210, y: 300, facing: 1, color: d.color, t: 0.3, cos: Save.cosmetics(), scale: 1.6, happy: true });
    ctx.save(); ctx.translate(w - 250, 985); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; Art.ell(ctx, Math.cos(a) * 70, Math.sin(a) * 70, 20, 20); ctx.fillStyle = '#a81a2a'; ctx.fill(); }
    Art.ell(ctx, 0, 0, 76, 76); Art.fillS(ctx, '#c8283a', 4, '#7a0a1a'); Art.ell(ctx, 0, 0, 58, 58); Art.stroke(ctx, 3, '#ffb0b0');
    ctx.font = 'bold 18px Fredoka, sans-serif'; ctx.fillStyle = '#ffe0e0'; ctx.textAlign = 'center'; ctx.fillText('8 MEERE', 0, -24); Art.drawPearl(ctx, 0, 10, 0, 18, true); ctx.restore();
    ctx.restore();
  }
  function renderCertScreen() {
    const d = S(); if (!d.exam.passed) { show('worlds'); return; }
    ui.innerHTML = header('Deine Urkunde') + `<div class="certwrap"><canvas id="certcv" width="1600" height="1131"></canvas>
      <div class="certside"><label class="lbl small">Dein Name (freiwillig):<input id="cn2" maxlength="30" value="${esc(d.childName)}" placeholder="Name des Kindes"></label>
      ${/claude/.test(location.hostname) && window.top !== window.self ? '<p class="note">Drucken und PDF-Export funktionieren in der veröffentlichten Version (z. B. GitHub Pages).</p>' : '<button class="btn gold" data-act="print">🖨 Drucken</button><button class="btn gold" data-act="pdf">📄 Als PDF speichern</button>'}<button class="btn" data-act="goto" data-arg="worlds">🗺 Weltkarte</button></div></div>`;
    const cv = $('#certcv'); drawCertificate(cv); Sound.sfx('certificate');
    $('#cn2').addEventListener('input', e => { d.childName = e.target.value.slice(0, 30); Save.save(); drawCertificate(cv); });
  }
  function printCert() {
    const cv = $('#certcv'); const pa = $('#print-area'); pa.innerHTML = ''; const img = new Image(); img.src = cv.toDataURL('image/png'); pa.appendChild(img);
    img.onload = () => setTimeout(() => window.print(), 50);
  }
  function pdfCert() {
    const cv = $('#certcv'); const data = atob(cv.toDataURL('image/jpeg', 0.92).split(',')[1]); const img = new Uint8Array(data.length); for (let i = 0; i < data.length; i++) img[i] = data.charCodeAt(i);
    const enc = s => new TextEncoder().encode(s); const parts = []; const offs = []; let len = 0;
    const push = p => { const b = typeof p === 'string' ? enc(p) : p; parts.push(b); len += b.length; };
    const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'.replace(/[\u0080-ÿ]/g, 'x'));
    const PW = 842, PH = 595; const content = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
    obj(3, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`));
    obj(4, () => { push(`<< /Type /XObject /Subtype /Image /Width ${cv.width} /Height ${cv.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`); push(img); push('\nendstream'); });
    obj(5, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    const xref = len; let x = 'xref\n0 6\n0000000000 65535 f \n'; for (let n = 1; n <= 5; n++) x += String(offs[n]).padStart(10, '0') + ' 00000 n \n';
    push(x + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    const blob = new Blob(parts, { type: 'application/pdf' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'OceanQuest-Urkunde.pdf'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('PDF wird heruntergeladen …');
  }
  UI._drawCertificate = drawCertificate;

  /* ---------- Menü-Hintergrund ---------- */
  let mt = 0;
  function renderMenuScene(ctx, dt) {
    mt += dt; tickAnims(mt);
    const th = WORLDS[0].theme; if (!menuBg) menuBg = Art.buildBackground(th, 1080);
    const g = ctx.createLinearGradient(0, 0, 0, 720); g.addColorStop(0, th.top); g.addColorStop(1, th.bottom); ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) { const bx = i * 240 - 100 + Math.sin(mt * 0.3 + i) * 30; const gg = ctx.createLinearGradient(0, 0, 0, 650); gg.addColorStop(0, `rgba(255,255,230,${0.12 + 0.05 * Math.sin(mt + i)})`); gg.addColorStop(1, 'rgba(255,255,230,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx + 80, 0); ctx.lineTo(bx + 260, 720); ctx.lineTo(bx + 110, 720); ctx.fill(); }
    ctx.restore();
    const off = -(mt * 20) % 2048; ctx.globalAlpha = 0.8; ctx.drawImage(menuBg.far, off, -300); ctx.drawImage(menuBg.far, off + 2048, -300); ctx.globalAlpha = 0.9;
    const off2 = -(mt * 45) % 2048; ctx.drawImage(menuBg.mid, off2, -340); ctx.drawImage(menuBg.mid, off2 + 2048, -340); ctx.globalAlpha = 1;
    // Säulen & Truhe
    for (const x of [70, 1180]) { Art.rr(ctx, x - 30, 360, 60, 360, 6); Art.fillS(ctx, '#9ab0b8', 4, '#3a5058'); for (let y = 380; y < 720; y += 36) { ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x + 30, y); Art.stroke(ctx, 2, 'rgba(40,60,70,0.4)'); } Art.rr(ctx, x - 44, 344, 88, 26, 6); Art.fillS(ctx, '#aac0c8', 4, '#3a5058'); }
    ctx.fillStyle = '#e8cf9a'; ctx.beginPath(); ctx.moveTo(0, 720); for (let x = 0; x <= 1280; x += 40) ctx.lineTo(x, 690 + Math.sin(x * 0.02) * 8); ctx.lineTo(1280, 720); ctx.fill();
    for (let i = 0; i < 26; i++) { const x = i * 52 + 10; ctx.beginPath(); ctx.moveTo(x, 705); for (let k = 1; k <= 5; k++) ctx.lineTo(x + Math.sin(mt * 1.5 + i + k * 0.6) * k * 3, 705 - k * (16 + (i * 7) % 18)); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.strokeStyle = i % 3 ? '#3aa84a' : '#e8608a'; ctx.stroke(); }
    Art.drawChest(ctx, 1040, 668, true, mt);
    const s = screen === 'main' ? 1 : 0.0;
    if (s) { const x = 640 + Math.sin(mt * 0.5) * 420, y = 520 + Math.sin(mt * 1.1) * 60; const f = Math.cos(mt * 0.5) > 0 ? 1 : -1; Art.drawDolphin(ctx, { x, y, facing: f, angle: Math.cos(mt * 1.1) * 0.25 * f, color: S().color, t: mt, cos: Save.cosmetics(), scale: 1.5, speed: 0.6 }); }
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 30; i++) { const px = (i * 173) % 1280 + Math.sin(mt + i) * 8, py = 720 - ((mt * (25 + i % 6 * 9) + i * 97) % 760); ctx.beginPath(); ctx.arc(px, py, 2 + i % 5, 0, 7); ctx.stroke(); }
    ctx.fillStyle = 'rgba(4,20,45,0.25)'; ctx.fillRect(0, 0, 1280, 720);
  }

  root.UI = UI;
})(window);

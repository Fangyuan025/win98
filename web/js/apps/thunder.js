/* thunder.js — Thunder Wing 98: the vertical-scrolling shooter every 1998
   arcade corner had. Original craft, original goons. Arrows move, SPACE
   holds a stream of fire, B spends a bomb when the screen disagrees with
   you. Power chips stack your guns to triple-spread; a boss caps every
   level. High score survives reboots. */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.thunder = {
  name: "Thunder Wing 98", icon: "thunder", single: true,
  launch() {
    const W = 360, H = 440;
    let player, shots, foes, fireballs, drops, stars, score, lives, level,
      power, bombs, wave, frame, state, invulnT, bossOut, timer;
    let sparks, rings, flashT, shakeT;
    const keys = {};

    const win = WM.create({
      title: "Thunder Wing 98", icon: "thunder", appId: "thunder",
      width: W + 16, height: H + 74, resizable: false, maximizable: false,
      onClose: () => clearInterval(timer),
      statusbar: [{ text: "Score: 0" }, { text: "Lives: 3", width: 70 }, { text: "High: 0", width: 100 }],
      menus: [
        { label: "Game", items: () => [
          { label: "New Game", accel: "F2", click: newGame },
          { label: "Pause", accel: "P", click: togglePause },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Help", items: () => [
          { label: "How to Play", click: () => WM.msgbox({
            title: "Thunder Wing 98", icon: "info", width: 360,
            text: W98.tr("Arrows move. SPACE fires (hold it). B drops a bomb — it clears every bullet and hurts everything on screen.\n\nP chips upgrade your guns, L is a spare craft, B is a spare bomb. A boss guards the end of every level.\n\nThe sky scrolls forever. So did 1998.")
          })},
          "-",
          { label: "About Thunder Wing 98", click: () => Dialogs.about("Thunder Wing 98", "thunder", ["Original craft, original goons.", "Best played leaning forward."]) }
        ]}
      ]
    });
    const cv = el("canvas", { width: W, height: H, style: "display:block;background:#000" });
    win.body.append(cv);
    const x = cv.getContext("2d");

    /* ---------- original synth: pew-pew and booms, nothing borrowed ---------- */
    const AU = () => Sound.audio && Sound.audio();
    function sfx(kind) {
      const bus = AU(); if (!bus) return;
      const ac = bus.ctx, t = ac.currentTime;
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(bus.master);
      if (kind === "pew") {
        o.type = "square";
        o.frequency.setValueAtTime(880, t);
        o.frequency.exponentialRampToValueAtTime(220, t + 0.08);
        g.gain.setValueAtTime(0.016, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        o.start(t); o.stop(t + 0.1);
      } else if (kind === "pow") {
        o.type = "triangle";
        [523, 659, 784, 1047].forEach((f, i) => o.frequency.setValueAtTime(f, t + i * 0.05));
        g.gain.setValueAtTime(0.05, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
        o.start(t); o.stop(t + 0.26);
      } else {                                     /* "hit": the bad sound */
        o.type = "sawtooth";
        o.frequency.setValueAtTime(160, t);
        o.frequency.exponentialRampToValueAtTime(40, t + 0.4);
        g.gain.setValueAtTime(0.09, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
        o.start(t); o.stop(t + 0.45);
      }
    }
    function boomSfx(big) {
      const bus = AU(); if (!bus) return;
      const ac = bus.ctx, t = ac.currentTime, dur = big ? 0.7 : 0.22;
      const buf = ac.createBuffer(1, (ac.sampleRate * dur) | 0, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ac.createBufferSource(); src.buffer = buf;
      const f = ac.createBiquadFilter(); f.type = "lowpass";
      f.frequency.setValueAtTime(big ? 900 : 1600, t);
      f.frequency.exponentialRampToValueAtTime(80, t + dur);
      const g = ac.createGain(); g.gain.value = big ? 0.16 : 0.07;
      src.connect(f); f.connect(g); g.connect(bus.master);
      src.start(t);
      if (big) {                                   /* the floor shakes a little */
        const o = ac.createOscillator(), g2 = ac.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(70, t);
        o.frequency.exponentialRampToValueAtTime(28, t + dur);
        g2.gain.setValueAtTime(0.12, t);
        g2.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g2); g2.connect(bus.master);
        o.start(t); o.stop(t + dur + 0.05);
      }
    }

    function newGame() {
      player = { x: W / 2, y: H - 46 };
      shots = []; foes = []; fireballs = []; drops = [];
      sparks = []; rings = []; flashT = 0; shakeT = 0;
      score = 0; lives = 3; level = 1; power = 1; bombs = 1;
      wave = 0; frame = 0; invulnT = 0; bossOut = false;
      state = "play";
      stars = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.6 + Math.random() * 2 }));
      sync();
    }
    function sync() {
      win.setStatus(0, "Score: " + score);
      win.setStatus(1, "Lives: " + lives);
      win.setStatus(2, "High: " + Store.get("thunderHigh", 0) + "  Bombs: " + bombs);
    }
    function togglePause() {
      if (state === "play") state = "pause";
      else if (state === "pause") state = "play";
    }

    /* ---------- waves: drones dive, swayers wobble, gunners aim, a boss caps ---------- */
    function spawnWave() {
      wave++;
      if (!bossOut && wave % 8 === 0) {
        foes.push({ kind: "boss", x: W / 2, y: -40, vx: 1.1, hp: 30 + level * 12, r: 26, t: 0 });
        bossOut = true;
        return;
      }
      const kinds = ["drone", "drone", "swayer", level > 1 ? "gunner" : "drone"];
      const kind = kinds[(Math.random() * kinds.length) | 0];
      const n = kind === "drone" ? 3 + Math.min(3, level) : 2;
      for (let i = 0; i < n; i++) {
        const fx = 30 + Math.random() * (W - 60);
        if (kind === "drone") foes.push({ kind, x: fx, y: -14 - i * 26, vy: 2.2 + level * 0.3, hp: 1, r: 9 });
        else if (kind === "swayer") foes.push({ kind, x: fx, y: -14 - i * 40, vy: 1.6 + level * 0.2, hp: 2, r: 10, ph: Math.random() * 6 });
        else foes.push({ kind, x: fx, y: -16 - i * 44, vy: 1.4, hp: 3, r: 11, stopY: 70 + Math.random() * 70, cd: 50 });
      }
    }
    function dropMaybe(fx, fy) {
      const roll = Math.random();
      if (roll < 0.09) drops.push({ t: "P", x: fx, y: fy, vy: 1.4 });
      else if (roll < 0.13) drops.push({ t: "B", x: fx, y: fy, vy: 1.4 });
      else if (roll < 0.15) drops.push({ t: "L", x: fx, y: fy, vy: 1.4 });
    }
    function burst(fx, fy, n, col) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 3;
        sparks.push({ x: fx, y: fy, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          life: 14 + (Math.random() * 12) | 0, col });
      }
    }
    function boom(fx, fy, pts) {
      score += pts;
      burst(fx, fy, 8, "#ffb040");
      boomSfx(false);
      dropMaybe(fx, fy);
      sync();
    }
    function hitPlayer() {
      if (invulnT > 0) return;
      lives--;
      invulnT = 100;
      sfx("hit");
      sync();
      if (lives <= 0) {
        state = "over";
        const high = Store.get("thunderHigh", 0);
        if (score > high) Store.set("thunderHigh", score);
        setTimeout(() => {
          if (win.closed) return;
          WM.msgbox({
            title: "Thunder Wing 98", icon: "info",
            text: "Your wing goes down over the ocean.\n\nScore: " + score + "\nLevel: " + level +
              "\nHigh score: " + Math.max(high, score) + "\n\nFly again?",
            buttons: ["Yes", "No"]
          }).then(r => { if (r === "Yes") newGame(); });
        }, 400);
      }
    }
    function useBomb() {
      if (state !== "play" || bombs <= 0) return;
      bombs--;
      for (const b of fireballs) burst(b.x, b.y, 3, "#ff6040");
      fireballs = [];
      for (const f of foes) {
        f.hp -= 6;
        if (f.hp <= 0 && f.kind !== "boss") { boom(f.x, f.y, 50); burst(f.x, f.y, 10, "#ffe080"); }
        else burst(f.x, f.y, 5, "#ff6040");
      }
      foes = foes.filter(f => f.hp > 0);
      rings.push({ x: player.x, y: player.y, r: 6, v: 9, life: 34 },
                 { x: player.x, y: player.y, r: 2, v: 6.5, life: 34 });
      flashT = 5; shakeT = 14;
      boomSfx(true);
      sync();
    }

    function step() {
      if (state !== "play") { draw(); return; }
      frame++;
      if (invulnT > 0) invulnT--;
      /* stars drift, forever */
      for (const st of stars) { st.y += st.s; if (st.y > H) { st.y = -2; st.x = Math.random() * W; } }
      /* input */
      const sp = 4;
      if (keys.ArrowLeft) player.x = Math.max(12, player.x - sp);
      if (keys.ArrowRight) player.x = Math.min(W - 12, player.x + sp);
      if (keys.ArrowUp) player.y = Math.max(40, player.y - sp);
      if (keys.ArrowDown) player.y = Math.min(H - 14, player.y + sp);
      if (keys[" "] && frame % 7 === 0) {
        sfx("pew");
        shots.push({ x: player.x, y: player.y - 12, vx: 0 });
        if (power >= 2) shots.push({ x: player.x - 9, y: player.y - 6, vx: 0 });
        if (power >= 2) shots.push({ x: player.x + 9, y: player.y - 6, vx: 0 });
        if (power >= 3) shots.push({ x: player.x, y: player.y - 10, vx: -1.6 }, { x: player.x, y: player.y - 10, vx: 1.6 });
      }
      /* waves */
      if (frame % Math.max(46, 100 - level * 8) === 0) spawnWave();
      /* shots up */
      for (const s2 of shots) { s2.y -= 8; s2.x += s2.vx; }
      shots = shots.filter(s2 => s2.y > -10 && s2.x > -10 && s2.x < W + 10);
      /* foes move + shoot */
      for (const f of foes) {
        if (f.kind === "drone") f.y += f.vy;
        else if (f.kind === "swayer") { f.y += f.vy; f.ph += 0.09; f.x += Math.sin(f.ph) * 2.2; }
        else if (f.kind === "gunner") {
          if (f.y < f.stopY) f.y += f.vy;
          else if (--f.cd <= 0) {
            f.cd = Math.max(34, 64 - level * 5);
            const d = Math.hypot(player.x - f.x, player.y - f.y) || 1;
            fireballs.push({ x: f.x, y: f.y + 8, vx: (player.x - f.x) / d * 3, vy: (player.y - f.y) / d * 3 });
          }
        } else if (f.kind === "boss") {
          f.t++;
          if (f.y < 60) f.y += 1.2;
          else {
            f.x += f.vx;
            if (f.x < 50 || f.x > W - 50) f.vx *= -1;
            if (f.t % 26 === 0) for (let a = -1; a <= 1; a++)
              fireballs.push({ x: f.x, y: f.y + 20, vx: a * 1.7, vy: 3.1 });
          }
        }
      }
      foes = foes.filter(f => f.y < H + 30 && f.hp > 0);
      /* fireballs */
      for (const b of fireballs) { b.x += b.vx; b.y += b.vy; }
      fireballs = fireballs.filter(b => b.y < H + 10 && b.y > -10 && b.x > -10 && b.x < W + 10);
      /* drops drift down */
      for (const d of drops) d.y += d.vy;
      drops = drops.filter(d => d.y < H + 10);
      /* collisions: shots vs foes */
      for (const s2 of shots) {
        const f = foes.find(f2 => Math.abs(f2.x - s2.x) < f2.r + 3 && Math.abs(f2.y - s2.y) < f2.r + 5);
        if (f) {
          s2.dead = true; f.hp--;
          if (f.hp <= 0) {
            if (f.kind === "boss") {
              boom(f.x, f.y, 5000);
              level++; bossOut = false;
              boomSfx(true);
            } else boom(f.x, f.y, f.kind === "drone" ? 100 : f.kind === "swayer" ? 250 : 400);
          }
        }
      }
      shots = shots.filter(s2 => !s2.dead);
      foes = foes.filter(f => f.hp > 0);
      /* collisions: player vs everything sharp */
      if (invulnT <= 0) {
        if (fireballs.some(b => Math.hypot(b.x - player.x, b.y - player.y) < 10)) hitPlayer();
        else {
          const f = foes.find(f2 => Math.hypot(f2.x - player.x, f2.y - player.y) < f2.r + 8);
          if (f) { f.hp = 0; hitPlayer(); }
        }
      }
      /* drops */
      for (const d of drops) {
        if (Math.hypot(d.x - player.x, d.y - player.y) < 16) {
          d.got = true;
          if (d.t === "P") power = Math.min(3, power + 1);
          else if (d.t === "B") bombs++;
          else lives++;
          sfx("pow");
          sync();
        }
      }
      drops = drops.filter(d => !d.got);
      /* effects live their short lives */
      for (const p of sparks) { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life--; }
      sparks = sparks.filter(p => p.life > 0);
      for (const r of rings) { r.r += r.v; r.v *= 0.94; r.life--; }
      rings = rings.filter(r => r.life > 0);
      if (flashT > 0) flashT--;
      if (shakeT > 0) shakeT--;
      draw();
    }

    /* ---------- the pixels ---------- */
    function craft(px, py, flash) {
      x.fillStyle = flash ? "#fff" : "#b0c8e8";
      x.fillRect(px - 2, py - 12, 4, 18);
      x.fillStyle = flash ? "#fff" : "#5878b8";
      x.fillRect(px - 11, py - 2, 22, 6);
      x.fillRect(px - 6, py + 2, 12, 5);
      x.fillStyle = "#e8a030";
      x.fillRect(px - 2, py + 7, 4, 3 + ((frame >> 1) & 3));
    }
    function draw() {
      x.save();
      if (shakeT > 0) x.translate((Math.random() - 0.5) * shakeT, (Math.random() - 0.5) * shakeT);
      x.fillStyle = "#000010"; x.fillRect(-8, -8, W + 16, H + 16);
      x.fillStyle = "#405070";
      for (const st of stars) x.fillRect(st.x, st.y, st.s > 1.8 ? 2 : 1, st.s > 1.8 ? 2 : 1);
      for (const s2 of shots) { x.fillStyle = "#ffe080"; x.fillRect(s2.x - 1, s2.y - 5, 2, 7); }
      for (const f of foes) {
        if (f.kind === "boss") {
          x.fillStyle = "#a03030"; x.fillRect(f.x - 26, f.y - 14, 52, 28);
          x.fillStyle = "#d05050"; x.fillRect(f.x - 34, f.y - 4, 68, 10);
          x.fillStyle = "#ffe080"; x.fillRect(f.x - 4, f.y + 6, 8, 6);
          x.fillStyle = "#301010"; x.fillRect(f.x - 26, f.y - 20, 52, 4);
          x.fillStyle = "#40c040"; x.fillRect(f.x - 26, f.y - 20, 52 * Math.max(0, f.hp) / (30 + level * 12), 4);
        } else if (f.kind === "drone") {
          x.fillStyle = "#40a040"; x.fillRect(f.x - 8, f.y - 5, 16, 10);
          x.fillStyle = "#206020"; x.fillRect(f.x - 3, f.y - 8, 6, 6);
        } else if (f.kind === "swayer") {
          x.fillStyle = "#b070d0"; x.fillRect(f.x - 9, f.y - 4, 18, 9);
          x.fillStyle = "#7040a0"; x.fillRect(f.x - 4, f.y + 3, 8, 5);
        } else {
          x.fillStyle = "#c0a040"; x.fillRect(f.x - 10, f.y - 6, 20, 12);
          x.fillStyle = "#807020"; x.fillRect(f.x - 3, f.y + 4, 6, 6);
        }
      }
      for (const b of fireballs) { x.fillStyle = "#ff6040"; x.fillRect(b.x - 2, b.y - 2, 5, 5); }
      for (const d of drops) {
        x.fillStyle = d.t === "P" ? "#40c0ff" : d.t === "B" ? "#ffb040" : "#40ff80";
        x.fillRect(d.x - 7, d.y - 7, 14, 14);
        x.fillStyle = "#000"; x.font = "bold 10px monospace"; x.textAlign = "center";
        x.fillText(d.t, d.x, d.y + 4);
      }
      for (const p of sparks) {
        x.globalAlpha = Math.min(1, p.life / 10);
        x.fillStyle = p.col; x.fillRect(p.x - 1, p.y - 1, 3, 3);
      }
      x.globalAlpha = 1;
      for (const r of rings) {
        x.globalAlpha = r.life / 34;
        x.strokeStyle = "#a0d0ff"; x.lineWidth = 3;
        x.beginPath(); x.arc(r.x, r.y, r.r, 0, 7); x.stroke();
      }
      x.globalAlpha = 1;
      if (!(invulnT > 0 && (frame & 4))) craft(player.x, player.y, invulnT > 0);
      if (flashT > 0) {
        x.globalAlpha = flashT / 8;
        x.fillStyle = "#fff"; x.fillRect(-8, -8, W + 16, H + 16);
        x.globalAlpha = 1;
      }
      if (state === "pause") {
        x.fillStyle = "rgba(0,0,0,.5)"; x.fillRect(0, 0, W, H);
        x.fillStyle = "#fff"; x.font = "bold 16px monospace"; x.textAlign = "center";
        x.fillText("PAUSED", W / 2, H / 2);
      }
      if (state === "over") {
        x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(0, 0, W, H);
        x.fillStyle = "#ff6040"; x.font = "bold 18px monospace"; x.textAlign = "center";
        x.fillText("GAME OVER", W / 2, H / 2 - 8);
        x.fillStyle = "#c0c0c0"; x.font = "11px monospace";
        x.fillText("F2 to fly again", W / 2, H / 2 + 14);
      }
      x.restore();
    }

    win.el.addEventListener("keydown", (e) => {
      if (e.key === "F2") { e.preventDefault(); newGame(); return; }
      if (e.key === "p" || e.key === "P") { e.preventDefault(); togglePause(); return; }
      if (e.key === "b" || e.key === "B") { e.preventDefault(); useBomb(); return; }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) {
        keys[e.key] = true; e.preventDefault();
      }
    });
    win.el.addEventListener("keyup", (e) => { keys[e.key] = false; });
    win.el.addEventListener("focusout", (e) => {
      if (!win.el.contains(e.relatedTarget)) for (const k in keys) keys[k] = false;
    });
    win.el.tabIndex = -1;
    win.ctxMenu = () => [
      { label: "New Game", accel: "F2", click: () => win.el.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true })) }
    ];

    newGame();
    timer = setInterval(step, 30);
    setTimeout(() => win.el.focus(), 80);
    win._thunder = { state: () => ({
      player: { x: player.x, y: player.y }, score, lives, level, power, bombs, state,
      foes: foes.map(f => ({ kind: f.kind, x: f.x, y: f.y, r: f.r })),
      fireballs: fireballs.map(b => ({ x: b.x, y: b.y, vx: b.vx, vy: b.vy })),
      drops: drops.map(d => ({ t: d.t, x: d.x, y: d.y }))
    }) };
    return win;
  }
};

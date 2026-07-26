/* thunder.js — Thunder Wing 98: the vertical-scrolling shooter every 1998
   arcade corner had. Original craft, original goons. Arrows move, SPACE
   holds a stream of fire, B spends a bomb when the screen disagrees with you.

   Scripted formations (vees, sweeps, snake columns, flanking gunners,
   divers, tanks, drifting mines) unlock level by level on a real difficulty
   curve; a three-phase boss caps every level; kills chain into a combo
   multiplier; clear bonuses count your spare lives. High score survives
   reboots. */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.thunder = {
  name: "Thunder Wing 98", icon: "thunder", single: true,
  launch() {
    const W = 360, H = 440;
    let player, shots, foes, fireballs, drops, stars, score, lives, level,
      power, bombs, frame, state, invulnT, timer;
    let sparks, rings, flashT, shakeT;
    let script, scriptAt, nextWaveAt, bossWarnT, banner, bannerT, combo, comboT, clearT;
    const keys = {};

    const win = WM.create({
      title: "Thunder Wing 98", icon: "thunder", appId: "thunder",
      width: W + 16, height: H + 74, resizable: false, maximizable: false,
      onClose: () => { if (timer && timer.worker) timer.worker.terminate(); else clearInterval(timer); },
      statusbar: [{ text: "Score: 0" }, { text: "Lives: 3", width: 70 }, { text: "High: 0", width: 110 }],
      menus: [
        { label: "Game", items: () => [
          { label: "New Game", accel: "F2", click: () => newRun() },
          { label: "Pause", accel: "P", click: togglePause },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Help", items: () => [
          { label: "How to Play", click: () => WM.msgbox({
            title: "Thunder Wing 98", icon: "info", width: 380,
            text: W98.tr("Arrows move. SPACE fires (hold it). B drops a bomb — it clears every bullet and hurts everything on screen.\n\nP chips upgrade your guns, L is a spare craft, B is a spare bomb. Chain kills for a combo multiplier — it resets if you go quiet.\n\nEach level teaches the sky a new trick: sweeps, snake columns, flankers, divers, armored tanks, drifting mines. A three-phase boss guards every exit.\n\nThe sky scrolls forever. So did 1998.")
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
      } else if (kind === "warn") {                 /* the boss is coming */
        o.type = "square";
        o.frequency.setValueAtTime(220, t);
        o.frequency.setValueAtTime(175, t + 0.22);
        g.gain.setValueAtTime(0.05, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        o.start(t); o.stop(t + 0.5);
      } else if (kind === "clear") {                /* level clear jingle */
        o.type = "triangle";
        [392, 523, 659, 784, 1047].forEach((f, i) => o.frequency.setValueAtTime(f, t + i * 0.09));
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        o.start(t); o.stop(t + 0.55);
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
      if (big) {
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

    /* ================= the level book =================
       Difficulty comes from three dials turned together: which formations
       a level may draw from, how fast the sky moves (diff), and how little
       breathing room sits between waves. */
    const diff = () => 1 + (level - 1) * 0.13;
    const FORMS = {
      vee(d) {          /* five in a V, straight down */
        const cx2 = 60 + Math.random() * (W - 120);
        for (let i = -2; i <= 2; i++)
          foes.push({ kind: "drone", x: cx2 + i * 26, y: -14 - Math.abs(i) * 22, vy: 2.1 * d, hp: 1, r: 9 });
      },
      sweep(d) {        /* a rank crossing the sky, left or right */
        const dir = Math.random() < 0.5 ? 1 : -1;
        for (let i = 0; i < 5; i++)
          foes.push({ kind: "drone", x: dir > 0 ? -16 - i * 34 : W + 16 + i * 34,
            y: 40 + Math.random() * 80, vx: 2.6 * d * dir, vy: 0.5, hp: 1, r: 9 });
      },
      snake(d) {        /* a column that shares one sine wave */
        const fx = 60 + Math.random() * (W - 120), ph = Math.random() * 6;
        for (let i = 0; i < 6; i++)
          foes.push({ kind: "swayer", x: fx, y: -14 - i * 34, vy: 1.8 * d, hp: 2, r: 10, ph: ph - i * 0.55 });
      },
      flankers(d) {     /* gunners take both wings and open fire */
        [40, W - 40].forEach(fx => {
          for (let i = 0; i < 2; i++)
            foes.push({ kind: "gunner", x: fx + (fx < W / 2 ? i * 30 : -i * 30), y: -16 - i * 44,
              vy: 1.5 * d, hp: 3, r: 11, stopY: 60 + Math.random() * 60, cd: 50 });
        });
      },
      divers(d) {       /* they fall, they look at you, they commit */
        for (let i = 0; i < 3; i++)
          foes.push({ kind: "diver", x: 40 + Math.random() * (W - 80), y: -14 - i * 44,
            vy: 1.7 * d, hp: 2, r: 10, armT: 0 });
      },
      tanks(d) {        /* slow, armored, fan-firing */
        for (let i = 0; i < (level > 6 ? 2 : 1); i++)
          foes.push({ kind: "tank", x: 60 + Math.random() * (W - 120), y: -20 - i * 70,
            vy: 0.7 * d, hp: 8 + level, r: 15, cd: 70 });
      },
      mines(d) {        /* drift in, park, dare you to come close */
        for (let i = 0; i < 3; i++)
          foes.push({ kind: "mine", x: 40 + Math.random() * (W - 80), y: -14 - i * 40,
            vy: 1.1 * d, hp: 2, r: 10, stopY: 90 + Math.random() * 160, ph: Math.random() * 6 });
      }
    };
    /* which formations each level draws from (later levels use everything) */
    const UNLOCK = [
      ["vee", "vee", "sweep"],                                           /* L1 */
      ["vee", "sweep", "snake", "snake"],                                /* L2 */
      ["sweep", "snake", "flankers", "vee"],                             /* L3 */
      ["snake", "flankers", "divers", "sweep"],                          /* L4 */
      ["flankers", "divers", "tanks", "snake"],                          /* L5 */
      ["divers", "tanks", "mines", "flankers"]                           /* L6+ */
    ];
    function buildScript() {
      const pool = UNLOCK[Math.min(level, UNLOCK.length) - 1];
      const waves = 6 + Math.min(4, level);
      script = [];
      for (let i = 0; i < waves; i++) script.push(pool[(Math.random() * pool.length) | 0]);
      script.push("BOSS");
      scriptAt = 0;
      nextWaveAt = frame + 50;
    }
    function spawnBoss() {
      sfx("warn");
      foes.push({ kind: "boss", x: W / 2, y: -46, vx: 1.1 * diff(), hp: 40 + level * 20,
        hpMax: 40 + level * 20, r: 26, t: 0, phase: 1 });
    }

    function newRun() {
      score = 0; lives = 3; level = 1; power = 1; bombs = 1; combo = 0; comboT = 0;
      startLevel(true);
    }
    function startLevel(reset) {
      player = player && !reset ? player : { x: W / 2, y: H - 46 };
      shots = []; foes = []; fireballs = []; drops = [];
      sparks = []; rings = []; flashT = 0; shakeT = 0;
      frame = 0; invulnT = 60; bossWarnT = 0; clearT = 0;
      banner = "LEVEL " + level; bannerT = 80;
      state = "play";
      stars = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.6 + Math.random() * 2 }));
      buildScript();
      sync();
    }
    function sync() {
      win.setStatus(0, "Score: " + score + (combo > 1 ? "  x" + multi().toFixed(1) : ""));
      win.setStatus(1, "Lives: " + lives);
      win.setStatus(2, "Lv " + level + "  High: " + Store.get("thunderHigh", 0) + "  Bombs: " + bombs);
    }
    function togglePause() {
      if (state === "play") state = "pause";
      else if (state === "pause") state = "play";
    }
    const multi = () => Math.min(3, 1 + combo * 0.1);

    function dropMaybe(fx, fy) {
      const roll = Math.random();
      if (roll < 0.08) drops.push({ t: "P", x: fx, y: fy, vy: 1.4 });
      else if (roll < 0.12) drops.push({ t: "B", x: fx, y: fy, vy: 1.4 });
      else if (roll < 0.14) drops.push({ t: "L", x: fx, y: fy, vy: 1.4 });
    }
    function burst(fx, fy, n, col) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 3;
        sparks.push({ x: fx, y: fy, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          life: 14 + (Math.random() * 12) | 0, col });
      }
    }
    function boom(fx, fy, pts) {
      combo++; comboT = 66;                        /* two seconds to keep the chain */
      score += Math.round(pts * multi());
      burst(fx, fy, 8, "#ffb040");
      boomSfx(false);
      dropMaybe(fx, fy);
      sync();
    }
    function mineBlast(f) {
      burst(f.x, f.y, 12, "#ff6040");
      for (let a = 0; a < 8; a++)
        fireballs.push({ x: f.x, y: f.y, vx: Math.cos(a * Math.PI / 4) * 2.6, vy: Math.sin(a * Math.PI / 4) * 2.6 });
      boomSfx(false);
    }
    function hitPlayer() {
      if (invulnT > 0) return;
      lives--;
      invulnT = 100;
      burst(player.x, player.y, 26, "#b0c8e8");
      rings.push({ x: player.x, y: player.y, r: 4, v: 6, life: 26 });
      combo = 0; comboT = 0;
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
          }).then(r => { if (r === "Yes") newRun(); });
        }, 400);
      }
    }
    function useBomb() {
      if (state !== "play" || bombs <= 0) return;
      bombs--;
      for (const b of fireballs) burst(b.x, b.y, 3, "#ff6040");
      fireballs = [];
      for (const f of foes) {
        f.hp -= 6; f.flash = 3;
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
    function levelClear() {
      const bonus = lives * 500 + bombs * 300;
      score += bonus;
      banner = "LEVEL " + level + " CLEAR   +" + bonus;
      bannerT = 90;
      state = "clear"; clearT = 80;
      sfx("clear");
      sync();
    }

    function step() {
      if (state === "clear") {
        if (--clearT <= 0) { level++; bombs++; startLevel(false); }
        draw(); return;
      }
      if (state !== "play") {
        if (state === "title")
          for (const st of stars) { st.y += st.s; if (st.y > H) { st.y = -2; st.x = Math.random() * W; } }
        draw(); return;
      }
      frame++;
      if (invulnT > 0) invulnT--;
      if (comboT > 0 && --comboT === 0) { combo = 0; sync(); }
      if (bannerT > 0) bannerT--;
      for (const st of stars) { st.y += st.s * (1 + level * 0.06); if (st.y > H) { st.y = -2; st.x = Math.random() * W; } }
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
      /* the script deals the next wave when its time comes */
      if (scriptAt < script.length && frame >= nextWaveAt && !foes.some(f => f.kind === "boss")) {
        const form = script[scriptAt++];
        if (form === "BOSS") { bossWarnT = 80; }
        else {
          FORMS[form](diff());
          nextWaveAt = frame + Math.max(40, 96 - level * 7);
        }
      }
      if (bossWarnT > 0 && --bossWarnT === 0) spawnBoss();
      /* shots up */
      for (const s2 of shots) { s2.y -= 8; s2.x += s2.vx; }
      shots = shots.filter(s2 => s2.y > -10 && s2.x > -10 && s2.x < W + 10);
      /* foes move + shoot */
      const d2 = diff();
      for (const f of foes) {
        if (f.flash) f.flash--;
        if (f.kind === "drone") { f.y += f.vy || 0; f.x += f.vx || 0; }
        else if (f.kind === "swayer") { f.y += f.vy; f.ph += 0.09; f.x += Math.sin(f.ph) * 2.2; }
        else if (f.kind === "diver") {
          f.y += f.vy;
          if (!f.locked && f.y > 100) {            /* pick a heading at you, once */
            f.locked = true;
            const dd = Math.hypot(player.x - f.x, player.y - f.y) || 1;
            f.vx = (player.x - f.x) / dd * 3.4 * d2;
            f.vy = (player.y - f.y) / dd * 3.4 * d2;
          }
          f.x += f.vx || 0;
        } else if (f.kind === "gunner") {
          if (f.y < f.stopY) f.y += f.vy;
          else if (--f.cd <= 0) {
            f.cd = Math.max(30, 62 - level * 4);
            const dd = Math.hypot(player.x - f.x, player.y - f.y) || 1;
            fireballs.push({ x: f.x, y: f.y + 8, vx: (player.x - f.x) / dd * 3 * d2, vy: (player.y - f.y) / dd * 3 * d2 });
          }
        } else if (f.kind === "tank") {
          f.y += f.vy;
          if (--f.cd <= 0) {
            f.cd = Math.max(48, 90 - level * 5);
            for (let a = -1; a <= 1; a++)
              fireballs.push({ x: f.x, y: f.y + 10, vx: a * 1.4 * d2, vy: 2.6 * d2 });
          }
        } else if (f.kind === "mine") {
          if (f.y < f.stopY) f.y += f.vy;
          else { f.ph += 0.05; f.x += Math.sin(f.ph) * 0.8; }
          if (Math.hypot(f.x - player.x, f.y - player.y) < 64) { f.hp = 0; f.blown = true; }
        } else if (f.kind === "boss") {
          f.t++;
          const ratio = f.hp / f.hpMax;
          f.phase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
          if (f.y < 60) f.y += 1.2;
          else {
            f.x += f.vx * (f.phase === 3 ? 1.7 : f.phase === 2 ? 1.35 : 1);
            if (f.x < 50 || f.x > W - 50) f.vx *= -1;
            if (f.phase === 1 && f.t % 26 === 0) {
              for (let a = -1; a <= 1; a++) fireballs.push({ x: f.x, y: f.y + 20, vx: a * 1.7, vy: 3.1 * d2 });
            } else if (f.phase === 2 && f.t % 38 === 0) {
              for (let a = 0; a < 8; a++)
                fireballs.push({ x: f.x, y: f.y + 10, vx: Math.cos(a * Math.PI / 4) * 2.2, vy: Math.sin(a * Math.PI / 4) * 2.2 + 1 });
            } else if (f.phase === 3) {
              if (f.t % 30 === 0) {
                const dd = Math.hypot(player.x - f.x, player.y - f.y) || 1;
                for (let sN = -1; sN <= 1; sN++)
                  fireballs.push({ x: f.x, y: f.y + 20,
                    vx: (player.x - f.x) / dd * 3.4 + sN * 0.9, vy: (player.y - f.y) / dd * 3.4 });
              }
              if (level > 1 && f.t % 22 === 0) fireballs.push({ x: Math.random() * W, y: -6, vx: 0, vy: 3.4 * d2 });
            }
          }
        }
      }
      /* mines that popped */
      for (const f of foes) if (f.blown) mineBlast(f);
      foes = foes.filter(f => f.y < H + 30 && f.x > -40 && f.x < W + 40 && f.hp > 0);
      /* fireballs */
      for (const b of fireballs) { b.x += b.vx; b.y += b.vy; }
      fireballs = fireballs.filter(b => b.y < H + 10 && b.y > -12 && b.x > -10 && b.x < W + 10);
      /* drops drift down */
      for (const d3 of drops) d3.y += d3.vy;
      drops = drops.filter(d3 => d3.y < H + 10);
      /* collisions: shots vs foes */
      for (const s2 of shots) {
        const f = foes.find(f2 => Math.abs(f2.x - s2.x) < f2.r + 3 && Math.abs(f2.y - s2.y) < f2.r + 5);
        if (f) {
          s2.dead = true; f.hp--; f.flash = 2;
          if (f.hp <= 0) {
            if (f.kind === "boss") {
              burst(f.x, f.y, 30, "#ffe080");
              rings.push({ x: f.x, y: f.y, r: 8, v: 8, life: 34 });
              boom(f.x, f.y, 5000 + level * 1000);
              boomSfx(true);
              levelClear();
            } else if (f.kind === "mine") { f.blown = true; f.hp = 0; }
            else boom(f.x, f.y, f.kind === "drone" ? 100 : f.kind === "swayer" ? 250 :
              f.kind === "diver" ? 300 : f.kind === "gunner" ? 400 : 600);
          }
        }
      }
      shots = shots.filter(s2 => !s2.dead);
      for (const f of foes) if (f.blown && f.hp <= 0 && f.kind === "mine") { mineBlast(f); boom(f.x, f.y, 350); }
      foes = foes.filter(f => f.hp > 0);
      /* collisions: player vs everything sharp */
      if (invulnT <= 0 && state === "play") {
        if (fireballs.some(b => Math.hypot(b.x - player.x, b.y - player.y) < 10)) hitPlayer();
        else {
          const f = foes.find(f2 => f2.kind !== "boss" && Math.hypot(f2.x - player.x, f2.y - player.y) < f2.r + 8);
          if (f) { f.hp = 0; burst(f.x, f.y, 8, "#ffb040"); hitPlayer(); }
          else if (foes.some(f2 => f2.kind === "boss" && Math.hypot(f2.x - player.x, f2.y - player.y) < 34)) hitPlayer();
        }
      }
      /* drops */
      for (const d3 of drops) {
        if (Math.hypot(d3.x - player.x, d3.y - player.y) < 16) {
          d3.got = true;
          if (d3.t === "P") power = Math.min(3, power + 1);
          else if (d3.t === "B") bombs++;
          else lives++;
          sfx("pow");
          sync();
        }
      }
      drops = drops.filter(d3 => !d3.got);
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
    function foePix(f) {
      const flash = f.flash > 0;
      if (f.kind === "boss") {
        x.fillStyle = flash ? "#fff" : (f.phase === 3 ? "#d04070" : f.phase === 2 ? "#c03850" : "#a03030");
        x.fillRect(f.x - 26, f.y - 14, 52, 28);
        x.fillStyle = flash ? "#fff" : "#d05050"; x.fillRect(f.x - 34, f.y - 4, 68, 10);
        x.fillStyle = "#ffe080"; x.fillRect(f.x - 4, f.y + 6, 8, 6);
        x.fillStyle = "#301010"; x.fillRect(f.x - 26, f.y - 20, 52, 4);
        x.fillStyle = "#40c040"; x.fillRect(f.x - 26, f.y - 20, 52 * Math.max(0, f.hp) / f.hpMax, 4);
      } else if (f.kind === "drone") {
        x.fillStyle = flash ? "#fff" : "#40a040"; x.fillRect(f.x - 8, f.y - 5, 16, 10);
        x.fillStyle = flash ? "#fff" : "#206020"; x.fillRect(f.x - 3, f.y - 8, 6, 6);
      } else if (f.kind === "swayer") {
        x.fillStyle = flash ? "#fff" : "#b070d0"; x.fillRect(f.x - 9, f.y - 4, 18, 9);
        x.fillStyle = flash ? "#fff" : "#7040a0"; x.fillRect(f.x - 4, f.y + 3, 8, 5);
      } else if (f.kind === "diver") {
        x.fillStyle = flash ? "#fff" : "#e05050"; x.fillRect(f.x - 7, f.y - 7, 14, 14);
        x.fillStyle = flash ? "#fff" : "#902020"; x.fillRect(f.x - 3, f.y + 5, 6, 5);
      } else if (f.kind === "tank") {
        x.fillStyle = flash ? "#fff" : "#708090"; x.fillRect(f.x - 15, f.y - 9, 30, 18);
        x.fillStyle = flash ? "#fff" : "#405060"; x.fillRect(f.x - 9, f.y - 13, 18, 6);
        x.fillStyle = "#ffe080"; x.fillRect(f.x - 2, f.y + 7, 4, 5);
      } else if (f.kind === "mine") {
        x.fillStyle = flash ? "#fff" : "#d0b040";
        x.fillRect(f.x - 6, f.y - 6, 12, 12);
        x.fillRect(f.x - 9, f.y - 2, 18, 4); x.fillRect(f.x - 2, f.y - 9, 4, 18);
      } else {
        x.fillStyle = flash ? "#fff" : "#c0a040"; x.fillRect(f.x - 10, f.y - 6, 20, 12);
        x.fillStyle = flash ? "#fff" : "#807020"; x.fillRect(f.x - 3, f.y + 4, 6, 6);
      }
    }
    function draw() {
      x.save();
      if (shakeT > 0) x.translate((Math.random() - 0.5) * shakeT, (Math.random() - 0.5) * shakeT);
      x.fillStyle = "#000010"; x.fillRect(-8, -8, W + 16, H + 16);
      x.fillStyle = "#405070";
      for (const st of stars) x.fillRect(st.x, st.y, st.s > 1.8 ? 2 : 1, st.s > 1.8 ? 2 : 1);
      if (state === "title") {
        x.textAlign = "center";
        x.fillStyle = "#5878b8"; x.font = "bold 26px monospace";
        x.fillText("THUNDER WING", W / 2, 150);
        x.fillStyle = "#e8a030"; x.fillText("98", W / 2, 182);
        craft(W / 2, 260, false);
        x.fillStyle = (Math.floor(Date.now() / 500) & 1) ? "#fff" : "#808080";
        x.font = "12px monospace";
        x.fillText("PRESS SPACE TO FLY", W / 2, 330);
        x.fillStyle = "#808080"; x.font = "11px monospace";
        x.fillText("HIGH SCORE  " + Store.get("thunderHigh", 0), W / 2, 360);
        x.restore(); return;
      }
      for (const s2 of shots) { x.fillStyle = "#ffe080"; x.fillRect(s2.x - 1, s2.y - 5, 2, 7); }
      for (const f of foes) foePix(f);
      for (const b of fireballs) { x.fillStyle = "#ff6040"; x.fillRect(b.x - 2, b.y - 2, 5, 5); }
      for (const d3 of drops) {
        x.fillStyle = d3.t === "P" ? "#40c0ff" : d3.t === "B" ? "#ffb040" : "#40ff80";
        x.fillRect(d3.x - 7, d3.y - 7, 14, 14);
        x.fillStyle = "#000"; x.font = "bold 10px monospace"; x.textAlign = "center";
        x.fillText(d3.t, d3.x, d3.y + 4);
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
      /* combo readout rides the top-right corner */
      if (combo > 1) {
        x.textAlign = "right"; x.font = "bold 12px monospace"; x.fillStyle = "#ffe080";
        x.fillText("x" + multi().toFixed(1) + "  " + combo + " CHAIN", W - 8, 16);
      }
      if (bossWarnT > 0 && (bossWarnT & 8)) {
        x.textAlign = "center"; x.fillStyle = "#ff4040"; x.font = "bold 20px monospace";
        x.fillText("!! WARNING !!", W / 2, H / 2 - 40);
      }
      if (bannerT > 0) {
        x.textAlign = "center";
        x.globalAlpha = Math.min(1, bannerT / 20);
        x.fillStyle = "#fff"; x.font = "bold 16px monospace";
        x.fillText(banner, W / 2, H / 2 - 70);
        x.globalAlpha = 1;
      }
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
      if (e.key === "F2") { e.preventDefault(); newRun(); return; }
      if (state === "title" && e.key === " ") { e.preventDefault(); newRun(); return; }
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

    /* boot into the title card */
    player = { x: W / 2, y: H - 46 };
    shots = []; foes = []; fireballs = []; drops = [];
    sparks = []; rings = []; flashT = 0; shakeT = 0;
    score = 0; lives = 3; level = 1; power = 1; bombs = 1; combo = 0; comboT = 0;
    frame = 0; invulnT = 0; bossWarnT = 0; bannerT = 0; banner = ""; clearT = 0;
    script = []; scriptAt = 0; nextWaveAt = 0;
    state = "title";
    stars = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.6 + Math.random() * 2 }));
    /* worker-driven heartbeat: page timers throttle to 1s when the window is
       hidden, and a shmup that time-dilates is no shmup at all */
    let tickWorker = null;
    try {
      tickWorker = new Worker(URL.createObjectURL(new Blob(
        ["setInterval(function(){postMessage(1)},30)"], { type: "application/javascript" })));
      tickWorker.onmessage = () => { if (!win.closed) step(); };
      timer = { worker: tickWorker };
    } catch (e) {
      timer = setInterval(step, 30);
    }
    setTimeout(() => win.el.focus(), 80);

    win._thunder = { state: () => ({
      player: { x: player.x, y: player.y }, score, lives, level, power, bombs, state, combo,
      foes: foes.map(f => ({ kind: f.kind, x: f.x, y: f.y, r: f.r, phase: f.phase })),
      fireballs: fireballs.map(b => ({ x: b.x, y: b.y, vx: b.vx, vy: b.vy })),
      drops: drops.map(d3 => ({ t: d3.t, x: d3.x, y: d3.y }))
    }) };
    return win;
  }
};

/* corridor.js — CORRIDOR 98: a textured raycasting shooter.
   Original engine, original goo monsters, original questionable level design.
   The year is 1998 and something is loose in the maintenance tunnels. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  const LEVELS = [
    {
      name: "Maintenance Sublevel",
      map: [
        "################",
        "#P....#....A...#",
        "#.##..#..####..#",
        "#.#E..#........#",
        "#.#...####..#..#",
        "#.####....#.#E.#",
        "#......M..#.#..#",
        "###.####..#.##%#",
        "#...#..E..#..%X%",
        "#.M.#..####..%%%",
        "################"
      ]
    },
    {
      name: "The Server Farm",
      map: [
        "================",
        "=P...=....=...A=",
        "=.==.=.E..=.==.=",
        "=.=........=E..=",
        "=.=.====.=.=.===",
        "=...=EM=.=.....=",
        "===.=..=.====M.=",
        "=A..=..........=",
        "=.====.===.==.%=",
        "=......=E...M%X%",
        "================"
      ]
    },
    {
      name: "The Warm Room",
      map: [
        "%%%%%%%%%%%%%%%%",
        "%P.....%...E..A%",
        "%.%%%..%..%%%..%",
        "%.%.E..%..%.%..%",
        "%.%....%..%.%.E%",
        "%.%%%%.%%.%.%..%",
        "%......EM.%.%%.%",
        "%.%%%%%%%%%...E%",
        "%.A..M....%%%.=%",
        "%%%%%%%.E....%X%",
        "%%%%%%%%%%%%%%%%"
      ]
    }
  ];

  /* procedural wall textures, 32x32 */
  function makeTex(kind) {
    const c = document.createElement("canvas");
    c.width = 32; c.height = 32;
    const x = c.getContext("2d");
    if (kind === "#") {              /* red brick */
      x.fillStyle = "#7a2818"; x.fillRect(0, 0, 32, 32);
      x.fillStyle = "#93321e";
      for (let r = 0; r < 4; r++)
        for (let b = 0; b < 2; b++)
          x.fillRect((b * 16 + (r % 2) * 8 + 1) % 32, r * 8 + 1, 14, 6);
      x.fillStyle = "rgba(0,0,0,0.25)";
      for (let i = 0; i < 26; i++) x.fillRect((i * 13) % 32, (i * 7) % 32, 1, 1);
    } else if (kind === "=") {       /* tech panel */
      x.fillStyle = "#3c4448"; x.fillRect(0, 0, 32, 32);
      x.fillStyle = "#4a565c"; x.fillRect(2, 2, 28, 28);
      x.strokeStyle = "#2a3034"; x.lineWidth = 1;
      x.strokeRect(2.5, 2.5, 27, 27);
      x.fillStyle = "#20e040"; x.fillRect(6, 6, 3, 2);
      x.fillStyle = "#e0a020"; x.fillRect(11, 6, 3, 2);
      x.fillStyle = "#béton" ; /* deliberate no-op guard */
      x.fillStyle = "#283034";
      for (let i = 0; i < 4; i++) x.fillRect(6, 12 + i * 4, 20, 2);
      x.fillStyle = "#606c74"; x.fillRect(26, 26, 3, 3);
    } else {                          /* % slime stone */
      x.fillStyle = "#2e4030"; x.fillRect(0, 0, 32, 32);
      x.fillStyle = "#3c5440";
      for (let i = 0; i < 12; i++) {
        const px = (i * 11) % 30, py = (i * 17) % 30;
        x.fillRect(px, py, 4 + i % 4, 3 + i % 3);
      }
      x.fillStyle = "#58c058";
      x.fillRect(4, 0, 2, 10 + (3 % 5)); x.fillRect(18, 0, 3, 16); x.fillRect(27, 0, 2, 7);
      x.fillStyle = "#78e078"; x.fillRect(18, 14, 3, 3);
    }
    return c;
  }

  W98.Apps.corridor = {
    name: "CORRIDOR 98", icon: "corridor", single: true,
    launch() {
      const VW = 480, VH = 260, HUD_H = 46;
      const FOV = Math.PI / 3;
      const TEX = { "#": makeTex("#"), "=": makeTex("="), "%": makeTex("%") };

      const win = WM.create({
        title: "CORRIDOR 98", icon: "corridor", appId: "corridor",
        width: VW + 16, height: VH + HUD_H + 76, resizable: false, maximizable: false,
        statusbar: [{ text: "Find the exit. Mind the goo." }],
        menus: [
          { label: "Game", items: () => [
            { label: "New Game", accel: "F2", click: () => startLevel(0, true) },
            "-",
            { label: "Exit", click: () => win.close() }
          ]},
          { label: "Help", items: () => [
            { label: "How to Play", click: () => WM.msgbox({
              title: "CORRIDOR 98", icon: "info", width: 380,
              text: "Arrows / WASD move and turn (A and D strafe).\nSPACE or CTRL fires the zapper.\n\nGreen goo monsters want a hug. Do not accept the hug.\nMedkits (+25) and cells (+8 ammo) help.\nFind the pulsing exit panel on each of the 3 sublevels.\n\nThis machine runs it in software mode, like everything in 1998."
            })},
            "-",
            { label: "About CORRIDOR 98", click: () => Dialogs.about("CORRIDOR 98", "corridor", ["Software-rendered. Hardware-regretted.", "No goo was harmed beyond what was necessary."]) }
          ]}
        ],
        onClose: () => stop()
      });
      const cv = el("canvas", { width: String(VW), height: String(VH + HUD_H), style: "display:block;margin:0 auto;background:#000" });
      const x = cv.getContext("2d");
      win.body.append(cv);
      win.body.style.alignItems = "center";

      /* ---------- state ---------- */
      let map, mw, mh, level = 0;
      let px2 = 2, py2 = 2, ang = 0;
      let hp, ammo, enemies, pickups, over, won, flashT, hurtT, faceT, kills, startAt;
      let timer = null, last = 0;
      const keys = {};
      const zbuf = new Float32Array(VW);

      const wallAt = (mx, my) => {
        const c = map[my | 0] && map[my | 0][mx | 0];
        return (c === "#" || c === "=" || c === "%") ? c : null;
      };
      const solid = (mx, my) => !!wallAt(mx, my);

      function startLevel(n, reset) {
        level = n;
        const L = LEVELS[n];
        map = L.map.map(r => r.split(""));
        mh = map.length; mw = map[0].length;
        enemies = []; pickups = [];
        for (let yy = 0; yy < mh; yy++) for (let xx = 0; xx < mw; xx++) {
          const c = map[yy][xx];
          if (c === "P") { px2 = xx + 0.5; py2 = yy + 0.5; ang = 0; map[yy][xx] = "."; }
          else if (c === "E") { enemies.push({ x: xx + 0.5, y: yy + 0.5, hp: 30, state: "idle", ph: Math.random() * 6, painT: 0 }); map[yy][xx] = "."; }
          else if (c === "M") { pickups.push({ x: xx + 0.5, y: yy + 0.5, kind: "med" }); map[yy][xx] = "."; }
          else if (c === "A") { pickups.push({ x: xx + 0.5, y: yy + 0.5, kind: "ammo" }); map[yy][xx] = "."; }
        }
        if (reset) { hp = 100; ammo = 24; kills = 0; startAt = Date.now(); }
        over = false; won = false; flashT = 0; hurtT = 0; faceT = 0;
        win.setStatus(0, "Level " + (n + 1) + ": " + L.name);
        run();
      }

      function stop() { clearTimeout(timer); timer = null; }
      function run() {
        stop();
        last = performance.now();
        const loop = () => {
          if (win.closed) return;
          const now = performance.now();
          let steps = Math.min(6, Math.max(1, Math.round((now - last) / 33)));
          last = now;
          while (steps--) step();
          draw();
          timer = setTimeout(loop, 33);
        };
        loop();
      }

      function tryMove(nx, ny) {
        const R = 0.28;
        if (!solid(nx + R, py2) && !solid(nx - R, py2)) px2 = nx;
        if (!solid(px2, ny + R) && !solid(px2, ny - R)) py2 = ny;
      }

      function step() {
        if (over || won) return;
        const sp = 0.075, ts = 0.055;
        if (keys.ArrowLeft) ang -= ts;
        if (keys.ArrowRight) ang += ts;
        let mx = 0, my = 0;
        if (keys.ArrowUp || keys.w) { mx += Math.cos(ang) * sp; my += Math.sin(ang) * sp; }
        if (keys.ArrowDown || keys.s) { mx -= Math.cos(ang) * sp; my -= Math.sin(ang) * sp; }
        if (keys.a) { mx += Math.cos(ang - Math.PI / 2) * sp; my += Math.sin(ang - Math.PI / 2) * sp; }
        if (keys.d) { mx += Math.cos(ang + Math.PI / 2) * sp; my += Math.sin(ang + Math.PI / 2) * sp; }
        if (mx || my) tryMove(px2 + mx, py2 + my);

        /* exit tile */
        if (map[py2 | 0][px2 | 0] === "X") {
          if (level + 1 < LEVELS.length) {
            Sound.play("tada");
            startLevel(level + 1, false);
          } else {
            won = true;
            const secs = ((Date.now() - startAt) / 1000) | 0;
            const best = Store.get("corridorBest", 0);
            if (!best || secs < best) Store.set("corridorBest", secs);
            setTimeout(() => {
              if (win.closed) return;
              WM.msgbox({
                title: "CORRIDOR 98", icon: "info",
                text: "You escaped the tunnels!\n\nTime: " + secs + "s   Goo dispatched: " + kills +
                  "\nBest time: " + Store.get("corridorBest", secs) + "s\n\nPlay again?",
                buttons: ["Yes", "No"]
              }).then(r => { if (r === "Yes") startLevel(0, true); });
            }, 500);
          }
          return;
        }
        /* pickups */
        pickups = pickups.filter(p => {
          if (Math.hypot(p.x - px2, p.y - py2) < 0.45) {
            if (p.kind === "med") { hp = Math.min(100, hp + 25); }
            else { ammo += 8; }
            Sound.play("ding");
            return false;
          }
          return true;
        });
        /* enemies */
        for (const en of enemies) {
          if (en.hp <= 0) continue;
          en.ph += 0.12;
          if (en.painT > 0) { en.painT--; continue; }
          const d = Math.hypot(en.x - px2, en.y - py2);
          if (d < 7 && lineOfSight(en.x, en.y)) en.state = "chase";
          if (en.state === "chase" && d > 0.7) {
            const es = 0.03;
            const exd = (px2 - en.x) / d * es, eyd = (py2 - en.y) / d * es;
            if (!solid(en.x + exd * 12, en.y)) en.x += exd;
            if (!solid(en.x, en.y + eyd * 12)) en.y += eyd;
          } else if (en.state === "chase" && d <= 0.7) {
            if ((en.biteT = (en.biteT || 0) + 1) > 18) {
              en.biteT = 0;
              hp -= 8; hurtT = 8; faceT = 30;
              Sound.play("error");
              if (hp <= 0) { hp = 0; die(); }
            }
          }
        }
        if (flashT > 0) flashT--;
        if (hurtT > 0) hurtT--;
        if (faceT > 0) faceT--;
      }
      function lineOfSight(ex, ey) {
        const d = Math.hypot(ex - px2, ey - py2);
        const steps2 = Math.ceil(d * 4);
        for (let i = 1; i < steps2; i++) {
          const t = i / steps2;
          if (solid(px2 + (ex - px2) * t, py2 + (ey - py2) * t)) return false;
        }
        return true;
      }
      function die() {
        over = true;
        Sound.play("bsod") || Sound.play("error");
        setTimeout(() => {
          if (win.closed) return;
          WM.msgbox({
            title: "CORRIDOR 98", icon: "warning",
            text: "The goo accepted your hug.\n\nGoo dispatched: " + kills + "\n\nTry again from level " + (level + 1) + "?",
            buttons: ["Yes", "No"]
          }).then(r => { if (r === "Yes") { hp = 100; ammo = 24; startLevel(level, false); } });
        }, 700);
      }

      function shoot() {
        if (over || won) return;
        if (ammo <= 0) { Sound.play("click"); return; }
        ammo--;
        flashT = 3;
        Sound.play("warn");
        /* hitscan: nearest living enemy near screen center, closer than the wall */
        let best = null, bestD = 1e9;
        for (const en of enemies) {
          if (en.hp <= 0) continue;
          const d = Math.hypot(en.x - px2, en.y - py2);
          let da = Math.atan2(en.y - py2, en.x - px2) - ang;
          while (da > Math.PI) da -= Math.PI * 2;
          while (da < -Math.PI) da += Math.PI * 2;
          if (Math.abs(da) < 0.09 + 0.25 / Math.max(1, d) && d < bestD && lineOfSight(en.x, en.y)) { best = en; bestD = d; }
        }
        if (best) {
          best.hp -= 15;
          best.painT = 5;
          best.state = "chase";
          if (best.hp <= 0) { kills++; Sound.play("recycle"); }
        }
      }

      /* ---------- rendering ---------- */
      function draw() {
        /* sky + floor */
        x.fillStyle = "#1a1a28"; x.fillRect(0, 0, VW, VH / 2);
        x.fillStyle = "#302820"; x.fillRect(0, VH / 2, VW, VH / 2);
        /* walls */
        for (let c = 0; c < VW; c++) {
          const ra = ang - FOV / 2 + (c / VW) * FOV;
          const cs = Math.cos(ra), sn = Math.sin(ra);
          /* DDA */
          let mapX = px2 | 0, mapY = py2 | 0;
          const dX = Math.abs(1 / (cs || 1e-9)), dY = Math.abs(1 / (sn || 1e-9));
          let stepX, stepY, sideX, sideY;
          if (cs < 0) { stepX = -1; sideX = (px2 - mapX) * dX; } else { stepX = 1; sideX = (mapX + 1 - px2) * dX; }
          if (sn < 0) { stepY = -1; sideY = (py2 - mapY) * dY; } else { stepY = 1; sideY = (mapY + 1 - py2) * dY; }
          let side = 0, tile = null, guard = 0;
          while (guard++ < 64) {
            if (sideX < sideY) { sideX += dX; mapX += stepX; side = 0; }
            else { sideY += dY; mapY += stepY; side = 1; }
            tile = wallAt(mapX, mapY);
            if (tile) break;
          }
          if (!tile) { zbuf[c] = 1e9; continue; }
          const dist = side === 0 ? (mapX - px2 + (1 - stepX) / 2) / (cs || 1e-9)
                                  : (mapY - py2 + (1 - stepY) / 2) / (sn || 1e-9);
          const cd = Math.max(0.05, dist * Math.cos(ra - ang));
          zbuf[c] = cd;
          const h = Math.min(VH * 2, VH / cd);
          const top = (VH - h) / 2;
          /* texture column */
          let wx = side === 0 ? py2 + dist * sn : px2 + dist * cs;
          wx -= Math.floor(wx);
          const tx = (wx * 32) | 0;
          x.drawImage(TEX[tile], tx, 0, 1, 32, c, top, 1, h);
          const shade = Math.min(0.75, cd / 9 + (side === 1 ? 0.18 : 0));
          if (shade > 0.03) { x.fillStyle = "rgba(0,0,0," + shade + ")"; x.fillRect(c, top, 1, h); }
        }
        /* sprites: enemies + pickups + exit glow, far to near */
        const sprites = [];
        for (const en of enemies) sprites.push({ x: en.x, y: en.y, kind: en.hp > 0 ? "goo" : "splat", en });
        for (const p of pickups) sprites.push({ x: p.x, y: p.y, kind: p.kind });
        for (let yy = 0; yy < mh; yy++) for (let xx = 0; xx < mw; xx++)
          if (map[yy][xx] === "X") sprites.push({ x: xx + 0.5, y: yy + 0.5, kind: "exit" });
        sprites.forEach(s => { s.d = Math.hypot(s.x - px2, s.y - py2); });
        sprites.sort((a, b) => b.d - a.d);
        for (const s of sprites) {
          let da = Math.atan2(s.y - py2, s.x - px2) - ang;
          while (da > Math.PI) da -= Math.PI * 2;
          while (da < -Math.PI) da += Math.PI * 2;
          if (Math.abs(da) > FOV / 2 + 0.4) continue;
          const cd = s.d * Math.cos(da);
          if (cd < 0.2) continue;
          const size = Math.min(VH * 1.5, VH / cd * 0.75);
          const sx2 = (da / FOV + 0.5) * VW;
          const top = VH / 2 - size / 2 + size * 0.12;
          drawSprite(s, sx2, top, size, cd);
        }
        /* muzzle flash */
        if (flashT > 0) {
          x.fillStyle = "rgba(255,240,140,0.6)";
          x.beginPath(); x.arc(VW / 2, VH - 26, 22 + flashT * 4, 0, 7); x.fill();
        }
        /* zapper */
        x.fillStyle = "#404850";
        x.fillRect(VW / 2 - 9, VH - 30, 18, 30);
        x.fillStyle = "#2a3038";
        x.fillRect(VW / 2 - 5, VH - 34, 10, 8);
        x.fillStyle = flashT > 0 ? "#ffe080" : "#70e0ff";
        x.fillRect(VW / 2 - 2, VH - 36, 4, 4);
        /* hurt tint */
        if (hurtT > 0) { x.fillStyle = "rgba(200,0,0," + (hurtT * 0.045) + ")"; x.fillRect(0, 0, VW, VH); }
        /* crosshair */
        x.strokeStyle = "rgba(255,255,255,0.7)"; x.lineWidth = 1;
        x.beginPath();
        x.moveTo(VW / 2 - 6, VH / 2); x.lineTo(VW / 2 - 2, VH / 2);
        x.moveTo(VW / 2 + 2, VH / 2); x.lineTo(VW / 2 + 6, VH / 2);
        x.moveTo(VW / 2, VH / 2 - 6); x.lineTo(VW / 2, VH / 2 - 2);
        x.moveTo(VW / 2, VH / 2 + 2); x.lineTo(VW / 2, VH / 2 + 6);
        x.stroke();
        drawHud();
        if (over) {
          x.fillStyle = "rgba(120,0,0,0.5)"; x.fillRect(0, 0, VW, VH);
          x.fillStyle = "#fff"; x.font = "bold 26px Arial"; x.textAlign = "center";
          x.fillText("YOU GOT GOO'D", VW / 2, VH / 2);
          x.font = "12px Arial"; x.fillText("F2 to try again", VW / 2, VH / 2 + 24);
          x.textAlign = "left";
        }
      }
      function drawSprite(s, sx2, top, size, cd) {
        /* per-column z-clip: draw in slices */
        const cols = Math.max(6, size / 6 | 0);
        const cw = size / cols;
        for (let i = 0; i < cols; i++) {
          const scrX = sx2 - size / 2 + i * cw;
          const zc = zbuf[Math.max(0, Math.min(VW - 1, scrX + cw / 2 | 0))];
          if (zc < cd) continue;
          x.save();
          x.beginPath(); x.rect(scrX, 0, cw + 0.5, VH); x.clip();
          paintSpriteBody(s, sx2, top, size);
          x.restore();
        }
      }
      function paintSpriteBody(s, cx2, top, size) {
        const b = size;
        if (s.kind === "goo") {
          const wob = Math.sin(s.en.ph) * b * 0.04;
          x.fillStyle = s.en.painT > 0 ? "#c0f0c0" : "#38b038";
          x.beginPath();
          x.ellipse(cx2, top + b * 0.62 + wob, b * 0.3, b * 0.34, 0, 0, 7);
          x.fill();
          x.fillStyle = s.en.painT > 0 ? "#e0ffe0" : "#58d058";
          x.beginPath();
          x.ellipse(cx2, top + b * 0.5 + wob, b * 0.22, b * 0.24, 0, 0, 7);
          x.fill();
          /* eyes */
          x.fillStyle = "#fff";
          x.beginPath(); x.arc(cx2 - b * 0.08, top + b * 0.44 + wob, b * 0.055, 0, 7); x.fill();
          x.beginPath(); x.arc(cx2 + b * 0.08, top + b * 0.44 + wob, b * 0.055, 0, 7); x.fill();
          x.fillStyle = "#102010";
          x.beginPath(); x.arc(cx2 - b * 0.07, top + b * 0.45 + wob, b * 0.025, 0, 7); x.fill();
          x.beginPath(); x.arc(cx2 + b * 0.09, top + b * 0.45 + wob, b * 0.025, 0, 7); x.fill();
          /* drip */
          x.fillStyle = "#38b038";
          x.beginPath(); x.ellipse(cx2 + b * 0.18, top + b * 0.85 + wob, b * 0.05, b * 0.08, 0, 0, 7); x.fill();
        } else if (s.kind === "splat") {
          x.fillStyle = "rgba(56,176,56,0.75)";
          x.beginPath();
          x.ellipse(cx2, top + b * 0.88, b * 0.32, b * 0.08, 0, 0, 7);
          x.fill();
          x.fillStyle = "rgba(88,208,88,0.6)";
          x.beginPath(); x.ellipse(cx2 - b * 0.1, top + b * 0.86, b * 0.09, b * 0.03, 0, 0, 7); x.fill();
        } else if (s.kind === "med") {
          x.fillStyle = "#e8e8e8";
          x.fillRect(cx2 - b * 0.12, top + b * 0.7, b * 0.24, b * 0.18);
          x.fillStyle = "#d02020";
          x.fillRect(cx2 - b * 0.03, top + b * 0.72, b * 0.06, b * 0.14);
          x.fillRect(cx2 - b * 0.08, top + b * 0.76, b * 0.16, b * 0.06);
        } else if (s.kind === "ammo") {
          x.fillStyle = "#3060a0";
          x.fillRect(cx2 - b * 0.09, top + b * 0.72, b * 0.18, b * 0.16);
          x.fillStyle = "#70e0ff";
          x.fillRect(cx2 - b * 0.05, top + b * 0.75, b * 0.1, b * 0.05);
        } else if (s.kind === "exit") {
          const pulse = 0.5 + Math.sin(performance.now() / 300) * 0.3;
          x.fillStyle = "rgba(120,240,255," + pulse * 0.5 + ")";
          x.fillRect(cx2 - b * 0.2, top + b * 0.2, b * 0.4, b * 0.7);
          x.fillStyle = "rgba(255,255,255," + pulse + ")";
          x.font = "bold " + (b * 0.16 | 0) + "px Arial";
          x.textAlign = "center";
          x.fillText("EXIT", cx2, top + b * 0.55);
          x.textAlign = "left";
        }
      }
      function drawHud() {
        const y0 = VH;
        x.fillStyle = "#3a3a42"; x.fillRect(0, y0, VW, HUD_H);
        x.fillStyle = "#22222a"; x.fillRect(0, y0, VW, 2);
        x.font = "bold 17px 'Courier New',monospace";
        x.fillStyle = hp > 30 ? "#40e040" : "#e04040";
        x.fillText("HP " + String(hp).padStart(3), 14, y0 + 29);
        x.fillStyle = "#70cfff";
        x.fillText("AMMO " + String(ammo).padStart(2), 116, y0 + 29);
        x.fillStyle = "#e0c040";
        x.fillText("L" + (level + 1) + "/3", 244, y0 + 29);
        x.fillStyle = "#c090e0";
        x.fillText("GOO " + kills, 306, y0 + 29);
        /* the face */
        const fx = VW - 52, fy = y0 + 5, fs = 36;
        x.fillStyle = "#c8a878"; x.fillRect(fx, fy, fs, fs);
        x.fillStyle = "#000";
        const hurt = faceT > 0;
        if (hp <= 0) {
          x.fillRect(fx + 7, fy + 12, 7, 3); x.fillRect(fx + 22, fy + 12, 7, 3);
          x.beginPath(); x.arc(fx + fs / 2, fy + 27, 5, 0, Math.PI, true); x.stroke();
        } else {
          x.fillRect(fx + 8, fy + 11 + (hurt ? 2 : 0), 5, 5);
          x.fillRect(fx + 23, fy + 11 + (hurt ? 2 : 0), 5, 5);
          x.strokeStyle = "#000"; x.lineWidth = 2;
          x.beginPath();
          if (hurt) x.arc(fx + fs / 2, fy + 30, 6, Math.PI * 1.15, Math.PI * 1.85);
          else if (hp > 60) x.arc(fx + fs / 2, fy + 24, 7, 0.2, Math.PI - 0.2);
          else { x.moveTo(fx + 10, fy + 28); x.lineTo(fx + 26, fy + 28); }
          x.stroke();
        }
        x.strokeStyle = "#22222a"; x.lineWidth = 2; x.strokeRect(fx, fy, fs, fs);
      }

      /* ---------- input ---------- */
      win.el.tabIndex = -1;
      const KEYMAP = { w: "w", a: "a", s: "s", d: "d", W: "w", A: "a", S: "s", D: "d" };
      win.el.addEventListener("keydown", (e) => {
        const k = KEYMAP[e.key] || e.key;
        if (k === " " || k === "Control") { shoot(); e.preventDefault(); return; }
        if (k === "F2") { e.preventDefault(); startLevel(0, true); return; }
        keys[k] = true;
        if (k.startsWith("Arrow")) e.preventDefault();
      });
      win.el.addEventListener("keyup", (e) => { keys[KEYMAP[e.key] || e.key] = false; });
      win.el.addEventListener("focusout", (e) => {
        if (!win.el.contains(e.relatedTarget)) for (const k in keys) keys[k] = false;
      });
      cv.addEventListener("mousedown", (e) => { win.el.focus(); if (e.button === 0) shoot(); });

      /* regression hook */
      win._fps = {
        state: () => ({ px: px2, py: py2, hp, ammo, level, kills, enemies: enemies.filter(e2 => e2.hp > 0).length, over, won }),
        warp: (nx, ny) => { px2 = nx; py2 = ny; },
        turn: (a) => { ang = a; },
        shoot,
        key: (k, down) => { keys[k] = down; }
      };

      win.ctxMenu = () => [
        { label: "New Game", accel: "F2", click: () => startLevel(0, true) }
      ];

      startLevel(0, true);
      setTimeout(() => win.el.focus(), 100);
      return win;
    }
  };
})();

/* pinball.js — Star Pilot Pinball. One physics path, no teleports:
   the ball climbs the launch lane and arcs over the top like it means it. */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.pinball = {
  name: "Star Pilot Pinball", icon: "pinball", single: true,
  launch() {
    const W = 340, H = 540, R = 7;
    const LANE_X = 312;                  // launch lane divider
    const LANE_FLOOR = H - 88;
    let ball, balls, extras, score, charging, charge, over, timer;
    let leftUp = false, rightUp = false, leftAng = 0, rightAng = 0;
    let popups = [];

    const win = WM.create({
      title: "Star Pilot Pinball", icon: "pinball", appId: "pinball",
      width: W + 16, height: H + 74, resizable: false, maximizable: false,
      statusbar: [{ text: "Score: 0" }, { text: "Balls: 3", width: 70 }, { text: "High: 0", width: 110 }],
      menus: [
        { label: "Game", items: () => [
          { label: "New Game", accel: "F2", click: newGame },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Help", items: () => [
          { label: "How to Play", click: () => WM.msgbox({
            title: "Star Pilot Pinball", icon: "info", width: 360,
            text: "Hold SPACE to charge the plunger, release to launch.\nZ flips the left flipper, / (or M) flips the right.\nClicking the left or right half of the table also flips.\n\nBumpers: 150. Slingshots: 50. Star gates up top: 50.\nLight all three star gates for MULTIBALL (+5000).\nThree balls per mission, pilot."
          })},
          "-",
          { label: "About Star Pilot Pinball", click: () => Dialogs.about("Star Pilot Pinball", "pinball", ["For the space cadet in all of us."]) }
        ]}
      ],
      onClose: () => clearInterval(timer)
    });
    const cv = el("canvas", { width: String(W), height: String(H), style: "display:block;margin:0 auto;background:#0a0a2a" });
    const x = cv.getContext("2d");
    win.body.append(cv);
    win.body.style.alignItems = "center";

    /* table geometry: segments [x1,y1,x2,y2] */
    const FL = { px: 100, py: 496, len: 62 };
    const FR = { px: 220, py: 496, len: 62 };
    const SEGS = [
      [2, 80, 2, H],                       // left wall
      [W - 2, 80, W - 2, LANE_FLOOR],      // right wall (lane side)
      [LANE_X, 130, LANE_X, LANE_FLOOR],   // lane divider (open above y=130)
      [LANE_X, LANE_FLOOR, W - 2, LANE_FLOOR],  // lane floor (plunger seat)
      [2, 80, 60, 14], [60, 14, 240, 4], [240, 4, W - 2, 80],   // rounded top
      [2, 400, 92, 468], [92, 468, FL.px - 2, FL.py - 4],       // left funnel → flipper
      [LANE_X, 400, 228, 468], [228, 468, FR.px + 2, FR.py - 4] // right funnel → flipper
    ];
    const BUMPERS = [
      { x: 110, y: 165, r: 22, col: "#e04040", pts: 150 },
      { x: 205, y: 135, r: 22, col: "#40c040", pts: 150 },
      { x: 168, y: 232, r: 22, col: "#e0a020", pts: 150 },
      { x: 70, y: 380, r: 13, col: "#3080e0", pts: 50 },
      { x: 250, y: 380, r: 13, col: "#3080e0", pts: 50 }
    ];
    /* star gates: pass-through sensors in the upper field */
    const GATES = [
      { x: 90, y: 84, cool: 0, lit: false },
      { x: 160, y: 62, cool: 0, lit: false },
      { x: 230, y: 84, cool: 0, lit: false }
    ];

    function blip(f, d) {
      const bus = Sound.audio();
      if (!bus) return;
      const o = bus.ctx.createOscillator(), g = bus.ctx.createGain();
      o.type = "square"; o.frequency.value = f;
      g.gain.setValueAtTime(0.05, bus.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, bus.ctx.currentTime + (d || 0.07));
      o.connect(g); g.connect(bus.master);
      o.start(); o.stop(bus.ctx.currentTime + (d || 0.07) + 0.02);
    }
    function pop(px, py, txt) {
      popups.push({ x: px, y: py, txt, t: 30 });
    }

    function newGame() {
      balls = 3; score = 0; over = false;
      popups = [];
      GATES.forEach(g2 => { g2.lit = false; });
      resetBall();
      sync();
    }
    function resetBall() {
      ball = { x: (LANE_X + W - 2) / 2, y: LANE_FLOOR - R - 1, vx: 0, vy: 0 };
      extras = [];
      charging = false; charge = 0;
    }
    function startMultiball() {
      GATES.forEach(g2 => { g2.lit = false; g2.cool = 60; });
      extras.push({ x: 140, y: 95, vx: -1.5, vy: 0 }, { x: 180, y: 95, vx: 1.5, vy: 0 });
      score += 5000;
      pop(160, 150, "MULTIBALL! +5000");
      [660, 880, 1100].forEach((f, i) => setTimeout(() => blip(f, 0.12), i * 90));
      sync();
    }
    const inLane = () => ball.x > LANE_X + R / 2;
    function sync() {
      win.setStatus(0, "Score: " + score.toLocaleString());
      win.setStatus(1, "Balls: " + balls);
      win.setStatus(2, "High: " + Store.get("pinballHigh", 0).toLocaleString());
    }

    function flipSeg(f, right, ang) {
      const base = right ? Math.PI - 0.52 : 0.52;
      const a = right ? base + ang : base - ang;
      return [f.px, f.py, f.px + Math.cos(a) * f.len * (right ? -1 : 1), f.py + Math.sin(a) * f.len];
    }

    function collideSeg(sx1, sy1, sx2, sy2, boost) {
      const dx = sx2 - sx1, dy = sy2 - sy1;
      const len2 = dx * dx + dy * dy || 1;
      let t = ((ball.x - sx1) * dx + (ball.y - sy1) * dy) / len2;
      t = clamp(t, 0, 1);
      const cx = sx1 + t * dx, cy = sy1 + t * dy;
      const ddx = ball.x - cx, ddy = ball.y - cy;
      const dist = Math.hypot(ddx, ddy);
      if (dist < R && dist > 0.001) {
        const nx = ddx / dist, ny = ddy / dist;
        const dot = ball.vx * nx + ball.vy * ny;
        if (dot < 0) {
          ball.vx -= 2 * dot * nx;
          ball.vy -= 2 * dot * ny;
          ball.vx *= 0.87; ball.vy *= 0.87;
        }
        ball.x = cx + nx * R;
        ball.y = cy + ny * R;
        if (boost) {
          ball.vx += nx * boost;
          ball.vy += ny * boost;
        }
        return true;
      }
      return false;
    }

    function step() {
      if (over) { draw(); return; }
      leftAng += ((leftUp ? 0.95 : 0) - leftAng) * 0.55;
      rightAng += ((rightUp ? 0.95 : 0) - rightAng) * 0.55;
      if (charging) charge = Math.min(16, charge + 0.35);

      const fls = flipSeg(FL, false, leftAng);
      const frs = flipSeg(FR, true, rightAng);
      const bodies = [ball, ...extras];
      for (const bb of bodies) {
        ball = bb;
        ball.vy += 0.25;
        ball.vx *= 0.999;
        ball.x += ball.vx;
        ball.y += ball.vy;
        const sp = Math.hypot(ball.vx, ball.vy);
        if (sp > 14) { ball.vx *= 14 / sp; ball.vy *= 14 / sp; }

        /* two resolution passes for stability in corners */
        for (let pass = 0; pass < 2; pass++) {
          for (const s of SEGS) collideSeg(s[0], s[1], s[2], s[3]);
        }
        for (const b of BUMPERS) {
          const d = Math.hypot(ball.x - b.x, ball.y - b.y);
          if (d < b.r + R && d > 0.001) {
            const nx = (ball.x - b.x) / d, ny = (ball.y - b.y) / d;
            ball.x = b.x + nx * (b.r + R);
            ball.y = b.y + ny * (b.r + R);
            const dot = ball.vx * nx + ball.vy * ny;
            if (dot < 0) { ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny; }
            const want = 6.5;
            const sp2 = Math.hypot(ball.vx, ball.vy) || 1;
            ball.vx = ball.vx / sp2 * want + nx * 1.6;
            ball.vy = ball.vy / sp2 * want + ny * 1.6;
            score += b.pts;
            b.flash = 6;
            pop(b.x, b.y - b.r - 6, "+" + b.pts);
            blip(b.pts > 100 ? 520 : 300);
            sync();
          }
        }
        for (const g2 of GATES) {
          if (g2.cool) continue;
          if (Math.hypot(ball.x - g2.x, ball.y - g2.y) < 12 + R) {
            g2.cool = 45;
            g2.lit = true;
            score += 50;
            pop(g2.x, g2.y - 14, g2.lit && GATES.every(g3 => g3.lit) ? "★ LIT ★" : "+50");
            blip(700, 0.05);
            sync();
          }
        }
        /* flippers */
        const hitL = collideSeg(fls[0], fls[1], fls[2], fls[3], leftUp && leftAng < 0.9 ? 9.5 : 0);
        const hitR = collideSeg(frs[0], frs[1], frs[2], frs[3], rightUp && rightAng < 0.9 ? 9.5 : 0);
        if ((hitL && leftUp && leftAng < 0.9) || (hitR && rightUp && rightAng < 0.9)) blip(180, 0.05);
      }
      ball = bodies[0];
      BUMPERS.forEach(b => { if (b.flash) b.flash--; });
      GATES.forEach(g2 => { if (g2.cool) g2.cool--; });

      /* all three star gates lit -> multiball */
      if (GATES.every(g2 => g2.lit) && extras.length === 0 && !inLane()) startMultiball();

      /* drains: extra balls vanish quietly; the last ball costs you */
      extras = extras.filter(b => b.y <= H + 20);
      if (ball.y > H + 20 && extras.length) {
        ball = extras.shift();
        blip(120, 0.15);
      } else if (ball.y > H + 20) {
        balls--;
        blip(90, 0.4);
        if (balls <= 0) {
          over = true;
          const high = Store.get("pinballHigh", 0);
          if (score > high) Store.set("pinballHigh", score);
          sync();
          setTimeout(() => {
            if (win.closed) return;
            WM.msgbox({
              title: "Star Pilot Pinball", icon: "info",
              text: "Mission over, pilot.\nFinal score: " + score.toLocaleString() +
                (score > high ? "\n\n★ NEW HIGH SCORE ★" : "\nHigh score: " + Math.max(high, score).toLocaleString()) +
                "\n\nFly again?",
              buttons: ["Yes", "No"]
            }).then(r => { if (r === "Yes") newGame(); });
          }, 400);
        } else resetBall();
        sync();
      }
      popups.forEach(p => { p.y -= 0.8; p.t--; });
      popups = popups.filter(p => p.t > 0);
      draw();
    }

    function draw() {
      x.fillStyle = "#0a0a2a";
      x.fillRect(0, 0, W, H);
      x.fillStyle = "#283060";
      for (let i = 0; i < 40; i++) x.fillRect((i * 73) % W, (i * 137) % H, 2, 2);
      x.strokeStyle = "#8090c0"; x.lineWidth = 3; x.lineCap = "round";
      SEGS.forEach(s => { x.beginPath(); x.moveTo(s[0], s[1]); x.lineTo(s[2], s[3]); x.stroke(); });
      /* star gates */
      GATES.forEach(g2 => {
        x.strokeStyle = g2.lit ? "#ffd020" : (g2.cool ? "#ffe060" : "#5060a0");
        x.lineWidth = g2.lit ? 2.4 : 1.6;
        const s = 8;
        x.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = i * Math.PI / 5 - Math.PI / 2, rr2 = i % 2 ? s * 0.45 : s;
          const px = g2.x + Math.cos(a) * rr2, py = g2.y + Math.sin(a) * rr2;
          i ? x.lineTo(px, py) : x.moveTo(px, py);
        }
        x.closePath(); x.stroke();
      });
      BUMPERS.forEach(b => {
        const g = x.createRadialGradient(b.x - 4, b.y - 4, 2, b.x, b.y, b.r);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.35, b.flash ? "#fff080" : b.col);
        g.addColorStop(1, "#101030");
        x.fillStyle = g;
        x.beginPath(); x.arc(b.x, b.y, b.r, 0, Math.PI * 2); x.fill();
        x.strokeStyle = b.flash ? "#fff" : "#c0c8e0"; x.lineWidth = 2; x.stroke();
      });
      const ls = flipSeg(FL, false, leftAng);
      const rs = flipSeg(FR, true, rightAng);
      x.strokeStyle = "#f0f0f0"; x.lineWidth = 10;
      [ls, rs].forEach(s => { x.beginPath(); x.moveTo(s[0], s[1]); x.lineTo(s[2], s[3]); x.stroke(); });
      /* plunger */
      const px0 = LANE_X + 4, pw = W - 6 - px0;
      x.fillStyle = "#803030";
      x.fillRect(px0, LANE_FLOOR + 2, pw, 6);
      x.fillStyle = "#c04040";
      x.fillRect(px0, LANE_FLOOR - 2 + charge, pw, 5);
      if (inLane() && Math.abs(ball.vy) < 0.5 && ball.y > LANE_FLOOR - 40) {
        x.fillStyle = "#f0f0f0"; x.font = "9px monospace";
        x.fillText("HOLD", LANE_X + 3, H - 20);
        x.fillText("SPACE", LANE_X + 1, H - 10);
      }
      for (const bb of [ball, ...extras]) {
        const bg = x.createRadialGradient(bb.x - 2, bb.y - 2, 1, bb.x, bb.y, R);
        bg.addColorStop(0, "#ffffff"); bg.addColorStop(1, "#707888");
        x.fillStyle = bg;
        x.beginPath(); x.arc(bb.x, bb.y, R, 0, Math.PI * 2); x.fill();
      }
      /* score popups */
      x.font = "bold 11px Arial"; x.textAlign = "center";
      popups.forEach(p => {
        x.fillStyle = "rgba(255,255,160," + (p.t / 30) + ")";
        x.fillText(p.txt, p.x, p.y);
      });
      x.textAlign = "left";
      if (over) {
        x.fillStyle = "rgba(0,0,0,0.55)"; x.fillRect(0, 200, W, 90);
        x.fillStyle = "#fff"; x.font = "bold 24px Arial"; x.textAlign = "center";
        x.fillText("GAME OVER", W / 2, 240);
        x.font = "12px Arial";
        x.fillText("F2 for a new mission", W / 2, 264);
        x.textAlign = "left";
      }
    }

    /* tiny state hook for automated regression tests */
    win._pb = {
      GATES,
      count: () => 1 + extras.length,
      ballAt: () => [ball.x, ball.y],
      place: (px, py) => { ball.x = px; ball.y = py; ball.vx = 0; ball.vy = -1; },
      ballsLeft: () => balls
    };

    win.el.tabIndex = -1;
    win.ctxMenu = () => [
      { label: "New Game", accel: "F2", click: () => win.el.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true })) }
    ];
    win.el.addEventListener("keydown", (e) => {
      if (e.key === "z" || e.key === "Z") { leftUp = true; e.preventDefault(); }
      else if (e.key === "/" || e.key === "m" || e.key === "M") { rightUp = true; e.preventDefault(); }
      else if (e.key === " ") { if (inLane()) charging = true; e.preventDefault(); }
      else if (e.key === "F2") { e.preventDefault(); newGame(); }
    });
    win.el.addEventListener("keyup", (e) => {
      if (e.key === "z" || e.key === "Z") leftUp = false;
      else if (e.key === "/" || e.key === "m" || e.key === "M") rightUp = false;
      else if (e.key === " ") {
        if (charging && inLane()) {
          ball.vy = -(6 + charge * 0.85);
          blip(240, 0.12);
        }
        charging = false; charge = 0;
      }
    });
    /* clicking the table always re-arms the keyboard, and flips for trackpads */
    cv.addEventListener("mousedown", (e) => {
      win.el.focus();
      if (e.button !== 0) return;
      const r = cv.getBoundingClientRect();
      const cxr = e.clientX - r.left;
      if (cxr > LANE_X && inLane()) {
        ball.vy = -13.5;
        blip(240, 0.12);
        return;
      }
      if (cxr < W / 2) { leftUp = true; setTimeout(() => leftUp = false, 150); }
      else { rightUp = true; setTimeout(() => rightUp = false, 150); }
    });

    newGame();
    let lastT = performance.now();
    timer = setInterval(() => {
      const now = performance.now();
      const steps = clamp(Math.round((now - lastT) / 16), 1, 5);
      lastT = now;
      for (let i = 0; i < steps; i++) step();
    }, 16);
    setTimeout(() => win.el.focus(), 80);
    return win;
  }
};

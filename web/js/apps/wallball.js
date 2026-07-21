/* wallball.js — WallBall: fence in the bouncing atoms. Clear 75% to advance.
   Click builds a wall; right-click flips it horizontal/vertical. */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.wallball = {
  name: "WallBall", icon: "wallball", single: true,
  launch() {
    const CW = 50, CH = 34, CS = 8;              // grid cells / cell size
    const W = CW * CS, H = CH * CS;
    let grid, balls, level, lives, vertical, builds, timer, state;

    const win = WM.create({
      title: "WallBall", icon: "wallball", appId: "wallball",
      width: W + 16, height: H + 74, resizable: false, maximizable: false,
      statusbar: [{ text: "Level 1" }, { text: "Lives: 3", width: 70 }, { text: "Cleared: 0%", width: 100 }],
      menus: [
        { label: "Game", items: () => [
          { label: "New Game", accel: "F2", click: () => newGame(1) },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Help", items: () => [
          { label: "How to Play", click: () => WM.msgbox({
            title: "WallBall", icon: "info", width: 360,
            text: "Click to build a wall from that spot. Right-click to switch between vertical and horizontal walls.\n\nIf an atom hits a wall while it is still growing, you lose a life. Sealed-off empty space becomes solid.\n\nClear 75% of the field to advance. Each level adds an atom."
          })},
          "-",
          { label: "About WallBall", click: () => Dialogs.about("WallBall", "wallball", ["Atoms fenced responsibly since 1998."]) }
        ]}
      ],
      onClose: () => clearInterval(timer)
    });
    const cv = el("canvas", { width: String(W), height: String(H), style: "display:block;margin:0 auto;background:#000" });
    const x = cv.getContext("2d");
    win.body.append(cv);
    win.body.style.alignItems = "center";

    function newGame(lv) {
      level = lv; lives = 3; vertical = true; builds = []; state = "play";
      grid = Array.from({ length: CH }, () => new Array(CW).fill(0));  // 0 empty, 1 wall
      balls = [];
      for (let i = 0; i < 1 + level; i++) {
        const a = Math.random() * Math.PI * 2;
        balls.push({
          x: W * 0.2 + Math.random() * W * 0.6,
          y: H * 0.2 + Math.random() * H * 0.6,
          vx: Math.cos(a) * 2.4, vy: Math.sin(a) * 2.4
        });
      }
      sync();
    }
    function pct() {
      let filled = 0;
      for (let r = 0; r < CH; r++) for (let c = 0; c < CW; c++) if (grid[r][c]) filled++;
      return Math.round(filled / (CW * CH) * 100);
    }
    function sync() {
      win.setStatus(0, "Level " + level);
      win.setStatus(1, "Lives: " + lives);
      win.setStatus(2, "Cleared: " + pct() + "%");
    }
    const solidAt = (px, py) => {
      const c = Math.floor(px / CS), r = Math.floor(py / CS);
      if (c < 0 || r < 0 || c >= CW || r >= CH) return true;
      return grid[r][c] === 1;
    };

    function step() {
      if (state !== "play") { draw(); return; }
      /* balls */
      for (const b of balls) {
        if (solidAt(b.x + b.vx, b.y)) b.vx *= -1;
        if (solidAt(b.x, b.y + b.vy)) b.vy *= -1;
        b.x += b.vx; b.y += b.vy;
        /* hit a growing wall segment? (precise circle-vs-cell test) */
        for (const bl of builds) {
          if (bl.cells.some(([r, c]) => {
            const cx = clamp(b.x, c * CS, c * CS + CS);
            const cy = clamp(b.y, r * CS, r * CS + CS);
            return Math.hypot(b.x - cx, b.y - cy) < 6.5;
          })) {
            builds.splice(builds.indexOf(bl), 1);
            lives--;
            Sound.play("error");
            sync();
            if (lives <= 0) {
              state = "over";
              setTimeout(() => {
                if (win.closed) return;
                WM.msgbox({
                  title: "WallBall", icon: "info",
                  text: "The atoms win this time.\nYou reached level " + level + " with " + pct() + "% cleared.\n\nPlay again?",
                  buttons: ["Yes", "No"]
                }).then(r2 => { if (r2 === "Yes") newGame(1); });
              }, 300);
            }
            break;
          }
        }
      }
      /* growing walls */
      for (const bl of builds.slice()) {
        bl.tick = (bl.tick + 1) % 2;
        if (bl.tick) continue;
        let grew = false;
        [["a", -1], ["b", 1]].forEach(([end, d]) => {
          if (bl[end] === null) return;
          const nr = bl.vertical ? bl[end] + d : bl.row;
          const nc = bl.vertical ? bl.col : bl[end] + d;
          const rr = bl.vertical ? bl[end] : bl.row;
          void rr;
          if (nr < 0 || nc < 0 || nr >= CH || nc >= CW || grid[nr][nc] === 1) {
            bl[end] = null;    // reached something solid
          } else {
            bl[end] += d;
            bl.cells.push(bl.vertical ? [bl[end], bl.col] : [bl.row, bl[end]]);
            grew = true;
          }
        });
        if (bl.a === null && bl.b === null) {
          bl.cells.forEach(([r, c]) => grid[r][c] = 1);
          builds.splice(builds.indexOf(bl), 1);
          seal();
          Sound.play("click");
          sync();
          if (pct() >= 75) {
            state = "won";
            Sound.play("tada");
            if (level > Store.get("wallballBest", 0)) Store.set("wallballBest", level);
            setTimeout(() => {
              if (win.closed) return;
              WM.msgbox({ title: "WallBall", icon: "info", text: "Level " + level + " cleared at " + pct() + "%!\nThe atoms multiply...", buttons: ["Next Level"] })
                .then(() => newGame(level + 1));
            }, 300);
          }
        }
        void grew;
      }
      draw();
    }

    /* seal off empty regions with no balls */
    function seal() {
      const reach = Array.from({ length: CH }, () => new Array(CW).fill(false));
      const stack = [];
      balls.forEach(b => stack.push([Math.floor(b.y / CS), Math.floor(b.x / CS)]));
      while (stack.length) {
        const [r, c] = stack.pop();
        if (r < 0 || c < 0 || r >= CH || c >= CW || reach[r][c] || grid[r][c] === 1) continue;
        reach[r][c] = true;
        stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
      }
      for (let r = 0; r < CH; r++) for (let c = 0; c < CW; c++)
        if (!grid[r][c] && !reach[r][c]) grid[r][c] = 1;
    }

    function draw() {
      x.fillStyle = "#000";
      x.fillRect(0, 0, W, H);
      for (let r = 0; r < CH; r++) for (let c = 0; c < CW; c++) {
        if (grid[r][c]) {
          x.fillStyle = "#20488c";
          x.fillRect(c * CS, r * CS, CS, CS);
          x.fillStyle = "#3868b8";
          x.fillRect(c * CS, r * CS, CS, 1);
          x.fillRect(c * CS, r * CS, 1, CS);
        }
      }
      builds.forEach(bl => {
        bl.cells.forEach(([r, c]) => {
          x.fillStyle = bl.vertical ? "#d03030" : "#d0a020";
          x.fillRect(c * CS + 1, r * CS + 1, CS - 2, CS - 2);
        });
      });
      balls.forEach(b => {
        const g = x.createRadialGradient(b.x - 2, b.y - 2, 1, b.x, b.y, 6);
        g.addColorStop(0, "#fff"); g.addColorStop(0.4, "#e0e0ff"); g.addColorStop(1, "#5060c0");
        x.fillStyle = g;
        x.beginPath(); x.arc(b.x, b.y, 6, 0, Math.PI * 2); x.fill();
      });
      /* orientation indicator at the cursor (double-headed arrow) */
      if (state === "play" && mouse.x >= 0) {
        x.strokeStyle = "#e0e060"; x.lineWidth = 2; x.lineCap = "round";
        const a = 11;
        x.beginPath();
        if (vertical) {
          x.moveTo(mouse.x, mouse.y - a); x.lineTo(mouse.x, mouse.y + a);
          x.moveTo(mouse.x - 3, mouse.y - a + 4); x.lineTo(mouse.x, mouse.y - a); x.lineTo(mouse.x + 3, mouse.y - a + 4);
          x.moveTo(mouse.x - 3, mouse.y + a - 4); x.lineTo(mouse.x, mouse.y + a); x.lineTo(mouse.x + 3, mouse.y + a - 4);
        } else {
          x.moveTo(mouse.x - a, mouse.y); x.lineTo(mouse.x + a, mouse.y);
          x.moveTo(mouse.x - a + 4, mouse.y - 3); x.lineTo(mouse.x - a, mouse.y); x.lineTo(mouse.x - a + 4, mouse.y + 3);
          x.moveTo(mouse.x + a - 4, mouse.y - 3); x.lineTo(mouse.x + a, mouse.y); x.lineTo(mouse.x + a - 4, mouse.y + 3);
        }
        x.stroke();
      }
      if (state === "over") {
        x.fillStyle = "rgba(0,0,0,0.6)"; x.fillRect(0, H / 2 - 30, W, 60);
        x.fillStyle = "#fff"; x.font = "bold 20px Arial"; x.textAlign = "center";
        x.fillText("GAME OVER — F2 to retry", W / 2, H / 2 + 6);
        x.textAlign = "left";
      }
    }

    const mouse = { x: -1, y: -1 };
    cv.addEventListener("mousemove", (e) => {
      const r2 = cv.getBoundingClientRect();
      mouse.x = e.clientX - r2.left;
      mouse.y = e.clientY - r2.top;
    });
    cv.addEventListener("mouseleave", () => { mouse.x = -1; });
    cv.addEventListener("mousedown", (e) => {
      win.el.focus();
      if (state !== "play") return;
      const r2 = cv.getBoundingClientRect();
      const c = Math.floor((e.clientX - r2.left) / CS), r = Math.floor((e.clientY - r2.top) / CS);
      if (e.button === 2) { vertical = !vertical; return; }
      if (c < 0 || r < 0 || c >= CW || r >= CH || grid[r][c] === 1) return;
      if (builds.length >= 2) return;
      builds.push({ vertical, row: r, col: c, a: vertical ? r : c, b: vertical ? r : c, cells: [[r, c]], tick: 0 });
    });
    cv.addEventListener("contextmenu", e => e.preventDefault());
    win.el.tabIndex = -1;
    win.ctxMenu = () => [
      { label: "New Game", accel: "F2", click: () => win.el.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true })) }
    ];
    win.el.addEventListener("keydown", (e) => {
      if (e.key === "F2") { e.preventDefault(); newGame(1); }
    });

    newGame(1);
    let lastT = performance.now();
    timer = setInterval(() => {
      const now = performance.now();
      const steps = clamp(Math.round((now - lastT) / 22), 1, 6);
      lastT = now;
      for (let i = 0; i < steps; i++) step();
    }, 22);
    return win;
  }
};

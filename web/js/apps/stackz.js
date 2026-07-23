/* stackz.js — Stackz: falling tetromino blocks. Original name, timeless idea. */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.stackz = {
  name: "Stackz", icon: "stackz", single: true,
  launch() {
    const COLS = 10, ROWS = 20, CS = 20;
    const W = COLS * CS, H = ROWS * CS;
    const COLORS = [null, "#e04040", "#40c0e0", "#e0c040", "#40c040", "#b060e0", "#e08040", "#4060e0"];
    const SHAPES = [
      [],
      [[1, 1, 1, 1]],                       // I
      [[2, 0, 0], [2, 2, 2]],               // J
      [[0, 0, 3], [3, 3, 3]],               // L
      [[4, 4], [4, 4]],                     // O
      [[0, 5, 5], [5, 5, 0]],               // S
      [[0, 6, 0], [6, 6, 6]],               // T
      [[7, 7, 0], [0, 7, 7]]                // Z
    ];
    let grid, piece, px2, py2, score, lines, level, dropTimer, state, next;

    const win = WM.create({
      title: "Stackz", icon: "stackz", appId: "stackz",
      width: W + 132, height: H + 60, resizable: false, maximizable: false,
      menus: [
        { label: "Game", items: () => [
          { label: "New Game", accel: "F2", click: newGame },
          { label: "Pause", accel: "P", click: togglePause },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Help", items: () => [
          { label: "How to Play", click: () => WM.msgbox({
            title: "Stackz", icon: "info", width: 340,
            text: "Arrow keys move, Up rotates, Down drops faster, Space slams.\nComplete horizontal lines to clear them. Four at once is a Stackz.\n\nThe blocks fall faster every ten lines. They do not stop coming. Nothing does."
          })},
          "-",
          { label: "About Stackz", click: () => Dialogs.about("Stackz", "stackz", ["Blocks have been falling since 1984.", "We just added a Windows 98 title bar."]) }
        ]}
      ],
      onClose: () => clearInterval(dropTimer)
    });
    const wrap = el("div", { style: "display:flex;gap:8px;padding:6px" });
    const cv = el("canvas", { width: String(W), height: String(H), style: "background:#101018;box-shadow:inset 1px 1px #000" });
    const side = el("div", { style: "width:104px;font-size:12px" });
    const nextCv = el("canvas", { width: "84", height: "64", style: "background:#101018;display:block;margin-bottom:8px" });
    const scoreEl = el("div", {}), linesEl = el("div", {}), levelEl = el("div", {});
    side.append(el("div", { text: "Next:", style: "margin-bottom:2px" }), nextCv, scoreEl, linesEl, levelEl,
      el("div", { style: "margin-top:12px;font-size:11px;color:#404040;line-height:1.5", html: "← → move<br>↑ rotate<br>↓ soft drop<br>Space slam<br>P pause" }));
    wrap.append(cv, side);
    win.body.append(wrap);
    const x = cv.getContext("2d");
    const nx = nextCv.getContext("2d");

    function newGame() {
      grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
      score = 0; lines = 0; level = 1; state = "play";
      next = randPiece();
      spawn();
      restartTimer();
      sync();
    }
    function randPiece() { return SHAPES[1 + ((Math.random() * 7) | 0)].map(r => r.slice()); }
    function spawn() {
      piece = next;
      next = randPiece();
      px2 = ((COLS - piece[0].length) / 2) | 0;
      py2 = 0;
      if (collide(px2, py2, piece)) {
        state = "over";
        clearInterval(dropTimer);
        Sound.play("error");
        const high = Store.get("stackzHigh", 0);
        if (score > high) Store.set("stackzHigh", score);
        draw();
        setTimeout(() => {
          if (win.closed) return;
          WM.msgbox({ title: "Stackz", icon: "info", text: "The stack reached the top.\n\nScore: " + score + "\nLines: " + lines + "\nHigh score: " + Math.max(high, score) + "\n\nPlay again?", buttons: ["Yes", "No"] })
            .then(r => { if (r === "Yes") newGame(); });
        }, 300);
      }
    }
    function restartTimer() {
      clearInterval(dropTimer);
      dropTimer = setInterval(tick, Math.max(90, 620 - (level - 1) * 55));
    }
    function collide(ox, oy, shp) {
      for (let r = 0; r < shp.length; r++) for (let c = 0; c < shp[r].length; c++) {
        if (!shp[r][c]) continue;
        const gx = ox + c, gy = oy + r;
        if (gx < 0 || gx >= COLS || gy >= ROWS) return true;
        if (gy >= 0 && grid[gy][gx]) return true;
      }
      return false;
    }
    function merge() {
      piece.forEach((row, r) => row.forEach((v, c) => { if (v) grid[py2 + r][px2 + c] = v; }));
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (grid[r].every(v => v)) {
          grid.splice(r, 1);
          grid.unshift(new Array(COLS).fill(0));
          cleared++; r++;
        }
      }
      if (cleared) {
        score += [0, 40, 100, 300, 1200][cleared] * level;
        lines += cleared;
        Sound.play(cleared === 4 ? "tada" : "click");
        const nl = 1 + ((lines / 10) | 0);
        if (nl !== level) { level = nl; restartTimer(); }
        sync();
      }
    }
    function rotate() {
      const rot = piece[0].map((_, c) => piece.map(row => row[c]).reverse());
      for (const dx of [0, -1, 1, -2, 2]) {
        if (!collide(px2 + dx, py2, rot)) { piece = rot; px2 += dx; return; }
      }
    }
    function tick() {
      if (state !== "play") return;
      if (!collide(px2, py2 + 1, piece)) py2++;
      else { merge(); spawn(); }
      draw();
    }
    function sync() {
      scoreEl.textContent = "Score: " + score;
      linesEl.textContent = "Lines: " + lines;
      levelEl.textContent = "Level: " + level;
    }
    function togglePause() {
      if (state === "over") return;
      state = state === "play" ? "pause" : "play";
      draw();
    }

    function cell(ctx, c, r, v, cs) {
      ctx.fillStyle = COLORS[v];
      ctx.fillRect(c * cs, r * cs, cs - 1, cs - 1);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(c * cs, r * cs, cs - 1, 2);
      ctx.fillRect(c * cs, r * cs, 2, cs - 1);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(c * cs, r * cs + cs - 3, cs - 1, 2);
    }
    function draw() {
      x.fillStyle = "#101018"; x.fillRect(0, 0, W, H);
      x.strokeStyle = "#1c1c28";
      for (let c = 0; c <= COLS; c++) { x.beginPath(); x.moveTo(c * CS, 0); x.lineTo(c * CS, H); x.stroke(); }
      for (let r = 0; r <= ROWS; r++) { x.beginPath(); x.moveTo(0, r * CS); x.lineTo(W, r * CS); x.stroke(); }
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c]) cell(x, c, r, grid[r][c], CS);
      /* ghost */
      let gy = py2;
      while (!collide(px2, gy + 1, piece)) gy++;
      piece.forEach((row, r) => row.forEach((v, c) => {
        if (v) { x.fillStyle = "rgba(255,255,255,0.12)"; x.fillRect((px2 + c) * CS, (gy + r) * CS, CS - 1, CS - 1); }
      }));
      piece.forEach((row, r) => row.forEach((v, c) => { if (v) cell(x, px2 + c, py2 + r, v, CS); }));
      nx.fillStyle = "#101018"; nx.fillRect(0, 0, 84, 64);
      const off = (4 - next[0].length) / 2;
      next.forEach((row, r) => row.forEach((v, c) => { if (v) cell(nx, c + off + 0.5, r + 1, v, 16); }));
      if (state !== "play") {
        x.fillStyle = "rgba(0,0,0,0.6)"; x.fillRect(0, H / 2 - 24, W, 48);
        x.fillStyle = "#fff"; x.font = "bold 18px Arial"; x.textAlign = "center";
        x.fillText(state === "over" ? "GAME OVER" : "PAUSED", W / 2, H / 2 + 6);
        x.textAlign = "left";
      }
    }

    win.el.tabIndex = -1;
    cv.addEventListener("mousedown", () => win.el.focus());
    win.el.addEventListener("focusout", (e) => {
      if (!win.el.contains(e.relatedTarget) && state === "play") togglePause();
    });
    win.ctxMenu = () => [
      { label: "New Game", accel: "F2", click: () => win.el.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true })) }
    ];
    win.el.addEventListener("keydown", (e) => {
      if (e.key === "F2") { e.preventDefault(); newGame(); return; }
      if (e.key === "p" || e.key === "P") { e.preventDefault(); togglePause(); return; }
      if (state !== "play") return;
      if (e.key === "ArrowLeft") { if (!collide(px2 - 1, py2, piece)) px2--; e.preventDefault(); }
      else if (e.key === "ArrowRight") { if (!collide(px2 + 1, py2, piece)) px2++; e.preventDefault(); }
      else if (e.key === "ArrowDown") { if (!collide(px2, py2 + 1, piece)) { py2++; score += 1; sync(); } e.preventDefault(); }
      else if (e.key === "ArrowUp") { rotate(); e.preventDefault(); }
      else if (e.key === " ") { while (!collide(px2, py2 + 1, piece)) { py2++; score += 2; } merge(); spawn(); sync(); e.preventDefault(); }
      else return;
      draw();
    });

    newGame();
    setTimeout(() => win.el.focus(), 80);
    return win;
  }
};

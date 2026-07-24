/* minesweeper.js — full classic rules */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.minesweeper = {
  name: "Minesweeper", icon: "minesweeper", single: true,
  launch() {
    const LEVELS = {
      Beginner: { w: 9, h: 9, m: 10 },
      Intermediate: { w: 16, h: 16, m: 40 },
      Expert: { w: 30, h: 16, m: 99 }
    };
    const NUMCOL = ["", "#0000ff", "#008000", "#ff0000", "#000080", "#800000", "#008080", "#000000", "#808080"];
    let level = Store.get("mineLevel", "Beginner");
    let dims = Store.get("mineDims", LEVELS.Beginner);
    let marks = Store.get("mineMarks", true);

    let grid, started, dead, won, timer, time, flags, cellEls, firstClick;

    const mineLeft = [el("span"), el("span"), el("span")];
    const timeLeds = [el("span"), el("span"), el("span")];
    const faceBtn = el("button", { class: "mine-face" });
    const gridEl = el("div", { class: "mine-grid" });

    function setLeds(spans, n) {
      n = Math.max(-99, Math.min(999, n));
      let s = n < 0 ? "-" + String(Math.abs(n)).padStart(2, "0") : String(n).padStart(3, "0");
      spans.forEach((sp, i) => sp.style.backgroundImage = `url(${Icons.led(s[i])})`);
    }
    function setFace(kind) { faceBtn.style.backgroundImage = `url(${Icons.face(kind)})`; }

    function newGame() {
      const { w, h, m } = dims;
      grid = [];
      for (let y = 0; y < h; y++) {
        grid.push([]);
        for (let x = 0; x < w; x++) grid[y].push({ mine: false, open: false, flag: 0, n: 0 });
      }
      let placed = 0;
      while (placed < Math.min(m, w * h - 1)) {
        const x = (Math.random() * w) | 0, y = (Math.random() * h) | 0;
        if (!grid[y][x].mine) { grid[y][x].mine = true; placed++; }
      }
      recount();
      started = false; dead = false; won = false; time = 0; flags = 0; firstClick = true;
      clearInterval(timer);
      setLeds(timeLeds, 0);
      setLeds(mineLeft, dims.m);
      setFace("smile");
      renderGrid();
    }
    function recount() {
      const { w, h } = dims;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let n = 0;
        forNbrs(x, y, (nx, ny) => { if (grid[ny][nx].mine) n++; });
        grid[y][x].n = n;
      }
    }
    function forNbrs(x, y, fn) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < dims.w && ny < dims.h) fn(nx, ny);
      }
    }
    function startTimer() {
      if (started) return;
      started = true;
      timer = setInterval(() => { if (time < 999) { time++; setLeds(timeLeds, time); } }, 1000);
    }

    function renderGrid() {
      gridEl.style.gridTemplateColumns = `repeat(${dims.w}, 16px)`;
      gridEl.innerHTML = "";
      cellEls = [];
      for (let y = 0; y < dims.h; y++) {
        cellEls.push([]);
        for (let x = 0; x < dims.w; x++) {
          const c = el("button", { class: "mcell hid" });
          c.dataset.x = x; c.dataset.y = y;
          gridEl.append(c);
          cellEls[y].push(c);
        }
      }
      paintAll();
      fitWindow();
    }
    function paintCell(x, y) {
      const cell = grid[y][x], c = cellEls[y][x];
      c.className = "mcell";
      c.textContent = "";
      c.style.backgroundImage = "";
      c.style.color = "";
      c.style.backgroundColor = "";
      if (cell.open) {
        c.classList.add("open");
        if (cell.mine) {
          c.style.backgroundImage = `url(${Icons.mineGlyph("mine")})`;
          if (cell.boom) c.style.backgroundColor = "#ff0000";
        } else if (cell.n) {
          c.textContent = cell.n;
          c.style.color = NUMCOL[cell.n];
        }
      } else {
        c.classList.add("hid");
        if (cell.flag === 1) c.style.backgroundImage = `url(${Icons.mineGlyph("flag")})`;
        else if (cell.flag === 2) c.style.backgroundImage = `url(${Icons.mineGlyph("q")})`;
        if (dead && cell.mine && cell.flag !== 1) {
          c.className = "mcell open";
          c.style.backgroundImage = `url(${Icons.mineGlyph("mine")})`;
        }
        if (dead && !cell.mine && cell.flag === 1) {
          // wrong flag: mine with X
          c.className = "mcell open";
          c.style.backgroundImage = `url(${Icons.mineGlyph("mine")})`;
          c.textContent = "✕";
          c.style.color = "#ff0000";
        }
      }
    }
    function paintAll() {
      for (let y = 0; y < dims.h; y++) for (let x = 0; x < dims.w; x++) paintCell(x, y);
    }

    function open(x, y) {
      const cell = grid[y][x];
      if (cell.open || cell.flag === 1 || dead || won) return;
      if (firstClick && cell.mine) {
        // first click is never a mine — relocate
        cell.mine = false;
        outer: for (let yy = 0; yy < dims.h; yy++) for (let xx = 0; xx < dims.w; xx++) {
          if (!grid[yy][xx].mine && (xx !== x || yy !== y)) { grid[yy][xx].mine = true; break outer; }
        }
        recount();
      }
      firstClick = false;
      cell.open = true;
      if (cell.mine) { cell.boom = true; gameOver(false); return; }
      if (cell.n === 0) {
        const stack = [[x, y]];
        while (stack.length) {
          const [cx, cy] = stack.pop();
          forNbrs(cx, cy, (nx, ny) => {
            const nc = grid[ny][nx];
            if (!nc.open && nc.flag !== 1 && !nc.mine) {
              nc.open = true;
              if (nc.n === 0) stack.push([nx, ny]);
              paintCell(nx, ny);
            }
          });
        }
      }
      paintCell(x, y);
      checkWin();
    }
    function chord(x, y) {
      const cell = grid[y][x];
      if (!cell.open || !cell.n) return;
      let fl = 0;
      forNbrs(x, y, (nx, ny) => { if (grid[ny][nx].flag === 1) fl++; });
      if (fl === cell.n) forNbrs(x, y, (nx, ny) => open(nx, ny));
    }
    function toggleFlag(x, y) {
      const cell = grid[y][x];
      if (cell.open || dead || won) return;
      if (cell.flag === 0) { cell.flag = 1; flags++; }
      else if (cell.flag === 1) { cell.flag = marks ? 2 : 0; flags--; }
      else cell.flag = 0;
      setLeds(mineLeft, dims.m - flags);
      paintCell(x, y);
    }
    function gameOver(win_) {
      dead = !win_; won = win_;
      clearInterval(timer);
      setFace(win_ ? "win" : "dead");
      if (win_) {
        Sound.play("tada");
        setLeds(mineLeft, 0);
        for (let y = 0; y < dims.h; y++) for (let x = 0; x < dims.w; x++)
          if (grid[y][x].mine) grid[y][x].flag = 1;
        maybeBestTime();
      } else Sound.play("error");
      paintAll();
    }
    function checkWin() {
      for (let y = 0; y < dims.h; y++) for (let x = 0; x < dims.w; x++) {
        if (!grid[y][x].mine && !grid[y][x].open) return;
      }
      gameOver(true);
    }
    function maybeBestTime() {
      if (!LEVELS[level]) return;
      const best = Store.get("mineBest", {});
      if (!best[level] || time < best[level].time) {
        const dw = WM.create({
          title: "Congratulations!", icon: "minesweeper", width: 300, height: 0,
          resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
        });
        dw.el.style.height = "auto";
        const inp = el("input", { type: "text", class: "field", value: best[level] ? best[level].name : "Anonymous", style: "width:100%;margin-top:6px" });
        dw.body.append(
          el("div", { style: "padding:12px 14px 4px", text: "You have the fastest time for " + level.toLowerCase() + " level. Please enter your name." }),
          el("div", { style: "padding:0 14px" }, inp),
          (() => {
            const r = el("div", { class: "msgbox-btns" });
            const ok = el("button", { class: "btn default", text: "OK" });
            ok.addEventListener("click", () => {
              best[level] = { time, name: inp.value || "Anonymous" };
              Store.set("mineBest", best);
              dw.close();
            });
            r.append(ok);
            return r;
          })()
        );
        setTimeout(() => { inp.focus(); inp.select(); }, 30);
      }
    }
    function bestTimesDialog() {
      const best = Store.get("mineBest", {});
      const dw = WM.create({
        title: "Fastest Mine Sweepers", icon: "minesweeper", width: 320, height: 0,
        resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
      });
      dw.el.style.height = "auto";
      const grid2 = el("div", { style: "display:grid;grid-template-columns:1fr auto auto;gap:6px 16px;padding:14px 18px 6px" });
      for (const lv of ["Beginner", "Intermediate", "Expert"]) {
        const b = best[lv];
        grid2.append(
          el("span", { text: lv + ":" }),
          el("span", { text: (b ? b.time : 999) + " seconds" }),
          el("span", { text: b ? b.name : "Anonymous" })
        );
      }
      const btns = el("div", { class: "msgbox-btns" });
      const reset = el("button", { class: "btn", text: "Reset Scores" });
      const ok = el("button", { class: "btn default", text: "OK" });
      reset.addEventListener("click", () => { Store.set("mineBest", {}); dw.close(); bestTimesDialog(); });
      ok.addEventListener("click", () => dw.close());
      btns.append(reset, ok);
      dw.body.append(grid2, btns);
    }
    function customDialog() {
      const dw = WM.create({
        title: "Custom Field", icon: "minesweeper", width: 260, height: 0,
        resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
      });
      dw.el.style.height = "auto";
      const mk = (label, val) => {
        const inp = el("input", { type: "text", class: "field", value: String(val), style: "width:60px" });
        return [el("label", { text: label + ":" }), inp];
      };
      const [hl, hi] = mk("Height", dims.h);
      const [wl, wi] = mk("Width", dims.w);
      const [ml, mi] = mk("Mines", dims.m);
      const g = el("div", { style: "display:grid;grid-template-columns:auto auto;gap:8px 10px;padding:14px 18px 6px;align-items:center" });
      g.append(hl, hi, wl, wi, ml, mi);
      const btns = el("div", { class: "msgbox-btns" });
      const ok = el("button", { class: "btn default", text: "OK" });
      const cancel = el("button", { class: "btn", text: "Cancel" });
      ok.addEventListener("click", () => {
        const h = clamp(parseInt(hi.value) || 9, 9, 24);
        const w = clamp(parseInt(wi.value) || 9, 9, 30);
        const m = clamp(parseInt(mi.value) || 10, 10, (h - 1) * (w - 1));
        dims = { w, h, m }; level = "Custom";
        Store.set("mineLevel", level); Store.set("mineDims", dims);
        dw.close(); newGame();
      });
      cancel.addEventListener("click", () => dw.close());
      btns.append(ok, cancel);
      dw.body.append(g, btns);
    }
    function setLevel(lv) {
      level = lv; dims = { ...LEVELS[lv] };
      Store.set("mineLevel", lv); Store.set("mineDims", dims);
      newGame();
    }
    function fitWindow() {
      setTimeout(() => {
        if (win.closed) return;
        win.el.style.width = Math.max(outer.offsetWidth + 12, 150) + "px";
        win.el.style.height = (outer.offsetHeight + 52) + "px";
      }, 0);
    }

    const win = WM.create({
      title: "Minesweeper", icon: "minesweeper", appId: "minesweeper",
      width: 200, height: 260, resizable: false, maximizable: false,
      menus: [
        { label: "Game", items: () => [
          { label: "New", accel: "F2", click: newGame },
          "-",
          { label: "Beginner", radio: true, checked: level === "Beginner", click: () => setLevel("Beginner") },
          { label: "Intermediate", radio: true, checked: level === "Intermediate", click: () => setLevel("Intermediate") },
          { label: "Expert", radio: true, checked: level === "Expert", click: () => setLevel("Expert") },
          { label: "Custom...", radio: true, checked: level === "Custom", click: customDialog },
          "-",
          { label: "Marks (?)", checked: marks, click: () => { marks = !marks; Store.set("mineMarks", marks); } },
          "-",
          { label: "Best Times...", click: bestTimesDialog },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Help", items: () => [
          { label: "How to Play", click: () => W98.launch("help", "minesweeper") },
          "-",
          { label: "About Minesweeper", click: () => Dialogs.about("Minesweeper", "minesweeper", ["by Robert Donner and Curt Johnson", "(lovingly recreated)"]) }
        ]}
      ],
      onClose: () => clearInterval(timer)
    });

    const outer = el("div", { class: "mine-outer" });
    const top = el("div", { class: "mine-top" });
    const l1 = el("div", { class: "led" }); mineLeft.forEach(s => l1.append(s));
    const l2 = el("div", { class: "led" }); timeLeds.forEach(s => l2.append(s));
    top.append(l1, faceBtn, l2);
    outer.append(top, gridEl);
    win.body.append(outer);
    win.body.style.alignItems = "flex-start";

    faceBtn.addEventListener("click", newGame);

    let buttons = 0;
    gridEl.addEventListener("mousedown", (e) => {
      const t = e.target.closest(".mcell");
      buttons |= (1 << e.button);
      if (!dead && !won) setFace("oh");
      if (!t) return;
      e.preventDefault();
    });
    gridEl.addEventListener("mouseup", (e) => {
      const t = e.target.closest(".mcell");
      const both = (buttons & 1) && (buttons & 4);
      const mid = e.button === 1;
      buttons &= ~(1 << e.button);
      if (!dead && !won) setFace("smile");
      if (!t) return;
      const x = +t.dataset.x, y = +t.dataset.y;
      startTimer();
      if (mid || both) { chord(x, y); buttons = 0; return; }
      if (e.button === 0) {
        if (grid[y][x].open && grid[y][x].n) chord(x, y);
        else open(x, y);
      }
    });
    gridEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const t = e.target.closest(".mcell");
      if (!t) return;
      if (buttons & 1) return; // chord in progress
      startTimer();
      toggleFlag(+t.dataset.x, +t.dataset.y);
    });
    /* the classic xyzzy cheat: type it, then hover cells — the corner pixel tells the truth */
    let cheatBuf = "", cheatDot = null;
    win.ctxMenu = () => [
      { label: "New Game", accel: "F2", click: () => win.el.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true })) }
    ];
    win.el.addEventListener("keydown", (e) => {
      if (e.key === "F2") { e.preventDefault(); newGame(); return; }
      if (e.key.length === 1) {
        cheatBuf = (cheatBuf + e.key.toLowerCase()).slice(-5);
        if (cheatBuf === "xyzzy" && !cheatDot) {
          cheatDot = el("div", { style: "position:absolute;left:3px;top:3px;width:3px;height:3px;background:#fff;z-index:50" });
          win.el.append(cheatDot);
        }
      }
    });
    gridEl.addEventListener("mouseover", (e) => {
      if (!cheatDot) return;
      const t = e.target.closest(".mcell");
      if (!t) return;
      cheatDot.style.background = grid[+t.dataset.y][+t.dataset.x].mine ? "#000" : "#fff";
    });

    newGame();
    win._mine = { state: () => ({ won, dead }) };
    return win;
  }
};

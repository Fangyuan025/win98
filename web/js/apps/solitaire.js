/* solitaire.js — Klondike */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.solitaire = {
  name: "Solitaire", icon: "solitaire", single: true,
  launch() {
    const SUITS = ["♣", "♦", "♥", "♠"];
    const RANKS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const isRed = s => s === 1 || s === 2;
    let draw3 = Store.get("solDraw3", true);
    let state = null;
    let undoStack = [];
    let score = 0, passes = 0;
    let winAnim = null;

    const felt = el("div", { class: "sol-felt" });
    const win = WM.create({
      title: "Solitaire", icon: "solitaire", appId: "solitaire",
      width: 660, height: 520, minWidth: 620, minHeight: 460,
      statusbar: [{ text: "Score: 0" }, { text: "", width: 160 }],
      menus: [
        { label: "Game", items: () => [
          { label: "Deal", accel: "F2", click: deal },
          "-",
          { label: "Undo", accel: "Ctrl+Z", disabled: !undoStack.length, click: undo },
          "-",
          { label: "Deck...", click: deckDialog },
          { label: "Options...", click: optionsDialog },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Help", items: () => [
          { label: "How to Play", click: () => W98.launch("help", "solitaire") },
          "-",
          { label: "About Solitaire", click: () => Dialogs.about("Solitaire", "solitaire", ["by Wes Cherry", "(lovingly recreated)"]) }
        ]}
      ],
      onResize: render,
      onClose: () => stopWin()
    });
    win.body.append(felt);

    /* the classic deck-back gallery */
    function deckTile(idx) {
      const c = document.createElement("canvas");
      c.width = 24; c.height = 24;
      const x = c.getContext("2d");
      const designs = [
        () => { x.fillStyle = "#0000aa"; x.fillRect(0, 0, 24, 24); x.strokeStyle = "#4040ff"; for (let i = -24; i < 48; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 24, 24); x.moveTo(i + 24, 0); x.lineTo(i, 24); x.stroke(); } },
        () => { x.fillStyle = "#aa0000"; x.fillRect(0, 0, 24, 24); x.strokeStyle = "#ff6060"; for (let i = -24; i < 48; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 24, 24); x.moveTo(i + 24, 0); x.lineTo(i, 24); x.stroke(); } },
        () => { x.fillStyle = "#005c20"; x.fillRect(0, 0, 24, 24); x.fillStyle = "#30a050"; [[6, 6], [18, 18], [18, 6], [6, 18]].forEach(([cx, cy]) => { x.save(); x.translate(cx, cy); x.rotate(Math.PI / 4); x.fillRect(-3, -3, 6, 6); x.restore(); }); },
        () => { x.fillStyle = "#202060"; x.fillRect(0, 0, 24, 24); x.fillStyle = "#8080ff"; [[6, 6], [18, 6], [12, 12], [6, 18], [18, 18]].forEach(([cx, cy]) => { x.beginPath(); x.arc(cx, cy, 2.2, 0, Math.PI * 2); x.fill(); }); },
        () => { x.fillStyle = "#4a2070"; x.fillRect(0, 0, 24, 24); x.fillStyle = "#ffd700"; const star = (cx, cy, r) => { x.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr2 = i % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } x.closePath(); x.fill(); }; star(7, 8, 4); star(18, 17, 4); },
        () => { x.fillStyle = "#006868"; x.fillRect(0, 0, 24, 24); x.strokeStyle = "#40c0c0"; x.lineWidth = 2; for (let row = 0; row < 3; row++) { x.beginPath(); for (let i = 0; i <= 24; i++) x.lineTo(i, row * 9 + 4 + Math.sin(i / 24 * Math.PI * 2) * 2.5); x.stroke(); } },
        () => { for (let r2 = 0; r2 < 4; r2++) for (let c2 = 0; c2 < 4; c2++) { x.fillStyle = (r2 + c2) % 2 ? "#c05800" : "#803800"; x.fillRect(c2 * 6, r2 * 6, 6, 6); } },
        () => { x.fillStyle = "#101010"; x.fillRect(0, 0, 24, 24); x.strokeStyle = "#00d000"; x.beginPath(); x.arc(12, 12, 8, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(12, 12, 4, 0, Math.PI * 2); x.stroke(); }
      ];
      designs[idx % designs.length]();
      return c.toDataURL();
    }
    function applyDeck(url) {
      document.documentElement.style.setProperty("--cardback", `url(${url})`);
      Store.set("solDeckUrl", url);
    }
    function deckDialog() {
      const dw = WM.create({
        title: "Select Card Back", icon: "solitaire", width: 300, height: 0,
        resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
      });
      dw.el.style.height = "auto";
      const cur = Store.get("solDeckUrl", null);
      let sel = -1;
      const grid = el("div", { style: "display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:14px 18px 6px;justify-items:center" });
      const cards = [];
      for (let i = 0; i < 8; i++) {
        const url = deckTile(i);
        const card = el("div", { style: `width:44px;height:60px;border-radius:4px;border:1px solid #000;background-color:#0000aa;background-image:url(${url})` });
        if (cur === url || (!cur && i === 0)) { card.style.outline = "2px solid var(--hl)"; sel = i; }
        card.addEventListener("mousedown", () => {
          sel = i;
          cards.forEach(cc => cc.style.outline = "");
          card.style.outline = "2px solid var(--hl)";
        });
        card.addEventListener("dblclick", () => { applyDeck(deckTile(i)); dw.close(true); });
        cards.push(card);
        grid.append(card);
      }
      const btns = el("div", { class: "msgbox-btns" });
      const ok = el("button", { class: "btn default", text: "OK" });
      const cancel = el("button", { class: "btn", text: "Cancel", onclick: () => dw.close() });
      ok.addEventListener("click", () => { if (sel >= 0) applyDeck(deckTile(sel)); dw.close(true); });
      btns.append(ok, cancel);
      dw.body.append(grid, btns);
    }

    function optionsDialog() {
      const dw = WM.create({
        title: "Options", icon: "solitaire", width: 240, height: 0,
        resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
      });
      dw.el.style.height = "auto";
      let v = draw3;
      const mk = (label, val) => {
        const r = el("label", { class: "checkline" }, el("input", { type: "radio", name: "dr" }), label);
        const i = $("input", r);
        i.checked = draw3 === val;
        i.addEventListener("change", () => { if (i.checked) v = val; });
        return r;
      };
      dw.body.append(
        el("fieldset", { class: "grp", style: "margin:12px 14px 4px" },
          el("legend", { text: "Draw" }), mk("Draw one", false), mk("Draw three", true)),
        (() => {
          const r = el("div", { class: "msgbox-btns" });
          const ok = el("button", { class: "btn default", text: "OK" });
          const cancel = el("button", { class: "btn", text: "Cancel" });
          ok.addEventListener("click", () => { draw3 = v; Store.set("solDraw3", v); dw.close(); deal(); });
          cancel.addEventListener("click", () => dw.close());
          r.append(ok, cancel); return r;
        })()
      );
    }

    function deal() {
      stopWin();
      const deck = [];
      for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ r, s });
      for (let i = deck.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      state = { stock: [], waste: [], found: [[], [], [], []], tab: [[], [], [], [], [], [], []] };
      for (let i = 0; i < 7; i++)
        for (let j = 0; j <= i; j++)
          state.tab[i].push({ c: deck.pop(), up: j === i });
      state.stock = deck.map(c => ({ c, up: false }));
      undoStack = [];
      score = 0; passes = 0;
      render();
    }
    function snapshot() {
      undoStack.push({ s: JSON.parse(JSON.stringify(state)), score });
      if (undoStack.length > 50) undoStack.shift();
    }
    function undo() {
      if (!undoStack.length) return;
      const u = undoStack.pop();
      state = u.s; score = u.score;
      render();
    }
    function addScore(n) { score = Math.max(0, score + n); }

    /* layout */
    function layout() {
      const W = felt.clientWidth;
      const cw = 71, ch = 96, gap = Math.max(8, Math.floor((W - 7 * cw) / 8));
      const x0 = gap;
      return {
        cw, ch,
        stock: { x: x0, y: 8 },
        waste: { x: x0 + cw + gap, y: 8 },
        found: i => ({ x: x0 + (3 + i) * (cw + gap), y: 8 }),
        tab: i => ({ x: x0 + i * (cw + gap), y: ch + 26 })
      };
    }

    function cardEl(card, up) {
      const d = el("div", { class: "card " + (up ? (isRed(card.s) ? "red" : "black") : "facedown") });
      if (up) {
        const cor = el("div", { class: "corner" }, RANKS[card.r], el("small", { text: SUITS[card.s] }));
        d.append(cor);
        if (card.r > 10) d.append(el("div", { class: "courtbox", text: RANKS[card.r] + SUITS[card.s] }));
        else d.append(el("div", { class: "big", text: SUITS[card.s] }));
      }
      return d;
    }

    /* render everything */
    function render() {
      if (!state) return;
      felt.innerHTML = "";
      const L = layout();
      win.setStatus(0, "Score: " + score);
      win.setStatus(1, draw3 ? "Draw Three" : "Draw One");

      /* stock */
      const stockSlot = el("div", { class: "sol-slot", style: `left:${L.stock.x}px;top:${L.stock.y}px` });
      stockSlot.append(el("div", { style: "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:26px;color:#005700", text: "○" }));
      felt.append(stockSlot);
      if (state.stock.length) {
        const c = cardEl({}, false);
        c.style.left = L.stock.x + "px"; c.style.top = L.stock.y + "px";
        c.addEventListener("mousedown", onStock);
        felt.append(c);
      } else stockSlot.addEventListener("mousedown", onStock);

      /* waste */
      const wn = state.waste.length;
      const show = Math.min(draw3 ? 3 : 1, wn);
      for (let i = wn - show; i < wn; i++) {
        const card = state.waste[i].c;
        const c = cardEl(card, true);
        const off = (i - (wn - show)) * 14;
        c.style.left = (L.waste.x + off) + "px"; c.style.top = L.waste.y + "px";
        if (i === wn - 1) makeDraggable(c, { from: "waste" }, card);
        felt.append(c);
      }

      /* foundations */
      for (let f = 0; f < 4; f++) {
        const p = L.found(f);
        const slot = el("div", { class: "sol-slot ace", style: `left:${p.x}px;top:${p.y}px` });
        felt.append(slot);
        const pile = state.found[f];
        if (pile.length) {
          const card = pile[pile.length - 1];
          const c = cardEl(card, true);
          c.style.left = p.x + "px"; c.style.top = p.y + "px";
          makeDraggable(c, { from: "found", fi: f }, card);
          felt.append(c);
        }
      }

      /* tableau */
      for (let t = 0; t < 7; t++) {
        const p = L.tab(t);
        const slot = el("div", { class: "sol-slot", style: `left:${p.x}px;top:${p.y}px` });
        felt.append(slot);
        let y = p.y;
        state.tab[t].forEach((entry, idx) => {
          const c = cardEl(entry.c, entry.up);
          c.style.left = p.x + "px"; c.style.top = y + "px";
          if (entry.up) makeDraggable(c, { from: "tab", ti: t, idx }, entry.c);
          else c.addEventListener("mousedown", () => {
            if (idx === state.tab[t].length - 1) { snapshot(); entry.up = true; addScore(5); render(); }
          });
          felt.append(c);
          y += entry.up ? 22 : 4;
        });
      }
    }

    function onStock(e) {
      e.preventDefault();
      if (!state.stock.length && !state.waste.length) return;   /* nothing to do */
      snapshot();
      if (state.stock.length) {
        const n = Math.min(draw3 ? 3 : 1, state.stock.length);
        for (let i = 0; i < n; i++) {
          const it = state.stock.pop();
          it.up = true;
          state.waste.push(it);
        }
      } else if (state.waste.length) {
        passes++;
        if (!draw3 && passes >= 1) addScore(-100);
        if (draw3 && passes >= 4) addScore(-20);   /* MS rules: -20 from the 4th pass on */
        while (state.waste.length) {
          const it = state.waste.pop();
          it.up = false;
          state.stock.push(it);
        }
      }
      render();
    }

    /* drag & drop */
    function makeDraggable(elm, src, card) {
      elm.addEventListener("dblclick", () => tryAutoFoundation(src, card));
      elm.addEventListener("contextmenu", (e) => { e.preventDefault(); e.stopPropagation(); tryAutoFoundation(src, card); });
      elm.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        const L = layout();
        let moving = [];
        if (src.from === "tab") {
          const pile = state.tab[src.ti];
          const run = pile.slice(src.idx);
          if (!validRun(run)) return;
          moving = run.map(x => x.c);
        } else moving = [card];

        const fr = felt.getBoundingClientRect();
        const er = elm.getBoundingClientRect();
        const ox = e.clientX - er.left, oy = e.clientY - er.top;
        const sx = e.clientX, sy = e.clientY;
        let ghost = null, hidden = [];
        let moved = false;
        const mkGhost = () => {
          ghost = el("div", { style: "position:absolute;z-index:1000;pointer-events:none" });
          moving.forEach((c, i) => {
            const ce = cardEl(c, true);
            ce.style.left = "0px"; ce.style.top = (i * 22) + "px";
            ghost.append(ce);
          });
          felt.append(ghost);
          // hide the dragged run's original cards
          if (src.from === "tab") {
            const startTop = parseFloat(elm.style.top);
            hidden = $$(".card", felt).filter(c => c !== ghost && !ghost.contains(c) &&
              parseFloat(c.style.left) === parseFloat(elm.style.left) && parseFloat(c.style.top) >= startTop);
          } else hidden = [elm];
          hidden.forEach(c => c.style.visibility = "hidden");
        };
        const mm = (ev) => {
          if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 4) return;
          if (!moved) { moved = true; mkGhost(); }
          ghost.style.left = (ev.clientX - fr.left - ox) + "px";
          ghost.style.top = (ev.clientY - fr.top - oy) + "px";
        };
        const mu = (ev) => {
          window.removeEventListener("mousemove", mm);
          window.removeEventListener("mouseup", mu);
          if (ghost) ghost.remove();
          hidden.forEach(c => c.style.visibility = "");
          if (!moved) return;
          const x = ev.clientX - fr.left, y = ev.clientY - fr.top;
          dropAt(src, moving, x, y);
        };
        window.addEventListener("mousemove", mm);
        window.addEventListener("mouseup", mu);
      });
    }
    function validRun(run) {
      for (let i = 0; i < run.length - 1; i++) {
        const a = run[i].c, b = run[i + 1].c;
        if (!run[i].up || a.r !== b.r + 1 || isRed(a.s) === isRed(b.s)) return false;
      }
      return true;
    }
    function removeFrom(src, count) {
      if (src.from === "waste") return [state.waste.pop()];
      if (src.from === "found") return [{ c: state.found[src.fi].pop(), up: true }];
      const pile = state.tab[src.ti];
      return pile.splice(src.idx, pile.length - src.idx);
    }
    function dropAt(src, moving, x, y) {
      const L = layout();
      const first = moving[0], last = moving[moving.length - 1];
      /* foundation? */
      for (let f = 0; f < 4; f++) {
        const p = L.found(f);
        if (x > p.x - 10 && x < p.x + L.cw + 10 && y > p.y - 10 && y < p.y + L.ch + 10 && moving.length === 1) {
          const pile = state.found[f];
          const top = pile[pile.length - 1];
          const ok = top ? (top.s === first.s && first.r === top.r + 1) : first.r === 1;
          if (ok) {
            snapshot();
            removeFrom(src, 1);
            pile.push(first);
            addScore(10);
            afterMove(src);
            return;
          }
        }
      }
      /* tableau? */
      for (let t = 0; t < 7; t++) {
        const p = L.tab(t);
        const pile = state.tab[t];
        const pileH = pile.reduce((a, en) => a + (en.up ? 22 : 4), 0) + L.ch;
        if (x > p.x - 10 && x < p.x + L.cw + 10 && y > p.y - 10 && y < p.y + pileH + 30) {
          if (src.from === "tab" && src.ti === t) continue;
          const top = pile.length ? pile[pile.length - 1] : null;
          const ok = top
            ? (top.up && top.c.r === first.r + 1 && isRed(top.c.s) !== isRed(first.s))
            : first.r === 13;
          if (ok) {
            snapshot();
            const taken = removeFrom(src, moving.length);
            taken.forEach(en => pile.push({ c: en.c, up: true }));
            if (src.from === "waste") addScore(5);
            if (src.from === "found") addScore(-15);
            afterMove(src);
            return;
          }
        }
      }
      render();
    }
    function tryAutoFoundation(src, card) {
      if (src.from === "tab" && src.idx !== state.tab[src.ti].length - 1) return;
      for (let f = 0; f < 4; f++) {
        const pile = state.found[f];
        const top = pile[pile.length - 1];
        const ok = top ? (top.s === card.s && card.r === top.r + 1) : card.r === 1;
        if (ok) {
          snapshot();
          removeFrom(src, 1);
          pile.push(card);
          addScore(10);
          afterMove(src);
          return;
        }
      }
    }
    function afterMove(src) {
      if (src.from === "tab") {
        const pile = state.tab[src.ti];
        if (pile.length && !pile[pile.length - 1].up) { pile[pile.length - 1].up = true; addScore(5); }
      }
      render();
      if (state.found.every(f => f.length === 13)) doWin();
    }

    /* win animation — bouncing cards */
    function doWin() {
      Sound.play("tada");
      const cv = el("canvas", { style: "position:absolute;inset:0;z-index:900" });
      cv.width = felt.clientWidth; cv.height = felt.clientHeight;
      const cx = cv.getContext("2d");
      felt.append(cv);
      const L = layout();
      let f = 3, r = 13;
      let cur = null;
      const colors = ["#000", "#c00000"];
      function next() {
        if (r < 1) { r = 13; f--; }
        if (f < 0) { cur = null; return false; }
        const p = L.found(f);
        cur = {
          x: p.x, y: p.y, vx: (Math.random() * 6 + 3) * (Math.random() < 0.5 ? -1 : 1),
          vy: -(Math.random() * 6), s: f, r
        };
        r--;
        return true;
      }
      next();
      winAnim = setInterval(() => {
        if (!cur) { stopWin(); return; }
        cur.x += cur.vx; cur.y += cur.vy; cur.vy += 0.7;
        if (cur.y + 96 > cv.height) { cur.y = cv.height - 96; cur.vy *= -0.75; }
        cx.fillStyle = "#fff";
        cx.fillRect(cur.x, cur.y, 71, 96);
        cx.strokeStyle = "#000";
        cx.strokeRect(cur.x + 0.5, cur.y + 0.5, 70, 95);
        cx.fillStyle = isRed(cur.s) ? "#c00000" : "#000";
        cx.font = "bold 16px Arial";
        cx.fillText(RANKS[cur.r] + SUITS[cur.s], cur.x + 6, cur.y + 20);
        if (cur.x < -80 || cur.x > cv.width + 10) { if (!next()) stopWin(); }
      }, 16);
      cv.addEventListener("mousedown", () => { stopWin(); });
      setTimeout(() => {
        if (!win.closed) WM.msgbox({ title: "Solitaire", icon: "info", text: "Congratulations! You won!\nDeal again?", buttons: ["Yes", "No"] })
          .then(r2 => { if (r2 === "Yes") deal(); });
      }, 6000);
    }
    function stopWin() {
      clearInterval(winAnim);
      winAnim = null;
      $$("canvas", felt).forEach(c => c.remove());
    }

    win.ctxMenu = () => [
      { label: "New Game", accel: "F2", click: () => win.el.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true })) }
    ];
    win.el.addEventListener("keydown", (e) => {
      if (e.key === "F2") { e.preventDefault(); deal(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
    });

    deal();
    /* read-only state for Autopilot's eyes (interaction stays in the UI) */
    win._sol = { state: () => state };
    return win;
  }
};

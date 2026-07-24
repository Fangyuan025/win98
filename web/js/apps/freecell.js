/* freecell.js — FreeCell with MS-compatible numbered deals */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.freecell = {
  name: "FreeCell", icon: "freecell", single: true,
  launch() {
    const SUITS = ["♣", "♦", "♥", "♠"];
    const RANKS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const isRed = s => s === 1 || s === 2;
    let gameNum = 0;
    let won = false;
    let state = null;       // { free:[4], found:[4], cols:[8][] }  cards {r,s}
    let sel = null;         // { from:'col'|'free', idx, count }
    let undoStack = [];

    /* the classic MS deal algorithm — game numbers match the original */
    function msDeal(n) {
      let seed = n;
      const rand = () => {
        seed = (seed * 214013 + 2531011) % 2147483648;
        return Math.floor(seed / 65536);
      };
      const deck = Array.from({ length: 52 }, (_, i) => i);
      const out = [];
      for (let i = 0; i < 52; i++) {
        const j = rand() % (52 - i);
        out.push(deck[j]);
        deck[j] = deck[52 - 1 - i];
      }
      return out.map(c => ({ r: Math.floor(c / 4) + 1, s: c % 4 }));
    }

    function deal(n) {
      gameNum = n;
      const cards = msDeal(n);
      state = { free: [null, null, null, null], found: [[], [], [], []], cols: [[], [], [], [], [], [], [], []] };
      cards.forEach((c, i) => state.cols[i % 8].push(c));
      sel = null;
      undoStack = [];
      won = false;
      win.setTitle("FreeCell Game #" + n);
      render();
    }
    function snapshot() {
      undoStack.push(JSON.parse(JSON.stringify(state)));
      if (undoStack.length > 64) undoStack.shift();
    }
    function undo() {
      if (!undoStack.length) return;
      state = undoStack.pop();
      sel = null;
      render();
    }

    const felt = el("div", { class: "sol-felt" });
    const win = WM.create({
      title: "FreeCell", icon: "freecell", appId: "freecell",
      width: 660, height: 520, minWidth: 640, minHeight: 460,
      statusbar: [{ text: "" }, { text: "", width: 120 }],
      menus: [
        { label: "Game", items: () => [
          { label: "New Game", accel: "F2", click: () => deal(1 + ((Math.random() * 32000) | 0)) },
          { label: "Select Game...", accel: "F3", click: selectGame },
          { label: "Restart This Game", click: () => deal(gameNum) },
          "-",
          { label: "Undo", accel: "Ctrl+Z", disabled: !undoStack.length, click: undo },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Help", items: () => [
          { label: "How to Play", click: () => WM.msgbox({
            title: "FreeCell", icon: "info", width: 360,
            text: "Move all 52 cards to the home cells, by suit, Ace first.\n\nBuild down on the columns in alternating colors. Any single card may park in a free cell (top left). Empty free cells and empty columns let you move longer runs.\n\nClick a card, then click where it should go. Double-click sends a card to a free cell.\n\nIt is believed (almost) every game is winnable. Almost."
          })},
          "-",
          { label: "About FreeCell", click: () => Dialogs.about("FreeCell", "freecell", ["by Jim Horne", "(lovingly recreated — deal numbers match)"]) }
        ]}
      ],
      onResize: render
    });
    win.body.append(felt);

    function selectGame() {
      const dw = WM.create({
        title: "Game Number", icon: "freecell", width: 260, height: 0,
        resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
      });
      dw.el.style.height = "auto";
      const inp = el("input", { type: "text", class: "field", value: String(gameNum || 11982), style: "width:100%" });
      dw.body.append(
        el("div", { style: "padding:14px 16px 4px" },
          el("div", { text: "Select a game number from 1 to 32000:", style: "margin-bottom:6px" }), inp),
        (() => {
          const r = el("div", { class: "msgbox-btns" });
          const ok = el("button", { class: "btn default", text: "OK" });
          const cancel = el("button", { class: "btn", text: "Cancel", onclick: () => dw.close() });
          ok.addEventListener("click", () => {
            const n = clamp(parseInt(inp.value) || 1, 1, 32000);
            dw.close(true);
            deal(n);
          });
          inp.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") ok.click(); });
          r.append(ok, cancel);
          return r;
        })()
      );
      setTimeout(() => { inp.focus(); inp.select(); }, 50);
    }

    /* ---------- rendering ---------- */
    function cardEl(card, selected) {
      const d = el("div", { class: "card " + (isRed(card.s) ? "red" : "black") });
      const cor = el("div", { class: "corner" }, RANKS[card.r], el("small", { text: SUITS[card.s] }));
      d.append(cor);
      if (card.r > 10) d.append(el("div", { class: "courtbox", text: RANKS[card.r] + SUITS[card.s] }));
      else d.append(el("div", { class: "big", text: SUITS[card.s] }));
      if (selected) d.style.filter = "invert(0.15)";
      if (selected) d.style.outline = "2px solid #000080";
      return d;
    }

    function layout() {
      const W = felt.clientWidth;
      const cw = 71, gap = Math.max(4, Math.floor((W - 8 * cw) / 9));
      return { cw, ch: 96, gap, colX: i => gap + i * (cw + gap), topY: 8, colY: 116 };
    }

    function freeCount() { return state.free.filter(f => !f).length; }
    function emptyCols(excl) {
      return state.cols.filter((c, i) => !c.length && i !== excl).length;
    }
    function maxRun(destCol, destEmpty) {
      let m = (freeCount() + 1) * Math.pow(2, emptyCols(destEmpty ? destCol : -1) - (destEmpty ? 1 : 0));
      return destEmpty ? m : m; // formula already handles it via exclusion
    }
    function validRun(col, idx) {
      const run = state.cols[col].slice(idx);
      for (let i = 0; i < run.length - 1; i++) {
        if (run[i].r !== run[i + 1].r + 1 || isRed(run[i].s) === isRed(run[i + 1].s)) return false;
      }
      return run.length;
    }

    function render() {
      if (!state) return;
      felt.innerHTML = "";
      const L = layout();
      /* free cells + foundations */
      for (let i = 0; i < 4; i++) {
        const slot = el("div", { class: "sol-slot", style: `left:${L.colX(i)}px;top:${L.topY}px;border-color:#004000` });
        slot.addEventListener("mousedown", () => clickFree(i));
        felt.append(slot);
        if (state.free[i]) {
          const c = cardEl(state.free[i], sel && sel.from === "free" && sel.idx === i);
          c.style.left = L.colX(i) + "px"; c.style.top = L.topY + "px";
          c.addEventListener("mousedown", () => clickFree(i));
          felt.append(c);
        }
      }
      for (let i = 0; i < 4; i++) {
        const x = L.colX(4 + i);
        const slot = el("div", { class: "sol-slot ace", style: `left:${x}px;top:${L.topY}px` });
        slot.addEventListener("mousedown", () => clickFound(i));
        felt.append(slot);
        const pile = state.found[i];
        if (pile.length) {
          const c = cardEl(pile[pile.length - 1], false);
          c.style.left = x + "px"; c.style.top = L.topY + "px";
          c.addEventListener("mousedown", () => clickFound(i));
          felt.append(c);
        }
      }
      /* columns */
      for (let i = 0; i < 8; i++) {
        const x = L.colX(i);
        const base = el("div", { class: "sol-slot", style: `left:${x}px;top:${L.colY}px` });
        base.addEventListener("mousedown", () => clickCol(i, -1));
        felt.append(base);
        state.cols[i].forEach((card, j) => {
          const selHere = sel && sel.from === "col" && sel.idx === i && j >= state.cols[i].length - sel.count;
          const c = cardEl(card, selHere);
          c.style.left = x + "px";
          c.style.top = (L.colY + j * 20) + "px";
          c.addEventListener("mousedown", (e) => { e.stopPropagation(); clickCol(i, j); });
          c.addEventListener("dblclick", () => dblCol(i, j));
          felt.append(c);
        });
      }
      const left = 52 - state.found.reduce((a, f) => a + f.length, 0);
      win.setStatus(0, "Cards left: " + left);
      win.setStatus(1, gameNum ? "Game #" + gameNum : "");
      if (left === 0 && !won) { won = true; setTimeout(() => {
        Sound.play("tada");
        WM.msgbox({ title: "FreeCell", icon: "info", text: "Congratulations, you win!\nDo you want to play again?", buttons: ["Yes", "No"] })
          .then(r => { if (r === "Yes") deal(1 + ((Math.random() * 32000) | 0)); });
      }, 200); }
    }

    /* ---------- interactions (click-select, click-drop) ---------- */
    function clearSel() { sel = null; render(); }

    function clickFree(i) {
      if (sel) {
        // drop one card into a free cell
        if (!state.free[i] && sel.count === 1) {
          snapshot();
          state.free[i] = takeSel();
          clearSel();
          Sound.play("click");
        } else clearSel();
        return;
      }
      if (state.free[i]) { sel = { from: "free", idx: i, count: 1 }; render(); }
    }
    function clickFound(i) {
      if (!sel || sel.count !== 1) { clearSel(); return; }
      const card = peekSel();
      const pile = state.found[i];
      const top = pile[pile.length - 1];
      const ok = top ? (top.s === card.s && card.r === top.r + 1) : card.r === 1;
      if (ok) {
        snapshot();
        pile.push(takeSel());
        clearSel();
        Sound.play("click");
      } else clearSel();
    }
    function clickCol(i, j) {
      const col = state.cols[i];
      if (sel) {
        const moving = sel.count;
        const first = peekSel();  // top-most card of the run being moved
        const destTop = col.length ? col[col.length - 1] : null;
        const runTopCard = sel.from === "col"
          ? state.cols[sel.idx][state.cols[sel.idx].length - sel.count]
          : state.free[sel.idx];
        const fits = destTop
          ? (destTop.r === runTopCard.r + 1 && isRed(destTop.s) !== isRed(runTopCard.s))
          : true;
        const allowed = (freeCount() + 1) * Math.pow(2, emptyCols(col.length ? -1 : i));
        if (fits && moving <= allowed && !(sel.from === "col" && sel.idx === i)) {
          snapshot();
          if (sel.from === "free") {
            col.push(state.free[sel.idx]);
            state.free[sel.idx] = null;
          } else {
            const src = state.cols[sel.idx];
            const run = src.splice(src.length - sel.count, sel.count);
            run.forEach(c => col.push(c));
          }
          clearSel();
          Sound.play("click");
          autoPlay();
        } else clearSel();
        return;
      }
      if (j < 0 || !col.length) return;
      const runLen = col.length - j;
      if (validRun(i, j)) { sel = { from: "col", idx: i, count: runLen }; render(); }
      else if (j === col.length - 1) { sel = { from: "col", idx: i, count: 1 }; render(); }
    }
    function peekSel() {
      if (sel.from === "free") return state.free[sel.idx];
      const col = state.cols[sel.idx];
      return col[col.length - sel.count];
    }
    function takeSel() {
      if (sel.from === "free") { const c = state.free[sel.idx]; state.free[sel.idx] = null; return c; }
      return state.cols[sel.idx].pop();
    }
    function dblCol(i, j) {
      const col = state.cols[i];
      if (j !== col.length - 1) return;
      const slot = state.free.indexOf(null);
      if (slot >= 0) {
        snapshot();
        state.free[slot] = col.pop();
        sel = null;
        render();
        Sound.play("click");
      }
    }
    /* auto-play safe cards to foundations (aces and obvious follows) */
    function autoPlay() {
      let did = false;
      const tryCard = (card, take) => {
        for (let f = 0; f < 4; f++) {
          const pile = state.found[f];
          const top = pile[pile.length - 1];
          const ok = top ? (top.s === card.s && card.r === top.r + 1) : card.r === 1;
          if (ok && card.r <= 2) { pile.push(take()); return true; }  // only aces & twos, like sensible players expect
        }
        return false;
      };
      state.cols.forEach(col => {
        if (col.length && tryCard(col[col.length - 1], () => col.pop())) did = true;
      });
      state.free.forEach((c, i) => {
        if (c && tryCard(c, () => { const x = state.free[i]; state.free[i] = null; return x; })) did = true;
      });
      if (did) { render(); setTimeout(autoPlay, 120); }
    }

    win.ctxMenu = () => [
      { label: "New Game", accel: "F2", click: () => win.el.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true })) }
    ];
    win.el.addEventListener("keydown", (e) => {
      if (e.key === "F2") { e.preventDefault(); deal(1 + ((Math.random() * 32000) | 0)); }
      if (e.key === "F3") { e.preventDefault(); selectGame(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if (e.key === "Escape") clearSel();
    });

    deal(1 + ((Math.random() * 32000) | 0));
    win._fc = { state: () => state };
    return win;
  }
};

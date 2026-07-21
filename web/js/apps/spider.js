/* spider.js — Spider Solitaire: ten columns, eight decks' worth of patience.
   One, two, or four suits. Complete a K→A run in one suit to clear it. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  const SUITS = ["♠", "♥", "♦", "♣"];
  const RED = { "♥": 1, "♦": 1 };

  W98.Apps.spider = {
    name: "Spider Solitaire", icon: "spider", single: true,
    launch() {
      let suits = Store.get("spiderSuits", 1);
      let cols, stock, done, moves, score, sel = null;

      const win = WM.create({
        title: "Spider Solitaire", icon: "spider", appId: "spider",
        width: 760, height: 520, minWidth: 620, minHeight: 420,
        statusbar: [{ text: "" }, { text: "", width: 110 }],
        menus: [
          { label: "Game", items: () => [
            { label: "New Game", accel: "F2", click: deal },
            { label: "Difficulty", sub: [1, 2, 4].map(n => ({
              label: n === 1 ? "Easy (1 suit)" : n === 2 ? "Medium (2 suits)" : "Hard (4 suits)",
              radio: true, checked: suits === n,
              click: () => { suits = n; Store.set("spiderSuits", n); deal(); }
            }))},
            "-",
            { label: "Exit", click: () => win.close() }
          ]},
          { label: "Help", items: () => [
            { label: "How to Play", click: () => WM.msgbox({
              title: "Spider Solitaire", icon: "info", width: 400,
              text: "Build down in any suit; only same-suit runs move together.\nComplete a King-to-Ace run in one suit to clear it — clear all eight to win.\n\nClick the stock (top left) to deal a new row: every column must be occupied first.\n\nClick a card, then its destination. Empty columns take anything.\nOne suit is honest. Four suits is a lifestyle."
            })},
            "-",
            { label: "About Spider Solitaire", click: () => Dialogs.about("Spider Solitaire", "spider", ["Eight runs to freedom.", "The spider is metaphorical. Probably."]) }
          ]}
        ]
      });
      win.body.style.background = "#0a6e0a";
      win.body.style.padding = "8px";
      win.body.style.overflow = "auto";
      const table = el("div", { style: "position:relative;min-height:100%" });
      win.body.append(table);

      function mkDeck() {
        const deck = [];
        const use = SUITS.slice(0, suits);
        const copies = 8 / suits;
        for (let c = 0; c < copies; c++)
          for (const s of use)
            for (let v = 1; v <= 13; v++) deck.push({ v, s, up: false });
        for (let i = deck.length - 1; i > 0; i--) {
          const j = (Math.random() * (i + 1)) | 0;
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
      }
      function deal() {
        const deck = mkDeck();
        cols = Array.from({ length: 10 }, () => []);
        for (let i = 0; i < 54; i++) cols[i % 10].push(deck.pop());
        cols.forEach(c => { c[c.length - 1].up = true; });
        stock = deck;            /* 50 left = 5 deals */
        done = 0; moves = 0; score = 500; sel = null;
        paint();
      }

      const VNAME = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
      function cardEl(card, x2, y2, z) {
        const d = el("div", {
          class: "card" + (card.up ? "" : " facedown"),
          style: `position:absolute;left:${x2}px;top:${y2}px;z-index:${z};width:62px;height:84px;cursor:default`
        });
        if (card.up) {
          const col = RED[card.s] ? "#c00000" : "#000";
          d.append(
            el("div", { style: `position:absolute;left:4px;top:2px;font-size:12px;font-weight:700;color:${col}`, text: VNAME[card.v] + card.s }),
            el("div", { style: `position:absolute;right:4px;bottom:2px;font-size:12px;font-weight:700;color:${col};transform:rotate(180deg)`, text: VNAME[card.v] + card.s }),
            el("div", { style: `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:24px;color:${col}`, text: card.s })
          );
        }
        return d;
      }

      function runLen(ci, from) {
        /* length of the movable same-suit descending run ending at column bottom, starting at index from */
        const c = cols[ci];
        for (let i = from; i < c.length - 1; i++) {
          if (!c[i].up || c[i].s !== c[i + 1].s || c[i].v !== c[i + 1].v + 1) return false;
        }
        return c[from].up;
      }

      function tryMove(fromCi, fromIdx, toCi) {
        const src = cols[fromCi];
        const dst = cols[toCi];
        if (!runLen(fromCi, fromIdx)) return false;
        const head = src[fromIdx];
        if (dst.length && dst[dst.length - 1].v !== head.v + 1) return false;
        const moving = src.splice(fromIdx);
        dst.push(...moving);
        if (src.length && !src[src.length - 1].up) src[src.length - 1].up = true;
        moves++; score = Math.max(0, score - 1);
        checkRun(toCi);
        Sound.play("click");
        return true;
      }

      function checkRun(ci) {
        const c = cols[ci];
        if (c.length < 13) return;
        const tail = c.slice(-13);
        const s = tail[0].s;
        for (let i = 0; i < 13; i++) {
          if (!tail[i].up || tail[i].s !== s || tail[i].v !== 13 - i) return;
        }
        c.length -= 13;
        done++;
        score += 100;
        if (c.length && !c[c.length - 1].up) c[c.length - 1].up = true;
        Sound.play("tada");
        if (done === 8) {
          setTimeout(() => {
            if (win.closed) return;
            WM.msgbox({ title: "Spider Solitaire", icon: "info",
              text: W98.tr("You cleared all eight runs!\nScore: ") + score + "  ·  " + W98.tr("Moves: ") + moves + "\n\n" + W98.tr("Deal again?"),
              buttons: ["Yes", "No"] }).then(r => { if (r === "Yes") deal(); });
          }, 400);
        }
      }

      function dealRow() {
        if (!stock.length) return;
        if (cols.some(c => c.length === 0)) {
          WM.msgbox({ title: "Spider Solitaire", icon: "warning", text: W98.tr("You cannot deal while a column is empty.\nEvery column must hold at least one card.") });
          return;
        }
        for (let i = 0; i < 10 && stock.length; i++) {
          const card = stock.pop();
          card.up = true;
          cols[i].push(card);
          checkRun(i);
        }
        moves++;
        Sound.play("click");
        paint();
      }

      function paint() {
        table.innerHTML = "";
        /* stock */
        const stockEl = el("div", {
          class: "card facedown",
          style: "position:absolute;left:8px;top:4px;width:62px;height:84px;cursor:pointer",
          title: W98.tr("Deal a new row")
        });
        if (!stock.length) { stockEl.classList.remove("facedown"); stockEl.style.opacity = "0.25"; }
        stockEl.append(el("div", { style: "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:11px;color:#fff", text: stock.length ? String(stock.length / 10 | 0) : "" }));
        stockEl.addEventListener("click", dealRow);
        table.append(stockEl);
        /* completed runs display */
        for (let i = 0; i < done; i++) {
          const d = el("div", { class: "card", style: `position:absolute;right:${8 + i * 18}px;top:4px;width:62px;height:84px` });
          d.append(el("div", { style: "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:22px;color:#a06010", text: "★" }));
          table.append(d);
        }
        /* columns */
        const cw = Math.max(66, ((win.body.clientWidth || 740) - 24) / 10);
        cols.forEach((c, ci) => {
          const x2 = 8 + ci * cw;
          const slot = el("div", { class: "sol-slot", style: `position:absolute;left:${x2}px;top:96px;width:62px;height:84px` });
          slot.addEventListener("click", () => { if (sel) { const s0 = sel; sel = null; tryMove(s0.ci, s0.idx, ci); paint(); } });
          table.append(slot);
          c.forEach((card, idx) => {
            const y2 = 96 + idx * (card.up ? 22 : 8) + c.slice(0, idx).reduce((a, cd) => a + (cd.up ? 22 : 8), 0) - idx * (card.up ? 22 : 8);
            const yy = 96 + c.slice(0, idx).reduce((a, cd) => a + (cd.up ? 22 : 8), 0);
            const d = cardEl(card, x2, yy, idx + 1);
            if (sel && sel.ci === ci && idx >= sel.idx) d.style.outline = "2px solid #ffe060";
            d.addEventListener("click", (e) => {
              e.stopPropagation();
              if (!card.up) return;
              if (sel && sel.ci === ci && sel.idx === idx) { sel = null; paint(); return; }
              if (sel) {
                const s0 = sel; sel = null;
                if (!tryMove(s0.ci, s0.idx, ci)) { if (runLen(ci, idx)) sel = { ci, idx }; }
                paint();
              } else if (runLen(ci, idx)) { sel = { ci, idx }; paint(); }
            });
            d.addEventListener("dblclick", (e) => {
              e.stopPropagation();
              /* auto: find best destination for this run */
              if (!runLen(ci, idx)) return;
              const head = cols[ci][idx];
              for (let t = 0; t < 10; t++) {
                if (t === ci) continue;
                const dst = cols[t];
                if (dst.length && dst[dst.length - 1].v === head.v + 1 && dst[dst.length - 1].s === head.s) {
                  sel = null; tryMove(ci, idx, t); paint(); return;
                }
              }
              for (let t = 0; t < 10; t++) {
                if (t === ci) continue;
                const dst = cols[t];
                if (!dst.length || dst[dst.length - 1].v === head.v + 1) { sel = null; tryMove(ci, idx, t); paint(); return; }
              }
            });
            table.append(d);
          });
        });
        win.setStatus(0, W98.tr("Score: ") + score + "   " + W98.tr("Moves: ") + moves);
        win.setStatus(1, W98.tr("Runs: ") + done + "/8");
      }

      win.el.tabIndex = -1;
      win.el.addEventListener("keydown", (e) => { if (e.key === "F2") { e.preventDefault(); deal(); } });
      win.ctxMenu = () => [{ label: "New Game", accel: "F2", click: deal }];
      win.opts.onResize = () => paint();
      win._spider = { state: () => ({ done, moves, score, stock: stock.length, cols: cols.map(c => c.length) }), tryMove, dealRow, deal };
      deal();
      return win;
    }
  };
})();

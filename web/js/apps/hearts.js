/* hearts.js — Hearts vs three computer players */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.hearts = {
  name: "Hearts", icon: "hearts", single: true,
  launch() {
    const SUITS = ["♣", "♦", "♥", "♠"];
    const RANKS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const NAMES = [Store.get("userName", "You"), "Pauline", "Michele", "Ben"];
    const isHeart = c => c.s === 2;
    const isQS = c => c.s === 3 && c.r === 12;
    const val = c => c.r === 1 ? 14 : c.r;   // aces high

    let hands, trick, turn, leader, heartsBroken, scores, roundScores, passDir, phase, passSel, tricksTaken;
    let handNum = 0;

    const felt = el("div", { class: "sol-felt" });
    const msgEl = el("div", { style: "position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);color:#fff;font-size:13px;text-shadow:1px 1px #000;text-align:center;pointer-events:none" });
    felt.append(msgEl);

    const win = WM.create({
      title: "Hearts", icon: "hearts", appId: "hearts",
      width: 700, height: 540, minWidth: 660, minHeight: 500,
      statusbar: [{ text: "" }, { text: "", width: 200 }],
      menus: [
        { label: "Game", items: () => [
          { label: "New Game", accel: "F2", click: newGame },
          { label: "Score...", click: showScore },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Help", items: () => [
          { label: "How to Play", click: () => WM.msgbox({
            title: "Hearts", icon: "info", width: 380,
            text: "Aim low. Each heart you take scores 1 point; the queen of spades scores 13. Lowest score wins when someone reaches 100.\n\nEach hand starts by passing three cards. Click three cards, then click Pass. Follow suit if you can. The player holding the 2 of clubs leads it first.\n\nTake ALL the hearts and the queen — 'shooting the moon' — and everyone else gets 26 instead."
          })},
          "-",
          { label: "About Hearts", click: () => Dialogs.about("Hearts", "hearts", ["The Microsoft Hearts Network,", "reimagined for one very offline computer."]) }
        ]}
      ],
      onResize: render
    });
    win.body.append(felt);

    function newGame() {
      scores = [0, 0, 0, 0];
      handNum = 0;
      startHand();
    }
    function startHand() {
      const deck = [];
      for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ r, s });
      for (let i = deck.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      hands = [[], [], [], []];
      deck.forEach((c, i) => hands[i % 4].push(c));
      hands.forEach(h => h.sort((a, b) => a.s - b.s || val(a) - val(b)));
      trick = []; heartsBroken = false;
      roundScores = [0, 0, 0, 0];
      tricksTaken = [[], [], [], []];
      passDir = [1, 3, 2, 0][handNum % 4];    // left, right, across, hold
      handNum++;
      passSel = [];
      if (passDir === 0) { phase = "play"; beginPlay(); }
      else {
        phase = "pass";
        msg("Select three cards to pass " + ["", "left", "across", "right"][passDir === 1 ? 1 : passDir === 2 ? 2 : 3]);
      }
      render();
    }
    function msg(t) { msgEl.textContent = t; }

    function beginPlay() {
      // 2 of clubs leads
      leader = hands.findIndex(h => h.some(c => c.s === 0 && c.r === 2));
      turn = leader;
      trick = [];
      msg("");
      render();
      if (turn !== 0) setTimeout(aiMove, 700);
      else msg("Your lead — play the 2 of clubs");
    }

    function doPass() {
      if (passSel.length !== 3) return;
      const dests = [null, 1, 2, 3];         // pass to seat offset
      const offset = passDir;
      const give = [[], [], [], []];
      // player's picks
      give[0] = passSel.map(i => hands[0][i]);
      passSel.sort((a, b) => b - a).forEach(i => hands[0].splice(i, 1));
      // AI picks: highest-risk cards
      for (let p = 1; p < 4; p++) {
        const h = hands[p].slice().sort((a, b) => riskOf(b) - riskOf(a));
        give[p] = h.slice(0, 3);
        give[p].forEach(c => hands[p].splice(hands[p].indexOf(c), 1));
      }
      for (let p = 0; p < 4; p++) {
        const to = (p + offset) % 4;
        give[p].forEach(c => hands[to].push(c));
      }
      hands.forEach(h => h.sort((a, b) => a.s - b.s || val(a) - val(b)));
      passSel = [];
      phase = "play";
      beginPlay();
    }
    function riskOf(c) {
      if (isQS(c)) return 100;
      if (c.s === 3 && val(c) >= 13) return 60 + val(c);  // A/K of spades
      if (isHeart(c)) return 20 + val(c);
      return val(c);
    }

    function legalMoves(p) {
      const h = hands[p];
      const first = trick.length === 0;
      if (first) {
        // must lead 2♣ on very first trick of the hand
        if (h.length === 13 && tricksTaken.every(t => !t.length)) {
          const tc = h.filter(c => c.s === 0 && c.r === 2);
          if (tc.length) return tc;
        }
        if (!heartsBroken) {
          const nonH = h.filter(c => !isHeart(c));
          if (nonH.length) return nonH;
        }
        return h.slice();
      }
      const lead = trick[0].c.s;
      const follow = h.filter(c => c.s === lead);
      if (follow.length) return follow;
      // first trick: no points allowed if avoidable
      if (tricksTaken.every(t => !t.length) && trick.length) {
        const clean = h.filter(c => !isHeart(c) && !isQS(c));
        if (clean.length) return clean;
      }
      return h.slice();
    }

    function playCard(p, card) {
      const h = hands[p];
      h.splice(h.indexOf(card), 1);
      trick.push({ p, c: card });
      if (isHeart(card)) heartsBroken = true;
      render();
      if (trick.length === 4) {
        setTimeout(finishTrick, 900);
      } else {
        turn = (turn + 1) % 4;
        if (turn === 0) msg("Your turn");
        else { msg(""); setTimeout(aiMove, 650); }
      }
    }

    function finishTrick() {
      const lead = trick[0].c.s;
      let best = 0;
      for (let i = 1; i < 4; i++) {
        if (trick[i].c.s === lead && val(trick[i].c) > val(trick[best].c)) best = i;
      }
      const winner = trick[best].p;
      tricksTaken[winner].push(...trick.map(t => t.c));
      roundScores[winner] += trick.reduce((a, t) => a + (isHeart(t.c) ? 1 : 0) + (isQS(t.c) ? 13 : 0), 0);
      trick = [];
      turn = leader = winner;
      render();
      if (!hands[0].length) { endHand(); return; }
      if (turn === 0) msg("Your lead");
      else { msg(""); setTimeout(aiMove, 650); }
    }

    function endHand() {
      // shooting the moon
      const shooter = roundScores.findIndex(s => s === 26);
      if (shooter >= 0) {
        for (let p = 0; p < 4; p++) roundScores[p] = p === shooter ? 0 : 26;
      }
      for (let p = 0; p < 4; p++) scores[p] += roundScores[p];
      const over = scores.some(s => s >= 100);
      showScore(() => {
        if (over) {
          const winIdx = scores.indexOf(Math.min(...scores));
          Sound.play(winIdx === 0 ? "tada" : "warn");
          WM.msgbox({
            title: "Hearts", icon: "info",
            text: (winIdx === 0 ? "You win!" : NAMES[winIdx] + " wins.") + "\nPlay again?",
            buttons: ["Yes", "No"]
          }).then(r => { if (r === "Yes") newGame(); });
        } else startHand();
      });
    }

    function showScore(then) {
      const dw = WM.create({
        title: "Hearts — Score", icon: "hearts", width: 300, height: 0,
        resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
      });
      dw.el.style.height = "auto";
      const grid = el("div", { style: "display:grid;grid-template-columns:1fr auto auto;gap:5px 18px;padding:14px 18px 6px" });
      grid.append(el("b", { text: "Player" }), el("b", { text: "Hand" }), el("b", { text: "Total" }));
      for (let p = 0; p < 4; p++) {
        grid.append(el("span", { text: NAMES[p] }),
          el("span", { text: String(roundScores ? roundScores[p] : 0) }),
          el("span", { text: String(scores[p]) }));
      }
      const r = el("div", { class: "msgbox-btns" });
      const ok = el("button", { class: "btn default", text: "OK" });
      ok.addEventListener("click", () => { dw.close(true); if (then) then(); });
      r.append(ok);
      dw.body.append(grid, r);
    }

    /* simple but competent AI */
    function aiMove() {
      if (win.closed || turn === 0) return;
      const p = turn;
      const legal = legalMoves(p);
      let card;
      if (trick.length === 0) {
        // lead: lowest safe card
        card = legal.slice().sort((a, b) => riskOf(a) - riskOf(b))[0];
      } else {
        const lead = trick[0].c.s;
        const winning = trick.slice().sort((a, b) =>
          (b.c.s === lead ? val(b.c) : -1) - (a.c.s === lead ? val(a.c) : -1))[0];
        const following = legal.filter(c => c.s === lead);
        const isLast = trick.length === 3;
        const pointsOut = trick.some(t => isHeart(t.c) || isQS(t.c));
        if (following.length) {
          const under = following.filter(c => val(c) < val(winning.c));
          if (under.length) card = under.sort((a, b) => val(b) - val(a))[0];       // duck as high as possible
          else if (isLast && !pointsOut) card = following.sort((a, b) => val(b) - val(a))[0];
          else card = following.sort((a, b) => val(a) - val(b))[0];
        } else {
          // dump the most dangerous card
          card = legal.slice().sort((a, b) => riskOf(b) - riskOf(a))[0];
        }
      }
      playCard(p, card);
    }

    /* ---------- rendering ---------- */
    function cardEl(card, up, small) {
      const d = el("div", { class: "card " + (up ? ((card.s === 1 || card.s === 2) ? "red" : "black") : "facedown") });
      if (small) { d.style.width = "56px"; d.style.height = "76px"; }
      if (up) {
        d.append(el("div", { class: "corner" }, RANKS[card.r], el("small", { text: SUITS[card.s] })));
        if (card.r > 10 || card.r === 1) d.append(el("div", { class: "courtbox", text: RANKS[card.r] + SUITS[card.s] }));
        else d.append(el("div", { class: "big", text: SUITS[card.s] }));
      }
      return d;
    }

    function render() {
      if (!hands) return;
      $$(".card, .h-name", felt).forEach(e => e.remove());
      const W = felt.clientWidth, H = felt.clientHeight;
      const name = (t, x, y) => felt.append(el("div", { class: "h-name", style: `position:absolute;left:${x}px;top:${y}px;color:#fff;text-shadow:1px 1px #000;font-weight:700`, text: t }));

      /* opponents: backs */
      const n1 = hands[1].length, n2 = hands[2].length, n3 = hands[3].length;
      for (let i = 0; i < n1; i++) {  // left
        const c = cardEl({}, false, true);
        c.style.left = "14px"; c.style.top = (H / 2 - 90 + i * (150 / Math.max(1, n1))) + "px";
        felt.append(c);
      }
      for (let i = 0; i < n2; i++) {  // top
        const c = cardEl({}, false, true);
        c.style.left = (W / 2 - 110 + i * (200 / Math.max(1, n2))) + "px"; c.style.top = "10px";
        felt.append(c);
      }
      for (let i = 0; i < n3; i++) {  // right
        const c = cardEl({}, false, true);
        c.style.left = (W - 74) + "px"; c.style.top = (H / 2 - 90 + i * (150 / Math.max(1, n3))) + "px";
        felt.append(c);
      }
      name(NAMES[1], 16, H / 2 - 112);
      name(NAMES[2], W / 2 - 24, 92);
      name(NAMES[3], W - 70, H / 2 - 112);

      /* trick cards in the middle */
      const mid = [[W / 2 - 35, H / 2 + 6], [W / 2 - 95, H / 2 - 46], [W / 2 - 35, H / 2 - 98], [W / 2 + 25, H / 2 - 46]];
      trick.forEach(t => {
        const c = cardEl(t.c, true);
        c.style.left = mid[t.p][0] + "px";
        c.style.top = mid[t.p][1] + "px";
        felt.append(c);
      });

      /* player hand */
      const h = hands[0];
      const total = Math.min(W - 120, h.length * 46);
      const step = h.length > 1 ? total / (h.length - 1) : 0;
      const x0 = W / 2 - total / 2 - 35;
      h.forEach((card, i) => {
        const c = cardEl(card, true);
        const selUp = phase === "pass" && passSel.includes(i);
        c.style.left = (x0 + i * step) + "px";
        c.style.top = (H - 102 - (selUp ? 16 : 0)) + "px";
        c.style.cursor = "inherit";
        c.addEventListener("mousedown", () => onCardClick(i));
        felt.append(c);
      });

      /* pass button */
      $$(".h-pass", felt).forEach(e => e.remove());
      if (phase === "pass") {
        const b = el("button", { class: "btn h-pass", text: "Pass", style: `position:absolute;left:${W / 2 - 38}px;top:${H / 2 + 60}px` });
        b.disabled = passSel.length !== 3;
        b.addEventListener("click", doPass);
        felt.append(b);
      }
      win.setStatus(0, "Scores: " + scores.map((s, i) => NAMES[i] + " " + s).join("   "));
      win.setStatus(1, "Hearts " + (heartsBroken ? "broken" : "not broken"));
    }

    function onCardClick(i) {
      if (phase === "pass") {
        const at = passSel.indexOf(i);
        if (at >= 0) passSel.splice(at, 1);
        else if (passSel.length < 3) passSel.push(i);
        render();
        return;
      }
      if (turn !== 0 || trick.length === 4) return;
      const card = hands[0][i];
      const legal = legalMoves(0);
      if (!legal.includes(card)) {
        Sound.play("warn");
        msg(trick.length ? "You must follow suit" : (heartsBroken ? "" : "Hearts are not broken yet"));
        setTimeout(() => msg(turn === 0 ? "Your turn" : ""), 1400);
        return;
      }
      msg("");
      playCard(0, card);
    }

    win.ctxMenu = () => [
      { label: "New Game", accel: "F2", click: () => win.el.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true })) }
    ];
    win.el.addEventListener("keydown", (e) => {
      if (e.key === "F2") { e.preventDefault(); newGame(); }
    });

    newGame();
    return win;
  }
};

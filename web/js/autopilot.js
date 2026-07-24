/* autopilot.js — Autopilot 98: hand the computer to BOB, a ghost user who
   works the machine like it is 1998. A visible cursor drifts with human
   easing, menus open, sentences get typed (with typos, then regret, then
   backspace), Minesweeper gets played badly. Any real mouse or key input
   instantly returns control. */
"use strict";
W98.Autopilot = (() => {
  let active = false;
  let cursorEl = null, banner = null, shield = null;
  let cx = 400, cy = 300;
  let lastActivity = "";
  const STOP = Symbol("autopilot-stop");
  const TRACE = [];
  const trace = (m) => { TRACE.push(m); if (TRACE.length > 80) TRACE.shift(); };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  /* ---------- abort-aware primitives ---------- */
  let abortAct = false;   /* watchdog trips this to kill a hung activity */
  function check() { if (!active || abortAct) throw STOP; }
  let turbo = false;   /* test mode: compress the waits, keep the logic */
  /* worker-driven timing: page timers are throttled to 1s+ when the window is
     hidden, but worker timers are not — BOB keeps working while minimized */
  let sleepWorker = null;
  const sleepCbs = new Map();
  let sleepSeq = 0;
  try {
    sleepWorker = new Worker(URL.createObjectURL(new Blob(
      ["onmessage=function(e){setTimeout(function(){postMessage(e.data.id)},e.data.ms)}"],
      { type: "application/javascript" })));
    sleepWorker.onmessage = (e) => {
      const cb = sleepCbs.get(e.data);
      sleepCbs.delete(e.data);
      if (cb) cb();
    };
  } catch (e) { sleepWorker = null; }

  function sleepReal(ms) {
    return new Promise((res, rej) => {
      if (!active) { rej(STOP); return; }
      const done = () => (active && !abortAct) ? res() : rej(STOP);
      if (sleepWorker) {
        const id = ++sleepSeq;
        sleepCbs.set(id, done);
        sleepWorker.postMessage({ id, ms });
      } else setTimeout(done, ms);
    });
  }
  function sleep(ms) {
    if (turbo) ms = Math.max(1, ms / 15);
    return new Promise((res, rej) => {
      if (!active) { rej(STOP); return; }
      const done = () => (active && !abortAct) ? res() : rej(STOP);
      if (sleepWorker) {
        const id = ++sleepSeq;
        sleepCbs.set(id, done);
        sleepWorker.postMessage({ id, ms });
      } else {
        setTimeout(done, ms);
      }
    });
  }

  /* ---------- the visible hand ---------- */
  function makeCursor() {
    cursorEl = el("div", { style: "position:absolute;z-index:99990;pointer-events:none;width:20px;height:22px;filter:drop-shadow(1px 1px 1px rgba(0,0,0,.5))" });
    cursorEl.innerHTML = `<svg width="20" height="22" viewBox="0 0 20 22">
      <polygon points="1,1 1,17 5,13 8,20 11,19 8,12 14,12" fill="#fff" stroke="#000" stroke-width="1"/></svg>`;
    cursorEl.style.left = cx + "px";
    cursorEl.style.top = cy + "px";
    $("#screen").append(cursorEl);
  }

  async function moveTo(tx, ty) {
    check();
    /* human-ish: eased curve with a control point off the straight line */
    const sx = cx, sy = cy;
    const d = Math.hypot(tx - sx, ty - sy);
    const steps = Math.max(8, Math.min(42, Math.round(d / 14)));
    const mx = (sx + tx) / 2 + rnd(-d / 6, d / 6);
    const my = (sy + ty) / 2 + rnd(-d / 6, d / 6);
    for (let i = 1; i <= steps; i++) {
      check();
      const t = i / steps;
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;   /* easeInOut */
      cx = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * mx + e * e * tx + rnd(-0.8, 0.8);
      cy = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * my + e * e * ty + rnd(-0.8, 0.8);
      cursorEl.style.left = cx + "px";
      cursorEl.style.top = cy + "px";
      await sleep(11);
    }
    cx = tx; cy = ty;
    cursorEl.style.left = cx + "px";
    cursorEl.style.top = cy + "px";
  }

  function screenPoint(el2) {
    const r = el2.getBoundingClientRect();
    const s = $("#screen").getBoundingClientRect();
    return {
      x: r.left - s.left + r.width * rnd(0.3, 0.7),
      y: r.top - s.top + r.height * rnd(0.3, 0.7)
    };
  }

  async function clickEl(el2, kind) {
    check();
    if (!el2 || !el2.isConnected) { trace("clickEl: disconnected " + (el2 && el2.className)); throw STOP; }
    trace("click " + (el2.className || el2.tagName));
    const p = screenPoint(el2);
    await moveTo(p.x, p.y);
    await sleep(rnd(90, 260));
    check();
    cursorEl.firstChild.style.transform = "scale(0.85)";
    const opts = { bubbles: true, cancelable: true, clientX: p.x, clientY: p.y };
    el2.dispatchEvent(new MouseEvent("mousedown", opts));
    await sleep(70);
    el2.dispatchEvent(new MouseEvent("mouseup", opts));
    if (kind !== "down") el2.dispatchEvent(new MouseEvent("click", opts));
    cursorEl.firstChild.style.transform = "";
  }

  const NEIGH = { a: "sq", e: "wr", i: "ou", o: "ip", t: "ry", n: "bm", s: "ad", r: "et", l: "k", h: "gj" };
  async function typeInto(field, text) {
    for (const ch of text) {
      check();
      /* the occasional 1998 typo, noticed and fixed */
      if (/[a-z]/.test(ch) && Math.random() < 0.03 && NEIGH[ch]) {
        const wrong = pick(NEIGH[ch].split(""));
        field.value += wrong;
        field.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(rnd(220, 500));
        field.value = field.value.slice(0, -1);
        field.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(rnd(120, 240));
      }
      field.value += ch;
      field.scrollTop = field.scrollHeight;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(ch === " " ? rnd(40, 110) : ch === "\n" ? rnd(300, 700) : rnd(45, 150));
    }
  }

  /* close a window like a person: aim for the X, decline to save */
  async function closeWin(w) {
    if (!w || w.closed) return;
    const btns = [...w.el.querySelectorAll(".t-btn")];
    const x = btns[btns.length - 1];
    if (x) await clickEl(x); else w.close();
    await sleep(450);
    const box = WM.wins.find(b => !b.closed && b.opts.noTaskbar && /save|儲存/i.test(b.el.textContent));
    if (box) {
      const no = [...box.el.querySelectorAll("button")].find(b => /^(No|否)$/.test(b.textContent.trim()));
      if (no) await clickEl(no); else box.close(true);
    }
  }
  async function maybeClose(w, p) {
    if (w && !w.closed && Math.random() < (p == null ? 0.85 : p)) await closeWin(w);
  }

  /* find a window by title fragment */
  const winBy = (frag) => WM.wins.find(w => !w.closed && w.title.indexOf(frag) >= 0);

  /* names as they appear on desktop icons */
  const DESKTOP_NAMES = { ie: "Internet Explorer", mail: "Internet Mail", claude98: "Claude Desktop 98",
    minesweeper: "Minesweeper", paint: "Paint", notepad: "Notepad", calc: "Calculator", megaamp: "MegaAmp",
    pinball: "Star Pilot Pinball", wordpad: "Word", encarta: "Encyclopedia 98" };

  /* an app that is already open gets focused, not re-launched — no window plagues */
  async function focusExisting(appId, titleFrag) {
    const w = WM.wins.find(x => !x.closed && !x.opts.noTaskbar &&
      ((x.opts.appId && x.opts.appId === appId) || (titleFrag && x.title.indexOf(titleFrag) >= 0)));
    if (!w) return null;
    if (w.minimized) {
      /* a taskbar click restores a minimized window; never click it otherwise
         (clicking a focused window's button MINIMIZES it — BOB learned this) */
      const btn = [...document.querySelectorAll("#taskbar button")]
        .find(b => b.textContent.trim().length > 2 && w.title.indexOf(b.textContent.trim().replace(/\.\.\.$/, "").slice(0, 10)) >= 0);
      if (btn) await clickEl(btn); else if (w.restore) w.restore();
    } else {
      await clickEl(w.el.querySelector(".titlebar") || w.el, "down");
    }
    await sleep(rnd(300, 600));
    if (w.minimized && w.restore) w.restore();
    return w;
  }

  /* launch an app the human way: desktop icon, Start menu, or just find it again */
  async function ghostLaunch(appId, progLabel, titleFrag) {
    check();
    const existing = await focusExisting(appId, titleFrag);
    if (existing) return existing;

    /* route 1: double-click the desktop icon, if there is one */
    const name = DESKTOP_NAMES[appId];
    if (name && Math.random() < 0.5) {
      const ic = [...document.querySelectorAll("#desktop .dicon")]
        .find(d => d.textContent.trim().startsWith(name.slice(0, 12)));
      if (ic) {
        const before = WM.wins.filter(x => !x.closed).length;
        await clickEl(ic, "down");
        await sleep(rnd(180, 380));
        const p = screenPoint(ic);
        ic.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: p.x, clientY: p.y, button: 0 }));
        for (let i = 0; i < 8; i++) {
          await sleep(250);
          if (WM.wins.filter(x => !x.closed).length > before) return WM.wins[WM.wins.length - 1];
        }
        /* nothing opened — fall through to the Start menu */
      }
    }

    /* route 2: the Start menu crawl */
    const startBtn = $("#start-btn");
    await clickEl(startBtn, "click");
    await sleep(rnd(350, 700));
    const pops = () => [...document.querySelectorAll(".menu-pop")];
    const findItem = (label) => {
      for (const m of pops()) {
        const it = [...m.querySelectorAll(".menu-item")].find(r => r.textContent.trim().startsWith(label));
        if (it) return it;
      }
      return null;
    };
    let ok = false;
    if (progLabel) {
      const prog = findItem("Programs") || findItem("程式集");
      if (prog) {
        const p = screenPoint(prog);
        await moveTo(p.x, p.y);
        prog.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
        prog.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: p.x, clientY: p.y }));
        await sleep(rnd(450, 800));
        const item = findItem(progLabel);
        if (item) {
          await clickEl(item);
          await sleep(120);
          item.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
          ok = true;
        }
      }
    }
    if (!ok) {
      Menu.closeAll && Menu.closeAll();
      await sleep(200);
      W98.launch(appId);
    }
    await sleep(rnd(600, 1100));
    return WM.wins[WM.wins.length - 1];
  }

  /* if the dial-up prompt is up, BOB knows what to do */
  async function handleDialPrompt() {
    const dlg = winBy("Dial-up Connection");
    if (!dlg) return;
    const con = [...dlg.el.querySelectorAll("button")].find(b => /Connect|連線/.test(b.textContent));
    if (con) {
      await clickEl(con);
      /* the modem sings for ~9 seconds; BOB waits like everyone waited */
      for (let i = 0; i < 40 && active; i++) {
        await sleep(400);
        const est = winBy("Connection Established") || winBy("連線");
        if (est && /Established/.test(est.title)) {
          await sleep(600);
          const okB = [...est.el.querySelectorAll("button")].find(b => /OK|確定/.test(b.textContent));
          if (okB) await clickEl(okB); else est.close(true);
          break;
        }
        if (W98.Net && W98.Net.connected) break;
      }
    }
  }

  /* ---------- BOB's repertoire ---------- */

  const DIARY = [
    "dear diary,\n\ntoday i defragmented the hard drive again. i just like watching the little blocks find their way home.\n",
    "note to self:\n\n- call mom back (she found the Any key)\n- burn mix CD for the car\n- do NOT open the email from aunt carol\n",
    "ideas for my website:\n\n1. a page about my cat\n2. a guestbook\n3. one of those visitor counters\n4. UNDER CONSTRUCTION gif (essential)\n",
    "reminder: the internet is 150 free hours per month.\ni have used 149. it is the 9th.\n",
    "story idea:\n\nthe year is 2026. computers fit in your POCKET but everyone\nmisses the sound the modem made. working title: the singing box.\n"
  ];

  const CLAUDE_QS = [
    "tell me a joke", "what is 4096 * 12", "write a haiku about modems",
    "what's my IP", "a fun fact please", "who am I"
  ];

  async function actDiary() {
    const win = await ghostLaunch("notepad", "Notepad", "Notepad");
    const w = winBy("Notepad") || win;
    if (!w) return;
    const ta = w.el.querySelector("textarea");
    if (!ta) return;
    await clickEl(ta);
    await typeInto(ta, pick(DIARY));
    await sleep(rnd(1200, 2600));
    /* sometimes close it and refuse to save — a very 1998 relationship with data */
    await maybeClose(w, 0.9);
  }

  async function actMinesweeper() {
    await ghostLaunch("minesweeper", "Minesweeper", "Minesweeper");
    const w = winBy("Minesweeper") || winBy("踩地雷");
    if (!w) return;
    const myFlags = new Set();

    const read = () => {
      const cells = {};
      let maxX = 0, maxY = 0;
      for (const c of w.el.querySelectorAll(".mcell")) {
        const x = +c.dataset.x, y = +c.dataset.y;
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        cells[x + "," + y] = {
          el: c, x, y,
          open: c.classList.contains("open"),
          n: parseInt(c.textContent, 10) || 0,
          hid: c.classList.contains("hid"),
          flag: myFlags.has(x + "," + y),
          boom: c.style.backgroundColor === "rgb(255, 0, 0)"
        };
      }
      return { cells, maxX, maxY };
    };
    const neigh = (b, c) => {
      const out = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const k = (c.x + dx) + "," + (c.y + dy);
        if (b.cells[k]) out.push(b.cells[k]);
      }
      return out;
    };
    async function flagCell(c) {
      const p = screenPoint(c.el);
      await moveTo(p.x, p.y);
      await sleep(rnd(120, 300));
      c.el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: p.x, clientY: p.y }));
      myFlags.add(c.x + "," + c.y);
    }

    let games = 0;
    while (games < 2) {
      check();
      let b = read();
      trace("mine cells=" + Object.keys(b.cells).length);
      const anyOpen = Object.values(b.cells).some(c => c.open);
      if (!anyOpen) {   /* opening move: somewhere near the middle */
        const mid = Object.values(b.cells).filter(c => c.hid &&
          Math.abs(c.x - b.maxX / 2) < 3 && Math.abs(c.y - b.maxY / 2) < 3);
        await clickEl(pick(mid.length ? mid : Object.values(b.cells).filter(c => c.hid)).el);
        await sleep(rnd(400, 800));
      }
      let moves = 0, stuckRandoms = 0;
      while (moves++ < 45) {
        check();
        b = read();
        if (Object.values(b.cells).some(c => c.boom)) break;           /* lost */
        const hidden = Object.values(b.cells).filter(c => c.hid && !c.flag);
        if (!hidden.length) break;                                     /* won */

        /* deduce: numbers whose flags are satisfied → neighbors are safe;
           numbers whose hidden count equals remaining mines → all mines */
        let did = false;
        for (const c of Object.values(b.cells)) {
          if (!c.open || !c.n) continue;
          const around = neigh(b, c);
          const flags = around.filter(a => a.flag).length;
          const hid = around.filter(a => a.hid && !a.flag);
          if (!hid.length) continue;
          if (flags === c.n) {                     /* everything else is safe */
            await clickEl(hid[0].el);
            await sleep(rnd(250, 600));
            did = true; break;
          }
          if (hid.length === c.n - flags) {        /* everything left is a mine */
            await flagCell(hid[0]);
            await sleep(rnd(250, 550));
            did = true; break;
          }
        }
        if (did) { stuckRandoms = 0; continue; }

        /* no certain move: take the least-risky hidden cell */
        if (++stuckRandoms > 6) break;             /* enough guessing for one sitting */
        let best = null, bestRisk = 9;
        for (const c of hidden) {
          let risk = 0.12;
          for (const a of neigh(b, c)) {
            if (a.open && a.n) {
              const hods = neigh(b, a).filter(z => z.hid && !z.flag).length;
              const fl = neigh(b, a).filter(z => z.flag).length;
              if (hods) risk = Math.max(risk, (a.n - fl) / hods);
            }
          }
          if (risk < bestRisk - 1e-9 || (Math.abs(risk - bestRisk) < 1e-9 && Math.random() < 0.3)) {
            bestRisk = risk; best = c;
          }
        }
        await sleep(rnd(500, 1200));               /* thinking pause before a guess */
        await clickEl((best || pick(hidden)).el);
        await sleep(rnd(250, 600));
      }
      b = read();
      trace("mine end opened=" + Object.values(b.cells).filter(c => c.open).length);
      const lost = Object.values(b.cells).some(c => c.boom);
      const wonIt = !lost && !Object.values(b.cells).some(c => c.hid && !c.flag);
      await sleep(rnd(1000, 1900));                /* reflect on the result */
      games++;
      if ((lost || !wonIt) && games < 2) {
        const face = w.el.querySelector(".mine-face");
        if (face) { myFlags.clear(); await clickEl(face); await sleep(rnd(500, 900)); }
      } else break;
    }
    await maybeClose(w);
  }

  async function actBrowse() {
    await ghostLaunch("ie", "Internet Explorer", "Internet Explorer");
    await sleep(800);
    await handleDialPrompt();
    const w = WM.wins.find(x => !x.closed && /Internet Explorer/.test(x.title));
    if (!w) return;
    for (let i = 0; i < 40 && active; i++) {   /* wait for the page */
      await sleep(300);
      if (w.el.querySelector(".ie-page .webpage")) break;
    }
    for (let hop = 0; hop < 2; hop++) {
      check();
      const page = w.el.querySelector(".ie-page");
      if (!page) break;
      /* read a little, scroll a little */
      for (let s = 0; s < 3; s++) { await sleep(rnd(900, 1900)); page.scrollTop += rnd(60, 200); }
      const links = [...page.querySelectorAll("a")].filter(a => (a.getAttribute("href") || "").startsWith("http://www."));
      if (!links.length) break;
      await clickEl(pick(links));
      await sleep(rnd(1500, 2500));
    }
    await sleep(rnd(1000, 2000));
    await maybeClose(w, 0.7);
  }

  async function actMail() {
    await ghostLaunch("mail", "Internet Mail", "Internet Mail");
    const w = winBy("Internet Mail");
    if (!w) return;
    const rows = [...w.el.querySelectorAll("[class*=row], tbody tr, .list > div")].slice(0, 6);
    for (let i = 0; i < Math.min(2, rows.length); i++) {
      check();
      await clickEl(rows[(Math.random() * rows.length) | 0]);
      await sleep(rnd(3000, 6000));   /* reading aunt carol takes time */
    }
    await sleep(rnd(800, 1500));
    await maybeClose(w);
  }

  async function actClaude() {
    await ghostLaunch("claude98", null, "Claude");
    const w = winBy("Claude");
    if (!w) return;
    const inp = w.el.querySelector("textarea.field");
    const send = [...w.el.querySelectorAll("button")].find(b => /Send|傳送/.test(b.textContent));
    if (!inp || !send) return;
    for (let q = 0; q < 2; q++) {
      check();
      await clickEl(inp);
      await typeInto(inp, pick(CLAUDE_QS));
      await sleep(rnd(300, 700));
      await clickEl(send);
      await sleep(rnd(5000, 9000));   /* 28.8k streaming takes what it takes */
    }
    await maybeClose(w, 0.7);
  }

  /* BOB's gallery: recognizable pictures, one confident stroke at a time.
     Coordinates are normalized 0..1 over the canvas. */
  const PICTURES = [
    { name: "house", strokes: [
      { c: "#804000", pts: [[0.25, 0.85], [0.25, 0.5], [0.75, 0.5], [0.75, 0.85], [0.25, 0.85]] },
      { c: "#c00000", pts: [[0.2, 0.5], [0.5, 0.22], [0.8, 0.5]] },
      { c: "#804000", pts: [[0.45, 0.85], [0.45, 0.66], [0.55, 0.66], [0.55, 0.85]] },
      { c: "#00c0c0", pts: [[0.3, 0.58], [0.4, 0.58], [0.4, 0.68], [0.3, 0.68], [0.3, 0.58]] },
      { c: "#808080", pts: [[0.62, 0.32], [0.62, 0.2], [0.68, 0.2], [0.68, 0.38]] }
    ]},
    { name: "sun+boat", strokes: [
      { c: "#0000c0", pts: [[0.05, 0.7], [0.2, 0.66], [0.35, 0.72], [0.5, 0.66], [0.65, 0.72], [0.8, 0.66], [0.95, 0.7]] },
      { c: "#804000", pts: [[0.35, 0.7], [0.4, 0.8], [0.6, 0.8], [0.65, 0.7], [0.35, 0.7]] },
      { c: "#ffffff", pts: [[0.5, 0.7], [0.5, 0.4], [0.62, 0.55], [0.5, 0.58]] },
      { c: "#ffff00", pts: [[0.82, 0.18], [0.86, 0.14], [0.9, 0.14], [0.93, 0.18], [0.93, 0.24], [0.9, 0.28], [0.85, 0.28], [0.82, 0.24], [0.82, 0.18]] },
      { c: "#ffff00", pts: [[0.87, 0.06], [0.87, 0.1]] },
      { c: "#ffff00", pts: [[0.75, 0.2], [0.79, 0.2]] },
      { c: "#ffff00", pts: [[0.96, 0.2], [1.0, 0.2]] }
    ]},
    { name: "smiley", strokes: [
      { c: "#000000", pts: [[0.5, 0.2], [0.62, 0.23], [0.72, 0.32], [0.76, 0.45], [0.72, 0.58], [0.62, 0.67], [0.5, 0.7], [0.38, 0.67], [0.28, 0.58], [0.24, 0.45], [0.28, 0.32], [0.38, 0.23], [0.5, 0.2]] },
      { c: "#000000", pts: [[0.42, 0.38], [0.42, 0.44]] },
      { c: "#000000", pts: [[0.58, 0.38], [0.58, 0.44]] },
      { c: "#c00000", pts: [[0.38, 0.55], [0.45, 0.61], [0.55, 0.61], [0.62, 0.55]] }
    ]},
    { name: "flower", strokes: [
      { c: "#00c000", pts: [[0.5, 0.9], [0.5, 0.55]] },
      { c: "#00c000", pts: [[0.5, 0.75], [0.38, 0.68]] },
      { c: "#c000c0", pts: [[0.5, 0.42], [0.44, 0.34], [0.5, 0.27], [0.56, 0.34], [0.5, 0.42]] },
      { c: "#c000c0", pts: [[0.5, 0.42], [0.4, 0.44], [0.38, 0.36], [0.45, 0.33]] },
      { c: "#c000c0", pts: [[0.5, 0.42], [0.6, 0.44], [0.62, 0.36], [0.55, 0.33]] },
      { c: "#ffff00", pts: [[0.48, 0.37], [0.52, 0.37], [0.52, 0.4], [0.48, 0.4], [0.48, 0.37]] }
    ]}
  ];

  async function actPaint() {
    const w = await ghostLaunch("paint", "Paint", "Paint");
    if (!w || w.closed) return;
    const cv = w.el.querySelector("canvas");
    if (!cv) return;
    const pic = pick(PICTURES);
    const sp = () => $("#screen").getBoundingClientRect();
    for (const stroke of pic.strokes) {
      check();
      /* choose the color like a person: click the palette chip */
      const chip = [...w.el.querySelectorAll(".pc")].find(b => {
        const bg = b.style.background || b.style.backgroundColor;
        return bg && bg.replace(/\s/g, "") === hexToRgb(stroke.c);
      });
      if (chip) { await clickEl(chip, "down"); await sleep(rnd(150, 350)); }
      const r = cv.getBoundingClientRect();
      const px = (t) => r.left + (0.08 + t * 0.84) * r.width;
      const py = (t) => r.top + (0.05 + t * 0.9) * r.height;
      const pts = stroke.pts;
      let sx = px(pts[0][0]), sy = py(pts[0][1]);
      await moveTo(sx - sp().left, sy - sp().top);
      cv.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: sx, clientY: sy, button: 0 }));
      for (let i = 1; i < pts.length; i++) {
        check();
        const ex = px(pts[i][0]), ey = py(pts[i][1]);
        const segs = Math.max(3, Math.round(Math.hypot(ex - sx, ey - sy) / 9));
        for (let k = 1; k <= segs; k++) {
          const ix = sx + (ex - sx) * k / segs + rnd(-0.6, 0.6);
          const iy = sy + (ey - sy) * k / segs + rnd(-0.6, 0.6);
          cv.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: ix, clientY: iy }));
          cursorEl.style.left = (ix - sp().left) + "px";
          cursorEl.style.top = (iy - sp().top) + "px";
          cx = ix - sp().left; cy = iy - sp().top;
          await sleep(16);
        }
        sx = ex; sy = ey;
      }
      cv.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: sx, clientY: sy, button: 0 }));
      await sleep(rnd(300, 800));
    }
    await sleep(rnd(1500, 2800));   /* step back and admire it */
    await maybeClose(w, 0.7);
  }
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return "rgb(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + ")";
  }

    async function actMusic() {
    const w = await ghostLaunch("megaamp", null, "MegaAmp");
    if (!w || w.closed) return;
    await sleep(rnd(800, 1500));
    const btn = (t) => [...w.el.querySelectorAll("button")].find(b => b.textContent.trim() === t);
    const play = btn("▶");
    if (play) await clickEl(play);
    /* enjoy 2 short listens, maybe skip a track like a restless person */
    for (let i = 0; i < 2; i++) {
      check();
      await sleep(rnd(5000, 9000));
      const next = btn("⏭") || btn(">>");
      if (next && Math.random() < 0.5) { await clickEl(next); }
    }
    await sleep(rnd(3000, 6000));
    const stop = btn("■");
    if (stop) await clickEl(stop);      /* BOB turns the music OFF */
    await sleep(rnd(400, 900));
    await maybeClose(w, 0.9);
  }

    async function actCalc() {
    const w = await ghostLaunch("calc", "Calculator", "Calculator");
    if (!w || w.closed) return;
    const press = async (t) => {
      const b = [...w.el.querySelectorAll("button")].find(x => x.textContent.trim() === t);
      if (b) { await clickEl(b); await sleep(rnd(120, 320)); }
    };
    const a = 12 + ((Math.random() * 88) | 0), b2 = 3 + ((Math.random() * 9) | 0);
    for (const d of String(a)) await press(d);
    await press("*");
    for (const d of String(b2)) await press(d);
    await press("=");
    await sleep(rnd(1500, 3000));   /* admire the result, mouth the number */
    await maybeClose(w);
  }

  async function actDos() {
    const w = await ghostLaunch("dos", "MS-DOS Prompt", "MS-DOS");
    if (!w || w.closed) return;
    const ta = w.el.querySelector("textarea");
    if (!ta) { await maybeClose(w, 1); return; }
    await clickEl(ta);
    const cmds = pick([["ver", "dir", "mem"], ["dir", "ping dave-pc"], ["vol", "dir /w", "cls", "ver"]]);
    for (const cmd of cmds) {
      check();
      for (const ch of cmd) {
        ta.value += ch;
        ta.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(rnd(50, 140));
      }
      await sleep(rnd(200, 500));
      ta.value += "\n";
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(rnd(1500, 3200));   /* read the output like it matters */
    }
    await maybeClose(w, 0.8);
  }

  async function actEncarta() {
    const w = await ghostLaunch("encarta", null, "Encyclopedia");
    if (!w || w.closed) return;
    await sleep(600);
    const rows = [...w.el.querySelectorAll(".tree > div")].filter(d => d.style.fontWeight !== "700" && d.textContent.trim().length > 2);
    for (let i = 0; i < 2 && rows.length; i++) {
      check();
      await clickEl(pick(rows));
      await sleep(rnd(800, 1400));
      const body = [...w.el.querySelectorAll("div")].find(d => d.scrollHeight > d.clientHeight + 40);
      for (let sc = 0; sc < 3 && body; sc++) {
        await sleep(rnd(1800, 3200));
        body.scrollTop += rnd(80, 220);
      }
    }
    await maybeClose(w);
  }

  /* poke around the desktop like a bored person */
  async function actDesktop() {
    const SAFE = ["cool sites.txt", "My Resume.doc", "Encyclopedia 98", "My Computer"];
    const icons = [...document.querySelectorAll("#desktop .dicon")]
      .filter(d => SAFE.some(n => d.textContent.trim().startsWith(n.slice(0, 10))));
    if (!icons.length) return actIdle();
    const ic = pick(icons);
    await clickEl(ic, "down");
    await sleep(rnd(300, 700));
    const before = WM.wins.filter(x => !x.closed).length;
    const p = screenPoint(ic);
    ic.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: p.x, clientY: p.y, button: 0 }));
    for (let i = 0; i < 8; i++) {
      await sleep(300);
      if (WM.wins.filter(x => !x.closed).length > before) break;
    }
    const w = WM.wins[WM.wins.length - 1];
    await sleep(rnd(2500, 5000));    /* read whatever opened */
    if (w && !w.closed && !w.opts.noTaskbar) await maybeClose(w, 0.8);
  }

  /* ---- Pinball: launch, then actually save the ball with timed flips ---- */
  async function actPinball() {
    const w = await ghostLaunch("pinball", "Star Pilot Pinball", "Pinball");
    if (!w || w.closed) return;
    await sleep(rnd(600, 1100));
    /* hold the plunger until it is genuinely charged — a weak pull never
       clears the top arc and the ball just sulks back into the lane */
    const plunge = async () => {
      const target = 12 + Math.random() * 4;      /* always enough, never identical */
      w.el.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
      for (let i = 0; i < 50; i++) {
        await sleepReal(60);
        const d = w._pb && w._pb.dbg ? w._pb.dbg() : null;
        if (d && d.charge >= target) break;
      }
      w.el.dispatchEvent(new KeyboardEvent("keyup", { key: " ", bubbles: true }));
    };
    await plunge();
    let flips = 0, relaunches = 0;
    for (let t = 0; t < 500; t++) {
      check();
      const pos = w._pb && w._pb.ballAt ? w._pb.ballAt() : null;
      if (pos) {
        const bx = pos[0], by = pos[1];
        const vy = w._pb.dbg ? w._pb.dbg().vy : 0;
        /* ball descending into the flipper zone -> bat it with the right side */
        if (by > 380 && by < 505 && bx < 315 && vy > 0.4) {
          const k = bx < 160 ? "z" : (bx > 195 ? "/" : (Math.random() < 0.5 ? "z" : "/"));
          await keyTap(w, k, 200);
          flips++;
          await sleepReal(110);
          continue;
        }
        /* midfield: an occasional stir keeps the orbit lively */
        if (by > 240 && by < 380 && bx < 315 && Math.random() < 0.10) {
          await keyTap(w, Math.random() < 0.5 ? "z" : "/", 130);
        }
        /* ball back at the plunger seat -> launch again */
        if (bx > 315 && by > 430 && t > 12) {
          relaunches++;
          if (relaunches > 4) break;
          await sleepReal(500);
          await plunge();
          await sleepReal(300);
        }
      }
      await sleepReal(45);
    }
    await sleep(rnd(600, 1200));
    await maybeClose(w, 0.85);
  }

  async function actExplorer() {
    const w = await ghostLaunch("explorer", "Windows Explorer", "Exploring");
    if (!w || w.closed) return;
    await sleep(rnd(700, 1200));
    const items = [...w.el.querySelectorAll(".lv-bigitem")];
    if (items.length) {
      const it = pick(items);
      await clickEl(it, "down");          /* select something, consider it */
      await sleep(rnd(1200, 2400));
      const docs = items.find(d => /My Documents/.test(d.textContent));
      if (docs) {
        const p = screenPoint(docs);
        await moveTo(p.x, p.y);
        docs.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: p.x, clientY: p.y, button: 0 }));
        await sleep(rnd(1500, 2600));
      }
    }
    await sleep(rnd(1500, 3000));
    await maybeClose(w);
  }

  const LETTERS = [
    "Dear PenPal,\n\nHow is the weather in your country? Here it is\nmostly modem sounds. I am learning HTML.\n\nYours,\nBOB",
    "To whom it may concern,\n\nI am writing to formally request more RAM.\nMy computer has 64 MB and my dreams have more.\n\nSincerely,\nBOB"
  ];
  async function actWordpad() {
    const w = await ghostLaunch("wordpad", "WordPad", "WordPad");
    if (!w || w.closed) return;
    const ed = w.el.querySelector(".wp-editor");
    if (!ed) { await maybeClose(w, 1); return; }
    await clickEl(ed);
    const text = pick(LETTERS);
    for (const ch of text) {
      check();
      ed.innerText = ed.innerText.replace(/\n$/, "") + ch;
      ed.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(ch === "\n" ? rnd(280, 600) : rnd(45, 140));
    }
    await sleep(rnd(1500, 2800));
    await maybeClose(w, 0.9);
  }

  /* ================= expert skills, wave 3 ================= */

  /* ---- Solitaire: read the table, send cards home, move runs by drag ---- */
  const RANKV = { A: 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13 };
  function readSolCards(w) {
    return [...w.el.querySelectorAll(".card")].map(c => {
      const t = c.textContent.trim();
      const m = t.match(/^(A|10|[2-9JQK])(♠|♥|♦|♣)/);
      return {
        el: c, up: !c.classList.contains("facedown"),
        rank: m ? RANKV[m[1]] : 0, suit: m ? m[2] : "",
        red: c.classList.contains("red"),
        x: parseInt(c.style.left, 10) || 0, y: parseInt(c.style.top, 10) || 0
      };
    });
  }
  async function dragCard(fromEl, toEl) {
    const p1 = screenPoint(fromEl);
    await moveTo(p1.x, p1.y);
    const s = $("#screen").getBoundingClientRect();
    fromEl.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: p1.x + s.left, clientY: p1.y + s.top, button: 0 }));
    await sleep(120);
    const p2 = screenPoint(toEl);
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const ix = p1.x + (p2.x - p1.x) * i / steps, iy = p1.y + (p2.y - p1.y) * i / steps;
      document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: ix + s.left, clientY: iy + s.top }));
      cursorEl.style.left = ix + "px"; cursorEl.style.top = iy + "px";
      cx = ix; cy = iy;
      await sleep(28);
    }
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: p2.x + s.left, clientY: p2.y + s.top, button: 0 }));
    await sleep(rnd(250, 500));
  }
  async function actSolitaire() {
    const w = await ghostLaunch("solitaire", "Solitaire", "Solitaire");
    if (!w || w.closed) return;
    await sleep(rnd(700, 1200));
    const VN = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const SU = ["♣", "♦", "♥", "♠"];
    const rankOf = (c) => c.r || c.v;
    const face = (c) => VN[rankOf(c)] + SU[c.s];
    const isRedS = (su) => su === 1 || su === 2;
    const findCardEl = (c) => [...w.el.querySelectorAll(".card")]
      .find(e => !e.classList.contains("facedown") && e.textContent.indexOf(face(c)) >= 0);
    const S = () => w._sol && w._sol.state();
    /* progress = foundation cards, then flips, then cards built onto the tableau */
    const prog = (st) => {
      if (!st) return -1;
      let down = 0, tabN = 0, fnd = 0;
      st.tab.forEach(col => col.forEach(e2 => { tabN++; if (!e2.up) down++; }));
      st.found.forEach(p => { fnd += p.length; });
      return fnd * 1000 + (28 - down) * 10 + tabN;
    };
    const dbl = async (elc) => {
      const p = screenPoint(elc);
      await moveTo(p.x, p.y);
      elc.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: p.x, clientY: p.y, button: 0 }));
      await sleep(rnd(350, 700));
    };
    let passes = 0, progressThisPass = true;
    for (let round = 0; round < 70; round++) {
      check();
      const st = S();
      if (!st) break;
      const before = prog(st);
      const foundMax = {};
      st.found.forEach(p => { if (p.length) { const t = p[p.length - 1]; const c = t.c || t; foundMax[c.s] = rankOf(c); } });
      const wasteTop = st.waste.length ? (st.waste[st.waste.length - 1].c || st.waste[st.waste.length - 1]) : null;
      const tails = [];
      st.tab.forEach(col => { if (col.length && col[col.length - 1].up) tails.push(col[col.length - 1].c); });

      /* 1. anything home — tableau tails and the waste top, by double-click */
      const homeC = [...tails, ...(wasteTop ? [wasteTop] : [])].find(c => rankOf(c) === (foundMax[c.s] || 0) + 1);
      if (homeC) {
        const elc = findCardEl(homeC);
        if (elc) {
          await dbl(elc);
          if (prog(S()) > before) { progressThisPass = true; continue; }
        }
      }

      /* first face-up card of each column — the head of the movable run */
      const heads = [];
      st.tab.forEach((col, ci) => {
        for (let i = 0; i < col.length; i++) if (col[i].up) { heads.push({ ci, i, c: col[i].c }); return; }
      });
      const kingWaiting = heads.some(h => rankOf(h.c) === 13 && h.i > 0) ||
        (wasteTop && rankOf(wasteTop) === 13);

      /* 2. move a run only when it flips a card (or clears ground for a waiting king) */
      let acted = false;
      const byDepth = heads.slice().sort((a, b) => b.i - a.i);
      for (const h of byDepth) {
        if (h.i === 0 && !(kingWaiting && rankOf(h.c) !== 13)) continue;
        const dstCol = st.tab.findIndex((col, ti) =>
          ti !== h.ci && col.length && col[col.length - 1].up &&
          rankOf(col[col.length - 1].c) === rankOf(h.c) + 1 &&
          isRedS(col[col.length - 1].c.s) !== isRedS(h.c.s));
        if (dstCol < 0) continue;
        const fromEl = findCardEl(h.c);
        const toEl = findCardEl(st.tab[dstCol][st.tab[dstCol].length - 1].c);
        if (!fromEl || !toEl) continue;
        await dragCard(fromEl, toEl);
        if (prog(S()) > before) { acted = true; progressThisPass = true; }
        break;
      }
      if (acted) continue;

      /* 3. a king (with a flip underneath, or from the waste) claims an empty column */
      const emptyIdx = st.tab.findIndex(col => !col.length);
      if (emptyIdx >= 0) {
        const kingH = heads.find(h => rankOf(h.c) === 13 && h.i > 0);
        const kc = kingH ? kingH.c : (wasteTop && rankOf(wasteTop) === 13 ? wasteTop : null);
        if (kc) {
          const fromEl = findCardEl(kc);
          const bases = [...w.el.querySelectorAll(".sol-slot:not(.ace)")].slice(1); /* [0] is the stock */
          if (fromEl && bases[emptyIdx]) {
            await dragCard(fromEl, bases[emptyIdx]);
            if (prog(S()) > before) { progressThisPass = true; continue; }
          }
        }
      }

      /* 4. waste top onto a tableau tail */
      if (wasteTop) {
        const dst = st.tab.findIndex(col => col.length && col[col.length - 1].up &&
          rankOf(col[col.length - 1].c) === rankOf(wasteTop) + 1 &&
          isRedS(col[col.length - 1].c.s) !== isRedS(wasteTop.s));
        if (dst >= 0) {
          const fromEl = findCardEl(wasteTop);
          const toEl = findCardEl(st.tab[dst][st.tab[dst].length - 1].c);
          if (fromEl && toEl) {
            await dragCard(fromEl, toEl);
            if (prog(S()) > before) { progressThisPass = true; continue; }
          }
        }
      }

      /* 5. draw from the stock; a full pass with no progress means the game is stuck */
      if (!st.stock.length && !st.waste.length) break;
      if (!st.stock.length) {
        if (!progressThisPass) break;
        passes++; progressThisPass = false;
        if (passes >= 4) break;
      }
      const slot = w.el.querySelector(".sol-slot");
      if (!slot) break;
      const sx = parseInt(slot.style.left, 10) || 8, sy = parseInt(slot.style.top, 10) || 8;
      const topCard = [...w.el.querySelectorAll(".card")].find(c =>
        Math.abs((parseInt(c.style.left, 10) || 0) - sx) < 8 &&
        Math.abs((parseInt(c.style.top, 10) || 0) - sy) < 8);
      await clickEl(topCard || slot, "down");
      await sleep(rnd(450, 850));
    }
    await sleep(rnd(900, 1500));
    await maybeClose(w);
  }

  /* ---- Spider: BOB double-clicks runs (the game auto-picks the best home) ---- */
  async function actSpider() {
    const w = await ghostLaunch("spider", null, "Spider");
    if (!w || w.closed) return;
    await sleep(rnd(700, 1200));
    const sig = () => w._spider ? w._spider.state().cols.join(",") : "";
    for (let mv = 0; mv < 8; mv++) {
      check();
      const before = sig();
      /* try up-cards from the tallest columns first — more likely to free a flip */
      const ups = [...w.el.querySelectorAll(".card")]
        .filter(c => !c.classList.contains("facedown") && (parseInt(c.style.top, 10) || 0) > 90)
        .sort((a, b) => (parseInt(b.style.top, 10) || 0) - (parseInt(a.style.top, 10) || 0));
      let changed = false;
      for (let i = 0; i < Math.min(6, ups.length); i++) {
        const c = ups[i];
        if (!c.isConnected) continue;
        const p = screenPoint(c);
        await moveTo(p.x, p.y);
        c.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: p.x, clientY: p.y, button: 0 }));
        await sleep(rnd(300, 600));
        if (sig() !== before) { changed = true; break; }
      }
      if (!changed) {
        /* no move found: deal a new row from the stock */
        const stockEl = [...w.el.querySelectorAll(".card")]
          .find(c => (parseInt(c.style.top, 10) || 99) < 90 && (parseInt(c.style.left, 10) || 99) < 80);
        if (stockEl) { await clickEl(stockEl); await sleep(rnd(700, 1200)); }
        if (sig() === before) break;   /* stock empty and stuck — a very 1998 feeling */
      }
    }
    await sleep(rnd(800, 1400));
    await maybeClose(w);
  }

  /* ---- WallBall (JezzBall rules): fire dividers away from the balls ---- */
  async function actWallball() {
    const w = await ghostLaunch("wallball", null, "WallBall");
    if (!w || w.closed) return;
    const cv = w.el.querySelector("canvas");
    if (!cv) { await maybeClose(w, 1); return; }
    await sleep(rnd(800, 1400));
    for (let shot = 0; shot < 8; shot++) {
      check();
      const st = w._wb && w._wb.state();
      if (!st || st.state === "over") break;
      const r = cv.getBoundingClientRect();
      /* find the x farthest from every ball (a safe place to build a wall) */
      let bestX = cv.width / 2, bestD = -1;
      for (let x = cv.width * 0.15; x < cv.width * 0.85; x += cv.width / 12) {
        const d = Math.min(...(st.balls || []).map(b => Math.abs(b.x - x)), 9999);
        if (d > bestD) { bestD = d; bestX = x; }
      }
      const px = r.left + (bestX / cv.width) * r.width;
      const py = r.top + r.height * rnd(0.35, 0.65);
      const sp = $("#screen").getBoundingClientRect();
      await moveTo(px - sp.left, py - sp.top);
      cv.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: px, clientY: py, button: 0 }));
      cv.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: px, clientY: py, button: 0 }));
      cv.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: px, clientY: py, button: 0 }));
      await sleepReal(rnd(2200, 3800));    /* watch the wall grow, pray a little */
    }
    await sleep(rnd(700, 1300));
    await maybeClose(w);
  }

  async function keyTap(w, key, holdMs) {
    w.el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    await sleepReal(holdMs || rnd(70, 160));
    w.el.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
  }

  /* ---- Worm: greedy pathing toward food, avoiding its own tail ---- */
  async function actWorm() {
    const w = await ghostLaunch("worm", null, "Worm");
    if (!w || w.closed) return;
    await sleep(rnd(600, 1000));
    const wm = w._worm;
    if (!wm) { await maybeClose(w, 1); return; }
    const KEY = { "0,1": "ArrowRight", "0,-1": "ArrowLeft", "1,0": "ArrowDown", "-1,0": "ArrowUp" };
    const CH = 26, CW = 40;
    const safe = (st, r, c2) => r > 0 && c2 > 0 && r < CH - 1 && c2 < CW - 1 &&
      !st.snake.some(sg => sg[0] === r && sg[1] === c2);
    /* one decision per game tick — detected by the head actually moving */
    let lastHead = "", eats = 0, foodSig = wm.state().food.join(",");
    for (let i = 0; i < 900; i++) {
      check();
      const st = wm.state();
      if (st.state !== "play") break;
      const f2 = st.food.join(",");
      if (f2 !== foodSig) { foodSig = f2; eats++; if (eats >= 5) break; }
      const headK = st.snake[0].join(",");
      if (headK !== lastHead) {
        lastHead = headK;
        const hr = st.snake[0][0], hc = st.snake[0][1];
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]
          .filter(d => !(d[0] === -st.dir[0] && d[1] === -st.dir[1]))
          .filter(d => safe(st, hr + d[0], hc + d[1]))
          .filter(d => {                                /* keep an exit open */
            const nr = hr + d[0], nc = hc + d[1];
            return [[0, 1], [0, -1], [1, 0], [-1, 0]].some(e2 =>
              !(e2[0] === -d[0] && e2[1] === -d[1]) && safe(st, nr + e2[0], nc + e2[1]));
          })
          .sort((a, b) =>
            (Math.abs(hr + a[0] - st.food[0]) + Math.abs(hc + a[1] - st.food[1])) -
            (Math.abs(hr + b[0] - st.food[0]) + Math.abs(hc + b[1] - st.food[1])));
        if (dirs.length && (dirs[0][0] !== st.dir[0] || dirs[0][1] !== st.dir[1])) {
          w.el.dispatchEvent(new KeyboardEvent("keydown", { key: KEY[dirs[0].join(",")], bubbles: true }));
        }
      }
      await sleepReal(28);
    }
    await sleep(rnd(700, 1200));
    await maybeClose(w);
  }

  /* ---- Stackz: score every rotation x column, then commit ---- */
  async function actStackz() {
    const w = await ghostLaunch("stackz", null, "Stackz");
    if (!w || w.closed) return;
    await sleep(rnd(600, 1000));
    const stk = w._stk;
    const rotOnce = (p) => p[0].map((_, c) => p.map(row => row[c]).reverse());
    for (let block = 0; block < 22; block++) {
      check();
      const st = stk && stk.state();
      if (!st || st.state !== "play") break;
      const H2 = st.grid.length, W2 = st.grid[0].length;
      /* evaluate all rotations and columns of the current piece */
      let best = null;
      let shape = st.piece;
      for (let r = 0; r < 4; r++) {
        for (let x = -2; x < W2; x++) {
          if (stk.collide(x, st.py, shape)) continue;
          let y = st.py;
          while (!stk.collide(x, y + 1, shape)) y++;
          /* score the landing */
          const g = st.grid.map(row => row.slice());
          for (let sy = 0; sy < shape.length; sy++)
            for (let sx = 0; sx < shape[sy].length; sx++)
              if (shape[sy][sx] && g[y + sy] && g[y + sy][x + sx] !== undefined) g[y + sy][x + sx] = 1;
          let lines = 0, holes = 0, aggH = 0;
          for (let ry = 0; ry < H2; ry++) if (g[ry].every(v => v)) lines++;
          for (let cx2 = 0; cx2 < W2; cx2++) {
            let seen = false;
            for (let ry = 0; ry < H2; ry++) {
              if (g[ry][cx2]) { seen = true; aggH += (H2 - ry); break; }
            }
            seen = false;                       /* holes count from the top block down */
            for (let ry = 0; ry < H2; ry++) {
              if (g[ry][cx2]) seen = true;
              else if (seen && !g[ry][cx2]) holes++;
            }
          }
          const score = lines * 100 - holes * 12 - aggH * 0.6 + y * 2;
          if (!best || score > best.score) best = { rot: r, x, score };
        }
        shape = rotOnce(shape);
      }
      if (best) {
        for (let r = 0; r < best.rot; r++) { await keyTap(w, "ArrowUp", 25); await sleepReal(45); }
        const cur = stk.state();
        let dx = best.x - cur.px;
        while (dx !== 0) {
          check();
          await keyTap(w, dx > 0 ? "ArrowRight" : "ArrowLeft", 25);
          dx += dx > 0 ? -1 : 1;
          await sleepReal(45);
        }
        await keyTap(w, " ");                       /* slam it down like you mean it */
        await sleep(rnd(500, 900));
      } else {
        await keyTap(w, "ArrowDown", 300);
        await sleep(600);
      }
    }
    await sleep(rnd(700, 1200));
    await maybeClose(w);
  }

  async function actCorridor() {
    const w = await ghostLaunch("corridor", null, "CORRIDOR");
    if (!w || w.closed) return;
    await sleep(rnd(900, 1500));
    for (let i = 0; i < 4; i++) {
      check();
      await keyTap(w, "w", rnd(900, 1600));           /* stride forward */
      await keyTap(w, Math.random() < 0.5 ? "ArrowLeft" : "ArrowRight", rnd(200, 450));
      await keyTap(w, " ");                            /* zap at nothing in particular */
      await sleep(rnd(400, 800));
    }
    await maybeClose(w, 0.9);
  }

  async function actTV() {
    const w = await ghostLaunch("tv98", null, "TV98");
    if (!w || w.closed) return;
    await sleep(rnd(500, 900));
    const power = [...w.el.querySelectorAll("button")].find(b => b.textContent.trim() === "⏻");
    if (power && w._tv && !w._tv.power()) { await clickEl(power); await sleep(rnd(1200, 2000)); }
    const chans = [...w.el.querySelectorAll("button")].filter(b => /^(CH|[0-9+▲▼-]{1,3})$/.test(b.textContent.trim()));
    for (let i = 0; i < 3; i++) {
      check();
      if (chans.length) await clickEl(pick(chans));
      await sleep(rnd(3000, 6000));          /* channel surfing, the national sport */
    }
    if (power && w._tv && w._tv.power()) await clickEl(power);   /* off when done */
    await sleep(400);
    await maybeClose(w, 0.9);
  }

  async function actComposer() {
    const w = await ghostLaunch("composer", null, "Composer");
    if (!w || w.closed) return;
    await sleep(rnd(700, 1200));
    const cv = w.el.querySelector("canvas");
    if (cv) {
      const r = cv.getBoundingClientRect();
      for (let i = 0; i < 6; i++) {          /* place notes with intent, if not talent */
        check();
        const x = r.left + r.width * (0.1 + 0.8 * (i / 6) + rnd(0, 0.08));
        const y = r.top + r.height * rnd(0.15, 0.85);
        const sp = $("#screen").getBoundingClientRect();
        await moveTo(x - sp.left, y - sp.top);
        cv.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: x, clientY: y, button: 0 }));
        cv.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: x, clientY: y, button: 0 }));
        await sleep(rnd(250, 600));
      }
    }
    const play = [...w.el.querySelectorAll("button")].find(b => /▶/.test(b.textContent));
    if (play) { await clickEl(play); await sleep(rnd(4000, 7000)); }
    const stopB = [...w.el.querySelectorAll("button")].find(b => /■|Stop/.test(b.textContent));
    if (stopB) await clickEl(stopB);
    await maybeClose(w, 0.9);
  }

  async function actPhotogoo() {
    const w = await ghostLaunch("photogoo", null, "PhotoGoo");
    if (!w || w.closed) return;
    await sleep(rnd(700, 1200));
    const cv = w.el.querySelector("canvas");
    if (!cv) { await maybeClose(w, 1); return; }
    const r = cv.getBoundingClientRect();
    const sp = $("#screen").getBoundingClientRect();
    for (let g = 0; g < 3; g++) {
      check();
      let x = r.left + r.width * rnd(0.25, 0.75), y = r.top + r.height * rnd(0.3, 0.7);
      await moveTo(x - sp.left, y - sp.top);
      cv.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: x, clientY: y, button: 0 }));
      for (let i = 0; i < 14; i++) {
        x += rnd(-10, 10); y += rnd(-8, 8);
        cv.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: x, clientY: y }));
        cursorEl.style.left = (x - sp.left) + "px"; cursorEl.style.top = (y - sp.top) + "px";
        await sleep(30);
      }
      cv.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: x, clientY: y }));
      await sleep(rnd(400, 900));
    }
    await sleep(rnd(800, 1500));   /* admire the damage */
    await maybeClose(w);
  }

  async function actSndrec() {
    const w = await ghostLaunch("sndrec", null, "Sound Recorder");
    if (!w || w.closed) return;
    await sleep(rnd(500, 900));
    const btn = (t) => [...w.el.querySelectorAll("button")].find(b => b.textContent.trim() === t);
    const rec = btn("⏺");
    if (rec) {
      await clickEl(rec);                       /* try to record; 1998 says no */
      await sleep(600);
      await dismissStrays();                    /* "no recording device" — acknowledged */
    }
    const play = btn("▶");
    if (play) { await clickEl(play); await sleep(rnd(1500, 2500)); }
    await maybeClose(w, 0.9);
  }

  async function actPal() {
    const w = await ghostLaunch("pal", null, "Pal");
    if (!w || w.closed) return;
    await sleep(rnd(800, 1400));
    const inp = w.el.querySelector("input.field");
    const send = [...w.el.querySelectorAll("button")].find(b => /Send/.test(b.textContent));
    if (inp && send) {
      await clickEl(inp);
      await typeInto(inp, pick(["hey, is netgrab down for you too?", "did you beat my minesweeper time yet", "a/s/l? just kidding. homework?"]));
      await clickEl(send);
      await sleep(rnd(3500, 6000));            /* wait for the reply, read it */
    }
    await maybeClose(w, 0.8);
  }

  async function actBBS() {
    const w = await ghostLaunch("hyperterm", null, "HyperTerminal");
    if (!w || w.closed) return;
    await sleep(rnd(600, 1000));
    /* File > Connect through the real menu */
    const fileM = [...w.el.querySelectorAll(".menubar > span")].find(m => /File|檔案/.test(m.textContent));
    if (fileM) {
      fileM.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      await sleep(rnd(400, 700));
      const item = [...document.querySelectorAll(".menu-pop .menu-item")].find(r => /Connect/.test(r.textContent));
      if (item) { await clickEl(item); item.dispatchEvent(new MouseEvent("mouseup", { bubbles: true })); }
    }
    await sleep(4200);                          /* the 28.8k handshake, savored */
    for (const k of ["m", "1", "q", "g"]) {
      check();
      await keyTap(w, k);
      await sleep(k === "1" ? rnd(3500, 5500) : rnd(1200, 2200));   /* read the boards */
    }
    await sleep(rnd(800, 1400));
    await maybeClose(w, 0.9);
  }

  /* ---- Powder Hill: actually dodge the trees, actually aim for ramps ---- */
  async function actSki() {
    const w = await ghostLaunch("ski", null, "Powder Hill");
    if (!w || w.closed) return;
    await sleep(rnd(700, 1200));
    for (let t = 0; t < 110; t++) {
      check();
      const st = w._ski && w._ski.state();
      if (!st || st.state === "over" || st.state === "eaten") break;
      const px = st.player.x;
      /* look downhill: obstacles approaching the skier's lane */
      const ahead = st.objs.filter(o => o.y > 100 && o.y < 210 && /tree|rock|stump/.test(o.type));
      const danger = ahead.filter(o => Math.abs(o.x - px) < 26);
      const ramp = st.objs.find(o => o.type === "ramp" && o.y > 100 && o.y < 230 && Math.abs(o.x - px) < 60);
      if (danger.length) {
        /* steer toward the side with more open snow */
        const leftBlock = ahead.filter(o => o.x < px && o.x > px - 80).length;
        const rightBlock = ahead.filter(o => o.x > px && o.x < px + 80).length;
        const key = leftBlock <= rightBlock && px > 40 ? "ArrowLeft" : "ArrowRight";
        await keyTap(w, key, rnd(200, 380));
      } else if (ramp) {
        const key = ramp.x < px - 6 ? "ArrowLeft" : ramp.x > px + 6 ? "ArrowRight" : null;
        if (key) await keyTap(w, key, rnd(120, 240));
        else if (Math.random() < 0.4) await keyTap(w, "ArrowDown", rnd(250, 450));   /* tuck into it */
      } else if (Math.random() < 0.25) {
        await keyTap(w, "ArrowDown", rnd(300, 600));    /* clear snow: send it */
      }
      await sleepReal(160);
    }
    await sleep(rnd(600, 1200));
    await maybeClose(w, 0.9);
  }

  /* ---- FreeCell: aces home, alternating runs, free cells as parking ---- */
  async function actFreecell() {
    const w = await ghostLaunch("freecell", null, "FreeCell");
    if (!w || w.closed) return;
    await sleep(rnd(700, 1200));
    const fc = w._fc;
    if (!fc) { await maybeClose(w, 1); return; }
    const VN = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const SU = ["♣", "♦", "♥", "♠"];
    const face = (c) => VN[c.r] + SU[c.s];
    const redS = (su) => su === 1 || su === 2;
    const cardEl2 = (c) => [...w.el.querySelectorAll(".card")].find(e => e.textContent.indexOf(face(c)) >= 0);
    const foundTotal = () => fc.state().found.reduce((a, p) => a + p.length, 0);
    for (let mv = 0; mv < 34; mv++) {
      check();
      const st = fc.state();
      const foundMax = {};
      for (const pile of st.found) if (pile.length) { const t = pile[pile.length - 1]; foundMax[t.s] = t.r; }
      const tails = st.cols.filter(c => c.length).map(c => c[c.length - 1]);
      const frees = st.free.filter(Boolean);
      /* 1. anything home-able → click card, then the matching foundation slot.
         Every click re-renders the felt, so elements are re-queried each step. */
      const home = [...tails, ...frees].find(c => c.r === (foundMax[c.s] || 0) + 1);
      if (home) {
        const ce = cardEl2(home);
        if (ce) {
          const before = foundTotal();
          await clickEl(ce, "down");
          await sleep(rnd(250, 500));
          let ti = st.found.findIndex(p => p.length && p[p.length - 1].s === home.s);
          if (ti < 0) ti = st.found.findIndex(p => !p.length);
          const slot = w.el.querySelectorAll(".sol-slot.ace")[ti];
          if (slot) { await clickEl(slot, "down"); await sleep(rnd(250, 450)); }
          if (foundTotal() > before) continue;
        }
      }
      /* 2. column-to-column: tail onto tail (descending, alternating color) */
      let moved = false;
      for (const c of tails) {
        const dst = tails.find(d => d !== c && d.r === c.r + 1 && redS(d.s) !== redS(c.s));
        if (!dst) continue;
        const a = cardEl2(c);
        if (!a) continue;
        await clickEl(a, "down"); await sleep(rnd(250, 450));
        const b = cardEl2(dst);                 /* re-find after the re-render */
        if (b) { await clickEl(b, "down"); await sleep(rnd(300, 600)); moved = true; }
        break;
      }
      if (moved) continue;
      /* 2b. unpark: free-cell card that fits a column tail */
      for (const c of frees) {
        const dst = tails.find(d => d.r === c.r + 1 && redS(d.s) !== redS(c.s));
        if (!dst) continue;
        const a = cardEl2(c);
        if (!a) continue;
        await clickEl(a, "down"); await sleep(rnd(250, 450));
        const b = cardEl2(dst);
        if (b) { await clickEl(b, "down"); await sleep(rnd(300, 600)); moved = true; }
        break;
      }
      if (moved) continue;
      /* 2c. an empty column is a workbench: move a tail run onto it */
      const emptyIdx = st.cols.findIndex(c => !c.length);
      if (emptyIdx >= 0 && tails.length) {
        const pick = tails.reduce((a, b) => (b.r > a.r ? b : a));
        const a = cardEl2(pick);
        if (a) {
          await clickEl(a, "down"); await sleep(rnd(250, 450));
          const base = w.el.querySelectorAll(".sol-slot")[8 + emptyIdx] ||
            [...w.el.querySelectorAll(".sol-slot")].filter(sl => !sl.classList.contains("ace"))[emptyIdx];
          if (base) { await clickEl(base, "down"); await sleep(rnd(300, 600)); continue; }
        }
      }
      /* 3. park something in a free cell to unstick (keep 1 cell free) */
      if (st.free.filter(f => !f).length > 1 && tails.length) {
        const c = tails[(Math.random() * tails.length) | 0];
        const ce = cardEl2(c);
        if (ce) {
          const p = screenPoint(ce);
          await moveTo(p.x, p.y);
          ce.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: p.x, clientY: p.y, button: 0 }));
          await sleep(rnd(400, 700));
          continue;
        }
      }
      break;
    }
    await sleep(rnd(800, 1400));
    await maybeClose(w);
  }

  /* ---- Hearts: dump the dangerous cards, then duck under every trick ---- */
  async function actHearts() {
    const w = await ghostLaunch("hearts", null, "Hearts");
    if (!w || w.closed) return;
    await sleep(rnd(900, 1500));
    const hs = w._hearts;
    if (!hs) { await maybeClose(w, 1); return; }
    /* my hand is the bottom row of cards */
    const handEls = () => [...w.el.querySelectorAll(".card")]
      .filter(c => !c.classList.contains("facedown"))
      .filter(c => { const r = c.getBoundingClientRect(); const wr = w.el.getBoundingClientRect(); return r.top > wr.top + wr.height * 0.6; })
      .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    /* pass phase: give away the three highest cards */
    if (hs.state().phase === "pass") {
      const hand = hs.state().hand || [];
      const idxs = hand.map((c, i) => ({ i, v: c.r + (c.s === 3 && c.r >= 12 ? 10 : 0) }))
        .sort((a, b) => b.v - a.v).slice(0, 3).map(o => o.i);
      for (const i of idxs) {
        const els = handEls();                  /* selection re-renders the hand */
        if (els[i]) { await clickEl(els[i], "down"); await sleep(rnd(300, 600)); }
      }
      const pass = w.el.querySelector(".h-pass");
      if (pass) { await clickEl(pass); await sleep(rnd(800, 1400)); }
    }
    /* play phase: when it's our turn, try cards lowest-first until one is accepted */
    for (let round = 0; round < 40; round++) {
      check();
      const st = hs.state();
      if (!st.hand || !st.hand.length) break;
      if (st.phase === "play" && st.turn === 0) {
        const order = st.hand.map((c, i) => ({ i, r: c.r })).sort((a, b) => a.r - b.r);
        const before = st.hand.length;
        for (const o of order) {
          const els = handEls();
          if (!els[o.i]) continue;
          await clickEl(els[o.i], "down");
          await sleep(rnd(350, 600));
          if (hs.state().hand.length < before) break;   /* the engine accepted it */
        }
      }
      await sleepReal(700);
    }
    await sleep(rnd(800, 1400));
    await maybeClose(w);
  }

  /* ================= the universal explorer: every other program ================= */
  const GENERIC_APPS = ["magnifier", "osk", "clipbook", "addrbook",
    "display", "datetime", "sounds", "themes", "mouse", "regional", "sysprops", "media",
    "cdplayer", "charmap", "slides", "megademo", "netmeet", "regedit", "deskpet",
    "calendar", "stickies", "surreal", "zipmaster", "spreadsheet", "netgrab", "defrag",
    "vscan", "scandisk", "pagecrafter", "sysmon", "writer", "chatterbox", "dialer", "run", "find", "help"];
  const DANGER_BTN = /delete|remove|clear|format|empty|uninstall|reset|purge|清除|移除|刪除/i;
  let lastGeneric = "";

  async function exploreApp(appId) {
    check();
    const before = WM.wins.filter(x => !x.closed).length;
    W98.launch(appId);
    await sleep(rnd(900, 1500));
    await handleDialPrompt();                   /* net-gated apps get dialed for */
    const w = WM.wins.filter(x => !x.closed && !x.opts.noTaskbar).slice(-1)[0];
    if (!w || WM.wins.filter(x => !x.closed).length <= before && !w) return;
    await sleep(rnd(1000, 2000));               /* look around first */
    /* poke a tab */
    const tabs = [...w.el.querySelectorAll(".tab, [class*=tab-btn]")];
    if (tabs.length > 1) { await clickEl(tabs[1]); await sleep(rnd(800, 1500)); }
    /* click one safe button */
    const safeBtns = [...w.el.querySelectorAll("button.btn")].filter(b => {
      const t = b.textContent.trim();
      return t && t.length < 22 && !DANGER_BTN.test(t) && !/OK|Cancel|Close|關閉|取消|確定/.test(t) && !b.closest(".titlebar");
    });
    if (safeBtns.length && Math.random() < 0.8) { await clickEl(pick(safeBtns)); await sleep(rnd(700, 1400)); await dismissStrays(); }
    /* select a list row */
    const rows = [...w.el.querySelectorAll(".tree > div, .lv-bigitem, tbody tr")].slice(0, 12);
    if (rows.length) { await clickEl(pick(rows), "down"); await sleep(rnd(800, 1500)); }
    /* nudge a slider */
    const slider = w.el.querySelector("input[type=range]");
    if (slider) {
      const v = Number(slider.min || 0) + (Number(slider.max || 100) - Number(slider.min || 0)) * rnd(0.3, 0.7);
      slider.value = String(Math.round(v));
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(rnd(500, 1000));
    }
    /* scroll something */
    const scroller = [...w.el.querySelectorAll("div")].find(d => d.scrollHeight > d.clientHeight + 60);
    if (scroller) { for (let i = 0; i < 2; i++) { scroller.scrollTop += rnd(60, 160); await sleep(rnd(600, 1200)); } }
    await sleep(rnd(1200, 2400));
    if (w && !w.closed) await maybeClose(w, 0.85);
    await dismissStrays();
  }

  async function actExplore() {
    const pool = GENERIC_APPS.filter(a => a !== lastGeneric && W98.Apps[a]);
    const appId = pick(pool);
    lastGeneric = appId;
    trace("explore " + appId);
    await exploreApp(appId);
  }

  async function actIdle() {
    /* coffee. staring. the 1998 default state. */
    for (let i = 0; i < 4; i++) {
      check();
      await moveTo(cx + rnd(-40, 40), cy + rnd(-25, 25));
      await sleep(rnd(1800, 3500));
    }
  }

  async function actWindowShuffle() {
    const open = WM.wins.filter(w => !w.closed && !w.opts.noTaskbar);
    if (!open.length) return actIdle();
    for (let i = 0; i < Math.min(2, open.length); i++) {
      check();
      const w = pick(open);
      const bar = w.el.querySelector(".titlebar") || w.el;
      await clickEl(bar, "down");
      await sleep(rnd(700, 1400));
    }
  }

  const ACTIVITIES = [
    { id: "explore", w: 4, run: actExplore },
    { id: "solitaire", w: 2, run: actSolitaire },
    { id: "freecell", w: 1, run: actFreecell },
    { id: "hearts", w: 1, run: actHearts },
    { id: "spider", w: 1, run: actSpider },
    { id: "wallball", w: 1, run: actWallball },
    { id: "worm", w: 1, run: actWorm },
    { id: "stackz", w: 2, run: actStackz },
    { id: "corridor", w: 1, run: actCorridor },
    { id: "tv", w: 2, run: actTV },
    { id: "composer", w: 1, run: actComposer },
    { id: "photogoo", w: 1, run: actPhotogoo },
    { id: "sndrec", w: 1, run: actSndrec },
    { id: "palchat", w: 2, run: actPal },
    { id: "bbs", w: 1, run: actBBS },
    { id: "ski", w: 2, run: actSki },
    { id: "diary", w: 3, run: actDiary },
    { id: "mine", w: 3, run: actMinesweeper },
    { id: "browse", w: 3, run: actBrowse },
    { id: "paint", w: 3, run: actPaint },
    { id: "mail", w: 2, run: actMail },
    { id: "claude", w: 2, run: actClaude },
    { id: "calc", w: 2, run: actCalc },
    { id: "dos", w: 2, run: actDos },
    { id: "encarta", w: 2, run: actEncarta },
    { id: "desktop", w: 2, run: actDesktop },
    { id: "pinball", w: 2, run: actPinball },
    { id: "explorer", w: 1, run: actExplorer },
    { id: "wordpad", w: 2, run: actWordpad },
    { id: "music", w: 1, run: actMusic },
    { id: "idle", w: 1, run: actIdle },
    { id: "shuffle", w: 1, run: actWindowShuffle }
  ];

  async function dismissStrays() {
    /* popup ads, era dialogs, wizards — BOB sighs and closes them */
    for (let i = 0; i < 3; i++) {
      const stray = WM.wins.find(x => !x.closed && x.opts.noTaskbar);
      if (!stray) return;
      const btn = [...stray.el.querySelectorAll("button")]
        .find(b => /^(OK|Close|No|Cancel|Finish|確定|關閉|否|取消|完成)$/.test(b.textContent.trim()));
      try {
        if (btn) await clickEl(btn); else stray.close(true);
      } catch (e) { if (e === STOP) throw e; }
      await sleep(400);
    }
  }

  async function runLoop() {
    try {
      await sleep(600);
      while (active) {
        await dismissStrays();
        const pool = ACTIVITIES.filter(a => a.id !== lastActivity);
        const total = pool.reduce((s, a) => s + a.w, 0);
        let r = Math.random() * total;
        const act = pool.find(a => (r -= a.w) <= 0) || pool[0];
        lastActivity = act.id;
        abortAct = false;
        trace("act " + act.id);
        /* watchdog: an activity gets 100s, then BOB shrugs and moves on */
        let watchdogTimer = null;
        const guarded = Promise.race([
          act.run().catch(e => { if (e !== STOP || active) return; throw e; }),
          new Promise((res) => { watchdogTimer = setTimeout(() => { abortAct = true; trace("watchdog " + act.id); res(); }, turbo ? 15000 : 100000); })
        ]);
        try { await guarded; } catch (e) { if (e === STOP && !active) throw e; }
        clearTimeout(watchdogTimer);
        abortAct = false;
        if (!active) throw STOP;
        /* between tasks: maybe tidy one window, always pause like a person */
        {
          const open = WM.wins.filter(w => !w.closed && !w.opts.noTaskbar);
          if (open.length > 2) {
            try { await closeWin(open[0]); } catch (e) { if (e === STOP) throw e; }
          }
        }
        await sleep(rnd(1500, 4000));
      }
    } catch (e) {
      if (e !== STOP) console.error("autopilot:", e);
    }
  }

  /* ---------- takeover / handback ---------- */
  function realInput(e) {
    if (!e.isTrusted) return;
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    stop(true);
  }

  function start() {
    if (active) return;
    active = true;
    lastActivity = "";
    cx = 400; cy = 300;
    makeCursor();
    shield = el("div", { style: "position:absolute;inset:0;z-index:99900;background:transparent" });
    shield.addEventListener("contextmenu", (e) => e.preventDefault());
    $("#screen").append(shield);
    banner = el("div", {
      style: "position:absolute;top:6px;right:8px;z-index:99991;background:#000080;color:#fff;" +
        "font-family:Tahoma,sans-serif;font-size:11px;padding:4px 10px;border:1px solid #fff;pointer-events:none;opacity:0.92"
    }, el("span", { text: W98.tr("AUTOPILOT — BOB is using this computer. Press ESC to take it back.") }));
    $("#screen").append(banner);
    Sound.play("info");
    /* grace period so the click that started autopilot doesn't end it */
    setTimeout(() => {
      if (!active) return;
      document.addEventListener("keydown", realInput, true);
    }, 600);
    runLoop();
  }

  function stop(byUser) {
    if (!active) return;
    active = false;
    document.removeEventListener("keydown", realInput, true);
    if (cursorEl) { cursorEl.remove(); cursorEl = null; }
    if (shield) { shield.remove(); shield = null; }
    if (banner) { banner.remove(); banner = null; }
    if (byUser) {
      Sound.play("ding");
      const toast = el("div", {
        style: "position:absolute;top:6px;right:8px;z-index:99991;background:#c0c0c0;color:#000;" +
          "font-family:Tahoma,sans-serif;font-size:11px;padding:4px 10px;border:2px solid;border-color:#fff #404040 #404040 #fff"
      }, el("span", { text: W98.tr("You have taken back control. BOB says goodbye.") }));
      $("#screen").append(toast);
      setTimeout(() => toast.remove(), 3500);
    }
  }

  function confirmStart() {
    WM.msgbox({
      title: "Autopilot 98", icon: "claude98",
      text: W98.tr("Hand this computer to BOB?\n\nBOB will browse, type, tidy his windows and play a\nrespectable game of Minesweeper. Press ESC at any\ntime to take back control."),
      buttons: ["Engage", "Cancel"]
    }).then(r => { if (r === "Engage") start(); });
  }

  return { start, stop, confirmStart, get active() { return active; }, _trace: TRACE,
    _act: (id) => { const a = ACTIVITIES.find(x => x.id === id); return a && a.run(); },
    /* probe: run the universal explorer against one app (testing) */
    _probe: async (appId, fast) => {
      if (active) return "busy";
      active = true; turbo = !!fast; cx = 400; cy = 300;
      makeCursor();
      try { await exploreApp(appId); }
      catch (e) { if (e !== STOP) { turbo = false; stop(false); throw e; } }
      finally { turbo = false; stop(false); }
      return "ok";
    },
    /* marathon test: n random activities through the real loop machinery */
    _marathon: async (n, fast) => {
      if (active) return "already active";
      active = true; turbo = !!fast; cx = 400; cy = 300;
      makeCursor();
      const done = [];
      try {
        for (let i = 0; i < n && active; i++) {
          const pool = ACTIVITIES.filter(a => a.id !== lastActivity && a.id !== "idle");
          const act = pool[(Math.random() * pool.length) | 0];
          lastActivity = act.id;
          abortAct = false;
          let wd = null;
          await Promise.race([
            act.run().catch(e => { if (e !== STOP) trace("err " + act.id + ": " + e.message); }),
            new Promise(res => { wd = setTimeout(() => { abortAct = true; trace("watchdog " + act.id); res(); }, 20000); })
          ]);
          clearTimeout(wd);
          abortAct = false;
          done.push(act.id);
        }
      } finally { turbo = false; stop(false); }
      return done;
    },
    /* run one activity in isolation (testing) — no main loop competing for the hand */
    _solo: async (id, fast) => {
      if (active) return "already active";
      active = true; turbo = !!fast; cx = 400; cy = 300;
      makeCursor();
      try { await ACTIVITIES.find(x => x.id === id).run(); }
      catch (e) { if (e !== STOP) throw e; }
      finally { turbo = false; stop(false); }
      return "done";
    } };
})();

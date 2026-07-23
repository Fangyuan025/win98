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

  async function actPinball() {
    const w = await ghostLaunch("pinball", "Star Pilot Pinball", "Pinball");
    if (!w || w.closed) return;
    await sleep(rnd(600, 1100));
    /* pull the plunger: hold SPACE, release */
    w.el.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await sleep(rnd(700, 1000));
    w.el.dispatchEvent(new KeyboardEvent("keyup", { key: " ", bubbles: true }));
    /* flip at the ball now and then, like it helps */
    for (let i = 0; i < 5; i++) {
      check();
      await sleep(rnd(1200, 2500));
      const k = Math.random() < 0.5 ? "z" : "/";
      w.el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
      await sleep(rnd(120, 260));
      w.el.dispatchEvent(new KeyboardEvent("keyup", { key: k, bubbles: true }));
    }
    await sleep(rnd(1000, 2000));
    await maybeClose(w, 0.8);
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

/* autopilot.js — Autopilot 98: hand the computer to BOB, a ghost user who
   works the machine like it is 1998. A visible cursor drifts with human
   easing, menus open, sentences get typed (with typos, then regret, then
   backspace), Minesweeper gets played badly. Any real mouse or key input
   instantly returns control. */
"use strict";
W98.Autopilot = (() => {
  let active = false;
  let cursorEl = null, banner = null;
  let cx = 400, cy = 300;
  let lastActivity = "";
  const STOP = Symbol("autopilot-stop");
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  /* ---------- abort-aware primitives ---------- */
  function check() { if (!active) throw STOP; }
  function sleep(ms) {
    return new Promise((res, rej) => {
      const t = setTimeout(() => active ? res() : rej(STOP), ms);
      if (!active) { clearTimeout(t); rej(STOP); }
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
    if (!el2 || !el2.isConnected) throw STOP;
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

  /* find a window by title fragment */
  const winBy = (frag) => WM.wins.find(w => !w.closed && w.title.indexOf(frag) >= 0);

  /* launch an app the human way: through the Start menu when possible */
  async function ghostLaunch(appId, progLabel) {
    check();
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
    const win = await ghostLaunch("notepad", "Notepad");
    const w = winBy("Notepad") || win;
    if (!w) return;
    const ta = w.el.querySelector("textarea");
    if (!ta) return;
    await clickEl(ta);
    await typeInto(ta, pick(DIARY));
    await sleep(rnd(1200, 2600));
    /* sometimes close it and refuse to save — a very 1998 relationship with data */
    if (Math.random() < 0.5) {
      const closeBtn = w.el.querySelector(".t-btn.close") || w.el.querySelector("[data-tip=Close]");
      if (closeBtn) await clickEl(closeBtn); else w.close();
      await sleep(600);
      const box = WM.wins.find(x => !x.closed && x.opts.noTaskbar && /save|儲存/i.test(x.el.textContent));
      if (box) {
        const no = [...box.el.querySelectorAll("button")].find(b => /^(No|否)$/.test(b.textContent.trim()));
        if (no) await clickEl(no);
      }
    }
  }

  async function actMinesweeper() {
    await ghostLaunch("minesweeper", "Minesweeper");
    const w = winBy("Minesweeper") || winBy("踩地雷");
    if (!w) return;
    for (let i = 0; i < 7; i++) {
      check();
      const cells = [...w.el.querySelectorAll(".mcell.hid")];
      if (!cells.length) break;
      await clickEl(pick(cells));
      await sleep(rnd(500, 1400));
      if (/💀|😵/.test(w.el.textContent) || w.el.querySelector(".mcell.boom")) {
        await sleep(rnd(900, 1600));   /* the moment of reflection */
        break;
      }
    }
    await sleep(rnd(800, 1500));
  }

  async function actBrowse() {
    await ghostLaunch("ie", "Internet Explorer");
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
  }

  async function actMail() {
    await ghostLaunch("mail", "Internet Mail");
    const w = winBy("Internet Mail");
    if (!w) return;
    const rows = [...w.el.querySelectorAll("[class*=row], tbody tr, .list > div")].slice(0, 6);
    for (let i = 0; i < Math.min(2, rows.length); i++) {
      check();
      await clickEl(rows[(Math.random() * rows.length) | 0]);
      await sleep(rnd(3000, 6000));   /* reading aunt carol takes time */
    }
    await sleep(rnd(800, 1500));
  }

  async function actClaude() {
    await ghostLaunch("claude98", null);
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
  }

  async function actPaint() {
    await ghostLaunch("paint", "Paint");
    const w = winBy("Paint") || winBy("小畫家");
    if (!w) return;
    const cv = w.el.querySelector("canvas");
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    for (let stroke = 0; stroke < 3; stroke++) {
      check();
      let px = r.left + rnd(30, r.width - 60), py = r.top + rnd(30, r.height - 60);
      const sp = $("#screen").getBoundingClientRect();
      await moveTo(px - sp.left, py - sp.top);
      cv.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: px, clientY: py }));
      for (let i = 0; i < 22; i++) {
        check();
        px += rnd(-4, 18); py += Math.sin(i / 3) * 9 + rnd(-3, 3);
        cv.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: px, clientY: py }));
        cursorEl.style.left = (px - sp.left) + "px";
        cursorEl.style.top = (py - sp.top) + "px";
        cx = px - sp.left; cy = py - sp.top;
        await sleep(28);
      }
      cv.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: px, clientY: py }));
      await sleep(rnd(500, 1200));
    }
    await sleep(rnd(900, 1600));
  }

  async function actMusic() {
    await ghostLaunch("megaamp", null);
    await sleep(rnd(1500, 2500));
    const w = winBy("MegaAmp");
    if (!w) return;
    const play = [...w.el.querySelectorAll("button")].find(b => /▶|Play/.test(b.textContent));
    if (play) await clickEl(play);
    /* bob it along for a while */
    for (let i = 0; i < 5; i++) { check(); await sleep(rnd(2500, 4500)); }
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
    { id: "mail", w: 2, run: actMail },
    { id: "claude", w: 2, run: actClaude },
    { id: "paint", w: 2, run: actPaint },
    { id: "music", w: 1, run: actMusic },
    { id: "idle", w: 2, run: actIdle },
    { id: "shuffle", w: 1, run: actWindowShuffle }
  ];

  async function runLoop() {
    try {
      await sleep(600);
      while (active) {
        const pool = ACTIVITIES.filter(a => a.id !== lastActivity);
        const total = pool.reduce((s, a) => s + a.w, 0);
        let r = Math.random() * total;
        const act = pool.find(a => (r -= a.w) <= 0) || pool[0];
        lastActivity = act.id;
        try { await act.run(); } catch (e) { if (e === STOP) throw e; }
        check();
        /* between tasks: maybe tidy one window, always pause like a person */
        if (Math.random() < 0.4) {
          const open = WM.wins.filter(w => !w.closed && !w.opts.noTaskbar);
          if (open.length > 3) {
            const w = pick(open);
            const closeBtn = w.el.querySelector(".t-btn.close");
            if (closeBtn) { try { await clickEl(closeBtn); } catch (e) { if (e === STOP) throw e; } }
            await sleep(400);
            const box = WM.wins.find(x => !x.closed && x.opts.noTaskbar && /save|儲存/i.test(x.el.textContent));
            if (box) {
              const no = [...box.el.querySelectorAll("button")].find(b => /^(No|否)$/.test(b.textContent.trim()));
              if (no) { try { await clickEl(no); } catch (e) { if (e === STOP) throw e; } }
            }
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
    stop(true);
  }

  function start() {
    if (active) return;
    active = true;
    lastActivity = "";
    cx = 400; cy = 300;
    makeCursor();
    banner = el("div", {
      style: "position:absolute;top:6px;right:8px;z-index:99991;background:#000080;color:#fff;" +
        "font-family:Tahoma,sans-serif;font-size:11px;padding:4px 10px;border:1px solid #fff;pointer-events:none;opacity:0.92"
    }, el("span", { text: W98.tr("AUTOPILOT — BOB is using this computer. Move the mouse to take it back.") }));
    $("#screen").append(banner);
    Sound.play("info");
    /* grace period so the click that started autopilot doesn't end it */
    setTimeout(() => {
      if (!active) return;
      document.addEventListener("mousemove", realInput, true);
      document.addEventListener("mousedown", realInput, true);
      document.addEventListener("keydown", realInput, true);
      document.addEventListener("wheel", realInput, true);
    }, 1200);
    runLoop();
  }

  function stop(byUser) {
    if (!active) return;
    active = false;
    document.removeEventListener("mousemove", realInput, true);
    document.removeEventListener("mousedown", realInput, true);
    document.removeEventListener("keydown", realInput, true);
    document.removeEventListener("wheel", realInput, true);
    if (cursorEl) { cursorEl.remove(); cursorEl = null; }
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
      text: W98.tr("Hand this computer to BOB?\n\nBOB will browse, type, play and lose at Minesweeper\nlike a real 1998 user. Move the mouse or press any\nkey at any time to take back control."),
      buttons: ["Engage", "Cancel"]
    }).then(r => { if (r === "Engage") start(); });
  }

  return { start, stop, confirmStart, get active() { return active; } };
})();

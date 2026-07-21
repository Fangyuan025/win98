/* main.js — bootstrap, global behaviors */
"use strict";
(() => {
  /* suppress default context menu everywhere */
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  /* Win98 arrow cursor + hourglass busy cursor */
  document.body.style.cursor = `url(${Icons.cursorArrow()}) 0 0, default`;
  if (Icons.cursorWait) {
    const st = document.createElement("style");
    st.textContent = `.hourglass, .hourglass * { cursor: url(${Icons.cursorWait()}) 6 10, wait !important; }`;
    document.head.append(st);
  }

  /* pointer trails (Mouse control panel > Motion) */
  let trailOn = false, trailPool = [], trailIdx = 0, lastTrail = 0;
  W98.setPointerTrails = function (on) {
    trailOn = on;
    if (!on) trailPool.forEach(t => t.style.opacity = "0");
  };
  function initTrails() {
    for (let i = 0; i < 8; i++) {
      const im = new Image();
      im.src = Icons.cursorArrow();
      im.style.cssText = "position:fixed;z-index:99990;pointer-events:none;opacity:0;transition:opacity 260ms linear";
      document.body.append(im);
      trailPool.push(im);
    }
    document.addEventListener("mousemove", (e) => {
      if (!trailOn) return;
      const now = performance.now();
      if (now - lastTrail < 40) return;
      lastTrail = now;
      const n = Store.get("mouseTrailLen", 4);
      const im = trailPool[trailIdx++ % Math.min(n + 2, trailPool.length)];
      im.style.left = e.clientX + "px";
      im.style.top = e.clientY + "px";
      im.style.opacity = "0.7";
      setTimeout(() => { im.style.opacity = "0"; }, 60);
    }, { passive: true });
  }
  initTrails();
  W98.setPointerTrails(Store.get("mouseTrails", false));

  /* restore the chosen card back for all card games */
  const deckUrl = Store.get("solDeckUrl", null);
  if (deckUrl) document.documentElement.style.setProperty("--cardback", `url(${deckUrl})`);

  /* refit maximized windows on resize */
  window.addEventListener("resize", debounce(() => {
    for (const w of WM.wins) {
      if (w.maximized) {
        const d = WM.desktopRect();
        w.el.style.width = (d.w + 4) + "px";
        w.el.style.height = (d.h + 4) + "px";
        if (w.opts.onResize) w.opts.onResize();
      }
    }
    W98.Desktop.render();
  }, 150));

  /* Ctrl+Alt+Del — Close Program dialog; twice = you know what happens */
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.altKey && (e.key === "Delete" || e.key === "Backspace")) {
      e.preventDefault();
      const open = WM.wins.find(w => w.opts._closeProg && !w.closed);
      if (open) {
        open.close(true);
        W98.BSOD.show();
      } else closeProgramDialog();
    }
  });

  function closeProgramDialog() {
    if (WM.wins.some(w => w.opts._closeProg)) return;
    const win = WM.create({
      title: "Close Program", icon: "system", width: 360, height: 300,
      resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
    });
    win.opts._closeProg = true;
    win.body.style.padding = "10px";
    const list = el("div", { class: "listview sunken", style: "height:140px;padding:2px" });
    let sel = null;
    const entries = WM.wins.filter(w => !w.opts.noTaskbar).map(w => ({ w, label: w.title }));
    entries.push({ w: null, label: "Explorer" }, { w: null, label: "Systray" });
    entries.forEach((en) => {
      const row = el("div", { class: "lv-item" }, el("span", { class: "nm", text: en.label }));
      row.addEventListener("click", () => {
        $$(".lv-item", list).forEach(r => r.classList.remove("sel"));
        row.classList.add("sel");
        sel = en;
      });
      list.append(row);
    });
    const note = el("div", {
      style: "padding:8px 2px;line-height:1.4",
      text: "WARNING: Pressing CTRL+ALT+DEL again will restart your computer. You will lose unsaved information in all programs that are running."
    });
    const btns = el("div", { class: "msgbox-btns", style: "justify-content:flex-end" });
    const endBtn = el("button", { class: "btn", text: "End Task" });
    const cancelBtn = el("button", { class: "btn", text: "Cancel" });
    endBtn.addEventListener("click", () => {
      if (!sel) return;
      if (sel.w) { sel.w.close(); win.close(); }
      else {
        win.close();
        WM.msgbox({
          title: "Explorer", icon: "warning",
          text: "This program is not responding. It cannot be closed because Windows needs it.\n(Nice try, though.)"
        });
      }
    });
    cancelBtn.addEventListener("click", () => win.close());
    btns.append(endBtn, cancelBtn);
    win.body.append(list, note, btns);
  }

  /* Welcome window */
  function showWelcome() {
    if (!Store.get("showWelcome", true)) return;
    const win = WM.create({
      title: "Welcome to Windows 98", icon: "help", width: 480, height: 330,
      resizable: false, maximizable: false, center: true
    });
    const head = el("div", {
      style: "background:linear-gradient(135deg,#00007b,#1084d0);color:#fff;padding:18px 20px;flex:none"
    },
      el("div", { style: "font-size:26px;font-family:'Times New Roman',serif", text: "Welcome" }),
      el("div", { style: "font-size:13px;margin-top:4px", text: "to the exciting new world of Windows 98" })
    );
    const TIPS = [
      "You can hold SPACE in Star Pilot Pinball to charge the plunger. Light all three star gates for MULTIBALL.",
      "Type SNAKE at the MS-DOS Prompt. You did not hear it from us.",
      "Right-drag a file in Explorer to choose Move, Copy, or Create Shortcut.",
      "Browse the Network Neighborhood. Dave shares his mp3z folder. Mom's PRIVATE folder is exactly that.",
      "Press Ctrl+P in Notepad, WordPad, or Paint to print to the EpsonJet. Watch the tray icon.",
      "The Encyclopedia has an article about volcanoes. Statistically, you are about to read it instead of doing homework.",
      "Double-click a buddy in Pal Messenger. CoolDave2000 has opinions about Minesweeper.",
      "Things you delete go to the Recycle Bin. Things Dave deletes are gone forever, which explains a lot.",
      "Pixel the cat lives in WordPad now. Type 'Dear' and see what happens.",
      "Add/Remove Programs actually removes programs. It will also reinstall them, because it misses them."
    ];
    let tipIdx = (Store.get("tipIdx", -1) + 1) % TIPS.length;
    Store.set("tipIdx", tipIdx);
    const mid = el("div", { style: "flex:1;padding:14px 20px;display:flex;gap:14px;min-height:0" });
    const left = el("div", { style: "display:flex;flex-direction:column;gap:8px;flex:none" });
    const mkLink = (label, fn) => {
      const b = el("button", { class: "btn", text: label, style: "text-align:left;width:190px" });
      b.addEventListener("click", fn);
      return b;
    };
    left.append(
      el("div", { text: "Learn about your desktop:", style: "margin-bottom:2px" }),
      mkLink("Discover Windows 98", () => { W98.launch("help"); }),
      mkLink("Take a Tour", () => { W98.launch("help", "tour"); }),
      mkLink("Play Minesweeper", () => W98.launch("minesweeper"))
    );
    const tipBody = el("div", { style: "flex:1;font-size:12px;line-height:1.5", text: TIPS[tipIdx] });
    const nextTip = el("button", { class: "btn", text: "Next Tip", style: "align-self:flex-end;margin-top:6px" });
    nextTip.addEventListener("click", () => {
      tipIdx = (tipIdx + 1) % TIPS.length;
      Store.set("tipIdx", tipIdx);
      tipBody.textContent = TIPS[tipIdx];
    });
    const tipBox = el("div", { class: "sunken", style: "flex:1;background:#fff;padding:10px 12px;display:flex;flex-direction:column;min-height:0" },
      el("div", { style: "font-weight:700;color:#000080;margin-bottom:6px", text: "Did you know?" },),
      tipBody, nextTip);
    mid.append(left, tipBox);
    const bottom = el("div", { style: "flex:none;padding:8px 20px 12px;display:flex;align-items:center;justify-content:space-between" });
    const chk = el("label", { class: "checkline" }, el("input", { type: "checkbox" }), "Show this screen each time Windows 98 starts");
    const ci = $("input", chk);
    ci.checked = Store.get("showWelcome", true);
    ci.addEventListener("change", () => Store.set("showWelcome", ci.checked));
    const closeB = el("button", { class: "btn", text: "Close" });
    closeB.addEventListener("click", () => win.close());
    bottom.append(chk, closeB);
    win.body.append(head, mid, bottom);
  }

  /* boot it */
  function start() {
    W98.Tooltip.init();
    W98.Desktop.init();
    Taskbar.init();
    W98.Screensaver && W98.Screensaver.init();
    W98.DisplayMode && W98.DisplayMode.apply();
    /* these programs need the internet; opening them offline triggers the dial-up prompt */
    ["pal", "chatterbox", "netgrab", "surreal", "netmeet", "mediaplayer"].forEach((id) => {
      const app = W98.Apps[id];
      if (!app || app._netWrapped) return;
      app._netWrapped = true;
      const orig = app.launch.bind(app);
      app.launch = (a) => {
        if (!W98.Net || W98.Net.connected) return orig(a);
        W98.Net.require(() => W98.launch(id, a));
        return null;
      };
    });
    Boot.run().then(() => {
      if (location.search.includes("demo=1")) {
        setTimeout(() => {
          const place = (w, x2, y2) => { if (w && w.el) { w.el.style.left = x2 + "px"; w.el.style.top = y2 + "px"; } };
          place(W98.launch("minesweeper"), 48, 84);
          place(W98.launch("ie"), 430, 44);
          place(W98.launch("claude98"), 200, 330);
        }, 700);
        return;
      }
      setTimeout(showWelcome, 350);
      setTimeout(() => { W98.Stickies && W98.Stickies.restore(); W98.ChannelBar && W98.ChannelBar.init(); }, 500);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

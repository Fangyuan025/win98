/* wm.js — window manager */
"use strict";
const WM = W98.WM = (() => {
  const wins = [];
  let zTop = 100;
  let cascade = 0;

  /* titlebar button glyphs */
  const GLYPH = {
    min: pixmap(`
.........
.........
.........
.........
.........
.........
.kkkkkk..
.kkkkkk..`, Icons.P, 1),
    max: pixmap(`
kkkkkkkkk
kkkkkkkkk
k.......k
k.......k
k.......k
k.......k
k.......k
k.......k
kkkkkkkkk`, Icons.P, 1),
    restore: pixmap(`
..kkkkkk.
..kkkkkk.
..k....k.
kkkkkk.k.
kkkkkk.k.
k....kkk.
k....k...
k....k...
kkkkkk...`, Icons.P, 1),
    close: pixmap(`
kk....kk
.kk..kk.
..kkkk..
...kk...
..kkkk..
.kk..kk.
kk....kk`, Icons.P, 1),
    help: pixmap(`
..kkk...
.kk.kk..
.kk.kk..
...kk...
...kk...
...kk...
........
...kk...
...kk...`, Icons.P, 1)
  };

  function desktopRect() {
    const tb = $("#taskbar");
    const tbh = tb && !tb.classList.contains("hidden-bar") && !tb.classList.contains("autohide") ? 28 : (tb && tb.classList.contains("autohide") ? 0 : 28);
    return { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight - (tb ? (tb.classList.contains("autohide") ? 2 : 28) : 28) };
  }

  function topWin() {
    let best = null;
    for (const w of wins) if (!w.minimized && (!best || w.z > best.z)) best = w;
    return best;
  }

  /* Win98 "zoom rectangle" animation (minimize/restore/maximize) */
  function animZoom(from, to, done) {
    if (!from || !to) { if (done) done(); return; }
    const box = el("div", { style: "position:fixed;z-index:9990;border:2px solid var(--shadow);pointer-events:none" });
    document.body.append(box);
    const steps = 9;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      const t = i / steps;
      box.style.left = (from.left + (to.left - from.left) * t) + "px";
      box.style.top = (from.top + (to.top - from.top) * t) + "px";
      box.style.width = Math.max(4, from.width + (to.width - from.width) * t) + "px";
      box.style.height = Math.max(4, from.height + (to.height - from.height) * t) + "px";
      if (i >= steps) { clearInterval(iv); box.remove(); if (done) done(); }
    }, 14);
  }
  function taskbarTarget(win) {
    if (W98.Taskbar && W98.Taskbar.buttonRect) {
      const r = W98.Taskbar.buttonRect(win.id);
      if (r) return r;
    }
    return { left: 20, top: window.innerHeight - 26, width: 160, height: 22 };
  }

  function create(opts) {
    opts = opts || {};
    const win = {
      id: uid(),
      title: opts.title || "Untitled",
      icon: opts.icon || "file",
      minimized: false, maximized: false,
      z: ++zTop,
      opts,
      restoreBounds: null,
      closed: false
    };

    const elWin = win.el = el("div", { class: "win" });
    elWin.style.width = (opts.width || 400) + "px";
    elWin.style.height = (opts.height || 300) + "px";
    const dr = desktopRect();
    let x = opts.x, y = opts.y;
    if (x == null) {
      x = 40 + (cascade % 8) * 24;
      y = 30 + (cascade % 8) * 22;
      cascade++;
    }
    if (opts.center) {
      x = Math.max(0, (dr.w - (opts.width || 400)) / 2);
      y = Math.max(0, (dr.h - (opts.height || 300)) / 2.4);
    }
    elWin.style.left = Math.round(x) + "px";
    elWin.style.top = Math.round(y) + "px";
    elWin.style.zIndex = win.z;

    /* titlebar */
    const tIcon = Icons.img(win.icon, 16);
    const tText = el("span", { class: "t-text", text: win.title });
    const tb = el("div", { class: "titlebar" }, tIcon, tText);
    const mkBtn = (glyph, title, fn) => {
      const b = el("button", { class: "t-btn", dataset: { tip: title } });
      b.style.backgroundImage = `url(${glyph})`;
      b.addEventListener("mousedown", e => e.stopPropagation());
      b.addEventListener("click", fn);
      return b;
    };
    let btnMin, btnMax;
    if (opts.minimizable !== false) tb.append(btnMin = mkBtn(GLYPH.min, "Minimize", () => win.minimize()));
    if (opts.maximizable !== false) tb.append(btnMax = mkBtn(GLYPH.max, "Maximize", () => win.toggleMax()));
    if (opts.helpBtn) tb.append(mkBtn(GLYPH.help, "Help", opts.helpBtn));
    const btnClose = mkBtn(GLYPH.close, "Close", () => win.close());
    btnClose.classList.add("t-close");
    if (opts.closable === false) { btnClose.disabled = true; btnClose.style.opacity = ".5"; }
    tb.append(btnClose);
    elWin.append(tb);

    /* menubar */
    if (opts.menus) {
      const bar = el("div", { class: "menubar" });
      elWin.append(bar);
      win.menubar = bar;
      Menu.attachBar(bar, opts.menus);
    }

    /* body */
    const body = win.body = el("div", { class: "win-body" + (opts.bodyClass ? " " + opts.bodyClass : "") });
    elWin.append(body);

    /* statusbar */
    if (opts.statusbar) {
      const sb = el("div", { class: "statusbar" });
      const cells = Array.isArray(opts.statusbar) ? opts.statusbar : [""];
      win.sbCells = cells.map((c, i) => {
        const cell = el("div", { class: "sb-cell" + (typeof c === "object" && c.fix ? " fix" : ""), text: typeof c === "object" ? c.text : c });
        if (typeof c === "object" && c.width) { cell.style.flex = "none"; cell.style.width = c.width + "px"; }
        sb.append(cell);
        return cell;
      });
      elWin.append(sb);
      win.statusbar = sb;
    }

    win.setStatus = (i, text) => { if (win.sbCells && win.sbCells[i]) win.sbCells[i].textContent = W98.tr ? W98.tr(text) : text; };
    win.setTitle = (t) => { win.title = t; tText.textContent = W98.tr ? W98.tr(t) : t; W98.bus.emit("win-title", win); };
    win.setIcon = (name) => { win.icon = name; tIcon.src = Icons.get(name, 16); W98.bus.emit("win-title", win); };

    /* focus */
    function focus() {
      if (win.closed) return;
      if (win.minimized) {
        win.minimized = false;
        const from = taskbarTarget(win);
        elWin.style.display = "";
        const rect = elWin.getBoundingClientRect();
        elWin.style.visibility = "hidden";
        animZoom(from, rect, () => { elWin.style.visibility = ""; });
      }
      win.z = ++zTop;
      elWin.style.zIndex = win.z;
      wins.forEach(w => w.el.classList.toggle("focused", w === win));
      W98.bus.emit("win-focus", win);
      if (opts.onFocus) opts.onFocus();
    }
    win.focus = focus;
    elWin.addEventListener("mousedown", () => { if (topWin() !== win || !elWin.classList.contains("focused")) focus(); });

    /* dragging via titlebar */
    tb.addEventListener("mousedown", (e) => {
      if (e.target.closest(".t-btn") || win.maximized) return;
      if (e.button !== 0) return;
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY;
      const ox = elWin.offsetLeft, oy = elWin.offsetTop;
      let moved = false;
      const mm = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!moved && Math.abs(dx) + Math.abs(dy) < 3) return;
        moved = true;
        win._userMoved = true;
        elWin.style.left = clamp(ox + dx, -elWin.offsetWidth + 60, window.innerWidth - 40) + "px";
        elWin.style.top = clamp(oy + dy, 0, window.innerHeight - 40) + "px";
      };
      const mu = () => { window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); };
      window.addEventListener("mousemove", mm);
      window.addEventListener("mouseup", mu);
    });
    /* dbl-click titlebar = maximize */
    tb.addEventListener("dblclick", (e) => {
      if (e.target.closest(".t-btn") || e.target === tIcon) return;
      if (opts.maximizable !== false) win.toggleMax();
    });
    /* titlebar icon: system menu; double-click closes */
    let iconClickTimer = null;
    tIcon.addEventListener("mousedown", e => e.stopPropagation());
    tIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      focus();
      if (iconClickTimer) { clearTimeout(iconClickTimer); iconClickTimer = null; win.close(); return; }
      iconClickTimer = setTimeout(() => {
        iconClickTimer = null;
        const r = tIcon.getBoundingClientRect();
        Menu.popup(r.left, r.bottom, sysMenuItems());
      }, 250);
    });
    tb.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      Menu.popup(e.clientX, e.clientY, sysMenuItems());
    });
    function sysMenuItems() {
      return [
        { label: "Restore", disabled: !win.maximized && !win.minimized, click: () => win.restore() },
        { label: "Move", disabled: win.maximized, click: () => keyboardMove() },
        { label: "Size", disabled: win.maximized || opts.resizable === false, click: () => keyboardSize() },
        { label: "Minimize", disabled: opts.minimizable === false, click: () => win.minimize() },
        { label: "Maximize", disabled: opts.maximizable === false || win.maximized, click: () => win.toggleMax() },
        "-",
        { label: "Close", bold: true, accel: "Alt+F4", disabled: opts.closable === false, click: () => win.close() }
      ];
    }
    function pointerFollow(applyFn) {
      const shield = el("div", { class: "dlg-shield", style: "z-index:9500;cursor:move;position:fixed;inset:0" });
      document.body.append(shield);
      const mm = (ev) => applyFn(ev);
      const done = () => { shield.remove(); window.removeEventListener("mousemove", mm); };
      shield.addEventListener("mousedown", done);
      window.addEventListener("mousemove", mm);
      document.addEventListener("keydown", function esc(e) {
        if (e.key === "Escape") { done(); document.removeEventListener("keydown", esc); }
      });
    }
    function keyboardMove() {
      pointerFollow((ev) => {
        elWin.style.left = clamp(ev.clientX - elWin.offsetWidth / 2, -elWin.offsetWidth + 60, window.innerWidth - 40) + "px";
        elWin.style.top = clamp(ev.clientY - 8, 0, window.innerHeight - 40) + "px";
      });
    }
    function keyboardSize() {
      pointerFollow((ev) => {
        const r = elWin.getBoundingClientRect();
        elWin.style.width = Math.max(opts.minWidth || 150, ev.clientX - r.left + 4) + "px";
        elWin.style.height = Math.max(opts.minHeight || 80, ev.clientY - r.top + 4) + "px";
        if (opts.onResize) opts.onResize();
      });
    }

    /* min/max/close */
    win.minimize = () => {
      if (opts.minimizable === false || win.minimized) return;
      const from = elWin.getBoundingClientRect();
      win.minimized = true;
      elWin.style.display = "none";
      elWin.classList.remove("focused");
      W98.bus.emit("win-min", win);
      Sound.play("minimize");
      animZoom(from, taskbarTarget(win));
      const t = topWin(); if (t) t.focus();
    };
    win.toggleMax = () => {
      if (win.maximized) return win.restore();
      const before = elWin.getBoundingClientRect();
      win.restoreBounds = { l: elWin.offsetLeft, t: elWin.offsetTop, w: elWin.offsetWidth, h: elWin.offsetHeight };
      win.maximized = true;
      elWin.classList.add("maximized");
      const d = desktopRect();
      elWin.style.left = "-2px"; elWin.style.top = "-2px";
      elWin.style.width = (d.w + 4) + "px";
      elWin.style.height = (d.h + 4) + "px";
      if (btnMax) btnMax.style.backgroundImage = `url(${GLYPH.restore})`;
      animZoom(before, elWin.getBoundingClientRect());
      Sound.play("maximize");
      if (opts.onResize) opts.onResize();
      focus();
    };
    win.restore = () => {
      if (win.minimized) { focus(); return; }
      if (!win.maximized) return;
      const before = elWin.getBoundingClientRect();
      win.maximized = false;
      elWin.classList.remove("maximized");
      const b = win.restoreBounds;
      if (b) { elWin.style.left = b.l + "px"; elWin.style.top = b.t + "px"; elWin.style.width = b.w + "px"; elWin.style.height = b.h + "px"; }
      if (btnMax) btnMax.style.backgroundImage = `url(${GLYPH.max})`;
      animZoom(before, elWin.getBoundingClientRect());
      if (opts.onResize) opts.onResize();
    };
    win.close = (force) => {
      if (win.closed) return;
      if (!force && opts.onBeforeClose) {
        const r = opts.onBeforeClose();
        if (r === false) return;
        if (r && r.then) { r.then(ok => { if (ok !== false) reallyClose(); }); return; }
      }
      reallyClose();
    };
    function reallyClose() {
      win.closed = true;
      const i = wins.indexOf(win);
      if (i >= 0) wins.splice(i, 1);
      elWin.remove();
      W98.bus.emit("win-close", win);
      if (opts.onClose) opts.onClose();
      const t = topWin(); if (t) t.focus();
    }

    /* resize handles */
    if (opts.resizable !== false) {
      const dirs = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
      for (const d of dirs) {
        const h = el("div", { class: "rs rs-" + d });
        h.addEventListener("mousedown", (e) => {
          if (win.maximized || e.button !== 0) return;
          e.preventDefault(); e.stopPropagation();
          focus();
          const sx = e.clientX, sy = e.clientY;
          const r = { l: elWin.offsetLeft, t: elWin.offsetTop, w: elWin.offsetWidth, h: elWin.offsetHeight };
          const minW = opts.minWidth || 150, minH = opts.minHeight || 80;
          const mm = (ev) => {
            let dx = ev.clientX - sx, dy = ev.clientY - sy;
            let L = r.l, T = r.t, Wd = r.w, H = r.h;
            if (d.includes("e")) Wd = Math.max(minW, r.w + dx);
            if (d.includes("s")) H = Math.max(minH, r.h + dy);
            if (d.includes("w")) { Wd = Math.max(minW, r.w - dx); L = r.l + (r.w - Wd); }
            if (d.includes("n")) { H = Math.max(minH, r.h - dy); T = r.t + (r.h - H); }
            elWin.style.left = L + "px"; elWin.style.top = T + "px";
            elWin.style.width = Wd + "px"; elWin.style.height = H + "px";
            if (opts.onResize) opts.onResize();
          };
          const mu = () => { window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); };
          window.addEventListener("mousemove", mm);
          window.addEventListener("mouseup", mu);
        });
        elWin.append(h);
      }
    }

    $("#windows").append(elWin);
    wins.push(win);
    if (opts.center) {
      // re-center with real element size; retry while the viewport is still settling at startup
      let centered = false;
      const tryCenter = () => {
        if (win.closed || win.maximized || win._userMoved || centered) return;
        const d2 = desktopRect();
        if (d2.w > 100 && d2.h > 100) {
          elWin.style.left = Math.max(0, Math.round((d2.w - elWin.offsetWidth) / 2)) + "px";
          elWin.style.top = Math.max(0, Math.round((d2.h - elWin.offsetHeight) / 2.4)) + "px";
          centered = true;
        }
      };
      [0, 200, 600, 1200].forEach(ms => setTimeout(tryCenter, ms));
    }
    if (!opts.noTaskbar) W98.bus.emit("win-open", win);
    focus();
    return win;
  }

  /* ---------- message box ---------- */
  function msgbox(o) {
    return new Promise((resolve) => {
      const shield = el("div", { class: "dlg-shield", style: "position:fixed;inset:0;z-index:8000" });
      document.body.append(shield);
      const iconName = o.icon ? "msg_" + o.icon : null;
      if (o.icon === "error") Sound.play("error");
      else if (o.icon === "warning") Sound.play("warn");
      else if (o.icon === "question") Sound.play("question");
      else if (o.icon === "info") Sound.play("info");

      const buttons = o.buttons || ["OK"];
      const win = create({
        title: o.title || "Windows",
        icon: o.winIcon || "help",
        width: o.width || 0, height: 0,
        resizable: false, minimizable: false, maximizable: false,
        noTaskbar: true, center: true
      });
      win.el.style.width = "auto"; win.el.style.height = "auto";
      win.el.style.minWidth = (o.width || 280) + "px";
      win.el.style.zIndex = 8001;
      $(".titlebar img", win.el).style.display = "none";
      const bodyRow = el("div", { class: "msgbox-body" });
      if (iconName) {
        const im = new Image(); im.src = Icons.get(iconName, 32) || "";
        im.src = W98.Icons.get ? (Icons.get(iconName, 32)) : im.src;
        bodyRow.append(im);
      }
      bodyRow.append(el("div", { class: "msgbox-text", text: W98.tr ? W98.tr(o.text || "") : (o.text || "") }));
      const btnRow = el("div", { class: "msgbox-btns" });
      const finish = (label) => { shield.remove(); win.close(true); resolve(label); };
      const btnEls = buttons.map((b, i) => {
        const btn = el("button", { class: "btn" + (i === (o.defaultBtn || 0) ? " default" : ""), text: W98.tr ? W98.tr(b) : b });
        btn.addEventListener("click", () => finish(b));
        btnRow.append(btn);
        return btn;
      });
      win.body.append(bodyRow, btnRow);
      win.opts.onBeforeClose = () => { shield.remove(); resolve(o.cancelValue !== undefined ? o.cancelValue : (buttons.includes("Cancel") ? "Cancel" : buttons[buttons.length - 1])); return true; };
      const keyH = (e) => {
        if (win.closed) { document.removeEventListener("keydown", keyH, true); return; }
        if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); finish(buttons[o.defaultBtn || 0]); document.removeEventListener("keydown", keyH, true); }
        else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); win.close(); document.removeEventListener("keydown", keyH, true); }
      };
      document.addEventListener("keydown", keyH, true);
      setTimeout(() => btnEls[o.defaultBtn || 0] && btnEls[o.defaultBtn || 0].focus(), 30);
      // recenter now that size is known
      const dr2 = desktopRect();
      win.el.style.left = Math.max(0, (dr2.w - win.el.offsetWidth) / 2) + "px";
      win.el.style.top = Math.max(0, (dr2.h - win.el.offsetHeight) / 2.4) + "px";
    });
  }

  /* ---------- window arrangement ---------- */
  function visibleWins() { return wins.filter(w => !w.minimized && !w.opts.noTaskbar); }
  function cascadeAll() {
    let i = 0;
    for (const w of visibleWins()) {
      if (w.maximized) w.restore();
      w.el.style.left = (10 + i * 24) + "px";
      w.el.style.top = (10 + i * 22) + "px";
      w.focus(); i++;
    }
  }
  function tile(vertical) {
    const vs = visibleWins();
    if (!vs.length) return;
    const d = desktopRect();
    const n = vs.length;
    vs.forEach((w, i) => {
      if (w.maximized) w.restore();
      if (vertical) {
        w.el.style.left = Math.round(d.w / n * i) + "px";
        w.el.style.top = "0px";
        w.el.style.width = Math.round(d.w / n) + "px";
        w.el.style.height = d.h + "px";
      } else {
        w.el.style.left = "0px";
        w.el.style.top = Math.round(d.h / n * i) + "px";
        w.el.style.width = d.w + "px";
        w.el.style.height = Math.round(d.h / n) + "px";
      }
      if (w.opts.onResize) w.opts.onResize();
    });
  }
  function minimizeAll() { visibleWins().forEach(w => w.minimize()); }

  function findByAppId(appId) {
    return wins.find(w => w.opts.appId === appId && !w.closed);
  }

  /* ---------- Alt+Tab switcher ---------- */
  let switcher = null;
  function killSwitcher() {
    if (switcher) { switcher.el.remove(); switcher = null; }
  }
  function renderSwitcher() {
    const s = switcher;
    if (!s.el) {
      s.el = el("div", { class: "alttab raised" });
      $("#overlays").append(s.el);
    }
    s.el.innerHTML = "";
    const row = el("div", { class: "at-row" });
    s.list.forEach((w, i) => {
      const c = el("div", { class: "at-cell" + (i === s.idx ? " on" : "") });
      c.append(Icons.img(w.icon, 32));
      c.addEventListener("mousedown", (e) => {
        e.preventDefault();
        killSwitcher();
        if (!w.closed) w.focus();
      });
      row.append(c);
    });
    s.el.append(row, el("div", { class: "at-label sunken-thin", text: s.list[s.idx].title }));
    s.el.style.left = Math.round((window.innerWidth - s.el.offsetWidth) / 2) + "px";
    s.el.style.top = Math.round((window.innerHeight - s.el.offsetHeight) / 2.4) + "px";
  }
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key === "Tab") {
      e.preventDefault(); e.stopPropagation();
      const list = wins.filter(w => !w.opts.noTaskbar && !w.closed);
      if (!list.length) return;
      if (!switcher) {
        switcher = { list: list.slice().sort((a, b) => b.z - a.z), idx: list.length > 1 ? 1 : 0, el: null };
      } else {
        switcher.idx = (switcher.idx + (e.shiftKey ? -1 : 1) + switcher.list.length) % switcher.list.length;
      }
      renderSwitcher();
    } else if (switcher && e.key === "Escape") {
      e.stopPropagation();
      killSwitcher();
    }
  }, true);
  document.addEventListener("keyup", (e) => {
    if (switcher && (e.key === "Alt" || !e.altKey)) {
      const w = switcher.list[switcher.idx];
      killSwitcher();
      if (w && !w.closed) w.focus();
    }
  }, true);
  window.addEventListener("blur", killSwitcher);

  return { create, msgbox, wins, cascadeAll, tile, minimizeAll, desktopRect, topWin, findByAppId, GLYPH };
})();

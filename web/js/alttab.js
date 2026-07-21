/* alttab.js — the classic Alt+Tab switcher, plus Ctrl+Esc for the Start menu.
   Hold Alt (Option on this keyboard), tap Tab to cycle, release to switch. */
"use strict";
W98.AltTab = (() => {
  let overlay = null, order = [], idx = 0, active = false;

  function buildOrder() {
    order = WM.wins.filter(w => !w.closed && !w.opts.noTaskbar);
    order.sort((a, b) => (parseInt(b.el.style.zIndex, 10) || 0) - (parseInt(a.el.style.zIndex, 10) || 0));
  }
  function paint() {
    overlay.innerHTML = "";
    const row = el("div", { class: "at-row" });
    order.forEach((w, i) => {
      const cell = el("div", { class: "at-cell" + (i === idx ? " sel" : "") });
      cell.append(Icons.img(w.opts.icon || "file", 32));
      row.append(cell);
    });
    overlay.append(row, el("div", { class: "at-title", text: order[idx] ? order[idx].title : "" }));
  }
  function show() {
    buildOrder();
    if (order.length < 2) return false;
    idx = 1;
    overlay = el("div", { class: "alttab-box" });
    paint();
    $("#overlays").append(overlay);
    return true;
  }
  function dismiss() {
    if (overlay) { overlay.remove(); overlay = null; }
    active = false;
  }
  function commit() {
    const w = order[idx];
    dismiss();
    if (w && !w.closed) {
      if (w.minimized) w.restore ? w.restore() : null;
      w.focus();
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      if (!active) active = show();
      else if (overlay) { idx = (idx + (e.shiftKey ? -1 : 1) + order.length) % order.length; paint(); }
      return;
    }
    if (active && e.key === "Escape") { e.preventDefault(); dismiss(); return; }
    if (e.ctrlKey && e.key === "Escape") {
      e.preventDefault();
      W98.Taskbar && W98.Taskbar.toggleStart();
    }
  }, true);
  document.addEventListener("keyup", (e) => {
    if (active && (e.key === "Alt" || !e.altKey)) commit();
  }, true);
  /* safety: if the window loses focus mid-switch, don't strand the box */
  window.addEventListener("blur", () => { if (active) commit(); });

  return { get active() { return active; } };
})();

/* menu.js — popup menus, cascading submenus, menu bars */
"use strict";
const Menu = W98.Menu = (() => {
  let openStack = [];   // array of {el, level}
  let barState = null;  // active menubar {bar, spans, openIdx}

  function overlays() { return $("#overlays"); }

  function closeFrom(level) {
    while (openStack.length && openStack[openStack.length - 1].level >= level) {
      openStack.pop().el.remove();
    }
  }
  function closeAll() {
    closeFrom(0);
    if (barState) {
      barState.spans.forEach(s => s.classList.remove("open", "hot"));
      barState = null;
    }
  }

  document.addEventListener("mousedown", (e) => {
    if (e.target.closest(".menu-pop")) return;
    if (barState && e.target.closest(".menubar")) return;
    if (e.target.closest("#start-btn")) return;
    closeAll();
    W98.bus.emit("menus-closed");
  }, true);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openStack.length) { closeAll(); e.stopPropagation(); }
  }, true);

  /* "&File" renders File with F underlined; plain labels pass through */
  function renderLabel(span, text) {
    const i = String(text).indexOf("&");
    if (i >= 0 && i < text.length - 1) {
      span.append(text.slice(0, i), el("u", { text: text[i + 1] }), text.slice(i + 2));
    } else span.textContent = text;
  }

  function buildMenu(items, level, opts) {
    opts = opts || {};
    const m = el("div", { class: "menu-pop" });
    m.dataset.level = level;
    let hoverTimer = null;
    for (const it of items) {
      if (it === "-" || it.sep) { m.append(el("div", { class: "menu-sep" })); continue; }
      if (it.hidden) continue;
      const row = el("div", { class: "menu-item" + (it.disabled ? " disabled" : "") });
      if (it.icon) row.append(Icons.img(it.icon, opts.big ? 32 : 16));
      else {
        const pad = el("span", { class: "mi-noicon" });
        if (it.checked) pad.append(el("span", { class: "chk", text: it.radio ? "•" : "✓", style: "position:static" }));
        row.append(pad);
      }
      const lbl = el("span");
      renderLabel(lbl, it.label);
      if (it.bold) lbl.style.fontWeight = "700";
      row.append(lbl);
      row._mi = it;
      if (it.accel) row.append(el("span", { class: "accel", text: it.accel }));
      if (it.sub) row.append(el("span", { class: "sub-arrow" }));
      row.addEventListener("mouseenter", () => {
        $$(".menu-item", m).forEach(r => r.classList.remove("hot"));
        row.classList.add("hot");
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          closeFrom(level + 1);
          if (it.sub && !it.disabled) {
            const r = row.getBoundingClientRect();
            const items2 = typeof it.sub === "function" ? it.sub() : it.sub;
            showAt(r.right - 3, r.top - 3, items2, level + 1, { fromLeft: r.left });
          }
        }, it.sub ? 250 : 250);
      });
      row.addEventListener("mouseleave", () => row.classList.remove("hot"));
      row.addEventListener("mouseup", (e) => {
        if (e.button !== 0 && !opts.anyButton) return;
        if (it.disabled) return;
        if (it.sub) {
          clearTimeout(hoverTimer);
          closeFrom(level + 1);
          const r = row.getBoundingClientRect();
          const items2 = typeof it.sub === "function" ? it.sub() : it.sub;
          showAt(r.right - 3, r.top - 3, items2, level + 1, { fromLeft: r.left });
          return;
        }
        closeAll();
        W98.bus.emit("menus-closed");
        if (it.click) setTimeout(() => it.click(), 0);
      });
      m.append(row);
    }
    return m;
  }

  function showAt(x, y, items, level, opts) {
    opts = opts || {};
    const m = buildMenu(items, level, opts);
    m.style.visibility = "hidden";
    overlays().append(m);
    const mw = m.offsetWidth, mh = m.offsetHeight;
    const sw = window.innerWidth, sh = window.innerHeight;
    if (x + mw > sw) {
      x = (opts.fromLeft != null) ? Math.max(0, opts.fromLeft - mw + 3) : Math.max(0, sw - mw - 2);
    }
    if (opts.up || y + mh > sh) y = Math.max(0, (opts.up ? y : y) - mh);
    if (y + mh > sh) y = Math.max(0, sh - mh - 2);
    if (y < 0) y = 0;
    m.style.left = x + "px";
    m.style.top = y + "px";
    m.style.visibility = "";
    /* Win98 menu unfold animation */
    if (!opts.noAnim) {
      const h = m.offsetHeight;
      m.style.overflow = "hidden";
      m.style.maxHeight = "0px";
      void m.offsetWidth;
      m.style.transition = "max-height 110ms ease-out";
      m.style.maxHeight = h + "px";
      setTimeout(() => { m.style.transition = ""; m.style.maxHeight = ""; m.style.overflow = ""; }, 140);
    }
    openStack.push({ el: m, level });
    Sound.play("menu");
    return m;
  }

  /* keyboard navigation inside open menus */
  document.addEventListener("keydown", (e) => {
    if (!openStack.length) return;
    const top = openStack[openStack.length - 1];
    const rows = $$(".menu-item:not(.disabled)", top.el).filter(r => r._mi);
    if (!rows.length) return;
    let idx = rows.findIndex(r => r.classList.contains("hot"));
    const setHot = (i) => {
      $$(".menu-item", top.el).forEach(r => r.classList.remove("hot"));
      rows[i].classList.add("hot");
    };
    if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); setHot((idx + 1) % rows.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); setHot((idx - 1 + rows.length) % rows.length); }
    else if (e.key === "ArrowRight") {
      const row = rows[idx];
      if (row && row._mi.sub) {
        e.preventDefault(); e.stopPropagation();
        closeFrom(top.level + 1);
        const r = row.getBoundingClientRect();
        const items2 = typeof row._mi.sub === "function" ? row._mi.sub() : row._mi.sub;
        const sub = showAt(r.right - 3, r.top - 3, items2, top.level + 1, { fromLeft: r.left });
        const first = $(".menu-item:not(.disabled)", sub);
        if (first) first.classList.add("hot");
      }
    }
    else if (e.key === "ArrowLeft") {
      if (top.level > 0) { e.preventDefault(); e.stopPropagation(); closeFrom(top.level); }
    }
    else if (e.key === "Enter") {
      const row = rows[idx];
      if (!row) return;
      e.preventDefault(); e.stopPropagation();
      const it = row._mi;
      if (it.sub) {
        closeFrom(top.level + 1);
        const r = row.getBoundingClientRect();
        const items2 = typeof it.sub === "function" ? it.sub() : it.sub;
        const sub = showAt(r.right - 3, r.top - 3, items2, top.level + 1, { fromLeft: r.left });
        const first = $(".menu-item:not(.disabled)", sub);
        if (first) first.classList.add("hot");
      } else {
        closeAll();
        W98.bus.emit("menus-closed");
        if (it.click) setTimeout(() => it.click(), 0);
      }
    }
  }, true);

  function popup(x, y, items, opts) {
    closeAll();
    return showAt(x, y, items, 0, opts);
  }

  /* menubar for windows: spec = [{label, items|()=>items}] */
  function attachBar(barEl, spec) {
    const spans = spec.map((entry, i) => {
      const s = el("span");
      // menubar labels get the classic first-letter accelerator underline
      if (entry.label.includes("&")) renderLabel(s, entry.label);
      else s.append(el("u", { text: entry.label[0] }), entry.label.slice(1));
      barEl.append(s);
      const open = () => {
        closeFrom(0);
        spans.forEach(sp => sp.classList.remove("open"));
        s.classList.add("open");
        const r = s.getBoundingClientRect();
        const items = typeof entry.items === "function" ? entry.items() : entry.items;
        showAt(r.left, r.bottom, items, 0);
        barState = { bar: barEl, spans, openIdx: i };
      };
      s.addEventListener("mousedown", (e) => {
        e.preventDefault();
        if (barState && barState.openIdx === i && barState.bar === barEl) { closeAll(); return; }
        open();
      });
      s.addEventListener("mouseenter", () => {
        if (barState && barState.bar === barEl && barState.openIdx !== i) open();
        else s.classList.add("hot");
      });
      s.addEventListener("mouseleave", () => s.classList.remove("hot"));
      return s;
    });
    W98.bus.on("menus-closed", () => spans.forEach(sp => sp.classList.remove("open")));
    return spans;
  }

  function adopt(elm, level) { openStack.push({ el: elm, level: level || 0 }); }

  return { popup, closeAll, closeFrom, adopt, attachBar, showAt, get openCount() { return openStack.length; } };
})();

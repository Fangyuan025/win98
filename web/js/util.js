/* util.js — helpers */
"use strict";
const W98 = window.W98 = {};

function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === "class") e.className = attrs[k];
    else if (k === "style") e.style.cssText = attrs[k];
    else if (k === "text") e.textContent = attrs[k];
    else if (k === "html") e.innerHTML = attrs[k];
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
    else if (k === "dataset") Object.assign(e.dataset, attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  for (const kid of kids) {
    if (kid == null) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return e;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function debounce(fn, ms) {
  let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
}
function pad2(n) { return String(n).padStart(2, "0"); }
function fmtTime(d) {
  let h = d.getHours(); const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${pad2(d.getMinutes())} ${ap}`;
}
function fmtDate(d) {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const mon = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${days[d.getDay()]}, ${mon[d.getMonth()]} ${pad2(d.getDate())}, ${d.getFullYear()}`;
}
function fmtShortDate(ts) {
  const d = new Date(ts);
  return `${d.getMonth()+1}/${d.getDate()}/${String(d.getFullYear()).slice(2)} ${fmtTime(d)}`;
}
function fmtSize(n) {
  if (n == null) return "";
  if (n < 1024) return n + " bytes";
  return Math.ceil(n / 1024).toLocaleString() + "KB";
}
function uid() { return Math.random().toString(36).slice(2, 10); }

/* Build a pixel-art image from an ASCII map + palette. Returns data URL. */
function pixmap(map, palette, scale) {
  const rows = map.trim().split("\n").map(r => r.replace(/\|/g, ""));
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch === "." || ch === " ") continue;
      ctx.fillStyle = palette[ch] || "#000";
      ctx.fillRect(x, y, 1, 1);
    }
  }
  if (scale && scale !== 1) {
    const c2 = document.createElement("canvas");
    c2.width = w * scale; c2.height = h * scale;
    const x2 = c2.getContext("2d");
    x2.imageSmoothingEnabled = false;
    x2.drawImage(c, 0, 0, c2.width, c2.height);
    return c2.toDataURL();
  }
  return c.toDataURL();
}

/* simple event emitter */
function emitter() {
  const map = {};
  return {
    on(ev, fn) { (map[ev] = map[ev] || []).push(fn); },
    emit(ev, ...a) { (map[ev] || []).forEach(fn => fn(...a)); }
  };
}

W98.bus = emitter();

/* Win98 yellow tooltips — any element with data-tip */
W98.Tooltip = (() => {
  let tipEl = null, timer = null, current = null;
  function show(target) {
    const text = target.dataset.tip;
    if (!text) return;
    tipEl = el("div", { class: "tooltip", text });
    document.body.append(tipEl);
    const r = target.getBoundingClientRect();
    let x = r.left + 2, y = r.bottom + 4;
    if (y + tipEl.offsetHeight > window.innerHeight) y = r.top - tipEl.offsetHeight - 4;
    if (x + tipEl.offsetWidth > window.innerWidth) x = window.innerWidth - tipEl.offsetWidth - 4;
    tipEl.style.left = Math.max(0, x) + "px";
    tipEl.style.top = Math.max(0, y) + "px";
  }
  function hide() {
    clearTimeout(timer);
    if (tipEl) { tipEl.remove(); tipEl = null; }
    current = null;
  }
  function init() {
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest ? e.target.closest("[data-tip]") : null;
      if (t === current) return;
      hide();
      if (!t) return;
      current = t;
      timer = setTimeout(() => { if (current === t) show(t); }, 450);
    });
    document.addEventListener("mousedown", hide, true);
    document.addEventListener("wheel", hide, { passive: true });
  }
  return { init, hide };
})();

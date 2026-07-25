/* store.js — persistence (native bridge or localStorage) */
"use strict";
const Store = W98.Store = {
  data: null,
  load() {
    let raw = null;
    /* a soft reboot stashes live state here — it outranks the boot-time
       injection, which is a snapshot from when the native app launched */
    try {
      raw = sessionStorage.getItem("win98-reload-state");
      if (raw) sessionStorage.removeItem("win98-reload-state");
    } catch (e) { raw = null; }
    if (!raw && window.__WIN98_STATE__) raw = window.__WIN98_STATE__;
    if (!raw) { try { raw = localStorage.getItem("win98-state"); } catch (e) {} }
    try { this.data = typeof raw === "string" ? JSON.parse(raw) : (raw || null); } catch (e) { this.data = null; }
    if (!this.data || typeof this.data !== "object") this.data = {};
    return this.data;
  },
  get(key, def) { return (key in this.data) ? this.data[key] : def; },
  set(key, val) { this.data[key] = val; this.save(); },
  save: debounce(function () {
    const json = JSON.stringify(Store.data);
    try { localStorage.setItem("win98-state", json); } catch (e) {}
    try {
      if (window.webkit && webkit.messageHandlers && webkit.messageHandlers.persist)
        webkit.messageHandlers.persist.postMessage(json);
    } catch (e) {}
  }, 300),
  saveNow() {
    const json = JSON.stringify(Store.data);
    try { localStorage.setItem("win98-state", json); } catch (e) {}
    try {
      if (window.webkit && webkit.messageHandlers && webkit.messageHandlers.persist)
        webkit.messageHandlers.persist.postMessage(json);
    } catch (e) {}
  },
  /* reload that keeps its memory: persist, stash for the next load, go */
  reboot() {
    this.saveNow();
    try { sessionStorage.setItem("win98-reload-state", JSON.stringify(this.data)); } catch (e) {}
    location.reload();
  },
  native(msg) {
    try {
      if (window.webkit && webkit.messageHandlers && webkit.messageHandlers.system) {
        webkit.messageHandlers.system.postMessage(msg); return true;
      }
    } catch (e) {}
    return false;
  }
};
Store.load();

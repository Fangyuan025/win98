/* store.js — persistence (native bridge or localStorage) */
"use strict";
const Store = W98.Store = {
  data: null,
  load() {
    let raw = null;
    if (window.__WIN98_STATE__) raw = window.__WIN98_STATE__;
    else { try { raw = localStorage.getItem("win98-state"); } catch (e) {} }
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

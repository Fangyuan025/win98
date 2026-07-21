/* combo.js — replaces every native <select> with a Win98 combobox.
   The original select stays (hidden) as the source of truth, so existing
   code that reads .value / listens for "change" keeps working untouched. */
"use strict";
W98.Combo = (() => {
  let openList = null, openFor = null;

  function closeList() {
    if (openList) {
      openList.remove();
      openList = null;
      openFor = null;
      document.removeEventListener("mousedown", onDocDown, true);
    }
  }
  function onDocDown(e) {
    if (openList && !openList.contains(e.target) && (!openFor || !openFor.contains(e.target))) closeList();
  }

  function enhance(sel) {
    if (sel._w98combo || sel.multiple || sel.size > 1) return;
    sel._w98combo = true;

    const box = el("span", { class: "w98combo", tabindex: "0" });
    const txt = el("span", { class: "cb-text" });
    const btn = el("span", { class: "cb-btn" }, el("span", { class: "cb-arrow" }));
    box.append(txt, btn);

    /* inherit sizing hints from the select */
    if (sel.style.width) box.style.width = sel.style.width;
    if (sel.style.flex) box.style.flex = sel.style.flex;
    if (sel.style.minWidth) box.style.minWidth = sel.style.minWidth;
    if (sel.style.margin) box.style.margin = sel.style.margin;

    sel.style.display = "none";
    sel.insertAdjacentElement("afterend", box);

    function syncLabel() {
      const o = sel.options[sel.selectedIndex];
      txt.textContent = o ? o.textContent : "";
      box.classList.toggle("disabled", sel.disabled);
    }
    syncLabel();
    sel.addEventListener("change", syncLabel);
    new MutationObserver(syncLabel).observe(sel, { childList: true, subtree: true, attributes: true });

    function choose(i) {
      if (i < 0 || i >= sel.options.length || sel.options[i].disabled) return;
      sel.selectedIndex = i;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      syncLabel();
    }

    function show() {
      if (openList) { closeList(); return; }
      if (sel.disabled) return;
      const r = box.getBoundingClientRect();
      openList = el("div", { class: "cb-list" });
      openFor = box;
      [...sel.options].forEach((o, i) => {
        const row = el("div", { class: "cb-item" + (i === sel.selectedIndex ? " cursel" : "") + (o.disabled ? " disabled" : ""), text: o.textContent });
        row.addEventListener("mouseenter", () => {
          openList.querySelectorAll(".cb-item").forEach(x => x.classList.remove("hot"));
          row.classList.add("hot");
        });
        row.addEventListener("mousedown", (e) => e.stopPropagation());
        row.addEventListener("click", () => { choose(i); closeList(); });
        openList.append(row);
      });
      openList.style.left = r.x + "px";
      openList.style.top = r.bottom + "px";
      openList.style.minWidth = Math.max(60, r.width) + "px";
      document.body.append(openList);
      /* flip upward if it would fall off the screen */
      const scr = document.getElementById("screen");
      const H = Math.max(window.innerHeight, scr ? scr.offsetHeight : 0, 480);
      const lh = openList.getBoundingClientRect().height;
      if (r.bottom + lh > H - 4) openList.style.top = Math.max(2, r.top - lh) + "px";
      document.addEventListener("mousedown", onDocDown, true);
      const cur = openList.querySelector(".cursel");
      if (cur) cur.scrollIntoView({ block: "nearest" });
    }

    box.addEventListener("mousedown", (e) => { e.preventDefault(); box.focus(); show(); });
    box.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); e.stopPropagation();
        let i = sel.selectedIndex + (e.key === "ArrowDown" ? 1 : -1);
        while (i >= 0 && i < sel.options.length && sel.options[i].disabled) i += (e.key === "ArrowDown" ? 1 : -1);
        if (i >= 0 && i < sel.options.length) choose(i);
      } else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); show(); }
      else if (e.key === "Escape" && openList) { e.stopPropagation(); closeList(); }
    });
  }

  function scan(root) {
    if (root.nodeType !== 1) return;
    if (root.tagName === "SELECT") enhance(root);
    if (root.querySelectorAll) root.querySelectorAll("select").forEach(enhance);
  }
  const mo = new MutationObserver(muts => {
    for (const m of muts) for (const n of m.addedNodes) scan(n);
  });
  function init() {
    scan(document.body);
    mo.observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) init();
  else document.addEventListener("DOMContentLoaded", init);

  return { enhance, scan, closeList };
})();

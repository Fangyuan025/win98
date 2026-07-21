/* dialogs.js — common dialogs: file open/save, tabs, about, properties */
"use strict";
const Dialogs = W98.Dialogs = (() => {

  /* ---- tabs component ---- */
  function makeTabs(pages) {
    const wrap = el("div", { class: "tabs" });
    const row = el("div", { class: "tab-row" });
    const pageEl = el("div", { class: "tab-page" });
    wrap.append(row, pageEl);
    const tabs = pages.map((p, i) => {
      const t = el("span", { class: "tab", text: p.label });
      t.addEventListener("mousedown", () => select(i));
      row.append(t);
      return t;
    });
    function select(i) {
      tabs.forEach((t, j) => t.classList.toggle("on", i === j));
      pageEl.innerHTML = "";
      pages[i].build(pageEl);
    }
    select(0);
    return { el: wrap, select };
  }

  /* ---- file open/save dialog ---- */
  function filePick(o) {
    return new Promise((resolve) => {
      const mode = o.mode || "open";
      let dir = o.startDir || FS.DOCS;
      if (!FS.get(dir)) dir = "C:";
      let selName = "";

      const win = WM.create({
        title: o.title || (mode === "open" ? "Open" : "Save As"),
        icon: o.icon || "folder", width: 430, height: 320,
        resizable: false, minimizable: false, maximizable: false,
        noTaskbar: true, center: true
      });

      const topRow = el("div", { style: "display:flex;align-items:center;gap:6px;padding:6px 8px 4px;flex:none" });
      const lookSel = el("select", { class: "field", style: "flex:1;height:22px" });
      const upBtn = el("button", { class: "btn", style: "min-width:26px;width:26px;height:22px;padding:0", title: "Up One Level" });
      upBtn.append(Icons.img("folderopen", 16));
      topRow.append(el("span", { text: mode === "open" ? "Look in:" : "Save in:" }), lookSel, upBtn);

      const list = el("div", { class: "listview sunken lv-icons", style: "flex:1;margin:2px 8px;align-content:flex-start" });

      const nameRow = el("div", { style: "display:flex;align-items:center;gap:6px;padding:2px 8px" });
      const nameInput = el("input", { type: "text", class: "field", style: "flex:1;height:21px", value: o.defaultName || "" });
      const okBtn = el("button", { class: "btn default", text: mode === "open" ? "Open" : "Save", style: "width:80px" });
      nameRow.append(el("span", { text: "File name:", style: "width:70px" }), nameInput, okBtn);

      const typeRow = el("div", { style: "display:flex;align-items:center;gap:6px;padding:2px 8px 8px" });
      const typeSel = el("select", { class: "field", style: "flex:1;height:22px" });
      typeSel.append(el("option", { text: o.typeName || "All Files (*.*)" }));
      const cancelBtn = el("button", { class: "btn", text: "Cancel", style: "width:80px" });
      typeRow.append(el("span", { text: "Files of type:", style: "width:70px" }), typeSel, cancelBtn);

      win.body.append(topRow, list, nameRow, typeRow);

      function refreshLook() {
        lookSel.innerHTML = "";
        const s = FS.segs(dir);
        for (let i = 0; i < s.length; i++) {
          const opt = el("option", { text: (i ? " ".repeat(i * 2) : "") + s[i], value: s.slice(0, i + 1).join("/") });
          if (i === s.length - 1) opt.selected = true;
          lookSel.append(opt);
        }
      }
      function refreshList() {
        list.innerHTML = "";
        const items = FS.list(dir).filter(({ name, node }) => {
          if (node.t === "d") return true;
          if (!o.ext) return true;
          const exts = Array.isArray(o.ext) ? o.ext : [o.ext];
          return exts.some(e => name.toLowerCase().endsWith(e));
        });
        for (const { name, node } of items) {
          const it = el("div", { class: "lv-bigitem", style: "width:100px" });
          it.append(Icons.img(FS.iconFor(name, node), 32), el("br"), el("span", { class: "nm", text: name }));
          it.addEventListener("click", () => {
            $$(".lv-bigitem", list).forEach(x => x.classList.remove("sel"));
            it.classList.add("sel");
            if (node.t === "f") { selName = name; nameInput.value = name; }
          });
          it.addEventListener("dblclick", () => {
            if (node.t === "d") { dir = dir + "/" + name; refreshLook(); refreshList(); }
            else finish(dir + "/" + name);
          });
          list.append(it);
        }
      }
      lookSel.addEventListener("change", () => { dir = lookSel.value; refreshLook(); refreshList(); });
      upBtn.addEventListener("click", () => {
        const s = FS.segs(dir);
        if (s.length > 1) { dir = s.slice(0, -1).join("/"); refreshLook(); refreshList(); }
      });

      async function finish(path) {
        if (path === null) { win.close(true); resolve(null); return; }
        if (mode === "save") {
          if (FS.exists(path) && FS.get(path).t === "d") return;
          if (FS.exists(path)) {
            const r = await WM.msgbox({
              title: "Save As", icon: "warning",
              text: FS.display(path) + " already exists.\nDo you want to replace it?",
              buttons: ["Yes", "No"], defaultBtn: 1
            });
            if (r !== "Yes") return;
          }
        } else if (!FS.exists(path)) {
          await WM.msgbox({ title: o.title || "Open", icon: "warning", text: "The file '" + FS.display(path) + "' was not found.\nPlease verify the correct file name was given." });
          return;
        }
        win.close(true);
        resolve(path);
      }
      okBtn.addEventListener("click", () => {
        let nm = nameInput.value.trim();
        if (!nm) return;
        if (mode === "save" && o.ext && !/\.[^.]+$/.test(nm)) nm += (Array.isArray(o.ext) ? o.ext[0] : o.ext);
        const target = dir + "/" + nm;
        const n = FS.get(target);
        if (n && n.t === "d") { dir = target; refreshLook(); refreshList(); return; }
        finish(target);
      });
      cancelBtn.addEventListener("click", () => finish(null));
      nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") okBtn.click(); });
      win.opts.onBeforeClose = () => { resolve(null); return true; };
      refreshLook(); refreshList();
      setTimeout(() => nameInput.focus(), 30);
    });
  }

  /* ---- about box ---- */
  function about(appName, iconName, lines) {
    const win = WM.create({
      title: "About " + appName, icon: iconName, width: 400, height: 0,
      resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
    });
    win.el.style.height = "auto";
    const flag = new Image(); flag.src = Icons.bigFlag(3); flag.style.width = "48px";
    const body = el("div", { style: "display:flex;gap:14px;padding:16px 18px 8px" },
      el("div", {}, flag),
      el("div", { style: "line-height:1.6" },
        el("div", { text: "Windows 98", style: "font-weight:700" }),
        el("div", { text: appName }),
        el("div", { text: "Copyright © 1981-1998" }),
        el("div", { class: "vsep" }),
        ...(lines || ["A nostalgic recreation for macOS.", "Physical memory available to Windows: 65,012 KB"]).map(t => el("div", { text: t }))
      )
    );
    const row = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding-right:18px" });
    const ok = el("button", { class: "btn default", text: "OK" });
    ok.addEventListener("click", () => win.close());
    row.append(ok);
    win.body.append(body, row);
    setTimeout(() => ok.focus(), 30);
    return win;
  }

  /* ---- file properties ---- */
  function fileProps(path) {
    const node = FS.get(path);
    if (!node) return;
    const name = FS.segs(path).pop();
    const isDir = node.t === "d";
    const win = WM.create({
      title: name + " Properties", icon: FS.iconFor(name, node), width: 360, height: 400,
      resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
    });
    const tabs = makeTabs([{
      label: "General",
      build(page) {
        const size = FS.sizeOf(node);
        const rows = [
          ["", ""],
          ["Type:", FS.typeName(name, node)],
          ["Location:", FS.display(FS.segs(path).slice(0, -1).join("/"))],
          ["Size:", fmtSize(size) + (size >= 1024 ? ` (${size.toLocaleString()} bytes)` : "")],
          ["", ""],
          ["Created:", fmtShortDate(node.c || Date.now())],
          ["Modified:", fmtShortDate(node.m || Date.now())],
        ];
        if (isDir) rows.splice(4, 0, ["Contains:", countKids(node) + " Files"]);
        const hdr = el("div", { style: "display:flex;align-items:center;gap:10px;padding:4px 2px 10px;border-bottom:1px solid var(--shadow);box-shadow:0 1px var(--lighter)" },
          Icons.img(FS.iconFor(name, node), 32), el("span", { text: name }));
        page.append(hdr);
        const grid = el("div", { style: "display:grid;grid-template-columns:80px 1fr;gap:6px 8px;padding:10px 2px" });
        rows.forEach(([a, b]) => { grid.append(el("span", { text: a }), el("span", { text: b })); });
        page.append(grid);
        const attrs = el("div", { style: "display:flex;gap:16px;padding-top:6px" });
        [["Read-only", false], ["Hidden", false], ["Archive", !isDir]].forEach(([lbl, on]) => {
          const c = el("label", { class: "checkline" }, el("input", { type: "checkbox" }), lbl);
          $("input", c).checked = on;
          attrs.append(c);
        });
        page.append(el("span", { text: "Attributes:" }), attrs);
      }
    }]);
    function countKids(n) {
      let c = 0;
      for (const k in n.ch) { c++; if (n.ch[k].t === "d") c += countKids(n.ch[k]); }
      return c;
    }
    const btnRow = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:8px 2px 2px" });
    const ok = el("button", { class: "btn default", text: "OK" });
    const cancel = el("button", { class: "btn", text: "Cancel" });
    ok.addEventListener("click", () => win.close());
    cancel.addEventListener("click", () => win.close());
    btnRow.append(ok, cancel);
    win.body.style.padding = "8px";
    win.body.append(tabs.el, btnRow);
  }

  function prompt(o) {
    return new Promise((resolve) => {
      const dw = WM.create({
        title: o.title || "Input", icon: o.icon || "info", width: 340, height: 0,
        resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
      });
      dw.el.style.height = "auto";
      const inp = el("input", { type: o.password ? "password" : "text", class: "field", style: "width:100%;box-sizing:border-box" });
      inp.value = o.value || "";
      let done = false;
      const finish = (v) => { if (done) return; done = true; dw.close(true); resolve(v); };
      const okB = el("button", { class: "btn default", text: "OK", onclick: () => finish(inp.value) });
      const caB = el("button", { class: "btn", text: "Cancel", onclick: () => finish(null) });
      dw.body.append(
        el("div", { style: "padding:12px 14px 4px;white-space:pre-line;line-height:1.4", text: o.label || "" }),
        el("div", { style: "padding:0 14px 6px" }, inp),
        el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:6px 14px 12px" }, okB, caB)
      );
      inp.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter") finish(inp.value);
        if (e.key === "Escape") finish(null);
      });
      dw.opts.onClose = () => { if (!done) { done = true; resolve(null); } };
      setTimeout(() => inp.focus(), 60);
    });
  }

  return { filePick, about, makeTabs, fileProps, prompt };
})();

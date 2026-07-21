/* desktop.js — desktop icons, selection, wallpaper, schemes, file opening */
"use strict";
W98.Apps = W98.Apps || {};

/* ---- open any VFS path with the right app ---- */
W98.openPath = function (path, depth) {
  depth = depth || 0;
  const node = FS.get(path);
  if (!node) {
    WM.msgbox({ title: "Windows", icon: "error", text: "Cannot find the file '" + FS.display(path) + "' (or one of its components)." });
    return;
  }
  if (node.t === "d") { W98.launch("explorer", path); return; }
  const e = FS.ext(path);
  const data = String(node.data || "");
  if (data.startsWith("app:")) {
    const appId = data.slice(4);
    if (W98.Apps[appId]) { W98.launch(appId); return; }
  }
  if (data.startsWith("song:")) {
    W98.launch("megaamp", { play: parseInt(data.slice(5), 10) || 0 });
    return;
  }
  if (data.startsWith("lnk:")) {
    if (depth > 4) return; // shortcut loops go nowhere, politely
    const target = data.slice(4);
    if (target === "::PrintQueue") { W98.Print.openQueue(); return; }
    if (!FS.exists(target)) {
      WM.msgbox({ title: "Problem with Shortcut", icon: "error", text: "The item '" + FS.display(target) + "' that this shortcut refers to has been changed or moved." });
      return;
    }
    W98.openPath(target, depth + 1);
    return;
  }
  if (e === "zip") { W98.launch("zipmaster", path); return; }
  if (e === "trk") { W98.launch("composer", path); return; }
  if (data.startsWith("data:audio") || (["wav", "mp3", "m4a", "ogg", "aif", "aiff"].includes(e) && data.startsWith("data:"))) { W98.playAudioFile(path); return; }
  if (["bmp", "png", "jpg", "jpeg", "gif", "webp"].includes(e) || data.startsWith("data:image")) { W98.launch("paint", path); return; }
  if (data.startsWith("data:")) {
    WM.msgbox({ title: FS.segs(path).pop(), icon: "info", text: "This file was imported from your Mac and has no program here.\n\nRight-click it and choose 'Export to Mac...' to send it back,\nor keep it as a souvenir." });
    return;
  }
  if (e === "doc" || e === "rtf" || e === "wri") { W98.launch("wordpad", path); return; }
  if (e === "xls" || e === "csv") { W98.launch("spreadsheet", path); return; }
  if (e === "exe" || e === "com" || e === "dll" || e === "dat") {
    WM.msgbox({ title: "Program Error", icon: "error", text: FS.display(path) + "\n\nA required .DLL file was not found. This program is part of the system and cannot be run here." });
    return;
  }
  if (["txt", "bat", "ini", "sys", "log", "htm", "html"].includes(e)) { W98.launch("notepad", path); return; }
  /* unknown type: honor a remembered association, else ask */
  const assoc = Store.get("assoc", {});
  if (assoc[e] && W98.Apps[assoc[e]]) { W98.launch(assoc[e], path); return; }
  W98.openWith(path, e);
};

/* the classic "Open With" dialog */
W98.openWith = function (path, e) {
  const choices = [
    ["Notepad", "notepad", "notepad"],
    ["WordPad", "wordpad", "wordpad"],
    ["Paint", "paint", "paint"],
    ["Spreadsheet", "spreadsheet", "sheet"]
  ].filter(c => W98.Apps[c[1]]);
  const win = WM.create({
    title: "Open With", icon: "run", width: 310, height: 0,
    resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
  });
  win.el.style.height = "auto";
  let sel = 0;
  const list = el("div", { class: "listview sunken", style: "height:104px;padding:2px;margin:4px 14px" });
  choices.forEach((c, i) => {
    const row = el("div", { class: "lv-item" }, Icons.img(c[2], 16), el("span", { class: "nm", text: c[0] }));
    if (i === 0) row.classList.add("sel");
    row.addEventListener("click", () => {
      sel = i;
      $$(".lv-item", list).forEach(r => r.classList.remove("sel"));
      row.classList.add("sel");
    });
    row.addEventListener("dblclick", () => { sel = i; okB.click(); });
    list.append(row);
  });
  const always = el("label", { class: "checkline", style: "margin:0 14px" },
    el("input", { type: "checkbox" }), "Always use this program to open this type of file");
  const btns = el("div", { class: "msgbox-btns" });
  const okB = el("button", { class: "btn default", text: "OK" });
  const cancelB = el("button", { class: "btn", text: "Cancel", onclick: () => win.close() });
  okB.addEventListener("click", () => {
    const appId = choices[sel][1];
    if ($("input", always).checked && e) {
      const assoc = Store.get("assoc", {});
      assoc[e] = appId;
      Store.set("assoc", assoc);
    }
    win.close(true);
    W98.launch(appId, path);
  });
  btns.append(okB, cancelB);
  win.body.append(
    el("div", { style: "padding:12px 14px 4px;line-height:1.4", text: "Choose the program you want to use to open the file:\n'" + FS.segs(path).pop() + "'" }),
    list, always, btns);
};

W98.reinstallProgram = function (id) {
  /* recreate the program's files + desktop shortcut when reinstalled */
  const p = W98.OptionalPrograms && W98.OptionalPrograms[id];
  if (!p) return;
  p.files.forEach(f => {
    if (FS.exists(f)) return;
    if (/\.lnk$/i.test(f)) {
      // shortcut → point at the program's first .exe
      const target = p.files.find(x => /\.exe$/i.test(x));
      if (target) FS.writeFile(f, "lnk:" + target);
    } else {
      FS.writeFile(f, "app:" + id);
    }
  });
};

W98.launch = function (appId, args) {
  const app = W98.Apps[appId];
  if (!app) return;
  if (W98.isRemoved && W98.isRemoved(appId)) {
    WM.msgbox({ title: "Cannot Run Program", icon: "error",
      text: "This program has been removed.\n\nReinstall it from Control Panel > Add/Remove Programs." });
    return;
  }
  if (app.single) {
    const w = WM.findByAppId(appId);
    if (w) { w.focus(); if (app.reopen) app.reopen(w, args); return w; }
  }
  // brief hourglass, like a real program spinning up
  document.body.classList.add("hourglass");
  setTimeout(() => document.body.classList.remove("hourglass"), 550);
  return app.launch(args);
};

W98.addRecent = function (path) {
  let r = Store.get("recent", []);
  r = r.filter(p => p.toLowerCase() !== path.toLowerCase());
  r.unshift(path);
  if (r.length > 10) r.length = 10;
  Store.set("recent", r);
};

W98.fileClipboard = null;

const Desktop = W98.Desktop = (() => {
  const iconsEl = () => $("#icons");
  const CELL_H = 75, CELL_W = 75, PAD = 4;

  const sysIcons = [
    { key: "mycomputer", label: "My Computer", icon: "mycomputer", open: () => W98.launch("explorer", "::MyComputer") },
    { key: "mydocs", label: "My Documents", icon: "mydocs", open: () => W98.launch("explorer", FS.DOCS) },
    { key: "ie", label: "Internet Explorer", icon: "ie", open: () => W98.launch("ie") },
    { key: "network", label: "Network Neighborhood", icon: "network", open: () => W98.launch("explorer", "::Network") },
    { key: "recycle", label: "Recycle Bin", icon: "recycle", open: () => W98.launch("explorer", "::Recycle") },
    { key: "briefcase", label: "My Briefcase", icon: "briefcase", open: () => W98.launch("explorer", "C:/My Briefcase") },
  ];

  let selected = new Set();

  function iconPosStore() { return Store.get("iconPos", {}); }

  function defaultPos(i) {
    const h = Math.max($("#desktop").offsetHeight || 0, 460); // guard: viewport may not be laid out yet
    const rows = Math.max(5, Math.floor((h - PAD * 2) / CELL_H));
    return { x: PAD + Math.floor(i / rows) * CELL_W, y: PAD + (i % rows) * CELL_H };
  }

  function allIconDefs() {
    const defs = sysIcons.map(s => ({ ...s, sys: true }));
    for (const { name, node } of FS.list(FS.DESKTOP)) {
      defs.push({
        key: "fs:" + name, label: name.replace(/\.lnk$/i, ""), icon: FS.iconFor(name, node),
        path: FS.DESKTOP + "/" + name, node,
        open: () => W98.openPath(FS.DESKTOP + "/" + name)
      });
    }
    return defs;
  }

  function render() {
    const holder = iconsEl();
    holder.innerHTML = "";
    const pos = iconPosStore();
    allIconDefs().forEach((def, i) => {
      const p = pos[def.key] || defaultPos(i);
      const d = el("div", { class: "dicon", dataset: { key: def.key } });
      d.style.left = p.x + "px"; d.style.top = p.y + "px";
      const icName = def.key === "recycle" && FS.recycle.length ? "recyclefull" : def.icon;
      const ic = el("div", { class: "ic" });
      const url = Icons.get(icName, 32);
      ic.append(Icons.img(icName, 32));
      ic.style.setProperty("--mask", `url(${url})`);
      const lbl = el("div", { class: "lbl", text: def.label });
      d.append(ic, lbl);
      if (selected.has(def.key)) d.classList.add("sel");

      d.addEventListener("mousedown", (e) => {
        if (e.button === 0 || !selected.has(def.key)) {
          if (!e.ctrlKey && !e.metaKey && !selected.has(def.key)) selected.clear();
          if (e.ctrlKey || e.metaKey) {
            if (selected.has(def.key) && e.button === 0) selected.delete(def.key); else selected.add(def.key);
          } else selected.add(def.key);
          updateSel();
        }
        if (e.button === 0) beginDrag(e, def);
        e.stopPropagation();
      });
      d.addEventListener("dblclick", (e) => { if (e.button === 0) def.open(); });
      d.addEventListener("contextmenu", (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!selected.has(def.key)) { selected.clear(); selected.add(def.key); updateSel(); }
        iconMenu(e, def);
      });
      holder.append(d);
    });
  }

  function updateSel() {
    $$(".dicon").forEach(d => d.classList.toggle("sel", selected.has(d.dataset.key)));
  }

  function beginDrag(e, def) {
    const startX = e.clientX, startY = e.clientY;
    const moving = $$(".dicon").filter(d => selected.has(d.dataset.key));
    const origins = moving.map(d => ({ d, x: d.offsetLeft, y: d.offsetTop }));
    let dragging = false;
    const mm = (ev) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!dragging && Math.abs(dx) + Math.abs(dy) < 4) return;
      dragging = true;
      for (const o of origins) {
        o.d.style.left = clamp(o.x + dx, 0, $("#desktop").offsetWidth - 40) + "px";
        o.d.style.top = clamp(o.y + dy, 0, $("#desktop").offsetHeight - 50) + "px";
      }
    };
    const mu = () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      if (dragging) {
        const pos = iconPosStore();
        for (const o of origins) pos[o.d.dataset.key] = { x: o.d.offsetLeft, y: o.d.offsetTop };
        Store.set("iconPos", pos);
      }
    };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
  }

  /* marquee selection on empty desktop */
  function initMarquee() {
    const dt = $("#desktop");
    dt.addEventListener("mousedown", (e) => {
      if (e.target !== dt && e.target !== iconsEl()) return;
      if (e.button !== 0) return;
      selected.clear(); updateSel();
      const mq = $("#marquee");
      const sx = e.clientX, sy = e.clientY;
      mq.hidden = false;
      const mm = (ev) => {
        const x = Math.min(sx, ev.clientX), y = Math.min(sy, ev.clientY);
        const w = Math.abs(ev.clientX - sx), h = Math.abs(ev.clientY - sy);
        Object.assign(mq.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
        const r = { l: x, t: y, r: x + w, b: y + h };
        selected.clear();
        $$(".dicon").forEach(d => {
          const dr = d.getBoundingClientRect();
          if (dr.left < r.r && dr.right > r.l && dr.top < r.b && dr.bottom > r.t) selected.add(d.dataset.key);
        });
        updateSel();
      };
      const mu = () => {
        mq.hidden = true; mq.style.width = "0px"; mq.style.height = "0px";
        window.removeEventListener("mousemove", mm);
        window.removeEventListener("mouseup", mu);
      };
      window.addEventListener("mousemove", mm);
      window.addEventListener("mouseup", mu);
    });

    dt.addEventListener("contextmenu", (e) => {
      if (e.target !== dt && e.target !== iconsEl()) return;
      e.preventDefault();
      desktopMenu(e);
    });
  }

  /* ---- context menus ---- */
  function iconMenu(e, def) {
    const items = [];
    items.push({ label: "Open", bold: true, click: def.open });
    if (def.key === "recycle") {
      items.push({ label: "Empty Recycle Bin", disabled: !FS.recycle.length, click: emptyRecycleConfirm });
    }
    if (def.path) {
      items.push("-");
      items.push({ label: "Cut", click: () => { W98.fileClipboard = { mode: "cut", paths: [def.path] }; } });
      items.push({ label: "Copy", click: () => { W98.fileClipboard = { mode: "copy", paths: [def.path] }; } });
      items.push("-");
      items.push({ label: "Delete", click: () => deleteConfirm([def.path]) });
      items.push({ label: "Rename", click: () => startRename(def) });
      items.push("-");
      items.push({ label: "Properties", click: () => Dialogs.fileProps(def.path) });
    } else {
      items.push("-");
      items.push({ label: "Properties", click: () => {
        if (def.key === "recycle") W98.launch("explorer", "::Recycle");
        else if (def.key === "mycomputer") W98.launch("sysprops");
        else if (def.key === "ie") W98.launch("ie");
        else W98.launch("explorer", def.key === "mydocs" ? FS.DOCS : "::MyComputer");
      }});
    }
    Menu.popup(e.clientX, e.clientY, items);
  }

  function emptyRecycleConfirm() {
    const n = FS.recycle.length;
    WM.msgbox({
      title: "Confirm Multiple File Delete", icon: "question",
      text: "Are you sure you want to delete these " + n + " items?",
      buttons: ["Yes", "No"], defaultBtn: 0
    }).then(r => {
      if (r === "Yes") { FS.emptyRecycle(); Sound.play("recycle"); }
    });
  }

  function deleteConfirm(paths) {
    const text = paths.length === 1
      ? "Are you sure you want to send '" + FS.segs(paths[0]).pop() + "' to the Recycle Bin?"
      : "Are you sure you want to send these " + paths.length + " items to the Recycle Bin?";
    WM.msgbox({ title: "Confirm File Delete", icon: "question", text, buttons: ["Yes", "No"] })
      .then(r => {
        if (r === "Yes") { paths.forEach(p => FS.del(p)); Sound.play("recycle"); selected.clear(); }
      });
  }

  function startRename(def) {
    const d = $$(".dicon").find(x => x.dataset.key === def.key);
    if (!d) return;
    const lbl = $(".lbl", d);
    const input = el("input", { type: "text", value: def.label });
    lbl.textContent = "";
    lbl.append(input);
    input.focus(); input.select();
    let done = false;
    const finish = (commit) => {
      if (done) return; done = true;
      if (commit && input.value.trim() && input.value !== def.label) {
        const err = FS.rename(def.path, input.value.trim());
        if (err) { WM.msgbox({ title: "Error Renaming File", icon: "error", text: err }); }
      }
      render();
    };
    input.addEventListener("keydown", (ev) => {
      ev.stopPropagation();
      if (ev.key === "Enter") finish(true);
      if (ev.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
    input.addEventListener("mousedown", ev => ev.stopPropagation());
  }

  function desktopMenu(e) {
    const wpNames = ["(None)", "Clouds", "Waves", "Tiles", "Blue Weave", "Circles"];
    Menu.popup(e.clientX, e.clientY, [
      { label: "Arrange Icons", sub: [
        { label: "by Name", click: () => arrange() },
        { label: "by Type", click: () => arrange("type") },
        { label: "by Size", click: () => arrange("size") },
        { label: "by Date", click: () => arrange("date") },
        "-",
        { label: "Auto Arrange", checked: Store.get("autoArrange", false), click: () => {
          Store.set("autoArrange", !Store.get("autoArrange", false));
          if (Store.get("autoArrange")) arrange();
        }}
      ]},
      { label: "Line Up Icons", click: lineUp },
      "-",
      { label: "Refresh", click: () => render() },
      "-",
      { label: "Paste", disabled: !W98.fileClipboard, click: pasteHere },
      "-",
      { label: "New", sub: [
        { label: "Folder", icon: "folder", click: () => newItem("folder") },
        "-",
        { label: "Text Document", icon: "textfile", click: () => newItem("txt") },
        { label: "Bitmap Image", icon: "imagefile", click: () => newItem("bmp") }
      ]},
      "-",
      { label: "Properties", click: () => W98.launch("display") }
    ]);
  }

  function pasteHere() {
    const cb = W98.fileClipboard;
    if (!cb) return;
    for (const p of cb.paths) {
      if (cb.mode === "copy") FS.copyTo(p, FS.DESKTOP);
      else FS.moveTo(p, FS.DESKTOP);
    }
    if (cb.mode === "cut") W98.fileClipboard = null;
  }

  function newItem(kind) {
    let name;
    if (kind === "folder") {
      name = FS.uniqueName(FS.DESKTOP, "New Folder", "");
      FS.mkdir(FS.DESKTOP + "/" + name);
    } else if (kind === "txt") {
      name = FS.uniqueName(FS.DESKTOP, "New Text Document", ".txt");
      FS.writeFile(FS.DESKTOP + "/" + name, "");
    } else {
      name = FS.uniqueName(FS.DESKTOP, "New Bitmap Image", ".bmp");
      FS.writeFile(FS.DESKTOP + "/" + name, "");
    }
    render();
    // immediately start rename, like Windows
    setTimeout(() => {
      const def = allIconDefs().find(d => d.key === "fs:" + name);
      if (def) { selected.clear(); selected.add(def.key); updateSel(); startRename(def); }
    }, 50);
  }

  function arrange(by) {
    const defs = allIconDefs();
    const fsDefs = defs.filter(d => !d.sys);
    if (by === "type") fsDefs.sort((a, b) => FS.typeName(a.label, a.node).localeCompare(FS.typeName(b.label, b.node)) || a.label.localeCompare(b.label));
    else if (by === "size") fsDefs.sort((a, b) => FS.sizeOf(a.node) - FS.sizeOf(b.node));
    else if (by === "date") fsDefs.sort((a, b) => (a.node.m || 0) - (b.node.m || 0));
    else fsDefs.sort((a, b) => a.label.localeCompare(b.label));
    const ordered = defs.filter(d => d.sys).concat(fsDefs);
    const pos = {};
    ordered.forEach((d, i) => { pos[d.key] = defaultPos(i); });
    Store.set("iconPos", pos);
    render();
  }

  function lineUp() {
    const pos = iconPosStore();
    $$(".dicon").forEach(d => {
      const x = Math.round((d.offsetLeft - PAD) / CELL_W) * CELL_W + PAD;
      const y = Math.round((d.offsetTop - PAD) / CELL_H) * CELL_H + PAD;
      pos[d.dataset.key] = { x: Math.max(PAD, x), y: Math.max(PAD, y) };
    });
    Store.set("iconPos", pos);
    render();
  }

  /* ---- wallpaper ---- */
  function makeWallpaper(name) {
    const c = document.createElement("canvas");
    const x = c.getContext("2d");
    if (name === "Clouds") {
      c.width = 640; c.height = 480;
      const g = x.createLinearGradient(0, 0, 0, 480);
      g.addColorStop(0, "#0078b8"); g.addColorStop(1, "#7fc4e8");
      x.fillStyle = g; x.fillRect(0, 0, 640, 480);
      let seed = 42;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 46; i++) {
        const cx = rnd() * 640, cy = rnd() * 480, r = 24 + rnd() * 60;
        const cg = x.createRadialGradient(cx, cy, 2, cx, cy, r);
        cg.addColorStop(0, "rgba(255,255,255,0.85)");
        cg.addColorStop(1, "rgba(255,255,255,0)");
        x.fillStyle = cg;
        x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
      }
      return { url: c.toDataURL(), mode: "stretch" };
    }
    if (name === "Waves") {
      c.width = 64; c.height = 32;
      x.fillStyle = "#008080"; x.fillRect(0, 0, 64, 32);
      x.strokeStyle = "#00a0a0"; x.lineWidth = 2;
      for (let row = 0; row < 3; row++) {
        x.beginPath();
        for (let i = 0; i <= 64; i++) x.lineTo(i, 10 * row + 6 + Math.sin(i / 64 * Math.PI * 2) * 4);
        x.stroke();
      }
      return { url: c.toDataURL(), mode: "tile" };
    }
    if (name === "Tiles") {
      c.width = 32; c.height = 32;
      x.fillStyle = "#c0c0c0"; x.fillRect(0, 0, 32, 32);
      x.fillStyle = "#808080"; x.fillRect(0, 0, 16, 16); x.fillRect(16, 16, 16, 16);
      x.strokeStyle = "#fff"; x.strokeRect(0.5, 0.5, 16, 16);
      return { url: c.toDataURL(), mode: "tile" };
    }
    if (name === "Blue Weave") {
      c.width = 16; c.height = 16;
      x.fillStyle = "#000080"; x.fillRect(0, 0, 16, 16);
      x.strokeStyle = "#0000c0"; x.lineWidth = 2;
      x.beginPath(); x.moveTo(0, 16); x.lineTo(16, 0); x.stroke();
      x.strokeStyle = "#000060";
      x.beginPath(); x.moveTo(0, 0); x.lineTo(16, 16); x.stroke();
      return { url: c.toDataURL(), mode: "tile" };
    }
    if (name === "Circles") {
      c.width = 32; c.height = 32;
      x.fillStyle = "#008080"; x.fillRect(0, 0, 32, 32);
      x.strokeStyle = "#c0c0c0";
      x.beginPath(); x.arc(16, 16, 10, 0, Math.PI * 2); x.stroke();
      x.strokeStyle = "#004040";
      x.beginPath(); x.arc(16, 16, 14, 0, Math.PI * 2); x.stroke();
      return { url: c.toDataURL(), mode: "tile" };
    }
    return null;
  }

  function applyWallpaper(name, mode) {
    const dt = $("#desktop");
    dt.classList.remove("wp-tile", "wp-center", "wp-stretch");
    let wp = name === "(Custom)" ? { url: Store.get("wallpaperCustom", ""), mode: mode || "tile" } : makeWallpaper(name);
    if (wp && !wp.url) wp = null;
    if (!wp) { dt.style.backgroundImage = ""; }
    else {
      dt.style.backgroundImage = `url(${wp.url})`;
      dt.classList.add("wp-" + (mode || wp.mode));
    }
    Store.set("wallpaper", name || "(None)");
    if (mode) Store.set("wallpaperMode", mode);
  }

  /* ---- color schemes ---- */
  const SCHEMES = {
    "Windows Standard": { desktop: "#008080", face: "#c0c0c0", shadow: "#808080", light: "#dfdfdf", t1: "#000080", t2: "#1084d0", ti1: "#808080", ti2: "#b5b5b5", hl: "#000080" },
    "Brick":       { desktop: "#808000", face: "#c0c0c0", shadow: "#808080", light: "#dfdfdf", t1: "#800000", t2: "#d09c5c", ti1: "#787c74", ti2: "#c0b494", hl: "#800000" },
    "Desert":      { desktop: "#a28d68", face: "#d5ccbb", shadow: "#8a8069", light: "#e8e4d8", t1: "#008080", t2: "#7bbfbf", ti1: "#948c7c", ti2: "#c4bcac", hl: "#008080" },
    "Eggplant":    { desktop: "#588060", face: "#c0c0c0", shadow: "#808080", light: "#dfdfdf", t1: "#604080", t2: "#b09cc8", ti1: "#808080", ti2: "#b5b5b5", hl: "#604080" },
    "Lilac":       { desktop: "#80667a", face: "#c4bcd4", shadow: "#8c84a0", light: "#dcd8e8", t1: "#54366c", t2: "#a890c0", ti1: "#8c84a0", ti2: "#beb6d2", hl: "#54366c" },
    "Maple":       { desktop: "#546c54", face: "#d2c0a8", shadow: "#94805c", light: "#e8dcc8", t1: "#844c24", t2: "#d0a878", ti1: "#94805c", ti2: "#c4b494", hl: "#844c24" },
    "Rainy Day":   { desktop: "#00003c", face: "#9db9c3", shadow: "#5c7c88", light: "#c4d8e0", t1: "#345c6c", t2: "#88b0bc", ti1: "#5c7c88", ti2: "#a0bcc4", hl: "#345c6c" },
    "Rose":        { desktop: "#808080", face: "#cfafb7", shadow: "#9c7c84", light: "#e4ccd2", t1: "#9c5c64", t2: "#d8a8b0", ti1: "#9c7c84", ti2: "#c8a8b0", hl: "#9c5c64" },
    "Slate":       { desktop: "#548488", face: "#c0c0c0", shadow: "#808080", light: "#dfdfdf", t1: "#345c64", t2: "#88acb0", ti1: "#808080", ti2: "#b5b5b5", hl: "#345c64" },
    "Spruce":      { desktop: "#245c48", face: "#c0c0c0", shadow: "#808080", light: "#dfdfdf", t1: "#186048", t2: "#78b09c", ti1: "#808080", ti2: "#b5b5b5", hl: "#186048" },
    "Wheat":       { desktop: "#8c7444", face: "#dcd0b0", shadow: "#a09468", light: "#ece4d0", t1: "#6c5c24", t2: "#c4b478", ti1: "#a09468", ti2: "#d0c49c", hl: "#6c5c24" }
  };

  function applyScheme(name) {
    const s = SCHEMES[name] || SCHEMES["Windows Standard"];
    const r = document.documentElement.style;
    r.setProperty("--desktop", s.desktop);
    r.setProperty("--face", s.face);
    r.setProperty("--shadow", s.shadow);
    r.setProperty("--light", s.light);
    r.setProperty("--t1", s.t1);
    r.setProperty("--t2", s.t2);
    r.setProperty("--ti1", s.ti1);
    r.setProperty("--ti2", s.ti2);
    r.setProperty("--hl", s.hl);
    Store.set("scheme", name);
  }

  function init() {
    initMarquee();
    render();
    setTimeout(render, 500); // re-render once layout has settled
    applyScheme(Store.get("scheme", "Windows Standard"));
    applyWallpaper(Store.get("wallpaper", "(None)"), Store.get("wallpaperMode", null));
    W98.bus.on("fs", (dir) => {
      if (FS.norm(dir).toLowerCase() === FS.norm(FS.DESKTOP).toLowerCase()) render();
    });
    W98.bus.on("recycle", render);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Delete" && selected.size && document.activeElement === document.body) {
        const paths = [...selected].filter(k => k.startsWith("fs:")).map(k => FS.DESKTOP + "/" + k.slice(3));
        if (paths.length) deleteConfirm(paths);
      }
    });
  }

  return { init, render, applyWallpaper, applyScheme, SCHEMES, makeWallpaper, arrange, deleteConfirm, emptyRecycleConfirm };
})();

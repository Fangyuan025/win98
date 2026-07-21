/* explorer.js — My Computer / Windows Explorer / Recycle Bin / Control Panel */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.explorer = {
  name: "Windows Explorer", icon: "folderopen",
  launch(arg) {
    let loc = typeof arg === "string" ? arg : "C:";
    let showTree = arg === "C:" || (arg && arg.tree);
    let history = [], future = [];
    let viewMode = Store.get("expView", "large"); // large | list | details
    let selected = new Set();
    let sortBy = "name", sortAsc = true;

    /* ---------- virtual locations ---------- */
    function isVirtual(l) { return String(l).startsWith("::"); }
    function locName(l) {
      if (l === "::MyComputer") return "My Computer";
      if (l === "::ControlPanel") return "Control Panel";
      if (l === "::Recycle") return "Recycle Bin";
      if (l === "::Network") return "Network Neighborhood";
      if (String(l).startsWith("NET:")) return "\\\\" + FS.segs(l).slice(1).join("\\");
      const disp = FS.display(l);
      return FS.segs(l).length === 1 ? disp + "\\" : disp;
    }
    function locIcon(l) {
      if (l === "::MyComputer") return "mycomputer";
      if (l === "::ControlPanel") return "settings";
      if (l === "::Recycle") return FS.recycle.length ? "recyclefull" : "recycle";
      if (l === "::Network") return "network";
      if (String(l).startsWith("NET:")) return FS.segs(l).length === 2 ? "netpc" : "folderopen";
      const n = FS.get(l);
      if (FS.segs(l).length === 1) return "drivec";
      return n ? "folderopen" : "folder";
    }

    const CPL = [
      { name: "Display", icon: "display", open: () => W98.launch("display"), desc: "Change the appearance of your desktop" },
      { name: "Desktop Themes", icon: "display", open: () => W98.launch("themes"), desc: "Apply a coordinated theme to your desktop" },
      { name: "Date/Time", icon: "datetime", open: () => W98.launch("datetime"), desc: "Change date and time information" },
      { name: "Mouse", icon: "settings", open: () => W98.launch("mouse"), desc: "Change mouse settings and pointer trails" },
      { name: "Sounds", icon: "sounds", open: () => W98.launch("sounds"), desc: "Change system and program sounds" },
      { name: "System", icon: "system", open: () => W98.launch("sysprops"), desc: "See information about your computer" },
      { name: "Add/Remove Programs", icon: "programs", open: () => W98.launch("addremove"), desc: "Install or remove programs" },
      { name: "Regional Settings", icon: "settings", open: () => W98.launch("regional"), desc: "Change the language and regional format" },
      { name: "Printers", icon: "printer", open: () => W98.Print.openQueue(), desc: "Add, remove, and set up printers" }
    ];

    function itemsFor(l) {
      if (l === "::MyComputer") return [
        { name: "3½ Floppy (A:)", icon: "floppy", kind: "drive", open: () => WM.msgbox({ title: "A:\\ is not accessible", icon: "error", text: "The device is not ready.", buttons: ["Retry", "Cancel"] }).then(r => { if (r === "Retry") WM.msgbox({ title: "A:\\ is not accessible", icon: "error", text: "The device is not ready.\n(There is genuinely no floppy disk. It is 2026.)" }); }) },
        { name: "(C:)", icon: "drivec", kind: "drive", open: () => navigate("C:"), type: "Local Disk" },
        { name: "(D:)", icon: "cdrom", kind: "drive", open: () => WM.msgbox({ title: "D:\\ is not accessible", icon: "error", text: "The device is not ready.", buttons: ["Retry", "Cancel"] }), type: "CD-ROM Disc" },
        { name: "Control Panel", icon: "settings", kind: "virtual", open: () => navigate("::ControlPanel"), type: "System Folder" }
      ];
      if (l === "::ControlPanel") return CPL.map(c => ({ name: c.name, icon: c.icon, kind: "cpl", open: c.open, type: "Control Panel applet", desc: c.desc }));
      if (l === "::Recycle") return FS.recycle.map((r, i) => ({
        name: r.name, icon: FS.iconFor(r.name, r.node), kind: "recycle", idx: i,
        type: FS.typeName(r.name, r.node), size: FS.sizeOf(r.node), mtime: r.at,
        open: () => WM.msgbox({ title: r.name, icon: "info", text: "To use this file, first restore it from the Recycle Bin.\n(File > Restore)" })
      }));
      if (l === "::Network") {
        const DESCS = {
          "Dave-pc": "Dave's computer. The fan is loud on purpose.",
          "Family-pc": "The computer in the den.",
          "Moms-office": "Do not print 200 pages again."
        };
        return [
          { name: "Entire Network", icon: "network", kind: "virtual", type: "System Folder",
            desc: "The whole neighborhood",
            open: () => WM.msgbox({ title: "Entire Network", icon: "info", text: "Workgroup: HOMENET\n\n3 computer(s), 1 printer, and a cable modem\nthe ISP swears is 'on its way'." }) },
          ...FS.list("NET:").map(({ name }) => ({
            name, icon: "netpc", kind: "folder", path: "NET:/" + name, type: "Computer",
            desc: DESCS[name] || "A computer on the network",
            open: () => navigate("NET:/" + name)
          }))
        ];
      }
      return FS.list(l).map(({ name, node }) => ({
        name, icon: FS.iconFor(name, node), kind: node.t === "d" ? "folder" : "file",
        node, path: l + "/" + name, type: FS.typeName(name, node),
        size: node.t === "f" ? FS.sizeOf(node) : null, mtime: node.m,
        open: () => { if (node.t === "d") navigate(l + "/" + name); else W98.openPath(l + "/" + name); }
      }));
    }

    /* ---------- window ---------- */
    const win = WM.create({
      title: locName(loc), icon: locIcon(loc),
      width: 560, height: 400, minWidth: 320, minHeight: 220,
      statusbar: ["", { text: "", width: 120 }],
      menus: [
        { label: "File", items: fileMenu },
        { label: "Edit", items: editMenu },
        { label: "View", items: viewMenu },
        { label: "Go", items: () => [
          { label: "Back", disabled: !history.length, click: goBack },
          { label: "Forward", disabled: !future.length, click: goFwd },
          { label: "Up One Level", disabled: !canUp(), click: goUp },
          "-",
          { label: "My Computer", icon: "mycomputer", click: () => navigate("::MyComputer") },
          { label: "My Documents", icon: "mydocs", click: () => navigate(FS.DOCS) },
          { label: "Control Panel", icon: "settings", click: () => navigate("::ControlPanel") }
        ]},
        { label: "Help", items: () => [
          { label: "Help Topics", click: () => W98.launch("help", "explorer") },
          "-",
          { label: "About Windows 98", click: () => Dialogs.about("Windows 98", "mycomputer") }
        ]}
      ]
    });

    /* toolbar */
    const tbar = el("div", { class: "toolbar" });
    const mkTool = (label, iconName, fn, title) => {
      const b = el("button", { class: "tool-btn", dataset: { tip: title || label } });
      b.append(Icons.img(iconName, 20), el("span", { text: label, style: "font-size:10px" }));
      b.addEventListener("click", fn);
      tbar.append(b);
      return b;
    };
    const backBtn = mkTool("Back", "tb_back", goBack);
    const fwdBtn = mkTool("Forward", "tb_fwd", goFwd);
    const upBtn = mkTool("Up", "tb_up", goUp, "Up One Level");
    tbar.append(el("div", { class: "tsep" }));
    mkTool("Cut", "tb_cut", doCut);
    mkTool("Copy", "tb_copy", doCopy);
    const pasteBtn = mkTool("Paste", "tb_paste", doPaste);
    tbar.append(el("div", { class: "tsep" }));
    mkTool("Delete", "tb_del", doDelete);
    mkTool("Properties", "tb_props", doProps);
    tbar.append(el("div", { class: "tsep" }));
    mkTool("Views", "tb_views", () => {
      viewMode = viewMode === "large" ? "list" : viewMode === "list" ? "details" : "large";
      Store.set("expView", viewMode);
      refresh();
    });

    /* address bar */
    const addrIcon = Icons.img(locIcon(loc), 16);
    const addrInput = el("input", { type: "text" });
    const addr = el("div", { class: "addrbar" },
      el("span", { text: "Address" }),
      el("div", { class: "field" }, addrIcon, addrInput));
    addrInput.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        const v = addrInput.value.trim();
        const t = v.replace(/\\/g, "/").replace(/\/+$/, "");
        if (FS.get(t)) navigate(t);
        else if (/^my computer$/i.test(v)) navigate("::MyComputer");
        else if (/^control panel$/i.test(v)) navigate("::ControlPanel");
        else if (/^recycle/i.test(v)) navigate("::Recycle");
        else WM.msgbox({ title: "Windows Explorer", icon: "error", text: "Cannot find '" + v + "'. Check the spelling and try again." })
          .then(() => { addrInput.value = locName(loc); });
      }
    });

    /* main area */
    let webView = Store.get("expWebView", true);
    const bodyRow = el("div", { class: "exp-body" });
    const treeEl = el("div", { class: "tree sunken exp-tree" });
    const infoBar = el("div", { class: "exp-infobar" });
    const listEl = el("div", { class: "listview sunken exp-list" });
    bodyRow.append(treeEl, infoBar, listEl);
    treeEl.style.display = showTree ? "" : "none";
    win.body.append(tbar, addr, bodyRow);

    function paintInfoBar() {
      infoBar.style.display = (webView && !isVirtual(loc)) ? "" : "none";
      if (infoBar.style.display === "none") return;
      infoBar.innerHTML = "";
      const sel = selItems();
      const folderName = locName(loc).split("\\").pop() || locName(loc);
      const head = el("div", { class: "ib-head" }, el("div", { class: "ib-title", text: folderName }));
      infoBar.append(head);
      if (sel.length === 1 && sel[0].node) {
        const it = sel[0];
        const imgData = String(it.node.data || "");
        const preview = el("div", { class: "ib-preview" });
        if (imgData.startsWith("data:image")) {
          const im = new Image(); im.src = imgData;
          im.style.cssText = "max-width:120px;max-height:100px;outline:1px solid #888";
          preview.append(im);
        } else preview.append(Icons.img(it.icon, 32));
        infoBar.append(preview,
          el("div", { class: "ib-name", text: it.name.replace(/\.lnk$/i, "") }),
          el("div", { class: "ib-detail", text: FS.typeName(it.name, it.node) }),
          it.node.t === "f" ? el("div", { class: "ib-detail", text: "Size: " + fmtSize(FS.sizeOf(it.node)) }) : el("div", { class: "ib-detail", text: "" }),
          el("div", { class: "ib-detail", text: "Modified: " + fmtShortDate(it.node.m || Date.now()) }));
        if (imgData.startsWith("data:image")) infoBar.append(el("div", { class: "ib-detail", style: "margin-top:6px;color:#000080;cursor:default", text: "Image Preview", onclick: () => it.open() }));
      } else {
        const items = itemsFor(loc);
        infoBar.append(
          el("div", { class: "ib-detail", style: "margin-top:8px", text: "Selects an item to view its description." }),
          el("div", { class: "ib-detail", style: "margin-top:12px", text: items.length + " object(s)" }),
          el("div", { class: "ib-detail", text: fmtSize(FS.sizeOf(FS.get(loc) || { ch: {}, t: "d" })) }));
        if (FS.norm(loc).toLowerCase() === FS.norm(FS.DOCS + "/My Pictures").toLowerCase())
          infoBar.append(el("div", { class: "ib-detail", style: "margin-top:10px;font-style:italic", text: "This folder shows your pictures as thumbnails." }));
      }
    }

    /* ---------- menus ---------- */
    function selItems() {
      return itemsFor(loc).filter(it => selected.has(it.name));
    }
    function fileMenu() {
      const sel = selItems();
      const one = sel.length === 1 ? sel[0] : null;
      if (loc === "::Recycle") {
        return [
          { label: "Restore", disabled: !sel.length, click: () => { sel.slice().sort((a, b) => b.idx - a.idx).forEach(it => FS.restore(it.idx)); selected.clear(); } },
          "-",
          { label: "Empty Recycle Bin", disabled: !FS.recycle.length, click: () => W98.Desktop.emptyRecycleConfirm() },
          "-",
          { label: "Close", click: () => win.close() }
        ];
      }
      if (/^C:\/My Briefcase$/i.test(String(loc))) {
        return [
          { label: "Update All", bold: true, click: briefcaseSync },
          { label: "Add My Documents Files...", click: briefcaseAdd },
          "-",
          { label: "Delete", disabled: !sel.length, click: doDelete },
          "-",
          { label: "Close", click: () => win.close() }
        ];
      }
      return [
        { label: "Open", bold: !!one, disabled: !sel.length, click: () => sel.forEach(it => it.open()) },
        "-",
        { label: "New", disabled: isVirtual(loc), sub: [
          { label: "Folder", icon: "folder", click: () => newItem("folder") },
          "-",
          { label: "Text Document", icon: "textfile", click: () => newItem("txt") },
          { label: "Bitmap Image", icon: "imagefile", click: () => newItem("bmp") }
        ]},
        "-",
        { label: "Delete", disabled: !sel.length || !sel.every(it => it.path), click: doDelete },
        { label: "Rename", disabled: !one || !one.path, click: () => startRename(one) },
        { label: "Properties", disabled: !one, click: doProps },
        "-",
        { label: "Close", click: () => win.close() }
      ];
    }
    function editMenu() {
      const sel = selItems();
      return [
        { label: "Undo Delete", accel: "Ctrl+Z", disabled: !FS.recycle.length, click: () => {
          FS.restore(FS.recycle.length - 1);
          Sound.play("click");
        }},
        "-",
        { label: "Cut", accel: "Ctrl+X", disabled: !sel.length || !sel.every(it => it.path), click: doCut },
        { label: "Copy", accel: "Ctrl+C", disabled: !sel.length || !sel.every(it => it.path), click: doCopy },
        { label: "Paste", accel: "Ctrl+V", disabled: !W98.fileClipboard || isVirtual(loc), click: doPaste },
        "-",
        { label: "Select All", accel: "Ctrl+A", click: () => { itemsFor(loc).forEach(it => selected.add(it.name)); refresh(); } },
        { label: "Invert Selection", click: () => {
          const all = itemsFor(loc);
          const ns = new Set();
          all.forEach(it => { if (!selected.has(it.name)) ns.add(it.name); });
          selected = ns; refresh();
        }}
      ];
    }
    function viewMenu() {
      return [
        { label: "Status Bar", checked: win.statusbar.style.display !== "none", click: () => {
          win.statusbar.style.display = win.statusbar.style.display === "none" ? "" : "none";
        }},
        { label: "as Web Page", checked: webView, click: () => { webView = !webView; Store.set("expWebView", webView); paintInfoBar(); } },
        { label: "Explorer Bar", sub: [
          { label: "Folders", checked: showTree, click: () => { showTree = !showTree; treeEl.style.display = showTree ? "" : "none"; if (showTree) renderTree(); } }
        ]},
        "-",
        { label: "Large Icons", radio: true, checked: viewMode === "large", click: () => { viewMode = "large"; Store.set("expView", viewMode); refresh(); } },
        { label: "List", radio: true, checked: viewMode === "list", click: () => { viewMode = "list"; Store.set("expView", viewMode); refresh(); } },
        { label: "Details", radio: true, checked: viewMode === "details", click: () => { viewMode = "details"; Store.set("expView", viewMode); refresh(); } },
        "-",
        { label: "Arrange Icons", sub: [
          { label: "by Name", click: () => { sortBy = "name"; sortAsc = true; refresh(); } },
          { label: "by Type", click: () => { sortBy = "type"; sortAsc = true; refresh(); } },
          { label: "by Size", click: () => { sortBy = "size"; sortAsc = true; refresh(); } },
          { label: "by Date", click: () => { sortBy = "mtime"; sortAsc = true; refresh(); } }
        ]},
        "-",
        { label: "Refresh", accel: "F5", click: refresh }
      ];
    }

    /* ---------- actions ---------- */
    function doCut() {
      const paths = selItems().map(it => it.path).filter(Boolean);
      if (paths.length) W98.fileClipboard = { mode: "cut", paths };
    }
    function doCopy() {
      const paths = selItems().map(it => it.path).filter(Boolean);
      if (paths.length) W98.fileClipboard = { mode: "copy", paths };
    }
    function doPaste() {
      const cb = W98.fileClipboard;
      if (!cb || isVirtual(loc)) return;
      for (const p of cb.paths) {
        const ok = cb.mode === "copy" ? FS.copyTo(p, loc) : FS.moveTo(p, loc);
        if (!ok) WM.msgbox({ title: "Error Moving File", icon: "error", text: "Cannot move " + FS.segs(p).pop() + ": The destination folder is the same as the source folder, or is not valid." });
      }
      if (cb.mode === "cut") W98.fileClipboard = null;
      refresh();
    }
    /* ---------- Briefcase: keeps copies in step with My Documents ---------- */
    function briefcaseSync() {
      const BC = "C:/My Briefcase";
      const acts = [];
      FS.list(BC).forEach(({ name, node }) => {
        if (node.t !== "f" || /^About the Briefcase/i.test(name)) return;
        const docPath = FS.DOCS + "/" + name;
        const doc = FS.get(docPath);
        if (!doc) {
          FS.writeFile(docPath, node.data);
          acts.push([name, "Copied to My Documents (it was new)"]);
        } else if (doc.t === "f" && doc.m > node.m + 500) {
          FS.writeFile(BC + "/" + name, doc.data);
          acts.push([name, "Updated in Briefcase (My Documents copy was newer)"]);
        } else if (doc.t === "f" && node.m > doc.m + 500) {
          FS.writeFile(docPath, node.data);
          acts.push([name, "Updated in My Documents (Briefcase copy was newer)"]);
        } else if (doc.t === "f") {
          acts.push([name, "Up to date"]);
        }
      });
      Sound.play("ding");
      const dw = WM.create({ title: "Update My Briefcase", icon: "briefcase", width: 420, height: 0, resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true });
      dw.el.style.height = "auto";
      const body = el("div", { style: "padding:12px 14px" });
      if (!acts.length) body.append(el("div", { text: "The briefcase is empty (or only contains its own instructions).\nCopy some files from My Documents in, take them 'on the road',\nthen update here when you get back." , style: "white-space:pre-line;line-height:1.4" }));
      else {
        body.append(el("div", { text: "The following files were checked against My Documents:", style: "margin-bottom:8px" }));
        const lst = el("div", { class: "sunken", style: "background:#fff;max-height:180px;overflow:auto;padding:4px" });
        acts.forEach(([n, a]) => lst.append(el("div", { style: "display:flex;gap:8px;padding:1px 2px;font-size:11px" },
          Icons.img(FS.iconFor(n, FS.get("C:/My Briefcase/" + n)), 16),
          el("b", { text: n }), el("span", { text: "— " + a, style: "color:#404040" }))));
        body.append(lst);
      }
      const ok = el("button", { class: "btn default", text: "OK", onclick: () => { dw.close(); refresh(); } });
      dw.body.append(body, el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:0 14px 12px" }, ok));
    }
    function briefcaseAdd() {
      Dialogs.filePick({ mode: "open", title: "Add to Briefcase", startDir: FS.DOCS }).then(p => {
        if (!p) return;
        const n = FS.get(p);
        if (!n || n.t !== "f") return;
        const nm = FS.segs(p).pop();
        FS.writeFile("C:/My Briefcase/" + nm, n.data);
        Sound.play("click");
        refresh();
      });
    }

    function doDelete() {
      if (loc === "::Recycle") {
        const sel = selItems();
        if (!sel.length) return;
        WM.msgbox({ title: "Confirm File Delete", icon: "question", text: "Are you sure you want to permanently delete " + (sel.length === 1 ? "'" + sel[0].name + "'" : "these " + sel.length + " items") + "?", buttons: ["Yes", "No"] })
          .then(r => {
            if (r === "Yes") {
              sel.slice().sort((a, b) => b.idx - a.idx).forEach(it => FS.recycle.splice(it.idx, 1));
              FS.save(); W98.bus.emit("recycle");
              selected.clear(); refresh();
            }
          });
        return;
      }
      const paths = selItems().map(it => it.path).filter(Boolean);
      if (paths.length) { W98.Desktop.deleteConfirm(paths); selected.clear(); }
    }
    function doProps() {
      const sel = selItems();
      if (!sel.length) {
        if (!isVirtual(loc)) Dialogs.fileProps(loc);
        return;
      }
      const it = sel[0];
      if (it.path) Dialogs.fileProps(it.path);
      else if (it.kind === "drive" && it.name === "(C:)") driveProps();
      else if (it.kind === "cpl") it.open();
      else if (it.kind === "recycle") WM.msgbox({ title: it.name + " Properties", icon: "info", text: "Origin: " + FS.display(FS.recycle[it.idx].orig) + "\nDeleted: " + fmtShortDate(FS.recycle[it.idx].at) + "\nSize: " + fmtSize(FS.sizeOf(FS.recycle[it.idx].node)) });
      else WM.msgbox({ title: it.name + " Properties", icon: "info", text: "Type: " + (it.type || "System item") });
    }
    function driveProps() {
      const used = FS.sizeOf(FS.get("C:"));
      const total = 4294967296;
      const dw = WM.create({
        title: "(C:) Properties", icon: "drivec", width: 340, height: 0,
        resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
      });
      dw.el.style.height = "auto";
      /* the classic usage pie */
      const pie = el("canvas", { width: 120, height: 120, style: "display:block;margin:8px auto" });
      {
        const px2 = pie.getContext("2d");
        const frac = Math.max(0.02, Math.min(0.98, used / total * 400));
        px2.fillStyle = "#000080";
        px2.beginPath(); px2.moveTo(60, 60); px2.arc(60, 60, 52, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); px2.closePath(); px2.fill();
        px2.fillStyle = "#ff00ff";
        px2.beginPath(); px2.moveTo(60, 60); px2.arc(60, 60, 52, -Math.PI / 2 + frac * Math.PI * 2, Math.PI * 1.5); px2.closePath(); px2.fill();
        px2.strokeStyle = "#404040"; px2.lineWidth = 1.5;
        px2.beginPath(); px2.arc(60, 60, 52, 0, 7); px2.stroke();
      }
      const pct = Math.max(2, Math.min(98, used / total * 100 * 400));
      dw.body.append(
        el("div", { style: "padding:14px 18px 4px" },
          el("div", { style: "display:grid;grid-template-columns:auto 1fr;gap:6px 12px" },
            el("span", { text: "Label:" }), el("span", { text: "WIN98" }),
            el("span", { text: "Type:" }), el("span", { text: "Local Disk" }),
            el("span", { text: "File system:" }), el("span", { text: "FAT32" }),
            pie, el("span", { text: "Used space:" }), el("span", { text: used.toLocaleString() + " bytes" }),
            el("span", { text: "Free space:" }), el("span", { text: (total - used).toLocaleString() + " bytes" }),
            el("span", { text: "Capacity:" }), el("span", { text: "4.00 GB" })
          ),
          el("div", { class: "progress", style: "margin:12px 0" }, el("div", { class: "bar", style: `width:${pct}%` }))
        ),
        (() => {
          const r = el("div", { class: "msgbox-btns" });
          const ok = el("button", { class: "btn default", text: "OK" });
          ok.addEventListener("click", () => dw.close());
          r.append(ok); return r;
        })()
      );
    }
    function newItem(kind) {
      let name;
      if (kind === "folder") { name = FS.uniqueName(loc, "New Folder", ""); FS.mkdir(loc + "/" + name); }
      else if (kind === "txt") { name = FS.uniqueName(loc, "New Text Document", ".txt"); FS.writeFile(loc + "/" + name, ""); }
      else { name = FS.uniqueName(loc, "New Bitmap Image", ".bmp"); FS.writeFile(loc + "/" + name, ""); }
      refresh();
      const it = itemsFor(loc).find(i => i.name === name);
      if (it) setTimeout(() => startRename(it), 50);
    }
    function startRename(it) {
      if (!it.path) return;
      const nodeEl = $$("[data-name]", listEl).find(x => x.dataset.name === it.name);
      if (!nodeEl) return;
      const nm = $(".nm", nodeEl);
      const input = el("input", { type: "text", value: it.name, style: "font-size:11px;width:90px;border:1px solid #000" });
      nm.textContent = ""; nm.append(input);
      input.focus();
      const dot = it.name.lastIndexOf(".");
      input.setSelectionRange(0, dot > 0 ? dot : it.name.length);
      let done = false;
      const finish = (commit) => {
        if (done) return; done = true;
        if (commit && input.value.trim() && input.value !== it.name) {
          const err = FS.rename(it.path, input.value.trim());
          if (err) WM.msgbox({ title: "Error Renaming File", icon: "error", text: err });
        }
        refresh();
      };
      input.addEventListener("keydown", (ev) => {
        ev.stopPropagation();
        if (ev.key === "Enter") finish(true);
        if (ev.key === "Escape") finish(false);
      });
      input.addEventListener("blur", () => finish(true));
      input.addEventListener("mousedown", ev => ev.stopPropagation());
      input.addEventListener("dblclick", ev => ev.stopPropagation());
    }

    /* ---------- navigation ---------- */
    function canUp() {
      if (loc === "::MyComputer") return false;
      if (isVirtual(loc)) return true;
      return true;
    }
    function goUp() {
      if (loc === "::MyComputer") return;
      if (isVirtual(loc)) { navigate("::MyComputer"); return; }
      const s = FS.segs(loc);
      if (s[0] === "NET:" && s.length <= 2) { navigate("::Network"); return; }
      if (s.length <= 1) navigate("::MyComputer");
      else navigate(s.slice(0, -1).join("/"));
    }
    function goBack() {
      if (!history.length) return;
      future.push(loc);
      loc = history.pop();
      refresh(true);
    }
    function goFwd() {
      if (!future.length) return;
      history.push(loc);
      loc = future.pop();
      refresh(true);
    }
    function navigate(l) {
      if (/^NET:\/Moms-office\/PRIVATE$/i.test(String(l))) {
        Dialogs.prompt({ title: "Enter Network Password", icon: "netpc", password: true, label: "\\\\Moms-office\\PRIVATE is password protected.\n\nPassword:", value: "" }).then(pw => {
          if (pw == null) return;
          Sound.play("error");
          WM.msgbox({ title: "Access Denied", icon: "error",
            text: pw.toLowerCase() === "password"
              ? "Incorrect password.\n\n(You tried 'password'. Mom is disappointed but not surprised.)"
              : "Incorrect password.\n\nThe folder is called PRIVATE. It means it." });
        });
        return;
      }
      history.push(loc);
      future.length = 0;
      loc = l;
      selected.clear();
      refresh(true);
    }
    win.navigate = navigate;

    /* ---------- rendering ---------- */
    function sortItems(items) {
      const arr = [...items];
      arr.sort((a, b) => {
        const dirA = a.kind === "folder" || a.kind === "drive" || a.kind === "virtual";
        const dirB = b.kind === "folder" || b.kind === "drive" || b.kind === "virtual";
        if (dirA !== dirB) return dirA ? -1 : 1;
        let r = 0;
        if (sortBy === "size") r = (a.size || 0) - (b.size || 0);
        else if (sortBy === "mtime") r = (a.mtime || 0) - (b.mtime || 0);
        else if (sortBy === "type") r = String(a.type || "").localeCompare(String(b.type || ""));
        if (!r) r = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        return sortAsc ? r : -r;
      });
      return arr;
    }

    function bindItem(elm, it) {
      elm.dataset.name = it.name;
      /* drag & drop: left = move onto folders; right = choose Move/Copy/Shortcut */
      if (it.path) elm.addEventListener("mousedown", (e) => {
        if (e.button !== 0 && e.button !== 2) return;
        const rightDrag = e.button === 2;
        const sx = e.clientX, sy = e.clientY;
        let ghost = null, dropEl = null, dropDir = null;
        const clearHL = () => { if (dropEl) { dropEl.style.outline = ""; dropEl = null; dropDir = null; } };
        const mm = (ev) => {
          if (!ghost) {
            if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 5) return;
            ghost = el("div", { style: "position:fixed;z-index:9800;pointer-events:none;opacity:.65;display:flex;align-items:center;gap:4px" });
            const n = selItems().filter(x => x.path).length || 1;
            ghost.append(Icons.img(it.icon, 16),
              el("span", { text: n > 1 ? n + " items" : it.name, style: "background:var(--hl);color:#fff;padding:0 3px" }));
            document.body.append(ghost);
          }
          ghost.style.left = (ev.clientX + 10) + "px";
          ghost.style.top = (ev.clientY + 2) + "px";
          clearHL();
          const t = document.elementFromPoint(ev.clientX, ev.clientY);
          if (!t || !t.closest) return;
          const itemEl = t.closest("[data-name]");
          if (itemEl && itemEl.dataset.name !== it.name && listEl.contains(itemEl)) {
            const target = itemsFor(loc).find(x => x.name === itemEl.dataset.name);
            if (target && target.kind === "folder") {
              dropEl = itemEl; dropDir = target.path;
              itemEl.style.outline = "1px dotted var(--hl)";
            }
          }
          const treeRow = t.closest(".tree-row");
          if (treeRow && treeRow._dropdir) {
            dropEl = treeRow; dropDir = treeRow._dropdir;
            treeRow.style.outline = "1px dotted var(--hl)";
          }
        };
        const mu = (ev) => {
          window.removeEventListener("mousemove", mm);
          window.removeEventListener("mouseup", mu);
          const hadGhost = !!ghost;
          if (ghost) ghost.remove();
          const targetDir = dropDir;
          clearHL();
          if (hadGhost && rightDrag) {
            /* swallow the contextmenu the browser fires right after a right-drag,
               so the drop menu isn't instantly replaced by the item menu */
            const trap = (ce) => { ce.preventDefault(); ce.stopPropagation(); };
            document.addEventListener("contextmenu", trap, { capture: true, once: true });
            setTimeout(() => document.removeEventListener("contextmenu", trap, { capture: true }), 300);
          }
          if (!hadGhost || !targetDir) return;
          const paths = selItems().map(x => x.path).filter(Boolean);
          if (!paths.length) return;
          const doMove = () => { let n = 0; paths.forEach(p => { if (FS.moveTo(p, targetDir)) n++; }); if (n) { selected.clear(); Sound.play("click"); refresh(); } };
          const doCopy = () => { let n = 0; paths.forEach(p => { if (FS.copyTo(p, targetDir)) n++; }); if (n) { Sound.play("click"); refresh(); } };
          const doShortcut = () => {
            paths.forEach(p => {
              const nm = FS.uniqueName(targetDir, "Shortcut to " + FS.segs(p).pop().replace(/\.[^.]*$/, ""), ".lnk");
              FS.writeFile(targetDir + "/" + nm, "lnk:" + p);
            });
            Sound.play("click"); refresh();
          };
          if (rightDrag) {
            Menu.popup(ev.clientX, ev.clientY, [
              { label: "Move Here", bold: true, click: doMove },
              { label: "Copy Here", click: doCopy },
              { label: "Create Shortcut(s) Here", click: doShortcut },
              "-",
              { label: "Cancel", click: () => {} }
            ]);
          } else doMove();
        };
        window.addEventListener("mousemove", mm);
        window.addEventListener("mouseup", mu);
        if (rightDrag) e.preventDefault();
      });
      elm.addEventListener("mousedown", (e) => {
        if (e.ctrlKey || e.metaKey) {
          if (selected.has(it.name)) selected.delete(it.name); else selected.add(it.name);
        } else if (!selected.has(it.name)) {
          selected.clear(); selected.add(it.name);
        } else if (e.button === 0) {
          selected.clear(); selected.add(it.name);
        }
        paintSelection();
        updateStatus();
        paintInfoBar();
        e.stopPropagation();
      });
      elm.addEventListener("dblclick", () => it.open());
      elm.addEventListener("contextmenu", (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!selected.has(it.name)) { selected.clear(); selected.add(it.name); paintSelection(); }
        const items = [];
        if (loc === "::Recycle") {
          items.push({ label: "Restore", click: () => { selItems().slice().sort((a, b) => b.idx - a.idx).forEach(x => FS.restore(x.idx)); selected.clear(); } });
          items.push("-");
          items.push({ label: "Delete", click: doDelete });
        } else {
          items.push({ label: "Open", bold: true, click: () => it.open() });
          if (it.path && it.kind === "file") {
            items.push({ label: "Export to Mac...", click: () => W98.FileIO.exportFile(it.path) });
          }
          if (it.path) {
            items.push(
              { label: "Send To", sub: [
                { label: "3½ Floppy (A:)", icon: "floppy", click: () =>
                  WM.msgbox({ title: "Error Copying File", icon: "error", text: "The device is not ready.\n(Still no floppy disk. Still 2026.)" }) },
                { label: "Desktop as Shortcut", icon: "display", click: () => {
                  selItems().filter(x => x.path).forEach(x => {
                    const nm = FS.uniqueName(FS.DESKTOP, "Shortcut to " + x.name.replace(/\.[^.]*$/, ""), ".lnk");
                    FS.writeFile(FS.DESKTOP + "/" + nm, "lnk:" + x.path);
                  });
                  Sound.play("click");
                }},
                { label: "Mail Recipient", icon: "mail", click: () => {
                  const names = selItems().filter(x => x.path).map(x => x.name).join(", ");
                  W98.launch("mail", { compose: {
                    subj: "Sending you: " + names,
                    body: "\n\n<< Attached: " + names + " >>\n(attachment lost in the mail, as was customary in 1998)"
                  }});
                }},
                { label: "My Documents", icon: "mydocs", click: () => {
                  selItems().filter(x => x.path).forEach(x => FS.copyTo(x.path, FS.DOCS));
                  Sound.play("click");
                }}
              ]},
              "-",
              { label: "Cut", click: doCut },
              { label: "Copy", click: doCopy },
              "-",
              { label: "Create Shortcut", click: () => {
                selItems().filter(x => x.path).forEach(x => {
                  const nm = FS.uniqueName(loc, "Shortcut to " + x.name.replace(/\.[^.]*$/, ""), ".lnk");
                  FS.writeFile(loc + "/" + nm, "lnk:" + x.path);
                });
              }},
              { label: "Delete", click: doDelete },
              { label: "Rename", click: () => startRename(it) });
          }
        }
        items.push("-", { label: "Properties", click: doProps });
        Menu.popup(e.clientX, e.clientY, items);
      });
    }

    function paintSelection() {
      $$("[data-name]", listEl).forEach(elm => {
        elm.classList.toggle("sel", selected.has(elm.dataset.name));
      });
    }

    function refresh(hard) {
      win._loc = loc;
      const items = sortItems(itemsFor(loc));
      listEl.innerHTML = "";
      listEl.className = "listview sunken exp-list" + (viewMode === "large" ? " lv-icons" : viewMode === "details" ? " lv-details" : "");
      if (viewMode === "large") {
        for (const it of items) {
          const d = el("div", { class: "lv-bigitem" });
          /* pictures show as live thumbnails, like the My Pictures folder should */
          const imgData = it.node && it.node.t === "f" ? String(it.node.data || "") : "";
          if (imgData.startsWith("data:image")) {
            const th = new Image();
            th.src = imgData;
            th.style.cssText = "width:40px;height:32px;object-fit:cover;outline:1px solid var(--shadow);background:#fff";
            d.append(th, el("br"), el("span", { class: "nm", text: it.name.replace(/\.lnk$/i, "") }));
          } else {
            d.append(Icons.img(it.icon, 32), el("br"), el("span", { class: "nm", text: it.name.replace(/\.lnk$/i, "") }));
          }
          bindItem(d, it);
          listEl.append(d);
        }
      } else if (viewMode === "list") {
        for (const it of items) {
          const d = el("div", { class: "lv-item" });
          d.append(Icons.img(it.icon, 16), el("span", { class: "nm", text: it.name.replace(/\.lnk$/i, "") }));
          bindItem(d, it);
          listEl.append(d);
        }
      } else {
        const table = el("table");
        const thead = el("tr");
        const cols = loc === "::Recycle"
          ? [["Name", "name"], ["Original Location", "orig"], ["Date Deleted", "mtime"], ["Type", "type"], ["Size", "size"]]
          : [["Name", "name"], ["Size", "size"], ["Type", "type"], ["Modified", "mtime"]];
        for (const [label, key] of cols) {
          const th = el("th", { text: label });
          th.addEventListener("click", () => {
            if (sortBy === key) sortAsc = !sortAsc; else { sortBy = key; sortAsc = true; }
            refresh();
          });
          thead.append(th);
        }
        table.append(thead);
        for (const it of items) {
          const tr = el("tr");
          const nameTd = el("td");
          nameTd.append(Icons.img(it.icon, 16), el("span", { class: "nm", text: it.name.replace(/\.lnk$/i, "") }));
          tr.append(nameTd);
          if (loc === "::Recycle") {
            tr.append(
              el("td", { text: FS.display(FS.recycle[it.idx].orig) }),
              el("td", { text: fmtShortDate(it.mtime) }),
              el("td", { text: it.type }),
              el("td", { text: fmtSize(it.size) })
            );
          } else {
            tr.append(
              el("td", { text: it.size != null ? fmtSize(it.size) : "" }),
              el("td", { text: it.type || "" }),
              el("td", { text: it.mtime ? fmtShortDate(it.mtime) : "" })
            );
          }
          bindItem(tr, it);
          table.append(tr);
        }
        listEl.append(table);
      }
      /* empty-area context menu */
      paintSelection();
      updateStatus();
      if (hard) {
        win.setTitle(loc === "::Recycle" ? "Recycle Bin" : locName(loc).split("\\").pop() || locName(loc));
        win.setIcon(locIcon(loc));
        addrInput.value = locName(loc);
        addrIcon.src = Icons.get(locIcon(loc), 16);
        if (showTree) renderTree();
      }
      backBtn.disabled = !history.length;
      fwdBtn.disabled = !future.length;
      upBtn.disabled = loc === "::MyComputer";
      pasteBtn.disabled = !W98.fileClipboard || isVirtual(loc);
      paintInfoBar();
    }

    function updateStatus() {
      const items = itemsFor(loc);
      const sel = selItems();
      if (sel.length) {
        const sz = sel.reduce((a, it) => a + (it.size || 0), 0);
        win.setStatus(0, sel.length + " object(s) selected");
        win.setStatus(1, sz ? fmtSize(sz) : "");
      } else {
        win.setStatus(0, items.length + " object(s)");
        win.setStatus(1, loc === "::Recycle" ? "" : (isVirtual(loc) ? "" : "(plus hidden nothing)"));
        win.setStatus(1, "");
      }
    }

    listEl.addEventListener("mousedown", (e) => {
      if (e.target === listEl) { selected.clear(); paintSelection(); updateStatus(); }
    });
    listEl.addEventListener("contextmenu", (e) => {
      if (e.target !== listEl) return;
      e.preventDefault();
      Menu.popup(e.clientX, e.clientY, [
        { label: "View", sub: [
          { label: "Large Icons", radio: true, checked: viewMode === "large", click: () => { viewMode = "large"; refresh(); } },
          { label: "List", radio: true, checked: viewMode === "list", click: () => { viewMode = "list"; refresh(); } },
          { label: "Details", radio: true, checked: viewMode === "details", click: () => { viewMode = "details"; refresh(); } }
        ]},
        "-",
        { label: "Refresh", click: refresh },
        "-",
        { label: "Paste", disabled: !W98.fileClipboard || isVirtual(loc), click: doPaste },
        "-",
        { label: "New", disabled: isVirtual(loc), sub: [
          { label: "Folder", icon: "folder", click: () => newItem("folder") },
          "-",
          { label: "Text Document", icon: "textfile", click: () => newItem("txt") },
          { label: "Bitmap Image", icon: "imagefile", click: () => newItem("bmp") }
        ]},
        "-",
        { label: "Properties", disabled: isVirtual(loc), click: () => { if (!isVirtual(loc)) Dialogs.fileProps(loc); } }
      ]);
    });

    /* keyboard */
    win.el.addEventListener("keydown", (e) => {
      if (e.target === addrInput || e.target.tagName === "INPUT") return;
      if (e.key === "Delete") { doDelete(); }
      else if (e.key === "F5") { e.preventDefault(); refresh(); }
      else if (e.key === "F2") { const s = selItems(); if (s.length === 1) startRename(s[0]); }
      else if (e.key === "Backspace") goUp();
      else if (e.key === "Enter") { selItems().forEach(it => it.open()); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "a") { e.preventDefault(); itemsFor(loc).forEach(it => selected.add(it.name)); paintSelection(); updateStatus(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "c") doCopy();
      else if ((e.ctrlKey || e.metaKey) && e.key === "x") doCut();
      else if ((e.ctrlKey || e.metaKey) && e.key === "v") doPaste();
    });

    /* ---------- folder tree ---------- */
    const expanded = new Set(["::MyComputer", "C:"]);
    function renderTree() {
      treeEl.innerHTML = "";
      function nodeRow(label, iconName, key, kids, onOpen, depth) {
        const wrap = el("div", { class: "tree-node" });
        const row = el("div", { class: "tree-row" });
        // real FS folders accept drops
        const clean = String(key).replace(/#top$/, "");
        if (/^[A-Za-z]:($|\/)/.test(clean)) row._dropdir = clean;
        row.style.paddingLeft = (depth * 14) + "px";
        const tg = el("div", { class: "tree-tg" });
        if (kids) {
          const box = el("div", { class: "box", text: expanded.has(key) ? "-" : "+" });
          tg.append(box);
          box.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            if (expanded.has(key)) expanded.delete(key); else expanded.add(key);
            renderTree();
          });
        }
        row.append(tg, Icons.img(iconName, 16), el("span", { class: "tlabel", text: label }));
        if (key === loc) row.classList.add("sel");
        row.addEventListener("mousedown", () => { if (onOpen) onOpen(); });
        wrap.append(row);
        treeEl.append(wrap);
        if (kids && expanded.has(key)) kids(depth + 1);
      }
      nodeRow("Desktop", "display", "::Desktop", (d1) => {
        nodeRow("My Computer", "mycomputer", "::MyComputer", (d2) => {
          nodeRow("3½ Floppy (A:)", "floppy", "A:", null, () => WM.msgbox({ title: "A:\\ is not accessible", icon: "error", text: "The device is not ready." }), d2);
          function dirTree(path, depth) {
            for (const { name, node } of FS.list(path)) {
              if (node.t !== "d") continue;
              const p = path + "/" + name;
              const hasSub = FS.list(p).some(x => x.node.t === "d");
              nodeRow(name, loc === p ? "folderopen" : "folder", p, hasSub ? ((dd) => dirTree(p, dd)) : null, () => navigate(p), depth);
            }
          }
          nodeRow("(C:)", "drivec", "C:", (d3) => dirTree("C:", d3), () => navigate("C:"), d2);
          nodeRow("Control Panel", "settings", "::ControlPanel", null, () => navigate("::ControlPanel"), d2);
        }, d1);
        nodeRow("My Documents", "mydocs", FS.DOCS + "#top", null, () => navigate(FS.DOCS), d1);
        nodeRow("Recycle Bin", FS.recycle.length ? "recyclefull" : "recycle", "::Recycle", null, () => navigate("::Recycle"), d1);
      }, 0);
    }
    // keep the visually-obsolete "::Desktop" node expanded always
    expanded.add("::Desktop");

    W98.bus.on("fs", (dir) => {
      if (win.closed) return;
      if (!isVirtual(loc) && FS.norm(dir).toLowerCase() === FS.norm(loc).toLowerCase()) refresh();
      if (showTree) renderTree();
    });
    W98.bus.on("recycle", () => {
      if (win.closed) return;
      if (loc === "::Recycle") refresh(true);
    });

    refresh(true);
    return win;
  }
};

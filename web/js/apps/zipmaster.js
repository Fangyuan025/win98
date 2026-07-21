/* zipmaster.js — ZipMaster 7.1: the archive utility everyone had and nobody bought.
   Archives are real: "zip:" + JSON payload in the VFS, extract/add both work. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  const pack = (obj) => "zip:" + JSON.stringify(obj);
  const unpack = (data) => {
    try { return JSON.parse(String(data).slice(4)); } catch (e) { return null; }
  };

  W98.Apps.zipmaster = {
    name: "ZipMaster 7.1", icon: "zipmaster",
    launch(pathArg) {
      let archPath = typeof pathArg === "string" ? pathArg : null;
      let entries = {};   /* name -> data */
      if (archPath) {
        const n = FS.get(archPath);
        if (n && n.t === "f" && String(n.data).startsWith("zip:")) entries = unpack(n.data) || {};
        else archPath = null;
      }

      const win = WM.create({
        title: title(), icon: "zipmaster",
        width: 500, height: 340, minWidth: 380, minHeight: 240,
        statusbar: [{ text: "" }, { text: "Evaluation copy" }],
        menus: [
          { label: "File", items: () => [
            { label: "New Archive...", click: newArchive },
            { label: "Open Archive...", click: openArchive },
            "-",
            { label: "Exit", click: () => win.close() }
          ]},
          { label: "Actions", items: () => [
            { label: "Add Files...", disabled: !archPath, click: addFiles },
            { label: "Extract All...", disabled: !archPath || !Object.keys(entries).length, click: extractAll },
            { label: "Delete Selected", disabled: !selName, click: delSel }
          ]},
          { label: "Help", items: () => [
            { label: "Register...", click: registerNag },
            { label: "About ZipMaster", click: () => Dialogs.about("ZipMaster 7.1", "zipmaster", ["Evaluation version. Day " + days() + " of a 21-day trial.", "The trial has been going since 1996."]) }
          ]}
        ]
      });
      function title() { return (archPath ? FS.segs(archPath).pop() + " - " : "") + "ZipMaster 7.1 (Unregistered)"; }
      function days() { return Store.get("zipDays", 743) + 0; }

      /* toolbar */
      const tbar = el("div", { class: "toolbar" });
      const mkT = (label, fn) => { const b = el("button", { class: "tbtn", text: label }); b.addEventListener("click", fn); tbar.append(b); return b; };
      mkT("New", newArchive); mkT("Open", openArchive); mkT("Add", addFiles); mkT("Extract", extractAll);
      const list = el("div", { class: "listview sunken", style: "flex:1;overflow:auto" });
      const head = el("div", { style: "flex:none;display:flex;font-weight:700;font-size:11px;padding:2px 6px;border-bottom:1px solid var(--shadow)" },
        el("span", { style: "flex:2", text: "Name" }), el("span", { style: "flex:1", text: "Size" }), el("span", { style: "flex:1", text: "Packed" }), el("span", { style: "flex:1", text: "Ratio" }));
      win.body.append(tbar, head, list);
      win.body.style.padding = "3px";

      let selName = null;
      function paint() {
        win.setTitle(title());
        list.innerHTML = "";
        const names = Object.keys(entries).sort();
        if (!archPath) {
          list.append(el("div", { style: "padding:24px;text-align:center;color:#808080", text: "No archive open.\nFile > New Archive, or double-click a .zip file." }));
        } else if (!names.length) {
          list.append(el("div", { style: "padding:24px;text-align:center;color:#808080", text: "The archive is empty. Actions > Add Files." }));
        }
        names.forEach(nm => {
          const sz = String(entries[nm] || "").length;
          const packed = Math.max(1, Math.round(sz * 0.62));
          const row = el("div", { class: "lv-item" + (selName === nm ? " sel" : "") },
            Icons.img(FS.iconFor(nm, { t: "f", data: entries[nm] }), 16),
            el("span", { style: "flex:2;overflow:hidden;text-overflow:ellipsis", text: nm }),
            el("span", { style: "flex:1", text: fmtSize(sz) }),
            el("span", { style: "flex:1", text: fmtSize(packed) }),
            el("span", { style: "flex:1", text: sz ? Math.round((1 - packed / sz) * 100) + "%" : "0%" }));
          row.addEventListener("mousedown", () => { selName = nm; paint(); });
          row.addEventListener("dblclick", () => extractOne(nm));
          list.append(row);
        });
        win.setStatus(0, archPath ? names.length + " file(s)" : "Ready");
      }

      function saveArch() {
        if (archPath) FS.writeFile(archPath, pack(entries));
      }
      async function newArchive() {
        const p = await Dialogs.filePick({ mode: "save", title: "New Archive", ext: [".zip"], typeName: "ZipMaster Archive (*.zip)", startDir: FS.DOCS, defaultName: "Archive.zip" });
        if (!p) return;
        archPath = p; entries = {};
        FS.writeFile(archPath, pack(entries));
        selName = null; paint();
      }
      async function openArchive() {
        const p = await Dialogs.filePick({ mode: "open", title: "Open Archive", ext: [".zip"], typeName: "ZipMaster Archive (*.zip)", startDir: FS.DOCS });
        if (!p) return;
        const n = FS.get(p);
        const u = n && n.t === "f" ? unpack(n.data) : null;
        if (u == null) { WM.msgbox({ title: "ZipMaster", icon: "error", text: "This file is not a ZipMaster archive.\n(Or it is corrupted. Or it is from PKZip and we are rivals.)" }); return; }
        archPath = p; entries = u; selName = null; paint();
      }
      async function addFiles() {
        if (!archPath) { newArchive(); return; }
        const p = await Dialogs.filePick({ mode: "open", title: "Add File to Archive", startDir: FS.DOCS });
        if (!p) return;
        const n = FS.get(p);
        if (!n || n.t !== "f") return;
        entries[FS.segs(p).pop()] = n.data;
        saveArch();
        Sound.play("click");
        paint();
      }
      function extractOne(nm) {
        const dir = FS.DOCS;
        const out = FS.uniqueName(dir, nm.replace(/\.[^.]*$/, ""), (nm.match(/\.[^.]*$/) || [""])[0]);
        FS.writeFile(dir + "/" + out, entries[nm]);
        win.setStatus(0, "Extracted " + nm + " to My Documents" + (out !== nm ? " as " + out : ""));
        Sound.play("ding");
      }
      function extractAll() {
        const names = Object.keys(entries);
        if (!names.length) return;
        let i = 0;
        const dw = WM.create({ title: "Extracting...", icon: "zipmaster", width: 320, height: 0, resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true });
        dw.el.style.height = "auto";
        const bar = el("div", { class: "progress", style: "margin:6px 0" }, el("div", { class: "bar", style: "width:0%" }));
        const lbl = el("div", { text: "" });
        dw.body.append(el("div", { style: "padding:12px 16px" }, lbl, bar));
        const iv = setInterval(() => {
          if (i >= names.length) {
            clearInterval(iv); dw.close(true);
            Sound.play("tada");
            WM.msgbox({ title: "ZipMaster", icon: "info", text: names.length + " file(s) extracted to My Documents." });
            return;
          }
          const nm = names[i++];
          lbl.textContent = "Extracting " + nm + "...";
          $(".bar", bar).style.width = Math.round(i / names.length * 100) + "%";
          extractOne(nm);
        }, 160);
      }
      function delSel() {
        if (!selName) return;
        delete entries[selName];
        selName = null;
        saveArch(); paint();
      }
      function registerNag() {
        Dialogs.prompt({ title: "Register ZipMaster", icon: "zipmaster", label: "Enter your registration code:" }).then(code => {
          if (code == null) return;
          Sound.play("error");
          WM.msgbox({ title: "Registration", icon: "warning",
            text: "Invalid registration code.\n\nTo purchase ZipMaster, mail a check for $29 to a P.O. box\nin a state you have never visited. Or click 'Later' forever,\nlike everyone else since 1996." });
        });
      }

      /* the beloved nag screen */
      setTimeout(() => {
        if (win.closed) return;
        Store.set("zipDays", days() + 1);
        WM.msgbox({
          title: "ZipMaster 7.1 (Unregistered)", icon: "zipmaster",
          text: "Thank you for evaluating ZipMaster!\n\nThis is day " + days() + " of your 21-day trial.\nPlease consider registering.",
          buttons: ["Register...", "Later"]
        }).then(r => { if (r === "Register...") registerNag(); });
      }, 400);

      paint();
      return win;
    }
  };
})();

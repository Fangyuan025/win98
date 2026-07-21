/* notepad.js */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.notepad = {
  name: "Notepad", icon: "notepad",
  launch(path) {
    let curPath = null;
    let dirty = false;
    let lastFind = "";

    const ta = el("textarea", { class: "notepad-ta", spellcheck: "false" });
    if (Store.get("notepadWrap", false)) ta.classList.add("wrap");

    function baseName() { return curPath ? FS.segs(curPath).pop() : "Untitled"; }
    function syncTitle() { win.setTitle(baseName() + " - Notepad"); }
    ta.addEventListener("input", () => { if (!dirty) { dirty = true; } });

    async function confirmSave() {
      if (!dirty) return true;
      const r = await WM.msgbox({
        title: "Notepad", icon: "warning",
        text: "The text in the " + (curPath ? FS.display(curPath) : "Untitled") + " file has changed.\n\nDo you want to save the changes?",
        buttons: ["Yes", "No", "Cancel"], defaultBtn: 0, cancelValue: "Cancel"
      });
      if (r === "Cancel") return false;
      if (r === "Yes") return await doSave();
      return true;
    }
    async function doSave() {
      if (!curPath) return doSaveAs();
      FS.writeFile(curPath, ta.value);
      W98.addRecent(curPath);
      dirty = false;
      return true;
    }
    async function doSaveAs() {
      const p = await Dialogs.filePick({
        mode: "save", title: "Save As", ext: ".txt",
        typeName: "Text Documents (*.txt)", startDir: curPath ? FS.segs(curPath).slice(0, -1).join("/") : FS.DOCS,
        defaultName: baseName() === "Untitled" ? "Untitled.txt" : baseName()
      });
      if (!p) return false;
      curPath = p;
      FS.writeFile(curPath, ta.value);
      W98.addRecent(curPath);
      dirty = false;
      syncTitle();
      return true;
    }
    async function doNew() {
      if (!(await confirmSave())) return;
      ta.value = ""; curPath = null; dirty = false; syncTitle();
    }
    async function doOpen() {
      if (!(await confirmSave())) return;
      const p = await Dialogs.filePick({
        mode: "open", title: "Open", ext: [".txt", ".bat", ".ini", ".sys", ".log", ".htm", ".html"],
        typeName: "Text Documents (*.txt)", startDir: FS.DOCS
      });
      if (!p) return;
      loadFile(p);
    }
    function loadFile(p) {
      const data = FS.readFile(p);
      ta.value = data == null ? "" : String(data).replace(/\r\n/g, "\n");
      curPath = p; dirty = false; syncTitle();
      W98.addRecent(p);
    }

    function findNext(silent) {
      if (!lastFind) return;
      const hay = ta.value.toLowerCase();
      const start = ta.selectionEnd || 0;
      let idx = hay.indexOf(lastFind.toLowerCase(), start);
      if (idx < 0) idx = hay.indexOf(lastFind.toLowerCase(), 0);
      if (idx < 0) {
        WM.msgbox({ title: "Notepad", icon: "info", text: "Cannot find \"" + lastFind + "\"" });
        return;
      }
      ta.focus();
      ta.setSelectionRange(idx, idx + lastFind.length);
    }
    function findDialog() {
      const dw = WM.create({
        title: "Find", icon: "notepad", width: 350, height: 0,
        resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
      });
      dw.el.style.height = "auto";
      const inp = el("input", { type: "text", class: "field", style: "flex:1", value: lastFind });
      const row = el("div", { style: "display:flex;gap:8px;align-items:center;padding:12px" },
        el("span", { text: "Find what:" }), inp);
      const btns = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:0 12px 12px" });
      const fb = el("button", { class: "btn default", text: "Find Next" });
      const cb = el("button", { class: "btn", text: "Cancel" });
      fb.addEventListener("click", () => { lastFind = inp.value; if (lastFind) findNext(); });
      cb.addEventListener("click", () => dw.close());
      inp.addEventListener("keydown", e => { if (e.key === "Enter") fb.click(); });
      btns.append(fb, cb);
      dw.body.append(row, btns);
      setTimeout(() => inp.focus(), 30);
    }

    function insertTimeDate() {
      const d = new Date();
      const s = fmtTime(d) + " " + (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
      const st = ta.selectionStart;
      ta.setRangeText(s, ta.selectionStart, ta.selectionEnd, "end");
      dirty = true;
      ta.focus();
    }

    function replaceDialog() {
      const dw = WM.create({
        title: "Replace", icon: "notepad", width: 370, height: 0,
        resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
      });
      dw.el.style.height = "auto";
      const fInp = el("input", { type: "text", class: "field", style: "flex:1", value: lastFind });
      const rInp = el("input", { type: "text", class: "field", style: "flex:1" });
      const grid = el("div", { style: "display:grid;grid-template-columns:auto 1fr;gap:6px 8px;padding:12px 14px 4px;align-items:center" },
        el("span", { text: "Find what:" }), fInp,
        el("span", { text: "Replace with:" }), rInp);
      const btns = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:6px 14px 12px" });
      const doOne = () => {
        const f = fInp.value;
        if (!f) return;
        lastFind = f;
        const hay = ta.value.toLowerCase();
        let idx = hay.indexOf(f.toLowerCase(), ta.selectionEnd);
        if (idx < 0) idx = hay.indexOf(f.toLowerCase(), 0);
        if (idx < 0) { WM.msgbox({ title: "Notepad", icon: "info", text: "Cannot find \"" + f + "\"" }); return; }
        ta.setRangeText(rInp.value, idx, idx + f.length, "end");
        dirty = true;
        ta.focus();
        updateLnCol();
      };
      const doAll = () => {
        const f = fInp.value;
        if (!f) return;
        lastFind = f;
        let count = 0;
        const re = new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        ta.value = ta.value.replace(re, () => { count++; return rInp.value; });
        dirty = true;
        updateLnCol();
        WM.msgbox({ title: "Notepad", icon: "info", text: count + " occurrence(s) replaced." });
      };
      btns.append(
        el("button", { class: "btn default", text: "Replace", onclick: doOne }),
        el("button", { class: "btn", text: "Replace All", onclick: doAll }),
        el("button", { class: "btn", text: "Close", onclick: () => dw.close(true) }));
      [fInp, rInp].forEach(i => i.addEventListener("keydown", e => e.stopPropagation()));
      dw.body.append(grid, btns);
      setTimeout(() => fInp.focus(), 60);
    }

    function updateLnCol() {
      if (!win || !win.setStatus) return;
      const pos = ta.selectionStart || 0;
      const before = ta.value.slice(0, pos);
      const ln = (before.match(/\n/g) || []).length + 1;
      const col = pos - before.lastIndexOf("\n");
      win.setStatus(1, "Ln " + ln + ", Col " + col);
    }

    const win = WM.create({
      title: "Untitled - Notepad", icon: "notepad", appId: undefined,
      width: 480, height: 360, minWidth: 260, minHeight: 160,
      statusbar: [{ text: "" }, { text: "Ln 1, Col 1", width: 110 }],
      menus: [
        { label: "File", items: () => [
          { label: "New", click: doNew },
          { label: "Open...", click: doOpen },
          { label: "Save", click: doSave },
          { label: "Save As...", click: doSaveAs },
          "-",
          { label: "Print...", accel: "Ctrl+P", click: () => W98.Print.submit({ name: baseName(), app: "Notepad", pages: Math.max(1, Math.ceil(ta.value.length / 2400)) }) },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Edit", items: () => [
          { label: "Undo", accel: "Ctrl+Z", click: () => { ta.focus(); document.execCommand("undo"); } },
          "-",
          { label: "Cut", accel: "Ctrl+X", click: () => { ta.focus(); document.execCommand("cut"); } },
          { label: "Copy", accel: "Ctrl+C", click: () => { ta.focus(); document.execCommand("copy"); } },
          { label: "Paste", accel: "Ctrl+V", click: async () => {
            ta.focus();
            try {
              const t = await navigator.clipboard.readText();
              ta.setRangeText(t, ta.selectionStart, ta.selectionEnd, "end");
              dirty = true;
            } catch (e) { document.execCommand("paste"); }
          }},
          { label: "Delete", accel: "Del", click: () => { ta.focus(); ta.setRangeText("", ta.selectionStart, ta.selectionEnd, "start"); dirty = true; } },
          "-",
          { label: "Select All", accel: "Ctrl+A", click: () => { ta.focus(); ta.select(); } },
          { label: "Time/Date", accel: "F5", click: insertTimeDate },
          "-",
          { label: "Word Wrap", checked: Store.get("notepadWrap", false), click: () => {
            const w = !Store.get("notepadWrap", false);
            Store.set("notepadWrap", w);
            ta.classList.toggle("wrap", w);
          }}
        ]},
        { label: "Search", items: () => [
          { label: "Find...", accel: "Ctrl+F", click: findDialog },
          { label: "Find Next", accel: "F3", disabled: !lastFind, click: () => findNext() },
          { label: "Replace...", accel: "Ctrl+H", click: replaceDialog }
        ]},
        { label: "Help", items: () => [
          { label: "Help Topics", click: () => W98.launch("help", "notepad") },
          "-",
          { label: "About Notepad", click: () => Dialogs.about("Notepad", "notepad") }
        ]}
      ],
      onBeforeClose: () => confirmSave()
    });
    ["input", "keyup", "click"].forEach(ev => ta.addEventListener(ev, updateLnCol));
    win.el.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "h" || e.key === "H")) { e.preventDefault(); replaceDialog(); }
    });
    setTimeout(updateLnCol, 100);
    win.body.append(ta);
    win.body.style.padding = "1px 0 0";
    ta.addEventListener("keydown", (e) => {
      if (e.key === "F5") { e.preventDefault(); insertTimeDate(); }
      if (e.key === "F3") { e.preventDefault(); findNext(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") { e.preventDefault(); findDialog(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); doSave().then(syncTitle); }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") { e.preventDefault(); W98.Print.submit({ name: baseName(), app: "Notepad", pages: Math.max(1, Math.ceil(ta.value.length / 2400)) }); }
      e.stopPropagation();
    });
    if (path) loadFile(path);
    setTimeout(() => ta.focus(), 50);
    return win;
  }
};

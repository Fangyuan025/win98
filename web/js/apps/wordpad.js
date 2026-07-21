/* wordpad.js — WordPad rich text editor */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.wordpad = {
  name: "WordPad", icon: "wordpad",
  launch(path) {
    let curPath = null, dirty = false;
    const MARK = "{\\wp1}"; // signature marking rich (HTML) content

    const editor = el("div", {
      class: "wp-editor", contenteditable: "true", spellcheck: "false"
    });
    editor.innerHTML = "<div><br></div>";

    function baseName() { return curPath ? FS.segs(curPath).pop() : "Document"; }
    function syncTitle() { win.setTitle(baseName() + " - WordPad"); }
    editor.addEventListener("input", () => { dirty = true; updateFormatState(); });

    /* ---------- serialize / load ---------- */
    function serialize(asText) {
      if (asText) return editor.innerText.replace(/\n/g, "\r\n");
      return MARK + editor.innerHTML;
    }
    function loadData(data) {
      data = data == null ? "" : String(data);
      if (data.startsWith(MARK)) editor.innerHTML = data.slice(MARK.length);
      else {
        const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        editor.innerHTML = data.split(/\r?\n/).map(l => "<div>" + (esc(l) || "<br>") + "</div>").join("") || "<div><br></div>";
      }
    }

    async function confirmSave() {
      if (!dirty) return true;
      const r = await WM.msgbox({
        title: "WordPad", icon: "warning",
        text: "The text in the " + baseName() + " file has changed.\n\nDo you want to save the changes?",
        buttons: ["Yes", "No", "Cancel"], cancelValue: "Cancel"
      });
      if (r === "Cancel") return false;
      if (r === "Yes") return await doSave();
      return true;
    }
    function extOf(p) { return (p.match(/\.([^.]+)$/) || [, ""])[1].toLowerCase(); }
    async function doSave() {
      if (!curPath) return doSaveAs();
      FS.writeFile(curPath, serialize(extOf(curPath) === "txt"));
      W98.addRecent(curPath); dirty = false;
      return true;
    }
    async function doSaveAs() {
      const p = await Dialogs.filePick({
        mode: "save", title: "Save As", ext: [".doc", ".rtf", ".txt"],
        typeName: "Word for Windows 6.0 (*.doc)", startDir: FS.DOCS,
        defaultName: baseName() === "Document" ? "Document.doc" : baseName()
      });
      if (!p) return false;
      curPath = p;
      FS.writeFile(p, serialize(extOf(p) === "txt"));
      W98.addRecent(p); dirty = false; syncTitle();
      return true;
    }
    async function doNew() {
      if (!(await confirmSave())) return;
      editor.innerHTML = "<div><br></div>"; curPath = null; dirty = false; syncTitle();
    }
    async function doOpen() {
      if (!(await confirmSave())) return;
      const p = await Dialogs.filePick({
        mode: "open", title: "Open", ext: [".doc", ".rtf", ".wri", ".txt"],
        typeName: "Word for Windows (*.doc)", startDir: FS.DOCS
      });
      if (p) { loadData(FS.readFile(p)); curPath = p; dirty = false; syncTitle(); W98.addRecent(p); }
    }

    /* ---------- formatting ---------- */
    function exec(cmd, val) { editor.focus(); document.execCommand(cmd, false, val); dirty = true; updateFormatState(); }
    function updateFormatState() {
      try {
        boldBtn.classList.toggle("on", document.queryCommandState("bold"));
        italBtn.classList.toggle("on", document.queryCommandState("italic"));
        undBtn.classList.toggle("on", document.queryCommandState("underline"));
        alignL.classList.toggle("on", document.queryCommandState("justifyLeft"));
        alignC.classList.toggle("on", document.queryCommandState("justifyCenter"));
        alignR.classList.toggle("on", document.queryCommandState("justifyRight"));
        bulletBtn.classList.toggle("on", document.queryCommandState("insertUnorderedList"));
        const fn = document.queryCommandValue("fontName").replace(/['"]/g, "");
        if (fn && [...fontSel.options].some(o => o.value === fn)) fontSel.value = fn;
      } catch (e) {}
    }
    document.addEventListener("selectionchange", () => {
      if (win.closed) return;
      if (document.activeElement === editor || editor.contains(document.activeElement)) updateFormatState();
    });

    /* ---------- window ---------- */
    const win = WM.create({
      title: "Document - WordPad", icon: "wordpad",
      width: 640, height: 480, minWidth: 440, minHeight: 300,
      statusbar: [{ text: "For Help, press F1" }],
      menus: [
        { label: "File", items: () => [
          { label: "New...", accel: "Ctrl+N", click: doNew },
          { label: "Open...", accel: "Ctrl+O", click: doOpen },
          { label: "Save", accel: "Ctrl+S", click: doSave },
          { label: "Save As...", click: doSaveAs },
          "-",
          { label: "Print...", accel: "Ctrl+P", click: () => W98.Print.submit({ name: baseName(), app: "WordPad", pages: Math.max(1, Math.ceil((editor.textContent || "").length / 2000)) }) },
          { label: "Print Preview", click: () => WM.msgbox({ title: "WordPad", icon: "info", text: "What you see is what you get. This is the preview." }) },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Edit", items: () => [
          { label: "Undo", accel: "Ctrl+Z", click: () => exec("undo") },
          { label: "Redo", accel: "Ctrl+Y", click: () => exec("redo") },
          "-",
          { label: "Cut", accel: "Ctrl+X", click: () => exec("cut") },
          { label: "Copy", accel: "Ctrl+C", click: () => exec("copy") },
          { label: "Paste", accel: "Ctrl+V", click: () => pasteText() },
          "-",
          { label: "Select All", accel: "Ctrl+A", click: () => exec("selectAll") }
        ]},
        { label: "View", items: () => [
          { label: "Toolbar", checked: tbar.style.display !== "none", click: () => tbar.style.display = tbar.style.display === "none" ? "" : "none" },
          { label: "Format Bar", checked: fbar.style.display !== "none", click: () => fbar.style.display = fbar.style.display === "none" ? "" : "none" },
          { label: "Ruler", checked: ruler.style.display !== "none", click: () => { ruler.style.display = ruler.style.display === "none" ? "" : "none"; drawRuler(); } },
          { label: "Status Bar", checked: true, click: () => { win.statusbar.style.display = win.statusbar.style.display === "none" ? "" : "none"; } }
        ]},
        { label: "Insert", items: () => [
          { label: "Date and Time...", click: insertDate },
          { label: "Horizontal Line", click: () => exec("insertHorizontalRule") }
        ]},
        { label: "Format", items: () => [
          { label: "Font...", click: fontDialog },
          { label: "Bullet Style", click: () => exec("insertUnorderedList") },
          "-",
          { label: "Text Color...", click: colorDialog }
        ]},
        { label: "Help", items: () => [
          { label: "Help Topics", click: () => W98.launch("help", "wordpad") },
          { label: "Pixel the Assistant", checked: Store.get("wpPixel", true), click: togglePixel },
          "-",
          { label: "About WordPad", click: () => Dialogs.about("WordPad", "wordpad") }
        ]}
      ],
      onBeforeClose: () => confirmSave()
    });

    /* toolbar */
    const tbar = el("div", { class: "toolbar" });
    const mkTool = (label, icon, fn) => {
      const b = el("button", { class: "tool-btn", title: label, style: "min-width:22px" });
      b.append(Icons.img(icon, 20));
      b.addEventListener("click", fn);
      tbar.append(b);
      return b;
    };
    mkTool("New", "file", doNew);
    mkTool("Open", "folderopen", doOpen);
    mkTool("Save", "floppy", doSave);
    tbar.append(el("div", { class: "tsep" }));
    mkTool("Print", "tb_props", () => WM.msgbox({ title: "Print", icon: "info", text: "Printing... (no printer attached)" }));
    mkTool("Find", "find", () => WM.msgbox({ title: "WordPad", icon: "info", text: "Find: not wired up in this recreation — but Ctrl+A then read works." }));
    tbar.append(el("div", { class: "tsep" }));
    mkTool("Cut", "tb_cut", () => exec("cut"));
    mkTool("Copy", "tb_copy", () => exec("copy"));
    mkTool("Paste", "tb_paste", () => pasteText());
    tbar.append(el("div", { class: "tsep" }));
    mkTool("Undo", "tb_back", () => exec("undo"));
    mkTool("Date/Time", "datetime", insertDate);

    /* format bar */
    const fbar = el("div", { class: "toolbar wp-formatbar" });
    const fontSel = el("select", { class: "field", style: "width:120px;height:21px" });
    ["Arial", "Times New Roman", "Courier New", "Comic Sans MS", "Georgia", "Verdana", "Tahoma", "Impact"].forEach(f => {
      const o = el("option", { text: f, value: f }); o.style.fontFamily = f; fontSel.append(o);
    });
    fontSel.value = "Times New Roman";
    fontSel.addEventListener("change", () => exec("fontName", fontSel.value));
    const sizeSel = el("select", { class: "field", style: "width:48px;height:21px" });
    [["8", 1], ["10", 2], ["12", 3], ["14", 4], ["18", 5], ["24", 6], ["36", 7]].forEach(([lbl, v]) => sizeSel.append(el("option", { text: lbl, value: v })));
    sizeSel.value = 3;
    sizeSel.addEventListener("change", () => exec("fontSize", sizeSel.value));
    fbar.append(fontSel, sizeSel, el("div", { class: "tsep" }));

    const mkFmt = (label, fn, styler) => {
      const b = el("button", { class: "tool-btn wp-fmt", title: label });
      const s = el("span", { text: label[0], style: "font-size:13px;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-family:'Times New Roman',serif" });
      if (styler) styler(s);
      b.append(s);
      b.addEventListener("mousedown", e => e.preventDefault());
      b.addEventListener("click", fn);
      fbar.append(b);
      return b;
    };
    const boldBtn = mkFmt("Bold", () => exec("bold"), s => s.style.fontWeight = "700");
    const italBtn = mkFmt("Italic", () => exec("italic"), s => s.style.fontStyle = "italic");
    const undBtn = mkFmt("Underline", () => exec("underline"), s => s.style.textDecoration = "underline");
    const colorBtn = el("button", { class: "tool-btn", title: "Color" });
    colorBtn.append(el("span", { text: "A", style: "font-size:13px;border-bottom:3px solid #e01f1f;padding:0 2px" }));
    colorBtn.addEventListener("mousedown", e => e.preventDefault());
    colorBtn.addEventListener("click", colorDialog);
    fbar.append(colorBtn, el("div", { class: "tsep" }));

    const mkAlign = (label, cmd) => {
      const b = el("button", { class: "tool-btn wp-fmt", title: label });
      const c = document.createElement("canvas"); c.width = 16; c.height = 16;
      const x = c.getContext("2d"); x.fillStyle = "#000";
      [11, 7, 11, 7].forEach((w, i) => {
        const y = 3 + i * 3;
        if (label === "Center") x.fillRect(8 - w / 2, y, w, 1.6);
        else if (label === "Align Right") x.fillRect(14 - w, y, w, 1.6);
        else x.fillRect(2, y, w, 1.6);
      });
      const im = new Image(); im.src = c.toDataURL(); im.width = 16; im.height = 16;
      b.append(im);
      b.addEventListener("mousedown", e => e.preventDefault());
      b.addEventListener("click", () => exec(cmd));
      fbar.append(b);
      return b;
    };
    const alignL = mkAlign("Align Left", "justifyLeft");
    const alignC = mkAlign("Center", "justifyCenter");
    const alignR = mkAlign("Align Right", "justifyRight");
    const bulletBtn = el("button", { class: "tool-btn wp-fmt", title: "Bullets" });
    bulletBtn.append(el("span", { text: "•≡", style: "font-size:12px" }));
    bulletBtn.addEventListener("mousedown", e => e.preventDefault());
    bulletBtn.addEventListener("click", () => exec("insertUnorderedList"));
    fbar.append(bulletBtn);

    /* ruler (decorative) */
    const ruler = el("div", { class: "wp-ruler" });
    const rcanvas = document.createElement("canvas");
    ruler.append(rcanvas);
    function drawRuler() {
      const w = Math.max(editor.clientWidth || 600, 100);
      rcanvas.width = w; rcanvas.height = 16;
      const x = rcanvas.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0, 0, w, 16);
      x.fillStyle = "#000"; x.font = "8px sans-serif"; x.textBaseline = "top";
      const ppi = 96;
      for (let i = 0; i * ppi < w; i++) {
        const px = i * ppi + 8;
        x.fillRect(px, 6, 1, 8);
        if (i > 0) x.fillText(String(i), px - 2, 1);
        for (let j = 1; j < 8; j++) { const mx = px + j * ppi / 8; x.fillRect(mx, j === 4 ? 8 : 10, 1, j === 4 ? 6 : 4); }
      }
    }

    /* page */
    const pageWrap = el("div", { class: "wp-page-wrap" });
    const page = el("div", { class: "wp-page" });
    page.append(editor);
    pageWrap.append(page);
    win.body.append(tbar, fbar, ruler, pageWrap);

    win.opts.onResize = drawRuler;
    setTimeout(drawRuler, 30);

    /* ---------- Pixel the Assistant (an orange cat who means well) ---------- */
    const TIPS = [
      "Tip: Ctrl+B makes text bold. I walked on the keyboard and learned this.",
      "Tip: save often. The power flickers when the microwave runs.",
      "Tip: the ruler up there is mostly decorative. Like me.",
      "Tip: 12pt Times New Roman makes any book report look 20% longer.",
      "I knocked a cup off the desk while you were typing. It felt right.",
      "Tip: Ctrl+Z un-does. It does not work on cups.",
      "Your document has words in it. Excellent progress.",
      "Tip: Print... sends this to the EpsonJet. I like to sit on warm paper."
    ];
    const TRIGGERS = [
      [/\bdear\s+\w+/i, "It looks like you're writing a letter!\nWould you like me to sit on it?"],
      [/\bresume\b|\brésumé\b/i, "A resume! Under 'skills', consider adding\n'naps (advanced)'."],
      [/\bonce upon a time\b/i, "A story! Put a cat in it.\nEvery good story has a cat."],
      [/\bbook report\b|\bhomework\b/i, "Homework detected. I will supervise\nfrom on top of the textbook."],
      [/\bpizza\b/i, "You typed 'pizza'. Just noting that\nI am also interested in pizza."]
    ];
    let pixTimer = null, lastTrigger = -1;
    const pixBubble = el("div", { class: "px-bubble", text: "Hi! I'm Pixel. I live in WordPad now." });
    const pixCanvas = el("canvas", { width: 56, height: 44, style: "cursor:pointer" });
    const pixClose = el("button", { class: "px-close", text: "×", title: "Hide Pixel" });
    const pixPane = el("div", { class: "pixel-pane" }, pixBubble, pixCanvas, pixClose);
    win.el.append(pixPane);
    function drawPixel(blink) {
      const c = pixCanvas.getContext("2d");
      c.clearRect(0, 0, 56, 44);
      c.fillStyle = "#e8912d";
      c.beginPath(); c.ellipse(28, 30, 16, 11, 0, 0, Math.PI * 2); c.fill();      /* body */
      c.beginPath(); c.arc(28, 15, 11, 0, Math.PI * 2); c.fill();                 /* head */
      c.beginPath(); c.moveTo(19, 8); c.lineTo(21, 0); c.lineTo(25, 6); c.fill(); /* ears */
      c.beginPath(); c.moveTo(37, 8); c.lineTo(35, 0); c.lineTo(31, 6); c.fill();
      c.strokeStyle = "#e8912d"; c.lineWidth = 3; c.lineCap = "round";
      c.beginPath(); c.moveTo(43, 32); c.quadraticCurveTo(53, 28, 51, 18); c.stroke(); /* tail */
      c.fillStyle = "#c9701a";
      [[22, 26], [30, 24]].forEach(([sx, sy]) => c.fillRect(sx, sy, 4, 2));       /* stripes */
      c.fillStyle = "#301c08";
      if (blink) { c.fillRect(23, 14, 4, 1.5); c.fillRect(30, 14, 4, 1.5); }
      else { c.beginPath(); c.arc(25, 14, 1.6, 0, 7); c.arc(32, 14, 1.6, 0, 7); c.fill(); }
      c.beginPath(); c.moveTo(27, 18); c.lineTo(29, 18); c.lineTo(28, 19.5); c.fill(); /* nose */
      c.strokeStyle = "#301c08"; c.lineWidth = 0.7;
      [[-1, 0], [-1, 2], [1, 0], [1, 2]].forEach(([s2, dy]) => {
        c.beginPath(); c.moveTo(28 + s2 * 4, 18 + dy * 0.5); c.lineTo(28 + s2 * 12, 17 + dy); c.stroke();
      });
    }
    function say(t) {
      pixBubble.textContent = t;
      pixBubble.classList.remove("px-pop"); void pixBubble.offsetWidth;
      pixBubble.classList.add("px-pop");
    }
    function meow() {
      const bus = Sound.audio();
      if (!bus) return;
      const o = bus.ctx.createOscillator(), g = bus.ctx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(480, bus.ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(300, bus.ctx.currentTime + 0.22);
      g.gain.setValueAtTime(0.05, bus.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, bus.ctx.currentTime + 0.25);
      o.connect(g); g.connect(bus.master);
      o.start(); o.stop(bus.ctx.currentTime + 0.3);
    }
    pixCanvas.addEventListener("click", () => { meow(); say(TIPS[Math.floor(Math.random() * TIPS.length)]); });
    pixClose.addEventListener("click", () => togglePixel());
    editor.addEventListener("input", () => {
      if (pixPane.hidden) return;
      const tail = (editor.textContent || "").slice(-60);
      TRIGGERS.forEach(([re, tip], i) => {
        if (re.test(tail) && lastTrigger !== i) { lastTrigger = i; say(tip); }
      });
    });
    function startPixel() {
      drawPixel(false);
      clearInterval(pixTimer);
      let tick = 0;
      pixTimer = setInterval(() => {
        tick++;
        drawPixel(true); setTimeout(() => !win.closed && drawPixel(false), 160);   /* blink */
        if (tick % 8 === 0) say(TIPS[Math.floor(Math.random() * TIPS.length)]);
      }, 3600);
    }
    function togglePixel() {
      const on = pixPane.hidden;
      pixPane.hidden = !on;
      Store.set("wpPixel", on);
      if (on) startPixel(); else clearInterval(pixTimer);
    }
    pixPane.hidden = !Store.get("wpPixel", true);
    if (!pixPane.hidden) startPixel();
    const prevClose = win.opts.onClose;
    win.opts.onClose = () => { clearInterval(pixTimer); if (prevClose) prevClose(); };

    function insertDate() { exec("insertText", fmtDate(new Date())); }
    async function pasteText() {
      editor.focus();
      try { const t = await navigator.clipboard.readText(); document.execCommand("insertText", false, t); dirty = true; }
      catch (e) { document.execCommand("paste"); }
    }
    function colorDialog() {
      const colors = ["#000000", "#800000", "#008000", "#808000", "#000080", "#800080", "#008080", "#808080",
        "#c0c0c0", "#ff0000", "#00ff00", "#ffff00", "#0000ff", "#ff00ff", "#00ffff", "#ffffff"];
      const dw = WM.create({ title: "Color", icon: "wordpad", width: 200, height: 0, resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true });
      dw.el.style.height = "auto";
      const grid = el("div", { style: "display:grid;grid-template-columns:repeat(8,20px);gap:2px;padding:12px" });
      colors.forEach(c => {
        const b = el("button", { style: "width:20px;height:20px;background:" + c + ";border:1px solid #808080;padding:0" });
        b.addEventListener("click", () => { exec("foreColor", c); $("span", colorBtn).style.borderBottomColor = c; dw.close(); });
        grid.append(b);
      });
      dw.body.append(grid);
    }
    function fontDialog() {
      const dw = WM.create({ title: "Font", icon: "wordpad", width: 340, height: 0, resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true });
      dw.el.style.height = "auto";
      const fsel = el("select", { class: "field", size: "6", style: "width:150px;height:100px" });
      ["Arial", "Times New Roman", "Courier New", "Comic Sans MS", "Georgia", "Verdana", "Tahoma", "Impact"].forEach(f => { const o = el("option", { text: f, value: f }); o.style.fontFamily = f; fsel.append(o); });
      const ssel = el("select", { class: "field", size: "6", style: "width:56px;height:100px" });
      ["8", "10", "12", "14", "18", "24", "36", "48", "72"].forEach(s => ssel.append(el("option", { text: s, value: s })));
      const sizeMap = { "8": 1, "10": 2, "12": 3, "14": 4, "18": 5, "24": 6, "36": 7, "48": 7, "72": 7 };
      dw.body.append(
        el("div", { style: "display:flex;gap:12px;padding:12px" },
          el("div", {}, el("div", { text: "Font:" }), fsel),
          el("div", {}, el("div", { text: "Size:" }), ssel)),
        (() => { const r = el("div", { class: "msgbox-btns" });
          const ok = el("button", { class: "btn default", text: "OK" });
          const cancel = el("button", { class: "btn", text: "Cancel" });
          ok.addEventListener("click", () => { if (fsel.value) { exec("fontName", fsel.value); fontSel.value = fsel.value; } if (ssel.value) exec("fontSize", sizeMap[ssel.value]); dw.close(); });
          cancel.addEventListener("click", () => dw.close());
          r.append(ok, cancel); return r; })()
      );
    }

    editor.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === "s") { e.preventDefault(); doSave().then(syncTitle); }
        else if (k === "b") { e.preventDefault(); exec("bold"); }
        else if (k === "i") { e.preventDefault(); exec("italic"); }
        else if (k === "u") { e.preventDefault(); exec("underline"); }
        else if (k === "o") { e.preventDefault(); doOpen(); }
        else if (k === "n") { e.preventDefault(); doNew(); }
      }
    });

    if (path) { loadData(FS.readFile(path)); curPath = path; syncTitle(); W98.addRecent(path); }
    setTimeout(() => { editor.focus(); document.execCommand("fontName", false, "Times New Roman"); dirty = false; }, 50);
    return win;
  }
};

/* "Word" (Office) — same rich-text engine, Office branding & icon */
W98.Apps.writer = {
  name: "Word", icon: "writer",
  launch(path) { return W98.Apps.wordpad.launch(path); }
};

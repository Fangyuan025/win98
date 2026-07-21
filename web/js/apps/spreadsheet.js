/* spreadsheet.js — a working spreadsheet with A1 formulas */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.spreadsheet = {
  name: "Spreadsheet", icon: "sheet",
  launch(path) {
    const COLS = 18, ROWS = 40;
    let curPath = null, dirty = false;
    let cells = {};              // "A1" -> raw string
    let sel = { c: 0, r: 0 };
    let editing = null;
    const cache = {};            // eval memo per recalc

    function colName(i) { let s = ""; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
    function cellId(c, r) { return colName(c) + (r + 1); }
    function parseId(id) { const m = /^([A-Z]+)(\d+)$/.exec(id); if (!m) return null; let c = 0; for (const ch of m[1]) c = c * 26 + (ch.charCodeAt(0) - 64); return { c: c - 1, r: parseInt(m[2]) - 1 }; }

    /* ---------- formula engine ---------- */
    function evalCell(id, seen) {
      if (id in cache) return cache[id];
      seen = seen || {};
      if (seen[id]) { cache[id] = { err: "#CIRC!" }; return cache[id]; }
      const raw = cells[id];
      if (raw == null || raw === "") return { v: "", num: false };
      if (raw[0] !== "=") {
        const n = parseFloat(raw);
        if (raw.trim() !== "" && !isNaN(n) && String(n) === raw.trim()) return { v: n, num: true };
        return { v: raw, num: false };
      }
      seen[id] = true;
      try {
        const val = evalExpr(raw.slice(1), seen);
        cache[id] = { v: val, num: typeof val === "number" };
      } catch (e) {
        cache[id] = { err: e.message && e.message.startsWith("#") ? e.message : "#ERROR!" };
      }
      delete seen[id];
      return cache[id];
    }
    function cellNum(id, seen) {
      const r = evalCell(id, seen);
      if (r.err) throw new Error(r.err);
      if (r.v === "") return 0;
      if (typeof r.v === "number") return r.v;
      const n = parseFloat(r.v);
      return isNaN(n) ? 0 : n;
    }
    function rangeVals(a, b, seen) {
      const A = parseId(a), B = parseId(b);
      if (!A || !B) throw new Error("#REF!");
      const out = [];
      for (let r = Math.min(A.r, B.r); r <= Math.max(A.r, B.r); r++)
        for (let c = Math.min(A.c, B.c); c <= Math.max(A.c, B.c); c++)
          out.push(cellNum(cellId(c, r), seen));
      return out;
    }
    const FUNCS = {
      SUM: a => a.reduce((x, y) => x + y, 0),
      AVERAGE: a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0,
      MIN: a => a.length ? Math.min(...a) : 0,
      MAX: a => a.length ? Math.max(...a) : 0,
      COUNT: a => a.length,
      PRODUCT: a => a.reduce((x, y) => x * y, 1),
      ROUND: a => Math.round(a[0] * Math.pow(10, a[1] || 0)) / Math.pow(10, a[1] || 0),
      ABS: a => Math.abs(a[0]), SQRT: a => Math.sqrt(a[0]),
      INT: a => Math.floor(a[0]), MOD: a => a[0] % a[1],
      POWER: a => Math.pow(a[0], a[1]), PI: () => Math.PI
    };
    function evalExpr(src, seen) {
      // tokenizer
      const toks = [];
      const re = /\s*(?:([A-Z]+\d+:[A-Z]+\d+)|([A-Z]+\d+)|([A-Z]+)\s*\(|(\d+\.?\d*|\.\d+)|("(?:[^"]*)")|([+\-*/(),^%&]))/gy;
      let m, i = 0;
      while (i < src.length) {
        re.lastIndex = i;
        m = re.exec(src);
        if (!m) throw new Error("#ERROR!");
        i = re.lastIndex;
        if (m[1]) toks.push({ t: "range", v: m[1] });
        else if (m[2]) toks.push({ t: "ref", v: m[2] });
        else if (m[3]) toks.push({ t: "func", v: m[3] });
        else if (m[4]) toks.push({ t: "num", v: parseFloat(m[4]) });
        else if (m[5]) toks.push({ t: "str", v: m[5].slice(1, -1) });
        else toks.push({ t: "op", v: m[6] });
      }
      let p = 0;
      const peek = () => toks[p], next = () => toks[p++];
      function parseExpr() { return parseAdd(); }
      function parseAdd() {
        let v = parseMul();
        while (peek() && peek().t === "op" && (peek().v === "+" || peek().v === "-")) {
          const o = next().v; const r = parseMul();
          v = o === "+" ? v + r : v - r;
        }
        return v;
      }
      function parseMul() {
        let v = parsePow();
        while (peek() && peek().t === "op" && (peek().v === "*" || peek().v === "/")) {
          const o = next().v; const r = parsePow();
          if (o === "/" && r === 0) throw new Error("#DIV/0!");
          v = o === "*" ? v * r : v / r;
        }
        return v;
      }
      function parsePow() {
        let v = parseUnary();
        while (peek() && peek().t === "op" && peek().v === "^") { next(); v = Math.pow(v, parseUnary()); }
        return v;
      }
      function parseUnary() {
        if (peek() && peek().t === "op" && peek().v === "-") { next(); return -parseUnary(); }
        if (peek() && peek().t === "op" && peek().v === "+") { next(); return parseUnary(); }
        return parsePrimary();
      }
      function parsePrimary() {
        const tk = next();
        if (!tk) throw new Error("#ERROR!");
        if (tk.t === "num") return tk.v;
        if (tk.t === "str") return tk.v;
        if (tk.t === "ref") return cellNum(tk.v, seen);
        if (tk.t === "range") throw new Error("#VALUE!"); // ranges only inside funcs
        if (tk.t === "func") {
          const fn = FUNCS[tk.v.toUpperCase()];
          if (!fn) throw new Error("#NAME?");
          const args = [];
          if (peek() && !(peek().t === "op" && peek().v === ")")) {
            do {
              if (peek() && peek().t === "range") { const rg = next().v.split(":"); args.push(...rangeVals(rg[0], rg[1], seen)); }
              else args.push(parseExpr());
            } while (peek() && peek().t === "op" && peek().v === "," && next());
          }
          if (!peek() || peek().v !== ")") throw new Error("#ERROR!");
          next();
          return fn(args);
        }
        if (tk.t === "op" && tk.v === "(") { const v = parseExpr(); if (!peek() || peek().v !== ")") throw new Error("#ERROR!"); next(); return v; }
        throw new Error("#ERROR!");
      }
      const result = parseExpr();
      if (p < toks.length) throw new Error("#ERROR!");
      return result;
    }

    /* ---------- rendering ---------- */
    const table = el("table", { class: "ss-grid" });
    const thead = el("thead");
    const tbody = el("tbody");
    table.append(thead, tbody);
    const tdMap = {};

    function buildGrid() {
      const hr = el("tr");
      hr.append(el("th", { class: "corner" }));
      for (let c = 0; c < COLS; c++) hr.append(el("th", { text: colName(c), dataset: { c } }));
      thead.append(hr);
      for (let r = 0; r < ROWS; r++) {
        const tr = el("tr");
        tr.append(el("th", { class: "rowhdr", text: r + 1, dataset: { r } }));
        for (let c = 0; c < COLS; c++) {
          const td = el("td", { dataset: { c, r } });
          const div = el("div", { class: "ss-cell" });
          td.append(div);
          td.addEventListener("mousedown", () => selectCell(c, r));
          td.addEventListener("dblclick", () => startEdit(c, r));
          tdMap[cellId(c, r)] = div;
          tr.append(td);
        }
        tbody.append(tr);
      }
    }
    function recalc() {
      for (const k in cache) delete cache[k];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const id = cellId(c, r);
        const div = tdMap[id];
        const res = evalCell(id);
        div.className = "ss-cell";
        if (res.err) { div.textContent = res.err; div.classList.add("err"); }
        else if (res.num) { div.textContent = fmtNum(res.v); div.classList.add("num"); }
        else div.textContent = res.v;
      }
    }
    function fmtNum(n) {
      if (!isFinite(n)) return "#NUM!";
      if (Number.isInteger(n)) return String(n);
      return String(Math.round(n * 1e10) / 1e10);
    }

    function selectCell(c, r, keepEdit) {
      if (editing && !keepEdit) commitEdit();
      sel = { c, r };
      $$(".sel", tbody).forEach(t => t.classList.remove("sel"));
      const td = tbody.rows[r].cells[c + 1];
      td.classList.add("sel");
      nameBox.value = cellId(c, r);
      fxInput.value = cells[cellId(c, r)] || "";
      td.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    function startEdit(c, r) {
      selectCell(c, r, true);
      editing = { c, r };
      const td = tbody.rows[r].cells[c + 1];
      const rect = td.getBoundingClientRect();
      const wrapRect = gridWrap.getBoundingClientRect();
      const inp = el("input", { class: "ss-editor", value: cells[cellId(c, r)] || "" });
      inp.style.left = (td.offsetLeft) + "px";
      inp.style.top = (td.offsetTop) + "px";
      inp.style.width = Math.max(td.offsetWidth, 80) + "px";
      inp.style.height = td.offsetHeight + "px";
      gridWrap.append(inp);
      inp.focus(); inp.select();
      editing.inp = inp;
      inp.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter") { e.preventDefault(); commitEdit(); selectCell(sel.c, Math.min(ROWS - 1, sel.r + 1)); }
        else if (e.key === "Tab") { e.preventDefault(); commitEdit(); selectCell(Math.min(COLS - 1, sel.c + 1), sel.r); }
        else if (e.key === "Escape") { e.preventDefault(); editing.inp.remove(); editing = null; }
      });
    }
    function commitEdit() {
      if (!editing) return;
      const id = cellId(editing.c, editing.r);
      const v = editing.inp.value;
      if (v === "") delete cells[id]; else cells[id] = v;
      editing.inp.remove();
      editing = null;
      dirty = true;
      recalc();
    }

    /* ---------- file ---------- */
    function baseName() { return curPath ? FS.segs(curPath).pop() : "Sheet1"; }
    function syncTitle() { win.setTitle(baseName() + " - Spreadsheet"); }
    function serialize() { return "SSV1\n" + JSON.stringify(cells); }
    function serializeCSV() {
      let maxC = 0, maxR = 0;
      for (const id in cells) { const p = parseId(id); if (p) { maxC = Math.max(maxC, p.c); maxR = Math.max(maxR, p.r); } }
      const lines = [];
      for (let r = 0; r <= maxR; r++) {
        const row = [];
        for (let c = 0; c <= maxC; c++) { const res = evalCell(cellId(c, r)); let v = res.err || res.v; if (typeof v === "string" && /[",\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"'; row.push(v); }
        lines.push(row.join(","));
      }
      return lines.join("\r\n");
    }
    function loadData(data) {
      cells = {};
      data = String(data || "");
      if (data.startsWith("SSV1\n")) { try { cells = JSON.parse(data.slice(5)); } catch (e) {} }
      else if (data.trim()) {
        // parse CSV
        data.split(/\r?\n/).forEach((line, r) => {
          const vals = line.match(/("(?:[^"]|"")*"|[^,]*)(,|$)/g) || [];
          let c = 0;
          for (let v of vals) { v = v.replace(/,$/, ""); if (v.startsWith('"')) v = v.slice(1, -1).replace(/""/g, '"'); if (v !== "") cells[cellId(c, r)] = v; c++; if (c > COLS) break; }
        });
      }
      recalc();
    }
    async function doSave() {
      if (!curPath) return doSaveAs();
      FS.writeFile(curPath, FS.ext(curPath) === "csv" ? serializeCSV() : serialize());
      W98.addRecent(curPath); dirty = false; return true;
    }
    async function doSaveAs() {
      const p = await Dialogs.filePick({ mode: "save", title: "Save As", ext: [".xls", ".csv"], typeName: "Worksheet (*.xls)", startDir: FS.DOCS, defaultName: baseName() === "Sheet1" ? "Book1.xls" : baseName() });
      if (!p) return false;
      curPath = p; FS.writeFile(p, FS.ext(p) === "csv" ? serializeCSV() : serialize()); W98.addRecent(p); dirty = false; syncTitle(); return true;
    }
    async function confirmSave() {
      if (!dirty) return true;
      const r = await WM.msgbox({ title: "Spreadsheet", icon: "warning", text: "Do you want to save the changes to " + baseName() + "?", buttons: ["Yes", "No", "Cancel"], cancelValue: "Cancel" });
      if (r === "Cancel") return false;
      if (r === "Yes") return await doSave();
      return true;
    }
    async function doNew() { if (!(await confirmSave())) return; cells = {}; curPath = null; dirty = false; recalc(); selectCell(0, 0); syncTitle(); }
    async function doOpen() {
      if (!(await confirmSave())) return;
      const p = await Dialogs.filePick({ mode: "open", title: "Open", ext: [".xls", ".csv"], typeName: "Worksheet (*.xls;*.csv)", startDir: FS.DOCS });
      if (p) { loadData(FS.readFile(p)); curPath = p; dirty = false; syncTitle(); selectCell(0, 0); W98.addRecent(p); }
    }

    /* ---------- window ---------- */
    const win = WM.create({
      title: "Sheet1 - Spreadsheet", icon: "sheet",
      width: 640, height: 460, minWidth: 420, minHeight: 260,
      statusbar: [{ text: "Ready" }, { text: "", width: 120 }],
      menus: [
        { label: "File", items: () => [
          { label: "New", accel: "Ctrl+N", click: doNew },
          { label: "Open...", accel: "Ctrl+O", click: doOpen },
          { label: "Save", accel: "Ctrl+S", click: doSave },
          { label: "Save As...", click: doSaveAs },
          "-",
          { label: "Print...", accel: "Ctrl+P", click: () => W98.Print.submit({ name: baseName(), app: "Spreadsheet", pages: 1 }) },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Edit", items: () => [
          { label: "Clear Cell", accel: "Del", click: () => { delete cells[cellId(sel.c, sel.r)]; dirty = true; recalc(); fxInput.value = ""; } },
          { label: "Clear All", click: () => { cells = {}; dirty = true; recalc(); } },
          "-",
          { label: "Copy Cell", click: () => { try { navigator.clipboard.writeText(cells[cellId(sel.c, sel.r)] || ""); } catch (e) {} } }
        ]},
        { label: "Insert", items: () => [
          { label: "Function: SUM", click: () => { fxInput.value = "=SUM()"; fxInput.focus(); fxInput.setSelectionRange(5, 5); } },
          { label: "Function: AVERAGE", click: () => { fxInput.value = "=AVERAGE()"; fxInput.focus(); fxInput.setSelectionRange(9, 9); } },
          { label: "Sample Data", click: fillSample }
        ]},
        { label: "Help", items: () => [
          { label: "Help Topics", click: () => W98.launch("help", "spreadsheet") },
          "-",
          { label: "About Spreadsheet", click: () => Dialogs.about("Spreadsheet", "sheet", ["A working spreadsheet with A1-style formulas.", "Try =SUM(A1:A5), =AVERAGE(B1:B3), =A1*1.08"]) }
        ]}
      ],
      onResize: () => {},
      onBeforeClose: () => confirmSave()
    });

    /* toolbar */
    const tbar = el("div", { class: "toolbar" });
    const mkTool = (label, icon, fn) => { const b = el("button", { class: "tool-btn", title: label }); b.append(Icons.img(icon, 20)); b.addEventListener("click", fn); tbar.append(b); return b; };
    mkTool("New", "file", doNew);
    mkTool("Open", "folderopen", doOpen);
    mkTool("Save", "floppy", doSave);
    tbar.append(el("div", { class: "tsep" }));
    mkTool("Sum", "sheet", () => { fxInput.value = "=SUM()"; fxInput.focus(); fxInput.setSelectionRange(5, 5); });

    /* formula bar */
    const fbar = el("div", { class: "toolbar ss-formulabar" });
    const nameBox = el("input", { class: "field ss-namebox", value: "A1", readonly: "true" });
    const fxInput = el("input", { class: "field ss-fx" });
    fbar.append(nameBox, el("span", { text: "=", style: "font-weight:700;font-style:italic;padding:0 2px" }), fxInput);
    fxInput.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") { const id = cellId(sel.c, sel.r); const v = fxInput.value; if (v === "") delete cells[id]; else cells[id] = v; dirty = true; recalc(); selectCell(sel.c, Math.min(ROWS - 1, sel.r + 1)); }
      else if (e.key === "Escape") { fxInput.value = cells[cellId(sel.c, sel.r)] || ""; }
    });

    const gridWrap = el("div", { class: "ss-grid-wrap" });
    gridWrap.append(table);
    win.body.append(tbar, fbar, gridWrap);

    /* keyboard nav on grid */
    win.el.addEventListener("keydown", (e) => {
      if (editing || e.target === fxInput || e.target === nameBox) return;
      let handled = true;
      if (e.key === "ArrowUp") selectCell(sel.c, Math.max(0, sel.r - 1));
      else if (e.key === "ArrowDown" || e.key === "Enter") selectCell(sel.c, Math.min(ROWS - 1, sel.r + 1));
      else if (e.key === "ArrowLeft") selectCell(Math.max(0, sel.c - 1), sel.r);
      else if (e.key === "ArrowRight" || e.key === "Tab") selectCell(Math.min(COLS - 1, sel.c + 1), sel.r);
      else if (e.key === "Delete" || e.key === "Backspace") { delete cells[cellId(sel.c, sel.r)]; dirty = true; recalc(); fxInput.value = ""; }
      else if (e.key === "F2") startEdit(sel.c, sel.r);
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { startEdit(sel.c, sel.r); editing.inp.value = e.key; }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { doSave().then(syncTitle); }
      else handled = false;
      if (handled) e.preventDefault();
    });

    function fillSample() {
      const data = {
        A1: "Item", B1: "Qty", C1: "Price", D1: "Total",
        A2: "Widgets", B2: "12", C2: "3.50", D2: "=B2*C2",
        A3: "Gadgets", B3: "7", C3: "9.99", D3: "=B3*C3",
        A4: "Gizmos", B4: "20", C4: "1.25", D4: "=B4*C4",
        A6: "Subtotal", D6: "=SUM(D2:D4)",
        A7: "Tax (8%)", D7: "=D6*0.08",
        A8: "Grand Total", D8: "=D6+D7"
      };
      Object.assign(cells, data); dirty = true; recalc(); selectCell(0, 0);
    }

    buildGrid();
    if (path) { loadData(FS.readFile(path)); curPath = path; syncTitle(); W98.addRecent(path); }
    else recalc();
    selectCell(0, 0);
    setTimeout(() => win.el.focus && win.el.setAttribute("tabindex", "-1"), 10);
    win.el.tabIndex = -1;
    setTimeout(() => win.el.focus(), 40);
    return win;
  }
};

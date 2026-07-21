/* calc.js — Win98 standard calculator */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.calc = {
  name: "Calculator", icon: "calc", single: true,
  launch() {
    let display = "0";
    let acc = null;       // accumulator
    let op = null;        // pending operator
    let fresh = true;     // next digit starts new number
    let memory = 0;
    let sciMode = Store.get("calcSci", false);
    let degMode = true;
    const parenStack = [];

    const disp = el("div", { class: "calc-display", text: "0" });
    const memInd = el("div", { class: "calc-mem", text: "" });

    function show(v) {
      if (typeof v === "number") {
        if (!isFinite(v) || isNaN(v)) { display = "E"; }
        else {
          let s = String(v);
          if (s.length > 16) s = v.toPrecision(12).replace(/\.?0+($|e)/, "$1");
          display = s;
        }
      } else display = v;
      disp.textContent = display;
    }
    function cur() { return parseFloat(display) || 0; }

    function digit(d) {
      if (display === "E") return;
      if (fresh) { display = d === "." ? "0." : d; fresh = false; }
      else {
        if (d === "." && display.includes(".")) return;
        if (display === "0" && d !== ".") display = d;
        else display += d;
      }
      disp.textContent = display;
      Sound.play("click");
    }
    function applyOp() {
      if (op == null || acc == null) return cur();
      const b = cur();
      let r;
      switch (op) {
        case "+": r = acc + b; break;
        case "-": r = acc - b; break;
        case "*": r = acc * b; break;
        case "/": r = b === 0 ? NaN : acc / b; break;
        case "p": r = Math.pow(acc, b); break;
      }
      return r;
    }
    function setOp(o) {
      if (display === "E") return;
      if (op != null && !fresh) { const r = applyOp(); acc = r; show(r); }
      else if (acc == null) acc = cur();
      op = o; fresh = true;
    }
    function equals() {
      if (display === "E") return;
      if (op != null) { const r = applyOp(); show(r); acc = null; op = null; fresh = true; }
    }
    function clearAll() { display = "0"; acc = null; op = null; fresh = true; disp.textContent = display; }
    function clearEntry() { display = "0"; fresh = true; disp.textContent = display; }
    function back() {
      if (fresh || display === "E") return;
      display = display.length > 1 ? display.slice(0, -1) : "0";
      disp.textContent = display;
    }
    function unary(kind) {
      if (display === "E") return;
      let v = cur();
      const rad = x => degMode ? x * Math.PI / 180 : x;
      if (kind === "sqrt") v = v < 0 ? NaN : Math.sqrt(v);
      else if (kind === "inv") v = v === 0 ? NaN : 1 / v;
      else if (kind === "neg") v = -v;
      else if (kind === "pct") { v = acc != null ? acc * v / 100 : 0; }
      else if (kind === "sin") v = Math.sin(rad(v));
      else if (kind === "cos") v = Math.cos(rad(v));
      else if (kind === "tan") v = Math.tan(rad(v));
      else if (kind === "ln") v = v <= 0 ? NaN : Math.log(v);
      else if (kind === "log") v = v <= 0 ? NaN : Math.log10(v);
      else if (kind === "sqr") v = v * v;
      else if (kind === "fact") {
        if (v < 0 || v > 170 || v !== Math.floor(v)) v = NaN;
        else { let f = 1; for (let i = 2; i <= v; i++) f *= i; v = f; }
      }
      show(v); fresh = true;
    }
    function openParen() {
      parenStack.push({ acc, op });
      acc = null; op = null; fresh = true;
      parenInd.textContent = parenStack.length ? "(=" + parenStack.length : "";
    }
    function closeParen() {
      if (!parenStack.length) return;
      let r = op != null ? applyOp() : cur();
      const st = parenStack.pop();
      acc = st.acc; op = st.op;
      show(r); fresh = true;
      parenInd.textContent = parenStack.length ? "(=" + parenStack.length : "";
    }
    function syncMem() { memInd.textContent = memory !== 0 ? "M" : ""; }

    const win = WM.create({
      title: "Calculator", icon: "calc", appId: "calc",
      width: 262, height: 268, resizable: false, maximizable: false,
      menus: [
        { label: "View", items: () => [
          { label: "Standard", radio: true, checked: !sciMode, click: () => setSci(false) },
          { label: "Scientific", radio: true, checked: sciMode, click: () => setSci(true) }
        ]},
        { label: "Edit", items: () => [
          { label: "Copy", accel: "Ctrl+C", click: () => { try { navigator.clipboard.writeText(display); } catch (e) {} } },
          { label: "Paste", accel: "Ctrl+V", click: async () => {
            try {
              const t = await navigator.clipboard.readText();
              const n = parseFloat(t);
              if (!isNaN(n)) { show(n); fresh = true; }
            } catch (e) {}
          }}
        ]},
        { label: "Help", items: () => [
          { label: "Help Topics", click: () => W98.launch("help", "calc") },
          "-",
          { label: "About Calculator", click: () => Dialogs.about("Calculator", "calc") }
        ]}
      ]
    });

    const body = el("div", { class: "calc-body" });
    body.append(disp);

    const topRow = el("div", { class: "calc-grid", style: "grid-template-columns:26px repeat(3,1fr);gap:4px" });
    topRow.append(memInd);
    [["Backspace", back, "red"], ["CE", clearEntry, "red"], ["C", clearAll, "red"]].forEach(([t, fn, cls]) => {
      const b = el("button", { class: "btn calc-btn " + cls, text: t });
      b.addEventListener("click", fn);
      topRow.append(b);
    });
    body.append(topRow);

    /* scientific panel */
    const parenInd = el("div", { class: "calc-mem", style: "width:auto;min-width:26px;font-size:10px" });
    const sciPanel = el("div", { class: "calc-grid", style: "grid-template-columns:repeat(6,1fr);display:none" });
    const mkDegRad = (label, val) => {
      const r = el("label", { class: "checkline", style: "justify-content:center;font-size:10px" },
        el("input", { type: "radio", name: "calc-deg" }), label);
      const i = $("input", r);
      i.checked = degMode === val;
      i.addEventListener("change", () => { if (i.checked) degMode = val; });
      return r;
    };
    sciPanel.append(mkDegRad("Deg", true), mkDegRad("Rad", false), parenInd,
      ...[["sin", () => unary("sin")], ["cos", () => unary("cos")], ["tan", () => unary("tan")]].map(([t, fn]) => {
        const b = el("button", { class: "btn calc-btn blue", text: t });
        b.addEventListener("click", fn);
        return b;
      }));
    [["x^2", () => unary("sqr")], ["x^y", () => setOp("p")], ["n!", () => unary("fact")],
     ["ln", () => unary("ln")], ["log", () => unary("log")], ["pi", () => { show(Math.PI); fresh = true; }],
     ["(", openParen], [")", closeParen]].forEach(([t, fn]) => {
      const b = el("button", { class: "btn calc-btn blue", text: t });
      b.addEventListener("click", fn);
      sciPanel.append(b);
    });
    body.append(sciPanel);

    function setSci(v) {
      sciMode = v;
      Store.set("calcSci", v);
      sciPanel.style.display = v ? "" : "none";
      win.el.style.height = v ? "336px" : "268px";
    }

    const grid = el("div", { class: "calc-grid", style: "grid-template-columns:26px repeat(5,1fr)" });
    const rows = [
      ["MC", "7", "8", "9", "/", "sqrt"],
      ["MR", "4", "5", "6", "*", "%"],
      ["MS", "1", "2", "3", "-", "1/x"],
      ["M+", "0", "+/-", ".", "+", "="]
    ];
    for (const row of rows) {
      for (const key of row) {
        let cls = "btn calc-btn", fn;
        if (/^[0-9.]$/.test(key)) { cls += " blue"; fn = () => digit(key); }
        else if (["+", "-", "*", "/", "="].includes(key)) { cls += " red"; fn = key === "=" ? equals : () => setOp(key); }
        else if (key === "sqrt") { cls += " blue"; fn = () => unary("sqrt"); }
        else if (key === "%") { cls += " blue"; fn = () => unary("pct"); }
        else if (key === "1/x") { cls += " blue"; fn = () => unary("inv"); }
        else if (key === "+/-") { cls += " blue"; fn = () => unary("neg"); }
        else { cls += " red"; fn = () => {
          if (key === "MC") memory = 0;
          else if (key === "MR") { show(memory); fresh = true; }
          else if (key === "MS") memory = cur();
          else if (key === "M+") memory += cur();
          syncMem();
        }; }
        const b = el("button", { class: cls, text: key === "sqrt" ? "sqrt" : key });
        b.addEventListener("click", fn);
        grid.append(b);
      }
    }
    body.append(grid);
    win.body.append(body);
    if (sciMode) setSci(true);

    win.el.tabIndex = -1;
    win.el.addEventListener("keydown", (e) => {
      const k = e.key;
      if (/^[0-9]$/.test(k)) digit(k);
      else if (k === ".") digit(".");
      else if (["+", "-", "*", "/"].includes(k)) setOp(k);
      else if (k === "Enter" || k === "=") { e.preventDefault(); equals(); }
      else if (k === "Escape") clearAll();
      else if (k === "Backspace") back();
      else if (k === "%") unary("pct");
      else return;
      e.stopPropagation();
    });
    setTimeout(() => win.el.focus(), 50);
    return win;
  }
};

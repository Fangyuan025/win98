/* paint.js — MS Paint recreation */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.paint = {
  name: "Paint", icon: "paint",
  launch(path) {
    let curPath = null, dirty = false;
    let fg = "#000000", bg = "#ffffff";
    let tool = "pencil", lineW = 1;
    let undoStack = [], redoStack = [];
    let selection = null; // {x,y,w,h, data, floating, fx,fy}
    let sprayTimer = null;

    const PALETTE = [
      "#000000","#808080","#800000","#808000","#008000","#008080","#000080","#800080","#808040","#004040","#0080ff","#004080","#4000ff","#804000",
      "#ffffff","#c0c0c0","#ff0000","#ffff00","#00ff00","#00ffff","#0000ff","#ff00ff","#ffff80","#00ff80","#80ffff","#8080ff","#ff0080","#ff8040"
    ];
    const TOOLS = [
      ["select", "Select"], ["eraser", "Eraser"],
      ["fill", "Fill With Color"], ["picker", "Pick Color"],
      ["pencil", "Pencil"], ["brush", "Brush"],
      ["spray", "Airbrush"], ["text", "Text"], ["line", "Line"],
      ["rect", "Rectangle"], ["ellipse", "Ellipse"],
      ["rrect", "Rounded Rectangle"]
    ];

    /* tool button glyphs (12x12 pixmaps) */
    const TG = {
      select: `
k.k.k.k.k.k.
............
k.........k.
............
k.........k.
............
k.........k.
............
k.........k.
............
k.k.k.k.k.k.
............`,
      eraser: `
............
....kkkkkk..
...kwwwwwpk.
..kwwwwwppk.
.kwwwwwpppk.
.kwwwwpppk..
.kwwwpppk...
.kwwpppk....
.kwpppk.....
.kpppk......
.kkkk.......
............`,
      fill: `
.......kk...
......kddk..
.....kdddk..
....kkkddk..
..kkwwkkdk..
.kwwwwwwkk..
kwwwwwwwwk..
kwwwwwwwkc..
.kwwwwwkcc..
..kwwwkccc..
...kkk.ccc..
........c...`,
      picker: `
.........kk.
........kkkk
.......kkkk.
......kwkk..
.....kwk....
....kwk.....
...kwk......
..kwk.......
.kwk........
kwk.........
kk..........
............`,
      pencil: `
.........kk.
........kyk.
.......kyyk.
......kyyk..
.....kyyk...
....kyyk....
...kyyk.....
..kyyk......
.kkyk.......
.kkk........
.kk.........
............`,
      brush: `
.......kkk..
.......kkk..
.......kkk..
......kkk...
.....kdk....
....kdk.....
...kddk.....
..kdddk.....
..kdddk.....
..kddk......
...kk.......
............`,
      spray: `
..k.k.......
.k.k.k......
..k.k.......
...kkk......
...kdk......
...kdk......
...kdk......
...kdk......
...kdk......
...kdk......
...kkk......
............`,
      text: `
............
....kk......
....kk......
...kkkk.....
...kkkk.....
...k..k.....
..kk..kk....
..kkkkkk....
..k....k....
.kk....kk...
.kk....kk...
............`,
      line: `
..........k.
.........k..
........k...
.......k....
......k.....
.....k......
....k.......
...k........
..k.........
.k..........
k...........
............`,
      rect: `
............
kkkkkkkkkkk.
k.........k.
k.........k.
k.........k.
k.........k.
k.........k.
k.........k.
kkkkkkkkkkk.
............
............
............`,
      ellipse: `
............
...kkkkk....
..k.....k...
.k.......k..
k.........k.
k.........k.
k.........k.
.k.......k..
..k.....k...
...kkkkk....
............
............`,
      rrect: `
............
..kkkkkkk...
.k.......k..
k.........k.
k.........k.
k.........k.
k.........k.
k.........k.
.k.......k..
..kkkkkkk...
............
............`
    };

    const canvas = el("canvas");
    canvas.width = 400; canvas.height = 300;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const overlay = el("canvas", { style: "position:absolute;left:0;top:0;pointer-events:none" });
    overlay.width = 400; overlay.height = 300;
    const octx = overlay.getContext("2d");

    function pushUndo() {
      undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (undoStack.length > 12) undoStack.shift();
      redoStack.length = 0;
      dirty = true;
    }
    function undo() {
      commitSelection();
      if (!undoStack.length) return;
      redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      ctx.putImageData(undoStack.pop(), 0, 0);
    }
    function redo() {
      if (!redoStack.length) return;
      undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      ctx.putImageData(redoStack.pop(), 0, 0);
    }

    /* ---------- selection ---------- */
    function commitSelection() {
      if (!selection) return;
      if (selection.floating) ctx.drawImage(selection.float, selection.fx, selection.fy);
      selection = null;
      octx.clearRect(0, 0, overlay.width, overlay.height);
    }
    function drawSelectionOverlay() {
      octx.clearRect(0, 0, overlay.width, overlay.height);
      if (!selection) return;
      const { fx, fy, w, h } = selection;
      if (selection.floating) octx.drawImage(selection.float, fx, fy);
      octx.strokeStyle = "#000";
      octx.setLineDash([3, 3]);
      octx.strokeRect((selection.floating ? fx : selection.x) + 0.5, (selection.floating ? fy : selection.y) + 0.5, w, h);
      octx.setLineDash([]);
    }

    /* ---------- drawing ---------- */
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return { x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top) };
    }
    function colorFor(e) { return e.buttons & 2 ? bg : fg; }
    let drawing = false, start = null, last = null, drawBtn = 0;

    function floodFill(x, y, hex) {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = img.data, W = canvas.width, H = canvas.height;
      const i0 = (y * W + x) * 4;
      const tr = d[i0], tg = d[i0 + 1], tb = d[i0 + 2];
      const R = parseInt(hex.slice(1, 3), 16), G = parseInt(hex.slice(3, 5), 16), B = parseInt(hex.slice(5, 7), 16);
      if (tr === R && tg === G && tb === B) return;
      const stack = [[x, y]];
      while (stack.length) {
        const [cx, cy] = stack.pop();
        if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue;
        const i = (cy * W + cx) * 4;
        if (d[i] !== tr || d[i + 1] !== tg || d[i + 2] !== tb) continue;
        d[i] = R; d[i + 1] = G; d[i + 2] = B; d[i + 3] = 255;
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
      }
      ctx.putImageData(img, 0, 0);
    }
    function pixelAt(x, y) {
      const d = ctx.getImageData(x, y, 1, 1).data;
      return "#" + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, "0")).join("");
    }
    function lineTo_(x0, y0, x1, y1, color, w) {
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x0 + 0.5, y0 + 0.5); ctx.lineTo(x1 + 0.5, y1 + 0.5); ctx.stroke();
    }
    function shapePreview(p) {
      octx.clearRect(0, 0, overlay.width, overlay.height);
      octx.strokeStyle = fg; octx.lineWidth = lineW;
      const x = Math.min(start.x, p.x), y = Math.min(start.y, p.y);
      const w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y);
      octx.beginPath();
      if (tool === "line") { octx.moveTo(start.x + 0.5, start.y + 0.5); octx.lineTo(p.x + 0.5, p.y + 0.5); }
      else if (tool === "rect") octx.rect(x + 0.5, y + 0.5, w, h);
      else if (tool === "rrect") octx.roundRect(x + 0.5, y + 0.5, w, h, 8);
      else if (tool === "ellipse") octx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      else if (tool === "select") { octx.setLineDash([3, 3]); octx.rect(x + 0.5, y + 0.5, w, h); }
      octx.stroke(); octx.setLineDash([]);
    }
    function shapeCommit(p) {
      const x = Math.min(start.x, p.x), y = Math.min(start.y, p.y);
      const w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y);
      if (tool === "select") {
        if (w > 2 && h > 2) selection = { x, y, w, h, fx: x, fy: y, floating: false };
        drawSelectionOverlay();
        return;
      }
      pushUndo();
      ctx.strokeStyle = drawBtn === 2 ? bg : fg; ctx.lineWidth = lineW;
      ctx.beginPath();
      if (tool === "line") { ctx.moveTo(start.x + 0.5, start.y + 0.5); ctx.lineTo(p.x + 0.5, p.y + 0.5); }
      else if (tool === "rect") ctx.rect(x + 0.5, y + 0.5, w, h);
      else if (tool === "rrect") ctx.roundRect(x + 0.5, y + 0.5, w, h, 8);
      else if (tool === "ellipse" && w && h) ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    function floatSelection() {
      if (!selection || selection.floating) return;
      const { x, y, w, h } = selection;
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(canvas, x, y, w, h, 0, 0, w, h);
      selection.float = c;
      selection.floating = true;
      pushUndo();
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, w, h);
    }

    canvas.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const p = pos(e);
      drawBtn = e.button;
      /* selection interactions */
      if (selection) {
        const sx = selection.floating ? selection.fx : selection.x;
        const sy = selection.floating ? selection.fy : selection.y;
        if (p.x >= sx && p.x < sx + selection.w && p.y >= sy && p.y < sy + selection.h && tool === "select") {
          floatSelection();
          drawing = "moveSel";
          last = p;
          return;
        }
        commitSelection();
      }
      if (tool === "text") {
        const fontPx = 12 + lineW * 3;
        const inp = el("input", {
          type: "text",
          style: `position:absolute;left:${p.x}px;top:${p.y - 4}px;font:${fontPx}px Arial;border:1px dotted #808080;background:transparent;color:${fg};min-width:70px;outline:none;padding:0`
        });
        holder.append(inp);
        setTimeout(() => inp.focus(), 20);
        let done = false;
        const commit = (ok2) => {
          if (done) return;
          done = true;
          const txt = inp.value;
          inp.remove();
          if (ok2 && txt) {
            pushUndo();
            ctx.font = fontPx + "px Arial";
            ctx.fillStyle = fg;
            ctx.textBaseline = "top";
            ctx.fillText(txt, p.x + 1, p.y - 3);
          }
        };
        inp.addEventListener("keydown", ev => {
          ev.stopPropagation();
          if (ev.key === "Enter") commit(true);
          if (ev.key === "Escape") commit(false);
        });
        inp.addEventListener("blur", () => commit(true));
        inp.addEventListener("mousedown", ev => ev.stopPropagation());
        return;
      }
      if (tool === "fill") { pushUndo(); floodFill(p.x, p.y, colorFor(e) || fg); return; }
      if (tool === "picker") { const c = pixelAt(p.x, p.y); if (e.button === 2) bg = c; else fg = c; syncColors(); return; }
      drawing = true; start = p; last = p;
      if (tool === "pencil" || tool === "brush" || tool === "eraser") {
        pushUndo();
        const col = tool === "eraser" ? bg : colorFor(e);
        lineTo_(p.x, p.y, p.x, p.y, col, tool === "pencil" ? 1 : (tool === "eraser" ? lineW * 2 + 4 : lineW + 2));
      } else if (tool === "spray") {
        pushUndo();
        const sprayOnce = () => {
          ctx.fillStyle = colorFor(e) || fg;
          for (let i = 0; i < 12; i++) {
            const a = Math.random() * Math.PI * 2, r = Math.random() * 8;
            ctx.fillRect(Math.round(last.x + Math.cos(a) * r), Math.round(last.y + Math.sin(a) * r), 1, 1);
          }
        };
        sprayOnce();
        sprayTimer = setInterval(sprayOnce, 50);
      }
    });
    window.addEventListener("mousemove", (e) => {
      if (!drawing) return;
      const p = pos(e);
      if (drawing === "moveSel") {
        selection.fx += p.x - last.x;
        selection.fy += p.y - last.y;
        last = p;
        drawSelectionOverlay();
        return;
      }
      if (tool === "pencil" || tool === "brush" || tool === "eraser") {
        const col = tool === "eraser" ? bg : (drawBtn === 2 ? bg : fg);
        lineTo_(last.x, last.y, p.x, p.y, col, tool === "pencil" ? 1 : (tool === "eraser" ? lineW * 2 + 4 : lineW + 2));
        last = p;
      } else if (tool === "spray") { last = p; }
      else if (["line", "rect", "rrect", "ellipse", "select"].includes(tool)) shapePreview(p);
      posCell.textContent = p.x + "," + p.y;
    });
    window.addEventListener("mouseup", (e) => {
      if (!drawing) return;
      const p = pos(e);
      if (drawing === "moveSel") { drawing = false; return; }
      drawing = false;
      clearInterval(sprayTimer);
      if (["line", "rect", "rrect", "ellipse", "select"].includes(tool)) {
        octx.clearRect(0, 0, overlay.width, overlay.height);
        shapeCommit(p);
      }
    });
    canvas.addEventListener("mousemove", (e) => {
      const p = pos(e);
      posCell.textContent = p.x + "," + p.y;
    });
    canvas.addEventListener("contextmenu", e => e.preventDefault());

    /* ---------- file ops ---------- */
    function baseName() { return curPath ? FS.segs(curPath).pop() : "untitled"; }
    function syncTitle() { win.setTitle(baseName() + " - Paint"); }
    async function confirmSave() {
      if (!dirty) return true;
      const r = await WM.msgbox({
        title: "Paint", icon: "warning",
        text: "Save changes to " + baseName() + "?",
        buttons: ["Yes", "No", "Cancel"], cancelValue: "Cancel"
      });
      if (r === "Cancel") return false;
      if (r === "Yes") return await doSave();
      return true;
    }
    async function doSave() {
      if (!curPath) return doSaveAs();
      FS.writeFile(curPath, canvas.toDataURL("image/png"));
      W98.addRecent(curPath);
      dirty = false;
      return true;
    }
    async function doSaveAs() {
      const p = await Dialogs.filePick({
        mode: "save", title: "Save As", ext: [".bmp", ".png"], typeName: "Bitmap Files (*.bmp)",
        startDir: FS.DOCS + "/My Pictures", defaultName: baseName() === "untitled" ? "untitled.bmp" : baseName()
      });
      if (!p) return false;
      curPath = p;
      FS.writeFile(p, canvas.toDataURL("image/png"));
      W98.addRecent(p);
      dirty = false; syncTitle();
      return true;
    }
    function loadImage(p) {
      const data = FS.readFile(p);
      curPath = p; dirty = false;
      if (data && String(data).startsWith("data:image")) {
        const img = new Image();
        img.onload = () => {
          resizeCanvas(img.width, img.height, true);
          ctx.drawImage(img, 0, 0);
        };
        img.src = data;
      } else {
        resizeCanvas(400, 300, true);
      }
      syncTitle();
      W98.addRecent(p);
    }
    async function doNew() {
      if (!(await confirmSave())) return;
      commitSelection();
      resizeCanvas(400, 300, true);
      curPath = null; dirty = false; syncTitle();
    }
    async function doOpen() {
      if (!(await confirmSave())) return;
      const p = await Dialogs.filePick({
        mode: "open", title: "Open", ext: [".bmp", ".png"], typeName: "Bitmap Files (*.bmp;*.png)",
        startDir: FS.DOCS + "/My Pictures"
      });
      if (p) loadImage(p);
    }
    function resizeCanvas(w, h, clear) {
      const old = clear ? null : ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = w; canvas.height = h;
      overlay.width = w; overlay.height = h;
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      if (old) ctx.putImageData(old, 0, 0);
      undoStack.length = 0; redoStack.length = 0;
      sizeCell.textContent = w + " x " + h;
    }
    function attributesDialog() {
      const dw = WM.create({
        title: "Attributes", icon: "paint", width: 280, height: 0,
        resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
      });
      dw.el.style.height = "auto";
      const wi = el("input", { type: "text", class: "field", value: String(canvas.width), style: "width:60px" });
      const hi = el("input", { type: "text", class: "field", value: String(canvas.height), style: "width:60px" });
      dw.body.append(
        el("div", { style: "display:grid;grid-template-columns:auto auto;gap:8px 10px;padding:14px 18px 4px;align-items:center" },
          el("span", { text: "Width:" }), wi, el("span", { text: "Height:" }), hi),
        (() => {
          const r = el("div", { class: "msgbox-btns" });
          const ok = el("button", { class: "btn default", text: "OK" });
          const cancel = el("button", { class: "btn", text: "Cancel" });
          ok.addEventListener("click", () => {
            const w = clamp(parseInt(wi.value) || 400, 16, 1600);
            const h = clamp(parseInt(hi.value) || 300, 16, 1200);
            pushUndo(); resizeCanvas(w, h, false);
            dw.close();
          });
          cancel.addEventListener("click", () => dw.close());
          r.append(ok, cancel); return r;
        })()
      );
    }
    function flipRotate(op) {
      commitSelection();
      pushUndo();
      const c = document.createElement("canvas");
      const w = canvas.width, h = canvas.height;
      c.width = (op === "r90" || op === "r270") ? h : w;
      c.height = (op === "r90" || op === "r270") ? w : h;
      const cx = c.getContext("2d");
      cx.save();
      if (op === "fliph") { cx.translate(w, 0); cx.scale(-1, 1); }
      else if (op === "flipv") { cx.translate(0, h); cx.scale(1, -1); }
      else if (op === "r90") { cx.translate(h, 0); cx.rotate(Math.PI / 2); }
      else if (op === "r180") { cx.translate(w, h); cx.rotate(Math.PI); }
      else if (op === "r270") { cx.translate(0, w); cx.rotate(-Math.PI / 2); }
      cx.drawImage(canvas, 0, 0);
      cx.restore();
      canvas.width = c.width; canvas.height = c.height;
      overlay.width = c.width; overlay.height = c.height;
      ctx.drawImage(c, 0, 0);
      sizeCell.textContent = canvas.width + " x " + canvas.height;
    }

    let clipboardImg = null;
    function copySel() {
      if (!selection) return;
      floatSelection();
      clipboardImg = selection.float;
    }
    function cutSel() {
      if (!selection) return;
      floatSelection();
      clipboardImg = selection.float;
      selection = null;
      octx.clearRect(0, 0, overlay.width, overlay.height);
    }
    function pasteSel() {
      if (!clipboardImg) return;
      commitSelection();
      setTool("select");
      selection = { x: 4, y: 4, w: clipboardImg.width, h: clipboardImg.height, fx: 4, fy: 4, floating: true, float: clipboardImg };
      drawSelectionOverlay();
    }

    /* ---------- window ---------- */
    const win = WM.create({
      title: "untitled - Paint", icon: "paint",
      width: 620, height: 480, minWidth: 400, minHeight: 300,
      statusbar: [{ text: "For Help, click Help Topics on the Help Menu." }, { text: "", width: 90 }, { text: "400 x 300", width: 90 }],
      menus: [
        { label: "File", items: () => [
          { label: "New", click: doNew },
          { label: "Open...", click: doOpen },
          { label: "Save", click: doSave },
          { label: "Save As...", click: doSaveAs },
          "-",
          { label: "Set As Wallpaper (Tiled)", click: () => {
            Store.set("wallpaperCustom", canvas.toDataURL("image/png"));
            W98.Desktop.applyWallpaper("(Custom)", "tile");
          }},
          { label: "Set As Wallpaper (Centered)", click: () => {
            Store.set("wallpaperCustom", canvas.toDataURL("image/png"));
            W98.Desktop.applyWallpaper("(Custom)", "center");
          }},
          "-",
          { label: "Print...", accel: "Ctrl+P", click: () => W98.Print.submit({ name: baseName(), app: "Paint", pages: 1 }) },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Edit", items: () => [
          { label: "Undo", accel: "Ctrl+Z", disabled: !undoStack.length, click: undo },
          { label: "Repeat", accel: "F4", disabled: !redoStack.length, click: redo },
          "-",
          { label: "Cut", accel: "Ctrl+X", disabled: !selection, click: cutSel },
          { label: "Copy", accel: "Ctrl+C", disabled: !selection, click: copySel },
          { label: "Paste", accel: "Ctrl+V", disabled: !clipboardImg, click: pasteSel },
          { label: "Clear Selection", accel: "Del", disabled: !selection, click: () => {
            floatSelection(); selection = null; octx.clearRect(0, 0, overlay.width, overlay.height);
          }},
          "-",
          { label: "Select All", accel: "Ctrl+A", click: () => {
            setTool("select");
            selection = { x: 0, y: 0, w: canvas.width, h: canvas.height, fx: 0, fy: 0, floating: false };
            drawSelectionOverlay();
          }}
        ]},
        { label: "Image", items: () => [
          { label: "Flip Horizontal", click: () => flipRotate("fliph") },
          { label: "Flip Vertical", click: () => flipRotate("flipv") },
          "-",
          { label: "Rotate 90°", click: () => flipRotate("r90") },
          { label: "Rotate 180°", click: () => flipRotate("r180") },
          { label: "Rotate 270°", click: () => flipRotate("r270") },
          "-",
          { label: "Attributes...", click: attributesDialog },
          { label: "Clear Image", click: () => { commitSelection(); pushUndo(); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height); } }
        ]},
        { label: "Colors", items: () => [
          { label: "Edit Colors...", click: () => {
            const inp = el("input", { type: "color", value: fg });
            inp.style.cssText = "position:fixed;left:-100px;top:-100px";
            document.body.append(inp);
            inp.addEventListener("input", () => { fg = inp.value; syncColors(); });
            inp.addEventListener("change", () => setTimeout(() => inp.remove(), 100));
            inp.click();
          }}
        ]},
        { label: "Help", items: () => [
          { label: "Help Topics", click: () => W98.launch("help", "paint") },
          "-",
          { label: "About Paint", click: () => Dialogs.about("Paint", "paint") }
        ]}
      ],
      onBeforeClose: () => confirmSave()
    });

    const wrap = el("div", { class: "paint-wrap" });
    const toolsCol = el("div", { style: "display:flex;flex-direction:column;flex:none" });
    const toolsEl = el("div", { class: "paint-tools" });
    const optsEl = el("div", { class: "paint-opts" });
    toolsCol.append(toolsEl, optsEl);

    const toolBtns = {};
    for (const [id, title] of TOOLS) {
      const b = el("button", { class: "ptool", title });
      b.style.backgroundImage = `url(${pixmap(TG[id], Icons.P, 2)})`;
      b.style.backgroundSize = "24px 24px";
      b.addEventListener("click", () => setTool(id));
      toolBtns[id] = b;
      toolsEl.append(b);
    }
    function setTool(id) {
      commitSelection();
      tool = id;
      for (const k in toolBtns) toolBtns[k].classList.toggle("on", k === id);
      renderOpts();
    }
    function renderOpts() {
      optsEl.innerHTML = "";
      if (["line", "brush", "eraser", "rect", "rrect", "ellipse", "text"].includes(tool)) {
        [1, 2, 3, 5, 8].forEach(w => {
          const r = el("button", { class: "linew" + (lineW === w ? " on" : "") }, el("i", { style: "height:" + Math.min(w, 8) + "px" }));
          r.addEventListener("click", () => { lineW = w; renderOpts(); });
          optsEl.append(r);
        });
      }
    }

    const canvasArea = el("div", { class: "paint-canvas-area" });
    const holder = el("div", { class: "paint-canvas-holder" });
    holder.append(canvas, overlay);
    canvasArea.append(holder);
    wrap.append(toolsCol, canvasArea);

    /* color bar */
    const colorsBar = el("div", { class: "paint-colors" });
    const curBox = el("div", { class: "paint-cur" });
    const fgBox = el("div", { class: "fg" });
    const bgBox = el("div", { class: "bg" });
    curBox.append(fgBox, bgBox);
    function syncColors() { fgBox.style.background = fg; bgBox.style.background = bg; }
    syncColors();
    const pal = el("div", { class: "paint-pal" });
    for (const c of PALETTE) {
      const b = el("button", { class: "pc", style: "background:" + c });
      b.addEventListener("mousedown", (e) => {
        if (e.button === 2) bg = c; else fg = c;
        syncColors();
      });
      b.addEventListener("contextmenu", e => e.preventDefault());
      pal.append(b);
    }
    colorsBar.append(curBox, pal);
    win.body.append(wrap, colorsBar);

    const posCell = win.sbCells[1], sizeCell = win.sbCells[2];
    setTool("pencil");

    win.el.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); doSave().then(syncTitle); }
      else if (e.key === "Escape" && selection) { commitSelection(); }
      else if (e.key === "Delete" && selection) { floatSelection(); selection = null; octx.clearRect(0, 0, overlay.width, overlay.height); }
    });

    if (path) loadImage(path);
    return win;
  }
};

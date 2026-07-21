/* photogoo.js — PhotoGoo: smear, bulge and twirl a picture until it apologizes.
   The late-90s "goo" toy, rebuilt on canvas. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  function sampleFace(w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const x = c.getContext("2d");
    x.fillStyle = "#8fc1e8"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#f2c9a0";
    x.beginPath(); x.ellipse(w / 2, h * 0.52, w * 0.28, h * 0.36, 0, 0, 7); x.fill();
    x.fillStyle = "#6a4a28";
    x.beginPath(); x.ellipse(w / 2, h * 0.26, w * 0.3, h * 0.14, 0, Math.PI, 0); x.fill();
    x.fillStyle = "#fff";
    x.beginPath(); x.ellipse(w * 0.4, h * 0.45, w * 0.06, h * 0.045, 0, 0, 7); x.fill();
    x.beginPath(); x.ellipse(w * 0.6, h * 0.45, w * 0.06, h * 0.045, 0, 0, 7); x.fill();
    x.fillStyle = "#204060";
    x.beginPath(); x.arc(w * 0.4, h * 0.455, w * 0.022, 0, 7); x.fill();
    x.beginPath(); x.arc(w * 0.6, h * 0.455, w * 0.022, 0, 7); x.fill();
    x.fillStyle = "#e0a880";
    x.beginPath(); x.ellipse(w * 0.5, h * 0.56, w * 0.035, h * 0.05, 0, 0, 7); x.fill();
    x.strokeStyle = "#a05840"; x.lineWidth = Math.max(2, w * 0.012); x.lineCap = "round";
    x.beginPath(); x.arc(w * 0.5, h * 0.64, w * 0.1, 0.25, Math.PI - 0.25); x.stroke();
    x.fillStyle = "#3a70b0";
    x.fillRect(0, h * 0.85, w, h * 0.15);
    x.font = "bold " + Math.max(10, w * 0.05) + "px Arial";
    x.fillStyle = "#fff"; x.textAlign = "center";
    x.fillText("GOO ME", w / 2, h * 0.94);
    x.textAlign = "left";
    return c;
  }

  W98.Apps.photogoo = {
    name: "PhotoGoo", icon: "photogoo", single: true,
    launch() {
      const CW = 380, CH = 300;
      const win = WM.create({
        title: "PhotoGoo - untitled goo", icon: "photogoo", appId: "photogoo",
        width: 470, height: 400, resizable: false, maximizable: false,
        statusbar: [{ text: "Drag on the picture to goo it" }],
        menus: [
          { label: "File", items: () => [
            { label: "New Victim (sample face)", click: () => { loadCanvas(sampleFace(CW, CH)); } },
            { label: "Open Picture...", click: openPic },
            { label: "Save to My Pictures", click: save },
            "-",
            { label: "Exit", click: () => win.close() }
          ]},
          { label: "Help", items: () => [
            { label: "About PhotoGoo", click: () => Dialogs.about("PhotoGoo", "photogoo", ["Every face deserves consequences.", "No pixels were permanently harmed (use File > New Victim)."]) }
          ]}
        ]
      });

      const cv = el("canvas", { width: CW, height: CH, style: "flex:none;margin:6px auto;border:2px solid #404040;cursor:crosshair;background:#000" });
      const x = cv.getContext("2d");
      const toolbar = el("div", { style: "flex:none;display:flex;gap:4px;justify-content:center;padding:4px" });
      let tool = "smear";
      const toolBtns = {};
      [["smear", "Smear"], ["bulge", "Bulge"], ["pinch", "Pinch"], ["twirl", "Twirl"]].forEach(([id, label]) => {
        const b = el("button", { class: "btn" + (tool === id ? " default" : ""), text: label, style: "min-width:60px" });
        b.addEventListener("click", () => {
          tool = id;
          Object.entries(toolBtns).forEach(([tid, tb]) => tb.classList.toggle("default", tid === id));
        });
        toolBtns[id] = b;
        toolbar.append(b);
      });
      const resetB = el("button", { class: "btn", text: "Undo All", style: "min-width:60px" });
      toolbar.append(resetB);
      win.body.append(cv, toolbar);

      let original = null;
      function loadCanvas(src) {
        original = document.createElement("canvas");
        original.width = CW; original.height = CH;
        original.getContext("2d").drawImage(src, 0, 0, CW, CH);
        x.drawImage(original, 0, 0);
      }
      loadCanvas(sampleFace(CW, CH));
      resetB.addEventListener("click", () => { if (original) x.drawImage(original, 0, 0); Sound.play("click"); });

      async function openPic() {
        const p = await Dialogs.filePick({ mode: "open", title: "Open Picture", ext: [".bmp", ".png"], typeName: "Pictures (*.bmp, *.png)", startDir: "C:/My Documents/My Pictures" });
        if (!p) return;
        const data = FS.readFile(p);
        if (!data || !String(data).startsWith("data:image")) { WM.msgbox({ title: "PhotoGoo", icon: "error", text: "That file is not a picture, or is shy." }); return; }
        const img = new Image();
        img.onload = () => { loadCanvas(img); win.setTitle("PhotoGoo - " + FS.segs(p).pop()); };
        img.src = data;
      }
      function save() {
        const name = FS.uniqueName("C:/My Documents/My Pictures", "goo_masterpiece", ".png");
        FS.writeFile("C:/My Documents/My Pictures/" + name, cv.toDataURL("image/png"));
        Sound.play("ding");
        win.setStatus(0, "Saved as " + name + " in My Pictures");
      }

      /* --- warp engine: pixel-space displacement in a radius --- */
      const R = 42;
      function warp(cx2, cy2, fn) {
        const x0 = Math.max(0, cx2 - R | 0), y0 = Math.max(0, cy2 - R | 0);
        const w = Math.min(CW - x0, R * 2), h = Math.min(CH - y0, R * 2);
        if (w <= 0 || h <= 0) return;
        const src = x.getImageData(x0, y0, w, h);
        const dst = x.createImageData(w, h);
        const sd = src.data, dd = dst.data;
        for (let py = 0; py < h; py++) {
          for (let px = 0; px < w; px++) {
            const gx2 = x0 + px, gy2 = y0 + py;
            const dx = gx2 - cx2, dy = gy2 - cy2;
            const d = Math.sqrt(dx * dx + dy * dy);
            let sx2 = px, sy2 = py;
            if (d < R) {
              const t = 1 - d / R;           /* 1 at center, 0 at edge */
              const [ox, oy] = fn(dx, dy, d, t);
              sx2 = px + ox; sy2 = py + oy;
            }
            sx2 = Math.max(0, Math.min(w - 1, sx2 | 0));
            sy2 = Math.max(0, Math.min(h - 1, sy2 | 0));
            const si = (sy2 * w + sx2) * 4, di = (py * w + px) * 4;
            dd[di] = sd[si]; dd[di + 1] = sd[si + 1]; dd[di + 2] = sd[si + 2]; dd[di + 3] = 255;
          }
        }
        x.putImageData(dst, x0, y0);
      }

      let down = false, lx = 0, ly = 0;
      function posOf(e) {
        const r = cv.getBoundingClientRect();
        const sx = r.width ? CW / r.width : 1, sy = r.height ? CH / r.height : 1;
        return [(e.clientX - r.x) * sx, (e.clientY - r.y) * sy];
      }
      cv.addEventListener("mousedown", (e) => {
        down = true;
        [lx, ly] = posOf(e);
        if (tool === "bulge") warp(lx, ly, (dx, dy, d, t) => [-dx * t * 0.5, -dy * t * 0.5]);
        if (tool === "pinch") warp(lx, ly, (dx, dy, d, t) => [dx * t * 0.5, dy * t * 0.5]);
        if (tool === "twirl") warp(lx, ly, (dx, dy, d, t) => {
          const a = t * 1.4;
          const ca = Math.cos(a), sa = Math.sin(a);
          return [(dx * ca - dy * sa) - dx, (dx * sa + dy * ca) - dy];
        });
        e.preventDefault();
      });
      window.addEventListener("mousemove", (e) => {
        if (!down || win.closed) return;
        const [mx, my] = posOf(e);
        if (tool === "smear") {
          const dx = mx - lx, dy = my - ly;
          if (Math.abs(dx) + Math.abs(dy) > 1) {
            warp(mx, my, (px, py, d, t) => [-dx * t * 0.9, -dy * t * 0.9]);
            lx = mx; ly = my;
          }
        } else {
          /* dragging with bulge/pinch/twirl keeps applying gently */
          if (Math.abs(mx - lx) + Math.abs(my - ly) > 6) {
            lx = mx; ly = my;
            if (tool === "bulge") warp(mx, my, (dx2, dy2, d, t) => [-dx2 * t * 0.3, -dy2 * t * 0.3]);
            if (tool === "pinch") warp(mx, my, (dx2, dy2, d, t) => [dx2 * t * 0.3, dy2 * t * 0.3]);
            if (tool === "twirl") warp(mx, my, (dx2, dy2, d, t) => {
              const a = t * 0.8, ca = Math.cos(a), sa = Math.sin(a);
              return [(dx2 * ca - dy2 * sa) - dx2, (dx2 * sa + dy2 * ca) - dy2];
            });
          }
        }
      });
      window.addEventListener("mouseup", () => { down = false; });
      return win;
    }
  };
})();

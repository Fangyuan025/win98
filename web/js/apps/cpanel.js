/* cpanel.js — Display, Date/Time, Sounds, System + screensavers */
"use strict";
W98.Apps = W98.Apps || {};

/* ================= Screensaver engine ================= */
W98.Screensaver = (() => {
  let idleTimer = null, active = null;

  function config() {
    return { name: Store.get("ssName", "(None)"), wait: Store.get("ssWait", 15) };
  }
  function resetIdle() {
    clearTimeout(idleTimer);
    const { name, wait } = config();
    if (name === "(None)") return;
    idleTimer = setTimeout(() => show(name), wait * 60 * 1000);
  }
  function show(name) {
    if (active) return;
    const cv = el("canvas", { style: "position:fixed;inset:0;z-index:99998;background:#000;cursor:none" });
    const scr = document.getElementById("screen");
    cv.width = Math.max(window.innerWidth, scr ? scr.offsetWidth : 0, 640);
    cv.height = Math.max(window.innerHeight, scr ? scr.offsetHeight : 0, 480);
    document.body.append(cv);
    const ctx = cv.getContext("2d");
    let raf, t = 0;
    const W = cv.width, H = cv.height;

    if (name === "Starfield") {
      const stars = Array.from({ length: 220 }, () => ({
        x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 0.9 + 0.1
      }));
      const step = () => {
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff";
        for (const s of stars) {
          s.z -= 0.006;
          if (s.z <= 0.02) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; }
          const px = W / 2 + s.x / s.z * W / 2;
          const py = H / 2 + s.y / s.z * H / 2;
          const sz = Math.max(1, (1 - s.z) * 3.2);
          if (px >= 0 && px < W && py >= 0 && py < H) ctx.fillRect(px, py, sz, sz);
        }
        raf = requestAnimationFrame(step);
      };
      step();
    } else if (name === "Mystify") {
      const mkPoly = (hue) => ({
        pts: Array.from({ length: 4 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() * 4 + 2) * (Math.random() < .5 ? -1 : 1), vy: (Math.random() * 4 + 2) * (Math.random() < .5 ? -1 : 1) })),
        trail: [], hue
      });
      const polys = [mkPoly(140), mkPoly(300)];
      const step = () => {
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
        for (const p of polys) {
          for (const pt of p.pts) {
            pt.x += pt.vx; pt.y += pt.vy;
            if (pt.x < 0 || pt.x > W) pt.vx *= -1;
            if (pt.y < 0 || pt.y > H) pt.vy *= -1;
          }
          p.trail.push(p.pts.map(pt => ({ x: pt.x, y: pt.y })));
          if (p.trail.length > 14) p.trail.shift();
          p.hue = (p.hue + 1.2) % 360;
          p.trail.forEach((poly, i) => {
            ctx.strokeStyle = `hsl(${(p.hue + i * 6) % 360}, 100%, ${30 + i * 4}%)`;
            ctx.beginPath();
            poly.forEach((pt, j) => j ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y));
            ctx.closePath(); ctx.stroke();
          });
        }
        raf = requestAnimationFrame(step);
      };
      step();
    } else if (name === "Flying Windows") {
      const flag = new Image();
      flag.src = Icons.bigFlag(6);
      const items = Array.from({ length: 40 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 0.9 + 0.1 }));
      const step = () => {
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
        for (const s of items) {
          s.z -= 0.005;
          if (s.z <= 0.03) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; }
          const px = W / 2 + s.x / s.z * W / 2;
          const py = H / 2 + s.y / s.z * H / 2;
          const sz = (1 - s.z) * 48 + 4;
          const ar = flag.naturalWidth ? flag.naturalHeight / flag.naturalWidth : 1;
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(flag, px, py, sz, sz * ar);
        }
        raf = requestAnimationFrame(step);
      };
      step();
    } else if (name === "Pipes") {
      // fake-3D pipes: thick tubes with highlights, orthogonal walk, elbow joints
      const GRID = 26;
      const COLORS = [["#005f00", "#00c000", "#80ff80"], ["#00005f", "#0000d0", "#8080ff"],
                      ["#5f0000", "#d00000", "#ff8080"], ["#5f5f00", "#c0c000", "#ffff80"],
                      ["#005f5f", "#00b0b0", "#80ffff"]];
      let pipe = null, segs = 0;
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      const newPipe = () => {
        pipe = {
          x: Math.round(W / GRID / 2 + (Math.random() - 0.5) * 10) * GRID,
          y: Math.round(H / GRID / 2 + (Math.random() - 0.5) * 8) * GRID,
          dir: [[GRID, 0], [-GRID, 0], [0, GRID], [0, -GRID]][(Math.random() * 4) | 0],
          col: COLORS[(Math.random() * COLORS.length) | 0]
        };
      };
      const joint = (x2, y2) => {
        const [dk, md, hi] = pipe.col;
        const g = ctx.createRadialGradient(x2 - 3, y2 - 3, 1, x2, y2, 10);
        g.addColorStop(0, hi); g.addColorStop(0.55, md); g.addColorStop(1, dk);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x2, y2, 10, 0, Math.PI * 2); ctx.fill();
      };
      newPipe();
      let last = 0;
      const step = (ts) => {
        raf = requestAnimationFrame(step);
        if (ts - last < 45) return;
        last = ts;
        const [dk, md, hi] = pipe.col;
        const nx = pipe.x + pipe.dir[0], ny = pipe.y + pipe.dir[1];
        if (nx < GRID || nx > W - GRID || ny < GRID || ny > H - GRID) {
          pipe.dir = [[GRID, 0], [-GRID, 0], [0, GRID], [0, -GRID]][(Math.random() * 4) | 0];
          return;
        }
        // tube segment: dark base, mid body, bright highlight
        const seg = (w2, col, off) => {
          ctx.strokeStyle = col; ctx.lineWidth = w2; ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(pipe.x + (off || 0), pipe.y + (off || 0));
          ctx.lineTo(nx + (off || 0), ny + (off || 0));
          ctx.stroke();
        };
        seg(16, dk); seg(11, md); seg(4, hi, -3);
        if (Math.random() < 0.3) {
          joint(nx, ny);
          const choices = pipe.dir[0] ? [[0, GRID], [0, -GRID]] : [[GRID, 0], [-GRID, 0]];
          pipe.dir = choices[(Math.random() * 2) | 0];
        }
        pipe.x = nx; pipe.y = ny;
        segs++;
        if (segs % 90 === 0) newPipe();
        if (segs > 700) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); segs = 0; newPipe(); }
      };
      raf = requestAnimationFrame(step);
    } else if (name === "Plasma") {
      const LW = 160, LH = 100;
      const lo = document.createElement("canvas");
      lo.width = LW; lo.height = LH;
      const lx2 = lo.getContext("2d");
      const img = lx2.createImageData(LW, LH);
      let pt = 0;
      const step = () => {
        pt++;
        const d = img.data;
        for (let py = 0; py < LH; py++) {
          for (let px = 0; px < LW; px++) {
            const v = Math.sin(px / 11 + pt / 16) + Math.sin(py / 9 - pt / 20) +
              Math.sin((px + py) / 13 + pt / 11) +
              Math.sin(Math.hypot(px - LW / 2, py - LH / 2) / 7 - pt / 13);
            const i = (py * LW + px) * 4;
            d[i] = 128 + 127 * Math.sin(v * 1.57);
            d[i + 1] = 128 + 127 * Math.sin(v * 1.57 + 2.1);
            d[i + 2] = 128 + 127 * Math.sin(v * 1.57 + 4.2);
            d[i + 3] = 255;
          }
        }
        lx2.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(lo, 0, 0, W, H);
        raf = setTimeout(step, 50);
      };
      step();
    } else if (name === "3D Maze") {
      /* the one everyone watched instead of working: a raycast corridor crawl */
      const MZ = [
        "###############",
        "#.....#...#...#",
        "#.###.#.#.#.#.#",
        "#.#...#.#...#.#",
        "#.#.###.#####.#",
        "#.#.....#.....#",
        "#.#####.#.###.#",
        "#.....#.#.#...#",
        "#####.#.#.#.###",
        "#.....#.#.#...#",
        "#.###.#.#.###.#",
        "#.#...#.......#",
        "###############"
      ].map(r => r.split(""));
      const MW = MZ[0].length, MH = MZ.length;
      let px2 = 1.5, py2 = 1.5, ang = 0, targetAng = 0, walking = true;
      const wall = (mx2, my2) => (MZ[my2 | 0] && MZ[my2 | 0][mx2 | 0]) !== ".";
      const step = () => {
        /* steering: keep walking until a wall is near, then pick an open turn */
        if (Math.abs(ang - targetAng) > 0.02) {
          ang += Math.sign(targetAng - ang) * 0.045;
        } else if (walking) {
          const nx2 = px2 + Math.cos(ang) * 0.045, ny2 = py2 + Math.sin(ang) * 0.045;
          const ahead = px2 + Math.cos(ang) * 0.6, aheadY = py2 + Math.sin(ang) * 0.6;
          if (wall(ahead, aheadY)) {
            const dirs = [ang + Math.PI / 2, ang - Math.PI / 2, ang + Math.PI].filter(a2 =>
              !wall(px2 + Math.cos(a2) * 0.7, py2 + Math.sin(a2) * 0.7));
            targetAng = dirs.length ? dirs[(Math.random() * dirs.length) | 0] : ang + Math.PI;
            /* snap target to quarter turns to keep corridors square */
            targetAng = Math.round(targetAng / (Math.PI / 2)) * (Math.PI / 2);
          } else { px2 = nx2; py2 = ny2; }
        }
        /* render */
        ctx.fillStyle = "#3a3a3a"; ctx.fillRect(0, 0, W, H / 2);
        ctx.fillStyle = "#5a2a0a"; ctx.fillRect(0, H / 2, W, H / 2);
        const FOV = Math.PI / 3, COLS = 160;
        const cw2 = W / COLS;
        for (let c = 0; c < COLS; c++) {
          const ra = ang - FOV / 2 + (c / COLS) * FOV;
          let d = 0, hx = px2, hy = py2, hit = false, side = 0;
          while (d < 12 && !hit) {
            d += 0.02;
            hx = px2 + Math.cos(ra) * d;
            hy = py2 + Math.sin(ra) * d;
            if (wall(hx, hy)) {
              hit = true;
              const fx = hx % 1, fy = hy % 1;
              side = (Math.min(fx, 1 - fx) < Math.min(fy, 1 - fy)) ? 1 : 0;
            }
          }
          if (!hit) continue;
          const cd = d * Math.cos(ra - ang);
          const h2 = Math.min(H, H / cd * 0.9);
          const shade = Math.max(0, 1 - cd / 7);
          /* brick red walls, alternate faces darker like the original */
          const base = side ? [170, 60, 40] : [130, 40, 28];
          ctx.fillStyle = "rgb(" + (base[0] * shade | 0) + "," + (base[1] * shade | 0) + "," + (base[2] * shade | 0) + ")";
          ctx.fillRect(c * cw2, (H - h2) / 2, cw2 + 1, h2);
          /* mortar lines */
          if (((hx * 3) | 0) % 2 === 0 && shade > 0.25) {
            ctx.fillStyle = "rgba(0,0,0,0.18)";
            ctx.fillRect(c * cw2, (H - h2) / 2, 1, h2);
          }
        }
        raf = setTimeout(step, 40);
      };
      step();
    } else if (name === "Scrolling Marquee") {
      let x = W;
      const msg = Store.get("ssMarqueeText", "Windows 98 — where do you want to go today?");
      const step = () => {
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
        ctx.font = "bold 48px 'Times New Roman', serif";
        ctx.fillStyle = `hsl(${(t * 2) % 360},100%,60%)`;
        const w = ctx.measureText(msg).width;
        ctx.fillText(msg, x, H / 2);
        x -= 3; t++;
        if (x < -w) x = W;
        raf = requestAnimationFrame(step);
      };
      step();
    }

    const dismiss = () => {
      cancelAnimationFrame(raf);
      clearTimeout(raf);
      cv.remove();
      active = null;
      resetIdle();
    };
    active = { dismiss };
    setTimeout(() => {
      cv.addEventListener("mousemove", dismiss, { once: true });
      cv.addEventListener("mousedown", dismiss, { once: true });
      document.addEventListener("keydown", dismiss, { once: true });
    }, 500);
  }
  function init() {
    ["mousemove", "mousedown", "keydown"].forEach(ev =>
      document.addEventListener(ev, () => { if (!active) resetIdle(); }, { passive: true }));
    resetIdle();
  }
  return { init, show, resetIdle, NAMES: ["(None)", "3D Maze", "Plasma", "Starfield", "Mystify", "Flying Windows", "Pipes", "Scrolling Marquee"] };
})();

/* ================= Display Properties ================= */
W98.Apps.display = {
  name: "Display Properties", icon: "display", single: true,
  launch() {
    let wp = Store.get("wallpaper", "(None)");
    let wpMode = Store.get("wallpaperMode", "tile") || "tile";
    let scheme = Store.get("scheme", "Windows Standard");
    let ssName = Store.get("ssName", "(None)");
    let ssWait = Store.get("ssWait", 15);

    const win = WM.create({
      title: "Display Properties", icon: "display", appId: "display",
      width: 420, height: 470, resizable: false, maximizable: false, noTaskbar: false, center: true
    });
    win.body.style.padding = "8px";

    function monitorPreview(fill) {
      const m = el("div", { class: "dp-monitor" });
      const frame = el("div", { class: "frame" });
      const scr = el("div", { class: "scr" });
      frame.append(scr);
      m.append(frame, el("div", { class: "base" }), el("div", { class: "foot" }));
      fill(scr);
      return m;
    }

    const tabs = Dialogs.makeTabs([
      {
        label: "Background",
        build(page) {
          const scrRef = {};
          const mon = monitorPreview(scr => {
            scrRef.el = scr;
            paintWpPreview(scr);
          });
          function paintWpPreview(scr) {
            const w = wp === "(Custom)" ? { url: Store.get("wallpaperCustom", ""), mode: wpMode } : W98.Desktop.makeWallpaper(wp);
            scr.style.background = "";
            scr.style.backgroundColor = "var(--desktop)";
            if (w && w.url) {
              scr.style.backgroundImage = `url(${w.url})`;
              if (wpMode === "stretch") scr.style.backgroundSize = "100% 100%";
              else if (wpMode === "center") { scr.style.backgroundRepeat = "no-repeat"; scr.style.backgroundPosition = "center"; scr.style.backgroundSize = "auto"; }
              else { scr.style.backgroundRepeat = "repeat"; scr.style.backgroundSize = "auto"; }
            } else scr.style.backgroundImage = "";
          }
          page.append(mon);
          const names = ["(None)", "Clouds", "Waves", "Tiles", "Blue Weave", "Circles"];
          if (Store.get("wallpaperCustom")) names.push("(Custom)");
          const list = el("div", { class: "listview sunken", style: "height:110px;padding:2px" });
          names.forEach(n => {
            const row = el("div", { class: "lv-item" }, Icons.img("imagefile", 16), el("span", { class: "nm", text: n }));
            if (n === wp) row.classList.add("sel");
            row.addEventListener("click", () => {
              wp = n;
              $$(".lv-item", list).forEach(r => r.classList.remove("sel"));
              row.classList.add("sel");
              paintWpPreview(scrRef.el);
            });
            list.append(row);
          });
          const modeSel = el("select", { class: "field", style: "width:110px" });
          ["tile", "center", "stretch"].forEach(m2 => {
            const o = el("option", { text: m2[0].toUpperCase() + m2.slice(1), value: m2 });
            if (m2 === wpMode) o.selected = true;
            modeSel.append(o);
          });
          modeSel.addEventListener("change", () => { wpMode = modeSel.value; paintWpPreview(scrRef.el); });
          page.append(
            el("div", { text: "Select an HTML Document or a picture:", style: "margin:4px 0" }),
            list,
            el("div", { style: "display:flex;align-items:center;gap:8px;margin-top:8px" },
              el("span", { text: "Display:" }), modeSel)
          );
        }
      },
      {
        label: "Screen Saver",
        build(page) {
          const mon = monitorPreview(scr => {
            scr.style.background = "#000";
            const lbl = el("div", { style: "color:#0f0;font-size:9px;padding:4px;font-family:monospace", text: ssName === "(None)" ? "" : ssName });
            scr.append(lbl);
          });
          page.append(mon);
          const sel = el("select", { class: "field", style: "width:160px" });
          W98.Screensaver.NAMES.forEach(n => {
            const o = el("option", { text: n, value: n });
            if (n === ssName) o.selected = true;
            sel.append(o);
          });
          sel.addEventListener("change", () => {
            ssName = sel.value;
            $(".scr div", mon).textContent = ssName === "(None)" ? "" : ssName;
          });
          const waitInp = el("input", { type: "number", class: "field", value: String(ssWait), min: "1", max: "60", style: "width:52px" });
          waitInp.addEventListener("change", () => { ssWait = clamp(parseInt(waitInp.value) || 15, 1, 60); });
          const prevBtn = el("button", { class: "btn", text: "Preview" });
          prevBtn.addEventListener("click", () => { if (ssName !== "(None)") W98.Screensaver.show(ssName); });
          page.append(
            el("div", { style: "display:flex;gap:8px;align-items:center;margin:6px 0" },
              el("span", { text: "Screen Saver:" }), sel, prevBtn),
            el("div", { style: "display:flex;gap:8px;align-items:center;margin-top:10px" },
              el("span", { text: "Wait:" }), waitInp, el("span", { text: "minutes of inactivity" }))
          );
        }
      },
      {
        label: "Appearance",
        build(page) {
          /* mini preview of a window in the chosen scheme */
          const prev = el("div", { style: "height:150px;position:relative;margin-bottom:10px;box-shadow:inset -1px -1px #fff, inset 1px 1px #808080;overflow:hidden;padding:8px" });
          function paintPrev() {
            const s = W98.Desktop.SCHEMES[scheme] || W98.Desktop.SCHEMES["Windows Standard"];
            prev.style.background = s.desktop;
            prev.innerHTML = "";
            const mkwin = (title, top, left, active2) => {
              const w = el("div", { style: `position:absolute;top:${top}px;left:${left}px;width:200px;height:70px;background:${s.face};box-shadow:inset -1px -1px #0a0a0a, inset 1px 1px ${s.light}, inset -2px -2px ${s.shadow}, inset 2px 2px #fff;padding:3px` });
              w.append(el("div", {
                style: `height:14px;background:linear-gradient(90deg,${active2 ? s.t1 : s.ti1},${active2 ? s.t2 : s.ti2});color:#fff;font-size:10px;font-weight:700;padding:1px 4px`,
                text: title
              }));
              w.append(el("div", { style: "font-size:10px;padding:4px", text: active2 ? "Window Text" : "" }));
              return w;
            };
            prev.append(mkwin("Inactive Window", 8, 12, false), mkwin("Active Window", 34, 30, true));
          }
          paintPrev();
          const sel = el("select", { class: "field", style: "width:190px" });
          Object.keys(W98.Desktop.SCHEMES).forEach(n => {
            const o = el("option", { text: n, value: n });
            if (n === scheme) o.selected = true;
            sel.append(o);
          });
          sel.addEventListener("change", () => { scheme = sel.value; paintPrev(); });
          page.append(prev, el("div", { style: "display:flex;gap:8px;align-items:center" },
            el("span", { text: "Scheme:" }), sel));
        }
      }
    ]);

    function apply() {
      W98.Desktop.applyWallpaper(wp, wpMode);
      Store.set("wallpaperMode", wpMode);
      W98.Desktop.applyScheme(scheme);
      Store.set("ssName", ssName);
      Store.set("ssWait", ssWait);
      W98.Screensaver.resetIdle();
    }
    const btnRow = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:8px 2px 2px" });
    const ok = el("button", { class: "btn default", text: "OK", onclick: () => { apply(); win.close(); } });
    const cancel = el("button", { class: "btn", text: "Cancel", onclick: () => win.close() });
    const applyB = el("button", { class: "btn", text: "Apply", onclick: apply });
    btnRow.append(ok, cancel, applyB);
    win.body.append(tabs.el, btnRow);
    return win;
  }
};

/* ================= Date/Time ================= */
W98.Apps.datetime = {
  name: "Date/Time", icon: "datetime", single: true,
  launch() {
    const win = WM.create({
      title: "Date/Time Properties", icon: "datetime", appId: "datetime",
      width: 400, height: 380, resizable: false, maximizable: false, center: true
    });
    win.body.style.padding = "8px";
    let viewDate = new Date();
    let clockTimer = null;

    const tabs = Dialogs.makeTabs([
      {
        label: "Date & Time",
        build(page) {
          const row = el("div", { style: "display:flex;gap:12px" });
          /* calendar */
          const calBox = el("fieldset", { class: "grp", style: "flex:1;margin:0" });
          calBox.append(el("legend", { text: "Date" }));
          const monSel = el("select", { class: "field" });
          ["January","February","March","April","May","June","July","August","September","October","November","December"]
            .forEach((m, i) => monSel.append(el("option", { text: m, value: i })));
          const yearInp = el("input", { type: "number", class: "field", style: "width:64px" });
          const calGrid = el("div", { style: "display:grid;grid-template-columns:repeat(7,1fr);gap:1px;margin-top:6px;background:#fff;padding:3px;box-shadow:inset -1px -1px #fff, inset 1px 1px #808080" });
          function paintCal() {
            monSel.value = viewDate.getMonth();
            yearInp.value = viewDate.getFullYear();
            calGrid.innerHTML = "";
            "S M T W T F S".split(" ").forEach(d => calGrid.append(el("div", { text: d, style: "text-align:center;font-weight:700" })));
            const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
            const days = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
            for (let i = 0; i < first; i++) calGrid.append(el("div"));
            const today = new Date();
            for (let d = 1; d <= days; d++) {
              const cell = el("div", { text: d, style: "text-align:center;padding:1px" });
              const isToday = d === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
              if (isToday) { cell.style.background = "var(--hl)"; cell.style.color = "#fff"; }
              cell.addEventListener("click", () => {
                $$("div", calGrid).forEach(c => { if (c.dataset.pick) { c.style.outline = ""; delete c.dataset.pick; } });
                cell.dataset.pick = "1";
                cell.style.outline = "1px dotted #000";
              });
              calGrid.append(cell);
            }
          }
          monSel.addEventListener("change", () => { viewDate.setMonth(+monSel.value); paintCal(); });
          yearInp.addEventListener("change", () => { viewDate.setFullYear(clamp(+yearInp.value || 1998, 1980, 2099)); paintCal(); });
          calBox.append(el("div", { style: "display:flex;gap:6px" }, monSel, yearInp), calGrid);
          paintCal();

          /* analog clock */
          const clockBox = el("fieldset", { class: "grp", style: "flex:1;margin:0" });
          clockBox.append(el("legend", { text: "Time" }));
          const cv = el("canvas", { width: "130", height: "130", style: "display:block;margin:4px auto" });
          const digital = el("div", { class: "field", style: "text-align:center;margin:4px 14px;padding:3px" });
          clockBox.append(cv, digital);
          const cx = cv.getContext("2d");
          function paintClock() {
            const now = new Date();
            cx.clearRect(0, 0, 130, 130);
            cx.fillStyle = "#c0c0c0"; cx.fillRect(0, 0, 130, 130);
            cx.beginPath(); cx.arc(65, 65, 58, 0, Math.PI * 2);
            cx.fillStyle = "#fff"; cx.fill(); cx.strokeStyle = "#000"; cx.stroke();
            for (let i = 0; i < 12; i++) {
              const a = i / 12 * Math.PI * 2;
              cx.fillStyle = "#000";
              cx.fillRect(65 + Math.sin(a) * 50 - 1.5, 65 - Math.cos(a) * 50 - 1.5, 3, 3);
            }
            const hand = (val, len, w2, color) => {
              const a = val * Math.PI * 2;
              cx.strokeStyle = color; cx.lineWidth = w2;
              cx.beginPath(); cx.moveTo(65, 65);
              cx.lineTo(65 + Math.sin(a) * len, 65 - Math.cos(a) * len);
              cx.stroke();
            };
            hand((now.getHours() % 12) / 12 + now.getMinutes() / 720, 30, 4, "#000080");
            hand(now.getMinutes() / 60 + now.getSeconds() / 3600, 44, 3, "#000080");
            hand(now.getSeconds() / 60, 50, 1, "#c00000");
            digital.textContent = now.toLocaleTimeString();
          }
          paintClock();
          clockTimer = setInterval(paintClock, 1000);
          row.append(calBox, clockBox);
          page.append(row);
          page.append(el("div", { style: "margin-top:10px", text: "Current time zone: " + Intl.DateTimeFormat().resolvedOptions().timeZone }));
        }
      },
      {
        label: "Time Zone",
        build(page) {
          const zones = ["(GMT-08:00) Pacific Time (US & Canada)", "(GMT-05:00) Eastern Time (US & Canada)", "(GMT) Greenwich Mean Time", "(GMT+01:00) Paris, Berlin, Rome", "(GMT+08:00) Beijing, Hong Kong, Singapore", "(GMT+09:00) Tokyo, Osaka"];
          const sel = el("select", { class: "field", style: "width:100%" });
          zones.forEach(z => {
            const o = el("option", { text: z });
            if (z === Store.get("tz", zones[4])) o.selected = true;
            sel.append(o);
          });
          sel.addEventListener("change", () => Store.set("tz", sel.value));
          page.append(
            sel,
            el("div", { style: "margin-top:14px;padding:8px;text-align:center;font-size:36px", text: "🗺" }),
            el("div", { style: "text-align:center", text: "(The world map is still downloading over dial-up. Your actual clock follows your Mac's time zone.)" })
          );
        }
      }
    ]);
    const btnRow = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:8px 2px 2px" });
    const ok = el("button", { class: "btn default", text: "OK", onclick: () => win.close() });
    btnRow.append(ok);
    win.body.append(tabs.el, btnRow);
    win.opts.onClose = () => clearInterval(clockTimer);
    return win;
  }
};

/* ================= Sounds ================= */
W98.Apps.sounds = {
  name: "Sounds", icon: "sounds", single: true,
  launch() {
    const win = WM.create({
      title: "Sounds Properties", icon: "sounds", appId: "sounds",
      width: 380, height: 430, resizable: false, maximizable: false, center: true
    });
    win.body.style.padding = "8px";
    const events = [
      ["Start Windows", "startup"], ["Exit Windows", "shutdown"],
      ["Critical Stop", "error"], ["Exclamation", "warn"],
      ["Question", "question"], ["Asterisk", "info"],
      ["Default sound", "ding"], ["Chimes", "chimes"],
      ["Empty Recycle Bin", "recycle"], ["Menu popup", "menu"], ["Ta-da!", "tada"]
    ];
    let selSound = "ding";
    const tabs = Dialogs.makeTabs([
      {
        label: "Sounds",
        build(page) {
          page.append(el("div", { text: "Events:", style: "margin-bottom:4px" }));
          const list = el("div", { class: "listview sunken", style: "height:150px;padding:2px" });
          const custom = new Set(Sound.customEvents);
          events.forEach(([label, id]) => {
            const row = el("div", { class: "lv-item" }, Icons.img("sounds", 16),
              el("span", { class: "nm", text: label + (custom.has(id) ? "  (custom .wav)" : "") }));
            if (id === selSound) row.classList.add("sel");
            row.addEventListener("click", () => {
              selSound = id;
              $$(".lv-item", list).forEach(r => r.classList.remove("sel"));
              row.classList.add("sel");
            });
            row.addEventListener("dblclick", () => Sound.play(id));
            list.append(row);
          });
          page.append(list);
          const playBtn = el("button", { class: "btn", text: "▶ Preview" });
          playBtn.addEventListener("click", () => Sound.play(selSound));
          page.append(el("div", { style: "display:flex;gap:8px;margin:8px 0" }, playBtn));
          const enable = el("label", { class: "checkline" }, el("input", { type: "checkbox" }), "Enable sound events");
          const ei = $("input", enable);
          ei.checked = Sound.enabled;
          ei.addEventListener("change", () => { Sound.enabled = ei.checked; });
          const volRow = el("div", { style: "display:flex;align-items:center;gap:8px;margin-top:8px" });
          const vol = el("input", { type: "range", min: "0", max: "100", value: String(Math.round(Sound.volume * 100)), style: "flex:1" });
          vol.addEventListener("input", () => { Sound.volume = vol.value / 100; });
          vol.addEventListener("change", () => Sound.play("ding"));
          volRow.append(el("span", { text: "Volume:" }), vol);
          page.append(enable, volRow);
        }
      },
      {
        label: "Schemes",
        build(page) {
          const n = Sound.customEvents.length;
          page.append(
            el("div", { style: "line-height:1.5", html:
              "<b>Use your own original sound files.</b><br>" +
              "If you own Windows 98 media files, drop the .wav files into the Sounds " +
              "folder and they will be used automatically the next time the app starts." }),
            el("div", { class: "sunken-thin", style: "padding:6px;margin:10px 0;font-size:11px;line-height:1.6", html:
              "Recognized names include:<br>" +
              "<i>Windows 98 Startup.wav, The Microsoft Sound.wav, ding.wav, chord.wav, tada.wav, chimes.wav, exclamation.wav, question.wav, asterisk.wav, shutdown.wav, Empty Recycle Bin.wav</i>" }),
            el("div", { style: "margin:8px 0", text: "Custom sounds loaded now: " + n + (n ? "  ✓" : "  (none — using the built-in synthesizer)") })
          );
          const openBtn = el("button", { class: "btn", text: "Open Sounds Folder", style: "min-width:140px" });
          openBtn.addEventListener("click", () => {
            const ok = Store.native({ cmd: "revealSounds" });
            if (!ok) WM.msgbox({
              title: "Sounds", icon: "info",
              text: "In the native app this opens:\n~/Library/Application Support/Win98/Sounds\n\nIn the browser preview, place .wav files in the project's web/sounds folder instead."
            });
          });
          const rescanBtn = el("button", { class: "btn", text: "Rescan Now", style: "min-width:110px" });
          rescanBtn.addEventListener("click", () => {
            Sound.rescan();
            rescanBtn.textContent = "Scanning...";
            setTimeout(() => {
              tabs.select(1); // refresh this tab with the new counts
              Sound.play("ding");
            }, 1200);
          });
          page.append(el("div", { style: "display:flex;gap:8px" }, openBtn, rescanBtn),
            el("div", { style: "margin-top:10px;font-size:11px;color:#404040", text: "Add files, click Rescan Now — no restart needed. (A restart works too.)" }));
        }
      }
    ]);
    const btnRow = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:8px 2px 2px" });
    btnRow.append(el("button", { class: "btn default", text: "OK", onclick: () => win.close() }));
    win.body.append(tabs.el, btnRow);
    return win;
  }
};

/* ================= Desktop Themes ================= */
W98.Apps.themes = {
  name: "Desktop Themes", icon: "display", single: true,
  launch() {
    const THEMES = {
      "Windows Standard": { scheme: "Windows Standard", wp: "(None)", mode: "tile", ss: "(None)",
        desc: "The classic teal. Crisp, familiar, dependable." },
      "Clouds & Sky": { scheme: "Desert", wp: "Clouds", mode: "stretch", ss: "Flying Windows",
        desc: "Blue skies, sandy window chrome, flags drifting by." },
      "Deep Sea": { scheme: "Slate", wp: "Waves", mode: "tile", ss: "Mystify",
        desc: "Cool slate blues over rolling teal waves." },
      "Brick & Mortar": { scheme: "Brick", wp: "Tiles", mode: "tile", ss: "Pipes",
        desc: "Sturdy maroon and olive, with plumbing to match." },
      "Rainy Night": { scheme: "Rainy Day", wp: "Blue Weave", mode: "tile", ss: "Starfield",
        desc: "Midnight blues for late-night dial-up sessions." },
      "Evergreen": { scheme: "Spruce", wp: "Circles", mode: "tile", ss: "Pipes",
        desc: "Forest greens. Smells faintly of pine and floppy disks." },
      "Harvest": { scheme: "Wheat", wp: "(None)", mode: "tile", ss: "Scrolling Marquee",
        desc: "Warm wheat and maple tones, straight from 1998's autumn." },
      "Royal Purple": { scheme: "Lilac", wp: "Blue Weave", mode: "tile", ss: "Mystify",
        desc: "Lilac chrome fit for very important spreadsheets." }
    };
    let cur = Store.get("themeName", "Windows Standard");
    if (!THEMES[cur]) cur = "Windows Standard";

    const win = WM.create({
      title: "Desktop Themes", icon: "display", appId: "themes",
      width: 430, height: 420, resizable: false, maximizable: false, center: true
    });
    win.body.style.padding = "10px";

    const sel = el("select", { class: "field", style: "width:100%" });
    Object.keys(THEMES).forEach(n => {
      const o = el("option", { text: n, value: n });
      if (n === cur) o.selected = true;
      sel.append(o);
    });

    const prev = el("div", { style: "height:190px;position:relative;margin:10px 0;box-shadow:inset -1px -1px #fff, inset 1px 1px #808080;overflow:hidden" });
    const descEl = el("div", { style: "min-height:28px;line-height:1.4" });
    const detail = el("div", { style: "font-size:11px;color:#404040;margin-top:4px" });

    function paint() {
      const t = THEMES[cur];
      const s = W98.Desktop.SCHEMES[t.scheme];
      prev.innerHTML = "";
      prev.style.background = s.desktop;
      const w = W98.Desktop.makeWallpaper(t.wp);
      if (w) {
        prev.style.backgroundImage = `url(${w.url})`;
        prev.style.backgroundRepeat = t.mode === "tile" ? "repeat" : "no-repeat";
        prev.style.backgroundSize = t.mode === "stretch" ? "100% 100%" : "auto";
      } else prev.style.backgroundImage = "";
      const mkwin = (title, top, left, active) => {
        const d = el("div", { style: `position:absolute;top:${top}px;left:${left}px;width:210px;height:78px;background:${s.face};box-shadow:inset -1px -1px #0a0a0a, inset 1px 1px ${s.light}, inset -2px -2px ${s.shadow}, inset 2px 2px #fff;padding:3px` });
        d.append(el("div", {
          style: `height:15px;background:linear-gradient(90deg,${active ? s.t1 : s.ti1},${active ? s.t2 : s.ti2});color:#fff;font-size:10px;font-weight:700;padding:1px 4px`,
          text: title
        }));
        d.append(el("div", { style: "font-size:10px;padding:5px", text: active ? "Window Text" : "" }));
        return d;
      };
      prev.append(mkwin("Inactive Window", 14, 20, false), mkwin("Active Window", 48, 44, true));
      descEl.textContent = t.desc;
      detail.textContent = "Scheme: " + t.scheme + "   Wallpaper: " + t.wp + "   Screen saver: " + t.ss;
    }
    sel.addEventListener("change", () => { cur = sel.value; paint(); });
    paint();

    const btnRow = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding-top:10px" });
    const apply = () => {
      const t = THEMES[cur];
      W98.Desktop.applyScheme(t.scheme);
      W98.Desktop.applyWallpaper(t.wp, t.mode);
      Store.set("wallpaperMode", t.mode);
      Store.set("ssName", t.ss);
      Store.set("themeName", cur);
      W98.Screensaver.resetIdle();
      Sound.play("info");
    };
    btnRow.append(
      el("button", { class: "btn default", text: "OK", onclick: () => { apply(); win.close(); } }),
      el("button", { class: "btn", text: "Cancel", onclick: () => win.close() }),
      el("button", { class: "btn", text: "Apply", onclick: apply })
    );
    win.body.append(el("div", { text: "Theme:" }), sel, prev, descEl, detail, btnRow);
    return win;
  }
};

/* ================= Mouse Properties ================= */
W98.Apps.mouse = {
  name: "Mouse", icon: "settings", single: true,
  launch() {
    const win = WM.create({
      title: "Mouse Properties", icon: "settings", appId: "mouse",
      width: 390, height: 400, resizable: false, maximizable: false, center: true
    });
    win.body.style.padding = "8px";
    const tabs = Dialogs.makeTabs([
      {
        label: "Buttons",
        build(page) {
          page.append(el("div", { style: "margin-bottom:6px", text: "Double-click speed test area:" }));
          const box = el("div", { class: "sunken", style: "height:120px;display:flex;align-items:center;justify-content:center;cursor:inherit" });
          let open = false;
          const toy = el("div", { style: "font-size:52px;transition:transform 120ms", text: "🎁" });
          box.append(toy);
          box.addEventListener("dblclick", () => {
            open = !open;
            toy.textContent = open ? "🤡" : "🎁";
            toy.style.transform = open ? "translateY(-10px) scale(1.15)" : "";
            Sound.play(open ? "tada" : "click");
          });
          page.append(box,
            el("div", { style: "margin-top:8px;font-size:11px;line-height:1.5", text: "Double-click the box. If the jack-in-the-box pops, your double-click speed is fine. If it does not, double-click faster — that was the entire calibration procedure in 1998, too." }));
        }
      },
      {
        label: "Motion",
        build(page) {
          const chk = el("label", { class: "checkline" }, el("input", { type: "checkbox" }), "Show pointer trails");
          const ci = $("input", chk);
          ci.checked = Store.get("mouseTrails", false);
          ci.addEventListener("change", () => {
            Store.set("mouseTrails", ci.checked);
            if (W98.setPointerTrails) W98.setPointerTrails(ci.checked);
          });
          const lenRow = el("div", { style: "display:flex;align-items:center;gap:8px;margin-top:10px" });
          const slider = el("input", { type: "range", min: "2", max: "7", value: String(Store.get("mouseTrailLen", 4)), style: "flex:1" });
          slider.addEventListener("input", () => Store.set("mouseTrailLen", parseInt(slider.value, 10)));
          lenRow.append(el("span", { text: "Short" }), slider, el("span", { text: "Long" }));
          page.append(
            el("fieldset", { class: "grp" }, el("legend", { text: "Pointer trail" }), chk, lenRow),
            el("div", { style: "font-size:11px;margin-top:8px;line-height:1.5", text: "Pointer trails were invented for dim laptop screens and kept for their hypnotic properties. Wave the mouse around after enabling." })
          );
        }
      }
    ]);
    const btnRow = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:8px 2px 2px" });
    btnRow.append(el("button", { class: "btn default", text: "OK", onclick: () => win.close() }));
    win.body.append(tabs.el, btnRow);
    return win;
  }
};

W98.Apps.regional = {
  name: "Regional Settings", icon: "settings", single: true,
  launch() {
    const win = WM.create({
      title: "Regional Settings Properties", icon: "settings", appId: "regional",
      width: 380, height: 320, resizable: false, maximizable: false, center: true
    });
    win.body.style.padding = "8px";
    const cur = Store.get("uiLang", "en");
    let sel = cur;
    const page = el("div", { style: "padding:4px 6px" });
    page.append(el("div", { style: "margin-bottom:8px;line-height:1.5",
      text: W98.tr("Many programs support international settings that you can change. Set your language below.") }));
    page.append(el("div", { style: "margin-bottom:4px", text: W98.tr("Language:") }));
    const selEl = el("select", { class: "field", style: "width:100%" });
    [["en", "English"], ["zh-TW", "\u7e41\u9ad4\u4e2d\u6587 \u2014 Chinese (Traditional)"]].forEach(([v, l]) => {
      const o = el("option", { value: v, text: l });
      if (v === cur) o.selected = true;
      selEl.append(o);
    });
    selEl.addEventListener("change", () => { sel = selEl.value; });
    page.append(selEl);
    const glyph = el("div", { style: "margin-top:14px;text-align:center;font-size:34px;font-family:serif", text: cur === "zh-TW" ? "\u6587" : "Aa" });
    selEl.addEventListener("change", () => { glyph.textContent = sel === "zh-TW" ? "\u6587" : "Aa"; });
    page.append(glyph);
    page.append(el("div", { style: "margin-top:10px;font-size:11px;color:#606060;line-height:1.5",
      text: W98.tr("Changing the language affects menus, dialogs, and Help. A restart is required for the change to take full effect.") }));

    const btnRow = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:8px 2px 2px" });
    const apply = () => {
      if (sel === cur) { win.close(); return; }
      W98.setUiLang(sel);
      win.close();
      WM.msgbox({
        title: W98.tr("Regional Settings"), icon: "question",
        text: (sel === "zh-TW"
          ? "\u8a9e\u8a00\u5df2\u8b8a\u66f4\u70ba\u7e41\u9ad4\u4e2d\u6587\u3002\n\u9700\u8981\u91cd\u65b0\u555f\u52d5 Windows \u624d\u80fd\u5b8c\u6210\u8b8a\u66f4\u3002\n\n\u73fe\u5728\u8981\u91cd\u65b0\u555f\u52d5\u55ce\uff1f"
          : "The language has been changed.\nWindows must restart for the change to take full effect.\n\nDo you want to restart now?"),
        buttons: sel === "zh-TW" ? ["\u662f", "\u5426"] : ["Yes", "No"]
      }).then(r => {
        if (r === "Yes" || r === "\u662f") W98.Boot.restart();
      });
    };
    btnRow.append(
      el("button", { class: "btn default", text: W98.tr("OK"), onclick: apply }),
      el("button", { class: "btn", text: W98.tr("Cancel"), onclick: () => win.close() }));
    win.body.append(page, btnRow);
    return win;
  }
};

/* ================= System Properties ================= */
W98.Apps.sysprops = {
  name: "System", icon: "system", single: true,
  launch() {
    const win = WM.create({
      title: "System Properties", icon: "system", appId: "sysprops",
      width: 400, height: 420, resizable: false, maximizable: false, center: true
    });
    win.body.style.padding = "8px";
    const tabs = Dialogs.makeTabs([
      {
        label: "General",
        build(page) {
          page.append(
            el("div", { style: "display:flex;gap:16px;padding:10px 4px" },
              (() => {
                const i = new Image();
                i.src = Icons.bigFlag(4);
                i.style.width = "84px";
                i.style.alignSelf = "flex-start";   // keep natural aspect; flex would stretch it
                return i;
              })(),
              el("div", { style: "line-height:1.7" },
                el("div", { text: "System:" }),
                el("div", { text: "  Windows 98", style: "padding-left:10px" }),
                el("div", { text: "  4.10.1998", style: "padding-left:10px" }),
                el("div", { text: "Registered to:", style: "margin-top:8px" }),
                el("div", { text: "  A Nostalgic User", style: "padding-left:10px" }),
                el("div", { text: "Computer:", style: "margin-top:8px" }),
                el("div", { text: "  GenuineIntel", style: "padding-left:10px" }),
                el("div", { text: "  Pentium II Processor", style: "padding-left:10px" }),
                el("div", { text: "  Intel MMX™ Technology", style: "padding-left:10px" }),
                el("div", { text: "  64.0MB RAM", style: "padding-left:10px" })
              ))
          );
        }
      },
      {
        label: "Device Manager",
        build(page) {
          const tree = el("div", { class: "tree sunken", style: "height:240px" });
          const devices = {
            "Computer": {
              "Disk drives": ["GENERIC IDE DISK TYPE47", "QUANTUM FIREBALL SE4.3A"],
              "Display adapters": ["S3 Trio64V+ (very retro, very cool)"],
              "Keyboard": ["Standard 101/102-Key Keyboard"],
              "Modem": ["56K Voice Modem (currently screaming)"],
              "Mouse": ["Standard PS/2 Port Mouse"],
              "Sound, video and game controllers": ["Sound Blaster 16 or compatible", "Gameport Joystick"],
              "System devices": ["PCI bus", "Programmable interrupt controller", "System timer", "Numeric data processor"]
            }
          };
          const open = new Set(["Computer"]);
          function paint() {
            tree.innerHTML = "";
            const root = devices["Computer"];
            const rootRow = el("div", { class: "tree-row" });
            rootRow.append(
              el("div", { class: "tree-tg" }, el("div", { class: "box", text: open.has("Computer") ? "-" : "+" })),
              Icons.img("mycomputer", 16), el("span", { class: "tlabel", text: "Computer" }));
            rootRow.addEventListener("mousedown", () => { open.has("Computer") ? open.delete("Computer") : open.add("Computer"); paint(); });
            tree.append(rootRow);
            if (!open.has("Computer")) return;
            for (const cat in root) {
              const catRow = el("div", { class: "tree-row", style: "padding-left:16px" });
              catRow.append(
                el("div", { class: "tree-tg" }, el("div", { class: "box", text: open.has(cat) ? "-" : "+" })),
                Icons.img("settings", 16), el("span", { class: "tlabel", text: cat }));
              catRow.addEventListener("mousedown", () => { open.has(cat) ? open.delete(cat) : open.add(cat); paint(); });
              tree.append(catRow);
              if (open.has(cat)) for (const dev of root[cat]) {
                const devRow = el("div", { class: "tree-row", style: "padding-left:48px" });
                devRow.append(Icons.img("exefile", 16), el("span", { class: "tlabel", text: dev }));
                devRow.addEventListener("dblclick", () => WM.msgbox({ title: dev, icon: "info", text: "This device is working properly.\n\n(It does not exist, which makes malfunction unlikely.)" }));
                tree.append(devRow);
              }
            }
          }
          paint();
          page.append(tree, el("div", { style: "margin-top:6px;font-size:11px", text: "Double-click a device to check its status." }));
        }
      },
      {
        label: "Performance",
        build(page) {
          page.append(
            el("div", { style: "display:grid;grid-template-columns:auto 1fr;gap:8px 14px;padding:8px 4px" },
              el("span", { text: "Memory:" }), el("span", { text: "64.0 MB of RAM" }),
              el("span", { text: "System Resources:" }), el("span", { text: "93% free" }),
              el("span", { text: "File System:" }), el("span", { text: "32-bit" }),
              el("span", { text: "Virtual Memory:" }), el("span", { text: "32-bit" }),
              el("span", { text: "Disk Compression:" }), el("span", { text: "Not installed" }),
              el("span", { text: "PC Cards (PCMCIA):" }), el("span", { text: "No PC Card sockets are installed" })),
            el("div", { class: "sunken-thin", style: "padding:8px;margin-top:10px" },
              el("b", { text: "Your system is configured for optimal performance." }),
              el("div", { style: "margin-top:6px;font-size:11px", text: "(This message was equally reassuring and equally unverifiable in 1998.)" }))
          );
        }
      }
    ]);
    const btnRow = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:8px 2px 2px" });
    btnRow.append(el("button", { class: "btn default", text: "OK", onclick: () => win.close() }));
    win.body.append(tabs.el, btnRow);
    return win;
  }
};

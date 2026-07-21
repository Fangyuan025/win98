/* megademo.js — MEGADEMO 98 by "The Beige Collective".
   Four classic demoscene effects in sequence, with chiptune accompaniment.
   Greetings to everyone who ever centered a <table>. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  const W = 480, H = 300;

  W98.Apps.megademo = {
    name: "MEGADEMO 98", icon: "megademo", single: true,
    launch() {
      const win = WM.create({
        title: "MEGADEMO 98 — The Beige Collective", icon: "megademo", appId: "megademo",
        width: W + 16, height: H + 58, resizable: false, maximizable: false,
        statusbar: [{ text: "Part 1/4: PLASMA — click canvas to skip parts" }],
        onClose: () => stop()
      });
      const cv = el("canvas", { width: String(W), height: String(H), style: "display:block;margin:0 auto;background:#000" });
      const x = cv.getContext("2d");
      win.body.append(cv);
      win.body.style.alignItems = "center";

      let part = 0, t = 0, timer = null, musicWas = null;
      const PARTS = ["PLASMA", "ROTOZOOM", "SINE SCROLLER", "STARFIELD & CREDITS"];
      const SCROLL_TEXT = "GREETINGS FROM THE BEIGE COLLECTIVE ... YOU ARE WATCHING MEGADEMO 98 RUNNING IN PURE SOFTWARE ON A VIRTUAL 486 ... SHOUTS TO DAVE-PC, THE MIDNIGHT TOWER BBS, PIXEL THE CAT, AND EVERYONE WHO EVER WAITED 45 MINUTES FOR A 3 MB FILE ... KEEP THE MODEM WARM ... WRAP AROUND ...";

      /* low-res buffers for the heavy effects */
      const LW = 120, LH = 75;
      const lo = document.createElement("canvas");
      lo.width = LW; lo.height = LH;
      const lx = lo.getContext("2d");
      const img = lx.createImageData(LW, LH);

      /* rotozoom texture: 32x32 checker with blobs */
      const tex = document.createElement("canvas");
      tex.width = 32; tex.height = 32;
      {
        const tc = tex.getContext("2d");
        for (let ty = 0; ty < 4; ty++) for (let tx2 = 0; tx2 < 4; tx2++) {
          tc.fillStyle = (tx2 + ty) % 2 ? "#d04010" : "#f0a020";
          tc.fillRect(tx2 * 8, ty * 8, 8, 8);
        }
        tc.fillStyle = "#401008";
        tc.beginPath(); tc.arc(16, 16, 5, 0, 7); tc.fill();
        tc.fillStyle = "#ffe080";
        tc.beginPath(); tc.arc(16, 16, 2.4, 0, 7); tc.fill();
      }

      const stars = Array.from({ length: 160 }, () => ({
        x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 0.9 + 0.1
      }));

      function drawPlasma() {
        const d = img.data;
        for (let py = 0; py < LH; py++) {
          for (let px = 0; px < LW; px++) {
            const v = Math.sin(px / 9 + t / 14)
              + Math.sin(py / 7 - t / 18)
              + Math.sin((px + py) / 11 + t / 9)
              + Math.sin(Math.hypot(px - LW / 2, py - LH / 2) / 6 - t / 12);
            const i = (py * LW + px) * 4;
            d[i] = 128 + 127 * Math.sin(v * Math.PI / 2);
            d[i + 1] = 128 + 127 * Math.sin(v * Math.PI / 2 + 2.1);
            d[i + 2] = 128 + 127 * Math.sin(v * Math.PI / 2 + 4.2);
            d[i + 3] = 255;
          }
        }
        lx.putImageData(img, 0, 0);
        x.imageSmoothingEnabled = false;
        x.drawImage(lo, 0, 0, W, H);
        banner("PLASMA");
      }
      function drawRoto() {
        const a = t / 40, zm = 1.6 + Math.sin(t / 50) * 1.1;
        const ca = Math.cos(a) / zm, sa = Math.sin(a) / zm;
        const d = img.data;
        const tc = tex.getContext("2d").getImageData(0, 0, 32, 32).data;
        for (let py = 0; py < LH; py++) {
          for (let px = 0; px < LW; px++) {
            const cx2 = px - LW / 2, cy2 = py - LH / 2;
            const u = ((cx2 * ca - cy2 * sa) + 1024) & 31;
            const v = ((cx2 * sa + cy2 * ca) + 1024) & 31;
            const si = ((v | 0) * 32 + (u | 0)) * 4;
            const di = (py * LW + px) * 4;
            d[di] = tc[si]; d[di + 1] = tc[si + 1]; d[di + 2] = tc[si + 2]; d[di + 3] = 255;
          }
        }
        lx.putImageData(img, 0, 0);
        x.imageSmoothingEnabled = false;
        x.drawImage(lo, 0, 0, W, H);
        banner("ROTOZOOM");
      }
      function drawScroller() {
        x.fillStyle = "#000018"; x.fillRect(0, 0, W, H);
        /* copper bars */
        for (let i = 0; i < 5; i++) {
          const by = H / 2 + Math.sin(t / 30 + i * 1.2) * 90;
          const g = x.createLinearGradient(0, by - 14, 0, by + 14);
          const hue = (t * 2 + i * 60) % 360;
          g.addColorStop(0, "hsla(" + hue + ",80%,20%,0)");
          g.addColorStop(0.5, "hsla(" + hue + ",90%,55%,0.9)");
          g.addColorStop(1, "hsla(" + hue + ",80%,20%,0)");
          x.fillStyle = g;
          x.fillRect(0, by - 14, W, 28);
        }
        /* sine text */
        x.font = "bold 28px 'Courier New',monospace";
        const CW2 = 22;
        const off = (t * 2.6) % ((SCROLL_TEXT.length + 30) * CW2);
        for (let i = 0; i < SCROLL_TEXT.length; i++) {
          const sx2 = W + i * CW2 - off;
          if (sx2 < -30 || sx2 > W + 30) continue;
          const sy2 = H / 2 + Math.sin(sx2 / 46 + t / 16) * 44;
          const hue = (sx2 + t * 3) % 360;
          x.fillStyle = "hsl(" + hue + ",85%,65%)";
          x.fillText(SCROLL_TEXT[i], sx2, sy2);
        }
        banner("SINE SCROLLER");
      }
      function drawStars() {
        x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
        x.fillStyle = "#fff";
        for (const s of stars) {
          s.z -= 0.008;
          if (s.z <= 0.02) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; }
          const px = W / 2 + s.x / s.z * W / 2;
          const py = H / 2 + s.y / s.z * H / 2;
          if (px < 0 || px >= W || py < 0 || py >= H) continue;
          const sz = Math.max(1, (1 - s.z) * 3);
          x.fillRect(px, py, sz, sz);
        }
        x.textAlign = "center";
        x.font = "bold 30px 'Courier New',monospace";
        x.fillStyle = "hsl(" + (t * 2 % 360) + ",80%,70%)";
        x.fillText("MEGADEMO 98", W / 2, 90);
        x.font = "14px 'Courier New',monospace";
        x.fillStyle = "#c0c0ff";
        ["code: the beige collective", "music: Composer 98 (dogfooding)", "boxart: MS Paint, obviously", "", "press ESC or close to return to 1998"].forEach((l, i) => {
          x.fillText(l, W / 2, 140 + i * 22);
        });
        x.textAlign = "left";
      }
      function banner(name) {
        x.fillStyle = "rgba(0,0,0,0.55)";
        x.fillRect(0, H - 22, W, 22);
        x.fillStyle = "#f0e060";
        x.font = "11px 'Courier New',monospace";
        x.fillText("MEGADEMO 98 :: " + name + " :: " + (30 + (t % 9)) + " FPS (reported optimistically)", 8, H - 7);
      }

      function step() {
        if (win.closed) return;
        t++;
        [drawPlasma, drawRoto, drawScroller, drawStars][part]();
        if (t % 600 === 0) nextPart();
        timer = setTimeout(step, 40);
      }
      function nextPart() {
        part = (part + 1) % PARTS.length;
        win.setStatus(0, "Part " + (part + 1) + "/4: " + PARTS[part] + " — click canvas to skip parts");
        Sound.play("click");
      }
      function stop() {
        clearTimeout(timer);
        if (W98.Music && W98.Music.pause) W98.Music.pause();
      }

      cv.addEventListener("mousedown", () => { win.el.focus(); nextPart(); });
      win.el.addEventListener("keydown", (e) => { if (e.key === "Escape") win.close(); });

      /* soundtrack: reuse the chiptune engine */
      if (W98.Music && W98.Music.play) { try { W98.Music.play(0); } catch (e) {} }
      win._demo = { part: () => part, next: nextPart, tick: () => t };
      step();
      return win;
    }
  };
})();

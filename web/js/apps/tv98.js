/* tv98.js — TV98: a television for your desktop.
   Five channels, authentic static between them, and a remote you cannot lose. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  const CHANNELS = [
    { n: 2, name: "SNOW", kind: "static" },
    { n: 3, name: "NEWS 3", kind: "news" },
    { n: 5, name: "WEATHER", kind: "weather" },
    { n: 8, name: "SHOP-8", kind: "shop" },
    { n: 11, name: "TOONS", kind: "toons" }
  ];
  const HEADLINES = [
    "WINDOWS 98 RELEASED TO RECORD CROWDS",
    "SCIENTISTS: Y2K 'PROBABLY FINE'",
    "LOCAL MAN DOWNLOADS SONG IN ONLY 45 MINUTES",
    "AREA GORILLA DEMANDS BETTER BANANAS",
    "56K MODEMS: HOW FAST IS TOO FAST?",
    "TEEN'S HOMEPAGE VISITED BY 12 PEOPLE, FAMILY PROUD"
  ];
  const PRODUCTS = [
    ["Pentium II 266 Tower", 1999], ["56k V.90 Modem", 89], ["4.3GB Hard Drive", 249],
    ["CD-R 10-Pack", 24], ["Ergonomic Trackball", 39], ["Y2K Preparedness Kit", 12]
  ];

  W98.Apps.tv98 = {
    name: "TV98", icon: "tv98", single: true,
    launch() {
      const W = 340, H = 255;
      let chIdx = 1, on = true, staticT = 0, t = 0, timer = null;

      const win = WM.create({
        title: "TV98", icon: "tv98", appId: "tv98",
        width: W + 96, height: H + 78, resizable: false, maximizable: false,
        statusbar: [{ text: "" }],
        menus: [
          { label: "Help", items: () => [
            { label: "Help Topics", click: () => W98.launch("help", "tvpet") },
            { label: "About TV98", click: () => Dialogs.about("TV98", "tv98", ["Cable-ready. Cable not included.", "Please do not sit too close."]) }
          ]}
        ],
        onClose: () => clearInterval(timer)
      });
      win.body.style.flexDirection = "row";
      /* the set */
      const setEl = el("div", { style: "flex:1;display:flex;align-items:center;justify-content:center;background:#5a4632;margin:6px;border-radius:8px" });
      const cv = el("canvas", { width: String(W), height: String(H), style: "background:#000;border:6px solid #2a2118;border-radius:10px" });
      const x = cv.getContext("2d");
      setEl.append(cv);
      /* remote */
      const remote = el("div", { style: "width:74px;flex:none;background:#303038;margin:6px 6px 6px 0;border-radius:6px;padding:8px 6px;display:flex;flex-direction:column;gap:5px;align-items:center" });
      const mkR = (label, fn) => {
        const b = el("button", { class: "btn", text: label, style: "width:58px;padding:3px 0" });
        b.addEventListener("click", fn);
        remote.append(b);
        return b;
      };
      const powerB = mkR("⏻", () => { on = !on; Sound.play("click"); if (on) burst(); sync(); });
      remote.append(el("div", { style: "color:#9098a8;font-size:9px", text: "CH" }));
      mkR("▲", () => zap(1));
      mkR("▼", () => zap(-1));
      remote.append(el("div", { style: "flex:1" }));
      remote.append(el("div", { style: "color:#606870;font-size:8px;text-align:center", text: "TV98 remote\n(lost 1999-2026)" }));
      win.body.append(setEl, remote);

      function zap(d) {
        if (!on) return;
        chIdx = (chIdx + d + CHANNELS.length) % CHANNELS.length;
        burst();
        Sound.play("click");
        sync();
      }
      function burst() { staticT = 5; }
      function sync() {
        const c = CHANNELS[chIdx];
        win.setStatus(0, on ? (W98.tr("Channel") + " " + c.n + " — " + c.name) : W98.tr("Power off. The screen misses you."));
      }

      function drawStatic() {
        const img = x.createImageData(W, H);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = (Math.random() * 255) | 0;
          d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
        }
        x.putImageData(img, 0, 0);
      }
      function bug(text) {
        x.fillStyle = "rgba(255,255,255,0.85)";
        x.font = "bold 11px Arial";
        x.fillText(text, 10, 20);
      }
      function drawNews() {
        x.fillStyle = "#20304a"; x.fillRect(0, 0, W, H);
        /* anchor desk */
        x.fillStyle = "#3a5070"; x.fillRect(0, H - 90, W, 90);
        /* anchor: procedural head */
        const bob2 = Math.sin(t / 9) * 2;
        x.fillStyle = "#4a5a80"; x.beginPath(); x.ellipse(W / 2, H - 40, 66, 42, 0, Math.PI, 0); x.fill();
        x.fillStyle = "#e8bc94"; x.beginPath(); x.ellipse(W / 2, 108 + bob2, 34, 40, 0, 0, 7); x.fill();
        x.fillStyle = "#3a2a18"; x.beginPath(); x.ellipse(W / 2, 82 + bob2, 35, 18, 0, Math.PI, 0); x.fill();
        x.fillStyle = "#202020";
        x.beginPath(); x.arc(W / 2 - 12, 104 + bob2, 3.4, 0, 7); x.fill();
        x.beginPath(); x.arc(W / 2 + 12, 104 + bob2, 3.4, 0, 7); x.fill();
        const talking = (t % 20) < 12;
        x.fillStyle = "#94502e";
        if (talking) { x.beginPath(); x.ellipse(W / 2, 128 + bob2, 8, 4 + Math.abs(Math.sin(t / 2)) * 4, 0, 0, 7); x.fill(); }
        else x.fillRect(W / 2 - 9, 126 + bob2, 18, 3);
        /* LIVE bug + ticker */
        x.fillStyle = "#c02020"; x.fillRect(W - 62, 10, 52, 18);
        x.fillStyle = "#fff"; x.font = "bold 11px Arial"; x.fillText("LIVE", W - 48, 23);
        x.fillStyle = "rgba(0,0,0,0.8)"; x.fillRect(0, H - 24, W, 24);
        x.fillStyle = "#f0d040"; x.font = "bold 12px Arial";
        const line = HEADLINES.join("  •  ") + "  •  ";
        const off = (t * 2.2) % (line.length * 7.2);
        x.fillText(line + line, 8 - off, H - 8);
        bug("NEWS 3");
      }
      function drawWeather() {
        x.fillStyle = "#103860"; x.fillRect(0, 0, W, H);
        x.fillStyle = "#e8f0ff"; x.font = "bold 18px Arial"; x.textAlign = "center";
        x.fillText(W98.tr("LOCAL FORECAST"), W / 2, 34);
        x.textAlign = "left";
        const days = ["MON", "TUE", "WED", "THU", "FRI"];
        days.forEach((d2, i) => {
          const bx = 18 + i * 62;
          x.fillStyle = "rgba(255,255,255,0.12)";
          x.fillRect(bx, 54, 52, 120);
          x.fillStyle = "#fff"; x.font = "bold 11px Arial"; x.fillText(d2, bx + 14, 70);
          /* icon: sun / cloud alternating with wobble */
          const kind = (i + ((t / 60) | 0)) % 3;
          if (kind === 0) {
            x.fillStyle = "#f0d040"; x.beginPath(); x.arc(bx + 26, 100, 12, 0, 7); x.fill();
          } else if (kind === 1) {
            x.fillStyle = "#d8e0ec";
            x.beginPath(); x.ellipse(bx + 26, 102, 16, 9, 0, 0, 7); x.fill();
            x.beginPath(); x.arc(bx + 18, 96, 8, 0, 7); x.fill();
          } else {
            x.fillStyle = "#d8e0ec"; x.beginPath(); x.ellipse(bx + 26, 96, 15, 8, 0, 0, 7); x.fill();
            x.strokeStyle = "#70b0f0"; x.lineWidth = 2;
            for (let r = 0; r < 3; r++) { x.beginPath(); x.moveTo(bx + 16 + r * 9, 108); x.lineTo(bx + 12 + r * 9, 120); x.stroke(); }
          }
          x.fillStyle = "#f0f4ff"; x.font = "bold 13px Arial";
          x.fillText((18 + ((i * 7 + ((t / 120) | 0) * 3) % 12)) + "°", bx + 16, 150);
        });
        x.fillStyle = "rgba(0,0,0,0.6)"; x.fillRect(0, H - 22, W, 22);
        x.fillStyle = "#a8d0ff"; x.font = "11px Arial";
        x.fillText(W98.tr("Forecast accuracy not guaranteed before, during, or after 1998."), 10, H - 7);
        bug("WEATHER");
      }
      function drawShop() {
        const item = PRODUCTS[((t / 90) | 0) % PRODUCTS.length];
        x.fillStyle = "#401848"; x.fillRect(0, 0, W, H);
        x.fillStyle = "#f0d040"; x.font = "bold 20px 'Times New Roman',serif"; x.textAlign = "center";
        x.fillText("SHOP-8", W / 2, 32);
        x.fillStyle = "#fff"; x.font = "bold 16px Arial";
        x.fillText(item[0], W / 2, 110);
        x.fillStyle = "#40e040"; x.font = "bold 30px Arial";
        x.fillText("$" + item[1], W / 2, 150);
        const flash = (t % 14) < 8;
        if (flash) {
          x.fillStyle = "#ff6060"; x.font = "bold 13px Arial";
          x.fillText(W98.tr("CALL NOW: 555-SHOP"), W / 2, 185);
        }
        x.fillStyle = "#c0a0d0"; x.font = "10px Arial";
        x.fillText(W98.tr("Only ") + (9 + (t / 40 | 0) % 40) + W98.tr(" left! (number may be theatrical)"), W / 2, 210);
        x.textAlign = "left";
        bug("SHOP-8");
      }
      function drawToons() {
        x.fillStyle = "#78c8e8"; x.fillRect(0, 0, W, H);
        x.fillStyle = "#58a838"; x.fillRect(0, H - 46, W, 46);
        /* a duck bounces. that's the show. it's popular. */
        const dx2 = (t * 2.4) % (W + 60) - 30;
        const dy2 = H - 70 - Math.abs(Math.sin(t / 7)) * 46;
        x.fillStyle = "#f0d040";
        x.beginPath(); x.ellipse(dx2, dy2, 17, 13, 0, 0, 7); x.fill();
        x.beginPath(); x.arc(dx2 + 13, dy2 - 12, 8, 0, 7); x.fill();
        x.fillStyle = "#f09020";
        x.beginPath(); x.moveTo(dx2 + 20, dy2 - 12); x.lineTo(dx2 + 30, dy2 - 9); x.lineTo(dx2 + 20, dy2 - 7); x.closePath(); x.fill();
        x.fillStyle = "#202020"; x.beginPath(); x.arc(dx2 + 15, dy2 - 14, 1.6, 0, 7); x.fill();
        /* second duck, slightly behind, living its life */
        const ex2 = (t * 2.4 + 150) % (W + 60) - 30;
        const ey2 = H - 66 - Math.abs(Math.sin(t / 7 + 2)) * 40;
        x.fillStyle = "#f0d040";
        x.beginPath(); x.ellipse(ex2, ey2, 13, 10, 0, 0, 7); x.fill();
        x.beginPath(); x.arc(ex2 + 10, ey2 - 9, 6, 0, 7); x.fill();
        x.fillStyle = "#fff"; x.font = "bold 14px 'Comic Sans MS','Comic Sans',cursive";
        x.textAlign = "center";
        x.fillText(W98.tr("THE DUCK HOUR"), W / 2, 28);
        x.textAlign = "left";
        bug("TOONS");
      }

      function frame() {
        if (win.closed) return;
        t++;
        if (!on) {
          x.fillStyle = "#0a0a0a"; x.fillRect(0, 0, W, H);
          const g = x.createRadialGradient(W / 2, H / 2, 1, W / 2, H / 2, 30);
          g.addColorStop(0, "rgba(120,140,160,0.10)"); g.addColorStop(1, "transparent");
          x.fillStyle = g; x.fillRect(0, 0, W, H);
          return;
        }
        if (staticT > 0) { staticT--; drawStatic(); return; }
        const c = CHANNELS[chIdx];
        if (c.kind === "static") drawStatic();
        else if (c.kind === "news") drawNews();
        else if (c.kind === "weather") drawWeather();
        else if (c.kind === "shop") drawShop();
        else drawToons();
        /* channel number OSD shortly after zapping */
        x.fillStyle = "#40e040"; x.font = "bold 16px 'Courier New',monospace";
        x.fillText(String(c.n).padStart(2, "0"), W - 34, H - 12);
      }
      timer = setInterval(frame, 100);
      burst(); sync();
      win._tv = { zap, chan: () => CHANNELS[chIdx].kind, power: () => on, toggle: () => powerB.click() };
      return win;
    }
  };
})();

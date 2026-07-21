/* surreal.js — SurrealPlayer G2: streaming audio over a 56k line.
   The buffering is part of the experience. Streams are Music engine tracks. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  const STATIONS = [
    { name: "Radio Free 98", detail: "Lo-Fi * 28.8kbps * Live", track: 0 },
    { name: "The Midnight Stream", detail: "Chill * 33.6kbps", track: 1 },
    { name: "PolkaNET 24/7", detail: "Polka * 14.4kbps * Why", track: 2 },
    { name: "Alien Frequency", detail: "??? * signal unstable", track: 3 }
  ];

  W98.Apps.surreal = {
    name: "SurrealPlayer G2", icon: "surreal", single: true,
    launch() {
      let station = -1, state = "stopped", bufTimer = null, vizTimer = null, rebufTimer = null;

      const win = WM.create({
        title: "SurrealPlayer G2", icon: "surreal", appId: "surreal",
        width: 360, height: 300, resizable: false, maximizable: false,
        menus: [
          { label: "File", items: () => [{ label: "Exit", click: () => win.close() }] },
          { label: "Help", items: () => [
            { label: "About SurrealPlayer", click: () => Dialogs.about("SurrealPlayer G2", "surreal", ["Streaming media at the speed of hope.", "Buffering is a feature."]) }
          ]}
        ]
      });
      win.body.style.background = "#28282c";
      win.body.style.color = "#d0d0d8";

      /* location bar */
      const loc = el("div", { style: "flex:none;padding:5px 8px;font-size:11px;color:#90c090;font-family:'Courier New',monospace;white-space:nowrap;overflow:hidden", text: "rtsp:// (choose a station)" });
      /* viz */
      const cv = el("canvas", { width: 344, height: 84, style: "flex:none;margin:0 8px;background:#000;border:1px solid #444" });
      const x = cv.getContext("2d");
      /* status */
      const statusEl = el("div", { style: "flex:none;padding:5px 8px;font-size:12px", text: "Stopped." });
      const bufBar = el("div", { style: "flex:none;height:9px;margin:0 8px;background:#101014;border:1px solid #444" },
        el("div", { class: "sp-buf", style: "height:100%;width:0%;background:linear-gradient(90deg,#2a6a2a,#50c050)" }));
      /* transport */
      const btns = el("div", { style: "flex:none;display:flex;gap:5px;padding:7px 8px" });
      const playB = el("button", { class: "btn", text: "▶", style: "min-width:34px" });
      const stopB = el("button", { class: "btn", text: "■", style: "min-width:34px" });
      btns.append(playB, stopB, el("span", { style: "align-self:center;font-size:10px;color:#808088", text: "SurrealPlayer G2 — Basic (free) edition" }));
      /* station list */
      const list = el("div", { class: "listview sunken", style: "flex:1;margin:0 8px 8px;background:#18181c;color:#c0c0c8;overflow:auto" });
      STATIONS.forEach((s, i) => {
        const row = el("div", { class: "lv-item", style: "padding:3px 6px" },
          el("span", { class: "nm", text: s.name }),
          el("span", { style: "margin-left:auto;font-size:10px;color:#70a070", text: s.detail }));
        row.addEventListener("dblclick", () => tune(i));
        row.addEventListener("mousedown", () => { [...list.children].forEach(r => r.classList.remove("sel")); row.classList.add("sel"); });
        list.append(row);
      });
      win.body.append(loc, cv, statusEl, bufBar, btns, list);

      function setBuf(p) { $(".sp-buf", bufBar).style.width = p + "%"; }

      function tune(i) {
        station = i;
        const s = STATIONS[i];
        loc.textContent = "rtsp://stream.surreal98.net/" + s.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
        startBuffering(true);
      }
      function startBuffering(fresh) {
        clearTimeout(bufTimer); clearTimeout(rebufTimer);
        W98.Music.pause && W98.Music.pause();
        state = "buffering";
        let p = fresh ? 0 : 20 + Math.random() * 30;
        const s = STATIONS[station];
        const step = () => {
          if (win.closed) return;
          /* 56k physics: sometimes the progress goes backwards */
          p += Math.random() < 0.18 ? -(Math.random() * 9) : 4 + Math.random() * 13;
          p = Math.max(0, p);
          setBuf(Math.min(100, p));
          statusEl.textContent = "Buffering " + s.name + "... " + Math.min(99, Math.round(p)) + "%";
          if (p >= 100) beginPlay();
          else bufTimer = setTimeout(step, 220 + Math.random() * 380);
        };
        step();
      }
      function beginPlay() {
        const s = STATIONS[station];
        state = "playing";
        setBuf(100);
        statusEl.textContent = "Playing: " + s.name + "  —  " + s.detail;
        const tracks = W98.Music.TRACKS || [];
        W98.Music.play(s.track % (tracks.length || 1));
        /* the stream will rebuffer. it always rebuffers. */
        rebufTimer = setTimeout(() => {
          if (win.closed || state !== "playing") return;
          Sound.play("click");
          startBuffering(false);
        }, 25000 + Math.random() * 30000);
      }
      function stop() {
        clearTimeout(bufTimer); clearTimeout(rebufTimer);
        state = "stopped";
        W98.Music.pause && W98.Music.pause();
        statusEl.textContent = "Stopped.";
        setBuf(0);
      }
      playB.addEventListener("click", () => {
        if (station < 0) { statusEl.textContent = "Choose a station first (double-click one)."; return; }
        if (state === "stopped") startBuffering(true);
      });
      stopB.addEventListener("click", stop);

      /* visualization: bars from the shared analyser if playing, ambient sine otherwise */
      let t = 0;
      function viz() {
        if (win.closed) return;
        x.fillStyle = "#000"; x.fillRect(0, 0, cv.width, cv.height);
        const an = Sound.getAnalyser && Sound.getAnalyser();
        if (state === "playing" && an) {
          const data = new Uint8Array(an.frequencyBinCount);
          an.getByteFrequencyData(data);
          const bars = 32;
          for (let i = 0; i < bars; i++) {
            const v = data[(i * data.length / bars) | 0] / 255;
            const h = v * 74;
            x.fillStyle = "hsl(" + (100 + i * 4) + ",70%," + (35 + v * 30) + "%)";
            x.fillRect(4 + i * 10.5, 80 - h, 8, h);
          }
        } else if (state === "buffering") {
          x.fillStyle = "#308030";
          x.font = "11px 'Courier New',monospace";
          x.fillText("[ " + ".".repeat(1 + (t / 3 | 0) % 8) + " ]", 12, 46);
        } else {
          x.strokeStyle = "#204020"; x.beginPath();
          for (let px = 0; px < cv.width; px += 3) {
            const py = 42 + Math.sin(px / 26 + t / 8) * 6;
            px ? x.lineTo(px, py) : x.moveTo(px, py);
          }
          x.stroke();
        }
        t++;
        vizTimer = setTimeout(viz, 80);
      }
      viz();

      win.opts.onClose = () => { clearTimeout(bufTimer); clearTimeout(rebufTimer); clearTimeout(vizTimer); W98.Music.pause && W98.Music.pause(); };
      return win;
    }
  };
})();

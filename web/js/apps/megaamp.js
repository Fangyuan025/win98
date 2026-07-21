/* megaamp.js — MegaAmp: the compact music player every 1998 desktop deserved.
   "It really whips the modem's tail." Original chrome, original tagline. */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.megaamp = {
  name: "MegaAmp", icon: "megaamp", single: true,
  launch(arg) {
    let vizTimer = null, marqTimer = null, marqPos = 0;
    let showList = Store.get("ampList", true);

    const win = WM.create({
      title: "MegaAmp", icon: "megaamp", appId: "megaamp",
      width: 262, height: 0, resizable: false, maximizable: false
    });
    win.el.style.height = "auto";
    win.body.style.background = "#20242c";
    win.body.style.padding = "5px";

    /* marquee + time row */
    const marq = el("div", { style: "background:#000;color:#00e000;font-family:'Courier New',monospace;font-size:11px;padding:2px 4px;white-space:nowrap;overflow:hidden;box-shadow:inset 1px 1px #000" });
    const timeLed = el("div", { style: "background:#000;color:#00e000;font-family:'Courier New',monospace;font-size:15px;font-weight:700;padding:1px 6px;box-shadow:inset 1px 1px #000" , text: "00:00" });
    const row1 = el("div", { style: "display:flex;gap:4px;margin-bottom:4px" }, timeLed, marq);
    marq.style.flex = "1";

    /* visualizer */
    const viz = el("canvas", { width: "248", height: "34", style: "background:#000;display:block;margin-bottom:4px" });
    const vx = viz.getContext("2d");

    /* transport */
    const controls = el("div", { style: "display:flex;gap:2px;align-items:center" });
    const mkB = (t, tip, fn) => {
      const b = el("button", { class: "btn", text: t, dataset: { tip }, style: "min-width:30px;width:30px;height:22px;padding:0;font-size:11px" });
      b.addEventListener("click", fn);
      controls.append(b);
      return b;
    };
    mkB("⏮", "Previous", () => step(-1));
    mkB("▶", "Play", () => {
      const s = Music.state();
      if (s.paused) Music.resume();
      else if (!s.playing) Music.play(cur);
    });
    mkB("❚❚", "Pause", () => Music.pause());
    mkB("■", "Stop", () => Music.stop());
    mkB("⏭", "Next", () => step(1));
    const vol = el("input", { type: "range", min: "0", max: "100", value: String(Math.round(Sound.volume * 100)), style: "flex:1;height:18px", dataset: { tip: "Volume" } });
    vol.addEventListener("input", () => { Sound.volume = vol.value / 100; });
    const listB = el("button", { class: "btn", text: "PL", dataset: { tip: "Playlist" }, style: "min-width:26px;width:26px;height:22px;padding:0;font-size:10px" });
    controls.append(vol, listB);

    /* playlist */
    const list = el("div", { class: "sunken", style: "background:#000;margin-top:4px;max-height:120px;overflow:auto;font-family:'Courier New',monospace;font-size:11px" });
    function paintList() {
      list.innerHTML = "";
      const s = Music.state();
      Music.TRACKS.forEach((t, i) => {
        const active = (s.playing || s.paused) && s.index === i;
        const row = el("div", {
          style: "padding:1px 5px;cursor:inherit;color:" + (active ? "#fff" : "#00c000") + (active ? ";background:#0000a0" : ""),
          text: (i + 1) + ". " + t.title + " - " + t.artist + "  [" + Music.fmt(t.duration) + "]"
        });
        row.addEventListener("dblclick", () => { cur = i; Music.play(i); });
        list.append(row);
      });
      list.style.display = showList ? "" : "none";
    }
    listB.addEventListener("click", () => {
      showList = !showList;
      Store.set("ampList", showList);
      paintList();
    });

    win.body.append(row1, viz, controls, list);

    let cur = 0;
    function step(d) {
      const s = Music.state();
      cur = ((s.index >= 0 ? s.index : cur) + d + Music.TRACKS.length) % Music.TRACKS.length;
      if (s.playing || s.paused) Music.play(cur);
      sync();
    }

    function sync() {
      const s = Music.state();
      if (s.index >= 0) cur = s.index;
      const t = Music.TRACKS[cur];
      const label = (s.playing ? "" : s.paused ? "[paused] " : "[stopped] ") +
        (cur + 1) + ". " + t.title + " - " + t.artist + " *** MegaAmp *** it really whips the modem's tail *** ";
      marq.dataset.full = label;
      timeLed.textContent = Music.fmt(s.seconds || 0);
      paintList();
      win.setTitle(s.playing ? "MegaAmp - " + t.title : "MegaAmp");
    }
    Music.onChange(sync);
    Music.onEnded((was) => { if (!win.closed) Music.play((was + 1) % Music.TRACKS.length); });

    /* marquee scroll + visualizer */
    marqTimer = setInterval(() => {
      const full = marq.dataset.full || "*** MegaAmp *** ";
      marqPos = (marqPos + 1) % full.length;
      marq.textContent = (full + full).slice(marqPos, marqPos + 40);
    }, 180);
    vizTimer = setInterval(() => {
      const s = Music.state();
      vx.fillStyle = "#000";
      vx.fillRect(0, 0, 248, 34);
      const an = Sound.getAnalyser && Sound.getAnalyser();
      if (an && s.playing) {
        const data = new Uint8Array(an.frequencyBinCount);
        an.getByteFrequencyData(data);
        const bars = 20;
        for (let i = 0; i < bars; i++) {
          const v = data[Math.floor(i * 22 + 4)] / 255;
          const h = Math.max(1, v * 32);
          const grad = vx.createLinearGradient(0, 34 - h, 0, 34);
          grad.addColorStop(0, "#e00000");
          grad.addColorStop(0.4, "#e0e000");
          grad.addColorStop(1, "#00c000");
          vx.fillStyle = grad;
          vx.fillRect(3 + i * 12.2, 34 - h, 9, h);
        }
      } else {
        vx.fillStyle = "#003000";
        for (let i = 0; i < 20; i++) vx.fillRect(3 + i * 12.2, 32, 9, 1);
      }
    }, 60);
    win.opts.onClose = () => { clearInterval(vizTimer); clearInterval(marqTimer); };

    if (arg && typeof arg.play === "number") { cur = arg.play; Music.play(cur); }
    W98.Apps.megaamp.reopen = (w, a2) => { if (a2 && typeof a2.play === "number") { Music.play(a2.play); } };
    sync();
    return win;
  }
};

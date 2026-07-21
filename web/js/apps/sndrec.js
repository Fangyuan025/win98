/* sndrec.js — Sound Recorder with live oscilloscope */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.sndrec = {
  name: "Sound Recorder", icon: "sndrec", single: true,
  launch() {
    const SOUNDS = [
      ["Windows Startup", "startup", 4.6], ["Windows Shutdown", "shutdown", 3.4],
      ["Ding", "ding", 1.4], ["Chimes", "chimes", 1.9], ["Chord (error)", "error", 0.8],
      ["Exclamation", "warn", 1.0], ["Question", "question", 1.2],
      ["Ta-da!", "tada", 1.7], ["Recycle", "recycle", 0.5], ["Modem handshake", "modem", 6.8]
    ];
    let cur = SOUNDS[2];   // Ding
    let playing = false, playTimer = null, raf = null, pos = 0;

    const win = WM.create({
      title: "Sound - Sound Recorder", icon: "sndrec", appId: "sndrec",
      width: 300, height: 0, resizable: false, maximizable: false,
      menus: [
        { label: "File", items: () => [
          { label: "Open...", click: openDialog },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Help", items: () => [
          { label: "About Sound Recorder", click: () => Dialogs.about("Sound Recorder", "sndrec", ["Green wiggly line technology since 1991."]) }
        ]}
      ],
      onClose: stop
    });
    win.el.style.height = "auto";
    win.body.style.padding = "8px";

    const posLbl = el("div", { style: "font-size:11px", text: "Position:\n0.00 sec." });
    const lenLbl = el("div", { style: "font-size:11px;text-align:right", text: "Length:\n1.40 sec." });
    posLbl.style.whiteSpace = lenLbl.style.whiteSpace = "pre";

    const scope = el("canvas", { class: "sunken", width: "130", height: "50" });
    const sx = scope.getContext("2d");
    function drawScope(flat) {
      sx.fillStyle = "#000";
      sx.fillRect(0, 0, 130, 50);
      sx.strokeStyle = "#00e000";
      sx.lineWidth = 1;
      sx.beginPath();
      const an = !flat && Sound.getAnalyser && Sound.getAnalyser();
      if (an && playing) {
        const data = new Uint8Array(an.fftSize);
        an.getByteTimeDomainData(data);
        for (let i = 0; i < 130; i++) {
          const v = data[(i * (data.length / 130)) | 0] / 255;
          const y = 25 + (v - 0.5) * 44;
          i ? sx.lineTo(i, y) : sx.moveTo(i, y);
        }
      } else {
        sx.moveTo(0, 25); sx.lineTo(130, 25);
      }
      sx.stroke();
    }
    drawScope(true);

    const top = el("div", { style: "display:flex;align-items:center;gap:8px;justify-content:space-between" },
      posLbl, scope, lenLbl);

    const slider = el("input", { type: "range", min: "0", max: "100", value: "0", style: "width:100%;margin:8px 0 4px" });
    slider.addEventListener("input", () => {
      pos = slider.value / 100 * cur[2];
      posLbl.textContent = "Position:\n" + pos.toFixed(2) + " sec.";
    });

    const btnRow = el("div", { style: "display:flex;gap:4px;justify-content:center" });
    const mkB = (txt, tip, fn) => {
      const b = el("button", { class: "btn", text: txt, style: "min-width:44px;font-size:13px", dataset: { tip } });
      b.addEventListener("click", fn);
      btnRow.append(b);
      return b;
    };
    mkB("⏮", "Seek to Start", () => { pos = 0; slider.value = 0; posLbl.textContent = "Position:\n0.00 sec."; });
    mkB("⏭", "Seek to End", () => { pos = cur[2]; slider.value = 100; posLbl.textContent = "Position:\n" + cur[2].toFixed(2) + " sec."; });
    const playB = mkB("▶", "Play", play);
    mkB("■", "Stop", stop);
    mkB("●", "Record", () => {
      Sound.play("error");
      WM.msgbox({
        title: "Sound Recorder", icon: "error",
        text: "No recording device is installed.\n\n(An era-accurate experience: most 1998 computers came with a microphone jack and no microphone.)"
      });
    });

    const nameLbl = el("div", { style: "text-align:center;margin-top:8px;font-size:11px", text: "Sound: Ding" });
    win.body.append(top, slider, btnRow, nameLbl);

    function tickScope() {
      drawScope();
      if (playing) raf = setTimeout(tickScope, 40);
    }
    function play() {
      stop();
      playing = true;
      Sound.play(cur[1]);
      const t0 = Date.now() - pos * 1000;
      tickScope();
      playTimer = setInterval(() => {
        pos = (Date.now() - t0) / 1000;
        if (pos >= cur[2]) { stop(); return; }
        slider.value = String(Math.min(100, pos / cur[2] * 100));
        posLbl.textContent = "Position:\n" + pos.toFixed(2) + " sec.";
      }, 60);
    }
    function stop() {
      playing = false;
      clearInterval(playTimer);
      clearTimeout(raf);
      pos = 0;
      slider.value = "0";
      posLbl.textContent = "Position:\n0.00 sec.";
      drawScope(true);
    }
    function setSound(s) {
      stop();
      cur = s;
      lenLbl.textContent = "Length:\n" + s[2].toFixed(2) + " sec.";
      nameLbl.textContent = "Sound: " + s[0];
      win.setTitle(s[0] + " - Sound Recorder");
    }

    function openDialog() {
      const dw = WM.create({
        title: "Open", icon: "sndrec", width: 300, height: 0,
        resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
      });
      dw.el.style.height = "auto";
      const list = el("div", { class: "listview sunken", style: "height:150px;padding:2px;margin:12px 14px 4px" });
      SOUNDS.forEach(s => {
        const row = el("div", { class: "lv-item" }, Icons.img("sndrec", 16), el("span", { class: "nm", text: s[0] + ".wav" }));
        if (s === cur) row.classList.add("sel");
        row.addEventListener("click", () => {
          $$(".lv-item", list).forEach(r => r.classList.remove("sel"));
          row.classList.add("sel");
        });
        row.addEventListener("dblclick", () => { setSound(s); dw.close(true); });
        row._s = s;
        list.append(row);
      });
      const r = el("div", { class: "msgbox-btns" });
      const ok = el("button", { class: "btn default", text: "Open" });
      const cancel = el("button", { class: "btn", text: "Cancel", onclick: () => dw.close() });
      ok.addEventListener("click", () => {
        const selRow = $(".lv-item.sel", list);
        if (selRow) setSound(selRow._s);
        dw.close(true);
      });
      r.append(ok, cancel);
      dw.body.append(list, r);
    }

    setSound(cur);
    return win;
  }
};

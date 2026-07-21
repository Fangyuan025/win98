/* sysmon.js — System Monitor: scrolling graphs of numbers that feel true.
   CPU reacts to open windows; memory reacts to the virtual disk; morale holds steady. */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.sysmon = {
  name: "System Monitor", icon: "sysmon", single: true,
  launch() {
    const win = WM.create({
      title: "System Monitor", icon: "sysmon", appId: "sysmon",
      width: 420, height: 360, minWidth: 320, minHeight: 260,
      statusbar: [{ text: "" }],
      menus: [
        { label: "File", items: () => [{ label: "Exit", click: () => win.close() }] },
        { label: "Help", items: () => [
          { label: "About System Monitor", click: () => Dialogs.about("System Monitor", "sysmon", ["Graphs go up. Graphs go down.", "This is the whole product."]) }
        ]}
      ],
      onClose: () => clearInterval(timer)
    });
    win.body.style.padding = "6px";
    win.body.style.gap = "6px";

    const METRICS = [
      { name: "Kernel: Processor Usage (%)", color: "#00a000", data: [], calc: () => {
        const base = 4 + WM.wins.filter(w => !w.closed && !w.opts.noTaskbar).length * 7;
        return Math.min(98, base + Math.random() * 18 + (Math.random() < 0.06 ? 35 : 0));
      }},
      { name: "Memory Manager: Allocated (MB)", color: "#0000c0", data: [], calc: () => {
        const used = 22 + (FS.sizeOf(FS.get("C:")) / 60000);
        return Math.min(64, used + Math.random() * 3);
      }, max: 64 },
      { name: "Dial-Up: Bytes Received/sec", color: "#c00000", data: [], calc: () => {
        const on = W98.Net && W98.Net.connected;
        return on ? 1200 + Math.random() * 4400 + (Math.random() < 0.1 ? 1800 : 0) : Math.random() * 60;
      }, max: 7000 }
    ];

    const panes = METRICS.map(m => {
      const wrap = el("div", { style: "flex:1;display:flex;flex-direction:column;min-height:0" });
      const lbl = el("div", { style: "font-size:10px;padding:1px 2px", text: m.name });
      const cv = el("canvas", { height: 70, style: "flex:1;background:#000;border:1px solid #808080;width:100%" });
      wrap.append(lbl, cv);
      win.body.append(wrap);
      return { m, cv, lbl };
    });

    function draw() {
      panes.forEach(({ m, cv, lbl }) => {
        const W2 = cv.clientWidth || 380;
        if (cv.width !== W2) cv.width = W2;
        const H2 = cv.height;
        const x = cv.getContext("2d");
        x.fillStyle = "#000"; x.fillRect(0, 0, W2, H2);
        x.strokeStyle = "#004000";
        for (let gy = 0; gy < H2; gy += 14) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W2, gy); x.stroke(); }
        for (let gx2 = W2 - ((Date.now() / 400) % 20); gx2 > 0; gx2 -= 20) { x.beginPath(); x.moveTo(gx2, 0); x.lineTo(gx2, H2); x.stroke(); }
        const max = m.max || 100;
        x.strokeStyle = m.color; x.lineWidth = 1.6;
        x.beginPath();
        const n = m.data.length;
        m.data.forEach((v, i) => {
          const px = W2 - (n - 1 - i) * 3;
          const py = H2 - (v / max) * (H2 - 6) - 3;
          i === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
        });
        x.stroke();
        const cur = m.data[m.data.length - 1] || 0;
        x.fillStyle = m.color; x.font = "bold 11px 'Courier New',monospace";
        x.fillText(m.name.includes("MB") ? cur.toFixed(1) : Math.round(cur), 6, 14);
      });
      const wins = WM.wins.filter(w => !w.closed && !w.opts.noTaskbar).length;
      win.setStatus(0, W98.tr("Windows open: ") + wins + "   " + W98.tr("System resources: ") + Math.max(4, 93 - wins * 3) + W98.tr("% free"));
    }

    const timer = setInterval(() => {
      if (win.closed) return;
      METRICS.forEach(m => {
        m.data.push(m.calc());
        const cap = Math.ceil((win.body.clientWidth || 400) / 3) + 4;
        if (m.data.length > cap) m.data.splice(0, m.data.length - cap);
      });
      draw();
    }, 400);
    for (let i = 0; i < 40; i++) METRICS.forEach(m => m.data.push(m.calc()));
    draw();
    win._mon = { sample: () => METRICS.map(m => m.data[m.data.length - 1]) };
    return win;
  }
};

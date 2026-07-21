/* printmgr.js — the 1998 printing experience: dialog, spooler, tray printer,
   inkjet noises. No trees are harmed; no paper appears. */
"use strict";
W98.Print = (() => {
  let jobs = [];          // {id, name, app, pages, copies, page, progress, status}
  let paused = false;
  let trayEl = null, procTimer = null, queueWin = null, jobSeq = 0;

  function whir() {
    const bus = Sound.audio();
    if (!bus) return;
    const len = 0.22;
    const buf = bus.ctx.createBuffer(1, Math.ceil(bus.ctx.sampleRate * len), bus.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (0.4 + 0.6 * Math.sin(i / d.length * Math.PI));
    const src = bus.ctx.createBufferSource();
    src.buffer = buf;
    const f = bus.ctx.createBiquadFilter();
    f.type = "bandpass"; f.frequency.value = 900 + Math.random() * 500; f.Q.value = 1.2;
    const g = bus.ctx.createGain(); g.gain.value = 0.04;
    src.connect(f); f.connect(g); g.connect(bus.master);
    src.start();
  }

  function trayIcon() {
    if (trayEl) return;
    const c = document.createElement("canvas");
    c.width = 16; c.height = 16;
    const x = c.getContext("2d");
    x.fillStyle = "#c0c0c0"; x.fillRect(1, 6, 14, 6);
    x.strokeStyle = "#000"; x.strokeRect(1.5, 6.5, 13, 5);
    x.fillStyle = "#fff"; x.fillRect(4, 2, 8, 5);
    x.strokeStyle = "#404040"; x.strokeRect(4.5, 2.5, 7, 4);
    x.fillStyle = "#fff"; x.fillRect(4, 11, 8, 4);
    x.strokeStyle = "#404040"; x.strokeRect(4.5, 11.5, 7, 3);
    x.fillStyle = "#00c000"; x.fillRect(12, 7.5, 2, 2);
    c.style.width = "16px"; c.style.height = "16px";
    c.dataset.tip = "1 document(s) pending";
    c.addEventListener("dblclick", openQueue);
    c.addEventListener("click", openQueue);
    (W98.Taskbar && W98.Taskbar.trayIcons ? W98.Taskbar.trayIcons() : $("#tray-icons")).prepend(c);
    trayEl = c;
  }
  function syncTray() {
    if (jobs.length && !trayEl) trayIcon();
    if (!jobs.length && trayEl) { trayEl.remove(); trayEl = null; }
    if (trayEl) trayEl.dataset.tip = jobs.length + " document(s) " + (paused ? "held" : "pending") + " for EpsonJet 700";
  }

  function process() {
    if (!jobs.length || paused) return;
    const j = jobs[0];
    j.status = "Printing";
    j.progress += 8 + Math.random() * 10;
    if (Math.random() < 0.7) whir();
    if (j.progress >= 100) {
      j.page++;
      j.progress = 0;
      if (j.page > j.pages * j.copies) {
        jobs.shift();
        Sound.play("ding");
        syncTray();
      }
    }
    paintQueue();
  }
  function ensureLoop() {
    if (!procTimer) procTimer = setInterval(() => {
      process();
      if (!jobs.length) { clearInterval(procTimer); procTimer = null; }
    }, 400);
  }

  function submit(doc) {
    /* the classic Print dialog */
    const win = WM.create({
      title: "Print", icon: "printer", width: 380, height: 0,
      resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
    });
    win.el.style.height = "auto";
    const printerSel = el("select", { class: "field", style: "flex:1" });
    ["EpsonJet 700 Color", "Generic / Text Only", "The Office Printer (always jammed)"].forEach(p =>
      printerSel.append(el("option", { text: p })));
    const copies = el("input", { type: "number", class: "field", value: "1", min: "1", max: "99", style: "width:52px" });
    const btns = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:8px 14px 12px" });
    const ok = el("button", { class: "btn default", text: "OK" });
    const cancel = el("button", { class: "btn", text: "Cancel", onclick: () => win.close() });
    ok.addEventListener("click", () => {
      const nCopies = clamp(parseInt(copies.value) || 1, 1, 99);
      const jammed = printerSel.value.indexOf("jammed") >= 0;
      win.close(true);
      if (jammed) {
        Sound.play("error");
        WM.msgbox({ title: "Print", icon: "error", text: "The Office Printer reports: PAPER JAM.\nIt is not jammed. It just knows you are in a hurry." });
        return;
      }
      jobs.push({ id: ++jobSeq, name: doc.name, app: doc.app || "", pages: doc.pages || 1, copies: nCopies, page: 1, progress: 0, status: "Spooling" });
      syncTray();
      ensureLoop();
      paintQueue();
    });
    btns.append(ok, cancel);
    win.body.append(
      el("div", { style: "padding:14px 14px 4px" },
        el("fieldset", { class: "grp" }, el("legend", { text: "Printer" }),
          el("div", { style: "display:flex;gap:8px;align-items:center" }, el("span", { text: "Name:" }), printerSel),
          el("div", { style: "font-size:11px;margin-top:4px;color:#404040", text: "Status: Ready   Where: LPT1   Comment: hums quietly" })),
        el("div", { style: "display:flex;gap:16px;margin-top:6px;align-items:center" },
          el("fieldset", { class: "grp", style: "flex:1;margin:0" }, el("legend", { text: "Print range" }),
            el("label", { class: "checkline" }, (() => { const r = el("input", { type: "radio", checked: "" }); r.checked = true; return r; })(), "All " + (doc.pages || 1) + " page(s)")),
          el("fieldset", { class: "grp", style: "margin:0" }, el("legend", { text: "Copies" }),
            el("div", { style: "display:flex;gap:6px;align-items:center" }, el("span", { text: "Number:" }), copies)))),
      btns);
    return win;
  }

  let queueList = null;
  function paintQueue() {
    if (!queueWin || queueWin.closed || !queueList) return;
    queueList.innerHTML = "";
    const table = el("table", { style: "border-collapse:collapse;width:100%" });
    const hd = el("tr");
    ["Document Name", "Status", "Progress", "Pages"].forEach(h => hd.append(el("th", {
      text: h, style: "text-align:left;padding:2px 6px;background:var(--face);box-shadow:inset -1px -1px var(--dark), inset 1px 1px var(--lighter)"
    })));
    table.append(hd);
    jobs.forEach((j, i) => {
      const tr = el("tr");
      const prog = el("td", { style: "padding:2px 6px;width:120px" });
      prog.append(el("div", { class: "progress", style: "height:10px" },
        el("div", { class: "bar", style: "width:" + Math.round(j.progress) + "%" })));
      tr.append(
        el("td", { text: j.name, style: "padding:1px 6px;white-space:nowrap" }),
        el("td", { text: paused ? "Paused" : (i === 0 ? j.status : "Waiting"), style: "padding:1px 6px" }),
        prog,
        el("td", { text: Math.min(j.page, j.pages * j.copies) + " of " + (j.pages * j.copies), style: "padding:1px 6px" }));
      tr.addEventListener("dblclick", () => {
        WM.msgbox({ title: "Print Queue", icon: "question", text: "Cancel printing '" + j.name + "'?", buttons: ["Yes", "No"] })
          .then(r => {
            if (r === "Yes") {
              jobs.splice(jobs.indexOf(j), 1);
              syncTray(); paintQueue();
            }
          });
      });
      table.append(tr);
    });
    queueList.append(table);
    if (!jobs.length) queueList.append(el("div", { style: "padding:16px;text-align:center;color:#808080", text: "There are no documents in the queue.\nThe printer hums contentedly." }));
    queueWin.setStatus(0, jobs.length + " document(s) in queue" + (paused ? " — printing paused" : ""));
  }

  function openQueue() {
    if (queueWin && !queueWin.closed) { queueWin.focus(); return queueWin; }
    queueWin = WM.create({
      title: "EpsonJet 700 Color", icon: "printer", appId: "printqueue",
      width: 440, height: 240, minWidth: 360, minHeight: 160,
      statusbar: [""],
      menus: [
        { label: "Printer", items: () => [
          { label: "Pause Printing", checked: paused, click: () => { paused = !paused; syncTray(); paintQueue(); } },
          { label: "Purge Print Documents", disabled: !jobs.length, click: () => { jobs = []; syncTray(); paintQueue(); } },
          "-",
          { label: "Close", click: () => queueWin.close() }
        ]},
        { label: "Help", items: () => [
          { label: "About Printing", click: () => WM.msgbox({ title: "Print Queue", icon: "info", text: "Documents wait here in an orderly line, which is more than can be said for 1998 office workers.\n\nDouble-click a job to cancel it." }) }
        ]}
      ]
    });
    queueList = el("div", { class: "listview sunken", style: "flex:1" });
    queueWin.body.append(queueList);
    paintQueue();
    return queueWin;
  }

  return { submit, openQueue, get jobCount() { return jobs.length; } };
})();

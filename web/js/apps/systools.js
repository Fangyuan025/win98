/* systools.js — Disk Defragmenter & ScanDisk */
"use strict";
W98.Apps = W98.Apps || {};

/* ================= Disk Defragmenter ================= */
W98.Apps.defrag = {
  name: "Disk Defragmenter", icon: "defrag", single: true,
  launch() {
    /* drive picker first, like the real thing */
    const pick = WM.create({
      title: "Select Drive", icon: "defrag", width: 340, height: 0,
      resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
    });
    pick.el.style.height = "auto";
    const sel = el("select", { class: "field", style: "width:100%" });
    sel.append(el("option", { text: "Drive C   Physical drive   4.00 GB" }));
    pick.body.append(
      el("div", { style: "padding:14px 16px 4px" },
        el("div", { text: "Which drive do you want to defragment?", style: "margin-bottom:8px" }), sel,
        el("div", { class: "sunken-thin", style: "margin-top:10px;padding:6px;font-size:11px;line-height:1.5", html:
          "<b>Copyright © 1998 Intel Corporation-ish.</b><br>Intel Application Launch Accelerator would go here, but the blocks are the part everyone remembers." })),
      (() => {
        const r = el("div", { class: "msgbox-btns" });
        const ok = el("button", { class: "btn default", text: "OK" });
        const exit = el("button", { class: "btn", text: "Exit" });
        ok.addEventListener("click", () => { pick.close(true); main(); });
        exit.addEventListener("click", () => pick.close());
        r.append(ok, exit);
        return r;
      })()
    );

    function main() {
      const COLS = 88, ROWS = 46, CELL = 5;
      const N = COLS * ROWS;
      // block states: 0 free, 1 unoptimized, 2 fragmented, 3 optimized, 4 reading, 5 writing
      const COLORS = ["#ffffff", "#00a8f0", "#f00000", "#0000a8", "#ffff00", "#00d000"];
      let blocks = [], writePos = 0, scanPos = 0, moved = 0, totalData = 0;
      let paused = false, details = true, timer = null;

      function init() {
        blocks = []; writePos = 0; scanPos = 0; moved = 0; totalData = 0;
        for (let i = 0; i < N; i++) {
          const r = Math.random();
          if (r < 0.42) { blocks.push(0); }
          else if (r < 0.52) { blocks.push(2); totalData++; }
          else { blocks.push(1); totalData++; }
        }
      }

      const win = WM.create({
        title: "Defragmenting Drive C", icon: "defrag", appId: "defrag",
        width: COLS * CELL + 30, height: 420, resizable: false, maximizable: false,
        onClose: () => clearInterval(timer)
      });
      win.body.style.padding = "8px";

      const cv = el("canvas", { class: "defrag-grid" });
      cv.width = COLS * CELL; cv.height = ROWS * CELL;
      const cx = cv.getContext("2d");
      function paintAll() {
        for (let i = 0; i < N; i++) paint(i);
      }
      function paint(i) {
        cx.fillStyle = COLORS[blocks[i]];
        cx.fillRect((i % COLS) * CELL, Math.floor(i / COLS) * CELL, CELL - 1, CELL - 1);
      }

      const legend = el("div", { style: "display:flex;gap:14px;flex-wrap:wrap;margin:6px 0;font-size:11px" });
      [["Unoptimized data", 1], ["Fragmented", 2], ["Optimized", 3], ["Free space", 0]].forEach(([t, s]) => {
        legend.append(el("span", {}, el("span", { class: "legend-box", style: "background:" + COLORS[s] }), t));
      });

      const pctText = el("div", { style: "text-align:center;margin:4px 0", text: "0% complete" });
      const bar = el("div", { class: "progress", style: "margin:2px 0 8px" }, el("div", { class: "bar", style: "width:0%" }));

      const btnRow = el("div", { class: "msgbox-btns", style: "padding:0" });
      const stopB = el("button", { class: "btn", text: "Stop" });
      const pauseB = el("button", { class: "btn", text: "Pause" });
      const detailsB = el("button", { class: "btn", text: "Hide Details" });
      btnRow.append(stopB, pauseB, detailsB);
      win.body.append(cv, legend, pctText, bar, btnRow);
      paintAll();

      function step() {
        if (paused) return;
        // a few operations per tick keeps it mesmerizing but brisk
        for (let k = 0; k < 3; k++) {
          // find next block that needs moving
          while (scanPos < N && (blocks[scanPos] === 3 || blocks[scanPos] === 0)) scanPos++;
          if (scanPos >= N) { finish(); return; }
          // read flash
          const src = scanPos;
          blocks[src] = 4; paint(src);
          // compact write position
          while (writePos < N && blocks[writePos] === 3) writePos++;
          const dst = writePos;
          setTimeout(() => {
            if (win.closed) return;
            if (dst < src) { blocks[dst] = 3; paint(dst); blocks[src] = 0; }
            else blocks[src] = 3;
            paint(src);
            moved++;
            const pct = Math.min(100, Math.round(moved / totalData * 100));
            pctText.textContent = pct + "% complete";
            $(".bar", bar).style.width = pct + "%";
          }, 24);
          scanPos++;
        }
      }
      function finish() {
        clearInterval(timer);
        pctText.textContent = "100% complete";
        $(".bar", bar).style.width = "100%";
        Sound.play("tada");
        WM.msgbox({
          title: "Disk Defragmenter", icon: "info",
          text: "Defragmentation of Drive C is complete.\n\nDo you want to quit Disk Defragmenter?",
          buttons: ["Yes", "No"]
        }).then(r => {
          if (r === "Yes") win.close();
          else { init(); paintAll(); pctText.textContent = "0% complete"; $(".bar", bar).style.width = "0%"; timer = setInterval(step, 30); }
        });
      }
      stopB.addEventListener("click", () => {
        clearInterval(timer);
        WM.msgbox({ title: "Disk Defragmenter", icon: "question", text: "Are you sure you want to stop defragmenting this drive?", buttons: ["Yes", "No"] })
          .then(r => { if (r === "Yes") win.close(); else timer = setInterval(step, 30); });
      });
      pauseB.addEventListener("click", () => {
        paused = !paused;
        pauseB.textContent = paused ? "Resume" : "Pause";
      });
      detailsB.addEventListener("click", () => {
        details = !details;
        cv.style.display = details ? "" : "none";
        legend.style.display = details ? "" : "none";
        detailsB.textContent = details ? "Hide Details" : "Show Details";
        win.el.style.height = details ? "420px" : "180px";
      });

      init();
      paintAll();
      timer = setInterval(step, 30);
      return win;
    }
  }
};

/* ================= VirusScan 98 ================= */
W98.Apps.vscan = {
  name: "VirusScan 98", icon: "shield", single: true,
  launch() {
    let timer = null, running = false;

    const win = WM.create({
      title: "VirusScan 98", icon: "shield", appId: "vscan",
      width: 420, height: 0, resizable: false, maximizable: false,
      onClose: () => clearInterval(timer)
    });
    win.el.style.height = "auto";
    win.body.style.padding = "10px";

    const fileLbl = el("div", { class: "sunken-thin", style: "padding:4px 6px;font-family:'Courier New',monospace;font-size:11px;white-space:nowrap;overflow:hidden;height:22px", text: "Ready." });
    const bar = el("div", { class: "progress", style: "margin:8px 0" }, el("div", { class: "bar", style: "width:0%" }));
    const stats = el("div", { style: "display:grid;grid-template-columns:auto auto;gap:4px 18px;font-size:11px;margin-bottom:8px" });
    const scanned = el("span", { text: "0" }), found = el("span", { text: "0" });
    stats.append(el("span", { text: "Files scanned:" }), scanned, el("span", { text: "Viruses found:" }), found);

    const btns = el("div", { class: "msgbox-btns", style: "padding:0;justify-content:flex-end" });
    const startB = el("button", { class: "btn default", text: "Scan Now" });
    const closeB = el("button", { class: "btn", text: "Close", onclick: () => win.close() });
    btns.append(startB, closeB);
    win.body.append(
      el("div", { style: "display:flex;gap:10px;align-items:center;margin-bottom:8px" },
        Icons.img("shield", 32),
        el("div", { style: "line-height:1.4" }, el("b", { text: "VirusScan 98" }), el("div", { style: "font-size:11px", text: "Guarding this computer against all 14 known viruses." }))),
      fileLbl, bar, stats, btns);

    function collectPaths() {
      const out = [];
      (function walk(path, node) {
        for (const k in node.ch) {
          const p = path + "/" + k;
          if (node.ch[k].t === "d") walk(p, node.ch[k]);
          else out.push(p);
        }
      })("C:", FS.get("C:"));
      return out;
    }

    startB.addEventListener("click", () => {
      if (running) return;
      running = true;
      startB.disabled = true;
      const paths = collectPaths();
      let i = 0;
      timer = setInterval(() => {
        // a few files per tick, with dramatic pauses on system files
        const step = Math.random() < 0.15 ? 1 : 3;
        i = Math.min(paths.length, i + step);
        fileLbl.textContent = "Scanning: " + FS.display(paths[Math.max(0, i - 1)] || "");
        scanned.textContent = String(i);
        $(".bar", bar).style.width = Math.round(i / paths.length * 100) + "%";
        if (i >= paths.length) {
          clearInterval(timer);
          running = false;
          startB.disabled = false;
          fileLbl.textContent = "Scan complete.";
          Sound.play("chimes");
          WM.msgbox({
            title: "VirusScan 98", icon: "info",
            text: "Scan complete.\n\nFiles scanned: " + paths.length + "\nViruses found: 0\n\nThis computer is spotless. 1998 was a more innocent time — the worst thing on this machine is the Y2K bug, and that is a scheduling issue."
          });
        }
      }, 90);
    });
    return win;
  }
};

/* ================= ScanDisk ================= */
W98.Apps.scandisk = {
  name: "ScanDisk", icon: "scandisk", single: true,
  launch() {
    const win = WM.create({
      title: "ScanDisk - (C:)", icon: "scandisk", appId: "scandisk",
      width: 420, height: 360, resizable: false, maximizable: false
    });
    win.body.style.padding = "10px";
    let running = false, timer = null, thorough = false;

    const driveList = el("div", { class: "listview sunken", style: "height:64px;padding:2px" });
    const row = el("div", { class: "lv-item sel" }, Icons.img("drivec", 16), el("span", { class: "nm", text: "(C:)" }));
    driveList.append(row);

    const mkRadio = (label, val, checked) => {
      const r = el("label", { class: "checkline" }, el("input", { type: "radio", name: "sd-type" }), label);
      const i = $("input", r);
      i.checked = checked;
      i.addEventListener("change", () => { if (i.checked) thorough = val; });
      return r;
    };
    const fix = el("label", { class: "checkline" }, el("input", { type: "checkbox", checked: "" }), "Automatically fix errors");
    $("input", fix).checked = true;

    const phase = el("div", { style: "margin:8px 0 4px;height:14px", text: "" });
    const barWrap = el("div", { class: "progress" }, el("div", { class: "bar", style: "width:0%" }));

    const btns = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:10px 0 0" });
    const startB = el("button", { class: "btn default", text: "Start" });
    const closeB = el("button", { class: "btn", text: "Close" });
    btns.append(startB, closeB);

    win.body.append(
      el("div", { text: "Select the drive(s) you want to check for errors:", style: "margin-bottom:4px" }),
      driveList,
      el("fieldset", { class: "grp" }, el("legend", { text: "Type of test" }),
        mkRadio("Standard (checks files and folders for errors)", false, true),
        mkRadio("Thorough (performs Standard test and scans disk surface)", true, false)),
      fix, phase, barWrap, btns
    );

    function countFS() {
      let files = 0, folders = 0;
      (function walk(node) {
        for (const k in node.ch) {
          if (node.ch[k].t === "d") { folders++; walk(node.ch[k]); }
          else files++;
        }
      })(FS.get("C:"));
      return { files, folders };
    }

    startB.addEventListener("click", () => {
      if (running) return;
      running = true;
      startB.disabled = true;
      let pct = 0;
      const phases = thorough
        ? [[18, "Checking file allocation tables..."], [38, "Checking folders..."], [62, "Checking files..."], [100, "Scanning disk surface..."]]
        : [[25, "Checking file allocation tables..."], [55, "Checking folders..."], [100, "Checking files..."]];
      timer = setInterval(() => {
        pct += thorough ? 0.8 : 1.6;
        const ph = phases.find(p => pct <= p[0]);
        phase.textContent = ph ? ph[1] : "";
        $(".bar", barWrap).style.width = Math.min(100, pct) + "%";
        if (pct >= 100) {
          clearInterval(timer);
          running = false;
          startB.disabled = false;
          phase.textContent = "Complete.";
          const { files, folders } = countFS();
          const used = FS.sizeOf(FS.get("C:"));
          Sound.play("ding");
          const res = WM.create({
            title: "ScanDisk Results - (C:)", icon: "scandisk", width: 340, height: 0,
            resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
          });
          res.el.style.height = "auto";
          res.body.append(
            el("div", { style: "padding:12px 16px 4px" },
              el("div", { text: "ScanDisk found no errors on this drive.", style: "margin-bottom:10px" }),
              el("div", { class: "sunken-thin", style: "padding:8px;display:grid;grid-template-columns:1fr auto;gap:4px 12px;font-size:11px" },
                el("span", { text: "4,294,967,296 bytes total disk space" }), el("span"),
                el("span", { text: used.toLocaleString() + " bytes in " + files + " user files" }), el("span"),
                el("span", { text: folders + " folders on this drive" }), el("span"),
                el("span", { text: "0 bytes in bad sectors" }), el("span"),
                el("span", { text: (4294967296 - used).toLocaleString() + " bytes available on disk" }), el("span"))),
            (() => {
              const r = el("div", { class: "msgbox-btns" });
              const ok = el("button", { class: "btn default", text: "Close" });
              ok.addEventListener("click", () => res.close());
              r.append(ok);
              return r;
            })()
          );
        }
      }, 50);
    });
    closeB.addEventListener("click", () => win.close());
    win.opts.onClose = () => clearInterval(timer);
    return win;
  }
};

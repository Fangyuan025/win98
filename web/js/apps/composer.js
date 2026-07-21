/* composer.js — Composer 98: a step sequencer for the aspiring bedroom producer.
   Four tracks, sixteen steps, saved to .trk files on the C: drive. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  const STEPS = 16;
  const ROWS = 13;                     /* one octave + a bit, top = high */
  const BASE = 440 * Math.pow(2, -9 / 12);   /* C4 */
  const noteFreq = (row) => BASE * Math.pow(2, (ROWS - 1 - row) / 12);
  const NOTE_NAMES = ["C5", "B4", "A#4", "A4", "G#4", "G4", "F#4", "F4", "E4", "D#4", "D4", "C#4", "C4"];
  const TRACKS = [
    { id: "lead", name: "Lead", color: "#3060d0", wave: "square", gain: 0.07 },
    { id: "bass", name: "Bass", color: "#20a040", wave: "triangle", gain: 0.12, oct: -2 },
    { id: "bell", name: "Bell", color: "#c07020", wave: "sine", gain: 0.09, oct: 1 },
    { id: "drum", name: "Drums", color: "#a03030", drums: true }
  ];
  const DRUM_NAMES = ["Kick", "Snare", "Hat"];

  function blank() {
    return {
      tempo: 120,
      grids: TRACKS.map(t => {
        const rows = t.drums ? 3 : ROWS;
        return Array.from({ length: rows }, () => new Array(STEPS).fill(0));
      })
    };
  }

  W98.Apps.composer = {
    name: "Composer 98", icon: "composer", single: true,
    launch(pathArg) {
      let song = blank();
      let curPath = null;
      if (typeof pathArg === "string") {
        const raw = FS.readFile(pathArg);
        try {
          const p = JSON.parse(String(raw).replace(/^TRK1(\\n|\n)/, ""));
          if (p && p.grids) { song = p; curPath = pathArg; }
        } catch (e) {}
      }
      let track = 0, playing = false, playStep = -1, timer = null, dirty = false;

      const win = WM.create({
        title: title(), icon: "composer", appId: "composer",
        width: 560, height: 396, resizable: false, maximizable: false,
        statusbar: [{ text: "Click cells to place notes" }],
        menus: [
          { label: "File", items: () => [
            { label: "New", click: () => { song = blank(); curPath = null; dirty = false; paintAll(); } },
            { label: "Open...", click: doOpen },
            { label: "Save", accel: "Ctrl+S", click: doSave },
            { label: "Save As...", click: doSaveAs },
            "-",
            { label: "Exit", click: () => win.close() }
          ]},
          { label: "Help", items: () => [
            { label: "About Composer 98", click: () => Dialogs.about("Composer 98", "composer", ["Sixteen steps to stardom.", "All songs are bangers at 120 BPM."]) }
          ]}
        ]
      });
      function title() { return (curPath ? FS.segs(curPath).pop() : "untitled.trk") + " - Composer 98"; }

      /* ---------- audio ---------- */
      function playNote(t, row, when, dur) {
        const bus = Sound.audio();
        if (!bus) return;
        const at = when || bus.ctx.currentTime;
        if (t.drums) {
          const g = bus.ctx.createGain();
          g.connect(bus.master);
          if (row === 0) {              /* kick */
            const o = bus.ctx.createOscillator();
            o.type = "sine";
            o.frequency.setValueAtTime(140, at);
            o.frequency.exponentialRampToValueAtTime(38, at + 0.12);
            g.gain.setValueAtTime(0.28, at);
            g.gain.exponentialRampToValueAtTime(0.001, at + 0.16);
            o.connect(g); o.start(at); o.stop(at + 0.18);
          } else {                      /* snare / hat: filtered noise */
            const len = row === 1 ? 0.12 : 0.05;
            const buf = bus.ctx.createBuffer(1, bus.ctx.sampleRate * len, bus.ctx.sampleRate);
            const ch = buf.getChannelData(0);
            for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
            const src = bus.ctx.createBufferSource();
            src.buffer = buf;
            const f = bus.ctx.createBiquadFilter();
            f.type = "highpass";
            f.frequency.value = row === 1 ? 1800 : 6500;
            g.gain.setValueAtTime(row === 1 ? 0.2 : 0.12, at);
            src.connect(f); f.connect(g);
            src.start(at);
          }
          return;
        }
        const o = bus.ctx.createOscillator();
        const g = bus.ctx.createGain();
        o.type = t.wave;
        o.frequency.value = noteFreq(row) * Math.pow(2, t.oct || 0);
        g.gain.setValueAtTime(0.0001, at);
        g.gain.linearRampToValueAtTime(t.gain, at + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, at + (dur || 0.22));
        o.connect(g); g.connect(bus.master);
        o.start(at); o.stop(at + (dur || 0.22) + 0.05);
      }

      function start() {
        if (playing) return;
        playing = true;
        playStep = -1;
        playB.textContent = "■ Stop";
        const tick = () => {
          if (win.closed || !playing) return;
          playStep = (playStep + 1) % STEPS;
          const spb = 60 / song.tempo / 2;     /* eighth notes */
          TRACKS.forEach((t, ti) => {
            const grid = song.grids[ti];
            for (let r = 0; r < grid.length; r++) {
              if (grid[r][playStep]) playNote(t, r, null, spb * 1.8);
            }
          });
          paintPlayhead();
          timer = setTimeout(tick, spb * 1000);
        };
        tick();
      }
      function stop() {
        playing = false;
        playStep = -1;
        clearTimeout(timer);
        playB.textContent = "▶ Play";
        paintPlayhead();
      }

      /* ---------- UI ---------- */
      const top = el("div", { style: "flex:none;display:flex;align-items:center;gap:6px;padding:5px 8px" });
      const playB = el("button", { class: "btn default", text: "▶ Play", style: "min-width:64px" });
      playB.addEventListener("click", () => playing ? stop() : start());
      const tempoLbl = el("span", { text: "Tempo:" });
      const tempoVal = el("span", { style: "font-weight:700;min-width:56px", text: song.tempo + " BPM" });
      const tMinus = el("button", { class: "btn", text: "−", style: "min-width:24px" });
      const tPlus = el("button", { class: "btn", text: "+", style: "min-width:24px" });
      tMinus.addEventListener("click", () => { song.tempo = Math.max(60, song.tempo - 10); tempoVal.textContent = song.tempo + " BPM"; dirty = true; });
      tPlus.addEventListener("click", () => { song.tempo = Math.min(240, song.tempo + 10); tempoVal.textContent = song.tempo + " BPM"; dirty = true; });
      const clearB = el("button", { class: "btn", text: "Clear Track", style: "margin-left:auto" });
      clearB.addEventListener("click", () => { song.grids[track].forEach(r => r.fill(0)); dirty = true; paintGrid(); });
      top.append(playB, tempoLbl, tMinus, tempoVal, tPlus, clearB);

      const tabs = el("div", { style: "flex:none;display:flex;gap:2px;padding:0 8px" });
      const tabEls = TRACKS.map((t, i) => {
        const b = el("button", { class: "btn", text: t.name, style: "min-width:70px;border-bottom:3px solid " + t.color });
        b.addEventListener("click", () => { track = i; paintAll(); });
        tabs.append(b);
        return b;
      });

      const gridWrap = el("div", { class: "sunken", style: "flex:1;margin:6px 8px 8px;background:#181820;overflow:auto;position:relative" });
      const gcv = el("canvas", { width: 30 + STEPS * 30, height: 0, style: "display:block" });
      gridWrap.append(gcv);
      const gx = gcv.getContext("2d");
      const CELL = 30, LBL = 30;

      win.body.append(top, tabs, gridWrap);

      function rowsNow() { return song.grids[track].length; }
      function labelFor(r) { return TRACKS[track].drums ? DRUM_NAMES[r] : NOTE_NAMES[r]; }

      function paintGrid() {
        const R = rowsNow(), rh = TRACKS[track].drums ? 42 : 21;
        gcv.height = R * rh + 18;
        gx.fillStyle = "#181820"; gx.fillRect(0, 0, gcv.width, gcv.height);
        /* step numbers */
        gx.fillStyle = "#707080"; gx.font = "9px Tahoma, sans-serif"; gx.textAlign = "center";
        for (let s = 0; s < STEPS; s++) gx.fillText(String(s + 1), LBL + s * CELL + CELL / 2, 12);
        gx.textAlign = "left";
        for (let r = 0; r < R; r++) {
          const y = 18 + r * rh;
          gx.fillStyle = "#9098a8"; gx.font = "9px Tahoma, sans-serif";
          gx.fillText(labelFor(r), 2, y + rh / 2 + 3);
          for (let s = 0; s < STEPS; s++) {
            const xx = LBL + s * CELL;
            const on = song.grids[track][r][s];
            gx.fillStyle = on ? TRACKS[track].color : (s % 4 === 0 ? "#242432" : "#1e1e2a");
            gx.fillRect(xx + 1, y + 1, CELL - 2, rh - 2);
            if (on) {
              gx.fillStyle = "rgba(255,255,255,0.35)";
              gx.fillRect(xx + 3, y + 3, CELL - 6, 3);
            }
          }
        }
        paintPlayhead(true);
      }
      function paintPlayhead(skipClear) {
        /* redraw a thin playhead column marker row */
        gx.fillStyle = "#181820";
        gx.fillRect(LBL, gcv.height - 5, STEPS * CELL, 5);
        if (playStep >= 0) {
          gx.fillStyle = "#f0e060";
          gx.fillRect(LBL + playStep * CELL + 2, gcv.height - 5, CELL - 4, 4);
        }
      }
      function paintAll() {
        tabEls.forEach((b, i) => b.classList.toggle("default", i === track));
        tempoVal.textContent = song.tempo + " BPM";
        win.setTitle(title());
        paintGrid();
      }

      gcv.addEventListener("mousedown", (e) => {
        const r0 = gcv.getBoundingClientRect();
        const sx2 = r0.width ? gcv.width / r0.width : 1;
        const mx = (e.clientX - r0.x) * sx2, my = (e.clientY - r0.y) * sx2;
        const rh = TRACKS[track].drums ? 42 : 21;
        const s = ((mx - LBL) / CELL) | 0;
        const r = ((my - 18) / rh) | 0;
        if (s < 0 || s >= STEPS || r < 0 || r >= rowsNow() || my < 18) return;
        const g = song.grids[track][r];
        g[s] = g[s] ? 0 : 1;
        dirty = true;
        if (g[s]) playNote(TRACKS[track], r);
        paintGrid();
      });

      /* ---------- files ---------- */
      function serialize() { return "TRK1\n" + JSON.stringify(song); }
      async function doSaveAs() {
        const p = await Dialogs.filePick({ mode: "save", title: "Save Song", ext: [".trk"], typeName: "Composer Song (*.trk)", startDir: FS.DOCS, defaultName: curPath ? FS.segs(curPath).pop() : "My Song.trk" });
        if (!p) return;
        curPath = p;
        doSave();
      }
      function doSave() {
        if (!curPath) { doSaveAs(); return; }
        FS.writeFile(curPath, serialize());
        dirty = false;
        Sound.play("ding");
        win.setTitle(title());
        win.setStatus(0, "Saved " + FS.segs(curPath).pop());
      }
      async function doOpen() {
        const p = await Dialogs.filePick({ mode: "open", title: "Open Song", ext: [".trk"], typeName: "Composer Song (*.trk)", startDir: FS.DOCS });
        if (!p) return;
        try {
          const parsed = JSON.parse(String(FS.readFile(p)).replace(/^TRK1(\\n|\n)/, ""));
          if (parsed && parsed.grids) { song = parsed; curPath = p; dirty = false; stop(); paintAll(); }
        } catch (e) {
          WM.msgbox({ title: "Composer 98", icon: "error", text: "That file is not a song. Or it is jazz." });
        }
      }
      win.el.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); doSave(); }
        if (e.key === " ") { e.preventDefault(); playing ? stop() : start(); }
      });
      win.opts.onClose = () => stop();

      /* regression hook */
      win._cmp = {
        toggle: (t, r, s) => { song.grids[t][r][s] = song.grids[t][r][s] ? 0 : 1; paintGrid(); },
        song: () => song,
        isPlaying: () => playing,
        stepNow: () => playStep,
        start, stop
      };

      paintAll();
      return win;
    }
  };
})();

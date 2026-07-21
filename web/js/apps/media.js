/* media.js — Media Player, CD Player, Character Map, Presentation */
"use strict";
W98.Apps = W98.Apps || {};

/* shared tiny synth for the media apps (respects the Sounds control panel) */
function mediaSynth() {
  let ctx = null, master = null;
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = (W98.Sound ? W98.Sound.volume : 0.5) * 0.6;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }
  function note(freq, t0, dur, type, gain) {
    if (!ensure()) return;
    if (W98.Sound && !W98.Sound.enabled) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "triangle";
    o.frequency.value = freq;
    const t = ctx.currentTime + t0;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain || 0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  return { note, ensure, get ctx() { return ctx; } };
}
const NOTE = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, R: 0 };

/* ================= Media Player ================= */
W98.Apps.media = {
  name: "Media Player", icon: "mediaplayer",
  launch() {
    const synth = mediaSynth();
    let playing = false, pos = 0, raf = null, lastT = 0, tuneTimer = null;
    const DURATION = 32; // seconds loop

    const win = WM.create({
      title: "Media Player", icon: "mediaplayer",
      width: 340, height: 300, minWidth: 260, minHeight: 220,
      statusbar: [{ text: "Ready" }],
      menus: [
        { label: "File", items: () => [{ label: "Open...", click: () => WM.msgbox({ title: "Media Player", icon: "info", text: "This player streams a built-in visualizer demo. External media isn't wired up." }) }, "-", { label: "Exit", click: () => win.close() }] },
        { label: "Device", items: () => [{ label: "Properties", click: () => WM.msgbox({ title: "Media Player", icon: "info", text: "Device: Wave Synthesizer (built-in)\nStatus: working beautifully" }) }] },
        { label: "Help", items: () => [{ label: "About Media Player", click: () => Dialogs.about("Media Player", "mediaplayer") }] }
      ],
      onResize: resize,
      onClose: stop
    });

    const video = el("div", { class: "mp-video" });
    const canvas = el("canvas");
    video.append(canvas);
    const ctx = canvas.getContext("2d");

    const seek = el("input", { type: "range", class: "mp-seek", min: "0", max: "1000", value: "0" });
    seek.addEventListener("input", () => { pos = seek.value / 1000 * DURATION; drawFrame(); updateTime(); });
    const timeLbl = el("div", { class: "mp-time", text: "00:00 / 00:32" });

    const controls = el("div", { class: "mp-controls" });
    const mkBtn = (glyph, title, fn) => {
      const b = el("button", { class: "btn", title, style: "min-width:30px;width:30px;height:24px;padding:0;font-size:11px" });
      b.textContent = glyph;
      b.addEventListener("click", fn);
      controls.append(b);
      return b;
    };
    const playBtn = mkBtn("▶", "Play", togglePlay);
    mkBtn("■", "Stop", stop);
    mkBtn("◀◀", "Rewind", () => { pos = Math.max(0, pos - 4); sync(); });
    mkBtn("▶▶", "Forward", () => { pos = Math.min(DURATION, pos + 4); sync(); });

    win.body.append(video, seek, controls);
    win.body.insertBefore(timeLbl, seek);

    function resize() { canvas.width = video.clientWidth; canvas.height = video.clientHeight; drawFrame(); }
    setTimeout(resize, 30);

    // 16-band pseudo spectrum driven by the current tune
    const bands = new Array(24).fill(0);
    function drawFrame() {
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      // starfield-ish backdrop
      ctx.fillStyle = "rgba(20,40,80,0.6)"; ctx.fillRect(0, 0, W, H);
      const bw = W / bands.length;
      for (let i = 0; i < bands.length; i++) {
        const h = bands[i] * H * 0.9;
        const g = ctx.createLinearGradient(0, H, 0, H - h);
        g.addColorStop(0, "#00e0ff"); g.addColorStop(0.6, "#00a0ff"); g.addColorStop(1, "#ff40c0");
        ctx.fillStyle = g;
        ctx.fillRect(i * bw + 1, H - h, bw - 2, h);
      }
      // scan line sheen
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    }
    const melody = ["C4", "E4", "G4", "C5", "B4", "G4", "E4", "G4", "A4", "F4", "D4", "F4", "G4", "E4", "C4", "R"];
    function tick(ts) {
      if (!playing) return;
      if (!lastT) lastT = ts;
      const dt = (ts - lastT) / 1000; lastT = ts;
      pos += dt;
      if (pos >= DURATION) { pos = 0; }
      // decay bands
      for (let i = 0; i < bands.length; i++) bands[i] *= 0.9;
      drawFrame(); updateTime();
      seek.value = pos / DURATION * 1000;
      raf = requestAnimationFrame(tick);
    }
    function playTune() {
      // schedule a bar of the melody, poke the bands, then repeat
      const bpm = 260, beat = 60 / bpm;
      melody.forEach((n, i) => {
        if (NOTE[n]) setTimeout(() => {
          synth.note(NOTE[n], 0, beat * 1.6, "triangle", 0.18);
          synth.note(NOTE[n] / 2, 0, beat * 1.2, "sine", 0.1);
          const b = Math.floor(Math.random() * bands.length);
          bands[b] = 1; bands[(b + 1) % bands.length] = 0.7;
          for (let k = 0; k < 5; k++) bands[Math.floor(Math.random() * bands.length)] = Math.random();
        }, i * beat * 1000);
      });
      tuneTimer = setTimeout(() => { if (playing) playTune(); }, melody.length * beat * 1000);
    }
    function togglePlay() { playing ? pause() : play(); }
    function play() {
      synth.ensure();
      playing = true; playBtn.textContent = "❚❚"; playBtn.title = "Pause";
      win.setStatus(0, "Playing"); lastT = 0;
      raf = requestAnimationFrame(tick);
      playTune();
    }
    function pause() {
      playing = false; playBtn.textContent = "▶"; playBtn.title = "Play";
      win.setStatus(0, "Paused");
      cancelAnimationFrame(raf); clearTimeout(tuneTimer);
    }
    function stop() {
      playing = false; playBtn.textContent = "▶"; playBtn.title = "Play";
      win.setStatus(0, "Stopped");
      cancelAnimationFrame(raf); clearTimeout(tuneTimer);
      pos = 0; seek.value = 0; bands.fill(0); drawFrame(); updateTime();
    }
    function sync() { seek.value = pos / DURATION * 1000; drawFrame(); updateTime(); }
    function updateTime() {
      const f = s => pad2(Math.floor(s / 60)) + ":" + pad2(Math.floor(s % 60));
      timeLbl.textContent = f(pos) + " / " + f(DURATION);
    }
    drawFrame(); updateTime();
    return win;
  }
};

/* ================= CD Player ================= */
W98.Apps.cdplayer = {
  name: "CD Player", icon: "cdplayer", single: true,
  launch() {
    const TRACKS = Music.TRACKS;
    let track = 0;

    const win = WM.create({
      title: "CD Player", icon: "cdplayer",
      width: 340, height: 210, resizable: false, maximizable: false,
      menus: [
        { label: "Disc", items: () => [{ label: "Eject", click: () => WM.msgbox({ title: "CD Player", icon: "info", text: "The virtual disc politely declined to eject." }) }, "-", { label: "Exit", click: () => win.close() }] },
        { label: "View", items: () => [{ label: "Track List", click: showTracks }] },
        { label: "Help", items: () => [{ label: "About CD Player", click: () => Dialogs.about("CD Player", "cdplayer", ["Now spinning a disc of synthesized classics."]) }] }
      ],
      onClose: stop
    });

    const lcd = el("div", { class: "cd-lcd" });
    const trackNo = el("div", { style: "font-size:20px;font-weight:bold", text: "01" });
    const trackTime = el("div", { style: "font-size:20px;font-weight:bold", text: "00:00" });
    const trackName = el("div", { style: "font-size:12px;grid-column:1/3;text-align:center", text: TRACKS[0].title });
    const artistLn = el("div", { style: "font-size:10px;grid-column:1/3;text-align:center", text: TRACKS[0].artist });
    lcd.style.display = "grid"; lcd.style.gridTemplateColumns = "1fr 1fr"; lcd.style.alignItems = "center";
    lcd.append(trackNo, trackTime, trackName, artistLn);

    const controls = el("div", { style: "display:flex;gap:3px;justify-content:center;padding:4px" });
    const mkBtn = (glyph, title, fn) => { const b = el("button", { class: "btn", title, style: "min-width:34px;width:34px;height:26px;padding:0;font-size:12px" }); b.textContent = glyph; b.addEventListener("click", fn); controls.append(b); return b; };
    const playBtn = mkBtn("▶", "Play", togglePlay);
    mkBtn("❚❚", "Pause", pause);
    mkBtn("■", "Stop", stop);
    mkBtn("◀◀", "Previous", () => setTrack(track - 1));
    mkBtn("▶▶", "Next", () => setTrack(track + 1));

    win.body.append(lcd, controls, el("div", { style: "text-align:center;font-size:11px;padding:2px", text: "Disc: Nostalgia Classics Vol. 1  —  " + TRACKS.length + " tracks, public domain & original" }));

    function syncFromEngine() {
      if (win.closed) return;
      const s = Music.state();
      if (s.playing || s.paused) {
        track = s.index;
        trackTime.textContent = Music.fmt(s.seconds);
      }
      trackNo.textContent = pad2(track + 1);
      trackName.textContent = TRACKS[track].title;
      artistLn.textContent = TRACKS[track].artist;
      win.setTitle(s.playing ? "CD Player - [" + TRACKS[track].title + "]" : "CD Player");
    }
    Music.onChange(syncFromEngine);
    Music.onEnded((was) => { if (!win.closed) { Music.play(was + 1); } });

    function setTrack(i) {
      track = (i + TRACKS.length) % TRACKS.length;
      const s = Music.state();
      if (s.playing || s.paused) Music.play(track);
      syncFromEngine();
    }
    function togglePlay() {
      const s = Music.state();
      if (s.playing) pause();
      else if (s.paused) Music.resume();
      else Music.play(track);
    }
    function play() { Music.play(track); }
    function pause() { Music.pause(); }
    function stop() { Music.stop(); trackTime.textContent = "00:00"; win.setTitle("CD Player"); }
    function showTracks() {
      const dw = WM.create({ title: "Track List", icon: "cdplayer", width: 240, height: 240, resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true });
      const list = el("div", { class: "listview sunken", style: "flex:1;margin:6px" });
      TRACKS.forEach((t, i) => {
        const row = el("div", { class: "lv-item" },
          el("span", { class: "nm", text: pad2(i + 1) + "  " + t.title + "  (" + Music.fmt(t.duration) + ")" }));
        if (i === track) row.classList.add("sel");
        row.addEventListener("dblclick", () => { track = i; Music.play(i); dw.close(); });
        list.append(row);
      });
      dw.body.append(list);
      dw.body.style.display = "flex";
    }
    return win;
  }
};

/* ================= Character Map ================= */
W98.Apps.charmap = {
  name: "Character Map", icon: "charmap", single: true,
  launch() {
    let font = "Arial", picked = "";
    const win = WM.create({
      title: "Character Map", icon: "charmap",
      width: 460, height: 360, resizable: false, maximizable: false,
      statusbar: [{ text: "" }]
    });
    win.body.style.padding = "6px";

    const top = el("div", { style: "display:flex;align-items:center;gap:6px;padding:2px" });
    const fontSel = el("select", { class: "field", style: "width:180px" });
    ["Arial", "Times New Roman", "Courier New", "Comic Sans MS", "Georgia", "Verdana", "Tahoma", "Symbol", "Wingdings", "Impact"].forEach(f => { const o = el("option", { text: f, value: f }); o.style.fontFamily = f; fontSel.append(o); });
    fontSel.addEventListener("change", () => { font = fontSel.value; buildGrid(); });
    top.append(el("span", { text: "Font:" }), fontSel);

    const grid = el("div", { class: "sunken", style: "background:#fff;display:grid;grid-template-columns:repeat(20,1fr);flex:1;margin:6px 0;overflow:auto" });
    function buildGrid() {
      grid.innerHTML = "";
      const codes = [];
      for (let c = 0x21; c <= 0x7e; c++) codes.push(c);
      for (let c = 0xa1; c <= 0xff; c++) codes.push(c);
      [0x20ac, 0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2026, 0x2122, 0x2190, 0x2191, 0x2192, 0x2193, 0x2660, 0x2663, 0x2665, 0x2666, 0x263a, 0x2605].forEach(c => codes.push(c));
      codes.forEach(code => {
        const ch = String.fromCodePoint(code);
        const cell = el("div", { style: "aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:15px;border:1px solid #e0e0e0;cursor:pointer;font-family:" + font });
        cell.textContent = ch;
        cell.title = "U+" + code.toString(16).toUpperCase().padStart(4, "0");
        cell.addEventListener("mouseenter", () => { win.setStatus(0, "Character: " + ch + "   (U+" + code.toString(16).toUpperCase().padStart(4, "0") + ")"); });
        cell.addEventListener("mousedown", () => {
          cell.animate([{ background: "#000080" }, { background: "#fff" }], { duration: 250 });
          picked += ch; pickedField.value = picked;
        });
        grid.append(cell);
      });
    }

    const bottom = el("div", { style: "display:flex;align-items:center;gap:6px;padding:2px" });
    const pickedField = el("input", { class: "field", style: "flex:1", placeholder: "Characters to copy" });
    const copyBtn = el("button", { class: "btn", text: "Copy" });
    const clearBtn = el("button", { class: "btn", text: "Clear" });
    copyBtn.addEventListener("click", () => { try { navigator.clipboard.writeText(pickedField.value); win.setStatus(0, "Copied to clipboard"); } catch (e) {} });
    clearBtn.addEventListener("click", () => { picked = ""; pickedField.value = ""; });
    bottom.append(el("span", { text: "Characters to copy:" }), pickedField, copyBtn, clearBtn);

    win.body.append(top, grid, bottom);
    win.body.style.display = "flex";
    win.body.style.flexDirection = "column";
    buildGrid();
    return win;
  }
};

/* ================= Presentation (slides) ================= */
W98.Apps.slides = {
  name: "Presentation", icon: "slides",
  launch(path) {
    let curPath = null, dirty = false, cur = 0;
    let deck = [
      { title: "Welcome to Presentation", body: "A tiny slide editor for Windows 98\n\n• Click a slide to edit it\n• Add and delete slides\n• Press Slide Show to present" },
      { title: "It Really Works", body: "Type in the title and body boxes.\nYour changes are saved to the file system.\n\nTry the Slide Show button for full-screen." }
    ];

    function baseName() { return curPath ? FS.segs(curPath).pop() : "Presentation"; }
    function syncTitle() { win.setTitle(baseName() + " - Presentation"); }

    const win = WM.create({
      title: "Presentation - Presentation", icon: "slides",
      width: 640, height: 470, minWidth: 460, minHeight: 320,
      statusbar: [{ text: "Slide 1" }],
      menus: [
        { label: "File", items: () => [
          { label: "New", click: doNew },
          { label: "Open...", click: doOpen },
          { label: "Save", accel: "Ctrl+S", click: doSave },
          { label: "Save As...", click: doSaveAs },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Slide", items: () => [
          { label: "New Slide", click: addSlide },
          { label: "Delete Slide", click: delSlide },
          "-",
          { label: "Slide Show", accel: "F5", click: slideShow }
        ]},
        { label: "Help", items: () => [{ label: "About Presentation", click: () => Dialogs.about("Presentation", "slides") }] }
      ],
      onBeforeClose: () => confirmSave()
    });

    const tbar = el("div", { class: "toolbar" });
    const mkTool = (label, icon, fn) => { const b = el("button", { class: "tool-btn", dataset: { tip: label } }); b.append(Icons.img(icon, 20), el("span", { text: label, style: "font-size:10px" })); b.addEventListener("click", fn); tbar.append(b); return b; };
    mkTool("New Slide", "slidesdoc", addSlide);
    mkTool("Delete", "tb_del", delSlide);
    tbar.append(el("div", { class: "tsep" }));
    mkTool("Slide Show", "mediaplayer", slideShow);
    mkTool("Save", "floppy", doSave);

    const body = el("div", { style: "flex:1;display:flex;min-height:0" });
    const strip = el("div", { class: "sunken", style: "width:120px;flex:none;background:#808080;overflow:auto;padding:4px" });
    const editArea = el("div", { style: "flex:1;display:flex;flex-direction:column;padding:10px;gap:8px;min-height:0;overflow:auto;background:#808080" });
    body.append(strip, editArea);
    win.body.append(tbar, body);

    const slideCanvas = el("div", { style: "flex:1;background:#fff;box-shadow:2px 2px 5px rgba(0,0,0,.5);display:flex;flex-direction:column;padding:6% 7%;min-height:220px;aspect-ratio:4/3;max-width:520px;margin:0 auto;width:100%" });
    const titleIn = el("input", { class: "field", style: "font-size:24px;font-weight:bold;text-align:center;font-family:Arial;border:1px dashed transparent;background:transparent;box-shadow:none;color:#1a3a7a", placeholder: "Slide title" });
    const bodyIn = el("textarea", { class: "field", style: "flex:1;resize:none;font-size:15px;font-family:Arial;border:1px dashed transparent;background:transparent;box-shadow:none;margin-top:10px", placeholder: "Slide content..." });
    titleIn.addEventListener("input", () => { deck[cur].title = titleIn.value; dirty = true; renderStrip(); });
    bodyIn.addEventListener("input", () => { deck[cur].body = bodyIn.value; dirty = true; renderStrip(); });
    titleIn.addEventListener("keydown", e => e.stopPropagation());
    bodyIn.addEventListener("keydown", e => e.stopPropagation());
    slideCanvas.append(titleIn, bodyIn);
    editArea.append(slideCanvas);

    function renderStrip() {
      strip.innerHTML = "";
      deck.forEach((s, i) => {
        const th = el("div", { style: "background:#fff;margin-bottom:6px;padding:5px;cursor:pointer;box-shadow:1px 1px 2px rgba(0,0,0,.4);height:66px;overflow:hidden;position:relative;border:2px solid " + (i === cur ? "#000080" : "transparent") });
        th.append(el("div", { text: (i + 1) + ".", style: "position:absolute;left:-2px;top:-2px;font-size:9px;color:#808080" }));
        th.append(el("div", { text: s.title || "(untitled)", style: "font-size:8px;font-weight:bold;color:#1a3a7a;text-align:center;margin-top:4px" }));
        th.append(el("div", { text: s.body.slice(0, 60), style: "font-size:6px;color:#444;margin-top:3px;white-space:pre-wrap;line-height:1.2" }));
        th.addEventListener("click", () => select(i));
        strip.append(th);
      });
    }
    function select(i) {
      cur = clamp(i, 0, deck.length - 1);
      titleIn.value = deck[cur].title;
      bodyIn.value = deck[cur].body;
      win.setStatus(0, "Slide " + (cur + 1) + " of " + deck.length);
      renderStrip();
    }
    function addSlide() { deck.splice(cur + 1, 0, { title: "New Slide", body: "" }); dirty = true; select(cur + 1); }
    function delSlide() {
      if (deck.length <= 1) { WM.msgbox({ title: "Presentation", icon: "warning", text: "A presentation must have at least one slide." }); return; }
      deck.splice(cur, 1); dirty = true; select(Math.min(cur, deck.length - 1));
    }
    function slideShow() {
      let idx = cur;
      const ov = el("div", { style: "position:fixed;inset:0;z-index:99997;background:#000;display:flex;align-items:center;justify-content:center;cursor:pointer" });
      const scr = el("div", { style: "width:90vw;max-width:1000px;aspect-ratio:4/3;background:linear-gradient(135deg,#fff,#e8eefc);display:flex;flex-direction:column;padding:6% 7%;box-shadow:0 0 40px rgba(0,80,200,.4)" });
      ov.append(scr);
      document.body.append(ov);
      function paint() {
        scr.innerHTML = "";
        scr.append(el("div", { text: deck[idx].title, style: "font-size:min(6vw,52px);font-weight:bold;text-align:center;font-family:Arial;color:#123a8a;border-bottom:3px solid #c0d0f0;padding-bottom:2%" }));
        const b = el("div", { style: "flex:1;font-size:min(3.2vw,28px);font-family:Arial;color:#222;white-space:pre-wrap;padding-top:4%;line-height:1.5" });
        b.textContent = deck[idx].body;
        scr.append(b);
        scr.append(el("div", { text: (idx + 1) + " / " + deck.length, style: "text-align:right;font-size:14px;color:#888" }));
      }
      paint();
      const nav = (e) => {
        if (e.type === "click" || e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { if (idx < deck.length - 1) { idx++; paint(); } else close(); }
        else if (e.key === "ArrowLeft") { if (idx > 0) { idx--; paint(); } }
        else if (e.key === "Escape") close();
      };
      function close() { ov.remove(); document.removeEventListener("keydown", nav, true); select(idx); }
      ov.addEventListener("click", nav);
      document.addEventListener("keydown", nav, true);
    }

    /* file ops */
    function serialize() { return "PPT1\n" + JSON.stringify(deck); }
    function loadData(data) {
      data = String(data || "");
      if (data.startsWith("PPT1\n")) { try { deck = JSON.parse(data.slice(5)); } catch (e) {} }
      if (!deck.length) deck = [{ title: "Slide 1", body: "" }];
    }
    async function confirmSave() {
      if (!dirty) return true;
      const r = await WM.msgbox({ title: "Presentation", icon: "warning", text: "Save changes to " + baseName() + "?", buttons: ["Yes", "No", "Cancel"], cancelValue: "Cancel" });
      if (r === "Cancel") return false;
      if (r === "Yes") return await doSave();
      return true;
    }
    async function doSave() { if (!curPath) return doSaveAs(); FS.writeFile(curPath, serialize()); W98.addRecent(curPath); dirty = false; return true; }
    async function doSaveAs() {
      const p = await Dialogs.filePick({ mode: "save", title: "Save As", ext: [".ppt"], typeName: "Presentation (*.ppt)", startDir: FS.DOCS, defaultName: baseName() === "Presentation" ? "Presentation.ppt" : baseName() });
      if (!p) return false; curPath = p; FS.writeFile(p, serialize()); W98.addRecent(p); dirty = false; syncTitle(); return true;
    }
    async function doNew() { if (!(await confirmSave())) return; deck = [{ title: "Slide 1", body: "" }]; curPath = null; dirty = false; select(0); syncTitle(); }
    async function doOpen() {
      if (!(await confirmSave())) return;
      const p = await Dialogs.filePick({ mode: "open", title: "Open", ext: [".ppt"], typeName: "Presentation (*.ppt)", startDir: FS.DOCS });
      if (p) { loadData(FS.readFile(p)); curPath = p; dirty = false; select(0); syncTitle(); W98.addRecent(p); }
    }

    win.el.addEventListener("keydown", (e) => {
      if (e.key === "F5") { e.preventDefault(); slideShow(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); doSave().then(syncTitle); }
    });

    if (path) { loadData(FS.readFile(path)); curPath = path; syncTitle(); W98.addRecent(path); }
    renderStrip(); select(0);
    return win;
  }
};

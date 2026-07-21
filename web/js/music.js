/* music.js — multi-channel chiptune sequencer.
   Repertoire: public-domain classical/traditional melodies plus original tunes. */
"use strict";
const Music = W98.Music = (() => {
  /* note table */
  const NOTE = {};
  (() => {
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    for (let oct = 1; oct <= 7; oct++) {
      names.forEach((n, i) => {
        const midi = (oct + 1) * 12 + i;
        NOTE[n + oct] = 440 * Math.pow(2, (midi - 69) / 12);
      });
    }
  })();

  const rep = (s, n) => Array(n).fill(s).join(" ");

  const TRACKS = [
    {
      title: "Ode to Joy", artist: "L. van Beethoven (1824)", bpm: 112,
      lead: "E4:2 E4:2 F4:2 G4:2 G4:2 F4:2 E4:2 D4:2 C4:2 C4:2 D4:2 E4:2 E4:3 D4:1 D4:4 " +
            "E4:2 E4:2 F4:2 G4:2 G4:2 F4:2 E4:2 D4:2 C4:2 C4:2 D4:2 E4:2 D4:3 C4:1 C4:4",
      bass: "C3:8 F2:8 C3:8 G2:4 C3:4 C3:8 F2:8 G2:8 C3:8",
      drum: ""
    },
    {
      title: "Greensleeves", artist: "Traditional (16th c.)", bpm: 100,
      lead: "A4:2 C5:4 D5:2 E5:3 F5:1 E5:2 D5:4 B4:2 G4:3 A4:1 B4:2 C5:4 A4:2 A4:3 G#4:1 A4:2 B4:4 G#4:2 E4:4",
      bass: "A2:6 F2:6 C3:6 G2:6 A2:6 F2:6 E2:6 A2:6",
      drum: ""
    },
    {
      title: "Canon Walk", artist: "after J. Pachelbel", bpm: 96,
      lead: "F#5:4 E5:4 D5:4 C#5:4 B4:4 A4:4 B4:4 C#5:4 " +
            "D5:2 F#5:2 A5:4 G5:2 F#5:2 E5:4 D5:2 F#5:2 F#4:4 A4:2 B4:2 C#5:4",
      bass: rep("D3:4 A2:4 B2:4 F#2:4 G2:4 D2:4 G2:4 A2:4", 2),
      drum: rep("H:2", 32)
    },
    {
      title: "Turbo Pixels", artist: "Original chiptune", bpm: 140,
      lead: "C5:2 C5:2 G4:2 C5:2 D#5:2 D5:2 C5:2 G4:2 A#4:2 A#4:2 F4:2 A#4:2 C5:2 D5:2 D#5:2 F5:2 " +
            "G5:2 F5:2 D#5:2 D5:2 C5:4 G4:2 A#4:2 C5:6 -:2 G4:2 C5:4",
      bass: rep("C3:2 C3:2 G2:2 C3:2 A#2:2 A#2:2 F2:2 A#2:2", 4),
      drum: rep("K:2 H:2 S:2 H:2", 8)
    },
    {
      title: "Midnight BBS", artist: "Original chiptune", bpm: 84,
      lead: "E4:4 G4:4 B4:4 A4:2 G4:2 E4:8 D4:4 E4:4 G4:2 A4:2 B4:8 -:2 A4:2",
      harm: "B3:8 A3:8 E3:8 F#3:8 G3:8 B3:8",
      bass: "E2:8 C2:8 G2:8 D2:8 E2:8 E2:8",
      drum: rep("K:4 -:4 S:4 -:4", 3)
    },
    {
      title: "Defrag Boogie", artist: "Original chiptune", bpm: 126,
      lead: "C4:2 E4:2 G4:2 A4:2 A#4:2 A4:2 G4:2 E4:2 F4:2 A4:2 C5:2 D5:2 D#5:2 D5:2 C5:2 A4:2 " +
            "G4:2 B4:2 D5:2 F5:2 E5:2 D5:2 B4:2 G4:2 C5:2 G4:2 E4:2 C4:2 -:8",
      bass: rep("C3:2 E3:2 G3:2 A3:2 A#3:2 A3:2 G3:2 E3:2 F3:2 A3:2 C4:2 A3:2 G3:2 B3:2 D4:2 B3:2", 2),
      drum: rep("K:2 H:2 S:2 H:2", 8)
    }
  ];

  function parse(str) {
    if (!str) return [];
    const out = [];
    let t = 0;
    str.trim().split(/\s+/).forEach(tok => {
      const [n, len] = tok.split(":");
      const d = parseInt(len || "2", 10);
      if (n !== "-") out.push({ t, d, n });
      t += d;
    });
    out.totalLen = t;
    return out;
  }

  /* per-track cache of parsed channels */
  TRACKS.forEach(tr => {
    tr._ch = {
      lead: parse(tr.lead), harm: parse(tr.harm || ""),
      bass: parse(tr.bass), drum: parse(tr.drum || "")
    };
    tr._len = Math.max(tr._ch.lead.totalLen || 0, tr._ch.bass.totalLen || 0,
                       tr._ch.harm.totalLen || 0, tr._ch.drum.totalLen || 0);
    const sps = 60 / tr.bpm / 4;             // seconds per 16th
    tr.passSeconds = tr._len * sps;
    tr.duration = Math.round(tr.passSeconds * 2);   // each track plays two passes
  });

  let bus = null, playing = false, paused = false, index = -1;
  let startAt = 0, pauseOffset = 0, schedTimer = null, tickTimer = null;
  let schedPtr = { lead: 0, harm: 0, bass: 0, drum: 0, pass: 0 };
  const listeners = [];

  function emit() { listeners.forEach(fn => { try { fn(state()); } catch (e) {} }); }
  function state() {
    return {
      playing, paused, index,
      seconds: playing ? Math.max(0, Math.min(TRACKS[index].duration, (bus.ctx.currentTime - startAt))) : 0,
      duration: index >= 0 ? TRACKS[index].duration : 0,
      track: index >= 0 ? TRACKS[index] : null
    };
  }

  /* ---------- voices ---------- */
  function vLead(freq, at, dur) {
    const { ctx, master } = bus;
    const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(0.055, at + 0.006);
    g.gain.setValueAtTime(0.05, at + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur * 0.95);
    o.connect(g); g.connect(master);
    o.start(at); o.stop(at + dur);
  }
  function vHarm(freq, at, dur) {
    const { ctx, master } = bus;
    const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(0.04, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur * 0.95);
    o.connect(g); g.connect(master);
    o.start(at); o.stop(at + dur);
  }
  function vBass(freq, at, dur) {
    const { ctx, master } = bus;
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = freq;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 420;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(0.10, at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur * 0.9);
    o.connect(f); f.connect(g); g.connect(master);
    o.start(at); o.stop(at + dur);
  }
  function vDrum(kind, at) {
    const { ctx, master } = bus;
    if (kind === "K") {
      const o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(130, at);
      o.frequency.exponentialRampToValueAtTime(45, at + 0.11);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.16, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.13);
      o.connect(g); g.connect(master);
      o.start(at); o.stop(at + 0.15);
      return;
    }
    const len = kind === "S" ? 0.09 : 0.03;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter();
    if (kind === "S") { f.type = "bandpass"; f.frequency.value = 1900; f.Q.value = 0.8; }
    else { f.type = "highpass"; f.frequency.value = 6200; }
    const g = ctx.createGain(); g.gain.value = kind === "S" ? 0.12 : 0.05;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(at);
  }

  /* ---------- lookahead scheduler ---------- */
  function schedule() {
    const tr = TRACKS[index];
    const sps = 60 / tr.bpm / 4;
    const horizon = bus.ctx.currentTime + 0.4;
    for (const chName of ["lead", "harm", "bass", "drum"]) {
      const events = tr._ch[chName];
      if (!events.length) continue;
      while (true) {
        const passBase = startAt + schedPtr.pass * tr.passSeconds;
        if (schedPtr[chName] >= events.length) break;
        const ev = events[schedPtr[chName]];
        const at = passBase + ev.t * sps;
        if (at > horizon) break;
        const dur = ev.d * sps;
        if (chName === "drum") vDrum(ev.n, at);
        else if (chName === "lead") vLead(NOTE[ev.n], at, dur);
        else if (chName === "harm") vHarm(NOTE[ev.n], at, dur);
        else vBass(NOTE[ev.n], at, dur);
        schedPtr[chName]++;
      }
    }
    /* advance to next pass when every channel is exhausted and time has passed */
    const passEnd = startAt + (schedPtr.pass + 1) * tr.passSeconds;
    const allDone = ["lead", "harm", "bass", "drum"].every(n => !tr._ch[n].length || schedPtr[n] >= tr._ch[n].length);
    if (allDone && bus.ctx.currentTime + 0.4 >= passEnd) {
      schedPtr.pass++;
      if (schedPtr.pass >= 2) { onEnded(); return; }
      schedPtr.lead = schedPtr.harm = schedPtr.bass = schedPtr.drum = 0;
    }
  }
  let endedCb = null;
  function onEnded() {
    const wasIndex = index;
    stopInternal();
    emit();
    if (endedCb) endedCb(wasIndex);
  }

  function play(i) {
    if (!bus) bus = Sound.audio();
    if (!bus) return false;
    stopInternal();
    index = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
    playing = true; paused = false;
    startAt = bus.ctx.currentTime + 0.08;
    pauseOffset = 0;
    schedPtr = { lead: 0, harm: 0, bass: 0, drum: 0, pass: 0 };
    schedTimer = setInterval(schedule, 100);
    tickTimer = setInterval(emit, 500);
    schedule();
    emit();
    return true;
  }
  function stopInternal() {
    clearInterval(schedTimer); clearInterval(tickTimer);
    playing = false; paused = false;
  }
  function stop() { stopInternal(); emit(); }
  function pause() {
    if (!playing || paused) return;
    pauseOffset = bus.ctx.currentTime - startAt;
    clearInterval(schedTimer);
    paused = true; playing = false;
    emit();
  }
  function resume() {
    if (!paused) return;
    playing = true; paused = false;
    startAt = bus.ctx.currentTime - pauseOffset;
    /* rebuild pointers: skip events earlier than current position */
    const tr = TRACKS[index];
    const sps = 60 / tr.bpm / 4;
    const posIn16 = (pauseOffset % tr.passSeconds) / sps;
    schedPtr.pass = Math.floor(pauseOffset / tr.passSeconds);
    for (const n of ["lead", "harm", "bass", "drum"]) {
      const evs = tr._ch[n];
      schedPtr[n] = evs.findIndex(e => e.t >= posIn16);
      if (schedPtr[n] < 0) schedPtr[n] = evs.length;
    }
    schedTimer = setInterval(schedule, 100);
    emit();
  }

  return {
    TRACKS, play, stop, pause, resume, state,
    onChange(fn) { listeners.push(fn); },
    onEnded(fn) { endedCb = fn; },
    fmt(s) { return pad2(Math.floor(s / 60)) + ":" + pad2(Math.floor(s) % 60); }
  };
})();

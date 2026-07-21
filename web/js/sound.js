/* sound.js — system sounds.
   Two layers:
   1) A much richer synthesizer (original compositions evoking the Win98 sound set:
      airy pad swells, FM glass bells, chord stabs, hall ambience).
   2) Custom sample support: drop real .wav files (that you own) into the Sounds
      folder and they are used instead — see the Sounds control panel. */
"use strict";
const Sound = W98.Sound = (() => {
  let ctx = null, master = null, verb = null;
  let enabled = Store.get("soundsEnabled", true);
  let volume = Store.get("volume", 0.6);

  /* ---------- custom sample layer ---------- */
  // Aliases: for each event, accept the classic file names users will have.
  const ALIASES = {
    // note: "start"/START.WAV is the tiny navigation click, NOT the startup theme
    startup:  ["startup", "windows 98 startup", "the microsoft sound", "logon", "windows logon sound", "windows logon"],
    shutdown: ["shutdown", "windows 98 shutdown", "logoff", "windows logoff sound", "windows logoff"],
    error:    ["chord", "critical stop", "error"],
    ding:     ["ding", "default", "default beep"],
    warn:     ["exclamation", "exclam"],
    question: ["question"],
    info:     ["asterisk", "notify"],
    tada:     ["tada"],
    chimes:   ["chimes"],
    recycle:  ["empty recycle bin", "recycle"],
    maximize: ["maximize"],
    minimize: ["minimize"],
    menu:     ["menu popup", "menucommand", "menu"],
    click:    ["start", "start navigation", "click"]
  };
  const customUrl = {};   // event -> data/blob URL
  const customBuf = {};   // event -> AudioBuffer

  function resolveFiles(files) {
    // files: { lowercased-basename: dataURL }
    if (!files) return;
    for (const ev in ALIASES) {
      for (const alias of ALIASES[ev]) {
        if (files[alias]) { customUrl[ev] = files[alias]; break; }
      }
    }
  }
  async function preloadCustom() {
    if (!Object.keys(customUrl).length) return;
    ensure(true);
    for (const ev in customUrl) {
      if (customBuf[ev]) continue;
      try {
        const res = await fetch(customUrl[ev]);
        const ab = await res.arrayBuffer();
        customBuf[ev] = await ctx.decodeAudioData(ab);
      } catch (e) { delete customUrl[ev]; }
    }
  }
  function loadCustomFiles(files) { resolveFiles(files); preloadCustom(); }

  // Native app injects window.__WIN98_SOUNDS_FILES__ (scanned from the Sounds folder).
  if (window.__WIN98_SOUNDS_FILES__) resolveFiles(window.__WIN98_SOUNDS_FILES__);

  // Dev/browser: probe web/sounds/<alias>.wav so files dropped there work too.
  async function rescanWeb() {
    if (!location.protocol.startsWith("http")) return 0;
    const found = {};
    const tried = new Set();
    for (const ev in ALIASES) {
      for (const alias of ALIASES[ev]) {
        if (tried.has(alias)) continue;
        tried.add(alias);
        for (const cand of [alias + ".wav", alias.toUpperCase() + ".WAV"]) {
          try {
            const r = await fetch("sounds/" + encodeURIComponent(cand));
            if (r.ok && (r.headers.get("content-type") || "").indexOf("html") < 0) {
              const b = await r.blob();
              if (b.size > 100) { found[alias] = URL.createObjectURL(b); break; }
            }
          } catch (e) {}
        }
      }
    }
    if (Object.keys(found).length) loadCustomFiles(found);
    return Object.keys(found).length;
  }
  setTimeout(rescanWeb, 800);

  /* Rescan: native app re-reads the Sounds folder; browser re-probes web/sounds */
  function rescan() {
    if (Store.native({ cmd: "rescanSounds" })) return true;
    rescanWeb();
    return false;
  }

  function playCustom(name) {
    const buf = customBuf[name];
    if (!buf) return false;
    if (!ensure()) return false;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(master);
    src.start();
    return true;
  }

  /* ---------- synth engine ---------- */
  function ensure(silent) {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
      // hall ambience: two cross-panned feedback delays, darkened tails
      verb = ctx.createGain(); verb.gain.value = 1;
      const mkTail = (time, fb, pan) => {
        const d = ctx.createDelay(1); d.delayTime.value = time;
        const g = ctx.createGain(); g.gain.value = fb;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2800;
        const out = ctx.createGain(); out.gain.value = 0.5;
        let dest = out;
        if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; out.connect(p); p.connect(master); dest = out; }
        else out.connect(master);
        verb.connect(d); d.connect(lp); lp.connect(g); g.connect(d); lp.connect(out);
        return d;
      };
      mkTail(0.107, 0.38, -0.45);
      mkTail(0.163, 0.32, 0.45);
    }
    if (!silent && ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }
  window.addEventListener("pointerdown", () => { if (ctx) ensure(); preloadCustom(); }, { capture: true });

  const now = () => ctx.currentTime;

  /* voice: gain envelope -> (dry master + reverb send) */
  function mkOut(t0, dur, peak, attack, send) {
    const g = ctx.createGain();
    const t = now() + t0;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + Math.max(0.004, attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(master);
    if (send) { const s = ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(verb); }
    return g;
  }

  /* warm pad note: detuned triangle+saw through a swept lowpass, slow attack */
  function pad(freq, t0, dur, peak, o) {
    o = o || {};
    const out = mkOut(t0, dur, peak, o.attack != null ? o.attack : dur * 0.25, o.send != null ? o.send : 0.5);
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass"; filt.Q.value = 0.6;
    const t = now() + t0;
    filt.frequency.setValueAtTime(o.f0 || 500, t);
    filt.frequency.linearRampToValueAtTime(o.f1 || 2200, t + dur * 0.45);
    filt.frequency.linearRampToValueAtTime(o.f0 || 600, t + dur);
    filt.connect(out);
    [[-6, "sawtooth", 0.25], [0, "triangle", 1.0], [7, "sawtooth", 0.25], [-12, "sine", 0.6]].forEach(([cents, type, amt]) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = cents + (o.detune || 0);
      const g = ctx.createGain(); g.gain.value = amt;
      osc.connect(g); g.connect(filt);
      osc.start(t); osc.stop(t + dur + 0.1);
    });
  }

  /* glass bell: inharmonic sine partials with exponential decay */
  function bell(freq, t0, dur, peak, o) {
    o = o || {};
    const t = now() + t0;
    const partials = o.partials || [[1, 1], [2.76, 0.38], [5.40, 0.13], [8.93, 0.05]];
    partials.forEach(([ratio, amt], i) => {
      const out = mkOut(t0, dur * (1 - i * 0.14), peak * amt, 0.004, o.send != null ? o.send : 0.7);
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * ratio;
      if (o.bend) { osc.frequency.setValueAtTime(freq * ratio * o.bend, t); osc.frequency.exponentialRampToValueAtTime(freq * ratio, t + 0.06); }
      osc.connect(out);
      osc.start(t); osc.stop(t + dur + 0.1);
    });
  }

  /* short chord stab: filtered saw stack, percussive */
  function stab(freqs, t0, dur, peak, o) {
    o = o || {};
    const t = now() + t0;
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(o.bright || 2400, t);
    filt.frequency.exponentialRampToValueAtTime(500, t + dur);
    const out = mkOut(t0, dur, peak, 0.006, 0.4);
    filt.connect(out);
    freqs.forEach(f => {
      [[-5, "sawtooth"], [4, "sawtooth"]].forEach(([cents, type]) => {
        const osc = ctx.createOscillator();
        osc.type = type; osc.frequency.value = f; osc.detune.value = cents;
        const g = ctx.createGain(); g.gain.value = 0.5;
        osc.connect(g); g.connect(filt);
        osc.start(t); osc.stop(t + dur + 0.1);
      });
    });
  }

  /* filtered noise burst (paper, air) */
  function noiseBurst(t0, dur, cf, q, peak) {
    const t = now() + t0;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = cf; bp.Q.value = q;
    const out = mkOut(t0, dur, peak, 0.003, 0.3);
    src.connect(bp); bp.connect(out);
    src.start(t);
  }

  /* ---------- the sound set (original compositions) ---------- */
  const SYNTH = {
    startup() {
      // lush major-add9 swell with glass sparkle on top — the classic "sunrise" feel
      const C3 = 138.59, G3 = 207.65, C4 = 277.18, F4 = 349.23, G4 = 415.30, D4 = 311.13;
      pad(C3 / 2, 0.00, 4.6, 0.16, { attack: 0.5, f0: 300, f1: 900 });   // sub
      pad(C3,     0.02, 4.4, 0.14, { attack: 0.6 });
      pad(G3,     0.10, 4.2, 0.11, { attack: 0.7 });
      pad(C4,     0.16, 4.1, 0.10, { attack: 0.7 });
      pad(F4,     0.24, 3.9, 0.09, { attack: 0.8 });
      pad(G4,     0.30, 3.8, 0.08, { attack: 0.8 });
      pad(D4,     0.40, 3.6, 0.05, { attack: 0.9 });                     // add9 color
      // sparkle arpeggio
      bell(G4 * 2, 0.45, 2.6, 0.10);
      bell(C4 * 4, 0.80, 2.6, 0.09);
      bell(F4 * 4, 1.20, 2.4, 0.07);
      bell(G4 * 4, 1.65, 2.6, 0.08);
      bell(C4 * 8, 2.10, 2.2, 0.04);
      // breath of air
      noiseBurst(0.1, 2.2, 3800, 0.6, 0.012);
    },
    shutdown() {
      // gentle descending farewell
      const G4 = 392.0, F4 = 349.23, C4 = 261.63, G3 = 196.0;
      pad(G4, 0.00, 2.6, 0.10, { attack: 0.25 });
      pad(F4, 0.35, 2.4, 0.10, { attack: 0.25 });
      pad(C4, 0.75, 2.6, 0.11, { attack: 0.3 });
      pad(G3, 1.15, 2.8, 0.12, { attack: 0.35, f1: 1200 });
      bell(C4 * 4, 1.3, 2.0, 0.05);
    },
    error() {
      // stern low chord stab ("chord" style)
      stab([196.0, 233.08, 311.13], 0, 0.7, 0.22, { bright: 2000 });
      noiseBurst(0, 0.06, 1500, 1.2, 0.05);
    },
    warn() {
      // rounded two-tone "dah-dum"
      bell(587.33, 0.00, 0.5, 0.16, { partials: [[1, 1], [2, 0.25]] });
      bell(392.00, 0.14, 0.9, 0.16, { partials: [[1, 1], [2, 0.25]] });
    },
    question() {
      // soft rising glass note
      bell(523.25, 0, 1.1, 0.15, { bend: 0.92 });
      bell(783.99, 0.12, 1.0, 0.08);
    },
    info() {
      // single quiet glassy note
      bell(1046.5, 0, 0.9, 0.11);
    },
    ding() {
      // bright single bell with shimmer
      bell(987.77, 0, 1.4, 0.17);
      bell(987.77 * 2, 0.01, 0.7, 0.04);
    },
    chimes() {
      // descending glass run
      bell(1567.98, 0.00, 1.0, 0.10);
      bell(1318.51, 0.14, 1.0, 0.10);
      bell(1046.50, 0.28, 1.2, 0.11);
      bell(783.99, 0.44, 1.5, 0.12);
    },
    tada() {
      // "ta-DAA!" — pickup stab then sustained major hit with bell crown
      stab([261.63, 329.63, 392.0], 0, 0.22, 0.14, { bright: 3200 });
      stab([349.23, 440.0, 523.25, 698.46], 0.19, 1.5, 0.2, { bright: 3600 });
      pad(349.23, 0.19, 1.6, 0.08, { attack: 0.05 });
      bell(1396.91, 0.22, 1.6, 0.09);
    },
    recycle() {
      // paper crumple
      for (let i = 0; i < 7; i++)
        noiseBurst(i * 0.035 + Math.random() * 0.02, 0.05 + Math.random() * 0.04,
          900 + Math.random() * 2400, 1.5 + Math.random(), 0.05 + Math.random() * 0.03);
    },
    maximize() { bell(329.63, 0, 0.18, 0.06, { partials: [[1, 1]] }); bell(493.88, 0.06, 0.22, 0.06, { partials: [[1, 1]] }); },
    minimize() { bell(493.88, 0, 0.18, 0.06, { partials: [[1, 1]] }); bell(329.63, 0.06, 0.22, 0.06, { partials: [[1, 1]] }); },
    menu() { noiseBurst(0, 0.018, 2400, 2, 0.02); },
    click() { noiseBurst(0, 0.02, 1800, 2, 0.03); },
    modem() {
      // ~6.5s condensed dial-up handshake (original synthesis of the era's character)
      const tone = (f, t0, dur, g, type) => {
        const out = mkOut(t0, dur, g, 0.01, 0.1);
        const osc = ctx.createOscillator();
        osc.type = type || "sine";
        osc.frequency.value = f;
        osc.connect(out);
        osc.start(now() + t0); osc.stop(now() + t0 + dur + 0.05);
      };
      // dial tone
      tone(350, 0, 0.7, 0.05); tone(440, 0, 0.7, 0.05);
      // DTMF: 555-0198
      const DT = { "5": [770, 1336], "0": [941, 1336], "1": [697, 1209], "9": [852, 1477], "8": [852, 1336] };
      "5550198".split("").forEach((d, i) => {
        DT[d].forEach(f => tone(f, 0.85 + i * 0.13, 0.09, 0.06));
      });
      // remote answer tone
      tone(2100, 2.25, 0.6, 0.05);
      // V.32-style chirps
      tone(1200, 3.0, 0.4, 0.05, "square");
      tone(2250, 3.2, 0.45, 0.035);
      tone(1800, 3.7, 0.3, 0.04);
      // warble sweep
      const wOut = mkOut(4.0, 1.0, 0.045, 0.02, 0.1);
      const wOsc = ctx.createOscillator();
      wOsc.type = "sine";
      wOsc.frequency.setValueAtTime(1000, now() + 4.0);
      wOsc.frequency.linearRampToValueAtTime(2400, now() + 4.4);
      wOsc.frequency.linearRampToValueAtTime(1200, now() + 4.9);
      wOsc.connect(wOut);
      wOsc.start(now() + 4.0); wOsc.stop(now() + 5.1);
      // the crunchy negotiation hiss, fading as the link settles
      noiseBurst(4.9, 1.4, 2200, 0.4, 0.05);
      noiseBurst(5.2, 1.2, 1200, 0.5, 0.035);
      tone(1100, 6.1, 0.4, 0.02);
    }
  };

  function play(name) {
    if (!enabled) return;
    if (!ensure()) return;
    if (playCustom(name)) return;
    if (SYNTH[name]) SYNTH[name]();
  }

  let analyser = null;
  function getAnalyser() {
    if (!ensure()) return null;
    if (!analyser) {
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      master.connect(analyser);
    }
    return analyser;
  }

  /* shared audio bus for the music sequencer (routes through master volume) */
  function audio() {
    if (!ensure()) return null;
    return { ctx, master };
  }

  return {
    play,
    loadCustomFiles,
    rescan,
    getAnalyser,
    audio,
    get customEvents() { return Object.keys(customUrl); },
    get enabled() { return enabled; },
    set enabled(v) { enabled = v; Store.set("soundsEnabled", v); },
    get volume() { return volume; },
    set volume(v) { volume = v; Store.set("volume", v); if (master) master.gain.value = v; }
  };
})();

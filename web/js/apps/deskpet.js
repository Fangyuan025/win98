/* deskpet.js — DeskPet 98: a keychain creature for your desktop.
   It gets hungry in real time, even while the computer is off. Especially then. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  const DECAY_PER_MIN = { hunger: 1.2, happy: 0.8, energy: 0.6 };
  const STAGES = [
    { name: "Blobling", at: 0 },
    { name: "Bloblet", at: 2 },       /* days */
    { name: "Grand Blob", at: 5 }
  ];

  function load() {
    return Store.get("deskpet", null);
  }
  function save(p) { Store.set("deskpet", p); }
  function fresh(name) {
    return { name, born: Date.now(), hunger: 20, happy: 80, energy: 80, poops: 0, asleep: false, lastTick: Date.now(), fed: 0 };
  }
  function ageDays(p) { return (Date.now() - p.born) / 86400000; }
  function stageOf(p) {
    const a = ageDays(p);
    let s = STAGES[0];
    for (const st of STAGES) if (a >= st.at) s = st;
    return s;
  }
  function applyElapsed(p) {
    const mins = Math.min(60 * 24, (Date.now() - p.lastTick) / 60000);  /* cap: one day of decay */
    p.hunger = Math.min(100, p.hunger + mins * DECAY_PER_MIN.hunger * (p.asleep ? 0.3 : 1));
    p.happy = Math.max(0, p.happy - mins * DECAY_PER_MIN.happy * (p.asleep ? 0.3 : 1));
    p.energy = p.asleep ? Math.min(100, p.energy + mins * 2) : Math.max(0, p.energy - mins * DECAY_PER_MIN.energy);
    if (mins > 40 && Math.random() < mins / 300) p.poops = Math.min(3, p.poops + 1);
    p.lastTick = Date.now();
  }

  W98.Apps.deskpet = {
    name: "DeskPet 98", icon: "deskpet", single: true,
    launch() {
      const win = WM.create({
        title: "DeskPet 98", icon: "deskpet", appId: "deskpet",
        width: 280, height: 360, resizable: false, maximizable: false,
        statusbar: [{ text: "" }],
        menus: [
          { label: "File", items: () => [
            { label: "Rename Pet...", disabled: !load(), click: renamePet },
            { label: "Release Pet...", disabled: !load(), click: releasePet },
            "-",
            { label: "Exit", click: () => win.close() }
          ]},
          { label: "Help", items: () => [
            { label: "Help Topics", click: () => W98.launch("help", "tvpet") },
            { label: "About DeskPet 98", click: () => Dialogs.about("DeskPet 98", "deskpet", ["Responsibility, in beige.", "It remembers being ignored."]) }
          ]}
        ],
        onClose: () => { clearInterval(timer); const p = load(); if (p) { applyElapsed(p); save(p); } }
      });

      const cv = el("canvas", { width: 240, height: 170, style: "display:block;margin:6px auto 0;background:#bfe4c8;border:2px solid #404040" });
      const x = cv.getContext("2d");
      const bars = el("div", { style: "padding:6px 14px 0;display:grid;grid-template-columns:auto 1fr;gap:4px 8px;align-items:center;font-size:11px" });
      const mkBar = (label) => {
        const track = el("div", { class: "sunken", style: "height:10px;background:#fff;position:relative" });
        const fill = el("div", { style: "position:absolute;left:0;top:0;bottom:0;width:0%" });
        track.append(fill);
        bars.append(el("span", { text: label }), track);
        return fill;
      };
      const bHunger = mkBar("Hunger");
      const bHappy = mkBar("Happy");
      const bEnergy = mkBar("Energy");
      const btns = el("div", { style: "display:flex;gap:4px;justify-content:center;padding:8px 0 4px" });
      const mkBtn = (label, fn) => {
        const b = el("button", { class: "btn", text: label, style: "min-width:56px" });
        b.addEventListener("click", fn);
        btns.append(b);
        return b;
      };
      const feedB = mkBtn("Feed", () => act("feed"));
      const playB = mkBtn("Play", () => act("play"));
      const sleepB = mkBtn("Sleep", () => act("sleep"));
      const cleanB = mkBtn("Clean", () => act("clean"));
      win.body.append(cv, bars, btns);

      let t = 0, timer = null;

      function act(kind) {
        const p = load();
        if (!p) return;
        applyElapsed(p);
        if (kind === "feed") {
          if (p.asleep) { win.setStatus(0, W98.tr("Shh — it is sleeping.")); return; }
          p.hunger = Math.max(0, p.hunger - 30);
          p.fed++;
          if (p.fed % 3 === 0) p.poops = Math.min(3, p.poops + 1);
          Sound.play("click");
        } else if (kind === "play") {
          if (p.asleep) { win.setStatus(0, W98.tr("Shh — it is sleeping.")); return; }
          if (p.energy < 15) { win.setStatus(0, W98.tr("Too tired to play. Try Sleep.")); return; }
          p.happy = Math.min(100, p.happy + 25);
          p.energy = Math.max(0, p.energy - 15);
          Sound.play("ding");
        } else if (kind === "sleep") {
          p.asleep = !p.asleep;
          Sound.play("minimize");
        } else if (kind === "clean") {
          p.poops = 0;
          p.happy = Math.min(100, p.happy + 5);
          Sound.play("recycle");
        }
        save(p);
        paint();
      }

      function renamePet() {
        const p = load();
        if (!p) return;
        Dialogs.prompt({ title: "DeskPet 98", icon: "deskpet", label: W98.tr("New name:"), value: p.name }).then(n => {
          if (n) { p.name = n.trim().slice(0, 14) || p.name; save(p); paint(); }
        });
      }
      function releasePet() {
        WM.msgbox({
          title: "DeskPet 98", icon: "question",
          text: W98.tr("Release your pet into the wild?\n(The wild is behind the monitor. It will be fine. Probably.)"),
          buttons: ["Yes", "No"]
        }).then(r => {
          if (r === "Yes") { Store.set("deskpet", null); Sound.play("tada"); hatchFlow(); }
        });
      }

      function hatchFlow() {
        Dialogs.prompt({ title: "DeskPet 98", icon: "deskpet", label: W98.tr("An egg! Name your new pet:"), value: "Blobby" }).then(n => {
          const p = fresh((n || "Blobby").trim().slice(0, 14) || "Blobby");
          save(p);
          Sound.play("tada");
          paint();
        });
      }

      function moodOf(p) {
        if (p.asleep) return "asleep";
        if (p.hunger > 75) return "hungry";
        if (p.happy < 25) return "sad";
        if (p.happy > 70 && p.hunger < 40) return "happy";
        return "ok";
      }

      function paint() {
        const p = load();
        x.fillStyle = "#bfe4c8"; x.fillRect(0, 0, 240, 170);
        /* floor */
        x.fillStyle = "#9cc6a6"; x.fillRect(0, 140, 240, 30);
        if (!p) {
          x.fillStyle = "#f4e8c8";
          x.beginPath(); x.ellipse(120, 100, 34, 42, 0, 0, 7); x.fill();
          x.strokeStyle = "#c0a060"; x.lineWidth = 1.5;
          x.beginPath(); x.moveTo(96, 92); x.quadraticCurveTo(120, 106, 144, 92); x.stroke();
          x.fillStyle = "#404040"; x.font = "11px Tahoma, sans-serif"; x.textAlign = "center";
          x.fillText(W98.tr("Double-click the egg!"), 120, 34);
          x.textAlign = "left";
          win.setStatus(0, W98.tr("An egg is waiting."));
          return;
        }
        applyElapsed(p); save(p);
        const mood = moodOf(p);
        const stage = stageOf(p);
        const size = 26 + STAGES.indexOf(stage) * 9;
        const bob = p.asleep ? 0 : Math.sin(t / 5) * 4;
        const px2 = 120 + (p.asleep ? 0 : Math.sin(t / 17) * 30);
        const py2 = 118 - bob;
        /* poops */
        x.fillStyle = "#7a5230";
        for (let i = 0; i < p.poops; i++) {
          const bx = 34 + i * 32;
          x.beginPath(); x.ellipse(bx, 150, 9, 5, 0, 0, 7); x.fill();
          x.beginPath(); x.ellipse(bx, 143, 6, 4, 0, 0, 7); x.fill();
        }
        /* body */
        x.fillStyle = mood === "sad" ? "#7a9ad0" : mood === "hungry" ? "#d0b06a" : "#68c8e8";
        x.beginPath(); x.ellipse(px2, py2, size, size * 0.85, 0, 0, 7); x.fill();
        x.fillStyle = "rgba(255,255,255,0.35)";
        x.beginPath(); x.ellipse(px2 - size * 0.3, py2 - size * 0.35, size * 0.25, size * 0.18, -0.5, 0, 7); x.fill();
        /* crown for the elder stage */
        if (STAGES.indexOf(stage) === 2) {
          x.fillStyle = "#f0c020";
          x.beginPath();
          x.moveTo(px2 - 14, py2 - size * 0.8);
          [[-14, 0], [-8, -10], [-2, 0], [4, -12], [10, 0], [14, -9], [16, 2]].forEach(([dx, dy]) => x.lineTo(px2 + dx, py2 - size * 0.8 + dy));
          x.closePath(); x.fill();
        }
        /* face */
        x.fillStyle = "#103040";
        if (p.asleep) {
          x.fillRect(px2 - 12, py2 - 6, 8, 2); x.fillRect(px2 + 5, py2 - 6, 8, 2);
          x.font = "12px Tahoma, sans-serif";
          x.fillText("z", px2 + size + 4, py2 - size * 0.6 + Math.sin(t / 6) * 3);
          x.fillText("Z", px2 + size + 12, py2 - size * 0.9 + Math.sin(t / 6 + 1) * 3);
        } else {
          x.beginPath(); x.arc(px2 - 9, py2 - 5, 3.2, 0, 7); x.fill();
          x.beginPath(); x.arc(px2 + 9, py2 - 5, 3.2, 0, 7); x.fill();
          x.strokeStyle = "#103040"; x.lineWidth = 2; x.beginPath();
          if (mood === "happy") x.arc(px2, py2 + 6, 8, 0.25, Math.PI - 0.25);
          else if (mood === "sad" || mood === "hungry") x.arc(px2, py2 + 16, 8, Math.PI + 0.25, -0.25);
          else { x.moveTo(px2 - 6, py2 + 9); x.lineTo(px2 + 6, py2 + 9); }
          x.stroke();
        }
        /* bars + status */
        const setBar = (fill, v, invert) => {
          const good = invert ? 100 - v : v;
          fill.style.width = Math.round(v) + "%";
          fill.style.background = good > 55 ? "#2fa848" : good > 25 ? "#e0a020" : "#d03030";
        };
        setBar(bHunger, p.hunger, true);
        setBar(bHappy, p.happy, false);
        setBar(bEnergy, p.energy, false);
        sleepB.textContent = p.asleep ? W98.tr("Wake") : W98.tr("Sleep");
        win.setStatus(0, p.name + " · " + W98.tr(stage.name) + " · " + W98.tr("age") + " " + ageDays(p).toFixed(1) + W98.tr("d"));
      }

      cv.addEventListener("dblclick", () => { if (!load()) hatchFlow(); });
      timer = setInterval(() => { t++; if (!win.closed) paint(); }, 200);
      paint();
      win._pet = { load, act, state: () => { const p = load(); return p && { ...p, mood: moodOf(p), stage: stageOf(p).name }; } };
      return win;
    }
  };
})();

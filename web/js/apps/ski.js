/* ski.js — Powder Hill: point your skis downhill and try not to think
   about what lives past the 2000 meter mark. Original art & monster. */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.ski = {
  name: "Powder Hill", icon: "ski", single: true,
  launch() {
    const W = 420, H = 420;
    let player, objs, dist, speed, state, timer, monster, jumpT, score;
    // state: "run" | "crash" | "air" | "eaten" | "over"

    const win = WM.create({
      title: "Powder Hill", icon: "ski", appId: "ski",
      width: W + 16, height: H + 74, resizable: false, maximizable: false,
      statusbar: [{ text: "0 m" }, { text: "Style: 0", width: 90 }, { text: "Best: 0 m", width: 110 }],
      menus: [
        { label: "Game", items: () => [
          { label: "New Run", accel: "F2", click: newGame },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Help", items: () => [
          { label: "How to Play", click: () => WM.msgbox({
            title: "Powder Hill", icon: "info", width: 360,
            text: "Arrow keys steer. Down tucks for speed. Hit a ramp for style points.\nTrees and rocks hurt. Dogs are friends — do not hit the dog.\n\nLocal legend speaks of something big and hungry past 2000 m.\nThe legend is accurate."
          })},
          "-",
          { label: "About Powder Hill", click: () => Dialogs.about("Powder Hill", "ski", ["Fresh powder since 1998.", "No skiers were digested in testing. Mostly."]) }
        ]}
      ],
      onClose: () => clearInterval(timer)
    });
    const cv = el("canvas", { width: String(W), height: String(H), style: "display:block;margin:0 auto;background:#f4f8ff" });
    const x = cv.getContext("2d");
    win.body.append(cv);
    win.body.style.alignItems = "center";

    const keys = {};

    function newGame() {
      player = { x: W / 2, dir: 0 };  // dir: -2..2 (0=down)
      objs = [];
      dist = 0; speed = 3.2; score = 0;
      state = "run"; monster = null; jumpT = 0;
      for (let i = 0; i < 14; i++) spawn(Math.random() * H);
      sync();
    }
    function sync() {
      win.setStatus(0, Math.floor(dist) + " m");
      win.setStatus(1, "Style: " + score);
      win.setStatus(2, "Best: " + Store.get("skiBest", 0) + " m");
    }
    function spawn(y) {
      /* deeper runs mean denser trees and fewer friendly ramps */
      const hard = Math.min(1, dist / 3000);
      const r = Math.random();
      const treeCut = 0.45 + hard * 0.18, rockCut = treeCut + 0.25, stumpCut = rockCut + 0.12;
      const rampCut = stumpCut + 0.12 * (1 - hard * 0.5);
      const type = r < treeCut ? "tree" : r < rockCut ? "rock" : r < stumpCut ? "stump" : r < rampCut ? "ramp" : "dog";
      objs.push({ type, x: 10 + Math.random() * (W - 20), y: y != null ? y : H + 20 + Math.random() * 60, vx: type === "dog" ? (Math.random() < 0.5 ? 0.8 : -0.8) : 0 });
    }

    function step() {
      if (state === "over") { draw(); return; }
      if (state === "crash") {
        if (--crashT <= 0) state = "run";
        draw();
        return;
      }
      if (state === "eaten") {
        /* the world holds its breath while the legend has lunch */
        monster.phase += 0.2;
        if (--eatT <= 0) {
          state = "over";
          setTimeout(() => {
            if (win.closed) return;
            WM.msgbox({
              title: "Powder Hill", icon: "info",
              text: "The legend was accurate.\n\nDistance: " + Math.floor(dist) + " m\nStyle points: " + score +
                "\nBest run: " + Store.get("skiBest", 0) + " m\n\nSki again?",
              buttons: ["Yes", "No"]
            }).then(r => { if (r === "Yes") newGame(); });
          }, 300);
        }
        draw();
        return;
      }
      /* steering */
      if (keys.ArrowLeft) player.dir = Math.max(-2, player.dir - 0.2);
      else if (keys.ArrowRight) player.dir = Math.min(2, player.dir + 0.2);
      else player.dir *= 0.9;
      const tuck = keys.ArrowDown ? 1.6 : 0;
      const vSpeed = speed + tuck + (state === "air" ? 1.5 : 0);
      player.x = clamp(player.x + player.dir * 2.6, 8, W - 8);

      dist += vSpeed * 0.12;
      speed = Math.min(6.5, 3.2 + dist / 400);
      if (state === "air" && --jumpT <= 0) state = "run";

      objs.forEach(o => {
        o.y -= vSpeed;
        if (o.vx) o.x += o.vx;
      });
      objs = objs.filter(o => o.y > -30 && o.x > -20 && o.x < W + 20);
      const density = 14 + Math.min(12, Math.floor(dist / 300));
      while (objs.length < density) spawn();

      /* collisions (grounded only) */
      if (state === "run") {
        for (const o of objs) {
          const dx = Math.abs(o.x - player.x), dy = Math.abs(o.y - 92);
          if (o.type === "ramp" && dx < 14 && dy < 10) {
            state = "air"; jumpT = 42; score += 100;
            Sound.play("maximize");
            sync();
          } else if ((o.type === "tree" && dx < 11 && dy < 12) ||
                     (o.type === "rock" && dx < 12 && dy < 8) ||
                     (o.type === "stump" && dx < 9 && dy < 7)) {
            state = "crash"; crashT = 40; speed = 3.2;
            o.y = -99;
            Sound.play("error");
          } else if (o.type === "dog" && dx < 12 && dy < 10) {
            score = Math.max(0, score - 50);
            o.vx *= -1.5;
            Sound.play("warn");
            win.setStatus(1, "Style: " + score + "  (you upset the dog)");
          }
        }
      }

      /* the thing from past 2000 m */
      if (dist > 2000 && !monster) {
        monster = { x: player.x < W / 2 ? W - 30 : 30, y: H + 30, phase: 0 };
        Sound.play("warn");
      }
      if (monster && state !== "eaten") {
        monster.phase += 0.2;
        monster.hunger = Math.min(2.2, (monster.hunger || 1) + 0.0012);
        monster.y += ((92 + 26 - monster.y) * 0.02) * monster.hunger - (speed - 3.2) * 0.4;
        monster.x += (player.x - monster.x) * 0.022 * monster.hunger;
        if (Math.abs(monster.x - player.x) < 12 && Math.abs(monster.y - 92) < 18) {
          state = "eaten"; eatT = 80;
          Sound.play("error");
          const best = Store.get("skiBest", 0);
          if (Math.floor(dist) > best) Store.set("skiBest", Math.floor(dist));
        }
      }
      sync();
      draw();
    }
    let crashT = 0, eatT = 0;

    function draw() {
      x.fillStyle = "#f4f8ff";
      x.fillRect(0, 0, W, H);
      /* ski tracks */
      x.strokeStyle = "#d8e0ec"; x.lineWidth = 2;
      x.beginPath(); x.moveTo(player.x - 4, 100); x.lineTo(player.x - 4 - player.dir * 8, H);
      x.moveTo(player.x + 4, 100); x.lineTo(player.x + 4 - player.dir * 8, H); x.stroke();

      objs.forEach(o => {
        if (o.type === "tree") {
          x.fillStyle = "#1c6e2c";
          x.beginPath(); x.moveTo(o.x, o.y - 16); x.lineTo(o.x - 9, o.y + 2); x.lineTo(o.x + 9, o.y + 2); x.closePath(); x.fill();
          x.beginPath(); x.moveTo(o.x, o.y - 8); x.lineTo(o.x - 11, o.y + 8); x.lineTo(o.x + 11, o.y + 8); x.closePath(); x.fill();
          x.fillStyle = "#6b4a2b"; x.fillRect(o.x - 2, o.y + 8, 4, 5);
        } else if (o.type === "rock") {
          x.fillStyle = "#9aa2b0";
          x.beginPath(); x.ellipse(o.x, o.y, 11, 7, 0, 0, Math.PI * 2); x.fill();
          x.fillStyle = "#c5ccd8";
          x.beginPath(); x.ellipse(o.x - 3, o.y - 2, 4, 2.5, 0, 0, Math.PI * 2); x.fill();
        } else if (o.type === "stump") {
          x.fillStyle = "#6b4a2b"; x.fillRect(o.x - 5, o.y - 4, 10, 8);
          x.fillStyle = "#8a6238"; x.fillRect(o.x - 5, o.y - 6, 10, 3);
        } else if (o.type === "ramp") {
          x.fillStyle = "#e8ecf4";
          x.beginPath(); x.moveTo(o.x - 13, o.y + 6); x.lineTo(o.x + 13, o.y + 6); x.lineTo(o.x + 13, o.y - 6); x.closePath(); x.fill();
          x.strokeStyle = "#a0a8b8"; x.lineWidth = 1; x.stroke();
        } else if (o.type === "dog") {
          x.fillStyle = "#b98a4a";
          x.fillRect(o.x - 8, o.y - 4, 14, 7);
          x.fillRect(o.x + (o.vx > 0 ? 5 : -9), o.y - 8, 5, 5);
          x.fillStyle = "#7a5a30";
          x.fillRect(o.x - 8, o.y + 3, 2, 4); x.fillRect(o.x + 3, o.y + 3, 2, 4);
        }
      });

      /* player */
      const py = 92, lean = player.dir * 4;
      if (state === "crash") {
        x.fillStyle = "#e04040";
        x.fillRect(player.x - 8, py - 4, 16, 8);
        x.fillStyle = "#f0f0f0"; x.font = "10px Arial";
        x.fillText("oof", player.x + 10, py);
      } else if (state === "eaten") {
        /* being carried off */
      } else {
        const air = state === "air" ? -8 : 0;
        x.strokeStyle = "#c02020"; x.lineWidth = 3;
        x.beginPath(); x.moveTo(player.x - 6 + lean, py + 8 + air); x.lineTo(player.x - 6 - lean, py - 16 + air); x.stroke();
        x.beginPath(); x.moveTo(player.x + 6 + lean, py + 8 + air); x.lineTo(player.x + 6 - lean, py - 16 + air); x.stroke();
        x.fillStyle = "#2050c0";
        x.fillRect(player.x - 5 + lean / 2, py - 14 + air, 10, 12);
        x.fillStyle = "#ffcc99";
        x.beginPath(); x.arc(player.x + lean / 2, py - 18 + air, 5, 0, Math.PI * 2); x.fill();
        x.fillStyle = "#e04040";
        x.fillRect(player.x - 5 + lean / 2, py - 24 + air, 10, 4);
      }

      /* monster */
      if (monster) {
        const my = monster.y, mx = monster.x;
        const bob = Math.sin(monster.phase) * 3;
        x.fillStyle = "#e8ecf0";
        x.beginPath(); x.ellipse(mx, my + bob, 16, 20, 0, 0, Math.PI * 2); x.fill();
        x.strokeStyle = "#9098a8"; x.lineWidth = 2; x.stroke();
        x.fillStyle = "#e8ecf0";
        x.beginPath(); x.arc(mx, my - 22 + bob, 11, 0, Math.PI * 2); x.fill(); x.stroke();
        x.fillStyle = "#d02020";
        x.beginPath(); x.arc(mx - 4, my - 24 + bob, 2.2, 0, Math.PI * 2); x.fill();
        x.beginPath(); x.arc(mx + 4, my - 24 + bob, 2.2, 0, Math.PI * 2); x.fill();
        x.fillStyle = "#601010";
        x.beginPath(); x.arc(mx, my - 18 + bob, 4.5, 0, Math.PI); x.fill();
        x.fillStyle = "#fff";
        for (let i = -3; i <= 3; i += 2) x.fillRect(mx + i, my - 19 + bob, 1.6, 2.4);
        if (state === "eaten") {
          x.fillStyle = "#000"; x.font = "bold 12px Arial"; x.textAlign = "center";
          x.fillText("*munch*", mx, my - 40);
          x.textAlign = "left";
        }
      }
    }

    win.el.tabIndex = -1;
    cv.addEventListener("mousedown", () => win.el.focus());
    win.ctxMenu = () => [
      { label: "New Game", accel: "F2", click: () => win.el.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true })) }
    ];
    win.el.addEventListener("keydown", (e) => {
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp"].includes(e.key)) { keys[e.key] = true; e.preventDefault(); }
      if (e.key === "F2") { e.preventDefault(); newGame(); }
    });
    win.el.addEventListener("keyup", (e) => { keys[e.key] = false; });

    newGame();
    /* wall-clock compensation: if the environment throttles timers, catch up */
    let lastT = performance.now();
    timer = setInterval(() => {
      const now = performance.now();
      const steps = clamp(Math.round((now - lastT) / 30), 1, 6);
      lastT = now;
      for (let i = 0; i < steps; i++) step();
    }, 30);
    setTimeout(() => win.el.focus(), 80);
    return win;
  }
};

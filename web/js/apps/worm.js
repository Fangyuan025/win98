/* worm.js — Worm 98: the QBasic classic, green on black, exactly as remembered. */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.worm = {
  name: "Worm 98", icon: "worm", single: true,
  launch() {
    const CW = 40, CH = 26, CS = 12;
    const W = CW * CS, H = CH * CS;
    let snake, dir, nextDir, food, foodVal, score, speed, timer, state, grow, turnLocked = false;

    const win = WM.create({
      title: "Worm 98", icon: "worm", appId: "worm",
      width: W + 16, height: H + 74, resizable: false, maximizable: false,
      statusbar: [{ text: "Score: 0" }, { text: "High: 0", width: 100 }],
      menus: [
        { label: "Game", items: () => [
          { label: "New Game", accel: "F2", click: newGame },
          { label: "Pause", accel: "P", click: () => togglePause() },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Help", items: () => [
          { label: "How to Play", click: () => WM.msgbox({
            title: "Worm 98", icon: "info", width: 340,
            text: "Arrow keys steer the worm. Eat the numbers — bigger numbers are worth more and make you longer.\n\nWalls are fatal. You are also fatal to yourself. The worm speeds up as it grows, because life is like that."
          })},
          "-",
          { label: "About Worm 98", click: () => Dialogs.about("Worm 98", "worm", ["Ported from a QBasic listing", "typed in from a magazine, probably."]) }
        ]}
      ],
      onClose: () => clearInterval(timer)
    });
    const cv = el("canvas", { width: String(W), height: String(H), style: "display:block;margin:0 auto;background:#000" });
    const x = cv.getContext("2d");
    win.body.append(cv);
    win.body.style.alignItems = "center";

    function newGame() {
      snake = [[13, 20], [13, 19], [13, 18]];
      dir = [0, 1]; nextDir = dir;
      score = 0; grow = 0; state = "play";
      placeFood();
      restartTimer(130);
      sync();
    }
    function restartTimer(ms) {
      clearInterval(timer);
      speed = ms;
      timer = setInterval(step, ms);
    }
    function placeFood() {
      do {
        food = [1 + (Math.random() * (CH - 2)) | 0, 1 + (Math.random() * (CW - 2)) | 0];
      } while (snake.some(s => s[0] === food[0] && s[1] === food[1]));
      foodVal = 1 + ((Math.random() * 9) | 0);
    }
    function sync() {
      win.setStatus(0, "Score: " + score);
      win.setStatus(1, "High: " + Store.get("wormHigh", 0));
    }

    function togglePause() {
      if (state === "play") { state = "pause"; draw(); }
      else if (state === "pause") { state = "play"; }
    }
    function step() {
      if (state !== "play") return;
      dir = nextDir;
      turnLocked = false;
      const head = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
      const hitWall = head[0] <= 0 || head[1] <= 0 || head[0] >= CH - 1 || head[1] >= CW - 1;
      const hitSelf = snake.some(s => s[0] === head[0] && s[1] === head[1]);
      if (hitWall || hitSelf) {
        state = "over";
        Sound.play("error");
        const high = Store.get("wormHigh", 0);
        if (score > high) Store.set("wormHigh", score);
        sync();
        draw();
        setTimeout(() => {
          if (win.closed) return;
          WM.msgbox({
            title: "Worm 98", icon: "info",
            text: (hitWall ? "The wall was there the whole time.\n" : "You have collided with yourself. Classic.\n") +
              "\nScore: " + score + "\nHigh score: " + Math.max(high, score) + "\n\nPlay again?",
            buttons: ["Yes", "No"]
          }).then(r => { if (r === "Yes") newGame(); });
        }, 250);
        return;
      }
      snake.unshift(head);
      if (head[0] === food[0] && head[1] === food[1]) {
        score += foodVal * 10;
        grow += foodVal;
        Sound.play("click");
        placeFood();
        if (speed > 60) restartTimer(speed - 3);
        sync();
      }
      if (grow > 0) grow--;
      else snake.pop();
      draw();
    }

    function draw() {
      x.fillStyle = "#000";
      x.fillRect(0, 0, W, H);
      /* border */
      x.fillStyle = "#a00000";
      for (let c = 0; c < CW; c++) { cell(0, c); cell(CH - 1, c); }
      for (let r = 0; r < CH; r++) { cell(r, 0); cell(r, CW - 1); }
      /* worm */
      snake.forEach(([r, c], i) => {
        x.fillStyle = i === 0 ? "#80ff80" : "#00c000";
        cell(r, c);
      });
      /* food */
      x.fillStyle = "#ffff00";
      x.font = "bold " + CS + "px 'Courier New', monospace";
      x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText(String(foodVal), food[1] * CS + CS / 2, food[0] * CS + CS / 2 + 1);
      x.textAlign = "left"; x.textBaseline = "alphabetic";
      if (state === "pause") {
        x.fillStyle = "rgba(0,0,0,0.55)"; x.fillRect(0, H / 2 - 26, W, 52);
        x.fillStyle = "#00ff00"; x.font = "bold 18px 'Courier New', monospace"; x.textAlign = "center";
        x.fillText("P A U S E D", W / 2, H / 2 + 6);
        x.textAlign = "left";
      }
      if (state === "over") {
        x.fillStyle = "rgba(0,0,0,0.55)"; x.fillRect(0, H / 2 - 26, W, 52);
        x.fillStyle = "#00ff00"; x.font = "bold 18px 'Courier New', monospace"; x.textAlign = "center";
        x.fillText("G A M E   O V E R", W / 2, H / 2 + 6);
        x.textAlign = "left";
      }
      function cell(r, c) { x.fillRect(c * CS + 1, r * CS + 1, CS - 2, CS - 2); }
    }

    win.el.tabIndex = -1;
    cv.addEventListener("mousedown", () => { win.el.focus(); if (state === "pause") togglePause(); });
    win.el.addEventListener("focusout", (e) => {
      if (!win.el.contains(e.relatedTarget) && state === "play") togglePause();
    });
    win.ctxMenu = () => [
      { label: "New Game", accel: "F2", click: () => win.el.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true })) }
    ];
    win.el.addEventListener("keydown", (e) => {
      const map = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (map[e.key]) {
        e.preventDefault();
        const nd = map[e.key];
        // one turn per tick, judged against the direction actually in effect —
        // two fast presses can no longer reverse into the neck
        if (!turnLocked && (nd[0] !== -dir[0] || nd[1] !== -dir[1])) {
          nextDir = nd;
          turnLocked = true;
        }
      }
      if (e.key === "F2") { e.preventDefault(); newGame(); }
      if (e.key === "p" || e.key === "P") { e.preventDefault(); togglePause(); }
    });

    newGame();
    setTimeout(() => win.el.focus(), 80);
    win._worm = { state: () => ({ snake, dir, food, state }) };
    return win;
  }
};

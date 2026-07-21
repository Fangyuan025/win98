/* iconart.js — high-fidelity procedural Win98-style icons (original artwork, canvas 2D) */
"use strict";
(function () {
  const draws = {};

  /* ---------- drawing helpers (32x32 coordinate space) ---------- */
  function rr(x, X, Y, W, H, R) {
    x.beginPath();
    x.moveTo(X + R, Y);
    x.arcTo(X + W, Y, X + W, Y + H, R);
    x.arcTo(X + W, Y + H, X, Y + H, R);
    x.arcTo(X, Y + H, X, Y, R);
    x.arcTo(X, Y, X + W, Y, R);
    x.closePath();
  }
  function vgrad(x, y0, y1, stops) {
    const g = x.createLinearGradient(0, y0, 0, y1);
    stops.forEach(s => g.addColorStop(s[0], s[1]));
    return g;
  }
  function hgrad(x, x0, x1, stops) {
    const g = x.createLinearGradient(x0, 0, x1, 0);
    stops.forEach(s => g.addColorStop(s[0], s[1]));
    return g;
  }
  function poly(x, pts) {
    x.beginPath();
    pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]));
    x.closePath();
  }
  // beveled panel (raised): face + white top/left + dark bottom/right
  function panel(x, X, Y, W, H, face, hi, lo) {
    x.fillStyle = face; x.fillRect(X, Y, W, H);
    x.fillStyle = hi; x.fillRect(X, Y, W, 1); x.fillRect(X, Y, 1, H);
    x.fillStyle = lo; x.fillRect(X, Y + H - 1, W, 1); x.fillRect(X + W - 1, Y, 1, H);
  }
  function outlineRect(x, X, Y, W, H, col) {
    x.strokeStyle = col; x.lineWidth = 1;
    x.strokeRect(X + 0.5, Y + 0.5, W - 1, H - 1);
  }

  /* ---------- a classic manila folder ---------- */
  function folderBody(x, open) {
    // back plate + tab
    x.fillStyle = "#000";
    poly(x, [[3, 11], [11, 11], [14, 8.5], [21, 8.5], [23, 11], [29, 11], [29, 27], [3, 27]]);
    x.fill();
    const back = vgrad(x, 9, 27, [[0, "#f6d98a"], [1, "#d9a838"]]);
    x.fillStyle = back;
    poly(x, [[4, 12], [11, 12], [14, 9.5], [20.6, 9.5], [22.4, 12], [28, 12], [28, 26], [4, 26]]);
    x.fill();
    if (open) {
      // open: front flap tilts forward, lighter, offset
      x.fillStyle = "#000";
      poly(x, [[1.5, 27], [7, 15.5], [31, 15.5], [26, 27]]);
      x.fill();
      const front = vgrad(x, 15, 27, [[0, "#fff0c0"], [1, "#f0c455"]]);
      x.fillStyle = front;
      poly(x, [[3, 26], [8, 16.5], [29.4, 16.5], [24.6, 26]]);
      x.fill();
    } else {
      // closed: front panel overlaps lower 2/3
      x.fillStyle = "#000"; x.fillRect(3, 14, 26, 13);
      x.fillStyle = vgrad(x, 15, 26, [[0, "#ffeaa8"], [0.5, "#f6cf6a"], [1, "#e2b048"]]);
      x.fillRect(4, 15, 24, 11);
      // subtle front highlight line
      x.fillStyle = "rgba(255,255,255,0.55)"; x.fillRect(4, 15, 24, 1);
      x.fillStyle = "rgba(120,80,0,0.35)"; x.fillRect(4, 25, 24, 1);
    }
  }
  draws.folder = x => folderBody(x, false);
  draws.folderopen = x => folderBody(x, true);
  draws.programs = x => {
    folderBody(x, false);
    // little program window peeking out
    x.fillStyle = "#000"; x.fillRect(9, 9, 14, 11);
    x.fillStyle = "#c0c0c0"; x.fillRect(10, 10, 12, 9);
    x.fillStyle = "#000080"; x.fillRect(10, 10, 12, 3);
    x.fillStyle = "#fff"; x.fillRect(11, 14, 10, 1); x.fillRect(11, 16, 8, 1);
  };
  draws.favorites = x => {
    folderBody(x, false);
    // gold star
    x.fillStyle = "#ffd700"; x.strokeStyle = "#a07800"; x.lineWidth = 0.7;
    star(x, 16, 12.5, 6.2, 2.7, 5);
    x.fill(); x.stroke();
  };
  function star(x, cx, cy, ro, ri, n) {
    x.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? ri : ro;
      const a = Math.PI / n * i - Math.PI / 2;
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.closePath();
  }

  /* ---------- My Documents ---------- */
  draws.mydocs = x => {
    folderBody(x, false);
    // sheet of paper with text lines poking up
    x.fillStyle = "#000"; x.fillRect(10, 5, 13, 15);
    x.fillStyle = "#fff"; x.fillRect(11, 6, 11, 13);
    x.fillStyle = "#c00000"; x.fillRect(12, 8, 9, 1);
    x.fillStyle = "#000080"; for (let i = 0; i < 4; i++) x.fillRect(12, 10 + i * 2, 9, 1);
    // redraw front flap over lower part of paper
    x.fillStyle = "#000"; x.fillRect(3, 14, 26, 13);
    x.fillStyle = vgrad(x, 15, 26, [[0, "#ffeaa8"], [0.5, "#f6cf6a"], [1, "#e2b048"]]);
    x.fillRect(4, 15, 24, 11);
    x.fillStyle = "rgba(255,255,255,0.5)"; x.fillRect(4, 15, 24, 1);
  };

  /* ---------- My Computer ---------- */
  function computerBox(x) {
    // monitor
    x.fillStyle = "#000"; rr(x, 4, 2, 24, 19, 2.5); x.fill();
    x.fillStyle = "#cfcabb"; rr(x, 5, 3, 22, 17, 2); x.fill();
    x.fillStyle = "#efeada"; x.fillRect(6, 4, 19, 1); x.fillRect(6, 4, 1, 13);
    x.fillStyle = "#8e8a7c"; x.fillRect(6, 16, 20, 1); x.fillRect(25, 4, 1, 13);
    // screen
    x.fillStyle = "#000"; x.fillRect(7, 5, 17, 11);
    x.fillStyle = vgrad(x, 5, 16, [[0, "#2f6fb0"], [0.5, "#63a0d8"], [1, "#a8cef0"]]);
    x.fillRect(8, 6, 15, 9);
    // screen glint
    x.fillStyle = "rgba(255,255,255,0.35)";
    poly(x, [[8, 6], [14, 6], [8, 12]]); x.fill();
    // power LED
    x.fillStyle = "#39d24a"; x.fillRect(22, 17.5, 2, 1.5);
    // stand
    x.fillStyle = "#000"; x.fillRect(13, 20, 6, 2);
    x.fillStyle = "#bdb8aa"; x.fillRect(14, 20, 4, 1);
    // base / tower
    x.fillStyle = "#000"; rr(x, 2, 23, 27, 7, 1.5); x.fill();
    x.fillStyle = "#cfcabb"; rr(x, 3, 24, 25, 5, 1); x.fill();
    x.fillStyle = "#efeada"; x.fillRect(3, 24, 25, 1);
    x.fillStyle = "#8e8a7c"; x.fillRect(3, 28, 25, 1);
    // drive slots + green light
    x.fillStyle = "#a8a396"; x.fillRect(20, 25.5, 5, 1); x.fillRect(20, 27, 5, 0.8);
    x.fillStyle = "#39d24a"; x.fillRect(5, 26, 2, 1.5);
  }
  draws.mycomputer = computerBox;
  draws.tree_pc = computerBox;

  /* ---------- Network Neighborhood ---------- */
  draws.spider = x => {
    /* card with a little spider */
    x.fillStyle = "#fff"; rr(x, 6, 3, 20, 26, 2); x.fill();
    x.strokeStyle = "#808080"; x.lineWidth = 0.8; rr(x, 6, 3, 20, 26, 2); x.stroke();
    x.fillStyle = "#000"; x.font = "bold 7px Arial";
    x.fillText("K", 8.5, 11); x.fillText("♠", 8.5, 18);
    /* spider body */
    x.fillStyle = "#202020";
    x.beginPath(); x.ellipse(19, 19, 4, 5, 0, 0, 7); x.fill();
    x.beginPath(); x.arc(19, 12.5, 2.6, 0, 7); x.fill();
    x.strokeStyle = "#202020"; x.lineWidth = 1;
    [[-1, -2], [-1.5, 0], [-1.2, 2], [-0.8, 4]].forEach(([dy, k], idx) => {
      const yy = 15 + idx * 2.4;
      x.beginPath(); x.moveTo(15.4, yy); x.quadraticCurveTo(11, yy - 2, 9.5, yy + 2); x.stroke();
      x.beginPath(); x.moveTo(22.6, yy); x.quadraticCurveTo(27, yy - 2, 28.5, yy + 2); x.stroke();
    });
    x.strokeStyle = "#a0a0a0"; x.lineWidth = 0.6;
    x.beginPath(); x.moveTo(19, 3); x.lineTo(19, 9.8); x.stroke();
  };
  draws.sysmon = x => {
    x.fillStyle = "#000"; rr(x, 3, 4, 26, 24, 1.5); x.fill();
    x.strokeStyle = "#004000"; x.lineWidth = 0.6;
    for (let gy = 8; gy < 28; gy += 5) { x.beginPath(); x.moveTo(4, gy); x.lineTo(28, gy); x.stroke(); }
    x.strokeStyle = "#00d000"; x.lineWidth = 1.6;
    x.beginPath();
    [[4, 22], [8, 18], [11, 20], [14, 10], [17, 14], [20, 8], [24, 13], [28, 9]].forEach(([px, py], i2) => i2 ? x.lineTo(px, py) : x.moveTo(px, py));
    x.stroke();
    x.strokeStyle = "#c00000"; x.lineWidth = 1.2;
    x.beginPath();
    [[4, 25], [9, 24], [13, 26], [18, 22], [23, 24], [28, 21]].forEach(([px, py], i2) => i2 ? x.lineTo(px, py) : x.moveTo(px, py));
    x.stroke();
  };
  draws.deskpet = x => {
    /* keychain egg-creature */
    x.fillStyle = "#e05090";
    x.beginPath(); x.ellipse(16, 15, 12, 13.5, 0, 0, 7); x.fill();
    x.fillStyle = "#bfe4c8"; x.fillRect(8.5, 8, 15, 13);
    x.fillStyle = "#68c8e8";
    x.beginPath(); x.ellipse(16, 15.5, 5.5, 5, 0, 0, 7); x.fill();
    x.fillStyle = "#103040";
    x.fillRect(13.4, 13.6, 1.6, 1.6); x.fillRect(17, 13.6, 1.6, 1.6);
    x.fillRect(14.5, 17.2, 3, 1);
    x.fillStyle = "#901850";
    [[10, 26], [16, 27.5], [22, 26]].forEach(([px, py]) => { x.beginPath(); x.arc(px, py, 2.2, 0, 7); x.fill(); });
    x.strokeStyle = "#901850"; x.lineWidth = 2;
    x.beginPath(); x.arc(16, 3.5, 2.6, 0, 7); x.stroke();
  };
  draws.tv98 = x => {
    x.fillStyle = "#5a4632"; rr(x, 2, 5, 28, 21, 3); x.fill();
    x.fillStyle = "#2a2118"; rr(x, 4.5, 7, 19, 17, 2); x.fill();
    const g = x.createLinearGradient(6, 8, 22, 23);
    g.addColorStop(0, "#78c8e8"); g.addColorStop(1, "#3a6a90");
    x.fillStyle = g; x.fillRect(6, 8.5, 16, 14);
    /* tiny duck on screen */
    x.fillStyle = "#f0d040";
    x.beginPath(); x.ellipse(13, 18, 3.4, 2.6, 0, 0, 7); x.fill();
    x.beginPath(); x.arc(15.6, 15.6, 1.8, 0, 7); x.fill();
    /* knobs */
    x.fillStyle = "#8a7458";
    x.beginPath(); x.arc(26.5, 11, 1.8, 0, 7); x.fill();
    x.beginPath(); x.arc(26.5, 16, 1.8, 0, 7); x.fill();
    x.fillStyle = "#c0b098"; x.fillRect(25.3, 20, 2.6, 1.4);
    /* antenna */
    x.strokeStyle = "#404040"; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(12, 5); x.lineTo(7, 0.5); x.moveTo(14, 5); x.lineTo(20, 0.5); x.stroke();
  };
  draws.megademo = x => {
    /* plasma blob + scrolltext hint */
    const g = x.createLinearGradient(2, 2, 30, 30);
    g.addColorStop(0, "#e040a0"); g.addColorStop(0.5, "#4060e0"); g.addColorStop(1, "#20c080");
    x.fillStyle = g; rr(x, 2, 2, 28, 28, 3); x.fill();
    x.fillStyle = "rgba(255,255,255,0.25)";
    x.beginPath(); x.ellipse(12, 12, 9, 6, 0.6, 0, 7); x.fill();
    x.beginPath(); x.ellipse(22, 21, 7, 5, -0.4, 0, 7); x.fill();
    x.fillStyle = "#fff"; x.font = "bold 7px 'Courier New',monospace";
    x.fillText("DEMO", 5, 18);
    x.fillStyle = "#ffe060"; x.fillText("~98~", 8, 26);
  };
  draws.composer = x => {
    x.fillStyle = "#181820"; rr(x, 3, 4, 26, 24, 2); x.fill();
    x.strokeStyle = "#404050"; x.lineWidth = 0.6;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) x.strokeRect(5.5 + c * 3.2, 6.5 + r * 4.2, 3.2, 4.2);
    [[0,1,"#3060d0"],[1,3,"#3060d0"],[2,5,"#3060d0"],[3,2,"#20a040"],[4,0,"#a03030"],[4,3,"#a03030"],[4,6,"#a03030"],[1,6,"#c07020"]].forEach(([r,c,col])=>{
      x.fillStyle = col; x.fillRect(5.8 + c * 3.2, 6.8 + r * 4.2, 2.6, 3.6);
    });
    x.fillStyle = "#f0e060"; x.fillRect(5.5 + 3 * 3.2, 27, 3.2, 2);
    /* tiny note */
    x.fillStyle = "#fff";
    x.beginPath(); x.ellipse(24, 25, 2, 1.5, -0.3, 0, 7); x.fill();
    x.fillRect(25.5, 15, 1, 10);
    x.beginPath(); x.moveTo(25.5, 15); x.quadraticCurveTo(29, 16, 28, 19); x.quadraticCurveTo(27.5, 17, 26.5, 17); x.closePath(); x.fill();
  };
  draws.corridor = x => {
    /* dark corridor receding to a lit door, goo eyes in the shadow */
    x.fillStyle = "#101018"; x.fillRect(2, 2, 28, 28);
    x.fillStyle = "#7a2818";
    x.beginPath(); x.moveTo(2, 2); x.lineTo(12, 10); x.lineTo(12, 22); x.lineTo(2, 30); x.closePath(); x.fill();
    x.fillStyle = "#5a1c10";
    x.beginPath(); x.moveTo(30, 2); x.lineTo(20, 10); x.lineTo(20, 22); x.lineTo(30, 30); x.closePath(); x.fill();
    x.fillStyle = "#302820";
    x.beginPath(); x.moveTo(2, 30); x.lineTo(12, 22); x.lineTo(20, 22); x.lineTo(30, 30); x.closePath(); x.fill();
    x.fillStyle = "#1a1a28";
    x.beginPath(); x.moveTo(2, 2); x.lineTo(12, 10); x.lineTo(20, 10); x.lineTo(30, 2); x.closePath(); x.fill();
    x.fillStyle = "#70e0ff"; x.fillRect(13.5, 11, 5, 11);
    x.fillStyle = "#c0f4ff"; x.fillRect(15, 13, 2, 7);
    /* goo peeking */
    x.fillStyle = "#38b038";
    x.beginPath(); x.ellipse(9, 24, 4, 3.2, 0, 0, 7); x.fill();
    x.fillStyle = "#fff";
    x.beginPath(); x.arc(7.8, 23, 1.1, 0, 7); x.fill();
    x.beginPath(); x.arc(10.4, 23, 1.1, 0, 7); x.fill();
    x.fillStyle = "#102010";
    x.beginPath(); x.arc(8, 23.2, 0.5, 0, 7); x.fill();
    x.beginPath(); x.arc(10.6, 23.2, 0.5, 0, 7); x.fill();
  };
  draws.calendar = x => {
    x.fillStyle = "#fff"; rr(x, 4, 5, 24, 23, 2); x.fill();
    x.strokeStyle = "#808080"; x.lineWidth = 0.8; rr(x, 4, 5, 24, 23, 2); x.stroke();
    x.fillStyle = "#b03030"; x.fillRect(4.5, 5.5, 23, 6);
    x.fillStyle = "#fff"; x.font = "bold 5px Tahoma, sans-serif"; x.fillText("1998", 11, 10.5);
    x.fillStyle = "#c0c0c8";
    [[7,14],[13,14],[19,14],[25,14],[7,19],[13,19],[25,19],[7,24],[19,24],[25,24]].forEach(([px,py])=>x.fillRect(px-1.5,py-1.5,4,3.4));
    x.fillStyle = "#3050c0"; x.fillRect(17.5, 17.5, 4, 3.4);
    x.fillStyle = "#606068"; x.fillRect(9, 3, 2, 4); x.fillRect(21, 3, 2, 4);
  };
  draws.sticky = x => {
    x.save();
    x.translate(16, 16); x.rotate(-0.08); x.translate(-16, -16);
    x.fillStyle = "rgba(0,0,0,0.18)"; x.fillRect(7, 8, 21, 21);
    x.fillStyle = "#ffef70"; x.fillRect(5, 5, 21, 21);
    x.fillStyle = "#e8d84a";
    x.beginPath(); x.moveTo(26, 18); x.lineTo(26, 26); x.lineTo(18, 26); x.closePath(); x.fill();
    x.strokeStyle = "#8a8030"; x.lineWidth = 1;
    [[9,11],[9,15],[9,19]].forEach(([px,py])=>{ x.beginPath(); x.moveTo(px,py); x.lineTo(px+12-(py%3)*2, py); x.stroke(); });
    x.restore();
  };
  draws.claude98 = x => {
    /* cream rounded plate with the coral starburst */
    x.fillStyle = "#f4ede2"; rr(x, 2, 2, 28, 28, 5); x.fill();
    x.strokeStyle = "#c8b8a2"; x.lineWidth = 1; rr(x, 2, 2, 28, 28, 5); x.stroke();
    x.fillStyle = "#da7756";
    const n = 12, cx = 16, cy = 16, r1 = 2.6, r2 = 10.5;
    for (let k = 0; k < n; k++) {
      const a = k * Math.PI * 2 / n;
      x.save(); x.translate(cx, cy); x.rotate(a);
      x.beginPath();
      x.moveTo(0, -r1 * 0.55); x.lineTo(r2, 0); x.lineTo(0, r1 * 0.55); x.closePath();
      x.fill(); x.restore();
    }
  };
  draws.photogoo = x => {
    /* a face mid-goo */
    x.fillStyle = "#8fc1e8"; rr(x, 3, 3, 26, 26, 2); x.fill();
    x.fillStyle = "#f2c9a0";
    x.beginPath();
    x.moveTo(10, 9);
    x.bezierCurveTo(20, 4, 27, 12, 22, 17);
    x.bezierCurveTo(28, 20, 20, 29, 14, 25);
    x.bezierCurveTo(6, 28, 5, 16, 10, 9);
    x.fill();
    x.fillStyle = "#204060";
    x.beginPath(); x.ellipse(13, 13, 1.6, 2.6, -0.4, 0, 7); x.fill();
    x.beginPath(); x.ellipse(20, 12, 2.6, 1.4, 0.5, 0, 7); x.fill();
    x.strokeStyle = "#a05840"; x.lineWidth = 1.6; x.lineCap = "round";
    x.beginPath(); x.moveTo(12, 20); x.bezierCurveTo(16, 25, 20, 18, 23, 22); x.stroke();
  };
  draws.netmeet = x => {
    /* monitor with a face + phone cord */
    x.fillStyle = "#000"; rr(x, 3, 4, 22, 18, 1.5); x.fill();
    x.fillStyle = "#cfcabb"; rr(x, 4, 5, 20, 15, 1); x.fill();
    x.fillStyle = "#3a5a80"; x.fillRect(5.5, 6.5, 17, 12);
    x.fillStyle = "#e8bc94";
    x.beginPath(); x.ellipse(14, 13, 4.5, 5, 0, 0, 7); x.fill();
    x.fillStyle = "#4a3020";
    x.beginPath(); x.ellipse(14, 9.5, 4.6, 2, 0, Math.PI, 0); x.fill();
    x.fillStyle = "#202020";
    x.fillRect(12, 12, 1.4, 1.4); x.fillRect(15, 12, 1.4, 1.4);
    x.fillRect(12.6, 15.5, 3, 1);
    x.fillStyle = "#8e8a7c"; x.fillRect(11, 22, 6, 2);
    x.fillStyle = "#cfcabb"; rr(x, 8, 24, 12, 3, 1); x.fill();
    /* green REC dot */
    x.fillStyle = "#20c020"; x.beginPath(); x.arc(21.5, 8.5, 1.4, 0, 7); x.fill();
    x.strokeStyle = "#3fae49"; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(25, 12); x.quadraticCurveTo(30, 16, 27, 24); x.stroke();
  };
  draws.hyperterm = x => {
    /* phone handset over a terminal */
    x.fillStyle = "#000"; rr(x, 4, 8, 22, 17, 1.5); x.fill();
    x.fillStyle = "#cfcabb"; rr(x, 5, 9, 20, 14, 1); x.fill();
    x.fillStyle = "#000"; x.fillRect(6.5, 10.5, 17, 10.5);
    x.fillStyle = "#001800"; x.fillRect(7, 11, 16, 9.5);
    x.fillStyle = "#30c030"; x.font = "5px monospace";
    x.fillRect(8, 12.5, 8, 1); x.fillRect(8, 15, 11, 1); x.fillRect(8, 17.5, 6, 1);
    /* handset */
    x.strokeStyle = "#c02020"; x.lineWidth = 3.6; x.lineCap = "round";
    x.beginPath(); x.moveTo(9, 5); x.quadraticCurveTo(16, 1, 23, 5); x.stroke();
    x.fillStyle = "#c02020";
    rr(x, 6, 3, 5, 5, 1.5); x.fill(); rr(x, 21, 3, 5, 5, 1.5); x.fill();
    /* curly cord */
    x.strokeStyle = "#802020"; x.lineWidth = 1;
    x.beginPath();
    for (let i = 0; i < 8; i++) x.arc(26 + (i % 2), 9 + i * 2, 1.4, 0, Math.PI, i % 2 === 0);
    x.stroke();
  };
  draws.pagecrafter = x => {
    /* page with hammer + sparkle: crafting a homepage */
    x.fillStyle = "#fff"; rr(x, 5, 3, 18, 24, 1); x.fill();
    x.strokeStyle = "#808080"; x.lineWidth = 0.8; rr(x, 5, 3, 18, 24, 1); x.stroke();
    x.fillStyle = "#3050c0"; x.fillRect(7, 5, 14, 4);
    x.strokeStyle = "#9098a8"; x.lineWidth = 1;
    for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(7, 12 + i * 3); x.lineTo(7 + [14, 11, 13, 9][i], 12 + i * 3); x.stroke(); }
    /* hammer */
    x.save();
    x.translate(21, 20); x.rotate(-0.6);
    x.fillStyle = "#8a5a20"; x.fillRect(-1.2, 0, 2.4, 10);
    x.fillStyle = "#606870"; rr(x, -5, -4, 10, 4.5, 1); x.fill();
    x.restore();
    /* sparkle */
    x.strokeStyle = "#f6d020"; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(9, 22); x.lineTo(9, 26); x.moveTo(7, 24); x.lineTo(11, 24); x.stroke();
  };
  draws.zipmaster = x => {
    /* filing cabinet squeezed in a vise — the classic compression metaphor */
    x.fillStyle = "#e8c840"; rr(x, 6, 8, 20, 17, 1.5); x.fill();
    x.strokeStyle = "#806010"; x.lineWidth = 1; rr(x, 6, 8, 20, 17, 1.5); x.stroke();
    /* zipper */
    x.strokeStyle = "#404040"; x.lineWidth = 2;
    x.beginPath(); x.moveTo(16, 8); x.lineTo(16, 25); x.stroke();
    x.fillStyle = "#404040";
    for (let i = 0; i < 5; i++) { x.fillRect(13.4, 9.5 + i * 3.4, 2.2, 1.4); x.fillRect(16.4, 9.5 + i * 3.4, 2.2, 1.4); }
    x.fillStyle = "#909090"; rr(x, 14.4, 23, 3.2, 5, 1); x.fill();
    /* vise jaws */
    x.fillStyle = "#5060a0"; x.fillRect(2, 6, 4, 21); x.fillRect(26, 6, 4, 21);
    x.fillStyle = "#7080c0"; x.fillRect(2, 6, 4, 3); x.fillRect(26, 6, 4, 3);
  };
  draws.chatterbox = x => {
    /* two speech bubbles */
    x.fillStyle = "#fff"; rr(x, 3, 5, 18, 12, 3); x.fill();
    x.strokeStyle = "#000080"; x.lineWidth = 1.2; rr(x, 3, 5, 18, 12, 3); x.stroke();
    x.fillStyle = "#fff"; x.beginPath(); x.moveTo(7, 16.5); x.lineTo(6, 21); x.lineTo(11, 16.5); x.closePath(); x.fill();
    x.strokeStyle = "#000080"; x.beginPath(); x.moveTo(7, 16.5); x.lineTo(6, 21); x.lineTo(11, 16.5); x.stroke();
    x.fillStyle = "#ffe860"; rr(x, 12, 14, 17, 11, 3); x.fill();
    x.strokeStyle = "#806000"; rr(x, 12, 14, 17, 11, 3); x.stroke();
    x.fillStyle = "#ffe860"; x.beginPath(); x.moveTo(24, 24.5); x.lineTo(26, 29); x.lineTo(20, 24.5); x.closePath(); x.fill();
    x.strokeStyle = "#806000"; x.beginPath(); x.moveTo(24, 24.5); x.lineTo(26, 29); x.lineTo(20, 24.5); x.stroke();
    x.fillStyle = "#000080"; [[7,10],[11,10],[15,10]].forEach(([px,py])=>{ x.beginPath(); x.arc(px,py,1.1,0,7); x.fill(); });
    x.fillStyle = "#806000"; [[17,19],[21,19],[25,19]].forEach(([px,py])=>{ x.beginPath(); x.arc(px,py,1.1,0,7); x.fill(); });
  };
  draws.surreal = x => {
    /* play button in a cosmic swirl */
    const g = x.createRadialGradient(16, 16, 2, 16, 16, 14);
    g.addColorStop(0, "#3050a0"); g.addColorStop(1, "#101028");
    x.fillStyle = g; x.beginPath(); x.arc(16, 16, 13.5, 0, 7); x.fill();
    x.strokeStyle = "#6080d0"; x.lineWidth = 1.4; x.beginPath(); x.arc(16, 16, 13.5, 0, 7); x.stroke();
    x.strokeStyle = "rgba(120,200,140,0.8)"; x.lineWidth = 1.6;
    x.beginPath();
    for (let a = 0; a < 4.6; a += 0.15) {
      const r2 = 3 + a * 2.1;
      const px = 16 + Math.cos(a * 1.7) * r2, py = 16 + Math.sin(a * 1.7) * r2;
      a ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.stroke();
    x.fillStyle = "#fff";
    x.beginPath(); x.moveTo(12.5, 10.5); x.lineTo(22.5, 16); x.lineTo(12.5, 21.5); x.closePath(); x.fill();
  };
  draws.magnifier = x => {
    /* magnifying glass over tiny text lines */
    x.fillStyle = "#fff"; rr(x, 3, 5, 18, 22, 1); x.fill();
    x.strokeStyle = "#808080"; x.lineWidth = 0.8; rr(x, 3, 5, 18, 22, 1); x.stroke();
    x.strokeStyle = "#9098a8"; x.lineWidth = 1;
    for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(6, 9 + i * 3); x.lineTo(18, 9 + i * 3); x.stroke(); }
    x.fillStyle = "rgba(180,220,255,0.5)";
    x.beginPath(); x.arc(18, 16, 8, 0, 7); x.fill();
    x.strokeStyle = "#204080"; x.lineWidth = 2.4;
    x.beginPath(); x.arc(18, 16, 8, 0, 7); x.stroke();
    x.strokeStyle = "#101010"; x.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(13, 13 + i * 3); x.lineTo(23, 13 + i * 3); x.stroke(); }
    x.strokeStyle = "#804010"; x.lineWidth = 3.4; x.lineCap = "round";
    x.beginPath(); x.moveTo(24, 22); x.lineTo(29, 28); x.stroke();
  };
  draws.osk = x => {
    /* small keyboard */
    x.fillStyle = "#000"; rr(x, 2, 10, 28, 14, 2); x.fill();
    x.fillStyle = vgrad(x, 11, 23, [[0, "#e8e4d8"], [1, "#b8b4a8"]]);
    rr(x, 3, 11, 26, 12, 1.5); x.fill();
    x.fillStyle = "#606060";
    for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) x.fillRect(5 + c * 3, 13 + r * 3.4, 2, 2.2);
    x.fillRect(9, 19.6, 14, 2.2);
    /* a cursor arrow hovering a key */
    x.fillStyle = "#fff"; x.strokeStyle = "#000"; x.lineWidth = 0.9;
    x.beginPath(); x.moveTo(20, 4); x.lineTo(20, 13); x.lineTo(22.6, 10.6); x.lineTo(24.6, 14); x.lineTo(26, 13); x.lineTo(24, 9.8); x.lineTo(27, 9.4); x.closePath();
    x.fill(); x.stroke();
  };
  draws.clipboard = x => {
    x.fillStyle = "#8a5a20"; rr(x, 5, 4, 22, 26, 2); x.fill();
    x.fillStyle = "#fff"; rr(x, 8, 8, 16, 19, 1); x.fill();
    x.strokeStyle = "#a0a0a0"; x.lineWidth = 0.8; rr(x, 8, 8, 16, 19, 1); x.stroke();
    x.fillStyle = "#c0c8d8"; rr(x, 11, 2, 10, 5, 1.5); x.fill();
    x.strokeStyle = "#606880"; x.lineWidth = 0.8; rr(x, 11, 2, 10, 5, 1.5); x.stroke();
    x.strokeStyle = "#7080a0"; x.lineWidth = 1;
    for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(10, 12 + i * 3); x.lineTo(10 + [12, 10, 12, 8, 11][i], 12 + i * 3); x.stroke(); }
  };
  draws.addrbook = x => {
    x.fillStyle = "#804820"; rr(x, 4, 4, 24, 24, 2); x.fill();
    x.fillStyle = "#a06030"; rr(x, 7, 4, 21, 24, 2); x.fill();
    x.fillStyle = "#f4efe0"; rr(x, 9, 6, 17, 20, 1); x.fill();
    /* tabs */
    ["#d04040", "#40a040", "#4060d0"].forEach((c, i) => { x.fillStyle = c; x.fillRect(26, 8 + i * 6, 3, 4); });
    /* little face + lines */
    x.fillStyle = "#c0a880"; x.beginPath(); x.arc(14, 12, 2.6, 0, 7); x.fill();
    x.fillStyle = "#8090b0"; x.beginPath(); x.ellipse(14, 17.5, 3.6, 2.4, 0, Math.PI, 0); x.fill();
    x.strokeStyle = "#9098a8"; x.lineWidth = 1;
    for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(19, 11 + i * 3.4); x.lineTo(24, 11 + i * 3.4); x.stroke(); }
    x.strokeStyle = "#605040"; x.lineWidth = 0.8;
    x.beginPath(); x.moveTo(9, 22); x.lineTo(25, 22); x.stroke();
  };
  draws.netpc = x => {
    /* one computer on the network: tower + monitor + a cable that leaves the frame */
    x.fillStyle = "#000"; rr(x, 4, 4, 18, 14, 1.5); x.fill();
    x.fillStyle = "#cfcabb"; rr(x, 5, 5, 16, 11, 1); x.fill();
    x.fillStyle = "#000"; x.fillRect(6.5, 6.5, 13, 8);
    x.fillStyle = vgrad(x, 7, 14, [[0, "#3f7fc0"], [1, "#9cc4ec"]]);
    x.fillRect(7, 7, 12, 7);
    x.fillStyle = "#fff"; x.fillRect(8, 8, 4, 1.4);
    x.fillStyle = "#8e8a7c"; x.fillRect(11, 18, 4, 2);
    x.fillStyle = "#cfcabb"; rr(x, 7, 20, 12, 4, 1); x.fill();
    x.strokeStyle = "#6f6a5c"; x.lineWidth = 0.8; rr(x, 7, 20, 12, 4, 1); x.stroke();
    /* network cable snaking away */
    x.strokeStyle = "#000"; x.lineWidth = 2.2;
    x.beginPath(); x.moveTo(19, 24); x.lineTo(26, 24); x.lineTo(26, 30); x.stroke();
    x.strokeStyle = "#3fae49"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(19, 24); x.lineTo(26, 24); x.lineTo(26, 30); x.stroke();
    /* link light */
    x.fillStyle = "#3fae49"; x.beginPath(); x.arc(26, 30.5, 1.6, 0, 7); x.fill();
  };
  draws.network = x => {
    function mon(cx, cy) {
      x.fillStyle = "#000"; rr(x, cx, cy, 13, 11, 1.5); x.fill();
      x.fillStyle = "#cfcabb"; rr(x, cx + 1, cy + 1, 11, 8, 1); x.fill();
      x.fillStyle = "#000"; x.fillRect(cx + 2, cy + 2, 9, 5);
      x.fillStyle = vgrad(x, cy + 2, cy + 7, [[0, "#3f7fc0"], [1, "#9cc4ec"]]);
      x.fillRect(cx + 2.5, cy + 2.5, 8, 4);
      x.fillStyle = "#8e8a7c"; x.fillRect(cx + 5, cy + 10, 3, 2);
    }
    // connection pipe
    x.strokeStyle = "#000"; x.lineWidth = 2.4;
    x.beginPath(); x.moveTo(9, 9); x.lineTo(9, 24); x.lineTo(23, 24); x.stroke();
    x.strokeStyle = "#3a6ea5"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(9, 9); x.lineTo(9, 24); x.lineTo(23, 24); x.stroke();
    mon(3, 3);
    mon(17, 18);
    // globe hint on the pipe
    x.fillStyle = "#39d24a"; x.beginPath(); x.arc(9, 16, 1.6, 0, 7); x.fill();
  };

  /* ---------- Internet Explorer (generic blue globe, not the trademarked 'e') ---------- */
  draws.ie = x => {
    x.save();
    x.translate(15.5, 15);
    // globe
    const g = x.createRadialGradient(-3, -4, 2, 0, 0, 13);
    g.addColorStop(0, "#bfe3ff"); g.addColorStop(0.5, "#3b8fd6"); g.addColorStop(1, "#0b3f7a");
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, 11, 0, 7); x.fill();
    // meridians / continents
    x.strokeStyle = "rgba(255,255,255,0.7)"; x.lineWidth = 0.8;
    x.beginPath(); x.ellipse(0, 0, 5, 11, 0, 0, 7); x.stroke();
    x.beginPath(); x.moveTo(-11, 0); x.lineTo(11, 0); x.stroke();
    x.beginPath(); x.moveTo(-9.5, -5); x.lineTo(9.5, -5); x.stroke();
    x.beginPath(); x.moveTo(-9.5, 5); x.lineTo(9.5, 5); x.stroke();
    x.fillStyle = "rgba(80,200,120,0.55)";
    x.beginPath(); x.arc(-3, -3, 2.2, 0, 7); x.fill();
    x.beginPath(); x.arc(3, 4, 1.8, 0, 7); x.fill();
    x.restore();
    // orbit swoosh (gold)
    x.strokeStyle = "#f2b21a"; x.lineWidth = 3;
    x.beginPath(); x.ellipse(15.5, 21, 13, 4.5, -0.35, Math.PI * 0.05, Math.PI * 1.15); x.stroke();
    x.strokeStyle = "#ffe07a"; x.lineWidth = 1;
    x.beginPath(); x.ellipse(15.5, 21, 13, 4.5, -0.35, Math.PI * 0.05, Math.PI * 1.15); x.stroke();
  };

  /* ---------- Recycle Bin ---------- */
  function recycle(x, full) {
    // bin body (trapezoid, translucent gray)
    x.fillStyle = "#000";
    poly(x, [[8, 10], [24, 10], [22.5, 29], [9.5, 29]]); x.fill();
    x.fillStyle = vgrad(x, 10, 29, [[0, "#dcdcdc"], [1, "#9a9a9a"]]);
    poly(x, [[9, 11], [23, 11], [21.7, 28], [10.3, 28]]); x.fill();
    // vertical ribs
    x.strokeStyle = "rgba(255,255,255,0.5)"; x.lineWidth = 0.8;
    for (let i = 1; i < 5; i++) { const px = 11 + i * 2.4; x.beginPath(); x.moveTo(px, 12), x.lineTo(px - 0.4, 27); x.stroke(); }
    x.strokeStyle = "rgba(90,90,90,0.6)"; x.lineWidth = 0.8;
    for (let i = 1; i < 5; i++) { const px = 12 + i * 2.4; x.beginPath(); x.moveTo(px, 12), x.lineTo(px - 0.4, 27); x.stroke(); }
    // recycle triangle emblem
    x.strokeStyle = "#2f8f3f"; x.lineWidth = 1.4;
    x.save(); x.translate(16, 19);
    for (let i = 0; i < 3; i++) {
      x.rotate(Math.PI * 2 / 3);
      x.beginPath(); x.arc(0, 0, 3.4, -0.6, 0.9); x.stroke();
    }
    x.restore();
    // lid
    x.fillStyle = "#000"; rr(x, 6, 7, 20, 4, 1.5); x.fill();
    x.fillStyle = vgrad(x, 7, 11, [[0, "#e6e6e6"], [1, "#b0b0b0"]]); rr(x, 7, 8, 18, 2.6, 1); x.fill();
    x.fillStyle = "#909090"; x.fillRect(14, 6, 4, 2);
    if (full) {
      // crumpled papers poking out
      x.fillStyle = "#fff"; x.strokeStyle = "#a0a0a0"; x.lineWidth = 0.7;
      poly(x, [[11, 9], [15, 3], [18, 7], [21, 4], [22, 9]]); x.fill(); x.stroke();
      x.fillStyle = "#ffe08a";
      x.beginPath(); x.moveTo(13, 8); x.lineTo(16, 4.5); x.lineTo(18, 8); x.closePath(); x.fill();
    }
  }
  draws.recycle = x => recycle(x, false);
  draws.recyclefull = x => recycle(x, true);

  /* ---------- generic paper / document ---------- */
  function paper(x, foldCol) {
    x.fillStyle = "#000";
    poly(x, [[7, 3], [21, 3], [26, 8], [26, 29], [7, 29]]); x.fill();
    x.fillStyle = "#fff";
    poly(x, [[8, 4], [20.5, 4], [25, 8.5], [25, 28], [8, 28]]); x.fill();
    // folded corner
    x.fillStyle = "#d8d8d8";
    poly(x, [[20.5, 4], [25, 8.5], [20.5, 8.5]]); x.fill();
    x.strokeStyle = "#9a9a9a"; x.lineWidth = 0.7;
    x.beginPath(); x.moveTo(20.5, 4); x.lineTo(20.5, 8.5); x.lineTo(25, 8.5); x.stroke();
    return;
  }
  draws.file = x => paper(x);
  draws.textfile = x => {
    paper(x);
    x.fillStyle = "#3a3a8a";
    for (let i = 0; i < 7; i++) x.fillRect(10, 11 + i * 2.3, i === 6 ? 7 : 13, 1);
  };
  draws.imagefile = x => {
    paper(x);
    x.fillStyle = "#000"; x.fillRect(9.5, 11, 14, 12);
    x.fillStyle = vgrad(x, 11, 23, [[0, "#8fd0ff"], [1, "#cdeeff"]]); x.fillRect(10, 12, 13, 10);
    // sun + hills
    x.fillStyle = "#ffd23a"; x.beginPath(); x.arc(13, 15, 2, 0, 7); x.fill();
    x.fillStyle = "#3f9f4f"; poly(x, [[10, 22], [15, 16], [18, 19], [20, 17], [23, 22]]); x.fill();
  };
  draws.exefile = x => {
    paper(x);
    // little app window
    x.fillStyle = "#000"; x.fillRect(9.5, 12, 14, 11);
    x.fillStyle = "#c0c0c0"; x.fillRect(10, 12.5, 13, 10);
    x.fillStyle = vgrad(x, 12, 15, [[0, "#000080"], [1, "#1084d0"]]); x.fillRect(10, 12.5, 13, 3);
    x.fillStyle = "#fff"; x.fillRect(11, 17, 8, 1); x.fillRect(11, 19, 10, 1);
  };
  draws.worddoc = x => {
    paper(x);
    x.fillStyle = "#2a5db0";
    x.font = "bold 12px Georgia, serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("W", 16.5, 19);
    x.fillStyle = "#2a5db0"; x.fillRect(9.5, 25, 15, 1.4);
  };
  draws.sheetdoc = x => {
    paper(x);
    x.strokeStyle = "#1f7a3f"; x.lineWidth = 0.7;
    for (let i = 0; i < 4; i++) x.strokeRect(9.7, 11.5 + i * 3.4, 14.6, 3.4);
    x.beginPath(); x.moveTo(14.5, 11.5); x.lineTo(14.5, 25); x.moveTo(19.5, 11.5); x.lineTo(19.5, 25); x.stroke();
    x.fillStyle = "rgba(31,122,63,0.25)"; x.fillRect(9.7, 11.5, 4.8, 3.4);
  };
  draws.slidesdoc = x => {
    paper(x);
    x.fillStyle = "#c86a1f"; x.fillRect(10, 12, 13, 8);
    x.fillStyle = "#fff"; x.fillRect(11, 13, 11, 1.4); x.fillRect(11, 16, 7, 1);
    x.fillStyle = "#c86a1f"; x.fillRect(10, 22, 13, 1);
  };

  /* ---------- Notepad ---------- */
  draws.notepad = x => {
    x.fillStyle = "#000"; x.fillRect(6, 3, 20, 26);
    x.fillStyle = "#fff"; x.fillRect(7, 4, 18, 24);
    // spiral top
    x.fillStyle = "#8a8a8a";
    for (let i = 0; i < 8; i++) x.fillRect(8 + i * 2.2, 2, 1.4, 4);
    x.fillStyle = "#000";
    for (let i = 0; i < 8; i++) x.fillRect(8.4 + i * 2.2, 3, 0.7, 2);
    // ruled lines
    x.fillStyle = "#b7b7d8"; for (let i = 0; i < 8; i++) x.fillRect(9, 9 + i * 2.3, 14, 1);
    x.fillStyle = "#e0a0a0"; x.fillRect(11, 8, 1, 20);
  };

  /* ---------- Paint ---------- */
  draws.paint = x => {
    // palette
    x.fillStyle = "#000";
    x.beginPath(); x.ellipse(13, 17, 11, 9, -0.2, 0, 7); x.fill();
    x.fillStyle = "#f0e8d8";
    x.beginPath(); x.ellipse(13, 17, 9.6, 7.8, -0.2, 0, 7); x.fill();
    // thumb hole
    x.fillStyle = "#c8bfa8";
    x.beginPath(); x.ellipse(16, 20, 2.4, 1.8, -0.2, 0, 7); x.fill();
    // paint blobs
    const blobs = [["#e01f1f", 8, 12], ["#f0c000", 13, 10.5], ["#1f7fe0", 18, 12.5], ["#1fb04f", 8.5, 18], ["#8f2fc0", 18, 18]];
    blobs.forEach(b => { x.fillStyle = b[0]; x.beginPath(); x.arc(b[1], b[2], 2, 0, 7); x.fill(); });
    // brush
    x.strokeStyle = "#000"; x.lineWidth = 0;
    x.save(); x.translate(20, 22); x.rotate(-0.9);
    x.fillStyle = "#a06a2a"; x.fillRect(-1, -14, 2.4, 12); // handle
    x.fillStyle = "#c0c0c0"; x.fillRect(-1.4, -3, 3.2, 3); // ferrule
    x.fillStyle = "#1f7fe0"; poly(x, [[-1.4, 0], [1.8, 0], [1, 4], [-0.6, 4]]); x.fill(); // bristle w/ paint
    x.restore();
  };

  /* ---------- Calculator ---------- */
  draws.calc = x => {
    panel(x, 5, 2, 22, 28, "#d8d4c8", "#fff", "#8a8678");
    x.fillStyle = "#000"; x.fillRect(7, 4, 18, 6);
    x.fillStyle = "#9ec89e"; x.fillRect(8, 5, 16, 4); // LCD
    x.fillStyle = "#1a3a1a"; x.font = "bold 4px 'Courier New'"; x.textAlign = "right"; x.textBaseline = "middle";
    x.fillText("1998.", 23, 7.2);
    const cols = ["#c04040", "#4040c0", "#404040", "#308030"];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      panel(x, 7 + c * 4.6, 12 + r * 4.4, 4, 3.8, "#e8e4d8", "#fff", "#9a968a");
      x.fillStyle = cols[c]; x.fillRect(8.4 + c * 4.6, 13.4 + r * 4.4, 1.2, 1.2);
    }
  };

  /* ---------- Minesweeper ---------- */
  draws.minesweeper = x => {
    panel(x, 4, 4, 24, 24, "#c0c0c0", "#fff", "#808080");
    // mine
    x.fillStyle = "#000"; x.beginPath(); x.arc(16, 16, 7, 0, 7); x.fill();
    x.lineWidth = 1.6; x.strokeStyle = "#000";
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      x.beginPath(); x.moveTo(16 + Math.cos(a) * 6, 16 + Math.sin(a) * 6);
      x.lineTo(16 + Math.cos(a) * 10, 16 + Math.sin(a) * 10); x.stroke();
    }
    x.fillStyle = "#fff"; x.beginPath(); x.arc(13.5, 13.5, 1.6, 0, 7); x.fill();
    // little red flag corner
    x.fillStyle = "#e01f1f"; poly(x, [[22, 6], [27, 8], [22, 10]]); x.fill();
    x.strokeStyle = "#000"; x.lineWidth = 1; x.beginPath(); x.moveTo(22, 6); x.lineTo(22, 12); x.stroke();
  };

  /* ---------- Solitaire ---------- */
  draws.solitaire = x => {
    function card(cx, cy, rot, sym, red) {
      x.save(); x.translate(cx, cy); x.rotate(rot);
      x.fillStyle = "#000"; rr(x, -8, -11, 16, 22, 2); x.fill();
      x.fillStyle = "#fff"; rr(x, -7, -10, 14, 20, 1.5); x.fill();
      x.fillStyle = red ? "#c00000" : "#000";
      x.font = "bold 6px Arial"; x.textAlign = "left"; x.textBaseline = "top";
      x.fillText(sym, -6, -9.5);
      x.font = "10px Arial"; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText(red ? "♥" : "♠", 0, 1);
      x.restore();
    }
    card(11, 17, -0.15, "A", false);
    card(19, 16, 0.12, "K", true);
  };

  /* ---------- MS-DOS ---------- */
  draws.dos = x => {
    panel(x, 4, 4, 24, 20, "#c0c0c0", "#e8e8e8", "#808080");
    x.fillStyle = "#000"; x.fillRect(6, 6, 20, 16);
    x.fillStyle = "#c0c0c0"; x.font = "6px 'Courier New'"; x.textAlign = "left"; x.textBaseline = "top";
    x.fillText("C:\\>", 7, 7);
    x.fillStyle = "#c0c0c0"; x.fillRect(16, 8, 4, 1);
    // stand
    x.fillStyle = "#000"; x.fillRect(13, 24, 6, 2);
    x.fillStyle = "#a0a0a0"; x.fillRect(8, 26, 16, 3);
    panel(x, 8, 26, 16, 3, "#c0c0c0", "#e8e8e8", "#808080");
  };

  /* ---------- Help ---------- */
  draws.help = x => {
    x.fillStyle = "#000"; rr(x, 6, 4, 20, 24, 2); x.fill();
    x.fillStyle = vgrad(x, 4, 28, [[0, "#f0d000"], [1, "#d0a000"]]); rr(x, 7, 5, 18, 22, 1.5); x.fill();
    x.fillStyle = "#7a1010";
    x.font = "bold 18px Arial"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("?", 16, 16);
  };

  /* ---------- Find (magnifier over page) ---------- */
  draws.find = x => {
    x.fillStyle = "#000"; x.fillRect(6, 4, 15, 20);
    x.fillStyle = "#fff"; x.fillRect(7, 5, 13, 18);
    x.fillStyle = "#b0b0d0"; for (let i = 0; i < 5; i++) x.fillRect(9, 8 + i * 2.6, 9, 1);
    // magnifier
    x.strokeStyle = "#000"; x.lineWidth = 2.6;
    x.beginPath(); x.arc(19, 18, 6, 0, 7); x.stroke();
    x.strokeStyle = "#7fd0ff"; x.lineWidth = 1.4; x.beginPath(); x.arc(19, 18, 5, 0, 7); x.stroke();
    x.fillStyle = "rgba(180,220,255,0.5)"; x.beginPath(); x.arc(19, 18, 5, 0, 7); x.fill();
    x.strokeStyle = "#000"; x.lineWidth = 3; x.beginPath(); x.moveTo(23, 22); x.lineTo(28, 27); x.stroke();
  };

  /* ---------- Run ---------- */
  draws.run = x => {
    panel(x, 4, 7, 24, 18, "#c0c0c0", "#fff", "#808080");
    x.fillStyle = vgrad(x, 7, 12, [[0, "#000080"], [1, "#1084d0"]]); x.fillRect(5, 8, 22, 4);
    x.fillStyle = "#fff"; x.fillRect(6, 9.4, 8, 1);
    x.fillStyle = "#fff"; panel(x, 7, 14, 14, 4, "#fff", "#808080", "#fff");
    x.fillStyle = "#000"; x.font = "5px 'Courier New'"; x.textBaseline = "middle"; x.textAlign = "left";
    x.fillText("cmd_", 8, 16.2);
    // green go arrow
    x.fillStyle = "#308030"; poly(x, [[22, 14], [26, 16.5], [22, 19]]); x.fill();
  };

  /* ---------- Settings / Control Panel ---------- */
  draws.settings = x => {
    // gear
    x.save(); x.translate(12, 13);
    x.fillStyle = "#8a8a9a";
    for (let i = 0; i < 8; i++) { x.rotate(Math.PI / 4); x.fillRect(-1.6, -9, 3.2, 4); }
    x.beginPath(); x.arc(0, 0, 6.5, 0, 7); x.fill();
    x.fillStyle = "#c0c0d0"; x.beginPath(); x.arc(0, 0, 5, 0, 7); x.fill();
    x.fillStyle = "#5a5a6a"; x.beginPath(); x.arc(0, 0, 2.4, 0, 7); x.fill();
    x.restore();
    // hammer crossing
    x.save(); x.translate(21, 21); x.rotate(0.6);
    x.fillStyle = "#9a6a2a"; x.fillRect(-1, -2, 2, 11);
    x.fillStyle = "#a0a0a0"; x.fillRect(-4, -6, 8, 5);
    x.fillStyle = "#d0d0d0"; x.fillRect(-4, -6, 8, 1.5);
    x.restore();
  };

  /* ---------- Display properties ---------- */
  draws.display = x => {
    computerBox(x);
    // color swatches on the screen
    x.fillStyle = "#e01f1f"; x.fillRect(9, 7, 4, 3);
    x.fillStyle = "#f0c000"; x.fillRect(13, 7, 4, 3);
    x.fillStyle = "#1fb04f"; x.fillRect(9, 10, 4, 3);
    x.fillStyle = "#1f7fe0"; x.fillRect(13, 10, 4, 3);
  };

  /* ---------- Date/Time ---------- */
  draws.datetime = x => {
    x.fillStyle = "#000"; x.beginPath(); x.arc(16, 16, 13, 0, 7); x.fill();
    x.fillStyle = "#fff"; x.beginPath(); x.arc(16, 16, 11.5, 0, 7); x.fill();
    x.strokeStyle = "#000"; x.lineWidth = 1;
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; x.beginPath(); x.moveTo(16 + Math.cos(a) * 10, 16 + Math.sin(a) * 10); x.lineTo(16 + Math.cos(a) * 8.6, 16 + Math.sin(a) * 8.6); x.stroke(); }
    x.strokeStyle = "#000080"; x.lineWidth = 1.6; x.beginPath(); x.moveTo(16, 16); x.lineTo(16, 9); x.stroke();
    x.lineWidth = 1.2; x.beginPath(); x.moveTo(16, 16); x.lineTo(22, 18); x.stroke();
    x.fillStyle = "#c00000"; x.beginPath(); x.arc(16, 16, 1.3, 0, 7); x.fill();
  };

  /* ---------- Sounds (speaker) ---------- */
  draws.sounds = x => {
    x.fillStyle = "#c0a020"; poly(x, [[6, 13], [11, 13], [16, 8], [16, 24], [11, 19], [6, 19]]); x.fill();
    x.strokeStyle = "#000"; x.lineWidth = 1; poly(x, [[6, 13], [11, 13], [16, 8], [16, 24], [11, 19], [6, 19]]); x.stroke();
    x.strokeStyle = "#1f7fe0"; x.lineWidth = 1.6;
    [4, 7, 10].forEach((r, i) => { x.beginPath(); x.arc(17, 16, r + 2, -0.7, 0.7); x.stroke(); });
  };

  /* ---------- System ---------- */
  draws.system = x => {
    computerBox(x);
    x.fillStyle = "#39d24a"; x.font = "bold 7px 'Courier New'"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillStyle = "#dfe8ff"; x.fillRect(9, 7, 13, 1); x.fillRect(9, 9, 10, 1); x.fillRect(9, 11, 12, 1);
  };

  /* ---------- Shutdown / Log Off ---------- */
  draws.shutdown = x => {
    computerBox(x);
    x.fillStyle = "#000080"; x.font = "bold 8px Arial"; x.textAlign = "center"; x.textBaseline = "middle";
    // power symbol on screen
    x.strokeStyle = "#e01f1f"; x.lineWidth = 1.6;
    x.beginPath(); x.arc(15.5, 10.5, 3.2, -1.0, 4.2); x.stroke();
    x.beginPath(); x.moveTo(15.5, 6); x.lineTo(15.5, 10); x.stroke();
  };
  draws.logoff = x => {
    // key
    x.fillStyle = "#f0c000"; x.strokeStyle = "#a07800"; x.lineWidth = 0.8;
    x.beginPath(); x.arc(11, 11, 5, 0, 7); x.fill(); x.stroke();
    x.fillStyle = "#fff"; x.beginPath(); x.arc(11, 11, 2, 0, 7); x.fill();
    x.fillStyle = "#f0c000"; x.fillRect(13, 13, 12, 3);
    x.fillRect(21, 16, 2, 3); x.fillRect(24, 16, 2, 4);
    x.strokeRect(13.5, 13.5, 11, 2);
  };

  /* ---------- drives ---------- */
  draws.drivec = x => {
    panel(x, 3, 9, 26, 15, "#cfcabb", "#efeada", "#8e8a7c");
    x.fillStyle = "#8e8a7c"; x.fillRect(5, 12, 15, 1.4); x.fillRect(5, 15, 12, 1.4);
    x.fillStyle = "#39d24a"; x.fillRect(24, 20, 2.5, 1.5);
    x.fillStyle = "#000"; x.font = "bold 6px Tahoma"; x.textAlign = "left"; x.textBaseline = "middle";
    // label plate
    panel(x, 5, 18, 12, 4, "#e8e4d8", "#fff", "#9a968a");
    x.fillStyle = "#2a2a6a"; x.fillText("(C:)", 6.5, 20.4);
  };
  draws.floppy = x => {
    x.fillStyle = "#2b3a6b"; rr(x, 4, 4, 24, 24, 1.5); x.fill();
    x.fillStyle = "#3a4f8f"; x.fillRect(4, 4, 24, 3);
    // shutter
    x.fillStyle = "#c8ccd8"; x.fillRect(17, 5, 8, 11);
    x.fillStyle = "#8a8f9c"; x.fillRect(20, 5, 3, 11);
    // label
    x.fillStyle = "#e8e8e0"; x.fillRect(7, 17, 18, 9);
    x.fillStyle = "#b0b0a8"; x.fillRect(8, 18, 16, 2);
    x.fillStyle = "#c00000"; x.fillRect(8, 21, 16, 1);
  };
  draws.cdrom = x => {
    const g = x.createRadialGradient(16, 16, 3, 16, 16, 13);
    g.addColorStop(0, "#e8e8f0"); g.addColorStop(0.4, "#a0d0e0"); g.addColorStop(0.6, "#c0a0e0"); g.addColorStop(0.8, "#e0c090"); g.addColorStop(1, "#90b0d0");
    x.fillStyle = "#000"; x.beginPath(); x.arc(16, 16, 13, 0, 7); x.fill();
    x.fillStyle = g; x.beginPath(); x.arc(16, 16, 12.5, 0, 7); x.fill();
    x.fillStyle = "#fff"; x.globalAlpha = 0.4; poly(x, [[10, 5], [15, 6], [8, 15], [6, 12]]); x.fill(); x.globalAlpha = 1;
    x.fillStyle = "#000"; x.beginPath(); x.arc(16, 16, 4, 0, 7); x.fill();
    x.fillStyle = "#d8d8e0"; x.beginPath(); x.arc(16, 16, 2.4, 0, 7); x.fill();
  };

  /* ---------- Volume (tray speaker) ---------- */
  draws.volume = x => {
    x.fillStyle = "#000"; poly(x, [[3, 12], [7, 12], [11, 8], [11, 24], [7, 20], [3, 20]]); x.fill();
    x.fillStyle = "#d0d0d0"; poly(x, [[4, 13], [7, 13], [10.5, 9.5], [10.5, 22.5], [7, 19], [4, 19]]); x.fill();
    x.strokeStyle = "#000"; x.lineWidth = 1.4;
    [3, 6].forEach(r => { x.beginPath(); x.arc(12, 16, r + 3, -0.7, 0.7); x.stroke(); });
  };

  /* ---------- Start flag ---------- */
  draws.startflag = x => {
    x.save(); x.translate(2, 3); x.scale(0.92, 0.92);
    // waving flag, 4 quadrants
    const wave = (cx, cy, w, h, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(cx, cy + 1); x.quadraticCurveTo(cx + w / 2, cy - 1.5, cx + w, cy + 1); x.lineTo(cx + w, cy + h + 1); x.quadraticCurveTo(cx + w / 2, cy + h - 1.5, cx, cy + h + 1); x.closePath(); x.fill(); };
    wave(3, 2, 9, 8, "#e83030");
    wave(13, 2, 9, 8, "#3faf3f");
    wave(3, 12, 9, 8, "#3f7fe8");
    wave(13, 12, 9, 8, "#f0c000");
    // pole
    x.fillStyle = "#909090"; x.fillRect(1.5, 2, 1.6, 24);
    x.restore();
  };

  /* ================= Office & multimedia apps ================= */
  draws.writer = x => {
    x.fillStyle = "#000"; rr(x, 5, 3, 22, 26, 2); x.fill();
    x.fillStyle = vgrad(x, 3, 29, [[0, "#4a86e8"], [1, "#1a56b0"]]); rr(x, 6, 4, 20, 24, 1.5); x.fill();
    x.fillStyle = "#fff"; x.font = "bold 18px Georgia, 'Times New Roman', serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("W", 16, 16);
    // page corner
    x.fillStyle = "#fff"; x.globalAlpha = 0.9; poly(x, [[20, 4], [26, 4], [26, 10]]); x.fill(); x.globalAlpha = 1;
    x.fillStyle = "#1a56b0"; poly(x, [[20, 4], [26, 10], [20, 10]]); x.fill();
  };
  draws.sheet = x => {
    x.fillStyle = "#000"; rr(x, 5, 3, 22, 26, 2); x.fill();
    x.fillStyle = vgrad(x, 3, 29, [[0, "#3fae5f"], [1, "#1a7a3a"]]); rr(x, 6, 4, 20, 24, 1.5); x.fill();
    // grid
    x.strokeStyle = "rgba(255,255,255,0.55)"; x.lineWidth = 0.8;
    for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(6, 4 + i * 6); x.lineTo(26, 4 + i * 6); x.stroke(); x.beginPath(); x.moveTo(6 + i * 5, 4); x.lineTo(6 + i * 5, 28); x.stroke(); }
    x.fillStyle = "#fff"; x.font = "bold 15px Georgia, serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("X", 16, 16.5);
  };
  draws.slides = x => {
    x.fillStyle = "#000"; rr(x, 5, 3, 22, 26, 2); x.fill();
    x.fillStyle = vgrad(x, 3, 29, [[0, "#e88a2a"], [1, "#b85a10"]]); rr(x, 6, 4, 20, 24, 1.5); x.fill();
    x.fillStyle = "#fff"; x.font = "bold 15px Georgia, serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("P", 16, 16.5);
    x.fillStyle = "rgba(255,255,255,0.85)"; x.fillRect(9, 20, 14, 5);
    x.strokeStyle = "#b85a10"; x.lineWidth = 0.8; x.strokeRect(9.4, 20.4, 13.2, 4.2);
  };
  draws.wordpad = x => {
    paper(x);
    // pen over page
    x.fillStyle = "#3a3a8a"; for (let i = 0; i < 4; i++) x.fillRect(10, 10 + i * 2.3, 12, 1);
    x.save(); x.translate(19, 19); x.rotate(0.7);
    x.fillStyle = "#f0c000"; x.fillRect(-1.2, -10, 2.6, 12);
    x.fillStyle = "#404040"; poly(x, [[-1.2, 2], [1.4, 2], [0.1, 6]]); x.fill();
    x.restore();
  };
  draws.mediaplayer = x => {
    panel(x, 4, 4, 24, 24, "#c0c0c0", "#fff", "#808080");
    x.fillStyle = "#000"; x.fillRect(6, 6, 20, 13);
    x.fillStyle = vgrad(x, 6, 19, [[0, "#103050"], [1, "#2060a0"]]); x.fillRect(7, 7, 18, 11);
    // play triangle
    x.fillStyle = "#40e0ff"; poly(x, [[13, 9], [20, 12.5], [13, 16]]); x.fill();
    // transport buttons
    for (let i = 0; i < 4; i++) panel(x, 6 + i * 5, 21, 4, 4, "#d0d0d0", "#fff", "#808080");
    x.fillStyle = "#000"; poly(x, [[7, 22], [9.5, 23], [7, 24]]); x.fill();
  };
  draws.cdplayer = x => {
    draws.cdrom(x);
    x.fillStyle = "#000"; x.globalAlpha = 0.85; poly(x, [[14, 14], [20, 16], [14, 18]]); x.fill(); x.globalAlpha = 1;
    x.fillStyle = "#40e0ff"; poly(x, [[14.5, 14.6], [19, 16], [14.5, 17.4]]); x.fill();
  };
  draws.charmap = x => {
    panel(x, 4, 4, 24, 24, "#fff", "#808080", "#fff");
    x.fillStyle = "#000"; x.font = "7px 'Times New Roman'"; x.textAlign = "center"; x.textBaseline = "middle";
    const chars = ["A", "b", "@", "&", "Ω", "π", "$", "é", "?"];
    let k = 0;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      x.strokeStyle = "#c0c0c0"; x.lineWidth = 0.6; x.strokeRect(5 + c * 7.3, 5 + r * 7.3, 7.3, 7.3);
      x.fillText(chars[k++], 8.7 + c * 7.3, 9 + r * 7.3);
    }
    x.strokeStyle = "#000080"; x.lineWidth = 1.2; x.strokeRect(5, 5, 7.3, 7.3);
  };
  draws.explorerapp = x => {
    // folder with magnifier-free explorer look = open folder + doc
    folderBody(x, true);
  };

  draws.freecell = x => {
    // king card over a green baize with a free-cell outline
    x.fillStyle = "#008000"; x.fillRect(1, 3, 30, 26);
    x.strokeStyle = "#005700"; x.lineWidth = 1;
    x.strokeRect(3.5, 5.5, 10, 14);
    x.fillStyle = "#000"; rr(x, 12, 6, 15, 21, 2); x.fill();
    x.fillStyle = "#fff"; rr(x, 13, 7, 13, 19, 1.5); x.fill();
    x.fillStyle = "#c00000";
    x.font = "bold 7px Arial"; x.textAlign = "left"; x.textBaseline = "top";
    x.fillText("K", 14.5, 8);
    x.font = "11px Arial"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("♦", 19.5, 18);
  };
  draws.defrag = x => {
    // drive with a grid of defrag blocks
    panel(x, 2, 3, 28, 10, "#c0c0c0", "#ffffff", "#606060");
    x.fillStyle = "#00c000"; x.fillRect(25, 7, 3, 2);
    const cols = ["#0000a8", "#00a8f0", "#f00000", "#ffffff"];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) {
      x.fillStyle = cols[(c + r * 3) % 4];
      x.fillRect(3 + c * 3.4, 16 + r * 4.4, 3, 3.6);
    }
    outlineRect(x, 2, 15, 28, 14, "#404040");
  };
  draws.scandisk = x => {
    // drive being examined by a magnifier
    panel(x, 2, 6, 28, 11, "#c0c0c0", "#ffffff", "#606060");
    x.fillStyle = "#00c000"; x.fillRect(25, 10, 3, 2);
    x.fillStyle = "#808080"; x.fillRect(5, 10, 14, 2);
    x.strokeStyle = "#000080"; x.lineWidth = 2.4;
    x.beginPath(); x.arc(13, 17, 7, 0, Math.PI * 2); x.stroke();
    x.fillStyle = "rgba(160,208,255,0.55)";
    x.beginPath(); x.arc(13, 17, 6, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "#000060"; x.lineWidth = 3; x.lineCap = "round";
    x.beginPath(); x.moveTo(18.5, 22); x.lineTo(26, 29); x.stroke();
  };
  draws.dialup = x => {
    // two linked computers over a phone line — dial-up networking
    const mon = (X, Y) => {
      panel(x, X, Y, 13, 10, "#c0c0c0", "#ffffff", "#606060");
      x.fillStyle = "#008080"; x.fillRect(X + 2, Y + 2, 9, 6);
      x.fillStyle = "#c0c0c0"; x.fillRect(X + 4, Y + 10, 5, 2);
      x.strokeStyle = "#404040"; x.strokeRect(X + 0.5, Y + 0.5, 12, 9);
    };
    mon(1, 2);
    mon(18, 15);
    x.strokeStyle = "#c00000"; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(8, 13); x.bezierCurveTo(8, 22, 24, 8, 24, 15); x.stroke();
    x.fillStyle = "#00e000"; x.fillRect(4, 4, 3, 2); x.fillRect(21, 17, 3, 2);
  };

  draws.printer = x => {
    // inkjet printer with a sheet feeding out
    x.fillStyle = "#e8e8e8"; x.fillRect(9, 4, 14, 8);          // paper in tray
    x.strokeStyle = "#909090"; x.lineWidth = 1; x.strokeRect(9.5, 4.5, 13, 7);
    x.fillStyle = "#d8dce0"; rr(x, 3, 11, 26, 13, 2); x.fill(); // body
    x.strokeStyle = "#606060"; x.stroke();
    x.fillStyle = "#b8bcc0"; x.fillRect(3, 11, 26, 3);
    x.fillStyle = "#00a000"; x.fillRect(24, 15, 2.4, 2.4);     // power led
    x.fillStyle = "#303030"; x.fillRect(7, 15, 10, 2);         // slot
    x.fillStyle = "#fff"; x.fillRect(8, 22, 16, 8);            // output sheet
    x.strokeStyle = "#a0a0a0"; x.strokeRect(8.5, 22.5, 15, 7);
    x.strokeStyle = "#c8c8c8"; x.beginPath(); x.moveTo(10, 25); x.lineTo(22, 25); x.moveTo(10, 27); x.lineTo(20, 27); x.stroke();
  };
  draws.stackz = x => {
    x.fillStyle = "#101018"; rr(x, 2, 2, 28, 28, 2); x.fill();
    const cols = ["#e04040", "#40c0e0", "#e0c040", "#40c040", "#b060e0"];
    const blk = (c, r, ci) => {
      x.fillStyle = cols[ci % cols.length];
      x.fillRect(c * 6 + 4, r * 6 + 4, 5, 5);
      x.fillStyle = "rgba(255,255,255,0.4)"; x.fillRect(c * 6 + 4, r * 6 + 4, 5, 1);
    };
    blk(1, 0, 1); blk(0, 1, 0); blk(1, 1, 0); blk(2, 1, 0);
    blk(0, 3, 2); blk(1, 3, 2); blk(3, 3, 3); blk(0, 2, 4);
  };
  draws.encarta = x => {
    // multimedia encyclopedia CD + book
    x.fillStyle = "#1a3a7a"; rr(x, 4, 3, 22, 26, 2); x.fill();
    x.strokeStyle = "#0a1a3a"; x.lineWidth = 1; x.stroke();
    x.fillStyle = "#3a5aaa"; x.fillRect(6, 3, 3, 26);          // spine
    x.fillStyle = "#e8e0c0"; x.fillRect(10, 6, 13, 20);        // pages
    const g = x.createRadialGradient(20, 20, 1, 20, 20, 8);
    g.addColorStop(0, "#fff"); g.addColorStop(0.5, "#a0d0ff"); g.addColorStop(0.7, "#e0a0ff"); g.addColorStop(1, "#80c0e0");
    x.fillStyle = g;
    x.beginPath(); x.arc(20, 20, 8, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "#6080a0"; x.stroke();
    x.fillStyle = "#101018"; x.beginPath(); x.arc(20, 20, 2, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#ffd800"; x.font = "bold 7px Arial"; x.fillText("i", 12, 14);
  };
  draws.catpage = x => {
    // pixel cat face (Pixel the cat)
    x.fillStyle = "#f0f0f0"; rr(x, 2, 2, 28, 28, 3); x.fill();
    x.fillStyle = "#f4a840";                                    // orange tabby
    poly(x, [[8, 12], [10, 6], [13, 11]]); x.fill();           // ears
    poly(x, [[24, 12], [22, 6], [19, 11]]); x.fill();
    x.beginPath(); x.arc(16, 18, 9, 0, Math.PI * 2); x.fill();  // head
    x.strokeStyle = "#c07818"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(11, 15); x.lineTo(13, 16); x.moveTo(21, 15); x.lineTo(19, 16); x.stroke();
    x.fillStyle = "#204020";                                    // eyes
    x.beginPath(); x.arc(13, 17, 1.8, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(19, 17, 1.8, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#e07080"; x.beginPath(); x.arc(16, 20, 1.3, 0, Math.PI * 2); x.fill();  // nose
    x.strokeStyle = "#a06010";                                  // whiskers
    x.beginPath(); x.moveTo(8, 19); x.lineTo(13, 20); x.moveTo(8, 22); x.lineTo(13, 21);
    x.moveTo(24, 19); x.lineTo(19, 20); x.moveTo(24, 22); x.lineTo(19, 21); x.stroke();
  };

  draws.pinball = x => {
    // table corner: ball, bumper, flipper on deep blue
    x.fillStyle = "#0a0a2a"; rr(x, 2, 2, 28, 28, 3); x.fill();
    x.strokeStyle = "#000"; x.lineWidth = 1; x.stroke();
    x.fillStyle = "#283060";
    [[6, 6], [22, 9], [12, 24], [26, 20]].forEach(([px, py]) => x.fillRect(px, py, 2, 2));
    const g = x.createRadialGradient(19, 8, 1, 21, 10, 6);
    g.addColorStop(0, "#fff"); g.addColorStop(0.4, "#e04040"); g.addColorStop(1, "#400808");
    x.fillStyle = g;
    x.beginPath(); x.arc(21, 10, 6, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "#ffb0b0"; x.lineWidth = 1; x.stroke();
    const bg = x.createRadialGradient(9, 15, 1, 10, 16, 4);
    bg.addColorStop(0, "#fff"); bg.addColorStop(1, "#707888");
    x.fillStyle = bg;
    x.beginPath(); x.arc(10, 16, 4, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "#f0f0f0"; x.lineWidth = 3.4; x.lineCap = "round";
    x.beginPath(); x.moveTo(6, 27); x.lineTo(16, 23); x.stroke();
    x.beginPath(); x.moveTo(26, 27); x.lineTo(18, 23); x.stroke();
  };
  draws.ski = x => {
    // skier on a slope
    x.fillStyle = "#eef4ff"; rr(x, 2, 2, 28, 28, 3); x.fill();
    x.strokeStyle = "#8090a8"; x.lineWidth = 1; x.stroke();
    x.fillStyle = "#1c6e2c";
    poly(x, [[7, 12], [3.5, 19], [10.5, 19]]); x.fill();
    x.fillStyle = "#6b4a2b"; x.fillRect(6.4, 19, 1.4, 2.5);
    x.fillStyle = "#2050c0"; x.fillRect(17, 12, 6, 8);
    x.fillStyle = "#ffcc99";
    x.beginPath(); x.arc(20, 9.5, 3, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#e04040"; x.fillRect(17, 5.5, 6, 3);
    x.strokeStyle = "#c02020"; x.lineWidth = 1.8;
    x.beginPath(); x.moveTo(13, 24); x.lineTo(27, 20); x.stroke();
    x.beginPath(); x.moveTo(13, 27); x.lineTo(27, 23); x.stroke();
  };
  draws.wallball = x => {
    x.fillStyle = "#000"; rr(x, 2, 2, 28, 28, 2); x.fill();
    x.fillStyle = "#20488c";
    x.fillRect(2, 2, 28, 5); x.fillRect(2, 2, 5, 28); x.fillRect(2, 25, 28, 5);
    x.fillStyle = "#d03030"; x.fillRect(15, 7, 3, 18);
    [[11, 14, "#e0e0ff"], [24, 12, "#e0e0ff"], [23, 21, "#e0e0ff"]].forEach(([bx, by]) => {
      const g = x.createRadialGradient(bx - 1, by - 1, 0.5, bx, by, 3.6);
      g.addColorStop(0, "#fff"); g.addColorStop(1, "#5060c0");
      x.fillStyle = g;
      x.beginPath(); x.arc(bx, by, 3.6, 0, Math.PI * 2); x.fill();
    });
  };
  draws.worm = x => {
    x.fillStyle = "#000"; rr(x, 2, 2, 28, 28, 2); x.fill();
    x.strokeStyle = "#a00000"; x.lineWidth = 2; x.strokeRect(3.5, 3.5, 25, 25);
    x.fillStyle = "#00c000";
    [[8, 22], [11, 22], [14, 22], [14, 19], [14, 16], [17, 16], [20, 16], [20, 13], [20, 10]].forEach(([c, r]) =>
      x.fillRect(c, r, 2.6, 2.6));
    x.fillStyle = "#80ff80"; x.fillRect(20, 10, 2.6, 2.6);
    x.fillStyle = "#ffff00"; x.font = "bold 8px 'Courier New',monospace";
    x.fillText("7", 8, 12);
  };

  draws.pal = x => {
    // geometric flower — the universal "someone wants to chat" mark
    const petals = [[16, 7], [24, 11], [25, 20], [16, 25], [7, 20], [8, 11]];
    const cols = ["#e03030", "#f0a020", "#40b040", "#3070e0", "#8040c0", "#e06090"];
    petals.forEach(([cx, cy], i) => {
      x.fillStyle = cols[i];
      x.beginPath(); x.arc(cx, cy, 5.4, 0, Math.PI * 2); x.fill();
      x.strokeStyle = "rgba(0,0,0,0.45)"; x.lineWidth = 0.8; x.stroke();
    });
    x.fillStyle = "#ffe860";
    x.beginPath(); x.arc(16, 16, 5.6, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "#806000"; x.lineWidth = 1; x.stroke();
  };
  draws.megaamp = x => {
    // compact dark player faceplate with a bolt
    x.fillStyle = "#20242c"; rr(x, 2, 6, 28, 20, 2); x.fill();
    x.strokeStyle = "#000"; x.lineWidth = 1; x.stroke();
    x.fillStyle = "#3a4150"; x.fillRect(4, 8, 24, 4);
    x.fillStyle = "#00e000"; x.font = "bold 4px monospace";
    x.fillRect(5, 9, 10, 2);
    // spectrum bars
    [4, 9, 6, 12, 8, 11, 5].forEach((h, i) => {
      x.fillStyle = "#00d000";
      x.fillRect(5 + i * 3.2, 24 - h, 2.2, h);
    });
    // bolt
    x.fillStyle = "#ffd800";
    poly(x, [[20, 7], [26, 7], [22.5, 13], [27, 13], [18.5, 24], [21.5, 15], [17.5, 15]]);
    x.fill();
    x.strokeStyle = "#805800"; x.lineWidth = 0.7; x.stroke();
  };
  draws.netgrab = x => {
    // globe with a fat download arrow
    const g = x.createRadialGradient(13, 11, 2, 14, 13, 11);
    g.addColorStop(0, "#7fd4ff"); g.addColorStop(1, "#1560b0");
    x.fillStyle = g;
    x.beginPath(); x.arc(14, 13, 10, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "#0a3a70"; x.lineWidth = 1; x.stroke();
    x.strokeStyle = "rgba(255,255,255,0.75)"; x.lineWidth = 0.9;
    x.beginPath(); x.ellipse(14, 13, 10, 4, 0, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.ellipse(14, 13, 5, 9.6, 0, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(4, 13); x.lineTo(24, 13); x.stroke();
    x.fillStyle = "#00c000";
    poly(x, [[21, 16], [27, 16], [27, 22], [30, 22], [24, 29], [18, 22], [21, 22]]);
    x.fill();
    x.strokeStyle = "#005000"; x.lineWidth = 1; x.stroke();
  };
  draws.shield = x => {
    // antivirus shield with a check
    const g = x.createLinearGradient(0, 4, 0, 28);
    g.addColorStop(0, "#e05050"); g.addColorStop(1, "#901010");
    x.fillStyle = g;
    poly(x, [[16, 3], [28, 7], [28, 16], [16, 29], [4, 16], [4, 7]]);
    x.fill();
    x.strokeStyle = "#500000"; x.lineWidth = 1.2; x.stroke();
    x.strokeStyle = "#fff"; x.lineWidth = 3.4; x.lineCap = "round";
    x.beginPath(); x.moveTo(9.5, 15.5); x.lineTo(14, 20); x.lineTo(22.5, 10.5); x.stroke();
  };

  draws.briefcase = x => {
    // classic leather briefcase
    x.fillStyle = "#8a5a2b";
    rr(x, 3, 11, 26, 15, 2); x.fill();
    x.strokeStyle = "#3d2510"; x.lineWidth = 1; x.stroke();
    x.fillStyle = "#a06c36";
    rr(x, 3, 11, 26, 6, 2); x.fill();
    x.strokeStyle = "#3d2510"; x.stroke();
    // handle
    x.strokeStyle = "#3d2510"; x.lineWidth = 2.4;
    x.beginPath(); x.moveTo(12, 11); x.quadraticCurveTo(16, 5, 20, 11); x.stroke();
    x.strokeStyle = "#a06c36"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(12.5, 10.5); x.quadraticCurveTo(16, 5.8, 19.5, 10.5); x.stroke();
    // clasps
    x.fillStyle = "#e8c860";
    x.fillRect(8, 15, 4, 4); x.fillRect(20, 15, 4, 4);
    x.strokeStyle = "#3d2510"; x.strokeRect(8.5, 15.5, 3, 3); x.strokeRect(20.5, 15.5, 3, 3);
    // seam highlight
    x.strokeStyle = "#c89858";
    x.beginPath(); x.moveTo(4, 18); x.lineTo(28, 18); x.stroke();
  };
  draws.phone = x => {
    // desk phone: base + handset
    x.fillStyle = "#3a3a44";
    rr(x, 5, 14, 22, 13, 3); x.fill();
    x.strokeStyle = "#111"; x.lineWidth = 1; x.stroke();
    // keypad
    x.fillStyle = "#c0c0c0";
    for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < 3; c2++)
      x.fillRect(10 + c2 * 4.5, 17 + r2 * 3.2, 3, 2.2);
    // handset
    x.fillStyle = "#3a3a44";
    rr(x, 3, 5, 26, 6, 3); x.fill();
    x.strokeStyle = "#111"; x.stroke();
    x.fillStyle = "#5a5a68";
    rr(x, 5, 6.5, 6, 3, 1.5); x.fill();
    rr(x, 21, 6.5, 6, 3, 1.5); x.fill();
    // cord
    x.strokeStyle = "#111"; x.lineWidth = 1;
    x.beginPath();
    x.moveTo(4, 11);
    for (let i = 0; i < 5; i++) x.quadraticCurveTo(2 + (i % 2) * 3, 12 + i * 1.2, 3.5, 12.5 + i * 1.2);
    x.stroke();
  };

  draws.mail = x => {
    // envelope with a letter peeking out
    x.fillStyle = "#e8e8e8"; x.fillRect(3, 8, 26, 17);
    x.strokeStyle = "#404040"; x.lineWidth = 1; x.strokeRect(3.5, 8.5, 25, 16);
    x.fillStyle = "#ffffff";
    poly(x, [[3, 8], [16, 18], [29, 8]]); x.fill();
    x.strokeStyle = "#808080";
    x.beginPath(); x.moveTo(3, 8); x.lineTo(16, 18); x.lineTo(29, 8); x.stroke();
    x.beginPath(); x.moveTo(3, 25); x.lineTo(13, 16); x.moveTo(29, 25); x.lineTo(19, 16); x.stroke();
    x.fillStyle = "#c00000"; x.fillRect(24, 10, 4, 4);   // stamp
    x.strokeStyle = "#800000"; x.strokeRect(24.5, 10.5, 3, 3);
  };
  draws.hearts = x => {
    // fanned cards with a big heart
    const card = (cx, cy, rot) => {
      x.save(); x.translate(cx, cy); x.rotate(rot);
      x.fillStyle = "#000"; rr(x, -8, -11, 16, 22, 2); x.fill();
      x.fillStyle = "#fff"; rr(x, -7, -10, 14, 20, 1.5); x.fill();
      x.restore();
    };
    card(12, 16, -0.2); card(20, 16, 0.15);
    x.fillStyle = "#e00000";
    x.beginPath();
    x.moveTo(16, 24);
    x.bezierCurveTo(8, 17, 9, 9, 16, 13);
    x.bezierCurveTo(23, 9, 24, 17, 16, 24);
    x.closePath(); x.fill();
    x.strokeStyle = "#800000"; x.lineWidth = 1; x.stroke();
  };
  draws.sndrec = x => {
    // speaker with green scope wave
    poly(x, [[4, 13], [9, 13], [15, 7], [15, 25], [9, 19], [4, 19]]);
    x.fillStyle = "#c0c0c0"; x.fill();
    x.strokeStyle = "#000"; x.lineWidth = 1; x.stroke();
    x.fillStyle = "#000"; x.fillRect(17, 10, 12, 12);
    x.strokeStyle = "#00e000"; x.lineWidth = 1.4;
    x.beginPath();
    for (let i = 0; i <= 10; i++) {
      const px2 = 18 + i * 1.05, py = 16 + Math.sin(i * 1.4) * 3.6;
      i ? x.lineTo(px2, py) : x.moveTo(px2, py);
    }
    x.stroke();
  };

  /* ---------- large waving flag (boot screen / about / system props) ---------- */
  // One continuous waving cloth: gentle crest inside the flag, thin grout so the
  // black pane outlines merge into a single flag. Original stylized rendition.
  function renderFlag(px) {
    const c = document.createElement("canvas");
    c.width = px; c.height = px;
    const x = c.getContext("2d");
    const S = px / 100;                       // design space 100x100
    const x0 = 27 * S, y0 = 28 * S;
    const W = 56 * S, H = 47 * S;
    const A = 4.2 * S;
    const wave = u => A * Math.sin((u * 0.9 + 0.18) * Math.PI);  // crest ~u=0.36, slight dip at right
    const P = (u, v) => [x0 + u * W - v * 3 * S, y0 + v * H - wave(u)];
    function quad(u0, u1, v0, v1) {
      const N = 12;
      x.beginPath();
      for (let i = 0; i <= N; i++) { const p = P(u0 + (u1 - u0) * i / N, v0); i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }
      for (let i = 1; i <= N; i++) { const p = P(u1, v0 + (v1 - v0) * i / N); x.lineTo(p[0], p[1]); }
      for (let i = N - 1; i >= 0; i--) { const p = P(u0 + (u1 - u0) * i / N, v1); x.lineTo(p[0], p[1]); }
      for (let i = N - 1; i >= 1; i--) { const p = P(u0, v0 + (v1 - v0) * i / N); x.lineTo(p[0], p[1]); }
      x.closePath();
    }
    const gu = 0.022, gv = 0.026;   // thin grout — outlines fuse into one flag
    const panes = [
      [0, 0.5 - gu, 0, 0.5 - gv, ["#b81616", "#ff4f4f"]],
      [0.5 + gu, 1, 0, 0.5 - gv, ["#128012", "#4fd44f"]],
      [0, 0.5 - gu, 0.5 + gv, 1, ["#1440b8", "#4f8aff"]],
      [0.5 + gu, 1, 0.5 + gv, 1, ["#c09a00", "#ffe14f"]]
    ];
    x.lineJoin = "round";
    panes.forEach(([u0, u1, v0, v1, cols]) => {
      quad(u0, u1, v0, v1);
      const g = x.createLinearGradient(x0, 0, x0 + W, 0);
      g.addColorStop(0, cols[0]); g.addColorStop(0.42, cols[1]); g.addColorStop(1, cols[0]);
      x.fillStyle = g;
      x.fill();
      x.lineWidth = Math.max(1, 2.6 * S);
      x.strokeStyle = "#000";
      x.stroke();
    });
    // the signature dithered trail: diagonal checker of colored + black blocks,
    // warm tones toward the top rows, cool toward the bottom, fading left
    const bandCols = ["#e05050", "#e05050", "#5090e0", "#5090e0"];
    for (let k = 1; k <= 4; k++) {
      for (let r2 = 0; r2 < 4; r2++) {
        const v = 0.10 + r2 * 0.26;
        const u = -0.055 - k * 0.082 - r2 * 0.012;
        const sz = Math.max(1.4, 4.4 - k * 0.75) * S;
        const p = P(u, v);
        if (p[0] < sz) continue;
        x.fillStyle = ((k + r2) % 2 === 0) ? bandCols[r2] : "#000000";
        x.save();
        x.translate(p[0], p[1]);
        x.rotate(-0.18);
        x.fillRect(-sz / 2, -sz / 2, sz, sz * 0.82);
        x.restore();
      }
    }
    return c.toDataURL();
  }

  window.IconArt = {
    renderFlag,
    draws,
    has: n => !!draws[n],
    render(name, size) {
      const base = document.createElement("canvas");
      base.width = 32; base.height = 32;
      const bx = base.getContext("2d");
      draws[name](bx);
      if (size === 32) return base.toDataURL();
      const c = document.createElement("canvas");
      c.width = size; c.height = size;
      const cx = c.getContext("2d");
      cx.imageSmoothingEnabled = true;
      cx.imageSmoothingQuality = "high";
      cx.drawImage(base, 0, 0, size, size);
      return c.toDataURL();
    }
  };
})();

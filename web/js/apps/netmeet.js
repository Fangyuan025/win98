/* netmeet.js — NetMeet 98: video calls over a 28.8k line.
   The video is 4 frames per second and the audio is a synthesizer doing its best. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  const CONTACTS = [
    { id: "mom", name: "Mom", desc: "familypc.home", hue: 18, hair: "#8a6a4a", glasses: true,
      lines: ["HI HONEY CAN YOU SEE ME", "I CAN SEE MY OWN VIDEO IS THAT ME", "how do i make my face bigger", "your room is a mess I CAN SEE IT", "ok dinner at 6 love you BYE... how do i hang up"] },
    { id: "dave", name: "CoolDave2000", desc: "dave-pc", hue: 100, hair: "#3a2a18", glasses: false,
      lines: ["DUDE it works. we live in the FUTURE", "check out my new poster *video freezes*", "did you see my quake demo. 4 minutes. all rockets", "my fan? yeah its loud on purpose", "brb my video froze on a bad frame. do NOT screenshot"] },
    { id: "rick", name: "UncleRick", desc: "ricknet.biz", hue: 250, hair: "#909090", glasses: true,
      lines: ["*heavy static*", "CAN YOU HEAR ME? THE COMPUTER IS MAKING THE NOISE AGAIN", "*picture of ceiling*", "HELLO? I CAN SEE A LITTLE MAN IN THE CORNER. IS THAT ME?", "*call drops*"] }
  ];

  W98.Apps.netmeet = {
    name: "NetMeet 98", icon: "netmeet", single: true,
    launch() {
      let call = null, frameTimer = null, lineTimer = null, clockTimer = null, t0 = 0;
      const win = WM.create({
        title: "NetMeet 98 - Not in a call", icon: "netmeet", appId: "netmeet",
        width: 470, height: 420, resizable: false, maximizable: false,
        statusbar: [{ text: "Ready" }, { text: "H.263 @ 4fps (optimistic)" }],
        menus: [
          { label: "Call", items: () => [
            ...CONTACTS.map(c => ({ label: "Call " + c.name, disabled: !!call, click: () => dial(c) })),
            "-",
            { label: "Hang Up", disabled: !call, click: hangup },
            "-",
            { label: "Exit", click: () => win.close() }
          ]},
          { label: "Help", items: () => [
            { label: "About NetMeet 98", click: () => Dialogs.about("NetMeet 98", "netmeet", ["Face to face at four frames per second.", "Now with 40% less audio."]) }
          ]}
        ]
      });

      /* remote video */
      const remote = el("canvas", { width: 320, height: 240, style: "flex:none;margin:8px auto 4px;border:2px solid #404040;background:#000" });
      const rx = remote.getContext("2d");
      const remoteLbl = el("div", { style: "flex:none;text-align:center;font-size:11px", text: "No call in progress — use the Call menu" });
      /* self preview */
      const selfRow = el("div", { style: "flex:none;display:flex;align-items:center;gap:8px;justify-content:center;padding:6px" });
      const selfCv = el("canvas", { width: 80, height: 60, style: "border:1px solid #404040;background:#101018" });
      const sx = selfCv.getContext("2d");
      sx.fillStyle = "#101018"; sx.fillRect(0, 0, 80, 60);
      sx.fillStyle = "#404050";
      sx.beginPath(); sx.arc(40, 24, 10, 0, 7); sx.fill();
      sx.beginPath(); sx.ellipse(40, 50, 16, 12, 0, Math.PI, 0); sx.fill();
      sx.fillStyle = "#8090a0"; sx.font = "7px monospace"; sx.textAlign = "center";
      sx.fillText("NO CAMERA", 40, 10);
      sx.textAlign = "left";
      selfRow.append(el("div", { style: "font-size:10px;color:#606060;text-align:right", text: "You\n(no camera detected —\nperiod accurate)" }), selfCv);
      const chatLog = el("div", { class: "sunken", style: "flex:1;background:#fff;overflow:auto;margin:0 8px 8px;padding:4px 6px;font-size:11px;line-height:1.5" });
      win.body.append(remote, remoteLbl, selfRow, chatLog);

      function addChat(who, t) {
        chatLog.append(el("div", {}, el("b", { text: who + ": " }), t));
        chatLog.scrollTop = chatLog.scrollHeight;
      }

      function drawStatic() {
        const d = rx.createImageData(320, 240);
        for (let i = 0; i < d.data.length; i += 4) {
          const v = (Math.random() * 255) | 0;
          d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255;
        }
        rx.putImageData(d, 0, 0);
      }
      function drawCaller(c, t) {
        /* low-fi procedural head at 4fps with block artifacts */
        rx.fillStyle = "hsl(" + c.hue + ",25%,72%)";
        rx.fillRect(0, 0, 320, 240);
        rx.fillStyle = "hsl(" + c.hue + ",22%,58%)";
        rx.fillRect(0, 170, 320, 70);
        const bob = Math.sin(t / 700) * 4;
        /* shoulders */
        rx.fillStyle = "#4a5a80";
        rx.beginPath(); rx.ellipse(160, 240, 110, 60 + bob * 0.3, 0, Math.PI, 0); rx.fill();
        /* head */
        rx.fillStyle = "#e8bc94";
        rx.beginPath(); rx.ellipse(160, 118 + bob, 56, 66, 0, 0, 7); rx.fill();
        /* hair */
        rx.fillStyle = c.hair;
        rx.beginPath(); rx.ellipse(160, 74 + bob, 58, 30, 0, Math.PI, 0); rx.fill();
        /* eyes (blink) */
        const blink = (t % 3200) < 140;
        rx.fillStyle = "#202020";
        if (blink) { rx.fillRect(132, 108 + bob, 18, 3); rx.fillRect(172, 108 + bob, 18, 3); }
        else {
          rx.beginPath(); rx.arc(141, 109 + bob, 6, 0, 7); rx.fill();
          rx.beginPath(); rx.arc(181, 109 + bob, 6, 0, 7); rx.fill();
        }
        if (c.glasses) {
          rx.strokeStyle = "#303030"; rx.lineWidth = 3;
          rx.strokeRect(128, 98 + bob, 26, 22); rx.strokeRect(168, 98 + bob, 26, 22);
          rx.beginPath(); rx.moveTo(154, 108 + bob); rx.lineTo(168, 108 + bob); rx.stroke();
        }
        /* mouth: talks when a line recently appeared */
        const talking = call && (t - call.lastLineAt < 1800);
        rx.fillStyle = "#94502e";
        if (talking) {
          const o = 4 + Math.abs(Math.sin(t / 90)) * 9;
          rx.beginPath(); rx.ellipse(160, 152 + bob, 13, o, 0, 0, 7); rx.fill();
        } else {
          rx.fillRect(146, 150 + bob, 28, 4);
        }
        /* compression artifacts: shift a random block occasionally */
        if (Math.random() < 0.28) {
          const bx = (Math.random() * 280) | 0, by = (Math.random() * 200) | 0;
          const bw = 24 + (Math.random() * 30 | 0), bh = 16 + (Math.random() * 20 | 0);
          rx.drawImage(remote, bx, by, bw, bh, bx + ((Math.random() * 8) | 0) - 4, by, bw, bh);
        }
        /* overlay */
        rx.fillStyle = "rgba(0,0,0,0.5)";
        rx.fillRect(0, 0, 320, 14);
        rx.fillStyle = "#0f0"; rx.font = "9px monospace";
        rx.fillText(c.name + " — " + c.desc + "   " + fmtDur(t - t0), 4, 10);
      }
      function fmtDur(ms) {
        const s = (ms / 1000) | 0;
        return String((s / 60) | 0).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
      }
      function mumble() {
        const bus = Sound.audio();
        if (!bus) return;
        for (let k = 0; k < 4; k++) {
          const o = bus.ctx.createOscillator(), g = bus.ctx.createGain();
          o.type = "sawtooth";
          o.frequency.value = 120 + Math.random() * 140;
          const at = bus.ctx.currentTime + k * 0.14;
          g.gain.setValueAtTime(0.0001, at);
          g.gain.linearRampToValueAtTime(0.03, at + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
          o.connect(g); g.connect(bus.master);
          o.start(at); o.stop(at + 0.15);
        }
      }

      function dial(c) {
        remoteLbl.textContent = "Dialing " + c.name + " over the modem...";
        win.setStatus(0, "Dialing...");
        drawStatic();
        let flick = 0;
        const staticIv = setInterval(() => { drawStatic(); if (++flick > 6) { clearInterval(staticIv); connect(c); } }, 300);
      }
      function connect(c) {
        call = { c, lineIdx: 0, lastLineAt: performance.now() };
        t0 = performance.now();
        win.setTitle("NetMeet 98 - In call with " + c.name);
        win.setStatus(0, "Connected");
        remoteLbl.textContent = "Connected — video is 4fps, audio is interpretive";
        addChat("System", "Call connected to " + c.name + " (" + c.desc + ")");
        Sound.play("ding");
        frameTimer = setInterval(() => { if (!win.closed && call) drawCaller(c, performance.now()); }, 250);
        const nextLine = () => {
          if (win.closed || !call) return;
          const line = c.lines[call.lineIdx++];
          if (line == null) { hangup("The call ended. " + c.name + " waves at the wrong part of the screen."); return; }
          addChat(c.name, line);
          call.lastLineAt = performance.now();
          mumble();
          lineTimer = setTimeout(nextLine, 3800 + Math.random() * 3200);
        };
        lineTimer = setTimeout(nextLine, 1200);
      }
      function hangup(msg) {
        clearInterval(frameTimer); clearTimeout(lineTimer);
        if (call) addChat("System", msg || "You hung up. The silence is 56k wide.");
        call = null;
        win.setTitle("NetMeet 98 - Not in a call");
        win.setStatus(0, "Ready");
        remoteLbl.textContent = "No call in progress — use the Call menu";
        rx.fillStyle = "#000"; rx.fillRect(0, 0, 320, 240);
      }
      win.opts.onClose = () => { clearInterval(frameTimer); clearTimeout(lineTimer); clearInterval(clockTimer); };
      rx.fillStyle = "#000"; rx.fillRect(0, 0, 320, 240);
      rx.fillStyle = "#0f0"; rx.font = "10px monospace";
      rx.fillText("NETMEET 98 — READY", 100, 120);
      return win;
    }
  };
})();

/* dialup.js — Dial-Up Networking: the full 56k experience */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  let connection = null; // { trayEl, blinkTimer, startedAt, rx, tx, growTimer }

  function trayIconCanvas() {
    const c = document.createElement("canvas");
    c.width = 16; c.height = 16;
    return c;
  }
  function paintTray(c, lit1, lit2) {
    const x = c.getContext("2d");
    x.clearRect(0, 0, 16, 16);
    const mon = (X, Y, lit) => {
      x.fillStyle = "#c0c0c0"; x.fillRect(X, Y, 9, 7);
      x.strokeStyle = "#000"; x.lineWidth = 1; x.strokeRect(X + 0.5, Y + 0.5, 8, 6);
      x.fillStyle = lit ? "#00e000" : "#004000";
      x.fillRect(X + 2, Y + 2, 5, 3);
      x.fillStyle = "#808080"; x.fillRect(X + 3, Y + 7, 3, 1);
    };
    mon(6, 1, lit1);
    mon(1, 7, lit2);
  }

  function disconnect() {
    if (!connection) return;
    clearInterval(connection.blinkTimer);
    clearInterval(connection.growTimer);
    connection.trayEl.remove();
    connection = null;
    Sound.play("warn");
  }

  function statusDialog() {
    if (!connection) return;
    const win = WM.create({
      title: "Connected to My ISP", icon: "dialup", width: 330, height: 0,
      resizable: false, maximizable: false, noTaskbar: true, center: true
    });
    win.el.style.height = "auto";
    const dur = el("span");
    const rx = el("span"); const tx = el("span");
    const grid = el("div", { style: "flex:1;display:grid;grid-template-columns:auto 1fr;gap:6px 14px" },
      el("span", { text: "Connected at:" }), el("span", { text: "49,333 bps" }),
      el("span", { text: "Duration:" }), dur,
      el("span", { text: "Bytes received:" }), rx,
      el("span", { text: "Bytes sent:" }), tx);
    win.body.append(
      el("div", { style: "display:flex;gap:14px;padding:14px 16px 6px" }, Icons.img("dialup", 32), grid),
      (() => {
        const r = el("div", { class: "msgbox-btns" });
        const ok = el("button", { class: "btn default", text: "OK", onclick: () => win.close() });
        const dc = el("button", { class: "btn", text: "Disconnect", onclick: () => { disconnect(); win.close(); } });
        r.append(ok, dc);
        return r;
      })()
    );
    const t = setInterval(() => {
      if (win.closed || !connection) { clearInterval(t); return; }
      const s = Math.floor((Date.now() - connection.startedAt) / 1000);
      dur.textContent = String(Math.floor(s / 3600)).padStart(3, "0") + ":" + pad2(Math.floor(s / 60) % 60) + ":" + pad2(s % 60);
      rx.textContent = connection.rx.toLocaleString();
      tx.textContent = connection.tx.toLocaleString();
    }, 500);
    return win;
  }

  function goOnline() {
    const c = trayIconCanvas();
    paintTray(c, true, true);
    c.dataset.tip = "Connected at 49,333 bps to My ISP";
    c.style.width = "16px"; c.style.height = "16px";
    c.addEventListener("dblclick", statusDialog);
    (W98.Taskbar && W98.Taskbar.trayIcons ? W98.Taskbar.trayIcons() : $("#tray-icons")).prepend(c);
    connection = {
      trayEl: c, startedAt: Date.now(),
      rx: 1024 + ((Math.random() * 4096) | 0), tx: 512,
      blinkTimer: setInterval(() => paintTray(c, Math.random() > 0.4, Math.random() > 0.6), 350),
      growTimer: setInterval(() => {
        connection.rx += (Math.random() * 900) | 0;
        connection.tx += (Math.random() * 220) | 0;
      }, 700)
    };
  }

  W98.Apps.dialup = {
    name: "Dial-Up Networking", icon: "dialup", single: true,
    launch() {
      if (connection) { statusDialog(); return; }
      const win = WM.create({
        title: "Connect To", icon: "dialup", appId: "dialup",
        width: 350, height: 0, resizable: false, maximizable: false, center: true
      });
      win.el.style.height = "auto";
      const user = el("input", { type: "text", class: "field", style: "width:100%", value: Store.get("userName", "User") });
      const pass = el("input", { type: "password", class: "field", style: "width:100%", value: "hunter2" });
      const save = el("label", { class: "checkline" }, el("input", { type: "checkbox", checked: "" }), "Save password");
      $("input", save).checked = true;
      win.body.append(
        el("div", { style: "display:flex;gap:12px;padding:14px 16px 4px;align-items:flex-start" },
          Icons.img("dialup", 32),
          el("div", { style: "flex:1" },
            el("div", { style: "font-size:13px;font-weight:700;margin-bottom:8px", text: "My ISP" }),
            el("div", { style: "display:grid;grid-template-columns:78px 1fr;gap:8px;align-items:center" },
              el("span", { text: "User name:" }), user,
              el("span", { text: "Password:" }), pass),
            save,
            el("div", { style: "display:grid;grid-template-columns:78px 1fr;gap:8px;margin-top:4px" },
              el("span", { text: "Phone number:" }), el("span", { text: "555-0198" }),
              el("span", { text: "Dialing from:" }), el("span", { text: "New Location" })))),
        (() => {
          const r = el("div", { class: "msgbox-btns" });
          const con = el("button", { class: "btn default", text: "Connect" });
          const cancel = el("button", { class: "btn", text: "Cancel", onclick: () => win.close() });
          con.addEventListener("click", () => { win.close(true); dialingWindow(); });
          r.append(con, cancel);
          return r;
        })()
      );
      return win;
    }
  };

  /* ================= Phone Dialer ================= */
  W98.Apps.dialer = {
    name: "Phone Dialer", icon: "phone", single: true,
    launch() {
      const DTMF = {
        "1": [697, 1209], "2": [697, 1336], "3": [697, 1477],
        "4": [770, 1209], "5": [770, 1336], "6": [770, 1477],
        "7": [852, 1209], "8": [852, 1336], "9": [852, 1477],
        "*": [941, 1209], "0": [941, 1336], "#": [941, 1477]
      };
      let number = "";
      let busyTimer = null;

      const win = WM.create({
        title: "Phone Dialer", icon: "phone", appId: "dialer",
        width: 300, height: 0, resizable: false, maximizable: false,
        menus: [
          { label: "Help", items: () => [{ label: "About Phone Dialer", click: () => Dialogs.about("Phone Dialer", "phone", ["For when you need to call someone", "and nobody is on the internet."]) }] }
        ],
        onClose: () => clearTimeout(busyTimer)
      });
      win.el.style.height = "auto";
      win.body.style.padding = "10px";

      const display = el("input", { type: "text", class: "field", style: "width:100%;font-size:14px;text-align:right;height:26px", readonly: "" });
      function tone(pair, dur) {
        const bus = Sound.audio();
        if (!bus) return;
        pair.forEach(f => {
          const o = bus.ctx.createOscillator();
          const g = bus.ctx.createGain();
          o.frequency.value = f;
          g.gain.setValueAtTime(0.05, bus.ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, bus.ctx.currentTime + (dur || 0.12));
          o.connect(g); g.connect(bus.master);
          o.start(); o.stop(bus.ctx.currentTime + (dur || 0.12) + 0.02);
        });
      }
      function press(d) {
        number += d;
        display.value = number;
        tone(DTMF[d]);
      }

      const row = el("div", { style: "display:flex;gap:10px;margin-top:8px" });
      const pad = el("div", { style: "display:grid;grid-template-columns:repeat(3,46px);gap:4px" });
      "123456789*0#".split("").forEach(d => {
        const b = el("button", { class: "btn", text: d, style: "min-width:0;height:30px;font-size:13px" });
        b.addEventListener("click", () => press(d));
        pad.append(b);
      });
      const side = el("div", { style: "display:flex;flex-direction:column;gap:4px;flex:1" });
      const dialB = el("button", { class: "btn default", text: "Dial" });
      const clearB = el("button", { class: "btn", text: "Clear", onclick: () => { number = ""; display.value = ""; } });
      side.append(dialB, clearB, el("div", { style: "font-size:10px;margin-top:4px", text: "Speed dial:" }));
      [["Mom", "555-0142"], ["Pizza", "555-0187"], ["My ISP", "555-0198"], ["Time", "555-1212"]].forEach(([nm, num]) => {
        const b = el("button", { class: "btn", text: nm, style: "min-width:0" });
        b.addEventListener("click", () => { number = num.replace(/-/g, ""); display.value = num; });
        side.append(b);
      });
      row.append(pad, side);
      win.body.append(display, row);

      dialB.addEventListener("click", () => {
        if (!number) return;
        const digits = number.replace(/\D/g, "");
        digits.split("").forEach((d, i) => setTimeout(() => tone(DTMF[d] || [500, 600]), i * 140));
        win.setTitle("Phone Dialer - Dialing...");
        busyTimer = setTimeout(() => {
          win.setTitle("Phone Dialer");
          if (digits === "5551212") {
            WM.msgbox({
              title: "Time & Temperature", icon: "info",
              text: "\"At the tone, the time will be " + fmtTime(new Date()) + ".\n...beeep.\"\n\nThis service remains more reliable than the family calendar."
            });
          } else if (digits === "5550198") {
            WM.msgbox({
              title: "Phone Dialer", icon: "warning",
              text: "You have reached My ISP by voice line.\nTo actually connect, use Dial-Up Networking —\nthe modem prefers to do the talking."
            });
          } else {
            Sound.play("warn");
            WM.msgbox({
              title: "Phone Dialer", icon: "warning",
              text: "The line is busy.\n\n(Of course it is. Someone in the house is on the internet.)"
            });
          }
        }, digits.length * 140 + 1400);
      });
      return win;
    }
  };

  function dialingWindow() {
    const win = WM.create({
      title: "Connecting to My ISP", icon: "dialup", appId: "dialup",
      width: 320, height: 0, resizable: false, maximizable: false, center: true
    });
    win.el.style.height = "auto";
    const status = el("div", { style: "flex:1;padding-top:6px", text: "Dialing 555-0198..." });
    win.body.append(
      el("div", { style: "display:flex;gap:14px;padding:16px 16px 6px" }, Icons.img("dialup", 32), status),
      (() => {
        const r = el("div", { class: "msgbox-btns" });
        const cancel = el("button", { class: "btn", text: "Cancel", onclick: () => win.close() });
        r.append(cancel);
        return r;
      })()
    );
    Sound.play("modem");
    const steps = [
      [2300, "Status: Dialing..."],
      [3000, "Status: Connecting at 49,333 bps..."],
      [6600, "Verifying user name and password..."],
      [7600, "Logging on to the network..."]
    ];
    const timers = steps.map(([t, txt]) => setTimeout(() => { if (!win.closed) status.textContent = txt; }, t));
    timers.push(setTimeout(() => {
      if (win.closed) return;
      win.close(true);
      goOnline();
      Sound.play("info");
      const done = WM.create({
        title: "Connection Established", icon: "dialup", width: 330, height: 0,
        resizable: false, maximizable: false, noTaskbar: true, center: true
      });
      done.el.style.height = "auto";
      done.body.append(
        el("div", { style: "display:flex;gap:14px;padding:14px 16px 6px" },
          Icons.img("dialup", 32),
          el("div", { style: "line-height:1.5" },
            el("b", { text: "You are connected to My ISP." }),
            el("div", { text: "Connected at 49,333 bps." }),
            el("div", { style: "font-size:11px;margin-top:6px", text: "To disconnect, double-click the connection icon in the taskbar tray and click Disconnect." }))),
        (() => {
          const r = el("div", { class: "msgbox-btns" });
          const ok = el("button", { class: "btn default", text: "Close", onclick: () => done.close() });
          r.append(ok);
          return r;
        })()
      );
    }, 8500));
    win.opts.onClose = () => timers.forEach(clearTimeout);
  }
})();

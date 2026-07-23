/* boot.js — boot sequence, shutdown, restart */
"use strict";
const Boot = W98.Boot = (() => {
  let skipRequested = false;

  function bootScreen() {
    return new Promise((resolve) => {
      const boot = $("#boot");
      boot.classList.remove("hidden");
      boot.innerHTML = "";
      skipRequested = false;
      const skip = () => { skipRequested = true; };
      boot.addEventListener("mousedown", skip);
      document.addEventListener("keydown", skip, { once: true });

      /* phase 1: BIOS */
      const bios = el("div", { class: "bios" });
      boot.append(bios);
      const lines = [
        "Award Modular BIOS v4.51PG, An Energy Star Ally",
        "Copyright (C) 1984-98, Award Software, Inc.",
        "",
        "PENTIUM II-MMX CPU at 266MHz",
        "Memory Test :  65536K OK",
        "",
        "Award Plug and Play BIOS Extension v1.0A",
        "Detecting HDD Primary Master ... QUANTUM FIREBALL SE4.3A",
        "Detecting HDD Primary Slave  ... None",
        "Detecting CD-ROM             ... TOSHIBA CD-ROM XM-6202B",
        "",
        "Starting Windows 98..."
      ];
      let i = 0;
      const typeNext = () => {
        if (skipRequested) { phase2(); return; }
        if (i < lines.length) {
          bios.textContent += lines[i] + "\n";
          i++;
          setTimeout(typeNext, i === 5 ? 320 : (lines[i - 1] === "" ? 60 : 140));
        } else setTimeout(phase2, 420);
      };
      setTimeout(typeNext, 250);

      /* phase 2: logo */
      function phase2() {
        boot.innerHTML = "";
        const wrap = el("div", { class: "logo-wrap" });
        const custom = !!window.__WIN98_FLAG__;
        const flag = new Image();
        flag.src = Icons.bigFlag(9);
        if (custom) {
          // user-supplied lockup usually includes its own (often black) wordmark —
          // give it a light splash plate so it stays legible on the black boot screen
          flag.style.maxWidth = "380px";
          flag.style.maxHeight = "280px";
          flag.style.display = "block";
          const plate = el("div", { style: "display:inline-block;background:#fff;padding:26px 34px;border-radius:4px" });
          plate.append(flag);
          wrap.append(plate);
        } else {
          flag.style.width = "144px";
          flag.style.imageRendering = "pixelated";
          wrap.append(flag);
        }
        if (!custom) {
          wrap.append(el("div", {
            style: "font-size:44px;color:#fff;font-weight:700;margin-top:12px;font-family:'Times New Roman',serif;letter-spacing:1px"
          }, "Windows", el("span", { style: "font-size:22px;vertical-align:top;position:relative;top:4px;left:6px", text: "98" })));
        }
        const bar = el("div", { class: "bootbar" }, el("div", { class: "strip" }));
        boot.append(wrap, bar);
        const wait = skipRequested ? 300 : 2600;
        setTimeout(done, wait);
      }

      function done() {
        boot.classList.add("hidden");
        boot.innerHTML = "";
        resolve();
      }
    });
  }

  /* classic Windows logon box */
  function loginDialog() {
    return new Promise((resolve) => {
      const win = WM.create({
        title: "Welcome to Windows", icon: "logoff", width: 400, height: 0,
        resizable: false, minimizable: false, maximizable: false, closable: false,
        noTaskbar: true, center: true
      });
      win.el.style.height = "auto";
      const user = el("input", { type: "text", class: "field", style: "width:100%", value: Store.get("userName", "User") });
      const pass = el("input", { type: "password", class: "field", style: "width:100%" });
      const grid = el("div", { style: "flex:1;display:grid;grid-template-columns:78px 1fr;gap:10px 8px;align-items:center" },
        el("span", { text: "User name:" }), user,
        el("span", { text: "Password:" }), pass);
      const row = el("div", { style: "display:flex;gap:14px;padding:16px 16px 6px" },
        Icons.img("logoff", 32),
        el("div", { style: "flex:1" },
          el("div", { text: "Type a user name and password to log on to Windows.", style: "margin-bottom:10px;line-height:1.4" }),
          grid));
      const btns = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:10px 16px 14px" });
      const finish = () => {
        if (user.value.trim()) Store.set("userName", user.value.trim());
        win.close(true);
        resolve();
      };
      const ok = el("button", { class: "btn default", text: "OK", onclick: finish });
      // Cancel logs you in anyway — famously excellent Win9x security
      const cancel = el("button", { class: "btn", text: "Cancel", onclick: finish });
      btns.append(ok, cancel);
      win.body.append(row, btns);
      [user, pass].forEach(inp => inp.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter") finish();
      }));
      setTimeout(() => { user.focus(); user.select(); }, 60);
    });
  }

  function run() {
    const params = new URLSearchParams(location.search);
    let wasLogoff = false;
    try { wasLogoff = sessionStorage.getItem("w98logoff") === "1"; sessionStorage.removeItem("w98logoff"); } catch (e) {}
    if (params.get("noboot")) {
      $("#boot").classList.add("hidden");
      W98.bus.emit("booted");
      return Promise.resolve();
    }
    if (wasLogoff) {
      // logging off skips the BIOS/logo and goes straight to the logon box
      $("#boot").classList.add("hidden");
      return loginDialog().then(() => {
        Sound.play("startup");
        W98.bus.emit("booted");
      });
    }
    const dirty = Store.get("cleanShutdown", true) === false;
    return bootScreen().then(() => dirty ? scandiskScreen() : null).then(() => loginDialog()).then(() => {
      Sound.play("startup");
      W98.bus.emit("booted");
    });
  }

  /* ---------- blue screen of death (any key returns) ---------- */
  W98.BSOD = {
    show(reason) {
      if ($(".bsod")) return;
      const cover = el("div", { class: "bsod" });
      const inner = el("div", { class: "inner" });
      inner.append(
        el("div", { style: "text-align:center" }, el("span", { class: "hdr", text: "Windows" })),
        el("div", { text: "An exception 0E has occurred at 0028:C562F1B7 in VxD " + (reason || "VMM(01)") + " +\n000059B7. This was called from 0028:C563F5D0 in VxD NOSTALGIA(03) +\n00000AEC. It may be possible to continue normally.\n" }),
        el("div", { style: "margin-top:14px", text: "*  Press any key to attempt to continue.\n*  Press CTRL+ALT+DEL again to restart your computer. You will\n   lose any unsaved information in all applications.\n" }),
        el("div", { style: "text-align:center;margin-top:16px" }, "Press any key to continue ", el("span", { class: "blink", text: "_" }))
      );
      cover.append(inner);
      document.body.append(cover);
      Sound.play("error");
      const dismiss = (e) => {
        e.preventDefault();
        cover.remove();
        document.removeEventListener("keydown", dismiss, true);
        document.removeEventListener("mousedown", dismiss, true);
      };
      setTimeout(() => {
        document.addEventListener("keydown", dismiss, true);
        document.addEventListener("mousedown", dismiss, true);
      }, 400);
    }
  };

  /* ---------- shut down ---------- */
  function shutdownDialog() {
    const win = WM.create({
      title: "Shut Down Windows", icon: "shutdown", width: 380, height: 0,
      resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
    });
    win.el.style.height = "auto";
    let choice = Store.get("lastShutdownChoice", "shutdown");
    const mkRadio = (val, label) => {
      const r = el("label", { class: "checkline" },
        el("input", { type: "radio", name: "sd" }), label);
      const inp = $("input", r);
      inp.checked = choice === val;
      inp.addEventListener("change", () => { if (inp.checked) choice = val; });
      return r;
    };
    const body = el("div", { style: "display:flex;gap:14px;padding:16px 16px 6px" },
      Icons.img("shutdown", 32),
      el("div", {},
        el("div", { text: "What do you want the computer to do?", style: "margin-bottom:8px" }),
        mkRadio("standby", "Stand by"),
        mkRadio("shutdown", "Shut down"),
        mkRadio("restart", "Restart"),
        mkRadio("dos", "Restart in MS-DOS mode")
      )
    );
    const btns = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:10px 16px 14px" });
    const ok = el("button", { class: "btn default", text: "OK" });
    const cancel = el("button", { class: "btn", text: "Cancel" });
    const help = el("button", { class: "btn", text: "Help" });
    ok.addEventListener("click", () => {
      Store.set("lastShutdownChoice", choice);
      win.close();
      if (choice === "standby") standBy();
      else if (choice === "restart") restart();
      else if (choice === "dos") dosMode();
      else shutdown();
    });
    cancel.addEventListener("click", () => win.close());
    help.addEventListener("click", () => WM.msgbox({
      title: "Shut Down Windows", icon: "info",
      text: "Shut down: ends your session and closes Windows.\nRestart: ends your session and starts Windows again.\nStand by: turns off the display until you click.\nMS-DOS mode: restarts into a full-screen MS-DOS prompt."
    }));
    btns.append(ok, cancel, help);
    win.body.append(body, btns);
    setTimeout(() => ok.focus(), 30);
  }

  function standBy() {
    const cover = el("div", { style: "position:fixed;inset:0;background:#000;z-index:99999;cursor:none" });
    document.body.append(cover);
    const wake = () => cover.remove();
    setTimeout(() => {
      cover.addEventListener("mousedown", wake);
      cover.addEventListener("mousemove", wake);
      document.addEventListener("keydown", wake, { once: true });
    }, 400);
  }

  function shutdownScreen(text, thenFn) {
    Store.saveNow();
    const boot = $("#boot");
    boot.classList.remove("hidden");
    boot.innerHTML = "";
    const wrap = el("div", { class: "logo-wrap" });
    const flag = new Image(); flag.src = Icons.bigFlag(7);
    let logoEl = flag;
    if (window.__WIN98_FLAG__) {
      flag.style.maxWidth = "260px"; flag.style.maxHeight = "180px"; flag.style.display = "block";
      logoEl = el("div", { style: "display:inline-block;background:#fff;padding:18px 24px;border-radius:4px" });
      logoEl.append(flag);
    } else {
      flag.style.width = "112px"; flag.style.imageRendering = "pixelated";
    }
    wrap.append(logoEl, el("div", { style: "font-size:30px;color:#fff;font-family:'Times New Roman',serif;margin-top:14px", text: text }));
    boot.append(wrap);
    Sound.play("shutdown");
    setTimeout(thenFn, 2000);
  }

  /* blue ScanDisk screen after an improper shutdown — 1998 kept receipts */
  function scandiskScreen() {
    return new Promise((resolve) => {
      const boot = $("#boot");
      boot.innerHTML = "";
      boot.classList.remove("hidden");
      const bar = el("div", { style: "height:14px;border:1px solid #fff;margin-top:14px;position:relative" });
      const fill = el("div", { style: "position:absolute;left:0;top:0;bottom:0;width:0%;background:#ffff55" });
      bar.append(fill);
      const scr = el("div", { style: "position:absolute;inset:0;background:#0000aa;color:#c0c0c0;font-family:'Courier New',monospace;font-size:14px;display:flex;align-items:center;justify-content:center" },
        el("div", { style: "width:480px;line-height:1.6" },
          el("div", { style: "text-align:center;margin-bottom:10px" }, el("span", { style: "background:#c0c0c0;color:#0000aa;padding:0 8px", text: "Microsoft ScanDisk" })),
          el("div", { text: "Windows was not properly shut down. One or more of" }),
          el("div", { text: "your drives may have errors on it." }),
          el("div", { text: "ScanDisk is now checking drive C for errors:", style: "margin-top:10px" }),
          bar,
          el("div", { style: "font-size:12px;color:#8888cc;margin-top:14px", text: "(Next time, use the Start menu to shut down. It remembers.)" }),
          el("div", { style: "font-size:12px;margin-top:4px", text: "Press any key to skip." })));
      boot.append(scr);
      let p = 0;
      const t = setInterval(() => {
        p = Math.min(100, p + 1.6 + Math.random() * 2.4);
        fill.style.width = p + "%";
        if (p >= 100) { finish(); }
      }, 90);
      let done = false;
      function finish() {
        if (done) return;
        done = true;
        clearInterval(t);
        document.removeEventListener("keydown", finish, true);
        scr.remove();
        boot.classList.add("hidden");   /* hand the screen back to the logon flow */
        resolve();
      }
      document.addEventListener("keydown", finish, { capture: true });
    });
  }

  function shutdown() {
    Store.set("cleanShutdown", true);
    Store.saveNow && Store.saveNow();
    shutdownScreen("Windows is shutting down", () => {
      if (Store.native({ cmd: "quit" })) return;
      const boot = $("#boot");
      boot.innerHTML = "";
      boot.append(el("div", { class: "safe" },
        "It's now safe to turn off", el("br"), "your computer.",
        el("div", { style: "font-size:13px;color:#666;margin-top:40px", text: "(click anywhere to turn the computer back on)" })));
      boot.addEventListener("mousedown", () => location.reload(), { once: true });
    });
  }

  function restart() {
    Store.set("cleanShutdown", true);
    Store.saveNow && Store.saveNow();
    shutdownScreen("Windows is restarting", () => location.reload());
  }

  function dosMode() {
    shutdownScreen("Windows is restarting", () => {
      const boot = $("#boot");
      boot.innerHTML = "";
      boot.classList.remove("hidden");
      const dos = el("div", {
        class: "bios",
        style: "color:#c0c0c0;position:absolute;inset:0;cursor:text;font-size:16px"
      });
      boot.append(dos);
      dos.textContent = "Microsoft(R) Windows 98\n   (C)Copyright Microsoft Corp 1981-1998.\n\nC:\\WINDOWS>";
      const input = el("input", {
        style: "position:absolute;opacity:0;pointer-events:none", type: "text"
      });
      boot.append(input);
      input.focus();
      boot.addEventListener("mousedown", () => setTimeout(() => input.focus(), 0));
      let buf = "";
      const render = () => {
        dos.textContent = "Microsoft(R) Windows 98\n   (C)Copyright Microsoft Corp 1981-1998.\n\nC:\\WINDOWS>" + buf + "_";
      };
      render();
      input.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          const cmd = buf.trim().toLowerCase();
          buf = "";
          if (cmd === "win" || cmd === "exit") { location.reload(); return; }
          dos.textContent += "\nType WIN to return to Windows.\n\nC:\\WINDOWS>";
        } else if (e.key === "Backspace") { buf = buf.slice(0, -1); render(); }
        else if (e.key.length === 1) { buf += e.key; render(); }
      });
    });
  }

  return { run, shutdownDialog, shutdown, restart };
})();

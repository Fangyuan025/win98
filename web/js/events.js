/* events.js — the 1998 ambience engine. Rare, era-accurate random events:
   blue screens, call-waiting disconnects, popup ads, chain letters, low-memory
   scoldings and mystery hardware. Everything recovers cleanly; nothing is lost.
   Toggle in Control Panel > System (Random era events). */
"use strict";
W98.Events = (() => {
  const fired = {};                 // per-session counts
  let lastEventAt = 0;              // refractory anchor (events never stack)

  const on = () => Store.get("eraEvents", true);

  /* ---------- individual events ---------- */

  function bsod() {
    Sound.play("error");
    const cover = el("div", {
      style: "position:absolute;inset:0;z-index:99999;background:#0000aa;color:#c0c0c0;" +
        "font-family:'Courier New',monospace;font-size:14px;display:flex;align-items:center;justify-content:center;cursor:none"
    });
    cover.innerHTML = `<div style="max-width:560px;padding:20px;line-height:1.5">
      <div style="text-align:center;margin-bottom:14px"><span style="background:#c0c0c0;color:#0000aa;padding:0 8px">Windows</span></div>
      <p>A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01) +
      00010E36. The current application will be terminated.</p>
      <p>*  Press any key to terminate the current application.<br>
      *  Press CTRL+ALT+DEL again to restart your computer. You will
      lose any unsaved information in all applications.</p>
      <p style="text-align:center;margin-top:16px">Press any key to continue <span class="cursor" style="background:#c0c0c0">&nbsp;</span></p>
    </div>`;
    $("#screen").append(cover);
    const dismiss = () => { cover.remove(); document.removeEventListener("keydown", dismiss, true); Sound.play("startup"); };
    setTimeout(() => {
      document.addEventListener("keydown", dismiss, { capture: true, once: true });
      cover.addEventListener("mousedown", dismiss, { once: true });
    }, 800);
  }

  function callWaiting() {
    if (!(W98.Net && W98.Net.connected)) return false;
    Sound.play("warn");
    W98.Net.disconnect();
    WM.msgbox({
      title: "Dial-Up Networking", icon: "error",
      text: W98.tr("The connection to My ISP was terminated.\n\nSomeone in the house picked up the phone.\nThey say it is important. It is about a casserole.")
    });
  }

  function popupAd() {
    const ADS = [
      { t: "!! CONGRATULATIONS !!", b: "You are the 1,000,000th visitor to this Web site!\n\nYou have won a FREE* prize!\n\n(* Prize is a valuable lesson about the 1998 internet.)", btn: "CLAIM NOW" },
      { t: "FREE SCREENSAVERS", b: "300+ FREE screensavers! Flying toasters! Fish!\nMore fish! A different kind of toaster!\n\nAlso installs 9 toolbars. The toolbars are forever.", btn: "DOWNLOAD" },
      { t: "HOT NEW MIDI HITS", b: "All the radio hits of 1998, lovingly converted\nto MIDI by someone's cousin!\n\nSounds 40% like the original song!", btn: "LISTEN" }
    ];
    const ad = ADS[(Math.random() * ADS.length) | 0];
    const win = WM.create({
      title: ad.t, icon: "ie", width: 330, height: 0,
      resizable: false, maximizable: false, minimizable: false, center: true
    });
    win.el.style.height = "auto";
    win.body.append(
      el("div", { style: "padding:14px 16px 6px;white-space:pre-line;font-size:12px;text-align:center;background:#ffffcc", text: W98.tr(ad.b) }),
      (() => {
        const r = el("div", { class: "msgbox-btns" });
        const claim = el("button", { class: "btn default", text: ad.btn });
        const close = el("button", { class: "btn", text: "Close" });
        claim.addEventListener("click", () => {
          win.close();
          WM.msgbox({ title: ad.t, icon: "info", text: W98.tr("The server did not respond.\n\nThe prize, like so much of the 1998 internet, was a journey and not a destination.") });
        });
        close.addEventListener("click", () => win.close());
        r.append(claim, close);
        return r;
      })()
    );
    Sound.play("ding");
    return true;
  }

  function chainMail() {
    const POOL = [
      { from: "Aunt Carol", subj: "FW: FW: FW: FW: FW: DO NOT DELETE!!", body: "> > > > > A boy deleted this email and the next day\n> > > > > his tamagotchi ran away!!!\n\nI don't make the rules sweetie.\n\n- Aunt Carol\n\nP.S. The casserole is in the oven." },
      { from: "MAKE.MONEY.FAST", subj: "$$$ EARN $50,000 FROM HOME $$$", body: "Dear Friend,\n\nThis is NOT a pyramid scheme. It is a TRIANGLE\nOPPORTUNITY.\n\nSend $5 to the top name on the list. Add your name\nto the bottom. In six weeks: unimaginable wealth.\n\n(list not included)" },
      { from: "Bill G.", subj: "Microsoft will pay you to forward this!", body: "Microsoft is testing an email tracing program!\nFor every person you forward this to, you will\nreceive $245!!\n\nMy cousin's dentist did it and bought a BOAT.\n\n(This is real. Why would an email lie.)" },
      { from: "sysadmin@my-isp.net", subj: "Do NOT open 'Good Times'", body: "WARNING: If you receive an email called GOOD TIMES\ndo NOT open it! It will erase your hard drive and\nde-magnetize every credit card in your WALLET.\n\nForward this to everyone you have ever met.\n\n(The warning is the virus. It always was.)" }
    ];
    const mail = Store.get("mail", null);
    if (!mail || !mail.Inbox) return false;
    const pick = POOL[(Math.random() * POOL.length) | 0];
    if (mail.Inbox.some(m => m.subj === pick.subj)) return false;
    mail.Inbox.push({ from: pick.from, subj: pick.subj, at: Date.now(), read: false, body: pick.body });
    Store.set("mail", mail);
    Sound.play("ding");
  }

  function lowMemory() {
    const open = WM.wins.filter(w => !w.closed && !w.opts.noTaskbar).length;
    if (open < 7) return false;
    Sound.play("warn");
    WM.msgbox({
      title: "Low Resources", icon: "warn",
      text: W98.tr("Your system is running low on virtual memory.\n\nYou have ") + open + W98.tr(" windows open. In 1998, this was considered\nshowing off. Please close something.")
    });
  }

  function newHardware() {
    Sound.play("ding");
    const win = WM.create({
      title: "Found New Hardware", icon: "sysdev", width: 380, height: 0,
      resizable: false, maximizable: false, noTaskbar: true, center: true
    });
    win.el.style.height = "auto";
    const body1 = el("div", { style: "display:flex;gap:14px;padding:14px 16px 6px" },
      Icons.img("sysdev", 32),
      el("div", { style: "line-height:1.5" },
        el("b", { text: W98.tr("Unknown Device") }),
        el("div", { text: W98.tr("Windows has found new hardware and is locating the driver for it.") }),
        el("div", { style: "font-size:11px;color:#666;margin-top:6px", text: W98.tr("(Nothing was plugged in. Windows simply believes.)") })));
    const btns = el("div", { class: "msgbox-btns" });
    const next = el("button", { class: "btn default", text: W98.tr("Next >") });
    btns.append(next);
    win.body.append(body1, btns);
    next.addEventListener("click", () => {
      body1.querySelector("div").innerHTML = "";
      body1.lastChild.innerHTML = "";
      body1.lastChild.append(
        el("b", { text: W98.tr("Driver not found") }),
        el("div", { text: W98.tr("Windows could not locate a driver for this device. The device may work anyway, forever, mysteriously.") }));
      next.textContent = W98.tr("Finish");
      next.onclick = () => win.close();
    });
  }

  /* ---------- the scheduler: pure chance, no timetable ----------
     Every minute each eligible event rolls its own independent dice (a
     geometric distribution). Nothing is scheduled; a blue screen is exactly
     as possible in minute one as in hour three — that is what made it 1998.
     Events with a real cause keep their cause: lowMemory needs a crowded
     desktop, callWaiting needs a phone call in progress, and the ScanDisk
     boot check (boot.js) fires only after an improper shutdown. */
  const EVENTS = [
    { id: "chainMail",   p: 0.025, max: 3, run: chainMail },
    { id: "popupAd",     p: 0.020, max: 2,
      cond: () => WM.wins.some(w => !w.closed && /Internet Explorer/.test(w.title)), run: popupAd },
    { id: "lowMemory",   p: 0.040, max: 2,
      cond: () => WM.wins.filter(w => !w.closed && !w.opts.noTaskbar).length >= 7, run: lowMemory },
    { id: "callWaiting", p: 0.015, max: 1,
      cond: () => W98.Net && W98.Net.connected, run: callWaiting },
    { id: "newHardware", p: 0.008, max: 1, run: newHardware },
    { id: "bsod",        p: 0.005, max: 1, run: bsod }
  ];

  function tick() {
    if (!on()) return;
    if (W98.Autopilot && W98.Autopilot.active) return;   /* BOB has enough problems */
    /* short refractory period only, so two events never pile on top of each other */
    if (Date.now() - lastEventAt < 90 * 1000) return;
    /* no interruptions while a modal-ish dialog or screensaver is up */
    if (document.querySelector("#screen > .saver, .msgbox-btns") && WM.wins.some(w => !w.closed && w.opts.noTaskbar)) return;
    for (const e of EVENTS) {
      if ((fired[e.id] || 0) >= e.max) continue;
      if (e.cond && !e.cond()) continue;
      if (Math.random() >= e.p) continue;
      if (e.run() === false) continue;   /* declined — condition changed mid-roll */
      fired[e.id] = (fired[e.id] || 0) + 1;
      lastEventAt = Date.now();
      break;                             /* at most one event per minute */
    }
  }

  function init() {
    setInterval(tick, 60 * 1000);
  }

  return { init, _fire: (id) => { const e = EVENTS.find(x => x.id === id); return e && e.run(); } };
})();

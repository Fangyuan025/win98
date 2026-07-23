/* taskbar.js — start menu, task buttons, tray, clock */
"use strict";
const Taskbar = W98.Taskbar = (() => {
  let startOpen = false;
  const taskBtns = new Map(); // win.id -> button

  /* ---------- start menu ---------- */
  function startItems() {
    const small = Store.get("smallStartIcons", false);
    const recent = Store.get("recent", []);
    const progItems = [
      { label: "Accessories", icon: "programs", sub: [
        { label: "Communications", icon: "programs", sub: [
          { label: "Dial-Up Networking", icon: "dialup", click: () => W98.launch("dialup") },
          { label: "HyperTerminal", icon: "hyperterm", click: () => W98.launch("hyperterm") },
          { label: "Phone Dialer", icon: "phone", click: () => W98.launch("dialer") }
        ]},
        { label: "Entertainment", icon: "programs", sub: [
          { label: "Composer 98", icon: "composer", click: () => W98.launch("composer") },
          { label: "MEGADEMO 98", icon: "megademo", click: () => W98.launch("megademo") },
          { label: "TV98", icon: "tv98", click: () => W98.launch("tv98") },
          { label: "DeskPet 98", icon: "deskpet", click: () => W98.launch("deskpet") },
          { label: "CD Player", icon: "cdplayer", click: () => W98.launch("cdplayer") },
          { label: "Media Player", icon: "mediaplayer", click: () => W98.launch("media") },
          { label: "Sound Recorder", icon: "sndrec", click: () => W98.launch("sndrec") },
          { label: "Volume Control", icon: "sounds", click: () => W98.launch("sounds") }
        ]},
        { label: "Games", icon: "programs", sub: [
          { label: "CORRIDOR 98", icon: "corridor", click: () => W98.launch("corridor") },
          { label: "FreeCell", icon: "freecell", click: () => W98.launch("freecell") },
          { label: "Hearts", icon: "hearts", click: () => W98.launch("hearts") },
          { label: "Minesweeper", icon: "minesweeper", click: () => W98.launch("minesweeper") },
          { label: "Powder Hill", icon: "ski", click: () => W98.launch("ski") },
          { label: "Solitaire", icon: "solitaire", click: () => W98.launch("solitaire") },
          { label: "Spider Solitaire", icon: "spider", click: () => W98.launch("spider") },
          { label: "Stackz", icon: "stackz", click: () => W98.launch("stackz") },
          { label: "Star Pilot Pinball", icon: "pinball", click: () => W98.launch("pinball") },
          { label: "WallBall", icon: "wallball", click: () => W98.launch("wallball") },
          { label: "Worm 98", icon: "worm", click: () => W98.launch("worm") }
        ]},
        { label: "Accessibility", icon: "magnifier", sub: [
          { label: "Magnifier", icon: "magnifier", click: () => W98.launch("magnifier") },
          { label: "On-Screen Keyboard", icon: "osk", click: () => W98.launch("osk") }
        ]},
        { label: "Address Book", icon: "addrbook", click: () => W98.launch("addrbook") },
        { label: "Calendar 98", icon: "calendar", click: () => W98.launch("calendar") },
        { label: "Sticky Notes", icon: "sticky", click: () => W98.launch("stickies") },
        { label: "Clipboard Viewer", icon: "clipboard", click: () => W98.launch("clipbook") },
        { label: "System Tools", icon: "programs", sub: [
          { label: "Character Map", icon: "charmap", click: () => W98.launch("charmap") },
          { label: "Disk Defragmenter", icon: "defrag", click: () => W98.launch("defrag") },
          { label: "Registry Editor", icon: "exefile", click: () => W98.launch("regedit") },
          { label: "ScanDisk", icon: "scandisk", click: () => W98.launch("scandisk") },
          { label: "System Monitor", icon: "sysmon", click: () => W98.launch("sysmon") },
          { label: "VirusScan 98", icon: "shield", click: () => W98.launch("vscan") }
        ]},
        { label: "Encyclopedia 98", icon: "encarta", click: () => W98.launch("encarta") },
        "-",
        { label: "Calculator", icon: "calc", click: () => W98.launch("calc") },
        { label: "Notepad", icon: "notepad", click: () => W98.launch("notepad") },
        { label: "Paint", icon: "paint", click: () => W98.launch("paint") },
        { label: "WordPad", icon: "wordpad", click: () => W98.launch("wordpad") }
      ]},
      { label: "Office 98", icon: "programs", sub: [
        { label: "Word", icon: "writer", click: () => W98.launch("writer") },
        { label: "Excel", icon: "sheet", click: () => W98.launch("spreadsheet") },
        { label: "PowerPoint", icon: "slides", click: () => W98.launch("slides") }
      ]},
      { label: "Internet Explorer", icon: "ie", click: () => W98.launch("ie") },
      { label: "Internet Mail", icon: "mail", click: () => W98.launch("mail") },
      { label: "Claude Desktop 98", icon: "claude98", click: () => W98.launch("claude98") },
      { label: "ChatterBox IRC", icon: "chatterbox", click: () => W98.launch("chatterbox") },
      { label: "NetMeet 98", icon: "netmeet", click: () => W98.launch("netmeet") },
      { label: "PhotoGoo", icon: "photogoo", click: () => W98.launch("photogoo") },
      { label: "MegaAmp", icon: "megaamp", click: () => W98.launch("megaamp") },
      { label: "Media Player 98", icon: "tv98", click: () => W98.launch("mediaplayer") },
      { label: "SurrealPlayer G2", icon: "surreal", click: () => W98.launch("surreal") },
      { label: "MS-DOS Prompt", icon: "dos", click: () => W98.launch("dos") },
      { label: "NetGrab", icon: "netgrab", click: () => W98.launch("netgrab") },
      { label: "Pal Messenger", icon: "pal", click: () => W98.launch("pal") },
      { label: "PageCrafter Express", icon: "pagecrafter", click: () => W98.launch("pagecrafter") },
      { label: "VirusScan 98", icon: "shield", click: () => W98.launch("vscan") },
      { label: "Windows Explorer", icon: "folderopen", click: () => W98.launch("explorer", "C:") },
      { label: "ZipMaster 7.1", icon: "zipmaster", click: () => W98.launch("zipmaster") }
    ];
    const docItems = [
      { label: "My Documents", icon: "mydocs", click: () => W98.launch("explorer", FS.DOCS) },
      "-",
      ...(recent.length
        ? recent.map(p => ({ label: FS.segs(p).pop(), icon: FS.get(p) ? FS.iconFor(FS.segs(p).pop(), FS.get(p)) : "file", click: () => W98.openPath(p) }))
        : [{ label: "(Empty)", disabled: true }])
    ];
    const setItems = [
      { label: "Control Panel", icon: "settings", click: () => W98.launch("explorer", "::ControlPanel") },
      { label: "Regional Settings", icon: "settings", click: () => W98.launch("regional") },
      { label: "Taskbar & Start Menu...", icon: "settings", click: () => taskbarProps() },
      "-",
      { label: "Active Desktop", icon: "display", sub: [
        { label: "View As Web Page (Channel Bar)", checked: W98.ChannelBar && W98.ChannelBar.enabled(), click: () => W98.ChannelBar.toggle() },
        "-",
        { label: "Customize my Desktop...", click: () => W98.launch("display") }
      ]}
    ];
    const findItems = [
      { label: "Files or Folders...", icon: "find", click: () => W98.launch("find") },
      { label: "On the Internet...", icon: "ie", click: () => W98.launch("ie", "search") }
    ];
    const favs = Store.get("favorites", []);
    const favItems = favs.length
      ? favs.map(f => ({ label: f.title, icon: "ie", click: () => W98.launch("ie", f.url) }))
      : [{ label: "(Empty — add pages in Internet Explorer)", disabled: true }];
    return [
      { label: "Windows Update", icon: "ie", click: () => W98.launch("ie", "http://update.web98.net/") },
      { label: "Autopilot 98", icon: "claude98", click: () => W98.Autopilot.confirmStart() },
      "-",
      { label: "Programs", icon: "programs", sub: progItems },
      { label: "Favorites", icon: "favorites", sub: favItems },
      { label: "Documents", icon: "mydocs", sub: docItems },
      { label: "Settings", icon: "settings", sub: setItems },
      { label: "Find", icon: "find", sub: findItems },
      { label: "Help", icon: "help", click: () => W98.launch("help") },
      { label: "Run...", icon: "run", click: () => W98.launch("run") },
      "-",
      { label: "Log Off...", icon: "logoff", click: logOff },
      { label: "Shut Down...", icon: "shutdown", click: () => W98.Boot.shutdownDialog() }
    ];
  }

  function toggleStart() {
    if (startOpen) { Menu.closeAll(); startOpen = false; syncStartBtn(); return; }
    Menu.closeAll();
    const small = Store.get("smallStartIcons", false);
    const panel = el("div", { class: "menu-pop", id: "startmenu" });
    const side = el("div", { class: "sm-side" }, el("span", {}, el("b", { text: "Windows" }), "98"));
    const itemsHolder = el("div", { class: "sm-items" });
    panel.append(side, itemsHolder);

    const items = startItems();
    let curHot = null;
    items.forEach((it) => {
      if (it === "-") { itemsHolder.append(el("div", { class: "sm-hr" })); return; }
      const row = el("div", { class: "menu-item" });
      if (small) row.style.minHeight = "20px";
      const iconSize = small ? 16 : 32;
      row.append(Icons.img(it.icon, iconSize));
      row.append(el("span", { text: it.label }));
      if (it.sub) row.append(el("span", { class: "sub-arrow" }));
      row.addEventListener("mouseenter", () => {
        $$(".menu-item", itemsHolder).forEach(r => r.classList.remove("hot"));
        row.classList.add("hot");
        clearTimeout(row._t);
        row._t = setTimeout(() => {
          Menu.closeFrom(1);
          if (it.sub) {
            const r = row.getBoundingClientRect();
            Menu.showAt(r.right - 3, r.top - 3, it.sub, 1, { fromLeft: r.left });
          }
        }, 260);
      });
      row.addEventListener("mouseup", (e) => {
        if (e.button !== 0) return;
        if (it.sub) {
          Menu.closeFrom(1);
          const r = row.getBoundingClientRect();
          Menu.showAt(r.right - 3, r.top - 3, it.sub, 1, { fromLeft: r.left });
          return;
        }
        Menu.closeAll(); startOpen = false; syncStartBtn();
        if (it.click) setTimeout(it.click, 0);
      });
      itemsHolder.append(row);
    });

    panel.style.visibility = "hidden";
    $("#overlays").append(panel);
    const ph = panel.offsetHeight, pw = panel.offsetWidth;
    /* classic slide-up: clip wrapper anchored above the taskbar */
    const wrap = el("div", { style: `position:absolute;overflow:hidden;left:2px;top:${window.innerHeight - 28 - ph}px;width:${pw}px;height:${ph}px;z-index:5000` });
    wrap.append(panel);
    $("#overlays").append(wrap);
    panel.style.position = "static";
    panel.style.visibility = "";
    panel.style.transform = "translateY(100%)";
    void panel.offsetWidth;
    panel.style.transition = "transform 130ms ease-out";
    panel.style.transform = "translateY(0)";
    setTimeout(() => { panel.style.transition = ""; panel.style.transform = ""; }, 160);
    Menu.adopt(wrap, 0);
    startOpen = true;
    syncStartBtn();
    Sound.play("menu");
  }

  function syncStartBtn() {
    $("#start-btn").classList.toggle("down", startOpen);
  }

  function logOff() {
    const who = Store.get("userName", "");
    WM.msgbox({
      title: "Log Off Windows", icon: "question",
      text: "Are you sure you want to log off" + (who ? " " + who : "") + "?",
      buttons: ["Yes", "No"], defaultBtn: 1
    }).then(r => {
      if (r === "Yes") {
        Store.saveNow();
        try { sessionStorage.setItem("w98logoff", "1"); } catch (e) {}
        location.reload();
      }
    });
  }

  /* ---------- taskbar properties ---------- */
  function taskbarProps() {
    const win = WM.create({
      title: "Taskbar Properties", icon: "settings", width: 380, height: 330,
      resizable: false, maximizable: false, noTaskbar: true, center: true
    });
    win.body.style.padding = "8px";
    let autoHide = Store.get("autoHide", false);
    let showClock = Store.get("showClock", true);
    let smallIcons = Store.get("smallStartIcons", false);
    const tabs = Dialogs.makeTabs([{
      label: "Taskbar Options",
      build(page) {
        const mk = (label, val, fn) => {
          const c = el("label", { class: "checkline" }, el("input", { type: "checkbox" }), label);
          const inp = $("input", c);
          inp.checked = val;
          inp.addEventListener("change", () => fn(inp.checked));
          return c;
        };
        page.append(
          el("div", { style: "padding:6px 2px", text: "Adjust the way the taskbar behaves:" }),
          mk("Always on top", true, () => {}),
          mk("Auto hide", autoHide, v => autoHide = v),
          mk("Show small icons in Start menu", smallIcons, v => smallIcons = v),
          mk("Show clock", showClock, v => showClock = v)
        );
      }
    }]);
    const btnRow = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:8px 2px 2px" });
    const apply = () => {
      Store.set("autoHide", autoHide);
      Store.set("showClock", showClock);
      Store.set("smallStartIcons", smallIcons);
      applyOptions();
    };
    const ok = el("button", { class: "btn default", text: "OK", onclick: () => { apply(); win.close(); } });
    const cancel = el("button", { class: "btn", text: "Cancel", onclick: () => win.close() });
    const applyBtn = el("button", { class: "btn", text: "Apply", onclick: apply });
    btnRow.append(ok, cancel, applyBtn);
    win.body.append(tabs.el, btnRow);
  }

  function applyOptions() {
    const tb = $("#taskbar");
    tb.classList.toggle("autohide", Store.get("autoHide", false));
    if (!Store.get("autoHide", false)) tb.classList.remove("hidden-bar");
    $("#clock").style.display = Store.get("showClock", true) ? "" : "none";
  }

  /* ---------- task buttons ---------- */
  function addTaskBtn(win) {
    const b = el("button", { class: "task-btn", dataset: { tip: win.title } });
    b.append(Icons.img(win.icon, 16), el("span", { text: win.title }));
    b.addEventListener("click", () => {
      if (win.minimized) { win.focus(); }
      else if (win.el.classList.contains("focused")) win.minimize();
      else win.focus();
    });
    b.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      Menu.popup(e.clientX, e.clientY, [
        { label: "Restore", disabled: !win.minimized && !win.maximized, click: () => { win.restore(); win.focus(); } },
        { label: "Minimize", disabled: win.minimized, click: () => win.minimize() },
        { label: "Maximize", disabled: win.maximized || win.opts.maximizable === false, click: () => { win.focus(); win.toggleMax(); } },
        "-",
        { label: "Close", bold: true, click: () => win.close() }
      ], { up: true });
    });
    taskBtns.set(win.id, b);
    $("#task-buttons").append(b);
    syncActive();
  }
  function syncActive() {
    const top = WM.topWin();
    taskBtns.forEach((b, id) => {
      const w = WM.wins.find(x => x.id === id);
      b.classList.toggle("active", !!w && w === top && !w.minimized);
    });
  }

  /* ---------- tray ---------- */
  function volumePopup(anchor) {
    const pop = el("div", { class: "menu-pop", style: "width:60px;min-width:0;padding:6px 4px;display:flex;flex-direction:column;align-items:center;gap:4px" });
    pop.append(el("div", { text: "Volume", style: "font-size:10px" }));
    const slider = el("input", { type: "range", min: "0", max: "100", value: String(Math.round(Sound.volume * 100)) });
    slider.style.cssText = "writing-mode:vertical-lr;direction:rtl;height:80px;width:22px";
    slider.addEventListener("input", () => { Sound.volume = slider.value / 100; });
    slider.addEventListener("change", () => Sound.play("ding"));
    const mute = el("label", { class: "checkline", style: "font-size:10px" }, el("input", { type: "checkbox" }), "Mute");
    const mi = $("input", mute);
    mi.checked = !Sound.enabled;
    mi.addEventListener("change", () => { Sound.enabled = !mi.checked; });
    pop.append(slider, mute);
    const r = anchor.getBoundingClientRect();
    Menu.closeAll();
    pop.style.visibility = "hidden";
    $("#overlays").append(pop);
    pop.style.left = Math.min(r.left, window.innerWidth - pop.offsetWidth - 4) + "px";
    pop.style.top = (r.top - pop.offsetHeight - 6) + "px";
    pop.style.visibility = "";
    Menu.adopt(pop, 0);
  }

  function initTray() {
    const vol = Icons.img("volume", 16);
    vol.dataset.tip = "Volume";
    vol.style.cursor = "default";
    vol.addEventListener("click", () => volumePopup(vol));
    vol.addEventListener("dblclick", () => W98.launch("sounds"));
    $("#tray-icons").append(vol);

    /* unread-mail envelope in the tray, the way it should be */
    let mailIcon = null;
    function syncMailIcon() {
      const mail = Store.get("mail", null);
      const unread = mail ? (mail.Inbox || []).filter(m => !m.read).length : 0;
      if (unread && !mailIcon) {
        mailIcon = Icons.img("mail", 16);
        mailIcon.style.cursor = "default";
        mailIcon.addEventListener("click", () => W98.launch("mail"));
        $("#tray-icons").prepend(mailIcon);
      } else if (!unread && mailIcon) {
        mailIcon.remove();
        mailIcon = null;
      }
      if (mailIcon) mailIcon.dataset.tip = "You have " + unread + " unread message" + (unread === 1 ? "" : "s");
    }

    /* someone out there is writing to you */
    const LATE_MAIL = [
      { from: "Aunt Carol", subj: "FW: FW: FW: FW: this one is REALLY important", body: "> > > > If you do not forward this to 15 people\n> > > > your keyboard will develop a sticky key!!\n\nBetter safe than sorry sweetie.\n\n- Aunt Carol" },
      { from: "My ISP Newsletter", subj: "NEW: now with 150 free hours!", body: "Dear Valued Customer,\n\nGreat news! Your plan now includes 150 hours.\nYou have used 149 of them this week.\n\n— My ISP, \"The Internet People\"" },
      { from: "CoolDave2000", subj: "check out netgrab", body: "dude get on netgrab i found a song called defrag boogie\nit is EXACTLY what it sounds like\n\n- dave" }
    ];
    setTimeout(() => {
      const mail = Store.get("mail", null);
      if (!mail || !mail.Inbox) return;
      const pick = LATE_MAIL[(Math.random() * LATE_MAIL.length) | 0];
      mail.Inbox.push({ from: pick.from, subj: pick.subj, at: Date.now(), read: false, body: pick.body });
      Store.set("mail", mail);
      Sound.play("ding");
      syncMailIcon();
    }, 150000 + Math.random() * 120000);

    const clock = $("#clock");
    function tick() {
      const d = new Date();
      clock.textContent = fmtTime(d);
      clock.dataset.tip = fmtDate(d);
      syncMailIcon();
    }
    tick();
    setInterval(tick, 1000);
    clock.addEventListener("dblclick", () => W98.launch("datetime"));
  }

  /* ---------- quick launch ---------- */
  function initQuickLaunch() {
    const ql = $("#quicklaunch");
    const mk = (icon, title, fn) => {
      const b = el("button", { class: "ql-btn", dataset: { tip: title } });
      b.append(Icons.img(icon, 16));
      b.addEventListener("click", fn);
      ql.append(b);
    };
    mk("ie", "Launch Internet Explorer Browser", () => W98.launch("ie"));
    mk("mail", "Launch Internet Mail", () => W98.launch("mail"));
    mk("display", "Show Desktop", () => WM.minimizeAll());
  }

  /* ---------- taskbar context menu ---------- */
  function initContext() {
    $("#taskbar").addEventListener("contextmenu", (e) => {
      if (e.target.closest(".task-btn") || e.target.closest("#tray")) return;
      e.preventDefault();
      Menu.popup(e.clientX, e.clientY, [
        { label: "Toolbars", sub: [
          { label: "Quick Launch", checked: true, click: () => {
            const ql = $("#quicklaunch");
            ql.style.display = ql.style.display === "none" ? "" : "none";
          }}
        ]},
        "-",
        { label: "Cascade Windows", click: () => WM.cascadeAll() },
        { label: "Tile Windows Horizontally", click: () => WM.tile(false) },
        { label: "Tile Windows Vertically", click: () => WM.tile(true) },
        "-",
        { label: "Minimize All Windows", click: () => WM.minimizeAll() },
        "-",
        { label: "Properties", click: taskbarProps }
      ], { up: true });
    });
    $("#tray").addEventListener("contextmenu", (e) => {
      e.preventDefault();
      Menu.popup(e.clientX, e.clientY, [
        { label: "Adjust Date/Time", click: () => W98.launch("datetime") },
        "-",
        { label: "Properties", click: taskbarProps }
      ], { up: true });
    });
  }

  /* ---------- auto-hide ---------- */
  function initAutoHide() {
    document.addEventListener("mousemove", (e) => {
      const tb = $("#taskbar");
      if (!tb.classList.contains("autohide")) return;
      if (e.clientY > window.innerHeight - 6) tb.classList.remove("hidden-bar");
      else if (e.clientY < window.innerHeight - 34 && !startOpen && !tb.contains(document.activeElement)) tb.classList.add("hidden-bar");
    });
  }

  function init() {
    const paintStartFlag = () => {
      $("#start-btn").querySelector(".start-flag").style.backgroundImage = `url(${Icons.startFlagUrl()})`;
    };
    paintStartFlag();
    W98.bus.on("branding", paintStartFlag);
    $("#start-btn").addEventListener("mousedown", (e) => { e.preventDefault(); e.stopPropagation(); toggleStart(); });
    W98.bus.on("win-open", addTaskBtn);
    W98.bus.on("win-close", (w) => { const b = taskBtns.get(w.id); if (b) { b.remove(); taskBtns.delete(w.id); } syncActive(); });
    W98.bus.on("win-focus", syncActive);
    W98.bus.on("win-min", syncActive);
    W98.bus.on("win-title", (w) => {
      const b = taskBtns.get(w.id);
      if (b) { $("span", b).textContent = w.title; $("img", b).src = Icons.get(w.icon, 16); b.dataset.tip = w.title; }
    });
    W98.bus.on("menus-closed", () => { startOpen = false; syncStartBtn(); });
    initTray();
    initQuickLaunch();
    initContext();
    initAutoHide();
    applyOptions();
    // keyboard: Ctrl+Esc opens start menu
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Escape") { e.preventDefault(); toggleStart(); }
    });
  }

  function buttonRect(winId) {
    const b = taskBtns.get(winId);
    return b ? b.getBoundingClientRect() : null;
  }

  return { init, toggleStart, taskbarProps, buttonRect, trayIcons: () => $("#tray-icons") };
})();

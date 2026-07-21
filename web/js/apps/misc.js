/* misc.js — Run, Find Files, Help, Regedit */
"use strict";
W98.Apps = W98.Apps || {};

/* ================= Run ================= */
W98.Apps.run = {
  name: "Run", icon: "run", single: true,
  launch() {
    const win = WM.create({
      title: "Run", icon: "run", appId: "run",
      width: 360, height: 0, resizable: false, minimizable: false, maximizable: false, center: true
    });
    win.el.style.height = "auto";
    const inp = el("input", { type: "text", class: "field", style: "width:100%;flex:1" });
    const histB = el("button", { class: "btn", text: "▾", style: "min-width:20px;padding:0 3px" });
    histB.addEventListener("click", () => {
      const hist = Store.get("runHistory", []);
      const r = histB.getBoundingClientRect();
      Menu.popup(r.left - 120, r.bottom + 2, hist.length
        ? hist.map(h => ({ label: h, click: () => { inp.value = h; inp.focus(); } }))
        : [{ label: "(No history)", disabled: true }]);
    });
    const row = el("div", { style: "display:flex;gap:12px;padding:14px 14px 6px" },
      Icons.img("run", 32),
      el("div", { style: "flex:1" },
        el("div", { text: "Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.", style: "margin-bottom:8px;line-height:1.4" }),
        el("div", { style: "display:flex;align-items:center;gap:6px" }, el("span", { text: "Open:" }), inp, histB)));
    const btns = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:6px 14px 12px" });
    const ok = el("button", { class: "btn default", text: "OK" });
    const cancel = el("button", { class: "btn", text: "Cancel" });
    const browse = el("button", { class: "btn", text: "Browse..." });
    const APPS = {
      notepad: "notepad", "notepad.exe": "notepad", calc: "calc", "calc.exe": "calc",
      mspaint: "paint", "mspaint.exe": "paint", pbrush: "paint", paint: "paint",
      winmine: "minesweeper", "winmine.exe": "minesweeper", sol: "solitaire", "sol.exe": "solitaire",
      explorer: "explorer", "explorer.exe": "explorer", iexplore: "ie", "iexplore.exe": "ie",
      command: "dos", "command.com": "dos", cmd: "dos", control: "control-panel",
      regedit: "regedit", "regedit.exe": "regedit", help: "help", winver: "winver",
      wordpad: "wordpad", "wordpad.exe": "wordpad", write: "wordpad", word: "writer", winword: "writer",
      excel: "spreadsheet", "excel.exe": "spreadsheet", powerpnt: "slides", powerpoint: "slides",
      cdplayer: "cdplayer", mplayer: "media", mplayer2: "media", charmap: "charmap", sndvol32: "sounds",
      freecell: "freecell", "freecell.exe": "freecell", defrag: "defrag", "defrag.exe": "defrag",
      scandisk: "scandisk", scandskw: "scandisk", "scandskw.exe": "scandisk",
      dialup: "dialup", dun: "dialup", rasphone: "dialup", dialer: "dialer", "dialer.exe": "dialer", phone: "dialer",
      mshearts: "hearts", "mshearts.exe": "hearts", hearts: "hearts",
      sndrec32: "sndrec", "sndrec32.exe": "sndrec", mail: "mail", inetmail: "mail", msimn: "mail",
      pal: "pal", "pal.exe": "pal", megaamp: "megaamp", amp: "megaamp", netgrab: "netgrab",
      vscan: "vscan", virusscan: "vscan", "vscan.exe": "vscan",
      pinball: "pinball", ski: "ski", wallball: "wallball", worm: "worm", nibbles: "worm",
      stackz: "stackz", tetris: "stackz", encarta: "encarta", encyclopedia: "encarta",
      magnify: "magnifier", magnifier: "magnifier", osk: "osk", clipbrd: "clipbook",
      wab: "addrbook", addressbook: "addrbook",
      winzip: "zipmaster", zip: "zipmaster", mirc: "chatterbox", irc: "chatterbox",
      hypertrm: "hyperterm", hyperterminal: "hyperterm", bbs: "hyperterm",
      claude: "claude98", claude98: "claude98", assistant: "claude98",
      calendar: "calendar", cal: "calendar", stickies: "stickies", note: "stickies",
      intl: "regional", regional: "regional", language: "regional", "intl.cpl": "regional",
      corridor: "corridor", doom: "corridor", fps: "corridor",
      composer: "composer", tracker: "composer",
      megademo: "megademo", demo: "megademo",
      tv: "tv98", tv98: "tv98", deskpet: "deskpet", pet: "deskpet", tamago: "deskpet",
      spider: "spider", sysmon: "sysmon", perfmon: "sysmon",
      photogoo: "photogoo", goo: "photogoo", netmeet: "netmeet", netmeeting: "netmeet",
      pagecrafter: "pagecrafter", frontpage: "pagecrafter", homepage: "pagecrafter",
      realplay: "surreal", realplayer: "surreal",
      appwiz: "addremove", "appwiz.cpl": "addremove", printers: "printqueue-open",
      themes: "themes", "themes.cpl": "themes", mouse: "mouse", "main.cpl": "mouse",
      "desk.cpl": "display", "timedate.cpl": "datetime", "mmsys.cpl": "sounds", "sysdm.cpl": "sysprops",
      cdplayer: "cdplayer"
    };
    function run() {
      const v = inp.value.trim();
      if (!v) return;
      const hist = Store.get("runHistory", []).filter(h => h !== v);
      hist.unshift(v); hist.length = Math.min(hist.length, 12);
      Store.set("runHistory", hist);
      const key = v.toLowerCase();
      win.close();
      if (APPS[key] === "control-panel") { W98.launch("explorer", "::ControlPanel"); return; }
      if (APPS[key] === "printqueue-open") { W98.Print.openQueue(); return; }
      if (APPS[key] === "winver") { Dialogs.about("Windows 98", "mycomputer"); return; }
      if (APPS[key]) { W98.launch(APPS[key]); return; }
      if (/^[a-z]:[\\/]/i.test(v) || v.startsWith("\\")) {
        if (FS.exists(v)) { W98.openPath(v); return; }
      }
      if (/^(https?:\/\/|www\.)/i.test(v)) { W98.launch("ie"); return; }
      WM.msgbox({
        title: v, icon: "error",
        text: "Cannot find the file '" + v + "' (or one of its components). Make sure the path and filename are correct and that all required libraries are available."
      });
    }
    ok.addEventListener("click", run);
    cancel.addEventListener("click", () => win.close());
    browse.addEventListener("click", async () => {
      const p = await Dialogs.filePick({ mode: "open", title: "Browse", typeName: "Programs (*.exe)", ext: [".exe", ".com"], startDir: "C:/Windows" });
      if (p) inp.value = FS.display(p);
    });
    inp.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") run(); });
    btns.append(ok, cancel, browse);
    win.body.append(row, btns);
    setTimeout(() => inp.focus(), 50);
    return win;
  }
};

/* ================= Find: Files or Folders ================= */
W98.Apps.find = {
  name: "Find: Files or Folders", icon: "find", single: true,
  launch() {
    const win = WM.create({
      title: "Find: All Files", icon: "find", appId: "find",
      width: 480, height: 380, minWidth: 400, minHeight: 300,
      statusbar: [""]
    });
    const form = el("div", { style: "padding:10px;flex:none;display:grid;grid-template-columns:auto 1fr auto;gap:8px 10px;align-items:center" });
    const named = el("input", { type: "text", class: "field" });
    const lookIn = el("select", { class: "field" });
    [["(C:)", "C:"], ["My Documents", FS.DOCS], ["Desktop", FS.DESKTOP], ["Windows", "C:/Windows"]].forEach(([t, v]) => lookIn.append(el("option", { text: t, value: v })));
    const findBtn = el("button", { class: "btn default", text: "Find Now" });
    const newBtn = el("button", { class: "btn", text: "New Search" });
    form.append(
      el("span", { text: "Named:" }), named, findBtn,
      el("span", { text: "Look in:" }), lookIn, newBtn
    );
    const results = el("div", { class: "listview sunken", style: "flex:1;margin:0 10px 10px" });
    win.body.append(form, results);

    function doFind() {
      const q = named.value.trim();
      results.innerHTML = "";
      if (!q) { win.setStatus(0, "Enter a file name to search for."); return; }
      const found = FS.find(q, lookIn.value);
      const table = el("table", { style: "border-collapse:collapse;width:100%" });
      const hd = el("tr");
      ["Name", "In Folder", "Size", "Type"].forEach(h => hd.append(el("th", { text: h, style: "text-align:left;padding:2px 6px;background:var(--face);box-shadow:inset -1px -1px var(--dark), inset 1px 1px var(--lighter)" })));
      table.append(hd);
      for (const { path, node } of found) {
        const name = FS.segs(path).pop();
        const tr = el("tr");
        const td = el("td", { style: "padding:1px 6px;white-space:nowrap" });
        td.append(Icons.img(FS.iconFor(name, node), 16), el("span", { text: " " + name }));
        tr.append(td,
          el("td", { text: FS.display(FS.segs(path).slice(0, -1).join("/")), style: "padding:1px 6px;white-space:nowrap" }),
          el("td", { text: node.t === "f" ? fmtSize(FS.sizeOf(node)) : "", style: "padding:1px 6px" }),
          el("td", { text: FS.typeName(name, node), style: "padding:1px 6px;white-space:nowrap" }));
        tr.addEventListener("dblclick", () => W98.openPath(path));
        tr.addEventListener("mousedown", () => {
          $$("tr", table).forEach(r => r.style.background = "");
          tr.style.background = "var(--hl)"; tr.style.color = "#fff";
        });
        table.append(tr);
      }
      results.append(table);
      win.setStatus(0, found.length + " file(s) found");
    }
    findBtn.addEventListener("click", doFind);
    newBtn.addEventListener("click", () => { named.value = ""; results.innerHTML = ""; win.setStatus(0, ""); named.focus(); });
    named.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") doFind(); });
    setTimeout(() => named.focus(), 50);
    return win;
  }
};

/* ================= Help ================= */
W98.Apps.help = {
  name: "Windows Help", icon: "help", single: true,
  launch(topic) {
    const TOPICS = (W98.uiLang === "zh-TW" && W98.HelpTopicsZh) ? W98.HelpTopicsZh : W98.HelpTopics;

    const win = WM.create({
      title: "Windows Help", icon: "help", appId: "help",
      width: 620, height: 440, minWidth: 460, minHeight: 300,
      menus: [
        { label: "Options", items: () => [
          { label: "Home", click: () => select("tour") },
          "-",
          { label: "About Windows 98", click: () => Dialogs.about("Windows 98", "mycomputer") }
        ]}
      ]
    });
    const body = el("div", { class: "help-body" });
    const toc = el("div", { class: "tree sunken help-toc" });
    const pane = el("div", { class: "help-topic sunken" });
    body.append(toc, pane);
    win.body.append(body);
    win.body.style.padding = "3px";

    let cur = null;
    function select(id) {
      cur = id;
      pane.innerHTML = (TOPICS[id] && typeof TOPICS[id] !== "string") ? TOPICS[id][1] : "<p>Topic not found.</p>";
      $$(".tree-row", toc).forEach(r => r.classList.toggle("sel", r.dataset.id === id));
    }
    for (const id in TOPICS) {
      if (typeof TOPICS[id] === "string") {
        toc.append(el("div", { style: "font-weight:700;color:#000080;padding:6px 4px 2px;font-size:10px;letter-spacing:1px", text: TOPICS[id] }));
        continue;
      }
      const row = el("div", { class: "tree-row", dataset: { id } });
      row.append(Icons.img("help", 16), el("span", { class: "tlabel", text: TOPICS[id][0] }));
      row.addEventListener("mousedown", () => select(id));
      toc.append(row);
    }
    select(TOPICS[topic] ? topic : "tour");
    win.reopen = (w, t) => { if (TOPICS[t]) select(t); };
    W98.Apps.help.reopen = (w, t) => { if (typeof t === "string" && TOPICS[t]) select(t); };
    return win;
  }
};

/* ================= Regedit (read-only browser) ================= */
W98.Apps.regedit = {
  name: "Registry Editor", icon: "exefile", single: true,
  launch() {
    const REG = {
      "HKEY_CLASSES_ROOT": { ".txt": { "(Default)": "txtfile" }, ".bmp": { "(Default)": "Paint.Picture" }, "txtfile": { "(Default)": "Text Document" } },
      "HKEY_CURRENT_USER": {
        "Control Panel": {
          "Desktop": { "Wallpaper": () => Store.get("wallpaper", "(None)"), "ScreenSaveTimeOut": () => String(Store.get("ssWait", 15) * 60) },
          "Colors": { "Scheme": () => Store.get("scheme", "Windows Standard") }
        },
        "Software": { "Microsoft": { "Windows": { "CurrentVersion": { "Explorer": { "CleanShutdown": "0x00000001" } } } } }
      },
      "HKEY_LOCAL_MACHINE": {
        "Software": { "Microsoft": { "Windows": { "CurrentVersion": { "ProductName": "Windows 98", "VersionNumber": "4.10.1998", "RegisteredOwner": "A Nostalgic User" } } } },
        "Hardware": { "Description": { "System": { "CentralProcessor": { "0": { "Identifier": "x86 Family 6 Model 3 (Pentium II)" } } } } }
      },
      "HKEY_USERS": { ".DEFAULT": {} },
      "HKEY_DYN_DATA": { "PerfStats": {} }
    };
    const win = WM.create({
      title: "Registry Editor", icon: "exefile", appId: "regedit",
      width: 560, height: 380, minWidth: 400, minHeight: 260,
      statusbar: ["My Computer"],
      menus: [
        { label: "Registry", items: () => [{ label: "Exit", click: () => win.close() }] },
        { label: "Help", items: () => [{ label: "About Registry Editor", click: () => Dialogs.about("Registry Editor", "exefile", ["Look, don't touch.", "(This registry is read-only, for everyone's safety.)"]) }] }
      ]
    });
    const body = el("div", { class: "exp-body" });
    const tree = el("div", { class: "tree sunken", style: "width:240px;flex:none;margin-right:3px" });
    const vals = el("div", { class: "listview sunken", style: "flex:1" });
    body.append(tree, vals);
    win.body.append(body);
    const open = new Set(["My Computer"]);
    let selPath = null;
    function isLeafVals(node) {
      return Object.values(node).every(v => typeof v !== "object" || typeof v === "function");
    }
    function showVals(node, path) {
      vals.innerHTML = "";
      const table = el("table", { style: "width:100%;border-collapse:collapse" });
      const hd = el("tr");
      ["Name", "Data"].forEach(h => hd.append(el("th", { text: h, style: "text-align:left;padding:2px 6px;background:var(--face);box-shadow:inset -1px -1px var(--dark), inset 1px 1px var(--lighter)" })));
      table.append(hd);
      let any = false;
      for (const k in node) {
        const v = node[k];
        if (typeof v === "object") continue;
        any = true;
        const tr = el("tr");
        tr.append(el("td", { text: k, style: "padding:1px 6px" }), el("td", { text: typeof v === "function" ? v() : v, style: "padding:1px 6px" }));
        table.append(tr);
      }
      if (!any) {
        const tr = el("tr");
        tr.append(el("td", { text: "(Default)", style: "padding:1px 6px" }), el("td", { text: "(value not set)", style: "padding:1px 6px;color:#808080" }));
        table.append(tr);
      }
      vals.append(table);
      win.setStatus(0, "My Computer\\" + path);
    }
    function paint() {
      tree.innerHTML = "";
      const rootRow = el("div", { class: "tree-row" });
      rootRow.append(el("div", { class: "tree-tg" }, el("div", { class: "box", text: "-" })), Icons.img("mycomputer", 16), el("span", { class: "tlabel", text: "My Computer" }));
      tree.append(rootRow);
      function walk(node, path, depth) {
        for (const k in node) {
          if (typeof node[k] !== "object") continue;
          const p = path ? path + "\\" + k : k;
          const kids = Object.keys(node[k]).some(x => typeof node[k][x] === "object");
          const row = el("div", { class: "tree-row", style: "padding-left:" + (depth * 16) + "px" });
          const tg = el("div", { class: "tree-tg" });
          if (kids) {
            const box = el("div", { class: "box", text: open.has(p) ? "-" : "+" });
            box.addEventListener("mousedown", (e) => { e.stopPropagation(); open.has(p) ? open.delete(p) : open.add(p); paint(); });
            tg.append(box);
          }
          row.append(tg, Icons.img("folder", 16), el("span", { class: "tlabel", text: k }));
          if (p === selPath) row.classList.add("sel");
          row.addEventListener("mousedown", () => { selPath = p; showVals(node[k], p); paint(); });
          tree.append(row);
          if (kids && open.has(p)) walk(node[k], p, depth + 1);
        }
      }
      walk(REG, "", 1);
    }
    paint();
    showVals({}, "");
    return win;
  }
};

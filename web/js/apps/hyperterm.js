/* hyperterm.js — HyperTerminal + the Midnight Tower BBS (555-TOWR).
   Message boards, a file area at 28.8k, and a door game with saved progress. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  const TOWER = [
    "        |>>>",
    "        |",
    "    _  _|_  _",
    "   |;|_|;|_|;|",
    "   \\.    .  /",
    "    \\:  .  /",
    "     ||:   |",
    "     ||:.  |",
    "     ||:  .|",
    "     ||:   |       M I D N I G H T   T O W E R   B B S",
    "     ||: , |            est. 1994 * 2 nodes * 28.8k",
    "     ||:   |         sysop: The Nightwatchman",
    "     ||: . |",
    "    _||_   |__"
  ].join("\n");

  const BOARDS = {
    "GENERAL": [
      { from: "Nightwatchman", subj: "welcome + rules", body: "welcome to the tower.\nrule 1: be excellent.\nrule 2: one file download at a time, the node is shared.\nrule 3: no arguing about star trek vs star wars in GENERAL. we have SCIFI for that." },
      { from: "modem_king", subj: "new 56k modems???", body: "saw a 56k modem at the computer store for $199.\nis this real life. my 28.8 suddenly feels like a potato.\n\n> reply from Nightwatchman: the tower will stay 28.8 until the phone company\n> fixes the line noise. so, forever." },
      { from: "wanda_wildcat", subj: "carpool to the computer show?", body: "computer show at the fairgrounds saturday.\ni have a van. it fits 6 nerds or 4 nerds with tower cases.\nfirst come first serve." }
    ],
    "SCIFI": [
      { from: "capt_proton", subj: "that finale (SPOILERS)", body: "i am not saying it was aliens.\nbut the writers clearly ran out of time.\n\n> reply from wanda_wildcat: it was aliens." },
      { from: "Nightwatchman", subj: "book club: neuromancer, again", body: "yes we read it last year. we are reading it again.\nthe sky above the port was the color of television, people. it rules." }
    ],
    "TRADING POST": [
      { from: "gearhead_gary", subj: "FS: 486DX2, runs great", body: "selling my 486 DX2/66. 8MB ram. turbo button works (does nothing, but works).\n$150 obo. will include a box of shareware floppies of mysterious origin." },
      { from: "wanda_wildcat", subj: "WTB: quiet mouse", body: "my mouse clicks echo through the house at 2am and my dad has OPINIONS.\nlooking for the quietest mouse known to science." }
    ]
  };

  const FILES = [
    { name: "TOWER.ANS", size: 4212, desc: "our ANSI art logo (you are looking at it)" },
    { name: "MODEM_FAQ.TXT", size: 18220, desc: "why your connection is bad: an honest guide", body: "MODEM FAQ v3\n\nQ: why is my connection slow\nA: line noise. also the weather. also the moon.\n\nQ: what do the lights mean\nA: they mean the modem is thinking. do not interrupt it.\n\nQ: my mom picked up the phone and--\nA: we know. we are so sorry. reconnect and try again." },
    { name: "SNOWBALL.BAS", size: 2048, desc: "throw snowballs at your friends (2 player)", body: "10 REM SNOWBALL by gearhead_gary\n20 PRINT \"this is a two player game\"\n30 PRINT \"player two is whoever is standing behind you\"\n40 END" },
    { name: "SECRETS.ZIP", size: 66601, desc: "sysop eyes only (password protected)" }
  ];

  W98.Apps.hyperterm = {
    name: "HyperTerminal", icon: "hyperterm", single: true,
    launch() {
      let mode = "offline";        /* offline | dialing | menu | boards | board | reading | files | doors | lord | who | posting */
      let sub = null, lineBuf = "", postStage = 0, postDraft = {};
      let timers = [];

      const win = WM.create({
        title: "HyperTerminal - (Disconnected)", icon: "hyperterm", appId: "hyperterm",
        width: 640, height: 430, minWidth: 480, minHeight: 300,
        statusbar: [{ text: "Disconnected" }, { text: "ANSI" }, { text: "28800 8-N-1" }],
        menus: [
          { label: "File", items: () => [
            { label: "Connect: Midnight Tower BBS", click: dial },
            { label: "Disconnect", disabled: mode === "offline", click: hangup },
            "-",
            { label: "Exit", click: () => win.close() }
          ]},
          { label: "Help", items: () => [
            { label: "About HyperTerminal", click: () => Dialogs.about("HyperTerminal", "hyperterm", ["Connecting you to towers since 1995."]) }
          ]}
        ]
      });
      const screen = el("div", { class: "dos-screen", style: "color:#c0c0c0" });
      win.body.append(screen);
      let out = "HyperTerminal ready.\n\nFile > Connect to dial the Midnight Tower BBS (555-TOWR).\n";
      function print(s) { out += (s == null ? "" : s) + "\n"; render(); }
      function cls() { out = ""; render(); }
      function render() {
        screen.textContent = out + (mode === "posting" || mode === "lord-input" ? "> " + lineBuf : "");
        screen.append(el("span", { class: "cursor" }));
        screen.scrollTop = screen.scrollHeight;
      }
      const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

      function dial() {
        if (mode !== "offline") return;
        if (W98.Net && W98.Net.connected) {
          cls();
          print("ATDT 555-8697");
          print("BUSY");
          print("");
          print("The line is busy \u2014 Dial-Up Networking is using it.");
          print("One phone line. Disconnect from the Internet first (tray icon).");
          render();
          return;
        }
        mode = "dialing";
        cls();
        print("ATDT 555-8697");
        Sound.play("dial"); Sound.play("click");
        later(() => print("DIALING..."), 500);
        later(() => { print("CARRIER 28800"); print("CONNECT 28800/ARQ/V34\n"); }, 1900);
        later(() => {
          win.setTitle("HyperTerminal - Midnight Tower BBS");
          win.setStatus(0, "Connected 00:00");
          welcome();
        }, 2600);
      }
      function hangup() {
        timers.forEach(clearTimeout);
        W98.bbsOnline = false;
        mode = "offline";
        print("\nNO CARRIER");
        win.setTitle("HyperTerminal - (Disconnected)");
        win.setStatus(0, "Disconnected");
      }
      function welcome() {
        W98.bbsOnline = true;
        mode = "menu";
        cls();
        print(TOWER);
        print("");
        print("  logged in as: caller #" + (Store.get("bbsCalls", 4211) + 1));
        Store.set("bbsCalls", Store.get("bbsCalls", 4211) + 1);
        mainMenu();
      }
      function mainMenu() {
        mode = "menu";
        print("");
        print("  ============ MAIN MENU ============");
        print("  [M] Message boards   [F] File area");
        print("  [D] Door games       [W] Who's online");
        print("  [G] Goodbye (log off)");
        print("  ===================================");
        print("  your command:");
      }

      /* ---------- boards ---------- */
      function showBoards() {
        mode = "boards";
        print("");
        print("  -- MESSAGE BOARDS --");
        Object.keys(BOARDS).forEach((b, i) => print("  [" + (i + 1) + "] " + b + " (" + boardMsgs(b).length + " msgs)"));
        print("  [P] post to GENERAL   [Q] back");
      }
      function boardMsgs(b) {
        return BOARDS[b].concat(b === "GENERAL" ? Store.get("bbsPosts", []) : []);
      }
      function showBoard(idx) {
        const names = Object.keys(BOARDS);
        if (idx < 0 || idx >= names.length) return;
        sub = names[idx];
        mode = "board";
        print("");
        print("  -- " + sub + " --");
        boardMsgs(sub).forEach((m, i) => print("  [" + (i + 1) + "] " + m.subj + "  (from " + m.from + ")"));
        print("  [#] read message   [Q] back");
      }
      function readMsg(i) {
        const msgs = boardMsgs(sub);
        if (i < 0 || i >= msgs.length) return;
        const m = msgs[i];
        print("");
        print("  From: " + m.from + "    Subj: " + m.subj);
        print("  " + "-".repeat(40));
        m.body.split("\n").forEach(l => print("  " + l));
        print("  " + "-".repeat(40));
        print("  [Q] back to " + sub);
      }
      function startPost() {
        mode = "posting"; postStage = 0; postDraft = {}; lineBuf = "";
        print("");
        print("  POST TO GENERAL");
        print("  subject? (type, then Enter)");
        render();
      }
      function postLine(t) {
        if (postStage === 0) {
          postDraft.subj = t || "(no subject)"; postStage = 1;
          print("> " + t); print("  message? (one line, Enter to post)");
        } else {
          postDraft.body = t || "(empty)";
          print("> " + t);
          const posts = Store.get("bbsPosts", []);
          posts.push({ from: "you", subj: postDraft.subj, body: postDraft.body });
          Store.set("bbsPosts", posts);
          print("  posted. the tower thanks you.");
          mode = "boards"; showBoards();
        }
      }

      /* ---------- files ---------- */
      function showFiles() {
        mode = "files";
        print("");
        print("  -- FILE AREA --");
        FILES.forEach((f, i) => print("  [" + (i + 1) + "] " + f.name.padEnd(14) + fmtSize(f.size).padStart(8) + "  " + f.desc));
        print("  [#] download   [Q] back");
      }
      function download(i) {
        if (i < 0 || i >= FILES.length) return;
        const f = FILES[i];
        if (f.name === "SECRETS.ZIP") {
          print("");
          print("  SECRETS.ZIP is password protected.");
          print("  hint from sysop: 'it is the name of my cat'");
          print("  (nobody has ever guessed the name of his cat.)");
          return;
        }
        print("");
        print("  downloading " + f.name + " at 28.8k...");
        let p = 0;
        const iv = setInterval(() => {
          if (win.closed || mode === "offline") { clearInterval(iv); return; }
          p += 8 + Math.random() * 12;
          if (p >= 100) {
            clearInterval(iv);
            print("  [##########] 100% — saved to My Documents");
            FS.writeFile(FS.DOCS + "/" + f.name, f.body || "(" + f.desc + ")");
            Sound.play("ding");
          } else {
            print("  [" + "#".repeat(p / 10 | 0).padEnd(10) + "] " + Math.round(p) + "%");
          }
        }, 400);
        timers.push(iv);
      }

      /* ---------- door game: Legend of the Crimson Dragon ---------- */
      function lordState() {
        return Store.get("bbsLord", { level: 1, hp: 20, gold: 12, kills: 0 });
      }
      function saveLord(s) { Store.set("bbsLord", s); }
      function enterLord() {
        mode = "lord";
        const s = lordState();
        print("");
        print("  *** LEGEND OF THE CRIMSON DRAGON ***");
        print("  a door game in 16 glorious colors (imagine them)");
        print("");
        print("  you are a level " + s.level + " warrior. HP " + s.hp + ", gold " + s.gold + ", kills " + s.kills + ".");
        lordMenu();
      }
      function lordMenu() {
        print("");
        print("  [F]ight in the forest  [I]nn (rest, 5 gold)  [X] exit to BBS");
      }
      function lordFight() {
        const s = lordState();
        const MOBS = ["a large rat", "a moss beast", "an aggressive turkey", "a lesser slime", "the tax collector", "a very confident goblin"];
        const mob = MOBS[(Math.random() * MOBS.length) | 0];
        print("");
        print("  you encounter " + mob + "!");
        if (Math.random() < 0.72 + s.level * 0.03) {
          const g = 3 + (Math.random() * 8 | 0);
          s.kills++; s.gold += g;
          print("  you are victorious! +" + g + " gold.");
          if (s.kills % 3 === 0) { s.level++; s.hp += 8; print("  ** LEVEL UP! you are now level " + s.level + " **"); Sound.play("tada"); }
        } else {
          s.hp = Math.max(1, s.hp - 6);
          print("  it got you good. -6 HP (now " + s.hp + "). the turkey shows no mercy.");
          Sound.play("error");
        }
        saveLord(s);
        lordMenu();
      }
      function lordInn() {
        const s = lordState();
        if (s.gold < 5) { print("  the innkeeper looks at your " + s.gold + " gold and points at the door."); lordMenu(); return; }
        s.gold -= 5; s.hp += 10;
        saveLord(s);
        print("  you rest by the fire. +10 HP (now " + s.hp + "). the bard plays the same song again.");
        lordMenu();
      }

      function whoOnline() {
        print("");
        print("  -- WHO'S ONLINE --");
        print("  node 1: you");
        print("  node 2: wanda_wildcat (reading SCIFI, 34 min)");
        print("  the sysop is asleep. the tower watches over us all.");
        mainMenu();
      }

      /* ---------- input ---------- */
      win.el.tabIndex = -1;
      win.el.addEventListener("keydown", (e) => {
        if (mode === "offline" || mode === "dialing") return;
        e.stopPropagation();
        const k = e.key;
        if (mode === "posting") {
          e.preventDefault();
          if (k === "Enter") { const t = lineBuf; lineBuf = ""; postLine(t.trim()); }
          else if (k === "Backspace") { lineBuf = lineBuf.slice(0, -1); render(); }
          else if (k.length === 1) { lineBuf += k; render(); }
          return;
        }
        const c = k.toLowerCase();
        e.preventDefault();
        if (mode === "menu") {
          if (c === "m") showBoards();
          else if (c === "f") showFiles();
          else if (c === "d") { print(""); print("  -- DOOR GAMES --"); print("  [1] Legend of the Crimson Dragon"); print("  [Q] back"); mode = "doors"; }
          else if (c === "w") whoOnline();
          else if (c === "g") { print(""); print("  come back soon, caller."); later(hangup, 700); }
        } else if (mode === "boards") {
          if (c === "q") mainMenu();
          else if (c === "p") startPost();
          else if (/[1-9]/.test(c)) showBoard(parseInt(c, 10) - 1);
        } else if (mode === "board") {
          if (c === "q") { mode = "boards"; showBoards(); }
          else if (/[1-9]/.test(c)) readMsg(parseInt(c, 10) - 1);
        } else if (mode === "files") {
          if (c === "q") mainMenu();
          else if (/[1-9]/.test(c)) download(parseInt(c, 10) - 1);
        } else if (mode === "doors") {
          if (c === "q") mainMenu();
          else if (c === "1") enterLord();
        } else if (mode === "lord") {
          if (c === "f") lordFight();
          else if (c === "i") lordInn();
          else if (c === "x") { print("  your progress is saved at the tower."); mainMenu(); }
        }
      });
      screen.addEventListener("mousedown", () => win.el.focus());
      win.opts.onClose = () => { W98.bbsOnline = false; timers.forEach(t => { clearTimeout(t); clearInterval(t); }); };
      render();
      return win;
    }
  };
})();

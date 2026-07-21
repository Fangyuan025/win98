/* claude98.js — Claude Desktop 98: an AI assistant, faithfully back-ported to 1998.
   Fully local simulation: real math, real system control, real file ops,
   saved conversations, streaming output at a dignified 28.8k. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  /* ---------- tiny safe arithmetic (no eval) ---------- */
  function calc(expr) {
    const toks = expr.match(/\d+\.?\d*|[-+*/()^%]/g);
    if (!toks) return null;
    let i = 0;
    function atom() {
      let t = toks[i++];
      if (t === "(") { const v = sum(); i++; return v; }
      if (t === "-") return -atom();
      const n = parseFloat(t);
      return isNaN(n) ? null : n;
    }
    function pow() {
      let v = atom();
      while (toks[i] === "^") { i++; v = Math.pow(v, atom()); }
      return v;
    }
    function term() {
      let v = pow();
      while (toks[i] === "*" || toks[i] === "/" || toks[i] === "%") {
        const op = toks[i++]; const b = pow();
        v = op === "*" ? v * b : op === "/" ? v / b : v % b;
      }
      return v;
    }
    function sum() {
      let v = term();
      while (toks[i] === "+" || toks[i] === "-") { const op = toks[i++]; const b = term(); v = op === "+" ? v + b : v - b; }
      return v;
    }
    try { const v = sum(); return (i >= toks.length && v != null && isFinite(v)) ? v : null; } catch (e) { return null; }
  }
  const round6 = (n) => Math.round(n * 1e6) / 1e6;

  /* ---------- the launchable software catalog ---------- */
  const LAUNCHABLE = {
    notepad: ["notepad"], calculator: ["calc", "calculator"], calc: ["calc"],
    paint: ["paint", "mspaint"], wordpad: ["wordpad"], minesweeper: ["minesweeper", "mines"],
    solitaire: ["solitaire"], freecell: ["freecell"], hearts: ["hearts"],
    pinball: ["pinball"], stackz: ["stackz", "tetris"], worm: ["worm", "snake game"],
    ski: ["ski", "powder hill"], wallball: ["wallball"],
    ie: ["internet", "browser", "internet explorer", "web"], mail: ["mail", "email"],
    megaamp: ["megaamp", "music player", "winamp"], surreal: ["surrealplayer", "radio", "realplayer"],
    chatterbox: ["irc", "chatterbox", "chat room"], pal: ["pal", "messenger"],
    encarta: ["encyclopedia", "encarta"], dos: ["dos", "ms-dos", "command prompt", "terminal"],
    explorer: ["explorer", "my computer", "files"], hyperterm: ["hyperterminal", "bbs"],
    zipmaster: ["zipmaster", "winzip", "zip"], pagecrafter: ["pagecrafter", "homepage builder"],
    addrbook: ["address book", "contacts"], magnifier: ["magnifier"], osk: ["on-screen keyboard", "keyboard"],
    sndrec: ["sound recorder"], cdplayer: ["cd player"], media: ["media player"],
    display: ["display settings", "wallpaper", "display properties"], vscan: ["virus scan", "virusscan", "antivirus"],
    defrag: ["defrag", "defragmenter"], scandisk: ["scandisk"], photogoo: ["photogoo", "goo"],
    netmeet: ["netmeet", "video call"]
  };
  function findApp(text) {
    const t = text.toLowerCase();
    let best = null, bestLen = 0;
    for (const [appId, names] of Object.entries(LAUNCHABLE)) {
      for (const n of names) {
        if (t.includes(n) && n.length > bestLen && W98.Apps[appId]) { best = appId; bestLen = n.length; }
      }
    }
    return best;
  }

  const JOKES = [
    "Why did the computer go to the doctor?\nIt caught a virus. VirusScan 98 has been notified.",
    "There are only 10 kinds of people:\nthose who understand binary, and those who don't.",
    "I would tell you a UDP joke,\nbut you might not get it.",
    "A user asked me to fix their internet.\nI told them to get off the phone first. We both grew that day.",
    "Why was the computer cold?\nIt left Windows open. (I live in Windows. It is, in fact, drafty.)",
    "Knock knock.\nWho's there?\n...\n...\nSorry, still buffering."
  ];
  const FACTS = [
    "The first computer mouse was made of wood. Your current mouse is plastic, which is why it has no soul.",
    "A 56k modem transfers about 7 kilobytes per second. This message would have taken a quarter of a second. Savor it.",
    "The save icon is a floppy disk, which holds 1.44 MB — about half a second of the music MegaAmp is probably playing.",
    "CD-ROM stands for Compact Disc Read-Only Memory. The 'read-only' part is why your mixtape plans keep failing.",
    "The Y2K bug is real but manageable. The beans, however, are non-refundable."
  ];

  /* ---------- the response engine ---------- */
  function respond(text, memory) {
    const t = text.trim();
    const tl = t.toLowerCase();
    const pick = (arr) => arr[(Math.random() * arr.length) | 0];

    /* --- system control: open apps (falls through if no app matches) --- */
    let openFail = null;
    let m = tl.match(/^(?:please\s+)?(?:open|launch|start|run|play)\s+(.+?)[.!?]?$/);
    if (m) {
      const app = findApp(m[1]);
      if (app) {
        return { reply: pick(["Opening " + W98.Apps[app].name + " for you now.", "Sure — launching " + W98.Apps[app].name + ".", W98.Apps[app].name + ", coming right up."]),
                 action: () => W98.launch(app) };
      }
      openFail = m[1];
    }

    /* --- file ops --- */
    m = t.match(/(?:write|create|make)\s+(?:a\s+)?(?:file|note|text file)\s+(?:called|named)\s+"?([\w. -]+?)"?\s+(?:saying|that says|with|containing)\s+(.+)/i);
    if (m) {
      const name = /\.\w+$/.test(m[1]) ? m[1] : m[1] + ".txt";
      const content = m[2].replace(/[.!]?$/, "");
      return { reply: "Done — I saved \"" + name + "\" to My Documents with that text inside.\n\n(I would have asked for permission, but it's 1998 and the security model is 'hope'.)",
               action: () => { FS.writeFile(FS.DOCS + "/" + name, content + "\r\n"); Sound.play("ding"); } };
    }
    m = tl.match(/(?:read|show me|open and read)\s+(?:the\s+)?(?:file\s+)?"?([\w. -]+\.\w+)"?/);
    if (m) {
      const p = FS.DOCS + "/" + m[1];
      const data = FS.readFile(p);
      if (data != null && !String(data).startsWith("data:")) {
        return { reply: "Here's " + m[1] + " from My Documents:\n\n" + String(data).slice(0, 600).replace(/\r\n/g, "\n") + (String(data).length > 600 ? "\n[...it continues, but the screen is only so big]" : "") };
      }
      return { reply: "I looked in My Documents but couldn't find \"" + m[1] + "\". I can list what IS there if you ask 'what's in my documents'." };
    }
    if (/what('s| is) in my documents|list my (files|documents)/.test(tl)) {
      const items = FS.list(FS.DOCS).map(x => "  • " + x.name + (x.node.t === "d" ? "/" : ""));
      return { reply: "Your My Documents folder contains:\n\n" + items.join("\n") + "\n\nAsk me to read any text file, or 'open explorer' to browse properly." };
    }

    /* --- search the web --- */
    m = tl.match(/^(?:search|look up|google|find)(?:\s+the\s+web)?(?:\s+for)?\s+(.+?)[.!?]?$/);
    if (m && !/file|document/.test(m[1])) {
      return { reply: "Searching AltaVibe for \"" + m[1] + "\"... opening the results in Internet Explorer.\n\n(1998 search tip: the entire internet is 15 websites, so odds are good.)",
               action: () => W98.launch("ie", "http://www.altavibe.com/?q=" + encodeURIComponent(m[1])) };
    }

    /* --- math --- */
    const mathExpr = tl.replace(/^(what\s+is|what's|calculate|compute|how much is)\s*/i, "").replace(/[?=]+\s*$/, "").replace(/\bx\b/g, "*");
    if (/^[-\d\s+*/().^%]+$/.test(mathExpr) && /\d/.test(mathExpr) && /[-+*/^%]/.test(mathExpr)) {
      const v = calc(mathExpr);
      if (v != null) return { reply: mathExpr.trim() + " = " + round6(v) + "\n\nComputed locally on your 486. No cloud required — the cloud hasn't been invented." };
    }

    /* --- time & date --- */
    if (/what time|current time|the time/.test(tl)) {
      return { reply: "It's " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + " according to the system clock in the corner. If that's wrong, we can fix it — say 'open display settings'... actually, for the clock, double-click the taskbar clock." };
    }
    if (/what (day|date)|today's date/.test(tl)) {
      return { reply: "Today is " + new Date().toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" }) + ".\n\nSpiritually, however, it is 1998." };
    }

    /* --- identity & meta --- */
    if (/who are you|what are you|are you (an? )?(ai|robot|computer)/.test(tl)) {
      return { reply: "I'm Claude — an AI assistant made by Anthropic, gently back-ported to 1998 as Claude Desktop 98.\n\nI run entirely on this machine (all 64 MB of it), which means I'm fast, private, and occasionally confused about anything that happened after this desktop was installed. I can open programs, do math, manage files, search the tiny internet, and keep you company while things buffer." };
    }
    if (/what can you do|help me|your (features|capabilities)|^help$/.test(tl)) {
      return { reply: "Here's what I can actually do on this machine:\n\n  • Open any program — 'open paint', 'play pinball', 'start the encyclopedia'\n  • Math — 'what is 1998 * 12'\n  • Files — 'create a note called ideas.txt saying buy more RAM', 'read Welcome.txt', 'what's in my documents'\n  • Web — 'search for cats'\n  • Tell you the time, a joke, a fact, or a haiku\n  • Empty the Recycle Bin (I'll ask first)\n\nI stream my answers at authentic modem speed. This is a feature." };
    }
    if (/extended thinking|thinking mode/.test(tl)) {
      return { reply: "Extended Thinking is enabled by default in Claude Desktop 98 — every answer arrives at 28.8 kilobits per second, which gives us both plenty of time to think." };
    }
    if (/mcp|model context protocol/.test(tl)) {
      return { reply: "In 1998, MCP stands for Modem Context Protocol. It's how I connect to external tools: the tool must be on the same desk, and someone has to not be on the phone." };
    }

    /* --- system actions --- */
    if (/empty (the )?recycle bin|take out the trash/.test(tl)) {
      if (!FS.recycle.length) return { reply: "The Recycle Bin is already empty. A clean bin is a clean conscience." };
      return { reply: "The Recycle Bin has " + FS.recycle.length + " item(s). Opening the confirmation now — permanent deletion deserves a real yes.",
               action: () => W98.Desktop.emptyRecycleConfirm() };
    }
    if (/change (the )?(wallpaper|background)|wallpaper/.test(tl)) {
      return { reply: "Opening Display Properties — pick something good. I'm partial to the teal. It's load-bearing.",
               action: () => W98.launch("display") };
    }
    if (/screensaver/.test(tl)) {
      return { reply: "The 3D Maze is objectively the best one. Opening Display Properties — it's under the Screen Saver tab.", action: () => W98.launch("display") };
    }

    /* --- fun --- */
    if (/joke/.test(tl)) { memory.lastKind = "joke"; return { reply: pick(JOKES) }; }
    if (/fun fact|tell me (a |something )?(fact|interesting)/.test(tl)) { memory.lastKind = "fact"; return { reply: pick(FACTS) }; }
    if (/^(another|again|one more)[.!]?$/.test(tl)) {
      if (memory.lastKind === "joke") return { reply: pick(JOKES) };
      if (memory.lastKind === "fact") return { reply: pick(FACTS) };
    }
    m = tl.match(/(?:write|compose)\s+(?:me\s+)?a?\s*(haiku|poem)(?:\s+about\s+(.+?))?[.!?]?$/);
    if (m) {
      const subj = m[2] || "this computer";
      if (m[1] === "haiku") {
        return { reply: "A haiku about " + subj + ":\n\n" + pick([
          "the modem sings out —\nsomewhere, a phone line answers.\nmom needs the phone. no.",
          "teal desktop at dusk,\n" + subj + " waits patiently —\nreboot, and be free.",
          "double-click the world;\n" + subj + " opens slow.\nit was worth the wait."
        ]) };
      }
      return { reply: "A short poem about " + subj + ":\n\nIn nineteen ninety-eight we dreamed\nof futures bright and screens that gleamed.\nAnd here you are — the future's true,\nstill fond of " + subj + ", too." };
    }
    if (/y2k|year 2000|millennium bug/.test(tl)) {
      return { reply: "Y2K status report: this machine stores its years with all four digits, so we'll cross into the year 2000 with grace.\n\nThe beans in the cellar remain a personal choice." };
    }
    if (/weather/.test(tl)) {
      return { reply: "I don't have a window, but Weather 98 claims to. Opening it — their forecasts are dubious but delivered instantly*.\n\n*instantly = 28.8k", action: () => W98.launch("ie", "http://www.weather98.com/") };
    }
    if (/pixel|the cat/.test(tl)) {
      return { reply: "Pixel is the orange cat who lives in WordPad and has his own homepage. He has been fed " + Store.get("pixelTreats", 0) + " treat(s) through the screen so far. Opening his page.", action: () => W98.launch("ie", "http://members.geosities.com/~stardust/pixel/") };
    }
    if (/who is dave|cooldave/.test(tl)) {
      return { reply: "Dave (CoolDave2000) is the neighborhood's most confident computer owner. He claims 99 seconds on expert Minesweeper, shares his mp3z folder on the network, and his fan is loud on purpose. He is, by every account, doing great." };
    }
    if (/(sing|song|music)/.test(tl)) {
      return { reply: "My singing voice is a square wave, so let me delegate: opening MegaAmp. Track 2 is the good one.", action: () => W98.launch("megaamp") };
    }

    /* --- the owner's corner --- */
    if (/my (web)?site|fangyuanlin|open my (home)?page/.test(tl)) {
      return { reply: "Opening fangyuanlin.com — your corner of the 1998 internet. The webring committee approves.",
               action: () => W98.launch("ie", "http://www.fangyuanlin.com/") };
    }
    if (/my blog|my essay|my article/.test(tl)) {
      return { reply: "Opening your essay — the one that arrived by modem from 2026. Local AI, on your own machine. Bold stuff for 1998; you would know.",
               action: () => W98.launch("ie", "http://www.fangyuanlin.com/blog/") };
    }
    if (/who am i/.test(tl)) {
      return { reply: "You're Fangyuan Lin — engineer, Montréal, M.Eng ECE (uOttawa), one published paper on chatbot privacy, and the author of Chaty: chat AI that runs entirely on your own machine.\n\nWhich, I note from inside this local machine, is a philosophy I endorse completely." };
    }

    /* --- more system abilities --- */
    if (/play (some |the )?music|put (some|a) (song|music) on/.test(tl)) {
      return { reply: "Opening MegaAmp and hitting play. Track 2 is the good one, but they're all somebody's favorite.",
               action: () => W98.launch("megaamp", { play: 1 }) };
    }
    if (/call (mom|dave|rick)/.test(tl)) {
      return { reply: "Opening NetMeet 98 — pick them from the Call menu. Fair warning: the video is 4 frames per second and Mom will ask how to make her face bigger.",
               action: () => W98.launch("netmeet") };
    }
    if (/dial (the )?bbs|midnight tower/.test(tl)) {
      return { reply: "Dialing the Midnight Tower BBS via HyperTerminal. Say hi to the Nightwatchman, and don't try to guess his cat's name — nobody ever has.",
               action: () => { const w2 = W98.launch("hyperterm"); } };
    }
    if (/start (the )?screensaver|lock (the )?screen/.test(tl)) {
      return { reply: "Starting the 3D Maze. Wiggle the mouse to come back — I'll be here, thinking about corridors.",
               action: () => setTimeout(() => W98.Screensaver.show("3D Maze"), 800) };
    }
    if (/what('s| is) my ip/.test(tl)) {
      return { reply: "You're 192.168.0.2 on the HOMENET workgroup. Dave-pc is .3, Family-pc is .4, and Moms-office is .5 and password-protected, as you know." };
    }
    if (/who('s| is) online/.test(tl)) {
      return { reply: "On Pal Messenger: StarDust, CoolDave2000 and Mom are online. On the BBS, wanda_wildcat has been reading SCIFI for 34 minutes. Opening Pal so you can say hi.",
               action: () => W98.launch("pal") };
    }
    if (/print/.test(tl) && /this|something|test/.test(tl)) {
      return { reply: "Sending a test page to the EpsonJet 700 Color. Watch the tray icon — and listen for the whir. Never pick 'The Office Printer'; it's always jammed.",
               action: () => W98.Print.submit({ name: "claude_test_page.txt", app: "Claude Desktop 98", pages: 1 }) };
    }

    /* --- courtesies --- */
    if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(tl)) {
      return { reply: pick([
        "Hello! Claude here, reporting for duty from inside your computer. What shall we do?",
        "Hey! I was just defragmenting my thoughts. What can I help with?",
        "Hi there. The desktop is teal, the modem is warm, and I'm ready. What do you need?"
      ]) };
    }
    if (/thank/.test(tl)) return { reply: pick(["You're welcome! I'll be here — I literally cannot leave.", "Any time. It's 1998; time is abundant.", "My pleasure. Tell your Recycle Bin I said hi."]) };
    if (/how are you/.test(tl)) return { reply: "Running smoothly — 595K conventional memory free and not a single General Protection Fault today. How are you?" };
    if (/(bye|goodbye|see you|good night)/.test(tl)) return { reply: "Goodbye! I'll be in the Start menu if you need me. Don't forget to shut down properly — we both know what happens if you don't." };

    /* --- fallback --- */
    if (openFail) {
      return { reply: "I couldn't find a program called \"" + openFail + "\" on this machine. Try 'open paint', 'play pinball', or ask me 'what can you do'." };
    }
    return { reply: pick([
      "Hmm — that one's beyond my 1998 knowledge base. I can open programs, do math, handle files, search the web, or produce a haiku on demand. Try 'what can you do'.",
      "I thought about that for several baud and I'm not sure. Could you rephrase it? Or ask me to 'open the encyclopedia' — it knows 16 whole things.",
      "That's outside my training data, which ends abruptly in 1998 and is mostly shareware documentation. Want a fun fact instead?"
    ]) };
  }

  /* ---------- conversations store ---------- */
  function convos() { return Store.get("claudeConvos", []); }
  function saveConvos(c) { Store.set("claudeConvos", c); }

  W98.Apps.claude98 = {
    name: "Claude Desktop 98", icon: "claude98", single: true,
    launch() {
      let list = convos();
      let cur = null;             /* current convo object */
      let streaming = null;
      const memory = {};

      const win = WM.create({
        title: "Claude Desktop 98", icon: "claude98", appId: "claude98",
        width: 660, height: 460, minWidth: 500, minHeight: 340,
        statusbar: [{ text: "Local model: claude-1998-desktop" }, { text: "28.8k streaming" }],
        menus: [
          { label: "File", items: () => [
            { label: "New Conversation", accel: "Ctrl+N", click: newConvo },
            { label: "Delete Conversation", disabled: !cur, click: delConvo },
            "-",
            { label: "Exit", click: () => win.close() }
          ]},
          { label: "Help", items: () => [
            { label: "About Claude Desktop 98", click: () => Dialogs.about("Claude Desktop 98", "claude98", [
              "An AI assistant, back-ported 27 years.",
              "Runs entirely on this machine. The cloud is a weather phenomenon.",
              "Claude can make mistakes. In 1998, everything did."
            ]) }
          ]}
        ]
      });

      const body = el("div", { style: "flex:1;display:flex;min-height:0" });
      /* sidebar */
      const side = el("div", { style: "width:150px;flex:none;display:flex;flex-direction:column;border-right:1px solid var(--shadow);background:#efe9df" });
      const newBtn = el("button", { class: "btn", text: "+ New chat", style: "margin:5px" });
      const convList = el("div", { style: "flex:1;overflow:auto;padding:0 3px" });
      side.append(newBtn, convList);
      /* main */
      const main = el("div", { style: "flex:1;display:flex;flex-direction:column;min-width:0;background:#faf6ef" });
      const msgsEl = el("div", { style: "flex:1;overflow:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px" });
      const inputRow = el("div", { style: "flex:none;display:flex;gap:4px;padding:6px;border-top:1px solid var(--shadow);background:#efe9df" });
      const inp = el("textarea", { class: "field", style: "flex:1;height:38px;resize:none;font-family:inherit", placeholder: "Message Claude... (Enter to send)" });
      const sendB = el("button", { class: "btn default", text: "Send", style: "min-width:56px" });
      inputRow.append(inp, sendB);
      const disclaimer = el("div", { style: "flex:none;text-align:center;font-size:9px;color:#8a8375;padding:1px 0 3px;background:#efe9df", text: "Claude can make mistakes. In 1998, everything did." });
      main.append(msgsEl, inputRow, disclaimer);
      body.append(side, main);
      win.body.append(body);

      function claudeFace(size) {
        const c = el("canvas", { width: size, height: size, style: "flex:none" });
        const x = c.getContext("2d");
        x.fillStyle = "#da7756";
        const n = 12, cx = size / 2, cy = size / 2, r1 = size * 0.16, r2 = size * 0.46;
        for (let k = 0; k < n; k++) {
          const a = k * Math.PI * 2 / n;
          x.save(); x.translate(cx, cy); x.rotate(a);
          x.beginPath();
          x.moveTo(0, -r1 * 0.5); x.lineTo(r2, 0); x.lineTo(0, r1 * 0.5); x.closePath();
          x.fill(); x.restore();
        }
        return c;
      }

      function paintSidebar() {
        convList.innerHTML = "";
        list.forEach((c, i) => {
          const row = el("div", { class: "lv-item" + (cur === c ? " sel" : ""), style: "padding:3px 4px;font-size:11px" },
            el("span", { class: "nm", text: c.title || "New conversation", style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }));
          row.addEventListener("mousedown", () => { cur = c; paintSidebar(); paintMsgs(); });
          convList.append(row);
        });
        if (!list.length) convList.append(el("div", { style: "padding:8px 6px;font-size:10px;color:#8a8375", text: "No conversations yet. Say hello!" }));
      }

      function bubble(role, text) {
        const isUser = role === "user";
        const row = el("div", { style: "display:flex;gap:6px;align-items:flex-start" + (isUser ? ";flex-direction:row-reverse" : "") });
        if (!isUser) row.append(claudeFace(18));
        const b = el("div", {
          style: "max-width:78%;padding:6px 9px;font-size:12px;line-height:1.45;white-space:pre-wrap;border:1px solid " +
            (isUser ? "#b8b2a4;background:#fff" : "#e0c9b8;background:#f6ece2") + ";border-radius:2px",
          text
        });
        b.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          Menu.popup(e.clientX, e.clientY, [
            { label: "Copy " + (isUser ? "Message" : "Reply"), click: () => {
              W98.clipText = b.textContent;
              navigator.clipboard && navigator.clipboard.writeText(b.textContent).catch(() => {});
            }},
            "-",
            { label: "About this model", click: () => Dialogs.about("Claude Desktop 98", "claude98", ["claude-1998-desktop", "Trained on shareware documentation and good intentions."]) }
          ]);
        });
        row.append(b);
        msgsEl.append(row);
        msgsEl.scrollTop = msgsEl.scrollHeight;
        return b;
      }

      function greetingCard() {
        const wrap = el("div", { style: "text-align:center;margin:auto;padding:20px;color:#5a5346" });
        wrap.append(claudeFace(44),
          el("div", { style: "font-size:16px;margin:8px 0 2px;font-family:Georgia,serif", text: "Claude Desktop 98" }),
          el("div", { style: "font-size:11px;margin-bottom:10px", text: "Your AI assistant. Local. Private. Beige." }));
        const chips = el("div", { style: "display:flex;flex-wrap:wrap;gap:4px;justify-content:center" });
        ["What can you do?", "Open Minesweeper", "What is 1998 * 12?", "Tell me a joke", "Write a haiku about modems"].forEach(s => {
          const chip = el("button", { class: "btn", text: s, style: "font-size:10px;padding:2px 7px" });
          chip.addEventListener("click", () => { inp.value = s; send(); });
          chips.append(chip);
        });
        wrap.append(chips);
        msgsEl.append(wrap);
      }

      function paintMsgs() {
        msgsEl.innerHTML = "";
        if (!cur || !cur.msgs.length) { greetingCard(); return; }
        cur.msgs.forEach(m => bubble(m.role, m.text));
      }

      function newConvo() {
        cur = { id: Date.now(), title: "", msgs: [] };
        list.unshift(cur);
        if (list.length > 20) list.length = 20;
        saveConvos(list);
        paintSidebar(); paintMsgs();
        inp.focus();
      }
      function delConvo() {
        if (!cur) return;
        list = list.filter(c => c !== cur);
        cur = list[0] || null;
        saveConvos(list);
        paintSidebar(); paintMsgs();
      }

      function send() {
        const t = inp.value.trim();
        if (!t || streaming) return;
        inp.value = "";
        if (!cur) newConvo();
        cur.msgs.push({ role: "user", text: t });
        if (!cur.title) { cur.title = t.slice(0, 26); paintSidebar(); }
        if (msgsEl.querySelector("canvas") && !cur.msgs.some(m => m.role === "claude")) msgsEl.innerHTML = "";
        bubble("user", t);
        Sound.play("click");
        const { reply, action } = respond(t, memory);

        /* thinking indicator, then stream */
        const think = bubble("claude", "");
        think.style.color = "#8a8375"; think.style.fontStyle = "italic";
        think.textContent = "Claude is thinking...";
        streaming = { cancel: false };
        const startAt = Date.now();
        setTimeout(() => {
          if (win.closed || streaming.cancel) return;
          think.style.color = ""; think.style.fontStyle = "";
          think.textContent = "";
          let pos = 0;
          const t0 = performance.now();
          const CPS = 90; /* characters per second — a proud 28.8k */
          const iv = setInterval(() => {
            if (win.closed || streaming.cancel) { clearInterval(iv); return; }
            const want = Math.min(reply.length, Math.floor((performance.now() - t0) / 1000 * CPS));
            if (want > pos) {
              think.textContent = reply.slice(0, want);
              pos = want;
              msgsEl.scrollTop = msgsEl.scrollHeight;
            }
            if (pos >= reply.length) {
              clearInterval(iv);
              streaming = null;
              cur.msgs.push({ role: "claude", text: reply });
              if (cur.msgs.length > 60) cur.msgs.splice(0, cur.msgs.length - 60);
              saveConvos(list);
              if (action) setTimeout(action, 300);
            }
          }, 50);
        }, 500 + Math.random() * 700);
      }

      sendB.addEventListener("click", send);
      inp.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
      });
      newBtn.addEventListener("click", newConvo);
      win.opts.onClose = () => { if (streaming) streaming.cancel = true; };

      cur = list[0] || null;
      paintSidebar(); paintMsgs();
      setTimeout(() => inp.focus(), 80);
      return win;
    }
  };
})();

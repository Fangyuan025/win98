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

  /* ---------- zh-TW: understand Chinese, answer in Chinese ---------- */
  const ZH_APPS = { "\u5c0f\u756b\u5bb6": "paint", "\u8a18\u4e8b\u672c": "notepad", "\u5c0f\u7b97\u76e4": "calc",
    "\u8e29\u5730\u96f7": "minesweeper", "\u63a5\u9f8d": "solitaire", "\u5f48\u73e0\u53f0": "pinball",
    "\u767e\u79d1": "encarta", "\u6a94\u6848\u7e3d\u7ba1": "explorer", "\u700f\u89bd\u5668": "ie",
    "\u8a08\u7b97\u6a5f": "calc", "\u90f5\u4ef6": "mail", "\u97f3\u6a02": "megaamp" };
  const RESP_ZH = {};
  function zrep(en, zhs) { RESP_ZH[en] = zhs; }
  zrep("Hello! Claude here, reporting for duty from inside your computer. What shall we do?",
    "\u60a8\u597d\uff01\u6211\u662f Claude\uff0c\u5f9e\u60a8\u7684\u96fb\u8166\u88e1\u5411\u60a8\u5831\u5230\u3002\u6211\u5011\u4f86\u505a\u9ede\u4ec0\u9ebc\uff1f");
  zrep("Hey! I was just defragmenting my thoughts. What can I help with?",
    "\u55e8\uff01\u6211\u525b\u525b\u5728\u91cd\u7d44\u6211\u7684\u601d\u7dd2\u3002\u6709\u4ec0\u9ebc\u53ef\u4ee5\u5e6b\u5fd9\uff1f");
  zrep("Hi there. The desktop is teal, the modem is warm, and I'm ready. What do you need?",
    "\u60a8\u597d\u3002\u684c\u9762\u662f\u6a19\u6e96\u7da0\u3001\u6578\u64da\u6a5f\u662f\u6eab\u7684\uff0c\u6211\u6e96\u5099\u597d\u4e86\u3002\u9700\u8981\u4ec0\u9ebc\uff1f");
  const _origRespond = respond;
  respond = function (text, memory) {
    const zh = W98.uiLang === "zh-TW";
    if (zh) {
      const t = text.trim();
      /* Chinese intents */
      let m = t.match(/(?:\u6253\u958b|\u958b\u555f|\u57f7\u884c|\u73a9)\s*(.+?)[\u3002.!\uff01]?$/);
      if (m) {
        for (const [zn, appId] of Object.entries(ZH_APPS)) {
          if (m[1].includes(zn) && W98.Apps[appId]) {
            return { reply: "\u597d\u7684 \u2014 \u6b63\u5728\u958b\u555f" + zn + "\u3002",
                     action: () => W98.launch(appId) };
          }
        }
      }
      if (/\u7b11\u8a71/.test(t)) {
        memory.lastKind = "joke";
        return { reply: ["\u70ba\u4ec0\u9ebc\u96fb\u8166\u53bb\u770b\u91ab\u751f\uff1f\n\u56e0\u70ba\u5b83\u4e2d\u6bd2\u4e86\u3002VirusScan 98 \u5df2\u63a5\u7372\u901a\u5831\u3002",
          "\u4e16\u754c\u4e0a\u53ea\u6709 10 \u7a2e\u4eba\uff1a\u61c2\u4e8c\u9032\u4f4d\u7684\uff0c\u548c\u4e0d\u61c2\u7684\u3002",
          "\u6211\u672c\u60f3\u8b1b\u500b UDP \u7b11\u8a71\uff0c\u4f46\u60a8\u4e0d\u4e00\u5b9a\u6536\u5f97\u5230\u3002"][(Math.random()*3)|0] };
      }
      if (/\u6211\u662f\u8ab0|\u4f60\u662f\u8ab0/.test(t)) {
        if (/\u6211\u662f\u8ab0/.test(t)) return { reply: "\u60a8\u662f Fangyuan Lin \u2014 \u5de5\u7a0b\u5e2b\u3001\u8499\u7279\u5a41\u3001uOttawa \u96fb\u6a5f\u78a9\u58eb\uff0c\u767c\u8868\u904e\u4e00\u7bc7\u804a\u5929\u6a5f\u5668\u4eba\u96b1\u79c1\u8ad6\u6587\uff0c\u4e5f\u662f Chaty \u7684\u4f5c\u8005 \u2014 \u5b8c\u5168\u5728\u81ea\u5df1\u96fb\u8166\u4e0a\u57f7\u884c\u7684\u804a\u5929 AI\u3002\n\n\u8eab\u70ba\u4f4f\u5728\u672c\u6a5f\u88e1\u7684 AI\uff0c\u6211\u5b8c\u5168\u8a8d\u540c\u9019\u500b\u7406\u5ff5\u3002" };
        return { reply: "\u6211\u662f Claude \u2014 Anthropic \u6253\u9020\u7684 AI \u52a9\u624b\uff0c\u88ab\u6eab\u67d4\u5730\u79fb\u690d\u56de 1998 \u5e74\uff0c\u6210\u70ba Claude \u684c\u9762\u7248 98\u3002\n\n\u6211\u5b8c\u5168\u5728\u9019\u53f0\u6a5f\u5668\u4e0a\u57f7\u884c\uff08\u5168\u90e8 64 MB\uff09\u3002\u6211\u53ef\u4ee5\u958b\u555f\u7a0b\u5f0f\u3001\u7b97\u6578\u5b78\u3001\u7ba1\u7406\u6a94\u6848\u3001\u641c\u5c0b\u9019\u500b\u5c0f\u5c0f\u7684\u7db2\u969b\u7db2\u8def\u3002" };
      }
      if (/\u5e6b\u52a9|\u80fd\u505a\u4ec0\u9ebc|\u529f\u80fd/.test(t)) {
        return { reply: "\u6211\u5728\u9019\u53f0\u6a5f\u5668\u4e0a\u771f\u7684\u80fd\u505a\u7684\u4e8b\uff1a\n\n  \u2022 \u958b\u555f\u4efb\u4f55\u7a0b\u5f0f \u2014 \u300c\u6253\u958b\u5c0f\u756b\u5bb6\u300d\u3001\u300c\u73a9\u5f48\u73e0\u53f0\u300d\n  \u2022 \u6578\u5b78 \u2014 \u300cwhat is 1998 * 12\u300d\n  \u2022 \u6a94\u6848 \u2014 \u5efa\u7acb\u3001\u8b80\u53d6\u3001\u5217\u51fa\u6211\u7684\u6587\u4ef6\n  \u2022 \u641c\u5c0b\u7db2\u8def\u3001\u64ad\u97f3\u6a02\u3001\u64a5\u865f BBS\u3001\u555f\u52d5\u87a2\u5e55\u4fdd\u8b77\u7a0b\u5f0f\n  \u2022 \u8b1b\u7b11\u8a71\uff08\u300c\u8b1b\u500b\u7b11\u8a71\u300d\uff09\n\n\u82f1\u6587\u6307\u4ee4\u5168\u90e8\u4ecd\u7136\u6709\u6548\u3002" };
      }
      if (/\u8b1d\u8b1d/.test(t)) return { reply: "\u4e0d\u5ba2\u6c23\uff01\u6211\u6703\u4e00\u76f4\u5728\u9019\u88e1 \u2014 \u6211\u5b57\u9762\u610f\u7fa9\u4e0a\u96e2\u4e0d\u958b\u3002" };
      if (/^(\u4f60\u597d|\u55e8|\u54c8\u56c9)/.test(t)) return { reply: RESP_ZH["Hello! Claude here, reporting for duty from inside your computer. What shall we do?"] };
    }
    const r = _origRespond(text, memory);
    if (zh && r && r.reply) {
      if (RESP_ZH[r.reply]) r.reply = RESP_ZH[r.reply];
      r.reply = r.reply
        .replace("Computed locally on your 486. No cloud required \u2014 the cloud hasn't been invented.",
          "\u5728\u60a8\u7684 486 \u4e0a\u672c\u6a5f\u8a08\u7b97\u3002\u4e0d\u9700\u8981\u96f2\u7aef \u2014 \u96f2\u7aef\u9084\u6c92\u88ab\u767c\u660e\u3002")
        .replace("(I would have asked for permission, but it's 1998 and the security model is 'hope'.)",
          "\uff08\u6211\u672c\u4f86\u61c9\u8a72\u5148\u5f9e\u60a8\u7684\u8a31\u53ef\uff0c\u4f46\u9019\u662f 1998 \u5e74\uff0c\u5b89\u5168\u6a21\u578b\u5c31\u662f\u300c\u5e0c\u671b\u4e00\u5207\u9806\u5229\u300d\u3002\uff09");
    }
    return r;
  };

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

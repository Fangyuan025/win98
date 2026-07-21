/* chatterbox.js — ChatterBox IRC: channels, bots, and /commands.
   Original network (ChatNet), original regulars. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  const CHANNELS = {
    "#lobby": {
      topic: "welcome to ChatNet | be nice | no ASCII floods (Dave)",
      users: ["Wired_Wendy", "CoolDave2000", "modem_king", "sleepy_sam", "OpBot"],
      chatter: [
        ["Wired_Wendy", "anyone else's mom pick up the phone mid-download :("],
        ["modem_king", "56k gang rise up"],
        ["sleepy_sam", "zzz"],
        ["CoolDave2000", "just got 99 seconds on expert. NINETY NINE"],
        ["Wired_Wendy", "dave you say this every day"],
        ["modem_king", "brb reconnecting"],
        ["OpBot", "[auto] remember: the internet closes at 6pm when mom needs the phone"],
        ["sleepy_sam", "im awake who said pizza"],
        ["CoolDave2000", "who wants to see my quake demo its only 4 minutes"]
      ]
    },
    "#games": {
      topic: "cheat codes | high scores | no spoilers for Riven",
      users: ["FragMaster_T", "puzzle_pete", "CoolDave2000", "OpBot"],
      chatter: [
        ["FragMaster_T", "rocket jump is not cheating its PHYSICS"],
        ["puzzle_pete", "day 34 of the marble puzzle. i see it when i close my eyes"],
        ["FragMaster_T", "anyone beat the ski game monster? asking for me"],
        ["CoolDave2000", "the monster is unbeatable. i have SEEN things"],
        ["puzzle_pete", "idkfa. thats it. thats the message"],
        ["OpBot", "[auto] reminder: blowing on the cartridge is a placebo (disputed)"]
      ]
    },
    "#y2k": {
      topic: "526 days remain | canned goods thread pinned",
      users: ["prepared_paula", "skeptic_steve", "OpBot"],
      chatter: [
        ["prepared_paula", "added 40 more cans of beans to the cellar today"],
        ["skeptic_steve", "paula nothing is going to happen"],
        ["prepared_paula", "thats what they WANT you to think steve"],
        ["skeptic_steve", "who is they"],
        ["prepared_paula", "the mainframes"],
        ["OpBot", "[auto] 526 days until the year 2000. this bot is not y2k compliant."]
      ]
    }
  };
  const REACT = [
    [/\b(hi|hello|hey)\b/i, ["yo", "hey hey", "sup", "hello o/"]],
    [/\bpizza\b/i, ["PIZZA", "now im hungry thanks", "half cheese half regret please"]],
    [/\b(win98|windows)\b/i, ["have you tried restarting", "my taskbar disappeared once. dark times"]],
    [/\?$/, ["good question", "ask OpBot", "nobody knows. its the internet"]],
    [/\b(cool|nice|awesome)\b/i, ["ikr", "extremely", "the 90s rule"]],
    [/\bcat\b/i, ["pixel the cat has a homepage btw", "cats own the internet already"]]
  ];

  W98.Apps.chatterbox = {
    name: "ChatterBox IRC", icon: "chatterbox", single: true,
    launch() {
      let nick = Store.get("ircNick", "guest" + (100 + (Math.random() * 900 | 0)));
      let chan = "#lobby";
      const logs = {};   /* chan -> [lines] */
      const timers = [];

      const win = WM.create({
        title: "ChatterBox IRC - ChatNet", icon: "chatterbox", appId: "chatterbox",
        width: 620, height: 400, minWidth: 460, minHeight: 280,
        statusbar: [{ text: "Connected to irc.chatnet.98 (ping 340ms)" }],
        menus: [
          { label: "File", items: () => [{ label: "Exit", click: () => win.close() }] },
          { label: "Commands", items: () => [
            { label: "Change Nick (/nick)", click: () => cmdNick() },
            { label: "Channel List (/list)", click: () => sysMsg(Object.keys(CHANNELS).join("  ")) },
            "-",
            { label: "About ChatterBox", click: () => Dialogs.about("ChatterBox IRC", "chatterbox", ["Where everybody knows your /nick.", "Scripts > everything."]) }
          ]}
        ]
      });

      const body = el("div", { style: "flex:1;display:flex;min-height:0" });
      const chanList = el("div", { class: "listview sunken", style: "width:92px;flex:none;margin-right:3px" });
      const midCol = el("div", { style: "flex:1;display:flex;flex-direction:column;min-width:0" });
      const topicEl = el("div", { class: "sunken", style: "flex:none;padding:2px 6px;font-size:11px;background:#e8e8e0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" });
      const log = el("div", { class: "sunken", style: "flex:1;background:#fff;overflow:auto;padding:3px 6px;font-family:'Courier New',monospace;font-size:12px;line-height:1.45" });
      const inputRow = el("div", { style: "flex:none;display:flex;gap:3px;margin-top:3px" });
      const inp = el("input", { type: "text", class: "field", style: "flex:1" });
      const sendB = el("button", { class: "btn", text: "Send", style: "min-width:52px" });
      inputRow.append(inp, sendB);
      midCol.append(topicEl, log, inputRow);
      const nickList = el("div", { class: "listview sunken", style: "width:110px;flex:none;margin-left:3px;overflow:auto" });
      body.append(chanList, midCol, nickList);
      win.body.append(body);
      win.body.style.padding = "3px";

      function esc(s) { return s; }
      function addLine(ch, html, cls) {
        (logs[ch] = logs[ch] || []).push({ html, cls });
        if (ch === chan) paintLine({ html, cls });
      }
      function paintLine(l) {
        const d = el("div", { class: l.cls || "" });
        d.append(...l.html);
        log.append(d);
        log.scrollTop = log.scrollHeight;
      }
      function nickSpan(n, col) {
        return el("span", { style: "color:" + (col || colorFor(n)) + ";font-weight:700", text: "<" + n + "> " });
      }
      function colorFor(n) {
        const cols = ["#a00000", "#006000", "#000080", "#806000", "#800080", "#006080"];
        let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
        return cols[h % cols.length];
      }
      function sysMsg(t) { addLine(chan, [el("span", { style: "color:#808080;font-style:italic", text: "*** " + t })]); }
      function userMsg(ch, n, t) { addLine(ch, [nickSpan(n), el("span", { text: t })]); }

      function paintChans() {
        chanList.innerHTML = "";
        Object.keys(CHANNELS).forEach(c => {
          const row = el("div", { class: "lv-item" + (c === chan ? " sel" : "") }, el("span", { class: "nm", text: c }));
          row.addEventListener("mousedown", () => joinChan(c));
          chanList.append(row);
        });
      }
      function paintNicks() {
        nickList.innerHTML = "";
        nickList.append(el("div", { style: "font-weight:700;padding:2px 4px;font-size:11px", text: CHANNELS[chan].users.length + 1 + " users" }));
        ["@" + nick, ...CHANNELS[chan].users.map(u => (u === "OpBot" ? "@" : "") + u)].forEach(u => {
          nickList.append(el("div", { style: "padding:1px 6px;font-size:11px", text: u }));
        });
      }
      function joinChan(c) {
        chan = c;
        topicEl.textContent = "Topic: " + CHANNELS[c].topic;
        log.innerHTML = "";
        (logs[c] || []).forEach(paintLine);
        if (!logs[c] || !logs[c].length) {
          sysMsg("Now talking in " + c);
          sysMsg("Topic is '" + CHANNELS[c].topic + "'");
        }
        paintChans(); paintNicks();
      }

      /* ambient chatter: each channel drips lines on its own clock */
      Object.keys(CHANNELS).forEach(ch => {
        let idx = 0;
        const tick = () => {
          const line = CHANNELS[ch].chatter[idx++ % CHANNELS[ch].chatter.length];
          userMsg(ch, line[0], line[1]);
          if (ch === chan && !win.focused) Sound.play("click");
          timers.push(setTimeout(tick, 6000 + Math.random() * 12000));
        };
        timers.push(setTimeout(tick, 1500 + Math.random() * 5000));
      });

      function cmdNick(arg) {
        const doSet = (n) => {
          if (!n) return;
          n = n.replace(/\s+/g, "_").slice(0, 16);
          sysMsg(nick + " is now known as " + n);
          nick = n;
          Store.set("ircNick", nick);
          paintNicks();
        };
        if (arg) doSet(arg);
        else Dialogs.prompt({ title: "Change Nickname", icon: "chatterbox", label: "New nickname:", value: nick }).then(doSet);
      }

      function send() {
        const t = inp.value.trim();
        if (!t) return;
        inp.value = "";
        if (t.startsWith("/")) {
          const [c, ...rest] = t.slice(1).split(/\s+/);
          const arg = rest.join(" ");
          switch (c.toLowerCase()) {
            case "nick": cmdNick(arg); break;
            case "me": addLine(chan, [el("span", { style: "color:#800080", text: "* " + nick + " " + arg })]); break;
            case "join": if (CHANNELS[arg]) joinChan(arg); else sysMsg("No such channel: " + arg + " (try /list)"); break;
            case "list": sysMsg("Channels: " + Object.keys(CHANNELS).join("  ")); break;
            case "quit": win.close(); break;
            case "slap": addLine(chan, [el("span", { style: "color:#800080", text: "* " + nick + " slaps " + (arg || "sleepy_sam") + " around a bit with a large trout" })]); break;
            default: sysMsg("Unknown command: /" + c);
          }
          return;
        }
        userMsg(chan, nick, t);
        Sound.play("click");
        /* someone might respond */
        for (const [re, replies] of REACT) {
          if (re.test(t) && Math.random() < 0.8) {
            const users = CHANNELS[chan].users.filter(u => u !== "OpBot");
            const who = users[(Math.random() * users.length) | 0];
            timers.push(setTimeout(() => {
              if (!win.closed) userMsg(chan, who, replies[(Math.random() * replies.length) | 0]);
            }, 1200 + Math.random() * 2500));
            break;
          }
        }
      }
      sendB.addEventListener("click", send);
      inp.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter") send();
      });

      win.opts.onClose = () => timers.forEach(clearTimeout);
      joinChan("#lobby");
      sysMsg("Connected. Your nick is " + nick + " (change with /nick)");
      setTimeout(() => inp.focus(), 80);
      return win;
    }
  };
})();

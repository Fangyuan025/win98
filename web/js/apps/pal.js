/* pal.js — Pal Messenger: the instant-messaging experience of 1998.
   Original characters, original canned chatter. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  const BUDDIES = [
    {
      id: "stardust", name: "StarDust", online: true,
      lines: [
        "hiiii!! did u see my new cat page?? ^_^",
        "the FTP ate my index.html AGAIN",
        "omg someone signed my guestbook today!!",
        "im adding a midi to my page, which song do u think??",
        "brb feeding the cat (his name is Pixel)",
        "u should totally join the webring!!"
      ]
    },
    {
      id: "cooldave", name: "CoolDave2000", online: true,
      lines: [
        "DUDE. 99 seconds on expert. NINETY NINE.",
        "lan party at my place saturday, bring ur own mouse",
        "my new modem is 56k. FIFTY SIX. we are living in the future",
        "have u tried holding both mouse buttons in minesweeper. trust me",
        "brb defragging",
        "quake or hearts. choose wisely",
        "2 MILLION on star pilot pinball. no i will not prove it",
        "the ski game monster is NOT a myth. i have seen things"
      ]
    },
    {
      id: "jenny", name: "xX_Jenny_Xx", online: false,
      lines: [
        "heyyy whats up",
        "im making u a mixtape, its got 11 songs on it",
        "did u do the book report?? mine is about my modem lol",
        "my mom needs the phone in 5 min >:(",
        "g2g mom is yelling. ttyl!!"
      ]
    },
    {
      id: "mom", name: "Mom", online: true,
      lines: [
        "HI HONEY ITS MOM",
        "how do i make the writing bigger",
        "IS THIS THING SENDING",
        "aunt carol says you never answer her emails",
        "dinner at 6. do not be on the internet at 6",
        "ok i found the bigger writing. WHY IS IT ALL CAPITALS NOW"
      ]
    },
    {
      id: "rick", name: "UncleRick", online: false,
      lines: ["(UncleRick is offline. His computer is 'making the noise' again.)"]
    }
  ];
  const state = { chats: {}, lineIdx: {}, presenceTimer: null };

  function uhOh() {
    const bus = Sound.audio();
    if (!bus) return;
    [[660, 0], [440, 0.13]].forEach(([f, t]) => {
      const o = bus.ctx.createOscillator();
      const g = bus.ctx.createGain();
      o.type = "square"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, bus.ctx.currentTime + t);
      g.gain.linearRampToValueAtTime(0.06, bus.ctx.currentTime + t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, bus.ctx.currentTime + t + 0.12);
      o.connect(g); g.connect(bus.master);
      o.start(bus.ctx.currentTime + t); o.stop(bus.ctx.currentTime + t + 0.15);
    });
  }

  function nextLine(b) {
    const i = state.lineIdx[b.id] || 0;
    state.lineIdx[b.id] = i + 1;
    return b.lines[i % b.lines.length];
  }

  function openChat(b) {
    if (state.chats[b.id] && !state.chats[b.id].closed) { state.chats[b.id].focus(); return state.chats[b.id]; }
    const win = WM.create({
      title: b.name + " - Chat", icon: "pal",
      width: 340, height: 300, minWidth: 260, minHeight: 200
    });
    state.chats[b.id] = win;
    const log = el("div", { class: "sunken", style: "flex:1;overflow:auto;background:#fff;padding:4px;font-size:12px;line-height:1.5" });
    const inputRow = el("div", { style: "display:flex;gap:4px;padding:4px;flex:none" });
    const inp = el("input", { type: "text", class: "field", style: "flex:1" });
    const sendB = el("button", { class: "btn", text: "Send", style: "min-width:56px" });
    inputRow.append(inp, sendB);
    win.body.append(log, inputRow);

    function addMsg(who, text, color) {
      const d = el("div");
      d.append(el("b", { text: who + ": ", style: "color:" + color }), text);
      log.append(d);
      log.scrollTop = log.scrollHeight;
    }
    if (!b.online) addMsg("System", b.name + " is offline. Messages will be delivered never.", "#808080");

    let replyTimer = null;
    function send() {
      const t = inp.value.trim();
      if (!t) return;
      inp.value = "";
      addMsg(Store.get("userName", "You"), t, "#0000a0");
      Sound.play("click");
      if (!b.online) return;
      clearTimeout(replyTimer);
      const typing = el("div", { style: "color:#808080;font-style:italic", text: b.name + " is typing..." });
      setTimeout(() => { if (!win.closed) { log.append(typing); log.scrollTop = log.scrollHeight; } }, 700);
      replyTimer = setTimeout(() => {
        if (win.closed) return;
        typing.remove();
        addMsg(b.name, nextLine(b), "#a00000");
        uhOh();
      }, 1600 + Math.random() * 2200);
    }
    sendB.addEventListener("click", send);
    inp.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") send();
    });
    win.opts.onClose = () => clearTimeout(replyTimer);
    setTimeout(() => inp.focus(), 60);
    return win;
  }

  W98.Apps.pal = {
    name: "Pal Messenger", icon: "pal", single: true,
    launch() {
      let status = "Online";
      const win = WM.create({
        title: "Pal Messenger", icon: "pal", appId: "pal",
        width: 210, height: 380, minWidth: 180, minHeight: 260,
        statusbar: [{ text: "1,337,204 pals online" }],
        menus: [
          { label: "File", items: () => [
            { label: "My Status", sub: ["Online", "Away", "Invisible"].map(s => ({
              label: s, radio: true, checked: status === s, click: () => {
                status = s;
                statusLbl.textContent = "Status: " + s;
                if (s === "Away") Sound.play("minimize"); else Sound.play("maximize");
              }
            }))},
            "-",
            { label: "Exit", click: () => win.close() }
          ]},
          { label: "Help", items: () => [
            { label: "About Pal Messenger", click: () => Dialogs.about("Pal Messenger", "pal", ["Uh oh! Someone wants to chat.", "1,337,204 pals online (source: us)."]) }
          ]}
        ],
        onClose: () => clearInterval(state.presenceTimer)
      });
      const head = el("div", { style: "flex:none;padding:5px;display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--shadow)" });
      const statusLbl = el("span", { text: "Status: Online", style: "font-size:11px" });
      head.append(Icons.img("pal", 16), statusLbl);
      const list = el("div", { class: "listview sunken", style: "flex:1;padding:2px" });
      win.body.append(head, list);

      function paint() {
        list.innerHTML = "";
        const grp = (label) => list.append(el("div", { style: "font-weight:700;padding:3px 2px 1px;color:#000080", text: label }));
        grp("Online");
        BUDDIES.filter(b => b.online).forEach(b => {
          const row = el("div", { class: "lv-item" }, el("span", { text: "🌼", style: "font-size:11px" }), el("span", { class: "nm", text: b.name }));
          row.addEventListener("dblclick", () => openChat(b));
          list.append(row);
        });
        grp("Offline");
        BUDDIES.filter(b => !b.online).forEach(b => {
          const row = el("div", { class: "lv-item", style: "color:#808080" }, el("span", { text: "💤", style: "font-size:11px" }), el("span", { class: "nm", text: b.name }));
          row.addEventListener("dblclick", () => openChat(b));
          list.append(row);
        });
        list.append(el("div", { style: "padding:6px 2px;font-size:10px;color:#606060", text: "Double-click a pal to chat" }));
      }
      paint();

      /* pals wander on and off line, as pals did */
      clearInterval(state.presenceTimer);
      state.presenceTimer = setInterval(() => {
        if (win.closed) { clearInterval(state.presenceTimer); return; }
        const flippable = BUDDIES.filter(b => b.id !== "rick");
        const b = flippable[(Math.random() * flippable.length) | 0];
        b.online = !b.online;
        uhOh();
        paint();
        win.setStatus(0, (1337204 + ((Math.random() * 900) | 0)).toLocaleString() + " pals online");
      }, 45000 + Math.random() * 30000);

      return win;
    }
  };
})();

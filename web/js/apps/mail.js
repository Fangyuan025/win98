/* mail.js — Internet Mail (an Outlook-Express-era mail client, fully local) */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  function seedMail() {
    const t0 = Date.now();
    return {
      Inbox: [
        { from: "The Internet Mail Team", subj: "Welcome to Internet Mail!", at: t0 - 86400000 * 3, read: false, body:
"Welcome!\n\nThis is your new electronic mailbox. A few tips:\n\n  - Click a message to read it in the preview pane below.\n  - Click Compose to write a new message. When you press Send,\n    it lands in your Sent Items folder at the speed of a 56k modem.\n  - Reply quotes the original message with > marks, as tradition demands.\n  - Deleted messages go to Deleted Items. They stay there forever,\n    because deleting things twice felt wrong in 1998 too.\n\nHappy mailing!\n— The Internet Mail Team" },
        { from: "Aunt Carol", subj: "FW: FW: FW: You have to read this!!!", at: t0 - 86400000 * 2, read: false, body:
"> > > Forward this to ten people you know and something AMAZING\n> > > will happen on Friday!!!\n> >\n> > (I don't usually forward these but this one seemed important)\n>\n> (me neither but just in case)\n\nHi sweetie! Not sure if you got my last three forwards. Is this\nthing working? Anyway see you Sunday.\n\n- Aunt Carol\n\nP.S. How do I make the writing bigger?" },
        { from: "StarDust", subj: "you signed my guestbook!!", at: t0 - 86400000, read: false, body:
"omg thank you SO much for signing my guestbook!! ^_^\n\nim adding a new page to my site about my cat, it should be up\nnext week if the FTP cooperates. check it out at\nhttp://members.geosities.com/~stardust/\n\nkeep surfin'!\n~*~ StArDuSt ~*~" },
        { from: "My ISP Billing", subj: "Your invoice: $19.95", at: t0 - 3600000 * 5, read: true, body:
"Dear Valued Customer,\n\nYour monthly invoice for unlimited* internet access is $19.95.\n\n* Unlimited is limited to 150 hours. Additional hours are billed\n  at $2.95/hour. Please disconnect when not in use. Your phone\n  line thanks you, and so does everyone trying to call you.\n\n— My ISP, \"The Internet People\"" }
      ],
      Outbox: [],
      "Sent Items": [],
      "Deleted Items": []
    };
  }

  function store() {
    let m = Store.get("mail", null);
    if (!m) { m = seedMail(); Store.set("mail", m); }
    return m;
  }
  function save(m) { Store.set("mail", m); }

  W98.Apps.mail = {
    name: "Internet Mail", icon: "mail", single: true,
    launch(extArg) {
      const mail = store();
      let curFolder = "Inbox", curIdx = -1;

      const win = WM.create({
        title: "Inbox - Internet Mail", icon: "mail", appId: "mail",
        width: 640, height: 480, minWidth: 480, minHeight: 340,
        statusbar: [{ text: "" }, { text: "Working Online", width: 110 }],
        menus: [
          { label: "File", items: () => [
            { label: "New Message", accel: "Ctrl+N", click: compose },
            "-",
            { label: "Folder", sub: Object.keys(mail).map(f => ({
              label: f, icon: "folder", click: () => setFolder(f)
            }))},
            "-",
            { label: "Exit", click: () => win.close() }
          ]},
          { label: "Edit", items: () => [
            { label: "Delete Message", accel: "Del", disabled: curIdx < 0, click: delMsg },
            "-",
            { label: "Mark All as Read", click: () => { mail[curFolder].forEach(m => m.read = true); save(mail); refresh(); } }
          ]},
          { label: "Mail", items: () => [
            { label: "Reply to Author", accel: "Ctrl+R", disabled: curIdx < 0, click: reply },
            { label: "Send and Receive", click: sendReceive }
          ]},
          { label: "Help", items: () => [
            { label: "About Internet Mail", click: () => Dialogs.about("Internet Mail", "mail", ["Electronic mail for the discerning netizen.", "All correspondence stays on this computer."]) }
          ]}
        ]
      });

      /* toolbar */
      const tbar = el("div", { class: "toolbar" });
      const mkTool = (label, icon, fn) => {
        const b = el("button", { class: "tool-btn", dataset: { tip: label } });
        b.append(Icons.img(icon, 20), el("span", { text: label, style: "font-size:10px" }));
        b.addEventListener("click", fn);
        tbar.append(b);
        return b;
      };
      mkTool("Compose", "mail", compose);
      const replyB = mkTool("Reply", "tb_back", reply);
      tbar.append(el("div", { class: "tsep" }));
      const delB = mkTool("Delete", "tb_del", delMsg);
      tbar.append(el("div", { class: "tsep" }));
      mkTool("Send/Recv", "dialup", sendReceive);

      /* panes: folder tree | list / preview */
      const body = el("div", { class: "exp-body" });
      const tree = el("div", { class: "tree sunken", style: "width:130px;flex:none;margin-right:3px" });
      const right = el("div", { style: "flex:1;display:flex;flex-direction:column;min-width:0" });
      const list = el("div", { class: "listview sunken", style: "flex:1;min-height:60px" });
      const preview = el("div", { class: "sunken", style: "flex:1;margin-top:3px;padding:6px;overflow:auto;font-family:'Courier New',monospace;font-size:12px;white-space:pre-wrap;background:#fff" });
      right.append(list, preview);
      body.append(tree, right);
      win.body.append(tbar, body);

      function unread(f) { return mail[f].filter(m => !m.read).length; }

      function paintTree() {
        tree.innerHTML = "";
        const rootRow = el("div", { class: "tree-row" });
        rootRow.append(el("div", { class: "tree-tg" }), Icons.img("mail", 16), el("span", { class: "tlabel", text: "Internet Mail" }));
        tree.append(rootRow);
        Object.keys(mail).forEach(f => {
          const n = unread(f);
          const row = el("div", { class: "tree-row", style: "padding-left:14px" });
          row.append(el("div", { class: "tree-tg" }), Icons.img("folder", 16),
            el("span", { class: "tlabel", text: f + (n ? " (" + n + ")" : ""), style: n ? "font-weight:700" : "" }));
          if (f === curFolder) row.classList.add("sel");
          row.addEventListener("mousedown", () => setFolder(f));
          tree.append(row);
        });
      }

      function paintList() {
        list.innerHTML = "";
        const table = el("table", { style: "border-collapse:collapse;width:100%" });
        const hd = el("tr");
        ["From", "Subject", "Received"].forEach(h => hd.append(el("th", {
          text: h, style: "text-align:left;padding:2px 6px;background:var(--face);box-shadow:inset -1px -1px var(--dark), inset 1px 1px var(--lighter);position:sticky;top:0"
        })));
        table.append(hd);
        mail[curFolder].forEach((m, i) => {
          const tr = el("tr", { style: m.read ? "" : "font-weight:700" });
          tr.append(
            el("td", { text: m.from, style: "padding:1px 6px;white-space:nowrap" }),
            el("td", { text: m.subj, style: "padding:1px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px" }),
            el("td", { text: fmtShortDate(m.at), style: "padding:1px 6px;white-space:nowrap" }));
          if (i === curIdx) { tr.style.background = "var(--hl)"; tr.style.color = "#fff"; }
          tr.addEventListener("mousedown", () => {
            curIdx = i;
            m.read = true;
            save(mail);
            refresh();
          });
          table.append(tr);
        });
        list.append(table);
        if (!mail[curFolder].length) {
          list.append(el("div", { style: "padding:16px;color:#808080;text-align:center", text: "There are no items in this folder." }));
        }
      }

      function paintPreview() {
        const m = mail[curFolder][curIdx];
        if (!m) { preview.textContent = ""; return; }
        preview.innerHTML = "";
        preview.append(
          el("div", { style: "font-family:var(--font);font-size:11px;background:var(--face);margin:-6px -6px 6px;padding:4px 6px;box-shadow:0 1px var(--shadow)", html:
            "<b>From:</b> " + m.from.replace(/</g, "&lt;") + "<br><b>Subject:</b> " + m.subj.replace(/</g, "&lt;") }),
          document.createTextNode(m.body));
      }

      function refresh() {
        paintTree(); paintList(); paintPreview();
        replyB.disabled = delB.disabled = curIdx < 0 || !mail[curFolder].length;
        win.setTitle(curFolder + " - Internet Mail");
        win.setStatus(0, mail[curFolder].length + " message(s), " + unread(curFolder) + " unread");
      }
      function setFolder(f) { curFolder = f; curIdx = -1; refresh(); }

      function delMsg() {
        const m = mail[curFolder][curIdx];
        if (!m) return;
        mail[curFolder].splice(curIdx, 1);
        if (curFolder !== "Deleted Items") mail["Deleted Items"].push(m);
        curIdx = -1;
        save(mail);
        Sound.play("recycle");
        refresh();
      }

      function sendReceive() {
        if (W98.Net && !W98.Net.connected) { W98.Net.require(() => sendReceive()); return; }
        win.setStatus(1, "Connecting...");
        Sound.play("click");
        setTimeout(() => {
          const pending = mail.Outbox.splice(0, mail.Outbox.length);
          pending.forEach(m => mail["Sent Items"].push(m));
          save(mail);
          win.setStatus(1, "Working Online");
          refresh();
          WM.msgbox({
            title: "Internet Mail", icon: "info",
            text: pending.length
              ? "Sent " + pending.length + " message(s).\nNo new messages on the server."
              : "No new messages on the server.\n(The server is imaginary, which keeps spam remarkably low.)"
          });
        }, 1200);
      }

      function compose(prefill) {
        const cw = WM.create({
          title: "New Message", icon: "mail",
          width: 480, height: 380, minWidth: 380, minHeight: 280,
          menus: [
            { label: "File", items: () => [{ label: "Close", click: () => cw.close() }] },
            { label: "Help", items: () => [{ label: "About Internet Mail", click: () => Dialogs.about("Internet Mail", "mail") }] }
          ]
        });
        const to = el("input", { type: "text", class: "field", value: (prefill && prefill.to) || "" });
        const subj = el("input", { type: "text", class: "field", value: (prefill && prefill.subj) || "" });
        const bodyTa = el("textarea", { class: "notepad-ta", spellcheck: "false" });
        bodyTa.value = (prefill && prefill.body) || "";
        const head = el("div", { style: "display:grid;grid-template-columns:52px 1fr;gap:6px 8px;padding:8px;flex:none;align-items:center" },
          el("span", { text: "To:" }), to,
          el("span", { text: "Subject:" }), subj);
        const bar = el("div", { style: "display:flex;gap:6px;padding:4px 8px;flex:none" });
        const send = el("button", { class: "btn default", text: "Send" });
        bar.append(send);
        cw.body.append(bar, head, bodyTa);
        bodyTa.style.margin = "0 8px 8px";
        bodyTa.addEventListener("keydown", e => e.stopPropagation());
        send.addEventListener("click", () => {
          const m = {
            from: "You  (to: " + (to.value.trim() || "nobody@nowhere") + ")",
            subj: subj.value.trim() || "(no subject)",
            at: Date.now(), read: true, body: bodyTa.value
          };
          mail.Outbox.push(m);
          save(mail);
          cw.close(true);
          Sound.play("ding");
          refresh();
          WM.msgbox({
            title: "Internet Mail", icon: "info",
            text: "Your message has been placed in the Outbox.\nClick Send/Recv to deliver it (to your Sent Items — it is 1998 and also a simulation)."
          });
        });
        setTimeout(() => (prefill ? bodyTa : to).focus(), 60);
      }

      function reply() {
        const m = mail[curFolder][curIdx];
        if (!m) return;
        compose({
          to: m.from.replace(/\s+/g, ".").toLowerCase() + "@example.net",
          subj: (m.subj.startsWith("Re:") ? "" : "Re: ") + m.subj,
          body: "\n\n---- Original Message ----\n" + m.body.split("\n").map(l => "> " + l).join("\n")
        });
      }

      win.el.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
        if (e.key === "Delete") delMsg();
        if ((e.ctrlKey || e.metaKey) && e.key === "n") { e.preventDefault(); compose(); }
        if ((e.ctrlKey || e.metaKey) && e.key === "r") { e.preventDefault(); reply(); }
      });

      refresh();
      if (extArg && extArg.compose) setTimeout(() => compose(extArg.compose), 250);
      W98.Apps.mail.reopen = (w, arg2) => { if (arg2 && arg2.compose) compose(arg2.compose); };
      return win;
    }
  };
})();

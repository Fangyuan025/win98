/* access.js — Accessibility accessories: Magnifier + On-Screen Keyboard,
   plus two small classics: Clipboard Viewer and Address Book. */
"use strict";
W98.Apps = W98.Apps || {};

/* ================= Magnifier ================= */
W98.Apps.magnifier = {
  name: "Magnifier", icon: "magnifier", single: true,
  launch() {
    const win = WM.create({
      title: "Microsoft Magnifier", icon: "magnifier", appId: "magnifier",
      width: 420, height: 180, minWidth: 260, minHeight: 120
    });
    const cv = el("canvas", { style: "flex:1;image-rendering:pixelated;background:#000" });
    win.body.append(cv);
    const x = cv.getContext("2d");
    let zoom = Store.get("magZoom", 3);
    let mx = innerWidth / 2, my = innerHeight / 2;
    let raf = null, stop = false;

    document.addEventListener("mousemove", onMove, { passive: true });
    function onMove(e) { mx = e.clientX; my = e.clientY; }

    /* html2canvas-free approach: we re-render what we know — the screen element —
       by drawing a scaled snapshot region using drawWindow-ish trick: since we cannot
       screenshot the DOM, we mirror the desktop wallpaper + windows as colored boxes.
       Cheap, honest, and it moves. For real magnification of canvas apps, we sample
       any canvas under the lens directly. */
    function frame() {
      if (stop) return;
      const w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== w) cv.width = w;
      if (cv.height !== h) cv.height = h;
      const sw = w / zoom, sh = h / zoom;
      const sx = clamp(mx - sw / 2, 0, Math.max(0, innerWidth - sw));
      const sy = clamp(my - sh / 2, 0, Math.max(0, innerHeight - sh));
      /* desktop base */
      x.fillStyle = getComputedStyle(document.getElementById("desktop")).backgroundColor || "#008080";
      x.fillRect(0, 0, w, h);
      /* draw each visible element rectangle scaled: windows, taskbar, icons */
      const els = [
        ...[...document.querySelectorAll("#icons > div")].map(e2 => ({ e: e2, kind: "icon" })),
        ...W98.WM.wins.filter(w2 => !w2.minimized).map(w2 => ({ e: w2.el, kind: "win" })),
        { e: document.getElementById("taskbar"), kind: "bar" }
      ];
      for (const { e: e2, kind } of els) {
        if (!e2) continue;
        const r = e2.getBoundingClientRect();
        const dx = (r.x - sx) * zoom, dy = (r.y - sy) * zoom;
        const dw = r.width * zoom, dh = r.height * zoom;
        if (dx > w || dy > h || dx + dw < 0 || dy + dh < 0) continue;
        if (kind === "win") {
          x.fillStyle = "#c0c0c0"; x.fillRect(dx, dy, dw, dh);
          x.fillStyle = "#000080"; x.fillRect(dx + 2 * zoom, dy + 2 * zoom, dw - 4 * zoom, 14 * zoom);
          x.fillStyle = "#fff";
          x.font = (9 * zoom) + "px Tahoma, sans-serif";
          const t = e2.querySelector(".title-text");
          x.fillText((t ? t.textContent : "").slice(0, 30), dx + 4 * zoom, dy + 12 * zoom);
          /* windows containing a canvas get the real pixels */
          const innerCv = e2.querySelector("canvas");
          if (innerCv && innerCv.width > 4) {
            const cr = innerCv.getBoundingClientRect();
            try { x.drawImage(innerCv, (cr.x - sx) * zoom, (cr.y - sy) * zoom, cr.width * zoom, cr.height * zoom); } catch (err) {}
          }
        } else if (kind === "bar") {
          x.fillStyle = "#c0c0c0"; x.fillRect(dx, dy, dw, dh);
        } else {
          const img = e2.querySelector("img, canvas");
          if (img) { try { x.drawImage(img, dx, dy, 32 * zoom, 32 * zoom); } catch (err) {} }
          const lbl = e2.querySelector(".di-label, span");
          if (lbl) {
            x.fillStyle = "#fff"; x.font = (8 * zoom) + "px Tahoma, sans-serif";
            x.fillText(lbl.textContent.slice(0, 18), dx, dy + 42 * zoom);
          }
        }
      }
      /* crosshair for the actual pointer */
      x.strokeStyle = "#ff0000"; x.lineWidth = Math.max(1, zoom * 0.5);
      const px = (mx - sx) * zoom, py = (my - sy) * zoom;
      x.beginPath(); x.moveTo(px - 8, py); x.lineTo(px + 8, py); x.moveTo(px, py - 8); x.lineTo(px, py + 8); x.stroke();
      raf = setTimeout(frame, 90);
    }
    frame();

    const bar = el("div", { style: "flex:none;display:flex;align-items:center;gap:6px;padding:3px 6px;border-top:1px solid var(--shadow)" });
    bar.append(el("span", { text: "Magnification:" }));
    [2, 3, 4, 6].forEach(z => {
      const b = el("button", { class: "btn", text: z + "x", style: "min-width:34px;padding:1px 4px" });
      b.addEventListener("click", () => { zoom = z; Store.set("magZoom", z); });
      bar.append(b);
    });
    bar.append(el("span", { style: "margin-left:auto;font-size:10px;color:#606060", text: "Follows the mouse" }));
    win.body.append(bar);
    win.opts.onClose = () => { stop = true; clearTimeout(raf); document.removeEventListener("mousemove", onMove); };
    return win;
  }
};

/* ================= On-Screen Keyboard ================= */
W98.Apps.osk = {
  name: "On-Screen Keyboard", icon: "osk", single: true,
  launch() {
    const win = WM.create({
      title: "On-Screen Keyboard", icon: "osk", appId: "osk",
      width: 570, height: 210, resizable: false, maximizable: false
    });
    win.body.style.padding = "6px";
    win.body.style.background = "var(--face, #c0c0c0)";
    let shift = false, caps = false;
    const ROWS = [
      [["`","~"],["1","!"],["2","@"],["3","#"],["4","$"],["5","%"],["6","^"],["7","&"],["8","*"],["9","("],["0",")"],["-","_"],["=","+"],["Bksp",null,1.6]],
      [["Tab",null,1.4],["q"],["w"],["e"],["r"],["t"],["y"],["u"],["i"],["o"],["p"],["[","{"],["]","}"],["\\","|"]],
      [["Caps",null,1.7],["a"],["s"],["d"],["f"],["g"],["h"],["j"],["k"],["l"],[";",":"],["'","\""],["Enter",null,1.8]],
      [["Shift",null,2.2],["z"],["x"],["c"],["v"],["b"],["n"],["m"],[",","<"],[".",">"],["/","?"],["Shift2",null,2.2]],
      [["Space",null,9]]
    ];
    /* target: last focused editable element outside this window */
    let target = null;
    const ae = document.activeElement;
    if (ae && !win.el.contains(ae) && (ae.tagName === "TEXTAREA" || ae.tagName === "INPUT" || ae.isContentEditable)) target = ae;
    document.addEventListener("focusin", remember, true);
    function remember(e) {
      const t = e.target;
      if (win.el.contains(t)) return;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.isContentEditable)) target = t;
    }
    function send(ch) {
      if (!target || !document.body.contains(target)) {
        win.setStatus && win.setStatus(0, "Click into a text box first");
        return;
      }
      target.focus();
      if (ch === "\b") {
        if (target.isContentEditable) document.execCommand("delete");
        else {
          const s = target.selectionStart, e2 = target.selectionEnd;
          if (s === e2 && s > 0) { target.value = target.value.slice(0, s - 1) + target.value.slice(e2); target.selectionStart = target.selectionEnd = s - 1; }
          else { target.value = target.value.slice(0, s) + target.value.slice(e2); target.selectionStart = target.selectionEnd = s; }
          target.dispatchEvent(new Event("input", { bubbles: true }));
        }
        return;
      }
      if (target.isContentEditable) document.execCommand("insertText", false, ch);
      else {
        const s = target.selectionStart, e2 = target.selectionEnd;
        target.value = target.value.slice(0, s) + ch + target.value.slice(e2);
        target.selectionStart = target.selectionEnd = s + ch.length;
        target.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    const keyEls = [];
    ROWS.forEach(row => {
      const rEl = el("div", { style: "display:flex;gap:3px;margin-bottom:3px" });
      row.forEach(([k, alt, w2]) => {
        const b = el("button", { class: "btn oskkey", style: "flex:" + (w2 || 1) + ";min-width:0;padding:4px 0;font-size:11px" });
        const paint = () => {
          if (k === "Space") b.textContent = " ";
          else if (k === "Shift2") b.textContent = "Shift";
          else if (k.length > 1) b.textContent = k;
          else b.textContent = (shift ? (alt || k.toUpperCase()) : (caps && /[a-z]/.test(k) ? k.toUpperCase() : k));
          if ((k === "Shift" || k === "Shift2") && shift) b.classList.add("default"); else if (k.startsWith("Shift")) b.classList.remove("default");
          if (k === "Caps" && caps) b.classList.add("default"); else if (k === "Caps") b.classList.remove("default");
        };
        keyEls.push(paint);
        b.addEventListener("mousedown", (e) => e.preventDefault()); /* keep focus on target */
        b.addEventListener("click", () => {
          Sound.play("click");
          if (k === "Shift" || k === "Shift2") { shift = !shift; keyEls.forEach(f => f()); return; }
          if (k === "Caps") { caps = !caps; keyEls.forEach(f => f()); return; }
          if (k === "Bksp") { send("\b"); return; }
          if (k === "Tab") { send("\t"); return; }
          if (k === "Enter") { send("\n"); return; }
          if (k === "Space") { send(" "); return; }
          let ch = shift ? (alt || k.toUpperCase()) : (caps && /[a-z]/.test(k) ? k.toUpperCase() : k);
          send(ch);
          if (shift) { shift = false; keyEls.forEach(f => f()); }
        });
        paint();
        rEl.append(b);
      });
      win.body.append(rEl);
    });
    win.opts.onClose = () => document.removeEventListener("focusin", remember, true);
    return win;
  }
};

/* ================= Clipboard Viewer ================= */
W98.Apps.clipbook = {
  name: "Clipboard Viewer", icon: "clipboard", single: true,
  launch() {
    const win = WM.create({
      title: "Clipboard Viewer", icon: "clipboard", appId: "clipbook",
      width: 380, height: 260, minWidth: 240, minHeight: 160,
      menus: [
        { label: "File", items: () => [{ label: "Exit", click: () => win.close() }] },
        { label: "Edit", items: () => [
          { label: "Refresh", click: paint },
          { label: "Clear", click: async () => { try { await navigator.clipboard.writeText(""); } catch (e) {} W98.clipText = ""; paint(); } }
        ]}
      ]
    });
    const body = el("div", { class: "sunken", style: "flex:1;background:#fff;overflow:auto;padding:6px;white-space:pre-wrap;font-family:'Courier New',monospace;font-size:12px" });
    win.body.append(body);
    async function paint() {
      let t = null;
      try { t = await navigator.clipboard.readText(); } catch (e) { t = null; }
      if (t == null) t = W98.clipText || null;
      body.textContent = (t === null)
        ? "(The system clipboard is shy. Copy some text anywhere,\nthen Edit > Refresh.)"
        : (t === "" ? "(The clipboard is empty.)" : t);
    }
    paint();
    win.opts.onFocus = paint;
    return win;
  }
};

/* ================= Address Book ================= */
W98.Apps.addrbook = {
  name: "Address Book", icon: "addrbook", single: true,
  launch() {
    const DEFAULTS = [
      { name: "Dave Kowalski", email: "cooldave2000@web98.net", phone: "555-0134", note: "LAN party host. Bring own mouse." },
      { name: "Sara (StarDust)", email: "stardust@geosities.com", phone: "555-0182", note: "Has the cat page. Sign the guestbook." },
      { name: "Jenny", email: "xxjennyxx@web98.net", phone: "555-0126", note: "Mixtape in progress (11 songs)." },
      { name: "Mom", email: "mom@familypc.home", phone: "555-0100", note: "CAPS LOCK is not anger." },
      { name: "Uncle Rick", email: "rick@ricknet.biz", phone: "555-0177", note: "Computer 'makes the noise'. Do not ask." }
    ];
    let contacts = Store.get("addressBook", null) || DEFAULTS.slice();
    const save = () => Store.set("addressBook", contacts);

    const win = WM.create({
      title: "Address Book", icon: "addrbook", appId: "addrbook",
      width: 470, height: 320, minWidth: 360, minHeight: 220,
      statusbar: [{ text: contacts.length + " contact(s)" }],
      menus: [
        { label: "File", items: () => [
          { label: "New Contact...", click: addContact },
          { label: "Delete Contact", disabled: sel < 0, click: delContact },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Help", items: () => [
          { label: "About Address Book", click: () => Dialogs.about("Address Book", "addrbook", ["Everyone you know, in one file.", "Backs up to nowhere."]) }
        ]}
      ]
    });
    const tbar = el("div", { class: "toolbar" });
    const mkT = (label, fn) => { const b = el("button", { class: "tbtn", text: label }); b.addEventListener("click", fn); tbar.append(b); };
    mkT("New", addContact); mkT("Delete", delContact); mkT("Send Mail", mailSel);
    const body = el("div", { style: "flex:1;display:flex;min-height:0" });
    const list = el("div", { class: "listview sunken", style: "flex:1.2;margin-right:3px;overflow:auto" });
    const detail = el("div", { class: "sunken", style: "flex:1;background:#fff;padding:8px;overflow:auto" });
    body.append(list, detail);
    win.body.append(tbar, body);
    win.body.style.padding = "3px";

    let sel = -1;
    function paint() {
      list.innerHTML = "";
      contacts.forEach((c, i) => {
        const row = el("div", { class: "lv-item" + (i === sel ? " sel" : "") },
          Icons.img("addrbook", 16), el("span", { class: "nm", text: c.name }));
        row.addEventListener("mousedown", () => { sel = i; paint(); });
        row.addEventListener("dblclick", mailSel);
        list.append(row);
      });
      const c = contacts[sel];
      detail.innerHTML = "";
      if (c) {
        detail.append(
          el("div", { style: "font-weight:700;font-size:14px;margin-bottom:6px", text: c.name }),
          el("div", { style: "margin-bottom:2px" }, el("b", { text: "E-mail: " }), c.email || "—"),
          el("div", { style: "margin-bottom:2px" }, el("b", { text: "Phone: " }), c.phone || "—"),
          el("div", { style: "margin-top:8px;color:#404040;font-style:italic", text: c.note || "" })
        );
      } else detail.append(el("div", { style: "color:#808080", text: "Select a contact." }));
      win.setStatus(0, contacts.length + " contact(s)");
    }
    async function addContact() {
      const name = await Dialogs.prompt({ title: "New Contact", icon: "addrbook", label: "Name:" });
      if (!name) return;
      const email = await Dialogs.prompt({ title: "New Contact", icon: "addrbook", label: "E-mail address:", value: name.toLowerCase().replace(/\s+/g, "") + "@web98.net" });
      if (email == null) return;
      const phone = await Dialogs.prompt({ title: "New Contact", icon: "addrbook", label: "Phone:", value: "555-01" + String((Math.random() * 90 + 10) | 0) });
      contacts.push({ name, email, phone: phone || "", note: "" });
      sel = contacts.length - 1;
      save(); paint();
      Sound.play("ding");
    }
    function delContact() {
      if (sel < 0) return;
      const c = contacts[sel];
      WM.msgbox({ title: "Address Book", icon: "question", text: "Delete '" + c.name + "'?", buttons: ["Yes", "No"] }).then(r => {
        if (r !== "Yes") return;
        contacts.splice(sel, 1); sel = -1; save(); paint();
      });
    }
    function mailSel() {
      const c = contacts[sel];
      if (!c) return;
      W98.launch("mail", { compose: { to: c.email, subj: "", body: "" } });
    }
    paint();
    return win;
  }
};

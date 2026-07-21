/* organizer.js — Calendar 98 + Sticky Notes: the paper on your desk, digitized.
   Events and notes persist across reboots, like guilt. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  /* ================= Calendar 98 ================= */
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const key = (y, m, d) => y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");

  W98.Apps.calendar = {
    name: "Calendar 98", icon: "calendar", single: true,
    launch() {
      const today = new Date();
      let vy = today.getFullYear(), vm = today.getMonth();
      let selDay = today.getDate();

      const win = WM.create({
        title: "Calendar 98", icon: "calendar", appId: "calendar",
        width: 460, height: 400, minWidth: 380, minHeight: 320,
        statusbar: [{ text: "" }],
        menus: [
          { label: "File", items: () => [{ label: "Exit", click: () => win.close() }] },
          { label: "Go", items: () => [
            { label: "Today", click: () => { vy = today.getFullYear(); vm = today.getMonth(); selDay = today.getDate(); paint(); } },
            { label: "Previous Month", click: () => nav(-1) },
            { label: "Next Month", click: () => nav(1) }
          ]},
          { label: "Help", items: () => [
            { label: "About Calendar 98", click: () => Dialogs.about("Calendar 98", "calendar", ["Double-click a day to add an event.", "The weekend squares are load-bearing."]) }
          ]}
        ]
      });
      const events = () => Store.get("calEvents", {});
      const head = el("div", { style: "flex:none;display:flex;align-items:center;gap:6px;padding:5px 8px" });
      const prevB = el("button", { class: "btn", text: "<", style: "min-width:26px" });
      const nextB = el("button", { class: "btn", text: ">", style: "min-width:26px" });
      const title = el("span", { style: "flex:1;text-align:center;font-weight:700;font-size:13px" });
      head.append(prevB, title, nextB);
      const grid = el("div", { class: "sunken", style: "flex:1.4;display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:1fr;background:#fff;margin:0 6px;overflow:hidden" });
      const dayPane = el("div", { class: "sunken", style: "flex:1;background:#fff;margin:6px;padding:6px;overflow:auto" });
      win.body.append(head, grid, dayPane);

      function nav(d) { vm += d; if (vm < 0) { vm = 11; vy--; } if (vm > 11) { vm = 0; vy++; } selDay = 1; paint(); }
      prevB.addEventListener("click", () => nav(-1));
      nextB.addEventListener("click", () => nav(1));

      function paint() {
        title.textContent = MONTHS[vm] + " " + vy;
        grid.innerHTML = "";
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(d =>
          grid.append(el("div", { style: "background:var(--face,#c0c0c0);font-weight:700;text-align:center;padding:2px;font-size:10px;border-bottom:1px solid #808080", text: d })));
        const first = new Date(vy, vm, 1).getDay();
        const days = new Date(vy, vm + 1, 0).getDate();
        const ev = events();
        for (let i = 0; i < first; i++) grid.append(el("div", { style: "background:#efefef" }));
        for (let d = 1; d <= days; d++) {
          const isToday = vy === today.getFullYear() && vm === today.getMonth() && d === today.getDate();
          const k = key(vy, vm, d);
          const has = (ev[k] || []).length;
          const cell = el("div", {
            style: "border:1px solid #d8d8d8;padding:2px 3px;font-size:11px;cursor:default;position:relative;overflow:hidden" +
              (isToday ? ";background:#ffffd0" : "") + (d === selDay ? ";outline:2px solid var(--hl)" : "")
          }, el("span", { text: String(d), style: isToday ? "font-weight:700;color:#a00000" : "" }));
          if (has) cell.append(el("div", { style: "position:absolute;bottom:2px;left:3px;right:3px;height:4px;background:var(--hl);opacity:.7" }));
          cell.addEventListener("mousedown", () => { selDay = d; paint(); });
          cell.addEventListener("dblclick", () => addEvent(d));
          grid.append(cell);
        }
        paintDay();
        win.setStatus(0, Object.values(ev).reduce((a, b) => a + b.length, 0) + " event(s) on the books");
      }
      function paintDay() {
        dayPane.innerHTML = "";
        const k = key(vy, vm, selDay);
        const list = (events()[k] || []);
        dayPane.append(el("div", { style: "font-weight:700;margin-bottom:4px", text: MONTHS[vm] + " " + selDay + (list.length ? "" : " — nothing planned. A rare gift.") }));
        list.forEach((t, i) => {
          const row = el("div", { style: "display:flex;gap:6px;padding:1px 0;font-size:12px" },
            el("span", { text: "•" }), el("span", { style: "flex:1", text: t }));
          const del = el("span", { text: "×", style: "cursor:pointer;color:#a00000;font-weight:700", title: "Remove" });
          del.addEventListener("click", () => {
            const ev = events();
            ev[k].splice(i, 1);
            if (!ev[k].length) delete ev[k];
            Store.set("calEvents", ev);
            paint();
          });
          row.append(del);
          dayPane.append(row);
        });
        const addB = el("button", { class: "btn", text: "Add Event...", style: "margin-top:6px" });
        addB.addEventListener("click", () => addEvent(selDay));
        dayPane.append(addB);
      }
      async function addEvent(d) {
        selDay = d;
        const t = await Dialogs.prompt({ title: "New Event", icon: "calendar", label: MONTHS[vm] + " " + d + ", " + vy + " — what's happening?" });
        if (!t) return;
        const ev = events();
        const k = key(vy, vm, d);
        (ev[k] = ev[k] || []).push(t.trim());
        Store.set("calEvents", ev);
        Sound.play("ding");
        paint();
      }
      paint();
      return win;
    }
  };

  /* ================= Sticky Notes ================= */
  const Stickies = W98.Stickies = {
    all() { return Store.get("stickies", []); },
    save(list) { Store.set("stickies", list); },
    spawn(data) {
      const note = data || { id: Date.now() + Math.random(), text: "", x: 120 + Math.random() * 200, y: 80 + Math.random() * 160 };
      const win = WM.create({
        title: "Sticky Note", icon: "sticky", noTaskbar: false,
        width: 180, height: 150, minWidth: 120, minHeight: 100,
        frameless: false
      });
      win.el.style.left = note.x + "px";
      win.el.style.top = note.y + "px";
      win.body.style.background = "#ffff9e";
      const ta = el("textarea", {
        style: "flex:1;background:#ffff9e;border:0;resize:none;padding:6px;font-family:'Comic Sans MS','Comic Sans',cursive;font-size:13px;line-height:1.35;outline:none",
        spellcheck: "false", placeholder: "jot it down before you forget..."
      });
      ta.value = note.text;
      win.body.append(ta);
      const persist = () => {
        const list = Stickies.all();
        const idx = list.findIndex(n => n.id === note.id);
        note.text = ta.value;
        note.x = parseInt(win.el.style.left, 10) || note.x;
        note.y = parseInt(win.el.style.top, 10) || note.y;
        if (idx >= 0) list[idx] = note; else list.push(note);
        Stickies.save(list);
      };
      let deb = null;
      ta.addEventListener("input", () => { clearTimeout(deb); deb = setTimeout(persist, 400); });
      ta.addEventListener("keydown", e => e.stopPropagation());
      persist();
      win.opts.onClose = () => {
        /* closing a sticky throws it away — that's what stickies are for */
        Stickies.save(Stickies.all().filter(n => n.id !== note.id));
      };
      const mo = new MutationObserver(() => { clearTimeout(deb); deb = setTimeout(persist, 400); });
      mo.observe(win.el, { attributes: true, attributeFilter: ["style"] });
      return win;
    },
    restore() {
      Stickies.all().forEach(n => Stickies.spawn(n));
    }
  };

  W98.Apps.stickies = {
    name: "Sticky Notes", icon: "sticky",
    launch() { return Stickies.spawn(); }
  };

  /* ================= Active Desktop channel bar ================= */
  const CHANNELS = [
    ["The Web Times", "http://www.web-times.com/", "#b03030"],
    ["Weather 98", "http://www.weather98.com/", "#3060b0"],
    ["GameZone", "http://games.web98.net/", "#30a040"],
    ["MIDI Jukebox", "http://midi.web98.net/", "#9040b0"],
    ["StarDust", "http://members.geosities.com/~stardust/", "#c07020"],
    ["Y2K Watch", "http://www.y2kwatch.org/", "#807020"]
  ];
  W98.ChannelBar = {
    el: null,
    enabled() { return Store.get("channelBar", false); },
    show() {
      if (this.el) return;
      const bar = this.el = el("div", { id: "channelbar" });
      bar.append(el("div", { class: "chb-title", text: "Channels" }));
      CHANNELS.forEach(([name, url, col]) => {
        const b = el("div", { class: "chb-item", style: "border-left:4px solid " + col });
        b.append(el("span", { text: name }));
        b.addEventListener("click", () => W98.launch("ie", url));
        bar.append(b);
      });
      const off = el("div", { class: "chb-item chb-off", text: "× Close bar" });
      off.addEventListener("click", () => W98.ChannelBar.toggle(false));
      bar.append(off);
      $("#desktop").append(bar);
    },
    hide() { if (this.el) { this.el.remove(); this.el = null; } },
    toggle(on) {
      const want = on != null ? on : !this.enabled();
      Store.set("channelBar", want);
      want ? this.show() : this.hide();
    },
    init() { if (this.enabled()) this.show(); }
  };
})();

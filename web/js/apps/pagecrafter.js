/* pagecrafter.js — PageCrafter Express: build your GeoSities homepage.
   Publishing makes it live at http://members.geosities.com/~you/ in IE. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  const DEFAULTS = {
    title: "My Radical Homepage",
    tagline: "welcome to my corner of the web!!",
    about: "hi im new to html. this page is best viewed at 800x600.\ni like computers, my cat, and the x-files.",
    bg: "stars",
    color: "#00ff00",
    marquee: "** SIGN MY GUESTBOOK ** (guestbook coming soon)",
    counter: 137,
    construction: true,
    midi: true
  };
  W98.getHomepage = () => Store.get("homepage", null);

  function bgCss(bg) {
    if (bg === "stars") return "background:#000 radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 60% 70%, #fff, transparent), radial-gradient(1.5px 1.5px at 80% 20%, #fff, transparent), radial-gradient(1px 1px at 40% 80%, #aaf, transparent);background-size: 120px 120px;";
    if (bg === "clouds") return "background:#79a6d2;background-image:radial-gradient(ellipse 60px 24px at 30% 30%, #fff 60%, transparent 62%), radial-gradient(ellipse 80px 30px at 70% 60%, #fff 60%, transparent 62%);background-size:200px 140px;";
    if (bg === "checker") return "background:repeating-conic-gradient(#202 0% 25%, #404 0% 50%);background-size:28px 28px;";
    return "background:repeating-linear-gradient(45deg,#f6d020 0 16px,#111 16px 32px);";
  }
  W98.renderHomepageHTML = function (h) {
    h = h || W98.getHomepage() || DEFAULTS;
    const cons = h.construction
      ? `<div style="border:2px dashed #f6d020;color:#f6d020;background:#3a3000;padding:4px 8px;margin:8px auto;width:70%;font-weight:700">🚧 UNDER CONSTRUCTION — PLEASE PARDON OUR DUST 🚧</div>`
      : "";
    const midi = h.midi ? `<div style="font-size:10px;color:#909090">♪ now playing: cool_song.mid (you cannot stop it. this is authentic.) ♪</div>` : "";
    return `<div style="${bgCss(h.bg)};color:${h.color};text-align:center;font-family:'Times New Roman',serif;min-height:100%;padding:14px 10px">
      <h1 style="text-shadow:2px 2px #000;font-size:26px">${h.title}</h1>
      <div style="font-style:italic">${h.tagline}</div>
      ${cons}
      <div class="marquee-wrap" style="margin:6px 0"><span class="marquee" style="color:#ff4040">${h.marquee}</span></div>
      <div style="background:rgba(0,0,0,0.55);display:inline-block;text-align:left;padding:8px 14px;margin:6px;max-width:420px;white-space:pre-line">${h.about}</div>
      <div style="margin-top:8px">My cool links:
        <a href="http://members.geosities.com/~stardust/" style="color:#8ff">StarDust's page</a> *
        <a href="http://games.web98.net/" style="color:#8ff">GameZone</a> *
        <a href="http://www.duckydance.com/" style="color:#8ff">the duck</a></div>
      ${midi}
      <div style="margin-top:10px;font-family:'Courier New',monospace;background:#000;display:inline-block;padding:2px 8px;border:1px solid #333">
        You are visitor #<span style="color:#f00;font-weight:700">${(h.counter || 0) + (Store.get("homepageHits", 0))}</span></div>
      <div style="font-size:10px;margin-top:8px;color:#808080">made with PageCrafter Express | best viewed in IE at 800x600</div>
    </div>`;
  };

  W98.Apps.pagecrafter = {
    name: "PageCrafter Express", icon: "pagecrafter", single: true,
    launch() {
      const hp = Object.assign({}, DEFAULTS, Store.get("homepage", {}) || {});
      const win = WM.create({
        title: "PageCrafter Express - ~you", icon: "pagecrafter", appId: "pagecrafter",
        width: 700, height: 440, minWidth: 560, minHeight: 340,
        statusbar: [{ text: "Not published" }],
        menus: [
          { label: "File", items: () => [
            { label: "Publish to GeoSities", bold: true, click: publish },
            { label: "View in Internet Explorer", disabled: !Store.get("homepage", null), click: () => W98.launch("ie", "http://members.geosities.com/~you/") },
            "-",
            { label: "Exit", click: () => win.close() }
          ]},
          { label: "Help", items: () => [
            { label: "About PageCrafter", click: () => Dialogs.about("PageCrafter Express", "pagecrafter", ["You too can have a homepage.", "No HTML required (HTML not included)."]) }
          ]}
        ]
      });
      const body = el("div", { style: "flex:1;display:flex;min-height:0" });
      const form = el("div", { style: "width:250px;flex:none;overflow:auto;padding:8px;display:flex;flex-direction:column;gap:6px;border-right:1px solid var(--shadow)" });
      const prevWrap = el("div", { style: "flex:1;display:flex;flex-direction:column;min-width:0" });
      const prevLbl = el("div", { style: "flex:none;padding:2px 6px;font-size:11px;background:var(--face,#c0c0c0)", text: "Preview — http://members.geosities.com/~you/" });
      const prev = el("div", { class: "sunken", style: "flex:1;overflow:auto;background:#000" });
      prevWrap.append(prevLbl, prev);
      body.append(form, prevWrap);
      win.body.append(body);

      const fld = (label, input) => el("div", {}, el("div", { style: "font-size:11px;margin-bottom:2px", text: label }), input);
      const titleI = el("input", { type: "text", class: "field", style: "width:100%;box-sizing:border-box" }); titleI.value = hp.title;
      const tagI = el("input", { type: "text", class: "field", style: "width:100%;box-sizing:border-box" }); tagI.value = hp.tagline;
      const aboutI = el("textarea", { class: "field", style: "width:100%;height:64px;box-sizing:border-box;resize:none" }); aboutI.value = hp.about;
      const bgI = el("select", { class: "field", style: "width:100%" });
      [["stars", "Starry night"], ["clouds", "Cloudy sky"], ["checker", "Neon checkerboard"], ["caution", "Caution stripes"]].forEach(([v, l]) => {
        const o = el("option", { value: v, text: l }); if (v === hp.bg) o.selected = true; bgI.append(o);
      });
      const colorI = el("select", { class: "field", style: "width:100%" });
      [["#00ff00", "Hacker green"], ["#ffff00", "Warning yellow"], ["#ff66ff", "Hot pink"], ["#00ffff", "Cyber cyan"], ["#ffffff", "Plain white (boring)"]].forEach(([v, l]) => {
        const o = el("option", { value: v, text: l }); if (v === hp.color) o.selected = true; colorI.append(o);
      });
      const marqI = el("input", { type: "text", class: "field", style: "width:100%;box-sizing:border-box" }); marqI.value = hp.marquee;
      const cntI = el("input", { type: "number", class: "field", style: "width:100%;box-sizing:border-box" }); cntI.value = hp.counter;
      const consC = el("label", { class: "checkline" }, el("input", { type: "checkbox" }), "\"Under Construction\" banner");
      $("input", consC).checked = hp.construction;
      const midiC = el("label", { class: "checkline" }, el("input", { type: "checkbox" }), "Auto-play MIDI (rude but traditional)");
      $("input", midiC).checked = hp.midi;
      const pubB = el("button", { class: "btn default", text: "Publish!", style: "margin-top:4px" });
      form.append(
        fld("Page title:", titleI), fld("Tagline:", tagI), fld("About me:", aboutI),
        fld("Background:", bgI), fld("Text color:", colorI), fld("Marquee text:", marqI),
        fld("Visitor counter starts at:", cntI), consC, midiC, pubB
      );

      function collect() {
        return {
          title: titleI.value.trim() || DEFAULTS.title,
          tagline: tagI.value.trim(),
          about: aboutI.value,
          bg: bgI.value, color: colorI.value,
          marquee: marqI.value.trim(),
          counter: Math.max(0, parseInt(cntI.value, 10) || 0),
          construction: $("input", consC).checked,
          midi: $("input", midiC).checked
        };
      }
      function paintPreview() {
        prev.innerHTML = W98.renderHomepageHTML(collect());
      }
      [titleI, tagI, aboutI, marqI, cntI].forEach(i => i.addEventListener("input", paintPreview));
      [bgI, colorI].forEach(i => i.addEventListener("change", paintPreview));
      [consC, midiC].forEach(c => $("input", c).addEventListener("change", paintPreview));
      [titleI, tagI, aboutI, marqI, cntI].forEach(i => i.addEventListener("keydown", e => e.stopPropagation()));

      function publish() {
        Store.set("homepage", collect());
        win.setStatus(0, "Published!");
        Sound.play("tada");
        WM.msgbox({
          title: "PageCrafter Express", icon: "info",
          text: "Your page is LIVE at:\n\nhttp://members.geosities.com/~you/\n\nThe upload took 4 minutes over 28.8k, which we have\ncompressed into this dialog for your convenience.",
          buttons: ["View It Now", "OK"]
        }).then(r => { if (r === "View It Now") W98.launch("ie", "http://members.geosities.com/~you/"); });
      }
      pubB.addEventListener("click", publish);

      paintPreview();
      return win;
    }
  };
})();

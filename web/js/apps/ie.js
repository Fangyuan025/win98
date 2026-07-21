/* ie.js — Internet Explorer with a built-in retro "internet" */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.ie = {
  name: "Internet Explorer", icon: "ie",
  launch(arg) {
    let history = [], future = [], current = null;
    const HOME = "http://www.welcome98.com/";

    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

    const PRODUCTS = [
      { icon: "🖥", name: "Pentium II 266 Tower", blurb: "64MB RAM and unearned confidence.", price: 1999 },
      { icon: "📠", name: "56k V.90 Modem", blurb: "Screaming included at no extra charge.", price: 89 },
      { icon: "💽", name: "4.3GB Hard Drive", blurb: "You will never, ever fill this.", price: 249 },
      { icon: "💿", name: "CD-R 10-Pack", blurb: "For backups* (*mix CDs).", price: 24 },
      { icon: "🖱", name: "Ergonomic Trackball", blurb: "The future of pointing, briefly.", price: 39 },
      { icon: "🥫", name: "Y2K Preparedness Kit", blurb: "Beans not included. See y2kwatch.org.", price: 12 }
    ];

    function pageAction(href) {
      const [, verb, arg] = href.split(":");
      const cart = Store.get("cart", []);
      switch (verb) {
        case "dialnow":
          W98.Net.require(() => navigate(current, true));
          return;
        case "linfr":
          Store.set("linLang", Store.get("linLang", "en") === "fr" ? "en" : "fr");
          navigate(current, true);
          return;
        case "cart-add":
          cart.push(parseInt(arg, 10));
          Store.set("cart", cart);
          Sound.play("ding");
          break;
        case "cart-del":
          cart.splice(parseInt(arg, 10), 1);
          Store.set("cart", cart);
          break;
        case "cart-clear":
          Store.set("cart", []);
          break;
        case "checkout": {
          const n = Store.get("orderCount", 0) + 1;
          const total = cart.reduce((a, i) => a + PRODUCTS[i].price, 0);
          Store.set("orderCount", n);
          Store.set("cart", []);
          Sound.play("tada");
          WM.msgbox({
            title: "CompuMart — Order Confirmed", icon: "info",
            text: "Order #" + String(19980000 + n) + " placed!\nTotal: $" + total.toLocaleString() +
              "\n\nYour items will arrive in 6-8 weeks by parcel post.\nThank you for shopping the future, today."
          });
          break;
        }
        case "play":
          W98.Music.play(parseInt(arg, 10));
          break;
        case "stopmusic":
          W98.Music.stop();
          break;
        case "scanupdates":
          Store.set("wuScanned", Store.get("wuScanned", 0) + 1);
          Sound.play("chimes");
          break;
        case "wuinstall": {
          const dw = WM.create({ title: "Windows Update", icon: "ie", width: 360, height: 0, resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true });
          dw.el.style.height = "auto";
          const bar = el("div", { class: "progress", style: "margin:6px 0" }, el("div", { class: "bar", style: "width:0%" }));
          const lbl = el("div", { text: "Downloading Q241234..." });
          dw.body.append(el("div", { style: "padding:14px 16px 12px" }, lbl, bar));
          const STEPS2 = ["Downloading Q241234 (Critical)...", "Downloading Q242437 (Recommended)...", "Downloading Q243199 (Vibes)...", "Installing updates..."];
          let p = 0;
          const iv = setInterval(() => {
            p += 5 + Math.random() * 9;
            $(".bar", bar).style.width = Math.min(100, p) + "%";
            lbl.textContent = STEPS2[Math.min(STEPS2.length - 1, (p / 26) | 0)];
            if (p >= 100) {
              clearInterval(iv);
              dw.close(true);
              Store.set("wuInstalled", true);
              Sound.play("tada");
              WM.msgbox({
                title: "Windows Update", icon: "info",
                text: "3 update(s) installed successfully.\nYour copy of Windows 98 is now Windows 98, but more so.\n\nA restart is recommended to complete installation.",
                buttons: ["Restart Now", "Later"]
              }).then(r => { if (r === "Restart Now") W98.Boot.restart(); else navigate(current, true); });
            }
          }, 180);
          return;
        }
        case "pet": case "treat": case "pounce": {
          catAction(verb);
          return;   // update in place, no reload
        }
      }
      navigate(current, true);
    }

    /* ---------- the built-in web ---------- */
    function guestbookEntries() { return Store.get("guestbook", [{ name: "Webmaster", msg: "Welcome to my corner of the World Wide Web!!", at: "07/04/1998" }]); }

    const SITES = {
      "http://www.welcome98.com/": () => `
        <div style="background:#000080;color:#fff;padding:14px;text-align:center">
          <span style="font-size:28px;font-family:'Times New Roman'">✦ The Windows 98 Start Page ✦</span><br>
          <span style="font-size:12px">Your home base for exploring the World Wide Web — est. June 25, 1998</span>
        </div>
        <table width="100%" cellpadding="10"><tr>
        <td valign="top" width="30%" style="vertical-align:top;width:30%;padding:10px">
          <b>Channels</b><hr>
          <a href="http://www.altavibe.com/">🔍 AltaVibe Search</a><br><br>
          <a href="http://www.web-times.com/">📰 The Web Times</a><br><br>
          <a href="http://games.web98.net/">🕹 Games Arcade</a><br><br>
          <a href="http://members.geosities.com/~stardust/">🏠 Cool Homepage of the Day</a><br><br>
          <a href="http://www.fangyuanlin.com/">👤 Fangyuan Lin — Hello, bonjour.</a><br><br>
          <a href="http://www.y2kwatch.org/">⏰ Y2K Watch</a><br><br>
          <a href="http://www.compumart.com/">🛒 CompuMart</a><br><br>
          <a href="http://www.weather98.com/">⛅ Weather 98</a><br><br>
          <a href="http://midi.web98.net/">🎵 MIDI Jukebox</a><br><br>
          <a href="http://www.duckydance.com/">🦆 Dancing Duckies</a><br><br>
          <a href="http://www.cool-corner.net/webring/">🔗 The Cool Corner WebRing</a><br><br>
          <a href="http://www.web98.net/about/">ℹ About this browser</a>
        </td>
        <td valign="top" style="vertical-align:top;padding:10px">
          <b>Welcome, Netizen!</b>
          <p>It is a beautiful day on the <i>Information Superhighway</i>. Grab your 56k modem
          and surf responsibly. This copy of the Internet has been carefully preserved from 1998
          and is stored entirely on your computer — no phone line required!</p>
          <div style="border:2px solid #000080;background:#e8ecff;padding:8px 10px;margin:8px 0">
            <b style="color:#000080">★ FEATURED SITE OF THE DAY ★</b><br>
            <a href="http://www.fangyuanlin.com/"><b>fangyuanlin.com</b> — Hello, bonjour.</a><br>
            <span style="font-size:11px">An engineer from Montréal who insists computers should run their own AI.
            Terminal aesthetic, bilingual, and a <a href="http://www.fangyuanlin.com/blog/">guest essay from the year 2026</a>.
            The webring committee approves.</span>
          </div>
          <p><b>Today's headlines:</b></p>
          <ul>
            <li><a href="http://www.web-times.com/">Windows 98 released to record crowds</a></li>
            <li><a href="http://www.web-times.com/">Scientists: Y2K "probably fine"</a></li>
            <li><a href="http://games.web98.net/">New game craze: clicking on squares that might be mines</a></li>
          </ul>
          <p style="text-align:center;margin-top:20px">
            <span style="background:#ffff00">★ Best viewed at 800x600 in 256 colors ★</span>
          </p>
        </td></tr></table>`,

      "http://www.altavibe.com/": (q) => `
        <div style="text-align:center;padding:20px">
          <span style="font-size:34px;font-family:'Times New Roman';color:#000080">Alta<span style="color:#c00000">Vibe</span></span><br>
          <span style="font-size:11px">the search engine that totally finds things™</span>
          <form data-search="1" style="margin-top:14px">
            <input name="q" value="${esc(q || "")}" style="width:280px;font-size:13px;border:2px inset #ccc;padding:2px">
            <button style="font-size:12px">Search</button>
          </form>
        </div>
        ${q ? searchResults(q) : `<div style="text-align:center;font-size:11px;color:#555">Tip: try searching for <a href="http://www.altavibe.com/?q=games">games</a>, <a href="http://www.altavibe.com/?q=news">news</a> or <a href="http://www.altavibe.com/?q=homepage">homepage</a></div>`}
        <hr><div style="text-align:center;font-size:10px">© 1998 AltaVibe — 4 pages indexed and counting</div>`,

      "http://www.web-times.com/": () => `
        <div style="border-bottom:3px double #000;text-align:center;padding:8px">
          <span style="font-size:30px;font-family:'Times New Roman'">The Web Times</span><br>
          <span style="font-size:10px">All the news that fits in 640 kilobytes — Sunday, July 19, 1998</span>
        </div>
        <table cellpadding="8"><tr><td valign="top" style="vertical-align:top;padding:8px">
          <b style="font-size:16px">WINDOWS 98 ARRIVES; MILLIONS DISCOVER THE START BUTTON ANEW</b>
          <p style="font-size:12px">REDMOND — Computer enthusiasts around the globe celebrated this week as the
          successor to Windows 95 arrived, promising faster performance, USB support, and a browser
          integrated so deeply that nobody is entirely sure where the operating system ends.</p>
          <b style="font-size:14px">SCIENTISTS DECLARE Y2K BUG "PROBABLY FINE"</b>
          <p style="font-size:12px">Experts remain split on whether computers will survive the year 2000.
          "We have eighteen months," said one programmer, typing faster.</p>
          <b style="font-size:14px">LOCAL MAN DEFRAGMENTS HARD DRIVE, DESCRIBES EXPERIENCE AS "MESMERIZING"</b>
          <p style="font-size:12px">"You just watch the little blocks move," he reported. "It's better than television."</p>
        </td><td width="30%" valign="top" style="vertical-align:top;border-left:1px solid #999;padding:8px;width:30%">
          <b>WEATHER</b><p style="font-size:11px">Partly cloudy with a chance of dial-up disconnection.</p>
          <b>STOCKS</b><p style="font-size:11px">Beanie Babies: ▲ up 12%<br>Pogs: ▼ down 34%</p>
          <b>LINKS</b><p style="font-size:11px"><a href="http://www.welcome98.com/">Home</a><br><a href="http://games.web98.net/">Arcade</a></p>
        </td></tr></table>`,

      "http://games.web98.net/": () => `
        <div style="background:#000;color:#0f0;padding:12px;text-align:center;font-family:'Courier New'">
          <span style="font-size:24px">*** GAMES ARCADE ***</span><br>
          <span style="font-size:11px">100% FREE GAMES — NO DOWNLOAD REQUIRED (they are already on your computer)</span>
        </div>
        <table width="100%" cellpadding="12"><tr>
        <td style="text-align:center;padding:14px">
          <span style="font-size:40px">💣</span><br><b>Minesweeper</b>
          <p style="font-size:11px">The classic game of deductive reasoning and occasional explosions.</p>
          <a href="app://minesweeper"><b>▶ PLAY NOW</b></a>
        </td>
        <td style="text-align:center;padding:14px">
          <span style="font-size:40px">🃏</span><br><b>Solitaire</b>
          <p style="font-size:11px">52 cards. One you. Endless productivity loss.</p>
          <a href="app://solitaire"><b>▶ PLAY NOW</b></a>
        </td>
        <td style="text-align:center;padding:14px">
          <span style="font-size:40px">🎨</span><br><b>Paint</b>
          <p style="font-size:11px">Technically not a game, but have you tried drawing a cow?</p>
          <a href="app://paint"><b>▶ PLAY NOW</b></a>
        </td>
        </tr><tr>
        <td style="text-align:center;padding:14px">
          <span style="font-size:40px">🕹</span><br><b>Star Pilot Pinball</b>
          <p style="font-size:11px">Flippers. Bumpers. Space. The holy trinity.</p>
          <a href="app://pinball"><b>▶ PLAY NOW</b></a>
        </td>
        <td style="text-align:center;padding:14px">
          <span style="font-size:40px">⛷</span><br><b>Powder Hill</b>
          <p style="font-size:11px">Ski fast. Something lives past 2000m.</p>
          <a href="app://ski"><b>▶ PLAY NOW</b></a>
        </td>
        <td style="text-align:center;padding:14px">
          <span style="font-size:40px">🐛</span><br><b>Worm 98 & WallBall</b>
          <p style="font-size:11px">Two more ways to miss dinner.</p>
          <a href="app://worm"><b>▶ WORM</b></a> · <a href="app://wallball"><b>▶ WALLBALL</b></a>
        </td>
        </tr></table>
        <hr>
        <div style="padding:6px 20px">
          <b>🏆 LOCAL HALL OF FAME</b> <span style="font-size:10px">(scores live from this very computer)</span>
          <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:4px" cellpadding="4">
            ${(() => {
              const mine = Store.get("mineBest", {});
              const rows = [
                ["Star Pilot Pinball", (Store.get("pinballHigh", 0) || 0).toLocaleString() + " pts"],
                ["Powder Hill", (Store.get("skiBest", 0) || 0) + " m before the incident"],
                ["Worm 98", (Store.get("wormHigh", 0) || 0) + " pts"],
                ["WallBall", "level " + (Store.get("wallballBest", 0) || 0)],
                ["Minesweeper (Beginner)", mine.Beginner ? mine.Beginner.time + "s by " + mine.Beginner.name : "no record"],
                ["Minesweeper (Expert)", mine.Expert ? mine.Expert.time + "s by " + mine.Expert.name : "no record — CoolDave2000 claims 99s"]
              ];
              return rows.map(([g, s]) => `<tr><td style="border-bottom:1px dotted #999">${g}</td><td style="border-bottom:1px dotted #999;text-align:right"><b>${s}</b></td></tr>`).join("");
            })()}
          </table>
          <div style="font-size:10px;color:#666;margin-top:4px">Records notarized by absolutely no one. Beat them and refresh.</div>
        </div>
        <div style="text-align:center"><a href="http://www.welcome98.com/">← back to the start page</a></div>`,

      "http://members.geosities.com/~stardust/": () => {
        const visits = Store.get("stardustVisits", 1337) + 1;
        Store.set("stardustVisits", visits);
        const gb = guestbookEntries().map(e =>
          `<div style="border:1px dashed #808;margin:4px 0;padding:4px;font-size:11px;background:#fff"><b>${esc(e.name)}</b> wrote on ${esc(e.at)}:<br>${esc(e.msg)}</div>`).join("");
        return `
        <div style="background:#000 url() ;background:#000;color:#ff0;text-align:center;padding:10px">
          <span style="font-size:26px;font-family:'Comic Sans MS','Comic Sans',cursive">⭐ StArDuSt'S hOmEpAgE ⭐</span><br>
          <span class="marquee-wrap"><span class="marquee">Welcome to my homepage!! Sign my guestbook!! Best viewed in Internet Explorer 4.0!! No Netscape allowed!!</span></span>
        </div>
        <div style="background:#301934;color:#fff;padding:14px;font-family:'Comic Sans MS','Comic Sans',cursive">
          <p style="text-align:center">Hi!!! I'm <b>StArDuSt</b> and this is my corner of cyberspace!! 🌟</p>
          <p style="text-align:center;font-size:11px">This page is ALWAYS</p>
          <div style="text-align:center"><span style="display:inline-block;background:#ff0;color:#000;padding:4px 10px;font-weight:bold;animation:blink 1s steps(1) infinite">🚧 UNDER CONSTRUCTION 🚧</span></div>
          <p style="text-align:center">You are visitor number:</p>
          <div style="text-align:center"><span style="background:#000;color:#0f0;font-family:'Courier New';font-size:20px;padding:2px 8px;border:2px inset #888">${String(visits).padStart(6, "0")}</span></div>
          <hr>
          <b>~*~ My GuEsTbOoK ~*~</b>
          ${gb}
          <form data-guestbook="1" style="background:#221030;padding:8px;border:1px solid #808">
            <span style="font-size:11px">Your name:</span> <input name="name" style="font-size:11px"><br><br>
            <span style="font-size:11px">Your message:</span><br>
            <textarea name="msg" rows="3" style="width:90%;font-size:11px"></textarea><br>
            <button style="font-size:11px;margin-top:4px">✍ Sign Guestbook!!</button>
          </form>
          <p style="text-align:center;font-size:10px">
            <a href="http://members.geosities.com/~stardust/pixel/" style="color:#0ff">visit my cat Pixel's page</a> —
          <a href="http://members.geosities.com/~you/" style="color:#0ff">my neighbor ~you's page</a> —
            <a href="http://www.welcome98.com/" style="color:#0ff">home</a> —
            hosted FOR FREE on GeoSities
          </p>
        </div>`;
      },

      "http://www.y2kwatch.org/": () => `
        <div style="background:#000;color:#0f0;font-family:'Courier New';text-align:center;padding:14px">
          <span style="font-size:26px">*** Y2K WATCH ***</span><br>
          <span style="font-size:11px">counting down to the end of computing as we know it (maybe)</span>
        </div>
        <div style="text-align:center;padding:16px">
          <p style="font-size:13px">Time remaining until <b>January 1, 2000, 12:00 AM</b>:</p>
          <div id="y2kclock" style="display:inline-block;background:#000;color:#f00;font-family:'Courier New';font-size:24px;padding:8px 16px;border:3px inset #888">-- : -- : -- : --</div>
          <p style="font-size:12px;max-width:420px;margin:14px auto">Will planes fall from the sky? Will your toaster forget what year it is?
          Experts agree: it is <i>probably</i> fine. This site will keep counting either way,
          because the webmaster already bought the domain.</p>
          <table style="margin:0 auto;font-size:12px;border:1px solid #999" cellpadding="6">
            <tr><td><b>PREPAREDNESS CHECKLIST</b></td></tr>
            <tr><td>☑ Canned beans (48)</td></tr>
            <tr><td>☑ Flashlight batteries</td></tr>
            <tr><td>☑ Printed copy of the entire internet (in progress)</td></tr>
            <tr><td>☐ Remember where the beans are</td></tr>
          </table>
          <p><a href="http://www.welcome98.com/">home</a> — <a href="http://www.cool-corner.net/webring/">join our webring</a></p>
        </div>`,

      "http://www.cool-corner.net/webring/": () => `
        <div style="background:#301934;color:#fff;text-align:center;padding:12px">
          <span style="font-size:24px;font-family:'Comic Sans MS','Comic Sans',cursive">~ The Cool Corner WebRing ~</span><br>
          <span style="font-size:11px">27 sites of pure quality, hand-picked by a teenager</span>
        </div>
        <div style="padding:14px;text-align:center">
          <p style="font-size:12px">You are visiting ring member <b>#4 of 27</b>. Where next, brave surfer?</p>
          <table style="margin:0 auto" cellpadding="4"><tr>
            <td><a href="http://www.duckydance.com/">[&lt;&lt; PREV]</a></td>
            <td><a href="http://members.geosities.com/~stardust/">[RANDOM]</a></td>
            <td><a href="http://www.y2kwatch.org/">[NEXT &gt;&gt;]</a></td>
          </tr></table>
          <p style="font-size:11px">Ring members include: <a href="http://www.compumart.com/">CompuMart</a> ·
          <a href="http://www.weather98.com/">Weather 98</a> · <a href="http://midi.web98.net/">MIDI Jukebox</a> ·
          <a href="http://www.duckydance.com/">dancing duckies</a> · <a href="http://www.fangyuanlin.com/">fangyuanlin.com</a> · 22 more sites currently down for maintenance</p>
          <hr>
          <p style="font-size:12px"><b>Our proud member buttons (88x31, as the ancients decreed):</b></p>
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
            ${[["#000080", "#fff", "WIN98 NOW"], ["#008000", "#ff0", "GET FRAMES"], ["#800000", "#fff", "800x600 4EVER"],
               ["#000", "#0f0", "MIDI INSIDE"], ["#804000", "#fff", "SIGN MY GB"]].map(([bg, fg, t]) =>
              `<span style="display:inline-block;width:88px;height:31px;background:${bg};color:${fg};font-size:10px;font-weight:bold;text-align:center;line-height:31px;border:2px outset #aaa">${t}</span>`).join("")}
          </div>
          <p style="font-size:11px;margin-top:12px">Want to join? Your site must have: a guestbook, at least one
          animated GIF, and no more than 40% broken links. High standards keep us cool.</p>
          <p><a href="http://www.welcome98.com/">back to the start page</a></p>
        </div>`,

      "http://www.compumart.com/": () => {
        const cart = Store.get("cart", []);
        const total = cart.reduce((a, i) => a + PRODUCTS[i].price, 0);
        return `
        <div style="background:#000080;color:#fff;padding:12px;text-align:center">
          <span style="font-size:28px;font-family:'Times New Roman'">CompuMart™</span><br>
          <span style="font-size:11px">Everything for your computer, shipped in 6-8 weeks</span>
        </div>
        <table width="100%" cellpadding="8"><tr>
        ${PRODUCTS.map((p, i) => `
          ${i % 3 === 0 && i > 0 ? "</tr><tr>" : ""}
          <td style="border:1px solid #999;text-align:center;padding:10px;width:33%">
            <span style="font-size:34px">${p.icon}</span><br><b>${p.name}</b><br>
            <span style="font-size:11px">${p.blurb}</span><br>
            <span style="color:#008000;font-weight:bold">$${p.price.toLocaleString()}</span><br>
            <a href="act:cart-add:${i}"><b>[ Add to Cart ]</b></a>
          </td>`).join("")}
        </tr></table>
        <hr>
        <div style="padding:6px 16px">
          <b>🛒 Your cart (${cart.length} item${cart.length === 1 ? "" : "s"}):</b>
          ${cart.length ? cart.map((pi, ci) =>
            `<div style="font-size:12px">• ${PRODUCTS[pi].name} — $${PRODUCTS[pi].price.toLocaleString()} <a href="act:cart-del:${ci}">[remove]</a></div>`).join("")
            : `<span style="font-size:12px"> empty — treat yourself, it is 1998</span>`}
          ${cart.length ? `<div style="margin-top:6px"><b>Total: $${total.toLocaleString()}</b>
            &nbsp; <a href="act:checkout"><b>[ CHECK OUT ]</b></a> &nbsp; <a href="act:cart-clear">[empty cart]</a></div>` : ""}
          <div style="font-size:10px;color:#666;margin-top:8px">Orders placed so far from this computer: ${Store.get("orderCount", 0)}</div>
        </div>`;
      },

      "http://www.weather98.com/": (q) => {
        const city = q || Store.get("weatherCity", "Seattle");
        Store.set("weatherCity", city);
        const CITIES = ["Seattle", "Beijing", "Tokyo", "Paris", "Sydney", "Redmond"];
        const COND = [["☀", "Sunny"], ["⛅", "Partly cloudy"], ["☁", "Cloudy"], ["🌧", "Rain"], ["⛈", "Storms"], ["🌫", "Fog"]];
        const hash = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 9973; return h; };
        const day0 = Math.floor(Date.now() / 86400000);
        const fc = [];
        for (let d = 0; d < 5; d++) {
          const h = hash(city + (day0 + d));
          fc.push({ t: 8 + h % 22, c: COND[h % COND.length], name: d === 0 ? "Today" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][(new Date(Date.now() + d * 86400000)).getDay()] });
        }
        return `
        <div style="background:#1a4f8a;color:#fff;padding:12px;text-align:center">
          <span style="font-size:26px;font-family:'Times New Roman'">Weather 98</span><br>
          <span style="font-size:11px">forecasts of dubious accuracy, delivered instantly*</span>
        </div>
        <div style="text-align:center;padding:8px;font-size:12px">
          City: ${CITIES.map(c => c === city ? `<b>[${c}]</b>` : `<a href="http://www.weather98.com/?q=${c}">${c}</a>`).join(" · ")}
        </div>
        <div style="text-align:center;padding:6px">
          <span style="font-size:56px">${fc[0].c[0]}</span>
          <div style="font-size:30px"><b>${fc[0].t}°C</b></div>
          <div style="font-size:13px">${fc[0].c[1]} in ${city}</div>
        </div>
        <table style="margin:10px auto;border-collapse:collapse" cellpadding="8">
          <tr>${fc.map(f => `<th style="border:1px solid #999;font-size:11px">${f.name}</th>`).join("")}</tr>
          <tr>${fc.map(f => `<td style="border:1px solid #999;text-align:center;font-size:20px">${f.c[0]}<br><span style="font-size:12px">${f.t}°</span></td>`).join("")}</tr>
        </table>
        <div style="text-align:center;font-size:10px;color:#666">*instantly after a 45-second page load. — <a href="http://www.welcome98.com/">home</a></div>`;
      },

      "http://midi.web98.net/": () => {
        const st = W98.Music.state();
        return `
        <div style="background:#301934;color:#ffd700;padding:12px;text-align:center">
          <span style="font-size:26px;font-family:'Times New Roman'">♪ The MIDI Jukebox ♪</span><br>
          <span style="font-size:11px">lovingly sequenced, one note at a time</span>
        </div>
        <div style="padding:12px 24px">
          <p style="font-size:12px">Click a tune. Your speakers do the rest. The repertoire is public-domain
          classics plus originals by the webmaster (me).</p>
          <table style="width:100%;border-collapse:collapse" cellpadding="6">
            ${W98.Music.TRACKS.map((t, i) => `
            <tr style="${st.playing && st.index === i ? "background:#ffd70033" : ""}">
              <td style="border-bottom:1px solid #ccc;font-size:12px">
                ${st.playing && st.index === i ? "🎵" : String(i + 1).padStart(2, "0")}
                <b>${t.title}</b> — <span style="font-size:11px">${t.artist}</span></td>
              <td style="border-bottom:1px solid #ccc;text-align:right;font-size:12px">${W98.Music.fmt(t.duration)}
                &nbsp;<a href="act:play:${i}"><b>[▶ play]</b></a></td>
            </tr>`).join("")}
          </table>
          <p style="text-align:center">${st.playing ? `<a href="act:stopmusic"><b>[■ STOP THE MUSIC]</b></a>` : "<i>silence... for now</i>"}</p>
          <p style="text-align:center;font-size:11px"><a href="http://www.duckydance.com/">these tunes pair well with dancing duckies →</a></p>
        </div>`;
      },

      "http://www.duckydance.com/": () => {
        const st = W98.Music.state();
        const party = st.playing;
        const row = (n, delay) => Array.from({ length: n }, (_, i) =>
          `<span style="display:inline-block;font-size:34px;animation:duckbounce ${party ? 0.4 : 1.2}s ${(i * delay) % 0.8}s infinite alternate">🦆</span>`).join("");
        return `
        <div style="background:#000;color:#0f0;text-align:center;padding:10px;font-family:'Comic Sans MS','Comic Sans',cursive">
          <span style="font-size:26px">the dancing duckies page</span><br>
          <span style="font-size:11px">est. 1998 · 100% duck · as seen on 4 other websites</span>
        </div>
        <div style="background:#123;color:#fff;text-align:center;padding:18px 8px">
          <div>${row(9, 0.13)}</div>
          <div>${row(7, 0.19)}</div>
          <div>${row(9, 0.11)}</div>
          <p style="font-size:13px;margin-top:12px">
            ${party
              ? `THE PARTY IS <b>ON</b> — <a href="act:stopmusic" style="color:#0ff">[stop the party]</a>`
              : `the duckies are just warming up… <a href="act:play:3" style="color:#0ff"><b>[ START THE PARTY ]</b></a>`}
          </p>
          <p style="font-size:10px;color:#9cf">webring: <a href="http://www.cool-corner.net/webring/" style="color:#9cf">cool corner</a> · tunes: <a href="http://midi.web98.net/" style="color:#9cf">midi jukebox</a></p>
        </div>`;
      },

      "http://update.web98.net/": () => {
        const scanned = Store.get("wuScanned", 0);
        return `
        <div style="background:linear-gradient(#fff,#d8e4f0);border-bottom:2px solid #888;padding:12px 16px">
          <span style="font-size:24px;font-family:'Times New Roman'"><b>Windows</b> Update</span>
          <span style="font-size:11px"> — keep your computer exactly as it is</span>
        </div>
        <div style="padding:16px 26px">
          <h3 style="font-size:15px">Welcome to the update service for this copy of Windows 98.</h3>
          <p style="font-size:12px">Click below to scan your system for critical updates, security patches
          and exciting new versions of things that already work.</p>
          <p style="text-align:center;margin:18px 0">
            <a href="act:scanupdates" style="font-size:14px"><b>[ SCAN FOR UPDATES ]</b></a>
          </p>
          ${Store.get("wuInstalled", false) ? `
          <div style="border:1px solid #999;background:#eef6ee;padding:10px;font-size:12px">
            <b>Your system is up to date.</b> Build 4.10.1998 + SP-98.<br>
            All three updates are installed and doing whatever updates do.
          </div>` : scanned ? `
          <div style="border:1px solid #999;background:#fffbe8;padding:10px;font-size:12px">
            <b>Scan complete.</b> Updates found: <b>3</b><br>
            &nbsp;• Q241234 — Critical Update (fixes a thing)<br>
            &nbsp;• Q242437 — Recommended Update (adjusts a different thing)<br>
            &nbsp;• Q243199 — Vibes Update (general vibes)<br><br>
            <a href="act:wuinstall:go"><b>[ INSTALL ALL 3 UPDATES ]</b></a>
          </div>` : ""}
          ${false ? `
          <div>
            <b>Scan complete.</b> Updates found: <b>0</b><br><br>
            ✔ Windows 98 — perfectly preserved (version 4.10.1998, forever)<br>
            ✔ Internet Explorer — as fresh as the day it shipped<br>
            ✔ Y2K readiness — see <a href="http://www.y2kwatch.org/">y2kwatch.org</a><br><br>
            Your system is eternally up to date. Next scan recommended: whenever you feel nostalgic.
            <div style="font-size:10px;color:#666;margin-top:6px">Total scans from this computer: ${scanned}</div>
          </div>` : ""}
          <p style="font-size:11px;color:#666;margin-top:14px">Estimated download time for 0 updates over 56k: instantaneous. Enjoy.</p>
        </div>`;
      },

      "http://www.fangyuanlin.com/": () => {
        Store.set("linHits", Store.get("linHits", 1997) + 1);
        const fr = Store.get("linLang", "en") === "fr";
        const t = (en, f) => fr ? f : en;
        return `
        <div style="background:#0a0e0d;color:#c9d4cf;font-family:'Courier New',monospace;min-height:100%;padding:0 0 18px">
          <div style="padding:16px 20px 6px;display:flex;justify-content:space-between;align-items:baseline">
            <span style="color:#5fd9a8;font-size:11px">www.fangyuanlin.com</span>
            <span style="font-size:11px"><a href="act:linfr:t" style="color:${fr ? "#5fd9a8" : "#dcb46e"}">EN</a> | <a href="act:linfr:t" style="color:${fr ? "#dcb46e" : "#5fd9a8"}">FR</a></span>
          </div>
          <div style="text-align:center;padding:10px 16px 4px">
            <h2 style="font-family:'Times New Roman',serif;font-size:34px;color:#f0eee6;display:inline;font-weight:400">${t("Hello, bonjour.", "Bonjour, hi.")}</h2><br>
            <span style="font-size:12px;color:#8fa39a">${t("Fangyuan Lin — engineer. Ships local AI.", "Fangyuan Lin — ingénieur. Livre de l'IA locale.")}</span>
          </div>
          <div style="max-width:430px;margin:12px auto;border:1px solid #2a3a32;background:#060907;padding:8px 12px;font-size:11px;line-height:1.6">
            <span style="color:#5fd9a8">C:\\&gt;</span> whoami --long<br>
            name: Fangyuan Lin<br>
            edu: M.Eng ECE (uOttawa) &middot; B.Eng Telecom<br>
            focus: ${t("AI that runs on YOUR computer", "de l'IA qui tourne sur VOTRE ordinateur")}<br>
            papers: 1 (${t("chatbot privacy, with J. Jiang", "vie privée des chatbots, avec J. Jiang")})<br>
            location: Montréal ${t("(hence the greeting)", "(d'où la salutation)")}<span style="background:#5fd9a8;color:#000">&nbsp;</span>
          </div>
          <div style="max-width:430px;margin:0 auto;font-size:12px;line-height:1.65">
            <div style="color:#dcb46e;margin:12px 0 2px">01 &middot; ${t("FLAGSHIP", "PROJET PHARE")}</div>
            <b style="color:#f0eee6">Chaty</b> — ${t("a chat AI that lives entirely on your own machine. Two inference engines, an agentic Code mode, its own model. No server. No phone line hostage situation.", "une IA de chat qui vit entièrement sur votre machine. Deux moteurs d'inférence, un mode Code agentique, son propre modèle. Aucun serveur.")}
            <a href="http://www.chaty.ca/" style="color:#5fd9a8">chaty.ca</a>
            <div style="color:#dcb46e;margin:12px 0 2px">02 &middot; ${t("SELECTED WORK", "TRAVAUX CHOISIS")}</div>
            &bull; hushdoc — ${t("ask questions to documents that never leave the building", "interroger des documents qui ne quittent jamais l'édifice")}<br>
            &bull; auditable-agent — ${t("an honesty lab for AI agents", "un labo d'honnêteté pour agents IA")}<br>
            &bull; airline-complaint-classifier — ${t("research, then actually deployed", "recherche, puis réellement déployé")}
            <div style="color:#dcb46e;margin:12px 0 2px">03 &middot; ${t("WRITING", "ÉCRITS")}</div>
            <a href="http://www.fangyuanlin.com/blog/" style="color:#5fd9a8">${t("“The Rise of Local AI: Why the Future Runs on Your Device”", "« L'essor de l'IA locale : pourquoi l'avenir tournera sur votre appareil »")}</a>
            <span style="color:#8fa39a">${t("(a guest essay from the year 2026 — the time machine is the modem)", "(un essai invité de l'an 2026 — la machine à voyager est le modem)")}</span>
            <div style="color:#dcb46e;margin:12px 0 2px">04 &middot; CONTACT</div>
            <a href="app://mail" style="color:#5fd9a8">${t("email me", "écrivez-moi")}</a> &middot;
            <a href="http://www.cool-corner.net/webring/" style="color:#5fd9a8">webring</a>
          </div>
          <div style="text-align:center;margin-top:16px;font-size:11px;color:#8fa39a">
            ${t("visitor", "visiteur")} #<span style="color:#dcb46e">${Store.get("linHits", 1997)}</span> &middot;
            ${t("best viewed in any browser — yes, any. it is mostly text. that is the point.", "optimisé pour tous les navigateurs — oui, tous.")}<br>
            <span style="color:#3a4a42">${t("Attention Field background not included — requires the year 2026.", "Champ d'attention non inclus — nécessite l'an 2026.")}</span>
          </div>
        </div>`;
      },
      "http://www.fangyuanlin.com/blog/": () => `
        <div style="background:#0a0e0d;color:#c9d4cf;font-family:Georgia,serif;min-height:100%;padding:18px 26px">
          <div style="font-family:'Courier New',monospace;font-size:11px;color:#5fd9a8">
            <a href="http://www.fangyuanlin.com/" style="color:#5fd9a8">&larr; fangyuanlin.com</a> / blog
          </div>
          <div class="marquee-wrap" style="margin:8px 0"><span class="marquee" style="color:#dcb46e;font-family:'Courier New',monospace">** TIME-TRAVELING GUEST ESSAY — RECEIVED VIA MODEM FROM APRIL 2026 — CONTENTS MAY DESCRIBE THE FUTURE **</span></div>
          <h2 style="color:#f0eee6;font-size:20px;margin:8px 0 2px">The Rise of Local Open-Source AI:<br>Why the Future Runs on Your Device</h2>
          <div style="font-family:'Courier New',monospace;font-size:11px;color:#8fa39a;margin-bottom:10px">April 19, 2026 &middot; 9 min read &middot; by Fangyuan Lin</div>
          <div style="font-size:13px;line-height:1.7;max-width:440px">
            <p>The dominant story of AI is scale: giant models, giant bills, and products that route every
            keystroke through someone else's data center. But underneath it, a quieter shift is happening —
            small open models have gotten shockingly good, and the hardware on your desk has caught up.</p>
            <p>I think the next decade of AI, for most of what ordinary people do with it, will not be a
            browser tab pointed at a server in Virginia. It will run on the machine already in front of you.
            Five reasons:</p>
            <p><b style="color:#5fd9a8">1. Privacy is the problem, not a bullet point.</b> Our study on chatbot
            privacy found users know providers keep and train on their conversations — and disclose anyway.
            The only robust fix is a model where the prompt never leaves the machine.</p>
            <p><b style="color:#5fd9a8">2. Metered APIs are a silent tax.</b> Agents burn millions of tokens;
            the bills read like long-distance charges. (1998 readers: imagine the phone bill after a month of
            downloading, forever.)</p>
            <p><b style="color:#5fd9a8">3. The hardware already ships.</b> A $999 desktop runs a 14-billion-parameter
            model while drawing less power than a light bulb.</p>
            <p><b style="color:#5fd9a8">4. Offline is a feature.</b> No outage, no deprecation, no login. It works
            on an airplane. It works in a basement. It works, period.</p>
            <p><b style="color:#5fd9a8">5. Ownership matters.</b> A local model is yours the way this computer is
            yours. That is the whole point.</p>
            <blockquote style="border-left:3px solid #dcb46e;margin:12px 0;padding:4px 12px;color:#dcb46e">
              The prompt never leaves the machine. There is no retention policy because there is no provider.
            </blockquote>
            <p style="font-family:'Courier New',monospace;font-size:11px;color:#8fa39a">Readers of 1998: you already
            live this way. Every program on this desktop runs locally. Enjoy it — some of us will spend
            decades arguing our way back.</p>
          </div>
        </div>`,
      "http://www.chaty.ca/": () => `
        <div style="background:#0a0e0d;color:#c9d4cf;font-family:'Courier New',monospace;min-height:100%;text-align:center;padding:60px 20px">
          <span style="font-size:30px;color:#5fd9a8">chaty.ca</span><br><br>
          <span style="font-size:13px">This domain is reserved for <b style="color:#f0eee6">Chaty</b> — chat AI that runs
          entirely on your own computer.</span><br><br>
          <span style="font-size:12px;color:#8fa39a">Estimated launch: approximately 27 years.<br>
          Please hold. Your position in the queue is: <span style="color:#dcb46e">1998</span>.</span><br><br>
          <span style="font-size:11px;color:#3a4a42">[||||||||..........................] 8%</span><br><br>
          <a href="http://www.fangyuanlin.com/" style="color:#5fd9a8">meanwhile, meet the author</a>
        </div>`,
      "http://members.geosities.com/~you/": () => {
        if (!W98.getHomepage || !W98.getHomepage()) {
          return `
          <div style="text-align:center;padding:40px 20px;font-family:'Times New Roman',serif">
            <h2>~you — page not found</h2>
            <p>This GeoSities address is reserved for <b>you</b>, but nothing has been published yet.</p>
            <p style="font-size:12px">Build your page with <a href="app://pagecrafter">PageCrafter Express</a> and hit Publish!</p>
          </div>`;
        }
        Store.set("homepageHits", Store.get("homepageHits", 0) + 1);
        return W98.renderHomepageHTML();
      },
      "http://members.geosities.com/~stardust/pixel/": () => {
        const treats = Store.get("pixelTreats", 0);
        return `
        <div style="background:#f4a840;text-align:center;padding:12px;font-family:'Comic Sans MS','Comic Sans',cursive">
          <span style="font-size:26px;color:#fff;text-shadow:1px 1px #a06010">~*~ PiXeL's PaGe ~*~</span><br>
          <span style="font-size:11px;color:#5a3a10">the cutest cat on the whole internet (this is a fact)</span>
        </div>
        <div style="background:#fff8ec;padding:14px;text-align:center">
          <div style="font-size:90px;line-height:1;cursor:pointer" onclick="void 0" id="pixel-cat">🐱</div>
          <p style="font-size:13px;font-family:'Comic Sans MS','Comic Sans',cursive">Hi! I'm Pixel! I am a orange cat and I live with StarDust!</p>
          <p style="font-size:12px">
            <a href="act:pet">🖐 pet Pixel</a> &nbsp; · &nbsp;
            <a href="act:treat">🐟 give a treat</a> &nbsp; · &nbsp;
            <a href="act:pounce">🎯 make him pounce</a>
          </p>
          <div id="pixel-status" style="font-size:12px;min-height:20px;color:#a06010"></div>
          <div style="font-size:11px;margin-top:6px">Treats given by visitors: <b>${treats}</b></div>
          <hr style="border-color:#f4a840">
          <b style="font-family:'Comic Sans MS','Comic Sans',cursive">~ Pixel's Favorite Things ~</b>
          <ul style="text-align:left;display:inline-block;font-size:12px">
            <li>sitting on the keyboard during important emails</li>
            <li>the little red dot (still hunting it, 1998-present)</li>
            <li>knocking floppy disks off the desk</li>
            <li>the warm top of the CRT monitor</li>
          </ul>
          <p style="font-size:11px"><a href="http://members.geosities.com/~stardust/">← back to StarDust's page</a></p>
        </div>`;
      },

      "http://www.web98.net/about/": () => `
        <div style="padding:16px">
          <h2>About this browser</h2>
          <p>This copy of Internet Explorer browses a tiny, lovingly preserved museum of the 1998
          World Wide Web that lives entirely inside this application. No actual network connections
          are made — which also makes this the fastest version of the 1998 internet ever shipped.</p>
          <p>Things to try:</p>
          <ul>
            <li>Search for something on <a href="http://www.altavibe.com/">AltaVibe</a></li>
            <li>Sign the guestbook at <a href="http://members.geosities.com/~stardust/">StarDust's homepage</a></li>
            <li>Launch a game from the <a href="http://games.web98.net/">Arcade</a></li>
            <li>Type a random URL and enjoy a very authentic error page</li>
          </ul>
        </div>`
    };

    function searchResults(q) {
      const idx = [
        { url: "http://www.welcome98.com/", title: "The Windows 98 Start Page", desc: "Your home base for exploring the World Wide Web.", kw: "home start welcome windows portal" },
        { url: "http://www.web-times.com/", title: "The Web Times — News", desc: "All the news that fits in 640 kilobytes.", kw: "news headlines y2k times paper" },
        { url: "http://games.web98.net/", title: "Games Arcade", desc: "100% free games, no download required.", kw: "games arcade minesweeper solitaire play fun" },
        { url: "http://members.geosities.com/~stardust/", title: "StArDuSt'S hOmEpAgE", desc: "Sign my guestbook!! Under construction!!", kw: "homepage personal guestbook stardust cool geocities" },
        { url: "http://www.web98.net/about/", title: "About this browser", desc: "What is this tiny internet?", kw: "about help browser info" },
        { url: "http://www.y2kwatch.org/", title: "Y2K WATCH — countdown to 2000", desc: "Beans: acquired. Toasters: uncertain.", kw: "y2k 2000 millennium bug countdown apocalypse beans" },
        { url: "http://www.cool-corner.net/webring/", title: "The Cool Corner WebRing", desc: "27 sites of pure quality.", kw: "webring ring links buttons cool corner surf" },
        { url: "http://www.compumart.com/", title: "CompuMart™ — computer superstore", desc: "Towers, modems, trackballs. 6-8 weeks delivery.", kw: "shop store buy computer hardware modem cd-r trackball shopping cart" },
        { url: "http://www.weather98.com/", title: "Weather 98", desc: "Forecasts of dubious accuracy, delivered instantly*.", kw: "weather forecast rain sun temperature cities" },
        { url: "http://midi.web98.net/", title: "The MIDI Jukebox", desc: "Lovingly sequenced tunes for your speakers.", kw: "midi music songs tunes jukebox chiptune listen play" },
        { url: "http://www.duckydance.com/", title: "the dancing duckies page", desc: "100% duck. As seen on 4 other websites.", kw: "dancing duckies ducks dance party fun animation" },
        { url: "http://members.geosities.com/~stardust/pixel/", title: "PiXeL's PaGe", desc: "The cutest cat on the whole internet.", kw: "cat pixel pet kitten cute animal stardust" },
        { url: "http://members.geosities.com/~you/", title: "~you's homepage", desc: "A GeoSities page made with PageCrafter Express.", kw: "you my homepage personal pagecrafter geosities" },
        { url: "http://www.fangyuanlin.com/", title: "Fangyuan Lin — Hello, bonjour.", desc: "Engineer. Ships local AI. M.Eng ECE, uOttawa. Flagship: Chaty.", kw: "fangyuan lin portfolio engineer ai chaty local llm montreal resume personal homepage bilingual" },
        { url: "http://www.fangyuanlin.com/blog/", title: "The Rise of Local Open-Source AI", desc: "Guest essay from 2026: why the future runs on your device.", kw: "blog essay local llm ai privacy open source future writing fangyuan" },
        { url: "http://www.chaty.ca/", title: "chaty.ca — coming eventually", desc: "Chat AI that runs on your own computer. Launching in ~27 years.", kw: "chaty chat ai local assistant offline" }
      ];
      const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      const hits = idx.filter(p => terms.some(t => (p.title + " " + p.desc + " " + p.kw).toLowerCase().includes(t)));
      if (!hits.length) return `<div style="padding:10px 30px"><b>No pages matched your search.</b><p style="font-size:11px">The 1998 internet was smaller than you remember. Try "games", "news" or "homepage".</p></div>`;
      return `<div style="padding:10px 30px"><b>${hits.length} result(s) found:</b>` + hits.map(p => `
        <p><a href="${p.url}">${esc(p.title)}</a><br>
        <span style="font-size:11px">${esc(p.desc)}</span><br>
        <span style="font-size:10px;color:#008000">${p.url}</span></p>`).join("") + "</div>";
    }

    function errorPage(url) {
      return `
      <div style="padding:20px 40px;font-family:Arial,sans-serif">
        <h2 style="font-size:16px;font-family:Arial">The page cannot be displayed</h2>
        <p style="font-size:12px">The page you are looking for is currently unavailable. The Web site
        might be experiencing technical difficulties, or you may need to adjust your browser settings.</p>
        <hr>
        <p style="font-size:12px">Please try the following:</p>
        <ul style="font-size:12px">
          <li>Click the <a href="${current || HOME}">Refresh</a> button, or try again later.</li>
          <li>If you typed the page address in the Address bar, make sure that it is spelled correctly.</li>
          <li>This computer's copy of the internet contains exactly five Web sites, and
              <b>${esc(url)}</b> is not one of them. It was a different time.</li>
          <li>Return to the <a href="${HOME}">start page</a>.</li>
        </ul>
        <p style="font-size:11px;color:#808080">Cannot find server or DNS Error<br>Internet Explorer</p>
      </div>`;
    }

    /* ---------- browser chrome ---------- */
    const win = WM.create({
      title: "Internet Explorer", icon: "ie",
      width: 700, height: 500, minWidth: 420, minHeight: 300,
      statusbar: [{ text: "Done" }, { text: "Internet zone", width: 120 }],
      menus: [
        { label: "File", items: () => [
          { label: "New Window", accel: "Ctrl+N", click: () => W98.launch("ie") },
          "-",
          { label: "Close", click: () => win.close() }
        ]},
        { label: "View", items: () => [
          { label: "Stop", accel: "Esc", click: stop },
          { label: "Refresh", accel: "F5", click: () => navigate(current, true) },
          "-",
          { label: "Source", click: () => {
            const p = FS.uniqueName("C:/Windows", "source", ".txt");
            FS.writeFile("C:/Windows/" + p, pageEl.innerHTML);
            W98.launch("notepad", "C:/Windows/" + p);
          }},
          "-",
          { label: "Text Size", sub: [
            { label: "Largest", click: () => pageEl.style.fontSize = "18px" },
            { label: "Medium", click: () => pageEl.style.fontSize = "" },
            { label: "Smallest", click: () => pageEl.style.fontSize = "11px" }
          ]}
        ]},
        { label: "Go", items: () => [
          { label: "Back", disabled: !history.length, click: goBack },
          { label: "Forward", disabled: !future.length, click: goFwd },
          "-",
          { label: "Home Page", click: () => navigate(HOME) },
          { label: "History", sub: (Store.get("ieHistory", []).length
            ? Store.get("ieHistory", []).map(u => ({ label: u.replace(/^https?:\/\//, "").slice(0, 42), click: () => navigate(u) }))
            : [{ label: "(No pages visited yet)", disabled: true }]) },
          { label: "Search the Web", click: () => navigate("http://www.altavibe.com/") }
        ]},
        { label: "Favorites", items: () => {
          let favs = Store.get("favorites", null);
    if (!favs) {
      favs = [
        { title: "Fangyuan Lin — Hello, bonjour.", url: "http://www.fangyuanlin.com/" },
        { title: "AltaVibe Search", url: "http://www.altavibe.com/" },
        { title: "Games Arcade", url: "http://games.web98.net/" }
      ];
      Store.set("favorites", favs);
    }
          return [
            { label: "Add to Favorites...", click: addFavorite },
            "-",
            ...(favs.length ? favs.map(f => ({ label: f.title, icon: "ie", click: () => navigate(f.url) })) : [{ label: "(Empty)", disabled: true }])
          ];
        }},
        { label: "Help", items: () => [
          { label: "About Internet Explorer", click: () => Dialogs.about("Internet Explorer", "ie", ["Version 4.0 (nostalgia edition)", "Browses a preserved copy of the 1998 web."]) }
        ]}
      ]
    });

    const tbar = el("div", { class: "toolbar" });
    const mkTool = (label, icon, fn) => {
      const b = el("button", { class: "tool-btn", dataset: { tip: label } });
      b.append(Icons.img(icon, 20), el("span", { text: label, style: "font-size:10px" }));
      b.addEventListener("click", fn);
      tbar.append(b);
      return b;
    };
    const backBtn = mkTool("Back", "tb_back", goBack);
    const fwdBtn = mkTool("Forward", "tb_fwd", goFwd);
    const stopBtn = mkTool("Stop", "tb_del", stop);
    mkTool("Refresh", "tb_views", () => navigate(current, true));
    mkTool("Home", "help", () => navigate(HOME));
    tbar.append(el("div", { class: "tsep" }));
    mkTool("Search", "find", () => navigate("http://www.altavibe.com/"));
    mkTool("Favorites", "favorites", addFavorite);
    const throbber = el("div", { class: "ie-throbber" });
    const throbberImg = Icons.img("ie", 20);
    throbber.append(throbberImg);
    tbar.append(throbber);

    const addrInput = el("input", { type: "text" });
    const addr = el("div", { class: "addrbar" },
      el("span", { text: "Address" }),
      el("div", { class: "field" }, Icons.img("ie", 16), addrInput));
    addrInput.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        let v = addrInput.value.trim();
        if (!/^https?:\/\//.test(v) && !/^app:/.test(v)) v = "http://" + v;
        /* only give host-only URLs their trailing slash; leave real paths untouched
           so live sites like en.wikipedia.org/wiki/Foo aren't 404'd */
        if (/^https?:\/\/[^/]+$/.test(v)) v += "/";
        navigate(v);
      }
    });

    const pageEl = el("div", { class: "ie-page" });
    win.body.append(tbar, addr, pageEl);

    /* marquee + blink CSS (scoped) */
    const style = el("style", { text: `
      .marquee-wrap { display:block; overflow:hidden; }
      .marquee { display:inline-block; white-space:nowrap; animation: marq 12s linear infinite; font-size:12px; }
      @keyframes marq { from { transform: translateX(100%);} to { transform: translateX(-100%);} }
      @keyframes blink { 50% { opacity: 0; } }
      @keyframes duckbounce { from { transform: translateY(0) } to { transform: translateY(-14px) } }
    ` });
    pageEl.append(style);

    /* stylesheet for 98-ified live pages */
    const liveStyle = el("style", { text: `
      .live98 { background:#fff; color:#000; font-family:'Times New Roman',Georgia,serif; }
      .live98 .live-bar { background:#000080; color:#fff; font-family:Tahoma,sans-serif; font-size:11px; padding:3px 8px; }
      .live98 .live-title { font-size:22px; font-weight:700; padding:10px 20px 2px; border-bottom:2px solid #000080; margin-bottom:8px; }
      .live98 .live-body { padding:0 22px 8px; font-size:14px; line-height:1.55; max-width:660px; }
      .live98 .live-body h1 { font-size:22px; margin:14px 0 4px; }
      .live98 .live-body h2 { font-size:18px; margin:12px 0 4px; }
      .live98 .live-body h3 { font-size:15px; margin:10px 0 3px; }
      .live98 .live-body p { margin:0 0 9px; }
      .live98 .live-body a { color:#0000ee; text-decoration:underline; }
      .live98 .live-body a:visited { color:#551a8b; }
      .live98 .live-body ul, .live98 .live-body ol { margin:4px 0 9px 26px; }
      .live98 .live-body li { margin:2px 0; }
      .live98 .live-body blockquote { border-left:3px solid #808080; margin:8px 0; padding:2px 12px; color:#333; }
      .live98 .live-body pre { background:#e8e8e8; border:1px solid #a0a0a0; padding:6px; font-family:'Courier New',monospace; font-size:12px; overflow-x:auto; white-space:pre-wrap; }
      .live98 .live-body table { border-collapse:collapse; margin:8px 0; }
      .live98 .live-body th { background:#c0c0c0; }
      .live98 .live-body .imgwrap { margin:8px 0; }
      .live98 .live-body img { max-width:100%; border:2px solid #808080; image-rendering:auto; }
      .live98 .live-foot { padding:6px 22px 18px; font-size:11px; color:#606060; font-family:Tahoma,sans-serif; }
    ` });

    let loadTimer = null, spinTimer = null, spinA = 0, y2kTimer = null;
    function startThrobber() {
      clearInterval(spinTimer);
      spinTimer = setInterval(() => {
        spinA += 30;
        throbberImg.style.transform = `rotate(${spinA}deg)`;
      }, 60);
    }
    function stopThrobber() {
      clearInterval(spinTimer);
      throbberImg.style.transform = "";
      stopBtn.disabled = true;
    }
    function stop() {
      clearTimeout(loadTimer);
      stopThrobber();
      win.setStatus(0, "Stopped");
    }

    function catMeow(happy) {
      const bus = Sound.audio();
      if (!bus) return;
      const o = bus.ctx.createOscillator(), g = bus.ctx.createGain();
      o.type = "sawtooth";
      const f0 = happy ? 620 : 480;
      o.frequency.setValueAtTime(f0, bus.ctx.currentTime);
      o.frequency.linearRampToValueAtTime(f0 * 1.3, bus.ctx.currentTime + 0.12);
      o.frequency.linearRampToValueAtTime(f0 * 0.8, bus.ctx.currentTime + 0.34);
      g.gain.setValueAtTime(0.0001, bus.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.06, bus.ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, bus.ctx.currentTime + 0.4);
      const flt = bus.ctx.createBiquadFilter(); flt.type = "bandpass"; flt.frequency.value = 900;
      o.connect(flt); flt.connect(g); g.connect(bus.master);
      o.start(); o.stop(bus.ctx.currentTime + 0.42);
    }
    function catAction(kind) {
      const cat = $("#pixel-cat"), status = $("#pixel-status");
      if (!cat || !status) return;
      if (kind === "pet") {
        catMeow(true);
        status.textContent = "*purrrrr* Pixel is happy! 😊";
        cat.style.transition = "transform .15s";
        cat.style.transform = "scale(1.15) rotate(-6deg)";
        setTimeout(() => cat.style.transform = "", 300);
      } else if (kind === "treat") {
        catMeow(true);
        Store.set("pixelTreats", Store.get("pixelTreats", 0) + 1);
        cat.textContent = "😻";
        status.textContent = "Pixel devoured the treat instantly. Treats given: " + Store.get("pixelTreats");
        setTimeout(() => cat.textContent = "🐱", 900);
      } else if (kind === "pounce") {
        catMeow(false);
        status.textContent = "Pixel is stalking the little red dot...";
        let n = 0;
        const iv = setInterval(() => {
          cat.style.transform = "translate(" + ((Math.random() * 60 - 30) | 0) + "px," + ((Math.random() * 20 - 20) | 0) + "px)";
          if (++n > 6) { clearInterval(iv); cat.style.transform = ""; cat.textContent = "🐱"; status.textContent = "The red dot got away. Again. Pixel remains undefeated in his own mind."; }
        }, 120);
        cat.textContent = "🙀";
      }
    }

    function siteFor(base) {
      if (SITES[base]) return base;
      // forgive a missing (or extra) www. so typed URLs resolve
      const alt = /\/\/www\./.test(base) ? base.replace("//www.", "//") : base.replace("//", "//www.");
      if (SITES[alt]) return alt;
      return null;
    }
    function renderPage(url) {
      // host-only URLs (http://foo.com) get their canonical trailing slash
      url = url.replace(/^(https?:\/\/[^/]+)$/, "$1/");
      const [base0, qs] = url.split("?");
      const base = siteFor(base0) || base0;
      const q = qs ? decodeURIComponent((qs.match(/q=([^&]*)/) || [])[1] || "").replace(/\+/g, " ") : null;
      /* not a built-in site → fetch the real web and drag it back to 1998 */
      if (!SITES[base] && /^https?:\/\//.test(url) && W98.WebFetch) {
        renderLive(url);
        return;
      }
      const html = SITES[base] ? SITES[base](q) : errorPage(url);
      pageEl.innerHTML = "";
      pageEl.append(style);
      const wp = el("div", { class: "webpage", html });
      pageEl.append(wp);
      /* wire links */
      $$("a", wp).forEach(a => {
        const href = a.getAttribute("href");
        if (!href) return;
        a.addEventListener("click", (e) => {
          e.preventDefault();
          Sound.play("click");
          if (href.startsWith("app://")) { W98.launch(href.slice(6)); return; }
          if (href.startsWith("act:")) { pageAction(href); return; }
          navigate(href);
        });
        a.addEventListener("mouseenter", () => win.setStatus(0, href));
        a.addEventListener("mouseleave", () => win.setStatus(0, "Done"));
      });
      /* wire forms */
      $$("form", wp).forEach(f => {
        f.addEventListener("submit", (e) => {
          e.preventDefault();
          if (f.dataset.search) {
            const q2 = f.elements.q.value.trim();
            navigate("http://www.altavibe.com/?q=" + encodeURIComponent(q2));
          } else if (f.dataset.guestbook) {
            const name = f.elements.name.value.trim() || "Anonymous Netizen";
            const msg = f.elements.msg.value.trim();
            if (!msg) return;
            const gb = guestbookEntries();
            gb.push({ name, msg, at: new Date().toLocaleDateString() });
            Store.set("guestbook", gb);
            navigate(current, true);
          }
        });
      });
      /* live Y2K countdown (as seen from a fictional 1998) */
      clearInterval(y2kTimer);
      if (base === "http://www.y2kwatch.org/") {
        const clock = $("#y2kclock", wp);
        const tickY2k = () => {
          if (!clock.isConnected) { clearInterval(y2kTimer); return; }
          const now = new Date();
          const fake = new Date(now);
          fake.setFullYear(1998);
          let ms = new Date("2000-01-01T00:00:00") - fake;
          if (ms < 0) ms = 0;
          const d = Math.floor(ms / 86400000); ms -= d * 86400000;
          const h = Math.floor(ms / 3600000); ms -= h * 3600000;
          const m = Math.floor(ms / 60000); ms -= m * 60000;
          const s = Math.floor(ms / 1000);
          clock.textContent = d + "d : " + pad2(h) + "h : " + pad2(m) + "m : " + pad2(s) + "s";
        };
        tickY2k();
        y2kTimer = setInterval(tickY2k, 500);
      }
      const title = base === HOME ? "The Windows 98 Start Page" :
        (SITES[base] ? ($("h2", wp) || $("b", wp) || { textContent: url }).textContent : "The page cannot be displayed");
      win.setTitle(title.slice(0, 60) + " - Internet Explorer");
      win.setStatus(0, "Done");
      addrInput.value = url;
      pageEl.scrollTop = 0;
    }

    function liveError(url, reason) {
      pageEl.innerHTML = "";
      pageEl.append(style);
      const wp = el("div", { class: "webpage", html: `
        <div style="padding:22px 40px;font-family:'Times New Roman',serif">
          <h2 style="font-size:17px">The page cannot be displayed</h2>
          <p style="font-size:13px">Internet Explorer tried to fetch <b>${esc(url)}</b> and drag it back to
          1998, but something went wrong along the way.</p>
          <hr>
          <p style="font-size:12px"><b>Reason:</b> ${esc(reason)}</p>
          <p style="font-size:12px">Please try the following:</p>
          <ul style="font-size:12px">
            <li>Click <a href="${esc(url)}">Refresh</a>, or check the address for typos.</li>
            <li>Some modern sites refuse to be fetched, or are built entirely from JavaScript
                that this browser was born too early to run.</li>
            <li>Return to the <a href="${HOME}">start page</a>, where the internet still makes sense.</li>
          </ul>
          <p style="font-size:11px;color:#808080">Cannot find server or DNS Error<br>Internet Explorer</p>
        </div>` });
      wireLinks(wp);
      pageEl.append(wp);
      win.setTitle(W98.tr("The page cannot be displayed") + " - Internet Explorer");
      win.setStatus(0, "Done");
      addrInput.value = url;
    }

    function wireLinks(wp) {
      $$("a", wp).forEach(a => {
        const href = a.getAttribute("href");
        if (!href) return;
        a.addEventListener("click", (e) => {
          e.preventDefault();
          Sound.play("click");
          if (href.startsWith("app://")) { W98.launch(href.slice(6)); return; }
          if (href.startsWith("act:")) { pageAction(href); return; }
          navigate(href);
        });
        a.addEventListener("mouseenter", () => win.setStatus(0, href));
        a.addEventListener("mouseleave", () => win.setStatus(0, "Done"));
      });
    }

    let liveToken = 0;
    function renderLive(url) {
      const my = ++liveToken;
      win.setStatus(0, W98.tr("Contacting ") + url.replace(/^https?:\/\//, "").split("/")[0] + "...");
      W98.WebFetch.fetchUrl(url).then((res) => {
        if (win.closed || my !== liveToken) return;   /* superseded by a newer navigation */
        stopThrobber();
        if (!res.ok) {
          const map = { timeout: W98.tr("The connection timed out (the 1998 modem waited as long as it could)."),
                        "not html": W98.tr("That address is not a Web page — it is some other kind of file.") };
          liveError(url, map[res.error] || res.error || W98.tr("Cannot find server."));
          return;
        }
        const ct = (res.contentType || "").toLowerCase();
        if (ct && !ct.includes("html") && !ct.includes("text/plain") && !ct.includes("xml")) {
          liveError(url, W98.tr("This is a ") + ct.split(";")[0] + W98.tr(" file, not a Web page. IE 98 shows words, not everything."));
          return;
        }
        const finalUrl = res.finalUrl || url;
        const retro = W98.WebFetch.retro(res.body, finalUrl);
        pageEl.innerHTML = "";
        pageEl.append(style, liveStyle);
        const host = finalUrl.replace(/^https?:\/\//, "").split("/")[0];
        const wp = el("div", { class: "webpage live98" });
        wp.innerHTML = `
          <div class="live-bar">🌐 ${esc(host)} — <i>${W98.tr("rendered by Internet Explorer 98 (Retro Mode)")}</i></div>
          <div class="live-title">${esc(retro.title).slice(0, 120)}</div>
          <div class="live-body">${retro.body}</div>
          <div class="live-foot"><hr>${W98.tr("Original address: ")}${esc(finalUrl)}<br>
            ${W98.tr("Scripts, styles and animation were left in the future where they belong.")}</div>`;
        wireLinks(wp);
        /* broken remote images collapse quietly */
        $$("img", wp).forEach(im => { im.addEventListener("error", () => { const w2 = im.closest(".imgwrap"); if (w2) w2.remove(); }); });
        pageEl.append(wp);
        win.setTitle((retro.title || host).slice(0, 60) + " - Internet Explorer");
        win.setStatus(0, "Done");
        addrInput.value = url;
        pageEl.scrollTop = 0;
      });
    }

    function renderOffline(url) {
      current = url;
      addrInput.value = url;
      stopThrobber();
      win.setStatus(0, W98.tr("Working Offline"));
      pageEl.innerHTML = "";
      pageEl.append(style);
      const wp = el("div", { class: "webpage", html: `
        <div style="padding:36px 40px;font-family:'Times New Roman',serif">
          <h2 style="font-size:18px">The page cannot be displayed</h2>
          <p style="font-size:13px">You are currently working offline. The page you requested lives on
          the Internet, and the Internet lives at the other end of a telephone call.</p>
          <hr>
          <p style="font-size:12px"><a href="act:dialnow:go"><b>Connect to the Internet</b></a> —
          the modem is warmed up and ready to sing.</p>
          <p style="font-size:11px;color:#666">Or open Dial-Up Networking from the Start menu, the way
          your father insisted was more proper.</p>
        </div>` });
      $$("a", wp).forEach(a => {
        const href = a.getAttribute("href") || "";
        a.addEventListener("click", (e) => { e.preventDefault(); if (href.startsWith("act:")) pageAction(href); });
      });
      pageEl.append(wp);
      win.setTitle(W98.tr("The page cannot be displayed") + " - Internet Explorer");
    }

    function navigate(url, isReload) {
      if (!url) url = HOME;
      if (W98.Net && !W98.Net.connected) {
        const target = url;
        W98.Net.require(() => { if (!win.closed) navigate(target, isReload); },
                        () => { if (!win.closed) renderOffline(target); });
        return;
      }
      clearTimeout(loadTimer);
      startThrobber();
      stopBtn.disabled = false;
      win.setStatus(0, "Opening page " + url + "...");
      if (!isReload && current && url !== current) { history.push(current); future.length = 0; }
      current = url;
      if (!isReload) {
        let hist = Store.get("ieHistory", []);
        hist = hist.filter(h => h !== url);
        hist.unshift(url);
        if (hist.length > 15) hist.length = 15;
        Store.set("ieHistory", hist);
      }
      backBtn.disabled = !history.length;
      fwdBtn.disabled = !future.length;
      loadTimer = setTimeout(() => {
        renderPage(url);
        stopThrobber();
        backBtn.disabled = !history.length;
        fwdBtn.disabled = !future.length;
      }, 250 + Math.random() * 500); // authentic dial-up suspense (abridged)
    }
    function goBack() {
      if (!history.length) return;
      future.push(current);
      current = history.pop();
      navigate(current, true);
    }
    function goFwd() {
      if (!future.length) return;
      history.push(current);
      current = future.pop();
      navigate(current, true);
    }
    function addFavorite() {
      const favs = Store.get("favorites", []);
      if (favs.some(f => f.url === current)) {
        WM.msgbox({ title: "Favorites", icon: "info", text: "This page is already in your Favorites." });
        return;
      }
      favs.push({ url: current, title: win.title.replace(" - Internet Explorer", "") });
      Store.set("favorites", favs);
      WM.msgbox({ title: "Favorites", icon: "info", text: "Added to Favorites." });
    }

    win.el.addEventListener("keydown", (e) => {
      if (e.key === "F5") { e.preventDefault(); navigate(current, true); }
      if (e.key === "Escape") stop();
    });

    navigate(arg === "search" ? "http://www.altavibe.com/"
      : (typeof arg === "string" && arg.startsWith("http") ? arg : HOME));
    return win;
  }
};

/* encarta.js — Encyclopedia 98: the multimedia reference you browsed instead of
   doing homework. Original articles, gently unreliable. */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.encarta = {
  name: "Encyclopedia 98", icon: "encarta", single: true,
  launch() {
    const ART = {
      "The Modem": { cat: "Technology", body:
        "A modem (from MODulator-DEModulator) converts digital data into the sound of a very small robot in distress, and back again. The 56k modem, standard in 1998, could transfer an entire photograph in under two minutes, provided nobody picked up the telephone.\n\nThe distinctive handshake tone — a rising chorus of static and chirps — is technically a negotiation between two modems agreeing on how fast they will disappoint you. Enthusiasts can identify connection speeds by ear.\n\nSee also: The Internet, Busy Signal, 'Get Off The Phone'." },
      "Windows 98": { cat: "Technology", body:
        "Windows 98 is an operating system released on June 25, 1998, notable for introducing the Quick Launch bar, USB support, and the Windows Update service. It shipped on a single CD-ROM and asked for it back approximately monthly.\n\nIts most enduring contributions to human culture include the startup sound, the Space Cadet pinball table, and the shared understanding that the correct response to any problem is to restart.\n\nSystem requirements: 16 MB of RAM, 200 MB of disk, and patience." },
      "The Y2K Bug": { cat: "Science", body:
        "The Year 2000 Problem, or Y2K, arose because early programmers stored years as two digits to save memory, meaning computers might read the year 2000 as 1900. Predictions for January 1, 2000 ranged from 'minor accounting errors' to 'planes falling from the sky.'\n\nBillions were spent on remediation. On the day itself, almost nothing happened, which was declared either a triumph of engineering or proof it was never a problem, depending on how many cans of beans you had purchased.\n\nSee also: Beans, Countdown Clocks." },
      "The Dinosaurs": { cat: "Nature", body:
        "Dinosaurs were a group of reptiles that dominated Earth for roughly 165 million years, which is 164,999,992 years longer than the World Wide Web has managed so far.\n\nThe most famous, Tyrannosaurus rex, had tiny arms and a large attitude. Velociraptors were, contrary to popular 1993 film, roughly the size of a turkey — a fact that ruins the film and every child's day.\n\nThey were wiped out 66 million years ago by an asteroid, the original hardware failure.\n\nClick the speaker to hear a dinosaur roar (reconstructed, imaginative)." , sound: "roar" },
      "Outer Space": { cat: "Science", body:
        "Outer space is the mostly empty region beyond Earth's atmosphere. It is very large, very cold, and completely silent, which makes it the opposite of a computer lab.\n\nOur solar system has (in 1998) nine planets, a number that felt permanent at the time. The Sun contains 99.8% of the system's mass and 100% of its opinions about staying up late.\n\nHumans first walked on the Moon in 1969 using computers less powerful than the one currently running this encyclopedia.\n\nClick the speaker for the sound of space (dramatized; space is silent).", sound: "space" },
      "The Beanie Baby": { cat: "Culture", body:
        "The Beanie Baby was a small plush animal, understuffed with plastic pellets, that between 1996 and 1999 was widely believed to be a retirement plan. Collectors stored them in protective cases and refused to remove the tags, which apparently held all the value.\n\nAt the peak of the craze, rare specimens changed hands for thousands of dollars. Today most are worth slightly less than the cost of this sentence.\n\nSee also: Speculative Bubbles, Pogs, The Stock Market." },
      "Pizza": { cat: "Culture", body:
        "Pizza is a flat bread topped with sauce, cheese, and negotiation. Invented in Naples, perfected by teenagers ordering it at 1 AM during a LAN party.\n\nIn 1998, pizza could be summoned by telephone and arrived in approximately 30 minutes, a delivery speed the internet would not match for another two decades.\n\nThe correct number of pizzas for a group is always one more than ordered.\n\nSee also: Phone Dialer, LAN Party, Orange Soda." },
      "The Cat": { cat: "Nature", body:
        "The domestic cat is a small carnivore that has convinced humans to house it in exchange for occasional tolerance. In 1998, cats gained a second habitat: the personal home page, where they appeared in animated GIF form on approximately 40% of all websites.\n\nCats are known to sit on keyboards at critical moments, a behavior researchers describe as 'help.' The most famous internet cat of this era is Pixel, who has his own page.\n\nSee also: StarDust's Homepage, The Guestbook." },
      "The Internet": { cat: "Technology", body:
        "The Internet is a global network of computers that, in 1998, is accessed by telephone and measured in minutes. Common activities include checking email (2 minutes), loading a photograph (2 minutes), and being disconnected because someone in the house lifted a receiver (instant).\n\nExperts estimate the Internet contains as many as one million websites, and some believe it may one day be used for shopping.\n\nThe Internet should not be confused with the World Wide Web, say people at parties.\n\nSee also: The Modem, 'Get Off The Phone'." },
      "The Compact Disc": { cat: "Technology", body:
        "The compact disc stores music as microscopic pits read by a laser, which sounded like science fiction until it was in every glovebox in America. A CD holds 74 minutes of audio — a number chosen, legend claims, to fit Beethoven's Ninth Symphony.\n\nCare instructions: hold by the edges, never touch the underside, and clean with a soft cloth in outward strokes. Everyone knows these rules. No one follows them. That is why track 4 skips.\n\nSee also: The CD Wallet, Track 4." },
      "Volcanoes": { cat: "Nature", body:
        "A volcano is a rupture in a planet's crust through which molten rock escapes, an arrangement geologists describe as 'spectacular' and insurance companies describe differently.\n\nThe 1980 eruption of Mount St. Helens ejected material 15 miles into the sky. Magma is called lava once it reaches the surface, a renaming ceremony it performs at roughly 1,000 degrees Celsius.\n\nA popular school project involves recreating one with baking soda and vinegar. Results are more modest.\n\nSee also: The Baking Soda Volcano, Pompeii." },
      "The Ocean": { cat: "Nature", body:
        "The ocean covers 71% of Earth and is, as of 1998, less thoroughly mapped than the Moon. Its deepest point, the Mariana Trench, would swallow Mount Everest with over a mile to spare — a fact this encyclopedia finds unsettling and has chosen to share.\n\nThe ocean is home to the blue whale, the largest animal ever known, and to countless species not yet discovered, all of which are presumed damp.\n\nSee also: Whales, The Beach, Water (General)." },
      "Inline Skating": { cat: "Culture", body:
        "Inline skating swept the 1990s as a mode of transport combining the speed of a bicycle with the stopping ability of neither a bicycle nor anything else.\n\nProper equipment includes a helmet, wrist guards, knee pads, and a driveway with a gentle slope. The activity's defining maneuver, 'the frantic windmill,' is performed involuntarily.\n\nBy 1998 an estimated 30 million Americans owned inline skates, and an estimated 30 million pairs were in garages.\n\nSee also: The Driveway, Band-Aids." },
      "The Virtual Pet": { cat: "Technology", body:
        "The virtual pet is a keychain computer containing a small creature that must be fed, cleaned, and entertained by pressing three buttons in various orders. Neglect results in the creature's departure, accompanied by beeping and genuine third-grade grief.\n\nAt the height of the 1997-98 craze, schools banned them, prompting a generation of parents to learn what it means to babysit a keychain during work hours.\n\nSee also: Responsibility (Introduction To), Beeping." },
      "The Shopping Mall": { cat: "Culture", body:
        "The shopping mall is a climate-controlled habitat where teenagers evolve. Key features include a food court, a fountain containing $34 in wishes, and a store that sells only sunglasses.\n\nIn 1998 the mall serves as the primary social network, with messages posted by paging a friend over the food court intercom.\n\nMall walking — the practice of exercising there before the stores open — remains the mall's most peaceful application.\n\nSee also: The Food Court, The Arcade, Being Home By Six." },
      "Homework": { cat: "Culture", body:
        "Homework is an ancient practice by which school extends into the home. Traditional formats include the worksheet, the essay, and the diorama, which is a shoebox that consumes an entire weekend.\n\nThe arrival of the home computer transformed homework: reports are now typed, illustrated with clip art, and printed at 11 PM while a parent hovers asking if the printer 'has enough ink.'\n\nThis encyclopedia was purchased to help with homework. Statistically, it is currently being used to read about volcanoes instead.\n\nSee also: Volcanoes, The Book Report, Due Tomorrow." }
    };

    const win = WM.create({
      title: "Encyclopedia 98", icon: "encarta", appId: "encarta",
      width: 600, height: 440, minWidth: 480, minHeight: 320,
      statusbar: [{ text: Object.keys(ART).length + " articles" }],
      menus: [
        { label: "File", items: () => [{ label: "Exit", click: () => win.close() }] },
        { label: "Help", items: () => [
          { label: "About Encyclopedia 98", click: () => Dialogs.about("Encyclopedia 98", "encarta", ["Everything worth knowing, and much that is not.", "Sources: vibes."]) }
        ]}
      ]
    });
    const body = el("div", { class: "exp-body" });
    const sidebar = el("div", { style: "width:190px;flex:none;margin-right:3px;display:flex;flex-direction:column" });
    const search = el("input", { type: "text", class: "field", style: "margin-bottom:3px", placeholder: "Search articles..." });
    const listEl = el("div", { class: "tree sunken", style: "flex:1" });
    sidebar.append(search, listEl);
    const article = el("div", { class: "sunken", style: "flex:1;background:#fff;overflow:auto;padding:0" });
    body.append(sidebar, article);
    win.body.append(body);
    win.body.style.padding = "3px";

    let cur = null;
    function paintList(filter) {
      listEl.innerHTML = "";
      const cats = {};
      Object.keys(ART).forEach(k => {
        if (filter && !(k + " " + ART[k].body).toLowerCase().includes(filter.toLowerCase())) return;
        (cats[ART[k].cat] = cats[ART[k].cat] || []).push(k);
      });
      Object.keys(cats).sort().forEach(cat => {
        listEl.append(el("div", { style: "font-weight:700;color:#000080;padding:3px 2px 1px", text: cat }));
        cats[cat].sort().forEach(k => {
          const row = el("div", { class: "tree-row", style: "padding-left:12px" });
          row.append(Icons.img("encarta", 16), el("span", { class: "tlabel", text: k }));
          if (k === cur) row.classList.add("sel");
          row.addEventListener("mousedown", () => show(k));
          listEl.append(row);
        });
      });
      if (!listEl.children.length) listEl.append(el("div", { style: "padding:12px;color:#808080", text: "No articles found." }));
    }
    function playArticleSound(kind) {
      const bus = Sound.audio();
      if (!bus) return;
      if (kind === "roar") {
        const o = bus.ctx.createOscillator(), g = bus.ctx.createGain();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(90, bus.ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(55, bus.ctx.currentTime + 1.1);
        g.gain.setValueAtTime(0.001, bus.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.12, bus.ctx.currentTime + 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, bus.ctx.currentTime + 1.3);
        const f = bus.ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 800;
        o.connect(f); f.connect(g); g.connect(bus.master);
        o.start(); o.stop(bus.ctx.currentTime + 1.4);
      } else {
        // "space": airy pad swell
        [110, 165, 220].forEach((fr, i) => {
          const o = bus.ctx.createOscillator(), g = bus.ctx.createGain();
          o.type = "sine"; o.frequency.value = fr;
          g.gain.setValueAtTime(0.0001, bus.ctx.currentTime);
          g.gain.linearRampToValueAtTime(0.05, bus.ctx.currentTime + 0.5 + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.0001, bus.ctx.currentTime + 2.4);
          o.connect(g); g.connect(bus.master);
          o.start(); o.stop(bus.ctx.currentTime + 2.5);
        });
      }
    }
    function show(k) {
      cur = k;
      const a = ART[k];
      article.innerHTML = "";
      const head = el("div", { style: "background:linear-gradient(#1a3a7a,#3a5aaa);color:#fff;padding:10px 14px" },
        el("div", { style: "font-size:20px;font-family:'Times New Roman',serif", text: k }),
        el("div", { style: "font-size:11px;opacity:0.85", text: a.cat + " · Encyclopedia 98" }));
      const media = el("div", { style: "float:right;width:150px;margin:12px;text-align:center" });
      const cv = el("canvas", { width: "140", height: "100", style: "border:1px solid #888;background:#e8eef8" });
      drawIllustration(cv.getContext("2d"), k);
      media.append(cv, el("div", { style: "font-size:10px;color:#666;margin-top:2px", text: "Fig. 1 — " + k }));
      if (a.sound) {
        const spk = el("button", { class: "btn", text: "🔊 Play sound", style: "margin-top:4px;min-width:0;font-size:11px" });
        spk.addEventListener("click", () => playArticleSound(a.sound));
        media.append(spk);
      }
      const text = el("div", { style: "padding:12px 14px;font-size:13px;line-height:1.6;font-family:Georgia,serif" });
      a.body.split("\n\n").forEach(p => text.append(el("p", { text: p, style: "margin:0 0 10px" })));
      article.append(head, media, text);
      article.scrollTop = 0;
      paintList(search.value);
      win.setStatus(0, "Reading: " + k);
    }
    function drawIllustration(c, k) {
      c.fillStyle = "#e8eef8"; c.fillRect(0, 0, 140, 100);
      if (k === "The Modem") {
        c.fillStyle = "#303030"; c.fillRect(20, 40, 100, 40);
        c.fillStyle = "#00c000"; c.fillRect(28, 48, 8, 4); c.fillStyle = "#c00000"; c.fillRect(40, 48, 8, 4);
        c.strokeStyle = "#606060"; c.beginPath(); c.moveTo(120, 60); c.bezierCurveTo(135, 40, 110, 30, 130, 20); c.stroke();
      } else if (k === "Windows 98") {
        const img = new Image(); img.onload = () => c.drawImage(img, 40, 20, 60, 60); img.src = W98.Icons.bigFlag(4);
      } else if (k === "The Dinosaurs") {
        c.fillStyle = "#3a7a3a";
        c.beginPath(); c.moveTo(20, 80); c.quadraticCurveTo(30, 30, 70, 40); c.quadraticCurveTo(110, 45, 120, 30); c.lineTo(120, 40); c.quadraticCurveTo(90, 60, 70, 55); c.quadraticCurveTo(40, 55, 40, 80); c.closePath(); c.fill();
        c.fillStyle = "#000"; c.beginPath(); c.arc(114, 33, 2, 0, Math.PI * 2); c.fill();
      } else if (k === "Outer Space" || k === "The Y2K Bug") {
        c.fillStyle = "#000018"; c.fillRect(0, 0, 140, 100);
        c.fillStyle = "#fff"; for (let i = 0; i < 30; i++) c.fillRect((i * 47) % 140, (i * 83) % 100, 1.5, 1.5);
        c.fillStyle = "#e0c060"; c.beginPath(); c.arc(70, 50, 16, 0, Math.PI * 2); c.fill();
        c.strokeStyle = "#a0a0ff"; c.beginPath(); c.ellipse(70, 50, 30, 10, 0.4, 0, Math.PI * 2); c.stroke();
      } else if (k === "The Cat") {
        const img = new Image(); img.onload = () => c.drawImage(img, 38, 15, 64, 64); img.src = W98.Icons.get("catpage", 64);
      } else if (k === "Volcanoes") {
        c.fillStyle = "#87b0d8"; c.fillRect(0, 0, 140, 60);
        c.fillStyle = "#6a4a30";
        c.beginPath(); c.moveTo(10, 95); c.lineTo(60, 30); c.lineTo(80, 30); c.lineTo(130, 95); c.closePath(); c.fill();
        c.fillStyle = "#e04010";
        c.beginPath(); c.moveTo(60, 30); c.quadraticCurveTo(70, 45, 66, 70); c.lineTo(74, 70); c.quadraticCurveTo(72, 45, 80, 30); c.closePath(); c.fill();
        c.fillStyle = "#909090";
        [[62, 18, 9], [76, 14, 11], [70, 8, 8]].forEach(([px, py, r]) => { c.beginPath(); c.arc(px, py, r, 0, 7); c.fill(); });
      } else if (k === "The Ocean") {
        const g = c.createLinearGradient(0, 0, 0, 100);
        g.addColorStop(0, "#5090d0"); g.addColorStop(1, "#103060");
        c.fillStyle = g; c.fillRect(0, 0, 140, 100);
        c.strokeStyle = "#c8e0f8"; c.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          c.beginPath();
          for (let px = 0; px <= 140; px += 4) {
            const py = 12 + i * 6 + Math.sin(px / 12 + i) * 3;
            px ? c.lineTo(px, py) : c.moveTo(px, py);
          }
          c.stroke();
        }
        c.fillStyle = "#e8a030";
        c.beginPath(); c.ellipse(60, 66, 14, 7, 0, 0, 7); c.fill();
        c.beginPath(); c.moveTo(72, 66); c.lineTo(84, 58); c.lineTo(84, 74); c.closePath(); c.fill();
        c.fillStyle = "#103060"; c.beginPath(); c.arc(53, 64, 1.5, 0, 7); c.fill();
      } else if (k === "The Compact Disc") {
        const g = c.createConicGradient ? c.createConicGradient(0, 70, 50) : null;
        c.fillStyle = "#d0d4e0"; c.beginPath(); c.arc(70, 50, 34, 0, 7); c.fill();
        ["#f0c0d0", "#c0f0d0", "#c0d0f8", "#f8f0c0"].forEach((col, i) => {
          c.strokeStyle = col; c.lineWidth = 5;
          c.beginPath(); c.arc(70, 50, 28 - i * 6, i * 0.8, i * 0.8 + 2.2); c.stroke();
        });
        c.fillStyle = "#e8eef8"; c.beginPath(); c.arc(70, 50, 7, 0, 7); c.fill();
        c.strokeStyle = "#a0a4b0"; c.lineWidth = 1; c.beginPath(); c.arc(70, 50, 34, 0, 7); c.stroke();
      } else if (k === "The Virtual Pet") {
        c.fillStyle = "#e05090";
        c.beginPath(); c.ellipse(70, 52, 30, 34, 0, 0, 7); c.fill();
        c.fillStyle = "#b8d8c0"; c.fillRect(54, 34, 32, 26);
        c.fillStyle = "#304838";
        c.fillRect(62, 42, 4, 4); c.fillRect(74, 42, 4, 4);
        c.fillRect(64, 52, 12, 2);
        [[58, 72], [70, 76], [82, 72]].forEach(([px, py]) => { c.fillStyle = "#901850"; c.beginPath(); c.arc(px, py, 4, 0, 7); c.fill(); });
        c.strokeStyle = "#901850"; c.lineWidth = 3; c.beginPath(); c.arc(70, 16, 6, 0, 7); c.stroke();
      } else {
        c.fillStyle = "#c0a060"; c.font = "40px serif"; c.textAlign = "center";
        const EMO = { "Pizza": "🍕", "The Beanie Baby": "🧸", "The Internet": "🌐", "Inline Skating": "🛼", "The Shopping Mall": "🛍️", "Homework": "📝" };
        c.fillText(EMO[k] || "📖", 70, 64);
        c.textAlign = "left";
      }
    }
    search.addEventListener("input", () => paintList(search.value));
    search.addEventListener("keydown", e => e.stopPropagation());
    paintList("");
    show("Windows 98");
    return win;
  }
};

/* netgrab.js — NetGrab: share tunes with a million strangers, 1999-style.
   Peers, filenames and stalls are all fiction; the songs are our own library. */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.netgrab = {
  name: "NetGrab", icon: "netgrab", single: true,
  launch() {
    const PEERS = ["mp3king77", "sk8rgrrl", "davesbasement", "lanpartylarry", "dialup_dan", "cdripper2000", "y2kready", "modemgoesbrr"];
    const MUSIC_DIR = "C:/My Documents/My Music";
    let downloads = [];   // {track, peer, kbps, got, size, status, timer}

    const win = WM.create({
      title: "NetGrab v0.98 beta", icon: "netgrab", appId: "netgrab",
      width: 520, height: 420, minWidth: 440, minHeight: 320,
      statusbar: [{ text: "Connected to opennet: 1,204,377 users sharing 22 files that matter" }],
      menus: [
        { label: "File", items: () => [{ label: "Exit", click: () => win.close() }] },
        { label: "Help", items: () => [
          { label: "About NetGrab", click: () => Dialogs.about("NetGrab", "netgrab", ["Peer-to-peer music, one stall at a time.", "All shared songs are public domain or original."]) }
        ]}
      ],
      onClose: () => downloads.forEach(d => clearInterval(d.timer))
    });
    win.body.style.padding = "6px";

    /* search row */
    const q = el("input", { type: "text", class: "field", style: "flex:1" });
    const searchB = el("button", { class: "btn default", text: "Search" });
    const srow = el("div", { style: "display:flex;gap:6px;flex:none;margin-bottom:4px" },
      el("span", { text: "Find music:", style: "align-self:center" }), q, searchB);

    /* results */
    const results = el("div", { class: "listview sunken", style: "flex:1;min-height:80px" });
    /* transfers */
    const transfers = el("div", { class: "sunken", style: "flex:none;height:110px;overflow:auto;background:#fff;padding:3px;margin-top:4px" });
    win.body.append(srow,
      el("div", { text: "Search results (double-click to download):", style: "flex:none;margin:2px 0" }), results,
      el("div", { text: "Transfers:", style: "flex:none;margin:2px 0" }), transfers);

    function doSearch() {
      const term = q.value.trim().toLowerCase();
      results.innerHTML = "";
      const hits = Music.TRACKS
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => !term || (t.title + " " + t.artist).toLowerCase().includes(term));
      if (!hits.length) {
        results.append(el("div", { style: "padding:14px;text-align:center;color:#808080", text: "No files found. The 1999 internet had exactly " + Music.TRACKS.length + " songs. Try a shorter search." }));
        return;
      }
      const table = el("table", { style: "border-collapse:collapse;width:100%" });
      const hd = el("tr");
      ["Filename", "User", "Speed", "Ping"].forEach(h => hd.append(el("th", { text: h, style: "text-align:left;padding:2px 6px;background:var(--face);box-shadow:inset -1px -1px var(--dark), inset 1px 1px var(--lighter);position:sticky;top:0" })));
      table.append(hd);
      hits.forEach(({ t, i }) => {
        const peer = PEERS[(i * 3 + term.length) % PEERS.length];
        const tr = el("tr");
        tr.append(
          el("td", { text: t.title.replace(/\s+/g, "_").toLowerCase() + "_(" + t.artist.split(" ")[0].toLowerCase() + ").mp3", style: "padding:1px 6px;white-space:nowrap" }),
          el("td", { text: peer, style: "padding:1px 6px" }),
          el("td", { text: "56k", style: "padding:1px 6px" }),
          el("td", { text: (40 + ((i * 77) % 400)) + " ms", style: "padding:1px 6px" }));
        tr.addEventListener("mousedown", () => {
          $$("tr", table).forEach(r => { r.style.background = ""; r.style.color = ""; });
          tr.style.background = "var(--hl)"; tr.style.color = "#fff";
        });
        tr.addEventListener("dblclick", () => startDownload(i, peer));
        table.append(tr);
      });
      results.append(table);
    }
    searchB.addEventListener("click", doSearch);
    q.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") doSearch(); });

    function fileNameFor(i) {
      const t = Music.TRACKS[i];
      return t.title + " - " + t.artist.split("(")[0].trim() + ".mp3";
    }

    function startDownload(i, peer) {
      if (FS.exists(MUSIC_DIR + "/" + fileNameFor(i))) {
        WM.msgbox({ title: "NetGrab", icon: "info", text: "You already have that one.\nCheck " + FS.display(MUSIC_DIR) + " — burning it to CD-R is your own responsibility." });
        return;
      }
      const d = {
        track: i, peer, got: 0,
        size: 2800 + ((Math.random() * 1700) | 0),   // "KB"
        status: "Downloading", stalled: false
      };
      downloads.push(d);
      Sound.play("click");
      d.timer = setInterval(() => {
        if (d.status !== "Downloading") return;
        if (!d.stalled && Math.random() < 0.06) {
          d.stalled = true;
          d.status = "Stalled — connection reset by peer, retrying...";
          setTimeout(() => { d.status = "Downloading"; d.stalled = false; }, 2500 + Math.random() * 2000);
          paintTransfers();
          return;
        }
        d.got += 90 + Math.random() * 120;   // compressed-time 56k
        if (d.got >= d.size) {
          d.got = d.size;
          d.status = "Complete";
          clearInterval(d.timer);
          if (!FS.exists(MUSIC_DIR)) FS.mkdir(MUSIC_DIR);
          FS.writeFile(MUSIC_DIR + "/" + fileNameFor(i), "song:" + i);
          Sound.play("ding");
          win.setStatus(0, "Download complete: " + fileNameFor(i) + " — saved to My Music");
        }
        paintTransfers();
      }, 250);
      paintTransfers();
    }

    function paintTransfers() {
      if (win.closed) return;
      transfers.innerHTML = "";
      if (!downloads.length) {
        transfers.append(el("div", { style: "padding:10px;color:#808080;text-align:center", text: "No transfers. Your download ratio is a perfect mystery." }));
        return;
      }
      downloads.forEach(d => {
        const t = Music.TRACKS[d.track];
        const pct = Math.round(d.got / d.size * 100);
        const row = el("div", { style: "margin-bottom:5px" });
        row.append(
          el("div", { style: "font-size:11px", text: fileNameFor(d.track) + "  —  from " + d.peer + "  (" + Math.round(d.got) + "/" + d.size + " KB)" }),
          el("div", { class: "progress", style: "height:12px" }, el("div", { class: "bar", style: "width:" + pct + "%" })),
          el("div", { style: "font-size:10px;color:" + (d.status === "Complete" ? "#008000" : d.stalled ? "#a00000" : "#404040"), text: d.status + (d.status === "Downloading" ? " at 5.6 KB/s" : "") })
        );
        if (d.status === "Complete") {
          const play = el("button", { class: "btn", text: "Play", style: "min-width:50px;height:18px;padding:0;font-size:10px" });
          play.addEventListener("click", () => W98.launch("megaamp", { play: d.track }));
          row.append(play);
        }
        transfers.append(row);
      });
    }

    doSearch();
    paintTransfers();
    return win;
  }
};

/* fileio.js — real files in, real files out.
   Drop Finder files onto the desktop or an Explorer folder to import them
   into the virtual C: drive; right-click any file > "Export to Mac..." to
   get it back out (native save panel in the app, download in a browser). */
"use strict";
W98.FileIO = (() => {
  const MAX_FILES = 12;
  const MAX_BYTES = 4 * 1024 * 1024;
  const TEXT_EXT = ["txt", "md", "csv", "log", "ini", "bat", "htm", "html", "js", "json", "xml", "rtf", "bas"];
  const IMG_EXT = ["png", "jpg", "jpeg", "gif", "bmp", "webp"];
  const AUD_EXT = ["wav", "mp3", "m4a", "ogg", "aif", "aiff"];
  const extOf = (n) => (n.match(/\.([a-z0-9]+)$/i) || [, ""])[1].toLowerCase();

  /* ---------- import ---------- */
  function targetDirFor(el2) {
    /* dropping inside an Explorer window imports into its current folder */
    const winEl = el2 && el2.closest ? el2.closest(".win") : null;
    if (winEl) {
      const win = W98.WM.wins.find(w => w.el === winEl);
      if (win && win._loc && !String(win._loc).startsWith("::") && FS.get(win._loc)) return win._loc;
    }
    return FS.DESKTOP;
  }

  const VIDEO_EXT = ["mp4", "m4v", "mov", "webm", "ogv", "avi", "mkv", "mpg", "mpeg", "wmv"];

  function importFiles(fileList, dir) {
    let files = [...fileList].slice(0, MAX_FILES);
    if (!files.length) return;
    /* video files skip the VFS (no 4 MB ceiling for movies even in 1998 dreams)
       and go straight to Media Player 98 as session blob URLs */
    const videos = files.filter(f => VIDEO_EXT.includes(extOf(f.name)) || (f.type && f.type.startsWith("video/")));
    files = files.filter(f => !videos.includes(f));
    if (videos.length) {
      const v = videos[0];
      W98.launch("mediaplayer", { local: true, name: v.name, url: URL.createObjectURL(v), type: v.type });
      if (videos.length > 1) {
        WM.msgbox({ title: "Media Player 98", icon: "info",
          text: W98.tr("One video at a time — it is 1998 and there is one video card.\nPlaying: ") + v.name });
      }
    }
    if (!files.length) return;
    let done = 0, results = [];
    const finish = () => {
      if (++done < files.length) return;
      Sound.play("ding");
      const ok = results.filter(r => !r.err);
      const bad = results.filter(r => r.err);
      WM.msgbox({
        title: "Import Complete", icon: "info",
        text: (ok.length ? "Imported to " + FS.display(dir) + ":\n" + ok.map(r => "  • " + r.name).join("\n") : "Nothing imported.") +
          (bad.length ? "\n\nSkipped:\n" + bad.map(r => "  • " + r.name + " (" + r.err + ")").join("\n") : "") +
          "\n\nDouble-click to open. Right-click > Export to Mac... to send back."
      });
    };
    files.forEach(f => {
      const nm = FS.uniqueName(dir, f.name.replace(/\.[^.]*$/, "") || "imported", (f.name.match(/\.[^.]*$/) || [""])[0]);
      if (f.size > MAX_BYTES) { results.push({ name: f.name, err: "over 4 MB — very un-1998" }); finish(); return; }
      const e = extOf(f.name);
      const reader = new FileReader();
      reader.onerror = () => { results.push({ name: f.name, err: "read failed" }); finish(); };
      if (TEXT_EXT.includes(e) || (f.type && f.type.startsWith("text/"))) {
        reader.onload = () => {
          FS.writeFile(dir + "/" + nm, String(reader.result));
          results.push({ name: nm });
          finish();
        };
        reader.readAsText(f);
      } else {
        reader.onload = () => {
          FS.writeFile(dir + "/" + nm, String(reader.result));   /* data: URL — lossless */
          results.push({ name: nm });
          finish();
        };
        reader.readAsDataURL(f);
      }
    });
  }

  let dragDepth = 0;
  document.addEventListener("dragover", (e) => {
    if (e.dataTransfer && [...e.dataTransfer.types].includes("Files")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  });
  document.addEventListener("dragenter", (e) => {
    if (e.dataTransfer && [...e.dataTransfer.types].includes("Files")) {
      dragDepth++;
      document.body.classList.add("file-drop-armed");
    }
  });
  document.addEventListener("dragleave", () => {
    if (--dragDepth <= 0) { dragDepth = 0; document.body.classList.remove("file-drop-armed"); }
  });
  document.addEventListener("drop", (e) => {
    document.body.classList.remove("file-drop-armed");
    dragDepth = 0;
    if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
    e.preventDefault();
    importFiles(e.dataTransfer.files, targetDirFor(e.target));
  });

  /* ---------- export ---------- */
  function exportFile(path) {
    const node = FS.get(path);
    if (!node || node.t !== "f") return;
    const name = FS.segs(path).pop();
    const data = String(node.data || "");
    const bridge = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.system;
    if (bridge) {
      if (data.startsWith("data:") && data.includes(";base64,")) {
        bridge.postMessage({ cmd: "exportFile", name, dataUrl: data });
      } else {
        bridge.postMessage({ cmd: "exportFile", name, text: data.replace(/\r?\n/g, "\r\n") });
      }
      return;
    }
    /* browser fallback: trigger a download */
    let url;
    if (data.startsWith("data:")) url = data;
    else url = URL.createObjectURL(new Blob([data], { type: "text/plain" }));
    const a = el("a", { href: url, download: name, style: "display:none" });
    document.body.append(a);
    a.click();
    setTimeout(() => { a.remove(); if (!data.startsWith("data:")) URL.revokeObjectURL(url); }, 2000);
  }

  /* ---------- imported audio playback ---------- */
  W98.playAudioFile = function (path) {
    const data = FS.readFile(path);
    if (!data || !String(data).startsWith("data:")) return;
    const name = FS.segs(path).pop();
    const win = WM.create({
      title: name + " - Audio Player", icon: "megaamp",
      width: 330, height: 0, resizable: false, maximizable: false
    });
    win.el.style.height = "auto";
    const au = new Audio(String(data));
    const playB = el("button", { class: "btn", text: "❚❚", style: "min-width:36px" });
    const timeLbl = el("span", { style: "font-family:'Courier New',monospace;font-size:12px", text: "0:00 / 0:00" });
    const track = el("div", { class: "sunken", style: "flex:1;height:12px;background:#fff;position:relative;cursor:pointer" });
    const fill = el("div", { style: "position:absolute;left:0;top:0;bottom:0;width:0%;background:var(--hl)" });
    track.append(fill);
    const row = el("div", { style: "display:flex;align-items:center;gap:8px;padding:12px 14px" }, playB, track, timeLbl);
    const info = el("div", { style: "padding:0 14px 10px;font-size:10px;color:#606060", text: "Imported from your Mac — playing at full fidelity, which is cheating for 1998." });
    win.body.append(row, info);
    const fmt = (s) => isFinite(s) ? ((s / 60) | 0) + ":" + String((s % 60) | 0).padStart(2, "0") : "0:00";
    const iv = setInterval(() => {
      if (win.closed) { clearInterval(iv); return; }
      fill.style.width = (au.duration ? (au.currentTime / au.duration * 100) : 0) + "%";
      timeLbl.textContent = fmt(au.currentTime) + " / " + fmt(au.duration);
      playB.textContent = au.paused ? "▶" : "❚❚";
    }, 300);
    playB.addEventListener("click", () => { if (au.paused) au.play().catch(() => {}); else au.pause(); });
    track.addEventListener("mousedown", (e) => {
      const r = track.getBoundingClientRect();
      if (au.duration && r.width) au.currentTime = (e.clientX - r.x) / r.width * au.duration;
    });
    win.opts.onClose = () => { clearInterval(iv); au.pause(); };
    au.play().catch(() => {});
    return win;
  };

  return { importFiles, exportFile };
})();

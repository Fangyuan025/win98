/* mediaplayer.js — Media Player 98: streaming video from the future,
   in a window that believes it is Windows Media Player 6.4.
   YouTube / Bilibili / Vimeo / Dailymotion play through their official
   embed players inside the 98 chrome. */
"use strict";
W98.Apps = W98.Apps || {};
(() => {
  function parseVideoUrl(url) {
    try {
      const u = new URL(url);
      const h = u.hostname.replace(/^www\./, "").replace(/^m\./, "");
      if (h === "youtu.be") {
        const id = u.pathname.slice(1).split("/")[0];
        if (id) return { site: "YouTube", embed: "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1" };
      }
      if (h.endsWith("youtube.com") || h.endsWith("youtube-nocookie.com")) {
        if (u.pathname.startsWith("/watch")) {
          const id = u.searchParams.get("v");
          if (id) return { site: "YouTube", embed: "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1" };
        }
        const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{6,})/);
        if (m) return { site: "YouTube", embed: "https://www.youtube-nocookie.com/embed/" + m[2] + "?autoplay=1" };
      }
      if (h.endsWith("bilibili.com")) {
        const m = u.pathname.match(/\/video\/(BV\w+|av(\d+))/i);
        if (m) return {
          site: "Bilibili",
          embed: "https://player.bilibili.com/player.html?" +
            (m[1].toLowerCase().startsWith("bv") ? "bvid=" + m[1] : "aid=" + m[2]) +
            "&autoplay=1&high_quality=1&danmaku=0"
        };
      }
      if (h === "b23.tv") {
        const m = u.pathname.match(/^\/(BV\w+)/i);
        if (m) return { site: "Bilibili", embed: "https://player.bilibili.com/player.html?bvid=" + m[1] + "&autoplay=1&high_quality=1&danmaku=0" };
      }
      if (h === "vimeo.com") {
        const m = u.pathname.match(/^\/(\d+)/);
        if (m) return { site: "Vimeo", embed: "https://player.vimeo.com/video/" + m[1] + "?autoplay=1" };
      }
      if (h.endsWith("dailymotion.com")) {
        const m = u.pathname.match(/\/video\/(\w+)/);
        if (m) return { site: "Dailymotion", embed: "https://www.dailymotion.com/embed/video/" + m[1] + "?autoplay=1" };
      }
      if (h === "dai.ly") {
        const m = u.pathname.match(/^\/(\w+)/);
        if (m) return { site: "Dailymotion", embed: "https://www.dailymotion.com/embed/video/" + m[1] + "?autoplay=1" };
      }
    } catch (e) { /* not a URL */ }
    return null;
  }
  W98.parseVideoUrl = parseVideoUrl;

  W98.Apps.mediaplayer = {
    name: "Media Player 98", icon: "tv98", single: true,
    reopen(w, arg) {
      if (!arg || !w._play) return;
      if (typeof arg === "string") w._play(arg);
      else if (arg.local) w._playLocal(arg);
    },
    launch(arg) {
      const win = WM.create({
        title: "Media Player 98", icon: "tv98", appId: "mediaplayer",
        width: 560, height: 460, minWidth: 380, minHeight: 300,
        statusbar: [{ text: "Ready" }, { text: "28.8k (allegedly)", width: 130 }],
        menus: [
          { label: "File", items: () => [
            { label: "Open URL...", click: openUrlDialog },
            { label: "Open File...", click: openFileDialog },
            "-",
            { label: "Close", click: () => win.close() }
          ]},
          { label: "Help", items: () => [
            { label: "About Media Player 98", click: () =>
              Dialogs.about("Media Player 98", "tv98", [
                "Streaming video from the future,",
                "buffered through the past.",
                "Supports YouTube, Bilibili, Vimeo, Dailymotion."]) }
          ]}
        ]
      });
      win.body.style.background = "#000";
      win.body.style.display = "flex";
      win.body.style.flexDirection = "column";

      if (!document.getElementById("mp98css")) {
        document.head.append(el("style", { id: "mp98css", text: `
          .mp-controls { background:#c0c0c0; border-top:1px solid #fff; padding:4px 6px; display:flex; align-items:center; gap:3px; }
          .mp-btn { min-width:28px; height:22px; padding:0 5px; font-size:11px; line-height:1; }
          .mp-track { flex:1; height:11px; border:1px solid; border-color:#808080 #fff #fff #808080; background:#9a9a9a; position:relative; cursor:pointer; margin:0 6px; }
          .mp-fill { position:absolute; left:0; top:0; bottom:0; background:#000080; width:0%; pointer-events:none; }
          .mp-time { font-size:10px; font-family:Tahoma,sans-serif; min-width:82px; text-align:right; }
        ` }));
      }
      const stage = el("div", { style: "flex:1;position:relative;background:#000;min-height:0" });
      const controlsSlot = el("div");
      const banner = el("div", {
        style: "background:#c0c0c0;border-top:1px solid #fff;padding:3px 8px;font-size:10px;display:flex;justify-content:space-between",
      }, el("span", { text: W98.tr("Clip: (none)") }), el("span", { text: "Windows Media ™" }));
      win.body.append(stage, controlsSlot, banner);
      const clipLabel = banner.firstChild;

      function splash() {
        stage.innerHTML = "";
        stage.append(el("div", {
          style: "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#c0c0c0;font-size:12px;text-align:center;gap:8px;padding:20px"
        },
          el("div", { style: "font-size:34px", text: "▶" }),
          el("div", { text: W98.tr("Open a video with File > Open URL / Open File — or drop a movie file from your Mac onto this window.") }),
          el("div", { style: "font-size:10px;color:#808080", text: W98.tr("YouTube, Bilibili, Vimeo and Dailymotion links all work. The 28.8k modem will do its best.") })
        ));
      }

      function play(u) {
        /* streaming needs the modem; local files (playLocal) never do */
        if (W98.Net && !W98.Net.connected) { W98.Net.require(() => { if (!win.closed) play(u); }); return; }
        const vid = parseVideoUrl(u);
        if (!vid) {
          WM.msgbox({ title: "Media Player 98", icon: "warn",
            text: W98.tr("That does not look like a video link.\n\nPaste a YouTube, Bilibili, Vimeo or Dailymotion address.") });
          return;
        }
        stage.innerHTML = "";
        controlsSlot.innerHTML = "";
        stage.append(el("iframe", {
          src: vid.embed,
          style: "position:absolute;inset:0;width:100%;height:100%;border:0;background:#000",
          allow: "autoplay; fullscreen; encrypted-media; picture-in-picture",
          allowfullscreen: ""
        }));
        clipLabel.textContent = W98.tr("Clip: ") + vid.site + " — " + u.replace(/^https?:\/\//, "").slice(0, 60);
        win.setTitle(vid.site + " - Media Player 98");
        win.setStatus(0, W98.tr("Streaming... (buffering happens inside the little window now)"));
        Sound.play("click");
      }
      win._play = play;

      /* local files from a Finder drag or File > Open File... — the video tag
         does the decoding, but the transport controls are pure 1998 */
      function playLocal(v) {
        stage.innerHTML = "";
        controlsSlot.innerHTML = "";
        const vid = el("video", {
          src: v.url, autoplay: "", playsinline: "",
          style: "position:absolute;inset:0;width:100%;height:100%;background:#000"
        });
        vid.addEventListener("error", () => {
          stage.innerHTML = "";
          controlsSlot.innerHTML = "";
          stage.append(el("div", {
            style: "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#c0c0c0;font-size:12px;text-align:center;gap:8px;padding:20px"
          },
            el("div", { style: "font-size:30px", text: "✖" }),
            el("div", { text: W98.tr("This codec is not installed.") }),
            el("div", { style: "font-size:10px;color:#808080", text: W98.tr("(WebKit plays .mp4, .mov, .m4v and .webm. For the rest, 1998 suggests downloading a codec pack from a site you do not trust.)") })
          ));
          win.setStatus(0, W98.tr("Cannot play this file."));
        });
        stage.append(vid);

        /* ---- Win98 transport bar (no native chrome allowed) ---- */
        const fmt = (s) => {
          if (!isFinite(s)) s = 0;
          const m = Math.floor(s / 60), ss = Math.floor(s % 60);
          return m + ":" + String(ss).padStart(2, "0");
        };
        const bPlay = el("button", { class: "btn mp-btn", text: "⏸", dataset: { tip: "Play/Pause" } });
        const bStop = el("button", { class: "btn mp-btn", text: "■", dataset: { tip: "Stop" } });
        const bMute = el("button", { class: "btn mp-btn", text: "🔊", dataset: { tip: "Mute" } });
        const bFull = el("button", { class: "btn mp-btn", text: "⛶", dataset: { tip: "Full Screen" } });
        const track = el("div", { class: "mp-track" });
        const fill = el("div", { class: "mp-fill" });
        track.append(fill);
        const time = el("span", { class: "mp-time", text: "0:00 / 0:00" });
        controlsSlot.append(el("div", { class: "mp-controls" }, bPlay, bStop, track, time, bMute, bFull));

        bPlay.addEventListener("click", () => { if (vid.paused) vid.play(); else vid.pause(); });
        bStop.addEventListener("click", () => { vid.pause(); vid.currentTime = 0; });
        bMute.addEventListener("click", () => { vid.muted = !vid.muted; bMute.textContent = vid.muted ? "🔇" : "🔊"; });
        bFull.addEventListener("click", () => { (vid.requestFullscreen || vid.webkitRequestFullscreen || (() => {})).call(vid); });
        vid.addEventListener("play", () => { bPlay.textContent = "⏸"; });
        vid.addEventListener("pause", () => { bPlay.textContent = "▶"; });
        vid.addEventListener("timeupdate", () => {
          if (vid.duration) fill.style.width = (vid.currentTime / vid.duration * 100) + "%";
          time.textContent = fmt(vid.currentTime) + " / " + fmt(vid.duration);
        });
        const seek = (e) => {
          const r = track.getBoundingClientRect();
          if (vid.duration) vid.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * vid.duration;
        };
        track.addEventListener("mousedown", (e) => {
          seek(e);
          const mv = (e2) => seek(e2);
          const up = () => { document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); };
          document.addEventListener("mousemove", mv);
          document.addEventListener("mouseup", up);
        });
        /* double-click the picture to toggle play, like the old players */
        vid.addEventListener("dblclick", () => { if (vid.paused) vid.play(); else vid.pause(); });

        clipLabel.textContent = W98.tr("Clip: ") + v.name;
        win.setTitle(v.name.slice(0, 40) + " - Media Player 98");
        win.setStatus(0, W98.tr("Playing local file — no modem required."));
        win.setStatus(1, W98.tr("local disk"));
        Sound.play("click");
      }
      win._playLocal = playLocal;

      function openFileDialog() {
        const inp = el("input", { type: "file", accept: "video/*,.mp4,.m4v,.mov,.webm,.ogv,.avi,.mkv,.mpg,.wmv", style: "display:none" });
        inp.addEventListener("change", () => {
          const f = inp.files && inp.files[0];
          if (f) playLocal({ name: f.name, url: URL.createObjectURL(f), type: f.type });
          inp.remove();
        });
        document.body.append(inp);
        inp.click();
      }

      function openUrlDialog() {
        Dialogs.prompt({
          title: W98.tr("Open URL"),
          label: W98.tr("Enter the address of a streaming video:"),
          value: "https://www.youtube.com/watch?v="
        }).then((v) => { if (v && v.trim()) play(v.trim()); });
      }

      if (arg && typeof arg === "string") play(arg);
      else if (arg && arg.local) playLocal(arg);
      else splash();
      return win;
    }
  };
})();

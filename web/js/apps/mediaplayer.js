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

      const stage = el("div", { style: "flex:1;position:relative;background:#000;min-height:0" });
      const banner = el("div", {
        style: "background:#c0c0c0;border-top:1px solid #fff;padding:3px 8px;font-size:10px;display:flex;justify-content:space-between",
      }, el("span", { text: W98.tr("Clip: (none)") }), el("span", { text: "Windows Media ™" }));
      win.body.append(stage, banner);
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
        const vid = parseVideoUrl(u);
        if (!vid) {
          WM.msgbox({ title: "Media Player 98", icon: "warn",
            text: W98.tr("That does not look like a video link.\n\nPaste a YouTube, Bilibili, Vimeo or Dailymotion address.") });
          return;
        }
        stage.innerHTML = "";
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
         does the work, the chrome pretends it is 1998 */
      function playLocal(v) {
        stage.innerHTML = "";
        const vid = el("video", {
          src: v.url, controls: "", autoplay: "",
          style: "position:absolute;inset:0;width:100%;height:100%;background:#000"
        });
        vid.addEventListener("error", () => {
          stage.innerHTML = "";
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

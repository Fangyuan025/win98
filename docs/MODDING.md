# Modding & Contributing Guide

**English** · [繁體中文](#modding-與貢獻指南)

Everything in this machine is hand-written HTML/CSS/JS with zero dependencies,
and every program is one file. Adding your own is meant to be an afternoon
project. This guide walks through the whole path: run the repo, write an app,
give it an icon, put it in the Start menu, and (optionally) teach BOB to use it.

## 1. Run it locally

Two ways to work:

```bash
# A. the full native app (Swift + WKWebView shell)
./build.sh && open "Windows 98.app"

# B. faster iteration: a dev server + your browser
python3 devserver.py        # serves web/ at http://localhost:8098
```

The dev server is the nicer loop while you build: edit, reload, repeat.
Note that a few native-bridge features (real web fetching, PDF rendering,
file export panels) only work inside the real app — everything else,
including your new program, runs fine in a plain browser.

`http://localhost:8098/index.html?noboot=1` skips the boot sequence.

## 2. Where things live

| Path | What |
|---|---|
| `web/index.html` | Loads every script, in order, with a `?v=N` cache-buster |
| `web/js/wm.js` | Window manager — `WM.create()`, dialogs, `WM.msgbox()` |
| `web/js/desktop.js` | Desktop icons, `W98.launch()`, Open With, app registry home |
| `web/js/taskbar.js` | Start menu tree, task buttons, tray, clock |
| `web/js/fs.js` | The persistent virtual C: drive (`FS.*`) |
| `web/js/store.js` | Tiny persisted key-value store (`Store.get/set`) |
| `web/js/sound.js` | Beeps of the era (`Sound.play`) |
| `web/js/icons.js` + `iconart.js` | Procedural 32×32 icon artwork |
| `web/js/i18n.js` | English / Traditional Chinese layer (`W98.tr`) |
| `web/js/autopilot.js` | BOB, the ghost user |
| `web/js/events.js` | Random era events (blue screens, chain mail…) |
| `web/js/apps/*.js` | One file per program — your app goes here |
| `native/main.swift` | The macOS shell; you rarely need to touch it |

## 3. Write a program

A program is an object on `W98.Apps` with a `launch()` that builds a window.
Here is a complete, working example — drop it in `web/js/apps/fortune.js`:

```js
/* fortune.js — Fortune 98: click the orb, receive era-appropriate wisdom. */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.fortune = {
  name: "Fortune 98",       // shown in Add/Remove Programs etc.
  icon: "help",             // any existing icon name (see §5 for your own)
  single: true,             // only one instance; relaunch focuses it

  launch() {
    const FORTUNES = [
      "You will receive unexpected mail. It is a chain letter.",
      "A download in your future will reach 99% and think about it.",
      "Someone will pick up the phone during your best online moment.",
      "Great fortune awaits after just one more defrag."
    ];

    const win = WM.create({
      title: "Fortune 98", icon: "help", appId: "fortune",
      width: 340, height: 220, resizable: false, center: true,
      statusbar: [{ text: "" }],
      menus: [
        { label: "Orb", items: () => [
          { label: "Consult", accel: "F5", click: consult },
          "-",
          { label: "Exit", click: () => win.close() }
        ]},
        { label: "Help", items: () => [
          { label: "About Fortune 98", click: () =>
            Dialogs.about("Fortune 98", "help", ["The orb sees all.", "The orb is 340 pixels wide."]) }
        ]}
      ]
    });

    const out = el("div", {
      style: "padding:18px 16px;font-size:12px;line-height:1.6;text-align:center;min-height:64px",
      text: W98.tr("The orb awaits your question.")
    });
    const btn = el("button", { class: "btn default", text: W98.tr("Consult the Orb") });
    btn.style.cssText = "display:block;margin:0 auto 14px";
    win.body.append(out, btn);

    let asked = Store.get("fortuneAsked", 0);      // persists across sessions
    function consult() {
      asked++; Store.set("fortuneAsked", asked);
      out.textContent = W98.tr(FORTUNES[(Math.random() * FORTUNES.length) | 0]);
      win.setStatus(0, W98.tr("Consultations: ") + asked);
      Sound.play("ding");
    }
    btn.addEventListener("click", consult);
    win.el.addEventListener("keydown", (e) => {
      if (e.key === "F5") { e.preventDefault(); consult(); }
    });

    return win;   // convention: launch() returns the window
  }
};
```

Then register the script in `web/index.html` next to the other apps —
**and bump the `?v=` number on every script line** (a single global version):

```html
<script src="js/apps/fortune.js?v=115"></script>
```

That's it. `W98.launch("fortune")` from the browser console proves it works.

### The window manager, briefly

`WM.create(opts)` accepts: `title`, `icon`, `appId`, `width`/`height`,
`minWidth`/`minHeight`, `resizable`, `maximizable`, `minimizable`, `center`,
`noTaskbar` (for dialogs), `statusbar` (array of `{text, width?}` cells),
`menus` (see the example — `items` is a function so menus can be dynamic),
and `onResize`. The returned `win` gives you `win.body` (append your UI here),
`win.el`, `win.setTitle()`, `win.setStatus(cellIndex, text)`, `win.close()`,
`win.focus()`, and `win.ctxMenu = () => [...]` for a right-click menu.
`WM.msgbox({title, icon, text, buttons})` returns a promise of the clicked label.

### House rules for the period look

- Build UI from the existing widget classes (`btn`, `field`, window chrome comes
  free). No frameworks, no external assets, no `fetch()` to third parties —
  the whole OS must keep working offline from local files.
- Pixel fonts, gray panels, sunken borders. When in doubt, copy a neighboring app.
- Wrap user-facing strings in `W98.tr("...")` and add translations to the
  dictionaries in `web/js/i18n-body.js` so the Traditional Chinese UI stays complete.
- Persist small state in `Store`, documents in `FS` (the virtual C: drive):
  `FS.writeFile("C:/My Documents/foo.txt", "text")`, `FS.readFile(path)`, `FS.list(dir)`.
- Sounds: `Sound.play("click" | "ding" | "error" | "warn" | "tada" | "startup" | "recycle")`.

## 4. Put it in the Start menu (and on the desktop)

The Start menu tree is the `startItems()` list in `web/js/taskbar.js` — add one line
in the right category:

```js
{ label: "Fortune 98", icon: "help", click: () => W98.launch("fortune") },
```

For a desktop shortcut, drop a `.lnk` into the virtual desktop once (e.g. in your
app file, guarded so it only happens on first run):

```js
if (!FS.exists(FS.DESKTOP + "/Fortune 98.lnk"))
  FS.writeFile(FS.DESKTOP + "/Fortune 98.lnk", "app:fortune");
```

## 5. Icons

The fastest path is reusing an existing name (`grep 'draws\.' web/js/iconart.js`
lists them all). For original artwork, add a draw function to the `draws` table
in `web/js/iconart.js` — you get a 32×32 canvas context and helpers (`rr`,
`vgrad`, `poly`) used by every other icon:

```js
draws.fortune = (x) => {
  x.fillStyle = vgrad(x, 4, 28, [[0, "#8080ff"], [1, "#000080"]]);
  x.beginPath(); x.arc(16, 16, 12, 0, 7); x.fill();
  x.fillStyle = "#fff"; x.fillRect(14, 10, 4, 8); x.fillRect(14, 20, 4, 3);
};
```

All artwork must be original — that is what keeps this repo distributable.

## 6. Teach BOB to use it (optional)

Autopilot's universal explorer already opens unfamiliar programs, wiggles their
controls and closes them politely. To include yours in that rotation, add its id
to `GENERIC_APPS` in `web/js/autopilot.js`. For a real skill (like the game
brains), follow the house pattern:

- **Eyes**: expose read-only state on the window before `return win;` —
  `win._fortune = { state: () => ({ asked }) };`
- **Hands**: BOB acts through the same DOM your user clicks — buttons, cards,
  key events — never by calling your internal functions to mutate state.
- Add an `act` function in `autopilot.js` and register it in `ACTIVITIES`.
- Verify with the built-in harness from the browser console:
  `await W98.Autopilot._solo("fortune", true)`.

## 7. Before you open a PR

- `node --check` every file you touched; load the dev server and click through
  your program (open, use, resize, close, reopen).
- Run the console smoke test — every app must still open cleanly:
  `Object.keys(W98.Apps).forEach(id => { const w = W98.Apps[id].launch(); if (w && !w.closed) w.close(true); })`
- Bump `?v=` in `index.html` once per PR.
- Both languages, no dead corners: if it has UI text, it has translations.
- Zero dependencies is a hard rule. So is original artwork and audio.
- Keep commit messages in the house voice: what changed, why, plainly.

---

# Modding 與貢獻指南

[English](#modding--contributing-guide) · **繁體中文**

這台機器裡的一切都是零相依的手寫 HTML/CSS/JS，而且每個程式就是一個檔案。
新增你自己的程式，設計上就是一個下午的工程。本指南走完整條路：跑起來、
寫一個應用程式、給它圖示、放進開始選單，以及（可選）教 BOB 使用它。

## 1. 在本機執行

兩種工作方式：

```bash
# A. 完整原生應用程式（Swift + WKWebView 外殼）
./build.sh && open "Windows 98.app"

# B. 更快的迭代：開發伺服器 + 瀏覽器
python3 devserver.py        # 在 http://localhost:8098 提供 web/
```

開發期間用開發伺服器比較舒服：改、重新整理、再改。少數原生橋接功能
（真實網頁抓取、PDF 渲染、匯出面板）只在真正的 app 裡有效 —— 其他一切，
包括你的新程式，在普通瀏覽器就能跑。

`http://localhost:8098/index.html?noboot=1` 可跳過開機流程。

## 2. 東西都在哪

| 路徑 | 內容 |
|---|---|
| `web/index.html` | 依序載入所有腳本，帶 `?v=N` 快取破壞參數 |
| `web/js/wm.js` | 視窗管理 — `WM.create()`、對話方塊、`WM.msgbox()` |
| `web/js/desktop.js` | 桌面圖示、`W98.launch()`、開啟方式、應用程式註冊表 |
| `web/js/taskbar.js` | 開始選單樹、工作列按鈕、系統匣、時鐘 |
| `web/js/fs.js` | 持久化虛擬 C: 磁碟（`FS.*`） |
| `web/js/store.js` | 迷你持久化 key-value 存放（`Store.get/set`） |
| `web/js/sound.js` | 時代音效（`Sound.play`） |
| `web/js/icons.js` + `iconart.js` | 程序化 32×32 圖示繪製 |
| `web/js/i18n.js` | 英文／繁體中文層（`W98.tr`） |
| `web/js/autopilot.js` | 幽靈使用者 BOB |
| `web/js/events.js` | 隨機時代事件（藍畫面、連鎖信…） |
| `web/js/apps/*.js` | 一個程式一個檔案 — 你的應用程式放這裡 |
| `native/main.swift` | macOS 外殼；很少需要動它 |

## 3. 寫一個程式

程式就是掛在 `W98.Apps` 上、帶 `launch()` 的物件。完整可用的範例
（存成 `web/js/apps/fortune.js`）請見上方英文版 §3 —— 程式碼本身就是共通語言。
重點回顧：

- `W98.Apps.fortune = { name, icon, single, launch() }` — `single: true`
  表示只允許一個實例，重複啟動會聚焦既有視窗。
- `launch()` 用 `WM.create(opts)` 建視窗、把 UI 塞進 `win.body`、
  最後 `return win;`（慣例）。
- 在 `web/index.html` 加一行
  `<script src="js/apps/fortune.js?v=115"></script>`，
  並**把所有腳本行的 `?v=` 一起加一號**（全域單一版本號）。
- 瀏覽器主控台執行 `W98.launch("fortune")` 驗證。

### 視窗管理速覽

`WM.create(opts)` 接受：`title`、`icon`、`appId`、`width`/`height`、
`minWidth`/`minHeight`、`resizable`、`maximizable`、`minimizable`、`center`、
`noTaskbar`（對話方塊用）、`statusbar`（`{text, width?}` 陣列）、
`menus`（`items` 是函式，選單可以動態）與 `onResize`。回傳的 `win` 提供
`win.body`、`win.el`、`win.setTitle()`、`win.setStatus(格索引, 文字)`、
`win.close()`、`win.focus()`，以及右鍵選單 `win.ctxMenu = () => [...]`。
`WM.msgbox({title, icon, text, buttons})` 回傳被點按鈕文字的 promise。

### 時代外觀的家規

- 用現成的元件 class（`btn`、`field`，視窗外框自動有）。不用框架、
  不用外部資源、不向第三方 `fetch()` —— 整個 OS 必須離線也能跑。
- 像素字型、灰色面板、內凹邊框。拿不準就抄隔壁的應用程式。
- 使用者可見字串包 `W98.tr("...")`，並到 `web/js/i18n-body.js`
  的字典補翻譯，讓繁中介面保持完整。
- 小狀態放 `Store`，文件放 `FS`（虛擬 C: 磁碟）：
  `FS.writeFile("C:/My Documents/foo.txt", "text")`、`FS.readFile(path)`、`FS.list(dir)`。
- 音效：`Sound.play("click" | "ding" | "error" | "warn" | "tada" | "startup" | "recycle")`。

## 4. 放進開始選單（和桌面）

開始選單樹在 `web/js/taskbar.js` 的 `startItems()` — 在正確分類加一行：

```js
{ label: "Fortune 98", icon: "help", click: () => W98.launch("fortune") },
```

桌面捷徑則是往虛擬桌面丟一個 `.lnk`（例如在你的應用程式檔裡，
加上只在第一次執行的判斷）：

```js
if (!FS.exists(FS.DESKTOP + "/Fortune 98.lnk"))
  FS.writeFile(FS.DESKTOP + "/Fortune 98.lnk", "app:fortune");
```

## 5. 圖示

最快的路是重用現有名稱（`grep 'draws\.' web/js/iconart.js` 可列出全部）。
要畫原創圖示，就到 `web/js/iconart.js` 的 `draws` 表加一個繪製函式 ——
你會拿到 32×32 的 canvas context 和所有圖示共用的輔助函式（`rr`、`vgrad`、
`poly`），範例見英文版 §5。

**所有圖與音效必須原創** —— 這是這個程式庫能公開發佈的前提。

## 6. 教 BOB 使用它（可選）

Autopilot 的通用探索器本來就會打開陌生程式、撥弄控制項、然後禮貌地關掉。
要把你的程式加入輪替，把 id 加進 `web/js/autopilot.js` 的 `GENERIC_APPS`。
想寫真正的技能（像遊戲大腦那樣），照家規來：

- **眼睛**：在 `return win;` 前掛唯讀狀態 ——
  `win._fortune = { state: () => ({ asked }) };`
- **手**：BOB 只透過使用者也在點的 DOM 行動 —— 按鈕、卡牌、鍵盤事件 ——
  絕不直接呼叫你的內部函式改狀態。
- 在 `autopilot.js` 加 `act` 函式並註冊進 `ACTIVITIES`。
- 用內建測試工具驗證（瀏覽器主控台）：
  `await W98.Autopilot._solo("fortune", true)`。

## 7. 開 PR 之前

- 動過的檔案跑 `node --check`；開發伺服器點一輪你的程式
  （開、用、縮放、關、重開）。
- 跑主控台冒煙測試 —— 所有應用程式都要能乾淨開啟：
  `Object.keys(W98.Apps).forEach(id => { const w = W98.Apps[id].launch(); if (w && !w.closed) w.close(true); })`
- 每個 PR 把 `index.html` 的 `?v=` 加一號。
- 雙語、無死角：有 UI 文字就要有翻譯。
- 零相依是硬規則。原創圖與音效也是。
- Commit 訊息照家風：改了什麼、為什麼，說清楚就好。

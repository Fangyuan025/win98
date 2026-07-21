# Windows 98 — Nostalgia Edition for macOS

A fully interactive, native macOS recreation of the Windows 98 desktop experience.
Everything you can see, you can click — no dead links, no props.

## Run it

Double-click **`Windows 98.app`** (already built), or rebuild from source:

```bash
./build.sh
open "Windows 98.app"
```

Requirements to rebuild: Xcode Command Line Tools (swiftc), Python 3. No third-party dependencies.

## What's inside

| Layer | Tech |
|---|---|
| Shell | Swift + AppKit + WKWebView (`native/main.swift`) |
| OS recreation | Hand-written HTML/CSS/JS (`web/`), zero frameworks |
| Persistence | JSON state bridged to `~/Library/Application Support/Win98/state.json` |
| Art & sound | Original hand-drawn pixel icons, synthesized sounds (no Microsoft assets) |

## Feature tour

- **Boot & shutdown** — BIOS POST, Windows 98 splash, shutdown dialog with Stand by /
  Shut down / Restart / MS-DOS mode, and "It's now safe to turn off your computer."
- **Desktop** — draggable icons, marquee selection, rename (F2), Recycle Bin with
  restore/empty, New Folder/Text/Bitmap, wallpapers, 11 color schemes, 4 screensavers.
- **Window manager** — drag, 8-way resize, minimize/maximize, system menu,
  double-click-titlebar-icon to close, cascade/tile from the taskbar, Ctrl+Alt+Del.
- **Start menu** — full cascading menus, Documents history, Find, Run…, Log Off.
- **A real file system** — virtual C: drive shared by Explorer, Notepad, Paint and the
  MS-DOS Prompt; files persist between launches.
- **Accessories** — Notepad, WordPad (rich text: fonts, styles, color, alignment,
  bullets, ruler), Paint (11 tools, undo, selections, save-as-wallpaper), Calculator,
  Character Map (copies real glyphs).
- **Office 98** — Word (the WordPad engine), a working **Spreadsheet** with real A1-style
  formulas (`=SUM(A1:A10)`, `=AVERAGE`, `=B2*C2`, error values like `#DIV/0!`/`#NAME?`),
  and a **Presentation** app with a thumbnail strip and full-screen slide show.
- **Entertainment** — Media Player (synthesized tune + live visualizer), CD Player
  (a disc of synthesized classics with a green LCD).
- **Games** — Minesweeper (chording, best times), Solitaire (draw 1/3, bouncing-card win).
- **System** — MS-DOS Prompt (20+ working commands), Internet Explorer (a five-site
  offline 1998 web with a search engine and a signable guestbook), Windows Explorer,
  Control Panel (Display / Date-Time / Sounds / System), Help, Registry Editor.

Every icon is hand-rendered original pixel art drawn on an HTML canvas — folders,
the beige monitor, the blue globe, the office document tiles, the waving Start flag —
sized to look right at 16px in menus and 32px on the desktop.

## Branding

The app ships with an original, stylized rendition of the era's waving-flag mark
(drawn procedurally, dithered trail and all). If you own the official artwork and
want to see it instead, drop your files into
`~/Library/Application Support/Win98/Branding/`:

- `flag.png` — used on the boot screen, About dialogs, System Properties and the
  Flying Windows screensaver. Backgrounds are cleaned automatically: near-white and
  light-gray pixels (including baked-in "transparency" checkerboards from download
  sites) become transparent, and the image is cropped to its content.
- `flag-small.png` — optional 16px version for the Start button. Without it the
  Start button keeps the built-in mini flag (a full logo squeezed to 16px would
  be an unreadable smudge).

Restart the app after adding files. For the browser dev build use `web/branding/`.
To change the Dock icon, replace `native/icon_1024.png` (1024×1024) and run
`./build.sh`. No third-party artwork ships with the app itself.

## Sounds

The built-in sounds are original compositions from a layered synthesizer (warm pad
swells with glass-bell sparkle for startup, FM bells for ding/chimes, chord stabs,
a hall-ambience delay network) written to evoke the era's character.

**Want the real thing?** If you own the original media files, drop your .wav files into
`~/Library/Application Support/Win98/Sounds/` (Control Panel → Sounds → Schemes →
"Open Sounds Folder" takes you there) and restart. Recognized names include
`Windows 98 Startup.wav`, `The Microsoft Sound.wav`, `ding.wav`, `chord.wav`,
`tada.wav`, `chimes.wav`, `exclamation.wav`, `question.wav`, `asterisk.wav`,
`shutdown.wav`, and `Empty Recycle Bin.wav` (mp3/m4a/aiff also work). For the browser
dev build, use `web/sounds/` instead. No copyrighted audio ships with the app.

## Notes

This is an original tribute. All icons are hand-drawn pixel art, all sounds are
synthesized originals, and the built-in "internet" is parody content. No Microsoft
code or artwork is included.

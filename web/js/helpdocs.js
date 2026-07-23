/* helpdocs.js — the complete Windows Help library: every feature, documented.
   Entries whose value is a plain string render as section headers in the TOC. */
"use strict";
W98.HelpTopics = {

  _s1: "GETTING STARTED",

  tour: ["Welcome — a quick tour", `
    <h2>Welcome to Windows 98</h2>
    <p>This is a fully interactive recreation of a lived-in 1998 PC, running as a native app on your Mac.
    Nothing here is decoration: <b>61 programs</b>, 14 games, a tiny internet, a printer, a network,
    and an AI assistant all actually work, and everything you do persists between sessions.</p>
    <ul>
      <li><b>Start menu</b> — click <b>Start</b>, or press <b>Ctrl+Esc</b>. Every entry launches something real.</li>
      <li><b>Windows</b> — drag title bars, resize edges, double-click a title bar to maximize,
        double-click its little icon to close. <b>Alt+Tab</b> switches windows the classic way.</li>
      <li><b>Right-click everything</b> — desktop, files, text boxes, web pages, game boards, chat bubbles.
        If it exists, it probably has a menu.</li>
      <li><b>Files are real</b> — and you can drag files in from your Mac, or export any file back out
        (see "Import &amp; export files").</li>
      <li><b>Shut down properly.</b> You remember why.</li>
    </ul>
    <p>Good first stops: Minesweeper, the MS-DOS Prompt (type <b>HELP</b>), Internet Explorer,
    and Claude Desktop 98 on the desktop.</p>`],

  shortcuts: ["Keyboard shortcuts", `
    <h2>Keyboard shortcuts</h2>
    <p><b>System-wide</b></p>
    <ul>
      <li><b>Alt+Tab</b> — window switcher (hold Alt, tap Tab to cycle, Shift+Tab reverses, Esc cancels)</li>
      <li><b>Ctrl+Esc</b> — open the Start menu</li>
      <li><b>Ctrl+Alt+Delete</b> — Close Program dialog. Twice: you know what happens.</li>
    </ul>
    <p><b>In editors</b> (Notepad, WordPad, most text fields)</p>
    <ul>
      <li><b>Ctrl+S</b> save · <b>Ctrl+P</b> print · <b>Ctrl+F</b> find · <b>F3</b> find next · <b>Ctrl+H</b> replace (Notepad)</li>
      <li><b>Ctrl+Z / X / C / V / A</b> — undo, cut, copy, paste, select all (also on every right-click menu)</li>
      <li><b>F5</b> — insert time/date (Notepad)</li>
    </ul>
    <p><b>In games</b></p>
    <ul>
      <li><b>F2</b> — new game, everywhere (also on every game's right-click menu)</li>
      <li>Pinball: <b>Space</b> charges the plunger, <b>Z</b> and <b>/</b> flip</li>
      <li>CORRIDOR 98: <b>arrows/WASD</b> move, <b>Space</b> fires</li>
      <li>Composer 98: <b>Space</b> play/stop</li>
      <li>MS-DOS games: <b>Esc</b> always returns to the prompt</li>
    </ul>`],

  importexport: ["Import & export files (Mac ⇄ 98)", `
    <h2>Import &amp; export files</h2>
    <p><b>Importing from your Mac:</b> drag any file from Finder onto this window.
    Drop it on the desktop and it lands in the Desktop folder; drop it into an open Explorer
    window and it lands in that folder. A summary dialog lists what was imported.</p>
    <ul>
      <li><b>Text files</b> (.txt, .md, .csv, .html…) — open and edit them in Notepad.</li>
      <li><b>Pictures</b> (.png, .jpg, .gif, .bmp…) — double-click to open in Paint; goo them in PhotoGoo;
        set them as wallpaper.</li>
      <li><b>Audio</b> (.mp3, .wav, .m4a…) — double-click for the mini audio player. Full fidelity,
        which is technically cheating for 1998.</li>
      <li><b>Office documents</b> (.docx, .doc, .xlsx, .pptx, .pdf) — double-click to open:
        Word files convert to WordPad text, spreadsheets open in the Spreadsheet, presentations
        become an outline, and PDFs open in Acrobat Reader 98. The formatting stays on the Mac.</li>
      <li><b>Video</b> (.mp4, .mov, .m4v, .webm…) — drops straight into <b>Media Player 98</b>
        and plays immediately. No size limit: movies never touch the virtual disk.</li>
      <li>Limits: 12 files per drop, 4 MB per file (very un-1998 beyond that).</li>
    </ul>
    <p><b>Exporting to your Mac:</b> right-click any file → <b>Export to Mac...</b> — a real macOS
    save panel appears. Works for anything: your Paint masterpieces, Composer songs, files you imported,
    even book_report_FINAL_v2.doc.</p>`],

  customassets: ["Using original sounds & branding", `
    <h2>Custom sounds and branding</h2>
    <p>Out of the box this recreation uses original, synthesized stand-ins. If you own the real files,
    drop them in and the system uses yours automatically:</p>
    <ul>
      <li><b>Sounds</b> — put .wav files in <b>~/Library/Application Support/Win98/Sounds/</b>
        (Control Panel → Sounds has a "reveal folder" button). Classic file names are recognized
        (ding.wav, tada.wav, "The Microsoft Sound.wav"…).</li>
      <li><b>Branding</b> — put <b>flag.png</b> (and optionally a boot logo) in
        <b>~/Library/Application Support/Win98/Branding/</b>. White or checkerboard backgrounds are
        keyed out automatically.</li>
    </ul>
    <p>Restart the app after adding files, or use the rescan button in Control Panel → Sounds.</p>`],

  _s2: "DESKTOP & SYSTEM",

  desktop: ["Desktop, wallpaper & themes", `
    <h2>The desktop</h2>
    <ul>
      <li><b>Right-click the desktop</b> — arrange icons, create folders and files, change Properties.</li>
      <li><b>Display Properties</b> — wallpaper (tile/center/stretch, or one you drew in Paint),
        appearance schemes, screen savers — and a <b>Settings</b> tab with 640×480/800×600 screen areas and 16/256-color modes that apply instantly.</li>
      <li><b>Screen savers</b> — 3D Maze, Plasma, Starfield, Mystify, Flying Windows, Pipes,
        Scrolling Marquee. Set a wait time and they engage on idle; move the mouse to return.</li>
      <li><b>Desktop Themes</b> — coordinated color schemes from the Control Panel.</li>
      <li><b>Active Desktop</b> — Settings → Active Desktop → View As Web Page toggles the
        <b>Channel Bar</b>: one-click access to the Web Times, Weather 98, GameZone and more.</li>
    </ul>`],

  taskbar: ["Taskbar, tray & Alt+Tab", `
    <h2>Taskbar and system tray</h2>
    <ul>
      <li><b>Quick Launch</b> — IE, Mail, and Show Desktop (minimizes everything).</li>
      <li><b>Task buttons</b> — click to focus/minimize; right-click for Restore/Minimize/Close.</li>
      <li><b>Taskbar right-click</b> — Cascade, Tile Horizontally/Vertically, Minimize All, Properties.</li>
      <li><b>Tray volume</b> — click the speaker for a slider and Mute; double-click opens the mixer.</li>
      <li><b>Tray clock</b> — hover for the date, double-click to set Date/Time.</li>
      <li><b>Mail envelope</b> — appears in the tray when unread mail is waiting.</li>
      <li><b>Printer</b> — appears while jobs are printing; double-click for the queue.</li>
      <li><b>Alt+Tab</b> — the classic switcher. <b>Ctrl+Esc</b> opens Start without the mouse.</li>
    </ul>`],

  organizer: ["Calendar 98 & Sticky Notes", `
    <h2>Calendar 98</h2>
    <ul>
      <li>Month grid with today highlighted. <b>Double-click any day</b> to add an event.</li>
      <li>Days with events show a marker bar; select a day to list them, × removes one.</li>
      <li>Events persist forever, like regret. Find it under Accessories.</li>
    </ul>
    <h2>Sticky Notes</h2>
    <ul>
      <li>Accessories → Sticky Notes spawns a yellow note. Type on it; it saves as you type.</li>
      <li>Drag it anywhere — position is remembered. Notes <b>reappear after a reboot</b>.</li>
      <li>Closing a note throws it away. That is what stickies are for.</li>
    </ul>`],

  printing: ["Printing", `
    <h2>Printing</h2>
    <p>Press <b>Ctrl+P</b> (or File → Print) in Notepad, WordPad, Paint or the Spreadsheet.</p>
    <ul>
      <li>The Print dialog offers printers, copies and page ranges. Jobs go to a real
        <b>spooler queue</b> — a printer icon appears in the tray while printing (listen for the inkjet).</li>
      <li>Control Panel → Printers (or double-click the tray printer) opens the queue:
        pause printing, purge jobs, or double-click a job to cancel it.</li>
      <li>Never choose "The Office Printer". It is always jammed. This is documented behavior.</li>
      <li><b>The machine is alive</b> — rarely, and only after you have settled in, 1998 happens:
        a chain letter arrives, a popup ad interrupts, someone picks up the phone during a download,
        Windows finds hardware that does not exist, and once in a long while — the blue screen
        (press any key; nothing is lost). Turn it all off in System Properties if your nerves prefer 2026.</li>
    </ul>`],

  addremove: ["Add/Remove Programs & Windows Update", `
    <h2>Add/Remove Programs</h2>
    <p>Control Panel → Add/Remove Programs lists ten optional programs (games, MegaAmp, Pal…).</p>
    <ul>
      <li>Select one and click <b>Add/Remove</b> — it is genuinely uninstalled: files deleted,
        Start menu blocked, open windows closed.</li>
      <li>Select it again for <b>Reinstall</b> — everything comes back. The CD is metaphorical
        but always in the drive.</li>
    </ul>
    <h2>Windows Update</h2>
    <p>Start → Windows Update opens the update site. <b>Scan</b> finds three updates
    (including Q243199, the Vibes Update). <b>Install</b> downloads them with a progress bar and
    recommends a restart — which really restarts. Afterwards you are running 4.10.1998 + SP-98.</p>`],

  systools: ["System tools", `
    <h2>System tools</h2>
    <ul>
      <li><b>Disk Defragmenter</b> — watch the little blocks tidy themselves. Deeply calming.</li>
      <li><b>ScanDisk</b> — checks the virtual disk and finds it emotionally stable.</li>
      <li><b>VirusScan 98</b> — scans everything, quarantines nothing, reassures completely.</li>
      <li><b>Registry Editor</b> — browse a real registry tree reflecting live settings.</li>
      <li><b>Drive properties</b> — My Computer → right-click (C:) → Properties for the classic
        used/free <b>pie chart</b>.</li>
      <li><b>System Properties</b> — right-click My Computer. General, Device Manager, Performance.</li>
      <li><b>Clipboard Viewer</b> and <b>Character Map</b> — under Accessories.</li>
    </ul>`],

  accessibility: ["Accessibility", `
    <h2>Accessibility</h2>
    <ul>
      <li><b>Magnifier</b> — a window that magnifies whatever the mouse is near (2x–6x).
        Game canvases are mirrored at real pixels; a red crosshair marks the pointer.</li>
      <li><b>On-Screen Keyboard</b> — a full clickable QWERTY board. Click into any text box first;
        keys type into it without stealing focus. Shift and Caps work; Shift releases after one key,
        as tradition demands.</li>
    </ul>
    <p>Both live under Programs → Accessories → Accessibility.</p>`],

  network: ["Network Neighborhood & DOS networking", `
    <h2>The network</h2>
    <p>Double-click <b>Network Neighborhood</b>: workgroup HOMENET has three machines.</p>
    <ul>
      <li><b>Dave-pc</b> — browse his <b>mp3z</b> share (double-click a track to play it) and his
        Quake demos. The fan is loud on purpose.</li>
      <li><b>Family-pc</b> — shared documents (the recipes are real) and <b>The Office Printer</b>,
        which opens the print queue.</li>
      <li><b>Moms-office</b> — quarterly reports, plus a <b>PRIVATE</b> folder. It is password
        protected. It means it. (Do not try "password". She will be disappointed.)</li>
    </ul>
    <h2>DOS networking</h2>
    <p>In the MS-DOS Prompt: <b>PING dave-pc</b> (or family-pc, moms-office, fangyuanlin.com),
    <b>IPCONFIG</b>, <b>TRACERT</b> (mind the time tunnel at hop 5), <b>NETSTAT</b>.</p>`],

  claude: ["Claude Desktop 98", `
    <h2>Claude Desktop 98</h2>
    <p>An AI assistant, back-ported 27 years. Fully local — the cloud is a weather phenomenon.
    Launch it from the desktop, or type <b>claude</b> in Run.</p>
    <p><b>Things it can actually do</b> (type these):</p>
    <ul>
      <li><b>"open paint"</b> / <b>"play pinball"</b> — launches any of the 61 programs by name</li>
      <li><b>"what is 1998 * 12"</b> — real math, computed locally on your 486</li>
      <li><b>"create a note called ideas.txt saying buy more RAM"</b> — writes real files;
        <b>"read ideas.txt"</b> reads them back; <b>"what's in my documents"</b> lists the folder</li>
      <li><b>"search for cats"</b> — opens AltaVibe results in IE</li>
      <li><b>"play some music"</b>, <b>"call mom"</b>, <b>"dial the BBS"</b>, <b>"start the screensaver"</b>,
        <b>"print a test page"</b>, <b>"empty the recycle bin"</b> (asks first)</li>
      <li><b>"what's my IP"</b>, <b>"who's online"</b>, <b>"who am I"</b>, <b>"open my website"</b></li>
      <li><b>"tell me a joke"</b> / <b>"a fun fact"</b> / <b>"write a haiku about modems"</b> —
        then just say <b>"another"</b></li>
    </ul>
    <p>Conversations are saved in the sidebar. Answers stream at 90 characters/second — a proud 28.8k.
    Right-click any bubble to copy it. Claude can make mistakes; in 1998, everything did.</p>`],

  _s3: "THE INTERNET",

  ie: ["Internet Explorer & the 1998 web", `
    <h2>Internet Explorer</h2>
    <p>A museum of the 1998 internet — 19 sites, all interactive.</p>\n    <p><b>You must dial in first.</b> Opening a page offline shows the Dial-up Connection prompt —\n    Connect (the modem sings) or Work Offline (the page politely refuses). Disconnect any time via the\n    tray icon. While the BBS holds the phone line, the internet cannot; the reverse is also true.\n    It is one line. It was always one line.</p>
    <ul>
      <li><b>Start page</b> (welcome98.com) — channel links and the Featured Site of the Day.</li>
      <li><b>AltaVibe</b> — a search engine that totally finds things™. It indexes every site.</li>
      <li><b>fangyuanlin.com</b> — the featured personal site: terminal aesthetic, EN/FR toggle,
        a visitor counter, and a guest essay that arrived by modem from 2026. Also
        <b>chaty.ca</b> (launching in ~27 years) and <b>/blog/</b>.</li>
      <li><b>CompuMart</b> — a shopping cart that really checks out. Delivery: 6–8 weeks.</li>
      <li><b>StarDust's homepage</b> — sign the guestbook; visit <b>Pixel the cat's page</b>
        (pet him, feed him treats, make him chase the red dot).</li>
      <li><b>The Web Times, Weather 98, MIDI Jukebox, GameZone</b> (with the Hall of Fame reading
        your real high scores), <b>Y2K Watch</b> (live countdown), the <b>webring</b>, and more.</li>
      <li><b>Favorites</b> — add pages, find them in the menu and the Start menu.</li>
      <li><b>Go → History</b> — your last 15 pages, remembered between sessions.</li>
      <li><b>The real web, 98-ified</b> — type any modern address (en.wikipedia.org, example.com,
        a news site) and IE fetches it, strips the scripts and styling, and re-renders it in gray
        serif with blue underlined links. It is the today-internet as 1998 would have seen it.
        Sites built entirely from JavaScript, or that refuse to be fetched, fail gracefully.
        Built-in 1998 sites always take the built-in route.</li>
      <li><b>Streaming video</b> — YouTube, Bilibili, Vimeo or Dailymotion links open in
        <b>Media Player 98</b> (Programs menu), which plays the real video inside proper
        1998 chrome. Every file type gets its own player. That is the law.</li>
      <li><b>Right-click a page</b> — Back, Forward, Refresh, Select All, View Source (real source,
        opened in Notepad), Properties.</li>
    </ul>`],

  mail: ["Internet Mail", `
    <h2>Internet Mail</h2>
    <ul>
      <li>Compose (Ctrl+N), reply, delete; folders for Inbox, Sent and Deleted.</li>
      <li><b>Send &amp; Receive</b> connects at a dignified pace. Sent mail sometimes earns a reply —
        correspondents include Mom (all caps) and the Windows 98 Fan Club.</li>
      <li>Unread mail puts an envelope in the system tray.</li>
      <li>The Address Book (Accessories) stores contacts; its <b>Send Mail</b> button pre-fills
        the recipient. New mail arrives occasionally. Aunt Carol still awaits your reply.</li>
    </ul>`],

  chat: ["Pal Messenger, IRC & NetMeet", `
    <h2>Pal Messenger</h2>
    <p>The instant-messaging experience of 1998. Double-click a buddy to chat — CoolDave2000 has
    Minesweeper opinions, Mom found the caps lock. Buddies wander on and offline. "Uh oh!"</p>
    <h2>ChatterBox IRC</h2>
    <p>Three channels (#lobby, #games, #y2k) with regulars who chat on their own schedule.
    Commands: <b>/nick</b>, <b>/me</b>, <b>/join</b>, <b>/list</b>, <b>/slap</b> (large trout included).
    Mention pizza and see what happens.</p>
    <h2>NetMeet 98</h2>
    <p>Video calls at four frames per second. Call Mom, CoolDave2000, or UncleRick (his computer is
    making the noise again). The video is procedural, the audio is interpretive, and your own camera
    was never detected — period accurate.</p>`],

  bbs: ["HyperTerminal & the BBS", `
    <h2>The Midnight Tower BBS</h2>
    <p>Open HyperTerminal (Accessories → Communications) and File → Connect to dial 555-TOWR.</p>
    <ul>
      <li><b>[M]essage boards</b> — read GENERAL, SCIFI and the TRADING POST; press <b>P</b> to post
        (your posts persist).</li>
      <li><b>[F]ile area</b> — download MODEM_FAQ.TXT and friends at authentic 28.8k; files land in
        My Documents. SECRETS.ZIP requires the sysop's cat's name. Nobody has ever guessed it.</li>
      <li><b>[D]oor games</b> — <b>Legend of the Crimson Dragon</b>: fight in the forest, rest at
        the inn, level up. Progress is saved at the tower.</li>
      <li><b>[W]ho's online</b> — wanda_wildcat has been reading SCIFI for 34 minutes.</li>
    </ul>`],

  pagecrafter: ["PageCrafter — build your homepage", `
    <h2>PageCrafter Express</h2>
    <p>Build a GeoSities homepage with zero HTML: title, tagline, about-me, four backgrounds,
    five text colors, marquee text, a visitor counter, the Under Construction banner, and
    auto-play MIDI (rude but traditional). The preview updates live.</p>
    <p>Click <b>Publish!</b> and your page is genuinely live at
    <b>members.geosities.com/~you/</b> — visit it in IE, find it in AltaVibe, and note that your
    visitor counter really increments. StarDust links to you as her neighbor.</p>`],

  _s4: "MUSIC, PICTURES & SHOWS",

  music: ["Music & audio", `
    <h2>Music &amp; audio</h2>
    <ul>
      <li><b>MegaAmp</b> — the skinned music player: chiptune tracks, spectrum visualizer, playlist.
        Dave's network mp3z open here too.</li>
      <li><b>Composer 98</b> — write your own music: four tracks (lead, bass, bell, drums) ×
        sixteen steps. Click cells to place notes, Space to play, save as .trk files
        (try <b>first_beat.trk</b> in My Documents). Double-clicking a .trk opens it here.</li>
      <li><b>SurrealPlayer G2</b> — streaming radio over a simulated 28.8k line. The buffering
        sometimes goes backwards. It always rebuffers eventually. This is the experience.</li>
      <li><b>CD Player &amp; Media Player</b> — classic transport controls.</li>
      <li><b>Sound Recorder</b> — record with your Mac's mic, see the waveform, save it.</li>
      <li><b>Volume</b> — tray speaker icon → slider; Control Panel → Sounds assigns event sounds.</li>
    </ul>`],

  graphics: ["Paint & PhotoGoo", `
    <h2>Paint</h2>
    <ul>
      <li>Pencil, brush, airbrush, shapes, flood fill, text, and selection (move regions around).</li>
      <li>Left button paints foreground color, right button background — like the real thing.</li>
      <li>Image → Flip/Rotate/Attributes work. File → Set As Wallpaper (tile/center/stretch).</li>
      <li>Open imported photos from your Mac; save as .bmp/.png; print with Ctrl+P.</li>
    </ul>
    <h2>PhotoGoo</h2>
    <p>The face-warping toy. Four brushes — <b>Smear</b> (drag), <b>Bulge</b>, <b>Pinch</b>,
    <b>Twirl</b> (click or drag) — plus Undo All when you have gone too far. Open any picture
    (including imports) or use the sample face, then File → Save to My Pictures for posterity.</p>`],

  megademo: ["MEGADEMO 98 & screensavers", `
    <h2>MEGADEMO 98</h2>
    <p>A demoscene production by The Beige Collective (Accessories → Entertainment). Four parts —
    plasma, rotozoom, sine scroller with copper bars, and starfield credits — with chiptune
    accompaniment. Click the canvas to skip parts; the FPS counter is reported optimistically.</p>
    <h2>Screen savers</h2>
    <p>Display Properties → Screen Saver: <b>3D Maze</b> (the one everyone watched instead of
    working), <b>Plasma</b>, Starfield, Mystify, Flying Windows, Pipes, Scrolling Marquee.
    Preview instantly or set an idle timer.</p>`],

  tvpet: ["TV98 & DeskPet 98", `
    <h2>TV98</h2>
    <p>A television for your desktop (Accessories → Entertainment). Five channels on the
    remote: snow, NEWS 3 (live anchor + ticker), the WEATHER channel, SHOP-8 (call now),
    and THE DUCK HOUR. Authentic static between channels. The power button works;
    the remote can finally never be lost.</p>
    <h2>DeskPet 98</h2>
    <p>A keychain creature for your desktop. Double-click the egg, name it, and keep it
    alive: <b>Feed</b>, <b>Play</b>, <b>Sleep</b> and <b>Clean</b> (it will need cleaning).
    Stats decay in real time — even while the app is closed — and it grows through three
    life stages over the days. Neglect is remembered. The crown must be earned.</p>`],

  _s5: "WRITING & OFFICE",

  notepad: ["Notepad", `
    <h2>Notepad</h2>
    <ul>
      <li>File → Save writes real files; Ctrl+P prints to the spooler.</li>
      <li>Edit → Word Wrap toggles wrapping; F5 inserts the time and date.</li>
      <li>Search → Find (Ctrl+F), F3 for next, <b>Replace (Ctrl+H)</b> with Replace All.</li>
      <li>The status bar shows the real <b>Ln, Col</b> as you move.</li>
      <li>Right-click the text for the classic edit menu.</li>
    </ul>`],

  wordpad: ["WordPad & Pixel", `
    <h2>WordPad</h2>
    <ul>
      <li>Rich text: bold, italic, underline, fonts, sizes, colors, alignment, bullets.</li>
      <li>Saves .doc files to the virtual drive; Ctrl+P prints; Print Preview tells the truth.</li>
      <li>Insert → Date and Time; Format → Font opens the classic dialog.</li>
    </ul>
    <h2>Pixel the Assistant</h2>
    <p>An orange cat lives in the corner of WordPad. He blinks, offers era-appropriate writing tips,
    and reacts when you type certain things — try starting a letter with <b>"Dear"</b>, or typing
    <b>resume</b>, <b>once upon a time</b>, or <b>pizza</b>. Click him for a tip (and a meow).
    The × hides him; Help → Pixel the Assistant brings him back. He remembers.</p>`],

  spreadsheet: ["Spreadsheet (Excel 98)", `
    <h2>Spreadsheet</h2>
    <ul>
      <li>Real formulas: <b>=A1+B2</b>, <b>=SUM(B4:B7)</b>, <b>=AVG</b>, <b>=MIN/MAX</b>,
        cell references recalculate live.</li>
      <li>Click a cell and type; Enter commits; arrow keys navigate; the formula bar edits.</li>
      <li>Saves .xls files (see Budget.xls and Moms-office's Q3 report on the network).</li>
      <li>Ctrl+P prints the sheet to the spooler.</li>
    </ul>`],

  office: ["Word & PowerPoint", `
    <h2>Office 98</h2>
    <ul>
      <li><b>Word</b> — the big sibling of WordPad with page layout and the full format bar.</li>
      <li><b>PowerPoint</b> — build slides, reorder them, and present full-screen (arrow keys advance;
        every deck is improved by the wipe transition).</li>
      <li>Both save real files; find them in Program Files → Office 98.</li>
    </ul>`],

  _s6: "GAMES",

  games: ["Games — where everything is", `
    <h2>The games shelf</h2>
    <p>Start → Programs → Accessories → Games. Fourteen in total:</p>
    <ul>
      <li><b>Cards</b> — Solitaire, FreeCell, Hearts, Spider Solitaire (1/2/4 suits)</li>
      <li><b>Classics</b> — Minesweeper, Star Pilot Pinball</li>
      <li><b>Arcade</b> — Powder Hill (ski), WallBall, Worm 98, Stackz</li>
      <li><b>3D</b> — CORRIDOR 98 (on the desktop)</li>
      <li><b>MS-DOS</b> — SNAKE, GORILLA, and whatever you write in QBASIC</li>
    </ul>
    <p>Every game: <b>F2</b> for a new game, right-click for a menu, high scores saved forever.
    The GameZone site's Hall of Fame reads your real records.</p>`],

  minesweeper: ["Minesweeper", `
    <h2>Minesweeper</h2>
    <ul>
      <li>Left-click reveals; the number counts adjacent mines. Right-click flags; again for "?".</li>
      <li><b>Chord</b>: click a satisfied number (or middle-click / both buttons) to open all its
        neighbors at once. CoolDave2000 swears by it. He is right.</li>
      <li>Your first click is never a mine. Beginner/Intermediate/Expert plus Custom;
        best times are kept per difficulty.</li>
    </ul>`],

  solitaire: ["Solitaire", `
    <h2>Solitaire</h2>
    <ul>
      <li>Klondike: build down alternating colors; foundations build up by suit.</li>
      <li><b>Double-click or right-click</b> a card to send it to a foundation automatically.</li>
      <li>Game → Options: draw-one or draw-three. Game → Deck picks a card back.</li>
      <li>Win for the bouncing cards. You know the ones.</li>
    </ul>`],

  cards: ["FreeCell & Hearts", `
    <h2>FreeCell</h2>
    <ul>
      <li>All cards face up; four free cells, four foundations. Numbered deals like the original —
        Game → Select Game replays a specific number.</li>
      <li>Moves auto-size to your free cells. Statistically, every deal is winnable. Statistically.</li>
    </ul>
    <h2>Hearts</h2>
    <ul>
      <li>Avoid hearts (1 point each) and the Queen of Spades (13). Lowest score wins at 100.</li>
      <li>Pass three cards each round; watch for a shoot-the-moon from Pauline.</li>
    </ul>`],

  pinball: ["Star Pilot Pinball", `
    <h2>Star Pilot Pinball</h2>
    <ul>
      <li>Hold <b>Space</b> to charge the plunger, release to launch. <b>Z</b> and <b>/</b> (or M)
        flip; clicking the table's left/right half also flips.</li>
      <li>Bumpers 150, slingshots 50, star gates 50 — and hitting a gate <b>lights it</b>.</li>
      <li><b>Light all three gates for MULTIBALL</b>: +5000 and three balls at once. Extra balls
        drain without costing a life.</li>
      <li>Three balls per mission; the high score survives reboots, pilot.</li>
    </ul>`],

  arcade: ["Powder Hill, WallBall, Worm & Stackz", `
    <h2>Powder Hill</h2>
    <p>Arrows steer, Down tucks for speed, ramps give style points, dogs are friends. The slope gets
    denser the deeper you go — and the local legend about the 2000&nbsp;m mark is accurate, and it
    gets hungrier the longer you outrun it.</p>
    <h2>WallBall</h2>
    <p>Move the paddle with the mouse, break the wall, keep the ball alive. Precision hitboxes,
    no cheap deaths.</p>
    <h2>Worm 98</h2>
    <p>Arrows turn, eat the food, don't eat yourself. One turn per tick — no accidental reversals.</p>
    <h2>Stackz</h2>
    <p>Falling blocks: arrows move/rotate (with wall kicks), Down soft-drops, <b>Space slams</b>.
    Ghost piece shows the landing spot. Four lines at once is worth 1200 × level.</p>`],

  corridor: ["CORRIDOR 98", `
    <h2>CORRIDOR 98</h2>
    <p>A software-rendered shooter. Something is loose in the maintenance tunnels.</p>
    <ul>
      <li><b>Arrows / WASD</b> move and turn (A/D strafe); <b>Space</b>, Ctrl or a mouse click fires.</li>
      <li>Green goo monsters chase on sight and bite up close. Do not accept the hug.</li>
      <li>Medkits +25 health, cells +8 ammo. Find the pulsing <b>EXIT</b> panel on each of the
        three sublevels.</li>
      <li>The HUD face tells you how it's going. Best completion time is saved.</li>
    </ul>`],

  dosgames: ["MS-DOS games & QBasic", `
    <h2>Games at the C:\\&gt; prompt</h2>
    <ul>
      <li><b>SNAKE</b> — text-mode snake. Arrows steer, Esc exits, high score kept.</li>
      <li><b>GORILLA</b> — explosive banana artillery vs the CPU. Enter an angle (0–90) and
        velocity (10–100); mind the wind arrows. Buildings crater. First to 3.</li>
      <li><b>QBASIC</b> — a genuine BASIC: line numbers, PRINT, INPUT, IF/THEN, GOTO, FOR/NEXT,
        RND. <b>LOAD "GUESS"</b> or <b>LOAD "STARS"</b> then <b>RUN</b>; LIST, NEW, SYSTEM to exit.
        Write your own; 20,000 steps of runaway GOTOs and it politely halts.</li>
    </ul>`],

  _s7: "REFERENCE",

  explorer: ["Files, folders & the Recycle Bin", `
    <h2>Files and folders</h2>
    <ul>
      <li>Right-click files: Open, <b>Export to Mac</b>, Send To, Cut/Copy/Paste, Create Shortcut,
        Delete, Rename, Properties.</li>
      <li><b>Drag</b> files onto folders to move; <b>right-drag</b> for Move / Copy /
        Create Shortcut Here.</li>
      <li>Views: Large Icons, List, Details (sortable columns). View → as Web Page adds the blue
        info panel with previews.</li>
      <li>Deleted files go to the Recycle Bin — restore them or empty it. Ctrl+Z undoes a delete.</li>
      <li><b>ZipMaster</b> handles .zip archives: create, add, extract (see old_homework.zip).
        Day 743 of the 21-day trial.</li>
      <li><b>My Briefcase</b> — copy files in, edit either copy, then File → Update All syncs
        newest-wins against My Documents.</li>
    </ul>`],

  dos: ["MS-DOS Prompt — full command list", `
    <h2>MS-DOS Prompt</h2>
    <p>A real interpreter over the same file system.</p>
    <p><b>Files:</b> DIR, CD, TYPE, COPY, DEL, REN, MD, RD, TREE, EDIT<br>
    <b>System:</b> CLS, VER, VOL, DATE, TIME, MEM, HELP, EXIT, START &lt;program&gt;<br>
    <b>Network:</b> PING, IPCONFIG, TRACERT, NETSTAT<br>
    <b>Games:</b> SNAKE, GORILLA, QBASIC<br>
    <b>Ill-advised:</b> FORMAT C: (the computer answers for you), DELTREE C:\\WINDOWS (find out),
    and one more command connoisseurs will find on their own.</p>
    <p>Right-click the screen to copy its text or paste a command.</p>`],

  calc: ["Calculator", `
    <h2>Calculator</h2>
    <ul>
      <li>Standard mode for arithmetic; View → Scientific for trig, powers, logs and parentheses.</li>
      <li>Keyboard works: digits, + − * /, Enter equals, Esc clears.</li>
      <li>MC/MR/MS/M+ memory keys, just like the plastic one in your drawer.</li>
    </ul>`],

  encyclopedia: ["Encyclopedia 98", `
    <h2>Encyclopedia 98</h2>
    <p>Sixteen articles of confident knowledge across Technology, Science, Nature and Culture —
    from The Modem to Volcanoes (with illustration) to The Beanie Baby (a retirement plan).</p>
    <ul>
      <li>Browse by category or search the full text.</li>
      <li>Some articles have sound (the dinosaur roar is reconstructed, imaginative).</li>
      <li>Statistically, you are about to read about volcanoes instead of doing homework.
        The encyclopedia understands.</li>
    </ul>`],

  secrets: ["Tips & secrets", `
    <h2>Tips &amp; secrets</h2>
    <ul>
      <li>Feed Pixel treats on his web page. The counter is permanent. He remembers you.</li>
      <li>Ctrl+Alt+Delete once is a dialog. Twice is an experience.</li>
      <li>The ski monster is not a myth. CoolDave2000 has seen things.</li>
      <li>Ask Claude who Dave is. Ask the BBS sysop nothing — he is asleep.</li>
      <li>The Y2K Watch countdown is live. The beans remain non-refundable.</li>
      <li>Try typing <b>pizza</b> — in WordPad, in IRC, almost anywhere. People have opinions.</li>
      <li>There is a DOS command that shows a famous blue screen. It is not documented. This is
        the second-to-last place it would be documented.</li>
    </ul>`],

  about: ["About this recreation", `
    <h2>About</h2>
    <p>A loving, original recreation of the Windows 98 era: 61 programs, 14 games, 19 websites,
    a BBS, an AI assistant, and one very patient printer — all built from scratch, all offline,
    all persistent.</p>
    <p>No Microsoft code or assets are included; visual and audio stand-ins are original, and you
    can supply era-authentic files via the Sounds and Branding folders (see "Using original
    sounds &amp; branding").</p>
    <p>Best viewed at 800×600, in spirit.</p>`]
};

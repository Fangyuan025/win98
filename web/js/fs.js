/* fs.js — virtual file system (persisted) */
"use strict";
const FS = W98.FS = (() => {
  const now = () => Date.now();
  const D = (ch) => ({ t: "d", ch: ch || {}, c: now(), m: now() });
  const F = (data) => ({ t: "f", data: data || "", c: now(), m: now() });

  function seed() {
    const root = {
      "C:": D({
        "Windows": D({
          "Desktop": D({}),
          "System": D({
            "user.dat": F("(registry hive)"),
            "system.dat": F("(registry hive)"),
            "shell32.dll": F("(system library)"),
            "kernel32.dll": F("(system library)")
          }),
          "Recent": D({}),
          "notepad.exe": F("app:notepad"),
          "calc.exe": F("app:calc"),
          "explorer.exe": F("app:explorer"),
          "command.com": F("app:dos"),
          "regedit.exe": F("app:regedit"),
          "Readme.txt": F("Thank you for using Windows 98.\r\n\r\nThis nostalgic recreation runs entirely on your computer.\r\nDouble-click icons to explore. Right-click for context menus.\r\n")
        }),
        "Program Files": D({
          "Accessories": D({
            "mspaint.exe": F("app:paint"),
            "wordpad.exe": F("app:wordpad"),
            "notepad.exe": F("app:notepad"),
            "calc.exe": F("app:calc")
          }),
          "Office 98": D({
            "Word.exe": F("app:writer"),
            "Excel.exe": F("app:spreadsheet"),
            "PowerPoint.exe": F("app:slides")
          }),
          "Internet Explorer": D({
            "iexplore.exe": F("app:ie")
          }),
          "Multimedia": D({
            "mplayer.exe": F("app:media"),
            "cdplayer.exe": F("app:cdplayer"),
            "charmap.exe": F("app:charmap")
          }),
          "Games": D({
            "winmine.exe": F("app:minesweeper"),
            "sol.exe": F("app:solitaire")
          })
        }),
        "My Documents": D({
          "Welcome.txt": F("Welcome to Windows 98!\r\n\r\nHere are some things to try:\r\n  - Play Minesweeper or Solitaire (Start > Programs > Accessories > Games)\r\n  - Draw a picture in Paint and save it\r\n  - Write a letter in WordPad, crunch numbers in the Spreadsheet\r\n  - Open the MS-DOS Prompt and type HELP\r\n  - Change your wallpaper: right-click the desktop, choose Properties\r\n  - Drag windows around, resize them, and watch the taskbar\r\n\r\nHave fun exploring!\r\n"),
          "Readme.doc": F("{\\wp1}<div style=\"font-family:Georgia,serif\"><div style=\"text-align:center\"><font size=\"5\"><b>A Note From WordPad</b></font></div><div><br></div><div>This is a <b>rich text</b> document. You can make text <i>italic</i>, <u>underlined</u>, or <font color=\"#c00000\">colored</font>.</div><div><br></div><div>Everything you type is saved to the virtual C: drive and survives restarts. Try the format bar above!</div></div>"),
          "Budget.xls": F("SSV1\n" + JSON.stringify({
            A1: "Monthly Budget", A3: "Category", B3: "Planned", C3: "Actual", D3: "Difference",
            A4: "Rent", B4: "1200", C4: "1200", D4: "=B4-C4",
            A5: "Groceries", B5: "400", C5: "437", D5: "=B5-C5",
            A6: "Internet (56k)", B6: "20", C6: "19.95", D6: "=B6-C6",
            A7: "CD Singles", B7: "30", C7: "52", D7: "=B7-C7",
            A9: "Totals", B9: "=SUM(B4:B7)", C9: "=SUM(C4:C7)", D9: "=B9-C9"
          })),
          "My Pictures": D({})
        }),
        "Autoexec.bat": F("@ECHO OFF\r\nPATH C:\\WINDOWS;C:\\WINDOWS\\COMMAND\r\nSET TEMP=C:\\WINDOWS\\TEMP\r\n"),
        "Config.sys": F("DEVICE=C:\\WINDOWS\\HIMEM.SYS\r\nDOS=HIGH,UMB\r\nFILES=60\r\n")
      })
    };
    return root;
  }

  let root = Store.get("fs", null);
  if (!root || !root["C:"]) { root = seed(); Store.set("fs", root); }
  let recycle = Store.get("recycle", []);

  /* migrate older saved file systems: make sure newer programs exist */
  (function ensureNewFiles() {
    function pic(draw) {
      const c = document.createElement("canvas");
      c.width = 320; c.height = 240;
      draw(c.getContext("2d"), 320, 240);
      return c.toDataURL("image/png");
    }
    const sunset = () => pic((x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h * 0.62);
      g.addColorStop(0, "#3b1f5e"); g.addColorStop(0.5, "#c94f2a"); g.addColorStop(1, "#f7b733");
      x.fillStyle = g; x.fillRect(0, 0, w, h * 0.62);
      x.fillStyle = "#ffd76e";
      x.beginPath(); x.arc(w / 2, h * 0.62, 34, Math.PI, 0); x.fill();
      const sea = x.createLinearGradient(0, h * 0.62, 0, h);
      sea.addColorStop(0, "#7a3b1e"); sea.addColorStop(1, "#26134d");
      x.fillStyle = sea; x.fillRect(0, h * 0.62, w, h * 0.38);
      x.strokeStyle = "rgba(255,215,110,0.7)";
      for (let i = 0; i < 9; i++) {
        const y = h * 0.64 + i * 8;
        x.beginPath(); x.moveTo(w / 2 - 40 + i * 4, y); x.lineTo(w / 2 + 40 - i * 4, y); x.stroke();
      }
      x.strokeStyle = "#2a2a2a"; x.lineWidth = 2;
      [[70, 46], [96, 60], [232, 40]].forEach(([bx, by]) => {
        x.beginPath(); x.moveTo(bx - 8, by); x.quadraticCurveTo(bx, by - 7, bx + 8, by);
        x.quadraticCurveTo(bx, by - 3, bx - 8, by); x.stroke();
      });
    });
    const house = () => pic((x, w, h) => {
      x.fillStyle = "#87ceeb"; x.fillRect(0, 0, w, h * 0.72);
      x.fillStyle = "#59a838"; x.fillRect(0, h * 0.72, w, h * 0.28);
      x.fillStyle = "#ffd800";
      x.beginPath(); x.arc(272, 42, 24, 0, Math.PI * 2); x.fill();
      x.strokeStyle = "#ffd800"; x.lineWidth = 3;
      for (let a = 0; a < 8; a++) {
        x.beginPath();
        x.moveTo(272 + Math.cos(a * Math.PI / 4) * 30, 42 + Math.sin(a * Math.PI / 4) * 30);
        x.lineTo(272 + Math.cos(a * Math.PI / 4) * 40, 42 + Math.sin(a * Math.PI / 4) * 40);
        x.stroke();
      }
      x.fillStyle = "#fff";
      [[60, 50], [150, 34]].forEach(([cx, cy]) => {
        [[0, 0, 22], [24, 6, 16], [-22, 8, 14]].forEach(([dx, dy, r]) => {
          x.beginPath(); x.arc(cx + dx, cy + dy, r, 0, Math.PI * 2); x.fill();
        });
      });
      x.fillStyle = "#c46a3b"; x.fillRect(96, 108, 130, 84);
      x.fillStyle = "#8a2f1d";
      x.beginPath(); x.moveTo(84, 108); x.lineTo(161, 62); x.lineTo(238, 108); x.closePath(); x.fill();
      x.fillStyle = "#5d3a1a"; x.fillRect(150, 146, 26, 46);
      x.fillStyle = "#ffe9a8"; x.fillRect(110, 122, 24, 20); x.fillRect(188, 122, 24, 20);
      x.strokeStyle = "#5d3a1a"; x.lineWidth = 2;
      x.strokeRect(110, 122, 24, 20); x.strokeRect(188, 122, 24, 20);
      x.beginPath(); x.moveTo(122, 122); x.lineTo(122, 142); x.moveTo(110, 132); x.lineTo(134, 132); x.stroke();
      x.beginPath(); x.moveTo(200, 122); x.lineTo(200, 142); x.moveTo(188, 132); x.lineTo(212, 132); x.stroke();
    });
    const smiley = () => pic((x, w, h) => {
      x.fillStyle = "#fff"; x.fillRect(0, 0, w, h);
      x.fillStyle = "#ffe135";
      x.beginPath(); x.arc(w / 2, 104, 74, 0, Math.PI * 2); x.fill();
      x.lineWidth = 4; x.strokeStyle = "#000"; x.stroke();
      x.fillStyle = "#000";
      x.beginPath(); x.arc(w / 2 - 26, 84, 9, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(w / 2 + 26, 84, 9, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(w / 2, 108, 44, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
      x.font = "bold 26px 'Comic Sans MS', cursive";
      x.textAlign = "center";
      x.fillText("have a nice day!", w / 2, 218);
    });

    const wants = [
      ["C:/Windows/defrag.exe", "app:defrag"],
      ["C:/Windows/scandskw.exe", "app:scandisk"],
      ["C:/Windows/mshearts.exe", "app:hearts"],
      ["C:/Windows/sndrec32.exe", "app:sndrec"],
      ["C:/Program Files/Games/freecell.exe", "app:freecell"],
      ["C:/Program Files/Accessories/dialup.exe", "app:dialup"],
      ["C:/Program Files/Internet Mail/mail.exe", "app:mail"],
      /* --- content pack --- */
      ["C:/Windows/win.ini", "[windows]\r\nload=\r\nrun=\r\nNullPort=None\r\n\r\n[Desktop]\r\nWallpaper=(None)\r\nTileWallpaper=1\r\n\r\n[intl]\r\nsCountry=Nostalgia\r\n"],
      ["C:/Windows/system.ini", "[boot]\r\nshell=Explorer.exe\r\nsystem.drv=system.drv\r\n\r\n[386Enh]\r\nPagingFile=C:\\WINDOWS\\WIN386.SWP\r\n\r\n[drivers]\r\nwave=synthesizer.drv\r\n"],
      ["C:/Windows/Help/windows.hlp", "app:help"],
      ["C:/Windows/Media/About the Media folder.txt", "In a real 1998 machine this folder held the .wav files.\r\n\r\nIn this recreation, drop your own sound files into the Sounds\r\nfolder instead: Control Panel > Sounds > Schemes tab.\r\n"],
      ["C:/Windows/Cursors/About Cursors.txt", "Animated cursor collection sold separately.\r\n(Enable pointer trails in Control Panel > Mouse > Motion.)\r\n"],
      ["C:/Windows/Temp/~df3a21.tmp", "(temporary file — safe to delete, as tradition demands)"],
      ["C:/Windows/Command/edit.com", "app:notepad"],
      ["C:/My Documents/Letters/Dear Aunt Carol.doc",
        "{\\wp1}<div style=\"font-family:Georgia,serif\"><div>Dear Aunt Carol,</div><div><br></div><div>Thank you for the <b>eleven</b> forwarded emails this week. I can confirm that nothing amazing happened on Friday, but I appreciate the warning.</div><div><br></div><div>To make the writing bigger, click the second dropdown in the toolbar and pick a larger number. To make it stop being bigger, pick a smaller one.</div><div><br></div><div>See you Sunday — I will bring the good mouse pad.</div><div><br></div><div><i>Your favorite nibling</i></div></div>"],
      ["C:/My Documents/School/Book Report - The Modem.doc",
        "{\\wp1}<div style=\"font-family:Georgia,serif\"><div style=\"text-align:center\"><font size=\"5\"><b>Book Report: The Modem And Me</b></font></div><div><br></div><div>The modem is a small box that screams at the phone line until the internet comes out. Ours is a 56k, which means it is very fast, except it is not.</div><div><br></div><div>My favorite part is the sound it makes, which my dad says is \"the sound of money.\" My least favorite part is when Mom picks up the phone during the good part of a download.</div><div><br></div><div>In conclusion, the modem is both a blessing and a curse. Four stars.</div></div>"],
      ["C:/My Documents/Shopping List.txt", "SHOPPING LIST\r\n=============\r\n- blank floppies (10-pack, the see-through kind)\r\n- CD-R x5 for \"backups\" (mix CDs)\r\n- mouse pad with wrist rest\r\n- screen wipes\r\n- 2L of orange soda for LAN night\r\n- DO NOT FORGET: return video rental!!\r\n"],
      ["C:/My Documents/diary.txt", "Dear diary,\r\n\r\nToday I defragmented the hard drive. I watched the little blocks\r\nmove for forty-five minutes. I regret nothing.\r\n\r\nTomorrow: alphabetize the CD tower.\r\n"],
      ["C:/My Documents/My Pictures/Sunset.bmp", null, sunset],
      ["C:/My Documents/My Pictures/My House.bmp", null, house],
      ["C:/My Documents/My Pictures/Smiley.bmp", null, smiley],
      ["C:/My Briefcase/About the Briefcase.txt",
        "MY BRIEFCASE\r\n============\r\nIn 1998 this folder synchronized files with your laptop\r\nover a parallel cable, a process that worked nearly 60% of the time.\r\n\r\nHere it is a perfectly good folder. Put files in it and feel\r\nprofessionally mobile.\r\n"],
      /* --- the lived-in PC pack: era software + a desktop people actually used --- */
      ["C:/Program Files/Games/pinball.exe", "app:pinball"],
      ["C:/Program Files/Games/ski.exe", "app:ski"],
      ["C:/Program Files/Games/wallball.exe", "app:wallball"],
      ["C:/Program Files/Games/worm.exe", "app:worm"],
      ["C:/Windows/Desktop/Star Pilot Pinball.lnk", "lnk:C:/Program Files/Games/pinball.exe"],
      ["C:/Program Files/Games/stackz.exe", "app:stackz"],
      ["C:/Program Files/ZipMaster/zipmaster.exe", "app:zipmaster"],
      ["C:/Program Files/ChatterBox/chatterbox.exe", "app:chatterbox"],
      ["C:/Program Files/SurrealPlayer/surreal.exe", "app:surreal"],
      ["C:/Program Files/HyperTerminal/hypertrm.exe", "app:hyperterm"],
      ["C:/Program Files/PageCrafter/pagecrafter.exe", "app:pagecrafter"],
      ["C:/Windows/Desktop/PageCrafter Express.lnk", "lnk:C:/Program Files/PageCrafter/pagecrafter.exe"],
      ["C:/Program Files/Anthropic/Claude Desktop 98/claude.exe", "app:claude98"],
      ["C:/Windows/Desktop/Claude Desktop 98.lnk", "lnk:C:/Program Files/Anthropic/Claude Desktop 98/claude.exe"],
      ["C:/Program Files/PhotoGoo/photogoo.exe", "app:photogoo"],
      ["C:/Program Files/NetMeet 98/netmeet.exe", "app:netmeet"],
      ["C:/Program Files/Games/corridor.exe", "app:corridor"],
      ["C:/Windows/Desktop/CORRIDOR 98.lnk", "lnk:C:/Program Files/Games/corridor.exe"],
      ["C:/My Documents/first_beat.trk", "TRK1\n{\"tempo\":128,\"grids\":[[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]],[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]],[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],[[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]]]}"],
      ["C:/My Documents/old_homework.zip", "zip:" + JSON.stringify({
        "book_report_FINAL.doc": "{\\wp1}<div>The Old Man and the Sea is a book about an old man and the sea. It has themes.</div>",
        "book_report_FINAL_v2.doc": "{\\wp1}<div>The Old Man and the Sea is a book about persistence, and also an old man, and also the sea.</div>",
        "do_not_open.txt": "you opened it. classic."
      })],
      ["C:/Program Files/Encyclopedia 98/encarta.exe", "app:encarta"],
      ["C:/Windows/Desktop/Encyclopedia 98.lnk", "lnk:C:/Program Files/Encyclopedia 98/encarta.exe"],
      ["C:/Program Files/Pal Messenger/pal.exe", "app:pal"],
      ["C:/Program Files/MegaAmp/megaamp.exe", "app:megaamp"],
      ["C:/Program Files/NetGrab/netgrab.exe", "app:netgrab"],
      ["C:/Windows/vscan.exe", "app:vscan"],
      ["C:/My Documents/My Music/About My Music.txt", "Downloaded tunes land here. Double-click an .mp3 to play it in MegaAmp.\r\n"],
      ["C:/Windows/Desktop/Pal Messenger.lnk", "lnk:C:/Program Files/Pal Messenger/pal.exe"],
      ["C:/Windows/Desktop/MegaAmp.lnk", "lnk:C:/Program Files/MegaAmp/megaamp.exe"],
      ["C:/Windows/Desktop/NetGrab.lnk", "lnk:C:/Program Files/NetGrab/netgrab.exe"],
      ["C:/Windows/Desktop/Internet Mail.lnk", "lnk:C:/Program Files/Internet Mail/mail.exe"],
      ["C:/Windows/Desktop/Word.lnk", "lnk:C:/Program Files/Office 98/Word.exe"],
      ["C:/Windows/Desktop/Excel.lnk", "lnk:C:/Program Files/Office 98/Excel.exe"],
      ["C:/Windows/Desktop/Connect to the Internet.lnk", "lnk:C:/Program Files/Accessories/dialup.exe"],
      ["C:/Windows/Desktop/My Resume.doc",
        "{\\wp1}<div style=\"font-family:Georgia,serif\"><div style=\"text-align:center\"><font size=\"5\"><b>RESUME</b></font></div><div><br></div><div><b>Objective:</b> A position involving computers, which I am good at.</div><div><br></div><div><b>Skills:</b></div><div>- Typing (fast)</div><div>- The Internet (whole thing)</div><div>- Fixing the printer by turning it off and on</div><div>- Minesweeper (expert, 99 seconds)</div><div><br></div><div><b>Experience:</b> Family tech support, 1995-present. Unpaid but deeply appreciated.</div><div><br></div><div><i>References: my mom, available after 6 PM (not during internet hours).</i></div></div>"],
      ["C:/Windows/Desktop/cool sites.txt",
        "COOL SITES TO CHECK OUT\r\n=======================\r\nhttp://members.geosities.com/~stardust/   <- sign the guestbook!!\r\nhttp://www.duckydance.com/                <- the duck one\r\nhttp://midi.web98.net/                    <- music!!\r\nhttp://www.y2kwatch.org/                  <- mom says stock up on beans\r\n"]
    ];
    let changed = false;
    for (const [path, data, gen] of wants) {
      const s = path.split("/");
      let node = root[s[0]];
      if (!node) continue;
      let ok = true;
      for (let i = 1; i < s.length - 1; i++) {
        let key = Object.keys(node.ch).find(k => k.toLowerCase() === s[i].toLowerCase());
        if (!key) { node.ch[s[i]] = D({}); key = s[i]; changed = true; }
        node = node.ch[key];
        if (node.t !== "d") { ok = false; break; }
      }
      if (!ok) continue;
      const fname = s[s.length - 1];
      if (!Object.keys(node.ch).find(k => k.toLowerCase() === fname.toLowerCase())) {
        node.ch[fname] = F(data != null ? data : gen());
        changed = true;
      }
    }
    if (changed) Store.set("fs", root);
  })();

  /* the neighborhood: three machines that are usually on */
  (function ensureNetwork() {
    if (root["NET:"]) return;
    root["NET:"] = D({
      "Dave-pc": D({
        "quake_demos": D({
          "README.TXT": F("these r my best demos. do NOT show mike.\r\n- frag_montage.dem (4 min of me missing rockets)\r\n- ctf_win.dem (we lost but it was close)\r\n"),
          "frag_montage.dem": F("(demo file — 4 minutes of Dave missing rockets, set to techno)"),
          "ctf_win.dem": F("(demo file — they lost, but it was close)")
        }),
        "mp3z": D({
          "cool_song_1.mp3": F("song:1"),
          "cooler_song.mp3": F("song:2"),
          "READ_THIS.txt": F("downloaded over 3 nights. each file took 45 min.\r\nif the phone rings during playback that is normal.\r\n")
        })
      }),
      "Family-pc": D({
        "Shared Documents": D({
          "recipes.txt": F("MOM'S FAMOUS CASSEROLE\r\n1. cream of mushroom soup\r\n2. the rest is a family secret\r\n3. bake until Dad asks 'is it done'\r\n"),
          "christmas_list_1998.txt": F("WISH LIST (draft 7)\r\n- 56k modem (EXTERNAL, the lights matter)\r\n- rollerblades\r\n- CD wallet (the 96-disc one)\r\n- world peace or a Dreamcast\r\n"),
          "vacation_notes.txt": F("Day 1: drove.\r\nDay 2: drove more. saw a big ball of twine.\r\nDay 3: motel pool was closed. Dad said 'character building'.\r\n")
        }),
        "The Office Printer.lnk": F("lnk:::PrintQueue")
      }),
      "Moms-office": D({
        "Reports": D({
          "Q3_numbers.xls": F("SSV1\n" + JSON.stringify({
            A1: "Q3 Report", A3: "Region", B3: "Sales",
            A4: "North", B4: "8200", A5: "South", B5: "7900",
            A6: "That one weird region", B6: "12",
            A8: "Total", B8: "=SUM(B4:B6)"
          }))
        }),
        "PRIVATE": D({
          "diary.txt": F("nice try.")
        })
      })
    });
    Store.set("fs", root);
  })();

  const save = debounce(() => { Store.set("fs", root); Store.set("recycle", recycle); }, 250);

  function norm(path) {
    return String(path).replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "");
  }
  function segs(path) {
    return norm(path).split("/").filter(Boolean);
  }
  function display(path) {
    return segs(path).join("\\");
  }
  function get(path) {
    const s = segs(path);
    if (!s.length) return null;
    let node = root[s[0]];
    for (let i = 1; node && i < s.length; i++) {
      if (node.t !== "d") return null;
      const key = Object.keys(node.ch).find(k => k.toLowerCase() === s[i].toLowerCase());
      node = key ? node.ch[key] : null;
    }
    return node || null;
  }
  function parentOf(path) {
    const s = segs(path);
    return { dir: s.slice(0, -1).join("/"), name: s[s.length - 1] };
  }
  function realName(dirNode, name) {
    return Object.keys(dirNode.ch).find(k => k.toLowerCase() === String(name).toLowerCase());
  }
  function list(path) {
    const n = get(path);
    if (!n || n.t !== "d") return [];
    const items = Object.keys(n.ch).map(name => ({ name, node: n.ch[name] }));
    items.sort((a, b) => {
      if ((a.node.t === "d") !== (b.node.t === "d")) return a.node.t === "d" ? -1 : 1;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    return items;
  }
  function mkdir(path) {
    const { dir, name } = parentOf(path);
    const p = get(dir);
    if (!p || p.t !== "d") return false;
    if (realName(p, name)) return false;
    p.ch[name] = D({});
    p.m = now(); save();
    W98.bus.emit("fs", dir);
    return true;
  }
  function writeFile(path, data) {
    const { dir, name } = parentOf(path);
    const p = get(dir);
    if (!p || p.t !== "d") return false;
    const rn = realName(p, name);
    if (rn && p.ch[rn].t === "d") return false;
    if (rn) { p.ch[rn].data = data; p.ch[rn].m = now(); }
    else p.ch[name] = F(data);
    p.m = now(); save();
    W98.bus.emit("fs", dir);
    return true;
  }
  function readFile(path) {
    const n = get(path);
    return n && n.t === "f" ? n.data : null;
  }
  function exists(path) { return !!get(path); }
  function uniqueName(dirPath, base, ext) {
    const p = get(dirPath);
    if (!p) return base + (ext || "");
    let name = base + (ext || ""), i = 2;
    while (realName(p, name)) { name = `${base} (${i})${ext || ""}`; i++; }
    return name;
  }
  function del(path, forever) {
    const { dir, name } = parentOf(path);
    const p = get(dir);
    if (!p) return false;
    const rn = realName(p, name);
    if (!rn) return false;
    const node = p.ch[rn];
    delete p.ch[rn];
    p.m = now();
    if (!forever) recycle.push({ name: rn, orig: dir, node, at: now() });
    save();
    W98.bus.emit("fs", dir);
    W98.bus.emit("recycle");
    return true;
  }
  function restore(idx) {
    const item = recycle[idx];
    if (!item) return false;
    let p = get(item.orig);
    if (!p || p.t !== "d") { // original folder gone -> restore to C:
      p = get("C:");
    }
    let nm = item.name;
    if (realName(p, nm)) nm = uniqueName(item.orig, "Copy of " + nm.replace(/\.[^.]*$/, ""), (nm.match(/\.[^.]*$/) || [""])[0]);
    p.ch[nm] = item.node;
    recycle.splice(idx, 1);
    save();
    W98.bus.emit("fs", item.orig);
    W98.bus.emit("recycle");
    return true;
  }
  function emptyRecycle() {
    recycle.length = 0; save();
    W98.bus.emit("recycle");
  }
  function rename(path, newName) {
    newName = String(newName).trim();
    if (!newName || /[\\/:*?"<>|]/.test(newName)) return "A file name cannot contain any of the following characters:\n\\ / : * ? \" < > |";
    const { dir, name } = parentOf(path);
    const p = get(dir);
    if (!p) return "Path not found";
    const rn = realName(p, name);
    if (!rn) return "File not found";
    if (newName.toLowerCase() !== rn.toLowerCase() && realName(p, newName))
      return "This folder already contains a file named '" + newName + "'.";
    const node = p.ch[rn];
    delete p.ch[rn];
    p.ch[newName] = node;
    node.m = now(); p.m = now(); save();
    W98.bus.emit("fs", dir);
    return null;
  }
  function clone(node) {
    return JSON.parse(JSON.stringify(node));
  }
  function copyTo(srcPath, destDir) {
    const n = get(srcPath);
    const p = get(destDir);
    if (!n || !p || p.t !== "d") return false;
    const { name } = parentOf(srcPath);
    let nm = name;
    if (realName(p, nm)) {
      const ext = (nm.match(/\.[^.]*$/) || [""])[0];
      nm = uniqueName(destDir, "Copy of " + nm.slice(0, nm.length - ext.length), ext);
    }
    p.ch[nm] = clone(n);
    p.m = now(); save();
    W98.bus.emit("fs", destDir);
    return true;
  }
  function moveTo(srcPath, destDir) {
    if (norm(destDir).toLowerCase().startsWith(norm(srcPath).toLowerCase() + "/")) return false;
    const { dir, name } = parentOf(srcPath);
    if (norm(dir).toLowerCase() === norm(destDir).toLowerCase()) return true;
    const sp = get(dir), dp = get(destDir);
    if (!sp || !dp || dp.t !== "d") return false;
    const rn = realName(sp, name);
    if (!rn) return false;
    let nm = rn;
    if (realName(dp, nm)) return false;
    dp.ch[nm] = sp.ch[rn];
    delete sp.ch[rn];
    sp.m = dp.m = now(); save();
    W98.bus.emit("fs", dir); W98.bus.emit("fs", destDir);
    return true;
  }
  function find(query, rootPath) {
    const out = [];
    const q = query.toLowerCase();
    function walk(path, node) {
      if (node.t === "d") {
        for (const k in node.ch) {
          const p = path + "/" + k;
          if (k.toLowerCase().includes(q)) out.push({ path: p, node: node.ch[k] });
          walk(p, node.ch[k]);
          if (out.length > 500) return;
        }
      }
    }
    const start = rootPath ? norm(rootPath) : "C:";
    const n = get(start);
    if (n) walk(start, n);
    return out;
  }
  function sizeOf(node) {
    if (node.t === "f") return (node.data || "").length;
    let s = 0;
    for (const k in node.ch) s += sizeOf(node.ch[k]);
    return s;
  }
  function ext(name) {
    const m = String(name).match(/\.([^.]+)$/);
    return m ? m[1].toLowerCase() : "";
  }
  function typeName(name, node) {
    if (node.t === "d") return "File Folder";
    if (ext(name) === "lnk") return "Shortcut";
    switch (ext(name)) {
      case "txt": return "Text Document";
      case "bat": return "MS-DOS Batch File";
      case "sys": return "System file";
      case "ini": return "Configuration Settings";
      case "exe": return "Application";
      case "com": return "MS-DOS Application";
      case "dll": return "Application Extension";
      case "bmp": case "png": return "Bitmap Image";
      case "mp3": return "MP3 Audio";
      case "dat": return "DAT File";
      case "doc": return "WordPad Document";
      case "rtf": return "Rich Text Document";
      case "wri": return "Write Document";
      case "xls": case "csv": return "Worksheet";
      case "ppt": return "Presentation";
      case "htm": case "html": return "HTML Document";
      default: return ext(name) ? ext(name).toUpperCase() + " File" : "File";
    }
  }
  function iconFor(name, node) {
    if (node.t === "d") return "folder";
    const e = ext(name);
    if (e === "lnk") {
      const target = String(node.data || "").startsWith("lnk:") ? node.data.slice(4) : null;
      const tn = target ? get(target) : null;
      if (tn) return iconFor(segs(target).pop(), tn) + "+lnk";
      return "file+lnk";
    }
    if (e === "txt" || e === "bat" || e === "ini" || e === "sys") return "textfile";
    if (e === "doc" || e === "rtf" || e === "wri") return "worddoc";
    if (e === "xls" || e === "csv") return "sheetdoc";
    if (e === "ppt") return "slidesdoc";
    if (["bmp", "png", "jpg", "jpeg", "gif", "webp"].includes(e)) return "imagefile";
    if (["mp3", "wav", "mid", "m4a", "ogg", "aif", "aiff"].includes(e)) return "megaamp";
    if (e === "trk") return "composer";
    if (e === "zip") return "zipmaster";
    if (e === "exe" || e === "com") {
      const appId = String(node.data || "").startsWith("app:") ? node.data.slice(4) : null;
      if (appId && W98.Apps && W98.Apps[appId]) return W98.Apps[appId].icon;
      return "exefile";
    }
    if (e === "dll" || e === "dat") return "exefile";
    if (e === "htm" || e === "html") return "ie";
    return "file";
  }
  function reset() {
    root = seed(); recycle = [];
    Store.set("fs", root); Store.set("recycle", recycle);
    W98.bus.emit("fs", "C:"); W98.bus.emit("recycle");
  }

  const DESKTOP = "C:/Windows/Desktop";
  const DOCS = "C:/My Documents";

  return {
    get, list, mkdir, writeFile, readFile, exists, uniqueName, del, restore,
    emptyRecycle, rename, copyTo, moveTo, find, sizeOf, ext, typeName, iconFor,
    display, norm, segs, reset, save,
    get recycle() { return recycle; },
    DESKTOP, DOCS
  };
})();

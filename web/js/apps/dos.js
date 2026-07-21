/* dos.js — MS-DOS Prompt with a working interpreter over the VFS */
"use strict";
W98.Apps = W98.Apps || {};
W98.Apps.dos = {
  name: "MS-DOS Prompt", icon: "dos",
  launch() {
    let cwd = "C:/Windows";
    let history = [], histIdx = -1;
    let buf = "";

    const screen = el("div", { class: "dos-screen" });
    const win = WM.create({
      title: "MS-DOS Prompt", icon: "dos",
      width: 646, height: 420, minWidth: 400, minHeight: 240
    });
    win.body.append(screen);

    let out = "Microsoft(R) Windows 98\n   (C)Copyright Microsoft Corp 1981-1998.\n\n";
    function prompt() { return FS.display(cwd).toUpperCase() + ">"; }
    function render() {
      screen.textContent = out + prompt() + buf;
      const cur = el("span", { class: "cursor" });
      screen.append(cur);
      screen.scrollTop = screen.scrollHeight;
    }
    function print(s) { out += s + "\n"; }

    function shortName(name) {
      const dot = name.lastIndexOf(".");
      let base = dot > 0 ? name.slice(0, dot) : name;
      let ext = dot > 0 ? name.slice(dot + 1) : "";
      base = base.toUpperCase().replace(/\s+/g, "");
      ext = ext.toUpperCase();
      if (base.length > 8) base = base.slice(0, 6) + "~1";
      return { base, ext };
    }
    function fmtDosDate(ts) {
      const d = new Date(ts || Date.now());
      let h = d.getHours(); const ap = h >= 12 ? "p" : "a"; h = h % 12 || 12;
      return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}-${String(d.getFullYear()).slice(2)}  ${String(h).padStart(2)}:${pad2(d.getMinutes())}${ap}`;
    }
    function resolve(p) {
      if (!p) return cwd;
      p = p.replace(/\\/g, "/").replace(/"/g, "");
      if (/^[a-z]:/i.test(p)) return p;
      if (p === "..") { const s = FS.segs(cwd); return s.length > 1 ? s.slice(0, -1).join("/") : cwd; }
      if (p === ".") return cwd;
      if (p.startsWith("/")) return "C:" + p;
      return cwd + "/" + p;
    }

    const COMMANDS = {
      help() {
        print("For more information on a specific command, type HELP command-name.");
        const cmds = [
          ["CD", "Displays the name of or changes the current directory."],
          ["CLS", "Clears the screen."],
          ["COPY", "Copies one or more files to another location."],
          ["DATE", "Displays the date."],
          ["DEL", "Deletes one or more files."],
          ["DIR", "Displays a list of files and subdirectories in a directory."],
          ["DELTREE", "Deletes a directory and all its subdirectories. Careful."],
          ["ECHO", "Displays messages."],
          ["EDIT", "Starts the editor (Notepad)."],
          ["EXIT", "Quits the MS-DOS prompt."],
          ["FORMAT", "Formats a disk. In theory."],
          ["GORILLA", "Explosive banana artillery. You vs the CPU."],
          ["QBASIC", "The programming language of champions."],
          ["MD", "Creates a directory."],
          ["MEM", "Displays the amount of used and free memory."],
          ["RD", "Removes (deletes) a directory."],
          ["REN", "Renames a file or files."],
          ["SNAKE", "It is exactly what it sounds like."],
          ["START", "Starts a program (notepad, calc, mspaint, winmine, sol, iexplore)."],
          ["TIME", "Displays the time."],
          ["TREE", "Graphically displays the directory structure."],
          ["TYPE", "Displays the contents of a text file."],
          ["VER", "Displays the Windows version."],
          ["VOL", "Displays a disk volume label."],
          ["WIN", "You are already in Windows. But sure."]
        ];
        for (const [c, d] of cmds) print(c.padEnd(8) + d);
      },
      ver() { print("\nWindows 98 [Version 4.10.1998]\n"); },
      vol() { print(" Volume in drive C is WIN98\n Volume Serial Number is 2A4B-11E7"); },
      cls() { out = ""; },
      date() { print("Current date is " + fmtDate(new Date())); },
      time() { print("Current time is " + new Date().toLocaleTimeString()); },
      mem() {
        print("\nMemory Type        Total       Used       Free");
        print("----------------  --------   --------   --------");
        print("Conventional          640K        45K       595K");
        print("Extended (XMS)     64,512K    12,032K    52,480K");
        print("----------------  --------   --------   --------");
        print("Total memory       65,152K    12,077K    53,075K\n");
      },
      win() { print("You are already running Windows 98. Nice try!"); },
      echo(args) { print(args.length ? args.join(" ") : "ECHO is on"); },
      exit() { win.close(); },
      cd(args) {
        if (!args.length) { print(FS.display(cwd).toUpperCase()); return; }
        const t = resolve(args[0]);
        const n = FS.get(t);
        if (n && n.t === "d") cwd = FS.norm(t);
        else print("Invalid directory");
      },
      dir(args) {
        const t = resolve(args.filter(a => !a.startsWith("/"))[0]);
        const n = FS.get(t);
        if (!n || n.t !== "d") { print("File not found"); return; }
        print(" Volume in drive C is WIN98");
        print(" Volume Serial Number is 2A4B-11E7");
        print("\n Directory of " + FS.display(t).toUpperCase() + "\n");
        const items = FS.list(t);
        print(".".padEnd(15) + "<DIR>".padEnd(14) + fmtDosDate());
        print("..".padEnd(15) + "<DIR>".padEnd(14) + fmtDosDate());
        let files = 0, dirs = 2, bytes = 0;
        for (const { name, node } of items) {
          const { base, ext } = shortName(name);
          const col = (base.padEnd(9) + ext.padEnd(4)).padEnd(15);
          if (node.t === "d") { dirs++; print(col + "<DIR>".padEnd(14) + fmtDosDate(node.m) + "  " + name); }
          else {
            files++;
            const sz = FS.sizeOf(node); bytes += sz;
            print(col + String(sz).padStart(10).padEnd(14) + fmtDosDate(node.m) + "  " + name);
          }
        }
        print("       " + files + " file(s)" + String(bytes).padStart(14) + " bytes");
        print("       " + dirs + " dir(s)   3,864,254,464 bytes free\n");
      },
      type(args) {
        if (!args.length) { print("Required parameter missing"); return; }
        const t = resolve(args[0]);
        const data = FS.readFile(t);
        if (data == null) { print("File not found - " + args[0].toUpperCase()); return; }
        const s = String(data);
        print(s.startsWith("data:") ? "(binary file)" : s.replace(/\r\n/g, "\n"));
      },
      md(args) {
        if (!args.length) { print("Required parameter missing"); return; }
        if (!FS.mkdir(resolve(args[0]))) print("Unable to create directory");
      },
      mkdir(args) { COMMANDS.md(args); },
      rd(args) {
        if (!args.length) { print("Required parameter missing"); return; }
        const t = resolve(args[0]);
        const n = FS.get(t);
        if (!n || n.t !== "d") { print("Invalid path, not directory,\nor directory not empty."); return; }
        if (Object.keys(n.ch).length && !args.includes("/s")) { print("Invalid path, not directory,\nor directory not empty."); return; }
        FS.del(t);
      },
      rmdir(args) { COMMANDS.rd(args); },
      del(args) {
        if (!args.length) { print("Required parameter missing"); return; }
        const t = resolve(args[0]);
        const n = FS.get(t);
        if (!n) { print("File not found - " + args[0].toUpperCase()); return; }
        if (n.t === "d") { print("Access denied"); return; }
        FS.del(t);
      },
      erase(args) { COMMANDS.del(args); },
      ren(args) {
        if (args.length < 2) { print("Required parameter missing"); return; }
        const err = FS.rename(resolve(args[0]), args[1]);
        if (err) print("Duplicate file name or file not found");
      },
      copy(args) {
        if (args.length < 2) { print("Required parameter missing"); return; }
        const src = resolve(args[0]);
        let dest = resolve(args[1]);
        if (!FS.get(src)) { print("File not found - " + args[0].toUpperCase()); return; }
        const dn = FS.get(dest);
        if (dn && dn.t === "d") {
          if (FS.copyTo(src, dest)) print("        1 file(s) copied");
          else print("Access denied");
        } else {
          const data = FS.readFile(src);
          if (data == null) { print("Access denied"); return; }
          FS.writeFile(dest, data);
          print("        1 file(s) copied");
        }
      },
      tree(args) {
        const t = resolve(args[0]);
        const n = FS.get(t);
        if (!n || n.t !== "d") { print("Invalid path"); return; }
        print("Directory PATH listing");
        print(FS.display(t).toUpperCase());
        (function walk(node, prefix) {
          const dirs = Object.keys(node.ch).filter(k => node.ch[k].t === "d");
          dirs.forEach((k, i) => {
            const isLast = i === dirs.length - 1;
            print(prefix + (isLast ? "└───" : "├───") + k);
            walk(node.ch[k], prefix + (isLast ? "    " : "│   "));
          });
        })(n, "");
      },
      start(args) {
        const map = { notepad: "notepad", calc: "calc", mspaint: "paint", paint: "paint", winmine: "minesweeper", sol: "solitaire", iexplore: "ie", explorer: "explorer", regedit: "regedit", wordpad: "wordpad", write: "wordpad", word: "writer", excel: "spreadsheet", powerpoint: "slides", cdplayer: "cdplayer", mplayer: "media", charmap: "charmap" };
        const id = map[(args[0] || "").toLowerCase()];
        if (id) { W98.launch(id); print(""); }
        else print("Cannot find the file '" + (args[0] || "") + "'");
      },
      edit(args) {
        if (args[0]) {
          const t = resolve(args[0]);
          if (!FS.get(t)) FS.writeFile(t, "");
          W98.launch("notepad", t);
        } else W98.launch("notepad");
      },
      format(args) {
        if ((args[0] || "").toLowerCase().startsWith("c")) {
          print("\nWARNING, ALL DATA ON NON-REMOVABLE DISK");
          print("DRIVE C: WILL BE LOST!");
          print("Proceed with Format (Y/N)? n");
          print("\n(Formatting the only hard drive you have would end this");
          print("nostalgia trip rather abruptly. Request denied.)");
        } else print("Invalid drive specification");
      },
      ping(args) {
        const host = args[0] || "localhost";
        print("\nPinging " + host + " with 32 bytes of data:\n");
        for (let i = 0; i < 4; i++) print("Reply from 127.0.0.1: bytes=32 time<1ms TTL=128");
        print("\nPing statistics: Sent = 4, Received = 4, Lost = 0 (0% loss)");
      },
      attrib(args) {
        const t = resolve(args[0]);
        const n = FS.get(t);
        if (!n) { print("File not found"); return; }
        print("  A          " + FS.display(t).toUpperCase());
      },
      title(args) { win.setTitle(args.join(" ") || "MS-DOS Prompt"); },
      chkdsk() {
        let files = 0, dirs = 0;
        (function walk(n) {
          for (const k in n.ch) {
            if (n.ch[k].t === "d") { dirs++; walk(n.ch[k]); } else files++;
          }
        })(FS.get("C:"));
        const used = FS.sizeOf(FS.get("C:"));
        print(" Volume WIN98 created 06-25-98 12:00a");
        print(" Volume Serial Number is 2A4B-11E7");
        print("");
        print("  4,294,967,296 bytes total disk space");
        print(String(used).padStart(15) + " bytes in " + files + " user files");
        print(String(dirs).padStart(15) + " directories");
        print(String(4294967296 - used).padStart(15) + " bytes available on disk");
        print("");
        print("        655,360 total bytes memory");
        print("        595,000 bytes free");
        print("");
        print("Errors found: none. This disk leads a quiet life.");
      },
      scandisk() { W98.launch("scandisk"); print("Starting ScanDisk for Windows..."); },
      defrag() { W98.launch("defrag"); print("Starting Disk Defragmenter..."); },
      mem() {
        print("");
        print("Memory Type        Total       Used       Free");
        print("----------------  --------   --------   --------");
        print("Conventional          640K       45K        595K");
        print("Upper                 155K      155K          0K");
        print("Extended (XMS)     64,512K   12,208K    52,304K");
        print("----------------  --------   --------   --------");
        print("Total memory       65,307K   12,408K    52,899K");
        print("");
        print("Largest executable program size       595K (609,280 bytes)");
        print("The largest free upper memory block is spoken for.");
      },
      edit(a) {
        print("Starting MS-DOS Editor... just kidding, opening Notepad.");
        W98.launch("notepad", a[0] ? resolve(a[0]) : undefined);
      },
      format(a) {
        const t = (a[0] || "").toUpperCase();
        if (t === "C:" || t === "C") {
          print("WARNING: ALL DATA ON NON-REMOVABLE DISK");
          print("DRIVE C: WILL BE LOST!");
          print("Proceed with Format (Y/N)? n");
          print("");
          print("(The computer answered for you. It likes its data.)");
        } else if (t === "A:" || t === "A") {
          print("Insert new diskette for drive A:");
          print("and press ENTER when ready...");
          print("");
          print("The device is not ready. It has not been ready since 2003.");
        } else print("Required parameter missing - FORMAT <drive:>");
      },
      deltree(a) {
        const t = (a[0] || "").toUpperCase().replace(/\//g, "\\");
        if (t === "C:\\WINDOWS" || t === "C:\\WINDOWS\\") {
          print("Delete directory \"c:\\windows\" and all its subdirectories? [yn] y");
          print("Deleting c:\\windows...");
          setTimeout(() => W98.BSOD.show("DELTREE(00) + VFAT(01)"), 900);
        } else if (!t) print("Required parameter missing - DELTREE [drive:]path");
        else print("Access denied - this recreation is fond of its files.\n(Try the Recycle Bin like a civilized person.)");
      },
      snake() { startSnake(); },
      qbasic() { startBasic(); },
      basic() { startBasic(); },
      ipconfig() {
        print("\nWindows 98 IP Configuration\n");
        print("Ethernet adapter HOMENET:\n");
        print("   IP Address. . . . . . . . . : 192.168.0.2");
        print("   Subnet Mask . . . . . . . . : 255.255.255.0");
        print("   Default Gateway . . . . . . : 192.168.0.1 (the beige box with the lights)\n");
      },
      winipcfg() { COMMANDS.ipconfig(); },
      ping(args) {
        const host = (args[0] || "").toLowerCase();
        if (!host) { print("Usage: ping <host>   (try dave-pc, family-pc, moms-office, fangyuanlin.com)"); return; }
        const HOSTS = {
          "dave-pc": ["192.168.0.3", 1], "family-pc": ["192.168.0.4", 2],
          "moms-office": ["192.168.0.5", 2], "localhost": ["127.0.0.1", 0],
          "127.0.0.1": ["127.0.0.1", 0], "192.168.0.1": ["192.168.0.1", 1],
          "fangyuanlin.com": ["104.21.8.19", 26], "www.fangyuanlin.com": ["104.21.8.19", 26],
          "chaty.ca": ["104.21.8.20", 27]
        };
        const rec = HOSTS[host];
        if (!rec) { print("Bad IP address " + host + ".\n(The 1998 internet has 16 websites. Spelling matters.)"); return; }
        const [ip, base] = rec;
        print("\nPinging " + host + " [" + ip + "] with 32 bytes of data:\n");
        let n = 0;
        const times = [];
        const iv = setInterval(() => {
          if (win.closed || game) { clearInterval(iv); return; }
          const t = Math.max(1, base + ((Math.random() * 5) | 0) - 1);
          times.push(t);
          print("Reply from " + ip + ": bytes=32 time=" + (base === 0 ? "<1" : t) + "ms TTL=128");
          render();
          if (++n >= 4) {
            clearInterval(iv);
            print("\nPing statistics for " + ip + ":");
            print("    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)");
            print("Approximate round trip times: Minimum = " + Math.min(...times) + "ms, Maximum = " + Math.max(...times) + "ms");
            if (host.includes("fangyuanlin")) print("Note: reply arrived from the year 2026. Latency is remarkable, all things considered.");
            render();
          }
        }, 700);
      },
      tracert(args) {
        const host = (args[0] || "fangyuanlin.com").toLowerCase();
        print("\nTracing route to " + host + " over a maximum of 30 hops:\n");
        const hops = [
          "  1     1 ms   192.168.0.1     the beige box with the lights",
          "  2    12 ms   10.56.0.1       your ISP (hi Carl)",
          "  3    31 ms   modem-pool-7    the sound you hear when connecting",
          "  4    48 ms   backbone-east   THE INFORMATION SUPERHIGHWAY",
          host.includes("fangyuanlin") ? "  5    26 ms   time-tunnel-01  crossing into the year 2026..." : "  5    55 ms   web98-core      almost there",
          "  6    ---     " + host + "        Trace complete."
        ];
        let i = 0;
        const iv = setInterval(() => {
          if (win.closed || game) { clearInterval(iv); return; }
          print(hops[i]); render();
          if (++i >= hops.length) clearInterval(iv);
        }, 600);
      },
      netstat() {
        print("\nActive Connections\n");
        print("  Proto  Local Address        Foreign Address      State");
        print("  TCP    192.168.0.2:1025     dave-pc:139          ESTABLISHED (his mp3z folder)");
        print("  TCP    192.168.0.2:1026     irc.chatnet.98:6667  ESTABLISHED");
        print("  TCP    192.168.0.2:1027     tower-bbs:23         TIME_WAIT (the tower remembers)");
        print("  UDP    192.168.0.2:520      *:*                  (listening for the future)");
      },
      gorilla() { startGorilla(); },
      gorillas() { startGorilla(); },
      bsod() { W98.BSOD.show("IFSMGR(01)"); }   // hidden, for connoisseurs
    };

    /* ---------- QBasic: a small but genuine BASIC ---------- */
    function startBasic() {
      let prog = {};
      let inputWait = null;
      const DEMOS = {
        "GUESS": [
          '10 REM guess the number', '20 LET N = 37',
          '30 PRINT "I am thinking of a number from 1 to 100"',
          '40 INPUT G', '50 IF G = N THEN GOTO 90',
          '60 IF G < N THEN PRINT "higher"', '70 IF G > N THEN PRINT "lower"',
          '80 GOTO 40', '90 PRINT "correct! it was 37 all along."', '100 END'
        ],
        "STARS": [
          '10 FOR I = 1 TO 10', '20 PRINT "*" + "*"', '30 NEXT I',
          '40 PRINT "a masterpiece."', '50 END'
        ]
      };
      print("");
      print("QBasic for Windows 98 (nostalgic edition)");
      print("Commands: LIST  RUN  NEW  LOAD \"GUESS\"  LOAD \"STARS\"  SYSTEM");
      print("Enter numbered lines to write a program. ESC or SYSTEM exits. Ready.");

      game = {
        key(e) {
          if (e.key === "Enter") {
            const line = buf; buf = "";
            out += "] " + line + "\n";
            basicExec(line.trim());
            render();
          } else if (e.key === "Backspace") { buf = buf.slice(0, -1); render(); }
          else if (e.key === "Escape") { exitBasic(); }
          else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) { buf += e.key; render(); }
        },
        stop() {}
      };
      function exitBasic() {
        game = null;
        print("");
        print("Bye. (QBasic waves.)");
        render();
      }

      function evalExpr(expr, vars) {
        const toks = String(expr).match(/"[^"]*"|[A-Za-z][A-Za-z0-9]*\$?|\d+\.?\d*|<=|>=|<>|[-+*\/()=<>]/g) || [];
        let i = 0;
        function atom() {
          const t = toks[i++];
          if (t == null) throw new Error("Syntax error");
          if (t === "(") { const v = cmp(); i++; return v; }
          if (t === "-") return -atom();
          if (t[0] === '"') return t.slice(1, -1);
          if (/^\d/.test(t)) return parseFloat(t);
          if (/^[A-Za-z]/.test(t)) {
            const u = t.toUpperCase();
            if (u === "RND") return Math.random();
            if (u === "INT" && toks[i] === "(") { i++; const v = cmp(); i++; return Math.floor(v); }
            const val = vars[u];
            return val != null ? val : (u.endsWith("$") ? "" : 0);
          }
          throw new Error("Syntax error near " + t);
        }
        function term() {
          let v = atom();
          while (toks[i] === "*" || toks[i] === "/") { const op = toks[i++]; const b = atom(); v = op === "*" ? v * b : v / b; }
          return v;
        }
        function sum() {
          let v = term();
          while (toks[i] === "+" || toks[i] === "-") {
            const op = toks[i++]; const b = term();
            v = op === "+" ? ((typeof v === "string" || typeof b === "string") ? String(v) + String(b) : v + b) : v - b;
          }
          return v;
        }
        function cmp() {
          let v = sum();
          while (["=", "<", ">", "<=", ">=", "<>"].includes(toks[i])) {
            const op = toks[i++]; const b = sum();
            v = (op === "=" ? v == b : op === "<" ? v < b : op === ">" ? v > b
               : op === "<=" ? v <= b : op === ">=" ? v >= b : v != b) ? -1 : 0;
          }
          return v;
        }
        return cmp();
      }

      function basicExec(line) {
        if (!line) return;
        if (inputWait) { const fn = inputWait; inputWait = null; fn(line); return; }
        const m = line.match(/^(\d+)\s*(.*)$/);
        if (m) {
          if (m[2]) prog[parseInt(m[1], 10)] = m[2];
          else delete prog[parseInt(m[1], 10)];
          return;
        }
        const up = line.toUpperCase();
        if (up === "LIST") { Object.keys(prog).map(Number).sort((a, b) => a - b).forEach(n => print(n + " " + prog[n])); return; }
        if (up === "NEW") { prog = {}; print("Ok"); return; }
        if (up === "RUN") { runBasic(); return; }
        if (up === "SYSTEM" || up === "EXIT" || up === "BYE") { exitBasic(); return; }
        const lm = up.match(/^LOAD\s+"?(\w+)"?/);
        if (lm) {
          const d = DEMOS[lm[1]];
          if (d) {
            prog = {};
            d.forEach(s2 => { const mm = s2.match(/^(\d+)\s+(.*)$/); prog[parseInt(mm[1], 10)] = mm[2]; });
            print("Loaded " + lm[1] + ".BAS (" + d.length + " lines). Type RUN.");
          } else print("File not found. Demos: GUESS, STARS");
          return;
        }
        /* immediate mode: PRINT and assignments only */
        try {
          if (up.startsWith("PRINT")) { const a = line.slice(5).trim(); print(a ? String(evalExpr(a, imVars)) : ""); }
          else {
            const asn = line.match(/^\s*([A-Za-z][A-Za-z0-9]*\$?)\s*=\s*(.+)$/);
            if (asn) imVars[asn[1].toUpperCase()] = evalExpr(asn[2], imVars);
            else print("?Syntax error");
          }
        } catch (e) { print("?" + e.message); }
      }
      const imVars = {};

      function runBasic() {
        const lines = Object.keys(prog).map(Number).sort((a, b) => a - b);
        if (!lines.length) { print("Nothing to run. (The program is a blank canvas.)"); return; }
        const vars = {}, forStack = [];
        let pc = 0, steps = 0;
        function gotoLine(n) {
          const i = lines.indexOf(n);
          if (i < 0) throw new Error("Undefined line " + n);
          pc = i;
        }
        function exec(s) {
          const t = s.trim(), up = t.toUpperCase();
          if (!t || up.startsWith("REM")) return;
          if (up === "END" || up === "STOP") return "END";
          if (up === "CLS") { out = ""; return; }
          if (up.startsWith("PRINT")) { const a = t.slice(5).trim(); print(a ? String(evalExpr(a, vars)) : ""); return; }
          if (up.startsWith("GOTO")) { gotoLine(parseInt(t.slice(4).trim(), 10)); return; }
          if (up.startsWith("LET ")) {
            const mm = t.slice(4).match(/^\s*([A-Za-z][A-Za-z0-9]*\$?)\s*=\s*(.+)$/);
            if (!mm) throw new Error("Syntax error in LET");
            vars[mm[1].toUpperCase()] = evalExpr(mm[2], vars);
            return;
          }
          if (up.startsWith("IF ")) {
            const mm = t.match(/^IF\s+(.+?)\s+THEN\s+(.+)$/i);
            if (!mm) throw new Error("Syntax error in IF");
            if (evalExpr(mm[1], vars) !== 0) {
              const then = mm[2].trim();
              if (/^\d+$/.test(then)) gotoLine(parseInt(then, 10));
              else return exec(then);
            }
            return;
          }
          if (up.startsWith("INPUT")) {
            const vn = t.slice(5).trim().replace(/^"[^"]*"\s*[;,]?\s*/, "").toUpperCase();
            if (!vn) throw new Error("INPUT needs a variable");
            print("? ");
            inputWait = (val) => {
              const num = parseFloat(val);
              vars[vn] = (vn.endsWith("$") || isNaN(num)) ? val : num;
              try { step(); } catch (e2) { print("?" + e2.message); }
            };
            return "INPUT";
          }
          if (up.startsWith("FOR ")) {
            const mm = t.match(/^FOR\s+([A-Za-z][A-Za-z0-9]*)\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i);
            if (!mm) throw new Error("Syntax error in FOR");
            const v = mm[1].toUpperCase();
            vars[v] = evalExpr(mm[2], vars);
            forStack.push({ v, to: evalExpr(mm[3], vars), st: mm[4] ? evalExpr(mm[4], vars) : 1, afterIdx: pc });
            return;
          }
          if (up.startsWith("NEXT")) {
            const f = forStack[forStack.length - 1];
            if (!f) throw new Error("NEXT without FOR");
            vars[f.v] += f.st;
            if ((f.st > 0 && vars[f.v] <= f.to) || (f.st < 0 && vars[f.v] >= f.to)) pc = f.afterIdx;
            else forStack.pop();
            return;
          }
          const asn = t.match(/^\s*([A-Za-z][A-Za-z0-9]*\$?)\s*=\s*(.+)$/);
          if (asn) { vars[asn[1].toUpperCase()] = evalExpr(asn[2], vars); return; }
          throw new Error("Syntax error: " + t.slice(0, 24));
        }
        function step() {
          while (pc < lines.length) {
            if (++steps > 20000) { print("?Halted after 20000 steps. Check your GOTOs."); return; }
            const src2 = prog[lines[pc]];
            pc++;
            const r = exec(src2);
            if (r === "END") { print("Ok"); return; }
            if (r === "INPUT") return;
          }
          print("Ok");
        }
        try { step(); } catch (e) { print("?" + e.message); }
      }
    }

    /* ---------- GORILLA: explosive banana artillery, text mode ---------- */
    function startGorilla() {
      const GW = 62, GH = 20, G = 0.011;
      let grid, gx = [4, GW - 5], gy = [0, 0], wind = 0;
      let turn = 0, score = [0, 0], stage = "angle", angle = 45, vel = 0, lineBuf2 = "";
      let flying = null, flyTimer = null;

      function buildCity() {
        grid = [];
        for (let y = 0; y < GH; y++) grid.push(new Array(GW).fill(" "));
        let x2 = 0;
        while (x2 < GW - 3) {
          const bw = 5 + ((Math.random() * 5) | 0);
          const bh = 4 + ((Math.random() * 9) | 0);
          for (let bx = x2; bx < Math.min(GW, x2 + bw); bx++)
            for (let by = GH - bh; by < GH; by++)
              grid[by][bx] = (by === GH - bh) ? "_" : (((bx + by) % 3 === 0) ? "#" : "█");
          x2 += bw + 1;
        }
        /* gorillas stand on their buildings */
        [0, 1].forEach(i => {
          const col = gx[i];
          let top = GH - 1;
          for (let y = 0; y < GH; y++) if (grid[y][col] !== " ") { top = y; break; }
          gy[i] = top - 1;
          if (gy[i] < 0) gy[i] = 0;
        });
        wind = ((Math.random() * 9) | 0) - 4;
      }
      function drawCity(msg, banana) {
        const g2 = grid.map(r => r.slice());
        [0, 1].forEach(i => { if (gy[i] >= 0 && gy[i] < GH) g2[gy[i]][gx[i]] = "G"; });
        if (banana && banana.y >= 0 && banana.y < GH && banana.x >= 0 && banana.x < GW)
          g2[banana.y | 0][banana.x | 0] = "o";
        const windStr = wind === 0 ? "calm" : (wind > 0 ? ">".repeat(wind) : "<".repeat(-wind));
        screen.textContent =
          " GORILLA.EXE   P1: " + score[0] + "   P2(CPU): " + score[1] + "   wind: " + windStr + "\n" +
          g2.map(r => r.join("")).join("\n") + "\n" +
          (msg || "") + (stage === "angle" || stage === "vel" ? " " + lineBuf2 : "");
        screen.append(el("span", { class: "cursor" }));
        screen.scrollTop = 0;
      }
      function promptTurn() {
        stage = "angle"; lineBuf2 = "";
        if (turn === 1) { drawCity(" CPU is aiming..."); const t = setTimeout(cpuThrow, 900); timers2.push(t); }
        else drawCity(" P1 — angle (0-90)?");
      }
      const timers2 = [];
      function cpuThrow() {
        /* the CPU estimates with era-appropriate confidence */
        const a = 40 + Math.random() * 25;
        const v = 0.55 + Math.abs(gx[1] - gx[0]) * 0.006 + (Math.random() - 0.5) * 0.16;
        launchBanana(1, a, v * 100);
      }
      function launchBanana(who, aDeg, vRaw) {
        stage = "flying";
        const a = aDeg * Math.PI / 180;
        const v = Math.max(10, Math.min(100, vRaw)) / 100;
        const dir = who === 0 ? 1 : -1;
        flying = { x: gx[who] + dir, y: gy[who] - 1, vx: Math.cos(a) * v * 1.6 * dir, vy: -Math.sin(a) * v * 1.35, who };
        const t0 = performance.now();
        let last = t0;
        flyTimer = setInterval(() => {
          if (win.closed || !game) { clearInterval(flyTimer); return; }
          const now = performance.now();
          let steps = Math.min(20, Math.max(1, Math.round((now - last) / 60)));
          last = now;
          while (steps--) {
            flying.vx += wind * 0.0011;
            flying.vy += G * 2.2;
            flying.x += flying.vx;
            flying.y += flying.vy;
            const cx = flying.x | 0, cy = flying.y | 0;
            if (cx < 0 || cx >= GW || cy >= GH) { endThrow(" splash — clean miss."); return; }
            if (cy >= 0) {
              const other = flying.who === 0 ? 1 : 0;
              if (cx === gx[other] && cy === gy[other]) { hit(other); return; }
              if (cx === gx[flying.who] && cy === gy[flying.who]) { hit(flying.who, true); return; }
              if (grid[cy][cx] !== " ") { crater(cx, cy); endThrow(" BOOM — the building takes one for the team."); return; }
            }
          }
          drawCity("", flying);
        }, 60);
        timers2.push(flyTimer);
      }
      function crater(cx, cy) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) {
          const yy = cy + dy, xx = cx + dx;
          if (yy >= 0 && yy < GH && xx >= 0 && xx < GW && Math.abs(dx) + Math.abs(dy) < 3) grid[yy][xx] = " ";
        }
        Sound.play("error");
      }
      function hit(victim, own) {
        clearInterval(flyTimer);
        const thrower = flying.who;
        score[own ? (thrower === 0 ? 1 : 0) : thrower]++;
        Sound.play("tada");
        drawCity(own ? " you hit YOURSELF. the CPU respects the chaos. rebuilding city..." : (victim === 1 ? " DIRECT HIT! the CPU gorilla is avenged by gravity. rebuilding..." : " the CPU got you. rebuilding city..."));
        const t = setTimeout(() => {
          if (score[0] >= 3 || score[1] >= 3) {
            drawCity(score[0] > score[1] ? " YOU WIN THE MATCH 🍌 — ESC to return to DOS, Enter for rematch" : " CPU wins. it has been practicing since 1991. ESC exits, Enter rematches");
            stage = "over";
            return;
          }
          buildCity(); turn = flying.who === 0 ? 1 : 0; promptTurn();
        }, 1600);
        timers2.push(t);
      }
      function endThrow(msg) {
        clearInterval(flyTimer);
        drawCity(msg);
        const t = setTimeout(() => { turn = turn === 0 ? 1 : 0; promptTurn(); }, 1100);
        timers2.push(t);
      }

      buildCity();
      game = {
        key(e) {
          if (e.key === "Escape") {
            timers2.forEach(t => { clearTimeout(t); clearInterval(t); });
            game = null;
            print("");
            print("GORILLA.EXE exited. Final: P1 " + score[0] + " — CPU " + score[1]);
            render();
            return;
          }
          if (stage === "over" && e.key === "Enter") { score = [0, 0]; buildCity(); turn = 0; promptTurn(); return; }
          if (turn !== 0) return;
          if (stage === "angle" || stage === "vel") {
            if (e.key === "Enter") {
              const n = parseFloat(lineBuf2);
              lineBuf2 = "";
              if (isNaN(n)) { drawCity(stage === "angle" ? " P1 — angle (0-90)?" : " P1 — velocity (10-100)?"); return; }
              if (stage === "angle") { angle = Math.max(0, Math.min(90, n)); stage = "vel"; drawCity(" P1 — velocity (10-100)?"); }
              else { vel = n; launchBanana(0, angle, vel); }
            } else if (e.key === "Backspace") { lineBuf2 = lineBuf2.slice(0, -1); drawCity(stage === "angle" ? " P1 — angle (0-90)?" : " P1 — velocity (10-100)?"); }
            else if (/^[\d.]$/.test(e.key)) { lineBuf2 += e.key; drawCity(stage === "angle" ? " P1 — angle (0-90)?" : " P1 — velocity (10-100)?"); }
          }
        },
        stop() { timers2.forEach(t => { clearTimeout(t); clearInterval(t); }); }
      };
      turn = 0;
      promptTurn();
    }

    /* ---------- SNAKE.EXE: a text-mode intermission ---------- */
    let game = null;
    function startSnake() {
      const GW = 38, GH = 18;
      let snake = [{ x: 19, y: 9 }, { x: 18, y: 9 }, { x: 17, y: 9 }];
      let dir = { x: 1, y: 0 }, nextDir = dir, food = null, score = 0, dead = false, grow = 0;
      const hi = () => Store.get("dosSnakeHigh", 0);
      function placeFood() {
        do { food = { x: 1 + ((Math.random() * (GW - 2)) | 0), y: 1 + ((Math.random() * (GH - 2)) | 0) }; }
        while (snake.some(s => s.x === food.x && s.y === food.y));
      }
      placeFood();
      function drawG() {
        const g = [];
        for (let y = 0; y < GH; y++) {
          const row = [];
          for (let x2 = 0; x2 < GW; x2++) row.push((y === 0 || y === GH - 1) ? "═" : (x2 === 0 || x2 === GW - 1) ? "║" : " ");
          g.push(row);
        }
        g[0][0] = "╔"; g[0][GW - 1] = "╗"; g[GH - 1][0] = "╚"; g[GH - 1][GW - 1] = "╝";
        snake.forEach((s, i) => { g[s.y][s.x] = i === 0 ? "@" : "o"; });
        g[food.y][food.x] = "*";
        screen.textContent =
          " SNAKE.EXE   score: " + score + "   high: " + Math.max(hi(), score) + "   (arrows steer, ESC quits)\n" +
          g.map(r => r.join("")).join("\n") +
          (dead ? "\n\n   The snake regrets nothing. ESC to return to DOS." : "");
        screen.scrollTop = 0;
      }
      function tick() {
        if (dead) return;
        dir = nextDir;
        const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (h.x <= 0 || h.x >= GW - 1 || h.y <= 0 || h.y >= GH - 1 || snake.some(s => s.x === h.x && s.y === h.y)) {
          dead = true;
          if (score > hi()) Store.set("dosSnakeHigh", score);
          Sound.play("error");
          drawG();
          return;
        }
        snake.unshift(h);
        if (h.x === food.x && h.y === food.y) { score += 10; grow += 2; placeFood(); Sound.play("click"); }
        if (grow > 0) grow--; else snake.pop();
        drawG();
      }
      const iv = setInterval(tick, 110);
      game = {
        key(e) {
          if (e.key === "Escape") {
            clearInterval(iv);
            game = null;
            print("");
            print("SNAKE.EXE exited. Score: " + score + "   All-time: " + hi());
            render();
            return;
          }
          const m = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } }[e.key];
          if (m && !(m.x === -dir.x && m.y === -dir.y)) nextDir = m;
        },
        stop() { clearInterval(iv); }
      };
      drawG();
    }

    function exec(line) {
      out += prompt() + line + "\n";
      const parts = line.trim().split(/\s+/);
      const cmd = (parts[0] || "").toLowerCase();
      const args = parts.slice(1);
      if (!cmd) { render(); return; }
      // drive letter switch like C:
      if (/^[a-z]:$/i.test(cmd)) {
        if (cmd.toLowerCase() === "c:") cwd = "C:";
        else print("Invalid drive specification");
        render(); return;
      }
      if (cmd.startsWith("cd\\")) { COMMANDS.cd([cmd.slice(2) || "C:"]); render(); return; }
      if (cmd.startsWith("cd..")) { COMMANDS.cd([".."]); render(); return; }
      if (COMMANDS[cmd]) COMMANDS[cmd](args);
      else {
        // maybe it's a file in cwd (a .exe / .txt)
        const t = resolve(cmd);
        const n = FS.get(t);
        if (n && n.t === "f" && String(n.data || "").startsWith("app:")) W98.launch(n.data.slice(4));
        else print("Bad command or file name");
      }
      if (!game) render();
    }

    screen.addEventListener("mousedown", () => setTimeout(() => hiddenInput.focus(), 0));
    const hiddenInput = el("textarea", { style: "position:absolute;left:-1000px;top:0;width:10px;height:10px;opacity:0", spellcheck: "false" });
    win.body.append(hiddenInput);
    hiddenInput.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (game) { e.preventDefault(); game.key(e); return; }
      if (e.key === "Enter") {
        e.preventDefault();
        const line = buf; buf = "";
        if (line.trim()) { history.push(line); histIdx = history.length; }
        exec(line);
      } else if (e.key === "Backspace") { buf = buf.slice(0, -1); render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (histIdx > 0) { histIdx--; buf = history[histIdx] || ""; render(); } }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (histIdx < history.length) { histIdx++; buf = history[histIdx] || ""; render(); } }
      else if (e.key === "Escape") { buf = ""; render(); }
      else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) { buf += e.key; render(); e.preventDefault(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        navigator.clipboard.readText().then(t => { buf += t.replace(/\n/g, ""); render(); }).catch(() => {});
      }
    });
    // fallback for input methods that do not produce per-key keydown events (IME, synthetic typing)
    hiddenInput.addEventListener("input", () => {
      const v = hiddenInput.value;
      if (!v) return;
      if (game) { hiddenInput.value = ""; return; }
      hiddenInput.value = "";
      for (const ch of v) {
        if (ch === "\n" || ch === "\r") {
          const line = buf; buf = "";
          if (line.trim()) { history.push(line); histIdx = history.length; }
          exec(line);
        } else buf += ch;
      }
      if (!game) render();
    });
    win.opts.onFocus = () => setTimeout(() => hiddenInput.focus(), 0);
    win.opts.onClose = () => { if (game) game.stop(); };

    render();
    setTimeout(() => hiddenInput.focus(), 100);
    return win;
  }
};

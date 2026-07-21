/* icons.js — pixel-art icon factory (all original artwork) */
"use strict";
const Icons = W98.Icons = (() => {
  const P = {
    k:"#000000", w:"#ffffff", g:"#c0c0c0", d:"#808080", D:"#404040",
    y:"#ffff00", Y:"#808000", r:"#ff0000", m:"#800000", G:"#00ff00",
    e:"#008000", b:"#0000ff", n:"#000080", c:"#00ffff", C:"#008080",
    o:"#ff8000", p:"#ff00ff", t:"#ffffcc", s:"#87ceeb"
  };

  const maps = {};

  maps.folder = `
................
.kkkkk..........
kyyyyyk.........
kywwwwkkkkkkkkk.
kywyyyyyyyyyyyk.
kywyyyyyyyyyyyk.
kywyyyyyyyyyyyk.
kywyyyyyyyyyyyk.
kywyyyyyyyyyyyk.
kywyyyyyyyyyyyk.
kywyyyyyyyyyyyk.
kyYYYYYYYYYYYYk.
kkkkkkkkkkkkkkk.
................
................
................`;

  maps.folderopen = `
................
.kkkkk..........
kyyyyyk.........
kywwwwkkkkkkkk..
kywyyyyyyyyyyk..
kyykkkkkkkkkkkkk
kykyyyyyyyyyyyyk
kykyyyyyyyyyyyk.
kkyyyyyyyyyyyyk.
kyyyyyyyyyyyyk..
kyyyyyyyyyyyyk..
kYYYYYYYYYYYYk..
kkkkkkkkkkkkk...
................
................
................`;

  maps.mycomputer = `
.kkkkkkkkkkkk...
kggggggggggggk..
kgwwwwwwwwwwdk..
kgwccccccccndk..
kgwccccccccndk..
kgwcccwccccndk..
kgwccccccccndk..
kgwnnnnnnnnndk..
kgddddddddgddk..
kkkkkkkkkkkkkk..
...kgggdk.......
..kkkkkkkkk.....
.kggggggggdk....
kgwwwwwwwggdk...
kgdddddddgGdk...
kkkkkkkkkkkkk...`;

  maps.mydocs = `
.kkkkk..........
kyyyyyk.........
kywwwwkkkkkkkkk.
kywyyyyyyyyyyyk.
kywykkkkkkkkyyk.
kywykwwwwwwkyyk.
kywykwkkkwwkyyk.
kywykwwwwwwkyyk.
kywykwkkkkwkyyk.
kywykwwwwwwkyyk.
kywykwkkkwwkyyk.
kyYYkwwwwwwkYYk.
kkkkkkkkkkkkkkk.
................
................
................`;

  maps.recycle = `
.....kkkkkk.....
...kkggggggkk...
..kdggggggggdk..
..kkkkkkkkkkkk..
...kggggggggk...
...kgkgeegkgk...
...kgkeGGekgk...
...kgkGeeGkgk...
...kgkeGGekgk...
...kgkgeegkgk...
...kgkggggkgk...
....kgggggdk....
....kdgggddk....
.....kkkkkk.....
................
................`;

  maps.recyclefull = `
..kww.kkkkkk....
..kwwkggggggkk..
.kwwwdggggggdk..
.kkwkkkkkkkkkk..
..kwgggggggwk...
...kgkgeegkgk...
...kgkeGGekgk...
...kgkGeeGkgk...
...kgkeGGekgk...
...kgkgeegkgk...
...kgkggggkgk...
....kgggggdk....
....kdgggddk....
.....kkkkkk.....
................
................`;

  maps.network = `
kkkkkkkk........
kggggggk........
kgccccdk........
kgccccdk........
kgddddgk........
kkkkkkkk........
...kk...........
...kk...........
...kkkkkkkkk....
..........kk....
........kkkkkkkk
........kggggggk
........kgccccdk
........kgccccdk
........kgddddgk
........kkkkkkkk`;

  maps.ie = `
................
.....kkkkkk.....
...kkbbbbbbkk...
..kbbbkkkkbbbk..
.kbbk......kbbk.
.kbk........kbk.
kbbk..kkkk..kbbk
kbk..kbbbbk..obk
kbk.kbbkkbbkoook
kbk.kbbbbbboook.
kbk.kbbkkkoook..
kbbk.kbbboookbk.
.kbk..kkoook.k..
.kbbk..oook.....
..kbbkoook......
....kkok........`;

  maps.notepad = `
..kkkkkkkkkkk...
.kwwwwwwwwwwwk..
.kwkwkwkwkwkwk..
.kwwwwwwwwwwwk..
kwwwwwwwwwwwwwk.
kwddddddddddwwk.
kwwwwwwwwwwwwwk.
kwddddddddwwwwk.
kwwwwwwwwwwwwwk.
kwddddddddddwwk.
kwwwwwwwwwwwwwk.
kwdddddwwwwwwwk.
kwwwwwwwwwwwwwk.
kwwwwwwwwwwwwwk.
kkkkkkkkkkkkkkk.
................`;

  maps.paint = `
................
....kkkkkkk.....
..kkgggggggkk...
.kggggggggggdk..
.kgrrkgggkbbdk..
kggrrkgggkbbggk.
kggkkgggggkkggk.
kgggggggggggggk.
kggyykggggkGGgk.
kggyykkddkkGGgk.
.kggkkdddkkggk..
.kdgggkkkggggk..
..kkdddddddkk...
....kkkkkkk.....
......kwk.......
.....kwwwk......`;

  maps.calc = `
.kkkkkkkkkkkkk..
kgggggggggggggk.
kgkkkkkkkkkkkgk.
kgkwwwwwwwwwkgk.
kgkkkkkkkkkkkgk.
kggggggggggggggk
kgkkkgkkkgkkkgk.
kgkbkgkbkgkrkgk.
kggggggggggggggk
kgkkkgkkkgkkkgk.
kgkwkgkwkgkbkgk.
kggggggggggggggk
kgkkkgkkkgkkkgk.
kgkwkgkwkgkbkgk.
kgggggggggggggk.
.kkkkkkkkkkkkk..`;

  maps.minesweeper = `
................
.......k........
...k...k...k....
....k.kkk.k.....
.....kkkkk......
...kkkkwkkkk....
..kkkwkkkkkkk...
.kkkkkkkkkkkkk..
.kkkkkkkkkkkkk..
kkkkkkkkkkkkkkk.
.kkkkkkkkkkkkk..
.kkkkkkkkkkkkk..
..kkkkkkkkkkk...
...kkkkkkkkk....
....k.kkk.k.....
...k...k...k....`;

  maps.solitaire = `
.kkkkkkkk.......
.kwwwwwwkkkkkkk.
.kwrrwwwkwwwwwk.
.kwrrwwwkwkkwwk.
.kwwwwwwkkkkkwk.
.kwwrwwwkwkkkwk.
.kwrrrwwkwwkwwk.
.kwrrrwwkwkkkwk.
.kwwrwwwkwwwwwk.
.kwwwwwwkwkkwwk.
.kwwwwwwkwkkwwk.
.kwwrrwwkwwwwwk.
.kwwrrwwkwwwwwk.
.kwwwwwwkwwwwwk.
.kkkkkkkkkkkkkk.
................`;

  maps.dos = `
kkkkkkkkkkkkkkkk
kggggggggggggggk
kgkkkkkkkkkkkkgk
kgkkkkkkkkkkkkgk
kgkwkkkkkkkkkkgk
kgkwwkkkkkkkkkgk
kgkwwwkkkkkkkkgk
kgkwwkkkkkkkkkgk
kgkwkkkwwwkkkkgk
kgkkkkkkkkkkkkgk
kgkkkkkkkkkkkkgk
kgkkkkkkkkkkkkgk
kggggggggggggggk
kkkkkkkkkkkkkkkk
....kkkkkkkk....
..kkkkkkkkkkkk..`;

  maps.help = `
................
..kkkkkkkkkk....
.knnnnnnnnnnk...
.knnnnnnnnnnnk..
.knnkkkkkknnnk..
.knnnnnnnknnnk..
.knnnnnnkknnnk..
.knnnnnkknnnnk..
.knnnnkknnnnnk..
.knnnnkknnnnnk..
.knnnnnnnnnnnk..
.knnnnkknnnnnk..
.knnnnkknnnnnk..
.knnnnnnnnnnk...
..kkkkkkkkkk....
................`;

  maps.find = `
kkkkkkkkkk......
kwwwwwwwwk......
kwddwddwwk......
kwwwwwwwwk......
kwddwwkkkkk.....
kwwwwkwwwwk.....
kwddkwkddwwk....
kwwwkwkwwwwk....
kwddkwkddwwk....
kwwwwkwwwwk.....
kwwwwwkkkkkk....
kkkkkkkkkwwkk...
.........kwwkk..
..........kwwkk.
...........kwwk.
............kk..`;

  maps.run = `
kkkkkkkkkkkkkk..
knnnnnnnnnnnnk..
kwwwwwwwwwwwwk..
kwwwwwwwwwwwwk..
kwwkkwwwwwwwwk..
kwkggkkkkkwwwk..
kwkgggggggkwwk..
kwwkggggggkwwk..
kwwwkggkkkwwwk..
kwwkkgkkwwwwwk..
kwkggggkwwwwwk..
kwkgggggkwwwwk..
kwwkkkkkkwwwwk..
kwwwwwwwwwwwwk..
kkkkkkkkkkkkkk..
................`;

  maps.settings = `
................
..kkkkkkkkkkkk..
.kggggggggggggk.
.kgwwwwwwwwwwdk.
.kgwrrwwwwbbwdk.
.kgwrrwwwwbbwdk.
.kgwwwwkkwwwwdk.
.kgwwwwkkwwwwdk.
.kgwGGwkkwyywdk.
.kgwGGwkkwyywdk.
.kgwwwwwwwwwwdk.
.kgwwkkkkkwwwdk.
.kgwwwwwwwwwwdk.
.kgddddddddddgk.
..kkkkkkkkkkkk..
................`;

  maps.shutdown = `
.kkkkkkkkkkkk...
kggggggggggggk..
kgwwwwwwwwwwdk..
kgwnnnnnnnnndk..
kgwnnnkknnnndk..
kgwnnkknknnndk..
kgwnkknnnknndk..
kgwnkknnnknndk..
kgwnnkknknnndk..
kgwnnnkknnnndk..
kgwnnnnnnnnndk..
kgddddddddddgk..
kkkkkkkkkkkkkk..
...kgggggdk.....
..kkkkkkkkkk....
.kggggggggggk...`;

  maps.logoff = `
................
....kkkkkk......
...kyyyyyyk.....
...kyykkyyk.....
...kyykkyyk.....
...kyyyyyyk.....
....kyyyyk......
.....kyyk.......
.....kyyk.......
.....kyykk......
.....kyykyk.....
.....kyykk......
.....kyyk.......
.....kyykk......
......kykyk.....
.......kkk......`;

  maps.programs = `
.kkkkk..........
kyyyyyk.........
kywwwwkkkkkkkkk.
kywyyyyyyyyyyyk.
kywykkkkkkkkyyk.
kywyknnnnnnkyyk.
kywykwwwwwwkyyk.
kywykwkkkwwkyyk.
kywykwwwwwwkyyk.
kywykwwkkwwkyyk.
kywykwwwwwwkyyk.
kyYYkkkkkkkkYYk.
kkkkkkkkkkkkkkk.
................
................
................`;

  maps.favorites = `
.kkkkk..........
kyyyyyk.........
kywwwwkkkkkkkkk.
kywyyyyyyyyyyyk.
kywyyyykkyyyyyk.
kywyyyykkyyyyyk.
kywyykkkkkkyyyk.
kywykyykkyykyyk.
kywyyykkkkyyyyk.
kywyykkyykkyyyk.
kywyykyyyykyyyk.
kyYYYYYYYYYYYYk.
kkkkkkkkkkkkkkk.
................
................
................`;

  maps.drivec = `
................
................
................
................
.kkkkkkkkkkkkkk.
kggggggggggggggk
kgwwwwwwwwwwwwdk
kgwggggggggggddk
kgggggggggkGkgdk
kgddddddddddddgk
kkkkkkkkkkkkkkkk
................
................
................
................
................`;

  maps.floppy = `
.kkkkkkkkkkkkk..
kggkwwwwwwkggdk.
kggkwkkkkwkggdk.
kggkwkkkkwkggdk.
kggkwkkkkwkggdk.
kggkwwwwwwkggdk.
kgggggggggggggk.
kggggggggggggdk.
kggkkkkkkkkkgdk.
kggkwwwwwwwkgdk.
kggkwkkkkkwkgdk.
kggkwwwwwwwkgdk.
kggkwkkkkkwkgdk.
kggkwwwwwwwkgdk.
.kkkkkkkkkkkkk..
................`;

  maps.cdrom = `
................
.....kkkkkk.....
...kkcccccckk...
..kcccccccccck..
.kcccccccccccck.
.kccckkkkkcccck.
kccckwwwwwkcccck
kcckwwkkkwwkccck
kcckwkcckkwkccck
kcckwwkkkwwkccck
kccckwwwwwkcccck
.kccckkkkkccccc.
.kcccccccccccck.
..kcccccccccck..
...kkcccccckk...
.....kkkkkk.....`;

  maps.file = `
..kkkkkkkkk.....
..kwwwwwwwkk....
..kwwwwwwwkwk...
..kwwwwwwwkkkk..
..kwwwwwwwwwwk..
..kwwwwwwwwwwk..
..kwwwwwwwwwwk..
..kwwwwwwwwwwk..
..kwwwwwwwwwwk..
..kwwwwwwwwwwk..
..kwwwwwwwwwwk..
..kwwwwwwwwwwk..
..kwwwwwwwwwwk..
..kwwwwwwwwwwk..
..kkkkkkkkkkkk..
................`;

  maps.textfile = `
..kkkkkkkkk.....
..kwwwwwwwkk....
..kwwwwwwwkwk...
..kwwwwwwwkkkk..
..kwddddddwwwk..
..kwwwwwwwwwwk..
..kwddddddddwk..
..kwwwwwwwwwwk..
..kwddddddddwk..
..kwwwwwwwwwwk..
..kwddddddddwk..
..kwwwwwwwwwwk..
..kwdddddwwwwk..
..kwwwwwwwwwwk..
..kkkkkkkkkkkk..
................`;

  maps.imagefile = `
..kkkkkkkkk.....
..kwwwwwwwkk....
..kwwwwwwwkwk...
..kwwwwwwwkkkk..
..kwkkkkkkkkwk..
..kwkssssssswk..
..kwksskyksswk..
..kwkssyyyksswk..
..kwkseeesesswk..
..kwkeeeeeeeswk..
..kwkkkkkkkkkwk..
..kwwwwwwwwwwk..
..kwwwwwwwwwwk..
..kwwwwwwwwwwk..
..kkkkkkkkkkkk..
................`;

  maps.exefile = `
..kkkkkkkkk.....
..kwwwwwwwkk....
..kwwwwwwwkwk...
..kwwwwwwwkkkk..
..kwkkkkkkkkwk..
..kwknnnnnnkwk..
..kwkwwwwwwkwk..
..kwkwkwkwwkwk..
..kwkwwwwwwkwk..
..kwkwwkkwwkwk..
..kwkwwwwwwkwk..
..kwkkkkkkkkwk..
..kwwwwwwwwwwk..
..kwwwwwwwwwwk..
..kkkkkkkkkkkk..
................`;

  maps.display = `
.kkkkkkkkkkkkk..
kgggggggggggggk.
kgwwwwwwwwwwwdk.
kgwrrrryyyywwdk.
kgwrrrryyyywwdk.
kgwGGGGbbbbwwdk.
kgwGGGGbbbbwwdk.
kgwwwwwwwwwwwdk.
kgdddddddddddgk.
kkkkkkkkkkkkkkk.
.....kgggdk.....
....kkkkkkkk....
...kggggggggk...
..kgwwwwwwwgdk..
..kgdddddddgdk..
..kkkkkkkkkkkk..`;

  maps.datetime = `
....kkkkkkk.....
...kwwwwwwwk....
..kwwwkwkwwwk...
.kwwkwwwwwkwwk..
.kwwwwwkwwwwwk..
kwwkwwwkwwwkwwk.
kwwwwwwkwwwwwwk.
kwkwwwwkkkwwkwk.
kwwwwwwwwwwwwwk.
kwwkwwwwwwwkwwk.
.kwwwwwwwwwwwk..
.kwwkwwwwwkwwk..
..kwwwkwkwwwk...
...kwwwwwwwk....
....kkkkkkk.....
................`;

  maps.sounds = `
................
.........kk.....
........kwk.....
.......kwwk.....
..kkkkkwwwk..k..
..kwwwwwwwk.kwk.
..kwwwwwwwk..kwk
..kwwwwwwwk.k.kw
..kwwwwwwwk.kw.k
..kwwwwwwwk.kw.k
..kwwwwwwwk.k.kw
..kwwwwwwwk..kwk
..kkkkkwwwk.kwk.
.......kwwk..k..
........kwk.....
.........kk.....`;

  maps.system = `
.kkkkkkkkkkkk...
kggggggggggggk..
kgwwwwwwwwwwdk..
kgwnnnnnnnnndk..
kgwnwnwnwnwndk..
kgwnnnnnnnnndk..
kgwnwwwwwwnndk..
kgwnnnnnnnnndk..
kgddddddddddgk..
kkkkkkkkkkkkkk..
...kgggggdk.....
..kkkkkkkkkk....
.kggggggggggk...
kgwwwwwwwwwggk..
kgddddddddGggk..
kkkkkkkkkkkkkk..`;

  maps.tree_pc = maps.mycomputer;

  maps.volume = `
................
........kk......
.......kwk......
......kwwk......
.kkkkkwwwk......
.kwwwwwwwk......
.kwwwwwwwk......
.kwwwwwwwk......
.kwwwwwwwk......
.kkkkkwwwk......
......kwwk......
.......kwk......
........kk......
................
................
................`;

  maps.startflag = `
................
................
..kk............
.krrkkkkgggg....
.krrrkkkgggg....
.krrrkkkgggg....
kkrrrkkkgggg....
.kkkkkkkkkkk....
.kbbbkkkyyyy....
kkbbbkkkyyyy....
.kbbbkkkyyyy....
..kbbkkkyyyy....
...kk...........
................
................
................`;

  maps.tb_back = `
................
................
................
......k.........
.....kk.........
....kck.........
...kcck.........
..kccckkkkkkkk..
.kcccccccccccck.
..kccckkkkkkkk..
...kcck.........
....kck.........
.....kk.........
......k.........
................
................`;
  maps.tb_fwd = `
................
................
................
.........k......
.........kk.....
.........kck....
.........kcck...
..kkkkkkkkccck..
.kcccccccccccck.
..kkkkkkkkccck..
.........kcck...
.........kck....
.........kk.....
.........k......
................
................`;
  maps.tb_up = `
.kkkkk..........
kyyyyyk.........
kywwwwkkkkkkkkk.
kywyyyyyyyyyyyk.
kyyyyyykkyyyyyk.
kyyyyykkkkyyyyk.
kyyyykkkkkkyyyk.
kyyykkkkkkkkyyk.
kyyyyykkkkyyyyk.
kyyyyykkkkyyyyk.
kyyyyykkkkyyyyk.
kyYYYYkkkkYYYYk.
kkkkkkkkkkkkkkk.
................
................
................`;
  maps.tb_cut = `
................
...k.....k......
...k.....k......
...k.....k......
...kk...kk......
....k...k.......
....kk.kk.......
.....kkk........
.....kkk........
....kkkkk.......
...kk.k.kk......
..kk..k..kk.....
..k...k...k.....
..k...k...k.....
...kkk.kkk......
................`;
  maps.tb_copy = `
..kkkkkkkk......
..kwwwwwwk......
..kwddddwk......
..kwwwwwwkkkk...
..kwddddkwwwk...
..kwwwwwkddwkk..
..kwddddkwwwkwk.
..kwwwwwkddwkkk.
..kwddddkwwwwwk.
..kkkkkkkwddddk.
........kwwwwwk.
........kwddddk.
........kwwwwwk.
........kkkkkkk.
................
................`;
  maps.tb_paste = `
....kkkkkk......
..kkkgggkkkk....
..kgkkkkkkgk....
..kggggggggk....
..kgwwwwwwgk....
..kgwddddwgk....
..kgwwwwwwgkkk..
..kgwddkwwwwwk..
..kgwwwkwdddwkk.
..kgwddkwwwwkwk.
..kgwwwkwddwkkk.
..kgwwwkwwwwwwk.
..kggggkwddddwk.
..kkkkkkwwwwwwk.
.......kkkkkkkk.
................`;
  maps.tb_del = `
................
..kk.......kk...
..krrk...krrk...
...krrk.krrk....
....krrkrrk.....
.....krrrk......
......krk.......
.....krrrk......
....krrkrrk.....
...krrk.krrk....
..krrk...krrk...
..kk.......kk...
................
................
................
................`;
  maps.tb_props = `
..kkkkkkkkk.....
..kwwwwwwwkk....
..kwwwwwwwkwk...
..kwwwwwwwkkkk..
..kwddddddwwwk..
..kwwwwwwwwwwk..
..kwddddwwwwwk..
..kwwwwwwkkwwk..
..kwddddkwwkwk..
..kwwwwwkwwkwk..
..kwddddkkwkwk..
..kwwwwwwkwkkk..
..kwwwwwwkkkwk..
..kwwwwwwwwwwk..
..kkkkkkkkkkkk..
................`;
  maps.tb_views = `
................
.kkkkkkkkkkkkkk.
.kbbkddddddddak.
.kbbkddddddddak.
.kkkkkkkkkkkkkk.
................
.kkkkkkkkkkkkkk.
.kbbkddddddddak.
.kbbkddddddddak.
.kkkkkkkkkkkkkk.
................
.kkkkkkkkkkkkkk.
.kbbkddddddddak.
.kbbkddddddddak.
.kkkkkkkkkkkkkk.
................`;

  const cache = {};

  function get(name, size) {
    size = size || 16;
    const key = name + "@" + size;
    if (cache[key]) return cache[key];
    /* "name+lnk" → base icon with the classic shortcut-arrow badge */
    if (name.endsWith("+lnk")) {
      const base = name.slice(0, -4);
      const c = document.createElement("canvas");
      c.width = size; c.height = size;
      const x = c.getContext("2d");
      /* draw base synchronously */
      if (window.IconArt && window.IconArt.has(base) && window.IconArt.draws) {
        const b32 = document.createElement("canvas");
        b32.width = 32; b32.height = 32;
        window.IconArt.draws[base](b32.getContext("2d"));
        x.imageSmoothingEnabled = true;
        x.imageSmoothingQuality = "high";
        x.drawImage(b32, 0, 0, size, size);
      } else {
        // pixmap-based fallback: render the ASCII map straight onto our canvas
        const rows = String(maps[base] || maps.file).trim().split("\n").map(r => r.replace(/\|/g, ""));
        const scale = size / 16;
        x.imageSmoothingEnabled = false;
        for (let yy = 0; yy < rows.length; yy++) {
          for (let xx = 0; xx < rows[yy].length; xx++) {
            const ch = rows[yy][xx];
            if (ch === "." || ch === " ") continue;
            x.fillStyle = P[ch] || "#000";
            x.fillRect(Math.floor(xx * scale), Math.floor(yy * scale), Math.ceil(scale), Math.ceil(scale));
          }
        }
      }
      /* the badge: white square, black bent arrow */
      const s = Math.max(7, Math.round(size * 0.44));
      x.fillStyle = "#fff";
      x.fillRect(0, size - s, s, s);
      x.strokeStyle = "#000"; x.lineWidth = 1;
      x.strokeRect(0.5, size - s + 0.5, s - 1, s - 1);
      x.fillStyle = "#000";
      x.beginPath();
      x.moveTo(s * 0.2, size - s * 0.2);
      x.lineTo(s * 0.2, size - s * 0.78);
      x.lineTo(s * 0.44, size - s * 0.54);
      x.lineTo(s * 0.7, size - s * 0.86);
      x.lineTo(s * 0.86, size - s * 0.7);
      x.lineTo(s * 0.54, size - s * 0.44);
      x.lineTo(s * 0.78, size - s * 0.2);
      x.closePath();
      x.fill();
      cache[key] = c.toDataURL();
      return cache[key];
    }
    let url;
    if (window.IconArt && window.IconArt.has(name)) {
      url = window.IconArt.render(name, size);
    } else {
      const map = maps[name] || maps.file;
      url = pixmap(map, P, Math.max(1, Math.round(size / 16)));
    }
    cache[key] = url;
    return url;
  }

  function img(name, size) {
    const i = new Image();
    i.src = get(name, size);
    i.width = size || 16; i.height = size || 16;
    i.draggable = false;
    return i;
  }

  /* --- procedural: msgbox icons --- */
  function circleIcon(bg, border, glyphFn) {
    const c = document.createElement("canvas");
    c.width = 32; c.height = 32;
    const x = c.getContext("2d");
    x.beginPath(); x.arc(16, 16, 14.5, 0, Math.PI * 2);
    x.fillStyle = bg; x.fill();
    x.lineWidth = 1.6; x.strokeStyle = border; x.stroke();
    glyphFn(x);
    return c.toDataURL();
  }
  function makeMsgIcons() {
    cache["msg_error@32"] = circleIcon("#ff0000", "#800000", x => {
      x.strokeStyle = "#fff"; x.lineWidth = 3.4; x.lineCap = "round";
      x.beginPath(); x.moveTo(10.5, 10.5); x.lineTo(21.5, 21.5);
      x.moveTo(21.5, 10.5); x.lineTo(10.5, 21.5); x.stroke();
    });
    cache["msg_info@32"] = circleIcon("#ffffff", "#000080", x => {
      x.fillStyle = "#000080"; x.font = "bold 20px 'Times New Roman', serif";
      x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText("i", 16, 17);
    });
    cache["msg_question@32"] = circleIcon("#ffffff", "#000080", x => {
      x.fillStyle = "#000080"; x.font = "bold 20px 'Times New Roman', serif";
      x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText("?", 16, 17);
    });
    // warning triangle
    const c = document.createElement("canvas");
    c.width = 32; c.height = 32;
    const x = c.getContext("2d");
    x.beginPath(); x.moveTo(16, 2); x.lineTo(30.5, 29); x.lineTo(1.5, 29); x.closePath();
    x.fillStyle = "#ffff00"; x.fill();
    x.lineWidth = 1.6; x.strokeStyle = "#000"; x.stroke();
    x.fillStyle = "#000"; x.fillRect(14.4, 11, 3.2, 10);
    x.fillRect(14.4, 23.5, 3.2, 3.2);
    cache["msg_warning@32"] = c.toDataURL();
  }
  makeMsgIcons();

  /* --- procedural: LED digits (13x23) --- */
  const ledCache = {};
  function led(ch) {
    if (ledCache[ch]) return ledCache[ch];
    const SEG = { // a,b,c,d,e,f,g
      "0":"abcdef","1":"bc","2":"abged","3":"abgcd","4":"fgbc","5":"afgcd",
      "6":"afgedc","7":"abc","8":"abcdefg","9":"abcfgd","-":"g"," ":""
    };
    const c = document.createElement("canvas");
    c.width = 13; c.height = 23;
    const x = c.getContext("2d");
    x.fillStyle = "#000"; x.fillRect(0, 0, 13, 23);
    const on = SEG[ch] || "";
    const seg = (name, lit) => {
      x.fillStyle = lit ? "#ff0000" : "#3a0000";
      switch (name) {
        case "a": x.fillRect(3, 1, 7, 2); break;
        case "b": x.fillRect(10, 3, 2, 7); break;
        case "c": x.fillRect(10, 13, 2, 7); break;
        case "d": x.fillRect(3, 20, 7, 2); break;
        case "e": x.fillRect(1, 13, 2, 7); break;
        case "f": x.fillRect(1, 3, 2, 7); break;
        case "g": x.fillRect(3, 10.5, 7, 2); break;
      }
    };
    for (const s of "abcdefg") seg(s, on.includes(s));
    ledCache[ch] = c.toDataURL();
    return ledCache[ch];
  }

  /* --- procedural: minesweeper faces (17x17) --- */
  function face(kind) {
    const key = "face_" + kind;
    if (cache[key]) return cache[key];
    const c = document.createElement("canvas");
    c.width = 17; c.height = 17;
    const x = c.getContext("2d");
    x.beginPath(); x.arc(8.5, 8.5, 7.5, 0, Math.PI * 2);
    x.fillStyle = "#ffff00"; x.fill();
    x.lineWidth = 1.2; x.strokeStyle = "#000"; x.stroke();
    x.fillStyle = "#000";
    if (kind === "win") {
      x.fillRect(3, 5.5, 11, 3);
      x.beginPath(); x.arc(5.5, 7, 2.4, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(11.5, 7, 2.4, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(8.5, 10, 4, 0.25 * Math.PI, 0.75 * Math.PI); x.stroke();
    } else if (kind === "dead") {
      const X = (cx, cy) => {
        x.beginPath(); x.moveTo(cx - 1.6, cy - 1.6); x.lineTo(cx + 1.6, cy + 1.6);
        x.moveTo(cx + 1.6, cy - 1.6); x.lineTo(cx - 1.6, cy + 1.6); x.stroke();
      };
      X(5.5, 6.5); X(11.5, 6.5);
      x.beginPath(); x.arc(8.5, 13, 3, 1.2 * Math.PI, 1.8 * Math.PI); x.stroke();
    } else if (kind === "oh") {
      x.beginPath(); x.arc(5.5, 6.5, 1.1, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(11.5, 6.5, 1.1, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(8.5, 11.5, 2.2, 0, Math.PI * 2); x.stroke();
    } else {
      x.beginPath(); x.arc(5.5, 6.5, 1.1, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(11.5, 6.5, 1.1, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(8.5, 9.5, 4, 0.2 * Math.PI, 0.8 * Math.PI); x.stroke();
    }
    cache[key] = c.toDataURL();
    return cache[key];
  }

  /* --- mine cell glyphs --- */
  const mineGlyphs = {};
  function mineGlyph(kind) {
    if (mineGlyphs[kind]) return mineGlyphs[kind];
    let m;
    if (kind === "flag") m = `
................
................
......kk........
....kkrk........
..kkrrrk........
..kkrrrk........
....kkrk........
......kk........
.......k........
.......k........
.......k........
.....kkkkk......
...kkkkkkkkk....
...kkkkkkkkk....
................
................`;
    else if (kind === "mine") m = `
................
.......k........
.......k........
...k...k...k....
....k.kkk.k.....
.....kkkkk......
...kkkwkkkk.....
..kkkwwkkkkk....
.kkkkwkkkkkkk...
kkkkkkkkkkkkkkk.
.kkkkkkkkkkkkk..
..kkkkkkkkkkk...
...kkkkkkkkk....
....k.kkk.k.....
...k...k...k....
.......k........`;
    else if (kind === "q") m = `
................
.....kkkk.......
....kkkkkk......
....kk..kk......
........kk......
.......kk.......
......kk........
......kk........
................
......kk........
......kk........
................
................
................
................
................`;
    mineGlyphs[kind] = pixmap(m, P, 1);
    return mineGlyphs[kind];
  }

  /* --- win98 arrow cursor --- */
  function cursorArrow() {
    if (cache.cursor) return cache.cursor;
    const m = `
k...........
kk..........
kwk.........
kwwk........
kwwwk.......
kwwwwk......
kwwwwwk.....
kwwwwwwk....
kwwwwwwwk...
kwwwwwwwwk..
kwwwwwkkkkk.
kwwkwwk.....
kwk.kwwk....
kk..kwwk....
k....kwwk...
.....kwwk...
......kk....`;
    cache.cursor = pixmap(m, P, 1);
    return cache.cursor;
  }

  /* --- hourglass busy cursor --- */
  function cursorWait() {
    if (cache.cursorWait) return cache.cursorWait;
    const m = `
kkkkkkkkkkkk
k..........k
kkkkkkkkkkkk
.kwwwwwwwwk.
.kwyyyyyywk.
..kwyyyywk..
...kwyywk...
....kwwk....
....kwwk....
...kw..wk...
..kw.yy.wk..
.kw.yyyy.wk.
.kwyyyyyywk.
kkkkkkkkkkkk
k..........k
kkkkkkkkkkkk`;
    cache.cursorWait = pixmap(m, P, 1);
    return cache.cursorWait;
  }

  /* --- big flag for boot/about (scaled) ---
     If the user supplied their own artwork (Branding folder → injected by the
     native shell, or web/branding/flag.png in dev), it wins everywhere. */
  function bigFlag(scale) {
    if (window.__WIN98_FLAG__) return window.__WIN98_FLAG__;
    const px = 16 * scale;
    if (window.IconArt && window.IconArt.renderFlag) return window.IconArt.renderFlag(px);
    return pixmap(maps.startflag, P, scale);
  }

  /* Start-button flag (16px) — only purpose-made small art reads well here,
     so a big custom logo is NOT squeezed in; provide flag-small.png to override. */
  function startFlagUrl() {
    if (window.__WIN98_FLAG_SMALL__) return window.__WIN98_FLAG_SMALL__;
    return get("startflag", 16);
  }

  /* Clean up user-supplied art: key near-white / light-gray (baked "transparency"
     checkerboards) to real transparency, then crop to the content. */
  function processCustomFlag(key) {
    const url = window[key];
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      if (!c.width || !c.height) return;
      const x = c.getContext("2d");
      x.drawImage(img, 0, 0);
      let d;
      try { d = x.getImageData(0, 0, c.width, c.height); } catch (e) { return; }
      const p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        const r = p[i], g = p[i + 1], b = p[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        if (mn > 188 && mx - mn < 22) p[i + 3] = 0;   // white & light-gray背景 → transparent
      }
      let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
      for (let yy = 0; yy < c.height; yy++) {
        for (let xx = 0; xx < c.width; xx++) {
          if (p[(yy * c.width + xx) * 4 + 3] > 8) {
            if (xx < x0) x0 = xx; if (xx > x1) x1 = xx;
            if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
          }
        }
      }
      if (x1 <= x0 || y1 <= y0) return;               // everything keyed → keep original
      x.putImageData(d, 0, 0);
      const pad = Math.round(Math.max(c.width, c.height) * 0.02);
      x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
      x1 = Math.min(c.width - 1, x1 + pad); y1 = Math.min(c.height - 1, y1 + pad);
      const c2 = document.createElement("canvas");
      c2.width = x1 - x0 + 1; c2.height = y1 - y0 + 1;
      c2.getContext("2d").drawImage(c, x0, y0, c2.width, c2.height, 0, 0, c2.width, c2.height);
      window[key] = c2.toDataURL();
      W98.bus.emit("branding");
    };
    img.src = url;
  }
  if (window.__WIN98_FLAG__) processCustomFlag("__WIN98_FLAG__");
  if (window.__WIN98_FLAG_SMALL__) processCustomFlag("__WIN98_FLAG_SMALL__");

  /* dev/browser: quietly probe web/branding/ for user-supplied flag art */
  if (location.protocol.startsWith("http")) {
    [["flag.png", "__WIN98_FLAG__"], ["flag-small.png", "__WIN98_FLAG_SMALL__"]].forEach(([f, key]) => {
      fetch("branding/" + f).then(r => {
        if (!r.ok || (r.headers.get("content-type") || "").indexOf("html") >= 0) return null;
        return r.blob();
      }).then(b => {
        if (b && b.size > 50) {
          window[key] = URL.createObjectURL(b);
          processCustomFlag(key);
          W98.bus.emit("branding");
        }
      }).catch(() => {});
    });
  }

  return { get, img, led, face, mineGlyph, cursorArrow, cursorWait, bigFlag, startFlagUrl, maps, P };
})();

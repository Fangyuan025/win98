/* docview.js — the Word 98 import filters. Opens documents imported from the
   Mac: .docx/.pptx (unzipped with native DecompressionStream), legacy binary
   .doc/.ppt (heuristic text extraction), .xlsx (converted to CSV for the
   spreadsheet), and .pdf (Acrobat Reader 98). Formatting stays on the Mac. */
"use strict";
W98.DocImport = (() => {
  const OPENABLE = ["doc", "docx", "ppt", "pptx", "xlsx", "pdf"];

  function dataUrlBytes(dataUrl) {
    const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  /* ---------- minimal zip reader (stored + deflate via DecompressionStream) ---------- */
  function zipEntries(bytes) {
    let i = bytes.length - 22;
    while (i >= 0 && !(bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 5 && bytes[i + 3] === 6)) i--;
    if (i < 0) throw new Error("not a zip");
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const count = dv.getUint16(i + 10, true);
    let off = dv.getUint32(i + 16, true);
    const entries = {};
    for (let n = 0; n < count; n++) {
      if (dv.getUint32(off, true) !== 0x02014b50) break;
      const method = dv.getUint16(off + 10, true);
      const csize = dv.getUint32(off + 20, true);
      const nlen = dv.getUint16(off + 28, true), elen = dv.getUint16(off + 30, true), clen = dv.getUint16(off + 32, true);
      const lho = dv.getUint32(off + 42, true);
      const name = new TextDecoder().decode(bytes.subarray(off + 46, off + 46 + nlen));
      const lnlen = dv.getUint16(lho + 26, true), lelen = dv.getUint16(lho + 28, true);
      const dstart = lho + 30 + lnlen + lelen;
      entries[name] = { method, cdata: bytes.subarray(dstart, dstart + csize) };
      off += 46 + nlen + elen + clen;
    }
    return entries;
  }

  async function unzipText(entry) {
    let raw;
    if (!entry) return null;
    if (entry.method === 0) raw = entry.cdata;
    else {
      const ds = new DecompressionStream("deflate-raw");
      raw = new Uint8Array(await new Response(new Blob([entry.cdata]).stream().pipeThrough(ds)).arrayBuffer());
    }
    return new TextDecoder().decode(raw);
  }

  const unent = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/&amp;/g, "&");

  /* ---------- office xml → text ---------- */
  function docxToText(xml) {
    return unent(xml
      .replace(/<w:tab[^>]*\/>/g, "\t")
      .replace(/<w:br[^>]*\/>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, ""))
      .replace(/\n{3,}/g, "\n\n").trim();
  }
  function pptxSlideToText(xml) {
    return unent(xml
      .replace(/<\/a:p>/g, "\n")
      .replace(/<[^>]+>/g, ""))
      .replace(/\n{3,}/g, "\n\n").trim();
  }

  /* ---------- legacy binary .doc/.ppt: harvest printable runs ---------- */
  function printable(code) {
    return (code >= 0x20 && code <= 0x7e) || code === 0x09 ||
      (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3000 && code <= 0x30ff) ||
      (code >= 0xff01 && code <= 0xff5e) || (code >= 0x00c0 && code <= 0x024f);
  }
  function harvestText(bytes) {
    const runs = [];
    /* UTF-16LE scan, both byte parities */
    for (let parity = 0; parity < 2; parity++) {
      let cur = "";
      for (let i = parity; i + 1 < bytes.length; i += 2) {
        const c = bytes[i] | (bytes[i + 1] << 8);
        if (printable(c) || c === 0x0d) {
          cur += c === 0x0d ? "\n" : String.fromCharCode(c);
        } else {
          if (cur.replace(/\s/g, "").length >= 12) runs.push(cur);
          cur = "";
        }
      }
      if (cur.replace(/\s/g, "").length >= 12) runs.push(cur);
    }
    /* CP1252-ish single-byte scan */
    let cur = "";
    for (let i = 0; i < bytes.length; i++) {
      const c = bytes[i];
      if ((c >= 0x20 && c <= 0x7e) || c === 0x0d || c === 0x09) {
        cur += c === 0x0d ? "\n" : String.fromCharCode(c);
      } else {
        if (cur.replace(/\s/g, "").length >= 20 && /[a-zA-Z]{4}/.test(cur)) runs.push(cur);
        cur = "";
      }
    }
    if (cur.replace(/\s/g, "").length >= 20 && /[a-zA-Z]{4}/.test(cur)) runs.push(cur);
    /* drop obvious junk runs (font tables, guids) and dedupe */
    const seen = new Set();
    const text = runs
      .map(r => r.trim())
      .filter(r => !/^[A-Z][a-z]+ ?[A-Z]?[a-z]*$/.test(r) || r.length > 30)
      .filter(r => !/Normal|Default Paragraph|Times New Roman|Arial|Cambria|Calibri|MsoNormal|HYPERLINK/.test(r) || r.length > 60)
      .filter(r => { const k = r.slice(0, 40); if (seen.has(k)) return false; seen.add(k); return true; })
      .join("\n");
    return text.replace(/\n{3,}/g, "\n\n").trim();
  }

  /* ---------- xlsx → csv ---------- */
  async function xlsxToCsv(entries) {
    const shared = [];
    const ss = await unzipText(entries["xl/sharedStrings.xml"]);
    if (ss) {
      const parts = ss.split(/<si[ >]/).slice(1);
      for (const p of parts) {
        shared.push(unent((p.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [])
          .map(t => t.replace(/<[^>]+>/g, "")).join("")));
      }
    }
    let sheetName = Object.keys(entries).find(n => /^xl\/worksheets\/sheet1\.xml$/.test(n)) ||
                    Object.keys(entries).find(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
    const xml = await unzipText(entries[sheetName]);
    if (!xml) throw new Error("no worksheet");
    const grid = {};
    let maxR = 0, maxC = 0;
    const cellRe = /<c r="([A-Z]+)(\d+)"[^>]*?(?:\s+t="([^"]*)")?\s*>([\s\S]*?)<\/c>/g;
    let m;
    while ((m = cellRe.exec(xml))) {
      const col = m[1].split("").reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
      const row = parseInt(m[2], 10) - 1;
      if (row > 60 || col > 25) continue;
      let val = "";
      const v = m[4].match(/<v[^>]*>([\s\S]*?)<\/v>/);
      const is = m[4].match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/);
      if (m[3] === "s" && v) val = shared[parseInt(v[1], 10)] || "";
      else if (is) val = unent(is[1]);
      else if (v) val = unent(v[1]);
      if (val === "") continue;
      grid[row + "," + col] = val;
      maxR = Math.max(maxR, row); maxC = Math.max(maxC, col);
    }
    const lines = [];
    for (let r = 0; r <= maxR; r++) {
      const cols = [];
      for (let c = 0; c <= maxC; c++) {
        let v = grid[r + "," + c] || "";
        if (/[",\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
        cols.push(v);
      }
      lines.push(cols.join(","));
    }
    return lines.join("\n");
  }

  /* ---------- the converted-file plumbing ---------- */
  function convertedPath(path, newExt) {
    const dir = FS.segs(path).slice(0, -1).join("/");
    const base = FS.segs(path).pop().replace(/\.[^.]*$/, "");
    return dir + "/" + base + " (converted)." + newExt;
  }
  function openConverted(path, newExt, content, appId) {
    const p = convertedPath(path, newExt);
    FS.writeFile(p, content);
    W98.launch(appId, p);
  }
  function filterFail(name) {
    WM.msgbox({ title: "Import Filter", icon: "warn",
      text: W98.tr("The import filter could not read ") + name +
        W98.tr(".\n\nThe file may be protected, empty, or more modern than 1998 can politely handle.") });
  }

  /* ---------- Acrobat Reader 98 (pages rendered natively, chrome rendered in 1998) ---------- */
  const pdfPending = {};
  let pdfSeq = 0;
  function __pdfReply(reqId, json) {
    const cb = pdfPending[reqId];
    if (!cb) return;
    delete pdfPending[reqId];
    let r; try { r = typeof json === "string" ? JSON.parse(json) : json; } catch (e) { r = { ok: false }; }
    cb(r);
  }
  function renderPdfPage(b64, page, scale) {
    return new Promise((resolve) => {
      const bridge = window.webkit && webkit.messageHandlers && webkit.messageHandlers.system;
      if (!bridge) { resolve({ ok: false, error: "no bridge" }); return; }
      const reqId = "pdf" + (++pdfSeq);
      pdfPending[reqId] = resolve;
      bridge.postMessage({ cmd: "renderPdf", data: b64, page, scale, reqId });
      setTimeout(() => { if (pdfPending[reqId]) { delete pdfPending[reqId]; resolve({ ok: false, error: "timeout" }); } }, 12000);
    });
  }

  function openPdf(path, dataUrl) {
    const name = FS.segs(path).pop();
    const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    let cur = 1, total = 1, scale = 1.5;

    const win = WM.create({
      title: name + " - Acrobat Reader 98", icon: "help",
      width: 660, height: 540, minWidth: 420, minHeight: 320,
      statusbar: [{ text: "Ready" }, { text: "100%", width: 70 }],
      menus: [
        { label: "File", items: () => [{ label: "Close", click: () => win.close() }] },
        { label: "Help", items: () => [{ label: "About Acrobat Reader 98", click: () =>
          Dialogs.about("Acrobat Reader 98", "help", ["The document looks exactly the same", "on every computer. Witchcraft."]) }] }
      ]
    });
    win.body.style.display = "flex";
    win.body.style.flexDirection = "column";

    const bPrev = el("button", { class: "btn mp-btn", text: "◀", dataset: { tip: "Previous Page" } });
    const bNext = el("button", { class: "btn mp-btn", text: "▶", dataset: { tip: "Next Page" } });
    const pageLbl = el("span", { class: "mp-time", style: "min-width:60px;text-align:center", text: "– / –" });
    const bZoomOut = el("button", { class: "btn mp-btn", text: "−", dataset: { tip: "Zoom Out" } });
    const bZoomIn = el("button", { class: "btn mp-btn", text: "+", dataset: { tip: "Zoom In" } });
    const tbar = el("div", { class: "mp-controls" }, bPrev, bNext, pageLbl, el("span", { style: "flex:1" }), bZoomOut, bZoomIn);
    const view = el("div", { style: "flex:1;overflow:auto;background:#808080;text-align:center;padding:12px;min-height:0" });
    const img = el("img", { style: "background:#fff;box-shadow:2px 2px 4px rgba(0,0,0,.4);max-width:none" });
    view.append(img);
    win.body.append(tbar, view);

    let busy = false;
    async function show(page) {
      if (busy || win.closed) return;
      busy = true;
      win.setStatus(0, W98.tr("Rendering page..."));
      const r = await renderPdfPage(b64, page, scale);
      busy = false;
      if (win.closed) return;
      if (!r.ok) {
        view.innerHTML = "";
        view.append(el("div", { style: "color:#fff;padding:40px;font-size:12px;text-align:center",
          text: window.webkit ? W98.tr("This PDF could not be rendered. It may be encrypted, or simply rude.")
                              : W98.tr("PDF pages render inside the native app. In the browser preview, the paper stays imaginary.") }));
        win.setStatus(0, W98.tr("Cannot display this document."));
        return;
      }
      cur = r.page; total = r.pages;
      img.src = r.png;
      if (!img.isConnected) { view.innerHTML = ""; view.append(img); }
      pageLbl.textContent = cur + " / " + total;
      bPrev.disabled = cur <= 1;
      bNext.disabled = cur >= total;
      win.setStatus(0, name);
      win.setStatus(1, Math.round(scale / 1.5 * 100) + "%");
    }
    bPrev.addEventListener("click", () => show(cur - 1));
    bNext.addEventListener("click", () => show(cur + 1));
    bZoomIn.addEventListener("click", () => { scale = Math.min(4.5, scale * 1.25); show(cur); });
    bZoomOut.addEventListener("click", () => { scale = Math.max(0.6, scale / 1.25); show(cur); });
    show(1);
    return win;
  }

  async function open(path, ext) {
    const node = FS.get(path);
    const data = String((node && node.data) || "");
    if (!data.startsWith("data:")) { filterFail(FS.segs(path).pop()); return; }
    const name = FS.segs(path).pop();
    /* reuse an earlier conversion if it is still on disk */
    const prior = { docx: "rtf", doc: "rtf", pptx: "rtf", ppt: "rtf", xlsx: "csv" }[ext];
    if (prior && FS.exists(convertedPath(path, prior))) {
      W98.launch(ext === "xlsx" ? "spreadsheet" : "wordpad", convertedPath(path, prior));
      return;
    }
    try {
      if (ext === "pdf") { openPdf(path, data); return; }
      const bytes = dataUrlBytes(data);
      if (ext === "docx" || ext === "pptx") {
        const entries = zipEntries(bytes);
        let text = "";
        if (ext === "docx") {
          text = docxToText(await unzipText(entries["word/document.xml"]) || "");
        } else {
          const slides = Object.keys(entries).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
            .sort((a, b) => parseInt(a.match(/\d+/g).pop(), 10) - parseInt(b.match(/\d+/g).pop(), 10));
          const parts = [];
          for (let i = 0; i < slides.length; i++) {
            parts.push("--- " + W98.tr("Slide") + " " + (i + 1) + " ---\n" + pptxSlideToText(await unzipText(entries[slides[i]]) || ""));
          }
          text = parts.join("\n\n");
        }
        if (!text.trim()) { filterFail(name); return; }
        openConverted(path, "rtf", text, "wordpad");
      } else if (ext === "doc" || ext === "ppt") {
        const text = harvestText(bytes);
        if (!text.trim()) { filterFail(name); return; }
        openConverted(path, "rtf",
          text + "\n\n" + W98.tr("(Converted with the Word 98 import filter — the formatting stayed on the Mac.)"),
          "wordpad");
      } else if (ext === "xlsx") {
        const csv = await xlsxToCsv(zipEntries(bytes));
        if (!csv.trim()) { filterFail(name); return; }
        openConverted(path, "csv", csv, "spreadsheet");
      }
    } catch (e) {
      filterFail(name);
    }
  }

  return {
    canOpen: (ext) => OPENABLE.includes(ext),
    open,
    __pdfReply
  };
})();

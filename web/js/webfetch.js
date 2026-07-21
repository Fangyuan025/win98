/* webfetch.js — the bridge to the real, modern web, and the machine that
   drags it back to 1998. IE calls fetch() for any non-built-in URL, then
   retro() strips the scripts and styling and re-renders it in gray and serif. */
"use strict";
W98.WebFetch = (() => {
  const pending = {};
  let seq = 0;
  const bridge = () => (window.webkit && webkit.messageHandlers && webkit.messageHandlers.system) || null;

  /* native app calls this back with the result */
  function __reply(reqId, json) {
    const p = pending[reqId];
    if (!p) return;
    delete pending[reqId];
    let res;
    try { res = typeof json === "string" ? JSON.parse(json) : json; } catch (e) { res = { ok: false, error: "bad reply" }; }
    p(res);
  }

  function fetchUrl(url) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve({ ok: false, error: "timeout" }), 15000);
      const done = (r) => { clearTimeout(timeout); resolve(r); };

      if (bridge()) {
        const reqId = "wf" + (++seq);
        pending[reqId] = done;
        bridge().postMessage({ cmd: "fetchUrl", url, reqId });
        return;
      }
      /* dev/browser: go through the local proxy on the same origin */
      fetch("/proxy?url=" + encodeURIComponent(url))
        .then(async (r) => {
          const ct = r.headers.get("X-Proxy-Content-Type") || r.headers.get("Content-Type") || "";
          const finalUrl = r.headers.get("X-Proxy-Final-Url") || url;
          const status = parseInt(r.headers.get("X-Proxy-Status") || r.status, 10);
          const body = await r.text();
          if (r.headers.get("X-Proxy-Error")) done({ ok: false, error: r.headers.get("X-Proxy-Error") });
          else done({ ok: true, status, contentType: ct, body, finalUrl });
        })
        .catch((e) => done({ ok: false, error: String(e && e.message || e) }));
    });
  }

  /* ---------- the 98-ifier ---------- */
  const ESC = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const KEEP_INLINE = { B: "b", STRONG: "b", I: "i", EM: "i", U: "u", CODE: "code", BR: "br", SUB: "sub", SUP: "sup", SMALL: "small" };
  const HEADINGS = { H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1 };

  function absUrl(href, base) {
    try { return new URL(href, base).href; } catch (e) { return null; }
  }

  function retro(html, baseUrl) {
    let doc;
    try { doc = new DOMParser().parseFromString(html, "text/html"); }
    catch (e) { return { title: "Untitled", body: "<p>This page could not be parsed.</p>" }; }

    const title = (doc.querySelector("title") && doc.querySelector("title").textContent.trim()) || baseUrl;
    /* strip obvious non-content regions before extracting */
    doc.querySelectorAll("nav, header, footer, aside, [role=navigation], [role=banner], [role=contentinfo], .nav, .navbar, .menu, .sidebar, .footer, .header, #footer, #header, #mw-navigation, #p-lang, .mw-editsection, .navbox, .vector-menu, style, script").forEach(n => n.remove());
    /* prefer a real article/content region, most specific first */
    const root = doc.querySelector("#mw-content-text .mw-parser-output, #mw-content-text, .mw-parser-output, .post-content, .entry-content, .article-body, .article__body, [itemprop=articleBody], article, main, [role=main]") || doc.body || doc.documentElement;

    let out = "";
    let textBudget = 60000;   /* stop after a reasonable amount */
    let imgCount = 0, linkCount = 0;

    function inline(node) {
      let s = "";
      for (const c of node.childNodes) {
        if (textBudget <= 0) break;
        if (c.nodeType === 3) { const t = ESC(c.nodeValue.replace(/\s+/g, " ")); textBudget -= t.length; s += t; }
        else if (c.nodeType === 1) {
          const tag = KEEP_INLINE[c.tagName];
          if (c.tagName === "A") {
            const href = c.getAttribute("href");
            const abs = href ? absUrl(href, baseUrl) : null;
            const inner = inline(c).trim();
            if (abs && inner && /^https?:/.test(abs) && linkCount < 400) { linkCount++; s += `<a href="${ESC(abs)}">${inner}</a>`; }
            else s += inner;
          } else if (c.tagName === "BR") s += "<br>";
          else if (tag) s += `<${tag}>${inline(c)}</${tag}>`;
          else s += inline(c);
        }
      }
      return s;
    }

    function walk(node) {
      for (const c of node.childNodes) {
        if (textBudget <= 0) return;
        if (c.nodeType !== 1) continue;
        const tag = c.tagName;
        if (/^(SCRIPT|STYLE|NOSCRIPT|SVG|IFRAME|TEMPLATE|LINK|META|BUTTON|INPUT|SELECT|FORM|NAV|VIDEO|AUDIO|CANVAS)$/.test(tag)) continue;
        if (HEADINGS[tag]) {
          const t = inline(c).trim();
          if (t) out += `<h${HEADINGS[tag] + 1 > 4 ? 4 : Math.min(3, parseInt(tag[1]))}>${t}</h${Math.min(3, parseInt(tag[1]))}>`;
        } else if (tag === "P") {
          const t = inline(c).trim();
          if (t) out += `<p>${t}</p>`;
        } else if (tag === "LI") {
          const t = inline(c).trim();
          if (t) out += `<li>${t}</li>`;
        } else if (tag === "UL" || tag === "OL") {
          /* skip nav menus: big lists that are almost entirely links */
          const items = c.children.length;
          const linky = c.querySelectorAll(":scope > li > a").length;
          if (items > 12 && linky >= items * 0.8) continue;
          out += tag === "OL" ? "<ol>" : "<ul>";
          walk(c);
          out += tag === "OL" ? "</ol>" : "</ul>";
        } else if (tag === "BLOCKQUOTE") {
          const t = inline(c).trim();
          if (t) out += `<blockquote>${t}</blockquote>`; else walk(c);
        } else if (tag === "PRE") {
          const t = ESC(c.textContent).slice(0, 2000);
          if (t.trim()) out += `<pre>${t}</pre>`;
        } else if (tag === "HR") {
          out += "<hr>";
        } else if (tag === "IMG") {
          const src = c.getAttribute("src") || c.getAttribute("data-src");
          const abs = src ? absUrl(src, baseUrl) : null;
          if (abs && /^https?:/.test(abs) && imgCount < 20) {
            imgCount++;
            out += `<div class="imgwrap"><img src="${ESC(abs)}" alt="${ESC(c.getAttribute("alt") || "")}" loading="lazy"></div>`;
          }
        } else if (tag === "A" && !c.querySelector("p,div,li,h1,h2,h3")) {
          const t = inline(c).trim();
          if (t) out += `<p>${t}</p>`;
        } else if (tag === "TABLE") {
          out += "<table border=1 cellpadding=4 cellspacing=0>";
          c.querySelectorAll("tr").forEach(tr => {
            out += "<tr>";
            tr.querySelectorAll("th,td").forEach(td => {
              out += (td.tagName === "TH" ? "<th>" : "<td>") + inline(td).trim() + (td.tagName === "TH" ? "</th>" : "</td>");
            });
            out += "</tr>";
          });
          out += "</table>";
        } else {
          walk(c);   /* transparent container */
        }
      }
    }
    walk(root);

    if (!out.trim()) {
      out = `<p>This page loaded, but there was no readable text to show — it was probably built by
        JavaScript, which your browser politely declines to run. The 1998 web was mostly words.
        This page is mostly not.</p>`;
    }
    return { title, body: out, imgCount, linkCount };
  }

  return { fetchUrl, retro, __reply };
})();

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

  function fetchUrl(url, opts) {
    const render = !!(opts && opts.render);   /* render=true → full JS rendering (for JS-walled sites) */
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve({ ok: false, error: "timeout" }), render ? 40000 : 15000);
      const done = (r) => { clearTimeout(timeout); resolve(r); };

      if (bridge()) {
        const reqId = "wf" + (++seq);
        pending[reqId] = done;
        bridge().postMessage({ cmd: "fetchUrl", url, reqId, render });
        return;
      }
      /* dev/browser: go through the local proxy on the same origin */
      fetch("/proxy?url=" + encodeURIComponent(url) + (render ? "&render=1" : ""))
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
    try {
      let u = new URL(href, base);
      /* unwrap Google/Bing redirector links so results go straight to the site */
      if (/\.google\./.test(u.hostname) && u.pathname === "/url") {
        const real = u.searchParams.get("q") || u.searchParams.get("url");
        if (real && /^https?:/.test(real)) return real;
      }
      return u.href;
    } catch (e) { return null; }
  }

  /* does this response look like a "please enable JavaScript" wall? */
  function looksBlocked(res, retroResult) {
    const body = res.body || "";
    if (/if you are not redirected|enable javascript|javascript is (required|disabled)|browser isn't supported|unsupported browser|please turn on javascript/i.test(body.slice(0, 60000))) return true;
    /* rendered almost nothing readable from a big page → JS-built site */
    const textLen = retroResult ? retroResult.body.replace(/<[^>]+>/g, "").length : 0;
    if (body.length > 15000 && textLen < 350) return true;
    if (body.length < 2600 && textLen < 250) return true;
    return false;
  }

  function retro(html, baseUrl) {
    let doc;
    try { doc = new DOMParser().parseFromString(html, "text/html"); }
    catch (e) { return { title: "Untitled", body: "<p>This page could not be parsed.</p>" }; }

    const title = (doc.querySelector("title") && doc.querySelector("title").textContent.trim()) || baseUrl;
    /* strip obvious non-content regions before extracting */
    doc.querySelectorAll("nav, header, footer, aside, [role=navigation], [role=banner], [role=contentinfo], .nav, .navbar, .menu, .sidebar, .footer, .header, #footer, #header, #mw-navigation, #p-lang, .mw-editsection, .navbox, .vector-menu, style, script").forEach(n => n.remove());
    /* prefer a real article/content region, most specific first */
    const root = doc.querySelector("#mw-content-text .mw-parser-output, #mw-content-text, .mw-parser-output, .post-content, .entry-content, .article-body, .article__body, [itemprop=articleBody], #search, #rso, #b_results, article, main, [role=main]") || doc.body || doc.documentElement;
    /* search pages keep their query form even when we narrow to a content root */
    const headForm = root !== doc.body && doc.querySelector("form[action*='search'], form[role=search]");

    let out = "";
    let textBudget = 60000;   /* stop after a reasonable amount */
    let imgCount = 0, linkCount = 0, formCount = 0;

    /* re-render a form's controls in Win98 dress, keeping names/values so it still submits */
    function walkForm(node) {
      let s = "";
      for (const c of node.childNodes) {
        if (c.nodeType === 3) { const t = ESC(c.nodeValue.replace(/\s+/g, " ")); if (t.trim()) s += t; continue; }
        if (c.nodeType !== 1) continue;
        const tag = c.tagName;
        if (/^(SCRIPT|STYLE|NOSCRIPT|SVG|IFRAME|TEMPLATE)$/.test(tag)) continue;
        if (tag === "INPUT") {
          const ty = (c.getAttribute("type") || "text").toLowerCase();
          const name = c.getAttribute("name") || "";
          const val = c.getAttribute("value") || "";
          if (ty === "hidden") s += `<input type="hidden" name="${ESC(name)}" value="${ESC(val)}">`;
          else if (ty === "submit" || ty === "image") s += ` <button class="btn" data-submit>${ESC(val || "Submit")}</button> `;
          else if (ty === "checkbox" || ty === "radio")
            s += `<label><input type="${ty}" name="${ESC(name)}" value="${ESC(val || "on")}"${c.hasAttribute("checked") ? " checked" : ""}> ${ESC(c.getAttribute("aria-label") || "")}</label> `;
          else if (ty === "password") continue;   /* 1998 knew better than to type passwords here */
          else if (name) s += `<input class="field" type="text" name="${ESC(name)}" value="${ESC(val)}" placeholder="${ESC(c.getAttribute("placeholder") || "")}" style="width:280px"> `;
        } else if (tag === "TEXTAREA") {
          const name = c.getAttribute("name") || "";
          if (name) s += `<input class="field" type="text" name="${ESC(name)}" value="${ESC(c.textContent.trim().slice(0, 400))}" placeholder="${ESC(c.getAttribute("placeholder") || "")}" style="width:280px"> `;
        } else if (tag === "SELECT") {
          const name = c.getAttribute("name") || "";
          if (name) {
            s += `<select name="${ESC(name)}">`;
            c.querySelectorAll("option").forEach(o => {
              s += `<option value="${ESC(o.getAttribute("value") != null ? o.getAttribute("value") : o.textContent)}"${o.hasAttribute("selected") ? " selected" : ""}>${ESC(o.textContent.trim().slice(0, 80))}</option>`;
            });
            s += `</select> `;
          }
        } else if (tag === "BUTTON") {
          const ty = (c.getAttribute("type") || "submit").toLowerCase();
          if (ty === "submit") s += ` <button class="btn" data-submit>${ESC(c.textContent.trim() || "Submit")}</button> `;
        } else if (tag === "LABEL") {
          const t = ESC(c.textContent.replace(/\s+/g, " ").trim());
          s += t ? t + " " + walkForm(c) : walkForm(c);
        } else {
          s += walkForm(c);
        }
      }
      return s;
    }

    /* every anchor stays an anchor: http(s) and mailto both clickable */
    function renderA(c) {
      const href = c.getAttribute("href");
      const abs = href ? absUrl(href, baseUrl) : null;
      const inner = inline(c).trim();
      if (!abs || !inner) return inner;
      if ((/^https?:/.test(abs) || /^mailto:/.test(abs)) && linkCount < 2000) {
        linkCount++;
        return `<a href="${ESC(abs)}">${inner}</a>`;
      }
      return inner;
    }

    function inline(node) {
      let s = "";
      for (const c of node.childNodes) {
        if (textBudget <= 0) break;
        if (c.nodeType === 3) { const t = ESC(c.nodeValue.replace(/\s+/g, " ")); textBudget -= t.length; s += t; }
        else if (c.nodeType === 1) {
          const tag = KEEP_INLINE[c.tagName];
          if (c.tagName === "A") s += renderA(c);
          else if (c.tagName === "IMG") {
            /* linked images keep their picture (or at least their alt text) so the link survives */
            const src = c.getAttribute("src") || c.getAttribute("data-src");
            const abs = src ? absUrl(src, baseUrl) : null;
            if (abs && /^https?:/.test(abs) && imgCount < 20) { imgCount++; s += `<img class="ilimg" src="${ESC(abs)}" alt="${ESC(c.getAttribute("alt") || "")}" loading="lazy">`; }
            else if (c.getAttribute("alt")) s += ESC(c.getAttribute("alt"));
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
        if (/^(SCRIPT|STYLE|NOSCRIPT|SVG|IFRAME|TEMPLATE|LINK|META|BUTTON|INPUT|SELECT|NAV|VIDEO|AUDIO|CANVAS)$/.test(tag)) continue;
        if (tag === "FORM") {
          const action = absUrl(c.getAttribute("action") || "", baseUrl);
          const method = (c.getAttribute("method") || "get").toLowerCase();
          const inner = walkForm(c).trim();
          /* only keep forms that have a usable control and a same-web action */
          if (action && inner && /<(input|select|button)/i.test(inner) && formCount < 10) {
            formCount++;
            out += `<form class="live-form" data-liveform="1" data-action="${ESC(action)}" data-method="${ESC(method)}">${inner}</form>`;
          }
          continue;
        }
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
          const t = renderA(c);
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
    if (headForm) walk({ childNodes: [headForm] });
    walk(root);

    if (!out.trim()) {
      out = `<p>This page loaded, but there was no readable text to show — it was probably built by
        JavaScript, which your browser politely declines to run. The 1998 web was mostly words.
        This page is mostly not.</p>`;
    }
    return { title, body: out, imgCount, linkCount };
  }

  return { fetchUrl, retro, looksBlocked, __reply };
})();

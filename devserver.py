#!/usr/bin/env python3
"""Dev server for the Win98 web app with no-cache headers (so edits show up
immediately), plus a /proxy endpoint that lets Internet Explorer fetch the real
web for the retro-rendering feature."""
import http.server, socketserver, os, sys, urllib.request, urllib.parse, ssl, subprocess, re

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

def decode_body(body, content_type):
    """Decode fetched bytes honoring the declared charset, falling back sanely."""
    m = re.search(r"charset=([\w-]+)", content_type or "", re.I)
    encs = [m.group(1)] if m else []
    head = body[:4096].decode("ascii", "ignore")
    m2 = re.search(r'<meta[^>]+charset=["\']?([\w-]+)', head, re.I)
    if m2: encs.append(m2.group(1))
    encs += ["utf-8", "iso-8859-1"]
    for e in encs:
        try:
            return body.decode(e)
        except (LookupError, UnicodeDecodeError):
            continue
    return body.decode("utf-8", "replace")

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8098
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "web"))

_ctx = ssl.create_default_context()
_ctx.check_hostname = False
_ctx.verify_mode = ssl.CERT_NONE

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        if self.path.startswith("/proxy?"):
            self.handle_proxy()
            return
        super().do_GET()

    def handle_proxy(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        target = q.get("url", [""])[0]
        render = q.get("render", ["0"])[0] == "1"
        if not target.startswith(("http://", "https://")):
            self._proxy_error("Invalid URL", 400)
            return
        try:
            if render and os.path.exists(CHROME):
                # full JS rendering via headless Chrome (mirrors the native app's WKWebView path)
                out = subprocess.run(
                    [CHROME, "--headless=new", "--disable-gpu", "--no-first-run",
                     "--hide-scrollbars", "--user-agent=" + UA,
                     "--lang=en-US", "--accept-lang=en-US,en",
                     "--virtual-time-budget=6000", "--timeout=15000",
                     "--dump-dom", target],
                    capture_output=True, timeout=25)
                text = out.stdout.decode("utf-8", "replace")
                if not text.strip():
                    self._proxy_error("render produced no output")
                    return
                ct, final, status = "text/html; charset=utf-8", target, 200
                body = text.encode("utf-8")
            else:
                req = urllib.request.Request(target, headers={
                    "User-Agent": UA,
                    "Accept": "text/html,application/xhtml+xml,text/plain,*/*",
                    "Accept-Language": "en-US,en;q=0.8",
                })
                with urllib.request.urlopen(req, timeout=12, context=_ctx) as r:
                    ct = r.headers.get("Content-Type", "text/html")
                    final = r.geturl()
                    status = r.status
                    raw = r.read(2_500_000)   # cap at ~2.5 MB
                body = decode_body(raw, ct).encode("utf-8") if "text" in ct or "html" in ct or "xml" in ct else raw
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("X-Proxy-Content-Type", ct)
            self.send_header("X-Proxy-Final-Url", final)
            self.send_header("X-Proxy-Status", str(status))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            self._proxy_error(str(e)[:200])

    def _proxy_error(self, msg, code=200):
        self.send_response(code)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("X-Proxy-Error", msg.replace("\n", " "))
        self.end_headers()
        self.wfile.write(b"")

    def log_message(self, *a):
        pass

socketserver.TCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("", PORT), Handler) as httpd:
    print(f"Win98 dev server (no-cache + /proxy) on http://localhost:{PORT}")
    httpd.serve_forever()

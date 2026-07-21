#!/usr/bin/env python3
"""Dev server for the Win98 web app with no-cache headers (so edits show up
immediately), plus a /proxy endpoint that lets Internet Explorer fetch the real
web for the retro-rendering feature."""
import http.server, socketserver, os, sys, urllib.request, urllib.parse, ssl

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
        qs = urllib.parse.urlparse(self.path).query
        target = urllib.parse.parse_qs(qs).get("url", [""])[0]
        if not target.startswith(("http://", "https://")):
            self._proxy_error("Invalid URL", 400)
            return
        try:
            req = urllib.request.Request(target, headers={
                "User-Agent": "Mozilla/4.0 (compatible; MSIE 5.0; Windows 98)",
                "Accept": "text/html,application/xhtml+xml,text/plain,*/*",
            })
            with urllib.request.urlopen(req, timeout=12, context=_ctx) as r:
                ct = r.headers.get("Content-Type", "text/html")
                final = r.geturl()
                status = r.status
                body = r.read(2_500_000)   # cap at ~2.5 MB
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

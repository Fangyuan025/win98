#!/usr/bin/env python3
"""Dev server for the Win98 web app with no-cache headers (so edits show up immediately)."""
import http.server, socketserver, os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8098
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "web"))

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()
    def log_message(self, *a):
        pass

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Win98 dev server (no-cache) on http://localhost:{PORT}")
    httpd.serve_forever()

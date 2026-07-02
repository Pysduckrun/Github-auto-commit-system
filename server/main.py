#!/usr/bin/env python3
"""
main.py — Main HTTP API Router & Web Server entry point.
Serves the client frontend and provides API endpoints for discovery, preview, and committing.
"""

import http.server
import socketserver
import json
import urllib.parse
import os
import sys

# Ensure server module can import local services
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from github_service import (
    search_repositories, get_repository_preview, fork_repository,
    load_log, make_request, DEFAULT_TOKEN
)

PORT = 5000
CLIENT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "client"))


class HubHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=CLIENT_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        token = query.get("token", [DEFAULT_TOKEN])[0] or DEFAULT_TOKEN

        if path == "/api/status":
            status, user_info = make_request("GET", "/user", token=token)
            if status == 200:
                self.send_json(200, {
                    "authenticated": True,
                    "username": user_info.get("login"),
                    "avatar_url": user_info.get("avatar_url")
                })
            else:
                self.send_json(status, {
                    "authenticated": False,
                    "message": user_info.get("message", "Invalid Token")
                })
            return

        if path == "/api/search":
            topic = query.get("topic", ["machine-learning"])[0]
            min_stars = query.get("min_stars", ["100"])[0]
            sort = query.get("sort", ["stars"])[0]
            page = query.get("page", ["1"])[0]

            status, data = search_repositories(topic=topic, min_stars=min_stars, sort=sort, page=page, token=token)
            self.send_json(status, data)
            return

        if path == "/api/preview":
            repo = query.get("repo", [""])[0]
            if not repo:
                self.send_json(400, {"error": "Repository name required"})
                return

            status, data = get_repository_preview(repo, token=token)
            self.send_json(status, data)
            return

        if path == "/api/history":
            log = load_log()
            self.send_json(200, {"history": log, "total": len(log)})
            return

        if path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/fork":
            content_len = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_len).decode("utf-8") if content_len > 0 else "{}"
            try:
                data = json.loads(body)
            except Exception:
                data = {}

            token = data.get("token", DEFAULT_TOKEN)
            repo = data.get("repo", "")
            topic = data.get("topic", "general")

            if not repo:
                self.send_json(400, {"success": False, "message": "No repository specified"})
                return

            status, result = fork_repository(repo, topic=topic, token=token)
            self.send_json(status, result)
            return

        self.send_json(404, {"error": "Endpoint not found"})


def run_server():
    print("="*60)
    print("🚀 Starting GitHub Learning & Auto-Commit Hub Server...")
    print(f"📡 Serving Client UI & API at: http://localhost:{PORT}")
    print("="*60)
    with socketserver.TCPServer(("", PORT), HubHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")


if __name__ == "__main__":
    run_server()

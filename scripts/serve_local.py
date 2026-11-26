#!/usr/bin/env python3
"""Sert public/ en local comme Firebase Hosting : adresses sans .html et en-têtes de firebase.json.
Lancement : python3 scripts/serve_local.py [port]   (8080 par défaut). Utilisé par Lighthouse CI."""
import fnmatch, http.server, json, os, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PUB = os.path.join(ROOT, "public")
RULES = json.load(open(os.path.join(ROOT, "firebase.json"), encoding="utf-8"))["hosting"].get("headers", [])


def match(source, path):
    # Glob Firebase simplifié : ** = n'importe quoi, @(a|b) = alternatives.
    if source == "**":
        return True
    if "@(" in source:
        pre, rest = source.split("@(", 1)
        alts, post = rest.split(")", 1)
        return any(match(pre + a + post, path) for a in alts.split("|"))
    return fnmatch.fnmatch(path, source.replace("**/", "*"))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=PUB, **k)

    def translate_path(self, path):
        p = super().translate_path(path)
        # cleanUrls : /en sert en.html, même s'il existe aussi un dossier en/
        if not os.path.isfile(p) and os.path.isfile(p.rstrip("/") + ".html"):
            return p.rstrip("/") + ".html"
        return p

    def end_headers(self):
        path = self.path.split("?")[0]
        for rule in RULES:
            if match(rule["source"], path):
                for h in rule["headers"]:
                    self.send_header(h["key"], h["value"])
        super().end_headers()

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f"Site local : http://127.0.0.1:{port}", flush=True)
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()

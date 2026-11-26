#!/usr/bin/env python3
"""Prévient Bing et les autres moteurs IndexNow que les pages du sitemap ont changé.
Lancement : python3 scripts/indexnow.py   (bibliothèque standard uniquement, marche sur macOS)"""
import json, os, re, sys, urllib.error, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
key = open(os.path.join(ROOT, ".indexnow-key"), encoding="utf-8").read().strip()
sitemap = open(os.path.join(ROOT, "public", "sitemap.xml"), encoding="utf-8").read()
urls = re.findall(r"<loc>([^<]+)</loc>", sitemap)
body = json.dumps({
    "host": "itberg.tn",
    "key": key,
    "keyLocation": f"https://itberg.tn/{key}.txt",
    "urlList": urls,
}).encode("utf-8")
req = urllib.request.Request(
    "https://api.indexnow.org/indexnow", data=body, method="POST",
    headers={"Content-Type": "application/json; charset=utf-8"})
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print(f"IndexNow : réponse {r.status} pour {len(urls)} pages")
except urllib.error.HTTPError as e:
    print(f"IndexNow : réponse {e.code} ({e.reason})")
    sys.exit(1)

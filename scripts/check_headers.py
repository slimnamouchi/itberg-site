#!/usr/bin/env python3
"""Vérifie qu'un site EN LIGNE renvoie bien les en-têtes de sécurité déclarés dans firebase.json.
Lancement : python3 scripts/check_headers.py https://itberg.tn   (code de sortie 1 en cas d'écart)"""
import json, os, re, sys, urllib.request

base = sys.argv[1].rstrip("/")
cfg = json.load(open(os.path.join(os.path.dirname(__file__), "..", "firebase.json"), encoding="utf-8"))
expected = {}
for rule in cfg["hosting"]["headers"]:
    if rule["source"] == "**":
        expected = {h["key"].lower(): h["value"] for h in rule["headers"]}

# Seule exception : les pages Assistant (IA locale), CSP déclarée juste après la règle « ** ».
ASSISTANT = ("/assistant", "/en/assistant", "/ar/assistant")
assistant_csp = next((h["value"] for rule in cfg["hosting"]["headers"] if "assistant" in rule["source"]
                      for h in rule["headers"] if h["key"].lower() == "content-security-policy"), None)

problems = []
for path in ("/", "/en", "/ar", "/securite-du-site", "/css/style.css", "/js/main.js", "/.well-known/security.txt", "/page-qui-n-existe-pas") + ASSISTANT:
    expected_here = dict(expected)
    if path in ASSISTANT and assistant_csp:
        expected_here["content-security-policy"] = assistant_csp
    req = urllib.request.Request(base + path, headers={"User-Agent": "itberg-check-headers"})
    try:
        resp = urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError as e:  # la page 404 doit aussi être protégée
        resp = e
    got = {k.lower(): v for k, v in resp.headers.items()}
    for key, value in expected_here.items():
        if key == "strict-transport-security":
            # Firebase impose sa propre valeur, plus stricte, sur *.web.app : on accepte toute valeur au moins aussi forte.
            m = re.search(r"max-age=(\d+)", got.get(key, ""))
            if not m or int(m.group(1)) < 31536000 or "includesubdomains" not in got.get(key, "").lower():
                problems.append(f"{path} : {key} = {got.get(key)!r}, attendu au moins {value!r}")
        elif got.get(key) != value:
            problems.append(f"{path} : {key} = {got.get(key)!r}, attendu {value!r}")
    if "set-cookie" in got:
        problems.append(f"{path} : un cookie est déposé ({got['set-cookie']})")
    for leak in ("x-powered-by",):
        if leak in got:
            problems.append(f"{path} : l'en-tête {leak} révèle la technologie du serveur")

if problems:
    print("En-têtes de sécurité incorrects sur " + base + " :")
    print("\n".join(" - " + p for p in problems))
    sys.exit(1)
print(f"En-têtes de sécurité conformes sur {base}.")

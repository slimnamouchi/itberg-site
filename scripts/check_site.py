#!/usr/bin/env python3
"""Vérifications rapides avant publication : liens internes, titres, descriptions, données structurées.
Lancement : python3 scripts/check_site.py   (code de sortie 1 si un problème est trouvé)"""
import glob, html.parser, json, os, re, sys

PUB = os.path.join(os.path.dirname(__file__), "..", "public")
problems = []

def exists(path):
    path = path.split("#")[0].split("?")[0]
    if path in ("", "/"):
        return os.path.exists(os.path.join(PUB, "index.html"))
    p = os.path.join(PUB, path.lstrip("/"))
    return os.path.exists(p) or os.path.exists(p + ".html")

for f in sorted(glob.glob(os.path.join(PUB, "*.html"))):
    name = os.path.basename(f)
    s = open(f, encoding="utf-8").read()
    title = re.search(r"<title>(.*?)</title>", s, re.S)
    desc = re.search(r'<meta name="description" content="(.*?)"', s)
    if not title:
        problems.append(f"{name} : pas de <title>")
    if not desc:
        problems.append(f"{name} : pas de meta description")
    elif len(desc.group(1)) > 160 and name != "404.html":
        problems.append(f"{name} : description trop longue ({len(desc.group(1))} caractères, 160 max)")
    if len(re.findall(r"<h1[\s>]", s)) != 1:
        problems.append(f"{name} : il faut exactement un <h1>")
    for href in re.findall(r'(?:href|src)="(/[^"]*)"', s):
        if not exists(href):
            problems.append(f"{name} : lien cassé {href}")
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        try:
            json.loads(block)
        except ValueError as e:
            problems.append(f"{name} : données structurées invalides ({e})")
    if re.search(r'\sstyle="', s) or re.search(r"<script>(?!\s*$)", s):
        problems.append(f"{name} : style ou script en ligne (bloqué par la sécurité du site)")

# security.txt (RFC 9116) : la date « Expires » doit rester dans le futur.
import datetime
sec = os.path.join(PUB, ".well-known", "security.txt")
if os.path.exists(sec):
    m = re.search(r"^Expires:\s*(\S+)", open(sec, encoding="utf-8").read(), re.M)
    if not m:
        problems.append(".well-known/security.txt : ligne Expires manquante")
    else:
        exp = datetime.datetime.fromisoformat(m.group(1).replace("Z", "+00:00"))
        if exp < datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30):
            problems.append(".well-known/security.txt : la date Expires est passée ou proche, repoussez-la d'un an")
else:
    problems.append(".well-known/security.txt manquant")

todo = sum(open(f, encoding="utf-8").read().count("[À COMPLÉTER]") for f in glob.glob(os.path.join(PUB, "*.html")))
if problems:
    print("Problèmes trouvés :")
    print("\n".join(" - " + p for p in problems))
    sys.exit(1)
print(f"Site vérifié : aucun problème. Repères [À COMPLÉTER] restants : {todo}.")

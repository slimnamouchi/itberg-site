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

def url_to_file(url):
    """https://itberg.tn/en/ai -> public/en/ai.html (None si l'adresse n'est pas sur le site)."""
    if not url.startswith("https://itberg.tn/"):
        return None
    path = url[len("https://itberg.tn/"):]
    return os.path.join(PUB, path + ".html" if path else "index.html")

for f in sorted(glob.glob(os.path.join(PUB, "**", "*.html"), recursive=True)):
    name = os.path.relpath(f, PUB)
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
    # Langues : <html lang>, sens d'écriture, et hreflang réciproques (chaque version pointe vers les autres).
    lang = re.search(r'<html lang="([a-z]{2})" dir="(ltr|rtl)"', s)
    if not lang:
        problems.append(f"{name} : <html lang=... dir=...> manquant")
    elif (lang.group(1) == "ar") != (lang.group(2) == "rtl"):
        problems.append(f"{name} : l'arabe doit être en dir=rtl, les autres langues en ltr")
    canon = re.search(r'<link rel="canonical" href="([^"]+)">', s)
    for hl, href in re.findall(r'<link rel="alternate" hreflang="([a-z-]+)" href="([^"]+)">', s):
        target = url_to_file(href)
        if target is None or not os.path.exists(target):
            problems.append(f"{name} : hreflang {hl} vers une page absente ({href})")
        elif canon and hl != "x-default" and href != canon.group(1):
            back = open(target, encoding="utf-8").read()
            if f'hreflang="{lang.group(1) if lang else ""}" href="{canon.group(1)}"' not in back:
                problems.append(f"{name} : la version {hl} ({href}) ne renvoie pas vers cette page")
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
    if re.search(r"<style[\s>]", s) or re.search(r"\son[a-z]+\s*=", s) or "javascript:" in s:
        problems.append(f"{name} : <style>, attribut onclick=... ou lien javascript: (bloqué par la sécurité du site)")
    for tag in re.findall(r"<script\b[^>]*>", s):
        if 'type="application/ld+json"' in tag:
            continue
        src = re.search(r'src="([^"]*)"', tag)
        if not src:
            problems.append(f"{name} : script en ligne (seuls les fichiers de /js sont autorisés)")
        elif not src.group(1).startswith("/js/"):
            problems.append(f"{name} : script externe {src.group(1)} (seuls les fichiers de /js sont autorisés)")
    for tag in re.findall(r"<link\b[^>]*>", s):
        if 'rel="stylesheet"' in tag and not re.search(r'href="/', tag):
            problems.append(f"{name} : feuille de style externe ({tag})")
    for tag in re.findall(r'<a\b[^>]*target="_blank"[^>]*>', s):
        if "noopener" not in tag:
            problems.append(f"{name} : lien target=_blank sans rel=noopener")

# Scripts : aucune fonction qui exécute du texte ou écrit du HTML brut (Trusted Types les bloquerait de toute façon).
for f in sorted(glob.glob(os.path.join(PUB, "**", "*.js"), recursive=True)):
    js = open(f, encoding="utf-8").read()
    for bad in ("innerHTML", "outerHTML", "insertAdjacentHTML", "document.write", "eval(", "new Function", "setTimeout(\"", "setInterval(\""):
        if bad in js:
            problems.append(f"{os.path.relpath(f, PUB)} : {bad} interdit (utilisez textContent / createElement)")

# En-têtes de sécurité de firebase.json : la politique ne doit jamais s'affaiblir.
cfg = json.load(open(os.path.join(PUB, "..", "firebase.json"), encoding="utf-8"))
glob_headers = {}
# Exception documentée : les 3 pages Démo IA font tourner un modèle d'IA dans le navigateur (WebLLM).
# Elles ont exactement la CSP du site, plus WebAssembly ('wasm-unsafe-eval') et le téléchargement
# du modèle depuis Hugging Face. Rien d'autre n'est accepté.
ASSISTANT_SOURCE = "**/@(demo-ia|ai-search-demo)*"
ASSISTANT_EXTRA = {"script-src": ["'wasm-unsafe-eval'"], "connect-src": ["https://huggingface.co", "https://*.huggingface.co", "https://*.hf.co"]}
assistant_rule = None
for rule in cfg["hosting"].get("headers", []):
    if rule["source"] == "**":
        glob_headers = {h["key"].lower(): h["value"] for h in rule["headers"]}
    elif any(h["key"].lower() == "content-security-policy" for h in rule["headers"]):
        if rule["source"] == ASSISTANT_SOURCE:
            assistant_rule = rule
        else:
            problems.append(f"firebase.json : CSP redéfinie pour {rule['source']} ; documentez l'exception dans scripts/check_site.py")
required = {
    "strict-transport-security": r"max-age=(\d+)",
    "x-content-type-options": r"^nosniff$",
    "x-frame-options": r"^DENY$",
    "referrer-policy": r"^(strict-origin-when-cross-origin|no-referrer|same-origin|strict-origin)$",
    "permissions-policy": r"camera=\(\)",
    "cross-origin-opener-policy": r"^same-origin$",
    "cross-origin-resource-policy": r"^same-(origin|site)$",
    "content-security-policy": r".",
}
for key, pat in required.items():
    v = glob_headers.get(key)
    if v is None or not re.search(pat, v):
        problems.append(f"firebase.json : en-tête {key} absent ou trop faible")
m = re.search(r"max-age=(\d+)", glob_headers.get("strict-transport-security", ""))
if m and int(m.group(1)) < 31536000:
    problems.append("firebase.json : HSTS doit durer au moins un an (max-age=31536000)")
csp = {}
for part in glob_headers.get("content-security-policy", "").split(";"):
    words = part.split()
    if words:
        csp[words[0]] = words[1:]
for directive, expected in {
    "default-src": ["'none'"], "object-src": ["'none'"], "base-uri": ["'none'"],
    "frame-ancestors": ["'none'"], "form-action": ["'none'"], "script-src": ["'self'"],
    "require-trusted-types-for": ["'script'"], "trusted-types": ["'none'"],
}.items():
    if csp.get(directive) != expected:
        problems.append(f"firebase.json : la CSP doit contenir « {directive} {' '.join(expected)} » (trouvé : {csp.get(directive)})")
for directive, values in csp.items():
    for v in values:
        if v in ("'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "*", "data:", "blob:", "http:", "https:") or v.startswith("http://"):
            problems.append(f"firebase.json : {v} interdit dans {directive}")

if assistant_rule:
    a_csp = {}
    for part in next(h["value"] for h in assistant_rule["headers"] if h["key"].lower() == "content-security-policy").split(";"):
        words = part.split()
        if words:
            a_csp[words[0]] = words[1:]
    want = {k: v + ASSISTANT_EXTRA.get(k, []) for k, v in csp.items()}
    if a_csp != want:
        problems.append("firebase.json : la CSP des pages Démo IA doit être celle du site plus seulement 'wasm-unsafe-eval' et Hugging Face")
    if len(assistant_rule["headers"]) != 1:
        problems.append("firebase.json : la règle des pages Démo IA ne doit redéfinir que la CSP")
    if cfg["hosting"]["headers"].index(assistant_rule) < [r["source"] for r in cfg["hosting"]["headers"]].index("**"):
        problems.append("firebase.json : la règle des pages Démo IA doit venir après la règle « ** »")

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

#!/usr/bin/env python3
"""Résumé lisible des scores Lighthouse, page par page (lu depuis les rapports de .lighthouseci/).
Sur GitHub, le tableau s'affiche dans l'onglet « Summary » du contrôle ; en local, il s'affiche dans le terminal.
Lancement : python3 scripts/lighthouse_resume.py"""
import glob, json, os, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
DOSSIER = os.path.join(ROOT, ".lighthouseci")
# Seuils de lighthouserc.js, pour marquer les pages qui bloquent.
SEUILS = {"performance": 95, "accessibility": 100, "best-practices": 100, "seo": 100}
COLONNES = [("performance", "Performance"), ("accessibility", "Accessibilité"),
            ("best-practices", "Bonnes pratiques"), ("seo", "SEO")]

# Rapports bruts de « lhci collect » (présents même si une assertion a échoué).
rapports = {}
for f in glob.glob(os.path.join(DOSSIER, "lhr-*.json")):
    lhr = json.load(open(f, encoding="utf-8"))
    page = "/" + lhr["requestedUrl"].split("127.0.0.1", 1)[-1].split("/", 1)[-1]
    # 2 passages par page : on garde le meilleur, comme les assertions de lighthouserc.js.
    perf = lhr["categories"]["performance"]["score"] or 0
    if page not in rapports or perf > (rapports[page]["categories"]["performance"]["score"] or 0):
        rapports[page] = lhr
if not rapports:
    print("Pas de rapport Lighthouse dans .lighthouseci/.")
    sys.exit(0)

runs = rapports
lignes, en_dessous = [], 0
for page, lhr in sorted(rapports.items()):
    audits = lhr["audits"]
    cellules = []
    for cle, _ in COLONNES:
        score = round((lhr["categories"][cle]["score"] or 0) * 100)
        ok = score >= SEUILS[cle]
        en_dessous += not ok
        cellules.append(f"{score}" if ok else f"**{score}** ❌")
    lcp = audits["largest-contentful-paint"]["numericValue"] / 1000
    poids = audits["total-byte-weight"]["numericValue"] / 1000
    lignes.append(f"| {page} | " + " | ".join(cellules) + f" | {lcp:.1f} s | {poids:.0f} Ko |")

titre = "✅ Toutes les pages tiennent les seuils" if not en_dessous else f"❌ {en_dessous} score(s) sous le seuil"
sortie = [
    f"## Lighthouse : {len(runs)} page(s) — {titre}", "",
    "Seuils : performance ≥ 95, accessibilité, bonnes pratiques et SEO = 100 (profil mobile simulé).", "",
    "| Page | " + " | ".join(n for _, n in COLONNES) + " | Affichage (LCP) | Poids |",
    "|---|" + "---:|" * (len(COLONNES) + 2),
    *lignes, "",
    "Les rapports complets sont dans l'artefact « rapports-lighthouse » de ce contrôle.",
]
texte = "\n".join(sortie) + "\n"
resume = os.environ.get("GITHUB_STEP_SUMMARY")
if resume:
    with open(resume, "a", encoding="utf-8") as f:
        f.write(texte)
print(texte)

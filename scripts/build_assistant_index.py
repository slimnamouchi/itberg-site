#!/usr/bin/env python3
"""Construit l'index de l'assistant ITBerg à partir des pages publiques du site.

L'assistant ne sait que ce qui est écrit sur itberg.tn : ce script découpe chaque page
en passages (un passage = un titre de section et son texte), puis écrit un fichier par langue :
  public/assistant/fr.json, public/assistant/en.json, public/assistant/ar.json

Lancement : python3 scripts/build_assistant_index.py           (réécrit les fichiers)
            python3 scripts/build_assistant_index.py --check   (code 1 si l'index n'est plus à jour)
À relancer après chaque modification de texte ; la publication le relance de toute façon."""
import glob, html.parser, json, os, re, sys

PUB = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "public"))
OUT = os.path.join(PUB, "assistant")
# Pages qui ne servent pas de source : page d'erreur et page de l'assistant lui-même.
SKIP = {"404.html", "assistant.html", "en/assistant.html", "ar/assistant.html"}
# Pages « annexes » (légal, sécurité du site, liste des articles) : comptées moins fort, pour qu'une
# question sur un service tombe d'abord sur la page de ce service.
LOW = re.compile(r"^(?:(?:en|ar)/)?(mentions-legales|securite-du-site|signaler-une-faille|site-security|report-a-vulnerability|blog)\.html$")
HOME = {"fr": "Accueil", "en": "Home", "ar": "الصفحة الرئيسية"}
MAX_CHARS = 900          # un passage plus long est coupé en plusieurs morceaux
BLOCKS = {"p", "li", "dd", "dt", "td", "th", "blockquote", "figcaption", "summary"}
# Classes purement décoratives ou réservées aux lecteurs d'écran (doublons du texte visible).
DECOR = {"sr-only", "check-code", "eyebrow", "skip"}
IGNORED = {"script", "style", "svg", "nav", "form", "button", "noscript", "template", "header", "footer", "select", "textarea"}


class Page(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_main = 0
        self.ignore = 0
        self.title = ""
        self.h1 = ""
        self._in_title = False
        self.passages = []          # [anchor, heading, [textes]]
        self.cur = None
        self.anchor = ""
        self.heading_tag = None
        self.heading_buf = []
        self.block_buf = []
        self.block_depth = 0
        self.stack = []
        self.last_block = None
        self.block_tag = None

    def _flush_block(self):
        text = re.sub(r"\s+", " ", "".join(self.block_buf)).strip()
        self.block_buf = []
        if not text or self.cur is None:
            return
        if "[À COMPLÉTER]" in text:
            # information pas encore renseignée : on retire aussi son intitulé (<dt>) s'il précède
            if self.cur[2] and self.last_block == "dt":
                self.cur[2].pop()
            return
        self.cur[2].append(text)

    VOID = {"br", "img", "input", "meta", "link", "hr", "wbr", "source", "path", "circle", "rect", "line", "area", "col", "embed", "track"}

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self._in_title = True
        if tag == "main":
            self.in_main += 1
            self.cur = ["", "", []]
            self.passages.append(self.cur)
            return
        if tag == "br" and self.in_main:
            (self.heading_buf if self.heading_tag else self.block_buf).append(" ")
        if not self.in_main or tag in self.VOID:
            return
        classes = (a.get("class") or "").split()
        skip = tag in IGNORED or a.get("aria-hidden") == "true" or "hidden" in a or any(c in DECOR for c in classes)
        self.stack.append((tag, skip))
        if skip:
            self.ignore += 1
            return
        if self.ignore:
            return
        if a.get("id") and tag != "h1":
            self.anchor = a["id"]
        if tag in ("h1", "h2", "h3"):
            self._flush_block()
            self.heading_tag = tag
            self.heading_buf = []
        elif tag == "span" and self.block_depth:
            self.block_buf.append(" ")
        elif tag in BLOCKS:
            if self.block_depth:
                self.block_buf.append(" ")
            else:
                self.block_tag = tag
            self.block_depth += 1

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag == "main" and self.in_main:
            self._flush_block()
            self.in_main -= 1
            self.stack = []
            self.ignore = 0
            return
        if not self.in_main or not any(t == tag for t, _ in self.stack):
            return
        while self.stack:
            t, skip = self.stack.pop()
            if skip:
                self.ignore -= 1
            if t == tag:
                break
        if self.ignore or (tag in IGNORED):
            return
        if tag == self.heading_tag:
            text = re.sub(r"\s+", " ", "".join(self.heading_buf)).strip()
            self.heading_tag = None
            if tag == "h1":
                self.h1 = text
                return
            self.cur = [self.anchor, text, []]
            self.passages.append(self.cur)
        elif tag in BLOCKS:
            self.block_depth = max(0, self.block_depth - 1)
            if self.block_depth == 0:
                had = len(self.cur[2]) if self.cur else 0
                self._flush_block()
                if self.cur is not None and len(self.cur[2]) > had:
                    self.last_block = self.block_tag

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if not self.in_main or self.ignore:
            return
        if self.heading_tag:
            self.heading_buf.append(data)
        elif self.block_depth:
            self.block_buf.append(data)


def page_url(rel):
    path = rel[:-5]
    if path == "index":
        return "/"
    if path.endswith("/index"):
        path = path[:-6]
    return "/" + path


def lang_of(rel):
    first = rel.split("/")[0]
    if first in ("en", "ar") and "/" in rel:
        return first
    if rel in ("en.html", "ar.html"):
        return rel[:2]
    return "fr"


def build():
    out = {"fr": [], "en": [], "ar": []}
    for f in sorted(glob.glob(os.path.join(PUB, "**", "*.html"), recursive=True)):
        rel = os.path.relpath(f, PUB).replace(os.sep, "/")
        if rel in SKIP:
            continue
        src = open(f, encoding="utf-8").read()
        if re.search(r'<meta name="robots" content="[^"]*noindex', src):
            continue
        p = Page()
        p.feed(src)
        title = re.split(r"\s+[·|]\s+", p.title.strip())[0] or p.h1
        if title == "ITBerg":
            title = HOME[lang_of(rel)]
        url = page_url(rel)
        for anchor, heading, texts in p.passages:
            if not texts:
                continue
            chunk = []
            def emit(chunk):
                text = " ".join(chunk).strip()
                if len(text) < 25:
                    return
                doc = {"u": url + ("#" + anchor if anchor else ""), "t": title, "h": heading, "x": text}
                if LOW.match(rel):
                    doc["w"] = 0.6
                out[lang_of(rel)].append(doc)
            for t in texts:
                if chunk and len(" ".join(chunk)) + len(t) > MAX_CHARS:
                    emit(chunk)
                    chunk = []
                chunk.append(t)
            emit(chunk)
    return {lang: json.dumps({"v": 1, "lang": lang, "docs": docs}, ensure_ascii=False, separators=(",", ":")) + "\n"
            for lang, docs in out.items()}


def main():
    check = "--check" in sys.argv
    files = build()
    stale = []
    for lang, content in files.items():
        path = os.path.join(OUT, lang + ".json")
        old = open(path, encoding="utf-8").read() if os.path.exists(path) else None
        if old != content:
            stale.append(path)
            if not check:
                os.makedirs(OUT, exist_ok=True)
                open(path, "w", encoding="utf-8").write(content)
    counts = ", ".join(f"{lang} {len(json.loads(c)['docs'])} passages" for lang, c in files.items())
    if check and stale:
        print("Index de l'assistant à mettre à jour : lancez python3 scripts/build_assistant_index.py")
        sys.exit(1)
    print(("Index de l'assistant à jour" if not stale else "Index de l'assistant réécrit") + f" ({counts}).")


if __name__ == "__main__":
    main()

// Configuration de Lighthouse CI (lancé par le workflow « Contrôle qualité »).
//
// Pages auditées :
//   - sur une pull request : les pages clés (FR, EN, AR, démos incluses)
//     + toutes les pages que la pull request modifie, directement ou via un CSS/JS/image qu'elles chargent ;
//   - sur main (après fusion) ou avec LHCI_TOUTES=1 : toutes les pages du site.
//
// Seuils bloquants : voir « assertions » en bas. Le contrôle échoue si une seule page passe sous un seuil.
// Essai en local : npx @lhci/cli@0.15.1 autorun --config=lighthouserc.js
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const PORT = 8080;
const PUB = path.join(__dirname, "public");

// Une page par modèle et par langue, toutes les démos et l'assistant.
const PAGES_CLES = [
  "/", "/solutions", "/ia", "/contact", "/blog", "/blog/ia-souveraine-agents-guides",
  "/securite-du-site", "/demo-ia", "/piege-agent", "/assistant",
  "/en", "/en/solutions", "/en/contact", "/en/ai-search-demo", "/en/trap-the-agent", "/en/assistant",
  "/ar", "/ar/solutions", "/ar/report-a-vulnerability", "/ar/ai-search-demo", "/ar/trap-the-agent", "/ar/assistant",
];

function toutesLesPages() {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  return walk(PUB)
    .filter((f) => f.endsWith(".html") && path.basename(f) !== "404.html")
    .map((f) => fichierVersAdresse(path.relative(__dirname, f)))
    .sort();
}

// public/en/ai.html -> /en/ai ; public/index.html -> /
function fichierVersAdresse(f) {
  const p = "/" + path.relative("public", f).split(path.sep).join("/").replace(/\.html$/, "");
  return p === "/index" ? "/" : p;
}

// Fichiers modifiés par la pull request. Sur GitHub, HEAD est le commit de fusion :
// son premier parent est la branche cible, donc HEAD^1..HEAD = les changements de la PR.
function fichiersModifies() {
  try {
    return execFileSync("git", ["diff", "--name-only", "HEAD^1", "HEAD"], { cwd: __dirname, encoding: "utf8" })
      .split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function pagesTouchees() {
  const pages = new Set();
  const modifies = fichiersModifies().filter((f) => f.startsWith("public/"));
  const ressources = modifies.filter((f) => !f.endsWith(".html")).map((f) => "/" + path.relative("public", f));
  for (const f of modifies) {
    if (f.endsWith(".html") && path.basename(f) !== "404.html" && fs.existsSync(path.join(__dirname, f))) {
      pages.add(fichierVersAdresse(f));
    }
  }
  // Une page qui charge un CSS, un JS ou une image modifiés est auditée aussi.
  if (ressources.length) {
    for (const page of toutesLesPages()) {
      const fichier = path.join(PUB, (page === "/" ? "/index" : page) + ".html");
      const html = fs.readFileSync(fichier, "utf8");
      if (ressources.some((r) => html.includes(`"${r}"`) || html.includes(`"${r}?`))) pages.add(page);
    }
  }
  return pages;
}

const toutes = process.env.LHCI_TOUTES === "1";
const pages = toutes ? toutesLesPages() : [...new Set([...PAGES_CLES, ...pagesTouchees()])].sort();
console.error(`Lighthouse : ${pages.length} page(s) auditée(s)${toutes ? " (tout le site)" : ""}`);

module.exports = {
  ci: {
    collect: {
      startServerCommand: `python3 scripts/serve_local.py ${PORT}`,
      startServerReadyPattern: "Site local",
      // 2 passages par page : on garde le meilleur (« optimistic »), pour qu'un ralentissement
      // ponctuel de la machine GitHub ne bloque pas une PR. Une vraie baisse se voit aux 2 passages.
      numberOfRuns: 2,
      url: pages.map((p) => `http://127.0.0.1:${PORT}${p}`),
      settings: { chromeFlags: "--headless=new --no-sandbox" },
    },
    assert: {
      assertions: {
        // Aujourd'hui toutes les pages sont à 100 : la moindre baisse bloque la fusion.
        "categories:accessibility": ["error", { minScore: 1, aggregationMethod: "optimistic" }],
        "categories:best-practices": ["error", { minScore: 1, aggregationMethod: "optimistic" }],
        "categories:seo": ["error", { minScore: 1, aggregationMethod: "optimistic" }],
        "categories:performance": ["error", { minScore: 0.95, aggregationMethod: "optimistic" }],
        // Mesures clés (profil mobile simulé de Lighthouse) : affichage, stabilité, réactivité.
        "largest-contentful-paint": ["error", { maxNumericValue: 2500, aggregationMethod: "optimistic" }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1, aggregationMethod: "optimistic" }],
        "total-blocking-time": ["error", { maxNumericValue: 200, aggregationMethod: "optimistic" }],
        // Poids d'une page (HTML + CSS + JS + images + polices) : 500 Ko au plus.
        "total-byte-weight": ["error", { maxNumericValue: 500000, aggregationMethod: "optimistic" }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};

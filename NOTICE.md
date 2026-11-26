# Site itberg.tn · notice

## Ce que contient le dossier

```
itberg-site/
├── .github/workflows/  publication automatique (aperçu sur pull request, production sur main)
├── scripts/            check_site.py (vérifications avant publication), indexnow.py (prévient Bing)
├── SEO.md               checklist référencement + statistiques (à suivre après la mise en ligne)
├── firebase.json        configuration de l'hébergement (adresses propres, sécurité, cache)
├── .firebaserc          identifiant de votre projet Firebase (à remplir)
├── public/              LE SITE (tout ce qui est publié)
│   ├── index.html       Accueil
│   ├── solutions.html   /solutions Toutes nos solutions (catalogue complet)
│   ├── android.html     /android  Développement mobile
│   ├── ia.html          /ia       IA souveraine et agents (offre n°1)
│   ├── conseil.html     /conseil  Conseil en IA
│   ├── securite.html    /securite Sécurité des applications mobiles
│   ├── applis.html      /applis   Nos applications
│   ├── contact.html     /contact  Contact
│   ├── blog.html        /blog     liste des articles ; blog/*.html = les articles
│   ├── feed.xml         flux RSS du blog
│   ├── applis/          études de cas : el9offa.html, easyfind.html
│   ├── developpement-application-mobile-tunisie.html, agent-ia-langgraph.html,
│   │   audit-securite-application-mobile.html, ia-souveraine.html,
│   │   assistant-ia-documents-rag.html   pages ciblées sur une recherche Google
│   ├── en.html, en/     version anglaise (/en, /en/solutions, /en/ai…)
│   ├── ar.html, ar/     version arabe, de droite à gauche (/ar, /ar/solutions…)
│   ├── mentions-legales.html
│   ├── 404.html         page « introuvable »
│   ├── css/style.css    toutes les couleurs et la mise en page
│   ├── js/main.js       menu mobile, repère de profondeur, statistiques GoatCounter
│   ├── img/             logo, image de partage (og.png), icône
│   ├── favicon.svg, robots.txt, sitemap.xml
└── propositions/        logos proposés, palette et slogans (non publiés)
```

## Modifier un texte

1. Ouvrez le fichier de la page dans un éditeur de texte (VS Code, ou même le Bloc-notes).
2. Cherchez la phrase avec Ctrl+F, remplacez-la entre les balises, enregistrez.
   Exemple : `<h1>Écrivez-nous</h1>` → `<h1>Contactez-nous</h1>`.
3. Le titre affiché dans Google est dans `<title>…</title>` et la description dans `<meta name="description" content="…">`, en haut de chaque fichier.
4. Le menu et le pied de page sont répétés dans chaque page : si vous les changez, faites-le dans tous les fichiers `.html`, y compris ceux des dossiers `blog/`, `applis/`, `en/` et `ar/` (Ctrl+Maj+H dans VS Code remplace dans tous les fichiers à la fois). Le menu anglais et le menu arabe ont leurs propres libellés.
6. Si vous modifiez une page qui existe en trois langues (accueil, solutions, IA, conseil, mobile, sécurité, applications, contact), pensez à reporter la modification dans `en/` et `ar/`.
5. Couleurs : en haut de `css/style.css`, bloc `:root` (mode clair) puis le bloc mode sombre juste en dessous.

**Les repères `[À COMPLÉTER]`** (en jaune sur le site) sont dans `contact.html` et `mentions-legales.html` : adresse, téléphone (facultatif), forme juridique, identifiant RNE, matricule fiscal, noms de famille des fondateurs, directeur de la publication, bureau d'enregistrement du domaine. Remplacez toute la balise `<mark class="todo">[À COMPLÉTER]</mark>` par l'information. Si vous ne voulez pas afficher le téléphone, supprimez la ligne entière.

Pensez à mettre à jour la date `<lastmod>` dans `sitemap.xml` après une grosse modification.

**Lien LinkedIn** : présent dans le pied de page (toutes les pages), la page `contact.html` et les données structurées en haut de `index.html` (bloc `application/ld+json`, utile à Google). Si l'adresse change, remplacez-la partout avec Ctrl+Maj+H.

## Voir le site sur votre ordinateur avant de publier

```
cd itberg-site
firebase emulators:start --only hosting
```
puis ouvrez http://localhost:5000.

## Publier : automatiquement avec GitHub (recommandé)

Le code du site vit sur GitHub, dans le dépôt privé `itberg-site`. Chaque modification y est gardée dans l'historique, et la publication se fait toute seule :

| Ce que vous faites | Ce qui se passe automatiquement |
|---|---|
| Vous proposez une modification (pull request) | Le site est vérifié (liens, titres, descriptions…), puis un **aperçu** est publié à une adresse temporaire, valable 7 jours, que GitHub affiche en commentaire de la pull request |
| Vous fusionnez la pull request dans `main` | Le site est vérifié, **publié sur itberg.tn**, puis Bing et les moteurs IndexNow sont prévenus |

### Mise en place (une seule fois)

**1. Créer le dépôt sur GitHub**
1. Allez sur https://github.com/new.
2. Nom : `itberg-site`. Choisissez **Private** et ne cochez rien d'autre (pas de README).
3. Cliquez sur **Create repository**. Le code peut ensuite être envoyé dans le dépôt (par Claude, ou avec les commandes de la section « Envoyer le code vous-même » ci-dessous).

**1 bis. Choisir la machine qui publie (gratuit)**
Par défaut, la publication tourne sur les machines de GitHub. Elles sont **gratuites et illimitées si le dépôt est public**. Le dépôt ne contient aucun secret : la clé Firebase vit seulement dans les secrets GitHub, qui restent privés même sur un dépôt public.
- **Rendre le dépôt public** : Settings → General → tout en bas, « Danger Zone » → **Change visibility** → **Make public**, puis confirmez.
- **Ou garder le dépôt privé avec un runner à vous** (gratuit lui aussi) :
  - Si le runner est rattaché à une **organisation** GitHub, transférez le dépôt dans cette organisation (Settings → General → Danger Zone → Transfer).
  - Si le runner est sur un compte personnel, il ne sert qu'à un seul dépôt. Il faut alors en installer un pour `itberg-site` : Settings → Actions → Runners → New self-hosted runner, à lancer dans un nouveau dossier sur la machine, puis `./svc.sh install` et `./svc.sh start`.
  - Ensuite, créez la variable `RUNNER_LABELS` (Settings → Secrets and variables → Actions → onglet **Variables**) avec la valeur `["self-hosted","macOS"]`. La machine doit avoir `python3`, et être allumée quand une publication part.
  - ⚠️ **Jamais de runner à vous sur un dépôt public** : n'importe qui peut ouvrir une pull request, et GitHub déconseille ce cas car du code inconnu pourrait tourner sur votre Mac. Si le dépôt est public, laissez `RUNNER_LABELS` vide.

**2. Renseigner le projet Firebase**
Fait : `.firebaserc` contient l'identifiant du projet Firebase, `itberg-site`. Changez-le seulement si vous changez de projet.

**3. Créer la clé qui autorise GitHub à publier (compte de service)**
1. Ouvrez https://console.cloud.google.com/iam-admin/serviceaccounts et choisissez **votre projet Firebase** en haut de la page.
2. Cliquez sur **+ Créer un compte de service**. Nom : `github-publication`, puis cliquez sur **Créer et continuer**.
3. Ajoutez deux rôles : **Administrateur Firebase Hosting** (Firebase Hosting Admin) et **Lecteur de clés API** (API Keys Viewer). Cliquez sur **Continuer**, puis **OK**.
4. Cliquez sur le compte créé, ouvrez l'onglet **Clés**, puis **Ajouter une clé → Créer une clé → JSON**. Un fichier `.json` se télécharge.
5. Sur GitHub, dans le dépôt `itberg-site`, ouvrez **Settings → Secrets and variables → Actions → New repository secret**.
   - Name : `FIREBASE_SERVICE_ACCOUNT`
   - Secret : ouvrez le fichier `.json` avec un éditeur de texte et collez **tout** son contenu.
   - Cliquez sur **Add secret**.
6. **Supprimez le fichier `.json` de votre ordinateur** et videz la corbeille. Cette clé permet de publier le site : elle ne doit vivre que dans GitHub.

**4. Protéger la branche `main` (conseillé)**
Dans le dépôt, ouvrez **Settings → Branches → Add branch ruleset**. Ciblez `main` et cochez **Require a pull request before merging** et **Require status checks to pass**, avec les contrôles **« Contrôle qualité »** et **« apercu »** (Aperçu de la pull request). Ainsi, rien ne part en ligne si la sécurité, les liens, l'accessibilité ou le score Lighthouse baissent.

Ce que vérifient ces contrôles : `scripts/check_site.py` (liens, langues, aucun script ou style en ligne, en-têtes de `firebase.json` jamais affaiblis), `scripts/check_headers.py` (en-têtes réellement servis, en local puis sur l'aperçu en ligne) et Lighthouse (`lighthouserc.json` : accessibilité, bonnes pratiques et SEO à 100, performance d'au moins 80). Pour tester les en-têtes du site en production : `python3 scripts/check_headers.py https://itberg.tn`.

Tant que le dépôt est public, activez aussi dans **Settings → Code security** : **Secret scanning** et **Push protection** (GitHub bloque un envoi qui contient une clé), et **Dependabot alerts**. Dans **Settings → Actions → General**, gardez « Workflow permissions » sur **Read repository contents** et choisissez « Require approval for all outside collaborators ».

**5. Première publication**
Dans l'onglet **Actions** du dépôt, choisissez **Publication en production → Run workflow**. Après environ une minute, le site est en ligne.

### Modifier le site au quotidien
- **Petite modification, sans rien installer** : sur github.com, ouvrez le fichier (par exemple `public/contact.html`), cliquez sur le crayon ✏️ et modifiez le texte. En bas, choisissez **Create a new branch… and start a pull request**, puis **Propose changes**. Attendez l'aperçu, vérifiez-le, puis cliquez sur **Merge**. C'est en ligne.
- **Avec Claude** : demandez la modification dans le projet. Claude ouvre une pull request avec l'aperçu, vous la relisez et vous fusionnez.
- **Revenir en arrière** : dans la pull request fusionnée, cliquez sur **Revert**, puis fusionnez la pull request créée. L'ancienne version est republiée. Vous pouvez aussi passer par la console Firebase → Hosting → Historique des versions → Restaurer.

### Envoyer le code vous-même (si besoin)
```
cd itberg-site
git remote add origin https://github.com/slimnamouchi/itberg-site.git
git push -u origin main
```

## Publier à la main (dépannage)

Si GitHub Actions n'est pas disponible :
1. Installez Node.js, puis lancez `npm install -g firebase-tools` et `firebase login`.
2. Depuis le dossier `itberg-site`, lancez `firebase deploy --only hosting`.

## Relier itberg.tn (une seule fois)

1. Console Firebase → Hosting → **Ajouter un domaine personnalisé** → `itberg.tn`, puis recommencez avec `www.itberg.tn` (redirection vers itberg.tn).
2. Firebase affiche des enregistrements DNS (un TXT de vérification, puis des enregistrements A). Ajoutez-les dans l'espace client de votre bureau d'enregistrement `.tn`.
3. Attendez la propagation (de quelques minutes à 24 h). Firebase crée le certificat HTTPS tout seul.
4. Déclarez ensuite le site dans Google Search Console et envoyez `https://itberg.tn/sitemap.xml`.

## Publier un article de blog

1. Copiez un article existant de `public/blog/` sous un nouveau nom court, sans accent ni espace : `public/blog/mon-sujet.html` donnera l'adresse `/blog/mon-sujet`.
2. Dans le nouveau fichier, changez : `<title>`, `<meta name="description">` (160 caractères au plus), les adresses `canonical`, `hreflang` et `og:url`, le fil d'Ariane, le titre `<h1>`, l'introduction, la date (`<time datetime="2026-12-15">` et `article:published_time`), puis le texte de l'article.
3. Mettez à jour le bloc `application/ld+json` de type `BlogPosting` en haut du fichier : `headline`, `description`, `datePublished`, `dateModified`, `url`, `keywords`.
4. Ajoutez une carte pour l'article dans `blog.html` (bloc `post-card`, le plus récent en premier) et dans le bloc `Blog` de ses données structurées.
5. Ajoutez un `<item>` dans `feed.xml` (flux RSS) et une ligne `<url>` dans `sitemap.xml`.
6. Lancez `python3 scripts/check_site.py` : il signale un lien cassé, une description trop longue ou un titre manquant.

Règle d'honnêteté : pas de client, de chiffre ou de témoignage inventés. Si une information manque, écrivez `<mark class="todo">[À COMPLÉTER]</mark>`.

## Les trois langues

- Le français est la langue principale (adresses sans préfixe). L'anglais est sous `/en`, l'arabe sous `/ar` (`<html lang="ar" dir="rtl">`, la mise en page se retourne toute seule).
- Les 8 pages principales existent dans les trois langues. Chacune annonce ses traductions par des balises `hreflang` en haut du fichier, et le sélecteur FR · EN · ع du menu mène à la même page dans l'autre langue. `scripts/check_site.py` vérifie que chaque traduction renvoie bien vers les autres.
- Le blog, les études de cas, les pages ciblées et les mentions légales sont en français seulement : le sélecteur y mène à l'accueil anglais ou arabe.
- Les textes arabes ont été rédigés en arabe standard : faites-les relire par un arabophone avant de communiquer dessus.

## Bon à savoir

- Statistiques de visite : GoatCounter, sans cookie, donc pas de bandeau cookies. Le compte est à créer (voir SEO.md). Le réglage se trouve à la fin de `js/main.js`.
- Référencement et moteurs IA : toute la checklist est dans **SEO.md** (Search Console, Bing, IndexNow, liens entrants).
- Une politique de sécurité stricte (CSP) est appliquée par `firebase.json` : n'ajoutez pas d'autre script externe (Google Analytics, polices Google…) sans la modifier, sinon il sera bloqué. C'est voulu. Seul GoatCounter est autorisé.
- Les fichiers CSS/JS/images sont gardés en cache 24 h par les navigateurs : après une modification de `style.css`, un visiteur peut voir l'ancienne version pendant un jour au plus.

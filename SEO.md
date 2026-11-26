# itberg.tn · référencement et statistiques : la checklist

Ce qui est **déjà fait dans le site** :

- Un titre et une description uniques par page, de moins de 160 caractères. Une URL canonique, une balise `hreflang` prête pour l'anglais et l'arabe, et des balises robots qui autorisent les grands aperçus.
- Les balises Open Graph et Twitter sont en place, avec une image de partage de 1200×630.
- Données structurées (schema.org) :
  - `Organization` et `WebSite` sur l'accueil (avec le lien LinkedIn en `sameAs`) ;
  - `FAQPage` pour les 9 questions de l'accueil ;
  - `Service` sur les pages IA, Conseil, Mobile et Sécurité ;
  - `BreadcrumbList` sur toutes les pages intérieures.
- `robots.txt` ouvre tout le site et autorise explicitement les robots des moteurs IA : GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended, etc.
- `llms.txt` donne aux assistants IA un résumé fiable d'ITBerg et la liste des pages.
- Le `sitemap.xml` couvre les 9 pages, avec `hreflang`.
- La clé IndexNow (Bing, Yandex, Seznam…) est prête : le fichier `public/<clé>.txt` est en place, et la clé est dans `.indexnow-key`.
- Le site est rapide et sans dépendance lourde. Il est accessible et sécurisé, avec HTTPS et une politique de sécurité (CSP) stricte.
- Les statistiques de visite passent par GoatCounter : sans cookie, donc sans bandeau de consentement. Elles respectent Do Not Track et Global Privacy Control. Elles ne comptent que les visites sur itberg.tn, pas celles de l'aperçu ni d'un test en local.

---

## À faire de votre côté, dans l'ordre

### 1. Statistiques : créer le compte GoatCounter (5 minutes, gratuit)
1. Allez sur https://www.goatcounter.com/signup et choisissez le code **itberg** : votre tableau de bord sera https://itberg.goatcounter.com.
2. Si le code `itberg` est déjà pris, choisissez-en un autre, puis remplacez `itberg.goatcounter.com` par le nouveau nom dans **deux fichiers** : `public/js/main.js` (variable `GC`) et `firebase.json` (ligne `Content-Security-Policy`).
3. Dans les réglages GoatCounter, choisissez une durée de conservation des données, puis reportez-la dans `mentions-legales.html` à la place du `[À COMPLÉTER]` de la partie « Mesure d'audience ».

Vous verrez alors les visites par jour et par heure, les pages vues, les sites d'où viennent les visiteurs, les pays, les navigateurs et les tailles d'écran.

> Pourquoi pas Google Analytics ? GA4 dépose des cookies. En Europe, il faut alors une bannière de consentement conforme (Consent Mode v2), et beaucoup de visiteurs refusent, ce qui fausse les chiffres. Pour un site vitrine, GoatCounter donne l'essentiel sans bannière. Si vous voulez quand même GA4 plus tard, il faudra ajouter une bannière de consentement et modifier la CSP.

### 2. Mettre en ligne (voir NOTICE.md)
Remplissez les `[À COMPLÉTER]`, puis fusionnez sur `main` : GitHub publie le site tout seul. Reliez ensuite itberg.tn et www.itberg.tn.

### 3. Google Search Console
1. Allez sur https://search.google.com/search-console, puis cliquez sur **Ajouter une propriété** et choisissez le type **Domaine** : `itberg.tn`.
2. Google donne un enregistrement **TXT** (`google-site-verification=…`). Ajoutez-le dans la zone DNS chez votre bureau d'enregistrement `.tn`, à côté des enregistrements Firebase, puis cliquez sur Valider.
3. Allez dans **Sitemaps** et envoyez `https://itberg.tn/sitemap.xml`.
4. Allez dans **Inspection de l'URL** et demandez l'indexation de l'accueil, de /solutions et de /ia.
5. Après quelques jours, regardez Pages (indexation), Performances (requêtes) et Améliorations (fil d'Ariane, FAQ).

### 4. Bing Webmaster Tools (alimente aussi ChatGPT Search, Copilot et DuckDuckGo)
1. Allez sur https://www.bing.com/webmasters, puis choisissez **Importer depuis Google Search Console** (c'est le plus simple, aucune nouvelle vérification).
2. Vérifiez que le sitemap apparaît. Sinon, ajoutez `https://itberg.tn/sitemap.xml`.
3. **IndexNow** : c'est **automatique**. GitHub prévient Bing après chaque publication sur `main`. Si vous publiez à la main, lancez cette commande depuis le dossier `itberg-site` :
   ```
   curl -X POST "https://api.indexnow.org/indexnow" -H "Content-Type: application/json" -d "{\"host\":\"itberg.tn\",\"key\":\"$(cat .indexnow-key)\",\"keyLocation\":\"https://itberg.tn/$(cat .indexnow-key).txt\",\"urlList\":[\"https://itberg.tn/\",\"https://itberg.tn/solutions\",\"https://itberg.tn/ia\",\"https://itberg.tn/conseil\",\"https://itberg.tn/android\",\"https://itberg.tn/securite\",\"https://itberg.tn/applis\",\"https://itberg.tn/contact\",\"https://itberg.tn/mentions-legales\"]}"
   ```
   Une réponse 200 ou 202 signifie que c'est bon.

### 5. Vérifier les données structurées et le partage
- Google Rich Results Test (https://search.google.com/test/rich-results) : testez `https://itberg.tn/`.
- Schema Markup Validator (https://validator.schema.org) : même test, plus détaillé.
- LinkedIn Post Inspector (https://www.linkedin.com/post-inspector/) : vérifiez l'aperçu de partage de `https://itberg.tn/`.
- PageSpeed Insights (https://pagespeed.web.dev) : visez plus de 90 sur mobile.

### 6. Liens entrants (le levier le plus important pour un nouveau site)
- **LinkedIn** : renseignez `https://itberg.tn` comme site web de la page entreprise. Ajoutez-le aussi aux profils personnels de Slim et Lynda (expérience ITBerg).
- **el9offa.tn et easyfind.tn** : ajoutez en bas de chaque site « Développé par ITBerg » avec un lien vers `https://itberg.tn`.
- **Fiches Google Play** des applications : indiquez `https://itberg.tn` comme site du développeur. Cela sert aussi pour le compte Play Console de l'organisation.
- **Google Business Profile** : seulement si vous recevez des clients à une adresse. Sinon, créez une fiche « zone desservie », sans adresse publique.
- Annuaires et écosystème tunisien : startups, associations tech, événements. Listez uniquement ceux où vous êtes réellement inscrits.

### 7. Les moteurs IA (ChatGPT, Claude, Perplexity, Gemini)
- Ils lisent le site directement, puisque robots.txt les autorise. Ils lisent aussi `llms.txt` et les données structurées.
- Ce qui fait le plus pour être cité : des pages claires qui répondent à des questions précises (la FAQ), des mentions cohérentes d'ITBerg ailleurs (LinkedIn, vos applications, articles), et du contenu régulier.
- Idée de suite : une rubrique « Notes » avec un article par mois. Par exemple : « Comment garder un agent IA sous contrôle », « IA et arabe tunisien », « Auditer une app avec MobSF ».

### 8. Tous les mois
- Search Console : nouvelles requêtes, pages non indexées, erreurs.
- GoatCounter : pages les plus vues, sources de trafic.
- Mettez à jour `<lastmod>` dans `sitemap.xml` quand une page change. IndexNow est relancé automatiquement à la publication.

### À vérifier sur le plan légal
- Les statistiques GoatCounter ne conservent pas d'adresse IP et ne permettent pas d'identifier un visiteur. Vérifiez quand même auprès de l'**INPDP** si une déclaration est nécessaire pour ITBerg, notamment pour les messages reçus sur contact@itberg.tn.

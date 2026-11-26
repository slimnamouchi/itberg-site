# Mettre itberg.tn en ligne : le guide pas à pas (OVH + Firebase)

Ce guide vous emmène, clic par clic, de « le site existe sur Firebase » à « itberg.tn s'affiche avec le cadenas, les e-mails sont protégés et Google connaît le site ». Prévoyez environ **1 h 30 de manipulations**, réparties sur deux jours à cause des délais d'attente.

**Ce qu'il vous faut :**
- votre accès à l'espace client OVH (https://www.ovh.com/manager/) ;
- votre compte Google qui gère le projet Firebase `itberg-site` (https://console.firebase.google.com) ;
- votre accès GitHub au dépôt `slimnamouchi/itberg-site` ;
- un bloc-notes ouvert à côté, pour coller les valeurs.

**L'ordre à suivre** (ne sautez pas d'étape, chacune prépare la suivante) :

| Étape | Où | Durée | Ensuite |
|---|---|---|---|
| 0. Préparer | OVH | 10 min | – |
| 1. Demander les valeurs à Firebase | Firebase | 10 min | – |
| 2. Les coller chez OVH | OVH | 15 min | attendre 1 à 24 h |
| 3. Vérifier que le site répond | navigateur | 5 min | – |
| 4. CAA (certificats) | OVH | 5 min | – |
| 5. SPF, DKIM, DMARC (e-mails) | OVH | 15 min | – |
| 6. Remplacer la clé de publication GitHub | Google Cloud + GitHub | 20 min | – |
| 7. Google Search Console et Bing | Google + Bing | 15 min | – |
| 8. DNSSEC (en dernier) | OVH | 5 min | attendre 24 h |

> **Vocabulaire minimal.** La « zone DNS » est l'annuaire de votre domaine : elle dit « itberg.tn, c'est telle machine ». Chaque ligne s'appelle une « entrée » ou un « enregistrement ». Un enregistrement **A** donne une adresse de serveur, un **TXT** contient un texte de vérification, un **CNAME** dit « va voir tel autre nom », un **MX** dit où arrivent les e-mails.

---

## Étape 0. Préparer (OVH, 10 min)

### 0.1 Ouvrir la zone DNS
1. Connectez-vous sur https://www.ovh.com/manager/.
2. En haut de l'écran, cliquez sur **Web Cloud**.
3. Dans la colonne de gauche, dépliez **Noms de domaine**, puis cliquez sur **itberg.tn**.
4. Vous voyez des onglets en haut : *Informations générales*, *Zone DNS*, *Serveurs DNS*, *Redirection*, etc.

### 0.2 Vérifier que c'est bien OVH qui gère l'annuaire
1. Cliquez sur l'onglet **Serveurs DNS**.
2. Les deux lignes doivent ressembler à `dnsXX.ovh.net` et `nsXX.ovh.net` (XX = des chiffres).
   - ✅ C'est le cas : continuez.
   - ❌ Vous voyez autre chose (par exemple un nom en `.tn` d'un autre prestataire) : **arrêtez-vous et envoyez-moi une capture**. Dans ce cas, tout ce qui suit doit se faire chez ce prestataire, pas chez OVH.

### 0.3 Faire une sauvegarde de la zone
1. Cliquez sur l'onglet **Zone DNS**.
2. À droite du tableau, cliquez sur **Modifier en mode textuel** (parfois derrière un bouton « … » ou « Actions »).
3. Une grande zone de texte s'ouvre. Cliquez dedans, faites **Ctrl + A** (Cmd + A sur Mac) puis **Ctrl + C**.
4. Collez dans votre bloc-notes et enregistrez le fichier sous `sauvegarde-zone-itberg-2026-11-26.txt`.
5. Cliquez sur **Annuler** (on ne modifie rien ici).

Si quelque chose se passe mal plus tard, ce fichier permet de tout remettre comme avant (même bouton, on recolle, on valide).

### 0.4 Repérer ce qui existe déjà
Dans l'onglet **Zone DNS**, regardez le tableau et notez dans votre bloc-notes :

- **Les lignes de type A et AAAA** dont le « Domaine » est `itberg.tn.` ou `www.itberg.tn.`. OVH en crée par défaut (elles pointent vers une page d'attente OVH, souvent une adresse qui commence par `213.186.` ou `2001:41d0:`). **Elles devront être supprimées à l'étape 2.**
- **Une ligne CNAME sur `www.itberg.tn.`**, s'il y en a une. Elle devra aussi être supprimée à l'étape 2.
- **Les lignes de type MX.** Elles disent qui reçoit vos e-mails. Recopiez leur cible :

| Vous voyez dans MX | Cela veut dire | Votre « cas e-mail » pour l'étape 5 |
|---|---|---|
| `mx1.mail.ovh.net`, `mx2.mail.ovh.net`, `mx3.mail.ovh.net` | Les e-mails passent par OVH (boîte MX Plan, Email Pro, ou simple redirection OVH) | **Cas OVH** ou **Cas redirection** (voir 0.5) |
| `aspmx.l.google.com` ou `smtp.google.com` | Google Workspace | **Cas Google Workspace** |
| Autre chose (Zoho, Microsoft `…mail.protection.outlook.com`…) | Un autre fournisseur | Envoyez-moi le nom, je vous donne les valeurs |
| Aucune ligne MX | **Personne ne reçoit les e-mails envoyés à contact@itberg.tn** | À régler avant l'étape 5, dites-le-moi |

- **Les lignes TXT** dont la cible commence par `v=spf1`. Il ne doit y en avoir qu'une. Notez-la.

### 0.5 Savoir comment vous utilisez contact@itberg.tn
Dans **Web Cloud**, colonne de gauche, ouvrez **E-mails** (ou **Emails**) puis `itberg.tn`.
- Vous voyez des **comptes e-mail** (avec une boîte et un mot de passe) : c'est le **Cas OVH**.
- Vous voyez seulement l'onglet **Redirection** avec `contact@itberg.tn → votre adresse Gmail` : c'est le **Cas redirection**. Une question importante : quand vous répondez à un client, le message part-il **de** contact@itberg.tn (réglage « Envoyer des e-mails en tant que » dans Gmail) ? Si oui, notez-le, cela change l'étape 5.

---

## Étape 1. Demander à Firebase les valeurs à coller (10 min)

Firebase ne connaît pas encore itberg.tn. On le lui présente, et il nous donne les lignes exactes à mettre chez OVH. **Ces valeurs viennent de Firebase : copiez-les depuis l'écran, ne les tapez pas de mémoire.**

### 1.1 Ajouter itberg.tn
1. Ouvrez https://console.firebase.google.com et cliquez sur le projet **itberg-site**.
2. Dans le menu de gauche, ouvrez **Créer** (Build) puis **Hosting**. Si le menu est replié, cliquez sur **Tous les produits** et cherchez « Hosting ».
3. Vous voyez un encadré « Domaines » avec `itberg-site.web.app` et `itberg-site.firebaseapp.com`. Cliquez sur **Ajouter un domaine personnalisé** (Add custom domain).
4. Dans la case « Domaine », tapez exactement :
   ```
   itberg.tn
   ```
   Ne cochez **pas** « Rediriger itberg.tn vers un site web existant ». Cliquez sur **Continuer**.
5. Firebase affiche un tableau « Configurer le DNS » (mode **Configuration rapide** / Quick setup). Il contient en général :
   - une ligne **TXT**, nom d'hôte `itberg.tn`, valeur qui ressemble à `hosting-site=itberg-site` ;
   - une ligne **A**, nom d'hôte `itberg.tn`, valeur qui est une adresse IP (souvent `199.36.158.100`).

   Il peut aussi indiquer des lignes « à supprimer » : ce sont les anciennes adresses OVH, il les a détectées lui-même. Notez-les.
6. **Recopiez chaque ligne dans votre bloc-notes**, colonne par colonne (type, nom d'hôte, valeur). Utilisez l'icône « copier » à côté de chaque valeur quand elle existe.
7. Laissez cet onglet ouvert. Cliquez sur **Terminer** ou **Vérifier** seulement après l'étape 2.

### 1.2 Ajouter www.itberg.tn (redirigé vers itberg.tn)
1. Revenez sur la page Hosting et cliquez de nouveau sur **Ajouter un domaine personnalisé**.
2. Tapez :
   ```
   www.itberg.tn
   ```
3. **Cochez** « Rediriger www.itberg.tn vers un site web existant », puis choisissez **itberg.tn** dans la liste. Ainsi, une seule adresse est indexée par Google.
4. Cliquez sur **Continuer**. Firebase donne de nouveau une ou deux lignes (souvent un **A** et un **TXT** sur `www.itberg.tn`, parfois un **CNAME**). **Recopiez-les aussi.**

> **Piège :** Firebase écrit parfois le nom d'hôte complet (`itberg.tn`, `www.itberg.tn`). Chez OVH, on ne tape que **ce qui est avant** `itberg.tn` (voir étape 2).

---

## Étape 2. Coller les valeurs chez OVH (15 min)

Revenez dans OVH : **Web Cloud → Noms de domaine → itberg.tn → onglet Zone DNS**.

### La règle d'or du champ « Sous-domaine »
OVH ajoute `itberg.tn` tout seul à la fin. Donc :

| Firebase dit (nom d'hôte) | Vous tapez dans « Sous-domaine » chez OVH |
|---|---|
| `itberg.tn` ou `@` | **rien** (laissez la case vide) |
| `www.itberg.tn` ou `www` | `www` |

Si vous tapez `itberg.tn` dans la case, OVH crée `itberg.tn.itberg.tn`, et rien ne marche.

### 2.1 Supprimer les anciennes adresses OVH
Pour chaque ligne repérée en 0.4 (A et AAAA sur `itberg.tn.` et sur `www.itberg.tn.`, et CNAME sur `www.itberg.tn.`) :
1. Cliquez sur le bouton **…** (ou la roue dentée) au bout de la ligne.
2. Choisissez **Supprimer l'entrée**, puis **Confirmer**.

**Ne supprimez pas** les lignes MX, les lignes TXT existantes (sauf si Firebase vous l'a demandé), ni les lignes NS.

> **Pourquoi c'est important :** si une ancienne adresse OVH reste à côté de celle de Firebase, une partie des visiteurs tombe sur la page d'attente OVH, et Firebase refuse de créer le certificat HTTPS. Les lignes **AAAA** (adresses IPv6) sont les plus souvent oubliées.

### 2.2 Ajouter la ligne TXT de Firebase (itberg.tn)
1. Cliquez sur **Ajouter une entrée** (à droite, au-dessus du tableau).
2. Dans la fenêtre, section « Champs étendus », cliquez sur **TXT**.
3. **Sous-domaine** : laissez vide.
4. **TTL** : laissez « Par défaut ».
5. **Valeur** : collez la valeur TXT donnée par Firebase, **sans guillemets** (OVH les ajoute).
6. Cliquez sur **Suivant**, vérifiez le résumé, puis **Valider**.

### 2.3 Ajouter la ligne A de Firebase (itberg.tn)
1. **Ajouter une entrée** → section « Champs de pointage » → **A**.
2. **Sous-domaine** : vide.
3. **Cible** : collez l'adresse IP donnée par Firebase.
4. **Suivant**, puis **Valider**.

Si Firebase vous a donné plusieurs lignes A, refaites cette étape pour chacune.

### 2.4 Ajouter les lignes de www
Refaites 2.2 et 2.3 (ou un **CNAME** si c'est ce que Firebase indique) avec les valeurs de l'étape 1.2, en tapant cette fois `www` dans **Sous-domaine**.

Pour un CNAME : **Ajouter une entrée → CNAME**, sous-domaine `www`, cible = la valeur Firebase **avec un point final** si OVH le demande (par exemple `itberg-site.web.app.`).

> **Piège :** un CNAME ne peut pas cohabiter avec une autre ligne sur le même nom. S'il reste un A, un AAAA ou un TXT sur `www`, OVH refusera le CNAME. Supprimez-les d'abord.

### 2.5 Relire le résultat
Dans le tableau de la Zone DNS, vous devez voir maintenant :
- sur `itberg.tn.` : la ou les lignes **A** de Firebase, la ligne **TXT** `hosting-site=…`, vos lignes **MX**, et éventuellement votre ligne SPF ;
- sur `www.itberg.tn.` : uniquement les lignes données par Firebase pour www ;
- **plus aucune** ligne A ou AAAA qui pointe vers une adresse OVH.

### 2.6 Dire à Firebase de vérifier
1. Revenez dans l'onglet Firebase, sur chaque domaine, cliquez sur **Vérifier** (Verify).
2. Le statut passe par **Configuration requise** → **En attente** (Pending / Minting certificate) → **Connecté** (Connected).
3. **C'est normal d'attendre.** Le passage à « Connecté » prend de 15 minutes à 24 heures (OVH met parfois jusqu'à 1 h à publier une modification, et le certificat HTTPS prend encore un peu de temps). Ne modifiez rien pendant ce temps : chaque changement relance le compteur.

---

## Étape 3. Vérifier que le site répond (5 min, après l'attente)

1. **Voir ce que le monde entier voit** : ouvrez https://toolbox.googleapps.com/apps/dig/#A/itberg.tn
   - Le résultat doit afficher **uniquement** l'adresse IP de Firebase. Si vous voyez aussi une adresse OVH, retournez à 2.1.
   - Vérifiez aussi https://toolbox.googleapps.com/apps/dig/#AAAA/itberg.tn : le résultat doit être **vide**.
2. Ouvrez https://itberg.tn dans une fenêtre de navigation privée : le site s'affiche avec le **cadenas**.
3. Ouvrez https://www.itberg.tn : vous devez être renvoyée automatiquement vers https://itberg.tn.
4. Dans Firebase → Hosting, les deux domaines affichent **Connecté**.

**Ça ne marche pas ?**
| Symptôme | Cause probable | Que faire |
|---|---|---|
| Page OVH « Site en construction » | Une ancienne ligne A/AAAA OVH reste | Supprimez-la (2.1), attendez 1 h |
| « Votre connexion n'est pas privée » | Certificat pas encore créé | Attendez jusqu'à 24 h |
| Firebase reste « Configuration requise » | Faute de frappe ou mauvais sous-domaine | Comparez ligne par ligne avec le tableau Firebase |
| Firebase dit « enregistrements à supprimer » | Il voit encore l'ancienne adresse | Retirez-la chez OVH |

---

## Étape 4. CAA : qui a le droit de créer un certificat pour itberg.tn (5 min)

À faire **après** que Firebase affiche « Connecté ». Firebase obtient ses certificats auprès de Let's Encrypt et de Google Trust Services : on autorise ces deux-là, et personne d'autre.

Pour chaque ligne du tableau : **Zone DNS → Ajouter une entrée → (Champs étendus) CAA**.

| Sous-domaine | TTL | Flags | Tag | Cible |
|---|---|---|---|---|
| (vide) | Par défaut | `0` | `issue` | `letsencrypt.org` |
| (vide) | Par défaut | `0` | `issue` | `pki.goog` |
| (vide) | Par défaut | `0` | `issuewild` | `;` |
| (vide) | Par défaut | `0` | `iodef` | `mailto:contact@itberg.tn` |

- Tapez la cible **sans guillemets**.
- Si OVH refuse la cible `;` de la ligne `issuewild`, passez cette ligne : elle est utile mais pas indispensable.

**Vérifier :** https://toolbox.googleapps.com/apps/dig/#CAA/itberg.tn doit afficher les lignes ci-dessus. Puis rechargez https://itberg.tn : le cadenas doit toujours être là.

---

## Étape 5. Protéger contact@itberg.tn : SPF, DKIM, DMARC (15 min)

Ces trois lignes disent aux messageries du monde entier quels serveurs ont le droit d'envoyer des e-mails au nom d'itberg.tn, et quoi faire des imposteurs. Reprenez votre **cas e-mail** trouvé en 0.4 et 0.5.

> **Règle :** un domaine n'a qu'**une seule** ligne SPF. Si une ligne TXT commençant par `v=spf1` existe déjà, **modifiez-la** (bouton **…** → **Modifier l'entrée**) au lieu d'en ajouter une deuxième. Deux lignes SPF = SPF cassé.

### 5.1 SPF (Zone DNS → Ajouter une entrée → TXT, sous-domaine vide)

| Votre cas | Valeur à coller |
|---|---|
| **Cas OVH** (vraies boîtes e-mail OVH) | `v=spf1 include:mx.ovh.com ~all` |
| **Cas Google Workspace** | `v=spf1 include:_spf.google.com ~all` |
| **Cas redirection**, et vous répondez **depuis** contact@itberg.tn avec Gmail | `v=spf1 include:_spf.google.com ~all` |
| **Cas redirection**, et vous n'envoyez **jamais** depuis contact@itberg.tn | `v=spf1 -all` |

Si vous avez à la fois des boîtes OVH **et** un envoi par Gmail : `v=spf1 include:mx.ovh.com include:_spf.google.com ~all`.

> OVH propose aussi un assistant « SPF » dans la liste des types. Préférez **TXT** et collez la valeur ci-dessus : c'est plus simple à relire.

### 5.2 DKIM (la signature de vos e-mails)

- **Cas OVH** : **Web Cloud → E-mails → itberg.tn** (ou **Email Pro**/**Exchange** selon votre offre). Cherchez **DKIM** (onglet *Informations générales*, ou *Sécurité*), puis **Activer**. La zone étant chez OVH, les lignes sont ajoutées toutes seules. Attendez 24 h que l'état passe à « Actif ».
- **Cas Google Workspace** : https://admin.google.com → **Applications → Google Workspace → Gmail → Authentifier les e-mails**. Choisissez `itberg.tn`, cliquez sur **Générer un nouvel enregistrement** (clé 2048 bits). Google affiche un nom (`google._domainkey`) et une longue valeur `v=DKIM1; k=rsa; p=…`. Chez OVH : **Ajouter une entrée → TXT**, sous-domaine `google._domainkey`, valeur = la longue valeur copiée en entier. Le lendemain, revenez dans Google et cliquez sur **Démarrer l'authentification**.
- **Cas redirection** (vous n'envoyez jamais depuis contact@itberg.tn) : **Ajouter une entrée → TXT**, sous-domaine `*._domainkey`, valeur :
  ```
  v=DKIM1; p=
  ```
  (cela dit « aucune signature n'est valide pour ce domaine »).
- **Cas redirection avec réponses via Gmail** : Gmail ne peut pas signer pour itberg.tn sans Google Workspace. Passez cette ligne : SPF suffit pour démarrer, et DMARC restera en observation (`p=none`). Dites-le-moi, on choisira ensemble une solution.

### 5.3 DMARC (la consigne pour les imposteurs)
**Ajouter une entrée → TXT**, sous-domaine `_dmarc`, valeur :
```
v=DMARC1; p=none; rua=mailto:contact@itberg.tn; fo=1
```
C'est le mode **observation** : rien n'est bloqué, mais Gmail, Outlook, Yahoo… vous envoient chaque jour un rapport (pièce jointe `.zip` ou `.xml`) sur contact@itberg.tn. Ne les supprimez pas tout de suite, je peux les lire avec vous.

Plus tard, on durcit :

| Quand | Valeur de `_dmarc` | Condition |
|---|---|---|
| Aujourd'hui | `v=DMARC1; p=none; rua=mailto:contact@itberg.tn; fo=1` | aucune |
| Dans 2 à 4 semaines | `v=DMARC1; p=quarantine; rua=mailto:contact@itberg.tn; fo=1` | les rapports ne montrent que vos propres envois, en réussite |
| 4 semaines plus tard | `v=DMARC1; p=reject; rua=mailto:contact@itberg.tn; fo=1` | aucun envoi légitime en échec |

**Cas redirection sans aucun envoi** : vous pouvez mettre directement `p=reject`.

**Vérifier :** https://internet.nl/mail/itberg.tn/ (bouton « Start test » si la page le demande). SPF, DKIM et DMARC doivent être verts, ou orange pour DMARC tant qu'il est en `p=none`.

---

## Étape 6. Remplacer la clé que GitHub utilise pour publier (20 min)

**Pourquoi :** GitHub publie le site sur Firebase avec une clé stockée dans le secret **`FIREBASE_SERVICE_ACCOUNT`** (c'est le nom exact utilisé par les deux fichiers `.github/workflows/publication-production.yml` et `apercu-pull-request.yml`). Si cette clé a été créée automatiquement par Firebase, elle a souvent plus de droits que nécessaire. On la remplace par une clé qui ne peut **que** publier le site.

### 6.1 Créer le compte limité
1. Ouvrez https://console.cloud.google.com/iam-admin/serviceaccounts?project=itberg-site
2. En haut, vérifiez que le projet affiché est bien **itberg-site**.
3. Repérez dans la liste le compte actuel. Il s'appelle en général `github-action-…@itberg-site.iam.gserviceaccount.com` ou `firebase-adminsdk-…`. **Notez son adresse.** (Ne touchez pas à `firebase-adminsdk-…` : il sert à Firebase lui-même. Le compte GitHub est celui qui contient `github`.)
4. Cliquez sur **+ Créer un compte de service**.
   - **Nom** : `github-publication`
   - Cliquez sur **Créer et continuer**.
5. Dans « Accorder à ce compte de service l'accès au projet », cliquez sur la liste **Rôle**, tapez `Hosting` et choisissez **Administrateur Firebase Hosting** (Firebase Hosting Admin).
6. Cliquez sur **+ Ajouter un autre rôle**, tapez `API Keys` et choisissez **Lecteur de clés API** (API Keys Viewer).
7. Cliquez sur **Continuer**, puis **OK**. N'ajoutez aucun autre rôle.

### 6.2 Créer sa clé
1. Dans la liste, cliquez sur l'adresse `github-publication@itberg-site.iam.gserviceaccount.com`.
2. Onglet **Clés** → **Ajouter une clé** → **Créer une clé** → **JSON** → **Créer**.
3. Un fichier `itberg-site-xxxxxxxx.json` se télécharge. **Ne l'envoyez à personne, ne le mettez nulle part** (ni e-mail, ni WhatsApp, ni chat).

   Si Google affiche « La création de clés de compte de service est désactivée », envoyez-moi une capture : c'est une règle de sécurité du compte, il y a une autre méthode.

### 6.3 Remplacer le secret dans GitHub
1. Ouvrez https://github.com/slimnamouchi/itberg-site/settings/secrets/actions
2. Dans « Repository secrets », sur la ligne **`FIREBASE_SERVICE_ACCOUNT`**, cliquez sur le **crayon** (Update).
3. Ouvrez le fichier `.json` téléchargé avec le Bloc-notes (Windows) ou TextEdit (Mac). Sélectionnez **tout** (Ctrl/Cmd + A), copiez, et collez dans la case « Value » de GitHub. Le texte commence par `{` et finit par `}`.
4. Cliquez sur **Update secret**.
5. **Supprimez le fichier `.json`** de votre ordinateur, puis videz la corbeille.

### 6.4 Vérifier que la publication marche avec la nouvelle clé
1. Ouvrez https://github.com/slimnamouchi/itberg-site/actions/workflows/publication-production.yml
2. À droite, cliquez sur **Run workflow**, laissez `main`, puis le bouton vert **Run workflow**.
3. Attendez 1 à 2 minutes : la ligne doit devenir une **coche verte**.
   - ❌ Croix rouge : cliquez dessus et envoyez-moi une capture de l'étape « Publier sur Firebase Hosting ». L'ancienne clé fonctionne encore tant que vous ne l'avez pas supprimée, rien n'est cassé.

### 6.5 Désactiver l'ancienne clé (seulement si 6.4 est vert)
1. Revenez sur https://console.cloud.google.com/iam-admin/serviceaccounts?project=itberg-site
2. Cliquez sur l'**ancien** compte noté en 6.1.3 → onglet **Clés** → icône **corbeille** sur chaque clé → **Supprimer**.
3. Puis en haut de la page du compte : **Désactiver le compte de service**. (Vous pourrez le supprimer définitivement dans un mois si rien ne s'est plaint.)

---

## Étape 7. Google Search Console et Bing (15 min)

### 7.1 Google Search Console
1. Ouvrez https://search.google.com/search-console et connectez-vous avec le compte Google d'ITBerg.
2. En haut à gauche, liste des propriétés → **Ajouter une propriété**.
3. Choisissez la case de gauche, **Domaine**, tapez `itberg.tn`, cliquez sur **Continuer**.
4. Google affiche une valeur qui commence par `google-site-verification=`. Cliquez sur **Copier**.
5. Chez OVH : **Zone DNS → Ajouter une entrée → TXT**, sous-domaine **vide**, valeur = ce que vous venez de copier. **Suivant → Valider**.

   Ce n'est pas une deuxième SPF : plusieurs lignes TXT sur `itberg.tn` peuvent cohabiter (hosting-site, google-site-verification, SPF). Seule la SPF doit être unique.
6. Attendez 10 à 60 minutes, revenez dans Search Console et cliquez sur **Valider**. Si Google dit « échec », attendez encore une heure et réessayez : c'est presque toujours un délai.
7. Une fois validé, menu de gauche **Sitemaps** → dans « Ajouter un sitemap », tapez `sitemap.xml` → **Envoyer**. Ajoutez aussi `feed.xml` de la même façon.
8. Menu **Inspection de l'URL** → collez `https://itberg.tn/` → **Demander l'indexation**. Faites de même pour `https://itberg.tn/solutions` et `https://itberg.tn/ia`.

### 7.2 Bing Webmaster Tools (alimente aussi ChatGPT Search, Copilot et DuckDuckGo)
1. Ouvrez https://www.bing.com/webmasters et connectez-vous (le compte Google fonctionne).
2. Choisissez **Importer depuis Google Search Console** → **Continuer** → autorisez l'accès → cochez `itberg.tn` → **Importer**. Pas de nouvelle vérification à faire.
3. Menu **Sitemaps** : vérifiez que `https://itberg.tn/sitemap.xml` apparaît. Sinon, **Envoyer un sitemap** et collez cette adresse.
4. IndexNow est déjà automatique : GitHub prévient Bing à chaque publication.

---

## Étape 8. DNSSEC, en dernier (5 min + 24 h)

DNSSEC empêche qu'on envoie de fausses adresses aux visiteurs d'itberg.tn. Faites-le **seulement** quand le site affiche le cadenas depuis au moins un jour : une erreur ici peut rendre le site et les e-mails injoignables pendant quelques heures.

1. **Web Cloud → Noms de domaine → itberg.tn → onglet Informations générales**.
2. Dans l'encadré « Sécurité », repérez la ligne **DNSSEC** et cliquez sur l'interrupteur pour l'**activer**, puis confirmez.
3. Attendez 24 heures, puis ouvrez https://dnsviz.net/d/itberg.tn/dnssec/ et cliquez sur **Analyze**. Le schéma doit être sans rouge.

**Cas particuliers :**
- **L'option est grisée ou absente** : le .tn passe par le registre tunisien (ATI), et OVH ne le propose peut-être pas pour cette extension. Ouvrez un ticket au support OVH avec cette phrase : « Pouvez-vous activer DNSSEC et publier l'enregistrement DS auprès du registre .tn pour itberg.tn ? ». S'ils disent non, ce n'est pas grave : le reste de la protection est en place.
- **Si un jour vous quittez OVH pour l'annuaire DNS** : désactivez DNSSEC d'abord et attendez 48 heures, sinon le domaine devient injoignable.

---

## Récapitulatif : toutes les lignes de la zone à la fin

| Sous-domaine | Type | Valeur | Origine |
|---|---|---|---|
| (vide) | A | adresse IP donnée par Firebase | Étape 1.1 |
| (vide) | TXT | `hosting-site=…` donné par Firebase | Étape 1.1 |
| `www` | A/TXT ou CNAME | valeurs données par Firebase | Étape 1.2 |
| (vide) | MX | inchangé | déjà là |
| (vide) | TXT | votre SPF (une seule) | Étape 5.1 |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:contact@itberg.tn; fo=1` | Étape 5.3 |
| `google._domainkey` ou `*._domainkey` (selon votre cas) | TXT | voir 5.2 | Étape 5.2 |
| (vide) | CAA ×4 | voir étape 4 | Étape 4 |
| (vide) | TXT | `google-site-verification=…` | Étape 7.1 |

**Il ne doit plus y avoir** : de ligne A ou AAAA pointant vers OVH sur `itberg.tn` ou `www`, ni deux lignes `v=spf1`.

---

## Quand c'est fait, envoyez-moi juste

1. « Étapes 1 à 3 faites, le site s'affiche » (ou une capture du message d'erreur).
2. Votre **cas e-mail** (OVH, Google Workspace, redirection, avec ou sans réponses depuis contact@itberg.tn).
3. La couleur de la publication de l'étape 6.4.

Je relance alors les tests de sécurité sur le vrai domaine (en-têtes, HTTPS, e-mail, DNSSEC), je complète la mention « bureau d'enregistrement : OVH » dans les mentions légales, et je vous dis s'il reste quelque chose.

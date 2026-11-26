/* ITBerg · Démo de recherche locale (version de démonstration, catalogue fictif).
   Tout se passe dans ce fichier, dans votre navigateur : aucune requête n'est envoyée,
   aucun modèle n'est téléchargé, rien n'est enregistré.
   Compatible avec une CSP stricte et Trusted Types : aucune évaluation de texte ni écriture de HTML brut. */
(function () {
  "use strict";

  /* ---------- 1. Lexique : un concept, ses mots en français, arabe, derja en lettres latines, anglais ---------- */
  var LEX = {
    plombier: { fr: "plombier", en: "plumber", ar: "سبّاك", w: { fr: ["plombier", "plomberie", "fuite", "robinet", "tuyau", "chauffe-eau"], tn: ["blombi", "plombi", "blombier", "sabbek", "rbini", "sakhan"], ar: ["سباك", "بلومبي", "روبيني", "سخان", "تسريب"], en: ["plumber", "plumbing", "leak"] } },
    electricien: { fr: "électricien", en: "electrician", ar: "كهربائي", w: { fr: ["électricien", "électricité", "courant", "prise", "disjoncteur"], tn: ["trisian", "trisien", "tricien", "kahrabji", "ka7raba", "kahraba", "dhaw", "dhou"], ar: ["تريسيان", "كهربائي", "كهربجي", "كهرباء", "ضو"], en: ["electrician", "electricity", "power"] } },
    clim: { fr: "climatisation", en: "air conditioning", ar: "مكيّف", w: { fr: ["climatiseur", "climatisation", "clim"], tn: ["climatizor", "climatizeur", "klimatizor", "mkayef", "mokayef"], ar: ["مكيف", "كليماتيزور", "تكييف"], en: ["air", "conditioner", "ac"] } },
    reparation: { fr: "réparation", en: "repair", ar: "تصليح", w: { fr: ["réparation", "réparer", "dépannage", "panne", "cassé"], tn: ["tasli7", "taslih", "nsalla7", "nsallah", "sale7", "mkasser", "ma5douma", "makhdouma", "tayeh"], ar: ["تصليح", "نصلح", "مكسر", "طايح", "ماخدومة"], en: ["repair", "fix", "broken"] } },
    mecanicien: { fr: "mécanicien", en: "mechanic", ar: "ميكانيكي", w: { fr: ["mécanicien", "mécanique", "garage", "vidange"], tn: ["mikanisyan", "mekanik", "mecanisien", "garaj"], ar: ["ميكانيسيان", "ميكانيك", "ميكانيكي", "قاراج"], en: ["mechanic", "garage"] } },
    voiture: { fr: "voiture", en: "car", ar: "كرهبة", w: { fr: ["voiture", "auto", "automobile"], tn: ["karhba", "kar7ba", "karehba", "sayara"], ar: ["كرهبة", "سيارة", "كرهبتي"], en: ["car"] } },
    pneus: { fr: "pneus", en: "tyres", ar: "عجلات", w: { fr: ["pneu", "pneus", "roue", "équilibrage"], tn: ["3ajla", "ajla", "pnou", "rwida"], ar: ["عجلة", "عجلات", "رويضة"], en: ["tyre", "tire", "wheel"] } },
    pharmacie: { fr: "pharmacie", en: "pharmacy", ar: "صيدلية", w: { fr: ["pharmacie", "pharmacien", "médicament", "médicaments"], tn: ["farmasia", "farmasiya", "saydaliya", "saydalia", "dwe", "dwa"], ar: ["صيدلية", "فرماسيان", "فرمسية", "دواء", "دوا"], en: ["pharmacy", "drugstore", "medicine"] } },
    medecin: { fr: "médecin", en: "doctor", ar: "طبيب", w: { fr: ["médecin", "docteur", "généraliste", "consultation"], tn: ["tbib", "tbiba", "doktor", "toubib"], ar: ["طبيب", "دكتور", "طبيبة"], en: ["doctor", "physician"] } },
    dentiste: { fr: "dentiste", en: "dentist", ar: "طبيب أسنان", w: { fr: ["dentiste", "dent", "dents", "dentaire"], tn: ["snin", "snan", "asnan", "dhers", "dhors"], ar: ["أسنان", "سنين", "ضرس", "سنان"], en: ["dentist", "tooth", "teeth"] } },
    coiffeur: { fr: "coiffeur", en: "hairdresser", ar: "حجّام", w: { fr: ["coiffeur", "coiffeuse", "coiffure", "cheveux", "barbier"], tn: ["7ajjem", "hajjem", "7allek", "hallek", "cha3r", "chaar"], ar: ["حجام", "حلاق", "شعر", "كوافير"], en: ["hairdresser", "barber", "haircut"] } },
    menage: { fr: "ménage", en: "cleaning", ar: "تنظيف", w: { fr: ["ménage", "nettoyage", "nettoyer", "propreté"], tn: ["ndhafa", "nadhafa", "tandhif", "nadhef"], ar: ["نظافة", "تنظيف", "تنضيف"], en: ["cleaning", "cleaner", "housekeeping"] } },
    taxi: { fr: "taxi", en: "taxi", ar: "تاكسي", w: { fr: ["taxi", "louage", "transport", "chauffeur"], tn: ["taksi", "louaj", "lwaj"], ar: ["تاكسي", "تكسي", "لواج"], en: ["cab", "ride"] } },
    cours: { fr: "cours particuliers", en: "private tutoring", ar: "دروس خصوصية", w: { fr: ["cours", "soutien", "professeur", "prof", "maths", "mathématiques"], tn: ["9raya", "qraya", "graya", "etude", "riadhiat", "riyadhiyat"], ar: ["دروس", "قراية", "رياضيات", "أستاذ"], en: ["tutoring", "tutor", "lessons", "math"] } },
    telephone: { fr: "téléphone", en: "phone", ar: "تليفون", w: { fr: ["téléphone", "portable", "smartphone", "écran", "batterie"], tn: ["telifoun", "tlifoun", "portabl", "chacha"], ar: ["تليفون", "هاتف", "بورتابل", "شاشة"], en: ["phone", "smartphone", "screen", "battery"] } },
    internet: { fr: "internet", en: "internet", ar: "أنترنات", w: { fr: ["internet", "fibre", "wifi", "connexion", "adsl"], tn: ["antarnet", "anternet", "konexion", "wifi"], ar: ["انترنات", "انترنت", "ويفي", "كونكسيون"], en: ["internet", "fiber", "broadband"] } },
    lait: { fr: "lait", en: "milk", ar: "حليب", w: { fr: ["lait"], tn: ["7lib", "hlib", "7leeb", "halib"], ar: ["حليب"], en: ["milk"] } },
    huile: { fr: "huile d'olive", en: "olive oil", ar: "زيت زيتون", w: { fr: ["huile", "olive", "olives"], tn: ["zit", "zitoun", "zitouna", "zaytoun"], ar: ["زيت", "زيتون"], en: ["oil", "olive"] } },
    pain: { fr: "pain", en: "bread", ar: "خبز", w: { fr: ["pain", "baguette", "boulangerie"], tn: ["5obz", "khobz", "tabouna", "baguette"], ar: ["خبز", "طابونة", "باقات"], en: ["bread", "bakery"] } },
    oeufs: { fr: "œufs", en: "eggs", ar: "عظم", w: { fr: ["œufs", "oeufs", "oeuf", "œuf"], tn: ["3dham", "adham", "3adham", "baydh"], ar: ["عظم", "بيض"], en: ["eggs", "egg"] } },
    poulet: { fr: "poulet", en: "chicken", ar: "دجاج", w: { fr: ["poulet", "volaille"], tn: ["djej", "djaj", "dja9", "jej"], ar: ["دجاج", "جاج", "دجاجة"], en: ["chicken"] } },
    tomate: { fr: "tomates", en: "tomatoes", ar: "طماطم", w: { fr: ["tomate", "tomates"], tn: ["tmatem", "tmatim", "tomatich"], ar: ["طماطم", "طماطة"], en: ["tomato", "tomatoes"] } },
    harissa: { fr: "harissa", en: "harissa", ar: "هريسة", w: { fr: ["harissa"], tn: ["hrissa", "7arissa"], ar: ["هريسة"], en: ["harissa"] } },
    couscous: { fr: "couscous", en: "couscous", ar: "كسكسي", w: { fr: ["couscous", "semoule"], tn: ["kosksi", "kousksi", "kouskssi", "smid"], ar: ["كسكسي", "كسكس", "سميد"], en: ["couscous", "semolina"] } },
    dattes: { fr: "dattes", en: "dates", ar: "تمر", w: { fr: ["dattes", "datte", "deglet"], tn: ["tmar", "tmer", "deglet"], ar: ["تمر", "دقلة"], en: ["dates"] } },
    cafe: { fr: "café", en: "coffee", ar: "قهوة", w: { fr: ["café", "expresso", "capucin"], tn: ["9ahwa", "kahwa", "gahwa", "9hawa", "kapsin"], ar: ["قهوة", "كابوسان", "اكسبراس"], en: ["coffee"] } },
    the: { fr: "thé", en: "tea", ar: "تاي", w: { fr: ["thé", "menthe"], tn: ["tey", "tay", "chay", "na3na3", "naanaa"], ar: ["تاي", "شاي", "نعناع"], en: ["tea", "mint"] } },
    sucre: { fr: "sucre", en: "sugar", ar: "سكّر", w: { fr: ["sucre"], tn: ["sokker", "sukkar", "soukker", "sokkar"], ar: ["سكر"], en: ["sugar"] } }
  };

  /* Intentions et lieux : ils orientent le classement sans être des produits. */
  var INTENTS = {
    garde: { fr: "urgence ou service de garde", en: "emergency or out-of-hours service", ar: "استعجالي أو خدمة ليلية", w: ["urgent", "urgence", "garde", "nuit", "24h", "tawa", "daroura", "lil", "lila", "عاجل", "توا", "ضرورة", "الليل", "ليل", "night", "emergency", "now"] },
    prix: { fr: "connaître le prix", en: "find out the price", ar: "معرفة السعر", w: ["prix", "combien", "tarif", "9adech", "kadech", "gadech", "9addech", "soum", "si3r", "قداش", "سوم", "سعر", "price", "cost"] }
  };
  var CITIES = {
    Tunis: ["tunis", "tounes", "tunes", "تونس", "العاصمة", "l3assma", "3asma"],
    Sfax: ["sfax", "sfakes", "sfa9es", "صفاقس"],
    Sousse: ["sousse", "soussa", "sousa", "سوسة"],
    Ariana: ["ariana", "aryana", "أريانة", "اريانة"],
    Bizerte: ["bizerte", "binzart", "bnzart", "بنزرت"],
    Monastir: ["monastir", "mestir", "mnestir", "المنستير"],
    Nabeul: ["nabeul", "nabel", "نابل"]
  };
  /* Mots de liaison et d'intention générale, dans les quatre écritures : on les lit, puis on les met de côté. */
  var STOP = ("je j cherche recherche besoin veux voudrais un une des de du d la le les l pour à a au aux en et ou svp sil plait il y qui est mon ma mes avec dans sur chez quel quelle trouver " +
    "nlawej nlawj nlawjou nlawjo 3la ala n7eb nheb n7ebb nhebb na7tej nest7a9 nest79 ena ana fama famma chkoun win wein fi f mte3 mta3 bech bch ya3tik ya3tek brabi " +
    "3andi andi el il al w b ya 7ad had wa7ed wahed chnowa chnoua wala walla ken kif mta 9rib krib " +
    "i need looking for want the an of in at near me please " +
    "نلوج نلوّج على نحب انا أنا فما شكون وين في متاع باش يعطيك برّا برا عندي يا حد واحد شنوة قريب من").split(" ");

  /* ---------- 2. Normalisation et forme pivot ---------- */
  var AR_RE = /[؀-ۿ]/;
  function normalize(s) {
    return s.toLowerCase()
      .replace(/œ/g, "oe").replace(/æ/g, "ae")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")        // accents latins
      .replace(/[ً-ٰٟـ]/g, "")              // voyelles brèves, chadda, tatouil
      .replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
      .replace(/(.)\1{2,}/g, "$1$1");                           // « 7leeeeb » → « 7leeb »
  }
  function tokenize(s) {
    return normalize(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  }
  var AR_MAP = { "ب": "b", "پ": "b", "ت": "t", "ث": "t", "ط": "t", "ج": "j", "ح": "h", "ه": "h", "خ": "X", "د": "d", "ذ": "d", "ض": "d", "ظ": "d",
    "ر": "r", "ز": "z", "س": "s", "ص": "s", "ش": "C", "غ": "G", "ف": "f", "ڥ": "f", "ق": "k", "ڨ": "g", "ك": "k", "ل": "l", "م": "m", "ن": "n" };
  function pivotArabic(w) {
    var out = "";
    for (var i = 0; i < w.length; i++) { var c = AR_MAP[w[i]]; if (c) out += c; }
    return out;
  }
  function pivotLatin(w) {
    w = w.replace(/kh/g, "X").replace(/[cs]h/g, "C").replace(/gh/g, "G").replace(/dh/g, "d").replace(/th/g, "t").replace(/ph/g, "f").replace(/qu/g, "k")
      .replace(/c(?=[eiy])/g, "s").replace(/g(?=[eiy])/g, "j").replace(/x/g, "ks")
      .replace(/7/g, "h").replace(/9/g, "k").replace(/5/g, "X").replace(/8/g, "G").replace(/[2346]/g, "")
      .replace(/[cq]/g, "k").replace(/p/g, "b").replace(/v/g, "f");
    return w.replace(/[aeiouyw]/g, "");
  }
  function collapse(k) { return k.replace(/(.)\1+/g, "$1"); }
  function pivot(w) { return collapse(AR_RE.test(w) ? pivotArabic(w) : pivotLatin(w)); }

  // Formes possibles d'un mot : avec et sans article ou préfixe collé (« الحليب », « l7lib », « pneus » → « pneu »).
  function forms(w) {
    var list = [w];
    if (AR_RE.test(w)) {
      var m = w.match(/^(وال|بال|فال|كال|لل|ال)(.{2,})$/);
      if (m) list.push(m[2]);
      if (/^[وبفل].{3,}$/.test(w)) list.push(w.slice(1));
    } else {
      if (/^l\d/.test(w)) list.push(w.slice(1));
      if (/^el.{3,}$/.test(w)) list.push(w.slice(2));
      if (w.length > 4 && /[sx]$/.test(w)) list.push(w.slice(0, -1));
    }
    return list;
  }

  /* ---------- 3. Distance d'édition (Damerau, version « transpositions adjacentes ») ---------- */
  function dist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      for (j = 1; j <= b.length; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[a.length][b.length];
  }
  function tolerance(len) { return len >= 6 ? 2 : len >= 4 ? 1 : 0; }

  /* ---------- 4. Index : chaque mot du lexique est réduit une seule fois à sa forme pivot ---------- */
  var ENTRIES = [];   // { kind: "concept" | "intent" | "city", id, word, lang, plain, key }
  function addEntry(kind, id, word, lang) {
    var plain = normalize(word).replace(/[^\p{L}\p{N}]/gu, "");
    ENTRIES.push({ kind: kind, id: id, word: word, lang: lang, plain: plain, key: pivot(plain) });
  }
  Object.keys(LEX).forEach(function (id) {
    var w = LEX[id].w;
    Object.keys(w).forEach(function (lang) { w[lang].forEach(function (word) { addEntry("concept", id, word, lang); }); });
  });
  Object.keys(INTENTS).forEach(function (id) { INTENTS[id].w.forEach(function (word) { addEntry("intent", id, word, AR_RE.test(word) ? "ar" : "x"); }); });
  Object.keys(CITIES).forEach(function (id) { CITIES[id].forEach(function (word) { addEntry("city", id, word, AR_RE.test(word) ? "ar" : "x"); }); });
  var STOPSET = {};
  STOP.forEach(function (s) { STOPSET[normalize(s)] = true; });

  function bestMatch(token) {
    var best = null;
    forms(token).forEach(function (f, fi) {
      var key = pivot(f);
      ENTRIES.forEach(function (e) {
        var d, how;
        if (f === e.plain) { d = 0; how = "exact"; }
        else if (key.length < 2 || e.key.length < 2) return;          // trop court pour comparer sans voyelles
        else if (key === e.key) { d = 0; how = "pivot"; }
        else {
          var tol = tolerance(Math.min(key.length, e.key.length));
          if (tol === 0) return;
          d = dist(key, e.key, tol);
          if (d > tol) {
            if (key.length >= 3 && f.length >= 4 && e.key.indexOf(key) === 0) { d = 1; how = "début"; } else return;
          } else how = "approché";
        }
        var score = d + (fi ? 0.1 : 0) + (how === "pivot" ? 0.05 : 0);
        if (!best || score < best.score) best = { entry: e, d: d, how: how, score: score, key: key, form: f };
      });
    });
    return best;
  }

  /* ---------- 5. Le petit catalogue de démonstration (fictif) ---------- */
  var DOCS = [
    { t: "Plombier à domicile", ar: "سبّاك في الدار", city: "Sfax", c: ["plombier", "reparation"], d: "Fuites, robinets, chauffe-eau. Intervention dans la journée." },
    { t: "Plombier, dépannage 24 h/24", ar: "سبّاك، خدمة ليل نهار", city: "Tunis", c: ["plombier", "reparation"], g: 1, d: "Urgences de plomberie, nuit et week-end." },
    { t: "Électricien agréé", ar: "كهربائي معتمد", city: "Tunis", c: ["electricien"], d: "Installation, mise aux normes, tableaux électriques." },
    { t: "Électricien bâtiment", ar: "تريسيان", city: "Sousse", c: ["electricien"], d: "Câblage, prises, éclairage." },
    { t: "Électricien, dépannage d’urgence", ar: "كهربائي، تدخل عاجل", city: "Sfax", c: ["electricien", "reparation"], g: 1, d: "Coupure de courant, disjoncteur qui saute : intervention rapide." },
    { t: "Installation et réparation de climatiseurs", ar: "تركيب وتصليح المكيفات", city: "Sfax", c: ["clim", "reparation"], d: "Pose, recharge de gaz, entretien avant l’été." },
    { t: "Entretien de climatisation", ar: "صيانة المكيفات", city: "Ariana", c: ["clim"], d: "Nettoyage des filtres et contrôle annuel." },
    { t: "Garage de mécanique générale", ar: "قاراج ميكانيك", city: "Ariana", c: ["mecanicien", "voiture", "reparation"], d: "Vidange, freins, diagnostic." },
    { t: "Pneus et équilibrage", ar: "عجلات وتوازن", city: "Sfax", c: ["pneus", "voiture"], d: "Pneus neufs, réparation de crevaison, géométrie." },
    { t: "Pharmacie de garde", ar: "صيدلية الليل", city: "Tunis", c: ["pharmacie"], g: 1, d: "Ouverte la nuit et le dimanche." },
    { t: "Pharmacie du centre", ar: "صيدلية", city: "Sousse", c: ["pharmacie"], d: "Médicaments, parapharmacie, conseils." },
    { t: "Médecin généraliste", ar: "طبيب عام", city: "Sfax", c: ["medecin"], d: "Consultations sur rendez-vous et visites à domicile." },
    { t: "Cabinet dentaire", ar: "عيادة طب الأسنان", city: "Tunis", c: ["dentiste", "medecin"], d: "Soins, détartrage, urgences dentaires." },
    { t: "Dentiste", ar: "طبيب أسنان", city: "Sfax", c: ["dentiste", "medecin"], d: "Soins et prothèses." },
    { t: "Salon de coiffure", ar: "حجّام", city: "Monastir", c: ["coiffeur"], d: "Coupe, barbe, coiffure de mariage." },
    { t: "Nettoyage de maison", ar: "تنظيف الديار", city: "Ariana", c: ["menage"], d: "Ménage régulier ou grand nettoyage." },
    { t: "Taxi et louage", ar: "تاكسي ولواج", city: "Sousse", c: ["taxi"], d: "Courses en ville et trajets interurbains." },
    { t: "Cours particuliers de maths", ar: "دروس خصوصية في الرياضيات", city: "Tunis", c: ["cours"], d: "Collège, lycée, préparation au bac." },
    { t: "Réparation de téléphones", ar: "تصليح التليفونات", city: "Sfax", c: ["telephone", "reparation"], d: "Écran, batterie, connecteur de charge." },
    { t: "Fibre et Internet à domicile", ar: "أنترنات في الدار", city: "Bizerte", c: ["internet"], d: "Installation de la fibre et du Wi-Fi." },
    { t: "Lait demi-écrémé, 1 L", ar: "حليب", c: ["lait"], d: "Épicerie · produit laitier." },
    { t: "Huile d’olive extra vierge, 1 L", ar: "زيت زيتون", c: ["huile"], d: "Épicerie · première pression à froid." },
    { t: "Pain tabouna", ar: "خبز طابونة", c: ["pain"], d: "Boulangerie · cuit au feu de bois." },
    { t: "Œufs, plateau de 30", ar: "عظم", c: ["oeufs"], d: "Épicerie · œufs frais." },
    { t: "Poulet entier", ar: "دجاجة", c: ["poulet"], d: "Boucherie · volaille." },
    { t: "Tomates fraîches, 1 kg", ar: "طماطم", c: ["tomate"], d: "Fruits et légumes." },
    { t: "Harissa traditionnelle", ar: "هريسة عربي", c: ["harissa"], d: "Épicerie · piment séché au soleil." },
    { t: "Couscous fin, 1 kg", ar: "كسكسي", c: ["couscous"], d: "Épicerie · semoule de blé dur." },
    { t: "Dattes deglet nour, 1 kg", ar: "دقلة نور", c: ["dattes"], d: "Fruits secs · récolte de l’année." },
    { t: "Café moulu, 250 g", ar: "قهوة", c: ["cafe"], d: "Épicerie · torréfaction locale." },
    { t: "Thé vert à la menthe", ar: "تاي بالنعناع", c: ["the"], d: "Épicerie · thé et infusions." },
    { t: "Sucre, 1 kg", ar: "سكّر", c: ["sucre"], d: "Épicerie." }
  ];
  /* Le même catalogue en anglais (titre, description) et en arabe (description), dans le même ordre. */
  var DOCS_EN = [
    ["Home plumber", "Leaks, taps, water heaters. Same-day call-out."],
    ["Plumber, 24/7 call-out", "Plumbing emergencies, nights and weekends."],
    ["Certified electrician", "Installation, bringing wiring up to standard, fuse boards."],
    ["Building electrician", "Wiring, sockets, lighting."],
    ["Electrician, emergency call-out", "Power cut, tripping breaker: fast response."],
    ["Air conditioner installation and repair", "Fitting, gas top-up, servicing before summer."],
    ["Air conditioning servicing", "Filter cleaning and yearly check."],
    ["General mechanics garage", "Oil change, brakes, diagnostics."],
    ["Tyres and wheel balancing", "New tyres, puncture repair, alignment."],
    ["Out-of-hours pharmacy", "Open at night and on Sundays."],
    ["Town centre pharmacy", "Medicines, health products, advice."],
    ["General practitioner", "Consultations by appointment and home visits."],
    ["Dental practice", "Treatment, scaling, dental emergencies."],
    ["Dentist", "Treatment and dentures."],
    ["Hair salon", "Haircut, beard, wedding hairstyles."],
    ["House cleaning", "Regular cleaning or deep clean."],
    ["Taxi and shared taxi (louage)", "City rides and intercity trips."],
    ["Private maths lessons", "Middle school, high school, baccalaureate prep."],
    ["Phone repair", "Screen, battery, charging port."],
    ["Fibre and home Internet", "Fibre and Wi-Fi installation."],
    ["Semi-skimmed milk, 1 L", "Grocery · dairy."],
    ["Extra virgin olive oil, 1 L", "Grocery · first cold pressing."],
    ["Tabouna bread", "Bakery · baked over a wood fire."],
    ["Eggs, tray of 30", "Grocery · fresh eggs."],
    ["Whole chicken", "Butcher · poultry."],
    ["Fresh tomatoes, 1 kg", "Fruit and vegetables."],
    ["Traditional harissa", "Grocery · sun-dried chilli."],
    ["Fine couscous, 1 kg", "Grocery · durum wheat semolina."],
    ["Deglet nour dates, 1 kg", "Dried fruit · this year’s harvest."],
    ["Ground coffee, 250 g", "Grocery · locally roasted."],
    ["Green tea with mint", "Grocery · teas and infusions."],
    ["Sugar, 1 kg", "Grocery."]
  ];
  var DOCS_AR = [
    "تسرّبات، حنفيات، سخّانات ماء. تدخّل في نفس اليوم.",
    "حالات السباكة المستعجلة، ليلًا وفي نهاية الأسبوع.",
    "تركيب، مطابقة للمعايير، لوحات كهربائية.",
    "تمديد الأسلاك، المآخذ، الإنارة.",
    "انقطاع التيار، قاطع يفصل: تدخّل سريع.",
    "تركيب، شحن الغاز، صيانة قبل الصيف.",
    "تنظيف المصافي وفحص سنوي.",
    "تغيير الزيت، الفرامل، التشخيص.",
    "عجلات جديدة، إصلاح الثقب، ضبط الاتّجاه.",
    "مفتوحة ليلًا ويوم الأحد.",
    "أدوية، منتجات صحّية، نصائح.",
    "استشارات بموعد وزيارات منزلية.",
    "علاج، إزالة الجير، حالات الأسنان المستعجلة.",
    "علاج وتركيبات الأسنان.",
    "قصّ الشعر، اللحية، تسريحات الأعراس.",
    "تنظيف دوري أو تنظيف شامل.",
    "تنقّلات داخل المدينة وبين المدن.",
    "إعدادي، ثانوي، تحضير الباكالوريا.",
    "الشاشة، البطارية، منفذ الشحن.",
    "تركيب الألياف البصرية والويفي.",
    "بقالة · مشتقّات الحليب.",
    "بقالة · عصرة أولى على البارد.",
    "مخبزة · مطهو على الحطب.",
    "بقالة · بيض طازج.",
    "جزارة · دواجن.",
    "خضر وغلال.",
    "بقالة · فلفل مجفّف تحت الشمس.",
    "بقالة · سميد القمح الصلب.",
    "فواكه جافّة · صابة هذا العام.",
    "بقالة · تحميص محلّي.",
    "بقالة · شاي وأعشاب.",
    "بقالة."
  ];
  DOCS.forEach(function (doc, i) { doc.en = DOCS_EN[i][0]; doc.den = DOCS_EN[i][1]; doc.dar = DOCS_AR[i]; });
  var CITY_AR = { Tunis: "تونس", Sfax: "صفاقس", Sousse: "سوسة", Ariana: "أريانة", Bizerte: "بنزرت", Monastir: "المنستير", Nabeul: "نابل" };

  // Mots des titres, pour retrouver aussi ce qui n'est pas dans le lexique.
  DOCS.forEach(function (doc) {
    doc.keys = tokenize(doc.t + " " + doc.ar + " " + doc.en).filter(function (w) { return !STOPSET[w]; }).map(pivot).filter(function (k) { return k.length >= 3; });
  });

  /* ---------- 6. La recherche ---------- */
  function scriptOf(token) {
    if (AR_RE.test(token)) return "ar";
    if (/[235789]/.test(token) && /\p{L}/u.test(token)) return "arabizi";
    return "latin";
  }

  function search(query) {
    var clock = typeof performance !== "undefined" ? performance : Date, t0 = clock.now();
    var tokens = tokenize(query);
    var steps = [], concepts = {}, intents = {}, city = null, unknown = [];
    tokens.forEach(function (tok) {
      var step = { token: tok, script: scriptOf(tok), key: pivot(tok) };
      if (STOPSET[tok]) { step.kind = "stop"; steps.push(step); return; }
      var m = bestMatch(tok);
      if (m) {
        step.kind = m.entry.kind; step.id = m.entry.id; step.word = m.entry.word; step.lang = m.entry.lang;
        step.d = m.d; step.how = m.how; step.key = m.key;
        if (m.entry.lang === "tn" && step.script === "latin") step.script = "derja";
        if (m.entry.kind === "concept") concepts[m.entry.id] = Math.max(concepts[m.entry.id] || 0, m.d === 0 ? 1 : 0.8);
        else if (m.entry.kind === "intent") intents[m.entry.id] = true;
        else city = m.entry.id;
      } else {
        step.kind = "unknown"; unknown.push(step.key);
      }
      steps.push(step);
    });

    var hasQuery = Object.keys(concepts).length || unknown.length;
    var results = [];
    if (hasQuery) {
      DOCS.forEach(function (doc) {
        var score = 0, why = [];
        doc.c.forEach(function (c) { if (concepts[c]) { score += 3 * concepts[c]; why.push({ c: c }); } });
        unknown.forEach(function (k) {
          if (k.length < 3) return;
          for (var i = 0; i < doc.keys.length; i++) {
            if (dist(k, doc.keys[i], tolerance(k.length)) <= tolerance(k.length)) { score += 1.5; why.push({ k: "title" }); break; }
          }
        });
        if (!score) return;
        if (city && doc.city) { if (doc.city === city) { score += 2; why.push({ city: city }); } else score -= 1; }
        if (intents.garde && doc.g) { score += 1.5; why.push({ k: "garde" }); }
        results.push({ doc: doc, score: score, why: why });
      });
      results.sort(function (a, b) { return b.score - a.score; });
    }
    return { steps: steps, results: results.slice(0, 6), total: results.length, intents: intents, city: city, ms: clock.now() - t0 };
  }

  if (typeof module !== "undefined" && module.exports) { module.exports = { search: search, pivot: pivot, normalize: normalize }; return; }

  /* ---------- 7. L'interface ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  /* Textes de l'interface, selon la langue de la page. */
  var UI = {
    fr: {
      lang: { fr: "français", ar: "arabe", tn: "derja en lettres latines", en: "anglais" },
      script: { ar: "arabe", arabizi: "arabizi", latin: "latin", derja: "derja" },
      pivot: "pivot : ", stop: "mot de liaison ou d’intention, mis de côté", unknown: "absent du lexique : comparé directement aux titres",
      city: "lieu reconnu : ", intent: "intention : ", exact: function (l) { return "mot du lexique (" + l + ")"; },
      same: function (w, l) { return "même mot que « " + w + " » (" + l + ")"; }, start: function (w) { return "début de « " + w + " »"; },
      near: function (w, d) { return "proche de « " + w + " », " + d + (d > 1 ? " lettres" : " lettre") + " d’écart"; },
      type: "Tapez une recherche, ou choisissez un exemple.", traceEmpty: "Le détail de l’analyse s’affiche ici, mot par mot.",
      found: "Trouvé grâce à : ", title: "mot du titre", garde: "service de garde",
      count: function (n, shown) { return n + (n > 1 ? " résultats" : " résultat") + (n > shown ? ", les " + shown + " meilleurs affichés." : "."); },
      none: "Aucun résultat. Dans un vrai projet, les recherches sans résultat servent à enrichir le lexique."
    },
    en: {
      lang: { fr: "French", ar: "Arabic", tn: "derja in Latin letters", en: "English" },
      script: { ar: "Arabic", arabizi: "Arabizi", latin: "Latin", derja: "derja" },
      pivot: "pivot: ", stop: "filler or intent word, set aside", unknown: "not in the lexicon: compared directly with titles",
      city: "place recognised: ", intent: "intent: ", exact: function (l) { return "lexicon word (" + l + ")"; },
      same: function (w, l) { return "same word as “" + w + "” (" + l + ")"; }, start: function (w) { return "beginning of “" + w + "”"; },
      near: function (w, d) { return "close to “" + w + "”, " + d + (d > 1 ? " letters" : " letter") + " apart"; },
      type: "Type a search, or pick an example.", traceEmpty: "The step-by-step analysis shows up here, word by word.",
      found: "Matched on: ", title: "title word", garde: "out-of-hours service",
      count: function (n, shown) { return n + (n > 1 ? " results" : " result") + (n > shown ? ", top " + shown + " shown." : "."); },
      none: "No results. In a real project, searches with no results are used to grow the lexicon."
    },
    ar: {
      lang: { fr: "الفرنسية", ar: "العربية", tn: "الدارجة بالحروف اللاتينية", en: "الإنجليزية" },
      script: { ar: "عربية", arabizi: "عربيزي", latin: "لاتينية", derja: "دارجة" },
      pivot: "المحور: ", stop: "كلمة ربط أو نيّة، وُضعت جانبًا", unknown: "غير موجودة في المعجم: قورنت مباشرة بالعناوين",
      city: "مكان معروف: ", intent: "النيّة: ", exact: function (l) { return "كلمة من المعجم (" + l + ")"; },
      same: function (w, l) { return "الكلمة نفسها «" + w + "» (" + l + ")"; }, start: function (w) { return "بداية «" + w + "»"; },
      near: function (w, d) { return "قريبة من «" + w + "»، بفارق " + d + (d > 1 ? " حروف" : " حرف"); },
      type: "اكتب بحثًا، أو اختر مثالًا.", traceEmpty: "يظهر هنا تحليل الطلب، كلمة بكلمة.",
      found: "وُجد بفضل: ", title: "كلمة من العنوان", garde: "خدمة ليلية",
      count: function (n, shown) { return n + " نتيجة" + (n > shown ? "، تُعرض أفضل " + shown + "." : "."); },
      none: "لا توجد نتائج. في مشروع حقيقي، تُستعمل عمليات البحث دون نتيجة لإثراء المعجم."
    }
  };
  var LANG = (document.documentElement.lang || "fr").slice(0, 2);
  if (!UI[LANG]) LANG = "fr";
  var U = UI[LANG];
  function label(c) { return LEX[c][LANG] || LEX[c].fr; }
  function cityName(c) { return LANG === "ar" ? CITY_AR[c] || c : c; }

  function describe(step) {
    switch (step.kind) {
      case "stop": return U.stop;
      case "unknown": return U.unknown;
      case "city": return U.city + cityName(step.id);
      case "intent": return U.intent + (INTENTS[step.id][LANG] || INTENTS[step.id].fr);
      default:
        var c = LEX[step.id], how, l = U.lang[step.lang];
        if (step.d === 0 && step.how === "exact") how = U.exact(l);
        else if (step.d === 0) how = U.same(step.word, l);
        else if (step.how === "début") how = U.start(step.word);
        else how = U.near(step.word, step.d);
        return how + " → " + (LANG === "ar" ? c.ar + " · " + c.fr : label(step.id) + " · " + c.ar);
    }
  }
  function whyText(w) {
    if (w.c) return label(w.c);
    if (w.city) return cityName(w.city);
    return U[w.k];
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("demo-form");
    if (!form) return;
    var input = document.getElementById("demo-q");
    var list = document.getElementById("demo-results");
    var status = document.getElementById("demo-status");
    var trace = document.getElementById("demo-trace");
    var msOut = document.getElementById("demo-ms");
    var netOut = document.getElementById("demo-net");
    var perf = window.performance && performance.getEntriesByType ? performance : null;
    var baseline = perf ? perf.getEntriesByType("resource").length : 0;

    function renderNet() {
      if (!netOut || !perf) return;
      var n = perf.getEntriesByType("resource").length - baseline;
      netOut.textContent = String(n);
    }

    function render() {
      var q = input.value.trim();
      clear(list); clear(trace);
      if (!q) {
        status.textContent = U.type;
        trace.appendChild(el("li", "trace-empty", U.traceEmpty));
        return;
      }
      var r = search(q);
      r.steps.forEach(function (s) {
        var li = el("li", "trace-" + s.kind);
        var head = el("span", "trace-word");
        head.appendChild(el("b", null, s.token));
        head.appendChild(el("span", "trace-script", U.script[s.script] || s.script));
        li.appendChild(head);
        li.appendChild(el("span", "trace-what", describe(s)));
        trace.appendChild(li);
      });
      if (r.results.length) {
        r.results.forEach(function (res) {
          var li = el("li", "demo-hit");
          var top = el("div", "demo-hit-top");
          var d = res.doc, main = LANG === "en" ? d.en : LANG === "ar" ? d.ar : d.t;
          top.appendChild(el("span", "demo-hit-title", main));
          var alt = el("span", "demo-hit-ar", LANG === "ar" ? d.t : d.ar);
          if (LANG === "ar") { alt.lang = "fr"; alt.dir = "ltr"; } else { alt.lang = "ar"; alt.dir = "rtl"; }
          top.appendChild(alt);
          li.appendChild(top);
          var desc = LANG === "en" ? d.den : LANG === "ar" ? d.dar : d.d;
          li.appendChild(el("p", "demo-hit-desc", desc + (d.city ? " · " + cityName(d.city) : "")));
          var seen = {}, why = res.why.map(whyText).filter(function (w) { if (seen[w]) return false; seen[w] = true; return true; });
          li.appendChild(el("p", "demo-hit-why", U.found + why.join(LANG === "ar" ? "، " : ", ")));
          list.appendChild(li);
        });
        status.textContent = U.count(r.total, r.results.length);
      } else {
        status.textContent = U.none;
      }
      if (msOut) msOut.textContent = r.ms < 1 ? "< 1 ms" : Math.round(r.ms) + " ms";
      renderNet();
    }

    var timer;
    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(render, 120); });
    form.addEventListener("submit", function (e) { e.preventDefault(); render(); });
    document.querySelectorAll("[data-demo-q]").forEach(function (b) {
      b.addEventListener("click", function () { input.value = b.getAttribute("data-demo-q"); render(); input.focus(); });
    });
    render();
  });
})();

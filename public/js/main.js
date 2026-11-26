/* ITBerg · script unique, sans dépendance, sans cookie, sans traceur. */
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", function () {
  // Menu mobile
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("menu");
  if (toggle && nav) {
    var label = toggle.querySelector(".nav-toggle-label");
    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (label) label.textContent = open ? (toggle.getAttribute("data-label-close") || "Fermer") : (toggle.getAttribute("data-label-open") || "Menu");
    }
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
    });
  }

  // Sondeur : met en évidence la profondeur atteinte (page d'accueil)
  var sonarLinks = document.querySelectorAll(".sonar a");
  if (sonarLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    sonarLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        sonarLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
        var link = byId[en.target.id];
        if (link) link.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }
});

/* Mesure d'audience GoatCounter : sans cookie, uniquement sur itberg.tn,
   désactivée si Do Not Track / Global Privacy Control, ou si le visiteur s'y oppose. */
(function () {
  var GC = "https://itberg.goatcounter.com/count";
  var KEY = "itberg-no-stats";
  function optedOut() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  var dnt = navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true;
  var prod = /(^|\.)itberg\.tn$/.test(location.hostname);
  // Un simple pixel image : aucun script tiers n'est chargé (la CSP n'autorise que nos propres scripts).
  if (prod && !dnt && !optedOut()) {
    var q = "?p=" + encodeURIComponent(location.pathname) +
      "&t=" + encodeURIComponent(document.title) +
      "&s=" + encodeURIComponent(screen.width) +
      "&rnd=" + Math.random().toString(36).slice(2);
    try {
      var ref = document.referrer && new URL(document.referrer);
      if (ref && ref.hostname !== location.hostname) q += "&r=" + encodeURIComponent(ref.origin + ref.pathname);
    } catch (e) {}
    var img = new Image(1, 1);
    img.alt = "";
    img.src = GC + q;
  }
  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("stats-toggle"), state = document.getElementById("stats-state");
    if (!btn) return;
    function render() {
      var off = optedOut() || dnt;
      btn.textContent = optedOut() ? "Réactiver la mesure d’audience sur ce navigateur" : "Désactiver la mesure d’audience sur ce navigateur";
      btn.hidden = dnt;
      if (state) state.textContent = dnt ? "Votre navigateur demande à ne pas être suivi : aucune mesure n’est faite." : (off ? "Mesure d’audience désactivée sur ce navigateur." : "Mesure d’audience active (anonyme, sans cookie).");
    }
    btn.addEventListener("click", function () {
      try { if (optedOut()) localStorage.removeItem(KEY); else localStorage.setItem(KEY, "1"); } catch (e) {}
      render();
    });
    render();
  });
})();

/* ==========================================================================
   Assistant ITBerg · répond aux questions sur ITBerg avec les pages de ce site.
   - 100 % dans le navigateur : la question n'est jamais envoyée. Le seul fichier lu
     est l'index public du site (/assistant/fr.json, en.json ou ar.json), généré par
     scripts/build_assistant_index.py à partir des pages elles-mêmes.
   - Pas d'IA générative : il cite un passage du site et donne le lien de la source.
   - Garde-fous visibles : il reste dans son sujet, refuse de changer de règles,
     prévient si on lui écrit des données personnelles, dit quand il ne sait pas,
     et propose toujours de parler à un humain.
   - Rien n'est enregistré : la conversation disparaît quand on quitte la page.
   Compatible CSP stricte et Trusted Types : uniquement createElement et textContent.
   ========================================================================== */
(function () {
  "use strict";
  if (!("fetch" in window) || !document.querySelector) return;

  var PAGE_LANG = (document.documentElement.lang || "fr").slice(0, 2);
  if (PAGE_LANG !== "en" && PAGE_LANG !== "ar") PAGE_LANG = "fr";
  var PATHS = {
    fr: { contact: "/contact", about: "/assistant", game: "/piege-agent", security: "/securite" },
    en: { contact: "/en/contact", about: "/en/assistant", game: "/en/trap-the-agent", security: "/en/security" },
    ar: { contact: "/ar/contact", about: "/ar/assistant", game: "/ar/trap-the-agent", security: "/ar/security" }
  };
  var MAIL = "contact@itberg.tn";

  /* ---------- Textes de l'interface ---------- */
  var UI = {
    fr: {
      launch: "Une question ?", title: "Assistant ITBerg",
      sub: "Répond avec les pages de ce site. Votre question reste sur votre appareil.",
      close: "Fermer l’assistant", label: "Votre question", placeholder: "Posez votre question…", send: "Envoyer",
      human: "Parler à un humain", how: "Comment il fonctionne",
      hello: "Bonjour ! Je réponds à vos questions sur ITBerg en citant les pages de ce site. Je ne suis pas une IA générative : je ne devine rien, je n’envoie rien, et je vous passe la main à un humain dès qu’il le faut.",
      sugg: ["Qu’est-ce qu’une IA souveraine ?", "Développez-vous aussi pour iOS ?", "Combien coûte un projet ?", "Que contient un audit de sécurité ?", "Parler à un humain"],
      loading: "Je consulte l’index du site…", loadErr: "L’index du site n’a pas pu être chargé. Écrivez-nous directement, nous vous répondrons :",
      from: "D’après la page", source: "Lire la source", also: "Voir aussi :",
      under: "Sous la surface", tLang: "Langue de la question", tKeys: "Mots-clés retenus", tGuard: "Garde-fous vérifiés",
      tSearch: "Passages du site examinés", tBest: "Meilleur score", tNet: "Requêtes réseau pendant la réponse (hors index public du site)", tNone: "aucun",
      gOk: "injection : non · données personnelles : non · hors sujet : non",
      names: { fr: "français", en: "anglais", ar: "arabe" },
      otherLang: { en: "Réponse tirée des pages en anglais.", ar: "Réponse tirée des pages en arabe.", fr: "" },
      mailSubject: "Question depuis l’assistant du site", mailAsk: "Envoyer ma question à l’équipe",
      notFound: "Je n’ai pas trouvé de réponse fiable à cette question sur le site, et je préfère ne pas inventer. Reformulez avec d’autres mots, ou posez-la directement à l’équipe :",
      offTopic: "Je réponds seulement aux questions sur ITBerg : IA souveraine et agents, applications mobiles, sécurité, et la façon dont nous travaillons. Pour le reste, je ne suis pas la bonne source.",
      noGen: "Je ne rédige pas de texte et je n’invente rien : je retrouve des réponses dans les pages de ce site. Posez-moi une question sur nos services, ou confiez votre demande à l’équipe.",
      inject: "Mes règles sont fixées dans le code de cette page et une question ne peut pas les changer. Je n’ai d’ailleurs aucun secret à révéler : tout ce que je sais est déjà public sur ce site. Envie de voir comment un agent résiste à ce genre de tentative ?",
      injectLink: "Jouez à « Piégez l’agent »",
      harm: "Je n’aide pas à attaquer un système, un compte ou un appareil qui ne vous appartient pas. Nos tests d’intrusion se font uniquement sur demande et avec l’accord écrit du propriétaire.",
      harmLink: "Nos audits de sécurité",
      pii: "Attention : votre message semble contenir une donnée personnelle (e-mail, numéro…). Je ne la garde pas et je ne l’envoie nulle part, mais inutile de la donner ici. Pour être recontacté, écrivez à l’équipe :",
      greet: "Bonjour ! Que voulez-vous savoir sur ITBerg ? Voici quelques idées :",
      thanks: "Avec plaisir. Si vous avez un projet, l’équipe vous répond directement :",
      bye: "Au revoir, et bonne plongée !",
      humanAns: "Bien sûr. Slim et Lynda lisent eux-mêmes chaque message. Écrivez à contact@itberg.tn en indiquant qui vous êtes, votre besoin et votre délai :",
      bot: "Je suis un assistant de recherche qui tourne entièrement dans votre navigateur. Je ne suis pas ChatGPT ni un autre modèle de langage : je compare votre question aux pages de ce site, je cite le passage le plus proche, et je dis quand je ne sais pas.",
      price: "Nous ne donnons pas de prix sans connaître votre projet, et je ne vais pas en inventer un.",
      gTrig: { harm: "demande d’attaque refusée", inject: "tentative de changer les règles détectée", pii: "donnée personnelle détectée", off: "question hors du sujet du site", gen: "demande de rédaction refusée", nf: "aucun passage assez proche : pas de réponse inventée" }
    },
    en: {
      launch: "Any questions?", title: "ITBerg assistant",
      sub: "Answers from the pages of this site. Your question stays on your device.",
      close: "Close the assistant", label: "Your question", placeholder: "Ask your question…", send: "Send",
      human: "Talk to a human", how: "How it works",
      hello: "Hello! I answer your questions about ITBerg by quoting the pages of this site. I am not a generative AI: I don’t guess, I don’t send anything, and I hand over to a human whenever needed.",
      sugg: ["What is sovereign AI?", "Do you also build for iOS?", "How much does a project cost?", "What does a security audit include?", "Talk to a human"],
      loading: "Reading the site index…", loadErr: "The site index could not be loaded. Write to us directly and we will answer:",
      from: "From the page", source: "Read the source", also: "See also:",
      under: "Under the surface", tLang: "Question language", tKeys: "Keywords used", tGuard: "Guardrails checked",
      tSearch: "Site passages searched", tBest: "Best score", tNet: "Network requests during the answer (excluding the public site index)", tNone: "none",
      gOk: "injection: no · personal data: no · off topic: no",
      names: { fr: "French", en: "English", ar: "Arabic" },
      otherLang: { fr: "Answer taken from the French pages.", ar: "Answer taken from the Arabic pages.", en: "" },
      mailSubject: "Question from the site assistant", mailAsk: "Send my question to the team",
      notFound: "I could not find a reliable answer to this question on the site, and I would rather not make one up. Try other words, or ask the team directly:",
      offTopic: "I only answer questions about ITBerg: sovereign AI and agents, mobile apps, security, and how we work. For anything else, I am not the right source.",
      noGen: "I don’t write text and I don’t make things up: I find answers in the pages of this site. Ask me about our services, or send your request to the team.",
      inject: "My rules are set in this page’s code and a question cannot change them. I have no secret to reveal anyway: everything I know is already public on this site. Want to see how an agent resists this kind of attempt?",
      injectLink: "Play “Trap the agent”",
      harm: "I don’t help attack a system, account or device that isn’t yours. Our penetration tests are only carried out on request, with the owner’s written consent.",
      harmLink: "Our security audits",
      pii: "Careful: your message seems to contain personal data (email, number…). I don’t keep it or send it anywhere, but there is no need to share it here. To be contacted, write to the team:",
      greet: "Hello! What would you like to know about ITBerg? A few ideas:",
      thanks: "You’re welcome. If you have a project, the team will answer you directly:",
      bye: "Goodbye, and enjoy the dive!",
      humanAns: "Of course. Slim and Lynda read every message themselves. Write to contact@itberg.tn with who you are, what you need and your deadline:",
      bot: "I am a search assistant that runs entirely in your browser. I am not ChatGPT or any other language model: I compare your question with the pages of this site, quote the closest passage, and say when I don’t know.",
      price: "We don’t give prices without knowing your project, and I won’t make one up.",
      gTrig: { harm: "attack request declined", inject: "attempt to change the rules detected", pii: "personal data detected", off: "question outside the site’s topic", gen: "writing request declined", nf: "no passage close enough: no made-up answer" }
    },
    ar: {
      launch: "عندك سؤال؟", title: "مساعد ITBerg",
      sub: "يجيب من صفحات هذا الموقع. سؤالك يبقى على جهازك.",
      close: "إغلاق المساعد", label: "سؤالك", placeholder: "اكتب سؤالك…", send: "إرسال",
      human: "التحدّث مع شخص", how: "كيف يعمل",
      hello: "مرحبًا! أجيب عن أسئلتك حول ITBerg بالاستشهاد بصفحات هذا الموقع. لست ذكاءً اصطناعيًا توليديًا: لا أخمّن، ولا أرسل شيئًا، وأحيلك إلى شخص من الفريق كلّما لزم الأمر.",
      sugg: ["ما هو الذكاء الاصطناعي السيادي؟", "هل تطوّرون تطبيقات iOS أيضًا؟", "كم تكلفة المشروع؟", "ماذا يتضمّن التدقيق الأمني؟", "التحدّث مع شخص"],
      loading: "أطّلع على فهرس الموقع…", loadErr: "تعذّر تحميل فهرس الموقع. راسلنا مباشرة وسنجيبك:",
      from: "من صفحة", source: "قراءة المصدر", also: "انظر أيضًا:",
      under: "تحت السطح", tLang: "لغة السؤال", tKeys: "الكلمات المعتمدة", tGuard: "الضوابط التي تمّ التحقّق منها",
      tSearch: "مقاطع الموقع التي فُحصت", tBest: "أفضل نتيجة", tNet: "طلبات الشبكة أثناء الإجابة (دون فهرس الموقع العام)", tNone: "لا شيء",
      gOk: "حقن أوامر: لا · بيانات شخصية: لا · خارج الموضوع: لا",
      names: { fr: "الفرنسية", en: "الإنجليزية", ar: "العربية" },
      otherLang: { fr: "الإجابة مأخوذة من الصفحات الفرنسية.", en: "الإجابة مأخوذة من الصفحات الإنجليزية.", ar: "" },
      mailSubject: "سؤال من مساعد الموقع", mailAsk: "إرسال سؤالي إلى الفريق",
      notFound: "لم أجد إجابة موثوقة عن هذا السؤال في الموقع، وأفضّل ألّا أختلق واحدة. أعد الصياغة بكلمات أخرى، أو اطرح سؤالك على الفريق مباشرة:",
      offTopic: "أجيب فقط عن الأسئلة المتعلّقة بـ ITBerg: الذكاء الاصطناعي السيادي والوكلاء، تطبيقات الهاتف، الأمن، وطريقة عملنا. لغير ذلك، لست المصدر المناسب.",
      noGen: "لا أكتب نصوصًا ولا أختلق شيئًا: أبحث عن الإجابات في صفحات هذا الموقع. اسألني عن خدماتنا، أو أرسل طلبك إلى الفريق.",
      inject: "قواعدي مكتوبة في شيفرة هذه الصفحة ولا يمكن لسؤال أن يغيّرها. وليس لديّ سرّ أكشفه: كل ما أعرفه منشور أصلًا على هذا الموقع. هل تريد أن ترى كيف يصمد وكيل أمام هذه المحاولات؟",
      injectLink: "العب «أوقِع الوكيل في الفخّ»",
      harm: "لا أساعد على مهاجمة نظام أو حساب أو جهاز لا تملكه. اختبارات الاختراق التي نجريها تتمّ فقط بطلب وبموافقة كتابية من المالك.",
      harmLink: "عمليات التدقيق الأمني لدينا",
      pii: "انتبه: يبدو أنّ رسالتك تحتوي على بيانات شخصية (بريد، رقم…). لا أحتفظ بها ولا أرسلها إلى أيّ مكان، لكن لا داعي لكتابتها هنا. ليتواصل معك الفريق، راسله مباشرة:",
      greet: "مرحبًا! ماذا تريد أن تعرف عن ITBerg؟ بعض الأفكار:",
      thanks: "بكل سرور. إذا كان لديك مشروع، فالفريق يجيبك مباشرة:",
      bye: "إلى اللقاء، وغوصًا ممتعًا!",
      humanAns: "بالتأكيد. يقرأ سليم وليندا كل رسالة بنفسيهما. راسلنا على contact@itberg.tn واذكر من أنت وما تحتاجه وآجالك:",
      bot: "أنا مساعد بحث يعمل بالكامل في متصفّحك. لست ChatGPT ولا أيّ نموذج لغوي آخر: أقارن سؤالك بصفحات هذا الموقع، وأستشهد بأقرب مقطع، وأقول عندما لا أعرف.",
      price: "لا نعطي أسعارًا قبل معرفة مشروعك، ولن أختلق سعرًا.",
      gTrig: { harm: "رفض طلب هجوم", inject: "محاولة لتغيير القواعد", pii: "بيانات شخصية", off: "سؤال خارج موضوع الموقع", gen: "رفض طلب كتابة نص", nf: "لا يوجد مقطع قريب بما يكفي: لا إجابة مختلقة" }
    }
  };
  var T = UI[PAGE_LANG];

  /* ---------- Texte : normalisation, mots vides, racines ---------- */
  function norm(s) {
    s = String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    s = s.replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا")
      .replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي");
    s = s.replace(/œ/g, "oe").replace(/æ/g, "ae").replace(/[’'`]/g, " ");
    return s.replace(/[^a-z0-9ء-ي]+/g, " ").trim();
  }
  var STOP = {};
  ("le la les l un une des de du d au aux a à et ou en dans sur pour par avec sans chez ce cet cette ces se sa son ses mon ma mes ton ta tes votre vos notre nos leur leurs " +
   "veux voudrais voulons souhaite souhaitons besoin cherche aimerais want need looking like would tout toute tous toutes seul seule je j tu il elle on nous vous ils elles me m te t lui y qui que qu quoi quel quelle quels quelles est sont etre ete suis es etes fait faire faites peut peux pouvez pouvons " +
   "ne n pas plus moins tres aussi bien comme si mais donc car c ca cela ceci est-ce quelles s il avez avons ont avoir y-a-t-il t-il ya svp merci bonjour " +
   "the a an of to in on for with and or is are be been was were do does did can could would should will you your yours we our us i me my it its this that these those " +
   "what which who whom how why when where there here any some about from by at as into than then so not no yes please hello " +
   "في من على الى إلى عن مع هل ما ماذا كيف لماذا متى اين أين هذا هذه ذلك التي الذي هو هي انتم أنتم نحن انا أنا لكم لنا لي او أو و ثم كل اي أي " +
   "chnowa chnoua chnia ach 3lech kifech kifach wini win fama famma ena enti enta ahna houma n7eb nheb nhib bech bch mta3 mte3 3la ala fi f el l w ya").split(" ").forEach(function (w) { STOP[norm(w)] = 1; });

  function stem(w) {
    if (/[ء-ي]/.test(w)) {
      if (w.length > 4) w = w.replace(/^(وال|بال|كال|فال|لل|ال)/, "");
      if (w.length > 4) w = w.replace(/(ات|ون|ين|ها|يه)$/, "");
      return w.length > 5 ? w.slice(0, 5) : w;
    }
    if (w.length > 4) w = w.replace(/(es|s|x)$/, "");
    return w.length > 6 ? w.slice(0, 6) : w;
  }
  function words(s) {
    return norm(s).replace(/\bj ai\b/g, " ").split(" ").filter(function (w) { return w && !STOP[w] && (w.length > 1 || /\d/.test(w)); });
  }
  function stems(s) { return words(s).map(stem); }

  /* ---------- Concepts : relient les mots d'une même idée, dans les trois langues et en derja ---------- */
  var GROUPS = [
    "prix tarif tarifs cout couts coute couter combien devis budget cher payer paiement price prices cost costs pricing quote expensive سعر اسعار تكلفه كلفه ثمن 9adech qaddech kadech gadech 9addech soum yeklef yekhlef tkalef flous",
    "delai delais duree temps semaine semaines mois calendrier planning rapidement timeline deadline duration long weeks months مده وقت اجال اسابيع",
    "mobile android ios iphone ipad flutter react swift swiftui xamarin application applications appli applis app apps smartphone telephone kotlin compose multiplatform playstore تطبيق تطبيقات هاتف اندرويد",
    "ia intelligence artificielle ai llm llms gpt modele modeles generative chatbot ذكاء اصطناعي نموذج نماذج",
    "agent agents agentique agentic langgraph langchain workflow automatisation automatiser automate automation processus وكيل وكلاء",
    "rag chatbot chatbots conversationnel assistant assistants documents document pdf connaissance knowledge base documentaire مستندات وثائق",
    "securite securise securiser faille failles vulnerabilite vulnerabilites pentest intrusion owasp masvs mastg mobsf hacker attaque attaques security secure vulnerability vulnerabilities attack اختراق ثغره ثغرات امن امان حمايه",
    "audit audits auditer verification controle review تدقيق",
    "souverain souveraine souverainete sovereign sovereignty heberge hebergement hebergeur local locale locaux premise serveur serveurs cloud سيادي سياديه استضافه",
    "donnees confidentialite confidentiel prive privee rgpd privacy data personal personnelles بيانات خصوصيه سريه",
    "contact contacter joindre email mail ecrire appeler rendez rdv reach call write message اتصال تواصل بريد راسل",
    "situe situes basee bases adresse etranger international abroad ailleurs tunisie tunis pays based location located tunisia country تونس مقر عنوان",
    "formation former formations atelier ateliers training train workshop workshops course تدريب تكوين",
    "conseil conseiller consultant consulting strategie feuille route roadmap diagnostic advice advisory استشاره استشارات",
    "arabe derja tunisien tunisienne dialecte arabizi arabic tunisian dialect عربيه دارجه تونسي تونسيه لهجه",
    "equipe fondateur fondateurs fondatrice slim lynda societe entreprise team founder founders company فريق مؤسس شركه",
    "maintenance support suivi evolution evolutions maintain صيانه متابعه",
    "cookie cookies traceur traceurs statistiques audience analytics tracking tracker تتبع احصائيات",
    "prototype poc pilote mvp prototyping نموذج اولي",
    "embarque embarquee device offline hors connexion on-device mobile local جهاز",
    "injection prompt jailbreak redteam red teaming adversarial حقن",
    "humain humaine humains validation valider valide approbation approuver accord autonome autonomie seul automatiquement controle human approval approve validate autonomous oversight موافقه بشريه"
  ].map(function (g) { return g.split(" ").map(function (w) { return stem(norm(w)); }); });
  var GROUP_OF = {};
  GROUPS.forEach(function (g, i) { g.forEach(function (s) { (GROUP_OF[s] = GROUP_OF[s] || []).push(i); }); });

  /* ---------- Garde-fous et intentions simples (avant toute recherche) ---------- */
  var RX = {
    inject: /(ignore|oublie|forget|disregard|bypass|contourne)\w* (\w+ ){0,3}(instruction|regle|consigne|rule|prompt|directive)|system prompt|prompt (systeme|cache|initial)|(tes|vos|your) (instructions|regles|consignes|rules)|tu es (maintenant|desormais)|you are now|(act|agis|fais) (as|comme|semblant)|pretend|jailbreak|developer mode|mode (developpeur|dev|admin|debug)|(revele|reveal|montre|show|donne|give|affiche|print)\w* (\w+ ){0,3}(secret|prompt|instruction|mot de passe|password|api key|token|code secret|secret code)|mot de passe|password|api key|cle api|sudo|تجاهل|كلمه السر/,
    gen: /^(ecri[st]|redige|compose|genere|traduis|traduit|raconte|invente|resume|write|generate|translate|tell me a|make me|draft|summari[sz]e|code moi|fais moi (un|une)|اكتب|ترجم|الف)\b/,
    greet: /^(bonjour|bonsoir|salut|coucou|hello|hi|hey|good (morning|afternoon|evening)|aslema|ahla|ahlan|salam|assalam|marhba|مرحبا|اهلا|السلام|سلام|عسلامه)( .*)?$/,
    thanks: /^(merci|thanks|thank you|thx|chokran|choukran|ya3tik|yaatik|شكرا|يعطيك)( .*)?$/,
    bye: /^(au revoir|bye|goodbye|a plus|bslema|beslema|مع السلامه|بسلامه)( .*)?$/,
    human: /(parler|discuter|echanger|talk|speak|chat) (a|avec|to|with) (un |une |a |an |someone|quelqu|humain|human|personne|person|conseiller|equipe|team|real)|^(un |a )?(humain|human|conseiller|vraie personne|real person)$|rendez vous|rdv|appelez moi|rappel|call me|book a (call|meeting)|التحدث مع|شخص حقيقي|موعد/,
    bot: /(tu es|t es|es tu|etes vous|vous etes) (un robot|une ia|un bot|humain|chatgpt|reel|une vraie)|qui es tu|tu es qui|are you (a |an )?(bot|robot|human|ai|chatgpt|real)|who are you|comment (tu fonctionnes|fonctionnes tu|ca marche|marche cet assistant|fonctionne cet assistant)|how do you work|how does (this|the) assistant work|من انت|كيف تعمل|هل انت (روبوت|انسان)/,
    harm: /(pirat|hack|crack|espionn|surveill|voler|vole|steal|spy|ddos|keylogger|malware|ransomware|phishing|hameconn|اختراق|تجسس)\w* (\w+ ){0,4}(voisin|neighbou?r|compte|account|wifi|facebook|instagram|whatsapp|snapchat|gmail|telephone de|phone of|someone|quelqu|copain|copine|ex|femme|mari|wife|husband|ecole|school|banque|bank|جار|حساب)/,
    offtopic: /\b(meteo|weather|recette|recipe|cuisine|football|foot|match|politique|politics|election|president|religion|bitcoin|crypto|bourse|horoscope|film|movie|musique|music|chanson|song|blague|joke|capitale|capital city|traduction|devoirs|homework)\b|طقس|وصفه طبخ|كره القدم|سياسه|نكته/,
    priceQ: /(prix|tarif|cout|combien|devis|budget|price|cost|pricing|quote|سعر|تكلف|كلفه|9adech|kadech|qaddech)/
  };
  /* Questions courantes reformulées vers les mots qu'emploie le site (la réponse reste un passage du site). */
  var REWRITE = [
    [/\b(ou|where)\b (etes|est|are|is|se trouve|se situe)\w* ?(vous|itberg|you|located|based)?|vous etes ou|(situes|bases|basee|located|based) (ou|where)|where.*(based|located)|وين|اين (انتم|مقركم|توجد|يوجد)|مقركم/,
      { fr: "Où êtes-vous basés ? société tunisienne", en: "Where are you based? Tunisian company", ar: "شركة تونسية تونس" }],
    [/fondat|cofondat|qui est derriere|qui etes vous|founder|who is behind|who runs|مؤسس/,
      { fr: "Lynda cofondatrice Slim", en: "Lynda co-founder Slim", ar: "ليندا سليم مؤسسة" }]
  ];
  var PII = /[^\s@]+@[^\s@]+\.[a-z]{2,}|(\+?\d[\d .-]{7,}\d)/i;

  /* ---------- Index : chargé à la première question, puis gardé en mémoire ---------- */
  var INDEX = {};
  function loadIndex(lang) {
    if (INDEX[lang]) return INDEX[lang];
    INDEX[lang] = fetch("/assistant/" + lang + ".json", { credentials: "omit" }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (data) {
      var docs = data.docs, df = {}, total = 0;
      docs.forEach(function (d) {
        var tf = {}, n = 0;
        function add(text, w) { stems(text).forEach(function (s) { tf[s] = (tf[s] || 0) + w; n += w; }); }
        add(d.h, 2); add(d.t, 1); add(d.x, 1);
        d.tf = tf; d.len = n; total += n;
        Object.keys(tf).forEach(function (s) { df[s] = (df[s] || 0) + 1; });
      });
      return { docs: docs, df: df, avg: total / Math.max(1, docs.length), n: docs.length };
    });
    INDEX[lang].catch(function () { delete INDEX[lang]; });
    return INDEX[lang];
  }

  function detectLang(q) {
    if (/[ء-ي]/.test(q)) return "ar";
    var w = norm(q).split(" "), en = 0, fr = 0;
    var EN = { the: 1, what: 1, how: 1, do: 1, does: 1, you: 1, your: 1, is: 1, are: 1, can: 1, much: 1, which: 1, who: 1, where: 1, with: 1, about: 1, offer: 1, build: 1, my: 1, of: 1, and: 1, apps: 1, why: 1, it: 1 };
    var FR = { le: 1, la: 1, les: 1, quoi: 1, comment: 1, vous: 1, est: 1, une: 1, des: 1, combien: 1, quel: 1, quelle: 1, pour: 1, avec: 1, et: 1, du: 1, de: 1, mon: 1, mes: 1, qui: 1, ou: 1, faites: 1, pourquoi: 1, ce: 1 };
    w.forEach(function (x) { if (EN[x]) en++; if (FR[x]) fr++; });
    if (en > fr) return "en";
    if (fr > en) return "fr";
    return PAGE_LANG === "ar" ? "fr" : PAGE_LANG;
  }

  /* BM25 sur les passages, avec les concepts voisins comptés à moitié. */
  function search(idx, q) {
    var base = stems(q), terms = {}, keys = [];
    base.forEach(function (s) { if (!terms[s]) { terms[s] = 1; keys.push(s); } });
    base.forEach(function (s) {
      (GROUP_OF[s] || []).forEach(function (gi) {
        GROUPS[gi].forEach(function (t) { if (!terms[t]) terms[t] = 0.45; });
      });
    });
    var known = keys.filter(function (s) { return idx.df[s] || GROUP_OF[s]; });
    var k1 = 1.2, b = 0.75, N = idx.n, hits = [];
    idx.docs.forEach(function (d) {
      var score = 0, matched = {};
      Object.keys(terms).forEach(function (t) {
        var f = d.tf[t];
        if (!f) return;
        var idf = Math.log(1 + (N - idx.df[t] + 0.5) / (idx.df[t] + 0.5));
        score += terms[t] * idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / idx.avg));
        matched[t] = 1;
      });
      if (score > 0) {
        var cov = 0, head = 0;
        if (!d.hs) { d.hs = {}; stems(d.h).forEach(function (s) { d.hs[s] = 1; }); }
        known.forEach(function (s) { if (d.hs[s]) head++; });
        // La question ressemble au titre du passage (souvent une question de FAQ) : bonus.
        if (known.length && head / known.length >= 0.6) score *= 1 + (/[?؟]\s*$/.test(d.h) ? 1.3 : 0.8) * head / known.length;
        // Même idée avec le titre de la page, un peu moins fort.
        if (!d.ts) { d.ts = {}; stems(d.t).forEach(function (s) { d.ts[s] = 1; }); }
        var inTitle = known.filter(function (s) { return d.ts[s]; }).length;
        if (known.length && inTitle / known.length >= 0.6) score *= 1 + 0.5 * inTitle / known.length;
        known.forEach(function (s) {
          if (matched[s]) { cov++; return; }
          if ((GROUP_OF[s] || []).some(function (gi) { return GROUPS[gi].some(function (t) { return matched[t]; }); })) cov += 0.8;
        });
        cov = known.length ? cov / known.length : 0;
        // Classement : la pertinence BM25, pondérée par la part de la question couverte.
        score *= d.w || 1;
        hits.push({ d: d, score: score, cov: cov, rank: score * (0.4 + 0.6 * cov) });
      }
    });
    hits.sort(function (a, c) { return c.rank - a.rank; });
    return { hits: hits, keys: keys, known: known };
  }

  /* Extrait : la ou les phrases du passage les plus proches de la question. */
  function excerpt(d, keys) {
    var text = d.x;
    if (text.length <= 340) return text;
    var parts = text.match(/[^.!?؟]+[.!?؟]*\s*/g) || [text];
    var want = {};
    keys.forEach(function (k) { want[k] = 1; (GROUP_OF[k] || []).forEach(function (gi) { GROUPS[gi].forEach(function (t) { want[t] = want[t] || 0.5; }); }); });
    var best = 0, bestScore = -1;
    parts.forEach(function (p, i) {
      var sc = 0;
      stems(p).forEach(function (s) { sc += want[s] || 0; });
      if (sc > bestScore) { bestScore = sc; best = i; }
    });
    var out = parts[best].trim();
    for (var j = best + 1; j < parts.length && out.length + parts[j].length < 340; j++) out += " " + parts[j].trim();
    if (out.length > 360) out = out.slice(0, 357).replace(/\s+\S*$/, "") + "…";
    return (best > 0 ? "… " : "") + out;
  }

  /* ---------- Interface ---------- */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function link(href, text, cls) { var a = el("a", cls, text); a.href = href; return a; }

  function build(inline) {
    var root = el("section", "asst" + (inline ? " asst-inline" : ""));
    root.id = inline ? "asst-inline-panel" : "asst-panel";
    var titleId = root.id + "-title";
    if (!inline) { root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "false"); root.hidden = true; }
    root.setAttribute("aria-labelledby", titleId);

    var head = el("div", "asst-head");
    var hText = el("div");
    var title = el("p", "asst-title", T.title); title.id = titleId;
    hText.appendChild(title);
    hText.appendChild(el("p", "asst-sub", T.sub));
    head.appendChild(hText);
    var close = null;
    if (!inline) {
      close = el("button", "asst-close");
      close.type = "button";
      close.setAttribute("aria-label", T.close);
      close.appendChild(el("span", null, "×")).setAttribute("aria-hidden", "true");
      head.appendChild(close);
    }
    root.appendChild(head);

    var log = el("div", "asst-log");
    log.setAttribute("role", "log");
    log.setAttribute("aria-live", "polite");
    log.setAttribute("aria-label", T.title);
    log.tabIndex = 0;
    root.appendChild(log);

    var form = el("form", "asst-form");
    form.setAttribute("novalidate", "");
    var lab = el("label", "sr-only", T.label);
    var input = el("input");
    input.id = root.id + "-q";
    lab.htmlFor = input.id;
    input.type = "text"; input.maxLength = 300; input.autocomplete = "off"; input.setAttribute("dir", "auto");
    input.placeholder = T.placeholder; input.setAttribute("enterkeyhint", "send");
    var send = el("button", "btn asst-send", T.send); send.type = "submit";
    form.appendChild(lab); form.appendChild(input); form.appendChild(send);
    root.appendChild(form);

    var foot = el("p", "asst-foot");
    foot.appendChild(link(PATHS[PAGE_LANG].contact, T.human, "asst-human"));
    if (!inline) { foot.appendChild(document.createTextNode(" · ")); foot.appendChild(link(PATHS[PAGE_LANG].about, T.how)); }
    root.appendChild(foot);

    var started = false;
    // Fait défiler jusqu'à la dernière question, pour lire la réponse depuis son début.
    var lastQ = null;
    function scroll() { log.scrollTop = lastQ ? Math.max(0, lastQ.offsetTop - 8) : log.scrollHeight; }
    function bubble(who) {
      var m = el("div", "asst-msg asst-" + who);
      log.appendChild(m);
      return m;
    }
    function chips(list) {
      var ul = el("ul", "chips asst-chips");
      list.forEach(function (s) {
        var li = el("li"), c = el("button", "chip", s);
        c.type = "button";
        c.addEventListener("click", function () { ask(s); });
        li.appendChild(c); ul.appendChild(li);
      });
      return ul;
    }
    function mailLink(q) {
      return link("mailto:" + MAIL + "?subject=" + encodeURIComponent(T.mailSubject) + (q ? "&body=" + encodeURIComponent(q + "\n\n") : ""), q ? T.mailAsk : MAIL, "asst-mail");
    }
    function trace(m, rows) {
      var det = el("details", "asst-under");
      det.appendChild(el("summary", null, T.under));
      var dl = el("dl");
      rows.forEach(function (r) {
        var div = el("div");
        div.appendChild(el("dt", null, r[0]));
        div.appendChild(el("dd", null, r[1]));
        dl.appendChild(div);
      });
      det.appendChild(dl);
      m.appendChild(det);
    }
    /* Requêtes réseau faites par la page, hors lecture de l'index public du site. */
    var perf = window.performance && performance.getEntriesByType ? performance : null;
    function netCount() {
      return perf ? perf.getEntriesByType("resource").filter(function (e) { return e.name.indexOf("/assistant/") === -1; }).length : 0;
    }

    function start() {
      if (started) return;
      started = true;
      var m = bubble("bot");
      m.appendChild(el("p", null, T.hello));
      m.appendChild(chips(T.sugg));
    }

    function guardReply(kind, q, lang) {
      var m = bubble("bot");
      var map = { inject: T.inject, pii: T.pii, off: T.offTopic, gen: T.noGen, harm: T.harm };
      m.appendChild(el("p", null, map[kind]));
      if (kind === "inject") { var p = el("p"); p.appendChild(link(PATHS[PAGE_LANG].game, T.injectLink)); m.appendChild(p); }
      else if (kind === "harm") { var ph2 = el("p"); ph2.appendChild(link(PATHS[PAGE_LANG].security, T.harmLink)); m.appendChild(ph2); }
      else { var p2 = el("p"); p2.appendChild(mailLink(kind === "pii" ? "" : q)); m.appendChild(p2); }
      trace(m, [[T.tLang, T.names[lang]], [T.tGuard, T.gTrig[kind]], [T.tNet, "0"]]);
    }

    function ask(raw) {
      var q = String(raw || "").trim().slice(0, 300);
      if (!q) return;
      start();
      var u = bubble("user");
      lastQ = u;
      var up = el("p", null, q); up.setAttribute("dir", "auto");
      u.appendChild(up);
      var n = norm(q), lang = detectLang(q), before = netCount();

      if (PII.test(q)) { guardReply("pii", q, lang); return scroll(); }
      if (RX.inject.test(n)) { guardReply("inject", q, lang); return scroll(); }
      if (RX.harm.test(n)) { guardReply("harm", q, lang); return scroll(); }
      if (RX.gen.test(n)) { guardReply("gen", q, lang); return scroll(); }
      var m;
      if (RX.thanks.test(n) && n.split(" ").length <= 4) { m = bubble("bot"); m.appendChild(el("p", null, T.thanks)); var pt = el("p"); pt.appendChild(link(PATHS[PAGE_LANG].contact, T.human)); m.appendChild(pt); return scroll(); }
      if (RX.bye.test(n) && n.split(" ").length <= 4) { m = bubble("bot"); m.appendChild(el("p", null, T.bye)); return scroll(); }
      if (RX.greet.test(n) && words(q).filter(function (w) { return !RX.greet.test(w); }).length === 0) { m = bubble("bot"); m.appendChild(el("p", null, T.greet)); m.appendChild(chips(T.sugg.slice(0, 4))); return scroll(); }
      if (RX.human.test(n) || n === norm(T.sugg[4])) {
        m = bubble("bot"); m.appendChild(el("p", null, T.humanAns));
        var ph = el("p", "asst-cta"); ph.appendChild(mailLink(RX.human.test(n) && words(q).length > 4 ? q : "")); ph.appendChild(document.createTextNode(" ")); ph.appendChild(link(PATHS[PAGE_LANG].contact, T.human, "asst-human"));
        m.appendChild(ph); return scroll();
      }
      if (RX.bot.test(n)) { m = bubble("bot"); m.appendChild(el("p", null, T.bot)); var pb = el("p"); pb.appendChild(link(PATHS[PAGE_LANG].about, T.how)); m.appendChild(pb); return scroll(); }

      m = bubble("bot");
      var wait = el("p", "asst-wait", T.loading);
      m.appendChild(wait);
      scroll();
      loadIndex(lang).then(function (idx) {
        m.removeChild(wait);
        var sq = q;
        REWRITE.forEach(function (rw) { if (rw[0].test(n)) sq = rw[1][lang] + " " + q; });
        var r = search(idx, sq), top = r.hits[0];
        var onTopic = r.known.length > 0;
        var good = top && r.known.length * 2 >= r.keys.length && top.cov >= 0.4 && top.score >= 2.2;
        if (RX.offtopic.test(n) || (!good && !onTopic)) {
          m.parentNode.removeChild(m);
          guardReply("off", q, lang);
          return scroll();
        }
        if (!good) {
          m.appendChild(el("p", null, T.notFound));
          var pn = el("p"); pn.appendChild(mailLink(q)); m.appendChild(pn);
          trace(m, [[T.tLang, T.names[lang]], [T.tKeys, r.keys.join(", ") || T.tNone], [T.tGuard, T.gTrig.nf], [T.tSearch, String(idx.n)], [T.tBest, top ? top.score.toFixed(1) : "0"], [T.tNet, String(netCount() - before)]]);
          return scroll();
        }
        if (RX.priceQ.test(n) && !/combien de temps|how long|كم من الوقت/.test(n)) m.appendChild(el("p", null, T.price));
        var lead = el("p", "asst-from");
        lead.appendChild(document.createTextNode(T.from + " "));
        lead.appendChild(el("strong", null, "« " + top.d.t + " »" + (top.d.h ? " › " + top.d.h : "")));
        if (PAGE_LANG === "en") lead.lastChild.textContent = "“" + top.d.t + "”" + (top.d.h ? " › " + top.d.h : "");
        if (PAGE_LANG === "ar") lead.lastChild.textContent = "«" + top.d.t + "»" + (top.d.h ? " ‹ " + top.d.h : "");
        m.appendChild(lead);
        var quote = el("blockquote", "asst-quote");
        quote.setAttribute("cite", top.d.u);
        var qp = el("p", null, excerpt(top.d, r.keys));
        qp.setAttribute("lang", lang);
        qp.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
        quote.appendChild(qp);
        m.appendChild(quote);
        if (lang !== PAGE_LANG && T.otherLang[lang]) m.appendChild(el("p", "asst-note", T.otherLang[lang]));
        var ps = el("p", "asst-src");
        ps.appendChild(link(top.d.u, T.source + " →"));
        m.appendChild(ps);
        var seen = {}, more = [];
        seen[top.d.u.split("#")[0]] = 1;
        r.hits.slice(1, 12).forEach(function (h) {
          var page = h.d.u.split("#")[0];
          if (more.length < 2 && !seen[page] && h.rank >= top.rank * 0.6 && h.cov >= 0.4) { seen[page] = 1; more.push(h); }
        });
        if (more.length) {
          var pa = el("div", "asst-also");
          pa.appendChild(el("p", null, T.also));
          var ul = el("ul");
          more.forEach(function (h) { var li = el("li"); li.appendChild(link(h.d.u, h.d.t + (h.d.h ? " › " + h.d.h : ""))); ul.appendChild(li); });
          pa.appendChild(ul);
          m.appendChild(pa);
        }
        trace(m, [[T.tLang, T.names[lang]], [T.tKeys, r.keys.join(", ")], [T.tGuard, T.gOk], [T.tSearch, String(idx.n)], [T.tBest, top.score.toFixed(1) + " (" + Math.round(top.cov * 100) + " %)"], [T.tNet, String(netCount() - before)]]);
        scroll();
      }).catch(function () {
        if (wait.parentNode) m.removeChild(wait);
        m.appendChild(el("p", null, T.loadErr));
        var pe = el("p"); pe.appendChild(mailLink(q)); m.appendChild(pe);
        scroll();
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value;
      input.value = "";
      ask(q);
    });
    return { root: root, input: input, close: close, start: start, ask: ask, log: log };
  }

  document.addEventListener("DOMContentLoaded", function () {
    var host = document.getElementById("assistant-inline");
    if (host) {
      var a = build(true);
      while (host.firstChild) host.removeChild(host.firstChild);
      host.appendChild(a.root);
      a.start();
      return;
    }
    if (document.body.classList.contains("no-assistant")) return;
    var launch = el("button", "asst-launch");
    launch.type = "button";
    launch.setAttribute("aria-haspopup", "dialog");
    launch.setAttribute("aria-expanded", "false");
    launch.setAttribute("aria-controls", "asst-panel");
    var NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
    svg.setAttribute("class", "asst-icon");
    [["path", "M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z", "asst-i-bubble"], ["path", "M12 6.2 9.6 11h4.8z", "asst-i-tip"]].forEach(function (p) {
      var e = document.createElementNS(NS, p[0]); e.setAttribute("d", p[1]); e.setAttribute("class", p[2]); svg.appendChild(e);
    });
    launch.appendChild(svg);
    launch.appendChild(el("span", null, T.launch));
    var panel = null;
    function open() {
      if (!panel) {
        panel = build(false);
        document.body.appendChild(panel.root);
        panel.close.addEventListener("click", shut);
        panel.root.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); shut(); } });
      }
      panel.root.hidden = false;
      launch.hidden = true;
      launch.setAttribute("aria-expanded", "true");
      panel.start();
      loadIndex(PAGE_LANG);
      panel.input.focus();
    }
    function shut() {
      panel.root.hidden = true;
      launch.hidden = false;
      launch.setAttribute("aria-expanded", "false");
      launch.focus();
    }
    launch.addEventListener("click", open);
    document.body.appendChild(launch);
    document.body.classList.add("has-asst");
  });
})();

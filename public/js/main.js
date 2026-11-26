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
      if (label) label.textContent = open ? "Fermer" : "Menu";
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
  if (prod && !dnt && !optedOut()) {
    var s = document.createElement("script");
    s.async = true; s.src = "https://gc.zgo.at/count.js"; s.setAttribute("data-goatcounter", GC);
    document.head.appendChild(s);
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

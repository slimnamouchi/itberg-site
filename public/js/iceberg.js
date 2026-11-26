/* ITBerg · Iceberg interactif (page d'accueil, FR/EN/AR).
   Au défilement, chaque étape du harnais s'allume dans le dessin : données, agents, garde-fous,
   validation humaine, puis la réponse qui remonte à la surface.
   Rien ne bouge si le visiteur a demandé moins d'animations (prefers-reduced-motion) :
   le dessin et le texte restent alors tels quels. Sans JavaScript, la page est inchangée. */
(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.querySelector(".harness-grid");
    var art = grid && grid.querySelector(".harness-art");
    var svg = art && art.querySelector("svg.harness");
    var steps = grid ? grid.querySelectorAll(".harness-steps li") : [];
    if (!svg || steps.length !== 5 || !("IntersectionObserver" in window) || !window.matchMedia) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var wide = window.matchMedia("(min-width: 900px)");
    var observer = null, current = -1;

    function show(n) {
      if (n === current) return;
      current = n;
      for (var i = 1; i <= 5; i++) {
        grid.classList.toggle("reach-" + i, i <= n);
        grid.classList.toggle("on-" + i, i === n);
        steps[i - 1].classList.toggle("is-on", i === n);
        steps[i - 1].classList.toggle("is-past", i < n);
      }
    }

    function start() {
      stop();
      grid.classList.add("is-scrolly");
      if (svg.pauseAnimations) svg.pauseAnimations();
      // Bande de lecture : le milieu de l'écran sur grand écran, sous le dessin collant sur téléphone.
      var margin = wide.matches ? "-45% 0px -45% 0px" : "-62% 0px -25% 0px";
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var idx = Array.prototype.indexOf.call(steps, en.target) + 1;
          if (en.isIntersecting) show(idx);
          else if (idx === 1 && en.rootBounds && en.boundingClientRect.top >= en.rootBounds.bottom) show(0);   // on remonte au-dessus de la 1re étape
        });
      }, { rootMargin: margin });
      steps.forEach(function (li) { observer.observe(li); });
    }
    function stop() {
      if (observer) observer.disconnect();
      observer = null; current = -1;
      grid.classList.remove("is-scrolly");
      for (var i = 1; i <= 5; i++) { grid.classList.remove("reach-" + i, "on-" + i); }
      steps.forEach(function (li) { li.classList.remove("is-on", "is-past"); });
      if (svg.unpauseAnimations) svg.unpauseAnimations();
    }
    function update() { if (reduce.matches) stop(); else start(); }
    update();
    [reduce, wide].forEach(function (mq) {
      if (mq.addEventListener) mq.addEventListener("change", update); else if (mq.addListener) mq.addListener(update);
    });
  });
})();

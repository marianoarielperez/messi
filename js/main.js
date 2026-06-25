/* =========================================================
   El álbum de Messi · A Fondo — interacciones
   - Barra de progreso de lectura
   - Revelado de bloques al hacer scroll
   - Módulo "Adiviná el precio" (opción múltiple)
   - Calculadora "¿Cuánto te sale llenarlo hoy?" (2026)
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  // "$2.000" con separador de miles argentino
  function pesos(n) {
    return "$" + Math.round(n).toLocaleString("es-AR");
  }

  /* ---------- 1) Barra de progreso ---------- */
  var progress = document.getElementById("progress");
  function updateProgress() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop || window.scrollY) / max : 0;
    if (progress) progress.style.width = (pct * 100).toFixed(2) + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  /* ---------- 2) Revelado al scroll ---------- */
  var revealTargets = document.querySelectorAll(
    ".chapter, .coda, .intro, .calc, .guess, .pull, .trivia"
  );
  revealTargets.forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- 3) Módulo "Adiviná el precio" ---------- */
  document.querySelectorAll(".guess").forEach(function (box) {
    var answer = box.dataset.answer;
    var options = (box.dataset.options || "").split("|").filter(Boolean);
    var label = box.dataset.label || "¿Cuánto costaba?";
    var reveal = box.dataset.reveal || "";

    box.innerHTML =
      '<span class="guess__tag">Adiviná el precio</span>' +
      '<p class="guess__label">' + label + "</p>" +
      '<div class="guess__options" role="group"></div>' +
      '<p class="guess__reveal"></p>';

    var optsWrap = box.querySelector(".guess__options");
    var revealEl = box.querySelector(".guess__reveal");

    options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "guess__btn";
      btn.textContent = "$" + opt;
      btn.addEventListener("click", function () {
        var buttons = optsWrap.querySelectorAll(".guess__btn");
        buttons.forEach(function (b) { b.disabled = true; });

        buttons.forEach(function (b) {
          var val = b.textContent.replace("$", "");
          if (val === answer) b.classList.add("is-correct");
          else if (b === btn) b.classList.add("is-wrong");
        });

        var acierto = opt === answer;
        revealEl.innerHTML =
          (acierto ? "<strong>¡Exacto!</strong> " : "<strong>Casi.</strong> ") +
          reveal;
        revealEl.classList.add("is-open");
      });
      optsWrap.appendChild(btn);
    });
  });

  /* ---------- 4) Calculadora 2026 ---------- */
  var calc = document.getElementById("calc");
  if (calc) {
    var PRECIO_ALBUM = 15000;   // $ tapa
    var PRECIO_SOBRE = 2000;    // $ por sobre
    var POR_SOBRE = 7;          // figuritas por sobre

    var faltan = document.getElementById("calcFaltan");
    var faltanVal = document.getElementById("calcFaltanVal");
    var suerte = document.getElementById("calcSuerte");
    var suerteVal = document.getElementById("calcSuerteVal");
    var totalEl = document.getElementById("calcTotal");
    var breakdown = document.getElementById("calcBreakdown");

    function etiquetaSuerte(f) {
      if (f < 1.4) return "Con suerte";
      if (f < 2.0) return "Realista";
      if (f < 2.6) return "Con repetidas";
      return "Pesadilla";
    }

    function recalc() {
      var nFaltan = parseInt(faltan.value, 10);
      var factor = parseFloat(suerte.value);

      // figuritas que en la práctica hay que comprar (faltantes × factor de repetidas)
      var figsAComprar = nFaltan * factor;
      var sobres = Math.ceil(figsAComprar / POR_SOBRE);
      var costoSobres = sobres * PRECIO_SOBRE;
      var total = PRECIO_ALBUM + costoSobres;

      faltanVal.textContent = nFaltan;
      suerteVal.textContent = etiquetaSuerte(factor);
      totalEl.textContent = pesos(total);

      breakdown.innerHTML =
        "Álbum: <b>" + pesos(PRECIO_ALBUM) + "</b> &nbsp;·&nbsp; " +
        "<b>" + sobres.toLocaleString("es-AR") + "</b> sobres " +
        "(≈ " + Math.round(figsAComprar).toLocaleString("es-AR") +
        " figuritas con repetidas): <b>" + pesos(costoSobres) + "</b>";
    }

    faltan.addEventListener("input", recalc);
    suerte.addEventListener("input", recalc);
    recalc();
  }

  /* ---------- 5) Verdadero o Falso ---------- */
  (function initTrivia() {
    var trivia = document.getElementById("trivia");
    if (!trivia) return;

    var items = trivia.querySelectorAll(".trivia__item");
    if (!items.length) return;

    var total = items.length;
    var respondidas = 0;
    var aciertos = 0;

    // Contador de aciertos al pie (se crea por JS para no tocar el markup)
    var score = document.createElement("p");
    score.className = "trivia__score";
    score.setAttribute("aria-live", "polite");
    score.hidden = true;
    trivia.appendChild(score);

    items.forEach(function (item) {
      var correcta = item.dataset.answer;
      var botones = item.querySelectorAll(".trivia__btn");
      var reveal = item.querySelector(".trivia__reveal");

      // El reveal anuncia el resultado a lectores de pantalla
      if (reveal) reveal.setAttribute("aria-live", "polite");

      botones.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var acierto = btn.dataset.value === correcta;

          botones.forEach(function (b) {
            b.disabled = true;
            if (b.dataset.value === correcta) b.classList.add("is-correct");
            else if (b === btn) b.classList.add("is-wrong");
          });

          if (reveal) reveal.hidden = false;

          respondidas += 1;
          if (acierto) aciertos += 1;

          if (respondidas === total) {
            score.textContent = "Pegaste " + aciertos + " de " + total + ".";
            score.hidden = false;
          }
        });
      });
    });
  })();

  /* ---------- 6) Botones de compartir ---------- */
  (function initShare() {
    var botones = document.querySelectorAll(".share[data-share]");
    if (!botones.length) return;

    var url = window.location.href;
    var titulo = document.title;
    var texto = "El álbum de Messi: seis Mundiales contados desde el kiosco de figuritas.";

    var u = encodeURIComponent(url);
    var t = encodeURIComponent(titulo);
    var txt = encodeURIComponent(texto);

    var intents = {
      facebook: "https://www.facebook.com/sharer/sharer.php?u=" + u,
      x: "https://twitter.com/intent/tweet?text=" + txt + "&url=" + u,
      whatsapp: "https://api.whatsapp.com/send?text=" + txt + "%20" + u
    };

    botones.forEach(function (btn) {
      var red = btn.dataset.share;
      var destino = intents[red];
      if (!destino) return;
      btn.setAttribute("href", destino);
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        // Web Share API nativa en móviles cuando está disponible
        if (navigator.share && (red === "whatsapp" || red === "x")) {
          navigator.share({ title: titulo, text: texto, url: url }).catch(function () {
            window.open(destino, "_blank", "noopener,width=620,height=560");
          });
          return;
        }
        window.open(destino, "_blank", "noopener,width=620,height=560");
      });
    });
  })();
})();

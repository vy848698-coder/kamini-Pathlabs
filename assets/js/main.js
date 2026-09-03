(function(){
  "use strict";
  var rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- rotating hero word (21st.dev style) ---- */
  var rot = document.getElementById("rot");
  if (rot && !rm) {
    var words = rot.querySelectorAll("span"), i = 0;
    setInterval(function(){
      words[i].classList.remove("on"); words[i].classList.add("out");
      var prev = i;
      i = (i + 1) % words.length;
      words[i].classList.remove("out"); words[i].classList.add("on");
      setTimeout(function(){ words[prev].classList.remove("out"); }, 700);
    }, 2600);
  }

  /* ---- promo carousel ----
     The slide itself moves on a transform; everything else (copy stagger,
     Ken Burns on the photo, autoplay rail) is driven by the .is-active class
     so the CSS owns the choreography and the JS only says "this one now". */
  var track = document.getElementById("ptrack");
  if (track) {
    /* One dwell. Every CSS duration below is derived from it, so changing
       this number alone retimes the whole carousel. */
    var AUTOPLAY = 2000;
    var MOVE = 420;               /* keep in sync with --pmove's fallback */
    var slides = track.children, n = slides.length, cur = 0, timer = null;
    var dots = document.getElementById("pdots");
    var car = document.getElementById("pcar");
    var bar = document.getElementById("pprog");
    var fill = bar ? bar.firstElementChild : null;

    /* signals to CSS that the staged entrance is safe to apply */
    car.classList.add("js");
    car.style.setProperty("--pdur", AUTOPLAY + "ms");
    car.style.setProperty("--pmove", MOVE + "ms");
    /* the photo drifts for exactly one dwell, so the zoom lands rather than
       being cut off mid-way when the next slide takes over */
    car.style.setProperty("--pken", AUTOPLAY + "ms");

    for (var d = 0; d < n; d++) {
      (function(k){
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label","Go to slide " + (k+1));
        if (k === 0) b.className = "on";
        b.addEventListener("click", function(){ go(k); reset(); });
        dots.appendChild(b);
      })(d);
    }

    /* Re-trigger a CSS animation by yanking the class and forcing a reflow —
       without the offsetWidth read the browser coalesces both writes and
       nothing replays. */
    function replay(el, cls){
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    }

    function go(k){
      cur = (k + n) % n;
      track.style.transform = "translateX(" + (-cur * 100) + "%)";
      for (var s = 0; s < n; s++){
        slides[s].classList.toggle("is-active", s === cur);
        slides[s].setAttribute("aria-hidden", s === cur ? "false" : "true");
      }
      if (!rm) replay(slides[cur], "is-active");
      var db = dots.children;
      for (var j = 0; j < db.length; j++){
        db[j].className = (j === cur ? "on" : "");
        db[j].setAttribute("aria-current", j === cur ? "true" : "false");
      }
      if (fill && !rm) replay(fill, "run");
    }
    function next(){ go(cur + 1); }
    function prev(){ go(cur - 1); }
    function stop(){ if (timer) { clearInterval(timer); timer = null; } }
    function reset(){ stop(); if (!rm) timer = setInterval(next, AUTOPLAY); }

    document.getElementById("pnext").addEventListener("click", function(){ next(); reset(); });
    document.getElementById("pprev").addEventListener("click", function(){ prev(); reset(); });

    car.addEventListener("mouseenter", stop);
    car.addEventListener("mouseleave", function(){ if (fill && !rm) replay(fill, "run"); reset(); });

    /* keyboard: arrows step through once the carousel has focus */
    car.setAttribute("tabindex", "0");
    car.setAttribute("role", "region");
    car.setAttribute("aria-label", "Featured services");
    car.addEventListener("keydown", function(e){
      if (e.key === "ArrowRight"){ e.preventDefault(); next(); reset(); }
      else if (e.key === "ArrowLeft"){ e.preventDefault(); prev(); reset(); }
    });

    /* pause while the section is off-screen — no animation burning cycles
       in a background tab or further up the page */
    if ("IntersectionObserver" in window){
      new IntersectionObserver(function(es){
        es[0].isIntersecting ? reset() : stop();
      }, { threshold: 0.25 }).observe(car);
    }
    document.addEventListener("visibilitychange", function(){
      document.hidden ? stop() : reset();
    });

    /* swipe */
    var x0 = null, y0 = null;
    car.addEventListener("touchstart", function(e){
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, {passive:true});
    car.addEventListener("touchend", function(e){
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0,
          dy = e.changedTouches[0].clientY - y0;
      /* only act on a mostly-horizontal drag so vertical scrolling still works */
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        dx < 0 ? next() : prev();
        reset();
      }
      x0 = y0 = null;
    }, {passive:true});

    go(0);
    reset();
  }

  /* ---- scroll reveal ---- */
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
  document.querySelectorAll(".rv").forEach(function(el){ io.observe(el); });

  /* ---- counters ---- */
  function fmt(v, t){
    if (t >= 1000) return Math.round(v).toLocaleString("en-IN");
    if (Number.isInteger(t)) return Math.round(v).toString();
    return v.toFixed(1);
  }
  function run(el){
    var t = parseFloat(el.dataset.n), suf = el.dataset.suf || "";
    if (rm) { el.textContent = fmt(t,t) + suf; return; }
    var dur = 1500, s = performance.now();
    (function tick(now){
      var p = Math.min((now - s)/dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(t*e, t) + suf;
      if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(t,t) + suf;
    })(s);
  }
  var cio = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting){ run(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-n]").forEach(function(c){ cio.observe(c); });

  /* ---- quick-actions rail ----
     A gold spine draws across the four cards as the section scrolls through
     the viewport. Progress (0→1) goes to CSS as --p; each card lights when
     the spine passes its node, so the reveal is tied to scroll position
     rather than firing all at once. */
  var qrail = document.getElementById("qrail");
  var qcards = qrail ? Array.prototype.slice.call(qrail.querySelectorAll(".qi")) : [];
  if (qrail) {
    if (rm) {
      /* reduced motion: show the finished state, no scroll coupling */
      qrail.style.setProperty("--p", 1);
      qcards.forEach(function(c){ c.classList.add("lit"); });
    } else {
      qrail.classList.add("js");
      /* cursor spotlight */
      qcards.forEach(function(c){
        c.addEventListener("mousemove", function(e){
          var r = c.getBoundingClientRect();
          c.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
          c.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
        });
      });
    }
  }
  /* How much scrolling the reveal is spread over, as a fraction of viewport
     height. QSPAN is the knob for pacing: bigger = slower, more deliberate
     stagger. At 0.48 the whole rail lit within half a screen of scrolling,
     which read as a rushed pop rather than a sequence. Past ~0.75 the last
     card needs the rail almost at the top of the screen before it appears,
     so anyone who stops scrolling mid-section is left looking at empty
     cards — 0.70 lands the final one with the rail around a third up. */
  var QSTART = 0.92, QSPAN = 0.70;
  function qScroll(){
    if (!qrail || rm) return;
    var r = qrail.getBoundingClientRect(), vh = window.innerHeight;
    /* starts as the rail crosses QSTART of the viewport, completes once it
       has travelled a further QSPAN of a screen */
    var p = (vh * QSTART - r.top) / (vh * QSPAN);
    p = p < 0 ? 0 : (p > 1 ? 1 : p);
    qrail.style.setProperty("--p", p);
    /* Read the real column count off the grid rather than guessing from the
       width: the rail is 4 up, then 2, then 1 below 360px. Cards in the same
       visual row should light together; a stacked card must not. */
    var cols = getComputedStyle(qrail).gridTemplateColumns.split(" ").length,
        n = qcards.length, rows = Math.ceil(n / cols);
    for (var i = 0; i < n; i++){
      /* full width: each card lights as the spine reaches its own node.
         Stacked: light by row, spread evenly down the rail. */
      var t = cols >= n ? (i + 0.5) / n
                        : (Math.floor(i / cols) + 0.4) / rows * 0.9;
      qcards[i].classList.toggle("lit", p >= t);
    }
  }

  /* ---- nav, progress, parallax ---- */
  var nav = document.getElementById("nav"), prog = document.getElementById("prog"),
      hpar = document.getElementById("hpar"), ticking = false;
  function onScroll(){
    var y = window.scrollY || window.pageYOffset;
    nav.classList.toggle("stuck", y > 10);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (h > 0 ? (y/h)*100 : 0) + "%";
    if (hpar && !rm && y < window.innerHeight * 1.4) hpar.style.transform = "translateY(" + (-y * 0.06) + "px)";
    qScroll();
    spy();
    ticking = false;
  }
  window.addEventListener("resize", onScroll, {passive:true});
  window.addEventListener("scroll", function(){ if (!ticking){ ticking = true; requestAnimationFrame(onScroll); } }, {passive:true});
  onScroll();

  /* ---- mobile menu ---- */
  var burger = document.getElementById("burger"), nl = document.getElementById("nlinks");
  function setMenu(open){
    nl.classList.toggle("show", open);
    burger.classList.toggle("on", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    /* stop the page scrolling behind the open sheet */
    document.body.classList.toggle("menu-open", open);
  }
  burger.addEventListener("click", function(e){
    e.stopPropagation();
    setMenu(!nl.classList.contains("show"));
  });
  nl.querySelectorAll("a").forEach(function(a){
    a.addEventListener("click", function(){ setMenu(false); });
  });
  /* escape, and a tap anywhere outside, both close it */
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && nl.classList.contains("show")) { setMenu(false); burger.focus(); }
  });
  document.addEventListener("click", function(e){
    if (nl.classList.contains("show") && !nl.contains(e.target) && e.target !== burger) setMenu(false);
  });
  /* leaving mobile width with the sheet open would strand the scroll lock */
  window.addEventListener("resize", function(){
    if (window.innerWidth > 960 && nl.classList.contains("show")) setMenu(false);
  });

  /* ---- nav scrollspy ----
     Each link names the section ids it stands for. The active link is the
     last one whose section has passed the reading line, so a section with no
     link of its own (programmes, reviews, FAQ) keeps the previous link lit
     rather than leaving the bar blank. */
  var spyLinks = [].slice.call(nl.querySelectorAll("a[data-spy]")).map(function(a){
    var els = a.getAttribute("data-spy").split(" ")
      .map(function(id){ return document.getElementById(id); })
      .filter(Boolean);
    return { a: a, els: els };
  }).filter(function(o){ return o.els.length; });

  function spy(){
    if (!spyLinks || !spyLinks.length) return;   /* not built yet on first call */
    var line = window.scrollY + (document.getElementById("nav").offsetHeight || 70) + 40;
    var best = null, bestTop = -Infinity;
    spyLinks.forEach(function(o){
      o.els.forEach(function(el){
        var top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= line && top > bestTop) { bestTop = top; best = o; }
      });
    });
    /* past the last section the final link stays lit */
    if (!best) best = spyLinks[0];
    spyLinks.forEach(function(o){
      var on = o === best;
      o.a.classList.toggle("on", on);
      if (on) o.a.setAttribute("aria-current", "true");
      else o.a.removeAttribute("aria-current");
    });
  }
  spy();

  /* ---- FAQ ---- */
  document.querySelectorAll(".fq").forEach(function(fq){
    var btn = fq.querySelector("button"), ans = fq.querySelector(".ans");
    btn.addEventListener("click", function(){
      var open = fq.classList.contains("open");
      document.querySelectorAll(".fq.open").forEach(function(o){
        o.classList.remove("open");
        o.querySelector(".ans").style.maxHeight = null;
        o.querySelector("button").setAttribute("aria-expanded","false");
      });
      if (!open){
        fq.classList.add("open");
        ans.style.maxHeight = ans.scrollHeight + "px";
        btn.setAttribute("aria-expanded","true");
      }
    });
  });

  /* ---- hero search ---- */
  var ts = document.getElementById("tsearch");
  if (ts) ts.addEventListener("keydown", function(e){
    if (e.key === "Enter"){ e.preventDefault(); document.getElementById("tests").scrollIntoView({behavior: rm ? "auto":"smooth"}); }
  });

  /* ---- advisor dismiss ---- */
  var adv = document.getElementById("advisor"), advC = document.getElementById("advClose");
  if (advC) advC.addEventListener("click", function(){ adv.style.display = "none"; });

  /* ---- booking form (front-end demo — wire to your backend) ---- */
  var f = document.getElementById("bform");
  if (f){
    var bn = document.getElementById("bn"), bp = document.getElementById("bp"),
        msg = document.getElementById("fmsg"), btn2 = document.getElementById("bbtn");
    bp.addEventListener("input", function(){ bp.value = bp.value.replace(/\D/g,"").slice(0,10); });
    [bn,bp].forEach(function(x){ x.addEventListener("input", function(){ x.classList.remove("bad"); }); });
    f.addEventListener("submit", function(e){
      e.preventDefault();
      var ok = true;
      if (!bn.value.trim()){ bn.classList.add("bad"); ok = false; }
      if (bp.value.trim().length !== 10){ bp.classList.add("bad"); ok = false; }
      if (!ok){ (bn.classList.contains("bad") ? bn : bp).focus(); return; }
      msg.hidden = false;
      btn2.textContent = "Request received";
      btn2.style.pointerEvents = "none";
      setTimeout(function(){ f.reset(); }, 500);
    });
  }

  /* ---- smooth anchors ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener("click", function(e){
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 72, behavior: rm ? "auto":"smooth" });
    });
  });
})();

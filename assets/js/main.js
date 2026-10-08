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
      /* clamp the low end too: a first frame timestamped before the start
         would otherwise render a negative figure for one paint */
      var p = Math.max(0, Math.min((now - s)/dur, 1)), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(t*e, t) + suf;
      if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(t,t) + suf;
    })(s);
  }
  var cio = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting){ run(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-n]").forEach(function(c){ cio.observe(c); });

  /* ---- nav, progress, parallax ---- */
  var nav = document.getElementById("nav"), prog = document.getElementById("prog"),
      hpar = document.getElementById("hpar"), ticking = false;
  function onScroll(){
    var y = window.scrollY || window.pageYOffset;
    nav.classList.toggle("stuck", y > 10);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (h > 0 ? (y/h)*100 : 0) + "%";
    if (hpar && !rm && y < window.innerHeight * 1.4) hpar.style.transform = "translateY(" + (-y * 0.06) + "px)";
    spy();
    chapSpy();
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
    /* No body scroll lock. `overflow:hidden` on the body makes it a scroll
       container, and that un-sticks the header the sheet hangs from — the whole
       menu would jump to the top of the document. The sheet rides with the
       sticky header instead, and `overscroll-behavior` stops the chaining. */
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

  /* ---- about-page chapter rail ----
     A second, page-local nav that sticks under the header. Same "last section
     past the reading line wins" rule as the main scrollspy, plus the active
     chip is kept in view when the rail is scrolling sideways on a phone. */
  var chap = document.getElementById("chap"), chapBox = chap ? chap.firstElementChild : null;
  var chapLinks = chap ? [].slice.call(chap.querySelectorAll("a")).map(function(a){
    return { a: a, el: document.querySelector(a.getAttribute("href")) };
  }).filter(function(o){ return o.el; }) : [];

  function chapSpy(){
    if (!chapLinks || !chapLinks.length) return;   /* not an about page, or not built yet */
    var line = window.scrollY + stickyTop() + 40, best = null, bestTop = -Infinity;
    chapLinks.forEach(function(o){
      var top = o.el.getBoundingClientRect().top + window.scrollY;
      if (top <= line && top > bestTop) { bestTop = top; best = o; }
    });
    chapLinks.forEach(function(o){
      var on = o === best;
      if (on === o.a.classList.contains("on")) return;   /* nothing changed */
      o.a.classList.toggle("on", on);
      if (on) {
        o.a.setAttribute("aria-current", "true");
        /* centre the chip when the rail is scrolling sideways on a phone.
           Measured off rects rather than offsetLeft, which would be relative
           to the sticky rail rather than to the scrolling .wrap inside it. */
        if (chapBox && chapBox.scrollWidth > chapBox.clientWidth) {
          var ar = o.a.getBoundingClientRect(), br = chapBox.getBoundingClientRect();
          chapBox.scrollLeft += (ar.left - br.left) - (br.width - ar.width) / 2;
        }
      } else o.a.removeAttribute("aria-current");
    });
  }
  chapSpy();

  /* How much sticky chrome an anchor has to clear: the header (72 has always
     been the right number for it), plus the chapter rail on pages that have
     one. Without this the about page would drop each section under its rail. */
  function stickyTop(){
    return 72 + (chap ? chap.offsetHeight : 0);
  }

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
      var y = t.getBoundingClientRect().top + window.scrollY - stickyTop();
      /* The header is in the flow and settles to 70px once stuck, so a jump
         from the top of the page pulls everything up by the difference on
         the way down. Allow for it, or the target lands under the rail. */
      if (y > 10) y -= nav.firstElementChild.firstElementChild.offsetHeight - 70;
      window.scrollTo({ top: y, behavior: rm ? "auto":"smooth" });
    });
  });
})();

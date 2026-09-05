/* ==========================================================
   KAMINI CLINIC & LABS — Tests & Packages page only.
   Loads after main.js, which already owns the nav, the reveals,
   the chapter-rail scrollspy, the FAQ accordion and the booking
   form. Everything here is specific to this page.

   One rule holds it together: the ledger rows in the markup are
   the only place a test, its price and its body system are
   declared. The search index, the suggestion sheet, the counts
   on the body-system tiles, the per-department counts and the
   "showing n of n" line are all read back off those rows, so
   nothing on the page can drift out of step with the rate card.
========================================================== */
(function(){
  "use strict";

  var ledger = document.getElementById("tpLedger");
  if (!ledger) return;                        /* not the tests page */

  var rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $  = function(id){ return document.getElementById(id); };
  var all = function(sel, root){ return [].slice.call((root || document).querySelectorAll(sel)); };

  /* ==========================================================
     1. THE INDEX — built once from the rows themselves
  ========================================================== */
  var groups = all(".tp-grp", ledger);
  var rows = all(".tp-row", ledger).map(function(el){
    var name  = el.getAttribute("data-name") || "";
    var alias = el.getAttribute("data-alias") || "";
    var desc  = (el.querySelector(".tp-rid em") || {}).textContent || "";
    var priceEl = el.querySelector(".tp-rprice b");
    return {
      el: el,
      btn: el.querySelector(".tp-rmain"),
      drop: el.querySelector(".tp-rdrop"),
      name: name,
      sys: (el.getAttribute("data-sys") || "").split(/\s+/).filter(Boolean),
      price: priceEl ? priceEl.textContent : "",
      meta: all(".tp-tag", el).map(function(t){ return t.textContent; }).join(" · "),
      /* one lower-cased haystack per row, so a keystroke is a substring test */
      hay: (name + " " + alias + " " + desc).toLowerCase().replace(/&amp;/g, "&")
    };
  });
  if (!rows.length) return;

  /* counts per body system, for the tiles in section 01 */
  var sysCount = {};
  rows.forEach(function(r){
    r.sys.forEach(function(s){ sysCount[s] = (sysCount[s] || 0) + 1; });
  });
  all(".tp-syn[data-count]").forEach(function(em){
    var k = em.getAttribute("data-count"), n = sysCount[k] || 0;
    em.textContent = n + (n === 1 ? " test" : " tests");
  });

  /* ==========================================================
     2. FILTER + SEARCH
     One apply() owns visibility. The chips, the body-system tiles
     and the search box all just change state and call it.
  ========================================================== */
  var state = { sys: "all", q: "" };

  var chips  = all(".tp-chip");
  var tiles  = all(".tp-syc[data-sys]");
  var input  = $("tpq");
  var clear  = $("tpClear");
  var sug    = $("tpSug");
  var count  = $("tpCount");
  var none   = $("tpNone");

  function matches(r){
    if (state.sys !== "all" && r.sys.indexOf(state.sys) === -1) return false;
    if (state.q && r.hay.indexOf(state.q) === -1) return false;
    return true;
  }

  function apply(){
    var shown = 0;
    rows.forEach(function(r){
      var on = matches(r);
      if (!on && r.el.classList.contains("open")) close(r);
      r.el.hidden = !on;
      if (on) shown++;
    });
    /* a department with nothing left in it should take its heading with it */
    groups.forEach(function(g){
      var live = all(".tp-row", g).filter(function(el){ return !el.hidden; });
      g.hidden = live.length === 0;
      var n = g.querySelector(".tp-gn");
      if (n) n.textContent = live.length + (live.length === 1 ? " test" : " tests");
    });
    if (none) none.hidden = shown !== 0;
    if (count) {
      count.innerHTML = shown === rows.length
        ? "<b>" + rows.length + "</b> investigations listed"
        : "Showing <b>" + shown + "</b> of " + rows.length;
    }
    chips.forEach(function(c){
      var on = c.getAttribute("data-sys") === state.sys;
      c.classList.toggle("on", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
    tiles.forEach(function(t){
      t.classList.toggle("on", t.getAttribute("data-sys") === state.sys);
    });
  }

  function setSys(v){
    state.sys = (state.sys === v) ? "all" : v;   /* a second click clears it */
    apply();
  }

  chips.forEach(function(c){
    c.addEventListener("click", function(){
      state.sys = c.getAttribute("data-sys");
      apply();
    });
  });
  tiles.forEach(function(t){
    t.addEventListener("click", function(){
      setSys(t.getAttribute("data-sys"));
      jumpTo(document.getElementById("catalogue"));
    });
  });

  /* ---------- the suggestion sheet ---------- */
  var sugItems = [], sugIx = -1;

  function closeSug(){
    if (!sug || sug.hidden) return;
    sug.hidden = true;
    sug.innerHTML = "";
    sugItems = []; sugIx = -1;
    input.setAttribute("aria-expanded", "false");
  }

  function openSug(list){
    sug.innerHTML = "";
    sugItems = [];
    if (!list.length) {
      var li = document.createElement("li");
      li.className = "sempty";
      li.innerHTML = "Not on the printed card. We run over 450 investigations — " +
        "<a href=\"https://wa.me/919861451521\">send the prescription on WhatsApp</a> and we will quote it.";
      sug.appendChild(li);
    } else {
      list.forEach(function(r){
        var li = document.createElement("li");
        var b  = document.createElement("button");
        b.type = "button";
        b.innerHTML =
          "<span class=\"sn\"><b></b><span></span></span>" +
          (r.price ? "<span class=\"sp\"></span>" : "<span class=\"sp ask\">On call</span>");
        b.querySelector(".sn b").textContent = r.name;
        b.querySelector(".sn span").textContent = r.meta;
        if (r.price) b.querySelector(".sp").textContent = r.price;
        b.addEventListener("click", function(){ pick(r); });
        li.appendChild(b);
        sug.appendChild(li);
        sugItems.push({ li: li, row: r });
      });
    }
    sug.hidden = false;
    sugIx = -1;
    input.setAttribute("aria-expanded", "true");
  }

  function highlight(i){
    sugItems.forEach(function(s, k){ s.li.classList.toggle("on", k === i); });
    sugIx = i;
  }

  /* choosing a suggestion narrows the card to that line and opens it */
  function pick(r){
    input.value = r.name.replace(/&amp;/g, "&");
    state.q = input.value.toLowerCase();
    state.sys = "all";
    clear.hidden = false;
    closeSug();
    apply();
    jumpTo(document.getElementById("catalogue"));
    if (!r.el.classList.contains("open")) open(r);
  }

  function search(){
    var q = input.value.trim().toLowerCase();
    state.q = q;
    clear.hidden = !q;
    apply();
    if (!q) { closeSug(); return; }
    openSug(rows.filter(function(r){ return r.hay.indexOf(q) > -1; }).slice(0, 6));
  }

  if (input) {
    input.addEventListener("input", search);
    input.addEventListener("focus", function(){ if (input.value.trim()) search(); });
    input.addEventListener("keydown", function(e){
      if (e.key === "Escape") { closeSug(); input.blur(); return; }
      if (!sugItems.length) {
        if (e.key === "Enter") { e.preventDefault(); jumpTo(document.getElementById("catalogue")); }
        return;
      }
      if (e.key === "ArrowDown") { e.preventDefault(); highlight((sugIx + 1) % sugItems.length); }
      else if (e.key === "ArrowUp") { e.preventDefault(); highlight((sugIx - 1 + sugItems.length) % sugItems.length); }
      else if (e.key === "Enter") {
        e.preventDefault();
        pick(sugItems[sugIx > -1 ? sugIx : 0].row);
      }
    });
    document.addEventListener("click", function(e){
      if (!sug.hidden && !sug.contains(e.target) && e.target !== input) closeSug();
    });
  }
  if (clear) clear.addEventListener("click", function(){
    input.value = ""; state.q = ""; clear.hidden = true; closeSug(); apply(); input.focus();
  });
  all(".tp-quick button").forEach(function(b){
    b.addEventListener("click", function(){
      input.value = b.getAttribute("data-q");
      search();
      input.focus();
    });
  });

  /* ==========================================================
     3. THE LEDGER ROWS
     Height is animated rather than snapped, and several rows may
     stay open at once — this is a price list being read, not a
     FAQ where only one answer matters at a time.
  ========================================================== */
  function open(r){
    r.drop.hidden = false;
    r.el.classList.add("open");
    r.btn.setAttribute("aria-expanded", "true");
    /* the height has to be read after `hidden` is gone or it is zero */
    r.drop.style.maxHeight = r.drop.scrollHeight + "px";
  }
  function close(r){
    r.el.classList.remove("open");
    r.btn.setAttribute("aria-expanded", "false");
    r.drop.style.maxHeight = "0px";
    var done = function(){ if (!r.el.classList.contains("open")) r.drop.hidden = true; };
    if (rm) done(); else setTimeout(done, 460);
  }
  rows.forEach(function(r){
    r.btn.addEventListener("click", function(){
      r.el.classList.contains("open") ? close(r) : open(r);
    });
  });
  /* an open row that reflows — a phone turning, or a font arriving late —
     would otherwise keep the height it was measured at */
  window.addEventListener("resize", function(){
    rows.forEach(function(r){
      if (r.el.classList.contains("open")) r.drop.style.maxHeight = r.drop.scrollHeight + "px";
    });
  }, { passive: true });

  /* ==========================================================
     4. THE PACKAGE CHOOSER
     Two answers, one lit column. Nothing is booked by using it,
     so it stays a suggestion rather than a funnel.
  ========================================================== */
  (function chooser(){
    var mtx = $("tpMtx"), out = $("tpRecOut"), rec = $("tpRec");
    if (!mtx || !rec) return;

    var PACK = ["", "Basic Health Check", "Full Body Checkup", "Senior Care 360°"];
    var AGE  = { u30: 1, a3045: 2, a4560: 2, a60: 3 };
    var NEED = { routine: 0, metabolic: 1, tired: 1, cardiac: 1 };
    var pickd = { age: null, need: null };

    all(".tp-ropts", rec).forEach(function(box){
      var grp = box.getAttribute("data-grp");
      all("button", box).forEach(function(b){
        b.addEventListener("click", function(){
          var v = b.getAttribute("data-v");
          pickd[grp] = (pickd[grp] === v) ? null : v;
          all("button", box).forEach(function(o){
            o.setAttribute("aria-pressed", o === b && pickd[grp] === v ? "true" : "false");
          });
          decide();
        });
      });
    });

    function decide(){
      if (!pickd.age || !pickd.need) {
        mtx.className = "tp-mtx p2";
        out.className = "tp-rout";
        out.textContent = "Answer both and we will light the column that fits — nothing is booked by doing this.";
        return;
      }
      var n = AGE[pickd.age] + NEED[pickd.need];
      if (n > 3) n = 3;
      if (n < 1) n = 1;
      mtx.className = "tp-mtx p" + n;
      out.className = "tp-rout hit";
      out.innerHTML = "On what you have told us, <b>" + PACK[n] +
        "</b> covers it. Every column is still yours to book — and if you would rather build your own list, " +
        "<a href=\"#book\" style=\"color:inherit;text-decoration:underline\">ask us for a custom quote</a>.";
    }
  })();

  /* ==========================================================
     5. THE INSTRUMENT RAIL
     A real progress bar rather than a decorative one: its width is
     the share of the rail on screen, its travel the share scrolled.
  ========================================================== */
  (function rail(){
    var el = $("tpRail"), fill = $("tpRailFill");
    if (!el || !fill) return;
    function sync(){
      var ratio = el.clientWidth / el.scrollWidth;
      if (ratio >= 1) { fill.style.width = "100%"; fill.style.transform = "none"; return; }
      var max = el.scrollWidth - el.clientWidth;
      var p = max > 0 ? el.scrollLeft / max : 0;
      fill.style.width = (ratio * 100) + "%";
      fill.style.transform = "translateX(" + (p * (100 / ratio - 100)) + "%)";
    }
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    sync();
  })();

  /* ==========================================================
     6. THE CHAIN OF CUSTODY
     The gold line is drawn by scroll position rather than by a
     timer, so the claim is made at the pace the visitor reads it.
  ========================================================== */
  var chain = $("tpChain"), chainLine = $("tpChainLine");
  var chainNodes = chain ? all("li", chain) : [];
  function drawChain(){
    if (!chain || !chainLine) return;
    if (rm) {
      chainLine.style.strokeDashoffset = 0;
      chainNodes.forEach(function(n){ n.classList.add("lit"); });
      return;
    }
    var r = chain.getBoundingClientRect(), vh = window.innerHeight;
    /* starts as the row crosses 88% of the viewport, finishes half a screen later */
    var p = (vh * 0.88 - r.top) / (vh * 0.5);
    p = p < 0 ? 0 : (p > 1 ? 1 : p);
    chainLine.style.strokeDashoffset = 1000 * (1 - p);
    chainNodes.forEach(function(n, i){
      n.classList.toggle("lit", p >= (i + 0.35) / chainNodes.length);
    });
  }

  var ticking = false;
  window.addEventListener("scroll", function(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function(){ drawChain(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", drawChain, { passive: true });
  drawChain();

  /* ==========================================================
     7. BOOKING PREFILL
     Every "Book this test" on the page names the line it came
     from, so the form is already filled in by the time the
     visitor gets there. main.js owns the scroll and the submit.
  ========================================================== */
  var sel = $("btest");
  all(".tp-book").forEach(function(a){
    a.addEventListener("click", function(){
      if (!sel) return;
      var want = (a.getAttribute("data-test") || "").replace(/&amp;/g, "&").trim();
      var hit = null, loose = null;
      all("option", sel).forEach(function(o){
        var t = o.textContent.trim();
        if (t === want) hit = o;
        else if (!loose && want && t.indexOf(want) === 0) loose = o;
      });
      var chosen = hit || loose;
      if (chosen) sel.value = chosen.value || chosen.textContent;
      else {
        /* not in the list — say what was asked for rather than losing it */
        var last = sel.options[sel.options.length - 1];
        last.textContent = want + " — I have a prescription";
        last.value = last.textContent;
        sel.value = last.value;
      }
      sel.classList.add("tp-flash");
      setTimeout(function(){ sel.classList.remove("tp-flash"); }, 1200);
    });
  });

  /* ---------- shared: scroll to a section, clearing the sticky chrome ---------- */
  function jumpTo(el){
    if (!el) return;
    var nav = document.getElementById("nav"), chap = document.getElementById("chap");
    var off = (nav ? nav.offsetHeight : 70) + (chap ? chap.offsetHeight : 0) + 8;
    var y = el.getBoundingClientRect().top + window.scrollY - off;
    window.scrollTo({ top: y, behavior: rm ? "auto" : "smooth" });
  }

  apply();
})();

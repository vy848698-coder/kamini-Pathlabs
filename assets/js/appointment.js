/* ==========================================================
   KAMINI CLINIC & LABS — the "Book an Appointment" pop-up
   Home page only. Two steps: a tap on what they need, then name
   and number. forms.js checks and sends it like every other form
   (data-form="appointment"); this file owns when it opens, the
   steps and the thank-you.

   When it opens by itself, three seconds after the page loads:
   - on every fresh visit to the home page;
   - on a refresh of the home page, even just after closing it;
   - but NOT when the visitor closed it and is now just moving
     around the site (home → about → home) — that is someone
     browsing, and AWAY_HOURS must pass first;
   - at most MAX_A_DAY times a day, so a visitor who keeps
     refreshing and closing it is left alone until tomorrow;
   - and not for QUIET_DAYS once ANY form on the site has been
     sent from this browser: the desk already has them.
   The corner callback button opens it on demand at any time.
========================================================== */
(function(){
  "use strict";

  var dlg = document.getElementById("appt");
  if (!dlg || typeof dlg.showModal !== "function" || !window.KForms) return;

  var DELAY = 3000;
  var AWAY_HOURS = 3;
  var MAX_A_DAY = 3;
  var QUIET_DAYS = 7;
  var SHOWN = "kApptShown", SENT = "kFormSent";   /* SENT is written by forms.js */

  var rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var root = document.documentElement;
  var vv = window.visualViewport;
  var form = document.getElementById("apForm");
  var steps = form.querySelectorAll(".ap-step");
  var chips = [].slice.call(form.querySelectorAll(".ap-chip"));
  var done = document.getElementById("apDone");
  var lastFocus = null, closing = false;

  /* Storage can be off (private windows, blocked site data). Then every
     visit counts as the first, which is the safe way round. */
  function get(key){ try { return localStorage.getItem(key); } catch (e) { return null; } }
  function put(key, v){ try { localStorage.setItem(key, v); } catch (e) {} }
  function today(){ return new Date().toDateString(); }

  /* { at: when it last opened by itself, day: that day, n: times that day } */
  function shown(){
    try { return JSON.parse(get(SHOWN)) || {}; } catch (e) { return {}; }
  }

  function reloaded(){
    var nav = window.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    if (nav) return nav.type === "reload";
    return !!(window.performance && performance.navigation && performance.navigation.type === 1);
  }

  function wanted(){
    if (Date.now() - (+get(SENT) || 0) < QUIET_DAYS * 864e5) return false;
    var s = shown();
    if (!s.at) return true;
    if (s.day === today() && s.n >= MAX_A_DAY) return false;
    return reloaded() || Date.now() - s.at > AWAY_HOURS * 36e5;
  }

  /* Never interrupt: not while they are typing into the booking form,
     not with the mobile menu open, not in a background tab. */
  function busy(){
    if (document.hidden) return true;
    var a = document.activeElement;
    if (a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) return true;
    var nl = document.getElementById("nlinks");
    return !!(nl && nl.classList.contains("show"));
  }

  /* ---------- fitting the screen a phone actually shows ----------
     With the keyboard up, the visible part of the page is much shorter
     than the dialog's 100%. Sizing the dialog to the visual viewport
     shrinks the card above the keyboard, and the box being typed in is
     scrolled into view inside the form (not the page behind it). */
  function fit(){
    if (!vv || !dlg.open) return;
    dlg.style.height = vv.height + "px";
    dlg.style.top = vv.offsetTop + "px";
    var a = document.activeElement;
    if (!a || !form.contains(a) || !/^(INPUT|TEXTAREA)$/.test(a.tagName)) return;
    var box = form.getBoundingClientRect(), r = a.getBoundingClientRect();
    if (r.bottom > box.bottom - 12) form.scrollTop += r.bottom - box.bottom + 24;
    else if (r.top < box.top + 12) form.scrollTop -= box.top - r.top + 24;
  }
  if (vv){
    vv.addEventListener("resize", fit);
    vv.addEventListener("scroll", fit);
  }
  form.addEventListener("focusin", function(){ setTimeout(fit, 300); });

  /* ---------- opening and closing ---------- */
  function open(auto){
    if (dlg.open) return;
    lastFocus = document.activeElement;
    /* the page behind stops scrolling; pad for the vanished scrollbar so
       nothing shifts sideways */
    var gap = window.innerWidth - root.clientWidth;
    root.classList.add("ap-lock");
    if (gap > 0) root.style.paddingRight = gap + "px";
    dlg.showModal();
    fit();
    if (auto){
      var s = shown(), d = today();
      put(SHOWN, JSON.stringify({ at: Date.now(), day: d, n: (s.day === d ? s.n || 0 : 0) + 1 }));
    }
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ dlg.classList.add("in"); });
    });
  }

  function shut(){
    if (!dlg.open || closing) return;
    closing = true;
    dlg.classList.remove("in");
    setTimeout(function(){ if (dlg.open) dlg.close(); }, rm ? 0 : 320);
  }

  /* `close` also fires when the browser closes the dialog itself (a
     second Escape), so the tidy-up lives here rather than in shut() */
  dlg.addEventListener("close", function(){
    closing = false;
    dlg.classList.remove("in");
    dlg.style.height = dlg.style.top = "";
    root.classList.remove("ap-lock");
    root.style.paddingRight = "";
    if (lastFocus && lastFocus !== document.body && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  });

  dlg.addEventListener("cancel", function(e){ e.preventDefault(); shut(); });

  /* A tap on the dimmed backdrop closes it — but only when the press
     started there too, so dragging a selection out of a box does not. */
  var downOnBackdrop = false;
  dlg.addEventListener("pointerdown", function(e){ downOnBackdrop = e.target === dlg; });
  dlg.addEventListener("click", function(e){
    if (e.target === dlg && downOnBackdrop) shut();
  });

  ["apClose", "apLater", "apOk"].forEach(function(id){
    document.getElementById(id).addEventListener("click", shut);
  });

  /* The corner callback button opens the pop-up here instead of jumping
     to the booking form — until it has been sent, when the link is back
     to doing what it does on every other page. */
  var advisor = document.getElementById("advisor");
  if (advisor){
    advisor.addEventListener("click", function(e){
      if (form.getAttribute("data-step") === "done") return;
      e.preventDefault();
      open(false);
    });
  }

  /* ---------- the two steps ---------- */
  function step(n){
    form.setAttribute("data-step", n);
    steps[0].hidden = n !== 1;
    steps[1].hidden = n !== 2;
    document.getElementById("apStepN").textContent = n;
    form.scrollTop = 0;
  }

  chips.forEach(function(chip){
    chip.addEventListener("click", function(){
      chips.forEach(function(c){ c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      form.elements.reason.value = chip.getAttribute("data-reason");
      document.getElementById("apPicked").textContent = chip.querySelector("b").textContent;
      step(2);
      /* on a phone, jumping into the name box would throw the keyboard up
         over the step before they have even seen it */
      (fine ? form.elements.name : document.getElementById("apQ2")).focus();
    });
  });

  document.getElementById("apBack").addEventListener("click", function(){
    step(1);
    var on = form.querySelector('.ap-chip[aria-pressed="true"]');
    if (on) on.focus();
  });

  /* Enter in a box goes on to the next box still missing — a phone's
     "next" key — and only sends once name and number are both in.
     Without this, Enter after the name sends at once and the form
     answers with an error about the number they were about to type. */
  form.addEventListener("keydown", function(e){
    if (e.key !== "Enter" || e.target.tagName !== "INPUT" || e.isComposing) return;
    var order = [form.elements.name, form.elements.phone];
    for (var i = 0; i < order.length; i++){
      if (!order[i].value.trim() && order[i] !== e.target){
        e.preventDefault();
        order[i].focus();
        return;
      }
    }
  });

  KForms.bind(form, {
    done: function(data){
      document.getElementById("apWho").textContent = data.name.split(" ")[0];
      document.getElementById("apNum").textContent = "+91 " + data.phone.slice(0, 5) + " " + data.phone.slice(5);
      form.setAttribute("data-step", "done");
      steps[1].hidden = true;
      document.getElementById("apProg").hidden = true;
      document.getElementById("apFoot").hidden = true;
      done.hidden = false;
      form.scrollTop = 0;
      document.getElementById("apDoneT").focus();
    }
  });

  /* ---------- opening by itself ---------- */
  if (!wanted() || location.hash === "#contact") return;   /* came straight for the booking form */
  var tries = 0;
  function attempt(){
    if (dlg.open || !wanted()) return;
    if (busy()){
      if (++tries < 20) setTimeout(attempt, 1500);
      return;
    }
    open(true);
  }
  setTimeout(attempt, DELAY);
})();

/* ==========================================================
   KAMINI CLINIC & LABS — the "Book an Appointment" pop-up
   Home page only. Opens by itself three seconds after the page
   loads, at most once per browser session, and not at all for
   30 days once the visitor has sent it — a closed pop-up is a
   "no", and the booking form further down is still there.

   Two steps: a tap on what they need, then name and number.
   forms.js checks and sends it like every other form
   (data-form="appointment"); this file only owns the opening,
   the steps and the thank-you.
========================================================== */
(function(){
  "use strict";

  var dlg = document.getElementById("appt");
  if (!dlg || typeof dlg.showModal !== "function" || !window.KForms) return;

  var DELAY = 3000;
  var QUIET_DAYS = 30;
  var SENT = "kApptSent", SEEN = "kApptSeen";

  var rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var root = document.documentElement;
  var form = document.getElementById("apForm");
  var steps = form.querySelectorAll(".ap-step");
  var chips = [].slice.call(form.querySelectorAll(".ap-chip"));
  var done = document.getElementById("apDone");
  var lastFocus = null, closing = false;

  /* Storage can be off (private windows, blocked site data). Then the
     pop-up simply behaves as if this were the first visit. */
  function get(store, key){ try { return window[store].getItem(key); } catch (e) { return null; } }
  function put(store, key, v){ try { window[store].setItem(key, v); } catch (e) {} }

  function wanted(){
    if (get("sessionStorage", SEEN)) return false;
    return Date.now() - (+get("localStorage", SENT) || 0) > QUIET_DAYS * 864e5;
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

  /* ---------- opening and closing ---------- */
  function open(){
    lastFocus = document.activeElement;
    /* the page behind stops scrolling; pad for the vanished scrollbar so
       nothing shifts sideways */
    var gap = window.innerWidth - root.clientWidth;
    root.classList.add("ap-lock");
    if (gap > 0) root.style.paddingRight = gap + "px";
    dlg.showModal();
    put("sessionStorage", SEEN, "1");
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

  /* ---------- the two steps ---------- */
  function step(n){
    form.setAttribute("data-step", n);
    steps[0].hidden = n !== 1;
    steps[1].hidden = n !== 2;
    document.getElementById("apStepN").textContent = n;
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

  KForms.bind(form, {
    done: function(data){
      put("localStorage", SENT, String(Date.now()));
      document.getElementById("apWho").textContent = data.name.split(" ")[0];
      document.getElementById("apNum").textContent = "+91 " + data.phone.slice(0, 5) + " " + data.phone.slice(5);
      form.setAttribute("data-step", "done");
      steps[1].hidden = true;
      document.getElementById("apProg").hidden = true;
      document.getElementById("apFoot").hidden = true;
      done.hidden = false;
      document.getElementById("apDoneT").focus();
    }
  });

  /* ---------- when to open ---------- */
  if (!wanted() || location.hash === "#contact") return;   /* came straight for the booking form */
  var tries = 0;
  function attempt(){
    if (!wanted() || dlg.open) return;
    if (busy()){
      if (++tries < 20) setTimeout(attempt, 1500);
      return;
    }
    open();
  }
  setTimeout(attempt, DELAY);
})();

/* ==========================================================
   KAMINI CLINIC & LABS — Doctors page only.
   Loads after main.js, which already owns the nav, the reveals,
   the chapter-rail scrollspy, the FAQ accordion and the booking
   form. Everything here is specific to this page.

   One rule holds the page together: the roster cards are the only
   place a clinic timing is declared (data-sessions). The board in
   the masthead, the day dials and the "sitting today" filter are
   all read back from those cards, so nothing can drift out of step
   with what the counter actually tells a patient.
========================================================== */
(function(){
  "use strict";

  var $ = function(id){ return document.getElementById(id); };

  var roster = $("drRoster");
  if (!roster) return;                       /* not the doctors page */

  var cards = [].slice.call(roster.querySelectorAll(".dr-card"));
  var now   = new Date();
  var today = now.getDay();                  /* 0 = Sunday */
  var mins  = now.getHours() * 60 + now.getMinutes();

  var DAYS  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var MON   = ["January","February","March","April","May","June",
               "July","August","September","October","November","December"];

  /* 1110 -> "6.30 PM" — the clinic writes times with a full stop, not a colon */
  function clock(m){
    var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "PM" : "AM";
    h = h % 12; if (h === 0) h = 12;
    return h + (mm ? "." + (mm < 10 ? "0" + mm : mm) : "") + " " + ap;
  }

  /* ---------- read the sessions off every card ---------- */
  var panel = [];
  cards.forEach(function(card){
    var sessions;
    try { sessions = JSON.parse(card.getAttribute("data-sessions") || "[]"); }
    catch (e) { sessions = []; }
    var entry = {
      el:   card,
      name: card.getAttribute("data-name") || "",
      spec: card.getAttribute("data-spec") || "",
      /* the pill under the name is the shortest honest label we have */
      label: (card.querySelector(".dr-spec") || {}).textContent || "",
      sessions: sessions
    };
    entry.today = sessions.filter(function(s){ return s.d.indexOf(today) > -1; });
    panel.push(entry);
  });

  /* ==========================================================
     1. TODAY'S BOARD
     Every session sitting today, earliest first, each with the
     state it is actually in at this minute.
  ========================================================== */
  (function todayBoard(){
    var list = $("drList"), dateEl = $("drDate");
    if (!list) return;

    var rows = [];
    panel.forEach(function(p){
      p.today.forEach(function(s){
        rows.push({ start: s.s, end: s.e, name: p.name, label: p.label });
      });
    });
    rows.sort(function(a, b){ return a.start - b.start; });

    if (dateEl){
      dateEl.textContent = DAYS[today] + ", " + now.getDate() + " " + MON[now.getMonth()] +
        " · " + rows.length + (rows.length === 1 ? " clinic" : " clinics");
    }
    if (!rows.length) return;                /* keep the written fallback */

    var frag = document.createDocumentFragment();
    rows.forEach(function(r){
      var state = mins >= r.end ? "done" : (mins >= r.start ? "now" : "soon");
      var li = document.createElement("li");
      li.innerHTML =
        '<span class="tm">' + clock(r.start) + '</span>' +
        '<span class="who"><b></b><span></span></span>' +
        '<span class="st ' + state + '">' +
          (state === "now" ? "In clinic" : state === "soon" ? "Upcoming" : "Ended") +
        '</span>';
      /* names and specialities go in as text, never as markup */
      li.querySelector(".who b").textContent = r.name;
      li.querySelector(".who span").textContent = r.label;
      frag.appendChild(li);
    });
    list.innerHTML = "";
    list.appendChild(frag);
  })();

  /* ==========================================================
     2. TODAY, MARKED ON EVERY DIAL AND ON THE BOARD
  ========================================================== */
  cards.forEach(function(card){
    var letters = card.querySelectorAll(".dr-days b");
    if (letters[today]) letters[today].classList.add("today");
  });

  var week = $("drWeek"), tabs = $("drTabs");
  var columns = week ? [].slice.call(week.querySelectorAll(".dr-col")) : [];

  function showDay(d){
    columns.forEach(function(c){
      c.classList.toggle("show", parseInt(c.getAttribute("data-d"), 10) === d);
    });
    if (!tabs) return;
    tabs.querySelectorAll("button").forEach(function(b){
      var on = parseInt(b.getAttribute("data-d"), 10) === d;
      b.setAttribute("aria-selected", on ? "true" : "false");
      /* Sunday sits off the end of a narrow strip; nudge the chosen day
         into view rather than leaving it half-cut at the edge. */
      if (on && tabs.scrollWidth > tabs.clientWidth){
        var t = b.getBoundingClientRect(), s = tabs.getBoundingClientRect();
        tabs.scrollLeft += (t.left - s.left) - (s.width - t.width) / 2;
      }
    });
  }

  columns.forEach(function(c){
    if (parseInt(c.getAttribute("data-d"), 10) === today) c.classList.add("today");
  });
  showDay(today);                            /* the tab strip opens on today */

  if (tabs) tabs.addEventListener("click", function(e){
    var b = e.target.closest("button[data-d]");
    if (b) showDay(parseInt(b.getAttribute("data-d"), 10));
  });

  /* ==========================================================
     3. FILTERS
     The cards are in the markup and visible without JavaScript;
     this only narrows them.
  ========================================================== */
  (function filters(){
    var bar = $("drFilter"), count = $("drCount"), none = $("drNone"), reset = $("drReset");
    if (!bar) return;
    var chips = [].slice.call(bar.querySelectorAll(".dr-chip"));

    function apply(f){
      var shown = 0;
      panel.forEach(function(p){
        var keep = f === "all" ? true
                 : f === "today" ? p.today.length > 0
                 : p.spec === f;
        p.el.classList.toggle("hide", !keep);
        if (keep) shown++;
      });

      chips.forEach(function(c){
        var on = c.getAttribute("data-f") === f;
        c.classList.toggle("on", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });

      if (count){
        count.textContent = f === "today"
          ? shown + (shown === 1 ? " consultant sits" : " consultants sit") + " today, " + DAYS[today]
          : "Showing " + shown + " of " + panel.length + " consultants";
      }
      if (none) none.hidden = shown > 0;
    }

    bar.addEventListener("click", function(e){
      var c = e.target.closest(".dr-chip");
      if (c) apply(c.getAttribute("data-f"));
    });
    if (reset) reset.addEventListener("click", function(){ apply("all"); });

    apply("all");
  })();

  /* ==========================================================
     4. "BOOK" ON A CARD PRESELECTS THAT CONSULTANT
     main.js already scrolls the anchor; this only fills the form
     in, so the callback is about the right doctor.
  ========================================================== */
  (function prefill(){
    var sel = $("bdoc");
    if (!sel) return;
    document.querySelectorAll(".dr-book[data-doc]").forEach(function(a){
      a.addEventListener("click", function(){
        var want = a.getAttribute("data-doc");
        [].slice.call(sel.options).forEach(function(o, i){
          if (o.text.indexOf(want) === 0) sel.selectedIndex = i;
        });
        var name = $("bn");
        /* the scroll is smooth, so wait for it before taking focus */
        if (name) setTimeout(function(){ name.focus({ preventScroll: true }); }, 700);
      });
    });
  })();

})();

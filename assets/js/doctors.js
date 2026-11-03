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

  /* The clinic's day, not the reader's. Shift any clock onto IST — strip the
     local offset, add 5h30m — so a relative checking today's list from Dubai
     or New Jersey is told which consultants are sitting in Jagamara rather
     than being shown a board that has already "ended" hours early. The
     contact page's front-desk card does the same. */
  function istNow(){
    var d = new Date();
    return new Date(d.getTime() + d.getTimezoneOffset() * 60000 + 330 * 60000);
  }
  var now   = istNow();
  var today = now.getDay();                  /* 0 = Sunday, in IST */
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
      id:   card.id,
      avatar: card.getAttribute("data-avatar") || "",
      name: card.getAttribute("data-name") || "",
      spec: card.getAttribute("data-spec") || "",
      /* the pill under the name is the shortest honest label we have */
      label: (card.querySelector(".dr-spec") || {}).textContent || "",
      qual: card.getAttribute("data-qual") || "",
      mono: card.getAttribute("data-mono") || "",
      sessions: sessions
    };
    entry.today = sessions.filter(function(s){ return s.d.indexOf(today) > -1; });
    panel.push(entry);
  });

  /* ==========================================================
     1. TODAY'S BOARD
     The whole panel, one compact row per consultant, in three
     groups: sitting today (live state, running first), sitting
     later in the week (with their next clinic), and seen by
     appointment. Each row jumps to that consultant's card.
  ========================================================== */
  (function todayBoard(){
    var list = $("drList"), dateEl = $("drDate");
    if (!list) return;

    /* The wording matters more than it looks. "Upcoming" reads as "this
       doctor is not here", which is the opposite of what a clinic that has
       not started yet means — it is the one you can still get a slot in. So
       a session yet to begin says "Booking open", and only a session that
       has finished is played down. */
    var LABEL = { now: "In clinic", soon: "Booking open", done: "Clinic ended",
                  tbc: "Call for timing", later: "Next clinic", latertbc: "Call for timing",
                  appt: "Call to book" };
    var RANK  = { now: 0, soon: 1, tbc: 2, done: 3 };
    function timed(s){ return typeof s.s === "number" && typeof s.e === "number"; }
    var SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    var groups = { today: [], later: [], appt: [] };

    panel.forEach(function(p){
      if (!p.sessions.length){
        groups.appt.push({ p: p, state: "appt", when: "By appointment" });
        return;
      }
      if (p.today.length){
        /* a session with no hours yet ("Call for timing") still counts as
           sitting today; it just has no live state to show */
        var todays = p.today.filter(timed).sort(function(a, b){ return a.s - b.s; });
        if (!todays.length){
          groups.today.push({ p: p, state: "tbc", start: 1e5, when: "Today" });
          return;
        }
        /* a consultant with a morning and an evening clinic is one row: the
           session running now, else the next one, else the last that ended */
        var cur = todays.filter(function(s){ return mins >= s.s && mins < s.e; })[0],
            nxt = todays.filter(function(s){ return mins < s.s; })[0],
            pick = cur || nxt || todays[todays.length - 1],
            state = cur ? "now" : (nxt ? "soon" : "done");
        groups.today.push({
          p: p, state: state, start: pick.s,
          when: todays.map(function(s){ return clock(s.s); }).join(" & ")
        });
        return;
      }
      /* not today: the first day ahead they sit, and that day's first clinic */
      for (var ahead = 1; ahead <= 7; ahead++){
        var d = (today + ahead) % 7;
        var that = p.sessions.filter(function(s){ return s.d.indexOf(d) > -1; })
                             .sort(function(a, b){ return (timed(a) ? a.s : 1e5) - (timed(b) ? b.s : 1e5); })[0];
        if (that){
          var dayName = ahead === 1 ? "Tomorrow" : SHORT[d];
          groups.later.push({
            p: p, state: timed(that) ? "later" : "latertbc", ahead: ahead, start: timed(that) ? that.s : 1e5,
            when: timed(that) ? dayName + " · " + clock(that.s) : dayName
          });
          return;
        }
      }
      groups.appt.push({ p: p, state: "appt", when: "By appointment" });
    });

    groups.today.sort(function(a, b){
      return (RANK[a.state] - RANK[b.state]) || (a.start - b.start);
    });
    groups.later.sort(function(a, b){ return (a.ahead - b.ahead) || (a.start - b.start); });

    var sitting = groups.today.length;
    if (dateEl){
      dateEl.textContent = DAYS[today] + ", " + now.getDate() + " " + MON[now.getMonth()] +
        " · " + sitting + " of " + panel.length + " sitting today";
    }

    function row(r){
      var p = r.p, li = document.createElement("li");
      li.className = "is-" + r.state;
      li.innerHTML =
        '<a class="dr-trow">' +
          '<span class="av" aria-hidden="true"></span>' +
          '<span class="who"><b></b><span class="sp"></span></span>' +
          '<span class="when"><span class="tm"></span>' +
            '<span class="st ' + r.state + '"><i aria-hidden="true"></i><em></em></span></span>' +
        '</a>';
      var a = li.querySelector("a");
      if (p.id) a.href = "#" + p.id;
      var av = li.querySelector(".av");
      if (p.avatar){
        var img = document.createElement("img");
        img.src = p.avatar; img.alt = ""; img.width = 34; img.height = 34;
        img.decoding = "async";
        /* a missing thumbnail falls back to the monogram, never a broken icon */
        img.onerror = function(){ av.textContent = p.mono; };
        av.appendChild(img);
      } else {
        av.textContent = p.mono;
      }
      /* every value goes in as text, never as markup */
      li.querySelector(".who b").textContent = p.name;
      li.querySelector(".who .sp").textContent = p.label;
      li.querySelector(".tm").textContent = r.when;
      li.querySelector(".st em").textContent = LABEL[r.state];
      return li;
    }

    function heading(text, n){
      var li = document.createElement("li");
      li.className = "dr-tgrp";
      li.innerHTML = '<span></span><i></i>';
      li.querySelector("span").textContent = text;
      li.querySelector("i").textContent = n;
      return li;
    }

    var frag = document.createDocumentFragment();
    [["today", "Sitting today"], ["later", "Later this week"], ["appt", "By appointment"]]
      .forEach(function(g){
        var rows = groups[g[0]];
        if (!rows.length) return;
        frag.appendChild(heading(g[1], rows.length));
        rows.forEach(function(r){ frag.appendChild(row(r)); });
      });
    list.innerHTML = "";
    list.appendChild(frag);

    /* A row whose card is hidden by a filter would jump to nothing, so
       clear the filter first; then flash the card so the eye finds it. */
    list.addEventListener("click", function(e){
      var a = e.target.closest("a.dr-trow");
      if (!a) return;
      var card = document.querySelector(a.getAttribute("href"));
      if (!card) return;
      if (card.classList.contains("hide")){
        var all = document.querySelector('#drFilter .dr-chip[data-f="all"]');
        if (all) all.click();
      }
      card.classList.remove("dr-flash");
      void card.offsetWidth;                 /* restart the animation */
      card.classList.add("dr-flash");
    });
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

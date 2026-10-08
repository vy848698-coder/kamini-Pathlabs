/* ==========================================================
   KAMINI CLINIC & LABS — contact.html only
   Four small jobs, none of which the markup can do on its own:
     1. say whether the desk is open at this exact moment,
     2. keep the availability chips on the switchboard honest,
     3. light today's card in the week strip,
     4. word the enquiry form's thank-you and copy the address.
   (The enquiry form itself is checked and sent by forms.js.)

   Everything is evaluated in IST rather than the browser's own
   zone, so a relative checking the timings from Dubai or New
   Jersey sees the desk's clock and not their own.
========================================================== */
(function(){
  "use strict";

  /* ---------- the published hours, in one place ----------
     Index is Date#getDay(): 0 = Sunday. Minutes since midnight, so the
     comparisons below never have to reason about the hour boundary. */
  var HOURS = [
    { open: 7*60, close: 13*60 },   /* Sun */
    { open: 7*60, close: 21*60 },   /* Mon */
    { open: 7*60, close: 21*60 },
    { open: 7*60, close: 21*60 },
    { open: 7*60, close: 21*60 },
    { open: 7*60, close: 21*60 },
    { open: 7*60, close: 21*60 }    /* Sat */
  ];
  var DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  /* Shift any clock onto IST: strip the local offset, add 5h30m. */
  function istNow(){
    var d = new Date();
    return new Date(d.getTime() + d.getTimezoneOffset()*60000 + 330*60000);
  }
  function clock(mins){
    var h = Math.floor(mins/60), m = mins%60, ap = h >= 12 ? "PM" : "AM";
    h = h % 12; if (h === 0) h = 12;
    return h + ":" + (m < 10 ? "0" : "") + m + " " + ap;
  }
  /* "3 hours 20 minutes", but only as much of it as is worth saying */
  function span(mins){
    var h = Math.floor(mins/60), m = mins%60, out = [];
    if (h) out.push(h + (h === 1 ? " hour" : " hours"));
    if (m) out.push(m + (m === 1 ? " minute" : " minutes"));
    return out.join(" ") || "a moment";
  }

  function state(){
    var now = istNow(), day = now.getDay(), mins = now.getHours()*60 + now.getMinutes();
    var t = HOURS[day];
    return {
      now: now, day: day, mins: mins, today: t,
      open: mins >= t.open && mins < t.close,
      beforeOpen: mins < t.open
    };
  }

  /* ================= 1. the front desk card ================= */
  var desk = document.getElementById("ctDesk");

  function paintDesk(){
    if (!desk) return;
    var s = state();
    var verdict = document.getElementById("ctVerdict"),
        detail  = document.getElementById("ctDetail"),
        cl      = document.getElementById("ctClock");

    desk.setAttribute("data-open", s.open ? "yes" : "no");

    if (s.open) {
      var left = s.today.close - s.mins;
      verdict.textContent = "Open right now";
      detail.textContent = "Closes at " + clock(s.today.close) +
        (left <= 90 ? " — " + span(left) + " left" : "");
    } else if (s.beforeOpen) {
      verdict.textContent = "Closed — opening soon";
      detail.textContent = "The desk opens today at " + clock(s.today.open) +
        ", in " + span(s.today.open - s.mins) + ".";
    } else {
      var nd = (s.day + 1) % 7;
      verdict.textContent = "Closed for the day";
      detail.textContent = "Opens tomorrow (" + DAYS[nd] + ") at " + clock(HOURS[nd].open) + ".";
    }

    /* today / tomorrow, named rather than left as bare labels */
    var nd2 = (s.day + 1) % 7;
    document.getElementById("ctTodayLbl").textContent = "Today · " + DAYS[s.day];
    document.getElementById("ctTodayHrs").textContent = clock(s.today.open) + " – " + clock(s.today.close);
    document.getElementById("ctNextLbl").textContent  = "Tomorrow · " + DAYS[nd2];
    document.getElementById("ctNextHrs").textContent  = clock(HOURS[nd2].open) + " – " + clock(HOURS[nd2].close);

    cl.textContent = "Bhubaneswar · " + clock(s.mins) + " IST";
  }

  /* ================= 2. the switchboard chips ================= */
  function paintLines(){
    var s = state();
    [].forEach.call(document.querySelectorAll('.ct-lav[data-hours="desk"]'), function(chip){
      var txt = chip.querySelector(".ct-lavt");
      chip.classList.toggle("live", s.open);
      if (s.open) txt.textContent = "Answering now";
      else if (s.beforeOpen) txt.textContent = "Opens " + clock(s.today.open);
      else txt.textContent = "Closed · opens " + clock(HOURS[(s.day+1)%7].open);
    });
  }

  /* ================= 3. today, in the week strip ================= */
  function paintWeek(){
    var d = istNow().getDay();
    [].forEach.call(document.querySelectorAll(".ct-day"), function(el){
      el.classList.toggle("today", Number(el.getAttribute("data-day")) === d);
    });
  }

  function tick(){ paintDesk(); paintLines(); paintWeek(); }
  tick();
  /* A minute's resolution is all any of this claims, so a 30s beat is
     plenty and costs nothing. */
  setInterval(tick, 30000);

  /* ================= 4a. the enquiry form =================
     forms.js checks the fields and sends the note; this only words the
     thank-you, which depends on whether the desk is open right now. */
  var form = document.getElementById("ctForm");
  if (form && window.KForms) {
    var msg   = document.getElementById("ctMsg"),
        when  = document.getElementById("ctWhen"),
        count = document.getElementById("ctCount"),
        done  = document.getElementById("ctDone"),
        doneT = document.getElementById("ctDoneText"),
        send  = document.getElementById("ctSend");

    msg.addEventListener("input", function(){
      count.textContent = msg.value.length + " / 500";
    });

    KForms.bind(form, {
      done: function(data){
        var first = data.name.split(" ")[0];
        var s = state();
        var promise = s.open
          ? "We will call you back on " + data.phone + " shortly."
          : "The desk is closed just now — you will get a call soon after it opens at " +
            clock(s.beforeOpen ? s.today.open : HOURS[(s.day+1)%7].open) + ".";

        doneT.textContent = "Thank you, " + first + ". Your note is with the desk. " + promise +
          (when.selectedIndex ? " (" + when.value + ")" : "");
        done.classList.add("show");

        send.innerHTML = "Sent to the desk";
        send.style.opacity = ".7";

        setTimeout(function(){
          form.reset();
          count.textContent = "0 / 500";
        }, 400);
      }
    });
  }

  /* ================= 4b. copy the address ================= */
  var copy = document.getElementById("ctCopy");
  if (copy) {
    var ADDRESS = "Kamini Clinic & Labs, Plot No. 555, Alekh Niwas, " +
      "In front of ICICI Bank, Jagamara, Khandagiri, Bhubaneswar – 751030, Odisha";

    /* execCommand is the fallback for the http:// and older-Safari cases
       where navigator.clipboard simply is not there. */
    function legacy(text){
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:absolute;left:-9999px;top:0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }

    function flash(ok){
      copy.textContent = ok ? "Address copied" : "Press Ctrl+C to copy";
      copy.classList.toggle("done", ok);
      setTimeout(function(){
        copy.textContent = "Copy address";
        copy.classList.remove("done");
      }, 2400);
    }

    copy.addEventListener("click", function(){
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ADDRESS)
          .then(function(){ flash(true); })
          .catch(function(){ flash(legacy(ADDRESS)); });
      } else {
        flash(legacy(ADDRESS));
      }
    });
  }
})();

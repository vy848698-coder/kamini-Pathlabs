/* ==========================================================
   KAMINI CLINIC & LABS — Home Collection page only.
   Loads after main.js, which already owns the nav, the reveals,
   the FAQ accordion and the booking-form validation. Everything
   here is specific to this page: the slot picker, the test
   picker with its running total, and the coverage checker.
========================================================== */
(function(){
  "use strict";

  var rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $  = function(id){ return document.getElementById(id); };

  /* ---------- money ---------- */
  function rupees(n){ return "₹" + n.toLocaleString("en-IN"); }

  /* ==========================================================
     1. SLOT PICKER
     Two chip groups behaving as radio sets, plus a locality box.
     "Continue" copies the choice into the booking form below
     rather than submitting anything of its own — the form is the
     single place a booking is actually made.
  ========================================================== */
  var dates = $("hcDates"), slots = $("hcSlots");

  /* The last slot ends at 8 PM. Booking "today" at half past eight is a
     promise we cannot keep, so once the day is spent the picker moves on
     to tomorrow by itself instead of accepting a slot that has gone. */
  var LAST_SLOT_END = 20;

  function pick(group, btn){
    group.querySelectorAll("[aria-pressed]").forEach(function(b){
      b.setAttribute("aria-pressed", b === btn ? "true" : "false");
    });
  }

  if (dates && slots){
    var now = new Date(), MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        DAY = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    /* stamp each day chip with its real date, so "Day after" is never a guess */
    dates.querySelectorAll(".hc-dchip").forEach(function(b){
      var d = new Date(now.getTime());
      d.setDate(d.getDate() + parseInt(b.dataset.day, 10));
      b.querySelector("span").textContent = DAY[d.getDay()] + ", " + d.getDate() + " " + MON[d.getMonth()];
    });

    /* Grey out today's windows that have already closed. A slot is bookable
       until its own end hour — 7:00–8:30 AM is still worth offering at 7:45. */
    function syncSlots(){
      var today = dates.querySelector('[data-day="0"]').getAttribute("aria-pressed") === "true",
          hour  = now.getHours() + now.getMinutes() / 60,
          live  = null, chosenGone = false;

      slots.querySelectorAll(".hc-schip").forEach(function(b){
        var gone = today && hour >= parseFloat(b.dataset.end);
        b.disabled = gone;
        b.style.opacity = gone ? ".38" : "";
        b.style.pointerEvents = gone ? "none" : "";
        if (gone && b.getAttribute("aria-pressed") === "true") chosenGone = true;
        if (!gone && !live) live = b;
      });
      /* if the selected window just lapsed, slide the selection forward */
      if (chosenGone && live) pick(slots, live);
    }

    /* the whole of today is gone — start people on tomorrow */
    if (now.getHours() + now.getMinutes() / 60 >= LAST_SLOT_END){
      var t = dates.querySelector('[data-day="1"]');
      var today0 = dates.querySelector('[data-day="0"]');
      today0.disabled = true;
      today0.style.opacity = ".4";
      today0.style.pointerEvents = "none";
      today0.querySelector("span").textContent = "Fully booked";
      pick(dates, t);
    }
    syncSlots();

    dates.addEventListener("click", function(e){
      var b = e.target.closest(".hc-dchip");
      if (b){ pick(dates, b); syncSlots(); }
    });
    slots.addEventListener("click", function(e){
      var b = e.target.closest(".hc-schip");
      if (b) pick(slots, b);
    });
  }

  /* ---------- hand the choice to the booking form ---------- */
  var DAY_LABEL = ["Today", "Tomorrow", "Day after"];

  function syncForm(){
    var bd = $("bd"), bt = $("bt"), ba = $("ba");

    if (dates && bd){
      var d = dates.querySelector('[aria-pressed="true"]');
      if (d) bd.value = DAY_LABEL[parseInt(d.dataset.day, 10)] || bd.value;
    }
    if (slots && bt){
      var s = slots.querySelector('[aria-pressed="true"]');
      if (s) bt.value = s.dataset.slot;
    }
    var loc = $("hcLoc");
    if (loc && ba && loc.value.trim()) ba.value = loc.value.trim();
  }

  /* Run once at load too, so someone who scrolls straight past the picker is
     not offered "Today" in the form after the day's last slot has gone. */
  syncForm();

  function toBooking(){
    syncForm();
    var target = $("book");
    if (target){
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 72, behavior: rm ? "auto" : "smooth" });
    }
    /* wait for the scroll before pulling focus, or the browser jumps twice */
    setTimeout(function(){ var bn = $("bn"); if (bn) bn.focus({ preventScroll: true }); }, rm ? 0 : 620);
  }

  var go = $("hcGo");
  if (go) go.addEventListener("click", toBooking);

  /* ==========================================================
     2. BUILD YOUR VISIT — tabs + running total
  ========================================================== */
  var tabTests = $("tabTests"), tabPacks = $("tabPacks"),
      panelTests = $("panelTests"), panelPacks = $("panelPacks");

  function showTab(which){
    var onTests = which === "tests";
    tabTests.setAttribute("aria-selected", onTests ? "true" : "false");
    tabPacks.setAttribute("aria-selected", onTests ? "false" : "true");
    panelTests.hidden = !onTests;
    panelPacks.hidden = onTests;
  }
  if (tabTests && tabPacks){
    tabTests.addEventListener("click", function(){ showTab("tests"); });
    tabPacks.addEventListener("click", function(){ showTab("packs"); });
  }

  /* Selection is held as an ordered list so the summary reads back in the
     order things were added, which is how people remember what they picked. */
  var chosen = [];
  var list = $("hcList"), empty = $("hcEmpty"), sub = $("hcSub"),
      total = $("hcTotal"), save = $("hcSave"), bsel = $("bsel");

  function render(){
    if (!list) return;

    var amount = 0, mrp = 0;
    list.textContent = "";

    chosen.forEach(function(it){
      amount += it.price; mrp += it.mrp;

      var li = document.createElement("li"),
          name = document.createElement("span"),
          price = document.createElement("em"),
          rm2 = document.createElement("button");

      name.textContent = it.name;
      price.textContent = rupees(it.price);
      rm2.type = "button";
      rm2.className = "hc-srm";
      rm2.innerHTML = "&times;";
      rm2.setAttribute("aria-label", "Remove " + it.name);
      rm2.addEventListener("click", function(){ toggle(it.id); });

      li.appendChild(name); li.appendChild(price); li.appendChild(rm2);
      list.appendChild(li);
    });

    empty.hidden = chosen.length > 0;
    sub.textContent = rupees(amount);
    total.textContent = rupees(amount);

    var saved = mrp - amount;
    save.hidden = saved <= 0;
    if (saved > 0) save.textContent = "You save " + rupees(saved) + " on list price";

    /* mirror into the booking form so the callback team sees the same list */
    if (bsel){
      if (!chosen.length){
        bsel.textContent = "Nothing selected yet — or just tell us on the call.";
      } else {
        bsel.innerHTML = chosen.map(function(i){ return i.name; }).join(", ") +
                         " &middot; <b>" + rupees(amount) + "</b>";
      }
    }
  }

  function toggle(id){
    var card = document.querySelector('.hc-item[data-id="' + id + '"]');
    if (!card) return;

    var at = -1;
    chosen.forEach(function(i, k){ if (i.id === id) at = k; });
    var adding = at < 0;

    if (adding){
      chosen.push({
        id: id,
        name: card.dataset.name,
        price: parseInt(card.dataset.price, 10),
        mrp: parseInt(card.dataset.mrp, 10)
      });
    } else {
      chosen.splice(at, 1);
    }

    card.classList.toggle("on", adding);
    var add = card.querySelector(".hc-iadd");
    /* the button is <svg> + a text node; only the text changes */
    add.lastChild.textContent = adding ? "Added" : "Add";
    add.setAttribute("aria-pressed", adding ? "true" : "false");
    render();
  }

  /* One listener per card: a click on the inner button bubbles up to here,
     so mouse and keyboard both toggle exactly once. */
  document.querySelectorAll(".hc-item").forEach(function(card){
    card.addEventListener("click", function(){ toggle(card.dataset.id); });
  });
  render();

  /* "Send this to the lab" is a plain anchor, so main.js already scrolls it.
     All this adds is the focus, once the page has settled. */
  var send = $("hcSend");
  if (send) send.addEventListener("click", function(){
    setTimeout(function(){ var bn = $("bn"); if (bn) bn.focus({ preventScroll: true }); }, rm ? 0 : 620);
  });

  /* ==========================================================
     3. COVERAGE CHECKER
     Bhubaneswar PIN codes all begin 751, and collection anywhere in
     the city is free — so a matched locality and a city PIN get the
     same answer, and anything else is sent to the phone rather than
     turned away.
  ========================================================== */
  var areaForm = $("hcAreaForm"), areaIn = $("hcArea"),
      areaRes = $("hcAreaRes"), areaChips = $("hcAreaChips");

  var TICK = '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>',
      INFO = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/></svg>';

  function norm(s){ return s.toLowerCase().replace(/[^a-z0-9]/g, ""); }

  if (areaForm && areaIn && areaRes && areaChips){
    var chips = Array.prototype.slice.call(areaChips.querySelectorAll("button"));

    function answer(html, ok){
      areaRes.className = "hc-res rv in" + (ok ? " ok" : "");
      areaRes.innerHTML = (ok ? TICK : INFO) + "<span>" + html + "</span>";
      areaRes.hidden = false;
    }

    areaForm.addEventListener("submit", function(e){
      e.preventDefault();
      var q = areaIn.value.trim();
      chips.forEach(function(c){ c.classList.remove("hit"); });

      if (!q){
        answer("Type a locality or a six-digit PIN and we will check it against our collection rounds.", false);
        areaIn.focus();
        return;
      }

      /* a Bhubaneswar PIN is enough on its own */
      if (/^\d{6}$/.test(q)){
        if (q.indexOf("751") === 0){
          answer("<b>Yes — " + q + " is inside Bhubaneswar.</b> Collection there is free, with slots from 6 AM to 8 PM. <a href=\"#book\">Book a slot</a>.", true);
        } else {
          answer("That PIN sits outside Bhubaneswar. Call <a href=\"tel:9861451521\">98614 51521</a> and we will tell you honestly whether we can reach you.", false);
        }
        return;
      }

      var hit = null;
      chips.forEach(function(c){
        var n = norm(c.textContent);
        if (!hit && (n === norm(q) || n.indexOf(norm(q)) === 0 || norm(q).indexOf(n) === 0)) hit = c;
      });

      if (hit){
        hit.classList.add("hit");
        answer("<b>Yes — we collect in " + hit.textContent + ".</b> Free, seven days a week, with slots from 6 AM. <a href=\"#book\">Book a slot</a>.", true);
      } else {
        answer("We could not match that name, but <b>collection anywhere in Bhubaneswar is free</b>. Call <a href=\"tel:9861451521\">98614 51521</a> and we will confirm your locality in a minute.", false);
      }
    });

    /* tapping a chip fills the box and checks it — faster than typing */
    areaChips.addEventListener("click", function(e){
      var c = e.target.closest("button");
      if (!c) return;
      areaIn.value = c.textContent;
      areaForm.dispatchEvent(new Event("submit", { cancelable: true }));
    });
  }
})();

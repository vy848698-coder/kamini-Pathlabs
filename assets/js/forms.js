/* ==========================================================
   KAMINI CLINIC & LABS — every form that reaches the desk
   One set of rules for the booking form (#bform, on the home,
   doctors and home collection pages) and the contact enquiry
   (#ctForm), so a number that is refused on one page is
   refused on all of them.

   What a field is checked against comes from its `name`:
   name, phone, email, locality and message have rules; any
   other named control (the selects) is sent as it stands.
   `required` on the input decides whether it may be left blank.

   mail/send.php runs the same checks again — these are here so
   the visitor hears about a mistake before pressing send, not
   instead of the server's.
========================================================== */
(function(){
  "use strict";

  var PHONE = "+91 98614 51521";

  /* ---------- digits from any keyboard ----------
     A phone set to Odia or Hindi types its own numerals, and some
     autofill sources hand over full-width ones. All of them become
     0–9 before anything else looks at the value. */
  var ZEROS = [0x0966 /* Devanagari */, 0x09E6 /* Bengali */, 0x0B66 /* Odia */, 0xFF10 /* full-width */];
  function ascii(s){
    return s.replace(/[०-९০-৯୦-୯０-９]/g, function(c){
      var n = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++){
        if (n >= ZEROS[i] && n <= ZEROS[i] + 9) return String(n - ZEROS[i]);
      }
      return c;
    });
  }

  /* A pasted or autofilled number usually carries the country code:
     "+91 98614 51521", "0091…", "098614…". Those prefixes are only
     dropped when there are more than ten digits, so a ten-digit number
     that happens to start with 91 is never touched. */
  function phoneDigits(raw){
    var d = ascii(raw).replace(/\D/g, "");
    if (d.length > 10 && d.indexOf("0091") === 0) d = d.slice(4);
    else if (d.length > 10 && d.indexOf("91") === 0) d = d.slice(2);
    if (d.length > 10 && d.charAt(0) === "0") d = d.slice(1);
    return d;
  }

  /* Letters in any script, plus the combining marks Odia and Devanagari
     names are built from. Older browsers without \p{} fall back to Latin
     and the three Indian scripts the clinic actually sees. */
  var LETTER;
  try { LETTER = new RegExp("[\\p{L}\\p{M}]", "u"); }
  catch (err) { LETTER = /[A-Za-zÀ-ɏऀ-ॿঀ-৿଀-୿]/; }
  function letters(s){
    var n = 0;
    for (var i = 0; i < s.length; i++) if (LETTER.test(s.charAt(i))) n++;
    return n;
  }
  function onlyFrom(s, extra){
    for (var i = 0; i < s.length; i++){
      var c = s.charAt(i);
      if (!LETTER.test(c) && extra.indexOf(c) < 0) return c;
    }
    return "";
  }

  function squash(s){ return s.replace(/\s+/g, " ").trim(); }

  /* ---------- email ---------- */
  var EMAIL = /^[A-Za-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

  /* The slips people actually make with the big providers. Anything here
     is certainly wrong, so it is refused with the fix offered. */
  var TYPOS = {
    "gmial.com":"gmail.com", "gmai.com":"gmail.com", "gamil.com":"gmail.com", "gmaill.com":"gmail.com",
    "gnail.com":"gmail.com", "gmal.com":"gmail.com", "gmail.co":"gmail.com", "gmail.con":"gmail.com",
    "gmail.cm":"gmail.com", "gmail.om":"gmail.com", "gmail.comm":"gmail.com", "gmail.in":"gmail.com",
    "gmail.co.in":"gmail.com", "yaho.com":"yahoo.com", "yahoo.con":"yahoo.com", "yahooo.com":"yahoo.com",
    "yahoo.in":"yahoo.co.in", "yaho.co.in":"yahoo.co.in", "hotmial.com":"hotmail.com", "hotmail.con":"hotmail.com",
    "outlok.com":"outlook.com", "outlook.con":"outlook.com", "rediffmail.con":"rediffmail.com",
    "redifmail.com":"rediffmail.com", "icloud.con":"icloud.com"
  };

  /* ---------- the rules ----------
     Each takes the raw value and returns { v: cleaned value, e: message }.
     An empty `e` means the value is fine. */
  var RULES = {
    name: function(raw){
      var v = squash(raw);
      if (!v) return { v: v, e: "Please tell us your name." };
      var odd = onlyFrom(v, " .'’-");
      if (odd) return { v: v, e: /\d/.test(odd) ? "A name cannot contain numbers." : "Please use letters only — “" + odd + "” is not allowed in a name." };
      if (letters(v) < 2) return { v: v, e: "Please enter the full name, not just an initial." };
      if (v.length > 60) return { v: v, e: "That name is too long — 60 characters at most." };
      if (/(.)\1\1\1/i.test(v) || /[.'’-]{2}/.test(v)) return { v: v, e: "That does not look like a name." };
      return { v: v, e: "" };
    },

    phone: function(raw){
      var v = phoneDigits(raw);
      if (!v) return { v: v, e: "Please enter a mobile number so we can call you back." };
      if (v.length !== 10) return { v: v, e: "A mobile number has 10 digits — this has " + v.length + "." };
      if (v.charAt(0) === "0") return { v: v, e: "Leave out the 0 at the start — just the 10-digit number." };
      if (!/^[6-9]/.test(v)) return { v: v, e: "Indian mobile numbers start with 6, 7, 8 or 9." };
      if (/^(\d)\1{9}$/.test(v)) return { v: v, e: "Please enter a real mobile number." };
      return { v: v, e: "" };
    },

    email: function(raw){
      var v = raw.replace(/\s+/g, "");
      if (!v) return { v: v, e: "" };
      if (v.length > 254) return { v: v, e: "That email address is too long." };
      var at = v.lastIndexOf("@");
      if (at < 0) return { v: v, e: "An email address needs an @ — for example name@gmail.com." };
      var domain = v.slice(at + 1).toLowerCase().replace(/\.$/, "");
      if (TYPOS[domain]){
        return { v: v, e: "Did you mean ", fix: v.slice(0, at + 1) + TYPOS[domain] };
      }
      if (at > 64 || !EMAIL.test(v)) return { v: v, e: "That email address does not look right." };
      return { v: v, e: "" };
    },

    locality: function(raw){
      var v = squash(raw);
      if (!v) return { v: v, e: "Please tell us the area, so the right collector comes." };
      if (/^\d{6}$/.test(v)) return { v: v, e: "" };   /* a PIN on its own is enough */
      var odd = onlyFrom(v, " 0123456789,./#&()'’-");
      if (odd) return { v: v, e: "“" + odd + "” is not allowed here — the locality name or PIN will do." };
      if (letters(v) < 2) return { v: v, e: "Please type the locality name, or a 6-digit PIN." };
      if (v.length > 80) return { v: v, e: "Just the locality is enough — 80 characters at most." };
      return { v: v, e: "" };
    },

    message: function(raw){
      /* keep line breaks, lose everything else that is invisible */
      var v = raw.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
                 .replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
      if (v.length > 500) return { v: v, e: "Please keep the message under 500 characters." };
      if (/https?:\/\/|www\.|<\s*a\s/i.test(v)) return { v: v, e: "Please leave out web links — describe it in words, or WhatsApp us a photo." };
      return { v: v, e: "" };
    }
  };

  /* ---------- showing a problem ---------- */
  function slot(el){
    var box = el.parentNode;
    var s = box.querySelector(".ct-err, .ferr");
    if (!s){
      s = document.createElement("span");
      s.className = "ferr";
      box.appendChild(s);
    }
    if (!s.id) s.id = el.id + "Err";
    return s;
  }

  function fail(el, msg, fix){
    var s = slot(el);
    s.textContent = msg;
    if (fix){
      /* the suggested address is a button: one tap puts it in the field */
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ffix";
      b.textContent = fix;
      b.addEventListener("click", function(){
        el.value = fix;
        clear(el);
        el.focus();
      });
      s.appendChild(b);
      s.appendChild(document.createTextNode("?"));
    }
    el.classList.add("bad");
    el.setAttribute("aria-invalid", "true");
    el.setAttribute("aria-describedby", s.id);
    el.parentNode.classList.add("err");
  }

  function clear(el){
    el.classList.remove("bad");
    el.removeAttribute("aria-invalid");
    el.parentNode.classList.remove("err");
  }

  /* Runs one field's rule, writes the tidied value back and reports.
     Returns true when the field is fine. */
  function check(el){
    var rule = RULES[el.name];
    if (!rule) return true;
    var r = rule(el.value);
    if (!r.v && !el.required){ el.value = ""; clear(el); return true; }
    if (r.v !== el.value && !r.e) el.value = r.v;
    if (r.e){ fail(el, r.e, r.fix); return false; }
    clear(el);
    return true;
  }

  /* ---------- sending ---------- */
  function post(url, data){
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function(){ ctrl.abort(); }, 20000) : null;
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data),
      credentials: "same-origin",
      signal: ctrl ? ctrl.signal : undefined
    }).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(j){
        if (!j || typeof j !== "object") j = {};
        j.status = r.status;
        return j;
      });
    }, function(){
      return { status: 0 };
    }).then(function(j){
      if (timer) clearTimeout(timer);
      return j;
    });
  }

  /* ---------- wiring a form ----------
     opts.done(data) runs after the desk has the message; it owns the
     thank-you. The form's own `action` is where it posts, so the page
     and a visitor with JavaScript off both reach the same script. */
  function bind(form, opts){
    opts = opts || {};
    var started = Date.now(), busy = false;
    var btn = form.querySelector('[type="submit"]'), label = btn.innerHTML;
    var url = form.getAttribute("action");
    var fields = [].filter.call(form.elements, function(el){ return RULES[el.name]; });

    /* one line under the button for anything that is not a field's fault */
    var note = document.createElement("p");
    note.className = "fsend";
    note.setAttribute("role", "alert");
    note.hidden = true;
    btn.parentNode.insertBefore(note, btn.nextSibling);
    function say(html){ note.innerHTML = html; note.hidden = !html; }

    fields.forEach(function(el){
      el.addEventListener("input", function(){ clear(el); say(""); });
      /* a field is judged when the visitor leaves it, not while they type */
      el.addEventListener("blur", function(){ if (el.value) check(el); });
    });

    /* Only digits ever stay in the box, and never more than ten. A paste
       or an autofill arrives whole, country code and all, so a jump of more
       than one character has its +91 / 0 taken off first; a keystroke is
       just one more digit, and an eleventh one is simply not taken. */
    var phone = form.elements.phone, was = 0;
    if (phone){
      phone.addEventListener("input", function(){
        var whole = phone.value.length - was > 1;
        var v = whole ? phoneDigits(phone.value) : ascii(phone.value).replace(/\D/g, "");
        v = v.slice(0, 10);
        if (v !== phone.value) phone.value = v;
        was = v.length;
      });
      form.addEventListener("reset", function(){ was = 0; });
    }

    form.addEventListener("submit", function(e){
      e.preventDefault();
      if (busy) return;
      say("");

      var first = null;
      fields.forEach(function(el){ if (!check(el) && !first) first = el; });
      if (first){ first.focus(); return; }

      var data = { form: form.getAttribute("data-form"), elapsed: Date.now() - started };
      [].forEach.call(form.elements, function(el){
        if (el.name && !el.disabled && el.type !== "submit" && el.type !== "button") data[el.name] = el.value;
      });

      if (navigator.onLine === false){
        say("You seem to be offline. Please check your connection, or call <a href=\"tel:+919861451521\">" + PHONE + "</a>.");
        return;
      }

      busy = true;
      btn.disabled = true;
      btn.textContent = "Sending…";

      post(url, data).then(function(res){
        if (res.ok){
          if (opts.done) opts.done(data);
          return;   /* the button stays spent: one request per visit is plenty */
        }
        busy = false;
        btn.disabled = false;
        btn.innerHTML = label;

        var errs = res.errors || {}, firstBad = null;
        Object.keys(errs).forEach(function(k){
          var el = form.elements[k];
          if (el && el.focus){ fail(el, errs[k]); firstBad = firstBad || el; }
        });
        if (firstBad){ firstBad.focus(); return; }

        if (res.status === 429){
          say(res.error || "You have sent a few requests already — we have them. Please call if it is urgent.");
        } else {
          say("Sorry — this did not go through. Your details are still here, so please try again, " +
              "or call <a href=\"tel:+919861451521\">" + PHONE + "</a> / " +
              "<a href=\"https://wa.me/919861451521\" target=\"_blank\" rel=\"noopener\">WhatsApp us</a>.");
        }
      });
    });
  }

  window.KForms = { bind: bind, rules: RULES, phoneDigits: phoneDigits };

  /* ---------- the booking form, wherever it appears ---------- */
  var bform = document.getElementById("bform");
  if (bform){
    bind(bform, {
      done: function(){
        var btn = document.getElementById("bbtn");
        document.getElementById("fmsg").hidden = false;
        btn.textContent = "Request received";
        setTimeout(function(){ bform.reset(); }, 500);
      }
    });
  }
})();

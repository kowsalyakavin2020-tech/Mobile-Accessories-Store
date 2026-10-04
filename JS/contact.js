/* =====================================================================
   STACKLY · CONTACT PAGE RUNTIME
   Runs on the shared runtime home.js installs (gsap, ScrollTrigger, Lenis,
   window.StacklySmooth). No second GSAP is loaded. Owns: the switchboard
   shutter, the ladder scrub, the validated work order, the drawn map frame,
   the peeling portrait, the desk-shift tape, the sticky checklist, the
   squared-up contact sheet and the plug-in FAQ.
   ===================================================================== */
(function () {
  'use strict';
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var live = !!(gsap && ST) && !REDUCED;
  if (gsap && ST) gsap.registerPlugin(ST);

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  function scrollToY(y) {
    var done = window.StacklySmooth && window.StacklySmooth.to
      ? window.StacklySmooth.to(y, { duration: .9 })
      : false;
    if (!done) window.scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' });
  }

  function centerOn(el) {
    var r = el.getBoundingClientRect();
    var y = (window.pageYOffset || document.documentElement.scrollTop) + r.top
          - Math.max(0, (window.innerHeight - r.height) / 2);
    scrollToY(Math.max(0, y));
  }

  /* the preloader hands over: run the intro once, never twice */
  function whenReady(cb) {
    var ran = false, once = function () { if (ran) return; ran = true; cb(); };
    var p = $('#preloader');
    if (!p || p.classList.contains('hide') || p.classList.contains('done')) return once();
    var mo = new MutationObserver(function () {
      if (p.classList.contains('done') || p.classList.contains('hide')) { mo.disconnect(); once(); }
    });
    mo.observe(p, { attributes: true });
    setTimeout(function () { mo.disconnect(); once(); }, 6000);
  }

  function toast(title, text) {
    var t = $('#toast'), tt = $('#toastTitle'), tx = $('#toastText');
    if (!t) return;
    if (tt) tt.textContent = title;
    if (tx) tx.textContent = text;
    t.classList.add('on');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }

  /* ---- reveal primitives: [data-ct-r] on scroll, [data-ct-h] on intro ---- */
  function reveals() {
    var items = $$('[data-ct-r]');
    var show = function (el) { el.classList.add('ct-in'); };
    if (!live) { items.forEach(show); return; }
    items.forEach(function (el, i) {
      /* the ladder rungs are driven by their own scrub — two systems on one
         element would fight over the same transform */
      if (el.closest && el.closest('#ctSteps')) return;
      ST.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: function () { setTimeout(function () { show(el); }, (i % 4) * 80); }
      });
    });
    window.addEventListener('load', function () {
      setTimeout(function () {
        items.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < innerHeight && r.bottom > 0) show(el);
        });
      }, 1600);
    });
  }

  /* =====================================================================
     S2 · HERO — the shutter rolls up, four channel cards drop face-down
     ===================================================================== */
  function hero() {
    var shot = $('#ctShot'), shutter = $('#ctShutter'), board = $('#ctBoard');
    var slats = $$('#ctShutter i'), lines = $$('.ct-line');

    whenReady(function () {
      $$('[data-ct-h]').forEach(function (el, i) {
        setTimeout(function () { el.classList.add('ct-in'); }, 100 + i * 140);
      });
      if (!live) return;
      if (slats.length) {
        gsap.set(slats, { transformOrigin: 'top center' });
        gsap.timeline()
          .to(slats, { scaleY: 0, duration: .6, stagger: .045, ease: 'power3.in' })
          .to(shutter, { autoAlpha: 0, duration: .3 }, '-=.14');
      }
      if (lines.length) {
        lines.forEach(function (l) { l.style.transition = 'none'; });
        gsap.fromTo(lines,
          { opacity: 0, y: -44, rotateX: 74, transformPerspective: 900, transformOrigin: 'top center' },
          { opacity: 1, y: 0, rotateX: 0, duration: .95, stagger: .13, delay: .5, ease: 'back.out(1.5)',
            onComplete: function () {
              lines.forEach(function (l) { l.style.transition = ''; gsap.set(l, { clearProps: 'transform' }); });
            } });
      }
    });

    if (!live) {
      /* nothing to animate it: the slats would sit on top of the photograph */
      if (shutter) shutter.style.display = 'none';
      return;
    }
    if (shot) gsap.fromTo(shot, { yPercent: -5, scale: 1.1 }, { yPercent: 5, scale: 1.02, ease: 'none',
      scrollTrigger: { trigger: '#ctHero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* =====================================================================
     S3 · LADDER — every rung climbs in on its own scrub rate
     ===================================================================== */
  function ladder() {
    var steps = $('#ctSteps');
    if (!steps || !live) return;
    var spine = $('#ctSpine');
    if (spine) gsap.fromTo(spine, { scaleY: 0 }, { scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: steps, start: 'top 78%', end: 'bottom 62%', scrub: true } });
    var narrow = window.innerWidth <= 760;
    $$('.ct-step', steps).forEach(function (st, i) {
      var trigger = { trigger: st, start: 'top 98%', end: 'top 44%', scrub: .5,
        onLeave: function () { gsap.set(st, { clearProps: 'transform,opacity' }); } };
      if (narrow) {
        gsap.fromTo(st, { y: 40, opacity: .35 }, { y: 0, opacity: 1, ease: 'none', scrollTrigger: trigger });
      } else {
        gsap.fromTo(st, { y: 96, xPercent: -3 - i * .5, rotation: -1.2, opacity: .25 },
          { y: 0, xPercent: 0, rotation: 0, opacity: 1, ease: 'none', scrollTrigger: trigger });
      }
    });
  }

  /* =====================================================================
     S4 · THE TRANSMISSION — validation, signal meter, receipt
     ===================================================================== */
  function workOrder() {
    var form = $('#ctFormBox'), card = $('#ctOrder'), receipt = $('#ctReceipt');
    if (!form) return;

    var ok = $('#ctOk'), msg = $('#ctMsg'), count = $('#ctCountNow');
    var serial = $('#ctSerial'), stamp = $('#ctStamp');
    var bars = $$('.ct-signal__bars i'), pctOut = $('#ctSigPct'), sigNote = $('#ctSigNote');

    var fields = {
      name:    { wrap: $('.ct-f[data-f="name"]'),    input: $('#ctName'),    err: $('#ctNameErr') },
      email:   { wrap: $('.ct-f[data-f="email"]'),   input: $('#ctEmail'),   err: $('#ctEmailErr') },
      phone:   { wrap: $('.ct-f[data-f="phone"]'),   input: $('#ctPhone'),   err: $('#ctPhoneErr') },
      order:   { wrap: $('.ct-f[data-f="order"]'),   input: $('#ctOrderNo'), err: $('#ctOrderErr') },
      topic:   { wrap: $('.ct-f[data-f="topic"]'),   input: null,            err: $('#ctTopicErr') },
      message: { wrap: $('.ct-f[data-f="message"]'), input: $('#ctMsg'),     err: $('#ctMsgErr') },
      consent: { wrap: $('.ct-f[data-f="consent"]'), input: ok,              err: $('#ctOkErr') }
    };

    var TOPICS = {
      order:   { label: 'The counter · sales & orders', mail: 'info@stackly.com' },
      repair:  { label: 'The repair bench',             mail: 'info@stackly.com' },
      trade:   { label: 'The lab · wholesale',          mail: 'info@stackly.com' },
      press:   { label: 'The front desk · press',       mail: 'info@stackly.com' },
      other:   { label: 'The desk · general',           mail: 'info@stackly.com' }
    };

    var RULES = {
      name: function (v) {
        v = v.trim();
        if (!v) return 'Even a first name is enough.';
        return /^[A-Za-z][A-Za-z .'-]*$/.test(v) || 'Letters only, no numbers or symbols.';
      },
      email: function (v) {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v.trim()) || 'That address will not reach you — check it.';
      },
      phone: function (v) {
        v = v.trim();
        if (!v) return true;
        return (v.replace(/[^0-9]/g, '').length >= 7 && v.length <= 24) || 'Seven digits or more, letters will not dial.';
      },
      order: function (v) {
        v = v.trim();
        if (!v) return true;
        return /^[A-Za-z]{2,4}-?[A-Za-z0-9]{3,10}$/.test(v) || 'Order numbers look like STK-48210.';
      },
      topic: function () {
        return topic() !== '' || 'Pick the bench that should read this.';
      },
      message: function (v) {
        v = v.trim();
        if (!v) return 'Say something — the more detail the faster.';
        if (v.length < 20) return (20 - v.length) + ' more characters, then we can help.';
        if (v.length > 600) return 'That is past the 600 character limit.';
        return true;
      },
      consent: function () {
        return ok.checked || 'Tick the box so we are allowed to write back.';
      }
    };

    var WEIGHT = { name: 20, email: 20, topic: 20, message: 30, consent: 10 };
    var seen = {};
    var reference = 'CT-' + String(Math.floor(100000 + Math.random() * 899999));

    function topic() {
      var hit = form.querySelector('input[name="topic"]:checked');
      return hit ? hit.value : '';
    }
    function value(key) {
      if (key === 'topic') return topic();
      var f = fields[key];
      return f.input ? String(f.input.value) : '';
    }
    function check(key) { return RULES[key](value(key)); }

    function paint(key, result) {
      var f = fields[key];
      if (!f || !f.wrap) return true;
      var pass = result === true;
      f.wrap.classList.toggle('is-bad', !pass);
      f.wrap.classList.toggle('is-ok', pass);
      if (f.err) f.err.textContent = pass ? '' : result;
      if (f.input && f.input.type !== 'checkbox' && f.input.type !== 'radio') {
        f.input.setAttribute('aria-invalid', pass ? 'false' : 'true');
      }
      return pass;
    }

    function nudge(el, cls) {
      if (!el) return;
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
      setTimeout(function () { el.classList.remove(cls); }, 520);
    }

    function focusField(key) {
      var f = fields[key];
      if (!f || !f.wrap) return;
      centerOn(f.wrap);
      var el = f.input || f.wrap.querySelector('input,button');
      if (el) setTimeout(function () { el.focus({ preventScroll: true }); }, REDUCED ? 0 : 420);
    }

    var NOTES = [
      [0,  'Nothing filled in yet'],
      [20, 'A line, not a conversation'],
      [45, 'Half a signal'],
      [70, 'Loud enough for the bench'],
      [100, 'Full signal — hit send']
    ];

    function signal() {
      var pct = 0;
      Object.keys(WEIGHT).forEach(function (k) { if (check(k) === true) pct += WEIGHT[k]; });
      pct = clamp(pct, 0, 100);
      if (bars) bars.forEach(function (b, i) { b.classList.toggle('on', i < Math.round(pct / 20)); });
      if (pctOut) pctOut.textContent = pct;
      if (sigNote) {
        var note = NOTES[0][1];
        for (var i = 0; i < NOTES.length; i++) if (pct >= NOTES[i][0]) note = NOTES[i][1];
        if (sigNote.textContent !== note) sigNote.textContent = note;
        sigNote.setAttribute('aria-live', 'polite');
      }
      if (card) card.classList.toggle('is-filled', pct === 100);
      if (stamp && pct === 100) stamp.innerHTML = '<i class="fa-solid fa-circle-check"></i> Ready';
      else if (stamp && stamp.getAttribute('data-state') !== 'sent') stamp.innerHTML = '<i class="fa-solid fa-feather-pointed"></i> Draft';
      return pct;
    }

    /* live re-check: quiet until a field has actually complained once */
    Object.keys(fields).forEach(function (key) {
      var el = fields[key].input;
      if (!el) return;
      var eager = (key === 'name' || key === 'email');
      var recheck = function () {
        signal();
        if (!eager) { if (seen[key]) paint(key, check(key)); return; }
        if (String(el.value).trim() === '') {
          fields[key].wrap.classList.remove('is-bad', 'is-ok');
          if (fields[key].err) fields[key].err.textContent = '';
          return;
        }
        paint(key, check(key));
      };
      el.addEventListener('input', recheck);
      el.addEventListener('change', recheck);
      el.addEventListener('blur', function () { if (el.value.trim() !== '' && seen[key]) paint(key, check(key)); });
    });
    form.addEventListener('change', signal);

    if (msg) {
      msg.maxLength = 600;
      var tally = function () { if (count) count.textContent = msg.value.length; };
      msg.addEventListener('input', tally);
      tally();
    }

    /* the topic doors: pick a bench, land on the form with it set */
    function route(topicKey, sender) {
      var radio = form.querySelector('input[name="topic"][value="' + topicKey + '"]');
      if (!radio) return;
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      var pick = radio.parentElement;
      if (pick && live) gsap.fromTo(pick, { scale: .93 }, { scale: 1, duration: .55, ease: 'back.out(2)' });
      if (sender) {
        sender.classList.add('is-hit');
        setTimeout(function () { sender.classList.remove('is-hit'); }, 1300);
      }
      centerOn(card || form);
      setTimeout(function () { if (fields.name.input) fields.name.input.focus({ preventScroll: true }); }, REDUCED ? 0 : 900);
      signal();
    }

    $$('[data-topic]').forEach(function (btn) {
      var key = btn.getAttribute('data-topic');
      if (!TOPICS[key]) return;
      var direct = btn.getAttribute('data-href');
      if (direct) btn.title = 'Opens the form with this topic set — Ctrl/⌘-click to go straight to ' + direct;
      btn.addEventListener('click', function (e) {
        if (direct && (e.ctrlKey || e.metaKey)) { window.location.href = direct; return; }
        e.preventDefault();
        route(key, btn);
      });
    });

    /* ---- send ---- */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = [];
      Object.keys(RULES).forEach(function (key) {
        var result = check(key);
        if (!paint(key, result)) { seen[key] = true; bad.push(key); }
        else seen[key] = false;
      });
      signal();
      if (bad.length) {
        nudge(fields[bad[0]].wrap, 'is-nudge');
        nudge(card, 'is-shake');
        focusField(bad[0]);
        return;
      }

      window.location.href = '404.html';
    });

    var again = $('#ctAgain');
    if (again) again.addEventListener('click', function () {
      form.reset();
      seen = {};
      Object.keys(fields).forEach(function (key) {
        fields[key].wrap.classList.remove('is-bad', 'is-ok');
        if (fields[key].err) fields[key].err.textContent = '';
      });
      if (stamp) { stamp.removeAttribute('data-state'); stamp.innerHTML = '<i class="fa-solid fa-feather-pointed"></i> Draft'; }
      if (count) count.textContent = '0';
      if (receipt) receipt.hidden = true;
      form.hidden = false;
      signal();
      centerOn(card || form);
      setTimeout(function () { if (fields.name.input) fields.name.input.focus({ preventScroll: true }); }, REDUCED ? 0 : 420);
    });

    /* ---- is anybody on the desk right now ---- */
    function deskWait() {
      var now = new Date(), mins = now.getHours() * 60 + now.getMinutes();
      var shift = { 1: [540, 1140], 2: [540, 1140], 3: [540, 1140], 4: [540, 1260], 5: [540, 1140], 6: [600, 1020], 0: [720, 960] }[now.getDay()];
      return !!shift && mins >= shift[0] && mins < shift[1];
    }

    if (serial) serial.textContent = reference;
    signal();
  }

  /* =====================================================================
     S5 · FIND US — the frame draws its own four edges, the pin drops in
     ===================================================================== */
  function map() {
    var frame = $('#ctMapFrame');
    if (!frame) return;
    var edges = $$('.ct-map__edge i', frame);
    if (live) {
      ST.create({ trigger: frame, start: 'top 82%', once: true, onEnter: function () {
        var tl = gsap.timeline();
        tl.fromTo(edges[0], { scaleX: 0 }, { scaleX: 1, duration: .55, ease: 'power3.inOut' })
          .fromTo(edges[1], { scaleY: 0 }, { scaleY: 1, duration: .55, ease: 'power3.inOut' }, '-=.38')
          .fromTo(edges[3], { scaleY: 0 }, { scaleY: 1, duration: .55, ease: 'power3.inOut' }, '-=.38')
          .fromTo(edges[2], { scaleX: 0 }, { scaleX: 1, duration: .55, ease: 'power3.inOut' }, '-=.38');
      } });
    } else {
      edges.forEach(function (e) { e.style.transform = 'none'; });
    }
  }

  /* =====================================================================
     S6 · A NOTE FROM THE BENCH — the portrait's corner peels back
     ===================================================================== */
  function note() {
    var sheet = $('#ctSheetNote'), sec = $('#ctNote');
    if (!sheet || !live) return;
    var corner = $('.ct-note__corner', sheet), back = $('.ct-note__back', sheet), front = $('.ct-note__front', sheet);
    gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 80%', end: 'bottom 66%', scrub: .6 } })
      .fromTo(corner, { scale: 0 }, { scale: 1, ease: 'power1.inOut' }, 0)
      .fromTo(back, { opacity: 0 }, { opacity: 1, ease: 'none' }, 0);

    if (!FINE) return;
    gsap.set(front, { transformPerspective: 900 });
    var rx = gsap.quickTo(front, 'rotationY', { duration: .6, ease: 'power3.out' });
    var ry = gsap.quickTo(front, 'rotationX', { duration: .6, ease: 'power3.out' });
    var level = function () { rx(0); ry(0); };
    sec.addEventListener('mousemove', function (e) {
      var r = sheet.getBoundingClientRect();
      rx((((e.clientX - r.left) / r.width - .5) * 2 * 7).toFixed(2));
      ry(((-((e.clientY - r.top) / r.height - .5) * 2 * 6)).toFixed(2));
    });
    sec.addEventListener('mouseleave', level);
  }

  /* =====================================================================
     S7 · DESK SHIFT — rows land with a stamp thump, today runs live
     ===================================================================== */
  function hours() {
    var tape = $('#ctTape');
    if (!tape) return;
    var rows = $$('.ct-day', tape);
    var SHIFT = { 1: [540, 1140], 2: [540, 1140], 3: [540, 1140], 4: [540, 1260], 5: [540, 1140], 6: [600, 1020], 0: [720, 960] };
    var BENCH = 13 * 60;

    rows.forEach(function (row) {
      var s = SHIFT[row.getAttribute('data-day')] || SHIFT[1];
      row.style.setProperty('--w', Math.round(clamp((s[1] - s[0]) / BENCH, 0, 1) * 100) + '%');
    });

    if (live) {
      ST.create({ trigger: tape, start: 'top 80%', once: true, onEnter: function () {
        rows.forEach(function (row, i) {
          setTimeout(function () {
            row.classList.add('is-in');
            var tag = $('.ct-day__st', row);
            if (tag) gsap.fromTo(tag, { scale: .68, rotation: -6 }, { scale: 1, rotation: 0, duration: .6, ease: 'back.out(2.4)' });
          }, i * 105);
        });
      } });
    } else rows.forEach(function (row) { row.classList.add('is-in'); });

    function paintToday() {
      var today = new Date().getDay();
      var row = $('.ct-day[data-day="' + today + '"]', tape);
      if (!row) return;
      row.classList.add('is-today');
      var s = SHIFT[today] || SHIFT[1];
      var now = new Date(), mins = now.getHours() * 60 + now.getMinutes();
      var openNow = mins >= s[0] && mins < s[1];
      var chip = $('.ct-day__now', row);
      if (chip) chip.innerHTML = '<i class="fa-solid fa-' + (openNow ? 'circle' : 'moon') + '"></i>'
        + (openNow ? 'Open now' : 'Closed now');
      row.style.setProperty('--now', (openNow ? Math.round(clamp((mins - s[0]) / (s[1] - s[0]), 0, 1) * 100) : 0) + '%');
    }
    paintToday();
    setInterval(paintToday, 60000);
  }

  /* =====================================================================
     S8 · BEFORE YOU WRITE — the frame changes at the reading line
     ===================================================================== */
  function before() {
    var list = $('#ctPreList'), framesBox = $('#ctFrames');
    if (!list || !framesBox) return;
    var items = $$('.ct-pre__item', list), frames = $$('.ct-pre__frame', framesBox);
    var tape = $('#ctPreTape');
    var cur = -1;

    function setActive(i) {
      if (i === cur) return;
      cur = i;
      items.forEach(function (it, k) { it.classList.toggle('is-on', k === i); });
      frames.forEach(function (f, k) { f.classList.toggle('is-on', k === i); });
    }

    if (!live) { setActive(0); return; }
    items.forEach(function (it, i) {
      ST.create({ trigger: it, start: 'top 64%', end: 'bottom 64%',
        onToggle: function (self) { if (self.isActive) setActive(i); } });
    });
    if (tape) gsap.fromTo(tape, { scaleX: 0 }, { scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: list, start: 'top 72%', end: 'bottom 72%', scrub: true } });
    if (FINE) items.forEach(function (it, i) { it.addEventListener('mouseenter', function () { setActive(i); }); });
  }

  /* =====================================================================
     S9 · CONTACT SHEET — twelve frames thrown loose, squared by the scroll
     ===================================================================== */
  function sheet() {
    var cells = $$('.ct-cell');
    if (!cells.length || !live) return;
    cells.forEach(function (cell, i) {
      var dir = i % 2 ? 1 : -1;
      var band = Math.floor(i / 4);
      gsap.fromTo(cell,
        { x: dir * (34 + (i % 3) * 28), y: 64 + band * 18, rotation: dir * (3 + (i % 4)), opacity: .16, scale: .9 },
        { x: 0, y: 0, rotation: 0, opacity: 1, scale: 1, ease: 'none',
          scrollTrigger: { trigger: cell, start: 'top 112%', end: 'top 54%', scrub: .6,
            onLeave: function () { gsap.set(cell, { clearProps: 'transform,opacity' }); } } });
    });
  }

  /* =====================================================================
     S10 · FREQUENTLY WIRED — the plug-in list
     ===================================================================== */
  function faq() {
    var plug = $('#ctPlug');
    if (!plug) return;
    var rows = $$('.ct-q', plug);
    var headOf = function (q) { return $('.ct-q__head', q); };

    function close(q) {
      if (!q) return;
      q.classList.remove('is-open');
      var h = headOf(q);
      if (h) h.setAttribute('aria-expanded', 'false');
    }
    function open(q) {
      q.classList.add('is-open');
      var h = headOf(q);
      if (h) h.setAttribute('aria-expanded', 'true');
    }

    rows.forEach(function (q) {
      var h = headOf(q);
      if (!h) return;
      h.addEventListener('click', function () {
        if (q.classList.contains('is-open')) { close(q); return; }
        rows.forEach(close);
        open(q);
      });
    });

    plug.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var was = $('.ct-q.is-open', plug);
      rows.forEach(close);
      if (was) { var h = headOf(was); if (h) h.focus(); }
    });

    if (rows[0]) open(rows[0]);
  }

  /* =====================================================================
     S11 · THE LAST WORD — four photographs drift at four rates
     ===================================================================== */
  function outro() {
    var sec = $('#ctOutro');
    if (!sec || !live) return;
    $$('.ct-outro__img', sec).forEach(function (el, i) {
      var k = i % 2 ? -1 : 1;
      gsap.fromTo(el, { y: 56 * k, x: 26 * (i - 1.5), scale: .96 },
        { y: -66 * k, x: -26 * (i - 1.5), scale: 1.04, ease: 'none',
          scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  function boot() {
    reveals(); hero(); ladder(); workOrder(); map(); note(); hours(); before(); sheet(); faq(); outro();
    window.addEventListener('load', function () { if (ST) setTimeout(function () { ST.refresh(); }, 300); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

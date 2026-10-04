/* =====================================================================
   STACKLY · SERVICE PAGE RUNTIME
   ---------------------------------------------------------------------
   Runs on top of the shared runtime home.js already installed:

     window.gsap / window.ScrollTrigger  inlined by home.js
     window.StacklySmooth                Lenis, on the GSAP ticker
     window.StacklyMotion                home/shop reveal + AOS engine
     window.AOS                          data-aos attribute API

   Nothing here loads a second GSAP: duplicate instances break
   ScrollTrigger. home.js has already wired Lenis -> ScrollTrigger.update(),
   so the pinned bench scrubs against the same clock as the rest of the page.

   This file owns:
     · the data-sv-r reveal primitives (a separate set from the shop's
       data-sp-r, so the two pages can never share a motion signature)
     · the ten sections' own interactions
   ===================================================================== */
(function () {
  'use strict';

  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ===================================================================
     0 · REVEALS
     data-sv-r="tag|typeup|strip|plate|railin|cardin|stepin|tile|pop|page|printin"
     service.css holds the hidden state and the transition; this only
     releases it. Every element is released no matter what, so a failed
     ScrollTrigger can never leave a section invisible.

     data-sv-d is an optional explicit delay in milliseconds. Without it,
     siblings that share a parent are staggered by position so a grid
     arrives as a grid, capped so a long list cannot push its last card
     past a second.
     =================================================================== */
  function reveals() {
    var els = $$('[data-sv-r]');
    if (!els.length) return;

    var show = function (el) { el.classList.add('sv-in'); };

    if (REDUCED || !gsap || !ST) {
      els.forEach(show);
      return;
    }

    els.forEach(function (el) {
      var explicit = el.getAttribute('data-sv-d');
      var delay;
      if (explicit !== null) {
        delay = parseInt(explicit, 10) || 0;
      } else {
        var sibs = el.parentNode ? $$('[data-sv-r]', el.parentNode) : [];
        delay = sibs.length > 1 ? Math.min(sibs.indexOf(el), 7) * 55 : 0;
      }

      ST.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: function () {
          gsap.delayedCall(delay / 1000, function () { show(el); });
        }
      });
    });

    /* anything already on screen at boot reveals immediately */
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) show(el);
    });
  }

  /* MARKED: elements whose inner clip-path is driven by a class rather
     than by the reveal transition */
  var MARKS = '.sv-tile, .sv-qa';

  function marks() {
    var els = $$(MARKS);
    if (!els.length) return;
    if (REDUCED || !ST) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    els.forEach(function (el) {
      ST.create({ trigger: el, start: 'top 86%', once: true, onEnter: function () { el.classList.add('is-in'); } });
    });
  }

  /* ---------------------------------------------------------------------
     The safety net, NOT the normal path. A broken or missing ScrollTrigger
     must never strand a section at opacity 0, so one pass after load
     releases anything still hidden that is already on screen. Calling this
     at boot instead would quietly disable every reveal on the page.
     --------------------------------------------------------------------- */
  function safetyNet() {
    var pass = function () {
      var h = window.innerHeight;
      $$('[data-sv-r]').forEach(function (el) {
        if (el.classList.contains('sv-in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < h && r.bottom > 0) el.classList.add('sv-in');
      });
      $$(MARKS).forEach(function (el) {
        if (el.classList.contains('is-in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < h && r.bottom > 0) el.classList.add('is-in');
      });
    };
    if (document.readyState === 'complete') setTimeout(pass, 1200);
    else window.addEventListener('load', function () { setTimeout(pass, 1200); });
  }

  /* ===================================================================
     1 · THE APERTURE
     The headline does not use the masked roll or the split-line wipe from
     home/shop: every word is thrown in from its own angle, then the
     second line resolves out of a scramble.
     =================================================================== */
  var GLYPHS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789#$%&';

  function scramble(el, out) {
    if (REDUCED) { el.textContent = out; return; }
    var n = 0, step = Math.max(2, Math.round(out.length / 14));
    var iv = setInterval(function () {
      var keep = Math.floor((n / step) * out.length);
      var txt = '';
      for (var i = 0; i < out.length; i++) {
        txt += i < keep
          ? out[i]
          : (out[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
      }
      el.textContent = txt;
      if (++n >= step * 2 + 3) { clearInterval(iv); el.textContent = out; }
    }, 34);
  }

  function aperture() {
    var lines = $$('[data-sv-words]');
    if (!lines.length) return;

    lines.forEach(function (line, li) {
      var words = (line.textContent || '').trim().split(/\s+/);
      line.textContent = '';
      words.forEach(function (w, wi) {
        var s = document.createElement('span');
        s.className = 'sv-word' + (li === 1 && wi === words.length - 1 ? ' sv-word--sig' : '');
        s.textContent = w;
        line.appendChild(s);
        if (wi < words.length - 1) line.appendChild(document.createTextNode(' '));
      });
    });

    if (REDUCED || !gsap) {
      lines.forEach(function (l) { scramble(l, l.textContent); });
      return;
    }

    gsap.set(lines, { opacity: 1 });

    var all = $$('.sv-word', $('#svHeadline'));
    gsap.from(all, {
      opacity: 0,
      y: function (i) { return 40 + (i % 3) * 22; },
      x: function (i) { return (i % 2 ? 1 : -1) * (18 + (i % 4) * 14); },
      rotate: function (i) { return (i % 2 ? 1 : -1) * (4 + (i % 3) * 3); },
      scale: .82,
      duration: .9,
      ease: 'expo.out',
      stagger: { each: .07, from: 'start' },
      onComplete: function () {
        /* the accent word resolves out of a scramble once the scatter lands */
        var sig = $('.sv-word--sig');
        if (sig) scramble(sig, sig.textContent);
      }
    });

    /* the plate counter-drifts against the pointer, then follows scroll */
    var bay = $('.sv-aperture__bay');
    var img = $('.sv-plate__img');
    if (bay && img && FINE && !REDUCED) {
      var qx = gsap.quickTo(img, 'xPercent', { duration: .8, ease: 'expo.out' });
      var qy = gsap.quickTo(img, 'yPercent', { duration: .8, ease: 'expo.out' });
      bay.addEventListener('mousemove', function (e) {
        var r = bay.getBoundingClientRect();
        qx(((e.clientX - r.left) / r.width - .5) * -7);
        qy(((e.clientY - r.top) / r.height - .5) * -5);
      });
      bay.addEventListener('mouseleave', function () { qx(0); qy(0); });
    }

    if (gsap && ST) {
      gsap.to(img, {
        yPercent: 12, ease: 'none',
        scrollTrigger: { trigger: '#svAperture', start: 'top top', end: 'bottom top', scrub: 1 }
      });
    }
  }

  /* ===================================================================
     2 · THE INTAKE
     A real tablist. The photo cross-fades and the badge reports the
     turnaround the rail promised.
     =================================================================== */
  function intake() {
    var slots = $$('.sv-slot');
    var shot = $('#svShot');
    if (!slots.length || !shot) return;

    var imgs = $$('img', shot);
    var badge = $('#svShotBadge');

    var apply = function (i, focus) {
      var slot = slots[i];
      if (!slot) return;
      slots.forEach(function (s, n) {
        s.classList.toggle('is-on', n === i);
        s.setAttribute('aria-selected', n === i ? 'true' : 'false');
      });
      slot.setAttribute('tabindex', '0');
      slots.forEach(function (s, n) { if (n !== i) s.setAttribute('tabindex', '-1'); });
      if (focus) slot.focus();

      var turn = $('i', slot);
      if (badge && turn) badge.textContent = turn.textContent;

      imgs.forEach(function (img, n) {
        var on = n === i;
        if (on) {
          img.hidden = false;
          if (gsap && !REDUCED) {
            gsap.fromTo(img,
              { opacity: 0, scale: 1.07, x: n > 0 ? 18 : -18 },
              { opacity: 1, scale: 1, x: 0, duration: .62, ease: 'expo.out', overwrite: true });
          }
        } else if (!img.hidden) {
          if (gsap && !REDUCED) {
            gsap.to(img, {
              opacity: 0, duration: .24, ease: 'power2.in', overwrite: true,
              onComplete: function () { img.hidden = true; gsap.set(img, { clearProps: 'opacity,scale,x' }); }
            });
          } else {
            img.hidden = true;
          }
        }
      });
    };

    slots.forEach(function (s, i) {
      s.addEventListener('click', function () { apply(i, false); });
      s.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
          : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        apply((i + d + slots.length) % slots.length, true);
      });
    });

    /* the booking form: hold a bay, or mark every field that stopped it */
    var form = $('#svBook');
    if (form) {
      var msg = $('#svBookMsg');
      var EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      var rules = [
        { el: $('#svWhat'),  err: $('#svWhatErr'),  msg: 'Tell us what broke.',             ok: function (v) { return v.trim().length > 0; } },
        { el: $('#svModel'), err: $('#svModelErr'), msg: 'Add the model so we can prep it.', ok: function (v) { return v.trim().length > 0; } },
        { el: $('#svWhen'),  err: $('#svWhenErr'),  msg: 'Pick a day that suits you.',       ok: function (v) { return v.trim().length > 0; } },
        { el: $('#svEmail'), err: $('#svEmailErr'), msg: 'Enter a valid email address.',     ok: function (v) { return EMAIL.test(v.trim()); } }
      ];
      rules.forEach(function (r) {
        if (!r.el) return;
        var clear = function () { r.el.classList.remove('is-bad'); if (r.err) r.err.textContent = ''; };
        r.el.addEventListener('input', clear);
        r.el.addEventListener('change', clear);
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        rules.forEach(function (r) {
          if (!r.el) return;
          var good = r.ok(r.el.value);
          r.el.classList.toggle('is-bad', !good);
          if (r.err) r.err.textContent = good ? '' : r.msg;
          if (!good) ok = false;
        });
        if (!msg) return;
        if (!ok) {
          msg.textContent = 'Check the highlighted fields.';
          msg.classList.remove('is-ok');
          return;
        }
        window.location.href = '404.html';
      });
    }
  }

  /* ===================================================================
     3 · THE LONG BENCH
     The section pins and the stations travel sideways under the scrub.
     Below 981px this is not built at all: the rail becomes a native
     horizontal scroller instead, because pinning inside a touch scroll
     fights the finger.
     =================================================================== */
  function bench() {
    var rail = $('#svRail');
    var track = $('#svRailTrack');
    var meter = $('#svRailMeter');
    if (!rail || !track || !gsap || !ST || REDUCED) return;

    var mm = gsap.matchMedia();

    mm.add('(min-width: 981px)', function () {
      var travel = function () { return Math.max(240, track.scrollWidth - rail.clientWidth + 40); };

      gsap.to(track, {
        x: function () { return -travel(); },
        ease: 'none',
        scrollTrigger: {
          trigger: '#svBench',
          start: 'top top',
          end: function () { return '+=' + travel(); },
          scrub: .8,
          pin: '#svBenchPin',
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      if (meter) {
        gsap.fromTo(meter, { scaleX: 0 }, {
          scaleX: 1, ease: 'none', transformOrigin: '0 50%',
          scrollTrigger: {
            trigger: '#svBench', start: 'top top',
            end: function () { return '+=' + travel(); },
            scrub: .8, invalidateOnRefresh: true
          }
        });
      }
    });
  }

  /* ===================================================================
     4 · THE LEDGER
     Hover or focus a row and the sticky panel takes that claim. Touch has
     no hover, so the rows also respond to tap and to Enter/Space.
     =================================================================== */
  var LEDGER = [
    { id: '#4821', title: 'Screen & glass', note: 'Display separated, adhesive cut, new OCA layer being vacuum pressed. Reads back within the hour.', img: '../images/service-repair.webp', alt: 'A phone open on the repair bench with its display lifted away from the body' },
    { id: '#4822', title: 'Battery & charge', note: 'Cell pulled off the shelf, health report printing. Refit and re-seal as soon as the report lands.', img: '../images/service-delivery.webp', alt: 'A replacement battery being seated into a phone body' },
    { id: '#4823', title: 'Water & corrosion', note: 'Ultrasonic bath running, then a corrosion check under magnification before any power is offered.', img: '../images/support.webp', alt: 'A technician inspecting a water damaged logic board' },
    { id: '#4824', title: 'Diagnostics', note: 'No fault found. Full report emailed with the readings, and a return label on the way.', img: '../images/service-authenticity.webp', alt: 'Diagnostic software reading a logic board' },
    { id: '#4825', title: 'Port & flex', note: 'Flex torn at the connector. Reballing booked the moment the donor arrives from the shelf.', img: '../images/product-detail.webp', alt: 'A port and flex board photographed for the repair record' }
  ];

  function ledger() {
    var rows = $$('[data-sv-row]');
    var img = $('#svLedgerImg');
    if (!rows.length || !img) return;

    var idEl = $('#svLedgerId'), titleEl = $('#svLedgerTitle'), noteEl = $('#svLedgerNote');
    var current = -1;

    var apply = function (i) {
      if (i === current || !LEDGER[i]) return;
      current = i;
      var d = LEDGER[i];
      rows.forEach(function (r, n) { r.classList.toggle('is-on', n === i); });
      if (idEl) idEl.textContent = d.id;
      if (titleEl) titleEl.textContent = d.title;
      if (noteEl) noteEl.textContent = d.note;
      if (img.getAttribute('src') === d.img) return;
      if (gsap && !REDUCED) {
        gsap.to(img, {
          opacity: 0, scale: 1.06, duration: .2, ease: 'power2.in', overwrite: true,
          onComplete: function () {
            img.setAttribute('src', d.img);
            img.setAttribute('alt', d.alt);
            img.setAttribute('width', '720');
            img.setAttribute('height', '520');
            gsap.fromTo(img, { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: .5, ease: 'expo.out' });
          }
        });
      } else {
        img.setAttribute('src', d.img);
        img.setAttribute('alt', d.alt);
      }
    };

    rows.forEach(function (r, i) {
      r.addEventListener('mouseenter', function () { apply(i); });
      r.addEventListener('focus', function () { apply(i); });
      r.addEventListener('click', function () { apply(i); });
      r.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        apply(i);
      });
    });

    apply(0);
  }

  /* ===================================================================
     5 · THE LOGBOOK
     One number does the whole section. All six leaves are hinged on the
     same edge in service.css, and CSS reads --sv-turn as a number between
     0 and 5 — the leaf at the front — so this only ever writes that one
     value and cannot collide with the [data-sv-r="page"] entry, the stamp
     on :hover, or the lift on :focus.

     Two things have to be a class instead of a calculation, because CSS
     cannot branch on a number: which leaf is open (it has to paint over
     the leaves still waiting under it) and which one is mid-turn (a
     turning page has to paint over the pile it is falling onto). Both
     classes land on the slot, not the leaf — the slot is what carries
     z-order, because its own [data-sv-r="page"] transform would otherwise
     make the leaf's z-index local to it.

     The spine buttons are the section's one real control. While the book
     is pinned a leaf's own offset is meaningless — it does not move on the
     page — so the target is read off the trigger's own range instead.
     Below 981px, and with motion off, there is no pin and no scrub: the
     leaves lie flat as a grid of six sheets and the buttons scroll to them.
     =================================================================== */
  function logbook() {
    var sec = $('#svLog');
    var body = $('#svLogBody');
    var book = $('#svLogBook');
    if (!sec || !body || !book) return;

    var slots = $$('.sv-lg__slot', book);
    if (!slots.length) return;

    var rows = $$('.sv-lg__row');
    var count = $('#svLogCount');
    var turned = $('#svLogTurned');
    var last = slots.length - 1;
    var pinned = null;
    var front = -1;
    var turning = -1;

    var pad = function (n) { return String(n).padStart(2, '0'); };

    /* stamping is a control, not decoration, so it is bound before the
       motion branch and works with the scrub switched off */
    $$('.sv-lg__face', book).forEach(function (face) {
      face.addEventListener('click', function () {
        var on = face.classList.toggle('is-stamped');
        face.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    });

    var paint = function (v) {
      var f = clamp(Math.round(v), 0, last);
      if (f !== front) {
        front = f;
        slots.forEach(function (slot, i) { slot.classList.toggle('is-front', i === f); });
        rows.forEach(function (row, i) { row.setAttribute('aria-current', i === f ? 'true' : 'false'); });
        if (count) count.textContent = pad(f + 1);
        if (turned) turned.textContent = f + ' of ' + slots.length + ' turned';
      }
      /* the leaf whose own share of the turn is strictly between 0 and 1:
         the one that is off the hinge and not yet down */
      var t = (v > .02 && v < last - .02) ? Math.ceil(v) - 1 : -1;
      if (t !== turning) {
        turning = t;
        slots.forEach(function (slot, i) { slot.classList.toggle('is-turning', i === t); });
      }
    };

    var write = function (v) {
      body.style.setProperty('--sv-turn', (Math.round(v * 1000) / 1000).toFixed(3));
      paint(v);
    };

    var scrollTo = function (y) {
      var done = window.StacklySmooth && window.StacklySmooth.to
        ? window.StacklySmooth.to(y, { duration: .9 })
        : false;
      if (!done) window.scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' });
    };

    rows.forEach(function (row, i) {
      row.addEventListener('click', function () {
        if (pinned) {
          /* the pinned range runs leaf 0 to leaf 5, one leaf per equal
             slice of it, because the scrub is linear */
          scrollTo(pinned.start + (last ? i / last : 0) * (pinned.end - pinned.start));
          return;
        }
        var r = slots[i].getBoundingClientRect();
        var y = (window.pageYOffset || document.documentElement.scrollTop) + r.top
              - Math.max(0, (window.innerHeight - r.height) / 2);
        scrollTo(y);
      });
    });

    if (!gsap || !ST || REDUCED) {
      write(last);
      return;
    }

    var state = { v: 0 };
    var mm = gsap.matchMedia();

    mm.add({
      flip: '(min-width: 981px) and (prefers-reduced-motion: no-preference)',
      flat: '(max-width: 980px), (prefers-reduced-motion: reduce)'
    }, function (ctx) {
      /* flat: nothing to scrub. The six sheets are all on screen and all
         readable, so the book is simply read to the end. */
      if (!ctx.conditions.flip) {
        write(last);
        return;
      }

      /* fresh in at the first sheet: the tween keeps whatever v the flat
         branch left behind, and the scrub would spend a second dragging
         the book back from the end before the reader touched it */
      state.v = 0;
      var run = function () { return Math.round(window.innerHeight * .66 * last); };
      var tw = gsap.to(state, {
        v: last, ease: 'none',
        scrollTrigger: {
          trigger: sec,
          start: 'top top',
          end: function () { return '+=' + run(); },
          pin: '#svLogPin',
          anticipatePin: 1,
          scrub: .55,
          invalidateOnRefresh: true,
          onUpdate: function () { write(state.v); },
          onRefresh: function () { write(state.v); }
        }
      });
      pinned = tw.scrollTrigger;
      write(0);

      return function () { pinned = null; };
    });
  }

  /* ===================================================================
     6 · THE SHELF
     The tiles are ordinary links to the shop: no state to keep, no panel
     to refresh. All the behaviour is in service.css — the caption rides
     up on hover or focus, and marks() releases each photo as it arrives.
     =================================================================== */

  /* ===================================================================
     7 · THE ORBIT
     The ring is laid out in CSS from --x / --y offsets on each node, so
     the only thing scroll has to move is --sv-spin. The active node is
     then found by MEASURING which one is lowest on the page: that is the
     front of the ring, and it means the same six lines work at any radius,
     any viewport and any number of nodes without repeating the geometry.
     =================================================================== */
  function orbit() {
    var stage = $('#svOrbitStage');
    var ring = $('#svOrbitRing');
    if (!stage || !ring) return;

    var nodes = $$('.sv-orb', ring);
    if (!nodes.length) return;

    var hub = $('#svOrbitHub');
    var kicker = $('#svOrbitKicker');
    var title = $('#svOrbitTitle');
    var note = $('#svOrbitNote');
    var price = $('#svOrbitPrice');
    var hint = $('#svOrbitHintText');

    var front = -1;   /* the node scroll has brought to the front */
    var hot = -1;     /* pointer or keyboard */
    var held = -1;    /* clicked and left alone */

    /* the copy is authored once, on the node itself. The hub only repeats
       it, which is why the hub is aria-hidden and these are not. */
    var text = function (root, sel) { var el = $(sel, root); return el ? el.textContent.trim() : ''; };

    var read = function (n) {
      var card = $('.sv-orb__card', n);
      if (!card) return null;
      return {
        kicker: text(card, '.sv-orb__kicker'),
        title: text(n, '.sv-orb__lbl'),
        note: text(card, '.sv-orb__note'),
        price: text(card, '.sv-orb__price')
      };
    };

    /* the hub repeats whatever is showing, so it is aria-hidden in the
       markup and this never announces anything twice */
    var show = function (i) {
      if (i < 0 || i >= nodes.length || i === front) return;
      front = i;

      var data = read(nodes[i]);
      if (data) {
        /* the text is written synchronously: animating the swap by hiding
           the old copy first would leave the hub blank mid-scroll */
        if (kicker) kicker.textContent = data.kicker;
        if (title) title.textContent = data.title;
        if (note) note.textContent = data.note;
        if (price) price.textContent = data.price;
        if (hub && !REDUCED && gsap) {
          gsap.fromTo([kicker, title, note, price].filter(Boolean),
            { opacity: 0, y: 9 },
            { opacity: 1, y: 0, duration: .34, stagger: .035, ease: 'power2.out', overwrite: true });
        }
      }
      if (hint) hint.textContent = 'Node ' + String(i + 1).padStart(2, '0') + ' at the front \u00b7 turn the ring by scrolling';
      paint();
    };

    var paint = function () {
      var winner = hot >= 0 ? hot : held >= 0 ? held : front;
      nodes.forEach(function (n, i) {
        n.classList.toggle('is-front', i === winner);
        n.classList.toggle('is-hot', i === hot);
        n.classList.toggle('is-held', i === held);
        var btn = $('.sv-orb__btn', n);
        if (btn) btn.setAttribute('aria-pressed', i === held ? 'true' : 'false');
      });
      if (hub) hub.classList.toggle('is-live', winner >= 0);
    };

    var resolve = function () {
      var best = -1, bestY = -Infinity;
      nodes.forEach(function (n, i) {
        var r = n.getBoundingClientRect();
        var y = r.top + r.height / 2;
        if (y > bestY) { bestY = y; best = i; }
      });
      return best;
    };

    nodes.forEach(function (n, i) {
      var btn = $('.sv-orb__btn', n);
      if (!btn) return;

      if (FINE) {
        n.addEventListener('pointerenter', function () { hot = i; paint(); show(i); });
        n.addEventListener('pointerleave', function () { hot = -1; paint(); });
      }
      btn.addEventListener('focus', function () { hot = i; paint(); show(i); });
      btn.addEventListener('blur', function () { hot = -1; paint(); });
      btn.addEventListener('click', function () {
        held = held === i ? -1 : i;
        paint();
        show(held >= 0 ? held : resolve());
      });
    });

    if (!gsap || !ST || REDUCED) {
      show(resolve());
      paint();
      return;
    }

    var state = { v: 0 };
    var turn = function () {
      ring.style.setProperty('--sv-spin', (state.v * 360).toFixed(2) + 'deg');
      show(resolve());
    };

    gsap.to(state, {
      v: 1, ease: 'none',
      scrollTrigger: {
        trigger: stage,
        start: 'top 80%',
        end: 'bottom 62%',
        scrub: .6,
        onUpdate: turn,
        onRefresh: turn
      }
    });
    turn();
    paint();
  }


  /* ===================================================================
     8 · THE QUEUE
     The counters settle on load and a unit keeps landing on the intake
     column, so the board reads as live rather than as a static poster.
     =================================================================== */
  function queue() {
    var counts = $$('[data-sv-count]');
    var clock = $('#svQueueClock');
    var ago = $('#svQueueAgo');
    if (!counts.length && !clock) return;

    var total = 0;
    counts.forEach(function (el) { total += parseInt(el.getAttribute('data-sv-count'), 10) || 0; });

    var settle = function (el, to) {
      if (!gsap || REDUCED) { el.textContent = to; return; }
      var o = { v: 0 };
      gsap.to(o, {
        v: to, duration: 1.5, ease: 'power3.out',
        onUpdate: function () { el.textContent = Math.round(o.v); }
      });
    };

    if (clock) settle(clock, total);
    counts.forEach(function (el) { settle(el, parseInt(el.getAttribute('data-sv-count'), 10) || 0); });

    if (ago) {
      var secs = 0;
      setInterval(function () {
        secs += 15;
        ago.textContent = secs < 60 ? 'just now'
          : secs < 3600 ? Math.round(secs / 60) + ' min ago'
          : Math.round(secs / 3600) + ' h ago';
      }, 15000);
    }

    /* a new unit lands on intake every so often */
    var fresh = $('.sv-col:first-child .sv-col__stack .sv-job');
    if (fresh && FINE && !REDUCED) {
      var pulse = function () {
        fresh.classList.add('is-fresh');
        setTimeout(function () { fresh.classList.remove('is-fresh'); }, 1700);
      };
      setTimeout(pulse, 4000);
      setInterval(pulse, 11000);
    }
  }

  /* ===================================================================
     9 · THE TICKET
     The arithmetic is real: the steppers write the outputs, the outputs
     multiply the unit prices, and the total is tweened so it counts up
     rather than jumping.
     =================================================================== */
  var TICKET = {
    screen: { cap: 'Screen & glass, same day', img: '../images/service-authenticity.webp', alt: 'Diagnostic software confirming a new display reads back correctly' },
    battery: { cap: 'Cell swap, same day', img: '../images/service-delivery.webp', alt: 'A replacement battery being seated into a phone body' },
    water: { cap: 'Ultrasonic clean, 48 hours', img: '../images/support.webp', alt: 'A technician inspecting a water damaged logic board' },
    port: { cap: 'Port re-solder, 3 hour bench', img: '../images/product-detail.webp', alt: 'A port and flex board photographed for the repair record' }
  };

  function ticket() {
    var lines = $$('[data-sv-line]');
    var totalEl = $('[data-sv-total]');
    if (!lines.length) return;

    var shot = $('#svTicketImg');
    var cap = $('#svTicketCap');

    var money = function (v) { return '$' + Math.round(v); };

    var recalc = function () {
      var total = 0, lead = null;

      lines.forEach(function (li) {
        var unit = parseFloat(li.getAttribute('data-sv-unit')) || 0;
        var out = $('[data-sv-qty]', li);
        var priceEl = $('[data-sv-lineprice]', li);
        var n = out ? clamp(parseInt(out.textContent, 10) || 0, 0, 9) : 0;
        if (out) out.textContent = n;
        total += unit * n;
        if (priceEl) priceEl.textContent = n ? money(unit * n) : '—';
        if (n && !lead) lead = li.getAttribute('data-sv-key');
      });

      if (totalEl) {
        if (gsap && !REDUCED) {
          var o = { v: parseFloat(String(totalEl.textContent).replace(/[^0-9.]/g, '')) || 0 };
          gsap.to(o, {
            v: total, duration: .45, ease: 'power2.out',
            onUpdate: function () { totalEl.textContent = money(o.v); }
          });
        } else {
          totalEl.textContent = money(total);
        }
      }

      /* the photo reports whichever line is being quoted first */
      var d = TICKET[lead];
      if (d && shot && cap) {
        var swap = function () {
          shot.setAttribute('src', d.img);
          shot.setAttribute('alt', d.alt);
          shot.setAttribute('width', d.img.indexOf('support') > -1 ? '900' : d.img.indexOf('product-detail') > -1 ? '900' : '720');
          shot.setAttribute('height', d.img.indexOf('support') > -1 ? '600' : d.img.indexOf('product-detail') > -1 ? '1150' : '520');
          cap.textContent = d.cap;
        };
        if (shot.getAttribute('src') !== d.img) {
          if (gsap && !REDUCED) {
            gsap.to(shot, {
              opacity: 0, duration: .18, overwrite: true,
              onComplete: function () {
                swap();
                gsap.fromTo(shot, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .45, ease: 'expo.out' });
              }
            });
          } else swap();
        }
      }
    };

    lines.forEach(function (li) {
      var out = $('[data-sv-qty]', li);
      $$('[data-sv-step]', li).forEach(function (b) {
        b.addEventListener('click', function () {
          if (!out) return;
          var d = parseInt(b.getAttribute('data-sv-step'), 10) || 0;
          out.textContent = clamp((parseInt(out.textContent, 10) || 0) + d, 0, 9);
          recalc();
        });
      });
      if (out) out.addEventListener('focus', function () { });
    });

    recalc();
  }

  /* ===================================================================
     10 · THE DESK
     The answer rows are a plain aligned list, so nothing here may move a
     row: the depth comes from a slow counter-drift inside each thumbnail
     and the wash that wipes in from the left on hover.
     =================================================================== */
  function desk() {
    if (!gsap || !ST || REDUCED) return;
    $$('.sv-qa').forEach(function (row) {
      var img = $('.sv-qa__win img', row);
      if (!img) return;
      gsap.fromTo(img, { yPercent: -4 }, {
        yPercent: 4, ease: 'none',
        scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: 1.2 }
      });
    });
  }

  /* ===================================================================
     BOOT
     Same shape as shop.js: build everything, then refresh the trigger
      measurements once the page images have real dimensions, because the
      pinned bench, the bound logbook and the turned ring all measure
      their own content.
     =================================================================== */
  function boot() {
    reveals();
    marks();
    safetyNet();
    aperture();
    intake();
    bench();
    ledger();
    logbook();
    orbit();
    queue();
    ticket();
    desk();

    var refresh = function () {
      if (window.StacklyMotion && window.StacklyMotion.refresh) window.StacklyMotion.refresh();
      else if (ST) ST.refresh();
    };

    if (document.readyState === 'complete') refresh();
    else window.addEventListener('load', refresh);

    var scope = document.querySelector('main');
    var imgs = $$('img', scope || document);
    var left = imgs.filter(function (i) { return !i.complete; }).length;
    if (!left) { setTimeout(refresh, 150); return; }
    var done = 0;
    imgs.forEach(function (i) {
      if (i.complete) return;
      var once = function () { if (++done >= left) setTimeout(refresh, 150); };
      i.addEventListener('load', once, { once: true });
      i.addEventListener('error', once, { once: true });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
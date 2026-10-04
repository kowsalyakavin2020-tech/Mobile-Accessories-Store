/* =====================================================================
   STACKLY — SHOP PAGE BEHAVIOUR
   Runs on top of the shared runtime that home.js already installed
   (window.gsap / window.ScrollTrigger / window.Lenis). Nothing here loads
   a second GSAP, and nothing here re-implements the shared cart, toast,
   menu or newsletter.

   Every reveal type below is unique to this page: home uses
   rise / flip / wipe / curtain / reveal / fade / stage / pin / grow / swing.
   This page uses dropIn / foldUp / ascent / iris / ghost / skewRelief.
   ===================================================================== */
(function () {
  'use strict';

  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var MOTION = !REDUCED && !!gsap && !!ST;

  /* ===================================================================
     0 · REVEAL ENGINE — one observer for the whole page
     =================================================================== */
  function revealAll() {
    var els = $$('[data-sp-r]');

    if (!MOTION) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    /* stagger siblings so grids cascade instead of popping as one block */
    var seen = [];
    var delayFor = function (el) {
      var p = el.parentNode;
      if (seen.indexOf(p) !== -1) return 0;
      seen.push(p);
      var sibs = $$('[data-sp-r]', p);
      return sibs.indexOf(el) * 0.08;
    };

    els.forEach(function (el) {
      ST.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: function () {
          gsap.delayedCall(delayFor(el), function () { el.classList.add('is-in'); });
        }
      });
    });
  }

  /* ===================================================================
     1 · THE LOADOUT — tabs drive the lens, the tag and the dock
     =================================================================== */
  function loadout() {
    var sec = $('[data-sp-hero]');
    if (!sec) return;

    var DATA = [
      { tag: 'AeroGlass Grip', dock: [[24, 'Pieces in the kit'], [79, 'Days of backup'], [4, 'Grams lighter']],
        note: 'Three shells, one charger, zero clutter.' },
      { tag: 'SolarFold 20K', dock: [[9, 'Pieces in the kit'], [64, 'Charges on the move'], [2, 'Grams lighter']],
        note: 'One fold-out panel, twenty thousand milliamp hours.' },
      { tag: 'Pulse Mini', dock: [[4, 'Pieces in the kit'], [18, 'Hours of playback'], [3, 'Cabin-friendly']],
        note: 'Twelve watts, eighteen hours, one button.' }
    ];

    var lines = $$('.sp-line', sec);
    var figs = $$('.sp-lens__fig', sec);
    var tag = $('#spLensTag');
    var note = $('#spDockNote');
    var vals = $$('.sp-dock__v', sec);
    var keys = $$('.sp-dock__k', sec);
    var current = -1;
    var auto = null;
    var held = false;

    function countTo(el, to) {
      var from = parseFloat(el.textContent) || 0;
      if (!MOTION) { el.textContent = to; return; }
      var o = { v: from };
      gsap.to(o, {
        v: to, duration: .8, ease: 'power2.out',
        onUpdate: function () { el.textContent = Math.round(o.v); }
      });
    }

    function apply(i, viaUser) {
      if (i === current) return;
      current = i;

      lines.forEach(function (l, n) { l.classList.toggle('is-active', n === i); });
      figs.forEach(function (f, n) { f.classList.toggle('is-active', n === i); });
      if (tag) tag.textContent = DATA[i].tag;
      if (note) note.textContent = DATA[i].note;

      DATA[i].dock.forEach(function (d, n) {
        if (vals[n]) countTo(vals[n], d[0]);
        if (keys[n]) keys[n].textContent = d[1];
      });

      if (viaUser) restart();
    }

    function restart() {
      if (auto) clearInterval(auto);
      if (REDUCED) return;
      auto = setInterval(function () { if (!held) apply((current + 1) % DATA.length, false); }, 5600);
    }

    lines.forEach(function (l, i) {
      l.addEventListener('click', function () { apply(i, true); });
      l.addEventListener('mouseenter', function () { held = true; });
    });
    sec.addEventListener('mouseleave', function () { held = false; });

    /* pointer parallax: the lens tilts, the backdrop drifts */
    if (MOTION && FINE) {
      var stage = $('.sp-lens__stage', sec);
      var halo = $('.sp-hero__halo', sec);
      var tx = gsap.quickTo(stage, 'rotationY', { duration: .8, ease: 'power3' });
      var ty = gsap.quickTo(stage, 'rotationX', { duration: .8, ease: 'power3' });
      var hx = gsap.quickTo(halo, 'x', { duration: 1.4, ease: 'power3' });
      var hy = gsap.quickTo(halo, 'y', { duration: 1.4, ease: 'power3' });

      sec.addEventListener('mousemove', function (e) {
        var r = sec.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5;
        var py = (e.clientY - r.top) / r.height - .5;
        tx(px * 16); ty(py * -12);
        hx(px * 40); hy(py * 30);
      });
    }

    apply(0, false);
    restart();
  }

    /* ===================================================================
     2 · THE INDEX — scroll drift only; the photo is the whole hover
     =================================================================== */
  function index() {
    var plates = $$('.sp-idx__plate');
    if (!plates.length) return;

    /* Every plate has --ny scrubbed from a positive offset to a negative one
       as the section crosses the viewport, so the cascade drifts upward at a
       slightly different rate per column. No click handler is registered on
       purpose: the section has no disclosure, no panel and no state. */
    if (!MOTION || !ST) return;

    plates.forEach(function (plate, n) {
      var depth = (n % 3) * 14;      /* columns lead each other slightly */
      gsap.fromTo(plate,
        { '--ny': (30 + depth) + 'px' },
        {
          '--ny': (-30 - depth) + 'px',
          ease: 'none',
          scrollTrigger: {
            trigger: plate,
            start: 'top bottom',
            end: 'bottom top',
            scrub: .6,
            invalidateOnRefresh: true
          }
        });
    });
  }


  /* ===================================================================
     3 · THE BOARD — flip cards
     =================================================================== */
  function board() {
    $$('.sp-flip__c').forEach(function (c) {
      /* a click that starts on the add-to-cart button must not flip the card back */
      if (FINE) {
        c.addEventListener('mouseenter', function () { c.classList.add('is-flipped'); });
        c.addEventListener('mouseleave', function () { c.classList.remove('is-flipped'); });
      } else {
        var t = null;
        c.addEventListener('click', function (e) {
          if (e.target.closest && e.target.closest('.add-to-cart')) return;
          clearTimeout(t);
          t = setTimeout(function () { c.classList.toggle('is-flipped'); }, 180);
        });
      }
    });
  }

  /* ===================================================================
     4 · COLOURWAYS — cross-highlight one column across every row
     =================================================================== */
  function colourways() {
    var wrap = $('#spMx');
    if (!wrap) return;
    var cols = $$('.sp-mx__col', wrap);
    var banner = $('#spMxBanner');
    var bName = banner ? $('b', banner) : null;
    var NOTE = {
      Obsidian: 'the finish we finish the most of',
      Sandstone: 'warm, matte, hides a scuff',
      Volt: 'the limited run, restocked monthly',
      Coral: 'the one that sells out first',
      Frost: 'clear enough to forget it is there'
    };

    cols.forEach(function (c, i) {
      c.addEventListener('click', function () {
        if (wrap.getAttribute('data-active') === String(i)) return;
        wrap.setAttribute('data-active', String(i));
        cols.forEach(function (o, n) { o.classList.toggle('is-on', n === i); });
        if (bName) bName.textContent = c.textContent.trim();
        if (banner) {
          var rest = banner.childNodes[banner.childNodes.length - 1];
          if (rest && rest.nodeType === 3) rest.nodeValue = ' — ' + NOTE[c.textContent.trim()];
          banner.classList.remove('is-sweep');
          void banner.offsetWidth;
          banner.classList.add('is-sweep');
        }
      });
    });
  }

  /* ===================================================================
     5 · THE CONVEYOR — cards lean toward the pointer
     =================================================================== */
  function conveyor() {
    var root = $('[data-sp-conv]');
    if (!root) return;

    /* the badge reports what is genuinely on the belts — the loop duplicates
       are aria-hidden, so they are not stock and must not be counted */
    var lanes = $$('.sp-belt__lane', root).length || 1;
    var perLane = $$('.sp-belt__track li:not([aria-hidden])', root).length;
    var count = $('[data-sp-belt-count]', root);
    if (count) count.textContent = String(perLane * lanes);

    /* the belts never stop on their own, so the pause control is the only way
       to hold them still. It has to work without gsap and without a pointer. */
    var toggle = $('[data-sp-belt-toggle]', root);
    if (toggle) {
      var setBelt = function (paused) {
        root.setAttribute('data-state', paused ? 'pause' : 'run');
        toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
        var icon = $('i', toggle);
        var text = $('.sp-belt__pause-t', toggle);
        if (icon) icon.className = paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
        if (text) text.textContent = paused ? 'Resume the belts' : 'Pause the belts';
      };
      toggle.addEventListener('click', function () {
        setBelt(root.getAttribute('data-state') !== 'pause');
      });
      /* reduced motion already stops the belts and hides this control */
      if (REDUCED) toggle.setAttribute('hidden', '');
    }

    if (!MOTION || !FINE) return;
    $$('.sp-cv:not([aria-hidden])', root).forEach(function (card) {
      var rx = gsap.quickTo(card, 'rotationX', { duration: .5, ease: 'power2' });
      var ry = gsap.quickTo(card, 'rotationY', { duration: .5, ease: 'power2' });
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        rx(((e.clientY - r.top) / r.height - .5) * -12);
        ry(((e.clientX - r.left) / r.width - .5) * 14);
      });
      card.addEventListener('mouseleave', function () { rx(0); ry(0); });
    });
  }

    /* ===================================================================
     6 · PICK YOUR SHIELD — one seam, three ways to drive it
     =================================================================== */
  function shield() {
    var stage = $('#spDuel');
    var handle = $('#spDuelHandle');
    if (!stage || !handle) return;

    var cur = 50;
    var seam = null;

    function release() {
      if (!seam) return;
      if (seam.scrollTrigger) seam.scrollTrigger.kill();
      seam.kill();
      seam = null;
    }

    function set(p) {
      release();
      cur = Math.max(0, Math.min(100, p));
      stage.style.setProperty('--p', cur + '%');
      handle.setAttribute('aria-valuenow', String(Math.round(cur)));
    }

    function fromX(clientX) {
      var box = stage.getBoundingClientRect();
      if (!box.width) return;
      set(((clientX - box.left) / box.width) * 100);
    }

    /* pointer: capture on the stage so the seam keeps tracking outside it */
    var dragging = false;
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true;
      if (stage.setPointerCapture) {
        try { stage.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      }
      fromX(e.clientX);
    });
    stage.addEventListener('pointermove', function (e) {
      if (dragging) fromX(e.clientX);
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      window.addEventListener(ev, function () { dragging = false; });
    });

    /* keyboard: the handle is a real slider, so arrows/Home/End move it */
    handle.addEventListener('keydown', function (e) {
      var big = e.shiftKey ? 10 : 3;
      var hit = true;
      switch (e.key) {
        case 'ArrowLeft': case 'ArrowDown': set(cur - big); break;
        case 'ArrowRight': case 'ArrowUp': set(cur + big); break;
        case 'PageDown': set(cur - 20); break;
        case 'PageUp': set(cur + 20); break;
        case 'Home': set(0); break;
        case 'End': set(100); break;
        default: hit = false;
      }
      if (hit) e.preventDefault();
    });

    /* scroll: the seam opens on its own while the section arrives, and hands
       itself over the instant anyone touches the slider */
    if (MOTION && ST) {
      seam = gsap.fromTo(stage,
        { '--p': '26%' },
        {
          '--p': '54%', ease: 'none',
          scrollTrigger: { trigger: stage, start: 'top 96%', end: 'top 46%', scrub: .5 }
        });
    }

    set(50);
  }


  /* ===================================================================
     7 · BUILD THE STACK — covered tiers shrink and recede
     =================================================================== */
  function stack() {
    if (!MOTION) return;
    var tiers = $$('.sp-tier');
    tiers.forEach(function (t, i) {
      var next = tiers[i + 1];
      if (!next) return;
      var inner = $('.sp-tier__in', t);
      ST.create({
        trigger: next,
        start: 'top top+=150',
        end: 'top top+=30',
        scrub: true,
        onUpdate: function (self) {
          var p = self.progress;
          /* the outgoing card recedes in scale, but only gently in opacity:
             fading to .45 dragged the add-to-cart button with it and made the
             CTA look disabled while it was still the live one. */
          gsap.set(inner, { scale: 1 - .07 * p, opacity: 1 - .26 * p });
        }
      });
    });
  }

    /* ===================================================================
     8 · INSIDE THE CUT — one scrubbed number fans the whole stack
     =================================================================== */
  /* ===================================================================
     9 · STRAIGHT OFF THE BENCH — the row stands up as you scroll
     =================================================================== */
  function unpack() {
    var row = $('#spUnpackRow');
    if (!row) return;

    if (!MOTION || !ST) { row.style.setProperty('--open', '1'); return; }

    /* --open is the only value that moves. The cards read it in their own
       transform and the photographs read it as a drift, so the three frames
       cannot drift out of step and the hover lift cannot fight the scrub. */
    gsap.fromTo(row,
      { '--open': 0 },
      {
        '--open': 1,
        ease: 'none',
        scrollTrigger: {
          trigger: row,
          start: 'top 86%',
          end: 'bottom 62%',
          scrub: .5,
          invalidateOnRefresh: true
        }
      });
  }


  /* ===================================================================
     10 · BENCH VERDICT — six stations rise, hover brings the shot forward
     =================================================================== */
  function verdict() {
    var grid = $('#spVerdictGrid');
    if (!grid) return;
    var tiles = $$('.sp-vd', grid);

    if (!MOTION || !ST) { grid.style.setProperty('--lift', '0px'); return; }

    /* --lift is read by the tile's own transform, so the hover lift adds to
       the scrubbed value instead of replacing it. The delay walks the grid
       across and then down, so the row reads as a bench being worked. */
    tiles.forEach(function (t, n) {
      gsap.fromTo(t,
        { '--lift': '26px', opacity: 0 },
        {
          '--lift': '0px', opacity: 1,
          duration: .68, ease: 'back.out(1.4)',
          delay: (n % 3) * .09 + Math.floor(n / 3) * .05,
          scrollTrigger: { trigger: grid, start: 'top 84%', once: true }
        });
    });
  }


  /* ===================================================================
     11 · THE BENCH — resting on a panel flips through its shots
     =================================================================== */
  function bench() {
    $$('.sp-bench__p').forEach(function (p) {
      var shots = $$('img', $('.sp-bench__stack', p));
      var bar = $('.sp-bench__bar i', p);
      if (!shots.length) return;
      var i = 0;
      var timer = null;

      function show(n) {
        i = n % shots.length;
        shots.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
        if (bar) bar.style.transform = 'scaleX(' + ((i + 1) / shots.length) + ')';
      }
      function start() {
        if (timer) return;
        show(0);
        if (REDUCED) return;
        timer = setInterval(function () { show(i + 1); }, 1100);
      }
      function stop() { clearInterval(timer); timer = null; }

      p.addEventListener('mouseenter', start);
      p.addEventListener('mouseleave', stop);
      p.addEventListener('focusin', start);
      p.addEventListener('focusout', stop);
      show(0);
    });
  }

  /* ===================================================================
     BOOT
     =================================================================== */
  function boot() {
    revealAll();
    loadout();
    index();
    board();
    colourways();
    conveyor();
    shield();
    stack();
    unpack();
    verdict();
    bench();

    /* layout settles once the page images have real dimensions, so the
       sticky deck and the fanned layer deck measure correctly */
    var refresh = function () {
      if (window.StacklyMotion && window.StacklyMotion.refresh) window.StacklyMotion.refresh();
      else if (ST) ST.refresh();
    };

    if (document.readyState === 'complete') refresh();
    else window.addEventListener('load', refresh);

    var imgs = $$('img', $('.sp-mx-sec') || document);
    var left = imgs.filter(function (i) { return !i.complete; }).length;
    if (!left) { setTimeout(refresh, 120); return; }
    var done = 0;
    imgs.forEach(function (i) {
      if (i.complete) return;
      var once = function () { if (++done >= left) setTimeout(refresh, 120); };
      i.addEventListener('load', once, { once: true });
      i.addEventListener('error', once, { once: true });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

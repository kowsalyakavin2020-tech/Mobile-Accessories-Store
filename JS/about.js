/* =====================================================================
   STACKLY · ABOUT PAGE RUNTIME
   Runs on the shared runtime home.js installs (gsap, ScrollTrigger,
   Lenis). No second GSAP is loaded. Owns: hero torch, scrubbed manifesto,
   drawn timeline rail, unfolding panels, polaroid pile, pinned curtain,
   counter-drifting wall and the rippling hello headline.
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

  /* ---- reveals: line-cut on scroll, hero waits for the preloader ---- */
  function whenReady(cb) {
    var p = $('#preloader');
    if (!p || p.classList.contains('hide') || p.classList.contains('done')) return cb();
    var mo = new MutationObserver(function () {
      if (p.classList.contains('done') || p.classList.contains('hide')) { mo.disconnect(); cb(); }
    });
    mo.observe(p, { attributes: true });
    setTimeout(function () { mo.disconnect(); cb(); }, 6000);
  }
  function reveals() {
    var els = $$('[data-ab-r]');
    var show = function (el) { el.classList.add('ab-in'); };
    if (!live) { els.forEach(show); return; }
    els.forEach(function (el, i) {
      ST.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () { setTimeout(function () { show(el); }, (i % 3) * 90); } });
    });
    window.addEventListener('load', function () {
      setTimeout(function () {
        els.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < innerHeight && r.bottom > 0) show(el);
        });
      }, 1500);
    });
  }
  function hero() {
    var hs = $$('[data-ab-h]');
    whenReady(function () { hs.forEach(function (el, i) { setTimeout(function () { el.classList.add('ab-in'); }, 120 + i * 160); }); });
    var dark = $('#abDark'), sec = $('#abHero');
    if (!dark || !gsap) return;
    if (REDUCED) { dark.style.setProperty('--tr', '240px'); return; }
    var st = { tr: 0 };
    gsap.to(st, { tr: 230, duration: 1.4, delay: 3.2, ease: 'power3.out', onUpdate: function () { dark.style.setProperty('--tr', st.tr + 'px'); } });
    var setX = function (v) { dark.style.setProperty('--mx', v + 'px'); };
    var setY = function (v) { dark.style.setProperty('--my', v + 'px'); };
    var pos = { x: sec.offsetWidth * .7, y: sec.offsetHeight * .4 };
    var push = function () { setX(pos.x); setY(pos.y); };
    if (FINE) {
      sec.addEventListener('mousemove', function (e) {
        var r = sec.getBoundingClientRect();
        gsap.to(pos, { x: e.clientX - r.left, y: e.clientY - r.top, duration: .5, ease: 'power3.out', onUpdate: push });
      });
      sec.addEventListener('mouseleave', function () { gsap.to(st, { tr: 230, duration: .6, onUpdate: function () { dark.style.setProperty('--tr', st.tr + 'px'); } }); });
    } else {
      /* touch: the lamp wanders on its own */
      gsap.to(pos, { x: function () { return sec.offsetWidth * .25; }, y: function () { return sec.offsetHeight * .3; }, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut', onUpdate: push });
    }
    push();
  }

  /* ---- manifesto: every word lights as you scroll through it ---- */
  function manifesto() {
    var p = $('#abManiText');
    if (!p) return;
    var nodes = [];
    Array.prototype.slice.call(p.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w.trim()) { frag.appendChild(document.createTextNode(w)); return; }
          var s = document.createElement('span'); s.textContent = w; s.style.display = 'inline-block'; frag.appendChild(s); nodes.push(s);
        });
        p.replaceChild(frag, n);
      } else if (n.nodeType === 1) nodes.push(n);
    });
    if (!live) return;
    gsap.fromTo(nodes, { opacity: .14 }, { opacity: 1, stagger: .12, ease: 'none',
      scrollTrigger: { trigger: p, start: 'top 78%', end: 'bottom 52%', scrub: true } });
  }

  /* ---- timeline: rail draws, photos open like an iris ---- */
  function timeline() {
    var list = $('#abTlList');
    if (!list || !live) return;
    gsap.fromTo('#abFill', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 60%', end: 'bottom 60%', scrub: true } });
    $$('.ab-tl__pic', list).forEach(function (pic) {
      gsap.fromTo(pic, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', ease: 'none',
        scrollTrigger: { trigger: pic, start: 'top 88%', end: 'top 42%', scrub: true } });
    });
  }

  /* ---- values: one panel open at a time ---- */
  function values() {
    var panels = $$('.ab-val');
    var open = function (el) { panels.forEach(function (p) { p.classList.toggle('is-on', p === el); }); };
    panels.forEach(function (p) {
      if (FINE) p.addEventListener('mouseenter', function () { open(p); });
      p.addEventListener('click', function () { open(p); });
      p.addEventListener('focus', function () { open(p); });
      p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(p); } });
    });
  }

  /* ---- crew: the pile is dropped in by scroll ---- */
  function crew() {
    var pols = $$('.ab-pol');
    if (!live || !pols.length) return;
    gsap.fromTo(pols, { y: -260, rotation: function (i) { return (i - 1) * 40; }, opacity: 0 },
      { y: 0, rotation: 0, opacity: 1, stagger: .18, ease: 'none',
        scrollTrigger: { trigger: '#abCrew', start: 'top 70%', end: 'top 15%', scrub: true } });
  }

  /* ---- curtain: pinned; halves part and the numbers count up ---- */
  function curtain() {
    var sec = $('#abCurtain');
    if (!sec) return;
    var nums = $$('[data-to]', sec);
    if (!live) { $$('.ab-curtain__h, .ab-curtain__cue', sec).forEach(function (e) { e.style.display = 'none'; }); nums.forEach(function (n) { n.textContent = n.getAttribute('data-to'); }); return; }
    var tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sec, start: 'top top', end: '+=120%', pin: true, scrub: .6 } });
    tl.to('.ab-curtain__l', { xPercent: -100 }, 0)
      .to('.ab-curtain__r', { xPercent: 100 }, 0)
      .to('.ab-curtain__cue', { opacity: 0, duration: .2 }, 0)
      .fromTo('.ab-curtain__back .shell', { scale: .88 }, { scale: 1 }, 0);
    nums.forEach(function (n) {
      var o = { v: 0 }, to = parseInt(n.getAttribute('data-to'), 10);
      tl.to(o, { v: to, duration: .7, onUpdate: function () { n.textContent = Math.round(o.v).toLocaleString('en-US'); } }, .3);
    });
  }

  /* ---- wall: columns drift against each other; a tag follows the cursor ---- */
  function wall() {
    var sec = $('#abWall');
    if (!sec) return;
    if (live) {
      $$('.ab-col', sec).forEach(function (c) {
        var d = parseInt(c.getAttribute('data-dir'), 10);
        gsap.fromTo(c, { y: -60 * d }, { y: 60 * d, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }
    var tag = $('#abTag');
    if (!tag || !FINE || !gsap) return;
    gsap.set(tag, { xPercent: -50, yPercent: -50 });
    var qx = gsap.quickTo(tag, 'x', { duration: .35, ease: 'power3' }), qy = gsap.quickTo(tag, 'y', { duration: .35, ease: 'power3' });
    $$('.ab-col figure', sec).forEach(function (f) {
      f.addEventListener('mouseenter', function () { tag.textContent = f.getAttribute('data-tag'); tag.classList.add('on'); });
      f.addEventListener('mouseleave', function () { tag.classList.remove('on'); });
      f.addEventListener('mousemove', function (e) { qx(e.clientX + 6); qy(e.clientY + 6); });
    });
  }

  /* ---- hello: split to letters; the float drifts with scroll ---- */
  function hello() {
    var h = $('#abHelloT');
    if (!h) return;
    var t = h.textContent; h.textContent = '';
    t.split('').forEach(function (c) {
      var s = document.createElement('span'); s.className = 'ab-ch'; s.setAttribute('aria-hidden', 'true');
      s.textContent = c === ' ' ? '\u00A0' : c; h.appendChild(s);
    });
    if (live) gsap.fromTo('.ab-hello__float', { y: -40, rotation: -8 }, { y: 80, rotation: 10, ease: 'none', scrollTrigger: { trigger: '#abHello', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  function boot() {
    reveals(); hero(); manifesto(); timeline(); values(); crew(); curtain(); wall(); hello();
    window.addEventListener('load', function () { if (ST) setTimeout(function () { ST.refresh(); }, 300); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
/* =====================================================================
   404 · "This shelf is empty"

   The whole page is one locked stage, so this file stays small and has
   three jobs only:

     1. guarantee the no-scroll lock holds, whatever the viewport does
     2. make Go Back behave sensibly (real history, or home as a floor)
     3. tiny reveal helper for the entrance animation

   No GSAP, no ScrollTrigger, no Lenis on this page: home.js is not
   loaded, because there is no shell here to drive.
   ===================================================================== */

(function () {
  'use strict';

  var doc = document;
  var win = window;
  var body = doc.body;

  var REDUCED = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- 1 · the no-scroll lock ----------
     body is position:fixed in CSS. Belt and braces here: if anything
     ever does manage to scroll the document, snap it back to 0. Also
     re-assert on resize, because iOS Safari can restore a scroll offset
     after rotation when the URL has a fragment. */
  function lockScroll() {
    if (win.scrollY !== 0 || win.scrollX !== 0) {
      win.scrollTo(0, 0);
    }
    doc.documentElement.style.overflow = 'hidden';
    doc.body.style.overflow = 'hidden';
  }

  var lockQueued = false;
  function queueLock() {
    if (lockQueued) return;
    lockQueued = true;
    win.requestAnimationFrame(function () {
      lockQueued = false;
      lockScroll();
    });
  }

  win.addEventListener('scroll', queueLock, { passive: true });
  win.addEventListener('resize', queueLock);
  win.addEventListener('orientationchange', queueLock);
  win.addEventListener('pageshow', lockScroll);

  /* The browser can still rubber-band a fixed body on touch. Blocking
     touchmove wholesale would break the buttons' :active feedback on
     some engines, so only the gestures that would scroll are killed. */
  function blockScrollGesture(e) {
    if (e.cancelable) e.preventDefault();
  }
  doc.addEventListener('touchmove', function (e) {
    if (e.touches.length > 1 || win.scrollY !== 0) blockScrollGesture(e);
  }, { passive: false });
  doc.addEventListener('gesturestart', blockScrollGesture, { passive: false });
  doc.addEventListener('wheel', function (e) {
    if (win.scrollY !== 0) blockScrollGesture(e);
  }, { passive: false });

  lockScroll();

  /* ---------- 2 · Go Back ----------
     Three cases, in order of preference:
       a. history exists and the referrer is same-site  -> go back one entry
       b. no referrer at all (typed URL, fresh tab)     -> go back one entry
       c. arrived from another site, or nothing to go
          back to                                       -> send them home
     Landing a stranger on some random external page is worse than
     sending them home, so an off-site referrer never uses history. */
  var HOME = '../index.html';

  function referrerIsSafe() {
    var ref = doc.referrer;
    /* No referrer means the URL was typed or opened fresh. There is no
       external site on record, so history.back() cannot throw anyone off
       the site. */
    if (!ref) return true;
    try {
      return new URL(ref, win.location.href).host === win.location.host;
    } catch (e) {
      return false;
    }
  }

  function goBack() {
    var btn = doc.getElementById('nfBack');
    /* Disable immediately: a double click must not walk two pages back. */
    if (btn) {
      btn.disabled = true;
      btn.classList.add('is-busy');
    }

    var canGoBack = win.history.length > 1 && referrerIsSafe();

    if (canGoBack) {
      win.history.back();
      /* If the browser refuses to move (or the entry is a dead server
         route) fall through to home rather than leaving a dead page. */
      win.setTimeout(function () {
        if (doc.visibilityState === 'visible') {
          win.location.replace(HOME);
        }
      }, 1200);
      return;
    }

    win.location.replace(HOME);
  }

  var back = doc.getElementById('nfBack');
  if (back) {
    back.addEventListener('click', goBack);
  }

  /* A visitor who lands here mid-session may press Escape expecting to
     leave, the same way a browser back button would. */
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    goBack();
  });

  /* ---------- 3 · reveal helper ----------
     The entrance animation is CSS-only, gated on .js-ready so it never
     runs on a page whose script failed. Reduced motion just sets the
     end state directly. */
  function reveal() {
    if (REDUCED) {
      /* let the stylesheet's reduced-motion block own the final state */
      body.classList.add('js-ready');
      return;
    }
    body.classList.add('js-ready');
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', function () {
      lockScroll();
      reveal();
    });
  } else {
    lockScroll();
    reveal();
  }

  /* Fonts land after first paint and change the metrics of the whole
     centred column. Re-centre the moment they are ready so nothing
     shifts after the user has already looked at it. */
  if (doc.fonts && doc.fonts.ready) {
    doc.fonts.ready.then(lockScroll);
  }

})();

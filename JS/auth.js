/* =====================================================================
   auth.js  —  Stackly · Mobile Accessories Store
   Shared by login.html + signin.html.

   One file, two jobs:
     1. field validation, password strength, eye toggles, toast
     2. the role hand-off — whichever role is picked decides which
        dashboard the visitor lands on
   ===================================================================== */

(function () {
  'use strict';

  var doc = document;
  var win = window;

  var REDUCED = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- role contract ----------
     seller is the seller-facing role and lives on supplier.html, so the
     file name cannot be derived from the role value the way it can for
     buyer. Keep the map explicit or the hand-off silently 404s. */
  var ROLES = {
    buyer:  { label: 'Buyer',  file: 'buyer.html',    icon: 'fa-bag-shopping' },
    seller: { label: 'Seller', file: 'supplier.html', icon: 'fa-store' }
  };

  var loginForm = doc.getElementById('loginForm');
  var signupForm = doc.getElementById('signupForm');
  var form = loginForm || signupForm;
  if (!form) return;

  var isLogin = !!loginForm;
  var toast = doc.getElementById('authToast');
  var toastTimer = null;

  /* ---------- helpers ---------- */
  function store(key, value) {
    try {
      if (value === undefined) return win.localStorage.getItem(key);
      win.localStorage.setItem(key, value);
    } catch (e) {
      /* private mode / storage disabled: the form still works in-session */
    }
    return null;
  }

  function drop(key) {
    try { win.localStorage.removeItem(key); } catch (e) {}
  }

  function isEmail(value) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(value || '').trim());
  }

  function nameFromEmail(email) {
    var local = String(email).split('@')[0] || 'Guest';
    return local
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, function (c) { return c.toUpperCase(); })
      .trim() || 'Guest';
  }

  function fieldRow(name) {
    return form.querySelector('[data-field="' + name + '"]');
  }

  function valueOf(name) {
    var el = form.querySelector('[name="' + name + '"]');
    if (!el) return '';
    /* a radio group always reports the FIRST input's value, picked or not,
       so an untouched role has to be read from the checked one or it looks
       selected and the form walks past a missing answer */
    if (el.type === 'radio') {
      var picked = form.querySelector('[name="' + name + '"]:checked');
      return picked ? String(picked.value).trim() : '';
    }
    return String(el.value).trim();
  }

  function controlIn(name) {
    var row = fieldRow(name);
    return row ? row.querySelector('input, select') : null;
  }

  function setBad(name, message) {
    var row = fieldRow(name);
    if (!row) return;
    row.classList.add('is-bad');
    var err = row.querySelector('[data-err]');
    if (err) err.textContent = message;
    var ctl = row.querySelector('input, select');
    if (ctl) ctl.setAttribute('aria-invalid', 'true');
  }

  function setGood(name) {
    var row = fieldRow(name);
    if (!row) return;
    row.classList.remove('is-bad');
    var ctl = row.querySelector('input, select');
    if (ctl) ctl.setAttribute('aria-invalid', 'false');
  }

  function say(message, isError) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle('is-bad', !!isError);
    toast.classList.add('is-visible');
    if (toastTimer) win.clearTimeout(toastTimer);
    toastTimer = win.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 3400);
  }

  /* ---------- password strength (sign-up) ---------- */
  var LEVEL_NAMES = ['', 'Too short', 'Weak', 'Fair', 'Strong', 'Excellent'];

  function pwChecks(value) {
    return {
      len: value.length >= 8,
      upper: /[A-Z]/.test(value),
      lower: /[a-z]/.test(value),
      num: /\d/.test(value),
      spec: /[^A-Za-z0-9]/.test(value)
    };
  }

  var pwInput = form.querySelector('[name="password"]');
  var strength = form.querySelector('[data-strength]');
  var strengthLabel = form.querySelector('[data-strength-label]');
  var strengthPct = form.querySelector('[data-strength-pct]');
  var ruleList = form.querySelector('[data-pw-rules]');

  function updateStrength() {
    if (!strength || !pwInput) return;
    var value = pwInput.value;
    var checks = pwChecks(value);
    var score = 0;
    ['len', 'upper', 'lower', 'num', 'spec'].forEach(function (key) {
      if (checks[key]) score += 1;
    });
    strength.setAttribute('data-level', String(score));
    if (strengthLabel) strengthLabel.textContent = value ? LEVEL_NAMES[score] : 'Password strength';
    if (strengthPct) strengthPct.textContent = score + '\u20445';
    if (ruleList) {
      ruleList.querySelectorAll('li[data-rule]').forEach(function (li) {
        li.classList.toggle('ok', !!checks[li.getAttribute('data-rule')]);
      });
    }
  }

  if (pwInput && strength) {
    pwInput.addEventListener('input', function () {
      updateStrength();
      if (pwInput.value.trim()) setGood('password');
    });
  }

  /* ---------- validation ---------- */
  function validate(name) {
    var value = valueOf(name);
    var message = '';

    if (name === 'email') {
      if (!value) message = 'Email address is required.';
      else if (!isEmail(value)) message = 'That email address looks incomplete.';
    } else if (name === 'password') {
      if (!value) message = 'Password is required.';
      else if (value.length < 8) message = 'Password must be at least 8 characters.';
    } else if (name === 'confirm') {
      if (!value) message = 'Please confirm your password.';
      else if (value !== valueOf('password')) message = 'Passwords do not match.';
    } else if (name === 'role') {
      if (!value) message = isLogin ? 'Pick the account you are signing in to.' : 'Pick the role you are joining us as.';
      else if (!ROLES[value]) message = 'Unknown role.';
    } else if (name === 'name') {
      if (!value) message = 'Full name is required.';
      else if (value.length < 2) message = 'Name must be at least 2 characters.';
      else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(value)) {
        message = 'Use letters only \u2014 numbers and symbols are not allowed.';
      }
    }

    if (message) setBad(name, message);
    else setGood(name);

    return !message;
  }

  var watched = isLogin ? ['email', 'password', 'role'] : ['name', 'email', 'password', 'confirm'];

  watched.forEach(function (name) {
    var ctl = controlIn(name);
    if (!ctl) return;
    ctl.addEventListener('blur', function () {
      if (String(ctl.value).trim()) validate(name);
    });
    ctl.addEventListener('input', function () {
      var row = fieldRow(name);
      if (row && row.classList.contains('is-bad')) validate(name);
    });
  });

  var termsBox = form.querySelector('[name="terms"]');
  if (termsBox) {
    termsBox.addEventListener('change', function () {
      if (termsBox.checked) setGood('terms');
    });
  }

  /* ---------- password eye toggles ---------- */
  form.querySelectorAll('[data-eye]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var ctl = btn.parentNode ? btn.parentNode.querySelector('input') : null;
      if (!ctl) return;
      var reveal = ctl.type === 'password';
      ctl.type = reveal ? 'text' : 'password';
      btn.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
      var glyph = btn.querySelector('i');
      if (glyph) glyph.className = reveal ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });
  });

  /* ---------- role cards (sign-up) ---------- */
  var roleCards = form.querySelectorAll('[data-role-card]');
  roleCards.forEach(function (card) {
    card.addEventListener('change', function () {
      roleCards.forEach(function (other) { other.classList.remove('is-on'); });
      if (card.querySelector('input') && card.querySelector('input').checked) card.classList.add('is-on');
      setGood('role');
    });
    if (card.querySelector('input') && card.querySelector('input').checked) card.classList.add('is-on');
  });

  /* ---------- social ---------- */
  form.querySelectorAll('[data-social]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      win.location.href = '404.html';
    });
  });



  /* ---------- remember me ---------- */
  var rememberBox = form.querySelector('[name="remember"]');
  if (rememberBox) {
    rememberBox.addEventListener('change', function () {
      if (rememberBox.checked) store('stacklyRemember', valueOf('email'));
      else drop('stacklyRemember');
    });
  }

  /* ---------- prefill ---------- */
  if (isLogin) {
    var remembered = store('stacklyRemember');
    var emailCtl = controlIn('email');
    if (remembered && emailCtl) {
      emailCtl.value = remembered;
      if (rememberBox) rememberBox.checked = true;
    }
    /* sign-up hands the chosen role over so it is not a second decision */
    var wanted = '';
    try {
      wanted = (new URLSearchParams(win.location.search).get('role') || '').trim();
    } catch (e) {}
    var roleCtl = controlIn('role');
    if (wanted && ROLES[wanted] && roleCtl) roleCtl.value = wanted;
  }

  /* ---------- submit ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var names = isLogin ? ['email', 'password', 'role'] : ['name', 'email', 'password', 'confirm', 'role'];
    var firstBad = '';
    var allGood = true;

    names.forEach(function (name) {
      if (!validate(name)) {
        allGood = false;
        if (!firstBad) firstBad = name;
      }
    });

    if (!isLogin && termsBox && !termsBox.checked) {
      setBad('terms', 'You must accept the Terms and Privacy Policy.');
      if (!firstBad) firstBad = 'terms';
      allGood = false;
    }

    if (!allGood) {
      say('Fix the highlighted fields to continue.', true);
      if (firstBad) {
        var target = controlIn(firstBad) || (firstBad === 'terms' ? termsBox : null);
        if (target) win.setTimeout(function () { target.focus(); }, 60);
      }
      return;
    }

    var submit = form.querySelector('.abtn--solid');
    var label = submit ? submit.querySelector('.btn-label') : null;
    var icon = submit ? submit.querySelector('i') : null;
    if (submit) {
      submit.disabled = true;
      if (label) label.textContent = isLogin ? 'Opening\u2026' : 'Creating\u2026';
      if (icon) { icon.className = 'fa-solid fa-circle-notch fa-spinner'; }
    }

    var role = valueOf('role');
    var account = { name: valueOf('name'), email: valueOf('email'), role: role };

    if (isLogin) {
      /* reuse the name captured at sign-up so the greeting is not a guess */
      if (!account.name) {
        var saved = null;
        try { saved = JSON.parse(store('stacklyAccount') || 'null'); } catch (err) {}
        if (saved && saved.email === account.email && saved.role === role) account.name = saved.name;
      }
      if (!account.name) account.name = nameFromEmail(account.email);

      store('stacklyUser', JSON.stringify(account));
      /* only forget the address if "remember me" is not ticked */
      if (!form.querySelector('[name="remember"]') ||
          !form.querySelector('[name="remember"]').checked) {
        drop('stacklyRemember');
      }
      say('Welcome back \u2014 opening your ' + ROLES[role].label.toLowerCase() + ' desk.');
      win.setTimeout(function () { win.location.href = ROLES[role].file; }, 850);
    } else {
      store('stacklyAccount', JSON.stringify(account));
      say('Account created \u2014 taking you to sign in.');
      win.setTimeout(function () { win.location.href = 'login.html?role=' + encodeURIComponent(role); }, 850);
    }
  });

  /* ---------- entrance ---------- */
  var shell = doc.getElementById('authShell');
  function enter() {
    if (!shell) return;
    shell.classList.add('is-in');
  }
  if (REDUCED) enter();
  else if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', enter);
  else win.requestAnimationFrame(enter);

  /* Escape leaves the page rather than stranding anyone on a dead form */
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    win.location.href = '../index.html';
  });
})();

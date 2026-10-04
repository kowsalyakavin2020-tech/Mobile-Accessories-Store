/* =====================================================================
   Stackly — Mobile Accessories Store
   cart.js  ·  the belt, the tally and the order seal

   Reads and writes the shared StacklyCart store (localStorage key
   STACKLY_CART_V1, written by home.js) and renders everything the Cart
   page needs: line rows with quantity controls, removal with undo, the
   free-delivery meter, bulk and promo maths, the total that flips, the
   empty bag, the fly-to-cart add-ons and the order confirmation.

   home.js already owns the add-to-cart buttons on this page, so this
   file never adds an item a second time — it listens for the
   `stackly:cart` event that home.js dispatches and re-paints.
   ===================================================================== */

(function () {
  'use strict';

  var doc = document;
  var win = window;
  var CART_KEY = 'STACKLY_CART_V1';

  /* ---------- rules of the shop ---------- */
  var FREE_AT = 49;      /* free tracked delivery over this */
  var SHIP_STD = 6.90;   /* otherwise */
  var SHIP_EXP = 14.90;
  var TAX_RATE = 0.085;
  var BULK_AT = 3;       /* three of one line unlocks 5% off that line */
  var BULK_RATE = 0.05;

  var PROMOS = {
    STACKLY10: { pct: 10, cap: 40, say: 'STACKLY10 — 10% off, up to $40.' },
    GEAR15:    { pct: 15, units: 4, say: 'GEAR15 — 15% off when you buy four or more.' },
    FREESHIP:  { ship: true, say: 'FREESHIP — delivery on us, express too.' }
  };

  /* catalogue notes, keyed by the product ids used across the site */
  var META = {
    'fluxpad':       { cat: 'Charging', note: 'Qi2 15W · braided 1.5 m cable' },
    'sunvolt':       { cat: 'Power',    note: 'Folds flat · 21W solar panel' },
    'boomtwin':      { cat: 'Audio',    note: '40W stereo · 18 hours on a charge' },
    'gripmag':       { cat: 'Mounts',   note: 'N52 magnets · 12 arms · vent clip' },
    'pulseair':      { cat: 'Audio',    note: 'ANC · 8 h plus 24 h in the case' },
    'claritylens':   { cat: 'Camera',   note: 'Macro + wide telephoto clip', low: 3 },
    'corecell':      { cat: 'Power',    note: '20,000 mAh · 65W USB-C', low: 5 },
    'starterkit':    { cat: 'Bundles',  note: 'Charger, cable, case and mount', low: 5 },
    'aeroglass':     { cat: 'Cases',    note: 'Shock-soft TPU · drop rated 2 m' },
    'solarfold':     { cat: 'Power',    note: '20,000 mAh · folds down to a card' },
    'pulse-mini':    { cat: 'Audio',    note: 'Pocket case · 24 hours total' },
    'bolt-140':      { cat: 'Cables',   note: '140W braided · 2 m', low: 12 },
    'halo-anc':      { cat: 'Audio',    note: 'Hybrid ANC · 38 hours total' },
    'ceramic':       { cat: 'Cases',    note: '1.2 mm ceramic back', low: 2 },
    'kit-essential': { cat: 'Bundles',  note: 'The three we always recommend' },
    'kit-commute':   { cat: 'Bundles',  note: 'Saves $28 against the parts' },
    'kit-everything':{ cat: 'Bundles',  note: 'Saves $84 against the parts' }
  };

  var USUALS = [
    { id: 'gripmag',  name: 'GripMag Car Mount',       price: 27, img: 'product-4.webp' },
    { id: 'pulse-mini', name: 'Pulse Mini',            price: 69, img: 'product-3.webp' },
    { id: 'corecell', name: 'CoreCell 20K Power Bank', price: 72, img: 'arrival-3.webp' }
  ];

  /* ---------- tiny helpers ---------- */
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function r2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function money(n) { return '$' + r2(n).toFixed(2); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function base(src) { return String(src || '').split('?')[0].split('/').pop(); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(tag, cls, txt) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  var REDUCED = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function gsap() { return win.gsap || null; }
  function ST() { return win.ScrollTrigger || null; }

  /* ---------- the shared store (with a safety net) ---------- */
  var CART = win.StacklyCart;
  if (!CART) {
    CART = {
      read: function () {
        try { var v = localStorage.getItem(CART_KEY); return v ? JSON.parse(v) : []; } catch (e) { return []; }
      },
      write: function (items) {
        try { localStorage.setItem(CART_KEY, JSON.stringify(items || [])); } catch (e) {}
        if (win.StacklyCart && win.StacklyCart.paint) win.StacklyCart.paint();
      },
      count: function () { return this.read().reduce(function (n, i) { return n + (i.qty || 0); }, 0); },
      add: function (item) {
        var items = this.read(), hit = null;
        for (var i = 0; i < items.length; i++) if (items[i].id === item.id) hit = items[i];
        if (hit) hit.qty += 1; else items.push({ id: item.id, name: item.name, price: item.price, img: item.img, qty: 1 });
        this.write(items);
      },
      remove: function (id) { this.write(this.read().filter(function (i) { return i.id !== id; })); },
      clear: function () { this.write([]); }
    };
    win.StacklyCart = CART;
  }

  /* ---------- state ---------- */
  var S = {
    items: [],
    ids: {},
    ship: 'std',
    code: '',
    promoOk: false,
    undoOne: null,
    undoAll: null,
    order: null,
    writing: false,
    undoTimer: 0,
    toastTimer: 0
  };

  /* ---------- elements ---------- */
  var E = {};
  function grab() {
    var map = {
      list: '#caList', live: '#caLive', belt: '#caBelt', empty: '#caEmpty', emptyT: '#caEmptyT',
      usuals: '#caUsuals', rail: '.ca-belt__rail', tools: '.ca-belt__tools',
      tally: '#caTally', tallyN: '#caTallyN', sub: '#caSub', bulkRow: '#caBulkRow', bulk: '#caBulk',
      promoRow: '#caPromoRow', promo: '#caPromo', promoName: '#caPromoName', promoDrop: '#caPromoDrop',
      tax: '#caTax', total: '#caTotal', totalNote: '#caTotalNote', place: '#caPlace',
      codeForm: '#caCodeForm', code: '#caCode', codeGo: '#caCodeGo', codeMsg: '#caCodeMsg',
      shipStd: '#caShipStd', shipExp: '#caShipExp',
      meter: '#caMeter', shipCount: '#caShipCount', shipMsg: '#caShipMsg', shipFill: '#caShipFill',
      heroCount: '#caHeroCount', heroValue: '#caHeroValue', jump: '#caJump', jumpT: '#caJumpT',
      done: '#caDone', doneCard: '#caDoneCard', doneT: '#caDoneT', doneMsg: '#caDoneMsg',
      orderNo: '#caOrderNo', orderRef: '#caOrderRef', orderItems: '#caOrderItems',
      orderTotal: '#caOrderTotal', orderEta: '#caOrderEta', recap: '#caDoneRecap', print: '#caPrint',
      undo: '#caUndo', undoTx: '#caUndoTx', undoGo: '#caUndoGo', clear: '#caClear', cartBtn: '#cartBtn'
    };
    for (var k in map) if (Object.prototype.hasOwnProperty.call(map, k)) E[k] = $(map[k]);
  }

  /* ---------- data ---------- */
  function eta(qty, express) {
    if (express) return 'Next working day, before 18:00';
    var d = new Date();
    var days = qty >= 5 ? 5 : qty >= 3 ? 4 : 3;
    d.setDate(d.getDate() + days);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return 'Arrives ' + d.getDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
  }

  function read() {
    var raw = CART.read() || [];
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var it = raw[i] || {};
      var id = String(it.id || ('item-' + i));
      var q = Math.round(Number(it.qty) || 1);
      q = clamp(q, 1, 99);
      var p = Math.max(0, Number(it.price) || 0);
      var m = META[id] || {};
      var line = r2(p * q);
      out.push({
        id: id,
        name: String(it.name || 'Accessory'),
        price: p,
        qty: q,
        file: base(it.img) || 'cart-empty.webp',
        line: line,
        bulk: q >= BULK_AT ? r2(line * BULK_RATE) : 0,
        cat: m.cat || 'Accessories',
        note: m.note || 'Stocked on the shelf, ships from unit four',
        low: m.low || 0,
        eta: eta(q)
      });
    }
    return out;
  }

  function plain(it) {
    return { id: it.id, name: it.name, price: it.price, img: 'images/' + it.file, qty: it.qty };
  }

  function totals() {
    var units = 0, sub = 0, bulk = 0, i, it;
    for (i = 0; i < S.items.length; i++) {
      it = S.items[i];
      units += it.qty;
      sub += it.line;
      bulk += it.bulk;
    }
    sub = r2(sub);
    bulk = r2(bulk);
    var promo = 0;
    var p = S.promoOk ? PROMOS[S.code] : null;
    if (p && p.pct && (!p.units || units >= p.units)) promo = r2(Math.min((sub - bulk) * (p.pct / 100), p.cap || (sub - bulk)));
    var base2 = Math.max(0, r2(sub - bulk - promo));
    var freeShip = !!(p && p.ship);
    var std = (base2 >= FREE_AT || freeShip) ? 0 : SHIP_STD;
    var exp = freeShip ? 0 : SHIP_EXP;
    var ship = S.ship === 'exp' ? exp : std;
    if (!S.items.length) ship = 0;          /* nothing to charge for */
    var tax = r2(base2 * TAX_RATE);
    return {
      units: units, lines: S.items.length, sub: sub, bulk: bulk, promo: promo, base2: base2,
      ship: ship, std: std, exp: exp, tax: tax, total: r2(base2 + ship + tax),
      toFree: Math.max(0, r2(FREE_AT - base2)), free: base2 >= FREE_AT || freeShip
    };
  }

  function find(id) {
    for (var i = 0; i < S.items.length; i++) if (S.items[i].id === id) return S.items[i];
    return null;
  }

  /* ---------- messaging ---------- */
  function announce(msg) { if (E.live) E.live.textContent = msg; }

  function toast(title, text) {
    var t = $('#toast');
    if (!t) return;
    var a = $('#toastTitle'), b = $('#toastText');
    if (a) a.textContent = title;
    if (b) b.textContent = text;
    t.classList.add('on');
    clearTimeout(S.toastTimer);
    S.toastTimer = setTimeout(function () { t.classList.remove('on'); }, 3000);
  }

  /* ---------- rows ---------- */
  function rowHTML(it, isNew) {
    var dec = it.qty <= 1 ? ' disabled' : '';
    return '<li class="ca-row' + (isNew ? ' is-new' : '') + '" data-id="' + esc(it.id) + '">' +
      '<span class="ca-row__pic">' +
        '<img src="../images/' + esc(it.file) + '" alt="' + esc(it.name) + '" loading="lazy" width="120" height="120" />' +
        '<span class="ca-row__n">×' + it.qty + '</span>' +
        (it.low ? '<span class="ca-row__low">Only ' + it.low + ' left</span>' : '') +
      '</span>' +
      '<div class="ca-row__body">' +
        '<span class="ca-row__cat">' + esc(it.cat) + '</span>' +
        '<h3 class="ca-row__name">' + esc(it.name) + '</h3>' +
        '<p class="ca-row__meta"><i class="fa-solid fa-circle-check" aria-hidden="true"></i>' + esc(it.note) + '</p>' +
        '<p class="ca-row__eta"><i class="fa-solid fa-truck-fast" aria-hidden="true"></i>' + esc(it.eta) + '</p>' +
      '</div>' +
      '<div class="ca-row__ctrl">' +
        '<div class="ca-step" role="group" aria-label="Quantity for ' + esc(it.name) + '">' +
          '<button type="button" class="ca-step__b" data-act="dec" aria-label="One fewer ' + esc(it.name) + '"' + dec + '><i class="fa-solid fa-minus" aria-hidden="true"></i></button>' +
          '<span class="ca-step__n">' + it.qty + '</span>' +
          '<button type="button" class="ca-step__b" data-act="inc" aria-label="One more ' + esc(it.name) + '"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>' +
        '</div>' +
        '<button type="button" class="ca-row__rm" data-act="rm" aria-label="Remove ' + esc(it.name) + ' from the bag"><i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Remove</span></button>' +
      '</div>' +
      '<div class="ca-row__money">' +
        '<span class="ca-row__unit">' + money(it.price) + ' each</span>' +
        '<span class="ca-row__line">' + money(it.line) + '</span>' +
        (it.bulk ? '<span class="ca-row__save">3+ saves ' + money(it.bulk) + '</span>' : '') +
      '</div>' +
    '</li>';
  }

  function paintRows(prev) {
    if (!E.list) return;
    var a = doc.activeElement;
    var keep = '';
    if (a && a.getAttribute && a.getAttribute('data-act') && E.list.contains(a)) {
      var row = a.closest('.ca-row');
      if (row) keep = row.getAttribute('data-id') + '|' + a.getAttribute('data-act');
    }
    var html = '', fresh = [];
    for (var i = 0; i < S.items.length; i++) {
      var isNew = !prev[S.items[i].id];
      html += rowHTML(S.items[i], isNew);
      if (isNew) fresh.push(S.items[i].id);
    }
    E.list.innerHTML = html;
    if (keep) {
      var parts = keep.split('|');
      var back = E.list.querySelector('.ca-row[data-id="' + parts[0] + '"] [data-act="' + parts[1] + '"]');
      if (back && !back.disabled) { try { back.focus(); } catch (e) {} }
    }
    if (fresh.length && E.list.children.length) {
      var g = gsap();
      if (g && !REDUCED) {
        g.from(E.list.querySelectorAll('.ca-row.is-new'), {
          x: -26, opacity: 0, duration: .62, stagger: .07, ease: 'power3.out',
          onComplete: function () { $$('.ca-row.is-new', E.list).forEach(function (r) { r.classList.remove('is-new'); }); }
        });
      } else {
        $$('.ca-row.is-new', E.list).forEach(function (r) { r.classList.remove('is-new'); });
      }
    }
  }

  /* ---------- totals ---------- */
  function setTotal(txt) {
    if (!E.total) return;
    var b = E.total.querySelector('b');
    if (!b) return;
    if (b.textContent === txt) return;
    var g = gsap();
    if (!g || REDUCED) { b.textContent = txt; return; }
    E.total.classList.remove('is-flip');
    void E.total.offsetWidth;
    E.total.classList.add('is-flip');
    setTimeout(function () { b.textContent = txt; }, 245);
    setTimeout(function () { E.total.classList.remove('is-flip'); }, 680);
  }

  function countTo(node, to, fmt) {
    if (!node) return;
    var from = parseFloat(node.getAttribute('data-v') || '0') || 0;
    node.setAttribute('data-v', String(to));
    if (from === to) { node.textContent = fmt(to); return; }
    var g = gsap();
    if (!g || REDUCED) { node.textContent = fmt(to); return; }
    var o = { v: from };
    g.to(o, {
      v: to, duration: .65, ease: 'power2.out',
      onUpdate: function () { node.textContent = fmt(o.v); }
    });
  }

  function paintSummary(t, empty) {
    if (E.sub) E.sub.textContent = money(t.sub);
    if (E.bulkRow) E.bulkRow.classList.toggle('is-off', t.bulk <= 0);
    if (E.bulk) E.bulk.textContent = '−' + money(t.bulk);
    if (E.promoRow) E.promoRow.classList.toggle('is-off', !S.promoOk);
    if (E.promo) E.promo.textContent = t.promo > 0 ? '−' + money(t.promo) : '—';
    if (E.promoName) E.promoName.textContent = S.promoOk ? S.code : '';
    if (E.shipStd) E.shipStd.textContent = t.std === 0 ? 'Free' : money(t.std);
    if (E.shipExp) E.shipExp.textContent = t.exp === 0 ? 'Free' : money(t.exp);
    if (E.tax) E.tax.textContent = money(t.tax);
    if (E.totalNote) E.totalNote.textContent = S.ship === 'exp' ? 'express delivery' : 'tax included';
    setTotal(money(t.total));
    if (E.tallyN) E.tallyN.textContent = t.units + (t.units === 1 ? ' item' : ' items');
    if (E.place) {
      E.place.classList.toggle('is-empty', empty);
      E.place.classList.toggle('is-full', !empty);
      E.place.setAttribute('aria-disabled', empty ? 'true' : 'false');
    }
    setOff(E.code, empty);
    setOff(E.codeGo, empty);
    setOff(E.promoDrop, empty || !S.promoOk);
    var radios = doc.getElementsByName('caShip');
    for (var i = 0; i < radios.length; i++) radios[i].disabled = empty;
  }

  function setOff(node, off) { if (node) node.disabled = !!off; }

  function paintHero(t) {
    countTo(E.heroCount, t.units, function (v) { return String(Math.round(v)); });
    countTo(E.heroValue, t.sub, function (v) { return money(v); });
    if (E.shipCount) E.shipCount.textContent = t.units + (t.units === 1 ? ' item' : ' items') + ' in the bag';
    if (E.shipMsg) E.shipMsg.textContent = t.free ? 'Free tracked delivery unlocked' : money(t.toFree) + ' to free delivery';
    if (E.shipFill) E.shipFill.style.width = Math.round(clamp(t.base2 / FREE_AT, 0, 1) * 100) + '%';
    if (E.meter) E.meter.classList.toggle('is-full', t.free);
  }

  function paintAddOns() {
    var cards = $$('.ca-add, .ca-mini');
    for (var i = 0; i < cards.length; i++) {
      var btn = cards[i].querySelector('[data-id]');
      if (!btn) continue;
      cards[i].classList.toggle('is-in', !!find(btn.getAttribute('data-id')));
    }
  }

  function paintStates(empty) {
    var placed = !!S.order;
    if (E.belt) E.belt.hidden = empty || placed;
    if (E.empty) E.empty.hidden = !empty || placed;
    if (E.done) E.done.hidden = !placed;
    if (E.list) E.list.hidden = empty;
    if (E.rail) E.rail.hidden = empty;
    if (E.tools) E.tools.hidden = empty;
    if (E.jumpT) E.jumpT.textContent = empty ? 'Fill the empty bag' : 'Jump to the total';
  }

  function paint(o) {
    o = o || {};
    var prev = S.ids;
    var next = {};
    S.items = read();
    for (var i = 0; i < S.items.length; i++) next[S.items[i].id] = S.items[i].qty;
    S.ids = next;
    var empty = S.items.length === 0;
    var t = totals();
    if (o.rows !== false) paintRows(prev);
    paintSummary(t, empty);
    paintHero(t);
    paintStates(empty);
    paintAddOns();
    if (o.announce) announce(o.announce);
    if (o.after) o.after();
    if (empty !== S.wasEmpty) {
      S.wasEmpty = empty;
      if (empty) revealEmpty();
    }
  }

  function commit(msg, opts) {
    var items = S.items.map(plain);
    S.writing = true;
    try { CART.write(items); } catch (e) {}
    S.writing = false;
    paint(Object.assign({ announce: msg }, opts || {}));
  }

  function sync() {
    if (S.writing) return;
    if (S.order && CART.count() > 0) S.order = null;   /* they started a new bag */
    paint();
  }

  /* ---------- actions ---------- */
  function setQty(id, delta) {
    var it = find(id);
    if (!it) return;
    var q = clamp(it.qty + delta, 0, 99);
    if (q === 0) return removeOne(id);
    it.qty = q;
    it.line = r2(it.price * q);
    it.bulk = q >= BULK_AT ? r2(it.line * BULK_RATE) : 0;
    it.eta = eta(q);
    commit(it.name + ' — quantity now ' + q, {
      after: function () {
        var row = E.list && E.list.querySelector('.ca-row[data-id="' + id + '"]');
        if (!row) return;
        var n = row.querySelector('.ca-step__n');
        if (n) { n.classList.remove('is-pop'); void n.offsetWidth; n.classList.add('is-pop'); }
        var line = row.querySelector('.ca-row__line');
        if (line) { line.classList.remove('is-fresh'); void line.offsetWidth; line.classList.add('is-fresh'); }
      }
    });
  }

  function removeOne(id) {
    var it = find(id);
    if (!it) return;
    S.undoOne = it;
    S.undoAll = null;
    S.items = S.items.filter(function (x) { return x.id !== id; });
    var row = E.list && E.list.querySelector('.ca-row[data-id="' + id + '"]');
    var finish = function () {
      commit(it.name + ' removed from the bag');
      flashUndo(it.name + ' removed');
    };
    var g = gsap();
    if (row && g && !REDUCED) {
      row.classList.add('is-out');
      g.to(row, {
        xPercent: -108, opacity: 0, duration: .44, ease: 'power3.in',
        onComplete: function () { if (row.parentNode) row.parentNode.removeChild(row); finish(); }
      });
    } else finish();
  }

  function flashUndo(text) {
    if (!E.undo || !E.undoTx) return;
    E.undoTx.textContent = text;
    E.undo.hidden = false;
    clearTimeout(S.undoTimer);
    setTimeout(function () { E.undo.classList.add('is-on'); }, 20);
    S.undoTimer = setTimeout(hideUndo, 6500);
  }

  function hideUndo() {
    if (!E.undo) return;
    clearTimeout(S.undoTimer);
    E.undo.classList.remove('is-on');
    setTimeout(function () { E.undo.hidden = true; }, 480);
  }

  function undo() {
    var back = S.undoAll || S.undoOne;
    if (!back) return;
    var merged = S.undoAll ? S.undoAll.concat(S.items) : S.items.slice();
    if (!S.undoAll) {
      var hit = null, i;
      for (i = 0; i < merged.length; i++) if (merged[i].id === back.id) hit = merged[i];
      if (hit) hit.qty += back.qty; else merged.unshift(back);
    } else {
      /* one line per id, keeping the restored quantity on top */
      var seen = {}, out = [];
      for (var j = 0; j < merged.length; j++) {
        if (seen[merged[j].id]) { seen[merged[j].id].qty += merged[j].qty; continue; }
        seen[merged[j].id] = merged[j];
        out.push(merged[j]);
      }
      merged = out;
    }
    S.items = merged;
    S.undoOne = null;
    S.undoAll = null;
    hideUndo();
    commit('Put back in the bag', {
      after: function () {
        var row = E.list && E.list.querySelector('.ca-row');
        if (row) { try { row.querySelector('[data-act="inc"]').focus(); } catch (e) {} }
      }
    });
  }

  function emptyBag() {
    if (!S.items.length) return;
    S.undoAll = S.items.slice();
    S.undoOne = null;
    S.items = [];
    commit('Bag emptied', { after: function () { if (E.emptyT) { try { E.emptyT.focus(); } catch (e) {} } } });
    flashUndo('Bag emptied');
  }

  function addUsuals() {
    var items = CART.read().slice();
    for (var i = 0; i < USUALS.length; i++) {
      var u = USUALS[i], hit = null;
      for (var j = 0; j < items.length; j++) if (items[j].id === u.id) hit = items[j];
      if (hit) hit.qty += 1;
      else items.push({ id: u.id, name: u.name, price: u.price, img: 'images/' + u.img, qty: 1 });
    }
    S.writing = true;
    try { CART.write(items); } catch (e) {}
    S.writing = false;
    paint({ announce: 'Three usuals added' });
  }

  function applyCode(raw) {
    var code = String(raw || '').trim().toUpperCase();
    if (!code) { S.code = ''; S.promoOk = false; paintSummary(totals(), !S.items.length); return; }
    var p = PROMOS[code];
    if (!p) {
      S.promoOk = false;
      S.code = code;
      codeMsg('We could not match ' + code + '. Try STACKLY10.', false);
      paintSummary(totals(), !S.items.length);
      announce('Promo code ' + code + ' not recognised.');
      return;
    }
    var units = 0;
    for (var u = 0; u < S.items.length; u++) units += S.items[u].qty;
    if (p.units && units < p.units) {
      S.promoOk = false;
      S.code = code;
      var need = p.units - units;
      codeMsg('Add ' + need + ' more unit' + (need === 1 ? '' : 's') + ' to unlock ' + code + '.', false);
      paintSummary(totals(), !S.items.length);
      announce('Code ' + code + ' needs ' + p.units + ' units. You have ' + units + '.');
      return;
    }
    S.code = code;
    S.promoOk = true;
    codeMsg(p.say, true);
    paintSummary(totals(), !S.items.length);
    announce('Promo code ' + code + ' applied.');
  }

  function codeMsg(text, ok) {
    if (!E.codeMsg) return;
    E.codeMsg.textContent = text;
    E.codeMsg.classList.remove('is-ok', 'is-bad');
    if (text) E.codeMsg.classList.add(ok ? 'is-ok' : 'is-bad');
  }

  function dropCode() {
    S.code = '';
    S.promoOk = false;
    if (E.code) E.code.value = '';
    codeMsg('', true);
    paintSummary(totals(), !S.items.length);
    announce('Promo code removed.');
  }

  function setShip(v) {
    S.ship = v;
    var radios = doc.getElementsByName('caShip');
    for (var i = 0; i < radios.length; i++) radios[i].checked = radios[i].value === v;
    paintSummary(totals(), !S.items.length);
    announce(v === 'exp' ? 'Express delivery selected.' : 'Standard delivery selected.');
  }

  /* ---------- fly to the header cart ---------- */
  function fly(fromRect, src) {
    var g = gsap();
    var target = E.cartBtn || $('.cart-btn');
    if (!g || !fromRect || !target || REDUCED) return;
    var to = target.getBoundingClientRect();
    var ghost = doc.createElement('img');
    ghost.className = 'ca-fly';
    ghost.alt = '';
    ghost.src = '../images/' + base(src);
    ghost.style.left = fromRect.left + 'px';
    ghost.style.top = fromRect.top + 'px';
    ghost.style.width = fromRect.width + 'px';
    ghost.style.height = fromRect.height + 'px';
    doc.body.appendChild(ghost);
    g.fromTo(ghost,
      { x: 0, y: 0, scale: 1, rotate: 0, opacity: .95 },
      {
        x: (to.left + to.width / 2) - (fromRect.left + fromRect.width / 2),
        y: (to.top + to.height / 2) - (fromRect.top + fromRect.height / 2),
        scale: .1, rotate: 26, opacity: .15,
        duration: .82, ease: 'power3.inOut',
        onComplete: function () {
          if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
          if (target) { target.classList.remove('pop'); void target.offsetWidth; target.classList.add('pop'); }
        }
      });
  }

  /* ---------- scroll choreography ---------- */
  function clipIn(nodes, offset) {
    var g = gsap();
    if (!nodes.length) return;
    if (!g || REDUCED) return;
    g.fromTo(nodes,
      { clipPath: 'inset(0 0 100% 0)', y: 16 + (offset || 0) },
      { clipPath: 'inset(0 0 0% 0)', y: 0, duration: .95, stagger: .06, ease: 'power3.out', clearProps: 'all' });
  }

  function reveal() {
    var g = gsap();
    var st = ST();
    if (!g) return;
    if (REDUCED) return;

    g.from('.ca-mask > span', { yPercent: 120, duration: 1.05, stagger: .1, ease: 'expo.out', delay: .1, clearProps: 'transform' });
    g.from('[data-ca-h]', { y: 26, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out', delay: .2, clearProps: 'opacity,transform' });

    if (st) {
      st.batch('[data-ca-r="clip"]', {
        start: 'top 88%',
        once: true,
        onEnter: function (batch) {
          var live = [], i;
          for (i = 0; i < batch.length; i++) {
            if (!batch[i].closest || !batch[i].closest('#caEmpty')) live.push(batch[i]);
          }
          clipIn(live, 0);   /* the empty bag is revealed by revealEmpty() instead */
        }
      });
      g.to('#caShot', {
        yPercent: 14, ease: 'none',
        scrollTrigger: { trigger: '#caBay', start: 'top top', end: 'bottom top', scrub: true }
      });
    }
  }

  function revealEmpty() {
    if (E.empty && !E.empty.hidden) {
      clipIn(Array.prototype.slice.call(E.empty.querySelectorAll('[data-ca-r="clip"]')), 0);
    }
    var st = ST();
    if (st) { try { st.refresh(); } catch (e) {} }
  }

  /* ---------- events ---------- */
  function wire() {
    if (E.list) {
      E.list.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('[data-act]') : null;
        if (!btn || !E.list.contains(btn)) return;
        var row = btn.closest('.ca-row');
        if (!row) return;
        var id = row.getAttribute('data-id');
        var act = btn.getAttribute('data-act');
        if (act === 'rm') removeOne(id);
        else if (act === 'inc') setQty(id, 1);
        else if (act === 'dec') setQty(id, -1);
      });
    }

    if (E.tally) {
      E.tally.addEventListener('change', function (e) {
        if (e.target && e.target.name === 'caShip') setShip(e.target.value);
      });
    }

    if (E.codeForm) {
      E.codeForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var raw = E.code ? String(E.code.value).trim() : '';
        if (!raw) {
          codeMsg('Enter a promo code first.', false);
          announce('Enter a promo code first.');
          return;
        }
        win.location.href = '404.html';
      });
    }
    if (E.promoDrop) E.promoDrop.addEventListener('click', dropCode);
    if (E.place) E.place.addEventListener('click', function () { win.location.href = '404.html'; });
    if (E.clear) E.clear.addEventListener('click', emptyBag);
    if (E.usuals) E.usuals.addEventListener('click', addUsuals);
    if (E.undoGo) E.undoGo.addEventListener('click', undo);
    if (E.print) E.print.addEventListener('click', function () { win.print(); });

    /* the add-on cards: home.js owns the add, we only fly the image across */
    doc.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.add-to-cart') : null;
      if (!btn) return;
      var card = btn.closest('.ca-add, .ca-mini');
      var pic = card && card.querySelector('img');
      if (pic) fly(pic.getBoundingClientRect(), btn.getAttribute('data-img') || pic.getAttribute('src'));
    }, true);

    doc.addEventListener('stackly:cart', sync);
    win.addEventListener('storage', function (e) { if (e.key === CART_KEY) sync(); });
  }

  /* ---------- boot ---------- */
  function boot() {
    grab();
    if (win.gsap && win.ScrollTrigger && win.gsap.registerPlugin) {
      try { win.gsap.registerPlugin(win.ScrollTrigger); } catch (e) {}
    }
    S.ship = (doc.querySelector('input[name="caShip"]:checked') || {}).value || 'std';
    S.items = read();
    paint();
    wire();
    if (doc.fonts && doc.fonts.ready) {
      doc.fonts.ready.then(function () { var st = ST(); if (st) st.refresh(); });
    }
    setTimeout(reveal, 90);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();

})();

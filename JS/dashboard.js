/* =====================================================================
   dashboard.js  —  Stackly · Mobile Accessories Store
   Shared by supplier.html (Seller) + buyer.html (Buyer).

   Everything role-specific lives in two places: ROLE_CONFIG for the
   sidebar, and VIEWS for the page bodies. The shell around them —
   drawer, header, search, bell, toasts — is identical on both.

   localStorage contract:
     stacklyUser    { name, email, role }   written by auth.js
     stacklyAccount { name, email, role }   written at sign-up
   ===================================================================== */

(function () {
  'use strict';

  var doc = document;
  var win = window;

  var REDUCED = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- role contract ----------
     seller lands on supplier.html, so the file cannot be guessed from
     the role value. Keep the map explicit. */
  var ROLE_FILE = { buyer: 'buyer.html', seller: 'supplier.html' };

  var DRAWER_AT = 900;

  /* =============================================================
     1 · AUTH GUARD
     ============================================================= */
  function readUser() {
    try { return JSON.parse(win.localStorage.getItem('stacklyUser') || 'null'); }
    catch (e) { return null; }
  }

  var user = readUser();
  var pageRole = doc.documentElement.getAttribute('data-dash-role') || 'buyer';

  if (!user || !ROLE_FILE[user.role]) {
    win.location.href = 'login.html';
    return;
  }

  if (user.role !== pageRole) {
    win.location.href = ROLE_FILE[user.role];
    return;
  }

  var initial = (user.name || 'G').trim().charAt(0).toUpperCase() || 'G';

  /* =============================================================
     2 · DATA
     ============================================================= */
  var DATA = {
    seller: {
      stats: {
        overview: [
          { icon: 'fa-box-open', val: '5', lab: 'Live listings' },
          { icon: 'fa-receipt', val: '38', lab: 'Orders this week' },
          { icon: 'fa-sack-dollar', val: '$2,480', lab: 'Revenue this week' },
          { icon: 'fa-star', val: '4.9', lab: 'Store rating' }
        ],
        listings: [
          { icon: 'fa-box-open', val: '5', lab: 'Live listings' },
          { icon: 'fa-triangle-exclamation', val: '1', lab: 'Low on stock' },
          { icon: 'fa-eye-slash', val: '1', lab: 'Sold out' },
          { icon: 'fa-layer-group', val: '196', lab: 'Units in warehouse' }
        ],
        orders: [
          { icon: 'fa-receipt', val: '12', lab: 'Awaiting action' },
          { icon: 'fa-truck-fast', val: '9', lab: 'In transit' },
          { icon: 'fa-circle-check', val: '142', lab: 'Delivered' },
          { icon: 'fa-rotate-left', val: '4', lab: 'Refunds opened' }
        ],
        analytics: [
          { icon: 'fa-arrow-trend-up', val: '+18%', lab: 'Week over week' },
          { icon: 'fa-eye', val: '9,412', lab: 'Store views' },
          { icon: 'fa-cart-shopping', val: '3.1%', lab: 'Conversion rate' },
          { icon: 'fa-clock', val: '1.4 days', lab: 'Average fulfilment' }
        ]
      },

      listings: [
        { img: '../images/product-1.webp', name: 'Aurora Buds Pro', sku: 'AU-2201', stock: 42, price: '$89.00', status: 'Active' },
        { img: '../images/product-2.webp', name: 'Volt 65W GaN Charger', sku: 'VO-1180', stock: 118, price: '$34.00', status: 'Active' },
        { img: '../images/product-3.webp', name: 'Flux Mag Power 10K', sku: 'FX-3390', stock: 9, price: '$49.00', status: 'Low stock' },
        { img: '../images/product-4.webp', name: 'Halo Watch S2', sku: 'HA-5521', stock: 27, price: '$149.00', status: 'Active' },
        { img: '../images/cat-cases.webp', name: 'Vault Hard Case', sku: 'VL-7702', stock: 0, price: '$19.00', status: 'Sold out' }
      ],

      orders: [
        { id: '#ST-40921', who: 'Maya Okonkwo', img: '../images/product-1.webp', item: 'Aurora Buds Pro', total: '$89.00', status: 'Packed' },
        { id: '#ST-40918', who: 'Dev Raman', img: '../images/product-2.webp', item: 'Volt 65W GaN Charger', total: '$34.00', status: 'Shipped' },
        { id: '#ST-40904', who: 'Iris Lund', img: '../images/product-3.webp', item: 'Flux Mag Power 10K', total: '$49.00', status: 'Awaiting stock' },
        { id: '#ST-40897', who: 'Tom Beckett', img: '../images/product-4.webp', item: 'Halo Watch S2', total: '$149.00', status: 'Delivered' },
        { id: '#ST-40880', who: 'Sara Nilsen', img: '../images/product-1.webp', item: 'Aurora Buds Pro', total: '$89.00', status: 'Refunded' }
      ],

      readiness: [
        { l: 'Aurora Buds Pro — packaging copy', v: 92 },
        { l: 'Volt 65W GaN — certification images', v: 64 },
        { l: 'Halo Watch S2 — unboxing video', v: 38 }
      ],

      tasks: [
        { l: 'Ship the three packed orders', s: 'Today · carrier pickup 4pm', done: false },
        { l: 'Restock Flux Mag Power 10K', s: '9 units left · reorder at 15', done: true },
        { l: 'Answer the two open buyer threads', s: 'Oldest waiting 2h', done: false }
      ],

      activity: [
        { icon: 'fa-receipt', text: 'Order #ST-40921 was packed', time: '2 hours ago' },
        { icon: 'fa-eye', text: 'Halo Watch S2 passed 1,000 views', time: 'Today' },
        { icon: 'fa-triangle-exclamation', text: 'Flux Mag Power 10K dropped to 9 units', time: 'Yesterday' }
      ],

      threads: [
        { img: '../images/avatar-1.webp', name: 'Maya Okonkwo', sub: 'Does the Buds Pro case ship separately?' },
        { img: '../images/avatar-2.webp', name: 'Dev Raman', sub: 'Tracking for #ST-40918 never arrived' },
        { img: '../images/avatar-3.webp', name: 'Iris Lund', sub: 'Happy to wait for the power bank restock' }
      ],

      chart: [
        { l: 'Mon', v: 38 }, { l: 'Tue', v: 52 }, { l: 'Wed', v: 44 },
        { l: 'Thu', v: 71 }, { l: 'Fri', v: 64 }, { l: 'Sat', v: 88 }, { l: 'Sun', v: 31 }
      ]
    },

    buyer: {
      stats: {
        overview: [
          { icon: 'fa-bag-shopping', val: '2', lab: 'Orders in transit' },
          { icon: 'fa-box-open', val: '14', lab: 'Lifetime orders' },
          { icon: 'fa-gem', val: '2,150', lab: 'Reward points' },
          { icon: 'fa-heart', val: '6', lab: 'Saved items' }
        ],
        purchases: [
          { icon: 'fa-truck-fast', val: '2', lab: 'In transit' },
          { icon: 'fa-clock', val: '1', lab: 'Processing' },
          { icon: 'fa-circle-check', val: '14', lab: 'Delivered' },
          { icon: 'fa-rotate-left', val: '1', lab: 'Return in progress' }
        ],
        wishlist: [
          { icon: 'fa-heart', val: '6', lab: 'Saved items' },
          { icon: 'fa-bolt', val: '2', lab: 'Price drops' },
          { icon: 'fa-bell', val: '1', lab: 'Back-in-stock alerts' },
          { icon: 'fa-cart-shopping', val: '3', lab: 'In your bag' }
        ],
        rewards: [
          { icon: 'fa-gem', val: '2,150', lab: 'Points balance' },
          { icon: 'fa-ranking-star', val: 'Gold', lab: 'Member tier' },
          { icon: 'fa-gift', val: '780', lab: 'Points to next tier' },
          { icon: 'fa-percent', val: '3×', lab: 'Points per dollar' }
        ]
      },

      purchases: [
        { id: '#ST-40918', img: '../images/product-2.webp', name: 'Volt 65W GaN Charger', date: 'Delivered 12 Oct', total: '$34.00', status: 'Delivered' },
        { id: '#ST-40871', img: '../images/product-3.webp', name: 'Flux Mag Power 10K', date: 'Out for delivery', total: '$49.00', status: 'In transit' },
        { id: '#ST-40933', img: '../images/product-4.webp', name: 'Halo Watch S2', date: 'Placed today', total: '$149.00', status: 'Processing' },
        { id: '#ST-40790', img: '../images/cat-cases.webp', name: 'Vault Hard Case', date: 'Return opened 3 Oct', total: '$19.00', status: 'Returning' }
      ],

      wishlist: [
        { img: '../images/product-1.webp', name: 'Aurora Buds Pro', sku: 'AU-2201', price: '$89.00', status: 'In stock' },
        { img: '../images/product-3.webp', name: 'Flux Mag Power 10K', sku: 'FX-3390', price: '$49.00', status: 'Low stock' },
        { img: '../images/cat-cases.webp', name: 'Vault Hard Case', sku: 'VL-7702', price: '$19.00', status: 'Sold out' },
        { img: '../images/cat-speakers.webp', name: 'Resonance Mini Speaker', sku: 'RE-8840', price: '$59.00', status: 'In stock' }
      ],

      rewards: [
        { l: 'Gold member tier', v: 72 },
        { l: 'Early-bird badge', v: 40 },
        { l: 'Ten-orders milestone', v: 100 }
      ],

      tasks: [
        { l: 'Leave a review for the GaN charger', s: 'Delivered 12 Oct · 30 days left', done: false },
        { l: 'Confirm the power bank address', s: 'Out for delivery today', done: true },
        { l: 'Redeem 500 points for $5 off', s: 'Available right now', done: false }
      ],

      activity: [
        { icon: 'fa-truck-fast', text: 'Flux Mag Power 10K is out for delivery', time: '2 hours ago' },
        { icon: 'fa-gem', text: 'You earned 147 points on the last order', time: 'Today' },
        { icon: 'fa-heart', text: 'Aurora Buds Pro dropped 12% in price', time: 'Yesterday' }
      ],

      threads: [
        { img: '../images/avatar-1.webp', name: 'Stackly Support', sub: 'Your GaN charger return was approved' },
        { img: '../images/avatar-2.webp', name: 'Aurora Audio', sub: 'Buds Pro firmware 3.1 is live' },
        { img: '../images/avatar-3.webp', name: 'Stackly Support', sub: 'Reward points never expire on Gold' }
      ],

      chart: [
        { l: 'Mon', v: 22 }, { l: 'Tue', v: 48 }, { l: 'Wed', v: 35 },
        { l: 'Thu', v: 60 }, { l: 'Fri', v: 42 }, { l: 'Sat', v: 78 }, { l: 'Sun', v: 26 }
      ]
    }
  };

  var D = DATA[pageRole];

  /* =============================================================
     3 · TEMPLATE HELPERS
     ============================================================= */
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* every action on both dashboards is a placeholder, exactly as in the
     reference site, so they all resolve to the 404 page */
  var DEAD = '404.html';

  function dead() { return DEAD; }

  var PILL = {
    Active: 'ok', Delivered: 'ok', Completed: 'ok', Shipped: 'ok', Packed: 'ok', Confirmed: 'ok',
    Processing: 'warn', Pending: 'warn', 'Awaiting stock': 'warn', 'In transit': 'warn',
    'Low stock': 'warn', 'Out for delivery': 'warn',
    Sold: 'bad', Cancelled: 'bad', Refunded: 'bad', Returning: 'bad',
    'Sold out': 'mute'
  };

  function pill(status) {
    return '<span class="pill pill--' + (PILL[status] || 'mute') + '">' + esc(status) + '</span>';
  }

  function hero(tag, icon, title, sub, action) {
    return '' +
      '<div class="card-hero">' +
        '<div>' +
          '<p class="hero-tag"><i class="fa-solid ' + icon + '" aria-hidden="true"></i>' + esc(tag) + '</p>' +
          '<h3 class="hero-title">' + esc(title) + '</h3>' +
          '<p class="hero-sub">' + esc(sub) + '</p>' +
        '</div>' +
        '<a class="btn" href="' + esc(action.href) + '"><i class="fa-solid ' + action.icon + '" aria-hidden="true"></i>' + esc(action.label) + '</a>' +
      '</div>';
  }

  function stats(key) {
    var items = (D.stats[key] || []);
    return '<div class="stat-strip">' + items.map(function (it) {
      return '<div class="stat-cell">' +
        '<i class="fa-solid ' + it.icon + '" aria-hidden="true"></i>' +
        '<div><strong>' + esc(it.val) + '</strong><span>' + esc(it.lab) + '</span></div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function panel(title, inner, action) {
    return '<section class="panel">' +
      '<div class="panel__head"><h3>' + esc(title) + '</h3>' +
      (action ? '<a href="' + esc(action.href) + '">' + esc(action.label) + '</a>' : '') +
      '</div>' + inner + '</section>';
  }

  function table(headers, rows) {
    return '<div class="table-wrap"><table class="table"><thead><tr>' +
      headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      rows.map(function (cells) {
        return '<tr>' + cells.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
      }).join('') +
      '</tbody></table></div>';
  }

  function prodCell(img, title, sub) {
    return '<div class="cell-prod"><img src="' + esc(img) + '" alt="" />' +
      '<div><strong>' + esc(title) + '</strong><span>' + esc(sub) + '</span></div></div>';
  }

  function list(items) {
    return items.map(function (it) {
      return '<div class="row"><div class="row__ico row__ico--img"><img src="' + esc(it.img) + '" alt="" /></div>' +
        '<div><strong>' + esc(it.name) + '</strong><span>' + esc(it.sub) + '</span></div></div>';
    }).join('');
  }

  function feed(items) {
    return items.map(function (it) {
      return '<div class="row"><div class="row__ico"><i class="fa-solid ' + it.icon + '" aria-hidden="true"></i></div>' +
        '<div><strong>' + esc(it.text) + '</strong><span>' + esc(it.time) + '</span></div></div>';
    }).join('');
  }

  function todos(items) {
    return items.map(function (it) {
      return '<div class="todo' + (it.done ? ' is-done' : '') + '">' +
        '<i class="fa-solid ' + (it.done ? 'fa-circle-check' : 'fa-regular fa-circle') + '" aria-hidden="true"></i>' +
        '<div><strong>' + esc(it.l) + '</strong><span>' + esc(it.s) + '</span></div></div>';
    }).join('');
  }

  function progress(rows) {
    return rows.map(function (r) {
      return '<div class="prog"><div class="prog__top"><span>' + esc(r.l) + '</span><span>' + r.v + '%</span></div>' +
        '<div class="prog__track"><div class="prog__fill" data-w="' + r.v + '"></div></div></div>';
    }).join('');
  }

  function chart(title) {
    var max = Math.max.apply(null, D.chart.map(function (d) { return d.v; })) || 1;
    return panel(title,
      '<div class="chart">' + D.chart.map(function (d) {
        return '<div class="chart__col"><div class="chart__bar" data-h="' + Math.round(d.v / max * 128) + '"></div><span>' + esc(d.l) + '</span></div>';
      }).join('') + '</div>');
  }

  function quick(title, actions) {
    return panel(title, '<div class="quick">' + actions.map(function (a) {
      return '<a href="' + esc(a.href) + '"><i class="fa-solid ' + a.icon + '" aria-hidden="true"></i>' + esc(a.label) + '</a>';
    }).join('') + '</div>');
  }

  /* ---- extra blocks used to give each view real depth ---- */
  function tiles(items) {
    return '<div class="tiles">' + items.map(function (it) {
      return '<article class="tile">' +
        '<span class="tile__top"><i class="fa-solid ' + it.icon + '" aria-hidden="true"></i>' + esc(it.k) + '</span>' +
        '<strong>' + esc(it.v) + '</strong>' +
        '<span>' + esc(it.n) + '</span>' +
      '</article>';
    }).join('') + '</div>';
  }

  function kv(rows) {
    return '<div class="kv">' + rows.map(function (r) {
      return '<div class="kv__row"><span>' + esc(r[0]) + '</span><strong>' + esc(r[1]) + '</strong></div>';
    }).join('') + '</div>';
  }

  function timeline(items) {
    return '<div class="timeline">' + items.map(function (it) {
      return '<article class="tl' + (it.state ? ' tl--' + it.state : '') + '">' +
        '<span class="tl__dot"><i class="fa-solid ' + it.icon + '" aria-hidden="true"></i></span>' +
        '<div><strong>' + esc(it.l) + '</strong><span>' + esc(it.s) + '</span>' +
        (it.p ? '<p>' + esc(it.p) + '</p>' : '') + '</div>' +
      '</article>';
    }).join('') + '</div>';
  }

  function steps(items) {
    return '<div class="steps">' + items.map(function (it, i) {
      return '<article class="step">' +
        '<span class="step__n">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</span>' +
        '<strong>' + esc(it.l) + '</strong><p>' + esc(it.p) + '</p>' +
      '</article>';
    }).join('') + '</div>';
  }

  function note(text, icon, tone) {
    return '<div class="note' + (tone ? ' note--' + tone : '') + '">' +
      '<i class="fa-solid ' + (icon || 'fa-circle-info') + '" aria-hidden="true"></i>' +
      '<span>' + esc(text) + '</span></div>';
  }

  function hbars(rows) {
    var max = rows.reduce(function (a, r) { return Math.max(a, r.v); }, 0) || 1;
    return '<div class="hbars">' + rows.map(function (r) {
      return '<div class="hbar">' +
        '<div class="hbar__top"><span>' + esc(r.l) + '</span><strong>' + esc(r.s || (r.v + '%')) + '</strong></div>' +
        '<div class="hbar__track"><div class="hbar__fill" data-w="' + Math.round(r.v / max * 100) + '"></div></div>' +
      '</div>';
    }).join('') + '</div>';
  }

  /* =============================================================
     4 · ROLE CONFIG
     ============================================================= */
  var ROLE_CONFIG = {
    seller: {
      label: 'Seller',
      menu: [
        { key: 'overview', label: 'Overview', icon: 'fa-gauge-high' },
        { key: 'listings', label: 'Listings', icon: 'fa-box-open' },
        { key: 'orders', label: 'Orders', icon: 'fa-receipt' },
        { key: 'analytics', label: 'Analytics', icon: 'fa-chart-simple' },
        { key: 'messages', label: 'Messages', icon: 'fa-envelope' }
      ]
    },
    buyer: {
      label: 'Buyer',
      menu: [
        { key: 'overview', label: 'Overview', icon: 'fa-gauge-high' },
        { key: 'purchases', label: 'My orders', icon: 'fa-bag-shopping' },
        { key: 'wishlist', label: 'Wishlist', icon: 'fa-heart' },
        { key: 'rewards', label: 'Rewards', icon: 'fa-gem' },
        { key: 'messages', label: 'Messages', icon: 'fa-envelope' }
      ]
    }
  };

  var config = ROLE_CONFIG[pageRole];

  /* =============================================================
     5 · VIEWS
     ============================================================= */
  var SELLER_VIEWS = {
    overview: function () {
      return hero('Seller desk', 'fa-star', 'Good to see you, ' + user.name,
        'Five listings are live and two buyers are waiting on a reply.',
        { href: dead(), icon: 'fa-plus', label: 'New listing' }) +
        stats('overview') +
        '<div class="grid-2">' +
          panel('Latest orders',
            table(['Order', 'Item', 'Total', 'Status'], D.orders.slice(0, 4).map(function (o) {
              return [
                '<span>' + esc(o.id) + '</span>',
                prodCell(o.img, o.item, o.who),
                esc(o.total),
                pill(o.status)
              ];
            })), { href: dead(), label: 'View all' }) +
          panel('Recent activity', feed(D.activity)) +
        '</div>' +
        '<div class="grid-3">' +
          panel('Fulfilment', progress(D.readiness)) +
          panel("Today's checklist", todos(D.tasks)) +
          panel('Store health', kv([
            ['Store rating', '4.9 / 5'],
            ['Fulfilment rate', '98%'],
            ['On-time dispatch', '1.4 days'],
            ['Return rate', '2.1%']
          ])) +
        '</div>' +
        panel('Revenue mix', hbars([
          { l: 'Chargers & power', v: 64, s: '$1,587' },
          { l: 'Audio', v: 41, s: '$1,016' },
          { l: 'Watches & bands', v: 37, s: '$916' },
          { l: 'Cases & mounts', v: 12, s: '$297' }
        ])) +
        quick('Quick actions', [
          { href: dead(), icon: 'fa-plus', label: 'New listing' },
          { href: dead(), icon: 'fa-truck-fast', label: 'Print labels' },
          { href: dead(), icon: 'fa-receipt', label: 'New invoice' },
          { href: dead(), icon: 'fa-chart-simple', label: 'Reports' }
        ]);
    },

    listings: function () {
      return stats('listings') +
        panel('All listings',
          table(['Product', 'SKU', 'Stock', 'Price', 'Status'], D.listings.map(function (l) {
            return [prodCell(l.img, l.name, l.sku), esc(l.sku), esc(String(l.stock)), esc(l.price), pill(l.status)];
          }))) +
        '<div class="grid-2">' +
          panel('Listing readiness', progress(D.readiness)) +
          panel('Stock notes', timeline([
            { icon: 'fa-triangle-exclamation', l: 'Flux Mag Power 10K', s: '9 units left', p: 'Reorder point is 15. A restock landed on the supplier dock yesterday.', state: 'live' },
            { icon: 'fa-eye-slash', l: 'Vault Hard Case', s: 'Sold out', p: 'Back in stock expected next week. Wishlist alerts already sent.', state: 'live' },
            { icon: 'fa-circle-check', l: 'Aurora Buds Pro', s: 'Healthy', p: '42 units and rising after the firmware note went out.', state: 'done' }
          ])) +
        '</div>' +
        panel('Inventory by line', hbars([
          { l: 'Volt 65W GaN Charger', v: 118, s: '118' },
          { l: 'Aurora Buds Pro', v: 42, s: '42' },
          { l: 'Halo Watch S2', v: 27, s: '27' },
          { l: 'Flux Mag Power 10K', v: 9, s: '9' },
          { l: 'Vault Hard Case', v: 0, s: '0' }
        ])) +
        quick('Listing actions', [
          { href: dead(), icon: 'fa-plus', label: 'Add product' },
          { href: dead(), icon: 'fa-file-import', label: 'Bulk import' },
          { href: dead(), icon: 'fa-tags', label: 'Edit prices' },
          { href: dead(), icon: 'fa-eye-slash', label: 'Hide sold out' }
        ]);
    },

    orders: function () {
      return stats('orders') +
        '<div class="grid-2">' +
          panel('Fulfilment readiness', progress(D.readiness)) +
          panel('Today', todos(D.tasks)) +
        '</div>' +
        panel('Order pipeline', steps([
          { l: 'Confirmed', p: 'Payment captured and the order lands in your queue.' },
          { l: 'Packed', p: 'Stock pulled, quality checked and boxed for dispatch.' },
          { l: 'Shipped', p: 'Carrier collects and the buyer gets tracking.' },
          { l: 'Delivered', p: 'Signed for, then the review window opens.' }
        ])) +
        panel('All orders',
          table(['Order', 'Buyer', 'Item', 'Total', 'Status'], D.orders.map(function (o) {
            return [esc(o.id), esc(o.who), prodCell(o.img, o.item, o.id), esc(o.total), pill(o.status)];
          }))) +
        '<div class="grid-2">' +
          panel('Dispatch by carrier', hbars([
            { l: 'Stackly Express', v: 52, s: '52%' },
            { l: 'Metro Courier', v: 31, s: '31%' },
            { l: 'Regional Freight', v: 17, s: '17%' }
          ])) +
          panel('Order totals', kv([
            ['Gross this week', '$2,480.00'],
            ['Refunds opened', '4'],
            ['Returned value', '$136.00'],
            ['Net payout', '$2,344.00']
          ])) +
        '</div>' +
        quick('Order actions', [
          { href: dead(), icon: 'fa-truck-fast', label: 'Ship orders' },
          { href: dead(), icon: 'fa-print', label: 'Print labels' },
          { href: dead(), icon: 'fa-rotate-left', label: 'Open refunds' },
          { href: dead(), icon: 'fa-file-invoice', label: 'Export CSV' }
        ]);
    },

    analytics: function () {
      return stats('analytics') + chart('Units sold this week') +
        '<div class="grid-2">' +
          panel('Top products', list([
            { img: '../images/product-4.webp', name: 'Halo Watch S2', sub: '38 units · $5,662' },
            { img: '../images/product-1.webp', name: 'Aurora Buds Pro', sub: '29 units · $2,581' },
            { img: '../images/product-2.webp', name: 'Volt 65W GaN Charger', sub: '64 units · $2,176' }
          ])) +
          panel('Conversion', progress([
            { l: 'Product page to bag', v: 41 },
            { l: 'Bag to checkout', v: 63 },
            { l: 'Checkout completed', v: 88 }
          ])) +
        '</div>' +
        '<div class="grid-3">' +
          panel('Traffic sources', hbars([
            { l: 'Organic search', v: 46 },
            { l: 'Direct', v: 27 },
            { l: 'Social', v: 17 },
            { l: 'Email', v: 10 }
          ])) +
          panel('Traffic this week', tiles([
            { icon: 'fa-eye', k: 'Store views', v: '9,412', n: '+18% week over week' },
            { icon: 'fa-users', k: 'Unique visitors', v: '6,208', n: '66% of all views' },
            { icon: 'fa-clock', k: 'Avg. session', v: '3m 42s', n: 'Longest 11m 08s' },
            { icon: 'fa-arrow-up-right-from-square', k: 'Add to bag', v: '3,858', n: '41% of visitors' },
            { icon: 'fa-cart-shopping', k: 'Checkouts', v: '292', n: '3.1% conversion' },
            { icon: 'fa-receipt', k: 'Avg. order', v: '$87.40', n: '1.4 items per order' }
          ])) +
          panel('Period comparison', kv([
            ['This week', '$2,480'],
            ['Last week', '$2,101'],
            ['Four weeks ago', '$1,944'],
            ['Best day', 'Saturday · $612']
          ])) +
        '</div>' +
        quick('Report actions', [
          { href: dead(), icon: 'fa-file-arrow-down', label: 'Export report' },
          { href: dead(), icon: 'fa-calendar-week', label: 'Compare weeks' },
          { href: dead(), icon: 'fa-chart-line', label: 'Forecast' },
          { href: dead(), icon: 'fa-file-invoice-dollar', label: 'Tax summary' }
        ]);
    },

    messages: function () {
      return stats('orders') +
        '<div class="grid-2">' +
          panel('Buyer threads', list(D.threads)) +
          panel('Conversation tools', '<div class="quick">' +
            '<a href="' + dead() + '"><i class="fa-solid fa-pen" aria-hidden="true"></i>New message</a>' +
            '<a href="' + dead() + '"><i class="fa-solid fa-bullhorn" aria-hidden="true"></i>Broadcast</a>' +
            '<a href="' + dead() + '"><i class="fa-solid fa-bell-slash" aria-hidden="true"></i>Mute thread</a>' +
            '<a href="' + dead() + '"><i class="fa-solid fa-inbox" aria-hidden="true"></i>Archived</a>' +
          '</div>') +
        '</div>' +
        panel('Reply queue', timeline([
          { icon: 'fa-envelope', l: 'Maya Okonkwo', s: 'Does the Buds Pro case ship separately?', p: 'Waiting 2 hours · order #ST-40921', state: 'live' },
          { icon: 'fa-envelope', l: 'Dev Raman', s: 'Tracking for #ST-40918 never arrived', p: 'Waiting 5 hours · carrier claim opened', state: 'live' },
          { icon: 'fa-circle-check', l: 'Iris Lund', s: 'Happy to wait for the restock', p: 'Answered yesterday · thread archived' , state: 'done' }
        ])) +
        '<div class="grid-2">' +
          panel('Response health', hbars([
            { l: 'Answered within 1 hour', v: 62 },
            { l: 'Answered within 4 hours', v: 88 },
            { l: 'Answered same day', v: 97 }
          ])) +
          panel('Desk settings', kv([
            ['Working hours', '09:00 – 19:00'],
            ['Auto-reply', 'On · outside hours'],
            ['Signature', 'Ana · Stackly Seller'],
            ['Saved replies', '6 templates']
          ])) +
        '</div>' +
        note('Buyer messages stay inside Stackly. Never ask for card details in a thread — the payment screen is the only safe place to take payment.', 'fa-shield-halved');
    }
  };

  var BUYER_VIEWS = {
    overview: function () {
      return hero('Buyer account', 'fa-gem', 'Welcome back, ' + user.name,
        'One order is out for delivery and a saved item just dropped in price.',
        { href: dead(), icon: 'fa-bag-shopping', label: 'Continue shopping' }) +
        stats('overview') +
        '<div class="grid-2">' +
          panel('Your recent orders',
            table(['Order', 'Item', 'Total', 'Status'], D.purchases.slice(0, 4).map(function (p) {
              return [esc(p.id), prodCell(p.img, p.name, p.date), esc(p.total), pill(p.status)];
            })), { href: dead(), label: 'View all' }) +
          panel('Recent activity', feed(D.activity)) +
        '</div>' +
        '<div class="grid-3">' +
          panel('Reward progress', progress(D.rewards)) +
          panel('Your to-dos', todos(D.tasks)) +
          panel('Account at a glance', kv([
            ['Member tier', 'Gold'],
            ['Points balance', '2,150'],
            ['Lifetime spend', '$412.60'],
            ['Orders placed', '14']
          ])) +
        '</div>' +
        panel('Spend by category', hbars([
          { l: 'Audio', v: 58, s: '$239.60' },
          { l: 'Chargers & power', v: 34, s: '$140.40' },
          { l: 'Watches & bands', v: 22, s: '$91.00' },
          { l: 'Cases & mounts', v: 9, s: '$37.00' }
        ])) +
        quick('Quick actions', [
          { href: dead(), icon: 'fa-bag-shopping', label: 'Shop new gear' },
          { href: dead(), icon: 'fa-cart-shopping', label: 'Open bag' },
          { href: dead(), icon: 'fa-heart', label: 'Wishlist' },
          { href: dead(), icon: 'fa-headset', label: 'Book a repair' }
        ]);
    },

    purchases: function () {
      return stats('purchases') +
        panel('All orders',
          table(['Order', 'Item', 'Placed', 'Total', 'Status'], D.purchases.map(function (p) {
            return [esc(p.id), prodCell(p.img, p.name, p.id), esc(p.date), esc(p.total), pill(p.status)];
          }))) +
        panel('Where each order is', timeline([
          { icon: 'fa-box-open', l: '#ST-40933 · Halo Watch S2', s: 'Processing', p: 'Payment confirmed. The seller is preparing your parcel.', state: 'live' },
          { icon: 'fa-truck-fast', l: '#ST-40871 · Flux Mag Power 10K', s: 'Out for delivery', p: 'Expected today between 6pm and 8pm.', state: 'live' },
          { icon: 'fa-circle-check', l: '#ST-40918 · Volt 65W GaN Charger', s: 'Delivered 12 Oct', p: 'Left with a neighbour. Rate this order any time.', state: 'done' },
          { icon: 'fa-rotate-left', l: '#ST-40790 · Vault Hard Case', s: 'Return opened 3 Oct', p: 'Refund of $19.00 is pending the carrier scan.' , state: 'live' }
        ])) +
        '<div class="grid-2">' +
          panel('Spend summary', kv([
            ['Lifetime orders', '14'],
            ['Lifetime spend', '$412.60'],
            ['Currently in transit', '2'],
            ['Refunded to date', '$38.00']
          ])) +
          panel('Delivery preferences', kv([
            ['Default address', '18 Harbour Lane, Apt 4'],
            ['Delivery window', 'Evenings, 6pm – 8pm'],
            ['Leave with', 'Building concierge'],
            ['Packaging', 'Gift wrap, no receipt']
          ])) +
        '</div>' +
        quick('Order actions', [
          { href: dead(), icon: 'fa-location-crosshairs', label: 'Track parcel' },
          { href: dead(), icon: 'fa-rotate-left', label: 'Start a return' },
          { href: dead(), icon: 'fa-file-invoice', label: 'Download invoice' },
          { href: dead(), icon: 'fa-screwdriver-wrench', label: 'Book a repair' }
        ]);
    },

    wishlist: function () {
      return stats('wishlist') +
        panel('Saved items',
          table(['Product', 'SKU', 'Price', 'Availability'], D.wishlist.map(function (w) {
            return [prodCell(w.img, w.name, w.sku), esc(w.sku), esc(w.price), pill(w.status)];
          }))) +
        '<div class="grid-2">' +
          panel('Watchlist signals', timeline([
            { icon: 'fa-arrow-trend-down', l: 'Aurora Buds Pro', s: 'Down 12% · now $89.00', p: 'Lowest price in the last 90 days.', state: 'live' },
            { icon: 'fa-triangle-exclamation', l: 'Flux Mag Power 10K', s: 'Only 9 left', p: 'Selling fast right now.', state: 'live' },
            { icon: 'fa-eye-slash', l: 'Vault Hard Case', s: 'Sold out', p: 'We will tell you the moment it returns.', state: 'live' },
            { icon: 'fa-circle-check', l: 'Resonance Mini Speaker', s: 'In stock', p: 'Added to your bag earlier this week.', state: 'done' }
          ])) +
          panel('List summary', kv([
            ['Saved items', '6'],
            ['Price drops', '2'],
            ['Back-in-stock alerts', '1'],
            ['In your bag', '3']
          ])) +
        '</div>' +
        panel('Price history', hbars([
          { l: 'Aurora Buds Pro', v: 88, s: '$89.00' },
          { l: 'Resonance Mini Speaker', v: 59, s: '$59.00' },
          { l: 'Flux Mag Power 10K', v: 49, s: '$49.00' },
          { l: 'Vault Hard Case', v: 19, s: '$19.00' }
        ])) +
        quick('Wishlist actions', [
          { href: dead(), icon: 'fa-cart-shopping', label: 'Move all to bag' },
          { href: dead(), icon: 'fa-bell', label: 'Price alerts' },
          { href: dead(), icon: 'fa-share-nodes', label: 'Share list' },
          { href: dead(), icon: 'fa-plus', label: 'Find more gear' }
        ]);
    },

    rewards: function () {
      return stats('rewards') +
        '<div class="grid-2">' +
          panel('Tier progress', progress(D.rewards)) +
          panel('Your to-dos', todos(D.tasks)) +
        '</div>' +
        chart('Points earned per day') +
        '<div class="grid-3">' +
          panel('Points this year', tiles([
            { icon: 'fa-gem', k: 'Earned', v: '1,470', n: 'Across 14 orders' },
            { icon: 'fa-gift', k: 'Redeemed', v: '320', n: 'Two rewards used' },
            { icon: 'fa-clock-rotate-left', k: 'Expiring', v: '0', n: 'Gold points never expire' },
            { icon: 'fa-percent', k: 'Rate', v: '3×', n: 'Points per dollar' }
          ])) +
          panel('How to earn more', steps([
            { l: 'Write a review', p: '150 points for your first review on a delivered order.' },
            { l: 'Refer a friend', p: '400 points when their first order ships.' },
            { l: 'Birthday bonus', p: '500 points, added once a year.' }
          ])) +
          panel('Tier benefits', kv([
            ['Gold · current', '3× points · free returns'],
            ['Platinum · at 2,930', '4× points · priority support'],
            ['Obsidian · at 6,000', '5× points · annual gift'],
            ['Free return window', '60 days on Gold']
          ])) +
        '</div>' +
        panel('Points by month', hbars([
          { l: 'January', v: 210, s: '210' },
          { l: 'February', v: 180, s: '180' },
          { l: 'March', v: 320, s: '320' },
          { l: 'April', v: 260, s: '260' },
          { l: 'May', v: 500, s: '500' }
        ])) +
        note('Gold points do not expire. Platinum unlocks at 2,930 points — you are 780 away.', 'fa-circle-info') +
        quick('Rewards actions', [
          { href: dead(), icon: 'fa-gift', label: 'Redeem points' },
          { href: dead(), icon: 'fa-users', label: 'Refer a friend' },
          { href: dead(), icon: 'fa-ranking-star', label: 'Tier benefits' },
          { href: dead(), icon: 'fa-clock-rotate-left', label: 'Points history' }
        ]);
    },

    messages: function () {
      return stats('overview') +
        '<div class="grid-2">' +
          panel('Your threads', list(D.threads)) +
          panel('Message tools', '<div class="quick">' +
            '<a href="' + dead() + '"><i class="fa-solid fa-pen" aria-hidden="true"></i>New message</a>' +
            '<a href="' + dead() + '"><i class="fa-solid fa-headset" aria-hidden="true"></i>Contact support</a>' +
            '<a href="' + dead() + '"><i class="fa-solid fa-bell-slash" aria-hidden="true"></i>Notification settings</a>' +
            '<a href="' + dead() + '"><i class="fa-solid fa-inbox" aria-hidden="true"></i>Archived</a>' +
          '</div>') +
        '</div>' +
        panel('Recent conversations', timeline([
          { icon: 'fa-headset', l: 'Stackly Support', s: 'Your GaN charger return was approved', p: 'Refund of $34.00 is on the way · 2 hours ago', state: 'live' },
          { icon: 'fa-envelope', l: 'Aurora Audio', s: 'Buds Pro firmware 3.1 is live', p: 'Covers the new transparency mode · yesterday', state: 'done' },
          { icon: 'fa-gem', l: 'Stackly Support', s: 'Reward points never expire on Gold', p: 'No action needed · 3 days ago', state: 'done' }
        ])) +
        '<div class="grid-2">' +
          panel('Support desk', kv([
            ['Typical first reply', 'Under 4 hours'],
            ['Open hours', '08:00 – 22:00 daily'],
            ['Repairs booked', '2 this year'],
            ['Warranty claims', '1 approved']
          ])) +
          panel('Notification preferences', hbars([
            { l: 'Order updates', v: 100, s: 'On' },
            { l: 'Price drops on saved items', v: 80, s: 'On' },
            { l: 'Reward points', v: 60, s: 'Weekly' },
            { l: 'New arrivals', v: 20, s: 'Off' }
          ])) +
        '</div>' +
        note('Stackly support never asks for your password. If a thread asks for it, it is not us.', 'fa-shield-halved');
    }
  };

var VIEWS = { seller: SELLER_VIEWS, buyer: BUYER_VIEWS }[pageRole];

  /* =============================================================
      6 · SHELL WIRING
      ============================================================= */
  var side = doc.getElementById('dashSide');
  var scrim = doc.getElementById('dashScrim');
  var burger = doc.getElementById('dashBurger');
  var sideClose = doc.getElementById('dashSideClose');
  var view = doc.getElementById('dashBody');
  var titleEl = doc.getElementById('dashTitle');
  var welcomeEl = doc.getElementById('dashWelcome');
  var navEl = doc.getElementById('dashNav');
  var searchInput = doc.getElementById('dashSearch');
  var searchBox = doc.getElementById('dashSearchBox');
  var root = doc.body;

  function setText(id, value) {
    var el = doc.getElementById(id);
    if (el) el.textContent = value;
  }

  setText('dashRole', config.label);
  setText('dashName', user.name);
  setText('dashEmail', user.email);
  setText('dashNameB', user.name);
  setText('dashEmailB', user.email);
  setText('dashAvatar', initial);
  setText('dashAvatarB', initial);

  /* ---- sidebar nav ---- */
  config.menu.forEach(function (item, i) {
    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'side-link' + (i === 0 ? ' is-on' : '');
    btn.setAttribute('data-view', item.key);
    btn.setAttribute('aria-current', i === 0 ? 'page' : 'false');
    btn.innerHTML = '<i class="fa-solid ' + item.icon + '" aria-hidden="true"></i><span>' + esc(item.label) + '</span>';
    btn.addEventListener('click', function () { show(item.key, item.label); });
    navEl.appendChild(btn);
  });

  /* ---- view router ---- */
  var current = '';

  function animate() {
    win.requestAnimationFrame(function () {
      view.querySelectorAll('.chart__bar[data-h]').forEach(function (bar) {
        bar.style.height = bar.getAttribute('data-h') + 'px';
      });
      view.querySelectorAll('.prog__fill[data-w]').forEach(function (fill) {
        fill.style.width = fill.getAttribute('data-w') + '%';
      });
    });
  }

  function markActive(key) {
    navEl.querySelectorAll('.side-link').forEach(function (btn) {
      var on = btn.getAttribute('data-view') === key;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-current', on ? 'page' : 'false');
    });
  }

  function show(key, label) {
    var render = VIEWS[key];
    current = key;

    markActive(key);
    if (titleEl) titleEl.textContent = label;

    var isHome = key === 'overview';
    if (welcomeEl) {
      welcomeEl.textContent = isHome ? 'Signed in as ' + user.email : '';
      welcomeEl.hidden = !isHome;
    }

    view.innerHTML = render ? '<div class="dash-view">' + render() + '</div>' : '';
    animate();
    if (searchInput) searchInput.value = '';
    win.scrollTo(0, 0);

    closeDrawer();
  }

  /* ---- drawer ---- */
  function drawerOpen() { return side && side.classList.contains('is-open'); }

  function openDrawer() {
    if (!side) return;
    side.classList.add('is-open');
    side.setAttribute('aria-hidden', 'false');
    if (scrim) scrim.classList.add('is-on');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    root.classList.add('is-locked');
  }

  function closeDrawer() {
    if (!side) return;
    side.classList.remove('is-open');
    /* the sidebar is a permanent landmark on desktop, so it must never be
       hidden from assistive tech just because the overlay was dismissed */
    var mobile = win.innerWidth <= DRAWER_AT;
    if (mobile) side.setAttribute('aria-hidden', 'true');
    else side.setAttribute('aria-hidden', 'false');
    if (scrim) scrim.classList.remove('is-on');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-locked');
  }

  if (burger) burger.addEventListener('click', openDrawer);
  if (sideClose) sideClose.addEventListener('click', closeDrawer);
  if (scrim) scrim.addEventListener('click', closeDrawer);

  /* the scrim is fixed over the whole viewport, so leaving it up after a
     resize into desktop width would black out a perfectly good layout */
  win.addEventListener('resize', function () {
    if (win.innerWidth > DRAWER_AT) closeDrawer();
  });

  /* ---- notifications ---- */
  /* the bell is a plain link to the 404 page, so there is nothing to open */

  /* ---- search ---- */
  /* Enter on an empty box complains; Enter on a real query goes to the 404
     page, exactly as the reference behaves */
  var SEARCH_HINT = 'Type something to search';
  var defaultPlaceholder = '';

  if (searchInput) {
    defaultPlaceholder = searchInput.getAttribute('placeholder') || '';

    searchInput.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();

      var term = searchInput.value.trim();
      if (!term) {
        if (searchBox) {
          searchBox.classList.add('is-bad');
          searchInput.setAttribute('placeholder', 'Please type something to search');
          win.setTimeout(function () {
            searchBox.classList.remove('is-bad');
            searchInput.setAttribute('placeholder', defaultPlaceholder || SEARCH_HINT);
          }, 1600);
        }
        toast('Type something to search first', true);
        return;
      }

      win.location.href = DEAD;
    });
  }

  /* ---- logout ---- */
  var outBtn = doc.getElementById('dashLogout');
  if (outBtn) {
    outBtn.addEventListener('click', function () {
      try { win.localStorage.removeItem('stacklyUser'); } catch (e) {}
      win.location.href = 'login.html';
    });
  }

  /* ---- escape closes the drawer ---- */
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (drawerOpen()) closeDrawer();
  });

/* =============================================================
      8 · TOASTS
      ============================================================= */
  var stack = doc.getElementById('dashToasts');

  function toast(message, isError) {
    if (!stack) return;
    var el = doc.createElement('div');
    el.className = 'toast' + (isError ? ' is-bad' : '');
    el.innerHTML = '<i class="fa-solid ' + (isError ? 'fa-triangle-exclamation' : 'fa-circle-check') + '" aria-hidden="true"></i>' +
      '<span>' + esc(message) + '</span>';
    stack.appendChild(el);
    win.setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      win.setTimeout(function () { el.remove(); }, 320);
    }, 3200);
  }

/* =============================================================
      9 · BOOT
      ============================================================= */
  show(config.menu[0].key, config.menu[0].label);

  var boot = doc.getElementById('dashBoot');
  function clearBoot() {
    if (!boot || boot.classList.contains('is-done')) return;
    boot.classList.add('is-done');
    win.setTimeout(function () { boot.remove(); }, 500);
  }

  if (boot) {
    if (REDUCED) clearBoot();
    else if (doc.readyState === 'complete') win.setTimeout(clearBoot, 260);
    else win.addEventListener('load', function () { win.setTimeout(clearBoot, 260); });
    /* never let a stalled asset hold the whole dashboard hostage */
    win.setTimeout(clearBoot, 2600);
  }

  /* back/forward from the bfcache must not leave a stale drawer */
  win.addEventListener('pageshow', function (e) {
    if (e.persisted) closeDrawer();
  });
})();

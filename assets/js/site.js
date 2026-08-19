/* www.matchbox.health -- mobile menu overlay and cookie consent. */
(function () {
  'use strict';

  /* ---- mobile menu ------------------------------------------------------
     The control is a plus that rotates into a cross. The overlay is a real
     element rather than a class on <body> so it can be hidden from assistive
     technology while closed. */
  var toggle = document.querySelector('.header__toggle');
  var menu = document.getElementById('site-menu');

  function setMenu(open) {
    if (!toggle || !menu) return;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close Menu' : 'Open Menu');
    document.body.classList.toggle('is-menu-open', open);
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(menu.hidden);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
    });
    // Leaving the overlay open across the 800px breakpoint would trap scrolling.
    var wide = window.matchMedia('(min-width: 800px)');
    (wide.addEventListener ? wide.addEventListener.bind(wide, 'change')
                           : wide.addListener.bind(wide))(function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* ---- cookie consent ---------------------------------------------------
     Consent Mode is initialised to denied and the Google tag is not fetched at
     all until Accept, so declining leaves no analytics request on the wire. */
  var GA_ID = 'G-NJ6P4XSZMC';
  var STORAGE_KEY = 'matchbox-consent';
  var banner = document.querySelector('.consent');
  var loaded = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  function loadAnalytics() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  function stored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function remember(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* private mode */ }
  }

  function show() { if (banner) banner.hidden = false; }
  function hide() { if (banner) banner.hidden = true; }

  var choice = stored();
  if (choice === 'granted') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    loadAnalytics();
  } else if (choice !== 'denied') {
    show();
  }

  if (banner) {
    var accept = banner.querySelector('.consent__accept');
    var deny = banner.querySelector('.consent__deny');
    if (accept) accept.addEventListener('click', function () {
      remember('granted');
      gtag('consent', 'update', { analytics_storage: 'granted' });
      loadAnalytics();
      hide();
    });
    if (deny) deny.addEventListener('click', function () {
      remember('denied');
      hide();
    });
  }

  // The privacy policy's "change that decision at any time" link brings the
  // banner back, so that sentence is literally true.
  Array.prototype.forEach.call(
    document.querySelectorAll('.js-consent-reopen'),
    function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); show(); });
    });
}());

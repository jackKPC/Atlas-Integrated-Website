/* ============================================================
   Atlas Integrated — atlas.js
   Nav scroll observer, reduced-motion guard, demo CTA stub.
   Plain ES2020, no modules.
   ============================================================ */

(function () {
  'use strict';

  /* ---- Nav scroll observer --------------------------------------------- */

  function initNavScroll() {
    var nav = document.querySelector('.site-nav');
    var sentinel = document.querySelector('.nav-sentinel');
    if (!nav || !sentinel || typeof IntersectionObserver !== 'function') {
      if (nav) nav.setAttribute('data-scrolled', 'false');
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        nav.setAttribute('data-scrolled', entry.isIntersecting ? 'false' : 'true');
      });
    }, { rootMargin: '0px 0px -80px 0px', threshold: 0 });

    obs.observe(sentinel);
  }

  /* ---- Reduced motion guard -------------------------------------------- */

  function initReducedMotionGuard() {
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    var apply = function () {
      document.documentElement.setAttribute('data-reduced-motion', mq.matches ? 'true' : 'false');
    };
    apply();
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', apply);
    }
  }

  /* ---- Scroll reveals --------------------------------------------------
   * Any element with [data-reveal] starts at opacity 0 + translateY 16px
   * and animates in when 15% visible. Sibling stagger is set via the
   * --reveal-index custom property on each element. */

  function initScrollReveals() {
    var elements = document.querySelectorAll('[data-reveal]');
    if (!elements.length) return;

    if (typeof IntersectionObserver !== 'function') {
      elements.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    /* Group siblings so each group gets its own stagger sequence */
    var groups = {};
    elements.forEach(function (el) {
      var groupKey = el.parentNode ? el.parentNode.dataset.revealGroup || 'global' : 'global';
      if (!groups[groupKey]) groups[groupKey] = 0;
      el.style.setProperty('--reveal-index', groups[groupKey]);
      groups[groupKey]++;
    });

    /* Fire early: positive bottom rootMargin means elements start
       animating while they're still ~40% of the viewport BELOW the
       fold. By the time the user scrolls to them, the fade is done. */
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px 40% 0px' });

    elements.forEach(function (el) { obs.observe(el); });
  }

  /* ---- Section divider grow-in ----------------------------------------
   * Watches each .section-divider and adds .is-divider-in when the top
   * edge enters view, which triggers the motion layer's ::after scaleX
   * transition. */

  function initDividerReveals() {
    var dividers = document.querySelectorAll('.section-divider');
    if (!dividers.length) return;

    if (typeof IntersectionObserver !== 'function') {
      dividers.forEach(function (el) { el.classList.add('is-divider-in'); });
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-divider-in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px 30% 0px' });

    dividers.forEach(function (el) { obs.observe(el); });
  }

  /* ---- Mobile navigation overlay --------------------------------------- */

  function initNavOverlay() {
    var toggle = document.querySelector('.nav-toggle');
    var overlay = document.getElementById('nav-overlay');
    var closeBtn = overlay && overlay.querySelector('.nav-overlay-close');
    if (!toggle || !overlay) return;

    function open() {
      overlay.setAttribute('data-open', 'true');
      overlay.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-overlay-open');
      var first = overlay.querySelector('a');
      if (first) setTimeout(function () { first.focus(); }, 100);
    }

    function close() {
      overlay.setAttribute('data-open', 'false');
      overlay.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-overlay-open');
      toggle.focus();
    }

    toggle.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.getAttribute('data-open') === 'true') {
        close();
      }
    });

    /* Close when a link inside the overlay is clicked */
    overlay.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', close);
    });
  }

  /* ---- Book a Demo form -----------------------------------------------
   * Client-side validation (required fields + basic email format),
   * transitions to a success state without a page reload. No real
   * backend yet — submission is intercepted and a success card shown.
   */

  function initDemoForm() {
    var form = document.getElementById('demo-form');
    var success = document.getElementById('demo-success');
    if (!form || !success) return;

    var nameInput = document.getElementById('demo-name');
    var emailInput = document.getElementById('demo-email');
    var nameError = document.getElementById('demo-name-error');
    var emailError = document.getElementById('demo-email-error');

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setError(input, errorEl, message) {
      if (message) {
        input.setAttribute('aria-invalid', 'true');
        errorEl.textContent = message;
      } else {
        input.removeAttribute('aria-invalid');
        errorEl.textContent = '';
      }
    }

    function validateName() {
      var value = nameInput.value.trim();
      if (!value) {
        setError(nameInput, nameError, 'Please enter your name.');
        return false;
      }
      setError(nameInput, nameError, '');
      return true;
    }

    function validateEmail() {
      var value = emailInput.value.trim();
      if (!value) {
        setError(emailInput, emailError, 'Please enter your work email.');
        return false;
      }
      if (!EMAIL_RE.test(value)) {
        setError(emailInput, emailError, 'That doesn\u2019t look like a valid email.');
        return false;
      }
      setError(emailInput, emailError, '');
      return true;
    }

    /* Live re-validation once the user has started interacting */
    nameInput.addEventListener('blur', validateName);
    emailInput.addEventListener('blur', validateEmail);
    nameInput.addEventListener('input', function () {
      if (nameInput.getAttribute('aria-invalid')) validateName();
    });
    emailInput.addEventListener('input', function () {
      if (emailInput.getAttribute('aria-invalid')) validateEmail();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameOk = validateName();
      var emailOk = validateEmail();
      if (!nameOk || !emailOk) {
        (nameOk ? emailInput : nameInput).focus();
        return;
      }

      /* TODO(M6): POST to real demo endpoint here */
      if (typeof console !== 'undefined' && console.info) {
        console.info('[atlas] demo form submit', {
          name: nameInput.value.trim(),
          email: emailInput.value.trim()
        });
      }

      /* Transition to success state */
      form.hidden = true;
      success.hidden = false;
      success.focus();
    });
  }

  /* ---- Footer year ----------------------------------------------------- */

  function initFooterYear() {
    var el = document.getElementById('footer-year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---- Globe meridian animator ----------------------------------------
   * Renders 12 meridians as 2D SVG paths, updating each path's `d`
   * attribute on every frame to simulate the projection of a rotating
   * sphere. Each meridian is a half-ellipse arc with rx = R*|sin(lon)|
   * (or a vertical line at edge-on). Strokes never thin out because
   * we draw directly in the SVG instead of foreshortening flat planes.
   */
  function initGlobeMeridians() {
    var meridians = document.querySelectorAll('.globe-meridians .meridian');
    if (!meridians.length) return;

    var R = 320;              // sphere radius in viewBox units
    var CX = 400;             // center x
    var TOP = 80;              // top pole y (CY - R)
    var BOTTOM = 720;          // bottom pole y (CY + R)
    var COUNT = meridians.length;
    var STEP_DEG = 360 / COUNT;
    var VISUAL_CYCLE_MS = 20000; // perceived rotation period (75% faster than the prior 35s)

    /* Intro rotation: during the CSS slide-into-place window the globe
       sweeps a full 360° with an ease-out curve that mirrors
       --ease-cinematic. Timings match the CSS tokens: 600ms hold,
       1800ms slide. Afterwards, meridian rotation continues at the
       normal steady rate so the globe keeps spinning perpetually. */
    var INTRO_START_MS = 600;
    var INTRO_DURATION_MS = 1800;
    var INTRO_ROTATION_DEG = 180;
    var STEADY_DEG_PER_MS = STEP_DEG / VISUAL_CYCLE_MS;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function setPath(el, lonDeg) {
      var lonRad = (lonDeg % 360) * Math.PI / 180;
      var sinLon = Math.sin(lonRad);
      var rx = Math.abs(R * sinLon);
      var d;
      if (rx < 1.5) {
        d = 'M ' + CX + ' ' + TOP + ' L ' + CX + ' ' + BOTTOM;
      } else {
        var sweep = sinLon > 0 ? 1 : 0;
        d = 'M ' + CX + ' ' + TOP +
            ' A ' + rx.toFixed(2) + ' ' + R + ' 0 0 ' + sweep + ' ' + CX + ' ' + BOTTOM;
      }
      el.setAttribute('d', d);
    }

    function updateAll(rotationDeg) {
      for (var i = 0; i < COUNT; i++) {
        setPath(meridians[i], i * STEP_DEG + rotationDeg);
      }
    }

    // Initial render at rotation 0
    updateAll(0);

    // Reduced motion: render once and stop, no animation
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    var startTime = null;
    function tick(timestamp) {
      if (startTime === null) startTime = timestamp;
      var elapsed = timestamp - startTime;

      var rotation;
      if (elapsed < INTRO_START_MS) {
        rotation = 0;
      } else if (elapsed < INTRO_START_MS + INTRO_DURATION_MS) {
        var introT = (elapsed - INTRO_START_MS) / INTRO_DURATION_MS;
        rotation = easeOutCubic(introT) * INTRO_ROTATION_DEG;
      } else {
        var steadyElapsed = elapsed - (INTRO_START_MS + INTRO_DURATION_MS);
        rotation = INTRO_ROTATION_DEG + steadyElapsed * STEADY_DEG_PER_MS;
      }

      updateAll(rotation);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---- Boot ------------------------------------------------------------ */

  function boot() {
    /* Gate the motion layer: CSS scopes all reveal/divider animations
       under .js-reveals so unsupported environments keep the no-JS
       static fallback. */
    document.documentElement.classList.add('js-reveals');

    initNavScroll();
    initNavOverlay();
    initReducedMotionGuard();
    initDemoForm();
    initFooterYear();
    initGlobeMeridians();
    initScrollReveals();
    initDividerReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

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

    /* Reveals fire early (40% below fold) but if the element is inside
       a globe-lane section, add a delay so the globe settles into its
       lane before the content appears. The 700ms matches the globe
       CSS transition duration. */
    var GLOBE_SETTLE_MS = 700;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var section = entry.target.closest('[data-globe-side]');
          if (section) {
            /* Delay reveal so globe reaches its lane first */
            setTimeout(function () {
              entry.target.classList.add('is-revealed');
            }, GLOBE_SETTLE_MS);
          } else {
            entry.target.classList.add('is-revealed');
          }
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px 20% 0px' });

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

    /* Scroll-velocity-driven rotation: base spin + scroll boost.
       Scrolling adds extra rotation proportional to scroll speed. */
    var lastScrollY = window.scrollY;
    var scrollBoost = 0; /* accumulated extra degrees from scrolling */
    var SCROLL_ROTATION_FACTOR = 0.15; /* degrees per pixel scrolled */

    var startTime = null;
    function tick(timestamp) {
      if (startTime === null) startTime = timestamp;
      var elapsed = timestamp - startTime;

      /* Track scroll velocity and accumulate rotation boost */
      var currentScrollY = window.scrollY;
      var scrollDelta = currentScrollY - lastScrollY;
      scrollBoost += scrollDelta * SCROLL_ROTATION_FACTOR;
      lastScrollY = currentScrollY;

      var rotation;
      if (elapsed < INTRO_START_MS) {
        rotation = 0;
      } else if (elapsed < INTRO_START_MS + INTRO_DURATION_MS) {
        var introT = (elapsed - INTRO_START_MS) / INTRO_DURATION_MS;
        rotation = easeOutCubic(introT) * INTRO_ROTATION_DEG;
      } else {
        var steadyElapsed = elapsed - (INTRO_START_MS + INTRO_DURATION_MS);
        rotation = INTRO_ROTATION_DEG + steadyElapsed * STEADY_DEG_PER_MS + scrollBoost;
      }

      updateAll(rotation);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---- Scroll-driven globe + content ------------------------------------
   * Every visual state is a PURE FUNCTION of scrollY.
   * No CSS transitions. No timeouts. No "settled" classes.
   *
   * The scroll range is divided into zones:
   *   [section-visible zone]  content at full opacity, globe stationary
   *   [transition zone]       content fading, globe sliding horizontally
   *
   * Globe left/top/width/opacity are set directly every frame.
   * Content container opacity is set directly every frame.
   */

  function initGlobeScroll() {
    var globe = document.getElementById('atlas-globe');
    var hero = document.querySelector('.hero');
    var spacer = document.querySelector('.hero-globe-spacer');
    if (!globe || !hero || !spacer) return;

    if (window.innerWidth < 1024) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var heroText = document.querySelector('.hero-text');
    var integrations = globe.querySelector('.integrations');
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    /* ---- Build the keyframe timeline from DOM sections ---- */
    var TRANSITION_PX = 200; /* scroll pixels for each transition zone */

    function laneLeft(side, w) {
      if (side === 'left')   return (vw * 0.42 - w) / 2;
      if (side === 'right')  return vw * 0.58 + (vw * 0.42 - w) / 2;
      return (vw - w) / 2; /* center */
    }
    function laneTop(side) {
      return side === 'center' ? vh * 0.08 : vh * 0.18;
    }

    /* Read the hero's resting globe position */
    function heroGlobeRect() {
      var saved = window.scrollY;
      if (saved > 10) { window.scrollTo(0, 0); }
      var sr = spacer.getBoundingClientRect();
      if (saved > 10) { window.scrollTo(0, saved); }
      return { top: sr.top, left: sr.left, width: sr.width };
    }

    var heroRect = heroGlobeRect();

    /* Build keyframes: each section produces a "hold" zone + a transition.
       Format: { scroll, left, top, width, opacity } */
    function buildKeyframes() {
      vw = window.innerWidth;
      vh = window.innerHeight;
      heroRect = heroGlobeRect();

      var sectionEls = document.querySelectorAll('[data-globe-side]');
      var kf = [];

      /* Hero hold */
      kf.push({ s: 0, l: heroRect.left, t: heroRect.top, w: heroRect.width, o: 1 });

      var heroBottom = hero.offsetTop + hero.offsetHeight;
      kf.push({ s: heroBottom - TRANSITION_PX, l: heroRect.left, t: heroRect.top, w: heroRect.width, o: 1 });

      /* Each section: transition-in → hold → transition-out */
      sectionEls.forEach(function (el) {
        var side  = el.dataset.globeSide;
        var scale = parseFloat(el.dataset.globeScale) || 0.6;
        var fade  = el.dataset.globeFade === 'true';
        var secTop = el.offsetTop;
        var secBot = secTop + el.offsetHeight;
        var gw = heroRect.width * scale;

        /* Transition arrives at section top */
        kf.push({ s: secTop, l: laneLeft(side, gw), t: laneTop(side), w: gw, o: fade ? 0 : 1 });
        /* Hold through the section */
        kf.push({ s: secBot - TRANSITION_PX, l: laneLeft(side, gw), t: laneTop(side), w: gw, o: fade ? 0 : 1 });
      });

      return kf;
    }

    var keyframes = buildKeyframes();

    /* ---- Interpolate between keyframes ---- */
    function lerp(a, b, t) { return a + (b - a) * t; }

    function globeStateAt(scrollY) {
      if (scrollY <= keyframes[0].s) return keyframes[0];
      if (scrollY >= keyframes[keyframes.length - 1].s) return keyframes[keyframes.length - 1];
      for (var i = 0; i < keyframes.length - 1; i++) {
        var a = keyframes[i], b = keyframes[i + 1];
        if (scrollY >= a.s && scrollY <= b.s) {
          var range = b.s - a.s;
          var t = range > 0 ? (scrollY - a.s) / range : 0;
          /* Linear interpolation — scroll position IS the timing.
             Mild smoothstep to avoid hard start/stop. */
          t = t * t * (3 - 2 * t);
          return {
            l: lerp(a.l, b.l, t),
            t: lerp(a.t, b.t, t),
            w: lerp(a.w, b.w, t),
            o: lerp(a.o, b.o, t)
          };
        }
      }
      return keyframes[keyframes.length - 1];
    }

    /* ---- Content opacity per section ----
     * Each section's .container fades: 0 during transition, 1 during hold.
     * Fade-in over the first TRANSITION_PX of the section.
     * Fade-out over the last TRANSITION_PX. */
    var sectionContainers = [];
    document.querySelectorAll('[data-globe-side]').forEach(function (el) {
      var cont = el.querySelector('.container');
      if (cont) sectionContainers.push({ el: el, cont: cont });
    });

    function contentOpacityAt(scrollY, secEl) {
      var top = secEl.offsetTop;
      var bot = top + secEl.offsetHeight;
      /* Content fades in DURING the globe transition (which ends at
         secTop). Content is fully visible by the time the globe arrives.
         Fades out over the last TRANSITION_PX before the next section. */
      var fadeInStart  = top - TRANSITION_PX;
      var fadeInEnd    = top;
      var fadeOutStart = bot - TRANSITION_PX;

      if (scrollY < fadeInStart || scrollY > bot) return 0;
      if (scrollY < fadeInEnd) return (scrollY - fadeInStart) / TRANSITION_PX;
      if (scrollY > fadeOutStart) return (bot - scrollY) / TRANSITION_PX;
      return 1;
    }

    /* ---- Init: pin the globe ---- */
    var introComplete = false;

    function pinGlobe() {
      globe.style.position = 'fixed';
      globe.style.animation = 'none';
      globe.style.transform = 'none';
      globe.classList.add('is-scroll-fixed');
      introComplete = true;
    }

    /* Position over spacer initially (absolute) */
    globe.style.position = 'absolute';
    globe.style.top = (heroRect.top + window.scrollY) + 'px';
    globe.style.left = heroRect.left + 'px';
    globe.style.width = heroRect.width + 'px';

    function handleRefresh() {
      /* Called when we detect scroll position > 100 (browser restored
         scroll after refresh). Skip intro, pin immediately. */
      pinGlobe();
      var scrollY = window.scrollY;
      var st = globeStateAt(scrollY);
      globe.style.top = st.t + 'px';
      globe.style.left = st.l + 'px';
      globe.style.width = st.w + 'px';
      globe.style.opacity = String(st.o);
      if (heroText) heroText.style.opacity = '0';
      if (integrations) { integrations.style.opacity = '0'; integrations.style.pointerEvents = 'none'; }
      sectionContainers.forEach(function (sc) {
        sc.cont.style.opacity = String(contentOpacityAt(scrollY, sc.el));
      });
    }

    if (window.scrollY > 100) {
      handleRefresh();
    } else {
      /* Normal load from top: wait for intro animation */
      setTimeout(function () {
        if (window.scrollY > 100) {
          /* User scrolled during the intro — handle like refresh */
          handleRefresh();
        } else {
          heroRect = heroGlobeRect();
          globe.style.top = heroRect.top + 'px';
          globe.style.left = heroRect.left + 'px';
          globe.style.width = heroRect.width + 'px';
          pinGlobe();
        }
      }, 2600);

      /* Also watch for scroll restoration that happens after DOMContentLoaded */
      /* Check for scroll restoration after DOMContentLoaded */
      setTimeout(function () {
        if (!introComplete && window.scrollY > 100) {
          handleRefresh();
        }
      }, 200);
    }

    /* ---- Scroll loop ---- */
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        if (!introComplete) return;
        var scrollY = window.scrollY;

        /* Globe position (pure function of scrollY) */
        var gs = globeStateAt(scrollY);
        window._lastGlobeDebug = { scrollY: scrollY, gs: gs, kfCount: keyframes.length, intro: introComplete };
        globe.style.top  = gs.t + 'px';
        globe.style.left = gs.l + 'px';
        globe.style.width = gs.w + 'px';
        globe.style.opacity = String(Math.max(0, Math.min(1, gs.o)));

        /* Hero text fade */
        if (heroText) {
          heroText.style.opacity = String(Math.max(0, 1 - scrollY / 400));
        }

        /* Orbital constellation */
        if (integrations) {
          var co = scrollY < 50 ? 1 : Math.max(0, 1 - (scrollY - 50) / 200);
          integrations.style.opacity = String(co);
          integrations.style.pointerEvents = co < 0.3 ? 'none' : '';
        }

        /* Content opacity per section */
        sectionContainers.forEach(function (sc) {
          var op = Math.max(0, Math.min(1, contentOpacityAt(scrollY, sc.el)));
          sc.cont.style.opacity = String(op);
          sc.cont.style.pointerEvents = op > 0.5 ? 'auto' : 'none';
        });
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      keyframes = buildKeyframes();
      if (introComplete) onScroll();
    });

    /* Fire once to set initial state */
    onScroll();
  }

  /* ---- Capability carousel curve ----------------------------------------
   * Cards in .capability-carousel get a vertical offset based on their
   * distance from the horizontal center of the scroll container, creating
   * the arc/curve effect from the user's drawing. */

  /* ---- Capabilities carousel: curved arc + auto-scroll ----
   * Cards arc upward toward the globe (∪ curve) and auto-scroll
   * right-to-left using translateX transforms (not scrollLeft,
   * which breaks in overflow:hidden containers). */

  function initCapabilityCarousel() {
    var carousel = document.querySelector('.capability-carousel');
    if (!carousel) return;
    if (window.innerWidth < 1024) return;

    var cards = Array.from(carousel.querySelectorAll('.capability-card'));
    if (!cards.length) return;

    var CURVE_HEIGHT = 25;  /* subtle — no popping, just a gentle arc */
    var CARD_GAP = 40;
    var CARD_W = 280;
    var SLOT = CARD_W + CARD_GAP;
    var TRACK = cards.length * SLOT;
    var SPEED = 0.8;
    var offset = 0;
    var wasVisible = false;

    function animate() {
      /* Only animate when the capabilities section container is visible */
      var cont = carousel.closest('.container');
      var isVisible = cont && parseFloat(cont.style.opacity || '0') > 0.3;

      if (!isVisible) {
        wasVisible = false;
        requestAnimationFrame(animate);
        return;
      }

      /* On first visible frame, start offset so all cards are off
         the RIGHT edge. They'll scroll in naturally from right to left. */
      if (!wasVisible) {
        offset = -TRACK;
        wasVisible = true;
      }

      /* Speed up entry, then settle to normal pace */
      var currentSpeed = offset < 0 ? SPEED * 6 : SPEED;
      offset = (offset + currentSpeed) % TRACK;

      var vw = carousel.getBoundingClientRect().width;
      var cx = vw / 2;

      cards.forEach(function (card, i) {
        /* Position along the infinite track, wrapping to stay near viewport */
        var x = ((i * SLOT - offset) % TRACK + TRACK) % TRACK;
        /* Center the track so cards appear from both sides */
        x -= TRACK / 2 - cx;

        /* Distance from center, normalized to -1..1 over viewport width */
        var d = (x + CARD_W / 2 - cx) / cx;
        var clamp = Math.max(-1.5, Math.min(1.5, d));

        /* Gentle arc: smooth cosine curve, center slightly lower,
           edges slightly higher. No sharp transitions. */
        var yOff = 0;
        if (Math.abs(clamp) <= 1) {
          yOff = (Math.cos(clamp * Math.PI) - 1) * CURVE_HEIGHT / 2;
        }

        /* Scale and opacity based on distance from center */
        var a = Math.min(1, Math.abs(clamp));
        var scale = 1 - a * 0.18;
        var op = Math.max(0, 1 - a * 0.6);

        /* Hide cards that are way off screen */
        if (Math.abs(clamp) > 1.4) op = 0;

        card.style.transform = 'translateX(' + x.toFixed(0) + 'px) translateY(' + yOff.toFixed(0) + 'px) scale(' + scale.toFixed(3) + ')';
        card.style.opacity = op.toFixed(2);
      });

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
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
    initGlobeScroll();
    initCapabilityCarousel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

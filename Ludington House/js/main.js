/* =============================================================
   Ludington House — Interactions & Reveal Animations
   ============================================================= */
(function () {
  'use strict';

  // --- Sticky nav state ---
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 24) nav.classList.add('is-stuck');
    else nav.classList.remove('is-stuck');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Mobile menu toggle ---
  const toggle = document.getElementById('navToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    // Close on link click (mobile)
    nav.querySelectorAll('.nav__menu a').forEach((a) => {
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- Hero stagger (uses data-delay) ---
  document.querySelectorAll('.hero .reveal').forEach((el) => {
    const delay = parseInt(el.dataset.delay || '0', 10);
    el.style.setProperty('--delay', delay);
  });

  // --- Scroll reveal via IntersectionObserver ---
  const toReveal = document.querySelectorAll('.section .reveal, .footer .reveal');
  toReveal.forEach((el) => {
    const delay = parseInt(el.dataset.delay || '0', 10);
    el.style.setProperty('--reveal-delay', delay);
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -60px 0px' }
    );
    toReveal.forEach((el) => io.observe(el));
  } else {
    // Fallback — show everything
    toReveal.forEach((el) => el.classList.add('is-visible'));
  }

  // --- Year in footer ---
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Subtle parallax for hero orbs on mouse move ---
  const hero = document.querySelector('.hero');
  if (hero && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const orbs = hero.querySelectorAll('.hero__orb');
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      orbs.forEach((orb, i) => {
        const depth = (i + 1) * 12;
        orb.style.transform = `translate(${cx * depth}px, ${cy * depth}px)`;
      });
    });
  }
})();

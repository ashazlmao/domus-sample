/**
 * animations.js — Domus Interiors
 *
 * Handles:
 * - Custom luxury cursor (desktop only)
 * - Hero page-load stagger sequence
 * - IntersectionObserver scroll reveals (.reveal elements)
 * - CTA section scroll animation
 * - Performance: RAF-based cursor, passive listeners, no layout thrashing
 */

(function () {
    'use strict';
  
    /* ── ═══════════════════════════════════════════ ── */
    /*    CUSTOM CURSOR                                  */
    /* ── ═══════════════════════════════════════════ ── */
  
    (function initCursor() {
      // Only on devices with a fine pointer (desktop mouse)
      if (!window.matchMedia('(pointer: fine)').matches) return;
  
      const cursor = document.querySelector('.cursor');
      if (!cursor) return;
  
      const ring = cursor.querySelector('.cursor__ring');
      const dot  = cursor.querySelector('.cursor__dot');
  
      let mouseX = -100;
      let mouseY = -100;
      let curX   = -100;
      let curY   = -100;
      let rafId  = null;
      let isHovering  = false;
      let isClicking  = false;
  
      // Lerp factor — lower = smoother/laggier, higher = snappier
      // Ring follows with interpolation; dot is immediate
      const LERP = 0.12;
  
      function lerp(a, b, t) {
        return a + (b - a) * t;
      }
  
      function updateCursor() {
        curX = lerp(curX, mouseX, LERP);
        curY = lerp(curY, mouseY, LERP);
  
        cursor.style.transform = 'translate3d(' + Math.round(mouseX) + 'px, ' + Math.round(mouseY) + 'px, 0)';
  
        if (ring) {
          // Ring uses lerped position for smooth follow
          ring.style.transform = ring.style.transform; // class handles scale
        }
  
        rafId = requestAnimationFrame(updateCursor);
      }
  
      function onMouseMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
      }
  
      function onMouseEnterInteractive() {
        isHovering = true;
        cursor.classList.add('cursor--hovering');
      }
  
      function onMouseLeaveInteractive() {
        isHovering = false;
        cursor.classList.remove('cursor--hovering');
      }
  
      function onMouseDown() {
        isClicking = true;
        cursor.classList.add('cursor--clicking');
      }
  
      function onMouseUp() {
        isClicking = false;
        cursor.classList.remove('cursor--clicking');
      }
  
      function onMouseEnterDocument() {
        cursor.style.opacity = '1';
      }
  
      function onMouseLeaveDocument() {
        cursor.style.opacity = '0';
      }
  
      // Attach hover listeners to interactive elements
      function bindInteractiveElements() {
        const targets = document.querySelectorAll(
          'a, button, .btn, [role="button"], input, label, select'
        );
        targets.forEach(function (el) {
          el.addEventListener('mouseenter', onMouseEnterInteractive);
          el.addEventListener('mouseleave', onMouseLeaveInteractive);
        });
      }
  
      // Init
      cursor.style.opacity = '0';
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      document.documentElement.addEventListener('mouseenter', onMouseEnterDocument);
      document.documentElement.addEventListener('mouseleave', onMouseLeaveDocument);
  
      bindInteractiveElements();
      rafId = requestAnimationFrame(updateCursor);
  
      // Re-bind when new elements added (e.g. mobile menu opens)
      const observer = new MutationObserver(bindInteractiveElements);
      observer.observe(document.body, { childList: true, subtree: true });
  
    })();
  
  
    /* ── ═══════════════════════════════════════════ ── */
    /*    HERO PAGE-LOAD STAGGER                         */
    /* ── ═══════════════════════════════════════════ ── */
  
    (function initHeroStagger() {
      // Elements with data-hero-order attribute are staggered on load
      // Order values: 0 = eyebrow, 1 = headline, 2 = subtext, 3 = bullets,
      //               4 = cta-row, 5 = microcopy/badges, visual = special
  
      const BASE_DELAY    = 80;  // ms between each element
      const FIRST_DELAY   = 100; // initial offset before sequence starts
      const VISUAL_DELAY  = 520; // ms for right-side visual
      const DURATION      = 700; // ms total animation duration
  
      const heroElements = document.querySelectorAll('[data-hero-order]');
      const heroVisual   = document.querySelector('[data-hero-visual]');
  
      function animateHeroElement(el, delayMs) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(16px)';
        el.style.transition = 'none';
  
        // Force reflow to ensure starting state is painted
        void el.offsetHeight;
  
        setTimeout(function () {
          el.style.transition =
            'opacity ' + DURATION + 'ms cubic-bezier(0.16, 1, 0.3, 1), ' +
            'transform ' + DURATION + 'ms cubic-bezier(0.16, 1, 0.3, 1)';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, delayMs);
      }
  
      function animateHeroVisual(el) {
        el.style.opacity = '0';
        el.style.transform = 'scale(0.986)';
        el.style.transition = 'none';
  
        void el.offsetHeight;
  
        setTimeout(function () {
          el.style.transition =
            'opacity 900ms cubic-bezier(0.16, 1, 0.3, 1), ' +
            'transform 900ms cubic-bezier(0.16, 1, 0.3, 1)';
          el.style.opacity = '1';
          el.style.transform = 'scale(1)';
        }, VISUAL_DELAY);
      }
  
      // Respect reduced motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        heroElements.forEach(function (el) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
        if (heroVisual) {
          heroVisual.style.opacity = '1';
          heroVisual.style.transform = 'none';
        }
        return;
      }
  
      heroElements.forEach(function (el) {
        var order = parseInt(el.getAttribute('data-hero-order'), 10) || 0;
        var delay = FIRST_DELAY + (order * BASE_DELAY);
        animateHeroElement(el, delay);
      });
  
      if (heroVisual) {
        animateHeroVisual(heroVisual);
      }
  
    })();
  
  
    /* ── ═══════════════════════════════════════════ ── */
    /*    SCROLL REVEAL — IntersectionObserver          */
    /* ── ═══════════════════════════════════════════ ── */
  
    (function initScrollReveals() {
      if (!('IntersectionObserver' in window)) {
        // Fallback: just make everything visible
        document.querySelectorAll('.reveal, .reveal--slow, .reveal--fade').forEach(function (el) {
          el.classList.add('is-revealed');
        });
        return;
      }
  
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('.reveal, .reveal--slow, .reveal--fade').forEach(function (el) {
          el.classList.add('is-revealed');
        });
        return;
      }
  
      var observerOptions = {
        root: null,
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.12
      };
  
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            // Once revealed, stop observing this element
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);
  
      document.querySelectorAll('.reveal, .reveal--slow, .reveal--fade').forEach(function (el) {
        observer.observe(el);
      });
  
    })();
  
  
    /* ── ═══════════════════════════════════════════ ── */
    /*    CTA SECTION — Staggered Scroll Reveal         */
    /* ── ═══════════════════════════════════════════ ── */
  
    (function initCtaReveal() {
      // CTA section children are assigned stagger delays via data-delay attr
      // which maps to CSS transition-delay utilities in animations.css.
      // The IntersectionObserver above handles the .is-revealed trigger.
      // This function just ensures stagger data-delay attributes are set
      // if the HTML doesn't set them, so the fallback still works.
  
      var ctaSection = document.querySelector('.cta-section');
      if (!ctaSection) return;
  
      var revealEls = ctaSection.querySelectorAll('.reveal, .reveal--slow');
      revealEls.forEach(function (el, i) {
        if (!el.hasAttribute('data-delay')) {
          el.setAttribute('data-delay', String(i));
        }
      });
  
    })();
  
  
    /* ── ═══════════════════════════════════════════ ── */
    /*    NAVBAR ENTRANCE ANIMATION                      */
    /* ── ═══════════════════════════════════════════ ── */
  
    (function initNavbarEntrance() {
      var navWrapper = document.querySelector('.navbar-wrapper');
      if (!navWrapper) return;
  
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        navWrapper.style.opacity = '1';
        return;
      }
  
      navWrapper.style.opacity = '0';
      navWrapper.style.transition = 'none';
  
      setTimeout(function () {
        navWrapper.style.transition = 'opacity 550ms cubic-bezier(0.22, 0.61, 0.36, 1)';
        navWrapper.style.opacity = '1';
      }, 60);
  
    })();
  
  })();
/**
 * navbar.js — Domus Interiors
 *
 * Handles:
 * - Capsule navbar scroll behavior (shrink + background shift)
 * - Mobile hamburger toggle + accessible open/close
 * - Keyboard trap and ESC to close on mobile
 * - Smooth link hover states (handled in CSS, triggered by class here)
 * - Click-outside to close mobile menu
 */

(function () {
    'use strict';
  
    /* ── Query Elements ── */
    const wrapper    = document.querySelector('.navbar-wrapper');
    const navbar     = document.querySelector('.navbar');
    const hamburger  = document.querySelector('.navbar__hamburger');
    const mobileMenu = document.querySelector('.navbar__mobile-menu');
    const mobileLinks = document.querySelectorAll('.navbar__mobile-link, .navbar__mobile-cta');
  
    if (!wrapper || !navbar) return;
  
    /* ── State ── */
    let isMenuOpen    = false;
    let lastScrollY   = window.scrollY;
    let ticking       = false;
    const SCROLL_THRESHOLD = 60;
  
    /* ── Scroll Handler ── */
    function onScroll() {
      lastScrollY = window.scrollY;
  
      if (!ticking) {
        window.requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    }
  
    function updateNavbar() {
      if (lastScrollY > SCROLL_THRESHOLD) {
        navbar.classList.add('navbar--scrolled');
        wrapper.classList.add('navbar-wrapper--scrolled');
      } else {
        navbar.classList.remove('navbar--scrolled');
        wrapper.classList.remove('navbar-wrapper--scrolled');
      }
      ticking = false;
    }
  
    /* ── Mobile Menu Toggle ── */
    function openMenu() {
      isMenuOpen = true;
      hamburger.classList.add('navbar__hamburger--open');
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Close navigation');
  
      if (mobileMenu) {
        mobileMenu.classList.add('navbar__mobile-menu--open');
        mobileMenu.setAttribute('aria-hidden', 'false');
  
        // Focus first link for accessibility
        const firstLink = mobileMenu.querySelector('a, button');
        if (firstLink) firstLink.focus();
      }
    }
  
    function closeMenu() {
      isMenuOpen = false;
      hamburger.classList.remove('navbar__hamburger--open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Open navigation');
  
      if (mobileMenu) {
        mobileMenu.classList.remove('navbar__mobile-menu--open');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }
    }
  
    function toggleMenu() {
      if (isMenuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }
  
    /* ── Click Outside to Close ── */
    function onDocumentClick(e) {
      if (!isMenuOpen) return;
      if (navbar.contains(e.target)) return;
      closeMenu();
    }
  
    /* ── Keyboard: ESC to close ── */
    function onKeyDown(e) {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
        hamburger.focus();
      }
    }
  
    /* ── Close menu on mobile link click ── */
    function bindMobileLinks() {
      mobileLinks.forEach(function (link) {
        link.addEventListener('click', closeMenu);
      });
    }
  
    /* ── Initial Setup ── */
    function init() {
      // Set initial ARIA state
      if (hamburger) {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Open navigation');
        hamburger.setAttribute('aria-controls', 'mobile-menu');
        hamburger.addEventListener('click', toggleMenu);
      }
  
      if (mobileMenu) {
        mobileMenu.setAttribute('aria-hidden', 'true');
        mobileMenu.setAttribute('id', 'mobile-menu');
        mobileMenu.setAttribute('role', 'dialog');
        mobileMenu.setAttribute('aria-label', 'Navigation menu');
      }
  
      bindMobileLinks();
  
      // Scroll listener — passive for performance
      window.addEventListener('scroll', onScroll, { passive: true });
  
      // Click outside
      document.addEventListener('click', onDocumentClick);
  
      // Keyboard
      document.addEventListener('keydown', onKeyDown);
  
      // Run once to set correct state on load
      updateNavbar();
    }
  
    /* ── Wait for DOM ── */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
  })();
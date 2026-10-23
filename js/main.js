/**
 * Celsior Detailing — Main Application Logic
 * Mobile Drawer, Smooth Anchor Scrolling, Sticky Header State, Portfolio Filtering & Live Studio Hours
 * Strict Zero-Emoji Architecture
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Mobile Drawer Navigation Controller (with Keyboard & Focus Management)
  // ==========================================================================
  function initMobileDrawer() {
    const btnBurger = document.getElementById('btnMobileMenu');
    const btnClose = document.getElementById('btnMobileClose');
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileDrawerOverlay');
    const drawerLinks = document.querySelectorAll('.drawer-nav-link');

    if (!btnBurger || !drawer || !overlay) return;

    let previouslyFocusedElement = null;

    function openDrawer() {
      previouslyFocusedElement = document.activeElement;
      drawer.classList.add('active');
      overlay.classList.add('active');
      btnBurger.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Focus close button or first link inside drawer
      if (btnClose) {
        btnClose.focus();
      } else if (drawerLinks.length > 0) {
        drawerLinks[0].focus();
      }
    }

    function closeDrawer() {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
      btnBurger.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      // Return focus to trigger button
      if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
        previouslyFocusedElement.focus();
      } else {
        btnBurger.focus();
      }
    }

    btnBurger.addEventListener('click', function (e) {
      e.preventDefault();
      const isOpen = drawer.classList.contains('active');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    if (btnClose) {
      btnClose.addEventListener('click', function (e) {
        e.preventDefault();
        closeDrawer();
      });
    }

    overlay.addEventListener('click', closeDrawer);

    drawerLinks.forEach(function (link) {
      link.addEventListener('click', closeDrawer);
    });

    // Close on Escape key & return focus
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('active')) {
        closeDrawer();
      }
    });
  }

  // ==========================================================================
  // 2. Sticky Header Scroll State
  // ==========================================================================
  function initStickyHeader() {
    const header = document.getElementById('siteHeader');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    function onScroll() {
      lastScrollY = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(function () {
          if (lastScrollY > 20) {
            header.classList.add('header-scrolled');
          } else {
            header.classList.remove('header-scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ==========================================================================
  // 3. Smooth Anchor Navigation with Sticky Header Offset
  // ==========================================================================
  function initSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    const header = document.getElementById('siteHeader');

    anchorLinks.forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          const headerHeight = header ? header.offsetHeight : 76;
          const elementPosition = targetEl.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Update URL hash cleanly
          if (history.pushState) {
            history.pushState(null, null, targetId);
          }
        }
      });
    });
  }

  // ==========================================================================
  // 4. Portfolio Filter System
  // ==========================================================================
  function initPortfolioFilters() {
    const filterButtons = document.querySelectorAll('.portfolio-filters .filter-btn');
    const caseCards = document.querySelectorAll('.portfolio-grid .case-card');

    if (!filterButtons.length || !caseCards.length) return;

    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const filterValue = this.getAttribute('data-filter');

        // Update active filter button state
        filterButtons.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        this.classList.add('active');
        this.setAttribute('aria-selected', 'true');

        // Filter cards
        caseCards.forEach(function (card) {
          const categories = (card.getAttribute('data-category') || '').split(' ');
          if (filterValue === 'all' || categories.includes(filterValue)) {
            card.classList.remove('filtered-out');
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            window.requestAnimationFrame(function () {
              card.style.transition = 'opacity 250ms ease, transform 250ms ease';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
          } else {
            card.classList.add('filtered-out');
          }
        });
      });
    });
  }

  // ==========================================================================
  // 5. Live Studio Operating Hours in Krasnoyarsk Timezone (UTC+7)
  // ==========================================================================
  function initStudioHours() {
    const badgeText = document.getElementById('studioScheduleBadge');
    const drawerBadgeText = document.getElementById('drawerScheduleBadge');
    if (!badgeText && !drawerBadgeText) return;

    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const krasTime = new Date(utcMs + (7 * 3600000));
    const hour = krasTime.getHours();

    const isOpen = hour >= 9 && hour < 21;
    const statusText = isOpen ? 'Бокс открыт • до 21:00' : 'Старт в 09:00 • Онлайн 24/7';

    if (badgeText) badgeText.textContent = statusText;
    if (drawerBadgeText) drawerBadgeText.textContent = statusText;
  }

  // ==========================================================================
  // Document Ready Initialization
  // ==========================================================================
  function initApp() {
    // Remove no-js flag
    document.documentElement.classList.remove('no-js');
    document.documentElement.classList.add('js');

    initMobileDrawer();
    initStickyHeader();
    initSmoothScroll();
    initPortfolioFilters();
    initStudioHours();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();

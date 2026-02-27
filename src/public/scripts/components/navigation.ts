/**
 * Navigation Component
 * Modern UI Redesign - White Lab
 * 
 * Implements scroll tracking for header state changes,
 * mobile menu animations, and navigation hover effects.
 * 
 * Validates Requirements: 4.2, 4.4, 4.5
 */

(() => {
  'use strict';

  // ========================================
  // Configuration
  // ========================================

  const CONFIG = {
    scrollThreshold: 50, // Pixels scrolled before header changes state
    scrollDebounce: 10,  // Debounce delay for scroll events (ms)
    mobileBreakpoint: 760, // Mobile breakpoint (px)
  };

  // ========================================
  // Utility Functions
  // ========================================

  /**
   * Throttle function to limit execution rate
   * @param {Function} func - Function to throttle
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Throttled function
   */
  const throttle = (func, delay) => {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  };

  /**
   * Check if device supports hover
   * @returns {boolean}
   */
  const canHover = () => {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  };

  /**
   * Check if reduced motion is preferred
   * @returns {boolean}
   */
  const prefersReducedMotion = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  // ========================================
  // Header Scroll State Management
  // ========================================

  /**
   * Initialize header scroll tracking
   * Updates header state based on scroll position
   */
  const initHeaderScrollTracking = () => {
    const header = document.querySelector('.site-header');
    
    if (!header) {
      return;
    }

    let isScrolled = false;

    /**
     * Update header state based on scroll position
     */
    const updateHeaderState = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const shouldBeScrolled = scrollY > CONFIG.scrollThreshold;

      // Only update if state changed to avoid unnecessary DOM operations
      if (shouldBeScrolled !== isScrolled) {
        isScrolled = shouldBeScrolled;
        header.classList.toggle('is-scrolled', isScrolled);
      }
    };

    // Throttle scroll handler for performance
    const throttledUpdate = throttle(updateHeaderState, CONFIG.scrollDebounce);

    // Listen to scroll events
    window.addEventListener('scroll', throttledUpdate, { passive: true });

    // Initial check
    updateHeaderState();
  };

  // ========================================
  // Mobile Menu Management
  // ========================================

  /**
   * Initialize mobile menu functionality
   * Handles menu toggle, animations, and body scroll lock
   */
  const initMobileMenu = () => {
    const header = document.querySelector('.site-header');
    const navLinks = document.querySelector('.nav-links');
    
    if (!header || !navLinks) {
      return;
    }

    // Create mobile menu toggle button if it doesn't exist
    let toggleButton = header.querySelector('.mobile-menu-toggle');
    
    if (!toggleButton) {
      toggleButton = createMobileMenuToggle();
      const navWrap = header.querySelector('.nav-wrap');
      
      if (navWrap) {
        // Insert before the call button
        const callBtn = navWrap.querySelector('.call-btn');
        if (callBtn) {
          navWrap.insertBefore(toggleButton, callBtn);
        } else {
          navWrap.appendChild(toggleButton);
        }
      }
    }

    let isMenuOpen = false;

    /**
     * Toggle mobile menu state
     */
    const toggleMenu = () => {
      isMenuOpen = !isMenuOpen;
      
      toggleButton.classList.toggle('is-active', isMenuOpen);
      navLinks.classList.toggle('is-active', isMenuOpen);
      document.body.classList.toggle('mobile-menu-open', isMenuOpen);

      // Update ARIA attributes for accessibility
      toggleButton.setAttribute('aria-expanded', isMenuOpen.toString());
      navLinks.setAttribute('aria-hidden', (!isMenuOpen).toString());
    };

    /**
     * Close mobile menu
     */
    const closeMenu = () => {
      if (isMenuOpen) {
        toggleMenu();
      }
    };

    // Toggle button click handler
    toggleButton.addEventListener('click', toggleMenu);

    // Close menu when clicking on navigation links
    const navLinksArray = Array.from(navLinks.querySelectorAll('a'));
    navLinksArray.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      if (isMenuOpen && 
          !navLinks.contains(event.target) && 
          !toggleButton.contains(event.target)) {
        closeMenu();
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        closeMenu();
        toggleButton.focus(); // Return focus to toggle button
      }
    });

    // Close menu on window resize if viewport becomes desktop size
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > CONFIG.mobileBreakpoint && isMenuOpen) {
          closeMenu();
        }
      }, 150);
    });
  };

  /**
   * Create mobile menu toggle button element
   * @returns {HTMLElement} Toggle button element
   */
  const createMobileMenuToggle = () => {
    const button = document.createElement('button');
    button.className = 'mobile-menu-toggle';
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', 'Открыть меню');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'navigation');

    // Create hamburger icon spans
    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      button.appendChild(span);
    }

    return button;
  };

  // ========================================
  // Navigation Hover Effects
  // ========================================

  /**
   * Initialize navigation hover effects
   * Adds enhanced hover interactions for navigation links
   */
  const initNavigationHoverEffects = () => {
    // Skip hover effects if device doesn't support hover or user prefers reduced motion
    if (!canHover() || prefersReducedMotion()) {
      return;
    }

    const navLinks = document.querySelectorAll('.nav-links a');
    
    if (!navLinks.length) {
      return;
    }

    navLinks.forEach(link => {
      // Add smooth color transition on hover
      link.addEventListener('mouseenter', function() {
        this.style.transition = 'color var(--transition-fast)';
      });

      // Optional: Add ripple effect on click (can be enhanced further)
      link.addEventListener('click', function(event) {
        if (prefersReducedMotion()) {
          return;
        }

        const rect = this.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Store click position for potential ripple effect
        this.style.setProperty('--click-x', `${x}px`);
        this.style.setProperty('--click-y', `${y}px`);
      });
    });
  };

  /**
   * Initialize active link highlighting based on current page section
   */
  const initActiveNavigation = () => {
    const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
    
    if (!navLinks.length) {
      return;
    }

    const getLinkHash = (link) => {
      const href = link.getAttribute('href') || '';
      if (!href.includes('#')) {
        return '';
      }
      return `#${href.split('#').pop()}`;
    };

    const setActiveHash = (activeHash) => {
      navLinks.forEach((link) => {
        link.classList.toggle('is-active', getLinkHash(link) === activeHash);
      });
    };

    const currentPath = window.location.pathname;
    const isHomePage = currentPath === '/' || currentPath === '';

    // Non-home pages keep simple path/hash matching.
    if (!isHomePage) {
      const currentHash = window.location.hash;
      navLinks.forEach((link) => {
        const isActive = link.pathname === currentPath && link.hash === currentHash;
        link.classList.toggle('is-active', isActive);
      });
      return;
    }

    const sectionLinks = navLinks
      .map((link) => {
        const hash = getLinkHash(link);
        const target = hash ? document.getElementById(hash.slice(1)) : null;
        if (!hash || !target) {
          return null;
        }
        return { link, hash, target };
      })
      .filter(Boolean);

    if (!sectionLinks.length) {
      return;
    }

    const getActiveHashFromScroll = () => {
      const header = document.querySelector('.site-header');
      const headerHeight = header ? header.offsetHeight : 0;
      const probeY = window.scrollY + headerHeight + Math.max(window.innerHeight * 0.2, 88);

      let activeHash = sectionLinks[0].hash;
      sectionLinks.forEach((item) => {
        if (item.target.offsetTop <= probeY) {
          activeHash = item.hash;
        }
      });

      return activeHash;
    };

    const syncActiveNavigationFromScroll = () => {
      setActiveHash(getActiveHashFromScroll());
    };

    const syncActiveNavigationFromHash = () => {
      const hash = window.location.hash;
      if (hash && sectionLinks.some((item) => item.hash === hash)) {
        setActiveHash(hash);
        return;
      }
      syncActiveNavigationFromScroll();
    };

    const throttledScrollSync = throttle(syncActiveNavigationFromScroll, CONFIG.scrollDebounce);

    window.addEventListener('scroll', throttledScrollSync, { passive: true });
    window.addEventListener('resize', throttledScrollSync);
    window.addEventListener('hashchange', syncActiveNavigationFromHash);
    syncActiveNavigationFromHash();
  };

  // ========================================
  // Smooth Scroll Enhancement
  // ========================================

  /**
   * Initialize smooth scrolling for anchor links
   * Enhances navigation with smooth scroll behavior
   */
  const initSmoothScroll = () => {
    // Skip if user prefers reduced motion
    if (prefersReducedMotion()) {
      return;
    }

    const navLinks = document.querySelectorAll('.nav-links a[href^="#"], .nav-links a[href^="/#"]');
    
    if (!navLinks.length) {
      return;
    }

    navLinks.forEach(link => {
      link.addEventListener('click', function(event) {
        const href = this.getAttribute('href');
        const hash = href.includes('#') ? href.split('#')[1] : '';
        
        if (!hash) {
          return;
        }

        const targetElement = document.getElementById(hash);
        
        if (targetElement) {
          event.preventDefault();
          
          // Get header height for offset
          const header = document.querySelector('.site-header');
          const headerHeight = header ? header.offsetHeight : 0;
          
          // Calculate scroll position
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = targetPosition - headerHeight - 20; // 20px extra padding

          // Smooth scroll to target
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Update URL hash
          history.pushState(null, '', `#${hash}`);
        }
      });
    });
  };

  // ========================================
  // Initialization
  // ========================================

  /**
   * Initialize all navigation functionality
   */
  const init = () => {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // Initialize all navigation features
    initHeaderScrollTracking();
    initMobileMenu();
    initNavigationHoverEffects();
    initActiveNavigation();
    initSmoothScroll();
  };

  // Start initialization
  init();

})();

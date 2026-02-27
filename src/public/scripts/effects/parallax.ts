/**
 * Parallax Effects Module
 * Modern UI Redesign - White Lab
 * 
 * Implements:
 * - Enhanced parallax scrolling effects for background elements
 * - Global interactive glow effect following cursor movement
 * - Performance-optimized using requestAnimationFrame
 * 
 * Validates Requirements: 2.1, 3.3, 13.4
 * 
 * Usage:
 * 1. Include this script in your HTML: <script src="/scripts/effects/parallax.js"></script>
 * 2. Add data-parallax-speed attribute to elements you want to parallax
 *    Example: <div class="orb" data-parallax-speed="0.12"></div>
 * 3. The cursor glow effect is automatically applied to the entire page
 * 
 * Features:
 * - Automatically targets gradient orbs and ambient elements
 * - Respects prefers-reduced-motion setting
 * - Only shows cursor glow on devices with hover capability
 * - Pauses animation when page is hidden to save resources
 * 
 * Test page: /test-parallax.html
 * 
 * Note: This module provides enhanced parallax effects that complement
 * the existing data-parallax-speed implementation in site.js
 */

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  if (reduceMotion) {
    return;
  }

  // Configuration
  const CONFIG = {
    parallax: {
      maxOffset: 80,
      smoothing: 0.12,
    },
    cursor: {
      glowSize: 520,
      intensity: 0.35,
      smoothing: 0.18,
    }
  };

  // State
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;
  let rafId = null;
  let cursorGlow = null;

  /**
   * Create global cursor glow element
   */
  const createCursorGlow = () => {
    if (!canHover) return;

    cursorGlow = document.createElement("div");
    cursorGlow.className = "global-cursor-glow";
    cursorGlow.setAttribute("aria-hidden", "true");
    cursorGlow.style.cssText = `
      position: fixed;
      width: ${CONFIG.cursor.glowSize}px;
      height: ${CONFIG.cursor.glowSize}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(55, 208, 190, ${CONFIG.cursor.intensity}), transparent 65%);
      pointer-events: none;
      z-index: 1;
      mix-blend-mode: screen;
      transform: translate(-50%, -50%);
      will-change: transform;
      opacity: 0;
      transition: opacity 0.4s ease;
    `;
    document.body.appendChild(cursorGlow);
  };

  /**
   * Update cursor glow position with smooth interpolation
   */
  const updateCursorGlow = () => {
    if (!cursorGlow) return;

    // Smooth interpolation
    currentX += (mouseX - currentX) * CONFIG.cursor.smoothing;
    currentY += (mouseY - currentY) * CONFIG.cursor.smoothing;

    cursorGlow.style.left = `${currentX}px`;
    cursorGlow.style.top = `${currentY}px`;
  };

  /**
   * Enhanced parallax effect for background orbs and ambient elements
   */
  const updateParallaxOrbs = () => {
    const parallaxOrbs = document.querySelectorAll(
      ".hero-gradient-orb, .studio-orb, .cinema-orb, .finale-orb, .hero-ambient"
    );

    if (!parallaxOrbs.length) return;

    const viewportMid = window.innerHeight * 0.5;
    const scrollY = window.pageYOffset;

    for (const orb of parallaxOrbs) {
      const rect = orb.getBoundingClientRect();
      const elementMid = rect.top + rect.height * 0.5;
      const distance = elementMid - viewportMid;
      
      // Get parallax speed from data attribute or use default
      const speed = Number(orb.dataset.parallaxSpeed || 0.08);
      
      // Calculate offset with clamping
      const offset = clamp(-distance * speed, -CONFIG.parallax.maxOffset, CONFIG.parallax.maxOffset);
      
      // Apply transform
      orb.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    }
  };

  /**
   * Main animation loop
   */
  const animate = () => {
    updateCursorGlow();
    updateParallaxOrbs();
    rafId = requestAnimationFrame(animate);
  };

  /**
   * Handle mouse move
   */
  const handleMouseMove = (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  };

  /**
   * Handle mouse enter document
   */
  const handleMouseEnter = () => {
    if (cursorGlow) {
      cursorGlow.style.opacity = "1";
    }
  };

  /**
   * Handle mouse leave document
   */
  const handleMouseLeave = () => {
    if (cursorGlow) {
      cursorGlow.style.opacity = "0";
    }
  };

  /**
   * Handle visibility change
   */
  const handleVisibilityChange = () => {
    if (document.hidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    } else {
      if (!rafId) {
        rafId = requestAnimationFrame(animate);
      }
    }
  };

  /**
   * Initialize parallax effects
   */
  const init = () => {
    // Create cursor glow
    createCursorGlow();

    // Set up event listeners
    if (canHover && cursorGlow) {
      document.addEventListener("mousemove", handleMouseMove, { passive: true });
      document.addEventListener("mouseenter", handleMouseEnter);
      document.addEventListener("mouseleave", handleMouseLeave);
    }

    window.addEventListener("scroll", () => {
      if (!rafId) {
        rafId = requestAnimationFrame(animate);
      }
    }, { passive: true });

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Start animation loop
    rafId = requestAnimationFrame(animate);
  };

  /**
   * Cleanup function
   */
  const destroy = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseenter", handleMouseEnter);
    document.removeEventListener("mouseleave", handleMouseLeave);
    document.removeEventListener("visibilitychange", handleVisibilityChange);

    if (cursorGlow && cursorGlow.parentNode) {
      cursorGlow.parentNode.removeChild(cursorGlow);
      cursorGlow = null;
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Export for potential external use
  window.ParallaxEffects = { init, destroy };
})();

/**
 * Scroll Reveal Effects Module
 * Modern UI Redesign - White Lab
 * 
 * Implements:
 * - Intersection Observer API for scroll-triggered animations
 * - Staggered animations for card grids and lists
 * - Fade-in effects with customizable delays
 * - Performance-optimized reveal animations
 * 
 * Validates Requirements: 2.3, 2.5, 5.3, 10.2, 10.3
 * 
 * Usage:
 * 1. Include this script in your HTML: <script src="/scripts/effects/scroll-reveal.js"></script>
 * 2. Add data-reveal attribute to elements you want to animate
 *    Example: <div class="service-card" data-reveal></div>
 * 3. Optional: Customize animation with data attributes:
 *    - data-reveal-delay="200" - Delay in milliseconds
 *    - data-reveal-stagger="100" - Stagger delay for groups
 *    - data-reveal-direction="up|down|left|right" - Animation direction
 * 
 * Features:
 * - Automatically targets common elements (.service-card, .media-tile, etc.)
 * - Respects prefers-reduced-motion setting
 * - Staggered animations for groups of elements
 * - Configurable intersection thresholds
 * - One-time or repeating animations
 * - Cleanup on element removal
 * 
 * CSS Integration:
 * Elements with data-reveal will receive these classes:
 * - .reveal-hidden: Initial hidden state (before intersection)
 * - .reveal-visible: Visible state (after intersection)
 * - .reveal-from-{direction}: Animation direction class
 */

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Configuration
  const CONFIG = {
    // Intersection Observer options
    rootMargin: "0px 0px -100px 0px", // Trigger 100px before element enters viewport
    threshold: 0.15, // Trigger when 15% of element is visible
    
    // Animation options
    defaultDelay: 0, // Default delay in milliseconds
    defaultStagger: 80, // Default stagger delay for groups in milliseconds
    defaultDirection: "up", // Default animation direction
    
    // Behavior
    once: true, // Only animate once (don't re-animate on scroll up)
    
    // Selectors for auto-targeting
    autoTargetSelectors: [
      ".media-tile",
      ".faq-item",
      ".advantage-item",
      ".metric-card",
      ".floating-card",
      ".testimonial-card",
      ".team-member",
      ".contact-card",
    ],
  };

  // Skip animations if user prefers reduced motion
  if (reduceMotion) {
    // Add visible class immediately to all reveal elements
    document.addEventListener("DOMContentLoaded", () => {
      const elements = document.querySelectorAll("[data-reveal]");
      elements.forEach((el) => {
        el.classList.add("reveal-visible");
        el.classList.remove("reveal-hidden");
      });
    });
    return;
  }

  // State management
  const observedElements = new WeakMap();
  let observer = null;

  /**
   * Get animation direction from element
   * @param {HTMLElement} element - The element to check
   * @returns {string} Animation direction
   */
  const getDirection = (element) => {
    return element.dataset.revealDirection || CONFIG.defaultDirection;
  };

  /**
   * Get delay from element
   * @param {HTMLElement} element - The element to check
   * @returns {number} Delay in milliseconds
   */
  const getDelay = (element) => {
    const delay = element.dataset.revealDelay;
    return delay ? parseInt(delay, 10) : CONFIG.defaultDelay;
  };

  /**
   * Get stagger delay from element
   * @param {HTMLElement} element - The element to check
   * @returns {number} Stagger delay in milliseconds
   */
  const getStagger = (element) => {
    const stagger = element.dataset.revealStagger;
    return stagger ? parseInt(stagger, 10) : CONFIG.defaultStagger;
  };

  /**
   * Calculate stagger delay for element in a group
   * @param {HTMLElement} element - The element to calculate delay for
   * @param {NodeList} siblings - All siblings in the group
   * @returns {number} Total delay including stagger
   */
  const calculateStaggerDelay = (element, siblings) => {
    const baseDelay = getDelay(element);
    const staggerDelay = getStagger(element);
    
    // Find index of element in siblings
    const index = Array.from(siblings).indexOf(element);
    
    // Calculate total delay
    return baseDelay + (index * staggerDelay);
  };

  /**
   * Initialize reveal element with hidden state
   * @param {HTMLElement} element - The element to initialize
   */
  const initRevealElement = (element) => {
    // Skip if already initialized
    if (observedElements.has(element)) return;

    // Add hidden class and direction class
    element.classList.add("reveal-hidden");
    
    const direction = getDirection(element);
    element.classList.add(`reveal-from-${direction}`);

    // Mark as initialized
    observedElements.set(element, {
      revealed: false,
      direction,
    });
  };

  /**
   * Reveal element with animation
   * @param {HTMLElement} element - The element to reveal
   * @param {number} delay - Delay before revealing
   */
  const revealElement = (element, delay = 0) => {
    const state = observedElements.get(element);
    if (!state || state.revealed) return;

    // Mark as revealed
    state.revealed = true;

    // Apply reveal after delay
    setTimeout(() => {
      element.classList.remove("reveal-hidden");
      element.classList.add("reveal-visible");
    }, delay);
  };

  /**
   * Handle intersection observer callback
   * @param {IntersectionObserverEntry[]} entries - Intersection entries
   */
  const handleIntersection = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        // Check if element is part of a staggered group
        const parent = element.parentElement;
        const siblings = parent ? parent.querySelectorAll("[data-reveal]") : [element];
        
        // Calculate delay (with stagger if in a group)
        const delay = siblings.length > 1 
          ? calculateStaggerDelay(element, siblings)
          : getDelay(element);
        
        // Reveal element
        revealElement(element, delay);
        
        // Unobserve if once is true
        if (CONFIG.once) {
          observer.unobserve(element);
        }
      }
    });
  };

  /**
   * Create and configure Intersection Observer
   * @returns {IntersectionObserver} Configured observer
   */
  const createObserver = () => {
    return new IntersectionObserver(handleIntersection, {
      rootMargin: CONFIG.rootMargin,
      threshold: CONFIG.threshold,
    });
  };

  /**
   * Observe element for scroll reveal
   * @param {HTMLElement} element - The element to observe
   */
  const observeElement = (element) => {
    if (!observer) return;
    
    initRevealElement(element);
    observer.observe(element);
  };

  /**
   * Unobserve element
   * @param {HTMLElement} element - The element to unobserve
   */
  const unobserveElement = (element) => {
    if (!observer) return;
    
    observer.unobserve(element);
    observedElements.delete(element);
    
    // Clean up classes
    element.classList.remove("reveal-hidden", "reveal-visible");
    element.classList.remove(
      "reveal-from-up",
      "reveal-from-down",
      "reveal-from-left",
      "reveal-from-right"
    );
  };

  /**
   * Find and observe all reveal elements
   */
  const observeAllElements = () => {
    // Find elements with data-reveal attribute
    const explicitElements = document.querySelectorAll("[data-reveal]");
    
    // Find elements matching auto-target selectors
    const autoElements = document.querySelectorAll(
      CONFIG.autoTargetSelectors.join(", ")
    );
    
    // Combine and deduplicate
    const allElements = new Set([...explicitElements, ...autoElements]);
    
    // Observe each element
    allElements.forEach((element) => {
      observeElement(element);
    });
  };

  /**
   * Initialize the scroll reveal module
   */
  const init = () => {
    // Check for Intersection Observer support
    if (!("IntersectionObserver" in window)) {
      console.warn("Intersection Observer not supported. Scroll reveal disabled.");
      // Show all elements immediately
      const elements = document.querySelectorAll("[data-reveal]");
      elements.forEach((el) => {
        el.classList.add("reveal-visible");
      });
      return;
    }

    // Create observer
    observer = createObserver();

    // Observe existing elements
    observeAllElements();

    // Watch for dynamically added elements
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Handle added nodes
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the node itself should be revealed
            if (
              node.matches &&
              (node.matches("[data-reveal]") ||
                CONFIG.autoTargetSelectors.some((selector) => node.matches(selector)))
            ) {
              observeElement(node);
            }
            
            // Check for reveal elements within the node
            if (node.querySelectorAll) {
              const revealElements = node.querySelectorAll("[data-reveal]");
              revealElements.forEach((element) => {
                observeElement(element);
              });
              
              // Check auto-target selectors
              CONFIG.autoTargetSelectors.forEach((selector) => {
                const autoElements = node.querySelectorAll(selector);
                autoElements.forEach((element) => {
                  if (!element.hasAttribute("data-reveal")) {
                    observeElement(element);
                  }
                });
              });
            }
          }
        });

        // Handle removed nodes
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the node itself was being observed
            if (
              node.matches &&
              (node.matches("[data-reveal]") ||
                CONFIG.autoTargetSelectors.some((selector) => node.matches(selector)))
            ) {
              unobserveElement(node);
            }
            
            // Check for reveal elements within the node
            if (node.querySelectorAll) {
              const revealElements = node.querySelectorAll("[data-reveal]");
              revealElements.forEach((element) => {
                unobserveElement(element);
              });
            }
          }
        });
      });
    });

    // Start observing DOM changes
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Store for cleanup
    window.ScrollReveal = {
      init,
      destroy: () => {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        if (mutationObserver) {
          mutationObserver.disconnect();
        }
      },
      observeElement,
      unobserveElement,
      mutationObserver,
    };
  };

  /**
   * Cleanup function
   */
  const destroy = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Export for potential external use
  window.ScrollReveal = { init, destroy, observeElement, unobserveElement };
})();

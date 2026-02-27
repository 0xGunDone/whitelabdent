/**
 * 3D Tilt Effects Module
 * Modern UI Redesign - White Lab
 * 
 * Implements:
 * - 3D tilt effect on hover for interactive elements with data-tilt
 * - Smooth interpolation for natural movement
 * - Mouse position tracking with shine effect
 * - Performance-optimized using requestAnimationFrame
 * 
 * Validates Requirements: 2.7, 5.1
 * 
 * Usage:
 * 1. Include this script in your HTML: <script src="/scripts/effects/tilt.js"></script>
 * 2. Add data-tilt attribute to elements you want to tilt
 *    Example: <div class="hero-frame" data-tilt></div>
 * 3. Optional: Customize tilt intensity with data-tilt-max
 *    Example: <div class="hero-frame" data-tilt data-tilt-max="15"></div>
 * 
 * Features:
 * - Works only for explicitly marked data-tilt elements
 * - Respects prefers-reduced-motion setting
 * - Only activates on devices with hover capability
 * - Smooth interpolation for natural movement
 * - Updates CSS custom properties for tilt angles
 * - Tracks mouse position for shine effect
 * 
 * CSS Integration:
 * The module sets CSS custom properties on tilt elements:
 * - --tilt-x: Rotation around X axis (deg)
 * - --tilt-y: Rotation around Y axis (deg)
 * - --mouse-x: Mouse X position (%)
 * - --mouse-y: Mouse Y position (%)
 */

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (reduceMotion || !canHover) {
    return;
  }

  // Configuration
  const CONFIG = {
    maxTilt: 12, // Maximum tilt angle in degrees
    smoothing: 0.15, // Interpolation smoothing factor (0-1)
    perspective: 1000, // Perspective value in pixels
    resetDuration: 400, // Duration to reset tilt when mouse leaves (ms)
  };

  // State management for all tilt elements
  const tiltElements = new Map();

  /**
   * Calculate tilt angles based on mouse position
   * @param {HTMLElement} element - The element to calculate tilt for
   * @param {number} mouseX - Mouse X position relative to element
   * @param {number} mouseY - Mouse Y position relative to element
   * @returns {Object} Tilt angles and mouse position percentages
   */
  const calculateTilt = (element, mouseX, mouseY) => {
    const rect = element.getBoundingClientRect();
    const maxTilt = Number(element.dataset.tiltMax) || CONFIG.maxTilt;

    // Calculate mouse position relative to element center (-1 to 1)
    const relativeX = (mouseX - rect.left) / rect.width - 0.5;
    const relativeY = (mouseY - rect.top) / rect.height - 0.5;

    // Calculate tilt angles (inverted for natural feel)
    const tiltY = relativeX * maxTilt * 2; // Horizontal mouse movement = Y axis rotation
    const tiltX = -relativeY * maxTilt * 2; // Vertical mouse movement = X axis rotation

    // Calculate mouse position as percentage for shine effect
    const mouseXPercent = ((mouseX - rect.left) / rect.width) * 100;
    const mouseYPercent = ((mouseY - rect.top) / rect.height) * 100;

    return {
      tiltX,
      tiltY,
      mouseXPercent,
      mouseYPercent,
    };
  };

  /**
   * Smooth interpolation between current and target values
   * @param {number} current - Current value
   * @param {number} target - Target value
   * @param {number} smoothing - Smoothing factor (0-1)
   * @returns {number} Interpolated value
   */
  const lerp = (current, target, smoothing) => {
    return current + (target - current) * smoothing;
  };

  /**
   * Update tilt element with smooth interpolation
   * @param {HTMLElement} element - The element to update
   * @param {Object} state - Current state of the element
   */
  const updateTilt = (element, state) => {
    // Smooth interpolation
    state.currentTiltX = lerp(state.currentTiltX, state.targetTiltX, CONFIG.smoothing);
    state.currentTiltY = lerp(state.currentTiltY, state.targetTiltY, CONFIG.smoothing);
    state.currentMouseX = lerp(state.currentMouseX, state.targetMouseX, CONFIG.smoothing);
    state.currentMouseY = lerp(state.currentMouseY, state.targetMouseY, CONFIG.smoothing);

    // Update CSS custom properties
    element.style.setProperty("--tilt-x", `${state.currentTiltX.toFixed(2)}deg`);
    element.style.setProperty("--tilt-y", `${state.currentTiltY.toFixed(2)}deg`);
    element.style.setProperty("--mouse-x", `${state.currentMouseX.toFixed(2)}%`);
    element.style.setProperty("--mouse-y", `${state.currentMouseY.toFixed(2)}%`);

    // Continue animation if not at target
    const threshold = 0.01;
    const isAnimating =
      Math.abs(state.currentTiltX - state.targetTiltX) > threshold ||
      Math.abs(state.currentTiltY - state.targetTiltY) > threshold ||
      Math.abs(state.currentMouseX - state.targetMouseX) > threshold ||
      Math.abs(state.currentMouseY - state.targetMouseY) > threshold;

    if (isAnimating && state.rafId === null) {
      state.rafId = requestAnimationFrame(() => {
        state.rafId = null;
        updateTilt(element, state);
      });
    }
  };

  /**
   * Handle mouse move over tilt element
   * @param {MouseEvent} event - Mouse event
   * @param {HTMLElement} element - The tilt element
   */
  const handleMouseMove = (event, element) => {
    const state = tiltElements.get(element);
    if (!state || !state.isHovering) return;

    const { tiltX, tiltY, mouseXPercent, mouseYPercent } = calculateTilt(
      element,
      event.clientX,
      event.clientY
    );

    // Update target values
    state.targetTiltX = tiltX;
    state.targetTiltY = tiltY;
    state.targetMouseX = mouseXPercent;
    state.targetMouseY = mouseYPercent;

    // Start animation if not already running
    if (state.rafId === null) {
      state.rafId = requestAnimationFrame(() => {
        state.rafId = null;
        updateTilt(element, state);
      });
    }
  };

  /**
   * Handle mouse enter on tilt element
   * @param {HTMLElement} element - The tilt element
   */
  const handleMouseEnter = (element) => {
    const state = tiltElements.get(element);
    if (!state) return;

    state.isHovering = true;

    // Cancel any ongoing reset animation
    if (state.resetTimeoutId) {
      clearTimeout(state.resetTimeoutId);
      state.resetTimeoutId = null;
    }
  };

  /**
   * Handle mouse leave on tilt element
   * @param {HTMLElement} element - The tilt element
   */
  const handleMouseLeave = (element) => {
    const state = tiltElements.get(element);
    if (!state) return;

    state.isHovering = false;

    // Reset tilt to neutral position
    state.targetTiltX = 0;
    state.targetTiltY = 0;
    state.targetMouseX = 50;
    state.targetMouseY = 50;

    // Start reset animation
    if (state.rafId === null) {
      state.rafId = requestAnimationFrame(() => {
        state.rafId = null;
        updateTilt(element, state);
      });
    }
  };

  /**
   * Initialize tilt effect for an element
   * @param {HTMLElement} element - The element to add tilt effect to
   */
  const initTiltElement = (element) => {
    // Skip if already initialized
    if (tiltElements.has(element)) return;

    // Initialize state
    const state = {
      isHovering: false,
      currentTiltX: 0,
      currentTiltY: 0,
      targetTiltX: 0,
      targetTiltY: 0,
      currentMouseX: 50,
      currentMouseY: 50,
      targetMouseX: 50,
      targetMouseY: 50,
      rafId: null,
      resetTimeoutId: null,
    };

    tiltElements.set(element, state);

    // Set initial CSS custom properties
    element.style.setProperty("--tilt-x", "0deg");
    element.style.setProperty("--tilt-y", "0deg");
    element.style.setProperty("--mouse-x", "50%");
    element.style.setProperty("--mouse-y", "50%");

    // Create bound event handlers
    const mouseMoveHandler = (event) => handleMouseMove(event, element);
    const mouseEnterHandler = () => handleMouseEnter(element);
    const mouseLeaveHandler = () => handleMouseLeave(element);

    // Store handlers for cleanup
    state.handlers = {
      mouseMove: mouseMoveHandler,
      mouseEnter: mouseEnterHandler,
      mouseLeave: mouseLeaveHandler,
    };

    // Add event listeners
    element.addEventListener("mousemove", mouseMoveHandler, { passive: true });
    element.addEventListener("mouseenter", mouseEnterHandler);
    element.addEventListener("mouseleave", mouseLeaveHandler);
  };

  /**
   * Remove tilt effect from an element
   * @param {HTMLElement} element - The element to remove tilt effect from
   */
  const destroyTiltElement = (element) => {
    const state = tiltElements.get(element);
    if (!state) return;

    // Cancel any ongoing animations
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }

    if (state.resetTimeoutId) {
      clearTimeout(state.resetTimeoutId);
    }

    // Remove event listeners
    if (state.handlers) {
      element.removeEventListener("mousemove", state.handlers.mouseMove);
      element.removeEventListener("mouseenter", state.handlers.mouseEnter);
      element.removeEventListener("mouseleave", state.handlers.mouseLeave);
    }

    // Reset CSS custom properties
    element.style.removeProperty("--tilt-x");
    element.style.removeProperty("--tilt-y");
    element.style.removeProperty("--mouse-x");
    element.style.removeProperty("--mouse-y");

    // Remove from map
    tiltElements.delete(element);
  };

  /**
   * Initialize all tilt elements on the page
   */
  const initAllTiltElements = () => {
    // Find all elements with data-tilt attribute
    const elements = document.querySelectorAll("[data-tilt]");

    elements.forEach((element) => {
      initTiltElement(element);
    });
  };

  /**
   * Cleanup all tilt effects
   */
  const destroy = () => {
    tiltElements.forEach((state, element) => {
      destroyTiltElement(element);
    });
  };

  /**
   * Initialize the tilt effects module
   */
  const init = () => {
    // Initialize existing elements
    initAllTiltElements();

    // Watch for dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the node itself has tilt
            if (node.matches && node.matches("[data-tilt]")) {
              initTiltElement(node);
            }
            // Check for tilt elements within the node
            if (node.querySelectorAll) {
              const tiltElements = node.querySelectorAll("[data-tilt]");
              tiltElements.forEach((element) => {
                initTiltElement(element);
              });
            }
          }
        });

        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the node itself has tilt
            if (node.matches && node.matches("[data-tilt]")) {
              destroyTiltElement(node);
            }
            // Check for tilt elements within the node
            if (node.querySelectorAll) {
              const tiltElements = node.querySelectorAll("[data-tilt]");
              tiltElements.forEach((element) => {
                destroyTiltElement(element);
              });
            }
          }
        });
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Store observer for cleanup
    window.TiltEffects = { init, destroy, observer };
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Export for potential external use
  window.TiltEffects = { init, destroy, initTiltElement, destroyTiltElement };
})();

/**
 * Animated Metrics Counter
 * Modern UI Redesign - White Lab
 * 
 * Animates metric values with count-up effect when they enter viewport
 * Validates Requirements: 3.6
 */

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * Animates a number from 0 to target value
   * @param {HTMLElement} element - Element to animate
   * @param {number} target - Target value
   * @param {number} duration - Animation duration in ms
   */
  const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const startTime = performance.now();
    const suffix = element.textContent.replace(/[\d.,]/g, '');

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * easeOut);
      
      element.textContent = current.toLocaleString('ru-RU') + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target.toLocaleString('ru-RU') + suffix;
      }
    };

    requestAnimationFrame(update);
  };

  // Initialize metrics animation
  const metricsContainer = document.querySelector("[data-animate-metrics]");
  
  if (!metricsContainer) {
    return;
  }

  const metrics = Array.from(metricsContainer.querySelectorAll("[data-metric]"));

  if (reduceMotion || !("IntersectionObserver" in window)) {
    // Skip animation if reduced motion is preferred or IntersectionObserver not supported
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }

        // Animate each metric with a slight delay
        metrics.forEach((metric, index) => {
          const valueElement = metric.querySelector("[data-metric-value]");
          if (!valueElement) {
            return;
          }

          const targetValue = parseInt(valueElement.dataset.metricValue, 10);
          if (isNaN(targetValue)) {
            return;
          }

          setTimeout(() => {
            animateCounter(valueElement, targetValue, 2000);
          }, index * 100);
        });

        observer.unobserve(entry.target);
      }
    },
    {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.3
    }
  );

  observer.observe(metricsContainer);
})();

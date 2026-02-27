/**
 * Media Gallery Component
 * Modern UI Redesign - White Lab
 * 
 * Implements:
 * - Media filtering with smooth animations
 * - Lazy loading for images
 * - Lightbox functionality with keyboard navigation
 * - Touch-friendly interactions
 * 
 * Validates Requirements: 6.3, 6.4, 6.5
 * 
 * Usage:
 * 1. Include this script in your HTML: <script src="/scripts/components/gallery.js"></script>
 * 2. Ensure gallery markup includes:
 *    - .media-toolbar with .media-filter buttons
 *    - .media-mosaic container with .media-tile items
 *    - data-category attribute on each media tile
 * 
 * Features:
 * - Animated filtering with fade in/out transitions
 * - Intersection Observer for lazy loading
 * - Full-featured lightbox with navigation
 * - Keyboard shortcuts (Escape, Arrow keys)
 * - Touch swipe support for lightbox
 * - Respects prefers-reduced-motion setting
 */

(() => {
  'use strict';

  // ========================================
  // Configuration
  // ========================================

  const CONFIG = {
    // Filter animation timing
    filterOutDuration: 300, // ms
    filterInDuration: 400,  // ms
    filterInDelay: 50,      // ms between each item
    
    // Lazy loading
    lazyLoadRootMargin: '200px', // Load images 200px before entering viewport
    lazyLoadThreshold: 0.01,
    
    // Lightbox
    lightboxAnimationDuration: 300, // ms
    swipeThreshold: 50, // px
    
    // Selectors
    selectors: {
      toolbar: '.media-toolbar',
      filter: '.media-filter',
      mosaic: '.media-mosaic',
      tile: '.media-tile',
      tileImage: '.media-tile img',
      tileVideo: '.media-tile video',
    },
  };

  // ========================================
  // Utility Functions
  // ========================================

  /**
   * Check if reduced motion is preferred
   * @returns {boolean}
   */
  const prefersReducedMotion = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  /**
   * Check if device supports touch
   * @returns {boolean}
   */
  const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  /**
   * Debounce function
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // ========================================
  // Gallery Filter Module
  // ========================================

  class GalleryFilter {
    constructor(toolbar, mosaic) {
      this.toolbar = toolbar;
      this.mosaic = mosaic;
      this.filters = Array.from(toolbar.querySelectorAll(CONFIG.selectors.filter));
      this.tiles = Array.from(mosaic.querySelectorAll(CONFIG.selectors.tile));
      this.activeFilter = 'all';
      
      this.init();
    }

    init() {
      // Set up filter button click handlers
      this.filters.forEach(filter => {
        filter.addEventListener('click', (e) => this.handleFilterClick(e));
      });

      // Set initial active filter
      const activeFilter = this.filters.find(f => f.classList.contains('active'));
      if (activeFilter) {
        this.activeFilter = activeFilter.dataset.filter || 'all';
      }
    }

    handleFilterClick(event) {
      const filterButton = event.currentTarget;
      const category = filterButton.dataset.filter || 'all';

      // Don't re-filter if already active
      if (category === this.activeFilter) {
        return;
      }

      // Update active filter
      this.activeFilter = category;

      // Update button states
      this.filters.forEach(f => f.classList.remove('active'));
      filterButton.classList.add('active');

      // Filter tiles
      this.filterTiles(category);
    }

    filterTiles(category) {
      const reducedMotion = prefersReducedMotion();

      if (reducedMotion) {
        // Instant filtering without animation
        this.tiles.forEach(tile => {
          const tileCategory = tile.dataset.category || '';
          const shouldShow = category === 'all' || tileCategory === category;
          
          if (shouldShow) {
            tile.classList.remove('is-hidden');
            tile.style.display = '';
          } else {
            tile.classList.add('is-hidden');
            tile.style.display = 'none';
          }
        });
        return;
      }

      // Animated filtering
      const tilesToHide = [];
      const tilesToShow = [];

      this.tiles.forEach(tile => {
        const tileCategory = tile.dataset.category || '';
        const shouldShow = category === 'all' || tileCategory === category;
        const isCurrentlyVisible = !tile.classList.contains('is-hidden');

        if (shouldShow && !isCurrentlyVisible) {
          tilesToShow.push(tile);
        } else if (!shouldShow && isCurrentlyVisible) {
          tilesToHide.push(tile);
        }
      });

      // Hide tiles with fade-out animation
      tilesToHide.forEach(tile => {
        tile.classList.add('is-filtering-out');
      });

      // After fade-out completes, hide tiles and show new ones
      setTimeout(() => {
        tilesToHide.forEach(tile => {
          tile.classList.remove('is-filtering-out');
          tile.classList.add('is-hidden');
        });

        // Show tiles with staggered fade-in animation
        tilesToShow.forEach((tile, index) => {
          setTimeout(() => {
            tile.classList.remove('is-hidden');
            tile.classList.add('is-filtering-in');
            
            // Remove animation class after animation completes
            setTimeout(() => {
              tile.classList.remove('is-filtering-in');
            }, CONFIG.filterInDuration);
          }, index * CONFIG.filterInDelay);
        });
      }, CONFIG.filterOutDuration);
    }

    getActiveFilter() {
      return this.activeFilter;
    }

    destroy() {
      this.filters.forEach(filter => {
        filter.removeEventListener('click', this.handleFilterClick);
      });
    }
  }

  // ========================================
  // Lazy Loading Module
  // ========================================

  class LazyLoader {
    constructor(mosaic) {
      this.mosaic = mosaic;
      this.images = [];
      this.observer = null;
      
      this.init();
    }

    init() {
      // Check for Intersection Observer support
      if (!('IntersectionObserver' in window)) {
        console.warn('Intersection Observer not supported. Loading all images immediately.');
        this.loadAllImages();
        return;
      }

      // Create observer
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        {
          rootMargin: CONFIG.lazyLoadRootMargin,
          threshold: CONFIG.lazyLoadThreshold,
        }
      );

      // Find and observe all lazy images
      this.observeImages();

      // Watch for dynamically added images
      this.watchForNewImages();
    }

    observeImages() {
      const images = this.mosaic.querySelectorAll('img[loading="lazy"], img[data-src]');
      
      images.forEach(img => {
        if (!this.images.includes(img)) {
          this.images.push(img);
          this.observer.observe(img);
        }
      });
    }

    handleIntersection(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadImage(img);
          this.observer.unobserve(img);
        }
      });
    }

    loadImage(img) {
      // Check if image has data-src attribute (custom lazy loading)
      const dataSrc = img.dataset.src;
      
      if (dataSrc && !img.src) {
        img.src = dataSrc;
        img.removeAttribute('data-src');
      }

      // Ensure loading attribute is set
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }

      // Add loaded class after image loads
      img.addEventListener('load', () => {
        img.classList.add('is-loaded');
      }, { once: true });

      // Handle load errors
      img.addEventListener('error', () => {
        console.warn(`Failed to load image: ${img.src}`);
        img.classList.add('is-error');
        
        // Set placeholder or fallback image
        if (!img.dataset.errorHandled) {
          img.dataset.errorHandled = 'true';
          // You can set a placeholder image here if needed
          // img.src = '/media/placeholder.jpg';
        }
      }, { once: true });
    }

    loadAllImages() {
      const images = this.mosaic.querySelectorAll('img[loading="lazy"], img[data-src]');
      images.forEach(img => this.loadImage(img));
    }

    watchForNewImages() {
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if node is an image
              if (node.tagName === 'IMG' && (node.loading === 'lazy' || node.dataset.src)) {
                this.images.push(node);
                if (this.observer) {
                  this.observer.observe(node);
                }
              }
              
              // Check for images within the node
              if (node.querySelectorAll) {
                const images = node.querySelectorAll('img[loading="lazy"], img[data-src]');
                images.forEach(img => {
                  this.images.push(img);
                  if (this.observer) {
                    this.observer.observe(img);
                  }
                });
              }
            }
          });
        });
      });

      mutationObserver.observe(this.mosaic, {
        childList: true,
        subtree: true,
      });

      this.mutationObserver = mutationObserver;
    }

    destroy() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
      
      this.images = [];
    }
  }

  // ========================================
  // Lightbox Module
  // ========================================

  class Lightbox {
    constructor(mosaic) {
      this.mosaic = mosaic;
      this.tiles = Array.from(mosaic.querySelectorAll(CONFIG.selectors.tile));
      this.currentIndex = 0;
      this.isOpen = false;
      this.lightboxElement = null;
      this.touchStartX = 0;
      this.touchEndX = 0;
      
      this.init();
    }

    init() {
      // Create lightbox element
      this.createLightbox();

      // Add click handlers to tiles
      this.tiles.forEach((tile, index) => {
        tile.addEventListener('click', (e) => {
          // Don't open lightbox if clicking on a link or button
          if (e.target.closest('a, button')) {
            return;
          }
          
          this.open(index);
        });

        // Make tiles keyboard accessible
        tile.setAttribute('tabindex', '0');
        tile.setAttribute('role', 'button');
        tile.setAttribute('aria-label', `Открыть изображение ${index + 1}`);

        // Handle keyboard activation
        tile.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.open(index);
          }
        });
      });
    }

    createLightbox() {
      const lightbox = document.createElement('div');
      lightbox.className = 'lightbox';
      lightbox.setAttribute('role', 'dialog');
      lightbox.setAttribute('aria-modal', 'true');
      lightbox.setAttribute('aria-label', 'Просмотр изображения');
      
      lightbox.innerHTML = `
        <div class="lightbox-backdrop"></div>
        <div class="lightbox-content">
          <button class="lightbox-close" aria-label="Закрыть">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <button class="lightbox-prev" aria-label="Предыдущее изображение">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button class="lightbox-next" aria-label="Следующее изображение">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          <div class="lightbox-media-container">
            <img class="lightbox-media" src="" alt="">
          </div>
          <div class="lightbox-caption"></div>
          <div class="lightbox-counter"></div>
        </div>
      `;

      document.body.appendChild(lightbox);
      this.lightboxElement = lightbox;

      // Set up event listeners
      this.setupLightboxEvents();
    }

    setupLightboxEvents() {
      const closeBtn = this.lightboxElement.querySelector('.lightbox-close');
      const prevBtn = this.lightboxElement.querySelector('.lightbox-prev');
      const nextBtn = this.lightboxElement.querySelector('.lightbox-next');
      const backdrop = this.lightboxElement.querySelector('.lightbox-backdrop');

      // Close button
      closeBtn.addEventListener('click', () => this.close());

      // Navigation buttons
      prevBtn.addEventListener('click', () => this.prev());
      nextBtn.addEventListener('click', () => this.next());

      // Close on backdrop click
      backdrop.addEventListener('click', () => this.close());

      // Keyboard navigation
      this.handleKeydown = (e) => {
        if (!this.isOpen) return;

        switch (e.key) {
          case 'Escape':
            this.close();
            break;
          case 'ArrowLeft':
            this.prev();
            break;
          case 'ArrowRight':
            this.next();
            break;
        }
      };

      document.addEventListener('keydown', this.handleKeydown);

      // Touch swipe support
      if (isTouchDevice()) {
        const mediaContainer = this.lightboxElement.querySelector('.lightbox-media-container');

        mediaContainer.addEventListener('touchstart', (e) => {
          this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        mediaContainer.addEventListener('touchend', (e) => {
          this.touchEndX = e.changedTouches[0].screenX;
          this.handleSwipe();
        }, { passive: true });
      }
    }

    handleSwipe() {
      const diff = this.touchStartX - this.touchEndX;

      if (Math.abs(diff) > CONFIG.swipeThreshold) {
        if (diff > 0) {
          // Swipe left - next image
          this.next();
        } else {
          // Swipe right - previous image
          this.prev();
        }
      }
    }

    open(index) {
      this.currentIndex = index;
      this.isOpen = true;

      // Get visible tiles only (respect current filter)
      const visibleTiles = this.tiles.filter(tile => !tile.classList.contains('is-hidden'));
      
      if (visibleTiles.length === 0) return;

      // Update current index to match visible tiles
      this.currentIndex = Math.min(index, visibleTiles.length - 1);

      // Load media
      this.loadMedia(visibleTiles[this.currentIndex]);

      // Show lightbox
      this.lightboxElement.classList.add('is-active');
      document.body.style.overflow = 'hidden';

      // Focus close button for accessibility
      setTimeout(() => {
        this.lightboxElement.querySelector('.lightbox-close').focus();
      }, CONFIG.lightboxAnimationDuration);

      // Update navigation buttons
      this.updateNavigation(visibleTiles);
    }

    close() {
      this.isOpen = false;
      this.lightboxElement.classList.remove('is-active');
      document.body.style.overflow = '';

      // Return focus to the tile that opened the lightbox
      const visibleTiles = this.tiles.filter(tile => !tile.classList.contains('is-hidden'));
      if (visibleTiles[this.currentIndex]) {
        visibleTiles[this.currentIndex].focus();
      }
    }

    prev() {
      const visibleTiles = this.tiles.filter(tile => !tile.classList.contains('is-hidden'));
      
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.loadMedia(visibleTiles[this.currentIndex]);
        this.updateNavigation(visibleTiles);
      }
    }

    next() {
      const visibleTiles = this.tiles.filter(tile => !tile.classList.contains('is-hidden'));
      
      if (this.currentIndex < visibleTiles.length - 1) {
        this.currentIndex++;
        this.loadMedia(visibleTiles[this.currentIndex]);
        this.updateNavigation(visibleTiles);
      }
    }

    loadMedia(tile) {
      const mediaContainer = this.lightboxElement.querySelector('.lightbox-media-container');
      const caption = this.lightboxElement.querySelector('.lightbox-caption');
      const counter = this.lightboxElement.querySelector('.lightbox-counter');
      
      // Get media element from tile
      const img = tile.querySelector('img');
      const video = tile.querySelector('video');
      
      // Clear previous media
      mediaContainer.innerHTML = '';

      if (video) {
        // Clone video element
        const videoClone = video.cloneNode(true);
        videoClone.className = 'lightbox-media';
        videoClone.controls = true;
        videoClone.autoplay = true;
        mediaContainer.appendChild(videoClone);
      } else if (img) {
        // Create new image element
        const lightboxImg = document.createElement('img');
        lightboxImg.className = 'lightbox-media';
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || '';
        mediaContainer.appendChild(lightboxImg);
      }

      // Update caption
      const figcaption = tile.querySelector('figcaption');
      if (figcaption) {
        caption.innerHTML = figcaption.innerHTML;
        caption.style.display = 'block';
      } else {
        caption.style.display = 'none';
      }

      // Update counter
      const visibleTiles = this.tiles.filter(tile => !tile.classList.contains('is-hidden'));
      counter.textContent = `${this.currentIndex + 1} / ${visibleTiles.length}`;
    }

    updateNavigation(visibleTiles) {
      const prevBtn = this.lightboxElement.querySelector('.lightbox-prev');
      const nextBtn = this.lightboxElement.querySelector('.lightbox-next');

      // Disable/enable navigation buttons
      prevBtn.disabled = this.currentIndex === 0;
      nextBtn.disabled = this.currentIndex === visibleTiles.length - 1;

      // Update ARIA labels
      prevBtn.setAttribute('aria-disabled', this.currentIndex === 0);
      nextBtn.setAttribute('aria-disabled', this.currentIndex === visibleTiles.length - 1);
    }

    destroy() {
      if (this.lightboxElement) {
        this.lightboxElement.remove();
        this.lightboxElement = null;
      }

      document.removeEventListener('keydown', this.handleKeydown);
      document.body.style.overflow = '';
    }
  }

  // ========================================
  // Main Gallery Controller
  // ========================================

  class Gallery {
    constructor(container) {
      this.container = container;
      this.toolbar = container.querySelector(CONFIG.selectors.toolbar);
      this.mosaic = container.querySelector(CONFIG.selectors.mosaic);
      
      if (!this.mosaic) {
        console.warn('Gallery mosaic not found');
        return;
      }

      this.filter = null;
      this.lazyLoader = null;
      this.lightbox = null;

      this.init();
    }

    init() {
      // Initialize filter if toolbar exists
      if (this.toolbar) {
        this.filter = new GalleryFilter(this.toolbar, this.mosaic);
      }

      // Initialize lazy loading
      this.lazyLoader = new LazyLoader(this.mosaic);

      // Initialize lightbox
      this.lightbox = new Lightbox(this.mosaic);
    }

    destroy() {
      if (this.filter) {
        this.filter.destroy();
      }
      
      if (this.lazyLoader) {
        this.lazyLoader.destroy();
      }
      
      if (this.lightbox) {
        this.lightbox.destroy();
      }
    }
  }

  // ========================================
  // Auto-initialization
  // ========================================

  const initGalleries = () => {
    const galleries = document.querySelectorAll('.media-cinema');
    const instances = [];

    galleries.forEach(container => {
      const gallery = new Gallery(container);
      instances.push(gallery);
    });

    // Store instances for potential cleanup
    window.MediaGallery = {
      instances,
      Gallery,
      destroy: () => {
        instances.forEach(instance => instance.destroy());
      },
    };
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGalleries);
  } else {
    initGalleries();
  }

})();

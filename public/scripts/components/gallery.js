(()=>{
    'use strict';
    const CONFIG = {
        filterOutDuration: 300,
        filterInDuration: 400,
        filterInDelay: 50,
        lazyLoadRootMargin: '200px',
        lazyLoadThreshold: 0.01,
        lightboxAnimationDuration: 300,
        swipeThreshold: 50,
        selectors: {
            toolbar: '.media-toolbar',
            filter: '.media-filter',
            mosaic: '.media-mosaic',
            tile: '.media-tile',
            tileImage: '.media-tile img',
            tileVideo: '.media-tile video'
        }
    };
    const prefersReducedMotion = ()=>{
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };
    const isTouchDevice = ()=>{
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    };
    const debounce = (func, delay)=>{
        let timeoutId;
        return (...args)=>{
            clearTimeout(timeoutId);
            timeoutId = setTimeout(()=>func(...args), delay);
        };
    };
    class GalleryFilter {
        constructor(toolbar, mosaic){
            this.toolbar = toolbar;
            this.mosaic = mosaic;
            this.filters = Array.from(toolbar.querySelectorAll(CONFIG.selectors.filter));
            this.tiles = Array.from(mosaic.querySelectorAll(CONFIG.selectors.tile));
            this.activeFilter = 'all';
            this.init();
        }
        init() {
            this.filters.forEach((filter)=>{
                filter.addEventListener('click', (e)=>this.handleFilterClick(e));
            });
            const activeFilter = this.filters.find((f)=>f.classList.contains('active'));
            if (activeFilter) {
                this.activeFilter = activeFilter.dataset.filter || 'all';
            }
        }
        handleFilterClick(event) {
            const filterButton = event.currentTarget;
            const category = filterButton.dataset.filter || 'all';
            if (category === this.activeFilter) {
                return;
            }
            this.activeFilter = category;
            this.filters.forEach((f)=>f.classList.remove('active'));
            filterButton.classList.add('active');
            this.filterTiles(category);
        }
        filterTiles(category) {
            const reducedMotion = prefersReducedMotion();
            if (reducedMotion) {
                this.tiles.forEach((tile)=>{
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
            const tilesToHide = [];
            const tilesToShow = [];
            this.tiles.forEach((tile)=>{
                const tileCategory = tile.dataset.category || '';
                const shouldShow = category === 'all' || tileCategory === category;
                const isCurrentlyVisible = !tile.classList.contains('is-hidden');
                if (shouldShow && !isCurrentlyVisible) {
                    tilesToShow.push(tile);
                } else if (!shouldShow && isCurrentlyVisible) {
                    tilesToHide.push(tile);
                }
            });
            tilesToHide.forEach((tile)=>{
                tile.classList.add('is-filtering-out');
            });
            setTimeout(()=>{
                tilesToHide.forEach((tile)=>{
                    tile.classList.remove('is-filtering-out');
                    tile.classList.add('is-hidden');
                });
                tilesToShow.forEach((tile, index)=>{
                    setTimeout(()=>{
                        tile.classList.remove('is-hidden');
                        tile.classList.add('is-filtering-in');
                        setTimeout(()=>{
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
            this.filters.forEach((filter)=>{
                filter.removeEventListener('click', this.handleFilterClick);
            });
        }
    }
    class LazyLoader {
        constructor(mosaic){
            this.mosaic = mosaic;
            this.images = [];
            this.observer = null;
            this.init();
        }
        init() {
            if (!('IntersectionObserver' in window)) {
                console.warn('Intersection Observer not supported. Loading all images immediately.');
                this.loadAllImages();
                return;
            }
            this.observer = new IntersectionObserver((entries)=>this.handleIntersection(entries), {
                rootMargin: CONFIG.lazyLoadRootMargin,
                threshold: CONFIG.lazyLoadThreshold
            });
            this.observeImages();
            this.watchForNewImages();
        }
        observeImages() {
            const images = this.mosaic.querySelectorAll('img[loading="lazy"], img[data-src]');
            images.forEach((img)=>{
                if (!this.images.includes(img)) {
                    this.images.push(img);
                    this.observer.observe(img);
                }
            });
        }
        handleIntersection(entries) {
            entries.forEach((entry)=>{
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    this.observer.unobserve(img);
                }
            });
        }
        loadImage(img) {
            const dataSrc = img.dataset.src;
            if (dataSrc && !img.src) {
                img.src = dataSrc;
                img.removeAttribute('data-src');
            }
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            img.addEventListener('load', ()=>{
                img.classList.add('is-loaded');
            }, {
                once: true
            });
            img.addEventListener('error', ()=>{
                console.warn(`Failed to load image: ${img.src}`);
                img.classList.add('is-error');
                if (!img.dataset.errorHandled) {
                    img.dataset.errorHandled = 'true';
                }
            }, {
                once: true
            });
        }
        loadAllImages() {
            const images = this.mosaic.querySelectorAll('img[loading="lazy"], img[data-src]');
            images.forEach((img)=>this.loadImage(img));
        }
        watchForNewImages() {
            const mutationObserver = new MutationObserver((mutations)=>{
                mutations.forEach((mutation)=>{
                    mutation.addedNodes.forEach((node)=>{
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.tagName === 'IMG' && (node.loading === 'lazy' || node.dataset.src)) {
                                this.images.push(node);
                                if (this.observer) {
                                    this.observer.observe(node);
                                }
                            }
                            if (node.querySelectorAll) {
                                const images = node.querySelectorAll('img[loading="lazy"], img[data-src]');
                                images.forEach((img)=>{
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
                subtree: true
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
    class Lightbox {
        constructor(mosaic){
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
            this.createLightbox();
            this.tiles.forEach((tile, index)=>{
                tile.addEventListener('click', (e)=>{
                    if (e.target.closest('a, button')) {
                        return;
                    }
                    this.open(index);
                });
                tile.setAttribute('tabindex', '0');
                tile.setAttribute('role', 'button');
                tile.setAttribute('aria-label', `Открыть изображение ${index + 1}`);
                tile.addEventListener('keydown', (e)=>{
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
            this.setupLightboxEvents();
        }
        setupLightboxEvents() {
            const closeBtn = this.lightboxElement.querySelector('.lightbox-close');
            const prevBtn = this.lightboxElement.querySelector('.lightbox-prev');
            const nextBtn = this.lightboxElement.querySelector('.lightbox-next');
            const backdrop = this.lightboxElement.querySelector('.lightbox-backdrop');
            closeBtn.addEventListener('click', ()=>this.close());
            prevBtn.addEventListener('click', ()=>this.prev());
            nextBtn.addEventListener('click', ()=>this.next());
            backdrop.addEventListener('click', ()=>this.close());
            this.handleKeydown = (e)=>{
                if (!this.isOpen) return;
                switch(e.key){
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
            if (isTouchDevice()) {
                const mediaContainer = this.lightboxElement.querySelector('.lightbox-media-container');
                mediaContainer.addEventListener('touchstart', (e)=>{
                    this.touchStartX = e.changedTouches[0].screenX;
                }, {
                    passive: true
                });
                mediaContainer.addEventListener('touchend', (e)=>{
                    this.touchEndX = e.changedTouches[0].screenX;
                    this.handleSwipe();
                }, {
                    passive: true
                });
            }
        }
        handleSwipe() {
            const diff = this.touchStartX - this.touchEndX;
            if (Math.abs(diff) > CONFIG.swipeThreshold) {
                if (diff > 0) {
                    this.next();
                } else {
                    this.prev();
                }
            }
        }
        open(index) {
            this.currentIndex = index;
            this.isOpen = true;
            const visibleTiles = this.tiles.filter((tile)=>!tile.classList.contains('is-hidden'));
            if (visibleTiles.length === 0) return;
            this.currentIndex = Math.min(index, visibleTiles.length - 1);
            this.loadMedia(visibleTiles[this.currentIndex]);
            this.lightboxElement.classList.add('is-active');
            document.body.style.overflow = 'hidden';
            setTimeout(()=>{
                this.lightboxElement.querySelector('.lightbox-close').focus();
            }, CONFIG.lightboxAnimationDuration);
            this.updateNavigation(visibleTiles);
        }
        close() {
            this.isOpen = false;
            this.lightboxElement.classList.remove('is-active');
            document.body.style.overflow = '';
            const visibleTiles = this.tiles.filter((tile)=>!tile.classList.contains('is-hidden'));
            if (visibleTiles[this.currentIndex]) {
                visibleTiles[this.currentIndex].focus();
            }
        }
        prev() {
            const visibleTiles = this.tiles.filter((tile)=>!tile.classList.contains('is-hidden'));
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.loadMedia(visibleTiles[this.currentIndex]);
                this.updateNavigation(visibleTiles);
            }
        }
        next() {
            const visibleTiles = this.tiles.filter((tile)=>!tile.classList.contains('is-hidden'));
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
            const img = tile.querySelector('img');
            const video = tile.querySelector('video');
            mediaContainer.innerHTML = '';
            if (video) {
                const videoClone = video.cloneNode(true);
                videoClone.className = 'lightbox-media';
                videoClone.controls = true;
                videoClone.autoplay = true;
                mediaContainer.appendChild(videoClone);
            } else if (img) {
                const lightboxImg = document.createElement('img');
                lightboxImg.className = 'lightbox-media';
                lightboxImg.src = img.src;
                lightboxImg.alt = img.alt || '';
                mediaContainer.appendChild(lightboxImg);
            }
            const figcaption = tile.querySelector('figcaption');
            if (figcaption) {
                caption.innerHTML = figcaption.innerHTML;
                caption.style.display = 'block';
            } else {
                caption.style.display = 'none';
            }
            const visibleTiles = this.tiles.filter((tile)=>!tile.classList.contains('is-hidden'));
            counter.textContent = `${this.currentIndex + 1} / ${visibleTiles.length}`;
        }
        updateNavigation(visibleTiles) {
            const prevBtn = this.lightboxElement.querySelector('.lightbox-prev');
            const nextBtn = this.lightboxElement.querySelector('.lightbox-next');
            prevBtn.disabled = this.currentIndex === 0;
            nextBtn.disabled = this.currentIndex === visibleTiles.length - 1;
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
    class Gallery {
        constructor(container){
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
            if (this.toolbar) {
                this.filter = new GalleryFilter(this.toolbar, this.mosaic);
            }
            this.lazyLoader = new LazyLoader(this.mosaic);
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
    const initGalleries = ()=>{
        const galleries = document.querySelectorAll('.media-cinema');
        const instances = [];
        galleries.forEach((container)=>{
            const gallery = new Gallery(container);
            instances.push(gallery);
        });
        window.MediaGallery = {
            instances,
            Gallery,
            destroy: ()=>{
                instances.forEach((instance)=>instance.destroy());
            }
        };
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGalleries);
    } else {
        initGalleries();
    }
})();


//# sourceURL=src/public/scripts/components/gallery.ts
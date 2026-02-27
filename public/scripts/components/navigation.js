(()=>{
    'use strict';
    const CONFIG = {
        scrollThreshold: 50,
        scrollDebounce: 10,
        mobileBreakpoint: 760
    };
    const throttle = (func, delay)=>{
        let lastCall = 0;
        return (...args)=>{
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                func(...args);
            }
        };
    };
    const canHover = ()=>{
        return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    };
    const prefersReducedMotion = ()=>{
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };
    const initHeaderScrollTracking = ()=>{
        const header = document.querySelector('.site-header');
        if (!header) {
            return;
        }
        let isScrolled = false;
        const updateHeaderState = ()=>{
            const scrollY = window.scrollY || window.pageYOffset;
            const shouldBeScrolled = scrollY > CONFIG.scrollThreshold;
            if (shouldBeScrolled !== isScrolled) {
                isScrolled = shouldBeScrolled;
                header.classList.toggle('is-scrolled', isScrolled);
            }
        };
        const throttledUpdate = throttle(updateHeaderState, CONFIG.scrollDebounce);
        window.addEventListener('scroll', throttledUpdate, {
            passive: true
        });
        updateHeaderState();
    };
    const initMobileMenu = ()=>{
        const header = document.querySelector('.site-header');
        const navLinks = document.querySelector('.nav-links');
        if (!header || !navLinks) {
            return;
        }
        let toggleButton = header.querySelector('.mobile-menu-toggle');
        if (!toggleButton) {
            toggleButton = createMobileMenuToggle();
            const navWrap = header.querySelector('.nav-wrap');
            if (navWrap) {
                const callBtn = navWrap.querySelector('.call-btn');
                if (callBtn) {
                    navWrap.insertBefore(toggleButton, callBtn);
                } else {
                    navWrap.appendChild(toggleButton);
                }
            }
        }
        let isMenuOpen = false;
        const toggleMenu = ()=>{
            isMenuOpen = !isMenuOpen;
            toggleButton.classList.toggle('is-active', isMenuOpen);
            navLinks.classList.toggle('is-active', isMenuOpen);
            document.body.classList.toggle('mobile-menu-open', isMenuOpen);
            toggleButton.setAttribute('aria-expanded', isMenuOpen.toString());
            navLinks.setAttribute('aria-hidden', (!isMenuOpen).toString());
        };
        const closeMenu = ()=>{
            if (isMenuOpen) {
                toggleMenu();
            }
        };
        toggleButton.addEventListener('click', toggleMenu);
        const navLinksArray = Array.from(navLinks.querySelectorAll('a'));
        navLinksArray.forEach((link)=>{
            link.addEventListener('click', closeMenu);
        });
        document.addEventListener('click', (event)=>{
            if (isMenuOpen && !navLinks.contains(event.target) && !toggleButton.contains(event.target)) {
                closeMenu();
            }
        });
        document.addEventListener('keydown', (event)=>{
            if (event.key === 'Escape' && isMenuOpen) {
                closeMenu();
                toggleButton.focus();
            }
        });
        let resizeTimer;
        window.addEventListener('resize', ()=>{
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(()=>{
                if (window.innerWidth > CONFIG.mobileBreakpoint && isMenuOpen) {
                    closeMenu();
                }
            }, 150);
        });
    };
    const createMobileMenuToggle = ()=>{
        const button = document.createElement('button');
        button.className = 'mobile-menu-toggle';
        button.setAttribute('type', 'button');
        button.setAttribute('aria-label', 'Открыть меню');
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', 'navigation');
        for(let i = 0; i < 3; i++){
            const span = document.createElement('span');
            span.setAttribute('aria-hidden', 'true');
            button.appendChild(span);
        }
        return button;
    };
    const initNavigationHoverEffects = ()=>{
        if (!canHover() || prefersReducedMotion()) {
            return;
        }
        const navLinks = document.querySelectorAll('.nav-links a');
        if (!navLinks.length) {
            return;
        }
        navLinks.forEach((link)=>{
            link.addEventListener('mouseenter', function() {
                this.style.transition = 'color var(--transition-fast)';
            });
            link.addEventListener('click', function(event) {
                if (prefersReducedMotion()) {
                    return;
                }
                const rect = this.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                this.style.setProperty('--click-x', `${x}px`);
                this.style.setProperty('--click-y', `${y}px`);
            });
        });
    };
    const initActiveNavigation = ()=>{
        const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
        if (!navLinks.length) {
            return;
        }
        const getLinkHash = (link)=>{
            const href = link.getAttribute('href') || '';
            if (!href.includes('#')) {
                return '';
            }
            return `#${href.split('#').pop()}`;
        };
        const setActiveHash = (activeHash)=>{
            navLinks.forEach((link)=>{
                link.classList.toggle('is-active', getLinkHash(link) === activeHash);
            });
        };
        const currentPath = window.location.pathname;
        const isHomePage = currentPath === '/' || currentPath === '';
        if (!isHomePage) {
            const currentHash = window.location.hash;
            navLinks.forEach((link)=>{
                const isActive = link.pathname === currentPath && link.hash === currentHash;
                link.classList.toggle('is-active', isActive);
            });
            return;
        }
        const sectionLinks = navLinks.map((link)=>{
            const hash = getLinkHash(link);
            const target = hash ? document.getElementById(hash.slice(1)) : null;
            if (!hash || !target) {
                return null;
            }
            return {
                link,
                hash,
                target
            };
        }).filter(Boolean);
        if (!sectionLinks.length) {
            return;
        }
        const getActiveHashFromScroll = ()=>{
            const header = document.querySelector('.site-header');
            const headerHeight = header ? header.offsetHeight : 0;
            const probeY = window.scrollY + headerHeight + Math.max(window.innerHeight * 0.2, 88);
            let activeHash = sectionLinks[0].hash;
            sectionLinks.forEach((item)=>{
                if (item.target.offsetTop <= probeY) {
                    activeHash = item.hash;
                }
            });
            return activeHash;
        };
        const syncActiveNavigationFromScroll = ()=>{
            setActiveHash(getActiveHashFromScroll());
        };
        const syncActiveNavigationFromHash = ()=>{
            const hash = window.location.hash;
            if (hash && sectionLinks.some((item)=>item.hash === hash)) {
                setActiveHash(hash);
                return;
            }
            syncActiveNavigationFromScroll();
        };
        const throttledScrollSync = throttle(syncActiveNavigationFromScroll, CONFIG.scrollDebounce);
        window.addEventListener('scroll', throttledScrollSync, {
            passive: true
        });
        window.addEventListener('resize', throttledScrollSync);
        window.addEventListener('hashchange', syncActiveNavigationFromHash);
        syncActiveNavigationFromHash();
    };
    const initSmoothScroll = ()=>{
        if (prefersReducedMotion()) {
            return;
        }
        const navLinks = document.querySelectorAll('.nav-links a[href^="#"], .nav-links a[href^="/#"]');
        if (!navLinks.length) {
            return;
        }
        navLinks.forEach((link)=>{
            link.addEventListener('click', function(event) {
                const href = this.getAttribute('href');
                const hash = href.includes('#') ? href.split('#')[1] : '';
                if (!hash) {
                    return;
                }
                const targetElement = document.getElementById(hash);
                if (targetElement) {
                    event.preventDefault();
                    const header = document.querySelector('.site-header');
                    const headerHeight = header ? header.offsetHeight : 0;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = targetPosition - headerHeight - 20;
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    history.pushState(null, '', `#${hash}`);
                }
            });
        });
    };
    const init = ()=>{
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        initHeaderScrollTracking();
        initMobileMenu();
        initNavigationHoverEffects();
        initActiveNavigation();
        initSmoothScroll();
    };
    init();
})();


//# sourceURL=src/public/scripts/components/navigation.ts
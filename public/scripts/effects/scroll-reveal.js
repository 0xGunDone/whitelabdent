(()=>{
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CONFIG = {
        rootMargin: "0px 0px -100px 0px",
        threshold: 0.15,
        defaultDelay: 0,
        defaultStagger: 80,
        defaultDirection: "up",
        once: true,
        autoTargetSelectors: [
            ".media-tile",
            ".faq-item",
            ".advantage-item",
            ".metric-card",
            ".floating-card",
            ".testimonial-card",
            ".team-member",
            ".contact-card"
        ]
    };
    if (reduceMotion) {
        document.addEventListener("DOMContentLoaded", ()=>{
            const elements = document.querySelectorAll("[data-reveal]");
            elements.forEach((el)=>{
                el.classList.add("reveal-visible");
                el.classList.remove("reveal-hidden");
            });
        });
        return;
    }
    const observedElements = new WeakMap();
    let observer = null;
    const getDirection = (element)=>{
        return element.dataset.revealDirection || CONFIG.defaultDirection;
    };
    const getDelay = (element)=>{
        const delay = element.dataset.revealDelay;
        return delay ? parseInt(delay, 10) : CONFIG.defaultDelay;
    };
    const getStagger = (element)=>{
        const stagger = element.dataset.revealStagger;
        return stagger ? parseInt(stagger, 10) : CONFIG.defaultStagger;
    };
    const calculateStaggerDelay = (element, siblings)=>{
        const baseDelay = getDelay(element);
        const staggerDelay = getStagger(element);
        const index = Array.from(siblings).indexOf(element);
        return baseDelay + index * staggerDelay;
    };
    const initRevealElement = (element)=>{
        if (observedElements.has(element)) return;
        element.classList.add("reveal-hidden");
        const direction = getDirection(element);
        element.classList.add(`reveal-from-${direction}`);
        observedElements.set(element, {
            revealed: false,
            direction
        });
    };
    const revealElement = (element, delay = 0)=>{
        const state = observedElements.get(element);
        if (!state || state.revealed) return;
        state.revealed = true;
        setTimeout(()=>{
            element.classList.remove("reveal-hidden");
            element.classList.add("reveal-visible");
        }, delay);
    };
    const handleIntersection = (entries)=>{
        entries.forEach((entry)=>{
            if (entry.isIntersecting) {
                const element = entry.target;
                const parent = element.parentElement;
                const siblings = parent ? parent.querySelectorAll("[data-reveal]") : [
                    element
                ];
                const delay = siblings.length > 1 ? calculateStaggerDelay(element, siblings) : getDelay(element);
                revealElement(element, delay);
                if (CONFIG.once) {
                    observer.unobserve(element);
                }
            }
        });
    };
    const createObserver = ()=>{
        return new IntersectionObserver(handleIntersection, {
            rootMargin: CONFIG.rootMargin,
            threshold: CONFIG.threshold
        });
    };
    const observeElement = (element)=>{
        if (!observer) return;
        initRevealElement(element);
        observer.observe(element);
    };
    const unobserveElement = (element)=>{
        if (!observer) return;
        observer.unobserve(element);
        observedElements.delete(element);
        element.classList.remove("reveal-hidden", "reveal-visible");
        element.classList.remove("reveal-from-up", "reveal-from-down", "reveal-from-left", "reveal-from-right");
    };
    const observeAllElements = ()=>{
        const explicitElements = document.querySelectorAll("[data-reveal]");
        const autoElements = document.querySelectorAll(CONFIG.autoTargetSelectors.join(", "));
        const allElements = new Set([
            ...explicitElements,
            ...autoElements
        ]);
        allElements.forEach((element)=>{
            observeElement(element);
        });
    };
    const init = ()=>{
        if (!("IntersectionObserver" in window)) {
            console.warn("Intersection Observer not supported. Scroll reveal disabled.");
            const elements = document.querySelectorAll("[data-reveal]");
            elements.forEach((el)=>{
                el.classList.add("reveal-visible");
            });
            return;
        }
        observer = createObserver();
        observeAllElements();
        const mutationObserver = new MutationObserver((mutations)=>{
            mutations.forEach((mutation)=>{
                mutation.addedNodes.forEach((node)=>{
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches && (node.matches("[data-reveal]") || CONFIG.autoTargetSelectors.some((selector)=>node.matches(selector)))) {
                            observeElement(node);
                        }
                        if (node.querySelectorAll) {
                            const revealElements = node.querySelectorAll("[data-reveal]");
                            revealElements.forEach((element)=>{
                                observeElement(element);
                            });
                            CONFIG.autoTargetSelectors.forEach((selector)=>{
                                const autoElements = node.querySelectorAll(selector);
                                autoElements.forEach((element)=>{
                                    if (!element.hasAttribute("data-reveal")) {
                                        observeElement(element);
                                    }
                                });
                            });
                        }
                    }
                });
                mutation.removedNodes.forEach((node)=>{
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches && (node.matches("[data-reveal]") || CONFIG.autoTargetSelectors.some((selector)=>node.matches(selector)))) {
                            unobserveElement(node);
                        }
                        if (node.querySelectorAll) {
                            const revealElements = node.querySelectorAll("[data-reveal]");
                            revealElements.forEach((element)=>{
                                unobserveElement(element);
                            });
                        }
                    }
                });
            });
        });
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        window.ScrollReveal = {
            init,
            destroy: ()=>{
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
            mutationObserver
        };
    };
    const destroy = ()=>{
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
    window.ScrollReveal = {
        init,
        destroy,
        observeElement,
        unobserveElement
    };
})();


//# sourceURL=src/public/scripts/effects/scroll-reveal.ts
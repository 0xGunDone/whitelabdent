(()=>{
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const clamp = (value, min, max)=>Math.min(Math.max(value, min), max);
    const emitAnalyticsEvent = (eventName, payload = {})=>{
        try {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: eventName,
                ...payload
            });
            window.dispatchEvent(new CustomEvent("white:analytics", {
                detail: {
                    event: eventName,
                    ...payload
                }
            }));
        } catch  {}
    };
    const trackedSelector = ".btn, .call-btn, .mobile-cta a, .service-card a, .contact-links a, .map-link, .social-link";
    document.addEventListener("click", (event)=>{
        const target = event.target.closest(trackedSelector);
        if (!target) {
            return;
        }
        const tagName = String(target.tagName || "").toLowerCase();
        const href = tagName === "a" ? target.getAttribute("href") || "" : "";
        const label = (target.textContent || "").trim().slice(0, 80);
        emitAnalyticsEvent("cta_click", {
            label,
            href,
            path: window.location.pathname,
            component: target.className || ""
        });
    });
    emitAnalyticsEvent("page_view", {
        path: window.location.pathname,
        title: document.title
    });
    const filterButtons = Array.from(document.querySelectorAll("[data-media-filter]"));
    const mediaGrid = document.querySelector("[data-media-grid]");
    if (filterButtons.length && mediaGrid) {
        const mediaItems = Array.from(mediaGrid.querySelectorAll("[data-source]"));
        const applyFilter = (source)=>{
            for (const item of mediaItems){
                const visible = source === "all" || item.dataset.source === source;
                item.classList.toggle("is-hidden", !visible);
            }
        };
        for (const button of filterButtons){
            button.addEventListener("click", ()=>{
                for (const control of filterButtons){
                    control.classList.remove("active");
                }
                button.classList.add("active");
                applyFilter(button.dataset.mediaFilter || "all");
            });
        }
    }
    const revealTargets = Array.from(document.querySelectorAll(".hero-console article, .media-toolbar, .section-head, .service-flow article, .about-list span, .material-list article, .faq-list details, .footer-block, .source-chip"));
    if (revealTargets.length) {
        for (const [index, target] of revealTargets.entries()){
            target.classList.add("reveal-on-scroll");
            target.style.transitionDelay = `${Math.min(index * 16, 220)}ms`;
        }
        if (reduceMotion || !("IntersectionObserver" in window)) {
            for (const target of revealTargets){
                target.classList.add("is-visible");
            }
        } else {
            const observer = new IntersectionObserver((entries)=>{
                for (const entry of entries){
                    if (!entry.isIntersecting) {
                        continue;
                    }
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            }, {
                rootMargin: "0px 0px -10% 0px",
                threshold: 0.12
            });
            for (const target of revealTargets){
                observer.observe(target);
            }
        }
    }
    if (!reduceMotion) {
        const parallaxItems = Array.from(document.querySelectorAll("[data-parallax-speed]"));
        if (parallaxItems.length) {
            let ticking = false;
            const updateParallax = ()=>{
                const viewportMid = window.innerHeight * 0.5;
                for (const item of parallaxItems){
                    const speed = Number(item.dataset.parallaxSpeed || 0);
                    const rect = item.getBoundingClientRect();
                    const elementMid = rect.top + rect.height * 0.5;
                    const distance = elementMid - viewportMid;
                    const offset = clamp(-distance * speed, -56, 56);
                    item.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
                }
                ticking = false;
            };
            const requestUpdate = ()=>{
                if (ticking) {
                    return;
                }
                ticking = true;
                window.requestAnimationFrame(updateParallax);
            };
            window.addEventListener("scroll", requestUpdate, {
                passive: true
            });
            window.addEventListener("resize", requestUpdate);
            requestUpdate();
        }
        const heroGlow = document.querySelector("[data-hero-glow]");
        if (heroGlow && canHover) {
            const updateGlow = (event)=>{
                const rect = heroGlow.getBoundingClientRect();
                if (!rect.width || !rect.height) {
                    return;
                }
                const x = (event.clientX - rect.left) / rect.width * 100;
                const y = (event.clientY - rect.top) / rect.height * 100;
                heroGlow.style.setProperty("--hero-glow-x", `${clamp(x, 0, 100).toFixed(2)}%`);
                heroGlow.style.setProperty("--hero-glow-y", `${clamp(y, 0, 100).toFixed(2)}%`);
            };
            heroGlow.addEventListener("pointermove", updateGlow);
            heroGlow.addEventListener("pointerleave", ()=>{
                heroGlow.style.setProperty("--hero-glow-x", "52%");
                heroGlow.style.setProperty("--hero-glow-y", "38%");
            });
        }
    }
})();


//# sourceURL=src/public/scripts/site.ts
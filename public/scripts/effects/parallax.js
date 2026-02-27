(()=>{
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const clamp = (value, min, max)=>Math.min(Math.max(value, min), max);
    if (reduceMotion) {
        return;
    }
    const CONFIG = {
        parallax: {
            maxOffset: 80,
            smoothing: 0.12
        },
        cursor: {
            glowSize: 520,
            intensity: 0.35,
            smoothing: 0.18
        }
    };
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let rafId = null;
    let cursorGlow = null;
    const createCursorGlow = ()=>{
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
    const updateCursorGlow = ()=>{
        if (!cursorGlow) return;
        currentX += (mouseX - currentX) * CONFIG.cursor.smoothing;
        currentY += (mouseY - currentY) * CONFIG.cursor.smoothing;
        cursorGlow.style.left = `${currentX}px`;
        cursorGlow.style.top = `${currentY}px`;
    };
    const updateParallaxOrbs = ()=>{
        const parallaxOrbs = document.querySelectorAll(".hero-gradient-orb, .studio-orb, .cinema-orb, .finale-orb, .hero-ambient");
        if (!parallaxOrbs.length) return;
        const viewportMid = window.innerHeight * 0.5;
        const scrollY = window.pageYOffset;
        for (const orb of parallaxOrbs){
            const rect = orb.getBoundingClientRect();
            const elementMid = rect.top + rect.height * 0.5;
            const distance = elementMid - viewportMid;
            const speed = Number(orb.dataset.parallaxSpeed || 0.08);
            const offset = clamp(-distance * speed, -CONFIG.parallax.maxOffset, CONFIG.parallax.maxOffset);
            orb.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
        }
    };
    const animate = ()=>{
        updateCursorGlow();
        updateParallaxOrbs();
        rafId = requestAnimationFrame(animate);
    };
    const handleMouseMove = (event)=>{
        mouseX = event.clientX;
        mouseY = event.clientY;
    };
    const handleMouseEnter = ()=>{
        if (cursorGlow) {
            cursorGlow.style.opacity = "1";
        }
    };
    const handleMouseLeave = ()=>{
        if (cursorGlow) {
            cursorGlow.style.opacity = "0";
        }
    };
    const handleVisibilityChange = ()=>{
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
    const init = ()=>{
        createCursorGlow();
        if (canHover && cursorGlow) {
            document.addEventListener("mousemove", handleMouseMove, {
                passive: true
            });
            document.addEventListener("mouseenter", handleMouseEnter);
            document.addEventListener("mouseleave", handleMouseLeave);
        }
        window.addEventListener("scroll", ()=>{
            if (!rafId) {
                rafId = requestAnimationFrame(animate);
            }
        }, {
            passive: true
        });
        document.addEventListener("visibilitychange", handleVisibilityChange);
        rafId = requestAnimationFrame(animate);
    };
    const destroy = ()=>{
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
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
    window.ParallaxEffects = {
        init,
        destroy
    };
})();


//# sourceURL=src/public/scripts/effects/parallax.ts
(()=>{
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduceMotion || !canHover) {
        return;
    }
    const CONFIG = {
        maxTilt: 12,
        smoothing: 0.15,
        perspective: 1000,
        resetDuration: 400
    };
    const tiltElements = new Map();
    const calculateTilt = (element, mouseX, mouseY)=>{
        const rect = element.getBoundingClientRect();
        const maxTilt = Number(element.dataset.tiltMax) || CONFIG.maxTilt;
        const relativeX = (mouseX - rect.left) / rect.width - 0.5;
        const relativeY = (mouseY - rect.top) / rect.height - 0.5;
        const tiltY = relativeX * maxTilt * 2;
        const tiltX = -relativeY * maxTilt * 2;
        const mouseXPercent = (mouseX - rect.left) / rect.width * 100;
        const mouseYPercent = (mouseY - rect.top) / rect.height * 100;
        return {
            tiltX,
            tiltY,
            mouseXPercent,
            mouseYPercent
        };
    };
    const lerp = (current, target, smoothing)=>{
        return current + (target - current) * smoothing;
    };
    const updateTilt = (element, state)=>{
        state.currentTiltX = lerp(state.currentTiltX, state.targetTiltX, CONFIG.smoothing);
        state.currentTiltY = lerp(state.currentTiltY, state.targetTiltY, CONFIG.smoothing);
        state.currentMouseX = lerp(state.currentMouseX, state.targetMouseX, CONFIG.smoothing);
        state.currentMouseY = lerp(state.currentMouseY, state.targetMouseY, CONFIG.smoothing);
        element.style.setProperty("--tilt-x", `${state.currentTiltX.toFixed(2)}deg`);
        element.style.setProperty("--tilt-y", `${state.currentTiltY.toFixed(2)}deg`);
        element.style.setProperty("--mouse-x", `${state.currentMouseX.toFixed(2)}%`);
        element.style.setProperty("--mouse-y", `${state.currentMouseY.toFixed(2)}%`);
        const threshold = 0.01;
        const isAnimating = Math.abs(state.currentTiltX - state.targetTiltX) > threshold || Math.abs(state.currentTiltY - state.targetTiltY) > threshold || Math.abs(state.currentMouseX - state.targetMouseX) > threshold || Math.abs(state.currentMouseY - state.targetMouseY) > threshold;
        if (isAnimating && state.rafId === null) {
            state.rafId = requestAnimationFrame(()=>{
                state.rafId = null;
                updateTilt(element, state);
            });
        }
    };
    const handleMouseMove = (event, element)=>{
        const state = tiltElements.get(element);
        if (!state || !state.isHovering) return;
        const { tiltX, tiltY, mouseXPercent, mouseYPercent } = calculateTilt(element, event.clientX, event.clientY);
        state.targetTiltX = tiltX;
        state.targetTiltY = tiltY;
        state.targetMouseX = mouseXPercent;
        state.targetMouseY = mouseYPercent;
        if (state.rafId === null) {
            state.rafId = requestAnimationFrame(()=>{
                state.rafId = null;
                updateTilt(element, state);
            });
        }
    };
    const handleMouseEnter = (element)=>{
        const state = tiltElements.get(element);
        if (!state) return;
        state.isHovering = true;
        if (state.resetTimeoutId) {
            clearTimeout(state.resetTimeoutId);
            state.resetTimeoutId = null;
        }
    };
    const handleMouseLeave = (element)=>{
        const state = tiltElements.get(element);
        if (!state) return;
        state.isHovering = false;
        state.targetTiltX = 0;
        state.targetTiltY = 0;
        state.targetMouseX = 50;
        state.targetMouseY = 50;
        if (state.rafId === null) {
            state.rafId = requestAnimationFrame(()=>{
                state.rafId = null;
                updateTilt(element, state);
            });
        }
    };
    const initTiltElement = (element)=>{
        if (tiltElements.has(element)) return;
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
            resetTimeoutId: null
        };
        tiltElements.set(element, state);
        element.style.setProperty("--tilt-x", "0deg");
        element.style.setProperty("--tilt-y", "0deg");
        element.style.setProperty("--mouse-x", "50%");
        element.style.setProperty("--mouse-y", "50%");
        const mouseMoveHandler = (event)=>handleMouseMove(event, element);
        const mouseEnterHandler = ()=>handleMouseEnter(element);
        const mouseLeaveHandler = ()=>handleMouseLeave(element);
        state.handlers = {
            mouseMove: mouseMoveHandler,
            mouseEnter: mouseEnterHandler,
            mouseLeave: mouseLeaveHandler
        };
        element.addEventListener("mousemove", mouseMoveHandler, {
            passive: true
        });
        element.addEventListener("mouseenter", mouseEnterHandler);
        element.addEventListener("mouseleave", mouseLeaveHandler);
    };
    const destroyTiltElement = (element)=>{
        const state = tiltElements.get(element);
        if (!state) return;
        if (state.rafId) {
            cancelAnimationFrame(state.rafId);
        }
        if (state.resetTimeoutId) {
            clearTimeout(state.resetTimeoutId);
        }
        if (state.handlers) {
            element.removeEventListener("mousemove", state.handlers.mouseMove);
            element.removeEventListener("mouseenter", state.handlers.mouseEnter);
            element.removeEventListener("mouseleave", state.handlers.mouseLeave);
        }
        element.style.removeProperty("--tilt-x");
        element.style.removeProperty("--tilt-y");
        element.style.removeProperty("--mouse-x");
        element.style.removeProperty("--mouse-y");
        tiltElements.delete(element);
    };
    const initAllTiltElements = ()=>{
        const elements = document.querySelectorAll("[data-tilt]");
        elements.forEach((element)=>{
            initTiltElement(element);
        });
    };
    const destroy = ()=>{
        tiltElements.forEach((state, element)=>{
            destroyTiltElement(element);
        });
    };
    const init = ()=>{
        initAllTiltElements();
        const observer = new MutationObserver((mutations)=>{
            mutations.forEach((mutation)=>{
                mutation.addedNodes.forEach((node)=>{
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches && node.matches("[data-tilt]")) {
                            initTiltElement(node);
                        }
                        if (node.querySelectorAll) {
                            const tiltElements = node.querySelectorAll("[data-tilt]");
                            tiltElements.forEach((element)=>{
                                initTiltElement(element);
                            });
                        }
                    }
                });
                mutation.removedNodes.forEach((node)=>{
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches && node.matches("[data-tilt]")) {
                            destroyTiltElement(node);
                        }
                        if (node.querySelectorAll) {
                            const tiltElements = node.querySelectorAll("[data-tilt]");
                            tiltElements.forEach((element)=>{
                                destroyTiltElement(element);
                            });
                        }
                    }
                });
            });
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        window.TiltEffects = {
            init,
            destroy,
            observer
        };
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
    window.TiltEffects = {
        init,
        destroy,
        initTiltElement,
        destroyTiltElement
    };
})();


//# sourceURL=src/public/scripts/effects/tilt.ts
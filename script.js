const yearNode = document.querySelector("#year");
if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
}
const revealNodes = document.querySelectorAll(".reveal");
if (revealNodes.length) {
    const revealObserver = new IntersectionObserver((entries, observer)=>{
        entries.forEach((entry)=>{
            if (!entry.isIntersecting) {
                return;
            }
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.18
    });
    revealNodes.forEach((node)=>revealObserver.observe(node));
}


//# sourceURL=src/script.ts
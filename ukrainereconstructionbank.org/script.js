/**
 * Ukraine Reconstruction Bank - Prototype Script
 */

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initCounters();
});

function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Stop observing once revealed
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    });

    reveals.forEach(el => observer.observe(el));
}

function initCounters() {
    const stats = document.querySelectorAll('.stat-item h3');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const endValue = parseFloat(target.getAttribute('data-target'));
                animateValue(target, 0, endValue, 2000);
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(stat => observer.observe(stat));
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Easing function (easeOutExpo)
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        const currentVal = Math.floor(ease * (end - start) + start);
        
        // Formatting
        if (end > 1000) {
            obj.innerHTML = currentVal.toLocaleString(); 
        } else {
            obj.innerHTML = currentVal;
        }

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end > 1000 ? end.toLocaleString() : end;
        }
    };
    window.requestAnimationFrame(step);
}

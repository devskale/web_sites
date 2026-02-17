/**
 * Ukraine Reconstruction Bank - Prototype Script
 */

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initCounters();
    initMobileMenu();
    initPartnerTicker();
});

function initPartnerTicker() {
    const content = document.getElementById('ticker-content');
    if (!content) return;
    
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        content.style.justifyContent = 'center';
        return;
    }
    
    let position = 0; // Start visible from the left
    const speed = 1; // pixels per frame
    
    // Get the width of original items (first half)
    function getHalfWidth() {
        const items = content.querySelectorAll('.ticker-item');
        let width = 0;
        for (let i = 0; i < items.length / 2; i++) {
            width += items[i].offsetWidth + 64; // 64 = gap (4rem)
        }
        return width;
    }
    
    let isPaused = false;
    const container = document.getElementById('ticker-container');
    
    if (container) {
        container.addEventListener('mouseenter', () => isPaused = true);
        container.addEventListener('mouseleave', () => isPaused = false);
    }
    
    function animate() {
        if (!isPaused) {
            position -= speed;
            
            // Reset when we've scrolled the width of original items
            const halfWidth = getHalfWidth();
            if (position <= -halfWidth) {
                position = 0;
            }
            
            content.style.transform = `translateX(${position}px)`;
        }
        requestAnimationFrame(animate);
    }
    
    animate();
}

function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (!toggle || !navLinks) return;
    
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        
        // Update aria-expanded for accessibility
        const isExpanded = toggle.classList.contains('active');
        toggle.setAttribute('aria-expanded', isExpanded);
    });
    
    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            navLinks.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
            toggle.classList.remove('active');
            navLinks.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
}

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

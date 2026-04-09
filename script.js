document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // === Mobile burger menu (side panel) ===
    const burger = document.getElementById('burger');
    const navLinks = document.getElementById('navLinks');

    // Create overlay for closing menu by tapping outside
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    function openMenu() {
        navLinks.classList.add('open');
        burger.classList.add('open');
        overlay.classList.add('open');
        burger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        navLinks.classList.remove('open');
        burger.classList.remove('open');
        overlay.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    if (burger && navLinks) {
        burger.addEventListener('click', () => {
            navLinks.classList.contains('open') ? closeMenu() : openMenu();
        });

        overlay.addEventListener('click', closeMenu);

        // Close menu on link click
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('open')) {
                closeMenu();
            }
        });
    }

    // === Scroll animations (Intersection Observer) ===
    const animatedElements = document.querySelectorAll(
        '.bento-card, .pill, .cta-card, .section-header, .audience-card, .compare-card, .faq-item'
    );

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.style.animationPlayState = 'running';
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
        );

        animatedElements.forEach((el) => {
            el.style.animationPlayState = 'paused';
            observer.observe(el);
        });
    }

    // === Nav background on scroll ===
    const nav = document.getElementById('nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                nav.style.borderBottomColor = 'rgba(31,31,31,0.8)';
            } else {
                nav.style.borderBottomColor = '';
            }
        }, { passive: true });
    }
});

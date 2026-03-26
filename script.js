document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // === Mobile burger menu ===
    const burger = document.getElementById('burger');
    const navLinks = document.getElementById('navLinks');

    if (burger && navLinks) {
        burger.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            burger.classList.toggle('open');
            burger.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        // Close menu on link click
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                burger.classList.remove('open');
                burger.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('open')) {
                navLinks.classList.remove('open');
                burger.classList.remove('open');
                burger.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });
    }

    // === Scroll animations (Intersection Observer) ===
    const animatedElements = document.querySelectorAll(
        '.bento-card, .pill, .cta-card, .section-header'
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

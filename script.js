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

    // === Animated Statistics (Before/After block, counters, progress bars) ===
    const statsContainers = document.querySelectorAll('.stats-animate-container');
    if ('IntersectionObserver' in window && statsContainers.length > 0) {
        const statsObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                entry.target.querySelectorAll('.ba-progress-fill[data-fill]').forEach(bar => {
                    bar.style.setProperty('--ba-progress-target', bar.getAttribute('data-fill') + '%');
                });
                entry.target.querySelectorAll('.counter-value').forEach(counter => {
                    const target = +counter.getAttribute('data-target');
                    const duration = 2000;
                    let startTime = null;
                    const step = (timestamp) => {
                        if (!startTime) startTime = timestamp;
                        const progress = Math.min((timestamp - startTime) / duration, 1);
                        counter.innerText = Math.floor(progress * target);
                        if (progress < 1) {
                            window.requestAnimationFrame(step);
                        } else {
                            counter.innerText = target;
                            const suffix = counter.getAttribute('data-suffix');
                            if (suffix) counter.innerText += suffix;
                        }
                    };
                    window.requestAnimationFrame(step);
                    counter.classList.remove('counter-value');
                });
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.15 });

        statsContainers.forEach(container => statsObserver.observe(container));
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

    // === Hero slider (3 slides, swipeable, auto-play) ===
    document.querySelectorAll('.hero-slider').forEach((slider) => {
        const viewport = slider.querySelector('.hero-slider-viewport');
        const track = slider.querySelector('.hero-slider-track');
        const slides = Array.from(slider.querySelectorAll('.hero-slide'));
        const dots = Array.from(slider.querySelectorAll('.hero-slider-dot'));
        if (!viewport || !track || slides.length < 2) return;

        const total = slides.length;
        const autoplayMs = parseInt(slider.dataset.autoplay || '6500', 10);
        const restartDelay = 9000;
        const swipeThreshold = 50;
        let index = 0;
        let timer = null;
        let isDragging = false;
        let pointerId = null;
        let startX = 0;
        let startY = 0;
        let deltaX = 0;
        let trackWidth = 0;
        let lockedHorizontal = false;

        const apply = (animate = true) => {
            if (!animate) {
                track.style.transition = 'none';
                requestAnimationFrame(() => { track.style.transition = ''; });
            }
            track.style.transform = `translate3d(${-index * 100}%, 0, 0)`;
            slides.forEach((s, i) => {
                const active = i === index;
                s.setAttribute('aria-hidden', active ? 'false' : 'true');
            });
            dots.forEach((d, i) => {
                const active = i === index;
                d.classList.toggle('is-active', active);
                d.setAttribute('aria-selected', active ? 'true' : 'false');
            });
        };

        const go = (next, animate = true) => {
            index = ((next % total) + total) % total;
            apply(animate);
        };

        const start = () => {
            stop();
            timer = setInterval(() => go(index + 1), autoplayMs);
        };
        const stop = () => {
            if (timer) { clearInterval(timer); timer = null; }
        };
        const restartLater = () => {
            stop();
            setTimeout(start, restartDelay);
        };

        dots.forEach((dot) => {
            dot.addEventListener('click', () => {
                go(parseInt(dot.dataset.go, 10) || 0);
                restartLater();
            });
        });

        // Pointer (mouse + touch + pen)
        const onDown = (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            isDragging = true;
            pointerId = e.pointerId;
            startX = e.clientX;
            startY = e.clientY;
            deltaX = 0;
            lockedHorizontal = false;
            trackWidth = viewport.getBoundingClientRect().width;
            slider.classList.add('is-dragging');
            stop();
            try { viewport.setPointerCapture(pointerId); } catch (_) {}
        };
        const onMove = (e) => {
            if (!isDragging || e.pointerId !== pointerId) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (!lockedHorizontal) {
                if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
                lockedHorizontal = Math.abs(dx) > Math.abs(dy);
                if (!lockedHorizontal) { cancel(); return; }
            }
            e.preventDefault();
            // Resistance at edges
            let pct = dx / trackWidth;
            if ((index === 0 && pct > 0) || (index === total - 1 && pct < 0)) pct *= 0.35;
            deltaX = pct * trackWidth;
            track.style.transform = `translate3d(calc(${-index * 100}% + ${deltaX}px), 0, 0)`;
        };
        const onUp = (e) => {
            if (!isDragging) return;
            if (e && e.pointerId !== pointerId) return;
            slider.classList.remove('is-dragging');
            try { viewport.releasePointerCapture(pointerId); } catch (_) {}
            isDragging = false;
            if (lockedHorizontal && Math.abs(deltaX) > swipeThreshold) {
                go(index + (deltaX < 0 ? 1 : -1));
            } else {
                apply(true);
            }
            restartLater();
            deltaX = 0;
            lockedHorizontal = false;
        };
        const cancel = () => {
            isDragging = false;
            lockedHorizontal = false;
            deltaX = 0;
            slider.classList.remove('is-dragging');
            apply(true);
        };

        viewport.addEventListener('pointerdown', onDown);
        viewport.addEventListener('pointermove', onMove);
        viewport.addEventListener('pointerup', onUp);
        viewport.addEventListener('pointercancel', cancel);
        viewport.addEventListener('lostpointercapture', () => { if (isDragging) onUp({ pointerId }); });

        // Keyboard nav
        slider.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') { go(index - 1); restartLater(); }
            else if (e.key === 'ArrowRight') { go(index + 1); restartLater(); }
        });

        // Pause on hover / focus
        slider.addEventListener('mouseenter', stop);
        slider.addEventListener('mouseleave', start);
        slider.addEventListener('focusin', stop);
        slider.addEventListener('focusout', start);

        // Pause when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stop(); else start();
        });

        // Respect reduced motion
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (!reduce.matches) start();
        reduce.addEventListener?.('change', () => {
            if (reduce.matches) stop(); else start();
        });

        apply(false);
    });
});

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const compactViewport = window.matchMedia('(max-width: 820px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const onMediaChange = (query, handler) => {
        if (typeof query.addEventListener === 'function') {
            query.addEventListener('change', handler);
        } else if (typeof query.addListener === 'function') {
            query.addListener(handler);
        }
    };

    // === Mobile navigation ===
    const burger = document.getElementById('burger');
    const navLinks = document.getElementById('navLinks');
    const nav = document.getElementById('nav');
    let menuOpen = false;

    if (burger && navLinks) {
        const overlay = document.createElement('div');
        const backgroundRegions = Array.from(document.querySelectorAll('main, footer'));
        const supportsInert = 'inert' in HTMLElement.prototype;
        const fallbackTabIndexes = new Map();
        const backgroundInertState = new Map();
        let previousBodyOverflow = '';
        let addedMenuTabIndex = false;

        overlay.className = 'nav-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(overlay);

        burger.setAttribute('type', 'button');
        burger.setAttribute('aria-controls', navLinks.id || 'navLinks');

        const getMenuFocusables = () => Array.from(navLinks.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
            'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter((element) => !element.hidden && element.getAttribute('tabindex') !== '-1');

        const setMenuReachable = (reachable) => {
            if (!compactViewport.matches) {
                navLinks.removeAttribute('aria-hidden');
                if (supportsInert) navLinks.inert = false;
                fallbackTabIndexes.forEach((value, element) => {
                    if (value === null) element.removeAttribute('tabindex');
                    else element.setAttribute('tabindex', value);
                });
                fallbackTabIndexes.clear();
                return;
            }

            navLinks.setAttribute('aria-hidden', reachable ? 'false' : 'true');
            if (supportsInert) {
                navLinks.inert = !reachable;
                return;
            }

            if (!reachable) {
                getMenuFocusables().forEach((element) => {
                    if (!fallbackTabIndexes.has(element)) {
                        fallbackTabIndexes.set(element, element.getAttribute('tabindex'));
                    }
                    element.setAttribute('tabindex', '-1');
                });
            } else {
                fallbackTabIndexes.forEach((value, element) => {
                    if (value === null) element.removeAttribute('tabindex');
                    else element.setAttribute('tabindex', value);
                });
                fallbackTabIndexes.clear();
            }
        };

        const setBackgroundInert = (inert) => {
            if (!supportsInert) return;
            backgroundRegions.forEach((region) => {
                if (inert) {
                    backgroundInertState.set(region, region.inert);
                    region.inert = true;
                } else if (backgroundInertState.has(region)) {
                    region.inert = backgroundInertState.get(region);
                }
            });
            if (!inert) backgroundInertState.clear();
        };

        const openMenu = () => {
            if (!compactViewport.matches || menuOpen) return;

            menuOpen = true;
            previousBodyOverflow = document.body.style.overflow;
            navLinks.classList.add('open');
            burger.classList.add('open');
            overlay.classList.add('open');
            document.body.classList.add('is-menu-open');
            document.body.style.overflow = 'hidden';
            burger.setAttribute('aria-expanded', 'true');
            burger.setAttribute('aria-label', 'Закрыть меню');
            nav?.classList.remove('is-hidden');
            setMenuReachable(true);
            setBackgroundInert(true);

            const focusables = getMenuFocusables();
            if (focusables.length > 0) {
                focusables[0].focus();
            } else {
                if (!navLinks.hasAttribute('tabindex')) {
                    navLinks.setAttribute('tabindex', '-1');
                    addedMenuTabIndex = true;
                }
                navLinks.focus();
            }
        };

        const closeMenu = ({ restoreFocus = true } = {}) => {
            const wasOpen = menuOpen;
            menuOpen = false;
            navLinks.classList.remove('open');
            burger.classList.remove('open');
            overlay.classList.remove('open');
            document.body.classList.remove('is-menu-open');
            document.body.style.overflow = wasOpen ? previousBodyOverflow : document.body.style.overflow;
            burger.setAttribute('aria-expanded', 'false');
            burger.setAttribute('aria-label', 'Открыть меню');
            setBackgroundInert(false);
            setMenuReachable(false);

            if (addedMenuTabIndex) {
                navLinks.removeAttribute('tabindex');
                addedMenuTabIndex = false;
            }
            if (wasOpen && restoreFocus) burger.focus();
        };

        burger.addEventListener('click', () => {
            if (menuOpen) closeMenu();
            else openMenu();
        });

        overlay.addEventListener('click', () => closeMenu());

        navLinks.addEventListener('click', (event) => {
            if (event.target.closest('a[href]')) closeMenu();
        });

        document.addEventListener('keydown', (event) => {
            if (!menuOpen) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                closeMenu();
                return;
            }
            if (event.key !== 'Tab') return;

            const focusables = getMenuFocusables();
            if (focusables.length === 0) {
                event.preventDefault();
                navLinks.focus();
                return;
            }

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement;
            if (!navLinks.contains(active)) {
                event.preventDefault();
                first.focus();
            } else if (event.shiftKey && active === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
        });

        onMediaChange(compactViewport, () => {
            if (!compactViewport.matches) closeMenu({ restoreFocus: false });
            else setMenuReachable(menuOpen);
        });

        closeMenu({ restoreFocus: false });
    }

    // === Navigation scroll state ===
    if (nav) {
        let previousScrollY = Math.max(window.scrollY, 0);
        let scrollFrame = null;

        const updateNavState = () => {
            const currentScrollY = Math.max(window.scrollY, 0);
            const delta = currentScrollY - previousScrollY;
            nav.classList.toggle('is-scrolled', currentScrollY > 24);

            if (reducedMotion.matches || menuOpen || currentScrollY <= 120 || delta < -4) {
                nav.classList.remove('is-hidden');
            } else if (delta > 4) {
                nav.classList.add('is-hidden');
            }

            previousScrollY = currentScrollY;
            scrollFrame = null;
        };

        window.addEventListener('scroll', () => {
            if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(updateNavState);
        }, { passive: true });
        onMediaChange(reducedMotion, updateNavState);
        updateNavState();
    }

    // === Entry reveals ===
    const revealElements = Array.from(document.querySelectorAll([
        '.reveal-pending',
        '[data-reveal]',
        '.section-header',
        '.bento-card',
        '.pill',
        '.cta-card',
        '.audience-card',
        '.compare-card',
        '.faq-item',
        '.service-card',
        '.case-card',
        '.blog-card',
        '.process-step',
        '.review-card',
        '.contact-card',
        '.detail-block'
    ].join(', ')));

    revealElements.forEach((element) => element.classList.add('reveal-pending'));

    const revealAll = () => revealElements.forEach((element) => {
        element.classList.add('is-revealed');
    });

    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
        revealAll();
    } else if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-revealed');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        revealElements.forEach((element) => revealObserver.observe(element));
        onMediaChange(reducedMotion, () => {
            if (reducedMotion.matches) {
                revealAll();
                revealObserver.disconnect();
            }
        });
    }

    // === Animated statistics ===
    const statsContainers = document.querySelectorAll('.stats-animate-container');
    const animatedCounters = new WeakSet();

    const showStats = (container, animateCounters = true) => {
        container.classList.add('is-visible', 'is-revealed');
        container.querySelectorAll('.ba-progress-fill[data-fill]').forEach((bar) => {
            const target = Number.parseFloat(bar.getAttribute('data-fill'));
            if (Number.isFinite(target)) {
                bar.style.setProperty('--ba-progress-target', `${target}%`);
            }
        });

        container.querySelectorAll('.counter-value[data-target]').forEach((counter) => {
            const target = Number.parseFloat(counter.getAttribute('data-target'));
            if (!Number.isFinite(target)) return;
            const suffix = counter.getAttribute('data-suffix') || '';
            if (animatedCounters.has(counter)) {
                if (!animateCounters || reducedMotion.matches) {
                    counter.textContent = `${target}${suffix}`;
                }
                return;
            }
            animatedCounters.add(counter);

            if (!animateCounters || reducedMotion.matches) {
                counter.textContent = `${target}${suffix}`;
                return;
            }

            const duration = 2000;
            let startTime = null;
            const step = (timestamp) => {
                if (reducedMotion.matches) {
                    counter.textContent = `${target}${suffix}`;
                    return;
                }
                if (startTime === null) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                counter.textContent = `${Math.floor(progress * target)}`;
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    counter.textContent = `${target}${suffix}`;
                }
            };
            window.requestAnimationFrame(step);
        });
    };

    if (statsContainers.length > 0) {
        if (reducedMotion.matches || !('IntersectionObserver' in window)) {
            statsContainers.forEach((container) => showStats(container, false));
        } else {
            const statsObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    showStats(entry.target, true);
                    observer.unobserve(entry.target);
                });
            }, { threshold: 0.15 });

            statsContainers.forEach((container) => statsObserver.observe(container));
            onMediaChange(reducedMotion, () => {
                if (!reducedMotion.matches) return;
                statsContainers.forEach((container) => showStats(container, false));
                statsObserver.disconnect();
            });
        }
    }

    // === Compact blog progressive disclosure ===
    const blogGrid = document.querySelector('.blog-grid');
    const blogLoadMore = document.getElementById('blogLoadMore');

    if (blogGrid && blogLoadMore) {
        const cards = blogGrid.querySelectorAll('.blog-card');
        let expanded = false;
        let wasCompact = compactViewport.matches;

        const updateBlogDisclosure = () => {
            const isCompact = compactViewport.matches;
            if (wasCompact !== isCompact) expanded = false;
            wasCompact = isCompact;

            const canCollapse = isCompact && cards.length > 6;
            blogGrid.classList.toggle('is-collapsed', canCollapse && !expanded);
            blogLoadMore.hidden = !canCollapse || expanded;
            blogLoadMore.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        };

        blogLoadMore.addEventListener('click', () => {
            expanded = true;
            updateBlogDisclosure();
            window.requestAnimationFrame(() => {
                cards[6]?.querySelector('a[href]')?.focus();
            });
        });

        onMediaChange(compactViewport, updateBlogDisclosure);
        updateBlogDisclosure();
    }

    // === Hero slider (swipeable, optional autoplay) ===
    document.querySelectorAll('.hero-slider').forEach((slider) => {
        const viewport = slider.querySelector('.hero-slider-viewport');
        const track = slider.querySelector('.hero-slider-track');
        const slides = Array.from(slider.querySelectorAll('.hero-slide'));
        const dots = Array.from(slider.querySelectorAll('.hero-slider-dot'));
        if (!viewport || !track || slides.length < 2) return;

        const total = slides.length;
        const parsedAutoplay = Number.parseInt(slider.dataset.autoplay || '6500', 10);
        const autoplayMs = Number.isFinite(parsedAutoplay) ? parsedAutoplay : 6500;
        const restartDelay = 9000;
        const swipeThreshold = 50;
        let index = 0;
        let autoplayTimer = null;
        let restartTimer = null;
        let isDragging = false;
        let pointerId = null;
        let startX = 0;
        let startY = 0;
        let deltaX = 0;
        let trackWidth = 0;
        let lockedHorizontal = false;

        const apply = (animate = true) => {
            if (!animate || reducedMotion.matches) {
                track.style.transition = 'none';
                window.requestAnimationFrame(() => {
                    track.style.transition = '';
                });
            }
            track.style.transform = `translate3d(${-index * 100}%, 0, 0)`;
            slides.forEach((slide, slideIndex) => {
                slide.setAttribute('aria-hidden', slideIndex === index ? 'false' : 'true');
            });
            dots.forEach((dot, dotIndex) => {
                const active = dotIndex === index;
                dot.classList.toggle('is-active', active);
                dot.setAttribute('aria-selected', active ? 'true' : 'false');
            });
        };

        const go = (next, animate = true) => {
            index = ((next % total) + total) % total;
            apply(animate);
        };

        const stop = () => {
            if (autoplayTimer !== null) {
                window.clearInterval(autoplayTimer);
                autoplayTimer = null;
            }
            if (restartTimer !== null) {
                window.clearTimeout(restartTimer);
                restartTimer = null;
            }
        };

        const start = () => {
            stop();
            if (reducedMotion.matches || document.hidden || isDragging) return;
            autoplayTimer = window.setInterval(() => go(index + 1), autoplayMs);
        };

        const restartLater = () => {
            stop();
            if (reducedMotion.matches || document.hidden) return;
            restartTimer = window.setTimeout(start, restartDelay);
        };

        dots.forEach((dot) => {
            dot.addEventListener('click', () => {
                const next = Number.parseInt(dot.dataset.go || '0', 10);
                go(Number.isFinite(next) ? next : 0);
                restartLater();
            });
        });

        const cancelDrag = ({ restart = true } = {}) => {
            isDragging = false;
            lockedHorizontal = false;
            deltaX = 0;
            slider.classList.remove('is-dragging');
            apply(true);
            if (restart) restartLater();
        };

        const onDown = (event) => {
            if (event.button !== undefined && event.button !== 0) return;
            isDragging = true;
            pointerId = event.pointerId;
            startX = event.clientX;
            startY = event.clientY;
            deltaX = 0;
            lockedHorizontal = false;
            trackWidth = viewport.getBoundingClientRect().width;
            if (trackWidth <= 0) {
                isDragging = false;
                return;
            }
            slider.classList.add('is-dragging');
            stop();
            try { viewport.setPointerCapture(pointerId); } catch (_) { /* Optional API. */ }
        };

        const onMove = (event) => {
            if (!isDragging || event.pointerId !== pointerId) return;
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            if (!lockedHorizontal) {
                if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
                lockedHorizontal = Math.abs(dx) > Math.abs(dy);
                if (!lockedHorizontal) {
                    cancelDrag();
                    return;
                }
            }

            event.preventDefault();
            let percent = dx / trackWidth;
            if ((index === 0 && percent > 0) || (index === total - 1 && percent < 0)) {
                percent *= 0.35;
            }
            deltaX = percent * trackWidth;
            track.style.transform = `translate3d(calc(${-index * 100}% + ${deltaX}px), 0, 0)`;
        };

        const onUp = (event) => {
            if (!isDragging || (event && event.pointerId !== pointerId)) return;
            slider.classList.remove('is-dragging');
            try { viewport.releasePointerCapture(pointerId); } catch (_) { /* Optional API. */ }
            isDragging = false;
            if (lockedHorizontal && Math.abs(deltaX) > swipeThreshold) {
                go(index + (deltaX < 0 ? 1 : -1));
            } else {
                apply(true);
            }
            deltaX = 0;
            lockedHorizontal = false;
            restartLater();
        };

        viewport.addEventListener('pointerdown', onDown);
        viewport.addEventListener('pointermove', onMove);
        viewport.addEventListener('pointerup', onUp);
        viewport.addEventListener('pointercancel', () => cancelDrag());
        viewport.addEventListener('lostpointercapture', () => {
            if (isDragging) onUp({ pointerId });
        });

        slider.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                go(index - 1);
                restartLater();
            } else if (event.key === 'ArrowRight') {
                go(index + 1);
                restartLater();
            }
        });

        slider.addEventListener('mouseenter', stop);
        slider.addEventListener('mouseleave', start);
        slider.addEventListener('focusin', stop);
        slider.addEventListener('focusout', start);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stop();
            else start();
        });

        onMediaChange(reducedMotion, () => {
            if (reducedMotion.matches) {
                stop();
                apply(false);
            } else {
                start();
            }
        });

        apply(false);
        start();
    });
});

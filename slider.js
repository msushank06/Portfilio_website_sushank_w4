/* =========================================================
   REUSABLE IMAGE SLIDER
   Vanilla JavaScript; supports multiple [data-slider] instances.
   ========================================================= */

class ImageSlider {
    constructor(root, options = {}) {
        this.root = root;
        this.viewport = root.querySelector('.slider-viewport');
        this.track = root.querySelector('.slider-track');
        this.slides = Array.from(root.querySelectorAll('.slide'));
        this.previousButton = root.querySelector('[data-slider-prev]');
        this.nextButton = root.querySelector('[data-slider-next]');
        this.dotsContainer = root.querySelector('[data-slider-dots]');
        this.status = root.querySelector('[data-slider-status]');
        this.index = 0;
        this.startX = 0;
        this.startY = 0;
        this.autoplay = options.autoplay ?? root.dataset.autoplay === 'true';
        this.interval = Number(options.interval ?? root.dataset.interval ?? 5000);
        this.timer = null;

        if (!this.track || this.slides.length === 0) return;

        this.createDots();
        this.bindEvents();
        this.show(0, false);

        if (this.autoplay) this.startAutoplay();
    }

    createDots() {
        this.dotsContainer.replaceChildren();
        this.dots = this.slides.map((slide, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'slider-dot';
            dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
            dot.setAttribute('aria-current', 'false');
            dot.addEventListener('click', () => this.show(index));
            this.dotsContainer.append(dot);
            return dot;
        });
    }

    bindEvents() {
        this.previousButton?.addEventListener('click', () => this.previous());
        this.nextButton?.addEventListener('click', () => this.next());

        // Keyboard navigation when the slider itself has focus.
        this.root.tabIndex = 0;
        this.root.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                this.previous();
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                this.next();
            }
        });

        // Touch swipe support without blocking vertical page scrolling.
        this.viewport?.addEventListener('touchstart', (event) => {
            const touch = event.changedTouches[0];
            this.startX = touch.clientX;
            this.startY = touch.clientY;
        }, { passive: true });

        this.viewport?.addEventListener('touchend', (event) => {
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - this.startX;
            const deltaY = touch.clientY - this.startY;
            if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
                deltaX < 0 ? this.next() : this.previous();
            }
        }, { passive: true });

        // Pause autoplay while a user is interacting with the component.
        this.root.addEventListener('mouseenter', () => this.stopAutoplay());
        this.root.addEventListener('mouseleave', () => {
            if (this.autoplay) this.startAutoplay();
        });
        this.root.addEventListener('focusin', () => this.stopAutoplay());
        this.root.addEventListener('focusout', (event) => {
            if (!this.root.contains(event.relatedTarget) && this.autoplay) this.startAutoplay();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.stopAutoplay();
            else if (this.autoplay) this.startAutoplay();
        });
    }

    show(nextIndex, announce = true) {
        this.index = (nextIndex + this.slides.length) % this.slides.length;
        this.track.style.transform = `translateX(-${this.index * 100}%)`;

        this.slides.forEach((slide, index) => {
            const active = index === this.index;
            slide.classList.toggle('is-active', active);
            slide.setAttribute('aria-hidden', String(!active));
            slide.querySelectorAll('a, button, input, textarea, select').forEach((control) => {
                control.tabIndex = active ? 0 : -1;
            });
        });

        this.dots.forEach((dot, index) => {
            dot.setAttribute('aria-current', String(index === this.index));
        });

        if (this.status) {
            this.status.textContent = `Slide ${this.index + 1} of ${this.slides.length}`;
            if (announce) this.status.setAttribute('aria-live', 'polite');
        }
    }

    next() { this.show(this.index + 1); }
    previous() { this.show(this.index - 1); }

    startAutoplay() {
        this.stopAutoplay();
        if (!this.autoplay || this.slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        this.timer = window.setInterval(() => this.next(), this.interval);
    }

    stopAutoplay() {
        if (this.timer !== null) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
    }
}

// Initialize every slider on the page. Options can be passed to new ImageSlider().
document.querySelectorAll('[data-slider]').forEach((slider) => {
    new ImageSlider(slider);
});

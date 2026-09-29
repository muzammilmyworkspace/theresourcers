import { gsap } from 'gsap';
import { $, $$, bp, rem } from './helpers.js';
import { smooth } from './lenis.js';

/**
 * Header
 *  - hide on scroll down / show on scroll up (after 3× header height)
 *  - `.on-scroll` after 2× header height (white bar, logo collapses to mark)
 *  - light/dark mode from the [data-section] underneath
 *  - "News:" ticker every 3s
 *  - dots → hexagon menu toggle + clip-path dropdown
 */
class Header {
  isOpen = false;

  init() {
    this.el = $('.header');
    if (!this.el) return;
    this.h = this.el.querySelector('.header-inner').offsetHeight;
    this.lastScroll = 0;

    this.initTicker();
    this.initMenu();

    smooth.on('scroll', this.onScroll);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', () => (this.h = this.el.querySelector('.header-inner').offsetHeight));
    this.onScroll();
  }

  onScroll = () => {
    const y = smooth.scroll;
    const dir = y > this.lastScroll ? 1 : y < this.lastScroll ? -1 : 0;
    this.lastScroll = y;
    const cl = this.el.classList;

    cl.toggle('on-scroll', y > this.h * 2);
    if (!this.isOpen) {
      if (y < this.h * 3) cl.remove('on-hide');
      else if (dir === 1) cl.add('on-hide');
      else if (dir === -1) cl.remove('on-hide');
    }

    this.updateMode();
    if (this.isOpen && Math.abs(y - this.openScroll) > 50 && !bp.isMobile()) this.close();
  };

  updateMode() {
    const probe = this.h / 2;
    let mode = 'light';
    for (const s of document.querySelectorAll('[data-section]')) {
      const r = s.getBoundingClientRect();
      // last match wins, so nested sections override their parent
      if (r.top <= probe && r.bottom > probe) mode = s.dataset.section;
    }
    this.el.classList.toggle('on-dark', mode === 'dark');
  }

  /* ---------------- news ticker ---------------- */
  initTicker() {
    const items = $$('.news-item', this.el);
    if (items.length < 2) { items[0]?.classList.add('active'); return; }
    let i = 0;
    items[0].classList.add('active');
    setInterval(() => {
      const cur = items[i];
      i = (i + 1) % items.length;
      const next = items[i];
      cur.classList.remove('active');
      cur.classList.add('de-active');
      next.classList.remove('de-active', 'no-trans');
      next.classList.add('active');
      setTimeout(() => {
        cur.classList.add('no-trans');
        cur.classList.remove('de-active');
        setTimeout(() => cur.classList.remove('no-trans'), 50);
      }, 500);
    }, 3000);
  }

  /* ---------------- menu ---------------- */
  initMenu() {
    this.toggle = $('.menu-toggle', this.el);
    this.dropdown = $('.header-dropdown', this.el);
    this.dotsWrap = $('.menu-dots', this.el);
    this.dots = $$('.menu-dot', this.el);
    if (!this.toggle) return;

    this.layoutClosed(true);
    gsap.set($$('.dd-link-inner, .dd-anim', this.el), { yPercent: -100 });
    gsap.set($$('.header-dropdown-line', this.el), { scaleX: 0 });
    this.toggle.addEventListener('click', () => (this.isOpen ? this.close() : this.open()));

    $$('.dd-link', this.el).forEach((link, i) => {
      link.addEventListener('mouseenter', () => this.isOpen && gsap.to(this.dotsWrap, { rotation: i * 60, duration: 0.4, ease: 'power2.out' }));
      link.addEventListener('mouseleave', () => this.isOpen && gsap.to(this.dotsWrap, { rotation: 0, duration: 0.4, ease: 'power2.out' }));
      link.addEventListener('click', () => this.isOpen && setTimeout(() => this.close(), bp.isMobile() ? 500 : 250));
    });

    document.addEventListener('keydown', (e) => e.key === 'Escape' && this.isOpen && this.close());
  }

  layoutClosed(instant = false) {
    const gap = rem(0.9);
    const pos = [
      { x: -gap, y: 0, opacity: 0.3 }, { x: 0, y: 0, opacity: 0.6 }, { x: gap, y: 0, opacity: 1 },
      { x: 0, y: 0, opacity: 0 }, { x: 0, y: 0, opacity: 0 }, { x: 0, y: 0, opacity: 0 },
    ];
    this.dots.forEach((d, i) =>
      gsap.to(d, { ...pos[i], scale: 1, duration: instant ? 0 : 0.35, ease: 'back.out(1.5)', delay: instant ? 0 : 0.2 })
    );
  }

  layoutHex() {
    const R = rem(1.1);
    this.dots.forEach((d, i) => {
      const a = (-90 + i * 60) * (Math.PI / 180);
      gsap.to(d, { x: Math.cos(a) * R, y: Math.sin(a) * R, opacity: 1 - i * 0.12, scale: 1, duration: 0.35, ease: 'back.out(1.5)', delay: 0.2 });
    });
  }

  collapseDots() {
    gsap.to(this.dots, { x: 0, y: 0, scale: 0.6, duration: 0.2, ease: 'power2.in', overwrite: true });
  }

  open() {
    this.isOpen = true;
    this.openScroll = smooth.scroll;
    this.el.classList.add('is-open');
    this.el.classList.remove('on-hide');
    this.toggle.setAttribute('aria-expanded', 'true');
    if (bp.isMobile()) smooth.stop();

    this.collapseDots();
    this.layoutHex();

    const d = this.dropdown;
    this.tl?.kill();
    this.tl = gsap.timeline()
      .set(d, { opacity: 1 })
      .fromTo($('.header-dropdown-bg', d), { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.6, ease: 'power3.inOut' }, 0)
      .fromTo($$('.header-dropdown-line', d), { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power3.out' }, 0.3)
      .fromTo($$('.dd-link-inner', d), { yPercent: -100 }, { yPercent: 0, duration: 0.6, ease: 'power3.out', stagger: 0.04 }, 0.3)
      .fromTo($$('.dd-anim', d), { yPercent: -100 }, { yPercent: 0, duration: 0.5, ease: 'power3.out', stagger: 0.03 }, 0.5);
  }

  close() {
    this.isOpen = false;
    this.toggle.setAttribute('aria-expanded', 'false');
    if (bp.isMobile()) smooth.start();
    gsap.to(this.dotsWrap, { rotation: 0, duration: 0.3 });
    this.collapseDots();
    this.layoutClosed();

    const d = this.dropdown;
    this.tl?.kill();
    this.tl = gsap.timeline({ onComplete: () => this.el.classList.remove('is-open') })
      .to($$('.dd-anim', d), { yPercent: -100, duration: 0.3, ease: 'power2.in', stagger: 0.02 }, 0)
      .to($$('.dd-link-inner', d), { yPercent: -100, duration: 0.4, ease: 'power2.in', stagger: 0.02 }, 0.05)
      .to($$('.header-dropdown-line', d), { scaleX: 0, duration: 0.5, ease: 'power3.in' }, 0.1)
      .to($('.header-dropdown-bg', d), { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'power3.inOut' }, 0.25);
  }
}

export const header = new Header();

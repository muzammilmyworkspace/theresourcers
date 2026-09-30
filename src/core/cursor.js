import { gsap } from 'gsap';
import { $, bp, isTouch, rem } from './helpers.js';
import { smooth } from './lenis.js';

/**
 * Custom cursor — desktop & fine pointer only.
 *  - lerped follow (0.15)
 *  - scroll-progress ring
 *  - [data-cursor="link"]    orange blob + label + trail
 *  - [data-cursor="control"] prev/next arrow for sliders
 *  - [data-cursor="hidden"]
 */
class Cursor {
  enabled = false;
  mouse = { x: -200, y: -200 };
  pos = { x: -200, y: -200 };
  lastTrail = { x: 0, y: 0 };
  type = null;
  controlEl = null;

  init() {
    if (!bp.isDesktop() || isTouch()) return;
    this.root = $('.cursor');
    if (!this.root) return;
    this.enabled = true;
    document.documentElement.classList.add('has-cursor');

    this.main = $('.cursor-main', this.root);
    this.label = $('.cursor-link-txt', this.root);
    this.trail = $('.cursor-trail', this.root);
    this.circle = $('.cursor-outline circle', this.root);
    const r = parseFloat(this.circle.getAttribute('r'));
    this.circ = 2 * Math.PI * r;
    this.circle.style.strokeDasharray = this.circ;
    this.circle.style.strokeDashoffset = this.circ;

    gsap.set(this.main, { xPercent: -50, yPercent: -50 });
    this.setX = gsap.quickSetter(this.main, 'x', 'px');
    this.setY = gsap.quickSetter(this.main, 'y', 'px');
    this.halo = $('.cursor-halo', this.root);
    this.hX = gsap.quickSetter(this.halo, 'x', 'px');
    this.hY = gsap.quickSetter(this.halo, 'y', 'px');
    this.hpos = { x: -200, y: -200 };

    window.addEventListener('mousemove', this.onMove, { passive: true });
    window.addEventListener('mousedown', () => this.root.classList.add('is-down'));
    window.addEventListener('mouseup', () => this.root.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => this.root.classList.remove('active'));
    document.addEventListener('mouseenter', () => this.root.classList.add('active'));
    document.addEventListener('mouseover', this.onOver);
    document.addEventListener('mouseout', this.onOut);

    gsap.ticker.add(this.tick);
  }

  onMove = (e) => {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    if (!this.root.classList.contains('active')) {
      this.pos.x = e.clientX;
      this.pos.y = e.clientY;
      this.root.classList.add('active');
    }
    if (this.type === 'control' && this.controlEl) this.updateControl();
    if (this.type === 'link') this.spawnTrail();
  };

  tick = () => {
    this.pos.x += (this.mouse.x - this.pos.x) * 0.15;
    this.pos.y += (this.mouse.y - this.pos.y) * 0.15;
    this.setX(this.pos.x);
    this.setY(this.pos.y);
    this.hpos.x += (this.mouse.x - this.hpos.x) * 0.08;
    this.hpos.y += (this.mouse.y - this.hpos.y) * 0.08;
    this.hX(this.hpos.x);
    this.hY(this.hpos.y);

    // scroll progress ring
    const limit = smooth.limit || 1;
    const p = Math.min(1, Math.max(0, smooth.scroll / limit));
    this.circle.style.strokeDashoffset = this.circ * (1 - p);
  };

  onOver = (e) => {
    const t = e.target.closest?.('[data-cursor]');
    if (!t || t === this.current) return;
    this.current = t;
    this.setType(t.dataset.cursor, t);
  };

  onOut = (e) => {
    if (!this.current) return;
    const to = e.relatedTarget;
    if (to && this.current.contains(to)) return;
    const next = to?.closest?.('[data-cursor]');
    this.current = next || null;
    next ? this.setType(next.dataset.cursor, next) : this.reset();
  };

  setType(type, el) {
    this.reset();
    this.type = type;
    const cl = this.root.classList;
    if (type === 'link') {
      cl.add('has-link');
      this.label.textContent = el.dataset.cursorText || 'View';
      this.lastTrail = { ...this.mouse };
    } else if (type === 'control') {
      cl.add('has-control');
      this.controlEl = el;
      this.updateControl();
    } else if (type === 'hidden') {
      cl.add('is-hidden');
    }
  }

  reset() {
    this.type = null;
    this.controlEl = null;
    this.root.classList.remove('has-link', 'has-control', 'has-control-prev', 'has-control-next', 'cursor-control-disable', 'is-hidden');
  }

  updateControl() {
    const r = this.controlEl.getBoundingClientRect();
    const next = this.mouse.x > r.left + r.width / 2;
    const cl = this.root.classList;
    cl.toggle('has-control-next', next);
    cl.toggle('has-control-prev', !next);
    const swiper = this.controlEl.swiper || this.controlEl.querySelector('.swiper')?.swiper;
    const disabled = swiper ? (next ? swiper.isEnd : swiper.isBeginning) : false;
    cl.toggle('cursor-control-disable', !!disabled);
  }

  spawnTrail() {
    const dx = this.mouse.x - this.lastTrail.x;
    const dy = this.mouse.y - this.lastTrail.y;
    if (dx * dx + dy * dy < 28 * 28) return;
    this.lastTrail = { ...this.mouse };
    const size = this.main.offsetWidth || rem(12);
    const dot = document.createElement('span');
    dot.className = 'cursor-trail-item';
    Object.assign(dot.style, { width: `${size}px`, height: `${size}px` });
    this.trail.appendChild(dot);
    gsap.set(dot, { x: this.pos.x - size / 2, y: this.pos.y - size / 2 });
    gsap.to(dot, { opacity: 0, duration: 0.4, ease: 'power1.out', onComplete: () => dot.remove() });
  }

  /** attach click-to-slide on a slider element (left half prev, right half next) */
  bindControl(el, swiper) {
    el.addEventListener('click', (e) => {
      const r = el.getBoundingClientRect();
      e.clientX > r.left + r.width / 2 ? swiper.slideNext() : swiper.slidePrev();
      if (this.enabled) this.updateControl();
    });
  }
}

export const cursor = new Cursor();

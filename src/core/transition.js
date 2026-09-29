import { gsap } from 'gsap';
import { $, $$ } from './helpers.js';

/**
 * Page transition overlay
 *   cover():  a dark circle grows from the centre (clip-path 0% → 72%) with looping rings
 *   reveal(): rings blow outward, three "holes" (#000 → #181818 → #343434) open the new page
 */
class Transition {
  init() {
    this.el = $('.trans');
    if (!this.el) return;
    this.clip = $('.trans-clip', this.el);
    this.circsWrap = $('.trans-circs', this.el);
    this.logo = $('.trans-logo', this.el);
    this.masks = $$('.bg-mask', this.el).reverse();

    // four rings, each on a 12s loop, phases 3s apart
    const src = $('.trans-circ', this.circsWrap);
    this.circsWrap.innerHTML = '';
    this.loops = [0, 1, 2, 3].map((i) => {
      const c = src.cloneNode();
      this.circsWrap.appendChild(c);
      const tl = gsap.timeline({ repeat: -1, paused: true });
      tl.fromTo(c, { scale: 1 }, { scale: 6.216, duration: 12, ease: 'none' }, 0)
        .fromTo(c, { opacity: 0 }, { keyframes: [{ opacity: 0.65, duration: 2.4 }, { opacity: 1, duration: 4.8 }, { opacity: 0.65, duration: 2.4 }, { opacity: 0, duration: 2.4 }], ease: 'none' }, 0);
      tl.progress((0.4 + i * 0.25) % 1);
      return tl;
    });
  }

  cover() {
    if (!this.el) return Promise.resolve();
    document.body.style.pointerEvents = 'none';
    this.el.classList.add('is-active');
    gsap.set(this.masks, { width: 0, height: 0 });
    gsap.set(this.circsWrap, { opacity: 0, scale: 0.8 });
    gsap.set(this.logo, { opacity: 0, y: 10 });
    this.loops.forEach((l) => l.play());
    return new Promise((resolve) => {
      gsap.timeline({ onComplete: resolve })
        .fromTo(this.clip, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(72% at 50% 50%)', duration: 0.85, ease: 'circ.inOut' }, 0)
        .to(this.circsWrap, { opacity: 1, scale: 1, duration: 0.85, ease: 'circ.inOut' }, 0)
        .to(this.logo, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.45);
    });
  }

  reveal() {
    if (!this.el) return Promise.resolve();
    return new Promise((resolve) => {
      gsap.timeline({
        onComplete: () => {
          this.loops.forEach((l) => l.pause());
          this.el.classList.remove('is-active');
          gsap.set(this.clip, { clipPath: 'circle(0% at 50% 50%)' });
          gsap.set(this.masks, { width: 0, height: 0 });
          document.body.style.pointerEvents = '';
          resolve();
        },
      })
        .to(this.logo, { opacity: 0, y: -10, duration: 0.4, ease: 'power2.in' }, 0)
        .to(this.circsWrap, { scale: 1.8, opacity: 0, duration: 1, ease: 'circ.inOut' }, 0)
        .to(this.masks, { width: '135vmax', height: '135vmax', duration: 0.6, ease: 'circ.inOut', stagger: 0.18 }, 0.15);
    });
  }
}

export const transition = new Transition();

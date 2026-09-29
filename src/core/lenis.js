import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bp, debounce } from './helpers.js';

class SmoothScroll {
  lenis = null;

  init() {
    const mobile = bp.isMobile();
    this.lenis = new Lenis(
      mobile
        ? { lerp: 1, duration: 0, smoothWheel: true, syncTouch: false, anchors: true }
        : { lerp: 0.1, smoothWheel: true, syncTouch: false, wheelMultiplier: 1, anchors: { offset: -40 } }
    );

    this.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => this.lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // keep lenis + triggers in sync when the document height changes
    let lastH = document.body.scrollHeight;
    const onBodyResize = debounce(() => {
      const h = document.body.scrollHeight;
      if (h === lastH) return;
      lastH = h;
      this.lenis.resize();
      ScrollTrigger.refresh();
    }, 200);
    new ResizeObserver(onBodyResize).observe(document.body);
  }

  get scroll() {
    return this.lenis ? this.lenis.scroll : window.scrollY;
  }

  get limit() {
    return this.lenis ? this.lenis.limit : document.documentElement.scrollHeight - window.innerHeight;
  }

  stop() {
    this.lenis?.stop();
    document.documentElement.style.overflow = 'hidden';
  }

  start() {
    this.lenis?.start();
    document.documentElement.style.overflow = '';
  }

  scrollTo(target, opts = {}) {
    this.lenis ? this.lenis.scrollTo(target, opts) : window.scrollTo(0, typeof target === 'number' ? target : 0);
  }

  scrollToTop() {
    this.scrollTo(0, { immediate: true, force: true });
  }

  on(evt, cb) {
    this.lenis?.on(evt, cb);
  }

  off(evt, cb) {
    this.lenis?.off(evt, cb);
  }
}

export const smooth = new SmoothScroll();
window.smoothScroll = smooth;

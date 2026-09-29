import { gsap } from 'gsap';
import { $, $$, bp } from '../core/helpers.js';
import { fill, fadeUp, line, revealGroup } from '../core/reveal.js';
import { Globe } from '../webgl/Globe.js';

export class Hero {
  constructor(root = $('.home-hero')) {
    this.root = root;
  }

  init() {
    const root = this.root;
    const mobile = bp.isMobile();
    const q = (s) => $(s, root);
    const canvas = q('.home-hero-canvas');

    try {
      this.globe = new Globe({ canvas, labelsWrap: q('.globe-labels') });
      this.globe.init();
    } catch (err) {
      console.warn('Globe disabled:', err);
      root.classList.add('no-webgl');
    }

    const orange = q('.home-hero-globe-shadow.orange');
    const blue = q('.home-hero-globe-shadow.blue');
    const bluePlus = q('.home-hero-globe-shadow.blue-plus');
    const blur = q('.home-hero-globe-blur');
    const labels = $$('.globe-label-text', root);
    const hint = q('.home-hero-hint');

    gsap.set([orange, blue, bluePlus], { autoAlpha: 0 });
    gsap.set(orange, { scale: 0.9, y: 20 });
    gsap.set(bluePlus, { scale: 1.1 });
    gsap.set(canvas, { autoAlpha: 0, filter: mobile ? 'blur(2px)' : 'none' });
    gsap.set(labels, { autoAlpha: 0, y: 10, filter: 'blur(5px)' });
    gsap.set(blur, { autoAlpha: 0, scale: 0.8 });
    if (!mobile) gsap.set(q('.home-hero-globe'), { scale: 0.4, xPercent: 20 });
    if (hint) gsap.set(hint, { autoAlpha: 0, y: 10 });

    const text = revealGroup({
      paused: true,
      items: [
        line(q('.home-hero-label .label-line')),
        fill(q('.home-hero-label .txt-anim'), { at: 0 }),
        fill(q('.home-hero-title')),
        fill(q('.home-hero-desc')),
        fadeUp($$('.home-hero-btn', root), { y: 1 }),
      ],
    });

    this.tl = gsap.timeline({ paused: true, delay: 0.3, onComplete: () => this.scrollOut() });
    if (!mobile) this.tl.to(q('.home-hero-globe'), { scale: 1, xPercent: 0, duration: 1, ease: 'expo.out' }, 0);
    this.tl
      .to(orange, { autoAlpha: 1, scale: 1, y: 0, duration: 1.2, ease: 'circ.inOut' }, mobile ? 0.3 : '<')
      .to(blue, { autoAlpha: 1, duration: 1.2, ease: 'circ.inOut' }, '<0.1')
      .to(bluePlus, { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'back.out(1.3)' }, '<0.1')
      .to(text.tl, { progress: 1, duration: text.tl.duration(), ease: 'none' }, mobile ? 0 : '<')
      .to(canvas, { autoAlpha: 1, filter: 'blur(0px)', duration: 1 }, '<')
      .to(labels, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.5, stagger: 0.05 }, '<0.4')
      .to(blur, { autoAlpha: 1, scale: 1, duration: 1, ease: 'back.out(1.3)' }, '<0.1');
    if (hint) this.tl.to(hint, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '<0.3');
  }

  play() {
    this.tl.play();
  }

  destroy() {
    this.tl?.kill();
    this.globe?.destroy();
  }

  /* globe dims away as the hero scrolls out (desktop) */
  scrollOut() {
    if (!bp.isDesktop()) return;
    gsap.timeline({
      scrollTrigger: { trigger: this.root, start: 'top top-=20%', end: 'center top', scrub: true },
    })
      .fromTo($('.home-hero-globe', this.root), { autoAlpha: 1, filter: 'brightness(1)' }, { autoAlpha: 0, filter: 'brightness(0.2)', ease: 'none' }, 0)
      .fromTo($('.home-hero-bg-star', this.root), { opacity: 0.18, scale: 1 }, { opacity: 0, scale: 1.1, ease: 'none' }, 0);
  }
}

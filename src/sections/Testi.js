import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, bp } from '../core/helpers.js';
import { portrait } from '../core/art2.js';
import { updateSky } from '../core/sky.js';

/**
 * The jet crosses the sky from the left; the sky cover slides away behind its
 * nose (notched edge), the jet settles on the right while the client stories
 * scroll beneath it, then it climbs away. Everything is transform-only.
 */
export class Testi {
  constructor(root = $('.home-testi')) {
    this.root = root;
  }

  init() {
    const root = this.root;
    if (!root) return;
    const q = (s) => $(s, root);
    $$('.testi-photo', root).forEach((el) => (el.innerHTML = portrait(+el.dataset.face)));

    const plane = q('.testi-plane'), cover = q('.testi-cover'), sky = q('.testi-cover .testi-sky'), list = q('.testi-list');
    const mobile = bp.isMobile();
    const P = { x: -60, y: 0, r: 0, s: 1 };           // plane: left edge in vw, y in vh, bank deg, scale
    const planeW = mobile ? 90 : 52;                   // matches CSS width (vw)
    const noseVw = () => P.x + planeW * 0.96;          // nose sits at ~96% of the image width

    const sync = () => {
      const vw = window.innerWidth / 100, vh = window.innerHeight / 100;
      plane.style.transform = `translate3d(${(P.x * vw).toFixed(1)}px, calc(-50% + ${(P.y * vh).toFixed(1)}px), 0) rotate(${P.r.toFixed(2)}deg) scale(${P.s.toFixed(3)})`;
      const cx = Math.max(-12, noseVw() - 4) * vw;     // cover's notch trails the nose slightly
      cover.style.transform = `translate3d(${cx.toFixed(1)}px, 0, 0)`;
      sky.__skyX = cx;
      updateSky();
    };

    const tl = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: sync });
    tl.fromTo(P, { x: -60, y: 6, r: -4, s: 0.94 }, { x: mobile ? 115 : 44, y: 0, r: 0, s: 1, duration: 3, ease: 'power2.out', immediateRender: false }, 0)
      .fromTo(list, { y: () => window.innerHeight * 0.35 }, { y: () => -(list.scrollHeight - window.innerHeight * 0.9), duration: 7, immediateRender: false }, 1.2)
      .fromTo(P, { x: mobile ? 115 : 44, y: 0 }, { x: mobile ? 118 : 47, y: -3, duration: 6.2, ease: 'sine.inOut', immediateRender: false }, 3)
      .fromTo(P, { x: mobile ? 118 : 47, y: -3, r: 0, s: 1 }, { x: 120, y: -22, r: -6, s: 0.92, duration: 2, ease: 'power2.in', immediateRender: false }, 9.2);

    ScrollTrigger.create({
      trigger: q('.testi-scroll'),
      start: 'top top',
      end: 'bottom bottom',
      scrub: bp.isDesktop() ? 0.6 : true,
      animation: tl,
      invalidateOnRefresh: true,
      onRefresh: sync,
    });
    tl.progress(0.0001).progress(0);
    sync();
  }

  destroy() {}
}

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, bp } from '../core/helpers.js';
import { portrait, cloudBank } from '../core/art2.js';

/**
 * A 3D jet crosses the sky; the white sheet opens behind its nose (chevron
 * clip follows the plane), the jet settles at the right and the client
 * stories scroll up beneath it, then it flies off.
 */
export class Testi {
  constructor(root = $('.home-testi')) {
    this.root = root;
  }

  async init() {
    const root = this.root;
    if (!root) return;
    const q = (s) => $(s, root);
    $$('.testi-photo', root).forEach((el) => (el.innerHTML = portrait(+el.dataset.face)));
    q('.testi-sky').style.setProperty('--clouds', cloudBank());

    const { PlaneScene } = await import('../webgl/PlaneScene.js');
    if (this.dead) return;
    try {
      this.plane = new PlaneScene(q('.testi-plane'));
      this.plane.init();
    } catch (err) {
      console.warn('Plane disabled:', err);
    }
    this.build();
    ScrollTrigger.refresh();
  }

  build() {
    const root = this.root;
    const q = (s) => $(s, root);
    const list = q('.testi-list');
    const P = this.plane?.state || {};
    const mobile = bp.isMobile();
    // plane x in world units: screen spans ±11; nose sits ~5 units ahead of centre
    const noseToWipe = () => {
      const span = this.plane?.span || 22;
      return ((P.x + 5 * (P.scale || 1)) / span + 0.5) * 100 - 4;   // vw of the nose, minus the chevron depth
    };

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: () => sync(),
    });
    const sync = () => {
      this.plane?.apply();
      root.style.setProperty('--wipe', wipeAt(tl.time()).toFixed(2));
    };
    Object.assign(P, { x: -24, z: mobile ? -2 : 0.5, scale: mobile ? 0.55 : 1, bank: 0.12, yaw: 0.04 });

    const noseVw = (x) => ((x + 5 * (P.scale || 1)) / 22 + 0.5) * 100 - 4;
    const x0 = -24, x1 = mobile ? 16 : 6.5, x2 = mobile ? 17 : 7.5, z0 = P.z, z1 = mobile ? -1.5 : 0.2;
    tl.fromTo(P, { x: x0, bank: 0.12, yaw: 0.04 }, { x: x1, bank: 0, yaw: 0, duration: 3, ease: 'power2.out', immediateRender: false }, 0)
      // content scrolls under the parked plane
      .fromTo(list, { y: () => window.innerHeight * 0.35 }, { y: () => -(list.scrollHeight - window.innerHeight * 0.9), duration: 7 }, 1.2)
      .fromTo(P, { x: x1, z: z0 }, { x: x2, z: z1, duration: 6.2, ease: 'sine.inOut', immediateRender: false }, 3)
      // fly off
      .fromTo(P, { x: x2, bank: 0 }, { x: 34, bank: -0.1, duration: 2, ease: 'power2.in', immediateRender: false }, 9.2);
    // wipe edge follows the nose, computed from time so it can never drift
    const out = gsap.parseEase('power2.out'), inn = gsap.parseEase('power2.in');
    const lerp = (a, b, k) => a + (b - a) * k;
    function wipeAt(t) {
      if (t < 3) return lerp(noseVw(x0), noseVw(x1), out(t / 3));
      if (t < 9.2) return Math.max(noseVw(x1), 101);
      return lerp(Math.max(noseVw(x1), 101), noseVw(34), inn(Math.min(1, (t - 9.2) / 2)));
    }

    ScrollTrigger.create({
      trigger: q('.testi-scroll'),
      start: 'top top',
      end: 'bottom bottom',
      scrub: bp.isDesktop() ? 0.8 : true,
      animation: tl,
      invalidateOnRefresh: true,
      onRefresh: () => sync(),
    });
    tl.progress(0.0001).progress(0);
    sync();
    this.tl = tl;
  }

  destroy() {
    this.dead = true;
    this.plane?.destroy();
  }
}

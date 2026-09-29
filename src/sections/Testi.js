import { gsap } from 'gsap';
import { $, $$, bp } from '../core/helpers.js';
import { fill, fadeUp, line, revealGroup } from '../core/reveal.js';
import { topPlane } from '../core/art2.js';

/**
 * One CSS variable (--overlap-clip) drives both the plane's x and the chevron
 * clip-path of the blue content — the wipe follows the plane's nose.
 */
export class Testi {
  constructor(root = $('.home-testi')) {
    this.root = root;
  }

  init() {
    const root = this.root;
    if (!root) return;
    const q = (s) => $(s, root);
    const plane = topPlane();
    q('.testi-plane-inner').innerHTML = plane;
    q('.testi-plane-shadow').innerHTML = plane;

    const mobile = bp.isMobile();
    const tablet = bp.isTablet();

    if (mobile) {
      gsap.set([q('.testi-plane-inner'), q('.testi-plane-shadow')], { rotation: -90 });
      gsap.timeline({ scrollTrigger: { trigger: root, start: 'top bottom', end: 'top+=60% top', scrub: true } })
        .fromTo(q('.testi-plane'), { y: 0 }, { y: '-120vh', ease: 'none' }, 0)
        .fromTo(root, { '--clip-top': '100%', '--pos-x': -7, '--scale': 1.1 }, { '--clip-top': '0%', '--pos-x': 3, '--scale': 0.7, ease: 'none' }, 0);
    } else {
      const from = -60;
      const to = 180;
      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root, start: () => `top+=${innerHeight * 0.2} top`, end: () => `top+=${innerHeight * 2.2} top`, scrub: true, fastScrollEnd: true, invalidateOnRefresh: true,
          onUpdate: (st) => (root.dataset.section = st.progress > 0.45 ? 'dark' : 'light'),
        },
      })
        .fromTo(root, { '--overlap-clip': from, '--pos-x': -5, '--pos-y': 0, '--scale': 0.9 }, { '--overlap-clip': to, '--pos-x': 3, '--pos-y': 2, '--scale': 0.5 }, 0)
        .fromTo(q('.testi-plane-inner'), { scale: tablet ? 1.5 : 1 }, { scale: 1.3 }, 0);

      // previous section's cloud wall lifts away as the plane arrives
      const prev = $('.why-main');
      if (prev) gsap.to(prev, { yPercent: -8, opacity: 0.6, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'top top', scrub: true } });
    }

    revealGroup({
      trigger: q('.testi-wrap'),
      start: mobile ? 'top 80%' : 'top top+=60%',
      items: [
        line(q('.testi-head .label-line')),
        fill(q('.testi-head .label span:last-child'), { at: 0 }),
        fill(q('.testi-title'), { at: 0.1 }),
        fill(q('.testi-desc'), { at: 0.3 }),
        fadeUp($$('.testi-item', root), { at: 0.4 }),
      ],
    });
  }
}

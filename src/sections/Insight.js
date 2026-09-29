import { gsap } from 'gsap';
import { $, $$, bp, isTouch, clamp } from '../core/helpers.js';
import { fill, fadeUp, line, revealGroup } from '../core/reveal.js';
import { insightCover } from '../core/art2.js';
import { smooth } from '../core/lenis.js';

export class Insight {
  constructor(root = $('.home-ins')) {
    this.root = root;
  }

  init() {
    const root = this.root;
    if (!root) return;
    const q = (s) => $(s, root);

    const thumbs = $$('.ins-thumb', root);
    thumbs.forEach((t) => (t.innerHTML = insightCover(+t.dataset.cover)));

    // hover list ↔ preview
    const items = $$('.ins-item', root);
    const setActive = (i) => {
      items.forEach((it, k) => it.classList.toggle('active', k === i));
      thumbs.forEach((t, k) => t.classList.toggle('active', k === i));
    };
    items.forEach((it, i) => {
      it.addEventListener('mouseenter', () => setActive(i));
      it.addEventListener('focus', () => setActive(i));
    });

    if (bp.isDesktop() && !isTouch()) this.followCursor(q('.ins-main'), q('.ins-preview'));

    revealGroup({
      trigger: q('.ins-head'),
      items: [
        line(q('.ins-head .label-line')),
        fill(q('.ins-head .label span:last-child'), { at: 0 }),
        fill(q('.ins-title'), { at: 0.1 }),
        fill(q('.ins-desc'), { at: 0.3 }),
        fadeUp(q('.ins-action'), { at: 0.5 }),
      ],
    });
    revealGroup({ trigger: q('.ins-main'), items: [fadeUp(items, {}), fadeUp(q('.ins-preview'), { at: 0.2 })], stagger: 0.08 });
  }

  destroy() {
    if (this.onScroll) smooth.off('scroll', this.onScroll);
  }

  /** preview panel eases toward the pointer inside its column */
  followCursor(wrap, el) {
    const setY = gsap.quickSetter(el, 'y', 'px');
    let y = 0, target = 0, mouseY = 0, inside = false, running = false;

    const update = () => {
      const r = wrap.getBoundingClientRect();
      const h = el.offsetHeight;
      target = inside ? clamp(mouseY - r.top - h / 2, 0, r.height - h) : target;
    };
    const tick = () => {
      update();
      y += (target - y) * 0.25;
      setY(y);
      if (!inside && Math.abs(target - y) < 0.3) { gsap.ticker.remove(tick); running = false; }
    };
    const start = () => { if (!running) { running = true; gsap.ticker.add(tick); } };

    wrap.addEventListener('mouseenter', () => { inside = true; start(); });
    wrap.addEventListener('mouseleave', () => { inside = false; });
    wrap.addEventListener('mousemove', (e) => { mouseY = e.clientY; start(); });
    this.onScroll = () => inside && start();
    smooth.on('scroll', this.onScroll);
  }
}

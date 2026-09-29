import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, debounce } from '../core/helpers.js';
import { fill, fadeUp, line, revealGroup } from '../core/reveal.js';
import { smooth } from '../core/lenis.js';

export class Faq {
  constructor(root = $('.home-faq')) {
    this.root = root;
  }

  init() {
    const root = this.root;
    if (!root) return;
    const q = (s) => $(s, root);
    const items = $$('.faq-item', root);

    // page height changes → keep lenis + triggers in sync
    const refresh = debounce(() => { smooth.lenis?.resize(); ScrollTrigger.refresh(true); }, 200);

    const toggle = (item, open) => {
      const ans = $('.faq-a', item);
      item.classList.toggle('active', open);
      $('.faq-q', item).setAttribute('aria-expanded', String(open));
      gsap.to(ans, { height: open ? 'auto' : 0, duration: 0.5, ease: 'power2.inOut', onComplete: refresh });
    };

    items.forEach((item) => {
      $('.faq-q', item).addEventListener('click', () => {
        const open = !item.classList.contains('active');
        items.forEach((o) => o !== item && o.classList.contains('active') && toggle(o, false));
        toggle(item, open);
      });
    });

    revealGroup({
      trigger: q('.faq-side'),
      items: [
        line(q('.faq-side .label-line')),
        fill(q('.faq-side .label span:last-child'), { at: 0 }),
        fill(q('.faq-heading'), { at: 0.1 }),
        fill(q('.faq-sub'), { at: 0.3 }),
        fadeUp(q('.faq-mail'), { at: 0.4 }),
      ],
    });
    revealGroup({ trigger: q('.faq-list'), stagger: 0.06, items: [fadeUp(items, { y: 2 })] });
  }
}

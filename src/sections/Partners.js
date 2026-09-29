import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, bp, debounce } from '../core/helpers.js';
import { fill, revealGroup } from '../core/reveal.js';
import { partnerLogo } from '../core/art2.js';

export class Partners {
  constructor(root = $('.home-partners')) {
    this.root = root;
  }

  init() {
    const root = this.root;
    if (!root) return;

    $$('.partners-item[data-logo]', root).forEach((item) => {
      const [kind, i] = item.dataset.logo.split(':');
      const { svg, color } = partnerLogo(item.dataset.name, +i, kind);
      $('.partners-logo', item).innerHTML = svg;
      item.style.setProperty('--logo-color', color);
    });

    this.pad();
    this.onResize = debounce(() => this.pad(), 200);
    window.addEventListener('resize', this.onResize);

    $$('.partners-block', root).forEach((block) =>
      revealGroup({ trigger: block, items: [fill($('.partners-label .txt-anim', block)), fill($('.partners-cate', block), { at: 0.15 })] })
    );

    const items = $$('.partners-item', root);
    gsap.set(items, { autoAlpha: 0 });
    ScrollTrigger.batch(items, {
      start: 'top 85%',
      once: true,
      batchMax: bp.isDesktop() ? 5 : bp.isMobile() ? 2 : 4,
      onEnter: (batch) =>
        batch.forEach((el, i) =>
          gsap.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', delay: i * 0.15 })
        ),
    });
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
  }

  /** fill the last row with empty cells so the grid always closes */
  pad() {
    const cols = bp.isDesktop() ? 5 : bp.isMobile() ? 2 : 4;
    $$('.partners-list', this.root).forEach((list) => {
      $$('[data-partners-placeholder]', list).forEach((e) => e.remove());
      const n = list.children.length;
      const extra = (cols - (n % cols)) % cols;
      for (let i = 0; i < extra; i++) {
        const cell = document.createElement('div');
        cell.className = 'partners-item is-empty';
        cell.dataset.partnersPlaceholder = '';
        list.appendChild(cell);
      }
    });
  }
}

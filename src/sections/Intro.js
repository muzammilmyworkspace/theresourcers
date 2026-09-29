import { $, $$, bp } from '../core/helpers.js';
import { fill, fadeUp, line, clip, revealGroup, countUp } from '../core/reveal.js';
import { containerYard } from '../core/art.js';

export class Intro {
  constructor(root = $('.home-intro')) {
    this.root = root;
  }

  init() {
    const root = this.root;
    const q = (s) => $(s, root);

    const art = q('[data-art="yard"]');
    if (art) art.innerHTML = containerYard({ width: 800, height: 920, seed: 11 });

    revealGroup({
      trigger: q('.home-intro-top'),
      items: [
        line(q('.home-intro-label-line')),
        fill(q('.home-intro-label .txt-anim'), { at: 0 }),
        fill(q('.home-intro-title'), { at: 0.1 }),
      ],
    });

    revealGroup({
      trigger: q('.home-intro-main'),
      start: 'top 80%',
      stagger: 0.08,
      items: [
        clip(q('.home-intro-thumb')),
        fadeUp(q('.home-intro-thumb-tag'), { y: 1, at: 0.6 }),
        fill($$('.home-intro-desc', root), { at: 0.15 }),
        fadeUp(q('.home-intro-btn'), { at: 0.5 }),
      ],
    });

    revealGroup({ trigger: q('.home-intro-stats'), items: [fill(q('.home-intro-stats-label .txt-anim'))] });

    const stagger = bp.isMobile() ? 0 : 0.15;
    $$('.home-intro-stats-item', root).forEach((item, i) => {
      revealGroup({
        trigger: item,
        items: [
          line($('.home-intro-stats-item-line', item), { at: i * stagger }),
          fadeUp($('.home-intro-stats-num', item), { y: 1, at: i * stagger + 0.1 }),
          fill($('.home-intro-stats-item-desc .txt-anim', item), { at: i * stagger + 0.25 }),
        ],
      });
      countUp($('[data-count]', item), { trigger: item, duration: 1.2 });
    });
  }
}

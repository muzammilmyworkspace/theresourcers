import { $, $$ } from '../core/helpers.js';
import { fill, fadeUp, line, clip, revealGroup, countUp } from '../core/reveal.js';

export class Intro {
  constructor(root = $('.home-intro')) {
    this.root = root;
  }

  init() {
    const root = this.root;
    const q = (s) => $(s, root);

    revealGroup({
      trigger: q('.home-intro-grid'),
      start: 'top 70%',
      items: [
        fill(q('.home-intro-title')),
        clip(q('.home-intro-thumb'), { radius: 0, at: 0.2 }),
        fadeUp(q('.home-intro-cap'), { y: 1, at: 0.9 }),
        fill($$('.home-intro-desc', root), { at: 0.25 }),
        fadeUp(q('.home-intro-btn'), { at: 0.7 }),
        fill(q('.home-intro-stats-label .txt-anim'), { at: 0.6 }),
      ],
    });

    $$('.home-intro-stats-item', root).forEach((item, i) => {
      revealGroup({
        trigger: q('.home-intro-stats'),
        start: 'top 90%',
        items: [
          fadeUp($('.home-intro-stats-num', item), { y: 2, at: i * 0.12 }),
          fill($('.home-intro-stats-item-desc .txt-anim', item), { at: 0.2 + i * 0.12 }),
          line($('.home-intro-stats-item-line', item), { at: 0.3 + i * 0.12 }),
        ],
      });
      countUp($('[data-count]', item), { trigger: q('.home-intro-stats'), start: 'top 90%', duration: 1.4 });
    });
  }
}

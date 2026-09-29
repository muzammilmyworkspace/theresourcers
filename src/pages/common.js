import { $, $$ } from '../core/helpers.js';
import { fill, fadeUp, line, clip, revealGroup, countUp } from '../core/reveal.js';
import { containerYard } from '../core/art.js';
import { insightCover } from '../core/art2.js';

const MAKERS = {
  fill: (el) => fill(el),
  fade: (el) => fadeUp(el, { y: 2.4 }),
  line: (el) => line(el),
  clip: (el) => clip(el),
};

/**
 * Declarative reveals for inner pages:
 *   <div data-reveal-group> … <h2 data-reveal="fill"> … <p data-reveal="fade"> …
 * Each group plays once when it reaches 85% of the viewport.
 */
export function initGenericReveals(container) {
  $$('[data-reveal-group]', container).forEach((group) => {
    const items = $$('[data-reveal]', group)
      .filter((el) => el.closest('[data-reveal-group]') === group)
      .map((el) => MAKERS[el.dataset.reveal]?.(el))
      .filter(Boolean);
    if (items.length) revealGroup({ trigger: group, items, stagger: 0.08, allowMobile: true });
  });
  $$('.pg-stat [data-count]', container).forEach((el) => countUp(el, { trigger: el.closest('.pg-stat'), duration: 1.2 }));
}

/** code-generated art for [data-art] / [data-cover] slots on inner pages */
export function injectArt(container) {
  $$('.pg-art[data-art="yard"]', container).forEach((el) => {
    el.innerHTML = containerYard({ width: 1600, height: 800, seed: +(el.dataset.seed || 7) });
  });
  $$('.pg-art[data-cover]', container).forEach((el) => (el.innerHTML = insightCover(+el.dataset.cover)));
}

export { $ };

import { smooth } from './lenis.js';
import { $$ } from './helpers.js';
import { cloudBank } from './art2.js';

/**
 * One sky shared by the end of "Why" and the start of "Testimonials".
 * Each .sky-anchor is counter-translated so it stays fixed to the viewport:
 * the two copies line up pixel-perfect across the section boundary
 * (transform only — nothing repaints while scrolling).
 */
let items = [];
let bound = false;

function update() {
  const vh = window.innerHeight;
  for (const it of items) {
    const r = it.stage.getBoundingClientRect();
    if (r.bottom < -50 || r.top > vh + 50) continue;
    const x = it.el.__skyX || 0;
    it.el.style.transform = `translate3d(${(-x).toFixed(1)}px, ${(-r.top).toFixed(1)}px, 0)`;
  }
}

export function initSky(root = document) {
  document.documentElement.style.setProperty('--sky-clouds', cloudBank());
  items = $$('.sky-anchor', root).map((el) => ({ el, stage: el.closest('.why-stage, .testi-stage') })).filter((i) => i.stage);
  if (!bound) {
    bound = true;
    smooth.on('scroll', update);
    window.addEventListener('resize', update);
  }
  update();
  return update;
}

export const updateSky = () => update();

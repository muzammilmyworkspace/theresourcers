import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitLines } from './splitLines.js';
import { rem } from './helpers.js';

/* ----------------------------------------------------------
   Reveal primitives. Each returns item(s) { el, init(), add(tl, pos) }
   `init` applies the hidden state lazily, `add` pushes the tween.
   ---------------------------------------------------------- */

const many = (target, make) => {
  if (!target) return [];
  if (typeof target === 'string') target = document.querySelectorAll(target);
  if (target instanceof Element) return [make(target)];
  return [...target].map(make);
};

/** Line-by-line "ink" fill with a brand-coloured leading edge */
/* two-tone headings: each .tone child fills separately so it keeps its colour */
const expandTones = (target) => {
  if (!target) return [];
  if (typeof target === 'string') target = document.querySelectorAll(target);
  const list = target instanceof Element ? [target] : [...target];
  return list.flatMap((el) => {
    const tones = [...el.children].filter((c) => c.classList.contains('tone'));
    return tones.length ? tones : [el];
  });
};

export const fill = (target, { revert = true, at } = {}) =>
  many(expandTones(target), (el) => {
    let split = null;
    return {
      el, at,
      init() {
        if (split) return;
        const color = getComputedStyle(el).color;
        split = splitLines(el);
        split.lines.forEach((l) => {
          l.style.setProperty('--color-final', color);
          l.style.setProperty('--bg-progress', '30');
        });
      },
      add(tl, pos) {
        tl.to(split.lines, {
          '--bg-progress': 100,
          duration: 1.2,
          stagger: 0.1,
          ease: 'power1.inOut',
          onComplete: () => revert && split.revert(),
        }, pos);
      },
    };
  });

/** Fade + rise. `y` in design rem (3.2 = 32 design px) */
export const fadeUp = (target, { y = 3.2, x = 0, duration = 1, at } = {}) =>
  many(target, (el) => ({
    el, at,
    init() { gsap.set(el, { autoAlpha: 0, y: rem(y), x: rem(x) }); },
    add(tl, pos) {
      tl.to(el, { autoAlpha: 1, y: 0, x: 0, duration, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, pos);
    },
  }));

/** 1px line drawing from the left */
export const line = (target, { at, origin = 'left center' } = {}) =>
  many(target, (el) => ({
    el, at,
    init() { gsap.set(el, { scaleX: 0, transformOrigin: origin }); },
    add(tl, pos) { tl.to(el, { scaleX: 1, duration: 1.2, ease: 'power1.out' }, pos); },
  }));

/** Image clip-path inset reveal with inner zoom */
export const clip = (target, { at, radius } = {}) =>
  many(target, (el) => {
    const img = el.querySelector('img, video, canvas, svg, .clip-inner');
    const r = radius ?? (parseFloat(getComputedStyle(el).borderRadius) || 0);
    return {
      el, at,
      init() {
        gsap.set(el, { clipPath: `inset(20% round ${r}px)` });
        if (img) gsap.set(img, { scale: 1.4, autoAlpha: 0 });
      },
      add(tl, pos) {
        tl.to(el, { clipPath: `inset(0% round ${r}px)`, duration: 2, ease: 'expo.out' }, pos);
        if (img) tl.to(img, { scale: 1, autoAlpha: 1, duration: 2, ease: 'expo.out' }, '<');
      },
    };
  });

/**
 * A group of reveals on one trigger.
 *  - hidden state applied one viewport early (lazy)
 *  - plays once at `start`
 *  - items overlap by `stagger`; an item's `at` = absolute position
 */
export function revealGroup({ trigger, items, start = 'top 85%', stagger = 0.1, paused = false, onComplete } = {}) {
  items = items.flat().filter(Boolean);
  const tl = gsap.timeline({ paused: true, onComplete });
  const triggers = [];
  let built = false;

  const build = () => {
    if (built) return;
    built = true;
    items.forEach((i) => i.init());
    items.forEach((i, idx) => i.add(tl, i.at !== undefined ? i.at : idx === 0 ? 0 : `<${stagger}`));
  };

  if (paused || !trigger) {
    build();
  } else {
    triggers.push(
      ScrollTrigger.create({ trigger, start: 'top bottom+=100%', once: true, onEnter: build }),
      ScrollTrigger.create({
        trigger, start, once: true,
        onEnter: () => { build(); tl.play(); },
      })
    );
  }

  return {
    tl,
    build,
    play: () => { build(); return tl.play(); },
    kill: () => { triggers.forEach((t) => t.kill()); tl.kill(); },
  };
}

/** Count-up for [data-count] — keeps commas / one decimal like the source text */
export function countUp(el, { trigger, start = 'top 85%', duration = 1 } = {}) {
  const raw = (el.dataset.count || el.textContent).trim();
  const target = parseFloat(raw.replace(/,/g, ''));
  const hasComma = raw.includes(',');
  const hasDot = raw.includes('.');
  const format = (v) => (hasComma ? Math.round(v).toLocaleString('en-US') : hasDot ? v.toFixed(1) : String(Math.round(v)));
  const obj = { v: 0 };
  el.textContent = format(0);
  return ScrollTrigger.create({
    trigger: trigger || el, start, once: true,
    onEnter: () => gsap.to(obj, { v: target, duration, ease: 'power1.out', onUpdate: () => (el.textContent = format(obj.v)) }),
  });
}

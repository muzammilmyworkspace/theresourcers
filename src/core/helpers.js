export const $ = (sel, parent = document) => parent.querySelector(sel);
export const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

export const rootSize = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 10;
/** CSS rem → px (fluid root size) */
export const rem = (n) => n * rootSize();
export const vh = (n) => (n / 100) * window.innerHeight;
export const vw = (n) => (n / 100) * window.innerWidth;

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const random = (min, max) => min + Math.random() * (max - min);

export const debounce = (fn, ms = 200) => {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
};

export const bp = {
  get w() { return window.innerWidth; },
  isMobile: () => window.innerWidth <= 767,
  isTablet: () => window.innerWidth > 767 && window.innerWidth <= 991,
  isDesktop: () => window.innerWidth > 991,
};

export const isTouch = () =>
  window.matchMedia('(hover: none), (pointer: coarse)').matches || navigator.maxTouchPoints > 0 && !window.matchMedia('(pointer: fine)').matches;

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const breakpointIndex = (w = window.innerWidth) =>
  w <= 479 ? 0 : w <= 767 ? 1 : w <= 991 ? 2 : 3;

import { gsap } from 'gsap';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import { $, $$ } from '../core/helpers.js';
import { cursor } from '../core/cursor.js';
import { initGenericReveals, injectArt } from './common.js';

/* ---------------- about ---------------- */
export function initAbout(container) {
  injectArt(container);
  initGenericReveals(container);

  const el = $('.pg-timeline-slider', container);
  let swiper = null;
  if (el) {
    const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--container-pad')) * parseFloat(getComputedStyle(document.documentElement).fontSize) || 32;
    swiper = new Swiper(el, {
      modules: [Navigation],
      slidesPerView: 'auto',
      slidesOffsetBefore: pad,
      slidesOffsetAfter: pad,
      speed: 700,
      grabCursor: false,
      navigation: { prevEl: $('.pg-tl-btn.prev', container), nextEl: $('.pg-tl-btn.next', container) },
    });
    el.swiper = swiper;
    cursor.bindControl(el, swiper);
  }
  return { destroy: () => swiper?.destroy(true, true) };
}

/* ---------------- services ---------------- */
export function initServices(container) {
  injectArt(container);
  initGenericReveals(container);
  return {};
}

/* ---------------- contact ---------------- */
export function initContact(container) {
  initGenericReveals(container);
  return {};
}

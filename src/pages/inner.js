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
  const form = $('.pg-form', container);
  if (!form) return {};

  const fields = $$('.field', form);
  const check = (field) => {
    const input = $('input, select, textarea', field);
    let ok = input.checkValidity();
    if (input.type === 'email' && input.value) ok = ok && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
    field.classList.toggle('has-error', !ok);
    return ok;
  };
  fields.forEach((f) => {
    const input = $('input, select, textarea', f);
    input.addEventListener('blur', () => f.classList.contains('has-error') && check(f));
    input.addEventListener('input', () => f.classList.contains('has-error') && check(f));
    input.addEventListener('change', () => f.classList.contains('has-error') && check(f));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = fields.filter((f) => !check(f));
    if (bad.length) {
      $('input, select, textarea', bad[0]).focus();
      gsap.fromTo(bad[0], { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      return;
    }
    const btn = $('.pg-form-submit', form);
    btn.disabled = true;
    btn.firstChild.textContent = 'Sending… ';
    // No backend yet — connect this to your form service / API endpoint.
    setTimeout(() => {
      gsap.fromTo($('.pg-form-success', form), { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power3.out' });
      gsap.from($$('.pg-form-success > *', form), { y: 20, autoAlpha: 0, duration: 0.6, stagger: 0.08, delay: 0.15, ease: 'power3.out' });
    }, 900);
  });
  return {};
}

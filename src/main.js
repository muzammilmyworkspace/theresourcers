import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import barba from '@barba/core';

import './styles/tokens.css';
import './styles/base.css';
import './styles/loader.css';
import './styles/cursor.css';
import './styles/header.css';
import './styles/home.css';
import './styles/service.css';
import './styles/why.css';
import './styles/sections.css';
import './styles/pages.css';

import { $, breakpointIndex, debounce } from './core/helpers.js';
import { smooth } from './core/lenis.js';
import { cursor } from './core/cursor.js';
import { header } from './core/header.js';
import { Loader } from './core/loader.js';
import { transition } from './core/transition.js';
import { initTextScramble } from './core/textScramble.js';
import { initWaves } from './core/waves.js';
import { initSky } from './core/sky.js';
import { initQuoteForms } from './core/quoteForm.js';
import { Hero } from './sections/Hero.js';
import { Intro } from './sections/Intro.js';
import { Service } from './sections/Service.js';
import { Why } from './sections/Why.js';
import { Testi } from './sections/Testi.js';
import { Partners } from './sections/Partners.js';
import { Insight } from './sections/Insight.js';
import { Faq } from './sections/Faq.js';
import { Footer, initCta } from './sections/Footer.js';
import { initAbout, initServices, initContact } from './pages/inner.js';

gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create('cinematicSilk', '0.45,0.05,0.55,0.95');
CustomEase.create('cinematicSmooth', '0.25,0.1,0.25,1');
CustomEase.create('fakeLoading', 'M0,0 L0.1,0.3 L0.35,0.4 L0.45,0.65 L0.6,0.7 L0.8,0.8 L0.85,0.95 L1,1');

/* reload when crossing a breakpoint — every layout has its own timelines */
const bpIndex = breakpointIndex();
window.addEventListener('resize', debounce(() => {
  if (breakpointIndex() !== bpIndex) location.reload();
}, 250));

/* ---------------- pages ---------------- */
function initHome() {
  const hero = new Hero();
  const sections = [hero, new Intro(), new Service(), new Why(), new Testi(), new Partners(), new Insight(), new Faq()];
  sections.forEach((s) => s.init());
  return {
    play: () => hero.play(),
    destroy: () => sections.forEach((s) => s.destroy?.()),
  };
}

const PAGES = { home: initHome, about: initAbout, services: initServices, contact: initContact };
let page = null;

function mount(container) {
  const ns = container.dataset.barbaNamespace;
  page = (PAGES[ns] || (() => ({})))(container) || {};
  initCta($('.home-cta', container));
  initTextScramble(container);
  initWaves(container);
  initSky(container);
  initQuoteForms(container);
}

function unmount() {
  page?.destroy?.();
  page = null;
}

/* kill every trigger whose element left the DOM (old page) */
function sweepTriggers() {
  ScrollTrigger.getAll().forEach((t) => {
    if (t.trigger && !document.documentElement.contains(t.trigger)) t.kill();
  });
}

function scrollToHash() {
  const id = location.hash.slice(1);
  const el = id && document.getElementById(id);
  if (el) smooth.scrollTo(el, { offset: -40, duration: 1.4 });
}

function initRouter() {
  transition.init();
  barba.init({
    preventRunning: true,
    timeout: 5000,
    prevent: ({ el, href }) => el?.hasAttribute('data-no-barba') || /^mailto:|^tel:/.test(href || ''),
    transitions: [{
      name: 'circle',
      async leave() {
        if (cursor.enabled) { cursor.current = null; cursor.reset(); }
        await transition.cover();
        smooth.stop();
        unmount();
      },
      async enter({ current, next }) {
        current?.container?.remove();
        sweepTriggers();
        window.scrollTo(0, 0);
        smooth.scrollToTop();
        smooth.start();
        mount(next.container);
        header.onScroll?.();
        requestAnimationFrame(() => ScrollTrigger.refresh(true));
        await transition.reveal();
        page?.play?.();
        scrollToHash();
      },
    }],
  });
  barba.hooks.after(() => {
    if (typeof window.gtag === 'function') window.gtag('event', 'page_view', { page_path: location.pathname });
  });
}

/* ---------------- boot ---------------- */
async function boot() {
  await document.fonts.ready;
  smooth.init();
  cursor.init();
  header.init();
  initTextScramble(document.querySelector('.header'));
  new Footer().init();
  initWaves(document.querySelector('.footer'));

  mount($('[data-barba="container"]'));
  initRouter();

  const loader = new Loader({
    onPagePlay: () => {
      ScrollTrigger.refresh();
      page?.play?.();
      scrollToHash();
    },
  });
  await loader.run();
}

boot();

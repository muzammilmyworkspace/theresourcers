import { gsap } from 'gsap';
import { $, $$, bp, rem, random } from './helpers.js';
import { getLandMask, HUBS } from './landMask.js';
import { smooth } from './lenis.js';

const SESSION_KEY = 'ts:isLoaded';

const storage = {
  get() { try { return sessionStorage.getItem(SESSION_KEY) === 'true'; } catch { return false; } },
  set() { try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch { /* private mode */ } },
};

/** Dotted world map as SVG (equirectangular, lat 76 → -56) */
function buildMap(svgWrap) {
  const land = getLandMask();
  const step = bp.isMobile() ? 3.4 : 2.6;
  const LAT_TOP = 76, LAT_BOT = -56;
  const W = 360, H = LAT_TOP - LAT_BOT;
  const r = step * 0.24;
  const hubKeys = new Set(
    HUBS.map((h) => `${Math.round((h.lng + 180) / step)}:${Math.round((LAT_TOP - h.lat) / step)}`)
  );
  let dots = '';
  for (let lat = LAT_TOP; lat >= LAT_BOT; lat -= step) {
    for (let lng = -180; lng < 180; lng += step) {
      if (!land.isLand(lat, lng)) continue;
      const x = lng + 180, y = LAT_TOP - lat;
      const key = `${Math.round(x / step)}:${Math.round(y / step)}`;
      const hot = hubKeys.has(key);
      dots += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(hot ? r * 1.6 : r).toFixed(2)}"${hot ? ' class="is-hot"' : ''}/>`;
    }
  }
  svgWrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${dots}</svg>`;
  return $$('circle', svgWrap);
}

export class Loader {
  constructor({ onPagePlay } = {}) {
    this.el = $('.loader');
    this.onPagePlay = onPagePlay;
    this.header = $('.header');
  }

  run() {
    return new Promise((resolve) => {
      if (!this.el) { this.onPagePlay?.(); resolve(); return; }
      this.resolve = resolve;
      history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
      smooth.stop();
      this.header?.classList.add('on-loader');

      const returning = storage.get();
      this.el.classList.add(returning ? 'is-short' : 'is-full');
      returning ? this.shortIntro() : this.fullIntro();

      // tab hidden mid-load → make sure we don't get stuck
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') gsap.ticker.tick();
      });
    });
  }

  pagePlay() {
    if (this.played) return;
    this.played = true;
    smooth.start();
    storage.set();
    this.onPagePlay?.();
    setTimeout(() => this.header?.classList.remove('on-loader'), 550);
  }

  finish() {
    this.breathing?.forEach((t) => t.kill());
    this.el.classList.add('is-done');
    this.resolve?.();
  }

  /* ------------------------------------------------------------ */
  fullIntro() {
    const el = this.el;
    const mobile = bp.isMobile();
    const map = $('.loader-map', el);
    const dots = buildMap(map);
    const logo = $('.loader-logo', el);
    const progress = $('.loader-progress', el);
    const icon = $('.loader-progress-ic', el);
    const count = $('.loader-progress-count', el);
    const countTxt = $('.txt', count);
    const cols = $$('.loader-col', el);
    const lists = cols.map((c) => $('.loader-list', c));

    // clone items so both columns can roll 9 steps (18 items)
    lists.forEach((list) => {
      const src = $$('.loader-item', list);
      let i = 0;
      while (list.children.length < 18) list.appendChild(src[i++ % src.length].cloneNode(true));
    });
    const items = lists.map((l) => $$('.loader-item', l));
    const itemH = items[0][0].offsetHeight;
    const setActive = (i) => items.forEach((col) => col.forEach((it, k) => it.classList.toggle('is-active', k === i + 2)));

    gsap.set(items.flatMap((c) => c.slice(0, 9)), { yPercent: 100, opacity: 0 });
    gsap.set(dots, { scale: 0, transformOrigin: '50% 50%' });

    /* 1. first load */
    const tlFirst = gsap.timeline();
    tlFirst
      .to(mobile ? [logo, progress] : [map, logo, progress], { opacity: 1, duration: mobile ? 0.5 : 1, ease: mobile ? 'power1.out' : 'power3.inOut' }, 0)
      .to(icon, { rotation: '+=360', duration: 1, ease: 'none' }, 0)
      .to(dots, { scale: 1, duration: 0.5, ease: 'power2.out', stagger: { amount: 0.5, from: 'random' } }, 0.5);
    if (mobile) tlFirst.to(map, { opacity: 1, duration: 0.6 }, 0.2);

    /* 2. move: logo up, progress down, lists roll, counter runs */
    const edge = window.innerHeight / 2 - rem(mobile ? 9 : 7);
    const tlMove = gsap.timeline({
      onStart: () => {
        // breathing map — random subset so it stays light
        this.breathing = dots.filter((_, i) => i % 3 === 0).map((d) =>
          gsap.to(d, {
            scale: random(0.3, 0.7), opacity: random(0.2, 0.6),
            duration: random(1.5, 2.5), delay: random(0, 2),
            ease: 'sine.inOut', repeat: -1, yoyo: true,
          })
        );
      },
    });
    tlMove
      .to(logo, { y: -edge, duration: mobile ? 0.8 : 0.6, ease: 'power3.out' }, 0)
      .to(progress, { y: edge, duration: mobile ? 0.8 : 0.6, ease: 'power3.out' }, 0)
      .to(count, { opacity: 1, duration: 0.4 }, 0.2)
      .call(() => setActive(0), null, 0.6);
    items.forEach((col) =>
      tlMove.to(col.slice(0, 9), { yPercent: 0, opacity: 1, duration: 0.3, stagger: 0.2, ease: 'power2.out' }, mobile ? 0.4 : 0.2)
    );

    for (let i = 1; i <= 9; i++) {
      tlMove.to(lists, {
        y: -i * itemH, duration: 0.3, ease: 'power2.inOut',
        onStart: () => setActive(i),
        onReverseComplete: () => setActive(i - 1),
      }, '>+0.1');
    }

    const counter = { v: 0 };
    const countDur = tlMove.duration() - 0.4;
    tlMove
      .to(counter, {
        v: 100, duration: countDur, ease: 'fakeLoading',
        onUpdate: () => (countTxt.textContent = String(Math.round(counter.v)).padStart(2, '0')),
      }, 0.6)
      .to(icon, { rotation: '+=90', duration: 0.2, ease: 'power2.out' }, 0.4)
      .to(icon, { rotation: '+=1080', duration: countDur, ease: 'fakeLoading' }, 0.6);

    /* 3. end: meet in the middle, everything else leaves */
    const tlEnd = gsap.timeline();
    tlEnd
      .to([logo, progress], { y: 0, duration: 0.8, ease: 'power3.inOut' }, 0)
      .to([map, ...cols], { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 0.8);
    items.forEach((col) =>
      tlEnd.to(col.slice(9, 14), { yPercent: 100, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power3.inOut' }, 0)
    );

    const tlLoading = gsap.timeline({ paused: true })
      .add(tlFirst)
      .add(tlMove, '-=0.6')
      .add(tlEnd);

    const playDur = tlLoading.duration() * 0.8;
    const master = gsap.timeline({ delay: 0.2 });
    master
      .to(tlLoading, { time: tlLoading.duration(), duration: playDur, ease: 'none' })
      .to(el, { opacity: 0, duration: 0.5, ease: 'power2.inOut' })
      .call(() => this.pagePlay(), null, playDur + 0.5 - 1.0)
      .call(() => this.finish());
  }

  /* ------------------------------------------------------------ */
  shortIntro() {
    const el = this.el;
    const logo = $('.loader-page-logo', el);
    const circs = $$('.loader-circ', el);
    const masks = $$('.bg-mask', el).reverse(); // top-most (#000) opens first

    const tl = gsap.timeline({ delay: 0.1 });
    tl.fromTo(circs, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1, ease: 'back.out(2)', stagger: 0.08 }, 0)
      .fromTo(logo, { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }, 0.65)
      .to(logo, { scale: 0.8, opacity: 0, duration: 0.6, ease: 'circ.inOut' }, 1.3)
      .to(circs, { scale: 3, filter: 'blur(6px)', opacity: 0, duration: 0.6, ease: 'circ.inOut', stagger: { each: 0.1, from: 'end' } }, 1.3)
      .to(masks, { width: '135vmax', height: '135vmax', duration: 0.6, ease: 'circ.inOut', stagger: 0.18 }, 1.6)
      .call(() => this.pagePlay(), null, 1.7)
      .call(() => this.finish());
  }
}

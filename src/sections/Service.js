import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, bp, rem } from '../core/helpers.js';
import { fill, fadeUp, line, revealGroup } from '../core/reveal.js';
import { portScene, topTruck, PORT } from '../core/portArt.js';
import { smooth } from '../core/lenis.js';

const deg = (dist) => (dist / PORT.WHEEL_R) * (180 / Math.PI);

/**
 * One sticky 100vh stage, one scrubbed master timeline (30 units):
 *   0 – 9   crane picks the container off the ship and loads the truck
 *   9 – 20  truck drives: world pans, service cards scroll horizontally
 *  20 – 30  road goes dark, truck turns top-down, sub-services roll past
 * Mobile runs chapter one only; cards + sub-list stack below the stage.
 */
export class Service {
  state = {
    trolleyX: PORT.TROLLEY_START, hookY: PORT.HOOK_UP, sway: 0,
    truckX: -1300, wheel: 0, cam: 1, camY: 0, worldX: 0, dash: 0,
    sheenX: -900, topDash: 0,
  };

  constructor(root = $('.home-service')) {
    this.root = root;
  }

  init() {
    const root = this.root;
    if (!root) return;
    this.mobile = bp.isMobile();
    const q = (s) => $(s, root);

    q('[data-port-scene]').innerHTML = portScene();
    q('.svc-top-truck').innerHTML = topTruck();

    const svg = q('.svc-svg');
    if (this.mobile) {
      svg.setAttribute('viewBox', '560 150 760 760');
      svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');
      const mob = q('.svc-mobile');
      mob.dataset.section = 'dark';
      mob.append(q('.svc-track'), q('.svc-sub'));
    }

    this.el = {
      cam: q('.svc-cam'), world: q('.svc-world'),
      trolley: q('.svc-trolley'), swing: q('.svc-swing'), hook: q('.svc-hook'),
      cables: $$('.svc-cable', root),
      shipBox: q('.svc-shipbox'), hookBox: q('.svc-hookbox'), truckBox: q('.svc-truckbox'),
      truck: q('.svc-truck'), body: q('.svc-truck-body'),
      wheels: $$('.svc-wheel', root).map((w) => ({ el: w, cx: +w.dataset.cx, cy: +w.dataset.cy })),
      dash: q('.svc-road-dash'), sheen: q('.svc-sheen'),
      topRoad: q('.svc-top-road'),
    };
    gsap.set([this.el.hookBox, this.el.truckBox], { autoAlpha: 0 });
    this.render();

    revealGroup({
      trigger: root,
      start: 'top 60%',
      allowMobile: true,
      items: [
        line(q('.svc-head-label .label-line')),
        fill(q('.svc-head-label .txt-anim'), { at: 0 }),
        fill(q('.svc-head-title'), { at: 0.1 }),
        fill(q('.svc-head-desc'), { at: 0.3 }),
      ],
    });

    this.mobile ? this.buildMobile() : this.buildDesktop();
  }

  /* ---------------- per-frame SVG write ---------------- */
  render = () => {
    const s = this.state, e = this.el;
    e.trolley.setAttribute('transform', `translate(${s.trolleyX.toFixed(2)} 0)`);
    e.swing.setAttribute('transform', `rotate(${s.sway.toFixed(3)} 0 292)`);
    e.hook.setAttribute('transform', `translate(0 ${s.hookY.toFixed(2)})`);
    e.cables.forEach((c) => c.setAttribute('y2', s.hookY.toFixed(2)));
    e.truck.setAttribute('transform', `translate(${s.truckX.toFixed(2)} 0)`);
    e.body.setAttribute('transform', `translate(0 ${(Math.sin(s.wheel * 0.09) * 0.9).toFixed(2)})`);
    e.wheels.forEach((w) => w.el.setAttribute('transform', `rotate(${s.wheel.toFixed(1)} ${w.cx} ${w.cy})`));
    const ox = PORT.DROP_X, oy = PORT.ROAD_Y;
    e.cam.setAttribute('transform', `translate(${ox} ${oy + s.camY}) scale(${s.cam.toFixed(4)}) translate(${-ox} ${-oy})`);
    e.world.setAttribute('transform', `translate(${s.worldX.toFixed(1)} 0)`);
    e.dash.setAttribute('stroke-dashoffset', s.dash.toFixed(1));
    e.sheen.setAttribute('x', s.sheenX.toFixed(1));
    if (e.topRoad) e.topRoad.style.setProperty('--dash', `${s.topDash.toFixed(1)}px`);
  };

  /* ---------------- chapter one (shared) ---------------- */
  addCrane(tl) {
    const s = this.state, e = this.el;
    const truckIn = 1300;
    tl.to(s, { hookY: PORT.HOOK_PICK, duration: 1.5, ease: 'power1.inOut' }, 0)
      .set(e.shipBox, { autoAlpha: 0 }, 1.5)
      .set(e.hookBox, { autoAlpha: 1 }, 1.5)
      .to(s, { hookY: PORT.HOOK_UP, duration: 1.2, ease: 'power1.inOut' }, 1.6)
      .to(s, { truckX: 0, wheel: `+=${deg(truckIn)}`, duration: 3, ease: 'power2.out' }, 0.4)
      .to(s, { trolleyX: PORT.DROP_X, duration: 2.2, ease: 'sine.inOut' }, 2.8)
      .to(s, { keyframes: { sway: [0, -4.5, 3.2, -1.2, 0] }, duration: 2.6, ease: 'none' }, 2.8)
      .to(s, { hookY: PORT.HOOK_DROP, duration: 1.2, ease: 'power1.inOut' }, 5.0)
      .set(e.hookBox, { autoAlpha: 0 }, 6.2)
      .set(e.truckBox, { autoAlpha: 1 }, 6.2)
      .to(s, { hookY: 360, duration: 1, ease: 'power1.inOut' }, 6.3);
  }

  buildDesktop() {
    const root = this.root;
    const s = this.state;
    const q = (sel) => $(sel, root);
    const head = q('.svc-head'), track = q('.svc-track'), wordmark = q('.svc-wordmark');
    const cards = $$('.svc-card', track);
    const dark = q('.svc-dark'), topdown = q('.svc-topdown'), sub = q('.svc-sub');
    const topTruckEl = q('.svc-top-truck'), trailer = q('.svc-top-trailer');
    const list = q('.svc-sub-list'), listWrap = q('.svc-sub-list-wrap');
    const items = $$('.svc-sub-item', root);
    const speed = q('.svc-speed');

    const trackEnd = () => -(track.scrollWidth - window.innerWidth + rem(4));
    const listEnd = () => -(list.scrollHeight - listWrap.clientHeight * 0.45);
    const driveDist = 3600;

    gsap.set(topTruckEl, { rotation: 90, scale: 0.85 });
    gsap.set(track, { x: window.innerWidth });

    const tl = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: () => { this.render(); onFrame(); } });
    this.addCrane(tl);

    tl
      /* zoom out once the truck is loaded */
      .to(s, { cam: 0.62, camY: 40, duration: 1.7, ease: 'sine.inOut' }, 7.3)
      /* chapter two — drive + horizontal cards */
      .to(head, { autoAlpha: 0, y: -rem(4), duration: 0.8, ease: 'power2.in' }, 8.6)
      .set(track, { visibility: 'visible' }, 9)
      .to(s, { worldX: -driveDist, dash: -driveDist, wheel: `+=${deg(driveDist)}`, duration: 11, ease: 'power1.in' }, 9)
      .fromTo(track, { x: () => window.innerWidth }, { x: trackEnd, duration: 10, ease: 'none' }, 9.4)
      .fromTo(wordmark, { autoAlpha: 0, x: 0 }, { autoAlpha: 1, duration: 1 }, 9.4)
      .to(wordmark, { x: () => -wordmark.offsetWidth * 0.3, duration: 10 }, 9.4)
      /* chapter three — road takeover */
      .to(s, { sheenX: 2200, duration: 1.4, ease: 'power1.inOut' }, 19.6)
      .to(this.el.sheen, { opacity: 1, duration: 0.4 }, 19.6)
      .to([track, wordmark], { autoAlpha: 0, y: -rem(6), duration: 1, ease: 'power2.in' }, 19.8)
      .to(dark, { opacity: 1, duration: 1.4, ease: 'power1.inOut' }, 20.4)
      .to(topdown, { opacity: 1, duration: 1, ease: 'power1.out' }, 21.4)
      .to(topTruckEl, { rotation: 0, scale: 1, duration: 1.4, ease: 'power1.inOut' }, 22)
      .to(trailer, { keyframes: { rotation: [0, 12, -6, 0] }, svgOrigin: '60 120', duration: 1.6, ease: 'none' }, 22)
      .to(sub, { opacity: 1, duration: 1, ease: 'power1.out' }, 22.4)
      .fromTo(q('.svc-sub-head'), { y: rem(4) }, { y: 0, duration: 1, ease: 'power2.out' }, 22.4)
      .to(s, { topDash: 2400, duration: 7, ease: 'none' }, 23)
      .fromTo(list, { y: listWrap.clientHeight * 0.35 }, { y: listEnd, duration: 6.6, ease: 'none' }, 23.2)
      .to(topTruckEl, { keyframes: { x: [0, rem(1.2), -rem(0.8), 0] }, duration: 6.6, ease: 'sine.inOut' }, 23.2)
      .set({}, {}, 30);

    const center = () => {
      const wr = listWrap.getBoundingClientRect();
      const mid = wr.top + wr.height * 0.4;
      let best = null, bestD = Infinity;
      items.forEach((it) => {
        const r = it.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) { bestD = d; best = it; }
      });
      items.forEach((it) => it.classList.toggle('is-active', it === best));
    };

    function onFrame() {
        const t = tl.time();
        const vw = window.innerWidth;
        if (t > 9 && t < 20.5) cards.forEach((c) => {
          const left = c.getBoundingClientRect().left;
          c.classList.toggle('is-in', left < vw * 0.92);
        });
        speed.classList.toggle('active', t > 9 && t < 29.4);
        root.dataset.section = t > 21 ? 'dark' : 'light';
        sub.classList.toggle('is-live', t > 22.4);
        if (t > 22.4) center();
    }

    ScrollTrigger.create({
      trigger: q('.svc-scroll'),
      start: 'top top',
      end: 'bottom bottom',
      scrub: bp.isDesktop() ? 1 : true,
      animation: tl,
      invalidateOnRefresh: true,
    });

    this.initSpeedometer(speed);
  }

  buildMobile() {
    const root = this.root;
    const s = this.state;
    const tl = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: this.render });
    this.addCrane(tl);
    tl.to(s, { truckX: 900, wheel: `+=${deg(900)}`, dash: -900, duration: 1.4, ease: 'power2.in' }, 7.4)
      .set({}, {}, 8.8);

    ScrollTrigger.create({
      trigger: $('.svc-scroll', root),
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      animation: tl,
    });

    // stacked content below the stage
    const mob = $('.svc-mobile', root);
    ScrollTrigger.batch($$('.svc-card', mob), {
      start: 'top 90%',
      once: true,
      onEnter: (els) => els.forEach((c, i) => setTimeout(() => c.classList.add('is-in'), i * 120)),
    });
    revealGroup({
      trigger: $('.svc-sub-head', mob),
      allowMobile: true,
      items: [line($('.svc-sub-head .label-line', mob)), fill($('.svc-sub-heading', mob))],
    });
    $$('.svc-sub-item', mob).forEach((it) => revealGroup({ trigger: it, items: [fadeUp(it, { y: 2 })] }));
  }

  /* live km/h from real scroll velocity */
  initSpeedometer(wrap) {
    const out = $('[data-speed]', wrap);
    let last = smooth.scroll, lastT = performance.now(), cur = 0;
    this.speedTick = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastT) / 1000;
      lastT = now;
      const y = smooth.scroll;
      const v = Math.abs(y - last) / dt;
      last = y;
      let target = 0;
      if (wrap.classList.contains('active')) {
        target = v / 25;
        if (v > 500) target += Math.random() * 2 - 1;
        target = Math.min(target, 95);
      }
      const k = target === 0 ? 0.15 : target > cur ? 0.1 : 0.06;
      cur += (target - cur) * k;
      if (target === 0 && cur < 0.5) cur = 0;
      const txt = String(Math.max(0, Math.round(cur))).padStart(2, '0');
      if (txt !== out.textContent) out.textContent = txt;
    };
    gsap.ticker.add(this.speedTick);
  }

  destroy() {
    if (this.speedTick) gsap.ticker.remove(this.speedTick);
  }
}

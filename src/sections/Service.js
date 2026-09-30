import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { $, $$, bp } from '../core/helpers.js';
import { fill, fadeUp, revealGroup } from '../core/reveal.js';
import { smooth } from '../core/lenis.js';

gsap.registerPlugin(MotionPathPlugin);

/* measurements taken from /img/truck-side.webp (1301 × 383) */
const TRUCK = { w: 1301, h: 383, deck: 243, trailerFrom: 5, trailerTo: 918 };
const WHEELS = [[118, 322], [238, 322], [355, 322], [830, 325], [1158, 325]];
const WHEEL_R = 53;
const BOX = { w: 1290, h: 317 };

/**
 * Services scroll story, built from photographs (30 timeline units):
 *   0 – 6.8   an overhead spreader lifts the container off the stack; the truck
 *             drives in and the container is lowered onto the trailer
 *   6.8 – 15.8 zoom out, truck drives, services run horizontally in the black band
 *  15.8 – 30  top-down: the truck takes the bend and climbs the page
 */
export class Service {
  constructor(root = $('.home-service')) {
    this.root = root;
  }

  init() {
    const root = this.root;
    if (!root) return;
    this.mobile = bp.isMobile();
    const q = (s) => $(s, root);

    if (this.mobile) {
      const mob = q('.svc-mobile');
      mob.dataset.section = 'dark';
      mob.dataset.theme = 'dark';
      mob.append(q('.svc-track'), q('.svc-rel'));
    }

    this.el = {
      world: q('.svc-world'), boxes: $$('.svc-box', root), cargo: q('.svc-cargo'),
      rig: q('.svc-rig'), cables: $$('.svc-cable', root), spreader: q('.svc-spreader'),
      truck: q('.svc-truck'),
      roadTop: q('.svc-road-top'), roadSvg: q('.svc-road-svg'), roadPath: q('.svc-road-path'), roadDash: q('.svc-road-dash'),
      truckTop: q('.svc-truck-top'),
    };
    // rotating wheel sprites cut from the photo
    this.wheels = WHEELS.map(([cx, cy]) => {
      const w = document.createElement('span');
      w.className = 'svc-wheel';
      w.dataset.cx = cx; w.dataset.cy = cy;
      this.el.truck.appendChild(w);
      return w;
    });

    const imgs = $$('img', q('.svc-scene'));
    Promise.all(imgs.map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = r; i.onerror = r; })))).then(() => {
      if (this.dead) return;
      this.build();
      if (!this.mobile) this.initSpeedometer(q('.svc-speed'));
      this.buildReveals();
      ScrollTrigger.refresh();
    });
  }

  /* ---------------- geometry (px) ---------------- */
  layout() {
    const vw = window.innerWidth, vh = window.innerHeight, m = this.mobile;
    const TW = m ? vw * 1.35 : Math.min(vw * 0.64, vh * 1.7);
    const k = TW / TRUCK.w;
    const TH = TRUCK.h * k;
    const ground = vh * (m ? 0.74 : 0.86);
    const truckX = m ? vw * 0.5 - TW * 0.42 : vw * 0.04;
    const CW = (TRUCK.trailerTo - TRUCK.trailerFrom) * k * 0.985;
    const CH = CW * (BOX.h / BOX.w);
    const deckY = ground - TH + TRUCK.deck * k;
    const stackX = m ? vw * 0.62 : truckX + TW + vw * 0.02;
    return {
      vw, vh, TW, TH, k, ground, truckX, CW, CH, stackX,
      cargoEnd: { x: truckX + TRUCK.trailerFrom * k + CW * 0.0075, y: deckY - CH },
      cargoStart: { x: stackX, y: ground - CH * 3 },
      sH: Math.max(12, CH * 0.1),
    };
  }

  place() {
    const L = (this.L = this.layout());
    const e = this.el;
    gsap.set(e.boxes[0], { x: L.stackX, y: L.ground - L.CH, width: L.CW, height: L.CH });
    gsap.set(e.boxes[1], { x: L.stackX, y: L.ground - L.CH * 2, width: L.CW, height: L.CH });
    gsap.set(e.cargo, { width: L.CW, height: L.CH });
    gsap.set(e.spreader, { width: L.CW * 1.02, height: L.sH, x: -L.CW * 0.01 });
    gsap.set(e.cables[0], { left: L.CW * 0.22 });
    gsap.set(e.cables[1], { left: L.CW * 0.78 });
    gsap.set(e.truck, { width: L.TW, y: L.ground - L.TH });
    const r = WHEEL_R * L.k;
    this.wheels.forEach((w) => {
      const cx = +w.dataset.cx * L.k, cy = +w.dataset.cy * L.k;
      Object.assign(w.style, {
        width: `${r * 2}px`, height: `${r * 2}px`, left: `${cx - r}px`, top: `${cy - r}px`,
        backgroundImage: 'url(/img/truck-side.webp)',
        backgroundSize: `${L.TW}px ${L.TH}px`,
        backgroundPosition: `${-(cx - r)}px ${-(cy - r)}px`,
      });
    });

    // top-down road: enters from the left, turns DOWN at the centre and runs off the
    // bottom of the stage into the ship section (road centre = ship centre line)
    const roadW = L.vw * (this.mobile ? 0.36 : 0.145);
    const H = L.vh;
    const cx = L.vw * 0.5;
    const tw = roadW * 0.42, tl = tw * (1288 / 239);
    const endY = H + tl * 0.18;                       // truck ends with its cab below the edge
    // straight down the centre, like the reference
    const d = `M ${cx} ${-tl * 0.6} L ${cx} ${endY}`;
    const dRoad = `M ${cx} ${-400} L ${cx} ${H + 400}`;
    e.roadTop.style.height = `${H}px`;
    e.roadTop.style.top = '0px';
    e.roadSvg.setAttribute('viewBox', `0 0 ${L.vw} ${H}`);
    e.roadPath.setAttribute('d', dRoad);
    e.roadDash.setAttribute('d', dRoad);
    e.roadPath.setAttribute('stroke-width', roadW);
    gsap.set(e.truckTop, { width: tw, height: tl, xPercent: -50, yPercent: -50 });
    const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tmp.setAttribute('d', d);
    this.raw = MotionPathPlugin.getRawPath(tmp);
    MotionPathPlugin.cacheRawPathMeasurements(this.raw);
    this.roadW = roadW;
  }

  build() {
    const root = this.root;
    const q = (s) => $(s, root);
    const mobile = this.mobile;
    const band = q('.svc-band'), track = q('.svc-track'), cards = $$('.svc-card', root);
    const bigword = q('.svc-bigword'), rel = q('.svc-rel'), feats = q('.svc-feats'), speed = q('.svc-speed');
    const e = this.el;

    this.place();
    const S = (this.S = { rigX: 0, rigY: 0, cargoX: 0, cargoY: 0, truckX: 0, spin: 0, zoom: 0, p: 0 });
    const L = () => this.L;
    const lift = () => L().CH * 1.5;

    const tl = gsap.timeline({ defaults: { ease: 'power1.inOut' }, onUpdate: () => frame() });
    // fromTo with function values everywhere → reversible, resize-safe
    tl.fromTo(S, { rigX: () => L().cargoStart.x, rigY: () => -L().vh * 0.3, cargoX: () => L().cargoStart.x, cargoY: () => L().cargoStart.y, truckX: () => -L().TW - 60 },
      { rigY: () => L().cargoStart.y - L().sH, duration: 1.2 }, 0)
      .fromTo(S, { rigY: () => L().cargoStart.y - L().sH, cargoY: () => L().cargoStart.y },
        { rigY: () => L().cargoStart.y - L().sH - lift(), cargoY: () => L().cargoStart.y - lift(), duration: 1.2, immediateRender: false }, 1.2)
      .fromTo(S, { rigX: () => L().cargoStart.x, cargoX: () => L().cargoStart.x },
        { rigX: () => L().cargoEnd.x, cargoX: () => L().cargoEnd.x, duration: 1.6, immediateRender: false }, 2.4)
      .fromTo(S, { truckX: () => -L().TW - 60, spin: 0 }, { truckX: () => L().truckX, spin: 900, duration: 2.2, ease: 'power2.out', immediateRender: false }, 2.4)
      .fromTo(S, { rigY: () => L().cargoStart.y - L().sH - lift(), cargoY: () => L().cargoStart.y - lift() },
        { rigY: () => L().cargoEnd.y - L().sH, cargoY: () => L().cargoEnd.y, duration: 1.3, immediateRender: false }, 4.6)
      .fromTo(S, { rigY: () => L().cargoEnd.y - L().sH }, { rigY: () => -L().vh * 0.4, duration: 1, immediateRender: false }, 5.9);

    if (mobile) {
      tl.fromTo(S, { truckX: () => L().truckX, spin: 900 }, { truckX: () => L().vw * 1.2, spin: 2600, duration: 2.4, ease: 'power2.in', immediateRender: false }, 7)
        .set({}, {}, 9.6);
    } else {
      tl.fromTo(S, { zoom: 0 }, { zoom: 1, duration: 2, immediateRender: false }, 6.8)
        .fromTo(S, { spin: 900 }, { spin: 5200, duration: 9, ease: 'none', immediateRender: false }, 6.8)
        .fromTo([track, bigword, q('.svc-band-btn')], { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out', immediateRender: false }, 8.3)
        .fromTo(track, { x: 0 }, { x: () => -(track.scrollWidth - window.innerWidth), duration: 7, ease: 'none', immediateRender: false }, 8.8)
        .fromTo(bigword, { x: 0 }, { x: () => -bigword.scrollWidth * 0.45, duration: 7.5, ease: 'none', immediateRender: false }, 8.3)
        .fromTo([track, bigword, q('.svc-band-btn'), band, e.world], { opacity: 1 }, { opacity: 0, duration: 0.8, ease: 'power2.in', immediateRender: false }, 15.8)
        .fromTo(e.roadTop, { opacity: 0 }, { opacity: 1, duration: 0.8, immediateRender: false }, 16.1)
        .fromTo(S, { p: 0 }, { p: 1, duration: 13.4, ease: 'sine.inOut', immediateRender: false }, 16.3)
        .fromTo(rel, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out', immediateRender: false }, 16.2)
        .fromTo(feats, { y: 0 }, { y: () => -(feats.scrollHeight - window.innerHeight * 0.9), duration: 12, ease: 'none', immediateRender: false }, 17.2)
        .set({}, {}, 30);
    }

    const ez = gsap.parseEase('power2.inOut');
    const frame = () => {
      const t = tl.time(), Lx = this.L;
      gsap.set(e.rig, { x: S.rigX });
      e.cables.forEach((c) => (c.style.height = `${Math.max(0, S.rigY)}px`));
      gsap.set(e.spreader, { y: S.rigY });
      gsap.set(e.truck, { x: S.truckX });
      // the container rides the truck once it is down
      if (t >= 5.9) gsap.set(e.cargo, { x: S.truckX + (Lx.cargoEnd.x - Lx.truckX), y: Lx.cargoEnd.y });
      else gsap.set(e.cargo, { x: S.cargoX, y: S.cargoY });
      const rot = `rotate(${S.spin.toFixed(1)}deg)`;
      this.wheels.forEach((w) => (w.style.transform = rot));

      if (!mobile) {
        // zoom: shrink the world around the truck and lift the ground to 42vh
        const z = ez(S.zoom);
        const k = 1 - 0.62 * z;
        const g = Lx.ground, gTarget = Lx.vh * 0.42;
        const cx = Lx.truckX + Lx.TW * 0.5, cxTarget = Lx.vw * 0.26;
        const tx = (cxTarget - cx * k) * z, ty = (gTarget - g * k) * z;
        e.world.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${k.toFixed(4)})`;
        gsap.set(e.boxes, { opacity: 1 - z });
        band.style.setProperty('--horizon', `${(((g + (gTarget - g) * z) / Lx.vh) * 100).toFixed(3)}%`);

        // top-down truck drives the bend and down toward the ship
        const pos = MotionPathPlugin.getPositionOnPath(this.raw, S.p, true);
        gsap.set(e.truckTop, { x: pos.x, y: pos.y, rotation: pos.angle + 90 });

        if (t > 8.3 && t < 15.9) cards.forEach((c) => c.classList.toggle('is-in', c.getBoundingClientRect().left < Lx.vw * 0.85));
        speed.classList.toggle('active', t > 2.4 && t < 29.5);
        rel.classList.toggle('is-live', t > 16.2);
      } else {
        band.style.setProperty('--horizon', `${((Lx.ground / Lx.vh) * 100).toFixed(3)}%`);
      }
    };

    ScrollTrigger.create({
      trigger: q('.svc-scroll'),
      start: 'top top',
      end: 'bottom bottom',
      scrub: bp.isDesktop() ? 0.8 : true,
      animation: tl,
      invalidateOnRefresh: true,
      onRefreshInit: () => this.place(),
      onRefresh: () => frame(),
    });
    this.tl = tl;
    frame();
  }

  buildReveals() {
    const root = this.root;
    if (!this.mobile) return;
    const mob = $('.svc-mobile', root);
    revealGroup({ trigger: $('.svc-band-head', mob), allowMobile: true, items: [fill($('.svc-head-title', mob)), fadeUp($('.svc-head-desc', mob))] });
    $$('.svc-card, .svc-feat', mob).forEach((c) => revealGroup({ trigger: c, items: [fadeUp(c, { y: 2 })] }));
    revealGroup({ trigger: $('.svc-rel-title', mob), items: [fill($('.svc-rel-title', mob)), fadeUp($('.svc-rel-desc', mob))] });
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
    this.dead = true;
    if (this.speedTick) gsap.ticker.remove(this.speedTick);
  }
}

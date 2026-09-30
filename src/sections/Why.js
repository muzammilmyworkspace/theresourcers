import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, bp, reducedMotion } from '../core/helpers.js';
import { cloud, waterTexture, wakeSvg } from '../core/shipArt.js';
import { cloudBank } from '../core/art2.js';

// [left%, top%, width vw, height vh, start scale]
const WALL = [
  [-20, 40, 95, 62, 8], [30, 48, 95, 62, 5], [-12, -12, 85, 58, 5], [40, -8, 80, 56, 2],
  [8, 18, 85, 62, 5], [50, 22, 70, 56, 4], [-8, 64, 115, 58, 5],
];
const ORDER = [1, 6, 0, 2, 4, 3, 5];

/**
 * Real-time ocean with a lit 3D container ship (desktop). Scroll lifts the
 * camera from the deck to a high aerial while the headline and the five
 * reasons drift up over the water; a cloud wall closes the chapter.
 * Phones get a lightweight SVG ship on a CSS sea.
 */
export class Why {
  cam = { h: 7.5 };

  constructor(root = $('.home-why')) {
    this.root = root;
  }

  init() {
    const root = this.root;
    if (!root) return;
    const q = (s) => $(s, root);
    this.mobile = bp.isMobile();

    this.buildClouds(q('.why-clouds'));
    if (this.mobile) this.mobileWater();
    else this.lazyOcean(q('.why-ocean'));
    this.buildScroll();
  }

  mobileWater() {
    const root = this.root;
    this.usingDomShip = true;
    $('.why-ocean-mb', root).style.display = 'block';
    $('.why-ocean-mb-inner', root).style.backgroundImage = waterTexture();
    const ship = $('.why-ship', root);
    ship.style.display = 'block';
    $('.why-ship-inner', root).innerHTML = '<img src="/img/ship-top.webp" alt="" />';
    ship.insertAdjacentHTML('afterbegin', wakeSvg());
    if (!reducedMotion()) {
      this.bobTl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
        .to($('.why-ship-inner', root), { xPercent: 0.6, yPercent: -1.2, duration: 2.4 })
        .to($('.why-ship-inner', root), { xPercent: -0.45, yPercent: 2, duration: 2.7 });
    }
  }

  buildClouds(wrap) {
    this.wall = WALL.map(([l, t, w, h], i) => {
      const el = document.createElement('div');
      el.className = 'why-cloud';
      Object.assign(el.style, { left: `${l}%`, top: `${t}%`, width: `${w}vw`, height: `${h}vh` });
      el.innerHTML = cloud(i + 1);
      wrap.appendChild(el);
      return el;
    });
    this.decor = [[0, 8, 55, 26], [45, 58, 60, 30], [20, 30, 70, 34]].map(([l, t, w, h], i) => {
      const el = document.createElement('div');
      el.className = 'why-cloud is-decor';
      Object.assign(el.style, { left: `${l}%`, top: `${t}%`, width: `${w}vw`, height: `${h}vh` });
      el.innerHTML = cloud(20 + i, { shadow: '#9fb3e6' });
      wrap.appendChild(el);
      return el;
    });
  }

  lazyOcean(canvas) {
    const mount = async () => {
      if (this.ocean || this.dead) return;
      try {
        const { OceanScene } = await import('../webgl/OceanScene.js');
        if (this.dead) return;
        this.ocean = new OceanScene(canvas);
        this.ocean.init();
        this.ocean.setHeight(this.cam.h);
      } catch (err) {
        console.warn('Ocean disabled:', err);
        this.mobileWater();
      }
    };
    ScrollTrigger.create({
      trigger: this.root,
      start: 'top bottom+=150%',
      once: true,
      onEnter: () => ('requestIdleCallback' in window ? requestIdleCallback(mount, { timeout: 1200 }) : setTimeout(mount, 300)),
    });
  }

  buildScroll() {
    const root = this.root;
    const q = (s) => $(s, root);
    const mobile = this.mobile;
    const over = q('.why-over-inner');

    gsap.set(this.wall, { opacity: 0, scale: (i) => WALL[i][4] });
    gsap.set(this.decor[0], { x: '-50vw', scale: 0.8, opacity: 0.3 });
    gsap.set(this.decor[1], { x: '100vw', y: 150, scale: 0.8, opacity: 0.3 });
    gsap.set(this.decor[2], { x: '-5vw', scale: 0.7, opacity: 0 });

    let fadeRef = null;
    const tl = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: () => this.ocean?.setHeight(this.cam.h) });

    // camera climbs from deck level to a high aerial
    // start zoom: ship is ~2.2× the road width above, so the handoff lines up
    const h0 = () => {
      const roadPx = window.innerWidth * 0.145, shipW = 11 * (255 / 1299);
      return (shipW * window.innerHeight) / (2 * Math.tan((17.5 * Math.PI) / 180) * roadPx * 2.2);
    };
    this.cam.h = h0();
    tl.fromTo(this.cam, { h: h0 }, { h: 150, duration: 7, ease: 'cinematicSilk' }, 0);
    if (mobile) tl.fromTo(q('.why-ship'), { scale: 1 }, { scale: 0.2, duration: 7, ease: 'cinematicSilk' }, 0)
      .fromTo(q('.why-ocean-mb-inner'), { scale: 4 }, { scale: 1, duration: 7, ease: 'cinematicSilk' }, 0);

    // headline + reasons drift up over the water
    tl.fromTo(over, { y: () => window.innerHeight * 0.9 }, { y: () => -(over.offsetHeight - window.innerHeight * 0.25), duration: 7.2 }, 0.6);

    // decor clouds drift past, then the wall assembles from the camera
    tl.to(this.decor[2], { x: 0, scale: 1, opacity: 0.35, duration: 1, ease: 'cinematicSilk' }, 6.2)
      .to(this.decor[0], { x: '20vw', y: 30, scale: 0.6, opacity: 0, duration: 1.4 }, 6.2)
      .to(this.decor[1], { x: '50vw', y: 120, scale: 0.6, opacity: 0, duration: 1.4 }, 6.2)
      .to(this.decor[2], { scale: 2, opacity: 0, duration: 1.5 }, 7.2);
    let at = 7.4;
    ORDER.forEach((idx, k) => {
      tl.to(this.wall[idx], { scale: 1, opacity: 1, duration: k === 0 ? 1.3 : 1.5, ease: 'cinematicSmooth' }, at);
      at += k === 0 ? 0.2 : 0.15;
    });
    // end on a broken cloud deck over blue sky — the jet section picks up from here
    q('.why-cloud-bg').style.setProperty('--clouds', cloudBank());
    tl.to(q('.why-cloud-bg'), { opacity: 1, duration: 1.2, ease: 'cinematicSmooth' }, 8.6)
      .to(this.wall, { opacity: 0, duration: 0.8, ease: 'power1.in' }, 9.6)
      .set({}, {}, 10.6);

    ScrollTrigger.create({
      trigger: q('.why-scroll'),
      start: 'top top',
      end: 'bottom bottom',
      scrub: bp.isDesktop() ? 0.8 : true,
      animation: tl,
      invalidateOnRefresh: true,
      onRefresh: () => { this.ocean?.setHeight(this.cam.h); fadeRef?.(); },
      onUpdate: (st) => (root.dataset.section = 'dark'),
      onToggle: (st) => this.wall.forEach((c) => (c.style.willChange = st.isActive ? 'transform, opacity' : '')),
    });

    // each reason fades in as it rises through the lower half, out near the top
    const items = $$('.why-feat, .why-head', root);
    const fade = () => {
      const vh = window.innerHeight;
      items.forEach((el) => {
        const r = el.getBoundingClientRect();
        const c = (r.top + r.height / 2) / vh;
        const a = Math.min(1, Math.max(0, (0.95 - c) / 0.25), Math.max(0, (c - 0.02) / 0.18));
        el.style.opacity = a.toFixed(3);
        el.style.transform = `translateY(${((1 - Math.min(1, Math.max(0, (0.95 - c) / 0.25))) * 30).toFixed(1)}px)`;
      });
    };
    fadeRef = fade;
    tl.eventCallback('onUpdate', () => { this.ocean?.setHeight(this.cam.h); fade(); });
    fade();
    this.tl = tl;
  }

  destroy() {
    this.dead = true;
    this.bobTl?.kill();
    this.ocean?.destroy();
  }
}

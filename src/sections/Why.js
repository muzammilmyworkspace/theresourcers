import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, bp, reducedMotion } from '../core/helpers.js';
import { fill, line, revealGroup } from '../core/reveal.js';
import { topShip, cloud, waterTexture, wakeSvg } from '../core/shipArt.js';

// [left%, top%, width vw, height vh, start scale]
const WALL = [
  [-20, 40, 95, 62, 8],
  [30, 48, 95, 62, 5],
  [-12, -12, 85, 58, 5],
  [40, -8, 80, 56, 2],
  [8, 18, 85, 62, 5],
  [50, 22, 70, 56, 4],
  [-8, 64, 115, 58, 5],
];
const ORDER = [1, 6, 0, 2, 4, 3, 5]; // cloud-2 first, then 7, 1, 3, 5, 4, 6

export class Why {
  constructor(root = $('.home-why')) {
    this.root = root;
  }

  init() {
    const root = this.root;
    if (!root) return;
    const q = (s) => $(s, root);
    this.mobile = bp.isMobile();

    this.ship = q('.why-ship');
    this.shipInner = q('.why-ship-inner');
    this.shipInner.innerHTML = topShip();
    this.buildClouds(q('.why-clouds'));

    if (!this.mobile) this.lazyOcean(q('.why-ocean'));
    else this.mobileWater();

    this.buildScroll();
    this.buildBob();
    this.buildMain();
  }

  mobileWater() {
    const root = this.root;
    $('.why-ocean-mb', root).style.display = 'block';
    $('.why-ocean-mb-inner', root).style.backgroundImage = waterTexture();
    this.ship.insertAdjacentHTML('afterbegin', wakeSvg());
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
    this.decor = [
      [0, 8, 55, 26], [45, 58, 60, 30], [20, 30, 70, 34],
    ].map(([l, t, w, h], i) => {
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
        this.ocean.fitShip(this.ship.getBoundingClientRect().height);
        gsap.ticker.add(this.syncCamera);
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

  /* the 3D camera follows the 2D ship's on-screen size — they never drift */
  syncCamera = () => {
    if (!this.ocean?.visible) return;
    this.ocean.fitShip(this.ship.getBoundingClientRect().height);
    this.ocean.controls.wakeIntensity = 0.4 + 0.045 * this.bob.force * 10;
  };

  buildScroll() {
    const root = this.root;
    const q = (s) => $(s, root);
    const mobile = this.mobile;
    const endScale = mobile ? 0.18 : 0.082;

    gsap.set(this.wall, { opacity: 0, scale: (i) => WALL[i][4] });
    gsap.set(this.decor[0], { x: '-50vw', scale: 0.8, opacity: 0.3 });
    gsap.set(this.decor[1], { x: '100vw', y: 150, scale: 0.8, opacity: 0.3 });
    gsap.set(this.decor[2], { x: '-5vw', scale: 0.7, opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    tl.to(q('.why-stage-title'), { autoAlpha: 0, y: -60, duration: 1, ease: 'power1.in' }, 0.2)
      .to(q('.why-caption'), { autoAlpha: 0, y: 20, duration: 0.8 }, 0.4)
      .to(this.ship, { scale: endScale, duration: 5.5, ease: 'cinematicSilk' }, 0);
    if (mobile) tl.fromTo(q('.why-ocean-mb-inner'), { scale: 1 / endScale }, { scale: 1, duration: 5.5, ease: 'cinematicSilk' }, 0);

    // decor clouds drift past the camera
    tl.to(this.decor[2], { x: 0, scale: 1, opacity: 0.35, duration: 1, ease: 'cinematicSilk' }, 4.2)
      .to(this.decor[0], { x: '20vw', y: 30, scale: 0.6, opacity: 0, duration: 1.4 }, 4.2)
      .to(this.decor[1], { x: '50vw', y: 120, scale: 0.6, opacity: 0, duration: 1.4 }, 4.2)
      .to(this.decor[2], { scale: 2, opacity: 0, duration: 1.5 }, 5.2)
      .to(this.ship, { scale: endScale * 0.9, duration: 1.2, ease: 'cinematicSilk' }, 5.5);

    // cloud wall assembles from the camera
    let at = 5.4;
    ORDER.forEach((idx, k) => {
      tl.to(this.wall[idx], { scale: 1, opacity: 1, duration: k === 0 ? 1.3 : 1.5, ease: 'cinematicSmooth' }, at);
      at += k === 0 ? 0.2 : 0.15;
    });
    tl.to(q('.why-cloud-bg'), { opacity: 1, duration: 1.2, ease: 'cinematicSmooth' }, 6.6)
      .fromTo(q('.why-clouds'), { '--fade': 0 }, { '--fade': 1, duration: 1, ease: 'none' }, 7.2)
      .set({}, {}, 8.4);

    ScrollTrigger.create({
      trigger: q('.why-scroll'),
      start: 'top top',
      end: 'bottom bottom',
      scrub: bp.isDesktop() ? 1 : true,
      animation: tl,
      onUpdate: (st) => (root.dataset.section = st.progress > 0.82 ? 'light' : 'dark'),
      onToggle: (st) => this.wall.forEach((c) => (c.style.willChange = st.isActive ? 'transform, opacity' : '')),
    });
  }

  /* idle bob + wake pulse */
  buildBob() {
    this.bob = { force: 0 };
    if (reducedMotion()) return;
    this.bobTl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
      .to(this.shipInner, { xPercent: 0.6, yPercent: -1.2, duration: 2.4 })
      .to(this.bob, { force: 0, duration: 2.4 }, 0)
      .to(this.shipInner, { xPercent: -0.45, yPercent: 2, duration: 2.7 })
      .to(this.bob, { force: 0.6, duration: 2.7 }, '<');
  }

  destroy() {
    this.dead = true;
    gsap.ticker.remove(this.syncCamera);
    this.bobTl?.kill();
    this.ocean?.destroy();
  }

  buildMain() {
    const root = this.root;
    const q = (s) => $(s, root);
    const scrub = bp.isDesktop() ? 1 : true;
    const title = q('.why-title');

    revealGroup({
      trigger: q('.why-head'),
      items: [line(q('.why-head .label-line')), fill(q('.why-head .label span:last-child'), { at: 0 })],
    });

    gsap.fromTo(title,
      { scale: 0.9, filter: this.mobile ? 'none' : 'blur(2px)', autoAlpha: 0.7 },
      { scale: 1, filter: 'blur(0px)', autoAlpha: 1, ease: 'none', scrollTrigger: { trigger: title, start: 'top bottom', end: 'top center', scrub } });

    const items = $$('.why-item', root);
    items.forEach((item, i) => {
      const last = i === items.length - 1 && !this.mobile;
      const dir = last ? 0 : i % 2 === 0 ? -1 : 1;
      const tl = gsap.timeline({ scrollTrigger: { trigger: item, start: 'top bottom', end: 'top center-=20%', scrub } });
      [['.why-item-ic', 100], ['.why-item-title', 150], ['.why-item-desc', 200]].forEach(([sel, d]) => {
        tl.fromTo($(sel, item), { x: dir * d, y: d, autoAlpha: 0.2 }, { x: 0, y: 0, autoAlpha: 1, ease: 'cinematicSmooth' }, 0);
      });
    });
  }
}

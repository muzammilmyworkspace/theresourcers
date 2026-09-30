import { gsap } from 'gsap';
import { $, $$, bp } from '../core/helpers.js';
import { fill, fadeUp, revealGroup } from '../core/reveal.js';

/** static star field, drawn once */
function drawStars(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const n = Math.round((w * h) / 2600);
  for (let i = 0; i < n; i++) {
    const r = Math.random() < 0.08 ? 1.1 : 0.55;
    ctx.globalAlpha = 0.15 + Math.random() * 0.6;
    ctx.fillStyle = Math.random() < 0.12 ? '#ffb38a' : '#ffffff';
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // faint milky band
  const g = ctx.createLinearGradient(0, h * 0.2, w, h * 0.8);
  g.addColorStop(0, 'rgba(90,60,140,0)');
  g.addColorStop(0.5, 'rgba(120,80,160,0.06)');
  g.addColorStop(1, 'rgba(90,60,140,0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export class Hero {
  constructor(root = $('.home-hero')) {
    this.root = root;
  }

  init() {
    const root = this.root;
    const mobile = bp.isMobile();
    const q = (s) => $(s, root);
    const canvas = q('.home-hero-canvas');

    drawStars(q('.home-hero-stars'));

    this.globeReady = import('../webgl/Globe.js').then(({ Globe }) => {
      if (this.dead) return;
      try {
        this.globe = new Globe({ canvas, labelsWrap: q('.globe-labels') });
        this.globe.init();
        const labels = $$('.globe-label-text', root);
        gsap.set(labels, { autoAlpha: 0, y: 10, filter: 'blur(5px)' });
        if (this.played) gsap.to(labels, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.5, stagger: 0.05, delay: 0.9 });
      } catch (err) {
        console.warn('Globe disabled:', err);
        root.classList.add('no-webgl');
      }
    });

    const globeWrap = q('.home-hero-globe');
    const blur = q('.home-hero-globe-blur');
    const labels = $$('.globe-label-text', root);

    gsap.set(canvas, { autoAlpha: 0 });
    gsap.set(labels, { autoAlpha: 0, y: 10, filter: 'blur(5px)' });
    gsap.set(blur, { autoAlpha: 0, scale: 0.8 });
    gsap.set(globeWrap, { yPercent: -50, scale: mobile ? 0.9 : 0.55, xPercent: mobile ? 0 : 18 });
    gsap.set(q('.home-hero-stars'), { autoAlpha: 0 });

    const text = revealGroup({
      paused: true,
      items: [
        fill(q('.home-hero-label .txt-anim')),
        fill(q('.home-hero-title')),
        fill(q('.home-hero-desc')),
        fadeUp($$('.home-hero-btn', root), { y: 1 }),
      ],
    });

    this.tl = gsap.timeline({ paused: true, delay: 0.2, onComplete: () => this.scrollOut() });
    this.tl
      .to(q('.home-hero-stars'), { autoAlpha: 0.7, duration: 1.6, ease: 'power2.out' }, 0)
      .to(globeWrap, { scale: 1, xPercent: 0, duration: 1.6, ease: 'expo.out' }, 0.1)
      .to(canvas, { autoAlpha: 1, duration: 1.2, ease: 'power2.out' }, 0.1)
      .to(blur, { autoAlpha: 1, scale: 1, duration: 1.4, ease: 'back.out(1.3)' }, 0.3)
      .to(text.tl, { progress: 1, duration: text.tl.duration(), ease: 'none' }, 0.35)
      .call(() => gsap.to($$('.globe-label-text', root), { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.5, stagger: 0.05 }), null, 0.9);
  }

  play() {
    this.played = true;
    this.tl.play();
  }

  destroy() {
    this.dead = true;
    this.tl?.kill();
    this.globe?.destroy();
  }

  /* globe dims and sinks as the hero scrolls away */
  scrollOut() {
    gsap.timeline({
      scrollTrigger: { trigger: this.root, start: 'top top', end: 'bottom top', scrub: 0.8 },
    })
      .to($('.home-hero-globe', this.root), { yPercent: -70, scale: 0.92, ease: 'none' }, 0)
      .to($('.home-hero-globe', this.root), { autoAlpha: 0, ease: 'power1.in', duration: 0.35 }, 0.65)
      .to($('.home-hero-inner', this.root), { yPercent: -18, autoAlpha: 0, ease: 'none' }, 0)
      .to($('.home-hero-stars', this.root), { autoAlpha: 0, ease: 'none' }, 0);
  }
}

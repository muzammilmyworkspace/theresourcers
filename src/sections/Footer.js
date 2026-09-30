import { gsap } from 'gsap';
import { $, $$, bp, isTouch } from '../core/helpers.js';
import { fill, fadeUp, line, revealGroup } from '../core/reveal.js';
import { marquee } from '../core/marquee.js';

/* ---------------- CTA: endless ripple ---------------- */
export function initCta(root = $('.home-cta')) {
  if (!root) return;
  const wrap = $('.cta-circs', root);
  const src = $('.cta-circ', wrap);
  wrap.innerHTML = '';
  for (let n = 0; n < 6; n++) {
    const c = src.cloneNode();
    c.style.animationDelay = `${-2.5 * n}s`;
    wrap.appendChild(c);
  }
  revealGroup({
    trigger: $('.cta-inner', root),
    items: [
      line($('.cta-label .label-line', root)),
      fill($('.cta-label span:last-child', root), { at: 0 }),
      fill($('.cta-title', root), { at: 0.1 }),
      fill($('.cta-desc', root), { at: 0.3 }),
      fadeUp($('.cta-points', root), { at: 0.45 }),
      fadeUp($('.cta-direct', root), { at: 0.55 }),
      fadeUp($('.cta-form', root), { y: 4, at: 0.2 }),
    ],
  });
}

/* ---------------- footer ---------------- */
export class Footer {
  constructor(root = $('.footer')) {
    this.root = root;
  }

  init() {
    const root = this.root;
    if (!root) return;
    const q = (s) => $(s, root);

    this.initTabs();
    $$('.footer-marquee', root).forEach((m) => marquee(m));
    if (bp.isDesktop() && !isTouch()) this.initParticles();

    revealGroup({ trigger: q('.footer-top'), stagger: 0.03, items: [fill(q('.footer-sub')), fadeUp($$('.footer-col', root), { y: 2 })] });
    revealGroup({ trigger: q('.footer-info'), items: [fadeUp(q('.footer-tabs')), fadeUp(q('.footer-panels'), { x: -3, y: 0 })] });
    revealGroup({ trigger: q('.footer-bot'), start: 'top bottom', items: [fadeUp($$('.footer-bot > span', root), { y: 1 })] });
  }

  initTabs() {
    const root = this.root;
    const tabs = $$('.footer-tab', root);
    const panels = $$('.footer-panel', root);
    const pill = $('.footer-tab-pill', root);
    tabs.forEach((tab, i) =>
      tab.addEventListener('click', () => {
        tabs.forEach((t, k) => t.classList.toggle('active', k === i));
        panels.forEach((p, k) => p.classList.toggle('active', k === i));
        gsap.to(pill, { xPercent: 100 * i, duration: 0.45, ease: 'power2.out' });
        gsap.timeline()
          .to(pill, { scaleX: 0.95, scaleY: 0.85, duration: 0.2, ease: 'power1.out' })
          .to(pill, { scaleX: 1, scaleY: 1, duration: 0.25, ease: 'power2.out' });
      })
    );
  }

  /** wordmark made of particles that scatter from the cursor and spring back */
  initParticles() {
    const root = this.root;
    const canvas = $('.footer-particles', root);
    const logo = $('.footer-logo', root);
    const ctx = canvas.getContext('2d');
    root.classList.add('has-particles');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let P = [], W = 0, H = 0;
    const mouse = { x: -9999, y: -9999, t: 0 };

    const build = () => {
      const r = canvas.getBoundingClientRect();
      W = canvas.width = Math.round(r.width * dpr);
      H = canvas.height = Math.round(r.height * dpr);
      const lr = logo.getBoundingClientRect();
      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      const o = off.getContext('2d');
      const cs = getComputedStyle(logo);
      o.font = `${cs.fontWeight} ${parseFloat(cs.fontSize) * dpr}px ${cs.fontFamily}`;
      o.textBaseline = 'alphabetic';
      if ('letterSpacing' in o) o.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : `${parseFloat(cs.letterSpacing) * dpr}px`;
      const baseline = (lr.top - r.top + lr.height * 0.86) * dpr;
      const cx = (lr.left + lr.width / 2 - r.left) * dpr;
      // brand colours: THE SOUR in white, CERS in orange
      const txt = logo.textContent.trim(), a = txt.slice(0, -4), b = txt.slice(-4);
      const wa = o.measureText(a).width, wb = o.measureText(b).width;
      o.textAlign = 'left';
      o.fillStyle = '#ffffff'; o.fillText(a, cx - (wa + wb) / 2, baseline);
      o.fillStyle = '#ff5500'; o.fillText(b, cx - (wa + wb) / 2 + wa, baseline);
      const data = o.getImageData(0, 0, W, H).data;
      const step = Math.round(4 * dpr);
      P = [];
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          const i = (y * W + x) * 4;
          if (data[i + 3] > 128) {
            P.push({ ox: x, oy: y, x, y, vx: 0, vy: 0, c: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`,
              f: 0.8 + Math.random() * 0.15, e: 0.04 + Math.random() * 0.04 });
          }
        }
      }
      this.size = Math.max(1, Math.round(2.2 * dpr));
    };

    const R = 110 * dpr, R2 = R * R;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      const active = performance.now() - mouse.t < 100;
      const s = this.size;
      for (const p of P) {
        if (active) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const d = Math.sqrt(d2) || 1;
            const force = ((R - d) / R) * 150 * (0.5 + Math.random()) * 0.02;
            p.vx += (dx / d) * force + (Math.random() - 0.5) * 0.6;
            p.vy += (dy / d) * force + (Math.random() - 0.5) * 0.6;
          }
        }
        const disturbed = Math.abs(p.x - p.ox) + Math.abs(p.y - p.oy) > 2;
        const ease = disturbed ? p.e : p.e * 4;
        p.vx = (p.vx + (p.ox - p.x) * ease) * p.f;
        p.vy = (p.vy + (p.oy - p.y) * ease) * p.f;
        p.x += p.vx; p.y += p.vy;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, s, s);
      }
    };

    const move = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * dpr;
      mouse.y = (e.clientY - r.top) * dpr;
      mouse.t = performance.now();
    };
    window.addEventListener('mousemove', move, { passive: true });

    document.fonts.ready.then(build);
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
    new IntersectionObserver(([e]) => (e.isIntersecting ? gsap.ticker.add(tick) : gsap.ticker.remove(tick))).observe(canvas);
  }
}

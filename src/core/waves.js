import { gsap } from 'gsap';
import { $$, reducedMotion } from './helpers.js';

/**
 * Layered animated water lines for section backgrounds.
 *   <div data-waves="light|dark|blue" data-waves-height="0.5">
 * A canvas is appended behind the content; it only animates while visible.
 */
const THEMES = {
  light: { fill: ['#e9f0ff', '#dce7ff', '#cfdcff'], line: '#0058f8', lineA: 0.14, bg: null },
  dark: { fill: ['#0d1a3d', '#0a1531', '#081027'], line: '#5b7cff', lineA: 0.28, bg: null },
  blue: { fill: ['#2a4fd1', '#1f3fbd', '#1633a8'], line: '#ffffff', lineA: 0.25, bg: null },
};

class WaveLayer {
  constructor(host) {
    this.host = host;
    this.theme = THEMES[host.dataset.waves] || THEMES.light;
    this.frac = parseFloat(host.dataset.wavesHeight || '0.45');
    const c = (this.canvas = document.createElement('canvas'));
    c.className = 'waves-canvas';
    c.setAttribute('aria-hidden', 'true');
    host.prepend(c);
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    this.ctx = c.getContext('2d');
    this.t = Math.random() * 100;
    this.resize();
    new ResizeObserver(() => this.resize()).observe(host);
    new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (this.visible && !this.running && !reducedMotion()) { this.running = true; gsap.ticker.add(this.tick); }
      if (!this.visible && this.running) { this.running = false; gsap.ticker.remove(this.tick); }
    }, { rootMargin: '100px' }).observe(host);
    this.draw();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = this.host.clientWidth, h = Math.round(this.host.clientHeight * this.frac);
    this.w = w; this.h = h;
    this.canvas.width = w * dpr; this.canvas.height = h * dpr;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  wave(x, t, k) {
    return Math.sin(x * 0.006 * (1 + k * 0.35) + t * (0.6 + k * 0.15) + k * 1.7) * 0.5
      + Math.sin(x * 0.013 * (1 + k * 0.2) - t * (0.9 - k * 0.1) + k) * 0.3
      + Math.sin(x * 0.0021 + t * 0.25 + k * 2.3) * 0.6;
  }

  draw() {
    const { ctx, w, h, theme } = this;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const t = this.t;
    const layers = 3;
    for (let k = 0; k < layers; k++) {
      const base = h * (0.35 + k * 0.2);
      const amp = h * (0.09 - k * 0.018);
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w + 8; x += 8) ctx.lineTo(x, base + this.wave(x, t, k) * amp);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = theme.fill[k];
      ctx.globalAlpha = 0.55 + k * 0.15;
      ctx.fill();
      // crest line
      ctx.beginPath();
      for (let x = 0; x <= w + 8; x += 8) {
        const y = base + this.wave(x, t, k) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.globalAlpha = theme.lineA * (1 - k * 0.25);
      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  tick = (time, delta) => {
    this.t += Math.min(delta, 50) * 0.0006;
    this.draw();
  };
}

export function initWaves(root = document) {
  const list = $$('[data-waves]', root);
  if (root.matches?.('[data-waves]')) list.push(root);
  list.forEach((el) => {
    if (el.__waves) return;
    el.__waves = new WaveLayer(el);
  });
}

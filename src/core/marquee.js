/**
 * Clones [data-marquee="item"] enough times to cover the viewport and runs a
 * CSS keyframe at a constant 40px/s.
 */
export function marquee(wrap, { reverse = false } = {}) {
  const item = wrap.querySelector('[data-marquee="item"]');
  if (!item) return;
  const w = item.getBoundingClientRect().width || 1;
  const count = Math.ceil(Math.max(window.innerWidth, wrap.parentElement.clientWidth) / w) + 1;
  for (let i = 0; i < count; i++) {
    const c = item.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    wrap.appendChild(c);
  }
  [...wrap.children].forEach((c) => {
    c.classList.add('anim-marquee');
    if (reverse) c.classList.add('is-reverse');
    c.style.animationDuration = `${Math.ceil(w / 40)}s`;
  });
}

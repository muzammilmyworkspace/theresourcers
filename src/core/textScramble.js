import { bp, isTouch } from './helpers.js';

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Hover scramble: letters are shuffled every tick while one more correct
 * character is revealed per tick (starting at -3 so it scrambles first).
 */
export function initTextScramble(root = document) {
  if (!bp.isDesktop() || isTouch()) return;
  root.querySelectorAll('[data-link-random]').forEach((link) => {
    if (link.dataset.scrambleBound) return;
    link.dataset.scrambleBound = '1';
    const target = link.querySelector('[data-link-random-txt]') || link;
    const original = target.textContent;
    const speed = Number(link.dataset.velocity) || 30;
    let id = null;

    link.addEventListener('mouseenter', () => {
      clearInterval(id);
      let revealed = -3;
      id = setInterval(() => {
        const rest = shuffle(original.slice(Math.max(0, revealed)).split('').filter((c) => c !== ' '));
        let k = 0;
        target.textContent = original
          .split('')
          .map((c, i) => (i < revealed || c === ' ' ? c : rest[k++] ?? c))
          .join('');
        revealed++;
        if (revealed > original.length) {
          clearInterval(id);
          target.textContent = original;
        }
      }, speed);
    });
    link.addEventListener('mouseleave', () => {
      clearInterval(id);
      target.textContent = original;
    });
  });
}

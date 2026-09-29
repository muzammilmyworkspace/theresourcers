import { escapeHtml } from './helpers.js';

/**
 * Splits an element's text into rendered lines.
 * Supports plain text + <br>. Returns { lines, revert }.
 */
export function splitLines(el, lineClass = 'split-line') {
  const original = el.innerHTML;

  const chunks = original.split(/<br\s*\/?>/i).map((chunk) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = chunk;
    return tmp.textContent.trim().split(/\s+/).filter(Boolean);
  });

  el.innerHTML = chunks
    .map((words) => words.map((w) => `<span class="sw">${escapeHtml(w)}</span>`).join(' '))
    .join('<br>');

  const lines = [];
  let lastTop = null;
  el.querySelectorAll('.sw').forEach((w) => {
    const top = w.offsetTop;
    if (lastTop === null || Math.abs(top - lastTop) > 2) {
      lines.push([]);
      lastTop = top;
    }
    lines[lines.length - 1].push(w.textContent);
  });

  el.innerHTML = lines
    .map((words) => `<span class="${lineClass}">${words.map(escapeHtml).join(' ')}</span>`)
    .join('');

  return {
    lines: [...el.querySelectorAll(`.${lineClass}`)],
    revert() {
      el.innerHTML = original;
    },
  };
}

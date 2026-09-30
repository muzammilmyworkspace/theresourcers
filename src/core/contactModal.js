import { $ } from './helpers.js';
import { smooth } from './lenis.js';
import { initQuoteForm } from './quoteForm.js';

/** floating "Contact us" button → quote form in a popup (lives outside the page container) */
export function initContactModal() {
  const m = $('.cmodal');
  if (!m || m.__bound) return;
  m.__bound = true;
  let last = null;
  const open = () => {
    last = document.activeElement;
    m.hidden = false;
    requestAnimationFrame(() => m.classList.add('is-open'));
    smooth.stop();
    setTimeout(() => $('input:not([type=hidden])', m)?.focus({ preventScroll: true }), 380);
  };
  const close = () => {
    m.classList.remove('is-open');
    smooth.start();
    setTimeout(() => { m.hidden = true; last?.focus?.({ preventScroll: true }); }, 450);
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-contact-open]')) { e.preventDefault(); open(); } else if (e.target.closest('[data-contact-close]')) close();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && m.classList.contains('is-open')) close(); });
  initQuoteForm($('form', m));
}

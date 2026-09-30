import { gsap } from 'gsap';
import { $, $$ } from './helpers.js';

export const CONTACT = {
  email: 'thesourcers.info@gmail.com',
  whatsapp: '8618304560078',
  whatsappLabel: '+86 183 0456 0078',
};

// FormSubmit relays the form to the inbox (no account needed; the first
// submission sends a one-time activation email to the address below).
const ENDPOINT = `https://formsubmit.co/ajax/${CONTACT.email}`;

export const waLink = (text = '') =>
  `https://wa.me/${CONTACT.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** validation + submit for any <form data-quote-form> */
export function initQuoteForm(form) {
  if (!form || form.__bound) return;
  form.__bound = true;
  const fields = $$('.field', form);
  const btn = $('[type="submit"]', form);
  const label = btn.querySelector('.btn-label') || btn.firstChild;
  const note = $('.form-status', form);

  const check = (field) => {
    const input = $('input, select, textarea', field);
    let ok = input.checkValidity();
    if (input.type === 'email' && input.value) ok = ok && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
    field.classList.toggle('has-error', !ok);
    return ok;
  };
  fields.forEach((f) => {
    const input = $('input, select, textarea', f);
    ['blur', 'input', 'change'].forEach((ev) => input.addEventListener(ev, () => f.classList.contains('has-error') && check(f)));
  });

  const setStatus = (msg, isError) => {
    if (!note) return;
    note.innerHTML = msg;
    note.classList.toggle('is-error', !!isError);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bad = fields.filter((f) => !check(f));
    if (bad.length) {
      $('input, select, textarea', bad[0]).focus();
      gsap.fromTo(bad[0], { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    const original = label.textContent;
    btn.disabled = true;
    label.textContent = 'Sending… ';
    setStatus('');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...data,
          _subject: `New sourcing enquiry from ${data.name || 'website'}`,
          _template: 'table',
          _captcha: 'false',
          _replyto: data.email,
          page: location.pathname,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const success = $('.form-success', form);
      if (success) {
        gsap.fromTo(success, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power3.out' });
        gsap.from($$('.form-success > *', form), { y: 20, autoAlpha: 0, duration: 0.6, stagger: 0.08, delay: 0.15, ease: 'power3.out' });
      }
      form.reset();
    } catch (err) {
      const msg = `Hi, I'd like a sourcing quote.\n\nName: ${data.name || ''}\nProduct: ${data.message || ''}`;
      setStatus(`Couldn’t send right now. Please <a href="${waLink(msg)}" target="_blank" rel="noopener">message us on WhatsApp</a> or email <a href="mailto:${CONTACT.email}">${CONTACT.email}</a>.`, true);
    } finally {
      btn.disabled = false;
      label.textContent = original;
    }
  });
}

export function initQuoteForms(root = document) {
  $$('form[data-quote-form]', root).forEach(initQuoteForm);
}

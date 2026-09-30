import deck from './shipDeck.json';

/* Container column on the ship that the truck's container lines up with (image px) */
export const SHIP_IMG = { w: deck.w, h: deck.h };
export const HANDOFF_COL = { x0: 114, x1: 138 };

const SCALE = 3;
let cached = null;

const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};
const isLight = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11 > 170;
};

/** one container seen from above, drawn crisp at canvas resolution */
function drawBox(ctx, x, y, w, h, color, logo) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, shade(color, -0.1));
  g.addColorStop(0.18, shade(color, 0.04));
  g.addColorStop(0.82, color);
  g.addColorStop(1, shade(color, -0.14));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // roof corrugation (transverse)
  ctx.fillStyle = isLight(color) ? 'rgba(0,0,0,.07)' : 'rgba(0,0,0,.14)';
  for (let yy = y + 6; yy < y + h - 6; yy += 7) ctx.fillRect(x + 3, yy, w - 6, 2);
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  for (let yy = y + 8; yy < y + h - 6; yy += 7) ctx.fillRect(x + 3, yy, w - 6, 1);
  // rails + corner castings
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = '#e9b949';
  [[x + 2, y + 2], [x + w - 7, y + 2], [x + 2, y + h - 7], [x + w - 7, y + h - 7]].forEach(([cx, cy]) => ctx.fillRect(cx, cy, 5, 5));
  if (logo) {
    // the blue mark, painted across the roof like the truck's container
    const s = Math.min(w * 0.86, h * 0.8);
    const k = s / Math.max(logo.width, logo.height);
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(Math.PI / 2);
    ctx.globalAlpha = 0.97;
    ctx.drawImage(logo, (-logo.width * k) / 2, (-logo.height * k) / 2, logo.width * k, logo.height * k);
    ctx.restore();
  }
}

/** photo hull + crisp redrawn container deck, 3× the source resolution */
export function buildShipCanvas() {
  if (cached) return cached;
  cached = new Promise((resolve) => {
    const img = new Image();
    const mark = new Image();
    const markReady = new Promise((r) => { mark.onload = r; mark.onerror = r; });
    mark.src = '/img/brand/mark.png';
    img.onload = async () => {
      await markReady;
      const c = document.createElement('canvas');
      c.width = deck.w * SCALE;
      c.height = deck.h * SCALE;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, c.width, c.height);
      // deck shadow under the stacks
      let i = 0;
      for (const [a, b, y0, y1, c0] of deck.cells) {
        // the column the truck drives onto carries the same orange branded boxes as the truck
        const hand = Math.abs(a - HANDOFF_COL.x0) <= 2;
        const brand = hand || (isLight(c0) && (y1 - y0) * SCALE > 110 && i++ % 2 === 0);
        const col = brand ? '#f05a18' : c0;
        const x = a * SCALE, y = y0 * SCALE, w = (b - a) * SCALE, h = (y1 - y0) * SCALE;
        ctx.fillStyle = 'rgba(0,0,0,.35)';
        ctx.fillRect(x + 3, y + 4, w, h);
        drawBox(ctx, x, y, w, h, col, brand && mark.naturalWidth && h > w * 0.9 ? mark : null);
      }
      resolve(c);
    };
    img.src = '/img/ship-top.webp';
  });
  return cached;
}

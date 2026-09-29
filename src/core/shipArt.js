/* Top-down container ship (bow up) and soft clouds — pure SVG. */

const rng = (seed = 3) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const BOX = ['#0016cb', '#ff5500', '#1b1b1f', '#e6e9f0', '#2438e0', '#ff7a33', '#3b3d44', '#c9cfdc', '#0016cb', '#0016cb'];

export function topShip() {
  const r = rng(21);
  const W = 200, H = 1000;
  // container bays between bow deck and the bridge
  let bays = '';
  const cols = 7, colW = 20, x0 = (W - cols * colW) / 2;
  for (let y = 190; y < 740; y += 44) {
    const hatchGap = (y - 190) % 132 === 88 ? 6 : 0;
    for (let c = 0; c < cols; c++) {
      // bays narrow toward the bow
      const t = Math.min(1, (y - 150) / 160);
      const inset = (1 - t) * 30;
      const x = x0 + c * colW;
      if (x < inset + 18 || x + colW > W - inset - 18) continue;
      if (r() < 0.08) continue;
      const col = BOX[Math.floor(r() * BOX.length)];
      bays += `<rect x="${x + 1}" y="${y + hatchGap}" width="${colW - 2}" height="${40 - hatchGap}" rx="1" fill="${col}"/>`;
      bays += `<rect x="${x + 1}" y="${y + hatchGap}" width="${colW - 2}" height="3" fill="#fff" opacity=".22"/>`;
    }
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="hullG" x1="0" x2="1">
        <stop offset="0" stop-color="#15161c"/><stop offset=".5" stop-color="#2a2c36"/><stop offset="1" stop-color="#15161c"/>
      </linearGradient>
      <linearGradient id="deckG" x1="0" x2="1">
        <stop offset="0" stop-color="#6d7384"/><stop offset=".5" stop-color="#8b91a2"/><stop offset="1" stop-color="#6d7384"/>
      </linearGradient>
    </defs>
    <!-- hull -->
    <path d="M100 8 C150 70 190 170 192 300 V930 Q192 992 150 992 H50 Q8 992 8 930 V300 C10 170 50 70 100 8 Z" fill="url(#hullG)"/>
    <path d="M100 8 C150 70 190 170 192 300 V930 Q192 992 150 992 H50 Q8 992 8 930 V300 C10 170 50 70 100 8 Z" fill="none" stroke="#ff5500" stroke-width="3"/>
    <!-- deck -->
    <path d="M100 40 C140 95 172 180 174 300 V920 Q174 972 140 972 H60 Q26 972 26 920 V300 C28 180 60 95 100 40 Z" fill="url(#deckG)"/>
    <!-- bow details -->
    <circle cx="100" cy="110" r="10" fill="#1b1b1f"/><circle cx="100" cy="110" r="4" fill="#ff5500"/>
    <path d="M70 150 H130 M60 170 H140" stroke="#1b1b1f" stroke-width="3"/>
    ${bays}
    <!-- bridge / accommodation -->
    <rect x="26" y="772" width="148" height="92" rx="4" fill="#f4f5f8"/>
    <rect x="18" y="790" width="164" height="18" rx="3" fill="#e2e5ec"/>
    <rect x="40" y="820" width="120" height="6" fill="#1b1b1f" opacity=".6"/>
    <rect x="40" y="834" width="120" height="4" fill="#1b1b1f" opacity=".25"/>
    <text x="100" y="853" text-anchor="middle" font-family="Space Grotesk, Arial" font-weight="700" font-size="11" letter-spacing="3" fill="#0016cb">THE SOURCERS</text>
    <!-- funnel -->
    <rect x="80" y="880" width="40" height="44" rx="6" fill="#ff5500"/>
    <rect x="86" y="888" width="28" height="10" rx="3" fill="#1b1b1f"/>
    <!-- stern -->
    <path d="M40 940 H160" stroke="#1b1b1f" stroke-width="3"/>
  </svg>`;
}

/** soft cloud made of blurred circles — returned as an <img> so it rasterises once */
export function cloud(seed = 1, { tint = '#ffffff', shadow = '#c9d6f5' } = {}) {
  const r = rng(seed * 97 + 11);
  let puffs = '', shade = '';
  const n = 9 + Math.floor(r() * 5);
  for (let i = 0; i < n; i++) {
    const cx = 120 + r() * 160, cy = 85 + r() * 30, rad = 30 + r() * 30;
    puffs += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad.toFixed(1)}"/>`;
    shade += `<circle cx="${(cx + 5).toFixed(1)}" cy="${(cy + 10).toFixed(1)}" r="${(rad * 0.95).toFixed(1)}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="800" height="400" preserveAspectRatio="none">
    <defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="13"/></filter></defs>
    <g filter="url(#b)"><g fill="${shadow}" opacity=".55">${shade}</g><g fill="${tint}">${puffs}</g></g>
  </svg>`;
  return `<img alt="" draggable="false" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}" />`;
}

/** mobile water texture (rasterised once) */
export function waterTexture() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1200">
    <filter id="t" x="0" y="0" width="600" height="1200" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" stitchTiles="stitch" baseFrequency=".008 .022" numOctaves="3" seed="7"/>
      <feColorMatrix values="0 0 0 0 .05  0 0 0 0 .2  0 0 0 0 .45  0 0 0 1.4 -.55"/></filter>
    <rect width="100%" height="100%" fill="#03183f"/>
    <rect width="100%" height="100%" filter="url(#t)"/>
  </svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

/** mobile V-wake that trails the ship (scales with it) */
export function wakeSvg() {
  return `<svg class="why-wake-mb" viewBox="0 0 500 1000" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="wk" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <filter id="wb"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <g filter="url(#wb)" fill="none" stroke="url(#wk)" stroke-linecap="round">
      <path d="M236 0 L0 1000" stroke-width="9"/>
      <path d="M264 0 L500 1000" stroke-width="9"/>
      <path d="M250 0 L250 820" stroke-width="70" stroke-opacity=".55"/>
    </g>
  </svg>`;
}

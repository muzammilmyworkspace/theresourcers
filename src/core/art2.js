/* Plane, partner wordmarks and insight covers, all code-generated. */
import { containerYard } from './art.js';

/** top-down cargo plane, nose pointing right (viewBox 1000×900) */
export function topPlane() {
  let windows = '';
  for (let x = 330; x < 830; x += 22) windows += `<rect x="${x}" y="437" width="9" height="6" rx="2" fill="#1b1d26" opacity=".55"/>`;
  const engine = (x, y) => `<g><rect x="${x}" y="${y - 17}" width="92" height="34" rx="16" fill="#c9cfdc"/><rect x="${x + 70}" y="${y - 17}" width="22" height="34" rx="10" fill="#1b1d26"/><rect x="${x}" y="${y - 17}" width="92" height="6" rx="3" fill="#fff" opacity=".6"/></g>`;
  return `<svg viewBox="0 0 1000 900" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <!-- wings -->
    <path d="M600 420 L360 30 Q350 14 332 18 L300 26 L420 420 Z" fill="#dfe3ea"/>
    <path d="M600 480 L360 870 Q350 886 332 882 L300 874 L420 480 Z" fill="#d3d8e1"/>
    <path d="M600 420 L360 30" stroke="#fff" stroke-width="4" opacity=".7"/>
    <path d="M318 26 L300 26 L312 60 Z" fill="#ff5500"/><path d="M318 874 L300 874 L312 840 Z" fill="#ff5500"/>
    ${engine(440, 250)} ${engine(380, 130)} ${engine(440, 650)} ${engine(380, 770)}
    <!-- tail -->
    <path d="M190 430 L90 250 Q84 238 72 240 L58 244 L120 430 Z" fill="#dfe3ea"/>
    <path d="M190 470 L90 650 Q84 662 72 660 L58 656 L120 470 Z" fill="#d3d8e1"/>
    <!-- fuselage -->
    <path d="M40 450 Q40 410 90 404 L860 400 Q960 404 978 450 Q960 496 860 500 L90 496 Q40 490 40 450 Z" fill="#f6f7fa"/>
    <path d="M90 404 L860 400 Q960 404 978 450 L40 450 Q40 410 90 404 Z" fill="#fff"/>
    <rect x="120" y="446" width="760" height="8" fill="#0058f8"/>
    <path d="M60 444 H200 V456 H60 Z" fill="#ff5500"/>
    ${windows}
    <path d="M905 424 Q950 432 962 450 Q950 468 905 476 Q918 450 905 424 Z" fill="#1b1d26"/>
    <text x="560" y="428" font-family="Space Grotesk, Arial" font-weight="700" font-size="22" letter-spacing="6" fill="#0058f8">THE SOURCERS</text>
  </svg>`;
}

/* ---------------- partner wordmarks (fictional) ---------------- */
const MARKS = [
  (c) => `<circle cx="16" cy="16" r="13" fill="none" stroke="${c}" stroke-width="3"/><path d="M8 20 L16 8 L24 20" fill="none" stroke="${c}" stroke-width="3"/>`,
  (c) => `<path d="M2 24 L16 4 L30 24 Z" fill="${c}"/>`,
  (c) => `<path d="M2 16 Q9 4 16 16 T30 16" fill="none" stroke="${c}" stroke-width="3.5"/><path d="M2 24 Q9 12 16 24 T30 24" fill="none" stroke="${c}" stroke-width="3.5" opacity=".5"/>`,
  (c) => `<rect x="4" y="4" width="24" height="24" rx="6" fill="${c}"/><path d="M10 16 H22 M16 10 V22" stroke="#fff" stroke-width="3"/>`,
  (c) => `<path d="M16 2 A14 14 0 1 0 30 16 A10 10 0 1 1 16 2 Z" fill="${c}"/>`,
  (c) => `<path d="M4 28 L16 4 L28 28 M9 19 H23" fill="none" stroke="${c}" stroke-width="3.5"/>`,
  (c) => `<circle cx="10" cy="16" r="8" fill="${c}"/><circle cx="22" cy="16" r="8" fill="${c}" opacity=".5"/>`,
  (c) => `<path d="M16 3 L28 16 L16 29 L4 16 Z" fill="none" stroke="${c}" stroke-width="3.5"/><circle cx="16" cy="16" r="4" fill="${c}"/>`,
];
const COLORS = ['#0058f8', '#e0301e', '#0a7c86', '#ff5500', '#6b2fd6', '#1b1b1f', '#0f9d58', '#c2185b'];
const FONTS = [
  ['Space Grotesk, Arial', 700, 0], ['Inter, Arial', 500, 1], ['JetBrains Mono, monospace', 500, 0.5],
  ['Space Grotesk, Arial', 500, 3], ['Georgia, serif', 700, 0], ['Inter, Arial', 700, -0.5],
];

export function partnerLogo(name, index, kind) {
  const k = index + (kind === 'sea' ? 3 : 0);
  const mark = MARKS[k % MARKS.length]('currentColor');
  const [font, weight, ls] = FONTS[k % FONTS.length];
  const upper = k % 3 === 0;
  const label = upper ? name.toUpperCase() : name;
  const w = 44 + label.length * (upper ? 15 : 13.5);
  return {
    color: COLORS[k % COLORS.length],
    svg: `<svg viewBox="0 0 ${w} 32" role="img" aria-label="${name.replace(/&amp;/g, '&')}"><g>${mark}</g>
      <text x="42" y="23" font-family="${font}" font-weight="${weight}" font-size="${upper ? 17 : 20}" letter-spacing="${ls}" fill="currentColor">${label}</text></svg>`,
  };
}

/* ---------------- insight covers ---------------- */
export function insightCover(i) {
  if (i === 1) return containerYard({ width: 400, height: 500, seed: 31 });
  if (i === 3) return containerYard({ width: 400, height: 500, seed: 5 });
  const palettes = [
    ['#0058f8', '#2438e0', '#ff5500'],
    null,
    ['#111', '#2a2b31', '#ff5500'],
    null,
    ['#ff5500', '#ff7a33', '#0058f8'],
    ['#e9eefc', '#cfdaff', '#0058f8'],
  ];
  const [a, b, c] = palettes[i];
  const dark = i !== 5;
  let arcs = '';
  for (let k = 0; k < 7; k++) {
    const y = 120 + k * 46;
    arcs += `<path d="M-20 ${y + 80} Q200 ${y - 90 - k * 10} 420 ${y + 40}" fill="none" stroke="${dark ? '#fff' : c}" stroke-opacity="${0.12 + k * 0.04}" stroke-width="1.5" stroke-dasharray="${k % 2 ? '6 8' : '0'}"/>`;
  }
  let dots = '';
  for (let x = 20; x < 400; x += 20) for (let y = 20; y < 500; y += 20) if ((x * 7 + y * 3) % 11 < 2) dots += `<circle cx="${x}" cy="${y}" r="1.4" fill="${dark ? '#fff' : c}" opacity=".25"/>`;
  const labels = ['RATES', '', 'HS CODES', '', 'CN · SEP', 'FCL / LCL'];
  return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="ic${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="400" height="500" fill="url(#ic${i})"/>
    ${dots}${arcs}
    <circle cx="300" cy="140" r="12" fill="${c}"/><circle cx="300" cy="140" r="28" fill="none" stroke="${c}" stroke-opacity=".5"/>
    <circle cx="80" cy="330" r="8" fill="${dark ? '#fff' : a}"/>
    <text x="28" y="462" font-family="JetBrains Mono, monospace" font-size="16" letter-spacing="3" fill="${dark ? '#fff' : '#0058f8'}" opacity=".85">${labels[i]}</text>
  </svg>`;
}

/** stylised studio portrait (head + shoulders), no real people */
export function portrait(seed = 1) {
  const P = [
    { skin: '#c68a64', hair: '#1c1612', shirt: '#1f2a44', bg: ['#3a3f47', '#1d2026'], long: true },
    { skin: '#e2b896', hair: '#6b4a2f', shirt: '#2d2f33', bg: ['#6e6a62', '#34322e'], long: false },
    { skin: '#a8714f', hair: '#120e0c', shirt: '#e9e6df', bg: ['#4a4f58', '#22252b'], long: true },
    { skin: '#dcae88', hair: '#2a2420', shirt: '#26323f', bg: ['#586070', '#2a2f38'], long: false, beard: true },
  ][(seed - 1) % 4];
  const hairTop = P.long
    ? `<path d="M26 46c0-20 14-30 24-30s24 10 24 30v30c-6-2-8-12-8-22-6 4-26 4-32 0 0 10-2 20-8 22z" fill="${P.hair}"/>`
    : `<path d="M30 44c0-17 10-26 20-26s20 9 20 26c-3-7-9-10-20-10s-17 3-20 10z" fill="${P.hair}"/>`;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="pb${seed}" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="${P.bg[0]}"/><stop offset="1" stop-color="${P.bg[1]}"/></radialGradient>
      <radialGradient id="pf${seed}" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient>
      <filter id="ps${seed}"><feGaussianBlur stdDeviation=".6"/></filter>
    </defs>
    <rect width="100" height="100" fill="url(#pb${seed})"/>
    <g filter="url(#ps${seed})">
      <path d="M14 100c2-18 16-26 36-26s34 8 36 26z" fill="${P.shirt}"/>
      <path d="M42 70h16v10c-3 3-13 3-16 0z" fill="${P.skin}"/>
      <path d="M40 76l10 10 10-10" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1.5"/>
      ${P.long ? hairTop : ''}
      <ellipse cx="50" cy="48" rx="15.5" ry="19" fill="${P.skin}"/>
      <ellipse cx="50" cy="48" rx="15.5" ry="19" fill="url(#pf${seed})"/>
      ${P.long ? '' : hairTop}
      ${P.beard ? `<path d="M36 50c2 14 8 18 14 18s12-4 14-18c-3 6-8 8-14 8s-11-2-14-8z" fill="${P.hair}" opacity=".85"/>` : ''}
      <ellipse cx="44" cy="47" rx="1.6" ry="1.1" fill="#1a1412"/><ellipse cx="56" cy="47" rx="1.6" ry="1.1" fill="#1a1412"/>
      <path d="M41 43.5q3-1.6 6 0M53 43.5q3-1.6 6 0" stroke="${P.hair}" stroke-width="1.1" fill="none"/>
      <path d="M46 58q4 2.4 8 0" stroke="#7a3f33" stroke-width="1.1" fill="none"/>
    </g>
  </svg>`;
}

/** soft cloud bank for the sky behind the plane (data URL) */
export function cloudBank() {
  let blobs = '';
  let s = 9;
  const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 70; i++) {
    const x = 40 + r() * 60, y = r() * 100, rad = 3 + r() * 9;
    if (y > 20 && y < 60 && x < 70) continue;
    blobs += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}" fill="#fff" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none" width="800" height="800">
    <filter id="c" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter><g filter="url(#c)">${blobs}</g></svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

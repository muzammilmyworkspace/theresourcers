/* ==========================================================
   Side-view port scene (SVG, 1600×900 units)
   Every moving part has a class so Service.js can drive it.
   ========================================================== */

export const PORT = {
  ROAD_Y: 740,
  DECK_Y: 610,
  PICK: { x: 1146, y: 426, w: 122, h: 44 },  // container picked from the ship
  DROP_X: 830,                                // trolley x above the truck
  TROLLEY_START: 1207,
  HOOK_UP: 330,
  HOOK_PICK: 414,                             // spreader bottom touches the ship box
  HOOK_DROP: 624,                             // container sits on the trailer
  WHEEL_R: 22,
};

const C = { w: 122, h: 44, gap: 2 };
const COLORS = ['#0016cb', '#ff5500', '#1b1b1f', '#e6e9f0', '#2438e0', '#ff7a33', '#3b3d44', '#c9cfdc'];

function box(x, y, color, cls = '', label = '') {
  const light = ['#e6e9f0', '#c9cfdc'].includes(color);
  let ribs = '';
  for (let i = 8; i < C.w - 4; i += 7.4) ribs += `M${(x + i).toFixed(1)} ${y + 4}V${y + C.h - 4}`;
  return `<g class="${cls}">
    <rect x="${x}" y="${y}" width="${C.w}" height="${C.h}" rx="1.5" fill="${color}"/>
    <path d="${ribs}" stroke="${light ? '#00000018' : '#00000033'}" stroke-width="1"/>
    <rect x="${x}" y="${y}" width="${C.w}" height="2.5" fill="#fff" opacity="${light ? 0.55 : 0.2}"/>
    <rect x="${x}" y="${y + C.h - 3}" width="${C.w}" height="3" fill="#000" opacity=".25"/>
    ${label ? `<text x="${x + C.w / 2}" y="${y + C.h / 2 + 4}" text-anchor="middle" font-family="Space Grotesk, Arial" font-weight="700" font-size="11" letter-spacing="2" fill="#fff" opacity=".9">${label}</text>` : ''}
  </g>`;
}

function ship() {
  const { DECK_Y } = PORT;
  const heights = [3, 3, 2, 3];
  const colX = [1020, 1146, 1272, 1398];
  let stacks = '';
  let n = 0;
  colX.forEach((x, i) => {
    for (let k = 0; k < heights[i]; k++) {
      const y = DECK_Y - (k + 1) * (C.h + C.gap);
      stacks += box(x, y, COLORS[(n++ * 5 + i) % COLORS.length]);
    }
  });
  return `<g class="svc-ship">
    <path d="M985 ${DECK_Y} H1595 L1580 760 H1010 Z" fill="#1b1d26"/>
    <rect x="985" y="${DECK_Y}" width="610" height="10" fill="#ff5500"/>
    <rect x="985" y="${DECK_Y + 10}" width="610" height="4" fill="#fff" opacity=".2"/>
    <g>
      <rect x="1528" y="440" width="58" height="${DECK_Y - 440}" fill="#eef1f8"/>
      <rect x="1522" y="430" width="70" height="14" fill="#1b1d26"/>
      <rect x="1534" y="452" width="46" height="8" fill="#1b1d26" opacity=".85"/>
      <rect x="1534" y="472" width="46" height="4" fill="#1b1d26" opacity=".25"/>
      <rect x="1534" y="488" width="46" height="4" fill="#1b1d26" opacity=".25"/>
      <rect x="1556" y="380" width="8" height="50" fill="#1b1d26"/>
      <rect x="1552" y="372" width="16" height="10" fill="#ff5500"/>
    </g>
    ${stacks}
    ${box(PORT.PICK.x, PORT.PICK.y, '#0016cb', 'svc-shipbox', 'THE SOURCERS')}
  </g>`;
}

function crane() {
  const blue = '#0016cb', dark = '#0b0f3a';
  const leg = (x) => `<rect x="${x}" y="300" width="18" height="${PORT.ROAD_Y - 300}" fill="${blue}"/>
    <rect x="${x - 10}" y="${PORT.ROAD_Y - 14}" width="38" height="14" rx="2" fill="${dark}"/>`;
  return `<g class="svc-crane">
    ${leg(700)} ${leg(960)}
    <rect x="700" y="552" width="278" height="12" fill="${blue}"/>
    <path d="M718 564 L960 360" stroke="${blue}" stroke-width="7"/>
    <path d="M960 564 L718 360" stroke="${blue}" stroke-width="7" opacity=".55"/>
    <rect x="690" y="300" width="298" height="22" fill="${blue}"/>
    <!-- boom -->
    <rect x="650" y="250" width="940" height="20" fill="${blue}"/>
    <path d="M650 250 H1590" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>
    <path d="M660 270 ${Array.from({ length: 23 }, (_, i) => `L${680 + i * 40} ${i % 2 ? 270 : 256}`).join(' ')}" stroke="#fff" stroke-opacity=".18" stroke-width="2" fill="none"/>
    <!-- A-frame + stays -->
    <path d="M760 250 L830 110 L900 250" stroke="${blue}" stroke-width="12" fill="none" stroke-linejoin="round"/>
    <path d="M830 110 L660 252 M830 110 L1580 252" stroke="${dark}" stroke-width="3"/>
    <circle cx="830" cy="110" r="7" fill="#ff5500"/>
    <!-- machinery house -->
    <rect x="740" y="212" width="170" height="38" rx="2" fill="#eef1f8"/>
    <text x="825" y="237" text-anchor="middle" font-family="Space Grotesk, Arial" font-weight="700" font-size="14" letter-spacing="4" fill="${blue}">THE SOURCERS</text>
    <!-- trolley + hook (driven from JS) -->
    <g class="svc-trolley">
      <rect x="-38" y="270" width="76" height="22" rx="2" fill="${dark}"/>
      <rect x="-30" y="274" width="20" height="8" fill="#ffd9c2" opacity=".8"/>
      <g class="svc-swing">
        <line class="svc-cable" x1="-44" y1="292" x2="-52" y2="${PORT.HOOK_UP}" stroke="#1b1b1f" stroke-width="2"/>
        <line class="svc-cable" x1="44" y1="292" x2="52" y2="${PORT.HOOK_UP}" stroke="#1b1b1f" stroke-width="2"/>
        <g class="svc-hook">
          <rect x="-64" y="0" width="128" height="12" rx="2" fill="#ffb800"/>
          <rect x="-64" y="0" width="128" height="3" fill="#fff" opacity=".4"/>
          ${box(-61, 12, '#0016cb', 'svc-hookbox', 'THE SOURCERS')}
        </g>
      </g>
    </g>
  </g>`;
}

function wheel(cx, cy) {
  const r = PORT.WHEEL_R;
  return `<g class="svc-wheel" data-cx="${cx}" data-cy="${cy}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#15161a"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="#c9cfdc"/>
    <path d="M${cx - r * 0.5} ${cy}H${cx + r * 0.5}M${cx} ${cy - r * 0.5}V${cy + r * 0.5}" stroke="#15161a" stroke-width="3"/>
    <circle cx="${cx}" cy="${cy}" r="3" fill="#ff5500"/>
  </g>`;
}

function truck() {
  const y = PORT.ROAD_Y;
  const deck = y - 60;
  return `<g class="svc-truck">
    <g class="svc-truck-body">
      <!-- trailer -->
      <rect x="742" y="${deck}" width="176" height="10" fill="#1b1b1f"/>
      <rect x="742" y="${deck + 10}" width="176" height="8" fill="#3b3d44"/>
      <rect x="760" y="${deck + 18}" width="80" height="10" fill="#1b1b1f"/>
      ${box(769, deck - C.h, '#0016cb', 'svc-truckbox', 'THE SOURCERS')}
      <!-- cab (facing right) -->
      <path d="M918 ${deck + 18} V${deck - 58} Q918 ${deck - 66} 926 ${deck - 66} H990 Q1004 ${deck - 66} 1010 ${deck - 50} L1024 ${deck - 14} V${deck + 18} Z" fill="#ff5500"/>
      <path d="M972 ${deck - 58} H992 Q1000 ${deck - 58} 1004 ${deck - 48} L1012 ${deck - 26} H972 Z" fill="#cfe0ff"/>
      <rect x="930" y="${deck - 56}" width="34" height="30" rx="2" fill="#cfe0ff" opacity=".9"/>
      <rect x="918" y="${deck - 8}" width="106" height="6" fill="#000" opacity=".15"/>
      <rect x="1016" y="${deck}" width="10" height="8" rx="1" fill="#ffe7a8"/>
      <rect x="912" y="${deck - 70}" width="6" height="58" fill="#3b3d44"/>
      <text x="940" y="${deck + 10}" font-family="JetBrains Mono, monospace" font-size="9" fill="#fff" opacity=".85">TS-01</text>
    </g>
    ${wheel(776, y - PORT.WHEEL_R)} ${wheel(826, y - PORT.WHEEL_R)} ${wheel(948, y - PORT.WHEEL_R)} ${wheel(1000, y - PORT.WHEEL_R)}
  </g>`;
}

function skyline() {
  // distant port silhouettes on the horizon
  let s = '';
  const cranes = [[120, 0.5], [260, 0.42], [1700, 0.5], [2100, 0.45], [2500, 0.55], [2950, 0.4], [3600, 0.5], [4100, 0.46], [4700, 0.55], [5200, 0.42]];
  cranes.forEach(([x, k]) => {
    const h = 260 * k, top = 540 - h;
    s += `<path d="M${x} 540 V${top} M${x + 60 * k} 540 V${top} M${x - 120 * k} ${top} H${x + 200 * k} M${x + 30 * k} ${top - 40 * k} L${x - 120 * k} ${top} M${x + 30 * k} ${top - 40 * k} L${x + 200 * k} ${top}" stroke="#b7c4ea" stroke-width="${5 * k}" fill="none"/>`;
  });
  for (let x = 1800; x < 5800; x += 90) s += `<rect x="${x}" y="${540 - 20 - (x % 7) * 6}" width="70" height="${20 + (x % 7) * 6}" fill="#c3cff0"/>`;
  return `<g class="svc-skyline">${s}</g>`;
}

export function portScene() {
  const { ROAD_Y } = PORT;
  return `<svg class="svc-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="svcSea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9fb4ec"/>
        <stop offset="1" stop-color="#2b3f9a"/>
      </linearGradient>
      <linearGradient id="svcSheen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".5" stop-color="#fff" stop-opacity=".55"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g class="svc-cam">
      <rect x="-4000" y="540" width="10000" height="${ROAD_Y - 540}" fill="url(#svcSea)"/>
      <g opacity=".35" stroke="#fff" stroke-width="2">
        ${Array.from({ length: 30 }, (_, i) => `<line x1="${-600 + i * 190}" y1="${580 + (i % 5) * 28}" x2="${-540 + i * 190}" y2="${580 + (i % 5) * 28}"/>`).join('')}
      </g>
      <g class="svc-world">
        ${skyline()}
        ${ship()}
        ${crane()}
      </g>
      <g class="svc-road">
        <rect x="-4000" y="${ROAD_Y}" width="10000" height="400" fill="#24252b"/>
        <rect x="-4000" y="${ROAD_Y}" width="10000" height="6" fill="#d3d9e6"/>
        <line class="svc-road-dash" x1="-4000" y1="${ROAD_Y + 70}" x2="6000" y2="${ROAD_Y + 70}" stroke="#f4f4f4" stroke-width="6" stroke-dasharray="70 60"/>
        <rect class="svc-sheen" x="-900" y="${ROAD_Y}" width="700" height="400" fill="url(#svcSheen)" opacity="0"/>
      </g>
      ${truck()}
    </g>
  </svg>`;
}

/* ---------------- top-down truck (faces up, pivot at hitch) ---------------- */
export function topTruck() {
  let ribs = '';
  for (let y = 132; y < 390; y += 9) ribs += `M18 ${y}H102`;
  return `<svg class="svc-top-truck-svg" viewBox="0 0 120 420" aria-hidden="true">
    <g class="svc-top-trailer" style="transform-origin: 60px 120px">
      <rect x="14" y="122" width="92" height="276" rx="3" fill="#0016cb"/>
      <path d="${ribs}" stroke="#000" stroke-opacity=".22" stroke-width="1.5"/>
      <rect x="14" y="122" width="92" height="276" rx="3" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>
      <text x="60" y="262" text-anchor="middle" transform="rotate(-90 60 262)" font-family="Space Grotesk, Arial" font-weight="700" font-size="14" letter-spacing="5" fill="#fff">THE SOURCERS</text>
      <rect x="8" y="330" width="6" height="40" rx="2" fill="#15161a"/><rect x="106" y="330" width="6" height="40" rx="2" fill="#15161a"/>
    </g>
    <g class="svc-top-cab">
      <rect x="8" y="80" width="6" height="30" rx="2" fill="#15161a"/><rect x="106" y="80" width="6" height="30" rx="2" fill="#15161a"/>
      <path d="M18 116 V40 Q18 16 42 14 H78 Q102 16 102 40 V116 Z" fill="#ff5500"/>
      <path d="M26 44 Q26 28 44 26 H76 Q94 28 94 44 V52 H26 Z" fill="#cfe0ff"/>
      <rect x="30" y="64" width="60" height="44" rx="4" fill="#000" opacity=".12"/>
      <rect x="22" y="10" width="16" height="6" rx="2" fill="#ffe7a8"/><rect x="82" y="10" width="16" height="6" rx="2" fill="#ffe7a8"/>
    </g>
  </svg>`;
}

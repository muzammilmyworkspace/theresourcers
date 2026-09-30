/* Code-generated illustrations (no external art needed). */

const rng = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const PALETTE = ['#0016cb', '#ff5500', '#1b1b1f', '#e9ebf0', '#2438e0', '#ff7a33', '#3b3d44', '#c9cfdc', '#0016cb', '#f4f4f4'];

function container(x, y, w, h, color, r) {
  const ribs = [];
  const step = w / Math.round(w / 7);
  for (let i = step; i < w - 1; i += step) {
    ribs.push(`<line x1="${(x + i).toFixed(1)}" y1="${(y + 3).toFixed(1)}" x2="${(x + i).toFixed(1)}" y2="${(y + h - 3).toFixed(1)}"/>`);
  }
  const light = ['#e9ebf0', '#f4f4f4', '#c9cfdc'].includes(color);
  const doors = r() > 0.6
    ? `<g stroke="${light ? '#0000002e' : '#ffffff3a'}" stroke-width="1.4"><line x1="${x + w * 0.5}" y1="${y + 4}" x2="${x + w * 0.5}" y2="${y + h - 4}"/><line x1="${x + w * 0.3}" y1="${y + 6}" x2="${x + w * 0.3}" y2="${y + h - 6}"/><line x1="${x + w * 0.7}" y1="${y + 6}" x2="${x + w * 0.7}" y2="${y + h - 6}"/></g>`
    : '';
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${color}"/>
    <g stroke="${light ? '#00000017' : '#0000002e'}" stroke-width="1">${ribs.join('')}</g>
    <rect x="${x}" y="${y}" width="${w}" height="2.5" fill="#ffffff" opacity="${light ? 0.6 : 0.18}"/>
    <rect x="${x}" y="${y + h - 3}" width="${w}" height="3" fill="#000" opacity=".22"/>
    ${doors}
  </g>`;
}

function crane(x, groundY, s, color) {
  const h = 330 * s, w = 120 * s;
  return `<g fill="none" stroke="${color}" stroke-width="${4 * s}" stroke-linecap="round">
    <line x1="${x}" y1="${groundY}" x2="${x}" y2="${groundY - h}"/>
    <line x1="${x + w}" y1="${groundY}" x2="${x + w}" y2="${groundY - h}"/>
    <line x1="${x}" y1="${groundY - h * 0.55}" x2="${x + w}" y2="${groundY - h * 0.55}"/>
    <line x1="${x}" y1="${groundY - h * 0.55}" x2="${x + w}" y2="${groundY - h}"/>
    <line x1="${x - 150 * s}" y1="${groundY - h}" x2="${x + w + 260 * s}" y2="${groundY - h}"/>
    <line x1="${x + w * 0.5}" y1="${groundY - h - 60 * s}" x2="${x - 150 * s}" y2="${groundY - h}"/>
    <line x1="${x + w * 0.5}" y1="${groundY - h - 60 * s}" x2="${x + w + 260 * s}" y2="${groundY - h}"/>
    <line x1="${x + w + 180 * s}" y1="${groundY - h}" x2="${x + w + 180 * s}" y2="${groundY - h + 90 * s}" stroke-width="${1.5 * s}"/>
  </g>`;
}

/** Port container yard at dawn — portrait or landscape */
export function containerYard({ width = 800, height = 1000, seed = 7 } = {}) {
  const r = rng(seed);
  const ground = height * 0.86;
  let back = '', front = '';

  // back rows (smaller, hazier)
  const bw = 78, bh = 30;
  for (let x = -20; x < width; x += bw + 3) {
    const stack = 2 + Math.floor(r() * 4);
    for (let k = 0; k < stack; k++) back += container(x, ground - 120 - (k + 1) * (bh + 2), bw, bh, PALETTE[Math.floor(r() * PALETTE.length)], r);
  }
  // front rows
  const fw = 150, fh = 58;
  for (let x = -40; x < width; x += fw + 5) {
    const stack = 1 + Math.floor(r() * 4);
    for (let k = 0; k < stack; k++) front += container(x, ground - (k + 1) * (fh + 3), fw, fh, PALETTE[Math.floor(r() * PALETTE.length)], r);
  }

  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Container yard at dawn">
    <defs>
      <linearGradient id="sky${seed}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#cfdcff"/>
        <stop offset=".55" stop-color="#eef1fb"/>
        <stop offset="1" stop-color="#ffd9c2"/>
      </linearGradient>
      <radialGradient id="sun${seed}" cx=".72" cy=".62" r=".35">
        <stop offset="0" stop-color="#ff7a33" stop-opacity=".55"/>
        <stop offset="1" stop-color="#ff7a33" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="haze${seed}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#eef1fb" stop-opacity="0"/>
        <stop offset="1" stop-color="#eef1fb" stop-opacity=".7"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#sky${seed})"/>
    <rect width="100%" height="100%" fill="url(#sun${seed})"/>
    <circle cx="${width * 0.72}" cy="${height * 0.6}" r="${width * 0.07}" fill="#ff7a33" opacity=".85"/>
    ${crane(width * 0.08, ground - 110, 1.05, '#9fb0e0')}
    ${crane(width * 0.58, ground - 110, 0.8, '#b7c4ea')}
    <g opacity=".75">${back}</g>
    <rect x="0" y="${ground - 260}" width="${width}" height="160" fill="url(#haze${seed})"/>
    ${front}
    <rect x="0" y="${ground}" width="${width}" height="${height - ground}" fill="#15161a"/>
    <g stroke="#ffffff" stroke-opacity=".5" stroke-width="3" stroke-dasharray="40 30"><line x1="0" y1="${ground + (height - ground) * 0.5}" x2="${width}" y2="${ground + (height - ground) * 0.5}"/></g>
  </svg>`;
}

/** aerial view of winding elevated highways with traffic (small intro photo) */
export function aerialRoads({ width = 488, height = 308, seed = 4 } = {}) {
  const r = rng(seed);
  let trees = '';
  for (let i = 0; i < 260; i++) {
    const x = r() * width, y = r() * height, rad = 3 + r() * 9;
    const g = 40 + Math.floor(r() * 50);
    trees += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}" fill="rgb(${g - 10},${g + 25},${g - 15})"/>`;
  }
  const roads = [0, 1, 2].map((k) => {
    const x0 = 70 + k * 150;
    return `M${x0} -20 C${x0 + 120} 60 ${x0 - 110} 110 ${x0 + 10} 170 S${x0 + 130} 270 ${x0 - 10} 330`;
  });
  let cars = '';
  roads.forEach((d, k) => {
    for (let i = 0; i < 9; i++) {
      const col = ['#f4f4f4', '#d7dbe3', '#1b1b1f', '#c53b2b', '#e9e2cf'][Math.floor(r() * 5)];
      cars += `<rect width="7" height="4" rx="1" fill="${col}"><animateMotion dur="${9 + k * 2 + r() * 4}s" begin="-${(r() * 12).toFixed(1)}s" repeatCount="indefinite" rotate="auto" path="${d}"/></rect>`;
    }
  });
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Aerial view of highways">
    <rect width="100%" height="100%" fill="#34402f"/>
    <g opacity=".95">${trees}</g>
    ${roads.map((d) => `<path d="${d}" fill="none" stroke="#1e211e" stroke-opacity=".35" stroke-width="40" transform="translate(6 8)"/>`).join('')}
    ${roads.map((d) => `<path d="${d}" fill="none" stroke="#9a9c98" stroke-width="30"/><path d="${d}" fill="none" stroke="#c9cbc6" stroke-width="30" stroke-dasharray="1 7" opacity=".25"/><path d="${d}" fill="none" stroke="#eceae2" stroke-width="1.2" stroke-dasharray="8 8"/>`).join('')}
    ${cars}
    <rect width="100%" height="100%" fill="url(#vig${seed})"/>
    <defs><radialGradient id="vig${seed}"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient></defs>
  </svg>`;
}

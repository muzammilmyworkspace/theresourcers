import { geoEquirectangular, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import land110 from 'world-atlas/land-110m.json';

let mask = null;

/** Rasterises world land once, then answers isLand(lat, lng) from pixels. */
export function getLandMask() {
  if (mask) return mask;
  const W = 1440, H = 720;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
  const path = geoPath(proj, ctx);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  path(feature(land110, land110.objects.land));
  ctx.fill();
  const data = ctx.getImageData(0, 0, W, H).data;

  mask = {
    isLand(lat, lng) {
      const x = Math.floor(((lng + 180) / 360) * W) % W;
      const y = Math.floor(((90 - lat) / 180) * H);
      if (y < 0 || y >= H) return false;
      return data[(y * W + x) * 4 + 3] > 128;
    },
  };
  return mask;
}

/** Key sourcing & shipping hubs (used for highlighted dots and globe arcs) */
export const HUBS = [
  { name: 'Shanghai', lat: 31.23, lng: 121.47 },
  { name: 'Shenzhen', lat: 22.54, lng: 114.06 },
  { name: 'Ho Chi Minh', lat: 10.82, lng: 106.63 },
  { name: 'Dhaka', lat: 23.81, lng: 90.41 },
  { name: 'Karachi', lat: 24.86, lng: 67.01 },
  { name: 'Mumbai', lat: 19.08, lng: 72.88 },
  { name: 'Istanbul', lat: 41.01, lng: 28.98 },
  { name: 'Bangkok', lat: 13.76, lng: 100.5 },
  { name: 'Dubai', lat: 25.2, lng: 55.27 },
  { name: 'Rotterdam', lat: 51.92, lng: 4.48 },
  { name: 'London', lat: 51.51, lng: -0.13 },
  { name: 'New York', lat: 40.71, lng: -74.0 },
  { name: 'Los Angeles', lat: 34.05, lng: -118.24 },
];

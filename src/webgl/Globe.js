import * as THREE from 'three';
import { gsap } from 'gsap';
import { getLandMask, HUBS } from '../core/landMask.js';
import { bp, isTouch, random } from '../core/helpers.js';

/* lat/lng → point on a sphere (camera looks down -Z) */
const toVec = (lat, lng, r = 1) => {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
};

const ROUTES = [
  ['Shanghai', 'Los Angeles'], ['Shenzhen', 'Rotterdam'], ['Karachi', 'London'],
  ['Ho Chi Minh', 'New York'], ['Dhaka', 'Rotterdam'], ['Mumbai', 'Dubai'],
  ['Istanbul', 'London'], ['Bangkok', 'Dubai'], ['Shanghai', 'Karachi'], ['Shenzhen', 'Dubai'],
];
const LABELS = ['Shanghai', 'Karachi', 'Dubai', 'Rotterdam', 'Ho Chi Minh', 'Istanbul', 'Los Angeles'];

const COLOR_FRONT = new THREE.Color('#ffffff');
const COLOR_ARC = new THREE.Color('#ff6a1a');

/* ---------------- shaders ---------------- */
const dotsVert = /* glsl */ `
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vFacing;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * position);
    vFacing = dot(n, normalize(-mv.xyz));
    gl_PointSize = uSize * uPixelRatio * (2.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const dotsFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uBack;
  uniform float uOpacity;
  varying float vFacing;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    float front = smoothstep(-0.05, 0.35, vFacing);
    float a = mix(uBack, 0.95, front);
    gl_FragColor = vec4(mix(vec3(0.45, 0.5, 0.75), uColor, front), a * uOpacity);
  }`;

const sphereVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const sphereFrag = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    float f = 1.0 - max(dot(vN, vView), 0.0);
    // sun from the upper-left: warm rim there, cool blue rim lower-right
    float side = clamp(dot(normalize(vN.xy + 1e-4), normalize(vec2(-0.7, 0.7))) * 0.5 + 0.5, 0.0, 1.0);
    vec3 warm = vec3(1.0, 0.42, 0.1);
    vec3 cool = vec3(0.12, 0.35, 1.0);
    vec3 rimCol = mix(cool, warm, smoothstep(0.35, 0.9, side));
    vec3 body = vec3(0.008, 0.008, 0.02) + cool * 0.04 * (1.0 - side);
    vec3 col = body + rimCol * pow(f, 5.0) * 1.15;
    gl_FragColor = vec4(col, uOpacity);
  }`;

const atmoFrag = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    float f = 1.0 - max(dot(vN, vView), 0.0);
    float i = pow(f, 3.2) * (1.0 - smoothstep(0.72, 1.0, f)) * 1.5;
    float side = clamp(dot(normalize(vN.xy + 1e-4), normalize(vec2(-0.7, 0.7))) * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(vec3(0.12, 0.35, 1.0), vec3(1.0, 0.45, 0.12), smoothstep(0.35, 0.9, side));
    gl_FragColor = vec4(col * i, i * uOpacity);
  }`;

const arcVert = /* glsl */ `
  varying float vT;
  void main() {
    vT = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const arcFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uHead;
  uniform float uLen;
  uniform float uOpacity;
  varying float vT;
  void main() {
    float trail = smoothstep(uHead - uLen, uHead, vT) * step(vT, uHead);
    float base = 0.14;
    float a = max(trail, base);
    gl_FragColor = vec4(uColor, a * uOpacity);
  }`;

/* ------------------------------------------------------------ */
export class Globe {
  phi = 0;
  tilt = 0.32;
  velocity = 0;
  dragging = false;
  visible = true;
  opacity = { v: 1 };

  constructor({ canvas, labelsWrap }) {
    this.canvas = canvas;
    this.labelsWrap = labelsWrap;
  }

  init() {
    const { canvas } = this;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.z = bp.isMobile() ? 3.9 : 3.75;

    this.root = new THREE.Group();
    this.spin = new THREE.Group();
    this.root.add(this.spin);
    this.scene.add(this.root);

    this.buildSphere();
    this.buildDots();
    this.buildPins();
    this.buildArcs();
    this.buildLabels();

    // face Asia on load
    const focus = toVec(24, 62);
    this.phi = Math.atan2(-focus.x, focus.z);

    this.resize();
    this.ro = new ResizeObserver(() => requestAnimationFrame(() => this.resize()));
    this.ro.observe(canvas.parentElement);

    this.io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting), { rootMargin: '100px' });
    this.io.observe(canvas);

    if (!bp.isMobile() && !isTouch()) this.bindDrag();
    this.last = performance.now();
    gsap.ticker.add(this.tick);
  }

  /* ---------------- build ---------------- */
  buildSphere() {
    this.sphereMat = new THREE.ShaderMaterial({
      vertexShader: sphereVert, fragmentShader: sphereFrag,
      uniforms: { uOpacity: { value: 1 } },
      transparent: true, depthWrite: true,
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.985, 64, 64), this.sphereMat);
    sphere.renderOrder = 1;
    this.spin.add(sphere);

    this.atmoMat = new THREE.ShaderMaterial({
      vertexShader: sphereVert, fragmentShader: atmoFrag,
      uniforms: { uOpacity: { value: 1 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.08, 64, 64), this.atmoMat);
    atmo.renderOrder = 3;
    this.root.add(atmo);
  }

  buildDots() {
    const land = getLandMask();
    const step = bp.isMobile() ? 1.8 : 1.3;
    const pts = [];
    for (let lat = -80; lat <= 84; lat += step) {
      const n = Math.max(1, Math.round((360 * Math.cos(THREE.MathUtils.degToRad(lat))) / step));
      for (let i = 0; i < n; i++) {
        const lng = -180 + (i * 360) / n;
        if (land.isLand(lat, lng)) {
          const v = toVec(lat, lng, 1);
          pts.push(v.x, v.y, v.z);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.dotsMat = new THREE.ShaderMaterial({
      vertexShader: dotsVert, fragmentShader: dotsFrag,
      uniforms: {
        uSize: { value: bp.isMobile() ? 3.0 : 2.6 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uColor: { value: COLOR_FRONT },
        uBack: { value: 0.15 },
        uOpacity: { value: 1 },
      },
      transparent: true, depthWrite: true,
    });
    const dots = new THREE.Points(geo, this.dotsMat);
    dots.renderOrder = 0;
    this.spin.add(dots);
  }

  buildPins() {
    this.pins = [];
    const pinGeo = new THREE.SphereGeometry(0.014, 16, 16);
    const ringGeo = new THREE.RingGeometry(0.018, 0.024, 40);
    const pinMat = new THREE.MeshBasicMaterial({ color: COLOR_ARC, transparent: true });
    HUBS.forEach((h) => {
      const pos = toVec(h.lat, h.lng, 1.002);
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(pos);
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: COLOR_ARC, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      ring.position.copy(pos);
      ring.lookAt(pos.clone().multiplyScalar(2));
      pin.renderOrder = ring.renderOrder = 2;
      this.spin.add(pin, ring);
      this.pins.push({ ring, offset: Math.random() * Math.PI * 2 });
    });
  }

  buildArcs() {
    this.arcs = [];
    const byName = Object.fromEntries(HUBS.map((h) => [h.name, h]));
    ROUTES.forEach(([a, b]) => {
      const A = byName[a], B = byName[b];
      const v1 = toVec(A.lat, A.lng, 1.003);
      const v2 = toVec(B.lat, B.lng, 1.003);
      const dist = v1.distanceTo(v2);
      const lift = 1 + dist * 0.28;
      const c1 = v1.clone().lerp(v2, 0.25).normalize().multiplyScalar(lift);
      const c2 = v1.clone().lerp(v2, 0.75).normalize().multiplyScalar(lift);
      const curve = new THREE.CubicBezierCurve3(v1, c1, c2, v2);
      const mat = new THREE.ShaderMaterial({
        vertexShader: arcVert, fragmentShader: arcFrag,
        uniforms: { uColor: { value: COLOR_ARC }, uHead: { value: 0 }, uLen: { value: 0.35 }, uOpacity: { value: 1 } },
        transparent: true, depthWrite: false,
      });
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.0032, 6, false), mat);
      mesh.renderOrder = 2;
      this.spin.add(mesh);
      const tw = gsap.fromTo(mat.uniforms.uHead, { value: 0 }, {
        value: 1.35, duration: random(2.4, 3.6), ease: 'power1.inOut',
        repeat: -1, repeatDelay: random(0.4, 1.6), delay: random(0, 2.5),
      });
      this.arcs.push({ mesh, mat, tw });
    });
  }

  buildLabels() {
    this.labels = [];
    if (!this.labelsWrap) return;
    const byName = Object.fromEntries(HUBS.map((h) => [h.name, h]));
    LABELS.forEach((name) => {
      const h = byName[name];
      const el = document.createElement('div');
      el.className = 'globe-label';
      el.innerHTML = `<span class="globe-label-text mono">${name}</span>`;
      this.labelsWrap.appendChild(el);
      this.labels.push({ el, pos: toVec(h.lat, h.lng, 1.02) });
    });
  }

  /* ---------------- interaction ---------------- */
  bindDrag() {
    const c = this.canvas;
    let lastX = 0, lastY = 0;
    c.style.cursor = 'grab';
    c.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      c.setPointerCapture(e.pointerId);
      c.style.cursor = 'grabbing';
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      this.velocity = dx * 0.005;
      this.phi += this.velocity;
      this.tilt = THREE.MathUtils.clamp(this.tilt + dy * 0.003, -0.4, 0.9);
    });
    const end = () => { this.dragging = false; c.style.cursor = 'grab'; };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
  }

  /* ---------------- loop ---------------- */
  tick = () => {
    const now = performance.now();
    const dt = Math.min(now - this.last, 50);
    this.last = now;
    if (!this.visible) return;

    if (!this.dragging) {
      this.velocity *= 0.95;
      this.phi += 0.0015 * (dt / 16.666) + this.velocity;
      this.tilt += (0.32 - this.tilt) * 0.02;
    }
    this.spin.rotation.y = this.phi;
    this.root.rotation.x = this.tilt;

    const t = now * 0.001;
    this.pins.forEach(({ ring, offset }) => {
      const k = (t * 0.8 + offset) % 1;
      ring.scale.setScalar(1 + k * 1.6);
      ring.material.opacity = (1 - k) * 0.8 * this.opacity.v;
    });

    this.renderer.render(this.scene, this.camera);
    this.updateLabels();
  };

  updateLabels() {
    if (!this.labels.length) return;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const camDir = new THREE.Vector3();
    const v = new THREE.Vector3();
    this.labels.forEach(({ el, pos }) => {
      v.copy(pos).applyMatrix4(this.spin.matrixWorld);
      camDir.copy(this.camera.position).sub(v).normalize();
      const facing = v.clone().normalize().dot(camDir);
      v.project(this.camera);
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-v.y * 0.5 + 0.5) * h;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = gsap.utils.clamp(0, 1, (facing - 0.15) * 4).toFixed(2);
    });
  }

  resize() {
    const p = this.canvas.parentElement;
    const w = p.clientWidth, h = p.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setOpacity(v) {
    this.opacity.v = v;
    this.sphereMat.uniforms.uOpacity.value = v;
    this.dotsMat.uniforms.uOpacity.value = v;
    this.atmoMat.uniforms.uOpacity.value = v;
    this.arcs.forEach((a) => (a.mat.uniforms.uOpacity.value = v));
  }

  destroy() {
    gsap.ticker.remove(this.tick);
    this.ro?.disconnect();
    this.io?.disconnect();
    this.arcs.forEach((a) => a.tw.kill());
    this.labels.forEach((l) => l.el.remove());
    this.scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
    this.renderer.dispose();
  }
}

import * as THREE from 'three';
import { gsap } from 'gsap';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { WakeSimulation } from './WakeSimulation.js';
import { buildShipCanvas } from './shipTexture.js';

/**
 * Top-down real-time ocean.
 *  - procedural simplex-noise normals (octaves fade with pixel footprint → no shimmer)
 *  - wake normals + foam from the GPU height field
 *  - analytic Kelvin-V side foam and centre wash
 *  - soft-knee sun glints, screen-space blue glows
 * Camera height is driven from outside (setHeight) so the 2D ship on top
 * stays locked to the water as it zooms.
 */

const SHIP_L = 11;
const SHIP_W = 2.2;
const BOUNDS = 60;

const noiseGLSL = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }
`;

const vert = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const frag = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uWake;
  uniform float uBounds;
  uniform vec2  uRes;
  uniform vec3  uSunDir;
  uniform float uHeightScale;
  uniform float uWakeIntensity;
  uniform float uShipL;
  uniform float uShipW;
  uniform float uPx;          // world units per pixel
  varying vec3 vWorld;

  ${noiseGLSL}

  // octaves fade out when they get smaller than ~3 pixels (no shimmering when zoomed out)
  float oct(vec2 p, float freq, float speed, vec2 dir, float amp) {
    float w = 1.0 - smoothstep(0.12, 0.35, uPx * freq);
    if (w <= 0.0) return 0.0;
    return snoise(vec3(p * freq + dir * uTime * speed, uTime * speed * 0.6)) * amp * w;
  }
  float waves(vec2 p) {
    return oct(p, 0.06, 0.18, vec2(0.3, 1.0), 1.0)
         + oct(p, 0.19, 0.35, vec2(-0.6, 0.8), 0.45)
         + oct(p, 0.55, 0.6, vec2(0.9, 0.2), 0.18)
         + oct(p, 1.6, 0.9, vec2(-0.2, -1.0), 0.07);
  }
  float ridge(vec2 p) { return 1.0 - abs(snoise(vec3(p, uTime * 0.4))); }

  void main() {
    vec2 p = vWorld.xz;

    // ---- ambient normal ----
    float e = max(0.04, uPx * 1.5);
    float h0 = waves(p);
    float hx = waves(p + vec2(e, 0.0));
    float hz = waves(p + vec2(0.0, e));
    vec3 N = normalize(vec3(-(hx - h0) / e * 0.32, 1.0, -(hz - h0) / e * 0.32));

    // ---- ship-local frame (bow toward -Z) ----
    float halfL = uShipL * 0.5;
    float depth = p.y - halfL;                 // distance behind the stern
    float ax = abs(p.x);
    float channel = uShipW * 0.5 + 0.28 * max(depth, 0.0);
    float inWake = step(0.0, depth) * (1.0 - smoothstep(channel, channel + 1.5, ax)) * (1.0 - smoothstep(10.0, 34.0, depth));
    N = normalize(mix(N, vec3(0.0, 1.0, 0.0), inWake * 0.85));

    // ---- GPU wake ----
    vec2 wuv = p / uBounds + 0.5;
    float wakeH = 0.0, lap = 0.0;
    if (wuv.x > 0.0 && wuv.x < 1.0 && wuv.y > 0.0 && wuv.y < 1.0) {
      vec2 tx = vec2(3.2 / 256.0);
      wakeH = texture2D(uWake, wuv).r;
      float l = texture2D(uWake, wuv - vec2(tx.x, 0.0)).r;
      float r = texture2D(uWake, wuv + vec2(tx.x, 0.0)).r;
      float d = texture2D(uWake, wuv - vec2(0.0, tx.y)).r;
      float u = texture2D(uWake, wuv + vec2(0.0, tx.y)).r;
      lap = l + r + d + u - 4.0 * wakeH;
      float edge = smoothstep(0.0, 0.08, wuv.x) * smoothstep(1.0, 0.92, wuv.x) * smoothstep(0.0, 0.08, wuv.y) * smoothstep(1.0, 0.92, wuv.y);
      vec3 wn = vec3(-(r - l), 0.0, -(u - d)) * 2.5 * uHeightScale * edge;
      N = normalize(N + wn);
    }

    // ---- foam (only behind / beside the hull) ----
    float intensity = uWakeIntensity / 0.4;
    float behind = step(-halfL * 1.1, p.y);
    float crest = smoothstep(0.83, 1.4, -lap * 38.0) * (0.55 + 0.45 * ridge(p * 1.3));
    float vLine = ax - (uShipW * 0.45 + max(depth, 0.0) * 0.36);
    float vFoam = exp(-vLine * vLine * 18.0 / (1.0 + max(depth, 0.0) * 0.08)) * smoothstep(-halfL * 1.0, -halfL * 0.55, p.y);
    float bubbles = ridge(p * 2.2) * 0.6 + ridge(p * 5.0 + 7.0) * 0.3 + ridge(p * 11.0) * 0.1;
    vFoam *= smoothstep(0.35, 0.8, bubbles) * exp(-max(depth, 0.0) * 0.05);
    float wash = exp(-ax * ax / (uShipW * uShipW * 0.12 + max(depth, 0.0) * 0.12)) * step(0.0, depth)
               * exp(-depth * 0.045) * smoothstep(0.3, 0.75, bubbles);
    float foam = clamp((crest * 0.2 + vFoam * 0.75 + wash * 0.75) * intensity * behind, 0.0, 1.0);
    foam *= 1.0 - smoothstep(0.35, 1.2, uPx * 6.0) * 0.5;

    // ---- shading ----
    vec3 V = vec3(0.0, 1.0, 0.0);
    vec3 L = normalize(uSunDir);
    float body = snoise(vec3(p * 0.02, uTime * 0.05)) * 0.5 + 0.5;
    vec3 deep = mix(vec3(0.008, 0.078, 0.212), vec3(0.098, 0.212, 0.325), body * 0.8);
    float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec3 sky = vec3(0.45, 0.6, 0.9);
    vec3 col = mix(deep, sky, clamp(fres * 1.6, 0.0, 0.32));
    col *= 0.85 + 0.2 * max(dot(N, L), 0.0);

    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 900.0) * 6.0;
    spec = spec / (1.0 + max(spec - 0.25, 0.0) * 4.0);      // soft knee
    col += vec3(1.0, 0.97, 0.9) * spec * (1.0 - foam);

    vec3 foamCol = mix(vec3(0.878, 0.941, 0.969), vec3(0.545, 0.714, 0.871), smoothstep(0.0, 25.0, depth));
    col = mix(col, foamCol, foam);

    // ---- screen-space glows ----
    vec2 s = gl_FragCoord.xy / uRes;
    s.y = 1.0 - s.y;
    float g = 0.0;
    g += exp(-dot(s - vec2(0.25, 0.35), s - vec2(0.25, 0.35)) * 6.0);
    g += exp(-dot(s - vec2(0.75, 0.35), s - vec2(0.75, 0.35)) * 6.0);
    g += exp(-dot(s - vec2(0.5, 0.7), s - vec2(0.5, 0.7)) * 6.0);
    col += vec3(0.0, 0.627, 1.0) * g * 0.15;

    // gentle vignette
    col *= 1.0 - 0.25 * pow(length(s - 0.5) * 1.3, 2.0);

    gl_FragColor = vec4(pow(col, vec3(1.0 / 1.1)), 1.0);
  }
`;

export class OceanScene {
  controls = { height: 1.7, wakeIntensity: 0.4, wakeSpeed: 50 };
  visible = true;

  constructor(canvas) {
    this.canvas = canvas;
  }

  init() {
    const canvas = this.canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor('#021436');

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 5000);
    this.camera.up.set(0, 0, -1);
    this.setHeight(30);

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    this.wake = new WakeSimulation(this.renderer, { size: coarse ? 128 : 256, bounds: BOUNDS, shipWidth: SHIP_W, shipLength: SHIP_L });
    this.wake.warmup(120);

    this.uniforms = {
      uTime: { value: 0 },
      uWake: { value: this.wake.texture },
      uBounds: { value: BOUNDS },
      uRes: { value: new THREE.Vector2(1, 1) },
      uSunDir: { value: new THREE.Vector3(-0.08, 53.3, 26).normalize() },
      uHeightScale: { value: 1.7 },
      uWakeIntensity: { value: 0.4 },
      uShipL: { value: SHIP_L },
      uShipW: { value: SHIP_W },
      uPx: { value: 0.05 },
    };
    const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: this.uniforms });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000, 1, 1), mat);
    plane.rotation.x = -Math.PI / 2;
    this.scene.add(plane);

    // lit 3D ship riding in the wake
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    const sun = new THREE.DirectionalLight('#fff6e8', 2.4);
    sun.position.set(-0.08, 53.3, 26);
    this.scene.add(sun, new THREE.HemisphereLight('#cfe3ff', '#0a2146', 0.7));
    // photographed container ship (bow up), sized to the wake simulation's hull
    this.ship = new THREE.Mesh(
      new THREE.PlaneGeometry(SHIP_L * (255 / 1299), SHIP_L),
      new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0 })
    );
    buildShipCanvas().then((c) => {
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      this.ship.material.map = tex;
      this.ship.material.opacity = 1;
      this.ship.material.needsUpdate = true;
    });
    this.ship.rotation.x = -Math.PI / 2;
    this.ship.position.y = 0.3;
    this.scene.add(this.ship);
    // soft contact shadow on the water
    const sh = document.createElement('canvas'); sh.width = 64; sh.height = 256;
    const sctx = sh.getContext('2d');
    const grad = sctx.createRadialGradient(32, 128, 4, 32, 128, 128);
    grad.addColorStop(0, 'rgba(0,8,30,.55)'); grad.addColorStop(1, 'rgba(0,8,30,0)');
    sctx.fillStyle = grad; sctx.fillRect(0, 0, 64, 256);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 13), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(0.35, 0.02, 0.5);
    this.scene.add(shadow);

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting), { rootMargin: '50px' });
    this.io.observe(canvas);

    this.clock = new THREE.Clock();
    gsap.ticker.add(this.tick);
    // first frame, then reveal
    this.tick();
    canvas.style.visibility = 'visible';
  }

  /** camera height in world units (straight down) */
  setHeight(h) {
    this.height = h;
    this.camera.position.set(0, h, 0.001);
    this.camera.lookAt(0, 0, 0);
  }

  /** place the camera so `shipPx` pixels on screen = the ship's world length */
  fitShip(shipPx) {
    const H = this.canvas.clientHeight || window.innerHeight;
    if (!shipPx) return;
    const visible = (SHIP_L * H) / shipPx;
    const h = visible / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)));
    this.setHeight(h);
  }

  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.uniforms.uRes.value.set(w, h);
  }

  tick = () => {
    const dt = this.clock.getDelta();
    if (!this.visible || this.hold) return;
    this.wake.uniforms.uSpeed.value = this.controls.wakeSpeed;
    this.wake.uniforms.uIntensity.value = this.controls.wakeIntensity;
    this.wake.update(dt);

    const u = this.uniforms;
    u.uTime.value += Math.min(dt, 0.05);
    u.uWake.value = this.wake.texture;
    u.uHeightScale.value = this.controls.height;
    u.uWakeIntensity.value = this.controls.wakeIntensity;
    const visibleH = 2 * this.height * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    u.uPx.value = visibleH / (this.canvas.clientHeight || 1);

    // gentle roll / sway
    const t = u.uTime.value;
    this.ship.position.x = Math.sin(t * 0.55) * 0.035;
    this.ship.rotation.z = Math.sin(t * 0.8) * 0.006;

    this.renderer.render(this.scene, this.camera);
  };

  destroy() {
    gsap.ticker.remove(this.tick);
    this.ro?.disconnect();
    this.io?.disconnect();
    this.wake.dispose();
    this.scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

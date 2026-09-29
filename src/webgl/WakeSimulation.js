import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

/**
 * Ship wake on the GPU.
 * Height-field wave equation + semi-Lagrangian advection:
 * the ship stays still and the water flows past it (+Y in sim space = +Z in world).
 * R = height, G = velocity.
 */
const simShader = /* glsl */ `
  uniform float uTime;
  uniform float uDt;
  uniform float uSpeed;
  uniform float uIntensity;
  uniform float uBounds;
  uniform vec2  uShipHalf;   // half width / half length in uv

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 tx = 1.0 / resolution.xy;

    // advect: sample upstream
    vec2 src = uv - vec2(0.0, (uSpeed / uBounds) * 0.38 * uDt);
    vec4 c = texture2D(heightmap, src);
    float h = c.r, v = c.g;

    float lap = texture2D(heightmap, src + vec2(tx.x, 0.0)).r
              + texture2D(heightmap, src - vec2(tx.x, 0.0)).r
              + texture2D(heightmap, src + vec2(0.0, tx.y)).r
              + texture2D(heightmap, src - vec2(0.0, tx.y)).r - 4.0 * h;

    v += lap * 0.12;
    v *= 0.95;
    h *= 0.97;
    h += v;

    // ---- hull forcing (bow at -Y, stern at +Y) ----
    vec2 d = uv - vec2(0.5);
    float yn = d.y / uShipHalf.y;
    float taper = smoothstep(-1.0, -0.6, yn) * (1.0 - 0.3 * smoothstep(0.7, 1.0, yn));
    float halfW = uShipHalf.x * max(taper, 0.05);
    float edge = abs(d.x) - halfW;
    float crestW = max(tx.x * 0.55, uShipHalf.x * 0.35);
    float speedK = clamp(uSpeed / 35.0, 0.2, 1.5);

    if (abs(yn) < 1.0) {
      if (edge > 0.0 && edge < crestW) {
        float bowW = mix(0.55, 0.12, (yn + 1.0) * 0.5);
        float n = 0.8 + 0.4 * noise(uv * 180.0 + uTime * 3.0);
        h = mix(h, bowW * uIntensity * speedK * n, 0.45);
        v = 0.0;
      } else if (edge <= 0.0) {
        h *= 0.6; v *= 0.6;
      }
    }

    // ---- propeller wash ----
    if (yn > 1.0 && yn < 1.35 && abs(d.x) < uShipHalf.x * 0.8) {
      v += (noise(uv * 260.0 + uTime * 9.0) - 0.5) * 0.09 * uIntensity * speedK;
    }

    // edges fade out
    float fade = smoothstep(0.0, 0.05, uv.x) * smoothstep(1.0, 0.95, uv.x) * smoothstep(0.0, 0.05, uv.y) * smoothstep(1.0, 0.95, uv.y);
    h *= fade; v *= fade;

    gl_FragColor = vec4(clamp(h, -2.0, 2.0), clamp(v, -2.0, 2.0), 0.0, 1.0);
  }
`;

export class WakeSimulation {
  constructor(renderer, { size = 256, bounds = 60, shipWidth = 2.2, shipLength = 11 } = {}) {
    this.bounds = bounds;
    this.gpu = new GPUComputationRenderer(size, size, renderer);
    this.gpu.setDataType(THREE.HalfFloatType);
    const tex = this.gpu.createTexture();
    this.variable = this.gpu.addVariable('heightmap', simShader, tex);
    this.gpu.setVariableDependencies(this.variable, [this.variable]);
    this.variable.minFilter = THREE.LinearFilter;
    this.variable.magFilter = THREE.LinearFilter;
    this.uniforms = this.variable.material.uniforms;
    Object.assign(this.uniforms, {
      uTime: { value: 0 },
      uDt: { value: 1 / 60 },
      uSpeed: { value: 50 },
      uIntensity: { value: 0.4 },
      uBounds: { value: bounds },
      uShipHalf: { value: new THREE.Vector2(shipWidth / 2 / bounds, shipLength / 2 / bounds) },
    });
    const err = this.gpu.init();
    if (err) throw new Error(err);
    this.acc = 0;
    this.time = 0;
  }

  get texture() {
    return this.gpu.getCurrentRenderTarget(this.variable).texture;
  }

  /** fixed 1/60 steps from an accumulator, max 3 per frame */
  update(delta) {
    const step = 1 / 60;
    this.acc += Math.min(delta, 0.05);
    let n = 0;
    while (this.acc >= step && n < 3) {
      this.time += step;
      this.uniforms.uTime.value = this.time;
      this.uniforms.uDt.value = step;
      this.gpu.compute();
      this.acc -= step;
      n++;
    }
    if (n === 3) this.acc = 0;
  }

  warmup(steps = 120) {
    for (let i = 0; i < steps; i++) {
      this.time += 1 / 60;
      this.uniforms.uTime.value = this.time;
      this.gpu.compute();
    }
  }

  dispose() {
    this.gpu.dispose();
  }
}

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';

/* ==========================================================
   Top-down wide-body jet, nose toward +X (right on screen).
   Rendered on a transparent canvas above the testimonials.
   Length ≈ 10 units.
   ========================================================== */
/* photographed jet (nose → +X), ~11 units nose to tail; casts a silhouette shadow */
function createJet(onLoad) {
  const tex = new THREE.TextureLoader().load('/img/plane-top.webp', onLoad);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const L = 11, W = L * (730 / 1284);
  const geo = new THREE.PlaneGeometry(L, W);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.02 }));
  mesh.castShadow = true;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  const g = new THREE.Group();
  g.add(mesh);
  return g;
}

export class PlaneScene {
  state = { x: -30, z: 0, bank: 0, yaw: 0, scale: 1 };

  constructor(canvas) {
    this.canvas = canvas;
  }

  init() {
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true }));
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.toneMapping = THREE.NeutralToneMapping;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = (this.scene = new THREE.Scene());
    scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.7;
    const sun = new THREE.DirectionalLight('#ffffff', 2.2);
    sun.position.set(-3, 20, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, far: 60 });
    sun.shadow.radius = 8;
    scene.add(sun, sun.target, new THREE.HemisphereLight('#ffffff', '#b8c4d8', 0.6));
    this.sun = sun;

    // shadow catcher far below the plane → soft ground shadow on the page
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.12 }));
    catcher.rotation.x = -Math.PI / 2; catcher.position.y = -2.5; catcher.receiveShadow = true;
    scene.add(catcher);

    this.jet = createJet(() => (this.dirty = true));
    scene.add(this.jet);

    // orthographic top-down camera: 1 unit = fixed fraction of viewport height
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    this.camera.position.set(0, 40, 0);
    this.camera.up.set(0, 0, -1);
    this.camera.lookAt(0, 0, 0);

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.canvas);
    this.io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting));
    this.io.observe(this.canvas);
    this.visible = true;
    this.dirty = true;
    gsap.ticker.add(this.tick);
  }

  /** view spans `span` units horizontally */
  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    const span = 22;                              // world units across the screen
    const a = h / w;
    Object.assign(this.camera, { left: -span / 2, right: span / 2, top: (span * a) / 2, bottom: (-span * a) / 2 });
    this.camera.updateProjectionMatrix();
    this.span = span;
    this.dirty = true;
  }

  /** x in [-1..1] screen fractions (0 = centre) */
  apply() {
    const s = this.state;
    this.jet.position.set(s.x, 0, s.z);
    this.jet.rotation.set(s.bank, s.yaw, 0);
    this.jet.scale.setScalar(s.scale);
    this.sun.target.position.set(s.x, 0, s.z);
    this.sun.position.set(s.x - 3, 20, s.z + 6);
    this.dirty = true;
  }

  tick = () => {
    if (!this.visible || !this.dirty) return;
    this.dirty = false;
    this.renderer.render(this.scene, this.camera);
  };

  destroy() {
    gsap.ticker.remove(this.tick);
    this.ro?.disconnect();
    this.io?.disconnect();
    this.scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

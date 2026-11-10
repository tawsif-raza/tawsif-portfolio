// The 3D half of the startup animation: a photographic Earth falls into
// frame, lands with a shockwave, wires up a network of "agent" nodes, then
// breaks apart into grains that swarm together and spell the name.
//
// Plain three.js (no React) so IntroSequence can load it lazily and drive it
// from one GSAP timeline: every moving value lives in `state`, GSAP tweens
// those numbers, and the render loop reads them each frame.
//
// Earth textures live in public/intro/ (NASA-derived, from the three.js
// examples: day map, night lights, clouds).
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  RepeatWrapping,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from "three";

const R = 1.25; // planet radius
const BG = 0x08090b;
const LIME = 0xc6f432;
const FOV = 45;
const CAM_Z = 6;
const SUN = new Vector3(-0.8, 0.45, 0.6).normalize();

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,255,255,0.75)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

// ── Earth: day/night blend, clouds, ocean glint, atmospheric rim ──
const EARTH_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const EARTH_FRAG = /* glsl */ `
  uniform sampler2D tDay;
  uniform sampler2D tNight;
  uniform sampler2D tClouds;
  uniform vec3 uSun;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    float ndl = dot(n, uSun);
    float day = smoothstep(-0.15, 0.25, ndl);
    float lit = max(ndl, 0.0);

    vec3 dayCol = texture2D(tDay, vUv).rgb;
    vec3 nightCol = texture2D(tNight, vUv).rgb;
    vec4 cl = texture2D(tClouds, vUv + vec2(uTime * 0.004, 0.0));
    float cloud = cl.r * cl.a;

    vec3 col = dayCol * (0.04 + 1.25 * lit);

    // sun glint on water
    float ocean = smoothstep(0.02, 0.12, dayCol.b - dayCol.r);
    vec3 h = normalize(uSun + v);
    col += vec3(1.0, 0.95, 0.8) * pow(max(dot(n, h), 0.0), 60.0) * 0.6 * ocean * day;

    // clouds, lit by the sun
    col = mix(col, vec3(0.06 + 1.1 * lit), cloud * 0.85);

    // city lights on the night side
    col += nightCol * vec3(1.0, 0.8, 0.5) * (1.0 - day) * 1.6 * (1.0 - cloud * 0.8);

    // thin blue air at the limb
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    col += vec3(0.3, 0.6, 1.0) * fres * (0.2 + 0.9 * day);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const ATMO_VERT = /* glsl */ `
  varying float vFacing;
  varying vec3 vNormalW;
  void main() {
    vFacing = abs(normalize(normalMatrix * normal).z);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Drawn on the back faces of a slightly larger sphere: zero at its outer
// silhouette, rising to full where it meets the planet's rim. Brighter on
// the sunlit side.
const ATMO_FRAG = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uColor;
  uniform vec3 uSun;
  varying float vFacing;
  varying vec3 vNormalW;
  void main() {
    float sun = 0.25 + 0.75 * smoothstep(-0.3, 0.6, dot(normalize(vNormalW), uSun));
    float i = pow(clamp(vFacing / 0.55, 0.0, 1.0), 2.6) * uOpacity * sun;
    gl_FragColor = vec4(uColor * i, i);
  }
`;

// ── Grains: Earth's surface → loose cloud → the name ──
const GRAIN_VERT = /* glsl */ `
  uniform mat4 uPlanet;
  uniform float uExplode;
  uniform float uForm;
  uniform float uOut;
  uniform float uTime;
  uniform float uSize;
  attribute vec3 aText;
  attribute vec3 aColor;
  attribute vec4 aData; // xyz: randoms, w: which line of the name (0 / 1)
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec3 center = (uPlanet * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 sp = (uPlanet * vec4(position, 1.0)).xyz;
    vec3 dir = normalize(sp - center);

    // burst outwards into a wide, drifting cloud
    float e = 1.0 - pow(1.0 - uExplode, 3.0);
    vec3 cloud = center + dir * (0.7 + 2.3 * aData.x) * vec3(1.7, 0.8, 1.0);
    vec3 p = mix(sp, cloud, e);
    p.x += sin(uTime * 1.3 + aData.y * 30.0) * 0.1 * e;
    p.y += cos(uTime * 1.1 + aData.z * 30.0) * 0.1 * e;

    // each grain flies to its place in the name on its own schedule
    float f = clamp(uForm * 1.5 - aData.y * 0.5, 0.0, 1.0);
    f = f * f * (3.0 - 2.0 * f);
    p = mix(p, aText, f);
    // settled grains keep shimmering
    p.xy += vec2(sin(uTime * 6.0 + aData.x * 90.0), cos(uTime * 5.0 + aData.z * 70.0)) * 0.004 * f;

    // exit: rush past the camera
    float o = uOut * uOut;
    p.z += o * (3.0 + 10.0 * aData.x);
    p.xy *= 1.0 + o * 1.4;

    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * mix(1.8, 1.25, f) * (0.6 + 0.8 * aData.z) / max(0.1, -mv.z);

    vec3 textCol = mix(vec3(1.0, 0.99, 0.96), vec3(0.83, 1.0, 0.3), aData.w);
    vColor = mix(aColor, textCol, smoothstep(0.1, 1.0, max(f, e * 0.75)));
    float flicker = 0.75 + 0.25 * sin(uTime * 9.0 + aData.x * 200.0);
    vAlpha = flicker * (1.0 - smoothstep(0.55, 1.0, uOut));
  }
`;

const GRAIN_FRAG = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.15, d) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

// Agent nodes, spread evenly around the whole globe (Fibonacci sphere) so
// some always face the camera, and which pairs get linked by an arc.
export const AGENT_COUNT = 12;
const NODE_DIRS = Array.from({ length: AGENT_COUNT }, (_, i) => {
  const y = 1 - (2 * (i + 0.5)) / AGENT_COUNT;
  const r = Math.sqrt(1 - y * y);
  const th = i * Math.PI * (3 - Math.sqrt(5));
  return [Math.cos(th) * r, y, Math.sin(th) * r];
});
const NODE_LINKS = NODE_DIRS.flatMap((_, i) =>
  [1, 3].filter((d) => i + d < AGENT_COUNT).map((d) => [i, i + d])
);
const ARC_SEGMENTS = 48;

// Render the name on a 2D canvas exactly where the page lays it out, then
// pick `count` random points inside the letters, in world units on the z=0
// plane. Returns Float32Arrays of positions and line indices.
function sampleName(text, vw, vh, visW, visH, count) {
  const k = Math.min(1, 1400 / vw);
  const c = document.createElement("canvas");
  c.width = Math.ceil(vw * k);
  c.height = Math.ceil(vh * k);
  const g = c.getContext("2d", { willReadFrequently: true });
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `${text.fontWeight} ${text.fontPx * k}px ${text.fontFamily}`;
  if ("letterSpacing" in g) g.letterSpacing = `${text.spacingPx * k}px`;
  text.lines.forEach((l) => g.fillText(l.text, l.cx * k, l.cy * k));

  const split = text.lines.length > 1 ? ((text.lines[0].cy + text.lines[1].cy) / 2) * k : Infinity;
  const { data, width, height } = g.getImageData(0, 0, c.width, c.height);
  const filled = [];
  for (let i = 0, n = width * height; i < n; i++) if (data[i * 4 + 3] > 128) filled.push(i);
  if (filled.length < 50) throw new Error("name did not rasterise");

  const pos = new Float32Array(count * 3);
  const line = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const idx = filled[(Math.random() * filled.length) | 0];
    const px = (idx % width) + Math.random();
    const py = Math.floor(idx / width) + Math.random();
    pos[i * 3] = (px / width - 0.5) * visW;
    pos[i * 3 + 1] = (0.5 - py / height) * visH;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    line[i] = py > split ? 1 : 0;
  }
  return { pos, line };
}

// `text`: { lines: [{ text, cx, cy }], fontPx, fontFamily, fontWeight, spacingPx }
// with cx/cy in CSS pixels (centre of each line on screen).
export async function createIntroPlanet(canvas, { text, assetBase = "/" }) {
  const loader = new TextureLoader();
  const [tDay, tNight, tClouds] = await Promise.all(
    ["earth_atmos_2048.jpg", "earth_lights_2048.png", "earth_clouds_1024.png"].map((f) =>
      loader.loadAsync(`${assetBase}intro/${f}`)
    )
  );

  const small = window.innerWidth < 640;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.setClearColor(BG, 1);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 200);
  const disposables = [tDay, tNight, tClouds];
  const track = (x) => {
    disposables.push(x);
    return x;
  };
  const glow = track(glowTexture());

  tDay.colorSpace = SRGBColorSpace;
  tNight.colorSpace = SRGBColorSpace;
  tDay.anisotropy = tNight.anisotropy = 4;
  tClouds.wrapS = RepeatWrapping;

  // Everything GSAP animates.
  const state = {
    y: 6,        // planet height (falls to its resting spot)
    glow: 1,     // atmosphere
    shock: 0,    // landing shockwave ring
    shake: 0,    // camera shake
    squash: 1,   // landing squash
    spin: 0,
    agents: 0,   // nodes + arcs draw-on
    explode: 0,  // Earth → cloud of grains
    form: 0,     // cloud → name
    out: 0,      // name rushes past the camera
    warp: 0,     // stars rush past
    camZ: CAM_Z,
  };

  // ── stars ──
  const STAR_COUNT = small ? 700 : 1400;
  const starPos = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 70;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 44;
    starPos[i * 3 + 2] = -6 - Math.random() * 50;
  }
  const starGeo = track(new BufferGeometry());
  starGeo.setAttribute("position", new BufferAttribute(starPos, 3));
  const starMat = track(new PointsMaterial({
    map: glow, size: 0.16, color: 0xf2f3ef, transparent: true, opacity: 0.75,
    blending: AdditiveBlending, depthWrite: false,
  }));
  const stars = new Points(starGeo, starMat);
  scene.add(stars);

  // ── planet ──
  const root = new Group();
  const tilt = new Group();
  const spinner = new Group();
  tilt.rotation.z = 0.4;
  tilt.add(spinner);
  root.add(tilt);
  scene.add(root);

  const earthGeo = track(new SphereGeometry(R, 96, 64));
  const earthMat = track(new ShaderMaterial({
    vertexShader: EARTH_VERT,
    fragmentShader: EARTH_FRAG,
    uniforms: {
      tDay: { value: tDay }, tNight: { value: tNight }, tClouds: { value: tClouds },
      uSun: { value: SUN }, uTime: { value: 0 },
    },
  }));
  spinner.add(new Mesh(earthGeo, earthMat));

  // atmosphere halo
  const atmoGeo = track(new SphereGeometry(R * 1.22, 64, 48));
  const atmoMat = track(new ShaderMaterial({
    vertexShader: ATMO_VERT,
    fragmentShader: ATMO_FRAG,
    uniforms: { uOpacity: { value: 1 }, uColor: { value: new Color(0x4f9dff) }, uSun: { value: SUN } },
    side: BackSide, transparent: true, depthWrite: false, blending: AdditiveBlending,
  }));
  const atmo = new Mesh(atmoGeo, atmoMat);
  root.add(atmo);

  // agent nodes
  const nodeVecs = NODE_DIRS.map(([x, y, z]) => new Vector3(x, y, z).normalize());
  const nodePos = new Float32Array(nodeVecs.length * 3);
  nodeVecs.forEach((v, i) => v.clone().multiplyScalar(R * 1.012).toArray(nodePos, i * 3));
  const nodeGeo = track(new BufferGeometry());
  nodeGeo.setAttribute("position", new BufferAttribute(nodePos, 3));
  const nodeMat = track(new PointsMaterial({
    map: glow, size: 0.22, color: 0xeaffb0, transparent: true, opacity: 0,
    blending: AdditiveBlending, depthWrite: false,
  }));
  spinner.add(new Points(nodeGeo, nodeMat));

  // arcs between nodes, lifted off the surface
  const arcMat = track(new LineBasicMaterial({
    color: LIME, transparent: true, opacity: 0.95, blending: AdditiveBlending, depthWrite: false,
  }));
  const arcs = NODE_LINKS.map(([a, b]) => {
    const pts = new Float32Array((ARC_SEGMENTS + 1) * 3);
    const v = new Vector3();
    // longer hops arc higher
    const lift = 0.06 + 0.12 * nodeVecs[a].angleTo(nodeVecs[b]);
    for (let i = 0; i <= ARC_SEGMENTS; i++) {
      const t = i / ARC_SEGMENTS;
      v.copy(nodeVecs[a]).lerp(nodeVecs[b], t).normalize()
        .multiplyScalar(R * (1.012 + Math.sin(Math.PI * t) * lift));
      v.toArray(pts, i * 3);
    }
    const geo = track(new BufferGeometry());
    geo.setAttribute("position", new BufferAttribute(pts, 3));
    geo.setDrawRange(0, 0);
    spinner.add(new Line(geo, arcMat));
    return geo;
  });

  // landing shockwave
  const ringGeo = track(new RingGeometry(1, 1.012, 160));
  const ringMat = track(new MeshBasicMaterial({
    color: 0xbfe0ff, transparent: true, opacity: 0, side: DoubleSide,
    blending: AdditiveBlending, depthWrite: false,
  }));
  const ring = new Mesh(ringGeo, ringMat);
  ring.rotation.x = -1.2;
  root.add(ring);

  // ── grains ──
  const w0 = canvas.clientWidth || window.innerWidth;
  const h0 = canvas.clientHeight || window.innerHeight;
  const visH = 2 * Math.tan((FOV * Math.PI) / 360) * CAM_Z;
  const visW = visH * (w0 / h0);
  const GRAINS = small ? 28000 : 70000;
  const name = sampleName(text, w0, h0, visW, visH, GRAINS);

  // Earth's colours, read back from the day map so each grain starts out
  // the colour of the ground it came from.
  const mapW = 512, mapH = 256;
  const mapCanvas = document.createElement("canvas");
  mapCanvas.width = mapW;
  mapCanvas.height = mapH;
  const mapCtx = mapCanvas.getContext("2d", { willReadFrequently: true });
  mapCtx.drawImage(tDay.image, 0, 0, mapW, mapH);
  const mapData = mapCtx.getImageData(0, 0, mapW, mapH).data;

  const gPos = new Float32Array(GRAINS * 3);
  const gCol = new Float32Array(GRAINS * 3);
  const gData = new Float32Array(GRAINS * 4);
  for (let i = 0; i < GRAINS; i++) {
    const y = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - y * y);
    const x = Math.cos(a) * s, z = Math.sin(a) * s;
    gPos[i * 3] = x * R;
    gPos[i * 3 + 1] = y * R;
    gPos[i * 3 + 2] = z * R;
    // same mapping SphereGeometry uses for its UVs
    let u = Math.atan2(z, -x) / (Math.PI * 2);
    if (u < 0) u += 1;
    const v = Math.acos(y) / Math.PI;
    const m = (Math.min(mapH - 1, (v * mapH) | 0) * mapW + Math.min(mapW - 1, (u * mapW) | 0)) * 4;
    gCol[i * 3] = (mapData[m] / 255) * 1.5 + 0.1;
    gCol[i * 3 + 1] = (mapData[m + 1] / 255) * 1.5 + 0.1;
    gCol[i * 3 + 2] = (mapData[m + 2] / 255) * 1.5 + 0.14;
    gData[i * 4] = Math.random();
    gData[i * 4 + 1] = Math.random();
    gData[i * 4 + 2] = Math.random();
    gData[i * 4 + 3] = name.line[i];
  }
  const grainGeo = track(new BufferGeometry());
  grainGeo.setAttribute("position", new BufferAttribute(gPos, 3));
  grainGeo.setAttribute("aText", new BufferAttribute(name.pos, 3));
  grainGeo.setAttribute("aColor", new BufferAttribute(gCol, 3));
  grainGeo.setAttribute("aData", new BufferAttribute(gData, 4));
  const grainMat = track(new ShaderMaterial({
    vertexShader: GRAIN_VERT,
    fragmentShader: GRAIN_FRAG,
    uniforms: {
      uPlanet: { value: spinner.matrixWorld },
      uExplode: { value: 0 }, uForm: { value: 0 }, uOut: { value: 0 },
      uTime: { value: 0 }, uSize: { value: 10 },
    },
    transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending,
  }));
  const grains = new Points(grainGeo, grainMat);
  grains.frustumCulled = false; // the shader moves points far from the geometry's bounds
  grains.visible = false;
  scene.add(grains);

  // ── sizing ──
  let baseScale = 1;
  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    baseScale = Math.min(1, Math.max(0.55, camera.aspect * 1.1));
    // world-space point size → pixels at distance 1
    const bufferH = h * renderer.getPixelRatio();
    grainMat.uniforms.uSize.value = (0.0105 * bufferH) / (2 * Math.tan((FOV * Math.PI) / 360));
  };
  resize();
  window.addEventListener("resize", resize);

  // ── loop ──
  let raf = 0;
  let running = true;
  const t0 = performance.now();
  const frame = (now) => {
    if (!running) return;
    const t = (now - t0) / 1000;
    const s = state;
    const burst = s.explode > 0.001;

    root.position.y = s.y;
    root.scale.set(baseScale, baseScale * s.squash, baseScale);
    spinner.rotation.y = s.spin + t * 0.15;
    root.updateMatrixWorld(true); // grains read spinner.matrixWorld

    // Earth and its dressing are swapped for the grains at the burst.
    tilt.visible = !burst;
    atmo.visible = !burst;
    grains.visible = burst;

    earthMat.uniforms.uTime.value = t;
    atmoMat.uniforms.uOpacity.value = s.glow;

    nodeMat.opacity = Math.min(1, s.agents * 2);
    // arcs draw on one after another
    arcs.forEach((geo, i) => {
      const local = Math.min(1, Math.max(0, s.agents * arcs.length - i));
      geo.setDrawRange(0, Math.floor(local * (ARC_SEGMENTS + 1)));
    });

    ring.scale.setScalar(R * (1 + s.shock * 4.5));
    ringMat.opacity = s.shock > 0 && !burst ? (1 - s.shock) * 0.8 : 0;

    grainMat.uniforms.uExplode.value = s.explode;
    grainMat.uniforms.uForm.value = s.form;
    grainMat.uniforms.uOut.value = s.out;
    grainMat.uniforms.uTime.value = t;

    stars.position.z = s.warp * 34;
    starMat.size = 0.16 + s.warp * 0.5;
    starMat.opacity = 0.75 * (1 - Math.max(0, s.warp - 0.7) / 0.3);

    camera.position.set(
      (Math.random() - 0.5) * s.shake * 0.22,
      (Math.random() - 0.5) * s.shake * 0.22,
      s.camZ
    );

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    state,
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };
}

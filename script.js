import * as THREE from "https://esm.sh/three@0.175.0";
import { EffectComposer } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/UnrealBloomPass.js";

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Store mouse position and smooth it over time
const mouse = new THREE.Vector2(0, 0);
const smoothedMouse = new THREE.Vector2(0, 0);
let mouseDown = false;

// Color presets for easy manual switching (not live UI)
const colorPresets = {
  Classic: {
    primaryColor: [255, 255, 255],
    secondaryColor: [255, 255, 255],
    accentColor: [0, 0, 0]
  },
  "Dark Moody": {
    primaryColor: [20, 30, 40],
    secondaryColor: [40, 50, 70],
    accentColor: [100, 120, 180]
  },
  // ... (other presets remain unchanged)
  "Molten Core": {
    primaryColor: [10, 10, 10],
    secondaryColor: [120, 30, 10],
    accentColor: [255, 180, 20]
  }
};

// Parameters (set your defaults here)
const params = {
  effectType: 1, // 0: Orb, 1: Fractal Julia, 2: Crystal, 3: Nebula
  colorPreset: "Crimson Heat",
  primaryColor: [180, 30, 40],
  secondaryColor: [240, 80, 40],
  accentColor: [255, 200, 60],
  fractalScale: 0.83,
  fractalX: 0,
  fractalY: 0,
  fractionalIterations: 8,
  lightCount: 3,
  lightIntensity: 1.5,
  lightSpeed: 1.0,
  lightBloomBalance: 0.8,
  lightLeak: 0.7,
  contrastBoost: 1.2,
  mouseProximityEffect: 0.8,
  grainStrength: 0.02,
  grainSpeed: 2.0,
  grainMean: 0.0,
  grainVariance: 0.5,
  grainBlendMode: 1,
  grainSize: 3.5,
  animationSpeed: 0.02,
  autoRotate: true,
  useBloom: true,
  bloomStrength: 0.1,
  bloomRadius: 0.4,
  bloomThreshold: 0.2,
  nebulaDensity: 3.0,
  nebulaWarp: 0.7,
  nebulaContrast: 1.4,
  nebulaSpeed: 0.3,
  nebulaLayers: 3,
  nebulaGlow: 0.8,
  crystalFacets: 7,
  crystalRefraction: 0.6,
  crystalChroma: 0.4,
  crystalRotation: 0.2,
  crystalSharpness: 0.8,
  crystalGlint: 0.7
};

// Shader Material
const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    iTime: { value: 0.0 },
    smoothedMouse: { value: new THREE.Vector2(0, 0) },
    mouseDown: { value: 0 },
    primaryColor: { value: new THREE.Color().fromArray(params.primaryColor.map((c) => c / 255)) },
    secondaryColor: { value: new THREE.Color().fromArray(params.secondaryColor.map((c) => c / 255)) },
    accentColor: { value: new THREE.Color().fromArray(params.accentColor.map((c) => c / 255)) },
    fractalScale: { value: params.fractalScale },
    fractalOffset: { value: new THREE.Vector2(params.fractalX, params.fractalY) },
    fractionalIterations: { value: params.fractionalIterations },
    lightCount: { value: params.lightCount },
    lightIntensity: { value: params.lightIntensity },
    lightSpeed: { value: params.lightSpeed },
    lightBloomBalance: { value: params.lightBloomBalance },
    lightLeak: { value: params.lightLeak },
    contrastBoost: { value: params.contrastBoost },
    mouseProximityEffect: { value: params.mouseProximityEffect },
    useBloom: { value: params.useBloom ? 1.0 : 0.0 },
    grainStrength: { value: params.grainStrength },
    grainSize: { value: params.grainSize },
    grainSpeed: { value: params.grainSpeed },
    grainMean: { value: params.grainMean },
    grainVariance: { value: params.grainVariance },
    grainBlendMode: { value: params.grainBlendMode },
    animationSpeed: { value: params.animationSpeed },
    autoRotate: { value: params.autoRotate ? 1.0 : 0.0 },
    effectType: { value: params.effectType },
    nebulaDensity: { value: params.nebulaDensity },
    nebulaWarp: { value: params.nebulaWarp },
    nebulaContrast: { value: params.nebulaContrast },
    nebulaSpeed: { value: params.nebulaSpeed },
    nebulaLayers: { value: params.nebulaLayers },
    nebulaGlow: { value: params.nebulaGlow },
    crystalFacets: { value: params.crystalFacets },
    crystalRefraction: { value: params.crystalRefraction },
    crystalChroma: { value: params.crystalChroma },
    crystalRotation: { value: params.crystalRotation },
    crystalSharpness: { value: params.crystalSharpness },
    crystalGlint: { value: params.crystalGlint }
  },
  vertexShader: /* GLSL vertex shader code unchanged */,
  fragmentShader: /* GLSL fragment shader code unchanged */
});

// Create a fullscreen plane
const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial);
scene.add(plane);

// Setup post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add bloom effect
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  params.bloomStrength,
  params.bloomRadius,
  params.bloomThreshold
);
composer.addPass(bloomPass);

// Mouse event listeners
window.addEventListener("mousemove", (event) => {
  const mouseX = event.clientX / window.innerWidth;
  const mouseY = 1.0 - event.clientY / window.innerHeight; // Flip Y axis
  mouse.set(mouseX, mouseY);
});

window.addEventListener("mousedown", () => {
  mouseDown = true;
  shaderMaterial.uniforms.mouseDown.value = 1.0;
});

window.addEventListener("mouseup", () => {
  mouseDown = false;
  shaderMaterial.uniforms.mouseDown.value = 0.0;
});

// Animation Loop
function animate() {
  // Update time uniform
  const time = performance.now() * 0.001; // Convert to seconds
  shaderMaterial.uniforms.iTime.value = time;

  // Smooth out the mouse movement
  smoothedMouse.lerp(mouse, 0.1);
  shaderMaterial.uniforms.smoothedMouse.value.set(
    smoothedMouse.x * window.innerWidth,
    smoothedMouse.y * window.innerHeight
  );

  // Render with post-processing
  if (params.useBloom) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
}

animate();

// Handle Window Resize
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  composer.setSize(width, height);
  shaderMaterial.uniforms.iResolution.value.set(width, height);
});

// Add touch support for mobile devices
window.addEventListener(
  "touchmove",
  (event) => {
    event.preventDefault();
    const touch = event.touches[0];
    const mouseX = touch.clientX / window.innerWidth;
    const mouseY = 1.0 - touch.clientY / window.innerHeight;
    mouse.set(mouseX, mouseY);
  },
  { passive: false }
);

window.addEventListener("touchstart", (event) => {
  mouseDown = true;
  shaderMaterial.uniforms.mouseDown.value = 1.0;
  const touch = event.touches[0];
  const mouseX = touch.clientX / window.innerWidth;
  const mouseY = 1.0 - touch.clientY / window.innerHeight;
  mouse.set(mouseX, mouseY);
});

window.addEventListener("touchend", () => {
  mouseDown = false;
  shaderMaterial.uniforms.mouseDown.value = 0.0;
});

// Optional: Add a custom cursor
const cursor = document.createElement("div");
cursor.className = "custom-cursor";
cursor.style.position = "fixed";
cursor.style.width = "20px";
cursor.style.height = "20px";
cursor.style.borderRadius = "50%";
cursor.style.border = "2px solid white";
cursor.style.transform = "translate(-50%, -50%)";
cursor.style.pointerEvents = "none";
cursor.style.zIndex = "1000";
document.body.appendChild(cursor);

let lastCursorUpdate = 0;
document.addEventListener("mousemove", (e) => {
  const now = performance.now();
  if (now - lastCursorUpdate > 16) {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
    lastCursorUpdate = now;
  }
});
document.addEventListener("mouseleave", () => {
  cursor.style.display = "none";
});
document.addEventListener("mouseenter", () => {
  cursor.style.display = "block";
});

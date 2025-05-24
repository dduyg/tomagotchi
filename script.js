// Import modules
import * as THREE from "https://esm.sh/three@0.175.0";
import { Pane } from "https://cdn.skypack.dev/tweakpane@4.0.4";
import Stats from "https://esm.sh/stats.js@0.17.0";
import { EffectComposer } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "https://esm.sh/three@0.175.0/examples/jsm/shaders/FXAAShader.js";
import { GammaCorrectionShader } from "https://esm.sh/three@0.175.0/examples/jsm/shaders/GammaCorrectionShader.js";

// Scene setup
let container, stats;
let camera, scene, renderer;
let bloomComposer, finalComposer;
let material;
let clock;
let bloomPass;
let mousePosition = new THREE.Vector2(0, 0);
let targetMousePosition = new THREE.Vector2(0, 0);

// Visual presets
const presets = {
  moody: {
    sphereCount: 6,
    bloomStrength: 0.3,
    bloomThreshold: 0.2,
    bloomRadius: 0.5,
    ambientIntensity: 0.05,
    diffuseIntensity: 0.4,
    specularIntensity: 2,
    specularPower: 8,
    fresnelPower: 1.0,
    backgroundColor: new THREE.Color(0x050505),
    sphereColor: new THREE.Color(0x000000),
    lightColor: new THREE.Color(0xffffff),
    lightPosition: new THREE.Vector3(1, 1, 1),
    smoothness: 0.3,
    contrast: 1.2,
    fogDensity: 0.15,
    movementPattern: "orbital",
    movementSpeed: 1.0,
    movementScale: 1.0,
    individualRotation: true
  },
  cosmic: {
    sphereCount: 8,
    bloomStrength: 0.8,
    bloomThreshold: 0.1,
    bloomRadius: 0.7,
    ambientIntensity: 0.1,
    diffuseIntensity: 0.5,
    specularIntensity: 1.2,
    specularPower: 16,
    fresnelPower: 2.0,
    backgroundColor: new THREE.Color(0x000011),
    sphereColor: new THREE.Color(0x000022),
    lightColor: new THREE.Color(0x88aaff),
    lightPosition: new THREE.Vector3(0.5, 1, 0.5),
    smoothness: 0.4,
    contrast: 1.4,
    fogDensity: 0.2,
    movementPattern: "wave",
    movementSpeed: 1.2,
    movementScale: 1.3,
    individualRotation: true
  },
  minimal: {
    sphereCount: 3,
    bloomStrength: 0.2,
    bloomThreshold: 0.3,
    bloomRadius: 0.3,
    ambientIntensity: 0.08,
    diffuseIntensity: 0.3,
    specularIntensity: 0.6,
    specularPower: 48,
    fresnelPower: 4.0,
    backgroundColor: new THREE.Color(0x0a0a0a),
    sphereColor: new THREE.Color(0x000000),
    lightColor: new THREE.Color(0xffffff),
    lightPosition: new THREE.Vector3(1, 0.5, 0.8),
    smoothness: 0.25,
    contrast: 1.1,
    fogDensity: 0.1,
    movementPattern: "pulse",
    movementSpeed: 0.7,
    movementScale: 0.8,
    individualRotation: false
  },
  vibrant: {
    sphereCount: 10,
    bloomStrength: 1.0,
    bloomThreshold: 0.1,
    bloomRadius: 0.8,
    ambientIntensity: 0.15,
    diffuseIntensity: 0.6,
    specularIntensity: 1.0,
    specularPower: 24,
    fresnelPower: 2.5,
    backgroundColor: new THREE.Color(0x0a0505),
    sphereColor: new THREE.Color(0x110000),
    lightColor: new THREE.Color(0xff8866),
    lightPosition: new THREE.Vector3(0.8, 1.2, 0.6),
    smoothness: 0.5,
    contrast: 1.5,
    fogDensity: 0.05,
    movementPattern: "chaos",
    movementSpeed: 1.5,
    movementScale: 1.2,
    individualRotation: true
  },
  neon: {
    sphereCount: 7,
    bloomStrength: 1.5,
    bloomThreshold: 0.05,
    bloomRadius: 0.9,
    ambientIntensity: 0.12,
    diffuseIntensity: 0.7,
    specularIntensity: 1.8,
    specularPower: 20,
    fresnelPower: 2.2,
    backgroundColor: new THREE.Color(0x000505),
    sphereColor: new THREE.Color(0x000808),
    lightColor: new THREE.Color(0x00ffcc),
    lightPosition: new THREE.Vector3(0.7, 1.3, 0.8),
    smoothness: 0.45,
    contrast: 1.6,
    fogDensity: 0.08,
    movementPattern: "wave",
    movementSpeed: 1.4,
    movementScale: 1.1,
    individualRotation: true
  },
  sunset: {
    sphereCount: 5,
    bloomStrength: 0.6,
    bloomThreshold: 0.15,
    bloomRadius: 0.6,
    ambientIntensity: 0.18,
    diffuseIntensity: 0.55,
    specularIntensity: 0.9,
    specularPower: 28,
    fresnelPower: 3.2,
    backgroundColor: new THREE.Color(0x150505),
    sphereColor: new THREE.Color(0x100000),
    lightColor: new THREE.Color(0xff6622),
    lightPosition: new THREE.Vector3(1.2, 0.4, 0.6),
    smoothness: 0.35,
    contrast: 1.3,
    fogDensity: 0.12,
    movementPattern: "orbital",
    movementSpeed: 0.9,
    movementScale: 1.0,
    individualRotation: false
  },
  midnight: {
    sphereCount: 4,
    bloomStrength: 0.4,
    bloomThreshold: 0.25,
    bloomRadius: 0.4,
    ambientIntensity: 0.06,
    diffuseIntensity: 0.35,
    specularIntensity: 1.4,
    specularPower: 40,
    fresnelPower: 3.5,
    backgroundColor: new THREE.Color(0x000010),
    sphereColor: new THREE.Color(0x000015),
    lightColor: new THREE.Color(0x4466ff),
    lightPosition: new THREE.Vector3(0.9, 0.8, 1.0),
    smoothness: 0.28,
    contrast: 1.25,
    fogDensity: 0.18,
    movementPattern: "pulse",
    movementSpeed: 0.6,
    movementScale: 0.9,
    individualRotation: true
  },
  toxic: {
    sphereCount: 9,
    bloomStrength: 0.9,
    bloomThreshold: 0.12,
    bloomRadius: 0.75,
    ambientIntensity: 0.14,
    diffuseIntensity: 0.65,
    specularIntensity: 1.1,
    specularPower: 22,
    fresnelPower: 2.8,
    backgroundColor: new THREE.Color(0x001000),
    sphereColor: new THREE.Color(0x001500),
    lightColor: new THREE.Color(0x66ff44),
    lightPosition: new THREE.Vector3(0.6, 1.1, 0.7),
    smoothness: 0.55,
    contrast: 1.45,
    fogDensity: 0.1,
    movementPattern: "chaos",
    movementSpeed: 1.3,
    movementScale: 1.4,
    individualRotation: true
  },
  pastel: {
    sphereCount: 6,
    bloomStrength: 0.5,
    bloomThreshold: 0.18,
    bloomRadius: 0.5,
    ambientIntensity: 0.2,
    diffuseIntensity: 0.5,
    specularIntensity: 0.7,
    specularPower: 36,
    fresnelPower: 2.6,
    backgroundColor: new THREE.Color(0x101018),
    sphereColor: new THREE.Color(0x080814),
    lightColor: new THREE.Color(0xaabbff),
    lightPosition: new THREE.Vector3(1.0, 0.7, 0.9),
    smoothness: 0.38,
    contrast: 1.15,
    fogDensity: 0.07,
    movementPattern: "wave",
    movementSpeed: 0.8,
    movementScale: 0.9,
    individualRotation: false
  }
};

// Current parameters
let params = {
  preset: "moody",
  ...presets.moody,
  animationSpeed: 1.0,
  cameraDistance: 3.0,
  mouseProximityEffect: true,
  minMovementScale: 0.3,
  maxMovementScale: 1.0,
  mouseSmoothness: 0.1
};

// Initialize the scene
init();
animate();

function init() {
  container = document.getElementById("container");

  // Create scene
  scene = new THREE.Scene();

  // Create camera
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  // Create clock for animation
  clock = new THREE.Clock();

  // Create a plane that fills the screen
  const geometry = new THREE.PlaneGeometry(2, 2);

  // Create shader material with transparency
  material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uSphereCount: { value: params.sphereCount },
      uAmbientIntensity: { value: params.ambientIntensity },
      uDiffuseIntensity: { value: params.diffuseIntensity },
      uSpecularIntensity: { value: params.specularIntensity },
      uSpecularPower: { value: params.specularPower },
      uFresnelPower: { value: params.fresnelPower },
      uBackgroundColor: { value: params.backgroundColor },
      uSphereColor: { value: params.sphereColor },
      uLightColor: { value: params.lightColor },
      uLightPosition: { value: params.lightPosition },
      uSmoothness: { value: params.smoothness },
      uContrast: { value: params.contrast },
      uFogDensity: { value: params.fogDensity },
      uAnimationSpeed: { value: params.animationSpeed },
      uCameraDistance: { value: params.cameraDistance },
      uMovementPattern: {
        value: ["orbital", "wave", "chaos", "pulse"].indexOf(
          params.movementPattern
        )
      },
      uMovementSpeed: { value: params.movementSpeed },
      uMovementScale: { value: params.movementScale },
      uIndividualRotation: { value: params.individualRotation },
      uMousePosition: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseProximityEffect: { value: params.mouseProximityEffect },
      uMinMovementScale: { value: params.minMovementScale },
      uMaxMovementScale: { value: params.maxMovementScale }
    },
    vertexShader: vertexShader(),
    fragmentShader: fragmentShader(),
    glslVersion: THREE.GLSL3,
    transparent: true // Enable transparency
  });

  // Create mesh
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Create renderer with alpha
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true // Enable transparency
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Set clear color with alpha=0
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Setup post-processing with bloom that preserves transparency
  setupCustomPostProcessing();

  // Setup stats
  stats = new Stats();
  document.getElementById("stats").appendChild(stats.dom);

  // Setup UI
  setupUI();

  // Handle window resize
  window.addEventListener("resize", onWindowResize);
  onWindowResize();

  // Add mouse move event listener
  window.addEventListener("mousemove", onMouseMove);
}

function onMouseMove(event) {
  // Calculate normalized mouse position (0 to 1)
  targetMousePosition.x = event.clientX / window.innerWidth;
  targetMousePosition.y = 1.0 - event.clientY / window.innerHeight; // Invert Y for WebGL coordinates

  // Smooth mouse movement is applied in the render loop
}

// Custom post-processing setup that preserves transparency
function setupCustomPostProcessing() {
  // Create render targets
  const renderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    }
  );

  const bloomRenderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    }
  );

  // Create render passes
  const renderScene = new RenderPass(scene, camera);

  // Create bloom pass
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    params.bloomStrength,
    params.bloomRadius,
    params.bloomThreshold
  );

  // Create a shader to combine the scene with bloom while preserving transparency
  const finalPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomRenderTarget.texture }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D baseTexture;
        uniform sampler2D bloomTexture;
        varying vec2 vUv;
        
        void main() {
          vec4 baseColor = texture2D(baseTexture, vUv);
          vec4 bloomColor = texture2D(bloomTexture, vUv);
          
          // Only apply bloom where the original scene has content (alpha > 0)
          // This preserves transparency in the background
          gl_FragColor = vec4(baseColor.rgb + bloomColor.rgb * baseColor.a, baseColor.a);
        }
      `,
      transparent: true,
      depthWrite: false
    }),
    "baseTexture"
  );

  // Create FXAA pass
  const fxaaPass = new ShaderPass(FXAAShader);
  fxaaPass.material.uniforms["resolution"].value.set(
    1 / window.innerWidth,
    1 / window.innerHeight
  );

  // Create gamma correction pass
  const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);

  // Setup bloom composer
  bloomComposer = new EffectComposer(renderer, bloomRenderTarget);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);

  // Setup final composer
  finalComposer = new EffectComposer(renderer, renderTarget);
  finalComposer.addPass(renderScene);
  finalPass.uniforms.baseTexture.value = finalComposer.renderTarget2.texture;
  finalComposer.addPass(finalPass);
  finalComposer.addPass(fxaaPass);
  finalComposer.addPass(gammaCorrectionPass);
}

function setupUI() {
  const pane = new Pane({
    container: document.getElementById("ui-container"),
    title: "Ray Marching Controls",
    expanded: false
  });

  // Presets dropdown
  pane
    .addBinding(params, "preset", {
      options: {
        Moody: "moody",
        Cosmic: "cosmic",
        Minimal: "minimal",
        Vibrant: "vibrant",
        Neon: "neon",
        Sunset: "sunset",
        Midnight: "midnight",
        Toxic: "toxic",
        Pastel: "pastel"
      }
    })
    .on("change", (ev) => {
      applyPreset(ev.value);
      // Update all UI controls to reflect the new preset values
      pane.refresh();
    });

  // Spheres folder
  const spheresFolder = pane.addFolder({ title: "Spheres" });

  spheresFolder
    .addBinding(params, "sphereCount", { min: 1, max: 10, step: 1 })
    .on("change", (ev) => {
      material.uniforms.uSphereCount.value = ev.value;
    });

  spheresFolder
    .addBinding(params, "smoothness", {
      min: 0.1,
      max: 1.0,
      step: 0.01,
      label: "Blend Smoothness"
    })
    .on("change", (ev) => {
      material.uniforms.uSmoothness.value = ev.value;
    });

  // Movement folder
  const movementFolder = pane.addFolder({ title: "Movement" });

  movementFolder
    .addBinding(params, "movementPattern", {
      options: {
        Orbital: "orbital",
        Wave: "wave",
        Chaos: "chaos",
        Pulse: "pulse"
      }
    })
    .on("change", (ev) => {
      material.uniforms.uMovementPattern.value = [
        "orbital",
        "wave",
        "chaos",
        "pulse"
      ].indexOf(ev.value);
    });

  movementFolder
    .addBinding(params, "movementSpeed", { min: 0.1, max: 3.0, step: 0.1 })
    .on("change", (ev) => {
      material.uniforms.uMovementSpeed.value = ev.value;
    });

  movementFolder
    .addBinding(params, "movementScale", { min: 0.1, max: 2.0, step: 0.1 })
    .on("change", (ev) => {
      material.uniforms.uMovementScale.value = ev.value;
    });

  movementFolder.addBinding(params, "individualRotation").on("change", (ev) => {
    material.uniforms.uIndividualRotation.value = ev.value;
  });

  movementFolder
    .addBinding(params, "animationSpeed", { min: 0.1, max: 3.0, step: 0.1 })
    .on("change", (ev) => {
      material.uniforms.uAnimationSpeed.value = ev.value;
    });

  // Mouse interaction folder
  const mouseFolder = pane.addFolder({ title: "Mouse Interaction" });

  mouseFolder.addBinding(params, "mouseProximityEffect").on("change", (ev) => {
    material.uniforms.uMouseProximityEffect.value = ev.value;
  });

  mouseFolder
    .addBinding(params, "minMovementScale", { min: 0.1, max: 1.0, step: 0.05 })
    .on("change", (ev) => {
      material.uniforms.uMinMovementScale.value = ev.value;
    });

  mouseFolder
    .addBinding(params, "maxMovementScale", { min: 0.5, max: 2.0, step: 0.05 })
    .on("change", (ev) => {
      material.uniforms.uMaxMovementScale.value = ev.value;
    });

  // Add mouse smoothness control
  mouseFolder.addBinding(params, "mouseSmoothness", {
    min: 0.01,
    max: 0.2,
    step: 0.01,
    label: "Mouse Smoothness"
  });

  // Lighting folder
  const lightingFolder = pane.addFolder({ title: "Lighting" });

  lightingFolder
    .addBinding(params, "ambientIntensity", { min: 0, max: 0.5, step: 0.01 })
    .on("change", (ev) => {
      material.uniforms.uAmbientIntensity.value = ev.value;
    });

  lightingFolder
    .addBinding(params, "diffuseIntensity", { min: 0, max: 1.0, step: 0.01 })
    .on("change", (ev) => {
      material.uniforms.uDiffuseIntensity.value = ev.value;
    });

  lightingFolder
    .addBinding(params, "specularIntensity", { min: 0, max: 2.0, step: 0.01 })
    .on("change", (ev) => {
      material.uniforms.uSpecularIntensity.value = ev.value;
    });

  lightingFolder
    .addBinding(params, "specularPower", { min: 1, max: 64, step: 1 })
    .on("change", (ev) => {
      material.uniforms.uSpecularPower.value = ev.value;
    });

  lightingFolder
    .addBinding(params, "fresnelPower", { min: 1, max: 5, step: 0.1 })
    .on("change", (ev) => {
      material.uniforms.uFresnelPower.value = ev.value;
    });

  lightingFolder
    .addBinding(params, "contrast", { min: 0.5, max: 2.0, step: 0.1 })
    .on("change", (ev) => {
      material.uniforms.uContrast.value = ev.value;
    });

  // Bloom folder
  const bloomFolder = pane.addFolder({ title: "Bloom Effect" });

  bloomFolder
    .addBinding(params, "bloomStrength", { min: 0, max: 3, step: 0.01 })
    .on("change", (ev) => {
      bloomPass.strength = ev.value;
    });

  bloomFolder
    .addBinding(params, "bloomThreshold", { min: 0, max: 1, step: 0.01 })
    .on("change", (ev) => {
      bloomPass.threshold = ev.value;
    });

  bloomFolder
    .addBinding(params, "bloomRadius", { min: 0, max: 1, step: 0.01 })
    .on("change", (ev) => {
      bloomPass.radius = ev.value;
    });

  // Camera folder
  const cameraFolder = pane.addFolder({ title: "Camera" });

  cameraFolder
    .addBinding(params, "cameraDistance", { min: 1.0, max: 10.0, step: 0.1 })
    .on("change", (ev) => {
      material.uniforms.uCameraDistance.value = ev.value;
    });

  cameraFolder
    .addBinding(params, "fogDensity", { min: 0, max: 0.5, step: 0.01 })
    .on("change", (ev) => {
      material.uniforms.uFogDensity.value = ev.value;
    });
}

function applyPreset(presetName) {
  const preset = presets[presetName];
  if (!preset) return;

  // Update params
  params.preset = presetName;
  Object.keys(preset).forEach((key) => {
    params[key] = preset[key];
  });

  // Update material uniforms
  material.uniforms.uSphereCount.value = params.sphereCount;
  material.uniforms.uAmbientIntensity.value = params.ambientIntensity;
  material.uniforms.uDiffuseIntensity.value = params.diffuseIntensity;
  material.uniforms.uSpecularIntensity.value = params.specularIntensity;
  material.uniforms.uSpecularPower.value = params.specularPower;
  material.uniforms.uFresnelPower.value = params.fresnelPower;
  material.uniforms.uBackgroundColor.value = params.backgroundColor;
  material.uniforms.uSphereColor.value = params.sphereColor;
  material.uniforms.uLightColor.value = params.lightColor;
  material.uniforms.uLightPosition.value = params.lightPosition;
  material.uniforms.uSmoothness.value = params.smoothness;
  material.uniforms.uContrast.value = params.contrast;
  material.uniforms.uFogDensity.value = params.fogDensity;
  material.uniforms.uMovementPattern.value = [
    "orbital",
    "wave",
    "chaos",
    "pulse"
  ].indexOf(params.movementPattern);
  material.uniforms.uMovementSpeed.value = params.movementSpeed;
  material.uniforms.uMovementScale.value = params.movementScale;
  material.uniforms.uIndividualRotation.value = params.individualRotation;

  // Update bloom pass
  bloomPass.strength = params.bloomStrength;
  bloomPass.threshold = params.bloomThreshold;
  bloomPass.radius = params.bloomRadius;
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  bloomComposer.setSize(width, height);
  finalComposer.setSize(width, height);

  material.uniforms.uResolution.value.set(width, height);

  // Update FXAA pass
  const fxaaPass = finalComposer.passes.find(
    (pass) =>
      pass.material &&
      pass.material.uniforms &&
      pass.material.uniforms.resolution
  );
  if (fxaaPass) {
    fxaaPass.material.uniforms.resolution.value.set(1 / width, 1 / height);
  }
}

function animate() {
  requestAnimationFrame(animate);
  render();
  stats.update();
}

function render() {
  // Apply smooth mouse movement
  mousePosition.x +=
    (targetMousePosition.x - mousePosition.x) * params.mouseSmoothness;
  mousePosition.y +=
    (targetMousePosition.y - mousePosition.y) * params.mouseSmoothness;

  // Update shader uniform with smoothed mouse position
  material.uniforms.uMousePosition.value = mousePosition;

  material.uniforms.uTime.value =
    clock.getElapsedTime() * params.animationSpeed;

  // First render the scene with bloom
  bloomComposer.render();

  // Then render the final composition
  finalComposer.render();
}

// Vertex shader
function vertexShader() {
  return `
    out vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
}

// Fragment shader
function fragmentShader() {
  return `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform int uSphereCount;
    uniform float uAmbientIntensity;
    uniform float uDiffuseIntensity;
    uniform float uSpecularIntensity;
    uniform float uSpecularPower;
    uniform float uFresnelPower;
    uniform vec3 uBackgroundColor;
    uniform vec3 uSphereColor;
    uniform vec3 uLightColor;
    uniform vec3 uLightPosition;
    uniform float uSmoothness;
    uniform float uContrast;
    uniform float uFogDensity;
    uniform float uAnimationSpeed;
    uniform float uCameraDistance;
    uniform int uMovementPattern;
    uniform float uMovementSpeed;
    uniform float uMovementScale;
    uniform bool uIndividualRotation;
    uniform vec2 uMousePosition;
    uniform bool uMouseProximityEffect;
    uniform float uMinMovementScale;
    uniform float uMaxMovementScale;
    
    in vec2 vUv;
    out vec4 fragColor;
    
    const float PI = 3.14159265359;
    const float EPSILON = 0.0001;
    const int MAX_STEPS = 100;
    const float MAX_DIST = 100.0;
    
    // Signed Distance Function for a sphere
    float sdSphere(vec3 p, float r) {
      return length(p) - r;
    }
    
    // Smooth minimum function for blending
    float smin(float a, float b, float k) {
      float h = max(k - abs(a - b), 0.0) / k;
      return min(a, b) - h * h * k * 0.25;
    }
    
    // Rotation matrix around the Y axis
    mat3 rotateY(float theta) {
      float c = cos(theta);
      float s = sin(theta);
      return mat3(
        c, 0, s,
        0, 1, 0,
        -s, 0, c
      );
    }
    
    // Rotation matrix around the X axis
    mat3 rotateX(float theta) {
      float c = cos(theta);
      float s = sin(theta);
      return mat3(
        1, 0, 0,
        0, c, -s,
        0, s, c
      );
    }
    
    // Rotation matrix around the Z axis
    mat3 rotateZ(float theta) {
      float c = cos(theta);
      float s = sin(theta);
      return mat3(
        c, -s, 0,
        s, c, 0,
        0, 0, 1
      );
    }
    
    // Calculate distance to center for mouse proximity effect
    float getDistanceToCenter(vec2 pos) {
      // Use a smoother falloff function
      float dist = length(pos - vec2(0.5, 0.5)) * 2.0; // Normalized 0-1
      // Apply easing curve for smoother transition
      return smoothstep(0.0, 1.0, dist);
    }
    
    // Scene SDF
    float sdf(vec3 pos) {
      // Base result starts with a large value
      float result = MAX_DIST;
      
      // Animation parameters
      float t = uTime * uMovementSpeed;
      
      // Calculate dynamic movement scale based on mouse position if enabled
      float dynamicMovementScale = uMovementScale;
      if (uMouseProximityEffect) {
        float distToCenter = getDistanceToCenter(uMousePosition);
        // Use smoother interpolation between min and max scale
        // Add a bias to make the effect more subtle
        float t = smoothstep(0.0, 1.0, distToCenter);
        dynamicMovementScale = mix(uMinMovementScale, uMaxMovementScale, t);
      }
      
      // Create spheres based on count
      for (int i = 0; i < 10; i++) {
        if (i >= uSphereCount) break;
        
        // Unique parameters for each sphere
        float speed = 0.5 + float(i) * 0.1;
        float radius = 0.15 + float(i % 3) * 0.1;
        float orbitRadius = (0.5 + float(i % 5) * 0.2) * dynamicMovementScale;
        float phaseOffset = float(i) * PI * 0.2;
        
        // Calculate position with unique animation based on pattern
        vec3 offset;
        
        // Special movement for first two spheres - one going up, one going down
        if (i == 0) {
          // First sphere: bottom to top movement
          offset = vec3(
            sin(t * speed) * orbitRadius * 0.5,
            sin(t * 0.5) * orbitRadius, // Vertical movement
            cos(t * speed * 0.7) * orbitRadius * 0.5
          );
        } 
        else if (i == 1) {
          // Second sphere: top to bottom movement (opposite of first)
          offset = vec3(
            sin(t * speed + PI) * orbitRadius * 0.5,
            -sin(t * 0.5) * orbitRadius, // Opposite vertical movement
            cos(t * speed * 0.7 + PI) * orbitRadius * 0.5
          );
        }
        else if (uMovementPattern == 0) {
          // Orbital pattern
          offset = vec3(
            sin(t * speed + phaseOffset) * orbitRadius,
            cos(t * (speed * 0.7) + phaseOffset * 1.3) * (orbitRadius * 0.6),
            sin(t * (speed * 0.5) + phaseOffset * 0.9) * (orbitRadius * 0.8)
          );
        } 
        else if (uMovementPattern == 1) {
          // Wave pattern
          float wave = sin(t * 0.5) * 0.5;
          offset = vec3(
            sin(t * 0.2 + float(i) * 0.5) * orbitRadius,
            sin(t * 0.3 + float(i) * 0.7 + wave) * orbitRadius * 0.5,
            cos(t * 0.4 + float(i) * 0.6) * orbitRadius * 0.7
          );
        }
        else if (uMovementPattern == 2) {
          // Chaos pattern
          offset = vec3(
            sin(t * speed * 1.1 + sin(t * 0.4) * 2.0) * orbitRadius,
            cos(t * speed * 0.9 + sin(t * 0.5) * 1.5) * orbitRadius * 0.8,
            sin(t * speed * 0.7 + sin(t * 0.6) * 1.8) * orbitRadius * 0.6
          );
        }
        else {
          // Pulse pattern
          float pulse = (sin(t * 0.8) * 0.5 + 0.5) * 0.5 + 0.5;
          offset = vec3(
            sin(t * speed + phaseOffset) * orbitRadius * pulse,
            cos(t * (speed * 0.7) + phaseOffset * 1.3) * (orbitRadius * 0.6) * pulse,
            sin(t * (speed * 0.5) + phaseOffset * 0.9) * (orbitRadius * 0.8) * pulse
          );
        }
        
        // Apply individual rotation if enabled
        if (uIndividualRotation) {
          float rotSpeed = t * (0.2 + float(i) * 0.05);
          mat3 rot = rotateY(rotSpeed) * rotateX(rotSpeed * 0.7);
          offset = rot * offset;
        }
        
        // Apply sphere
        float sphere = sdSphere(pos + offset, radius);
        
        // Blend with smooth minimum
        result = smin(result, sphere, uSmoothness);
      }
      
      return result;
    }
    
    // Calculate normal at a point
    vec3 calcNormal(vec3 p) {
      vec2 e = vec2(EPSILON, 0.0);
      return normalize(vec3(
        sdf(p + e.xyy) - sdf(p - e.xyy),
        sdf(p + e.yxy) - sdf(p - e.yxy),
        sdf(p + e.yyx) - sdf(p - e.yyx)
      ));
    }
    
    // Ray marching
    float raymarch(vec3 ro, vec3 rd) {
      float t = 0.0;
      
      for (int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * t;
        float d = sdf(p);
        
        // Hit check
        if (d < EPSILON) {
          return t;
        }
        
        // Distance check
        if (t > MAX_DIST) {
          break;
        }
        
        // Adaptive step size for better detail near surfaces
        t += d * 0.8;
      }
      
      return -1.0; // No hit
    }
    
    // Soft shadows calculation
    float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
      float result = 1.0;
      float t = mint;
      
      for (int i = 0; i < 32; i++) {
        if (t >= maxt) break;
        
        float h = sdf(ro + rd * t);
        
        if (h < EPSILON) {
          return 0.0;
        }
        
        result = min(result, k * h / t);
        t += h;
      }
      
      return result;
    }
    
    // Ambient occlusion calculation
    float ambientOcclusion(vec3 p, vec3 n) {
      float occ = 0.0;
      float weight = 1.0;
      
      for (int i = 0; i < 5; i++) {
        float dist = 0.01 + 0.02 * float(i * i);
        float h = sdf(p + n * dist);
        occ += (dist - h) * weight;
        weight *= 0.85;
      }
      
      return clamp(1.0 - occ, 0.0, 1.0);
    }
    
    // Lighting calculation
    vec3 lighting(vec3 p, vec3 rd, float t) {
      if (t < 0.0) {
        return vec3(0.0); // Return transparent color
      }
      
      vec3 normal = calcNormal(p);
      vec3 viewDir = -rd;
      
      // Base color
      vec3 baseColor = uSphereColor;
      
      // Ambient light
      vec3 ambient = baseColor * uAmbientIntensity;
      
      // Directional light
      vec3 lightDir = normalize(uLightPosition);
      float diff = max(dot(normal, lightDir), 0.0);
      vec3 diffuse = baseColor * uLightColor * diff * uDiffuseIntensity;
      
      // Specular highlight
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), uSpecularPower);
      vec3 specular = uLightColor * spec * uSpecularIntensity;
      
      // Fresnel effect
      float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);
      specular *= fresnel;
      
      // Ambient occlusion
      float ao = ambientOcclusion(p, normal);
      
      // Soft shadows
      float shadow = softShadow(p, lightDir, 0.01, 10.0, 16.0);
      
      // Combine lighting
      vec3 color = ambient * ao + (diffuse * shadow + specular) * ao;
      
      // Apply contrast
      color = pow(color, vec3(uContrast));
      
      return color;
    }
    
    void main() {
      // Calculate UV coordinates
      vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / uResolution.y;
      
      // Camera setup
      vec3 ro = vec3(0.0, 0.0, -uCameraDistance);
      vec3 rd = normalize(vec3(uv, 1.0));
      
      // Apply slight camera rotation for more interesting view
      float camRotY = sin(uTime * 0.1) * 0.1;
      float camRotX = cos(uTime * 0.08) * 0.05;
      rd = rotateY(camRotY) * rotateX(camRotX) * rd;
      
      // Ray marching
      float t = raymarch(ro, rd);
      
      // Calculate hit position
      vec3 p = ro + rd * t;
      
      // Calculate color
      vec3 color = lighting(p, rd, t);
      
      // Apply fog with transparency
      if (t > 0.0) {
        float fogAmount = 1.0 - exp(-t * uFogDensity);
        color = mix(color, uBackgroundColor, fogAmount);
        fragColor = vec4(color, 1.0);
      } else {
        // Transparent background
        fragColor = vec4(0.0, 0.0, 0.0, 0.0);
      }
    }
  `;
}

// Log a message to confirm the code is running
console.log(
  "Ray marching visualization finished: You look great dev, are awesome!"
);

document.addEventListener("DOMContentLoaded", function () {
  const emailLink = document.querySelector(".contact-email");
  const originalText = emailLink.textContent;

  emailLink.addEventListener("click", function (e) {
    // Copy email to clipboard
    navigator.clipboard
      .writeText("hi@filip.fyi")
      .then(function () {
        // Change text to show it was copied
        emailLink.textContent = "e-mail copied to clipboard";

        // After 2 seconds, change back to original text
        setTimeout(function () {
          emailLink.textContent = originalText;
        }, 2000);
      })
      .catch(function (err) {
        console.error("Could not copy email: ", err);
      });
  });
});
import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import RAPIER from "https://cdn.skypack.dev/@dimforge/rapier3d-compat@0.11.2";
import * as dat from "https://cdn.skypack.dev/dat.gui";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import Stats from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/libs/stats.module.js";

let scene, camera, renderer, composer, controls, stats, gui;
let world, bodies, mouseBall, mouseLight;
const sceneMiddle = new THREE.Vector3(0, 0, 0);
let mousePos = new THREE.Vector2();

const numBodies = 100;

// Ball settings
const ballSettings = {
  color: "#ffa800", // Ball color
  glowColor: "#ffa800", // Glow color
  glowIntensity: 3 // Glow intensity
};

const textureLoader = new THREE.TextureLoader();
const matcap = textureLoader.load(
  "https://pbs.twimg.com/media/EQVip4yU4AENYb3.png"
);

// Grain Shader
const grainShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.1 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
    }
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float grain = random(vUv + amount) * amount;
      gl_FragColor = color + vec4(grain, grain, grain, 0.0);
    }
  `
};

// Grayscale Shader
const grayscaleShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.0 } // Starts off, set to 1.0 for full grayscale
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      gl_FragColor = vec4(mix(color.rgb, vec3(gray), amount), color.a);
    }
  `
};

async function init() {
  await RAPIER.init();

  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75, // Field of View, adjust to zoom in/out
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 4; // Adjust this value to zoom in or out of the scene

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Post-processing setup
  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    2.5, // Bloom strength
    0.4, // Bloom radius
    0.2 // Bloom threshold
  );
  const grainPass = new ShaderPass(grainShader);
  const grayscalePass = new ShaderPass(grayscaleShader);

  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);
  composer.addPass(grainPass);
  composer.addPass(grayscalePass);

  // Lighting setup
  const hemiLight = new THREE.HemisphereLight(0x00bbff, 0xaa00ff, 0.5);
  scene.add(hemiLight);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true; // Allows zooming with mouse scroll
  controls.zoomSpeed = 1.2; // Adjust zoom speed

  // Stats
  stats = new Stats();
  document.body.appendChild(stats.dom);

  // GUI setup
  gui = new dat.GUI();
  const bloomFolder = gui.addFolder("Bloom");
  bloomFolder.add(bloomPass, "strength", 0, 3).name("Strength");
  bloomFolder.add(bloomPass, "radius", 0, 1).name("Radius");
  bloomFolder.add(bloomPass, "threshold", 0, 1).name("Threshold");

  const grainFolder = gui.addFolder("Grain");
  grainFolder.add(grainPass.uniforms.amount, "value", 0, 0.2).name("Intensity");

  const grayscaleFolder = gui.addFolder("Grayscale");
  grayscaleFolder
    .add(grayscalePass.uniforms.amount, "value", 0, 1)
    .name("Grayscale Amount");

  // Add ball settings to the GUI
  const ballFolder = gui.addFolder("Ball Settings");
  ballFolder
    .addColor(ballSettings, "color")
    .name("Ball Color")
    .onChange(updateBallColor);
  ballFolder
    .addColor(ballSettings, "glowColor")
    .name("Glow Color")
    .onChange(updateGlowColor);
  ballFolder
    .add(ballSettings, "glowIntensity", 0, 10)
    .name("Glow Intensity")
    .onChange(updateGlowIntensity);

  // Physics world setup
  const gravity = { x: 0.0, y: 0, z: 0.0 }; // No gravity for controlled movement
  world = new RAPIER.World(gravity);

  // Create bodies
  bodies = [];
  for (let i = 0; i < numBodies; i++) {
    const body = createBody(RAPIER, world);
    bodies.push(body);
    scene.add(body.mesh);
  }

  // Create mouse ball with light
  mouseBall = createMouseBall(RAPIER, world);
  scene.add(mouseBall.mesh);

  // Event listeners
  window.addEventListener("resize", onWindowResize, false);
  window.addEventListener("mousemove", onMouseMove, false);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  world.step();

  // Update bodies and mouse ball
  bodies.forEach((b) => b.update());
  mouseBall.update(mousePos);

  // Render scene with post-processing
  composer.render();

  // Update controls and stats
  controls.update();
  stats.update();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
  mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function createBody(RAPIER, world) {
  const size = 0.1 + Math.random() * 0.25;
  const range = 5;
  const density = size * 1.0;
  let x = Math.random() * range - range * 0.5;
  let y = Math.random() * range - range * 0.5 + 3;
  let z = Math.random() * range - range * 0.5;

  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z);
  let rigid = world.createRigidBody(rigidBodyDesc);
  let colliderDesc = RAPIER.ColliderDesc.ball(size).setDensity(density);
  world.createCollider(colliderDesc, rigid);

  const geometry = new THREE.IcosahedronGeometry(size, 1);
  const material = new THREE.MeshMatcapMaterial({
    matcap: matcap
  });
  const mesh = new THREE.Mesh(geometry, material);

  function update() {
    rigid.resetForces(true); // Reset forces to avoid falling
    let { x, y, z } = rigid.translation();
    let pos = new THREE.Vector3(x, y, z);
    let dir = pos.clone().sub(sceneMiddle).normalize();
    rigid.addForce(dir.multiplyScalar(-0.5), true); // Apply controlled force
    mesh.position.set(x, y, z);
  }

  return { mesh, rigid, update };
}

function createMouseBall(RAPIER, world) {
  const mouseSize = 0.25;
  const geometry = new THREE.IcosahedronGeometry(mouseSize, 8);
  const material = new THREE.MeshStandardMaterial({
    color: ballSettings.color, // Use the GUI-controlled color
    emissive: ballSettings.color // Matching emissive color for glow effect
  });
  const mouseMesh = new THREE.Mesh(geometry, material);

  // Add PointLight inside the main ball
  mouseLight = new THREE.PointLight(
    ballSettings.glowColor,
    ballSettings.glowIntensity,
    15,
    1.5
  );
  mouseMesh.add(mouseLight); // Attach light to the main ball

  let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
    0,
    0,
    0
  );
  let mouseRigid = world.createRigidBody(bodyDesc);
  let colliderDesc = RAPIER.ColliderDesc.ball(mouseSize * 3.0);
  world.createCollider(colliderDesc, mouseRigid);

  function update(mousePos) {
    const targetX = mousePos.x * 5; // Adjust to control sensitivity
    const targetY = mousePos.y * 5;
    mouseRigid.setTranslation({ x: targetX, y: targetY, z: 0.2 });
    const { x, y, z } = mouseRigid.translation();
    mouseMesh.position.set(x, y, z);
  }

  return { mesh: mouseMesh, update };
}

function updateBallColor() {
  mouseBall.mesh.material.color.set(ballSettings.color);
  mouseBall.mesh.material.emissive.set(ballSettings.color);
}

function updateGlowColor() {
  mouseLight.color.set(ballSettings.glowColor);
}

function updateGlowIntensity() {
  mouseLight.intensity = ballSettings.glowIntensity;
}

init();
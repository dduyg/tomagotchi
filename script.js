import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import { MarchingCubes } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/objects/MarchingCubes.js";
import RAPIER from "https://cdn.skypack.dev/@dimforge/rapier3d-compat@0.11.2";
import * as dat from "https://cdn.skypack.dev/dat.gui";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js";
import { ShaderMaterial } from "https://cdn.skypack.dev/three@0.136.0";

// Scene setup
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(25, w / h, 0.1, 1000);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// Orbit Controls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Initialize Rapier physics world
await RAPIER.init();
let gravity = { x: 1, y: 3, z: 5 };
let world = new RAPIER.World(gravity);

let mousePos = new THREE.Vector2();
let mouseX = 0;
let mouseY = 0;

// Parallax settings and colors
const settings = {
  parallaxStrength: 0.1, // Global parallax strength
  metaballDepth: 0.1, // Depth multiplier for metaballs
  textDepth: 0.1, // Depth multiplier for text
  backgroundColor: "#000000", // Background color
  textColor: "#0019ff" // Text color
};

// Set initial background color
scene.background = new THREE.Color(settings.backgroundColor);

// Load matcap texture
const textureLoader = new THREE.TextureLoader();
const matcap = textureLoader.load(
  "https://pbs.twimg.com/media/EQVip4yU4AENYb3.png"
);

// Create a render target for the background
const backgroundRenderTarget = new THREE.WebGLRenderTarget(w, h);

// Create metaballs with custom shader
const metaballsShader = {
  uniforms: {
    tBackground: { value: null },
    tMatcap: { value: null },
    resolution: { value: new THREE.Vector2(w, h) },
    refractionRatio: { value: 0.8 },
    distortionAmount: { value: 0.1 }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vColor;

    attribute vec3 color;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      vColor = color;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D tBackground;
    uniform sampler2D tMatcap;
    uniform vec2 resolution;
    uniform float refractionRatio;
    uniform float distortionAmount;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vColor;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      
      // Calculate refraction
      vec3 refracted = refract(viewDir, normal, refractionRatio);
      
      // Calculate UV offset based on refraction
      vec2 uv = gl_FragCoord.xy / resolution;
      vec2 offset = refracted.xy * distortionAmount;
      
      // Sample background with offset
      vec4 backgroundColor = texture2D(tBackground, uv + offset);
      
      // Sample matcap
      vec3 r = reflect(-viewDir, normal);
      float m = 2.0 * sqrt(r.x * r.x + r.y * r.y + (r.z + 1.0) * (r.z + 1.0));
      vec2 matcapUv = r.xy / m + 0.5;
      vec4 matcapColor = texture2D(tMatcap, matcapUv);
      
      // Blend background and matcap
      vec4 finalColor = mix(backgroundColor, matcapColor, 0.5);
      finalColor.rgb *= vColor;
      
      gl_FragColor = finalColor;
    }
  `
};

const metaMat = new ShaderMaterial(metaballsShader);
metaMat.uniforms.tMatcap.value = matcap;

const metaballs = new MarchingCubes(96, metaMat, true, true, 90000);
metaballs.scale.setScalar(8);
metaballs.isolation = 1000;
scene.add(metaballs);

// Add ambient light for better visibility
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Updated function to handle multiline text rendering
function create2DTextTexture(text, fontSize, color) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Define canvas size
  canvas.width = 2048;
  canvas.height = 1024; // Adjust height to accommodate two lines

  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Split the text into two lines
  const lines = text.split(" "); // Adjust split logic if needed for specific phrases
  const lineHeight = fontSize * 0.7; // Line height multiplier for spacing

  // Draw the first line ("The") on the upper half
  ctx.fillText(lines[0], canvas.width / 2, canvas.height / 2 - lineHeight / 2);

  // Draw the second line ("Descent") on the lower half
  ctx.fillText(lines[1], canvas.width / 2, canvas.height / 2 + lineHeight / 2);

  return new THREE.CanvasTexture(canvas);
}

// Create and add text plane with multiline text
let textTexture = create2DTextTexture("The Descent", 180, settings.textColor); // Use two words separated by space
const aspectRatio = 2048 / 1024; // Adjust aspect ratio based on new canvas size
const planeWidth = 20;
const planeHeight = planeWidth / aspectRatio;

const textGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
const textMaterial = new THREE.MeshBasicMaterial({
  map: textTexture,
  transparent: true,
  opacity: 0.8
});
const textMesh = new THREE.Mesh(textGeometry, textMaterial);
textMesh.position.set(0, 0, -8);
scene.add(textMesh);

// Function to update text color
function updateTextColor() {
  textTexture = create2DTextTexture("TheDescent", 180, settings.textColor);
  textMaterial.map = textTexture;
  textMaterial.needsUpdate = true;
}

// Function to create dynamic rigid bodies with metaball updates
function getBody({ debug = false, RAPIER, world }) {
  const size = 0.2;
  const range = 3;
  const density = 0.5;
  let x = Math.random() * range - range * 0.5;
  let y = Math.random() * range - range * 0.5 + 3;
  let z = Math.random() * range - range * 0.5;

  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(x, y, z)
    .setLinearDamping(2);
  let rigid = world.createRigidBody(rigidBodyDesc);
  let colliderDesc = RAPIER.ColliderDesc.ball(size).setDensity(density);
  world.createCollider(colliderDesc, rigid);

  const color = new THREE.Color().setHSL(Math.random(), 1, 0.5);

  function update() {
    rigid.resetForces(true);
    let position = rigid.translation();
    let pos = new THREE.Vector3(position.x, position.y, position.z);
    let dir = pos.clone().sub(new THREE.Vector3(0, 0, 0)).normalize();
    rigid.addForce(dir.multiplyScalar(-0.5), true);
    pos.multiplyScalar(0.1).add(new THREE.Vector3(0.5, 0.5, 0.5));
    return { pos, color };
  }

  return { update };
}

// Create metaball bodies
const bodies = [];
const numBodies = 10;
for (let i = 0; i < numBodies; i++) {
  const body = getBody({ RAPIER, world });
  bodies.push(body);
}

// MOUSE RIGID BODY setup
let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
  0,
  0,
  0
);
let mouseRigid = world.createRigidBody(bodyDesc);
let dynamicCollider = RAPIER.ColliderDesc.ball(0.5);
world.createCollider(dynamicCollider, mouseRigid);

// dat.gui setup
const gui = new dat.GUI();
const params = {
  grainSize: 1,
  grainIntensity: 0.15,
  blackAndWhite: true
};

gui.add(params, "grainSize", 0.1, 5).onChange(updateEffects);
gui.add(params, "grainIntensity", 0, 1).onChange(updateEffects);
gui.add(params, "blackAndWhite").onChange(updateEffects);
gui
  .add(metaMat.uniforms.refractionRatio, "value", 0, 1)
  .name("Refraction Ratio");
gui
  .add(metaMat.uniforms.distortionAmount, "value", 0, 0.5)
  .name("Distortion Amount");
gui;
gui
  .add(settings, "parallaxStrength", 0.01, 0.5, 0.01)
  .name("Parallax Strength");
gui.add(settings, "metaballDepth", 0.1, 1.5, 0.05).name("Metaball Depth");
gui.add(settings, "textDepth", 0.5, 2.5, 0.05).name("Text Depth");
gui
  .addColor(settings, "backgroundColor")
  .name("Background Color")
  .onChange(() => {
    scene.background.set(settings.backgroundColor);
  });
gui
  .addColor(settings, "textColor")
  .name("Text Color")
  .onChange(updateTextColor);

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Custom shader for grain and black & white effects
const customShader = {
  uniforms: {
    tDiffuse: { value: null },
    grainSize: { value: params.grainSize },
    grainIntensity: { value: params.grainIntensity },
    blackAndWhite: { value: params.blackAndWhite }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float grainSize;
    uniform float grainIntensity;
    uniform bool blackAndWhite;
    varying vec2 vUv;

    float random(vec2 p) {
      return fract(sin(dot(p.xy, vec2(12.9898,78.233))) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      
      // Apply grain
      vec2 grainUv = vUv * grainSize;
      float grain = random(grainUv) * grainIntensity;
      color.rgb += vec3(grain);
      
      // Apply black and white
      if (blackAndWhite) {
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        color.rgb = vec3(gray);
      }
      
      gl_FragColor = color;
    }
  `
};

const customPass = new ShaderPass(customShader);
composer.addPass(customPass);

function updateEffects() {
  customPass.uniforms.grainSize.value = params.grainSize;
  customPass.uniforms.grainIntensity.value = params.grainIntensity;
  customPass.uniforms.blackAndWhite.value = params.blackAndWhite;
}

// Updated Parallax Effect Function with Limited Rotation
function applyParallaxEffect(object, depth, baseStrength, depthMultiplier = 1) {
  // Calculate normalized mouse positions
  const normalizedX = mouseX * depth;
  const normalizedY = mouseY * depth;

  // Adjust position, including depth movement (translateZ)
  object.position.x += (normalizedX - object.position.x) * baseStrength;
  object.position.y += (normalizedY - object.position.y) * baseStrength;

  // Fine-tune depth movement (translateZ) with depthMultiplier
  object.position.z = -0.3 * (normalizedY + normalizedX) * depthMultiplier; // Controls closer/farther effect

  // Calculate and limit rotation based on mouse position
  const maxRotation = 0.1; // Maximum rotation in radians (~5.7 degrees)
  object.rotation.y = THREE.MathUtils.clamp(
    THREE.MathUtils.degToRad(normalizedX * 3),
    -maxRotation,
    maxRotation
  ); // Horizontal rotation limited
  object.rotation.x = THREE.MathUtils.clamp(
    THREE.MathUtils.degToRad(normalizedY * 3),
    -maxRotation,
    maxRotation
  ); // Vertical rotation limited
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  world.step();

  // Update mouse rigid body translation
  mouseRigid.setTranslation({ x: mousePos.x * 4, y: mousePos.y * 4, z: 0 });

  // Render background (scene without metaballs)
  metaballs.visible = false;
  renderer.setRenderTarget(backgroundRenderTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  metaMat.uniforms.tBackground.value = backgroundRenderTarget.texture;
  metaballs.visible = true;

  // Update metaballs
  metaballs.reset();
  bodies.forEach((b) => {
    const { pos, color } = b.update();
    metaballs.addBall(pos.x, pos.y, pos.z, 0.5, 10, color.getHex());
  });

  // Apply enhanced parallax effect to metaballs and text
  applyParallaxEffect(
    metaballs,
    settings.metaballDepth,
    settings.parallaxStrength * 0.5,
    0.3
  ); // Adjust depth sensitivity for metaballs
  applyParallaxEffect(
    textMesh,
    settings.textDepth,
    settings.parallaxStrength,
    0.5
  ); // Text moves more, with higher depth multiplier

  // Render the composer with post-processing
  composer.render();
}

animate();

// Handle window resize
function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  backgroundRenderTarget.setSize(window.innerWidth, window.innerHeight);
  metaMat.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", handleWindowResize, false);

// Handle mouse movement
function handleMouseMove(evt) {
  mouseX = (evt.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(evt.clientY / window.innerHeight) * 2 + 1;
  mousePos.x = mouseX;
  mousePos.y = mouseY;
}
window.addEventListener("mousemove", handleMouseMove, false);
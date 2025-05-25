import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import * as dat from "https://cdn.skypack.dev/dat.gui";

// Raycaster for detecting mouse interactions
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let lastMouseMoveTime = 0;
let lastMousePosition = new THREE.Vector2();
let mouseSpeed = 0;
let lastMouseSpeed = 0;

// Load a matcap texture
const loader = new THREE.TextureLoader();
const matcapTexture = loader.load(
  "https://raw.githubusercontent.com/nidorx/matcaps/master/1024/0A0A0A_A9A9A9_525252_747474.png"
);

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Renderer setup with shadow support
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(-30, 15, 30);
camera.lookAt(0, 0, 0);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;

// Apply the matcap material correctly to the spheres
const matcapMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });

// Create a grid of spheres
const gridSize = 80;
const spacing = 0.4;
const geometry = new THREE.SphereGeometry(0.15, 32, 32);

const spheres = [];
const originalPositions = []; // Store original positions

// Initialize spheres and their original positions
for (let i = -gridSize / 2; i < gridSize / 2; i++) {
  for (let j = -gridSize / 2; j < gridSize / 2; j++) {
    const sphere = new THREE.Mesh(geometry, matcapMaterial);
    const position = new THREE.Vector3(i * spacing, 0, j * spacing);

    sphere.position.copy(position);
    scene.add(sphere);
    spheres.push(sphere);

    originalPositions.push(position.clone());
  }
}

// Mouse move event to track mouse position
window.addEventListener("mousemove", onMouseMove);

function onMouseMove(event) {
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastMouseMoveTime) / 1000; // in seconds
  lastMouseMoveTime = currentTime;

  const rect = renderer.domElement.getBoundingClientRect();
  if (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  ) {
    const newMouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const newMouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Calculate mouse speed
    const dx = newMouseX - lastMousePosition.x;
    const dy = newMouseY - lastMousePosition.y;
    mouseSpeed = Math.sqrt(dx * dx + dy * dy) / deltaTime;

    mouse.x = newMouseX;
    mouse.y = newMouseY;
    lastMousePosition.set(newMouseX, newMouseY);
  } else {
    mouse.x = -9999;
  }
}

// Function to get the mouse position in world coordinates
function getMouseWorldPosition() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(plane);
  if (intersects.length > 0) {
    return intersects[0].point;
  }
  return null;
}

// Create an invisible plane for detecting mouse position
const planeGeometry = new THREE.PlaneGeometry(500, 500);
const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// GUI for controlling parameters
const guiParams = {
  rippleSpeed: 1.5,
  rippleFrequency: 0.95,
  rippleAmplitude: 0.5,
  attenuation: 0.15,
  interactionRadius: 8.0,
  waveLifetime: 2.0,
  minSpeed: 0.5,
  maxSpeed: 10,
  minRippleDistance: 0.5,
  maxRippleHeight: 1.0,
  maxRipples: 15,
  velocityFactor: 0.7,
  transitionSpeed: 0.05,
  returnSpeed: 0.02
};

const gui = new dat.GUI();
gui.add(guiParams, "rippleSpeed", 0.1, 10.0).name("Ripple Speed");
gui.add(guiParams, "rippleFrequency", 0.1, 2.0).name("Ripple Frequency");
gui.add(guiParams, "rippleAmplitude", 0.1, 2.0).name("Ripple Amplitude");
gui.add(guiParams, "attenuation", 0.01, 0.5).name("Attenuation");
gui.add(guiParams, "interactionRadius", 1.0, 20.0).name("Interaction Radius");
gui.add(guiParams, "waveLifetime", 0.5, 5.0).name("Wave Lifetime");
gui.add(guiParams, "minSpeed", 0.1, 1.0).name("Min Mouse Speed");
gui.add(guiParams, "maxSpeed", 5.0, 20.0).name("Max Mouse Speed");
gui.add(guiParams, "minRippleDistance", 0.1, 2.0).name("Min Ripple Distance");
gui.add(guiParams, "maxRippleHeight", 0.1, 2.0).name("Max Ripple Height");
gui.add(guiParams, "maxRipples", 1, 30).step(1).name("Max Ripples");
gui.add(guiParams, "velocityFactor", 0, 1).name("Velocity Influence");
gui.add(guiParams, "transitionSpeed", 0.01, 0.5).name("Transition Speed");
gui.add(guiParams, "returnSpeed", 0.01, 0.1).name("Return Speed");

// Store ripple origins and times
let rippleOrigins = [];
let rippleStartTimes = [];
let rippleStrengths = [];
let lastRippleOrigin = new THREE.Vector3();
let movingState = 0; // 0: stopped, 1: moving

function calculateRipple(distance, time, strength) {
  const waveLength = (2 * Math.PI) / guiParams.rippleFrequency;
  const phase = time * guiParams.rippleSpeed;
  const amplitude =
    guiParams.rippleAmplitude *
    strength *
    Math.exp(-guiParams.attenuation * distance);
  return amplitude * Math.sin(2 * Math.PI * (distance / waveLength - phase));
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const time = performance.now() * 0.001; // Convert to seconds

  // Smooth out mouse speed for more stable effects
  lastMouseSpeed = THREE.MathUtils.lerp(lastMouseSpeed, mouseSpeed, 0.1);

  // Calculate velocity factor
  const velocityFactor = THREE.MathUtils.clamp(
    (lastMouseSpeed - guiParams.minSpeed) /
      (guiParams.maxSpeed - guiParams.minSpeed),
    0,
    1
  );

  // Check if mouse has stopped moving
  const isMouseMoving = performance.now() - lastMouseMoveTime < 16; // Consider stopped if no movement for 1 frame at 60fps

  // Smoothly transition between moving and stopped states
  movingState = THREE.MathUtils.lerp(
    movingState,
    isMouseMoving ? 1 : 0,
    guiParams.transitionSpeed
  );

  const mouseWorldPos = getMouseWorldPosition();

  if (
    movingState > 0.1 &&
    mouseWorldPos &&
    (!lastRippleOrigin ||
      mouseWorldPos.distanceTo(lastRippleOrigin) > guiParams.minRippleDistance)
  ) {
    // On mouse interaction, add a new ripple origin
    rippleOrigins.push(mouseWorldPos.clone());
    rippleStartTimes.push(time);
    rippleStrengths.push(1.0 + velocityFactor * guiParams.velocityFactor); // Stronger ripples for faster movement
    lastRippleOrigin.copy(mouseWorldPos);

    // Limit the number of active ripples
    if (rippleOrigins.length > guiParams.maxRipples) {
      rippleOrigins.shift();
      rippleStartTimes.shift();
      rippleStrengths.shift();
    }
  }

  // Update spheres
  for (let i = 0; i < spheres.length; i++) {
    const sphere = spheres[i];
    const originalPos = originalPositions[i];
    const position = sphere.position;

    // Calculate cumulative ripple effect from all ripple origins
    let rippleY = 0;
    for (let j = 0; j < rippleOrigins.length; j++) {
      const origin = rippleOrigins[j];
      const startTime = rippleStartTimes[j];
      const strength = rippleStrengths[j];

      const elapsedTime = time - startTime;
      const distance = position.distanceTo(origin);

      if (elapsedTime < guiParams.waveLifetime) {
        rippleY += calculateRipple(distance, elapsedTime, strength);
      }
    }

    // Limit the maximum ripple height
    rippleY = THREE.MathUtils.clamp(
      rippleY,
      -guiParams.maxRippleHeight,
      guiParams.maxRippleHeight
    );

    // Apply the ripple effect with smooth transition
    const transitionFactor =
      movingState > 0.1 ? guiParams.transitionSpeed : guiParams.returnSpeed;
    sphere.position.y = THREE.MathUtils.lerp(
      sphere.position.y,
      originalPos.y + rippleY * movingState,
      transitionFactor
    );

    // Optional: Add some horizontal movement for more realism
    const horizontalOffset = rippleY * 0.1 * movingState;
    sphere.position.x = THREE.MathUtils.lerp(
      sphere.position.x,
      originalPos.x + horizontalOffset,
      transitionFactor
    );
    sphere.position.z = THREE.MathUtils.lerp(
      sphere.position.z,
      originalPos.z + horizontalOffset,
      transitionFactor
    );
  }

  // Remove old ripples
  const currentTime = time;
  rippleOrigins = rippleOrigins.filter(
    (_, index) => currentTime - rippleStartTimes[index] < guiParams.waveLifetime
  );
  rippleStartTimes = rippleStartTimes.filter(
    (startTime) => currentTime - startTime < guiParams.waveLifetime
  );
  rippleStrengths = rippleStrengths.filter(
    (_, index) => currentTime - rippleStartTimes[index] < guiParams.waveLifetime
  );

  controls.update();
  renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
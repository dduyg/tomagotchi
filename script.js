import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

const PARAMS = {
  distortion: {
    strength: 0.1,
    radius: 0.2,
    edgeWidth: 0.03,
    edgeOpacity: 0.1,
    chromaticAberration: 0.02,
    reflectionIntensity: 0.2,
    waveDistortion: 0.05,
    waveSpeed: 0.8,
    lensBlur: 0.1,
    clearCenterSize: 0.5 // New parameter for clear center size
  }
};

let scene, camera, renderer, controls;
let composer, customPass;
let backgroundTexture;
let aspect;

function main() {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  aspect = window.innerWidth / window.innerHeight;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10);
  camera.position.z = 1;

  controls = new OrbitControls(camera, canvas);
  controls.enabled = false;

  loadBackgroundTexture();
  setupPostProcessing();
  setupGUI();

  window.addEventListener("resize", onWindowResize);
  document.addEventListener("mousemove", onMouseMove);

  animate();
}

function loadBackgroundTexture() {
  new THREE.TextureLoader().load(
    "https://images.unsplash.com/photo-1504805572947-34fad45aed93?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    (texture) => {
      backgroundTexture = texture;
      const bgAspect = texture.image.width / texture.image.height;
      const bgGeometry = new THREE.PlaneGeometry(2 * bgAspect, 2);
      const bgMaterial = new THREE.MeshBasicMaterial({ map: texture });
      const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
      scene.add(bgMesh);
    }
  );
}

function setupPostProcessing() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const vertexShader = `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `;

  const fragmentShader = `
                uniform sampler2D tDiffuse;
                uniform vec2 uMouse;
                uniform float uRadius;
                uniform float uStrength;
                uniform float uEdgeWidth;
                uniform float uEdgeOpacity;
                uniform float uChromaticAberration;
                uniform float uReflectionIntensity;
                uniform float uWaveDistortion;
                uniform float uWaveSpeed;
                uniform float uLensBlur;
                uniform float uClearCenterSize;
                uniform float uAspect;
                uniform float uTime;
                varying vec2 vUv;

                vec4 blur(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
                    vec4 color = vec4(0.0);
                    vec2 off1 = vec2(1.3333333333333333) * direction;
                    color += texture2D(image, uv) * 0.29411764705882354;
                    color += texture2D(image, uv + (off1 / resolution)) * 0.35294117647058826;
                    color += texture2D(image, uv - (off1 / resolution)) * 0.35294117647058826;
                    return color;
                }

                void main() {
                    vec2 center = uMouse;
                    vec2 adjustedUv = vUv;
                    adjustedUv.x *= uAspect;
                    center.x *= uAspect;
                    float dist = distance(adjustedUv, center);
                    
                    if (dist < uRadius) {
                        float normalizedDist = dist / uRadius;
                        vec2 direction = normalize(adjustedUv - center);
                        
                        // Calculate distortion factor based on clear center size
                        float clearArea = uClearCenterSize * uRadius;
                        float distortionFactor = smoothstep(clearArea, uRadius, dist);
                        
                        // Edge-focused distortion
                        vec2 distortedUv = adjustedUv - direction * uStrength * distortionFactor * distortionFactor;
                        
                        // Wave distortion
                        float wave = sin(normalizedDist * 10.0 - uTime * uWaveSpeed) * uWaveDistortion * distortionFactor;
                        distortedUv += direction * wave;
                        
                        distortedUv.x /= uAspect;

                        // Chromatic aberration
                        float aberrationStrength = uChromaticAberration * distortionFactor;
                        vec2 redUv = distortedUv + direction * aberrationStrength / vec2(uAspect, 1.0);
                        vec2 blueUv = distortedUv - direction * aberrationStrength / vec2(uAspect, 1.0);

                        vec4 colorR = texture2D(tDiffuse, redUv);
                        vec4 colorG = texture2D(tDiffuse, distortedUv);
                        vec4 colorB = texture2D(tDiffuse, blueUv);

                        // Reflection effect
                        vec4 reflection = texture2D(tDiffuse, vUv + direction * 0.1 * distortionFactor);
                        
                        gl_FragColor = vec4(colorR.r, colorG.g, colorB.b, 1.0);
                        gl_FragColor = mix(gl_FragColor, reflection, uReflectionIntensity * distortionFactor);

                        // Lens blur
                        float blurAmount = uLensBlur * distortionFactor;
                        gl_FragColor = mix(gl_FragColor, blur(tDiffuse, distortedUv, vec2(1.0 / uAspect, 1.0), vec2(blurAmount)), distortionFactor);

                        // Edge highlight
                        float edgeHighlight = smoothstep(uRadius - uEdgeWidth, uRadius, dist);
                        gl_FragColor = mix(gl_FragColor, vec4(1.0, 1.0, 1.0, 1.0), edgeHighlight * uEdgeOpacity);
                    } else {
                        gl_FragColor = texture2D(tDiffuse, vUv);
                    }
                }
            `;

  customPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uRadius: { value: PARAMS.distortion.radius },
      uStrength: { value: PARAMS.distortion.strength },
      uEdgeWidth: { value: PARAMS.distortion.edgeWidth },
      uEdgeOpacity: { value: PARAMS.distortion.edgeOpacity },
      uChromaticAberration: { value: PARAMS.distortion.chromaticAberration },
      uReflectionIntensity: { value: PARAMS.distortion.reflectionIntensity },
      uWaveDistortion: { value: PARAMS.distortion.waveDistortion },
      uWaveSpeed: { value: PARAMS.distortion.waveSpeed },
      uLensBlur: { value: PARAMS.distortion.lensBlur },
      uClearCenterSize: { value: PARAMS.distortion.clearCenterSize },
      uAspect: { value: aspect },
      uTime: { value: 0 }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  });
  composer.addPass(customPass);
}

function setupGUI() {
  const gui = new GUI();
  const distFolder = gui.addFolder("Distortion");
  distFolder
    .add(PARAMS.distortion, "strength", 0, 1)
    .onChange((value) => (customPass.uniforms.uStrength.value = value));
  distFolder
    .add(PARAMS.distortion, "radius", 0.1, 0.5)
    .onChange((value) => (customPass.uniforms.uRadius.value = value));
  distFolder
    .add(PARAMS.distortion, "edgeWidth", 0, 0.05)
    .onChange((value) => (customPass.uniforms.uEdgeWidth.value = value));
  distFolder
    .add(PARAMS.distortion, "edgeOpacity", 0, 1)
    .onChange((value) => (customPass.uniforms.uEdgeOpacity.value = value));
  distFolder
    .add(PARAMS.distortion, "chromaticAberration", 0, 0.1)
    .onChange(
      (value) => (customPass.uniforms.uChromaticAberration.value = value)
    );
  distFolder
    .add(PARAMS.distortion, "reflectionIntensity", 0, 1)
    .onChange(
      (value) => (customPass.uniforms.uReflectionIntensity.value = value)
    );
  distFolder
    .add(PARAMS.distortion, "waveDistortion", 0, 0.1)
    .onChange((value) => (customPass.uniforms.uWaveDistortion.value = value));
  distFolder
    .add(PARAMS.distortion, "waveSpeed", 0, 5)
    .onChange((value) => (customPass.uniforms.uWaveSpeed.value = value));
  distFolder
    .add(PARAMS.distortion, "lensBlur", 0, 0.1)
    .onChange((value) => (customPass.uniforms.uLensBlur.value = value));
  distFolder
    .add(PARAMS.distortion, "clearCenterSize", 0, 1)
    .onChange((value) => (customPass.uniforms.uClearCenterSize.value = value));
  distFolder.open();
}

function onWindowResize() {
  aspect = window.innerWidth / window.innerHeight;
  camera.left = -aspect;
  camera.right = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  customPass.uniforms.uAspect.value = aspect;
}

function onMouseMove(event) {
  const mousePosition = new THREE.Vector2(
    event.clientX / window.innerWidth,
    1 - event.clientY / window.innerHeight
  );
  customPass.uniforms.uMouse.value.copy(mousePosition);
}

function animate(time) {
  requestAnimationFrame(animate);
  customPass.uniforms.uTime.value = time * 0.001;
  composer.render();
}

main();
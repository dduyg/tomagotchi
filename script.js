import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

let scene, camera, renderer, controls;
let composer, customPass;
let outerTorus, middleTorus, innerTorus, mouseSphere;
let cubeRenderTarget, cubeCamera;
let backgroundTexture;
let mouse = new THREE.Vector2();

const PARAMS = {
  material: {
    color: "#FFFFFF",
    metalness: 0.0,
    roughness: 0.1,
    transmission: 1.0,
    thickness: 1.0,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1
  },
  rotationSpeed: 0.5,
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
    clearCenterSize: 0.5
  }
};

async function init() {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 10);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  await setupBackground();
  setupLights();
  createMaterials();
  createShapes();
  setupPostProcessing();
  setupGUI();

  window.addEventListener("resize", onWindowResize, false);
  document.addEventListener("mousemove", onMouseMove, false);

  animate();
}

function setupLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
}

async function setupBackground() {
  const loader = new THREE.TextureLoader();
  backgroundTexture = await new Promise((resolve) => {
    loader.load(
      "https://images.unsplash.com/photo-1493278125710-29e0d5195764?q=80&w=2532&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      resolve
    );
  });

  updateBackgroundSize();
}

function updateBackgroundSize() {
  if (backgroundTexture) {
    const aspect = window.innerWidth / window.innerHeight;
    const imageAspect =
      backgroundTexture.image.width / backgroundTexture.image.height;

    let scale;
    if (aspect > imageAspect) {
      scale = new THREE.Vector2(1, imageAspect / aspect);
    } else {
      scale = new THREE.Vector2(aspect / imageAspect, 1);
    }

    backgroundTexture.offset.set((1 - scale.x) / 2, (1 - scale.y) / 2);
    backgroundTexture.repeat.set(scale.x, scale.y);

    scene.background = backgroundTexture;
  }
}

function createMaterials() {
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PARAMS.material.color),
    metalness: PARAMS.material.metalness,
    roughness: PARAMS.material.roughness,
    transmission: PARAMS.material.transmission,
    thickness: PARAMS.material.thickness,
    ior: PARAMS.material.ior,
    clearcoat: PARAMS.material.clearcoat,
    clearcoatRoughness: PARAMS.material.clearcoatRoughness,
    side: THREE.DoubleSide,
    transparent: true,
    envMapIntensity: 1,
    refractionRatio: 0.98
  });

  cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
  });
  cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
  glassMaterial.envMap = cubeRenderTarget.texture;
  glassMaterial.envMap.mapping = THREE.CubeRefractionMapping;

  return glassMaterial;
}

function createShapes() {
  const glassMaterial = createMaterials();
  const outerTorusGeometry = new THREE.TorusGeometry(1.2, 0.3, 64, 64);
  const middleTorusGeometry = new THREE.TorusGeometry(0.9, 0.25, 64, 64);
  const innerTorusGeometry = new THREE.TorusGeometry(0.6, 0.2, 64, 64);
  const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);

  outerTorus = new THREE.Mesh(outerTorusGeometry, glassMaterial);
  middleTorus = new THREE.Mesh(middleTorusGeometry, glassMaterial);
  innerTorus = new THREE.Mesh(innerTorusGeometry, glassMaterial);
  mouseSphere = new THREE.Mesh(sphereGeometry, glassMaterial);

  outerTorus.position.x = 0;
  middleTorus.position.x = 0;
  innerTorus.position.x = 0;

  scene.add(outerTorus);
  scene.add(middleTorus);
  scene.add(innerTorus);
  scene.add(mouseSphere);
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
                        
                        float clearArea = uClearCenterSize * uRadius;
                        float distortionFactor = smoothstep(clearArea, uRadius, dist);
                        
                        vec2 distortedUv = adjustedUv - direction * uStrength * distortionFactor * distortionFactor;
                        
                        float wave = sin(normalizedDist * 10.0 - uTime * uWaveSpeed) * uWaveDistortion * distortionFactor;
                        distortedUv += direction * wave;
                        
                        distortedUv.x /= uAspect;

                        float aberrationStrength = uChromaticAberration * distortionFactor;
                        vec2 redUv = distortedUv + direction * aberrationStrength / vec2(uAspect, 1.0);
                        vec2 blueUv = distortedUv - direction * aberrationStrength / vec2(uAspect, 1.0);

                        vec4 colorR = texture2D(tDiffuse, redUv);
                        vec4 colorG = texture2D(tDiffuse, distortedUv);
                        vec4 colorB = texture2D(tDiffuse, blueUv);

                        vec4 reflection = texture2D(tDiffuse, vUv + direction * 0.1 * distortionFactor);
                        
                        gl_FragColor = vec4(colorR.r, colorG.g, colorB.b, 1.0);
                        gl_FragColor = mix(gl_FragColor, reflection, uReflectionIntensity * distortionFactor);

                        float blurAmount = uLensBlur * distortionFactor;
                        gl_FragColor = mix(gl_FragColor, blur(tDiffuse, distortedUv, vec2(1.0 / uAspect, 1.0), vec2(blurAmount)), distortionFactor);

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
      uAspect: { value: window.innerWidth / window.innerHeight },
      uTime: { value: 0 }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  });
  composer.addPass(customPass);
}

function setupGUI() {
  const gui = new GUI();
  const matFolder = gui.addFolder("Material");
  matFolder.addColor(PARAMS.material, "color").onChange((value) => {
    outerTorus.material.color.set(value);
    middleTorus.material.color.set(value);
    innerTorus.material.color.set(value);
    mouseSphere.material.color.set(value);
  });
  matFolder.add(PARAMS.material, "metalness", 0, 1).onChange((value) => {
    outerTorus.material.metalness = value;
    middleTorus.material.metalness = value;
    innerTorus.material.metalness = value;
    mouseSphere.material.metalness = value;
  });
  matFolder.add(PARAMS.material, "roughness", 0, 1).onChange((value) => {
    outerTorus.material.roughness = value;
    middleTorus.material.roughness = value;
    innerTorus.material.roughness = value;
    mouseSphere.material.roughness = value;
  });
  matFolder.add(PARAMS.material, "transmission", 0, 1).onChange((value) => {
    outerTorus.material.transmission = value;
    middleTorus.material.transmission = value;
    innerTorus.material.transmission = value;
    mouseSphere.material.transmission = value;
  });
  matFolder.add(PARAMS.material, "thickness", 0, 5).onChange((value) => {
    outerTorus.material.thickness = value;
    middleTorus.material.thickness = value;
    innerTorus.material.thickness = value;
    mouseSphere.material.thickness = value;
  });
  matFolder.add(PARAMS.material, "ior", 1, 2.333).onChange((value) => {
    outerTorus.material.ior = value;
    middleTorus.material.ior = value;
    innerTorus.material.ior = value;
    mouseSphere.material.ior = value;
  });
  matFolder.add(PARAMS.material, "clearcoat", 0, 1).onChange((value) => {
    outerTorus.material.clearcoat = value;
    middleTorus.material.clearcoat = value;
    innerTorus.material.clearcoat = value;
    mouseSphere.material.clearcoat = value;
  });
  matFolder
    .add(PARAMS.material, "clearcoatRoughness", 0, 1)
    .onChange((value) => {
      outerTorus.material.clearcoatRoughness = value;
      middleTorus.material.clearcoatRoughness = value;
      innerTorus.material.clearcoatRoughness = value;
      mouseSphere.material.clearcoatRoughness = value;
    });
  matFolder.add(PARAMS, "rotationSpeed", 0, 2);

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
}

function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  customPass.uniforms.uAspect.value = aspect;
  updateBackgroundSize();
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  customPass.uniforms.uMouse.value.set(
    event.clientX / window.innerWidth,
    1 - event.clientY / window.innerHeight
  );
}

function animate(time) {
  requestAnimationFrame(animate);

  // Rotate tori
  outerTorus.rotation.x += PARAMS.rotationSpeed * 0.01;
  outerTorus.rotation.y += PARAMS.rotationSpeed * 0.01;
  middleTorus.rotation.y -= PARAMS.rotationSpeed * 0.015;
  middleTorus.rotation.z += PARAMS.rotationSpeed * 0.015;
  innerTorus.rotation.x -= PARAMS.rotationSpeed * 0.02;
  innerTorus.rotation.z -= PARAMS.rotationSpeed * 0.02;

  // Update mouse sphere position
  const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  const pos = camera.position.clone().add(dir.multiplyScalar(distance));
  mouseSphere.position.copy(pos);

  // Update cube camera for refraction
  outerTorus.visible = false;
  middleTorus.visible = false;
  innerTorus.visible = false;
  mouseSphere.visible = false;
  cubeCamera.update(renderer, scene);
  outerTorus.visible = true;
  middleTorus.visible = true;
  innerTorus.visible = true;
  mouseSphere.visible = true;

  customPass.uniforms.uTime.value = time * 0.001;
  controls.update();
  composer.render();
}

init();
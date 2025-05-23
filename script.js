import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import * as dat from "https://cdn.skypack.dev/dat.gui";

// Load the matcap texture
const matcapTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/nidorx/matcaps/master/1024/293534_B2BFC5_738289_8A9AA7.png');

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Track mouse position
let mouse = new THREE.Vector2(0, 0);
document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// GUI Controls
const guiControls = {
  blobColor: [0, 0, 0],  // Black blobs
  liquidColor: [230, 102, 153],  // Liquid color
  backgroundColor: [255, 255, 255],  // White background
  blobSize: 80000,  // Blob size
  mouseInfluence: 15000,  // Mouse influence on blob size
  speedMultiplier: 6.0,  // Speed of blob movement
  noiseIntensity: 0.2,  // Intensity of the noise effect
  distortionScale: 10.0,  // Distortion scale for fluid effect
  randomSeed: Math.random() * 1000,  // Random seed for positions
  collisionDistance: 150.0,  // Distance at which blobs start to merge
  blendingFactor: 0.8,  // Fluid blending factor
  liquidSpeed: 2.0,  // Liquid motion speed
  liquidDeformIntensity: 0.5,  // Deformation intensity
  liquidRadius: 2.0  // Radius of liquid blob
};

// Shader material
const material = new THREE.ShaderMaterial({
  uniforms: {
    iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    iTime: { value: 0 },
    iMouse: { value: new THREE.Vector2(0, 0) },
    blobColor: { value: new THREE.Color(`rgb(${guiControls.blobColor.join(',')})`) },
    liquidColor: { value: new THREE.Color(`rgb(${guiControls.liquidColor.join(',')})`) },
    backgroundColor: { value: new THREE.Color(`rgb(${guiControls.backgroundColor.join(',')})`) },
    blobSize: { value: guiControls.blobSize },
    mouseInfluence: { value: guiControls.mouseInfluence },
    speedMultiplier: { value: guiControls.speedMultiplier },
    noiseIntensity: { value: guiControls.noiseIntensity },
    distortionScale: { value: guiControls.distortionScale },
    liquidSpeed: { value: guiControls.liquidSpeed },
    liquidDeformIntensity: { value: guiControls.liquidDeformIntensity },
    liquidRadius: { value: guiControls.liquidRadius },
    matcapTexture: { value: matcapTexture },
    randomSeed: { value: guiControls.randomSeed },
    collisionDistance: { value: guiControls.collisionDistance },
    blendingFactor: { value: guiControls.blendingFactor }
  },
  vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
  fragmentShader: `
                #define MIN_DIST 0.01
                #define MAX_DIST 100.0
                #define MAX_STEPS 100
                uniform vec2 iResolution;
                uniform float iTime;
                uniform vec2 iMouse;
                uniform vec3 blobColor;
                uniform vec3 liquidColor;
                uniform vec3 backgroundColor;
                uniform float blobSize;
                uniform float mouseInfluence;
                uniform float speedMultiplier;
                uniform float noiseIntensity;
                uniform float distortionScale;
                uniform float liquidSpeed;
                uniform float liquidDeformIntensity;
                uniform float liquidRadius;
                uniform sampler2D matcapTexture;
                varying vec2 vUv;

                float pointSDF(vec3 p, float r){
                    return length(p) - r;
                }

                float getDist(vec3 p){
                    float d = pointSDF(p - vec3(iMouse.x * 5.0, 1.0, 4.0), liquidRadius);  // Mouse interaction
                    d -= cos(2.0 * iTime + p.x * 5.0 + p.z * 0.1) * liquidDeformIntensity;
                    d -= sin(iTime * liquidSpeed + p.y * p.x * 2.0) * liquidDeformIntensity;
                    return d;
                }

                float rayMarch(vec3 ro, vec3 rd){
                    float dist = 0.0;
                    for(int i = 0; i < MAX_STEPS; i++){
                        vec3 p = ro + rd * dist;
                        float d = getDist(p);
                        dist += d;
                        if(d < MIN_DIST || dist > MAX_DIST) break;
                    }
                    return dist;
                }

                vec3 getNormal(vec3 p){
                    vec2 off = vec2(0.01, 0.0);
                    vec3 n = vec3(
                        getDist(p - off.xyy),
                        getDist(p - off.yxy),
                        getDist(p - off.yyx)
                    );
                    return normalize(n);
                }

                void mainImage(out vec4 fragColor, in vec2 fragCoord) {
                    vec2 uv = fragCoord / iResolution.xy;
                    uv -= 0.5;
                    uv.x *= iResolution.x / iResolution.y;
                    vec3 col = backgroundColor;

                    vec3 ro = vec3(0.0, 1.0, -5.0);
                    vec3 rd = normalize(vec3(uv.x, uv.y, 1.0));

                    float dist = rayMarch(ro, rd);
                    vec3 p = ro + rd * dist;

                    vec3 normal = getNormal(p);
                    vec3 matcapColor = texture2D(matcapTexture, normal.xy * 0.5 + 0.5).rgb;

                    col = mix(liquidColor, matcapColor, 0.5);
                    fragColor = vec4(col, 1.0);
                }

                void main() {
                    mainImage(gl_FragColor, gl_FragCoord.xy);
                }
            `
});

// Create a plane to render the shader
const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

camera.position.z = 1;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  material.uniforms.iTime.value += 0.016;
  material.uniforms.iMouse.value.set(mouse.x, mouse.y);
  renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  material.uniforms.iResolution.value.set(width, height);
});

// GUI setup
const gui = new dat.GUI();
gui.addColor(guiControls, 'blobColor').name('Blob Color').onChange((value) => {
  material.uniforms.blobColor.value.set(`rgb(${value.join(',')})`);
});
gui.addColor(guiControls, 'liquidColor').name('Liquid Color').onChange((value) => {
  material.uniforms.liquidColor.value.set(`rgb(${value.join(',')})`);
});
gui.addColor(guiControls, 'backgroundColor').name('Background Color').onChange((value) => {
  material.uniforms.backgroundColor.value.set(`rgb(${value.join(',')})`);
});
gui.add(guiControls, 'blobSize', 50000, 150000).name('Blob Size').onChange((value) => {
  material.uniforms.blobSize.value = value;
});
gui.add(guiControls, 'mouseInfluence', 5000, 30000).name('Mouse Influence').onChange((value) => {
  material.uniforms.mouseInfluence.value = value;
});
gui.add(guiControls, 'speedMultiplier', 1.0, 10.0).name('Speed Multiplier').onChange((value) => {
  material.uniforms.speedMultiplier.value = value;
});
gui.add(guiControls, 'noiseIntensity', 0.1, 0.5).name('Noise Intensity').onChange((value) => {
  material.uniforms.noiseIntensity.value = value;
});
gui.add(guiControls, 'distortionScale', 5.0, 20.0).name('Distortion Scale').onChange((value) => {
  material.uniforms.distortionScale.value = value;
});
gui.add(guiControls, 'liquidSpeed', 0.5, 5.0).name('Liquid Speed').onChange((value) => {
  material.uniforms.liquidSpeed.value = value;
});
gui.add(guiControls, 'liquidDeformIntensity', 0.1, 1.0).name('Deform Intensity').onChange((value) => {
  material.uniforms.liquidDeformIntensity.value = value;
});
gui.add(guiControls, 'liquidRadius', 1.0, 5.0).name('Liquid Radius').onChange((value) => {
  material.uniforms.liquidRadius.value = value;
});
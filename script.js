document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(CustomEase);

  const body = document.body;
  const menu = document.getElementById("menu");
  const menuToggle = document.getElementById("menuToggle");
  const openState = menuToggle.querySelector(".nav__toggle-state--open");
  const closeState = menuToggle.querySelector(".nav__toggle-state--close");
  const menuItems = document.querySelectorAll(".menu__footer-link");

  let isMenuOpen = false;

  // Define custom eases
  CustomEase.create("easeOutFast", "M0,0 C0.25,0.1 0.25,1 1,1"); // Opening ease
  CustomEase.create("easeInFast", "M0,0 C0.5,0 0.75,0.2 1,1"); // Closing ease

  // Ensure menu items and toggle states are set properly
  gsap.set(menuItems, { opacity: 0, y: -20 });
  gsap.set(openState, { opacity: 1, display: "block" }); // Initially show "MENU"
  gsap.set(closeState, { opacity: 0, display: "none" }); // Initially hide "CLOSE"

  menuToggle.addEventListener("click", () => {
    if (!isMenuOpen) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  // Add event listener for ESC key to close the menu
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMenuOpen) {
      closeMenu();
    }
  });

  // Add event listener for clicks outside the menu to close it
  document.addEventListener("click", (event) => {
    if (
      isMenuOpen &&
      !menu.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMenu();
    }
  });

  function openMenu() {
    // Add a class to the body when the menu opens
    body.classList.add("menu-open");

    // Animate dividers from 0 to 100% width
    gsap.to(".menu__divider", {
      width: "140px",
      duration: 0.6,
      opacity: 1,
      ease: "power2.out",
      delay: 0.4
    });

    gsap.to(".menu__column p", {
      opacity: 1,
      stagger: { amount: 0.3, from: "start" },
      duration: 0.6,
      ease: "power2.in",
      delay: 0.6
    });

    // Fade out the "MENU" text and fade in the "CLOSE" text
    gsap.to(openState, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        gsap.set(openState, { display: "none" }); // Hide after fade out
        gsap.set(closeState, { display: "block" }); // Show "CLOSE" before fading in
        gsap.to(closeState, { opacity: 1, duration: 0.3 });
      }
    });

    gsap.to(menu, {
      y: 0,
      duration: 0.6,
      ease: "easeOutFast", // Use custom ease for opening
      onComplete: () => {
        // Start stagger animation after the menu has fully opened
        gsap.to(menuItems, {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.5,
          ease: "power3.out"
        });
      }
    });
    isMenuOpen = true;
  }

  function closeMenu() {
    // Animate dividers from 100% back to 0% width
    gsap.to(".menu__column p", {
      opacity: 0,
      stagger: { amount: 0.1, from: "end" },
      duration: 0.4,
      ease: "power2.in"
    });

    gsap.to(".menu__divider", {
      width: "0%",
      duration: 0.4,
      ease: "power2.in"
    });

    // Reverse the stagger animation before closing the menu
    gsap.to(menuItems, {
      y: 20,
      opacity: 0,
      stagger: { amount: 0.1, from: "end" },
      duration: 0.3,
      ease: "power3.in",
      onComplete: () => {
        gsap.to(closeState, {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            gsap.set(closeState, { display: "none" });
            gsap.set(openState, { display: "block" });
            gsap.to(openState, { opacity: 1, duration: 0.3 });
          }
        });

        // Close the menu after items are hidden
        gsap.to(menu, {
          y: "-100%",
          duration: 0.4,
          ease: "easeInFast",
          onComplete: () => {
            body.classList.remove("menu-open");
          }
        });
      }
    });

    isMenuOpen = false;
  }

  createDoubleHoverEffect();

  function createDoubleHoverEffect() {
    let items = gsap.utils.toArray(".double-hover");
    items.forEach((item) => {
      let titCur = new SplitType(item.querySelector("span:first-of-type"), {
        types: "chars"
      });
      let titNew = new SplitType(item.querySelector("span:nth-of-type(2)"), {
        types: "chars"
      });

      gsap.set(titCur.chars, { yPercent: 0, transformOrigin: "top left" });
      gsap.set(titNew.chars, {
        yPercent: 100,
        transformOrigin: "bottom center"
      });

      item.addEventListener("mouseenter", function () {
        gsap.to(titCur.chars, {
          yPercent: -100,
          stagger: { amount: 0.0 },
          duration: 0.6,
          ease: "power3"
        });
        gsap.to(titNew.chars, {
          yPercent: 0,
          stagger: { amount: 0.0 },
          duration: 0.6,
          ease: "power3"
        });
      });

      item.addEventListener("mouseleave", function () {
        gsap.to(titCur.chars, {
          yPercent: 0,
          stagger: { amount: 0.0 },
          duration: 0.6,
          ease: "power3"
        });
        gsap.to(titNew.chars, {
          yPercent: 100,
          stagger: { amount: 0.0 },
          duration: 0.6,
          ease: "power3"
        });
      });
    });
  }
});

// !
// !
// THREE SPHERE AS THE PLACEHOLDER
// !
// !
import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js";
import { SMAAPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/SMAAPass.js";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// Sphere geometry and materials
const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
const spheres = [];
let sphereDistance = 5; // Initial distance between spheres

const vertexShader = `
            uniform float time;
            uniform float noiseIntensity;
            uniform int noiseType;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;

            // Simplex noise function
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

            float snoise(vec3 v) { 
                const vec2 C = vec2(1.0/6.0, 1.0/3.0) ;
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

                vec3 i  = floor(v + dot(v, C.yyy) );
                vec3 x0 =   v - i + dot(i, C.xxx) ;
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min( g.xyz, l.zxy );
                vec3 i2 = max( g.xyz, l.zxy );

                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;

                i = mod289(i); 
                vec4 p = permute( permute( permute( 
                            i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

                float n_ = 0.142857142857;
                vec3  ns = n_ * D.wyz - D.xzx;

                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_ );

                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);

                vec4 b0 = vec4( x.xy, y.xy );
                vec4 b1 = vec4( x.zw, y.zw );

                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));

                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

                vec3 p0 = vec3(a0.xy,h.x);
                vec3 p1 = vec3(a0.zw,h.y);
                vec3 p2 = vec3(a1.xy,h.z);
                vec3 p3 = vec3(a1.zw,h.w);

                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;

                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
            }

            void main() {
                vUv = uv;
                vNormal = normal;
                vec3 pos = position;
                
                if (noiseType == 1) {
                    float noise = snoise(vec3(pos.x * 2.0, pos.y * 2.0, pos.z * 2.0 + time * 0.1)) * 0.5 + 0.5;
                    pos += normal * noise * noiseIntensity;
                } else if (noiseType == 2) {
                    float noise1 = snoise(vec3(pos.x * 4.0, pos.y * 4.0, pos.z * 4.0 + time * 0.1));
                    float noise2 = snoise(vec3(pos.x * 8.0, pos.y * 8.0, pos.z * 8.0 + time * 0.2));
                    pos += normal * (noise1 * 0.3 + noise2 * 0.1) * noiseIntensity;
                }
                
                vPosition = pos;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;

const fragmentShader = `
            uniform sampler2D matcapTexture;
            uniform float brightness;
            uniform float contrast;
            uniform float saturation;
            varying vec3 vNormal;
            varying vec3 vPosition;

            vec3 adjustContrast(vec3 color, float value) {
                return 0.5 + (1.0 + value) * (color - 0.5);
            }

            vec3 adjustSaturation(vec3 color, float value) {
                const vec3 luminosityFactor = vec3(0.2126, 0.7152, 0.0722);
                vec3 grayscale = vec3(dot(color, luminosityFactor));
                return mix(grayscale, color, 1.0 + value);
            }

            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(cameraPosition - vPosition);
                vec3 x = normalize(vec3(viewDir.z, 0.0, -viewDir.x));
                vec3 y = cross(viewDir, x);
                vec2 uv = vec2(dot(x, normal), dot(y, normal)) * 0.495 + 0.5;
                
                vec3 matcapColor = texture2D(matcapTexture, uv).rgb;
                
                matcapColor = adjustContrast(matcapColor, contrast);
                matcapColor = adjustSaturation(matcapColor, saturation);
                matcapColor *= brightness;
                
                gl_FragColor = vec4(matcapColor, 1.0);
            }
        `;

const loader = new THREE.TextureLoader();
const matcapTexture = loader.load(
  "https://raw.githubusercontent.com/nidorx/matcaps/master/1024/604A30_DC9065_212C14_AC9C92.png"
);

const createMaterial = (noiseIntensity, noiseType, brightness) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      noiseIntensity: { value: noiseIntensity },
      noiseType: { value: noiseType },
      matcapTexture: { value: matcapTexture },
      brightness: { value: brightness },
      contrast: { value: 0 },
      saturation: { value: 0 }
    },
    vertexShader,
    fragmentShader
  });
};

const materials = [
  createMaterial(0.0, 0, 1.0),
  createMaterial(0.8, 1, 1.2),
  createMaterial(1.15, 2, 1.4)
];

function updateSpherePositions() {
  spheres.forEach((sphere, index) => {
    sphere.position.x = (index - 1) * sphereDistance;
  });
}

for (let i = 0; i < 3; i++) {
  const sphere = new THREE.Mesh(sphereGeometry, materials[i]);
  scene.add(sphere);
  spheres.push(sphere);
}

updateSpherePositions();

camera.position.z = 10;
camera.position.x = 0;

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const smaaPass = new SMAAPass(
  window.innerWidth * renderer.getPixelRatio(),
  window.innerHeight * renderer.getPixelRatio()
);
composer.addPass(smaaPass);

const grainShader = {
  uniforms: {
    tDiffuse: { value: null },
    grainIntensity: { value: 0.012 },
    grainStrength: { value: 15 },
    time: { value: 0 }
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
                uniform float grainIntensity;
                uniform float grainStrength;
                uniform float time;
                varying vec2 vUv;

                float random(vec2 p) {
                    vec2 K1 = vec2(
                        23.14069263277926,
                        2.665144142690225
                    );
                    return fract(cos(dot(p, K1)) * 12345.6789);
                }

                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    vec2 uvRandom = vUv;
                    uvRandom.y *= random(vec2(uvRandom.y, time));
                    color.rgb += random(uvRandom) * grainIntensity * grainStrength;
                    gl_FragColor = color;
                }
            `
};

const grainPass = new ShaderPass(grainShader);
composer.addPass(grainPass);

// GUI setup
const gui = new GUI();

// Render settings
const renderFolder = gui.addFolder("Render Settings");
renderFolder
  .add({ pixelRatio: renderer.getPixelRatio() }, "pixelRatio", 0.5, 2, 0.1)
  .onChange((value) => {
    renderer.setPixelRatio(value);
    composer.setSize(window.innerWidth, window.innerHeight);
    smaaPass.setSize(window.innerWidth * value, window.innerHeight * value);
  });
renderFolder.open();

// Grain effect controls
const grainFolder = gui.addFolder("Grain Effect");
grainFolder
  .add(grainPass.uniforms.grainIntensity, "value", 0, 0.05)
  .name("Grain Intensity");
grainFolder
  .add(grainPass.uniforms.grainStrength, "value", 0, 50)
  .name("Grain Strength");
grainFolder.open();

// Sphere position controls
const positionFolder = gui.addFolder("Sphere Positions");
positionFolder
  .add({ distance: sphereDistance }, "distance", 1, 10)
  .name("Distance")
  .onChange((value) => {
    sphereDistance = value;
    updateSpherePositions();
  });

spheres.forEach((sphere, index) => {
  const sphereFolder = positionFolder.addFolder(`Sphere ${index + 1}`);
  sphereFolder.add(sphere.position, "x", -10, 10).name("X").listen();
  sphereFolder.add(sphere.position, "y", -10, 10).name("Y");
  sphereFolder.add(sphere.position, "z", -10, 10).name("Z");
});

positionFolder.open();

// Individual sphere controls
spheres.forEach((sphere, index) => {
  const folder = gui.addFolder(`Sphere ${index + 1}`);
  folder
    .add(sphere.material.uniforms.noiseIntensity, "value", 0, 2)
    .name("Noise Intensity");
  folder
    .add(sphere.material.uniforms.noiseType, "value", 0, 2, 1)
    .name("Noise Type");
  folder
    .add(sphere.material.uniforms.brightness, "value", 0.5, 2)
    .name("Brightness");
  folder
    .add(sphere.material.uniforms.contrast, "value", -1, 1)
    .name("Contrast");
  folder
    .add(sphere.material.uniforms.saturation, "value", -1, 1)
    .name("Saturation");
  folder.open();
});

// Animation loop
function animate(time) {
  requestAnimationFrame(animate);

  time *= 0.001; // convert to seconds

  spheres.forEach((sphere) => {
    sphere.material.uniforms.time.value = time;
  });

  grainPass.uniforms.time.value = time;

  controls.update();
  composer.render();
}

animate(0);

// Window resize handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  smaaPass.setSize(
    window.innerWidth * renderer.getPixelRatio(),
    window.innerHeight * renderer.getPixelRatio()
  );
});

// Hide dat.gui
gui.hide();
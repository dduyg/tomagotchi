import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { gsap } from "https://cdn.skypack.dev/gsap@3.11.4";
import { ScrollTrigger } from "https://cdn.skypack.dev/gsap@3.11.4/ScrollTrigger";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Use the existing scroll container in the HTML
const setupScrollContainer = () => {
  // Use the existing container created in HTML
  return document.querySelector(".content-container");
};

// Initialize renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  precision: "highp"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);

// Create scene and camera
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Settings
const settings = {
  metaballCount: 9,
  metaballRadius: 0.5,
  metaballType: 4, // Gaussian
  scrollProgress: 0, // Will be updated by ScrollTrigger
  spreadFactor: 1.3, // Controls how spread out the metaballs are
  blendPower: 1.8, // Controls blending intensity
  colorIntensity: 0.7, // Controls color intensity
  grainAmount: 0.3, // Controls film grain intensity
  lightIntensity: 1.0, // Controls lighting intensity
  specularPower: 0.6, // Controls specular highlights
  rimLightPower: 0.5, // Controls rim lighting effect
  blackAndWhite: false, // Black and white mode
  useTexture: true, // Use texture on metaballs
  textureScale: 10.0, // Scale of the texture
  textureStrength: 0.5, // Strength of the texture
  useMatcap: true, // Use matcap material
  matcapIntensity: 0.8, // Intensity of matcap effect
  renderQuality: 1.0 // Render quality multiplier
};

// Shader material for metaballs
const metaballShader = new THREE.ShaderMaterial({
  uniforms: {
    iResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    iTime: { value: 0 },
    iMouse: { value: new THREE.Vector2(0, 0) },
    metaballCount: { value: settings.metaballCount },
    metaballType: { value: settings.metaballType },
    metaballRadius: { value: settings.metaballRadius },
    scrollProgress: { value: settings.scrollProgress },
    spreadFactor: { value: settings.spreadFactor },
    blendPower: { value: settings.blendPower },
    colorIntensity: { value: settings.colorIntensity },
    grainAmount: { value: settings.grainAmount },
    lightIntensity: { value: settings.lightIntensity },
    specularPower: { value: settings.specularPower },
    rimLightPower: { value: settings.rimLightPower },
    blackAndWhite: { value: settings.blackAndWhite ? 1.0 : 0.0 },
    useTexture: { value: settings.useTexture ? 1.0 : 0.0 },
    textureScale: { value: settings.textureScale },
    textureStrength: { value: settings.textureStrength },
    useMatcap: { value: settings.useMatcap ? 1.0 : 0.0 },
    matcapIntensity: { value: settings.matcapIntensity },
    renderQuality: { value: settings.renderQuality }
  },
  vertexShader: `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec2 iResolution;
    uniform float iTime;
    uniform vec2 iMouse;
    uniform int metaballCount;
    uniform int metaballType;
    uniform float metaballRadius;
    uniform float scrollProgress;
    uniform float spreadFactor;
    uniform float blendPower;
    uniform float colorIntensity;
    uniform float grainAmount;
    uniform float lightIntensity;
    uniform float specularPower;
    uniform float rimLightPower;
    uniform float blackAndWhite;
    uniform float useTexture;
    uniform float textureScale;
    uniform float textureStrength;
    uniform float useMatcap;
    uniform float matcapIntensity;
    uniform float renderQuality;
    
    varying vec2 vUv;
    
    // Smooth min function for better blending (from Inigo Quilez)
    float smin(float a, float b, float k) {
      float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
      return mix(b, a, h) - k * h * (1.0 - h);
    }
    
    // Improved smoothstep function to reduce any potential jumping
    float superSmoothstep(float edge0, float edge1, float x) {
      // Smoother than standard smoothstep - uses cubic hermite interpolation
      float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
      return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); // Smootherstep formula
    }
    
    // Noise functions
    float hash(float n) {
      return fract(sin(n) * 43758.5453);
    }
    
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float n = i.x + i.y * 57.0;
      return mix(
        mix(hash(n), hash(n + 1.0), f.x),
        mix(hash(n + 57.0), hash(n + 58.0), f.x),
        f.y
      );
    }
    
    float fbm(vec2 p) {
      float f = 0.0;
      float w = 0.5;
      for (int i = 0; i < 5; i++) {
        f += w * noise(p);
        p *= 2.0;
        w *= 0.5;
      }
      return f;
    }
    
    // 3D Noise (simplified)
    float noise3D(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      vec2 uv = i.xy + i.z * vec2(17.0);
      vec2 uv2 = uv + vec2(17.0);
      
      float a = noise(uv);
      float b = noise(uv + vec2(1.0, 0.0));
      float c = noise(uv + vec2(0.0, 1.0));
      float d = noise(uv + vec2(1.0, 1.0));
      
      float e = noise(uv2);
      float g = noise(uv2 + vec2(1.0, 0.0));
      float h = noise(uv2 + vec2(0.0, 1.0));
      float i2 = noise(uv2 + vec2(1.0, 1.0));
      
      return mix(
        mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
        mix(mix(e, g, f.x), mix(h, i2, f.x), f.y),
        f.z
      );
    }
    
    // Proper film grain function
    float filmGrain(vec2 uv, float time) {
      float t = floor(time * 24.0) / 24.0;
      return noise(uv * 500.0 + t * 5.0) * 2.0 - 1.0;
    }
    
    // True 3D Sphere SDF
    float sdSphere(vec3 p, float r) {
      return length(p) - r;
    }
    
    // Distance function for metaballs field (true 3D)
    float mapMetaballs(vec3 p, float t, float phase) {
      float globalDist = 100.0;
      
      for(int i = 0; i < 16; ++i) {
        if(i >= metaballCount) break;
        
        // Unique properties for each metaball based on its index
        float fi = float(i);
        float uniqueSeed = fi * 412.531 + 0.513;
        float uniqueTime = t * (fract(uniqueSeed) - 0.5) * 2.0;
        
        // Randomize size based on index but respect the global size setting
        float uniqueSize = mix(0.3, 1.0, fract(uniqueSeed + 0.5124)) * metaballRadius;
        
        // 3D offset with scroll influence
        // Z depth is more affected by scroll to create parallax movement
        vec3 offset = vec3(
          sin(uniqueTime + fi * 52.5126) * spreadFactor,
          sin(uniqueTime + fi * 64.62744) * spreadFactor,
          sin(uniqueTime + fi * 37.1234) * spreadFactor * (1.0 + scrollProgress)
        );
        
        // Apply clustering based on scroll progress - squeeze in middle of scroll
        float squeeze = sin(scrollProgress * 3.14159); // 0->1->0 pattern
        offset *= mix(1.0, 0.3, squeeze);
        
        // True 3D sphere SDF
        float dist = sdSphere(p - offset, uniqueSize);
        
        // Smooth blend with global field
        float blendK = 0.4 * blendPower;
        globalDist = smin(globalDist, dist, blendK);
      }
      
      return globalDist;
    }
    
    // Calculate normal in 3D space
    vec3 calcNormal(vec3 p, float t, float phase) {
      const float eps = 0.002;
      const vec2 h = vec2(eps, 0.0);
      
      return normalize(vec3(
        mapMetaballs(p + h.xyy, t, phase) - mapMetaballs(p - h.xyy, t, phase),
        mapMetaballs(p + h.yxy, t, phase) - mapMetaballs(p - h.yxy, t, phase),
        mapMetaballs(p + h.yyx, t, phase) - mapMetaballs(p - h.yyx, t, phase)
      ));
    }
    
    void main() {
      vec2 fragCoord = vUv * iResolution;
      vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);
      vec3 col = vec3(0.02); // Darker base color
      
      // The scrollProgress drives animation
      float animationSpeed = 0.1;
      float t = iTime * animationSpeed;
      float phaseShift = scrollProgress * 3.0;
      
      // Setup camera ray for 3D raymarching
      vec3 ro = vec3(0.0, 0.0, 4.0 - scrollProgress * 1.0); // Camera pulls back slightly with scroll
      vec3 rd = normalize(vec3(uv, -2.0)); // Ray direction
      
      // Apply subtle camera rotation based on scroll and time
      float camRotation = sin(t * 0.2) * 0.1 + scrollProgress * 0.2;
      mat3 rotMat = mat3(
        cos(camRotation), 0.0, sin(camRotation),
        0.0, 1.0, 0.0,
        -sin(camRotation), 0.0, cos(camRotation)
      );
      rd = rotMat * rd;
      
      // Raymarching setup
      float tmax = 10.0;
      float t0 = 0.1;
      float depth = t0;
      float dt = 0.05;
      vec3 p;
      float dist;
      bool hit = false;
      
      // Raymarch loop
      for(int i = 0; i < 64; i++) {
        p = ro + rd * depth;
        dist = mapMetaballs(p, t, phaseShift);
        
        // Check for hit
        if(dist < 0.001) {
          hit = true;
          break;
        }
        
        // Step along ray
        depth += max(dist * 0.5, dt);
        
        // Check if we've gone too far
        if(depth > tmax) break;
      }
      
      // Render only if we hit something
      if(hit) {
        // Calculate normal at intersection point
        vec3 n = calcNormal(p, t, phaseShift);
        
        // Setup lights
        vec3 lightPos1 = vec3(2.0 * sin(t * 0.5), 2.0 * cos(t * 0.5), 4.0);
        vec3 lightPos2 = vec3(-3.0, 1.0, 3.0);
        
        vec3 lightDir1 = normalize(lightPos1 - p);
        vec3 lightDir2 = normalize(lightPos2 - p);
        
        // Colorful lighting
        vec3 lightCol1 = vec3(1.0, 0.8, 0.6); // Warm
        vec3 lightCol2 = vec3(0.6, 0.8, 1.0); // Cool
        
        // Basic Phong shading
        float diff1 = max(0.0, dot(n, lightDir1));
        float diff2 = max(0.0, dot(n, lightDir2));
        
        // Dynamic coloring
        vec3 viewDir = -rd;
        float b = max(0.0, dot(n, normalize(vec3(0.577))));
        
        // Base color calculation
        vec3 baseCol;
        
        // Use matcap if enabled (sunset)
        if(useMatcap > 0.5) {
          // Simplified sunset colors based on normal
          float ny = n.y * 0.5 + 0.5; // Remap Y normal to 0-1
          vec3 sunset = mix(
            vec3(0.1, 0.2, 0.4), // Deep blue bottom
            mix(
              vec3(1.0, 0.4, 0.1), // Orange middle
              vec3(1.0, 0.9, 0.6), // Yellow top
              ny * 2.0 - 0.5
            ),
            ny
          );
          
          // Mix with rainbow color based on matcapIntensity
          vec3 rainbowCol = 0.5 + 0.5 * cos((b + iTime * 3.0) + p.xyz * 0.5 + vec3(0.0, 2.0, 4.0));
          baseCol = mix(rainbowCol, sunset, matcapIntensity);
        } else {
          // Rainbow color pattern
          baseCol = 0.5 + 0.5 * cos((b + iTime * 3.0) + p.xyz * 0.5 + vec3(0.0, 2.0, 4.0));
        }
        
        // Apply cell texture if enabled
        if(useTexture > 0.5) {
          float pattern = 0.0;
          
          // Simple cell pattern based on noise
          for(int i = 0; i < 3; i++) {
            float scale = textureScale * pow(2.0, float(i));
            pattern += noise3D(p * scale) * pow(0.5, float(i));
          }
          
          // Apply to base color
          baseCol = mix(baseCol, baseCol * (0.7 + 0.6 * pattern), textureStrength);
        }
        
        baseCol *= (0.8 + b * 0.2) * lightIntensity; // Light modulation
        
        // Calculate specular
        vec3 halfDir1 = normalize(lightDir1 + viewDir);
        float spec1 = pow(max(0.0, dot(n, halfDir1)), 32.0) * specularPower;
        
        // Rim lighting
        float rim = pow(1.0 - max(0.0, dot(n, viewDir)), 4.0) * rimLightPower;
        
        // Combine lighting
        vec3 lighting = vec3(0.1); // Ambient
        lighting += diff1 * lightCol1 * 0.7;
        lighting += diff2 * lightCol2 * 0.5;
        lighting += spec1 * vec3(1.0) * 0.5;
        lighting += rim * vec3(0.3, 0.5, 1.0);
        
        // Apply lighting to base color
        col = baseCol * lighting * colorIntensity;
        
        // Depth fading
        float fogFactor = 1.0 - exp(-depth * 0.15);
        vec3 fogColor = vec3(0.05, 0.05, 0.1); // Dark blue fog
        col = mix(col, fogColor, fogFactor * 0.6);
      }
      
      // Convert to black and white if enabled
      if(blackAndWhite > 0.5) {
        col = vec3(dot(col, vec3(0.299, 0.587, 0.114)));
      }
      
      // Apply film grain
      float grain = filmGrain(vUv, iTime) * grainAmount * 0.1;
      col += grain * col;
      
      // Subtle vignette effect
      float vignette = smoothstep(0.5, 0.2, length(vUv - 0.5));
      col = mix(col, col * vignette, 0.3);
      
      // sRGB color correction
      col.xyz = mix(12.92 * col.xyz, 1.055 * pow(col.xyz, vec3(1.0/2.4)) - 0.055, step(0.0031308, col.xyz));
      
      gl_FragColor = vec4(col, 1.0);
    }
  `
});

// Create a quad that fills the screen
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), metaballShader);
scene.add(quad);

// Set up GSAP ScrollTrigger with extra-smooth scrolling
const setupScrollTrigger = () => {
  const scrollContainer = setupScrollContainer();

  // Create objects for extremely smooth animation
  const smoothParams = {
    progress: 0,
    metaballRadius: settings.metaballRadius,
    // We'll use a fixed number of metaballs but still expose it to GUI
    smoothingFactor: 0.05
  };

  // Use GSAP ticker for frame-rate independent smoothing
  gsap.ticker.add(() => {
    // Update shader uniforms with smoothed values
    metaballShader.uniforms.scrollProgress.value = smoothParams.progress;
    metaballShader.uniforms.metaballRadius.value = settings.metaballRadius;

    // Take values from settings (GUI controlled)
    metaballShader.uniforms.metaballCount.value = settings.metaballCount;
    metaballShader.uniforms.metaballType.value = settings.metaballType;
    metaballShader.uniforms.spreadFactor.value = settings.spreadFactor;
    metaballShader.uniforms.blendPower.value = settings.blendPower;
    metaballShader.uniforms.colorIntensity.value = settings.colorIntensity;
    metaballShader.uniforms.grainAmount.value = settings.grainAmount;
    metaballShader.uniforms.lightIntensity.value = settings.lightIntensity;
    metaballShader.uniforms.specularPower.value = settings.specularPower;
    metaballShader.uniforms.rimLightPower.value = settings.rimLightPower;
    metaballShader.uniforms.blackAndWhite.value = settings.blackAndWhite
      ? 1.0
      : 0.0;
    metaballShader.uniforms.useTexture.value = settings.useTexture ? 1.0 : 0.0;
    metaballShader.uniforms.textureScale.value = settings.textureScale;
    metaballShader.uniforms.textureStrength.value = settings.textureStrength;
    metaballShader.uniforms.useMatcap.value = settings.useMatcap ? 1.0 : 0.0;
    metaballShader.uniforms.matcapIntensity.value = settings.matcapIntensity;
    metaballShader.uniforms.renderQuality.value = settings.renderQuality;
  });

  // Use GSAP's timeline for ultra-smooth control
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: 1, // Higher scrub value for smoother scrolling
      onUpdate: (self) => {
        // Use GSAP to animate to target values (prevents jumping)
        gsap.to(smoothParams, {
          progress: self.progress,
          metaballRadius: 0.3 + self.progress * 0.4, // Smaller range for more stability
          duration: 0.5, // Half-second smooth transition
          ease: "power2.out", // Use easing for smoother transitions
          overwrite: "auto" // Handle overlapping animations
        });
      }
    }
  });
};

// Handle window resize
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
  metaballShader.uniforms.iResolution.value.set(width, height);
});

// Track mouse position
window.addEventListener("mousemove", (event) => {
  metaballShader.uniforms.iMouse.value.x = event.clientX;
  metaballShader.uniforms.iMouse.value.y = window.innerHeight - event.clientY; // Flip Y for GLSL
});

// Animation loop with smoother timing
let lastTime = 0;
function animate(time) {
  const deltaTime = lastTime ? (time - lastTime) / 1000 : 0.016;
  lastTime = time;

  // Use constant time steps for stability
  const timeValue = performance.now() / 1000;
  metaballShader.uniforms.iTime.value = timeValue;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Initialize
setupScrollTrigger();
animate(0);

// Add GUI to control parameters
import { GUI } from "https://cdn.skypack.dev/dat.gui";
const gui = new GUI();

const metaballTypes = {
  "Sharp Cutoff": 0,
  "1/r (Electric Potential)": 1,
  "1/r² (Electric Force)": 2,
  Exponential: 3,
  Gaussian: 4,
  "Smooth (Spore)": 5,
  "Auto (Scroll-based)": 6
};

// Visual Effects folder
const visualFolder = gui.addFolder("Visual Effects");

visualFolder
  .add({ metaballType: "Gaussian" }, "metaballType", metaballTypes)
  .onChange((value) => {
    settings.metaballType = parseInt(value);
  });

visualFolder
  .add(settings, "metaballCount", 1, 16, 1)
  .name("Metaball Count")
  .onChange((value) => {
    settings.metaballCount = value;
  });

visualFolder
  .add(settings, "metaballRadius", 0.1, 2.0, 0.1)
  .name("Metaball Size")
  .onChange((value) => {
    settings.metaballRadius = value;
  });

visualFolder
  .add(settings, "spreadFactor", 0.1, 3.0, 0.1)
  .name("Spread Factor")
  .onChange((value) => {
    settings.spreadFactor = value;
  });

visualFolder
  .add(settings, "blendPower", 0.1, 3.0, 0.1)
  .name("Blend Power")
  .onChange((value) => {
    settings.blendPower = value;
  });

// Materials folder
const materialsFolder = gui.addFolder("Materials");

materialsFolder
  .add(settings, "blackAndWhite")
  .name("Black & White")
  .onChange((value) => {
    settings.blackAndWhite = value;
  });

materialsFolder
  .add(settings, "useTexture")
  .name("Use Texture")
  .onChange((value) => {
    settings.useTexture = value;
  });

materialsFolder
  .add(settings, "textureScale", 1.0, 20.0, 1.0)
  .name("Texture Scale")
  .onChange((value) => {
    settings.textureScale = value;
  });

materialsFolder
  .add(settings, "textureStrength", 0.0, 1.0, 0.1)
  .name("Texture Strength")
  .onChange((value) => {
    settings.textureStrength = value;
  });

materialsFolder
  .add(settings, "useMatcap")
  .name("Use Sunset Matcap")
  .onChange((value) => {
    settings.useMatcap = value;
  });

materialsFolder
  .add(settings, "matcapIntensity", 0.0, 1.0, 0.1)
  .name("Matcap Intensity")
  .onChange((value) => {
    settings.matcapIntensity = value;
  });

// Post-processing folder
const postFolder = gui.addFolder("Post Processing");

postFolder
  .add(settings, "colorIntensity", 0.0, 2.0, 0.1)
  .name("Color Intensity")
  .onChange((value) => {
    settings.colorIntensity = value;
  });

postFolder
  .add(settings, "grainAmount", 0.0, 1.0, 0.05)
  .name("Film Grain")
  .onChange((value) => {
    settings.grainAmount = value;
  });

postFolder
  .add(settings, "renderQuality", 0.5, 2.0, 0.25)
  .name("Render Quality")
  .onChange((value) => {
    settings.renderQuality = value;
  });

// Lighting folder
const lightFolder = gui.addFolder("Lighting");

lightFolder
  .add(settings, "lightIntensity", 0.0, 2.0, 0.1)
  .name("Light Intensity")
  .onChange((value) => {
    settings.lightIntensity = value;
  });

lightFolder
  .add(settings, "specularPower", 0.0, 1.0, 0.1)
  .name("Specular")
  .onChange((value) => {
    settings.specularPower = value;
  });

lightFolder
  .add(settings, "rimLightPower", 0.0, 1.0, 0.1)
  .name("Rim Light")
  .onChange((value) => {
    settings.rimLightPower = value;
  });

// Open folders by default
visualFolder.open();
materialsFolder.open();
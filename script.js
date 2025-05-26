import * as THREE from "https://esm.sh/three@0.175.0";
import { GUI } from "https://esm.sh/dat.gui@0.7.9";
import Stats from "https://esm.sh/stats.js@0.17.0";
import { EffectComposer } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/UnrealBloomPass.js";

// Main App class
class App {
  constructor() {
    // Initialize stats
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);
    this.stats.dom.style.position = "absolute";
    this.stats.dom.style.top = "0";
    this.stats.dom.style.left = "0";

    // Define gradient presets
    this.gradientPresets = {
      "Realistic Milky": {
        colorA1: [0.98, 0.98, 1.0], // Pure White with slight blue tint
        colorA2: [0.92, 0.92, 0.95], // Very Light Gray with blue tint
        colorB1: [0.95, 0.95, 0.98], // Almost White
        colorB2: [0.85, 0.85, 0.9] // Light Gray
      },
      "Deep Abyss": {
        colorA1: [0.02, 0.02, 0.03], // Nearly Black
        colorA2: [0.04, 0.04, 0.06], // Very Dark Gray with slight blue tint
        colorB1: [0.03, 0.03, 0.05], // Almost Black with slight blue
        colorB2: [0.06, 0.05, 0.08] // Very Dark Purple-Gray
      },
      "Dark Twilight": {
        colorA1: [0.05, 0.04, 0.08], // Very Dark Purple
        colorA2: [0.08, 0.06, 0.12], // Dark Purple
        colorB1: [0.04, 0.05, 0.09], // Very Dark Blue
        colorB2: [0.09, 0.08, 0.14] // Dark Blue-Purple
      },
      "Dark Moody": {
        colorA1: [0.05, 0.05, 0.08], // Almost Black
        colorA2: [0.15, 0.15, 0.25], // Dark Purple
        colorB1: [0.1, 0.1, 0.2], // Dark Blue
        colorB2: [0.2, 0.2, 0.3] // Dark Gray
      },
      "Soft Cream": {
        colorA1: [0.98, 0.97, 0.95], // Warm White
        colorA2: [0.94, 0.92, 0.88], // Light Cream
        colorB1: [0.96, 0.94, 0.9], // Soft Cream
        colorB2: [0.9, 0.87, 0.82] // Light Beige
      },
      Colorful: {
        colorA1: [0.957, 0.804, 0.623], // Yellow
        colorA2: [0.192, 0.384, 0.933], // Deep Blue
        colorB1: [0.91, 0.51, 0.8], // Pink
        colorB2: [0.35, 0.71, 0.953] // Light Blue
      },
      Mysterious: {
        colorA1: [0.1, 0.05, 0.2], // Dark Purple
        colorA2: [0.3, 0.1, 0.4], // Purple
        colorB1: [0.05, 0.1, 0.2], // Dark Blue
        colorB2: [0.2, 0.3, 0.5] // Blue
      },
      Sunset: {
        colorA1: [0.8, 0.3, 0.1], // Orange
        colorA2: [0.5, 0.1, 0.3], // Red-Purple
        colorB1: [0.9, 0.6, 0.3], // Light Orange
        colorB2: [0.6, 0.2, 0.5] // Purple
      },
      Ocean: {
        colorA1: [0.0, 0.2, 0.4], // Deep Blue
        colorA2: [0.0, 0.4, 0.6], // Medium Blue
        colorB1: [0.0, 0.3, 0.5], // Blue
        colorB2: [0.1, 0.5, 0.7] // Light Blue
      }
    };

    // Initialize settings
    this.settings = {
      damping: 0.98,
      tension: 0.02,
      resolution: 1024,
      rippleStrength: 1.0,
      gradientPreset: "Realistic Milky", // Default to Realistic Milky
      mouseIntensity: 0.3,
      clickIntensity: 2.0,
      rippleRadius: 12,
      autoDrops: true,
      autoDropInterval: 3000,
      autoDropIntensity: 1.0,
      performanceMode: false
    };

    // Store last mouse position for throttling
    this.lastMousePosition = { x: 0, y: 0 };
    this.mouseThrottleTime = 0;

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);

    // Initialize scene and camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      -window.innerWidth / 2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      -window.innerHeight / 2,
      0.1,
      1000
    );
    this.camera.position.z = 10;

    // Initialize clock
    this.clock = new THREE.Clock();

    // Initialize GUI
    this.initGUI();

    // Bind methods
    this.tick = this.tick.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onResize = this.onResize.bind(this);

    // Initialize everything
    this.init();
  }

  initGUI() {
    const gui = new GUI();

    // Gradient preset selector
    gui
      .add(this.settings, "gradientPreset", Object.keys(this.gradientPresets))
      .name("Gradient")
      .onChange(() => {
        this.updateGradientColors();
      });

    // Ripple controls
    const rippleFolder = gui.addFolder("Ripple Controls");
    rippleFolder
      .add(this.settings, "damping", 0.9, 0.999, 0.001)
      .name("Damping");
    // Limit tension to safer values to prevent breaking the simulation
    rippleFolder
      .add(this.settings, "tension", 0.01, 0.05, 0.001)
      .name("Tension");
    rippleFolder
      .add(this.settings, "rippleStrength", 0.1, 2.0, 0.1)
      .name("Strength");
    rippleFolder
      .add(this.settings, "mouseIntensity", 0.1, 1.0, 0.1)
      .name("Mouse Intensity");
    rippleFolder
      .add(this.settings, "clickIntensity", 0.5, 3.0, 0.1)
      .name("Click Intensity");
    rippleFolder
      .add(this.settings, "rippleRadius", 6, 20, 1)
      .name("Ripple Size");
    rippleFolder.open();

    // Auto drops controls
    const autoDropsFolder = gui.addFolder("Auto Drops");
    autoDropsFolder.add(this.settings, "autoDrops").name("Enable Auto Drops");
    autoDropsFolder
      .add(this.settings, "autoDropInterval", 500, 10000, 100)
      .name("Interval (ms)");
    autoDropsFolder
      .add(this.settings, "autoDropIntensity", 0.1, 2.0, 0.1)
      .name("Intensity");
    autoDropsFolder.open();

    // Performance controls
    const perfFolder = gui.addFolder("Performance");
    perfFolder
      .add(this.settings, "performanceMode")
      .name("Performance Mode")
      .onChange((value) => {
        // Adjust resolution based on performance mode
        if (value) {
          this.setResolution(512); // Lower resolution for better performance
        } else {
          this.setResolution(1024); // Higher resolution for better quality
        }
      });
  }

  setResolution(resolution) {
    if (resolution === this.settings.resolution) return;

    this.settings.resolution = resolution;

    // Recreate water simulation with new resolution
    this.initWaterRipple();

    // Update the background material with the new texture
    if (this.backgroundMaterial) {
      this.backgroundMaterial.uniforms.waterTexture.value = this.waterTexture;
    }
  }

  updateGradientColors() {
    if (!this.backgroundMaterial) return;

    const preset = this.gradientPresets[this.settings.gradientPreset];

    this.backgroundMaterial.uniforms.colorA1.value.set(
      preset.colorA1[0],
      preset.colorA1[1],
      preset.colorA1[2]
    );
    this.backgroundMaterial.uniforms.colorA2.value.set(
      preset.colorA2[0],
      preset.colorA2[1],
      preset.colorA2[2]
    );
    this.backgroundMaterial.uniforms.colorB1.value.set(
      preset.colorB1[0],
      preset.colorB1[1],
      preset.colorB1[2]
    );
    this.backgroundMaterial.uniforms.colorB2.value.set(
      preset.colorB2[0],
      preset.colorB2[1],
      preset.colorB2[2]
    );
  }

  init() {
    // Create water ripple simulation
    this.initWaterRipple();

    // Create background image
    this.createBackground();

    // Add event listeners
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("touchmove", this.onTouchMove, { passive: false });
    window.addEventListener("resize", this.onResize);
    window.addEventListener("click", (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.addRipple(x, y, this.settings.clickIntensity);
    });

    // Setup auto drops
    this.setupAutoDrops();

    // Start animation loop
    this.tick();
  }

  setupAutoDrops() {
    // Clear any existing interval
    if (this.autoDropsInterval) {
      clearInterval(this.autoDropsInterval);
    }

    // Set up new interval if enabled
    if (this.settings.autoDrops) {
      this.autoDropsInterval = setInterval(() => {
        if (!this.settings.autoDrops) return;

        // Add a random drop
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        this.addRipple(x, y, this.settings.autoDropIntensity);
      }, this.settings.autoDropInterval);
    }
  }

  initWaterRipple() {
    const resolution = this.settings.resolution;

    // Create buffers for water simulation
    this.waterBuffers = {
      current: new Float32Array(resolution * resolution),
      previous: new Float32Array(resolution * resolution)
    };

    // Create water texture
    this.waterTexture = new THREE.DataTexture(
      this.waterBuffers.current,
      resolution,
      resolution,
      THREE.RedFormat,
      THREE.FloatType
    );
    this.waterTexture.minFilter = THREE.LinearFilter;
    this.waterTexture.magFilter = THREE.LinearFilter;
    this.waterTexture.needsUpdate = true;
  }

  createBackground() {
    // Get initial colors from the current preset
    const preset = this.gradientPresets[this.settings.gradientPreset];

    // Create a background with the gradient from the provided shader
    const backgroundShader = {
      uniforms: {
        waterTexture: { value: this.waterTexture },
        rippleStrength: { value: this.settings.rippleStrength },
        resolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight)
        },
        time: { value: 0 },
        colorA1: {
          value: new THREE.Vector3(
            preset.colorA1[0],
            preset.colorA1[1],
            preset.colorA1[2]
          )
        },
        colorA2: {
          value: new THREE.Vector3(
            preset.colorA2[0],
            preset.colorA2[1],
            preset.colorA2[2]
          )
        },
        colorB1: {
          value: new THREE.Vector3(
            preset.colorB1[0],
            preset.colorB1[1],
            preset.colorB1[2]
          )
        },
        colorB2: {
          value: new THREE.Vector3(
            preset.colorB2[0],
            preset.colorB2[1],
            preset.colorB2[2]
          )
        }
      },
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D waterTexture;
        uniform float rippleStrength;
        uniform vec2 resolution;
        uniform float time;
        uniform vec3 colorA1;
        uniform vec3 colorA2;
        uniform vec3 colorB1;
        uniform vec3 colorB2;
        varying vec2 vUv;
        
        // Helper functions from the provided shader
        float S(float a, float b, float t) {
          return smoothstep(a, b, t);
        }
        
        mat2 Rot(float a) {
          float s = sin(a);
          float c = cos(a);
          return mat2(c, -s, s, c);
        }
        
        // Improved 3D look with subtle noise
        float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 fp = fract(p);
          float a = fract(sin(dot(ip, vec2(12.9898, 78.233))) * 43758.5453);
          float b = fract(sin(dot(ip + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
          float c = fract(sin(dot(ip + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
          float d = fract(sin(dot(ip + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
          
          fp = fp * fp * (3.0 - 2.0 * fp);
          
          return mix(mix(a, b, fp.x), mix(c, d, fp.x), fp.y);
        }
        
        void main() {
          // Sample the water height for distortion
          float waterHeight = texture2D(waterTexture, vUv).r;
          
          // Calculate distortion based on water height gradient
          float step = 1.0 / resolution.x;
          vec2 distortion = vec2(
            texture2D(waterTexture, vec2(vUv.x + step, vUv.y)).r - texture2D(waterTexture, vec2(vUv.x - step, vUv.y)).r,
            texture2D(waterTexture, vec2(vUv.x, vUv.y + step)).r - texture2D(waterTexture, vec2(vUv.x, vUv.y - step)).r
          ) * rippleStrength * 5.0;
          
          // Apply distortion to UV coordinates
          vec2 tuv = vUv + distortion;
          
          // Prepare UVs
          tuv -= 0.5;
          
          // Adjust for aspect ratio
          float ratio = resolution.x / resolution.y;
          tuv.y *= 1.0/ratio;
          
          // Create the gradient background using the uniform colors
          vec3 layer1 = mix(colorA1, colorA2, S(-0.3, 0.2, (tuv*Rot(radians(-5.0))).x));
          vec3 layer2 = mix(colorB1, colorB2, S(-0.3, 0.2, (tuv*Rot(radians(-5.0))).x));
          vec3 finalComp = mix(layer1, layer2, S(0.5, -0.3, tuv.y));
          
          // Add subtle noise for more realistic 3D look
          float noiseValue = noise(tuv * 20.0 + time * 0.1) * 0.03;
          finalComp += vec3(noiseValue);
          
          // Add subtle vignette for depth
          float vignette = 1.0 - smoothstep(0.5, 1.5, length(tuv * 1.5));
          finalComp *= mix(0.95, 1.0, vignette);
          
          gl_FragColor = vec4(finalComp, 1.0);
        }
      `
    };

    // Create a full-screen quad
    const geometry = new THREE.PlaneGeometry(
      window.innerWidth,
      window.innerHeight
    );
    this.backgroundMaterial = new THREE.ShaderMaterial({
      uniforms: backgroundShader.uniforms,
      vertexShader: backgroundShader.vertexShader,
      fragmentShader: backgroundShader.fragmentShader
    });

    const mesh = new THREE.Mesh(geometry, this.backgroundMaterial);
    this.scene.add(mesh);
  }

  updateWaterSimulation() {
    const { current, previous } = this.waterBuffers;
    const { damping, tension, resolution } = this.settings;

    // Clamp tension to prevent simulation from breaking
    const safeTension = Math.min(tension, 0.05);

    // Process the buffer in chunks for better cache utilization
    const chunkSize = 256;

    for (let chunkY = 1; chunkY < resolution - 1; chunkY += chunkSize) {
      const endY = Math.min(chunkY + chunkSize, resolution - 1);

      for (let chunkX = 1; chunkX < resolution - 1; chunkX += chunkSize) {
        const endX = Math.min(chunkX + chunkSize, resolution - 1);

        for (let i = chunkY; i < endY; i++) {
          for (let j = chunkX; j < endX; j++) {
            const index = i * resolution + j;

            // Get neighboring heights
            const top = previous[index - resolution];
            const bottom = previous[index + resolution];
            const left = previous[index - 1];
            const right = previous[index + 1];

            // Calculate new height based on neighbors
            current[index] = (top + bottom + left + right) / 2 - current[index];
            current[index] =
              current[index] * damping + previous[index] * (1 - damping);

            // Apply tension with safety clamping
            current[index] += (0 - previous[index]) * safeTension;

            // Add stability by clamping extreme values
            current[index] = Math.max(-1.0, Math.min(1.0, current[index]));
          }
        }
      }
    }

    // Swap buffers
    [this.waterBuffers.current, this.waterBuffers.previous] = [
      this.waterBuffers.previous,
      this.waterBuffers.current
    ];

    // Update texture
    this.waterTexture.image.data = this.waterBuffers.current;
    this.waterTexture.needsUpdate = true;
  }

  addRipple(x, y, strength = 1.0) {
    const { resolution, rippleRadius } = this.settings;

    // IMPORTANT: Fix for coordinate mapping
    // We need to flip the Y coordinate to match the texture coordinate system
    // The texture coordinate system has (0,0) at the bottom-left, but screen coordinates have (0,0) at the top-left
    const normalizedX = x / window.innerWidth;
    const normalizedY = 1.0 - y / window.innerHeight; // Flip Y coordinate

    // Map to texture coordinates
    const texX = Math.floor(normalizedX * resolution);
    const texY = Math.floor(normalizedY * resolution);

    // Add ripple at position
    const radius = rippleRadius;
    const rippleStrength = strength;

    // Performance optimization: Pre-calculate squared radius
    const radiusSquared = radius * radius;

    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        const distanceSquared = i * i + j * j;

        if (distanceSquared <= radiusSquared) {
          const posX = texX + i;
          const posY = texY + j;

          if (
            posX >= 0 &&
            posX < resolution &&
            posY >= 0 &&
            posY < resolution
          ) {
            const index = posY * resolution + posX;
            // Use a smoother falloff for better looking ripples
            const distance = Math.sqrt(distanceSquared);
            const rippleValue =
              Math.cos(((distance / radius) * Math.PI) / 2) * rippleStrength;
            this.waterBuffers.previous[index] += rippleValue;
          }
        }
      }
    }
  }

  onMouseMove(ev) {
    // Get the exact position relative to the canvas
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;

    // Throttle mouse events for better performance
    const now = performance.now();
    if (now - this.mouseThrottleTime < 16) {
      // Limit to ~60 updates per second
      return;
    }
    this.mouseThrottleTime = now;

    // Calculate distance moved since last event
    const dx = x - this.lastMousePosition.x;
    const dy = y - this.lastMousePosition.y;
    const distSquared = dx * dx + dy * dy;

    // Only create ripples if mouse moved enough
    if (distSquared > 5) {
      this.addRipple(x, y, this.settings.mouseIntensity);
      this.lastMousePosition.x = x;
      this.lastMousePosition.y = y;
    }
  }

  onTouchMove(ev) {
    ev.preventDefault();

    // Get the exact position relative to the canvas
    const rect = this.renderer.domElement.getBoundingClientRect();
    const touch = ev.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Throttle touch events for better performance
    const now = performance.now();
    if (now - this.mouseThrottleTime < 16) {
      return;
    }
    this.mouseThrottleTime = now;

    // Calculate distance moved since last event
    const dx = x - this.lastMousePosition.x;
    const dy = y - this.lastMousePosition.y;
    const distSquared = dx * dx + dy * dy;

    // Only create ripples if touch moved enough
    if (distSquared > 5) {
      this.addRipple(x, y, this.settings.mouseIntensity);
      this.lastMousePosition.x = x;
      this.lastMousePosition.y = y;
    }
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Update camera
    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(width, height);

    // Update background material
    if (this.backgroundMaterial) {
      this.backgroundMaterial.uniforms.resolution.value.set(width, height);
    }

    // Update background mesh
    if (this.scene.children[0] && this.scene.children[0].geometry) {
      this.scene.children[0].geometry.dispose();
      this.scene.children[0].geometry = new THREE.PlaneGeometry(width, height);
    }
  }

  render() {
    // Update water simulation
    this.updateWaterSimulation();

    // Update shader uniforms
    if (this.backgroundMaterial) {
      this.backgroundMaterial.uniforms.rippleStrength.value = this.settings.rippleStrength;
      this.backgroundMaterial.uniforms.time.value += this.clock.getDelta();
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  tick() {
    this.stats.begin();

    // Track frame count for optimizations
    this.frameCount = (this.frameCount || 0) + 1;

    this.render();

    this.stats.end();
    requestAnimationFrame(this.tick);
  }
}

// Start the application
window.addEventListener("DOMContentLoaded", () => {
  const app = new App();

  // Add initial ripples
  setTimeout(() => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    app.addRipple(centerX, centerY, 1.5);
  }, 500);

  // Update auto drops settings when they change
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "data-value"
      ) {
        if (
          mutation.target.classList.contains("autoDrops") ||
          mutation.target.classList.contains("autoDropInterval")
        ) {
          app.setupAutoDrops();
        }
      }
    });
  });

  // Start observing the GUI elements after a short delay to ensure they're created
  setTimeout(() => {
    document.querySelectorAll(".dg .property-name").forEach((el) => {
      observer.observe(el, { attributes: true });
    });
  }, 1000);
});
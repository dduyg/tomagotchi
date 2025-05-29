import * as THREE from "https://esm.sh/three@0.175.0";
import { GUI } from "https://esm.sh/dat.gui@0.7.9";
import Stats from "https://esm.sh/stats.js@0.17.0";
import { EffectComposer } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/UnrealBloomPass.js";

// Create stats monitor
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Store mouse position and smooth it over time
const mouse = new THREE.Vector2(0, 0);
const smoothedMouse = new THREE.Vector2(0, 0);
let mouseDown = false;

// Color presets
const colorPresets = {
  Classic: {
    primaryColor: [255, 255, 255],
    secondaryColor: [255, 255, 255],
    accentColor: [0, 0, 0]
  },
  "Dark Moody": {
    primaryColor: [20, 30, 40],
    secondaryColor: [40, 50, 70],
    accentColor: [100, 120, 180]
  },
  "Crimson Heat": {
    primaryColor: [180, 30, 40],
    secondaryColor: [240, 80, 40],
    accentColor: [255, 200, 60]
  },
  "Neon Dream": {
    primaryColor: [30, 200, 255],
    secondaryColor: [180, 30, 255],
    accentColor: [255, 60, 220]
  },
  "Forest Depths": {
    primaryColor: [20, 80, 40],
    secondaryColor: [60, 120, 40],
    accentColor: [200, 230, 60]
  },
  "Ocean Calm": {
    primaryColor: [20, 40, 100],
    secondaryColor: [40, 100, 180],
    accentColor: [160, 240, 255]
  },
  "Sunset Glow": {
    primaryColor: [100, 50, 120],
    secondaryColor: [240, 100, 50],
    accentColor: [255, 220, 100]
  },
  Monochrome: {
    primaryColor: [0, 0, 0],
    secondaryColor: [80, 80, 80],
    accentColor: [200, 200, 200]
  },
  // New color presets
  "Ethereal Mist": {
    primaryColor: [40, 45, 60],
    secondaryColor: [90, 95, 120],
    accentColor: [180, 200, 255]
  },
  "Golden Hour": {
    primaryColor: [255, 200, 100],
    secondaryColor: [255, 140, 50],
    accentColor: [255, 230, 180]
  },
  // High contrast presets
  "Neon Nights": {
    primaryColor: [5, 5, 20],
    secondaryColor: [80, 10, 100],
    accentColor: [255, 50, 150]
  },
  "Electric Pulse": {
    primaryColor: [5, 15, 30],
    secondaryColor: [20, 80, 180],
    accentColor: [100, 220, 255]
  },
  "Molten Core": {
    primaryColor: [10, 10, 10],
    secondaryColor: [120, 30, 10],
    accentColor: [255, 180, 20]
  }
};

// Parameters for GUI controls
const params = {
  effectType: 1, // Default to Fractal Julia
  colorPreset: "Crimson Heat", // Default color preset
  primaryColor: [180, 30, 40],
  secondaryColor: [240, 80, 40],
  accentColor: [255, 200, 60],
  fractalScale: 0.83, // Updated per screenshot
  fractalX: 0,
  fractalY: 0,
  fractionalIterations: 8,
  lightCount: 3, // More lights for dramatic effect
  lightIntensity: 1.5, // Increased light intensity
  lightSpeed: 1.0,
  lightBloomBalance: 0.8, // Light balance with bloom
  lightLeak: 0.7, // New parameter for light leak effect
  contrastBoost: 1.2, // New parameter for contrast enhancement
  mouseProximityEffect: 0.8, // New parameter for mouse interaction intensity
  // Enhanced grain settings
  grainStrength: 0.02,
  grainSpeed: 2.0,
  grainMean: 0.0,
  grainVariance: 0.5,
  grainBlendMode: 1, // Set to Screen (1) per screenshot
  grainSize: 3.5, // Legacy parameter
  animationSpeed: 0.02,
  autoRotate: true,
  useBloom: true,
  bloomStrength: 0.1,
  bloomRadius: 0.4,
  bloomThreshold: 0.2,
  // Parameters for new cosmic nebula effect
  nebulaDensity: 3.0,
  nebulaWarp: 0.7,
  nebulaContrast: 1.4,
  nebulaSpeed: 0.3,
  nebulaLayers: 3,
  nebulaGlow: 0.8,
  // Parameters for new crystal refraction effect
  crystalFacets: 7,
  crystalRefraction: 0.6,
  crystalChroma: 0.4,
  crystalRotation: 0.2,
  crystalSharpness: 0.8,
  crystalGlint: 0.7
};

// Shader Material
const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    iResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    iTime: { value: 0.0 },
    smoothedMouse: { value: new THREE.Vector2(0, 0) },
    mouseDown: { value: 0 },
    primaryColor: {
      value: new THREE.Color().fromArray(
        params.primaryColor.map((c) => c / 255)
      )
    },
    secondaryColor: {
      value: new THREE.Color().fromArray(
        params.secondaryColor.map((c) => c / 255)
      )
    },
    accentColor: {
      value: new THREE.Color().fromArray(params.accentColor.map((c) => c / 255))
    },
    fractalScale: { value: params.fractalScale },
    fractalOffset: {
      value: new THREE.Vector2(params.fractalX, params.fractalY)
    },
    fractionalIterations: { value: params.fractionalIterations },
    lightCount: { value: params.lightCount },
    lightIntensity: { value: params.lightIntensity },
    lightSpeed: { value: params.lightSpeed },
    lightBloomBalance: { value: params.lightBloomBalance },
    lightLeak: { value: params.lightLeak },
    contrastBoost: { value: params.contrastBoost },
    mouseProximityEffect: { value: params.mouseProximityEffect },
    useBloom: { value: params.useBloom ? 1.0 : 0.0 },
    // Enhanced grain uniforms
    grainStrength: { value: params.grainStrength },
    grainSize: { value: params.grainSize },
    grainSpeed: { value: params.grainSpeed },
    grainMean: { value: params.grainMean },
    grainVariance: { value: params.grainVariance },
    grainBlendMode: { value: params.grainBlendMode },
    animationSpeed: { value: params.animationSpeed },
    autoRotate: { value: params.autoRotate ? 1.0 : 0.0 },
    effectType: { value: params.effectType },
    // Cosmic nebula parameters
    nebulaDensity: { value: params.nebulaDensity },
    nebulaWarp: { value: params.nebulaWarp },
    nebulaContrast: { value: params.nebulaContrast },
    nebulaSpeed: { value: params.nebulaSpeed },
    nebulaLayers: { value: params.nebulaLayers },
    nebulaGlow: { value: params.nebulaGlow },
    // Crystal refraction parameters
    crystalFacets: { value: params.crystalFacets },
    crystalRefraction: { value: params.crystalRefraction },
    crystalChroma: { value: params.crystalChroma },
    crystalRotation: { value: params.crystalRotation },
    crystalSharpness: { value: params.crystalSharpness },
    crystalGlint: { value: params.crystalGlint }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform vec3 primaryColor;
    uniform vec3 secondaryColor;
    uniform vec3 accentColor;
    uniform vec2 smoothedMouse;
    uniform float mouseDown;
    uniform float fractalScale;
    uniform vec2 fractalOffset;
    uniform int fractionalIterations;
    uniform int lightCount;
    uniform float lightIntensity;
    uniform float lightSpeed;
    uniform float lightBloomBalance;
    uniform float lightLeak;
    uniform float contrastBoost;
    uniform float mouseProximityEffect;
    uniform float useBloom;
    // Enhanced grain uniforms
    uniform float grainStrength;
    uniform float grainSize;
    uniform float grainSpeed;
    uniform float grainMean;
    uniform float grainVariance;
    uniform int grainBlendMode;
    uniform float animationSpeed;
    uniform float autoRotate;
    uniform int effectType;
    // Cosmic nebula parameters
    uniform float nebulaDensity;
    uniform float nebulaWarp;
    uniform float nebulaContrast;
    uniform float nebulaSpeed;
    uniform int nebulaLayers;
    uniform float nebulaGlow;
    // Crystal refraction parameters
    uniform int crystalFacets;
    uniform float crystalRefraction;
    uniform float crystalChroma;
    uniform float crystalRotation;
    uniform float crystalSharpness;
    uniform float crystalGlint;

    #define PI 3.14159265359

    // Hash functions
    float hash(float n) {
        return fract(sin(n) * 43758.5453);
    }
    
    float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
    }
    
    // Vector hash function
    vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return fract(sin(p) * 43758.5453);
    }
    
    // Rotation matrix
    mat2 rot(float a) {
        float s = sin(a);
        float c = cos(a);
        return mat2(c, -s, s, c);
    }

    // Perlin Noise Implementation
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        
        // Smoothed interpolation
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    // Fractal Brownian Motion (FBM)
    float fbm(vec2 p, int octaves, float persistence) {
        float total = 0.0;
        float amp = 1.0;
        float freq = 1.0;
        float totalAmp = 0.0;
        
        for(int i = 0; i < 10; i++) {
            if (i >= octaves) break;
            
            total += amp * noise(p * freq);
            totalAmp += amp;
            amp *= persistence;
            freq *= 2.0;
        }
        
        return total / totalAmp;
    }
    
    // Domain warping
    vec2 warp(vec2 p, float strength) {
        vec2 q = vec2(
            fbm(p + vec2(0.0, 1.0), 4, 0.5),
            fbm(p + vec2(5.2, 1.3), 4, 0.5)
        );
        
        return p + strength * q;
    }
    
    // Channel mixing utility for blending modes
    vec3 channel_mix(vec3 a, vec3 b, vec3 w) {
        return vec3(mix(a.r, b.r, w.r), mix(a.g, b.g, w.g), mix(a.b, b.b, w.b));
    }
    
    // Gaussian distribution function for more natural-looking grain
    float gaussian(float z, float u, float o) {
        return (1.0 / (o * sqrt(2.0 * 3.1415))) * exp(-(((z - u) * (z - u)) / (2.0 * (o * o))));
    }
    
    // Blending modes for grain
    vec3 screen(vec3 a, vec3 b, float w) {
        return mix(a, vec3(1.0) - (vec3(1.0) - a) * (vec3(1.0) - b), w);
    }
    
    vec3 overlay(vec3 a, vec3 b, float w) {
        return mix(a, channel_mix(
            2.0 * a * b,
            vec3(1.0) - 2.0 * (vec3(1.0) - a) * (vec3(1.0) - b),
            step(vec3(0.5), a)
        ), w);
    }
    
    vec3 soft_light(vec3 a, vec3 b, float w) {
        return mix(a, pow(a, pow(vec3(2.0), 2.0 * (vec3(0.5) - b))), w);
    }
    
    // Apply grain to a color using the selected blend mode
    vec3 applyGrain(vec3 color, float noiseValue, float intensity) {
        vec3 grain = vec3(noiseValue) * (1.0 - color);
        
        if (grainBlendMode == 0) {
            // Addition
            return color + grain * intensity;
        } else if (grainBlendMode == 1) {
            // Screen
            return screen(color, grain, intensity);
        } else if (grainBlendMode == 2) {
            // Overlay
            return overlay(color, grain, intensity);
        } else if (grainBlendMode == 3) {
            // Soft Light
            return soft_light(color, grain, intensity);
        } else if (grainBlendMode == 4) {
            // Lighten-Only
            return max(color, grain * intensity);
        }
        
        return color;
    }
    
    // Get light positions
    vec3 getLightPosition(int index, float time) {
        float angle = float(index) * (2.0 * PI / float(lightCount)) + time * lightSpeed;
        float radius = 1.5;
        float height = sin(time * lightSpeed * 0.5 + float(index)) * 0.5;
        
        return vec3(radius * cos(angle), height, radius * sin(angle));
    }
    
    // Enhanced contrast function
    vec3 enhanceContrast(vec3 color, float amount) {
        vec3 avgLuma = vec3(0.299, 0.587, 0.114);
        float luminance = dot(color, avgLuma);
        return mix(vec3(luminance), color, amount);
    }
    
    // Nebula generation function
    float nebulaPattern(vec2 uv, float scale, int layers, float warpStrength) {
        vec2 p = uv * scale;
        
        // Apply domain warping for more organic cloud-like appearance
        vec2 warped = warp(p, warpStrength);
        
        float pattern = 0.0;
        float amp = 1.0;
        float totalAmp = 0.0;
        
        // Generate layers of fbm for cosmic cloud effect
        for (int i = 0; i < 5; i++) {
            if (i >= layers) break;
            
            pattern += amp * fbm(warped * (1.0 + float(i) * 0.5), 4, 0.5);
            totalAmp += amp;
            amp *= 0.5;
            
            // Add some rotation to the coordinates for each layer
            warped = rot(0.7) * warped;
        }
        
        pattern /= totalAmp;
        
        // Apply contrast adjustment for more defined nebula clouds
        return pow(pattern, nebulaContrast);
    }
    
    // Crystal refraction function
    float crystalShape(vec2 uv, float time) {
        // Center coordinates
        vec2 p = uv - 0.5;
        
        // Rotate over time
        p = rot(time * crystalRotation) * p;
        
        // Convert to polar coordinates
        float angle = atan(p.y, p.x);
        float dist = length(p);
        
        // Create crystal facets
        float segments = float(crystalFacets);
        float segmentAngle = 2.0 * PI / segments;
        
        // Calculate angle within segment and distance to segment edge
        float angleInSegment = mod(angle, segmentAngle);
        angleInSegment = min(angleInSegment, segmentAngle - angleInSegment);
        
        // Crystal facet shape
        float facet = smoothstep(0.0, 0.1 * crystalSharpness, angleInSegment);
        
        // Refraction distortions
        float distortion = sin(angle * segments + time * 0.5) * 0.1 * crystalRefraction;
        
        return facet * (dist + distortion);
    }
    
    // Mouse proximity effect for visual effects
    float mouseEffect(vec2 uv) {
        vec2 mousePos = smoothedMouse / iResolution.xy;
        float dist = length(uv - mousePos);
        
        // Get stronger effect when mouse is closer
        float proximity = smoothstep(0.5, 0.0, dist) * mouseProximityEffect;
        
        // Add pulsating effect when mouse is down
        if (mouseDown > 0.5) {
            proximity *= 1.0 + 0.3 * sin(iTime * 10.0 * animationSpeed);
        }
        
        return proximity;
    }

    void main() {
        // Normalize UV coordinates
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        
        // Apply effect based on selected type
        float shape = 0.0;
        vec2 effectUV = uv;
        
        // Get mouse effect for all visuals
        float mouseProx = mouseEffect(uv);
        
        // Aspect ratio correction
        vec2 p = (effectUV * 2.0 - 1.0);
        p.x *= iResolution.x / iResolution.y;
        
        // Apply fractal scale and offset
        p *= fractalScale;
        p += fractalOffset;
        
        // Select effect
        if (effectType == 0) {
            // Original orb with enhanced lighting and contrast
            // Distance from center
            float d = length(p);
            float pulse = 0.5 + 0.1 * sin(iTime * animationSpeed * 2.0);
            
            // Enhanced orb shape
            float orbshape = smoothstep(pulse, pulse - (0.1 + mouseProx * 0.1), d);
            
            // More intense internal glow
            float innerGlow = smoothstep(pulse * 0.8, 0.0, d) * (0.5 + mouseProx * 0.3);
            
            // More dynamic swirls influenced by mouse
            float angle = atan(p.y, p.x);
            float swirl = 0.2 * sin(angle * (8.0 + mouseProx * 4.0) + iTime * 3.0 * animationSpeed);
            swirl *= smoothstep(pulse, 0.0, d);
            
            // Add light leaks
            float leak = smoothstep(0.8, 0.0, d) * sin(angle * 2.0 + iTime * animationSpeed) * lightLeak;
            
            shape = orbshape + innerGlow + swirl + leak;
        } 
        else if (effectType == 1) {
            // Fractal Julia set with enhanced features
            vec2 c = vec2(
                0.7885 * cos(iTime * animationSpeed * 0.4),
                0.7885 * sin(iTime * animationSpeed * 0.4)
            );
            
            vec2 z = p;
            
            // Add mouse influence to the Julia set
            if (mouseProx > 0.05) {
                c = mix(c, (smoothedMouse / iResolution.xy * 2.0 - 1.0) * 0.8, mouseProx * 0.5);
            }
            
            float iteration = 0.0;
            
            for (int i = 0; i < 100; i++) {
                if (i >= fractionalIterations) break;
                
                // z = z² + c
                z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
                
                if (dot(z, z) > 4.0) break;
                iteration += 1.0;
            }
            
            // Smooth coloring
            if (iteration < float(fractionalIterations)) {
                float log_zn = log(dot(z, z)) * 0.5;
                float smoothed = iteration + 1.0 - log(log_zn / log(2.0)) / log(2.0);
                iteration = smoothed;
            }
            
            // Normalize
            shape = iteration / float(fractionalIterations);
            
            // Add light leaks around the edges
            float d = length(p);
            float angle = atan(p.y, p.x);
            float leak = smoothstep(1.0, 0.5, d) * sin(angle * 3.0 + iTime * animationSpeed) * lightLeak * 0.3;
            shape += leak;
        }
        else if (effectType == 2) {
            // Crystal Refraction
            // Get the basic crystal shape
            float crystal = crystalShape(uv, iTime * animationSpeed);
            
            // Apply chromatic aberration effect
            float redShift = crystalShape(uv, iTime * animationSpeed - 0.02 * crystalChroma);
            float blueShift = crystalShape(uv, iTime * animationSpeed + 0.02 * crystalChroma);
            
            // Add dynamic glints based on angle and time
            vec2 centeredUV = uv - 0.5;
            float angle = atan(centeredUV.y, centeredUV.x);
            float dist = length(centeredUV);
            
            float glint = pow(abs(sin(angle * float(crystalFacets) * 0.5 + iTime * animationSpeed * 3.0)), 10.0);
            glint *= smoothstep(1.0, 0.2, dist) * crystalGlint;
            
            // Apply mouse proximity for extra glint
            glint += mouseProx * crystalGlint * 0.5 * smoothstep(0.5, 0.0, length(centeredUV - (smoothedMouse / iResolution.xy - 0.5)));
            
            // Combine everything
            crystal = mix(crystal, (redShift + blueShift) * 0.5, 0.3);
            shape = crystal + glint;
            
            // Add some light leaks
            float leak = abs(sin(angle * 2.0 + dist * 5.0 + iTime * animationSpeed * 0.5)) * smoothstep(1.0, 0.2, dist) * lightLeak * 0.4;
            shape += leak;
        }
        else if (effectType == 3) {
            // Cosmic Nebula
            // Generate base nebula cloud pattern
            float base = nebulaPattern(uv, nebulaDensity, nebulaLayers, nebulaWarp);
            
            // Add parallax layer for depth
            float timeFactor = iTime * animationSpeed * nebulaSpeed;
            float parallax = nebulaPattern(uv + vec2(timeFactor * 0.02, timeFactor * 0.03), 
                                          nebulaDensity * 0.7, 
                                          nebulaLayers - 1, 
                                          nebulaWarp * 0.8);
            
            // Create some animated swirls and detail
            vec2 swirledUV = uv + vec2(
                sin(uv.y * 4.0 + timeFactor) * 0.03,
                cos(uv.x * 4.0 + timeFactor) * 0.03
            );
            float detail = nebulaPattern(swirledUV, nebulaDensity * 2.0, 2, nebulaWarp * 0.5);
            
            // Add glow around denser areas
            float glow = smoothstep(0.4, 0.8, base) * nebulaGlow;
            
            // Enhance with mouse interaction
            if (mouseProx > 0.05) {
                vec2 mouseUV = smoothedMouse / iResolution.xy;
                float mouseDist = length(uv - mouseUV);
                float mouseGlow = smoothstep(0.3, 0.0, mouseDist) * mouseProx;
                glow += mouseGlow * nebulaGlow;
                
                // Create swirl around mouse position
                vec2 toMouse = normalize(mouseUV - uv);
                float swirl = length(uv - mouseUV) * 10.0;
                swirl = sin(swirl - timeFactor * 2.0) * 0.5 + 0.5;
                swirl *= smoothstep(0.4, 0.0, length(uv - mouseUV));
                
                base += swirl * mouseProx * 0.3;
            }
            
            // Combine all elements
            shape = base * 0.6 + parallax * 0.3 + detail * 0.2 + glow;
            
            // Add some subtle stars
            float stars = step(0.98, hash(uv * 500.0)) * 0.5;
            stars *= sin(iTime * animationSpeed * 5.0 + hash(uv) * 10.0) * 0.5 + 0.5;
            shape += stars;
        }
        
        // Calculate light influence with enhanced effects
        vec2 centeredUV = (uv * 2.0 - 1.0);
        centeredUV.x *= iResolution.x / iResolution.y;
        
        // Convert 2D position to 3D for light calculation
        vec3 pos = vec3(centeredUV.x, centeredUV.y, 0.0);
        float totalLight = 0.0;
        
        // Add contribution from each light with more dramatic falloff
        for (int i = 0; i < 10; i++) {
            if (i >= lightCount) break;
            
            vec3 lightPos = getLightPosition(i, iTime);
            float dist = length(pos - lightPos);
            
            // More dramatic light falloff
            float falloff = 1.0 / (1.0 + dist * dist * 1.5);
            
            // Add pulsating effect to lights
            float pulse = 0.8 + 0.2 * sin(iTime * animationSpeed * 3.0 + float(i) * 1.5);
            
            totalLight += lightIntensity * falloff * pulse;
        }
        
        // Add mouse-based light with proximity effect
        vec2 mousePos = smoothedMouse / iResolution.xy;
        mousePos = (mousePos * 2.0 - 1.0);
        mousePos.x *= iResolution.x / iResolution.y;
        
        float mouseDist = length(centeredUV - mousePos);
        float mouseLight = lightIntensity * 2.5 / (1.0 + mouseDist * mouseDist * 3.0);
        
        // Make mouse light more dramatic when mouse is down
        if (mouseDown > 0.5) {
            mouseLight *= 1.5 + 0.5 * sin(iTime * 20.0 * animationSpeed);
        }
        
        totalLight += mouseLight * mouseProximityEffect;
        
        // Add ambient light
        totalLight += 0.2;
        
        // Apply light balance when bloom is active
        if (useBloom > 0.5) {
            totalLight *= lightBloomBalance;
        }
        
        // Create a more complex color mix using all three colors
        vec3 finalColor = mix(primaryColor, secondaryColor, shape);
        
        // Add accent color to highlights with more contrast
        float highlight = pow(shape, 4.0);
        finalColor = mix(finalColor, accentColor, highlight * 0.7);
        
        // Apply light effect
        finalColor *= totalLight * (shape + 0.3);
        
        // Add light leaks based on the light leak parameter
        float leak = fbm(uv * 2.0 + iTime * animationSpeed * 0.1, 2, 0.5) * lightLeak * 0.3;
        leak *= smoothstep(1.0, 0.5, length(centeredUV));
        finalColor += leak * accentColor;
        
        // Enhance contrast
        finalColor = enhanceContrast(finalColor, contrastBoost);
        
        // Apply enhanced film grain effect
        float t = iTime * grainSpeed * animationSpeed;
        float seed = dot(vUv, vec2(12.9898, 78.233));
        float noise = fract(sin(seed) * 43758.5453 + t);
        
        // Apply gaussian distribution to the noise for more natural look
        noise = gaussian(noise, grainMean, grainVariance * grainVariance);
        
        // Apply the grain using the chosen blend mode
        finalColor = applyGrain(finalColor, noise, grainStrength);
        
        // Set the final color
        gl_FragColor = vec4(finalColor, 1.0);
    }
  `
});

// Create a fullscreen plane
const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial);
scene.add(plane);

// Setup post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add bloom effect
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  params.bloomStrength,
  params.bloomRadius,
  params.bloomThreshold
);
composer.addPass(bloomPass);

// Setup GUI
const gui = new GUI();
gui.width = 300;

// Effect selection
const effectFolder = gui.addFolder("Effect Type");
effectFolder
  .add(params, "effectType", {
    "Enhanced Orb": 0,
    "Fractal Julia": 1,
    "Crystal Refraction": 2,
    "Cosmic Nebula": 3
  })
  .onChange((value) => {
    shaderMaterial.uniforms.effectType.value = value;

    // Show/hide effect-specific controls based on selected effect
    updateVisibleControls(value);
  });
effectFolder.open();

// Function to show/hide effect-specific controls
function updateVisibleControls(effectType) {
  // Hide all special folders first
  juliaFolder.domElement.style.display = "none";
  crystalFolder.domElement.style.display = "none";
  nebulaFolder.domElement.style.display = "none";

  // Show the relevant folder based on the effect type
  if (effectType === 1) {
    juliaFolder.domElement.style.display = "block";
  } else if (effectType === 2) {
    crystalFolder.domElement.style.display = "block";
  } else if (effectType === 3) {
    nebulaFolder.domElement.style.display = "block";
  }
}

// Colors
const colorFolder = gui.addFolder("Colors");

// Color presets
colorFolder
  .add(params, "colorPreset", Object.keys(colorPresets))
  .onChange((presetName) => {
    const preset = colorPresets[presetName];

    // Update params
    params.primaryColor = [...preset.primaryColor]; // Clone the array
    params.secondaryColor = [...preset.secondaryColor];
    params.accentColor = [...preset.accentColor];

    // Update shader uniforms directly
    shaderMaterial.uniforms.primaryColor.value.fromArray(
      preset.primaryColor.map((c) => c / 255)
    );
    shaderMaterial.uniforms.secondaryColor.value.fromArray(
      preset.secondaryColor.map((c) => c / 255)
    );
    shaderMaterial.uniforms.accentColor.value.fromArray(
      preset.accentColor.map((c) => c / 255)
    );

    // Update GUI controllers - we need to manually update each controller
    primaryColorController.setValue(params.primaryColor);
    secondaryColorController.setValue(params.secondaryColor);
    accentColorController.setValue(params.accentColor);
  });

// Individual color controls
const primaryColorController = colorFolder
  .addColor(params, "primaryColor")
  .onChange((value) => {
    shaderMaterial.uniforms.primaryColor.value.fromArray(
      value.map((c) => c / 255)
    );
  });
const secondaryColorController = colorFolder
  .addColor(params, "secondaryColor")
  .onChange((value) => {
    shaderMaterial.uniforms.secondaryColor.value.fromArray(
      value.map((c) => c / 255)
    );
  });
const accentColorController = colorFolder
  .addColor(params, "accentColor")
  .onChange((value) => {
    shaderMaterial.uniforms.accentColor.value.fromArray(
      value.map((c) => c / 255)
    );
  });

// Fractal settings
const fractalFolder = gui.addFolder("Shape Settings");
fractalFolder.add(params, "fractalScale", 0.1, 2.0).onChange((value) => {
  shaderMaterial.uniforms.fractalScale.value = value;
});
fractalFolder.add(params, "fractalX", -1.0, 1.0).onChange((value) => {
  shaderMaterial.uniforms.fractalOffset.value.x = value;
});
fractalFolder.add(params, "fractalY", -1.0, 1.0).onChange((value) => {
  shaderMaterial.uniforms.fractalOffset.value.y = value;
});

// Create folders for effect-specific controls
const juliaFolder = gui.addFolder("Julia Set Controls");
juliaFolder.add(params, "fractionalIterations", 1, 20, 1).onChange((value) => {
  shaderMaterial.uniforms.fractionalIterations.value = value;
});

// Crystal refraction controls
const crystalFolder = gui.addFolder("Crystal Refraction Controls");
crystalFolder.add(params, "crystalFacets", 3, 20, 1).onChange((value) => {
  shaderMaterial.uniforms.crystalFacets.value = value;
});
crystalFolder.add(params, "crystalRefraction", 0.0, 1.0).onChange((value) => {
  shaderMaterial.uniforms.crystalRefraction.value = value;
});
crystalFolder.add(params, "crystalChroma", 0.0, 1.0).onChange((value) => {
  shaderMaterial.uniforms.crystalChroma.value = value;
});
crystalFolder.add(params, "crystalRotation", 0.0, 1.0).onChange((value) => {
  shaderMaterial.uniforms.crystalRotation.value = value;
});
crystalFolder.add(params, "crystalSharpness", 0.1, 1.0).onChange((value) => {
  shaderMaterial.uniforms.crystalSharpness.value = value;
});
crystalFolder.add(params, "crystalGlint", 0.0, 1.0).onChange((value) => {
  shaderMaterial.uniforms.crystalGlint.value = value;
});

// Nebula controls
const nebulaFolder = gui.addFolder("Cosmic Nebula Controls");
nebulaFolder.add(params, "nebulaDensity", 1.0, 10.0).onChange((value) => {
  shaderMaterial.uniforms.nebulaDensity.value = value;
});
nebulaFolder.add(params, "nebulaWarp", 0.0, 1.5).onChange((value) => {
  shaderMaterial.uniforms.nebulaWarp.value = value;
});
nebulaFolder.add(params, "nebulaContrast", 0.5, 3.0).onChange((value) => {
  shaderMaterial.uniforms.nebulaContrast.value = value;
});
nebulaFolder.add(params, "nebulaSpeed", 0.0, 1.0).onChange((value) => {
  shaderMaterial.uniforms.nebulaSpeed.value = value;
});
nebulaFolder.add(params, "nebulaLayers", 1, 5, 1).onChange((value) => {
  shaderMaterial.uniforms.nebulaLayers.value = value;
});
nebulaFolder.add(params, "nebulaGlow", 0.0, 1.5).onChange((value) => {
  shaderMaterial.uniforms.nebulaGlow.value = value;
});

// Enhanced visual controls
const enhancedFolder = gui.addFolder("Enhanced Effects");
enhancedFolder.add(params, "contrastBoost", 0.5, 2.0).onChange((value) => {
  shaderMaterial.uniforms.contrastBoost.value = value;
});
enhancedFolder.add(params, "lightLeak", 0.0, 1.0).onChange((value) => {
  shaderMaterial.uniforms.lightLeak.value = value;
});
enhancedFolder
  .add(params, "mouseProximityEffect", 0.0, 1.5)
  .onChange((value) => {
    shaderMaterial.uniforms.mouseProximityEffect.value = value;
  });

// Light settings
const lightFolder = gui.addFolder("Light Settings");
lightFolder.add(params, "lightCount", 0, 10, 1).onChange((value) => {
  shaderMaterial.uniforms.lightCount.value = value;
});
lightFolder.add(params, "lightIntensity", 0.0, 5.0).onChange((value) => {
  shaderMaterial.uniforms.lightIntensity.value = value;
});
lightFolder.add(params, "lightSpeed", 0.0, 3.0).onChange((value) => {
  shaderMaterial.uniforms.lightSpeed.value = value;
});
lightFolder
  .add(params, "lightBloomBalance", 0.0, 1.0)
  .name("Bloom Balance")
  .onChange((value) => {
    shaderMaterial.uniforms.lightBloomBalance.value = value;
  });

// Animation settings
const animationFolder = gui.addFolder("Animation");
animationFolder.add(params, "animationSpeed", 0.0, 0.1).onChange((value) => {
  shaderMaterial.uniforms.animationSpeed.value = value;
});
animationFolder.add(params, "autoRotate").onChange((value) => {
  shaderMaterial.uniforms.autoRotate.value = value ? 1.0 : 0.0;
});

// Enhanced grain settings
const grainFolder = gui.addFolder("Film Grain Effect");
grainFolder
  .add(params, "grainStrength", 0.0, 0.3)
  .name("Intensity")
  .onChange((value) => {
    shaderMaterial.uniforms.grainStrength.value = value;
  });
grainFolder
  .add(params, "grainSpeed", 0.5, 5.0)
  .name("Animation Speed")
  .onChange((value) => {
    shaderMaterial.uniforms.grainSpeed.value = value;
  });
grainFolder
  .add(params, "grainMean", -0.5, 0.5)
  .name("Mean")
  .onChange((value) => {
    shaderMaterial.uniforms.grainMean.value = value;
  });
grainFolder
  .add(params, "grainVariance", 0.1, 1.0)
  .name("Variance")
  .onChange((value) => {
    shaderMaterial.uniforms.grainVariance.value = value;
  });
grainFolder
  .add(params, "grainBlendMode", {
    Addition: 0,
    Screen: 1,
    Overlay: 2,
    "Soft Light": 3,
    "Lighten-Only": 4
  })
  .name("Blend Mode")
  .onChange((value) => {
    shaderMaterial.uniforms.grainBlendMode.value = value;
  });

// Post-processing settings
const postFolder = gui.addFolder("Post Processing");
postFolder.add(params, "useBloom").onChange((value) => {
  bloomPass.enabled = value;
  shaderMaterial.uniforms.useBloom.value = value ? 1.0 : 0.0;
});
postFolder.add(params, "bloomStrength", 0.0, 3.0).onChange((value) => {
  bloomPass.strength = value;
});
postFolder.add(params, "bloomRadius", 0.0, 1.0).onChange((value) => {
  bloomPass.radius = value;
});
postFolder.add(params, "bloomThreshold", 0.0, 1.0).onChange((value) => {
  bloomPass.threshold = value;
});

// Mouse event listeners
window.addEventListener("mousemove", (event) => {
  const mouseX = event.clientX / window.innerWidth;
  const mouseY = 1.0 - event.clientY / window.innerHeight; // Flip Y axis
  mouse.set(mouseX, mouseY);
});

window.addEventListener("mousedown", () => {
  mouseDown = true;
  shaderMaterial.uniforms.mouseDown.value = 1.0;
});

window.addEventListener("mouseup", () => {
  mouseDown = false;
  shaderMaterial.uniforms.mouseDown.value = 0.0;
});

// Animation Loop
function animate() {
  stats.begin();

  // Update time uniform
  const time = performance.now() * 0.001; // Convert to seconds
  shaderMaterial.uniforms.iTime.value = time;

  // Smooth out the mouse movement
  smoothedMouse.lerp(mouse, 0.1); // 0.1 controls the smoothness (lower value = smoother)
  shaderMaterial.uniforms.smoothedMouse.value.set(
    smoothedMouse.x * window.innerWidth,
    smoothedMouse.y * window.innerHeight
  );

  // Render with post-processing
  if (params.useBloom) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }

  stats.end();
  requestAnimationFrame(animate);
}

// Start animation
animate();

// Call once at start to set up initial visibility
updateVisibleControls(params.effectType);

// Handle Window Resize
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Update renderer and composer
  renderer.setSize(width, height);
  composer.setSize(width, height);

  // Update shader uniform
  shaderMaterial.uniforms.iResolution.value.set(width, height);
});

// Add touch support for mobile devices
window.addEventListener(
  "touchmove",
  (event) => {
    event.preventDefault();
    const touch = event.touches[0];
    const mouseX = touch.clientX / window.innerWidth;
    const mouseY = 1.0 - touch.clientY / window.innerHeight; // Flip Y axis
    mouse.set(mouseX, mouseY);
  },
  { passive: false }
);

window.addEventListener("touchstart", (event) => {
  mouseDown = true;
  shaderMaterial.uniforms.mouseDown.value = 1.0;

  // Set initial touch position
  const touch = event.touches[0];
  const mouseX = touch.clientX / window.innerWidth;
  const mouseY = 1.0 - touch.clientY / window.innerHeight;
  mouse.set(mouseX, mouseY);
});

window.addEventListener("touchend", () => {
  mouseDown = false;
  shaderMaterial.uniforms.mouseDown.value = 0.0;
});

// Optional: Add a custom cursor
const cursor = document.createElement("div");
cursor.className = "custom-cursor";
cursor.style.position = "fixed";
cursor.style.width = "20px";
cursor.style.height = "20px";
cursor.style.borderRadius = "50%";
cursor.style.border = "2px solid white";
cursor.style.transform = "translate(-50%, -50%)";
cursor.style.pointerEvents = "none";
cursor.style.zIndex = "1000";
document.body.appendChild(cursor);

// Track cursor with throttling for performance
let lastCursorUpdate = 0;
document.addEventListener("mousemove", (e) => {
  // Throttle cursor updates to approximately 60fps
  const now = performance.now();
  if (now - lastCursorUpdate > 16) {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
    lastCursorUpdate = now;
  }
});

// Hide cursor when mouse leaves window
document.addEventListener("mouseleave", () => {
  cursor.style.display = "none";
});

document.addEventListener("mouseenter", () => {
  cursor.style.display = "block";
});
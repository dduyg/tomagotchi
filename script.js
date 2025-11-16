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
  }
};

// Parameters for GUI controls
const params = {
  effectType: 2, // Default to Ripple
  colorPreset: "Dark Moody", // Default color preset
  primaryColor: [20, 30, 40],
  secondaryColor: [40, 50, 70],
  accentColor: [255, 200, 60],
  fractalScale: 0.83, // Updated per screenshot
  fractalX: 0,
  fractalY: 0,
  fractionalIterations: 8,
  waveAmplitude: 0.1,
  waveFrequency: 10.0,
  kaleidoscopeSegments: 8,
  fmDensity: 20.0,
  fmIntensity: 0.5,
  lightCount: 1,
  lightIntensity: 1.0,
  lightSpeed: 1.0,
  lightBloomBalance: 0.8, // New parameter to balance light with bloom
  // Enhanced grain settings
  grainStrength: 0.02, // Updated per screenshot
  grainSpeed: 2.0,
  grainMean: 0.0,
  grainVariance: 0.5,
  grainBlendMode: 1, // Set to Screen (1) per screenshot
  grainSize: 3.5, // Legacy parameter
  animationSpeed: 0.02,
  autoRotate: true,
  useBloom: true,
  bloomStrength: 0.1, // Updated per screenshot
  bloomRadius: 0.4,
  bloomThreshold: 0.2,
  // Parameters for enhanced Perlin noise
  perlinLayers: 3,
  perlinScale: 3.0,
  perlinWarp: 0.4,
  perlinHeight: 1.2,
  perlinRidges: false,
  // Parameters for enhanced Voronoi
  voronoiScale: 5.0,
  voronoiLayers: 2,
  voronoiWarp: 0.3,
  voronoiDepth: 0.6,
  voronoiContrast: 1.2,
  voronoiSpeed: 0.5,
  voronoiEdges: true
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
    waveAmplitude: { value: params.waveAmplitude },
    waveFrequency: { value: params.waveFrequency },
    kaleidoscopeSegments: { value: params.kaleidoscopeSegments },
    fmDensity: { value: params.fmDensity },
    fmIntensity: { value: params.fmIntensity },
    lightCount: { value: params.lightCount },
    lightIntensity: { value: params.lightIntensity },
    lightSpeed: { value: params.lightSpeed },
    lightBloomBalance: { value: params.lightBloomBalance },
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
    // Uniforms for enhanced Perlin noise
    perlinLayers: { value: params.perlinLayers },
    perlinScale: { value: params.perlinScale },
    perlinWarp: { value: params.perlinWarp },
    perlinHeight: { value: params.perlinHeight },
    perlinRidges: { value: params.perlinRidges ? 1.0 : 0.0 },
    // Uniforms for enhanced Voronoi
    voronoiScale: { value: params.voronoiScale },
    voronoiLayers: { value: params.voronoiLayers },
    voronoiWarp: { value: params.voronoiWarp },
    voronoiDepth: { value: params.voronoiDepth },
    voronoiContrast: { value: params.voronoiContrast },
    voronoiSpeed: { value: params.voronoiSpeed },
    voronoiEdges: { value: params.voronoiEdges ? 1.0 : 0.0 }
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
    uniform int kaleidoscopeSegments;
    uniform float fmDensity;
    uniform float fmIntensity;
    uniform int lightCount;
    uniform float lightIntensity;
    uniform float lightSpeed;
    uniform float lightBloomBalance;
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
    uniform int fractionalIterations;
    uniform float waveAmplitude;
    uniform float waveFrequency;
    // Uniforms for enhanced Perlin noise
    uniform int perlinLayers;
    uniform float perlinScale;
    uniform float perlinWarp;
    uniform float perlinHeight;
    uniform float perlinRidges;
    // Uniforms for enhanced Voronoi
    uniform float voronoiScale;
    uniform int voronoiLayers;
    uniform float voronoiWarp;
    uniform float voronoiDepth;
    uniform float voronoiContrast;
    uniform float voronoiSpeed;
    uniform float voronoiEdges;

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
    
    // Vector hash function - needed for Voronoi cells
    vec2 hash2(vec2 p) {
        // Create two different hashes for x and y
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
        float perlinSum = 0.0;
        float amp = 1.0;
        float freq = 1.0;
        float totalAmp = 0.0;
        
        // Add several octaves of noise
        for(int i = 0; i < 10; i++) {
            if (i >= octaves) break;
            
            perlinSum += amp * noise(p * freq);
            totalAmp += amp;
            amp *= persistence;
            freq *= 2.0;
        }
        
        // Normalize
        return perlinSum / totalAmp;
    }
    
    // Domain warping for more organic patterns
    vec2 warp(vec2 p, float strength) {
        vec2 q = vec2(
            fbm(p + vec2(0.0, 1.0), 4, 0.5),
            fbm(p + vec2(5.2, 1.3), 4, 0.5)
        );
        
        return p + strength * q;
    }
    
    // Ridge noise - creates sharp ridges and valleys
    float ridge(float h) {
        h = 1.0 - abs(h);
        return h * h;
    }
    
    // Enhanced FBM with domain warping and optional ridge formation
    float enhancedFbm(vec2 p, int octaves, float persistence, float warpStrength, bool useRidges) {
        // Apply domain warping for more organic look
        vec2 warped = warp(p, warpStrength);
        
        float perlinSum = 0.0;
        float amp = 1.0;
        float freq = 1.0;
        float totalAmp = 0.0;
        
        // Add several octaves of noise
        for(int i = 0; i < 10; i++) {
            if (i >= octaves) break;
            
            float n = noise(warped * freq);
            
            // Apply ridge transformation if enabled
            if (useRidges) {
                n = ridge(n);
            }
            
            perlinSum += amp * n;
            totalAmp += amp;
            amp *= persistence;
            freq *= 2.0;
        }
        
        // Normalize
        return perlinSum / totalAmp;
    }
    
    // Enhanced Voronoi function with multiple layers and organic features
    float organicVoronoi(vec2 p, int layers, float warpAmount, float depth, bool showEdges) {
        // Apply domain warping for more organic cell shapes
        vec2 warped = warp(p, warpAmount);
        
        float result = 0.0;
        float layerWeight = 1.0;
        float totalWeight = 0.0;
        
        // Process multiple layers of Voronoi for more complexity
        for (int layer = 0; layer < 3; layer++) {
            if (layer >= layers) break;
            
            // Scale and offset each layer for variety
            vec2 layerP = warped * (1.0 + float(layer) * 0.5) + vec2(float(layer) * 7.89, float(layer) * 2.93);
            
            vec2 n = floor(layerP);
            vec2 f = fract(layerP);
            
            // For storing closest and second closest distances
            float minDist = 8.0;
            float secondMinDist = 8.0;
            vec2 minPoint = vec2(0.0);
            vec2 minCell = vec2(0.0);
            
            // Check neighboring cells
            for(int j = -1; j <= 1; j++) {
                for(int i = -1; i <= 1; i++) {
                    vec2 cell = vec2(float(i), float(j));
                    
                    // Create point within the cell
                    vec2 cellPoint = hash2(n + cell);
                    
                    // Animate the point
                    cellPoint = 0.5 + 0.5 * sin(iTime * voronoiSpeed * animationSpeed + 6.2831 * cellPoint);
                    
                    // Calculate distance to the point
                    vec2 r = cell + cellPoint - f;
                    float d = dot(r, r); // Squared distance
                    
                    // Keep track of closest and second closest
                    if (d < minDist) {
                        secondMinDist = minDist;
                        minDist = d;
                        minPoint = cellPoint;
                        minCell = cell;
                    } else if (d < secondMinDist) {
                        secondMinDist = d;
                    }
                }
            }
            
            // Calculate final value for this layer
            float layerValue;
            
            if (showEdges) {
                // Edge detection - distance to cell boundary
                float edge = sqrt(secondMinDist) - sqrt(minDist);
                
                // Sharpen edges
                edge = smoothstep(0.0, 0.05, edge);
                
                // Invert for cell edges
                layerValue = 1.0 - edge;
            } else {
                // Use cell distance for a smoother look
                layerValue = sqrt(minDist);
                
                // Add some variation based on the cell's position
                float cellNoise = noise(minCell * 0.7 + minPoint + iTime * 0.1 * animationSpeed);
                layerValue = mix(layerValue, layerValue * (0.8 + 0.4 * cellNoise), 0.5);
            }
            
            // Add this layer to the result
            result += layerWeight * layerValue;
            totalWeight += layerWeight;
            
            // Reduce influence of subsequent layers
            layerWeight *= depth;
        }
        
        // Normalize result
        result /= totalWeight;
        
        // Apply contrast adjustment
        result = pow(result, voronoiContrast);
        
        return result;
    }

    // Get light positions
    vec3 getLightPosition(int index, float time) {
        float angle = float(index) * (2.0 * PI / float(lightCount)) + time * lightSpeed;
        float radius = 1.5;
        float height = sin(time * lightSpeed * 0.5 + float(index)) * 0.5;
        
        return vec3(radius * cos(angle), height, radius * sin(angle));
    }
    
    // Enhanced grain functions
    
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

    void main() {
        // Normalize UV coordinates
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        
        // Apply effect based on selected type
        float shape = 0.0;
        vec2 effectUV = uv;
        
        // Select effect
        if (effectType == 0) {
            // Original orb
            // Adjust UV to be from -1 to 1 with aspect ratio correction
            vec2 p = (effectUV * 2.0 - 1.0);
            p.x *= iResolution.x / iResolution.y;
            
            // Apply scale and offset
            p *= fractalScale;
            p += fractalOffset;
            
            // Create a pulsating orb
            float d = length(p);
            float pulse = 0.5 + 0.1 * sin(iTime * animationSpeed * 2.0);
            
            // Base orb shape
            float orbshape = smoothstep(pulse, pulse - 0.1, d);
            
            // Add internal glow and structure
            float innerGlow = smoothstep(pulse * 0.8, 0.0, d) * 0.5;
            
            // Add some swirls
            float angle = atan(p.y, p.x);
            float swirl = 0.15 * sin(angle * 8.0 + iTime * 3.0 * animationSpeed) * smoothstep(pulse, 0.0, d);
            
            shape = orbshape + innerGlow + swirl;
        } 
        else if (effectType == 1) {
            // ENHANCED Perlin landscape
            // Scale and animate UV
            vec2 p = effectUV * perlinScale;
            
            // Add movement based on time if auto-rotate is enabled
            if (autoRotate > 0.5) {
                // Create more complex movement patterns
                float timeScale = iTime * animationSpeed;
                p += vec2(
                    sin(timeScale * 0.5) * 0.3 + timeScale * 0.1,
                    cos(timeScale * 0.7) * 0.2 + timeScale * 0.05
                );
            }
            
            // Apply mouse influence for interactive exploration
            vec2 mousePos = smoothedMouse / iResolution.xy;
            mousePos = (mousePos * 2.0 - 1.0);
            mousePos.x *= iResolution.x / iResolution.y;
            
            if (mouseDown > 0.5) {
                // Allow user to "push" the noise around
                float mouseDist = length(p - mousePos * perlinScale);
                float mouseInfluence = exp(-mouseDist * 5.0) * 0.2;
                p += mousePos * mouseInfluence;
            }
            
            // Generate base terrain with domain warping
            bool useRidges = perlinRidges > 0.5;
            float terrain = enhancedFbm(p, perlinLayers, 0.5, perlinWarp, useRidges);
            
            // Add a second layer of detail with different parameters
            vec2 detailP = p * 2.0 + vec2(43.2, 17.9); // Offset to get different pattern
            float detail = enhancedFbm(detailP, perlinLayers + 1, 0.6, perlinWarp * 0.7, useRidges);
            
            // Combine layers with height-based blending
            float heightFactor = smoothstep(0.3, 0.7, terrain);
            terrain = mix(terrain, terrain * 0.8 + detail * 0.4, heightFactor);
            
            // Add some height variation based on position
            float heightVariation = sin(p.x * 0.2) * cos(p.y * 0.2) * 0.1;
            terrain += heightVariation;
            
            // Add dynamic elements - flowing "rivers" or "lava"
            float flow = sin(p.x * 10.0 + iTime * animationSpeed * 5.0) * 
                         sin(p.y * 8.0 + iTime * animationSpeed * 3.0);
            flow = smoothstep(0.7, 0.9, flow) * 0.15;
            
            // Apply height scaling
            terrain *= perlinHeight;
            
            // Add pulsing effect that's more pronounced in valleys
            float pulse = sin(iTime * animationSpeed * 2.0) * 0.1;
            terrain += pulse * (1.0 - terrain); // More effect in low areas
            
            // Add atmospheric fog effect in valleys
            float fog = smoothstep(0.4, 0.0, terrain) * 0.2 * 
                       (0.5 + 0.5 * sin(iTime * animationSpeed));
            terrain += fog;
            
            // Add the flow effect
            terrain += flow;
            
            shape = terrain;
        }
        else if (effectType == 2) {
            // Ripple effect
            vec2 p = (effectUV * 2.0 - 1.0);
            p.x *= iResolution.x / iResolution.y;
            
            // Distance from center
            float dist = length(p);
            
            // Create multiple ripples emanating from center
            float ripples = sin(dist * 15.0 - iTime * 2.0 * animationSpeed) * 0.5 + 0.5;
            
            // Apply decay based on distance
            ripples *= smoothstep(1.0, 0.2, dist);
            
            shape = ripples;
        }
        else if (effectType == 3) {
            // ENHANCED Voronoi pattern - more organic and moody
            vec2 p = effectUV * voronoiScale * fractalScale;
            
            // Add slow drift if auto-rotate is enabled
            if (autoRotate > 0.5) {
                float timeScale = iTime * animationSpeed * voronoiSpeed;
                p += vec2(
                    sin(timeScale * 0.3) * 0.2 + timeScale * 0.05,
                    cos(timeScale * 0.4) * 0.2 + timeScale * 0.03
                );
            }
            
            // Apply mouse influence for interactive exploration
            vec2 mousePos = smoothedMouse / iResolution.xy;
            mousePos = (mousePos * 2.0 - 1.0);
            mousePos.x *= iResolution.x / iResolution.y;
            
            if (mouseDown > 0.5) {
                // Allow user to "push" the cells around
                float mouseDist = length(p - mousePos * voronoiScale * fractalScale);
                float mouseInfluence = exp(-mouseDist * 3.0) * 0.3;
                p += mousePos * mouseInfluence;
            }
            
            // Generate organic Voronoi pattern
            bool showEdges = voronoiEdges > 0.5;
            float pattern = organicVoronoi(p, voronoiLayers, voronoiWarp, voronoiDepth, showEdges);
            
            // Add atmospheric depth
            float depth = fbm(p * 0.5, 3, 0.5);
            
            // Create depth-based fog effect
            float fog = smoothstep(0.4, 0.0, pattern) * 0.3 * (0.7 + 0.3 * sin(iTime * animationSpeed));
            
            // Add subtle pulsing glow in the valleys
            float pulse = sin(iTime * animationSpeed * 1.5) * 0.1;
            float glow = smoothstep(0.6, 0.0, pattern) * pulse;
            
            // Add flowing "energy" in the cell networks
            float flow = 0.0;
            if (showEdges) {
                flow = sin(p.x * 5.0 + iTime * animationSpeed * 3.0) * 
                       sin(p.y * 5.0 + iTime * animationSpeed * 2.0);
                flow = smoothstep(0.7, 0.9, flow) * 0.2 * pattern;
            }
            
            // Combine all effects
            pattern = mix(pattern, pattern * 0.8 + depth * 0.3, 0.4);
            pattern += fog + glow + flow;
            
            // Apply contrast adjustment
            pattern = pow(pattern, 1.2);
            
            shape = pattern;
        }
        else if (effectType == 4) {
            // NEW: Kaleidoscope effect
            vec2 p = effectUV * 2.0 - 1.0;
            p.x *= iResolution.x / iResolution.y;
            
            // Apply scale and offset
            p *= fractalScale;
            p += fractalOffset;
            
            // Get angle and distance from center
            float angle = atan(p.y, p.x);
            float dist = length(p);
            
            // Create kaleidoscope effect
            float segmentAngle = 2.0 * PI / float(kaleidoscopeSegments);
            angle = mod(angle, segmentAngle);
            angle = min(angle, segmentAngle - angle); // Mirror within segment
            
            // Transform back to Cartesian
            vec2 kUV = vec2(cos(angle), sin(angle)) * dist;
            
            // Add some animation to the pattern inside the kaleidoscope
            kUV += 0.1 * sin(dist * 10.0 - iTime * animationSpeed * 2.0);
            
            // Create a pattern within kaleidoscope
            float pattern = 0.5 + 0.5 * sin(kUV.x * 10.0) * sin(kUV.y * 10.0);
            pattern *= smoothstep(1.0, 0.8, dist); // Fade out toward edges
            
            shape = pattern;
        }
        else if (effectType == 5) {
            // NEW: Frequency Modulation (FM) synthesis-inspired pattern
            vec2 p = effectUV * 2.0 - 1.0;
            p.x *= iResolution.x / iResolution.y;
            
            // Apply scale and offset
            p *= fractalScale;
            p += fractalOffset;
            
            // Distance from center for modulation intensity
            float dist = length(p);
            
            // Carrier wave (base frequency)
            float carrierFreq = fmDensity;
            
            // Modulator wave (modulating frequency)
            float modFreq = fmDensity * 0.5;
            
            // Modulation index (how much modulation is applied)
            float modIndex = fmIntensity * 5.0;
            
            // Time variables for animation
            float carrierTime = iTime * animationSpeed;
            float modTime = iTime * animationSpeed * 0.7;
            
            // Calculate the modulator
            float modulator = sin(p.x * modFreq + modTime) * sin(p.y * modFreq + modTime) * modIndex;
            
            // Apply frequency modulation
            float signal = sin(p.x * carrierFreq + modulator + carrierTime) * 
                          sin(p.y * carrierFreq + modulator + carrierTime);
            
            // Normalize to 0.0-1.0 range
            signal = 0.5 + 0.5 * signal;
            
            // Add some distance-based attenuation
            signal *= smoothstep(1.0, 0.5, dist);
            
            shape = signal;
        }
        else if (effectType == 6) {
            // Fractal Julia set
            vec2 c = vec2(
                0.7885 * cos(iTime * animationSpeed * 0.4),
                0.7885 * sin(iTime * animationSpeed * 0.4)
            );
            
            vec2 z = (uv * 2.0 - 1.0) * 1.5;
            z.x *= iResolution.x / iResolution.y;
            z *= fractalScale;
            z += fractalOffset;
            
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
                // Logarithmic smooth iteration count
                float log_zn = log(dot(z, z)) * 0.5;
                float smoothed = iteration + 1.0 - log(log_zn / log(2.0)) / log(2.0);
                iteration = smoothed;
            }
            
            // Normalize
            shape = iteration / float(fractionalIterations);
        }
        else if (effectType == 7) {
            // Wave Grid
            // Adjust UV to be centered
            vec2 p = (uv * 2.0 - 1.0);
            p.x *= iResolution.x / iResolution.y;
            p *= fractalScale * 2.0;
            p += fractalOffset;
            
            // Create grid
            vec2 grid = fract(p * waveFrequency) - 0.5;
            
            // Animate grid with waves
            float waves = 0.0;
            
            // X-axis waves
            waves += sin(p.x * 5.0 + iTime * animationSpeed * 2.0) * waveAmplitude;
            
            // Y-axis waves
            waves += sin(p.y * 5.0 + iTime * animationSpeed * 2.0) * waveAmplitude;
            
            // Diagonal waves
            waves += sin((p.x + p.y) * 4.0 + iTime * animationSpeed * 3.0) * waveAmplitude;
            
            // Anti-diagonal waves
            waves += sin((p.x - p.y) * 4.0 + iTime * animationSpeed * 3.0) * waveAmplitude;
            
            // Calculate distance from grid lines
            float gridLines = max(
                smoothstep(0.05, 0.0, abs(grid.x) - (0.1 + waves * 0.1)),
                smoothstep(0.05, 0.0, abs(grid.y) - (0.1 + waves * 0.1))
            );
            
            // Add pulsating effect
            gridLines *= 0.8 + 0.2 * sin(iTime * animationSpeed * 5.0);
            
            shape = gridLines;
        }
        
        // Calculate light influence
        vec2 centeredUV = (uv * 2.0 - 1.0);
        centeredUV.x *= iResolution.x / iResolution.y;
        
        // Convert 2D position to 3D for light calculation
        vec3 pos = vec3(centeredUV.x, centeredUV.y, 0.0);
        float totalLight = 0.0;
        
        // Add contribution from each light
        for (int i = 0; i < 10; i++) {
            if (i >= lightCount) break;
            
            vec3 lightPos = getLightPosition(i, iTime);
            float dist = length(pos - lightPos);
            totalLight += lightIntensity / (1.0 + dist * dist * 2.0);
        }
        
        // Add mouse light
        vec2 mousePos = smoothedMouse / iResolution.xy;
        mousePos = (mousePos * 2.0 - 1.0);
        mousePos.x *= iResolution.x / iResolution.y;
        
        float mouseDist = length(centeredUV - mousePos);
        totalLight += lightIntensity * 2.0 / (1.0 + mouseDist * mouseDist * 4.0);
        
        // Add slight ambient light
        totalLight += 0.2;
        
        // Apply light balance when bloom is active
        if (useBloom > 0.5) {
            totalLight *= lightBloomBalance;
        }
        
        // Create a more complex color mix using all three colors
        vec3 finalColor = mix(primaryColor, secondaryColor, shape);
        
        // Add accent color to highlights
        float highlight = pow(shape, 3.0);
        finalColor = mix(finalColor, accentColor, highlight * 0.5);
        
        // Apply light effect
        finalColor *= totalLight * (shape + 0.2);
        
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
    "Original Orb": 0,
    "Perlin Noise": 1,
    Ripple: 2,
    Voronoi: 3,
    Kaleidoscope: 4,
    "Frequency Modulation": 5,
    "Fractal Julia": 6,
    "Wave Grid": 7
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
  waveGridFolder.domElement.style.display = "none";
  kaleidoscopeFolder.domElement.style.display = "none";
  fmFolder.domElement.style.display = "none";
  perlinFolder.domElement.style.display = "none";
  voronoiFolder.domElement.style.display = "none";

  // Show the relevant folder based on the effect type
  if (effectType === 6) {
    juliaFolder.domElement.style.display = "block";
  } else if (effectType === 7) {
    waveGridFolder.domElement.style.display = "block";
  } else if (effectType === 4) {
    kaleidoscopeFolder.domElement.style.display = "block";
  } else if (effectType === 5) {
    fmFolder.domElement.style.display = "block";
  } else if (effectType === 1) {
    perlinFolder.domElement.style.display = "block";
  } else if (effectType === 3) {
    voronoiFolder.domElement.style.display = "block";
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

// Enhanced Perlin noise controls
const perlinFolder = gui.addFolder("Perlin Noise Controls");
perlinFolder.add(params, "perlinLayers", 1, 6, 1).onChange((value) => {
  shaderMaterial.uniforms.perlinLayers.value = value;
});
perlinFolder.add(params, "perlinScale", 0.5, 10.0).onChange((value) => {
  shaderMaterial.uniforms.perlinScale.value = value;
});
perlinFolder.add(params, "perlinWarp", 0.0, 1.0).onChange((value) => {
  shaderMaterial.uniforms.perlinWarp.value = value;
});
perlinFolder.add(params, "perlinHeight", 0.5, 2.0).onChange((value) => {
  shaderMaterial.uniforms.perlinHeight.value = value;
});
perlinFolder.add(params, "perlinRidges").onChange((value) => {
  shaderMaterial.uniforms.perlinRidges.value = value ? 1.0 : 0.0;
});

// Enhanced Voronoi controls
const voronoiFolder = gui.addFolder("Voronoi Controls");
voronoiFolder.add(params, "voronoiScale", 1.0, 10.0).onChange((value) => {
  shaderMaterial.uniforms.voronoiScale.value = value;
});
voronoiFolder.add(params, "voronoiLayers", 1, 3, 1).onChange((value) => {
  shaderMaterial.uniforms.voronoiLayers.value = value;
});
voronoiFolder.add(params, "voronoiWarp", 0.0, 1.0).onChange((value) => {
  shaderMaterial.uniforms.voronoiWarp.value = value;
});
voronoiFolder.add(params, "voronoiDepth", 0.1, 1.0).onChange((value) => {
  shaderMaterial.uniforms.voronoiDepth.value = value;
});
voronoiFolder.add(params, "voronoiContrast", 0.5, 2.0).onChange((value) => {
  shaderMaterial.uniforms.voronoiContrast.value = value;
});
voronoiFolder.add(params, "voronoiSpeed", 0.1, 2.0).onChange((value) => {
  shaderMaterial.uniforms.voronoiSpeed.value = value;
});
voronoiFolder.add(params, "voronoiEdges").onChange((value) => {
  shaderMaterial.uniforms.voronoiEdges.value = value ? 1.0 : 0.0;
});

// Create folders for effect-specific controls
const juliaFolder = gui.addFolder("Julia Set Controls");
juliaFolder.add(params, "fractionalIterations", 1, 20, 1).onChange((value) => {
  shaderMaterial.uniforms.fractionalIterations.value = value;
});

const waveGridFolder = gui.addFolder("Wave Grid Controls");
waveGridFolder.add(params, "waveAmplitude", 0.0, 0.5).onChange((value) => {
  shaderMaterial.uniforms.waveAmplitude.value = value;
});
waveGridFolder.add(params, "waveFrequency", 1.0, 20.0).onChange((value) => {
  shaderMaterial.uniforms.waveFrequency.value = value;
});

// Controls for new effects
const kaleidoscopeFolder = gui.addFolder("Kaleidoscope Controls");
kaleidoscopeFolder
  .add(params, "kaleidoscopeSegments", 3, 20, 1)
  .onChange((value) => {
    shaderMaterial.uniforms.kaleidoscopeSegments.value = value;
  });

const fmFolder = gui.addFolder("Frequency Modulation Controls");
fmFolder.add(params, "fmDensity", 1.0, 50.0).onChange((value) => {
  shaderMaterial.uniforms.fmDensity.value = value;
});
fmFolder.add(params, "fmIntensity", 0.0, 2.0).onChange((value) => {
  shaderMaterial.uniforms.fmIntensity.value = value;
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
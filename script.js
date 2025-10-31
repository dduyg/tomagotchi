// ========================================
// PRELOADER
// ========================================
class SliderLoadingManager {
  constructor() {
    this.overlay = null;
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    this.startTime = null;
    this.duration = 3000;
    this.createLoadingScreen();
  }

  createLoadingScreen() {
    this.overlay = document.createElement("div");
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000000;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    this.canvas = document.createElement("canvas");
    this.canvas.width = 300;
    this.canvas.height = 300;

    this.ctx = this.canvas.getContext("2d");
    this.overlay.appendChild(this.canvas);
    document.body.appendChild(this.overlay);

    this.startAnimation();
  }

  startAnimation() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    let time = 0;
    let lastTime = 0;

    const dotRings = [
      { radius: 20, count: 8 },
      { radius: 35, count: 12 },
      { radius: 50, count: 16 },
      { radius: 65, count: 20 },
      { radius: 80, count: 24 }
    ];

    const colors = {
      primary: "#ffffff",
      accent: "#dddddd"
    };

    const easeInOutSine = (t) => {
      return -(Math.cos(Math.PI * t) - 1) / 2;
    };

    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const smoothstep = (edge0, edge1, x) => {
      const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    };

    const hexToRgb = (hex) => {
      if (hex.startsWith("#")) {
        return [
          parseInt(hex.slice(1, 3), 16),
          parseInt(hex.slice(3, 5), 16),
          parseInt(hex.slice(5, 7), 16)
        ];
      }
      const match = hex.match(/\d+/g);
      return match
        ? [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])]
        : [255, 255, 255];
    };

    const interpolateColor = (color1, color2, t, opacity = 1) => {
      const rgb1 = hexToRgb(color1);
      const rgb2 = hexToRgb(color2);
      const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t);
      const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t);
      const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const animate = (timestamp) => {
      if (!this.startTime) this.startTime = timestamp;

      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      const rgb = hexToRgb(colors.primary);
      this.ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.9)`;
      this.ctx.fill();

      dotRings.forEach((ring, ringIndex) => {
        for (let i = 0; i < ring.count; i++) {
          const angle = (i / ring.count) * Math.PI * 2;
          const pulseTime = time * 2 - ringIndex * 0.4;
          const radiusPulse =
            easeInOutSine((Math.sin(pulseTime) + 1) / 2) * 6 - 3;
          const x = centerX + Math.cos(angle) * (ring.radius + radiusPulse);
          const y = centerY + Math.sin(angle) * (ring.radius + radiusPulse);

          const opacityPhase = (Math.sin(pulseTime + i * 0.2) + 1) / 2;
          const opacityBase = 0.3 + easeInOutSine(opacityPhase) * 0.7;
          const highlightPhase = (Math.sin(pulseTime) + 1) / 2;
          const highlightIntensity = easeInOutCubic(highlightPhase);

          this.ctx.beginPath();
          this.ctx.arc(x, y, 2, 0, Math.PI * 2);
          const colorBlend = smoothstep(0.2, 0.8, highlightIntensity);
          this.ctx.fillStyle = interpolateColor(
            colors.primary,
            colors.accent,
            colorBlend,
            opacityBase
          );
          this.ctx.fill();
        }
      });

      if (timestamp - this.startTime >= this.duration) {
        this.complete();
        return;
      }

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  complete() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.overlay) {
      this.overlay.style.opacity = "0";
      this.overlay.style.transition = "opacity 0.8s ease";
      setTimeout(() => {
        this.overlay?.remove();

        setTimeout(() => {
          const sliderWrapper = document.querySelector(".slider-wrapper");
          if (sliderWrapper) {
            sliderWrapper.classList.add("loaded");
          }
        }, 500);
      }, 800);
    }
  }
}

// Initialize preloader
document.addEventListener("DOMContentLoaded", function () {
  const loadingManager = new SliderLoadingManager();
});

// ========================================
// VISUAL EFFECTS SLIDER CONFIGURATION
// ========================================

const SLIDER_CONFIG = {
  // Core settings
  settings: {
    // Timing settings
    transitionDuration: 2.5,
    autoSlideSpeed: 5000,
    // Current state
    currentEffect: "glass",
    currentEffectPreset: "Default",
    // Global settings that affect all effects
    globalIntensity: 1.0,
    speedMultiplier: 1.0,
    distortionStrength: 1.0,
    colorEnhancement: 1.0,
    // Effect-specific settings (will be overridden by presets)
    glassRefractionStrength: 1.0,
    glassChromaticAberration: 1.0,
    glassBubbleClarity: 1.0,
    glassEdgeGlow: 1.0,
    glassLiquidFlow: 1.0,
    frostIntensity: 1.5,
    frostCrystalSize: 1.0,
    frostIceCoverage: 1.0,
    frostTemperature: 1.0,
    frostTexture: 1.0,
    rippleFrequency: 25.0,
    rippleAmplitude: 0.08,
    rippleWaveSpeed: 1.0,
    rippleRippleCount: 1.0,
    rippleDecay: 1.0,
    plasmaIntensity: 1.2,
    plasmaSpeed: 0.8,
    plasmaEnergyIntensity: 0.4,
    plasmaContrastBoost: 0.3,
    plasmaTurbulence: 1.0,
    timeshiftDistortion: 1.6,
    timeshiftBlur: 1.5,
    timeshiftFlow: 1.4,
    timeshiftChromatic: 1.5,
    timeshiftTurbulence: 1.4
  },
  // Effect-specific presets
  effectPresets: {
    glass: {
      Subtle: {
        glassRefractionStrength: 0.6,
        glassChromaticAberration: 0.5,
        glassBubbleClarity: 1.3,
        glassEdgeGlow: 0.7,
        glassLiquidFlow: 0.8
      },
      Default: {
        glassRefractionStrength: 1.0,
        glassChromaticAberration: 1.0,
        glassBubbleClarity: 1.0,
        glassEdgeGlow: 1.0,
        glassLiquidFlow: 1.0
      },
      Crystal: {
        glassRefractionStrength: 1.5,
        glassChromaticAberration: 1.8,
        glassBubbleClarity: 0.7,
        glassEdgeGlow: 1.4,
        glassLiquidFlow: 0.5
      },
      Liquid: {
        glassRefractionStrength: 0.8,
        glassChromaticAberration: 0.4,
        glassBubbleClarity: 1.2,
        glassEdgeGlow: 0.8,
        glassLiquidFlow: 1.8
      }
    },
    frost: {
      Light: {
        frostIntensity: 0.8,
        frostCrystalSize: 1.3,
        frostIceCoverage: 0.6,
        frostTemperature: 0.7,
        frostTexture: 0.8
      },
      Default: {
        frostIntensity: 1.5,
        frostCrystalSize: 1.0,
        frostIceCoverage: 1.0,
        frostTemperature: 1.0,
        frostTexture: 1.0
      },
      Heavy: {
        frostIntensity: 2.2,
        frostCrystalSize: 0.7,
        frostIceCoverage: 1.4,
        frostTemperature: 1.5,
        frostTexture: 1.3
      },
      Arctic: {
        frostIntensity: 2.8,
        frostCrystalSize: 0.5,
        frostIceCoverage: 1.8,
        frostTemperature: 2.0,
        frostTexture: 1.6
      }
    },
    ripple: {
      Gentle: {
        rippleFrequency: 15.0,
        rippleAmplitude: 0.05,
        rippleWaveSpeed: 0.7,
        rippleRippleCount: 0.8,
        rippleDecay: 1.2
      },
      Default: {
        rippleFrequency: 25.0,
        rippleAmplitude: 0.08,
        rippleWaveSpeed: 1.0,
        rippleRippleCount: 1.0,
        rippleDecay: 1.0
      },
      Strong: {
        rippleFrequency: 35.0,
        rippleAmplitude: 0.12,
        rippleWaveSpeed: 1.4,
        rippleRippleCount: 1.3,
        rippleDecay: 0.8
      },
      Tsunami: {
        rippleFrequency: 45.0,
        rippleAmplitude: 0.18,
        rippleWaveSpeed: 1.8,
        rippleRippleCount: 1.6,
        rippleDecay: 0.6
      }
    },
    plasma: {
      Calm: {
        plasmaIntensity: 0.8,
        plasmaSpeed: 0.5,
        plasmaEnergyIntensity: 0.2,
        plasmaContrastBoost: 0.1,
        plasmaTurbulence: 0.6
      },
      Default: {
        plasmaIntensity: 1.2,
        plasmaSpeed: 0.8,
        plasmaEnergyIntensity: 0.4,
        plasmaContrastBoost: 0.3,
        plasmaTurbulence: 1.0
      },
      Storm: {
        plasmaIntensity: 1.8,
        plasmaSpeed: 1.3,
        plasmaEnergyIntensity: 0.7,
        plasmaContrastBoost: 0.5,
        plasmaTurbulence: 1.5
      },
      Nuclear: {
        plasmaIntensity: 2.5,
        plasmaSpeed: 1.8,
        plasmaEnergyIntensity: 1.0,
        plasmaContrastBoost: 0.8,
        plasmaTurbulence: 2.0
      }
    },
    timeshift: {
      Subtle: {
        timeshiftDistortion: 0.5,
        timeshiftBlur: 0.6,
        timeshiftFlow: 0.5,
        timeshiftChromatic: 0.4,
        timeshiftTurbulence: 0.6
      },
      Default: {
        timeshiftDistortion: 1.6,
        timeshiftBlur: 1.5,
        timeshiftFlow: 1.4,
        timeshiftChromatic: 1.5,
        timeshiftTurbulence: 1.4
      },
      Intense: {
        timeshiftDistortion: 2.2,
        timeshiftBlur: 2.0,
        timeshiftFlow: 2.0,
        timeshiftChromatic: 2.2,
        timeshiftTurbulence: 2.0
      },
      Dreamlike: {
        timeshiftDistortion: 2.8,
        timeshiftBlur: 2.5,
        timeshiftFlow: 2.5,
        timeshiftChromatic: 2.6,
        timeshiftTurbulence: 2.5
      }
    }
  }
};
// ========================================
// MAIN SLIDER CODE STARTS HERE
// ========================================
import * as THREE from "https://esm.sh/three";
import { Pane } from "https://cdn.skypack.dev/tweakpane@4.0.4";
let currentSlideIndex = 0;
let isTransitioning = false;
let shaderMaterial, renderer, scene, camera;
let slideTextures = [];
let texturesLoaded = false;
let autoSlideTimer = null;
let progressAnimation = null;
let sliderEnabled = false;
let pane = null;
let isApplyingPreset = false;
// UI elements
let effectFolders = {};
let currentEffectFolder = null;
const SLIDE_DURATION = () => SLIDER_CONFIG.settings.autoSlideSpeed;
const PROGRESS_UPDATE_INTERVAL = 50;
const TRANSITION_DURATION = () => SLIDER_CONFIG.settings.transitionDuration;
const slides = [
  {
    title: "Ethereal Glow",
    media: "https://assets.codepen.io/7558/orange-portrait-001.jpg"
  },
  {
    title: "Rose Mirage",
    media: "https://assets.codepen.io/7558/orange-portrait-002.jpg"
  },
  {
    title: "Velvet Mystique",
    media: "https://assets.codepen.io/7558/orange-portrait-003.jpg"
  },
  {
    title: "Golden Hour",
    media: "https://assets.codepen.io/7558/orange-portrait-004.jpg"
  },
  {
    title: "Midnight Dreams",
    media: "https://assets.codepen.io/7558/orange-portrait-005.jpg"
  },
  {
    title: "Silver Light",
    media: "https://assets.codepen.io/7558/orange-portrait-006.jpg"
  }
];
// Touch support variables
let touchStartX = 0;
let touchEndX = 0;
const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
const fragmentShader = `
      uniform sampler2D uTexture1;
      uniform sampler2D uTexture2;
      uniform float uProgress;
      uniform vec2 uResolution;
      uniform vec2 uTexture1Size;
      uniform vec2 uTexture2Size;
      uniform int uEffectType;
      
      // Global settings uniforms
      uniform float uGlobalIntensity;
      uniform float uSpeedMultiplier;
      uniform float uDistortionStrength;
      uniform float uColorEnhancement;
      
      // Glass uniforms
      uniform float uGlassRefractionStrength;
      uniform float uGlassChromaticAberration;
      uniform float uGlassBubbleClarity;
      uniform float uGlassEdgeGlow;
      uniform float uGlassLiquidFlow;
      
      // Frost uniforms
      uniform float uFrostIntensity;
      uniform float uFrostCrystalSize;
      uniform float uFrostIceCoverage;
      uniform float uFrostTemperature;
      uniform float uFrostTexture;
      
      // Ripple uniforms
      uniform float uRippleFrequency;
      uniform float uRippleAmplitude;
      uniform float uRippleWaveSpeed;
      uniform float uRippleRippleCount;
      uniform float uRippleDecay;
      
      // Plasma uniforms
      uniform float uPlasmaIntensity;
      uniform float uPlasmaSpeed;
      uniform float uPlasmaEnergyIntensity;
      uniform float uPlasmaContrastBoost;
      uniform float uPlasmaTurbulence;
      
      // Timeshift uniforms
      uniform float uTimeshiftDistortion;
      uniform float uTimeshiftBlur;
      uniform float uTimeshiftFlow;
      uniform float uTimeshiftChromatic;
      uniform float uTimeshiftTurbulence;
      
      varying vec2 vUv;

      vec2 getCoverUV(vec2 uv, vec2 textureSize) {
        vec2 s = uResolution / textureSize;
        float scale = max(s.x, s.y);
        vec2 scaledSize = textureSize * scale;
        vec2 offset = (uResolution - scaledSize) * 0.5;
        return (uv * uResolution - offset) / scaledSize;
      }

      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float smoothNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        return mix(
          mix(noise(i), noise(i + vec2(1.0, 0.0)), f.x),
          mix(noise(i + vec2(0.0, 1.0)), noise(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      float rand(vec2 uv) {
        float a = dot(uv, vec2(92., 80.));
        float b = dot(uv, vec2(41., 62.));
        float x = sin(a) + cos(b) * 51.;
        return fract(x);
      }

      vec4 glassEffect(vec2 uv, float progress) {
        float glassStrength = 0.08 * uGlassRefractionStrength * uDistortionStrength * uGlobalIntensity;
        float chromaticAberration = 0.02 * uGlassChromaticAberration * uGlobalIntensity;
        float waveDistortion = 0.025 * uDistortionStrength;
        float clearCenterSize = 0.3 * uGlassBubbleClarity;
        float surfaceRipples = 0.004 * uDistortionStrength;
        float liquidFlow = 0.015 * uGlassLiquidFlow * uSpeedMultiplier;
        float rimLightWidth = 0.05;
        float glassEdgeWidth = 0.025;
        
        float brightnessPhase = smoothstep(0.8, 1.0, progress);
        float rimLightIntensity = 0.08 * (1.0 - brightnessPhase) * uGlassEdgeGlow * uGlobalIntensity;
        float glassEdgeOpacity = 0.06 * (1.0 - brightnessPhase) * uGlassEdgeGlow;

        vec2 center = vec2(0.5, 0.5);
        vec2 p = uv * uResolution;
        
        vec2 uv1 = getCoverUV(uv, uTexture1Size);
        vec2 uv2_base = getCoverUV(uv, uTexture2Size);
        
        float maxRadius = length(uResolution) * 0.85;
        // FIX: Start completely off-screen at progress 0
        float bubbleRadius = progress * maxRadius;
        vec2 sphereCenter = center * uResolution;
        
        float dist = length(p - sphereCenter);
        float normalizedDist = dist / max(bubbleRadius, 0.001);
        vec2 direction = (dist > 0.0) ? (p - sphereCenter) / dist : vec2(0.0);
        float inside = smoothstep(bubbleRadius + 3.0, bubbleRadius - 3.0, dist);
        
        float distanceFactor = smoothstep(clearCenterSize, 1.0, normalizedDist);
        float time = progress * 5.0 * uSpeedMultiplier;
        
        vec2 liquidSurface = vec2(
          smoothNoise(uv * 100.0 + time * 0.3),
          smoothNoise(uv * 100.0 + time * 0.2 + 50.0)
        ) - 0.5;
        liquidSurface *= surfaceRipples * distanceFactor;

        vec2 distortedUV = uv2_base;
        if (inside > 0.0) {
          float refractionOffset = glassStrength * pow(distanceFactor, 1.5);
          vec2 flowDirection = normalize(direction + vec2(sin(time), cos(time * 0.7)) * 0.3);
          distortedUV -= flowDirection * refractionOffset;

          float wave1 = sin(normalizedDist * 22.0 - time * 3.5);
          float wave2 = sin(normalizedDist * 35.0 + time * 2.8) * 0.7;
          float wave3 = sin(normalizedDist * 50.0 - time * 4.2) * 0.5;
          float combinedWave = (wave1 + wave2 + wave3) / 3.0;
          
          float waveOffset = combinedWave * waveDistortion * distanceFactor;
          distortedUV -= direction * waveOffset + liquidSurface;

          vec2 flowOffset = vec2(
            sin(time + normalizedDist * 10.0),
            cos(time * 0.8 + normalizedDist * 8.0)
          ) * liquidFlow * distanceFactor * inside;
          distortedUV += flowOffset;
        }

        vec4 newImg;
        if (inside > 0.0) {
          float aberrationOffset = chromaticAberration * pow(distanceFactor, 1.2);
          
          vec2 uv_r = distortedUV + direction * aberrationOffset * 1.2;
          vec2 uv_g = distortedUV + direction * aberrationOffset * 0.2;
          vec2 uv_b = distortedUV - direction * aberrationOffset * 0.8;

          float r = texture2D(uTexture2, uv_r).r;
          float g = texture2D(uTexture2, uv_g).g;
          float b = texture2D(uTexture2, uv_b).b;
          newImg = vec4(r, g, b, 1.0);
        } else {
          newImg = texture2D(uTexture2, uv2_base);
        }

        if (inside > 0.0 && rimLightIntensity > 0.0) {
          float rim = smoothstep(1.0 - rimLightWidth, 1.0, normalizedDist) *
                      (1.0 - smoothstep(1.0, 1.01, normalizedDist));
          newImg.rgb += rim * rimLightIntensity;

          float edge = smoothstep(1.0 - glassEdgeWidth, 1.0, normalizedDist) *
                       (1.0 - smoothstep(1.0, 1.01, normalizedDist));
          newImg.rgb = mix(newImg.rgb, vec3(1.0), edge * glassEdgeOpacity);
        }
        
        // Apply color enhancement
        newImg.rgb = mix(newImg.rgb, newImg.rgb * 1.2, (uColorEnhancement - 1.0) * 0.5);
        
        vec4 currentImg = texture2D(uTexture1, uv1);
        
        if (progress > 0.95) {
          vec4 pureNewImg = texture2D(uTexture2, uv2_base);
          float endTransition = (progress - 0.95) / 0.05;
          newImg = mix(newImg, pureNewImg, endTransition);
        }
        
        return mix(currentImg, newImg, inside);
      }

      vec4 frostEffect(vec2 uv, float progress) {
        vec4 currentImg = texture2D(uTexture1, getCoverUV(uv, uTexture1Size));
        vec4 newImg = texture2D(uTexture2, getCoverUV(uv, uTexture2Size));
        
        float effectiveIntensity = uFrostIntensity * uGlobalIntensity;
        float crystalScale = 80.0 / uFrostCrystalSize;
        float iceScale = 40.0 / uFrostCrystalSize;
        float temperatureEffect = uFrostTemperature;
        
        float frost1 = smoothNoise(uv * crystalScale * uFrostTexture);
        float frost2 = smoothNoise(uv * iceScale + 50.0) * 0.7;
        float frost3 = smoothNoise(uv * (crystalScale * 2.0) + 100.0) * 0.3;
        float frost = (frost1 + frost2 + frost3) / 2.0;
        
        float icespread = smoothNoise(uv * 25.0 / uFrostCrystalSize + 200.0);
        
        vec2 rnd = vec2(
          rand(uv + frost * 0.1), 
          rand(uv + frost * 0.1 + 0.5)
        );
        
        // Clamp ice coverage to prevent numerical instability
        float clampedIceCoverage = clamp(uFrostIceCoverage, 0.1, 2.5);
        float size = mix(progress, sqrt(progress), 0.5) * 1.12 * clampedIceCoverage + 0.0000001;
        
        // Prevent lens.y from becoming too extreme by clamping the power
        float lensY = clamp(pow(size, clamp(4.0, 1.5, 6.0)) / 2.0, size * 0.1, size * 8.0);
        vec2 lens = vec2(size, lensY);
        
        float dist = distance(uv, vec2(0.5, 0.5));
        float vignette = pow(1.0 - smoothstep(lens.x, lens.y, dist), 2.0);
        
        float frostyness = 0.8 * effectiveIntensity * uDistortionStrength;
        rnd *= frost * vignette * frostyness * (1.0 - floor(vignette));
        
        vec4 regular = newImg;
        vec4 frozen = texture2D(uTexture2, getCoverUV(uv + rnd * 0.06, uTexture2Size));
        
        // Temperature-based color shift (clamped to prevent extreme values)
        float tempShift = clamp(temperatureEffect * 0.15, 0.0, 0.3);
        frozen *= vec4(
          clamp(0.85 + tempShift, 0.7, 1.2),
          clamp(0.9, 0.8, 1.0),
          clamp(1.2 - tempShift, 0.8, 1.3),
          1.0
        );
        // Reduced temperature mixing effect
        float tempMixStrength = clamp(0.1 * temperatureEffect, 0.0, 0.25);
        frozen = mix(frozen, vec4(0.9, 0.95, 1.1, 1.0), tempMixStrength);
        
        float frostMask = smoothstep(icespread * 0.8, 1.0, pow(vignette, 1.5));
        vec4 frostResult = mix(frozen, regular, frostMask);
        
        // Adjust color transition timing based on frost intensity
        float transitionStart = mix(0.85, 0.7, clamp(effectiveIntensity - 1.0, 0.0, 1.0));
        float colorTransition = smoothstep(transitionStart, 1.0, progress);
        vec4 finalFrost = mix(frostResult, regular, colorTransition);
        
        // Apply color enhancement
        finalFrost.rgb = mix(finalFrost.rgb, finalFrost.rgb * 1.2, (uColorEnhancement - 1.0) * 0.5);
        
        // Extend the blend all the way to 100% and smooth the final transition
        float overallBlend = smoothstep(0.0, 1.0, progress);
        
        // Add final cleanup transition for the last 5%
        if (progress > 0.95) {
          float endTransition = (progress - 0.95) / 0.05;
          finalFrost = mix(finalFrost, newImg, endTransition * 0.5);
        }
        
        return mix(currentImg, finalFrost, overallBlend);
      }

      vec4 rippleEffect(vec2 uv, float progress) {
        vec4 currentImg = texture2D(uTexture1, getCoverUV(uv, uTexture1Size));
        vec4 newImg = texture2D(uTexture2, getCoverUV(uv, uTexture2Size));
        
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(uv, center);
        float maxDist = 0.8;
        
        float effectiveSpeed = uRippleWaveSpeed * uSpeedMultiplier;
        float effectiveAmplitude = uRippleAmplitude * uDistortionStrength * uGlobalIntensity;
        float effectiveDecay = uRippleDecay;
        
        float waveRadius = progress * maxDist * 1.5 * effectiveSpeed;
        
        float ripple1 = sin((dist - waveRadius) * uRippleFrequency) * exp(-abs(dist - waveRadius) * 8.0 * effectiveDecay);
        float ripple2 = sin((dist - waveRadius * 0.7) * uRippleFrequency * 1.3) * 
                       exp(-abs(dist - waveRadius * 0.7) * 6.0 * effectiveDecay) * 0.6 * uRippleRippleCount;
        float ripple3 = sin((dist - waveRadius * 0.4) * uRippleFrequency * 1.8) * 
                       exp(-abs(dist - waveRadius * 0.4) * 4.0 * effectiveDecay) * 0.3 * uRippleRippleCount;
        
        float combinedRipple = (ripple1 + ripple2 + ripple3) * effectiveAmplitude;
        
        vec2 normal = normalize(uv - center);
        vec2 distortedUV = getCoverUV(uv + normal * combinedRipple, uTexture2Size);
        
        vec4 distortedImg = texture2D(uTexture2, distortedUV);
        
        float fadeEdge = smoothstep(maxDist, maxDist * 0.9, dist);
        vec4 rippleResult = mix(newImg, distortedImg, fadeEdge);
        
        float mask = smoothstep(0.0, 0.3, progress) * (1.0 - smoothstep(0.7, 1.0, progress));
        rippleResult = mix(newImg, rippleResult, mask);
        
        // Apply color enhancement
        rippleResult.rgb = mix(rippleResult.rgb, rippleResult.rgb * 1.2, (uColorEnhancement - 1.0) * 0.5);
        
        float transition = smoothstep(0.0, 1.0, progress);
        return mix(currentImg, rippleResult, transition);
      }

      vec4 plasmaEffect(vec2 uv, float progress) {
        vec4 currentImg = texture2D(uTexture1, getCoverUV(uv, uTexture1Size));
        vec4 newImg = texture2D(uTexture2, getCoverUV(uv, uTexture2Size));
        
        float effectiveSpeed = uPlasmaSpeed * uSpeedMultiplier;
        float effectiveIntensity = uPlasmaIntensity * uGlobalIntensity;
        float time = progress * 8.0 * effectiveSpeed;
        
        float plasma1 = sin(uv.x * 10.0 + time) * cos(uv.y * 8.0 + time * 0.7);
        float plasma2 = sin((uv.x + uv.y) * 12.0 + time * 1.3) * cos((uv.x - uv.y) * 15.0 + time * 0.9);
        float plasma3 = sin(length(uv - vec2(0.5)) * 20.0 + time * 1.8);
        
        float turbulence1 = smoothNoise(uv * 15.0 * uPlasmaTurbulence + vec2(time * 0.5, time * 0.3));
        float turbulence2 = smoothNoise(uv * 25.0 * uPlasmaTurbulence + vec2(time * 0.8, -time * 0.4)) * 0.7;
        float turbulence3 = smoothNoise(uv * 40.0 * uPlasmaTurbulence + vec2(-time * 0.6, time * 0.9)) * 0.4;
        
        float combinedTurbulence = (turbulence1 + turbulence2 + turbulence3) / 2.1;
        
        float plasma = (plasma1 + plasma2 + plasma3) * 0.333 + combinedTurbulence * 0.5;
        plasma = sin(plasma * 3.14159);
        
        float plasmaPhase = smoothstep(0.0, 0.3, progress) * (1.0 - smoothstep(0.7, 1.0, progress));
        
        vec2 electricField = vec2(
          sin(plasma * 6.28 + time) * 0.02,
          cos(plasma * 4.71 + time * 1.1) * 0.02
        ) * effectiveIntensity * plasmaPhase * uDistortionStrength;
        
        vec2 flowField1 = vec2(
          smoothNoise(uv * 8.0 + time * 0.4),
          smoothNoise(uv * 8.0 + time * 0.4 + 100.0)
        ) - 0.5;
        
        vec2 flowField2 = vec2(
          smoothNoise(uv * 16.0 + time * 0.6 + 200.0),
          smoothNoise(uv * 16.0 + time * 0.6 + 300.0)
        ) - 0.5;
        
        flowField1 *= 0.015 * effectiveIntensity * plasmaPhase * uDistortionStrength;
        flowField2 *= 0.008 * effectiveIntensity * plasmaPhase * uDistortionStrength;
        
        vec2 totalDistortion = electricField + flowField1 + flowField2;
        
        vec2 distortedUV1 = getCoverUV(uv + totalDistortion, uTexture1Size);
        vec2 distortedUV2 = getCoverUV(uv + totalDistortion, uTexture2Size);
        
        vec4 distortedCurrentImg = texture2D(uTexture1, distortedUV1);
        vec4 distortedNewImg = texture2D(uTexture2, distortedUV2);
        
        float energyMask = abs(plasma) * plasmaPhase * effectiveIntensity;
        
        vec4 blendedDistorted = mix(distortedCurrentImg, distortedNewImg, progress);
        
        vec3 energyColor = vec3(0.9, 0.95, 1.0);
        
        float energyPulse = sin(time * 4.0) * 0.5 + 0.5;
        float finalEnergyIntensity = energyMask * uPlasmaEnergyIntensity * (0.7 + energyPulse * 0.3);
        
        float contrast = 1.0 + energyMask * uPlasmaContrastBoost;
        vec3 contrastedColor = (blendedDistorted.rgb - 0.5) * contrast + 0.5;
        
        float saturationBoost = 1.0 + energyMask * 0.4;
        float luminance = dot(contrastedColor, vec3(0.299, 0.587, 0.114));
        vec3 saturatedColor = mix(vec3(luminance), contrastedColor, saturationBoost);
        
        vec3 glowColor = saturatedColor + energyColor * finalEnergyIntensity;
        
        float crackle = smoothNoise(uv * 50.0 + time * 2.0);
        crackle = smoothstep(0.85, 1.0, crackle) * energyMask;
        glowColor += vec3(1.0) * crackle * uPlasmaEnergyIntensity * 0.5;
        
        float brightnessPulse = sin(time * 6.0 + plasma * 10.0) * 0.5 + 0.5;
        glowColor += energyMask * brightnessPulse * uPlasmaEnergyIntensity * 0.2;
        
        // Apply color enhancement
        glowColor = mix(glowColor, glowColor * 1.2, (uColorEnhancement - 1.0) * 0.5);
        
        vec4 plasmaResult = vec4(glowColor, 1.0);
        
        if (progress > 0.85) {
          float endFade = (progress - 0.85) / 0.15;
          plasmaResult = mix(plasmaResult, newImg, endFade);
        }
        
        float overallTransition = smoothstep(0.0, 1.0, progress);
        return mix(currentImg, plasmaResult, overallTransition);
      }

      vec4 timeshiftEffect(vec2 uv, float progress) {
        // Get base images
        vec2 uv1 = getCoverUV(uv, uTexture1Size);
        vec2 uv2_base = getCoverUV(uv, uTexture2Size);
        vec4 currentImg = texture2D(uTexture1, uv1);
        vec4 newImg = texture2D(uTexture2, uv2_base);
        
        // Effect parameters - BOOSTED for more intensity
        float effectiveDistortion = uTimeshiftDistortion * uDistortionStrength * uGlobalIntensity;
        float effectiveBlur = uTimeshiftBlur * uGlobalIntensity;
        float effectiveFlow = uTimeshiftFlow * uSpeedMultiplier;
        float effectiveChromatic = uTimeshiftChromatic * uGlobalIntensity;
        float effectiveTurbulence = uTimeshiftTurbulence;
        
        // Create growing circle from center
        vec2 center = vec2(0.5, 0.5);
        vec2 p = uv * uResolution;
        vec2 sphereCenter = center * uResolution;
        
        float maxRadius = length(uResolution) * 0.85;
        // FIX: Start completely off-screen at progress 0
        float circleRadius = progress * maxRadius;
        
        float dist = length(p - sphereCenter);
        float normalizedDist = dist / max(circleRadius, 0.001);
        
        // Create transition boundary zone - WIDER for more organic feel
        float boundaryWidth = 0.2 * effectiveBlur;
        float inside = smoothstep(circleRadius + circleRadius * boundaryWidth, 
                                 circleRadius - circleRadius * boundaryWidth, dist);
        
        // Only apply heavy distortion at the boundary
        vec4 finalColor = newImg;
        
        if (inside > 0.01 && inside < 0.99) {
          // We're in the transition boundary - create INTENSE organic distortion
          vec2 fromCenter = uv - center;
          float radius = length(fromCenter);
          vec2 direction = radius > 0.0 ? fromCenter / radius : vec2(0.0);
          
          // Boundary strength (strongest at edge, fades toward center)
          float boundaryStrength = smoothstep(0.0, 0.3, inside) * smoothstep(1.0, 0.7, inside);
          
          // Time-based animation
          float time = progress * 6.28 * effectiveFlow;
          
          // INTENSIFIED multi-layered organic turbulence
          float turb1 = smoothNoise(uv * 12.0 * effectiveTurbulence + time * 0.4);
          float turb2 = smoothNoise(uv * 20.0 * effectiveTurbulence - time * 0.5);
          float turb3 = smoothNoise(uv * 35.0 * effectiveTurbulence + time * 0.7);
          float turb4 = smoothNoise(uv * 55.0 * effectiveTurbulence - time * 0.4);
          
          // Combine turbulence layers with MORE weight
          vec2 turbulence = vec2(
            (turb1 - 0.5) * 1.2 + (turb2 - 0.5) * 0.8 + (turb3 - 0.5) * 0.4,
            (turb2 - 0.5) * 1.2 + (turb3 - 0.5) * 0.8 + (turb4 - 0.5) * 0.4
          );
          
          // STRONGER displacement at boundary
          float displacementStrength = 0.18 * effectiveDistortion * boundaryStrength;
          vec2 displacement = turbulence * displacementStrength;
          
          // INTENSIFIED radial pull/push effect
          float radialPull = sin(normalizedDist * 12.0 - time * 2.5) * 0.05 * effectiveDistortion;
          displacement += direction * radialPull * boundaryStrength;
          
          // STRONGER flow/swirl around the boundary
          vec2 perpendicular = vec2(-direction.y, direction.x);
          float swirl = sin(time * 2.5 + normalizedDist * 10.0) * 0.06 * effectiveFlow;
          displacement += perpendicular * swirl * boundaryStrength;
          
          // Sample both images with heavy distortion
          vec2 distortedUV1 = getCoverUV(uv + displacement, uTexture1Size);
          vec2 distortedUV2 = getCoverUV(uv + displacement, uTexture2Size);
          
          vec4 distortedOld = texture2D(uTexture1, distortedUV1);
          vec4 distortedNew = texture2D(uTexture2, distortedUV2);
          
          // STRONGER chromatic aberration at boundary
          if (effectiveChromatic > 0.01) {
            float chromaticStr = boundaryStrength * 0.03 * effectiveChromatic;
            
            // Old image chromatic
            vec2 uv1_r = getCoverUV(uv + displacement + direction * chromaticStr * 2.0, uTexture1Size);
            vec2 uv1_b = getCoverUV(uv + displacement - direction * chromaticStr * 1.2, uTexture1Size);
            distortedOld = vec4(
              texture2D(uTexture1, uv1_r).r,
              distortedOld.g,
              texture2D(uTexture1, uv1_b).b,
              1.0
            );
            
            // New image chromatic
            vec2 uv2_r = getCoverUV(uv + displacement + direction * chromaticStr * 2.0, uTexture2Size);
            vec2 uv2_b = getCoverUV(uv + displacement - direction * chromaticStr * 1.2, uTexture2Size);
            distortedNew = vec4(
              texture2D(uTexture2, uv2_r).r,
              distortedNew.g,
              texture2D(uTexture2, uv2_b).b,
              1.0
            );
          }
          
          // Blend between distorted old and new based on position
          finalColor = mix(distortedOld, distortedNew, inside);
          
          // ENHANCED dreamy blur effect
          if (effectiveBlur > 0.5) {
            vec4 blurSample1 = texture2D(uTexture2, getCoverUV(uv + displacement + turbulence * 0.015, uTexture2Size));
            vec4 blurSample2 = texture2D(uTexture2, getCoverUV(uv + displacement - turbulence * 0.015, uTexture2Size));
            vec4 blurSample3 = texture2D(uTexture1, getCoverUV(uv + displacement + vec2(turbulence.y, -turbulence.x) * 0.015, uTexture1Size));
            
            float blurAmount = boundaryStrength * effectiveBlur * 0.6;
            finalColor = mix(finalColor, (finalColor + blurSample1 + blurSample2 + blurSample3) * 0.25, blurAmount);
          }
          
        } else if (inside >= 0.99) {
          // Fully inside - show new image
          finalColor = newImg;
        } else {
          // Outside - show current image
          finalColor = currentImg;
        }
        
        // Apply color enhancement
        finalColor.rgb = mix(finalColor.rgb, finalColor.rgb * 1.2, (uColorEnhancement - 1.0) * 0.5);
        
        // Clean end transition
        if (progress > 0.95) {
          float endTransition = (progress - 0.95) / 0.05;
          finalColor = mix(finalColor, newImg, endTransition);
        }
        
        // Final blend
        return mix(currentImg, finalColor, smoothstep(0.0, 1.0, progress));
      }

      void main() {
        if (uEffectType == 0) {
          gl_FragColor = glassEffect(vUv, uProgress);
        } else if (uEffectType == 1) {
          gl_FragColor = frostEffect(vUv, uProgress);
        } else if (uEffectType == 2) {
          gl_FragColor = rippleEffect(vUv, uProgress);
        } else if (uEffectType == 3) {
          gl_FragColor = plasmaEffect(vUv, uProgress);
        } else {
          gl_FragColor = timeshiftEffect(vUv, uProgress);
        }
      }
    `;
// Map effect names to shader indices
const getEffectIndex = (effectName) => {
  const effectMap = {
    glass: 0,
    frost: 1,
    ripple: 2,
    plasma: 3,
    timeshift: 4
  };
  return effectMap[effectName] || 0;
};
// Randomize effect settings
const randomizeEffect = () => {
  const effects = ["glass", "frost", "ripple", "plasma", "timeshift"];
  const randomEffect = effects[Math.floor(Math.random() * effects.length)];
  SLIDER_CONFIG.settings.currentEffect = randomEffect;
  // Randomize global settings
  SLIDER_CONFIG.settings.globalIntensity = 0.5 + Math.random() * 1.5;
  SLIDER_CONFIG.settings.speedMultiplier = 0.5 + Math.random() * 2.0;
  SLIDER_CONFIG.settings.distortionStrength = 0.5 + Math.random() * 2.0;
  SLIDER_CONFIG.settings.colorEnhancement = 0.7 + Math.random() * 1.3;
  // Randomize effect-specific settings
  if (randomEffect === "glass") {
    SLIDER_CONFIG.settings.glassRefractionStrength = 0.5 + Math.random() * 2.0;
    SLIDER_CONFIG.settings.glassChromaticAberration = 0.3 + Math.random() * 2.0;
    SLIDER_CONFIG.settings.glassBubbleClarity = 0.5 + Math.random() * 1.5;
    SLIDER_CONFIG.settings.glassEdgeGlow = Math.random() * 2.0;
    SLIDER_CONFIG.settings.glassLiquidFlow = 0.3 + Math.random() * 2.5;
  } else if (randomEffect === "frost") {
    SLIDER_CONFIG.settings.frostIntensity = 0.5 + Math.random() * 2.5;
    SLIDER_CONFIG.settings.frostCrystalSize = 0.3 + Math.random() * 1.7;
    SLIDER_CONFIG.settings.frostIceCoverage = 0.3 + Math.random() * 1.5;
    SLIDER_CONFIG.settings.frostTemperature = 0.3 + Math.random() * 2.5;
    SLIDER_CONFIG.settings.frostTexture = 0.5 + Math.random() * 1.5;
  } else if (randomEffect === "ripple") {
    SLIDER_CONFIG.settings.rippleFrequency = 10.0 + Math.random() * 40.0;
    SLIDER_CONFIG.settings.rippleAmplitude = 0.03 + Math.random() * 0.15;
    SLIDER_CONFIG.settings.rippleWaveSpeed = 0.3 + Math.random() * 2.5;
    SLIDER_CONFIG.settings.rippleRippleCount = 0.2 + Math.random() * 1.8;
    SLIDER_CONFIG.settings.rippleDecay = 0.3 + Math.random() * 1.7;
  } else if (randomEffect === "plasma") {
    SLIDER_CONFIG.settings.plasmaIntensity = 0.6 + Math.random() * 2.2;
    SLIDER_CONFIG.settings.plasmaSpeed = 0.3 + Math.random() * 1.7;
    SLIDER_CONFIG.settings.plasmaEnergyIntensity = Math.random();
    SLIDER_CONFIG.settings.plasmaContrastBoost = Math.random() * 0.8;
    SLIDER_CONFIG.settings.plasmaTurbulence = 0.3 + Math.random() * 2.5;
  } else if (randomEffect === "timeshift") {
    SLIDER_CONFIG.settings.timeshiftDistortion = 0.4 + Math.random() * 1.8;
    SLIDER_CONFIG.settings.timeshiftBlur = 0.4 + Math.random() * 1.6;
    SLIDER_CONFIG.settings.timeshiftFlow = 0.4 + Math.random() * 1.6;
    SLIDER_CONFIG.settings.timeshiftChromatic = 0.3 + Math.random() * 1.7;
    SLIDER_CONFIG.settings.timeshiftTurbulence = 0.4 + Math.random() * 1.6;
  }
  SLIDER_CONFIG.settings.currentEffectPreset = "Custom";
  handleEffectChange(randomEffect);
  updateShaderUniforms();
  pane.refresh();
};
// Initialize Tweakpane with new structure
const setupPane = () => {
  pane = new Pane({
    title: "Visual Effects Controls"
  });
  // 1. GENERAL SETTINGS (always visible)
  const generalFolder = pane.addFolder({
    title: "General Settings"
  });
  generalFolder.addBinding(SLIDER_CONFIG.settings, "globalIntensity", {
    label: "Global Intensity",
    min: 0.1,
    max: 2.0,
    step: 0.1
  });
  generalFolder.addBinding(SLIDER_CONFIG.settings, "speedMultiplier", {
    label: "Speed Multiplier",
    min: 0.1,
    max: 3.0,
    step: 0.1
  });
  generalFolder.addBinding(SLIDER_CONFIG.settings, "distortionStrength", {
    label: "Distortion",
    min: 0.1,
    max: 3.0,
    step: 0.1
  });
  generalFolder.addBinding(SLIDER_CONFIG.settings, "colorEnhancement", {
    label: "Color Enhancement",
    min: 0.5,
    max: 2.0,
    step: 0.1
  });
  // Timing controls
  const timingFolder = pane.addFolder({
    title: "Timing"
  });
  timingFolder.addBinding(SLIDER_CONFIG.settings, "transitionDuration", {
    label: "Transition Duration",
    min: 0.5,
    max: 5.0,
    step: 0.1
  });
  timingFolder.addBinding(SLIDER_CONFIG.settings, "autoSlideSpeed", {
    label: "Auto Slide Speed",
    min: 2000,
    max: 10000,
    step: 500
  });
  // 2. EFFECT SELECTION (always visible)
  const effectFolder = pane.addFolder({
    title: "Effect Selection"
  });
  effectFolder.addBinding(SLIDER_CONFIG.settings, "currentEffect", {
    label: "Effect Type",
    options: {
      Glass: "glass",
      Frost: "frost",
      Ripple: "ripple",
      Plasma: "plasma",
      Timeshift: "timeshift"
    }
  });
  // Add randomize button
  effectFolder
    .addButton({
      title: "Randomize Effect"
    })
    .on("click", randomizeEffect);
  // 3. EFFECT PRESETS (always visible, dynamic content)
  const presetsFolder = pane.addFolder({
    title: "Effect Presets"
  });
  presetsFolder.addBinding(SLIDER_CONFIG.settings, "currentEffectPreset", {
    label: "Preset",
    options: getPresetOptions(SLIDER_CONFIG.settings.currentEffect)
  });
  // 4. EFFECT SETTINGS (dynamic folders)
  setupEffectFolders();
  // Set initial effect folder visibility
  updateEffectFolderVisibility(SLIDER_CONFIG.settings.currentEffect);
  // Event handling
  pane.on("change", (event) => {
    if (isApplyingPreset) return;
    if (event.target.key === "currentEffect") {
      handleEffectChange(SLIDER_CONFIG.settings.currentEffect);
    } else if (event.target.key === "currentEffectPreset") {
      applyEffectPreset(
        SLIDER_CONFIG.settings.currentEffect,
        SLIDER_CONFIG.settings.currentEffectPreset
      );
    } else {
      // Mark as custom if any specific setting is changed
      if (
        !isApplyingPreset &&
        !event.target.key.includes("currentEffect") &&
        !event.target.key.includes("global") &&
        !event.target.key.includes("Duration") &&
        !event.target.key.includes("Speed")
      ) {
        SLIDER_CONFIG.settings.currentEffectPreset = "Custom";
        pane.refresh();
      }
      updateShaderUniforms();
    }
  });
  // Hide initially
  const paneElement = document.querySelector(".tp-dfwv");
  if (paneElement) {
    paneElement.style.display = "none";
  }
};
const getPresetOptions = (effectName) => {
  if (SLIDER_CONFIG.effectPresets[effectName]) {
    const presets = SLIDER_CONFIG.effectPresets[effectName];
    const options = {};
    Object.keys(presets).forEach((key) => {
      options[key] = key;
    });
    options["Custom"] = "Custom";
    return options;
  }
  return {
    Default: "Default",
    Custom: "Custom"
  };
};
const setupEffectFolders = () => {
  // Glass folder
  effectFolders.glass = pane.addFolder({
    title: "Glass Settings"
  });
  effectFolders.glass.addBinding(
    SLIDER_CONFIG.settings,
    "glassRefractionStrength",
    {
      label: "Refraction Strength",
      min: 0.1,
      max: 3.0,
      step: 0.1
    }
  );
  effectFolders.glass.addBinding(
    SLIDER_CONFIG.settings,
    "glassChromaticAberration",
    {
      label: "Chromatic Aberration",
      min: 0.1,
      max: 3.0,
      step: 0.1
    }
  );
  effectFolders.glass.addBinding(SLIDER_CONFIG.settings, "glassBubbleClarity", {
    label: "Bubble Clarity",
    min: 0.1,
    max: 2.0,
    step: 0.1
  });
  effectFolders.glass.addBinding(SLIDER_CONFIG.settings, "glassEdgeGlow", {
    label: "Edge Glow",
    min: 0.0,
    max: 2.0,
    step: 0.1
  });
  effectFolders.glass.addBinding(SLIDER_CONFIG.settings, "glassLiquidFlow", {
    label: "Liquid Flow",
    min: 0.1,
    max: 3.0,
    step: 0.1
  });
  // Frost folder
  effectFolders.frost = pane.addFolder({
    title: "Frost Settings"
  });
  effectFolders.frost.addBinding(SLIDER_CONFIG.settings, "frostIntensity", {
    label: "Frost Intensity",
    min: 0.5,
    max: 3.0,
    step: 0.1
  });
  effectFolders.frost.addBinding(SLIDER_CONFIG.settings, "frostCrystalSize", {
    label: "Crystal Size",
    min: 0.3,
    max: 2.0,
    step: 0.1
  });
  effectFolders.frost.addBinding(SLIDER_CONFIG.settings, "frostIceCoverage", {
    label: "Ice Coverage",
    min: 0.1,
    max: 2.0,
    step: 0.1
  });
  effectFolders.frost.addBinding(SLIDER_CONFIG.settings, "frostTemperature", {
    label: "Temperature",
    min: 0.1,
    max: 3.0,
    step: 0.1
  });
  effectFolders.frost.addBinding(SLIDER_CONFIG.settings, "frostTexture", {
    label: "Texture Detail",
    min: 0.3,
    max: 2.0,
    step: 0.1
  });
  // Ripple folder
  effectFolders.ripple = pane.addFolder({
    title: "Ripple Settings"
  });
  effectFolders.ripple.addBinding(SLIDER_CONFIG.settings, "rippleFrequency", {
    label: "Frequency",
    min: 10.0,
    max: 50.0,
    step: 1.0
  });
  effectFolders.ripple.addBinding(SLIDER_CONFIG.settings, "rippleAmplitude", {
    label: "Amplitude",
    min: 0.02,
    max: 0.2,
    step: 0.01
  });
  effectFolders.ripple.addBinding(SLIDER_CONFIG.settings, "rippleWaveSpeed", {
    label: "Wave Speed",
    min: 0.2,
    max: 3.0,
    step: 0.1
  });
  effectFolders.ripple.addBinding(SLIDER_CONFIG.settings, "rippleRippleCount", {
    label: "Ripple Count",
    min: 0.1,
    max: 2.0,
    step: 0.1
  });
  effectFolders.ripple.addBinding(SLIDER_CONFIG.settings, "rippleDecay", {
    label: "Decay Rate",
    min: 0.2,
    max: 2.0,
    step: 0.1
  });
  // Plasma folder
  effectFolders.plasma = pane.addFolder({
    title: "Plasma Settings"
  });
  effectFolders.plasma.addBinding(SLIDER_CONFIG.settings, "plasmaIntensity", {
    label: "Plasma Intensity",
    min: 0.5,
    max: 3.0,
    step: 0.1
  });
  effectFolders.plasma.addBinding(SLIDER_CONFIG.settings, "plasmaSpeed", {
    label: "Plasma Speed",
    min: 0.2,
    max: 2.0,
    step: 0.1
  });
  effectFolders.plasma.addBinding(
    SLIDER_CONFIG.settings,
    "plasmaEnergyIntensity",
    {
      label: "Energy Intensity",
      min: 0.0,
      max: 1.0,
      step: 0.05
    }
  );
  effectFolders.plasma.addBinding(
    SLIDER_CONFIG.settings,
    "plasmaContrastBoost",
    {
      label: "Contrast Boost",
      min: 0.0,
      max: 1.0,
      step: 0.05
    }
  );
  effectFolders.plasma.addBinding(SLIDER_CONFIG.settings, "plasmaTurbulence", {
    label: "Turbulence",
    min: 0.1,
    max: 3.0,
    step: 0.1
  });
  // Timeshift folder
  effectFolders.timeshift = pane.addFolder({
    title: "Timeshift Settings"
  });
  effectFolders.timeshift.addBinding(
    SLIDER_CONFIG.settings,
    "timeshiftDistortion",
    {
      label: "Distortion",
      min: 0.3,
      max: 3.0,
      step: 0.1
    }
  );
  effectFolders.timeshift.addBinding(SLIDER_CONFIG.settings, "timeshiftBlur", {
    label: "Blur Amount",
    min: 0.3,
    max: 3.0,
    step: 0.1
  });
  effectFolders.timeshift.addBinding(SLIDER_CONFIG.settings, "timeshiftFlow", {
    label: "Flow Speed",
    min: 0.3,
    max: 3.0,
    step: 0.1
  });
  effectFolders.timeshift.addBinding(
    SLIDER_CONFIG.settings,
    "timeshiftChromatic",
    {
      label: "Chromatic Glitch",
      min: 0.0,
      max: 3.0,
      step: 0.1
    }
  );
  effectFolders.timeshift.addBinding(
    SLIDER_CONFIG.settings,
    "timeshiftTurbulence",
    {
      label: "Turbulence",
      min: 0.3,
      max: 3.0,
      step: 0.1
    }
  );
};
const updateEffectFolderVisibility = (currentEffect) => {
  // Hide all effect folders
  Object.keys(effectFolders).forEach((effectName) => {
    if (effectFolders[effectName]) {
      effectFolders[effectName].hidden = effectName !== currentEffect;
    }
  });
  currentEffectFolder = effectFolders[currentEffect];
};
const handleEffectChange = (newEffect) => {
  // Update shader effect type
  if (shaderMaterial) {
    shaderMaterial.uniforms.uEffectType.value = getEffectIndex(newEffect);
  }
  // Update folder visibility
  updateEffectFolderVisibility(newEffect);
  // Update preset options
  const presetsFolder = pane.children.find(
    (child) => child.title === "Effect Presets"
  );
  if (presetsFolder) {
    // Remove old preset binding
    const oldBinding = presetsFolder.children.find(
      (child) => child.key === "currentEffectPreset"
    );
    if (oldBinding) {
      presetsFolder.remove(oldBinding);
    }
    // Add new preset binding with updated options
    presetsFolder.addBinding(SLIDER_CONFIG.settings, "currentEffectPreset", {
      label: "Preset",
      options: getPresetOptions(newEffect)
    });
  }
  // Apply default preset for new effect
  SLIDER_CONFIG.settings.currentEffectPreset = "Default";
  applyEffectPreset(newEffect, "Default");
  pane.refresh();
};
const applyEffectPreset = (effectName, presetName) => {
  if (
    SLIDER_CONFIG.effectPresets[effectName] &&
    SLIDER_CONFIG.effectPresets[effectName][presetName]
  ) {
    isApplyingPreset = true;
    // Apply the preset settings
    Object.assign(
      SLIDER_CONFIG.settings,
      SLIDER_CONFIG.effectPresets[effectName][presetName]
    );
    updateShaderUniforms();
    pane.refresh();
    setTimeout(() => {
      isApplyingPreset = false;
    }, 100);
  }
};
const updateShaderUniforms = () => {
  if (!shaderMaterial) return;
  // Update all uniforms with current settings
  const uniforms = shaderMaterial.uniforms;
  const settings = SLIDER_CONFIG.settings;
  // Global uniforms
  if (uniforms.uGlobalIntensity)
    uniforms.uGlobalIntensity.value = settings.globalIntensity;
  if (uniforms.uSpeedMultiplier)
    uniforms.uSpeedMultiplier.value = settings.speedMultiplier;
  if (uniforms.uDistortionStrength)
    uniforms.uDistortionStrength.value = settings.distortionStrength;
  if (uniforms.uColorEnhancement)
    uniforms.uColorEnhancement.value = settings.colorEnhancement;
  // Glass uniforms
  if (uniforms.uGlassRefractionStrength)
    uniforms.uGlassRefractionStrength.value = settings.glassRefractionStrength;
  if (uniforms.uGlassChromaticAberration)
    uniforms.uGlassChromaticAberration.value =
      settings.glassChromaticAberration;
  if (uniforms.uGlassBubbleClarity)
    uniforms.uGlassBubbleClarity.value = settings.glassBubbleClarity;
  if (uniforms.uGlassEdgeGlow)
    uniforms.uGlassEdgeGlow.value = settings.glassEdgeGlow;
  if (uniforms.uGlassLiquidFlow)
    uniforms.uGlassLiquidFlow.value = settings.glassLiquidFlow;
  // Frost uniforms
  if (uniforms.uFrostIntensity)
    uniforms.uFrostIntensity.value = settings.frostIntensity;
  if (uniforms.uFrostCrystalSize)
    uniforms.uFrostCrystalSize.value = settings.frostCrystalSize;
  if (uniforms.uFrostIceCoverage)
    uniforms.uFrostIceCoverage.value = settings.frostIceCoverage;
  if (uniforms.uFrostTemperature)
    uniforms.uFrostTemperature.value = settings.frostTemperature;
  if (uniforms.uFrostTexture)
    uniforms.uFrostTexture.value = settings.frostTexture;
  // Ripple uniforms
  if (uniforms.uRippleFrequency)
    uniforms.uRippleFrequency.value = settings.rippleFrequency;
  if (uniforms.uRippleAmplitude)
    uniforms.uRippleAmplitude.value = settings.rippleAmplitude;
  if (uniforms.uRippleWaveSpeed)
    uniforms.uRippleWaveSpeed.value = settings.rippleWaveSpeed;
  if (uniforms.uRippleRippleCount)
    uniforms.uRippleRippleCount.value = settings.rippleRippleCount;
  if (uniforms.uRippleDecay) uniforms.uRippleDecay.value = settings.rippleDecay;
  // Plasma uniforms
  if (uniforms.uPlasmaIntensity)
    uniforms.uPlasmaIntensity.value = settings.plasmaIntensity;
  if (uniforms.uPlasmaSpeed) uniforms.uPlasmaSpeed.value = settings.plasmaSpeed;
  if (uniforms.uPlasmaEnergyIntensity)
    uniforms.uPlasmaEnergyIntensity.value = settings.plasmaEnergyIntensity;
  if (uniforms.uPlasmaContrastBoost)
    uniforms.uPlasmaContrastBoost.value = settings.plasmaContrastBoost;
  if (uniforms.uPlasmaTurbulence)
    uniforms.uPlasmaTurbulence.value = settings.plasmaTurbulence;
  // Timeshift uniforms
  if (uniforms.uTimeshiftDistortion)
    uniforms.uTimeshiftDistortion.value = settings.timeshiftDistortion;
  if (uniforms.uTimeshiftBlur)
    uniforms.uTimeshiftBlur.value = settings.timeshiftBlur;
  if (uniforms.uTimeshiftFlow)
    uniforms.uTimeshiftFlow.value = settings.timeshiftFlow;
  if (uniforms.uTimeshiftChromatic)
    uniforms.uTimeshiftChromatic.value = settings.timeshiftChromatic;
  if (uniforms.uTimeshiftTurbulence)
    uniforms.uTimeshiftTurbulence.value = settings.timeshiftTurbulence;
};
// Navigation UI
const createSlidesNavigation = () => {
  const navContainer = document.getElementById("slidesNav");
  navContainer.innerHTML = "";
  slides.forEach((slide, index) => {
    const navItem = document.createElement("div");
    navItem.className = `slide-nav-item ${index === 0 ? "active" : ""}`;
    navItem.dataset.slideIndex = index;
    navItem.innerHTML = `
          <div class="slide-progress-line">
            <div class="slide-progress-fill" style="width: 0%"></div>
          </div>
          <div class="slide-nav-title">${slide.title}</div>
        `;
    navItem.addEventListener("click", (e) => {
      e.stopPropagation();
      const targetIndex = parseInt(navItem.dataset.slideIndex);
      if (targetIndex !== currentSlideIndex && !isTransitioning) {
        navigateToSlide(targetIndex);
      }
    });
    navContainer.appendChild(navItem);
  });
};
const updateNavigationState = (activeIndex) => {
  const navItems = document.querySelectorAll(".slide-nav-item");
  navItems.forEach((item, index) => {
    item.classList.toggle("active", index === activeIndex);
  });
};
const updateSlideProgress = (slideIndex, progress) => {
  const navItems = document.querySelectorAll(".slide-nav-item");
  if (navItems[slideIndex]) {
    const progressFill = navItems[slideIndex].querySelector(
      ".slide-progress-fill"
    );
    progressFill.style.width = `${progress}%`;
    progressFill.style.opacity = "1";
  }
};
const fadeSlideProgress = (slideIndex) => {
  const navItems = document.querySelectorAll(".slide-nav-item");
  if (navItems[slideIndex]) {
    const progressFill = navItems[slideIndex].querySelector(
      ".slide-progress-fill"
    );
    progressFill.style.opacity = "0";
    setTimeout(() => (progressFill.style.width = "0%"), 300);
  }
};
const quickResetProgress = (slideIndex) => {
  const navItems = document.querySelectorAll(".slide-nav-item");
  if (navItems[slideIndex]) {
    const progressFill = navItems[slideIndex].querySelector(
      ".slide-progress-fill"
    );
    // Quickly animate back to 0% instead of just fading
    progressFill.style.transition = "width 0.2s ease-out";
    progressFill.style.width = "0%";
    // Reset transition back to normal after animation
    setTimeout(() => {
      progressFill.style.transition = "width 0.1s ease, opacity 0.3s ease";
    }, 200);
  }
};
const updateCounter = (index) => {
  const slideNumber = document.getElementById("slideNumber");
  slideNumber.textContent = String(index + 1).padStart(2, "0");
  const slideTotal = document.getElementById("slideTotal");
  slideTotal.textContent = String(slides.length).padStart(2, "0");
};
// Timer functions
const startAutoSlideTimer = () => {
  if (!texturesLoaded || !sliderEnabled || slideTextures.length < 2) return;
  stopAutoSlideTimer();
  let progress = 0;
  const increment = (100 / SLIDE_DURATION()) * PROGRESS_UPDATE_INTERVAL;
  progressAnimation = setInterval(() => {
    if (!sliderEnabled) {
      stopAutoSlideTimer();
      return;
    }
    progress += increment;
    updateSlideProgress(currentSlideIndex, progress);
    if (progress >= 100) {
      clearInterval(progressAnimation);
      progressAnimation = null;
      fadeSlideProgress(currentSlideIndex);
      if (!isTransitioning) {
        handleSlideChange();
      }
    }
  }, PROGRESS_UPDATE_INTERVAL);
};
const stopAutoSlideTimer = () => {
  if (progressAnimation) {
    clearInterval(progressAnimation);
    progressAnimation = null;
  }
  if (autoSlideTimer) {
    clearTimeout(autoSlideTimer);
    autoSlideTimer = null;
  }
};
const safeStartTimer = (delay = 0) => {
  stopAutoSlideTimer();
  if (sliderEnabled && texturesLoaded) {
    if (delay > 0) {
      autoSlideTimer = setTimeout(() => {
        if (sliderEnabled) startAutoSlideTimer();
      }, delay);
    } else {
      startAutoSlideTimer();
    }
  }
};
// Navigation
const navigateToSlide = (targetIndex) => {
  if (isTransitioning || targetIndex === currentSlideIndex) return;
  stopAutoSlideTimer();
  // Quickly reset current slide progress when manually navigating
  quickResetProgress(currentSlideIndex);
  const currentTexture = slideTextures[currentSlideIndex];
  const targetTexture = slideTextures[targetIndex];
  if (!currentTexture || !targetTexture) return;
  isTransitioning = true;
  shaderMaterial.uniforms.uTexture1.value = currentTexture;
  shaderMaterial.uniforms.uTexture2.value = targetTexture;
  shaderMaterial.uniforms.uTexture1Size.value = currentTexture.userData.size;
  shaderMaterial.uniforms.uTexture2Size.value = targetTexture.userData.size;
  currentSlideIndex = targetIndex;
  updateCounter(currentSlideIndex);
  updateNavigationState(currentSlideIndex);
  gsap.fromTo(
    shaderMaterial.uniforms.uProgress,
    {
      value: 0
    },
    {
      value: 1,
      duration: TRANSITION_DURATION(),
      ease: "power2.inOut",
      onComplete: () => {
        shaderMaterial.uniforms.uProgress.value = 0;
        shaderMaterial.uniforms.uTexture1.value = targetTexture;
        shaderMaterial.uniforms.uTexture1Size.value =
          targetTexture.userData.size;
        isTransitioning = false;
        safeStartTimer(100);
      }
    }
  );
};
const handleSlideChange = () => {
  if (isTransitioning || !texturesLoaded || !sliderEnabled) return;
  const nextIndex = (currentSlideIndex + 1) % slides.length;
  navigateToSlide(nextIndex);
};
const handleSwipe = () => {
  if (Math.abs(touchEndX - touchStartX) < 50) return; // Minimum swipe distance
  if (touchEndX < touchStartX && !isTransitioning && sliderEnabled) {
    // Swipe left - next slide
    stopAutoSlideTimer();
    quickResetProgress(currentSlideIndex);
    handleSlideChange();
  } else if (touchEndX > touchStartX && !isTransitioning && sliderEnabled) {
    // Swipe right - previous slide
    stopAutoSlideTimer();
    quickResetProgress(currentSlideIndex);
    const prevIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
    navigateToSlide(prevIndex);
  }
};
// Texture loading
const loadImageTexture = (src) => {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    const timeout = setTimeout(() => reject(new Error("Timeout")), 10000);
    loader.load(
      src,
      (texture) => {
        clearTimeout(timeout);
        texture.minFilter = texture.magFilter = THREE.LinearFilter;
        texture.userData = {
          size: new THREE.Vector2(texture.image.width, texture.image.height)
        };
        resolve(texture);
      },
      undefined,
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
};
// Initialize
const initializeRenderer = async () => {
  const canvas = document.querySelector(".webgl-canvas");
  if (!canvas) return;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: false,
    alpha: false
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTexture1: {
        value: null
      },
      uTexture2: {
        value: null
      },
      uProgress: {
        value: 0.0
      },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight)
      },
      uTexture1Size: {
        value: new THREE.Vector2(1, 1)
      },
      uTexture2Size: {
        value: new THREE.Vector2(1, 1)
      },
      uEffectType: {
        value: getEffectIndex(SLIDER_CONFIG.settings.currentEffect)
      },
      // Global settings uniforms
      uGlobalIntensity: {
        value: SLIDER_CONFIG.settings.globalIntensity
      },
      uSpeedMultiplier: {
        value: SLIDER_CONFIG.settings.speedMultiplier
      },
      uDistortionStrength: {
        value: SLIDER_CONFIG.settings.distortionStrength
      },
      uColorEnhancement: {
        value: SLIDER_CONFIG.settings.colorEnhancement
      },
      // Glass uniforms
      uGlassRefractionStrength: {
        value: SLIDER_CONFIG.settings.glassRefractionStrength
      },
      uGlassChromaticAberration: {
        value: SLIDER_CONFIG.settings.glassChromaticAberration
      },
      uGlassBubbleClarity: {
        value: SLIDER_CONFIG.settings.glassBubbleClarity
      },
      uGlassEdgeGlow: {
        value: SLIDER_CONFIG.settings.glassEdgeGlow
      },
      uGlassLiquidFlow: {
        value: SLIDER_CONFIG.settings.glassLiquidFlow
      },
      // Frost uniforms
      uFrostIntensity: {
        value: SLIDER_CONFIG.settings.frostIntensity
      },
      uFrostCrystalSize: {
        value: SLIDER_CONFIG.settings.frostCrystalSize
      },
      uFrostIceCoverage: {
        value: SLIDER_CONFIG.settings.frostIceCoverage
      },
      uFrostTemperature: {
        value: SLIDER_CONFIG.settings.frostTemperature
      },
      uFrostTexture: {
        value: SLIDER_CONFIG.settings.frostTexture
      },
      // Ripple uniforms
      uRippleFrequency: {
        value: SLIDER_CONFIG.settings.rippleFrequency
      },
      uRippleAmplitude: {
        value: SLIDER_CONFIG.settings.rippleAmplitude
      },
      uRippleWaveSpeed: {
        value: SLIDER_CONFIG.settings.rippleWaveSpeed
      },
      uRippleRippleCount: {
        value: SLIDER_CONFIG.settings.rippleRippleCount
      },
      uRippleDecay: {
        value: SLIDER_CONFIG.settings.rippleDecay
      },
      // Plasma uniforms
      uPlasmaIntensity: {
        value: SLIDER_CONFIG.settings.plasmaIntensity
      },
      uPlasmaSpeed: {
        value: SLIDER_CONFIG.settings.plasmaSpeed
      },
      uPlasmaEnergyIntensity: {
        value: SLIDER_CONFIG.settings.plasmaEnergyIntensity
      },
      uPlasmaContrastBoost: {
        value: SLIDER_CONFIG.settings.plasmaContrastBoost
      },
      uPlasmaTurbulence: {
        value: SLIDER_CONFIG.settings.plasmaTurbulence
      },
      // Timeshift uniforms
      uTimeshiftDistortion: {
        value: SLIDER_CONFIG.settings.timeshiftDistortion
      },
      uTimeshiftBlur: {
        value: SLIDER_CONFIG.settings.timeshiftBlur
      },
      uTimeshiftFlow: {
        value: SLIDER_CONFIG.settings.timeshiftFlow
      },
      uTimeshiftChromatic: {
        value: SLIDER_CONFIG.settings.timeshiftChromatic
      },
      uTimeshiftTurbulence: {
        value: SLIDER_CONFIG.settings.timeshiftTurbulence
      }
    },
    vertexShader,
    fragmentShader
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, shaderMaterial);
  scene.add(mesh);
  // Load textures
  for (let i = 0; i < slides.length; i++) {
    try {
      const texture = await loadImageTexture(slides[i].media);
      slideTextures.push(texture);
    } catch (error) {
      console.warn(`Failed to load image ${i}`);
    }
  }
  if (slideTextures.length >= 2) {
    shaderMaterial.uniforms.uTexture1.value = slideTextures[0];
    shaderMaterial.uniforms.uTexture2.value = slideTextures[1];
    shaderMaterial.uniforms.uTexture1Size.value =
      slideTextures[0].userData.size;
    shaderMaterial.uniforms.uTexture2Size.value =
      slideTextures[1].userData.size;
    texturesLoaded = true;
    sliderEnabled = true;
    safeStartTimer(500);
  }
  // Render loop
  const render = () => {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  };
  render();
};
// Event listeners
window.addEventListener("load", async () => {
  createSlidesNavigation();
  updateCounter(0);
  setupPane();
  await initializeRenderer();
});
document.addEventListener("click", (e) => {
  if (e.target.closest(".slides-navigation")) return;
  if (!isTransitioning && sliderEnabled) {
    stopAutoSlideTimer();
    quickResetProgress(currentSlideIndex);
    handleSlideChange();
  }
});
// Touch event listeners for mobile swipe support
document.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
});
document.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});
window.addEventListener("resize", () => {
  if (renderer && shaderMaterial) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    shaderMaterial.uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight
    );
  }
});
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowRight") {
    e.preventDefault();
    if (!isTransitioning && sliderEnabled) {
      stopAutoSlideTimer();
      quickResetProgress(currentSlideIndex);
      handleSlideChange();
    }
  } else if (e.code === "ArrowLeft") {
    e.preventDefault();
    if (!isTransitioning && sliderEnabled) {
      stopAutoSlideTimer();
      quickResetProgress(currentSlideIndex);
      const prevIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
      navigateToSlide(prevIndex);
    }
  } else if (e.code === "KeyH") {
    e.preventDefault();
    const paneElement = document.querySelector(".tp-dfwv");
    if (paneElement) {
      paneElement.style.display =
        paneElement.style.display === "none" ? "block" : "none";
    }
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAutoSlideTimer();
  } else if (sliderEnabled && !isTransitioning) {
    safeStartTimer();
  }
});
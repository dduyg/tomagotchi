import * as THREE from "https://esm.sh/three";
import { Pane } from "https://cdn.skypack.dev/tweakpane@4.0.4";

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: "vertical",
  gestureDirection: "vertical",
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false
});

let scrollVelocity = 0;
let targetScrollVelocity = 0;
let scrollTimeout = null;
let scrollEffectActive = false;
let allImageEffects = [];

// Optimized resize handling
const resizeHandlers = new Map();
let resizeTimeout = null;

function handleGlobalResize() {
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    resizeHandlers.forEach((handler) => handler());
  }, 16);
}

window.addEventListener("resize", handleGlobalResize);

lenis.on("scroll", (data) => {
  ScrollTrigger.update();
  targetScrollVelocity = Math.abs(data.velocity) * 0.02;

  if (
    targetScrollVelocity > settings.scrollTriggerThreshold &&
    !scrollEffectActive
  ) {
    activateScrollEffect();
  }

  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }

  scrollTimeout = setTimeout(() => {
    gsap.to(
      { value: scrollVelocity },
      {
        value: 0,
        duration: 0.5,
        ease: "power2.out",
        onUpdate: function () {
          scrollVelocity = this.targets()[0].value;
        },
        onComplete: () => {
          if (scrollEffectActive && scrollVelocity < 0.02) {
            deactivateScrollEffect();
          }
        }
      }
    );
  }, 50);
});

function activateScrollEffect() {
  if (scrollEffectActive) return;
  scrollEffectActive = true;

  allImageEffects.forEach((effectData) => {
    if (effectData.effect && !effectData.isHovered) {
      effectData.effect.startWithIntensity(settings.scrollEffectStrength);
      gsap.to(effectData.canvas, {
        opacity: settings.scrollEffectOpacity,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  });
}

function deactivateScrollEffect() {
  if (!scrollEffectActive) return;
  scrollEffectActive = false;

  allImageEffects.forEach((effectData) => {
    if (effectData.effect && !effectData.isHovered) {
      effectData.effect.stop();
      gsap.to(effectData.canvas, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out"
      });
    }
  });
}

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);

  scrollVelocity += (targetScrollVelocity - scrollVelocity) * 0.15;

  document.querySelectorAll(".image-box").forEach((box) => {
    const img = box.querySelector("img");
    const isHovered = box.matches(":hover");

    if (scrollVelocity > 0.001 && !isHovered) {
      const strength = Math.min(scrollVelocity * 10, 0.1);
      img.style.filter = `grayscale(100%) contrast(1.2) 
                drop-shadow(${strength}px 0 0 #ff0000) 
                drop-shadow(-${strength}px 0 0 #00ffff)`;
    } else if (!isHovered) {
      img.style.filter = "grayscale(100%) contrast(1.2)";
    }
  });
});
gsap.ticker.lagSmoothing(0);

const ANIMATION_TIMING = {
  hover: {
    duration: 0.64,
    ease: "cubic-bezier(0.23, 1, 0.32, 1)"
  },
  title: {
    duration: 0.2,
    ease: "cubic-bezier(0.23, 1, 0.32, 1)"
  },
  fisheye: {
    start: 0.64,
    stop: 0.64,
    ease: "cubic-bezier(0.23, 1, 0.32, 1)"
  },
  debug: {
    duration: 0.3,
    ease: "power2.inOut"
  }
};

const settings = {
  fisheyeStrength: 1.0,
  vignetteStart: 0.3,
  vignetteEnd: 0.8,
  fisheyeRadius: 0.8,
  chromaticAberration: 0.015,
  noiseIntensity: 0.08,
  vignetteIntensity: 0.32,
  mouseEffect: 0.02,
  mouseRadius: 0.3,
  animationDuration: 0.64,
  canvasOpacity: 1.0,
  showVignetteMask: false,
  scrollEffectStrength: 0.7,
  scrollEffectOpacity: 0.6,
  scrollTriggerThreshold: 0.08
};

const allEffects = [];
const pane = new Pane({ title: "Fisheye Controls" });

const fisheyeFolder = pane.addFolder({ title: "Fisheye Distortion" });
fisheyeFolder.addBinding(settings, "fisheyeStrength", {
  label: "Fisheye Strength",
  min: 0,
  max: 1.2,
  step: 0.1
});
fisheyeFolder.addBinding(settings, "vignetteStart", {
  label: "Vignette Start",
  min: 0,
  max: 1,
  step: 0.05
});
fisheyeFolder.addBinding(settings, "vignetteEnd", {
  label: "Vignette End",
  min: 0,
  max: 1,
  step: 0.05
});
fisheyeFolder.addBinding(settings, "fisheyeRadius", {
  label: "Fisheye Radius",
  min: 0.1,
  max: 1.5,
  step: 0.05
});

const effectsFolder = pane.addFolder({ title: "Visual Effects" });
effectsFolder.addBinding(settings, "chromaticAberration", {
  label: "Chromatic Aberration",
  min: 0,
  max: 0.1,
  step: 0.001
});
effectsFolder.addBinding(settings, "noiseIntensity", {
  label: "Noise Intensity",
  min: 0,
  max: 0.15,
  step: 0.005
});
effectsFolder.addBinding(settings, "vignetteIntensity", {
  label: "Vignette Intensity",
  min: 0,
  max: 0.5,
  step: 0.01
});

const mouseFolder = pane.addFolder({ title: "Mouse Interaction" });
mouseFolder.addBinding(settings, "mouseEffect", {
  label: "Mouse Effect",
  min: 0,
  max: 0.1,
  step: 0.005
});
mouseFolder.addBinding(settings, "mouseRadius", {
  label: "Mouse Radius",
  min: 0.1,
  max: 1,
  step: 0.05
});

const animationFolder = pane.addFolder({ title: "Animation" });
animationFolder.addBinding(settings, "animationDuration", {
  label: "Animation Duration",
  min: 0.1,
  max: 2,
  step: 0.05
});
animationFolder.addBinding(settings, "canvasOpacity", {
  label: "Canvas Opacity",
  min: 0,
  max: 1,
  step: 0.05
});

const debugFolder = pane.addFolder({ title: "Debug" });
debugFolder.addBinding(settings, "showVignetteMask", {
  label: "Show Vignette Mask"
});

const scrollFolder = pane.addFolder({ title: "Scroll Effects" });
scrollFolder.addBinding(settings, "scrollEffectStrength", {
  label: "Scroll Effect Strength",
  min: 0,
  max: 1,
  step: 0.05
});
scrollFolder.addBinding(settings, "scrollEffectOpacity", {
  label: "Scroll Opacity",
  min: 0,
  max: 1,
  step: 0.05
});
scrollFolder.addBinding(settings, "scrollTriggerThreshold", {
  label: "Scroll Trigger Threshold",
  min: 0.01,
  max: 0.2,
  step: 0.01
});

pane.on("change", () => {
  allEffects.forEach((effect) => {
    if (effect && effect.updateSettings) {
      effect.updateSettings(settings);
    }
  });

  ANIMATION_TIMING.fisheye.start = settings.animationDuration;
  ANIMATION_TIMING.fisheye.stop = settings.animationDuration;

  document.querySelectorAll(".threejs-canvas").forEach((canvas) => {
    if (canvas.closest(".image-box:hover")) {
      canvas.style.opacity = settings.canvasOpacity;
    }
  });
});

function createVignetteFisheyeDistortion(canvas, imageUrl) {
  return new Promise((resolve) => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    let renderer;
    let material;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        premultipliedAlpha: false,
        antialias: true
      });
    } catch (e) {
      resolve(null);
      return;
    }

    function updateCanvasSize() {
      const container = canvas.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      renderer.setSize(width, height);
      renderer.setPixelRatio(pixelRatio);

      if (material && material.uniforms) {
        material.uniforms.uAspectRatio.value = width / height;
      }
    }

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "anonymous";

    textureLoader.load(
      imageUrl,
      (texture) => {
        const geometry = new THREE.PlaneGeometry(2, 2);

        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        material = new THREE.ShaderMaterial({
          uniforms: {
            uTexture: { value: texture },
            uTime: { value: 0 },
            uFisheyeIntensity: { value: 0 },
            uFisheyeStrength: { value: settings.fisheyeStrength },
            uVignetteStart: { value: settings.vignetteStart },
            uVignetteEnd: { value: settings.vignetteEnd },
            uFisheyeRadius: { value: settings.fisheyeRadius },
            uChromaticAberration: { value: settings.chromaticAberration },
            uNoiseIntensity: { value: settings.noiseIntensity },
            uVignetteIntensity: { value: settings.vignetteIntensity },
            uMouseEffect: { value: settings.mouseEffect },
            uMouseRadius: { value: settings.mouseRadius },
            uShowVignetteMask: { value: settings.showVignetteMask ? 1.0 : 0.0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uAspectRatio: { value: 1 }
          },
          vertexShader: `
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
          fragmentShader: `
                        uniform sampler2D uTexture;
                        uniform float uTime;
                        uniform float uFisheyeIntensity;
                        uniform float uFisheyeStrength;
                        uniform float uVignetteStart;
                        uniform float uVignetteEnd;
                        uniform float uFisheyeRadius;
                        uniform float uChromaticAberration;
                        uniform float uNoiseIntensity;
                        uniform float uVignetteIntensity;
                        uniform float uMouseEffect;
                        uniform float uMouseRadius;
                        uniform float uShowVignetteMask;
                        uniform vec2 uMouse;
                        uniform float uAspectRatio;
                        varying vec2 vUv;
                        
                        vec4 sampleTextureSafe(sampler2D tex, vec2 uv) {
                            vec2 clampedUV = clamp(uv, 0.001, 0.999);
                            if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                                vec2 edgeUV = clamp(uv, 0.0, 1.0);
                                vec4 edgeColor = texture2D(tex, edgeUV);
                                float fadeX = 1.0 - smoothstep(0.0, 0.1, abs(uv.x - clamp(uv.x, 0.0, 1.0)));
                                float fadeY = 1.0 - smoothstep(0.0, 0.1, abs(uv.y - clamp(uv.y, 0.0, 1.0)));
                                return edgeColor * fadeX * fadeY;
                            }
                            return texture2D(tex, clampedUV);
                        }
                        
                        vec2 fisheyeDistortion(vec2 uv, float intensity) {
                            vec2 center = vec2(0.5, 0.5);
                            vec2 delta = uv - center;
                            delta.x *= uAspectRatio;
                            float distance = length(delta);
                            
                            if (distance < uFisheyeRadius && distance > 0.0) {
                                float percent = distance / uFisheyeRadius;
                                float theta = percent * percent * intensity * uFisheyeStrength;
                                float beta = max(0.00001, distance);
                                delta = delta / beta * tan(theta) * beta;
                            }
                            
                            delta.x /= uAspectRatio;
                            return center + delta;
                        }
                        
                        void main() {
                            vec2 uv = vUv;
                            vec2 center = vec2(0.5, 0.5);
                            vec2 delta = uv - center;
                            delta.x *= uAspectRatio;
                            float distanceFromCenter = length(delta);
                            
                            float vignetteMask = smoothstep(uVignetteStart, uVignetteEnd, distanceFromCenter);
                            
                            if (uShowVignetteMask > 0.5) {
                                gl_FragColor = vec4(vignetteMask, vignetteMask, vignetteMask, 1.0);
                                return;
                            }
                            
                            vec2 finalUV = uv;
                            
                            if (uFisheyeIntensity > 0.001) {
                                vec2 distortedUV = fisheyeDistortion(uv, uFisheyeIntensity);
                                finalUV = mix(uv, distortedUV, vignetteMask);
                                
                                vec2 mousePos = uMouse * 0.5 + 0.5;
                                float mouseDist = distance(uv, mousePos);
                                float mouseEffectStrength = smoothstep(uMouseRadius, 0.0, mouseDist) * uFisheyeIntensity * uMouseEffect;
                                vec2 mouseDistortion = normalize(uv - mousePos) * mouseEffectStrength;
                                finalUV += mouseDistortion;
                            }
                            
                            vec3 color;
                            
                            if (uFisheyeIntensity > 0.001) {
                                vec2 direction = normalize(finalUV - vec2(0.5));
                                float aberrationStrength = uChromaticAberration * uFisheyeIntensity;
                                
                                float r = sampleTextureSafe(uTexture, finalUV + direction * aberrationStrength).r;
                                float g = sampleTextureSafe(uTexture, finalUV).g;
                                float b = sampleTextureSafe(uTexture, finalUV - direction * aberrationStrength).b;
                                color = vec3(r, g, b);
                            } else {
                                color = sampleTextureSafe(uTexture, finalUV).rgb;
                            }
                            
                            if (uFisheyeIntensity > 0.001) {
                                float noise = fract(sin(dot(uv * uTime * 0.05, vec2(12.9898, 78.233))) * 43758.5453) * uNoiseIntensity * uFisheyeIntensity;
                                color += noise;
                            }
                            
                            float vignetteEffect = 1.0 - smoothstep(uVignetteStart, uVignetteEnd, distanceFromCenter) * uVignetteIntensity;
                            color *= vignetteEffect;
                            
                            gl_FragColor = vec4(color, 1.0);
                        }
                    `,
          transparent: true
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        updateCanvasSize();

        const resizeHandler = () => updateCanvasSize();
        resizeHandlers.set(canvas, resizeHandler);

        const resizeObserver = new ResizeObserver((entries) => {
          for (let entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
              updateCanvasSize();
            }
          }
        });
        resizeObserver.observe(canvas.parentElement || canvas);

        let animationId;
        let time = 0;
        let mouseX = 0;
        let mouseY = 0;

        const effect = {
          currentTween: null,
          _fisheyeIntensity: 0,
          material: material,
          start() {
            if (this.currentTween) this.currentTween.kill();
            this.currentTween = gsap.to(this, {
              _fisheyeIntensity: 1,
              duration: ANIMATION_TIMING.fisheye.start,
              ease: ANIMATION_TIMING.fisheye.ease,
              onComplete: () => (this.currentTween = null)
            });
          },
          startWithIntensity(intensity) {
            if (this.currentTween) this.currentTween.kill();
            this.currentTween = gsap.to(this, {
              _fisheyeIntensity: intensity,
              duration: ANIMATION_TIMING.fisheye.start,
              ease: ANIMATION_TIMING.fisheye.ease,
              onComplete: () => (this.currentTween = null)
            });
          },
          stop() {
            if (this.currentTween) this.currentTween.kill();
            this.currentTween = gsap.to(this, {
              _fisheyeIntensity: 0,
              duration: ANIMATION_TIMING.fisheye.stop,
              ease: ANIMATION_TIMING.fisheye.ease,
              onComplete: () => (this.currentTween = null)
            });
          },
          updateSettings(newSettings) {
            this.material.uniforms.uFisheyeStrength.value =
              newSettings.fisheyeStrength;
            this.material.uniforms.uVignetteStart.value =
              newSettings.vignetteStart;
            this.material.uniforms.uVignetteEnd.value = newSettings.vignetteEnd;
            this.material.uniforms.uFisheyeRadius.value =
              newSettings.fisheyeRadius;
            this.material.uniforms.uChromaticAberration.value =
              newSettings.chromaticAberration;
            this.material.uniforms.uNoiseIntensity.value =
              newSettings.noiseIntensity;
            this.material.uniforms.uVignetteIntensity.value =
              newSettings.vignetteIntensity;
            this.material.uniforms.uMouseEffect.value = newSettings.mouseEffect;
            this.material.uniforms.uMouseRadius.value = newSettings.mouseRadius;
            this.material.uniforms.uShowVignetteMask.value = newSettings.showVignetteMask
              ? 1.0
              : 0.0;
          },
          dispose() {
            if (this.currentTween) this.currentTween.kill();
            canvas.removeEventListener("mousemove", handleMouseMove);
            resizeHandlers.delete(canvas);
            resizeObserver.disconnect();
            if (animationId) cancelAnimationFrame(animationId);
            geometry.dispose();
            this.material.dispose();
            texture.dispose();
            renderer.dispose();
          }
        };

        const animate = () => {
          time += 0.016;
          material.uniforms.uTime.value = time;
          material.uniforms.uFisheyeIntensity.value = effect._fisheyeIntensity;
          material.uniforms.uMouse.value.set(mouseX, mouseY);
          renderer.render(scene, camera);
          animationId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e) => {
          const rect = canvas.getBoundingClientRect();
          mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        };

        canvas.addEventListener("mousemove", handleMouseMove);
        animate();
        allEffects.push(effect);
        resolve(effect);
      },
      undefined,
      (error) => {
        resolve(null);
      }
    );
  });
}

function toggleDebug() {
  const overlay = document.getElementById("debugOverlay");
  const toggle = document.getElementById("debugToggle");
  const columns = overlay?.querySelectorAll(".debug-column");

  if (overlay && toggle && columns) {
    if (overlay.classList.contains("active")) {
      gsap.to(columns, {
        duration: ANIMATION_TIMING.debug.duration,
        opacity: 0,
        scaleY: 0,
        stagger: 0.05,
        ease: ANIMATION_TIMING.debug.ease,
        onComplete: function () {
          overlay.classList.remove("active");
          toggle.classList.remove("active");
        }
      });
    } else {
      overlay.classList.add("active");
      toggle.classList.add("active");
      gsap.fromTo(
        columns,
        { opacity: 0, scaleY: 0, transformOrigin: "top" },
        {
          duration: ANIMATION_TIMING.debug.duration + 0.1,
          opacity: 1,
          scaleY: 1,
          stagger: 0.08,
          ease: "power2.out"
        }
      );
    }
  }
}

function togglePane() {
  const paneElement = document.querySelector(".tp-dfwv");
  if (paneElement) {
    paneElement.classList.toggle("visible");
  }
}

function createHoverAnimation(gridItem) {
  const img = gridItem.querySelector("img");
  const canvas = gridItem.querySelector(".threejs-canvas");
  const title = gridItem.querySelector(".image-title");

  let hoverTimeline = null;

  return {
    enter() {
      if (hoverTimeline) hoverTimeline.kill();
      hoverTimeline = gsap.timeline();

      hoverTimeline
        .to(
          img,
          {
            opacity: 0,
            duration: ANIMATION_TIMING.hover.duration,
            ease: ANIMATION_TIMING.hover.ease
          },
          0
        )
        .to(
          canvas,
          {
            opacity: 1,
            duration: ANIMATION_TIMING.hover.duration,
            ease: ANIMATION_TIMING.hover.ease
          },
          0
        )
        .to(
          title,
          {
            color: "#666",
            x: 12,
            "--before-opacity": 1,
            "--before-x": "0px",
            duration: ANIMATION_TIMING.title.duration,
            ease: ANIMATION_TIMING.title.ease
          },
          0
        );
    },
    leave() {
      if (hoverTimeline) hoverTimeline.kill();
      hoverTimeline = gsap.timeline();

      hoverTimeline
        .to(
          img,
          {
            opacity: 1,
            duration: ANIMATION_TIMING.hover.duration,
            ease: ANIMATION_TIMING.hover.ease
          },
          0
        )
        .to(
          canvas,
          {
            opacity: 0,
            duration: ANIMATION_TIMING.hover.duration,
            ease: ANIMATION_TIMING.hover.ease
          },
          0
        )
        .to(
          title,
          {
            color: "#1a1a1a",
            x: 0,
            "--before-opacity": 0,
            "--before-x": "-8px",
            duration: ANIMATION_TIMING.title.duration,
            ease: ANIMATION_TIMING.title.ease
          },
          0
        );
    }
  };
}

document.addEventListener("DOMContentLoaded", function () {
  const debugToggle = document.getElementById("debugToggle");
  if (debugToggle) {
    debugToggle.addEventListener("click", toggleDebug);
  }

  const imageBoxes = document.querySelectorAll(".image-box");
  imageBoxes.forEach(function (box) {
    const img = box.querySelector("img");
    const canvas = box.querySelector(".threejs-canvas");
    const gridItem = box.closest(".grid-item");

    if (img && canvas && gridItem) {
      let effect = null;
      let imageLoaded = false;
      let isHovered = false;

      const hoverAnimation = createHoverAnimation(gridItem);

      const checkImageLoaded = () => {
        if (img.complete && img.naturalWidth > 0) {
          imageLoaded = true;
        } else {
          img.addEventListener("load", () => (imageLoaded = true), {
            once: true
          });
        }
      };

      checkImageLoaded();

      const initializeEffect = () => {
        createVignetteFisheyeDistortion(canvas, img.src).then(
          (createdEffect) => {
            effect = createdEffect;
            if (effect) {
              allImageEffects.push({
                effect: effect,
                canvas: canvas,
                box: box,
                isHovered: false
              });
            }
          }
        );
      };

      const delay = box.closest(".grid-item-20") ? 150 : 50;

      if (imageLoaded) {
        setTimeout(initializeEffect, delay);
      } else {
        img.addEventListener(
          "load",
          () => {
            setTimeout(initializeEffect, delay);
          },
          { once: true }
        );
      }

      box.addEventListener("mouseenter", function () {
        isHovered = true;
        const effectData = allImageEffects.find((item) => item.box === box);
        if (effectData) effectData.isHovered = true;

        if (effect) effect.start();
        hoverAnimation.enter();
        this.style.zIndex = "20";
      });

      box.addEventListener("mouseleave", function () {
        isHovered = false;
        const effectData = allImageEffects.find((item) => item.box === box);
        if (effectData) effectData.isHovered = false;

        if (effect) effect.stop();
        hoverAnimation.leave();
        this.style.zIndex = "1";
      });
    }
  });
});

document.addEventListener("keydown", function (e) {
  if (e.key === "d" || e.key === "D") {
    toggleDebug();
  } else if (e.key === "h" || e.key === "H") {
    togglePane();
  }
});

window.addEventListener("beforeunload", () => {
  allEffects.forEach((effect) => {
    if (effect && effect.dispose) {
      effect.dispose();
    }
  });
  resizeHandlers.clear();
});

window.toggleDebug = toggleDebug;
let startClickSound,
  preloaderSound,
  scrollSound1,
  scrollSound2,
  scrollSound3,
  backgroundMusic;
let isBackgroundPlaying = true;
let currentSection = 1;
let isScrolling = false;
let circleTransitions = [];

function setupGeometricBackground() {
  const gridLinesGroup = document.getElementById("grid-lines");
  const circlesOutlineGroup = document.getElementById("circles-outline");
  const circlesFilledGroup = document.querySelector("#circles-filled > g");
  if (!gridLinesGroup || !circlesOutlineGroup || !circlesFilledGroup) return;

  const gridSpacing = 48;
  for (let i = 0; i <= 40; i++) {
    const vLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    vLine.setAttribute("class", "grid-line");
    vLine.setAttribute("x1", i * gridSpacing);
    vLine.setAttribute("y1", 0);
    vLine.setAttribute("x2", i * gridSpacing);
    vLine.setAttribute("y2", 1080);
    gridLinesGroup.appendChild(vLine);
    if (i <= 22) {
      const hLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      hLine.setAttribute("class", "grid-line");
      hLine.setAttribute("x1", 0);
      hLine.setAttribute("y1", i * gridSpacing);
      hLine.setAttribute("x2", 1920);
      hLine.setAttribute("y2", i * gridSpacing);
      gridLinesGroup.appendChild(hLine);
    }
  }

  const d = 80;
  const centerX = 960;
  const centerY = 540;
  circleTransitions = [
    {
      initial: { cx: centerX - 3 * d, cy: centerY, r: d * 0.8 },
      final: { cx: centerX, cy: centerY, r: 4 * d }
    },
    {
      initial: { cx: centerX + 3 * d, cy: centerY, r: d * 0.8 },
      final: { cx: centerX, cy: centerY, r: 4 * d }
    },
    {
      initial: { cx: centerX, cy: centerY - 3 * d, r: d * 0.8 },
      final: { cx: centerX, cy: centerY, r: 4 * d }
    },
    {
      initial: { cx: centerX, cy: centerY + 3 * d, r: d * 0.8 },
      final: { cx: centerX, cy: centerY, r: 4 * d }
    },
    {
      initial: { cx: centerX - 2 * d, cy: centerY - 2 * d, r: d * 0.6 },
      final: { cx: centerX, cy: centerY, r: 4 * d }
    },
    {
      initial: { cx: centerX + 2 * d, cy: centerY - 2 * d, r: d * 0.6 },
      final: { cx: centerX, cy: centerY, r: 4 * d }
    },
    {
      initial: { cx: centerX - 2 * d, cy: centerY + 2 * d, r: d * 0.6 },
      final: { cx: centerX, cy: centerY, r: 4 * d }
    },
    {
      initial: { cx: centerX + 2 * d, cy: centerY + 2 * d, r: d * 0.6 },
      final: { cx: centerX, cy: centerY, r: 4 * d }
    },
    {
      initial: { cx: centerX - 4 * d, cy: centerY, r: d * 0.4 },
      final: { cx: centerX, cy: centerY, r: 4 * d }
    },
    {
      initial: { cx: centerX + 4 * d, cy: centerY, r: d * 0.4 },
      final: { cx: centerX, cy: centerY, r: 4 * d }
    },
    {
      initial: { cx: centerX, cy: centerY - 4 * d, r: d * 0.4 },
      final: { cx: centerX, cy: centerY, r: 4 * d }
    },
    {
      initial: { cx: centerX, cy: centerY + 4 * d, r: d * 0.4 },
      final: { cx: centerX, cy: centerY, r: 4 * d }
    },
    {
      initial: { cx: centerX, cy: centerY, r: d * 0.3 },
      final: { cx: centerX, cy: centerY, r: 4 * d }
    }
  ];

  circleTransitions.forEach((transition, index) => {
    const circleOutline = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circleOutline.setAttribute("class", "circle-outline");
    circleOutline.setAttribute("cx", transition.initial.cx);
    circleOutline.setAttribute("cy", transition.initial.cy);
    circleOutline.setAttribute("r", transition.initial.r);
    circlesOutlineGroup.appendChild(circleOutline);

    const circleFilled = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circleFilled.setAttribute("class", "circle-filled");
    circleFilled.setAttribute("cx", transition.initial.cx);
    circleFilled.setAttribute("cy", transition.initial.cy);
    circleFilled.setAttribute("r", transition.initial.r);
    circlesFilledGroup.appendChild(circleFilled);

    transition.outlineCircle = circleOutline;
    transition.filledCircle = circleFilled;
  });
}

document.getElementById("enableBtn").onclick = function () {
  document.body.classList.add("loading-active");
  startClickSound = document.getElementById("startClickSound");
  preloaderSound = document.getElementById("preloaderSound");
  scrollSound1 = document.getElementById("scrollSound1");
  scrollSound2 = document.getElementById("scrollSound2");
  scrollSound3 = document.getElementById("scrollSound3");
  backgroundMusic = document.getElementById("backgroundMusic");

  if (startClickSound) startClickSound.play().catch((e) => {});
  document.querySelector(".audio-enable").style.display = "none";
  document.getElementById("preloader").style.display = "flex";
  if (preloaderSound) preloaderSound.play().catch((e) => {});

  setTimeout(() => {
    if (backgroundMusic) {
      backgroundMusic.volume = 0.5;
      backgroundMusic.play().catch((e) => {});
    }
  }, 500);

  let count = 0;
  const timer = setInterval(() => {
    count++;
    document.getElementById(
      "counter"
    ).textContent = `[${count.toString().padStart(3, "0")}]`;
    if (count >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        if (preloaderSound) {
          preloaderSound.pause();
          preloaderSound.currentTime = 0;
        }
        document.body.classList.remove("loading-active");
        setupGeometricBackground();
        startAnimations();
        setupSectionScrollSounds();
      }, 500);
    }
  }, 50);
};

function setupSectionScrollSounds() {
  let scrollTimeout;

  function getCurrentSection() {
    const scrollY = window.scrollY;
    const sectionHeight = window.innerHeight * 2;
    if (scrollY < sectionHeight) return 1;
    else if (scrollY < sectionHeight * 2) return 2;
    else return 3;
  }

  function stopAllScrollSounds() {
    [scrollSound1, scrollSound2, scrollSound3].forEach((sound) => {
      if (sound && !sound.paused) {
        sound.pause();
        sound.currentTime = 0;
      }
    });
  }

  window.addEventListener("scroll", () => {
    const newSection = getCurrentSection();
    isScrolling = true;
    if (newSection !== currentSection) {
      stopAllScrollSounds();
      currentSection = newSection;
    }
    const currentScrollSound = eval(`scrollSound${currentSection}`);
    if (currentScrollSound && currentScrollSound.paused) {
      currentScrollSound.currentTime = 0;
      currentScrollSound.play().catch((e) => {});
    }
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      stopAllScrollSounds();
      isScrolling = false;
    }, 150);
  });
}

function startAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll(".main-nav li").forEach((navItem) => {
    const square = navItem.querySelector(".nav-hover-square");
    const hoverSound = document.getElementById("hoverSound");
    navItem.addEventListener("mouseenter", () => {
      gsap.to(square, { scaleX: 1, duration: 0.3, ease: "power2.out" });
      if (hoverSound) {
        hoverSound.currentTime = 0;
        hoverSound.volume = 0.3;
        hoverSound.play().catch((e) => {});
      }
    });
    navItem.addEventListener("mouseleave", () => {
      gsap.to(square, { scaleX: 0, duration: 0.2, ease: "power2.in" });
    });
  });

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

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  gsap.to(".gradient-reveal", {
    y: "-500vh",
    duration: 2,
    ease: "power2.inOut",
    delay: 0.25
  });
  gsap.to(".preloader", {
    y: -50,
    opacity: 0,
    duration: 0.8,
    ease: "power2.inOut",
    delay: 1.0,
    onComplete: () => {
      document.getElementById("preloader").style.display = "none";
    }
  });

  gsap.utils.toArray(".section").forEach((section) => {
    gsap.to(section, {
      backgroundPositionY: "50%",
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1
      }
    });
  });

  const circle = document.getElementById("glowCircle");
  const debugLine1 = document.getElementById("debugLine1");
  const debugLine2 = document.getElementById("debugLine2");
  const debugLine3 = document.getElementById("debugLine3");
  const debugLine4 = document.getElementById("debugLine4");
  if (!circle) return;

  let animationFrame;
  function updateAnimations() {
    const scrollY = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const progress = Math.min(scrollY / maxScroll, 1);

    const footerStart =
      document.querySelector(".site-footer").offsetTop - window.innerHeight;
    const footerProgress = Math.max(
      0,
      (scrollY - footerStart) / (window.innerHeight * 0.5)
    );
    const textOpacity = Math.max(0, 1 - footerProgress * 2);
    document.querySelectorAll(".geometric-text").forEach((text) => {
      text.style.opacity = textOpacity;
    });

    const freq1 = (432 + progress * 108).toFixed(1);
    const freq2 = (528 - progress * 156).toFixed(1);
    const energy = (progress * 99.9).toFixed(1);
    const presence = ((1 - progress) * 100).toFixed(1);

    let awarenessState, becomingState, energyState, presenceState;
    if (progress <= 0.1) {
      awarenessState = `[${freq1}] AWARENESS: SILENCE`;
      becomingState = `.${freq2} STATE: VOID`;
      energyState = `{${energy}} ENERGY: DORMANT`;
    } else if (progress <= 0.25) {
      awarenessState = `[${freq1}] AWARENESS: STIRRING`;
      becomingState = `.${freq2} STATE: EMERGING`;
      energyState = `{${energy}} ENERGY: AWAKENING`;
    } else if (progress <= 0.5) {
      awarenessState = `[${freq1}] AWARENESS: FLOWING`;
      becomingState = `.${freq2} STATE: EXPANDING`;
      energyState = `{${energy}} ENERGY: BUILDING`;
    } else if (progress <= 0.75) {
      awarenessState = `[${freq1}] AWARENESS: ASCENDING`;
      becomingState = `.${freq2} STATE: DISSOLVING`;
      energyState = `{${energy}} ENERGY: RADIATING`;
    } else if (progress <= 0.9) {
      awarenessState = `[${freq1}] AWARENESS: TRANSCENDING`;
      becomingState = `.${freq2} STATE: INFINITE`;
      energyState = `{${energy}} ENERGY: OVERFLOWING`;
    } else {
      awarenessState = `[${freq1}] AWARENESS: UNITY`;
      becomingState = `.${freq2} STATE: ETERNAL`;
      energyState = `{${energy}} ENERGY: PURE`;
    }

    const presenceIntensity = Math.max(0, 1 - progress);
    if (presenceIntensity > 0.8) {
      presenceState = `.${presence} PRESENCE: SOLID`;
    } else if (presenceIntensity > 0.6) {
      presenceState = `.${presence} PRESENCE: SOFTENING`;
    } else if (presenceIntensity > 0.4) {
      presenceState = `.${presence} PRESENCE: TRANSLUCENT`;
    } else if (presenceIntensity > 0.2) {
      presenceState = `.${presence} PRESENCE: ETHEREAL`;
    } else {
      presenceState = `.${presence} PRESENCE: VOID`;
    }

    const scale = 1 + progress * 1.8;
    const shadowSize = progress * 150;
    const shadowSpread = progress * 35;
    const shadowOpacity = progress;
    circle.style.transform = `scale(${scale})`;
    circle.style.transformOrigin = "center center";
    circle.style.boxShadow = `0 0 ${shadowSize}px ${shadowSpread}px rgba(255, 255, 0, ${shadowOpacity})`;

    const gridOpacity = Math.max(0, 0.3 * (1 - progress * 1.5));
    document.querySelectorAll(".grid-line").forEach((line) => {
      line.setAttribute("stroke-opacity", gridOpacity);
    });

    circleTransitions.forEach((transition, index) => {
      const currentCx =
        transition.initial.cx +
        (transition.final.cx - transition.initial.cx) * progress;
      const currentCy =
        transition.initial.cy +
        (transition.final.cy - transition.initial.cy) * progress;
      const currentR =
        transition.initial.r +
        (transition.final.r - transition.initial.r) * progress;
      const rotation = progress * 360 * (index % 2 === 0 ? 1 : -1);
      const opacity = Math.max(0.1, 1 - progress * 0.7);

      if (transition.outlineCircle) {
        transition.outlineCircle.setAttribute("cx", currentCx);
        transition.outlineCircle.setAttribute("cy", currentCy);
        transition.outlineCircle.setAttribute("r", currentR);
        transition.outlineCircle.setAttribute(
          "transform",
          `rotate(${rotation} ${currentCx} ${currentCy})`
        );
        transition.outlineCircle.setAttribute("stroke-opacity", opacity);
      }
      if (transition.filledCircle) {
        transition.filledCircle.setAttribute("cx", currentCx);
        transition.filledCircle.setAttribute("cy", currentCy);
        transition.filledCircle.setAttribute("r", currentR);
        transition.filledCircle.setAttribute(
          "transform",
          `rotate(${rotation} ${currentCx} ${currentCy})`
        );
        transition.filledCircle.setAttribute("fill-opacity", opacity * 0.05);
      }
    });

    if (debugLine1) debugLine1.textContent = awarenessState;
    if (debugLine2) debugLine2.textContent = becomingState;
    if (debugLine3) debugLine3.textContent = energyState;
    if (debugLine4) debugLine4.textContent = presenceState;
  }

  window.addEventListener("scroll", () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(updateAnimations);
  });
  updateAnimations();
}
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lenis for smooth scrolling
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

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  // GSAP animation for middle box
  const middleBox = document.getElementById("middle-box");
  const circleSvg = document.getElementById("circle-svg");

  // Direct hover animations without timeline
  middleBox.addEventListener("mouseenter", () => {
    gsap.to(middleBox, {
      padding: "25px",
      duration: 0.6,
      ease: "elastic.out(0.3, 0.3)",
      overwrite: true
    });

    gsap.to(circleSvg, {
      scale: 2,
      duration: 0.7,
      ease: "elastic.out(0.2, 0.1)",
      overwrite: true,
      transformOrigin: "center center"
    });
  });

  middleBox.addEventListener("mouseleave", () => {
    gsap.to(middleBox, {
      padding: "20px",
      duration: 0.2,
      ease: "power2.out",
      overwrite: true
    });

    gsap.to(circleSvg, {
      scale: 1,
      duration: 0.2,
      ease: "power3.out",
      overwrite: true
    });
  });

  // Debug button
  const debug = document.createElement("button");
  debug.textContent = "Debug";
  debug.style.position = "fixed";
  debug.style.bottom = "20px";
  debug.style.right = "20px";
  debug.style.zIndex = "1000";

  debug.addEventListener("click", () => {
    document.documentElement.dataset.debug = document.documentElement.matches(
      '[data-debug="true"]'
    )
      ? "false"
      : "true";
  });

  document.body.appendChild(debug);

  // Fix header height issue
  const updateHeaderHeight = () => {
    const header = document.getElementById("site-header");
    const headerHeight = header.offsetHeight;
    document.documentElement.style.setProperty(
      "--header-height",
      `${headerHeight}px`
    );
  };

  // Run on load and resize
  updateHeaderHeight();
  window.addEventListener("resize", updateHeaderHeight);
});
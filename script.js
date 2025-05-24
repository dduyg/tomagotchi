// Initialize Lenis for smooth scrolling with GSAP integration
const lenis = new Lenis();

// Synchronize Lenis scrolling with ScrollTrigger plugin
lenis.on("scroll", (e) => {
  ScrollTrigger.update();

  // Update scroll progress indicator
  const scrollHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  const scrollTop = window.scrollY;
  const scrollPercentage = (scrollTop / scrollHeight) * 100;
  document.querySelector(
    ".scroll-indicator"
  ).style.width = `${scrollPercentage}%`;
});

// Add Lenis's requestAnimationFrame (raf) method to GSAP's ticker
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

// Disable lag smoothing in GSAP
gsap.ticker.lagSmoothing(0);

// GSAP animations
document.addEventListener("DOMContentLoaded", () => {
  // Register plugins
  gsap.registerPlugin(ScrollTrigger, CustomEase);

  // Custom eases based on article
  CustomEase.create("verticalEase", "0.4, 0, 0.2, 1");
  CustomEase.create("blurEase", "0.65, 0, 0.35, 1");
  // Create a more pronounced easing for the SVG animation
  CustomEase.create("svgEase", "0.25, 0.1, 0.25, 1");

  // Hero animations with blur effect
  gsap.to(".hero-image", {
    scrollTrigger: {
      trigger: ".hero",
      start: "top bottom",
      end: "center center",
      scrub: true
    },
    scale: 1,
    opacity: 1,
    filter: "blur(0px)",
    duration: 1.5,
    ease: "blurEase"
  });

  gsap.to(".about-text", {
    scrollTrigger: {
      trigger: ".hero",
      start: "top bottom",
      end: "center center",
      scrub: true
    },
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    duration: 1,
    ease: "verticalEase"
  });

  // Gallery animations using clip-path for vertical transitions
  const galleryItems = document.querySelectorAll(".gallery-item img");

  galleryItems.forEach((item, index) => {
    gsap
      .timeline({
        scrollTrigger: {
          trigger: item.parentElement,
          start: "top bottom-=100",
          end: "bottom top+=100",
          toggleActions: "play none none reverse"
        }
      })
      .fromTo(
        item,
        { clipPath: "inset(100% 0 0 0)" },
        {
          clipPath: "inset(0% 0 0 0)",
          duration: 1.2,
          delay: index * 0.1,
          ease: "verticalEase"
        }
      );
  });

  // Gallery caption animation with blur
  gsap.to(".gallery-caption", {
    scrollTrigger: {
      trigger: ".gallery",
      start: "top bottom",
      end: "center center",
      toggleActions: "play none none reverse",
      scrub: true
    },
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    duration: 1,
    ease: "blurEase"
  });

  // ===== ENHANCED FOOTER SVG ANIMATION =====
  const footerPaths = document.querySelectorAll(".footer-svg-paths path");

  // Make sure paths are hidden initially with varying starting positions
  footerPaths.forEach((path, index) => {
    // Create varying starting positions for more dynamic staggering
    const startY = 50 + Math.random() * 30; // Random starting Y between 50-80px
    gsap.set(path, {
      opacity: 0,
      y: startY,
      filter: "blur(8px)"
    });
  });

  // Create a marker to track if animation has run
  let footerAnimated = false;

  // Create a timeline for the animation with enhanced staggering
  const footerTl = gsap.timeline({ paused: true });

  // Add each path to the timeline with individual animations
  footerPaths.forEach((path, index) => {
    // Calculate a stagger delay that creates a wave-like effect
    const staggerDelay = index * 0.08; // Increased stagger time

    footerTl.to(
      path,
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.4, // Longer duration for more visible animation
        ease: "svgEase", // Custom ease for more pronounced movement
        delay: staggerDelay
      },
      0
    ); // The "0" means all animations start at the beginning of the timeline
  });

  // Create a scroll listener that will check if footer is in view
  function checkFooterInView() {
    if (footerAnimated) return;

    const footer = document.querySelector(".footer");
    const rect = footer.getBoundingClientRect();

    // If footer is in view
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      footerTl.play();
      footerAnimated = true;

      // Remove this listener once animation has played
      window.removeEventListener("scroll", checkFooterInView);
    }
  }

  // Add scroll listener
  window.addEventListener("scroll", checkFooterInView);

  // Check on page load after a small delay
  setTimeout(checkFooterInView, 100);

  // Also use ScrollTrigger as a backup
  ScrollTrigger.create({
    trigger: ".footer",
    start: "top bottom-=100",
    onEnter: function () {
      if (!footerAnimated) {
        footerTl.play();
        footerAnimated = true;
      }
    },
    onLeaveBack: function () {
      if (footerAnimated) {
        footerTl.reverse();
        footerAnimated = false;
      }
    }
  });

  // Footer CTA button animation
  gsap.to(".footer-cta", {
    scrollTrigger: {
      trigger: ".footer",
      start: "top bottom-=200",
      end: "center center",
      toggleActions: "play none none reverse"
    },
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    duration: 1.2,
    ease: "verticalEase"
  });

  // Menu hover effects with directional animation
  const navLinks = document.querySelectorAll(".nav-links a");

  navLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => {
      gsap.to(link, {
        filter: "blur(0px)",
        duration: 0.3,
        ease: "verticalEase"
      });
    });

    link.addEventListener("mouseleave", () => {
      gsap.to(link, {
        filter: "blur(1px)",
        duration: 0.3,
        ease: "verticalEase"
      });
    });
  });
});
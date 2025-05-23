document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container");
  const scroller = document.querySelector(".scroller");
  const bottomProgressFill = document.querySelector(".bottom-progress-fill");
  const bottomProgressPercent = document.querySelector(
    ".bottom-progress-percent"
  );
  const sections = document.querySelectorAll(".section");

  // Constants
  const SMOOTH_FACTOR = 0.05;
  const TOUCH_SENSITIVITY = 2.5;

  // State variables
  let targetScrollY = 0;
  let currentScrollY = 0;
  let lastScrollY = 0;
  let isAnimating = false;
  let currentProgressScale = 0;
  let targetProgressScale = 0;
  let lastPercentage = 0;

  // Touch variables
  let isDown = false;
  let lastTouchY = 0;
  let touchVelocity = 0;
  let lastTouchTime = 0;

  // Helper functions
  const lerp = (start, end, factor) => start + (end - start) * factor;
  const roundToTwo = (num) => Math.round(num * 100) / 100;

  // Get dimensions
  const getSectionHeight = () => window.innerHeight;
  const getSequenceHeight = () => getSectionHeight() * 4; // 4 sections per sequence

  // Initialize position
  const initPosition = () => {
    const sequenceHeight = getSequenceHeight();
    targetScrollY = sequenceHeight; // Start at the second sequence
    currentScrollY = targetScrollY;
    lastScrollY = currentScrollY;
    scroller.style.transform = `translateY(-${currentScrollY}px)`;
  };

  // Check boundaries and loop if needed
  const checkBoundaries = () => {
    const sequenceHeight = getSequenceHeight();
    const threshold = getSectionHeight() / 2;

    // If scrolled too far down
    if (currentScrollY > sequenceHeight * 2 - threshold) {
      // Jump back one sequence
      targetScrollY -= sequenceHeight;
      currentScrollY -= sequenceHeight;
      lastScrollY = currentScrollY;
      scroller.style.transform = `translateY(-${currentScrollY}px)`;
      return true;
    }

    // If scrolled too far up
    if (currentScrollY < sequenceHeight - threshold) {
      // Jump forward one sequence
      targetScrollY += sequenceHeight;
      currentScrollY += sequenceHeight;
      lastScrollY = currentScrollY;
      scroller.style.transform = `translateY(-${currentScrollY}px)`;
      return true;
    }

    return false;
  };

  // Update progress indicators
  const updateProgress = () => {
    const sequenceHeight = getSequenceHeight();
    const position = currentScrollY % sequenceHeight;
    const percentage = (position / sequenceHeight) * 100;

    // Update bottom progress percentage
    bottomProgressPercent.textContent = `${Math.round(percentage)}%`;

    // Update progress bar targets
    targetProgressScale = percentage / 100;

    // Handle wrap-around for smooth transitions
    if (
      (lastPercentage > 80 && percentage < 20) ||
      (lastPercentage < 20 && percentage > 80)
    ) {
      currentProgressScale = targetProgressScale;
      bottomProgressFill.style.transform = `scaleX(${currentProgressScale})`;
    }

    lastPercentage = percentage;
  };

  // Animation loop
  const animate = () => {
    // Apply smooth scrolling
    currentScrollY = lerp(currentScrollY, targetScrollY, SMOOTH_FACTOR);
    scroller.style.transform = `translateY(-${roundToTwo(currentScrollY)}px)`;

    // Check boundaries and update progress
    const didReset = checkBoundaries();
    if (!didReset) {
      updateProgress();
    }

    // Smooth progress bar animation
    currentProgressScale = lerp(
      currentProgressScale,
      targetProgressScale,
      SMOOTH_FACTOR
    );
    bottomProgressFill.style.transform = `scaleX(${roundToTwo(
      currentProgressScale
    )})`;

    // Continue animation if needed
    if (
      Math.abs(targetScrollY - currentScrollY) > 0.01 ||
      Math.abs(targetProgressScale - currentProgressScale) > 0.001
    ) {
      requestAnimationFrame(animate);
    } else {
      // Keep animation running at a lower rate
      setTimeout(() => {
        if (!isAnimating) {
          isAnimating = true;
          requestAnimationFrame(animate);
        }
      }, 100);
      isAnimating = false;
    }
  };

  // Start animation if not already running
  const startAnimation = () => {
    if (!isAnimating) {
      isAnimating = true;
      requestAnimationFrame(animate);
    }
  };

  // Initialize
  initPosition();
  updateProgress();

  // Wheel event handler with debounce
  let wheelTimeout;
  const handleWheel = (e) => {
    e.preventDefault();

    // Add to target scroll position
    targetScrollY += e.deltaY;

    // Clear previous timeout
    clearTimeout(wheelTimeout);

    // Start animation
    startAnimation();

    // Set a timeout to ensure animation continues briefly after scrolling stops
    wheelTimeout = setTimeout(() => {
      startAnimation();
    }, 100);
  };

  // Touch event handlers
  const handleTouchStart = (e) => {
    isDown = true;
    lastTouchY = e.touches[0].clientY;
    lastTouchTime = Date.now();
  };

  const handleTouchMove = (e) => {
    if (!isDown) return;
    e.preventDefault();

    const currentTouchY = e.touches[0].clientY;
    const touchDelta = lastTouchY - currentTouchY;

    // Adjust sensitivity based on screen size
    const sensitivity =
      window.innerWidth < 768 ? TOUCH_SENSITIVITY * 1.5 : TOUCH_SENSITIVITY;

    targetScrollY += touchDelta * sensitivity;

    const currentTime = Date.now();
    const timeDelta = currentTime - lastTouchTime;
    if (timeDelta > 0) {
      touchVelocity = (touchDelta / timeDelta) * 15;
    }

    lastTouchY = currentTouchY;
    lastTouchTime = currentTime;

    startAnimation();
  };

  const handleTouchEnd = () => {
    isDown = false;

    if (Math.abs(touchVelocity) > 0.1) {
      // Adjust inertia based on screen size
      const inertiaFactor = window.innerWidth < 768 ? 15 : 20;

      targetScrollY += touchVelocity * inertiaFactor;

      const decayVelocity = () => {
        touchVelocity *= 0.95;

        if (Math.abs(touchVelocity) > 0.1) {
          targetScrollY += touchVelocity;
          requestAnimationFrame(decayVelocity);
        }
      };

      requestAnimationFrame(decayVelocity);
    }

    // Ensure animation continues briefly after touch ends
    setTimeout(() => {
      startAnimation();
    }, 100);
  };

  // Add event listeners
  container.addEventListener("wheel", handleWheel, { passive: false });
  container.addEventListener("touchstart", handleTouchStart, { passive: true });
  container.addEventListener("touchmove", handleTouchMove, { passive: false });
  container.addEventListener("touchend", handleTouchEnd, { passive: true });

  // Handle orientation change and resize
  const handleResize = () => {
    // Recalculate and reset
    initPosition();
    updateProgress();

    // Ensure animation runs after resize
    startAnimation();
  };

  window.addEventListener("resize", handleResize);
  window.addEventListener("orientationchange", handleResize);

  // Force initial animation to ensure everything is positioned correctly
  startAnimation();
});
// Setup canvas and context
const canvas = document.getElementById("space");
const ctx = canvas.getContext("2d");
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
// Starfield settings
const numStars = 1900;
const focalLength = canvas.width * 2;
let centerX = canvas.width / 2;
let centerY = canvas.height / 2;
const baseTrailLength = 2;
const maxTrailLength = 30;
// Stars array
let stars = [];
// Animation control
let warpSpeed = 0;
let animationActive = true;
// Initialize stars
function initializeStars() {
  stars = [];
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * canvas.width,
      o: 0.5 + Math.random() * 0.5,
      trail: []
    });
  }
}
// Update star positions
function moveStars() {
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    // Move star based on warp speed - always forward
    const speed = 1 + warpSpeed * 50;
    star.z -= speed;
    // Reset star position when it passes the viewer
    if (star.z < 1) {
      star.z = canvas.width;
      star.x = Math.random() * canvas.width;
      star.y = Math.random() * canvas.height;
      star.trail = [];
    }
  }
}
// Draw stars and their trails
function drawStars() {
  // Resize canvas if needed
  if (
    canvas.width !== canvas.offsetWidth ||
    canvas.height !== canvas.offsetHeight
  ) {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
  }
  // Calculate trail length based on warp speed
  const trailLength = Math.floor(
    baseTrailLength + warpSpeed * (maxTrailLength - baseTrailLength)
  );
  // Clear canvas with fade effect based on warp speed
  const clearAlpha = 1 - warpSpeed * 0.8;
  ctx.fillStyle = `rgba(17,17,17,${clearAlpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw stars and trails
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    // Calculate screen position with perspective
    const px = (star.x - centerX) * (focalLength / star.z) + centerX;
    const py = (star.y - centerY) * (focalLength / star.z) + centerY;
    // Add position to trail
    star.trail.push({
      x: px,
      y: py
    });
    if (star.trail.length > trailLength) {
      star.trail.shift();
    }
    // Draw trail
    if (star.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(star.trail[0].x, star.trail[0].y);
      for (let j = 1; j < star.trail.length; j++) {
        ctx.lineTo(star.trail[j].x, star.trail[j].y);
      }
      ctx.strokeStyle = `rgba(209,255,255,${star.o})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Draw star
    ctx.fillStyle = `rgba(209,255,255,${star.o})`;
    ctx.fillRect(px, py, 1, 1);
  }
}
// Animation loop
function animate() {
  if (animationActive) {
    requestAnimationFrame(animate);
    moveStars();
    drawStars();
  }
}
// Initialize and start animation
initializeStars();
animate();
// GSAP ScrollTrigger setup
gsap.registerPlugin(ScrollTrigger);
// Create a timeline for the warp effect
const warpTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: "#stickyContainer",
    start: "top top",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) => {
      const progress = self.progress;
      // 0-300vh (0-60%): Ramp up warp effect
      if (progress <= 0.6) {
        warpSpeed = progress / 0.6; // 0 to 1
      }
      // 300-400vh (60-80%): Maintain full warp
      else if (progress <= 0.8) {
        warpSpeed = 1; // Full warp
      }
      // 400-500vh (80-100%): Decrease warp effect
      else {
        warpSpeed = 1 - (progress - 0.8) / 0.2; // 1 to 0
      }
    }
  }
});
// Enhanced text animation with blur and better easing
const textTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: "#stickyContainer",
    start: "12% top", // Start slightly earlier for a longer animation
    end: "20% top", // End a bit later for a smoother animation
    scrub: 0.8 // Add slight smoothing to the scrub for more natural movement
  }
});
// Add enhanced text animation with multi-step sequence
textTimeline.to("#animatedText", {
  opacity: 1, // Full opacity
  y: 0, // Final position
  filter: "blur(0px)", // No blur
  duration: 0.4,
  ease: "power3.out" // Ease out for a soft landing
});
// Create a timeline for the exit effect
const exitTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: "#stickyContainer",
    start: "bottom 20%", // Start when the bottom of the container is 20% from the top
    end: "bottom -10%", // End when it's 10% past the top
    scrub: true
  }
});
// Add enhanced exit animations with blur
exitTimeline.to(
  "#animatedText",
  {
    opacity: 0,
    y: -20,
    filter: "blur(8px)",
    duration: 0.4,
    ease: "power2.in"
  },
  0
);
exitTimeline.to(
  "#webglSection",
  {
    opacity: 0,
    scale: 0.95,
    ease: "power2.inOut"
  },
  0.1
); // Slight delay after text starts fading
// Animate the additional content section when it comes into view
const additionalContentTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: "#additionalSection",
    start: "top 80%",
    toggleActions: "play none none none"
  }
});
additionalContentTimeline.to("#additionalContent", {
  opacity: 1,
  y: 0,
  duration: 1,
  ease: "power2.out"
});
// Handle visibility - stop animation when out of view
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      // Only run animation when section is visible
      if (entry.isIntersecting) {
        if (!animationActive) {
          animationActive = true;
          animate();
        }
      } else {
        animationActive = false;
      }
    });
  },
  {
    threshold: 0
  }
);
observer.observe(document.getElementById("stickyContainer"));
// Handle window resize
window.addEventListener("resize", () => {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  centerX = canvas.width / 2;
  centerY = canvas.height / 2;
});
// Create grid of star symbols with improved reactivity
const dotGrid = document.getElementById("dotGrid");
const gridWidth = dotGrid.offsetWidth;
const gridHeight = dotGrid.offsetHeight;
// Increase rows by 25%
const originalHeight = 150;
const increasedHeight = originalHeight * 1.25;
dotGrid.style.height = `${increasedHeight}px`;
// Calculate exact spacing to fit perfectly, accounting for container padding
const containerPadding = 2 * 16; // 2rem padding converted to pixels
const fullWidth = window.innerWidth; // Full window width
// Calculate number of columns to span the entire width including padding
const desiredCols = Math.ceil(fullWidth / 20); // Approximate number of columns
const desiredRows = Math.ceil(increasedHeight / 20); // Approximate number of rows
// Calculate exact spacing to fit perfectly
const spacingX = fullWidth / (desiredCols - 1);
const spacingY = increasedHeight / (desiredRows - 1);
// Create dots with extended width to cover the entire viewport
function createDotGrid() {
  dotGrid.innerHTML = "";
  for (let y = 0; y < desiredRows; y++) {
    for (let x = 0; x < desiredCols; x++) {
      const dot = document.createElement("div");
      dot.className = "dot";
      dot.textContent = "✦"; // Star symbol
      // Position dots relative to the container but extend beyond its padding
      const xPos = x * spacingX - containerPadding;
      dot.style.left = `${xPos}px`;
      dot.style.top = `${y * spacingY}px`;
      dotGrid.appendChild(dot);
    }
  }
}
createDotGrid();
// Improved mouse proximity effect with better reactivity for fast movements
let lastMouseX = 0;
let lastMouseY = 0;
let isMouseMoving = false;
let mouseTimeout;
// Track mouse movement
dotGrid.addEventListener("mousemove", (e) => {
  const rect = dotGrid.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  // Set flag for mouse movement
  isMouseMoving = true;
  clearTimeout(mouseTimeout);
  // Update dots based on current mouse position
  updateDots(mouseX, mouseY);
  // Store last position
  lastMouseX = mouseX;
  lastMouseY = mouseY;
  // Set timeout to detect when mouse stops
  mouseTimeout = setTimeout(() => {
    isMouseMoving = false;
  }, 100);
});
// Function to update dots with improved performance
function updateDots(mouseX, mouseY) {
  const dots = document.querySelectorAll(".dot");
  // Calculate velocity for more responsive effect during fast movements
  const velocity = isMouseMoving ? 1.5 : 1;
  const maxDistance = isMouseMoving ? 150 : 100; // Larger radius when moving fast
  dots.forEach((dot) => {
    const dotX = parseInt(dot.style.left) + containerPadding; // Adjust for the offset
    const dotY = parseInt(dot.style.top);
    // Calculate distance from mouse to dot
    const distance = Math.sqrt(
      Math.pow(mouseX - dotX, 2) + Math.pow(mouseY - dotY, 2)
    );
    // Improved reactivity with larger radius and more intense effect
    if (distance < maxDistance) {
      // Calculate intensity based on distance (closer = more intense)
      // More pronounced effect with velocity factor
      const intensity = Math.pow(1 - distance / maxDistance, 1.5) * velocity;
      // Apply color and scaling based on intensity
      dot.style.color = `rgba(255, 255, 255, ${Math.min(intensity, 1)})`;
      // Add subtle movement away from cursor
      const angle = Math.atan2(dotY - mouseY, dotX - mouseX);
      const pushDistance = intensity * 12; // Increased movement for better visibility
      const newX = Math.cos(angle) * pushDistance;
      const newY = Math.sin(angle) * pushDistance;
      // Apply transform with scale for better visibility
      dot.style.transform = `translate(${newX}px, ${newY}px) scale(${
        1 + intensity * 1.2
      })`;
    } else {
      dot.style.color = "#444";
      dot.style.transform = "none";
    }
  });
}
// Reset dots when mouse leaves grid
dotGrid.addEventListener("mouseleave", () => {
  const dots = document.querySelectorAll(".dot");
  dots.forEach((dot) => {
    dot.style.color = "#444";
    dot.style.transform = "none";
  });
});
// Handle window resize for dot grid
window.addEventListener("resize", createDotGrid);
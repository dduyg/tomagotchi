// Apply SplitType to split the text into characters
document.querySelectorAll(".nav-link").forEach((link) => {
  // Split the text inside each nav-link into characters
  new SplitType(link, { types: "chars" });
  const chars = link.querySelectorAll(".char");
  let animationInProgress = false;

  // Function to handle hover logic for letters
  chars.forEach((char, index) => {
    char.addEventListener("mouseenter", () => {
      if (animationInProgress) return; // Prevent triggering animation while another is in progress
      animationInProgress = true;

      // Kill any existing animations to prevent overlap
      gsap.killTweensOf(chars);

      // Animate from hovered character to the outside
      chars.forEach((otherChar, otherIndex) => {
        const distance = Math.abs(index - otherIndex); // Distance from the hovered character
        const delay = distance * 0.05; // Delay for the wave effect

        // Calculate scale and opacity based on distance
        const scale = distance === 0 ? 1 : 1 + (3 - distance) * 0.05;
        const opacity = Math.max(0, 1 - distance * 0.2);

        // Apply the wave animation from center to outside
        gsap.to(otherChar, {
          opacity: opacity,
          scale: scale,
          duration: 0.3,
          delay: delay,
          ease: "power2.out",
          transformOrigin: "center center"
        });
      });

      // Reverse the animation from outside back to the hovered character
      chars.forEach((otherChar, otherIndex) => {
        const distance = Math.abs(index - otherIndex);
        const delay = 0.3 + distance * 0.05; // Delay for the reverse wave effect

        gsap.to(otherChar, {
          opacity: 1,
          scale: 1,
          duration: 0.1,
          delay: delay,
          ease: "power2.in",
          transformOrigin: "center center",
          onComplete: () => {
            if (otherIndex === chars.length - 1) {
              animationInProgress = false; // Allow new animations after the current one completes
            }
          }
        });
      });
    });
  });

  // Handle mouse leave to reset all characters
  link.addEventListener("mouseleave", () => {
    gsap.killTweensOf(chars);
    gsap.to(chars, {
      opacity: 1, // Reset opacity to 1
      scale: 1, // Reset scale to default
      duration: 0.6, // Smooth transition back
      ease: "power2.inOut",
      transformOrigin: "center center"
    });
    animationInProgress = false; // Allow new animations after mouse leaves
  });
});
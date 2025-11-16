const hoverIndicator = document.getElementById("hoverIndicator");

hoverIndicator.addEventListener("mousemove", (event) => {
  const rect = hoverIndicator.getBoundingClientRect();
  const mouseY = event.clientY - rect.top;
  const containers = hoverIndicator.children;
  const containerHeight = rect.height / containers.length;

  // Adjusting activeIndex calculation
  let activeIndex = Math.floor(mouseY / containerHeight);
  activeIndex = Math.max(0, Math.min(activeIndex, containers.length - 1));

  // Adjust for edge cases (hovering near the bottom or top)
  if (mouseY > rect.height - containerHeight / 2) {
    activeIndex = containers.length - 1;
  } else if (mouseY < containerHeight / 2) {
    activeIndex = 0;
  }

  Array.from(containers).forEach((container, index) => {
    const distanceFromActive = Math.abs(index - activeIndex);
    const maxScaleDistance = 2; // How many elements away should still be scaled

    let scale;
    if (distanceFromActive === 0) {
      scale = 1.75; // Maximum scale for active element
    } else if (distanceFromActive <= maxScaleDistance) {
      scale = 1 + (maxScaleDistance - distanceFromActive + 1) * 0.25; // Gradual scale decrease
    } else {
      scale = 1;
    }

    const containerCenter = (index + 0.5) * containerHeight;
    const distance = Math.abs(mouseY - containerCenter);
    const maxDistance = rect.height / 2;
    const opacity = Math.max(0.2, 1 - distance / maxDistance);

    const line = container.querySelector(".hover-indicator__line");
    const number = container.querySelector(".hover-indicator__number");
    const text = container.querySelector(".hover-indicator__text");

    // Set opacity and scale
    line.style.opacity = opacity;
    number.style.opacity = opacity;
    line.style.transform = `scaleX(${scale})`;

    // Set the data-active attribute based on activeIndex
    if (index === activeIndex) {
      container.setAttribute("data-active", "true");
      text.style.opacity = "1"; // Show tooltip for active element
    } else {
      container.removeAttribute("data-active");
      text.style.opacity = "0"; // Hide tooltip for inactive elements
    }
  });
});

hoverIndicator.addEventListener("mouseleave", () => {
  hoverIndicator
    .querySelectorAll(
      ".hover-indicator__line, .hover-indicator__number, .hover-indicator__text"
    )
    .forEach((el) => {
      el.style.opacity = "";
      if (el.classList.contains("hover-indicator__line")) {
        el.style.transform = "";
      }
    });

  // Remove data-active attribute when leaving
  hoverIndicator.querySelectorAll("[data-active]").forEach((container) => {
    container.removeAttribute("data-active");
  });
});
const navMenu = document.querySelector(".nav-menu");
const bgPath = document.querySelector(".card-list_bg-path");
let currentItem = null;
let animation = null;

function getItemDimensions(item) {
  const rect = item.getBoundingClientRect();
  const navRect = navMenu.getBoundingClientRect();
  return {
    left: ((rect.left - navRect.left) / navRect.width) * 100,
    right: ((rect.right - navRect.left) / navRect.width) * 100
  };
}

function createPath(left, right, curveStrength = 0) {
  return `M ${left} 0 H ${right} Q ${
    right + curveStrength
  } 50 ${right} 100 H ${left} V 0 Z`;
}

function animateHover(item) {
  if (animation) animation.kill();

  const { left, right } = getItemDimensions(item);
  const initialPath = createPath(left, left);
  const midPath = createPath(left, right, 10);
  const finalPath = createPath(left, right);

  animation = gsap
    .timeline()
    .set(bgPath, { attr: { d: initialPath } })
    .to(bgPath, {
      attr: { d: midPath },
      duration: 0.2,
      ease: "power2.out"
    })
    .to(bgPath, {
      attr: { d: finalPath },
      duration: 0.3,
      ease: "elastic.out(1, 0.3)"
    });
}

function animateTransition(fromItem, toItem) {
  if (animation) animation.kill();

  const fromDim = getItemDimensions(fromItem);
  const toDim = getItemDimensions(toItem);
  const direction = toDim.left > fromDim.left ? 1 : -1;

  const midPath = createPath(
    Math.min(fromDim.left, toDim.left),
    Math.max(fromDim.right, toDim.right),
    15 * direction
  );
  const finalPath = createPath(toDim.left, toDim.right);

  animation = gsap
    .timeline()
    .to(bgPath, {
      attr: { d: midPath },
      duration: 0.2,
      ease: "power2.out"
    })
    .to(bgPath, {
      attr: { d: finalPath },
      duration: 0.3,
      ease: "elastic.out(1, 0.3)"
    });
}

function animateHoverOut(item) {
  if (animation) animation.kill();

  const { left, right } = getItemDimensions(item);
  const initialPath = createPath(left, right);
  const midPath = createPath(left, right, 10);
  const finalPath = createPath(left, left);

  animation = gsap
    .timeline()
    .to(bgPath, {
      attr: { d: midPath },
      duration: 0.2,
      ease: "power2.in"
    })
    .to(bgPath, {
      attr: { d: finalPath },
      duration: 0.3,
      ease: "power2.inOut"
    });
}

navMenu.addEventListener("mouseover", (e) => {
  const item = e.target.closest(".card-list_item");
  if (item && item !== currentItem) {
    if (currentItem) {
      animateTransition(currentItem, item);
    } else {
      animateHover(item);
    }
    currentItem = item;
  }
});

navMenu.addEventListener("mouseleave", () => {
  if (currentItem) {
    animateHoverOut(currentItem);
    currentItem = null;
  }
});
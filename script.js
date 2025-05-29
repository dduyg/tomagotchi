document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(CustomEase);

  const body = document.body;
  const menu = document.getElementById("menu");
  const menuToggle = document.getElementById("menuToggle");
  const openState = menuToggle.querySelector(".nav__toggle-state--open");
  const closeState = menuToggle.querySelector(".nav__toggle-state--close");
  const menuItems = document.querySelectorAll(".nav__footer-link");

  let isMenuOpen = false;

  // Define custom eases
  CustomEase.create("easeOutFast", "M0,0 C0.25,0.1 0.25,1 1,1"); // Opening ease
  CustomEase.create("easeInFast", "M0,0 C0.5,0 0.75,0.2 1,1"); // Closing ease

  // Ensure menu items and toggle states are set properly
  gsap.set(menuItems, { opacity: 0, y: 20 });
  gsap.set(openState, { opacity: 1, display: "block" }); // Initially show "MENU"
  gsap.set(closeState, { opacity: 0, display: "none" }); // Initially hide "CLOSE"

  menuToggle.addEventListener("click", () => {
    if (!isMenuOpen) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  // Add event listener for ESC key to close the menu
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMenuOpen) {
      closeMenu();
    }
  });

  // Add event listener for clicks outside the menu to close it
  document.addEventListener("click", (event) => {
    if (
      isMenuOpen &&
      !menu.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMenu();
    }
  });

  function openMenu() {
    // Add a class to the body when the menu opens
    body.classList.add("menu-open");

    // Animate dividers from 0 to 100% width
    gsap.to(".menu__divider", {
      width: "100%",
      duration: 0.6,
      opacity: 1,
      ease: "power2.out",
      delay: 0.4
    });

    gsap.to(".menu__column p", {
      opacity: 1,
      stagger: { amount: 0.3, from: "start" },
      duration: 0.6,
      ease: "power2.in",
      delay: 0.6
    });

    // Fade out the "MENU" text and fade in the "CLOSE" text
    gsap.to(openState, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        gsap.set(openState, { display: "none" }); // Hide after fade out
        gsap.set(closeState, { display: "block" }); // Show "CLOSE" before fading in
        gsap.to(closeState, { opacity: 1, duration: 0.3 });
      }
    });

    gsap.to(menu, {
      y: 0,
      duration: 0.6,
      ease: "easeOutFast", // Use custom ease for opening
      onComplete: () => {
        // Start stagger animation after the menu has fully opened
        gsap.to(menuItems, {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.5,
          ease: "power3.out"
        });
      }
    });
    isMenuOpen = true;
  }

  function closeMenu() {
    // Animate dividers from 100% back to 0% width
    gsap.to(".menu__column p", {
      opacity: 0,
      stagger: { amount: 0.1, from: "end" },
      duration: 0.4,
      ease: "power2.in"
    });

    gsap.to(".menu__divider", {
      width: "0%",
      duration: 0.4,
      ease: "power2.in"
    });

    // Reverse the stagger animation before closing the menu
    gsap.to(menuItems, {
      y: 20,
      opacity: 0,
      stagger: { amount: 0.1, from: "end" },
      duration: 0.3,
      ease: "power3.in",
      onComplete: () => {
        gsap.to(closeState, {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            gsap.set(closeState, { display: "none" });
            gsap.set(openState, { display: "block" });
            gsap.to(openState, { opacity: 1, duration: 0.3 });
          }
        });

        // Close the menu after items are hidden
        gsap.to(menu, {
          y: "-100%",
          duration: 0.4,
          ease: "easeInFast",
          onComplete: () => {
            body.classList.remove("menu-open");
          }
        });
      }
    });

    isMenuOpen = false;
  }

  createDoubleHoverEffect();

  function createDoubleHoverEffect() {
    let items = gsap.utils.toArray(".double-hover");
    items.forEach((item) => {
      let titCur = new SplitType(item.querySelector("span:first-of-type"), {
        types: "chars"
      });
      let titNew = new SplitType(item.querySelector("span:nth-of-type(2)"), {
        types: "chars"
      });

      gsap.set(titCur.chars, { yPercent: 0, transformOrigin: "top left" });
      gsap.set(titNew.chars, {
        yPercent: 100,
        scaleY: 0.2,
        transformOrigin: "bottom left"
      });

      item.addEventListener("mouseenter", function () {
        gsap.to(titCur.chars, {
          yPercent: -100,
          scaleY: 0.2,
          stagger: { amount: 0.1 },
          duration: 0.6,
          ease: "power3"
        });
        gsap.to(titNew.chars, {
          yPercent: 0,
          scaleY: 1,
          stagger: { amount: 0.1 },
          duration: 0.6,
          ease: "power3"
        });
      });

      item.addEventListener("mouseleave", function () {
        gsap.to(titCur.chars, {
          yPercent: 0,
          scaleY: 1,
          stagger: { amount: 0.1 },
          duration: 0.6,
          ease: "power3"
        });
        gsap.to(titNew.chars, {
          yPercent: 100,
          scaleY: 0.2,
          stagger: { amount: 0.1 },
          duration: 0.6,
          ease: "power3"
        });
      });
    });
  }
});
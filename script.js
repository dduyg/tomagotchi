// config.js
const CONFIG = {
  lettersAndSymbols: [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "-",
    "_",
    "+",
    "=",
    ";",
    ":",
    "<",
    ">",
    ","
  ],
  timeZone: "Europe/Zagreb",
  timeUpdateInterval: 1000
};

// textAnimator.js
class TextAnimator {
  #originalChars;
  #splitter;

  constructor(textElement) {
    if (!textElement || !(textElement instanceof HTMLElement)) {
      throw new Error("Invalid text element provided.");
    }
    this.textElement = textElement;
    this.#originalChars = [];
    this.#splitText();
  }

  #splitText() {
    this.#splitter = new SplitType(this.textElement, { types: "words, chars" });
    this.#originalChars = this.#splitter.chars.map((char) => char.innerHTML);
  }

  animate() {
    this.reset();
    this.#animateChars();
    this.#animateTextElement();
  }

  #animateChars() {
    this.#splitter.chars.forEach((char, position) => {
      let initialHTML = char.innerHTML;
      gsap.fromTo(
        char,
        { opacity: 0 },
        {
          duration: 0.03,
          onComplete: () =>
            gsap.set(char, { innerHTML: initialHTML, delay: 0.1 }),
          repeat: 2,
          repeatRefresh: true,
          repeatDelay: 0.05,
          delay: (position + 1) * 0.06,
          innerHTML: () => this.#getRandomChar(),
          opacity: 1
        }
      );
    });
  }

  #animateTextElement() {
    gsap.fromTo(
      this.textElement,
      { "--anim": 0 },
      { duration: 1, ease: "expo", "--anim": 1 }
    );
  }

  #getRandomChar() {
    return CONFIG.lettersAndSymbols[
      Math.floor(Math.random() * CONFIG.lettersAndSymbols.length)
    ];
  }

  animateBack() {
    gsap.killTweensOf(this.textElement);
    gsap.to(this.textElement, { duration: 0.6, ease: "power4", "--anim": 0 });
  }

  reset() {
    this.#splitter.chars.forEach((char, index) => {
      gsap.killTweensOf(char);
      char.innerHTML = this.#originalChars[index];
    });
    gsap.killTweensOf(this.textElement);
    gsap.set(this.textElement, { "--anim": 0 });
  }
}

// animationManager.js
class AnimationManager {
  constructor() {
    this.animators = new Map();
  }

  initializeAnimations() {
    document.querySelectorAll(".list__item").forEach((item) => {
      const animators = Array.from(item.querySelectorAll(".hover-effect")).map(
        (col) => new TextAnimator(col)
      );

      this.animators.set(item, animators);

      this.#addEventListeners(item);
    });
  }

  #addEventListeners(item) {
    const animators = this.animators.get(item);

    const handleMouseEnter = this.#debounce(() => {
      animators.forEach((animator) => animator.animate());
    }, 50);

    const handleMouseLeave = this.#debounce(() => {
      animators.forEach((animator) => animator.animateBack());
    }, 50);

    item.addEventListener("mouseenter", handleMouseEnter);
    item.addEventListener("mouseleave", handleMouseLeave);
  }

  #debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// timeDisplay.js
class TimeDisplay {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    if (!this.element) {
      throw new Error(`Element with id '${elementId}' not found.`);
    }
  }

  start() {
    this.updateDisplay();
    setInterval(() => this.updateDisplay(), CONFIG.timeUpdateInterval);
  }

  updateDisplay() {
    const { hours, minutes, dayPeriod } = this.#getCurrentTime();
    const timeString = `${hours}<span class="blinking">:</span>${minutes} ${dayPeriod}`;
    this.element.innerHTML = timeString;
  }

  #getCurrentTime() {
    const now = new Date();
    const options = {
      timeZone: CONFIG.timeZone,
      hour12: true,
      hour: "numeric",
      minute: "numeric",
      second: "numeric"
    };
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(now);
    return {
      hours: parts.find((part) => part.type === "hour").value,
      minutes: parts.find((part) => part.type === "minute").value,
      dayPeriod: parts.find((part) => part.type === "dayPeriod").value
    };
  }
}

// main.js
document.addEventListener("DOMContentLoaded", () => {
  const animationManager = new AnimationManager();
  animationManager.initializeAnimations();

  const timeDisplay = new TimeDisplay("current-time");
  timeDisplay.start();
});
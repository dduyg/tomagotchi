// Global canvas and simulation variables
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
let cw, ch;
let points = [];
let constraints = [];
let pointsX, pointsY, spacing;
const densityFactor = 0.02;
let damping = 0.97,
  stiffness = 0.12,
  iterations = 2;
let returnSpeed = 0.003,
  windForce = 0,
  windDirection = 0,
  time = 0;

// Mouse tracking variables
let mouseX, mouseY, prevMouseX, prevMouseY, mouseVelX, mouseVelY;
let mouseDown = false,
  mouseDragging = false;
let mouseInfluenceRadius = 180; // Increased influence radius

// For staggered removal / decay of influence
let mouseEffectStrength = 1; // Range 0 (none) to 1 (full effect)
let lastMouseMoveTime = Date.now();
const idleThreshold = 300; // Time (ms) to wait before decaying
const decayRate = 0.01; // Decay amount per frame when idle

// New flag: whether the mouse is on the canvas
let mouseOnCanvas = false;

// Initialize mouse state at canvas center
function initMouse() {
  mouseX = cw / 2;
  mouseY = ch / 2;
  prevMouseX = mouseX;
  prevMouseY = mouseY;
  mouseVelX = 0;
  mouseVelY = 0;
}

// Setup simulation: create grid points and constraints.
function initSimulation() {
  points = [];
  constraints = [];
  spacing = Math.min(cw / (pointsX - 1), ch / (pointsY - 1));

  for (let y = 0; y < pointsY; y++) {
    for (let x = 0; x < pointsX; x++) {
      const offsetY = Math.sin(x * 0.2) * 15 + Math.sin(y * 0.2) * 10;
      const posX = x * spacing;
      const posY = y * spacing + offsetY;
      points.push({
        x: posX,
        y: posY,
        prevX: posX,
        prevY: posY,
        origX: posX,
        origY: posY,
        pinned: y === 0 && (x % 4 === 0 || x === 0 || x === pointsX - 1),
        thickness: 0.5 + Math.random() * 1.5,
        mass: 1 + Math.random() * 0.5,
        returnSpeed: returnSpeed * (0.8 + Math.random() * 0.4)
      });
    }
  }

  // Create constraints for horizontal, vertical, and diagonal connections.
  for (let i = 0; i < points.length; i++) {
    const x = i % pointsX;
    const y = Math.floor(i / pointsX);
    if (x < pointsX - 1) {
      constraints.push({
        p1: i,
        p2: i + 1,
        length: spacing,
        strength: 1,
        visible: true
      });
    }
    if (y < pointsY - 1) {
      constraints.push({
        p1: i,
        p2: i + pointsX,
        length: spacing,
        strength: 1,
        visible: true
      });
    }
    if (x < pointsX - 1 && y < pointsY - 1) {
      constraints.push({
        p1: i,
        p2: i + pointsX + 1,
        length: Math.sqrt(spacing * spacing * 2),
        strength: 0.8,
        visible: false
      });
    }
  }
}

// Resize canvas and reinitialize simulation parameters.
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cw = canvas.width;
  ch = canvas.height;
  pointsX = Math.max(10, Math.floor(cw * densityFactor));
  pointsY = Math.max(10, Math.floor(ch * densityFactor));
  initMouse();
  initSimulation();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Mouse event handlers

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  prevMouseX = mouseX;
  prevMouseY = mouseY;
  mouseX = ((e.clientX - rect.left) / rect.width) * cw;
  mouseY = ((e.clientY - rect.top) / rect.height) * ch;
  mouseVelX = mouseX - prevMouseX;
  mouseVelY = mouseY - prevMouseY;

  // Reset effect strength on movement and update last move time.
  lastMouseMoveTime = Date.now();
  mouseEffectStrength = 1;
});

canvas.addEventListener("mousedown", () => {
  mouseDown = true;
  mouseDragging = false;
  let closestDist = mouseInfluenceRadius * 0.7;
  let selectedPoint = null;
  for (let i = 0; i < points.length; i++) {
    const d = Math.hypot(points[i].x - mouseX, points[i].y - mouseY);
    if (d < closestDist) {
      selectedPoint = i;
      closestDist = d;
    }
  }
  if (selectedPoint === null) {
    createRipple(mouseX, mouseY);
  }
});

canvas.addEventListener("mouseup", () => {
  mouseDown = false;
  mouseDragging = false;
});

canvas.addEventListener("mouseleave", () => {
  mouseDown = false;
  mouseDragging = false;
  // Disable mouse influence when leaving canvas.
  mouseOnCanvas = false;
  mouseEffectStrength = 0;
});

canvas.addEventListener("mouseenter", (e) => {
  // When the mouse enters, enable influence.
  mouseOnCanvas = true;
  lastMouseMoveTime = Date.now();
  mouseEffectStrength = 1;
});

// Create a ripple effect from a given point.
function createRipple(x, y) {
  const maxDist = 300;
  for (let i = 0; i < points.length; i++) {
    const d = Math.hypot(points[i].x - x, points[i].y - y);
    if (d < maxDist && !points[i].pinned) {
      setTimeout(() => {
        const angle =
          Math.atan2(points[i].y - y, points[i].x - x) + Math.PI / 2;
        const force = Math.pow(1 - d / maxDist, 2) * 15;
        points[i].prevX = points[i].x - Math.cos(angle) * force;
        points[i].prevY = points[i].y - Math.sin(angle) * force;
      }, d * 0.5);
    }
  }
}

// Update environmental parameters (e.g., wind).
function updateEnvironment() {
  time += 0.01;
  windForce = Math.sin(time * 0.2) * 0.2 + Math.sin(time * 0.5) * 0.1;
  windDirection = time * 0.1;
  if (Math.random() < 0.001) windForce *= -1;
}

// Update physics for each point.
function updatePoints() {
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.pinned) continue;
    const vx = (p.x - p.prevX) * damping;
    const vy = (p.y - p.prevY) * damping;
    p.prevX = p.x;
    p.prevY = p.y;
    p.x += vx;
    p.y += vy;
    p.y += 0.25 * p.mass; // Gravity

    p.x += Math.cos(windDirection + (p.y / ch) * 2) * windForce;
    p.y += Math.sin(windDirection + (p.x / cw) * 2) * windForce * 0.5;
    p.x += Math.sin(time * 0.5 + p.origY / 50) * 0.2;
    p.y += Math.cos(time * 0.4 + p.origX / 50) * 0.2;

    const dx = p.origX - p.x;
    const dy = p.origY - p.y;
    const d0 = Math.hypot(dx, dy);
    const returnStrength = p.returnSpeed * (1 + Math.pow(d0 / 100, 1.5));
    if (d0 > 0.1) {
      p.x += dx * returnStrength;
      p.y += dy * returnStrength;
    }

    // Apply mouse influence only if the mouse is on canvas,
    // not down, and while the effect strength is nonzero.
    if (!mouseDown && mouseOnCanvas && mouseEffectStrength > 0) {
      const dmx = p.x - mouseX;
      const dmy = p.y - mouseY;
      const d = Math.hypot(dmx, dmy);
      if (d < mouseInfluenceRadius) {
        const strength =
          (1 - d / mouseInfluenceRadius) * 2 * mouseEffectStrength;
        p.x += dmx * strength * 0.01;
        p.y += dmy * strength * 0.01;
        const velInfluence = strength * 0.2;
        p.x += mouseVelX * velInfluence;
        p.y += mouseVelY * velInfluence;
      }
    }
  }
}

// Solve constraints between points (simulate spring behavior).
function solveConstraints() {
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < constraints.length; i++) {
      const con = constraints[i];
      const p1 = points[con.p1],
        p2 = points[con.p2];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const d = Math.hypot(dx, dy);
      if (d === 0) continue;
      const diff = (con.length - d) / d;
      const invMass1 = p1.pinned ? 0 : 1 / p1.mass;
      const invMass2 = p2.pinned ? 0 : 1 / p2.mass;
      const invMassSum = invMass1 + invMass2;
      if (invMassSum === 0) continue;
      const ratio1 = invMass1 / invMassSum;
      const ratio2 = invMass2 / invMassSum;
      const offsetX = dx * diff * stiffness * con.strength;
      const offsetY = dy * diff * stiffness * con.strength;
      if (!p1.pinned) {
        p1.x -= offsetX * ratio1;
        p1.y -= offsetY * ratio1;
      }
      if (!p2.pinned) {
        p2.x += offsetX * ratio2;
        p2.y += offsetY * ratio2;
      }
    }
  }
}

// Gradually decay the mouse effect when idle.
function updateMouseEffect() {
  if (Date.now() - lastMouseMoveTime > idleThreshold) {
    mouseEffectStrength = Math.max(0, mouseEffectStrength - decayRate);
  }
}

// Draw grid lines and dots. Dot brightness is based on proximity (modulated by mouseEffectStrength).
function drawWeb() {
  // Clear the canvas with a dark gray fill.
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, cw, ch);

  // Horizontal grid lines.
  for (let y = 0; y < pointsY; y++) {
    ctx.beginPath();
    for (let x = 0; x < pointsX; x++) {
      const idx = x + y * pointsX;
      const p = points[idx];
      if (x === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    let alpha = 0.6 + (y / pointsY) * 0.3;
    ctx.strokeStyle = `rgba(50,50,50,${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Vertical grid lines.
  for (let x = 0; x < pointsX; x++) {
    ctx.beginPath();
    for (let y = 0; y < pointsY; y++) {
      const idx = x + y * pointsX;
      const p = points[idx];
      if (y === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = "rgba(50,50,50,0.5)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Draw dots with brightness based on their distance from the mouse.
  // Base brightness = 50; max brightness increase = 150.
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const d = Math.hypot(p.x - mouseX, p.y - mouseY);
    let brightness = 50;
    if (mouseOnCanvas && d < mouseInfluenceRadius) {
      brightness = Math.floor(
        50 + mouseEffectStrength * (1 - d / mouseInfluenceRadius) * 150
      );
    }
    ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
    ctx.beginPath();
    const radius = p.pinned ? 4 : 2;
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Optionally, show the mouse influence area when pressed.
  if (mouseDown && mouseOnCanvas) {
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 8, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, mouseInfluenceRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// Main render loop.
function render() {
  updateMouseEffect();
  updateEnvironment();
  updatePoints();
  solveConstraints();
  drawWeb();
  requestAnimationFrame(render);
}

// Generate ambient ripples periodically.
function randomRipples() {
  if (Math.random() < 0.02 && !mouseDown) {
    createRipple(Math.random() * cw, Math.random() * ch);
  }
  setTimeout(randomRipples, 1000);
}

render();
randomRipples();
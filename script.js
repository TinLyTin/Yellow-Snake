// Resolve __dirname if needed
__dirname = window.location.href.replace(/\/[^\/]*$/, '');

// --- Game Constants and Global Variables ---
const CUBE_SIZE = 50;
const SNAKE_COLOR = 0xFFFF00;
const PARTICLE_COLOR = 0x00FFD1;

let scene, camera, renderer;
let cube; // The rainbow cube (wireframe with attached vertical lines)
let snake = [];
let particles = [];
let dir = new THREE.Vector3(1, 0, 0);
let speed = 0.1;
let score = 0;
let rotateSpeed = 0.005;
let autoRotate = true;
let cameraDistance = 80;

// --- Initialization ---
function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(0, 0, 50);
  scene.add(pointLight);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = cameraDistance;

  // Create game elements
  cube = createRainbowCube();
  // Attach the vertical neon lines to the cube so they rotate with it.
  const verticalLines = createVerticalRainbowLines();
  cube.add(verticalLines);

  createSnake();
  createParticles(100);

  // Event Listeners
  window.addEventListener('keydown', handleKeys);
  window.addEventListener('wheel', handleWheel);
  window.addEventListener('resize', onWindowResize);
}

// --- Create Rainbow Cube (Edges) ---
function createRainbowCube() {
  const cubeSize = CUBE_SIZE;
  const colors = [
    0xFF0000, // Red
    0xFF7F00, // Orange
    0xFFFF00, // Yellow
    0x00FF00, // Green
    0x0000FF, // Blue
    0x4B0082  // Indigo
    // (The neon vertical lines use 7 colors including purple)
  ];

  // Create box geometry and extract edges
  const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  const edges = new THREE.EdgesGeometry(cubeGeometry);

  // Create a group to hold the colored edge lines
  const lineGroup = new THREE.Group();

  const positions = edges.attributes.position.array;
  // Each edge has 2 points (6 numbers). Loop by steps of 6.
  for (let i = 0, edgeIndex = 0; i < positions.length; i += 6, edgeIndex++) {
    const color = new THREE.Color(colors[edgeIndex % colors.length]);

    const lineMaterial = new THREE.LineBasicMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });

    const segmentPositions = new Float32Array([
      positions[i], positions[i + 1], positions[i + 2],
      positions[i + 3], positions[i + 4], positions[i + 5]
    ]);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(segmentPositions, 3));

    const line = new THREE.Line(lineGeometry, lineMaterial);
    lineGroup.add(line);
  }

  // Set up pulsing data for animation
  lineGroup.userData.pulse = 0;
  lineGroup.userData.pulseDirection = 1;

  scene.add(lineGroup);
  return lineGroup;
}

// --- Create Neon Vertical Rainbow Lines on Cube Faces ---
// This function now creates 21 lines per vertical face. The colors are applied in groups
// of three in the order: red, orange, yellow, green, blue, indigo, and purple.
function createVerticalRainbowLines() {
  // Define 7 neon colors: red, orange, yellow, green, blue, indigo, purple.
  const neonColors = [
    0xFF0000, // Red
    0xFF7F00, // Orange
    0xFFFF00, // Yellow
    0x00FF00, // Green
    0x0000FF, // Blue
    0x4B0082, // Indigo
    0x9400D3  // Purple
  ];
  const group = new THREE.Group();
  const totalLines = 21; // 21 lines per face

  // Helper to create a vertical line between two points
  function createLine(start, end, color) {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 2,
      transparent: true,
      opacity: 0.9
    });
    return new THREE.Line(geometry, material);
  }

  // For the vertical faces, we draw lines running along the global y-axis.
  // Faces: right (x = +CUBE_SIZE/2), left (x = -CUBE_SIZE/2),
  // front (z = +CUBE_SIZE/2), and back (z = -CUBE_SIZE/2).

  // Right face (x = +CUBE_SIZE/2): vary z from left to right.
  for (let i = 0; i < totalLines; i++) {
    const t = i / (totalLines - 1); // t goes from 0 to 1
    const z = -CUBE_SIZE / 2 + t * CUBE_SIZE;
    const start = new THREE.Vector3(CUBE_SIZE / 2, CUBE_SIZE / 2, z);
    const end = new THREE.Vector3(CUBE_SIZE / 2, -CUBE_SIZE / 2, z);
    // Each group of 3 lines gets the same color.
    const color = neonColors[Math.floor(i / 3)];
    group.add(createLine(start, end, color));
  }

  // Left face (x = -CUBE_SIZE/2): vary z.
  for (let i = 0; i < totalLines; i++) {
    const t = i / (totalLines - 1);
    const z = -CUBE_SIZE / 2 + t * CUBE_SIZE;
    const start = new THREE.Vector3(-CUBE_SIZE / 2, CUBE_SIZE / 2, z);
    const end = new THREE.Vector3(-CUBE_SIZE / 2, -CUBE_SIZE / 2, z);
    const color = neonColors[Math.floor(i / 3)];
    group.add(createLine(start, end, color));
  }

  // Front face (z = +CUBE_SIZE/2): vary x.
  for (let i = 0; i < totalLines; i++) {
    const t = i / (totalLines - 1);
    const x = -CUBE_SIZE / 2 + t * CUBE_SIZE;
    const start = new THREE.Vector3(x, CUBE_SIZE / 2, CUBE_SIZE / 2);
    const end = new THREE.Vector3(x, -CUBE_SIZE / 2, CUBE_SIZE / 2);
    const color = neonColors[Math.floor(i / 3)];
    group.add(createLine(start, end, color));
  }

  // Back face (z = -CUBE_SIZE/2): vary x.
  for (let i = 0; i < totalLines; i++) {
    const t = i / (totalLines - 1);
    const x = -CUBE_SIZE / 2 + t * CUBE_SIZE;
    const start = new THREE.Vector3(x, CUBE_SIZE / 2, -CUBE_SIZE / 2);
    const end = new THREE.Vector3(x, -CUBE_SIZE / 2, -CUBE_SIZE / 2);
    const color = neonColors[Math.floor(i / 3)];
    group.add(createLine(start, end, color));
  }

  // Return the group so it can be attached to the cube.
  return group;
}

// --- Create Snake ---
function createSnake() {
  snake = [];
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: SNAKE_COLOR,
    emissive: SNAKE_COLOR,
    emissiveIntensity: 2
  });

  // Create initial snake segments along the negative X axis.
  for (let i = 0; i < 5; i++) {
    const segment = new THREE.Mesh(geometry, material);
    segment.position.set(-i, 0, 0);
    snake.push(segment);
    scene.add(segment);
  }
}

// --- Create Particles ---
function createParticles(count) {
  const geometry = new THREE.SphereGeometry(0.5, 8, 8);
  const material = new THREE.MeshStandardMaterial({
    color: PARTICLE_COLOR,
    emissive: PARTICLE_COLOR,
    emissiveIntensity: 1
  });

  for (let i = 0; i < count; i++) {
    const particle = new THREE.Mesh(geometry, material);
    particle.position.set(
      THREE.MathUtils.randFloatSpread(CUBE_SIZE),
      THREE.MathUtils.randFloatSpread(CUBE_SIZE),
      THREE.MathUtils.randFloatSpread(CUBE_SIZE)
    );
    particles.push(particle);
    scene.add(particle);
  }
}

// --- Event Handlers ---
function handleKeys(event) {
  const key = event.key.toLowerCase();

  // Toggle auto-rotation with 'R'
  if (key === 'r') {
    autoRotate = !autoRotate;
  }

  // Manual cube rotation with 'Q' and 'E'
  if (cube) {
    if (key === 'q') cube.rotation.y += 0.1;
    if (key === 'e') cube.rotation.y -= 0.1;
  }

  // Snake movement controls (only allow perpendicular changes)
  const currentDir = dir.clone();
  if (key === 'arrowup' && currentDir.y === 0) dir.set(0, 1, 0);
  if (key === 'arrowdown' && currentDir.y === 0) dir.set(0, -1, 0);
  if (key === 'arrowleft' && currentDir.x === 0) dir.set(-1, 0, 0);
  if (key === 'arrowright' && currentDir.x === 0) dir.set(1, 0, 0);
  if (key === 'w' && currentDir.z === 0) dir.set(0, 0, 1);
  if (key === 's' && currentDir.z === 0) dir.set(0, 0, -1);
}

function handleWheel(event) {
  cameraDistance += event.deltaY * 0.05;
  cameraDistance = Math.max(10, Math.min(cameraDistance, 200));
  camera.position.z = cameraDistance;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);

  // --- Update Rainbow Cube (pulsing and auto-rotation) ---
  if (cube) {
    cube.userData.pulse += cube.userData.pulseDirection * 0.01;
    if (cube.userData.pulse > 1 || cube.userData.pulse < 0) {
      cube.userData.pulseDirection *= -1;
    }
    cube.children.forEach(child => {
      // For the cube edges (and attached vertical lines), apply pulsing if material exists.
      if (child.material) {
        child.material.opacity = 0.5 + 0.3 * cube.userData.pulse;
      }
    });

    if (autoRotate) {
      cube.rotation.y += rotateSpeed;
    }
  }

  // --- Rotate Each Particle ---
  particles.forEach(particle => {
    particle.rotation.x += 0.01;
    particle.rotation.y += 0.01;
  });

  // --- Update Snake Position with Smooth Interpolation ---
  // Calculate the new head target position with wrap-around inside the cube.
  const targetHead = snake[0].position.clone().add(dir.clone().multiplyScalar(speed));
  ['x', 'y', 'z'].forEach(axis => {
    targetHead[axis] = ((targetHead[axis] + CUBE_SIZE / 2) % CUBE_SIZE) - CUBE_SIZE / 2;
  });
  // Smoothly interpolate the head towards the target.
  snake[0].position.lerp(targetHead, 0.5);
  
  // Each segment smoothly follows the segment in front.
  for (let i = 1; i < snake.length; i++) {
    snake[i].position.lerp(snake[i - 1].position, 0.5);
  }

  // --- Collision Detection with Particles ---
  for (let i = particles.length - 1; i >= 0; i--) {
    if (snake[0].position.distanceTo(particles[i].position) < 1) {
      scene.remove(particles[i]);
      particles.splice(i, 1);
      speed *= 1.02;
      score++;
      if (score === 100) {
        endGame();
      }
    }
  }

  renderer.render(scene, camera);
}

// --- End Game ---
function endGame() {
  const endMessage = document.getElementById('endMessage');
  const tagline = document.getElementById('tagline');
  const company = document.getElementById('company');

  if (endMessage && tagline && company) {
    endMessage.style.display = 'block';
    tagline.textContent = 'When The Pieces Fall Into Place, The Magic Unfolds';
    company.textContent = '';

    setTimeout(() => {
      tagline.style.transform = 'rotate(360deg)';
      tagline.style.transition = 'transform 2s';
      setTimeout(() => {
        tagline.textContent = 'Unsolvablr';
        company.textContent = 'a jigsaw company';
      }, 2000);
    }, 3000);
  }
}

// --- Start the Game ---
init();
animate();

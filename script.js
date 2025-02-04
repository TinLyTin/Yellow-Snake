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
let baseSpeed = 0.1; // Base speed when no target is found
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
// (No changes here)
function createRainbowCube() {
  const cubeSize = CUBE_SIZE;
  const colors = [
    0xFF0000, // Red
    0xFF7F00, // Orange
    0xFFFF00, // Yellow
    0x00FF00, // Green
    0x0000FF, // Blue
    0x4B0082  // Indigo
  ];

  const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  const edges = new THREE.EdgesGeometry(cubeGeometry);
  const lineGroup = new THREE.Group();
  const positions = edges.attributes.position.array;

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

    const x1 = positions[i], x2 = positions[i + 3];
    const avgX = (x1 + x2) / 2;
    if (Math.abs(avgX - cubeSize / 2) < 0.001 || Math.abs(avgX + cubeSize / 2) < 0.001) {
      lineMaterial.opacity = 0.2;
    }

    const segmentPositions = new Float32Array([
      positions[i], positions[i + 1], positions[i + 2],
      positions[i + 3], positions[i + 4], positions[i + 5]
    ]);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(segmentPositions, 3));
    const line = new THREE.Line(lineGeometry, lineMaterial);
    lineGroup.add(line);
  }

  lineGroup.userData.pulse = 0;
  lineGroup.userData.pulseDirection = 1;
  scene.add(lineGroup);
  return lineGroup;
}

// --- Create Neon Vertical Rainbow Lines on Cube Faces ---
// (No changes here)
function createVerticalRainbowLines() {
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
  const totalLines = 21;

  function createLine(start, end, color, opacity) {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 2,
      transparent: true,
      opacity: opacity
    });
    return new THREE.Line(geometry, material);
  }

  const opaqueOpacity = 0.9;      // front and back (north and south)
  const transparentOpacity = 0.2; // left and right

  // Right face (x = +CUBE_SIZE/2)
  for (let i = 0; i < totalLines; i++) {
    const t = i / (totalLines - 1);
    const z = -CUBE_SIZE / 2 + t * CUBE_SIZE;
    const start = new THREE.Vector3(CUBE_SIZE / 2, CUBE_SIZE / 2, z);
    const end = new THREE.Vector3(CUBE_SIZE / 2, -CUBE_SIZE / 2, z);
    const color = neonColors[Math.floor(i / 3)];
    group.add(createLine(start, end, color, transparentOpacity));
  }

  // Left face (x = -CUBE_SIZE/2)
  for (let i = 0; i < totalLines; i++) {
    const t = i / (totalLines - 1);
    const z = -CUBE_SIZE / 2 + t * CUBE_SIZE;
    const start = new THREE.Vector3(-CUBE_SIZE/2, CUBE_SIZE / 2, z);
    const end = new THREE.Vector3(-CUBE_SIZE/2, -CUBE_SIZE / 2, z);
    const color = neonColors[Math.floor(i / 3)];
    group.add(createLine(start, end, color, transparentOpacity));
  }

  // Front face (z = +CUBE_SIZE/2)
  for (let i = 0; i < totalLines; i++) {
    const t = i / (totalLines - 1);
    const x = -CUBE_SIZE / 2 + t * CUBE_SIZE;
    const start = new THREE.Vector3(x, CUBE_SIZE / 2, CUBE_SIZE/2);
    const end = new THREE.Vector3(x, -CUBE_SIZE / 2, CUBE_SIZE/2);
    const color = neonColors[Math.floor(i / 3)];
    group.add(createLine(start, end, color, opaqueOpacity));
  }

  // Back face (z = -CUBE_SIZE/2)
  for (let i = 0; i < totalLines; i++) {
    const t = i / (totalLines - 1);
    const x = -CUBE_SIZE / 2 + t * CUBE_SIZE;
    const start = new THREE.Vector3(x, CUBE_SIZE / 2, -CUBE_SIZE/2);
    const end = new THREE.Vector3(x, -CUBE_SIZE / 2, -CUBE_SIZE/2);
    const color = neonColors[Math.floor(i / 3)];
    group.add(createLine(start, end, color, opaqueOpacity));
  }

  return group;
}

// --- Create Snake ---
// (No changes here)
function createSnake() {
  snake = [];
  const segmentCount = 20;
  const segmentLength = 2;
  const geometry = new THREE.CylinderGeometry(1.0, 0.8, segmentLength, 16);
  geometry.rotateZ(Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({
    color: SNAKE_COLOR,
    emissive: SNAKE_COLOR,
    emissiveIntensity: 1.5
  });

  for (let i = 0; i < segmentCount; i++) {
    const segment = new THREE.Mesh(geometry, material);
    segment.position.set(-i * segmentLength, 0, 0);
    snake.push(segment);
    scene.add(segment);
  }
}

// --- Create Particles ---
// Teal stars are now larger with an Icosahedron radius of 1 and a base scale of 1.5.
function createParticles(count) {
  for (let i = 0; i < count; i++) {
    const geometry = new THREE.IcosahedronGeometry(1, 0); // Larger teal star
    const material = new THREE.MeshStandardMaterial({
      color: PARTICLE_COLOR,
      emissive: PARTICLE_COLOR,
      emissiveIntensity: 1
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.position.set(
      THREE.MathUtils.randFloatSpread(CUBE_SIZE),
      THREE.MathUtils.randFloatSpread(CUBE_SIZE),
      THREE.MathUtils.randFloatSpread(CUBE_SIZE)
    );
    particle.userData.baseScale = 1.5;
    particle.userData.twinkleSpeed = Math.random() * 0.05 + 0.01;
    particles.push(particle);
    scene.add(particle);
  }
}

// --- Event Handlers ---
function handleKeys(event) {
  const key = event.key.toLowerCase();
  if (key === 'r') {
    autoRotate = !autoRotate;
  }
  if (cube) {
    if (key === 'q') cube.rotation.y += 0.1;
    if (key === 'e') cube.rotation.y -= 0.1;
  }
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
    if (autoRotate) {
      cube.rotation.y += rotateSpeed;
    }
  }

  // --- Twinkle Each Particle ---
  particles.forEach(particle => {
    const scaleFactor = particle.userData.baseScale * (1 + 0.2 * Math.sin(Date.now() * particle.userData.twinkleSpeed));
    particle.scale.set(scaleFactor, scaleFactor, scaleFactor);
    particle.material.emissiveIntensity = 1 + 0.5 * Math.sin(Date.now() * particle.userData.twinkleSpeed);
    particle.rotation.x += 0.01;
    particle.rotation.y += 0.01;
  });

  // --- Update Snake Position with Auto-Chasing ---
  let targetHead;
  if (particles.length > 0) {
    let nearest = particles[0];
    let nearestDist = snake[0].position.distanceTo(nearest.position);
    for (let i = 1; i < particles.length; i++) {
      const d = snake[0].position.distanceTo(particles[i].position);
      if (d < nearestDist) {
        nearest = particles[i];
        nearestDist = d;
      }
    }
    targetHead = nearest.position.clone();
  } else {
    targetHead = snake[0].position.clone().add(dir.clone().multiplyScalar(baseSpeed));
    ['x', 'y', 'z'].forEach(axis => {
      targetHead[axis] = ((targetHead[axis] + CUBE_SIZE / 2) % CUBE_SIZE) - CUBE_SIZE / 2;
    });
  }
  snake[0].position.lerp(targetHead, 0.5);
  for (let i = 1; i < snake.length; i++) {
    snake[i].position.lerp(snake[i - 1].position, 0.5);
  }

  // --- Update Snake Orientation ---
  for (let i = 0; i < snake.length - 1; i++) {
    snake[i].lookAt(snake[i + 1].position);
  }
  if (snake.length > 1) {
    snake[snake.length - 1].lookAt(snake[snake.length - 2].position);
  }

  // --- Collision Detection with Particles ---
  for (let i = particles.length - 1; i >= 0; i--) {
    if (snake[0].position.distanceTo(particles[i].position) < 1) {
      scene.remove(particles[i]);
      particles.splice(i, 1);
      score += 10;
      baseSpeed *= 1.02;
      if (score >= 1000) {
        endGame();
      }
    }
  }

  // --- Update Scoreboard ---
  const scoreBoard = document.getElementById('scoreboard');
  if (scoreBoard) {
    scoreBoard.innerHTML = "Jigsaw Puzzle Pieces: " + score;
  }

  renderer.render(scene, camera);
}

function endGame() {
  const endMessage = document.getElementById('endMessage');
  const tagline = document.getElementById('tagline');
  const company = document.getElementById('company');

  if (endMessage && tagline && company) {
    // Show the end game overlay.
    endMessage.style.display = 'block';
    // Set the two-line initial message.
    tagline.innerHTML = '<div>UNRAVEL THE UNSOLVABLR.</div><div>WHERE EVERY PIECE CREATES MAGIC.</div>';
    company.textContent = '';

    // After a 3-second delay, add the glitch effect for 0.5 seconds.
    setTimeout(() => {
      tagline.classList.add('glitch');
      
      setTimeout(() => {
        tagline.classList.remove('glitch');
        // Fade out the tagline over 2 seconds.
        tagline.style.transition = 'opacity 2s';
        tagline.style.opacity = 0;
        
        // After fade-out, update the text and fade back in.
        setTimeout(() => {
          tagline.style.opacity = 2;
          tagline.textContent = 'Unsolvablr LLC';
          company.textContent = 'A Jigsaw Puzzle Company';
        }, 2000);
      }, 500); // Glitch duration: 0.5 seconds.
    }, 3000);
  }
}

// --- Start the Game ---
init();
animate();

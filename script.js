__dirname = window.location.href.replace(/\/[^\/]*$/, '');

let scene, camera, renderer, snake, particles = [];
let dir = new THREE.Vector3(1, 0, 0);
let speed = 0.1;
let score = 0;
const CUBE_SIZE = 50;
const SNAKE_COLOR = 0xFFFF00;
const PARTICLE_COLOR = 0x00FFD1;

function init() {
    // 1. Set black background
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // 2. Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // 3. Initialize camera and renderer
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 4. Create game elements
    createRainbowCube();
    createSnake();
    createParticles(100);
    
    // 5. Position camera
    camera.position.z = 80;
    window.addEventListener('keydown', handleKeys);
    
    // 6. Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

// Add this new function
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Keep other functions the same but add these fixes:
// In createRainbowCube() change materials to:
const materials = colors.map(color => new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.3,
    metalness: 0.9,
    roughness: 0.1,
    side: THREE.DoubleSide
}));

// In createSnake() and createParticles() change materials to:
new THREE.MeshStandardMaterial({
    color: SNAKE_COLOR,
    emissive: SNAKE_COLOR,
    emissiveIntensity: 2,
    metalness: 0.5,
    roughness: 0.1
});

// Initialize properly
init();
animate();

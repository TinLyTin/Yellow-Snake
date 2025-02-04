// GitHub Pages compatibility fix
__dirname = window.location.href.replace(/\/[^\/]*$/, '');

let scene, camera, renderer, snake, particles = [];
let dir = new THREE.Vector3(1, 0, 0);
let speed = 0.1;
let score = 0;
const CUBE_SIZE = 50;
const SNAKE_COLOR = 0xFFFF00;
const PARTICLE_COLOR = 0x00FFD1;

init();
createParticles(100);
animate();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createRainbowCube();
    createSnake();
    
    camera.position.z = 80;
    window.addEventListener('keydown', handleKeys);
}

function createRainbowCube() {
    const colors = [0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x4B0082];
    const materials = colors.map(color => new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    }));

    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE),
        materials
    );
    scene.add(cube);
}

function createSnake() {
    snake = [];
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({
        color: SNAKE_COLOR,
        emissive: SNAKE_COLOR
    });

    for(let i = 0; i < 5; i++) {
        const segment = new THREE.Mesh(geometry, material);
        segment.position.set(-i, 0, 0);
        snake.push(segment);
        scene.add(segment);
    }
}

function createParticles(count) {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshPhongMaterial({
        color: PARTICLE_COLOR,
        emissive: PARTICLE_COLOR
    });

    for(let i = 0; i < count; i++) {
        const particle = new THREE.Mesh(geometry, material);
        particle.position.set(
            (Math.random() - 0.5) * CUBE_SIZE,
            (Math.random() - 0.5) * CUBE_SIZE,
            (Math.random() - 0.5) * CUBE_SIZE
        );
        particles.push(particle);
        scene.add(particle);
    }
}

function handleKeys(event) {
    const key = event.key;
    const currentDir = dir.clone();
    
    if(key === 'ArrowUp' && currentDir.y === 0) dir.set(0, 1, 0);
    if(key === 'ArrowDown' && currentDir.y === 0) dir.set(0, -1, 0);
    if(key === 'ArrowLeft' && currentDir.x === 0) dir.set(-1, 0, 0);
    if(key === 'ArrowRight' && currentDir.x === 0) dir.set(1, 0, 0);
    if(key === 'w' && currentDir.z === 0) dir.set(0, 0, 1);
    if(key === 's' && currentDir.z === 0) dir.set(0, 0, -1);
}

function animate() {
    requestAnimationFrame(animate);

    const head = snake[0].position.clone().add(dir.multiplyScalar(speed));
    
    ['x', 'y', 'z'].forEach(axis => {
        head[axis] = ((head[axis] + CUBE_SIZE/2) % CUBE_SIZE) - CUBE_SIZE/2;
    });

    particles.forEach((particle, index) => {
        if(head.distanceTo(particle.position) < 1) {
            scene.remove(particle);
            particles.splice(index, 1);
            speed *= 1.02;
            score++;
            
            if(score === 100) {
                endGame();
            }
        }
    });

    for(let i = snake.length - 1; i > 0; i--) {
        snake[i].position.copy(snake[i-1].position);
    }
    snake[0].position.copy(head);

    renderer.render(scene, camera);
}

function endGame() {
    document.getElementById('endMessage').style.display = 'block';
    document.getElementById('tagline').textContent = 'When The Pieces Fall Into Place, The Magic Unfolds';
    document.getElementById('company').textContent = '';

    setTimeout(() => {
        document.getElementById('tagline').style.transform = 'rotate(360deg)';
        document.getElementById('tagline').style.transition = 'transform 2s';
        setTimeout(() => {
            document.getElementById('tagline').textContent = 'Unsolvablr';
            document.getElementById('company').textContent = 'a jigsaw company';
        }, 2000);
    }, 3000);
}

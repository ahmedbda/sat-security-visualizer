// global variables
let scene, camera, renderer, earth, controls, stars;
let asteroids3D = []; 

// textures (on les charge une seule fois au début)
let earthTexture, rockTexture;

function init() {
    // scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Noir pur

    // camera
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.z = 35; 

    // renderer
    renderer = new THREE.WebGLRenderer({ antialias: true }); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('scene-container').appendChild(renderer.domElement);

    // --- CHARGEMENT DES IMAGES (TEXTURES) ---
    const loader = new THREE.TextureLoader();
    
    // 1. Image de la Terre (Wikimedia)
    earthTexture = loader.load('https://upload.wikimedia.org/wikipedia/commons/9/9d/MODIS_Map.jpg');
    
    // 2. Image de Roche pour les astéroïdes (Texture lunaire générique)
    rockTexture = loader.load('https://upload.wikimedia.org/wikipedia/commons/2/2c/Generic_Celestia_asteroid_texture.jpg');

    // --- CRÉATION DE LA TERRE ---
    // On utilise MeshBasicMaterial = Pas besoin de lumière, l'image s'affiche brute
    const geometry = new THREE.SphereGeometry(6, 64, 64); 
    const material = new THREE.MeshBasicMaterial({ 
        map: earthTexture 
    }); 

    earth = new THREE.Mesh(geometry, material);
    scene.add(earth);

    // décor
    createStars();

    // controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true; 
    controls.autoRotateSpeed = 0.5;
}

function createAsteroid3D(asteroidData) {
    const realDistance = parseFloat(asteroidData.close_approach_data[0].miss_distance.kilometers);
    const visualDistance = 14 + (realDistance / 1000000); 

    const isDangerous = asteroidData.is_potentially_hazardous_asteroid;
    
    // COULEUR :
    // Si dangereux : On teinte la texture en Rouge (0xffaaaa)
    // Sinon : On laisse Blanc (0xffffff) pour voir la texture de roche naturelle
    const tintColor = isDangerous ? 0xff5555 : 0xffffff; 
    const radius = isDangerous ? 0.6 : 0.3;

    // FORME : Dodecahedron (Irrégulier, ressemble à un rocher)
    const geometry = new THREE.DodecahedronGeometry(radius, 0);

    // MATIÈRE : Basic (pas de lumière) + Texture de roche
    const material = new THREE.MeshBasicMaterial({ 
        map: rockTexture,  // On plaque l'image de roche
        color: tintColor   // On applique la teinte (rouge ou normale)
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Position aléatoire
    const angle = Math.random() * Math.PI * 2; 
    const height = (Math.random() - 0.5) * 15; 

    mesh.userData = { 
        distance: visualDistance,
        angle: angle,
        speed: 0.0005 + Math.random() * 0.0005, 
        height: height,
        rotSpeedX: (Math.random() - 0.5) * 0.02,
        rotSpeedZ: (Math.random() - 0.5) * 0.02
    };

    scene.add(mesh);
    asteroids3D.push(mesh);
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();

    if (stars) stars.rotation.y -= 0.0001;

    asteroids3D.forEach((mesh) => {
        const data = mesh.userData;

        // Orbite
        data.angle += data.speed; 
        mesh.position.x = Math.cos(data.angle) * data.distance;
        mesh.position.z = Math.sin(data.angle) * data.distance;
        mesh.position.y = data.height;
        
        // Rotation du caillou sur lui-même
        mesh.rotation.x += data.rotSpeedX;
        mesh.rotation.z += data.rotSpeedZ;
    });

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 4000; 

    const positions = new Float32Array(starCount * 3);
    for(let i = 0; i < starCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 800;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff, 
        size: 0.5,      
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true 
    });

    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

async function fetchAsteroidData() {
    const list = document.getElementById('asteroids-list');

    try {
        const response = await fetch('/asteroids');
        const data = await response.json();

        list.innerHTML = '';

        const dateKey = Object.keys(data.near_earth_objects)[0];
        const asteroids = data.near_earth_objects[dateKey];

        // nettoyage
        asteroids3D.forEach(obj => scene.remove(obj));
        asteroids3D = [];

        asteroids.forEach(asteroid => {
            const div = document.createElement('div');
            div.className = 'asteroid-item';
            
            let cleanName = asteroid.name.replace('(', '').replace(')', '');
            
            if (asteroid.is_potentially_hazardous_asteroid) {
                div.classList.add('danger-block');
                cleanName = '[Warning] ' + cleanName;
            }

            const size = Math.round(asteroid.estimated_diameter.meters.estimated_diameter_max); 
            const dist = Math.round(asteroid.close_approach_data[0].miss_distance.kilometers);

            div.innerHTML = `
                <div class="asteroid-name">${cleanName}</div>
                <div>Size: ${size} meters</div>
                <div>Distance: ${dist} kilometers</div>
            `;
            list.appendChild(div);                
            createAsteroid3D(asteroid); 
        });

    } catch (error) {
        console.error(error);
        list.innerHTML = "Error loading data.";
    }
}

init();
fetchAsteroidData();
animate();
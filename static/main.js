// global variables
let scene, camera, renderer, earth, controls;

function init() {
    // empty scene (space)
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000003); // background

    // camera
    // parameters : field of view (75°), aspect ratio (largeur/hauteur), min distance, max distance
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.z = 15; // backing camera to see the eartj

    renderer = new THREE.WebGLRenderer({ antialias: true }); // antialias for edges
    // renderer
    renderer.setSize(window.innerWidth, window.innerHeight);

    // adding it to the html page ('static/index.html')
    document.getElementById('scene-container').appendChild(renderer.domElement);

    // earth with 3js
    const geometry = new THREE.SphereGeometry(5.5, 20, 20); //5 radius and 32 longitude/lattitude lines
    const material = new THREE.MeshBasicMaterial({ color: 0x287ab8, wireframe: true}); // blue and only wireframes (no filling for the triangles, thickness upped), fog for gradient

    earth = new THREE.Mesh(geometry, material);
    scene.add(earth);

    // orbit control with the user input
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // UX
    controls.enableDamping = true; // inertia
    controls.dampingFactor = 0.02;
    
    // zoom limits
    controls.minDistance = 6;
    controls.maxDistance = 30;
    
    // auto rotation when user is not touching
    controls.autoRotate = true; 
    controls.autoRotateSpeed = 1.0;
}

// constant earth rotation
function animate() {
    // calling it in a loop
    requestAnimationFrame(animate);

    // rotation with the user input
    if (controls) {
            controls.update();
    }

    // rendering scene from the camera
    renderer.render(scene, camera);
}

// updating the sizes in case of a window resize
window.addEventListener('resize', () => {
    // updating camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // updating render
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// calling the functions
init();
animate();
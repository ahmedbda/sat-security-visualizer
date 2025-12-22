// global variables for scene management
let scene, camera, renderer, earth, controls;
// array to store asteroid meshes for interaction
let asteroidsElems = []; 
// variables for click interaction (raycasting)
let raycaster, pointer;
// variable to keep track of the currently selected asteroid or earth
let currentSelection = null;

// visual scaling constants
const EARTH_RADIUS = 10;       
const DISTANCE_SCALE = 100000; 
const SIZE_SCALE = 50;        

// initialization function
function init() {
    // creating the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505); 

    // setting up the camera
    const aspect = window.innerWidth / window.innerHeight; // aspect ratio
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2000); 
    camera.position.set(40, 20, 140); 
    camera.lookAt(0, 0, 0); 

    // setting up the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true }); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('scene-container').appendChild(renderer.domElement);

    // creating earth with 15 x 15 wireframe
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 15, 15); 
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x00aaff, // base blue color
        wireframe: true,
        transparent: true,
        opacity: 0.4
    }); 
    earth = new THREE.Mesh(geometry, material);
    // adding a name for click detection logic
    earth.name = "Earth"; 
    scene.add(earth);

    // setting up orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;       
    controls.autoRotateSpeed = 0.2; 
    controls.minDistance = EARTH_RADIUS + 2; 
    controls.maxDistance = 800;              

    // initializing raycaster
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    // adding an event listener for clicking
    window.addEventListener('click', onMouseClick);
}

// function to handle clicks
function onMouseClick(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    // check intersection with asteroids AND earth
    // we create a temporary array including earth to check everything
    const objectsToCheck = [...asteroidsElems, earth];
    const intersects = raycaster.intersectObjects(objectsToCheck);

    if (intersects.length > 0) {
        const selectedObject = intersects[0].object;
        
        // reset previous selection color
        if (currentSelection) {
            if (currentSelection.name === "Earth") {
                currentSelection.material.color.setHex(0x00aaff); // back to blue
            } else {
                currentSelection.material.color.setHex(0xffffff); // back to white
            }
        }

        // apply new color and update info
        currentSelection = selectedObject;

        if (selectedObject.name === "Earth") {
            // handle earth selection
            selectedObject.material.color.setHex(0x00ff66); // green highlight
            displayEarthInfo();
        } else {
            // handle asteroid selection
            selectedObject.material.color.setHex(0xd1001f); // red highlight
            displayAsteroidInfo(selectedObject.userData.rawData);
        }
    }
}

// function to display earth info in bottom panel
function displayEarthInfo() {
    const infoPanel = document.getElementById('info-content');
    infoPanel.innerHTML = `
        <div>
            <div>Object type: Planet</div>
            <div>Name: Gaïa (Earth)</div>
            <div>Size: 12,742 kilo-meters</div>
            <div>Danger: Habitable</div>
        </div>
    `;
}

// function to display asteroid info in bottom panel
function displayAsteroidInfo(data) {
    const infoPanel = document.getElementById('info-content');
    
    const name = data.name.replace('(', '').replace(')', '');
    const size = Math.round(data.estimated_diameter.meters.estimated_diameter_max);
    const distance = Math.round(data.close_approach_data[0].miss_distance.kilometers);
    const isHazardous = data.is_potentially_hazardous_asteroid ? "Yes" : "No";

    infoPanel.innerHTML = `
        <div>
            <div>Object type: Asteroid</div>
            <div>Name: ${name}</div>
            <div>Size: ${size} meters</div>
            <div>Distance: ${distance.toLocaleString()} kilo-meters</div>
            <div>Danger: ${isHazardous}</div>
        </div>
    `;
}

function createAsteroid3D(asteroidData) {
    const realDistanceKm = parseFloat(asteroidData.close_approach_data[0].miss_distance.kilometers);
    const visualDistance = EARTH_RADIUS + (realDistanceKm / DISTANCE_SCALE);

    const realSizeMeters = asteroidData.estimated_diameter.meters.estimated_diameter_max;
    let visualRadius = (realSizeMeters / SIZE_SCALE) / 2;
    if (visualRadius < 0.5) visualRadius = 0.5; 

    // geometry
    const geometry = new THREE.IcosahedronGeometry(visualRadius, 0);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        wireframe: true 
    });
    const mesh = new THREE.Mesh(geometry, material);

    // random position
    const theta = Math.random() * Math.PI * 2; 
    const phi = Math.acos((Math.random() * 2) - 1); 

    mesh.position.x = visualDistance * Math.sin(phi) * Math.cos(theta);
    mesh.position.y = visualDistance * Math.sin(phi) * Math.sin(theta);
    mesh.position.z = visualDistance * Math.cos(phi);

    // data
    mesh.userData = { 
        distance: visualDistance,
        theta: theta,
        phi: phi,
        speed: 0.00002 + Math.random() * 0.00005,
        rawData: asteroidData 
    };

    scene.add(mesh);
    asteroidsElems.push(mesh);
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();

    asteroidsElems.forEach((mesh) => {
        const data = mesh.userData;
        data.theta += data.speed; 
        
        mesh.position.x = data.distance * Math.sin(data.phi) * Math.cos(data.theta);
        mesh.position.y = data.distance * Math.sin(data.phi) * Math.sin(data.theta);
        mesh.position.z = data.distance * Math.cos(data.phi);
        
        mesh.rotation.x += 0.002;
        mesh.rotation.y += 0.002;
    });

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

async function fetchAsteroidData(date = null) { // date is null by default (auto date)
    const statusPanel = document.getElementById('status-content');
    const infoPanel = document.getElementById('info-content');
    
    // removing selection (needed for date updates)
    if (currentSelection) {
        // if it was the earth, remaking it blue (asteroids are unselected automatically)
        if (currentSelection.name === "Earth") {
            currentSelection.material.color.setHex(0x00aaff);
        }
        // forgetting selection
        currentSelection = null;
    }

    statusPanel.innerHTML = `<div>Scanning...</div>`;

    try {
        // building url with the date (auto or selected)
        let url = '/asteroids';
        if (date) {
            url += `?date=${date}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`http error`);

        const data = await response.json();

        if (!data.near_earth_objects) {
            statusPanel.innerHTML = `<div>No data found</div>`;
            return;
        }

        const dateKey = Object.keys(data.near_earth_objects)[0];
        const asteroids = data.near_earth_objects[dateKey];
        const count = asteroids.length;

        // update top panel (status)
        statusPanel.innerHTML = `
            <div>
                <div>Data source: <a href="https://data.nasa.gov/dataset/asteroids-neows-api">NASA NeoWs</a></div>
                <div>Asteroids detected: ${count}</div>
            </div>
        `;

        // update bottom panel (instruction)
        infoPanel.innerHTML = `
            <div>
                Click an object to scan
            </div>
        `;

        asteroidsElems.forEach(obj => scene.remove(obj));
        asteroidsElems = [];

        asteroids.forEach(asteroid => {
            createAsteroid3D(asteroid); 
        });

    } catch (error) {
        statusPanel.innerHTML = `<div>Error loading data</div>`;
    }
}

// preparing calendar
function setupDatePicker() {
    const dateInput = document.getElementById('date-picker');
    
    // date is today by default
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // when user changes date
    dateInput.addEventListener('change', (event) => {
        const newDate = event.target.value;
        // updating data
        fetchAsteroidData(newDate);
    });
}

init();
setupDatePicker();
fetchAsteroidData();
animate();
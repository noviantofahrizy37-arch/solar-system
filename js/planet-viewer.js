import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// DOM Elements
const canvas = document.querySelector("#planet-canvas");
const container = canvas.parentElement;

if (!canvas) {
    console.error("Canvas element #planet-canvas not found.");
} else {
    initViewer();
}

function initViewer() {
    const modelPath = canvas.getAttribute("data-model");
    if (!modelPath) {
        console.error("No model path specified in data-model attribute.");
        return;
    }

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent card background

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        10000 // large far plane to accommodate any native model size
    );
    camera.position.set(0, 0, 100);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true // support transparent background
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Set color space to match modern Three.js standard (essential for texture colors)
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 4. Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    controls.enablePan = false;

    controls.zoomSpeed = 0.1;
    controls.rotateSpeed = 0.5;

    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    
    // Extremely low zoom speed to ensure zoom happens in tiny, gradual increments
    controls.zoomSpeed = 0.01; 

    // 5. Lighting (Universal high-quality lighting)
    // Bright ambient light to ensure textures are visible in shadow areas
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    // Key Light (Simulates Sunlight)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(100, 150, 100);
    scene.add(keyLight);

    // Fill Light (Fills opposite side shadows)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-100, -50, -100);
    scene.add(fillLight);

    // 6. Load GLTF Model
    const loader = new GLTFLoader();
    let loadedModel = null;

    loader.load(
        modelPath,
        (gltf) => {
            loadedModel = gltf.scene;

            // Calculate the current bounding box and center of the model
            const box = new THREE.Box3().setFromObject(loadedModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            // Shift all child nodes to re-center the model geometry exactly around (0, 0, 0).
            // This corrects the pivot point of the model so that rotation and zoom orbit
            // around the exact physical center of the planet rather than any offset origin.
            loadedModel.children.forEach((child) => {
                child.position.x -= center.x;
                child.position.y -= center.y;
                child.position.z -= center.z;
            });

            // Reset the root scene position to origin
            loadedModel.position.set(0, 0, 0);

            // Add model to scene
            scene.add(loadedModel);

            // Dynamically adjust camera distance to fit the model size
            const cameraDist = maxDim * 1.5; // Adjust multiplier for desired framing
            camera.position.set(0, 0, cameraDist);
            camera.lookAt(0, 0, 0);

            // Adjust clipping planes based on model size
            camera.near = maxDim * 0.01;
            camera.far = maxDim * 100;
            camera.updateProjectionMatrix();

            // Adjust controls limits dynamically based on model size
            controls.target.set(0, 0, 0);
            controls.minDistance = maxDim * 0.01; // allow closer inspection
            controls.maxDistance = maxDim * 5; // allow zooming further out
            controls.update();

            // Position lights dynamically relative to the model size
            keyLight.position.set(maxDim * 3, maxDim * 4, maxDim * 3);
            fillLight.position.set(-maxDim * 3, -maxDim * 2, -maxDim * 3);

            console.log(`Loaded: ${modelPath} | Re-centered Pivot | Size: ${maxDim.toFixed(2)}`);
        },
        (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`Loading: ${Math.round(percent)}%`);
        },
        (error) => {
            console.error(`Failed to load model: ${modelPath}`, error);
        }
    );

    // 7. Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        // Slowly rotate model if loaded. Since children were shifted to (0,0,0),
        // this rotates the planet exactly on its own central spin axis.
        if (loadedModel) {
            loadedModel.rotation.y += 0.003;
        }

        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    // 8. Resize Handler
    function handleResize() {
        if (!container) return;
        
        const width = container.clientWidth;
        const height = container.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

    window.addEventListener("resize", handleResize);

    // Initial resize to trigger correct layout bounding box checks
    setTimeout(handleResize, 150);
}

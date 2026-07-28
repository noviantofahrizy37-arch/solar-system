import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.querySelector("#space");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
);

camera.position.set(0, 20, 40);

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.08;

controls.enablePan = false;

controls.zoomSpeed = 0.1;
controls.rotateSpeed = 0.5;

controls.enableDamping = true;
controls.enablePan = false;

const ambient = new THREE.AmbientLight(0xffffff, 3);
scene.add(ambient);

const pointLight = new THREE.PointLight(0xffffff, 10);
pointLight.position.set(100, 100, 100);
scene.add(pointLight);

const loader = new GLTFLoader();

let solarSystem;

const planetSection = document.querySelector(".planet-showcase");
const planetCardsContainer = document.querySelector("#planet-cards");
let hasAutoScrolled = false;

const planets = [
    { name: "Mercury", image: "mercury.jpeg", description: "Planet terkecil dan terdekat dengan Matahari." },
    { name: "Venus", image: "venus.jpeg", description: "Planet dengan atmosfer paling tebal dan suhu tinggi." },
    { name: "Earth", image: "earth.jpeg", description: "Planet tempat kehidupan berkembang dan air melimpah." },
    { name: "Mars", image: "mars.jpeg", description: "Planet merah dengan gurun luas dan gunung berapi besar." },
    { name: "Jupiter", image: "jupiter.jpeg", description: "Planet raksasa gas dengan Bintik Merah Besar yang ikonik." },
    { name: "Saturn", image: "saturn.jpeg", description: "Planet dengan sistem cincin yang paling terkenal." },
    { name: "Uranus", image: "uranus.jpeg", description: "Planet beku yang berputar miring dengan sudut unik." },
    { name: "Neptune", image: "neptune.jpeg", description: "Planet paling jauh dan sangat berangin di tata surya." }
];

if (planetCardsContainer) {
    planetCardsContainer.innerHTML = planets.map(planet => `
        <article class="planet-card">
            <img src="assets/images/${planet.image}" alt="${planet.name}">
            <div class="planet-card__body">
                <h2>${planet.name}</h2>
                <p>${planet.description}</p>
            </div>
        </article>
    `).join("");
}

function smoothScrollToSection() {
    if (!planetSection || hasAutoScrolled) return;

    hasAutoScrolled = true;

    planetSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

loader.load(
    "assets/models/solar-system.glb",

    (gltf) => {

        solarSystem = gltf.scene;

        solarSystem.traverse((obj) => {
            if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;

                if (obj.material) {
                    obj.material.needsUpdate = true;
                }
            }
        });

        const box = new THREE.Box3().setFromObject(solarSystem);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        solarSystem.position.sub(center);

        scene.add(solarSystem);

        const maxDim = Math.max(size.x, size.y, size.z);

        const fov = camera.fov * Math.PI / 180;
        const distance = (maxDim / 2) / Math.tan(fov / 2) * 1.5;

        camera.position.set(distance, distance * 0.5, distance);

        camera.near = 0.01;
        camera.far = maxDim * 100;

        camera.updateProjectionMatrix();

        controls.target.set(0, 0, 0);
        controls.minDistance = maxDim * 1;
        controls.maxDistance = maxDim * 5;

        controls.update();

        console.log("Solar System Loaded");
    },

    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100).toFixed(1) + "%");
    },

    (err) => {
        console.error(err);
    }
);

function animate() {

    requestAnimationFrame(animate);

    if (solarSystem) {

        solarSystem.rotation.y += 0.001;

        const distance = camera.position.distanceTo(controls.target);

        if (!hasAutoScrolled && distance <= controls.minDistance + 0.2) {
            smoothScrollToSection();
        }

    }

    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

});
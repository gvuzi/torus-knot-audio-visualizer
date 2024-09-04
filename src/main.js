import * as THREE from 'three';
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd1d1d1); 
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;
const renderer = new THREE.WebGLRenderer({
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("main-scene").appendChild( renderer.domElement );

// torus knot geometry implementation
let geometry = new THREE.TorusKnotGeometry(14, 3, 200, 20); 
const material = new THREE.PointsMaterial({ 
	size: 0.4,
  vertexColors: true
}); 
const torusKnot = new THREE.Points(geometry, material); 
torusKnot.position.set(0,0,0);
scene.add(torusKnot);

// audio setup
const audioLoader = new THREE.AudioLoader();
const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const analyser = new THREE.AudioAnalyser(sound, 2048);


// DOM elements
const main_container = document.querySelector('.main-container');
const volume_container = document.querySelector('.volume-container');
const exit_container = document.querySelector('.exit-container');
const icons_container = document.querySelector('.icons-container');
const volume_slider = document.getElementById("volume_slider");
const volume_label = document.getElementById("volume");

const demo_button = document.getElementById('demo_button');
demo_button.addEventListener('click', demoScene); 

const input = document.getElementById("audio_file");
input.addEventListener("change", audioScene);

const main_menu_button = document.getElementById('main_menu_button');
main_menu_button.addEventListener('click', mainScene);


let clock = new THREE.Clock();
let demo_played, audio_played, ring_index, total_rings, delta = 0;
let interval = 1 / 45; //45 frames per second
const points = geometry.attributes.position.count; // 4221 points
let rings = []; // 2D array holding [starting_index, ending_index] in each row (each ring)
let colors = []; // 2D array holding [r, g, b] in each row (each point)
let arrayFlat = new Float32Array(); // flattened "colors" array of rgb values


//volume slider implementation
let volume = 1.0;
volume_slider.oninput = function() {
    volume_label.innerHTML = this.value + "%";
    volume = this.value / 100;
  }

  
setToWhite();
calculateRings();


/* helper functions */
function setToWhite() {
    // pushes white r,g,b values into each row in 2D "colors" array (4221 * 3 = 12663 rgb values for mapping of torus knot)
    for(let i = 0; i < points; i++) {
            colors.push([1.0, 1.0, 1.0]); 
        }
        arrayFlat = colors.flat();
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(arrayFlat,3));
}

function calculateRings() {
    // each "ring" essentially has 21 points, with 19 points being used for the ring and 2 points being "gaps", with the first point starting at point 22 
    total_rings = (points - 22) / 21; // 199.952380952
    total_rings = Math.ceil(total_rings);

    let starting_index = 22; 
    let ending_index = 0;
    
    for (let i = 0; i < total_rings; i++) {
        ending_index = starting_index + 19;
        rings.push([starting_index, ending_index]);
        starting_index += 21;
    }  

}

function updateScene() {
    if (audio_played == 1 && !sound.isPlaying) {
        mainScene();
        audio_played = 0;
    }
    
    if (demo_played == 1 && !sound.isPlaying) {
        mainScene();
        main_menu_button.style.paddingTop = '0px';
        demo_played = 0;
    }
}


/* scenes */
function mainScene() {
    main_container.style.display = 'flex';
    icons_container.style.display = 'flex';
    volume_container.style.display = 'none';
    exit_container.style.display = 'none';
    sound.stop();
    input.value = ""; // resets file input after loading
}

function audioScene() {
    volume_slider.value = 100;
    volume_label.innerHTML = "100%";
    volume_container.style.display = 'flex';
    exit_container.style.display = 'flex';
    main_container.style.display = 'none';
    icons_container.style.display = 'none';
    const user_audio_file = URL.createObjectURL(this.files[0]);
    audioLoader.load(user_audio_file, function(buffer) {
        sound.setBuffer(buffer);
        volume = 1.0;
        sound.play();
        audio_played = 1;
    });
}

function demoScene() {
    exit_container.style.display = 'flex';
    main_container.style.display = 'none';
    icons_container.style.display = 'none';
    main_menu_button.style.paddingTop = '5px';
    audioLoader.load('/ginseng.mp3', function(buffer) {
        sound.setBuffer(buffer);
        volume = 1.25;
        sound.play();
        demo_played = 1;
    });
} 


/* animation functions */
function ringAnimation() {
    for (ring_index = total_rings-1; ring_index > 0; ring_index--) {
        for(let j = rings[ring_index][0]; j <= rings[ring_index][1]; j++) {
            colors[j] = colors[j-21]; //shifts every ring's rgb value to the right
            }
    }
    arrayFlat = colors.flat(); 
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(arrayFlat,3));
}

function animate() {
    let data = analyser.getAverageFrequency();
    let random_g = Math.random();

    requestAnimationFrame(animate);
    delta += clock.getDelta();

    if (delta > interval) {

    ringAnimation();
    sound.setVolume(volume);
    updateScene();

    if (data > 90) { 
        for (let i = rings[0][0]; i <= rings[0][1]; i++) {
            colors[i] = [1.0, 0.0, 0.0]; // red 
            }
        }
    else if (data > 70  && data < 90) {
        for (let i = rings[0][0]; i <= rings[0][1]; i++) {
            colors[i] = [0.0, random_g, 1.0]; // gradient of blue
            }
        }   

    else {
        for (let i = rings[0][0]; i <= rings[0][1]; i++) {
            colors[i] = [1.0, 1.0, 1.0]; // white
            }
        }

	torusKnot.rotation.x += 0.003;
	torusKnot.rotation.y += 0.003;

    renderer.render(scene, camera);

    delta = delta % interval;
    }
}
requestAnimationFrame(animate)
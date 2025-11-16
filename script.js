import * as THREE from "https://cdn.skypack.dev/three@0.149.0";

let camera, scene, renderer, clock, points;
let uniforms;

let sphere = new THREE.SphereGeometry(7, 50, 50);

function init() {
	const container = document.getElementById("shader");

	clock = new THREE.Clock();

	scene = new THREE.Scene();

	uniforms = {
		uTime: { type: "f", value: 1.0 },
		uResolution: { type: "v2", value: new THREE.Vector2() },
		u_progress: {
			value: 0
		},
		uMouse: {
			value: { x: 0.5, y: 0.5 }
		}
	};

	const material = new THREE.ShaderMaterial({
		uniforms,
		vertexShader: document.getElementById("vertex").textContent,
		fragmentShader: document.getElementById("fragment").textContent
	});

	material.transparent = true;
	material.depthWrite = false;

	const pointsGeometry = new THREE.BufferGeometry();

	pointsGeometry.setAttribute(
		"position",
		new THREE.BufferAttribute(sphere.attributes.position.array, 3)
	);

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0xffffff, 1);
	renderer.setPixelRatio(window.devicePixelRatio);

	material.uniforms.uResolution.value.x = renderer.domElement.width;
	material.uniforms.uResolution.value.y = renderer.domElement.height;

	camera = new THREE.PerspectiveCamera(
		75,
		renderer.domElement.width / renderer.domElement.height,
		0.1,
		100
	);
	camera.position.z = 12;
	camera.position.y = 0;
	camera.position.x = 0;

	let running = false;

	let finished = function () {
		running = false;
	};

	points = new THREE.Points(pointsGeometry, material);
	scene.add(points);
	window.addEventListener("mousemove", function (e) {
		material.uniforms.uMouse.value.x =
			(event.clientX / window.innerWidth) * 2 - 1;
		material.uniforms.uMouse.value.y =
			-(event.clientY / window.innerHeight) * 2 + 1;
	});

	// window.addEventListener("click", function (e) {
	// 	if (!running) {
	// 		running = true;
	// 		gsap.to(material.uniforms.u_progress, {
	// 			duration: 6.5,
	// 			value: material.uniforms.u_progress.value + Math.PI,
	// 			delay: 0,
	// 			onComplete: finished
	// 		});
	// 	}
	// });

	container.appendChild(renderer.domElement);

	onWindowResize();
	window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
	renderer.setSize(window.innerWidth, window.innerHeight);
	uniforms.uResolution.value.x = renderer.domElement.width;
	uniforms.uResolution.value.y = renderer.domElement.height;
}

function render() {
	uniforms.uTime.value = clock.getElapsedTime();
	renderer.render(scene, camera);

	if (points) {
		points.rotation.x += 0.002;
		points.rotation.z += 0.0002;
	}
}

function animate() {
	render();
	requestAnimationFrame(animate);
}

init();
animate();
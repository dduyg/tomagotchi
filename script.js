let camera, scene, renderer, clock;
let uniforms, headMesh, bodyMesh, legMesh, armsMesh, noseMesh;

let SCREEN_WIDTH = window.innerWidth;
			let SCREEN_HEIGHT = window.innerHeight;
			let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

function init() {
	const container = document.getElementById("shader");

	clock = new THREE.Clock();
	camera =  new THREE.PerspectiveCamera( 50, 0.5 * aspect, 1, 10000 );
	camera.position.z = 3;

	scene = new THREE.Scene();

 const head =  new THREE.SphereGeometry( .2, 320, 320, 160 )
 
  const body =  new THREE.SphereGeometry( .3, 320, 320, 160 )
  
   const legs =  new THREE.SphereGeometry( .4, 320, 320, 160 )
   
   const arms = new THREE.CylinderGeometry( .01, .01, 1, 132, 132 ); 
  
  
    const nose = new   THREE.ConeGeometry( .1, .8, 132, 132 ); 


	uniforms = {
		u_time: { type: "f", value: 1.0 },
		u_resolution: { type: "v2", value: new THREE.Vector2() },
	};

	const material = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
		uniforms,
		vertexShader: document.getElementById("vertex").textContent,
		fragmentShader: document.getElementById("fragment").textContent
	});

	 headMesh = new THREE.Mesh(head, material);
	scene.add(headMesh);
  
  headMesh.position.y+=.6
  
   noseMesh = new THREE.Mesh(nose, material);
	scene.add(noseMesh);
  
  noseMesh.position.y+=.6
  
   noseMesh.rotation.x = Math.PI / 2;
  
    // noseMesh.rotation.z = Math.PI / 2;
  
  
   bodyMesh = new THREE.Mesh(body, material);
	scene.add(bodyMesh);
  
  bodyMesh.position.y+=.1
  
   armsMesh = new THREE.Mesh(arms, material);
	scene.add(armsMesh);
  
  armsMesh.position.y+=.1
  armsMesh.position.z+=.15
  
  armsMesh.rotation.x = Math.PI / 2;
  
    armsMesh.rotation.z = Math.PI / 2;
  
  
   legsMesh = new THREE.Mesh(legs, material);
	scene.add(legsMesh);
  
  legsMesh.position.y -=.6

	renderer = new THREE.WebGLRenderer({alpha: false});
	renderer.setPixelRatio(window.devicePixelRatio);

	container.appendChild(renderer.domElement);

	onWindowResize();
	window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
	renderer.setSize(window.innerWidth, window.innerHeight);
	uniforms.u_resolution.value.x = renderer.domElement.width;
	uniforms.u_resolution.value.y = renderer.domElement.height;
}

function render() {
	uniforms.u_time.value = clock.getElapsedTime();
 
	renderer.render(scene, camera);
}

function animate() {
  
	render();
	requestAnimationFrame(animate);
}

init();
animate();
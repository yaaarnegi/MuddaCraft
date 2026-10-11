/**
 * MuddaCraft Studio - Three.js 3D WebGL Mudda Stool Viewer
 * Follows threejs-skills & genjutsu guidelines:
 * - PBR Materials & 3-Point Lighting
 * - Procedural Sarkanda Reed & Bamboo Geometry
 * - Damped OrbitControls & Memory Disposal
 */

let scene, camera, renderer, controls, animationId, muddaGroup;
let isViewerActive = false;

window.open3DViewer = function(productId = 'mudda-01') {
  const modal = document.getElementById('three-modal');
  const container = document.getElementById('three-canvas-container');
  if (!modal || !container) return;

  modal.classList.add('active');
  isViewerActive = true;

  // Initialize Three.js scene
  setTimeout(() => {
    initThreeScene(container);
  }, 50);
};

window.close3DViewer = function() {
  const modal = document.getElementById('three-modal');
  if (modal) modal.classList.remove('active');
  isViewerActive = false;

  // Cleanup WebGL resources to prevent memory leaks
  disposeThreeScene();
};

function initThreeScene(container) {
  if (typeof THREE === 'undefined') {
    container.innerHTML = '<div style="padding: 40px; text-align: center;">WebGL 3D engine loading...</div>';
    return;
  }

  // Clear existing canvas
  container.innerHTML = '';

  const width = container.clientWidth || 770;
  const height = container.clientHeight || 420;

  // 1. Scene
  scene = new THREE.Scene();

  // 2. Camera
  camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0, 1.8, 3.8);

  // 3. Renderer with ACES ToneMapping & Anti-aliasing
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // 4. OrbitControls with smooth damping
  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 2.0;
    controls.maxDistance = 6.0;
    controls.target.set(0, 0, 0);
  }

  // 5. Studio Lighting (PBR)
  const ambientLight = new THREE.AmbientLight(0xfff6ea, 0.9);
  scene.add(ambientLight);

  // Key Light (Warm Sun)
  const keyLight = new THREE.DirectionalLight(0xffeedb, 1.4);
  keyLight.position.set(4, 6, 4);
  keyLight.castShadow = true;
  scene.add(keyLight);

  // Rim Light (Terracotta Accent Backlight)
  const rimLight = new THREE.DirectionalLight(0xb85028, 0.8);
  rimLight.position.set(-4, 3, -4);
  scene.add(rimLight);

  // Soft Fill Light (Cane Gold)
  const fillLight = new THREE.DirectionalLight(0xd4a373, 0.5);
  fillLight.position.set(-3, 1, 3);
  scene.add(fillLight);

  // 6. Build the Procedural 3D Mudda Stool
  buildMuddaModel();

  // 7. Render Loop
  function animate() {
    if (!isViewerActive) return;
    animationId = requestAnimationFrame(animate);

    if (muddaGroup) {
      muddaGroup.rotation.y += 0.0035; // Gentle auto-rotation
    }

    if (controls) controls.update();
    renderer.render(scene, camera);
  }

  animate();

  // Resize handler
  window.addEventListener('resize', onResize);
}

function buildMuddaModel() {
  muddaGroup = new THREE.Group();

  // Materials
  const caneMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9b382,
    roughness: 0.6,
    metalness: 0.05
  });

  const reedCoreMaterial = new THREE.MeshStandardMaterial({
    color: 0xcd9f68,
    roughness: 0.7,
    metalness: 0.02
  });

  const bambooHoopMaterial = new THREE.MeshStandardMaterial({
    color: 0xb57c3d,
    roughness: 0.45,
    metalness: 0.08
  });

  const juteTopMaterial = new THREE.MeshStandardMaterial({
    color: 0xdfcbaf,
    roughness: 0.85,
    metalness: 0.0
  });

  // A. Inner Core Cylinder
  const coreGeo = new THREE.CylinderGeometry(0.72, 0.82, 1.25, 32);
  const coreMesh = new THREE.Mesh(coreGeo, reedCoreMaterial);
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  muddaGroup.add(coreMesh);

  // B. 32 Vertical Sarkanda Reeds arranged around the circumference
  const reedCount = 34;
  const height = 1.28;
  const reedGeo = new THREE.CylinderGeometry(0.038, 0.038, height, 8);

  for (let i = 0; i < reedCount; i++) {
    const angle = (i / reedCount) * Math.PI * 2;
    const topRadius = 0.77;
    const bottomRadius = 0.86;

    const reedMesh = new THREE.Mesh(reedGeo, caneMaterial);
    reedMesh.position.x = Math.cos(angle) * ((topRadius + bottomRadius) / 2);
    reedMesh.position.z = Math.sin(angle) * ((topRadius + bottomRadius) / 2);
    reedMesh.position.y = 0;

    // Slight hourglass angle
    reedMesh.rotation.y = angle;
    reedMesh.rotation.z = (Math.cos(angle) * 0.06);
    reedMesh.castShadow = true;
    muddaGroup.add(reedMesh);
  }

  // C. Structural Bamboo Hoops
  // Top Hoop
  const topHoopGeo = new THREE.TorusGeometry(0.81, 0.055, 16, 48);
  const topHoop = new THREE.Mesh(topHoopGeo, bambooHoopMaterial);
  topHoop.rotation.x = Math.PI / 2;
  topHoop.position.y = 0.62;
  topHoop.castShadow = true;
  muddaGroup.add(topHoop);

  // Bottom Base Hoop
  const bottomHoopGeo = new THREE.TorusGeometry(0.9, 0.06, 16, 48);
  const bottomHoop = new THREE.Mesh(bottomHoopGeo, bambooHoopMaterial);
  bottomHoop.rotation.x = Math.PI / 2;
  bottomHoop.position.y = -0.62;
  bottomHoop.castShadow = true;
  muddaGroup.add(bottomHoop);

  // Mid Reinforcement Hoop
  const midHoopGeo = new THREE.TorusGeometry(0.82, 0.04, 16, 48);
  const midHoop = new THREE.Mesh(midHoopGeo, bambooHoopMaterial);
  midHoop.rotation.x = Math.PI / 2;
  midHoop.position.y = 0;
  muddaGroup.add(midHoop);

  // D. Woven Top Mandala Seating Cushion
  const seatGeo = new THREE.CylinderGeometry(0.79, 0.79, 0.08, 36);
  const seatMesh = new THREE.Mesh(seatGeo, juteTopMaterial);
  seatMesh.position.y = 0.64;
  seatMesh.castShadow = true;
  muddaGroup.add(seatMesh);

  // E. Concentric Cord Pattern on Seating Surface
  for (let r = 0.15; r < 0.75; r += 0.14) {
    const cordGeo = new THREE.TorusGeometry(r, 0.02, 12, 36);
    const cordMesh = new THREE.Mesh(cordGeo, caneMaterial);
    cordMesh.rotation.x = Math.PI / 2;
    cordMesh.position.y = 0.68;
    muddaGroup.add(cordMesh);
  }

  // F. Soft Floor Contact Shadow
  const shadowGeo = new THREE.CircleGeometry(1.2, 32);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x221a14,
    transparent: true,
    opacity: 0.15
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = -0.68;
  muddaGroup.add(shadowMesh);

  scene.add(muddaGroup);
}

function onResize() {
  const container = document.getElementById('three-canvas-container');
  if (!container || !renderer || !camera) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function disposeThreeScene() {
  if (animationId) cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onResize);

  if (scene) {
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }

  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
  }

  scene = null;
  camera = null;
  renderer = null;
  controls = null;
  muddaGroup = null;
}

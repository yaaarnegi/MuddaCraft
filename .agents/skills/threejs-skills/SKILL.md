---
name: threejs-skills
description: >-
  Interactive 3D WebGL guidelines using Three.js: scene architecture, PBR lighting,
  procedural geometry, camera physics, and memory management.
---

# Three.js Skills & 3D Interactive WebGL Guidelines

## 1. Scene & Renderer Setup
* **Pixel Ratio Clamping:** Always clamp pixel ratio to avoid rendering lag on Retina displays:
  ```javascript
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  ```
* **Color Management:** Use `THREE.ACESFilmicToneMapping` and `renderer.outputColorSpace = THREE.SRGBColorSpace` for photo-realistic material fidelity.
* **Canvas Sizing:** Handle `window.resize` dynamically updating `camera.aspect` and `camera.updateProjectionMatrix()`.

## 2. Materials & Lighting (PBR)
* Use `MeshStandardMaterial` or `MeshPhysicalMaterial` for real-world physical rendering (roughness, metalness, clearcoat).
* Three-point lighting architecture:
  * Key light: Soft directional warm light with cast shadows.
  * Fill light: Cool ambient/hemisphere light to illuminate crevices.
  * Rim light: Crisp backlight to separate 3D silhouettes from dark/light backgrounds.

## 3. Interactive Controls & Physics
* Use `OrbitControls` with dampening enabled:
  ```javascript
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  ```
* Bind mouse move events to smooth rotation offsets using Lerp or GSAP.

## 4. Resource Disposal & Cleanup
* Always clean up geometries, textures, and materials when removing 3D canvases to prevent WebGL context leaks:
  `mesh.geometry.dispose(); mesh.material.dispose(); renderer.dispose();`

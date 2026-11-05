import * as THREE from './assets/vendor/three.module.js';

const initialCanvas = document.querySelector('#demo-particles');
const shell = document.querySelector('#demo-shell');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (initialCanvas && shell && !reducedMotion.matches) {
  let canvas = initialCanvas;
  let renderer = null;
  let context = null;

  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  } catch {
    // Embedded browsers can disable WebGL. Project the Three.js scene onto 2D canvas.
    const replacement = canvas.cloneNode();
    canvas.replaceWith(replacement);
    canvas = replacement;
    context = canvas.getContext('2d');
  }

  if (renderer || context) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
    camera.position.z = 9;
    const count = 56;
    const positions = new Float32Array(count * 3);
    const velocities = Array.from({ length: count }, (_, i) => .28 + (i % 7) * .055);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = -5.4 + Math.random() * 10.8;
      positions[i * 3 + 1] = (Math.random() - .5) * 2.8;
      positions[i * 3 + 2] = (Math.random() - .5) * 2.5;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffaa63, size: .055, sizeAttenuation: true, transparent: true, opacity: .46, depthWrite: false }));
    scene.add(points);

    let width = 0;
    let height = 0;
    let visible = false;
    let frame = 0;
    let previous = 0;
    let speed = .35;
    let desiredSpeed = .35;
    let desiredOpacity = .46;
    const projected = new THREE.Vector3();

    function resize() {
      const rect = shell.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (renderer) renderer.setSize(width, height, false);
      else {
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
    }

    function draw(now) {
      if (!visible || document.hidden) { frame = 0; return; }
      const dt = Math.min((now - (previous || now)) / 1000, .05);
      previous = now;
      speed += (desiredSpeed - speed) * .06;
      points.material.opacity += (desiredOpacity - points.material.opacity) * .06;
      const array = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        array[i * 3] += velocities[i] * speed * dt;
        if (array[i * 3] > 5.5) array[i * 3] = -5.5;
      }
      geometry.attributes.position.needsUpdate = true;
      points.rotation.y = Math.sin(now * .00017) * .09;

      if (renderer) renderer.render(scene, camera);
      else {
        context.clearRect(0, 0, width, height);
        for (let i = 0; i < count; i++) {
          projected.set(array[i * 3], array[i * 3 + 1], array[i * 3 + 2]).applyEuler(points.rotation).project(camera);
          const x = (projected.x + 1) * width / 2;
          const y = (1 - projected.y) * height / 2;
          const radius = Math.max(1, 2.1 + array[i * 3 + 2] * .35);
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fillStyle = `rgba(255, 170, 99, ${points.material.opacity * .52})`;
          context.fill();
        }
      }
      frame = requestAnimationFrame(draw);
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { resize(); if (!frame) { previous = 0; frame = requestAnimationFrame(draw); } }
      else if (frame) { cancelAnimationFrame(frame); frame = 0; }
    }, { threshold: .05 });
    observer.observe(shell);
    new ResizeObserver(resize).observe(shell);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !frame) frame = requestAnimationFrame(draw); });
    window.addEventListener('diva-demo-stage', (event) => {
      const phase = event.detail.phase;
      desiredSpeed = phase === 'transfer' ? 3.2 : phase === 'download' ? 1.7 : .35;
      desiredOpacity = phase === 'transfer' ? .9 : phase === 'download' ? .68 : .43;
    });
  }
}

'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';

export default function GlacialScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const reduced  = useReducedMotion();

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    /* ── Renderer ──────────────────────────────────────────────────────── */
    const W = container.clientWidth  || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = false;
    renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    // Critical: canvas must fill container
    renderer.domElement.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';
    container.appendChild(renderer.domElement);

    /* ── Scene ──────────────────────────────────────────────────────────── */
    const scene = new THREE.Scene();
    scene.fog   = new THREE.FogExp2(0x050F1A, 0.018);
    // Let scene background be transparent so that public/crevasse_bg.png is visible behind it.

    /* ── Camera ──────────────────────────────────────────────────────────  */
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.set(0, 7, 14);
    camera.lookAt(0, 0, 0);

    /* ── Lights ──────────────────────────────────────────────────────────  */
    // Sky / ground gradient
    scene.add(new THREE.HemisphereLight(0x9FD8E8, 0x0A1F30, 0.6));

    // Key light
    const key = new THREE.DirectionalLight(0xC8EDF5, 2.4);
    key.position.set(8, 14, 6);
    scene.add(key);

    // Cold rim from opposite side
    const rim = new THREE.DirectionalLight(0x5FE3C0, 1.2);
    rim.position.set(-10, 6, -8);
    scene.add(rim);

    // Under-ice glow — pans with mouse
    const glow = new THREE.PointLight(0x4AB8D8, 3.5, 22);
    glow.position.set(0, -0.5, 0);
    scene.add(glow);

    /* ── Ice plane ───────────────────────────────────────────────────────  */
    const planeGeo = new THREE.PlaneGeometry(60, 60, 80, 80);

    // Gentle surface noise
    const pPos = planeGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pPos.count; i++) {
      const x = pPos.getX(i), y = pPos.getY(i);
      pPos.setZ(i,
        Math.sin(x * 0.38) * 0.09 +
        Math.cos(y * 0.52) * 0.07 +
        Math.sin(x * 0.9 + y * 0.7) * 0.03,
      );
    }
    planeGeo.computeVertexNormals();

    const iceMat = new THREE.MeshStandardMaterial({
      color:             new THREE.Color('#0C2840'),
      emissive:          new THREE.Color('#071822'),
      emissiveIntensity: 0.4,
      roughness:         0.04,
      metalness:         0.85,
    });

    const iceMesh = new THREE.Mesh(planeGeo, iceMat);
    iceMesh.rotation.x = -Math.PI / 2;
    iceMesh.position.y  = -2.2;
    scene.add(iceMesh);

    // Glowing grid lines on top of the plane — makes depth legible
    const gridGeo = new THREE.PlaneGeometry(60, 60, 30, 30);
    const edgesGeo = new THREE.EdgesGeometry(gridGeo);
    const edgesMat = new THREE.LineBasicMaterial({
      color:       0x1A5C80,
      transparent: true,
      opacity:     0.18,
    });
    const gridLines = new THREE.LineSegments(edgesGeo, edgesMat);
    gridLines.rotation.x = -Math.PI / 2;
    gridLines.position.y  = -2.18;
    scene.add(gridLines);

    /* ── Yeti spirit — layered glowing sprites ───────────────────────────  */
    function makeGlowSprite(color: string, size: number, alpha: number) {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const ctx = c.getContext('2d')!;
      const g   = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0,    color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
      g.addColorStop(0.45, color.replace(')', ', 0.08)').replace('rgb', 'rgba'));
      g.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
      const mat = new THREE.SpriteMaterial({
        map:        new THREE.CanvasTexture(c),
        transparent: true,
        blending:   THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(size, size, 1);
      return sprite;
    }

    // Outer atmospheric halo
    const yetiHalo = makeGlowSprite('rgb(95,227,192)',  12, 0.18);
    yetiHalo.position.set(0, 1.5, -6);
    scene.add(yetiHalo);

    // Inner bright core
    const yetiCore = makeGlowSprite('rgb(159,216,232)', 4.5, 0.70);
    yetiCore.position.set(0, 1.5, -6);
    scene.add(yetiCore);

    /* ── Snow particles ──────────────────────────────────────────────────  */
    const SNOW  = 1400;
    const sGeo  = new THREE.BufferGeometry();
    const sPos  = new Float32Array(SNOW * 3);
    const sVel  = new Float32Array(SNOW);
    for (let i = 0; i < SNOW; i++) {
      sPos[i*3]   = (Math.random() - 0.5) * 50;
      sPos[i*3+1] = Math.random() * 18 + 1;
      sPos[i*3+2] = (Math.random() - 0.5) * 30;
      sVel[i]     = 0.007 + Math.random() * 0.018;
    }
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    const sMat = new THREE.PointsMaterial({
      color:          0xD0EEF8,
      size:           0.065,
      transparent:    true,
      opacity:        0.70,
      sizeAttenuation: true,
      depthWrite:     false,
    });
    const snow = new THREE.Points(sGeo, sMat);
    scene.add(snow);

    /* ── Mouse tracking ──────────────────────────────────────────────────  */
    let mx = 0, my = 0;
    const onMouse = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse);

    /* ── Animation loop ──────────────────────────────────────────────────  */
    const start = performance.now();
    let raf: number;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = (performance.now() - start) / 1000;

      if (!reduced) {
        // Slow camera orbit + mouse offset
        const orbit = t * 0.06;
        const tx    = Math.sin(orbit) * 10 + mx * 1.5;
        const tz    = Math.cos(orbit) * 14;
        const ty    = 6.5 + Math.sin(t * 0.18) * 0.6 - my * 0.5;
        camera.position.x += (tx - camera.position.x) * 0.018;
        camera.position.z += (tz - camera.position.z) * 0.018;
        camera.position.y += (ty - camera.position.y) * 0.018;
        camera.lookAt(0, 0, 0);

        // Caustic glow drift
        glow.position.x += (mx * 8 - glow.position.x) * 0.03;
        glow.position.z += (my * 4 - glow.position.z) * 0.03;
        glow.intensity   = 3.0 + Math.sin(t * 1.3) * 0.8;

        // Snow fall
        for (let i = 0; i < SNOW; i++) {
          sPos[i*3+1] -= sVel[i];
          sPos[i*3]   += Math.sin(t * 0.22 + i * 0.6) * 0.001;
          if (sPos[i*3+1] < -3) sPos[i*3+1] = 18;
        }
        sGeo.attributes.position.needsUpdate = true;

        // Yeti breathe
        const b = 1 + Math.sin(t * 0.75) * 0.07;
        yetiHalo.scale.set(12 * b, 12 * b, 1);
        yetiCore.scale.set(4.5 * b, 4.5 * b, 1);
        (yetiCore.material as THREE.SpriteMaterial).opacity = 0.65 + Math.sin(t * 0.55) * 0.20;

        // Grid pulse
        edgesMat.opacity = 0.14 + Math.sin(t * 0.4) * 0.06;

        // Ice shimmer
        iceMat.emissiveIntensity = 0.35 + Math.sin(t * 0.7) * 0.10;
      }

      renderer.render(scene, camera);
    };
    tick();

    /* ── Resize ──────────────────────────────────────────────────────────  */
    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    /* ── Cleanup ──────────────────────────────────────────────────────────  */
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [reduced]);

  return (
    <div
      ref={mountRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden
    />
  );
}

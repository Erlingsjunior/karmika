import * as THREE from 'three';
import { SCALE, type Race } from '@karmika/shared';
import { radialTexture } from './fx3d';

export interface Hero3D {
  root: THREE.Group;
  update(dt: number, t: number, speed01: number, heading: number | null): void;
  setAura(on: boolean): void;
  /** 0..1: acende a lanterna à noite */
  setNight(n: number): void;
  /** vento 0..1 (balança cabelo e capa) */
  setWind(w: number): void;
  onStep?: (foot: number) => void;
}

const LOOK = {
  human: { skin: 0xe2b98a, hair: 0x4a3224, cloak: 0x3b2f5a, trim: 0x8f7bff },
  elf: { skin: 0xe9d3b0, hair: 0xd9d2a8, cloak: 0x23473a, trim: 0xb9e0a0 },
  dwarf: { skin: 0xd09a6a, hair: 0x9a4a22, cloak: 0x5a3a24, trim: 0xd9a24f },
} as const;

const mat = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true });
const OUTLINE = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normalize(position + normal*0.001)*0.0 + normal*0.028, 1.0); }',
  fragmentShader: 'void main(){ gl_FragColor = vec4(0.02,0.015,0.04,1.0); }',
});

function part(geo: THREE.BufferGeometry, color: number, pivot: [number, number, number], offset: [number, number, number] = [0, 0, 0]) {
  geo.translate(offset[0], offset[1], offset[2]);
  const m = new THREE.Mesh(geo, mat(color));
  m.castShadow = true;
  m.position.set(...pivot);
  const o = new THREE.Mesh(geo, OUTLINE);
  m.add(o);
  return m;
}

/** Herói articulado em metros (humano = 1,75 m). Será substituído pelo modelo 3D do modelador (.glb). */
export function createHero(race: Race): Hero3D {
  const L = LOOK[race];
  const S = SCALE[race];
  const k = S.height / SCALE.human.height;
  const root = new THREE.Group();
  const rig = new THREE.Group();
  rig.scale.set(S.width * (race === 'elf' ? 1.0 : 1) * k / (race === 'dwarf' ? 1.0 : 1), k, S.width * k);
  if (race === 'dwarf') rig.scale.set(1.3 * 0.8, 0.77, 1.3 * 0.8);
  if (race === 'elf') rig.scale.set(0.98, 1.11, 0.98);
  root.add(rig);

  const hipY = 0.85, shY = 1.42;
  const legL = part(new THREE.BoxGeometry(0.19, 0.85, 0.22), 0x201a2e, [-0.11, hipY, 0], [0, -0.425, 0]);
  const legR = part(new THREE.BoxGeometry(0.19, 0.85, 0.22), 0x2a2238, [0.11, hipY, 0], [0, -0.425, 0]);
  const torso = part(new THREE.BoxGeometry(0.48, 0.62, 0.27), new THREE.Color(L.cloak).multiplyScalar(1.3).getHex(), [0, hipY + 0.31, 0]);
  const belt = part(new THREE.BoxGeometry(0.5, 0.08, 0.29), 0x1a1424, [0, hipY + 0.05, 0]);
  const armL = part(new THREE.BoxGeometry(0.13, 0.6, 0.14), new THREE.Color(L.cloak).multiplyScalar(0.8).getHex(), [-0.31, shY, 0], [0, -0.3, 0]);
  const armR = part(new THREE.BoxGeometry(0.13, 0.6, 0.14), new THREE.Color(L.cloak).multiplyScalar(1.05).getHex(), [0.31, shY, 0], [0, -0.3, 0]);
  const hands = [armL, armR].map((a) => { const h = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), mat(L.skin)); h.position.set(0, -0.62, 0); a.add(h); return h; });
  void hands;
  const head = new THREE.Group();
  head.position.set(0, 1.62, 0);
  head.add(part(new THREE.IcosahedronGeometry(0.14, 1), L.skin, [0, 0, 0]));
  head.add(part(new THREE.SphereGeometry(0.155, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), L.hair, [0, 0.02, -0.01]));
  head.add(part(new THREE.BoxGeometry(0.3, 0.24, 0.12), L.hair, [0, -0.02, -0.1]));
  if (race === 'elf') {
    head.add(part(new THREE.ConeGeometry(0.04, 0.2, 4), L.skin, [0.17, 0.02, 0]));
    head.add(part(new THREE.ConeGeometry(0.04, 0.2, 4), L.skin, [-0.17, 0.02, 0]));
    head.children[head.children.length - 2].rotation.z = -Math.PI / 2;
    head.children[head.children.length - 1].rotation.z = Math.PI / 2;
  }
  if (race === 'dwarf') head.add(part(new THREE.ConeGeometry(0.17, 0.4, 6), L.hair, [0, -0.2, 0.08]));
  const cloak = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.0), new THREE.MeshStandardMaterial({ color: L.cloak, side: THREE.DoubleSide, roughness: 0.95, flatShading: true }));
  cloak.geometry.translate(0, -0.5, 0);
  cloak.position.set(0, shY + 0.05, -0.16);
  cloak.castShadow = true;
  const sigil = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), new THREE.MeshBasicMaterial({ color: L.trim }));
  sigil.scale.set(1, 1.5, 0.4); sigil.position.set(0, hipY + 0.4, 0.15);
  // lanterna na mão esquerda (pêndulo) + glow
  const lant = new THREE.Group(); lant.position.set(0, -0.62, 0.06); armL.add(lant);
  const lantBody = new THREE.Group(); lantBody.position.y = -0.05; lant.add(lantBody);
  const cage = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.17, 0.11), mat(0x2a2018)); cage.position.y = -0.14; lantBody.add(cage);
  const flame = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.06), new THREE.MeshBasicMaterial({ color: 0xffc060 })); flame.position.y = -0.14; lantBody.add(flame);
  const lantGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(64, [[0, 'rgba(255,210,130,1)'], [0.3, 'rgba(255,150,60,.4)'], [1, 'rgba(255,100,20,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false }));
  lantGlow.scale.set(1.3, 1.3, 1); lantGlow.position.y = -0.14; lantBody.add(lantGlow);
  // cabelo: rabo de cavalo em cadeia com atraso (balança ao correr e com o vento)
  const strands: THREE.Group[][] = [];
  for (const sx of [-0.05, 0, 0.05]) {
    let parent: THREE.Object3D = head; const chain: THREE.Group[] = [];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group(); g.position.set(i === 0 ? sx : 0, i === 0 ? 0.05 : -0.1, i === 0 ? -0.14 : 0);
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.06 - i * 0.012, 0.11, 0.05), mat(L.hair)); seg.position.y = -0.05; g.add(seg);
      parent.add(g); parent = g; chain.push(g);
    }
    strands.push(chain);
  }
  rig.add(legL, legR, torso, belt, armL, armR, head, cloak, sigil);

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03;
  root.add(shadow);

  const aura = new THREE.PointLight(0xffe9ad, 0, 9, 2);
  aura.position.set(0, 1.2, 0);
  root.add(aura);
  let auraOn = false;

  // silhueta visível por trás de árvores e paredes
  const sil = new THREE.MeshBasicMaterial({ color: 0xb7a6ff, transparent: true, opacity: 0.3, depthFunc: THREE.GreaterDepth, depthWrite: false });
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !(m.material as THREE.Material).transparent && (m.material as THREE.Material).side !== THREE.BackSide && (m.material as THREE.Material).type !== 'ShaderMaterial') meshes.push(m); });
  for (const m of meshes) { const s = new THREE.Mesh(m.geometry, sil); s.renderOrder = 10; m.add(s); }

  let phase = 0, yaw = 0, breath = 0, night = 0, wind = 0, lastStep = 0;
  const hero: Hero3D = {
    root,
    setAura(on) { auraOn = on; },
    setNight(n) { night = n; },
    setWind(w) { wind = w; },
    update(dt, t, speed01, heading) {
      if (heading !== null) {
        let d = heading - yaw;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        yaw += d * Math.min(1, dt * 12);
      }
      root.rotation.y = yaw;
      const moving = speed01 > 0.01;
      phase += dt * (6 + 5 * speed01) * (moving ? 1 : 0);
      breath += dt * 2;
      const sw = Math.sin(phase) * 0.85 * speed01;
      legL.rotation.x = sw; legR.rotation.x = -sw;
      armL.rotation.x = -sw * 0.9; armR.rotation.x = sw * 0.9;
      rig.position.y = moving ? Math.abs(Math.sin(phase)) * 0.07 : Math.sin(breath) * 0.012;
      rig.rotation.x = 0.12 * speed01;
      cloak.rotation.x = 0.15 + speed01 * 0.5 + Math.sin(t * 3 + phase * 0.5) * 0.06;
      head.rotation.x = -0.05 * speed01 + Math.sin(breath + 0.6) * 0.01;
      aura.intensity += ((auraOn ? 18 + Math.sin(t * 4) * 4 : 0) - aura.intensity) * Math.min(1, dt * 4);
      sigil.scale.y = 1.5 + Math.sin(t * 3) * 0.25;
      // passos sincronizados com a animação das pernas
      const stepIdx = Math.floor(phase / Math.PI);
      if (stepIdx !== lastStep) { lastStep = stepIdx; if (speed01 > 0.25) hero.onStep?.(stepIdx & 1); }
      // lanterna: pêndulo + chama tremulando
      lantBody.rotation.x = -armL.rotation.x * 0.6 + Math.sin(t * 2.2) * 0.05 + speed01 * 0.25;
      lantBody.rotation.z = Math.sin(t * 1.7 + 1) * 0.06 + wind * 0.2;
      const fl = 0.85 + Math.sin(t * 17) * 0.08 + Math.sin(t * 29) * 0.06;
      lantGlow.material.opacity = night * 0.9 * fl; flame.scale.y = fl;
      lant.visible = true;
      // cabelo com atraso, vento e corrida
      strands.forEach((chain, si) => chain.forEach((g, i) => {
        const target = 0.35 + speed01 * 0.9 + wind * 0.5 + Math.sin(t * 3 + i * 0.9 + si) * 0.12 * (0.4 + wind);
        g.rotation.x += (target - g.rotation.x) * Math.min(1, dt * (9 - i * 2));
        g.rotation.z += ((Math.sin(t * 2 + si) * 0.15 * wind) - g.rotation.z) * Math.min(1, dt * 6);
      }));
    },
  };
  return hero;
}

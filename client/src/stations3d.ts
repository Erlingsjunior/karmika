/* Pontos de trabalho das vilas e cidades: cada ofício tem o seu lugar. Ninguém aplaina tábua no meio do mato.
   0 Bancada de Corte (marceneiro) · 1 Forja (ferreiro) · 2 Mesa do Curtidor (costureiro) · 3 Laboratório (alquimista) · 4 Cozinha (cozinheiro)
   Tudo em volta de (0,0), com a frente virada para +z; quem chama posiciona e gira. */
import * as THREE from 'three';
import { std, ink, plankTex, stoneTex, woodTex, shingleTex } from './toon3d';

export const STATION_INFO = [
  { name: 'Bancada de Corte', prof: 'marceneiro', icon: '🪚' },
  { name: 'Forja', prof: 'ferreiro', icon: '⚒' },
  { name: 'Mesa do Curtidor', prof: 'costureiro', icon: '🧵' },
  { name: 'Laboratório', prof: 'alquimista', icon: '⚗' },
  { name: 'Cozinha', prof: 'cozinheiro', icon: '🍲' },
] as const;

type Out = { group: THREE.Group; glow?: { x: number; y: number; z: number; color: number; base: number }; smoke?: { x: number; y: number; z: number } };

export function buildStation(v: number, rnd: () => number): Out {
  const g = new THREE.Group();
  const wood = std(0xffffff, { map: plankTex(0x6a4a2a) }), dark = std(0xffffff, { map: woodTex(0x3a2614) }), iron = std(0x2e3238), stone = std(0xffffff, { map: stoneTex(0x7a766e) });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, inked = true, ry = 0) => { const o = new THREE.Mesh(geo, m); if (inked) ink(o, 0.02); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const C = (r0: number, r1: number, h: number, s = 8) => new THREE.CylinderGeometry(r0, r1, h, s);
  const glowM = (c: number) => new THREE.MeshBasicMaterial({ color: c });
  /** cobertura de madeira em quatro pés: todo ponto de trabalho tem a sua, para ler de longe como "lugar de ofício" */
  const canopy = (w: number, d: number, h: number, roofC: number) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(C(0.07, 0.08, h, 6), dark, sx * (w / 2 - 0.1), h / 2, sz * (d / 2 - 0.1));
    const roof = add(B(w + 0.5, 0.08, d + 0.5), std(0xffffff, { map: shingleTex(roofC) }), 0, h + 0.15, 0); roof.rotation.x = -0.12;
    for (const sz of [-1, 1]) add(B(w + 0.1, 0.1, 0.1), dark, 0, h - 0.02, sz * (d / 2 - 0.1), false);
  };
  /** placa pendurada com o símbolo do ofício */
  const sign = (h: number, color: number, draw: (c: CanvasRenderingContext2D) => void) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d')!; c.fillStyle = '#3a2614'; c.fillRect(0, 0, 64, 64); c.strokeStyle = '#c9a24a'; c.lineWidth = 3; c.strokeRect(3, 3, 58, 58); draw(c);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), std(0xffffff, { map: t, emissive: new THREE.Color(color), emissiveIntensity: 0.08 })); s.position.set(0, h - 0.45, 1.06); g.add(s);
    for (const sx of [-0.2, 0.2]) add(C(0.008, 0.008, 0.3, 3), iron, sx, h - 0.06, 1.06, false);
  };
  const out: Out = { group: g };

  if (v === 0) { // Bancada de Corte: cavalete com tora, serra, tábuas empilhadas, serragem
    canopy(3.2, 2.2, 2.5, 0x6a4a2a);
    add(B(2.2, 0.12, 0.8), wood, 0, 0.82, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(B(0.1, 0.8, 0.1), dark, sx * 0.95, 0.4, sz * 0.3);
    const log = add(C(0.22, 0.24, 1.9, 9), std(0xffffff, { map: woodTex(0x7a5a3a) }), 0, 1.1, 0); log.rotation.z = Math.PI / 2;
    for (const sx of [-1, 1]) add(new THREE.CircleGeometry(0.22, 10), std(0xd8b080), sx * 0.951, 1.1, 0, false, sx * Math.PI / 2);
    const saw = add(B(0.9, 0.16, 0.01), std(0xc8ccd4), 0.2, 1.42, 0.05, false); saw.rotation.z = -0.5; add(B(0.18, 0.12, 0.05), dark, 0.62, 1.66, 0.05, false).rotation.z = -0.5;
    for (let k = 0; k < 5; k++) add(B(1.6, 0.06, 0.3), wood, -0.1 + (rnd() - 0.5) * 0.1, 0.05 + k * 0.065, -0.75, false, (rnd() - 0.5) * 0.08);
    add(new THREE.CircleGeometry(0.6, 12), std(0xd8b880), 0.2, 0.02, 0.35, false).rotation.x = -Math.PI / 2;
    add(C(0.3, 0.32, 0.5, 10), std(0xffffff, { map: woodTex(0x6a4a2a) }), 1.25, 0.25, 0.55); const axe = add(B(0.05, 0.6, 0.05), dark, 1.25, 0.72, 0.55, false); axe.rotation.z = 0.5; add(B(0.2, 0.14, 0.03), iron, 1.12, 0.98, 0.55, false);
    sign(2.5, 0xffd080, (c) => { c.strokeStyle = '#e8dcc0'; c.lineWidth = 4; c.beginPath(); c.moveTo(14, 46); c.lineTo(46, 18); c.stroke(); c.fillStyle = '#c8ccd4'; c.beginPath(); c.moveTo(20, 50); c.lineTo(52, 22); c.lineTo(54, 30); c.lineTo(24, 54); c.fill(); });
  } else if (v === 1) { // Forja: lareira de pedra com brasas, coifa e chaminé, bigorna no toco, tina d'água, ferramentas
    add(B(1.5, 0.9, 1.1), stone, -0.55, 0.45, -0.35);
    const coals = add(B(1.1, 0.06, 0.7), glowM(0xff6a1a), -0.55, 0.93, -0.35, false); void coals;
    for (let k = 0; k < 8; k++) add(new THREE.IcosahedronGeometry(0.07, 0), glowM(k % 2 ? 0xffb040 : 0xff3a0a), -0.55 + (rnd() - 0.5) * 0.9, 0.97, -0.35 + (rnd() - 0.5) * 0.5, false);
    const hood = add(new THREE.ConeGeometry(0.95, 0.9, 4), stone, -0.55, 1.75, -0.4); hood.rotation.y = Math.PI / 4;
    add(B(0.45, 1.6, 0.45), stone, -0.55, 2.9, -0.45);
    add(C(0.22, 0.28, 0.55, 9), std(0xffffff, { map: woodTex(0x5a3a20) }), 0.85, 0.27, 0.3); // toco
    add(B(0.55, 0.16, 0.22), iron, 0.85, 0.62, 0.3); add(B(0.3, 0.1, 0.14), iron, 0.85, 0.5, 0.3); const horn = add(new THREE.ConeGeometry(0.08, 0.3, 6), iron, 1.2, 0.63, 0.3, false); horn.rotation.z = -Math.PI / 2;
    add(C(0.3, 0.27, 0.55, 12), dark, 0.9, 0.27, -0.75); add(new THREE.CircleGeometry(0.27, 12), std(0x2a4a6a), 0.9, 0.5, -0.75, false).rotation.x = -Math.PI / 2;
    const ham = add(B(0.04, 0.4, 0.04), dark, 0.75, 0.82, 0.3, false); ham.rotation.z = 1.2; add(B(0.1, 0.09, 0.09), iron, 0.6, 0.76, 0.3, false);
    for (let k = 0; k < 3; k++) { const t = add(B(0.03, 0.7, 0.03), iron, -1.35, 1.1, -0.2 + k * 0.18, false); t.rotation.z = 0.1; }
    sign(2.4, 0xff8040, (c) => { c.fillStyle = '#9aa0aa'; c.fillRect(14, 30, 36, 10); c.fillRect(24, 40, 16, 12); c.beginPath(); c.moveTo(50, 30); c.lineTo(58, 34); c.lineTo(50, 38); c.fill(); c.fillStyle = '#ff8a3a'; c.fillRect(26, 14, 4, 4); c.fillRect(36, 10, 3, 3); });
    for (const sx of [-1, 1]) add(C(0.07, 0.08, 2.4, 6), dark, sx * 1.4, 1.2, 0.95); add(B(3.0, 0.08, 0.15), dark, 0, 2.35, 0.95, false);
    out.glow = { x: -0.55, y: 1.3, z: -0.1, color: 0xff7a2a, base: 26 }; out.smoke = { x: -0.55, y: 3.8, z: -0.45 };
  } else if (v === 2) { // Mesa do Curtidor: armação com couro esticado, mesa com faca e linha, balde, peles penduradas
    canopy(3.0, 2.0, 2.4, 0x5a4a3a);
    const frame = new THREE.Group(); frame.position.set(-0.75, 0, -0.55); frame.rotation.x = -0.15; g.add(frame);
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(C(0.04, 0.05, 1.7, 6), dark); p.position.set(sx * 0.55, 0.85, 0); frame.add(p); }
    for (const y of [0.35, 1.55]) { const p = new THREE.Mesh(C(0.035, 0.035, 1.2, 6), dark); p.rotation.z = Math.PI / 2; p.position.set(0, y, 0); frame.add(p); }
    const hide = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.05, 4, 4), std(0xb08a5a, { side: THREE.DoubleSide })); hide.position.set(0, 0.95, 0.02); const pa = hide.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < pa.count; i++) pa.setX(i, pa.getX(i) * (0.85 + Math.abs(pa.getY(i)) * 0.3)); frame.add(hide);
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; const l = new THREE.Mesh(C(0.006, 0.006, 0.2, 3), std(0xd8c8a0)); l.position.set(Math.cos(a) * 0.52, 0.95 + Math.sin(a) * 0.58, 0.02); l.rotation.z = a; frame.add(l); }
    add(B(1.3, 0.1, 0.7), wood, 0.7, 0.8, 0.2); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(B(0.08, 0.78, 0.08), dark, 0.7 + sx * 0.55, 0.39, 0.2 + sz * 0.27);
    add(B(0.5, 0.03, 0.35), std(0x8a6a3a), 0.6, 0.87, 0.2, false); add(B(0.25, 0.015, 0.04), std(0xc8ccd4), 0.95, 0.87, 0.3, false); add(C(0.05, 0.05, 0.08, 8), std(0xd8c8a0), 0.9, 0.9, 0.05, false);
    add(C(0.2, 0.17, 0.35, 10), dark, 1.15, 0.17, -0.6);
    for (let k = 0; k < 3; k++) { const pel = add(new THREE.PlaneGeometry(0.45, 0.6), std([0x8a6a4a, 0x6a5a4a, 0xb8a080][k], { side: THREE.DoubleSide }), -1.0 + k * 0.5, 1.75, 0.95, false); pel.rotation.y = 0.2; }
    sign(2.4, 0xc8a070, (c) => { c.fillStyle = '#b08a5a'; c.beginPath(); c.ellipse(32, 34, 16, 20, 0, 0, 6.283); c.fill(); c.strokeStyle = '#e8dcc0'; c.lineWidth = 2; c.beginPath(); c.moveTo(20, 18); c.lineTo(44, 50); c.stroke(); });
  } else if (v === 3) { // Laboratório: bancada com alambique, frascos coloridos que brilham, estante, caldeirão borbulhando
    canopy(3.2, 2.2, 2.6, 0x3a4a5a);
    add(B(2.0, 0.1, 0.75), wood, 0, 0.85, -0.45); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(B(0.08, 0.84, 0.08), dark, sx * 0.9, 0.42, -0.45 + sz * 0.3);
    const glass = new THREE.MeshToonMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.45 });
    add(new THREE.SphereGeometry(0.2, 10, 8), glass, -0.5, 1.15, -0.45, false); add(new THREE.SphereGeometry(0.16, 10, 8), glowM(0x6aff9a), -0.5, 1.1, -0.45, false).scale.y = 0.6;
    const tube = add(C(0.025, 0.025, 0.75, 6), glass, -0.15, 1.38, -0.45, false); tube.rotation.z = -1.1; add(C(0.08, 0.1, 0.25, 8), glass, 0.2, 1.05, -0.45, false);
    add(C(0.07, 0.07, 0.08, 8), glowM(0x9a4aff), 0.2, 0.98, -0.45, false);
    add(C(0.08, 0.06, 0.1, 8), glowM(0xff4a6a), 0.5, 0.95, -0.35, false); add(C(0.06, 0.06, 0.15, 8), glowM(0x4ac0ff), 0.68, 0.98, -0.55, false); add(C(0.05, 0.05, 0.1, 8), glowM(0xffd24a), 0.8, 0.95, -0.3, false);
    add(B(1.3, 1.6, 0.3), dark, 0.4, 0.8, -0.95); for (const y of [0.55, 1.05, 1.5]) { add(B(1.26, 0.04, 0.3), wood, 0.4, y, -0.92, false); for (let k = 0; k < 5; k++) add(C(0.045, 0.045, 0.16 + rnd() * 0.1, 6), glowM([0x6aff9a, 0xff4a6a, 0x4ac0ff, 0xffd24a, 0xc070ff][(k + Math.round(y * 3)) % 5]), -0.1 + k * 0.24, y + 0.1, -0.88, false); }
    add(C(0.38, 0.3, 0.45, 12), iron, 0.95, 0.28, 0.45); add(new THREE.CircleGeometry(0.34, 12), glowM(0x5aff8a), 0.95, 0.5, 0.45, false).rotation.x = -Math.PI / 2;
    for (let k = 0; k < 3; k++) add(B(0.08, 0.08, 0.08), dark, 0.95 + Math.cos(k * 2.1) * 0.28, 0.04, 0.45 + Math.sin(k * 2.1) * 0.28, false);
    sign(2.6, 0x7aff9a, (c) => { c.fillStyle = '#5aff8a'; c.beginPath(); c.moveTo(26, 14); c.lineTo(38, 14); c.lineTo(38, 26); c.lineTo(50, 50); c.lineTo(14, 50); c.lineTo(26, 26); c.fill(); c.fillStyle = '#e8ffe8'; c.fillRect(24, 10, 16, 5); });
    out.glow = { x: 0.6, y: 1.2, z: 0.2, color: 0x6aff9a, base: 18 }; out.smoke = { x: 0.95, y: 0.6, z: 0.45 };
  } else { // Cozinha: forno de barro abobadado com fogo, caldeirão no tripé, mesa com legumes, linguiças penduradas
    canopy(3.4, 2.2, 2.5, 0x7a3a2a);
    const oven = add(new THREE.SphereGeometry(0.75, 12, 8, 0, 6.283, 0, Math.PI / 2), std(0xffffff, { map: stoneTex(0xa86a4a) }), -0.85, 0.4, -0.4); void oven;
    add(B(1.6, 0.4, 1.6), stone, -0.85, 0.2, -0.4); add(B(0.5, 0.42, 0.1), glowM(0x1a0a04), -0.85, 0.6, 0.33, false); add(B(0.36, 0.2, 0.05), glowM(0xff8a2a), -0.85, 0.5, 0.36, false);
    add(C(0.1, 0.12, 0.5, 8), stone, -1.1, 1.3, -0.6);
    for (let k = 0; k < 3; k++) { const a = k / 3 * 6.283; const leg = add(C(0.025, 0.025, 1.3, 5), iron, 0.7 + Math.cos(a) * 0.3, 0.62, 0.3 + Math.sin(a) * 0.3, false); leg.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); }
    add(new THREE.SphereGeometry(0.28, 10, 8, 0, 6.283, Math.PI / 2.4, Math.PI / 1.7), iron, 0.7, 0.85, 0.3, false); add(new THREE.CircleGeometry(0.24, 12), std(0x8a5a2a), 0.7, 0.92, 0.3, false).rotation.x = -Math.PI / 2;
    for (let k = 0; k < 6; k++) add(new THREE.IcosahedronGeometry(0.06, 0), glowM(k % 2 ? 0xffb040 : 0xff5a1a), 0.7 + (rnd() - 0.5) * 0.3, 0.12, 0.3 + (rnd() - 0.5) * 0.3, false);
    add(B(1.1, 0.08, 0.6), wood, 0.85, 0.78, -0.6); for (const sx of [-1, 1]) add(B(0.08, 0.76, 0.5), dark, 0.85 + sx * 0.45, 0.38, -0.6);
    for (let k = 0; k < 6; k++) add(new THREE.SphereGeometry(0.06 + rnd() * 0.03, 6, 5), std([0xc8402a, 0xe8a030, 0x7aa83a, 0xd8c890][k % 4]), 0.55 + k * 0.11, 0.86, -0.6 + (rnd() - 0.5) * 0.2, false);
    add(B(1.4, 0.04, 0.04), dark, 0, 2.2, 0.95, false); for (let k = 0; k < 5; k++) { const s2 = add(C(0.035, 0.035, 0.28, 6), std(0x8a3a2a), -0.5 + k * 0.25, 2.04, 0.95, false); s2.rotation.z = (rnd() - 0.5) * 0.3; }
    sign(2.5, 0xffa040, (c) => { c.fillStyle = '#2e3238'; c.beginPath(); c.arc(32, 36, 14, 0, Math.PI); c.fill(); c.fillRect(16, 32, 32, 4); c.strokeStyle = '#e8dcc0'; c.lineWidth = 2; for (const x of [26, 32, 38]) { c.beginPath(); c.moveTo(x, 28); c.quadraticCurveTo(x + 4, 22, x, 14); c.stroke(); } });
    out.glow = { x: -0.85, y: 0.7, z: 0.6, color: 0xff8a3a, base: 20 }; out.smoke = { x: 0.7, y: 1.0, z: 0.3 };
  }
  return out;
}

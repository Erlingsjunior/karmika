/* Pontos de trabalho das vilas e cidades: cada ofício tem o seu lugar. Ninguém aplaina tábua no meio do mato.
   0 Bancada de Corte (marceneiro) · 1 Forja (ferreiro) · 2 Mesa do Curtidor (costureiro) · 3 Laboratório (alquimista) · 4 Cozinha (cozinheiro)
   Tudo em volta de (0,0), com a frente virada para +z; quem chama posiciona e gira. */
import * as THREE from 'three';
import { std, ink, plankTex, stoneTex, woodTex, shingleTex, plasterTex, ramp } from './toon3d';

export const STATION_INFO = [
  { name: 'Bancada de Corte', prof: 'marceneiro', icon: '🪚' },
  { name: 'Forja', prof: 'ferreiro', icon: '⚒' },
  { name: 'Mesa do Curtidor', prof: 'costureiro', icon: '🧵' },
  { name: 'Laboratório', prof: 'alquimista', icon: '⚗' },
  { name: 'Cozinha', prof: 'cozinheiro', icon: '🍲' },
  { name: 'Casa de Tecnologia', prof: 'ferreiro', icon: '⚙' },
] as const;


/** telhado e parede de fundo das casas de ofício: somem quando o herói entra, para ver a bancada (main.ts) */
export const CUTAWAYS: THREE.Object3D[] = [];
type Out = { group: THREE.Group; glow?: { x: number; y: number; z: number; color: number; base: number }; smoke?: { x: number; y: number; z: number } };

export function buildStation(v: number, rnd: () => number, bare = false): Out {
  const g = new THREE.Group();
  const wood = std(0xffffff, { map: plankTex(0x6a4a2a) }), dark = std(0xffffff, { map: woodTex(0x3a2614) }), iron = std(0x2e3238), stone = std(0xffffff, { map: stoneTex(0x7a766e) });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, inked = true, ry = 0) => { const o = new THREE.Mesh(geo, m); if (inked) ink(o, 0.02); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const C = (r0: number, r1: number, h: number, s = 8) => new THREE.CylinderGeometry(r0, r1, h, s);
  const glowM = (c: number) => new THREE.MeshBasicMaterial({ color: c });
  /** cobertura de madeira em quatro pés: todo ponto de trabalho tem a sua, para ler de longe como "lugar de ofício" */
  const canopy = (w: number, d: number, h: number, roofC: number) => { if (bare) return;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(C(0.07, 0.08, h, 6), dark, sx * (w / 2 - 0.1), h / 2, sz * (d / 2 - 0.1));
    const roof = add(B(w + 0.5, 0.08, d + 0.5), std(0xffffff, { map: shingleTex(roofC) }), 0, h + 0.15, 0); roof.rotation.x = -0.12;
    for (const sz of [-1, 1]) add(B(w + 0.1, 0.1, 0.1), dark, 0, h - 0.02, sz * (d / 2 - 0.1), false);
  };
  /** placa pendurada com o símbolo do ofício */
  const sign = (h: number, color: number, draw: (c: CanvasRenderingContext2D) => void) => { if (bare) return;
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
    if (!bare) { for (const sx of [-1, 1]) add(C(0.07, 0.08, 2.4, 6), dark, sx * 1.4, 1.2, 0.95); add(B(3.0, 0.08, 0.15), dark, 0, 2.35, 0.95, false); }
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
  } else if (v === 5) { // Casa de Tecnologia: bancada de latão com engrenagens, bobina de Tesla, prancheta de projetos, canos e vapor
    canopy(3.4, 2.2, 2.6, 0x3a4a5a);
    const brass = std(0xc8a050), copper = std(0xb0703a);
    add(B(2.0, 0.1, 0.8), brass, -0.3, 0.85, -0.3); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(B(0.08, 0.85, 0.08), iron, -0.3 + sx * 0.9, 0.42, -0.3 + sz * 0.32);
    for (let k = 0; k < 4; k++) { const gr = add(new THREE.TorusGeometry(0.09 + k * 0.03, 0.025, 4, 10), brass, -0.9 + k * 0.32, 0.95, -0.3, false); gr.rotation.x = Math.PI / 2; }
    add(C(0.12, 0.16, 1.1, 10), copper, 1.0, 0.55, -0.5); for (let k = 0; k < 9; k++) add(new THREE.TorusGeometry(0.15, 0.012, 4, 12), copper, 1.0, 0.2 + k * 0.1, -0.5, false).rotation.x = Math.PI / 2;
    add(new THREE.SphereGeometry(0.17, 12, 10), glowM(0x8af0ff), 1.0, 1.25, -0.5, false);
    const board = add(B(0.9, 0.6, 0.04), std(0xe8dcc0), -0.2, 1.4, -0.68, false); board.rotation.x = -0.3;
    for (let k = 0; k < 3; k++) add(C(0.04, 0.04, 2.2, 6), copper, -1.3, 1.1, -0.7 + k * 0.12, false);
    add(C(0.25, 0.28, 0.6, 10), iron, -1.2, 0.3, 0.5); add(new THREE.CircleGeometry(0.22, 10), glowM(0x5ad0ff), -1.2, 0.61, 0.5, false).rotation.x = -Math.PI / 2;
    sign(2.6, 0x6ae0ff, (c) => { c.strokeStyle = '#c8a050'; c.lineWidth = 5; c.beginPath(); c.arc(32, 32, 14, 0, 6.283); c.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; c.fillStyle = '#c8a050'; c.fillRect(32 + Math.cos(a) * 18 - 3, 32 + Math.sin(a) * 18 - 3, 6, 6); } c.fillStyle = '#8af0ff'; c.beginPath(); c.arc(32, 32, 5, 0, 6.283); c.fill(); });
    out.glow = { x: 1.0, y: 1.3, z: -0.5, color: 0x6ae0ff, base: 22 }; out.smoke = { x: -1.2, y: 0.7, z: 0.5 };
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


/* ============ CASAS DE OFÍCIO DA CIDADE (25/10) ============
   Erling: "marcenaria tem que ser uma parede aberta mostrando as serras e o galpão; a forja, algo artístico".
   Cada ofício tem a sua arquitetura. Frente para +z (a praça). Pegada de 6×6 m (3×3 tiles), tudo dentro de |x|,|z| ≤ 2.9.
   O que está em `cut` (telhado, parede de fundo alta) some quando o herói entra (main.ts), para a bancada aparecer. */
/** paredes sólidas de cada casa, em metros locais [x0, z0, x1, z1] (main.ts transforma em corpos) */
export const HALL_WALLS: Record<number, [number, number, number, number][]> = {
  0: [[-2.7, -2.6, 2.7, -2.6]], // galpão: só o fundo; os lados são abertos (os pilares são finos)
  1: [[-2.7, -2.6, 2.7, -2.6], [-2.7, -2.6, -2.7, 0.6]], // forja: fundo de pedra e um lado
  2: [[-2.7, -2.6, 2.7, -2.6], [2.7, -2.6, 2.7, 2.2]],
  3: [[-2.7, -2.6, 2.7, -2.6], [-2.7, -2.6, -2.7, 0.2], [2.7, -2.6, 2.7, 0.2], [-2.7, 0.2, -1.0, 0.2], [1.0, 0.2, 2.7, 0.2]], // apotecário: a sala e a antessala
  4: [[-2.7, -2.6, 2.7, -2.6], [-2.7, -2.6, -2.7, 2.2], [2.7, -2.6, 2.7, 0.0]],
  5: [[-2.7, -2.6, 2.7, -2.6], [-2.7, -2.6, -2.7, 2.2], [2.7, -2.6, 2.7, 2.2]],
};
export function buildWorkshop(v: number, rnd: () => number, label: string): Out {
  const g = new THREE.Group(), cut = new THREE.Group(); g.add(cut); CUTAWAYS.push(cut);
  const out: Out = { group: g };
  const T = (c: number) => std(0xffffff, { map: woodTex(c) });
  const beam = T(0x4a2e18), beamL = T(0x6a4626), plank = std(0xffffff, { map: plankTex(0x7a5634) }), stone = std(0xffffff, { map: stoneTex(0x8a857c) }), stoneD = std(0xffffff, { map: stoneTex(0x5a5650) });
  const plaster = std(0xffffff, { map: plasterTex(0xe8dcc0) }), iron = std(0x2e3238), steel = std(0xc8ccd4), brass = std(0xc8a050), copper = std(0xb0703a);
  const glow = (c: number) => new THREE.MeshBasicMaterial({ color: c });
  let into: THREE.Object3D = g;
  const M = (geo: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, inked = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); if (inked) ink(o, 0.02); o.castShadow = o.receiveShadow = true; into.add(o); return o; };
  const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d), C = (r0: number, r1: number, h: number, s = 8) => new THREE.CylinderGeometry(r0, r1, h, s);
  const post = (x: number, z: number, h: number, r = 0.13, m: THREE.Material = beam) => M(C(r * 0.9, r, h, 7), m, x, h / 2, z);
  /** telhado de duas águas ao longo de z (a cumeeira aponta para a praça: o frontão fica de frente) */
  const roof = (W: number, D: number, H: number, pitch: number, col: number, z0 = 0, frontTruss = true) => { into = cut;
    const hw = W / 2 + 0.45, L = hw / Math.cos(pitch), rm = std(0xffffff, { map: shingleTex(col) });
    for (const sx of [-1, 1]) M(B(L, 0.16, D + 0.8), rm, sx * hw / 2, H + Math.tan(pitch) * hw / 2 + 0.08, z0, 0, 0, -sx * pitch);
    const top = H + Math.tan(pitch) * hw; M(B(0.2, 0.2, D + 0.9), beam, 0, top + 0.06, z0);
    for (const fz of frontTruss ? [z0 + D / 2, z0 - D / 2] : [z0 - D / 2]) { // tesoura: linha, pendural e as duas pernas — o desenho do galpão visto de frente
      M(B(W + 0.3, 0.2, 0.22), beam, 0, H, fz); M(B(0.18, top - H, 0.18), beam, 0, (H + top) / 2, fz);
      for (const sx of [-1, 1]) { const len = Math.hypot(W / 2, top - H); M(B(len, 0.18, 0.2), beam, sx * W / 4, (H + top) / 2, fz, 0, 0, -sx * Math.atan2(top - H, W / 2)); M(B(0.12, Math.hypot(W / 4, (top - H) / 2) * 0.9, 0.14), beamL, sx * W / 6, H + (top - H) * 0.33, fz, 0, 0, sx * 0.75); } }
    into = g; return top; };
  /** tábua com o nome, no frontão */
  const board = (y: number, z: number, w = 3.2, col = '#3a2614', ink2 = '#f2cf8a', glowC = 0x3a2a1a) => {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 112; const c = cv.getContext('2d')!; c.fillStyle = col; c.fillRect(0, 0, 512, 112); c.strokeStyle = '#c9a24a'; c.lineWidth = 6; c.strokeRect(6, 6, 500, 100);
    let fs = 54; c.font = `bold ${fs}px Georgia, serif`; while (c.measureText(label).width > 470 && fs > 26) { fs -= 2; c.font = `bold ${fs}px Georgia, serif`; } c.fillStyle = ink2; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, 256, 60);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const face = std(0xffffff, { map: tex, emissive: new THREE.Color(glowC), emissiveMap: tex });
    const b = new THREE.Mesh(B(w, w * 0.22, 0.08), [beam, beam, beam, beam, face, beam]); b.position.set(0, y, z); b.rotation.x = -0.18; g.add(b);
    for (const sx of [-1, 1]) M(C(0.012, 0.012, 0.5, 3), iron, sx * w * 0.4, y + w * 0.11 + 0.22, z, 0, 0, 0, false); };
  const floor = (m: THREE.Material, W = 5.8, D = 5.4) => M(B(W, 0.16, D), m, 0, 0.08, -0.1);
  const lantern = (x: number, y: number, z: number, c = 0xffc070) => { M(B(0.16, 0.22, 0.16), iron, x, y, z, 0, 0, 0, false); M(B(0.1, 0.14, 0.1), glow(c), x, y, z, 0, 0, 0, false); M(C(0.01, 0.01, 0.3, 3), iron, x, y + 0.26, z, 0, 0, 0, false); };

  if (v === 0) { /* MARCENARIA: galpão aberto de toras, tesouras à mostra, serras na parede, serra de quadro sobre a tora, torno de pedal, pilha de tábuas e toras */
    floor(plank); M(new THREE.CircleGeometry(1.6, 14), std(0xe0c08a), 0.3, 0.17, 0.4, -Math.PI / 2, 0, 0, false); // serragem
    for (const x of [-2.6, 0, 2.6]) for (const z of [-2.4, 2.2]) post(x, z, 3.2, 0.16, beamL);
    for (const z of [-2.4, 2.2]) for (const sx of [-1, 1]) M(B(0.12, 0.9, 0.12), beam, sx * 2.25, 2.85, z, 0, 0, sx * 0.75); // mãos-francesas
    for (const x of [-2.6, 2.6]) M(B(0.2, 0.2, 4.9), beam, x, 3.2, -0.1);
    roof(5.4, 4.6, 3.25, 0.55, 0x6a4a2a, -0.1);
    /* fundo: meia parede de tábuas (dá para ver tudo de qualquer lado) e o painel das serras */
    M(B(5.4, 1.3, 0.14), plank, 0, 0.8, -2.5); M(B(5.4, 0.12, 0.2), beam, 0, 1.5, -2.5);
    into = cut; M(B(5.4, 1.6, 0.1), plank, 0, 2.35, -2.52); into = g;
    const saws: [number, number, number][] = [[-1.9, 2.25, 0.9], [-0.8, 2.3, 1.2], [0.6, 2.2, 0.7], [1.7, 2.3, 1.0]];
    for (const [x, y, w] of saws) { into = cut; const bl = M(B(w, 0.2, 0.012), steel, x, y, -2.44, 0, 0, 0, false); bl.rotation.z = (rnd() - 0.5) * 0.1; M(B(0.16, 0.2, 0.06), beamL, x + w / 2 + 0.08, y, -2.44, 0, 0, 0, false); into = g; }
    { into = cut; const fr = new THREE.Group(); fr.position.set(1.4, 1.95, -2.42); cut.add(fr); into = fr; // serra de arco pendurada
      M(new THREE.TorusGeometry(0.42, 0.025, 4, 16, Math.PI), beamL, 0, 0, 0); M(B(0.86, 0.03, 0.01), steel, 0, 0, 0, 0, 0, 0, false); into = g; }
    M(B(2.0, 0.08, 0.12), beam, -0.4, 1.0, -2.38); for (let k = 0; k < 6; k++) { const t = M(B(0.04, 0.42, 0.04), beamL, -1.2 + k * 0.32, 1.22, -2.36, 0, 0, 0, false); void t; M(B(0.12, 0.06, 0.05), iron, -1.2 + k * 0.32, 1.44, -2.36, 0, 0, 0, false); } // formões e plainas
    /* a bancada de verdade (a mesma da vila), no meio */
    const st = buildStation(0, rnd, true); st.group.position.set(-0.3, 0.16, -0.2); g.add(st.group);
    /* serra de quadro: duas toras em cavaletes altos e a moldura com a lâmina em pé */
    const sx0 = 1.75; for (const z of [-1.2, 0.6]) { for (const sx of [-1, 1]) M(B(0.08, 1.0, 0.08), beam, sx0 + sx * 0.32, 0.6, z, 0, 0, sx * 0.25); }
    M(C(0.24, 0.26, 2.3, 10), T(0x8a6a44), sx0, 1.18, -0.3, Math.PI / 2); M(new THREE.CircleGeometry(0.24, 10), std(0xe8c890), sx0, 1.18, 0.86, 0, 0, 0, false);
    { const fr = new THREE.Group(); fr.position.set(sx0, 1.2, 0.2); g.add(fr); into = fr; M(B(0.08, 1.7, 0.08), beamL, -0.35, 0, 0); M(B(0.08, 1.7, 0.08), beamL, 0.35, 0, 0); M(B(0.8, 0.08, 0.08), beamL, 0, 0.85, 0); M(B(0.8, 0.08, 0.08), beamL, 0, -0.85, 0); M(B(0.02, 1.7, 0.12), steel, 0, 0, 0, 0, 0, 0, false); into = g; }
    /* torno de pedal: duas cabeceiras, a peça girando, a vara de mola por cima */
    M(B(1.2, 0.1, 0.28), beam, -1.8, 0.85, 1.3); for (const x of [-2.3, -1.3]) M(B(0.1, 0.85, 0.28), beam, x, 0.42, 1.3); for (const x of [-2.2, -1.4]) M(B(0.12, 0.25, 0.12), beamL, x, 1.02, 1.3);
    M(C(0.05, 0.07, 0.7, 8), T(0xc89a60), -1.8, 1.05, 1.3, 0, 0, Math.PI / 2); M(B(0.4, 0.04, 0.12), beamL, -1.8, 0.1, 1.55); const pole = M(C(0.02, 0.035, 2.4, 5), beamL, -1.8, 2.5, 0.4, 1.1); void pole;
    /* pilhas: tábuas no fundo à esquerda, toras do lado de fora à direita */
    for (let k = 0; k < 7; k++) M(B(1.7, 0.06, 0.32), plank, -1.6 + (rnd() - 0.5) * 0.08, 0.2 + k * 0.065, -1.9, 0, (rnd() - 0.5) * 0.06, 0, false);
    for (let r2 = 0; r2 < 3; r2++) for (let k = 0; k < 3 - r2; k++) M(C(0.2, 0.22, 1.6, 9), T(0x7a5a3a), 2.45, 0.38 + r2 * 0.34, -1.6 + k * 0.44 + r2 * 0.22, Math.PI / 2, 0, 0);
    lantern(0, 2.7, 0.4);
    board(4.25, 2.35, 3.0);
    out.glow = { x: 0, y: 2.6, z: 0.4, color: 0xffc070, base: 14 };
  } else if (v === 1) { /* FORJA: chaminé de pedra com a boca em arco ardendo, foles de couro, duas bigornas, tina, rebolo, armas na estante, ferraduras, telhado aberto com lanternim */
    floor(stoneD);
    /* fundo de pedra, alto, com a lareira embutida e a chaminé subindo acima do telhado */
    M(B(5.6, 1.2, 0.5), stone, 0, 0.6, -2.4);
    into = cut; M(B(5.6, 2.2, 0.4), stone, 0, 2.3, -2.45); into = g;
    M(B(1.9, 1.2, 1.3), stone, 0, 0.6, -1.65); // a lareira
    M(B(1.4, 0.07, 0.9), glow(0xff6a1a), 0, 1.24, -1.6, 0, 0, 0, false);
    for (let k = 0; k < 12; k++) M(new THREE.IcosahedronGeometry(0.06 + rnd() * 0.04, 0), glow(k % 3 ? 0xffb040 : 0xff3a0a), (rnd() - 0.5) * 1.2, 1.29, -1.6 + (rnd() - 0.5) * 0.7, 0, 0, 0, false);
    { const arch = new THREE.TorusGeometry(0.75, 0.16, 6, 14, Math.PI); M(arch, stone, 0, 1.25, -1.0); M(B(0.32, 1.25, 0.34), stone, -0.75, 0.62, -1.0); M(B(0.32, 1.25, 0.34), stone, 0.75, 0.62, -1.0);
      M(new THREE.CircleGeometry(0.6, 12, 0, Math.PI), glow(0xff8a2a), 0, 1.25, -1.17, 0, 0, 0, false); M(B(1.2, 0.04, 0.1), glow(0xffd070), 0, 1.27, -0.92, 0, 0, 0, false); }
    const hood = M(new THREE.CylinderGeometry(0.45, 1.05, 1.2, 4), stone, 0, 2.25, -1.65, 0, Math.PI / 4, 0); void hood;
    M(B(0.8, 3.6, 0.8), stone, 0, 4.4, -1.9); M(B(1.0, 0.25, 1.0), stoneD, 0, 6.25, -1.9); // a chaminé passa o telhado (fica mesmo com o corte)
    /* foles de couro ao lado da lareira */
    { const fb = new THREE.Group(); fb.position.set(-1.45, 0.9, -1.55); fb.rotation.z = 0.25; g.add(fb); into = fb; const bag = new THREE.SphereGeometry(0.45, 10, 6); bag.scale(1, 0.32, 0.6); M(bag, std(0x6a4028), 0, 0, 0); M(B(0.95, 0.05, 0.6), beamL, 0, 0.13, 0); M(B(0.95, 0.05, 0.6), beamL, 0, -0.13, 0); M(C(0.04, 0.06, 0.4, 6), iron, 0.6, 0, 0, 0, 0, Math.PI / 2); M(B(0.05, 0.05, 0.7), beam, -0.6, 0.18, 0); into = g; }
    M(B(0.08, 1.6, 0.08), beam, -1.8, 0.8, -1.55); // poste da alavanca
    /* bigornas nos tocos, martelos */
    for (const [x, z, s2] of [[0.9, 0.3, 1], [-0.4, 1.0, 0.8]] as const) { M(C(0.26 * s2, 0.32 * s2, 0.6, 9), T(0x5a3a20), x, 0.46, z); M(B(0.6 * s2, 0.18, 0.24 * s2), iron, x, 0.86, z); M(B(0.34 * s2, 0.12, 0.16 * s2), iron, x, 0.72, z); M(new THREE.ConeGeometry(0.09 * s2, 0.34 * s2, 6), iron, x + 0.45 * s2, 0.88, z, 0, 0, -Math.PI / 2);
      M(B(0.04, 0.42, 0.04), beamL, x - 0.15, 0.98, z + 0.05, 0, 0, 1.25, false); M(B(0.11, 0.1, 0.1), iron, x - 0.32, 0.93, z + 0.05, 0, 0, 0, false); }
    { const bar = M(B(0.5, 0.05, 0.05), glow(0xffa040), 0.95, 0.98, 0.3, 0, 0.4, 0, false); void bar; } // ferro em brasa na bigorna
    /* tina de têmpera e o rebolo */
    M(B(1.1, 0.5, 0.55), beam, 1.9, 0.41, -1.5); M(B(1.0, 0.04, 0.45), std(0x2a4a6a), 1.9, 0.64, -1.5, 0, 0, 0, false);
    M(new THREE.CylinderGeometry(0.38, 0.38, 0.14, 14), std(0xa8a49a), 2.0, 0.85, 0.9, 0, 0, Math.PI / 2); for (const sx of [-1, 1]) M(B(0.08, 0.8, 0.08), beam, 2.0 + sx * 0.14, 0.48, 0.9); M(B(0.5, 0.06, 0.3), beam, 2.0, 0.12, 1.15);
    /* estante de armas na parede lateral (a de pedra), ferraduras e tenazes penduradas */
    M(B(0.12, 0.12, 2.4), beam, -2.5, 1.9, -0.6); M(B(0.12, 0.12, 2.4), beam, -2.5, 0.5, -0.6);
    for (let k = 0; k < 5; k++) { const z = -1.6 + k * 0.48; if (k % 2) { M(B(0.03, 1.2, 0.08), steel, -2.42, 1.3, z, 0, 0, 0, false); M(B(0.05, 0.05, 0.3), brass, -2.42, 0.72, z, 0, 0, 0, false); } else { M(B(0.04, 1.3, 0.04), beamL, -2.42, 1.25, z, 0, 0, 0, false); M(B(0.05, 0.28, 0.24), steel, -2.42, 1.75, z + 0.08, 0, 0, 0, false); } }
    into = cut; for (let k = 0; k < 4; k++) M(new THREE.TorusGeometry(0.11, 0.025, 4, 10, Math.PI * 1.5), iron, 1.2 + k * 0.32, 2.4, -2.22, 0, 0, Math.PI * 0.75, false); into = g;
    /* telhado sobre pilares, só de um lado fechado; lanternim para a fumaça */
    for (const [x, z] of [[2.6, -2.2], [2.6, 2.2], [-2.6, 2.2], [0, 2.2]] as const) post(x, z, 3.3, 0.15);
    M(B(0.4, 2.0, 2.8), stone, -2.6, 1.0, -0.9); into = cut; M(B(0.4, 1.4, 2.8), stone, -2.6, 2.7, -0.9); into = g;
    roof(5.4, 4.6, 3.35, 0.5, 0x3a3a40, -0.1);
    lantern(1.4, 2.7, 1.6, 0xffa060);
    board(4.2, 2.35, 2.6, '#1e1a1a', '#ffb86a', 0x4a1a08);
    out.glow = { x: 0, y: 1.4, z: -0.6, color: 0xff7a2a, base: 34 }; out.smoke = { x: 0, y: 6.4, z: -1.9 };
  } else if (v === 2) { /* CURTUME E ALFAIATARIA: enxaimel com varanda, couros esticados nos quadros, tinas de tingir coloridas, manequim com túnica, rolos de tecido */
    floor(plank);
    into = cut; M(B(5.6, 3.2, 0.2), plaster, 0, 1.76, -2.5); for (const x of [-2.7, -0.9, 0.9, 2.7]) M(B(0.18, 3.2, 0.24), beam, x, 1.76, -2.5); M(B(5.6, 0.18, 0.24), beam, 0, 1.4, -2.5); into = g;
    M(B(0.2, 1.1, 4.8), plaster, 2.7, 0.71, -0.1); into = cut; M(B(0.2, 2.1, 4.8), plaster, 2.7, 2.31, -0.1); into = g; for (const z of [-2.4, -0.1, 2.2]) M(B(0.24, 3.2, 0.18), beam, 2.7, 1.76, z); M(B(0.24, 0.18, 4.8), beam, 2.7, 1.4, -0.1);
    M(new THREE.PlaneGeometry(0.8, 0.7), glow(0xffc070), 2.59, 2.2, 0.8, 0, -Math.PI / 2, 0, false);
    for (const [x, z] of [[-2.6, 2.2], [-2.6, -2.4], [0, 2.2]] as const) post(x, z, 3.2, 0.13);
    roof(5.4, 4.6, 3.3, 0.6, 0x5a6a3a, -0.1);
    const st = buildStation(2, rnd, true); st.group.position.set(0.3, 0.16, -0.9); g.add(st.group);
    /* tinas de tingimento: índigo, garança, gualda */
    for (const [x, z, c] of [[-1.9, 1.3, 0x2a3a8a], [-1.1, 1.6, 0x9a2a2a], [-1.9, 0.4, 0xd8b030]] as const) { M(C(0.34, 0.3, 0.55, 12), beam, x, 0.43, z); M(new THREE.CircleGeometry(0.3, 12), std(c), x, 0.69, z, -Math.PI / 2, 0, 0, false); }
    M(B(0.04, 0.9, 0.04), beamL, -1.5, 0.95, 1.0, 0.3, 0, 0.4, false);
    /* manequim de costura com túnica */
    { const mq = new THREE.Group(); mq.position.set(1.6, 0.16, 1.2); g.add(mq); into = mq; M(C(0.03, 0.03, 0.9, 5), beam, 0, 0.45, 0); M(C(0.2, 0.05, 0.05, 6), beam, 0, 0.03, 0); const tor = new THREE.SphereGeometry(0.26, 10, 8); tor.scale(1, 1.4, 0.7); M(tor, std(0x6a2a4a), 0, 1.2, 0); M(C(0.24, 0.32, 0.4, 10), std(0x6a2a4a), 0, 0.82, 0); M(B(0.5, 0.05, 0.03), std(0xd8b040), 0, 1.0, 0.18, 0, 0, 0, false); into = g; }
    /* prateleira com rolos de tecido na parede lateral */
    for (const y of [0.7, 1.4, 2.1]) { M(B(0.4, 0.05, 2.0), beamL, 2.4, y, -0.9); for (let k = 0; k < 4; k++) M(C(0.12, 0.12, 0.38, 10), std([0x8a2a3a, 0x2a5a8a, 0xd8c890, 0x3a6a3a, 0x6a4a8a][(k + y * 3 | 0) % 5]), 2.4, y + 0.15, -1.6 + k * 0.45, 0, 0, Math.PI / 2); }
    /* couros secando no varal da frente */
    M(B(5.0, 0.05, 0.05), beam, 0, 2.6, 2.1); for (let k = 0; k < 4; k++) M(new THREE.PlaneGeometry(0.55, 0.75), std([0x8a6a4a, 0xb08a5a, 0x6a5a4a, 0x9a7a50][k], { side: THREE.DoubleSide }), -1.8 + k * 1.2, 2.2, 2.1, 0, (rnd() - 0.5) * 0.3, 0, false);
    lantern(-0.8, 2.7, 0.6);
    board(4.3, 2.35, 3.2);
    out.glow = { x: 0, y: 2.4, z: 0.4, color: 0xffc070, base: 12 };
  } else if (v === 3) { /* APOTECÁRIO: casinha de pedra com ANTESSALA (balcão sob o toldo, prateleiras de frascos que brilham) e a sala do alambique atrás */
    floor(stone);
    into = cut; M(B(5.6, 3.4, 0.25), stone, 0, 1.86, -2.5); into = g;
    for (const sx of [-1, 1]) { M(B(0.25, 1.1, 2.8), stone, sx * 2.7, 0.71, -1.15); into = cut; M(B(0.25, 2.3, 2.8), stone, sx * 2.7, 2.41, -1.15); into = g; }
    for (const sx of [-1, 1]) { into = cut; M(B(1.7, 3.4, 0.25), stone, sx * 1.85, 1.86, 0.2); into = g; M(B(1.7, 1.1, 0.27), stone, sx * 1.85, 0.7, 0.2); } // a parede da antessala (o arco do meio é a passagem)
    { const arch = new THREE.TorusGeometry(1.0, 0.14, 6, 14, Math.PI); into = cut; M(arch, stoneD, 0, 2.2, 0.2); into = g; }
    /* antessala: balcão em L, frascos na prateleira, toldo listrado */
    M(B(3.4, 1.0, 0.5), beam, -0.4, 0.66, 1.4); M(B(3.5, 0.08, 0.6), beamL, -0.4, 1.18, 1.4);
    for (let k = 0; k < 7; k++) { const c = [0x6aff9a, 0xff4a6a, 0x4ac0ff, 0xffd24a, 0xb06aff, 0x6aff9a, 0xff8a3a][k]; M(C(0.06, 0.07, 0.2 + rnd() * 0.12, 8), glow(c), -1.8 + k * 0.42, 1.32, 1.4, 0, 0, 0, false); }
    M(C(0.12, 0.09, 0.14, 10), stoneD, 0.9, 1.29, 1.35); M(C(0.02, 0.02, 0.3, 4), beam, 0.95, 1.42, 1.35, 0, 0, 0.5, false); // pilão
    { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 16; const c = cv.getContext('2d')!; for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#e8dcc0' : '#2a6a4a'; c.fillRect(i * 8, 0, 8, 16); } const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
      M(B(5.4, 0.08, 1.9), std(0xffffff, { map: t }), 0, 2.75, 1.4, 0.32, 0, 0, false); for (const sx of [-1, 1]) post(sx * 2.6, 2.3, 2.5, 0.08); }
    for (let k = 0; k < 5; k++) M(new THREE.ConeGeometry(0.1, 0.4, 5), std([0x5a8a3a, 0x8aa040, 0x6a7a3a][k % 3]), -1.6 + k * 0.8, 2.2, 0.55, Math.PI, 0, 0, false); // ervas penduradas
    /* a sala: o laboratório de verdade e estantes até o teto */
    const st = buildStation(3, rnd, true); st.group.position.set(0, 0.16, -1.05); g.add(st.group);
    into = cut; for (const y of [0.9, 1.6, 2.3]) { M(B(5.0, 0.05, 0.3), beamL, 0, y, -2.25); for (let k = 0; k < 9; k++) M(C(0.05, 0.06, 0.16 + rnd() * 0.1, 7), glow([0x6aff9a, 0xff4a6a, 0x4ac0ff, 0xffd24a, 0xb06aff][(k + (y * 10 | 0)) % 5]), -2.2 + k * 0.55, y + 0.12, -2.25, 0, 0, 0, false); } into = g;
    roof(5.6, 5.0, 3.55, 0.6, 0x2a4a5a, -0.1, false);
    board(3.05, 2.4, 2.8, '#1a2a24', '#bfffd0', 0x0a3a1a);
    out.glow = { x: 0, y: 1.5, z: 0.8, color: 0x6aff9a, base: 18 };
  } else if (v === 4) { /* ESCOLA DE COZINHA: casa com o grande forno de tijolo e chaminé, balcão comprido com panelas, presuntos e réstias de alho, mesas dos aprendizes */
    floor(stone);
    into = cut; M(B(5.6, 3.3, 0.22), plaster, 0, 1.8, -2.5); for (const x of [-2.7, -0.9, 0.9, 2.7]) M(B(0.18, 3.3, 0.26), beam, x, 1.8, -2.5); into = g;
    M(B(0.22, 1.1, 4.8), plaster, -2.7, 0.7, -0.1); M(B(0.22, 1.1, 2.6), plaster, 2.7, 0.7, -1.2); into = cut; M(B(0.22, 2.2, 4.8), plaster, -2.7, 2.35, -0.1); M(B(0.22, 2.2, 2.6), plaster, 2.7, 2.35, -1.2); into = g; for (const z of [-2.4, -0.1, 2.2]) M(B(0.26, 3.3, 0.18), beam, -2.7, 1.8, z); M(B(0.26, 3.3, 0.18), beam, 2.7, 1.8, 0);
    post(2.6, 2.2, 3.2); post(0, 2.2, 3.2);
    const st = buildStation(4, rnd, true); st.group.position.set(-0.6, 0.16, -1.1); g.add(st.group);
    /* chaminé grande de tijolo atrás do forno */
    M(B(1.1, 5.8, 0.9), std(0xffffff, { map: stoneTex(0xa85a3a) }), -1.45, 3.0, -2.0); M(B(1.3, 0.25, 1.1), stoneD, -1.45, 5.95, -2.0);
    /* balcão dos aprendizes com panelas, tábuas e facas; duas mesinhas com banquetas */
    M(B(2.4, 0.9, 0.6), beam, 1.2, 0.6, -2.0); M(B(2.5, 0.08, 0.7), beamL, 1.2, 1.08, -2.0);
    for (let k = 0; k < 4; k++) { M(C(0.16, 0.14, 0.2, 10), [iron, copper][k % 2], 0.3 + k * 0.6, 1.22, -2.0); }
    for (const [x, z] of [[0.9, 0.6], [1.9, 1.1]] as const) { M(B(0.9, 0.06, 0.6), beamL, x, 0.8, z); for (const sx of [-1, 1]) M(B(0.06, 0.64, 0.5), beam, x + sx * 0.38, 0.48, z); M(C(0.15, 0.15, 0.45, 8), beam, x, 0.38, z + 0.6); M(C(0.12, 0.12, 0.04, 10), std(0xe8dcc0), x - 0.2, 0.85, z); M(new THREE.SphereGeometry(0.06, 6, 5), std(0xc8402a), x + 0.15, 0.88, z); }
    into = cut; M(B(4.6, 0.08, 0.08), beam, 0.2, 2.75, -1.4); for (let k = 0; k < 6; k++) { const h = k % 2 ? new THREE.SphereGeometry(0.16, 8, 6) : C(0.05, 0.05, 0.5, 6); const o = M(h, std(k % 2 ? 0x9a4a3a : 0xe8dcb0), -1.7 + k * 0.72, 2.45, -1.4, 0, 0, 0, false); if (k % 2) o.scale.set(0.8, 1.4, 0.8); } into = g;
    roof(5.4, 4.6, 3.4, 0.55, 0x7a3a2a, -0.1);
    lantern(1.4, 2.7, 1.4);
    board(4.25, 2.35, 3.2);
    out.glow = { x: -0.6, y: 0.9, z: -0.4, color: 0xff8a3a, base: 22 }; out.smoke = { x: -1.45, y: 6.2, z: -2.0 };
  } else { /* CASA DE TECNOLOGIA: paredes de chapas rebitadas, claraboia de vidro, bobina de Tesla no telhado, canos de cobre, engrenagem gigante na fachada */
    floor(stoneD);
    const plate = std(0xffffff, { map: stoneTex(0x5a6470) });
    into = cut; M(B(5.6, 3.4, 0.22), plate, 0, 1.86, -2.5); into = g;
    for (const sx of [-1, 1]) { M(B(0.22, 1.1, 4.8), plate, sx * 2.7, 0.71, -0.1); into = cut; M(B(0.22, 2.3, 4.8), plate, sx * 2.7, 2.41, -0.1); into = g; for (let k = 0; k < 6; k++) M(new THREE.SphereGeometry(0.04, 5, 4), brass, sx * 2.82, 0.4 + k * 0.55, 2.25, 0, 0, 0, false); M(B(0.26, 3.4, 0.16), brass, sx * 2.7, 1.86, 2.3); }
    for (const sx of [-1, 1]) M(new THREE.CircleGeometry(0.4, 12), glow(0x8af0ff), sx * 2.83, 2.2, -0.6, 0, sx * Math.PI / 2, 0, false); // vigias acesas
    const st = buildStation(5, rnd, true); st.group.position.set(0, 0.16, -0.8); g.add(st.group);
    /* canos de cobre correndo pela parede com válvulas */
    for (let k = 0; k < 3; k++) { M(C(0.06, 0.06, 4.6, 8), copper, -2.45, 0.6 + k * 0.5, -0.1, Math.PI / 2); M(new THREE.TorusGeometry(0.1, 0.03, 4, 8), std(0xc83a2a), -2.36, 0.6 + k * 0.5, 0.8 - k * 0.6, 0, Math.PI / 2, 0, false); }
    into = cut; for (let k = 0; k < 3; k++) M(C(0.07, 0.07, 3.0, 8), copper, -1.6 + k * 1.6, 1.9, -2.32); into = g;
    /* telhado: duas águas de chapa com a claraboia de vidro no meio */
    { into = cut; const hw = 3.1, pitch = 0.45, L = hw / Math.cos(pitch), H = 3.55, rm = std(0xffffff, { map: shingleTex(0x3a4a5a) }); for (const sx of [-1, 1]) M(B(L, 0.14, 5.6), rm, sx * hw / 2, H + Math.tan(pitch) * hw / 2, -0.1, 0, 0, -sx * pitch);
      const gl = new THREE.MeshToonMaterial({ color: 0x9ae0ff, transparent: true, opacity: 0.5, gradientMap: ramp }); M(B(1.4, 0.05, 2.4), gl, 0, H + Math.tan(pitch) * hw + 0.12, -0.1, 0, 0, 0, false);
      for (const fz of [2.6, -2.8]) { const sh2 = new THREE.Shape(); sh2.moveTo(-2.8, 0); sh2.lineTo(2.8, 0); sh2.lineTo(0, Math.tan(pitch) * 2.8); sh2.lineTo(-2.8, 0); const gm = M(new THREE.ShapeGeometry(sh2), plate, 0, H, fz, 0, 0, 0, false); gm.material = new THREE.MeshToonMaterial({ color: 0x5a6470, gradientMap: ramp, side: THREE.DoubleSide }); }
      into = g; }
    /* bobina de Tesla em cima, fora do corte (é a marca da casa de longe) */
    { const top = 3.55 + Math.tan(0.45) * 3.1; M(C(0.12, 0.2, 1.3, 10), copper, 1.6, top + 0.2, -1.6); for (let k = 0; k < 10; k++) M(new THREE.TorusGeometry(0.2, 0.015, 4, 12), copper, 1.6, top - 0.3 + k * 0.12, -1.6, Math.PI / 2, 0, 0, false); M(new THREE.TorusGeometry(0.32, 0.09, 8, 16), steel, 1.6, top + 0.95, -1.6, Math.PI / 2); M(new THREE.SphereGeometry(0.16, 10, 8), glow(0x8af0ff), 1.6, top + 0.95, -1.6, 0, 0, 0, false); }
    /* engrenagem grande na fachada, ao lado da entrada */
    { const gr = new THREE.Group(); gr.position.set(-2.1, 2.9, 2.42); g.add(gr); into = gr; M(new THREE.TorusGeometry(0.5, 0.12, 6, 18), brass, 0, 0, 0); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; M(B(0.18, 0.18, 0.14), brass, Math.cos(a) * 0.64, Math.sin(a) * 0.64, 0, 0, 0, a); } M(C(0.12, 0.12, 0.2, 8), copper, 0, 0, 0, Math.PI / 2); into = g; }
    lantern(1.2, 2.8, 1.5, 0x8af0ff);
    board(3.25, 2.42, 2.8, '#1a2028', '#9af0ff', 0x0a2a3a);
    out.glow = { x: 0, y: 1.5, z: -0.6, color: 0x6ae0ff, base: 24 }; out.smoke = { x: -1.2, y: 1.0, z: 0.6 };
  }
  cut.traverse((o) => { o.userData.keep = true; });
  return out;
}

/* ENGENHOCAS E UTILIDADES EM 3D NO SHOP (13/11, Erling: "engenhocas e utilidades ainda não estão com imagens em 3D que rotacionam").
   Cada cartão ganha um quadro pequeno com o objeto de verdade girando: o drone e o robô de defesa são os mesmos modelos do jogo (drones3d.ts);
   o bracelete, o pergaminho, o alforje, o canteiro e a bússola são montados aqui. Um só renderer desenha todos, um por vez, e copia para o quadro do cartão. */
import * as THREE from 'three';
import { buildHealDrone, buildShieldBot } from '../drones3d';
import { buildWorker } from '../obras';
import { DECOR } from '../decor';
import { kitReady, kitLoad } from '../libs/kitprops';

const W = 168, H = 120;
const std = (c: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.35, ...o });
const BRASS = 0xc8963a, IRON = 0x3a3d44, LEATHER = 0x7a4a26, PAPER = 0xe8d9b0;
const M = (g: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };

function bracelete(tier: number) { const g = new THREE.Group(), trim = std(tier ? 0xe0c060 : BRASS, { metalness: 0.8, roughness: 0.3 });
  M(g, new THREE.TorusGeometry(0.3, 0.07, 10, 28), trim).rotation.x = Math.PI / 2.4;
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, b = M(g, new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x7fd0ff : 0xfff0a0 }), Math.cos(a) * 0.3, Math.sin(a) * 0.12, Math.sin(a) * 0.28); b.userData.spark = i; }
  M(g, new THREE.BoxGeometry(0.2, 0.16, 0.12), std(IRON), 0, 0.02, 0.3); M(g, new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0x9fe0ff }), 0, 0.02, 0.37); return g; }
function pergaminho() { const g = new THREE.Group(), pap = std(PAPER, { metalness: 0, roughness: 0.9 });
  M(g, new THREE.CylinderGeometry(0.09, 0.09, 0.62, 12), pap).rotation.z = Math.PI / 2; const sh = M(g, new THREE.BoxGeometry(0.56, 0.5, 0.012), pap, 0, -0.27, 0.05); sh.rotation.x = 0.12;
  for (let i = 0; i < 4; i++) M(g, new THREE.BoxGeometry(0.4 - (i % 2) * 0.1, 0.022, 0.004), std(0x5a3a22, { metalness: 0 }), -(i % 2) * 0.05, -0.14 - i * 0.08, 0.07);
  for (const s of [-1, 1]) M(g, new THREE.SphereGeometry(0.06, 8, 6), std(BRASS, { metalness: 0.8 }), s * 0.34, 0, 0); M(g, new THREE.SphereGeometry(0.055, 10, 8), new THREE.MeshBasicMaterial({ color: 0x8fd0ff }), 0.12, -0.44, 0.07); g.position.y = 0.18; return g; }
function alforje() { const g = new THREE.Group(), lea = std(LEATHER, { metalness: 0.05, roughness: 0.85 });
  M(g, new THREE.BoxGeometry(0.62, 0.5, 0.34), lea).geometry.translate(0, 0, 0); M(g, new THREE.CylinderGeometry(0.17, 0.17, 0.62, 12, 1, false, 0, Math.PI), std(0x8a5630, { metalness: 0.05, roughness: 0.85 }), 0, 0.25, 0).rotation.set(Math.PI / 2, 0, Math.PI / 2);
  M(g, new THREE.BoxGeometry(0.64, 0.24, 0.03), std(0x8a5630, { metalness: 0.05 }), 0, 0.14, 0.18); M(g, new THREE.BoxGeometry(0.1, 0.1, 0.04), std(BRASS, { metalness: 0.8 }), 0, 0.04, 0.2);
  for (const s of [-1, 1]) M(g, new THREE.BoxGeometry(0.16, 0.22, 0.1), lea, s * 0.36, -0.08, 0.02); M(g, new THREE.TorusGeometry(0.2, 0.025, 6, 16, Math.PI), lea, 0, 0.36, 0); return g; }
/* 13/11 (Erling: "o robô de construção não sei se condiz com o do jogo"): não condizia. Agora são os MESMOS Ajudantes de Obra Mk III do jogo (obras.ts), dois, com uma pilha de tábuas */
function canteiro() { const g = new THREE.Group();
  for (const s of [-1, 1]) { const b = new THREE.Group(); b.position.set(s * 0.42, 0, s * 0.06); b.rotation.y = -s * 0.35; buildWorker(b, 2, 0.62); g.add(b); }
  for (let i = 0; i < 3; i++) M(g, new THREE.BoxGeometry(0.62, 0.05, 0.14), std(i % 2 ? 0x9a7a50 : 0x8a6a48, { metalness: 0 }), 0, 0.03 + i * 0.055, 0.42).rotation.y = 0.12 * (i - 1);
  return g; }
function bussola() { const g = new THREE.Group(), br = std(BRASS, { metalness: 0.85, roughness: 0.28 });
  M(g, new THREE.CylinderGeometry(0.34, 0.34, 0.09, 28), br); M(g, new THREE.CylinderGeometry(0.29, 0.29, 0.1, 28), std(0xf0e6cc, { metalness: 0, roughness: 0.8 }));
  const n = new THREE.Group(); n.position.y = 0.065; g.add(n); n.userData.agulha = true; M(n, new THREE.ConeGeometry(0.05, 0.24, 4), new THREE.MeshBasicMaterial({ color: 0xd03a2a }), 0, 0, -0.12).rotation.x = -Math.PI / 2; M(n, new THREE.ConeGeometry(0.05, 0.24, 4), std(0x3a4a6a), 0, 0, 0.12).rotation.x = Math.PI / 2;
  M(g, new THREE.TorusGeometry(0.06, 0.018, 6, 12), br, 0, 0, -0.39).rotation.x = Math.PI / 2; g.rotation.x = 0.9; return g; }
function trio(tier: number) { const g = new THREE.Group(), a = buildHealDrone(tier).g, b = buildShieldBot(tier).g, c = bracelete(tier); a.position.set(-0.42, 0.14, 0); a.scale.setScalar(0.85); b.position.set(0.4, 0.1, 0); b.scale.setScalar(0.62); c.position.set(0, -0.26, 0.2); c.scale.setScalar(0.62); g.add(a, b, c); return g; }

/** o modelo de um produto do Shop (id de ENG_PRODS / UTIL_PRODS) */
export function prodModel(id: string): THREE.Object3D | null { const t = id.endsWith('_d30') ? 1 : 0;
  if (id.startsWith('drone_cura')) return buildHealDrone(t).g; if (id.startsWith('escudo_auto')) return buildShieldBot(t).g; if (id.startsWith('pulseira_choque')) return bracelete(t); if (id.startsWith('trio')) return trio(t);
  if (DECOR[id]) return DECOR[id].build();
  if (id === 'u_regresso') return pergaminho(); if (id === 'u_alforje') return alforje(); if (id === 'u_obra') return canteiro(); if (id === 'u_viagem') return bussola(); return null; }

let R: THREE.WebGLRenderer | null = null, falhou = false; const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 30);
sc.add(new THREE.HemisphereLight(0xfff0d8, 0x2a2030, 1.7)); { const d = new THREE.DirectionalLight(0xffe6c0, 2.6); d.position.set(3, 5, 4); sc.add(d); const b = new THREE.DirectionalLight(0x9ab8ff, 1.0); b.position.set(-4, 2, -3); sc.add(b); }
const cache = new Map<string, { o: THREE.Object3D; r: number; cy: number }>();
let raf = 0, alvo: HTMLElement | null = null;
/** liga os quadros `canvas[data-g3]` que estiverem dentro de `root`; para sozinho quando eles saem da tela */
export function giraCards(root: HTMLElement) { alvo = root; cancelAnimationFrame(raf); if (!root.querySelector('canvas[data-g3]')) return; raf = requestAnimationFrame(frame); }
function frame(t: number) {
  const L = alvo ? Array.from(alvo.querySelectorAll<HTMLCanvasElement>('canvas[data-g3]')) : []; if (!L.length || !alvo!.isConnected || alvo!.style.display === 'none') return; raf = requestAnimationFrame(frame);
  if (falhou) return; if (!R) { try { R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(W * 2, H * 2, false); R.outputColorSpace = THREE.SRGBColorSpace; } catch { falhou = true; for (const c of L) c.hidden = true; return; } }
  const vh = innerHeight; for (const cv of L) { const id = cv.dataset.g3!; /* 13/11: só desenha (e só carrega) o que está na tela; com 60 e tantas peças na aba, desenhar todas a cada quadro pesava */ { const rc = cv.getBoundingClientRect(); if (rc.bottom < -40 || rc.top > vh + 40 || !rc.width) continue; } let e = cache.get(id); if (!e) { const kit = DECOR[id]?.kit; if (kit && !kitReady(kit)) { void kitLoad(kit); continue; } const o = prodModel(id); if (!o) { cv.hidden = true; continue; } /* 13/11 (Erling: "tem que centralizar o drone na visão"): a caixa conta só o que se vê (malhas visíveis e opacas); o facho e o brilho invisíveis puxavam o centro para baixo e o drone subia para fora do quadro */ o.updateMatrixWorld(true); const box = new THREE.Box3(); o.traverse((q) => { const m = q as THREE.Mesh; if (!m.isMesh || !m.visible) return; const mt = m.material as THREE.Material & { opacity?: number }; if (mt && mt.transparent && (mt.opacity ?? 1) < 0.35) return; let v: THREE.Object3D | null = m; while (v && v !== o) { if (!v.visible) return; v = v.parent; } box.expandByObject(m); }); if (box.isEmpty()) box.setFromObject(o); const sp = box.getBoundingSphere(new THREE.Sphere()); e = { o, r: Math.max(0.2, sp.radius), cy: sp.center.y }; cache.set(id, e); }
    e.o.rotation.y = t / 1000 * 0.9; e.o.traverse((n) => { if (n.userData.agulha) n.rotation.y = Math.sin(t / 700) * 0.5 - t / 1000 * 0.9; if (n.userData.spark !== undefined) n.visible = (Math.floor(t / 130) + n.userData.spark) % 3 !== 0; });
    sc.add(e.o); const d = e.r * (id.startsWith('drone') ? 2.1 : id.startsWith('trio') || id === 'u_obra' ? 2.6 : 3.3); cam.position.set(0, e.cy + d * 0.34, d); cam.lookAt(0, e.cy, 0); R.render(sc, cam); sc.remove(e.o);
    const c2 = cv.getContext('2d'); if (c2) { c2.clearRect(0, 0, cv.width, cv.height); c2.drawImage(R.domElement, 0, 0, cv.width, cv.height); } }
}

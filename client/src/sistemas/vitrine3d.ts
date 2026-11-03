/* VITRINE 3D DO SHOP (03/11, Erling: "na loja coloque imagens das montarias com rotação para o usuário poder ver direitinho o que vai comprar…
   diminuir os cards e colocar um olho de opção no card: quando clicamos abre uma modal somente com a imagem da montaria, onde podemos rotacionar
   ela e olhar bem"). Uma janela por cima do Shop com o bicho em 3D: arrastar gira, a roda aproxima, ele gira sozinho quando ninguém mexe e o
   botão "Andar" mostra o passo. O mesmo modelo do Estábulo (companions.ts: mountModel / petModel). */
import * as THREE from 'three';
import { MOUNTS, PETS, mountModel, petModel } from '../companions';
import { ramp } from '../toon3d';

const el = document.createElement('div'); el.id = 'vitrine'; document.body.appendChild(el);
let R: THREE.WebGLRenderer | null = null, open = false, raf = 0;
const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 560 / 420, 0.1, 80);
sc.add(new THREE.HemisphereLight(0xfff0d8, 0x2a2030, 1.5)); { const d = new THREE.DirectionalLight(0xffe6c0, 2.4); d.position.set(3, 5, 4); sc.add(d); const b = new THREE.DirectionalLight(0x9ab8ff, 0.9); b.position.set(-4, 2, -3); sc.add(b); }
const floor = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshToonMaterial({ color: 0x3a2c1c, gradientMap: ramp })); floor.rotation.x = -Math.PI / 2; sc.add(floor);
const rim = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.68, 64), new THREE.MeshBasicMaterial({ color: 0xd9b45a, transparent: true, opacity: 0.6 })); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.005; sc.add(rim);
let model: { root: THREE.Object3D; pose: (dt: number, mv: number, t: number) => void } | null = null, H = 1;
let yaw = 0.7, pitch = 0.32, zoom = 1, drag = false, lx = 0, ly = 0, idleT = 0, walk = false, last = 0;

export interface VitrineInfo { id: string; name: string; where: string; lvl: number; blurb: string; price: string; tag: string }
export function openVitrine(info: VitrineInfo, onBuy: () => void) {
  el.innerHTML = `<div class="vt-pn"><div class="vt-top"><div><small>${info.tag}${info.lvl ? ` · nível ${info.lvl}` : ''} · ${info.where}</small><b>${info.name}</b></div><button data-vx title="Fechar (Esc)">✕</button></div>
    <canvas width="560" height="420"></canvas>
    <div class="vt-hint">arraste para girar · roda do mouse aproxima · <button data-vw>▶ Andar</button></div>
    <p>${info.blurb}</p><div class="vt-buy"><span>${info.price}</span><button data-vb>Comprar</button></div></div>`;
  el.style.display = 'flex'; open = true;
  const cv = el.querySelector('canvas') as HTMLCanvasElement;
  try { R?.dispose(); R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); R.setPixelRatio(Math.min(2, devicePixelRatio)); R.setSize(560, 420, false); R.outputColorSpace = THREE.SRGBColorSpace; } catch { R = null; }
  if (model) sc.remove(model.root);
  const pk = PETS[info.id], mk = MOUNTS[info.id];
  if (pk) model = petModel(pk); else if (mk) { const m = mountModel(mk); model = { root: m.root, pose: (dt, mv) => m.hz.pose({ dt, mv, idle: mv < 0.1 }) }; } else model = null;
  if (model) { sc.add(model.root); const box = new THREE.Box3().setFromObject(model.root), sz = box.getSize(new THREE.Vector3()); H = Math.max(sz.y, sz.z * 0.75, sz.x * 0.75, 0.35); floor.scale.setScalar(Math.max(0.45, H * 0.7)); rim.scale.copy(floor.scale); }
  yaw = 0.7; pitch = 0.32; zoom = 1; walk = false; idleT = 0;
  cv.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; cv.setPointerCapture(e.pointerId); idleT = 0; });
  cv.addEventListener('pointermove', (e) => { if (!drag) return; yaw += (e.clientX - lx) * 0.012; pitch = Math.max(0.02, Math.min(1.1, pitch + (e.clientY - ly) * 0.006)); lx = e.clientX; ly = e.clientY; idleT = 0; });
  cv.addEventListener('pointerup', () => { drag = false; });
  cv.addEventListener('wheel', (e) => { e.preventDefault(); zoom = Math.max(0.55, Math.min(1.6, zoom * (e.deltaY > 0 ? 1.08 : 0.92))); idleT = 0; }, { passive: false });
  el.querySelector('[data-vx]')!.addEventListener('click', closeVitrine);
  el.querySelector('[data-vw]')!.addEventListener('click', (e) => { walk = !walk; (e.currentTarget as HTMLElement).textContent = walk ? '■ Parar' : '▶ Andar'; });
  el.querySelector('[data-vb]')!.addEventListener('click', () => { closeVitrine(); onBuy(); });
  el.onclick = (e) => { if (e.target === el) closeVitrine(); };
  cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame);
}
export function closeVitrine() { open = false; el.style.display = 'none'; cancelAnimationFrame(raf); }
export const vitrineOpen = () => open;
addEventListener('keydown', (e) => { if (open && e.key === 'Escape') { e.stopPropagation(); closeVitrine(); } }, true);
function frame(t: number) {
  if (!open) return; raf = requestAnimationFrame(frame); const dt = Math.min(0.05, (t - last) / 1000); last = t; idleT += dt;
  if (!R || !model) return;
  if (!drag && idleT > 1.5) yaw += dt * 0.45; /* gira sozinho quando ninguém mexe */
  model.root.rotation.y = yaw; model.pose(dt, walk ? 3 : 0, t / 1000);
  const d = H * 4.3 * zoom; cam.position.set(0, H * 0.45 + Math.sin(pitch) * d, Math.cos(pitch) * d); cam.lookAt(0, H * 0.42, 0);
  R.render(sc, cam);
}
/* 03/11 (Erling: "no card pequeno a imagem real da montaria também, senão não chama atenção para a compra"): retrato de cada bicho,
   desenhado uma vez num renderer próprio e guardado (dataURL) — de três quartos, a mesma luz da vitrine */
const thumbs = new Map<string, string>(); let TR: THREE.WebGLRenderer | null = null; const tq: [string, (u: string) => void][] = []; let tBusy = false;
const tcam = new THREE.PerspectiveCamera(28, 1.25, 0.1, 80);
export function mountThumb(id: string, cb: (url: string) => void) {
  const c = thumbs.get(id); if (c) { cb(c); return; } tq.push([id, cb]); if (!tBusy) { tBusy = true; requestAnimationFrame(thumbNext); }
}
function thumbNext() {
  const job = tq.shift(); if (!job) { tBusy = false; return; } const [id, cb] = job; const have = thumbs.get(id); if (have) { cb(have); requestAnimationFrame(thumbNext); return; }
  try { if (!TR) { const cv = document.createElement('canvas'); TR = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); TR.setPixelRatio(1); TR.setSize(200, 160, false); TR.outputColorSpace = THREE.SRGBColorSpace; } } catch { tBusy = false; return; }
  const pk = PETS[id], mk = MOUNTS[id]; let root: THREE.Object3D | null = null;
  if (pk) root = petModel(pk).root; else if (mk) root = mountModel(mk).root;
  if (root) { const was = [floor.visible, rim.visible]; floor.visible = rim.visible = false; const keep = model?.root; if (keep) keep.visible = false;
    sc.add(root); root.rotation.y = 0.75; const box = new THREE.Box3().setFromObject(root), sz = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3()), h = Math.max(sz.y, sz.z * 0.8, sz.x * 0.8, 0.3);
    tcam.position.set(ctr.x + h * 0.4, ctr.y + h * 0.55, ctr.z + h * 2.9); tcam.lookAt(ctr.x, ctr.y, ctr.z); TR.render(sc, tcam);
    const url = TR.domElement.toDataURL('image/png'); thumbs.set(id, url); sc.remove(root); floor.visible = was[0]; rim.visible = was[1]; if (keep) keep.visible = true; cb(url); }
  requestAnimationFrame(thumbNext);
}

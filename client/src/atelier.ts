import * as THREE from 'three';
import { loadModel, Puppet } from './models3d';

const MODELS = ['Imp', 'Puglin'];
const canvas = document.getElementById('c') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
const PIX = 2;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a1830);
const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
scene.add(new THREE.HemisphereLight(0xbcd0ff, 0x302820, 1.6));
const sun = new THREE.DirectionalLight(0xfff0d0, 2.2); sun.position.set(3, 5, 4); scene.add(sun);
const floor = new THREE.Mesh(new THREE.CircleGeometry(2, 32).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x3a3348 })); scene.add(floor);
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(Math.floor(w / PIX), Math.floor(h / PIX), false); canvas.style.width = '100%'; canvas.style.height = '100%'; cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

let cur: THREE.Object3D | null = null, pup: Puppet | null = null, name = MODELS[0], mode = 'tpose', spin = true, t = 0;
const ui = document.getElementById('ui')!;
const btn = (label: string, fn: () => void, grp: string) => { const b = document.createElement('button'); b.textContent = label; b.dataset.g = grp; b.onclick = () => { fn(); ui.querySelectorAll(`button[data-g="${grp}"]`).forEach((x) => x.classList.remove('on')); b.classList.add('on'); }; ui.appendChild(b); return b; };
MODELS.forEach((m, i) => { const b = btn(m, () => { name = m; show(); }, 'm'); if (!i) b.classList.add('on'); });
['tpose', 'idle', 'walk', 'attack', 'hit'].forEach((m, i) => { const b = btn(m, () => { mode = m; }, 'p'); if (!i) b.classList.add('on'); });
btn('girar', () => { spin = !spin; }, 'x');
async function show() {
  if (cur) scene.remove(cur);
  cur = await loadModel(`/models/bestiary/${name}.glb`); pup = new Puppet(cur); scene.add(cur);
  const box = new THREE.Box3().setFromObject(cur); const h = box.max.y - box.min.y;
  cam.position.set(0, h * 0.6, h * 3.2); cam.lookAt(0, h * 0.5, 0);
  (window as unknown as { __a: unknown }).__a = { pup, cur };
}
export function pose(p: Puppet, m: string, tt: number) {
  p.clear();
  const D = Math.PI / 180;
  if (m === 'tpose') { p.apply(); return; }
  // braços para baixo (T-pose → neutro): giro em torno do eixo z (frente)
  const arm = 72 * D;
  const walk = m === 'walk' ? Math.sin(tt * 7) : 0, breath = Math.sin(tt * 2);
  p.set('upperarm_l', 0, 0, -arm); p.set('upperarm_r', 0, 0, arm);
  p.set('lowerarm_l', 0, 0, -0.25); p.set('lowerarm_r', 0, 0, 0.25);
  if (m === 'walk') { p.set('thigh_l', walk * 0.6); p.set('thigh_r', -walk * 0.6); p.set('calf_l', Math.max(0, -walk) * 0.8); p.set('calf_r', Math.max(0, walk) * 0.8); p.set('spine_01', 0.12); }
  if (m === 'idle') { p.set('spine_02', breath * 0.02); }
  p.apply();
}
function loop() {
  requestAnimationFrame(loop); t += 0.016;
  if (cur && pup) { if (spin) cur.rotation.y += 0.01; pose(pup, mode, t); }
  renderer.render(scene, cam);
}
show().then(loop);

/* 10/11 (Erling: "o modo Moderno tem que ficar com gráficos atuais, na qualidade das imagens dos personagens, e não em pixel; o pixel art é
   para todos jogarem, quem tem PC melhor joga no Moderno"). O Moderno troca o material de desenho animado (toon, luz em faixas) pelo
   material físico (luz contínua, rugosidade, reflexo do céu), liga a luz ambiente do céu (o mesmo jeito que os retratos dos heróis são
   feitos) e deixa as texturas lisas (filtro linear, mipmaps e anisotropia) em vez de pixel. Voltar para o Pixel devolve tudo como era.
   Objetos que nascem depois (inimigos, casas que carregam, efeitos) são convertidos a cada meio segundo enquanto o Moderno estiver ligado. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { cutoutify } from '../toon3d';

const CONV = new Map<THREE.Material, THREE.Material>(); /* toon → físico (o mesmo toon gera sempre o mesmo físico) */
const BACK = new WeakMap<THREE.Material, THREE.Material>(); /* físico → toon de origem */
const TEXF = new WeakMap<THREE.Texture, [THREE.MagnificationTextureFilter, THREE.MinificationTextureFilter, number, boolean]>();
let on = false, envTex: THREE.Texture | null = null, timer = 0;

function smoothTex(t: THREE.Texture | null | undefined, aniso: number) {
  /* 10/11: no WebGPU, mexer numa textura sem imagem (ainda carregando) ou numa textura de render target derrubava o renderer
     ("Cannot read properties of null (reading 'complete')" e "writable usage and another usage"); essas ficam como estão */
  if (!t || TEXF.has(t) || !t.image || (t as THREE.Texture & { isRenderTargetTexture?: boolean }).isRenderTargetTexture || (t as THREE.DepthTexture).isDepthTexture || (t as THREE.FramebufferTexture).isFramebufferTexture || (t.image as HTMLImageElement).complete === false) return; TEXF.set(t, [t.magFilter, t.minFilter, t.anisotropy, t.generateMipmaps]);
  if (t.magFilter === THREE.NearestFilter || t.minFilter === THREE.NearestFilter || t.anisotropy < aniso) {
    t.magFilter = THREE.LinearFilter; t.minFilter = (t as THREE.DataTexture).isDataTexture ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter; t.generateMipmaps = !(t as THREE.DataTexture).isDataTexture; t.anisotropy = aniso; t.needsUpdate = true; }
}
function restoreTex(t: THREE.Texture | null | undefined) { const o = t ? TEXF.get(t) : undefined; if (!t || !o || !t.image) return; [t.magFilter, t.minFilter, t.anisotropy, t.generateMipmaps] = o; t.needsUpdate = true; TEXF.delete(t); }

function toPhys(m: THREE.Material, aniso: number): THREE.Material {
  const tm = m as THREE.MeshToonMaterial; if (!tm.isMeshToonMaterial || m.userData.keepToon) return m;
  let p = CONV.get(m); if (p) return p;
  const s = new THREE.MeshStandardMaterial({ color: tm.color, map: tm.map, emissive: tm.emissive, emissiveIntensity: tm.emissiveIntensity, emissiveMap: tm.emissiveMap,
    alphaMap: tm.alphaMap, normalMap: tm.normalMap, transparent: tm.transparent, opacity: tm.opacity, side: tm.side, alphaTest: tm.alphaTest, depthWrite: tm.depthWrite, vertexColors: tm.vertexColors,
    roughness: 0.78, metalness: 0.0, envMapIntensity: 0.3, fog: tm.fog });
  /* metal brilhante (armas, armaduras com emissivo de raridade) reflete um pouco mais */
  if (tm.emissive && tm.emissive.getHex() !== 0 && !tm.map) { s.roughness = 0.45; s.metalness = 0.35; }
  s.userData = { ...m.userData, phys: true }; smoothTex(s.map, aniso); smoothTex(s.emissiveMap, aniso);
  /* 11/11 (Erling: "se escondeu atrás da casa e não vejo"): o recorte da aura era reconhecido lendo o texto da função, e só achava quando o recorte era a ÚLTIMA camada do material; telhado e parede com outra camada por cima perdiam o recorte no Moderno. Agora vale a marca */
  if (m.userData.cutOn || (m.onBeforeCompile && m.onBeforeCompile.toString().includes('uCut'))) cutoutify(s);
  p = s; CONV.set(m, p); BACK.set(p, m); return p;
}

function walk(root: THREE.Object3D, aniso: number, toModern: boolean) {
  root.traverse((o) => { const mesh = o as THREE.Mesh; if (!mesh.isMesh && !(o as THREE.InstancedMesh).isInstancedMesh && !(o as THREE.SkinnedMesh).isSkinnedMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]; let changed = false;
    const out = mats.map((m) => { if (!m) return m; if (toModern) { const n = toPhys(m, aniso); if (n !== m) changed = true; const tm = n as THREE.MeshStandardMaterial; smoothTex(tm.map, aniso); return n; }
      const b = BACK.get(m); if (b) { changed = true; return b; } restoreTex((m as THREE.MeshStandardMaterial).map); return m; });
    if (changed) mesh.material = Array.isArray(mesh.material) ? out : out[0]; });
}

/** liga/desliga o Moderno. `renderer` é o WebGL do mundo (no WebGPU fica só a parte das texturas e da luz). */
export function setModern(scene: THREE.Scene, renderer: THREE.WebGLRenderer, enable: boolean, webgl = true) {
  const aniso = Math.min(4, renderer.capabilities?.getMaxAnisotropy?.() ?? 4);
  if (enable === on) { if (on) walk(scene, aniso, true); return; }
  on = enable; clearInterval(timer);
  if (enable) {
    if (webgl && !envTex) { try { const pm = new THREE.PMREMGenerator(renderer); envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); } catch { envTex = null; } }
    if (envTex) { scene.environment = envTex; (scene as THREE.Scene & { environmentIntensity?: number }).environmentIntensity = 0.2; }
    walk(scene, aniso, true);
    timer = window.setInterval(() => walk(scene, aniso, true), 4000);
  } else {
    if (scene.environment === envTex) scene.environment = null;
    walk(scene, aniso, false);
  }
}
export const modernOn = () => on;

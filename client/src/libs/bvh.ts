/* 10/11 three-mesh-bvh (MIT) — Erling: "cliques mais rápidos, colisões: sensacional".
   Cada malha ganha, na PRIMEIRA vez que um raio a testa, uma árvore de caixas (BVH) sobre os seus triângulos; dali em diante o raio desce
   pela árvore em vez de testar triângulo por triângulo. Quem mais ganha: o teste "o herói está atrás de algo?" (10 raios da câmera até
   o herói contra o mundo inteiro), os cliques no chão e nos objetos, e as linhas de visão.
   Malhas que mudam de forma (rastros, água animada, personagens com esqueleto) ficam de fora — o raio nelas segue o caminho normal. */
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, CENTER } from 'three-mesh-bvh';

let on = false;
/** quantas árvores nasceram, quanto tempo levaram ao todo e a pior (para o /perf) */
export const bvhStats = { n: 0, ms: 0, worst: 0, worstPts: 0 };
const sigOf = (g: THREE.BufferGeometry, pos: THREE.BufferAttribute) => `${pos.version}|${pos.count}|${g.index ? g.index.version + ':' + g.index.count : '-'}|${g.drawRange.start}:${g.drawRange.count}|${g.groups.length}`;
const queue: THREE.BufferGeometry[] = [];
let pumping = false;
/** faz a árvore da malha agora; false = não deu (a malha fica marcada e segue no caminho antigo) */
function grow(g: THREE.BufferGeometry): boolean {
  const pos = g.getAttribute('position') as THREE.BufferAttribute | undefined; if (!pos) return false;
  try { const t0 = performance.now(); g.computeBoundsTree({ strategy: CENTER, maxLeafTris: 16 }); const ms = performance.now() - t0; bvhStats.n++; bvhStats.ms += ms; if (ms > bvhStats.worst) { bvhStats.worst = ms; bvhStats.worstPts = pos.count; } g.userData.bvhPos = pos; g.userData.bvhSig = sigOf(g, pos); return true; } catch { g.userData.noBvh = true; return false; }
}
function pump() {
  if (pumping) return; pumping = true;
  const idle = (window as unknown as { requestIdleCallback?: (f: (d: { timeRemaining(): number }) => void, o?: { timeout: number }) => void }).requestIdleCallback;
  const step = (d?: { timeRemaining(): number }) => {
    do { const g = queue.shift(); if (!g) break; g.userData.bvhQ = false; if (g.getAttribute('position')) grow(g); } while (d && d.timeRemaining() > 6 && queue.length);
    if (queue.length) { if (idle) idle(step, { timeout: 400 }); else setTimeout(() => step(), 30); } else pumping = false;
  };
  if (idle) idle(step, { timeout: 400 }); else setTimeout(() => step(), 30);
}
export function installBvh() {
  if (on || /[?&]nobvh/.test(location.search)) return; on = true; (window as unknown as { __bvh: unknown }).__bvh = bvhStats; /* ?nobvh: desliga, para comparar */
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  const base = THREE.Mesh.prototype.raycast;
  THREE.Mesh.prototype.raycast = function (this: THREE.Mesh, rc: THREE.Raycaster, out: THREE.Intersection[]) {
    const g = this.geometry as THREE.BufferGeometry | undefined, pos = g?.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!g || !pos || (this as THREE.Mesh & { isSkinnedMesh?: boolean }).isSkinnedMesh || g.morphAttributes.position || pos.usage === THREE.DynamicDrawUsage || g.userData.noBvh) return base.call(this, rc, out);
    /* 11/11 (travadas de 500 a 850 ms no /travadas do Erling): a árvore de uma malha grande levava centenas de ms para nascer, e nascia
       no meio do quadro, dentro do primeiro raio. Agora malha grande entra numa fila e a árvore nasce nas folgas (uma por vez); até lá o
       raio segue o caminho antigo. E árvore de malha que mudou de pontos (cenário refeito) é descartada: raio em árvore velha erra. */
    const ud = g.userData as { bvhPos?: unknown; bvhVer?: number; bvhQ?: boolean; bvhSig?: string };
    /* 11/11, tarde (Erling: "o círculo que não deixa o personagem sumir atrás da casa desapareceu"): a árvore só enxerga os triângulos que existiam quando ela nasceu.
       Malha do cenário que cresce depois (mais triângulos no índice ou na faixa desenhada) ficava com a árvore velha, e o raio atravessava a casa nova sem bater.
       A assinatura agora inclui o índice e a faixa desenhada: mudou qualquer coisa, a árvore é refeita. */
    if (g.boundsTree && (ud.bvhPos !== pos || ud.bvhSig !== sigOf(g, pos))) { g.disposeBoundsTree(); }
    if (!g.boundsTree) {
      if (pos.count < 120) return base.call(this, rc, out);
      if (pos.count > 6000) { if (!ud.bvhQ) { ud.bvhQ = true; queue.push(g); pump(); } return base.call(this, rc, out); }
      if (!grow(g)) return base.call(this, rc, out);
    }
    return acceleratedRaycast.call(this, rc, out);
  };
  /* geometria descartada leva a árvore junto */
  const disp = THREE.BufferGeometry.prototype.dispose;
  THREE.BufferGeometry.prototype.dispose = function (this: THREE.BufferGeometry) { if (this.boundsTree) this.disposeBoundsTree(); return disp.call(this); };
}

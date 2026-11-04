/* LUZES FIXAS NO WEBGL (03/11, Erling: "não quero que o jogo trave quando passa de level nem quando compra premium").
   No WebGL, o programa de cada material depende de QUANTAS luzes pontuais a cena tem. Toda luz que nasce ou some (o pilar de luz da
   subida de nível, o brilho de um golpe, a lanterna de um NPC que chega, a vela de uma decoração) fazia o WebGL recompilar TODOS os
   materiais da tela — segundos de tela parada. Agora o desenho vê sempre as mesmas luzes (as fixas): a cada quadro elas copiam posição,
   cor, força e alcance das luzes reais mais perto do centro da tela. As luzes reais vão para a camada 31, que a câmera não desenha.
   Muda só valor de uniforme: nada recompila. (No WebGPU, gpu/impl.ts faz o mesmo com o seu conjunto.) */
import * as THREE from 'three';

const HIDE = 31;
const isFixed = (o: THREE.Object3D) => !!(o.userData.fixedLight || o.userData.gpuPool);
function hideReal(o: THREE.Object3D) { if ((o as THREE.PointLight).isPointLight && !isFixed(o)) o.layers.set(HIDE); }

let patched = false;
/** toda luz pontual que entra na cena (sozinha ou dentro de um grupo) sai da vista do desenho na mesma hora */
function patchAdd() {
  if (patched) return; patched = true;
  /* "todas as camadas" passa a ser todas MENOS a escondida: câmera de retrato, de boneco ou de cena (enableAll) também não vê as luzes reais —
     antes o retrato do herói na subida de nível via 30 luzes e recompilava o herói inteiro */
  THREE.Layers.prototype.enableAll = function (this: THREE.Layers) { this.mask = 0x7fffffff; };
  const P = THREE.Object3D.prototype, oAdd = P.add;
  P.add = function (this: THREE.Object3D, ...objs: THREE.Object3D[]) {
    const r = oAdd.apply(this, objs);
    for (const o of objs) { if (!o) continue; if ((o as THREE.PointLight).isPointLight) hideReal(o); else if (o.children.length) o.traverse(hideReal); }
    return r;
  } as typeof P.add;
}

export function createFixedLights(n = 15) {
  patchAdd();
  const pool: THREE.PointLight[] = []; let poolScene: THREE.Scene | null = null, reals: THREE.PointLight[] = [], tick = 0;
  const tgt = new THREE.Vector3(), dir = new THREE.Vector3(), cand: { d: number; l: THREE.PointLight; p: THREE.Vector3 }[] = [], wps: THREE.Vector3[] = [];
  const onStage = (o: THREE.Object3D, sc: THREE.Scene) => { let q: THREE.Object3D | null = o; while (q) { if (!q.visible) return false; if (q === sc) return true; q = q.parent; } return false; };
  return {
    /** antes de desenhar: as luzes fixas copiam as reais mais perto do que a câmera olha */
    frame(s: THREE.Scene, cam: THREE.Camera) {
      if (poolScene !== s) { if (!pool.length) for (let i = 0; i < n; i++) { const p = new THREE.PointLight(0xffffff, 0, 1, 2); p.userData.fixedLight = true; p.castShadow = false; pool.push(p); }
        for (const p of pool) { p.removeFromParent(); s.add(p); p.layers.enableAll(); } poolScene = s; tick = 0; }
      if ((tick++ % 10) === 0) { reals = []; s.traverse((o) => { const l = o as THREE.PointLight; if (!l.isPointLight || isFixed(l)) return; if (l.layers.mask !== 1 << HIDE) l.layers.set(HIDE); reals.push(l); }); }
      cam.getWorldDirection(dir); tgt.copy(cam.position).addScaledVector(dir, 60); cand.length = 0;
      for (let i = 0; i < reals.length; i++) { const l = reals[i]; if (l.intensity <= 0 || !onStage(l, s)) continue; const w = wps[i] ?? (wps[i] = new THREE.Vector3()); l.getWorldPosition(w); cand.push({ d: w.distanceTo(tgt) - (l.distance || 30) * 0.5, l, p: w }); }
      cand.sort((a, b) => a.d - b.d);
      for (let i = 0; i < n; i++) { const p = pool[i], c = cand[i]; if (c) { p.position.copy(c.p); p.color.copy(c.l.color); p.intensity = c.l.intensity; p.distance = c.l.distance; p.decay = c.l.decay; } else p.intensity = 0; p.updateMatrixWorld(true); }
    },
  };
}

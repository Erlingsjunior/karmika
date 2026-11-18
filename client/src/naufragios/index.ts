/* Os naufrágios no mundo: acha os cascos (dados.ts), fecha as casas que eles ocupam e só desenha os que estão perto de quem joga. */
import * as THREE from 'three';
import { acha, casasDe, type Casco, type TerrenoCtx } from './dados';
import { fazCasco } from './modelos';
export { REGIAO } from './dados';

export interface NaufragiosCtx extends TerrenoCtx { scene: THREE.Scene; /** fecha uma casa do mapa (vira parede), se for chão */ fecha(x: number, y: number): void; heroi(): { x: number; z: number } }
export function createNaufragios(K: NaufragiosCtx) {
  const L: Casco[] = acha(K), M = new Map<Casco, THREE.Group>(); for (const c of L) if (!c.naAgua) for (const [x, y] of casasDe(c)) K.fecha(x, y);
  let t = 0;
  function monta(c: Casco) { const g = fazCasco(c), x = (c.x + 0.5) * K.T, z = (c.y + 0.5) * K.T, y = c.naAgua ? Math.max(K.chao(x, z), K.agua - 1.3) : K.chao(x, z);
    g.position.set(x, y - (c.tipo === 'bote' ? 0.05 : 0.45), z); g.rotation.set(0, c.giro, c.tipo === 'bote' ? c.tomba * 0.25 : c.tomba, 'YXZ'); K.scene.add(g); M.set(c, g); }
  return {
    /** uma vez por segundo: desenha os cascos a até 150 m e tira os que ficaram a mais de 190 m */
    tick(dt: number) { t -= dt; if (t > 0) return; t = 1; const h = K.heroi(); for (const c of L) { const d = Math.hypot((c.x + 0.5) * K.T - h.x, (c.y + 0.5) * K.T - h.z), g = M.get(c); if (!g && d < 150) monta(c); else if (g && d > 190) { K.scene.remove(g); g.traverse((o) => (o as THREE.Mesh).geometry?.dispose()); M.delete(c); } } },
    get cascos() { return L; },
  };
}

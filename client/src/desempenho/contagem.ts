/* CONTAGEM DA CENA E DA PLACA (17/11, estudo de desempenho, regras 13 e 15).
   O que está na placa de vídeo e na cena neste instante. Comparar antes e depois de uma luta mostra o que não foi devolvido. */
import type * as THREE from 'three';

export interface Contagem { desenhos: number; triangulos: number; geometrias: number; texturas: number; programas: number; objetos: number; visiveis: number; materiais: number; sombras: number }

/** percorre a cena inteira: só para relatório, nunca dentro do quadro */
export function conta(renderer: THREE.WebGLRenderer, scene: THREE.Scene): Contagem {
  const info = renderer.info; let objetos = 0, visiveis = 0, sombras = 0; const mats = new Set<string>();
  scene.traverse(() => { objetos++; });
  scene.traverseVisible((o) => { visiveis++; const m = o as THREE.Mesh; if (!m.isMesh) return; if (m.castShadow) sombras++;
    const l = m.material as THREE.Material | THREE.Material[] | undefined; if (Array.isArray(l)) { for (const x of l) if (x) mats.add(x.uuid); } else if (l) mats.add(l.uuid); });
  return { desenhos: info.render.calls, triangulos: info.render.triangles, geometrias: info.memory.geometries, texturas: info.memory.textures, programas: info.programs?.length ?? 0, objetos, visiveis, materiais: mats.size, sombras };
}

/** o que sobrou a mais na placa e na cena entre duas contagens (positivo = não foi devolvido) */
export function sobra(antes: Contagem, depois: Contagem) {
  return { geometrias: depois.geometrias - antes.geometrias, texturas: depois.texturas - antes.texturas, programas: depois.programas - antes.programas, objetos: depois.objetos - antes.objetos };
}

/* DESCARTE DOS CORPOS (17/11, estudo de desempenho, regra 15: "quem cria, destrói").
   Medido no /bench: cada luta com dez inimigos deixava cerca de 270 geometrias na placa de vídeo, para sempre. O corpo de um inimigo é montado
   peça por peça (20 a 90 geometrias próprias, mais a etiqueta do nome pintada em tela e a textura dos ossos); quando ele saía da cena, nada disso era
   devolvido. Erling: "o game tem muitos inimigos o tempo todo; um jogo rápido de 20 minutos resultaria em milhares de geometrias perdidas".

   COMO SABE O QUE É DO CORPO E O QUE É GUARDADO PARA TODOS: cada geometria e cada textura do three.js ganha um número de nascimento, em ordem.
   Ao começar a montar um corpo, anota-se o número da vez (a MARCA). O que tem número maior nasceu para aquele corpo; o que tem número menor já
   existia (modelo carregado, forma de mira, anel de missão) e NUNCA é descartado. Além disso, nada que ainda esteja em uso por outro corpo vivo é
   descartado. Materiais não são descartados de propósito: descartar o último material de um programa apaga o programa da placa, e o próximo
   inimigo igual travaria o jogo compilando de novo (regra 14); o material em si é só memória comum, que o navegador recolhe sozinho.

   O descarte é fatiado: no máximo quatro corpos a cada meio segundo (regra 5). */
import * as THREE from 'three';

/** os números de nascimento no começo da montagem de um corpo */
export interface Marca { g: number; t: number }
export const marcaAgora = (): Marca => ({ g: new THREE.BufferGeometry().id, t: new THREE.Texture().id });

const MAPAS = ['map', 'emissiveMap', 'alphaMap', 'normalMap', 'bumpMap', 'specularMap', 'aoMap', 'lightMap', 'roughnessMap', 'metalnessMap'] as const;
type Peca = THREE.Mesh & { skeleton?: THREE.Skeleton; isSkinnedMesh?: boolean };

export function createDescarte(cadaVivo: (f: (raiz: THREE.Object3D) => void) => void) {
  const fila: { raizes: THREE.Object3D[]; marca: Marca }[] = [];
  const geoViva = new Set<THREE.BufferGeometry>(), texViva = new Set<THREE.Texture>();
  let t = 0; const total = { corpos: 0, geometrias: 0, texturas: 0, ossos: 0 };
  const texturas = (o: THREE.Object3D, f: (x: THREE.Texture) => void) => { const m = (o as Peca).material as THREE.Material | THREE.Material[] | undefined; if (!m) return;
    const um = (q: THREE.Material) => { for (const k of MAPAS) { const x = (q as unknown as Record<string, THREE.Texture | null | undefined>)[k]; if (x && x.isTexture) f(x); } };
    if (Array.isArray(m)) { for (const q of m) if (q) um(q); } else um(m); };
  const anotaVivo = (o: THREE.Object3D) => { const p = o as Peca, g = p.geometry; if (g) geoViva.add(g); texturas(o, (x) => texViva.add(x)); const bt = p.isSkinnedMesh ? p.skeleton?.boneTexture : null; if (bt) texViva.add(bt); };
  const olhaVivo = (raiz: THREE.Object3D) => raiz.traverse(anotaVivo);

  return {
    /** o corpo saiu de vez: entra na fila do descarte */
    solta(raizes: (THREE.Object3D | null | undefined)[], marca: Marca | undefined) { if (!marca) return; const r = raizes.filter(Boolean) as THREE.Object3D[]; if (r.length) fila.push({ raizes: r, marca }); },
    /** uma vez por quadro; com a fila vazia não faz nada */
    tick(dt: number) {
      if (!fila.length) return; t -= dt; if (t > 0) return; t = 0.5;
      geoViva.clear(); texViva.clear(); cadaVivo(olhaVivo);
      for (let n = 0; n < 4 && fila.length; n++) { const { raizes, marca } = fila.shift()!; total.corpos++;
        for (const raiz of raizes) raiz.traverse((o) => { const p = o as Peca, g = p.geometry;
          if (g && g.id > marca.g && !geoViva.has(g) && !g.userData.fixa) { g.dispose(); total.geometrias++; }
          /* textura: só a pintada em tela para este corpo (a etiqueta do nome). As dos modelos carregados ficam: são de todos */
          texturas(o, (x) => { if ((x as THREE.CanvasTexture).isCanvasTexture && x.id > marca.t && !texViva.has(x) && !x.userData.fixa) { x.dispose(); total.texturas++; } });
          const bt = p.isSkinnedMesh ? p.skeleton?.boneTexture : null; if (bt && bt.id > marca.t && !texViva.has(bt)) { p.skeleton!.dispose(); total.ossos++; } }); }
    },
    get pendentes() { return fila.length; }, total,
  };
}

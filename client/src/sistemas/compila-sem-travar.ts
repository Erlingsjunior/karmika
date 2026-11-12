/* COMPILAR SOMBREADOR SEM TRAVAR (11/11, Erling: "ainda estou tendo travamentos em WebGL, toda hora tem alguma coisa travando"; o /travadas mostrou
   "desenho 400 a 3.800 ms · nasceu +1 shader"). No WebGL, a primeira vez que um material aparece na tela o navegador compila o programa dele NA HORA,
   e o quadro inteiro espera: com 15 luzes e sombra, cada programa leva de 0,2 a quase 4 s na placa. Bicho novo, magia nova, peça nova = uma travada.
   Aqui o desenho passa por um portão: material que ainda não tem programa pronto NÃO é desenhado naquele quadro; ele entra numa fila, o programa é
   compilado em paralelo (extensão KHR_parallel_shader_compile) e o objeto aparece assim que fica pronto (uma fração de segundo depois), sem parar o jogo.
   O portão só vale depois que o jogo abriu: na abertura e nas telas de carregamento tudo compila como antes, atrás da tela. Sem a extensão, nada muda. */
import * as THREE from 'three';
import { LAYER_WORLD, LAYER_FINE } from '../dual3d';

type RBD = (camera: THREE.Camera, scene: THREE.Scene | null, geometry: THREE.BufferGeometry, material: THREE.Material, object: THREE.Object3D, group: unknown) => void;
export function createShaderGate(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, target: () => THREE.WebGLRenderTarget | null, fineClip: () => THREE.Plane[] | null = () => null) {
  const R = renderer as THREE.WebGLRenderer & { renderBufferDirect: RBD; properties: { get(o: object): { currentProgram?: unknown } } };
  const PR = R.properties as unknown as { get(o: object): { currentProgram?: unknown } };
  let on = false, held = 0, done = 0, miss = 0; const chk = new Map<THREE.Material, unknown>();
  /* ?portao=1 liga o portão mesmo sem a extensão (teste do mecanismo: adiar, compilar, mostrar); ?portao=0 desliga de vez */
  const force = /[?&]portao=1/.test(location.search), off = /[?&]portao=0/.test(location.search);
  if (off || (!force && !renderer.extensions.has('KHR_parallel_shader_compile'))) return { enable() { /* sem a extensão: fica como era */ }, flush() { /* */ }, stats: () => 'sem compilação paralela nesta placa' };
  const ready = new WeakMap<THREE.Material, Set<string>>(), pend = new Map<string, { o: THREE.Object3D; m: THREE.Material; v: string }>();
  /** o programa de um material muda com o tipo do objeto que o usa: esqueleto, instâncias, cor por vértice, sombra recebida… */
  const variant = (o: THREE.Object3D, g: THREE.BufferGeometry) => { const m = o as THREE.Mesh & { isSkinnedMesh?: boolean; isInstancedMesh?: boolean; isBatchedMesh?: boolean; instanceColor?: unknown; morphTargetInfluences?: unknown[] };
    return `${m.isSkinnedMesh ? 1 : 0}${m.isInstancedMesh ? (m.instanceColor ? 2 : 1) : 0}${m.isBatchedMesh ? 1 : 0}${m.receiveShadow ? 1 : 0}${g.attributes.color ? 1 : 0}${g.attributes.tangent ? 1 : 0}${g.attributes.uv1 ? 1 : 0}${g.attributes.uv ? 1 : 0}${g.morphAttributes?.position ? 1 : 0}${(m as { isPoints?: boolean }).isPoints ? 1 : 0}`; };
  const orig = R.renderBufferDirect;
  R.renderBufferDirect = function (this: unknown, cam, sc, geometry, material, object, group) {
    if (on && sc === scene && material) { const v = variant(object, geometry); let set = ready.get(material);
      if (!set?.has(v)) {
        /* já tinha programa antes do portão (compilado na abertura)? vale como pronto */
        if (!set && (R.properties as unknown as { get(o: object): { currentProgram?: unknown } }).get(material).currentProgram) { (set = new Set()).add(v); ready.set(material, set); }
        else { const k = material.uuid + v; if (!pend.has(k)) pend.set(k, { o: object, m: material, v }); held++; return; } } }
    orig.call(this, cam, sc, geometry, material, object, group);
    /* conferência: o programa que o desenho de verdade usou é o mesmo que foi compilado em paralelo? Se não for, a placa compilou de novo NA HORA (travada) */
    if (chk.size && sc === scene) { const p0 = chk.get(material); if (p0 !== undefined) { chk.delete(material); if (PR.get(material).currentProgram !== p0) miss++; } }
  };
  let busy = false;
  /** depois do quadro: manda compilar em paralelo o que ficou esperando */
  function flush() { if (!on || busy || !pend.size) return; busy = true; const L = [...pend.values()]; pend.clear();
    /* 11/11 noite (Erling: "ainda estou tendo travadas fortes no WebGL"; /travadas: milhares de programas compilados aqui e mesmo assim desenhos de 1 a 3,6 s).
       O programa depende do estado da PASSADA que desenha o objeto, e a compilação daqui usava outro estado; o programa saía diferente e a placa compilava
       tudo de novo, na hora, no desenho de verdade. Medido com a conferência abaixo ("recompilados na hora"): 30 de 89. Duas diferenças:
       1) luzes: o desenho usa a câmera numa camada só (cenário ou personagens) e as luzes pontuais de verdade ficam numa camada à parte; aqui a câmera
          estava com todas as camadas e contava luzes a mais;
       2) corte da água: a passada dos personagens liga um plano de corte (a linha d'água corta os corpos); aqui o plano não estava ligado.
       Agora cada objeto é compilado com o estado da passada dele: camada da câmera e planos de corte iguais aos do desenho. */
    const rt0 = renderer.getRenderTarget(), lm = camera.layers.mask, cp0 = renderer.clippingPlanes, ps: Promise<unknown>[] = [];
    const run = (Q: typeof L, layer: number, planes: THREE.Plane[]) => { if (!Q.length) return;
      const fake = { traverse(f: (o: THREE.Object3D) => void) { for (const q of Q) f(q.o); }, traverseVisible() { /* sem luzes aqui: as luzes vêm da cena de verdade */ } } as unknown as THREE.Object3D;
      camera.layers.set(layer); renderer.clippingPlanes = planes; ps.push(renderer.compileAsync(fake, camera, scene)); };
    try { renderer.setRenderTarget(target()); const FB = 1 << LAYER_FINE;
      run(L.filter((q) => q.o.layers.mask & ~FB), LAYER_WORLD, cp0); run(L.filter((q) => q.o.layers.mask & FB), LAYER_FINE, fineClip() ?? cp0);
    } catch (e) { err = String(e).slice(0, 160); } finally { camera.layers.mask = lm; renderer.clippingPlanes = cp0; renderer.setRenderTarget(rt0); }
    const p = Promise.all(ps);
    const fim = () => { for (const q of L) { let set = ready.get(q.m); if (!set) ready.set(q.m, set = new Set()); set.add(q.v); done++; const cp = PR.get(q.m).currentProgram; if (cp) chk.set(q.m, cp); } busy = false; };
    p.then(fim, fim); }
  let err = '';
  return { enable() { on = true; }, flush, stats: () => `${done} programas compilados sem travar · ${held} desenhos adiados · ${miss} recompilados na hora · na fila ${pend.size}${busy ? ' (compilando)' : ''}${err ? ' · erro: ' + err : ''}` };
}

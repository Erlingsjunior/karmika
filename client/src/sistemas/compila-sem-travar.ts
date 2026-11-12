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
  /* 12/11 (Erling: "excesso de travamentos ainda"; /travadas: desenhos de 0,2 a 1,8 s SEM nada novo na tela, e "60 recompilados na hora"):
     O MAPA DAS COMPILAÇÕES NA HORA. Todo programa que a placa já tem fica anotado (`vistos`). Se um desenho sai usando um programa que não estava
     anotado, ele foi compilado ali, com o jogo parado. Para cada caso guardamos O QUE MUDOU entre o programa de antes e o novo (a chave do three.js é uma
     lista de parâmetros: tipo, luzes, sombras, planos de corte, neblina, textura, pele, instâncias…). O /travadas mostra os motivos mais comuns. */
  type Prog = { cacheKey?: string; name?: string }; const vistos = new WeakSet<object>(), ultimo = new WeakMap<THREE.Material, Prog>(); let naHora = 0; const motivos = new Map<string, { n: number; ex: string }>();
  const anota = () => { const L = (renderer.info.programs ?? []) as unknown as object[]; for (const p of L) vistos.add(p); };
  /* os nomes dos parâmetros na ordem em que o three.js 0.186 os põe na chave (WebGLPrograms.getProgramCacheKeyParameters); os dois últimos são máscaras de bits */
  const PN = 'precisão,espaçoDeCor,envMapMode,envMapCubeUVHeight,mapUv,alphaMapUv,lightMapUv,aoMapUv,bumpMapUv,normalMapUv,displacementMapUv,emissiveMapUv,metalnessMapUv,roughnessMapUv,anisotropyMapUv,clearcoatMapUv,clearcoatNormalMapUv,clearcoatRoughnessMapUv,iridescenceMapUv,iridescenceThicknessMapUv,sheenColorMapUv,sheenRoughnessMapUv,specularMapUv,specularColorMapUv,specularIntensityMapUv,transmissionMapUv,thicknessMapUv,combine,fogExp2,sizeAttenuation,morphTargetsCount,morphAttributeCount,luzesSol,luzesDirecionais,luzesPontuais,luzesSpot,spotMaps,luzesHemisfério,luzesÁrea,sombrasSol,sombrasDirecionais,sombrasPontuais,sombrasSpot,sombrasSpotMaps,lightProbes,tipoDeSombra,toneMapping,planosDeCorte,corteInterseção,depthPacking'.split(',');
  const B1 = 'instâncias,corPorInstância,instancingMorph,matcap,envMap,normalObj,normalTang,clearcoat,iridescência,alphaTest,corPorVértice,alfaPorVértice,uv1,uv2,uv3,tangentes,anisotropia,alphaHash,batching,dispersão,batchingColor,gradientMap,packedNormal,normaisDeVértice,retro'.split(','), B2 = 'neblina,useFog,flatShading,logDepth,reversedDepth,pele,morphTargets,morphNormals,morphColors,premultipliedAlpha,sombraLigada,duasFaces,faceInvertida,depthPacking,dithering,transmissão,sheen,opaco,pointsUvs,vídeo,vídeoEmissivo,alphaToCoverage,probeGrids,temPosição'.split(',');
  const bits = (x: string, y: string, N: string[]) => { const d = (+x) ^ (+y), out: string[] = []; for (let i = 0; i < 25; i++) if (d & (1 << i)) out.push(`${N[i] ?? 'bit' + i}${(+y) & (1 << i) ? '+' : '−'}`); return out.join('/'); };
  const difere = (a: string, b: string) => { const A = a.split(','), B = b.split(','), out: string[] = []; if (A[0] !== B[0]) out.push(`tipo ${A[0].slice(0, 12)}→${B[0].slice(0, 12)}`);
    /* acha onde começa a lista de parâmetros: logo depois do tipo e das definições, e ela começa pela precisão */ const off = (K: string[]) => K.findIndex((x) => x === 'highp' || x === 'mediump' || x === 'lowp'), oa = off(A), ob = off(B);
    if (oa < 0 || ob < 0) { for (let i = 1; i < Math.max(A.length, B.length) && out.length < 5; i++) if (A[i] !== B[i]) out.push(`${i}:${(A[i] ?? '∅').slice(0, 14)}→${(B[i] ?? '∅').slice(0, 14)}`); return out.join(' '); }
    if (oa !== ob) out.push(`definições ${A.slice(1, oa).join('|').slice(0, 30)}→${B.slice(1, ob).join('|').slice(0, 30)}`);
    for (let i = 0; i < PN.length; i++) if (A[oa + i] !== B[ob + i]) out.push(`${PN[i]} ${A[oa + i]}→${B[ob + i]}`);
    if (A[oa + 50] !== B[ob + 50]) out.push(bits(A[oa + 50], B[ob + 50], B1)); if (A[oa + 51] !== B[ob + 51]) out.push(bits(A[oa + 51], B[ob + 51], B2));
    if (A.slice(oa + 52).join() !== B.slice(ob + 52).join()) out.push(`cauda ${A.slice(oa + 52).join('|').slice(0, 24)}→${B.slice(ob + 52).join('|').slice(0, 24)}`);
    return out.slice(0, 6).join(' · ') || 'chave igual'; };
  function confere(material: THREE.Material, object: THREE.Object3D, onde: string) { const cp = PR.get(material).currentProgram as Prog | undefined; if (!cp) return; const prev = ultimo.get(material); if (prev === cp) return; ultimo.set(material, cp);
    if (vistos.has(cp)) return; vistos.add(cp); naHora++;
    const why = prev?.cacheKey && cp.cacheKey ? difere(prev.cacheKey, cp.cacheKey) : 'primeiro programa deste material (passou sem esperar)';
    const m = motivos.get(why) ?? { n: 0, ex: `${material.type}${material.name ? ' "' + material.name + '"' : ''} em ${object.type}${object.name ? ' "' + object.name + '"' : ''} camada ${object.layers.mask}${onde}` }; m.n++; motivos.set(why, m); if (motivos.size > 60) motivos.delete(motivos.keys().next().value as string); }
  const lentos = new Map<string, { n: number; ms: number; pior: number }>();
  const mapaLentos = () => [...lentos.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 10).map(([k, v]) => `${Math.round(v.ms)} ms em ${v.n}× (pior ${Math.round(v.pior)} ms): ${k}`);
  const mapa = () => [...motivos.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 6).map(([k, v]) => `${v.n}× [${k}] ex.: ${v.ex}`);
  /* ?portao=1 liga o portão mesmo sem a extensão (teste do mecanismo: adiar, compilar, mostrar); ?portao=0 desliga de vez */
  const force = /[?&]portao=1/.test(location.search), off = /[?&]portao=0/.test(location.search);
  /* 12/11: sem a extensão (ou com ?portao=0) o portão não segura nada, mas o MAPA continua anotando: dá para comparar com e sem portão na mesma placa */
  const livre = off || (!force && !renderer.extensions.has('KHR_parallel_shader_compile'));
  const ready = new WeakMap<THREE.Material, Set<string>>(), pend = new Map<string, { o: THREE.Object3D; m: THREE.Material; v: string }>();
  /** o programa de um material muda com o tipo do objeto que o usa: esqueleto, instâncias, cor por vértice, sombra recebida… */
  const variant = (o: THREE.Object3D, g: THREE.BufferGeometry) => { const m = o as THREE.Mesh & { isSkinnedMesh?: boolean; isInstancedMesh?: boolean; isBatchedMesh?: boolean; instanceColor?: unknown; morphTargetInfluences?: unknown[] };
    return `${m.isSkinnedMesh ? 1 : 0}${m.isInstancedMesh ? (m.instanceColor ? 2 : 1) : 0}${m.isBatchedMesh ? 1 : 0}${m.receiveShadow ? 1 : 0}${g.attributes.color ? 1 : 0}${g.attributes.tangent ? 1 : 0}${g.attributes.uv1 ? 1 : 0}${g.attributes.uv ? 1 : 0}${g.morphAttributes?.position ? 1 : 0}${(m as { isPoints?: boolean }).isPoints ? 1 : 0}`; };
  const orig = R.renderBufferDirect;
  R.renderBufferDirect = function (this: unknown, cam, sc, geometry, material, object, group) {
    if (!on && sc === scene && material) { /* antes do portão abrir (abertura do jogo): anota QUAIS variações de cada material já foram desenhadas */ const v = variant(object, geometry); let set = ready.get(material); if (!set) ready.set(material, set = new Set()); set.add(v); }
    if (on && !livre && sc === scene && material) { const v = variant(object, geometry); let set = ready.get(material);
      if (!set?.has(v)) {
        /* já tinha programa antes do portão (compilado na abertura)? vale como pronto */
        /* 12/11: isto deixava passar material que tinha programa de OUTRA variação (ex.: o mesmo material num corpo com esqueleto): compilava na hora.
           Agora só vale como pronta a variação que foi de fato desenhada na abertura (anotada acima); o resto espera um quadro e compila em paralelo */
        { const k = material.uuid + v; if (!pend.has(k)) pend.set(k, { o: object, m: material, v }); held++; return; } } }
    const t0 = on ? performance.now() : 0, nProg = on ? (renderer.info.programs ?? []).length : 0, nGeo = on ? renderer.info.memory.geometries : 0, nTex = on ? renderer.info.memory.textures : 0;
    orig.call(this, cam, sc, geometry, material, object, group);
    /* 12/11 O MAPA DOS DESENHOS LENTOS: qualquer peça cujo desenho segure o quadro por mais de 25 ms fica anotada com nome, e com o que nasceu na placa
       dentro daquele desenho (programa, malha, textura). É a resposta direta a "qual peça travou o jogo". */
    if (on) { const dt = performance.now() - t0; if (dt > 25) { const o = object as THREE.Object3D & { isSkinnedMesh?: boolean; isInstancedMesh?: boolean; count?: number }, dp = (renderer.info.programs ?? []).length - nProg, dg = renderer.info.memory.geometries - nGeo, dx = renderer.info.memory.textures - nTex;
        const que = `${dp > 0 ? 'programa novo' : dg > 0 ? 'malha nova' : dx > 0 ? 'textura nova' : 'nada novo'} · ${material.type}${material.name ? ' "' + material.name + '"' : ''} · ${o.isSkinnedMesh ? 'corpo com esqueleto' : o.isInstancedMesh ? `cópias (${o.count})` : object.type}${object.name ? ' "' + object.name.slice(0, 24) + '"' : ''}${o.parent?.name ? ' em "' + o.parent.name.slice(0, 20) + '"' : ''} · ${sc === scene ? (object.layers.mask & 2 ? 'personagens' : 'cenário') : sc ? 'outra cena' : 'sombra'} · ${geometry.attributes.position?.count ?? 0} vértices`;
        const L = lentos.get(que) ?? { n: 0, ms: 0, pior: 0 }; L.n++; L.ms += dt; L.pior = Math.max(L.pior, dt); lentos.set(que, L); if (lentos.size > 80) lentos.delete(lentos.keys().next().value as string); } }
    if (on && material) confere(material, object, sc === scene ? '' : sc ? ' (outra cena)' : ' (passada de sombra)');
    /* conferência: o programa que o desenho de verdade usou é o mesmo que foi compilado em paralelo? Se não for, a placa compilou de novo NA HORA (travada) */
    if (chk.size && sc === scene) { const p0 = chk.get(material); if (p0 !== undefined) { chk.delete(material); const c1 = PR.get(material).currentProgram as { cacheKey?: string } | undefined; if (c1 !== p0) { miss++; const why = 'paralelo≠usado: ' + (c1?.cacheKey && (p0 as { cacheKey?: string }).cacheKey ? difere((p0 as { cacheKey: string }).cacheKey, c1.cacheKey) : '?'); const m = motivos.get(why) ?? { n: 0, ex: `${material.type} em ${object.type}${object.name ? ' "' + object.name + '"' : ''} camada ${object.layers.mask} lado ${material.side}${material.transparent ? ' transparente' : ''}` }; m.n++; motivos.set(why, m); } } }
  };
  let busy = false;
  /** depois do quadro: manda compilar em paralelo o que ficou esperando */
  function flush() { if (!on || livre || busy || !pend.size) return; busy = true; const L = [...pend.values()]; pend.clear();
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
    /* 12/11 (/travadas do Erling: UM desenho de 3.621 ms, "nada novo", de um material que o portão dava como pronto). O compileAsync do three.js só espera
       o ÚLTIMO programa de cada material. Quando o mesmo material serve a duas variações (parede e corpo, com e sem sombra, duas faces), o primeiro programa
       podia ainda estar sendo montado pela placa quando o portão liberava o desenho, e o desenho esperava parado. Agora o portão espera TODOS os programas
       que nasceram nesta leva ficarem prontos, um por um, antes de liberar qualquer peça dela. */
    const novos = ((renderer.info.programs ?? []) as unknown as { isReady?(): boolean }[]).filter((q) => !vistos.has(q)), tEsp = performance.now();
    const todos = new Promise<void>((res) => { const tick = () => { let ok = true; for (const q of novos) { try { if (q.isReady && !q.isReady()) { ok = false; break; } } catch { /* programa já solto */ } } if (ok || performance.now() - tEsp > 30000) { espera = Math.max(espera, performance.now() - tEsp); res(); } else setTimeout(tick, 15); }; tick(); });
    const p = Promise.all([...ps, todos]);
    const fim = () => { for (const q of L) { let set = ready.get(q.m); if (!set) ready.set(q.m, set = new Set()); set.add(q.v); done++; const cp = PR.get(q.m).currentProgram; if (cp) chk.set(q.m, cp); } anota(); busy = false; };
    p.then(fim, fim); }
  let err = '', espera = 0;
  return { enable() { on = true; anota(); }, flush, mapa, mapaLentos, stats: () => `${livre ? (off ? 'PORTÃO DESLIGADO (?portao=0) · ' : 'sem compilação paralela nesta placa · ') : ''}${done} programas compilados sem travar · ${held} desenhos adiados · ${miss} recompilados na hora · ${naHora} compilados NA HORA (com o jogo parado) · ${(renderer.info.programs ?? []).length} programas na placa · maior espera de uma leva ${Math.round(espera)} ms · na fila ${pend.size}${busy ? ' (compilando)' : ''}${err ? ' · erro: ' + err : ''}` };
}

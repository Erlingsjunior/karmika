/* WEBGPU COM RESGUARDO DE WEBGL (03/11, Erling: "foque totalmente em WebGPU com resguardo de WebGL para rodar em todos os PCs e com qualidade").
   Este arquivo é leve e não carrega o WebGPU: ele só ANOTA nos materiais o que cada efeito feito em GLSL precisa (corte de visão, vento,
   texturas do chão, pele do vampiro…). No WebGL nada muda (o onBeforeCompile continua). No WebGPU, gpu/impl.ts lê estas anotações e monta
   o mesmo efeito em nós (TSL), que o WebGPU entende. */
const TAGS = new WeakMap<object, Record<string, unknown>>();
/** o renderizador do jogo é WebGPU? (decidido na abertura, antes de o mundo ser montado) */
export const gpuState = { on: false, backend: 'webgl' as 'webgl' | 'webgpu', why: '', errs: 0 };
export function gpuTag<T extends object>(m: T, key: string, data: unknown = true): T { let r = TAGS.get(m); if (!r) TAGS.set(m, (r = {})); r[key] = data; return m; }
export const gpuTagsOf = (m: object) => TAGS.get(m);
export function gpuUntag(m: object, key: string) { const r = TAGS.get(m); if (r) delete r[key]; }
/** o que o WebGPU troca inteiro (objetos que o WebGPU desenha de outro jeito, como as partículas: no WebGPU o ponto tem 1 pixel) */
export const gpuHooks: { particles?: (geo: import('three').BufferGeometry, u: Record<string, { value: unknown }>, n: number) => import('three').Object3D } = {};
/** preferência do jogador: 0 Automático · 1 WebGPU · 2 WebGL (vale ao reabrir o jogo) */
export const REND_NAMES = ['Automático', 'WebGPU', 'WebGL'];

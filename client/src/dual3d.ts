import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

/**
 * Renderização em duas resoluções (estilo "pixel art 3D"):
 *  - camada 0 (cenário: terreno, grama, casas, árvores) desenhada em um alvo com METADE da resolução → pixels grandes, cenário "cheio" barato;
 *  - camada 1 (herói, NPCs, monstros, partículas e efeitos) desenhada por cima na resolução cheia → pixels finos, mais detalhe.
 * A composição respeita a profundidade: o cenário é copiado com cor E profundidade (gl_FragDepth) para o alvo final, então um
 * personagem atrás de uma casa continua escondido por ela. O mapa de sombras é calculado UMA vez por quadro e reaproveitado.
 */
export const LAYER_WORLD = 0, LAYER_FINE = 1;
/** luz pontual real (as fixas copiam dela; ela mesma fica na camada escondida — luzes-fixas.ts) */
const realPoint = (o: THREE.Object3D) => !!(o as THREE.PointLight).isPointLight && !o.userData.fixedLight && !o.userData.gpuPool;
export function fine(o: THREE.Object3D) { o.traverse((c) => { if ((c as THREE.Light).isLight) { if (!realPoint(c)) c.layers.enableAll(); } else c.layers.set(LAYER_FINE); }); return o; }

export class DualRenderPass extends Pass {
  rt: THREE.WebGLRenderTarget;
  quad: FullScreenQuad;
  mat: THREE.ShaderMaterial;
  /** medidor (main /perf): tempo de cada etapa */ static timer: ((k: string, ms: number) => void) | null = null;
  private tick = 0; private onlyW = new Set<THREE.Object3D>(); private onlyF = new Set<THREE.Object3D>();
  /* 11/11 (desempenho, Erling: "PCs fracos têm que poder jogar com muita qualidade"): o three.js visitava, nas duas passadas e na da sombra, os mais de
     10 mil objetos carregados em volta, mesmo os que estão fora da tela. Agora cada peça parada do cenário (casa, poste, banca, árvore: o que é só
     malha comum) tem a sua esfera guardada; antes de desenhar, a peça inteira que está fora da vista (com 35 m de folga, por causa da sombra) é
     escondida, e volta logo depois do quadro. Quem se mexe (personagens, bichos, efeitos, instâncias) nunca entra nisso. */
  private cullC = new WeakMap<THREE.Object3D, { s: THREE.Sphere | null; next: number; x: number; y: number; z: number; dyn: number }>(); private culled: THREE.Object3D[] = [];
  private frustum = new THREE.Frustum(); private pm = new THREE.Matrix4(); private box = new THREE.Box3(); private sph = new THREE.Sphere(); private cullBudget = 0;
  /** quantas peças ficaram de fora no último quadro (para o /travadas) */ static culledLast = 0; static cullOn = !/[?&]corte=0/.test(typeof location !== 'undefined' ? location.search : '');
  private cullUnit(r: THREE.Object3D) { if (!r.visible || (r as THREE.Light).isLight || (r as THREE.Camera).isCamera) return;
    const f = this.tick; let c = this.cullC.get(r);
    if (!c || f >= c.next) { if (this.cullBudget <= 0) { if (!c) return; } else { this.cullBudget--;
        let ok = true, n = 0; r.traverse((o) => { n++; const m = o as THREE.Mesh & { isSkinnedMesh?: boolean; isInstancedMesh?: boolean; isBatchedMesh?: boolean }; if (m.isSkinnedMesh || m.isInstancedMesh || m.isBatchedMesh || (o as THREE.Points).isPoints || (o as THREE.Sprite).isSprite || (o as THREE.Line).isLine || o.userData.noCull) ok = false; });
        let s: THREE.Sphere | null = null; if (ok && n > 0) { this.box.setFromObject(r); if (!this.box.isEmpty()) s = this.box.getBoundingSphere(new THREE.Sphere()); }
        const moved = !!c && (c.x !== r.position.x || c.y !== r.position.y || c.z !== r.position.z);
        c = { s, next: f + 200 + (r.id % 97), x: r.position.x, y: r.position.y, z: r.position.z, dyn: moved ? f + 600 : (c?.dyn ?? 0) }; this.cullC.set(r, c); } }
    if (!c.s) return; if (c.x !== r.position.x || c.y !== r.position.y || c.z !== r.position.z) { c.dyn = f + 600; c.next = Math.min(c.next, f + 30); return; } if (c.dyn > f) return;
    this.sph.copy(c.s); this.sph.radius += 35; if (!this.frustum.intersectsSphere(this.sph)) { r.visible = false; this.culled.push(r); } }
  /** planos de corte da camada fina (a água corta herói, NPCs e bichos na linha d'água) — só valem na cena clipFor */
  fineClip: THREE.Plane[] = []; clipFor: THREE.Scene | null = null;
  constructor(private scene: THREE.Scene, private camera: THREE.Camera, w: number, h: number, public ratio = 2) {
    super(); this.needsSwap = false; // como o RenderPass: desenha no readBuffer
    const dt = new THREE.DepthTexture(1, 1); dt.type = THREE.UnsignedIntType; dt.minFilter = dt.magFilter = THREE.NearestFilter;
    this.rt = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthTexture: dt, depthBuffer: true, stencilBuffer: false });
    this.mat = new THREE.ShaderMaterial({
      depthTest: true, depthWrite: true,
      uniforms: { tCol: { value: this.rt.texture }, tDep: { value: dt } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `uniform sampler2D tCol; uniform sampler2D tDep; varying vec2 vUv;
        void main(){ gl_FragColor = texture2D(tCol, vUv); gl_FragDepthEXT = texture2D(tDep, vUv).r; }`,
    });
    this.quad = new FullScreenQuad(this.mat);
    this.setSize(w, h);
  }
  /** troca a cena desenhada (o Limiar usa o mesmo caminho de pixel art do mundo) */
  use(scene: THREE.Scene, camera: THREE.Camera) { this.scene = scene; this.camera = camera; }
  /** a cena e a câmera que estão sendo desenhadas (o WebGPU desenha por fora do composer) */
  cur(): [THREE.Scene, THREE.Camera] { return [this.scene, this.camera]; }
  setSize(w: number, h: number) { this.rt.setSize(Math.max(1, Math.floor(w / this.ratio)), Math.max(1, Math.floor(h / this.ratio))); }
  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    void writeBuffer;
    const cam = this.camera, sm = renderer.shadowMap;
    // luzes precisam existir nas duas camadas (a cada 30 quadros, caso novas luzes tenham sido criadas)
    /* 26/10 (desempenho, Erling: "não tem por que não rodar a mais de 200 fps numa 3080 Ti"): a cena é desenhada DUAS vezes por quadro
       (cenário e depois personagens). O three.js percorria os ~8 mil objetos visíveis nas duas passadas, mesmo quando um galho inteiro
       não tinha nada daquela camada. Agora cada raiz da cena sabe quais camadas contém, e a passada esconde as raízes que não lhe dizem
       respeito: o cenário (milhares de objetos) some da passada fina, e os personagens somem da passada do cenário. */
    if ((this.tick % 30) === 0) { this.onlyW.clear(); this.onlyF.clear(); const W = 1 << LAYER_WORLD, F = 1 << LAYER_FINE;
      for (const r of this.scene.children) { let m = 0, cs = false; r.traverse((o) => { if (!(o as THREE.Light).isLight) { m |= o.layers.mask; if (o.castShadow && (o as THREE.Mesh).isMesh) cs = true; } }); if ((m & F) && !(m & W) && !cs) this.onlyF.add(r); /* quem projeta sombra fica: o mapa de sombra é desenhado na passada do cenário */ else if ((m & W) && !(m & F)) this.onlyW.add(r); } }
    if ((this.tick++ % 30) === 0) this.scene.traverse((o) => { if ((o as THREE.Light).isLight) { if (!realPoint(o)) o.layers.enableAll(); const l = o as THREE.DirectionalLight; if (l.shadow && l.shadow.camera) l.shadow.camera.layers.enableAll(); } });
    const autoSM = sm.autoUpdate; sm.autoUpdate = false; sm.needsUpdate = true; // sombras: 1× por quadro
    /* 11/11 (desempenho): a cena é desenhada duas vezes por quadro, e cada desenho refazia a matriz de TODOS os objetos (mais de 20 mil). Nada se mexe
       entre uma passada e a outra: as matrizes são atualizadas uma vez só, aqui, e as duas passadas reaproveitam. */
    const mwa = this.scene.matrixWorldAutoUpdate; if (mwa) { this.scene.updateMatrixWorld(); this.scene.matrixWorldAutoUpdate = false; }
    if (DualRenderPass.cullOn) { cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert(); this.pm.multiplyMatrices((cam as THREE.PerspectiveCamera).projectionMatrix, cam.matrixWorldInverse); this.frustum.setFromProjectionMatrix(this.pm); this.cullBudget = 24; this.culled.length = 0;
      for (const r of this.scene.children) { if (r.children.length >= 12 && !r.name.startsWith('char')) { let big = (r.userData.cullKids as boolean | undefined); if (big === undefined) { let n = 0; r.traverse(() => n++); big = r.userData.cullKids = n > 1200; } if (big) { for (const k of r.children) this.cullUnit(k); continue; } } this.cullUnit(r); }
      DualRenderPass.culledLast = this.culled.length; }
    const oldAC = renderer.autoClear; renderer.autoClear = true;
    // 1) cenário em meia resolução
    cam.layers.set(LAYER_WORLD);
    const hid: THREE.Object3D[] = []; for (const r of this.onlyF) if (r.visible) { r.visible = false; hid.push(r); }
    const t0 = performance.now(); renderer.setRenderTarget(this.rt); renderer.clear(); renderer.render(this.scene, cam); const t1 = performance.now(); DualRenderPass.timer?.('desenho:cenário+sombra', t1 - t0);
    for (const r of hid) r.visible = true; hid.length = 0;
    // 2) copia cor + profundidade para o alvo final (ampliação "nearest": pixels grandes)
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer); renderer.clear();
    this.quad.render(renderer);
    // 3) personagens, monstros e efeitos em resolução cheia, por cima, respeitando a profundidade do cenário
    // (scene.background como cor força um clear mesmo com autoClear=false — por isso ele sai daqui nesta passagem)
    const bg = this.scene.background; this.scene.background = null;
    for (const r of this.onlyW) if (r.visible) { r.visible = false; hid.push(r); }
    cam.layers.set(LAYER_FINE); renderer.autoClear = false; const clip0 = renderer.clippingPlanes; if (this.scene === this.clipFor) renderer.clippingPlanes = this.fineClip; renderer.render(this.scene, cam); renderer.clippingPlanes = clip0;
    for (const r of hid) r.visible = true; DualRenderPass.timer?.('desenho:personagens', performance.now() - t1);
    this.scene.background = bg; cam.layers.enableAll(); renderer.autoClear = oldAC; sm.autoUpdate = autoSM; this.scene.matrixWorldAutoUpdate = mwa; for (const r of this.culled) r.visible = true; this.culled.length = 0;
  }
  dispose() { this.rt.dispose(); this.mat.dispose(); this.quad.dispose(); }
}

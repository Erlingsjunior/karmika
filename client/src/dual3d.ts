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
export function fine(o: THREE.Object3D) { o.traverse((c) => { if ((c as THREE.Light).isLight) c.layers.enableAll(); else c.layers.set(LAYER_FINE); }); return o; }

export class DualRenderPass extends Pass {
  rt: THREE.WebGLRenderTarget;
  quad: FullScreenQuad;
  mat: THREE.ShaderMaterial;
  private tick = 0;
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
  setSize(w: number, h: number) { this.rt.setSize(Math.max(1, Math.floor(w / this.ratio)), Math.max(1, Math.floor(h / this.ratio))); }
  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    void writeBuffer;
    const cam = this.camera, sm = renderer.shadowMap;
    // luzes precisam existir nas duas camadas (a cada 30 quadros, caso novas luzes tenham sido criadas)
    if ((this.tick++ % 30) === 0) this.scene.traverse((o) => { if ((o as THREE.Light).isLight) { o.layers.enableAll(); const l = o as THREE.DirectionalLight; if (l.shadow && l.shadow.camera) l.shadow.camera.layers.enableAll(); } });
    const autoSM = sm.autoUpdate; sm.autoUpdate = false; sm.needsUpdate = true; // sombras: 1× por quadro
    const oldAC = renderer.autoClear; renderer.autoClear = true;
    // 1) cenário em meia resolução
    cam.layers.set(LAYER_WORLD);
    renderer.setRenderTarget(this.rt); renderer.clear(); renderer.render(this.scene, cam);
    // 2) copia cor + profundidade para o alvo final (ampliação "nearest": pixels grandes)
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer); renderer.clear();
    this.quad.render(renderer);
    // 3) personagens, monstros e efeitos em resolução cheia, por cima, respeitando a profundidade do cenário
    // (scene.background como cor força um clear mesmo com autoClear=false — por isso ele sai daqui nesta passagem)
    const bg = this.scene.background; this.scene.background = null;
    cam.layers.set(LAYER_FINE); renderer.autoClear = false; const clip0 = renderer.clippingPlanes; if (this.scene === this.clipFor) renderer.clippingPlanes = this.fineClip; renderer.render(this.scene, cam); renderer.clippingPlanes = clip0;
    this.scene.background = bg; cam.layers.enableAll(); renderer.autoClear = oldAC; sm.autoUpdate = autoSM;
  }
  dispose() { this.rt.dispose(); this.mat.dispose(); this.quad.dispose(); }
}

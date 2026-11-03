/* o "three" do jogo (vite.config.ts): o three.js das fontes, numa cópia só para o WebGL e o WebGPU. Os nós do WebGPU que vêm dos
   exemplos (o brilho, BloomNode) pedem ao "three" o PostProcessingUtils, que só o pacote WebGPU exporta: ele entra aqui. */
export * from 'three/src/Three.js';
import * as PostProcessingUtils from 'three/src/renderers/common/PostProcessingUtils.js';
export { PostProcessingUtils };

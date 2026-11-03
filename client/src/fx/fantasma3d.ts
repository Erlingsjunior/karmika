/* O fantasma (alma) do herói e dos segredos: boneco com shader de brilho na borda. Saiu do main.ts (02/11). */
import * as THREE from 'three';
import { gpuTag } from '../gpu/tags';
import { createCharacter } from '../characters';
import { fine } from '../dual3d';
export const GHOST_VS = `varying vec3 vN; varying vec3 vV; varying float vY; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vY = wp.y; vN = normalize(normalMatrix * normal); vec4 mv = viewMatrix * wp; vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
export const GHOST_FS = `uniform vec3 uC; uniform float uA; uniform float uT; uniform float uBase; varying vec3 vN; varying vec3 vV; varying float vY; void main() { float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2); float feet = smoothstep(uBase - 0.05, uBase + 0.85, vY); float fl = 0.86 + 0.14 * sin(uT * 6.0 + vY * 7.0); float a = (0.07 + 0.8 * rim) * feet * fl * uA; gl_FragColor = vec4(uC * (0.55 + 1.3 * rim), a); }`;
export function makeGhost(opts: { cloth?: number; hair?: number; col?: number; hairStyle?: 'braid' | 'long' | 'short' | 'bald' } = {}) {
  const ch = createCharacter('nordic', { civil: 'human', cloth: opts.cloth ?? 0xc8e0ff, hair: opts.hair ?? 0xe8f0ff, skin: 0xe0ecff, hairStyle: opts.hairStyle ?? 'long', static: true });
  const mat = new THREE.ShaderMaterial({ vertexShader: GHOST_VS, fragmentShader: GHOST_FS, uniforms: { uC: { value: new THREE.Color(opts.col ?? 0x9affd8) }, uA: { value: 0 }, uT: { value: 0 }, uBase: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  gpuTag(mat, 'ghost', mat.uniforms);
  ch.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.material = mat; m.castShadow = false; m.receiveShadow = false; } });
  const glow = new THREE.PointLight(opts.col ?? 0x9affd8, 0, 7); glow.position.y = 1.3; ch.root.add(glow);
  const root = fine(ch.root);
  return { root, set(alpha: number, t: number) { mat.uniforms.uA.value = alpha; mat.uniforms.uT.value = t; mat.uniforms.uBase.value = root.position.y; glow.intensity = 1.6 * alpha; root.rotation.z = Math.sin(t * 0.7) * 0.03; } };
}

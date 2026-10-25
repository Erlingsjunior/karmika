import * as THREE from 'three';
import { radialTexture } from './fx3d';

/** Raios de luz volumétricos (god rays) que descem diagonalmente, estilo Eitr/Hades. */
export class LightShafts {
  readonly group = new THREE.Group();
  private items: { m: THREE.Mesh; mat: THREE.ShaderMaterial; seed: number; sx: number }[] = [];
  constructor(n = 9) {
    for (let i = 0; i < n; i++) {
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
        uniforms: { uT: { value: 0 }, uC: { value: new THREE.Color(0x8fa8ff) }, uI: { value: 0.3 }, uS: { value: i * 7.3 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: `uniform float uT; uniform vec3 uC; uniform float uI; uniform float uS; varying vec2 vUv;
          void main(){
            float y = vUv.y;
            float a = smoothstep(0.0, 0.12, y) * (1.0 - smoothstep(0.45, 1.0, y));
            float across = 1.0 - abs(vUv.x - 0.5) * 2.0;
            a *= pow(max(across, 0.0), 1.6);
            float n = 0.6 + 0.4 * sin(vUv.y * 7.0 + uT * 0.35 + uS) * sin(vUv.x * 9.0 - uT * 0.22 + uS * 1.7);
            float f = 0.85 + 0.15 * sin(uT * 0.9 + uS);
            a *= n * f * uI;
            gl_FragColor = vec4(uC * a, a);
          }`,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      m.frustumCulled = false; m.renderOrder = 5;
      this.items.push({ m, mat, seed: i, sx: 2.4 + (i % 4) * 0.9 });
      this.group.add(m);
    }
  }
  update(t: number, hero: THREE.Vector3, lightDir: THREE.Vector3, camPos: THREE.Vector3, color: THREE.Color, intensity: number) {
    const up = lightDir.clone().negate().normalize(); // do chão em direção à fonte de luz
    const H = 22;
    this.items.forEach((it, i) => {
      if (!it.m.userData.p) { const a = i * 2.4 + 0.5, d = 5 + (i * 37 % 14); it.m.userData.p = new THREE.Vector3(hero.x + Math.cos(a) * d, 0, hero.z + Math.sin(a) * d); }
      const p = it.m.userData.p as THREE.Vector3;
      p.x += Math.sin(t * 0.07 + i) * 0.003; // deriva lenta
      if (Math.hypot(p.x - hero.x, p.z - hero.z) > 21) { p.x = hero.x - (p.x - hero.x) * 0.92; p.z = hero.z - (p.z - hero.z) * 0.92; }
      const center = p.clone().addScaledVector(up, H / 2 - 1);
      const toCam = camPos.clone().sub(center);
      const z = toCam.sub(up.clone().multiplyScalar(toCam.dot(up))).normalize();
      const x = new THREE.Vector3().crossVectors(up, z).normalize();
      it.m.matrix.makeBasis(x.multiplyScalar(it.sx), up.clone().multiplyScalar(H), z).setPosition(center);
      it.m.matrixAutoUpdate = false; it.m.matrixWorldNeedsUpdate = true;
      it.mat.uniforms.uT.value = t; it.mat.uniforms.uC.value.copy(color); it.mat.uniforms.uI.value = intensity;
    });
  }
}

/** Halo luminoso suave em volta de chamas e lanternas. */
export function makeHalo(scale: number, color = 0xffa850) {
  const map = radialTexture(128, [[0, 'rgba(255,200,120,.9)'], [0.25, 'rgba(255,150,60,.35)'], [1, 'rgba(255,100,20,0)']]);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.4, fog: false }));
  s.scale.set(scale, scale, 1);
  return s;
}

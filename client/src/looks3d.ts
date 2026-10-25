import * as THREE from 'three';
import { radialTexture } from './fx3d';

/* =====================================================================================================
   APARÊNCIA DO CAMINHO (25/10/2026) — Erling: "e o vampiro, como você fez ele?"
   O vampiro formado continua com o corpo do modelo do artista, mas a pele empalidece (cinza-lilás, sem o sangue
   quente por baixo), os olhos acendem em brasa vermelha e, à noite, uma névoa rubra rasteja nos pés.
   O tom é trocado só onde a textura é pele (tom quente e claro); couro, metal e pano ficam como estão.
   ===================================================================================================== */

function paleMat(m: THREE.Material, PALE: { value: number }) {
  const mm = m as THREE.MeshToonMaterial;
  const prev = mm.onBeforeCompile;
  mm.onBeforeCompile = (sh, r) => {
    prev?.call(mm, sh, r);
    sh.uniforms.uVamp = PALE;
    sh.fragmentShader = 'uniform float uVamp;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      { vec3 c = diffuseColor.rgb; float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)); float sat = (mx - mn) / max(mx, 1e-3);
        float warm = step(c.g, c.r) * smoothstep(0.02, 0.07, c.r - c.b) * smoothstep(0.55, 0.75, (c.r - c.g) / max(c.r - c.b, 1e-3)); // pele: rosada (o vermelho sobra, verde e azul juntos); bege, couro e linho não
        float skin = warm * smoothstep(0.1, 0.2, mx) * (1.0 - smoothstep(0.7, 0.88, sat)); // espaço linear: a pele do modelo fica entre 0,15 e 0,35
        float l = dot(c, vec3(0.32, 0.5, 0.18));
        vec3 pale = vec3(0.86, 0.84, 0.93) * clamp(l * 1.7 + 0.06, 0.0, 1.0);
        diffuseColor.rgb = mix(c, pale, skin * uVamp); }`);
  };
  mm.needsUpdate = true;
}

export interface Look { tick(dt: number, night: number): void; dispose(): void }
/** liga o visual de vampiro no modelo do artista (ou no boneco procedural, se não houver modelo) */
export function vampireLook(root: THREE.Object3D, model: THREE.Object3D | null): Look {
  const target = model ?? root;
  const U: { value: number }[] = [];
  const one = (x: THREE.Material) => { if (x.userData.pale) { x.userData.pale.value = 1; U.push(x.userData.pale); return x; } const c = x.clone(); const P = { value: 1 }; c.userData = { ...c.userData, pale: P }; paleMat(c, P); U.push(P); return c; };
  target.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || o.userData.lookFx) return; m.material = Array.isArray(m.material) ? m.material.map(one) : one(m.material); });
  const head = (model?.getObjectByName('mixamorigHead') ?? null) as THREE.Object3D | null;
  const tex = radialTexture(32, [[0, 'rgba(255,240,230,1)'], [0.3, 'rgba(255,40,50,.9)'], [1, 'rgba(160,0,20,0)']]);
  const eyes = [-1, 1].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false })); s.scale.setScalar(0.07); s.renderOrder = 9; root.add(s); return s; });
  const mist: THREE.Sprite[] = [];
  const mt = radialTexture(64, [[0, 'rgba(120,10,30,.55)'], [1, 'rgba(40,0,10,0)']]);
  for (let i = 0; i < 5; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, transparent: true, depthWrite: false, fog: false, opacity: 0 })); s.scale.set(1.1, 0.45, 1); root.add(s); mist.push(s); }
  const wp = new THREE.Vector3(), rq = new THREE.Quaternion(); let t = 0;
  return {
    tick(dt, night) { t += dt;
      if (head) { root.updateMatrixWorld(true); head.getWorldPosition(wp); root.worldToLocal(wp); const sc = 1 / Math.max(0.01, root.scale.x); for (let i = 0; i < 2; i++) { const s = eyes[i]; s.position.set(wp.x + (i ? 0.034 : -0.034) * sc, wp.y + 0.07 * sc, wp.z + 0.13 * sc); s.visible = true; } void rq; }
      else for (const s of eyes) s.visible = false;
      const glow = 0.55 + 0.45 * night + 0.1 * Math.sin(t * 3); for (const s of eyes) { (s.material as THREE.SpriteMaterial).opacity = glow; s.scale.setScalar(0.08 + 0.04 * night); }
      for (let i = 0; i < mist.length; i++) { const a = t * 0.4 + i * 1.26, r = 0.35 + 0.15 * Math.sin(t * 0.7 + i); mist[i].position.set(Math.cos(a) * r, 0.18, Math.sin(a) * r); (mist[i].material as THREE.SpriteMaterial).opacity = night * (0.5 + 0.2 * Math.sin(t + i)); }
    },
    dispose() { for (const u of U) u.value = 0; for (const s of [...eyes, ...mist]) root.remove(s); },
  };
}

/* =====================================================================================================
   TECNOCRATA FORMADO (25/10/2026) — Erling: "o tecnocrata precisa melhorar muito". Quem sai da Academia de Ylva
   carrega a Academia no corpo: óculos de latão com lentes que acendem, o reator nas costas (caldeira de latão com
   o núcleo azul pulsando, canos, chaminé que solta vapor), a Manopla de Tesla no antebraço direito (anéis de cobre,
   bobina que brilha e estala), ombreira de engrenagens no ombro esquerdo e, na transformação, o exoesqueleto:
   placas e pistões nas coxas, canelas e braços, e dois propulsores nas costas.
   ===================================================================================================== */
export interface TechLook extends Look { gauntlet(out: THREE.Vector3): THREE.Vector3; setMech(on: boolean): void; charge(k: number): void }
export function technoLook(root: THREE.Object3D, model: THREE.Object3D | null, opts: { fine?: (o: THREE.Object3D) => THREE.Object3D; ramp?: THREE.Texture } = {}): TechLook {
  const tm = (c: number, e = 0) => new THREE.MeshToonMaterial({ color: c, gradientMap: opts.ramp ?? null, emissive: e });
  const brass = tm(0xa8823a), copper = tm(0xa0602e), steel = tm(0x5c6876), dark = tm(0x2a2e36), leather = tm(0x4a3020);
  const glowM = new THREE.MeshBasicMaterial({ color: 0x8af0ff }), lensM = new THREE.MeshBasicMaterial({ color: 0x6ae0ff, transparent: true, opacity: 0.85 });
  const M = (g: THREE.BufferGeometry, m: THREE.Material) => { const o = new THREE.Mesh(g, m); o.castShadow = true; return o; };
  const B = (n: string) => (model?.getObjectByName('mixamorig' + n) ?? null) as THREE.Object3D | null;
  const added: THREE.Object3D[] = []; const mechParts: THREE.Object3D[] = [];
  root.updateMatrixWorld(true); const rs = root.getWorldScale(new THREE.Vector3()).x;
  /** grupo em metros preso a um osso (compensa a escala do modelo) */
  /* as peças ficam presas à raiz (eixos do personagem: +z à frente) e seguem o osso a cada quadro — os eixos dos ossos do
     modelo variam de arquivo para arquivo; os segmentos (manopla, exoesqueleto) apontam o eixo Y do osso até o osso filho */
  const follows: { g: THREE.Group; b: THREE.Object3D; c: THREE.Object3D | null }[] = [];
  const at = (bn: string, fallback: THREE.Object3D, cn?: string) => { const b = B(bn) ?? fallback; const g = new THREE.Group(); root.add(g); added.push(g); follows.push({ g, b, c: cn ? B(cn) : null }); return g; };
  void rs;
  const childLen = (bn: string, cn: string) => { const b = B(bn), c = B(cn); if (!b || !c) return 0.25; const p = b.getWorldPosition(new THREE.Vector3()), q = c.getWorldPosition(new THREE.Vector3()); return p.distanceTo(q) / rs; };
  // óculos na testa
  const head = at('Head', root); head.position.y = 0; const gog = new THREE.Group(); gog.position.set(0, 0.14, 0.07); gog.rotation.x = -0.45; gog.scale.setScalar(1.35); head.add(gog);
  const strap = M(new THREE.TorusGeometry(0.105, 0.012, 6, 24), leather); strap.rotation.x = Math.PI / 2; strap.scale.set(1, 1.15, 1); strap.position.z = -0.07; gog.add(strap);
  const lenses: THREE.Mesh[] = [];
  for (const s of [-1, 1]) { const rim = M(new THREE.CylinderGeometry(0.03, 0.034, 0.03, 14), brass); rim.rotation.x = Math.PI / 2; rim.position.set(s * 0.036, 0, 0.03); gog.add(rim); const ln = new THREE.Mesh(new THREE.CircleGeometry(0.024, 14), lensM.clone()); ln.position.set(s * 0.036, 0, 0.046); gog.add(ln); lenses.push(ln); }
  const brg = M(new THREE.TorusGeometry(0.014, 0.005, 4, 8, Math.PI), brass); brg.position.set(0, 0.006, 0.038); gog.add(brg);
  // reator nas costas
  const back = at('Spine2', root); const pack = new THREE.Group(); pack.position.set(0, 0.16, -0.21); pack.scale.setScalar(1.35); back.add(pack);
  const boil = M(new THREE.CapsuleGeometry(0.085, 0.2, 6, 14), brass); pack.add(boil);
  for (const y of [-0.08, 0.0, 0.08]) { const band = M(new THREE.TorusGeometry(0.088, 0.01, 6, 18), copper); band.rotation.x = Math.PI / 2; band.position.y = y; pack.add(band); }
  const coreW = M(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 16), steel); coreW.rotation.x = Math.PI / 2; coreW.position.set(0, 0.03, -0.085); pack.add(coreW);
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), glowM.clone()); core.position.set(0, 0.03, -0.092); core.rotation.y = Math.PI; pack.add(core);
  const tankWins: THREE.Mesh[] = [];
  for (const sx of [-1, 1]) { const tk = M(new THREE.CapsuleGeometry(0.045, 0.16, 5, 12), copper); tk.position.set(sx * 0.12, 0.02, 0.0); pack.add(tk); const cap = M(new THREE.SphereGeometry(0.03, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), brass); cap.position.set(sx * 0.12, 0.15, 0); pack.add(cap);
    const win = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.1, 10, 1, true), glowM.clone()); win.position.set(sx * 0.12, 0.02, 0); win.scale.set(1.02, 1, 1.02); pack.add(win); tankWins.push(win); }
  const topCore = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), glowM.clone()); topCore.position.set(0, 0.2, 0); pack.add(topCore);
  const topRing = M(new THREE.TorusGeometry(0.055, 0.012, 6, 18), brass); topRing.rotation.x = Math.PI / 2; topRing.position.set(0, 0.19, 0); pack.add(topRing);
  const chim = M(new THREE.CylinderGeometry(0.02, 0.025, 0.16, 8), dark); chim.position.set(0.06, 0.2, -0.02); pack.add(chim); const chimTop = new THREE.Object3D(); chimTop.position.set(0.06, 0.29, -0.02); pack.add(chimTop);
  for (const s of [-1, 1]) { const pipe = M(new THREE.TorusGeometry(0.09, 0.012, 6, 14, Math.PI * 0.8), copper); pipe.position.set(s * 0.09, 0.02, 0.04); pipe.rotation.set(0, Math.PI / 2, s * 0.5); pack.add(pipe); }
  for (const s of [-1, 1]) { const st = M(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6), leather); st.position.set(s * 0.1, 0.0, 0.09); st.rotation.x = 0.1; pack.add(st); }
  // manopla de Tesla no antebraço direito
  const fa = at('RightForeArm', root, 'RightHand'); const L = childLen('RightForeArm', 'RightHand'); const gaunt = new THREE.Group(); gaunt.position.y = L * 0.55 / Math.max(1e-6, fa.scale.x) * fa.scale.x; fa.add(gaunt);
  gaunt.position.set(0, L * 0.55, 0);
  const sleeve = M(new THREE.CylinderGeometry(0.05, 0.045, L * 0.7, 12, 1, true), dark); (sleeve.material as THREE.Material).side = THREE.DoubleSide; gaunt.add(sleeve);
  const coils: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) { const r = M(new THREE.TorusGeometry(0.056, 0.011, 6, 16), copper); r.rotation.x = Math.PI / 2; r.position.y = -L * 0.28 + i * L * 0.14; gaunt.add(r); coils.push(r); }
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), glowM.clone()); bulb.position.set(0.05, 0, 0.0); gaunt.add(bulb);
  const gTip = new THREE.Object3D(); gTip.position.set(0, L * 0.45, 0); gaunt.add(gTip);
  // ombreira de engrenagens no ombro esquerdo
  const sh = at('LeftArm', root); sh.scale.setScalar(1.45); const shSide = (() => { const b = B('LeftArm'); if (!b) return 1; const w = b.getWorldPosition(new THREE.Vector3()); root.worldToLocal(w); return Math.sign(w.x) || 1; })(); const pad = M(new THREE.SphereGeometry(0.085, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), steel); pad.scale.set(1, 0.55, 1.1); pad.position.set(shSide * 0.02, 0.03, 0); pad.rotation.z = -shSide * 0.45; sh.add(pad);
  const gear = (r: number, t: number) => { const g = new THREE.Group(); g.add(M(new THREE.CylinderGeometry(r, r, t, 16), brass)); for (let i = 0; i < 10; i++) { const tooth = M(new THREE.BoxGeometry(r * 0.3, t, r * 0.28), brass); const a = i / 10 * Math.PI * 2; tooth.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); tooth.rotation.y = -a; g.add(tooth); } return g; };
  const g1 = gear(0.045, 0.015); g1.rotation.z = Math.PI / 2; g1.position.set(shSide * 0.075, 0.03, 0.0); sh.add(g1);
  // exoesqueleto (só na transformação)
  const exo = (bn: string, cn: string, r: number) => { const g = at(bn, root, cn); const l = childLen(bn, cn); const p = M(new THREE.CylinderGeometry(r, r * 0.85, l * 0.8, 10, 1, true), steel); (p.material as THREE.Material).side = THREE.DoubleSide; p.position.y = l * 0.5; g.add(p); const rod = M(new THREE.CylinderGeometry(0.012, 0.012, l * 0.9, 6), brass); rod.position.set(r + 0.01, l * 0.5, 0); g.add(rod); const pis = M(new THREE.CylinderGeometry(0.02, 0.02, l * 0.35, 8), copper); pis.position.set(r + 0.01, l * 0.25, 0); g.add(pis); g.visible = false; mechParts.push(g); };
  exo('LeftUpLeg', 'LeftLeg', 0.085); exo('RightUpLeg', 'RightLeg', 0.085); exo('LeftLeg', 'LeftFoot', 0.065); exo('RightLeg', 'RightFoot', 0.065); exo('LeftArm', 'LeftForeArm', 0.062); exo('RightArm', 'RightForeArm', 0.062); exo('LeftForeArm', 'LeftHand', 0.055);
  { const g = at('Spine2', root); for (const s of [-1, 1]) { const th = M(new THREE.CylinderGeometry(0.05, 0.07, 0.24, 12), dark); th.position.set(s * 0.15, -0.02, -0.2); g.add(th); const fl = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0x8af0ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })); fl.rotation.x = Math.PI; fl.position.set(s * 0.15, -0.25, -0.2); g.add(fl); } g.visible = false; mechParts.push(g); }
  const beads: THREE.Mesh[] = []; for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), glowM.clone()); root.add(b); beads.push(b); added.push(b); }
  const pA = new THREE.Vector3(), pB = new THREE.Vector3(), pC = new THREE.Vector3(), cableFrom = new THREE.Object3D(); cableFrom.position.set(0.12, 0.1, 0.02); pack.add(cableFrom);
  for (const a of added) opts.fine?.(a);
  let t = 0, chg = 0, steamT = 0; const wp = new THREE.Vector3(), wq = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  const steam: { s: THREE.Sprite; t: number; v: THREE.Vector3 }[] = []; const stTex = radialTexture(32, [[0, 'rgba(235,240,245,.7)'], [1, 'rgba(200,210,220,0)']]);
  return {
    tick(dt, night) { t += dt; chg = Math.max(0, chg - dt * 0.3);
      root.updateMatrixWorld(true); for (const f of follows) { f.b.getWorldPosition(wp); root.worldToLocal(wp); f.g.position.copy(wp); if (f.c) { f.c.getWorldPosition(wq); root.worldToLocal(wq); wq.sub(wp); if (wq.lengthSq() > 1e-8) f.g.quaternion.setFromUnitVectors(Y, wq.normalize()); } }
      const pulse = 0.65 + 0.35 * Math.sin(t * 4); (core.material as THREE.MeshBasicMaterial).color.setRGB(0.4 * pulse, 0.85 * pulse + 0.1, 1);
      (bulb.material as THREE.MeshBasicMaterial).color.setRGB(0.5 + chg * 0.5, 0.9, 1); bulb.scale.setScalar(1 + chg * 0.6 + Math.random() * 0.15 * chg);
      for (let i = 0; i < coils.length; i++) { const m = coils[i].material as THREE.MeshToonMaterial; m.emissive.setRGB(0.1 * chg + 0.05 * Math.max(0, Math.sin(t * 6 - i)), 0.35 * chg + 0.05, 0.5 * chg + 0.08); }
      { cableFrom.getWorldPosition(pA); gTip.getWorldPosition(pB); root.worldToLocal(pA); root.worldToLocal(pB); pC.copy(pA).lerp(pB, 0.5); pC.y += 0.12; pC.z -= 0.08;
        for (let i = 0; i < beads.length; i++) { const u = (i + 0.5) / beads.length, a1 = (1 - u) * (1 - u), b1 = 2 * u * (1 - u), c1 = u * u; beads[i].position.set(pA.x * a1 + pC.x * b1 + pB.x * c1, pA.y * a1 + pC.y * b1 + pB.y * c1, pA.z * a1 + pC.z * b1 + pB.z * c1); const fl = 0.5 + 0.5 * Math.sin(t * 9 - i * 0.9); (beads[i].material as THREE.MeshBasicMaterial).color.setRGB(0.25 + 0.4 * fl * (0.4 + chg), 0.6 + 0.4 * fl, 1); beads[i].scale.setScalar(0.8 + 0.5 * fl * (0.5 + chg)); } }
      (topCore.material as THREE.MeshBasicMaterial).color.setRGB(0.4 * pulse, 0.85 * pulse + 0.1, 1); topCore.scale.setScalar(0.9 + 0.25 * pulse);
      for (const w of tankWins) (w.material as THREE.MeshBasicMaterial).color.setRGB(0.3, 0.75 + 0.25 * pulse, 1);
      for (const ln of lenses) (ln.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.4 * night;
      steamT -= dt; if (steamT <= 0) { steamT = 0.35 + Math.random() * 0.4; chimTop.getWorldPosition(wp); root.worldToLocal(wp); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: stTex, transparent: true, depthWrite: false, opacity: 0.6 })); s.position.copy(wp); s.scale.setScalar(0.12); root.add(s); opts.fine?.(s); steam.push({ s, t: 0, v: new THREE.Vector3((Math.random() - 0.5) * 0.15, 0.55, -0.1) }); }
      for (let i = steam.length - 1; i >= 0; i--) { const q = steam[i]; q.t += dt; q.s.position.addScaledVector(q.v, dt); q.s.scale.setScalar(0.12 + q.t * 0.5); (q.s.material as THREE.SpriteMaterial).opacity = Math.max(0, 0.55 - q.t * 0.45); if (q.t > 1.2) { root.remove(q.s); steam.splice(i, 1); } } },
    dispose() { for (const a of added) a.parent?.remove(a); for (const q of steam) root.remove(q.s); },
    gauntlet(out) { return gTip.getWorldPosition(out); },
    setMech(on) { for (const p of mechParts) p.visible = on; },
    charge(k) { chg = Math.max(chg, k); },
  };
}

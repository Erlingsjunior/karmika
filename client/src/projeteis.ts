/* ---------- PROJÉTEIS COM FÍSICA (02/11/2026, Erling: "as flechas têm que voar até os alvos; armas de longo alcance com física") ----------
   Flecha, flecha longa, virote de besta (de duas e de uma mão), kunai e bala (pistola/metralhadora).
   - Mira assistida: o tiro procura o inimigo mais alinhado à frente (cone de ~26°) dentro do alcance, mira no peito e
     ADIANTA o alvo pela velocidade dele (o bicho correndo leva a flecha).
   - Balística de verdade: velocidade, gravidade e arrasto; o ângulo de saída é calculado para o arco baixo que acerta o
     ponto adiantado (a flecha sobe e cai em arco até o alvo). Sem alvo, sai reta à frente com um leve arco e cai no chão.
   - Colisão varrida (segmento a segmento, sem atravessar alvo em quadro lento): inimigo (cilindro do corpo), chão (altura
     do terreno) e muro (tile 'wall').
   - Flecha/virote/kunai cravam: no chão e no muro ficam presos inclinados pela trajetória e somem devagar; no bicho, presos
     nele por um instante. Bala: rastro de luz, faísca e poeira no impacto. */
import * as THREE from 'three';

export type ShotKind = 'arrow' | 'longarrow' | 'bolt' | 'hbolt' | 'kunai' | 'bullet';
interface Spec { v: number; g: number; drag: number; range: number; len: number; spin: number }
const SPEC: Record<ShotKind, Spec> = {
  arrow: { v: 34, g: 9.8, drag: 0.04, range: 30, len: 0.75, spin: 0 },
  longarrow: { v: 44, g: 9.8, drag: 0.03, range: 40, len: 0.9, spin: 0 },
  bolt: { v: 58, g: 9.8, drag: 0.02, range: 34, len: 0.42, spin: 0 },
  hbolt: { v: 48, g: 9.8, drag: 0.03, range: 24, len: 0.3, spin: 0 },
  kunai: { v: 26, g: 9.8, drag: 0.05, range: 17, len: 0.24, spin: 26 },
  bullet: { v: 115, g: 2.5, drag: 0.0, range: 28, len: 0.9, spin: 0 },
};
export interface ShotTarget { pos: THREE.Vector3; alive: boolean; active: boolean; def: { radius: number; scale?: number }; root?: THREE.Object3D | null }
export interface ShotCtx {
  scene: THREE.Scene;
  heightAt(x: number, z: number): number;
  isWall(x: number, z: number): boolean;
  targets(): ShotTarget[];
  /** um alvo foi atingido; `from` = de onde veio (para o empurrão) */
  hit(e: ShotTarget, s: { mul: number; kind: ShotKind; point: THREE.Vector3; from: THREE.Vector3; data?: unknown }): void;
  /** bonecos de treino (posição e tocar) */
  dummyAt?(x: number, z: number, r: number): { hit(point: THREE.Vector3, mul: number): void } | null;
  spark(p: THREE.Vector3, kind: 'blood' | 'metal' | 'dust' | 'wood', dir?: THREE.Vector3): void;
  sound?(k: 'hit' | 'thud' | 'ric'): void;
}
interface Shot { kind: ShotKind; p: THREE.Vector3; v: THREE.Vector3; life: number; mul: number; m: THREE.Object3D; from: THREE.Vector3; data?: unknown; spinA: number; trailT: number; tracer?: THREE.Mesh }
interface Stuck { m: THREE.Object3D; t: number; host?: THREE.Object3D; loc?: THREE.Vector3; locQ?: THREE.Quaternion }

const mat = (c: number, e = 0) => new THREE.MeshToonMaterial({ color: c, emissive: new THREE.Color(e) });
let M: Record<string, THREE.Material> | null = null; let G: Record<string, THREE.BufferGeometry> | null = null;
function assets() {
  if (M && G) return { M, G };
  M = { shaft: mat(0x8a6a44), dark: mat(0x3a2e24), head: mat(0xc8ccd4, 0x111111), fletchR: new THREE.MeshToonMaterial({ color: 0xb8302a, side: THREE.DoubleSide }), fletchW: new THREE.MeshToonMaterial({ color: 0xe8e0cc, side: THREE.DoubleSide }), steel: mat(0x6a6e78, 0x0a0a0a), cloth: mat(0x6a1a1a),
    tracer: new THREE.MeshBasicMaterial({ color: 0xffe8a0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }) };
  G = { shaft: new THREE.CylinderGeometry(0.009, 0.009, 1, 5).rotateX(Math.PI / 2), head: new THREE.ConeGeometry(0.02, 0.07, 4).rotateX(Math.PI / 2), fl: new THREE.PlaneGeometry(0.035, 0.11).rotateX(Math.PI / 2),
    boltShaft: new THREE.CylinderGeometry(0.012, 0.012, 1, 5).rotateX(Math.PI / 2), boltHead: new THREE.ConeGeometry(0.024, 0.06, 4).rotateX(Math.PI / 2),
    kBlade: new THREE.ConeGeometry(0.022, 0.13, 4).rotateX(Math.PI / 2), kGrip: new THREE.CylinderGeometry(0.008, 0.008, 0.09, 5).rotateX(Math.PI / 2), kRing: new THREE.TorusGeometry(0.018, 0.004, 4, 10),
    tracer: new THREE.CylinderGeometry(0.012, 0.012, 1, 4).rotateX(Math.PI / 2), slug: new THREE.SphereGeometry(0.022, 5, 4) };
  return { M, G };
}
/** a peça visível: +Z local = para onde voa (ponta) */
function build(kind: ShotKind): { m: THREE.Object3D; tracer?: THREE.Mesh } {
  const { M, G } = assets(); const g = new THREE.Group(); const S = SPEC[kind];
  if (kind === 'arrow' || kind === 'longarrow' || kind === 'bolt' || kind === 'hbolt') {
    const bolt = kind === 'bolt' || kind === 'hbolt', L = S.len;
    const sh = new THREE.Mesh(bolt ? G.boltShaft : G.shaft, bolt ? M.dark : M.shaft); sh.scale.z = L; sh.position.z = -L / 2; g.add(sh);
    const hd = new THREE.Mesh(bolt ? G.boltHead : G.head, M.head); hd.position.z = 0.03; g.add(hd);
    for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(G.fl, i === 0 ? M.fletchR : bolt ? M.steel : M.fletchW); f.rotation.z = (i / 3) * Math.PI * 2; f.position.z = -L + 0.08; f.translateY(0.018); if (bolt) f.scale.set(0.8, 0.7, 1); g.add(f); }
  } else if (kind === 'kunai') {
    const bl = new THREE.Mesh(G.kBlade, M.steel); bl.position.z = 0.04; g.add(bl); const gr = new THREE.Mesh(G.kGrip, M.cloth); gr.position.z = -0.07; g.add(gr); const rg = new THREE.Mesh(G.kRing, M.steel); rg.position.z = -0.13; g.add(rg);
  } else { const s = new THREE.Mesh(G.slug, M.head); g.add(s); const tr = new THREE.Mesh(G.tracer, M.tracer); tr.scale.z = S.len; tr.position.z = -S.len / 2; g.add(tr); return { m: g, tracer: tr }; }
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = false; });
  return { m: g };
}

export function createShots(ctx: ShotCtx) {
  const shots: Shot[] = [], stuck: Stuck[] = [];
  const last = new WeakMap<ShotTarget, { p: THREE.Vector3; v: THREE.Vector3 }>(); // velocidade observada de cada alvo (para adiantar a mira)
  const tA = new THREE.Vector3(), tB = new THREE.Vector3(), tQ = new THREE.Quaternion(), FWD = new THREE.Vector3(0, 0, 1);
  /** acompanha a velocidade dos alvos (chamar todo quadro antes de atirar/atualizar) */
  function track(dt: number) { if (dt <= 0) return; for (const e of ctx.targets()) { if (!e.alive) continue; const L = last.get(e); if (!L) { last.set(e, { p: e.pos.clone(), v: new THREE.Vector3() }); continue; } tA.subVectors(e.pos, L.p).divideScalar(dt); if (tA.lengthSq() > 400) tA.set(0, 0, 0); L.v.lerp(tA, Math.min(1, dt * 8)); L.p.copy(e.pos); } }
  const chest = (e: ShotTarget) => e.pos.y + Math.max(0.8, Math.min(1.5, (e.def.radius || 0.5) * 1.6));
  /** o alvo mais alinhado à frente (cone), com nota pela distância */
  function pick(from: THREE.Vector3, yaw: number, range: number): ShotTarget | null {
    let best: ShotTarget | null = null, bs = 1e9; const fx = Math.sin(yaw), fz = Math.cos(yaw);
    for (const e of ctx.targets()) { if (!e.alive || !e.active) continue; const dx = e.pos.x - from.x, dz = e.pos.z - from.z, d = Math.hypot(dx, dz); if (d > range + e.def.radius || d < 0.3) continue;
      const cos = (dx * fx + dz * fz) / d; const lim = Math.cos(0.46 + Math.min(0.5, 0.9 / d)); if (cos < lim) continue; const sc = d * (1.6 - cos); if (sc < bs) { bs = sc; best = e; } }
    return best;
  }
  /** ângulo de saída do arco baixo que leva do ponto ao alvo (null = fora de alcance) */
  function launchAngle(v: number, g: number, x: number, y: number): number | null { if (g < 1e-3) return Math.atan2(y, x); const v2 = v * v, disc = v2 * v2 - g * (g * x * x + 2 * y * v2); if (disc < 0) return null; return Math.atan((v2 - Math.sqrt(disc)) / (g * x)); }
  /** dispara; devolve o alvo escolhido (ou null). `spread` = desvio aleatório em radianos */
  function fire(kind: ShotKind, from: THREE.Vector3, yaw: number, o: { mul: number; spread?: number; data?: unknown; speedK?: number } = { mul: 1 }): ShotTarget | null {
    const S = SPEC[kind], v = S.v * (o.speedK ?? 1); const tgt = pick(from, yaw, S.range); let dir: THREE.Vector3;
    if (tgt) { const aim = new THREE.Vector3(tgt.pos.x, chest(tgt), tgt.pos.z); const L = last.get(tgt); let t = aim.distanceTo(from) / v;
      for (let it = 0; it < 2 && L; it++) { aim.set(tgt.pos.x + L.v.x * t, chest(tgt) + L.v.y * t * 0.5, tgt.pos.z + L.v.z * t); t = aim.distanceTo(from) / v; } // adianta o alvo
      const dx = aim.x - from.x, dz = aim.z - from.z, x = Math.hypot(dx, dz), y = aim.y - from.y; const th = launchAngle(v, S.g, x, y) ?? Math.PI / 4; const hy = Math.atan2(dx, dz);
      dir = new THREE.Vector3(Math.sin(hy) * Math.cos(th), Math.sin(th), Math.cos(hy) * Math.cos(th));
    } else dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(0.04), Math.sin(0.04), Math.cos(yaw) * Math.cos(0.04));
    const sp = o.spread ?? 0; if (sp > 0) { dir.x += (Math.random() - 0.5) * 2 * sp; dir.y += (Math.random() - 0.5) * sp; dir.z += (Math.random() - 0.5) * 2 * sp; dir.normalize(); }
    const b = build(kind); b.m.position.copy(from); ctx.scene.add(b.m);
    shots.push({ kind, p: from.clone(), v: dir.multiplyScalar(v), life: kind === 'bullet' ? 0.6 : 3.2, mul: o.mul, m: b.m, from: from.clone(), data: o.data, spinA: 0, trailT: 0, tracer: b.tracer });
    return tgt;
  }
  /** flecha que sai de `from` e cai exatamente em `to` depois de `t` segundos (chuva de flechas, tiro para o alto) */
  function lob(kind: ShotKind, from: THREE.Vector3, to: THREE.Vector3, t: number, o: { mul: number; data?: unknown }) {
    const S = SPEC[kind]; const v = new THREE.Vector3().subVectors(to, from).divideScalar(t); v.y += 0.5 * S.g * t; // sem arrasto: chega no ponto
    const b = build(kind); b.m.position.copy(from); ctx.scene.add(b.m); const sh: Shot = { kind, p: from.clone(), v, life: t + 1.5, mul: o.mul, m: b.m, from: from.clone(), data: o.data, spinA: 0, trailT: 0, tracer: b.tracer };
    (sh as Shot & { noDrag?: boolean }).noDrag = true; shots.push(sh); }
  function stick(s: Shot, host?: THREE.Object3D | null) {
    const S = SPEC[s.kind]; const m = s.m; m.position.copy(s.p).addScaledVector(tA.copy(s.v).normalize(), S.len * 0.25); // crava ~1/4 do comprimento
    if (host) { host.updateWorldMatrix(true, false); const inv = new THREE.Matrix4().copy(host.matrixWorld).invert(); const loc = m.position.clone().applyMatrix4(inv); const q = host.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(m.quaternion);
      stuck.push({ m, t: 1.6, host, loc, locQ: q }); } else stuck.push({ m, t: 6 });
    while (stuck.length > 70) { const o = stuck.shift()!; ctx.scene.remove(o.m); }
  }
  function update(dt: number) {
    track(dt);
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i], S = SPEC[s.kind]; s.life -= dt; tA.copy(s.p);
      s.v.y -= S.g * dt; if (S.drag && !(s as Shot & { noDrag?: boolean }).noDrag) s.v.multiplyScalar(1 - S.drag * dt); tB.copy(s.p).addScaledVector(s.v, dt); // p0 = tA, p1 = tB
      let done = false; const seg = tA.distanceTo(tB), n = Math.max(1, Math.ceil(seg / 0.25));
      for (let k = 1; k <= n && !done; k++) { const p = tA.clone().lerp(tB, k / n);
        // inimigos (cilindro: raio do bicho, da canela ao topo)
        for (const e of ctx.targets()) { if (!e.alive || !e.active) continue; const r = (e.def.radius || 0.5) + (s.kind === 'bullet' ? 0.05 : 0.12), top = e.pos.y + Math.max(1.4, r * 3.2); if (p.y < e.pos.y + 0.1 || p.y > top) continue;
          if ((p.x - e.pos.x) ** 2 + (p.z - e.pos.z) ** 2 > r * r) continue;
          s.p.copy(p); ctx.hit(e, { mul: s.mul, kind: s.kind, point: p.clone(), from: s.from, data: s.data }); ctx.spark(p, 'blood', s.v.clone().normalize()); ctx.sound?.('hit');
          if (s.kind === 'bullet') { ctx.scene.remove(s.m); } else stick(s, e.root ?? null); done = true; break; }
        if (done) break;
        const dm = ctx.dummyAt?.(p.x, p.z, 0.5); if (dm && p.y < ctx.heightAt(p.x, p.z) + 2.0) { s.p.copy(p); dm.hit(p.clone(), s.mul); ctx.spark(p, 'wood', s.v.clone().normalize()); ctx.sound?.('thud'); if (s.kind === 'bullet') ctx.scene.remove(s.m); else stick(s); done = true; break; }
        const gy = ctx.heightAt(p.x, p.z); if (p.y <= gy + 0.02) { p.y = gy + 0.02; s.p.copy(p); ctx.spark(p, s.kind === 'bullet' ? 'dust' : 'dust', s.v.clone().normalize()); ctx.sound?.(s.kind === 'bullet' ? 'ric' : 'thud'); if (s.kind === 'bullet') ctx.scene.remove(s.m); else stick(s); done = true; break; }
        if (p.y < gy + 3.5 && ctx.isWall(p.x, p.z)) { s.p.copy(p); ctx.spark(p, s.kind === 'bullet' ? 'metal' : 'wood', s.v.clone().normalize()); ctx.sound?.(s.kind === 'bullet' ? 'ric' : 'thud'); if (s.kind === 'bullet') ctx.scene.remove(s.m); else stick(s); done = true; break; }
      }
      if (done) { shots.splice(i, 1); continue; }
      s.p.copy(tB); s.m.position.copy(s.p);
      tQ.setFromUnitVectors(FWD, tA.copy(s.v).normalize()); s.m.quaternion.copy(tQ); // a ponta segue a velocidade (a flecha "deita" na descida)
      if (S.spin) { s.spinA += S.spin * dt; s.m.rotateX(s.spinA); } // a kunai gira no ar
      if (s.life <= 0) { ctx.scene.remove(s.m); shots.splice(i, 1); }
    }
    for (let i = stuck.length - 1; i >= 0; i--) { const o = stuck[i]; o.t -= dt;
      if (o.host && o.loc && o.locQ) { if (!o.host.parent) o.t = 0; else { o.host.updateWorldMatrix(true, false); o.m.position.copy(o.loc).applyMatrix4(o.host.matrixWorld); o.m.quaternion.copy(o.host.getWorldQuaternion(tQ)).multiply(o.locQ); } }
      if (o.t < 0.6) o.m.scale.setScalar(Math.max(0.01, o.t / 0.6)); if (o.t <= 0) { ctx.scene.remove(o.m); stuck.splice(i, 1); } }
  }
  function clear() { for (const s of shots) ctx.scene.remove(s.m); for (const o of stuck) ctx.scene.remove(o.m); shots.length = 0; stuck.length = 0; }
  return { fire, lob, update, clear, pick, get count() { return shots.length; } };
}

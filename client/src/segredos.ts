/* ---------- O que só o Instinto mostra (Erling, 24/10: "missões que exigem ligar a passiva — rastrear um sequestro, caçar um
   lobisomem na mata, procurar um vampiro, achar dispositivos perdidos, falar com espíritos da floresta; e tesouros escondidos e
   easter eggs que só aparecem com o instinto ligado").
   - A aura do instinto: um anel e umas centelhas na cor do seu caminho, aos seus pés. Só você vê.
   - Rastros de missão (objetivo 'sense'): pegadas, gotas de sangue, cheiro, sinal de máquina ou um espírito, do ponto onde o
     rastro começa até o alvo. Desligado, o rastro não existe; perto do alvo o herói só estranha ("tem algo aqui…").
   - Esconderijos: tesouros e segredos espalhados pelo mundo, invisíveis sem o instinto. Cada um tem a sua história. ---------- */
import * as THREE from 'three';
import { fine } from './dual3d';

const T = 2;
export type SenseKind = 'rastro' | 'sangue' | 'espirito' | 'dispositivo' | 'cheiro' | 'ninho';
export interface SenseGoal { id: string; kind: SenseKind; label: string; from: { x: number; y: number }; to: { x: number; y: number }; spirit?: { name: string; lines: string[] } }
export interface Cache { id: string; x: number; y: number; name: string; lore: string; tier: number }
interface Ctx { /** guincho de ratazana: 0..1 */ squeak?(v: number): void; /** achou um ninho: o que estava escondido nele */ nest?(x: number, y: number, z: number, g: SenseGoal): void; scene: THREE.Scene; heightAt(x: number, z: number): number; hero(): THREE.Vector3; color(): number; inside(): boolean; bubble(x: number, y: number, z: number, t: string): void; log(t: string, c?: string): void; fx(x: number, y: number, z: number, col: number): void }

const tex = (draw: (g: CanvasRenderingContext2D) => void) => { const c = document.createElement('canvas'); c.width = c.height = 64; draw(c.getContext('2d')!); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const radial = (col: string) => tex((g) => { const gr = g.createRadialGradient(32, 32, 1, 32, 32, 31); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
const TEX = {
  foot: tex((g) => { g.fillStyle = 'rgba(255,255,255,1)'; g.beginPath(); g.ellipse(32, 38, 9, 15, 0, 0, 6.283); g.fill(); for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(24 + i * 5.5, 18 - (i === 1 || i === 2 ? 2 : 0), 3.2, 0, 6.283); g.fill(); } }),
  drop: tex((g) => { const gr = g.createRadialGradient(32, 34, 1, 32, 34, 14); gr.addColorStop(0, 'rgba(255,60,60,1)'); gr.addColorStop(1, 'rgba(120,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(32, 34, 14, 10, 0.4, 0, 6.283); g.fill(); }),
  gear: tex((g) => { g.translate(32, 32); g.fillStyle = 'rgba(140,240,255,1)'; for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.fillRect(-4, -26, 8, 9); } g.beginPath(); g.arc(0, 0, 18, 0, 6.283); g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, 0, 8, 0, 6.283); g.fill(); }),
  ghost: tex((g) => { const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(220,255,240,.95)'); gr.addColorStop(1, 'rgba(160,255,210,0)'); g.fillStyle = gr; g.beginPath(); g.arc(32, 15, 9, 0, 6.283); g.fill(); g.beginPath(); g.moveTo(18, 30); g.quadraticCurveTo(32, 18, 46, 30); g.lineTo(52, 64); g.lineTo(12, 64); g.closePath(); g.fill(); g.fillStyle = 'rgba(20,60,40,.9)'; g.fillRect(27, 13, 3, 3); g.fillRect(34, 13, 3, 3); }),
  sigil: tex((g) => { g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 26, 0, 6.283); g.stroke(); g.beginPath(); for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + i * 6.283 * 3 / 7; const x = 32 + Math.cos(a) * 24, y = 32 + Math.sin(a) * 24; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); g.beginPath(); g.arc(32, 32, 5, 0, 6.283); g.fill(); }),
  glow: radial('rgba(255,255,255,.9)'),
  /* ninho de ratazana: galhos e palha em roda, com um brilho de coisa roubada no meio */
  nest: tex((g) => { g.lineCap = 'round'; for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283 + (i % 3) * 0.2, r0 = 14 + (i % 4) * 2.5, r1 = 24 + (i % 5) * 1.6; g.strokeStyle = i % 2 ? 'rgba(200,150,90,1)' : 'rgba(150,100,60,1)'; g.lineWidth = 2.2 + (i % 3) * 0.6; g.beginPath(); g.moveTo(32 + Math.cos(a) * r0, 34 + Math.sin(a) * r0 * 0.7); g.lineTo(32 + Math.cos(a + 0.9) * r1, 34 + Math.sin(a + 0.9) * r1 * 0.7); g.stroke(); }
    const gr = g.createRadialGradient(32, 33, 1, 32, 33, 11); gr.addColorStop(0, 'rgba(255,240,170,1)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gr; g.beginPath(); g.arc(32, 33, 11, 0, 6.283); g.fill(); }),
};
const KCOL: Record<SenseKind, number> = { rastro: 0xffe8b0, sangue: 0xff3a3a, espirito: 0x9affd0, dispositivo: 0x8af0ff, cheiro: 0xd0a0ff, ninho: 0xffc070 };

export function createSecrets(ctx: Ctx, caches: Cache[]) {
  let found: string[] = []; try { found = JSON.parse(localStorage.getItem('karmika.segredos.v1') || '[]'); } catch { /* */ }
  const saveFound = () => { try { localStorage.setItem('karmika.segredos.v1', JSON.stringify(found)); } catch { /* */ } };
  /* a aura do instinto (só você vê) */
  const self = new THREE.Group(); ctx.scene.add(fine(self));
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.86, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide })); self.add(ring);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.18 })); halo.scale.set(2.2, 3.2, 1); halo.position.y = 1.1; self.add(halo);
  self.visible = false;
  /* rastros ativos */
  type Mark = THREE.Object3D & { material: THREE.Material & { opacity: number } };
  const trails = new Map<string, { g: SenseGoal; marks: Mark[]; target: THREE.Sprite; ghost?: THREE.Sprite; done: boolean; told: number; sq: number }>();
  function buildTrail(g: SenseGoal) {
    const ax = (g.from.x + 0.5) * T, az = (g.from.y + 0.5) * T, bx = (g.to.x + 0.5) * T, bz = (g.to.y + 0.5) * T, L = Math.hypot(bx - ax, bz - az), n = Math.max(6, Math.floor(L / 2.6)), nx = -(bz - az) / (L || 1), nz = (bx - ax) / (L || 1);
    const marks: Mark[] = []; const tx = g.kind === 'sangue' ? TEX.drop : g.kind === 'dispositivo' ? TEX.gear : g.kind === 'cheiro' ? TEX.glow : TEX.foot;
    for (let i = 0; i < n; i++) { const k = i / n, wob = Math.sin(k * 9 + g.id.length) * 2.2 * Math.sin(k * Math.PI), x = ax + (bx - ax) * k + nx * wob + (i % 2 ? 0.35 : -0.35) * nx, z = az + (bz - az) * k + nz * wob + (i % 2 ? 0.35 : -0.35) * nz;
      let s: Mark;
      if (g.kind === 'ninho') { /* patinhas de rato: pequenas, em par, correndo até o ninho */ const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.42).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: TEX.foot, color: KCOL.ninho, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 })); m.rotation.y = Math.atan2(bx - ax, bz - az); m.position.set(x, ctx.heightAt(x, z) + 0.05, z); s = m as unknown as Mark; }
      else if (g.kind === 'rastro' || g.kind === 'sangue') { /* pegada/gota deitada no chão, na direção do caminho */ const m = new THREE.Mesh(new THREE.PlaneGeometry(g.kind === 'sangue' ? 0.85 : 0.6, g.kind === 'sangue' ? 0.65 : 0.9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tx, color: KCOL[g.kind], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 })); m.rotation.y = Math.atan2(bx - ax, bz - az) + (g.kind === 'sangue' ? i * 1.3 : 0); m.position.set(x, ctx.heightAt(x, z) + 0.05, z); s = m as unknown as Mark; }
      else { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, color: KCOL[g.kind], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 })); sp.scale.setScalar(g.kind === 'cheiro' ? 1.4 : 0.7); sp.position.set(x, ctx.heightAt(x, z) + (g.kind === 'cheiro' ? 0.8 : 0.5), z); s = sp as unknown as Mark; }
      s.visible = false; ctx.scene.add(fine(s)); marks.push(s); }
    const target = new THREE.Sprite(new THREE.SpriteMaterial({ map: g.kind === 'dispositivo' ? TEX.gear : g.kind === 'ninho' ? TEX.nest : TEX.sigil, color: g.kind === 'ninho' ? 0xffffff : KCOL[g.kind], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 })); target.scale.setScalar(1.6); target.position.set(bx, ctx.heightAt(bx, bz) + 0.6, bz); target.visible = false; ctx.scene.add(fine(target));
    let ghost: THREE.Sprite | undefined; if (g.kind === 'espirito') { ghost = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.ghost, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 })); ghost.scale.set(1.3, 2.2, 1); ghost.position.set(bx, ctx.heightAt(bx, bz) + 1.2, bz); ghost.visible = false; ctx.scene.add(fine(ghost)); }
    if (g.kind === 'ninho') { target.scale.set(1.9, 1.4, 1); target.position.y = ctx.heightAt(bx, bz) + 0.35; }
    trails.set(g.id, { g, marks, target, ghost, done: false, told: 0, sq: 1 + Math.random() * 2 });
  }
  function dropTrail(id: string) { const tr = trails.get(id); if (!tr) return; for (const m of tr.marks) ctx.scene.remove(m); ctx.scene.remove(tr.target); if (tr.ghost) ctx.scene.remove(tr.ghost); trails.delete(id); }
  /** os rastros que as missões ativas pedem */
  function sync(goals: SenseGoal[]) { const want = new Set(goals.map((g) => g.id)); for (const id of [...trails.keys()]) if (!want.has(id)) dropTrail(id); for (const g of goals) if (!trails.has(g.id)) buildTrail(g); }
  /* esconderijos: um sinal no chão, a terra mexida, um brilho */
  const cacheObjs = new Map<string, { c: Cache; s: THREE.Sprite; g: THREE.Sprite }>();
  let onSense: (id: string) => void = () => {};
  function update(dt: number, t: number, on: boolean) {
    const hp = ctx.hero(), col = ctx.color(), inside = ctx.inside();
    self.visible = on && !inside; if (self.visible) { self.position.set(hp.x, hp.y + 0.04, hp.z); (ring.material as THREE.MeshBasicMaterial).color.setHex(col); (halo.material as THREE.SpriteMaterial).color.setHex(col); (ring.material as THREE.MeshBasicMaterial).opacity = 0.32 + 0.16 * Math.sin(t * 2.4); ring.rotation.y = t * 0.4; halo.material.opacity = 0.1 + 0.05 * Math.sin(t * 1.7); if (Math.random() < dt * 5) ctx.fx(hp.x + (Math.random() - 0.5) * 1.4, hp.y + 0.2, hp.z + (Math.random() - 0.5) * 1.4, col); }
    for (const tr of trails.values()) { if (tr.done) continue; const g = tr.g, tx = (g.to.x + 0.5) * T, tz = (g.to.y + 0.5) * T, dT = Math.hypot(tx - hp.x, tz - hp.z);
      for (const m of tr.marks) { const d = m.position.distanceTo(hp), vis = on && !inside && d < 46; m.visible = vis; if (vis) m.material.opacity = Math.min(1, (1 - d / 46) * 1.8) * (0.8 + 0.2 * Math.sin(t * 3 + m.position.x)); }
      const tv = on && !inside && dT < 60; tr.target.visible = tv; if (tv) { tr.target.material.opacity = 0.55 + 0.35 * Math.sin(t * 4); tr.target.material.rotation = t * 0.6; }
      if (g.kind === 'ninho' && on && !inside && dT < 26) { tr.sq -= dt; if (tr.sq <= 0) { tr.sq = 2.2 + Math.random() * 3 * (0.4 + dT / 26); ctx.squeak?.(1 - dT / 26); if (dT < 12 && Math.random() < 0.35) ctx.bubble(tx, ctx.heightAt(tx, tz) + 1.2, tz, Math.random() < 0.5 ? 'iiiik!' : 'iik… iik…'); } if (tv) tr.target.material.rotation = 0; }
      if (tr.ghost) { tr.ghost.visible = tv; if (tv) { tr.ghost.material.opacity = 0.35 + 0.25 * Math.sin(t * 1.3); tr.ghost.position.y = ctx.heightAt(tx, tz) + 1.2 + Math.sin(t * 1.1) * 0.15; } }
      if (dT < 4.5 && on && !inside) { tr.done = true; if (g.spirit) { g.spirit.lines.forEach((l, i) => setTimeout(() => { ctx.bubble(tx, ctx.heightAt(tx, tz) + 2.6, tz, l); ctx.log(`👻 ${g.spirit!.name}: “${l}”`, '#9affd0'); }, i * 4200)); }
        for (let i = 0; i < 16; i++) ctx.fx(tx + (Math.random() - 0.5) * 2, ctx.heightAt(tx, tz) + 0.3, tz + (Math.random() - 0.5) * 2, KCOL[g.kind]); if (g.kind === 'ninho') { ctx.squeak?.(1); ctx.nest?.(tx, ctx.heightAt(tx, tz), tz, g); } onSense(g.id); setTimeout(() => dropTrail(g.id), g.spirit ? g.spirit.lines.length * 4200 + 2000 : 3000); }
      else if (dT < 7 && !on && t - tr.told > 25) { tr.told = t; ctx.log(g.kind === 'ninho' ? '✧ Um chiado miúdo, quase nada, debaixo da terra… (Ligue o Instinto: F)' : `✧ Tem alguma coisa aqui… algo que os olhos não pegam. (Ligue o Instinto: F)`, '#d8c8a0'); } }
    // esconderijos perto
    for (const c of caches) { if (found.includes(c.id)) continue; const x = (c.x + 0.5) * T, z = (c.y + 0.5) * T, d = Math.hypot(x - hp.x, z - hp.z); let o = cacheObjs.get(c.id);
      if (d > 60 || inside) { if (o) { ctx.scene.remove(o.s); ctx.scene.remove(o.g); cacheObjs.delete(c.id); } continue; }
      if (!o) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.sigil, color: 0xffd890, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 })); s.scale.setScalar(1.2); s.position.set(x, ctx.heightAt(x, z) + 0.15, z); const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffc860, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 })); gl.scale.setScalar(2.2); gl.position.copy(s.position).setY(s.position.y + 0.5); ctx.scene.add(fine(s)); ctx.scene.add(fine(gl)); o = { c, s, g: gl }; cacheObjs.set(c.id, o); }
      const vis = on && d < 32; o.s.visible = o.g.visible = vis; if (vis) { o.s.material.opacity = 0.5 + 0.3 * Math.sin(t * 2.5 + c.x); o.s.material.rotation = t * 0.3; o.g.material.opacity = 0.18 + 0.1 * Math.sin(t * 2); } }
  }
  /** o E num esconderijo */
  function interact(hx: number, hz: number, on: boolean, dig: (c: Cache) => void): { d: number; label: string; act: () => void } | null {
    if (!on) return null; for (const c of caches) { if (found.includes(c.id)) continue; const x = (c.x + 0.5) * T, z = (c.y + 0.5) * T, d = Math.hypot(x - hx, z - hz); if (d < 2.6) return { d, label: `E — Cavar: ${c.name}`, act: () => { found.push(c.id); saveFound(); const o = cacheObjs.get(c.id); if (o) { ctx.scene.remove(o.s); ctx.scene.remove(o.g); cacheObjs.delete(c.id); } for (let i = 0; i < 24; i++) ctx.fx(x + (Math.random() - 0.5), ctx.heightAt(x, z) + 0.3, z + (Math.random() - 0.5), 0xffd890); dig(c); } }; }
    return null;
  }
  return { update, interact, sync, setOnSense(f: (id: string) => void) { onSense = f; }, foundCount: () => found.length, total: () => caches.length, isFound: (id: string) => found.includes(id) };
}

/* ---------- os esconderijos do mundo: nomes e histórias (o lugar é sorteado uma vez, igual para todo mundo) ---------- */
export const CACHE_LORE: [string, string][] = [
  ['A Bolsa do Contrabandista', 'Um saco de couro enterrado raso, com um bilhete: "Se eu não voltar, é de quem achar. Só não conte à Vesna."'],
  ['O Altar do Andarilho', 'Pedras empilhadas por mãos antigas. Debaixo da última, uma oferenda que ninguém veio buscar.'],
  ['A Caixa de Música Enterrada', 'Uma caixinha de latão com a marca da Academia. Ainda toca três notas e para.'],
  ['O Tesouro do Cão Fiel', 'Ossos de um cão enrolados num manto, e debaixo deles as moedas que ele guardou até o fim.'],
  ['A Carta de Amor Nunca Entregue', 'Um cilindro de cera com uma carta: "Ingrid, se você ler isto…" O resto apagou com a chuva.'],
  ['O Esconderijo do Desertor', 'Um machado, um pão petrificado e prata suficiente para recomeçar a vida longe do Clã.'],
  ['O Relicário Esquecido', 'Um relicário de prata com um fio de cabelo branco. Ainda está quente, você jura.'],
  ['A Panela do Gigante', 'Uma panela de ferro do tamanho de um barril, cheia de terra… e no fundo, moedas.'],
  ['O Ninho do Corvo-Rei', 'Os corvos guardam coisas brilhantes. Este guardou um anel de jarl.'],
  ['A Pedra que Respira', 'Uma pedra lisa que sobe e desce devagar, como um peito dormindo. Embaixo dela, um presente.'],
  ['O Mapa Rasgado', 'Metade de um mapa que aponta para um lugar que você já conhece. Quem desenhou estava com pressa.'],
  ['O Cofre do Monge', 'Uma caixa selada com cera de abelha e o símbolo do Olho. Dentro, o que o monge não quis levar para o céu.'],
];

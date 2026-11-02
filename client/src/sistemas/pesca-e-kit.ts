/* ÍNDICE DE PROPS POR TILE, BAÚS, KIT INICIAL E PESCA: a vara, a boia, a linha e a fisgada. Saiu do main.ts (02/11). */
import { type Slot, genGear } from '../loot';
import * as THREE from 'three';
import { fine } from '../dual3d';
import { WL } from '../world';
import type { PescaKitCtx } from '../main';

export function createPescaKit(K: PescaKitCtx) {
const tileIdx = new Map<number, (typeof K.city.props)[number][]>();
function idx(p: (typeof K.city.props)[number]) { const k = p.gy * 1000 + p.gx; (tileIdx.get(k) ?? tileIdx.set(k, []).get(k)!).push(p); }
for (const p of K.city.props) if (p.kind === 'tree' || p.kind === 'rock' || p.kind === 'campfire' || p.kind === 'chest' || p.kind === 'herb') idx(p);
const chestsOpen = new Set<(typeof K.city.props)[number]>();
/** Baú de Boas-Vindas dos Caminhantes: o primeiro baú que um personagem novo abre traz um kit quase completo para começar */
function welcomeKit(_cx: number, _cz: number, _cy: number): boolean { return false; } // o kit agora mora no Baú do Caminhante
/** presentes de começo de jornada: vão direto para o Baú do Caminhante (uma vez por personagem) */
function giveStartKit() {
  try { if (localStorage.getItem('karmika.startkit')) return; localStorage.setItem('karmika.startkit', '1'); } catch { return; }
  const L = K.game.st.lvl, slots: Slot[] = ['weapon', 'shield', 'armor', 'helm', 'boots', 'cape', 'shoulders'];
  /* 26/10 (Erling: "o personagem não pode receber de kit de início itens que ele não pode usar — metralhadora, itens de anão, de guerreiro;
     somos humanos puros"): o kit é de aprendiz e da raça. Peças simples (couro, broquel, capuz), arma leve que qualquer um maneja;
     o anão ganha o martelo da Forja, o elfo um arco. Nada de arma de caminho (Tecnocrata, Caçador, Vampiro, Lobisomem) */
  const o = K.profile?.origin ?? 'human', pk = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  const KIT: Partial<Record<Slot, string>> = { weapon: o === 'dwarf' ? 'Martelo' : o === 'elf' ? 'Arco Curto' : pk(['Espada Curta', 'Machado de Mão', 'Adaga']), armor: 'Gibão de Couro', shield: 'Broquel', helm: pk(['Capuz', 'Elmo de Couro']), boots: 'Botas de Couro', cape: pk(['Capa de Lã', 'Capa Curta de Viagem']), shoulders: 'Ombreiras de Couro' };
  const kit = slots.filter((sl) => !(o === 'elf' && sl === 'shield')).map((sl) => genGear(Math.max(2, L + 1), sl === 'weapon' || sl === 'armor' ? 'magic' : 'normal', sl, KIT[sl])).filter((g) => !g.only || K.walksPath(g.only));
  K.inv.vaultPut([['potion', 5], ['bread', 10], ['scroll_return', 1]], kit);
  K.game.logMsg('🎁 Presentes de começo de jornada no seu Baú do Caminhante, perto do centro da vila.', '#ffe08a');
}
setTimeout(giveStartKit, 1500);

function nearProps(gx: number, gy: number, kinds: string[], rad = 2) { const out: (typeof K.city.props)[number][] = []; for (let y = gy - rad; y <= gy + rad; y++) for (let x = gx - rad; x <= gx + rad; x++) for (const p of tileIdx.get(y * 1000 + x) ?? []) if (kinds.includes(p.kind) && !(p as { gone?: boolean }).gone) out.push(p); return out; }
const chop = new Map<object, number>(), twigs = new Map<object, number>();
let fishing: { t: number; bite: number; at: { x: number; z: number }; total: number } | null = null;
/* pesca: a vara aparece na mão, ela lança (animação), a boia fica balançando ligada pela linha; quando o peixe morde a boia afunda e ela puxa */
const bobber = new THREE.Group(); { const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xd8302a })); const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf0ece0 })); bobber.add(b1, b2); bobber.visible = false; }
const fishLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xe8e4d8, transparent: true, opacity: 0.8 })); fishLine.visible = false; fishLine.frustumCulled = false;
function startFishing(at: { x: number; z: number }) {
  if (K.combatMode) K.setCombat(false);
  const rod = K.inv.tool('rod'); if (!rod) return;
  K.hero.holdTool = true; K.hero.setGear({ weapon: { base: rod.base, rarity: 'normal', tint: rod.tint, glow: rod.glow } }); K.hero.act('cast');
  const total = (6 + Math.random() * 8) / Math.sqrt(rod.power); fishing = { t: total, bite: 1.3, at, total };
  K.game.logMsg('🎣 Você lançou a linha... espere a boia afundar.', '#9ad7ff'); K.audio.swing();
}
function endFishing(msg?: string) { fishing = null; bobber.visible = false; fishLine.visible = false; K.hero.holdTool = false; K.syncGear(); if (msg) K.game.logMsg(msg); }
function updateFishing(dt: number, t: number) {
  if (!fishing) return;
  if (!bobber.parent) { K.scene.add(fine(bobber)); K.scene.add(fine(fishLine)); }
  if (K.keys.has('w') || K.keys.has('a') || K.keys.has('s') || K.keys.has('d') || K.game.menuOpen || K.combatMode) { endFishing('Você recolheu a linha.'); return; }
  fishing.t -= dt; const since = fishing.total - fishing.t, cast = Math.min(1, since / 0.6);
  const biting = fishing.t < fishing.bite;
  const tip = K.hero.weaponTip(new THREE.Vector3());
  const bx = THREE.MathUtils.lerp(tip.x, fishing.at.x, cast), bz = THREE.MathUtils.lerp(tip.z, fishing.at.z, cast);
  const by = cast < 1 ? THREE.MathUtils.lerp(tip.y, WL, cast) + Math.sin(cast * Math.PI) * 1.2 : WL + 0.02 + Math.sin(t * 3) * 0.025 - (biting ? 0.06 + 0.05 * Math.sin(t * 22) : 0);
  bobber.visible = true; bobber.position.set(bx, by, bz);
  const pos = fishLine.geometry.attributes.position as THREE.BufferAttribute; pos.setXYZ(0, tip.x, tip.y, tip.z); pos.setXYZ(1, bx, by + 0.08, bz); pos.needsUpdate = true; fishLine.visible = true;
  if (cast >= 1 && Math.random() < dt * (biting ? 14 : 2.5)) K.particles.spawn(bx + (Math.random() - 0.5) * 0.3, WL + 0.05, bz + (Math.random() - 0.5) * 0.3, { vy: biting ? 0.8 : 0.1, life: 0.6, s0: 0.1, s1: 0.4, c0: 0xdff4ff, c1: 0x9cd0ff, a: 0.5 });
  if (biting && !(fishing as { warned?: boolean }).warned) { (fishing as { warned?: boolean }).warned = true; K.game.logMsg('🎣 Mordeu!', '#ffe08a'); K.audio.click(); }
  if (fishing.t <= 0) { K.profs.gain('pescador', 3); const rod = K.inv.tool('rod'), y = rod?.yield ?? 1; const n = Math.max(1, Math.round((1 + (Math.random() < 0.3 ? 1 : 0)) * y * (0.8 + Math.random() * 0.4))); K.inv.add('fish', n); K.feats.bump('fish', n);
    if (rod && Math.random() < rod.luck) { K.inv.add('fish_g', 1); K.feats.bump('fish_g'); K.game.logMsg('🐠 Um Salmão Dourado sobe na linha!', '#ffc04a'); } K.hero.act('combo1'); K.audio.swing();
    for (let i = 0; i < 12; i++) K.particles.spawn(bx, WL + 0.1, bz, { vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 2, vz: (Math.random() - 0.5) * 2, life: 0.7, s0: 0.2, s1: 0.05, c0: 0xffffff, c1: 0x9cd0ff, a: 0.8, g: 9 });
    endFishing(); }
}
  return { get fishing() { return fishing; }, nearProps, idx, giveStartKit, chestsOpen, welcomeKit, chop, twigs, startFishing, tileIdx, updateFishing };
}

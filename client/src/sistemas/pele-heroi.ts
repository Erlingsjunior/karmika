/* A PELE DO HERÓI: os modelos de arte (Herik) por raça, sexo, caminho e nível; vestir/despir troca o modelo; o visual do caminho (vampiro, lobisomem); trocar o corpo; o recurso da classe. Saiu do main.ts (02/11). */
import { type Kind, createCharacter } from '../characters';
import { type SkinDef, attachSkin } from '../skin3d';
import * as THREE from 'three';
import { type Look, vampireLook, technoLook } from '../looks3d';
import { fine } from '../dual3d';
import { ramp as toonRamp } from '../toon3d';
import { RACES, type Race } from '@karmika/shared';
import { setCulture } from '../loot';
import { resOf } from '../kits';
import type { PeleHeroiCtx } from '../main';

export function createPeleHeroi(K: PeleHeroiCtx) {
/* modelo do artista (Herik Campos) para a guerreira do Norte: dirigido pela animação procedural */
const SKINS_ART: Partial<Record<Kind, SkinDef>> = { nordic: { fbx: '/models/heroes/NordicWarrior/warrior_rigged.fbx', tex: '/models/heroes/NordicWarrior/warrior_base.jpg' } };
/* humanos (homem e mulher): nível 1 = só a roupa de baixo, sem equipamento; ao vestir a primeira ROUPA (peitoral, elmo, botas, capa ou ombreiras — arma e escudo não contam) passa para o nível 2 */
const CLOTH_SLOTS = ['armor', 'helm', 'boots', 'cape', 'shoulders'] as const;
let deadK = 0; let creating = false; /* na tela de criação o personagem nasce sem roupa: a prévia mostra a pele de nível 1 */
function humanSkinKey(): string | null {
  const origin = K.profile?.origin ?? 'human'; if (origin !== 'human' || K.kindOf(K.state.race) !== 'nordic') return null;
  const sex = K.profile?.sex ?? 'm'; let dressed = false; if (!creating) try { dressed = CLOTH_SLOTS.some((sl) => !!(K.inv.eq as Record<string, unknown>)[sl]); } catch { /* inv ainda não existe */ }
  /* guerreiro do Norte (passou na prova do mestre, v_gue): vestido, ganha o modelo do guerreiro (homem: Guerreiro_lvl_01; mulher: a guerreira do Norte) */
  let warrior = false; try { warrior = K.profile?.path === 'gue' && K.quests.q.done.includes('v_gue'); } catch { /* quests ainda não existe */ }
  if (warrior && dressed) return sex === 'm' ? 'guerreiro_m' : 'guerreiro_f';
  return `${sex === 'm' ? 'humano' : 'humana'}_${dressed ? 2 : 1}`;
}
const HERO_SKIN: Record<string, SkinDef> = { guerreiro_m: { fbx: '/models/heroes/NordicWarrior/Guerreiro_lvl_01.fbx', tex: '/models/heroes/NordicWarrior/Guerreiro_lvl_01_Color.jpg' }, guerreiro_f: { fbx: '/models/heroes/NordicWarrior/warrior_rigged.fbx', tex: '/models/heroes/NordicWarrior/warrior_base.jpg' } };
/* personagens GLB do Herik (01/11, /models/personagens): `classe_sexo[_lvlNN]`, h = homem, m = mulher. O manifesto personagens.json diz quais existem;
   sem ele (pasta ainda não copiada) o jogo fica nos FBX acima. Os GLBs têm o mesmo esqueleto Mixamo e passam pelo mesmo retarget. */
const ART_SET = new Set<string>(); let artSetReady = false;
fetch('/models/personagens/personagens.json').then((r) => (r.ok ? r.json() : [])).then((l: { id: string }[]) => { for (const e of l) ART_SET.add(e.id); artSetReady = true; if (ART_SET.size) { skinKey = ''; applyArtSkin(); } }).catch(() => { artSetReady = true; });
/** qual GLB novo veste o herói agora (null = nenhum; continua no FBX): classe pelo caminho já provado, nível da roupa pelo nível do herói */
let forcedSkin: string | null = null; /* /pele */
function artSkinId(): string | null {
  if (forcedSkin && ART_SET.has(forcedSkin)) return forcedSkin;
  if (!ART_SET.size) return null; const origin = K.profile?.origin ?? 'human';
  const sx = (K.profile?.sex ?? 'm') === 'm' ? 'h' : 'm'; let lvl = 1; try { lvl = K.game.st.lvl; } catch { /* */ }
  let pth = ''; try { pth = K.profile?.path ?? ''; if (!(pth && K.quests.q.done.includes('v_' + pth))) pth = ''; } catch { pth = ''; }
  const CL: Record<string, string> = { vam: 'vampiro', lob: 'lobisomem', mag: 'mago', bru: 'bruxo', pal: 'paladino', tec: 'technocrata' };
  const pick = (ids: string[]) => ids.find((i) => ART_SET.has(i)) ?? null;
  /* 03/11 (Erling: "o level 1 de guerreiro é a própria raça pura"): o lvl01 do Drive é o humano/anão/elfo de antes da classe e não veste o
     guerreiro. Virou guerreiro no nível 20 = guerreiro 1 (modelo lvl02); nível 31 = guerreiro 2 (modelo lvl03) */
  if (pth === 'gue') return pick([`guerreiro_${sx}_lvl0${lvl >= 31 ? 3 : 2}`, `guerreiro_${sx}_lvl02`, `guerreiro_${sx}_lvl03`]);
  if (CL[pth]) return pick([`${CL[pth]}_${sx}`]);
  /* anão e elfo (02/11, modelos do Herik): lvl01 até o nível 19, lvl02 de 20 a 39, lvl03 de 40 em diante */
  if (origin === 'dwarf' || origin === 'elf') { /* como o humano: 1 = sem roupa, 2 = vestido (qualquer peça de roupa); 3 = armadura, do nível 40 em diante */ let dressed2 = false; if (!creating) try { dressed2 = CLOTH_SLOTS.some((sl) => !!(K.inv.eq as Record<string, unknown>)[sl]); } catch { /* */ } const rc = origin === 'dwarf' ? 'anao' : 'elfo', n = lvl >= 40 ? 3 : dressed2 ? 2 : (origin === 'elf' && sx === 'm') ? 2 /* 05/11 (Erling): a elfa sem roupa (elfo_m_lvl01) vem do arquivo com os dedos amassados; na criação e no jogo ela usa a vestida até o Herik reexportar */ : 1; return pick([`${rc}_${sx}_lvl0${n}`, `${rc}_${sx}_lvl02`, `${rc}_${sx}_lvl01`, `${rc}_${sx}_lvl03`]); }
  let dressed = false; if (!creating) try { dressed = CLOTH_SLOTS.some((sl) => !!(K.inv.eq as Record<string, unknown>)[sl]); } catch { /* */ }
  /* humano: 1 = sem roupa, 2 = vestido. O lvl03 do Drive é da expansão (Erling, 01/11): não entra agora */
  return pick([`humano_${sx}_lvl0${dressed ? 2 : 1}`, `humano_${sx}_lvl01`]);
}
let skinTick: (() => void) | null = null, skinToken = 0, skinKey = '', skinModel: THREE.Object3D | null = null, netSkin: SkinDef | null = null;
/** visual do caminho (vampiro: pele pálida, olhos em brasa, névoa rubra à noite) */
let look: Look | null = null, lookFor: string = '';
function applyLook() { const kr = K.kitRace(); const want = kr === 'vam' ? 'vam' : kr === 'tecno' ? 'tecno' : ''; const key = want + ':' + (skinModel?.uuid ?? K.hero.root.uuid); if (key === lookFor) return; look?.dispose(); look = null; lookFor = key; if (want === 'vam') look = vampireLook(K.hero.root, skinModel); if (want === 'tecno') { const tl = technoLook(K.hero.root, skinModel, { fine, ramp: toonRamp }); look = tl; K.game.setTechLook(tl); } else K.game.setTechLook(null); }
/* 03/11 (Erling: "magos estão com a pele muito escura… deixe igual o bruxo"): a textura do mago é morena e as luvas escuras — na luz quente
   do entardecer a pele e as mãos viravam mancha. Ganha a mesma leitura do bruxo: a própria textura acende um pouco nas sombras (emissiva
   fraca) e a cor sobe 15% */
function liftSkin(id: string, model: THREE.Object3D) { if (!id.startsWith('mago_')) return;
  model.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.MeshToonMaterial | undefined; if (!(o as THREE.Mesh).isMesh || !m || !('emissive' in m)) return; const mm = m.clone(); mm.color.multiplyScalar(1.15); if (mm.map) { mm.emissiveMap = mm.map; mm.emissive.setRGB(0.32, 0.29, 0.27); } (o as THREE.Mesh).material = mm; }); }
function applyArtSkin() {
  skinTick = null; netSkin = null; if (skinModel) { skinModel.parent?.remove(skinModel); skinModel = null; } skinKey = '';
  if (localStorage.getItem('karmika.artskin') === '0') return;
  const art = artSkinId(); if (art) { skinKey = 'glb:' + art; const my = ++skinToken, h = K.hero; void artSetReady;
    attachSkin(h, { fbx: `/models/personagens/${art}.glb`, tex: '' }).then((r) => { if (!r || my !== skinToken || h !== K.hero) { if (r) h.root.remove(r.model); return; } if (skinModel && skinModel !== r.model) skinModel.parent?.remove(skinModel); skinModel = r.model; skinTick = r.tick; liftSkin(art, r.model); applyLook(); netSkin = { fbx: `/models/personagens/${art}.glb`, tex: '' }; K.netRef?.lookNow(); K.portraits.delete('hero'); dispatchEvent(new Event('karmika:skinready')); }); return; }
  const hk = humanSkinKey(), k = K.kindOf(K.state.race), def: SkinDef | undefined = hk ? HERO_SKIN[hk] ?? { fbx: `/models/humanos/${hk}.fbx`, tex: `/models/humanos/${hk}.jpg` } : SKINS_ART[k]; if (!def) return;
  skinKey = hk ?? k; const my = ++skinToken, h = K.hero;
  attachSkin(h, def).then((r) => { if (!r || my !== skinToken || h !== K.hero) { if (r) h.root.remove(r.model); return; } if (skinModel && skinModel !== r.model) skinModel.parent?.remove(skinModel); skinModel = r.model; skinTick = r.tick; applyLook(); netSkin = def; K.netRef?.lookNow(); K.portraits.delete('hero'); dispatchEvent(new Event('karmika:skinready')); });
}
/** ao trocar de roupa: se o nível da pele mudou (1 ↔ 2), troca o modelo */
function checkSkinLevel() { const art = artSkinId(); if (art) { if ('glb:' + art !== skinKey) applyArtSkin(); return; } const hk = humanSkinKey(); if (hk && hk !== skinKey) applyArtSkin(); }
/* o modelo também muda ao subir de nível e ao passar na prova do caminho: confere de tempos em tempos (barato: só compara chaves) */
setInterval(() => { try { if (!creating && !K.game.st.dead) checkSkinLevel(); } catch { /* */ } }, 3000);
function swapHero() {
  K.scene.remove(K.hero.root);
  K.hero = createCharacter(K.kindOf(K.state.race), K.profile ? { hair: K.profile.hair, skin: K.profile.skin, hairStyle: K.profile.hairStyle, beard: K.profile.beard, ears: K.profile.origin === 'elf' } : {}); (K.hero as unknown as { sitNeat?: boolean }).sitNeat = K.profile?.sex === 'f';
  K.hookHero();
  K.scene.add(fine(K.hero.root)); K.syncGear(); applyArtSkin();
  (document.getElementById('who') as HTMLElement).textContent = RACES[K.state.race].label;
  K.tree.migrate(); K.applyKitAll(); applyRes(); K.cancelAim(); K.hero.combat = K.combatMode;
}
K.tree.migrate(); K.applyKitAll();
/** recurso do caminho: o orbe da direita muda de nome, de cor e de regra (guerreiros: Ímpeto, que enche lutando) */
function applyRes() { setTimeout(applyLook, 0); K.game.setRaceScale(K.profile?.origin === 'elf' ? 1.1 : K.profile?.origin === 'dwarf' ? 1 : 1.09); /* 06/11 (Erling: "a altura média do jogo é 1,70; o herói humano ~1,90" → "está MUITO pequeno, mais heroico"): o modelo humano mede 1,83 m de pé; o herói vai a ~2,0 m e os NPCs voltaram para 1,70 m (npcs.ts) */ setCulture(K.state.race === 'technocrat' ? 'technocrat' : K.state.race === 'dwarf' ? 'dwarf' : 'nordic'); K.game.setKit(K.kitRace()); const r = resOf(K.kitRace()); K.game.setResource(r); K.globes.setStyle(r.style); const o = document.getElementById('mp'); if (o) { o.title = r.tip; const u = o.querySelector('u'); if (u) u.textContent = r.label; o.dataset.res = r.style; } }
applyRes();
/* a classe segue o caminho jogável atual (o humano puro chega depois): guerreiro nórdico, tecnocrata ou guerreiro anão */
/* antes da Vidente (nível 20), a classe é a própria raça; os testes de dev (F5–F7) ainda trocam o corpo */
const classOfRace = (r: Race, origin?: string) => { const o = origin ?? (r === 'dwarf' ? 'dwarf' : r === 'elf' ? 'elf' : K.profile?.origin ?? 'human'); return K.kindOf(r) === 'technocrat' ? 'Tecnocrata' : o === 'dwarf' ? 'Anão' : o === 'elf' ? 'Elfo' : 'Humano'; };
K.game.setClassName(classOfRace(K.state.race));
/* 07/11 (Erling: "jogo com um anão e está escrito Humano"): a classe de base (Humano/Anão/Elfo) sempre bate com o corpo — mesmo depois de reencarnar */
{ const ci = K.game.classInfo, want = classOfRace(K.state.race); if (['Humano', 'Anão', 'Elfo'].includes(ci.name) && ci.name !== want) K.game.fixBaseClass(want); }
let lastLvl = K.game.st.lvl;
  return { applyRes, checkSkinLevel, get forcedSkin() { return forcedSkin; }, set forcedSkin(v: typeof forcedSkin) { forcedSkin = v; }, get skinKey() { return skinKey; }, set skinKey(v: typeof skinKey) { skinKey = v; }, applyArtSkin, ART_SET, get netSkin() { return netSkin; }, get creating() { return creating; }, set creating(v: typeof creating) { creating = v; }, classOfRace, humanSkinKey, get skinModel() { return skinModel; }, swapHero, get lastLvl() { return lastLvl; }, set lastLvl(v: typeof lastLvl) { lastLvl = v; }, get deadK() { return deadK; }, set deadK(v: typeof deadK) { deadK = v; }, get skinTick() { return skinTick; }, get look() { return look; } };
}

import { buildSpecies } from './flora3d';


import { t as tr } from './i18n';
import { installBvh } from './libs/bvh';
import { kkSetWeapon } from './libs/anim-kk';
import { setModern } from './sistemas/moderno';
import { createAtaques } from './sistemas/ataques';
import { createHalloween } from './sistemas/halloween';
import { quarksInit, quarksUpdate } from './libs/quarks';
import { mirrorUpdate } from './espelho';
import { updateCharLod } from './sistemas/lod-personagens';
import { type Guild } from './social';



import { dragAll, confirmBox, movable, MV_GRIP } from './windows';
dragAll(); // todas as janelas se arrastam pelo título
import { eyeSees } from './surrender';



/* o mundo cresceu (21/10/2026): as Terras dos Homens foram para o centro do mapa de 840 — tudo que o save guarda em tiles anda SH */
{ const W2 = 'karmika.world', SHF = 210, T2 = 2; if (+(localStorage.getItem(W2) || 0) < 2) { const mv = (k: string, f: (o: any) => void) => { try { const raw = localStorage.getItem(k); if (!raw) return; const o = JSON.parse(raw); f(o); localStorage.setItem(k, JSON.stringify(o)); } catch { /* */ } };
  mv('karmika.home.v1', (o) => { if (o) { o.x += SHF; o.y += SHF; } }); mv('karmika.build.v1', (a) => { for (const b of a ?? []) { b.gx += SHF; b.gy += SHF; } });
  mv('karmika.regrow.v1', (a) => { for (const r of a ?? []) { r.gx += SHF; r.gy += SHF; } }); mv('karmika.picked.v1', (a) => { for (const r of a ?? []) { r.gx += SHF; r.gy += SHF; } });
  mv('karmika.hunt', (h) => { if (h) { h.x += SHF * T2; h.z += SHF * T2; } }); localStorage.setItem(W2, '2'); } }
/* 07/11/2026: o mundo ganhou o MAR em volta (DXW casas de cada lado) — o continente anda DXW; a fonte-lar, a casa, as obras, o que nasceu de novo e a caçada andam junto */
{ const W2 = 'karmika.world', V = +(localStorage.getItem(W2) || 0), S = V >= 3 ? 80 : 380, T2 = 2; /* quem já tinha andado 300 (v3) anda só mais 80 */ if (V < 4) { const mv = (k: string, f: (o: any) => void) => { try { const raw = localStorage.getItem(k); if (!raw) return; const o = JSON.parse(raw); f(o); localStorage.setItem(k, JSON.stringify(o)); } catch { /* */ } };
  mv('karmika.home.v1', (o) => { if (o && Number.isFinite(o.x)) { o.x += S; o.y += S; } }); mv('karmika.casa.v1', (o) => { if (o && Number.isFinite(o.gx)) { o.gx += S; o.gy += S; } });
  mv('karmika.build.v1', (a) => { for (const b of a ?? []) { b.gx += S; b.gy += S; } }); mv('karmika.regrow.v1', (a) => { for (const r of a ?? []) { r.gx += S; r.gy += S; } });
  mv('karmika.picked.v1', (a) => { for (const r of a ?? []) { r.gx += S; r.gy += S; } }); mv('karmika.hunt', (h) => { if (h && Number.isFinite(h.x)) { h.x += S * T2; h.z += S * T2; } }); localStorage.setItem(W2, '4'); } }
import * as THREE from 'three';
import { tickFire } from './sistemas/fogo';
import { gaitOf } from './andar';
import { premiumWelcome } from './celebrate';
import { createFixedLights } from './luzes-fixas';
import { createBugsDono } from './sistemas/bugs-dono';
/* DESEMPENHO (25/10, 10 fps no evento): o three.js recalcula a matriz de TODO objeto da cena a cada quadro, mesmo escondido —
   e são ~29 mil peças de NPCs longe (visible=false). Escondido não recalcula; ao reaparecer, recalcula no mesmo quadro. */
{ const P = THREE.Object3D.prototype as THREE.Object3D & { __umw?: boolean }; if (!P.__umw) { P.__umw = true; const orig = P.updateMatrixWorld;
  /* 26/10 (perfil do Erling: 20% da CPU era este percurso): um galho congelado (cenário: matrixWorldAutoUpdate=false, marcado pelo world3d) nem é visitado */
  P.updateMatrixWorld = function (this: THREE.Object3D, force?: boolean) { if (!this.visible) { this.matrixWorldNeedsUpdate = true; return; } if (this.matrixWorldAutoUpdate === false && !force && !(this as THREE.Object3D & { isScene?: boolean }).isScene) return; orig.call(this, force); }; } }
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { RACES, TILE_M as T, isWalkable, type Race, type Vec } from '@karmika/shared';

import { createInventory, ITEMS as ITEMS_TBL, SHOPDEF, SHOPS, PRICES, deedIdOf } from './inventory';


import { createLoja } from './loja';
import { createAuction } from './leilao';
import { houseDoor } from './houses3d';
import { setVitraisDay } from './vitrais';

import { GADGETS } from './festim';
import { KMAX, NATURE, PATH_NAME, strainOf, strainMod, homeSide, CHAOS, CHAOS_MAX, CHAOS_IN, CHAOS_WARN, MADNESS, type Madness } from './karma';
import { ritualFor, ritualIsFall, OUTCAST_QUESTS, type Outcast, realignFor, MADNESS_QUESTS } from './rituais';
import { FAC, facSet, facGear, myFac, setMyFac, onFac, FAC_ILVL, type Fac } from './faccoes';
import { isPremium, setPremium, onPremium, IS_DEV, addPremiumDays, premiumUntil, checkPremiumExpiry } from './premium';

/* PETS E MONTARIAS DE CADA LUGAR (26/10): o item de cada um nasce da ficha (companions.ts), e os estábulos e domadores de cada cidade vendem os seus */
{ const ICON: Record<string, string> = { dog: '🐶', cat: '🐱', wolf: '🐺', fox: '🦊', boar: '🐗', rat: '🐀', spider: '🕷', scorpion: '🦂', snake: '🐍', skull: '💀', automaton: '⚙', fairy: '🧚' };
  for (const k of Object.values(PETS)) if (!ITEMS_TBL[k.id]) { ITEMS_TBL[k.id] = { name: k.name, icon: ICON[k.make ?? k.quad] ?? '🐾', kind: 'misc', col: k.tint ?? 0xc8a070, desc: `${k.blurb ?? 'Companheiro.'} Use para levar ao Estábulo (X).${k.where ? ` · De: ${k.where}.` : ''}`, tier: 2 } as never; PRICES[k.id] ??= /chefe|guardião/.test(k.where ?? '') ? 0 : 420; }
  for (const k of Object.values(MOUNTS)) if (!ITEMS_TBL[k.id]) { ITEMS_TBL[k.id] = { name: k.name, icon: k.body === 'wolf' ? '🐺' : k.body === 'boar' ? '🐗' : k.body === 'cat' ? '🐅' : k.horse?.horn ? '🦄' : k.horse?.antlers ? '🦌' : '🐎', kind: 'misc', col: k.tint ?? 0x6a4a2e, desc: `Montaria (Z): +${Math.round((k.speed - 1) * 100)}% de velocidade fora de combate.${k.lvl ? ` Precisa do nível ${k.lvl}.` : ''} ${k.blurb ?? ''} Use para levar ao Estábulo (X).`, tier: 2 } as never; PRICES[k.id] ??= 900 + (k.lvl ?? 1) * 140; }
  SHOPDEF.domador.items.splice(2, 0, 'pet_boxer', 'pet_cat_grey'); SHOPS.domador = SHOPDEF.domador.items;
  const STALLS: Record<string, [string, string[]]> = { baias_brasa: ['Baias de Brasaforja', ['mount_pony', 'mount_warboar', 'pet_javali_cinza', 'feno']], baias_lithen: ['Clareira dos Cervos de Lithendel', ['mount_whitestag', 'pet_raposa_prata', 'apple']],
    estrebaria_real: ['Estrebaria Real de Askavik', ['mount_palfrey', 'mount_templar', 'feno']], baias_jarl: ['Baias de Jarlsheim', ['mount_jarlsheim', 'mount_elk', 'mount_snowwolf', 'pet_lobo_neve', 'feno']], baias_latao: ['Garagem da Companhia de Latão', ['mount_brass', 'pet_aranha_latao']],
    baias_lumen: ['Jardim do Pináculo', ['mount_unicorn', 'pet_fada', 'apple']], baias_conde: ['Cocheira do Conde', ['mount_nightmare', 'feno']], baias_uivo: ['Covil dos Domadores do Uivo', ['mount_moonwolf', 'mount_sabre', 'pet_pantera', 'meat']] };
  for (const [id, [title, items]] of Object.entries(STALLS)) { SHOPDEF[id] = { title, items, note: 'Montarias: Z para montar e desmontar. Pets: use para levar ao Estábulo (X).' } as never; SHOPS[id] = items; } }
const ITEMS_Q = (id: string) => ITEMS_TBL[id] ?? { name: id, desc: '', icon: '❔' };



import { ONLY_NAME, type Slot } from './loot';

import { STANCE_QUESTS } from './posturas';
import { refreshLocks, KITS } from './kits';
import { createNavios } from './sistemas/navios';
import { createFarois } from './sistemas/farois';

import { type CathedralFloor } from './cathedral3d';

import { type Net } from './net';



import { STATION_INFO, CUTAWAYS } from './stations3d';

import { createQuests, SIDE, WARRIOR, RACE_ROADS } from './quests';
import { HUNTER_I } from './cacador';
import { createTeleferico } from './sistemas/teleferico';
import { MAGE_I } from './mago';
import { WARLOCK_I } from './bruxo';
import { WANDERER } from './andarilho';
import { COSTURA_I } from './costura1';
import { CHAPTER_I, notOldChapterI } from './capitulo1';
import { HUMAN_I } from './humano';
import { DWARF_I } from './anao';
import { ELF_I } from './elfo';
import { ROADS_OF_PEOPLES } from './exploracao';
import { HUMAN_ROAD } from './campanha';
import { createVidente, PATHS } from './vidente';
import { buildInterior, type Interior } from './interiors3d';


import { CASTLE_FLOORS } from './castelo3d';
import { CUT, ramp as toonRamp } from './toon3d';
const cutP = new THREE.Vector3(), cutV2 = new THREE.Vector3();
import { DualRenderPass, fine } from './dual3d';
import { gpuState } from './gpu/tags';
const gpuErr = (e: unknown) => { gpuState.errs++; const m = String((e as Error)?.stack ?? e).slice(0, 400); if (!gpuState.log.includes(m) && gpuState.log.length < 60) gpuState.log.push(m); };
import { createDialog } from './dialog';



import { battleCry } from './gritos';




import { PALADIN, VAMPIRE, TECHNO, WEREWOLF, RACE_INSTINCT } from './sagas';
import { createAtmos } from './atmos';

import { globalNow } from './eventos';
import { PETS, MOUNTS } from './companions';
import { createStable } from './estabulo';

import { createFalls } from './cachoeiras';

import { createChat } from './chat';

import { DEFS, enemyHooks } from './enemies';
import { createLock } from './alvo-preso';
import { bindScrolls } from './esquecimento';
import { biomeAt, heightAt, groundH, rampartAt, rampartTop, bridgeDeck, setRamparts, waterSD, WL, CITY, MAP_W, OFX, OFY, zoneW, veinOf, regionAt, type EnemyType } from './world';
import { loadWorld, cachedArray } from './worldcache';

import { buildWorld, FOUNTAIN, stepAt, chestLids, setWorldLite } from './world3d';
import { createCharacter, type Hero3D, type Kind } from './characters';
import { honorLog } from './sistemas/honra';
import { vfxAttach, vfxTick, vfxProjTick } from './sistemas/vfx';
import { skyAt, lightDirAt } from './sistemas/ceu';
import { createGameplay } from './gameplay';
import { createNpcs, type NpcDef } from './npcs';
import { Mist, Particles } from './fx3d';
import { waterU } from './chunks3d';
import { windU, gustU, heroU } from './terrain3d';
import { artPreload } from './arte3d';
import { horsesPreload } from './montarias3d';
import { stockAllMounts, shopMounts, shopPets } from './sistemas/montarias-loja';
import { openVitrine, mountThumb } from './sistemas/vitrine3d';
stockAllMounts(); /* 03/11: todas as montarias e pets nas lojas */
import { AudioEngine, type Surface } from './audio';
import { createLimiar } from './limiar';

import { createSoul, FRAY_LVL, MAX_BREATHS, CATCHUP_MUL } from './soul';
import { LightShafts, makeHalo } from './volume3d';
import { setHeroSex } from './genero';
import { DECOR } from './decor';



import { CLASS_WEAPONS } from './dados/npcs-dados';



import { createFesta, type FestaOpts } from './sistemas/festa';
import { createOficios } from './sistemas/oficios';
import { createReliquias } from './sistemas/reliquias';
import { createCinemaVistas } from './sistemas/cinema-vistas';
import { createPortalAlma } from './sistemas/portal-alma';
import { createLarMorte, type Home } from './sistemas/lar-e-morte';
import { createLetreiro } from './sistemas/letreiro-eventos';
import { createCastelo, type Inter } from './sistemas/castelo';
import { createMasmorrasEntrar } from './sistemas/masmorras-entrar';
import { createCatedral } from './sistemas/catedral';
import { createCliqueAndar } from './sistemas/clique-andar';
import { createColisao } from './sistemas/colisao';
import { createMouseClique } from './sistemas/mouse-clique';
import { createPeleHeroi } from './sistemas/pele-heroi';
import { createGuiaMapa } from './sistemas/guia-mapa';
import { createMinimapa, type MapHit } from './sistemas/minimapa';
import { createPescaKit } from './sistemas/pesca-e-kit';
import { createOpcoes } from './sistemas/opcoes';
import { createCriacao } from './sistemas/criacao';
import { createOlho } from './sistemas/olho';
import { createCacaElite } from './sistemas/caca-elite';
import { createConversaNpc } from './sistemas/conversa-npc';
import { createSegredosInstinto } from './sistemas/segredos-instinto';
import { createOasis } from './sistemas/oasis';
import { createInstintoPosturas } from './sistemas/instinto-posturas';
import { createEventosUi } from './sistemas/eventos-ui';
import { createDecoracao } from './sistemas/decoracao';
import { createAlinhamentoLugar } from './sistemas/alinhamento-lugar';
import { createEventosVivos } from './sistemas/eventos-vivos';
import { createCarrocaAnoes } from './sistemas/carroca-anoes';
import { createCaravanasUi } from './sistemas/caravanas-ui';
import { createSocialGuildas } from './sistemas/social-guildas';
import { artGeo } from './arte3d';
import { guildStats } from './sistemas/guilda-skills';
import { createRede } from './sistemas/rede';
import { createComandosTeste } from './sistemas/comandos-teste';
import { createVotosAlma } from './sistemas/votos-alma';
import { createDockFeitos } from './sistemas/dock-feitos';
import { createConstrucao } from './sistemas/construcao';
import { createCompanheiros } from './sistemas/companheiros';
import { createConsumiveis } from './sistemas/consumiveis';
import { createBuffsSigilos } from './sistemas/buffs-sigilos';
import { createBancada } from './sistemas/bancada';
import { createEntrada } from './sistemas/entrada';
import { createArvoreClasse } from './sistemas/arvore-classe';
installBvh(); /* 10/11: raios (cliques, visão, recorte do herói) pela árvore de caixas — three-mesh-bvh */
/** tipo declarado de um let (sem o estreitamento do fluxo: false → boolean, 30 → number) — usado nos contextos dos sistemas */
type Widen<T> = T extends boolean ? boolean : T extends number ? number : T extends string ? string : T;

const __artP = Promise.all([artPreload(), horsesPreload()]); /* 03/11: modelos do Herik (vegetação, pedras, vila) baixam junto com o mundo */
const __t0 = performance.now(); const city = await loadWorld(); await __artP; setRamparts(city.ramparts ?? []); (window as unknown as { __tcity?: number }).__tcity = performance.now() - __t0; // mundo do cache (só a 1ª abertura gera)
/* relevo do mapa grande (176 mil alturas), também do cache. Os dois 'await' ficam aqui no topo: depois deles o resto do arquivo roda de uma vez, sem pausa no meio */
const MM_HG = 2, mmHw = Math.ceil(MAP_W / MM_HG);
const mmHgt = await cachedArray('mmhgt', () => { const a = new Float32Array(mmHw * mmHw); for (let y = 0; y < mmHw; y++) for (let x = 0; x < mmHw; x++) a[y * mmHw + x] = groundH((x * MM_HG + 1) * T, (y * MM_HG + 1) * T); return a; });
const state = { race: 'nordic' as Race, fx: city.spawn.x, fy: city.spawn.y, path: [] as Vec[], karma: 0, moving: false, night: 1 };
/* a alma: karma (atravessa as vidas), Fio da Vida, Lágrimas, dívida e vidas passadas — ver soul.ts */
const soul = createSoul(); state.karma = soul.s.karma;
/* juramentos (estado lido cedo: o inventário pergunta pela bênção já ao nascer) — ver offerVow/breakVow mais abaixo */
type VowState = { id: string; secs: number; broken: boolean; titled: boolean } | null;
let vow: VowState = (() => { try { return JSON.parse(localStorage.getItem('karmika.vow') || 'null'); } catch { return null; } })();
const saveVow = () => { try { localStorage.setItem('karmika.vow', JSON.stringify(vow)); } catch { /* */ } };

/* 26/10 noite (Erling: "não tenho 100/100, o limite não é 100"): dois números. O ALINHAMENTO (state.karma) vai de −1000 a +1000 (karma.ts, 27/10) —
   é o que guardas, inquisidor, facções e o Olho leem. O KARMA ACUMULADO não tem teto: tudo de luz e de sombra juntado NESTA vida (soul.s.luzT / soul.s.sombraT);
   ao desencarnar ele fica escrito na vida passada e recomeça do zero. Todo ganho e perda de karma passa por aqui. */
function addKarma(dk: number) { if (!dk || !Number.isFinite(dk)) return; let nk = Math.max(-KMAX, Math.min(KMAX, state.karma + dk));
  { const pc = myPath(); if (pc && CHAOS[pc]) nk = Math.max(-CHAOS_MAX, Math.min(CHAOS_MAX, nk)); } /* guerreiro e tecnocrata: −250 a +250 */
  /* o zero é uma parede para quem tem caminho: só o ritual atravessa (rituais.ts) */ const hs = homeSide(myPath(), !!soul.s.outcast); if (hs && hs * nk < 0 && hs * state.karma >= 0) nk = 0; state.karma = nk;
  if (dk > 0) soul.s.luzT = (soul.s.luzT ?? 0) + dk; else soul.s.sombraT = (soul.s.sombraT ?? 0) - dk; soul.save(); }
if (soul.s.luzT === undefined && soul.s.sombraT === undefined) { soul.s.luzT = Math.max(0, state.karma); soul.s.sombraT = Math.max(0, -state.karma); soul.save(); }
/** a alma vai para a natureza do caminho (vampiro −400, paladino +400…) — 27/10 */
function takeNature(path: string) { if (CHAOS[path]) { state.karma = Math.max(-CHAOS_MAX, Math.min(CHAOS_MAX, state.karma)); soul.s.natSet = path + ':caos'; soul.s.madness = null; soul.s.outcast = null; soul.save(); game.logMsg(`⚖ O ${PATH_NAME[path]} não tem lado: o seu alinhamento flutua de −250 a +250. Nos extremos vem a loucura kármica. Vigie.`, '#c8d8f0'); return; }
  const nat = NATURE[path]; if (!nat) return; soul.s.outcast = null; const d = nat - state.karma; if (d) { state.karma = nat; if (d > 0) soul.s.luzT = (soul.s.luzT ?? 0) + d; else soul.s.sombraT = (soul.s.sombraT ?? 0) - d; } soul.s.natSet = path; soul.save();
  game.logMsg(`👁 O Olho vê o ${PATH_NAME[path]}: a sua alma vai para ${nat > 0 ? '+' : ''}${nat} (${nat > 0 ? 'luz' : 'sombra'}). Afastar-se da sua natureza enfraquece.`, nat > 0 ? '#ffe08a' : '#c46a8a'); }
/* quem já tinha caminho antes da escala nova: a alma vai para a natureza do caminho, somando o que já tinha (uma vez só) */
setTimeout(() => { try { const pc = myPath(); if (pc && CHAOS[pc] && soul.s.natSet !== pc + ':caos') { state.karma = Math.max(-CHAOS_MAX, Math.min(CHAOS_MAX, soul.s.natSet === pc ? state.karma - 150 : state.karma)); soul.s.karma = state.karma; soul.s.natSet = pc + ':caos'; soul.save(); } } catch { /* */ } try { const p = myPath(); if (p && NATURE[p] && soul.s.natSet !== p) { const old = state.karma; state.karma = Math.max(-KMAX, Math.min(KMAX, NATURE[p] + old)); soul.s.karma = state.karma; soul.s.natSet = p; soul.save(); } } catch { /* */ } }, 1500);
/* o ritual da travessia (27/10): na beira do zero o Olho abre a missão da classe; cumprida, a alma explode e atravessa */
function checkRitual() { const p = myPath(); if (!p || !NATURE[p] || soul.s.natSet !== p) return; /* espera a alma chegar à natureza do caminho */ const back = !!soul.s.outcast, hs = homeSide(p, back), id = (back ? 'ret_' : 'rit_') + p;
  const act = (quests.q.active as Record<string, unknown>)[id];
  if (!act && hs * state.karma <= 10) { const d = ritualFor(p, back); if (!d) return; quests.accept(d); const fall = ritualIsFall(p, back);
    game.logMsg(fall ? '⚖ A alma está na beira do precipício kármico. A luz já não segura você: o Olho abre o Ritual da Queda.' : '⚖ A alma está na beira do precipício kármico. A sombra já não segura você: o Olho abre o Ritual do Renascimento.', '#ff9a6a'); return; }
  if (act && hs * state.karma > 120) { (quests as unknown as { abandon(id: string): void }).abandon(id); game.logMsg('⚖ A alma se afastou da beira do zero. O ritual se fecha por enquanto.', '#9ad7ff'); return; }
  if (act) { const d2 = (quests as unknown as { turnins(n: string): { id: string }[] }).turnins('O Olho').find((x) => x.id === id); if (d2) { quests.turnIn(d2 as never); crossOver(p, back); } } }
function crossOver(p: string, back: boolean) { const fall = ritualIsFall(p, back), nat = NATURE[p], hp = heroPosNow();
  const to = back ? Math.sign(nat) * 50 : -Math.sign(nat) * 50; state.karma = to; if (to > 0) soul.s.luzT = (soul.s.luzT ?? 0) + 50; else soul.s.sombraT = (soul.s.sombraT ?? 0) + 50;
  soul.s.outcast = back ? null : (nat < 0 ? 'renegado' : 'desgarrado'); soul.save(); keepKarma();
  for (let i = 0; i < 3; i++) setTimeout(() => dispatchEvent(new CustomEvent('karmika:burst', { detail: fall ? { c0: 0x6a0a3a, c1: 0x1a0420, n: 160 } : { c0: 0xffffff, c1: 0xffe08a, n: 200 } })), i * 260);
  game.st.shake = Math.max(game.st.shake, 1.2); game.dmgText(hp.clone().setY(hp.y + 3), fall ? 'QUEDA' : 'RENASCIMENTO', true, fall ? '#b04aff' : '#ffe08a');
  const ov = document.createElement('div'); ov.style.cssText = `position:fixed;inset:0;z-index:60;pointer-events:none;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;background:${fall ? 'radial-gradient(circle,rgba(20,0,20,.2),rgba(0,0,0,.92))' : 'radial-gradient(circle,rgba(255,250,220,.95),rgba(255,220,140,.25))'};opacity:0;transition:opacity 1.2s;font-family:Cinzel,serif;text-align:center;color:${fall ? '#d9a0ff' : '#5a3a08'}`;
  ov.innerHTML = back ? `<b style="font-size:42px;letter-spacing:.08em">A alma voltou à sua natureza</b><span style="font-size:18px">${PATH_NAME[p]} outra vez · alinhamento ${to > 0 ? '+' : ''}${to}</span>` : `<b style="font-size:44px;letter-spacing:.08em">Parabéns, você criou uma aberração kármica</b><span style="font-size:20px">${PATH_NAME[p]} ${soul.s.outcast === 'renegado' ? 'renegado' : 'desgarrado'} · alinhamento ${to > 0 ? '+' : ''}${to} · uma Lágrima do Olho é sua</span>`;
  document.body.appendChild(ov); requestAnimationFrame(() => { ov.style.opacity = '1'; }); setTimeout(() => { ov.style.opacity = '0'; }, 5200); setTimeout(() => ov.remove(), 6600);
  if (!back) { inv.add('lagrima', 1, true); game.logMsg(fall ? `☾ Você grita, e uma explosão negra apaga toda a luz em você. A alma quebra a barreira e cai para ${to}. Você é um ${PATH_NAME[p]} Desgarrado: os Desgarrados das cidades agora falam com você.` : `☀ Você explode em luz: o karma se limpa e a alma sobe para +${to}. Você é um ${PATH_NAME[p]} Renegado: os Renegados das cidades agora falam com você.`, fall ? '#c98aff' : '#ffe08a'); game.logMsg('💧 Marghar se emociona: uma Lágrima do Olho cai na sua mão.', '#9ad7ff'); }
  else game.logMsg(`⚖ A travessia de volta está feita: ${PATH_NAME[p]} de novo, alinhamento ${to > 0 ? '+' : ''}${to}.`, '#9ad7ff'); }
/* loucura kármica (guerreiro e tecnocrata, 27/10): ±200 entra; só o realinhamento tira */
let chaosWarn = 0;
function checkMadness() { const p = myPath(); if (!p || !CHAOS[p] || !(soul.s.natSet ?? '').startsWith(p)) return; const a = state.karma, m = soul.s.madness as Madness | null | undefined;
  if (!m) { const w = a >= CHAOS_WARN ? 1 : a <= -CHAOS_WARN ? -1 : 0; if (w && w !== chaosWarn) game.logMsg(w > 0 ? `⚖ Luz demais para um ${PATH_NAME[p]}: a alma começa a se recolher. Uma escolha mais dura de vez em quando segura o meio.` : `⚖ Sombra demais para um ${PATH_NAME[p]}: o impulso começa a mandar. Uma escolha mais branda de vez em quando segura o meio.`, '#ffb06a'); chaosWarn = w;
    if (Math.abs(a) >= CHAOS_IN) { const nm = a > 0 ? CHAOS[p].pos : CHAOS[p].neg; soul.s.madness = nm; soul.save(); const M2 = MADNESS[nm]; quests.accept(realignFor(nm));
      game.logMsg(`🌀 Loucura kármica: você virou ${M2.name}. ${M2.line} Só o Ritual de Realinhamento traz você de volta.`, M2.col); madBanner(`Loucura kármica: ${M2.name}`, M2.line, M2.col); }
    return; }
  const id = 'real_' + m; if (!(quests.q.active as Record<string, unknown>)[id] && !quests.q.done.includes(id)) quests.accept(realignFor(m));
  const d2 = (quests as unknown as { turnins(n: string): { id: string }[] }).turnins('O Olho').find((x) => x.id === id);
  if (d2) { quests.turnIn(d2 as never); const q = quests.q.done; const i = q.lastIndexOf(id); if (i >= 0) q.splice(i, 1); /* o ritual pode ser preciso de novo um dia */ state.karma = 0; soul.s.madness = null; soul.save(); keepKarma(); chaosWarn = 0;
    dispatchEvent(new CustomEvent('karmika:burst', { detail: { c0: 0xffffff, c1: 0x9ad7ff, n: 160 } })); madBanner('Realinhado', `O ${PATH_NAME[p]} volta ao meio. Alinhamento 0.`, '#9ad7ff'); game.logMsg(`⚖ Realinhamento feito: a loucura passou e a alma voltou ao meio (0).`, '#9ad7ff'); } }
function madBanner(t: string, sub: string, col: string) { const ov = document.createElement('div'); ov.style.cssText = `position:fixed;inset:0;z-index:60;pointer-events:none;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;background:radial-gradient(circle,rgba(0,0,0,.15),rgba(0,0,0,.75));opacity:0;transition:opacity 1s;font-family:Cinzel,serif;text-align:center;color:${col};text-shadow:0 2px 8px #000`;
  ov.innerHTML = `<b style="font-size:42px;letter-spacing:.08em">${t}</b><span style="font-size:18px;max-width:700px">${sub}</span>`; document.body.appendChild(ov); requestAnimationFrame(() => { ov.style.opacity = '1'; }); setTimeout(() => { ov.style.opacity = '0'; }, 4800); setTimeout(() => ov.remove(), 6000); }
let strainStage = -1;
const keepKarma = () => { if (soul.s.karma !== state.karma) { soul.s.karma = state.karma; soul.save(); } };
setInterval(keepKarma, 3000); addEventListener('beforeunload', keepKarma);
(window as unknown as { __k: unknown }).__k = state;

/* ---------- opções (salvas) ---------- */
export interface Opts { /** acessibilidade: tamanho do texto (todo o jogo) e do chat */ txt: number; chat: number; ui: number; uis: number; res: number; pix: number; wratio: number; shadows: boolean; charShadows: boolean; shadowRes: number; /** 03/11: renderizador — 0 Automático, 1 WebGPU, 2 WebGL (vale ao reabrir) */ rend: number; bloom: number; particles: number; master: number; music: number; sfx: number; amb: number; fps: boolean; dmgText: boolean; cap: number; /** 10/11: ajuste automático de qualidade (resolução dinâmica + degraus de sombra) */ auto: boolean; /** 03/11: estilo do gráfico — 0 Pixel (o de sempre), 1 Moderno (resolução cheia, cor sem degrau, brilho e sombra suaves) */ gfx: number }
let dynK = 1, dynLow = 0, dynHigh = 0; /* resolução dinâmica (ver dynResTick) */
const OPT_DEF: Opts = { txt: 1, chat: 1, ui: 0, uis: 1, res: 1080, pix: 2, wratio: 2, shadows: true, charShadows: false, shadowRes: 1024, rend: 0, bloom: 1, particles: 1, master: 1, music: 1, sfx: 1, amb: 1, fps: true, dmgText: true, cap: 240, gfx: 0, auto: true };
const opts: Opts = (() => { try { return { ...OPT_DEF, ...(JSON.parse(localStorage.getItem('karmika.opts.v1') || 'null') ?? { pix: Number(localStorage.getItem('karmika.pix') || 0) || 2, shadows: localStorage.getItem('karmika.shadows') !== '0', music: localStorage.getItem('karmika.music') === '0' ? 0 : 1 }) }; } catch { return { ...OPT_DEF }; } })();
const saveOpts = () => localStorage.setItem('karmika.opts.v1', JSON.stringify(opts));
/* 10/11 (Erling: "em tela Full HD o 1 e o 2 ficam com pixel muito grande; 1 e 2 mais detalhados, 3 médio, 4 desempenho"):
   a opção 1-4 vira o tamanho real do pixel: 1 · 1,5 · 2 · 3 (antes era 1 · 2 · 3 · 4, e o padrão 2 já cortava a tela pela metade). */
const pixOf = (o: number) => ({ 1: 1, 2: 1.5, 3: 2, 4: 3 } as Record<number, number>)[o] ?? 1.5;
let PIX = Number(new URLSearchParams(location.search).get('pix')) || pixOf(opts.pix);
let WORLD_RATIO = opts.wratio; // cenário em 1/WORLD_RATIO da resolução dos personagens // cada pixel do jogo vira PIXxPIX pixels da tela (visual pixel art); ?pix=1 só para inspeção
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- renderer em baixa resolução ---------- */
/* 03/11 (Erling: "foque totalmente em WebGPU com resguardo de WebGL para rodar em todos os PCs e com qualidade"): o jogo abre em WebGPU
   quando o jogador escolhe (Opções → Renderizador) e o navegador oferece; senão, o WebGL de sempre. Automático fica no WebGL enquanto
   houver efeito ainda não traduzido para o WebGPU (gpuPending()); ?rend=webgpu / ?rend=webgl força na barra de endereço. */
const REND = (() => { const q = new URLSearchParams(location.search).get('rend'); return q === 'webgpu' ? 1 : q === 'webgl' ? 2 : opts.rend ?? 0; })();
let gpuImpl: typeof import('./gpu/impl') | null = null, gpuR: THREE.WebGLRenderer | null = null;
if (REND === 1 && 'gpu' in navigator) { try { gpuImpl = await import('./gpu/impl'); gpuR = await gpuImpl.createGPURenderer(); if (!gpuR) gpuImpl = null; } catch (e) { gpuImpl = null; gpuState.why = String(e); console.warn('[WebGPU] não abriu, fica o WebGL:', e); } }
else if (REND === 1) gpuState.why = 'este navegador não tem WebGPU';
const renderer = gpuR ?? new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
/* WebGPU: as fotos (retratos dos NPCs, da guilda, da morte) leem os pixels na hora — o WebGPU só lê de forma assíncrona, então elas usam um WebGL pequeno à parte */
let snapGL: THREE.WebGLRenderer | null = null;
const snapR = (): THREE.WebGLRenderer => { if (!gpuImpl) return renderer; gpuState.snaps = (gpuState.snaps ?? 0) + 1; if (gpuState.snapLog.length < 20) gpuState.snapLog.push(Math.round(performance.now()) + ' ' + (new Error().stack ?? '').split('\n').slice(2, 6).map((x) => x.trim().slice(0, 80)).join(' < ')); if (!snapGL) { snapGL = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' }); snapGL.setPixelRatio(1); snapGL.outputColorSpace = renderer.outputColorSpace; snapGL.toneMapping = renderer.toneMapping; snapGL.toneMappingExposure = renderer.toneMappingExposure; snapGL.shadowMap.enabled = false; } return snapGL; };
/* 26/10 (perfil do Erling: 5% da CPU era getBoundingClientRect do canvas, pedido dezenas de vezes por quadro por barras, balões e dicas,
   e cada pedido obriga o navegador a refazer o layout): o retângulo do canvas é guardado e só se refaz ao mudar o tamanho */
{ const cv = renderer.domElement; let cr: DOMRect | null = null; const orig = cv.getBoundingClientRect.bind(cv); cv.getBoundingClientRect = () => cr ?? (cr = orig()); const drop = () => { cr = null; }; addEventListener('resize', drop); setInterval(drop, 1000); }
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = opts.shadows; renderer.info.autoReset = false;
renderer.shadowMap.type = THREE.BasicShadowMap; // sombra dura: combina com pixel art e custa 1/4 do PCF
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.78;
if (import.meta.env.PROD && !gpuImpl) renderer.debug.checkShaderErrors = false; // no jogo instalado não confere cada shader (economiza ~1 s na abertura); no dev continua conferindo
const canvas = renderer.domElement;
const kshow = (s: string) => (window as unknown as { __kshow?: (m: string) => void }).__kshow?.(s);
renderer.debug.onShaderError = (gl, prog, vs, fs) => kshow('SHADER falhou:\n' + (gl.getProgramInfoLog(prog) || '') + '\n' + (gl.getShaderInfoLog(vs) || '') + '\n' + (gl.getShaderInfoLog(fs) || ''));
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); kshow('WebGL perdeu o contexto (GPU/driver). Recarregue a página.'); });
document.getElementById('game')!.appendChild(canvas);

/* VARREDURA DE GEOMETRIAS E TEXTURAS (26/10, Erling: "RangeError: Array buffer allocation failed" depois de horas de jogo). Tudo o que foi desenhado uma vez e
   depois largado sem dispose() — efeito de golpe, corpo de bicho, placa de ofício, item no chão — fica preso dentro do WebGLRenderer para sempre, e a memória
   só cresce. De 30 em 30 s marcamos o que ainda está na cena e soltamos o resto; o que for reaproveitado (cache de corpos, geometria compartilhada) é só
   enviado de novo à placa quando voltar a aparecer. */
const GEO_REG = new Set<THREE.BufferGeometry>(), TEX_REG = new Set<THREE.Texture>(), SEEN_G = new WeakSet<THREE.BufferGeometry>(), SEEN_T = new WeakSet<THREE.Texture>();
{ const bs = THREE.BufferGeometry.prototype.computeBoundingSphere; THREE.BufferGeometry.prototype.computeBoundingSphere = function (this: THREE.BufferGeometry) { GEO_REG.add(this); return bs.call(this); };
  const d = Object.getOwnPropertyDescriptor(THREE.Texture.prototype, 'needsUpdate')!; Object.defineProperty(THREE.Texture.prototype, 'needsUpdate', { configurable: true, set(this: THREE.Texture, v: boolean) { if (!(this as THREE.Texture & { isRenderTargetTexture?: boolean; isDepthTexture?: boolean }).isRenderTargetTexture && !(this as THREE.Texture & { isDepthTexture?: boolean }).isDepthTexture) TEX_REG.add(this); d.set!.call(this, v); } }); } /* toda CanvasTexture passa por needsUpdate=true ao nascer */
const TEX_KEYS = ['map', 'emissiveMap', 'alphaMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'gradientMap', 'bumpMap'] as const;
function geoSweep(roots: THREE.Object3D[]): { geo: number; tex: number } {
  const live = new Set<THREE.BufferGeometry>(), tlive = new Set<THREE.Texture>();
  const mat = (m: THREE.Material) => { for (const k of TEX_KEYS) { const t = (m as unknown as Record<string, THREE.Texture | null>)[k]; if (t) tlive.add(t); } const u = (m as THREE.ShaderMaterial).uniforms; if (u) for (const key in u) { const v = u[key].value; if (v && (v as THREE.Texture).isTexture) tlive.add(v as THREE.Texture); } };
  for (const r of roots) r.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) live.add(m.geometry); if (m.material) { if (Array.isArray(m.material)) m.material.forEach(mat); else mat(m.material); } if ((o as THREE.Sprite).isSprite) mat((o as THREE.Sprite).material); });
  /* 03/11 (WebGPU): só se solta o que JÁ ESTEVE na cena e saiu. O que o próprio renderizador cria por dentro (alvos do brilho, mapa de sombra,
     o quadro do pós-processamento) nunca passa pela cena — antes a varredura soltava isso também, e o WebGPU desenhava com textura destruída */
  for (const g of live) SEEN_G.add(g); for (const t of tlive) SEEN_T.add(t);
  let geo = 0, tex = 0; for (const g of GEO_REG) { if (live.has(g) || !SEEN_G.has(g)) continue; GEO_REG.delete(g); SEEN_G.delete(g); if (!(g.userData as { keep?: boolean }).keep) { g.dispose(); geo++; } }
  for (const t of TEX_REG) { const tt = t as THREE.Texture & { isRenderTargetTexture?: boolean; renderTarget?: unknown }; if (tlive.has(t) || !SEEN_T.has(t) || tt.isRenderTargetTexture || tt.renderTarget || (t.userData as { keep?: boolean }).keep) continue; TEX_REG.delete(t); SEEN_T.delete(t); t.dispose(); tex++; }
  return { geo, tex };
}
let geoSweepT = 30;
const fixedL = gpuImpl ? null : createFixedLights(15); /* WebGL: sempre as mesmas 15 luzes pontuais no desenho (luzes-fixas.ts) — luz que nasce ou some não recompila nada */
const scene = new THREE.Scene(); scene.matrixWorldAutoUpdate = false; /* o quadro chama scene.updateMatrixWorld() uma vez (duas passadas de desenho) */
scene.background = new THREE.Color(0x050814);
scene.fog = new THREE.FogExp2(0x050814, 0.02); vfxAttach(scene);

/* ---------- câmera isométrica (ortográfica) ---------- */
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -80, 160); // isométrica fixa (o Erling preferiu assim)
// câmera livre: botão direito/meio arrasta (gira e inclina), Q/E giram. Padrão = isométrico clássico (~35°, 45°)
const D2R = Math.PI / 180;
let az = 45 * D2R, azT = az, pitch = 30 * D2R, pitchT = pitch;
const PITCH_MIN = 14 * D2R, PITCH_MAX = 62 * D2R;
const camDir = new THREE.Vector3();
let zoomTarget = 17, zoom = 17; // metros visíveis na altura da tela
const ZOOM_MIN = 5; let ZOOM_MAX = 22; // padrão 17 m (definido pelo Erling em 20/10); aproxima até 5 m e afasta só até ~22 m

/* ---------- mundo ---------- */
const objs = buildWorld(city);
/* 10/11 (teste_libs): abóboras de Halloween nas vilas e nos cemitérios (só na temporada) */
let halloween: Awaited<ReturnType<typeof createHalloween>> = null; void createHalloween(scene, city, (x, z) => heightAt(x, z)).then((h) => { halloween = h; });
objs.update(city.spawn.x * T, city.spawn.y * T, true);
scene.add(objs.group);
const particles = new Particles(gpuImpl ? 12000 : 7000); /* WebGPU aguenta mais: fogo e magia sem apagar as partículas mais velhas no meio da luta */
const atmos = createAtmos(scene, particles, fine);
/* 09/11 Erling: a névoa rasteira em camadas saiu (feia e pesada) — o jogo fica limpo */

scene.add(fine(particles.points));
void Mist;
/* sem névoa móvel */

const hemi = new THREE.HemisphereLight(0x8fb4ff, 0x2a3a24, 0.3);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0x6f86c8, 0.3);
sun.castShadow = true;
sun.shadow.mapSize.set(opts.shadowRes, opts.shadowRes);
sun.shadow.camera.left = -22; sun.shadow.camera.right = 22; sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -22;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 90;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.07;
scene.add(sun, sun.target);

const kindOf = (r: Race): Kind => (r === 'technocrat' ? 'technocrat' : r === 'dwarf' ? 'dwarf' : 'nordic');
/* ---- perfil do personagem (tela de criação) ---- */
export interface Profile { name: string; origin: 'human' | 'dwarf' | 'elf'; sex?: 'f' | 'm'; path?: string; hair: number; skin: number; title: string; eye?: boolean; hairStyle?: 'braid' | 'long' | 'short' | 'bald'; beard?: number }
const HAIRS = [0xe8dcc0, 0xb33a22, 0x2a1a14, 0xe8c66a, 0x7a4a2a, 0x4a2a6a], SKINS = [0xe8c8ae, 0xd9b08a, 0xb8865a, 0x7a5236];
let profile: Profile | null = null;
setHeroSex(() => profile?.sex); /* o texto se dirige ao herói no gênero escolhido; sem escolha, masculino */
try { profile = JSON.parse(localStorage.getItem('karmika.char.v1') || 'null'); } catch { profile = null; }
const raceOf = (o: Profile['origin']): Race => o === 'dwarf' ? 'dwarf' : 'nordic';
if (profile) state.race = raceOf(profile.origin);
let hero: Hero3D = createCharacter(kindOf(state.race), profile ? { hair: profile.hair, skin: profile.skin, hairStyle: profile.hairStyle, beard: profile.beard, ears: profile.origin === 'elf' } : {});
scene.add(fine(hero.root));
const lantern = new THREE.PointLight(0xffd9a0, 0, 36, 1.6); // aura de luz do herói (estilo Diablo)
lantern.position.set(0, 2.2, 0);
scene.add(fine(lantern));


const audio = new AudioEngine();
for (const ev of ['pointerdown', 'keydown'] as const) addEventListener(ev, () => audio.start(), { once: false });
const fountain = city.props.find((p) => p.kind === 'fountain');
/* as cachoeiras: onde o rio encosta no paredão (cachoeiras.ts) */
const falls = createFalls({ scene, map: city.map as string[][], T, WL, height: (x, z) => heightAt(x, z), pois: city.pois as never, spawn: (x, y, z, p) => particles.spawn(x, y, z, p as never) });
const fountainPos = fountain ? new THREE.Vector3((fountain.gx + fountain.w / 2) * T, 0, (fountain.gy + fountain.h / 2) * T) : new THREE.Vector3(1e4, 0, 1e4);
void LightShafts;
/* sem raios de luz */
void makeHalo;

let pvpOn = false; // PvP da facção ligado: posso ferir gente do meu lado (ou sem facção), com custo de karma; nome fica vermelho
/* 10/11: ataques de bando à vila (sistemas/ataques.ts) — a guarda defende, o herói pode ajudar */
const ataqueSys = createAtaques({ T, settlements: () => city.settlements as never, heroTile: () => ({ x: state.fx, y: state.fy }), night: () => state.night, inside: () => !!inside, level: () => game.st.lvl,
  walkable: (x, z) => { const tt = city.map[Math.floor(z / T)]?.[Math.floor(x / T)]; if (!tt || !isWalkable(tt)) return false; try { return !solidHit(x / T, z / T, false) && !lowWallHit(x / T, z / T) && !rampartAt(Math.floor(x / T), Math.floor(z / T)); } catch { return true; } }, spawn: (ty, x, z, o) => game.enemies.spawn(ty, x, z, o) as never, clearTag: (tg) => game.enemies.clearTag(tg),
  log: (m, c) => game.logMsg(m, c), karma: (n) => addKarma(n), gold: (n) => { game.st.gold += n; } });
(window as unknown as { __raid?: () => string | undefined }).__raid = () => ataqueSys.force(); /* teste */ (window as unknown as { __en?: unknown }).__en = () => ({ en: game.enemies, x: state.fx * T, z: state.fy * T }); /* teste */
let lvlUpKey = ''; let netRef: Net | null = null, lastGear: Parameters<Hero3D['setGear']>[0] | null = null, netMps = 0;
function hookHero() {
  { // a rede vê o que o herói veste e faz: roupa nova e cada golpe/magia vão para os outros jogadores
    const h = hero as Hero3D & { __net?: boolean }; if (!h.__net) { h.__net = true; const sg = h.setGear.bind(h), ac = h.act.bind(h);
      h.setGear = (g) => { lastGear = g; (window as unknown as { __lastGear?: unknown }).__lastGear = g; sg(g); netRef?.lookNow(); }; h.act = (a, f) => { const ok = ac(a, f); if (ok) netRef?.act(a); return ok; }; } }
  hero.onStep = () => {
    const tx = Math.floor(state.fx), ty = Math.floor(state.fy);
    const tile = city.map[ty]?.[tx];
    const zz = inside ? null : zoneW(tx, ty);
    const bio = inside ? null : biomeAt(tx, ty);
    const surf: Surface = inside ? (inside.crypt || inside.prop.kind !== 'house' ? 'stone' : 'wood') : swimmingNow || (tile === 'water') ? 'water' : tile === 'plaza' || tile === 'road' && (bio === 'ruins' || bio === 'rock') ? 'stone' : zz && zz.snow > 0.5 ? 'snow' : bio === 'coast' && tile !== 'road' ? 'sand' : bio === 'swamp' || bio === 'blight' ? 'mud' : bio === 'rock' || bio === 'volcanic' ? 'stone' : tile === 'grass' ? 'grass' : 'dirt';
    audio.voice = (profile?.sex ?? 'm') === 'f' ? 'f' : 'm';
    audio.step(surf, runningNow());
    const x = state.fx * T, z = state.fy * T;
    const n = surf === 'grass' ? 4 : surf === 'dirt' ? 3 : 1;
    for (let i = 0; i < n; i++) particles.spawn(x + (Math.random() - 0.5) * 0.4, 0.05, z + (Math.random() - 0.5) * 0.4, surf === 'grass'
      ? { vx: (Math.random() - 0.5) * 0.8, vy: 0.8 + Math.random() * 0.6, vz: (Math.random() - 0.5) * 0.8, life: 0.6, s0: 0.2, s1: 0.1, c0: 0x6fcf6a, c1: 0x2a6a30, a: 0.6, drag: 1.2, w: 0.5 }
      : { vx: (Math.random() - 0.5) * 0.5, vy: 0.35, vz: (Math.random() - 0.5) * 0.5, life: 0.9, s0: 0.5, s1: 1.4, c0: surf === 'dirt' ? 0x9a7a52 : 0xaab0c0, c1: 0x3a3228, a: surf === 'dirt' ? 0.28 : 0.15, drag: 1.4, w: 0.8 });
  };
}
hookHero();
const RACE_COL: Record<Kind, number> = { nordic: 0xff8a4a, technocrat: 0x4de3ff, dwarf: 0xffcf5a };
let inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; /** 08/11: o Grande Salão de Brasaforja (NPCs de dentro: npcs.ts inside) */ hall?: boolean; canopy?: boolean } | null = null;
if (!gpuR) quarksInit(scene); /* 10/11 (teste_libs): partículas three.quarks — só no WebGL */
const game = createGameplay({ takenK: () => (instintoSys.instinctOn && !inside ? 1.1 : 1), scene, particles, camera, audio, canvas, getHero: () => hero, weaponBase: () => inv.eq.weapon?.base ?? '', getRaceColor: () => RACE_COL[kindOf(state.race)], dummies: city.quartel.dummies.map((q) => new THREE.Vector3(q.x * T, 0, q.y * T)), world: { spawns: city.spawns, isWall: (x, z) => !inside && city.map[Math.floor(z / T)]?.[Math.floor(x / T)] === 'wall', townAt: (x, z) => { if (inside) return false; const tx = x / T, ty = z / T; for (const st of city.settlements) if (Math.hypot(st.x - tx, st.y - ty) < st.radius + (st.kind === 'city' ? 4 : 1.5)) return true; return Math.hypot(CITY.x - tx, CITY.y - ty) < 24; }, guardNear: (x, z) => { if (inside) return false; for (const n of npcSys.npcs) { if (!n.hero.root.visible || !/^(Guarda|Capit[ãa]o|Vigia|Sentinela)/.test(n.def.role) && !/^(Guarda|Capit[ãa]o|Vigia)/.test(n.def.name)) continue; const dx = n.pos.x - x, dz = n.pos.z - z; if (dx * dx + dz * dz < 49) return true; } return false; }, heightAt: (x, z) => (inside ? 0 : heightAt(x, z)), walkable: (x, z) => { if (inside) return inside.int.free(x - IX, z - IZ); const tx = Math.floor(x / T), ty = Math.floor(z / T); const t = city.map[ty]?.[tx]; if (!t || !isWalkable(t)) return false; /* 09/11 (Erling: "animais não atravessam muros"): bicho respeita muralha, muro baixo e sólidos como o herói */ if (rampartAt(tx, ty)) return false; try { return !solidHit(x / T, z / T, false) && !lowWallHit(x / T, z / T); } catch { return true; } } } });
honorLog((t, c) => game.logMsg(t, c)); /* 08/11 Honra Kármica no registro */
/** retrato isolado (bestiário e compêndio): renderiza um objeto sozinho, fundo transparente, luz de estúdio, e devolve um PNG */
function portrait(root: THREE.Object3D, size = 512, yaw = 0.7, pitch = 0.32): string {
  const sc = new THREE.Scene(); const par = root.parent, pos = root.position.clone(), rot = root.rotation.clone(), vis = root.visible; sc.add(root); root.position.set(0, 0, 0); root.rotation.set(0, 0, 0); root.visible = true; const hid: THREE.Object3D[] = []; root.traverse((q) => { if (q.userData.xray && q.visible) { q.visible = false; hid.push(q); } }); /* a silhueta de raio-x não entra no retrato */ root.updateMatrixWorld(true);
  sc.add(new THREE.HemisphereLight(0xfff4e0, 0x5a5060, 2.4)); const dl = new THREE.DirectionalLight(0xffffff, 3.0); dl.position.set(3, 6, 5); sc.add(dl); const rim = new THREE.DirectionalLight(0x9ab8ff, 1.2); rim.position.set(-4, 3, -5); sc.add(rim);
  const box = new THREE.Box3(); root.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || !m.visible) return; const mt = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshBasicMaterial; if (mt?.transparent || mt?.blending === THREE.AdditiveBlending) return; box.expandByObject(m); }); if (box.isEmpty()) box.setFromObject(root); /* anéis e auras no chão não contam no enquadramento */
  const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3()), R = Math.max(sz.x, sz.y, sz.z) * 0.62 + 0.05;
  const cam = new THREE.PerspectiveCamera(28, 1, 0.05, 200), dist = R / Math.sin(14 * Math.PI / 180) * 1.05; cam.position.set(c.x + Math.sin(yaw) * Math.cos(pitch) * dist, c.y + Math.sin(pitch) * dist, c.z + Math.cos(yaw) * Math.cos(pitch) * dist); cam.lookAt(c); cam.layers.enableAll();
  const renderer = snapR(); const rt = new THREE.WebGLRenderTarget(size, size, { samples: 4 }); const old = renderer.getRenderTarget(), oc = new THREE.Color(); renderer.getClearColor(oc); const oa = renderer.getClearAlpha();
  renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(sc, cam); const px = new Uint8Array(size * size * 4); renderer.readRenderTargetPixels(rt, 0, 0, size, size, px); renderer.setRenderTarget(old); renderer.setClearColor(oc, oa); rt.dispose();
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const g = cv.getContext('2d')!, im = g.createImageData(size, size); for (let y = 0; y < size; y++) im.data.set(px.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4); g.putImageData(im, 0, 0);
  for (const q of hid) q.visible = true; sc.remove(root); if (par) par.add(root); root.position.copy(pos); root.rotation.copy(rot); root.visible = vis; return cv.toDataURL('image/png');
}
(window as unknown as { __k: unknown }).__k = { enterStyle: (st: number) => { const p = city.props.find((q) => q.kind === 'house' && (q.style ?? 1) === st && (q.variant ?? 0) <= 2 && !q.shop); if (p) enterHouse(p); return !!p; }, telef: () => teleferico(), tpSoft: (x: number, y: number) => { state.fx = x; state.fy = y; }, npcPortrait: (nm: string) => { const n = npcSys.npcs.find((q) => q.def.name === nm); if (!n) return null; portraits.delete(nm); return portraitOf(nm, n.hero.root); }, cityW: () => city, kits: () => KITS, particles: () => particles, closeDlg: () => dlg.close(), showCreate: () => showCreate(false), tree: () => tree, cmd: (line: string) => { const [c, ...rest] = line.replace(/^\//, '').split(/\s+/); return betaCommand(c, rest); }, carav: () => caravans, obras: () => obras, kbuild: () => build, cutOn: () => cliqueSys.cutOn, kgame: () => game, perf: () => perfReport(), objStats: () => { const by = new Map<string, number>(); let n = 0; const kindOf2 = (o: THREE.Object3D) => { let q: THREE.Object3D | null = o; while (q) { if (q.userData.kind) return q.userData.kind as string; q = q.parent; } let top: THREE.Object3D = o; while (top.parent && top.parent !== scene) top = top.parent; return '?' + (top.name || top.type) + (top === objs.group ? ':objs' : '') + ':' + (o.name || ''); }; scene.traverseVisible((o) => { n++; if (!(o as THREE.Mesh).isMesh && o.type !== 'Group') return; const k = kindOf2(o) + ':' + o.type; by.set(k, (by.get(k) ?? 0) + 1); }); return { n, by: Object.fromEntries([...by.entries()].sort((a, b) => b[1] - a[1])), calls: renderer.info.render.calls, tris: renderer.info.render.triangles }; }, mmBase: () => mmBase, castleF: () => inside?.castle ?? null, castleInt: () => casteloSys.castleInt, cut: () => CUT.uCut.value.toArray(), cutSet: (x: number, y: number, r: number, d: number) => CUT.uCut.value.set(x, y, r, d), sweep: () => geoSweep([scene]), objs: () => objs, dwarf: (r: string) => openDwarfCart(r), festaNow: (st: string, o: FestaOpts) => startFesta(st, o), karmaSet: (v: number) => { state.karma = v; }, karmaAdd: (v: number) => addKarma(v), ritual: () => checkRitual(), cross: (back: boolean) => { const p = myPath(); if (p) crossOver(p, back); }, soulS: () => soul.s, portrait, THREE, stable: () => stable, night: (v: number | null) => { nightOverride = v; if (v !== null) entradaSys.nightTarget = v; }, pic: () => slotPic(), cls: (n: string) => { if (game.changeClass(n)) { tree.migrate(); applyKitAll(); applyRes(); } return game.classInfo?.name; }, gh: (x: number, y: number) => groundH(x * T, y * T), info: () => ({ ...renderer.info.render, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }), hero: () => hero, game, quests: () => quests, npcs: () => npcSys, scene: () => scene, cam: () => camera, renderer, composer: () => composer, dual: () => dual, inv: () => inv, ride: (on: boolean) => setRiding(on), city, touch: touchRelic, build: () => build, tp: (x: number, y: number, n?: number) => { state.fx = x; state.fy = y; objs.update(x * T, y * T, true); if (n !== undefined) { nightOverride = n; entradaSys.nightTarget = n; state.night = n; } }, zoom: (z: number) => { zoomTarget = z; zoom = z; }, enterHome: () => { if (construcaoSys.homeProp) enterHouse(construcaoSys.homeProp); }, place: (id: string) => placeDecor(id), enterProp: (p: (typeof city.props)[number]) => enterHouse(p), props: () => city.props, sets: () => city.settlements, vfx: () => import('./sistemas/vfx'), enter: (v: number | string) => { const p = city.props.find((q) => q.kind === 'house' && (typeof v === 'string' ? q.shop === v : q.variant === v)); if (p) enterHouse(p); }, mouse: (x: number, z: number) => { mouse.x = x; mouse.z = z; }, global: (id: string | null | undefined) => { gForce = id; gChkT = 0; luaK = id === 'lua' ? 1 : 0; aurK = id === 'aurora' ? 1 : 0; }, exit: () => exitHouse(), hall: () => { if (HALL_GATE) enterHall(HALL_GATE); return !!HALL_GATE; }, heroY: () => heroY, sitBench: (i: number) => { const bs = city.props.filter((q) => q.kind === 'bench'); const p = bs[i]; if (!p) return null; const bx = (p.gx + 0.5) * T, bz = (p.gy + 0.5) * T, fp = city.props.find((q) => q.kind === 'fountain')!; casteloSys.sitting = benchSeat(bx, bz, fp); state.fx = casteloSys.sitting.x; state.fy = casteloSys.sitting.y; return p; }, crypt: (f: number) => { const p = city.props.find((q) => q.kind === 'church' && q.variant === 2); if (p) enterCrypt(f, p); } };
const OXY = (gx: number, gy: number) => ({ x: (gx + 52 + OFX) * T, z: (gy + 54 + OFY) * T });
/* quem mora onde: nórdicos só no norte gelado; nas vilas comuns, humanos (e elfos nas florestas); ofícios de forja/cerveja/arma podem ser nórdicos ou anões */
const CRAFT_ROLES = /ferreir|armeir|armadur|cervej|churras|construtor|forja|minerad/i;
function civilFor(role: string, kind: Kind, tx: number, ty: number, seed: number): 'human' | 'elf' | undefined {
  if (kind === 'technocrat') return undefined;
  const z = zoneW(Math.round(tx), Math.round(ty));
  if (z.snow > 0.5) return undefined; // região nórdica: nórdicos e anões como são
  if (kind === 'dwarf') return undefined; // anões são anões em qualquer lugar
  if (/Lithendel|élfic/i.test(role)) return 'elf'; // os anciões de Lithendel são elfos, sempre
  if (CRAFT_ROLES.test(role)) return undefined; // ofício de raça
  if (/paladin|alfa/i.test(role)) return undefined; // armadura do caminho
  const elfRole = /caçad|alquim|domad|aldeã|aldeão|sábi|lenhad/i.test(role);
  if (z.forest > 0.45 && elfRole && (Math.abs(Math.sin(seed * 12.9898)) % 1) < 0.6) return 'elf';
  return 'human';
}
const npcSys = createNpcs(scene, [
  /* 08/11 Honra Kármica (sistemas/honra.ts): o Comendador vende peças épicas pagas em honra */
  { name: 'Comendador Aldric Vozalta', role: 'Guardião da Honra Kármica', kind: 'nordic', ...OXY(15.5, 20.5), radius: 1.0, tint: 0xc0a040, scale: 1.04, lines: ['Honra não se compra com ouro. Ganha-se fazendo o que precisa ser feito: missões, elites, masmorras.', 'Cada peça desta mesa tem um nome gravado por dentro. O seu entra quando você merecer.'] },
  { name: 'Garrick', role: 'Guarda da cidade', kind: 'nordic', civil: 'human', ...OXY(14.5, 16.5), radius: 3, tint: 0x6a7a9a, scale: 1.0, lines: ['Karmika não esquece. Cada escolha deixa uma marca.', 'Cuidado com o Acampamento Draugr, ao sul.', 'Os lobos descem do leste quando a noite cai.'] },
  { name: 'Thorin', role: 'Mercador', kind: 'dwarf', ...OXY(13, 14.5), radius: 1.5, tint: 0xb08a40, scale: 1.0, lines: ['Poções, couro, sorte... tudo tem preço!', 'Traga ouro e eu te mostro algo que brilha.', 'Dizem que um diabrete carrega uma maça de ferro negro.'] },
  { name: 'Eldrin', role: 'Sábio do Templo', kind: 'technocrat', ...OXY(12.5, 8.5), radius: 2, tint: 0x8f7bff, scale: 1.0, lines: ['A morte não é o fim, viajante. É só uma curva.', 'Sua alma carrega o que você foi.', 'O Olho de Karmika vê além do que você fez.'] },
  { name: 'Doran', role: 'Armeiro', kind: 'nordic', ...OXY(31, 17.5), radius: 2, tint: 0x7a4a2a, scale: 1.08, lines: ['Aço bom não nasce com pressa.', 'Volte quando tiver minério e coragem.'] },
  { name: 'Lúcia', role: 'Aldeã', kind: 'nordic', civil: 'human', ...OXY(19.5, 21), radius: 3, tint: 0xc08a8a, scale: 0.92, lines: ['A fonte nunca seca, nem no inverno.', 'Meu marido foi caçar ao norte e ainda não voltou...'] },
  { name: 'Olaf', role: 'Bêbado', kind: 'dwarf', ...OXY(25, 11.5), radius: 1.2, tint: 0x8a6a8a, scale: 0.95, lines: ['*hic* Eu vi um lobo falar... juro!', 'Mais uma cerveja e eu te conto tudo.'] },
  { name: 'Maren', role: 'Armadureira', kind: 'nordic', ...OXY(28, 11.5), radius: 1.5, tint: 0x9a8a7a, scale: 1.0, lines: ['Couro bem curtido vale mais que ferro mal batido.', 'Traga couro de lobo e eu pago o dobro do mercador.', 'Quer armadura de verdade? Os melhores armadureiros são os anões de Askavik, a cidade grande ao sul. Mas cobram caro.'] },
  { name: 'Morwen', role: 'Alquimista', kind: 'technocrat', ...OXY(23.5, 19.5), radius: 1.5, tint: 0x7a5aa0, scale: 0.95, lines: ['Pó de fada, seiva viva... tudo vira poção nas minhas mãos.', 'A Academia de Askavik ensina alquimia de verdade. Eu só aprendi o que a floresta me contou.', 'Um tônico antes da caçada salva mais vidas que um escudo.'] },
  { name: 'Tessa', role: 'Cervejeira', kind: 'nordic', ...OXY(21, 11.5), radius: 2, tint: 0xc08a50, scale: 1.0, lines: ['Cerveja de Karmika: lúpulo do norte e água da fonte.', 'O hidromel dos anões de Askavik faz um guerreiro cantar e lutar ao mesmo tempo. O meu só faz cantar.', 'Olaf já bebeu o estoque de uma semana. Não vendo mais fiado.'] },
  { name: 'Sven', role: 'Churrasqueiro', kind: 'dwarf', ...OXY(27, 25.5), radius: 1.2, tint: 0xa0603a, scale: 1.0, lines: ['Javali no espeto, três horas na brasa. Sente o cheiro?', 'Compro carne crua. Quanto mais gorda, melhor.', 'Os mestres do churrasco ficam em Hallenheim, na praça do mercado. Um dia chego lá.'] },
  { name: 'Bruno', role: 'Charcuteiro', kind: 'nordic', civil: 'human', ...OXY(9.5, 25.5), radius: 1.5, tint: 0x8a5a4a, scale: 1.05, lines: ['Linguiça defumada dura o inverno inteiro na mochila.', 'Pago o dobro por carne crua — a defumação é segredo de família.', 'A charcutaria mais famosa é a dos irmãos Varg, em Askavik. Aprendi com o pai deles.'] },
  { name: 'Rosália', role: 'Cozinheira', kind: 'nordic', civil: 'human', ...OXY(16.5, 26), radius: 2, tint: 0xd0a080, scale: 0.92, lines: ['Ensopado de caça da casa: carne, raízes e um segredo.', 'Carne crua cura pouco. Assada cura mais. A minha cura de verdade.', 'Quer aprender a cozinhar? Comece na fogueira. Os grandes chefs estão nas cozinhas reais de Hallenheim.'] },
  { name: 'Tomás', role: 'Lenhador', kind: 'nordic', civil: 'human', ...OXY(9.5, 11.5), radius: 2, tint: 0x6a7a4a, scale: 1.1, lines: ['Machado afiado, tronco certo. Floresta não acaba se você respeitar.', 'Compro toras e galhos. Madeira de lei vale mais.', 'Os lenhadores da Floresta Negra, ao norte de Askavik, derrubam carvalhos de cem anos. Isso é profissão.'] },
  { name: 'Kaela', role: 'Caçadora', kind: 'nordic', civil: 'elf', ...OXY(3, 25.5), radius: 2, tint: 0x5a7a5a, scale: 0.98, lines: ['Cervo dá couro e carne. Lobo dá couro e cicatrizes.', 'Compro couro e garras. Carne também, se estiver fresca.', 'A Irmandade dos Caçadores em Askavik ensina a rastrear. Lá você vira caçador de verdade — eu só sobrevivo.'] },
  { name: 'Gunnar', role: 'Construtor', kind: 'dwarf', ...OXY(31, 10.5), radius: 1.5, tint: 0x8a7a6a, scale: 1.0, lines: ['Tábua, prego e bloco. Com isso se levanta uma casa.', 'Compro madeira e pedra. Vendo material para quem quer construir.', 'Em breve você poderá erguer sua própria casa em Karmika. Os mestres construtores de Hallenheim fazem castelos — comece pelo galpão.'] },
  { name: 'Corwin', role: 'Domador', kind: 'technocrat', ...OXY(34.5, 24.5), radius: 1.5, tint: 0xd0702a, scale: 0.95, lines: ['Uma raposa adestrada busca o que cai no chão. Você só caça.', 'Os domadores de Askavik treinam ursos e falcões. Aqui, raposas e filhotes.', 'Trate bem seu companheiro. Ele lembra.'] },
  { name: 'Orm', role: 'Estalajadeiro', kind: 'dwarf', ...OXY(2.5, 18.5), radius: 1.5, tint: 0x6a4a2e, scale: 1.0, lines: ['Cavalo bom encurta a estrada. Z para montar, Z para descer.', 'Em combate o cavalo empina e você desce. Não adianta brigar montado — ainda.', 'Os haras de Hallenheim criam corcéis de guerra. O meu baio é honesto, só isso.'] },
  ...city.settlements.flatMap((st) => st.npcs.map((n, i) => ({ name: n.name, role: n.role, kind: n.kind, civil: civilFor(n.role, n.kind, n.x, n.y, st.x + i), x: n.x * T, z: n.y * T, radius: n.radius, tint: n.tint, scale: n.scale, lines: n.lines, night: n.night, onlyQ: n.onlyQ, fixed: n.fixed, yOff: n.yOff }))),
  /* 26/10 (Erling: "formações de soldados da cidade média andando em grupos pela estrada fazendo patrulhamento"): de Lumenhal, Askavik e
     Karmika saem colunas de 3 soldados pelas estradas principais, vão até a vila vizinha e voltam; um sargento à frente, dois atrás */
  ...(() => { const out: NpcDef[] = []; const PATROLS: [string, string][] = [['Lumenhal', 'Vatnaholt'], ['Lumenhal', 'Myrbakki'], ['Askavik', 'Lundr'], ['Askavik', 'Hrafnhöfn'], ['Askavik', 'Kaldrfoss'], ['Karmika', 'Lundr'], ['Karmika', 'Vestheim'], ['Karmika', 'Sudrholt']];
    const RANK = ['Sargento', 'Soldado', 'Soldado'], NM = [['Osvald', 'Finn', 'Bragi'], ['Sigrun', 'Kari', 'Hakon'], ['Dag', 'Tove', 'Ulf'], ['Ingrid', 'Bjarne', 'Rolf'], ['Erlend', 'Gyda', 'Sten'], ['Halle', 'Vidar', 'Liv'], ['Orm', 'Tyra', 'Geir'], ['Svein', 'Runa', 'Ketil']];
    PATROLS.forEach(([a, b], pi) => { const l = (city.roadLinks ?? []).find((q) => (q.a === a && q.b === b) || (q.a === b && q.b === a)); if (!l) return; let p = city.roadPaths[l.i]; if (!p || p.length < 20) return; if (l.a !== a) p = [...p].reverse();
      const route = p.map((q) => ({ x: (q.x + 0.5) * T, z: (q.y + 0.5) * T }));
      for (let k = 0; k < 3; k++) out.push({ name: `${RANK[k]} ${NM[pi % NM.length][k]}`, role: `Patrulha de ${a}`, kind: 'nordic', x: route[0].x, z: route[0].z, radius: 0, tint: 0x5a6a8a, scale: 1.0, pace: 2.1, ri0: Math.min(route.length - 3, Math.floor(route.length * ((0.23 + pi * 0.37) % 0.8)) + Math.max(0, 2 - k * 2)), /* cada patrulha começa num ponto da estrada (antes as 9 nasciam juntas dentro de Karmika: ~550 desenhos na praça) */
        lines: k === 0 ? [`Patrulha de ${a}. A estrada até ${b} está sob nossa vista.`, 'Fique na estrada, caminhante. No mato ninguém ouve você gritar.', 'Se vir fumaça fora da estrada, não vá olhar. Avise a torre.'] : ['Marchando desde a alvorada. As botas é que sabem.', `O sargento diz que ${b} nos espera com cerveja. Duvido.`, 'Ontem foram lobos. Hoje, salteadores. Amanhã, quem sabe.'], route }); });
    return out; })(),
  /* 08/11 O GRANDE SALÃO DE BRASAFORJA por dentro (Erling: "nem tem NPC trabalhando nem o rei anão para falar comigo e me dar missões de história;
     fornalhas com anões trabalhando; lojinhas"): o Rei no estrado, os forjadores nas fornalhas e nos caldeirões, as vendedoras do Mercado das Galerias.
     Coordenadas do salão (salao3d.ts: W 54 × D 42, origem no canto noroeste) somadas ao canto do interior (4000, 4000). */
  ...([
    ['Rei Thrain Coroa-de-Ferro', 'Rei dos Anões de Brasaforja', 27, 11.5, 0.6, 0xc8a040, 1.12, ['Aproxime-se. A montanha ouve tudo o que se diz debaixo dela.', 'Meu pai fechou a porta das galerias de baixo. Eu a mantenho fechada. Um dia alguém vai ter que descer.', 'Ouro compra ferro. Honra compra o resto.']],
    ['Conselheira Brynja Olho-de-Prata', 'Conselheira do Rei', 24, 12.5, 1.0, 0x8a8aa0, 0.98, ['O Rei fala pouco. Eu falo o que ele não diz.', 'As veias da montanha estão mudando de cor. Isso nunca é bom.']],
    ['Guarda Real Dagr', 'Guarda Real', 31.5, 13.5, 0.4, 0x5a6a8a, 1.05, ['Fale com o Rei com a arma guardada.', 'Ninguém passa do estrado. Nem anão.']],
    ['Guarda Real Hallvard', 'Guarda Real', 22.5, 13.5, 0.4, 0x5a6a8a, 1.05, ['Já vi essa porta de ferro aguentar um dragão. Aguenta você também.']],
    ['Mestre-Fundidor Ragnvald', 'Mestre da Fundição', 13, 9.5, 1.2, 0x7a3a1a, 1.0, ['O ferro desce pela calha quando a montanha quer. Nós só seguramos o caldeirão.', 'Cuidado com os respingos. Já vi barba pegar fogo por menos.']],
    ['Fundidora Ásta Respingo', 'Fundidora', 41, 9.5, 1.2, 0x8a4a2a, 0.96, ['Caldeirão cheio, barra nova. Caldeirão vazio, cerveja.', 'O ferro de Brasaforja não enferruja. É o calor da Mãe que fica dentro dele.']],
    ['Ferreiro Kolli Mão-Queimada', 'Ferreiro do Salão', 9, 19, 1.5, 0x6a4a2a, 1.0, ['Mil marteladas para uma lâmina. Novecentas e noventa e nove para quem tem pressa.', 'O Rei quer um machado novo. O Rei vai esperar como todo mundo.']],
    ['Ferreira Yrsa Faísca', 'Ferreira do Salão', 45, 19, 1.5, 0x7a4a3a, 0.96, ['Ouve o ferro cantar? Está quase na hora de temperar.', 'Minha avó forjou a coroa do avô do Rei. A família não parou.']],
    ['Aprendiz Kjell', 'Aprendiz de Fundição', 13, 14, 2.0, 0x8a6a3a, 0.9, ['O Mestre mandou eu olhar o caldeirão. Faz três horas que eu olho.', 'Um dia eu também vou ter a mão queimada. É sinal de ferreiro de verdade.']],
    ['Vendedora Gunnhild Trança-de-Ferro', 'Armaria Real', 44, 33, 1.0, 0x6a3a2a, 0.98, ['Aço do próprio Salão. Não tem melhor em Karmika inteira.', 'Cada peça aqui passou pela mão de um mestre. Por isso custa o que custa.'], 'armeiro'],
    ['Vendedor Bombur Pança-Larga', 'Despensa do Salão', 47, 29, 1.0, 0xa06a3a, 1.0, ['Carne defumada, cerveja preta e pão de pedra. Comida de anão: pesa e aquece.', 'O Rei come o mesmo que eu. Só que mais.'], 'cervejaria'],
    ['Vendedora Eir Pó-de-Gema', 'Gemas e Poções', 41, 37, 1.0, 0x4a6a8a, 0.95, ['Poção azul da Brasa e gemas da veia funda. Para quem tem ouro.', 'Essa aqui brilha no escuro. Essa outra só brilha quando mente perto dela.'], 'pocoes'],
    ['Escriba Hákon Pena-de-Ferro', 'Escriba Real', 7, 30, 1.2, 0x5a5a6a, 0.95, ['Cada barra que sai daqui está neste livro. Cada anão também.', 'A Porta de Pedra Preta está no livro mais velho. E está escrita: não abrir.']],
  ] as [string, string, number, number, number, number, number, string[], string?][]).map(([name, role, x, z, radius, tint, scale, lines]) => ({ name, role, kind: 'dwarf' as const, inside: 'hall', x: 4000 + x, z: 4000 + z, radius, tint, scale, lines })),
  /* 09/11 A COPA DA ÁRVORE-MÃE por dentro (Erling: "a Rainha dos elfos com outros líderes que passam missões e falam sobre o estado do mundo;
     um NPC que troca alinhamento por itens bons"). Coordenadas do salão (copa3d.ts: W 44 × D 36, origem noroeste) + (4000, 4000). */
  ...([
    ['Rainha Galadhwen Folha-de-Prata', 'Rainha dos Elfos de Lithendel', 22, 8.2, 0.6, 0xe0e8f0, 1.06, ['Sente o vento? Ele vem do norte, e traz cinza. A Montanha Negra tosse de novo.', 'Os homens de Karmika constroem muros. Os anões cavam. Nós escutamos. Alguém precisa escutar.', 'A Árvore-Mãe bebeu desta nascente por mil anos. Se a água parar, nós paramos.'], 'f'],
    ['Conselheiro Thalorien', 'Conselheiro da Mata · élfico', 15.4, 12.9, 0.5, 0x5a8a6a, 1.02, ['Vestheim julga, Skógar caça, Mýrarvik pesca. E todos mandam cartas para cá quando o mal chega.', 'O mapa na Mesa do Mundo foi esculpido pelo meu avô. As fronteiras mudaram. A madeira, não.']],
    ['Conselheira Nimrodel', 'Guardiã das Fronteiras · élfica', 28.6, 12.9, 0.5, 0x4a7a8a, 1.02, ['As patrulhas de Skógar viram pegadas de ratazana do tamanho de um cão. Isso não é natural.', 'Hvítadalr pede ajuda contra o gelo. Os homens de lá são teimosos, mas não mentem.'], 'f'],
    ['Sacerdotisa Ithilwen', 'A Balança da Copa · élfica', 32, 18.9, 0.6, 0xd8c8f0, 1.0, ['Luz demais cega. Sombra demais apaga. Eu devolvo a balança ao centro — e cobro por isso.', 'Traga-me o peso da sua alma. Eu lhe dou aço que não pesa nada.'], 'f', 'alma_copa'],
    ['Cronista Elendur', 'Cronista da Copa · élfico', 13, 23.4, 0.5, 0x8a8aa0, 1.0, ['Escrevo o que acontece em Karmika. Ultimamente escrevo depressa.', 'A Lua de Sangue vem mais cedo a cada ciclo. Isso está nos livros. Ninguém lê os livros.']],
    ['Arauto Faelon', 'Arauto da Rainha · élfico', 24.6, 27, 0.5, 0x9ab0c0, 1.0, ['A Rainha recebe quem a Árvore deixou subir. Aproxime-se do trono.', 'Fale baixo. As folhas repetem tudo.']],
    ['Guarda da Copa Lúthien', 'Guarda da Copa · élfica', 14.8, 7.2, 0.4, 0x5a7a6a, 1.02, ['…', 'A Rainha não precisa de guarda. Mas nós precisamos de guardá-la.'], 'f'],
    ['Guarda da Copa Amras', 'Guarda da Copa · élfico', 29.2, 7.2, 0.4, 0x5a7a6a, 1.02, ['…', 'Arco pronto, flecha no bolso. É assim que se dorme aqui.']],
  ] as [string, string, number, number, number, number, number, string[], ('m' | 'f')?, string?][]).map(([name, role, x, z, radius, tint, scale, lines, sex, shop]) => ({ name, role, kind: 'nordic' as const, civil: 'elf' as const, inside: 'copa', x: 4000 + x, z: 4000 + z, radius, tint, scale, lines, ...(name.startsWith('Rainha') ? { yOff: 0.75, fixed: true } : {}) /* 09/11: a Rainha de pé no alto do estrado */, ...(sex ? { sex } : {}), ...(shop ? { shop } : {}) })),
  /* 08/11 A BIGORNA MOLHADA por dentro — 10/11 refeita (interiors3d.ts variante 15: salão de 30 × 20 m, balcão ao fundo, cozinha à direita,
     despensa à esquerda, cova de fogo no meio, mesas compridas com bancos, palco do bardo perto da porta). Erling: "cheio de anões bebendo".
     Quem tem `seat` fica sentado no banco de frente para a mesa e bebe de vez em quando; coordenadas do salão + (4000, 4000).
     Bancos: mesa em (tx, tz) → assentos em tx ± 1,15 e tz −0,95 / 0 / +0,95 (lado esquerdo olha para +x, o direito para −x). */
  ...((): NpcDef[] => { const L = Math.PI / 2, R = -Math.PI / 2;
    const P = (name: string, role: string, x: number, z: number, tint: number, lines: string[], o: Partial<NpcDef> = {}): NpcDef => ({ name, role, kind: 'dwarf', inside: 'tavb', x: 4000 + x, z: 4000 + z, radius: 0.4, tint, scale: 1.0, lines, ...o });
    const S = (yaw: number) => ({ seat: { yaw, h: 0.48 }, radius: 0 });
    return [
      P('Taverneira Hildigunn Mão-de-Barril', 'Dona do balcão · bebidas', 15, 3.3, 0xa06a3a, ['Chope claro, chope preto, hidromel. Fala o que quer e põe a moeda no cobre.', 'Mesa para os amigos? A redonda perto da porta. Paga a reserva e ninguém senta nela.', 'Quem quebra caneca paga duas. Quem quebra o banco dorme lá fora.'], { radius: 1.6, sex: 'f' }),
      P('Assador Fróði Gordura-Quente', 'Assador da Bigorna Molhada', 16.9, 11.2, 0x8a4a2a, ['Javali da encosta, doze horas no espeto. Prova e me diz se não é a melhor carne de Karmika.', 'Quem pede bem passado paga o dobro. É a lei da casa.'], { radius: 0.5 }),
      P('Cozinheira Sif Colher-Grande', 'Cozinha da Bigorna', 25.6, 3.0, 0x9a5a3a, ['Sai da minha cozinha! … Tá, pode olhar. Não mexe no caldeirão.', 'Ensopado de cogumelo de caverna. A receita é da minha avó. A avó é segredo também.'], { radius: 1.4, sex: 'f' }),
      P('Bardo Lóðurr Corda-de-Cobre', 'Bardo', 3.2, 17.4, 0xa06a3a, ['♪ Sob a montanha arde a forja, sob a forja arde a sede ♪', 'Uma moeda, uma canção. Duas moedas, uma canção que presta.'], { radius: 0.6, yOff: 0.42, fixed: true }),
      P('Bebedor Thorgrim Caneca-Funda', 'Freguês', 2.45, 10.05, 0x6a4a3a, ['Mais uma! E uma para o meu amigo aqui que ainda não chegou.', 'Já bebi com o Rei. Ele perdeu. No dia seguinte ele negou.'], S(L)),
      P('Bebedora Ragna Riso-Alto', 'Freguesa', 4.75, 11.0, 0x7a4a4a, ['Senta, forasteiro! Primeira caneca é por minha conta, a segunda você canta.', 'Hildigunn serve. Fróði assa. Eu bebo. Cada um com o seu ofício.'], { ...S(R), sex: 'f' }),
      P('Velho Gísli Barba-de-Espuma', 'Freguês', 2.45, 11.95, 0x8a8a9a, ['Eu me lembro de quando isso aqui era só um barril e uma tábua. Estava melhor.', 'A cerveja preta tira a dor das costas. A segunda tira o resto.'], S(L)),
      P('Mineiro Hálfdan Sede-de-Pedra', 'Freguês', 2.45, 15.2, 0x5a4a3a, ['Doze horas na galeria. Doze canecas aqui. Equilíbrio.', 'Hoje a veia deu prata. Hoje eu pago.'], S(L)),
      P('Mineira Dagny Pó-de-Carvão', 'Freguesa', 4.75, 16.15, 0x4a4a4a, ['Lavei a cara para vir. Não reparou? É que o carvão não sai.', 'Se ouvir um estrondo lá do fundo, é a mina. Se ouvir dois, é o Hálfdan.'], { ...S(R), sex: 'f' }),
      P('Ferreiro Úlfr Braço-Torto', 'Freguês', 25.25, 10.05, 0x6a3a2a, ['Martelei o dia inteiro. Agora quero uma coisa que não precisa martelar: chope.', 'Esse braço? Bigorna caiu. A bigorna ficou pior.'], S(L)),
      P('Bebedora Hrefna Canta-Alto', 'Freguesa', 27.55, 11.0, 0x8a4a6a, ['Quando o bardo cansa, eu canto. Quando eu canto, o bardo volta correndo.', 'Brinde! A quê? Tanto faz. Brinde!'], { ...S(R), sex: 'f' }),
      P('Caçador Eyvind Rastro-Frio', 'Freguês', 25.25, 15.2, 0x4a5a3a, ['Javali grande na encosta essa semana. O Fróði agradece, eu cobro.', 'Vi pegada de lobo do tamanho de um prato perto da Estrada do Carvão. Um lobo, não um prato.'], S(L)),
      P('Velho Ketill Sem-Dente', 'Freguês', 27.55, 14.25, 0x8a8a8a, ['Carne? Eu tomo a carne em forma de cerveja. Mais fácil de mastigar.', 'No meu tempo a caneca era de pedra. E a gente era mais forte. E mais burro.'], S(R)),
      P('Guarda Ásgeir de Folga', 'Freguês · guarda de folga', 8.45, 11.6, 0x5a5a6a, ['Hoje não estou de guarda. Hoje estou de caneca.', 'Se houver briga, eu não vi. Estou de folga.'], S(L)),
      P('Bebedor Bragi Copo-Cheio', 'Freguês', 21.55, 12.55, 0x7a5a3a, ['O segredo é nunca deixar a caneca vazia. Nem um minuto. Nunca.', 'Fala com a Hildigunn: ela reserva a mesa redonda para o seu grupo. Já reservei para mim e para mim mesmo.'], S(R)),
      P('Bebedora Sigrid Dente-de-Ouro', 'Freguesa', 10.75, 10.65, 0xc9a24a, ['Esse dente? Ganhei numa queda de braço. O outro dente perdeu.', 'Se você ganhar de mim na queda de braço, pago a próxima. Ninguém ganhou ainda.'], { ...S(R), sex: 'f' }),
    ]; })(),
  // caravanas: mercadores viajantes que percorrem as estradas mais longas, com uma mula de carga
  ...[...city.roadPaths].map((p, i) => ({ p, i })).filter(({ p }) => p.length > 40).sort((a, b) => b.p.length - a.p.length).slice(0, 7).map(({ p, i }, k) => ({ name: ['Caravana de Gaspar', 'Caravana de Dagny', 'Caravana de Tomé', 'Caravana de Leonor', 'Caravana de Nori', 'Caravana de Inês', 'Caravana de Duarte'][k], role: 'Mercador viajante', kind: (i % 2 ? 'dwarf' : 'nordic') as 'dwarf' | 'nordic', civil: (i % 2 ? undefined : 'human') as 'human' | undefined, x: (p[0].x + 0.5) * T, z: (p[0].y + 0.5) * T, radius: 0, tint: 0xb08a40, scale: 1.0, lines: ['Estrada longa, bolso curto. O que procura?', 'Entre uma vila e outra tem lobo, tem chuva e tem lucro.', 'Compro o que você caçou. Vendo o que você esqueceu.'], route: p.map((q) => ({ x: (q.x + 0.5) * T, z: (q.y + 0.5) * T })) })),
], { heightAt, insideId: () => (inside?.canopy ? 'copa' : inside?.hall ? 'hall' : inside?.prop?.shop === 'cervejaria' ? 'tavb' : null), insideFree: (x, z) => !!inside && inside.int.free(x - 4000, z - 4000), walkable: (x, z) => { const t = city.map[Math.floor(z / T)]?.[Math.floor(x / T)]; if (!t || !isWalkable(t)) return false; try { return !solidHit(x / T, z / T, false) && !lowWallHit(x / T, z / T); } catch { return true; } /* NPC respeita fonte, poço, bancada (25/10) e, desde 27/10 (regra 19), também correio, banco, barraca, quadro e muro baixo */ }, camera, canvas,
  questOn: (id) => { try { return !!quests.q.active[id]; } catch { return false; } },
  /* 10/11: a guarda luta com os bichos (npcs.ts) e a fofoca segue o karma */
  threats: () => (inside ? [] : game.enemies.list.filter((e) => e.active && e.alive && !(e as unknown as { ally?: boolean }).ally)) as never, hitThreat: (e, n, from) => { try { game.enemies.hurtBy(e as never, n, from); } catch { /* */ } }, karma: () => state.karma,
  situ: () => { const tags: string[] = []; try { const hr = gameHour(), g = globalNow()?.id, k = state.karma, pth = myPath(), tp = temperature();
    tags.push(hr >= 5 && hr < 9 ? 'manha' : state.night > 0.5 ? 'noite' : 'dia'); if (tp < 3) tags.push('frio'); if (tp > 24) tags.push('calor');
    if (g === 'lua') tags.push('lua', 'lua'); if (g === 'aurora') tags.push('aurora', 'aurora');
    if (entradaSys.combatMode || game.enemies.list.some((e) => e.alive && e.active && (e.state === 'chase' || e.state === 'windup') && Math.hypot(e.pos.x - heroPos.x, e.pos.z - heroPos.z) < 14)) tags.push('combate', 'combate', 'combate');
    if (game.st.hp < game.st.hpMax * 0.35) tags.push('ferido', 'ferido'); if (compSys.riding) tags.push('montado'); if (compSys.pet) tags.push('pet');
    { const st = hereSettle(); if (st) { const v = align.get('vila', st.name); if (v >= 300) tags.push('rep_alta', 'rep_alta'); else if (v <= -250) tags.push('rep_baixa', 'rep_baixa');
      if (v >= (st.name === 'Karmika' ? 10 : 30) && !align.flag('festa_' + st.name) && leavingQuest(st.name)) tags.push('despedida', 'despedida', 'despedida'); if (align.flag('festa_' + st.name) === 1 && !festaSys.festa) tags.push('volta'); if (festaSys.festa) tags.push('festa', 'festa', 'festa', 'festa'); } }
    if (game.st.lvl < 5) tags.push('novato'); else if (game.st.lvl >= 30) tags.push('veterano'); if (k >= 100) tags.push('luz'); if (k <= -100) tags.push('sombra', 'sombra');
    const P: Record<string, string> = { vam: 'vam', lob: 'lob', mag: 'mag', bru: 'bru', pal: 'pal', cac: 'cac', tec: 'tecno' }; if (pth && P[pth]) tags.push(P[pth], P[pth]); else if (isWarrior()) tags.push('gue'); } catch { /* ainda carregando */ }
    return { tags, nome: profile?.name || 'caminhante', pet: compSys.pet?.kind.name ?? '' }; } });
/* ÁRVORE KÁRMICA DE MAGIAS e o que a classe pede: o título da árvore, os kits por classe, a fúria do guerreiro, o medidor da necessidade (sangue, lua) e o banquete depois do abate. Saiu do main.ts (02/11). → sistemas/arvore-classe.ts */
export interface ArvoreClasseCtx {
  readonly game: Widen<typeof game>;
  readonly profile: Profile | null;
  readonly quests: Widen<typeof quests>;
  readonly state: Widen<typeof state>;
  readonly kindOf: Widen<typeof kindOf>;
  readonly myPath: typeof myPath;
  readonly addKarma: typeof addKarma;
  readonly city: Widen<typeof city>;
  readonly npcSys: Widen<typeof npcSys>;
  readonly inv: Widen<typeof inv>;
  readonly netRef: Net | null;
  readonly stationNear: typeof stationNear;
  readonly hero: Hero3D;
  readonly particles: Widen<typeof particles>;
  readonly audio: Widen<typeof audio>;
  readonly craftJob: typeof craftJob;
}
var arvoreSys: ReturnType<typeof createArvoreClasse>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_arvoreSys() { return createArvoreClasse({ get game() { return game; }, get profile() { return profile; }, get quests() { return quests; }, get state() { return state; }, get kindOf() { return kindOf; }, get myPath() { return myPath; }, get addKarma() { return addKarma; }, get city() { return city; }, get npcSys() { return npcSys; }, get inv() { return inv; }, get netRef() { return netRef; }, get stationNear() { return stationNear; }, get hero() { return hero; }, get particles() { return particles; }, get audio() { return audio; }, get craftJob() { return craftJob; } }); }
arvoreSys ??= mk_arvoreSys();
const { tree, talents, talentKit, profs, mail, kitRace, SHOP_BY_NAME, SHADE_TOWNS } = arvoreSys;
function applyKitAll(...a: Parameters<ReturnType<typeof createArvoreClasse>['applyKitAll']>): ReturnType<ReturnType<typeof createArvoreClasse>['applyKitAll']> { return (arvoreSys ??= mk_arvoreSys()).applyKitAll(...a); }
function isWarrior(...a: Parameters<ReturnType<typeof createArvoreClasse>['isWarrior']>): ReturnType<ReturnType<typeof createArvoreClasse>['isWarrior']> { return (arvoreSys ??= mk_arvoreSys()).isWarrior(...a); }
function walksPath(...a: Parameters<ReturnType<typeof createArvoreClasse>['walksPath']>): ReturnType<ReturnType<typeof createArvoreClasse>['walksPath']> { return (arvoreSys ??= mk_arvoreSys()).walksPath(...a); }
function feastOnKill(...a: Parameters<ReturnType<typeof createArvoreClasse>['feastOnKill']>): ReturnType<ReturnType<typeof createArvoreClasse>['feastOnKill']> { return (arvoreSys ??= mk_arvoreSys()).feastOnKill(...a); }
function needGauge(...a: Parameters<ReturnType<typeof createArvoreClasse>['needGauge']>): ReturnType<ReturnType<typeof createArvoreClasse>['needGauge']> { return (arvoreSys ??= mk_arvoreSys()).needGauge(...a); }

/* TRABALHO NA BANCADA: o ícone do ofício com a barra girando, o trabalho em andamento e o assado na fogueira. Saiu do main.ts (02/11). → sistemas/bancada.ts */
export interface BancadaCtx {
  readonly hero: Hero3D;
  readonly audio: Widen<typeof audio>;
  readonly state: Widen<typeof state>;
  readonly game: Widen<typeof game>;
  readonly scene: Widen<typeof scene>;
  readonly inv: Widen<typeof inv>;
  readonly particles: Widen<typeof particles>;
  readonly profs: Widen<typeof profs>;
}
var bancadaSys: ReturnType<typeof createBancada>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_bancadaSys() { return createBancada({ get hero() { return hero; }, get audio() { return audio; }, get state() { return state; }, get game() { return game; }, get scene() { return scene; }, get inv() { return inv; }, get particles() { return particles; }, get profs() { return profs; } }); }
bancadaSys ??= mk_bancadaSys();
function craftJob(...a: Parameters<ReturnType<typeof createBancada>['craftJob']>): ReturnType<ReturnType<typeof createBancada>['craftJob']> { return (bancadaSys ??= mk_bancadaSys()).craftJob(...a); }
function roastAt(...a: Parameters<ReturnType<typeof createBancada>['roastAt']>): ReturnType<ReturnType<typeof createBancada>['roastAt']> { return (bancadaSys ??= mk_bancadaSys()).roastAt(...a); }

/* Shop: a loja (Premium e brasões). Pix ainda não ligado; no DEV simula o pagamento */
const ownsUniq = (u: string) => [...inv.gearBag, ...Object.values(inv.eq)].some((g) => g?.uniq === u);
if (IS_DEV) { (window as unknown as { __mail: unknown }).__mail = mail; (window as unknown as { __cineJump: (t: number) => void }).__cineJump = (t: number) => { if (cinemaSys.cine) cinemaSys.cine.t = t; }; }
const loja = createLoja({ isPremium, fac: myFac, mounts: shopMounts, pets: shopPets, preview: (m, price, buy) => openVitrine({ id: m.id, name: m.name, where: m.where, lvl: m.lvl, blurb: m.blurb, price, tag: m.kind === 'pet' ? ((m as { boss?: boolean }).boss ? 'Filhote de chefe' : 'Pet') : 'Montaria' }, buy), thumb: mountThumb, lvl: () => game.st.lvl, owns: ownsUniq, chars: () => inicio.chars(), inMenu: () => inicio.isOpen, dev: IS_DEV, log: (t, c) => game.logMsg(t, c), until: premiumUntil,
  /* toda compra do Shop chega pelo correio: o Premium vem como Selo (use ou venda), as peças vêm como anexo */
  deliver: (subj, text, att, to) => { const A = att.map((a) => a.seal ? { item: { id: a.seal, n: 1 } } : { gear: { ...facGear(a.fac!, a.slot!, FAC_ILVL), shop: true } });
    /* 26/10 (Erling): comprou DENTRO do jogo → caixa de correio do personagem que está jogando (como sempre foi). Comprou pelo MENU →
       inventário da conta, e de lá ele escolhe o personagem ou manda de presente a um amigo */
    if (inicio.isOpen) { social.toBox({ from: 'Shop de Askavik', subj, text, att: A }); return; } void to; mail.send('Shop de Askavik', subj, text, A); } });
onFac(() => loja.refresh());
/* o Premium comprado tem data para acabar (o interruptor do dev não tem) */
checkPremiumExpiry(); setInterval(checkPremiumExpiry, 30000);
/* interruptor de Premium só para o dev (debaixo do minimapa) */
if (IS_DEV) { const sw = document.createElement('div'); sw.id = 'devsw'; const draw = () => { const f = myFac(); sw.innerHTML = `<button data-prem class="dprem ${isPremium() ? 'on' : ''}" title="DEV · Premium ${isPremium() ? 'ligado' : 'desligado'} (clique para trocar)"><svg viewBox="0 0 32 32"><path d="M3 16c4-6 8.5-9 13-9s9 3 13 9c-4 6-8.5 9-13 9S7 22 3 16z" fill="#2a1a3a" stroke="#e6c46a" stroke-width="1.8"/><circle cx="16" cy="16" r="4.8" fill="#c9a0ff"/><circle cx="16" cy="16" r="1.9" fill="#140a1e"/></svg></button><span class="facsw" title="Lado do personagem (teste): Ordem do Fio · nenhum · Desfiados"><button data-fs="fio" class="${f === 'fio' ? 'on fio' : ''}">Fio</button><button data-fs="" class="${!f ? 'on' : ''}">—</button><button data-fs="desf" class="${f === 'desf' ? 'on desf' : ''}">Desf</button></span><small>DEV</small>`; }; draw();
  sw.addEventListener('click', (e) => { const el = e.target as HTMLElement, fb = el.closest('[data-fs]') as HTMLElement | null;
    if (fb) { const f = (fb.dataset.fs || null) as Fac | null; if (f === myFac()) return; setMyFac(f);
      /* dev: o que não for do lado novo sai do corpo; as peças do lado que faltarem chegam à mochila (sem repetir as que você já tem) */
      for (const sl of ['cape', 'shield', 'relic'] as Slot[]) { const g = inv.eq[sl]; if (g?.fac && g.fac !== f) inv.unequip(sl); }
      if (f) { if (game.st.lvl < 30) game.logMsg('⚑ DEV: as peças pedem nível 30 para vestir.', '#ff9a8a'); const have = new Set([...inv.gearBag, ...Object.values(inv.eq)].filter(Boolean).map((g) => g!.uniq));
        const miss = facSet(f, FAC_ILVL).filter((g) => !have.has(g.uniq)); for (const g of miss) inv.addGear(g);
        game.logMsg(`⚑ DEV: você agora é ${FAC[f].name}.${miss.length ? ` ${miss.length} peça${miss.length > 1 ? 's' : ''} com brasão na mochila.` : ' Você já tem as peças.'}`, f === 'fio' ? '#d9b45a' : '#e0303a'); }
      else game.logMsg('⚑ DEV: sem lado. As peças com brasão ficam na mochila, mas não podem ser vestidas.', '#b9c6e0');
      draw(); return; }
    if (el.closest('[data-prem]')) { setPremium(!isPremium()); draw(); } }); document.getElementById('mini')?.appendChild(sw); onFac(() => draw()); onPremium(() => draw()); }
/* 04/11: arrastar o mouse não seleciona texto em menu nenhum (só no chat e nos campos de digitar) */
document.addEventListener('selectstart', (e) => { const t = e.target as Node | null, el = (t && (t.nodeType === 1 ? t : t.parentNode)) as HTMLElement | null; if (el?.closest?.('input, textarea, [contenteditable="true"], #chat')) return; e.preventDefault(); }, { capture: true });
/* moldura das janelas acompanha a rolagem (04/11): o contorno pontilhado e as runas são desenhados por cima, presos à janela, não ao conteúdo */
document.addEventListener('scroll', (e) => { const t = e.target; if (t instanceof HTMLElement && t.matches('.pn, .dp, .panel')) { t.style.setProperty('--sy', `${t.scrollTop}px`); t.style.setProperty('--sx', `${t.scrollLeft}px`); } }, { capture: true, passive: true });
addEventListener('karmika:wswap', (e) => { if (game.st.dead || dlg.isOpen) return; inv.cycleWeapons((e as CustomEvent<number>).detail ?? 1); });
onPremium((v) => { inv.refresh(); quests.render(); game.logMsg(v ? '✦ Premium ativo: Bolsa do Caminhante (36), Bolsa Mágica, Bolsa de Ofício, 8 missões.' : 'Premium desligado: bolsas Premium lacradas (nada se perde), 4 missões.', v ? '#c9a0ff' : '#b9c6e0'); });
/* BUFFS NA TELA e SIGILOS NO CHÃO: o eco (alcançar o grupo), a bênção global, a runa da bênção, o brasão da facção e o sinal do renegado/desgarrado. Saiu do main.ts (02/11). → sistemas/buffs-sigilos.ts */
export interface BuffsSigilosCtx {
  readonly soul: Widen<typeof soul>;
  readonly game: Widen<typeof game>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly profile: Profile | null;
  readonly limiar: Widen<typeof limiar>;
  readonly hero: Hero3D;
  readonly particles: Widen<typeof particles>;
  readonly globalSide: typeof globalSide;
  readonly globalSideText: typeof globalSideText;
  readonly inv: Widen<typeof inv>;
  readonly vow: VowState;
  readonly scene: Widen<typeof scene>;
  readonly compSys: ReturnType<typeof createCompanheiros>;
}
var buffsSys: ReturnType<typeof createBuffsSigilos>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_buffsSys() { return createBuffsSigilos({ get soul() { return soul; }, get game() { return game; }, get inside() { return inside; }, get profile() { return profile; }, get limiar() { return limiar; }, get hero() { return hero; }, get particles() { return particles; }, get globalSide() { return globalSide; }, get globalSideText() { return globalSideText; }, get inv() { return inv; }, get vow() { return vow; }, get scene() { return scene; }, get compSys() { return compSys; } }); }
buffsSys ??= mk_buffsSys();
const { buffEl, blessRune } = buffsSys;
function makeBlessRune(...a: Parameters<ReturnType<typeof createBuffsSigilos>['makeBlessRune']>): ReturnType<ReturnType<typeof createBuffsSigilos>['makeBlessRune']> { return (buffsSys ??= mk_buffsSys()).makeBlessRune(...a); }
function updateFacSigil(...a: Parameters<ReturnType<typeof createBuffsSigilos>['updateFacSigil']>): ReturnType<ReturnType<typeof createBuffsSigilos>['updateFacSigil']> { return (buffsSys ??= mk_buffsSys()).updateFacSigil(...a); }
function updateOutSigil(...a: Parameters<ReturnType<typeof createBuffsSigilos>['updateOutSigil']>): ReturnType<ReturnType<typeof createBuffsSigilos>['updateOutSigil']> { return (buffsSys ??= mk_buffsSys()).updateOutSigil(...a); }

/* a Vidente dos Caminhos (Askavik, nível 30) */
const vid = createVidente({ karma: () => state.karma, name: () => profile?.name || 'Caminhante',
  onChoose: (p, rev) => {
    if (!profile) return; profile.path = p ? p.id : 'humano'; localStorage.setItem('karmika.char.v1', JSON.stringify(profile));
    if (!quests.q.done.includes('p01') && quests.q.active['p01'] && quests.complete(quests.def('p01'))) quests.turnIn(quests.def('p01'));
    if (!p) { /* 09/11: cada povo puro tem a sua missão de primeiros passos (e de destravamento do XP de classe) */
      const o = profile.origin ?? 'human';
      const PURE = o === 'dwarf' ? { chain: 'Fio de Bigode', name: 'A Promessa do Bigode', turnin: 'Thane Borin Barba-Longa', text: `A Deusa viu em você o ${rev.name}, mas você escolheu ficar anão. Anão não vira outra coisa por capricho: promessa de anão é fio de bigode, e você acabou de fazer uma. Volte a Brasaforja e diga ao Thane Borin que ficou. Ele vai medir.` }
        : o === 'elf' ? { chain: 'O Ciclo de Aliança', name: 'A Palavra da Mata', turnin: 'Anciã Faelwen', text: `A Deusa viu em você o ${rev.name}, mas você escolheu ficar elfo. A mata não pede que você seja outra coisa; pede que não traia o que é. Volte a Lithendel e diga à Anciã Faelwen que ficou. O ciclo de aliança continua com você.` }
        : { chain: 'O Caminho Humano', name: 'A Beleza de Ser Comum', turnin: 'Gunnar', text: `A Deusa viu em você o ${rev.name}, mas você escolheu esperar. Isso também é um caminho, e dos mais difíceis: o de quem não tem dom e mesmo assim fica de pé. Volte a Karmika e procure Gunnar, o construtor. Toda vida comum começa com uma casa.` };
      quests.accept({ id: 'v_hum', chain: PURE.chain, name: PURE.name, lvl: 20, giver: 'Hrefna', turnin: PURE.turnin, text: PURE.text, objs: [{ kind: 'talk', npc: PURE.turnin }], xp: 900, gold: 80 });
      game.logMsg(o === 'dwarf' ? '👁 Hrefna: “Ficar também é escolher. Fio de bigode não se mexe.”' : o === 'elf' ? '👁 Hrefna: “Ficar também é escolher. A mata lembra de quem fica.”' : '👁 Hrefna: “Esperar também é escolher. A vida comum tem a sua própria beleza.”', '#c9a0ff'); return; }
    const objs: { kind: 'talk' | 'visit'; npc?: string; poi?: string }[] = [];
    if (p.id === 'pal') objs.push({ kind: 'talk', npc: 'Paladino Aldric' });
    if (p.id !== 'tec') objs.push({ kind: 'visit', poi: p.village });
    const mentor = p.id === 'tec' ? 'Arquiteta Ylva' : p.mentor; objs.push({ kind: 'talk', npc: mentor });
    /* a prova do mestre: cada caminho tem a sua */
    const TRIAL: Record<string, [string, unknown]> = { gue: ['6× Lobo Gélido', { kind: 'kill', type: 'frostwolf', n: 6 }], pal: ['8× Zumbi', { kind: 'kill', type: 'zombie', n: 8 }], cac: ['6× Carniçal', { kind: 'kill', type: 'ghoul', n: 6 }], tec: ['forjar 3 vezes Pregos', { kind: 'craft', recipe: 'Pregos', n: 3 }], vam: ['6× Morcego', { kind: 'kill', type: 'bat', n: 6 }], lob: ['1× Lobisomem', { kind: 'kill', type: 'werewolf', n: 1 }], mag: ['6× Fada Maliciosa', { kind: 'kill', type: 'fairy', n: 6 }], bru: ['6× Diabrete', { kind: 'kill', type: 'imp', n: 6 }] };
    (objs as unknown[]).push(TRIAL[p.id][1]);
    quests.accept({ id: 'v_' + p.id, chain: 'O Caminho: ' + p.name, name: `O Caminho do ${p.name}`, lvl: 20, giver: 'Hrefna', turnin: mentor, text: `${p.line} Vá até ${p.place}${p.id === 'pal' ? ', levado pelo Paladino Aldric,' : ''} e apresente-se a ${mentor}. A prova: ${TRIAL[p.id][0]}. Ao passar e aceitar o mestre, a sua barra de classe recomeça do zero, sem volta.`, objs: objs as never, xp: 1200, gold: 100 });
    game.logMsg(`👁 Hrefna: “${p.mentor} espera por você. Que a Deusa encurte a sua estrada.”`, '#c9a0ff');
  } });
/* 09/11 (proposta A): a missão da Vidente é a missão de DESTRAVAMENTO do XP de classe. A raça sobe até 60; quando a missão termina
   (classe nova ou puro), o teto vai a 120. O id da missão (v_pal, v_hum…) diz o caminho escolhido. */
const unlockCls = () => { const done = quests.q.done.some((id) => id.startsWith('v_')); game.setClsCap(done || (profile?.path && profile.path !== 'humano' && game.classInfo.name !== RACES[state.race].label) ? 120 : 60); };
queueMicrotask(unlockCls);
queueMicrotask(() => quests.setOnDone?.((d) => { if (d.id.startsWith('v_')) unlockCls(); if (!d.id.startsWith('v_') || d.id === 'v_hum') { if (d.id === 'v_hum') game.logMsg('🏠 O caminho do seu povo começa de verdade: o nível de classe sobe agora até 120.', '#ffe08a'); return; }
  const p = PATHS.find((x) => 'v_' + x.id === d.id); if (!p) return; takeClass(p); }));
/** tornar-se a classe do caminho (a prova do mestre, ou o comando de teste /guerreiro, /paladino…) */
function takeClass(p: (typeof PATHS)[number]) { if (game.changeClass(p.cls)) { tree.startClass(); applyKitAll(); applyRes(); setTimeout(() => offerVow(p.id), 3500); game.logMsg(`✦ Você agora trilha o caminho de ${p.cls}. A barra de classe recomeça do zero e a Árvore Kármica é a da sua classe.`, p.col); game.dmgText(heroPosNow().clone().setY(heroPosNow().y + 3), p.cls.toUpperCase(), true, p.col);
    /* a primeira classe já é o lado (Erling, 22/10): Fio = paladino, caçador, mago; Desfiados = vampiro, lobisomem, bruxo.
       Guerreiro (caótico neutro) e tecnocrata (neutro de verdade) ficam neutros; uma missão do mestre valida o alinhamento depois. */
    takeNature(p.id);
    const side = ({ pal: 'fio', cac: 'fio', mag: 'fio', vam: 'desf', lob: 'desf', bru: 'desf' } as Record<string, Fac>)[p.id] ?? null;
    setMyFac(side); netRef?.lookNow();
    game.logMsg(side ? `⚑ O seu caminho jura com ${FAC[side].name}. “${FAC[side].motto}.”` : '⚖ O seu caminho é neutro. Uma missão do seu mestre vai validar o seu alinhamento.', side === 'fio' ? '#d9b45a' : side === 'desf' ? '#e0303a' : '#c8d8f0'); } }

/* menu do Esc: atalhos para as janelas de verdade */
setInterval(() => { if (!game.st.menuOpen) return; const set = (id: string, t: string) => { const el = document.getElementById(id); if (el) el.textContent = t; };
  set('m-acc', profile?.name ? `${profile.name} (local)` : 'local'); set('m-plan', isPremium() ? '✦ Premium' : 'Gratuito'); set('m-name', profile?.name || RACES[state.race].label); set('m-lvl', `${game.st.lvl} · ${game.classInfo.name}`); set('m-karma', String(Math.round(state.karma))); set('m-gold', String(game.st.gold)); }, 500);
document.querySelector('#menu [data-mclose]')?.addEventListener('click', () => { game.toggleMenu(false); keys.clear(); }); /* 07/11: o ✕ das opções */
document.querySelectorAll<HTMLButtonElement>('#menu nav button[data-go]').forEach((b) => b.addEventListener('click', () => { const g = b.dataset.go; game.toggleMenu(false); keys.clear();
  if (g === 'exit') exitToMenu(); else if (g === 'quit') { saveAllNow(); setTimeout(() => window.close(), 150); } }));
/* sair do jogo: guarda tudo e volta à tela inicial (escolha de personagem e de sala) */
function saveAllNow() { try { dispatchEvent(new Event('beforeunload')); } catch { /* */ } try { inv.save?.(); soul.save(); } catch { /* */ } }
function exitToMenu() { saveAllNow(); if (inside) leaveInteriorNow(); setTimeout(() => { if (location.search.includes('play')) location.href = location.pathname; else location.reload(); }, 120); }
/* ANDAR DE CONSUMÍVEIS (F1–F8): a ordem, os fixados, desenhar e usar. Saiu do main.ts (02/11). → sistemas/consumiveis.ts */
export interface ConsumiveisCtx {
  readonly inv: Widen<typeof inv>;
  readonly ITEMS_Q: Widen<typeof ITEMS_Q>;
  readonly game: Widen<typeof game>;
  readonly kitRace: Widen<typeof kitRace>;
  readonly audio: Widen<typeof audio>;
}
var quickSys: ReturnType<typeof createConsumiveis>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_quickSys() { return createConsumiveis({ get inv() { return inv; }, get ITEMS_Q() { return ITEMS_Q; }, get game() { return game; }, get kitRace() { return kitRace; }, get audio() { return audio; } }); }
quickSys ??= mk_quickSys();
function renderQuick(...a: Parameters<ReturnType<typeof createConsumiveis>['renderQuick']>): ReturnType<ReturnType<typeof createConsumiveis>['renderQuick']> { return (quickSys ??= mk_quickSys()).renderQuick(...a); }
function useQuick(...a: Parameters<ReturnType<typeof createConsumiveis>['useQuick']>): ReturnType<ReturnType<typeof createConsumiveis>['useQuick']> { return (quickSys ??= mk_quickSys()).useQuick(...a); }

/** equipamentos visíveis no herói (espada, escudo, elmo) */
/** 05/11 (Erling: "personagem senta atravessando o banco"): o banco de toras é fundo; sentado no meio dele, as canelas atravessavam a tora
 *  da frente. O quadril vai para a beira de quem olha para a fonte (22 cm à frente do centro), e os joelhos ficam para fora do assento */
/* 06/11 (Erling: "ainda está entrando no banco"): o banco do artista (vila_balanco, 0,95×) tem o assento mais alto que o banco desenhado:
   a altura do assento vem da própria malha (o topo do tronco de cima), não de um número fixo */
/** 10/11: a reserva da mesa redonda da Bigorna Molhada (vale uma hora) */
function tavReserve(): { by: string; until: number } | null { try { const r = JSON.parse(localStorage.getItem('karmika.tav.mesa') || 'null') as { by: string; until: number } | null; return r && r.until > Date.now() ? r : null; } catch { return null; } }
function benchSeat(bx: number, bz: number, fp: { gx: number; gy: number }) { const yaw = Math.atan2((fp.gx + 1) * T - bx, (fp.gy + 1) * T - bz), d = 0.22;
  const bg = artGeo('vila_balanco'); if (bg && !bg.boundingBox) bg.computeBoundingBox(); const h = bg?.boundingBox ? bg.boundingBox.max.y * 0.95 + 0.02 : 0.55;
  return { x: (bx + Math.sin(yaw) * d) / T, y: (bz + Math.cos(yaw) * d) / T, yaw, h }; }
function syncGear() { try { const eq = inv.eq; kkSetWeapon(eq.weapon?.base ?? '', !!eq.shield); /* 10/11 (teste_libs): a arma escolhe o jeito do golpe */ const wt = oficiosSys.work ? inv.tool(WORK[oficiosSys.work.kind].slot) : pescaSys.fishing ? inv.tool('rod') : null; /* trabalhando: a ferramenta continua na mão */ hero.setGear({ weapon: wt ? { base: wt.base, rarity: 'normal', tint: wt.tint, glow: wt.glow } : eq.weapon ? { base: eq.weapon.base, rarity: eq.weapon.rarity } : null, shield: eq.shield ? { base: eq.shield.base, rarity: eq.shield.rarity, seed: eq.shield.uid } : null, helm: eq.helm && localStorage.getItem('karmika.showHelm') !== '0' ? { base: eq.helm.base, rarity: eq.helm.rarity } : null, cape: eq.cape ? { base: eq.cape.base, rarity: eq.cape.rarity } : null, shoulders: eq.shoulders ? { base: eq.shoulders.base, rarity: eq.shoulders.rarity } : null }); checkSkinLevel(); game.setWeapon(wt ? null : eq.weapon?.base ?? null); } catch { /* inventário ainda não criado */ } }
/* COMPANHEIROS: o pet coletor, a montaria (montar e desmontar), as mulas das caravanas e as habilidades do pet. Saiu do main.ts (02/11). → sistemas/companheiros.ts */
export interface CompanheirosCtx {
  readonly game: Widen<typeof game>;
  readonly feats: Widen<typeof feats>;
  readonly hero: Hero3D;
  readonly npcSys: Widen<typeof npcSys>;
  readonly scene: Widen<typeof scene>;
  readonly heroPos: Widen<typeof heroPos>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly camera: Widen<typeof camera>;
  readonly canvas: Widen<typeof canvas>;
  readonly stable: Widen<typeof stable>;
  readonly IX: Widen<typeof IX>;
  readonly IZ: Widen<typeof IZ>;
  readonly city: Widen<typeof city>;
  readonly solidHit: typeof solidHit;
  readonly combatMode: Widen<typeof entradaSys.combatMode>;
  readonly swimmingNow: Widen<typeof swimmingNow>;
  readonly particles: Widen<typeof particles>;
  readonly inv: Widen<typeof inv>;
  readonly audio: Widen<typeof audio>;
}
var compSys: ReturnType<typeof createCompanheiros>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_compSys() { return createCompanheiros({ get game() { return game; }, get feats() { return feats; }, get hero() { return hero; }, get npcSys() { return npcSys; }, get scene() { return scene; }, get heroPos() { return heroPos; }, get inside() { return inside; }, get camera() { return camera; }, get canvas() { return canvas; }, get stable() { return stable; }, get IX() { return IX; }, get IZ() { return IZ; }, get city() { return city; }, get solidHit() { return solidHit; }, get combatMode() { return entradaSys.combatMode; }, get swimmingNow() { return swimmingNow; }, get particles() { return particles; }, get inv() { return inv; }, get audio() { return audio; } }); }
compSys ??= mk_compSys();
function setRiding(...a: Parameters<ReturnType<typeof createCompanheiros>['setRiding']>): ReturnType<ReturnType<typeof createCompanheiros>['setRiding']> { return (compSys ??= mk_compSys()).setRiding(...a); }
function updateCompanions(...a: Parameters<ReturnType<typeof createCompanheiros>['updateCompanions']>): ReturnType<ReturnType<typeof createCompanheiros>['updateCompanions']> { return (compSys ??= mk_compSys()).updateCompanions(...a); }

/* 02/11 (Erling): cada classe com as suas armas — vampiro: florete e adagas · lobisomem: porretes e garras · caçador: bestas (de duas e de uma mão), kunais e adagas.
   O que já estava vestido continua; a regra vale ao vestir. Escudo: essas três classes lutam sem escudo. */
const inv = createInventory(game, { reactor: () => ({ on: kitRace() === 'tecno', charge: game.reactor().charge, cap: game.reactorCap() }), fuse: () => { game.fuseReactor(); for (let i = 0; i < 40; i++) particles.spawn(heroPosNow().x, heroPosNow().y + 1.2, heroPosNow().z, { vx: (Math.random() - 0.5) * 3, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 3, life: 1, s0: 0.3, s1: 0.04, c0: 0xffffff, c1: 0x5ae0ff, a: 1, g: 2 }); },
  priceK: (shop) => shopLeanK(shop), /* 06/11: Engenheiro do Mundo — a Academia faz do tecnocrata um comerciante da Caravana de Latão */ sellK: (shop, id) => (shop === 'latao' && game.classInfo?.name === 'Tecnocrata' && GADGETS[id] ? 2 : 1), xpBonus: () => (vowKept() ? 0.05 : 0) + luaBonus() /* Lua de Sangue: o Faro da Lua ligado rende mais */,
  talents: () => { const a = talents.stats() as Record<string, number>, b = arvoreSys.classPassStats(); const o: Record<string, number> = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = (o[k] ?? 0) + v; for (const [k, v] of Object.entries(guildStats())) o[k] = (o[k] ?? 0) + v; /* 06/11: as habilidades da guilda */ return o as Partial<Record<string, number>>; }, /* 03/11: talentos + passivas de classe do compêndio */
  canWear: (g) => { const W = CLASS_WEAPONS[kitRace()]; if (W && g.slot === 'weapon' && !W.re.test(g.base)) return W.msg; if (W && g.slot === 'shield' && W.noShield && !(kitRace() === 'cac' && /Besta de Mão/.test(inv.eq.weapon?.base ?? ''))) return W.noShield; /* 02/11: besta de mão aceita escudo */
    return kitRace() === 'tecno' && g.slot === 'weapon' && g.only !== 'tec' ? 'Tecnocratas não usam espada, adaga, machado nem arco: só as armas da Academia (metralhadora, lança-chamas, lança-veneno). Sem elas, a Manopla de Tesla.' : g.only && !walksPath(g.only) ? `Só ${ONLY_NAME[g.only]} empunham ${g.name}.${g.only === 'dwarf' ? '' : ' Esse caminho se abre com a Vidente, no nível 30.'}` : null; },
  onGear: () => { syncGear(); dollPulse = performance.now(); }, onBag: () => renderQuick(),
  /* usar e vestir com corpo e som (25/10): gole, mastigada, pano, couro, metal, joia — e um brilho no herói */
  alignHtml: () => { try { return align.visitedHtml(); } catch { return ''; } },
  questItemLost: (qid, item) => { const d = quests.def(qid); if (d && quests.q.active[qid]) { quests.dropQuest(qid); game.logMsg(`◆ Você destruiu ${ITEMS_TBL[item]?.name ?? item}: a missão “${d.name}” foi abandonada. Pegue de novo com ${d.giver}.`, '#ffb060'); } },
  feel: (kind, id) => { const p = heroPos, y0 = heroY;
    if (kind === 'drink') { audio.gulp(); if (!hero.acting && !inside) { hero.drinkProp = 'vial'; hero.act('drink'); } for (let i = 0; i < 14; i++) particles.spawn(p.x + (Math.random() - 0.5) * 0.8, y0 + 0.3 + Math.random() * 1.2, p.z + (Math.random() - 0.5) * 0.8, { vy: 1.2 + Math.random(), life: 0.9, s0: 0.25, s1: 0.04, c0: 0xffffff, c1: /mana|🔮/.test(id) ? 0x5a8aff : 0xff4a6a, a: 0.9 }); }
    else if (kind === 'eat') { audio.chew(); if (!hero.acting && !inside) { hero.drinkProp = 'none'; hero.act('drink'); } for (let i = 0; i < 8; i++) particles.spawn(p.x + (Math.random() - 0.5) * 0.4, y0 + 1.5, p.z + (Math.random() - 0.5) * 0.4, { vx: (Math.random() - 0.5) * 1.5, vy: Math.random() * 1.2, vz: (Math.random() - 0.5) * 1.5, life: 0.5, s0: 0.14, s1: 0.04, c0: 0xe8c890, c1: 0x8a5a2a, a: 0.9, g: 4 }); }
    else if (kind === 'tool') audio.equip('tool');
    else if (kind === 'equip') { const sl = id; audio.equip(sl === 'ring' || sl === 'ring2' || sl === 'amulet' || sl === 'earring' || sl === 'earring2' ? 'jewel' : sl === 'cape' || sl === 'legs' ? 'cloth' : sl === 'boots' || sl === 'gloves' || sl === 'belt' ? 'leather' : 'metal');
      /* 07/11 (Erling: "quando troco de item ele agacha e não estica de novo"): sem a pose de guarda ao equipar — só o som e o brilho */ for (let i = 0; i < 22; i++) { const a = i / 22 * 6.283; particles.spawn(p.x + Math.cos(a) * 0.7, y0 + 0.2 + (i % 5) * 0.35, p.z + Math.sin(a) * 0.7, { vy: 0.8, life: 0.8, s0: 0.22, s1: 0.04, c0: 0xfff0bd, c1: 0xd9a24f, a: 0.9 }); } }
    else audio.pickup(); },
  onUse: (id) => { { const R3: Record<string, [string, string, string, string]> = { unguento_terra: ['Mago', 'agua_benta', 'Ritual do Aterramento', 'Unguento da Terra e Água Benta'], agua_benta: ['Mago', 'unguento_terra', 'Ritual do Aterramento', 'Unguento da Terra e Água Benta'], coracao_demonio: ['Bruxo', 'chifre_sangue', 'Oferenda do Pacto', 'Coração de Demônio e Chifre de Sangue'], chifre_sangue: ['Bruxo', 'coracao_demonio', 'Oferenda do Pacto', 'Coração de Demônio e Chifre de Sangue'], po_sono: ['Caçador de Demônios', 'sino_guarda', 'Sono Guardado', 'Pó do Sono Sem Sonhos e Sino de Guarda'], sino_guarda: ['Caçador de Demônios', 'po_sono', 'Sono Guardado', 'Pó do Sono Sem Sonhos e Sino de Guarda'] };
      const r = R3[id]; if (r) { let n = ''; try { n = game.classInfo.name; } catch { /* */ } if (n !== r[0]) { game.logMsg(`Isso é para ${r[2] === 'Oferenda do Pacto' ? 'a' : 'o'} ${r[2]} de quem segue o caminho de ${r[0]}.`, '#c8a890'); return true; } if (!inv.has(r[1])) { game.logMsg(`${r[2] === 'Oferenda do Pacto' ? 'A' : 'O'} ${r[2]} pede os dois: ${r[3]}.`, '#ffd88a'); return true; } inv.take(id); inv.take(r[1]); game.ritual3(); return true; } }
    if (id === 'pao_azimo' || id === 'vinho_santo') { if (kitRace() !== 'pal') { game.logMsg(id === 'pao_azimo' ? '🫓 Pão sem fermento, seco e sem graça. Isso é para o jejum dos paladinos.' : '🍷 Forte demais para beber à toa: é vinho de jejum dos paladinos.', '#c8a890'); return true; } if (!inv.has('pao_azimo') || !inv.has('vinho_santo')) { game.logMsg('✝ O Jejum e Oração pede os dois: o Pão Ázimo e o Vinho Santo dos Anões.', '#ffd88a'); return true; } inv.take('pao_azimo'); inv.take('vinho_santo'); game.fastPrayer(); return true; }
    if (id === 'reator_1' || id === 'reator_2') { if (kitRace() !== 'tecno' && state.race !== 'technocrat') { game.logMsg('Só tecnocratas carregam um reator pessoal.', '#ff9a8a'); return true; } if (game.installReactor(id === 'reator_2' ? 2 : 1, game.classInfo?.name === 'Engenheiro-Chefe' ? 2 : 1)) inv.take?.(id); return true; }
    const SEAL: Record<string, number> = { seal_p30: 30, seal_p90: 90, seal_p365: 365 };
    if (id === 'lagrima') { confirmBox('Trocar uma <b>Lágrima do Olho</b> por <b>60 dias de Premium</b>?<br><small>Ela não volta. Guardada, ela paga uma volta da alma no Limiar.</small>', 'Trocar', () => { if (!inv.take('lagrima', 1)) return; addPremiumDays(60); game.logMsg('💧 A Lágrima se desfaz em luz: +60 dias de Bênção de Marghar (Premium).', '#c9a0ff'); }); return true; }
    if (SEAL[id]) { if (!inv.take(id, 1)) return true; addPremiumDays(SEAL[id]); const d = Math.ceil((premiumUntil() - Date.now()) / 864e5); game.logMsg(`✦ Selo de Marghar rompido: +${SEAL[id]} dias de Premium (${d} dias no total).`, '#c9a0ff');
      /* 03/11: a comemoração — o herói dança, o brilho violeta e dourado sobe em volta dele e chega a mensagem de boas-vindas */
      dispatchEvent(new CustomEvent('karmika:celebrate')); hero.act('dance', true); audio.chime(); const hp = hero.root.position;
      for (let w = 0; w < 4; w++) setTimeout(() => { for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283; particles.spawn(hp.x + Math.cos(a) * 0.8, hp.y + 0.2, hp.z + Math.sin(a) * 0.8, { vx: Math.cos(a) * 1.6, vy: 1.5 + Math.random() * 2.5, vz: Math.sin(a) * 1.6, life: 1.4, s0: 0.3, s1: 0.04, c0: 0xffffff, c1: w % 2 ? 0xffd24a : 0xc9a0ff, a: 1, drag: 1.2, g: -0.3 }); } }, w * 500);
      dispatchEvent(new CustomEvent('karmika:burst', { detail: { c0: 0xffffff, c1: 0xc9a0ff, n: 180 } }));
      setTimeout(() => premiumWelcome(SEAL[id], d), 900); return true; }
    if (id === 'scroll_return') {
    if (inside) { game.logMsg('📜 O caminho não se abre entre paredes. Saia para o céu aberto.', '#ff9a8a'); return true; }
    const hp = heroPosNow(), hunted = game.enemies.list.some((e) => e.alive && e.active && (e.state === 'chase' || e.state === 'windup') && Math.hypot(e.pos.x - hp.x, e.pos.z - hp.z) < 16);
    if (hunted) { game.logMsg('📜 Há inimigos atrás de você — a Deusa não abre caminho no meio da luta.', '#ff9a8a'); return true; }
    if (entradaSys.combatMode) setCombat(false);
    inv.take('scroll_return', 1); openPortal(); game.logMsg('📜 O pergaminho se desfaz em luz violeta.', '#b8a8ff'); return true; } if (id === 'tome') { inv.take('tome', 1); tree.addBonus(5); return true; } if (DECOR[id]) { placeDecor(id); return true; } if (/^projeto_/.test(id)) { if (obras.busy()) { game.logMsg('🏗 Você já tem uma obra ou casa. Termine (ou desista dela no B) antes de começar outra.', '#ff9a8a'); return false; } if (inv.isOpen) inv.toggle(); return build.placeProject(id); } if (/^ajudante_obra(_2|_3)?$/.test(id)) { /* 28/10 (Erling): clicou, o robô vai sozinho até a obra (até 4 ao mesmo tempo) */ const left = robotLeftPop(id); if (obras.deployRobot(id.endsWith('_3') ? 2 : id.endsWith('_2') ? 1 : 0, left ?? undefined)) { inv.take(id, 1); return true; } if (left) robotLeftPush(id, left); return false; } if (id === 'obra_auto') return obras.bindContract(); if (id === 'escritura_casa' || deedIdOf(id)) { useDeed(id); return false; }  if (GADGETS[id] && GADGETS[id].kind === 'misc' && (game as unknown as { gadget(i: string): boolean }).gadget(id)) { inv.take(id, 1); return true; } if (/^(coleira|peitoral)_/.test(id)) return stable.wear(id); if (MOUNTS[id] || PETS[id]) { if (stable.adopt(id)) stable.toggle(true, { tab: PETS[id] ? 'pets' : 'mounts', id }); return true; } return false; },
  portrait: () => { if (dollR && !dollFail) return null; /* o boneco vivo já está desenhando */ portraits.delete('hero'); try { return portraitOf('hero', hero.root, true); } catch { return null; } }, title: () => `${(profile?.name ?? '')}${quests?.title ? ' · ' + quests.title : ''}`.trim() || RACES[state.race].label,
  raceLabel: () => RACES[state.race].label, karma: () => state.karma, spendKarma: (n) => { if (Math.abs(state.karma) < n) return false; addKarma(state.karma > 0 ? -n : n); return true; }, xpNeed: game.xpNeed,
  soul: () => { soul.regen(); const r: [string, string][] = [['Fio da Vida', `${game.st.lvl < FRAY_LVL || !profile?.eye ? `intacto até o Olho abrir (nível ${FRAY_LVL})` : `${'●'.repeat(soul.s.breaths)}${'○'.repeat(MAX_BREATHS - soul.s.breaths)}${soul.s.breaths < MAX_BREATHS ? ` · +1 em ${soul.nextBreathH()}h` : ''}`} · 💧 ${inv.count('lagrima')}`]];
    if (soul.s.debt > 0) r.push(['Dívida Kármica', `${soul.s.debt.toLocaleString('pt-BR')} XP`]);
    if (soul.s.catchup) r.push(['Eco da vida passada', `${soul.s.catchup.cls} ×${CATCHUP_MUL} até ${soul.s.catchup.until}`]);
    if (soul.s.lives.length) { const l = soul.s.lives[soul.s.lives.length - 1]; r.push([`Vidas passadas: ${soul.s.lives.length}`, `última: ${originName(l.origin)}, ${l.cls} ${l.clsLvl}`]); }
    return r; }, onCraft: (n) => { quests?.onCraft(n); feats.bump('crafts'); },
  placeFire: () => { const gx = Math.floor(state.fx), gy = Math.floor(state.fy); const t0 = city.map[gy]?.[gx]; if (t0 !== 'grass' && t0 !== 'road') { game.logMsg('Não dá para acender aqui.', '#ff9a8a'); return false; } if (nearProps(gx, gy, ['campfire'], 1).length) { game.logMsg('Já existe uma fogueira aqui.', '#ff9a8a'); return false; } const p = { kind: 'campfire' as const, gx, gy, w: 1, h: 1, height: 0.6, wall: 0x4a4a4a, roof: 0xff8a2a }; objs.addProp(p); idx(p); return true; },
});
bindScrolls(inv, (t, c) => game.logMsg(t, c)); /* 04/11: os Pergaminhos do Esquecimento (esquecimento.ts) */
game.setFits((g) => !inv.whyNot(g)); /* 02/11: regra 1 em 3 — ver spawnGear */
{ const orig = game.logMsg; game.logMsg = (t: string, c?: string) => { orig(t, c); if (t.startsWith('📜') || t.startsWith('✅') || t.startsWith('👁') || t.startsWith('✦') || t.startsWith('🏅')) chat.sys(t); }; }
syncGear(); renderQuick();
/* a arma salva só aparecia depois de trocar de novo: nesta linha o jogo ainda não terminou de montar (trabalho/pesca ainda não existem)
   e a chamada falhava em silêncio. Repete assim que tudo estiver de pé. */
setTimeout(() => syncGear(), 0);
/* CONSTRUÇÃO: o modo B (peças, muro, robôs que sobraram) e as obras em turnos (obras.ts) com a casa do herói. Saiu do main.ts (02/11). → sistemas/construcao.ts */
export interface ConstrucaoCtx {
  readonly city: Widen<typeof city>;
  readonly inv: Widen<typeof inv>;
  readonly placeDecor: typeof placeDecor;
  readonly otherHouses: Widen<typeof otherHouses>;
  readonly game: Widen<typeof game>;
  readonly guildZoneAt: typeof guildZoneAt;
  readonly hub: Widen<typeof hub>;
  readonly scene: Widen<typeof scene>;
  readonly objs: Widen<typeof objs>;
  readonly mail: Widen<typeof mail>;
  readonly deedItemOf: typeof deedItemOf;
  readonly particles: Widen<typeof particles>;
  readonly state: Widen<typeof state>;
  readonly profile: Profile | null;
  readonly decoRender: typeof decoRender;
  readonly social: Widen<typeof social>;
}
var construcaoSys: ReturnType<typeof createConstrucao>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_construcaoSys() { return createConstrucao({ get social() { return social; }, get city() { return city; }, get inv() { return inv; }, get placeDecor() { return placeDecor; }, get otherHouses() { return otherHouses; }, get game() { return game; }, get guildZoneAt() { return guildZoneAt; }, get hub() { return hub; }, get scene() { return scene; }, get objs() { return objs; }, get mail() { return mail; }, get deedItemOf() { return deedItemOf; }, get particles() { return particles; }, get state() { return state; }, get profile() { return profile; }, get decoRender() { return decoRender; } }); }
construcaoSys ??= mk_construcaoSys();
const { obras, build } = construcaoSys;
function robotLeftPop(...a: Parameters<ReturnType<typeof createConstrucao>['robotLeftPop']>): ReturnType<ReturnType<typeof createConstrucao>['robotLeftPop']> { return (construcaoSys ??= mk_construcaoSys()).robotLeftPop(...a); }
function robotLeftPush(...a: Parameters<ReturnType<typeof createConstrucao>['robotLeftPush']>): ReturnType<ReturnType<typeof createConstrucao>['robotLeftPush']> { return (construcaoSys ??= mk_construcaoSys()).robotLeftPush(...a); }

/* DOCK DE JANELAS (canto inferior direito) e as janelas de MAGIAS e FEITOS: os botões, os ícones, o aviso de feito conquistado. Saiu do main.ts (02/11). → sistemas/dock-feitos.ts */
export interface DockFeitosCtx {
  readonly audio: Widen<typeof audio>;
  readonly game: Widen<typeof game>;
  readonly tree: Widen<typeof tree>;
  readonly talents: Widen<typeof talents>;
  readonly talentKit: Widen<typeof talentKit>;
  readonly kitRace: Widen<typeof kitRace>;
  readonly compKit: () => string;
  readonly passKit: () => string;
  readonly kitSkills: () => { id: string; name: string; k: string }[];
  readonly compTitle: () => string;
  treeSel: string | null;
  readonly applyKitAll: typeof applyKitAll;
  readonly myInstinct: Widen<typeof myInstinct>;
  readonly instintoSys: ReturnType<typeof createInstintoPosturas>;
  readonly toggleInstinct: typeof toggleInstinct;
  readonly quests: Widen<typeof quests>;
  readonly relicsKnown: Widen<typeof relicsKnown>;
  readonly city: Widen<typeof city>;
  readonly build: Widen<typeof build>;
  readonly state: Widen<typeof state>;
  readonly profile: Profile | null;
  readonly keys: Widen<typeof keys>;
  readonly inv: Widen<typeof inv>;
  readonly toggleBigMap: typeof toggleBigMap;
  readonly profs: Widen<typeof profs>;
  readonly loja: Widen<typeof loja>;
  readonly compendium: Widen<typeof compendium>;
  readonly coop: Widen<typeof coop>;
  readonly stable: Widen<typeof stable>;
  readonly social: Widen<typeof social>;
}
var dockSys: ReturnType<typeof createDockFeitos>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_dockSys() { return createDockFeitos({ get audio() { return audio; }, get game() { return game; }, get tree() { return tree; }, get talents() { return talents; }, get talentKit() { return talentKit; }, get kitRace() { return kitRace; }, get compKit() { return arvoreSys.compKit; }, get passKit() { return arvoreSys.passKit; }, get kitSkills() { return arvoreSys.kitSkills; }, get compTitle() { return () => { try { return game.classInfo.name || 'Humano'; } catch { return 'Humano'; } }; }, get treeSel() { return arvoreSys.treeSel; }, set treeSel(v) { arvoreSys.treeSel = v; }, get applyKitAll() { return applyKitAll; }, get myInstinct() { return myInstinct; }, get instintoSys() { return instintoSys; }, get toggleInstinct() { return toggleInstinct; }, get quests() { return quests; }, get relicsKnown() { return relicsKnown; }, get city() { return city; }, get build() { return build; }, get state() { return state; }, get profile() { return profile; }, get keys() { return keys; }, get inv() { return inv; }, get toggleBigMap() { return toggleBigMap; }, get profs() { return profs; }, get loja() { return loja; }, get compendium() { return compendium; }, get coop() { return coop; }, get stable() { return stable; }, get social() { return social; } }); }
dockSys ??= mk_dockSys();
const { feats, dockEl } = dockSys;
function toggleSkills(...a: Parameters<ReturnType<typeof createDockFeitos>['toggleSkills']>): ReturnType<ReturnType<typeof createDockFeitos>['toggleSkills']> { return (dockSys ??= mk_dockSys()).toggleSkills(...a); }
function toggleFeats(...a: Parameters<ReturnType<typeof createDockFeitos>['toggleFeats']>): ReturnType<ReturnType<typeof createDockFeitos>['toggleFeats']> { return (dockSys ??= mk_dockSys()).toggleFeats(...a); }

const stable = createStable({ has: (id) => inv.has(id), count: (id) => inv.count(id), take: (id, n) => inv.take(id, n), add: (id, n) => inv.add(id, n), itemName: (id) => ITEMS_TBL[id]?.name ?? id, itemIcon: (id) => ITEMS_TBL[id]?.icon ?? '❔', log: (t, c) => game.logMsg(t, c), gold: (n) => { game.st.gold += n; },
  onChange: () => { compSys.pet?.dispose(); compSys.pet = null; }, sfx: (k) => { if (k === 'eat') audio.work('cook'); else if (k === 'swap') audio.click(); else audio.chime(); } });
setTimeout(() => stable.migrate(), 1500);
/* Ctrl + clique no pet (ou na montaria): abre o Estábulo nele */
canvas.addEventListener('pointerdown', (e) => { if (!e.ctrlKey) return; const r = canvas.getBoundingClientRect();
  const hitAt = (p: THREE.Vector3, h: number) => { const v = p.clone().setY(p.y + h).project(camera); return Math.hypot(r.left + (v.x * 0.5 + 0.5) * r.width - e.clientX, r.top + (-v.y * 0.5 + 0.5) * r.height - e.clientY) < 46; };
  if (compSys.pet && compSys.pet.root.visible && hitAt(compSys.pet.pos, 0.4)) { e.preventDefault(); e.stopImmediatePropagation(); stable.toggle(true, { tab: 'pets', id: compSys.pet.kind.id }); stable.hearts(3); }
  else if (compSys.mount && compSys.riding && hitAt(heroPos, 1.0)) { e.preventDefault(); e.stopImmediatePropagation(); stable.toggle(true, { tab: 'mounts', id: compSys.mount.kind.id }); } }, true);
game.setOnItem((id, n) => inv.add(id, n));
game.setOnGear((g) => inv.addGear(g));
/* leilão do Quadro de Avisos: vender, não só pedir (compras e vendas passam pelo correio) */
const auction = createAuction({ me: () => profile?.name || RACES[state.race].label, lvl: () => game.st.lvl, st: game.st,
  items: () => Object.entries(inv.bag).filter(([id, n]) => n > 0 && ITEMS_TBL[id] && !ITEMS_TBL[id].quest).map(([id, n]) => ({ id, n, name: ITEMS_TBL[id].name, icon: ITEMS_TBL[id].icon, sell: ITEMS_TBL[id].sell ?? 0, kind: ITEMS_TBL[id].kind })), gear: () => inv.gearBag,
  take: (id, n) => inv.take(id, n), takeGear: (uid) => { const i = inv.gearBag.findIndex((g) => g.uid === uid); if (i < 0) return null; const g = inv.gearBag.splice(i, 1)[0]; inv.save(); inv.refresh(); return g; },
  itemName: (id) => ITEMS_TBL[id]?.name ?? id, itemIcon: (id) => ITEMS_TBL[id]?.icon ?? '•', itemKind: (id) => ITEMS_TBL[id]?.kind ?? 'res', itemValue: (id) => ITEMS_TBL[id]?.sell ?? 1,
  mail: (from, subj, text, att) => mail.send(from, subj, text, att), log: (t, c) => game.logMsg(t, c), save: () => inv.save() });
/* 26/10 (Erling): as torres de vigia dão as missões de caçar os salteadores do acampamento daquela estrada: primeiro os homens, depois o chefe */
function banditQuests() {
  const out: import('./quests').QuestDef[] = [];
  city.bandits.forEach((b, i) => { if (!b.tower) return; const sg = b.tower.sgt, [a, c] = b.road, lvl = 8 + i;
    out.push({ id: `bd${i}a`, chain: 'Vigias da Estrada', name: `Limpar a ${b.name}`, lvl, giver: sg, xp: 1, gold: 25 + i * 6, next: `bd${i}b`,
      text: `Os salteadores da ${b.name} saem do mato e param quem vai de ${a} para ${c}. Já perdemos duas carroças este mês. O acampamento fica a meio caminho, escondido fora da estrada. Derrube seis deles.`,
      objs: [{ kind: 'kill', type: 'bandit', n: 6 }],
      talk: [`A estrada é segura até onde a minha tocha alcança. Depois disso, é a ${b.name} que manda.`, 'Não precisa trazer cabeça. Eu conto pelos que não voltam a aparecer.', 'Vá pelo mato com cuidado. Eles atiram antes de perguntar.'],
      done: ['Seis a menos. A estrada respira.', 'Agora sobra o cabeça. Sem ele, o resto se espalha.'] } as unknown as import('./quests').QuestDef);
    out.push({ id: `bd${i}b`, chain: 'Vigias da Estrada', name: `O chefe da ${b.name}`, lvl: lvl + 2, giver: sg, xp: 1, gold: 60 + i * 10, gear: 1, req: `bd${i}a`,
      text: `O chefe dos salteadores manda da ${b.name}. Ele é grande, cruel e nunca sai do acampamento. Entre, derrube-o, e a estrada para ${c} volta a ser estrada.`,
      objs: [{ kind: 'kill', type: 'bandit_chief', n: 1 }],
      talk: ['Ele não foge. Gente assim prefere morrer sentada no trono de barro.', 'Leve poção. Ele bate forte.'],
      done: ['Então caiu. A patrulha vai poder passar sem segurar o escudo.', 'Isto aqui é pelo serviço. E a estrada agradece.'] } as unknown as import('./quests').QuestDef); });
  return out;
}
let choirClock = 0; /* relógio do coral do Dia da Aurora (janela de 20 s a cada 5 min) */
const quests = createQuests({ stance: () => instintoSys.stanceSys?.current().id ?? null, lean: () => soulLean(), outcast: () => (soul.s.outcast ?? null) as Outcast | null, madness: () => soul.s.madness ?? null, origin: () => profile?.origin ?? 'human', auction, karma: (dk) => { addKarma(dk); }, me: () => profile?.name || RACES[state.race].label, roleOf: (nm) => { const n = npcSys.npcs.find((q) => q.def.name === nm); return n && !/mercador viajante|^shop$|tecelagem/i.test(n.def.role) ? n.def.role : null; }, st: game.st, count: inv.count, take: inv.take, add: (id, n) => inv.add(id, n), gainXp: (n) => game.gainXp(n), xpNeedAt: game.xpNeedAt, gear: (n, lvl) => game.spawnGear(state.fx * T, state.fy * T, heightAt(state.fx * T, state.fy * T), Math.max(2, lvl), { rare: 4, legendary: 3, relic: 2 }, n, 'rare'), log: (t, c) => game.logMsg(t, c), onTitle: (t) => { if (profile) { profile.title = t; localStorage.setItem('karmika.char.v1', JSON.stringify(profile)); } updateWho(); heroicAct(`Título conquistado: ${t}`); }, chainQuests: [...HUMAN_ROAD, ...RACE_ROADS, ...SIDE, ...banditQuests(), ...[...WARRIOR, ...PALADIN, ...VAMPIRE, ...TECHNO, ...WARLOCK_I, ...WANDERER, ...COSTURA_I, ...WEREWOLF].filter(notOldChapterI), ...CHAPTER_I, ...HUNTER_I, ...MAGE_I, ...HUMAN_I, ...DWARF_I, ...ELF_I, ...ROADS_OF_PEOPLES, ...RACE_INSTINCT, ...STANCE_QUESTS, ...OUTCAST_QUESTS, ...MADNESS_QUESTS],
  room: { on: () => netRef?.state === 'on', posts: () => netRef?.posts ?? [], add: (item, n, gold) => netRef?.postAdd({ item, name: ITEMS_TBL[item]?.name ?? item, icon: ITEMS_TBL[item]?.icon ?? '•', n, gold, note: '' }),
    fill: (id, item, n) => netRef?.postFill(id, [{ item: { id: item, n } }]), cancel: (id) => netRef?.postCancel(id) } });
(window as unknown as { __quests?: unknown }).__quests = quests;
/* 09/11: quem a Corte levou a um esconderijo passa a vê-lo no mapa para sempre (e só ele) */
quests.addDoneHook((d) => { for (const o of d.objs) if (o.kind === 'visit' && city.pois.find((p) => p.name === o.poi)?.secret) { try { const k = 'karmika.segredos.v1', a = JSON.parse(localStorage.getItem(k) || '[]') as string[]; if (!a.includes(o.poi)) { a.push(o.poi); localStorage.setItem(k, JSON.stringify(a)); } } catch { /* */ } } });
const dlg = createDialog();
/* ---------- Luz e Sombra (24/10): a inclinação da alma pelas palavras. O karma mede o que você fez; isto mede quem você está se tornando.
   Não aparece em número: o jogador sente pelas portas que se abrem (missões, falas, preços) e por um aviso quando a alma vira. ---------- */
const LEAN_GAP = 6;
function soulLean(): 'luz' | 'sombra' | null { const l = soul.s.luz ?? 0, d = soul.s.sombra ?? 0; return l - d >= LEAN_GAP ? 'luz' : d - l >= LEAN_GAP ? 'sombra' : null; }
/** comerciantes da luz cobram mais de quem pende para a sombra (e o contrário); a própria gente dá desconto */
const LIGHT_SHOPS = new Set(['pocoes', 'cozinha', 'cervejaria', 'tec_fio', 'construtor', 'domador']), DARK_SHOPS = new Set(['tec_desf', 'charcutaria']);
/** (a ficha do herói é montada antes do instinto existir: por isso o try) */
/** quem o evento global fortalece: +1 fortalecido, −1 acuado, 0 neutro.
 *  Lua de Sangue: vampiros, lobisomens, bruxos e toda alma de karma baixo. Dia da Aurora: paladinos, magos e toda alma de karma alto */
function globalSide(id: string | null): number {
  if (!id) return 0; const p = myPath(), k = state.karma;
  const dark = k <= -100 || p === 'vam' || p === 'lob' || p === 'bru', light = k >= 100 || p === 'pal' || p === 'mag';
  if (id === 'lua') return dark ? 1 : light ? -1 : 0;
  if (id === 'aurora') return light ? 1 : dark ? -1 : 0;
  return 0;
}
function globalSideText(id: string | null) { const sd = globalSide(id); if (!sd) return ''; return id === 'lua' ? (sd > 0 ? 'A Lua te alimenta: +10% de dano, −8% de dano recebido.' : 'A Lua caça os de alma clara: +6% de dano recebido.') : (sd > 0 ? 'A Aurora te abençoa: +10% de dano, −8% de dano recebido.' : 'A luz da Aurora te queima: +6% de dano recebido.'); }
function luaBonus() { try { return instintoSys.instinctOn && myPath() === 'lob' && globalNow()?.id === 'lua' ? 0.15 : 0; } catch { return 0; } }
function shopLeanK(shop: string): number { let k = 1; try { k = alignPriceK(); } catch { /* o alinhamento ainda não nasceu */ } return shopLeanK0(shop) * k; }
function shopLeanK0(shop: string): number { if (shop === 'latao') return latoK() * shopLeanK0('_'); const L = soulLean(); if (!L) return 1; return L === 'sombra' ? (LIGHT_SHOPS.has(shop) ? 1.15 : DARK_SHOPS.has(shop) ? 0.95 : 1) : (DARK_SHOPS.has(shop) ? 1.1 : LIGHT_SHOPS.has(shop) ? 0.95 : 1); }
/** o caminho que o herói já trilha de verdade (passou na prova do mestre) */
function myPath(): string | null { const p = profile?.path; if (!p || p === 'humano') return null; try { return quests.q.done.includes('v_' + p) ? p : null; } catch { return null; } }
/* JURAMENTOS DE ROLEPLAY e a ALMA PELAS PALAVRAS: oferecer e quebrar o voto, a vigília da Morte que Anda, o título do voto mantido, as marcas e as respostas que pesam. Saiu do main.ts (02/11). → sistemas/votos-alma.ts */
export interface VotosAlmaCtx {
  vow: VowState;
  readonly saveVow: Widen<typeof saveVow>;
  readonly addKarma: typeof addKarma;
  readonly soul: Widen<typeof soul>;
  readonly game: Widen<typeof game>;
  readonly openDlg: Widen<typeof openDlg>;
  readonly cinemaSys: ReturnType<typeof createCinemaVistas>;
  readonly heroPosNow: Widen<typeof heroPosNow>;
  readonly quests: Widen<typeof quests>;
  readonly profile: Profile | null;
  readonly soulLean: typeof soulLean;
  readonly isWarrior: typeof isWarrior;
  readonly kitRace: Widen<typeof kitRace>;
}
var votosSys: ReturnType<typeof createVotosAlma>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_votosSys() { return createVotosAlma({ get vow() { return vow; }, set vow(v) { vow = v; }, get saveVow() { return saveVow; }, get addKarma() { return addKarma; }, get soul() { return soul; }, get game() { return game; }, get openDlg() { return openDlg; }, get cinemaSys() { return cinemaSys; }, get heroPosNow() { return heroPosNow; }, get quests() { return quests; }, get profile() { return profile; }, get soulLean() { return soulLean; }, get isWarrior() { return isWarrior; }, get kitRace() { return kitRace; } }); }
votosSys ??= mk_votosSys();
function offerVow(...a: Parameters<ReturnType<typeof createVotosAlma>['offerVow']>): ReturnType<ReturnType<typeof createVotosAlma>['offerVow']> { return (votosSys ??= mk_votosSys()).offerVow(...a); }
function vowKept(...a: Parameters<ReturnType<typeof createVotosAlma>['vowKept']>): ReturnType<ReturnType<typeof createVotosAlma>['vowKept']> { return (votosSys ??= mk_votosSys()).vowKept(...a); }
function applyReply(...a: Parameters<ReturnType<typeof createVotosAlma>['applyReply']>): ReturnType<ReturnType<typeof createVotosAlma>['applyReply']> { return (votosSys ??= mk_votosSys()).applyReply(...a); }
function hasMark(...a: Parameters<ReturnType<typeof createVotosAlma>['hasMark']>): ReturnType<ReturnType<typeof createVotosAlma>['hasMark']> { return (votosSys ??= mk_votosSys()).hasMark(...a); }
function breakVow(...a: Parameters<ReturnType<typeof createVotosAlma>['breakVow']>): ReturnType<ReturnType<typeof createVotosAlma>['breakVow']> { return (votosSys ??= mk_votosSys()).breakVow(...a); }

const openDlg = (o: Parameters<typeof dlg.open>[0]) => dlg.open({ me: profile?.name || 'Caminhante', lean: soulLean, onReply: (r) => applyReply(r), ...o });
/* COMANDOS DE TESTE DO BETA (chat): /morrer, /folegos, /lagrimas, /nivel, /classe, /aprender, /arma, /pele, /ir e os outros. Saiu do main.ts (02/11). → sistemas/comandos-teste.ts */
export interface ComandosTesteCtx {
  readonly obras: Widen<typeof obras>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly emote: Widen<typeof emote>;
  readonly state: Widen<typeof state>;
  readonly hero: Hero3D;
  readonly netRef: Net | null;
  readonly audio: Widen<typeof audio>;
  readonly inv: Widen<typeof inv>;
  readonly game: Widen<typeof game>;
  readonly walksPath: typeof walksPath;
  readonly profile: Profile | null;
  readonly kitRace: Widen<typeof kitRace>;
  readonly luaK: Widen<typeof luaK>;
  readonly aurK: Widen<typeof aurK>;
  readonly gCur: string | null;
  readonly perfReport: typeof perfReport;
  readonly soul: Widen<typeof soul>;
  readonly peleSys: ReturnType<typeof createPeleHeroi>;
  readonly applyArtSkin: typeof applyArtSkin;
  readonly ART_SET: Widen<typeof ART_SET>;
  readonly quests: Widen<typeof quests>;
  readonly takeClass: typeof takeClass;
  readonly tree: Widen<typeof tree>;
  readonly applyKitAll: typeof applyKitAll;
  readonly crestEl: Widen<typeof crestEl>;
  readonly dgs: Widen<typeof dgs>;
  readonly npcSys: Widen<typeof npcSys>;
  readonly city: Widen<typeof city>;
  readonly limiar: Widen<typeof limiar>;
  readonly unbind: typeof unbind;
}
var comandosSys: ReturnType<typeof createComandosTeste>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_comandosSys() { return createComandosTeste({ get obras() { return obras; }, get inside() { return inside; }, get emote() { return emote; }, get state() { return state; }, get hero() { return hero; }, get netRef() { return netRef; }, get audio() { return audio; }, get inv() { return inv; }, get game() { return game; }, get walksPath() { return walksPath; }, get profile() { return profile; }, get kitRace() { return kitRace; }, get luaK() { return luaK; }, get aurK() { return aurK; }, get gCur() { return gCur; }, get perfReport() { return perfReport; }, get soul() { return soul; }, get peleSys() { return peleSys; }, get applyArtSkin() { return applyArtSkin; }, get ART_SET() { return ART_SET; }, get quests() { return quests; }, get takeClass() { return takeClass; }, get tree() { return tree; }, get applyKitAll() { return applyKitAll; }, get crestEl() { return crestEl; }, get dgs() { return dgs; }, get npcSys() { return npcSys; }, get city() { return city; }, get limiar() { return limiar; }, get unbind() { return unbind; } }); }
comandosSys ??= mk_comandosSys();
function betaCommand(...a: Parameters<ReturnType<typeof createComandosTeste>['betaCommand']>): ReturnType<ReturnType<typeof createComandosTeste>['betaCommand']> { return (comandosSys ??= mk_comandosSys()).betaCommand(...a); }

/* Lágrimas viraram item de mochila (dá para guardar, trocar e vender): as antigas da alma passam para a mochila;
   quem já tinha o Olho aberto recebe a Lágrima do nascimento que não ganhou */
setTimeout(() => { if (soul.s.tears > 0) { inv.add('lagrima', soul.s.tears, true); soul.s.tears = 0; soul.save(); }
  if (profile?.eye && !soul.s.born) { soul.s.born = true; soul.save(); inv.add('lagrima', 1, true); game.logMsg('💧 Marghar se emocionou quando o seu Olho abriu: a Lágrima do nascimento está na sua mochila.', '#9ad7ff'); } }, 2500);
const chat = createChat({ me: () => profile?.name || RACES[state.race].label, command: (cmd, a) => { if (cmd === 'gu' || cmd === 'guilda' || cmd === 'guild') { const tx = a.join(' ').trim(); if (tx) { social.guildChat(tx); return ''; } social.toggle(true, 'guilda'); return '⚑ Use /guilda texto para falar com a guilda.'; } return bugsDono.command(cmd, a) ?? betaCommand(cmd, a); }, onSay: (text, ch, to) => { if (ch === 'whisper' && to) { netRef?.whisper(to, text); return; } if (ch === 'party') { if (!netRef?.party) { chat.sys('Você não está em um grupo. Ctrl + clique num jogador para convidar.'); return; } bubble(text); netRef.partyChat(text); return; } bubble(text); netRef?.say(text); } });
/* 03/11: o inseto 🐞 (relatar bug) e o painel do dono (sistemas/bugs-dono.ts) */
const shotReq: ((u: string) => void)[] = [];
const bugsDono = createBugsDono({ net: () => netRef,
  shot: () => new Promise<string | null>((res) => { shotReq.push((u) => res(u || null)); setTimeout(() => res(null), 3000); }),
  info: () => { const rg = (() => { try { return regionAt(state.fx, state.fy).name; } catch { return '?'; } })(); let cls = ''; try { cls = game.classInfo.name; } catch { /* */ }
    return { tx: Math.round(state.fx * 10) / 10, ty: Math.round(state.fy * 10) / 10, reg: rg, inside: inside ? `${inside.prop.kind}${inside.crypt ? ' (cripta ' + inside.crypt + ')' : ''}` : '', lvl: game.st.lvl, cls, race: state.race, rend: gpuState.on ? 'WebGPU' : 'WebGL', fps: lastFps, pix: opts.pix ? 'Pixel' : 'Moderno', build: __BUILD__, q: quests?.tracked?.title ?? '', res: `${innerWidth}x${innerHeight}`, ua: navigator.userAgent.slice(0, 160), gpu: (() => { try { const f = localStorage.getItem('karmika.gpuFallbackLast'); return f ? JSON.parse(f) : gpuState.log.slice(0, 6); } catch { return ''; } })() }; },
  doing: () => { let reg = '?'; try { reg = regionAt(state.fx, state.fy).name; } catch { /* */ } const act = game.st.dead ? 'morto' : inside ? `dentro (${inside.prop.kind})` : hero.combat ? 'lutando' : inicio.isOpen ? 'no menu' : 'explorando';
    return { reg, act, q: quests?.tracked?.title ?? '', fps: lastFps, rend: gpuState.on ? 'WebGPU' : 'WebGL', lvl: game.st.lvl }; },
  log: (t, c) => game.logMsg(t, c) });
/* 28/10 (Erling): o registro de acontecimentos mostra só as 5 últimas linhas e tudo fica guardado na aba Sistema do chat;
   o botão 📜 recolhe o registro (aí ele só aparece no chat) */
(game as unknown as { setLogHook(f: (t: string) => void): void }).setLogHook((t) => chat.sysLog(t));
{ const LK = 'karmika.ui.logoff'; const lg = document.getElementById('log'); const bt = document.createElement('button'); bt.id = 'logtog'; document.body.appendChild(bt);
  const apply = (off: boolean) => { if (lg) lg.classList.toggle('sysoff', off); /* 09/11: dados e sistema dividem a mesma lista; desligar o 📜 esconde só as linhas do sistema */ bt.classList.toggle('off', off); bt.textContent = off ? '📜' : '📜'; bt.title = off ? 'Mostrar o registro de acontecimentos na tela (eles continuam na aba Sistema do chat)' : 'Recolher o registro de acontecimentos (eles continuam na aba Sistema do chat)'; try { localStorage.setItem(LK, off ? '1' : '0'); } catch { /* */ } };
  let off = false; try { off = localStorage.getItem(LK) === '1'; } catch { /* */ } apply(off); bt.addEventListener('click', () => { off = !off; apply(off); }); }
/* JOGAR JUNTO: os outros Caminhantes da sala no mundo (net.ts) e os monstros compartilhados (coop.ts). Saiu do main.ts (02/11). → sistemas/rede.ts */
export interface RedeCtx {
  readonly scene: Widen<typeof scene>;
  readonly particles: Widen<typeof particles>;
  readonly camera: Widen<typeof camera>;
  readonly canvas: Widen<typeof canvas>;
  readonly kindOf: Widen<typeof kindOf>;
  readonly state: Widen<typeof state>;
  readonly profile: Profile | null;
  readonly lastGear: Parameters<Hero3D['setGear']>[0] | null;
  readonly peleSys: ReturnType<typeof createPeleHeroi>;
  readonly game: Widen<typeof game>;
  readonly myPath: typeof myPath;
  readonly soulLean: typeof soulLean;
  readonly makeBlessRune: typeof makeBlessRune;
  readonly hero: Hero3D;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly netMps: Widen<typeof netMps>;
  readonly pvpOn: Widen<typeof pvpOn>;
  readonly chat: Widen<typeof chat>;
  readonly audio: Widen<typeof audio>;
  readonly mail: Widen<typeof mail>;
  readonly quests: Widen<typeof quests>;
  readonly srvWait: Widen<typeof srvWait>;
  readonly portraits: Widen<typeof portraits>;
  readonly portraitOf: typeof portraitOf;
  readonly inv: Widen<typeof inv>;
  readonly feats: Widen<typeof feats>;
  readonly soul: Widen<typeof soul>;
  readonly originName: Widen<typeof originName>;
  netRef: Net | null;
  readonly dgInst: typeof dgInst;
  readonly enterDungeon: typeof enterDungeon;
  readonly dgs: Widen<typeof dgs>;
  readonly pvp: Widen<typeof pvp>;
  readonly social: Widen<typeof social>;
  readonly inicio: Widen<typeof inicio>;
}
/* O OÁSIS DA MIRAGEM (02/11): a voz do Gênio oferece de beber a quem chega na beira — sistemas/oasis.ts */
const oasisSys = createOasis({ game, heroPos: () => heroPosNow(), openDlg: (o) => openDlg(o), busy: () => !!inside || !!cinemaSys?.cine || dlg.isOpen, shake: (k) => { game.st.shake = Math.max(game.st.shake ?? 0, k); } });
setInterval(() => oasisSys.tick(), 400);
var redeSys: ReturnType<typeof createRede>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_redeSys() { return createRede({ get scene() { return scene; }, get particles() { return particles; }, get camera() { return camera; }, get canvas() { return canvas; }, get kindOf() { return kindOf; }, get state() { return state; }, get profile() { return profile; }, get lastGear() { return lastGear; }, get peleSys() { return peleSys; }, get game() { return game; }, get myPath() { return myPath; }, get soulLean() { return soulLean; }, get makeBlessRune() { return makeBlessRune; }, get hero() { return hero; }, get inside() { return inside; }, get netMps() { return netMps; }, get pvpOn() { return pvpOn; }, get chat() { return chat; }, get audio() { return audio; }, get mail() { return mail; }, get quests() { return quests; }, get srvWait() { return srvWait; }, get portraits() { return portraits; }, get portraitOf() { return portraitOf; }, get inv() { return inv; }, get feats() { return feats; }, get soul() { return soul; }, get originName() { return originName; }, get netRef() { return netRef; }, set netRef(v) { netRef = v; }, get dgInst() { return dgInst; }, get enterDungeon() { return enterDungeon; }, get dgs() { return dgs; }, get pvp() { return pvp; }, get social() { return social; }, get inicio() { return inicio; } }); }
redeSys ??= mk_redeSys();
const { coop, net } = redeSys;

/* AMIGOS, CONVERSAS E GUILDAS (hub.ts e social.ts): escrituras de casa, casas dos outros, terrenos e salões de guilda, o PvP de facção, entrar no servidor, o início, o cartão do herói e o balão de fala. Saiu do main.ts (02/11). → sistemas/social-guildas.ts */
export interface SocialGuildasCtx {
  readonly profile: Profile | null;
  readonly peleSys: ReturnType<typeof createPeleHeroi>;
  readonly city: Widen<typeof city>;
  readonly obras: Widen<typeof obras>;
  readonly inv: Widen<typeof inv>;
  readonly game: Widen<typeof game>;
  readonly objs: Widen<typeof objs>;
  readonly decoRenderOthers: typeof decoRenderOthers;
  readonly scene: Widen<typeof scene>;
  readonly build: Widen<typeof build>;
  readonly mail: Widen<typeof mail>;
  readonly audio: Widen<typeof audio>;
  readonly coop: Widen<typeof coop>;
  readonly mapV: Widen<typeof mapV>;
  readonly minimapaSys: ReturnType<typeof createMinimapa>;
  readonly toggleBigMap: typeof toggleBigMap;
  readonly updateWho: typeof updateWho;
  readonly caravans: Widen<typeof caravans>;
  readonly perfReport: typeof perfReport;
  readonly festaStatus: typeof festaStatus;
  readonly net: Widen<typeof net>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  pvpOn: Widen<typeof pvpOn>;
  readonly addKarma: typeof addKarma;
  readonly hero: Hero3D;
  readonly quests: Widen<typeof quests>;
  readonly feats: Widen<typeof feats>;
  readonly kitRace: Widen<typeof kitRace>;
  readonly chat: Widen<typeof chat>;
  readonly particles: Widen<typeof particles>;
  readonly loja: Widen<typeof loja>;
  readonly showCreate: typeof showCreate;
  readonly withFade: typeof withFade;
  readonly state: Widen<typeof state>;
  readonly resumeSoul: typeof resumeSoul;
  readonly classOfRace: Widen<typeof classOfRace>;
  readonly humanSkinKey: typeof humanSkinKey;
  readonly renderer: Widen<typeof renderer>;
}
var socialSys: ReturnType<typeof createSocialGuildas>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_socialSys() { return createSocialGuildas({ get profile() { return profile; }, get peleSys() { return peleSys; }, get city() { return city; }, get obras() { return obras; }, get inv() { return inv; }, get game() { return game; }, get objs() { return objs; }, get decoRenderOthers() { return decoRenderOthers; }, get scene() { return scene; }, get build() { return build; }, get mail() { return mail; }, get audio() { return audio; }, get coop() { return coop; }, get mapV() { return mapV; }, get minimapaSys() { return minimapaSys; }, get toggleBigMap() { return toggleBigMap; }, get updateWho() { return updateWho; }, get caravans() { return caravans; }, get perfReport() { return perfReport; }, get festaStatus() { return festaStatus; }, get net() { return net; }, get inside() { return inside; }, get pvpOn() { return pvpOn; }, set pvpOn(v) { pvpOn = v; }, get addKarma() { return addKarma; }, get hero() { return hero; }, get quests() { return quests; }, get feats() { return feats; }, get kitRace() { return kitRace; }, get chat() { return chat; }, get particles() { return particles; }, get loja() { return loja; }, get showCreate() { return showCreate; }, get withFade() { return withFade; }, get state() { return state; }, get resumeSoul() { return resumeSoul; }, get classOfRace() { return classOfRace; }, get humanSkinKey() { return humanSkinKey; }, get renderer() { return snapR(); } }); }
socialSys ??= mk_socialSys();
const { inicio, social, otherHouses, hub, pvp, CARTA_K, otherDecor, bubbleEl } = socialSys;
function slotPic(...a: Parameters<ReturnType<typeof createSocialGuildas>['slotPic']>): ReturnType<ReturnType<typeof createSocialGuildas>['slotPic']> { return (socialSys ??= mk_socialSys()).slotPic(...a); }
function useDeed(...a: Parameters<ReturnType<typeof createSocialGuildas>['useDeed']>): ReturnType<ReturnType<typeof createSocialGuildas>['useDeed']> { return (socialSys ??= mk_socialSys()).useDeed(...a); }
function guildZoneAt(...a: Parameters<ReturnType<typeof createSocialGuildas>['guildZoneAt']>): ReturnType<ReturnType<typeof createSocialGuildas>['guildZoneAt']> { return (socialSys ??= mk_socialSys()).guildZoneAt(...a); }
function deedItemOf(...a: Parameters<ReturnType<typeof createSocialGuildas>['deedItemOf']>): ReturnType<ReturnType<typeof createSocialGuildas>['deedItemOf']> { return (socialSys ??= mk_socialSys()).deedItemOf(...a); }
function bubble(...a: Parameters<ReturnType<typeof createSocialGuildas>['bubble']>): ReturnType<ReturnType<typeof createSocialGuildas>['bubble']> { return (socialSys ??= mk_socialSys()).bubble(...a); }
function saveSlotMeta(...a: Parameters<ReturnType<typeof createSocialGuildas>['saveSlotMeta']>): ReturnType<ReturnType<typeof createSocialGuildas>['saveSlotMeta']> { return (socialSys ??= mk_socialSys()).saveSlotMeta(...a); }
function joinServer(...a: Parameters<ReturnType<typeof createSocialGuildas>['joinServer']>): ReturnType<ReturnType<typeof createSocialGuildas>['joinServer']> { return (socialSys ??= mk_socialSys()).joinServer(...a); }
function hideBoot(...a: Parameters<ReturnType<typeof createSocialGuildas>['hideBoot']>): ReturnType<ReturnType<typeof createSocialGuildas>['hideBoot']> { return (socialSys ??= mk_socialSys()).hideBoot(...a); }

/* A COMPANHIA DAS CARAVANAS DE LATÃO: os balões de fala das carroças, a ponte, as missões das caravanas e o salão de ofícios. Saiu do main.ts (02/11). → sistemas/caravanas-ui.ts */
export interface CaravanasUiCtx {
  readonly canvas: Widen<typeof canvas>;
  readonly camera: Widen<typeof camera>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly city: Widen<typeof city>;
  readonly inv: Widen<typeof inv>;
  readonly openDwarfCart: typeof openDwarfCart;
  readonly prepLatao: typeof prepLatao;
  readonly scene: Widen<typeof scene>;
  readonly heroPos: Widen<typeof heroPos>;
  readonly state: Widen<typeof state>;
  readonly game: Widen<typeof game>;
  readonly particles: Widen<typeof particles>;
  readonly soulLean: typeof soulLean;
  readonly quests: Widen<typeof quests>;
  readonly addKarma: typeof addKarma;
  readonly applyReply: typeof applyReply;
  readonly audio: Widen<typeof audio>;
  readonly t: Widen<typeof t>;
}
var caravanasSys: ReturnType<typeof createCaravanasUi>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_caravanasSys() { return createCaravanasUi({ get canvas() { return canvas; }, get camera() { return camera; }, get inside() { return inside; }, get city() { return city; }, get inv() { return inv; }, get openDwarfCart() { return openDwarfCart; }, get prepLatao() { return prepLatao; }, get scene() { return scene; }, get heroPos() { return heroPos; }, get state() { return state; }, get game() { return game; }, get particles() { return particles; }, get soulLean() { return soulLean; }, get quests() { return quests; }, get addKarma() { return addKarma; }, get applyReply() { return applyReply; }, get audio() { return audio; }, get t() { return t; } }); }
caravanasSys ??= mk_caravanasSys();
const { caravans, LATAO_BASE, LATAO_PORTO, craftHall } = caravanasSys;
function carBubble(...a: Parameters<ReturnType<typeof createCaravanasUi>['carBubble']>): ReturnType<ReturnType<typeof createCaravanasUi>['carBubble']> { return (caravanasSys ??= mk_caravanasSys()).carBubble(...a); }
function updateCaravans(...a: Parameters<ReturnType<typeof createCaravanasUi>['updateCaravans']>): ReturnType<ReturnType<typeof createCaravanasUi>['updateCaravans']> { return (caravanasSys ??= mk_caravanasSys()).updateCaravans(...a); }

/* A CARROÇA DOS ANÕES: comerciar a mesa de Brasaforja ou contratar uma festa; a festa pendente; o estoque e o preço da Companhia de Latão. Saiu do main.ts (02/11). → sistemas/carroca-anoes.ts */
export interface CarrocaAnoesCtx {
  readonly inv: Widen<typeof inv>;
  readonly settleAt: Widen<typeof settleAt>;
  readonly larSys: ReturnType<typeof createLarMorte>;
  readonly myGuild: Guild | null;
  readonly game: Widen<typeof game>;
  readonly festaSys: ReturnType<typeof createFesta>;
  readonly audio: Widen<typeof audio>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly hereSettle: Widen<typeof hereSettle>;
  readonly startFesta: typeof startFesta;
  readonly caravans: Widen<typeof caravans>;
  readonly LATAO_BASE: Widen<typeof LATAO_BASE>;
  readonly LATAO_PORTO: Widen<typeof LATAO_PORTO>;
  readonly hasMark: typeof hasMark;
}
var carrocaAnoesSys: ReturnType<typeof createCarrocaAnoes>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_carrocaAnoesSys() { return createCarrocaAnoes({ get inv() { return inv; }, get settleAt() { return settleAt; }, get larSys() { return larSys; }, get myGuild() { return socialSys.myGuild; }, get game() { return game; }, get festaSys() { return festaSys; }, get audio() { return audio; }, get inside() { return inside; }, get hereSettle() { return hereSettle; }, get startFesta() { return startFesta; }, get caravans() { return caravans; }, get LATAO_BASE() { return LATAO_BASE; }, get LATAO_PORTO() { return LATAO_PORTO; }, get hasMark() { return hasMark; } }); }
carrocaAnoesSys ??= mk_carrocaAnoesSys();
const { dwarfEl } = carrocaAnoesSys;
function openDwarfCart(...a: Parameters<ReturnType<typeof createCarrocaAnoes>['openDwarfCart']>): ReturnType<ReturnType<typeof createCarrocaAnoes>['openDwarfCart']> { return (carrocaAnoesSys ??= mk_carrocaAnoesSys()).openDwarfCart(...a); }
function latoK(...a: Parameters<ReturnType<typeof createCarrocaAnoes>['latoK']>): ReturnType<ReturnType<typeof createCarrocaAnoes>['latoK']> { return (carrocaAnoesSys ??= mk_carrocaAnoesSys()).latoK(...a); }
function prepLatao(...a: Parameters<ReturnType<typeof createCarrocaAnoes>['prepLatao']>): ReturnType<ReturnType<typeof createCarrocaAnoes>['prepLatao']> { return (carrocaAnoesSys ??= mk_carrocaAnoesSys()).prepLatao(...a); }
function festaPendTick(...a: Parameters<ReturnType<typeof createCarrocaAnoes>['festaPendTick']>): ReturnType<ReturnType<typeof createCarrocaAnoes>['festaPendTick']> { return (carrocaAnoesSys ??= mk_carrocaAnoesSys()).festaPendTick(...a); }

/* EVENTOS VIVOS (eventos.ts): os lugares dos eventos, os efeitos (fogos, pétalas, incenso, velas), os painéis e o sistema de eventos. Saiu do main.ts (02/11). → sistemas/eventos-vivos.ts */
export interface EventosVivosCtx {
  readonly city: Widen<typeof city>;
  readonly particles: Widen<typeof particles>;
  readonly audio: Widen<typeof audio>;
  readonly scene: Widen<typeof scene>;
  readonly heroPos: Widen<typeof heroPos>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly game: Widen<typeof game>;
  readonly state: Widen<typeof state>;
  readonly myPath: typeof myPath;
  readonly profile: Profile | null;
  readonly instintoSys: ReturnType<typeof createInstintoPosturas>;
  readonly soulLean: typeof soulLean;
  readonly carBubble: typeof carBubble;
  readonly camera: Widen<typeof camera>;
  readonly canvas: Widen<typeof canvas>;
  readonly openDlg: Widen<typeof openDlg>;
  readonly applyReply: typeof applyReply;
  readonly inv: Widen<typeof inv>;
  readonly hero: Hero3D;
  readonly showEvResult: typeof showEvResult;
}
var eventosSys: ReturnType<typeof createEventosVivos>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_eventosSys() { return createEventosVivos({ get city() { return city; }, get particles() { return particles; }, get audio() { return audio; }, get scene() { return scene; }, get heroPos() { return heroPos; }, get inside() { return inside; }, get game() { return game; }, get state() { return state; }, get myPath() { return myPath; }, get profile() { return profile; }, get instintoSys() { return instintoSys; }, get soulLean() { return soulLean; }, get carBubble() { return carBubble; }, get camera() { return camera; }, get canvas() { return canvas; }, get openDlg() { return openDlg; }, get applyReply() { return applyReply; }, get inv() { return inv; }, get hero() { return hero; }, get showEvResult() { return showEvResult; } }); }
eventosSys ??= mk_eventosSys();
const { evFx, evResEl, eventos, evTrkEl, evBanEl, evSites } = eventosSys;

/* ALINHAMENTO KÁRMICO COM CADA LUGAR (alinhamento.ts): de onde é o herói, o reencontro, o abate que pesa, o preço por lugar. Saiu do main.ts (02/11). → sistemas/alinhamento-lugar.ts */
export interface AlinhamentoLugarCtx {
  readonly city: Widen<typeof city>;
  readonly game: Widen<typeof game>;
  readonly festaStatus: typeof festaStatus;
  readonly hereT: typeof hereT;
  readonly npcSys: Widen<typeof npcSys>;
  readonly profile: Profile | null;
  readonly inicio: Widen<typeof inicio>;
  readonly peleSys: ReturnType<typeof createPeleHeroi>;
  readonly quests: Widen<typeof quests>;
  readonly CARTA_K: Widen<typeof CARTA_K>;
  readonly social: Widen<typeof social>;
  readonly heroPos: Widen<typeof heroPos>;
  readonly festaSys: ReturnType<typeof createFesta>;
  readonly dlg: Widen<typeof dlg>;
  readonly festaOffer: typeof festaOffer;
  readonly festaPendTick: typeof festaPendTick;
  readonly festaTick: typeof festaTick;
}
var alinhaSys: ReturnType<typeof createAlinhamentoLugar>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_alinhaSys() { return createAlinhamentoLugar({ get city() { return city; }, get game() { return game; }, get festaStatus() { return festaStatus; }, get hereT() { return hereT; }, get npcSys() { return npcSys; }, get profile() { return profile; }, get inicio() { return inicio; }, get peleSys() { return peleSys; }, get quests() { return quests; }, get CARTA_K() { return CARTA_K; }, get social() { return social; }, get heroPos() { return heroPos; }, get festaSys() { return festaSys; }, get dlg() { return dlg; }, get festaOffer() { return festaOffer; }, get festaPendTick() { return festaPendTick; }, get festaTick() { return festaTick; } }); }
alinhaSys ??= mk_alinhaSys();
const { hereSettle, align, alignPriceK, settleAt, npcHome } = alinhaSys;
function alignKill(...a: Parameters<ReturnType<typeof createAlinhamentoLugar>['alignKill']>): ReturnType<ReturnType<typeof createAlinhamentoLugar>['alignKill']> { return (alinhaSys ??= mk_alinhaSys()).alignKill(...a); }
function alignTick(...a: Parameters<ReturnType<typeof createAlinhamentoLugar>['alignTick']>): ReturnType<ReturnType<typeof createAlinhamentoLugar>['alignTick']> { return (alinhaSys ??= mk_alinhaSys()).alignTick(...a); }

/* A FESTA DA CIDADE (alinhamento kármico): convite, banquete, bardos, falas, brindes, alegria e a festa em grupo. Saiu do main.ts (02/11). → sistemas/festa.ts */
export interface FestaCtx {
  readonly npcSys: Widen<typeof npcSys>;
  readonly quests: Widen<typeof quests>;
  readonly npcHome: Widen<typeof npcHome>;
  readonly city: Widen<typeof city>;
  readonly hereSettle: Widen<typeof hereSettle>;
  readonly align: Widen<typeof align>;
  readonly profile: Profile | null;
  readonly game: Widen<typeof game>;
  readonly state: Widen<typeof state>;
  readonly scene: Widen<typeof scene>;
  readonly settleAt: Widen<typeof settleAt>;
  nightOverride: number | null;
  nightTarget: Widen<typeof entradaSys.nightTarget>;
  readonly audio: Widen<typeof audio>;
  readonly inv: Widen<typeof inv>;
  readonly addKarma: typeof addKarma;
  readonly heroPos: Widen<typeof heroPos>;
  readonly evFx: Widen<typeof evFx>;
  readonly portraitOf: typeof portraitOf;
  readonly openDlg: Widen<typeof openDlg>;
  readonly hero: Hero3D;
  readonly particles: Widen<typeof particles>;
  readonly netRef: Net | null;
  readonly net: Widen<typeof net>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly dwarfEl: Widen<typeof dwarfEl>;
}
var festaSys: ReturnType<typeof createFesta>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_festaSys() { return createFesta({ get npcSys() { return npcSys; }, get quests() { return quests; }, get npcHome() { return npcHome; }, get city() { return city; }, get hereSettle() { return hereSettle; }, get align() { return align; }, get profile() { return profile; }, get game() { return game; }, get state() { return state; }, get scene() { return scene; }, get settleAt() { return settleAt; }, get nightOverride() { return nightOverride; }, set nightOverride(v) { nightOverride = v; }, get nightTarget() { return entradaSys.nightTarget; }, set nightTarget(v) { entradaSys.nightTarget = v; }, get audio() { return audio; }, get inv() { return inv; }, get addKarma() { return addKarma; }, get heroPos() { return heroPos; }, get evFx() { return evFx; }, get portraitOf() { return portraitOf; }, get openDlg() { return openDlg; }, get hero() { return hero; }, get particles() { return particles; }, get netRef() { return netRef; }, get net() { return net; }, get inside() { return inside; }, get dwarfEl() { return dwarfEl; } }); }
festaSys ??= mk_festaSys();
const { joyAura, festasNet } = festaSys;
function startFesta(...a: Parameters<ReturnType<typeof createFesta>['startFesta']>): ReturnType<ReturnType<typeof createFesta>['startFesta']> { return (festaSys ??= mk_festaSys()).startFesta(...a); }
function leavingQuest(...a: Parameters<ReturnType<typeof createFesta>['leavingQuest']>): ReturnType<ReturnType<typeof createFesta>['leavingQuest']> { return (festaSys ??= mk_festaSys()).leavingQuest(...a); }
function festaStatus(...a: Parameters<ReturnType<typeof createFesta>['festaStatus']>): ReturnType<ReturnType<typeof createFesta>['festaStatus']> { return (festaSys ??= mk_festaSys()).festaStatus(...a); }
function festaOffer(...a: Parameters<ReturnType<typeof createFesta>['festaOffer']>): ReturnType<ReturnType<typeof createFesta>['festaOffer']> { return (festaSys ??= mk_festaSys()).festaOffer(...a); }
function festaTick(...a: Parameters<ReturnType<typeof createFesta>['festaTick']>): ReturnType<ReturnType<typeof createFesta>['festaTick']> { return (festaSys ??= mk_festaSys()).festaTick(...a); }
function joyUntil(...a: Parameters<ReturnType<typeof createFesta>['joyUntil']>): ReturnType<ReturnType<typeof createFesta>['joyUntil']> { return (festaSys ??= mk_festaSys()).joyUntil(...a); }
function festaTalk(...a: Parameters<ReturnType<typeof createFesta>['festaTalk']>): ReturnType<ReturnType<typeof createFesta>['festaTalk']> { return (festaSys ??= mk_festaSys()).festaTalk(...a); }
function festaFade(...a: Parameters<ReturnType<typeof createFesta>['festaFade']>): ReturnType<ReturnType<typeof createFesta>['festaFade']> { return (festaSys ??= mk_festaSys()).festaFade(...a); }
function festaAskJoin(...a: Parameters<ReturnType<typeof createFesta>['festaAskJoin']>): ReturnType<ReturnType<typeof createFesta>['festaAskJoin']> { return (festaSys ??= mk_festaSys()).festaAskJoin(...a); }
function festaAnim(...a: Parameters<ReturnType<typeof createFesta>['festaAnim']>): ReturnType<ReturnType<typeof createFesta>['festaAnim']> { return (festaSys ??= mk_festaSys()).festaAnim(...a); }
/* MOBÍLIA E DECORAÇÃO NA CASA (decor.ts tem as 50 peças): escolher, encaixar no terreno ou no interior, guardar, ver a dos outros, a peça rara que cai. Saiu do main.ts (02/11). → sistemas/decoracao.ts */
export interface DecoracaoCtx {
  readonly scene: Widen<typeof scene>;
  readonly obras: Widen<typeof obras>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly homeProp: (typeof city.props)[number] | null;
  readonly game: Widen<typeof game>;
  readonly heroPosNow: Widen<typeof heroPosNow>;
  readonly build: Widen<typeof build>;
  readonly mouse: Widen<typeof mouse>;
  readonly IX: Widen<typeof IX>;
  readonly IZ: Widen<typeof IZ>;
  readonly inv: Widen<typeof inv>;
  readonly audio: Widen<typeof audio>;
  readonly otherDecor: Widen<typeof otherDecor>;
  readonly canvas: Widen<typeof canvas>;
  readonly particles: Widen<typeof particles>;
}
var decoSys: ReturnType<typeof createDecoracao>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_decoSys() { return createDecoracao({ get scene() { return scene; }, get obras() { return obras; }, get inside() { return inside; }, get homeProp() { return construcaoSys.homeProp; }, get game() { return game; }, get heroPosNow() { return heroPosNow; }, get build() { return build; }, get mouse() { return mouse; }, get IX() { return IX; }, get IZ() { return IZ; }, get inv() { return inv; }, get audio() { return audio; }, get otherDecor() { return otherDecor; }, get canvas() { return canvas; }, get particles() { return particles; } }); }
decoSys ??= mk_decoSys();
const { decoOut, decoOthers } = decoSys;
function placeDecor(...a: Parameters<ReturnType<typeof createDecoracao>['placeDecor']>): ReturnType<ReturnType<typeof createDecoracao>['placeDecor']> { return (decoSys ??= mk_decoSys()).placeDecor(...a); }
function decoRender(...a: Parameters<ReturnType<typeof createDecoracao>['decoRender']>): ReturnType<ReturnType<typeof createDecoracao>['decoRender']> { return (decoSys ??= mk_decoSys()).decoRender(...a); }
function decoRenderOthers(...a: Parameters<ReturnType<typeof createDecoracao>['decoRenderOthers']>): ReturnType<ReturnType<typeof createDecoracao>['decoRenderOthers']> { return (decoSys ??= mk_decoSys()).decoRenderOthers(...a); }
function decoDrop(...a: Parameters<ReturnType<typeof createDecoracao>['decoDrop']>): ReturnType<ReturnType<typeof createDecoracao>['decoDrop']> { return (decoSys ??= mk_decoSys()).decoDrop(...a); }
function decoInterior(...a: Parameters<ReturnType<typeof createDecoracao>['decoInterior']>): ReturnType<ReturnType<typeof createDecoracao>['decoInterior']> { return (decoSys ??= mk_decoSys()).decoInterior(...a); }
function decoCancel(...a: Parameters<ReturnType<typeof createDecoracao>['decoCancel']>): ReturnType<ReturnType<typeof createDecoracao>['decoCancel']> { return (decoSys ??= mk_decoSys()).decoCancel(...a); }
function decoNear(...a: Parameters<ReturnType<typeof createDecoracao>['decoNear']>): ReturnType<ReturnType<typeof createDecoracao>['decoNear']> { return (decoSys ??= mk_decoSys()).decoNear(...a); }
function decoPickup(...a: Parameters<ReturnType<typeof createDecoracao>['decoPickup']>): ReturnType<ReturnType<typeof createDecoracao>['decoPickup']> { return (decoSys ??= mk_decoSys()).decoPickup(...a); }
function decoTick(...a: Parameters<ReturnType<typeof createDecoracao>['decoTick']>): ReturnType<ReturnType<typeof createDecoracao>['decoTick']> { return (decoSys ??= mk_decoSys()).decoTick(...a); }

/* a Bobina de Choque e a água (28/10): pisar na água (mais de um palmo) com ela ligada é morte certa — o aviso está na caixa */
game.setWaterCheck(() => !inside && !game.st.dead && !colisaoSys.onWall && WL - heightAt(state.fx * T, state.fy * T) > 0.22 && heroY < WL - 0.05); /* ponte e muralha não contam: o pé tem que estar na água */
/** a dança continua enquanto você fica parado; andar, lutar ou entrar em algum lugar para */
const emote = { dance: false, x: 0, y: 0 };
function emoteTick() { if (!emote.dance) return; if (Math.hypot(state.fx - emote.x, state.fy - emote.y) > 0.05 || hero.combat || game.st.dead) { emote.dance = false; if (hero.actName === 'dance') hero.stopAct?.(); return; }
  if (!hero.acting) { hero.act('dance', true); netRef?.act('dance'); } }
function joyAnim(t: number) { const on = joyUntil() > Date.now() && !inside; joyAura.visible = on; if (!on) return; joyAura.position.copy(hero.root.position);
  joyAura.children.forEach((c, i) => { const a = c.userData.a + t * (i % 2 ? 0.9 : -1.3), r = 1.05 + Math.sin(t * 2 + i) * 0.12; c.position.set(Math.cos(a) * r, 1.0 + Math.sin(t * 2.4 + i * 0.8) * 0.45 + (i % 2) * 0.5, Math.sin(a) * r); }); }
/* EVENTOS VIVOS NA TELA: o resultado do evento, o aviso de evento por perto (faixa que entra pela direita) e a atualização dos eventos. Saiu do main.ts (02/11). → sistemas/eventos-ui.ts */
export interface EventosUiCtx {
  readonly gevNote: typeof gevNote;
  readonly hereSettle: Widen<typeof hereSettle>;
  readonly align: Widen<typeof align>;
  readonly addKarma: typeof addKarma;
  readonly game: Widen<typeof game>;
  readonly applyReply: typeof applyReply;
  readonly evResEl: Widen<typeof evResEl>;
  readonly audio: Widen<typeof audio>;
  readonly quests: Widen<typeof quests>;
  readonly eventos: Widen<typeof eventos>;
  readonly guiaSys: ReturnType<typeof createGuiaMapa>;
  readonly openDlg: Widen<typeof openDlg>;
  readonly dlg: Widen<typeof dlg>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly t: Widen<typeof t>;
  readonly hereT: typeof hereT;
  readonly evTrkEl: Widen<typeof evTrkEl>;
  readonly gOpen: Widen<typeof gOpen>;
  readonly evBanEl: Widen<typeof evBanEl>;
  readonly globalSideText: typeof globalSideText;
  readonly globalSide: typeof globalSide;
}
var eventosUiSys: ReturnType<typeof createEventosUi>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_eventosUiSys() { return createEventosUi({ get gevNote() { return gevNote; }, get hereSettle() { return hereSettle; }, get align() { return align; }, get addKarma() { return addKarma; }, get game() { return game; }, get applyReply() { return applyReply; }, get evResEl() { return evResEl; }, get audio() { return audio; }, get quests() { return quests; }, get eventos() { return eventos; }, get guiaSys() { return guiaSys; }, get openDlg() { return openDlg; }, get dlg() { return dlg; }, get inside() { return inside; }, get t() { return t; }, get hereT() { return hereT; }, get evTrkEl() { return evTrkEl; }, get gOpen() { return gOpen; }, get evBanEl() { return evBanEl; }, get globalSideText() { return globalSideText; }, get globalSide() { return globalSide; } }); }
eventosUiSys ??= mk_eventosUiSys();
function showEvResult(...a: Parameters<ReturnType<typeof createEventosUi>['showEvResult']>): ReturnType<ReturnType<typeof createEventosUi>['showEvResult']> { return (eventosUiSys ??= mk_eventosUiSys()).showEvResult(...a); }
function updateEventos(...a: Parameters<ReturnType<typeof createEventosUi>['updateEventos']>): ReturnType<ReturnType<typeof createEventosUi>['updateEventos']> { return (eventosUiSys ??= mk_eventosUiSys()).updateEventos(...a); }

/* INSTINTO DE CLASSE e POSTURAS: ligar/desligar (F), duração e recarga, a aura, a lente e o anel; a barra de posturas, o círculo rúnico nos pés, o aviso grande e a névoa da treva. Saiu do main.ts (02/11). → sistemas/instinto-posturas.ts */
export interface InstintoPosturasCtx {
  readonly myPath: typeof myPath;
  readonly profile: Profile | null;
  readonly game: Widen<typeof game>;
  readonly audio: Widen<typeof audio>;
  readonly scene: Widen<typeof scene>;
  readonly heroPos: Widen<typeof heroPos>;
  readonly particles: Widen<typeof particles>;
  readonly camera: Widen<typeof camera>;
  readonly canvas: Widen<typeof canvas>;
  readonly heroPosNow: Widen<typeof heroPosNow>;
  readonly objs: Widen<typeof objs>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly hero: Hero3D;
  readonly riding: Widen<typeof compSys.riding>;
  readonly soul: Widen<typeof soul>;
  readonly buffEl: Widen<typeof buffEl>;
  readonly quests: Widen<typeof quests>;
}
var instintoSys: ReturnType<typeof createInstintoPosturas>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_instintoSys() { return createInstintoPosturas({ get myPath() { return myPath; }, get profile() { return profile; }, get game() { return game; }, get audio() { return audio; }, get scene() { return scene; }, get heroPos() { return heroPos; }, get particles() { return particles; }, get camera() { return camera; }, get canvas() { return canvas; }, get heroPosNow() { return heroPosNow; }, get objs() { return objs; }, get inside() { return inside; }, get hero() { return hero; }, get riding() { return compSys.riding; }, get soul() { return soul; }, get buffEl() { return buffEl; }, get quests() { return quests; } }); }
instintoSys ??= mk_instintoSys();
const { myInstinct } = instintoSys;
function toggleInstinct(...a: Parameters<ReturnType<typeof createInstintoPosturas>['toggleInstinct']>): ReturnType<ReturnType<typeof createInstintoPosturas>['toggleInstinct']> { return (instintoSys ??= mk_instintoSys()).toggleInstinct(...a); }
function renderStances(...a: Parameters<ReturnType<typeof createInstintoPosturas>['renderStances']>): ReturnType<ReturnType<typeof createInstintoPosturas>['renderStances']> { return (instintoSys ??= mk_instintoSys()).renderStances(...a); }
function stanceRing(...a: Parameters<ReturnType<typeof createInstintoPosturas>['stanceRing']>): ReturnType<ReturnType<typeof createInstintoPosturas>['stanceRing']> { return (instintoSys ??= mk_instintoSys()).stanceRing(...a); }
function darkMist(...a: Parameters<ReturnType<typeof createInstintoPosturas>['darkMist']>): ReturnType<ReturnType<typeof createInstintoPosturas>['darkMist']> { return (instintoSys ??= mk_instintoSys()).darkMist(...a); }
function updateInstFx(...a: Parameters<ReturnType<typeof createInstintoPosturas>['updateInstFx']>): ReturnType<ReturnType<typeof createInstintoPosturas>['updateInstFx']> { return (instintoSys ??= mk_instintoSys()).updateInstFx(...a); }

/* O QUE SÓ O INSTINTO MOSTRA: rastros das missões, espíritos, esconderijos (cachês), o Caderno de Ormund, os alvos sentidos e as falas do herói (instinto.ts). Saiu do main.ts (02/11). → sistemas/segredos-instinto.ts */
export interface SegredosInstintoCtx {
  readonly city: Widen<typeof city>;
  readonly evSites: Widen<typeof evSites>;
  readonly navProbe: Widen<typeof navProbe>;
  readonly scene: Widen<typeof scene>;
  readonly heroPos: Widen<typeof heroPos>;
  readonly myInstinct: Widen<typeof myInstinct>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly carBubble: typeof carBubble;
  readonly game: Widen<typeof game>;
  readonly audio: Widen<typeof audio>;
  readonly inv: Widen<typeof inv>;
  readonly particles: Widen<typeof particles>;
  readonly quests: Widen<typeof quests>;
  readonly free: Widen<typeof free>;
  readonly npcSys: Widen<typeof npcSys>;
  readonly t: Widen<typeof t>;
  readonly instinctOn: Widen<typeof instintoSys.instinctOn>;
  readonly state: Widen<typeof state>;
  readonly profile: Profile | null;
  readonly myPath: typeof myPath;
  readonly bubble: typeof bubble;
  readonly canvas: Widen<typeof canvas>;
  readonly net: Widen<typeof net>;
  readonly cinemaSys: ReturnType<typeof createCinemaVistas>;
  readonly soulLean: typeof soulLean;
}
var segredosSys: ReturnType<typeof createSegredosInstinto>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_segredosSys() { return createSegredosInstinto({ get city() { return city; }, get evSites() { return evSites; }, get navProbe() { return navProbe; }, get scene() { return scene; }, get heroPos() { return heroPos; }, get myInstinct() { return myInstinct; }, get inside() { return inside; }, get carBubble() { return carBubble; }, get game() { return game; }, get audio() { return audio; }, get inv() { return inv; }, get particles() { return particles; }, get quests() { return quests; }, get free() { return free; }, get npcSys() { return npcSys; }, get t() { return t; }, get instinctOn() { return instintoSys.instinctOn; }, get state() { return state; }, get profile() { return profile; }, get myPath() { return myPath; }, get bubble() { return bubble; }, get canvas() { return canvas; }, get net() { return net; }, get cinemaSys() { return cinemaSys; }, get soulLean() { return soulLean; } }); }
segredosSys ??= mk_segredosSys();
const { ormund, secrets } = segredosSys;
function senseGoals(...a: Parameters<ReturnType<typeof createSegredosInstinto>['senseGoals']>): ReturnType<ReturnType<typeof createSegredosInstinto>['senseGoals']> { return (segredosSys ??= mk_segredosSys()).senseGoals(...a); }
function digCache(...a: Parameters<ReturnType<typeof createSegredosInstinto>['digCache']>): ReturnType<ReturnType<typeof createSegredosInstinto>['digCache']> { return (segredosSys ??= mk_segredosSys()).digCache(...a); }
function updateInstinct(...a: Parameters<ReturnType<typeof createSegredosInstinto>['updateInstinct']>): ReturnType<ReturnType<typeof createSegredosInstinto>['updateInstinct']> { return (segredosSys ??= mk_segredosSys()).updateInstinct(...a); }
function updateSecrets(...a: Parameters<ReturnType<typeof createSegredosInstinto>['updateSecrets']>): ReturnType<ReturnType<typeof createSegredosInstinto>['updateSecrets']> { return (segredosSys ??= mk_segredosSys()).updateSecrets(...a); }

/* CONVERSA COM NPC: o retrato (cabeça 3D renderizada e guardada), missões para entregar e novas, comércio, a forja de elite. Saiu do main.ts (02/11). → sistemas/conversa-npc.ts */
export interface ConversaNpcCtx {
  readonly peleSys: ReturnType<typeof createPeleHeroi>;
  readonly hero: Hero3D;
  readonly renderer: Widen<typeof renderer>;
  readonly npcSys: Widen<typeof npcSys>;
  readonly SHOP_BY_NAME: Widen<typeof SHOP_BY_NAME>;
  readonly quests: Widen<typeof quests>;
  readonly openDlg: Widen<typeof openDlg>;
  readonly festaSys: ReturnType<typeof createFesta>;
  readonly festaTalk: typeof festaTalk;
  readonly inv: Widen<typeof inv>;
  readonly game: Widen<typeof game>;
  readonly prepLatao: typeof prepLatao;
  readonly shopLeanK: typeof shopLeanK;
  readonly dlg: Widen<typeof dlg>;
  readonly loja: Widen<typeof loja>;
  readonly hereSettle: Widen<typeof hereSettle>;
  readonly align: Widen<typeof align>;
  readonly leavingQuest: typeof leavingQuest;
  readonly festaFade: typeof festaFade;
  readonly profile: Profile | null;
  readonly startFesta: typeof startFesta;
  readonly CARTA_K: Widen<typeof CARTA_K>;
  readonly social: Widen<typeof social>;
  readonly vid: Widen<typeof vid>;
  readonly soul: Widen<typeof soul>;
  readonly hasMark: typeof hasMark;
  readonly soulLean: typeof soulLean;
  readonly applyReply: typeof applyReply;
  readonly addKarma: typeof addKarma;
  readonly state: Widen<typeof state>;
  readonly audio: Widen<typeof audio>;
}
var conversaSys: ReturnType<typeof createConversaNpc>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_conversaSys() { return createConversaNpc({ get peleSys() { return peleSys; }, get hero() { return hero; }, get renderer() { return snapR(); }, get npcSys() { return npcSys; }, get SHOP_BY_NAME() { return SHOP_BY_NAME; }, get quests() { return quests; }, get openDlg() { return openDlg; }, get festaSys() { return festaSys; }, get festaTalk() { return festaTalk; }, get inv() { return inv; }, get game() { return game; }, get prepLatao() { return prepLatao; }, get shopLeanK() { return shopLeanK; }, get dlg() { return dlg; }, get loja() { return loja; }, get hereSettle() { return hereSettle; }, get align() { return align; }, get leavingQuest() { return leavingQuest; }, get festaFade() { return festaFade; }, get profile() { return profile; }, get startFesta() { return startFesta; }, get CARTA_K() { return CARTA_K; }, get social() { return social; }, get vid() { return vid; }, get soul() { return soul; }, get hasMark() { return hasMark; }, get soulLean() { return soulLean; }, get applyReply() { return applyReply; }, get addKarma() { return addKarma; }, get state() { return state; }, get audio() { return audio; } }); }
conversaSys ??= mk_conversaSys();
const { portraits } = conversaSys;
function portraitOf(...a: Parameters<ReturnType<typeof createConversaNpc>['portraitOf']>): ReturnType<ReturnType<typeof createConversaNpc>['portraitOf']> { return (conversaSys ??= mk_conversaSys()).portraitOf(...a); }
function eliteForge(...a: Parameters<ReturnType<typeof createConversaNpc>['eliteForge']>): ReturnType<ReturnType<typeof createConversaNpc>['eliteForge']> { return (conversaSys ??= mk_conversaSys()).eliteForge(...a); }
function talkTo(...a: Parameters<ReturnType<typeof createConversaNpc>['talkTo']>): ReturnType<ReturnType<typeof createConversaNpc>['talkTo']> { return (conversaSys ??= mk_conversaSys()).talkTo(...a); }

/* COMPÊNDIO, BUSCA E CAPTURA (quem mentiu e fugiu) e MATERIAIS DE ELITE: o diário de criaturas, a caça ao fugitivo e o que os bichos elite deixam. Saiu do main.ts (02/11). → sistemas/caca-elite.ts */
export interface CacaEliteCtx {
  readonly zoneName: typeof zoneName;
  readonly dayIndex: typeof dayIndex;
  readonly game: Widen<typeof game>;
  readonly heroPosNow: Widen<typeof heroPosNow>;
  readonly city: Widen<typeof city>;
  readonly quests: Widen<typeof quests>;
  readonly addKarma: typeof addKarma;
  readonly inv: Widen<typeof inv>;
  readonly feats: Widen<typeof feats>;
  readonly breakVow: typeof breakVow;
  readonly profile: Profile | null;
  readonly audio: Widen<typeof audio>;
  readonly particles: Widen<typeof particles>;
  readonly decoDrop: typeof decoDrop;
  readonly featKill: typeof featKill;
  readonly eventos: Widen<typeof eventos>;
  readonly gevNote: typeof gevNote;
  readonly alignKill: typeof alignKill;
  readonly myPath: typeof myPath;
  readonly feastOnKill: typeof feastOnKill;
  readonly dgs: Widen<typeof dgs>;
  readonly SKIN: Widen<typeof SKIN>;
  readonly pourBlood: typeof pourBlood;
  readonly CRYPT_FLOORS: Widen<typeof CRYPT_FLOORS>;
  readonly chat: Widen<typeof chat>;
  readonly heroicAct: typeof heroicAct;
  readonly updateWho: typeof updateWho;
}
var cacaSys: ReturnType<typeof createCacaElite>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_cacaSys() { return createCacaElite({ get zoneName() { return zoneName; }, get dayIndex() { return dayIndex; }, get game() { return game; }, get heroPosNow() { return heroPosNow; }, get city() { return city; }, get quests() { return quests; }, get addKarma() { return addKarma; }, get inv() { return inv; }, get feats() { return feats; }, get breakVow() { return breakVow; }, get profile() { return profile; }, get audio() { return audio; }, get particles() { return particles; }, get decoDrop() { return decoDrop; }, get featKill() { return featKill; }, get eventos() { return eventos; }, get gevNote() { return gevNote; }, get alignKill() { return alignKill; }, get myPath() { return myPath; }, get feastOnKill() { return feastOnKill; }, get dgs() { return dgs; }, get SKIN() { return SKIN; }, get pourBlood() { return pourBlood; }, get CRYPT_FLOORS() { return CRYPT_FLOORS; }, get chat() { return chat; }, get heroicAct() { return heroicAct; }, get updateWho() { return updateWho; } }); }
cacaSys ??= mk_cacaSys();
const { compendium } = cacaSys;

/* O OLHO DE MARGHAR: o globo de vida/recurso, o despertar no nível 20, o menu do Olho no centro da barra, atos heroicos e lágrimas; quem está online. Saiu do main.ts (02/11). → sistemas/olho.ts */
export interface OlhoCtx {
  readonly profile: Profile | null;
  readonly game: Widen<typeof game>;
  readonly soul: Widen<typeof soul>;
  readonly compendium: Widen<typeof compendium>;
  readonly state: Widen<typeof state>;
  readonly feats: Widen<typeof feats>;
  readonly addKarma: typeof addKarma;
  readonly quests: Widen<typeof quests>;
  readonly myPath: typeof myPath;
  readonly inv: Widen<typeof inv>;
  readonly audio: Widen<typeof audio>;
}
var olhoSys: ReturnType<typeof createOlho>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_olhoSys() { return createOlho({ get profile() { return profile; }, get game() { return game; }, get soul() { return soul; }, get compendium() { return compendium; }, get state() { return state; }, get feats() { return feats; }, get addKarma() { return addKarma; }, get quests() { return quests; }, get myPath() { return myPath; }, get inv() { return inv; }, get audio() { return audio; } }); }
olhoSys ??= mk_olhoSys();
const { crestEl, globes, eyeSys } = olhoSys;
function updateWho(...a: Parameters<ReturnType<typeof createOlho>['updateWho']>): ReturnType<ReturnType<typeof createOlho>['updateWho']> { return (olhoSys ??= mk_olhoSys()).updateWho(...a); }
function heroicAct(...a: Parameters<ReturnType<typeof createOlho>['heroicAct']>): ReturnType<ReturnType<typeof createOlho>['heroicAct']> { return (olhoSys ??= mk_olhoSys()).heroicAct(...a); }
function toggleOlho(...a: Parameters<ReturnType<typeof createOlho>['toggleOlho']>): ReturnType<ReturnType<typeof createOlho>['toggleOlho']> { return (olhoSys ??= mk_olhoSys()).toggleOlho(...a); }
function checkAwakening(...a: Parameters<ReturnType<typeof createOlho>['checkAwakening']>): ReturnType<ReturnType<typeof createOlho>['checkAwakening']> { return (olhoSys ??= mk_olhoSys()).checkAwakening(...a); }

/* TELA DE CRIAÇÃO DE PERSONAGEM e RENASCIMENTO: origem, sexo, nome, retrato girando; nascer de novo depois da morte. Saiu do main.ts (02/11). → sistemas/criacao.ts */
export interface CriacaoCtx {
  readonly soul: Widen<typeof soul>;
  profile: Profile | null;
  readonly state: Widen<typeof state>;
  readonly raceOf: Widen<typeof raceOf>;
  readonly game: Widen<typeof game>;
  readonly classOfRace: Widen<typeof classOfRace>;
  readonly quests: Widen<typeof quests>;
  readonly tree: Widen<typeof tree>;
  readonly inv: Widen<typeof inv>;
  readonly swapHero: typeof swapHero;
  readonly updateWho: typeof updateWho;
  readonly checkSkinLevel: typeof checkSkinLevel;
  readonly city: Widen<typeof city>;
  readonly limiar: Widen<typeof limiar>;
  readonly placeAt: typeof placeAt;
  readonly goHome: typeof goHome;
  readonly netRef: Net | null;
  readonly saveSlotMeta: typeof saveSlotMeta;
  readonly peleSys: ReturnType<typeof createPeleHeroi>;
  readonly keys: Widen<typeof keys>;
  readonly HAIRS: Widen<typeof HAIRS>;
  readonly SKINS: Widen<typeof SKINS>;
  readonly hero: Hero3D;
  readonly inicio: Widen<typeof inicio>;
  readonly pendingServer: string | null;
  readonly withFade: typeof withFade;
  readonly HOME_KEY: Widen<typeof HOME_KEY>;
  readonly larSys: ReturnType<typeof createLarMorte>;
  readonly defaultHome: Widen<typeof defaultHome>;
  readonly setCombat: typeof setCombat;
  readonly joinServer: typeof joinServer;
  readonly mail: Widen<typeof mail>;
  readonly giveStartKit: typeof giveStartKit;
  portraitYaw: Widen<typeof conversaSys.portraitYaw>;
  readonly portraits: Widen<typeof portraits>;
  readonly portraitOf: typeof portraitOf;
}
var criacaoSys: ReturnType<typeof createCriacao>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_criacaoSys() { return createCriacao({ get soul() { return soul; }, get profile() { return profile; }, set profile(v) { profile = v; }, get state() { return state; }, get raceOf() { return raceOf; }, get game() { return game; }, get classOfRace() { return classOfRace; }, get quests() { return quests; }, get tree() { return tree; }, get inv() { return inv; }, get swapHero() { return swapHero; }, get updateWho() { return updateWho; }, get checkSkinLevel() { return checkSkinLevel; }, get city() { return city; }, get limiar() { return limiar; }, get placeAt() { return placeAt; }, get goHome() { return goHome; }, get netRef() { return netRef; }, get saveSlotMeta() { return saveSlotMeta; }, get peleSys() { return peleSys; }, get keys() { return keys; }, get HAIRS() { return HAIRS; }, get SKINS() { return SKINS; }, get hero() { return hero; }, get inicio() { return inicio; }, get pendingServer() { return socialSys.pendingServer; }, get withFade() { return withFade; }, get HOME_KEY() { return HOME_KEY; }, get larSys() { return larSys; }, get defaultHome() { return defaultHome; }, get setCombat() { return setCombat; }, get joinServer() { return joinServer; }, get mail() { return mail; }, get giveStartKit() { return giveStartKit; }, get portraitYaw() { return conversaSys.portraitYaw; }, set portraitYaw(v) { conversaSys.portraitYaw = v; }, get portraits() { return portraits; }, get portraitOf() { return portraitOf; } }); }
criacaoSys ??= mk_criacaoSys();
function showCreate(...a: Parameters<ReturnType<typeof createCriacao>['showCreate']>): ReturnType<ReturnType<typeof createCriacao>['showCreate']> { return (criacaoSys ??= mk_criacaoSys()).showCreate(...a); }

/* PÁGINA DE OPÇÕES (gráficos, som e jogo, ao vivo) e ACESSIBILIDADE (escala do texto). Saiu do main.ts (02/11). → sistemas/opcoes.ts */
export interface OpcoesCtx {
  readonly saveOpts: Widen<typeof saveOpts>;
  readonly applyGfx: typeof applyGfx;
  PIX: Widen<typeof PIX>;
  readonly opts: Widen<typeof opts>;
  WORLD_RATIO: Widen<typeof WORLD_RATIO>;
  readonly dual: Widen<typeof dual>;
  readonly resize: typeof resize;
  readonly renderer: Widen<typeof renderer>;
  readonly scene: Widen<typeof scene>;
  readonly hero: Hero3D;
  readonly npcSys: Widen<typeof npcSys>;
  readonly sun: Widen<typeof sun>;
  readonly particles: Widen<typeof particles>;
  readonly audio: Widen<typeof audio>;
  readonly uiScale: typeof uiScale;
  zoomTarget: Widen<typeof zoomTarget>;
  readonly game: Widen<typeof game>;
  readonly OPT_DEF: Widen<typeof OPT_DEF>;
  readonly applyArtSkin: typeof applyArtSkin;
}
var opcoesSys: ReturnType<typeof createOpcoes>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_opcoesSys() { return createOpcoes({ get saveOpts() { return saveOpts; }, get applyGfx() { return applyGfx; }, get PIX() { return PIX; }, set PIX(v) { PIX = v; }, get opts() { return opts; }, get WORLD_RATIO() { return WORLD_RATIO; }, set WORLD_RATIO(v) { WORLD_RATIO = v; }, get dual() { return dual; }, get resize() { return resize; }, get renderer() { return renderer; }, get scene() { return scene; }, get hero() { return hero; }, get npcSys() { return npcSys; }, get sun() { return sun; }, get particles() { return particles; }, get audio() { return audio; }, get uiScale() { return uiScale; }, get zoomTarget() { return zoomTarget; }, set zoomTarget(v) { zoomTarget = v; }, get game() { return game; }, get OPT_DEF() { return OPT_DEF; }, get applyArtSkin() { return applyArtSkin; } }); }
opcoesSys ??= mk_opcoesSys();
 // depois de o renderizador/composer existirem
setInterval(() => inv.save(), 8000);
/* ÍNDICE DE PROPS POR TILE, BAÚS, KIT INICIAL E PESCA: a vara, a boia, a linha e a fisgada. Saiu do main.ts (02/11). → sistemas/pesca-e-kit.ts */
export interface PescaKitCtx {
  readonly city: Widen<typeof city>;
  readonly game: Widen<typeof game>;
  readonly profile: Profile | null;
  readonly walksPath: typeof walksPath;
  readonly inv: Widen<typeof inv>;
  readonly combatMode: Widen<typeof entradaSys.combatMode>;
  readonly setCombat: typeof setCombat;
  readonly hero: Hero3D;
  readonly audio: Widen<typeof audio>;
  readonly syncGear: typeof syncGear;
  readonly scene: Widen<typeof scene>;
  readonly keys: Widen<typeof keys>;
  readonly particles: Widen<typeof particles>;
  readonly profs: Widen<typeof profs>;
  readonly feats: Widen<typeof feats>;
}
var pescaSys: ReturnType<typeof createPescaKit>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_pescaSys() { return createPescaKit({ get city() { return city; }, get game() { return game; }, get profile() { return profile; }, get walksPath() { return walksPath; }, get inv() { return inv; }, get combatMode() { return entradaSys.combatMode; }, get setCombat() { return setCombat; }, get hero() { return hero; }, get audio() { return audio; }, get syncGear() { return syncGear; }, get scene() { return scene; }, get keys() { return keys; }, get particles() { return particles; }, get profs() { return profs; }, get feats() { return feats; } }); }
pescaSys ??= mk_pescaSys();
const { chestsOpen, chop, twigs, tileIdx } = pescaSys;
function nearProps(...a: Parameters<ReturnType<typeof createPescaKit>['nearProps']>): ReturnType<ReturnType<typeof createPescaKit>['nearProps']> { return (pescaSys ??= mk_pescaSys()).nearProps(...a); }
function idx(...a: Parameters<ReturnType<typeof createPescaKit>['idx']>): ReturnType<ReturnType<typeof createPescaKit>['idx']> { return (pescaSys ??= mk_pescaSys()).idx(...a); }
function giveStartKit(...a: Parameters<ReturnType<typeof createPescaKit>['giveStartKit']>): ReturnType<ReturnType<typeof createPescaKit>['giveStartKit']> { return (pescaSys ??= mk_pescaSys()).giveStartKit(...a); }
function welcomeKit(...a: Parameters<ReturnType<typeof createPescaKit>['welcomeKit']>): ReturnType<ReturnType<typeof createPescaKit>['welcomeKit']> { return (pescaSys ??= mk_pescaSys()).welcomeKit(...a); }
/* 09/11 (Erling: "o arremesso tem que ser mais longe; se o rio for pequeno, no meio, mas nunca tão perto da borda; sempre de frente para o rio ou lago"):
   procura em 24 direções a de água mais aberta (a corrida de água mais longa a partir da margem) e lança até o meio dela, no máximo 7 m água adentro.
   O herói já vira para onde a boia cai. */
function fishTarget(hx: number, hz: number): { x: number; z: number } | null {
  let best: { x: number; z: number } | null = null, bestRun = 0;
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, ux = Math.sin(a), uz = Math.cos(a); let d0 = -1, run = 0;
    for (let d = 0.8; d <= 18; d += 0.4) { const w = waterSD(hx + ux * d, hz + uz * d) < -0.25; if (d0 < 0) { if (w) d0 = d; else if (d > 7) break; } else if (w) run = d - d0; else break; }
    if (d0 < 0 || run < 0.8) continue; const score = Math.min(run, 14) - d0 * 0.6; if (score > bestRun) { bestRun = score; const dd = d0 + Math.min(run * 0.5, 7); best = { x: hx + ux * dd, z: hz + uz * dd }; } }
  return best;
}
function startFishing(...a: Parameters<ReturnType<typeof createPescaKit>['startFishing']>): ReturnType<ReturnType<typeof createPescaKit>['startFishing']> { return (pescaSys ??= mk_pescaSys()).startFishing(...a); }
function updateFishing(...a: Parameters<ReturnType<typeof createPescaKit>['updateFishing']>): ReturnType<ReturnType<typeof createPescaKit>['updateFishing']> { return (pescaSys ??= mk_pescaSys()).updateFishing(...a); }

/* MINIMAPA: a imagem base do mundo, o zoom, os ícones e marcadores, o mapa grande (janela) e seus cliques. Saiu do main.ts (02/11). → sistemas/minimapa.ts */
export interface MinimapaCtx {
  readonly MM_HG: Widen<typeof MM_HG>;
  readonly mmHw: Widen<typeof mmHw>;
  readonly mmHgt: Widen<typeof mmHgt>;
  readonly city: Widen<typeof city>;
  readonly guiaSys: ReturnType<typeof createGuiaMapa>;
  readonly drawMini: typeof drawMini;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly game: Widen<typeof game>;
  readonly combatMode: Widen<typeof entradaSys.combatMode>;
  readonly heroPosNow: Widen<typeof heroPosNow>;
  readonly setCombat: typeof setCombat;
  readonly travelRelic: typeof travelRelic;
  readonly hereT: typeof hereT;
  readonly knowsRelic: Widen<typeof knowsRelic>;
  readonly discovered: Widen<typeof discovered>;
  readonly dgs: Widen<typeof dgs>;
  readonly drawBig: typeof drawBig;
  readonly withFade: typeof withFade;
  readonly state: Widen<typeof state>;
  readonly objs: Widen<typeof objs>;
  heroY: Widen<typeof heroY>;
  camX: Widen<typeof camX>;
  camZ: Widen<typeof camZ>;
  camY: Widen<typeof camY>;
  readonly updateBanner: typeof updateBanner;
  readonly npcSys: Widen<typeof npcSys>;
  readonly SHOP_BY_NAME: Widen<typeof SHOP_BY_NAME>;
  readonly eventos: Widen<typeof eventos>;
  readonly CINE: Widen<typeof CINE>;
  readonly vistaSeen: Widen<typeof vistaSeen>;
}
var minimapaSys: ReturnType<typeof createMinimapa>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_minimapaSys() { return createMinimapa({ get MM_HG() { return MM_HG; }, get mmHw() { return mmHw; }, get mmHgt() { return mmHgt; }, get city() { return city; }, get guiaSys() { return guiaSys; }, get drawMini() { return drawMini; }, get inside() { return inside; }, get game() { return game; }, get combatMode() { return entradaSys.combatMode; }, get heroPosNow() { return heroPosNow; }, get setCombat() { return setCombat; }, get travelRelic() { return travelRelic; }, get hereT() { return hereT; }, get knowsRelic() { return knowsRelic; }, get discovered() { return discovered; }, get dgs() { return dgs; }, get drawBig() { return drawBig; }, get withFade() { return withFade; }, get state() { return state; }, get objs() { return objs; }, get heroY() { return heroY; }, set heroY(v) { heroY = v; }, get camX() { return camX; }, set camX(v) { camX = v; }, get camZ() { return camZ; }, set camZ(v) { camZ = v; }, get camY() { return camY; }, set camY(v) { camY = v; }, get updateBanner() { return updateBanner; }, get npcSys() { return npcSys; }, get SHOP_BY_NAME() { return SHOP_BY_NAME; }, get eventos() { return eventos; }, get CINE() { return CINE; }, get vistaSeen() { return vistaSeen; } }); }
minimapaSys ??= mk_minimapaSys();
const { mmBase, mapV, fmtDist, mmEl, mg, MMS, bmEl, bg, mapZMin, pxPerTile, bigEl, BNAME } = minimapaSys;
function toggleBigMap(...a: Parameters<ReturnType<typeof createMinimapa>['toggleBigMap']>): ReturnType<ReturnType<typeof createMinimapa>['toggleBigMap']> { return (minimapaSys ??= mk_minimapaSys()).toggleBigMap(...a); }
function markers(...a: Parameters<ReturnType<typeof createMinimapa>['markers']>): ReturnType<ReturnType<typeof createMinimapa>['markers']> { return (minimapaSys ??= mk_minimapaSys()).markers(...a); }
function miniIcons(...a: Parameters<ReturnType<typeof createMinimapa>['miniIcons']>): ReturnType<ReturnType<typeof createMinimapa>['miniIcons']> { return (minimapaSys ??= mk_minimapaSys()).miniIcons(...a); }

/* GUIA DE MISSÃO E MAPA GRANDE: onde fica o objetivo rastreado, a seta, o alfinete, os marcadores e o mapa do mundo. Saiu do main.ts (02/11). → sistemas/guia-mapa.ts */
export interface GuiaMapaCtx {
  readonly game: Widen<typeof game>;
  readonly audio: Widen<typeof audio>;
  readonly updateBanner: typeof updateBanner;
  readonly quests: Widen<typeof quests>;
  readonly state: Widen<typeof state>;
  readonly eventos: Widen<typeof eventos>;
  readonly npcSys: Widen<typeof npcSys>;
  readonly city: Widen<typeof city>;
  readonly dgs: Widen<typeof dgs>;
  readonly senseGoals: typeof senseGoals;
  readonly instinctOn: Widen<typeof instintoSys.instinctOn>;
  readonly caravans: Widen<typeof caravans>;
  readonly scene: Widen<typeof scene>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly heroPos: Widen<typeof heroPos>;
  readonly az: Widen<typeof az>;
  readonly fmtDist: Widen<typeof fmtDist>;
  readonly dlg: Widen<typeof dlg>;
  readonly canvas: Widen<typeof canvas>;
  readonly camera: Widen<typeof camera>;
  readonly hero: Hero3D;
  readonly IX: Widen<typeof IX>;
  readonly IZ: Widen<typeof IZ>;
  readonly mmEl: Widen<typeof mmEl>;
  readonly mg: Widen<typeof mg>;
  readonly mmBase: Widen<typeof mmBase>;
  readonly MMS: Widen<typeof MMS>;
  readonly markers: typeof markers;
  readonly miniIcons: typeof miniIcons;
  readonly bmEl: Widen<typeof bmEl>;
  readonly bg: Widen<typeof bg>;
  mapHits: MapHit[];
  readonly mapV: Widen<typeof mapV>;
  readonly mapZMin: Widen<typeof mapZMin>;
  readonly pxPerTile: Widen<typeof pxPerTile>;
  readonly PROF_NAME: Widen<typeof PROF_NAME>;
  readonly SHOP_BY_NAME: Widen<typeof SHOP_BY_NAME>;
  readonly CINE: Widen<typeof CINE>;
  readonly vistaSeen: Widen<typeof vistaSeen>;
  readonly knowsRelic: Widen<typeof knowsRelic>;
  readonly bigEl: Widen<typeof bigEl>;
  readonly BNAME: Widen<typeof BNAME>;
  readonly keys: Widen<typeof keys>;
  readonly inv: Widen<typeof inv>;
  readonly toggleBigMap: typeof toggleBigMap;
}
var guiaSys: ReturnType<typeof createGuiaMapa>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_guiaSys() { return createGuiaMapa({ get game() { return game; }, get audio() { return audio; }, get updateBanner() { return updateBanner; }, get quests() { return quests; }, get state() { return state; }, get eventos() { return eventos; }, get npcSys() { return npcSys; }, get city() { return city; }, get dgs() { return dgs; }, get senseGoals() { return senseGoals; }, get instinctOn() { return instintoSys.instinctOn; }, get caravans() { return caravans; }, get scene() { return scene; }, get inside() { return inside; }, get heroPos() { return heroPos; }, get az() { return az; }, get fmtDist() { return fmtDist; }, get dlg() { return dlg; }, get canvas() { return canvas; }, get camera() { return camera; }, get hero() { return hero; }, get IX() { return IX; }, get IZ() { return IZ; }, get mmEl() { return mmEl; }, get mg() { return mg; }, get mmBase() { return mmBase; }, get MMS() { return MMS; }, get markers() { return markers; }, get miniIcons() { return miniIcons; }, get bmEl() { return bmEl; }, get bg() { return bg; }, get mapHits() { return minimapaSys.mapHits; }, set mapHits(v) { minimapaSys.mapHits = v; }, get mapV() { return mapV; }, get mapZMin() { return mapZMin; }, get pxPerTile() { return pxPerTile; }, get PROF_NAME() { return PROF_NAME; }, get SHOP_BY_NAME() { return SHOP_BY_NAME; }, get CINE() { return CINE; }, get vistaSeen() { return vistaSeen; }, get knowsRelic() { return knowsRelic; }, get bigEl() { return bigEl; }, get BNAME() { return BNAME; }, get keys() { return keys; }, get inv() { return inv; }, get toggleBigMap() { return toggleBigMap; } }); }
guiaSys ??= mk_guiaSys();
const { mouse, DROP_SRC } = guiaSys;
function hereT(...a: Parameters<ReturnType<typeof createGuiaMapa>['hereT']>): ReturnType<ReturnType<typeof createGuiaMapa>['hereT']> { return (guiaSys ??= mk_guiaSys()).hereT(...a); }
function zoneName(...a: Parameters<ReturnType<typeof createGuiaMapa>['zoneName']>): ReturnType<ReturnType<typeof createGuiaMapa>['zoneName']> { return (guiaSys ??= mk_guiaSys()).zoneName(...a); }
function drawMini(...a: Parameters<ReturnType<typeof createGuiaMapa>['drawMini']>): ReturnType<ReturnType<typeof createGuiaMapa>['drawMini']> { return (guiaSys ??= mk_guiaSys()).drawMini(...a); }
function drawBig(...a: Parameters<ReturnType<typeof createGuiaMapa>['drawBig']>): ReturnType<ReturnType<typeof createGuiaMapa>['drawBig']> { return (guiaSys ??= mk_guiaSys()).drawBig(...a); }
function setPin(...a: Parameters<ReturnType<typeof createGuiaMapa>['setPin']>): ReturnType<ReturnType<typeof createGuiaMapa>['setPin']> { return (guiaSys ??= mk_guiaSys()).setPin(...a); }
function updateStamRing(...a: Parameters<ReturnType<typeof createGuiaMapa>['updateStamRing']>): ReturnType<ReturnType<typeof createGuiaMapa>['updateStamRing']> { return (guiaSys ??= mk_guiaSys()).updateStamRing(...a); }
function updateGuide(...a: Parameters<ReturnType<typeof createGuiaMapa>['updateGuide']>): ReturnType<ReturnType<typeof createGuiaMapa>['updateGuide']> { return (guiaSys ??= mk_guiaSys()).updateGuide(...a); }


/* ---------- pós-processamento ---------- */
const composer = new EffectComposer(renderer);
const dual = new DualRenderPass(scene, camera, 2, 2, WORLD_RATIO);
composer.addPass(dual);
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.14, 0.35, 0.93);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const finish = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uQuant: { value: 1 }, levels: { value: new THREE.Vector3(31, 63, 31) }, uMul: { value: new THREE.Vector3(1, 1, 1) }, uLift: { value: new THREE.Vector3(0, 0, 0) }, uSat: { value: 1 }, uVig: { value: 0.6 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uQuant; uniform vec3 levels; uniform vec3 uMul; uniform vec3 uLift; uniform float uSat; uniform float uVig; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(vec3(lum), c.rgb, uSat) * uMul + uLift * (1.0 - lum); /* grade de cor: dia quente, noite fria, Lua de Sangue, Aurora */
      float v = smoothstep(0.38, 0.98, length((vUv - 0.5) * vec2(1.1, 1.0)));
      c.rgb *= 1.0 - v * uVig;
      /* 03/11 (Erling: "essa sensação de 256 cores… quero a sensação de 16 bit cor"): eram 20 tons por canal com ruído — no escuro virava
         degrau e mancha. Agora é a profundidade do 16 bits (5-6-5: 32 tons de vermelho e azul, 64 de verde) com o pontilhado ordenado
         dos consoles (Bayer 4×4), que funde os degraus em gradiente em vez de quadrados */
      vec2 q = mod(floor(gl_FragCoord.xy), 4.0); int i = int(q.x) + int(q.y) * 4;
      float bay = i==0?0.0:i==1?8.0:i==2?2.0:i==3?10.0:i==4?12.0:i==5?4.0:i==6?14.0:i==7?6.0:i==8?3.0:i==9?11.0:i==10?1.0:i==11?9.0:i==12?15.0:i==13?7.0:i==14?13.0:5.0;
      if (uQuant < 0.5) { /* Moderno: um pouco mais de contraste e cor (curva suave), o resto é a luz em degradê e o bloom */ float l2 = dot(c.rgb, vec3(0.299, 0.587, 0.114)); c.rgb = mix(vec3(l2), c.rgb, 1.14); c.rgb = c.rgb * c.rgb * (3.0 - 2.0 * c.rgb) * 0.35 + c.rgb * 0.65; }
      if (uQuant > 0.5) c.rgb = floor(clamp(c.rgb, 0.0, 1.0) * levels + (bay + 0.5) / 16.0) / levels; /* no gráfico Moderno a cor corre sem degrau */
      gl_FragColor = c;
    }`,
});
composer.addPass(finish);
/* 03/11 (Erling: "se eu pedir para deixar o jogo lindo, num 3D desses modernos… seria fácil de voltar depois? faça essa alteração em configurações:
   posso escolher esses dois tipos de gráficos"): o GRÁFICO MODERNO é só o jeito de desenhar — o mundo, os modelos e o jogo são os mesmos.
   Pixel: o de sempre (mundo em baixa resolução, 16 bits com pontilhado, sombra dura). Moderno: resolução cheia, cenário na mesma nitidez
   dos personagens, cor sem quantização, sombra suave, brilho (bloom) mais largo nos fogos, auras e magias, e borda alisada (FXAA). */
const fxaa = new ShaderPass(FXAAShader); fxaa.enabled = false; composer.addPass(fxaa);
/* WebGPU: o mesmo quadro (brilho, cor do dia e da noite, vinheta, 16 bits) montado em nós — gpu/impl.ts */
if (gpuImpl) { const gp = gpuImpl.createGPUPost(renderer, () => dual.cur(), bloom, finish.uniforms); composer.render = () => { try { gp.render(); } catch (e) { gpuErr(e); } }; composer.setSize = () => { /* */ }; (window as unknown as { __gpu: unknown }).__gpu = { sc: () => dual.cur(), R: renderer, shot: (w?: number) => gp.shot(w), pending: gpuImpl.gpuPending, state: gpuState, limOpen: (i: Parameters<typeof limiar.open>[0]) => limiar.open(i, () => { /* teste */ }), limShot: () => { limiarGL(true); return limGL!.domElement.toDataURL('image/png'); } }; }
let gfxBloom = 1;
function applyGfx() { const m = opts.gfx === 1; PIX = m ? 1 : pixOf(opts.pix); WORLD_RATIO = m ? 1 : opts.wratio; dual.ratio = WORLD_RATIO; finish.uniforms.uQuant.value = m ? 0 : 1;
  const st = m ? THREE.PCFShadowMap /* three 0.18x: o PCFSoft saiu; o PCF com radius faz a borda macia */ : THREE.BasicShadowMap; if (renderer.shadowMap.type !== st) { renderer.shadowMap.type = st; scene.traverse((o) => { const mm = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined; if (mm) for (const x of Array.isArray(mm) ? mm : [mm]) x.needsUpdate = true; }); }
  { const f = m ? THREE.LinearFilter : THREE.NearestFilter; if (toonRamp.magFilter !== f) { toonRamp.magFilter = toonRamp.minFilter = f; toonRamp.needsUpdate = true; } } /* Moderno: a luz corre em degradê, não em 8 faixas */
  { const sr = m ? Math.max(2048, opts.shadowRes) : opts.shadowRes; if (sun.shadow.mapSize.x !== sr) { sun.shadow.mapSize.set(sr, sr); if (sun.shadow.map && !gpuImpl) { /* WebGPU: o ShadowNode acompanha o mapSize sozinho; soltar o alvo deixava a sombra apontando para textura destruída */ sun.shadow.map.dispose(); (sun.shadow as unknown as { map: null }).map = null; } } sun.shadow.radius = m ? 3 : 1; } /* Moderno: sombra com o dobro de detalhe e borda macia */
  fxaa.enabled = m; bloom.radius = m ? 0.6 : 0.35; bloom.threshold = m ? 0.8 : 0.93; gfxBloom = m ? 2.6 : 1; /* 04/11: brilho menos estourado no modo moderno (lampião, papel, drone) */ document.body.classList.toggle('gfx-moderno', m); try { setModern(scene, renderer, m, !gpuImpl); } catch (e) { console.warn('moderno', e); } resize(); }
/* WebGPU: o LIMIAR (a cena da alma, limiar.ts) tem 19 efeitos próprios em GLSL. Enquanto ele não é traduzido, a cena é desenhada por um
   WebGL à parte num canvas por cima (o mesmo caminho de antes: pixel em duas resoluções, brilho, acabamento) — o mundo espera lá embaixo,
   então só um dos dois desenha de cada vez. Quando a alma volta, o canvas some e o WebGPU segue. */
/* RESGUARDO: se o WebGPU errar seguido neste PC (driver, placa, navegador), o jogo anota e reabre em WebGL sozinho — o jogador não fica
   com tela preta. A escolha WebGPU continua salva; na próxima abertura ele tenta de novo só se o jogador pedir (Opções → Renderizador). */
let gpuFails = 0, gpuFailT = 0;
/* PRÉ-AQUECIMENTO (03/11, Erling: "não quero que o jogo trave quando passa de level nem quando compra premium… um pré-carregamento quando o
   XP estiver perto de 90%"): os materiais dos efeitos de festa são compilados com antecedência, em segundo plano — 20 s depois de entrar no
   mundo e de novo quando o XP passa de 85% (o que já foi compilado não custa nada). No WebGPU os programas já são montados em segundo plano. */
{ let warmed = 0; const warm = () => { if (gpuImpl) return; try { const g = game.prewarmGroup(), prev = renderer.getRenderTarget(); renderer.setRenderTarget(composer.renderTarget1); /* o mundo é desenhado num alvo linear (o composer): o programa é o desse alvo */ void renderer.compileAsync(g, camera, scene).catch(() => { /* */ }); renderer.setRenderTarget(prev); } catch { /* */ } };
  setTimeout(warm, 20000); setInterval(() => { const k = game.st.xp / Math.max(1, game.xpNeed()); if (k > 0.85 && warmed !== game.st.lvl) { warmed = game.st.lvl; warm(); } }, 5000); }
/* teste (Playwright): subir de nível e usar item sem jogar até lá */
(window as unknown as { __kt: unknown }).__kt = { game, inv, renderer, hero: () => hero, net: () => netRef, bugs: () => bugsDono, quests: () => quests, cmd: (l: string) => { const [c, ...r] = l.replace(/^\//, "").split(/\s+/); return betaCommand(c, r); }, inst: () => instintoSys.instinctOn, particles, castelo: () => casteloSys, state, lock: () => lockSys, mkChar: createCharacter, three: THREE, scene };
function gpuFail(m: string) { if (/[?&]gpunofb=1/.test(location.search)) { gpuErr(m); return; } const now = performance.now(); if (now - gpuFailT > 10000) gpuFails = 0; gpuFailT = now; gpuFails++; console.error('[WebGPU] erro no quadro:', m);
  if (gpuFails >= 20 || gpuState.errs > 60) { try { sessionStorage.setItem('karmika.gpuFallback', m.slice(0, 300)); localStorage.setItem('karmika.gpuFallbackLast', JSON.stringify({ at: new Date().toISOString(), m: m.slice(0, 500), log: gpuState.log.slice(0, 12), ua: navigator.userAgent })); } catch { /* */ } /* 04/11: guarda o motivo para o 🐞 levar junto */ opts.rend = 0; saveOpts(); gpuImpl = null; location.reload(); } }
setInterval(() => { if (gpuImpl && (gpuState.errs > 60 || gpuState.lost)) { gpuFails = 99; gpuFail(gpuState.lost ? 'a placa de vídeo se desligou do WebGPU' : 'erros seguidos do WebGPU'); } }, 1000);
setTimeout(() => { try { const f = sessionStorage.getItem('karmika.gpuFallback'); if (f) { sessionStorage.removeItem('karmika.gpuFallback'); game.logMsg('⚙ O WebGPU deu erro neste PC e o jogo voltou para o WebGL (Opções → Renderizador). Detalhe: ' + f.split('\n')[0], '#ffb27a');  let L = ''; try { const j = JSON.parse(localStorage.getItem('karmika.gpuFallbackLast') || '{}'); L = (j.log || []).slice(0, 3).map((x: unknown) => String(typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 140)).join(' | '); } catch { /* */ } kshow('O WebGPU caiu e o jogo voltou para o WebGL. Motivo: ' + f.split('\n')[0].slice(0, 160) + (L ? ' · ' + L : '') + ' — aperte F10 (🐞) para me mandar o relatório.'); } } catch { /* */ } }, 4000);
let limGL: THREE.WebGLRenderer | null = null, limComp: EffectComposer | null = null;
function limiarGL(on: boolean) {
  if (!on) { if (limGL) limGL.domElement.style.display = 'none'; canvas.style.visibility = ''; return; }
  const w = renderer.domElement.width, h = renderer.domElement.height;
  if (!limGL) { limGL = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' }); limGL.setPixelRatio(1); limGL.toneMapping = renderer.toneMapping; limGL.outputColorSpace = renderer.outputColorSpace; limGL.shadowMap.enabled = false;
    const el = limGL.domElement; el.className = canvas.className; el.style.cssText = canvas.style.cssText + ';position:absolute;left:0;top:0;pointer-events:none'; canvas.after(el);
    limComp = new EffectComposer(limGL); limComp.addPass(dual); limComp.addPass(bloom); limComp.addPass(new OutputPass()); limComp.addPass(finish); limComp.addPass(fxaa); }
  limGL.toneMappingExposure = renderer.toneMappingExposure;
  if (limGL.domElement.width !== w || limGL.domElement.height !== h) { limGL.setSize(w, h, false); limComp!.setSize(w, h); }
  limGL.domElement.style.display = ''; canvas.style.visibility = 'hidden'; limComp!.render();
}
/* /perf: tempo de cada passada do desenho (bloom, saída, etc.) */
const PM: Record<string, number> = {};
DualRenderPass.timer = (k, ms) => { PM[k] = (PM[k] ?? 0) + ms; };
for (const ps of composer.passes) { if (ps === dual) continue; const nm = 'desenho:' + (ps === bloom ? 'bloom' : ps === finish ? 'acabamento' : ps.constructor.name.replace(/Pass$/, '').toLowerCase()); const orig = ps.render.bind(ps); ps.render = ((...a: Parameters<typeof orig>) => { const t0 = performance.now(); orig(...a); PM[nm] = (PM[nm] ?? 0) + performance.now() - t0; }) as typeof ps.render; }
/* o Limiar: para onde a alma sobe quando o Fio da Vida se rompe (limiar.ts) */
const limiar = createLimiar({ use: (s, c) => dual.use(s, c), restore: () => dual.use(scene, camera), compile: (s, c) => { if (!gpuImpl) renderer.compile(s, c); },
  makeSoul: () => createCharacter(kindOf(state.race), profile ? { hair: profile.hair, skin: profile.skin, hairStyle: profile.hairStyle, beard: profile.beard, ears: profile.origin === 'elf' } : {}), audio });

/** Tela responsiva: o jogo é pensado em Full HD (1080 de altura).
 *  - Escala da interface: Auto acompanha a altura da tela (Quad HD = 133%, 4K = 200%); ou fixa.
 *  - Resolução do mundo: em Full HD o mundo é desenhado como em 1080p e esticado (mesmo visual e o mesmo FPS em qualquer monitor);
 *    Quad HD fica mais nítido; Nativa usa todos os pixels do monitor (o mais pesado). */
function uiScale() { const base = Math.max(0.85, Math.min(2, Math.min(innerHeight / 1080, innerWidth / 1560))); /* 1,00 = tamanho pensado para Full HD; em janela pequena não encolhe abaixo de 0,85 (senão não dá para ler) */ return Math.max(0.7, Math.min(uiFitMax(), base * (opts.uis || 1))); }
/** 07/11 (Erling: "1,50 e 2,00 não cabem na tela e estão como opção?"): o maior tamanho de interface em que o jogo ainda cabe nesta tela (a barra de baixo e as janelas pedem ~1250×760 na escala 1) */
export function uiFitMax() { return Math.min(innerWidth / 1250, innerHeight / 760); }
export function uiBase() { return Math.max(0.85, Math.min(2, Math.min(innerHeight / 1080, innerWidth / 1560))); }
/* 09/11 (Erling: "o FPS está alterando muito, precisa de uma revisão profunda"): RESOLUÇÃO DINÂMICA, como nos jogos de console — quando o
   quadro não aguenta (abaixo de ~45 fps por 2 s seguidos), o jogo desenha um pouco menos pixels (até 60% a menos) e estica; quando sobra
   folga (acima de ~58 por 5 s), devolve a nitidez aos poucos. A interface não muda. Desliga com localStorage karmika.dynres = 0. */
/* 09/11 (Erling: "notebook sem placa de vídeo, Ryzen 7 5000, roda até Fortnite, e o jogo pega 25 fps em Full HD; precisa ser no mínimo 45"):
   QUALIDADE AUTOMÁTICA. Quando a resolução dinâmica já desceu tudo o que podia e o quadro continua abaixo de 45, o jogo desliga as coisas caras,
   uma de cada vez, e devolve quando sobra folga. Nada disso mexe nas opções salvas do jogador; o degrau fica guardado para a próxima abertura.
     1 · o mapa de sombras é refeito a cada dois quadros (metade dos desenhos de sombra)
     2 · sombras em resolução baixa, sem brilho (bloom) e menos partículas
     3 · sombras desligadas
   Placa integrada (Radeon/Vega dos Ryzen, Intel UHD/Iris): começa no degrau 1 e com a resolução dinâmica um passo abaixo, e pode descer mais.
   Desliga com localStorage karmika.autoq = off. */
const igpu = (() => { try { const c = document.createElement('canvas'), g = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null; if (!g) return false; const e = g.getExtension('WEBGL_debug_renderer_info'); const n = String(e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)); (g.getExtension('WEBGL_lose_context') as { loseContext(): void } | null)?.loseContext();
  return /Radeon\(TM\) Graphics|Radeon Graphics|Vega|Intel|UHD|Iris|Mali|Adreno|PowerVR|llvmpipe|SwiftShader/i.test(n) && !/RX |Arc /i.test(n); } catch { return false; } })();
/* 10/11 (Erling: "as opções precisam fazer diferença"; "no Moderno volta a ficar quadriculado e fica travado nessa configuração"):
   - o ajuste automático mexe POUCO (até 1,35×; 1,5× em vídeo integrado): quem manda no tamanho do pixel é a opção;
   - ele não se guarda entre sessões (cada abertura começa na qualidade cheia) e pode ser desligado em Opções;
   - quadros lentos de quem saiu do PC, trocou de janela ou acabou de voltar não contam;
   - se ele baixar e subir em seguida (gangorra = tranco a cada troca), fica parado 4 min. */
const DYN_MAX = igpu ? 1.5 : 1.35;
let autoQ = (() => { try { if (localStorage.getItem('karmika.autoq') === 'off') return -1; } catch { /* */ } return igpu ? 1 : 0; })(), autoQApplied = 0, autoQLow = 0, autoQHigh = 0, autoQCool = 0, shadowFrame = 0;
let dynSkip = 4, dynHold = 0, dynLastUp = -1e9, dynGap = false, lastInputMs = performance.now();
for (const ev of ['pointermove', 'pointerdown', 'keydown', 'wheel']) addEventListener(ev, () => { if (performance.now() - lastInputMs > 45000) dynSkip = Math.max(dynSkip, 3); lastInputMs = performance.now(); }, { passive: true, capture: true });
document.addEventListener('visibilitychange', () => { dynSkip = Math.max(dynSkip, 4); }); addEventListener('focus', () => { dynSkip = Math.max(dynSkip, 3); }); addEventListener('blur', () => { dynSkip = Math.max(dynSkip, 3); });
function applyAutoQ() { const q = Math.max(0, autoQ), was = autoQApplied; autoQApplied = q;
  setWorldLite(igpu || q >= 2); /* 09/11: blocos inteligentes — modelos simplificados em todo bloco */
  renderer.shadowMap.autoUpdate = q < 1; if (q >= 1) renderer.shadowMap.needsUpdate = true;
  const sr = q >= 2 ? Math.min(512, opts.shadowRes) : opts.shadowRes; if (sun.shadow.mapSize.x !== sr) { sun.shadow.mapSize.set(sr, sr); if (sun.shadow.map && !gpuState.on) { sun.shadow.map.dispose(); (sun.shadow as unknown as { map: null }).map = null; } }
  bloom.enabled = q < 2 && opts.bloom > 0; particles.density = q >= 2 ? Math.min(opts.particles, 0.6) : opts.particles;
  /* 10/11 (Erling: "o jogo inteiro sumiu" e voltou sozinho): o degrau 3 desligava a sombra, e desligar a sombra refaz o shader de TODO o cenário;
     enquanto refazia, casas, árvores e chão sumiam da tela. O ajuste automático nunca mais liga ou desliga a sombra: no degrau 3 ela só é refeita 1 vez a cada 4 quadros. */
  if (q !== was) { const T2 = ['qualidade cheia de volta', 'sombra refeita a cada dois quadros', 'sombra simples, sem brilho', 'sombra refeita a cada quatro quadros']; game.logMsg(`⚙ Qualidade automática: ${T2[q]} (para segurar 45 FPS).`); } }
/** a cada quadro: no degrau 1+, a sombra só é refeita em quadros alternados */
function autoQFrame() { if (autoQApplied >= 1 && renderer.shadowMap.enabled) { shadowFrame++; renderer.shadowMap.needsUpdate = (shadowFrame & (autoQApplied >= 3 ? 3 : 1)) === 0; } }
function autoQTick(fps: number, hi: number) { if (autoQ < 0 || document.hidden) return; if (autoQCool > 0) { autoQCool--; return; }
  const atMax = dynK >= DYN_MAX - 0.01, nowS = performance.now();
  if (fps < 45 && atMax) { autoQLow++; autoQHigh = 0; } else if (fps > hi && dynK <= 1.01) { autoQHigh++; autoQLow = 0; } else { autoQLow = 0; autoQHigh = 0; }
  if (autoQLow >= 4 && autoQ < 3) { if (nowS - dynLastUp < 30000) dynHold = nowS + 240000; autoQ++; autoQLow = 0; autoQCool = 8; applyAutoQ(); }
  else if (autoQHigh >= 12 && autoQ > (igpu ? 1 : 0) && nowS > dynHold) { autoQ--; autoQHigh = 0; autoQCool = 10; dynLastUp = nowS; applyAutoQ(); } }
setTimeout(() => { if (autoQ >= 0) applyAutoQ(); }, 0);
function dynResTick(fps: number) { let on = opts.auto !== false; try { if (localStorage.getItem('karmika.dynres') === '0') on = false; } catch { /* */ }
  if (!on) { if (dynK !== 1) { dynK = 1; resize(); } if (autoQ > (igpu ? 1 : 0)) { autoQ = igpu ? 1 : 0; applyAutoQ(); } return; }
  const nowS = performance.now(), idle = nowS - lastInputMs > 45000;
  if (document.hidden || dynGap || idle) { dynGap = false; dynSkip = Math.max(dynSkip, 2); }
  if (dynSkip > 0) { dynSkip--; dynLow = dynHigh = 0; autoQLow = autoQHigh = 0; return; }
  const capV = opts.cap > 0 ? opts.cap : 240, tgt = Math.min(45, capV - 8), hi = Math.min(tgt + 8, capV - 6);
  if (fps < tgt) { dynLow++; dynHigh = 0; } else if (fps > hi) { dynHigh++; dynLow = 0; } else { dynLow = 0; dynHigh = 0; }
  if (dynLow >= 3 && dynK < DYN_MAX) { if (nowS - dynLastUp < 30000) dynHold = nowS + 240000; /* gangorra: fica parado 4 min */ dynK = Math.min(DYN_MAX, dynK + 0.175); dynLow = 0; resize(); }
  else if (dynHigh >= 6 && dynK > 1 && nowS > dynHold) { dynK = Math.max(1, dynK - 0.175); dynHigh = 0; dynLastUp = nowS; resize(); }
  autoQTick(fps, hi); }
function resize() {
  document.documentElement.style.setProperty('--ui', uiScale().toFixed(3));
  const rr = opts.gfx === 1 ? 0 : opts.res; /* Moderno: sempre na resolução nativa do monitor (Quad HD e 4K ficam nítidos de verdade) */
  const modern = opts.gfx === 1, dpr = modern ? Math.min(2, Math.max(1, devicePixelRatio || 1)) : 1; /* Moderno: os pixels de verdade do monitor (telas 4K com escala do Windows ficavam esticadas) */
  const refH = rr > 0 ? Math.min(innerHeight, rr) : innerHeight, k = innerHeight / refH * dynK / dpr; // k > 1: desenha menos pixels e estica (dynK: a resolução dinâmica)
  const step = Number.isInteger(WORLD_RATIO) ? WORLD_RATIO : WORLD_RATIO * 2; /* 2/3: múltiplo de 3 para o cenário cair em pixel inteiro */
  const w = Math.max(160, Math.floor(innerWidth / k / PIX / step) * step), h = Math.max(120, Math.floor(innerHeight / k / PIX / step) * step);
  renderer.setSize(w, h, false); dual.setSize(w, h);
  canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.imageRendering = modern ? 'auto' : ''; /* Moderno nunca fica quadriculado: se a resolução baixar, estica liso */
  composer.setSize(w, h); fxaa.material.uniforms.resolution.value.set(1 / w, 1 / h);
  applyZoom(w, h);
}
const camDist = () => 60;
function applyZoom(w = renderer.domElement.width, h = renderer.domElement.height) {
  const a = w / h;
  camera.left = (-zoom * a) / 2; camera.right = (zoom * a) / 2; camera.top = zoom / 2; camera.bottom = -zoom / 2;
  camera.updateProjectionMatrix();
  particles.uniforms.uPx.value = h / zoom; particles.uniforms.uDist.value = 60;
}
addEventListener('resize', resize);
resize(); if (opts.gfx === 1) applyGfx(); /* 03/11: começa no estilo escolhido */
/* ENTRADA: teclado (atalhos, movimento, combate, janelas), mira e o estado das teclas. Saiu do main.ts (02/11). → sistemas/entrada.ts */
export interface EntradaCtx {
  readonly state: Widen<typeof state>;
  readonly scene: Widen<typeof scene>;
  readonly hero: Hero3D;
  readonly game: Widen<typeof game>;
  readonly tree: Widen<typeof tree>;
  readonly dockEl: Widen<typeof dockEl>;
  readonly kitRace: Widen<typeof kitRace>;
  readonly mouse: Widen<typeof mouse>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly free: Widen<typeof free>;
  readonly audio: Widen<typeof audio>;
  readonly az: Widen<typeof az>;
  readonly dlg: Widen<typeof dlg>;
  dashCd: Widen<typeof dashCd>;
  readonly particles: Widen<typeof particles>;
  dashT: Widen<typeof dashT>;
  dx0: Widen<typeof dx0>;
  dy0: Widen<typeof dy0>;
  readonly applyKitAll: typeof applyKitAll;
  readonly swapHero: typeof swapHero;
  readonly classOfRace: Widen<typeof classOfRace>;
  readonly cinemaSys: ReturnType<typeof createCinemaVistas>;
  readonly endScene: typeof endScene;
  readonly chat: Widen<typeof chat>;
  readonly inicio: Widen<typeof inicio>;
  readonly peleSys: ReturnType<typeof createPeleHeroi>;
  readonly coop: Widen<typeof coop>;
  readonly inv: Widen<typeof inv>;
  readonly quests: Widen<typeof quests>;
  readonly stable: Widen<typeof stable>;
  readonly align: Widen<typeof align>;
  readonly dockSys: ReturnType<typeof createDockFeitos>;
  readonly toggleSkills: typeof toggleSkills;
  readonly toggleFeats: typeof toggleFeats;
  readonly build: Widen<typeof build>;
  readonly reliquiasSys: ReturnType<typeof createReliquias>;
  readonly closeRelics: typeof closeRelics;
  readonly olhoSys: ReturnType<typeof createOlho>;
  readonly toggleOlho: typeof toggleOlho;
  readonly vid: Widen<typeof vid>;
  readonly mail: Widen<typeof mail>;
  readonly profs: Widen<typeof profs>;
  readonly loja: Widen<typeof loja>;
  readonly minimapaSys: ReturnType<typeof createMinimapa>;
  readonly toggleBigMap: typeof toggleBigMap;
  readonly compendium: Widen<typeof compendium>;
  readonly compSys: ReturnType<typeof createCompanheiros>;
  readonly swimmingNow: Widen<typeof swimmingNow>;
  readonly setRiding: typeof setRiding;
  nightOverride: number | null;
  readonly toggleInstinct: typeof toggleInstinct;
  readonly instintoSys: ReturnType<typeof createInstintoPosturas>;
  readonly renderStances: typeof renderStances;
  readonly interact: typeof interact;
  ZOOM_MAX: Widen<typeof ZOOM_MAX>;
  zoomTarget: Widen<typeof zoomTarget>;
  readonly useQuick: typeof useQuick;
  readonly canvas: Widen<typeof canvas>;
  readonly net: Widen<typeof net>;
  readonly festaSys: ReturnType<typeof createFesta>;
  readonly festasNet: Widen<typeof festasNet>;
  readonly festaAskJoin: typeof festaAskJoin;
  azT: Widen<typeof azT>;
  pitchT: Widen<typeof pitchT>;
  readonly PITCH_MIN: Widen<typeof PITCH_MIN>;
  readonly PITCH_MAX: Widen<typeof PITCH_MAX>;
  readonly ZOOM_MIN: Widen<typeof ZOOM_MIN>;
}
var entradaSys: ReturnType<typeof createEntrada>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_entradaSys() { return createEntrada({ get state() { return state; }, get scene() { return scene; }, get hero() { return hero; }, get game() { return game; }, get tree() { return tree; }, get dockEl() { return dockEl; }, get kitRace() { return kitRace; }, get mouse() { return mouse; }, get inside() { return inside; }, get free() { return free; }, get audio() { return audio; }, get az() { return az; }, get dlg() { return dlg; }, get dashCd() { return dashCd; }, set dashCd(v) { dashCd = v; }, get particles() { return particles; }, get dashT() { return dashT; }, set dashT(v) { dashT = v; }, get dx0() { return dx0; }, set dx0(v) { dx0 = v; }, get dy0() { return dy0; }, set dy0(v) { dy0 = v; }, get applyKitAll() { return applyKitAll; }, get swapHero() { return swapHero; }, get classOfRace() { return classOfRace; }, get cinemaSys() { return cinemaSys; }, get endScene() { return endScene; }, get chat() { return chat; }, get inicio() { return inicio; }, get peleSys() { return peleSys; }, get coop() { return coop; }, get inv() { return inv; }, get quests() { return quests; }, get stable() { return stable; }, get align() { return align; }, get dockSys() { return dockSys; }, get toggleSkills() { return toggleSkills; }, get toggleFeats() { return toggleFeats; }, get build() { return build; }, get reliquiasSys() { return reliquiasSys; }, get closeRelics() { return closeRelics; }, get olhoSys() { return olhoSys; }, get toggleOlho() { return toggleOlho; }, get vid() { return vid; }, get mail() { return mail; }, get profs() { return profs; }, get loja() { return loja; }, get minimapaSys() { return minimapaSys; }, get toggleBigMap() { return toggleBigMap; }, get compendium() { return compendium; }, get compSys() { return compSys; }, get swimmingNow() { return swimmingNow; }, get setRiding() { return setRiding; }, get nightOverride() { return nightOverride; }, set nightOverride(v) { nightOverride = v; }, get toggleInstinct() { return toggleInstinct; }, get instintoSys() { return instintoSys; }, get renderStances() { return renderStances; }, get interact() { return interact; }, get ZOOM_MAX() { return ZOOM_MAX; }, set ZOOM_MAX(v) { ZOOM_MAX = v; }, get zoomTarget() { return zoomTarget; }, set zoomTarget(v) { zoomTarget = v; }, get useQuick() { return useQuick; }, get canvas() { return canvas; }, get net() { return net; }, get festaSys() { return festaSys; }, get festasNet() { return festasNet; }, get festaAskJoin() { return festaAskJoin; }, get azT() { return azT; }, set azT(v) { azT = v; }, get pitchT() { return pitchT; }, set pitchT(v) { pitchT = v; }, get PITCH_MIN() { return PITCH_MIN; }, get PITCH_MAX() { return PITCH_MAX; }, get ZOOM_MIN() { return ZOOM_MIN; } }); }
entradaSys ??= mk_entradaSys();
const { heroPosNow, runningNow, keys, aimYaw, aim, nearYaw, CAM_FREE } = entradaSys;
function setCombat(...a: Parameters<ReturnType<typeof createEntrada>['setCombat']>): ReturnType<ReturnType<typeof createEntrada>['setCombat']> { return (entradaSys ??= mk_entradaSys()).setCombat(...a); }
function cancelAim(...a: Parameters<ReturnType<typeof createEntrada>['cancelAim']>): ReturnType<ReturnType<typeof createEntrada>['cancelAim']> { return (entradaSys ??= mk_entradaSys()).cancelAim(...a); }
function fireAim(...a: Parameters<ReturnType<typeof createEntrada>['fireAim']>): ReturnType<ReturnType<typeof createEntrada>['fireAim']> { return (entradaSys ??= mk_entradaSys()).fireAim(...a); }
function startDash(...a: Parameters<ReturnType<typeof createEntrada>['startDash']>): ReturnType<ReturnType<typeof createEntrada>['startDash']> { return (entradaSys ??= mk_entradaSys()).startDash(...a); }
function castAt(...a: Parameters<ReturnType<typeof createEntrada>['castAt']>): ReturnType<ReturnType<typeof createEntrada>['castAt']> { return (entradaSys ??= mk_entradaSys()).castAt(...a); }

/* ---------- ciclo de dia e noite por turnos: 6 turnos de 4 h do jogo (30 min reais cada) → dia de 24 h = 3 h reais; relógio do mundo (igual para todos) ---------- */
const DAY_REAL_MS = 3 * 3600 * 1000;
let nightOverride: number | null = null; state.night = (() => { const h = (((Date.now() % (3 * 3600 * 1000)) / (3 * 3600 * 1000)) * 24 + 8) % 24; return h >= 7 && h < 17 ? 0 : h >= 19 || h < 5 ? 1 : h < 19 ? (h - 17) / 2 : 1 - (h - 5) / 2; })(); // N alterna: natural → noite forçada → dia forçado → natural (teste)
const gameHour = () => (((Date.now() % DAY_REAL_MS) / DAY_REAL_MS) * 24 + 8) % 24;
const TURNS: [number, string][] = [[6, 'Manhã'], [10, 'Meio-dia'], [14, 'Tarde'], [18, 'Anoitecer'], [22, 'Madrugada'], [2, 'Alvorada']];
function turnName(h = gameHour()) { for (const [h0, nm] of TURNS) if (h >= h0 && h < h0 + 4) return nm; return 'Alvorada'; }
/** escuridão 0..1 pela hora: noite plena 19–5 h, crepúsculos suaves de 2 h */
function nightAt(h: number) { if (h >= 7 && h < 17) return 0; if (h >= 19 || h < 5) return 1; if (h >= 17 && h < 19) return (h - 17) / 2; return 1 - (h - 5) / 2; }
/* A PELE DO HERÓI: os modelos de arte (Herik) por raça, sexo, caminho e nível; vestir/despir troca o modelo; o visual do caminho (vampiro, lobisomem); trocar o corpo; o recurso da classe. Saiu do main.ts (02/11). → sistemas/pele-heroi.ts */
export interface PeleHeroiCtx {
  readonly profile: Profile | null;
  readonly kindOf: Widen<typeof kindOf>;
  readonly state: Widen<typeof state>;
  readonly inv: Widen<typeof inv>;
  readonly quests: Widen<typeof quests>;
  readonly game: Widen<typeof game>;
  readonly kitRace: Widen<typeof kitRace>;
  hero: Hero3D;
  readonly netRef: Net | null;
  readonly portraits: Widen<typeof portraits>;
  readonly scene: Widen<typeof scene>;
  readonly hookHero: typeof hookHero;
  readonly syncGear: typeof syncGear;
  readonly tree: Widen<typeof tree>;
  readonly applyKitAll: typeof applyKitAll;
  readonly cancelAim: typeof cancelAim;
  readonly combatMode: Widen<typeof entradaSys.combatMode>;
  readonly globes: Widen<typeof globes>;
}
var peleSys: ReturnType<typeof createPeleHeroi>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_peleSys() { return createPeleHeroi({ get profile() { return profile; }, get kindOf() { return kindOf; }, get state() { return state; }, get inv() { return inv; }, get quests() { return quests; }, get game() { return game; }, get kitRace() { return kitRace; }, get hero() { return hero; }, set hero(v) { hero = v; }, get netRef() { return netRef; }, get portraits() { return portraits; }, get scene() { return scene; }, get hookHero() { return hookHero; }, get syncGear() { return syncGear; }, get tree() { return tree; }, get applyKitAll() { return applyKitAll; }, get cancelAim() { return cancelAim; }, get combatMode() { return entradaSys.combatMode; }, get globes() { return globes; } }); }
peleSys ??= mk_peleSys();
const { ART_SET, classOfRace } = peleSys;
function applyRes(...a: Parameters<ReturnType<typeof createPeleHeroi>['applyRes']>): ReturnType<ReturnType<typeof createPeleHeroi>['applyRes']> { return (peleSys ??= mk_peleSys()).applyRes(...a); }
function checkSkinLevel(...a: Parameters<ReturnType<typeof createPeleHeroi>['checkSkinLevel']>): ReturnType<ReturnType<typeof createPeleHeroi>['checkSkinLevel']> { return (peleSys ??= mk_peleSys()).checkSkinLevel(...a); }
function applyArtSkin(...a: Parameters<ReturnType<typeof createPeleHeroi>['applyArtSkin']>): ReturnType<ReturnType<typeof createPeleHeroi>['applyArtSkin']> { return (peleSys ??= mk_peleSys()).applyArtSkin(...a); }
function humanSkinKey(...a: Parameters<ReturnType<typeof createPeleHeroi>['humanSkinKey']>): ReturnType<ReturnType<typeof createPeleHeroi>['humanSkinKey']> { return (peleSys ??= mk_peleSys()).humanSkinKey(...a); }
function swapHero(...a: Parameters<ReturnType<typeof createPeleHeroi>['swapHero']>): ReturnType<ReturnType<typeof createPeleHeroi>['swapHero']> { return (peleSys ??= mk_peleSys()).swapHero(...a); }

/* MOUSE NO CHÃO: o raio da câmera até o terreno, o marcador, os botões do mouse e a marca de clique (losango kármico que abre e some). Saiu do main.ts (02/11). → sistemas/mouse-clique.ts */
export interface MouseCliqueCtx {
  readonly scene: Widen<typeof scene>;
  readonly canvas: Widen<typeof canvas>;
  readonly camera: Widen<typeof camera>;
  readonly mouse: Widen<typeof mouse>;
  mouseMovedT: Widen<typeof mouseMovedT>;
  readonly cliqueSys: ReturnType<typeof createCliqueAndar>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly cinemaSys: ReturnType<typeof createCinemaVistas>;
  readonly game: Widen<typeof game>;
  readonly build: Widen<typeof build>;
  readonly aimSlot: string | null;
  readonly fireAim: typeof fireAim;
  readonly setCombat: typeof setCombat;
  readonly aimYaw: Widen<typeof aimYaw>;
  readonly heroPosNow: Widen<typeof heroPosNow>;
  readonly cancelAim: typeof cancelAim;
  readonly planTo: typeof planTo;
}
var mouseSys: ReturnType<typeof createMouseClique>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_mouseSys() { return createMouseClique({ get scene() { return scene; }, get canvas() { return canvas; }, get camera() { return camera; }, get mouse() { return mouse; }, get mouseMovedT() { return mouseMovedT; }, set mouseMovedT(v) { mouseMovedT = v; }, get cliqueSys() { return cliqueSys; }, get inside() { return inside; }, get cinemaSys() { return cinemaSys; }, get game() { return game; }, get build() { return build; }, get aimSlot() { return entradaSys.aimSlot; }, get fireAim() { return fireAim; }, get setCombat() { return setCombat; }, get aimYaw() { return aimYaw; }, get heroPosNow() { return heroPosNow; }, get cancelAim() { return cancelAim; }, get planTo() { return planTo; } }); }
mouseSys ??= mk_mouseSys();
const { marker, plane } = mouseSys;
function updateClickMarks(...a: Parameters<ReturnType<typeof createMouseClique>['updateClickMarks']>): ReturnType<ReturnType<typeof createMouseClique>['updateClickMarks']> { return (mouseSys ??= mk_mouseSys()).updateClickMarks(...a); }

/* COLISÃO DO HERÓI (regra de ouro: mobilidade acima da física): cantos do corpo, muralhas e caminho de ronda, degraus, muros baixos e cercas, guarda-peito das pontes, sólidos do cenário, pontos de trabalho, troncos e bichos. Saiu do main.ts (02/11). → sistemas/colisao.ts */
export interface ColisaoCtx {
  readonly state: Widen<typeof state>;
  readonly heroY: Widen<typeof heroY>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly IX: Widen<typeof IX>;
  readonly IZ: Widen<typeof IZ>;
  readonly city: Widen<typeof city>;
  readonly hero: Hero3D;
  readonly game: Widen<typeof game>;
}
var colisaoSys: ReturnType<typeof createColisao>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_colisaoSys() { return createColisao({ get state() { return state; }, get heroY() { return heroY; }, get inside() { return inside; }, get IX() { return IX; }, get IZ() { return IZ; }, get city() { return city; }, get hero() { return hero; }, get game() { return game; } }); }
colisaoSys ??= mk_colisaoSys();
const { free, PROF_NAME, CORN, stepBlock, wallFree, solids, STATIONS, cutV } = colisaoSys;
function solidHit(...a: Parameters<ReturnType<typeof createColisao>['solidHit']>): ReturnType<ReturnType<typeof createColisao>['solidHit']> { return (colisaoSys ??= mk_colisaoSys()).solidHit(...a); }
function lowWallHit(...a: Parameters<ReturnType<typeof createColisao>['lowWallHit']>): ReturnType<ReturnType<typeof createColisao>['lowWallHit']> { return (colisaoSys ??= mk_colisaoSys()).lowWallHit(...a); }
function stationNear(...a: Parameters<ReturnType<typeof createColisao>['stationNear']>): ReturnType<ReturnType<typeof createColisao>['stationNear']> { return (colisaoSys ??= mk_colisaoSys()).stationNear(...a); }
function trunkHit(...a: Parameters<ReturnType<typeof createColisao>['trunkHit']>): ReturnType<ReturnType<typeof createColisao>['trunkHit']> { return (colisaoSys ??= mk_colisaoSys()).trunkHit(...a); }
function enemyBlock(...a: Parameters<ReturnType<typeof createColisao>['enemyBlock']>): ReturnType<ReturnType<typeof createColisao>['enemyBlock']> { return (colisaoSys ??= mk_colisaoSys()).enemyBlock(...a); }
function heroGround(...a: Parameters<ReturnType<typeof createColisao>['heroGround']>): ReturnType<ReturnType<typeof createColisao>['heroGround']> { return (colisaoSys ??= mk_colisaoSys()).heroGround(...a); }

/* CLIQUE PARA ANDAR: o caminho até o ponto clicado (nav.ts), com a mesma sonda de corpo do movimento. Saiu do main.ts (02/11). → sistemas/clique-andar.ts */
export interface CliqueAndarCtx {
  readonly city: Widen<typeof city>;
  readonly CORN: Widen<typeof CORN>;
  readonly trunkHit: typeof trunkHit;
  readonly solidHit: typeof solidHit;
  readonly lowWallHit: typeof lowWallHit;
  readonly stepBlock: Widen<typeof stepBlock>;
  readonly heroY: Widen<typeof heroY>;
  readonly enemyBlock: typeof enemyBlock;
  readonly free: Widen<typeof free>;
  readonly onWall: Widen<typeof colisaoSys.onWall>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly IX: Widen<typeof IX>;
  readonly IZ: Widen<typeof IZ>;
  readonly wallFree: Widen<typeof wallFree>;
  readonly state: Widen<typeof state>;
  readonly marker: Widen<typeof marker>;
  readonly scene: Widen<typeof scene>;
  readonly mail: Widen<typeof mail>;
  readonly hero: Hero3D;
  readonly npcSys: Widen<typeof npcSys>;
  readonly cinemaSys: ReturnType<typeof createCinemaVistas>;
  readonly camera: Widen<typeof camera>;
  readonly cutP: Widen<typeof cutP>;
  readonly renderer: Widen<typeof renderer>;
  readonly cutV2: Widen<typeof cutV2>;
  readonly dual: Widen<typeof dual>;
  readonly objs: Widen<typeof objs>;
  readonly dgSys: ReturnType<typeof createMasmorrasEntrar>;
}
var cliqueSys: ReturnType<typeof createCliqueAndar>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_cliqueSys() { return createCliqueAndar({ get city() { return city; }, get CORN() { return CORN; }, get trunkHit() { return trunkHit; }, get solidHit() { return solidHit; }, get lowWallHit() { return lowWallHit; }, get stepBlock() { return stepBlock; }, get heroY() { return heroY; }, get enemyBlock() { return enemyBlock; }, get free() { return free; }, get onWall() { return colisaoSys.onWall; }, get inside() { return inside; }, get IX() { return IX; }, get IZ() { return IZ; }, get wallFree() { return wallFree; }, get state() { return state; }, get marker() { return marker; }, get scene() { return scene; }, get mail() { return mail; }, get hero() { return hero; }, get npcSys() { return npcSys; }, get cinemaSys() { return cinemaSys; }, get camera() { return camera; }, get cutP() { return cutP; }, get renderer() { return renderer; }, get cutV2() { return cutV2; }, get dual() { return dual; }, get objs() { return objs; }, get dgSys() { return dgSys; } }); }
cliqueSys ??= mk_cliqueSys();
const { navProbe } = cliqueSys;
function planTo(...a: Parameters<ReturnType<typeof createCliqueAndar>['planTo']>): ReturnType<ReturnType<typeof createCliqueAndar>['planTo']> { return (cliqueSys ??= mk_cliqueSys()).planTo(...a); }
function moveSlide(...a: Parameters<ReturnType<typeof createCliqueAndar>['moveSlide']>): ReturnType<ReturnType<typeof createCliqueAndar>['moveSlide']> { return (cliqueSys ??= mk_cliqueSys()).moveSlide(...a); }
function followPath(...a: Parameters<ReturnType<typeof createCliqueAndar>['followPath']>): ReturnType<ReturnType<typeof createCliqueAndar>['followPath']> { return (cliqueSys ??= mk_cliqueSys()).followPath(...a); }
function updateXray(...a: Parameters<ReturnType<typeof createCliqueAndar>['updateXray']>): ReturnType<ReturnType<typeof createCliqueAndar>['updateXray']> { return (cliqueSys ??= mk_cliqueSys()).updateXray(...a); }
function updateEnvelopes(...a: Parameters<ReturnType<typeof createCliqueAndar>['updateEnvelopes']>): ReturnType<ReturnType<typeof createCliqueAndar>['updateEnvelopes']> { return (cliqueSys ??= mk_cliqueSys()).updateEnvelopes(...a); }

/* ---------- ciclo ---------- */
const dayC = { sky: new THREE.Color(0x9bbad8), fog: new THREE.Color(0x9bbad8) };
const nightC = { sky: new THREE.Color(0x050814), fog: new THREE.Color(0x070a18) };
const sunDay = new THREE.Color(0xffdca8), sunNight = new THREE.Color(0x6a88d0);
const hemiDaySky = new THREE.Color(0xf4e6cc), hemiNightSky = new THREE.Color(0x4668b0); /* 27/10 (Erling: "à noite não se vê nada"): a noite é de luar, não de breu */
const hemiDayGround = new THREE.Color(0x4a3a22), hemiNightGround = new THREE.Color(0x202a40);
/* os globais: Lua de Sangue (rubro, sanguinário) e Dia da Aurora (ouro e rosa, luz de igreja) */
const LUA_C = { sky: new THREE.Color(0x3a0604), fog: new THREE.Color(0x4a0a06), hemi: new THREE.Color(0xa0241a), ground: new THREE.Color(0x3a0806), sun: new THREE.Color(0xff3a1c) };
const AUR_C = { sky: new THREE.Color(0xf6dcc4), fog: new THREE.Color(0xf0d8c8), hemi: new THREE.Color(0xffe8f0), sun: new THREE.Color(0xfff0d8) };
const LUA_MUL = new THREE.Vector3(1.42, 0.6, 0.5), LUA_LIFT = new THREE.Vector3(0.07, 0, 0);
const AUR_MUL = new THREE.Vector3(1.07, 1.03, 0.97), AUR_LIFT = new THREE.Vector3(0.035, 0.028, 0.04);
let gChkT = 0, gCur: string | null = null, gForce: string | null | undefined = undefined, luaK = 0, aurK = 0, engK = 0;
/* A ABERTURA do evento global (Erling, 25/10): ~12 s de impacto total (luz, coral, folhas, anúncio no meio da tela) e depois
   o mundo assenta: fica só mais cor no dia, uma brisa leve, o coral quase sumindo ao longe. O efeito (buff) fica na barra de efeitos. */
let instK = 0, gOpenId: string | null = null, gOpenAt = -1e9; const G_OPEN_FULL = 12, G_OPEN_FADE = 8;
const gOpen = () => { const s = (performance.now() - gOpenAt) / 1000; return s < G_OPEN_FULL ? 1 : Math.max(0, 1 - (s - G_OPEN_FULL) / G_OPEN_FADE); }; /* relógio de verdade: não depende do passo do quadro */
/* o relógio do quadro (o THREE.Clock saiu do three 0.18x): segundos desde o quadro anterior */
const clock = (() => { let last = performance.now(); return { getDelta() { const n = performance.now(), d = (n - last) / 1000; last = n; return d; } }; })();
let heroY = heightAt(city.spawn.x * T, city.spawn.y * T), camY = heroY;
let leadX = 0, leadZ = 0, dashT = 0, dashCd = 0, dx0 = 0, dy0 = 0, vel = 0; let bpYaw: number | null = null, lockYaw: number | null = null; const lockSys = createLock(); let lockActWas = false; let awayT = 0; enemyHooks.struck = (e) => lockSys.struck(e); /* recuo de costas (estilo Path of Exile 2) */
let t = 0, wasFull = false, spawnAcc = 0, camX = hero.root.position.x, camZ = hero.root.position.z;
const heroPos = new THREE.Vector3();
let shown = false, swimAcc = 0;
const IX = 4000, IZ = 4000;
const fadeEl = document.createElement('div'); fadeEl.id = 'fade'; fadeEl.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:200;transition:opacity .25s';
fadeEl.innerHTML = '<div class="ldr"><div class="ldr-eye"><i></i></div><b>Atravessando o caminho…</b><small>o mundo se ergue à sua volta</small></div>'; document.body.appendChild(fadeEl);
/** troca de lugar (fonte, relíquia, casa, cripta): tela de carregamento com o olho girando (animação de CSS: continua mesmo com o jogo ocupado);
    só some quando o mundo novo já foi montado, os shaders compilados e os quadros voltaram a ficar leves */
let fading = false;
function withFade(fn: () => void, label?: string, after?: () => void) {
  if (fading) return; fading = true; const lb = fadeEl.querySelector('b'); if (lb) lb.textContent = label ?? 'Atravessando o caminho…';
  fadeEl.classList.add('on'); fadeEl.style.pointerEvents = 'auto'; fadeEl.style.opacity = '1';
  setTimeout(() => { requestAnimationFrame(() => {
    try { fn(); } catch (err) { console.error(err); }
    if (!gpuImpl) try { renderer.compile(scene, camera); } catch { /* */ }
    let last = performance.now(), calm = 0; const t0 = last;
    const check = () => { const now = performance.now(), dtm = now - last; last = now; calm = dtm < 45 ? calm + 1 : 0;
      if (calm >= 6 || now - t0 > 8000) { fadeEl.style.opacity = '0'; fadeEl.style.pointerEvents = 'none'; setTimeout(() => { fadeEl.classList.remove('on'); fading = false; after?.(); }, 260); } else requestAnimationFrame(check); };
    requestAnimationFrame(check); }); }, 260);
}
function enterHouse(p: (typeof city.props)[number]) {
  withFade(() => {
    const holy = p.kind === 'temple' || p.kind === 'church';
    /* 02/11: cada loja tem o interior do seu ofício (antes alquimista/mercador/domador/oficina/estábulo abriam numa sala de casa comum) */
    const SHOP_INT: Record<string, number> = { pocoes: 10, mercador_cidade: 11, domador: 12, tec_fio: 13, tec_desf: 13, estabulo: 14, taverna: 4, armeiro: 5, armaduras: 5, cervejaria: 15 }; /* 08/11: a cervejaria é o salão de cerveja dos anões */
    /* academias de Askavik (e a do Porto) por dentro: Escola de Guerra 10→30, Forja 11→31, Universidade 12→32; Igreja Kármica e templos: nave 6 */
    const ACAD_INT: Record<number, number> = { 10: 30, 11: 31, 12: 32 };
    const int = buildInterior(holy ? (p.kind === 'church' ? 7 : p.kind === 'temple' && p.variant !== undefined && ACAD_INT[p.variant] !== undefined ? ACAD_INT[p.variant] : 6) : p === construcaoSys.homeProp || otherDecor.has(p) ? 20 : p.shop && SHOP_INT[p.shop] !== undefined ? SHOP_INT[p.shop] : p.variant === 9 ? 0 : (p.variant ?? 0), p.w * T, p.h * T, p.gx * 31 + p.gy, p.style ?? 1); /* 10/11: o povo da casa (élfica redonda, anã de pedra) */ /* 28/10: a casa do jogador começa vazia (só cama e correio): o resto é a mobília dele */
    if (p === construcaoSys.homeProp) { /* a casa do jogador: cama (descansa e cura) e a caixa de correio que guarda itens (o cofre), encostadas na parede do fundo */
      const bx = 1.6, bz = 1.5, mk = (g: THREE.BufferGeometry, c: number, x: number, y: number, z: number) => { const m = new THREE.Mesh(g, new THREE.MeshToonMaterial({ color: c })); m.position.set(x, y, z); int.group.add(m); return m; };
      mk(new THREE.BoxGeometry(1.5, 0.4, 2.3), 0x6a4a2c, bx, 0.2, bz); mk(new THREE.BoxGeometry(1.4, 0.18, 2.1), 0xe8dcc8, bx, 0.49, bz); mk(new THREE.BoxGeometry(1.4, 0.06, 1.3), 0x8a2a2a, bx, 0.6, bz + 0.35); mk(new THREE.BoxGeometry(1.0, 0.16, 0.45), 0xf4ecdc, bx, 0.63, bz - 0.75); mk(new THREE.BoxGeometry(1.5, 1.0, 0.1), 0x5a3a20, bx, 0.5, bz - 1.15);
      const mx = int.W - 1.4, mz = 1.0; mk(new THREE.CylinderGeometry(0.06, 0.07, 1.0, 6), 0x3a2a1c, mx, 0.5, mz); mk(new THREE.BoxGeometry(0.62, 0.42, 0.4), 0x3a5a8a, mx, 1.15, mz); mk(new THREE.BoxGeometry(0.66, 0.06, 0.44), 0xc8963a, mx, 1.38, mz);
      (int as typeof int & { home?: { bed: { x: number; z: number }; box: { x: number; z: number } } }).home = { bed: { x: bx, z: bz + 1.4 }, box: { x: mx, z: mz + 0.7 } }; }
    int.group.position.set(IX, 0, IZ); scene.add(int.group);
    { const dd = DOOR_OF.get(p); inside = { int, ret: dd ? { x: dd.out.x / T, y: dd.out.z / T } : { x: p.gx + p.w / 2 + (holy ? 0.8 : 0), y: p.gy + p.h + 0.8 }, prop: p }; }
    objs.group.visible = false; decoOut.visible = false; decoOthers.visible = false; casteloSys.sitting = null; for (const n of npcSys.npcs) n.hero.root.visible = false; if (p === construcaoSys.homeProp) decoInterior(); else if (otherDecor.has(p)) decoInterior(otherDecor.get(p));
    state.fx = (IX + int.W / 2) / T; state.fy = (IZ + int.D - 0.6) / T; state.path = [];
    heroY = 0; camX = IX + int.W / 2; camZ = IZ + int.D / 2; camY = 0;
    game.logMsg(p.kind === 'temple' ? 'Templo Kármico' : p.kind === 'church' ? 'Igreja Abandonada — o ar é frio aqui' : p.variant === 4 ? 'Taverna Karmika' : p.variant === 5 ? 'Loja do Armeiro' : 'Você entra na casa', '#f4e6b8');
  });
}
/* CATEDRAL ABANDONADA: a nave, as 3 criptas, a Porta do Bispo (3 selos) e o salão do Bispo; entrar e descer nas criptas, o sermão e o espírito. Saiu do main.ts (02/11). → sistemas/catedral.ts */
export interface CatedralCtx {
  inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly IX: Widen<typeof IX>;
  readonly IZ: Widen<typeof IZ>;
  readonly particles: Widen<typeof particles>;
  readonly audio: Widen<typeof audio>;
  readonly game: Widen<typeof game>;
  readonly heroPosNow: Widen<typeof heroPosNow>;
  readonly city: Widen<typeof city>;
  readonly feats: Widen<typeof feats>;
  readonly withFade: typeof withFade;
  readonly scene: Widen<typeof scene>;
  readonly objs: Widen<typeof objs>;
  readonly casteloSys: ReturnType<typeof createCastelo>;
  readonly npcSys: Widen<typeof npcSys>;
  readonly state: Widen<typeof state>;
  heroY: Widen<typeof heroY>;
  camX: Widen<typeof camX>;
  camZ: Widen<typeof camZ>;
  camY: Widen<typeof camY>;
  readonly chat: Widen<typeof chat>;
}
var catedralSys: ReturnType<typeof createCatedral>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_catedralSys() { return createCatedral({ get inside() { return inside; }, set inside(v) { inside = v; }, get IX() { return IX; }, get IZ() { return IZ; }, get particles() { return particles; }, get audio() { return audio; }, get game() { return game; }, get heroPosNow() { return heroPosNow; }, get city() { return city; }, get feats() { return feats; }, get withFade() { return withFade; }, get scene() { return scene; }, get objs() { return objs; }, get casteloSys() { return casteloSys; }, get npcSys() { return npcSys; }, get state() { return state; }, get heroY() { return heroY; }, set heroY(v) { heroY = v; }, get camX() { return camX; }, set camX(v) { camX = v; }, get camZ() { return camZ; }, set camZ(v) { camZ = v; }, get camY() { return camY; }, set camY(v) { camY = v; }, get chat() { return chat; } }); }
catedralSys ??= mk_catedralSys();
const { CRYPT_FLOORS, bloodFull, BLOOD_NEED } = catedralSys;
function enterCrypt(...a: Parameters<ReturnType<typeof createCatedral>['enterCrypt']>): ReturnType<ReturnType<typeof createCatedral>['enterCrypt']> { return (catedralSys ??= mk_catedralSys()).enterCrypt(...a); }
function pourBlood(...a: Parameters<ReturnType<typeof createCatedral>['pourBlood']>): ReturnType<ReturnType<typeof createCatedral>['pourBlood']> { return (catedralSys ??= mk_catedralSys()).pourBlood(...a); }
function drawBloodHud(...a: Parameters<ReturnType<typeof createCatedral>['drawBloodHud']>): ReturnType<ReturnType<typeof createCatedral>['drawBloodHud']> { return (catedralSys ??= mk_catedralSys()).drawBloodHud(...a); }
function updateBlood(...a: Parameters<ReturnType<typeof createCatedral>['updateBlood']>): ReturnType<ReturnType<typeof createCatedral>['updateBlood']> { return (catedralSys ??= mk_catedralSys()).updateBlood(...a); }

/* MASMORRAS, CAVERNAS E SUBSOLOS: entrar e sair, os andares, os chefes e o mapa de cada uma (masmorras.ts monta, dungeon3d.ts desenha). Saiu do main.ts (02/11). → sistemas/masmorras-entrar.ts */
export interface MasmorrasEntrarCtx {
  readonly scene: Widen<typeof scene>;
  readonly city: Widen<typeof city>;
  readonly game: Widen<typeof game>;
  readonly particles: Widen<typeof particles>;
  readonly audio: Widen<typeof audio>;
  readonly heroPosNow: Widen<typeof heroPosNow>;
  readonly camera: Widen<typeof camera>;
  readonly canvas: Widen<typeof canvas>;
  readonly netRef: Net | null;
  readonly chat: Widen<typeof chat>;
  readonly quests: Widen<typeof quests>;
  readonly feats: Widen<typeof feats>;
  readonly heroicAct: typeof heroicAct;
  readonly profile: Profile | null;
  readonly updateWho: typeof updateWho;
  readonly opts: Widen<typeof opts>;
  readonly state: Widen<typeof state>;
  readonly moveSlide: typeof moveSlide;
  readonly free: Widen<typeof free>;
  readonly dlg: Widen<typeof dlg>;
  readonly openDlg: Widen<typeof openDlg>;
  readonly solids: Widen<typeof solids>;
  readonly withFade: typeof withFade;
  inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly IX: Widen<typeof IX>;
  readonly IZ: Widen<typeof IZ>;
  readonly objs: Widen<typeof objs>;
  readonly casteloSys: ReturnType<typeof createCastelo>;
  readonly npcSys: Widen<typeof npcSys>;
  heroY: Widen<typeof heroY>;
  camX: Widen<typeof camX>;
  camZ: Widen<typeof camZ>;
  camY: Widen<typeof camY>;
  readonly cryptInt: CathedralFloor | null;
  readonly CINE_MARKS: Widen<typeof CINE_MARKS>;
  readonly enterCrypt: typeof enterCrypt;
  readonly portraitOf: typeof portraitOf;
  readonly bishop: ReturnType<typeof game.enemies.spawn> | null;
  bishopPhase: Widen<typeof catedralSys.bishopPhase>;
  sermonT: Widen<typeof catedralSys.sermonT>;
  readonly hero: Hero3D;
}
var dgSys: ReturnType<typeof createMasmorrasEntrar>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_dgSys() { return createMasmorrasEntrar({ get scene() { return scene; }, get city() { return city; }, get game() { return game; }, get particles() { return particles; }, get audio() { return audio; }, get heroPosNow() { return heroPosNow; }, get camera() { return camera; }, get canvas() { return canvas; }, get netRef() { return netRef; }, get chat() { return chat; }, get quests() { return quests; }, get feats() { return feats; }, get heroicAct() { return heroicAct; }, get profile() { return profile; }, get updateWho() { return updateWho; }, get opts() { return opts; }, get state() { return state; }, get moveSlide() { return moveSlide; }, get free() { return free; }, get dlg() { return dlg; }, get openDlg() { return openDlg; }, get solids() { return solids; }, get withFade() { return withFade; }, get inside() { return inside; }, set inside(v) { inside = v; }, get IX() { return IX; }, get IZ() { return IZ; }, get objs() { return objs; }, get casteloSys() { return casteloSys; }, get npcSys() { return npcSys; }, get heroY() { return heroY; }, set heroY(v) { heroY = v; }, get camX() { return camX; }, set camX(v) { camX = v; }, get camZ() { return camZ; }, set camZ(v) { camZ = v; }, get camY() { return camY; }, set camY(v) { camY = v; }, get cryptInt() { return catedralSys.cryptInt; }, get CINE_MARKS() { return CINE_MARKS; }, get enterCrypt() { return enterCrypt; }, get portraitOf() { return portraitOf; }, get bishop() { return catedralSys.bishop; }, get bishopPhase() { return catedralSys.bishopPhase; }, set bishopPhase(v) { catedralSys.bishopPhase = v; }, get sermonT() { return catedralSys.sermonT; }, set sermonT(v) { catedralSys.sermonT = v; }, get hero() { return hero; } }); }
dgSys ??= mk_dgSys();
const { dgs, SEALS, HALL_GATE, TREE_GATE, brain } = dgSys;
function dgInst(...a: Parameters<ReturnType<typeof createMasmorrasEntrar>['dgInst']>): ReturnType<ReturnType<typeof createMasmorrasEntrar>['dgInst']> { return (dgSys ??= mk_dgSys()).dgInst(...a); }
function enterDungeon(...a: Parameters<ReturnType<typeof createMasmorrasEntrar>['enterDungeon']>): ReturnType<ReturnType<typeof createMasmorrasEntrar>['enterDungeon']> { return (dgSys ??= mk_dgSys()).enterDungeon(...a); }
function dungeonBoard(...a: Parameters<ReturnType<typeof createMasmorrasEntrar>['dungeonBoard']>): ReturnType<ReturnType<typeof createMasmorrasEntrar>['dungeonBoard']> { return (dgSys ??= mk_dgSys()).dungeonBoard(...a); }
function readSign(...a: Parameters<ReturnType<typeof createMasmorrasEntrar>['readSign']>): ReturnType<ReturnType<typeof createMasmorrasEntrar>['readSign']> { return (dgSys ??= mk_dgSys()).readSign(...a); }
function talkSpirit(...a: Parameters<ReturnType<typeof createMasmorrasEntrar>['talkSpirit']>): ReturnType<ReturnType<typeof createMasmorrasEntrar>['talkSpirit']> { return (dgSys ??= mk_dgSys()).talkSpirit(...a); }
function enterHall(...a: Parameters<ReturnType<typeof createMasmorrasEntrar>['enterHall']>): ReturnType<ReturnType<typeof createMasmorrasEntrar>['enterHall']> { return (dgSys ??= mk_dgSys()).enterHall(...a); }
function updateBishop(...a: Parameters<ReturnType<typeof createMasmorrasEntrar>['updateBishop']>): ReturnType<ReturnType<typeof createMasmorrasEntrar>['updateBishop']> { return (dgSys ??= mk_dgSys()).updateBishop(...a); }
function updateSpirit(...a: Parameters<ReturnType<typeof createMasmorrasEntrar>['updateSpirit']>): ReturnType<ReturnType<typeof createMasmorrasEntrar>['updateSpirit']> { return (dgSys ??= mk_dgSys()).updateSpirit(...a); }

/* O CASTELO DO CONDE VLADISLAV: seis andares, entrar pelo portão do térreo, subir e descer; também sair de qualquer interior (exitHouse), o banco onde o herói senta e a dica de interação (E). Saiu do main.ts (02/11). → sistemas/castelo.ts */
export interface CasteloCtx {
  readonly city: Widen<typeof city>;
  readonly feats: Widen<typeof feats>;
  readonly withFade: typeof withFade;
  inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly scene: Widen<typeof scene>;
  readonly game: Widen<typeof game>;
  readonly IX: Widen<typeof IX>;
  readonly IZ: Widen<typeof IZ>;
  readonly objs: Widen<typeof objs>;
  readonly npcSys: Widen<typeof npcSys>;
  readonly state: Widen<typeof state>;
  heroY: Widen<typeof heroY>;
  camX: Widen<typeof camX>;
  camZ: Widen<typeof camZ>;
  camY: Widen<typeof camY>;
  exiting: Widen<typeof dgSys.exiting>;
  readonly enterCrypt: typeof enterCrypt;
  cryptInt: CathedralFloor | null;
  bishop: ReturnType<typeof game.enemies.spawn> | null;
  spirit: { root: THREE.Object3D; x: number; z: number; where: string } | null;
  readonly dgs: Widen<typeof dgs>;
  readonly decoOut: Widen<typeof decoOut>;
  readonly decoOthers: Widen<typeof decoOthers>;
  readonly decoCancel: typeof decoCancel;
}
var casteloSys: ReturnType<typeof createCastelo>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_casteloSys() { return createCastelo({ get city() { return city; }, get feats() { return feats; }, get withFade() { return withFade; }, get inside() { return inside; }, set inside(v) { inside = v; }, get scene() { return scene; }, get game() { return game; }, get IX() { return IX; }, get IZ() { return IZ; }, get objs() { return objs; }, get npcSys() { return npcSys; }, get state() { return state; }, get heroY() { return heroY; }, set heroY(v) { heroY = v; }, get camX() { return camX; }, set camX(v) { camX = v; }, get camZ() { return camZ; }, set camZ(v) { camZ = v; }, get camY() { return camY; }, set camY(v) { camY = v; }, get exiting() { return dgSys.exiting; }, set exiting(v) { dgSys.exiting = v; }, get enterCrypt() { return enterCrypt; }, get cryptInt() { return catedralSys.cryptInt; }, set cryptInt(v) { catedralSys.cryptInt = v; }, get bishop() { return catedralSys.bishop; }, set bishop(v) { catedralSys.bishop = v; }, get spirit() { return dgSys.spirit; }, set spirit(v) { dgSys.spirit = v; }, get dgs() { return dgs; }, get decoOut() { return decoOut; }, get decoOthers() { return decoOthers; }, get decoCancel() { return decoCancel; } }); }
casteloSys ??= mk_casteloSys();
const { CASTLE_DOOR, hintEl } = casteloSys;
function exitHouse(...a: Parameters<ReturnType<typeof createCastelo>['exitHouse']>): ReturnType<ReturnType<typeof createCastelo>['exitHouse']> { return (casteloSys ??= mk_casteloSys()).exitHouse(...a); }
function enterCastle(...a: Parameters<ReturnType<typeof createCastelo>['enterCastle']>): ReturnType<ReturnType<typeof createCastelo>['enterCastle']> { return (casteloSys ??= mk_casteloSys()).enterCastle(...a); }

/* LETREIRO RÚNICO DO ALTO e EVENTOS MUNDIAIS: lugar, clima, turno, nível da região, elite próxima; o contador e o painel dos eventos globais; as marcas de missão sobre os NPCs. Saiu do main.ts (02/11). → sistemas/letreiro-eventos.ts */
export interface LetreiroCtx {
  readonly eventos: Widen<typeof eventos>;
  pinT: { x: number; y: number; label: string } | null;
  readonly game: Widen<typeof game>;
  readonly globalSideText: typeof globalSideText;
  readonly hereT: typeof hereT;
  readonly fmtDist: Widen<typeof fmtDist>;
  readonly npcSys: Widen<typeof npcSys>;
  readonly quests: Widen<typeof quests>;
  readonly city: Widen<typeof city>;
  readonly gameHour: Widen<typeof gameHour>;
  readonly TURNS: Widen<typeof TURNS>;
  readonly DAY_REAL_MS: Widen<typeof DAY_REAL_MS>;
  readonly state: Widen<typeof state>;
  readonly larSys: ReturnType<typeof createLarMorte>;
  readonly SHOP_BY_NAME: Widen<typeof SHOP_BY_NAME>;
  readonly zoneName: typeof zoneName;
  readonly obras: Widen<typeof obras>;
  readonly turnName: typeof turnName;
  readonly align: Widen<typeof align>;
  readonly guideT: { x: number; y: number; label: string } | null;
  readonly setPin: typeof setPin;
}
var letreiroSys: ReturnType<typeof createLetreiro>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_letreiroSys() { return createLetreiro({ get eventos() { return eventos; }, get pinT() { return guiaSys.pinT; }, set pinT(v) { guiaSys.pinT = v; }, get game() { return game; }, get globalSideText() { return globalSideText; }, get hereT() { return hereT; }, get fmtDist() { return fmtDist; }, get npcSys() { return npcSys; }, get quests() { return quests; }, get city() { return city; }, get gameHour() { return gameHour; }, get TURNS() { return TURNS; }, get DAY_REAL_MS() { return DAY_REAL_MS; }, get state() { return state; }, get larSys() { return larSys; }, get SHOP_BY_NAME() { return SHOP_BY_NAME; }, get zoneName() { return zoneName; }, get obras() { return obras; }, get turnName() { return turnName; }, get align() { return align; }, get guideT() { return guiaSys.guideT; }, get setPin() { return setPin; } }); }
letreiroSys ??= mk_letreiroSys();
function temperature(...a: Parameters<ReturnType<typeof createLetreiro>['temperature']>): ReturnType<ReturnType<typeof createLetreiro>['temperature']> { return (letreiroSys ??= mk_letreiroSys()).temperature(...a); }
function gevNote(...a: Parameters<ReturnType<typeof createLetreiro>['gevNote']>): ReturnType<ReturnType<typeof createLetreiro>['gevNote']> { return (letreiroSys ??= mk_letreiroSys()).gevNote(...a); }
function dayIndex(...a: Parameters<ReturnType<typeof createLetreiro>['dayIndex']>): ReturnType<ReturnType<typeof createLetreiro>['dayIndex']> { return (letreiroSys ??= mk_letreiroSys()).dayIndex(...a); }
function updateBanner(...a: Parameters<ReturnType<typeof createLetreiro>['updateBanner']>): ReturnType<ReturnType<typeof createLetreiro>['updateBanner']> { return (letreiroSys ??= mk_letreiroSys()).updateBanner(...a); }
function updateGevChip(...a: Parameters<ReturnType<typeof createLetreiro>['updateGevChip']>): ReturnType<ReturnType<typeof createLetreiro>['updateGevChip']> { return (letreiroSys ??= mk_letreiroSys()).updateGevChip(...a); }
function updateQuestMarks(...a: Parameters<ReturnType<typeof createLetreiro>['updateQuestMarks']>): ReturnType<ReturnType<typeof createLetreiro>['updateQuestMarks']> { return (letreiroSys ??= mk_letreiroSys()).updateQuestMarks(...a); }
function curseK(...a: Parameters<ReturnType<typeof createLetreiro>['curseK']>): ReturnType<ReturnType<typeof createLetreiro>['curseK']> { return (letreiroSys ??= mk_letreiroSys()).curseK(...a); }

/* FONTE-LAR, MORTE E RENASCIMENTO: a fonte de casa, voltar ao lar, o painel da morte, a espera do servidor, o lugar sagrado, o limiar e o retrato da cabeça. Saiu do main.ts (02/11). → sistemas/lar-e-morte.ts */
export interface LarMorteCtx {
  readonly profile: Profile | null;
  readonly city: Widen<typeof city>;
  readonly state: Widen<typeof state>;
  readonly objs: Widen<typeof objs>;
  heroY: Widen<typeof heroY>;
  camX: Widen<typeof camX>;
  camZ: Widen<typeof camZ>;
  camY: Widen<typeof camY>;
  readonly feats: Widen<typeof feats>;
  readonly game: Widen<typeof game>;
  inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly dgs: Widen<typeof dgs>;
  cryptInt: CathedralFloor | null;
  bishop: ReturnType<typeof game.enemies.spawn> | null;
  spirit: { root: THREE.Object3D; x: number; z: number; where: string } | null;
  readonly scene: Widen<typeof scene>;
  readonly decoOut: Widen<typeof decoOut>;
  readonly decoOthers: Widen<typeof decoOthers>;
  readonly decoCancel: typeof decoCancel;
  readonly npcSys: Widen<typeof npcSys>;
  readonly particles: Widen<typeof particles>;
  readonly withFade: typeof withFade;
  readonly soul: Widen<typeof soul>;
  readonly limiar: Widen<typeof limiar>;
  readonly audio: Widen<typeof audio>;
  readonly hero: Hero3D;
  readonly net: Widen<typeof net>;
  readonly hub: Widen<typeof hub>;
  readonly quests: Widen<typeof quests>;
  readonly inv: Widen<typeof inv>;
  readonly showCreate: typeof showCreate;
  readonly skinModel: THREE.Object3D | null;
  readonly renderer: Widen<typeof renderer>;
}
var larSys: ReturnType<typeof createLarMorte>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_larSys() { return createLarMorte({ get profile() { return profile; }, get city() { return city; }, get state() { return state; }, get objs() { return objs; }, get heroY() { return heroY; }, set heroY(v) { heroY = v; }, get camX() { return camX; }, set camX(v) { camX = v; }, get camZ() { return camZ; }, set camZ(v) { camZ = v; }, get camY() { return camY; }, set camY(v) { camY = v; }, get feats() { return feats; }, get game() { return game; }, get inside() { return inside; }, set inside(v) { inside = v; }, get dgs() { return dgs; }, get cryptInt() { return catedralSys.cryptInt; }, set cryptInt(v) { catedralSys.cryptInt = v; }, get bishop() { return catedralSys.bishop; }, set bishop(v) { catedralSys.bishop = v; }, get spirit() { return dgSys.spirit; }, set spirit(v) { dgSys.spirit = v; }, get scene() { return scene; }, get decoOut() { return decoOut; }, get decoOthers() { return decoOthers; }, get decoCancel() { return decoCancel; }, get npcSys() { return npcSys; }, get particles() { return particles; }, get withFade() { return withFade; }, get soul() { return soul; }, get limiar() { return limiar; }, get audio() { return audio; }, get hero() { return hero; }, get net() { return net; }, get hub() { return hub; }, get quests() { return quests; }, get inv() { return inv; }, get showCreate() { return showCreate; }, get skinModel() { return peleSys.skinModel; }, get renderer() { return snapR(); } }); }
larSys ??= mk_larSys();
const { originName, srvWait, HOME_KEY, defaultHome } = larSys;
function leaveInteriorNow(...a: Parameters<ReturnType<typeof createLarMorte>['leaveInteriorNow']>): ReturnType<ReturnType<typeof createLarMorte>['leaveInteriorNow']> { return (larSys ??= mk_larSys()).leaveInteriorNow(...a); }
function unbind(...a: Parameters<ReturnType<typeof createLarMorte>['unbind']>): ReturnType<ReturnType<typeof createLarMorte>['unbind']> { return (larSys ??= mk_larSys()).unbind(...a); }
function placeAt(...a: Parameters<ReturnType<typeof createLarMorte>['placeAt']>): ReturnType<ReturnType<typeof createLarMorte>['placeAt']> { return (larSys ??= mk_larSys()).placeAt(...a); }
function goHome(...a: Parameters<ReturnType<typeof createLarMorte>['goHome']>): ReturnType<ReturnType<typeof createLarMorte>['goHome']> { return (larSys ??= mk_larSys()).goHome(...a); }
function headShot(...a: Parameters<ReturnType<typeof createLarMorte>['headShot']>): ReturnType<ReturnType<typeof createLarMorte>['headShot']> { return (larSys ??= mk_larSys()).headShot(...a); }
function setHome(...a: Parameters<ReturnType<typeof createLarMorte>['setHome']>): ReturnType<ReturnType<typeof createLarMorte>['setHome']> { return (larSys ??= mk_larSys()).setHome(...a); }

if (IS_DEV) (window as unknown as { __soul: unknown }).__soul = { enterDg: (i: number) => enterDungeon(dgs.entrances[i]), city: () => city, scene: () => scene, camera: () => camera, relics: (n: string) => openRelics(n), discovered: () => discovered, dgs: () => dgs, roastAt, eliteForge: (nm: string) => { const n = npcSys.npcs.find((q) => q.def.name === nm); if (n) eliteForge(n); }, eyeSees, caravans, eventos, falls, align, startFesta, festaFade, festaOffer, leavingQuest, npcHome, hereSettle, senseGoals, headShot, planTo, navProbe, stepAt, offerVow, vowState: () => vow, quests, wall: () => ({ on: colisaoSys.onWall, y: heroY }), hero: () => hero, applyArtSkin, skinKey: () => peleSys.skinKey, setProfile: (p: Partial<Profile>) => { if (profile) Object.assign(profile, p); }, swapHero, soul, game, state, unbind, inv, tree, heroPos: () => hero.root.position, talkTo, npcs: () => npcSys.npcs, limiar, craftJob, net: () => net };
/* A ALMA DEPOIS DA MORTE: retomar o limiar, os fôlegos na tela e o portal de volta. Saiu do main.ts (02/11). → sistemas/portal-alma.ts */
export interface PortalAlmaCtx {
  readonly profile: Profile | null;
  readonly limiar: Widen<typeof limiar>;
  readonly soul: Widen<typeof soul>;
  readonly unbind: typeof unbind;
  readonly game: Widen<typeof game>;
  readonly inv: Widen<typeof inv>;
  readonly scene: Widen<typeof scene>;
  readonly hero: Hero3D;
  readonly state: Widen<typeof state>;
  readonly particles: Widen<typeof particles>;
  readonly goHome: typeof goHome;
  readonly home: Home;
}
var portalSys: ReturnType<typeof createPortalAlma>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_portalSys() { return createPortalAlma({ get profile() { return profile; }, get limiar() { return limiar; }, get soul() { return soul; }, get unbind() { return unbind; }, get game() { return game; }, get inv() { return inv; }, get scene() { return scene; }, get hero() { return hero; }, get state() { return state; }, get particles() { return particles; }, get goHome() { return goHome; }, get home() { return larSys.home; } }); }
portalSys ??= mk_portalSys();
function openPortal(...a: Parameters<ReturnType<typeof createPortalAlma>['openPortal']>): ReturnType<ReturnType<typeof createPortalAlma>['openPortal']> { return (portalSys ??= mk_portalSys()).openPortal(...a); }
function resumeSoul(...a: Parameters<ReturnType<typeof createPortalAlma>['resumeSoul']>): ReturnType<ReturnType<typeof createPortalAlma>['resumeSoul']> { return (portalSys ??= mk_portalSys()).resumeSoul(...a); }
function updatePortal(...a: Parameters<ReturnType<typeof createPortalAlma>['updatePortal']>): ReturnType<ReturnType<typeof createPortalAlma>['updatePortal']> { return (portalSys ??= mk_portalSys()).updatePortal(...a); }

/* ---------- relíquias dos caminhantes: viagem rápida entre as conhecidas ---------- */
const relicsKnown = new Set<string>(JSON.parse(localStorage.getItem('karmika.relics.v1') || '[]') as string[]);
/** no modo deus todas as relíquias respondem (viagem para qualquer uma) */
const knowsRelic = (n: string) => game.st.god || relicsKnown.has(n);
/* CINEMÁTICAS DE PAISAGEM, Fontes da Visão, portas das casas e marcas de cena: tocar a cena, a câmera do menu, os olhos das vistas e os gatilhos. Saiu do main.ts (02/11). → sistemas/cinema-vistas.ts */
export interface CinemaVistasCtx {
  readonly city: Widen<typeof city>;
  readonly keys: Widen<typeof keys>;
  readonly state: Widen<typeof state>;
  readonly combatMode: Widen<typeof entradaSys.combatMode>;
  readonly setCombat: typeof setCombat;
  readonly objs: Widen<typeof objs>;
  camX: Widen<typeof camX>;
  camZ: Widen<typeof camZ>;
  zoomTarget: Widen<typeof zoomTarget>;
  az: Widen<typeof az>;
  readonly audio: Widen<typeof audio>;
  readonly fading: Widen<typeof fading>;
  readonly withFade: typeof withFade;
  azT: Widen<typeof azT>;
  readonly inicio: Widen<typeof inicio>;
  readonly creating: Widen<typeof peleSys.creating>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly social: Widen<typeof social>;
  zoom: Widen<typeof zoom>;
  camY: Widen<typeof camY>;
  readonly heroY: Widen<typeof heroY>;
  readonly camera: Widen<typeof camera>;
  readonly scene: Widen<typeof scene>;
  readonly game: Widen<typeof game>;
  readonly particles: Widen<typeof particles>;
}
var cinemaSys: ReturnType<typeof createCinemaVistas>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_cinemaSys() { return createCinemaVistas({ get city() { return city; }, get keys() { return keys; }, get state() { return state; }, get combatMode() { return entradaSys.combatMode; }, get setCombat() { return setCombat; }, get objs() { return objs; }, get camX() { return camX; }, set camX(v) { camX = v; }, get camZ() { return camZ; }, set camZ(v) { camZ = v; }, get zoomTarget() { return zoomTarget; }, set zoomTarget(v) { zoomTarget = v; }, get az() { return az; }, set az(v) { az = v; }, get audio() { return audio; }, get fading() { return fading; }, get withFade() { return withFade; }, get azT() { return azT; }, set azT(v) { azT = v; }, get inicio() { return inicio; }, get creating() { return peleSys.creating; }, get inside() { return inside; }, get social() { return social; }, get zoom() { return zoom; }, set zoom(v) { zoom = v; }, get camY() { return camY; }, set camY(v) { camY = v; }, get heroY() { return heroY; }, get camera() { return camera; }, get scene() { return scene; }, get game() { return game; }, get particles() { return particles; } }); }
cinemaSys ??= mk_cinemaSys();
const { CINE, vistaSeen, DOOR_OF, CINE_MARKS, vistaObjs } = cinemaSys;
function endScene(...a: Parameters<ReturnType<typeof createCinemaVistas>['endScene']>): ReturnType<ReturnType<typeof createCinemaVistas>['endScene']> { return (cinemaSys ??= mk_cinemaSys()).endScene(...a); }
function useVista(...a: Parameters<ReturnType<typeof createCinemaVistas>['useVista']>): ReturnType<ReturnType<typeof createCinemaVistas>['useVista']> { return (cinemaSys ??= mk_cinemaSys()).useVista(...a); }
function updateMarks(...a: Parameters<ReturnType<typeof createCinemaVistas>['updateMarks']>): ReturnType<ReturnType<typeof createCinemaVistas>['updateMarks']> { return (cinemaSys ??= mk_cinemaSys()).updateMarks(...a); }
function updateCine(...a: Parameters<ReturnType<typeof createCinemaVistas>['updateCine']>): ReturnType<ReturnType<typeof createCinemaVistas>['updateCine']> { return (cinemaSys ??= mk_cinemaSys()).updateCine(...a); }
function menuView(...a: Parameters<ReturnType<typeof createCinemaVistas>['menuView']>): ReturnType<ReturnType<typeof createCinemaVistas>['menuView']> { return (cinemaSys ??= mk_cinemaSys()).menuView(...a); }
function updateDoors(...a: Parameters<ReturnType<typeof createCinemaVistas>['updateDoors']>): ReturnType<ReturnType<typeof createCinemaVistas>['updateDoors']> { return (cinemaSys ??= mk_cinemaSys()).updateDoors(...a); }
function checkCineTriggers(...a: Parameters<ReturnType<typeof createCinemaVistas>['checkCineTriggers']>): ReturnType<ReturnType<typeof createCinemaVistas>['checkCineTriggers']> { return (cinemaSys ??= mk_cinemaSys()).checkCineTriggers(...a); }

/* RELÍQUIAS DOS CAMINHANTES: tocar, a janela das relíquias (mapa das conhecidas, vilas, masmorras, lugares, Ormund) e a viagem rápida. Saiu do main.ts (02/11). → sistemas/reliquias.ts */
export interface ReliquiasCtx {
  readonly knowsRelic: Widen<typeof knowsRelic>;
  readonly relicsKnown: Widen<typeof relicsKnown>;
  readonly hero: Hero3D;
  readonly profile: Profile | null;
  readonly addKarma: typeof addKarma;
  readonly game: Widen<typeof game>;
  readonly particles: Widen<typeof particles>;
  readonly heroPos: Widen<typeof heroPos>;
  readonly city: Widen<typeof city>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly state: Widen<typeof state>;
  readonly dgs: Widen<typeof dgs>;
  readonly hereT: typeof hereT;
  readonly ormund: Widen<typeof ormund>;
  readonly fmtDist: Widen<typeof fmtDist>;
  readonly MMS: Widen<typeof MMS>;
  readonly mmBase: Widen<typeof mmBase>;
  pinT: { x: number; y: number; label: string } | null;
  readonly updateBanner: typeof updateBanner;
  readonly withFade: typeof withFade;
  readonly objs: Widen<typeof objs>;
  heroY: Widen<typeof heroY>;
  camX: Widen<typeof camX>;
  camZ: Widen<typeof camZ>;
  camY: Widen<typeof camY>;
}
var reliquiasSys: ReturnType<typeof createReliquias>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_reliquiasSys() { return createReliquias({ get knowsRelic() { return knowsRelic; }, get relicsKnown() { return relicsKnown; }, get hero() { return hero; }, get profile() { return profile; }, get addKarma() { return addKarma; }, get game() { return game; }, get particles() { return particles; }, get heroPos() { return heroPos; }, get city() { return city; }, get inside() { return inside; }, get state() { return state; }, get dgs() { return dgs; }, get hereT() { return hereT; }, get ormund() { return ormund; }, get fmtDist() { return fmtDist; }, get MMS() { return MMS; }, get mmBase() { return mmBase; }, get pinT() { return guiaSys.pinT; }, set pinT(v) { guiaSys.pinT = v; }, get updateBanner() { return updateBanner; }, get withFade() { return withFade; }, get objs() { return objs; }, get heroY() { return heroY; }, set heroY(v) { heroY = v; }, get camX() { return camX; }, set camX(v) { camX = v; }, get camZ() { return camZ; }, set camZ(v) { camZ = v; }, get camY() { return camY; }, set camY(v) { camY = v; } }); }
reliquiasSys ??= mk_reliquiasSys();
const { discovered, relicNameAt } = reliquiasSys;
function touchRelic(...a: Parameters<ReturnType<typeof createReliquias>['touchRelic']>): ReturnType<ReturnType<typeof createReliquias>['touchRelic']> { return (reliquiasSys ??= mk_reliquiasSys()).touchRelic(...a); }
function travelRelic(...a: Parameters<ReturnType<typeof createReliquias>['travelRelic']>): ReturnType<ReturnType<typeof createReliquias>['travelRelic']> { return (reliquiasSys ??= mk_reliquiasSys()).travelRelic(...a); }
function closeRelics(...a: Parameters<ReturnType<typeof createReliquias>['closeRelics']>): ReturnType<ReturnType<typeof createReliquias>['closeRelics']> { return (reliquiasSys ??= mk_reliquiasSys()).closeRelics(...a); }
function openRelics(...a: Parameters<ReturnType<typeof createReliquias>['openRelics']>): ReturnType<ReturnType<typeof createReliquias>['openRelics']> { return (reliquiasSys ??= mk_reliquiasSys()).openRelics(...a); }

/* 07/11: os navios da Companhia de Latão (cais no continente e nas ilhas) — criado na primeira vez que o quadro pede */
let naviosSys: ReturnType<typeof createNavios> | null = null, faroisSys: ReturnType<typeof createFarois> | null = null;
let telefSys: ReturnType<typeof createTeleferico> | null = null;
const teleferico = () => (telefSys ??= createTeleferico({ scene, city, game, state, withFade, objs, get heroY() { return heroY; }, set heroY(v) { heroY = v; }, get camX() { return camX; }, set camX(v) { camX = v; }, get camZ() { return camZ; }, set camZ(v) { camZ = v; }, get camY() { return camY; }, set camY(v) { camY = v; } }));
const navios = () => (naviosSys ??= createNavios({ hour: () => gameHour(), scene, city, game, state, withFade, objs, get heroY() { return heroY; }, set heroY(v) { heroY = v; }, get camX() { return camX; }, set camX(v) { camX = v; }, get camZ() { return camZ; }, set camZ(v) { camZ = v; }, get camY() { return camY; }, set camY(v) { camY = v; }, get inside() { return inside; }, get combatMode() { return entradaSys.combatMode; } }));
/* 09/11 (revisão de FPS): a dica do E varria TODOS os objetos do mundo sete vezes, 8× por segundo (casas, fontes, bancos, correios…) —
   um tranco de 10–20 ms. Agora há um índice por células de 8 casas, e só as 9 células em volta do herói entram na conta */
const INTER_KINDS = new Set(['house', 'temple', 'church', 'fountain', 'vault', 'mailbox', 'gboard', 'gchest', 'noticeboard', 'bench']);
let interIdx: Map<number, (typeof city.props)[number][]> | null = null, interN = -1;
function interNear(hx: number, hz: number) { if (!interIdx || interN !== city.props.length) { interIdx = new Map(); interN = city.props.length; for (const p of city.props) { if (!INTER_KINDS.has(p.kind)) continue; const k = ((p.gy + p.h / 2) >> 3) * 4096 + ((p.gx + p.w / 2) >> 3); (interIdx.get(k) ?? interIdx.set(k, []).get(k)!).push(p); } }
  const cx = Math.floor(hx / T) >> 3, cy = Math.floor(hz / T) >> 3, out: (typeof city.props)[number][] = []; for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) { const l = interIdx.get(y * 4096 + x); if (l) for (const p of l) out.push(p); } return out; }
function findInter(): Inter | null {
  const hx = state.fx * T, hz = state.fy * T; let best: Inter | null = null; const NI = interNear(hx, hz);
  const add = (d: number, max: number, label: string, act: () => void) => { if (d < max && (!best || d < best.d)) best = { d, label, act }; };
  { const ci = caravans.interact(hx, hz); if (ci) add(ci.d - 0.5, 4.5, ci.label, ci.act); }
  if (!inside) { const ni = navios().interact(hx, hz); if (ni) add(ni.d - 1, 7, ni.label, ni.act); const tl = teleferico().interact(hx, hz); if (tl) add(tl.d - 1, 4.5, tl.label, tl.act); }
  { const ei = eventos.interact(hx, hz); if (ei) add(ei.d - 0.6, 4.5, ei.label, ei.act); }
  { const si = secrets.interact(hx, hz, instintoSys.instinctOn, digCache); if (si) add(si.d - 0.4, 3, si.label, si.act); }
  { const oi = ormund.interact(hx, hz); if (oi) add(oi.d, 2.2, `📜 ${oi.label}`, oi.act); }
  for (const n of npcSys.npcs) {
    const nm = n.def.name, dN = Math.hypot(n.pos.x - hx, n.pos.z - hz); if (dN > 4) continue; /* 09/11 (revisão de FPS): só os NPCs perto passam pela consulta de missões — antes eram todos do mundo, 10× por segundo (um tranco a cada 0,12 s) */
    if (n.def.night && !n.hero.root.visible) { add(dN + 1, 4, `🌙 ${nm} só recebe à noite. Volte quando escurecer.`, () => game.logMsg(`🌙 Um criado de libré escura: “A senhora ${nm.split(' ').slice(-1)[0]} recebe depois do pôr do sol.”`, '#c98a9a')); continue; }
    const ti = quests.turnins(nm), of = quests.offers(nm);
    add(dN, 3.4, ti.length ? `E — Entregar: ${ti[0].name}` : of.length ? `E — Missão: ${of[0].name}` : `E — Falar com ${nm}`, () => talkTo(n));
  }
  if (!inside) {
    const gx = Math.floor(hx / T), gy = Math.floor(hz / T);
    for (const vo of vistaObjs) { const d = Math.hypot(vo.x - hx, vo.z - hz); if (d < vo.r) add(d - 1, 3.2, `E — Jogar uma moeda na Fonte da Visão${vistaSeen.has(vo.v.id) ? '' : ' ✦'}`, () => useVista(vo.v)); }
    for (const en of dgs.entrances) { const d = Math.hypot((en.x + 0.5) * T - hx, (en.y + 0.5) * T - hz), ds = en.sign ? Math.hypot(en.sign.x - hx, en.sign.z - hz) : 99, dd = Math.min(d - 1.5, ds - 1.2); if (d < 5.5 || ds < 4) add(dd, 4.2, `E — ${en.d.name}: ler a placa e escolher a dificuldade (${en.d.players})`, () => dungeonBoard(en)); }
    /* placas de estrada (Erling, 26/10: "ao apertar deveríamos ver o que elas estão dizendo, os lugares que elas apontam") */
    for (const sg of city.signs) { const sx = (sg.x + 0.5) * T, sz = (sg.y + 0.5) * T, d = Math.hypot(sx - hx, sz - hz); if (d < 3.2) add(d - 0.6, 2.8, 'E — Ler a placa da estrada', () => readSign(sg)); }
    for (const rl of city.relics) { const d = Math.hypot((rl.x + 0.5) * T - hx, (rl.y + 0.5) * T - hz); if (d < 4.5) add(d - 2, 4, knowsRelic(rl.name) ? `E — Viajar (${rl.name})` : `E — Tocar ${rl.name}`, () => touchRelic(rl.name)); }
    for (const st of STATIONS) { const d = Math.hypot(st.x - hx, st.z - hz); if (d < 5) { const I = STATION_INFO[st.v]; add(d - 1.6, 3.2, st.v === 5 ? `E — ${st.label} · bancada do Engenheiro do Mundo (engenhocas, torres, drones)` : `E — ${st.label} · ${PROF_NAME[I.prof] ?? I.prof}`, () => { keys.clear(); profs.openAt(I.prof as never); }); } }
    for (const p of nearProps(gx, gy, ['tree', 'rock', 'campfire', 'chest', 'herb'], 2)) {
      const px = (p.gx + 0.5) * T, pz = (p.gy + 0.5) * T, d = Math.hypot(px - hx, pz - hz);
      if (p.kind === 'chest') { if (!chestsOpen.has(p)) add(Math.hypot((p.gx + 0.5) * T - hx, (p.gy + 0.5) * T - hz), 3.0, 'E — Abrir baú', () => { chestsOpen.add(p); { const lid = chestLids.get(p); if (lid) { const t0 = performance.now(); const step = () => { const k = Math.min(1, (performance.now() - t0) / 450); lid.rotation.x = -1.85 * (1 - Math.pow(1 - k, 3)) - (k >= 1 ? 0 : Math.sin(k * Math.PI) * 0.12); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); } } const cx = (p.gx + 0.5) * T, cz = (p.gy + 0.5) * T, cy = heightAt(cx, cz); hero.act('combo1'); for (let i = 0; i < 24; i++) particles.spawn(cx, cy + 0.8, cz, { vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3, vz: (Math.random() - 0.5) * 3, life: 0.9, s0: 0.5, s1: 0.05, c0: 0xffffff, c1: 0xffc040, a: 1, g: 6 }); if (welcomeKit(cx, cz, cy)) return; game.logMsg('Você abriu o baú!', '#ffe08a'); game.spawnGear(cx, cz, cy, Math.max(2, game.st.lvl + 2), { magic: 2, rare: 2.2, legendary: 2.5, relic: 3 }, 2, 'magic'); game.st.gold += 10 + Math.floor(Math.random() * 25); }); }
      else if (p.kind === 'tree' && appleWant() && (applePicked.get(p) ?? 0) < performance.now()) add(d, 3.0, 'E — Colher maçãs', () => pickApples(p)); /* 09/11 (Erling: "não achamos maçã em lugar algum") */
      else if (p.kind === 'tree') { const axe = inv.tool('axe'); add(d, 3.0, axe ? `E — Cortar árvore (${Math.round(100 * (chop.get(p) ?? 0) / CHOPS)}%) · ${axe.name}` : (twigs.get(p) ?? 0) < 2 ? 'E — Juntar galhos' : 'Precisa de um machado (espaço de ferramenta)', () => { if (axe) startWork('chop', p, px, pz); else gatherTwigs(p); }); }
      else if (p.kind === 'rock') { const R = rockState(p), pick = inv.tool('pick'), vein = veinOf(p), vn = vein === 2 ? ' · veio de prata' : vein === 1 ? ' · veio de ferro' : '';
        add(d - (p.w - 1) * 0.9, 2.6 + (p.w - 1) * 0.9, R.left <= 0 ? 'Pedra esgotada — volta com os turnos' : pick ? `E — Minerar (${Math.round(100 * (1 - R.left / R.max))}%)${vn} · ${pick.name}` : (pebbles.get(p) ?? 0) < 3 ? 'E — Juntar pedras soltas' : 'Precisa de uma picareta (espaço de ferramenta)', () => { if (pick) startWork('mine', p, px, pz); else gatherPebbles(p); }); }
      else if (p.kind === 'herb') { const H = HERBS[p.variant ?? 0], sh = inv.tool('shears'); if (!sh && H.tier === 0) add(d - 0.4, 2.4, `E — Colher ${H.name} com as mãos`, () => { hero.kneel = true; hero.act('cast'); setTimeout(() => { hero.kneel = false; }, 700); inv.add(H.id, 1, true); feats.bump('herbs', 1); profs.gain('herbalista', 2); objs.removeProp(p); (p as { gone?: boolean }).gone = true; picked.push({ gx: p.gx, gy: p.gy, at: Date.now() }); savePicked(); game.logMsg(`🌼 +1 ${H.name} (com alicate rende mais)`, '#9ad0a0'); }); else add(d - 0.4, 2.4, !sh ? `${H.name} — precisa de um alicate de ervas` : sh.tier < H.tier ? `🔒 ${H.name} — precisa de alicate ${'★'.repeat(H.tier)} (o seu é ${'★'.repeat(sh.tier)})` : `E — Colher ${H.name} · ${sh.name}`, () => { if (sh && sh.tier >= H.tier) startWork('herb', p, px, pz); else game.logMsg(!sh ? '✂ Sem um alicate você só arranca a raiz e mata a planta. Morwen, a Alquimista, vende alicates.' : `✂ ${H.name} murcha se cortada com metal ruim: precisa de alicate ${'★'.repeat(H.tier)}.`, '#ff9a8a'); }); }
      else if (p.kind === 'campfire' && (inv.has('meat') || inv.has('fish'))) add(d, 3.2, `E — Assar ${inv.has('meat') ? 'carne' : 'peixe'} (${inv.count('meat') + inv.count('fish')})`, () => roastAt((p.gx + 0.5) * T, (p.gy + 0.5) * T));
    }
    for (const e of game.enemies.list) { const ec = e as typeof e & { corpse?: number; skinned?: boolean }; if (e.state !== 'dead' || !e.active || !ec.corpse || ec.skinned || !SKIN[e.type]) continue; const dC = Math.hypot(e.pos.x - hx, e.pos.z - hz); if (dC > 3.2) continue;
      const S = SKIN[e.type]!, kn = inv.tool('knife'); add(dC - 0.3, 3.0, !kn ? `${e.def.name} — precisa de uma faca de caça` : kn.tier < (S.tier ?? 1) ? `🔒 ${e.def.name} — só uma faca de prata (★★★★) atravessa esse couro` : `E — Esfolar ${e.def.name} · ${kn.name}`, () => { if (kn && kn.tier >= (S.tier ?? 1)) startWork('skin', e, e.pos.x, e.pos.z); else game.logMsg(!kn ? '🔪 Sem uma faca, a carcaça fica para os corvos.' : '🔪 A lâmina escorrega no couro do lobisomem como em pedra. Só a prata.', '#ff9a8a'); }); }
    if (inv.tool('rod') && !pescaSys.fishing) { let wt: { x: number; z: number } | null = null, wd = 99; for (let y = gy - 3; y <= gy + 3; y++) for (let x = gx - 3; x <= gx + 3; x++) if (city.map[y]?.[x] === 'water') { const d = Math.hypot((x + 0.5) * T - hx, (y + 0.5) * T - hz); if (d < wd) { wd = d; wt = { x: (x + 0.5) * T, z: (y + 0.5) * T }; } } if (wt && !swimmingNow) add(wd + 1, 9, 'E — Pescar', () => { startFishing(fishTarget(hx, hz) ?? wt!); }); }
  } else if (inside.prop.variant === 5 || inside.prop.variant === 4) add(Math.hypot(hx - IX - inside.int.W / 2, hz - IZ - inside.int.D * (inside.prop.variant === 5 ? 0.5 : 0.3)), 3.4, inside.prop.variant === 5 ? 'E — Comprar equipamentos' : 'E — Balcão da taverna', () => inv.openShop(inside!.prop.variant === 5 ? 'armeiro' : 'mercador'));
  if (dgSys.spirit) add(Math.hypot(hx - dgSys.spirit.x, hz - dgSys.spirit.z) - 0.6, 3.2, 'E — Falar com Irmã Ysolde', talkSpirit);
  if (!inside) for (const p of otherDecor.keys()) { const hd = houseDoor(p.variant ?? 0, p.w * T, p.h * T), dx = p.gx * T + hd.x, dz = p.gy * T + hd.z + 0.9; add(Math.hypot(hx - dx, hz - dz), 2.2, `E — Visitar a ${p.label ?? 'casa'}`, () => enterHouse(p)); }
  { const dn = decoNear(hx, hz); if (dn) { const it = obras.decor[dn.k]; add(dn.d, 1.5, `E — Guardar ${DECOR[it.id]?.icon ?? ''} ${DECOR[it.id]?.name ?? ''} na mochila`, () => decoPickup(dn.k)); } }
  if (inside && inside.prop === construcaoSys.homeProp) { const hm = (inside.int as typeof inside.int & { home?: { bed: { x: number; z: number }; box: { x: number; z: number } } }).home; if (hm) { const lx0 = hx - IX, lz0 = hz - IZ;
      add(Math.hypot(lx0 - hm.bed.x, lz0 - hm.bed.z) - 0.4, 2.2, 'E — Deitar e descansar (recupera a vida)', () => { hero.kneel = true; game.logMsg('🛏 Você se deita um pouco. A casa é sua; aqui ninguém incomoda.', '#ffe08a'); setTimeout(() => { hero.kneel = false; game.st.hp = game.st.hpMax; game.st.mp = game.st.mpMax; game.logMsg('🛏 Descansado: vida e magia cheias.', '#9affb0'); }, 1800); });
      add(Math.hypot(lx0 - hm.box.x, lz0 - hm.box.z) - 0.3, 2.2, 'E — Caixa de correio da casa (guardar itens)', () => inv.openVault()); } }
  if (inside) { const ins = inside; const lx = hx - IX, lz = hz - IZ; if (ins.castle === undefined || ins.castle === 2) add(Math.hypot(lx - ins.int.W / 2, lz - (ins.canopy ? ins.int.D / 2 + 20 : ins.int.D)), 2.4, ins.crypt && ins.crypt > 1 ? 'E — Subir' : ins.dg ? 'E — Voltar à superfície' : 'E — Sair', exitHouse);
  if (ins.castle !== undefined && casteloSys.castleInt) { const F = ins.castle, ci = casteloSys.castleInt;
    if (ci.up) add(Math.hypot(lx - ci.up.x, lz - ci.up.z), 3.0, `E — Subir a escada (${CASTLE_FLOORS[F + 1]})`, () => enterCastle(F + 1, 'down'));
    if (ci.down) add(Math.hypot(lx - ci.down.x, lz - ci.down.z), 3.0, `E — Descer a escada (${CASTLE_FLOORS[F - 1]})`, () => enterCastle(F - 1, 'up'));
    if (ci.well) add(Math.hypot(lx - ci.well.x, lz - ci.well.z) - 1.2, 2.6, 'E — Olhar o Poço da Visão da Corte', () => { chat.sys('O sangue no poço mostra a colina inteira: cada morcego, cada caçador, cada convidado que sobe o caracol.'); });
    if (ci.throne) add(Math.hypot(lx - ci.throne.x, lz - ci.throne.z), 3.2, 'E — Ajoelhar diante do Conde Vladislav', () => { const vam = profile?.path === 'vam'; chat.sys(vam ? 'Vladislav: "Levante-se. A Corte não ajoelha; a Corte espera. Quando a sua sede for educada, a piscina será sua."' : 'Vladislav: "Um vivo, no meu salão. Ou você tem muita coragem, ou alguém lá embaixo dormiu no posto. Fale com Lady Mirela, em Corvoscuro, se quer pertencer à noite."'); });
  }
  { /* 10/11 A BIGORNA MOLHADA (Erling: "comprar bebidas e beber, reservar uma mesa para amigos"): sentar em qualquer banco ou cadeira livre e
       reservar a mesa redonda para o grupo (a placa mostra o seu nome; vale uma hora) */
    const IN = ins.int; if (IN.seats?.length && !casteloSys.sitting) { let bs: (typeof IN.seats)[number] | null = null, bd = 9; for (const s0 of IN.seats) { const d0 = Math.hypot(lx - s0.x, lz - s0.z); if (d0 < bd && !npcSys.npcs.some((n) => n.def.seat && Math.hypot(n.pos.x - IX - s0.x, n.pos.z - IZ - s0.z) < 0.4)) { bd = d0; bs = s0; } }
      if (bs) { const s0 = bs; add(bd + 0.3, 1.3, 'E — Sentar', () => { casteloSys.sitting = { x: (IX + s0.x) / T, y: (IZ + s0.z) / T, yaw: s0.yaw, h: s0.h }; game.logMsg('🍺 Você puxa o banco e senta. A Hildigunn, no balcão, vende chope e hidromel: compre e beba aqui mesmo.', '#ffe08a'); }); } }
    if (IN.reserveAt) { const rv = tavReserve(), me = profile?.name || 'Caminhante', mine = !!rv && rv.by === me, key = rv ? rv.by : '';
      if (IN.reserveSign && IN.reserveSign.userData.k !== key) { IN.reserveSign.userData.k = key; IN.reserveLabel?.(rv ? 'Reservada' : 'Mesa livre', rv ? `${rv.by} e amigos` : 'E para reservar'); }
      const dR = Math.hypot(lx - IN.reserveAt.x, lz - IN.reserveAt.z) - 1.2; if (dR < 2.5) add(dR, 1.8, mine ? `🍺 Mesa reservada para você e seus amigos (mais ${Math.max(1, Math.ceil((rv!.until - Date.now()) / 60000))} min)` : rv ? `🍺 Mesa reservada por ${rv.by}` : 'E — Reservar a mesa redonda para o seu grupo (20 moedas, uma hora)', () => {
        if (rv) return; if (game.st.gold < 20) { game.logMsg('A Hildigunn olha a sua bolsa: "Vinte moedas. Sem vinte, a mesa é de quem chegar."', '#ff9a8a'); return; }
        game.st.gold -= 20; try { localStorage.setItem('karmika.tav.mesa', JSON.stringify({ by: me, until: Date.now() + 3600e3 })); } catch { /* */ } audio.coins?.(1); game.logMsg('🍺 Mesa redonda reservada por uma hora. A placa tem o seu nome: chame os amigos.', '#ffe08a'); }); } }
  if (ins.dg) dgs.interactions(hx, hz, add);
  if (ins.crypt && catedralSys.cryptInt) {
    const open = bloodFull(ins.crypt) || localStorage.getItem('karmika.crypt.done') === '1', f = ins.crypt;
    if (catedralSys.cryptInt.vessel && f <= 4) add(Math.hypot(hx - IX - catedralSys.cryptInt.vessel.x, hz - IZ - catedralSys.cryptInt.vessel.z) - 2, 1.6, open ? '🩸 Vasilhame do Sacrifício — cheio' : `🩸 Vasilhame do Sacrifício — ${Math.floor(catedralSys.blood[f - 1])} / ${BLOOD_NEED[f - 1]} litros`, () => drawBloodHud());
    if (catedralSys.cryptInt.stairs && f < 4) { const sx = IX + catedralSys.cryptInt.stairs.x, sz = IZ + catedralSys.cryptInt.stairs.z; add(Math.hypot(hx - sx, hz - sz), 3.4, open ? `E — Descer a escada em espiral (andar ${f + 1})` : `🩸 Escada em espiral — a taça pede ${BLOOD_NEED[f - 1] - Math.floor(catedralSys.blood[f - 1])} litros de sangue`, () => { if (open) enterCrypt(f + 1, ins.prop); }); }
    if (catedralSys.cryptInt.door && f === 4) { const dx = IX + catedralSys.cryptInt.door.x, dz = IZ + catedralSys.cryptInt.door.z, have = SEALS.filter((id) => inv.has(id)).length; add(Math.hypot(hx - dx, hz - dz), 3.4, have < 3 ? `🔒 Porta do Bispo — ${have}/3 selos (caem dos elites dos andares 2, 3 e 4)` : !open ? `🩸 Porta do Bispo — a taça ainda pede ${BLOOD_NEED[3] - Math.floor(catedralSys.blood[3])} litros` : 'E — Quebrar os três selos e abrir a Porta do Bispo', () => { if (have >= 3 && open) { catedralSys.cryptInt!.door!.open(); audio.boom(); game.logMsg('✝ Os selos estalam e a porta se abre. Além dela, o Bispo Caído.', '#ffd24a'); setTimeout(() => enterCrypt(5, ins.prop), 1400); } }); } }
    return best; }
  if (CASTLE_DOOR) add(Math.max(0, Math.hypot(hx - CASTLE_DOOR.x, hz - CASTLE_DOOR.z) - 1.0) + 0.01, 3.0, 'E — Empurrar o portão do Castelo do Conde', () => enterCastle(2));
  { const S = (game as unknown as { sentryAt(x?: number, z?: number): { x: number; z: number; id: string; left: number } | null }).sentryAt(hx, hz); if (S && !inside) { const dS = Math.hypot(hx - S.x, hz - S.z); if (dS < 3) add(dS - 0.4, 2.6, `E — Desmontar Bartolomeu e guardar na mochila (o relógio para; sobra ${Math.round(S.left / 60000)} min)`, () => { const id = (game as unknown as { packSentry(): string | null }).packSentry(); if (id) inv.add(id, 1, true); }); } }
  { const sc = obras.siteCenter(); if (sc && !inside) { const dS = Math.hypot(hx - sc.x, hz - sc.z); const fT = (x: number) => x.toFixed(1).replace('.', ',');
      if (dS < 5) add(dS - 0.5, 4.5, obras.working ? `E — Parar de trabalhar (${fT(sc.done)} / ${sc.need} turnos)` : `E — Trabalhar na obra (${fT(sc.done)} / ${sc.need} turnos)${sc.robots ? ` · ${sc.robots > 1 ? `${sc.robots} Ajudantes trabalhando` : 'o Ajudante está trabalhando'}` : ''}${sc.robots && !sc.covered ? ' · ⚠ sem torre' : ''}${obras.home && !obras.home.contract ? ' · 📜 sem Contrato (robôs não entram)' : ''}`, () => obras.toggleWork());
      const RB = obras.robotAt(hx, hz); if (RB) { const dR = Math.hypot(hx - RB.x, hz - RB.z); add(dR - 0.45, 2.7, RB.dead ? 'E — Recolher a sucata do Ajudante' : `E — Desmontar o Ajudante Mk ${['I', 'II', 'III'][RB.tier]} e guardar na mochila (sobra ${Math.round(RB.left / 60000)} min)`, () => { const r = obras.packRobot(RB.slot); if (r) { inv.add(r.id, 1, true); robotLeftPush(r.id, r.left); game.logMsg(`🦾 Ajudante guardado na mochila: ainda tem ${Math.round(r.left / 60000)} min de trabalho.`, '#ffe08a'); } }); } } }
  { const dr = obras.door(); if (dr && construcaoSys.homeProp && !inside) { const dD = Math.hypot(hx - dr.x, hz - dr.z); if (dD < 2.6) add(dD - 0.6, 2.4, `E — Entrar na ${construcaoSys.homeProp.label}`, () => enterHouse(construcaoSys.homeProp!)); }
    const sa = obras.signAt(); if (sa && !inside && obras.home && !obras.home.signed) { const dP = Math.hypot(hx - sa.x, hz - sa.z); if (dP < 2.8) add(dP - 0.4, 2.6, 'E — Pendurar a placa da casa', () => obras.sign()); } }
  if (HALL_GATE) { const gx0 = (HALL_GATE.gx + HALL_GATE.w / 2 + 0.5) * T, gz0 = (HALL_GATE.gy + 7.6) * T; add(Math.max(0, Math.hypot(hx - gx0, hz - gz0) - 1.2) + 0.01, 3.0, 'E — Abrir a porta de ferro e entrar no Grande Salão', () => enterHall(HALL_GATE)); }
  if (TREE_GATE) { const gx0 = (TREE_GATE.gx + TREE_GATE.w / 2 + 0.5) * T, gz0 = (TREE_GATE.gy + TREE_GATE.h / 2 + 0.5) * T + Math.min(TREE_GATE.w, TREE_GATE.h) * T * 0.25 + 1.2; add(Math.max(0, Math.hypot(hx - gx0, hz - gz0) - 1.4) + 0.01, 3.2, 'E — Entrar na Passagem da Raiz e subir à Copa', () => dgSys.enterCanopy(TREE_GATE)); }
  for (const p of NI) if (p.kind === 'house' || p.kind === 'temple' || p.kind === 'church') { const dd = DOOR_OF.get(p); if (!dd) continue; const catLocked = p.kind === 'church' && p.variant === 2 && state.night < 0.5; add(Math.max(0, Math.hypot(hx - dd.x, hz - dd.z) - (p.kind === 'house' ? 0.6 : 1.4)) + 0.01, 2.8, catLocked ? '🔒 As portas da Catedral só se abrem à noite' : `E — Entrar${p.kind === 'temple' ? ' no Templo' : p.kind === 'church' ? (p.variant === 2 ? ' na Catedral Abandonada' : ' na Igreja Abandonada') : p.variant === 4 ? ' na Taverna' : p.variant === 5 ? ' na Loja do Armeiro' : ''}`, () => { if (catLocked) { game.logMsg('🌙 As portas de ferro não cedem. Dizem que a Catedral só respira depois que o sol morre.', '#c8b8ff'); return; } if (p.kind === 'church' && p.variant === 2) enterCrypt(1, p); else enterHouse(p); }); }
  if (!casteloSys.sitting) for (const p of NI) if (p.kind === 'fountain') { const fx = (p.gx + p.w / 2) * T, fz = (p.gy + p.h / 2) * T, isHome = Math.abs(larSys.home.x - (p.gx + p.h / 2)) < 0.6 && Math.abs(larSys.home.y - (p.gy + p.h + 1)) < 0.6;
    /* a fonte que também é Fonte da Visão: E joga a moeda (a animação e a história voltam); Shift+E torna a fonte o seu lar */
    const vo = vistaObjs.find((q) => Math.hypot(q.x - fx, q.z - fz) < 4); const df = Math.hypot(fx - hx, fz - hz) - p.w;
    if (vo) { add(df - 0.2, 2.8, `E — Jogar uma moeda na Fonte da Visão${vistaSeen.has(vo.v.id) ? '' : ' ✦'}${isHome ? ' · ⛲ sua fonte-lar' : ' · Shift+E: tornar meu lar'}`, () => { if (cinemaSys.shiftHeld && !isHome) setHome(p); else useVista(vo.v); }); continue; }
    add(df, 2.6, isHome ? '⛲ Esta é sua fonte-lar' : 'E — Tornar esta fonte meu lar', () => { if (!isHome) setHome(p); }); }
  for (const p of NI) if (p.kind === 'vault') { const bx = (p.gx + 0.5) * T, bz = (p.gy + 0.5) * T; add(Math.hypot(bx - hx, bz - hz), 2.2, 'E — Baú do Caminhante', () => inv.openVault()); }
  for (const p of NI) if (p.kind === 'mailbox') { const bx = (p.gx + 0.5) * T, bz = (p.gy + 0.5) * T; const u = mail.unread; add(Math.hypot(bx - hx, bz - hz), 2.2, `E — Caixa de Correio${u ? ` (${u} nova${u > 1 ? 's' : ''})` : ''}`, () => mail.open()); }
  /* 06/11: as peças da guilda no terreno — o Quadro abre a Visão da guilda, o Baú abre o baú (guardar e tirar só perto dele) */
  for (const p of NI) if (p.kind === 'gboard' || p.kind === 'gchest') { const bx = (p.gx + 0.5) * T, bz = (p.gy + 0.5) * T, isB = p.kind === 'gboard'; add(Math.hypot(bx - hx, bz - hz), 2.8, isB ? 'E — Ler o Quadro da Guilda' : 'E — Abrir o Baú da Guilda', () => social.openGuildTab(isB ? 'visao' : 'bau')); }
  for (const p of NI) if (p.kind === 'noticeboard') { const bx = (p.gx + 0.5) * T, bz = (p.gy + 0.5) * T; add(Math.hypot(bx - hx, bz - hz), 2.6, 'E — Ler o Quadro de Avisos', () => quests.openBoard()); }
  if (!casteloSys.sitting) for (const p of NI) if (p.kind === 'bench') { const bx = (p.gx + 0.5) * T, bz = (p.gy + 0.5) * T; add(Math.hypot(bx - hx, bz - hz), 2.2, 'E — Sentar', () => { const fp = city.props.find((q) => q.kind === 'fountain')!; casteloSys.sitting = benchSeat(bx, bz, fp); game.logMsg('Você se senta e descansa...', '#c8d8f0'); }); }
  return best;
}
let swimmingNow = false, wadeAcc = 0; const waterClip = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -WL + 0.02)];
/* lenhador: 30 golpes de machado por árvore; cada golpe rende madeira; o toco rebrota por turnos (pequena → média → grande) */
const CHOPS = 30; // árvore de verdade: muitas machadadas
type Regrow = { gx: number; gy: number; height: number; variant?: number; at: number; stage: number; prop?: (typeof city.props)[number] };
const regrow: Regrow[] = (() => { try { return JSON.parse(localStorage.getItem('karmika.regrow.v1') || '[]'); } catch { return []; } })();
const saveRegrow = () => localStorage.setItem('karmika.regrow.v1', JSON.stringify(regrow.map(({ prop: _p, ...r }) => r)));
const TURN_MS = 30 * 60 * 1000; // um turno do dia = meia hora real
function updateRegrow() {
  const now = Date.now();
  for (let i = regrow.length - 1; i >= 0; i--) {
    const r = regrow[i], stage = Math.min(3, Math.floor((now - r.at) / TURN_MS)); // 0 toco, 1 broto, 2 média, 3 grande
    if (stage === r.stage && (stage === 0 || r.prop)) continue;
    if (r.prop) objs.removeProp(r.prop); r.prop = undefined; r.stage = stage;
    if (stage >= 1) { const k = stage === 1 ? 0.35 : stage === 2 ? 0.65 : 1; const np = { kind: 'tree' as const, gx: r.gx, gy: r.gy, w: 1, h: 1, height: r.height * k, wall: 0x5a3a1c, roof: 0x3f7a3a, variant: r.variant }; objs.addProp(np); r.prop = np; }
    if (stage >= 3) { city.map[r.gy][r.gx] = 'tree'; regrow.splice(i, 1); }
  }
  saveRegrow();
}
/* pedreira: toda rocha pode ser quebrada; quanto maior, mais golpes e MUITO mais pedra (rocha grande ≈ 40–60);
   esgotada, se refaz em um turno do dia */
type RockSt = { left: number; max: number; at: number };
const rocks = new Map<object, RockSt>();
function rockState(p: (typeof city.props)[number]): RockSt {
  let r = rocks.get(p); const size = Math.max(1, p.w * p.h), max = Math.min(45, 14 + Math.round(size * 5)); // rocha de verdade: muitas pancadas
  if (!r) { r = { left: max, max, at: 0 }; rocks.set(p, r); }
  if (r.left <= 0 && Date.now() - r.at > TURN_MS) { r.left = r.max; }
  return r;
}
/* OFÍCIOS: machado, picareta, faca e alicate — cortar, minerar, esfolar, colher ervas; galhos e pedrinhas; ervas colhidas e o brilho delas. Saiu do main.ts (02/11). → sistemas/oficios.ts */
export interface OficiosCtx {
  readonly twigs: Widen<typeof twigs>;
  readonly game: Widen<typeof game>;
  readonly hero: Hero3D;
  readonly inv: Widen<typeof inv>;
  readonly combatMode: Widen<typeof entradaSys.combatMode>;
  readonly setCombat: typeof setCombat;
  readonly riding: Widen<typeof compSys.riding>;
  readonly setRiding: typeof setRiding;
  readonly CHOPS: Widen<typeof CHOPS>;
  readonly rockState: typeof rockState;
  readonly city: Widen<typeof city>;
  readonly chop: Widen<typeof chop>;
  readonly state: Widen<typeof state>;
  readonly fishing: { t: number; bite: number; at: { x: number; z: number }; total: number } | null;
  readonly syncGear: typeof syncGear;
  readonly keys: Widen<typeof keys>;
  readonly inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string; /** andar do Castelo do Conde (0 = catacumbas … 5 = salão do Conde) */ castle?: number; hall?: boolean; /** 09/11: a Copa da Árvore-Mãe (Lithendel) */ canopy?: boolean } | null;
  readonly kitRace: Widen<typeof kitRace>;
  readonly profs: Widen<typeof profs>;
  readonly audio: Widen<typeof audio>;
  readonly particles: Widen<typeof particles>;
  readonly objs: Widen<typeof objs>;
  readonly regrow: Widen<typeof regrow>;
  readonly saveRegrow: Widen<typeof saveRegrow>;
  readonly feats: Widen<typeof feats>;
  readonly tileIdx: Widen<typeof tileIdx>;
  readonly TURN_MS: Widen<typeof TURN_MS>;
  readonly nearProps: typeof nearProps;
  readonly findInter: typeof findInter;
}
var oficiosSys: ReturnType<typeof createOficios>; /* criado aqui, na ordem de antes; se alguém chamar uma função dele antes, nasce na hora */
function mk_oficiosSys() { return createOficios({ get twigs() { return twigs; }, get game() { return game; }, get hero() { return hero; }, get inv() { return inv; }, get combatMode() { return entradaSys.combatMode; }, get setCombat() { return setCombat; }, get riding() { return compSys.riding; }, get setRiding() { return setRiding; }, get CHOPS() { return CHOPS; }, get rockState() { return rockState; }, get city() { return city; }, get chop() { return chop; }, get state() { return state; }, get fishing() { return pescaSys.fishing; }, get syncGear() { return syncGear; }, get keys() { return keys; }, get inside() { return inside; }, get kitRace() { return kitRace; }, get profs() { return profs; }, get audio() { return audio; }, get particles() { return particles; }, get objs() { return objs; }, get regrow() { return regrow; }, get saveRegrow() { return saveRegrow; }, get feats() { return feats; }, get tileIdx() { return tileIdx; }, get TURN_MS() { return TURN_MS; }, get nearProps() { return nearProps; }, get findInter() { return findInter; } }); }
oficiosSys ??= mk_oficiosSys();
const { WORK, SKIN, pebbles, HERBS, picked, savePicked } = oficiosSys;
function interact(...a: Parameters<ReturnType<typeof createOficios>['interact']>): ReturnType<ReturnType<typeof createOficios>['interact']> { return (oficiosSys ??= mk_oficiosSys()).interact(...a); }
function startWork(...a: Parameters<ReturnType<typeof createOficios>['startWork']>): ReturnType<ReturnType<typeof createOficios>['startWork']> { return (oficiosSys ??= mk_oficiosSys()).startWork(...a); }
/* 09/11: maçã se COLHE com a mão — enquanto alguma missão pede maçã, toda árvore oferece "Colher maçãs" (1 a 2; a mesma árvore dá de novo em 2 min) */
const applePicked = new WeakMap<object, number>();
function appleWant() { for (const id of Object.keys(quests.q.active)) { const d = quests.def(id); for (const o of d?.objs ?? []) if (o.kind === 'collect' && o.item === 'apple' && inv.count('apple') < o.n) return true; } return false; }
function pickApples(p: object) { applePicked.set(p, performance.now() + 120000); hero.act('herb'); const n = 1 + (Math.random() < 0.5 ? 1 : 0); inv.add('apple', n); game.logMsg(`🍎 Você sacode um galho baixo e colhe ${n === 1 ? 'uma maçã' : 'duas maçãs'}.`, '#d8c890'); }
function gatherTwigs(...a: Parameters<ReturnType<typeof createOficios>['gatherTwigs']>): ReturnType<ReturnType<typeof createOficios>['gatherTwigs']> { return (oficiosSys ??= mk_oficiosSys()).gatherTwigs(...a); }
function gatherPebbles(...a: Parameters<ReturnType<typeof createOficios>['gatherPebbles']>): ReturnType<ReturnType<typeof createOficios>['gatherPebbles']> { return (oficiosSys ??= mk_oficiosSys()).gatherPebbles(...a); }
function updateWork(...a: Parameters<ReturnType<typeof createOficios>['updateWork']>): ReturnType<ReturnType<typeof createOficios>['updateWork']> { return (oficiosSys ??= mk_oficiosSys()).updateWork(...a); }
function herbSparkle(...a: Parameters<ReturnType<typeof createOficios>['herbSparkle']>): ReturnType<ReturnType<typeof createOficios>['herbSparkle']> { return (oficiosSys ??= mk_oficiosSys()).herbSparkle(...a); }
function updatePicked(...a: Parameters<ReturnType<typeof createOficios>['updatePicked']>): ReturnType<ReturnType<typeof createOficios>['updatePicked']> { return (oficiosSys ??= mk_oficiosSys()).updatePicked(...a); }

// árvores cortadas em sessões anteriores: tira a original do mundo e deixa o rebrote cuidar
for (const r of regrow) { const p = city.props.find((q) => q.kind === 'tree' && q.gx === r.gx && q.gy === r.gy); if (p) { objs.removeProp(p); city.map[r.gy][r.gx] = 'grass'; } r.prop = undefined; r.stage = -1; }
let hintT = 0, regrowT = 1, stamWarnT = 0;

/* vagalumes e fagulhas: raros no mundo (poupam o hardware), um pouco mais nas matas e pântanos, muitos perto das terras élficas */
let elfK = 0, forestK = 0, qmarkT = 0, featT = 0;
function featKill(t: EnemyType, e: { def: { lvl?: number; name: string } }) {
  feats.bump('kills'); if (t === 'rat') feats.bump('k_rat'); if (t === 'wolf' || t === 'frostwolf') feats.bump('k_wolves'); if (t === 'imp') feats.bump('k_imp'); if (t === 'skeleton' || t === 'zombie' || t === 'ghoul') feats.bump('k_undead'); if (t === 'werewolf') feats.bump('k_werewolf');
    if ((e.def as { elite?: number }).elite || t === 'prince' || t === 'tormentor' || t === 'treant' || t === 'werewolf') feats.bump('elites'); /* 06/11: todo elite conta (feito e missão da guilda) */ if (e.def.name === 'Bispo Caído' || e.def.name === 'Sacerdote Maldito') feats.bump('k_boss_cat');
  const up = (e.def.lvl ?? 1) - game.st.lvl; if (up >= 5) feats.bump('k_up5'); if (up >= 10) feats.bump('k_up10');
}
/** a cada segundo: lugares visitados e marcas que se medem (nível, ouro, relíquias…) */
function featsTick(dt: number) { featT -= dt; if (featT > 0) return; featT = 1; const h0 = hereT();
  if (!inside) { const rg = regionAt(h0.x, h0.y); feats.mark('reg', rg.name, 'regions'); feats.mark('rv', rg.name, 'r_' + rg.name); for (const st of city.settlements) if (Math.hypot(h0.x - st.x, h0.y - st.y) < st.radius) feats.mark('vil', st.name, 'villages'); }
  feats.max('relics', relicsKnown.size); feats.max('vistas', vistaSeen.size); feats.max('level', game.st.lvl); feats.max('quests', quests.q.done.length); feats.max('goldmax', game.st.gold);
  feats.max('built', build.built.length); feats.max('darkness', -Math.round(state.karma)); feats.max('choices', compendium.list().length);
  feats.max('tools2', (['axe', 'pick', 'knife', 'shears', 'rod'] as const).filter((k) => (inv.tool(k)?.tier ?? 0) >= 2).length);
  feats.max('eqslots', Object.values(inv.eq).filter(Boolean).length); feats.max('bags', (inv as unknown as { bagCount?: () => number }).bagCount?.() ?? 0); feats.max('pets', inv.has('pet_fox') || inv.has('pet_pup') ? 1 : 0);
  feats.tick(); }
/** anel dourado sob os bichos que alguma missão ativa pede (matar ou caçar para juntar couro, carne, garra…) */
function updateQuestRings(dt: number) { qmarkT -= dt; if (qmarkT > 0) return; qmarkT = 0.5; const want = new Set<string>();
  for (const a of Object.values(quests.q.active) as { prog: number[]; def?: { objs: { kind: string; type?: string; item?: string; n: number }[] } }[]) { const objs = a.def?.objs ?? []; objs.forEach((o, i) => { if ((a.prog[i] ?? 0) >= o.n) return; if (o.kind === 'kill' && o.type) want.add(o.type); if (o.kind === 'collect' && o.item) { const src = DROP_SRC[o.item]; if (Array.isArray(src)) for (const t of src) want.add(t); } }); }
  for (const e of game.enemies.list) { const ee = e as typeof e & { quest?: boolean; qring?: THREE.Mesh }; ee.quest = want.has(e.type) && e.alive; if (ee.qring) ee.qring.visible = false; /* 05/11 (Erling: "não precisa do círculo amarelo; um detalhe em cima do nome, o nome brilhando"): o anel saiu — o aviso agora é o selo dourado sobre o nome (.ebar.quest) */ } }
const fireflyK = () => 0.05 + 0.12 * forestK + 0.7 * elfK;
/** para onde o Olho olha agora (ver hud.ts): inimigo que vem para cima > mouse que acabou de mexer > para onde o herói anda > NPC perto > nada (passeia) */
let mouseMovedT = 0, eyeNpcT = 0, eyeNpc: THREE.Vector3 | null = null;
function eyeGaze(): { x: number; y: number; kind: 'threat' | 'mouse' | 'move' | 'npc' } | null {
  const hp = heroPosNow(), c = new THREE.Vector3(hp.x, heroY + 1, hp.z).project(camera);
  const rel = (w: THREE.Vector3) => { const v = w.clone().project(camera); return { x: (v.x - c.x) * 2.2, y: -(v.y - c.y) * 2.2 }; };
  let best: THREE.Vector3 | null = null, bd = 14;
  for (const e of game.enemies.list) { if (!e.alive || !e.active || e.def.passive || (e as typeof e & { ally?: boolean }).ally) continue; if (e.state !== 'chase' && e.state !== 'windup' && e.state !== 'recover') continue; const d = Math.hypot(e.pos.x - hp.x, e.pos.z - hp.z); if (d < bd) { bd = d; best = e.pos; } }
  if (best) return { ...rel(best.clone().setY(best.y + 1)), kind: 'threat' };
  if (performance.now() - mouseMovedT < 1400) return { ...rel(new THREE.Vector3(mouse.x, heroY, mouse.z)), kind: 'mouse' };
  if (state.moving) { const a = hero.facing; return { ...rel(new THREE.Vector3(hp.x + Math.sin(a) * 6, heroY, hp.z + Math.cos(a) * 6)), kind: 'move' }; }
  if (performance.now() > eyeNpcT) { eyeNpcT = performance.now() + 4000 + Math.random() * 5000; eyeNpc = null; const ns = npcSys.npcs.filter((n) => n.hero.root.visible && Math.hypot(n.pos.x - hp.x, n.pos.z - hp.z) < 12); if (ns.length && Math.random() < 0.6) eyeNpc = ns[Math.floor(Math.random() * ns.length)].pos; }
  if (eyeNpc && performance.now() < eyeNpcT - 2500) return { ...rel(eyeNpc.clone().setY(eyeNpc.y + 1.6)), kind: 'npc' };
  return null;
}
/* DESEMPENHO (25/10): a cena tinha ~70 luzes pontuais acesas (tochas, janelas, braseiros, lanternas). No WebGL cada pixel
   iluminado calcula TODAS as luzes, nas duas passadas do desenho — era isso que segurava o FPS em máquina forte.
   Agora só as LUZES_ATIVAS mais perto da câmera ficam acesas; o número é sempre o mesmo (nada de recompilar sombreador)
   e quem está longe nem se nota, porque a luz dela já não chegava na tela. A luz do herói e as de magia ficam sempre. */
const LUZES_ATIVAS = 14;
let poolT = 0, poolList: THREE.PointLight[] = [], poolScanT = 0;
function lightPool(dt: number) {
  poolScanT -= dt; if (poolScanT <= 0) { poolScanT = 1.5; poolList = []; scene.traverse((o) => { const l = o as THREE.PointLight; if (l.isPointLight && l !== lantern && !(l.userData as { keep?: boolean; gpuPool?: boolean }).keep && !(l.userData as { gpuPool?: boolean }).gpuPool && !(l.userData as { fixedLight?: boolean }).fixedLight) poolList.push(l); /* 03/11: as 24 luzes fixas do WebGPU ficam fora deste rodízio — apagar uma delas mudava o conjunto de luzes e remontava TODOS os materiais (tela preta de 1 s) */
      /* sombra só para o que tem tamanho de fazer sombra: capim, flor, pedrinha e vela não entram no mapa de sombras (eram milhares) */
      const m = o as THREE.Mesh; if (m.isMesh && m.castShadow && !(m.userData as { shadowChecked?: boolean }).shadowChecked) { (m.userData as { shadowChecked?: boolean }).shadowChecked = true; const g = m.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); const sc = Math.max(m.scale.x, m.scale.y, m.scale.z); if ((g.boundingSphere?.radius ?? 1) * sc < 0.28 && !(m as unknown as { isSkinnedMesh?: boolean }).isSkinnedMesh) m.castShadow = false; } }); }
  poolT -= dt; if (poolT > 0) return; poolT = 0.2;
  const cxp = camX, czp = camZ, v = new THREE.Vector3();
  const scored = poolList.map((l) => { l.getWorldPosition(v); let up = true; for (let p: THREE.Object3D | null = l.parent; p; p = p.parent) if (!p.visible) { up = false; break; } return { l, d: up ? Math.hypot(v.x - cxp, v.z - czp) - l.intensity * 0.05 : 1e9 }; }).sort((a, b) => a.d - b.d);
  scored.forEach((e, i) => { const on = i < LUZES_ATIVAS; if (e.l.visible !== on) e.l.visible = on; });
}
let lastFrameErr = '';
/* 26/10 (Erling: "não tem por que o jogo não rodar a mais de 200 fps numa 3080 Ti"): limite de FPS escolhido nas opções (o app
   desliga o vsync do Chromium) e um medidor que separa o tempo do quadro em CPU (lógica, desenho) e GPU — para saber onde apertar */
let capLast = 0; const perf = { cpu: 0, draw: 0, gpu: -1, n: 0, cpuS: 0, drawS: 0, gpuS: 0, gpuN: 0 };
const glT = renderer.getContext() as WebGL2RenderingContext, tq = (() => { try { return glT.getExtension('EXT_disjoint_timer_query_webgl2') as { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null; } catch { return null; } })();
let tqPend: WebGLQuery | null = null, tqOpen: WebGLQuery | null = null;
function gpuBegin() { if (!tq || tqPend || tqOpen) return; const q = glT.createQuery(); if (!q) return; glT.beginQuery(tq.TIME_ELAPSED_EXT, q); tqOpen = q; }
function gpuEnd() { if (!tq || !tqOpen) return; glT.endQuery(tq.TIME_ELAPSED_EXT); tqPend = tqOpen; tqOpen = null; }
function gpuPoll() { if (!tq || !tqPend) return; if (!glT.getQueryParameter(tqPend, glT.QUERY_RESULT_AVAILABLE)) return; const dis = glT.getParameter(tq.GPU_DISJOINT_EXT); if (!dis) { perf.gpuS += glT.getQueryParameter(tqPend, glT.QUERY_RESULT) / 1e6; perf.gpuN++; } glT.deleteQuery(tqPend); tqPend = null; }
function frame() {
  requestAnimationFrame(frame);
  const nowF = performance.now(); if (opts.cap > 0 && nowF - capLast < 1000 / opts.cap - 0.4) return; capLast = nowF;
  if (socialSys.bootFrames < 12 && ++socialSys.bootFrames === 12) hideBoot(); // o mundo já desenhou alguns quadros de verdade: pode tirar a abertura
  gpuPoll(); const c0 = performance.now();
  try { frameBody(); } catch (e) { const m = String((e as Error).stack || e); if (gpuImpl) gpuFail(m); else if (m !== lastFrameErr) { lastFrameErr = m; kshow('ERRO no frame: ' + m); console.error(e); } } /* nunca travar: um erro num quadro não para o mundo */
  perf.cpuS += performance.now() - c0; perf.n++;
}
declare const __BUILD_ID__: string;
const __BUILD__ = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';
let fpsN = 0, fpsT = 0, poiTick = -1, lastFps = 0, gapPrev = 0;
/* medidor por seção do quadro (/perf no chat): quanto da CPU vai para cada parte */
let PMavg: Record<string, number> = {}, pmLast = 0, pmFrames = 0;
/* 09/11 (revisão de FPS): além da média, guarda as seções do PIOR quadro de cada janela — é o tranco que o jogador sente */
let PMF: Record<string, number> = {}, pmWorst: { t: number; s: Record<string, number> } = { t: 0, s: {} }, pmWorstShown: { t: number; s: Record<string, number> } = { t: 0, s: {} };
const pm = (k: string) => { const n = performance.now(), d = n - pmLast; PM[k] = (PM[k] ?? 0) + d; PMF[k] = (PMF[k] ?? 0) + d; pmLast = n; };
function pmFrameEnd() { let t = 0; for (const k in PMF) t += PMF[k]; if (t > pmWorst.t) pmWorst = { t, s: PMF }; PMF = {}; }
(window as unknown as { __worst?: () => string }).__worst = () => { const w = pmWorstShown.t > pmWorst.t ? pmWorstShown : pmWorst; return `pior quadro ${w.t.toFixed(1)} ms: ` + Object.entries(w.s).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(' · '); };
function pmFlush() { pmWorstShown = pmWorst; pmWorst = { t: 0, s: {} }; const N = Math.max(1, pmFrames); PMavg = Object.fromEntries(Object.entries(PM).map(([k, v]) => [k, v / N])); for (const k of Object.keys(PM)) PM[k] = 0; pmFrames = 0; }
/** 07/11: quem está gastando desenhos — malhas dentro da câmera por grupo de topo da cena (nome, ou o nome do 1º filho com nome) */
function drawBreakdown() { const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)); const out: [string, number][] = [];
  for (const ch of scene.children) { if (!ch.visible) continue; let n = 0, lab = ch.name; ch.traverseVisible((o) => { if (!lab && o.name) lab = o.name; const m = o as THREE.Mesh; if ((m.isMesh || (o as THREE.Sprite).isSprite) && m.geometry) { if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); const bs = m.geometry.boundingSphere!.clone().applyMatrix4(m.matrixWorld); if (fr.intersectsSphere(bs)) n += (m as THREE.InstancedMesh).isInstancedMesh ? 1 : 1; } });
    if (n) out.push([(lab || ch.type) + (ch.userData?.kind ? ':' + ch.userData.kind : ''), n]); }
  const agg = new Map<string, number>(); for (const [k, v] of out) agg.set(k, (agg.get(k) ?? 0) + v); return [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${k} ${v}`).join(' · '); }
(window as unknown as { __draws?: () => string }).__draws = drawBreakdown;
function perfReport() { const e = Object.entries(PMavg).sort((a, b) => b[1] - a[1]); const tot = e.reduce((a, [, v]) => a + v, 0); let vis = 0; scene.traverseVisible(() => vis++); let all = 0; scene.traverse(() => all++);
  return `⏱ CPU por quadro ${tot.toFixed(1)} ms · ${vis} objetos visíveis de ${all} · ${renderer.info.render.calls} desenhos\n` + e.filter(([, v]) => v >= 0.05).map(([k, v]) => `${k}: ${v.toFixed(2)} ms`).join(' · '); }
function frameBody() {
  pmFrameEnd(); pmLast = performance.now(); pmFrames++;
  { fpsN++; const nowMs = performance.now(); if (nowMs - gapPrev > 300) dynGap = true; gapPrev = nowMs; if (nowMs - fpsT > 1000) { const v = document.getElementById('ver'); if (v) { const N = Math.max(1, perf.n), ri = renderer.info.render; v.textContent = `${fpsN} fps · CPU ${(perf.cpuS / N).toFixed(1)} ms (desenho ${(perf.drawS / N).toFixed(1)}) · GPU ${perf.gpuN ? (perf.gpuS / perf.gpuN).toFixed(1) + ' ms' : '—'} · ${ri.calls} desenhos · ${(ri.triangles / 1000).toFixed(0)}k tri · ${game.dbg().en.length} inimigos · build ${__BUILD__}`; }
    lastFps = fpsN; dynResTick(fpsN); perf.cpuS = perf.drawS = perf.gpuS = 0; perf.n = perf.gpuN = 0; fpsN = 0; fpsT = nowMs; pmFlush(); } }
  const rawDt = Math.min(0.05, clock.getDelta());
  if (limiar.active) { limiar.frame(rawDt, renderer.domElement.width, renderer.domElement.height); bloom.strength = 0.22 * opts.bloom * gfxBloom; renderer.info.reset(); if (gpuImpl) limiarGL(true); else { if (fixedL) { const [fs, fc] = dual.cur(); fixedL.frame(fs, fc); } composer.render(); } return; }
  if (limGL) limiarGL(false); // o mundo espera lá embaixo
  const dt = rawDt * game.timeScale() * (cinemaSys.cine ? 0 : 1) * (dlg.isOpen || document.getElementById('create')!.style.display === 'grid' ? 0 : 1) /* mundo vivo: janelas não pausam */;
  geoSweepT -= rawDt; if (geoSweepT <= 0) { geoSweepT = 30; const t0 = performance.now(), r = geoSweep([scene]); if (r.geo + r.tex > 0 && location.search.includes("perf")) console.log(`[varredura] ${r.geo} geometrias, ${r.tex} texturas soltas em ${(performance.now() - t0).toFixed(1)} ms`); }
  t += dt;
  entradaSys.nightTarget = nightOverride ?? nightAt(gameHour());
  (window as unknown as { __night?: number }).__night = state.night;
  state.night += (entradaSys.nightTarget - state.night) * Math.min(1, dt * 0.8);
  const night = state.night, day = 1 - night;

  /* movimento */
  /* água: entra andando até a cintura (lento, empurrando a água); mais fundo que isso, nada */
  const depthNow = inside ? 0 : WL - heightAt(state.fx * T, state.fy * T);
  const swimming = !inside && depthNow > 1.25; swimmingNow = swimming; hero.swim = swimming;
  pm('entrada');
  dual.clipFor = scene; dual.fineClip = inside ? [] : waterClip; // a linha d'água corta os corpos (a água não escreve profundidade)
  const wade = !inside && !swimming && depthNow > 0.04 ? Math.min(1, depthNow / 1.0) : 0;
  updateFishing(dt, t); updateWork(); herbSparkle(dt); updateQuestRings(dt); featsTick(dt);
  const sp = RACES[state.race].speed * (compSys.riding && compSys.mount ? 1 : 0.7 + 0.08 * Math.min(1, (game.st.lvl - 1) / 40)) /* 07/11: a pé 70% no nível 1, 72% no 10, 78% no 41 (62% ficou lento demais — Erling) */ /* 28/10 (Erling): a pé, 20% mais lento; 07/11: 28% ("começa bem lento e o cálculo sobre a base fica menor"); o passo cresce com itens e buffs, com teto de +40% */ * game.st.move * game.buffMove * (instintoSys.instinctOn && !inside ? 0.85 : 1) /* Instinto: atenção custa passo (Erling 26/10) */ * (entradaSys.combatMode ? 1 : 1.2) * (compSys.riding && compSys.mount ? compSys.mount.kind.speed : 1) * (game.st.god ? 4.2 : 1) * (swimming ? 0.5 : 1) * (1 - 0.45 * wade);
  if (game.st.lvl !== peleSys.lastLvl) { peleSys.lastLvl = game.st.lvl; refreshLocks(kitRace(), peleSys.lastLvl, (k) => tree.rank(k)); /* 05/11 (Erling: "subir de nível base dá pontos de atributo; subir de classe dá pontos de habilidade, passiva e talento"): o aviso antigo de "+1 ponto de magia" no nível base saiu — a conta já era só pelo nível de classe */ }
  dockEl.querySelector('[data-d="skills"]')?.classList.toggle('pulse', tree.available() > 0 && !dockSys.skillsOpen);
  /* 10/11 (Erling: "não tem nada que me diz que eu passei de nível ou de classe; um ícone discreto do lado direito para eu não esquecer de dar os pontos"):
     dois selos pequenos no lado direito: ▲ pontos de atributo (abre C) e ✦ pontos de classe, para magias, passivas e talentos (abre K). Somem quando não há ponto. */
  { const ap = game.st.points ?? 0, tp = tree.available(), key = ap + ':' + tp; if (key !== lvlUpKey) { lvlUpKey = key; let el = document.getElementById('lvlup');
      if (!el) { el = document.createElement('div'); el.id = 'lvlup'; el.innerHTML = MV_GRIP('l') + '<div class="lvb"></div>'; document.body.appendChild(el); movable(el, 'lvlup'); /* 10/11 (Erling: "precisa ser movido como tudo na tela") */
        const st = document.createElement('style'); st.textContent = '#lvlup{position:fixed;right:14px;top:356px;align-items:center;z-index:40;display:flex;flex-direction:row;gap:4px;pointer-events:none}#lvlup .lvb{display:flex;flex-direction:column;gap:8px;align-items:flex-end}#lvlup .mvgrip{pointer-events:auto;position:static;cursor:grab;color:#ffe08a;opacity:.55;font-style:normal;padding:4px 2px}#lvlup .mvgrip:hover{opacity:1}#lvlup button{pointer-events:auto;display:flex;align-items:center;gap:6px;padding:6px 10px 6px 8px;border-radius:999px;border:1px solid rgba(255,214,120,.55);background:rgba(18,12,6,.82);color:#ffe08a;font:600 12px Cinzel,Georgia,serif;letter-spacing:.06em;cursor:pointer;box-shadow:0 0 0 rgba(255,200,90,.0);animation:lvlupGlow 2.4s ease-in-out infinite}#lvlup button i{font-style:normal;font-size:14px}#lvlup button.k{border-color:rgba(170,150,255,.6);color:#d6c8ff;animation-delay:1.2s}#lvlup button:hover{background:rgba(40,28,12,.95)}@keyframes lvlupGlow{0%,100%{box-shadow:0 0 0 rgba(255,200,90,0)}50%{box-shadow:0 0 14px rgba(255,200,90,.45)}}';
        document.head.appendChild(st);
        el.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('button'); if (!b) return; const k = b.dataset.key!; window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: 'Key' + k.toUpperCase(), bubbles: true })); }); }
      el.style.display = ap > 0 || tp > 0 ? 'flex' : 'none'; (el.querySelector('.lvb') as HTMLElement).innerHTML = (ap > 0 ? `<button type="button" data-key="c" title="${tr('lvlup.atributos.dica', { n: ap })}"><i>▲</i>${tr('lvlup.atributos', { n: ap })}</button>` : '') + (tp > 0 ? `<button type="button" class="k" data-key="k" title="${tr('lvlup.classe.dica', { n: tp })}"><i>✦</i>${tr('lvlup.classe', { n: tp })}</button>` : ''); } }
  if (game.hurtNow()) setCombat(true);
  if (((t * 2) | 0) !== poiTick) { poiTick = (t * 2) | 0; for (const p of city.pois) if (Math.hypot(p.x - state.fx, p.y - state.fy) < 4) quests.onVisit(p.name); }
  let ix = 0, iy = 0;
  if (keys.has('w') || keys.has('arrowup')) iy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) iy += 1;
  if (keys.has('a') || keys.has('arrowleft')) ix -= 1;
  if (keys.has('d') || keys.has('arrowright')) ix += 1;
  // fôlego: base por origem/caminho (guerreiros, lobisomens e vampiros muito; elfos mais; humanos/anões menos; tecnocratas e bruxos menos) + 4 por ponto de vitalidade
  const STAM_BASE: Record<string, number> = { human: 100, dwarf: 85, elf: 125 };
  game.st.stamMax = Math.round(((profile ? STAM_BASE[profile.origin] ?? 100 : 100) * (state.race === 'technocrat' ? 0.7 : state.race === 'nordic' ? 1.3 : 1) + (game.st.attrs?.vit ?? 0) * 4) * (1 + ((game.st as { feastStam?: number }).feastStam ?? 0))); /* + a mesa dos anões */
  if (entradaSys.outOfBreath && game.st.stam >= game.st.stamMax * 0.25) entradaSys.outOfBreath = false;
  const wantRun = runningNow() && (ix || iy || state.path.length > 0);
  if (wantRun && game.st.stam > 0 && !game.st.god) game.st.stam = Math.max(0, game.st.stam - dt * 9);
  if (game.st.stam <= 0.5 && wantRun && !game.st.god) { entradaSys.outOfBreath = true; if (!stamWarnT) { stamWarnT = 2; game.logMsg('😮‍💨 Sem fôlego — andando até recuperar.', '#ffd24a'); } }
  if (stamWarnT > 0) stamWarnT -= dt;
  const run = runningNow() && (game.st.stam > 0.5 || game.st.god) ? 1.5 : 1;
  game.setMoving(!!(ix || iy));
  if (emote.dance && (ix || iy)) { emote.dance = false; if (hero.actName === 'dance') hero.stopAct?.(); } /* andar para a dança na hora */
  /* 04/11 (Erling: "o guerreiro está fora da escala, super pequeno… todos com braços pra cima"): levantar do banco com QUALQUER movimento —
     tecla, clique no chão (caminho), esquiva, golpe, combate, morte, teleporte, troca de classe. Antes só a tecla levantava: andando com o
     mouse o herói ficava "sentado" em pé (corpo abaixado e braço no joelho). */
  if (casteloSys.sitting && (ix || iy || hero.acting || state.path.length > 0 || dashT > 0 || hero.combat || game.st.dead || Math.hypot(state.fx - casteloSys.sitting.x, state.fy - casteloSys.sitting.y) > 0.8)) { casteloSys.sitting = null; }
  const forced = !!hero.actName && ['slam', 'bash', 'combo1', 'combo2', 'combo3', 'combo4', 'cleave1', 'cleave2', 'cleave3', 'cleave4', 'rush', 'quake', 'charge', 'jet', 'throw'].includes(hero.actName);
  /* 05/11 (Erling: "elfos, tecnocratas e caçadores de demônio atiram andando — são hábeis com armas de longo alcance; magos conjuram andando"):
     nesses caminhos o golpe/magia não planta o pé — anda a 85% enquanto atira ou conjura (os outros seguem a 30%) */
  const mobileCaster = (() => { const k = kitRace() as string; return k === 'elf' || k === 'tecno' || k === 'cac' || k === 'mag' || (k === 'human' && profile?.origin === 'elf'); })();
  let actSlow = dashT > 0 ? 1 : game.flaming ? 0.75 : forced ? 0 : hero.acting ? (mobileCaster ? 0.85 : 0.3) : hero.guard ? 0.45 : 1;
  let gdx = 0, gdy = 0;
  if (ix || iy) {
    state.path = []; marker.visible = false;
    gdx = ix * Math.cos(az) - iy * -Math.sin(az); gdy = -ix * Math.sin(az) - iy * -Math.cos(az);
    const len = Math.hypot(gdx, gdy); gdx /= len; gdy /= len;
  } else if (cliqueSys.lmbHold && performance.now() - cliqueSys.lmbHold > 260 && !game.menuOpen && !cinemaSys.cine && (cliqueSys.holdT -= dt) <= 0) { cliqueSys.holdT = 0.18; planTo(mouse.x / T, mouse.z / T, false, 5000); if (state.path.length) [gdx, gdy] = followPath(dt); }
  else if (state.path.length) { [gdx, gdy] = followPath(dt); }
  state.moving = !!(gdx || gdy);
  if (keys.has(' ') && dashCd <= 0 && !hero.acting) { const f = hero.facing; startDash(state.moving ? gdx : Math.sin(f), state.moving ? gdy : Math.cos(f)); }
  dashCd -= dt;
  /* 03/11 (Erling: "no Path of Exile 2, com monstro na tela, clicar para longe faz o herói andar de costas um tempo"): ao começar a se afastar
     de um inimigo perto (até 11 m), o herói continua de frente para ele e recua de costas (82% da velocidade) por até 1,3 s; de lado, anda
     meio virado (de frente para o inimigo, os pés na direção do clique). Passado o tempo — ou longe dele — vira e corre. Indo para cima do
     inimigo, anda normal. A janela recomeça quando ele para. */
  bpYaw = null; hero.moveYaw = null; const gaitNow = gaitOf(((k0) => ['nordic', 'dwarf', 'human', 'elf'].includes(k0) && (profile?.origin === 'elf' || profile?.origin === 'dwarf') ? profile!.origin : k0)(kitRace() as string), (hero as unknown as { wcls?: string }).wcls ?? 'one', hero.stance); hero.gait = gaitNow;
  /* 04/11: ALVO PRESO INVISÍVEL (alvo-preso.ts) no lugar da janela curta de recuo. Preso a um bicho, o corpo fica de frente para ele e os pés
     vão para o clique: de costas (mais devagar, pela classe), de lado e na diagonal (meio caminho). Indo para cima dele, anda normal. */
  updateCharLod(scene, hero.root, dt);
  { const hx = state.fx * T, hz = state.fy * T; const lk = (dashT > 0 || inside || compSys.riding || swimming) ? null : lockSys.update(dt, hx, hz, game.enemies.list, 10 + gaitNow.bp[0] * 2);
    /* a intenção manda: golpe começando virado para outro bicho troca o alvo (o rosto do golpe já foi para onde o jogador mirou) */
    if (lk && hero.acting && !lockActWas) lockSys.retarget(lockSys.inCone(hx, hz, entradaSys.aimYaw(), game.enemies.list, 0.77, 9)); /* a mira do golpe (mouse, encaixada no bicho do cone) */
    lockActWas = hero.acting;
    /* andando na direção de outro bicho, com o alvo atual de lado ou atrás: troca */
    if (lk && state.moving) { const my = Math.atan2(gdx, gdy), toL = Math.atan2(lk.pos.x - hx, lk.pos.z - hz); if (Math.cos(my - toL) < 0.3) { const o = lockSys.inCone(hx, hz, my, game.enemies.list, 0.9, 7); if (o && o !== lk) lockSys.retarget(o); } }
    const lk2 = lockSys.target;
    lockYaw = lk2 ? Math.atan2(lk2.pos.x - hx, lk2.pos.z - hz) : null;
    if (lk2 && state.moving) { const fy = lockYaw!, my = Math.atan2(gdx, gdy); let rel = my - fy; while (rel > Math.PI) rel -= Math.PI * 2; while (rel < -Math.PI) rel += Math.PI * 2; const c = Math.cos(rel);
      bpYaw = fy; hero.moveYaw = Math.abs(rel) > 0.2 ? my : null;
      if (c < -0.35) actSlow *= gaitNow.bp[1]; else if (c < 0.6) actSlow *= (1 + gaitNow.bp[1]) / 2;
      /* 07/11 (Erling): indo para longe do alvo, você recua de costas por 1,5 s; se continuar, o foco descola e o herói vira e corre */
      awayT = c < -0.35 && !hero.acting ? awayT + dt : 0; if (awayT > 1.5) { lockSys.release(4); awayT = 0; lockYaw = null; bpYaw = null; hero.moveYaw = null; } } else awayT = 0; }
  let boost = 1;
  if (dashT > 0) { dashT -= dt; boost = 3.2; gdx = dx0; gdy = dy0; state.moving = true; }
  vel += ((state.moving ? 1 : 0) - vel) * Math.min(1, dt * (state.moving ? 14 : 18));
  if (state.moving || vel > 0.02) {
    const stepL = sp * run * boost * vel * actSlow * dt; moveSlide(gdx * stepL, gdy * stepL, dt, state.moving);
  }
  const leaping = hero.actName === 'slam' || hero.actName === 'quake';
  if (entradaSys.leap && leaping) { // salto marcado: voa em arco do ponto de partida ao ponto marcado
    const p = hero.actP, k = THREE.MathUtils.smoothstep(p, 0.2, 0.66); state.fx = (entradaSys.leap.x0 + (entradaSys.leap.x1 - entradaSys.leap.x0) * k) / T; state.fy = (entradaSys.leap.z0 + (entradaSys.leap.z1 - entradaSys.leap.z0) * k) / T;
  } else if (entradaSys.leap) entradaSys.leap = null;
  if (forced && hero.stepVel !== 0 && !(entradaSys.leap && leaping)) { // avanços/recuos dos golpes (m/s, na direção em que o herói olha)
    const fy = hero.facing; const sv = hero.stepVel / T;
    const tg = game.target(heroPos, fy), dTg = tg ? Math.hypot(tg.x - state.fx * T, tg.z - state.fy * T) : 99;
    if (!(sv > 0 && dTg < 1.4)) {
      const svv = sv > 0 && dTg > 2.2 && dTg < 9 ? sv * 2.3 : sv; // fecha a distância até o alvo // não atravessa o alvo
      const nx = state.fx + Math.sin(fy) * svv * dt, ny = state.fy + Math.cos(fy) * svv * dt;
      if (free(nx, state.fy)) state.fx = nx; if (free(state.fx, ny)) state.fy = ny;
    }
  }
  if (!inside) { const tx = Math.floor(state.fx), ty = Math.floor(state.fy), rp = rampartAt(tx, ty); if (colisaoSys.onWall && !rp) colisaoSys.onWall = false; else if (!colisaoSys.onWall && rp && heroY > rampartTop(rp, tx, ty) - 1.5 && bridgeDeck(state.fx * T, state.fy * T) === null) colisaoSys.onWall = true; } /* 05/11 (relatório KB-0001, "personagem preso na ponte"): a ponte de pedra passa por baixo do caminho de ronda do portão; com o tabuleiro alto, o herói ficava a menos de 1,5 m do topo e virava "em cima do muro" — só andava pelo anel e travava. Agora quem está em cima de uma ponte nunca vira "em cima do muro" (a escada continua subindo como antes) */ else colisaoSys.onWall = false;
  const wallTop = colisaoSys.onWall ? (() => { const tx = Math.floor(state.fx), ty = Math.floor(state.fy), rp = rampartAt(tx, ty); return rp ? rampartTop(rp, tx, ty) : null; })() : null;
  const gH = inside ? (inside.int.floorY?.(state.fx * T - IX, state.fy * T - IZ) ?? 0) : wallTop !== null ? wallTop + 0.08 : heroGround(state.fx * T, state.fy * T), tgtY = swimming ? WL - (state.moving ? 0.62 : 1.05) + Math.sin(t * 2.4) * 0.05 : gH; hero.sit = casteloSys.sitting && Math.hypot(state.fx - casteloSys.sitting.x, state.fy - casteloSys.sitting.y) < 0.3 ? casteloSys.sitting.h ?? 0.55 : 0; /* sentado: o próprio corpo desce até o assento (characters.ts) */ /* nadando: água no peito; andando: pés no leito (até a cintura) */
  heroY += (tgtY - heroY) * Math.min(1, dt * (swimming ? 6 : 18) + (dt > 0 ? 0 : 1));
  { const tc = telefSys?.carry; if (tc && !inside) { state.fx = tc.x / T; state.fy = tc.z / T; state.path = []; heroY = tc.y; } } /* 09/11: o teleférico leva o herói escada acima, no cesto e escada abaixo */
  heroPos.set(state.fx * T, heroY, state.fy * T);
  pm('entrada/física');
  hero.root.position.copy(heroPos); if (compSys.riding && compSys.mount) hero.root.position.y += compSys.mount.seatY() - 0.62;
  plane.constant = -heroY;
  if (!inside) { if (!cinemaSys.cine) objs.setRad(Math.min(5, Math.max(2, Math.ceil(Math.hypot(zoom * innerWidth / innerHeight, zoom * 2.2) / 2 / 40 + 0.7)))); /* raio de chunks segue o zoom e a tela: nada de vazio nas bordas */ objs.update(camX, camZ); } else { inside.int.flicker(t, state.fx * T - IX, state.fy * T - IZ); if (state.fy * T - IZ > inside.int.D + 0.5) exitHouse(); }
  const mps = telefSys?.carry ? (telefSys.carry.walk ? 2.4 : 0) : Math.max(sp * T * run * boost * vel * actSlow * (state.moving || vel > 0.02 ? 1 : 0), Math.abs(forced ? hero.stepVel : 0));
  const aiming = hero.acting;
  if (entradaSys.castQ) { if (performance.now() > entradaSys.castQ.until || game.st.dead) entradaSys.castQ = null; else castAt(entradaSys.castQ.slot, entradaSys.castQ.at); }
  if (entradaSys.lockYaw !== null && !hero.acting) entradaSys.lockYaw = null;
  { /* o herói encara o golpe do começo ao fim: a direção é decidida quando o gesto começa e não fica girando atrás do mouse */
    const an = hero.acting ? hero.actName : null;
    if (an && an !== 'dash' && an !== 'hit' && an !== 'dodge' && (an !== entradaSys.lastActN || hero.actP + 0.15 < entradaSys.lastActP) && !entradaSys.lockFresh) entradaSys.lockYaw = aimYaw();
    entradaSys.lockFresh = false; entradaSys.lastActN = an; entradaSys.lastActP = hero.actP; }
  if ((entradaSys.aimSlot || entradaSys.guardCone) && (dlg.isOpen || game.menuOpen || game.st.dead)) { cancelAim(); entradaSys.guardCone = false; aim.hide(); }
  const aimNow = aim.active ? aim.update(dt, state.fx * T, state.fy * T, mouse.x, mouse.z, (x, z) => inside ? 0 : heightAt(x, z)) : null;
  const mouseYaw = Math.atan2(mouse.x - state.fx * T, mouse.z - state.fy * T);
  if (casteloSys.sitting) { state.fx = casteloSys.sitting.x; state.fy = casteloSys.sitting.y; game.st.hp = Math.min(game.st.hpMax, game.st.hp + dt * 6); }
  pm('chunks');
  if (wade > 0.15 && state.moving) { wadeAcc += dt; if (wadeAcc > 0.09) { wadeAcc = 0; for (let i = 0; i < 2; i++) { const a = Math.random() * 6.283; particles.spawn(heroPos.x + Math.cos(a) * 0.4, WL + 0.03, heroPos.z + Math.sin(a) * 0.4, { vx: Math.cos(a) * 0.8, vy: 0.9 + Math.random(), vz: Math.sin(a) * 0.8, life: 0.5, s0: 0.18, s1: 0.05, c0: 0xe8f4ff, c1: 0x9ac8e8, a: 0.7, g: 6 }); } } }
  if (swimming) { swimAcc += dt; if (swimAcc > (state.moving ? 0.12 : 0.45)) { swimAcc = 0; for (let i = 0; i < 3; i++) { const a = Math.random() * 6.283; particles.spawn(heroPos.x + Math.cos(a) * 0.5, WL + 0.03, heroPos.z + Math.sin(a) * 0.5, { vx: Math.cos(a) * 0.8, vy: 0.05, vz: Math.sin(a) * 0.8, life: 0.9, s0: 0.18, s1: 0.5, c0: 0xdff4ff, c1: 0x9cd0ff, a: 0.5, drag: 1.5 }); } } }
  hero.update(dt, t, swimming ? Math.min(mps, 2.2) : mps, telefSys?.carry ? telefSys.carry.yaw : dashT > 0 ? Math.atan2(dx0, dy0) : entradaSys.lockYaw !== null && aiming ? entradaSys.lockYaw : aiming ? aimYaw() : aimNow ? aimNow.yaw : hero.guard ? mouseYaw : pescaSys.fishing ? Math.atan2(pescaSys.fishing.at.x - state.fx * T, pescaSys.fishing.at.z - state.fy * T) : oficiosSys.work ? Math.atan2(oficiosSys.work.x - state.fx * T, oficiosSys.work.z - state.fy * T) : casteloSys.sitting ? casteloSys.sitting.yaw : state.moving ? (bpYaw ?? Math.atan2(gdx, gdy)) : lockYaw !== null && !hero.acting ? lockYaw : entradaSys.combatMode ? nearYaw() : null);
  { /* 26/10 (Erling: "o corpo precisa morrer, cair no chão morto"): o corpo tomba e fica lá até o jogador escolher ressurgir */
    peleSys.deadK += ((game.st.dead ? 1 : 0) - peleSys.deadK) * Math.min(1, rawDt * (game.st.dead ? 5 : 8)); if (game.st.dead && peleSys.deadK < 0.995) peleSys.deadK = Math.min(1, peleSys.deadK + rawDt * 0.6);
    if (peleSys.deadK > 0.002) { const e = peleSys.deadK < 1 ? 1 - Math.pow(1 - peleSys.deadK, 3) : 1; hero.root.rotation.x = -1.48 * e; hero.root.position.y += 0.07 * e; } else if (hero.root.rotation.x !== 0) hero.root.rotation.x = 0; }
  if (!inside) ormund.update(dt, state.fx * T, state.fy * T);
  if (!inside) { teleferico().update(dt); navios().update(dt); (faroisSys ??= createFarois(scene, city)).update(dt, camX, camZ, state.night); }
  peleSys.skinTick?.(); // copia a pose procedural para o modelo do artista
  peleSys.look?.tick(dt, state.night);
  try { game.setDroneMode(instintoSys.stanceSys?.current().id); } catch { /* */ }
  { const cs = instintoSys.stanceSys?.current(); hero.stance = cs?.role ?? 'bal'; stanceRing(cs ?? null, rawDt); } festaAnim(rawDt, t); joyAnim(t); emoteTick(); decoTick();
  game.setWarrior(isWarrior()); needGauge();
  netMps = swimming ? Math.min(mps, 2.2) : mps; net.update(dt, t); mirrorUpdate(dt); quarksUpdate(dt);
  updateFacSigil(t); updateOutSigil(t);
  pm('herói.update');
  updateXray(dt); updateEnvelopes(t);
  if (isPremium()) { const hp = hero.root.position, a = t * 0.9; blessRune.visible = !inside; blessRune.position.set(hp.x + Math.cos(a) * 0.62, hp.y + 0.28 + Math.sin(t * 2) * 0.04, hp.z + Math.sin(a) * 0.62); } else blessRune.visible = false;
  pm('xray/env');
  updateCompanions(dt, t, hero.root.rotation.y, mps); updatePortal(dt, t); updateStamRing(dt); updateBishop(dt); dgs.update(dt); updateClickMarks(dt); updateSpirit(dt, t); updateBlood(dt, t); updateMarks(dt, t);
  pm('companheiros');
  regrowT -= dt; if (regrowT <= 0) { regrowT = 10; updateRegrow(); updatePicked(); }
  game.update(dt, heroPos, state.karma, RACES[state.race].label, audio.muted);
  pm('jogo(inimigos)');
  brain.tick(dt, (e) => { const o = e as unknown as { own?: number; ownT?: number }; return !(o.own && performance.now() - (o.ownT ?? 0) < 1500); });
  if (mouseSys.rmb && !game.menuOpen && !dlg.isOpen) game.attack(aimYaw(), heroPosNow());
  pm('chefes');
  if (!Number.isFinite(state.fx) || !Number.isFinite(state.fy)) { state.fx = larSys.home.x; state.fy = larSys.home.y; state.path = []; game.logMsg('⚠ A posição do herói se perdeu; você volta para a fonte-lar.', '#ff9a8a'); } /* trava de segurança: nunca andar em NaN */
  obras.update(dt, state.fx * T, state.fy * T, state.path.length > 0 || state.moving, () => { hero.act('cast'); audio.swing(); }); updateGuide(dt); pm('guia'); updateInstinct(dt); pm('instinto'); updateCaravans(dt); pm('caravanas'); updateEventos(dt); pm('eventos'); updateSecrets(dt); pm('segredos'); build.update(mouse.x, mouse.z);
  pm('construção');
  if (socialSys.bubbleT > 0) { socialSys.bubbleT -= dt; if (socialSys.bubbleT <= 0) bubbleEl.style.display = 'none'; else { const r = canvas.getBoundingClientRect(); const v = new THREE.Vector3(heroPos.x, heroPos.y + 2.4, heroPos.z).project(camera); bubbleEl.style.left = r.left + (v.x * 0.5 + 0.5) * r.width + 'px'; bubbleEl.style.top = r.top + (-v.y * 0.5 + 0.5) * r.height + 'px'; } }
  letreiroSys.bannerT -= dt; if (letreiroSys.bannerT <= 0) { letreiroSys.bannerT = 0.5; updateBanner(); } updateGevChip(rawDt); alignTick(rawDt);
  pm('balões/banner');
  letreiroSys.qmT -= dt; if (letreiroSys.qmT <= 0) { letreiroSys.qmT = 0.7; updateQuestMarks(); }
  pm('marcas de missão');
  guiaSys.mmT -= dt; if (guiaSys.mmT <= 0) { guiaSys.mmT = 0.1; drawMini(); if (minimapaSys.bigOpen) drawBig(); (document.getElementById('zone') as HTMLElement).textContent = `${zoneName()} · ${turnName()} ${Math.floor(gameHour())}h`; }
  pm('minimapa');
  hintT -= dt; if (hintT <= 0) { hintT = 0.12; const it = casteloSys.sitting || game.st.dead ? null : findInter(); hintEl.style.display = it ? 'block' : 'none'; if (it) hintEl.textContent = it.label; }
  pm('dica E (findInter)');
  if (hintEl.style.display !== 'none') { const r = canvas.getBoundingClientRect(); const v = new THREE.Vector3(heroPos.x, heroPos.y + 2.1, heroPos.z).project(camera); hintEl.style.left = r.left + (v.x * 0.5 + 0.5) * r.width + 'px'; hintEl.style.top = r.top + (-v.y * 0.5 + 0.5) * r.height + 'px'; }
  /* AURA QUE CRESCE COM O NÍVEL (Erling 26/10: "o alcance aumenta, não o brilho"). O círculo visível depende da queda da luz, não do corte:
     esticar o desenho inteiro por s = subir a luz s vezes, cortar s vezes mais longe e multiplicar a força por s^1.6 (a mesma queda) —
     o chão sob o herói fica igual e a borda vai mais longe. +1% por nível (nível 16 ≈ +15%, nível 60 ≈ +59%). */
  { const s = 1 + Math.min(59, Math.max(0, game.st.lvl - 1)) * 0.01; lantern.position.set(heroPos.x, heroY + 3.2 * s, heroPos.z); /* 09/11 (Erling: "uma luz no terreno que some quando eu subo"): era a lanterna do herói presa na altura 3,2 do mapa — na subida o chão passava por cima dela. Agora acompanha o chão. */ lantern.distance = 36 * s; lantern.intensity = mix(5, 55, night) * Math.pow(s, 1.6); }

  /* câmera com zoom suave e lento */
  zoom += (zoomTarget - zoom) * Math.min(1, dt * 2.2);
  applyZoom();
  if (CAM_FREE && keys.has('q')) azT += dt * 1.6;
  if (CAM_FREE && keys.has('e') && performance.now() - entradaSys.eDown > 230) { azT -= dt * 1.6; entradaSys.eRot = true; }
  az += (azT - az) * Math.min(1, dt * 6);
  pitch += (pitchT - pitch) * Math.min(1, dt * 6);
  camDir.set(Math.sin(az) * Math.cos(pitch), Math.sin(pitch), Math.cos(az) * Math.cos(pitch)).multiplyScalar(camDist());
  leadX += ((state.moving ? gdx * 2.2 : 0) * T * 0.5 - leadX) * Math.min(1, dt * 2.5);
  leadZ += ((state.moving ? gdy * 2.2 : 0) * T * 0.5 - leadZ) * Math.min(1, dt * 2.5);
  if (!updateCine(rawDt) && !menuView(rawDt)) {
  camX += (heroPos.x + leadX - camX) * Math.min(1, dt * 6);
  camZ += (heroPos.z + leadZ - camZ) * Math.min(1, dt * 6);
  pm('minimapa/hint/cine');
  camY += (heroY - camY) * Math.min(1, dt * 5);
  }
  updateDoors(rawDt);
  for (const vo of vistaObjs) { vo.eye.rotation.y += rawDt * 1.2; vo.eye.position.y = (vo.r > 3.6 ? 2.3 + (vo.r - 1.6) * 0.27 : 2.3) + Math.sin(performance.now() / 600) * 0.08; (vo.ring.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.2 * Math.sin(performance.now() / 400); }
  if (Math.floor(performance.now() / 500) !== cinemaSys.cineTick) { cinemaSys.cineTick = Math.floor(performance.now() / 500); checkCineTriggers(); }
  camera.position.set(camX + camDir.x + (Math.random() - 0.5) * game.st.shake, camY + camDir.y + (Math.random() - 0.5) * game.st.shake, camZ + camDir.z + (Math.random() - 0.5) * game.st.shake);
  camera.lookAt(camX, camY, camZ);
  { // câmera presa à grade de pixels do jogo (evita o "tremor" dos pixels ao seguir o herói)
    const ppu = zoom / Math.max(120, Math.floor(innerHeight / PIX)); camera.updateMatrixWorld();
    const rr = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), uu = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const px = camera.position.dot(rr), py = camera.position.dot(uu);
    camera.position.addScaledVector(rr, Math.round(px / ppu) * ppu - px).addScaledVector(uu, Math.round(py / ppu) * ppu - py);
  }

  /* luz do dia e da noite: o dia é quente (sol dourado, sombras âmbar), a noite é fria (lua azulada).
     Os eventos globais tingem o mundo inteiro: a Lua de Sangue deixa tudo rubro; a Aurora, dourado e rosado */
  if (performance.now() - gChkT > 1000) { gChkT = performance.now(); try { gCur = gForce !== undefined ? gForce : (globalNow()?.id ?? null); } catch { gCur = null; } const sd = globalSide(gCur); const sk = soul.s.natSet === myPath() ? strainOf(state.karma, myPath(), !!soul.s.outcast) : 0, sm0 = strainMod(sk); checkRitual(); checkMadness(); const mz = soul.s.madness ? MADNESS[soul.s.madness as Madness] : null, sm = { dmg: sm0.dmg + (mz?.dmg ?? 0), taken: sm0.taken + (mz?.taken ?? 0) }; game.st.outMul = (sd > 0 ? 1.1 : 1) + sm.dmg; game.st.takenMul = (sd > 0 ? 0.92 : sd < 0 ? 1.06 : 1) * (1 + sm.taken);
    { const stg = sk <= 0 ? 0 : sk < 0.5 ? 1 : sk < 1 ? 2 : 3; if (strainStage >= 0 && stg > strainStage) { const p = myPath()!, dark = (NATURE[p] ?? 0) < 0; game.logMsg(stg === 1 ? `⚖ A alma se afasta ${(dark !== !!soul.s.outcast) ? 'da sombra' : 'da luz'}: o ${PATH_NAME[p]} em você estranha (fraqueza kármica: −${Math.round(-sm.dmg * 100)}% de dano).` : stg === 2 ? `⚖ A alma está perto do zero. O ${PATH_NAME[p]} em você enfraquece: −${Math.round(-sm.dmg * 100)}% de dano, +${Math.round(sm.taken * 100)}% de dano recebido.` : `⚖ A alma chegou ao zero: a beira do precipício kármico. Fraqueza kármica total: −20% de dano, +15% de dano recebido.`, '#ff9a6a'); } else if (strainStage > 0 && stg === 0) game.logMsg('⚖ A alma voltou para perto da sua natureza. A fraqueza kármica passou.', '#9ad7ff'); strainStage = stg; } /* regra 01: bônus de evento pequeno, e o de dano entra no balde da situação com teto de +30% */ }
  luaK += ((gCur === 'lua' && !inside?.dg ? 1 : 0) - luaK) * Math.min(1, rawDt * 0.35);
  aurK += ((gCur === 'aurora' && !inside?.dg ? 1 : 0) - aurK) * Math.min(1, rawDt * 0.35);
  instK += ((instintoSys.instinctOn && !inside ? 1 : 0) - instK) * Math.min(1, rawDt * 2);
  if (gCur !== gOpenId && !document.getElementById('boot')?.matches(':not(.off)') && !inicio.isOpen) { gOpenId = gCur; gOpenAt = performance.now(); } /* a abertura só conta quando o jogador já está vendo o mundo */
  const op = gOpen(), aurV = aurK * (0.4 + 0.6 * op), aurGlow = aurK * (0.12 + 0.88 * op), aurFx = aurK * (0.18 + 0.82 * op);
  /* Lua de Sangue (Erling, 25/10): a abertura vem forte (cor e o pulso); depois fica leve para jogar — percebe-se a lua, mas sem sofrer.
     Dentro de um evento aceito, o rubro e o coração voltam a pesar. */
  engK += ((eventos.engaged() ? 1 : 0) - engK) * Math.min(1, rawDt * 0.5);
  const luaV = luaK * Math.min(1, 0.25 + 0.75 * Math.max(op, engK * 0.85));
  /* 08/11 (sistemas/ceu.ts): o céu, a névoa e a luz seguem a HORA do jogo — aurora rosada, poente cobre, noite de luar. O 'night' forçado (teste, N)
     e as transições continuam valendo pelo 'day': a paleta da hora pesa (1 − |night − nightAt(hora)|), senão vale a mistura antiga */
  const SKY = skyAt(gameHour()), hourK = nightOverride === null && !inside ? 1 - Math.min(1, Math.abs(state.night - entradaSys.nightTarget) * 3) : 0;
  scene.background = (scene.background as THREE.Color).copy(nightC.sky).lerp(dayC.sky, day).lerp(SKY.sky, hourK).lerp(LUA_C.sky, luaV * 0.85).lerp(AUR_C.sky, aurV * 0.35);
  (scene.fog as THREE.FogExp2).color.copy(nightC.fog).lerp(dayC.fog, day).lerp(SKY.fog, hourK).lerp(LUA_C.fog, luaV * 0.8).lerp(AUR_C.fog, aurV * 0.4);
  (scene.fog as THREE.FogExp2).density = mix(mix(0.012, 0.0022, day), SKY.fogD, hourK) * (cinemaSys.cine ? 0.35 : 1) * (1 + luaV * 0.5);
  letreiroSys.curseNow += ((inside ? 0 : curseK()) - letreiroSys.curseNow) * Math.min(1, dt * 1.5); // (sem névoa extra: a região tem a mesma claridade do resto do mundo)
  hemi.color.copy(hemiNightSky).lerp(hemiDaySky, day).lerp(SKY.hemi, hourK * 0.8).lerp(LUA_C.hemi, luaV * 0.75).lerp(AUR_C.hemi, aurV * 0.4);
  hemi.groundColor.copy(hemiNightGround).lerp(hemiDayGround, day).lerp(SKY.ground, hourK * 0.6).lerp(LUA_C.ground, luaV * 0.6);
  hemi.intensity = mix(1.05, 1.0, day) + (cinemaSys.cine ? 0.6 * (1 - day) : 0) + luaV * 0.35 + aurGlow * 0.12;
  sun.color.copy(sunNight).lerp(sunDay, day).lerp(SKY.sun, hourK).lerp(LUA_C.sun, luaV * 0.85).lerp(AUR_C.sun, aurV * 0.5);
  sun.intensity = mix(mix(0.8, 2.4, day), SKY.sunI, hourK) + (cinemaSys.cine ? 0.9 * (1 - day) : 0) + luaV * 0.6 + aurGlow * 0.15; // nas cinemáticas a paisagem se acende
  /* 10/11 (Erling: "o jogo precisa ser mais escuro, uma atmosfera mais dark que valoriza as cores, mas de noite precisamos enxergar tudo"):
     o dia ficou mais baixo de exposição e mais saturado (cor cheia em vez de lavada); a noite quase não muda de exposição e ganha luz do céu, então escurece no tom, não na visão */
  renderer.toneMappingExposure = mix(0.88, 0.84, day) * (opts.gfx === 1 ? 0.92 : 1); finish.uniforms.uVig.value = mix(0.46, 0.44, day * (inside?.dg ? 0 : 1));
  { const u = finish.uniforms, inD = inside?.dg ? 1 : 0, dayW = day * (1 - inD);
    (u.uMul.value as THREE.Vector3).set(mix(0.92, 1.07, dayW), mix(0.98, 1.0, dayW), mix(1.12, 0.88, dayW)).lerp(LUA_MUL, luaV).lerp(AUR_MUL, aurV * 0.8);
    (u.uLift.value as THREE.Vector3).set(mix(0.016, 0.006, dayW), mix(0.024, 0.004, dayW), mix(0.055, 0, dayW)).lerp(LUA_LIFT, luaV).lerp(AUR_LIFT, aurGlow);
    u.uSat.value = mix(0.95, 1.2, dayW) + luaV * 0.12 + aurK * 0.1 + instK * 0.07; /* Instinto ligado: o mundo fica um pouco mais nítido de cor */ /* depois da abertura a Aurora deixa o dia mais colorido */ }
  /* 09/11 (Erling: "o canto de anjos fica muito alto e atrapalha; tem que ser bem sutil, vir de vez em quando, a cada 5 minutos, 20 segundos no máximo"):
     o coral só soa numa janela de 20 s a cada 5 min do Dia da Aurora (a primeira na abertura), sobe e desce devagar e nunca passa de um terço do volume antigo. */
  choirClock = aurK > 0.01 ? choirClock + rawDt : 0; { const ph = choirClock % 300, env = ph < 20 ? Math.sin(Math.PI * ph / 20) : 0;
    audio.choir(aurK * env * 0.32 * (inside ? 0.35 : 1), rawDt); } audio.blood(luaK * (0.12 + 0.88 * Math.max(op, engK)) * (inside ? 0.4 : 1), rawDt);
  if (inside?.dg) { sun.intensity = 0.5; hemi.intensity = 0.78; (scene.fog as THREE.FogExp2).density = 0.0035; lantern.intensity = 42 * Math.pow(1 + Math.min(59, Math.max(0, game.st.lvl - 1)) * 0.01, 1.6); } // debaixo da terra: só as tochas, os cristais e a lava iluminam
  { // sombra estável: o alvo do sol anda em passos de 1 texel do mapa de sombras (acaba com o "formigamento" das sombras)
    const dir = (hourK > 0.5 ? lightDirAt(gameHour()).clone() : new THREE.Vector3(-18, 28, 10)).normalize(), lr = new THREE.Vector3(0, 1, 0).cross(dir).normalize(), lu = dir.clone().cross(lr), tex = 44 / 2048 * 2; /* 08/11: o sol anda com a hora (ceu.ts) */
    const a = Math.round(heroPos.dot(lr) / tex) * tex, b = Math.round(heroPos.dot(lu) / tex) * tex, c = heroPos.dot(dir);
    sun.target.position.set(0, 0, 0).addScaledVector(lr, a).addScaledVector(lu, b).addScaledVector(dir, c);
    sun.position.copy(sun.target.position).addScaledVector(dir, 40);
  }
  const fl = mix(1.0, 0.07, day); // de dia as tochas quase não iluminam (o sol manda)
  (objs.windows.color as THREE.Color).setHex(day > 0.6 ? 0x6b5a40 : 0xffc266); setVitraisDay(day);

  windU.value = t; heroU.value.set(heroPos.x, state.moving ? 1 : 0, heroPos.z);
  waterU.uLight.value = mix(0.3, 1, day);
  const gust = THREE.MathUtils.clamp(0.45 + 0.4 * Math.sin(t * 0.37) * Math.sin(t * 0.11 + 1.3) + 0.25 * Math.sin(t * 1.3 + Math.sin(t * 0.21) * 3), 0, 1);
  gustU.value = Math.min(1, gust + aurFx * 0.25); /* na Aurora corre uma brisa a mais pelo capim */
  const WDX = 0.86, WDZ = 0.5; // direção do vento
  particles.wind.x = WDX * (0.4 + gust * 3.2); particles.wind.z = WDZ * (0.4 + gust * 3.2);
  hero.setNight(night); hero.setWind(gust); game.setDark(Math.max(night, inside && (inside.dg || inside.crypt || (inside.castle !== undefined && inside.castle < 2)) ? 1 : 0));
  { // sombra para o vampiro: dentro de casa ou masmorra, mata fechada (3+ árvores em volta), ou uma cidade de sombra (Corvoscuro: a fumaça do vulcão tapa o sol)
    const gx = Math.floor(state.fx), gy = Math.floor(state.fy); let tr = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (city.map[gy + dy]?.[gx + dx] === 'tree') tr++;
    const sv = city.settlements.some((v) => SHADE_TOWNS.has(v.name) && Math.hypot(v.x - state.fx, v.y - state.fy) < v.radius + 10); game.setSky(night, !!inside || tr >= 3 || sv); halloween?.setNight(night); }
  try { ataqueSys.tick(dt); } catch (e) { console.warn('ataques', e); } /* 10/11: ataques de bando à vila, de noite */
  if (!inside || inside.hall) npcSys.update(dt, t, heroPos, night, gust); else for (const n of npcSys.npcs) n.el.style.display = 'none'; /* 08/11: dentro do Grande Salão os NPCs de interior vivem (npcs.ts inside) */
  // raios de luz (lua à noite, sol dourado de dia)
  const shaftCol = new THREE.Color(0x7f98ff).lerp(new THREE.Color(0xffd9a0), day);
  void shaftCol;
  { /* a trilha muda com o lugar e com a luta (25/10): chefe, elite, masmorra, lugar maligno, vila, estrada */
    let mood: 'explore' | 'town' | 'dungeon' | 'evil' | 'elite' | 'boss' = 'explore'; const hx2 = state.fx * T, hz2 = state.fy * T;
    for (const e of game.enemies.list) { if (!e.alive || !e.active || e.def.passive || e.state === 'idle' || e.state === 'return') continue; if (Math.hypot(e.pos.x - hx2, e.pos.z - hz2) > 26) continue; const base = DEFS[e.type], named = !!base && e.def.name !== base.name, big = (e.def.scale ?? 1) > (base?.scale ?? 1) * 1.2; /* chefe de masmorra e elite com nome próprio também contam (Erling: "a ratazana chefe não arrancou frase") */ const boss = e.hpMax > 3000 || ['bishop', 'prince'].includes(e.type) || (named && e.hpMax > base.hp * 6), el = boss || e.hpMax > 1500 || ['tormentor', 'treant', 'werewolf'].includes(e.type) || (named && big) || e.type === 'bandit_chief'; if (el) { const cry = battleCry(kitRace(), profile?.sex ?? 'm', String(e.id ?? '') || e.type + ':' + Math.round(e.home.x) + ',' + Math.round(e.home.y), boss); if (cry) { bubble(cry); game.logMsg(`${profile?.name ?? 'Você'}: “${cry}”`, '#ffe08a'); } } if (boss) { mood = 'boss'; break; } if (el) mood = 'elite'; }
    if (mood === 'explore') { if (inside && (inside.dg || inside.crypt)) mood = 'dungeon'; else if (!inside) { const b = biomeAt(Math.floor(state.fx), Math.floor(state.fy)); if (b === 'blight' || b === 'volcanic' || city.settlements.some((v) => (v.name === 'Gorvath' || v.name === 'Corvoscuro') && Math.hypot(v.x - state.fx, v.y - state.fy) < v.radius + 18)) mood = 'evil'; else if (city.settlements.some((v) => Math.hypot(v.x - state.fx, v.y - state.fy) < v.radius + 4)) mood = 'town'; } }
    audio.setMood(festaSys.festa && Math.hypot(heroPos.x - festaSys.festa.x, heroPos.z - festaSys.festa.z) < 80 ? 'festa' : mood); }
  { const zz = zoneW(Math.floor(state.fx), Math.floor(state.fy)); audio.update(dt, { fallDist: inside ? 999 : falls.update(dt, heroPos), night, gust, fireDist: inside ? 3 : objs.torches.reduce((m2, tc) => Math.min(m2, tc.pos.distanceTo(heroPos)), 1e3), waterDist: inside ? 99 : fountainPos.distanceTo(heroPos), riverDist: inside ? 99 : Math.max(0, waterSD(heroPos.x, heroPos.z)), forest: zz.forest, snow: zz.snow, inside: !!inside }); }
  { // jatos da fonte: de cada bica cai água em arco; do topo sobe um filete e cai em cortina
    const fp = objs.fountainPos();
    if (fp && fp.distanceTo(heroPos) < 55) {
      const R2 = FOUNTAIN.rad;
      if (Math.random() < 0.9) { const a = Math.random() * 6.283; particles.spawn(fp.x, fp.y + FOUNTAIN.top, fp.z, { vx: Math.cos(a) * 0.9, vy: 3.3 + Math.random() * 0.8, vz: Math.sin(a) * 0.9, life: 1.0, s0: 0.22, s1: 0.14, c0: 0xcfeeff, c1: 0x6fb8ff, a: 0.9, drag: 0.1, g: 9 }); }
      for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.283 + 0.5; if (Math.random() < 0.8) particles.spawn(fp.x + Math.cos(a) * 1.1, fp.y + FOUNTAIN.bowl - 0.1, fp.z + Math.sin(a) * 1.0, { vx: Math.cos(a) * 1.6, vy: 0.8, vz: Math.sin(a) * 1.6, life: 0.7, s0: 0.2, s1: 0.12, c0: 0xe0f4ff, c1: 0x6fb8ff, a: 0.85, drag: 0.2, g: 9 }); }
      if (Math.random() < 0.7) { const a = Math.random() * 6.283; particles.spawn(fp.x + Math.cos(a) * 0.95, fp.y + FOUNTAIN.bowl - 0.15, fp.z + Math.sin(a) * 0.95, { vx: Math.cos(a) * 0.4, vy: 0, vz: Math.sin(a) * 0.4, life: 0.7, s0: 0.18, s1: 0.12, c0: 0xe0f4ff, c1: 0x6fb8ff, a: 0.7, drag: 0.1, g: 9 }); }
      if (Math.random() < 0.5) { const a = Math.random() * 6.283, rr = 0.6 + Math.random() * (R2 - 1.2); particles.spawn(fp.x + Math.cos(a) * rr, fp.y + FOUNTAIN.rim, fp.z + Math.sin(a) * rr, { vx: 0, vy: 0.5, vz: 0, life: 0.9, s0: 0.5, s1: 1.1, c0: 0xdff4ff, c1: 0xbfe0ff, a: 0.18, drag: 1 }); }
    }
  }
  /* casa de ofício: entrou, o telhado e a parede de fundo somem (dá para ver a bancada e o herói) */
  { const hx = state.fx * T, hz = state.fy * T; const _v = cutV; for (const o of CUTAWAYS) { const par = o.parent; if (!par) continue; const box = o.userData.cutBox as { hw: number; z0: number; z1: number } | undefined; let near: boolean;
      if (box) { _v.set(hx, heroY + 1, hz); par.worldToLocal(_v); near = Math.abs(_v.x) < box.hw && _v.z > box.z0 && _v.z < box.z1; } else { par.getWorldPosition(_v); near = Math.hypot(_v.x - hx, _v.z - hz) < 4.2; }
      if (o.visible === near) o.visible = !near; } }
  for (const sm of objs.smokers) { const strong = (sm as THREE.Vector3 & { strong?: boolean }).strong; /* a forja fumega forte e solta fagulhas (Erling, 26/10) */
    if (Math.random() < (strong ? 0.8 : 0.25)) particles.spawn(sm.x, sm.y, sm.z, { vx: 0.5 + WDX * 0.6, vy: strong ? 1.4 : 0.9, vz: 0.1 + WDZ * 0.6, life: strong ? 3.2 : 2.4, s0: strong ? 0.5 : 0.6, s1: strong ? 2.8 : 2.2, c0: strong ? 0x5a5a62 : 0x8a8a96, c1: 0x30303c, a: strong ? 0.4 : 0.22, drag: 0.4 });
    if (strong && Math.random() < 0.3) particles.spawn(sm.x, sm.y, sm.z, { vx: (Math.random() - 0.5) * 1.2, vy: 2 + Math.random() * 1.5, vz: (Math.random() - 0.5) * 1.2, life: 0.9, s0: 0.08, s1: 0.02, c0: 0xffd070, c1: 0xff5a1a, a: 1, drag: 0.6 }); }
  /* relíquias dos caminhantes: runas pulsam; as já marcadas ganham aura dourada e fagulhas */
  for (const [o, ax, w] of objs.spinners) o.rotation[ax] += w * dt; /* moinho da marcenaria */
  for (const rl of objs.relics) {
    const nm = relicNameAt(rl.gx, rl.gy), known = !!nm && knowsRelic(nm), k = 0.5 + 0.5 * Math.sin(t * 2.2 + rl.seed);
    /* não marcada: chamado dourado no chão, pedra lisa. Marcada: as runas kármicas se gravam na pedra em azul e fica uma aura azul pequena */
    /* 03/11 (Erling: "as runas brilhantes… amarelo antes de marcar, azul depois de marcar"): as runas sempre brilham — douradas chamando, azul mágico depois */
    { const rm = rl.runes.material as THREE.MeshBasicMaterial; if ((rl.runes.material as THREE.Material).userData.stoneGlow) { const sm = rl.runes.material as THREE.MeshToonMaterial; sm.emissive.setHex(known ? 0x5ab8ff : 0xffc83a); sm.emissiveIntensity = known ? 2.6 + 0.8 * k : 1.6 + 0.8 * k; /* 03/11 (Erling: "as cores dentro da pedra mais brilhantes, em tudo, mais para fora da cavidade"): máscara refeita (traço inteiro + halo em volta) e o dobro do brilho — o bloom espalha */ } else if (rl.ring.userData.stone) { rm.color.setHex(known ? 0x4ab0ff : 0xffc83a); rm.opacity = known ? 0.85 + 0.15 * k : 0.55 + 0.4 * k; } else rm.opacity = known ? 0.8 + 0.2 * k : 0.04; }
    (rl.ring.material as THREE.MeshBasicMaterial).color.setHex(known ? (rl.ring.userData.col as number | undefined) ?? 0x5aa8ff : 0xffc83a); (rl.ring.material as THREE.MeshBasicMaterial).opacity = known ? 0.35 + 0.2 * k : 0.55 + 0.4 * k;
    rl.ring.scale.setScalar(known ? 0.72 + 0.04 * k : 1.0 + 0.12 * k); rl.ring.rotation.y = t * (known ? 0.25 : 0.5);
    if (Math.random() < dt * (known ? 4 : 5) && rl.pos.distanceTo(heroPos) < 50) { const a = Math.random() * 6.283, rr = known ? 0.5 + Math.random() * 0.4 : 0.8 + Math.random() * 1.2; particles.spawn(rl.pos.x + Math.cos(a) * rr, rl.pos.y - (known ? 0.6 : 1.4), rl.pos.z + Math.sin(a) * rr, known ? { vy: 0.5 + Math.random() * 0.6, life: 1.3, s0: 0.12, s1: 0.02, c0: rl.ring.userData.stone ? 0xbfe6ff : 0xffe0a0, c1: rl.ring.userData.stone ? 0x3a8aff : (rl.ring.userData.col as number | undefined) ?? 0x4a9aff, a: 0.9 } : { vy: 0.8 + Math.random() * 0.8, life: 1.6, s0: 0.14, s1: 0.02, c0: 0xfff0bd, c1: 0xffd24a, a: 1 }); }
  }
  /* tochas, chamas, brasas */
  tickFire(t, camera, heroPos); /* 08/11: as chamas de cartão (sistemas/fogo.ts) */
  const litSources: { pos: THREE.Vector3; r: number }[] = [];
  for (const tc of objs.torches) {
    const f = 1 + Math.sin(t * 1.3 + tc.seed) * 0.018 + Math.sin(t * 2.9 + tc.seed * 1.7) * 0.012;
    tc.light.intensity = tc.base * f * fl;
    if (!tc.flame.userData.fire) { const fk = 0.5 + 0.5 * Math.sin(t * 9 + tc.seed) * Math.sin(t * 3.7 + tc.seed * 2.1); tc.flame.scale.set(0.9 + fk * 0.15, 0.85 + fk * 0.35, 0.9 + fk * 0.15); tc.flame.rotation.y = t * 0.8 + tc.seed; (tc.flame.material as THREE.MeshBasicMaterial).color.setHex(fk > 0.75 ? 0xfff0a0 : fk > 0.45 ? 0xffc040 : fk > 0.2 ? 0xff8a20 : 0xff5a10); } // a chama vive no pavio: pulsa e muda entre amarelo e vermelho
    litSources.push({ pos: tc.pos, r: 14 });
    const p = tc.pos; const dT = Math.hypot(p.x - heroPos.x, p.z - heroPos.z); if (dT > 42) continue; const nearK = dT < 24 ? 1 : 1 - (dT - 24) / 18;
    if (Math.random() < 0.14 * nearK) particles.spawn(p.x + (Math.random() - 0.5) * 0.08, p.y + 0.1, p.z + (Math.random() - 0.5) * 0.08, { vx: (Math.random() - 0.5) * 0.2, vy: 0.9 + Math.random() * 0.6, vz: (Math.random() - 0.5) * 0.2, life: 0.35 + Math.random() * 0.25, s0: 0.45, s1: 0.1, c0: 0xffe080, c1: 0xff4a10, a: 0.6 }); // um estalo de chama de vez em quando
    if (Math.random() < (0.28 * fl + 0.03) * nearK) particles.spawn(p.x + (Math.random() - 0.5) * 0.15, p.y + 0.2, p.z + (Math.random() - 0.5) * 0.15, { vx: (Math.random() - 0.5) * 0.6, vy: 2.2 + Math.random() * 1.6, vz: (Math.random() - 0.5) * 0.6, life: 1.4 + Math.random() * 1.6, s0: 0.2, s1: 0.04, c0: 0xffe9a0, c1: 0xff3a00, a: 1, drag: 0.1, w: 0.9 });
    if (Math.random() < 0.1 * nearK) particles.spawn(p.x, p.y + 0.2, p.z, { vx: (Math.random() - 0.5) * 0.9, vy: 1.8 + Math.random(), vz: (Math.random() - 0.5) * 0.9, life: 2 + Math.random() * 1.5, s0: 0.28, s1: 0.1, c0: 0xffc060, c1: 0xff4a10, a: 1, drag: 0.3 });
  }
  for (const g of objs.glowLights) {
    const f = 1 + Math.sin(t * 0.9 + g.seed) * 0.015;
    g.light.intensity = g.base * f * (g.warm ? mix(0.6, 1, night) : 1) * mix(1, 0.2, day);
  }
  for (const tr of objs.trees) { tr.obj.rotation.z = Math.sin(t * 0.9 + tr.ph) * 0.012; tr.obj.rotation.x = Math.cos(t * 0.7 + tr.ph) * 0.01; }
  spawnAcc += dt;
  if ((fpsN & 31) === 0) { const ex = city.settlements.filter((q) => /Eikvik|Aelvaren/.test(q.name)); elfK = ex.reduce((a, q) => Math.max(a, 1 - Math.min(1, Math.hypot(q.x - state.fx, q.y - state.fy) / 40)), 0); const z = zoneW(state.fx, state.fy); forestK = z.forest + z.swamp * 0.6; }
  if (spawnAcc > 0.045 && !inside) {
    spawnAcc = 0;
    const rx = () => heroPos.x + (Math.random() - 0.5) * 30, rz = () => heroPos.z + (Math.random() - 0.5) * 30;
    // pólen / poeira de dia, ao vento
    if (Math.random() < 0.12 + day * 0.22) particles.spawn(rx(), 0.4 + Math.random() * 4.5, rz(), { vx: 0.2, vy: 0.08, vz: 0.1, life: 6 + Math.random() * 4, s0: 0.1 + Math.random() * 0.08, s1: 0.08, c0: day > 0.5 ? 0xfff0b0 : 0xffd9a0, c1: 0xd8c070, a: day > 0.5 ? 0.9 : 0.5, drag: 0.2, w: 0.45 });
    // vagalumes à noite: bem visíveis, flutuando devagar e piscando
    if (night > 0.3 && Math.random() < fireflyK() * night) particles.spawn(rx(), 0.5 + Math.random() * 2.2, rz(), { vx: (Math.random() - 0.5) * 0.4, vy: 0, vz: (Math.random() - 0.5) * 0.4, life: 6 + Math.random() * 5, s0: 0.5, s1: 0.4, c0: 0xd8ff80, c1: 0x7aff50, a: 1, drag: 0.5, w: 0.05, flit: 1.6 });
    // borboletas de dia
    if (day > 0.5 && Math.random() < 0.12) particles.spawn(rx(), 0.6 + Math.random() * 1.2, rz(), { vx: (Math.random() - 0.5) * 0.6, vy: 0, vz: (Math.random() - 0.5) * 0.6, life: 7 + Math.random() * 4, s0: 0.32, s1: 0.3, c0: [0xffd24a, 0xff8ad0, 0x8ad0ff, 0xffffff][(Math.random() * 4) | 0], c1: 0xffa040, a: 0.95, drag: 0.7, flit: 5 });
    // fagulhas mágicas e esporos no ar (cintilam perto do chão)
    if (Math.random() < 0.05 + 0.4 * elfK) particles.spawn(rx(), 0.3 + Math.random() * 3.5, rz(), { vx: 0, vy: 0.25, vz: 0, life: 7, s0: 0.2, s1: 0.06, c0: night > 0.5 ? 0x9ab8ff : 0xfff2b0, c1: 0x6a7aff, a: 0.8, drag: 0.4, w: 0.25, flit: 0.9 });
    // folhas soltas pelo vento
    if (Math.random() < 0.05 + gust * 0.18) particles.spawn(rx() - 8, 3 + Math.random() * 4, rz() - 5, { vx: 1.5, vy: -0.55, vz: 0.8, life: 9, s0: 0.3, s1: 0.28, c0: Math.random() < 0.5 ? 0x5a8a3a : 0x8a6a2a, c1: 0x3a4a22, a: 0.7, drag: 0, w: 1.0 });
  }
  /* karma */
  const eyeEl = document.getElementById('eye') as unknown as SVGElement;
  pm('câmera/mundo/doors');
  eyeEl.classList.toggle('full', Math.abs(state.karma) >= 500); /* o Olho cheio continua pela faixa do alinhamento */
  { eyeSys.update(rawDt, eyeGaze(), hero.acting, Math.min(100, Math.abs(state.karma) / 6), !profile?.eye, night); } /* o Olho enche com a carga kármica (luz ou sombra), nunca por completo */
  globes.update(dt, game.st.hp, game.st.hpMax, game.st.mp, game.st.mpMax);
  if ((fpsN & 15) === 0) checkAwakening();
  /* 27/10 (Erling): a AURA DOURADA da luz radiante e a NÉVOA ESPESSA da treva cegante só existem para karmas altíssimos —
     o karma acumulado da vida (luz − sombra) de +2000 ou −2000, em heróis de nível 120+ — e só se veem com o Instinto ligado */
  const netK = (soul.s.luzT ?? 0) - (soul.s.sombraT ?? 0), seeAura = instintoSys.instinctOn && !inside && game.st.lvl >= 120, /* e só para heróis de nível 120 ou mais */ full = seeAura && netK >= 2000, mist = seeAura && netK <= -2000;
  if (full !== wasFull) { wasFull = full; hero.setAura(full); }
  pm('olho/globos');
  if (full && Math.random() < 0.7) particles.spawn(heroPos.x + (Math.random() - 0.5) * 0.6, heroPos.y + 0.2, heroPos.z + (Math.random() - 0.5) * 0.6, { vy: 1.4 + Math.random(), life: 1.2, s0: 0.9, s1: 0.1, c0: 0xfff0bd, c1: 0xf2b04a, a: 0.9 });
  darkMist(mist, rawDt);
  pm('aura');
  if (dashT > 0) for (let i = 0; i < 3; i++) particles.spawn(heroPos.x, 0.3 + Math.random() * 1.4, heroPos.z, { vx: (Math.random() - 0.5) * 0.6, vy: 0.2, vz: (Math.random() - 0.5) * 0.6, life: 0.35, s0: 1.4, s1: 0.2, c0: 0xcfe0ff, c1: 0x6a4aff, a: 0.5, drag: 2 });
  lightPool(rawDt); pm('luzes');
  updateInstFx(rawDt);
  pm('instfx');
  atmos.update(rawDt, t, heroPos, aurFx, luaV, gust, (x, z) => heightAt(x, z), !!inside);
  if (!inside) craftHall?.update(dt, heroPos);
  particles.update(dt); vfxTick(dt); vfxProjTick(dt); /* 08/11 efeitos (sistemas/vfx.ts) */

  pm('atmos/partículas');
  bloom.strength = mix(0.07, 0.03, day) * opts.bloom * gfxBloom;
  pm('bloom-cfg');
  scene.updateMatrixWorld(); /* uma vez por quadro, para as duas passadas do desenho (o three.js fazia em cada render) */
  renderer.info.reset();
  { const d0 = performance.now(); if (fixedL) { const [fs, fc] = dual.cur(); fixedL.frame(fs, fc); } autoQFrame(); gpuBegin(); composer.render(); gpuEnd(); if (shotReq.length) { let u = ''; try { u = renderer.domElement.toDataURL('image/jpeg', 0.85); } catch { /* */ } for (const f of shotReq.splice(0)) f(u); } perf.drawS += performance.now() - d0; }
  pm('desenho');
  dollTick(rawDt);
  pm('boneco');
  if (!shown) { shown = true; document.body.classList.add('ready'); }
}
/* boneco vivo na ficha do personagem (C): o próprio herói, animado e com o equipamento que está vestindo, desenhado num
   quadro pequeno ao lado do mundo. Trocou a peça, o boneco troca na hora e brilha; arrastar com o mouse gira (Erling, 25/10) */
var dollR: THREE.WebGLRenderer | null = null, dollScene: THREE.Scene | null = null, dollCam: THREE.PerspectiveCamera | null = null, dollYaw = 0.42, dollPulse = -9, dollBoxT = 0, dollDrag: number | null = null, dollFail = false;
const DOLL_W = 96, DOLL_H = 146;
function dollTick(dt: number) {
  if (dollFail) return; const chEl = document.getElementById('char'), host = chEl && chEl.style.display !== 'none' ? chEl.querySelector('.doll') as HTMLElement | null : null; if (!host) return;
  try {
    if (!dollR) {
      dollR = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' }); dollR.setPixelRatio(1); dollR.setSize(DOLL_W, DOLL_H, false); dollR.outputColorSpace = renderer.outputColorSpace; dollR.toneMapping = renderer.toneMapping; dollR.toneMappingExposure = renderer.toneMappingExposure;
      dollR.domElement.className = 'dollcv'; dollScene = new THREE.Scene(); dollScene.background = new THREE.Color(0x14101a);
      dollScene.add(new THREE.HemisphereLight(0xfff4e0, 0x3a2a30, 2.3)); const dl = new THREE.DirectionalLight(0xffffff, 2.6); dl.position.set(1.2, 2.2, 2.4); dollScene.add(dl);
      const rim = new THREE.DirectionalLight(0xffd8a0, 1.2); rim.position.set(-2, 1.5, -2); dollScene.add(rim);
      dollCam = new THREE.PerspectiveCamera(34, DOLL_W / DOLL_H, 0.05, 30);
      const cv = dollR.domElement; cv.addEventListener('pointerdown', (e) => { dollDrag = e.clientX; cv.setPointerCapture(e.pointerId); e.stopPropagation(); });
      cv.addEventListener('pointermove', (e) => { if (dollDrag === null) return; dollYaw += (e.clientX - dollDrag) * 0.02; dollDrag = e.clientX; });
      cv.addEventListener('pointerup', () => { dollDrag = null; });
    }
    const cv = dollR.domElement; if (cv.parentElement !== host) { host.querySelector('img')?.remove(); host.prepend(cv); }
    const root = hero.root, parent = root.parent, pos = root.position.clone(), rot = root.rotation.clone(), vis = root.visible;
    dollScene!.add(root); root.position.set(0, 0, 0); root.rotation.set(0, dollYaw, 0); root.visible = true; root.updateMatrixWorld(true);
    const xr: THREE.Object3D[] = []; root.traverse((o) => { const mt = (o as THREE.Mesh).material as THREE.Material | undefined; if (o.visible && (o.userData.xray || (mt && !Array.isArray(mt) && mt.depthTest === false))) { xr.push(o); o.visible = false; } });
    if ((dollBoxT -= dt) <= 0) { dollBoxT = 0.6; const box = new THREE.Box3().setFromObject(root), top = Math.min(box.max.y, 1.97 * (root.scale.y || 1)), cy = top * 0.52, dist = top * 1.45 + 0.45; dollCam!.position.set(0.3, cy + 0.15, dist); dollCam!.lookAt(0, cy - 0.02, 0); }
    dollCam!.layers.enableAll(); dollR.render(dollScene!, dollCam!);
    for (const o of xr) o.visible = true;
    dollScene!.remove(root); if (parent) parent.add(root); root.position.copy(pos); root.rotation.copy(rot); root.visible = vis; root.updateMatrixWorld(true);
    const k = Math.max(0, 1 - (performance.now() - dollPulse) / 700); host.style.boxShadow = k > 0 ? `inset 0 0 30px #000, 0 0 ${18 + 26 * k}px rgba(255,210,110,${0.25 + 0.6 * k})` : '';
  } catch (err) { dollFail = true; console.warn('boneco vivo indisponível', err); }
}
(document.getElementById('who') as HTMLElement).textContent = RACES[state.race].label;
frame();
(window as unknown as { __THREE: unknown }).__THREE = THREE; (window as unknown as { __flora: unknown }).__flora = buildSpecies; /* teste: uma árvore de cada espécie */

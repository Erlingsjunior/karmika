import { floatWin, dragAll, confirmBox } from './windows';
dragAll(); // todas as janelas se arrastam pelo título
import { surrender, eyeSees } from './surrender';
import { createCompendium } from './compendium';
import { scenes, playOverlay, type Scene } from './cinema';
import { createFeats, FEATS, CATS, type Feat } from './feats';
/* o mundo cresceu (21/10/2026): as Terras dos Homens foram para o centro do mapa de 840 — tudo que o save guarda em tiles anda SH */
{ const W2 = 'karmika.world', SHF = 210, T2 = 2; if (localStorage.getItem(W2) !== '2') { const mv = (k: string, f: (o: any) => void) => { try { const raw = localStorage.getItem(k); if (!raw) return; const o = JSON.parse(raw); f(o); localStorage.setItem(k, JSON.stringify(o)); } catch { /* */ } };
  mv('karmika.home.v1', (o) => { if (o) { o.x += SHF; o.y += SHF; } }); mv('karmika.build.v1', (a) => { for (const b of a ?? []) { b.gx += SHF; b.gy += SHF; } });
  mv('karmika.regrow.v1', (a) => { for (const r of a ?? []) { r.gx += SHF; r.gy += SHF; } }); mv('karmika.picked.v1', (a) => { for (const r of a ?? []) { r.gx += SHF; r.gy += SHF; } });
  mv('karmika.hunt', (h) => { if (h) { h.x += SHF * T2; h.z += SHF * T2; } }); localStorage.setItem(W2, '2'); } }
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RACES, TILE_M as T, isWalkable, type Race, type Vec } from '@karmika/shared';
import { navPath, lineFree } from './nav';
import { createInventory, ITEMS as ITEMS_TBL, SHOPDEF } from './inventory';
import { createMail } from './mail';
import { createProfessions } from './professions';
import { createLoja } from './loja';
import { createAuction } from './leilao';
import { houseDoor } from './houses3d';
import { setVitraisDay } from './vitrais';
import { createXray } from './xray';
import { FAC, facOf, facSet, facGear, crestURL, sigilTexture, myFac, setMyFac, onFac, FAC_ILVL, type Fac } from './faccoes';
import { isPremium, setPremium, onPremium, IS_DEV, addPremiumDays, premiumUntil, checkPremiumExpiry } from './premium';
import { isTool as isToolId } from './tools';
const ITEMS_Q = (id: string) => ITEMS_TBL[id] ?? { name: id, desc: '', icon: '❔' };
import { createAim, type AimSpec } from './aim';
import { setCulture, genGear, RARITY, ONLY_NAME, tipCtx, type Slot, type Only } from './loot';
import { applyKit, refreshLocks, skillAt, barRows, setBarRows, resOf, type SkillDef } from './kits';
import { createSkillTree } from './skilltree';
import { buildCathedralFloor, type CathedralFloor } from './cathedral3d';
import { attachSkin, type SkinDef } from './skin3d';
import { createNet, type Net } from './net';
import { createCoop } from './coop';
import { createInicio } from './inicio';
import { profLevelUp, badge } from './celebrate';
import { STATION_INFO } from './stations3d';
import { questCat, createQuests, SIDE, WARRIOR } from './quests';
import { HUMAN_ROAD } from './campanha';
import { createVidente, PATHS } from './vidente';
import { buildInterior, type Interior } from './interiors3d';
import { DualRenderPass, fine } from './dual3d';
import { createDialog, type Choice, type Reply } from './dialog';
import { ECOS, FRIO } from './falas';
import { createInstinct, selfLine, instinctOf, type Being, type Place } from './instinto';
import { createSecrets, CACHE_LORE, type SenseGoal, type Cache } from './segredos';
import { nearestFree } from './nav';
import { createCaravans, buildRoutes } from './caravanas';
import { PALADIN, VAMPIRE, TECHNO, WEREWOLF, RACE_INSTINCT } from './sagas';
import { createAtmos } from './atmos';
import { createCraftHall } from './oficios';
import { createEvents, globalNow, globalNext, type EvResult } from './eventos';
import { createPet, createMount, PETS, MOUNTS } from './companions';
import { createGlobes, createEye, playAwakening, playDeath } from './hud';
import { createChat } from './chat';
import { createBuild } from './build';
import { DEFS } from './enemies';
import { heightAt, groundH, rotLocal, localDims, rampartAt, stairTopAt, stairDeck, setRamparts, waterSD, WL, CITY, CATHEDRAL, ASKAVIK, MAP_W, OFX, OFY, zoneW, veinOf, regionAt, REGIONS, type EnemyType } from './world';
import { loadWorld, cachedArray } from './worldcache';
import { type ToolSlot } from './tools';
import { buildWorld, FOUNTAIN, stepAt } from './world3d';
import { charShadow, createCharacter, type Hero3D, type Kind } from './characters';
import { createGameplay } from './gameplay';
import { createNpcs } from './npcs';
import { Mist, Particles } from './fx3d';
import { waterU } from './chunks3d';
import { windU, gustU } from './terrain3d';
import { AudioEngine, type Surface } from './audio';
import { createLimiar, soulSpark, type LimiarInfo } from './limiar';
import { createMasmorras } from './masmorras';
import { createSoul, FRAY_LVL, MAX_BREATHS, CATCHUP_MUL, type Life } from './soul';
import { LightShafts, makeHalo } from './volume3d';

const __t0 = performance.now(); const city = await loadWorld(); setRamparts(city.ramparts ?? []); (window as unknown as { __tcity?: number }).__tcity = performance.now() - __t0; // mundo do cache (só a 1ª abertura gera)
/* relevo do mapa grande (176 mil alturas), também do cache. Os dois 'await' ficam aqui no topo: depois deles o resto do arquivo roda de uma vez, sem pausa no meio */
const MM_HG = 2, mmHw = Math.ceil(MAP_W / MM_HG);
const mmHgt = await cachedArray('mmhgt', () => { const a = new Float32Array(mmHw * mmHw); for (let y = 0; y < mmHw; y++) for (let x = 0; x < mmHw; x++) a[y * mmHw + x] = groundH((x * MM_HG + 1) * T, (y * MM_HG + 1) * T); return a; });
const state = { race: 'nordic' as Race, fx: city.spawn.x, fy: city.spawn.y, path: [] as Vec[], karma: 0, moving: false, night: 1 };
/* a alma: karma (atravessa as vidas), Fio da Vida, Lágrimas, dívida e vidas passadas — ver soul.ts */
const soul = createSoul(); state.karma = soul.s.karma;
/* juramentos (estado lido cedo: o inventário pergunta pela bênção já ao nascer) — ver offerVow/breakVow mais abaixo */
const VOWS: Record<string, { name: string; text: string; why: string }> = {
  mortos: { name: 'Voto contra a Morte que Anda', text: 'Nunca fugirei de um morto-vivo.', why: 'Você fugiu de um morto-vivo que o caçava.' },
  inocente: { name: 'Voto do Sangue Limpo', text: 'Nunca derramarei sangue inocente.', why: 'Você matou uma criatura que não fazia mal a ninguém.' },
  verdade: { name: 'Voto da Palavra', text: 'Nunca mentirei.', why: 'Você mentiu, e a mentira ficou registrada.' },
  misericordia: { name: 'Voto da Misericórdia', text: 'Nunca matarei quem se render.', why: 'Você matou quem tinha se rendido.' },
};
const VOW_FOR: Record<string, string[]> = { pal: ['mortos', 'misericordia', 'verdade'], cac: ['mortos', 'inocente', 'verdade'], gue: ['mortos', 'misericordia', 'verdade'], vam: ['inocente', 'misericordia', 'verdade'], lob: ['inocente', 'misericordia', 'verdade'], mag: ['verdade', 'inocente', 'misericordia'], bru: ['verdade', 'misericordia', 'inocente'], tec: ['verdade', 'inocente', 'misericordia'] };
type VowState = { id: string; secs: number; broken: boolean; titled: boolean } | null;
let vow: VowState = (() => { try { return JSON.parse(localStorage.getItem('karmika.vow') || 'null'); } catch { return null; } })();
const saveVow = () => { try { localStorage.setItem('karmika.vow', JSON.stringify(vow)); } catch { /* */ } };

const keepKarma = () => { if (soul.s.karma !== state.karma) { soul.s.karma = state.karma; soul.save(); } };
setInterval(keepKarma, 3000); addEventListener('beforeunload', keepKarma);
(window as unknown as { __k: unknown }).__k = state;

/* ---------- opções (salvas) ---------- */
interface Opts { /** acessibilidade: tamanho do texto (todo o jogo) e do chat */ txt: number; chat: number; ui: number; uis: number; res: number; pix: number; wratio: number; shadows: boolean; charShadows: boolean; shadowRes: number; bloom: number; particles: number; master: number; music: number; sfx: number; amb: number; fps: boolean; dmgText: boolean }
const OPT_DEF: Opts = { txt: 1, chat: 1, ui: 0, uis: 1, res: 1080, pix: 2, wratio: 2, shadows: true, charShadows: false, shadowRes: 1024, bloom: 1, particles: 1, master: 1, music: 1, sfx: 1, amb: 1, fps: true, dmgText: true };
const opts: Opts = (() => { try { return { ...OPT_DEF, ...(JSON.parse(localStorage.getItem('karmika.opts.v1') || 'null') ?? { pix: Number(localStorage.getItem('karmika.pix') || 0) || 2, shadows: localStorage.getItem('karmika.shadows') !== '0', music: localStorage.getItem('karmika.music') === '0' ? 0 : 1 }) }; } catch { return { ...OPT_DEF }; } })();
const saveOpts = () => localStorage.setItem('karmika.opts.v1', JSON.stringify(opts));
let PIX = Number(new URLSearchParams(location.search).get('pix')) || opts.pix;
let WORLD_RATIO = opts.wratio; // cenário em 1/WORLD_RATIO da resolução dos personagens // cada pixel do jogo vira PIXxPIX pixels da tela (visual pixel art); ?pix=1 só para inspeção
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- renderer em baixa resolução ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = opts.shadows; renderer.info.autoReset = false;
renderer.shadowMap.type = THREE.BasicShadowMap; // sombra dura: combina com pixel art e custa 1/4 do PCF
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.78;
if (import.meta.env.PROD) renderer.debug.checkShaderErrors = false; // no jogo instalado não confere cada shader (economiza ~1 s na abertura); no dev continua conferindo
const canvas = renderer.domElement;
const kshow = (s: string) => (window as unknown as { __kshow?: (m: string) => void }).__kshow?.(s);
renderer.debug.onShaderError = (gl, prog, vs, fs) => kshow('SHADER falhou:\n' + (gl.getProgramInfoLog(prog) || '') + '\n' + (gl.getShaderInfoLog(vs) || '') + '\n' + (gl.getShaderInfoLog(fs) || ''));
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); kshow('WebGL perdeu o contexto (GPU/driver). Recarregue a página.'); });
document.getElementById('game')!.appendChild(canvas);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050814);
scene.fog = new THREE.FogExp2(0x050814, 0.02);

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
objs.update(city.spawn.x * T, city.spawn.y * T, true);
scene.add(objs.group);
const particles = new Particles(7000);
const atmos = createAtmos(scene, particles, fine);

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
interface Profile { name: string; origin: 'human' | 'dwarf' | 'elf'; sex?: 'f' | 'm'; path?: string; hair: number; skin: number; title: string; eye?: boolean; hairStyle?: 'braid' | 'long' | 'short' | 'bald'; beard?: number }
const HAIRS = [0xe8dcc0, 0xb33a22, 0x2a1a14, 0xe8c66a, 0x7a4a2a, 0x4a2a6a], SKINS = [0xe8c8ae, 0xd9b08a, 0xb8865a, 0x7a5236];
let profile: Profile | null = null;
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
const fountainPos = fountain ? new THREE.Vector3((fountain.gx + fountain.w / 2) * T, 0, (fountain.gy + fountain.h / 2) * T) : new THREE.Vector3(1e4, 0, 1e4);
void LightShafts;
/* sem raios de luz */
void makeHalo;

let pvpOn = false; // PvP da facção ligado: posso ferir gente do meu lado (ou sem facção), com custo de karma; nome fica vermelho
let netRef: Net | null = null, lastGear: Parameters<Hero3D['setGear']>[0] | null = null, netMps = 0;
function hookHero() {
  { // a rede vê o que o herói veste e faz: roupa nova e cada golpe/magia vão para os outros jogadores
    const h = hero as Hero3D & { __net?: boolean }; if (!h.__net) { h.__net = true; const sg = h.setGear.bind(h), ac = h.act.bind(h);
      h.setGear = (g) => { lastGear = g; (window as unknown as { __lastGear?: unknown }).__lastGear = g; sg(g); netRef?.lookNow(); }; h.act = (a, f) => { const ok = ac(a, f); if (ok) netRef?.act(a); return ok; }; } }
  hero.onStep = () => {
    const tx = Math.floor(state.fx), ty = Math.floor(state.fy);
    const tile = city.map[ty]?.[tx];
    const zz = inside ? null : zoneW(tx, ty);
    const surf: Surface = inside ? (inside.crypt || inside.prop.kind !== 'house' ? 'stone' : 'wood') : swimmingNow || (tile === 'water') ? 'water' : tile === 'plaza' ? 'stone' : zz && zz.snow > 0.5 ? 'snow' : tile === 'grass' ? 'grass' : 'dirt';
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
let inside: { int: Interior; ret: { x: number; y: number }; prop: (typeof city.props)[number]; crypt?: number; dg?: string } | null = null;
const game = createGameplay({ scene, particles, camera, audio, canvas, getHero: () => hero, getRaceColor: () => RACE_COL[kindOf(state.race)], dummyPos: new THREE.Vector3(city.spawn.x * T + 5, 0, city.spawn.y * T - 1.5), world: { spawns: city.spawns, heightAt: (x, z) => (inside ? 0 : heightAt(x, z)), walkable: (x, z) => { if (inside) return inside.int.free(x - IX, z - IZ); const tx = Math.floor(x / T), ty = Math.floor(z / T); const t = city.map[ty]?.[tx]; return !!t && isWalkable(t); } } });
(window as unknown as { __k: unknown }).__k = { gh: (x: number, y: number) => groundH(x * T, y * T), info: () => ({ ...renderer.info.render, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }), hero: () => hero, game, quests: () => quests, npcs: () => npcSys, scene: () => scene, cam: () => camera, renderer, composer: () => composer, dual: () => dual, inv: () => inv, ride: (on: boolean) => setRiding(on), city, touch: touchRelic, build: () => build, tp: (x: number, y: number, n?: number) => { state.fx = x; state.fy = y; objs.update(x * T, y * T, true); if (n !== undefined) { nightOverride = n; nightTarget = n; state.night = n; } }, zoom: (z: number) => { zoomTarget = z; zoom = z; }, enter: (v: number) => { const p = city.props.find((q) => q.kind === 'house' && q.variant === v); if (p) enterHouse(p); }, mouse: (x: number, z: number) => { mouse.x = x; mouse.z = z; }, global: (id: string | null | undefined) => { gForce = id; gChkT = 0; luaK = id === 'lua' ? 1 : 0; aurK = id === 'aurora' ? 1 : 0; }, crypt: (f: number) => { const p = city.props.find((q) => q.kind === 'church' && q.variant === 2); if (p) enterCrypt(f, p); } };
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
  ...city.settlements.flatMap((st) => st.npcs.map((n, i) => ({ name: n.name, role: n.role, kind: n.kind, civil: civilFor(n.role, n.kind, n.x, n.y, st.x + i), x: n.x * T, z: n.y * T, radius: n.radius, tint: n.tint, scale: n.scale, lines: n.lines, night: n.night }))),
  // caravanas: mercadores viajantes que percorrem as estradas mais longas, com uma mula de carga
  ...[...city.roadPaths].map((p, i) => ({ p, i })).filter(({ p }) => p.length > 40).sort((a, b) => b.p.length - a.p.length).slice(0, 7).map(({ p, i }, k) => ({ name: ['Caravana de Gaspar', 'Caravana de Dagny', 'Caravana de Tomé', 'Caravana de Leonor', 'Caravana de Nori', 'Caravana de Inês', 'Caravana de Duarte'][k], role: 'Mercador viajante', kind: (i % 2 ? 'dwarf' : 'nordic') as 'dwarf' | 'nordic', civil: (i % 2 ? undefined : 'human') as 'human' | undefined, x: (p[0].x + 0.5) * T, z: (p[0].y + 0.5) * T, radius: 0, tint: 0xb08a40, scale: 1.0, lines: ['Estrada longa, bolso curto. O que procura?', 'Entre uma vila e outra tem lobo, tem chuva e tem lucro.', 'Compro o que você caçou. Vendo o que você esqueceu.'], route: p.map((q) => ({ x: (q.x + 0.5) * T, z: (q.y + 0.5) * T })) })),
], { heightAt, walkable: (x, z) => { const t = city.map[Math.floor(z / T)]?.[Math.floor(x / T)]; return !!t && isWalkable(t); }, camera, canvas });
/* ---------- árvore kármica de magias ---------- */
/* o nome da árvore segue quem você é agora: Humano/Humana até escolher o caminho; depois a classe, no feminino ou no masculino */
const FEM: Record<string, string> = { 'Humano': 'Humana', 'Guerreiro do Norte': 'Guerreira do Norte', 'Paladino de Auréon': 'Paladina de Auréon', 'Caçador de Demônios': 'Caçadora de Demônios', 'Vampiro': 'Vampira', 'Lobisomem': 'Mulher-Loba', 'Mago': 'Maga', 'Bruxo': 'Bruxa', 'Anão': 'Anã', 'Elfo': 'Elfa' };
const treeTitle = () => { let n = 'Humano'; try { n = game.classInfo.name || n; } catch { /* */ } return profile?.sex === 'f' ? FEM[n] ?? n : n; };
/* quem ainda não escolheu caminho (humano de origem, classe "Humano") usa a árvore e a barra do Humano */
/** armas de caminho (loot.ts, Only): o Caçador de Demônios e o Tecnocrata depois da prova do mestre; os anões pela raça */
function walksPath(o: Only): boolean { if (o === 'dwarf') return profile?.origin === 'dwarf'; try { return profile?.path === o && quests.q.done.includes('v_' + o); } catch { return false; } }
tipCtx.can = walksPath;
const kitRace = (): Race => { let n = 'Humano'; try { n = game.classInfo.name || n; } catch { /* */ } return state.race === 'nordic' && (profile?.origin ?? 'human') === 'human' && n === 'Humano' ? 'human' : kindOf(state.race) as Race; };
const tree = createSkillTree(kitRace, () => game.st.lvl, (t, c) => game.logMsg(t, c), treeTitle);
game.setSkillScale((id) => tree.scale(id));
let treeSel: string | null = null;
const SHOP_BY_NAME = new Map<string, string>(); for (const st of city.settlements) for (const n of st.npcs) if (n.shop) SHOP_BY_NAME.set(n.name, n.shop); for (const n of npcSys.npcs) if (n.def.role === 'Mercador viajante') SHOP_BY_NAME.set(n.def.name, 'mercador');
/* correio: caixas em cada povoado */
const mail = createMail({ me: () => profile?.name || RACES[state.race].label, st: game.st,
  town: () => { const hx = state.fx, hy = state.fy; let b = city.settlements[0]; for (const t of city.settlements) if (Math.hypot(t.x - hx, t.y - hy) < Math.hypot(b.x - hx, b.y - hy)) b = t; return b?.name ?? 'Karmika'; },
  items: () => Object.keys(inv.bag).filter((k) => inv.bag[k] > 0 && !isToolId(k)).map((id) => ({ id, n: inv.bag[id], name: ITEMS_TBL[id]?.name ?? id, icon: ITEMS_TBL[id]?.icon ?? '•' })),
  gear: () => inv.gearBag, take: (id, n) => inv.take(id, n), add: (id, n) => inv.add(id, n),
  takeGear: (uid) => { const i = inv.gearBag.findIndex((g) => g.uid === uid); if (i < 0) return null; const g = inv.gearBag.splice(i, 1)[0]; inv.save(); inv.refresh(); return g; },
  addGear: (g) => inv.addGear(g), itemName: (id) => ITEMS_TBL[id]?.name ?? id, itemIcon: (id) => ITEMS_TBL[id]?.icon ?? '•',
  log: (t, c) => game.logMsg(t, c), save: () => inv.save(), post: (l) => !!netRef && netRef.sendMail(l) });
/* profissões: coleta → ofício (Y) */
const profs = createProfessions({ atStation: (prof) => !!stationNear(prof), craftFx: (prof) => { const st = stationNear(prof); if (!st) return; hero.act('cast');
    const [c0, c1, n, up] = prof === 'ferreiro' ? [0xfff0a0, 0xff5a1a, 26, 3] : prof === 'alquimista' ? [0xc8ffd8, 0x3aff8a, 22, 1.6] : prof === 'cozinheiro' ? [0xffffff, 0xb8b0a0, 16, 1.2] : prof === 'marceneiro' ? [0xf0d8a8, 0xb08a5a, 20, 1.4] : [0xe8d8b8, 0x8a6a4a, 14, 1];
    for (let i = 0; i < n; i++) particles.spawn(st.x + (Math.random() - 0.5) * 1.2, heightAt(st.x, st.z) + 1.0, st.z + (Math.random() - 0.5) * 1.2, { vx: (Math.random() - 0.5) * 2, vy: up + Math.random() * up, vz: (Math.random() - 0.5) * 2, life: 0.7, s0: 0.12, s1: 0.02, c0, c1, a: 1, drag: 1.4 });
    if (prof === 'ferreiro') audio.hit(); else if (prof === 'alquimista') audio.cast(); else audio.thud(); }, onLevel: (_id, name, icon, l) => { profLevelUp(icon, name, l); audio.chime(); dispatchEvent(new CustomEvent('karmika:burst', { detail: { c0: 0xfff0b0, c1: 0x7ac85a, n: 26, small: true } })); }, has: (id, n) => inv.has(id, n), count: (id) => inv.count(id), take: (id, n) => inv.take(id, n), add: (id, n) => inv.add(id, n, true), addGear: (g) => inv.addGear(g),
  craftJob: (j) => craftJob(j), invCraft: (id) => inv.craft(id), itemName: (id) => ITEMS_TBL[id]?.name ?? id, itemIcon: (id) => ITEMS_TBL[id]?.icon ?? '•', heroLvl: () => game.st.lvl, log: (t, c) => game.logMsg(t, c), onCraft: (n) => quests.onCraft(n) });
/* ---------- trabalho na bancada (Erling, 23/10): o ícone do ofício no meio, uma barra girando em volta, som de trabalho,
   o herói trabalhando; cada peça pronta dá um brilho e soma no contador. Rápido: é para animar, não para esperar. ---------- */
const JOB: Record<string, { ic: string; verb: string; act: Parameters<typeof hero.act>[0]; snd: Parameters<typeof audio.work>[0]; beat: number; col: string }> = {
  ferreiro: { ic: '🔨', verb: 'Forjando', act: 'mine', snd: 'hammer', beat: 0.42, col: '#ff9a4a' },
  marceneiro: { ic: '🪚', verb: 'Serrando', act: 'chop', snd: 'saw', beat: 0.5, col: '#e8c890' },
  alquimista: { ic: '⚗️', verb: 'Preparando', act: 'herb', snd: 'brew', beat: 0.45, col: '#7aff9a' },
  cozinheiro: { ic: '🍳', verb: 'Cozinhando', act: 'herb', snd: 'cook', beat: 0.6, col: '#ffd27a' },
  costureiro: { ic: '🧵', verb: 'Costurando', act: 'herb', snd: 'sew', beat: 0.3, col: '#d8b8ff' },
  fogueira: { ic: '🔥', verb: 'Assando', act: 'herb', snd: 'cook', beat: 0.9, col: '#ff9a4a' },
};
const jobEl = document.createElement('div'); jobEl.id = 'craftjob'; document.body.appendChild(jobEl);
let job: { stop(why?: string): void } | null = null;
function craftJob(j: { prof: string; name: string; icon: string; times: number; step(k: number): boolean; can(): boolean }, onEnd?: () => void) {
  job?.stop(); const J = JOB[j.prof] ?? { ic: '⚒', verb: 'Fazendo', act: 'herb' as const, snd: 'carve' as const, beat: 0.5, col: '#ffe08a' };
  const PER = 1.15, x0 = state.fx, y0 = state.fy; let k = 0, t = 0, beatT = 0, last = performance.now(), raf = 0, alive = true;
  jobEl.innerHTML = `<div class="cj-ring"><svg viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="27"/><circle class="fg" cx="32" cy="32" r="27" style="stroke:${J.col}"/></svg><span class="cj-ic">${J.ic}</span><span class="cj-flash"></span></div>
    <div class="cj-txt"><b>${J.verb}: ${j.icon} ${j.name}</b><small><span class="cj-n">0</span> / ${j.times} · mova-se para parar</small></div><div class="cj-pop"></div>`;
  jobEl.classList.add('on'); const fg = jobEl.querySelector('.fg') as SVGCircleElement, C = 2 * Math.PI * 27; fg.style.strokeDasharray = `${C}`; fg.style.strokeDashoffset = `${C}`;
  const stop = (why?: string) => { if (!alive) return; alive = false; cancelAnimationFrame(raf); job = null; onEnd?.(); setTimeout(() => { if (!job) jobEl.classList.remove('on'); }, why ? 900 : 1300); if (why) game.logMsg(why, '#b9c6e0'); };
  job = { stop };
  const tick = () => { if (!alive) return; const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt; beatT -= dt;
    if (Math.hypot(state.fx - x0, state.fy - y0) > 0.5 || game.st.dead) { stop('Você parou o trabalho.'); return; }
    if (beatT <= 0) { beatT = J.beat; hero.act(J.act, true); audio.work(J.snd); }
    fg.style.strokeDashoffset = String(C * (1 - Math.min(1, t / PER)));
    if (t >= PER) { t = 0; const ok = j.step(k); if (!ok) { stop(k ? `⚒ Pronto: ${k}× ${j.name}.` : undefined); return; } k++;
      audio.craftDone(); (jobEl.querySelector('.cj-n') as HTMLElement).textContent = String(k);
      const fl = jobEl.querySelector('.cj-flash') as HTMLElement; fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
      const pop = jobEl.querySelector('.cj-pop') as HTMLElement; pop.textContent = `+1 ${j.icon}`; pop.classList.remove('go'); void pop.offsetWidth; pop.classList.add('go');
      if (k >= j.times || !j.can()) { stop(k > 1 ? `⚒ Pronto: ${k}× ${j.name}.` : undefined); return; } }
    raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
}
/** assar na fogueira (25/10): o herói se agacha, um espeto gira sobre o fogo com a carne (ou o peixe) dourando, chia e solta fumaça;
    cada peça pronta pula para a mochila. Assa tudo o que tiver; andar para. */
function roastAt(fx: number, fz: number) {
  const fy = heightAt(fx, fz), spit = new THREE.Group(); spit.position.set(fx, fy + 0.62, fz);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.3, 5).rotateZ(Math.PI / 2), new THREE.MeshToonMaterial({ color: 0x6a4a2a })); spit.add(stick);
  for (const sx of [-0.55, 0.55]) { const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.7, 4), stick.material); fork.position.set(sx, -0.3, 0); spit.add(fork); }
  const meatMat = new THREE.MeshToonMaterial({ color: 0xc8605a }), meat = new THREE.Group(); spit.add(meat);
  for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.11 + (i % 2) * 0.02, 7, 5), meatMat); m.scale.set(1.25, 0.9, 0.9); m.position.x = (i - 1) * 0.2; meat.add(m); }
  scene.add(fine(spit));
  let cur = inv.has('meat') ? 'meat' : 'fish'; const tint = (k: number) => meatMat.color.setHex(0xc8605a).lerp(new THREE.Color(cur === 'meat' ? 0x6a3410 : 0xb07a3a), k);
  const t0 = performance.now(); let alive = true;
  const spin = () => { if (!alive) return; const k = ((performance.now() - t0) / 1000) % 1.15 / 1.15; meat.rotation.x += 0.09; tint(k);
    if (Math.random() < 0.35) particles.spawn(fx + (Math.random() - 0.5) * 0.4, fy + 0.6, fz + (Math.random() - 0.5) * 0.2, { vy: 0.7 + Math.random() * 0.5, life: 1.6, s0: 0.12, s1: 0.5, c0: 0xc8c0b0, c1: 0x5a5450, a: 0.3, drag: 0.4, w: 0.5 });
    if (Math.random() < 0.2) particles.spawn(fx + (Math.random() - 0.5) * 0.3, fy + 0.55, fz, { vx: (Math.random() - 0.5) * 1.4, vy: 1 + Math.random(), vz: (Math.random() - 0.5) * 1.4, life: 0.35, s0: 0.07, s1: 0.02, c0: 0xfff0a0, c1: 0xff6a10, a: 1, g: 6 }); /* gordura que pinga e estala */
    requestAnimationFrame(spin); };
  requestAnimationFrame(spin);
  const done = () => { alive = false; scene.remove(spit); };
  craftJob({ prof: 'fogueira', name: cur === 'meat' ? 'Carne assada' : 'Peixe assado', icon: cur === 'meat' ? '🍖' : '🐟', times: inv.count('meat') + inv.count('fish'),
    step: () => { const raw = inv.has(cur) ? cur : inv.has('meat') ? 'meat' : inv.has('fish') ? 'fish' : null; if (!raw) return false; inv.take(raw); inv.add(raw === 'meat' ? 'cooked' : 'fishc', 1, true); cur = inv.has('meat') ? 'meat' : 'fish'; return true; },
    can: () => inv.has('meat') || inv.has('fish') }, done);
}
document.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-profgo]')) { inv.closeAll(); profs.toggle(); } });
/* Shop: a loja (Premium e brasões). Pix ainda não ligado; no DEV simula o pagamento */
const ownsUniq = (u: string) => [...inv.gearBag, ...Object.values(inv.eq)].some((g) => g?.uniq === u);
if (IS_DEV) { (window as unknown as { __mail: unknown }).__mail = mail; (window as unknown as { __cineJump: (t: number) => void }).__cineJump = (t: number) => { if (cine) cine.t = t; }; }
const loja = createLoja({ isPremium, fac: myFac, lvl: () => game.st.lvl, owns: ownsUniq, dev: IS_DEV, log: (t, c) => game.logMsg(t, c), until: premiumUntil,
  /* toda compra do Shop chega pelo correio: o Premium vem como Selo (use ou venda), as peças vêm como anexo */
  deliver: (subj, text, att) => { mail.send('Shop de Askavik', subj, text, att.map((a) => a.seal ? { item: { id: a.seal, n: 1 } } : { gear: { ...facGear(a.fac!, a.slot!, FAC_ILVL), shop: true } })); } });
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
onPremium((v) => { inv.refresh(); quests.render(); game.logMsg(v ? '✦ Premium ativo: Bolsa do Caminhante (36), Bolsa Mágica, Bolsa de Ofício, 10 missões.' : 'Premium desligado: bolsas Premium lacradas (nada se perde), 5 missões.', v ? '#c9a0ff' : '#b9c6e0'); });
/* barra de efeitos (buffs e debuffs) logo abaixo do letreiro do alto; a Bênção de Marghar do Premium mora aqui */
const buffEl = document.createElement('div'); buffEl.id = 'buffs'; document.body.appendChild(buffEl);
/* Eco da vida passada (Erling, 23/10): quem reencarna e escolhe a MESMA classe de antes ganha ×4 de XP de classe até o nível antigo.
   O símbolo (o Ouroboros de Karmika) fica aceso só quando vale; noutra classe ele aparece apagado, dizendo qual classe o acende.
   Aceso, a alma deixa um rastro violeta e dourado subindo dos pés do herói. */
const ECHO = (on: boolean) => `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10.5" fill="none" stroke="${on ? '#c9a0ff' : '#6a6070'}" stroke-width="3.2" stroke-dasharray="58 8"/><path d="M24.5 9.5l3.2-1.2-1.1 3.4z" fill="${on ? '#e6c46a' : '#6a6070'}"/><path d="M16 9.5l5 6.5-5 6.5-5-6.5z" fill="${on ? '#e6c46a' : '#4a4450'}"/><circle cx="16" cy="16" r="1.8" fill="#140a1e"/></svg>`;
function echoState() { const e = soul.s.catchup; if (!e) return null; let c = { name: 'Humano', lvl: 1 }; try { c = game.classInfo; } catch { /* */ } return { e, on: soul.sameClass(c.name, e.cls) && c.lvl < e.until }; }
const echoKey = () => { const q = echoState(); return q ? (q.on ? 'E1' : 'E0') : ''; };
const echoHtml = () => { const q = echoState(); if (!q) return ''; return q.on ? `<div class="bf bless echo" title="Eco da vida passada: você voltou ao caminho de ${q.e.cls}. A classe ganha ×${CATCHUP_MUL} de XP até o nível ${q.e.until}.">${ECHO(true)}<i>×${CATCHUP_MUL}</i></div>` : `<div class="bf echo off" title="Eco da vida passada (apagado): só se acende se você seguir de novo o caminho de ${q.e.cls}. Aí a classe ganha ×${CATCHUP_MUL} de XP até o nível ${q.e.until}.">${ECHO(false)}</div>`; };
setInterval(() => { try { if (inside || !profile || limiar.active) return; } catch { return; } const q = echoState(); if (!q?.on) return; const p = hero.root.position;
  for (let i = 0; i < 2; i++) { const a = Math.random() * 6.283, r = 0.45 + Math.random() * 0.25; particles.spawn(p.x + Math.cos(a) * r, p.y + 0.08, p.z + Math.sin(a) * r, { vx: -Math.sin(a) * 0.5, vy: 0.9 + Math.random() * 0.7, vz: Math.cos(a) * 0.5, life: 1.1 + Math.random() * 0.5, s0: 0.1, s1: 0.02, c0: Math.random() < 0.5 ? 0xc9a0ff : 0xffd27a, c1: 0x3a1a5a, a: 0.85, drag: 0.6 }); } }, 140);
const BLESS = `<svg viewBox="0 0 32 32"><path d="M3 16c4-6 8.5-9 13-9s9 3 13 9c-4 6-8.5 9-13 9S7 22 3 16z" fill="#2a1a3a" stroke="#e6c46a" stroke-width="1.6"/><circle cx="16" cy="16" r="4.5" fill="#c9a0ff"/><circle cx="16" cy="16" r="1.8" fill="#140a1e"/><path d="M16 2v4M16 26v4M4 6l3 3M28 6l-3 3" stroke="#e6c46a" stroke-width="1.2"/></svg>`;
let buffKey = '';
setInterval(() => { const L = game.buffs(); const prem = isPremium();
  let eqF: Fac[] = []; try { eqF = [...new Set((['cape', 'shield', 'relic'] as Slot[]).map((sl) => inv.eq[sl]?.fac).filter((f): f is Fac => !!f))]; } catch { /* */ }
  const key = echoKey() + (vow ? vow.id + vow.broken + Math.floor(vow.secs / 60) : '') + (prem ? 'P' : '') + eqF.join() + L.map((b) => b.id + Math.ceil(b.t ?? 0)).join(); if (key === buffKey) return; buffKey = key;
  buffEl.innerHTML = echoHtml() + (vow ? `<div class="bf ${vow.broken ? 'neg' : 'vow'}" title="${vow.broken ? `Voto quebrado: “${VOWS[vow.id]?.text}”. A bênção se apagou.` : `${VOWS[vow.id]?.name}: “${VOWS[vow.id]?.text}” — Bênção do Voto: +5% de XP enquanto mantiver.${vow.titled ? '' : ` Faltam ${Math.max(0, Math.ceil((3 * 3600 - vow.secs) / 60))} min de jogo fiel para o título.`}`}">${vow.broken ? '⛓' : '✦'}</div>` : '') + eqF.map((f) => `<div class="bf fac ${f}" title="${FAC[f].name} — “${FAC[f].motto}”. Você carrega o brasão deste lado.${inv.eq.relic?.fac === f ? ' A relíquia acende o sigilo aos seus pés.' : ''}"><img src="${crestURL(f)}" alt=""></div>`).join('') + (prem ? `<div class="bf good bless" title="Bênção de Marghar (Premium): conforto no dia a dia — Bolsa do Caminhante, Bolsa Mágica e de Ofício, 10 missões. Nunca dá força.">${BLESS}</div>` : '') + L.map((b) => `<div class="bf ${b.good ? 'good' : 'bad'}" title="${b.name}: ${b.tip}"><span>${b.ic}</span>${b.t !== undefined ? `<i>${Math.ceil(b.t)}</i>` : ''}</div>`).join(''); }, 250);
/* a bênção também aparece aos pés do herói: uma runa violeta e dourada que gira devagar */
const blessRune = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; g.strokeStyle = '#e6c46a'; g.lineWidth = 3; g.beginPath(); g.ellipse(32, 32, 24, 13, 0, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#c9a0ff'; g.beginPath(); g.arc(32, 32, 7, 0, Math.PI * 2); g.fill(); g.fillStyle = '#140a1e'; g.beginPath(); g.arc(32, 32, 3, 0, Math.PI * 2); g.fill();
  const tx = new THREE.CanvasTexture(c); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, opacity: 0.85 })); sp.scale.setScalar(0.42); sp.visible = false; scene.add(sp); return sp; })();
/* o sigilo da facção no chão: aparece quando a relíquia do lado está equipada (o Fio gira devagar e brilha em ouro; os Desfiados giram ao contrário, em brasa) */
const facSigil = (() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.8, blending: THREE.AdditiveBlending, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 3; m.visible = false; scene.add(m); return m; })();
let facNow: Fac | null = null;
function updateFacSigil(t: number) {
  let rf: Fac | null = null; try { rf = inv.eq.relic?.fac ?? facOf(inv.eq.relic?.base) ?? null; } catch { /* */ }
  if (rf !== facNow) { facNow = rf; const mt = facSigil.material as THREE.MeshBasicMaterial; mt.map = rf ? sigilTexture(rf) : null; mt.needsUpdate = true; }
  facSigil.visible = !!rf && !inside; if (!rf) return;
  const hp = hero.root.position, mt = facSigil.material as THREE.MeshBasicMaterial; facSigil.position.set(hp.x, hp.y + 0.05, hp.z);
  facSigil.rotation.z = rf === 'fio' ? t * 0.22 : -t * 0.35; mt.opacity = rf === 'fio' ? 0.62 + Math.sin(t * 1.6) * 0.12 : 0.55 + Math.max(0, Math.sin(t * 5.3) * Math.sin(t * 1.1)) * 0.3; // a brasa dos Desfiados pisca irregular
}
/* a Vidente dos Caminhos (Askavik, nível 30) */
const vid = createVidente({ karma: () => state.karma, name: () => profile?.name || 'Caminhante',
  onChoose: (p, rev) => {
    if (!profile) return; profile.path = p ? p.id : 'humano'; localStorage.setItem('karmika.char.v1', JSON.stringify(profile));
    if (!quests.q.done.includes('p01') && quests.q.active['p01'] && quests.complete(quests.def('p01'))) quests.turnIn(quests.def('p01'));
    if (!p) { quests.accept({ id: 'v_hum', chain: 'O Caminho Humano', name: 'A Beleza de Ser Comum', lvl: 30, giver: 'Hrefna', turnin: 'Gunnar', text: `A Deusa viu em você o ${rev.name}, mas você escolheu esperar. Isso também é um caminho, e dos mais difíceis: o de quem não tem dom e mesmo assim fica de pé. Volte a Karmika e procure Gunnar, o construtor. Toda vida comum começa com uma casa.`, objs: [{ kind: 'talk', npc: 'Gunnar' }], xp: 900, gold: 80 });
      game.logMsg('👁 Hrefna: “Esperar também é escolher. A vida comum tem a sua própria beleza.”', '#c9a0ff'); return; }
    const objs: { kind: 'talk' | 'visit'; npc?: string; poi?: string }[] = [];
    if (p.id === 'pal') objs.push({ kind: 'talk', npc: 'Paladino Aldric' });
    if (p.id !== 'tec') objs.push({ kind: 'visit', poi: p.village });
    const mentor = p.id === 'tec' ? 'Arquiteta Ylva' : p.mentor; objs.push({ kind: 'talk', npc: mentor });
    /* a prova do mestre: cada caminho tem a sua */
    const TRIAL: Record<string, [string, unknown]> = { gue: ['6× Lobo Gélido', { kind: 'kill', type: 'frostwolf', n: 6 }], pal: ['8× Zumbi', { kind: 'kill', type: 'zombie', n: 8 }], cac: ['6× Carniçal', { kind: 'kill', type: 'ghoul', n: 6 }], tec: ['forjar 3 vezes Pregos', { kind: 'craft', recipe: 'Pregos', n: 3 }], vam: ['6× Morcego', { kind: 'kill', type: 'bat', n: 6 }], lob: ['1× Lobisomem', { kind: 'kill', type: 'werewolf', n: 1 }], mag: ['6× Fada Maliciosa', { kind: 'kill', type: 'fairy', n: 6 }], bru: ['6× Diabrete', { kind: 'kill', type: 'imp', n: 6 }] };
    (objs as unknown[]).push(TRIAL[p.id][1]);
    quests.accept({ id: 'v_' + p.id, chain: 'O Caminho: ' + p.name, name: `O Caminho do ${p.name}`, lvl: 30, giver: 'Hrefna', turnin: mentor, text: `${p.line} Vá até ${p.place}${p.id === 'pal' ? ', levado pelo Paladino Aldric,' : ''} e apresente-se a ${mentor}. A prova: ${TRIAL[p.id][0]}. Ao passar e aceitar o mestre, a sua barra de classe recomeça do zero, sem volta.`, objs: objs as never, xp: 1200, gold: 100 });
    game.logMsg(`👁 Hrefna: “${p.mentor} espera por você. Que a Deusa encurte a sua estrada.”`, '#c9a0ff');
  } });
queueMicrotask(() => quests.setOnDone?.((d) => { if (!d.id.startsWith('v_') || d.id === 'v_hum') { if (d.id === 'v_hum') game.logMsg('🏠 O Caminho Humano começa: casa, ofício, terra e gente.', '#ffe08a'); return; }
  const p = PATHS.find((x) => 'v_' + x.id === d.id); if (!p) return; if (game.changeClass(p.cls)) { tree.migrate(); applyKit(kitRace(), game.st.lvl, (k) => tree.rank(k)); applyRes(); setTimeout(() => offerVow(p.id), 3500); game.logMsg(`✦ Você agora trilha o caminho de ${p.cls}. A barra de classe recomeça do zero e a Árvore Kármica é a da sua classe.`, p.col); game.dmgText(heroPosNow().clone().setY(heroPosNow().y + 3), p.cls.toUpperCase(), true, p.col);
    /* a primeira classe já é o lado (Erling, 22/10): Fio = paladino, caçador, mago; Desfiados = vampiro, lobisomem, bruxo.
       Guerreiro (caótico neutro) e tecnocrata (neutro de verdade) ficam neutros; uma missão do mestre valida o alinhamento depois. */
    const side = ({ pal: 'fio', cac: 'fio', mag: 'fio', vam: 'desf', lob: 'desf', bru: 'desf' } as Record<string, Fac>)[p.id] ?? null;
    setMyFac(side); netRef?.lookNow();
    game.logMsg(side ? `⚑ O seu caminho jura com ${FAC[side].name}. “${FAC[side].motto}.”` : '⚖ O seu caminho é neutro. Uma missão do seu mestre vai validar o seu alinhamento.', side === 'fio' ? '#d9b45a' : side === 'desf' ? '#e0303a' : '#c8d8f0'); } }));
/* menu do Esc: atalhos para as janelas de verdade */
setInterval(() => { if (!game.st.menuOpen) return; const set = (id: string, t: string) => { const el = document.getElementById(id); if (el) el.textContent = t; };
  set('m-acc', profile?.name ? `${profile.name} (local)` : 'local'); set('m-plan', isPremium() ? '✦ Premium' : 'Gratuito'); set('m-name', profile?.name || RACES[state.race].label); set('m-lvl', `${game.st.lvl} · ${game.classInfo.name}`); set('m-karma', String(Math.round(state.karma))); set('m-gold', String(game.st.gold)); }, 500);
document.querySelectorAll<HTMLButtonElement>('#menu nav button[data-go]').forEach((b) => b.addEventListener('click', () => { const g = b.dataset.go; game.toggleMenu(false); keys.clear();
  if (g === 'exit') exitToMenu(); else if (g === 'quit') { saveAllNow(); setTimeout(() => window.close(), 150); } }));
/* sair do jogo: guarda tudo e volta à tela inicial (escolha de personagem e de sala) */
function saveAllNow() { try { dispatchEvent(new Event('beforeunload')); } catch { /* */ } try { inv.save?.(); soul.save(); } catch { /* */ } }
function exitToMenu() { saveAllNow(); if (inside) leaveInteriorNow(); setTimeout(() => { if (location.search.includes('play')) location.href = location.pathname; else location.reload(); }, 120); }
/* ---------- andar de consumíveis (F1–F8) ---------- */
const QUICK_ORDER = ['potion', 'potion_g', 'mana', 'tonic', 'antidote', 'stew', 'skewer', 'cooked', 'fishc', 'sausage', 'jerky', 'bread', 'apple', 'beer', 'mead'];
const quickEl = document.createElement('div'); quickEl.id = 'quick'; document.body.appendChild(quickEl);
let quickOpen = localStorage.getItem('karmika.quick') !== '0', quickIds: (string | null)[] = [];
/* F1–F8: o jogador arrasta da mochila o que quiser (pergaminhos, comida, poções); espaços sem item fixo se preenchem sozinhos */
let quickPins: (string | null)[] = (() => { try { const a = JSON.parse(localStorage.getItem('karmika.quickpins') || 'null'); if (Array.isArray(a)) return Array.from({ length: 8 }, (_, i) => a[i] ?? null); } catch { /* */ } return Array(8).fill(null); })();
const saveQuickPins = () => { try { localStorage.setItem('karmika.quickpins', JSON.stringify(quickPins)); } catch { /* */ } };
function renderQuick() {
  try { const pinned = new Set(quickPins.filter(Boolean) as string[]); const auto = QUICK_ORDER.filter((id) => !pinned.has(id) && inv.has(id)); quickIds = quickPins.map((p) => p ?? auto.shift() ?? null); } catch { return; }
  const cell = (id: string | null, i: number) => { const pin = !!quickPins[i]; if (!id) return `<div class="slot q empty" data-qs="${i}"><kbd>F${i + 1}</kbd></div>`; const n = inv.count(id), it = ITEMS_Q(id);
    return `<div class="slot q ${pin ? 'pin' : ''} ${n ? '' : 'none'}" data-q="${i}" data-qs="${i}" title="${it.name}: ${it.desc}${pin ? ' — fixado (botão direito solta)' : ''}"><kbd>F${i + 1}</kbd><span class="ic">${it.icon}</span><b class="n">${n}</b></div>`; };
  quickEl.innerHTML = `<button class="qtog" title="Mostrar/esconder acesso rápido (F1–F8). Arraste itens da mochila para cá.">${quickOpen ? '▼' : '▲'}</button>` + (quickOpen ? quickIds.map(cell).join('') : '');
  quickEl.classList.toggle('open', quickOpen);
}
addEventListener('karmika:quickpin', (e) => { const { id, slot } = (e as CustomEvent<{ id: string; slot: number }>).detail; const k = quickPins.indexOf(id); if (k >= 0) quickPins[k] = null;
  const at = slot >= 0 ? slot : quickPins.findIndex((p, i) => !p && !quickIds[i]) >= 0 ? quickPins.findIndex((p, i) => !p && !quickIds[i]) : quickPins.findIndex((p) => !p); if (at < 0) return;
  quickPins[at] = id; saveQuickPins(); renderQuick(); game.logMsg(`⚡ ${ITEMS_Q(id).name} no acesso rápido (F${at + 1})`, '#ffe08a'); });
function useQuick(i: number) { const id = quickIds[i]; if (!id) { game.logMsg('Espaço vazio — arraste da mochila poções, comida ou pergaminhos para cá.', '#b9c6e0'); return; } if (!inv.count(id)) { game.logMsg(`Sem ${ITEMS_Q(id).name} na mochila.`, '#ff9a8a'); return; } inv.use(id); const el = quickEl.querySelector(`[data-q="${i}"]`); el?.classList.add('on'); setTimeout(() => el?.classList.remove('on'), 180); renderQuick(); }
quickEl.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('.qtog')) { quickOpen = !quickOpen; localStorage.setItem('karmika.quick', quickOpen ? '1' : '0'); renderQuick(); return; } const q = (t.closest('[data-q]') as HTMLElement | null)?.dataset.q; if (q !== undefined) useQuick(+q); });
quickEl.addEventListener('contextmenu', (e) => { const q = (e.target as HTMLElement).closest('[data-qs]') as HTMLElement | null; if (!q) return; e.preventDefault(); const i = +q.dataset.qs!; if (quickPins[i]) { quickPins[i] = null; saveQuickPins(); renderQuick(); } });
quickEl.addEventListener('dragover', (e) => { e.preventDefault(); });
/** equipamentos visíveis no herói (espada, escudo, elmo) */
function syncGear() { try { const eq = inv.eq; const wt = work ? inv.tool(WORK[work.kind].slot) : fishing ? inv.tool('rod') : null; /* trabalhando: a ferramenta continua na mão */ hero.setGear({ weapon: wt ? { base: wt.base, rarity: 'normal', tint: wt.tint, glow: wt.glow } : eq.weapon ? { base: eq.weapon.base, rarity: eq.weapon.rarity } : null, shield: eq.shield ? { base: eq.shield.base, rarity: eq.shield.rarity, seed: eq.shield.uid } : null, helm: eq.helm && localStorage.getItem('karmika.showHelm') !== '0' ? { base: eq.helm.base, rarity: eq.helm.rarity } : null, cape: eq.cape ? { base: eq.cape.base, rarity: eq.cape.rarity } : null, shoulders: eq.shoulders ? { base: eq.shoulders.base, rarity: eq.shoulders.rarity } : null }); checkSkinLevel(); game.setWeapon(wt ? null : eq.weapon?.base ?? null); } catch { /* inventário ainda não criado */ } }
/* ---------- companheiros: pet coletor e montaria ---------- */
let pet: ReturnType<typeof createPet> | null = null, mount: ReturnType<typeof createMount> | null = null, riding = false;
function setRiding(on: boolean, quiet = false) {
  if (on && !riding) setTimeout(() => feats.bump('rides'), 0);
  if (riding === on) return; if (on && !mount) return;
  riding = on; hero.riding = on; if (!on) mount?.hide(); if (!quiet) game.logMsg(on ? `🐴 Você monta ${mount!.kind.name}.` : '🐴 Você desmonta.', '#e0c080');
}
const mules = npcSys.npcs.filter((n) => n.def.route).map((n) => ({ n, pet: createPet(scene, { id: 'mule', name: 'Mula de carga', quad: 'horse', tint: 0x6a5a4a, scale: 0.8, speed: 3.2, silent: true }, (x, z) => heightAt(x, z)) }));
function updateMules(dt: number, t: number) { for (const m of mules) { const far = Math.hypot(m.n.pos.x - heroPos.x, m.n.pos.z - heroPos.z) > 70; m.pet.root.visible = !far && !inside; if (far || inside) continue; m.pet.update(dt, t, m.n.pos, m.n.yaw, null, camera, canvas); } }
function updateCompanions(dt: number, t: number, heroYaw: number, mps: number) {
  updateMules(dt, t);
  const petId = Object.keys(PETS).find((id) => inv.has(id)) ?? null;
  if (petId && (!pet || pet.kind.id !== petId)) { pet?.dispose(); pet = createPet(scene, PETS[petId], (x, z) => inside ? 0 : heightAt(x, z)); }
  if (!petId && pet) { pet.dispose(); pet = null; }
  if (pet) { pet.root.visible = !inside; const goal = inside || combatMode ? null : game.petFetch(pet.pos, heroPos); pet.update(dt, t, heroPos, heroYaw, goal, camera, canvas); }
  const mountId = Object.keys(MOUNTS).find((id) => inv.has(id)) ?? null;
  if (mountId && (!mount || mount.kind.id !== mountId)) { if (riding) setRiding(false, true); if (mount) scene.remove(mount.root); mount = createMount(scene, MOUNTS[mountId]); }
  if (!mountId && mount) { setRiding(false, true); scene.remove(mount.root); mount = null; }
  if (riding && (inside || combatMode || swimmingNow || hero.acting)) setRiding(false, hero.acting);
  if (riding && mount) mount.update(dt, t, heroPos, heroYaw, mps);
}
const inv = createInventory(game, {
  priceK: (shop) => shopLeanK(shop), xpBonus: () => (vowKept() ? 0.05 : 0) + luaBonus() /* Lua de Sangue: o Faro da Lua ligado rende mais */,
  canWear: (g) => g.only && !walksPath(g.only) ? `Só ${ONLY_NAME[g.only]} empunham ${g.name}.${g.only === 'dwarf' ? '' : ' Esse caminho se abre com a Vidente, no nível 30.'}` : null,
  onGear: () => syncGear(), onBag: () => renderQuick(),
  onUse: (id) => { const SEAL: Record<string, number> = { seal_p30: 30, seal_p90: 90, seal_p365: 365 };
    if (id === 'lagrima') { confirmBox('Trocar uma <b>Lágrima do Olho</b> por <b>7 dias de Premium</b>?<br><small>Ela não volta. Guardada, ela paga uma volta da alma no Limiar.</small>', 'Trocar', () => { if (!inv.take('lagrima', 1)) return; addPremiumDays(7); game.logMsg('💧 A Lágrima se desfaz em luz: +7 dias de Bênção de Marghar (Premium).', '#c9a0ff'); }); return true; }
    if (SEAL[id]) { if (!inv.take(id, 1)) return true; addPremiumDays(SEAL[id]); const d = Math.ceil((premiumUntil() - Date.now()) / 864e5); game.logMsg(`✦ Selo de Marghar rompido: +${SEAL[id]} dias de Premium (${d} dias no total).`, '#c9a0ff'); return true; }
    if (id === 'scroll_return') {
    if (inside) { game.logMsg('📜 O caminho não se abre entre paredes. Saia para o céu aberto.', '#ff9a8a'); return true; }
    const hp = heroPosNow(), hunted = game.enemies.list.some((e) => e.alive && e.active && (e.state === 'chase' || e.state === 'windup') && Math.hypot(e.pos.x - hp.x, e.pos.z - hp.z) < 16);
    if (hunted) { game.logMsg('📜 Há inimigos atrás de você — a Deusa não abre caminho no meio da luta.', '#ff9a8a'); return true; }
    if (combatMode) setCombat(false);
    inv.take('scroll_return', 1); openPortal(); game.logMsg('📜 O pergaminho se desfaz em luz violeta.', '#b8a8ff'); return true; } if (id === 'tome') { inv.take('tome', 1); tree.addBonus(5); return true; } if (MOUNTS[id]) { if (!mount) return false; if (!riding && (combatMode || inside || swimmingNow)) { game.logMsg('Não dá para montar aqui (saia do combate).', '#ff9a8a'); return true; } inv.closeAll(); setRiding(!riding); return true; } if (PETS[id]) { game.logMsg(`${ITEMS_NAME(id)} já está com você — ele busca os itens caídos.`, '#e8dcc0'); return true; } return false; },
  portrait: () => { portraits.delete('hero'); try { return portraitOf('hero', hero.root, true); } catch { return null; } }, title: () => `${(profile?.name ?? '')}${quests?.title ? ' · ' + quests.title : ''}`.trim() || RACES[state.race].label,
  raceLabel: () => RACES[state.race].label, karma: () => state.karma, xpNeed: game.xpNeed,
  soul: () => { soul.regen(); const r: [string, string][] = [['Fio da Vida', `${game.st.lvl < FRAY_LVL || !profile?.eye ? `intacto até o Olho abrir (nível ${FRAY_LVL})` : `${'●'.repeat(soul.s.breaths)}${'○'.repeat(MAX_BREATHS - soul.s.breaths)}${soul.s.breaths < MAX_BREATHS ? ` · +1 em ${soul.nextBreathH()}h` : ''}`} · 💧 ${inv.count('lagrima')}`]];
    if (soul.s.debt > 0) r.push(['Dívida Kármica', `${soul.s.debt.toLocaleString('pt-BR')} XP`]);
    if (soul.s.catchup) r.push(['Eco da vida passada', `${soul.s.catchup.cls} ×${CATCHUP_MUL} até ${soul.s.catchup.until}`]);
    if (soul.s.lives.length) { const l = soul.s.lives[soul.s.lives.length - 1]; r.push([`Vidas passadas: ${soul.s.lives.length}`, `última: ${originName(l.origin)}, ${l.cls} ${l.clsLvl}`]); }
    return r; }, onCraft: (n) => { quests?.onCraft(n); feats.bump('crafts'); },
  placeFire: () => { const gx = Math.floor(state.fx), gy = Math.floor(state.fy); const t0 = city.map[gy]?.[gx]; if (t0 !== 'grass' && t0 !== 'road') { game.logMsg('Não dá para acender aqui.', '#ff9a8a'); return false; } if (nearProps(gx, gy, ['campfire'], 1).length) { game.logMsg('Já existe uma fogueira aqui.', '#ff9a8a'); return false; } const p = { kind: 'campfire' as const, gx, gy, w: 1, h: 1, height: 0.6, wall: 0x4a4a4a, roof: 0xff8a2a }; objs.addProp(p); idx(p); return true; },
});
{ const orig = game.logMsg; game.logMsg = (t: string, c?: string) => { orig(t, c); if (t.startsWith('📜') || t.startsWith('✅') || t.startsWith('👁') || t.startsWith('✦') || t.startsWith('🏅')) chat.sys(t); }; }
syncGear(); renderQuick();
/* a arma salva só aparecia depois de trocar de novo: nesta linha o jogo ainda não terminou de montar (trabalho/pesca ainda não existem)
   e a chamada falhava em silêncio. Repete assim que tudo estiver de pé. */
setTimeout(() => syncGear(), 0);
/* ---------- construção ---------- */
const build = createBuild({ world: city, scene, objs, has: (id, n) => inv.has(id, n), take: (id, n) => inv.take(id, n), add: (id, n) => inv.add(id, n), log: (t, c) => game.logMsg(t, c), heightAt,
  canBuildAt: (gx, gy) => !city.settlements.some((st) => Math.hypot(gx - st.x, gy - st.y) < st.radius + 2) && !city.pois.some((q) => Math.hypot(gx - q.x, gy - q.y) < 6) && city.map[gy]?.[gx] !== 'water' });
build.load();
/* ---------- dock de janelas (canto inferior direito): mochila, personagem, magias, missões, feitos, mapa ---------- */
const dockEl = document.createElement('div'); dockEl.id = 'dock';
const DOCK_ICONS: Record<string, string> = {
  inv: `<svg viewBox="0 0 32 32"><path d="M8 12h16l2 14H6z" fill="#8a4a2a" stroke="#3a1a0a" stroke-width="1.4"/><path d="M11 12V9a5 5 0 0110 0v3" fill="none" stroke="#3a1a0a" stroke-width="2"/><rect x="12" y="16" width="8" height="5" rx="1" fill="#e2b04a" stroke="#3a1a0a" stroke-width="1"/></svg>`,
  char: `<svg viewBox="0 0 32 32"><circle cx="16" cy="11" r="5.5" fill="#f1d2b6" stroke="#3a1a0a" stroke-width="1.4"/><path d="M6 28c1-7 5-10 10-10s9 3 10 10z" fill="#6a7a9a" stroke="#3a1a0a" stroke-width="1.4"/><path d="M11 7q5-5 10 0" fill="#b33a22"/></svg>`,
  skills: `<svg viewBox="0 0 32 32"><path d="M16 3l2.6 8.4L27 14l-8.4 2.6L16 25l-2.6-8.4L5 14l8.4-2.6z" fill="#ffe08a" stroke="#7a4a10" stroke-width="1.2"/><path d="M25 22l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#fff0bd"/></svg>`,
  quests: `<svg viewBox="0 0 32 32"><path d="M9 5h14a3 3 0 013 3v16a3 3 0 01-3 3H9a3 3 0 01-3-3V8a3 3 0 013-3z" fill="#e8d6a8" stroke="#5a3a1a" stroke-width="1.4"/><path d="M11 11h10M11 15h10M11 19h6" stroke="#7a5a2a" stroke-width="1.6" stroke-linecap="round"/><path d="M6 8q3 2 0 4M26 8q-3 2 0 4" fill="none" stroke="#5a3a1a" stroke-width="1.4"/></svg>`,
  feats: `<svg viewBox="0 0 32 32"><path d="M11 3h4l1 8h-4zM17 3h4l-1 8h-4z" fill="#b3202f"/><circle cx="16" cy="19" r="8" fill="#e2b04a" stroke="#7a4a10" stroke-width="1.4"/><circle cx="16" cy="19" r="4.5" fill="none" stroke="#fff0bd" stroke-width="1.4"/></svg>`,
  map: `<svg viewBox="0 0 32 32"><path d="M4 8l8-3 8 3 8-3v19l-8 3-8-3-8 3z" fill="#d8c8a0" stroke="#5a3a1a" stroke-width="1.4"/><path d="M12 5v19M20 8v19" stroke="#5a3a1a" stroke-width="1.2"/><path d="M7 14q4-2 8 1t8-1" fill="none" stroke="#4a8ab0" stroke-width="1.6"/><circle cx="16" cy="18" r="2" fill="#b3202f"/></svg>`,
};
DOCK_ICONS.karma = `<svg viewBox="0 0 32 32"><path d="M3 16c4-6 8-9 13-9s9 3 13 9c-4 6-8 9-13 9S7 22 3 16z" fill="#1a1208" stroke="#d9a24f" stroke-width="1.8"/><circle cx="16" cy="16" r="5" fill="#f2b04a"/><path d="M16 13l3 3-3 3-3-3z" fill="#1a1208"/></svg>`;
DOCK_ICONS.opts = `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="6" fill="none" stroke="#e8d6a8" stroke-width="2.2"/><path d="M16 3v5M16 24v5M3 16h5M24 16h5M7 7l3.5 3.5M21.5 21.5L25 25M25 7l-3.5 3.5M10.5 21.5L7 25" stroke="#e8d6a8" stroke-width="2.4" stroke-linecap="round"/></svg>`;
DOCK_ICONS.prof = `<svg viewBox="0 0 32 32"><path d="M6 26l11-11" stroke="#8a5a2a" stroke-width="3" stroke-linecap="round"/><path d="M14 6l8-2 6 6-2 8-4-4-4 1-1-4z" fill="#c8ccd4" stroke="#3a3d44" stroke-width="1.3"/><path d="M20 24l6 0" stroke="#e8d6a8" stroke-width="2"/></svg>`;
DOCK_ICONS.loja = `<svg viewBox="0 0 32 32"><path d="M5 13h22l-2 14H7z" fill="#3a2614" stroke="#d9b45a" stroke-width="1.6" stroke-linejoin="round"/><path d="M5 13l3-6h16l3 6" fill="#5a3a1c" stroke="#d9b45a" stroke-width="1.6" stroke-linejoin="round"/><path d="M11 20c2-3 3.5-4 5-4s3 1 5 4c-2 3-3.5 4-5 4s-3-1-5-4z" fill="#2a1a3a" stroke="#e6c46a" stroke-width="1.1"/><circle cx="16" cy="20" r="1.6" fill="#c9a0ff"/></svg>`;
DOCK_ICONS.coop = `<svg viewBox="0 0 32 32"><circle cx="11" cy="11" r="4.5" fill="#9ad0ff" stroke="#1a2a3a" stroke-width="1.3"/><circle cx="21" cy="11" r="4.5" fill="#ffd88a" stroke="#3a2a0a" stroke-width="1.3"/><path d="M3 27c.8-6 4-9 8-9s7.2 3 8 9z" fill="#4a6a9a" stroke="#1a2a3a" stroke-width="1.3"/><path d="M13 27c.8-6 4-9 8-9s7.2 3 8 9z" fill="#9a6a2a" stroke="#3a2a0a" stroke-width="1.3"/></svg>`;
DOCK_ICONS.relics = `<svg viewBox="0 0 32 32"><path d="M10 28V10l6-6 6 6v18z" fill="#3a3a5a" stroke="#9ab4ff" stroke-width="1.4"/><path d="M13 14h6M13 18h6M13 22h6" stroke="#9ab4ff" stroke-width="1.4"/></svg>`;
/* dock em quadradinhos, embaixo do chat (canto inferior esquerdo): um quadrado para cada janela do jogo */
const DOCK: [string, string, string][] = [['inv', 'Mochila', 'I'], ['char', 'Personagem', 'C'], ['skills', 'Árvore Kármica (magias)', 'K'], ['quests', 'Missões', 'J'], ['feats', 'Conquistas — Inscrições de Marghar', 'L'], ['karma', 'Compêndio do Karma', 'U'], ['prof', 'Profissões', 'Y'], ['loja', 'Shop — Premium e brasões', 'T'], ['map', 'Mapa', 'M'], ['coop', 'Jogar junto — abrir sala ou entrar com convite', 'F4'], ['opts', 'Opções e configurações', 'Esc']];
dockEl.innerHTML = DOCK.map(([d, t, k]) => `<button data-d="${d}" title="${t} (${k})">${DOCK_ICONS[d] ?? ''}<small>${k}</small></button>`).join('');
document.body.appendChild(dockEl);
const skillsEl = document.createElement('div'); skillsEl.id = 'skillsw'; skillsEl.className = 'modalw'; document.body.appendChild(skillsEl);
const featsEl = document.createElement('div'); featsEl.id = 'featsw'; featsEl.className = 'modalw'; document.body.appendChild(featsEl);
/* Inscrições de Marghar (conquistas): aviso dourado no alto da tela quando uma se grava */
const featToast = (f: Feat) => { const d = document.createElement('div'); d.className = 'feattoast'; d.innerHTML = `<i>${CATS[f.cat].icon}</i><div><small>Inscrição de Marghar</small><b>${f.name}</b><span>${f.desc}</span></div>`; document.body.appendChild(d); requestAnimationFrame(() => d.classList.add('on')); setTimeout(() => d.classList.remove('on'), 5200); setTimeout(() => d.remove(), 6200); try { audio.chime(); } catch { /* */ } };
const feats = createFeats({ xp: (f) => game.gainXp(Math.max(5, Math.round(game.xpNeed() * f))), gold: (n) => { game.st.gold += n; }, toast: (f) => { featToast(f); game.logMsg(`🏅 Inscrição de Marghar: ${f.name}`, '#ffe08a'); } });
(window as unknown as { __feats: unknown }).__feats = feats;
floatWin(skillsEl, 'skills', { left: '22vw', top: '5vh' }); floatWin(featsEl, 'feats', { left: '30vw', top: '8vh' });
setTimeout(() => { const ql = document.getElementById('qlog'); if (ql) floatWin(ql, 'qlog', { left: '34vw', top: '9vh' }); }, 0);
let skillsOpen = false, featsOpen = false;
function renderSkills() {
  tree.migrate();
  tree.render(skillsEl, treeSel, (id) => { treeSel = id; renderSkills(); }, (id) => { const r0 = tree.rank(id); if (tree.invest(id)) { const r1 = tree.rank(id); audio.rune([3, 6, 10].includes(r1) && r1 > r0 ? 1 : 0); applyKit(kitRace(), game.st.lvl, (k) => tree.rank(k)); renderSkills(); } });
  { /* a passiva de classe mora aqui também: um clique liga/desliga (igual a tecla F) */ const top = skillsEl.querySelector('.tree-top'); if (top) { const I = myInstinct(), d = document.createElement('div'); d.className = 'instcard' + (instinctOn ? ' on' : ''); d.style.setProperty('--ic', I.css);
    d.innerHTML = `<i>✧</i><div><b>${I.name}</b><small>Passiva de classe · ${instinctOn ? 'ligada' : 'desligada'} · tecla F</small><p>${I.desc} Com ela ligada você vê rastros, espíritos, dispositivos perdidos e esconderijos que ninguém mais vê; desligada, só a ameaça de verdade te acorda.</p></div><button data-inst>${instinctOn ? 'Desligar' : 'Ligar'}</button>`;
    top.after(d); d.querySelector('[data-inst]')!.addEventListener('click', (e) => { e.stopPropagation(); toggleInstinct(); renderSkills(); }); } }
  skillsEl.style.display = 'flex';
}
let featTab: keyof typeof CATS | null = null;
function renderFeats() {
  const done = quests.q.done.length, titles = quests.title ? [quests.title] : [];
  const cats = Object.keys(CATS) as (keyof typeof CATS)[]; if (!featTab) featTab = cats[0];
  const tot = feats.doneCount(), all = FEATS.length, pct = Math.round(tot / all * 100);
  const stat = (v: string | number, l: string) => `<div class="fs"><b>${v}</b><small>${l}</small></div>`;
  const cnt = (c: keyof typeof CATS) => [FEATS.filter((f) => f.cat === c && feats.isDone(f.id)).length, FEATS.filter((f) => f.cat === c).length];
  const list = FEATS.filter((f) => f.cat === featTab).map((f) => ({ f, ok: feats.isDone(f.id), v: Math.min(f.goal, feats.count(f.key)) })).sort((x, y) => Number(y.ok) - Number(x.ok) || y.v / y.f.goal - x.v / x.f.goal);
  featsEl.innerHTML = `<div class="pn ftpn2"><h2>🏅 Inscrições de Marghar <button data-x>✕</button></h2>
    <div class="ft-top"><div class="ft-ring" style="--p:${pct}"><div><b>${tot}</b><small>de ${all}</small></div></div>
      <div class="ft-side"><p class="ftlore">Em cada relíquia há linhas de runas que mudam sozinhas: os feitos de quem passou por ali. Não pesam na balança — são memória. E atravessam a Ampulheta: quem desencarna perde o nome e o ouro, mas não as Inscrições.</p>
        <div class="ft-stats">${stat(game.st.lvl, 'nível')}${stat(game.st.kills, 'abates')}${stat(done, 'missões')}${stat(`${relicsKnown.size}/${city.relics.length}`, 'relíquias')}${stat(build.built.length, 'construções')}${stat(Math.round(state.karma), 'karma')}${stat(titles.length ? titles.join(', ') : '—', 'título')}${stat(profile?.eye ? 'aberto' : 'dormindo', 'Olho')}</div></div></div>
    <div class="ft-tabs">${cats.map((c) => { const [d, n] = cnt(c); return `<button data-ft="${c}" class="${c === featTab ? 'on' : ''}"><i>${CATS[c].icon}</i><span>${CATS[c].name}</span><small>${d}/${n}</small><u><em style="width:${n ? d / n * 100 : 0}%"></em></u></button>`; }).join('')}</div>
    <p class="ft-cl">${CATS[featTab].lore}</p>
    <div class="ft-grid">${list.map(({ f, ok, v }) => { const p = Math.round(v / f.goal * 100); return `<div class="ft-card ${ok ? 'ok' : v > 0 ? 'go' : 'off'}"><div class="ft-medal" style="--p:${ok ? 100 : p}"><i>${ok ? '✦' : CATS[f.cat].icon}</i></div>
      <div class="ft-tx"><b>${f.name}</b><small>${f.desc}</small>${ok ? '<em class="okt">inscrita</em>' : f.goal > 1 ? `<em>${v}/${f.goal}</em>` : '<em>ainda não</em>'}</div></div>`; }).join('')}</div>
    <small class="ft">Esc fecha</small></div>`;
  featsEl.style.display = 'flex';
}
featsEl.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('[data-ft]') as HTMLElement | null; if (b) { featTab = b.dataset.ft as keyof typeof CATS; renderFeats(); } });
function toggleSkills(on?: boolean) { skillsOpen = on ?? !skillsOpen; if (skillsOpen) renderSkills(); else skillsEl.style.display = 'none'; }
function toggleFeats(on?: boolean) { featsOpen = on ?? !featsOpen; if (featsOpen) renderFeats(); else featsEl.style.display = 'none'; }
for (const [el, fn] of [[skillsEl, toggleSkills], [featsEl, toggleFeats]] as [HTMLElement, (on?: boolean) => void][]) el.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-x]') || t === el) fn(false); });
dockEl.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (!b) return; keys.clear(); const d = b.dataset.d; if (d === 'inv') inv.toggle(); else if (d === 'char') inv.toggleChar(); else if (d === 'skills') toggleSkills(); else if (d === 'quests') quests.toggleLog(); else if (d === 'feats') toggleFeats(); else if (d === 'map') toggleBigMap(); else if (d === 'prof') profs.toggle(); else if (d === 'loja') loja.toggle(); else if (d === 'karma') compendium.toggle(); else if (d === 'coop') coop.toggle(); else if (d === 'opts') { game.toggleMenu(true); (document.querySelector('#menu [data-p="p-opt"]') as HTMLElement | null)?.click(); } });
game.setOnItem((id, n) => inv.add(id, n));
game.setOnGear((g) => inv.addGear(g));
/* leilão do Quadro de Avisos: vender, não só pedir (compras e vendas passam pelo correio) */
const auction = createAuction({ me: () => profile?.name || RACES[state.race].label, lvl: () => game.st.lvl, st: game.st,
  items: () => Object.entries(inv.bag).filter(([id, n]) => n > 0 && ITEMS_TBL[id]).map(([id, n]) => ({ id, n, name: ITEMS_TBL[id].name, icon: ITEMS_TBL[id].icon, sell: ITEMS_TBL[id].sell ?? 0, kind: ITEMS_TBL[id].kind })), gear: () => inv.gearBag,
  take: (id, n) => inv.take(id, n), takeGear: (uid) => { const i = inv.gearBag.findIndex((g) => g.uid === uid); if (i < 0) return null; const g = inv.gearBag.splice(i, 1)[0]; inv.save(); inv.refresh(); return g; },
  itemName: (id) => ITEMS_TBL[id]?.name ?? id, itemIcon: (id) => ITEMS_TBL[id]?.icon ?? '•', itemKind: (id) => ITEMS_TBL[id]?.kind ?? 'res', itemValue: (id) => ITEMS_TBL[id]?.sell ?? 1,
  mail: (from, subj, text, att) => mail.send(from, subj, text, att), log: (t, c) => game.logMsg(t, c), save: () => inv.save() });
const quests = createQuests({ lean: () => soulLean(), origin: () => profile?.origin ?? 'human', auction, karma: (dk) => { state.karma = Math.max(-100, Math.min(100, state.karma + dk)); }, me: () => profile?.name || RACES[state.race].label, roleOf: (nm) => { const n = npcSys.npcs.find((q) => q.def.name === nm); return n && !/mercador viajante|^shop$|tecelagem/i.test(n.def.role) ? n.def.role : null; }, st: game.st, count: inv.count, take: inv.take, add: (id, n) => inv.add(id, n), gainXp: (n) => game.gainXp(n), xpNeedAt: game.xpNeedAt, gear: (n, lvl) => game.spawnGear(state.fx * T, state.fy * T, heightAt(state.fx * T, state.fy * T), Math.max(2, lvl), { rare: 4, legendary: 3, relic: 2 }, n, 'rare'), log: (t, c) => game.logMsg(t, c), onTitle: (t) => { if (profile) { profile.title = t; localStorage.setItem('karmika.char.v1', JSON.stringify(profile)); } updateWho(); heroicAct(`Título conquistado: ${t}`); }, chainQuests: [...HUMAN_ROAD, ...SIDE, ...WARRIOR, ...PALADIN, ...VAMPIRE, ...TECHNO, ...WEREWOLF, ...RACE_INSTINCT],
  room: { on: () => netRef?.state === 'on', posts: () => netRef?.posts ?? [], add: (item, n, gold) => netRef?.postAdd({ item, name: ITEMS_TBL[item]?.name ?? item, icon: ITEMS_TBL[item]?.icon ?? '•', n, gold, note: '' }),
    fill: (id, item, n) => netRef?.postFill(id, [{ item: { id: item, n } }]), cancel: (id) => netRef?.postCancel(id) } });
(window as unknown as { __quests?: unknown }).__quests = quests;
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
  const dark = k <= -20 || p === 'vam' || p === 'lob' || p === 'bru', light = k >= 20 || p === 'pal' || p === 'mag';
  if (id === 'lua') return dark ? 1 : light ? -1 : 0;
  if (id === 'aurora') return light ? 1 : dark ? -1 : 0;
  return 0;
}
function globalSideText(id: string | null) { const sd = globalSide(id); if (!sd) return ''; return id === 'lua' ? (sd > 0 ? 'A Lua te alimenta: +20% de dano, −12% de dano recebido.' : 'A Lua caça os de alma clara: +10% de dano recebido.') : (sd > 0 ? 'A Aurora te abençoa: +20% de dano, −12% de dano recebido.' : 'A luz da Aurora te queima: +10% de dano recebido.'); }
function luaBonus() { try { return instinctOn && myPath() === 'lob' && globalNow()?.id === 'lua' ? 0.15 : 0; } catch { return 0; } }
function shopLeanK(shop: string): number { if (shop === 'latao') return latoK() * shopLeanK('_'); const L = soulLean(); if (!L) return 1; return L === 'sombra' ? (LIGHT_SHOPS.has(shop) ? 1.15 : DARK_SHOPS.has(shop) ? 0.95 : 1) : (DARK_SHOPS.has(shop) ? 1.1 : LIGHT_SHOPS.has(shop) ? 0.95 : 1); }
/** o caminho que o herói já trilha de verdade (passou na prova do mestre) */
function myPath(): string | null { const p = profile?.path; if (!p || p === 'humano') return null; try { return quests.q.done.includes('v_' + p) ? p : null; } catch { return null; } }
/* ---------- Juramentos de roleplay (24/10): ao entrar na classe, o herói pode jurar um voto que o jogo vigia.
   Manter: Bênção do Voto (+5% de XP) e, depois de 3 horas de jogo fiel, o título. Quebrar: perde a bênção, −6 de karma,
   o nome fica manchado e os NPCs comentam. Não é obrigatório: é roleplay com peso. ---------- */
function vowKept() { return !!vow && !vow.broken; }
function breakVow(id: string) { if (!vow || vow.broken || vow.id !== id) return; vow.broken = true; saveVow(); state.karma = Math.max(-100, state.karma - 6); (soul.s.marks ??= []).push('voto_quebrado'); soul.s.sombra = (soul.s.sombra ?? 0) + 3; soul.save(); game.st.xpMul = Math.max(1, game.st.xpMul - 0.05);
  game.logMsg(`⛓ Você quebrou o ${VOWS[id].name}. ${VOWS[id].why} A bênção se apaga, e o seu nome fica manchado.`, '#ff8a7a'); setTimeout(() => eyeSees('O Olho guardou.', `Quebrou o voto: “${VOWS[id].text}”`, `${VOWS[id].why} Ninguém obrigou você a jurar. Por isso pesa.`, -6), 500); }
function offerVow(path: string) {
  const ids = VOW_FOR[path] ?? Object.keys(VOWS);
  openDlg({ name: 'O Olho', role: 'Marghar vê', portrait: null, text: 'Todo caminho começa com uma palavra. Se quiser, jure um voto. O jogo não esquece: manter dá bênção; quebrar mancha o nome.',
    choices: [...ids.map((id) => ({ kind: 'custom' as const, label: `“${VOWS[id].text}”`, hint: VOWS[id].name, cb: () => { vow = { id, secs: 0, broken: false, titled: false }; saveVow(); game.st.xpMul += 0.05; game.logMsg(`✦ Você jurou: “${VOWS[id].text}” Bênção do Voto: +5% de XP enquanto mantiver.`, '#ffe08a'); } })),
      { kind: 'close' as const, label: 'Não juro nada. Minha palavra é minha.' }], onAccept: () => {}, onTurnIn: () => {} });
}
/* Voto contra a Morte que Anda: quem esteve a menos de 12 m de um morto-vivo que o caçava e agora está a mais de 35 m dele, com ele vivo, fugiu */
const UNDEAD = new Set(['zombie', 'skeleton', 'ghoul', 'bishop']); const undeadNear = new Map<object, number>();
setInterval(() => { if (!vow || vow.broken || vow.id !== 'mortos' || cine || game.st.dead) { undeadNear.clear(); return; } const hp = heroPosNow(), now = performance.now();
  for (const e of game.enemies.list) { if (!UNDEAD.has(e.type) || !e.alive) { undeadNear.delete(e); continue; } const d = Math.hypot(e.pos.x - hp.x, e.pos.z - hp.z);
    if (d < 12 && e.state === 'chase') undeadNear.set(e, now); const t0 = undeadNear.get(e); if (t0 !== undefined && now - t0 < 60000 && d > 35) { undeadNear.clear(); breakVow('mortos'); return; } if (t0 !== undefined && now - t0 >= 60000) undeadNear.delete(e); } }, 1000);
setInterval(() => { if (!vow || vow.broken || vow.titled || cine) return; vow.secs += 5; if (vow.secs >= 3 * 3600) { vow.titled = true; const T = { mortos: 'Inabalável', inocente: 'Mãos Limpas', verdade: 'Palavra de Ferro', misericordia: 'O Misericordioso' }[vow.id] ?? 'Fiel ao Voto'; quests.q.title = T; if (profile) { profile.title = T; localStorage.setItem('karmika.char.v1', JSON.stringify(profile)); } game.logMsg(`🏅 Três horas fiel ao voto. Título: ${T}.`, '#ffe08a'); } saveVow(); }, 5000);
function hasMark(m: string) { return (soul.s.marks ?? []).includes(m); }
function applyReply(r: Reply) {
  const before = soulLean();
  if (r.luz) soul.s.luz = (soul.s.luz ?? 0) + r.luz; if (r.sombra) soul.s.sombra = (soul.s.sombra ?? 0) + r.sombra;
  if (r.karma) state.karma = Math.max(-100, Math.min(100, state.karma + r.karma));
  if (r.flag && !hasMark(r.flag)) (soul.s.marks ??= []).push(r.flag);
  if (r.flag?.startsWith('mentiu')) breakVow('verdade');
  soul.save(); const after = soulLean();
  if (after !== before) setTimeout(() => game.logMsg(after === 'luz' ? '☀ Algo em você se aquece. Há portas que agora se abrem para quem é como você.' : after === 'sombra' ? '☾ Algo em você esfria. Gente de outra espécie começa a reparar em você.' : '⚖ A sua alma volta ao meio do caminho.', after === 'luz' ? '#ffe9a8' : after === 'sombra' ? '#b9a0ff' : '#c8c0b0'), 900);
}
const openDlg = (o: Parameters<typeof dlg.open>[0]) => dlg.open({ me: profile?.name || 'Caminhante', lean: soulLean, onReply: (r) => applyReply(r), ...o });
/* comandos de teste do beta (chat): /morrer, /folegos N, /lagrimas N, /nivel N, /ajuda */
const BETA_TOOLS = true;
function betaCommand(cmd: string, a: string[]): string | null {
  if (!BETA_TOOLS) return null; const n = Math.round(Number(a[0]));
  if (cmd === 'ajuda' || cmd === 'help') return 'Teste (beta): /morrer · /folegos 0-3 · /lagrimas 0-3 · /nivel 1-60 · /limiar (abre o Limiar sem morrer) · /masmorra [nome] (vai até a entrada) · /guerreiro (vira guerreiro do Norte) · /ir <NPC ou lugar> (ex.: /ir hrefna)';
  if (cmd === 'morrer') { if (game.st.dead) return 'Você já caiu.'; game.st.hp = 1; game.damage(99999, hero.root.position); return `☠ Você caiu de propósito. Fôlegos antes da queda: ${soul.s.breaths}/${MAX_BREATHS}${game.st.lvl < FRAY_LVL ? ` (antes do nível ${FRAY_LVL}, com o Olho ainda dormindo, o Fio não se gasta: use /nivel ${FRAY_LVL})` : ''}.`; }
  if (cmd === 'folegos' || cmd === 'fôlegos') { if (!(n >= 0 && n <= MAX_BREATHS)) return `Uso: /folegos 0-${MAX_BREATHS}`; soul.s.breaths = n; soul.s.regenAt = Date.now(); soul.save(); return `🕯 Fio da Vida: ${n}/${MAX_BREATHS}.`; }
  if (cmd === 'lagrimas' || cmd === 'lágrimas') { if (!(n >= 0 && n <= 9)) return 'Uso: /lagrimas 0-9'; const c = inv.count('lagrima'); if (n > c) inv.add('lagrima', n - c, true); else if (n < c) inv.take('lagrima', c - n); return `💧 Lágrimas do Olho na mochila: ${n}.`; }
  if (cmd === 'nivel' || cmd === 'nível') { if (!(n >= 1 && n <= 60)) return 'Uso: /nivel 1-60'; const d = n - game.st.lvl; game.st.lvl = n; game.st.xp = 0; if (d > 0) game.st.points += d * 3; game.st.recalc?.(); game.st.hp = game.st.hpMax; inv.save?.();
    if (n < FRAY_LVL && profile?.eye) { profile.eye = false; localStorage.setItem('karmika.char.v1', JSON.stringify(profile)); crestEl.classList.remove('awake'); return `★ Nível ${n} (teste). O Olho voltou a dormir: ele abre de novo no nível ${FRAY_LVL}.`; }
    return `★ Nível ${n} (teste).${n >= FRAY_LVL && !profile?.eye ? ' O Olho vai abrir.' : ''}`; }
  if (cmd === 'masmorra' || cmd === 'masmorras') { const id = (a[0] || '').toLowerCase(), en = dgs.entrances.find((e) => e.d.id === id || e.d.name.toLowerCase().includes(id) && id.length > 2);
    if (!id || !en) return 'Masmorras: ' + dgs.entrances.map((e) => `${e.d.id} (${e.lvl[0]}–${e.lvl[1]})`).join(' · ') + ' — use /masmorra <nome> para ir até a entrada.';
    if (inside) return 'Saia do interior primeiro.'; state.fx = en.x + 0.5; state.fy = en.y + 3; return `🕳 Você está na entrada de ${en.d.name} (nível ${en.lvl[0]}–${en.lvl[1]}). Aperte E para entrar.`; }
  if (cmd === 'ir') { const q = a.join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''), nz = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!q) return 'Uso: /ir <NPC ou lugar> — ex.: /ir hrefna · /ir askavik · /ir brasaforja'; if (inside) return 'Saia do interior primeiro.';
    const n = npcSys.npcs.find((v) => nz(v.def.name).includes(q)); if (n) { state.fx = n.pos.x / T; state.fy = n.pos.z / T + 1.2; return `🧭 Você está ao lado de ${n.def.name}. Aperte E para conversar.`; }
    const p = city.settlements.find((v) => nz(v.name).includes(q)) ?? city.pois.find((v) => nz(v.name).includes(q)); if (p) { state.fx = p.x + 0.5; state.fy = p.y + 2; return `🧭 Você chegou a ${p.name}.`; }
    return `Não achei “${a.join(' ')}”.`; }
  if (cmd === 'guerreiro') { if (!profile) return 'Agora não.'; profile.path = 'gue'; localStorage.setItem('karmika.char.v1', JSON.stringify(profile)); quests.markDone('v_gue'); applyArtSkin(); return '⚔ Caminho do Guerreiro do Norte (teste). Vista uma roupa para ver o modelo do guerreiro.'; }
  if (cmd === 'limiar') { if (!profile || limiar.active) return 'Agora não.'; soul.s.pending = 'choose'; soul.save(); unbind(); return '👁 A alma sobe ao Limiar (teste).'; }
  return null;
}
/* Lágrimas viraram item de mochila (dá para guardar, trocar e vender): as antigas da alma passam para a mochila;
   quem já tinha o Olho aberto recebe a Lágrima do nascimento que não ganhou */
setTimeout(() => { if (soul.s.tears > 0) { inv.add('lagrima', soul.s.tears, true); soul.s.tears = 0; soul.save(); }
  if (profile?.eye && !soul.s.born) { soul.s.born = true; soul.save(); inv.add('lagrima', 1, true); game.logMsg('💧 Marghar se emocionou quando o seu Olho abriu: a Lágrima do nascimento está na sua mochila.', '#9ad7ff'); } }, 2500);
const chat = createChat({ me: () => profile?.name || RACES[state.race].label, command: betaCommand, onSay: (text, ch, to) => { if (ch === 'whisper' && to) { netRef?.whisper(to, text); return; } bubble(text); netRef?.say(text); } });
/* jogar junto: os outros Caminhantes da sala aparecem no mundo (cada um com o próprio save) */
const net = createNet({ scene, camera, canvas,
  look: () => ({ kind: kindOf(state.race), opts: profile ? { hair: profile.hair, skin: profile.skin, hairStyle: profile.hairStyle, beard: profile.beard, ears: profile.origin === 'elf' } : {}, gear: lastGear, skin: netSkin, name: profile?.name || RACES[state.race].label, lvl: game.st.lvl, cls: (document.getElementById('who')?.textContent || '').trim() || 'Caminhante', karma: Math.round(state.karma), fac: myFac(), path: myPath(), lean: soulLean() }),
  st: () => { const p = hero.root.position; const zn = inside ? (inside.crypt ? `crypt:${inside.crypt}` : `in:${inside.prop.gx},${inside.prop.gy}`) : 'world';
    return { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), f: +hero.root.rotation.y.toFixed(3), m: +netMps.toFixed(2), zn, hp: Math.round(100 * game.st.hp / Math.max(1, game.st.hpMax)), ...(hero.combat ? { cb: 1 as const } : {}), ...(hero.guard ? { gd: 1 as const } : {}), ...(hero.riding ? { rd: 1 as const } : {}), ...(hero.kneel ? { kn: 1 as const } : {}), ...(pvpOn ? { ag: 1 as const } : {}) }; },
  chat: (name, text, w) => chat.recv(name, text, w ? 'whisper' : 'local', w ? (profile?.name || '') : undefined),
  sys: (text, color) => { game.logMsg(text, color); chat.sys(text); },
  joined: (name) => { // aviso de chegada: som, um selo na tela e, se a janela estiver em segundo plano, notificação do sistema
    audio.chime(); badge('✧', 'chegou ao mundo', name, 'join');
    try { if (!document.hasFocus() && 'Notification' in window) { const go = () => new Notification('Karmika', { body: `${name} entrou no mundo.` }); if (Notification.permission === 'granted') go(); else if (Notification.permission !== 'denied') Notification.requestPermission().then((p) => { if (p === 'granted') go(); }); } } catch { /* */ } },
  mail: (l) => { mail.receive(l as Parameters<typeof mail.receive>[0]); },
  posts: () => { quests.refreshBoard(); },
  connected: () => { mail.flush(); },
  partyInvite: (from, name, lvl) => coop.partyInvite(from, name, lvl),
  showProfile: (id, p) => coop.showProfile(id, p),
  profile: () => { // o que os outros veem ao abrir o meu perfil
    const k = Math.round(state.karma), align = k >= 60 ? 'Luz radiante' : k >= 20 ? 'Luminoso' : k > -20 ? 'Equilibrado' : k > -60 ? 'Sombrio' : 'Trevas';
    let portrait: string | null = null; try { portraits.delete('hero'); portrait = portraitOf('hero', hero.root, true); } catch { /* */ }
    const gear = Object.entries(inv.eq).filter(([, g]) => !!g).map(([slot, g]) => ({ slot, name: g!.name, rarity: RARITY[g!.rarity].name, icon: g!.icon, col: RARITY[g!.rarity].col }));
    const done = FEATS.filter((f) => feats.isDone(f.id)); const top = [...done].sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0) || b.goal - a.goal).slice(0, 6);
    const fac = myFac();
    return { name: profile?.name || RACES[state.race].label, lvl: game.st.lvl, cls: (document.getElementById('who')?.textContent || '').trim() || 'Caminhante', title: quests?.title ?? '', karma: k, align, fac: fac ? FAC[fac].name : null, portrait,
      gear, feats: top.map((f) => ({ name: f.name, desc: f.desc, icon: CATS[f.cat].icon })), featCount: done.length, featTotal: FEATS.length, kills: game.st.kills ?? 0, quests: quests.q.done.length, lives: soul.s.lives.map((l) => ({ name: l.name, race: originName(l.origin), cls: l.cls, lvl: l.lvl })) };
  },
});
netRef = net;
/* jogar junto, etapa 2: os monstros do mundo são os mesmos para todos da sala (quem luta com o bicho conduz; golpes e mortes vão para todos) */
{ const inParty = (id: number) => !!net.party && net.party.members.includes(id) && id !== net.myId;
  const partyNear = () => { if (!net.party || inside) return 1; const p = hero.root.position; let n = 1; for (const r of net.remotes()) if (inParty(r.id) && r.zn === 'world' && r.pos.distanceTo(p) < 45) n++; return n; };
  game.setNet({ myId: () => net.myId, hit: (id, n) => net.x('x:hit', { e: id, n }), die: (id) => net.x('x:die', { e: id }), cast: (id, x, z, i) => net.x('x:cast', { e: id, x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, i }) }, partyNear);
  net.onX('x:mob', (from, m) => game.enemies.netIn(from, m.l as (number | string)[][]));
  net.onX('x:hit', (_f, m) => game.enemies.netHit(String(m.e), m.n as number));
  net.onX('x:cast', (_f, m) => { if (!inside || inside.crypt || inside.dg) game.enemies.netCast(String(m.e), m.x as number, m.z as number, m.i as number); });
  net.onX('x:die', (from, m) => { const e = game.enemies.netDie(String(m.e)); // companheiro de grupo perto: a morte conta para mim também (XP, missão, meu saque)
    if (e && inParty(from) && !inside && !game.st.dead && Math.hypot(e.pos.x - hero.root.position.x, e.pos.z - hero.root.position.z) < 45) game.sharedKill(e); });
  /* missões do grupo: o que eu pego aparece para os companheiros (com "Pegar também") */
  quests.setOnAccept((d) => { if (net.state === 'on' && net.party && d.giver !== 'O Olho') net.x('x:pq', { d }); });
  /* masmorra em grupo: quem chega pede o estado; quem já está dentro conta o que caiu e se o portão abriu */
  net.onX('x:dgin', (from, m) => { if (!inParty(from) || !inside?.dg || inside.dg !== m.id || m.inst !== dgInst()) return; const sn = dgs.snapshot(); if (sn) net.x('x:dgsnap', { to: from, ...sn }); game.logMsg(`⚔ ${net.nameOf(from)} entrou na masmorra.`, '#ffd27a'); });
  net.onX('x:dgsnap', (from, m) => { if (m.to !== net.myId || !inParty(from)) return; dgs.applySnapshot(m as never); });
  net.onX('x:dgwin', (from, m) => { if (inParty(from)) game.logMsg(`🏆 ${net.nameOf(from)} e o grupo venceram ${dgs.entrances.find((e) => e.d.id === m.id)?.d.name ?? 'a masmorra'}!`, '#ffd24a'); });
  net.onX('x:pq', (from, m) => { if (!inParty(from)) return; const d = m.d as Parameters<typeof quests.accept>[0], nm = net.nameOf(from); coop.questShare(nm, d, quests.shareState(d), () => quests.accept(d, nm)); });
  setInterval(() => { pvp.tick(); }, 500);
  setInterval(() => { if (net.state !== 'on' || (inside && !inside.crypt && !inside.dg)) return; const l = game.enemies.netOut(); if (l.length) net.x('x:mob', { l }); }, 100); }
const coop = createCoop(net, { pvpToggle: () => pvp.toggle(), pvpOn: () => pvpOn, toMenu: () => inicio.open(), mailTo: (n) => mail.compose(n), duel: (id) => pvp.challenge(id), whisperTo: (n) => chat.whisperTo(n), myHp: () => Math.round(100 * game.st.hp / Math.max(1, game.st.hpMax)) });
(window as unknown as { __net?: unknown }).__net = net;
setTimeout(() => { (window as unknown as { __pvp?: unknown }).__pvp = pvp; (window as unknown as { __mail?: unknown }).__mail = mail; }, 0);
/* ===== PvP (jogar junto) — regra do Erling, 22/10/2026 =====
   - Facções DIFERENTES se atacam livremente, sem custo de karma (ninguém é obrigado a lutar).
   - MESMA facção (ou quem ainda não jurou lado) não se fere, a não ser que o atacante LIGUE o "PvP da facção":
     aí o nome dele fica vermelho e cada vítima nova custa karma (−3 no primeiro golpe, −15 se matar).
   - Revidar quem atacou primeiro nunca custa karma. Companheiros de grupo não se ferem. Vila é chão sagrado.
   - Duelo: combinado pelos dois, vale em qualquer lugar, ninguém morre (acaba quando um chega a 10% da vida). */
const pvp = (() => {
  const hostile = new Map<number, number>(); // quem me atacou → até quando posso revidar sem culpa
  const struck = new Map<number, number>(); // quem eu (mesmo lado) já ataquei: o karma só cai no primeiro golpe de cada 2 min
  let duel = 0, duelGo = 0;
  const safeAt = (x: number, z: number) => city.settlements.some((s) => Math.hypot(x / T - s.x, z / T - s.y) < s.radius);
  /** os dois são de facções diferentes (e ambos juraram lado)? */
  const rivals = (theirs: string | null) => { const mine = myFac(); return !!mine && !!theirs && mine !== theirs; };
  function hitPlayers(cx: number, cz: number, yaw: number, reach: number, arc: number, n: number, crit: boolean) {
    if (net.state !== 'on' || inside || game.st.dead) return;
    const now = Date.now();
    for (const r of net.remotes()) {
      if (r.zn !== 'world') continue;
      const dx = r.pos.x - cx, dz = r.pos.z - cz, dd = Math.hypot(dx, dz); if (dd > reach + 0.45) continue;
      if (arc < Math.PI) { let a = Math.atan2(dx, dz) - yaw; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; if (dd > 1.2 && Math.abs(a) > arc + 0.25) continue; }
      const isDuel = duel === r.id && now > duelGo;
      if (!isDuel) {
        if (net.party?.members.includes(r.id)) continue; // companheiro de grupo não se acerta
        if (safeAt(cx, cz) || safeAt(r.pos.x, r.pos.z)) continue; // vila é chão sagrado
        const revenge = (hostile.get(r.id) ?? 0) > now;
        if (!rivals(r.fac) && !revenge) { // mesmo lado (ou sem facção): só com o PvP da facção ligado, e custa karma
          if (!pvpOn) continue;
          if (!((struck.get(r.id) ?? 0) > now)) { state.karma = Math.max(-100, state.karma - 3); game.logMsg(`⚔ Você atacou ${r.name}, do seu próprio lado. O karma pesa (−3).`, '#ff8a7a'); }
          struck.set(r.id, now + 120000);
        }
      }
      net.x('x:pvp', { to: r.id, n, c: crit ? 1 : 0, d: isDuel ? 1 : 0, x: +cx.toFixed(1), z: +cz.toFixed(1) });
      game.dmgText(r.pos.clone().setY(r.pos.y + 2.3), n, crit, isDuel ? '#ffd88a' : '#ff7a6a');
    }
  }
  game.setPvp(hitPlayers);
  net.onX('x:pvp', (from, m) => {
    if (m.to !== net.myId || game.st.dead) return;
    const fromPos = new THREE.Vector3(m.x as number, 0, m.z as number), n = m.n as number;
    if (m.d) { if (duel !== from) return; // duelo: ninguém morre
      if (game.st.hp - n <= game.st.hpMax * 0.1) { game.st.hp = Math.max(1, Math.round(game.st.hpMax * 0.1)); net.x('x:duelend', { w: from, l: net.myId }); endDuel(from, false); return; }
      game.damage(n, hero.root.position, fromPos); return; }
    if (inside || safeAt(hero.root.position.x, hero.root.position.z)) return;
    hostile.set(from, Date.now() + 120000); // agora eu posso revidar sem culpa
    game.damage(n, hero.root.position, fromPos);
    if (game.st.dead) net.x('x:pvpdie', { by: from });
  });
  net.onX('x:pvpdie', (from, m) => {
    const killer = m.by as number, vn = net.nameOf(from), kn = net.nameOf(killer);
    if (killer === net.myId) {
      const fac = net.remotes().find((q) => q.id === from)?.fac ?? null;
      if (rivals(fac)) { game.logMsg(`⚔ ${vn}, de ${FAC[fac as Fac]?.name ?? 'outra facção'}, caiu diante de você.`, '#ffd88a'); feats.bump('pvp_rival'); }
      else if ((hostile.get(from) ?? 0) > Date.now()) game.logMsg(`⚔ ${vn} atacou primeiro e caiu. Foi justiça: o karma não pesa.`, '#ffd88a');
      else { state.karma = Math.max(-100, state.karma - 15); game.logMsg(`☠ Você matou ${vn}, do seu próprio lado. O karma pesa (−15).`, '#ff6a5a'); feats.bump('pk'); }
    } else chat.sys(`☠ ${kn} matou ${vn}.`);
  });
  /* duelo */
  function challenge(id: number) { if (net.state !== 'on') return; if (duel) { game.logMsg('Você já está num duelo.', '#ff9a8a'); return; } net.x('x:duelask', { to: id }); game.logMsg(`⚔ Desafio enviado a ${net.nameOf(id)}.`, '#ffd88a'); }
  net.onX('x:duelask', (from, m) => { if (m.to !== net.myId) return; if (duel) { net.x('x:duelans', { to: from, ok: 0 }); return; }
    coop.ask('⚔ Desafio de duelo', `${net.nameOf(from)} chama você para um duelo. Ninguém morre: perde quem chegar a 10% da vida.`, 'Aceitar', (ok) => { net.x('x:duelans', { to: from, ok: ok ? 1 : 0 }); if (ok) startDuel(from); }); });
  net.onX('x:duelans', (from, m) => { if (m.to !== net.myId) return; if (m.ok) startDuel(from); else game.logMsg(`${net.nameOf(from)} recusou o duelo.`, '#b9a890'); });
  function startDuel(id: number) { duel = id; duelGo = Date.now() + 3000; badge('⚔', 'duelo em 3 segundos', `contra ${net.nameOf(id)}`, 'join'); audio.chime(); }
  function endDuel(winner: number, iWon: boolean) { const other = duel; duel = 0; if (!other) return; const wn = winner === net.myId ? 'Você' : net.nameOf(winner);
    badge('⚔', 'fim do duelo', `${wn} venceu`, 'join'); game.logMsg(iWon ? `⚔ Você venceu o duelo contra ${net.nameOf(other)}!` : `⚔ ${wn} venceu o duelo.`, '#ffd88a'); if (iWon) feats.bump('duels'); }
  net.onX('x:duelend', (from, m) => { if (m.w === net.myId && duel === from) endDuel(net.myId, true); });
  function toggle() { pvpOn = !pvpOn; net.lookNow(); game.logMsg(pvpOn ? '⚔ PvP da facção LIGADO: você pode ferir gente do seu lado (e quem não jurou lado). Seu nome fica vermelho e cada ataque pesa no karma.' : '🕊 PvP da facção desligado.', pvpOn ? '#ff8a7a' : '#9ad0ff'); }
  return { challenge, hitPlayers, toggle, get on() { return pvpOn; }, tick() { if (!duel) return; const r = net.remotes().find((q) => q.id === duel); if (!r || r.pos.distanceTo(hero.root.position) > 40 || game.st.dead) { game.logMsg('O duelo terminou: alguém se afastou.', '#b9a890'); duel = 0; } } };
})();
/* tela de boas-vindas: encontrar servidor / abrir servidor / jogar sozinho → escolher um dos 3 personagens → mundo */
let pendingServer: string | null = null;
function joinServer() { const v = pendingServer; pendingServer = null; if (v) net.connect(v); }
/* auras rápidas em volta do herói: poção (vermelho vida, azul magia, âmbar tônico) e comemorações (classe, profissão) */
addEventListener('karmika:drink', (e) => { const k = (e as CustomEvent).detail as string, [c0, c1] = k === 'mp' ? [0xbfe0ff, 0x2a6aff] : k === 'buff' ? [0xffe0a0, 0xff8a2a] : [0xffb0b0, 0xe0202a]; const p = hero.root.position;
  for (let i = 0; i < 34; i++) { const a = Math.random() * 6.283, r = 0.35 + Math.random() * 0.4; particles.spawn(p.x + Math.cos(a) * r, p.y + 0.1 + Math.random() * 0.6, p.z + Math.sin(a) * r, { vx: Math.cos(a) * 0.4, vy: 1.4 + Math.random() * 1.8, vz: Math.sin(a) * 0.4, life: 0.8 + Math.random() * 0.4, s0: 0.22, s1: 0.03, c0, c1, a: 0.95, drag: 1.5 }); } });
addEventListener('karmika:burst', (e) => { const d = (e as CustomEvent).detail as { c0: number; c1: number; n: number; small?: boolean }, p = hero.root.position;
  for (let i = 0; i < d.n; i++) { const a = i / d.n * 6.283, sp = d.small ? 1.2 : 2.6; particles.spawn(p.x + Math.cos(a) * 0.3, p.y + (d.small ? 1.0 : 0.3) + Math.random() * 0.4, p.z + Math.sin(a) * 0.3, { vx: Math.cos(a) * sp, vy: (d.small ? 0.6 : 2.2) + Math.random(), vz: Math.sin(a) * sp, life: d.small ? 0.8 : 1.4, s0: d.small ? 0.16 : 0.3, s1: 0.03, c0: d.c0, c1: d.c1, a: 1, drag: 1.2 }); } });
/* a tela de abertura sai quando o mundo e a tela de boas-vindas já estão de pé */
function hideBoot() { const b = document.getElementById('boot'); if (!b || b.classList.contains('off')) return; b.classList.add('off'); setTimeout(() => b.remove(), 700); }
let bootFrames = 0; setTimeout(hideBoot, 30000); // segurança: nunca fica preso na abertura
const inicio = createInicio({ hasChar: () => !!profile, desk: (window as unknown as { karmikaDesktop?: never }).karmikaDesktop ?? null,
  onPlay: (server, isNew) => { pendingServer = server; if (isNew || !profile) setTimeout(() => showCreate(), 200); else { joinServer(); setTimeout(resumeSoul, 900); } },
  fresh: async () => profile ? { lvl: game.st.lvl, cls: classOfRace(state.race), pic: await slotPic() } : null });
/** retrato pequeno (96×120) do herói carregado, para o card do personagem */
function slotPic(): Promise<string | null> { return new Promise((res) => { try { if (humanSkinKey() && !skinModel) { res(null); return; } /* o modelo do artista ainda não chegou: fica a foto anterior */ portraits.delete('hero'); const src = portraitOf('hero', hero.root, true); if (!src) { res(null); return; } const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = 132; c.height = 165; const g = c.getContext("2d")!; const k = Math.min(132 / img.width, 165 / img.height); g.fillStyle = '#14101a'; g.fillRect(0, 0, 132, 165); /* corpo inteiro, da cabeça aos pés */ g.drawImage(img, (132 - img.width * k) / 2, (165 - img.height * k) / 2, img.width * k, img.height * k); res(c.toDataURL('image/jpeg', 0.8)); }; img.onerror = () => res(null); img.src = src; } catch { res(null); } }); }
function saveSlotMeta() { if (!profile || inicio.isOpen || creating) return;
  slotPic().then((pic) => { if (profile) inicio.saveMeta({ name: profile.name, lvl: game.st.lvl, cls: (document.getElementById('who')?.textContent || '').trim(), origin: profile.origin, sex: profile.sex ?? 'f', pic, server: net.state === 'on' ? `karmika://${net.address}/${net.code}` : null }); }); }
setInterval(saveSlotMeta, 20000); addEventListener('beforeunload', () => { if (profile && !inicio.isOpen) inicio.saveMeta({ name: profile.name, lvl: game.st.lvl, cls: (document.getElementById('who')?.textContent || '').trim(), origin: profile.origin, sex: profile.sex ?? 'f', pic: null, server: null }); });
/* balão de fala sobre o herói */
const bubbleEl = document.createElement('div'); bubbleEl.className = 'bubble'; document.body.appendChild(bubbleEl); let bubbleT = 0;
function bubble(text: string) { bubbleEl.textContent = text; bubbleT = 4.5; bubbleEl.style.display = 'block'; }
/* ---------- A Companhia das Caravanas de Latão (caravanas.ts, 24/10): carroças a vapor nas estradas, escoltas, resgates e emboscadas ---------- */
const carBubbles: { el: HTMLElement; p: THREE.Vector3; t: number }[] = [];
function carBubble(x: number, y: number, z: number, text: string) { for (const b of carBubbles.splice(0)) b.el.remove(); const el = document.createElement('div'); el.className = 'cbub'; el.textContent = text; document.body.appendChild(el); carBubbles.push({ el, p: new THREE.Vector3(x, y, z), t: 4.5 }); }
function updateCarBubbles(dt: number) { const r = canvas.getBoundingClientRect(); for (let i = carBubbles.length - 1; i >= 0; i--) { const b = carBubbles[i]; b.t -= dt; if (b.t <= 0) { b.el.remove(); carBubbles.splice(i, 1); continue; } const v = b.p.clone().project(camera); b.el.style.display = v.z < 1 && !inside ? 'block' : 'none'; b.el.style.left = r.left + (v.x * 0.5 + 0.5) * r.width + 'px'; b.el.style.top = r.top + (-v.y * 0.5 + 0.5) * r.height + 'px'; b.el.style.opacity = String(Math.min(1, b.t)); } }
const caravans = createCaravans({ scene, heightAt, hero: () => heroPos, night: () => state.night, inside: () => !!inside, lvl: () => game.st.lvl,
  spawn: (type, x, z, o) => game.enemies.spawn(type, x, z, o) as never, clearTag: (tag) => game.enemies.clearTag(tag), hurt: (e, n, from) => { game.enemies.hurt(e as never, n, from); },
  smoke: (x, y, z, dark) => particles.spawn(x, y, z, { vx: (Math.random() - 0.5) * 0.4, vy: 1.3, vz: (Math.random() - 0.5) * 0.4, life: 2.6, s0: 0.5, s1: 2.4, c0: dark ? 0x3a3438 : 0xb8b4b0, c1: dark ? 0x141014 : 0x5a5860, a: dark ? 0.35 : 0.24, drag: 0.5 }),
  bubble: carBubble, log: (t, c) => game.logMsg(t, c), lean: () => soulLean(),
  nearTown: (x, z) => { const tx = x / T, ty = z / T; return city.settlements.some((st) => Math.hypot(st.x - tx, st.y - ty) < st.radius + 6) || Math.hypot(CITY.x - tx, CITY.y - ty) < 30; },
  onEscort: (id) => quests.onCaravan('escort', id), onRescue: (id) => quests.onCaravan('rescue', id),
  onEvent: (r, how) => { const lv = Math.max(game.st.lvl, r.lvl - 5), xp = Math.round(game.xpNeedAt(lv) * 0.22);
    if (how === 'salva') { const g = 40 + lv * 4; game.st.gold += g; game.gainXp(xp); state.karma = Math.min(100, state.karma + 2); applyReply({ t: '', luz: 1 });
      game.logMsg(`⚙ Os sobreviventes da caravana agradecem. A Companhia de Latão paga o resgate: +${g} ouro, +${xp} XP. Na loja da Companhia, você tem desconto por meia hora.`, '#e0b048'); }
    else { const g = 120 + lv * 9; game.st.gold += g; state.karma = Math.max(-100, state.karma - 5); applyReply({ t: '', sombra: 2, flag: 'saqueou_caravana' });
      game.logMsg(`💰 Você abre as caixas sem dono e enche os bolsos: +${g} ouro. Ninguém viu. A Companhia vai saber mesmo assim.`, '#c98a9a'); setTimeout(() => eyeSees('O Olho guardou.', 'Saqueou uma caravana caída.', 'Os cocheiros estavam mortos e a carga não tinha dono. Mas tinha: as famílias que esperavam o pagamento da viagem.', -5), 700); } } },
  buildRoutes(city.roadPaths, city.roadLinks ?? []));
/** a escolta e o resgate só existem enquanto a missão está no diário */
function syncCaravanQuests() { const want = new Set<string>();
  for (const [id] of Object.entries(quests.q.active)) { const d = quests.def(id); if (!d) continue; d.objs.forEach((o, i) => { if (quests.objProg(d, i) >= 1) return;
    if (o.kind === 'escort') { want.add('esc:' + o.route); if (!caravans.escorting(o.route)) caravans.startEscort(o.route); }
    if (o.kind === 'rescue') { want.add('res:' + o.route); caravans.startRescue(o.route, o.at, o.note); } }); }
  for (const r of caravans.routes.keys()) { if (!want.has('esc:' + r) && caravans.escorting(r) && !caravans.arrivedEsc(r)) caravans.stopEscort(r); if (!want.has('res:' + r)) caravans.stopRescue(r, true); } }
let carSyncT = 0;
/* a Casa dos Ofícios de Askavik (oficios.ts) */
const craftHall = city.craftHall ? createCraftHall({ scene, T, heightAt, fine, particles, bubble: (x, y, z, tx) => carBubble(x, y, z, tx), audio }, city.craftHall) : null;
function updateCaravans(dt: number) { const nowMs = performance.now(); if (nowMs > carSyncT) { carSyncT = nowMs + 700; syncCaravanQuests(); } caravans.update(dt, t); updateCarBubbles(dt); }
/** a loja da Companhia: o estoque e o preço dependem das caravanas que chegaram (ou não) */
const LATAO_BASE = ['potion_g', 'mana', 'tonic', 'antidote', 'rope', 'scroll_return', 'bag_l'], LATAO_PORTO = ['bag_xl', 'pick_st', 'axe_st', 'knife_st'];
function prepLatao() { const s = caravans.stock(); SHOPDEF.latao.items = s.extra ? [...LATAO_BASE, ...LATAO_PORTO] : LATAO_BASE; SHOPDEF.latao.note = s.note; game.logMsg(`⚙ Feitora Brunna: “${s.note}”`, '#e0b048'); }
function latoK() { let k = caravans.stock().k; if (hasMark('pal_queimou_carga')) k *= 1.2; if (hasMark('saqueou_caravana')) k *= 1.1; if (hasMark('tec_denunciou_vesna') || hasMark('pal_avisou')) k *= 0.93; return k; }
/* ---------- Eventos vivos (eventos.ts, 24/10): patrulhas, rituais, romarias, festas, casamentos, vilas sitiadas — e os globais ---------- */
const evSites = (() => { const v: { x: number; y: number; name: string; region: number }[] = [], r: typeof v = [], f: typeof v = [];
  const nearTownT = (x: number, y: number, pad: number) => city.settlements.some((st) => Math.hypot(st.x - x, st.y - y) < st.radius + pad);
  for (const st of city.settlements) if (st.kind !== 'city' && st.radius >= 6) v.push({ x: Math.round(st.x), y: Math.round(st.y), name: st.name, region: regionAt(st.x, st.y).id });
  const nameNear = (x: number, y: number) => { let b = 'a estrada', bd = 1e9; for (const st of city.settlements) { const d = Math.hypot(st.x - x, st.y - y); if (d < bd) { bd = d; b = st.name; } } return b; };
  for (const rp of city.roadPaths) for (let i = 10; i < rp.length - 10; i += 28) { const q = rp[i]; if (nearTownT(q.x, q.y, 24)) continue; r.push({ x: Math.round(q.x), y: Math.round(q.y), name: `estrada perto de ${nameNear(q.x, q.y)}`, region: regionAt(q.x, q.y).id }); }
  for (let y = 20; y < MAP_W - 20; y += 13) for (let x = 20; x < MAP_W - 20; x += 13) { if (city.biome[y]?.[x] !== 'forest' || city.map[y]?.[x] !== 'grass' || nearTownT(x, y, 22)) continue; f.push({ x, y, name: `mata perto de ${nameNear(x, y)}`, region: regionAt(x, y).id }); }
  return { sitesVillage: v, sitesRoad: r, sitesForest: f, roadPaths: city.roadPaths }; })();
const evFx = (kind: 'firework' | 'petal' | 'holy' | 'dark' | 'smoke' | 'incense' | 'candle', x: number, y: number, z: number) => {
  if (kind === 'incense') { particles.spawn(x + (Math.random() - 0.5) * 0.05, y, z + (Math.random() - 0.5) * 0.05, { vx: (Math.random() - 0.5) * 0.15, vy: 0.55 + Math.random() * 0.3, vz: (Math.random() - 0.5) * 0.15, life: 2.6, s0: 0.12, s1: 0.55, c0: 0xd8d0c0, c1: 0x6a6460, a: 0.32, drag: 0.5, w: 0.5, flit: 0.6 }); return; }
  if (kind === 'candle') { particles.spawn(x, y, z, { vy: 0.25, life: 0.35, s0: 0.2, s1: 0.06, c0: 0xfff0a0, c1: 0xff8a20, a: 0.95 }); return; }
  if (kind === 'firework') { const c = [0xff5a4a, 0x5ab0ff, 0xffd24a, 0x9aff7a, 0xff8ad0][Math.floor(Math.random() * 5)]; for (let i = 0; i < 36; i++) { const a = Math.random() * 6.283, b = Math.random() * 3.14, sp = 5 + Math.random() * 3; particles.spawn(x, y, z, { vx: Math.cos(a) * Math.sin(b) * sp, vy: Math.cos(b) * sp, vz: Math.sin(a) * Math.sin(b) * sp, life: 1.6, s0: 0.5, s1: 0.15, c0: c, c1: 0x401808, a: 1, drag: 1.2, g: -3 }); } audio.click?.(); return; }
  if (kind === 'petal') { particles.spawn(x, y, z, { vx: (Math.random() - 0.5) * 0.6, vy: -0.5, vz: (Math.random() - 0.5) * 0.6, life: 4, s0: 0.22, s1: 0.18, c0: Math.random() < 0.5 ? 0xffb0d0 : 0xffffff, c1: 0xff8ab0, a: 0.9, drag: 0.3, flit: 1 }); return; }
  if (kind === 'holy') { particles.spawn(x, y, z, { vx: (Math.random() - 0.5) * 0.3, vy: 1.6, vz: (Math.random() - 0.5) * 0.3, life: 2.2, s0: 0.45, s1: 0.1, c0: 0xfff0b0, c1: 0xffc84a, a: 0.85, drag: 0.4 }); return; }
  if (kind === 'dark') { particles.spawn(x, y, z, { vx: (Math.random() - 0.5) * 0.4, vy: 1.1, vz: (Math.random() - 0.5) * 0.4, life: 2.6, s0: 0.55, s1: 0.2, c0: 0xa050ff, c1: 0x200830, a: 0.75, drag: 0.4 }); return; }
  particles.spawn(x, y, z, { vx: 0, vy: 1, vz: 0, life: 2, s0: 0.6, s1: 2, c0: 0x8a8a96, c1: 0x30303c, a: 0.25, drag: 0.4 }); };
const evResEl = document.createElement('div'); evResEl.id = 'evres'; document.body.appendChild(evResEl);
const evTrkEl = document.createElement('div'); evTrkEl.id = 'evt'; document.body.appendChild(evTrkEl);
const evBanEl = document.createElement('div'); evBanEl.id = 'evglobal'; document.body.appendChild(evBanEl);
const eventos = createEvents({ scene, heightAt, hero: () => heroPos, inside: () => !!inside, lvl: () => game.st.lvl, night: () => state.night,
  path: () => myPath(), elf: () => profile?.origin === 'elf', instinct: () => instinctOn, lean: () => soulLean(), xpNeedAt: (l) => game.xpNeedAt(l),
  spawn: (type, x, z, o) => game.enemies.spawn(type, x, z, o) as never, clearTag: (tag) => game.enemies.clearTag(tag), hurtBy: (e, n, from) => { if (game.enemies.hurtBy(e as never, n, from)) { /* morto por outro do evento: sem crédito */ } },
  region: (x, y) => regionAt(x, y), fx: evFx, bubble: carBubble, log: (t, c) => game.logMsg(t, c),
  project: (p) => { const v = p.clone().project(camera); if (v.z > 1) return null; const r = canvas.getBoundingClientRect(); return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height }; },
  converse: (o) => { let picked: Reply | null = null; openDlg({ name: o.name, role: o.role, portrait: null, text: '', choices: [], onAccept: () => {}, onTurnIn: () => {}, onReply: (r) => { if (r.flag?.startsWith('ev:')) picked = r; else applyReply(r); }, meet: { quest: { id: 'ev', name: o.title, lvl: 1, giver: o.name, text: '', objs: [], xp: 0, gold: 0 }, steps: o.steps, onEnd: () => o.onPick(picked) } }); },
  count: (it) => inv.count(it), take: (it, n) => inv.take(it, n), act: (a) => { hero.act(a as never, true); }, result: (r) => showEvResult(r) }, evSites);
function showEvResult(r: EvResult) {
  state.karma = Math.max(-100, Math.min(100, state.karma + r.karma)); game.gainXp(r.xp); game.st.gold += r.gold;
  if (r.karma) applyReply({ t: '', luz: r.karma > 0 ? Math.ceil(r.karma / 3) : 0, sombra: r.karma < 0 ? Math.ceil(-r.karma / 3) : 0, flag: r.flag });
  const k = r.karma, kc = k > 0 ? '#ffe08a' : k < 0 ? '#c98aff' : '#b9c6e0';
  evResEl.innerHTML = `<div class="evp ${r.lean}"><small>RESPOSTA KÁRMICA</small><h3>${r.icon} ${r.name}</h3><p class="evs">${r.won ? 'Decidido' : 'O tempo acabou'} · você: <b>${r.side}</b></p>${r.lines.map((l) => `<p>${l}</p>`).join('')}
    <div class="evk"><span style="color:${kc}">${k > 0 ? '☀ +' : k < 0 ? '☾ ' : ''}${k} karma</span><span>✨ +${r.xp} XP</span><span>🪙 +${r.gold}</span></div><button data-ok>O Olho viu.</button></div>`;
  evResEl.style.display = 'flex'; audio.click?.(); evPendingEye = k ? () => eyeSees(k > 0 ? 'O Olho viu.' : 'O Olho guardou.', r.side, r.lines[0], k) : null;
}
/** o Olho registra no Compêndio só depois que você fecha a resposta (uma janela de cada vez) */
let evPendingEye: (() => void) | null = null;
evResEl.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-ok]') || e.target === evResEl) { evResEl.style.display = 'none'; const f = evPendingEye; evPendingEye = null; if (f) setTimeout(f, 250); } });
let evUiT = 0, lastGlobal: string | null = null, evCard = '';
quests.setExtraTop(() => evCard);
/* aviso de evento por perto: uma faixa animada que entra pela DIREITA da tela (o diário fica à esquerda).
   Clicar = pegar a missão: a bússola passa a levar até lá. Chegando, o arauto conta e você escolhe o lado (isso é aceitar). */
const evNearEl = document.createElement('div'); evNearEl.id = 'evnear'; document.body.appendChild(evNearEl);
const evNearShown = new Set<string>(); let evNearKey: string | null = null, evNearT = 0;
evNearEl.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('[data-k]') as HTMLElement | null; if (!b) return; e.stopPropagation(); audio.click?.();
  if (b.dataset.x) { evNearEl.classList.remove('on'); evNearKey = null; return; }
  eventos.track(b.dataset.k!); pinT = null; evNearEl.classList.add('took'); game.logMsg('🧭 Evento seguido: a bússola aponta para lá. Chegando, fale com o arauto.', '#ffb060'); setTimeout(() => { evNearEl.classList.remove('on', 'took'); evNearKey = null; }, 1600); });
function updateEvNear(h0: { x: number; y: number }) {
  if (inside || dlg.isOpen) { evNearEl.classList.remove('on'); return; }
  const tk = eventos.tracking(); const list = eventos.nearby(h0).filter((e) => !e.joined && !e.asked && e.key !== tk?.key);
  if (evNearKey) { evNearT -= 0.25; const cur = list.find((e) => e.key === evNearKey); if (!cur || evNearT <= 0) { evNearEl.classList.remove('on'); evNearKey = null; } else { const m = evNearEl.querySelector('.d'); if (m) m.textContent = `${Math.round(cur.d)} m · ⌛ ${Math.max(1, Math.ceil(cur.left / 60))} min`; } return; }
  const nx = list.find((e) => !evNearShown.has(e.key)); if (!nx) return;
  evNearShown.add(nx.key); evNearKey = nx.key; evNearT = 16;
  evNearEl.style.setProperty('--c', nx.color);
  evNearEl.innerHTML = `<small>ACONTECENDO POR PERTO</small><b>${nx.icon} ${nx.name}</b><p>${nx.text}</p><span class="w">${nx.site} · <i class="d">${Math.round(nx.d)} m · ⌛ ${Math.max(1, Math.ceil(nx.left / 60))} min</i></span><div class="r"><button data-k="${nx.key}">🧭 Pegar a missão</button><button data-k="${nx.key}" data-x="1" class="x">Agora não</button></div>`;
  evNearEl.classList.remove('on'); void evNearEl.offsetWidth; evNearEl.classList.add('on'); audio.chime?.();
}
setTimeout(() => { const nx = globalNext(); if (nx && !globalNow()) { const d = new Date(nx.start); game.logMsg(`${nx.icon} Próximo evento global: ${nx.name}, hoje/amanhã às ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} (o horário muda a cada dia).`, nx.color); } }, 6000);
function updateEventos(dt: number) { eventos.update(dt, t); evUiT -= dt; if (evUiT > 0) return; evUiT = 0.25;
  const h0 = hereT(), html = inside ? '' : eventos.tracker(h0); evTrkEl.style.display = 'none';
  /* o evento vira missão: cartão laranja no topo do diário, com os entregáveis e o tempo */
  const card = html ? `<div class="q c-ev track evq">${html}</div>` : ''; if (card !== evCard) { evCard = card; quests.render(); }
  updateEvNear(h0);
  const g = globalNow(); evBanEl.style.display = g && !inside ? 'block' : 'none'; if (g) { const left = Math.max(1, Math.ceil((g.end - Date.now()) / 60000)); const fx = globalSideText(g.id); evBanEl.innerHTML = `<b style="color:${g.color}">${g.icon} ${g.name} <i>· mais ${left} min</i></b><small>${g.text}</small>${fx ? `<small style="color:${globalSide(g.id) > 0 ? '#9aff9a' : '#ff9a8a'}">${fx}</small>` : ''}`; }
  if (g?.id !== lastGlobal) { if (g) game.logMsg(`${g.icon} ${g.name} começou no mundo inteiro. ${g.text}`, g.color); lastGlobal = g?.id ?? null; } }
/* ---------- Instinto e falas do herói (instinto.ts, 24/10) ---------- */
/** a alma dos NPCs que importam para o Instinto (quem é da Luz, da Sombra, ou de um caminho) */
const NPC_SOUL: Record<string, { path?: string; lean?: 'luz' | 'sombra' }> = { 'Vesna Corvo-Negro': { lean: 'sombra' }, 'Irmã Maela': { lean: 'luz' }, Eldrin: { lean: 'luz' }, 'Paladino Aldric': { path: 'pal', lean: 'luz' }, 'Arquiteta Ylva': { path: 'tec' }, 'Thorgrim Mão-de-Ferro': { path: 'gue' }, 'Hrefna': { lean: 'luz' }, 'Irmã Ysolde': { lean: 'luz' }, 'Grão-Mestre Cassius': { path: 'pal', lean: 'luz' }, 'Bispa Solveig': { lean: 'luz' }, 'Irmão Tobias': { lean: 'luz' }, 'Lady Mirela': { path: 'vam' }, 'Conde Vladislav III': { path: 'vam', lean: 'sombra' }, 'Mestra Ilsa Van Rhal': { path: 'cac', lean: 'luz' }, 'Malgrath, Senhor dos Pactos': { path: 'bru', lean: 'sombra' }, 'Ulfrun, a Mãe-Alfa': { path: 'lob' } };
/* ---------- Instinto de classe: liga e desliga com F (ou no menu de magias, K). Só você vê a aura. ---------- */
let instinctOn = (() => { try { return localStorage.getItem('karmika.instinct') === '1'; } catch { return false; } })();
const myInstinct = () => instinctOf(myPath(), profile?.origin ?? 'human');
function toggleInstinct(v = !instinctOn) { instinctOn = v; try { localStorage.setItem('karmika.instinct', v ? '1' : '0'); } catch { /* */ } const I = myInstinct();
  game.logMsg(v ? `✧ ${I.name}: ligado. ${I.desc}` : `✧ ${I.name}: desligado. Só a ameaça de verdade vai te acordar.`, v ? I.css : '#b9c6e0'); audio.click?.(); updateInstBtn(); }
/* o Instinto mora no menu de ações (junto de Mapa, Deus e Menu): um botão pequeno com o terceiro olho; F continua ligando */
const instBtn = document.createElement('button'); instBtn.id = 'instbtn'; instBtn.dataset.b = 'inst'; document.getElementById('btns')!.appendChild(instBtn); instBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleInstinct(); });
const THIRD_EYE = '<svg viewBox="0 0 32 32"><path d="M3 16c4-6.5 8.5-9.5 13-9.5S25 9.5 29 16c-4 6.5-8.5 9.5-13 9.5S7 22.5 3 16z" fill="#120c07" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="16" r="5.6" fill="currentColor" opacity=".9"/><path d="M16 11.2l2.6 4.8-2.6 4.8-2.6-4.8z" fill="#0b0810"/><path d="M16 1.5v3.4M9 3.6l1.6 2.8M23 3.6l-1.6 2.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
function updateInstBtn() { const I = myInstinct(); instBtn.innerHTML = `${THIRD_EYE}<kbd>F</kbd>`; instBtn.classList.toggle('on', instinctOn); instBtn.style.setProperty('--ic', I.css); instBtn.title = `${I.name} — ${I.desc}\n${instinctOn ? 'Ligado' : 'Desligado'} (F para trocar)`; }
setTimeout(updateInstBtn, 0);
/* o que só o instinto mostra: rastros das missões, espíritos, dispositivos perdidos e os esconderijos do mundo */
const CACHES: Cache[] = []; setTimeout(() => { const out = CACHES; /* depois do arquivo inteiro carregar (navProbe nasce mais abaixo) */ const src = [...city.pois.filter((p) => /ruins|forest|enchanted|blight/.test(p.biome as string)).map((p) => ({ x: p.x, y: p.y })), ...evSites.sitesForest.filter((_, i) => i % 9 === 0)];
  const h = (n: number) => { const x = Math.sin(n * 91.7 + 13.1) * 43758.5453; return x - Math.floor(x); };
  src.forEach((p, i) => { if (h(i) > 0.55 || out.length >= 36) return; const x = Math.round(p.x + (h(i * 3) - 0.5) * 14), y = Math.round(p.y + (h(i * 7) - 0.5) * 14); const fr = nearestFree(navProbe, x, y, 4); if (!fr) return; const [name, lore] = CACHE_LORE[out.length % CACHE_LORE.length]; out.push({ id: 'c' + i, x: Math.round(fr.x), y: Math.round(fr.y), name, lore, tier: regionAt(x, y).lo }); }); }, 0);
const secrets = createSecrets({ scene, heightAt, hero: () => heroPos, color: () => myInstinct().color, inside: () => !!inside,
  bubble: (x, y, z, tx) => carBubble(x, y, z, tx), log: (tx, c) => game.logMsg(tx, c),
  fx: (x, y, z, col) => particles.spawn(x, y, z, { vx: (Math.random() - 0.5) * 0.3, vy: 0.9, vz: (Math.random() - 0.5) * 0.3, life: 1.6, s0: 0.22, s1: 0.04, c0: col, c1: col, a: 0.8, drag: 0.6 }) }, CACHES);
secrets.setOnSense((id) => quests.onSense(id));
const placeT = (name: string) => { const st = city.settlements.find((q) => q.name === name); if (st) return { x: st.x, y: st.y }; const p = city.pois.find((q) => q.name === name); return p ? { x: p.x, y: p.y } : null; };
/** os rastros que as missões ativas pedem (o lugar do alvo vem do mapa; o rastro começa ~30 casas antes) */
function senseGoals(): SenseGoal[] { const out: SenseGoal[] = [];
  for (const id of Object.keys(quests.q.active)) { const d = quests.def(id); if (!d) continue; d.objs.forEach((o, i) => { if (o.kind !== 'sense' || quests.objProg(d, i) >= 1) return; const base = placeT(o.at); if (!base) return;
    const tx0 = base.x + (o.dx ?? 0), ty0 = base.y + (o.dy ?? 0), fr = nearestFree(navProbe, tx0, ty0, 6) ?? { x: tx0, y: ty0 }; const src = o.from ? placeT(o.from) : null;
    let ax = fr.x - (o.dx ?? 10), ay = fr.y - (o.dy ?? 10); if (src) { const L = Math.hypot(src.x - fr.x, src.y - fr.y) || 1, k = Math.min(1, 30 / L); ax = fr.x + (src.x - fr.x) * k; ay = fr.y + (src.y - fr.y) * k; } else { const L = Math.hypot(ax - fr.x, ay - fr.y) || 1; ax = fr.x + (ax - fr.x) / L * 30; ay = fr.y + (ay - fr.y) / L * 30; }
    out.push({ id: `${id}:${i}`, kind: o.what, label: o.label, from: { x: ax, y: ay }, to: { x: fr.x, y: fr.y }, spirit: o.spirit }); }); }
  return out; }
let senseT = 0;
function updateSecrets(dt: number) { senseT -= dt; if (senseT <= 0) { senseT = 1; secrets.sync(senseGoals()); } secrets.update(dt, t, instinctOn); }
function digCache(c: Cache) { const lv = Math.max(game.st.lvl, c.tier), g = 15 + Math.round(lv * (3 + Math.random() * 3)); game.st.gold += g; game.gainXp(Math.round(game.xpNeedAt(lv) * 0.05));
  game.logMsg(`✦ ${c.name}: ${c.lore} (+${g} ouro)`, '#ffd890'); if (Math.random() < 0.45) game.spawnGear(heroPos.x, heroPos.z, heroPos.y, lv, { rare: 3, legendary: 1.5 }, 1, 'rare');
  game.logMsg(`✧ Esconderijos achados: ${secrets.foundCount()}/${secrets.total()}`, myInstinct().css); }
let instinct: ReturnType<typeof createInstinct> | null = null;
const selfSeen = new Map<string, number>(); let selfLast = -999, wasNight = false, lastPlace = '';
function updateInstinct(dt: number) {
  if (!instinct) instinct = createInstinct({ scene, canvas, bubble, log: (t, c) => game.logMsg(t, c), tint: (id, c, e) => net.nameTint(id, c, e) });
  if (cine || game.st.dead) { instinct.clear(); return; }
  const beings: Being[] = [];
  if (net.state === 'on') for (const r of net.remotes()) beings.push({ key: 'r' + r.id, remoteId: r.id, name: r.name, pos: r.pos, path: r.path, lean: r.lean, lvl: r.lvl });
  for (const n of npcSys.npcs) { const so = NPC_SOUL[n.def.name]; if (so) beings.push({ key: 'n' + n.def.name, name: n.def.name, pos: n.pos, path: so.path ?? null, lean: so.lean ?? null }); }
  const mobs = game.enemies.list.filter((e) => e.alive && e.active).map((e) => ({ type: e.type as string, pos: e.pos, name: e.def.name }));
  instinct.update(dt, t, { pos: heroPos, path: myPath(), lean: soulLean(), inside: !!inside && !inside.dg, on: instinctOn, lvl: game.st.lvl }, beings, mobs);
  if (!instinctOn) return; // falar sozinho também é sensação: só com o instinto ligado
  // falas sozinho: lugares e a noite (uma por lugar a cada 10 min, nunca mais de uma a cada 40 s)
  const say = (key: string, place: Place) => { if (t - selfLast < 40 || t - (selfSeen.get(key) ?? -999) < 600) return; const l = selfLine(place, myPath(), soulLean()); if (!l) return; selfSeen.set(key, t); selfLast = t; bubble(l); };
  const isNight = state.night > 0.6; if (isNight && !wasNight) say('noite', 'noite'); wasNight = isNight;
  if (inside?.dg) { if (lastPlace !== 'dg') say('dg:' + (inside as { dg?: { d?: { id?: string } } }).dg?.d?.id, 'masmorra'); lastPlace = 'dg'; return; }
  if (inside) { lastPlace = 'in'; return; }
  const near = city.pois.find((p) => Math.hypot(p.x - state.fx, p.y - state.fy) < 9 && /Catedral|Igreja|Templo|Cemit|Cripta|Mausol|Abadia/.test(p.name));
  const place = near ? (/Cemit|Cripta|Mausol/.test(near.name) ? 'cemiterio' : 'igreja') : '';
  if (near && lastPlace !== near.name) say('poi:' + near.name, place as Place);
  const town = city.settlements.find((st2) => st2.name === 'Askavik' && Math.hypot(st2.x - state.fx, st2.y - state.fy) < st2.radius);
  if (town && lastPlace !== 'Askavik' && !near) say('cidade:Askavik', 'cidade');
  lastPlace = near ? near.name : town ? 'Askavik' : '';
}
/* retrato do NPC: renderiza a cabeça do modelo 3D uma vez e guarda como imagem */
const portraits = new Map<string, string>();
function portraitOf(name: string, root: THREE.Object3D, full = false): string {
  const c = portraits.get(name); if (c) return c;
  const w = full ? 300 : 64, h = full ? 480 : 72, rt = new THREE.WebGLRenderTarget(w, h);
  const ps = new THREE.Scene(); ps.background = new THREE.Color(0x14101a);
  ps.add(new THREE.HemisphereLight(0xfff4e0, 0x3a2a30, full ? 2.3 : 1.3)); const dl = new THREE.DirectionalLight(0xffffff, full ? 2.6 : 1.7); dl.position.set(1.2, 2.2, 2.4); ps.add(dl);
  const parent = root.parent, pos = root.position.clone(), rot = root.rotation.clone(), vis = root.visible;
  ps.add(root); root.position.set(0, 0, 0); root.rotation.set(0, 0.42, 0); root.visible = true; root.updateMatrixWorld(true);
  const xr: THREE.Object3D[] = []; root.traverse((o) => { const mt = (o as THREE.Mesh).material as THREE.Material | undefined; if (o.visible && (o.userData.xray || (mt && !Array.isArray(mt) && mt.depthTest === false))) { xr.push(o); o.visible = false; } }); // a silhueta azul (atrás das casas) não entra no retrato
  const box = new THREE.Box3().setFromObject(root), top = Math.min(box.max.y, 1.97 * (root.scale.y || 1)) /* a antena do reator do tecnocrata passava da cabeça e o retrato mirava nela */, cy = full ? top * 0.52 : top - 0.26, dist = full ? top * 1.45 + 0.45 : 1.15;
  const cam = new THREE.PerspectiveCamera(full ? 34 : 30, w / h, 0.05, 30); cam.position.set(full ? 0.3 : 0.12, cy + (full ? 0.15 : 0.08), dist); cam.lookAt(0, cy - 0.02, 0); cam.layers.enableAll();
  const bgc = new THREE.Color(); renderer.getClearColor(bgc); const alpha = renderer.getClearAlpha(), sm = renderer.shadowMap.autoUpdate;
  renderer.shadowMap.autoUpdate = false; renderer.setRenderTarget(rt); renderer.setClearColor(0x14101a, 1); renderer.clear(); renderer.render(ps, cam);
  const px = new Uint8Array(w * h * 4); renderer.readRenderTargetPixels(rt, 0, 0, w, h, px);
  renderer.setRenderTarget(null); renderer.setClearColor(bgc, alpha); renderer.shadowMap.autoUpdate = sm; rt.dispose();
  for (const o of xr) o.visible = true;
  ps.remove(root); if (parent) parent.add(root); root.position.copy(pos); root.rotation.copy(rot); root.visible = vis;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d')!, im = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const si = ((h - 1 - y) * w + x) * 4, di = (y * w + x) * 4; im.data[di] = px[si]; im.data[di + 1] = px[si + 1]; im.data[di + 2] = px[si + 2]; im.data[di + 3] = 255; }
  g.putImageData(im, 0, 0); const url = cv.toDataURL(); portraits.set(name, url); return url;
}
const ITEMS_NAME = (id: string) => ({ pet_fox: 'A raposa', pet_pup: 'O filhote' } as Record<string, string>)[id] ?? id;
const SHOP_OF: Record<string, string> = { Doran: 'armeiro', Thorin: 'mercador', Maren: 'armaduras', Morwen: 'pocoes', Tessa: 'cervejaria', Sven: 'churrasco', Bruno: 'charcutaria', Rosália: 'cozinha', Tomás: 'lenhador', Kaela: 'cacador', Gunnar: 'construtor', Corwin: 'domador', Orm: 'estabulo' };
/* conversa com um NPC: missões para entregar, missões novas, comércio, quadro, conversa */
function talkTo(n: (typeof npcSys.npcs)[number]) {
  const nm = n.def.name, shopId = SHOP_OF[nm] ?? SHOP_BY_NAME.get(nm) ?? null;
  { /* encontro de missão (24/10): quem a missão mandou procurar tem conversa própria; no fim, o objetivo conta */
    const mq = Object.keys(quests.q.active).map((id) => quests.def(id)).find((d) => !!d?.meet?.[nm] && d.objs.some((o, i) => o.kind === 'talk' && o.npc === nm && quests.objProg(d, i) < 1));
    if (mq) { let pr: string | null = null; try { pr = portraitOf(nm, n.hero.root); } catch { pr = null; }
      openDlg({ name: nm, role: n.def.role, portrait: pr, text: '', choices: [], onAccept: () => {}, onTurnIn: () => {}, meet: { quest: mq, steps: mq.meet![nm], onEnd: () => { quests.onTalk(nm); setTimeout(() => { if (quests.turnins(nm).length) talkTo(n); }, 200); } } }); return; } }
  quests.onTalk(nm); /* conversar conta antes de listar as entregas */
  const ti = quests.turnins(nm), of = quests.offers(nm);
  const choices: Choice[] = [];
  for (const d of ti) choices.push({ kind: 'turnin', label: `Entregar: ${d.name}`, hint: `${d.xp} XP · ${d.gold} 🪙`, quest: d });
  for (const d of of) choices.push({ kind: 'quest', label: d.name, hint: `Nv ${d.lvl}`, quest: d });
  if (shopId === 'estabulo' && !quests.q.done.includes('o01')) { /* estábulo fechado até libertar os cavalos */ }
  else if (shopId === 'tec_fio' || shopId === 'tec_desf') { const sf: Fac = shopId === 'tec_fio' ? 'fio' : 'desf', mf = myFac(); /* qualquer um compra; só veste quem jurou o lado, no nível 30 */
    choices.push({ kind: 'shop', label: `Comerciar com ${nm}`, hint: mf === sf ? 'peças com brasão' : 'só para guardar ou vender', cb: () => { inv.openShop(shopId); if (mf !== sf) game.logMsg(sf === 'fio' ? `🧵 ${nm}: “Vendo a quem paga. Vestir o fio é outra história: só quem jura.”` : `✂ ${nm}: “Leve. Mas o manto só cai bem em quem já cortou o fio.”`, '#c8b890'); } }); }
  else if (shopId) choices.push({ kind: 'shop', label: `Comerciar com ${nm}`, cb: () => { if (shopId === 'latao') prepLatao(); inv.openShop(shopId, SHOP_OF[nm] ? undefined : `${nm}, ${n.def.role}`); const k = shopLeanK(shopId);
    if (k > 1) game.logMsg(`${nm} olha você de cima a baixo. Para gente como você, o preço é outro (+${Math.round((k - 1) * 100)}%).`, '#c8a090'); else if (k < 1) game.logMsg(`${nm} sorri: “Para você, um desconto.” (−${Math.round((1 - k) * 100)}%)`, '#a8d0a0'); } });
  if (nm === 'Elowen') choices.push({ kind: 'custom', label: 'Abrir o Shop', hint: 'Premium e brasões', cb: () => { dlg.close(); loja.toggle('prem'); } });
  if (nm === 'Mestre-Forjador Brokki') choices.push({ kind: 'custom', label: 'Forja de Elite', hint: 'peças lendárias', cb: () => eliteForge(n) });
  if (nm === 'Garrick') choices.push({ kind: 'board', label: 'Quadro de Missões', hint: 'contratos', cb: () => quests.openBoard() });
  if (nm === 'Hrefna') { if (game.st.lvl >= 30 && (!profile?.path || profile.path === 'humano')) choices.push({ kind: 'custom', label: profile?.path === 'humano' ? 'Ler o meu caminho de novo' : 'Ler o meu caminho', hint: 'doze perguntas', cb: () => { dlg.close(); vid.open(); } }); else if (game.st.lvl < 30) choices.push({ kind: 'talk', label: 'Ler o meu caminho', hint: 'nível 30', cb: () => dlg.setText('Ainda não. A sua alma ainda está se formando. Volte no nível 30, e eu leio o que a Deusa vê.') }); }
  choices.push({ kind: 'talk', label: 'Conversar', cb: () => dlg.setText(npcSys.talk(n)) });
  choices.push({ kind: 'close', label: 'Até logo' });
  quests.onTalk(nm);
  let portrait: string | null = null; try { portrait = portraitOf(nm, n.hero.root); } catch { portrait = null; }
  const eco = (() => { if (ti.length || of.length) return null; for (const m of soul.s.marks ?? []) { const t = ECOS[m]?.[nm], key = `eco:${m}:${nm}`; if (t && !hasMark(key)) { (soul.s.marks ??= []).push(key); soul.save(); return t; } } return null; })();
  const frio = (() => { const L = soulLean(); if (!L || ti.length || of.length || eco) return null; const f = FRIO[L]; return f.quem.includes(nm) && Math.random() < 0.5 ? f.falas[Math.floor(Math.random() * f.falas.length)] : null; })();
  openDlg({ name: nm, role: n.def.role, portrait, text: (eco || frio) ? (eco || frio)!.replace(/\{nome\}/g, profile?.name || 'Caminhante') : ti.length ? 'Você voltou. Conseguiu?' : of.length ? (of[0].talk ? `${profile?.name ? profile.name + ', ' : ''}preciso falar com você.` : of[0].text) : (nm === 'Orm' && !quests.q.done.includes('o01') && quests.q.active['o01']) ? 'Enquanto o Torturador viver, nenhum cavalo sai daqui. A clareira fica no meio da floresta, a leste.' : n.def.lines[n.line], choices,
    onAccept: (d) => { quests.accept(d); game.logMsg(`${nm}: “Que Karmika guie seus passos.”`, '#f4e6b8'); },
    onTurnIn: (d, ci) => { const o = d.choice && ci !== undefined ? d.choice.opts[ci] : null; quests.turnIn(d);
      if (o) { applyReply({ t: '', luz: o.karma > 0 ? Math.ceil(o.karma / 2) : 0, sombra: o.karma < 0 ? Math.ceil(-o.karma / 2) : 0, flag: (o as { flag?: string }).flag }); state.karma = Math.max(-100, Math.min(100, state.karma + o.karma)); game.logMsg(`${nm}: “${o.say}”`, '#f4e6b8'); setTimeout(() => eyeSees(o.karma >= 0 ? 'O Olho viu.' : 'O Olho guardou.', o.label, o.why, o.karma), 600); }
      else game.logMsg(`${nm}: “Bom trabalho.”`, '#f4e6b8');
      /* tem mais a contar? a conversa continua: a próxima missão é apresentada, não empurrada */
      if (!o) setTimeout(() => { if (!dlg.isOpen && quests.offers(nm).length && Math.hypot(n.pos.x - state.fx * T, n.pos.z - state.fy * T) < 8) talkTo(n); }, 450); },
    objProg: (d, i) => quests.objProg(d, i), objNeed: (d, i) => quests.objNeed(d, i) });
}
/** a Forja de Elite do Brokki: material de bicho elite + minério + ouro = peça lendária do seu nível */
const ELITE_FORGE: { id: string; label: string; slot: Slot; need: [string, number][]; gold: number; say: string }[] = [
  { id: 'w', label: 'Lâmina Presa-Alfa', slot: 'weapon', need: [['el_fang', 4], ['el_hide', 1], ['ore_i', 6]], gold: 300, say: 'Presa no fio, couro no cabo. Corta como mordida.' },
  { id: 'a', label: 'Peitoral de Couro de Elite', slot: 'armor', need: [['el_hide', 5], ['el_hoof', 2], ['ore_i', 6]], gold: 350, say: 'Couro de quem mandava na matilha. Agora manda em você: protege.' },
  { id: 'h', label: 'Elmo da Galhada Ancestral', slot: 'helm', need: [['el_horn', 3], ['el_hide', 1], ['ore_i', 4]], gold: 250, say: 'Quem vê esse elmo na mata pensa duas vezes.' },
  { id: 'b', label: 'Botas de Casco de Ferro', slot: 'boots', need: [['el_hoof', 4], ['el_hide', 1]], gold: 200, say: 'Pisam pedra, gelo e lama como se fosse tapete.' },
  { id: 's', label: 'Escudo de Cerne Vivo', slot: 'shield', need: [['el_heart', 2], ['el_hide', 2], ['plank', 4]], gold: 300, say: 'Madeira que ainda pulsa. Fecha a rachadura sozinha.' },
  { id: 'm', label: 'Amuleto da Presa', slot: 'amulet', need: [['el_fang', 3], ['gem', 1]], gold: 250, say: 'Três presas e uma gema. Dizem que o dono ouve a matilha de longe.' },
];
function eliteForge(n: (typeof npcSys.npcs)[number]) {
  const has = (r: (typeof ELITE_FORGE)[number]) => r.need.every(([i, k]) => inv.count(i) >= k) && game.st.gold >= r.gold;
  const ch: Choice[] = ELITE_FORGE.map((r) => ({ kind: 'custom', label: `${has(r) ? '⚒' : '✗'} ${r.label}`, hint: `${r.need.map(([i, k]) => `${inv.count(i)}/${k} ${ITEMS_TBL[i]?.name ?? i}`).join(' · ')} · ${r.gold} 🪙`, cb: () => {
    if (!has(r)) { audio.error(); dlg.setText('Falta material. Bicho elite não se acha na esquina: procure os grandes, os que têm nome, os que mandam na matilha.'); return; }
    for (const [i, k] of r.need) inv.take(i, k); game.st.gold -= r.gold;
    const g = genGear(Math.max(5, game.st.lvl + 3), Math.random() < 0.25 ? 'epic' : 'legendary', r.slot); (g as { name: string }).name = r.label;
    if (!inv.addGear(g)) { for (const [i, k] of r.need) inv.add(i, k); game.st.gold += r.gold; dlg.setText('A mochila está cheia. Abra espaço e volte.'); return; }
    audio.hit(); setTimeout(() => audio.hit(), 280); setTimeout(() => audio.craftDone?.(), 700); dlg.setText(`${r.say} (${r.label} foi para a sua mochila.)`); game.logMsg(`⚒ Brokki forjou: ${r.label}.`, '#ffb060');
  } })) as Choice[];
  ch.push({ kind: 'close', label: 'Até logo' });
  let pr: string | null = null; try { pr = portraitOf(n.def.name, n.hero.root); } catch { pr = null; }
  openDlg({ name: n.def.name, role: n.def.role, portrait: pr, text: 'Mostra o que você trouxe. Presa, couro, chifre, casco, cerne: material de elite. O resto eu tenho.', choices: ch, onAccept: () => {}, onTurnIn: () => {} });
}
const compendium = createCompendium({ where: () => zoneName(), day: () => dayIndex(), lvl: () => game.st.lvl });
/* busca e captura: quem mentiu e fugiu se esconde longe; achá-lo e matá-lo pesa MAIS (+14) do que tudo o que se perdeu */
type Hunt = { qid: string; type: EnemyType; name: string; x: number; z: number; lvl: number };
let hunt: Hunt | null = (() => { try { return JSON.parse(localStorage.getItem('karmika.hunt') || 'null'); } catch { return null; } })();
function spawnHunt(h: Hunt) { const e = game.enemies.spawn(h.type, h.x, h.z, { name: h.name, tag: 'hunt', hpMul: 3.5, dmgMul: 1.3, scale: 1.25, lvl: h.lvl }); (e as typeof e & { yielded?: boolean }).yielded = true; }
function startHunt(type: EnemyType, name: string, lvl: number) {
  const h0 = heroPosNow(); let x = h0.x, z = h0.z;
  for (let k = 0; k < 40; k++) { const a = Math.random() * 6.283, d = 70 + Math.random() * 50; const tx = h0.x + Math.cos(a) * d, tz = h0.z + Math.sin(a) * d; const gx = Math.floor(tx / T), gy = Math.floor(tz / T); if (city.map[gy]?.[gx] === 'grass' || city.map[gy]?.[gx] === 'road') { x = tx; z = tz; break; } }
  const qid = 'q_hunt_' + Date.now(), fname = `${name}, o Fugitivo`;
  hunt = { qid, type, name: fname, x, z, lvl: lvl + 2 }; try { localStorage.setItem('karmika.hunt', JSON.stringify(hunt)); } catch { /* */ }
  const dir = (() => { const a = Math.atan2(z - h0.z, x - h0.x) * 180 / Math.PI; const N = ['leste', 'sudeste', 'sul', 'sudoeste', 'oeste', 'noroeste', 'norte', 'nordeste']; return N[Math.round(((a + 360) % 360) / 45) % 8]; })();
  quests.accept({ id: qid, name: `Busca e captura: ${name}`, lvl: lvl + 2, giver: 'O Olho', turnin: 'O Olho', text: `${name} mentiu, cravou uma lâmina em você e fugiu para o ${dir}, a uns ${Math.round(Math.hypot(x - h0.x, z - h0.z))} m. Encontre-o e termine o que começou.`, objs: [{ kind: 'kill', type, n: 1 }], xp: Math.round(game.xpNeed() * 0.6), gold: 80 + lvl * 20 });
  spawnHunt(hunt); game.logMsg(`🩸 Nova caçada: ${fname} fugiu para o ${dir}.`, '#ff8a7a');
}
if (hunt) setTimeout(() => { if (hunt) spawnHunt(hunt); }, 1500);
game.setOnYield((e, decide) => {
  const hp = heroPosNow(), lvl = Math.max(2, (e.def.lvl ?? 1) + 2);
  surrender({ name: e.def.name, level: e.def.lvl ?? 1, demonic: ['prince', 'tormentor', 'bishop', 'imp'].includes(e.type),
    karma: (dk) => { state.karma = Math.max(-100, Math.min(100, state.karma + dk)); }, log: (t, c) => game.logMsg(t, c),
    treasure: () => { game.spawnGear(hp.x, hp.z, heightAt(hp.x, hp.z), lvl + 2, { rare: 8, legendary: 6, relic: 3 }, 2, 'rare'); game.st.gold += 60 + lvl * 15; game.logMsg('💰 Tesouros caem aos seus pés.', '#ffd24a'); },
    xp: (f) => game.gainXp(Math.round(game.xpNeed() * f)), tome: () => inv.add('tome', 1), hurt: (f) => game.damage(Math.round(game.st.hpMax * f), heroPosNow()),
    kill: () => { feats.bump('executed'); breakVow('misericordia'); decide(true); }, spare: () => { feats.bump('spared'); decide(false); }, record: (r) => { compendium.add(r); if (/recusou o suborno/i.test(r.title)) feats.bump('bribe_no'); if (/vendeu a sua nobreza/i.test(r.title)) feats.bump('bribe_yes'); }, fled: () => startHunt(e.type, e.def.name, e.def.lvl ?? 1), sealed: !profile?.eye });
});
/* materiais de elite (25/10): bicho elite (maior que o normal, ou com nome próprio) deixa couro, presa, chifre, casco ou cerne
   — só com eles o Mestre-Forjador Brokki, em Brasaforja, forja as peças lendárias */
const ELITE_MATS: Partial<Record<EnemyType, [string, string]>> = { wolf: ['el_fang', 'el_hide'], frostwolf: ['el_fang', 'el_hide'], coyote: ['el_fang', 'el_hide'], werewolf: ['el_hide', 'el_fang'], boar: ['el_horn', 'el_hide'], deer: ['el_horn', 'el_hoof'], treant: ['el_heart', 'el_horn'], rat: ['el_fang', 'el_hide'], bat: ['el_fang', 'el_hoof'] };
function eliteDrop(t: EnemyType, e: { def: { name: string; scale?: number; lvl?: number }; pos: THREE.Vector3 }) {
  const m = ELITE_MATS[t]; if (!m) return; const base = DEFS[t]; const elite = (e.def.scale ?? 1) > (base?.scale ?? 1) * 1.2 || (!!base && e.def.name !== base.name); if (!elite) return;
  const got: string[] = [m[0]]; if (Math.random() < 0.55) got.push(m[1]); if (Math.random() < 0.25) got.push(m[0]);
  for (const id of got) inv.add(id, 1); audio.coins?.(2);
  for (let i = 0; i < 24; i++) particles.spawn(e.pos.x, e.pos.y + 1, e.pos.z, { vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 3, vz: (Math.random() - 0.5) * 3, life: 1, s0: 0.25, s1: 0.04, c0: 0xffe8a0, c1: 0xff8a2a, a: 1, g: 4 });
  game.logMsg(`✦ ${e.def.name} deixou material de elite: ${got.map((id) => ITEMS_TBL[id]?.name ?? id).join(', ')}. O Mestre-Forjador Brokki, em Brasaforja, sabe o que fazer com isso.`, '#ffb060');
}
game.setOnKill((t, e) => { try { eliteDrop(t, e as never); } catch { /* */ } featKill(t, e); eventos.onKill(e as never); if (t === 'deer' && myPath() !== 'lob') breakVow('inocente'); /* o lobo caça para comer: cervo não é sangue inocente para a matilha */ dgs.onKill(e as never); if (SKIN[t]) (e as typeof e & { corpse?: number }).corpse = 90; /* a fera fica no chão para ser esfolada */ if ((e as typeof e & { tag?: string }).tag === 'hunt' && hunt) { const h = hunt; hunt = null; localStorage.removeItem('karmika.hunt'); feats.bump('hunts'); const sealedH = !profile?.eye; if (!sealedH) state.karma = Math.min(100, state.karma + 14);
  const what = `Você encontrou ${h.name} no esconderijo e terminou o que ele mesmo começou com a mentira.`; compendium.add({ title: `${h.name}: justiça tardia`, what, delta: 14, sealed: sealedH }); if (sealedH) game.logMsg('🌑 Em algum lugar, algo que ainda dorme guardou o que você fez.', '#a898c8');
  if (!sealedH) setTimeout(() => { eyeSees('Justiça tardia.', what, 'Você foi enganado uma vez, e pagou por isso. Mas não deixou a mentira vencer: buscou, encontrou e cumpriu o seu papel. A ingenuidade se apaga diante da persistência.', 14); const d = quests.q.active[h.qid] ? quests.offers('O Olho') : null; void d; }, 600);
  setTimeout(() => { const d2 = (quests as unknown as { turnins(n: string): { id: string }[] }).turnins('O Olho').find((x) => x.id === h.qid); if (d2) quests.turnIn(d2 as never); }, 900); } quests.onKill(t); if ((e as typeof e & { tag?: string }).tag === 'crypt') pourBlood(e); for (const fl of CRYPT_FLOORS) if (fl.elite && fl.elite.seal && e.def.name === fl.elite.name) { inv.add(fl.elite.seal, 1); chat.sys(`✦ ${fl.elite.name} caiu e deixou o ${ITEMS_TBL[fl.elite.seal]?.name ?? fl.elite.seal}.`); }
  if (e.def.name === 'Bispo Caído') { heroicAct('O Bispo Caído foi derrubado — a Catedral respira'); state.karma = Math.min(100, state.karma + 20); localStorage.setItem('karmika.crypt.done', '1'); chat.sys('✦ O Olho derrama uma lágrima sobre o trono negro. A Catedral Abandonada está purificada.'); game.logMsg('🏅 Título: Purificador da Catedral', '#ffe08a'); if (profile) { profile.title = 'Purificador da Catedral'; localStorage.setItem('karmika.char.v1', JSON.stringify(profile)); updateWho(); } return; }
  if (e.def.name === 'Sacerdote Maldito') { heroicAct('O Sacerdote Maldito caiu — a Catedral respira'); state.karma = Math.min(100, state.karma + 15); inv.add('tome', 2); localStorage.setItem('karmika.crypt.done', '1'); chat.sys('✦ Uma lágrima do Olho cai sobre o altar negro. A Catedral Abandonada foi purificada.'); game.logMsg('🏅 Título: Purificador da Catedral', '#ffe08a'); if (profile) { profile.title = 'Purificador da Catedral'; localStorage.setItem('karmika.char.v1', JSON.stringify(profile)); updateWho(); } return; } if (t === 'tormentor' || t === 'prince') heroicAct(`${DEFS[t].name} derrotado`); });
const globes = createGlobes(), eyeSys = createEye();
/** ato heroico: o Olho Kármico enche e transborda numa lágrima; karma sobe */
/* nível 20: o Olho desperta uma vez; o centro da barra vira o menu do Olho */
let awakening = false;
const crestEl = document.getElementById('crest') as HTMLElement, olhoEl = document.createElement('div'); olhoEl.id = 'olho'; document.body.appendChild(olhoEl);
function checkAwakening() {
  if (awakening || !profile || profile.eye || game.st.lvl < 20) { crestEl.classList.toggle('awake', !!profile?.eye); return; }
  awakening = true; game.logMsg('👁 Algo desperta...', '#ffe08a'); const bornTear = !soul.s.born; soul.s.born = true; soul.save(); // marca já: recarregar no meio da animação não dá uma 2ª lágrima
  const sealedNow = compendium.unseal(); const owed = sealedNow.reduce((a, e) => a + e.delta, 0);
  playAwakening(profile.name || RACES[state.race].label, sealedNow, () => { feats.max('eye', 1); if (bornTear) { setTimeout(() => { giveTear('💧 Marghar se emociona: você acaba de nascer para o karma. Uma Lágrima do Olho é sua. Guarde para a morte, troque por Premium ou venda.'); dispatchEvent(new CustomEvent('karmika:burst', { detail: { c0: 0xffffff, c1: 0x9ad7ff, n: 90 } })); }, 1800); } state.karma = Math.max(-100, Math.min(100, state.karma + owed)); if (owed) game.logMsg(`👁 O Olho cobra o que guardou: karma ${owed > 0 ? '+' : ''}${owed}.`, owed > 0 ? '#9ad7ff' : '#ff8a7a'); profile!.eye = true; localStorage.setItem('karmika.char.v1', JSON.stringify(profile)); awakening = false; crestEl.classList.add('awake'); heroicAct('O Olho Kármico despertou', false); }); // a Lágrima do despertar já é a do nascimento (antes vinham duas)
}
function renderOlho() {
  const k = Math.round(state.karma), title = quests.title || 'Aprendiz';
  olhoEl.innerHTML = `<div class="pn olhopn"><h2>👁 Olho Kármico <button data-x>✕</button></h2>
    <div class="cols"><div class="col"><h3>Sua alma</h3><p><b>${profile?.name ?? ''}</b> · ${RACES[state.race].label} · <b>${title}</b></p><p>Karma acumulado: <b>${k}</b> / 100</p><small>O Olho enche devagar com suas atitudes e só transborda em atos heroicos. Ele nunca enche por completo — a lágrima é a carga kármica que sobra.</small>
      <h3>Ascensão</h3><p>Nível ${game.st.lvl}. No nível 100 você escolhe duas especializações; 200 e 300 abrem fusões e a forma final.</p><small>As escolas ficam em Askavik, a cidade média. Quando as estradas estiverem abertas, uma missão o levará até lá.</small></div>
    <div class="col"><h3>Atos</h3>${quests.q.done.length ? `<p>${quests.q.done.length} missões concluídas</p>` : '<p>Nenhuma missão concluída ainda.</p>'}<p>${game.st.kills} abates</p><small>Matar outros jogadores e abandonar inocentes pesa para a sombra; proteger a vila e libertar bestas pesa para a luz. O Olho lembra de tudo.</small></div></div>
    <small class="ft">Esc fecha</small></div>`;
  olhoEl.style.display = 'flex';
}
let olhoOpen = false;
function toggleOlho(on?: boolean) { olhoOpen = on ?? !olhoOpen; if (olhoOpen) renderOlho(); else olhoEl.style.display = 'none'; }
olhoEl.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-x]') || t === olhoEl) toggleOlho(false); });
document.getElementById('sigil')?.addEventListener('click', () => { if (profile?.eye) toggleOlho(); else game.logMsg(`O Olho ainda dorme. Ele desperta no nível 20 (você está no ${game.st.lvl}).`, '#b9c6e0'); });
function heroicAct(why: string, tear = true) { feats.bump('heroic'); eyeSys.heroic(); state.karma = Math.min(100, state.karma + 25); game.logMsg(`👁 ${why} — o Olho Kármico transborda.`, '#ffe08a');
  /* o Olho dormindo (antes do nível 20) não chora: o ato fica guardado no Compêndio, mas não vira Lágrima */
  if (!tear) return;
  if (!profile?.eye) { game.logMsg('👁 O Olho ainda dorme: este ato fica guardado, mas só o Olho aberto chora Lágrimas (nível 20).', '#b9c6e0'); return; }
  giveTear('💧 Uma Lágrima do Olho cai na sua mão. Guardada, ela paga uma volta da alma sem penalidade; também vale ouro e Premium.'); }
function giveTear(msg: string) { inv.add('lagrima', 1, true); game.logMsg(msg, '#9ad7ff'); audio.chime(); }
function updateWho() {
  const who = document.getElementById('who'), lbl = document.getElementById('lbl'); if (!who || !lbl) return;
  who.textContent = profile ? profile.name : RACES[state.race].label;
  lbl.textContent = profile ? `${profile.title || (profile.origin === 'human' ? 'Humano' : profile.origin === 'dwarf' ? 'Anão' : 'Elfo') + ' · Aprendiz'}` : 'Olho Karmika';
}
updateWho();
/* ---- tela de criação de personagem ---- */
let createAC: AbortController | null = null;
/** reencarnar: a alma (nome, karma, nível, mochila, ouro, cofre, missões) entra num corpo novo, sem classe */
function rebirth(name: string, np: Profile) {
  const past = soul.s.lives[soul.s.lives.length - 1];
  profile = np; localStorage.setItem('karmika.char.v1', JSON.stringify(profile)); // sem path: Hrefna lê o caminho de novo
  state.race = raceOf(np.origin); game.resetClass(classOfRace(state.race)); game.setClassName(classOfRace(state.race));
  setMyFac(null); quests.forget((id) => id.startsWith('v_'));
  tree.wipe(); const pts = inv.respec(); swapHero(); updateWho(); checkSkinLevel();
  soul.s.pending = null; soul.save();
  const s0 = city.starts[np.origin];
  const msg = `✦ ${name} renasce ${np.origin === 'dwarf' ? 'anão' : np.origin === 'elf' ? 'elfo' : 'humano'}, em ${s0.name}. A alma lembra; o corpo é novo.`;
  if (limiar.active) limiar.descend(() => placeAt(msg, { x: s0.x, y: s0.y }), true); else goHome(msg, { x: s0.x, y: s0.y });
  setTimeout(() => {
    game.logMsg(`⚖ Nível ${game.st.lvl}, mochila, ouro e missões vieram com você. A classe recomeçou: fale com Hrefna, em Askavik, para ler o caminho de novo.`, '#ffe08a');
    if (past) game.logMsg(`✦ Eco da vida passada: se seguir ${past.cls} de novo, a classe ganha ${CATCHUP_MUL}× XP até o nível ${soul.s.catchup?.until ?? past.clsLvl}.`, '#c9a0ff');
    if (pts) game.logMsg(`★ ${pts} pontos de atributo voltaram para distribuir (I).`, '#ffe08a');
    netRef?.lookNow(); saveSlotMeta();
  }, 900);
}
/** reborn = reencarnação: mesma alma (nome), corpo novo; nível, mochila, ouro, cofre e missões ficam */
function showCreate(reborn = false) {
  const el = document.getElementById('create')!; el.style.display = 'grid'; creating = true;
  createAC?.abort(); createAC = new AbortController(); const sig = createAC.signal; const soulName = reborn ? profile?.name ?? '' : '', oldProfile = reborn ? profile : null;
  el.classList.toggle('reborn', reborn); (el.querySelector('h2') as HTMLElement).textContent = reborn ? 'Reencarnação' : 'Criação de personagem';
  (el.querySelector('#c-go') as HTMLElement).textContent = reborn ? 'RENASCER EM KARMIKA' : 'ENTRAR EM KARMIKA';
  { const hint = el.querySelector('.hint') as HTMLElement; hint.dataset.orig ??= hint.innerHTML; hint.innerHTML = reborn ? `A alma de <b>${soulName}</b> escolhe um corpo novo. Você mantém o nível ${game.st.lvl}, a mochila, o ouro, o cofre e as missões, e volta sem classe: refaça o caminho com Hrefna. Se escolher ${soul.s.catchup?.cls ?? game.classInfo.name} de novo, a classe ganha ${CATCHUP_MUL}× XP até o nível ${soul.s.catchup?.until ?? game.classInfo.lvl}.` : hint.dataset.orig; }
  { const nm = el.querySelector('#c-name') as HTMLInputElement; nm.value = soulName; (el.querySelector('#c-err') as HTMLElement).textContent = ''; }
  const hairEl = el.querySelector('#c-hair')!, skinEl = el.querySelector('#c-skin')!, styleEl = el.querySelector('#c-style')!, beardEl = el.querySelector('#c-beard')!, pv = el.querySelector('#c-pv') as HTMLImageElement;
  hairEl.innerHTML = HAIRS.map((h, i) => `<i data-h="${i}" class="${i === 0 ? 'on' : ''}" style="background:#${h.toString(16).padStart(6, '0')}"></i>`).join('');
  skinEl.innerHTML = SKINS.map((h, i) => `<i data-s="${i}" class="${i === 0 ? 'on' : ''}" style="background:#${h.toString(16).padStart(6, '0')}"></i>`).join('');
  const STYLES: [Profile['hairStyle'], string][] = [['braid', 'Trança'], ['long', 'Comprido'], ['short', 'Curto'], ['bald', 'Raspado']];
  styleEl.innerHTML = STYLES.map(([k, n], i) => `<button data-st="${k}" class="${i === 0 ? 'on' : ''}">${n}</button>`).join('');
  beardEl.innerHTML = [['0', 'Sem barba'], ['1', 'Curta'], ['2', 'Longa']].map(([k, n], i) => `<button data-bd="${k}" class="${i === 0 ? 'on' : ''}">${n}</button>`).join('');
  let hair = 0, skin = 0, origin: Profile['origin'] = 'human', hairStyle: Profile['hairStyle'] = 'braid', beard = 0, sex: 'f' | 'm' = 'f';
  el.querySelectorAll('[data-o]').forEach((x) => x.classList.toggle('on', (x as HTMLElement).dataset.o === 'human')); el.querySelectorAll('[data-sx]').forEach((x) => x.classList.toggle('on', (x as HTMLElement).dataset.sx === 'f'));
  el.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const h = t.closest('[data-h]') as HTMLElement | null; if (h) { hair = +h.dataset.h!; hairEl.querySelectorAll('i').forEach((x) => x.classList.toggle('on', x === h)); preview(); }
    const sk = t.closest('[data-s]') as HTMLElement | null; if (sk) { skin = +sk.dataset.s!; skinEl.querySelectorAll('i').forEach((x) => x.classList.toggle('on', x === sk)); preview(); }
    const o = t.closest('[data-o]') as HTMLElement | null; if (o) { origin = o.dataset.o as Profile['origin']; el.querySelectorAll('[data-o]').forEach((x) => x.classList.toggle('on', x === o)); preview(); }
    const st = t.closest('[data-st]') as HTMLElement | null; if (st) { hairStyle = st.dataset.st as Profile['hairStyle']; styleEl.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === st)); preview(); }
    const sx = t.closest('[data-sx]') as HTMLElement | null; if (sx) { sex = sx.dataset.sx as 'f' | 'm'; el.querySelectorAll('[data-sx]').forEach((x) => x.classList.toggle('on', x === sx)); preview(); }
    const bd = t.closest('[data-bd]') as HTMLElement | null; if (bd) { beard = +bd.dataset.bd!; beardEl.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === bd)); preview(); }
    if (t.closest('#c-back')) { el.style.display = 'none'; creating = false; inicio.openChars(pendingServer); return; }
    if (t.closest('#c-go')) {
      const name = ((el.querySelector('#c-name') as HTMLInputElement).value || '').trim(); if (name.length < 2) { (el.querySelector('#c-err') as HTMLElement).textContent = 'Escolha um nome com pelo menos 2 letras.'; return; }
      if (reborn) { rebirth(name, { name, origin, sex, hair: HAIRS[hair], skin: SKINS[skin], title: oldProfile?.title ?? '', hairStyle, beard, eye: oldProfile?.eye }); el.style.display = 'none'; creating = false; return; }
      soul.reset(); state.karma = 0;
      game.resetClass(classOfRace(raceOf(origin)));
      try { localStorage.removeItem('karmika.welcome'); localStorage.removeItem('karmika.startkit'); } catch { /* */ } // personagem novo: o Baú de Boas-Vindas espera de novo
      profile = { name, origin, sex, hair: HAIRS[hair], skin: SKINS[skin], title: '', hairStyle, beard }; localStorage.setItem('karmika.char.v1', JSON.stringify(profile));
      inv.reset(); quests.reset(); state.race = raceOf(origin); swapHero(); updateWho(); { const s0 = city.starts[origin]; state.fx = s0.x; state.fy = s0.y; localStorage.removeItem(HOME_KEY); home = defaultHome(); if (origin !== 'human') game.logMsg(origin === 'dwarf' ? '⛏ Você nasce em Brasaforja, no sopé da Montanha Negra. As estradas levam a Askavik, onde as academias esperam.' : '🌿 Você nasce em Lithendel, sob as árvores mais velhas do mundo. As estradas levam a Askavik, onde as academias esperam.', '#ffe08a'); } setCombat(false, true);
      el.style.display = 'none'; creating = false; checkSkinLevel(); setTimeout(() => { joinServer(); saveSlotMeta(); }, 600); game.logMsg(`Bem-vindo a Karmika, ${name}. Fale com Garrick (E) para começar.`, '#ffe08a');
      mail.welcome(name); game.logMsg('📮 Três cartas esperam por você na caixa de correio.', '#ffe08a'); giveStartKit();
    }
  }, { signal: sig });
  let pvT = 0;
  addEventListener('karmika:skinready', () => { if (el.style.display === 'none') return; for (const ms of [120, 600, 1500]) setTimeout(() => { try { portraits.delete('hero'); const src = portraitOf('hero', hero.root, true); if (src) pv.src = src; } catch { /* */ } }, ms); }, { signal: sig }); /* a textura do modelo chega um pouco depois: tira o retrato de novo */
  function preview() {
    state.race = raceOf(origin); profile = { name: '', origin, sex, hair: HAIRS[hair], skin: SKINS[skin], title: '', hairStyle, beard }; swapHero(); profile = null;
    for (const id of ['c-hair', 'c-skin', 'c-style', 'c-beard']) { const n = el.querySelector('#' + id) as HTMLElement | null; if (n) { n.style.display = origin === 'human' ? 'none' : ''; (n.previousElementSibling as HTMLElement).style.display = origin === 'human' ? 'none' : ''; } }
    (el.querySelector('#c-sex') as HTMLElement).style.display = origin === 'human' ? '' : 'none'; ((el.querySelector('#c-sex') as HTMLElement).previousElementSibling as HTMLElement).style.display = origin === 'human' ? '' : 'none';
    (el.querySelector('#c-note') as HTMLElement).textContent = origin === 'dwarf' ? 'Anões carregam a barba da forja: penteado e barba vêm da raça.' : origin === 'elf' ? 'Elfos: orelhas pontudas e passo leve. Por ora trilham o Caminho do Norte; a Academia abre depois.' : '';
    clearTimeout(pvT); pvT = window.setTimeout(() => { try { portraits.delete('hero'); const src = portraitOf('hero', hero.root, true); if (src) pv.src = src; } catch { /* */ } }, 150);
  }
  preview();
}
document.getElementById('m-new')?.addEventListener('click', () => { if (!confirm('Criar um novo personagem do zero apaga o atual: nível, mochila, magias, missões, relíquias e lar. Continuar?')) return; for (const k of Object.keys(localStorage)) if (k.startsWith('karmika.') && !k.startsWith('karmika.ui.') && k !== 'karmika.pix' && k !== 'karmika.shadows' && k !== 'karmika.music' && k !== 'karmika.rows') localStorage.removeItem(k); location.reload(); });
/* ---------- página de opções: gráficos, som e jogo, tudo ao vivo ---------- */
function applyOpts(k?: keyof Opts) {
  saveOpts();
  if (!k || k === 'pix' || k === 'wratio' || k === 'ui' || k === 'uis' || k === 'res') { PIX = opts.pix; WORLD_RATIO = opts.wratio; dual.ratio = WORLD_RATIO; resize(); }
  if (!k || k === 'shadows') { renderer.shadowMap.enabled = opts.shadows; scene.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined; if (!m) return; for (const mm of Array.isArray(m) ? m : [m]) mm.needsUpdate = true; }); }
  if (!k || k === 'charShadows') { charShadow.on = opts.charShadows; const setCast = (root: THREE.Object3D) => root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !(m as unknown as { isSprite?: boolean }).isSprite && (m.material as THREE.Material)?.type !== 'MeshBasicMaterial') m.castShadow = opts.charShadows; }); setCast(hero.root); for (const n of npcSys.npcs) setCast(n.hero.root); }
  if (!k || k === 'shadowRes') { sun.shadow.mapSize.set(opts.shadowRes, opts.shadowRes); if (sun.shadow.map) { sun.shadow.map.dispose(); (sun.shadow as unknown as { map: null }).map = null; } }
  if (!k || k === 'particles') particles.density = opts.particles;
  if (!k || k === 'master' || k === 'music' || k === 'sfx' || k === 'amb') audio.setVolumes(opts.master, opts.music, opts.sfx, opts.amb);
  if (!k || k === 'dmgText') document.body.classList.toggle('nodmg', !opts.dmgText);
  if (!k || k === 'txt' || k === 'chat' || k === 'uis' || k === 'ui') applyTextScale();
  if (!k || k === 'fps') { const v = document.getElementById('ver'); if (v) v.style.display = opts.fps ? '' : 'none'; }
}
/* ---------- Acessibilidade (Erling, 23/10: "os textos estão extremamente pequenos; muita gente tem problema de visão").
   O tamanho do texto multiplica TODAS as fontes em px das folhas de estilo do jogo (sem esticar janelas e ícones);
   o chat tem o seu próprio multiplicador por cima. A dica dos itens também acompanha o tamanho da interface. ---------- */
const FS0 = new WeakMap<CSSStyleRule, number>();
function applyTextScale() {
  const walk = (rules: CSSRuleList) => { for (const r of Array.from(rules)) {
    if ((r as CSSGroupingRule).cssRules && !(r as CSSStyleRule).style) { walk((r as CSSGroupingRule).cssRules); continue; }
    const sr = r as CSSStyleRule; if (!sr.style) continue; let px = FS0.get(sr);
    if (px === undefined) { const f = sr.style.fontSize; if (!f || !f.endsWith('px')) continue; px = parseFloat(f); if (!(px > 0)) continue; FS0.set(sr, px); }
    const sel = sr.selectorText || '', tipK = /#tip\b|#tip2\b/.test(sel) ? uiScale() : 1;
    sr.style.fontSize = (px * opts.txt * tipK * (/#chat\b/.test(sel) ? opts.chat : 1)).toFixed(2) + 'px'; } };
  for (const sh of Array.from(document.styleSheets)) { try { walk(sh.cssRules); } catch { /* folha de fora (fontes): não dá para ler, e não precisa */ } }
  for (const id of ['tip', 'tip2']) { const t = document.getElementById(id); if (t) t.style.maxWidth = `${Math.round(270 * opts.txt * uiScale())}px`; }
}
setTimeout(applyTextScale, 0); setTimeout(applyTextScale, 2500); // depois dos estilos que os módulos criam
function renderOptions() {
  const el = document.getElementById('p-opt'); if (!el) return;
  const seg = (k: keyof Opts, vals: [string | number | boolean, string][]) => `<div class="seg">${vals.map(([v, n]) => `<button data-ok="${k}" data-ov="${v}" class="${opts[k] === v ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  const rng = (k: keyof Opts, min: number, max: number, step: number, fmt: (v: number) => string) => `<div class="rng"><input type="range" data-or="${k}" min="${min}" max="${max}" step="${step}" value="${opts[k]}"><b>${fmt(opts[k] as number)}</b></div>`;
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  el.innerHTML = `<h2>Opções</h2>
    <h3>Acessibilidade</h3>
    <div class="stat"><span>Tamanho do texto <small>Todos os textos do jogo: mochila, dicas dos itens, missões, diálogos, menus</small></span>${seg('txt', [1, 1.15, 1.3, 1.5, 1.75, 2].map((v) => [v, pct(v)] as [number, string]))}</div>
    <div class="stat"><span>Texto do chat <small>Por cima do tamanho do texto: só a caixa de conversa</small></span>${seg('chat', [1, 1.25, 1.5, 1.75, 2, 2.5].map((v) => [v, pct(v)] as [number, string]))}</div>
    <h3>Tela</h3>
    <div class="stat"><span>Tamanho da interface <small>Janelas, ícones e texto juntos. Acompanha o seu monitor sozinho (Full HD, Quad HD, 4K). 1,00 é o padrão; vai de 0,80 a 2,00</small></span>${seg('uis', [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.5, 1.75, 2].map((v) => [v, v.toFixed(2).replace('.', ',')] as [number, string]))}</div>
    <div class="stat"><span>Resolução do mundo <small>Full HD: mesmo visual e o mesmo FPS em qualquer monitor · Quad HD: mais nítido · Nativa: todos os pixels (mais pesado)</small></span>${seg('res', [[720, '720p'], [1080, 'Full HD'], [1440, 'Quad HD'], [0, 'Nativa']])}</div>
    <h3>Gráficos</h3>
    <div class="stat"><span>Tamanho do pixel <small>1 = nítido (pesado) · 4 = pixel grosso (leve)</small></span>${seg('pix', [[1, '1'], [2, '2'], [3, '3'], [4, '4']])}</div>
    <div class="stat"><span>Detalhe do cenário <small>cenário em 1/N da resolução dos personagens</small></span>${seg('wratio', [[1, 'Igual'], [2, 'Metade'], [3, 'Um terço']])}</div>
    <div class="stat"><span>Sombras</span>${seg('shadows', [[true, 'Ligadas'], [false, 'Desligadas']])}</div>
    <div class="stat"><span>Sombras dos personagens <small>caras: dobram o custo de cada personagem; a mancha no pé fica</small></span>${seg('charShadows', [[true, 'Ligadas'], [false, 'Desligadas']])}</div>
    <div class="stat"><span>Qualidade das sombras</span>${seg('shadowRes', [[512, 'Baixa'], [1024, 'Média'], [2048, 'Alta']])}</div>
    <div class="stat"><span>Brilho (bloom)</span>${rng('bloom', 0, 2, 0.1, pct)}</div>
    <div class="stat"><span>Partículas e efeitos</span>${rng('particles', 0.2, 1.5, 0.1, pct)}</div>
    <div class="stat"><span>Números de dano</span>${seg('dmgText', [[true, 'Mostrar'], [false, 'Esconder']])}</div>
    <div class="stat"><span>Contador de FPS</span>${seg('fps', [[true, 'Mostrar'], [false, 'Esconder']])}</div>
    <h3>Som</h3>
    <div class="stat"><span>Volume geral <small>O: mudo</small></span>${rng('master', 0, 1, 0.05, pct)}</div>
    <div class="stat"><span>Música <small>P: liga/desliga</small></span>${rng('music', 0, 1, 0.05, pct)}</div>
    <div class="stat"><span>Efeitos (golpes, magias, passos)</span>${rng('sfx', 0, 1, 0.05, pct)}</div>
    <div class="stat"><span>Ambiente (vento, fauna, água, fogo)</span>${rng('amb', 0, 1, 0.05, pct)}</div>
    <h3>Jogo</h3>
    <div class="stat"><span>Dia / noite</span><div class="seg"><button data-act="night">Alternar (N)</button></div></div>
    <div class="stat"><span>Zoom</span><div class="seg"><button data-act="zoom">Padrão</button><span class="hint3">roda do mouse: 5 m a 22 m</span></div></div>
    <div class="stat"><span>Janelas (chat, missões)</span><div class="seg"><button data-act="ui">Posições padrão</button></div></div>
    <div class="stat"><span>Restaurar</span><div class="seg"><button data-act="reset">Opções padrão</button></div></div>`;
}
document.getElementById('p-opt')?.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (!b) return;
  if (b.dataset.ok) { const k = b.dataset.ok as keyof Opts, raw = b.dataset.ov!; (opts as unknown as Record<string, unknown>)[k] = raw === 'true' ? true : raw === 'false' ? false : Number(raw); applyOpts(k); renderOptions(); audio.click(); return; }
  const a = b.dataset.act;
  if (a === 'night') window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
  if (a === 'zoom') { zoomTarget = 17; }
  if (a === 'ui') { localStorage.removeItem('karmika.ui.chat'); localStorage.removeItem('karmika.ui.quests'); game.logMsg('Posições das janelas restauradas (recarregue com F5).', '#b9c6e0'); }
  if (a === 'reset') { Object.assign(opts, OPT_DEF); applyOpts(); renderOptions(); }
});
document.getElementById('p-opt')?.addEventListener('input', (e) => { const i = e.target as HTMLInputElement; if (!i.dataset.or) return; const k = i.dataset.or as keyof Opts; (opts as unknown as Record<string, unknown>)[k] = Number(i.value); applyOpts(k); const b = i.nextElementSibling as HTMLElement | null; if (b) b.textContent = `${Math.round(Number(i.value) * 100)}%`; });
setTimeout(() => { renderOptions(); applyOpts(); applyArtSkin(); }, 0); // depois de o renderizador/composer existirem
setInterval(() => inv.save(), 8000);
const tileIdx = new Map<number, (typeof city.props)[number][]>();
function idx(p: (typeof city.props)[number]) { const k = p.gy * 1000 + p.gx; (tileIdx.get(k) ?? tileIdx.set(k, []).get(k)!).push(p); }
for (const p of city.props) if (p.kind === 'tree' || p.kind === 'rock' || p.kind === 'campfire' || p.kind === 'chest' || p.kind === 'herb') idx(p);
const chestsOpen = new Set<(typeof city.props)[number]>();
/** Baú de Boas-Vindas dos Caminhantes: o primeiro baú que um personagem novo abre traz um kit quase completo para começar */
function welcomeKit(_cx: number, _cz: number, _cy: number): boolean { return false; } // o kit agora mora no Baú do Caminhante
/** presentes de começo de jornada: vão direto para o Baú do Caminhante (uma vez por personagem) */
function giveStartKit() {
  try { if (localStorage.getItem('karmika.startkit')) return; localStorage.setItem('karmika.startkit', '1'); } catch { return; }
  const L = game.st.lvl, slots: Slot[] = ['weapon', 'shield', 'armor', 'helm', 'boots', 'cape', 'shoulders'];
  inv.vaultPut([['potion', 5], ['bread', 10], ['scroll_return', 1]], slots.map((sl) => genGear(Math.max(2, L + 1), sl === 'weapon' || sl === 'armor' ? 'magic' : 'normal', sl)));
  game.logMsg('🎁 Presentes de começo de jornada no seu Baú do Caminhante, perto do centro da vila.', '#ffe08a');
}
setTimeout(giveStartKit, 1500);

function nearProps(gx: number, gy: number, kinds: string[], rad = 2) { const out: (typeof city.props)[number][] = []; for (let y = gy - rad; y <= gy + rad; y++) for (let x = gx - rad; x <= gx + rad; x++) for (const p of tileIdx.get(y * 1000 + x) ?? []) if (kinds.includes(p.kind) && !(p as { gone?: boolean }).gone) out.push(p); return out; }
const chop = new Map<object, number>(), twigs = new Map<object, number>();
let fishing: { t: number; bite: number; at: { x: number; z: number }; total: number } | null = null;
/* pesca: a vara aparece na mão, ela lança (animação), a boia fica balançando ligada pela linha; quando o peixe morde a boia afunda e ela puxa */
const bobber = new THREE.Group(); { const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xd8302a })); const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf0ece0 })); bobber.add(b1, b2); bobber.visible = false; }
const fishLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xe8e4d8, transparent: true, opacity: 0.8 })); fishLine.visible = false; fishLine.frustumCulled = false;
function startFishing(at: { x: number; z: number }) {
  if (combatMode) setCombat(false);
  const rod = inv.tool('rod'); if (!rod) return;
  hero.holdTool = true; hero.setGear({ weapon: { base: rod.base, rarity: 'normal', tint: rod.tint, glow: rod.glow } }); hero.act('cast');
  const total = (6 + Math.random() * 8) / Math.sqrt(rod.power); fishing = { t: total, bite: 1.3, at, total };
  game.logMsg('🎣 Você lançou a linha... espere a boia afundar.', '#9ad7ff'); audio.swing();
}
function endFishing(msg?: string) { fishing = null; bobber.visible = false; fishLine.visible = false; hero.holdTool = false; syncGear(); if (msg) game.logMsg(msg); }
function updateFishing(dt: number, t: number) {
  if (!fishing) return;
  if (!bobber.parent) { scene.add(fine(bobber)); scene.add(fine(fishLine)); }
  if (keys.has('w') || keys.has('a') || keys.has('s') || keys.has('d') || game.menuOpen || combatMode) { endFishing('Você recolheu a linha.'); return; }
  fishing.t -= dt; const since = fishing.total - fishing.t, cast = Math.min(1, since / 0.6);
  const biting = fishing.t < fishing.bite;
  const tip = hero.weaponTip(new THREE.Vector3());
  const bx = THREE.MathUtils.lerp(tip.x, fishing.at.x, cast), bz = THREE.MathUtils.lerp(tip.z, fishing.at.z, cast);
  const by = cast < 1 ? THREE.MathUtils.lerp(tip.y, WL, cast) + Math.sin(cast * Math.PI) * 1.2 : WL + 0.02 + Math.sin(t * 3) * 0.025 - (biting ? 0.06 + 0.05 * Math.sin(t * 22) : 0);
  bobber.visible = true; bobber.position.set(bx, by, bz);
  const pos = fishLine.geometry.attributes.position as THREE.BufferAttribute; pos.setXYZ(0, tip.x, tip.y, tip.z); pos.setXYZ(1, bx, by + 0.08, bz); pos.needsUpdate = true; fishLine.visible = true;
  if (cast >= 1 && Math.random() < dt * (biting ? 14 : 2.5)) particles.spawn(bx + (Math.random() - 0.5) * 0.3, WL + 0.05, bz + (Math.random() - 0.5) * 0.3, { vy: biting ? 0.8 : 0.1, life: 0.6, s0: 0.1, s1: 0.4, c0: 0xdff4ff, c1: 0x9cd0ff, a: 0.5 });
  if (biting && !(fishing as { warned?: boolean }).warned) { (fishing as { warned?: boolean }).warned = true; game.logMsg('🎣 Mordeu!', '#ffe08a'); audio.click(); }
  if (fishing.t <= 0) { profs.gain('pescador', 3); const rod = inv.tool('rod'), y = rod?.yield ?? 1; const n = Math.max(1, Math.round((1 + (Math.random() < 0.3 ? 1 : 0)) * y * (0.8 + Math.random() * 0.4))); inv.add('fish', n); feats.bump('fish', n);
    if (rod && Math.random() < rod.luck) { inv.add('fish_g', 1); feats.bump('fish_g'); game.logMsg('🐠 Um Salmão Dourado sobe na linha!', '#ffc04a'); } hero.act('combo1'); audio.swing();
    for (let i = 0; i < 12; i++) particles.spawn(bx, WL + 0.1, bz, { vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 2, vz: (Math.random() - 0.5) * 2, life: 0.7, s0: 0.2, s1: 0.05, c0: 0xffffff, c1: 0x9cd0ff, a: 0.8, g: 9 });
    endFishing(); }
}
/* ---------- minimapa ---------- */
const MMS = MAP_W;
const mmBase = document.createElement('canvas'); mmBase.width = mmBase.height = MMS;
{
  const g = mmBase.getContext('2d')!; const BC: Record<string, string> = { meadow: '#5a8a3e', forest: '#2f6a34', swamp: '#53623c', snow: '#e4edf5', ruins: '#6a6a64', rock: '#7a736a', volcanic: '#2e2628', enchanted: '#5a4a8a', blight: '#4a3c46', jungle: '#1e4a22', coast: '#c8b488' };
  /* mapa com cara de carta: cor do bioma, relevo sombreado (luz do noroeste), copas mais escuras, água mais funda longe da margem */
  const HG = MM_HG, hw = mmHw, hgt = mmHgt;
  const hAt = (x: number, y: number) => hgt[Math.max(0, Math.min(hw - 1, Math.floor(y / HG))) * hw + Math.max(0, Math.min(hw - 1, Math.floor(x / HG)))];
  const id = g.createImageData(MMS, MMS), D = id.data, rgb = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const BCR: Record<string, number[]> = Object.fromEntries(Object.entries(BC).map(([k, v]) => [k, rgb(v)]));
  for (let y = 0; y < MMS; y++) for (let x = 0; x < MMS; x++) { const t = city.map[y]?.[x]; let c: number[]; let sh = 1;
    if (t === 'water') { let shore = 0; for (let k = 1; k <= 3 && !shore; k++) if (city.map[y - k]?.[x] !== 'water' || city.map[y + k]?.[x] !== 'water' || city.map[y]?.[x - k] !== 'water' || city.map[y]?.[x + k] !== 'water') shore = k; c = shore === 1 ? [70, 120, 170] : shore ? [52, 100, 156] : [38, 78, 130]; }
    else { c = t === 'road' ? [160, 134, 94] : t === 'plaza' ? [184, 166, 128] : BCR[city.biome[y]?.[x] ?? 'meadow'] ?? BCR.meadow; if (t === 'tree') c = c.map((v) => v * 0.72); sh = Math.max(0.6, Math.min(1.45, 1 + (hAt(x - 2, y - 2) - hAt(x + 2, y + 2)) * 0.32)); }
    const o = (y * MMS + x) * 4; D[o] = Math.min(255, c[0] * sh); D[o + 1] = Math.min(255, c[1] * sh); D[o + 2] = Math.min(255, c[2] * sh); D[o + 3] = 255; }
  g.putImageData(id, 0, 0);
  for (const p of city.props) { if (p.kind === 'house' || p.kind === 'temple' || p.kind === 'church' || p.kind === 'stall' || p.kind === 'tent') { g.fillStyle = p.kind === 'temple' || p.kind === 'church' ? '#a898c8' : '#7a4a32'; g.fillRect(p.gx, p.gy, p.w, p.h); } }
}
const BNAME: Record<string, string> = { meadow: 'Campos', forest: 'Floresta', swamp: 'Pântano', snow: 'Terras Geladas', ruins: 'Terras Antigas', rock: 'Garganta de Pedra', volcanic: 'Montanha Negra', enchanted: 'Floresta Encantada', blight: 'Terras Malditas', jungle: 'Selva Licantropa', coast: 'Costa do Vapor' };
const mmEl = document.getElementById('mm') as HTMLCanvasElement, mg = mmEl.getContext('2d')!;
/* círculo do minimapa redimensionável: arraste a alça ◣ (canto de baixo à esquerda); duplo clique volta ao padrão; tamanho salvo */
{ const mini = document.getElementById('mini') as HTMLElement, grip = document.createElement('div'); grip.className = 'mmgrip'; grip.title = 'Arraste para aumentar ou diminuir o minimapa (duplo clique: padrão)'; mini.appendChild(grip);
  let D = 170; try { D = +(localStorage.getItem('karmika.minisize') || 170) || 170; } catch { /* */ }
  const set = (d: number, save = false) => { D = Math.round(Math.max(120, Math.min(Math.min(380, innerHeight * 0.5), d))); mmEl.width = mmEl.height = D; mmEl.style.width = mmEl.style.height = D + 'px'; mini.style.width = D + 8 + 'px'; { const C = D / 2 + 4; grip.style.left = C - D * 0.354 - 9 + 'px'; grip.style.top = C + D * 0.354 - 11 + 'px'; } /* na borda do círculo, a 45° em baixo à esquerda */ if (save) try { localStorage.setItem('karmika.minisize', String(D)); } catch { /* */ } };
  set(D);
  let rs: { x: number; y: number; d: number } | null = null;
  grip.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); rs = { x: e.clientX, y: e.clientY, d: D }; grip.setPointerCapture(e.pointerId); });
  grip.addEventListener('pointermove', (e) => { if (rs) set(rs.d + Math.max(rs.x - e.clientX, e.clientY - rs.y)); }); // preso no canto de cima à direita: cresce para baixo e para a esquerda
  const end = () => { if (rs) { rs = null; set(D, true); } }; grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
  grip.addEventListener('dblclick', (e) => { e.stopPropagation(); set(170, true); });
}
const bmEl = document.getElementById('bm') as HTMLCanvasElement, bg = bmEl.getContext('2d')!, bigEl = document.getElementById('bigmap') as HTMLElement;
let bigOpen = false;
function toggleBigMap() { bigOpen = !bigOpen; bigEl.style.display = bigOpen ? 'block' : 'none'; if (bigOpen) { bigEl.dispatchEvent(new Event('karmika:open')); const h0 = hereT(); mapV.cx = h0.x; mapV.cy = h0.y; mapV.z = Math.max(mapV.z, 6.4); /* abre perto: lugares, níveis e região legíveis */ drawBig(); } }
setTimeout(() => floatWin(bigEl, 'map', { left: 'calc(50vw - 470px)', top: '5vh' }), 0);
/* janela do mapa redimensionável: arraste o canto ◢ (duplo clique volta ao padrão) ou ⛶ para maximizar; o tamanho fica salvo */
{
  const pn = bigEl.querySelector('.mappn') as HTMLElement, mv = bigEl.querySelector('.mview') as HTMLElement, grip = bigEl.querySelector('.mgrip') as HTMLElement;
  const KEY = 'karmika.mapsize', chrome = () => pn.offsetHeight - mv.offsetHeight; // título, legenda e rodapé
  const defSize = () => { const w = Math.min(940, innerWidth * 0.96); return { w, h: Math.min(w * 0.68, innerHeight - 220) }; };
  let size = defSize(), maxed: { w: number; h: number; l: string; t: string } | null = null;
  try { const s0 = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s0?.w && s0?.h) size = s0; } catch { /* */ }
  const apply = () => {
    const ch = chrome() || 150;
    size.w = Math.round(Math.max(420, Math.min(innerWidth - 8, size.w))); size.h = Math.round(Math.max(260, Math.min(innerHeight - ch - 8, size.h)));
    pn.style.width = size.w + 'px'; mv.style.height = size.h + 'px';
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ w: size.w, h: size.h })); } catch { /* */ } };
  // o canvas acompanha o tamanho real da janela (sem esticar): mais espaço = mais mapa à vista
  new ResizeObserver(() => { const w = Math.max(1, Math.round(mv.clientWidth)), h = Math.max(1, Math.round(mv.clientHeight)); if (bmEl.width !== w || bmEl.height !== h) { bmEl.width = w; bmEl.height = h; mapV.z = Math.max(mapV.z, mapZMin()); if (bigOpen) drawBig(); } }).observe(mv);
  apply();
  let rs: { x: number; y: number; w: number; h: number } | null = null;
  grip.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); maxed = null; rs = { x: e.clientX, y: e.clientY, w: size.w, h: size.h }; grip.setPointerCapture(e.pointerId); });
  grip.addEventListener('pointermove', (e) => { if (!rs) return; const r = bigEl.getBoundingClientRect(); size.w = Math.min(rs.w + e.clientX - rs.x, innerWidth - r.left - 4); size.h = Math.min(rs.h + e.clientY - rs.y, innerHeight - r.top - chrome() - 4); apply(); });
  const end = () => { if (rs) { rs = null; save(); } }; grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
  grip.addEventListener('dblclick', (e) => { e.stopPropagation(); size = defSize(); apply(); save(); });
  pn.querySelector('[data-max]')!.addEventListener('click', (e) => {
    e.stopPropagation();
    pn.style.translate = ''; bigEl.style.translate = ''; // sem deslocamento extra: o botão de restaurar nunca sai da tela
    if (maxed) { size = { w: maxed.w, h: maxed.h }; bigEl.style.left = maxed.l; bigEl.style.top = maxed.t; maxed = null; }
    else { maxed = { w: size.w, h: size.h, l: bigEl.style.left, t: bigEl.style.top }; bigEl.style.left = '4px'; bigEl.style.top = '4px'; bigEl.style.right = 'auto'; size = { w: innerWidth - 8, h: innerHeight - chrome() - 12 }; }
    apply(); if (!maxed) save();
  });
  addEventListener('resize', () => { if (maxed) size = { w: innerWidth - 8, h: innerHeight - chrome() - 12 }; apply(); });
  { const h2 = pn.querySelector('h2') as HTMLElement; let dg: { x: number; y: number; l: number; t: number } | null = null; h2.style.cursor = 'grab';
    h2.addEventListener('pointerdown', (e) => { if ((e.target as HTMLElement).closest('button') || maxed) return; const r = bigEl.getBoundingClientRect(); dg = { x: e.clientX, y: e.clientY, l: r.left, t: r.top }; h2.setPointerCapture(e.pointerId); });
    h2.addEventListener('pointermove', (e) => { if (!dg) return; const z = parseFloat(getComputedStyle(bigEl).zoom || '1') || 1; bigEl.style.right = 'auto';
      bigEl.style.left = Math.max(-200, Math.min(innerWidth - 120, dg.l + e.clientX - dg.x)) / z + 'px'; bigEl.style.top = Math.max(0, Math.min(innerHeight - 50, dg.t + e.clientY - dg.y)) / z + 'px'; });
    const up = () => { dg = null; }; h2.addEventListener('pointerup', up); h2.addEventListener('pointercancel', up); }
  pn.querySelector('h2')?.addEventListener('dblclick', (e) => { if ((e.target as HTMLElement).closest('button')) return; (pn.querySelector('[data-max]') as HTMLElement).click(); }); // 2 cliques no título: maximiza / restaura
  /* se a janela salva ficou maior que a tela (ou fora dela), volta para dentro ao abrir */
  bigEl.addEventListener('karmika:open', () => { pn.style.translate = ''; if (!maxed) { size.w = Math.min(size.w, innerWidth - 8); size.h = Math.min(size.h, innerHeight - chrome() - 12); apply(); }
    const r = bigEl.getBoundingClientRect(); if (r.top < 0 || r.left < 0 || r.top > innerHeight - 60 || r.left > innerWidth - 120) { bigEl.style.left = '4px'; bigEl.style.top = '4px'; bigEl.style.right = 'auto'; } });
}
/* mapa-mundo: janela no padrão, arrastar para mover, roda para zoom, ícones por categoria, relíquia conhecida = viagem */
const mapV = { cx: 420, cy: 420, z: 6.4, layers: { town: true, poi: true, serv: true, relic: true, vista: true, npc: false } as Record<string, boolean> };
type MapHit = { x: number; y: number; r: number; name: string; sub: string; go?: string };
let mapHits: MapHit[] = [], mapDrag: { x: number; y: number; cx: number; cy: number; moved: boolean } | null = null;
const mview = bigEl.querySelector('.mview') as HTMLElement, mtip = bigEl.querySelector('.mtip') as HTMLElement;
const mapPx = (e: MouseEvent) => { const r = bmEl.getBoundingClientRect(); return { x: (e.clientX - r.left) * bmEl.width / r.width, y: (e.clientY - r.top) * bmEl.height / r.height }; };
const pxPerTile = () => (bmEl.height / MAP_W) * mapV.z;
/** zoom mínimo: o mapa sempre cobre a largura da moldura (nada de faixa vazia dos lados) */
const mapZMin = () => Math.max(1, bmEl.width / bmEl.height);
mview.addEventListener('wheel', (e) => { e.preventDefault(); e.stopPropagation(); const m = mapPx(e), k = pxPerTile(), wx = mapV.cx + (m.x - bmEl.width / 2) / k, wy = mapV.cy + (m.y - bmEl.height / 2) / k; mapV.z = THREE.MathUtils.clamp(mapV.z * Math.exp(-e.deltaY * 0.0015), mapZMin(), 14); const k2 = pxPerTile(); mapV.cx = wx - (m.x - bmEl.width / 2) / k2; mapV.cy = wy - (m.y - bmEl.height / 2) / k2; drawBig(); }, { passive: false });
mview.addEventListener('pointerdown', (e) => { if ((e.target as HTMLElement).closest('button, .mzoom')) return; /* botões de zoom não são clique no mapa */ mapDrag = { x: e.clientX, y: e.clientY, cx: mapV.cx, cy: mapV.cy, moved: false }; mview.setPointerCapture(e.pointerId); mview.classList.add('drag'); });
mview.addEventListener('pointermove', (e) => {
  if (mapDrag && e.buttons === 0) { mapDrag = null; mview.classList.remove('drag'); } // soltou o botão fora do mapa: o arrasto acaba (antes o mapa ficava "grudado" no mouse)
  if (mapDrag) { const r = bmEl.getBoundingClientRect(), sc = bmEl.width / r.width / pxPerTile(); const dx = e.clientX - mapDrag.x, dy = e.clientY - mapDrag.y; if (Math.hypot(dx, dy) > 4) mapDrag.moved = true; mapV.cx = mapDrag.cx - dx * sc; mapV.cy = mapDrag.cy - dy * sc; drawBig(); return; }
  const m = mapPx(e); const h = mapHits.find((q) => Math.hypot(q.x - m.x, q.y - m.y) < q.r);
  if (h) { const r = bmEl.getBoundingClientRect(); mtip.innerHTML = `${h.name}<small>${h.sub}</small>`; mtip.style.display = 'block'; mtip.style.left = (e.clientX - r.left + 14) + 'px'; mtip.style.top = (e.clientY - r.top + 10) + 'px'; mview.style.cursor = h.go ? 'pointer' : ''; } else { mtip.style.display = 'none'; mview.style.cursor = ''; }
});
let lastMapClick = -1e9;
for (const ev of ['pointercancel', 'lostpointercapture'] as const) mview.addEventListener(ev, () => { mapDrag = null; mview.classList.remove('drag'); });
mview.addEventListener('pointerup', (e) => { const d = mapDrag; mapDrag = null; mview.classList.remove('drag'); const prevClick = lastMapClick; if (d && !d.moved) lastMapClick = performance.now(); if (d && !d.moved) { const m = mapPx(e); const h = mapHits.find((q) => q.go && Math.hypot(q.x - m.x, q.y - m.y) < q.r); if (h?.go) { if (inside) { game.logMsg('Saia para o céu aberto para atravessar o véu.', '#ff9a8a'); return; } if (combatMode) { const hp = heroPosNow(), hunted = game.enemies.list.some((en) => en.alive && en.active && (en.state === 'chase' || en.state === 'windup') && Math.hypot(en.pos.x - hp.x, en.pos.z - hp.z) < 16); if (hunted) { game.logMsg('Há inimigos atrás de você: o véu não se abre no meio da luta.', '#ff9a8a'); return; } setCombat(false); } toggleBigMap(); travelRelic(h.go); } else if (game.st.god && !inside && performance.now() - prevClick < 380) { /* modo deus: DOIS cliques num ponto do mapa e vá até lá (um clique só não teleporta mais) */ const k = pxPerTile(), W = bmEl.width, H = bmEl.height; let tx = mapV.cx + (m.x - W / 2) / k, ty = mapV.cy + (m.y - H / 2) / k; { /* nunca cai na água: procura o chão firme mais perto */ let best: [number, number] | null = null; for (let r = 0; r < 40 && !best; r++) for (let a = 0; a < Math.max(1, r * 8) && !best; a++) { const x = Math.floor(tx + Math.cos(a / Math.max(1, r * 8) * 6.283) * r), y = Math.floor(ty + Math.sin(a / Math.max(1, r * 8) * 6.283) * r), t2 = city.map[y]?.[x]; if (t2 && isWalkable(t2) && groundH((x + 0.5) * T, (y + 0.5) * T) > WL) best = [x + 0.5, y + 0.5]; } if (best) { tx = best[0]; ty = best[1]; } } toggleBigMap(); withFade(() => { state.fx = tx; state.fy = ty; state.path = []; objs.update(tx * T, ty * T, true); heroY = heightAt(tx * T, ty * T); camX = tx * T; camZ = ty * T; camY = heroY; game.logMsg(`⚡ Modo deus: você salta para ${Math.round(tx)}, ${Math.round(ty)}.`, '#ffd24a'); }); } } });
bigEl.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-x]')) toggleBigMap(); const z = (t.closest('[data-z]') as HTMLElement | null)?.dataset.z; if (z !== undefined) { if (z === '0') { const h0 = hereT(); mapV.cx = h0.x; mapV.cy = h0.y; } else mapV.z = THREE.MathUtils.clamp(mapV.z * (z === '1' ? 1.4 : 1 / 1.4), mapZMin(), 14); drawBig(); } });
bigEl.addEventListener('change', (e) => { const t = e.target as HTMLInputElement; if (t.dataset.l) { mapV.layers[t.dataset.l] = t.checked; drawBig(); } });
function markers(ctx: CanvasRenderingContext2D, X: (x: number) => number, Y: (y: number) => number, sc: number, lab: boolean) {
  for (const p of city.pois) { const x = X(p.x), y = Y(p.y); ctx.fillStyle = '#ffe08a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 4 * sc); ctx.lineTo(x + 3 * sc, y); ctx.lineTo(x, y + 4 * sc); ctx.lineTo(x - 3 * sc, y); ctx.closePath(); ctx.fill(); ctx.stroke(); if (lab) { ctx.font = '600 11px Georgia'; ctx.fillStyle = '#fff3c8'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(p.name, x + 7, y + 4); ctx.fillText(p.name, x + 7, y + 4); } }
  for (const em of eventos.mapMarks(hereT())) { const x = X(em.x), y = Y(em.y), pr = 0.5 + 0.5 * Math.sin(performance.now() / 260); ctx.strokeStyle = em.color; ctx.globalAlpha = 0.35 + pr * 0.35; ctx.lineWidth = 1.5 * sc; ctx.beginPath(); ctx.arc(x, y, Math.max(6 * sc, Math.abs(X(em.x + em.r) - x)), 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(16,12,6,.9)'; ctx.beginPath(); ctx.arc(x, y, 5.5 * sc, 0, 6.283); ctx.fill(); ctx.strokeStyle = em.color; ctx.lineWidth = (em.mine ? 2 : 1.2) * sc; ctx.stroke(); ctx.font = `${7 * sc}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(em.icon, x, y + 0.5); }
  for (const e of game.enemies.list) if (e.alive && e.active) { ctx.fillStyle = (e as typeof e & { ally?: boolean }).ally ? '#7aff9a' : (e as typeof e & { tag?: string }).tag?.startsWith('ev:') && e.def.aggro < 0.5 ? '#e0c890' : e.type === 'prince' ? '#c08aff' : e.def.passive ? '#e0d08a' : '#ff4a3a'; ctx.beginPath(); ctx.arc(X(e.pos.x / T), Y(e.pos.z / T), (e.type === 'prince' ? 3.4 : 1.8) * sc, 0, 6.283); ctx.fill(); }
  for (const n of npcSys.npcs) { ctx.fillStyle = '#7ad0ff'; ctx.beginPath(); ctx.arc(X(n.pos.x / T), Y(n.pos.z / T), 2 * sc, 0, 6.283); ctx.fill(); }
  for (const v of CINE.vistas) { const seen = vistaSeen.has(v.id); ctx.fillStyle = seen ? '#ffe08a' : '#a08a50'; ctx.strokeStyle = '#1a1208'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(X(v.at.x), Y(v.at.y), 3.6 * sc, 2.2 * sc, 0, 0, 6.283); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1a1208'; ctx.beginPath(); ctx.arc(X(v.at.x), Y(v.at.y), 1.1 * sc, 0, 6.283); ctx.fill(); }
  for (const rl of city.relics) if (knowsRelic(rl.name)) { ctx.fillStyle = '#8ad0ff'; ctx.beginPath(); ctx.moveTo(X(rl.x), Y(rl.y) - 4 * sc); ctx.lineTo(X(rl.x) + 3 * sc, Y(rl.y)); ctx.lineTo(X(rl.x), Y(rl.y) + 4 * sc); ctx.lineTo(X(rl.x) - 3 * sc, Y(rl.y)); ctx.closePath(); ctx.fill(); }
  if (guideT) { const x = X(guideT.x), y = Y(guideT.y), pr = 4 * sc + 2 * sc * Math.abs(Math.sin(performance.now() / 300)); ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 1.6 * sc; ctx.beginPath(); ctx.arc(x, y, pr, 0, 6.283); ctx.stroke(); ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(x, y, 1.6 * sc, 0, 6.283); ctx.fill(); if (lab) { ctx.font = '600 11px Cinzel, serif'; ctx.fillStyle = '#ffd24a'; ctx.fillText(guideT.label, x + 8, y - 8); } }
}
/** distâncias em metros do jogo (1 quadrado = 2 m; heroína 1,7 m) */
const fmtDist = (m: number) => `${Math.round(m)} m`;
/* ---------- guia de missão: onde fica o objetivo rastreado ---------- */
const DROP_SRC: Record<string, EnemyType[] | 'tree' | 'rock' | 'water'> = { hide: ['deer', 'boar', 'wolf', 'coyote'], meat: ['deer', 'boar', 'wolf', 'coyote', 'frostwolf'], claw: ['rat'], dust: ['fairy'], sap: ['treant'], wood: 'tree', stick: 'tree', apple: 'tree', stone: 'rock', fish: 'water' };
let pinT: { x: number; y: number; label: string } | null = null;
function setPin(p: { x: number; y: number; label: string } | null) { pinT = p; if (p) { game.logMsg(`🔍 Indo para ${p.label}.`, '#b9c6e0'); audio.click(); } updateBanner(); }
function questTarget(): { x: number; y: number; label: string } | null {
  if (pinT) { if (Math.hypot(pinT.x - state.fx, pinT.y - state.fy) * T < 4) { game.logMsg(`🔍 Você chegou: ${pinT.label}.`, '#b9c6e0'); pinT = null; updateBanner(); } else return pinT; }
  { const tk = eventos.tracking(); if (tk) { const dd = Math.hypot(tk.x - state.fx, tk.y - state.fy) * T;
      if (!tk.joined && dd > 5) return { x: tk.x, y: tk.y, label: `Evento: ${tk.name} · fale com ${tk.herald}` };
      if (tk.joined && dd > 24) return { x: tk.x, y: tk.y, label: `Evento: ${tk.name}` }; } }
  const d = quests.tracked; if (!d) return null; const h0 = hereT();
  const npcAt = (name: string) => { const n = npcSys.npcs.find((q) => q.def.name === name); return n ? { x: n.pos.x / T, y: n.pos.z / T } : null; };
  const i = quests.firstOpen(d);
  if (i < 0) { const who = d.turnin ?? d.giver, p = npcAt(who); return p ? { ...p, label: `Entregar a ${who}` } : null; }
  const o = d.objs[i];
  const nearestSpawn = (types: EnemyType[]) => { let best: { x: number; y: number } | null = null, bd = 1e9; for (const sp of city.spawns) if (types.includes(sp.type)) { const dd = Math.hypot(sp.x - h0.x, sp.y - h0.y) * (1 + Math.max(0, (sp.lvl ?? 1) - game.st.lvl - 2) * 0.8); /* a guia prefere bichos do seu nível */ if (dd < bd) { bd = dd; best = { x: sp.x, y: sp.y }; } } return best; };
  const nearestProp = (kind: string, small = false) => { let best: { x: number; y: number } | null = null, bd = 1e9; for (const p of city.props) { if (p.kind !== kind || (p as { gone?: boolean }).gone || (small && p.w > 2)) continue; const dd = Math.hypot(p.gx + 0.5 - h0.x, p.gy + 0.5 - h0.y); if (dd < bd) { bd = dd; best = { x: p.gx + 0.5, y: p.gy + 0.5 }; } } return best; };
  const nearestTile = (tile: string) => { let best: { x: number; y: number } | null = null, bd = 1e9; const cx = Math.round(h0.x), cy = Math.round(h0.y); for (let y = cy - 40; y <= cy + 40; y += 2) for (let x = cx - 40; x <= cx + 40; x += 2) if (city.map[y]?.[x] === tile) { const dd = Math.hypot(x - h0.x, y - h0.y); if (dd < bd) { bd = dd; best = { x, y }; } } return best; };
  if (o.kind === 'kill') { const p = nearestSpawn([o.type]); return p ? { ...p, label: `${ENEMY_LABEL(o.type)} por aqui` } : null; }
  if (o.kind === 'collect') { const src = DROP_SRC[o.item]; if (!src) return null; const p = src === 'tree' ? nearestProp('tree') : src === 'rock' ? nearestProp('rock', true) : src === 'water' ? nearestTile('water') : nearestSpawn(src); return p ? { ...p, label: src === 'tree' ? 'Árvores' : src === 'rock' ? 'Pedras' : src === 'water' ? 'Água (pescar)' : 'Caça por aqui' } : null; }
  if (o.kind === 'talk') { const p = npcAt(o.npc); return p ? { ...p, label: o.npc } : null; }
  if (o.kind === 'visit') { const poi = city.pois.find((q) => q.name === o.poi); return poi ? { x: poi.x, y: poi.y, label: poi.name } : null; }
  if (o.kind === 'dungeon') { const en = dgs.entrances.find((q) => q.d.id === o.id); return en ? { x: en.x, y: en.y, label: `Entrada: ${o.name}` } : null; }
  if (o.kind === 'craft') { const p = npcAt('Doran'); return p ? { ...p, label: 'Criar no menu I' } : null; }
  if (o.kind === 'sense') { const g = senseGoals().find((q) => q.id === `${d.id}:${i}`); if (!g) return null; const dS = Math.hypot(g.from.x - h0.x, g.from.y - h0.y), dT2 = Math.hypot(g.to.x - h0.x, g.to.y - h0.y); return dT2 < dS || dS < 8 ? (instinctOn ? { ...g.to, label: g.label } : { ...g.from, label: 'Ligue o Instinto (F) e siga o rastro' }) : { ...g.from, label: `Onde o rastro começa${instinctOn ? '' : ' · ligue o Instinto (F)'}` }; }
  if (o.kind === 'escort' || o.kind === 'rescue') { const p = caravans.where(o.kind, o.route, o.kind === 'rescue' ? o.at : 0); return p ? { ...p, label: o.kind === 'escort' ? `Caravana: ${o.label}` : `Caravana caída: ${o.label}` } : null; }
  return null;
}
const ENEMY_LABEL = (t: EnemyType) => DEFS[t]?.name ?? t;
const guideEl = document.createElement('div'); guideEl.id = 'guide'; guideEl.innerHTML = '<div class="lbl"><i>◆</i><span></span><small></small></div>'; document.body.appendChild(guideEl);
const guideLbl = guideEl.querySelector('.lbl span') as HTMLElement, guideDist = guideEl.querySelector('.lbl small') as HTMLElement;
/* fôlego: arco amarelo no pé do herói (voltado para a câmera), esvazia ao correr e ao dar dash */
const stamG = new THREE.Group(); scene.add(fine(stamG));
const stamArc = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.28, 48, 1, 0, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide })); stamG.add(stamArc);
const stamBg = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.28, 48, 1, 0, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x3a2a10, transparent: true, opacity: 0.45, depthWrite: false, fog: false, side: THREE.DoubleSide })); stamG.add(stamBg);
let stamShow = 0;
function updateStamRing(dt: number) {
  const k = game.st.stam / Math.max(1, game.st.stamMax), want = k < 0.999 ? 1 : 0;
  stamShow += (want - stamShow) * Math.min(1, dt * 4); stamG.visible = stamShow > 0.02 && !inside && !game.st.dead;
  if (!stamG.visible) return;
  stamG.position.set(heroPos.x, heroPos.y + 0.05, heroPos.z); stamG.rotation.y = az; // arco virado para a câmera, à frente dos pés
  const SPAN = 1.5, start = -Math.PI / 2 - SPAN / 2; // centrado na direção da câmera
  stamArc.geometry.dispose(); stamArc.geometry = new THREE.RingGeometry(1.1, 1.28, 48, 1, start + SPAN * (1 - k), Math.max(0.001, SPAN * k)).rotateX(-Math.PI / 2);
  stamBg.geometry.dispose(); stamBg.geometry = new THREE.RingGeometry(1.1, 1.28, 48, 1, start, SPAN).rotateX(-Math.PI / 2);
  (stamArc.material as THREE.MeshBasicMaterial).color.setHex(k < 0.25 ? 0xff6a3a : k < 0.5 ? 0xffa040 : 0xffd24a); (stamArc.material as THREE.MeshBasicMaterial).opacity = 0.85 * stamShow; (stamBg.material as THREE.MeshBasicMaterial).opacity = 0.45 * stamShow;
}
/* bússola no pé do herói: arco dourado que aponta o destino, com três chevrons correndo na direção */
const guide3d = new THREE.Group(); guide3d.visible = false; scene.add(fine(guide3d));
const gMat = (op: number) => new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide });
{ const arc2 = new THREE.Mesh(new THREE.RingGeometry(0.98, 1.06, 40, 1, -Math.PI / 2 - 0.7, 1.4).rotateX(-Math.PI / 2), gMat(0.8)); guide3d.add(arc2);
  for (let i = 0; i < 3; i++) { const sh = new THREE.Shape(); sh.moveTo(-0.22, -0.16); sh.lineTo(0, 0.1); sh.lineTo(0.22, -0.16); sh.lineTo(0, -0.02); sh.closePath(); const ch = new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(Math.PI / 2), gMat(0.9)); ch.name = 'chev' + i; guide3d.add(ch); } }
let guideT: { x: number; y: number; label: string } | null = null, guideTick = 0;
const gv = new THREE.Vector3();
function updateGuide(dt: number) {
  guideTick -= dt; if (guideTick <= 0) { guideTick = 0.5; guideT = questTarget(); const dir = document.querySelector('#quests .q.track .dir') as HTMLElement | null; if (dir) { if (guideT) { const dx = guideT.x - state.fx, dy = guideT.y - state.fy, m = Math.round(Math.hypot(dx, dy) * T); const comp = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'][((Math.round(Math.atan2(dx, -dy) / (Math.PI / 4)) % 8) + 8) % 8]; dir.textContent = `◆ ${guideT.label} · ${fmtDist(m)} ${comp}`; } else dir.textContent = ''; } }
  if (!guideT || inside || dlg.isOpen) { guideEl.style.display = 'none'; guide3d.visible = false; return; }
  const tx = guideT.x * T, tz = guideT.y * T, hx = state.fx * T, hz = state.fy * T, dist = Math.hypot(tx - hx, tz - hz);
  if (dist < 5) { guideEl.style.display = 'none'; guide3d.visible = false; return; }
  const ang = Math.atan2(tx - hx, tz - hz), t = performance.now() / 1000;
  guide3d.visible = true; guide3d.position.set(heroPos.x, heroPos.y + 0.06, heroPos.z); guide3d.rotation.y = ang;
  for (let i = 0; i < 3; i++) { const ch = guide3d.getObjectByName('chev' + i) as THREE.Mesh; const k = ((t * 0.9 + i / 3) % 1); ch.position.set(0, 0.01 + i * 0.002, 1.35 + k * 0.9); ch.scale.setScalar(0.8 + k * 0.5); (ch.material as THREE.MeshBasicMaterial).opacity = 0.95 * (1 - k) * (0.4 + 0.6 * Math.min(1, k * 4)); }
  // etiqueta acima da ponta do arco: destino e distância
  const r = canvas.getBoundingClientRect();
  // contagem no canto inferior direito do personagem (onde ficarão os ícones de buffs/debuffs)
  gv.set(heroPos.x, heroPos.y + 0.1, heroPos.z).project(camera);
  guideEl.style.display = 'block'; guideEl.style.transform = `translate(${r.left + (gv.x * 0.5 + 0.5) * r.width + 34}px, ${r.top + (-gv.y * 0.5 + 0.5) * r.height + 6}px)`;
  guideLbl.textContent = guideT.label.replace(/^Entregar a /, '').replace(/^Falar com /, ''); guideDist.textContent = fmtDist(dist);
}
function hereT() { return inside ? inside.ret : { x: state.fx, y: state.fy }; }
function heroArrow(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI - hero.root.rotation.y); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -6 * s); ctx.lineTo(4.5 * s, 5 * s); ctx.lineTo(0, 2.5 * s); ctx.lineTo(-4.5 * s, 5 * s); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
function drawMini() {
  const S = 2.4, h0 = hereT(), D = mmEl.width, C = D / 2; mg.save(); mg.imageSmoothingEnabled = false; mg.clearRect(0, 0, D, D); mg.beginPath(); mg.arc(C, C, C, 0, 6.283); mg.clip(); mg.fillStyle = '#0a0810'; mg.fillRect(0, 0, D, D);
  mg.drawImage(mmBase, C - h0.x * S, C - h0.y * S, MMS * S, MMS * S); markers(mg, (x) => C + (x - h0.x) * S, (y) => C + (y - h0.y) * S, 0.9, false); heroArrow(mg, C, C, 1); mg.restore();
}
function drawBig() {
  mapV.z = Math.max(mapV.z, mapZMin());
  const W = bmEl.width, H = bmEl.height, k = pxPerTile(), L = mapV.layers; const half = MAP_W / 2 / mapV.z;
  mapV.cx = THREE.MathUtils.clamp(mapV.cx, half * W / H * 0.3, MAP_W - half * W / H * 0.3); mapV.cy = THREE.MathUtils.clamp(mapV.cy, Math.min(half, MAP_W / 2), Math.max(MAP_W - half, MAP_W / 2));
  const X = (x: number) => W / 2 + (x - mapV.cx) * k, Y = (y: number) => H / 2 + (y - mapV.cy) * k;
  bg.imageSmoothingEnabled = false; bg.fillStyle = '#0c1018'; bg.fillRect(0, 0, W, H); bg.drawImage(mmBase, X(0), Y(0), MAP_W * k, MAP_W * k);
  bg.fillStyle = 'rgba(10,8,4,.18)'; bg.fillRect(0, 0, W, H);
  mapHits = []; const placed: [number, number, number, number][] = [];
  const label = (txt: string, x: number, y: number, size: number, col: string, force = false) => { bg.font = `600 ${size}px Cinzel, Georgia, serif`; const w = bg.measureText(txt).width, bx: [number, number, number, number] = [x - w / 2 - 2, y - size, w + 4, size + 4];
    if (!force && placed.some((p) => bx[0] < p[0] + p[2] && bx[0] + bx[2] > p[0] && bx[1] < p[1] + p[3] && bx[1] + bx[3] > p[1])) return; placed.push(bx);
    bg.textAlign = 'center'; bg.lineWidth = 3.5; bg.strokeStyle = 'rgba(0,0,0,.85)'; bg.strokeText(txt, x, y); bg.fillStyle = col; bg.fillText(txt, x, y); };
  const icon = (glyph: string, x: number, y: number, s: number, ring: string) => { bg.beginPath(); bg.arc(x, y, s, 0, 6.283); bg.fillStyle = 'rgba(16,12,6,.9)'; bg.fill(); bg.lineWidth = 2; bg.strokeStyle = ring; bg.stroke(); bg.font = `${s * 1.15}px serif`; bg.textAlign = 'center'; bg.textBaseline = 'middle'; bg.fillStyle = '#fff'; bg.fillText(glyph, x, y + 1); bg.textBaseline = 'alphabetic'; };
  const s0 = 7 + mapV.z * 1.3;
  { // regiões: fronteiras pontilhadas e o nome com a faixa de nível dos bichos (cor = perigo para o seu nível)
    const st = 3; bg.fillStyle = 'rgba(255,236,190,.38)';
    for (let ty = 0; ty < MAP_W; ty += st) for (let tx = 0; tx < MAP_W; tx += st) { const a = regionAt(tx, ty); if (regionAt(tx + st, ty) !== a || regionAt(tx, ty + st) !== a) { const x = X(tx + st / 2), y = Y(ty + st / 2); if (x > -4 && y > -4 && x < W + 4 && y < H + 4) bg.fillRect(x - 1, y - 1, 2.2, 2.2); } }
    for (const rg of REGIONS) { const x = X(rg.x), y = Y(rg.y - 16) - s0 * 2.6, lv = game.st.lvl, c = rg.lo > lv + 3 ? '#ff8a7a' : rg.hi < lv - 2 ? '#a8a8a8' : '#ffe08a';
      bg.font = `italic 600 ${11 + mapV.z * 2.2}px Cinzel, Georgia, serif`; label(rg.name.toUpperCase(), x, y, 11 + mapV.z * 2.2, 'rgba(240,226,190,.8)', true); label(`Nv ${rg.lo}–${rg.hi}${rg.lo > lv + 3 ? ' · ☠' : ''}`, x, y + 13 + mapV.z * 2, 10 + mapV.z * 1.4, c, true); } }
  if (L.town) for (const st of city.settlements) { const big = st.name === 'Askavik', x = X(st.x), y = Y(st.y); icon(big ? '🏰' : '🏠', x, y, big ? s0 * 1.35 : s0, big ? '#ffd24a' : '#c9a24a'); label(st.name, x, y - s0 - 4, big ? 15 : 12, big ? '#ffe08a' : '#f0e6cc', big); mapHits.push({ x, y, r: s0 + 3, name: st.name, sub: big ? 'Cidade média' : 'Vila' }); }
  if (L.town) { const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 220); for (const m of caravans.mapMarks()) { const x = X(m.x), y = Y(m.y); if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
      const ev = m.kind === 'ev' || m.kind === 'res'; if (ev) { bg.beginPath(); bg.arc(x, y, s0 + 4 + pulse * 4, 0, 6.283); bg.strokeStyle = `rgba(255,90,60,${0.5 + pulse * 0.4})`; bg.lineWidth = 2.5; bg.stroke(); }
      icon(ev ? '🛞' : '⚙', x, y, s0 * (ev ? 0.95 : m.kind === 'esc' ? 0.9 : 0.7), ev ? '#ff6a4a' : m.kind === 'esc' ? '#ffd24a' : '#e0b048'); if (ev || m.kind === 'esc' || mapV.z >= 3) label(m.name, x, y - s0 - 3, 10, ev ? '#ffb0a0' : '#f0d890'); mapHits.push({ x, y, r: s0 + 3, name: m.name, sub: m.sub }); } }
  for (const em of eventos.mapMarks(hereT())) { const x = X(em.x), y = Y(em.y), pr = 0.5 + 0.5 * Math.sin(performance.now() / 260); bg.beginPath(); bg.arc(x, y, Math.max(s0 + 6, em.r * k), 0, 6.283); bg.strokeStyle = em.color; bg.globalAlpha = 0.35 + pr * 0.4; bg.lineWidth = 2.5; bg.stroke(); bg.globalAlpha = 1; icon(em.icon, x, y, s0 * 1.1, em.color); label(em.name, x, y - s0 - 5, 12, em.color, true); mapHits.push({ x, y, r: s0 + 4, name: em.name, sub: em.sub }); }
  const dgList = (() => { try { return dgs.entrances; } catch { return []; } })(); // (as masmorras nascem depois do mapa)
  if (L.poi) { const PICON = (n: string) => /Catedral|Igreja|Templo/.test(n) ? '⛪' : /Cemit|Cripta|Mausol/.test(n) ? '✝' : /Covil|Clareira|Garganta|Toca/.test(n) ? '🐺' : /Ruína/.test(n) ? '🏛' : /Mercado/.test(n) ? '⚖' : /Escola|Forja|Academia/.test(n) ? '📜' : '◆';
    for (const p of city.pois) { if (city.settlements.some((st) => st.name === p.name)) continue; if (mapV.z < 2.2 && /Mercado|Escola|Forja|Academia|Parque|Igreja Kármica|Cemitério de Askavik|Catedral de Askavik/.test(p.name)) continue; const x = X(p.x), y = Y(p.y), dg = dgList.find((e) => e.d.name === p.name); if (dg) { const grp = dg.d.kind === 'grupo'; icon(dg.d.theme === 'cripta' ? '⚰' : grp ? '💀' : '🕳', x, y, s0 * (grp ? 1 : 0.85), grp ? '#ff6a5a' : '#c9a24a'); label(p.name, x, y + s0 + 12, 11, grp ? '#ffb0a0' : '#e8dcc0'); mapHits.push({ x, y, r: s0, name: p.name, sub: `${grp ? 'Masmorra' : dg.d.kind === 'subsolo' ? 'Subsolo' : 'Caverna'} · Nv ${dg.lvl[0]}–${dg.lvl[1]} · ${dg.d.players}` }); continue; } icon(PICON(p.name), x, y, s0 * 0.85, '#8a7a5a'); label(p.name, x, y + s0 + 12, 11, '#e8dcc0'); mapHits.push({ x, y, r: s0, name: p.name, sub: 'Lugar' }); } }
  if (L.serv && mapV.z >= 2.6) { /* ofícios e comércio dentro das vilas e cidades (23/10): bancadas de trabalho, lojas, correio, cofre, quadro */
    const sz = s0 * 0.6, withLabel = mapV.z >= 5.5;
    const put = (glyph: string, x0: number, y0: number, name: string, sub: string, ring: string) => { const x = X(x0), y = Y(y0); if (x < -20 || y < -20 || x > W + 20 || y > H + 20) return; icon(glyph, x, y, sz, ring); if (withLabel) label(name, x, y + sz + 10, 10, '#e8dcc0'); mapHits.push({ x, y, r: sz + 2, name, sub }); };
    for (const p of city.props) {
      if (p.kind === 'station') { const si = STATION_INFO[p.variant ?? 0]; if (si) put(si.icon, p.gx + p.w / 2, p.gy + p.h / 2, si.name, `Lugar de trabalho · ${PROF_NAME[si.prof] ?? si.prof}`, '#8ab4d8'); }
      else if (p.kind === 'mailbox') put('📮', p.gx + 0.5, p.gy + 0.5, 'Correio', 'Cartas e encomendas', '#a0d8a0');
      else if (p.kind === 'vault') put('🏦', p.gx + p.w / 2, p.gy + p.h / 2, 'Cofre', 'Guarde itens e ouro', '#a0d8a0');
      else if (p.kind === 'noticeboard') put('📋', p.gx + 0.5, p.gy + 0.5, 'Quadro de Avisos', 'Contratos e missões', '#a0d8a0');
    }
    const SICON: Record<string, string> = { armeiro: '⚔', armaduras: '🛡', mercador: '⚖', mercador_cidade: '⚖', pocoes: '⚗', cervejaria: '🍺', churrasco: '🍖', charcutaria: '🥓', cozinha: '🍲', lenhador: '🪓', cacador: '🏹', construtor: '🔨', domador: '🐾', tec_fio: '🧶', tec_desf: '🧶', estabulo: '🐎', latao: '⚙' };
    for (const n of npcSys.npcs) { const key = SHOP_BY_NAME.get(n.def.name); if (!key) continue; const sd = SHOPDEF[key]; put(SICON[key] ?? '🪙', n.pos.x / T, n.pos.z / T, sd?.title ?? n.def.name, `Comércio${sd?.note ? ' · ' + sd.note : ''}`, '#d8b45a'); }
  }
  if (L.vista) for (const v of CINE.vistas) { const seen = vistaSeen.has(v.id), x = X(v.at.x), y = Y(v.at.y); icon('👁', x, y, s0 * 0.85, seen ? '#ffd24a' : '#6a6a72'); mapHits.push({ x, y, r: s0, name: v.title.split(' — ')[1] ?? v.title, sub: seen ? 'Fonte da Visão (vista)' : 'Fonte da Visão — ainda não vista' }); }
  if (L.relic) for (const r of city.relics) { const known = knowsRelic(r.name), x = X(r.x), y = Y(r.y); bg.save(); bg.translate(x, y); bg.rotate(Math.PI / 4); bg.fillStyle = known ? '#8ad0ff' : '#c9a24a'; bg.strokeStyle = '#000'; bg.lineWidth = 2; const q = s0 * 0.7; bg.fillRect(-q, -q, q * 2, q * 2); bg.strokeRect(-q, -q, q * 2, q * 2); bg.restore(); if (known) { bg.beginPath(); bg.arc(x, y, s0 + 3 + Math.sin(performance.now() / 300) * 1.5, 0, 6.283); bg.strokeStyle = 'rgba(138,208,255,.6)'; bg.lineWidth = 1.5; bg.stroke(); }
    mapHits.push({ x, y, r: s0 + 2, name: r.name, sub: known ? 'Relíquia conhecida — clique para viajar' : 'Relíquia desconhecida — toque nela para lembrar', go: known ? r.name : undefined }); }
  if (L.npc) for (const n of npcSys.npcs) { bg.fillStyle = '#7ad0ff'; bg.beginPath(); bg.arc(X(n.pos.x / T), Y(n.pos.z / T), 2.4, 0, 6.283); bg.fill(); }
  if (guideT) { const x = X(guideT.x), y = Y(guideT.y), pr = 7 + 3 * Math.abs(Math.sin(performance.now() / 300)); bg.strokeStyle = '#ffd24a'; bg.lineWidth = 2.5; bg.beginPath(); bg.arc(x, y, pr, 0, 6.283); bg.stroke(); }
  const h0 = hereT(); heroArrow(bg, X(h0.x), Y(h0.y), 2.2);
  (bigEl.querySelector('.mzone') as HTMLElement).textContent = zoneName();
}
function zoneName() { const h0 = hereT(); for (const st of city.settlements) if (Math.hypot(h0.x - st.x, h0.y - st.y) < st.radius) return st.name; if (Math.hypot(h0.x - CITY.x, h0.y - CITY.y) < 22) return 'Karmika'; let best: string | null = null, bd = 24; for (const p of city.pois) { const d = Math.hypot(p.x - h0.x, p.y - h0.y); if (d < bd) { bd = d; best = p.name; } } return best ?? BNAME[city.biome[Math.floor(h0.y)]?.[Math.floor(h0.x)] ?? 'meadow']; }
document.getElementById('btns')!.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (!b) return; const k = b.dataset.b; if (k === 'inv') { keys.clear(); inv.toggle(); } else if (k === 'char') { keys.clear(); inv.toggleChar(); } else if (k === 'map') toggleBigMap(); else if (k === 'menu') game.toggleMenu(); else if (k === 'god') window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' })); });
let mmT = 0;
const mouse = { x: city.spawn.x * T, z: city.spawn.y * T + 4 };

/* ---------- pós-processamento ---------- */
const composer = new EffectComposer(renderer);
const dual = new DualRenderPass(scene, camera, 2, 2, WORLD_RATIO);
composer.addPass(dual);
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.14, 0.35, 0.93);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const finish = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, levels: { value: 20 }, uMul: { value: new THREE.Vector3(1, 1, 1) }, uLift: { value: new THREE.Vector3(0, 0, 0) }, uSat: { value: 1 }, uVig: { value: 0.6 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float levels; uniform vec3 uMul; uniform vec3 uLift; uniform float uSat; uniform float uVig; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(vec3(lum), c.rgb, uSat) * uMul + uLift * (1.0 - lum); /* grade de cor: dia quente, noite fria, Lua de Sangue, Aurora */
      float v = smoothstep(0.38, 0.98, length((vUv - 0.5) * vec2(1.1, 1.0)));
      c.rgb *= 1.0 - v * uVig;
      float b = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
      c.rgb = floor(c.rgb * levels + 0.5 + b * 0.4) / levels;
      gl_FragColor = c;
    }`,
});
composer.addPass(finish);
/* o Limiar: para onde a alma sobe quando o Fio da Vida se rompe (limiar.ts) */
const limiar = createLimiar({ use: (s, c) => dual.use(s, c), restore: () => dual.use(scene, camera), compile: (s, c) => renderer.compile(s, c),
  makeSoul: () => createCharacter(kindOf(state.race), profile ? { hair: profile.hair, skin: profile.skin, hairStyle: profile.hairStyle, beard: profile.beard, ears: profile.origin === 'elf' } : {}), audio });

/** Tela responsiva: o jogo é pensado em Full HD (1080 de altura).
 *  - Escala da interface: Auto acompanha a altura da tela (Quad HD = 133%, 4K = 200%); ou fixa.
 *  - Resolução do mundo: em Full HD o mundo é desenhado como em 1080p e esticado (mesmo visual e o mesmo FPS em qualquer monitor);
 *    Quad HD fica mais nítido; Nativa usa todos os pixels do monitor (o mais pesado). */
function uiScale() { const base = Math.max(0.85, Math.min(2, Math.min(innerHeight / 1080, innerWidth / 1560))); /* 1,00 = tamanho pensado para Full HD; em janela pequena não encolhe abaixo de 0,85 (senão não dá para ler) */ return Math.max(0.7, base * (opts.uis || 1)); }
function resize() {
  document.documentElement.style.setProperty('--ui', uiScale().toFixed(3));
  const refH = opts.res > 0 ? Math.min(innerHeight, opts.res) : innerHeight, k = innerHeight / refH; // k > 1: desenha menos pixels e estica
  const w = Math.max(160, Math.floor(innerWidth / k / PIX / WORLD_RATIO) * WORLD_RATIO), h = Math.max(120, Math.floor(innerHeight / k / PIX / WORLD_RATIO) * WORLD_RATIO);
  renderer.setSize(w, h, false); dual.setSize(w, h);
  canvas.style.width = '100%'; canvas.style.height = '100%';
  composer.setSize(w, h);
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
resize();

/* ---------- entrada ---------- */
const keys = new Set<string>();
/* R alterna correr/andar (padrão: correr, gasta fôlego); Shift segurado faz o contrário enquanto estiver pressionado.
   Sem fôlego, anda sozinho até recuperar 25% */
let runOn = (() => { try { return localStorage.getItem('karmika.run') !== '0'; } catch { return true; } })(), outOfBreath = false;
const runningNow = () => (runOn !== keys.has('shift')) && !outOfBreath;
const heroPosNow = () => new THREE.Vector3(state.fx * T, 0, state.fy * T);
/* ---- marcação de chão: a magia marca, o botão direito lança no local marcado ---- */
const aim = createAim(scene);
const GUARD_AIM: AimSpec = { kind: 'cone', radius: 2.8, range: 2.8, arc: 1.6, color: 0x9ad7ff };
let aimSlot: string | null = null, lockYaw: number | null = null, guardCone = false;
let leap: { x0: number; z0: number; x1: number; z1: number } | null = null;
/* ---- modo de combate (Tab): fora dele corre-se mais rápido, o escudo vai às costas e as mãos ficam livres para o ofício ---- */
let combatMode = false;
function setCombat(on: boolean, quiet = false) {
  if (combatMode === on) return; combatMode = on; hero.combat = on;
  document.body.classList.toggle('combat', on);
  if (!quiet) game.logMsg(on ? '⚔ Modo de combate' : '🌿 Modo pacífico: +20% de velocidade, profissões liberadas', on ? '#ffd24a' : '#9ad7a0');
  if (!on) { cancelAim(); game.guard(false); guardCone = false; aim.hide(); }
}
const locked = (sk: SkillDef) => { if (!tree.has(sk.id)) { game.logMsg(`${sk.name}: aprenda na Árvore Kármica (K).`, '#ff9a8a'); if (tree.available() > 0) dockEl.querySelector('[data-d="skills"]')?.classList.add('pulse'); return true; } return false; };
function startAim(slot: string) {
  const sk = skillAt(kitRace(), slot); if (!sk?.aim) return false;
  if (aimSlot === slot) { cancelAim(); return true; }
  if (locked(sk)) return true;
  const sc = tree.scale(sk.id); setCombat(true); aimSlot = slot; guardCone = false; aim.show({ ...sk.aim, radius: sk.aim.radius * sc.area, range: sk.aim.range * sc.range, label: sk.name }); document.querySelector(`.slot[data-k="${slot}"]`)?.classList.add('aim');
  return true;
}
function cancelAim() { if (aimSlot) document.querySelector(`.slot[data-k="${aimSlot}"]`)?.classList.remove('aim'); aimSlot = null; if (!guardCone) aim.hide(); }
function fireAim() {
  if (!aimSlot) return;
  const hx = state.fx * T, hz = state.fy * T, a = aim.update(0, hx, hz, mouse.x, mouse.z, (x, z) => inside ? 0 : heightAt(x, z));
  const slot = aimSlot, at = { x: a.x, z: a.z, yaw: a.yaw };
  cancelAim();
  if (!castAt(slot, at)) { const sk = skillAt(kitRace(), slot); if (sk && game.ready(sk.id, sk.cost) === null) castQ = { slot, at, until: performance.now() + 650 }; /* o herói estava no meio de outro gesto: a magia sai assim que ele termina */ }
}
/** lança a magia de mira no ponto marcado; false se não pôde sair agora */
function castAt(slot: string, a: { x: number; z: number; yaw: number }) {
  const hx = state.fx * T, hz = state.fy * T;
  const sk = skillAt(kitRace(), slot); if (!sk) return false; const yaw = a.yaw; let ok = false;
  if (sk.id === 'slam') {
    if (state.race === 'nordic' || state.race === 'dwarf') {
      // ponto de pouso: encurta até cair em chão livre
      let tx = a.x, tz = a.z; for (let k = 0; k < 12 && !free(tx / T, tz / T); k++) { tx = hx + (tx - hx) * 0.85; tz = hz + (tz - hz) * 0.85; }
      ok = game.slam({ x: tx, z: tz }); if (ok) leap = { x0: hx, z0: hz, x1: tx, z1: tz };
    } else ok = game.cast(yaw, { x: a.x, z: a.z });
  } else if (sk.id === 'bash') ok = game.bash(yaw, { x: a.x, z: a.z });
  else if (sk.id === 'heal') ok = game.heal(heroPosNow(), { x: a.x, z: a.z });
  else ok = game.useExtra(sk.id, yaw, sk.cost, { x: a.x, z: a.z });
  if (ok) { lockYaw = yaw; lockFresh = true; castQ = null; }
  return ok;
}
let lockFresh = false, lastActN: string | null = null, lastActP = 0;
let castQ: { slot: string; at: { x: number; z: number; yaw: number }; until: number } | null = null, aimKey: string | null = null, denyT = 0;
/** sem recurso ou recarregando: nem desenha a mira; avisa uma vez e pisca a barra */
function denySkill(sk: SkillDef, why: 'cd' | 'res') {
  audio.error(); const el = document.querySelector(`.slot[data-k="${sk.k}"]`) as HTMLElement | null; el?.animate([{ filter: 'brightness(2.2) saturate(0.2)' }, { filter: 'none' }], 260);
  if (why === 'res') document.getElementById('mp')?.animate([{ filter: 'brightness(2)' }, { filter: 'none' }], 250);
  const now = performance.now(); if (now - denyT < 900) return; denyT = now;
  game.logMsg(why === 'res' ? `${sk.name}: falta ${game.st.res.name}.` : `${sk.name}: ainda recarregando.`, why === 'res' ? '#ff9a8a' : '#c8c0a8');
}
/** aperta um botão da barra (tecla 1-9,0) */
function useSlot(k: string, fromKey = false) {
  const sk = skillAt(kitRace(), k); if (!sk) return;
  if (locked(sk)) return;
  if (sk.id === 'guard') { setCombat(true); game.guard(true); if (hero.guard && !aimSlot) { guardCone = true; aim.show(GUARD_AIM); } return; }
  { const why = game.ready(sk.id, sk.cost); if (why && aimSlot !== k) { denySkill(sk, why); return; } }
  if (sk.aim) { startAim(k); if (fromKey && aimSlot === k) aimKey = k; return; }
  setCombat(true);
  if (sk.id === 'combo') game.attack(aimYaw(), heroPosNow());
  else if (sk.id === 'slam') game.cast(aimYaw());
  else if (sk.id === 'bash') game.bash();
  else if (sk.id === 'heal') game.heal(heroPosNow());
  else game.useExtra(sk.id, aimYaw(), sk.cost);
}
/* o ataque vai para onde o mouse aponta; se houver inimigo nesse cone, encaixa no mais próximo (empate → mais forte) */
/** em combate, parado: o herói encara o inimigo mais próximo (até 7 m) */
const nearYaw = (): number | null => { const hx = state.fx * T, hz = state.fy * T; let b: { x: number; z: number } | null = null, bd = 7; for (const e of game.enemies.list) { if (!e.active || !e.alive || e.def.passive) continue; const d = Math.hypot(e.pos.x - hx, e.pos.z - hz); if (d < bd) { bd = d; b = e.pos; } } return b ? Math.atan2(b.x - hx, b.z - hz) : null; };
const aimYaw = () => {
  const hx = state.fx * T, hz = state.fy * T, my = Math.atan2(mouse.x - hx, mouse.z - hz), tg = game.target(new THREE.Vector3(hx, 0, hz), my);
  return tg ? Math.atan2(tg.x - hx, tg.z - hz) : my;
};
const tapAt: Record<string, number> = {};
const DIRK: Record<string, [number, number]> = { w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] };
const worldDir = (ix: number, iy: number): [number, number] => { const x = ix * Math.cos(az) - iy * -Math.sin(az), y = -ix * Math.sin(az) - iy * -Math.cos(az); const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
function startDash(gx: number, gy: number) {
  if (game.menuOpen || dlg.isOpen || dashCd > 0 || game.st.dead) return;
  if (game.st.stam < 15 && !game.st.god) { game.logMsg('Sem fôlego para o dash.', '#ffd24a'); return; }
  if (!game.st.god && !game.st.sp.has('u_sleipnir')) game.st.stam -= 15;
  if (game.st.sp.has('u_sleipnir') || game.st.sp.has('r_pena')) { const hp0 = hero.root.position, wing = game.st.sp.has('r_pena'); for (let i = 0; i < 30; i++) { const s2 = i % 2 ? 1 : -1, k = (i >> 1) / 15; particles.spawn(hp0.x - gx * k * 1.5 + gy * s2 * (wing ? 0.4 + k * 1.2 : 0.2), 1.2 + (wing ? Math.sin(k * Math.PI) * 0.8 : -0.9), hp0.z - gy * k * 1.5 - gx * s2 * (wing ? 0.4 + k * 1.2 : 0.2), { vy: 0.3, life: 0.6, s0: 0.3, s1: 0.04, c0: 0xffffff, c1: wing ? 0xfff0d0 : 0xcfe0ff, a: 0.9 }); } }
  dashT = 0.2; dashCd = 0.7; audio.dash(); hero.act('dash'); game.ambush(); dx0 = gx; dy0 = gy;
}
// slots da barra: clicáveis; a guarda segura enquanto o botão estiver pressionado
/* a interface nunca rola: um clique que dá foco a algo fora da tela (ou um atalho) podia empurrar a barra uma linha para baixo */
addEventListener('scroll', (e) => { const t = e.target as Element | Document; if (t === document || t === document.documentElement || t === document.body) { if (scrollX || scrollY) scrollTo(0, 0); } else if (t instanceof HTMLElement && t.closest('#bar,#hud,#quick')) { t.scrollTop = 0; t.scrollLeft = 0; } }, true);
/* barra travada: arrastar uma magia avisa onde destravar */
{ let dn: { x: number; y: number } | null = null, told = 0;
  document.getElementById('skills')!.addEventListener('pointerdown', (e) => { if ((e.target as HTMLElement).closest('.slot:not(.empty)') && document.documentElement.dataset.barEdit !== '1') dn = { x: e.clientX, y: e.clientY }; }, true);
  addEventListener('pointermove', (e) => { if (!dn) return; if (Math.hypot(e.clientX - dn.x, e.clientY - dn.y) > 10) { dn = null; if (performance.now() - told > 4000) { told = performance.now(); game.logMsg('🔒 A barra está travada. Clique no cadeado (canto inferior esquerdo da barra) para mover as magias.', '#ffe08a'); document.querySelector('.barlock')?.classList.add('ping'); setTimeout(() => document.querySelector('.barlock')?.classList.remove('ping'), 1600); } } });
  addEventListener('pointerup', () => { dn = null; }); }
{ const bar = document.getElementById('skills')!;
  bar.addEventListener('pointerdown', (e) => { const rb = (e.target as HTMLElement).closest('button[data-rows]') as HTMLElement | null; if (rb) { e.preventDefault(); e.stopPropagation(); setBarRows(barRows() + (rb.dataset.rows === '+' ? 1 : -1)); applyKit(kitRace(), game.st.lvl, (k) => tree.rank(k)); game.logMsg(`Barra de magias: ${barRows()} andar${barRows() > 1 ? 'es' : ''}.`, '#b9c6e0'); return; } const el = (e.target as HTMLElement).closest('.slot') as HTMLElement | null; if (!el || el.classList.contains('empty')) return; if (document.documentElement.dataset.barEdit === '1') return; /* destravada: só arrasta */ e.preventDefault(); e.stopPropagation(); audio.start(); useSlot(el.dataset.k!); });
  const up = () => { if (hero.guard) { game.guard(false); guardCone = false; if (!aimSlot) aim.hide(); } };
  bar.addEventListener('pointerup', up); bar.addEventListener('pointerleave', up); }
for (const id of ['bar', 'mini', 'menu', 'inv', 'shop', 'bigmap']) document.getElementById(id)?.addEventListener('contextmenu', (e) => e.preventDefault());
const ORDER: Race[] = ['nordic', 'technocrat', 'dwarf'];
function swapTo(r: Race) { if (r !== state.race) { state.race = r; swapHero(); game.setClassName(classOfRace(r)); } }
addEventListener('keyup', (e) => {
  /* magia de mira: segurar a tecla mostra o desenho no chão; soltar lança (toque rápido = lança na hora, onde o mouse está) */
  if (aimKey) { const k = e.key.toLowerCase(), slot = e.shiftKey && /^Digit[0-9]$/.test(e.code) ? '⇧' + e.code.slice(5) : k === 'j' ? '1' : k === 'q' ? '4' : /^[0-9]$/.test(k) ? k : null;
    if (slot && (slot === aimKey || slot === aimKey.replace('⇧', ''))) { const was = aimKey; aimKey = null; if (aimSlot === was) fireAim(); } }
});
addEventListener('keyup', (e) => { const sk = skillAt(kitRace(), e.key); if (sk?.id === 'guard') { game.guard(false); guardCone = false; if (!aimSlot) aim.hide(); } });
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (cine) { if (e.key === 'Escape' && (cine.sc.skippable || cine.skipOk)) endScene(); e.preventDefault(); return; }
  if (chat.isOpen || inicio.isOpen) return;
  if (e.key === 'F4') { e.preventDefault(); keys.clear(); coop.toggle(); return; }
  if (e.key === 'Enter' && !inv.isOpen && !dlg.isOpen && !quests.isOpen) { e.preventDefault(); keys.clear(); chat.open(); return; }
  if (e.key === 'Tab') e.preventDefault();
  if (e.key === 'Escape') { if (aimSlot) { cancelAim(); return; } if (skillsOpen || featsOpen) { toggleSkills(false); toggleFeats(false); return; } if (build.on) { build.toggle(false); return; } if (relicOpen) { closeRelics(); return; } if (olhoOpen) { toggleOlho(false); return; } if (dlg.isOpen) { dlg.close(); return; } if (quests.isOpen) { quests.closeAll(); return; } if (vid.isOpen) { vid.close(); return; } if (mail.isOpen) { mail.close(); return; } if (profs.isOpen) { profs.close(); return; } if (loja.isOpen) { loja.close(); return; } if (bigOpen) { toggleBigMap(); return; } if (inv.isOpen) { inv.closeAll(); return; } game.toggleMenu(); return; }
  if (game.menuOpen) return;
  if (k === 'i') { keys.clear(); inv.toggle(); return; }
  if (k === 'j') { keys.clear(); quests.toggleLog(); return; }
  if (k === 'y') { keys.clear(); profs.toggle(); return; }
  if (k === 't') { keys.clear(); loja.toggle(); return; }
  if (k === 'c') { keys.clear(); inv.toggleChar(); return; }
  if (k === 'u') { keys.clear(); compendium.toggle(); return; }
  if (k === 'k') { keys.clear(); toggleSkills(); return; }
  if (k === 'l') { keys.clear(); toggleFeats(); return; }
  if (k === 'b') { if (inside) { game.logMsg('Construa do lado de fora.', '#ff9a8a'); return; } if (combatMode) setCombat(false); build.toggle(); return; }
  if (k === 'r' && build.on) { build.rotate(); return; }
  if (k === 'z') { if (!mount) { if (Object.keys(MOUNTS).some((id) => inv.has(id))) return; game.logMsg('Você não tem montaria. Procure Orm, o Estalajadeiro.', '#ff9a8a'); return; } if (!riding && (combatMode || inside || swimmingNow)) { game.logMsg(combatMode ? 'Saia do modo de combate (Tab) para montar.' : 'Não dá para montar aqui.', '#ff9a8a'); return; } setRiding(!riding); return; }
  if (dlg.isOpen) return;
  if (e.shiftKey && /^Digit[0-9]$/.test(e.code)) { if (!e.repeat) useSlot('⇧' + e.code.slice(5), true); return; } // 2º andar da barra: ⇧1–⇧0
  keys.add(k); /* com janelas abertas ainda dá para andar, lutar e usar a barra */
  if (!e.repeat && DIRK[k]) { // duplo toque em W/A/S/D (ou setas) = dash naquela direção
    const nowMs = performance.now();
    if (nowMs - (tapAt[k] ?? -1e9) < 260) { const [ix, iy] = DIRK[k]; const [gx, gy] = worldDir(ix, iy); startDash(gx, gy); tapAt[k] = -1e9; } else tapAt[k] = nowMs;
  }
  if (k === '6') { const f = hero.facing; startDash(state.moving ? dx0 || Math.sin(f) : Math.sin(f), state.moving ? dy0 || Math.cos(f) : Math.cos(f)); }
  if (k === 'k') { keys.clear(); toggleSkills(); return; }
  if (k === 'l') { keys.clear(); toggleFeats(); return; }
  if (k === 'm') toggleBigMap();
  if (k === 'o') audio.toggleMute();
  if (k === 'p') game.logMsg(audio.toggleMusic() ? '🎵 Música ligada' : '🎵 Música desligada', '#b9c6e0');
  if (k === 'n') { nightOverride = nightOverride === null ? 1 : nightOverride === 1 ? 0 : null; game.logMsg(nightOverride === null ? '🕯 Ciclo natural de dia e noite.' : nightOverride ? '🌙 Noite forçada (teste).' : '☀ Dia forçado (teste).', '#b9c6e0'); }
  if (/^[0-9]$/.test(k) && !e.repeat) useSlot(k, true); else if (/^[0-9]$/.test(k) && skillAt(kitRace(), k)?.id === 'combo') useSlot(k);
  if (k === 'j' && !e.repeat) useSlot('1', true);
  if (k === 'q' && !e.repeat) useSlot('4', true);
  if (k === 'f' && !e.repeat && !e.ctrlKey && !e.metaKey) toggleInstinct();
  if (k === 'e') interact();
  if (k === 'e' && !e.repeat) { eDown = performance.now(); eRot = false; }
  if (k === 'g') { game.st.god = !game.st.god; ZOOM_MAX = game.st.god ? 95 : 22; if (!game.st.god) zoomTarget = Math.min(zoomTarget, 22); else zoomTarget = Math.max(zoomTarget, 40); game.logMsg(game.st.god ? '⚡ MODO DEUS: velocidade, força e invulnerabilidade' : 'Modo deus desligado', '#ffd24a'); }
  if (k === 'r' && !e.repeat) { runOn = !runOn; try { localStorage.setItem('karmika.run', runOn ? '1' : '0'); } catch { /* */ } game.logMsg(runOn ? '🏃 Correr: ligado (R)' : '🚶 Andar: ligado (R)', '#ffd24a'); }
  if (k === 'h') game.damage(12, heroPosNow());
  if (e.key === 'F5' && e.shiftKey) { e.preventDefault(); swapTo('nordic'); return; }
  if (e.key === 'F6' && e.shiftKey) { e.preventDefault(); swapTo('technocrat'); return; }
  if (e.key === 'F7' && e.shiftKey) { e.preventDefault(); swapTo('dwarf'); return; }
  if (/^F[1-8]$/.test(e.key)) { e.preventDefault(); useQuick(+e.key.slice(1) - 1); return; }
  if (e.key === 'Tab') setCombat(!combatMode);
  void ORDER;
});
addEventListener('keyup', (e) => { const kk = e.key.toLowerCase(); if (CAM_FREE && kk === 'e' && keys.has('e') && !eRot && !inv.isOpen && !quests.isOpen && !dlg.isOpen) interact(); keys.delete(kk); });
let eDown = 0, eRot = false;
let drag: { x: number; y: number } | null = null;
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
/* Ctrl + clique num jogador: menu dele (mensagem privada, grupo, perfil) — antes de qualquer outro clique no mundo */
canvas.addEventListener('pointerdown', (e) => { if (!e.ctrlKey || e.button !== 0 || net.state !== 'on') return; const id = net.pickAt(e.clientX, e.clientY); if (!id) return; e.preventDefault(); e.stopImmediatePropagation(); keys.clear(); coop.playerMenu(id, e.clientX, e.clientY); }, true);
const CAM_FREE = false; // câmera fixa (Hades-like); true liga giro Q/E e arrasto com o botão do meio
canvas.addEventListener('pointerdown', (e) => { if (CAM_FREE && e.button === 1) { e.preventDefault(); drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); } });
addEventListener('pointermove', (e) => {
  if (!drag) return;
  azT -= (e.clientX - drag.x) * 0.006;
  pitchT = THREE.MathUtils.clamp(pitchT + (e.clientY - drag.y) * 0.004, PITCH_MIN, PITCH_MAX);
  drag = { x: e.clientX, y: e.clientY };
});
addEventListener('pointerup', () => { drag = null; });
addEventListener('wheel', (e) => {
  if ((e.target as HTMLElement | null)?.tagName !== 'CANVAS') return; // roda em cima de janela/painel: rola a janela, nunca dá zoom no jogo de trás
  zoomTarget = THREE.MathUtils.clamp(zoomTarget * Math.exp(e.deltaY * 0.0009), ZOOM_MIN, ZOOM_MAX);
}, { passive: true });
let nightTarget = 1;
/* ---------- ciclo de dia e noite por turnos: 6 turnos de 4 h do jogo (30 min reais cada) → dia de 24 h = 3 h reais; relógio do mundo (igual para todos) ---------- */
const DAY_REAL_MS = 3 * 3600 * 1000;
let nightOverride: number | null = null; state.night = (() => { const h = (((Date.now() % (3 * 3600 * 1000)) / (3 * 3600 * 1000)) * 24 + 8) % 24; return h >= 7 && h < 17 ? 0 : h >= 19 || h < 5 ? 1 : h < 19 ? (h - 17) / 2 : 1 - (h - 5) / 2; })(); // N alterna: natural → noite forçada → dia forçado → natural (teste)
const gameHour = () => (((Date.now() % DAY_REAL_MS) / DAY_REAL_MS) * 24 + 8) % 24;
const TURNS: [number, string][] = [[6, 'Manhã'], [10, 'Meio-dia'], [14, 'Tarde'], [18, 'Anoitecer'], [22, 'Madrugada'], [2, 'Alvorada']];
function turnName(h = gameHour()) { for (const [h0, nm] of TURNS) if (h >= h0 && h < h0 + 4) return nm; return 'Alvorada'; }
/** escuridão 0..1 pela hora: noite plena 19–5 h, crepúsculos suaves de 2 h */
function nightAt(h: number) { if (h >= 7 && h < 17) return 0; if (h >= 19 || h < 5) return 1; if (h >= 17 && h < 19) return (h - 17) / 2; return 1 - (h - 5) / 2; }

/* modelo do artista (Eric Campos) para a guerreira do Norte: dirigido pela animação procedural */
const SKINS_ART: Partial<Record<Kind, SkinDef>> = { nordic: { fbx: '/models/heroes/NordicWarrior/warrior_rigged.fbx', tex: '/models/heroes/NordicWarrior/warrior_base.jpg' } };
/* humanos (homem e mulher): nível 1 = só a roupa de baixo, sem equipamento; ao vestir a primeira ROUPA (peitoral, elmo, botas, capa ou ombreiras — arma e escudo não contam) passa para o nível 2 */
const CLOTH_SLOTS = ['armor', 'helm', 'boots', 'cape', 'shoulders'] as const;
let creating = false; /* na tela de criação o personagem nasce sem roupa: a prévia mostra a pele de nível 1 */
function humanSkinKey(): string | null {
  const origin = profile?.origin ?? 'human'; if (origin !== 'human' || kindOf(state.race) !== 'nordic') return null;
  const sex = profile?.sex ?? 'f'; let dressed = false; if (!creating) try { dressed = CLOTH_SLOTS.some((sl) => !!(inv.eq as Record<string, unknown>)[sl]); } catch { /* inv ainda não existe */ }
  /* guerreiro do Norte (passou na prova do mestre, v_gue): vestido, ganha o modelo do guerreiro (homem: Guerreiro_lvl_01; mulher: a guerreira do Norte) */
  let warrior = false; try { warrior = profile?.path === 'gue' && quests.q.done.includes('v_gue'); } catch { /* quests ainda não existe */ }
  if (warrior && dressed) return sex === 'm' ? 'guerreiro_m' : 'guerreiro_f';
  return `${sex === 'm' ? 'humano' : 'humana'}_${dressed ? 2 : 1}`;
}
const HERO_SKIN: Record<string, SkinDef> = { guerreiro_m: { fbx: '/models/heroes/NordicWarrior/Guerreiro_lvl_01.fbx', tex: '/models/heroes/NordicWarrior/Guerreiro_lvl_01_Color.jpg' }, guerreiro_f: { fbx: '/models/heroes/NordicWarrior/warrior_rigged.fbx', tex: '/models/heroes/NordicWarrior/warrior_base.jpg' } };
let skinTick: (() => void) | null = null, skinToken = 0, skinKey = '', skinModel: THREE.Object3D | null = null, netSkin: SkinDef | null = null;
function applyArtSkin() {
  skinTick = null; netSkin = null; if (skinModel) { skinModel.parent?.remove(skinModel); skinModel = null; } skinKey = '';
  if (localStorage.getItem('karmika.artskin') === '0') return;
  const hk = humanSkinKey(), k = kindOf(state.race), def: SkinDef | undefined = hk ? HERO_SKIN[hk] ?? { fbx: `/models/humanos/${hk}.fbx`, tex: `/models/humanos/${hk}.jpg` } : SKINS_ART[k]; if (!def) return;
  skinKey = hk ?? k; const my = ++skinToken, h = hero;
  attachSkin(h, def).then((r) => { if (!r || my !== skinToken || h !== hero) { if (r) h.root.remove(r.model); return; } if (skinModel && skinModel !== r.model) skinModel.parent?.remove(skinModel); skinModel = r.model; skinTick = r.tick; netSkin = def; netRef?.lookNow(); portraits.delete('hero'); dispatchEvent(new Event('karmika:skinready')); });
}
/** ao trocar de roupa: se o nível da pele mudou (1 ↔ 2), troca o modelo */
function checkSkinLevel() { const hk = humanSkinKey(); if (hk && hk !== skinKey) applyArtSkin(); }
function swapHero() {
  scene.remove(hero.root);
  hero = createCharacter(kindOf(state.race), profile ? { hair: profile.hair, skin: profile.skin, hairStyle: profile.hairStyle, beard: profile.beard, ears: profile.origin === 'elf' } : {});
  hookHero();
  scene.add(fine(hero.root)); syncGear(); applyArtSkin();
  (document.getElementById('who') as HTMLElement).textContent = RACES[state.race].label;
  tree.migrate(); applyKit(kitRace(), game.st.lvl, (k) => tree.rank(k)); applyRes(); cancelAim(); hero.combat = combatMode;
}
tree.migrate(); applyKit(kitRace(), game.st.lvl, (k) => tree.rank(k));
/** recurso do caminho: o orbe da direita muda de nome, de cor e de regra (guerreiros: Ímpeto, que enche lutando) */
function applyRes() { setCulture(state.race === 'technocrat' ? 'technocrat' : state.race === 'dwarf' ? 'dwarf' : 'nordic'); const r = resOf(kitRace()); game.setResource(r); globes.setStyle(r.style); const o = document.getElementById('mp'); if (o) { o.title = r.tip; const u = o.querySelector('u'); if (u) u.textContent = r.label; o.dataset.res = r.style; } }
applyRes();
/* a classe segue o caminho jogável atual (o humano puro chega depois): guerreiro nórdico, tecnocrata ou guerreiro anão */
/* antes da Vidente (nível 30), a classe é a própria raça; os testes de dev (F5–F7) ainda trocam o corpo */
const classOfRace = (r: Race) => kindOf(r) === 'technocrat' ? 'Tecnocrata' : (profile?.origin ?? 'human') === 'dwarf' ? 'Anão' : profile?.origin === 'elf' ? 'Elfo' : 'Humano';
game.setClassName(classOfRace(state.race));
let lastLvl = game.st.lvl;

const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const marker = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.7, 4), new THREE.MeshBasicMaterial({ color: 0xf2b04a, side: THREE.DoubleSide }));
marker.rotation.x = -Math.PI / 2; marker.rotation.z = Math.PI / 4; marker.visible = false;
scene.add(fine(marker));
addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const p = new THREE.Vector3(); if (ray.ray.intersectPlane(plane, p)) { mouse.x = p.x; mouse.z = p.z; mouseMovedT = performance.now(); }
});
let rmb = false;
addEventListener('pointerup', (e) => { if (e.button === 2) rmb = false; if (e.button === 0) lmbHold = 0; });
addEventListener('blur', () => { rmb = false; });
/* marca de clique no chão: losango kármico que abre e some */
const clickMarks: { m: THREE.Mesh; t: number }[] = [];
const clickGeo = (() => { const sh = new THREE.Shape(); sh.moveTo(0, 0.55); sh.lineTo(0.38, 0); sh.lineTo(0, -0.55); sh.lineTo(-0.38, 0); sh.closePath(); const hole = new THREE.Path(); hole.moveTo(0, 0.32); hole.lineTo(0.22, 0); hole.lineTo(0, -0.32); hole.lineTo(-0.22, 0); hole.closePath(); sh.holes.push(hole); return new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2); })();
function clickMark(x: number, z: number, col = 0xffd24a) {
  const m = new THREE.Mesh(clickGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide }));
  m.position.set(x, (inside ? 0 : heightAt(x, z)) + 0.06, z); scene.add(fine(m)); clickMarks.push({ m, t: 0 });
}
function updateClickMarks(dt: number) { for (let i = clickMarks.length - 1; i >= 0; i--) { const c = clickMarks[i]; c.t += dt; const k = c.t / 0.5; c.m.scale.setScalar(0.6 + k * 1.1); c.m.rotation.y = k * 0.8; (c.m.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - k); if (k >= 1) { scene.remove(c.m); (c.m.material as THREE.Material).dispose(); clickMarks.splice(i, 1); } } }
canvas.addEventListener('pointerdown', (e) => {
  if (cine) return;
  if (!game.menuOpen && !build.on && (e.button === 0 || e.button === 2)) clickMark(mouse.x, mouse.z, e.button === 2 ? 0xff7a5a : 0xffd24a);
  if (build.on && (e.button === 0 || e.button === 2)) { e.preventDefault(); const r0 = canvas.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2(((e.clientX - r0.left) / r0.width) * 2 - 1, -((e.clientY - r0.top) / r0.height) * 2 + 1), camera); const p0 = new THREE.Vector3(); if (ray.ray.intersectPlane(plane, p0)) build.click(p0.x, p0.z, e.button); return; }
  if (e.button === 2 && !game.menuOpen) { if (aimSlot) { fireAim(); return; } setCombat(true); rmb = true; game.attack(aimYaw(), heroPosNow()); return; }
  if (e.button === 0 && aimSlot) { cancelAim(); return; }
  if (e.button !== 0 || game.menuOpen) return;
  const r = canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(plane, p)) return;
  const tx = Math.floor(p.x / T), ty = Math.floor(p.z / T);
  planTo(p.x / T, p.z / T); lmbHold = performance.now(); // segurar o botão: o herói segue o mouse (Diablo)
  marker.visible = false; // sem losango no chão: a marca de clique já mostra o destino
  marker.position.set((tx + 0.5) * T, 0.1, (ty + 0.5) * T);
});

const R = 0.16;
const TRUNK = 0.2; // raio do tronco em tiles (0,4 m): dá para passar entre as árvores da floresta densa
/* REGRA DE OURO (imutável): mobilidade acima da física. Paredes, água funda e montanha bloqueiam; bancos, cadeiras, tochas,
   lápides, troncos e móveis só bloqueiam o miolo, e quem fica preso neles se espreme e passa (squeeze). Ninguém trava em beco, banco ou floresta. */
/* caminho de ronda das muralhas: lá em cima só se anda pelo anel (e se desce pela casa mais alta da escada);
   do chão só se sobe pela escada (a casa de cima, já na altura do caminho) */
let onWall = false;
const CORN: [number, number][] = [[-R, -R], [R, -R], [R, R], [-R, R]];
const wallFree = (x: number, y: number) => CORN.every(([dx, dy]) => { const tx = Math.floor(x + dx), ty = Math.floor(y + dy); return !!rampartAt(tx, ty) || stairTopAt(tx, ty); });
const stepUp = (x: number, y: number) => { const tx0 = Math.floor(state.fx), ty0 = Math.floor(state.fy); if (!stairTopAt(tx0, ty0)) return false; const rp = rampartAt(Math.floor(x), Math.floor(y)) ?? CORN.map(([dx, dy]) => rampartAt(Math.floor(x + dx), Math.floor(y + dy))).find(Boolean); if (!rp || heroY < rp.top - 1.3) return false;
  return CORN.every(([dx, dy]) => { const tx = Math.floor(x + dx), ty = Math.floor(y + dy); return !!rampartAt(tx, ty) || stairDeck((tx + 0.5) * T, (ty + 0.5) * T) !== null; }); };
const free = (x: number, y: number, squeeze = false) => inside ? inside.int.free(x * T - IX, y * T - IZ, squeeze) : onWall ? wallFree(x, y) : stepUp(x, y) || freeGround(x, y, squeeze);
/** chão do herói: o terreno ou o degrau/patamar de prédio por cima dele (world3d.stepAt), se estiver ao alcance de um passo */
function heroGround(xm: number, zm: number) { const g = heightAt(xm, zm), s = stepAt(xm, zm); return s !== null && s > g && s - heroY < 0.8 ? s : g; }
/** degrau alto demais (a lateral do plinto, um muro baixo): barra em vez de atravessar */
const stepBlock = (x: number, y: number) => { if (inside || onWall) return false; const s = stepAt(x * T, y * T); return s !== null && s - heroY > 0.8 && s > heightAt(x * T, y * T) + 0.06; };
const freeGround = (x: number, y: number, squeeze = false) => !stepBlock(x, y) &&
  [[-R, -R], [R, -R], [R, R], [-R, R]].every(([dx, dy]) => {
    const tx = Math.floor(x + dx), ty = Math.floor(y + dy);
    return ty >= 0 && tx >= 0 && ty < city.map.length && tx < city.map[0].length && (isWalkable(city.map[ty][tx]) || city.map[ty][tx] === 'water' || city.map[ty][tx] === 'tree');
  }) && (squeeze ? !(solidHit(x, y, true) && !solidHit(state.fx, state.fy, true)) : (!trunkHit(x, y) && !(solidHit(x, y) && !solidHit(state.fx, state.fy)))) && !enemyBlock(x, y) && (() => { /* preso dentro de algo (teleporte)? deixa sair */ const g = groundH(x * T, y * T), tl = city.map[Math.floor(y)]?.[Math.floor(x)]; return g > WL - 2.6 && (g < 11 || ((tl === 'road' || tl === 'plaza') && g < 80)); })(); /* estrada de montanha (o caracol do Conde) sobe até onde for */ // mar aberto, lama funda e alta montanha não se atravessam
/* objetos sólidos do cenário (fonte, bancos, barracas, tendas, baús, tochas, lápides, estátuas, relíquias…): não se atravessa mais.
   O que continua passável de propósito: grama, ervas, ossos e o meio das árvores da floresta (só o tronco bloqueia) */
/** pontos de trabalho do mapa (centro em metros) */
const STATIONS = city.props.filter((p) => p.kind === 'station').map((p) => ({ x: (p.gx + p.w / 2) * T, z: (p.gy + p.h / 2) * T, v: p.variant ?? 0 }));
const PROF_NAME: Record<string, string> = { marceneiro: 'Marceneiro', ferreiro: 'Ferreiro', costureiro: 'Costureiro', alquimista: 'Alquimista', cozinheiro: 'Cozinheiro' };
function stationNear(prof: string, reach = 6) { if (inside) return null; const hx = state.fx * T, hz = state.fy * T; return STATIONS.find((s2) => STATION_INFO[s2.v].prof === prof && Math.hypot(s2.x - hx, s2.z - hz) < reach) ?? null; }
const SOLID_R: Record<string, number> = { station: 0.72, noticeboard: 0.3, mailbox: 0.2, vault: 0.36, shopfront: 1.2, fountain: -1, deadwell: -1, bench: 0.24, stall: 0.6, chest: 0.24, torch: 0.1, relic: 0.4, tent: 0.85, grave: 0.18, angel: 0.38, obelisk: 0.34, saint: 0.38, altar: 0.55, campfire: 0.26, gpillar: 0.24, mausoleum: -1 };
const solids = new Map<number, { x: number; y: number; r: number }[]>();
for (const p of city.props) { const r0 = SOLID_R[p.kind]; if (r0 === undefined) continue; const r = r0 < 0 ? Math.min(p.w, p.h) * 0.47 : r0, c = { x: p.gx + p.w / 2, y: p.gy + p.h / 2, r };
  for (let ty = Math.floor(c.y - r - 0.3); ty <= Math.floor(c.y + r + 0.3); ty++) for (let tx = Math.floor(c.x - r - 0.3); tx <= Math.floor(c.x + r + 0.3); tx++) { const k = ty * 4096 + tx; const l = solids.get(k); if (l) l.push(c); else solids.set(k, [c]); } }
/** bichos são corpos: o herói não entra neles (só atravessa na investida e na esquiva); afastar-se é sempre livre */
function enemyBlock(x: number, y: number) { const n = hero.actName; if (n === 'dash' || n === 'jet' || n === 'rush' || n === 'charge') return false;
  for (const e of game.enemies.list) { if (!e.active || !e.alive || e.state === 'dead') continue; const ex = e.pos.x / T, ey = e.pos.z / T, m = (e.def.radius * 0.8 + 0.45) / T, dn = Math.hypot(x - ex, y - ey); if (dn < m && dn < Math.hypot(state.fx - ex, state.fy - ey)) return true; } return false; }
/** big = só os sólidos grandes (fonte, poço, barraca, mausoléu, loja, ponto de trabalho): esses nunca se atravessam, nem se espremendo */
function solidHit(x: number, y: number, big = false) { const l = solids.get(Math.floor(y) * 4096 + Math.floor(x)); if (!l) return false; for (const c of l) if ((!big || c.r >= 0.7) && Math.hypot(x - c.x, y - c.y) < c.r + R) return true; return false; }
function trunkHit(x: number, y: number) {
  const gx = Math.floor(x), gy = Math.floor(y);
  for (let ty = gy - 1; ty <= gy + 1; ty++) for (let tx = gx - 1; tx <= gx + 1; tx++) if (city.map[ty]?.[tx] === 'tree') { if (Math.hypot(x - (tx + 0.5), y - (ty + 0.5)) < R + TRUNK) return true; }
  return false;
}

/* ---------- clique para andar (nav.ts): a sonda é o mesmo corpo do movimento, sem os bichos (eles se mexem; quem trava, recalcula) ---------- */
const hOk = new Int8Array(city.map.length * city.map[0].length); // 0 = não visto, 1 = pisável, 2 = alto/fundo demais
function tileHeightOk(tx: number, ty: number) { const i = ty * city.map[0].length + tx; if (hOk[i]) return hOk[i] === 1;
  const g = groundH((tx + 0.5) * T, (ty + 0.5) * T), tl = city.map[ty][tx], ok = g > WL - 2.6 && (g < 11 || ((tl === 'road' || tl === 'plaza') && g < 80)); hOk[i] = ok ? 1 : 2; return ok; }
function groundProbe(x: number, y: number) {
  for (const [dx, dy] of CORN) { const tx = Math.floor(x + dx), ty = Math.floor(y + dy); if (ty < 0 || tx < 0 || ty >= city.map.length || tx >= city.map[0].length) return false; const tl = city.map[ty][tx];
    if (!(isWalkable(tl) || tl === 'water' || tl === 'tree') || !tileHeightOk(tx, ty)) return false; }
  return !trunkHit(x, y) && !solidHit(x, y);
}
const navProbe = (x: number, y: number) => inside ? inside.int.free(x * T - IX, y * T - IZ, false) : onWall ? wallFree(x, y) : groundProbe(x, y);
const navCost = (x: number, y: number) => { if (inside || onWall) return 1; const tl = city.map[Math.floor(y)]?.[Math.floor(x)]; return tl === 'water' ? 3 : tl === 'tree' ? 1.3 : tl === 'road' || tl === 'plaza' ? 0.85 : 1; };
let lmbHold = 0, holdT = 0;
let navGoal: { x: number; y: number } | null = null, navReplans = 0, navChk = 0, navProg = { x: 0, y: 0, t: 0 };
function planTo(gx: number, gy: number, replan = false, maxNodes = 40000) {
  if (!replan) navReplans = 0; navGoal = { x: gx, y: gy };
  state.path = navPath(navProbe, state.fx, state.fy, gx, gy, { cost: navCost, maxNodes }) as Vec[];
  navProg = { x: state.fx, y: state.fy, t: 0 };
}
/** seguir o caminho: corta a curva que ficou livre, percebe quando trava e recalcula (duas vezes); depois desiste em vez de correr parado */
function followPath(dt: number): [number, number] {
  if (!state.path.length) return [0, 0];
  navChk -= dt; if (navChk <= 0 && state.path.length >= 2) { navChk = 0.2; if (lineFree(navProbe, state.fx, state.fy, state.path[1].x, state.path[1].y)) state.path.shift(); }
  const n = state.path[0], last = state.path.length === 1, dx = n.x - state.fx, dy = n.y - state.fy, d = Math.hypot(dx, dy);
  if (d < (last ? 0.08 : 0.3)) { state.path.shift(); if (!state.path.length) { marker.visible = false; navGoal = null; return [0, 0]; } return followPath(0); }
  navProg.t += dt;
  if (navProg.t > 0.5) { const moved = Math.hypot(state.fx - navProg.x, state.fy - navProg.y);
    if (moved < 0.12 && navGoal) { if (navReplans++ < 2) planTo(navGoal.x, navGoal.y, true); else { state.path = []; navGoal = null; return [0, 0]; } }
    navProg = { x: state.fx, y: state.fy, t: 0 }; }
  return [dx / d, dy / d];
}

/* envelope dourado brilhando em cima das caixas de correio quando há carta não lida */
const envTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d')!; const gr = g.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, 'rgba(255,220,120,.85)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#f6e2a0'; g.strokeStyle = '#5a3a10'; g.lineWidth = 2.5; g.beginPath(); g.rect(14, 20, 36, 25); g.fill(); g.stroke(); g.beginPath(); g.moveTo(14, 20); g.lineTo(32, 35); g.lineTo(50, 20); g.stroke(); g.fillStyle = '#b3202f'; g.beginPath(); g.arc(32, 35, 4, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const envSprites = city.props.filter((p) => p.kind === 'mailbox').map((p) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: envTex, transparent: true, depthWrite: false, toneMapped: false })); const x = (p.gx + 0.5) * T, z = (p.gy + 0.5) * T; sp.position.set(x, heightAt(x, z) + 2.5, z); sp.scale.setScalar(0.85); sp.visible = false; sp.renderOrder = 5; scene.add(sp); return { sp, y: sp.position.y }; });
function updateEnvelopes(t: number) { const on = mail.unread > 0 && !inside; for (const e of envSprites) { e.sp.visible = on; if (on) { e.sp.position.y = e.y + Math.sin(t * 2.2) * 0.08; (e.sp.material as THREE.SpriteMaterial).opacity = 0.75 + Math.sin(t * 4) * 0.25; } } }
/* silhueta atrás dos prédios (herói sempre; NPC só quando o herói está perto) */
const xray = createXray();
{ const HT: Record<string, number> = { house: 7.5, temple: 12, church: 10, shopfront: 4.6, tent: 3.2, stall: 3, mausoleum: 6, tower: 14 };
  xray.setBuildings(city.props.filter((p) => HT[p.kind]).map((p) => { const y0 = groundH((p.gx + p.w / 2) * T, (p.gy + p.h / 2) * T), big = p.kind === 'church' && p.variant === 2; return { x0: p.gx * T + 0.2, z0: p.gy * T + 0.2, x1: (p.gx + p.w) * T - 0.2, z1: (p.gy + p.h) * T - 0.2, y0, y1: y0 + (big ? 40 : HT[p.kind]) }; })); }
function updateXray(dt: number) {
  const hp = hero.root.position, who: { root: THREE.Object3D; at: THREE.Vector3; want: boolean }[] = [{ root: hero.root, at: hp, want: !inside && !cine }];
  for (const n of npcSys.npcs) { const d = Math.hypot(n.pos.x - hp.x, n.pos.z - hp.z); if (d < 7) who.push({ root: n.hero.root, at: n.pos, want: !inside && !cine }); }
  xray.update(dt, camera.position, who);
}
/** anda deslizando: direto; senão por um eixo; senão contornando o canto (±35°, ±70°); se ficar preso, espreme-se entre os objetos */
let stuckT = 0;
function moveSlide(dx: number, dy: number, dt: number, trying: boolean) {
  const x0 = state.fx, y0 = state.fy, L = Math.hypot(dx, dy); if (L < 1e-6) return;
  if (free(x0 + dx, y0 + dy)) { state.fx += dx; state.fy += dy; }
  else {
    if (free(x0 + dx, y0)) state.fx = x0 + dx; if (free(state.fx, y0 + dy)) state.fy = y0 + dy;
    if (state.fx === x0 && state.fy === y0) { const a0 = Math.atan2(dy, dx);
      for (const da of [0.6, -0.6, 1.2, -1.2]) { const a = a0 + da, ex = Math.cos(a) * L * 0.85, ey = Math.sin(a) * L * 0.85; if (free(x0 + ex, y0 + ey)) { state.fx = x0 + ex; state.fy = y0 + ey; break; } } }
  }
  const moved = Math.hypot(state.fx - x0, state.fy - y0);
  if (trying && moved < L * 0.25) { stuckT += dt; if (stuckT > 0.22 && free(x0 + dx, y0 + dy, true)) { state.fx = x0 + dx; state.fy = y0 + dy; } } else stuckT = Math.max(0, stuckT - dt * 2);
}
/* ---------- ciclo ---------- */
const dayC = { sky: new THREE.Color(0x9bbad8), fog: new THREE.Color(0x9bbad8) };
const nightC = { sky: new THREE.Color(0x050814), fog: new THREE.Color(0x070a18) };
const sunDay = new THREE.Color(0xffdca8), sunNight = new THREE.Color(0x6a88d0);
const hemiDaySky = new THREE.Color(0xf4e6cc), hemiNightSky = new THREE.Color(0x24407e);
const hemiDayGround = new THREE.Color(0x4a3a22), hemiNightGround = new THREE.Color(0x10182a);
/* os globais: Lua de Sangue (rubro, sanguinário) e Dia da Aurora (ouro e rosa, luz de igreja) */
const LUA_C = { sky: new THREE.Color(0x3a0604), fog: new THREE.Color(0x4a0a06), hemi: new THREE.Color(0xa0241a), ground: new THREE.Color(0x3a0806), sun: new THREE.Color(0xff3a1c) };
const AUR_C = { sky: new THREE.Color(0xf6dcc4), fog: new THREE.Color(0xf0d8c8), hemi: new THREE.Color(0xffe8f0), sun: new THREE.Color(0xfff0d8) };
const LUA_MUL = new THREE.Vector3(1.42, 0.6, 0.5), LUA_LIFT = new THREE.Vector3(0.07, 0, 0);
const AUR_MUL = new THREE.Vector3(1.07, 1.03, 0.97), AUR_LIFT = new THREE.Vector3(0.035, 0.028, 0.04);
let gChkT = 0, gCur: string | null = null, gForce: string | null | undefined = undefined, luaK = 0, aurK = 0;
const clock = new THREE.Clock();
let heroY = heightAt(city.spawn.x * T, city.spawn.y * T), camY = heroY;
let leadX = 0, leadZ = 0, dashT = 0, dashCd = 0, dx0 = 0, dy0 = 0, vel = 0;
let t = 0, wasFull = false, spawnAcc = 0, camX = hero.root.position.x, camZ = hero.root.position.z;
const heroPos = new THREE.Vector3();
let shown = false, swimAcc = 0;
const IX = 4000, IZ = 4000;
const fadeEl = document.createElement('div'); fadeEl.id = 'fade'; fadeEl.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:30;transition:opacity .25s';
fadeEl.innerHTML = '<div class="ldr"><div class="ldr-eye"><i></i></div><b>Atravessando o caminho…</b><small>o mundo se ergue à sua volta</small></div>'; document.body.appendChild(fadeEl);
/** troca de lugar (fonte, relíquia, casa, cripta): tela de carregamento com o olho girando (animação de CSS: continua mesmo com o jogo ocupado);
    só some quando o mundo novo já foi montado, os shaders compilados e os quadros voltaram a ficar leves */
let fading = false;
function withFade(fn: () => void, label?: string, after?: () => void) {
  if (fading) return; fading = true; const lb = fadeEl.querySelector('b'); if (lb) lb.textContent = label ?? 'Atravessando o caminho…';
  fadeEl.classList.add('on'); fadeEl.style.pointerEvents = 'auto'; fadeEl.style.opacity = '1';
  setTimeout(() => { requestAnimationFrame(() => {
    try { fn(); } catch (err) { console.error(err); }
    try { renderer.compile(scene, camera); } catch { /* */ }
    let last = performance.now(), calm = 0; const t0 = last;
    const check = () => { const now = performance.now(), dtm = now - last; last = now; calm = dtm < 45 ? calm + 1 : 0;
      if (calm >= 6 || now - t0 > 8000) { fadeEl.style.opacity = '0'; fadeEl.style.pointerEvents = 'none'; setTimeout(() => { fadeEl.classList.remove('on'); fading = false; after?.(); }, 260); } else requestAnimationFrame(check); };
    requestAnimationFrame(check); }); }, 260);
}
function enterHouse(p: (typeof city.props)[number]) {
  withFade(() => {
    const holy = p.kind === 'temple' || p.kind === 'church';
    const int = buildInterior(holy ? (p.kind === 'church' ? 7 : 6) : (p.variant ?? 0), p.w * T, p.h * T, p.gx * 31 + p.gy);
    int.group.position.set(IX, 0, IZ); scene.add(int.group);
    { const dd = DOOR_OF.get(p); inside = { int, ret: dd ? { x: dd.out.x / T, y: dd.out.z / T } : { x: p.gx + p.w / 2 + (holy ? 0.8 : 0), y: p.gy + p.h + 0.8 }, prop: p }; }
    objs.group.visible = false; sitting = null; for (const n of npcSys.npcs) n.hero.root.visible = false;
    state.fx = (IX + int.W / 2) / T; state.fy = (IZ + int.D - 0.6) / T; state.path = [];
    heroY = 0; camX = IX + int.W / 2; camZ = IZ + int.D / 2; camY = 0;
    game.logMsg(p.kind === 'temple' ? 'Templo Kármico' : p.kind === 'church' ? 'Igreja Abandonada — o ar é frio aqui' : p.variant === 4 ? 'Taverna Karmika' : p.variant === 5 ? 'Loja do Armeiro' : 'Você entra na casa', '#f4e6b8');
  });
}
/* ---------- Catedral Abandonada: nave, 3 criptas enormes, a Porta do Bispo (3 selos) e o salão do Bispo Caído ---------- */
const CRYPT_FLOORS: { name: string; types: [EnemyType, number][]; elite?: { type: EnemyType; name: string; hpMul: number; dmgMul: number; scale: number; seal?: string } }[] = [
  { name: 'Nave da Catedral', types: [['zombie', 18], ['imp', 8], ['ghoul', 2]] },
  { name: 'Cripta dos Esquecidos', types: [['zombie', 26], ['imp', 10], ['ghoul', 6]], elite: { type: 'tormentor', name: 'Carrasco das Criptas', hpMul: 2.2, dmgMul: 1.3, scale: 1.2, seal: 'seal_1' } },
  { name: 'Mausoléu dos Príncipes', types: [['zombie', 28], ['ghoul', 14], ['imp', 8]], elite: { type: 'prince', name: 'Príncipe Ósseo', hpMul: 2.6, dmgMul: 1.4, scale: 1.25, seal: 'seal_2' } },
  { name: 'Câmara dos Selos', types: [['zombie', 30], ['ghoul', 18], ['imp', 8]], elite: { type: 'tormentor', name: 'Guardião do Mausoléu', hpMul: 3.0, dmgMul: 1.5, scale: 1.4, seal: 'seal_3' } },
  { name: 'Salão do Bispo Caído', types: [['zombie', 8], ['ghoul', 2]] },
];
/* Vasilhame do Sacrifício: o sangue de cada morto da Catedral escorre para a taça do andar. 666 litros no total abrem o caminho até o Bispo.
   Os mortos se reerguem enquanto a taça não enche, então o portão nunca depende de "matar todos". */
const BLOOD_NEED = [111, 166, 222, 167]; // 666
const BLOOD_OF: Partial<Record<EnemyType, number>> = { zombie: 3, imp: 2, ghoul: 6, tormentor: 30, prince: 30 };
let blood: number[] = (() => { try { const a = JSON.parse(localStorage.getItem('karmika.crypt.blood') || '[]'); return [0, 1, 2, 3].map((i) => Math.min(BLOOD_NEED[i], +a[i] || 0)); } catch { return [0, 0, 0, 0]; } })();
const bloodFull = (f: number) => f >= 1 && f <= 4 && blood[f - 1] >= BLOOD_NEED[f - 1];
const bloodTotal = () => blood.reduce((a, b) => a + b, 0);
let raiseT = 0, raiseWait = 0;
const bloodHud = document.createElement('div'); bloodHud.id = 'bloodhud'; document.body.appendChild(bloodHud);
function drawBloodHud() {
  const f = inside?.crypt; if (!f || f > 4 || localStorage.getItem('karmika.crypt.done') === '1') { bloodHud.style.display = 'none'; return; }
  const have = Math.floor(blood[f - 1]), need = BLOOD_NEED[f - 1], k = Math.min(1, have / need), full = have >= need;
  bloodHud.style.display = 'block'; bloodHud.classList.toggle('full', full);
  bloodHud.innerHTML = `<div class="bh-t">🩸 Vasilhame do Sacrifício</div><div class="bh-bar"><i style="width:${(k * 100).toFixed(1)}%"></i><span>${have} / ${need} L</span></div><div class="bh-s">${full ? (f < 4 ? 'A taça transbordou — a escada em espiral está aberta' : 'A taça transbordou — a Porta do Bispo aceita os selos') : 'cada morto deste andar derrama seu sangue na taça'} · total ${Math.floor(bloodTotal())} / 666</div>`;
}
function pourBlood(e: { type: EnemyType; pos: THREE.Vector3; def: { name: string } }) {
  const f = inside?.crypt; if (!f || f > 4 || !cryptInt?.vessel) return;
  const L = (BLOOD_OF[e.type] ?? 3);
  const was = bloodFull(f); blood[f - 1] = Math.min(BLOOD_NEED[f - 1], blood[f - 1] + L); try { localStorage.setItem('karmika.crypt.blood', JSON.stringify(blood)); } catch { /* */ }
  // o sangue voa do corpo até a taça
  const vx = IX + cryptInt.vessel.x, vz = IZ + cryptInt.vessel.z;
  for (let i = 0; i < 26; i++) { const life = 0.9 + Math.random() * 0.5, x0 = e.pos.x + (Math.random() - 0.5) * 0.8, z0 = e.pos.z + (Math.random() - 0.5) * 0.8, y0 = 0.6 + Math.random();
    setTimeout(() => particles.spawn(x0, y0, z0, { vx: (vx - x0) / life, vy: (2.4 - y0) / life, vz: (vz - z0) / life, life, s0: 0.18, s1: 0.07, c0: 0xff2030, c1: 0x6a0008, a: 1 }), i * 18); }
  drawBloodHud();
  if (!was && bloodFull(f)) { audio.boom(); game.logMsg(f < 4 ? `🩸 O Vasilhame do Sacrifício transbordou: ${BLOOD_NEED[f - 1]} litros. A escada em espiral se abre para o andar ${f + 1}.` : '🩸 666 litros. O sangue escorre por baixo da Porta do Bispo — ela agora aceita os três selos.', '#ff6a6a'); }
}
/** enquanto a taça não enche, os mortos voltam a se erguer longe de você */
function updateBlood(dt: number, t: number) {
  const f = inside?.crypt; if (!cryptInt?.vessel || !f || f > 4) { if (bloodHud.style.display !== 'none') bloodHud.style.display = 'none'; return; }
  const done = localStorage.getItem('karmika.crypt.done') === '1';
  cryptInt.vessel.fill(done ? 1 : blood[f - 1] / BLOOD_NEED[f - 1], t);
  if (done || bloodFull(f)) return;
  raiseWait -= dt; raiseT -= dt; if (raiseT > 0 || raiseWait > 0) return; raiseT = 4.5;
  const alive = game.enemies.list.filter((e) => (e as typeof e & { tag?: string }).tag === 'crypt' && e.alive).length;
  const base = CRYPT_FLOORS[f - 1].types.reduce((a, [, n]) => a + n, 0);
  if (alive >= base * 0.45) return;
  const hp = heroPosNow(), pts = cryptInt.spawnPts.filter((q) => Math.hypot(IX + q.x - hp.x, IZ + q.z - hp.z) > 16); if (!pts.length) return;
  const lvl = 8 + f * 4, k = 1 + (f - 1) * 0.45;
  for (let i = 0; i < 2; i++) { const q = pts[Math.floor(Math.random() * pts.length)], x = IX + q.x + (Math.random() - 0.5) * 3, z = IZ + q.z + (Math.random() - 0.5) * 3; const ty = CRYPT_FLOORS[f - 1].types[Math.floor(Math.random() * CRYPT_FLOORS[f - 1].types.length)][0];
    game.enemies.spawn(ty, x, z, { tag: 'crypt', hpMul: k, dmgMul: k, lvl, aggro: 26, leash: 999, net: `c${f}r` });
    for (let j = 0; j < 20; j++) particles.spawn(x + (Math.random() - 0.5), 0.1, z + (Math.random() - 0.5), { vy: 1.5 + Math.random() * 2, life: 1, s0: 0.2, s1: 0.03, c0: 0x6a5a7a, c1: 0x1a1020, a: 0.8 }); }
}
let cryptInt: CathedralFloor | null = null, bishop: ReturnType<typeof game.enemies.spawn> | null = null, bishopPhase = 0, sermonT = 0;
function enterCrypt(floor: number, p: (typeof city.props)[number]) {
  feats.max('crypt', floor);
  withFade(() => {
    if (inside) scene.remove(inside.int.group);
    game.enemies.clearTag('crypt'); bishop = null; bishopPhase = 0; sermonT = 6;
    const int = buildCathedralFloor(floor, p.gx * 31 + p.gy); cryptInt = int;
    int.group.position.set(IX, 0, IZ); scene.add(int.group);
    inside = { int, ret: { x: p.gx + p.w / 2 + 0.8, y: p.gy + p.h + 0.8 }, prop: p, crypt: floor };
    objs.group.visible = false; sitting = null; for (const n of npcSys.npcs) n.hero.root.visible = false;
    state.fx = (IX + int.W / 2) / T; state.fy = (IZ + int.D - 1.2) / T; state.path = [];
    heroY = 0; camX = IX + int.W / 2; camZ = IZ + int.D / 2; camY = 0;
    const fl = CRYPT_FLOORS[floor - 1]; const lvl = 8 + floor * 4, k = 1 + (floor - 1) * 0.45;
    const pts = [...int.spawnPts]; let pi = 0; const at = () => { const q = pts.length ? pts[pi++ % pts.length] : { x: int.W / 2, z: int.D / 2 }; return { x: IX + q.x + (Math.random() - 0.5) * 3, z: IZ + q.z + (Math.random() - 0.5) * 3 }; };
    for (const [type, n] of fl.types) for (let i = 0; i < n; i++) { const q = at(); game.enemies.spawn(type, q.x, q.z, { tag: 'crypt', hpMul: k, dmgMul: k, lvl, aggro: 26, leash: 999, net: `c${floor}` }); } // dentro da Catedral os mortos caçam quem entra
    if (fl.elite) game.enemies.spawn(fl.elite.type, IX + int.elitePt.x, IZ + int.elitePt.z, { tag: 'crypt', name: fl.elite.name, hpMul: fl.elite.hpMul, dmgMul: fl.elite.dmgMul, scale: fl.elite.scale, lvl: lvl + 4, net: `c${floor}e` });
    raiseWait = 8; raiseT = 0; drawBloodHud();
    if (floor === 5) { bishop = game.enemies.spawn('bishop', IX + int.elitePt.x, IZ + int.elitePt.z, { tag: 'crypt', hpMul: 1, dmgMul: 1, lvl: 28, net: 'c5b' }); chat.sys('O Bispo Caído ergue o báculo: "Ajoelhe-se. Gorvak tem fome, e eu sou a boca."'); }
    game.logMsg(`⚰ ${fl.name}${floor < 4 ? ` — encha o Vasilhame do Sacrifício (${BLOOD_NEED[floor - 1]} L) para abrir a escada em espiral` : floor === 4 ? ' — encha a taça e traga os três selos para a Porta do Bispo' : ' — não há volta sem o fim'}`, '#c8b8ff');
  });
}

/* ---------- masmorras, cavernas e subsolos (masmorras.ts + dungeon3d.ts) ---------- */
const dgs = createMasmorras({ scene, T, city: city as never, heightAt, regionLvl: (x, y) => { const r = regionAt(x, y); return [r.lo, r.hi]; }, game: game as never, particles, audio: audio as never,
  heroPos: () => heroPosNow(), project: (p) => { const v = p.clone().project(camera); if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) return null; const r = canvas.getBoundingClientRect(); return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height }; }, partySize: () => netRef?.party ? netRef.party.members.length : 1, partyLvl: () => { const P = netRef?.party; if (!P) return game.st.lvl; const ls = P.members.map((id) => id === netRef!.myId ? game.st.lvl : netRef!.infoOf(id)?.lvl ?? game.st.lvl); return ls.reduce((a, b) => a + b, 0) / Math.max(1, ls.length); }, say: (t) => chat.sys(t), fine,
  onClear: (d, first) => { quests.onDungeon(d.id); feats.bump('dungeons'); if (first && d.kind === 'grupo') heroicAct(`${d.name} vencida pela primeira vez`); if (first && d.title && profile) { profile.title = d.title; localStorage.setItem('karmika.char.v1', JSON.stringify(profile)); updateWho(); game.logMsg(`🏅 Título: ${d.title}`, '#ffe08a'); } netRef?.x('x:dgwin', { id: d.id }); } });
function dgInst() { const p = netRef?.party; return p && p.members.length > 1 ? 'g' + Math.min(...p.members) : 's' + (netRef?.myId ?? 0); } // o grupo inteiro cai na mesma cópia
function enterDungeon(en: (typeof dgs.entrances)[number]) {
  withFade(() => {
    if (inside) scene.remove(inside.int.group);
    const int = dgs.build(en.d); int.group.position.set(IX, 0, IZ); scene.add(int.group);
    inside = { int, ret: { x: en.x, y: en.y + 2.4 }, prop: { kind: 'dungeon', gx: en.x, gy: en.y, w: 1, h: 1, height: 1, wall: 0, roof: 0 } as unknown as (typeof city.props)[number], dg: en.d.id };
    objs.group.visible = false; sitting = null; for (const n of npcSys.npcs) n.hero.root.visible = false;
    state.fx = (IX + int.W / 2) / T; state.fy = (IZ + int.D - 1.6) / T; state.path = []; heroY = 0; camX = IX + int.W / 2; camZ = IZ + int.D - 8; camY = 0;
    dgs.start(en, int as never, { x: IX, z: IZ }, dgInst()); feats.bump('dgenter');
    netRef?.x('x:dgin', { id: en.d.id, inst: dgInst() });
  }, `Descendo: ${en.d.name}…`);
}
/* os mausoléus das criptas são prédios: o herói não atravessa (fica livre só a frente, onde está a porta) */
for (const en of dgs.entrances) { if (en.d.theme !== 'cripta') continue; const big = en.d.kind === 'grupo' ? 1.35 : 1, cx = en.x, cy = en.y - 0.45, r = 0.95 * big;
  for (const [ox, oy] of [[-0.6 * big, -0.3 * big], [0.6 * big, -0.3 * big], [0, -0.7 * big]]) { const c = { x: cx + ox, y: cy + oy, r }; for (let ty = Math.floor(c.y - r - 0.3); ty <= Math.floor(c.y + r + 0.3); ty++) for (let tx = Math.floor(c.x - r - 0.3); tx <= Math.floor(c.x + r + 0.3); tx++) { const k = ty * 4096 + tx; const l = solids.get(k); if (l) l.push(c); else solids.set(k, [c]); } } }
(window as unknown as { __dg?: unknown }).__dg = { dgs, enterDungeon, city };
(window as unknown as { __cryptInt?: unknown }).__cryptInt = () => cryptInt;
(window as unknown as { __marks?: unknown }).__marks = () => CINE_MARKS;
(window as unknown as { __crypt?: unknown }).__crypt = (f: number) => { const p = city.props.find((q) => q.kind === 'church' && q.variant === 2); if (p) enterCrypt(f, p); };
/* Irmã Ysolde: espírito acorrentado na nave da Catedral — dá a missão interna e a encerra */
let spirit: { root: THREE.Object3D; x: number; z: number; where: string } | null = null;
/** onde a Irmã Ysolde deve estar agora: na porta da Catedral (lado de fora) ou logo na entrada da nave (andar 1) */
function spiritSpot(): { where: string; x: number; z: number; y: number; ry: number } | null {
  if (quests.q.done.includes('c01')) return null;
  if (inside) { if (inside.crypt !== 1) return null; const int = inside.int; return { where: 'nave', x: IX + int.W / 2 + 5.5, z: IZ + int.D - 6, y: 0.35, ry: Math.PI * 0.85 }; }
  const p = city.props.find((q) => q.kind === 'church' && q.variant === 2); if (!p) return null;
  const x = (p.gx + p.w / 2 + 0.8) * T + 3.6, z = (p.gy + p.h) * T + 5.2; if (Math.hypot(x - state.fx * T, z - state.fy * T) > 70) return null;
  return { where: 'porta', x, z, y: heightAt(x, z) + 0.35, ry: -0.5 };
}
function spawnSpirit(at: NonNullable<ReturnType<typeof spiritSpot>>) {
  const ch = createCharacter('nordic', { civil: 'human', cloth: 0x8ab0ff, hair: 0xe8e0ff, skin: 0xdcd8f0, hairStyle: 'long', static: true });
  ch.root.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; const mats = Array.isArray(m.material) ? m.material : [m.material]; for (const mt of mats) { const t = mt as THREE.MeshToonMaterial; t.transparent = true; t.opacity = 0.82; if (t.color) t.color.lerp(new THREE.Color(0xa8c4ff), 0.55); if (t.emissive) t.emissive.setHex(0x3a5ab0); } });
  ch.root.position.set(at.x, at.y, at.z); ch.root.rotation.y = at.ry; scene.add(fine(ch.root));
  const lamp = new THREE.PointLight(0x8ab0ff, 2.2, 12); lamp.position.set(0, 1.5, 0); ch.root.add(lamp);
  // correntes espectrais presas ao chão
  const cm = new THREE.MeshBasicMaterial({ color: 0x9ab8ff, transparent: true, opacity: 0.5, depthWrite: false });
  for (const s2 of [-1, 1]) for (let k = 0; k < 7; k++) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 4, 8), cm); l.position.set(s2 * (0.25 + k * 0.16), 0.9 - k * 0.15, 0.05); l.rotation.set(k % 2 ? Math.PI / 2 : 0, 0, 0.6 * s2); l.userData.xray = true; ch.root.add(l); }
  spirit = { root: ch.root, x: at.x, z: at.z, where: at.where };
}
function updateSpirit(dt: number, t: number) {
  const at = spiritSpot();
  if (spirit && (!at || at.where !== spirit.where)) { scene.remove(spirit.root); spirit = null; }
  if (!spirit && at) spawnSpirit(at);
  if (!spirit || !at) return;
  spirit.root.position.y = at.y + Math.sin(t * 1.3) * 0.12;
  if (Math.random() < dt * 8) particles.spawn(spirit.x + (Math.random() - 0.5) * 1.2, at.y - 0.15 + Math.random() * 1.8, spirit.z + (Math.random() - 0.5) * 1.2, { vy: 0.5, life: 1.4, s0: 0.12, s1: 0.02, c0: 0xffffff, c1: 0x6a8aff, a: 0.9 });
}
function talkSpirit() {
  const nm = 'Irmã Ysolde', ti = quests.turnins(nm), of = quests.offers(nm), choices: Choice[] = [];
  for (const d of ti) choices.push({ kind: 'turnin', label: `Entregar: ${d.name}`, hint: `${d.xp} XP · ${d.gold} 🪙`, quest: d });
  for (const d of of) choices.push({ kind: 'quest', label: d.name, hint: `Nv ${d.lvl}`, quest: d });
  choices.push({ kind: 'talk', label: 'Conversar', cb: () => dlg.setText(['As correntes não são de ferro. São de culpa — a minha e a dele.', 'Os selos estão nos carrascos que ele deixou nas criptas: o Carrasco, o Príncipe Ósseo, o Guardião.', 'Desça pela escada em espiral, no canto. Não olhe para o poço.'][Math.floor(Math.random() * 3)]) });
  choices.push({ kind: 'close', label: 'Até logo' });
  quests.onTalk(nm);
  let portrait: string | null = null; try { portrait = spirit ? portraitOf(nm, spirit.root) : null; } catch { portrait = null; }
  openDlg({ name: nm, role: 'Espírito aprisionado', portrait, text: ti.length ? 'Sinto as correntes afrouxarem… Acabou mesmo?' : of.length ? of[0].text : quests.q.active['c01'] ? 'Os mortos ainda andam. Os selos ainda dormem com seus carrascos. Vá.' : 'Obrigada. Agora posso descer de vez.', choices,
    onAccept: (d) => { quests.accept(d); game.logMsg('Irmã Ysolde: “Que a luz que ele apagou volte com você.”', '#b8c8ff'); },
    onTurnIn: (d) => { quests.turnIn(d); game.logMsg('Irmã Ysolde: “As correntes se partiram. Vá com o Olho.”', '#b8c8ff'); if (spirit) { for (let i = 0; i < 80; i++) particles.spawn(spirit.x, 0.5 + Math.random() * 2, spirit.z, { vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 3, vz: (Math.random() - 0.5) * 2, life: 2, s0: 0.2, s1: 0.02, c0: 0xffffff, c1: 0x8ab0ff, a: 1 }); scene.remove(spirit.root); spirit = null; } heroicAct('Irmã Ysolde libertada'); },
    objProg: (d, i) => quests.objProg(d, i), objNeed: (d, i) => quests.objNeed(d, i) });
}
const SEALS = ['seal_1', 'seal_2', 'seal_3'];
/** o Bispo em combate: sermões (anel de trevas que empurra e fere quem não desvia), invoca zumbis a 66% e 33%, enfurece a 20% */
function updateBishop(dt: number) {
  if (!bishop || !inside || inside.crypt !== 5) return;
  const b = bishop; if (!b.alive) { if (bishopPhase < 9) { bishopPhase = 9; game.enemies.clearTag('crypt-add'); } return; }
  const hpK = b.hp / b.hpMax;
  if (hpK < 0.66 && bishopPhase < 1) { bishopPhase = 1; chat.sys('O Bispo: "Levantai-vos, rebanho!" — zumbis saem das criptas.'); for (let i = 0; i < 4; i++) game.enemies.spawn('zombie', b.pos.x + (Math.random() - 0.5) * 8, b.pos.z + 3 + Math.random() * 5, { tag: 'crypt', hpMul: 1.2, dmgMul: 1.2, lvl: 20 }); }
  if (hpK < 0.33 && bishopPhase < 2) { bishopPhase = 2; chat.sys('O Bispo: "Gorvak, aceita este banquete!" — carniçais e um Príncipe respondem.'); for (let i = 0; i < 3; i++) game.enemies.spawn('ghoul', b.pos.x + (Math.random() - 0.5) * 8, b.pos.z + 3 + Math.random() * 5, { tag: 'crypt', hpMul: 1.3, dmgMul: 1.2, lvl: 22 }); game.enemies.spawn('prince', b.pos.x, b.pos.z + 6, { tag: 'crypt', name: 'Acólito Ósseo', hpMul: 1.2, dmgMul: 1.1, scale: 1.0, lvl: 24 }); }
  if (hpK < 0.2 && bishopPhase < 3) { bishopPhase = 3; b.def.dmg = Math.round(b.def.dmg * 1.5); b.def.speed *= 1.25; chat.sys('O Bispo sangra fumaça negra e se enfurece.'); }
  sermonT -= dt;
  if (sermonT <= 0) { sermonT = 7 - bishopPhase; const cx = b.pos.x, cz = b.pos.z; chat.sys('O Bispo entoa um Sermão das Trevas — saia do círculo!'); let t = 0; const R = 6.5;
    const ring = new THREE.Mesh(new THREE.RingGeometry(R - 0.3, R, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xb3202f, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); ring.position.set(cx, 0.08, cz); scene.add(fine(ring));
    const tick = () => { t += 1 / 60; ring.scale.setScalar(0.2 + t / 1.6 * 0.8); (ring.material as THREE.MeshBasicMaterial).opacity = 0.9 - t * 0.4; for (let i = 0; i < 4; i++) particles.spawn(cx + (Math.random() - 0.5) * 2 * R * ring.scale.x, 0.2, cz + (Math.random() - 0.5) * 2 * R * ring.scale.x, { vy: 1 + Math.random(), life: 0.6, s0: 0.3, s1: 0.05, c0: 0xff3a4a, c1: 0x3a0a10, a: 0.9 }); if (t < 1.6) requestAnimationFrame(tick); else { scene.remove(ring); const d = Math.hypot(state.fx * T - cx, state.fy * T - cz); if (d < R && !(hero.actName === 'dash')) { game.damage(Math.round(26 + bishopPhase * 8), hero.root.position); game.logMsg('✝ O Sermão das Trevas queima a sua alma.', '#ff9a8a'); } } };
    tick(); audio.spell('shock'); }
}
let exiting = false;
function exitHouse() {
  if (!inside || exiting) return; const ins = inside;
  if (ins.crypt && ins.crypt > 1) { enterCrypt(ins.crypt - 1, ins.prop); return; }
  if (ins.crypt) { game.enemies.clearTag('crypt'); cryptInt = null; bishop = null; if (spirit) { scene.remove(spirit.root); spirit = null; } }
  if (ins.dg) dgs.stop();
  exiting = true;
  withFade(() => { scene.remove(ins.int.group); inside = null; objs.group.visible = true; for (const n of npcSys.npcs) n.hero.root.visible = true; state.fx = ins.ret.x; state.fy = ins.ret.y; state.path = []; objs.update(state.fx * T, state.fy * T, true); heroY = heightAt(state.fx * T, state.fy * T); camX = state.fx * T; camZ = state.fy * T; camY = heroY; exiting = false; });
}
let sitting: { x: number; y: number; yaw: number } | null = null;
const hintEl = document.getElementById('act') as HTMLElement;
type Inter = { d: number; label: string; act: () => void };


/* ---------- letreiro rúnico do alto: lugar, clima, hora/turno, nível da região, elite próxima, cidade ---------- */
const bannerEl = document.createElement('div'); bannerEl.id = 'banner'; document.body.appendChild(bannerEl);
let bannerT = 0, qmT = 0;
/** marcadores de missão sobre os NPCs: ? = tem missão, ! = missão pronta para entregar; amarelo história, verde recorrente (quadro), azul extra */
function updateQuestMarks() {
  for (const n of npcSys.npcs) { if (!n.hero.root.visible) continue; const nm = n.def.name; let ti: ReturnType<typeof quests.turnins> = [], of: ReturnType<typeof quests.offers> = []; try { ti = quests.turnins(nm); of = quests.offers(nm); } catch (err) { console.warn('marca de missão', nm, err); } /* um NPC com problema não apaga as marcas dos outros */
    const d = ti[0] ?? of[0]; const cat = d ? ({ story: 'story', side: 'side', rep: 'board' } as const)[questCat(d)] : nm === 'Garrick' ? 'board' : null;
    const qm = n.el.querySelector('.qm') as HTMLElement | null; if (!qm) continue;
    if (!cat) { delete n.el.dataset.qm; continue; }
    n.el.dataset.qm = (ti.length ? 'done' : 'offer') + '-' + cat; qm.textContent = ti.length ? '!' : '?'; }
}
function regionInfo() {
  const h0 = hereT(); let elite: { name: string; d: number; alive: boolean } | null = null; const rg = regionAt(h0.x, h0.y);
  for (const sp of city.spawns) { const d = Math.hypot(sp.x - h0.x, sp.y - h0.y); const def = DEFS[sp.type]; if (!def) continue; if ((sp.type === 'prince' || sp.type === 'tormentor' || sp.type === 'treant') && d < 110 && regionAt(sp.x, sp.y) === rg && (!elite || d < elite.d)) elite = { name: def.name, d: d * T, alive: game.enemies.list.some((e) => e.type === sp.type && e.alive && Math.hypot(e.home.x / T - sp.x, e.home.y / T - sp.y) < sp.r + 1) }; }
  return { lvl: rg.lo, lo: rg.lo, hi: rg.hi, region: rg.name, elite };
}
function temperature() {
  const h0 = hereT(), z = zoneW(Math.floor(h0.x), Math.floor(h0.y)), hr = gameHour();
  const base = -6 * z.snow + 19 * z.meadow + 15 * z.forest + 23 * z.swamp + 12 * z.rock + 16 * z.ruins + 34 * z.volcanic + 14 * z.enchanted + 11 * z.blight + 27 * z.jungle + 22 * z.coast;
  const dayK = Math.cos((hr - 14) / 24 * 6.283) * 5; // mais quente às 14h, mais frio às 2h
  return Math.round(base + dayK + Math.sin(Date.now() / 600000) * 1.5);
}
function turnIndex(h = gameHour()) { const i = TURNS.findIndex(([h0]) => h >= h0 && h < h0 + 4); return i < 0 ? 6 : i + 1; }
function dayIndex() { return Math.floor((Date.now() - 1792000000000) / DAY_REAL_MS) + 1; }
/** quanto a maldição da Catedral pesa aqui (0 longe → 1 no campo santo); some quando a Catedral é purificada */
function curseK() { if (localStorage.getItem('karmika.crypt.done') === '1') return 0; const d = Math.hypot(hereT().x - (CATHEDRAL.x + 6), hereT().y - (CATHEDRAL.y + 20)); return THREE.MathUtils.clamp((105 - d) / 45, 0, 1); }
let curseNow = 0;
function karmaMood(ri: { lvl: number; elite: { alive: boolean } | null }, night: number) {
  if (curseK() > 0.3) return ['Maldita', '#ff7a6a'];
  if (ri.elite?.alive && ri.lvl > game.st.lvl) return ['Sombria', '#ff9a8a'];
  if (ri.lvl > game.st.lvl + 3) return ['Inquieta', '#ffd24a'];
  if (night > 0.6) return ['Vigília', '#b9c6e0'];
  return ['Serena', '#8fd08a'];
}
function updateBanner() {
  if (bannerEl.matches(':hover') && bannerEl.innerHTML) return; // não reconstrói enquanto o mouse está no menu
  const h0 = hereT(), hr = gameHour(), hh = Math.floor(hr), mm = Math.floor((hr - hh) * 60), temp = temperature();
  const st = city.settlements.find((q) => Math.hypot(h0.x - q.x, h0.y - q.y) < q.radius + 6) ?? (Math.hypot(h0.x - CITY.x, h0.y - CITY.y) < 28 ? city.settlements[0] : undefined);
  const ri = regionInfo(), [mood, moodC] = karmaMood(ri, state.night);
  const nearHome = st && st.name === home.name;
  const shops = st ? npcSys.npcs.filter((q) => (SHOP_BY_NAME.has(q.def.name) || SHOP_OF[q.def.name]) && Math.hypot(q.pos.x / T - st.x, q.pos.z / T - st.y) < st.radius + 8) : [];
  const places = st ? city.pois.filter((p) => Math.hypot(p.x - st.x, p.y - st.y) < st.radius + 8 && p.name !== st.name) : [];
  const tav = st ? city.props.find((p) => p.kind === 'house' && p.variant === 4 && Math.hypot(p.gx - st.x, p.gy - st.y) < st.radius + 8) : null;
  const eliteSp = ri.elite ? city.spawns.find((sp) => DEFS[sp.type]?.name === ri.elite!.name && Math.hypot(sp.x - h0.x, sp.y - h0.y) * T < ri.elite!.d + 1) : null;
  const parts = [
    `<b class="pl">${zoneName()}</b>`,
    `<span title="Temperatura">${temp < 2 ? '❄' : temp > 24 ? '☀' : '🌤'} ${temp}°C</span>`,
    `<span title="Dia e turno de Karmika (6 turnos de 4 h; 1 turno = 30 min reais)">Dia ${dayIndex()} · Turno ${turnIndex()}/6 ${turnName()} · ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}</span>`,
    `<span title="Situação kármica da região" style="color:${moodC}">◈ ${mood}</span>`,
    `<span title="${ri.region}: os bichos daqui vão do nível ${ri.lo} ao ${ri.hi}" class="${ri.lo > game.st.lvl + 3 ? 'danger' : ''}">⚔ ${ri.region} · Nv ${ri.lo}–${ri.hi}${ri.lo > game.st.lvl + 3 ? ' · perigo' : ''}</span>`,
    ri.elite ? `<a class="elite" data-pin="elite" title="Clique para ir até a elite"><i class="${ri.elite.alive ? 'on' : ''}"></i>${ri.elite.name} · ${fmtDist(ri.elite.d)}${ri.elite.alive ? '' : ' (caído)'}</a>` : '',
    st ? `<span class="dd" title="Assentamento">${st.kind === 'city' ? '🏰 Cidade' : '🏘 Vila'}${nearHome ? ' · ⛲ lar' : ''}<div class="menu">${shops.map((q) => `<a data-pin="npc:${q.def.name}">🪙 ${q.def.name} <small>${q.def.role}</small></a>`).join('')}${tav ? `<a data-pin="tav">🍺 Taverna</a>` : ''}${places.map((p) => `<a data-pin="poi:${p.name}">📍 ${p.name}</a>`).join('')}${!shops.length && !tav && !places.length ? '<a>nada por aqui</a>' : ''}</div></span>` : '',
  ].filter(Boolean);
  const loc = pinT ? `<div class="loc"><span>🔍 Indo para <b>${pinT.label}</b> · ${fmtDist(Math.hypot(pinT.x - state.fx, pinT.y - state.fy) * T)}</span><a data-pin="clear" title="Parar de guiar">✕</a></div>` : quests.tracked && guideT ? `<div class="loc"><span>🔍 Missão: <b>${guideT.label}</b> · ${fmtDist(Math.hypot(guideT.x - state.fx, guideT.y - state.fy) * T)}</span></div>` : '';
  bannerEl.innerHTML = `<div class="bn">${parts.join('<em>◆</em>')}</div>${loc}`;
  bannerEl.dataset.eliteName = ri.elite?.name ?? ''; bannerEl.dataset.eliteX = eliteSp ? String(eliteSp.x) : ''; bannerEl.dataset.eliteY = eliteSp ? String(eliteSp.y) : ''; bannerEl.dataset.tavX = tav ? String(tav.gx + tav.w / 2) : ''; bannerEl.dataset.tavY = tav ? String(tav.gy + tav.h + 1) : '';
}
bannerEl.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest('[data-pin]') as HTMLElement | null; if (!a) return; const k = a.dataset.pin!;
  if (k === 'clear') { setPin(null); return; }
  if (k === 'elite') { if (bannerEl.dataset.eliteX) setPin({ x: +bannerEl.dataset.eliteX, y: +bannerEl.dataset.eliteY!, label: bannerEl.dataset.eliteName || 'Elite' }); return; }
  if (k === 'tav') { if (bannerEl.dataset.tavX) setPin({ x: +bannerEl.dataset.tavX, y: +bannerEl.dataset.tavY!, label: 'Taverna' }); return; }
  if (k.startsWith('npc:')) { const n = npcSys.npcs.find((q) => q.def.name === k.slice(4)); if (n) setPin({ x: n.pos.x / T, y: n.pos.z / T, label: n.def.name }); return; }
  if (k.startsWith('poi:')) { const p = city.pois.find((q) => q.name === k.slice(4)); if (p) setPin({ x: p.x, y: p.y, label: p.name }); }
});
/* ---------- fonte-lar, morte e renascimento; Deusa dos Caminhos: Pergaminho do Regresso ---------- */
type Home = { x: number; y: number; name: string };
const HOME_KEY = 'karmika.home.v1';
const defaultHome = (): Home => { const o = profile?.origin ?? 'human'; if (o !== 'human') { const s0 = city.starts[o]; return { x: s0.x, y: s0.y, name: s0.name }; } const f = city.props.find((p) => p.kind === 'fountain' && !p.variant)!; return { x: f.gx + 1, y: f.gy + 3, name: 'Karmika' }; };
let home: Home = (() => { try { return JSON.parse(localStorage.getItem(HOME_KEY) || 'null') ?? defaultHome(); } catch { return defaultHome(); } })();
/* cada um acorda no seu berço (ou na fonte-lar que escolheu) */
if (profile) { state.fx = home.x; state.fy = home.y; objs.update(state.fx * T, state.fy * T, true); heroY = heightAt(state.fx * T, state.fy * T); camX = state.fx * T; camZ = state.fy * T; camY = heroY; }
const fountainName = (p: { gx: number; gy: number }) => city.settlements.find((st) => Math.hypot(st.x - p.gx, st.y - p.gy) < st.radius + 2)?.name ?? 'Karmika';
function setHome(p: { gx: number; gy: number; h: number }) { feats.bump('homes'); home = { x: p.gx + p.h / 2, y: p.gy + p.h + 1, name: fountainName(p) }; localStorage.setItem(HOME_KEY, JSON.stringify(home)); game.logMsg(`⛲ ${home.name} agora é seu lar: ao desencarnar, você renasce aqui.`, '#8ad0ff'); }
/** põe o herói num lugar sem tela de carregamento (a luz branca do Limiar cobre a troca) */
/** morreu ou foi levado lá dentro (masmorra, cripta, casa): sai do interior sem tela de carregamento */
function leaveInteriorNow() { if (!inside) return; const ins = inside; if (ins.dg) dgs.stop(); if (ins.crypt) { game.enemies.clearTag('crypt'); cryptInt = null; bishop = null; if (spirit) { scene.remove(spirit.root); spirit = null; } }
  scene.remove(ins.int.group); inside = null; objs.group.visible = true; for (const n of npcSys.npcs) n.hero.root.visible = true; }
function placeAt(why: string, to: { x: number; y: number } = home) { leaveInteriorNow(); state.fx = to.x; state.fy = to.y; state.path = []; objs.update(state.fx * T, state.fy * T, true); heroY = heightAt(state.fx * T, state.fy * T); camX = state.fx * T; camZ = state.fy * T; camY = heroY; game.logMsg(why, '#8ad0ff'); for (let i = 0; i < 40; i++) particles.spawn(state.fx * T, 0.5, state.fy * T, { vx: (Math.random() - 0.5) * 3, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 3, life: 1, s0: 0.3, s1: 0.05, c0: 0xfff0bd, c1: 0x8f7bff, a: 1 }); }
function goHome(why: string, to: { x: number; y: number } = home) { withFade(() => placeAt(why, to)); }
game.setOnDeath((revive) => { feats.bump('deaths'); soul.regen();
  const fall = (note?: string, left?: number) => { const after = () => { goHome(`⛲ Você renasce na fonte de ${home.name}.`); setTimeout(() => { revive(); if (note) game.logMsg(note, '#c9a0ff'); }, 400); };
    if (profile?.eye) playDeath(profile.name, home.name, after, { title: 'Você cai', sub: left === undefined ? `O Olho guarda o que viu, <b>${profile.name}</b>.` : left > 0 ? `O Fio da Vida perde um fôlego. Restam <b>${left}</b> de ${MAX_BREATHS}.` : 'Era o último fôlego. Se cair de novo, a alma desencarna.' }); else setTimeout(after, 2600); };
  /* Fio da Vida: antes do Olho abrir (nível 20) não se desgasta; com fôlego é só uma queda; sem fôlego a alma desencarna */
  if (!profile || game.st.lvl < FRAY_LVL || !profile.eye) { fall(); return; } /* o Fio só se gasta depois que o Olho abre (nível 20) */
  if (soul.s.breaths > 0) { soul.s.breaths--; soul.save(); const b = soul.s.breaths;
    fall(b > 0 ? `🕯 Fio da Vida: restam ${b} de ${MAX_BREATHS} fôlegos. Um volta a cada dia.` : '🕯 Fio da Vida: este era o último fôlego. Se cair de novo antes de um voltar, a alma desencarna.', b); return; }
  soul.s.pending = 'choose'; soul.save(); limiar.prepare(); audio.soulRise(0.3);
  /* a faísca sai do corpo, cresce, vibra e sobe como uma agulha até o céu; a tela esmaece e a alma chega ao centro do labirinto */
  setTimeout(() => soulSpark(scene, hero.root.position.clone(), { burst: (x, y, z, c0, c1) => particles.spawn(x, y, z, { vx: (Math.random() - 0.5) * 0.8, vy: Math.random() * 0.6, vz: (Math.random() - 0.5) * 0.8, life: 0.7, s0: 0.35, s1: 0.04, c0, c1, a: 1 }),
    rise: () => { /* o som já está correndo */ }, fade: (a) => { soulFade.style.opacity = String(a); }, done: () => { unbind(revive); setTimeout(() => { soulFade.style.opacity = '0'; }, 400); } }), 300);
});
const soulFade = document.createElement('div'); soulFade.id = 'soulfade'; document.body.appendChild(soulFade);
const originName = (o?: string) => o === 'dwarf' ? 'Anão' : o === 'elf' ? 'Elfo' : 'Humano';
/** o lugar sagrado da classe (onde a Lágrima devolve a alma): o mestre do caminho; sem classe, a fonte do lar */
function sacredPlace(): { x: number; y: number; name: string } {
  const p = PATHS.find((x) => x.cls === game.classInfo.name); if (!p) return { ...home, name: `na fonte de ${home.name}` };
  const prep = ({ gue: 'na', pal: 'na', tec: 'na', lob: 'na' } as Record<string, string>)[p.id] ?? 'no', name = `${prep} ${p.place}`;
  const n = npcSys.npcs.find((q) => q.def.name === (p.id === 'tec' ? 'Arquiteta Ylva' : p.mentor)); if (n) return { x: n.pos.x / T + 1.5, y: n.pos.z / T + 1.5, name };
  const v = city.settlements.find((st) => st.name === p.village); return v ? { x: v.x, y: v.y, name } : { ...home, name: `na fonte de ${home.name}` };
}
/** a alma desencarnou: a tela das três escolhas */
function limiarInfo(): LimiarInfo { const c = game.classInfo;
  return { name: profile!.name, race: originName(profile!.origin), cls: c.name, clsLvl: c.lvl, lvl: game.st.lvl, karma: state.karma, kills: game.st.kills ?? 0, quests: quests.q.done.length, debt: Math.round(game.xpNeed() * 2), tears: inv.count('lagrima'), place: sacredPlace().name, lives: soul.s.lives.map((l) => ({ race: originName(l.origin), cls: l.cls, clsLvl: l.clsLvl })) }; }
/** a alma desencarnou: sobe ao Limiar e conversa com Orvalen e Sael */
function unbind(revive: () => void = () => { /* já de pé */ }, resume?: 'reborn') {
  if (!profile) return; const c = game.classInfo, place = sacredPlace(), info = limiarInfo();
  limiar.open(info, (k) => {
    soul.s.breaths = MAX_BREATHS; soul.s.regenAt = Date.now(); soul.s.pending = null;
    if (k === 'corpo') { soul.s.debt += info.debt; soul.save(); revive(); placeAt(`⛲ A alma volta ao mesmo corpo, em ${home.name}. Dívida Kármica: ${soul.s.debt.toLocaleString('pt-BR')} XP.`); return; }
    if (k === 'lagrima') { inv.take('lagrima', 1); revive(); placeAt(`💧 A Lágrima paga a volta. A alma de ${profile!.name} reencontra o corpo ${place.name}.`, place); dispatchEvent(new CustomEvent('karmika:burst', { detail: { c0: 0xffffff, c1: 0x9ad7ff, n: 80 } })); return; }
    if (resume !== 'reborn') { const life: Life = { name: profile!.name, origin: profile!.origin, cls: c.name, clsLvl: c.lvl, lvl: game.st.lvl, karma: Math.round(state.karma), end: 'reencarne', at: Date.now() };
      soul.s.lives.push(life); soul.s.catchup = { cls: c.name, until: Math.max(c.lvl, soul.s.catchup?.cls === c.name ? soul.s.catchup.until : 0) }; }
    soul.s.pending = 'reborn'; soul.save(); revive(); showCreate(true);
  }, { stage: resume });
}
/** voltou ao jogo no meio de um desencarne (fechou a janela): a escolha continua esperando */
/* dev: foto de perto da cabeça (testes de encaixe de elmo/chapéu) */
function headShot(yaw: number, sz = 256, dy = 0, dist = 1.6): string {
  const head = skinModel?.getObjectByName('mixamorigHead') ?? (hero as unknown as { rig?: { head: THREE.Object3D } }).rig?.head; if (!head) return '';
  hero.root.updateMatrixWorld(true); const c = head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.12 + dy, 0));
  const ry = hero.root.rotation.y + yaw, cam = new THREE.PerspectiveCamera(24, 1, 0.05, 30); cam.position.set(c.x + Math.sin(ry) * dist, c.y + 0.12, c.z + Math.cos(ry) * dist); cam.lookAt(c); cam.layers.enableAll();
  const rt = new THREE.WebGLRenderTarget(sz, sz); renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, cam);
  const px = new Uint8Array(sz * sz * 4); renderer.readRenderTargetPixels(rt, 0, 0, sz, sz, px); renderer.setRenderTarget(null); rt.dispose();
  const cv = document.createElement('canvas'); cv.width = cv.height = sz; const g = cv.getContext('2d')!, im = g.createImageData(sz, sz);
  for (let y = 0; y < sz; y++) for (let x = 0; x < sz; x++) { const si = ((sz - 1 - y) * sz + x) * 4, di = (y * sz + x) * 4; for (let k = 0; k < 3; k++) im.data[di + k] = Math.min(255, Math.pow(px[si + k] / 255, 1 / 2.2) * 255 * 1.1); im.data[di + 3] = 255; }
  g.putImageData(im, 0, 0); return cv.toDataURL();
}
if (IS_DEV) (window as unknown as { __soul: unknown }).__soul = { dgs: () => dgs, caravans, eventos, senseGoals, headShot, planTo, navProbe, stepAt, offerVow, vowState: () => vow, quests, wall: () => ({ on: onWall, y: heroY }), hero: () => hero, applyArtSkin, skinKey: () => skinKey, setProfile: (p: Partial<Profile>) => { if (profile) Object.assign(profile, p); }, swapHero, soul, game, state, unbind, inv, tree, heroPos: () => hero.root.position, talkTo, npcs: () => npcSys.npcs, limiar, craftJob };
function resumeSoul() { if (!profile || limiar.active) return; if (soul.s.pending === 'choose') unbind(); else if (soul.s.pending === 'reborn') unbind(undefined, 'reborn'); }
/* os fôlegos ficam à vista, em cima do orbe da vida (só depois que o Olho abre: antes o Fio não se gasta) */
setInterval(() => { const el = document.getElementById('folegos'); if (!el) return; soul.regen(); const on = !!profile?.eye && game.st.lvl >= FRAY_LVL;
  const html = on ? Array.from({ length: MAX_BREATHS }, (_, i) => `<i class="${i < soul.s.breaths ? '' : 'off'}"></i>`).join('') : '';
  if (el.innerHTML !== html) el.innerHTML = html;
  el.title = on ? `Fio da Vida: ${soul.s.breaths}/${MAX_BREATHS} fôlegos${soul.s.breaths < MAX_BREATHS ? ` · o próximo volta em ${soul.nextBreathH()}h` : ''}. Sem fôlego, a alma desencarna e sobe ao Limiar.${inv.count('lagrima') ? ` · Lágrimas: ${inv.count('lagrima')}` : ''}` : ''; }, 1000);
game.setXpFilter((n, c) => { const r = soul.filter(n, c);
  if (r.paid && r.debtLeft === 0) game.logMsg('⚖ A Dívida Kármica está paga. O XP volta inteiro para você.', '#ffe08a');
  if (r.echoDone) game.logMsg(`✦ O eco da vida passada se cala: você é de novo ${c.name} nível ${c.lvl}. Daqui em diante, o caminho normal.`, '#c9a0ff');
  return r; });
/* portal da Deusa dos Caminhos: um arco de luz violeta surge à frente; entrar nele leva ao lar */
let portal: { m: THREE.Group; x: number; z: number; t: number } | null = null;
function openPortal() {
  if (portal) { scene.remove(portal.m); portal = null; }
  const yaw = hero.root.rotation.y, px = state.fx * T + Math.sin(yaw) * 2.2, pz = state.fy * T + Math.cos(yaw) * 2.2, py = heightAt(px, pz);
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.09, 8, 32), new THREE.MeshBasicMaterial({ color: 0xb8a8ff })); ring.position.y = 1.3; g.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.02, 32), new THREE.MeshBasicMaterial({ color: 0x5a3aff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); disc.position.y = 1.3; g.add(disc);
  const lamp = new THREE.PointLight(0x8f7bff, 2.5, 9); lamp.position.y = 1.4; g.add(lamp);
  g.position.set(px, py, pz); g.rotation.y = yaw; scene.add(fine(g)); portal = { m: g, x: px, z: pz, t: 25 };
  hero.act('cast'); game.logMsg('📜 Um caminho se abre à sua frente. Entre nele para voltar ao lar.', '#b8a8ff');
}
function updatePortal(dt: number, t: number) {
  if (!portal) return; portal.t -= dt; portal.m.rotation.y += dt * 0.6; (portal.m.children[1] as THREE.Mesh).scale.setScalar(1 + Math.sin(t * 5) * 0.06);
  if (Math.random() < dt * 30) particles.spawn(portal.x + (Math.random() - 0.5) * 2, 0.3 + Math.random() * 2.2, portal.z + (Math.random() - 0.5) * 2, { vy: 0.6, life: 0.9, s0: 0.14, s1: 0.02, c0: 0xffffff, c1: 0x8f7bff, a: 1 });
  const d = Math.hypot(state.fx * T - portal.x, state.fy * T - portal.z);
  if (d < 1.1 || portal.t <= 0) { scene.remove(portal.m); const go = d < 1.1; portal = null; if (go) goHome(`✦ A Deusa dos Caminhos encurta a estrada: você sai na fonte de ${home.name}.`); else game.logMsg('O caminho se fecha.', '#8a7a5a'); }
}
/* ---------- relíquias dos caminhantes: viagem rápida entre as conhecidas ---------- */
const relicsKnown = new Set<string>(JSON.parse(localStorage.getItem('karmika.relics.v1') || '[]') as string[]);
/** no modo deus todas as relíquias respondem (viagem para qualquer uma) */
const knowsRelic = (n: string) => game.st.god || relicsKnown.has(n);
/* ---------- cinemáticas de paisagem e Fontes da Visão ---------- */
const CINE = scenes(T, CATHEDRAL, ASKAVIK, CITY, (nm) => { const p = city.pois.find((q) => q.name === nm); if (!p) return null; for (let r = 3; r < 9; r++) for (let a = 0; a < 8; a++) { const x = Math.round(p.x + Math.cos(a * 0.785) * r), y = Math.round(p.y + Math.sin(a * 0.785) * r); if (city.map[y]?.[x] === 'grass' || city.map[y]?.[x] === 'road') return { x: x - 4, y: y - 4 }; } return { x: p.x - 4, y: p.y - 4 }; });
if (localStorage.getItem('karmika.crypt.done') !== '1') waterU.uFoul.value.set((CATHEDRAL.x + 6) * T, (CATHEDRAL.y + 10) * T, 115 * T);
const vistaSeen = new Set<string>((() => { try { return JSON.parse(localStorage.getItem('karmika.vistas') || '[]') as string[]; } catch { return []; } })());
const cineSeen = new Set<string>((() => { try { return JSON.parse(localStorage.getItem('karmika.cine') || '[]') as string[]; } catch { return []; } })());
let cineTick = 0;
let cine: { sc: Scene; t: number; ov: { close(): void; allowSkip(): void }; skipOk?: boolean; z0: number; az0: number; x0: number; z0w: number; done?: () => void } | null = null;
function playScene(sc: Scene, done?: () => void) {
  if (cine) return; keys.clear(); state.path = []; if (combatMode) setCombat(false);
  for (const id of ['inv', 'char', 'shop', 'qlog', 'skillsw', 'featsw']) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
  document.body.classList.add('cinema'); objs.setRad(5); objs.update(camX, camZ, true);
  cine = { sc, t: 0, ov: playOverlay(sc, () => endScene()), z0: zoomTarget, az0: az, x0: camX, z0w: camZ, done };
  audio.hymn(sc.sec, sc.mood);
}
/** toda cena passa por uma tela de carregamento: o cenário de todos os planos é montado com a tela preta, e só então o filme começa (nada de travar no meio do jogo) */
function startScene(sc: Scene, done?: () => void) {
  if (cine || fading) return; keys.clear(); state.path = [];
  withFade(() => { objs.setRad(5); for (const sh of sc.shots) objs.update(sh.x, sh.z, true); objs.update(camX, camZ, true); }, `Preparando a cena — ${sc.title}`, () => playScene(sc, done));
}
function endScene() { if (!cine) return; const c = cine; cine = null; c.ov.close(); document.body.classList.remove('cinema'); objs.setRad(2); zoomTarget = c.z0; azT = c.az0; c.done?.(); }
function updateCine(rdt: number) {
  if (!cine) return false; cine.t += rdt; const sc = cine.sc, sh = sc.shots, u = Math.min(1, cine.t / sc.sec);
  const f = u * (sh.length - 1), i = Math.min(sh.length - 2, Math.floor(f)), k = f - i, e = k * k * (3 - 2 * k), a = sh[i], b = sh[i + 1];
  // entra e sai suavemente da posição do jogador
  const inK = Math.min(1, cine.t / 2.2), outK = Math.min(1, (sc.sec - cine.t) / 2.2), w = Math.min(inK, outK), ww = w * w * (3 - 2 * w);
  const tx = THREE.MathUtils.lerp(a.x, b.x, e), tz = THREE.MathUtils.lerp(a.z, b.z, e), tzm = THREE.MathUtils.lerp(a.zoom, b.zoom, e), taz = THREE.MathUtils.lerp(a.az, b.az, e);
  const hx = state.fx * T, hz = state.fy * T;
  camX = THREE.MathUtils.lerp(hx, tx, ww); camZ = THREE.MathUtils.lerp(hz, tz, ww); zoom = zoomTarget = THREE.MathUtils.lerp(cine.z0, tzm, ww); az = azT = THREE.MathUtils.lerp(cine.az0, taz, ww);
  { /* o texto da cena ocupa a direita da tela: o assunto da cena tem que ficar no meio do espaço livre à esquerda.
       Mede onde ele aparece na tela e corrige a câmera aos poucos (sem depender do ângulo). */
    const rv = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0); rv.y = 0; if (rv.lengthSq() > 1e-6) rv.normalize();
    const c2 = cine as typeof cine & { off?: number; offY?: number };
    // toda cinemática centraliza o que importa: o 'focus' da cena, ou (sem ele) o ponto que o plano atual está mirando
    const fp = sc.focus ? new THREE.Vector3(sc.focus.x * T, heightAt(sc.focus.x * T, sc.focus.y * T) + sc.focus.h, sc.focus.y * T) : new THREE.Vector3(tx, heightAt(tx, tz) + Math.min(8, tzm * 0.08), tz);
    fp.project(camera);
    if (Math.abs(fp.x) < 3 && Math.abs(fp.y) < 3) { const g = Math.min(1, rdt * 2.5); c2.off = (c2.off ?? 0) + (fp.x - -0.22) * tzm * 0.5 * g; c2.offY = (c2.offY ?? 0) + (fp.y - 0.02) * tzm * 0.25 * g; }
    const o = (c2.off ?? 0) * ww; camX += rv.x * o; camZ += rv.z * o; }
  camY = heightAt(camX, camZ) + (tzm * 0.16 + ((cine as { offY?: number }).offY ?? 0)) * ww; objs.update(camX, camZ); // olha um pouco acima do chão: o prédio aparece inteiro, no meio da tela
  if (!cine.skipOk && cine.t >= sc.sec * 0.9) { cine.skipOk = true; cine.ov.allowSkip(); } // a história inteira já passou na tela
  if (cine.t >= sc.sec) endScene();
  return true;
}
// Fontes da Visão: bacia de pedra com o Olho de cristal flutuando
const vistaObjs: { v: (typeof CINE.vistas)[number]; eye: THREE.Mesh; ring: THREE.Mesh; x: number; z: number; y: number }[] = [];
for (const v of CINE.vistas) {
  const g = new THREE.Group(), x = (v.at.x + 0.5) * T, z = (v.at.y + 0.5) * T, y = heightAt(x, z);
  const st = new THREE.MeshToonMaterial({ color: 0x8a8680 }), sd = new THREE.MeshToonMaterial({ color: 0x5a5650 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.35, 10), sd); base.position.y = 0.17; g.add(base);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 0.9, 8), st); col.position.y = 0.8; g.add(col);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.4, 0.35, 12), st); bowl.position.y = 1.4; g.add(bowl);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.66, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x6fd0ff, transparent: true, opacity: 0.85 })); water.position.y = 1.58; g.add(water);
  const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), new THREE.MeshBasicMaterial({ color: 0xffe08a })); eye.scale.set(1.5, 0.8, 1.5); eye.position.y = 2.3; g.add(eye);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.6, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); ring.position.y = 0.06; g.add(ring);
  g.position.set(x, y, z); scene.add(fine(g)); vistaObjs.push({ v, eye, ring, x, z, y });
}
/* luz na porta: todo lugar onde dá para entrar tem um brilho quente no batente e no chão, chamando para dentro (pool perto do herói) */
const doorTex = (() => { const c = document.createElement('canvas'); c.width = 32; c.height = 64; const g = c.getContext('2d')!; const gr = g.createLinearGradient(0, 64, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.6, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 64); const gx = g.createLinearGradient(0, 0, 32, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.25, 'rgba(0,0,0,0)'); gx.addColorStop(0.75, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 32, 64); return new THREE.CanvasTexture(c); })();
const floorTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; const gr = g.createRadialGradient(32, 0, 0, 32, 0, 60); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
/** onde fica a porta de cada templo em relação à borda da frente do terreno (m): a catedral e o templo de pórtico têm escadaria */
function doorZOff(p: { kind: string; variant?: number }) { const v = p.variant ?? 0; if (p.kind === 'church' && v === 2) return 2.3; if (p.kind === 'temple' && v === 20) return 2.1; if (p.kind === 'temple' && v === 13) return -6; if (p.kind === 'temple' && v >= 10) return -0.2; return 0.02; }
/** a porta de uma casa/templo no mundo (m): já com o giro da peça (rot); ry = para onde a porta olha; out = um passo para fora */
function doorOf(p: (typeof city.props)[number]) { const holy = p.kind !== 'house', cat = p.kind === 'church' && p.variant === 2, ld = localDims(p);
  const hd = holy ? null : houseDoor(p.variant ?? 0, ld.W, ld.D), lx = hd ? hd.x : ld.W / 2 + 0.8 * T, lz = hd ? hd.z + 0.02 : ld.D + doorZOff(p);
  const w = rotLocal(p, lx, lz), o = rotLocal(p, lx, lz + 1.6); return { x: w.x, z: w.z, ry: w.ry, out: { x: o.x, z: o.z }, w: cat ? 3.2 : hd ? hd.w * 0.95 : 2.2, h: cat ? 6.3 : hd ? hd.h : 4, yo: hd?.y ?? 0, col: cat ? 0xb08aff : holy ? 0xffe0a0 : 0xffc070, p }; }
const DOORS = city.props.filter((p) => p.kind === 'house' || p.kind === 'temple' || p.kind === 'church').map((p) => doorOf(p));
const DOOR_OF = new Map(DOORS.map((d) => [d.p, d]));
const doorPool = Array.from({ length: 10 }, () => { const g = new THREE.Group(); const shaft = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: doorTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); shaft.position.y = 0.5; g.add(shaft);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: floorTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); fl.position.set(0, 0.05, 0.5); g.add(fl); g.visible = false; scene.add(fine(g)); return { g, shaft, fl, d: null as (typeof DOORS)[number] | null }; });
let doorT = 0;
function updateDoors(dt: number) {
  if (inside || cine) { for (const s of doorPool) s.g.visible = false; return; }
  doorT -= dt; const hx = state.fx * T, hz = state.fy * T;
  if (doorT <= 0) { doorT = 0.5; const near = DOORS.map((d) => ({ d, k: Math.hypot(d.x - hx, d.z - hz) })).filter((o) => o.k < 45).sort((a, b) => a.k - b.k).slice(0, doorPool.length);
    doorPool.forEach((s, i) => { const d = near[i]?.d ?? null; s.d = d; s.g.visible = !!d; if (!d) return; const y = heightAt(d.out.x, d.out.z);
      s.g.position.set(d.x + Math.sin(d.ry) * 0.18, Math.max(y, 0) + d.yo, d.z + Math.cos(d.ry) * 0.18); s.g.rotation.y = d.ry; /* a luz fica À FRENTE da porta e do batente (+0,14): a 3 cm ela ficava metade dentro da porta e piscava */ s.shaft.scale.set(d.w, d.h, 1); s.shaft.position.y = d.h / 2; s.fl.scale.set(Math.min(4, d.w * 2.2), Math.min(3, d.w * 1.6), 1); s.fl.position.z = Math.min(1.5, d.w * 0.8);
      (s.shaft.material as THREE.MeshBasicMaterial).color.setHex(d.col); (s.fl.material as THREE.MeshBasicMaterial).color.setHex(d.col); s.shaft.visible = d.p.kind === 'house'; /* igreja: o portal de pedra já é a moldura; a luz fica só no chão */ }); }
  const pulse = 0.75 + 0.25 * Math.sin(performance.now() / 700), nk = 0.35 + 0.65 * state.night;
  for (const s of doorPool) if (s.d) { const lock = s.d.p.kind === 'church' && s.d.p.variant === 2 && state.night < 0.5; const k = (lock ? 0.15 : 1) * pulse * nk;
    (s.shaft.material as THREE.MeshBasicMaterial).opacity = 0.55 * k; (s.fl.material as THREE.MeshBasicMaterial).opacity = 0.45 * k; }
}
function useVista(v: (typeof CINE.vistas)[number]) {
  if (game.st.gold < 1) { game.logMsg('A Fonte da Visão pede uma moeda.', '#ff9a8a'); return; }
  game.st.gold -= 1; audio.coins(1); game.logMsg(`🪙 Você joga uma moeda na ${v.title.split(' — ')[0]}...`, '#ffe08a');
  const first = !vistaSeen.has(v.id);
  startScene(v, () => { if (first) { vistaSeen.add(v.id); try { localStorage.setItem('karmika.vistas', JSON.stringify([...vistaSeen])); } catch { /* */ } game.gainXp(Math.round(game.xpNeed() * 0.12)); game.logMsg(`👁 Visão descoberta: ${v.title.split(' — ')[1]} (${vistaSeen.size}/${CINE.vistas.length})`, '#ffe08a'); } });
}
/* Marcas do Destino: uma cena obrigatória nunca dispara do nada. Um círculo de luz no chão marca onde a história começa;
   ao chegar perto o jogo avisa, e só quando o jogador pisa na marca vem o carregamento e depois o filme. */
// marcas em pontos abertos escolhidos à mão (no meio da Avenida dos Anjos, longe das estátuas e árvores)
const CINE_MARKS: { id: string; x: number; y: number }[] = [{ id: 'cat_arrival', x: CATHEDRAL.x + 4.5, y: CATHEDRAL.y + 27.5 }];
const markTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!; g.translate(128, 128); g.strokeStyle = '#ffe2a0'; g.fillStyle = '#ffe2a0'; g.lineWidth = 6;
  g.beginPath(); g.arc(0, 0, 116, 0, 6.283); g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 98, 0, 6.283); g.stroke();
  for (let k = 0; k < 12; k++) { g.save(); g.rotate(k / 12 * 6.283); g.fillRect(-3, -112, 6, 12); g.restore(); }
  g.lineWidth = 5; g.beginPath(); g.ellipse(0, 0, 58, 30, 0, 0, 6.283); g.stroke(); g.beginPath(); g.arc(0, 0, 14, 0, 6.283); g.fill(); // o Olho
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const marks = CINE_MARKS.filter((m) => !cineSeen.has(m.id)).map((m) => {
  const grp = new THREE.Group(), x = m.x * T, z = m.y * T; let gy = -1e9; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) gy = Math.max(gy, heightAt(x + i * 1.2, z + j * 1.2)); grp.position.set(x, gy + 0.22, z); scene.add(grp); // o chão de pedra ondula: fica acima do ponto mais alto embaixo do círculo
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: markTex, alphaTest: 0.35, color: 0xffd27a, toneMapped: false, fog: false })); disc.rotation.x = -Math.PI / 2; disc.renderOrder = 5; grp.add(disc);
  const beamG = new THREE.CylinderGeometry(1.3, 1.6, 9, 20, 1, true); beamG.translate(0, 4.5, 0);
  const beam = new THREE.Mesh(beamG, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uT: { value: 0 } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec2 vU; uniform float uT; void main(){ float a = pow(1.0 - vU.y, 2.2) * (0.55 + 0.25*sin(vU.x*37.7 + uT*2.0)); gl_FragColor = vec4(vec3(1.0,0.78,0.38)*a, a); }' }));
  grp.add(beam); const lamp = new THREE.PointLight(0xffc860, 3, 12); lamp.position.y = 1.5; grp.add(lamp);
  return { ...m, grp, disc, beam, warned: false, gone: false };
});
function updateMarks(dt: number, t: number) {
  for (const mk of marks) { if (mk.gone) continue; mk.grp.visible = !inside; mk.disc.rotation.z = t * 0.4; (mk.beam.material as THREE.ShaderMaterial).uniforms.uT.value = t; (mk.disc.material as THREE.MeshBasicMaterial).color.setScalar(0.8 + 0.35 * Math.sin(t * 2.4)).multiply(new THREE.Color(0xffd27a));
    if (Math.random() < dt * 10) particles.spawn(mk.grp.position.x + (Math.random() - 0.5) * 2.4, mk.grp.position.y + 0.1, mk.grp.position.z + (Math.random() - 0.5) * 2.4, { vy: 1.4 + Math.random() * 1.6, life: 1.6, s0: 0.14, s1: 0.02, c0: 0xfff0c0, c1: 0xffa040, a: 0.9 }); }
}
function checkCineTriggers() {
  if (cine || inside || fading) return;
  const hx = state.fx * T, hz = state.fy * T;
  for (const mk of marks) { if (mk.gone) continue; const d = Math.hypot(hx - mk.grp.position.x, hz - mk.grp.position.z), sc = CINE.list.find((q) => q.id === mk.id); if (!sc) continue;
    if (!mk.warned && d < 30) { mk.warned = true; game.logMsg(`✦ Uma Marca do Destino brilha à frente: “${sc.title}”. Pise no círculo de luz quando estiver pronto — a história vai começar e o mundo para enquanto ela é contada.`, '#ffd88a'); }
    if (d < 1.7) { mk.gone = true; scene.remove(mk.grp); cineSeen.add(sc.id); try { localStorage.setItem('karmika.cine', JSON.stringify([...cineSeen])); } catch { /* */ } startScene(sc); } }
}
const relicEl = document.createElement('div'); relicEl.id = 'relics'; document.body.appendChild(relicEl); let relicOpen = false;
function touchRelic(name: string) {
  if (knowsRelic(name)) { openRelics(name); return; }
  relicsKnown.add(name); localStorage.setItem('karmika.relics.v1', JSON.stringify([...relicsKnown]));
  hero.act('cast'); if (profile?.eye) state.karma = Math.min(100, state.karma + 4); { const xp = Math.round(game.xpNeed() * 0.06); game.gainXp(xp); game.logMsg(`✦ Relíquia marcada: ${name} (+${xp} XP). Agora ela lembra de você.`, '#8ad0ff'); }
  for (let i = 0; i < 40; i++) particles.spawn(heroPos.x + (Math.random() - 0.5), 0.3, heroPos.z + (Math.random() - 0.5), { vy: 1.5 + Math.random() * 3, life: 1.2, s0: 0.5, s1: 0.05, c0: 0xbfe6ff, c1: 0x4a9aff, a: 1, drag: 1 });
  game.logMsg(`✦ ${name} lembra de você. (${relicsKnown.size} relíquia${relicsKnown.size > 1 ? 's' : ''} conhecida${relicsKnown.size > 1 ? 's' : ''})`, '#8ad0ff');
  if (relicsKnown.size === 1) game.logMsg('Encontre outra relíquia para viajar entre elas.', '#b9c6e0');
}
const relicNameAt = (gx: number, gy: number) => city.relics.find((r) => r.x === gx && r.y === gy)?.name ?? null;
function openRelics(from: string) {
  const others = city.relics.filter((r) => knowsRelic(r.name) && r.name !== from);
  relicOpen = true;
  relicEl.innerHTML = `<div class="pn relpn"><h2>✦ Relíquias dos Caminhantes <button data-x>✕</button></h2><small>Você está em <b>${from}</b>. ${others.length ? 'Clique numa relíquia dourada no mapa (ou na lista) para viajar.' : 'Nenhuma outra relíquia conhecida ainda — as cinzentas no mapa ainda não foram tocadas.'}</small><canvas class="rmap" width="360" height="360"></canvas><div class="rl">${others.map((r) => `<button data-go="${r.name}"><b>${r.name}</b><small>${fmtDist(Math.hypot(r.x - state.fx, r.y - state.fy) * T)}</small></button>`).join('')}</div><small class="ft">Esc fecha</small></div>`;
  relicEl.style.display = 'flex';
  const cv = relicEl.querySelector('canvas.rmap') as HTMLCanvasElement, g = cv.getContext('2d')!, k = 360 / MMS;
  const draw = () => {
    g.imageSmoothingEnabled = false; g.clearRect(0, 0, 360, 360); g.drawImage(mmBase, 0, 0, 360, 360);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, 360, 360);
    for (const r of city.relics) { const x = r.x * k, y = r.y * k, known = knowsRelic(r.name), here = r.name === from;
      g.beginPath(); g.arc(x, y, here ? 7 : 5, 0, 6.283); g.fillStyle = here ? '#fff0bd' : known ? '#ffd24a' : '#6a6a72'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#000'; g.stroke();
      if (known) { g.fillStyle = '#ffe9a0'; g.font = '600 9px Cinzel, serif'; g.textAlign = 'center'; g.fillText(r.name, x, y - 9); } }
    const h0 = hereT(); g.beginPath(); g.arc(h0.x * k, h0.y * k, 3, 0, 6.283); g.fillStyle = '#ff6a4a'; g.fill();
  };
  draw();
  cv.onclick = (e) => { const rc = cv.getBoundingClientRect(), mx = (e.clientX - rc.left) * (360 / rc.width), my = (e.clientY - rc.top) * (360 / rc.height); let best: typeof others[number] | null = null, bd = 14; for (const r of others) { const d = Math.hypot(r.x * k - mx, r.y * k - my); if (d < bd) { bd = d; best = r; } } if (best) travelRelic(best.name); else { const un = city.relics.find((r) => !knowsRelic(r.name) && Math.hypot(r.x * k - mx, r.y * k - my) < 10); if (un) game.logMsg('Relíquia ainda não tocada — vá até ela a pé para marcá-la.', '#b9c6e0'); } };
}
function travelRelic(go: string) { const r = city.relics.find((q) => q.name === go); if (!r) return; closeRelics();
  withFade(() => { state.fx = r.x + 0.5; state.fy = r.y + 2.2; state.path = []; objs.update(state.fx * T, state.fy * T, true); heroY = heightAt(state.fx * T, state.fy * T); camX = state.fx * T; camZ = state.fy * T; camY = heroY; game.logMsg(`✦ Você atravessa o véu até ${go}.`, '#8ad0ff'); for (let i = 0; i < 40; i++) particles.spawn(state.fx * T, 0.5, state.fy * T, { vx: (Math.random() - 0.5) * 3, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 3, life: 1, s0: 0.3, s1: 0.05, c0: 0xffffff, c1: 0x4a9aff, a: 1 }); });
}
function closeRelics() { relicOpen = false; relicEl.style.display = 'none'; }
relicEl.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-x]') || t === relicEl) { closeRelics(); return; } const go = (t.closest('[data-go]') as HTMLElement | null)?.dataset.go; if (go) travelRelic(go); });
function findInter(): Inter | null {
  const hx = state.fx * T, hz = state.fy * T; let best: Inter | null = null;
  const add = (d: number, max: number, label: string, act: () => void) => { if (d < max && (!best || d < best.d)) best = { d, label, act }; };
  { const ci = caravans.interact(hx, hz); if (ci) add(ci.d - 0.5, 4.5, ci.label, ci.act); }
  { const ei = eventos.interact(hx, hz); if (ei) add(ei.d - 0.6, 4.5, ei.label, ei.act); }
  { const si = secrets.interact(hx, hz, instinctOn, digCache); if (si) add(si.d - 0.4, 3, si.label, si.act); }
  for (const n of npcSys.npcs) {
    const nm = n.def.name, dN = Math.hypot(n.pos.x - hx, n.pos.z - hz);
    if (n.def.night && !n.hero.root.visible) { add(dN + 1, 4, `🌙 ${nm} só recebe à noite. Volte quando escurecer.`, () => game.logMsg(`🌙 Um criado de libré escura: “A senhora ${nm.split(' ').slice(-1)[0]} recebe depois do pôr do sol.”`, '#c98a9a')); continue; }
    const ti = quests.turnins(nm), of = quests.offers(nm);
    add(dN, 3.4, ti.length ? `E — Entregar: ${ti[0].name}` : of.length ? `E — Missão: ${of[0].name}` : `E — Falar com ${nm}`, () => talkTo(n));
  }
  if (!inside) {
    const gx = Math.floor(hx / T), gy = Math.floor(hz / T);
    for (const vo of vistaObjs) { const d = Math.hypot(vo.x - hx, vo.z - hz); if (d < 3.6) add(d - 1, 3.2, `E — Jogar uma moeda na Fonte da Visão${vistaSeen.has(vo.v.id) ? '' : ' ✦'}`, () => useVista(vo.v)); }
    for (const en of dgs.entrances) { const d = Math.hypot((en.x + 0.5) * T - hx, (en.y + 0.5) * T - hz); if (d < 5) add(d - 1.5, 3.6, `E — Entrar: ${en.d.name} (nível ${en.lvl[0]}–${en.lvl[1]} · ${en.d.players})`, () => enterDungeon(en)); }
    for (const rl of city.relics) { const d = Math.hypot((rl.x + 0.5) * T - hx, (rl.y + 0.5) * T - hz); if (d < 4.5) add(d - 2, 4, knowsRelic(rl.name) ? `E — Viajar (${rl.name})` : `E — Tocar ${rl.name}`, () => touchRelic(rl.name)); }
    for (const st of STATIONS) { const d = Math.hypot(st.x - hx, st.z - hz); if (d < 5) { const I = STATION_INFO[st.v]; add(d - 1.6, 3.2, `E — ${I.name} · ${PROF_NAME[I.prof] ?? I.prof}`, () => { keys.clear(); profs.openAt(I.prof as never); }); } }
    for (const p of nearProps(gx, gy, ['tree', 'rock', 'campfire', 'chest', 'herb'], 2)) {
      const px = (p.gx + 0.5) * T, pz = (p.gy + 0.5) * T, d = Math.hypot(px - hx, pz - hz);
      if (p.kind === 'chest') { if (!chestsOpen.has(p)) add(Math.hypot((p.gx + 0.5) * T - hx, (p.gy + 0.5) * T - hz), 3.0, 'E — Abrir baú', () => { chestsOpen.add(p); const cx = (p.gx + 0.5) * T, cz = (p.gy + 0.5) * T, cy = heightAt(cx, cz); hero.act('combo1'); for (let i = 0; i < 24; i++) particles.spawn(cx, cy + 0.8, cz, { vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3, vz: (Math.random() - 0.5) * 3, life: 0.9, s0: 0.5, s1: 0.05, c0: 0xffffff, c1: 0xffc040, a: 1, g: 6 }); if (welcomeKit(cx, cz, cy)) return; game.logMsg('Você abriu o baú!', '#ffe08a'); game.spawnGear(cx, cz, cy, Math.max(2, game.st.lvl + 2), { magic: 2, rare: 2.2, legendary: 2.5, relic: 3 }, 2, 'magic'); game.st.gold += 10 + Math.floor(Math.random() * 25); }); }
      else if (p.kind === 'tree') { const axe = inv.tool('axe'); add(d, 3.0, axe ? `E — Cortar árvore (${Math.round(100 * (chop.get(p) ?? 0) / CHOPS)}%) · ${axe.name}` : (twigs.get(p) ?? 0) < 2 ? 'E — Juntar galhos' : 'Precisa de um machado (espaço de ferramenta)', () => { if (axe) startWork('chop', p, px, pz); else gatherTwigs(p); }); }
      else if (p.kind === 'rock') { const R = rockState(p), pick = inv.tool('pick'), vein = veinOf(p), vn = vein === 2 ? ' · veio de prata' : vein === 1 ? ' · veio de ferro' : '';
        add(d - (p.w - 1) * 0.9, 2.6 + (p.w - 1) * 0.9, R.left <= 0 ? 'Pedra esgotada — volta com os turnos' : pick ? `E — Minerar (${Math.round(100 * (1 - R.left / R.max))}%)${vn} · ${pick.name}` : (pebbles.get(p) ?? 0) < 3 ? 'E — Juntar pedras soltas' : 'Precisa de uma picareta (espaço de ferramenta)', () => { if (pick) startWork('mine', p, px, pz); else gatherPebbles(p); }); }
      else if (p.kind === 'herb') { const H = HERBS[p.variant ?? 0], sh = inv.tool('shears'); if (!sh && H.tier === 0) add(d - 0.4, 2.4, `E — Colher ${H.name} com as mãos`, () => { hero.kneel = true; hero.act('cast'); setTimeout(() => { hero.kneel = false; }, 700); inv.add(H.id, 1, true); feats.bump('herbs', 1); profs.gain('herbalista', 2); objs.removeProp(p); (p as { gone?: boolean }).gone = true; picked.push({ gx: p.gx, gy: p.gy, at: Date.now() }); savePicked(); game.logMsg(`🌼 +1 ${H.name} (com alicate rende mais)`, '#9ad0a0'); }); else add(d - 0.4, 2.4, !sh ? `${H.name} — precisa de um alicate de ervas` : sh.tier < H.tier ? `🔒 ${H.name} — precisa de alicate ${'★'.repeat(H.tier)} (o seu é ${'★'.repeat(sh.tier)})` : `E — Colher ${H.name} · ${sh.name}`, () => { if (sh && sh.tier >= H.tier) startWork('herb', p, px, pz); else game.logMsg(!sh ? '✂ Sem um alicate você só arranca a raiz e mata a planta. Morwen, a Alquimista, vende alicates.' : `✂ ${H.name} murcha se cortada com metal ruim: precisa de alicate ${'★'.repeat(H.tier)}.`, '#ff9a8a'); }); }
      else if (p.kind === 'campfire' && (inv.has('meat') || inv.has('fish'))) add(d, 3.2, `E — Assar ${inv.has('meat') ? 'carne' : 'peixe'} (${inv.count('meat') + inv.count('fish')})`, () => roastAt((p.gx + 0.5) * T, (p.gy + 0.5) * T));
    }
    for (const e of game.enemies.list) { const ec = e as typeof e & { corpse?: number; skinned?: boolean }; if (e.state !== 'dead' || !e.active || !ec.corpse || ec.skinned || !SKIN[e.type]) continue; const dC = Math.hypot(e.pos.x - hx, e.pos.z - hz); if (dC > 3.2) continue;
      const S = SKIN[e.type]!, kn = inv.tool('knife'); add(dC - 0.3, 3.0, !kn ? `${e.def.name} — precisa de uma faca de caça` : kn.tier < (S.tier ?? 1) ? `🔒 ${e.def.name} — só uma faca de prata (★★★★) atravessa esse couro` : `E — Esfolar ${e.def.name} · ${kn.name}`, () => { if (kn && kn.tier >= (S.tier ?? 1)) startWork('skin', e, e.pos.x, e.pos.z); else game.logMsg(!kn ? '🔪 Sem uma faca, a carcaça fica para os corvos.' : '🔪 A lâmina escorrega no couro do lobisomem como em pedra. Só a prata.', '#ff9a8a'); }); }
    if (inv.tool('rod') && !fishing) { let wt: { x: number; z: number } | null = null, wd = 99; for (let y = gy - 3; y <= gy + 3; y++) for (let x = gx - 3; x <= gx + 3; x++) if (city.map[y]?.[x] === 'water') { const d = Math.hypot((x + 0.5) * T - hx, (y + 0.5) * T - hz); if (d < wd) { wd = d; wt = { x: (x + 0.5) * T, z: (y + 0.5) * T }; } } if (wt && !swimmingNow) add(wd + 1, 9, 'E — Pescar', () => { startFishing(wt!); }); }
  } else if (inside.prop.variant === 5 || inside.prop.variant === 4) add(Math.hypot(hx - IX - inside.int.W / 2, hz - IZ - inside.int.D * (inside.prop.variant === 5 ? 0.5 : 0.3)), 3.4, inside.prop.variant === 5 ? 'E — Comprar equipamentos' : 'E — Balcão da taverna', () => inv.openShop(inside!.prop.variant === 5 ? 'armeiro' : 'mercador'));
  if (spirit) add(Math.hypot(hx - spirit.x, hz - spirit.z) - 0.6, 3.2, 'E — Falar com Irmã Ysolde', talkSpirit);
  if (inside) { const ins = inside; const lx = hx - IX, lz = hz - IZ; add(Math.hypot(lx - ins.int.W / 2, lz - ins.int.D), 2.4, ins.crypt && ins.crypt > 1 ? 'E — Subir' : ins.dg ? 'E — Voltar à superfície' : 'E — Sair', exitHouse);
  if (ins.dg) dgs.interactions(hx, hz, add);
  if (ins.crypt && cryptInt) {
    const open = bloodFull(ins.crypt) || localStorage.getItem('karmika.crypt.done') === '1', f = ins.crypt;
    if (cryptInt.vessel && f <= 4) add(Math.hypot(hx - IX - cryptInt.vessel.x, hz - IZ - cryptInt.vessel.z) - 2, 1.6, open ? '🩸 Vasilhame do Sacrifício — cheio' : `🩸 Vasilhame do Sacrifício — ${Math.floor(blood[f - 1])} / ${BLOOD_NEED[f - 1]} litros`, () => drawBloodHud());
    if (cryptInt.stairs && f < 4) { const sx = IX + cryptInt.stairs.x, sz = IZ + cryptInt.stairs.z; add(Math.hypot(hx - sx, hz - sz), 3.4, open ? `E — Descer a escada em espiral (andar ${f + 1})` : `🩸 Escada em espiral — a taça pede ${BLOOD_NEED[f - 1] - Math.floor(blood[f - 1])} litros de sangue`, () => { if (open) enterCrypt(f + 1, ins.prop); }); }
    if (cryptInt.door && f === 4) { const dx = IX + cryptInt.door.x, dz = IZ + cryptInt.door.z, have = SEALS.filter((id) => inv.has(id)).length; add(Math.hypot(hx - dx, hz - dz), 3.4, have < 3 ? `🔒 Porta do Bispo — ${have}/3 selos (caem dos elites dos andares 2, 3 e 4)` : !open ? `🩸 Porta do Bispo — a taça ainda pede ${BLOOD_NEED[3] - Math.floor(blood[3])} litros` : 'E — Quebrar os três selos e abrir a Porta do Bispo', () => { if (have >= 3 && open) { cryptInt!.door!.open(); audio.boom(); game.logMsg('✝ Os selos estalam e a porta se abre. Além dela, o Bispo Caído.', '#ffd24a'); setTimeout(() => enterCrypt(5, ins.prop), 1400); } }); } }
    return best; }
  for (const p of city.props) if (p.kind === 'house' || p.kind === 'temple' || p.kind === 'church') { const dd = DOOR_OF.get(p); if (!dd) continue; const catLocked = p.kind === 'church' && p.variant === 2 && state.night < 0.5; add(Math.max(0, Math.hypot(hx - dd.x, hz - dd.z) - (p.kind === 'house' ? 0.6 : 1.4)) + 0.01, 2.8, catLocked ? '🔒 As portas da Catedral só se abrem à noite' : `E — Entrar${p.kind === 'temple' ? ' no Templo' : p.kind === 'church' ? (p.variant === 2 ? ' na Catedral Abandonada' : ' na Igreja Abandonada') : p.variant === 4 ? ' na Taverna' : p.variant === 5 ? ' na Loja do Armeiro' : ''}`, () => { if (catLocked) { game.logMsg('🌙 As portas de ferro não cedem. Dizem que a Catedral só respira depois que o sol morre.', '#c8b8ff'); return; } if (p.kind === 'church' && p.variant === 2) enterCrypt(1, p); else enterHouse(p); }); }
  if (!sitting) for (const p of city.props) if (p.kind === 'fountain') { const fx = (p.gx + p.w / 2) * T, fz = (p.gy + p.h / 2) * T, isHome = Math.abs(home.x - (p.gx + p.h / 2)) < 0.6 && Math.abs(home.y - (p.gy + p.h + 1)) < 0.6; add(Math.hypot(fx - hx, fz - hz) - p.w, 2.6, isHome ? '⛲ Esta é sua fonte-lar' : 'E — Tornar esta fonte meu lar', () => { if (!isHome) setHome(p); }); }
  for (const p of city.props) if (p.kind === 'vault') { const bx = (p.gx + 0.5) * T, bz = (p.gy + 0.5) * T; add(Math.hypot(bx - hx, bz - hz), 2.2, 'E — Baú do Caminhante', () => inv.openVault()); }
  for (const p of city.props) if (p.kind === 'mailbox') { const bx = (p.gx + 0.5) * T, bz = (p.gy + 0.5) * T; const u = mail.unread; add(Math.hypot(bx - hx, bz - hz), 2.2, `E — Caixa de Correio${u ? ` (${u} nova${u > 1 ? 's' : ''})` : ''}`, () => mail.open()); }
  for (const p of city.props) if (p.kind === 'noticeboard') { const bx = (p.gx + 0.5) * T, bz = (p.gy + 0.5) * T; add(Math.hypot(bx - hx, bz - hz), 2.6, 'E — Ler o Quadro de Avisos', () => quests.openBoard()); }
  if (!sitting) for (const p of city.props) if (p.kind === 'bench') { const bx = (p.gx + 0.5) * T, bz = (p.gy + 0.5) * T; add(Math.hypot(bx - hx, bz - hz), 2.2, 'E — Sentar', () => { const fp = city.props.find((q) => q.kind === 'fountain')!; sitting = { x: bx / T, y: bz / T, yaw: Math.atan2((fp.gx + 1) * T - bx, (fp.gy + 1) * T - bz) }; game.logMsg('Você se senta e descansa...', '#c8d8f0'); }); }
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
/* ---------- OFÍCIOS: machado, picareta, faca e alicate ----------
   Um E começa o trabalho; o herói repete o golpe sozinho (cada golpe é uma animação inteira, lenta) até acabar,
   até você andar, entrar em combate ou apertar E de novo. A ferramenta aparece na mão com o metal do seu nível;
   quanto melhor ela, mais cada golpe avança, mais rende e mais achados raros. */
type WorkKind = 'chop' | 'mine' | 'skin' | 'herb';
const WORK: Record<WorkKind, { slot: ToolSlot; anim: 'chop' | 'mine' | 'skin' | 'herb'; hit: number; verb: string; icon: string; kneel?: boolean }> = {
  chop: { slot: 'axe', anim: 'chop', hit: 0.55, verb: 'Cortando árvore', icon: '🪓' },
  mine: { slot: 'pick', anim: 'mine', hit: 0.58, verb: 'Minerando', icon: '⛏' },
  skin: { slot: 'knife', anim: 'skin', hit: 0.6, verb: 'Esfolando', icon: '🔪', kneel: true },
  herb: { slot: 'shears', anim: 'herb', hit: 0.5, verb: 'Colhendo', icon: '✂', kneel: true },
};
/** feras que deixam o corpo: couro e carne só saem com a faca (need = trabalho total; tier = faca mínima) */
const SKIN: Partial<Record<EnemyType, { hide: [number, number]; meat: [number, number]; need: number; tier?: number; special?: string }>> = {
  deer: { hide: [1, 2], meat: [2, 3], need: 4 }, boar: { hide: [1, 2], meat: [2, 4], need: 5 }, wolf: { hide: [1, 1], meat: [1, 2], need: 4 }, frostwolf: { hide: [1, 2], meat: [1, 2], need: 4 },
  coyote: { hide: [1, 1], meat: [1, 1], need: 3 }, werewolf: { hide: [0, 0], meat: [0, 0], need: 9, tier: 4, special: 'hide_w' },
};
const HERBS = [{ id: 'herb_g', name: 'Folha-de-Prata', tier: 1, need: 3 }, { id: 'herb_s', name: 'Cogumelo-Lamparina', tier: 1, need: 3 }, { id: 'herb_r', name: 'Raiz-Sangue', tier: 2, need: 4 }, { id: 'herb_m', name: 'Flor-de-Marghar', tier: 3, need: 5 }, { id: 'herb_j', name: 'Junco-do-Rio', tier: 0, need: 3 }, { id: 'herb_f', name: 'Flor-de-Campo', tier: 0, need: 2 }]; // flor e junco saem com a mão; o resto pede alicate
let work: { kind: WorkKind; target: object; x: number; z: number; prog: number; need: number; hitDone: boolean; strokes: number } | null = null;
const workBar = document.createElement('div'); workBar.id = 'workbar'; workBar.innerHTML = '<span class="wl"></span><div class="wb"><i></i></div>'; document.body.appendChild(workBar);
const pebbles = new Map<object, number>();
function gatherTwigs(p: object) { const c = twigs.get(p) ?? 0; if (c >= 2) { game.logMsg('Precisa de um machado para cortar. Crie um (I) ou compre com Tomás.', '#ff9a8a'); return; } twigs.set(p, c + 1); hero.act('herb'); inv.add('stick', 1 + (Math.random() < 0.5 ? 1 : 0)); if (Math.random() < 0.15) inv.add('apple', 1); }
function gatherPebbles(p: object) { const c = pebbles.get(p) ?? 0; if (c >= 3) { game.logMsg('Sem picareta, só dá para juntar o que já está solto. Crie uma (I).', '#ff9a8a'); return; } pebbles.set(p, c + 1); hero.act('herb'); inv.add('stone', 1); }
function startWork(kind: WorkKind, target: object, x: number, z: number) {
  if (work) { endWork('Você para o trabalho.'); return; }
  const W = WORK[kind], tool = inv.tool(W.slot); if (!tool) return;
  if (combatMode) setCombat(false); if (riding) setRiding(false, true);
  const need = kind === 'chop' ? CHOPS : kind === 'mine' ? rockState(target as (typeof city.props)[number]).max : kind === 'skin' ? SKIN[(target as { type: EnemyType }).type]!.need : HERBS[(target as { variant?: number }).variant ?? 0].need;
  const prog = kind === 'chop' ? chop.get(target) ?? 0 : kind === 'mine' ? need - rockState(target as (typeof city.props)[number]).left : 0;
  work = { kind, target, x, z, prog, need, hitDone: true, strokes: 0 };
  state.path = []; hero.holdTool = true; hero.kneel = !!W.kneel; hero.setGear({ weapon: { base: tool.base, rarity: 'normal', tint: tool.tint, glow: tool.glow } });
  workBar.classList.add('on'); drawWork();
}
function endWork(msg?: string, col = '#c8d8f0') { if (!work) return; work = null; hero.kneel = false; hero.holdTool = !!fishing; syncGear(); workBar.classList.remove('on'); if (msg) game.logMsg(msg, col); }
function drawWork() { if (!work) return; const W = WORK[work.kind], tool = inv.tool(W.slot); const k = Math.min(1, work.prog / work.need);
  (workBar.querySelector('.wl') as HTMLElement).innerHTML = `${W.icon} ${W.verb} — <b>${tool?.name ?? ''}</b> <i>${'★'.repeat(tool?.tier ?? 0)}</i> · ${Math.round(k * 100)}% <small>(E: parar)</small>`;
  (workBar.querySelector('.wb i') as HTMLElement).style.width = `${k * 100}%`; }
function updateWork() {
  if (!work) return;
  if (keys.has('w') || keys.has('a') || keys.has('s') || keys.has('d') || state.path.length || game.menuOpen || combatMode || game.st.dead || inside) { endWork('Você interrompe o trabalho.'); return; }
  const W = WORK[work.kind], tool = inv.tool(W.slot); if (!tool) { endWork(); return; }
  if (work.kind === 'skin') { const e = work.target as { state: string; active: boolean }; if (e.state !== 'dead' || !e.active) { endWork('A carcaça se foi.'); return; } }
  if (!hero.acting) { if (hero.act(W.anim)) { work.hitDone = false; work.strokes++; } return; }
  if (!work.hitDone && hero.actName === W.anim && hero.actP >= W.hit) { work.hitDone = true; workHit(work, tool); drawWork(); }
}
function workHit(w: NonNullable<typeof work>, tool: NonNullable<ReturnType<typeof inv.tool>>) {
  profs.gain(w.kind === 'chop' ? 'lenhador' : w.kind === 'mine' ? 'minerador' : w.kind === 'skin' ? 'esfolador' : 'herbalista', 2);
  const gy0 = heightAt(w.x, w.z), px = w.x, pz = w.z, rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
  if (w.kind === 'chop') {
    const p = w.target as (typeof city.props)[number]; w.prog += tool.power; chop.set(p, w.prog); audio.slash?.();
    for (let i = 0; i < 10; i++) particles.spawn(px, gy0 + 1.1, pz, { vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 2.5, vz: (Math.random() - 0.5) * 3, life: 0.6, s0: 0.14, s1: 0.04, c0: 0xd9b27a, c1: 0x7a5532, a: 0.9, g: 9 });
    const got = Math.max(1, Math.round(rnd(1, 2) * tool.yield * (0.8 + Math.random() * 0.4))); inv.add('wood', got, true); if (Math.random() < 0.3) inv.add('stick', 1, true); game.logMsg(`🪓 +${got} madeira`, '#d9b27a');
    if (w.prog >= CHOPS) {
      objs.removeProp(p); city.map[p.gy][p.gx] = 'grass'; chop.delete(p);
      for (let i = 0; i < 40; i++) particles.spawn(px + (Math.random() - 0.5) * 2, gy0 + 2 + Math.random() * 3, pz + (Math.random() - 0.5) * 2, { vx: (Math.random() - 0.5) * 2, vy: -0.5, vz: (Math.random() - 0.5) * 2, life: 1.4, s0: 0.3, s1: 0.1, c0: 0x6ab04a, c1: 0x3f7a3a, a: 0.9, g: 2, flit: 2 });
      const bonus = Math.round((8 + Math.floor(Math.random() * 6)) * tool.yield); inv.add('wood', bonus); if (Math.random() < 0.3) inv.add('apple', 1 + Math.floor(Math.random() * 2)); if (Math.random() < tool.luck) { inv.add('sap', 1); game.logMsg('🍯 O cerne da árvore guardava seiva viva.', '#d0a030'); }
      regrow.push({ gx: p.gx, gy: p.gy, height: p.height, variant: p.variant, at: Date.now(), stage: 0 }); saveRegrow(); audio.boom(); feats.bump('trees');
      endWork('🌳 A árvore cai. O toco rebrota com os turnos.', '#8fd08a');
    }
  } else if (w.kind === 'mine') {
    const p = w.target as (typeof city.props)[number], R = rockState(p), size = Math.max(1, p.w * p.h), vein = veinOf(p);
    R.left = Math.max(0, R.left - tool.power); w.prog = R.max - R.left; audio.block?.();
    for (let i = 0; i < 10; i++) particles.spawn(px, gy0 + 0.5, pz, { vx: (Math.random() - 0.5) * 2.4, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 2.4, life: 0.5, s0: 0.16, s1: 0.04, c0: vein === 2 ? 0xffffff : 0xcfcfcf, c1: vein === 1 ? 0xa0582e : 0x888888, a: 0.9, g: 8 });
    const got = Math.max(1, Math.round((1 + Math.floor(Math.random() * (1 + Math.min(2, size)))) * tool.yield)); inv.add('stone', got, true); let note = `⛏ +${got} pedra`;
    if (vein === 1) { if (tool.tier >= 2) { if (Math.random() < 0.28 + tool.luck) { inv.add('ore_i', 1, true); feats.bump('ore_i'); note += ' · +1 minério de ferro'; } } else if (!(w as { warned?: boolean }).warned) { (w as { warned?: boolean }).warned = true; game.logMsg('🟤 Há ferro nesse veio, mas a picareta de pedra só arranha. Precisa de uma de ferro (★★).', '#ffb080'); } }
    if (vein === 2) { if (tool.tier >= 3) { if (Math.random() < 0.2 + tool.luck) { inv.add('ore_ag', 1, true); feats.bump('ore_ag'); note += ' · +1 minério de prata'; } } else if (tool.tier >= 2 && Math.random() < 0.2) { inv.add('ore_i', 1, true); note += ' · +1 minério de ferro'; } else if (!(w as { warned?: boolean }).warned) { (w as { warned?: boolean }).warned = true; game.logMsg('⚪ Um veio de prata. Só aço (★★★) o arranca da rocha.', '#dde3ec'); } }
    if (tool.tier >= 3 && Math.random() < tool.luck * 0.12) { inv.add('gem', 1); feats.bump('gem'); game.logMsg('💎 Uma gema bruta brilha entre as lascas!', '#7ad0ff'); }
    game.logMsg(note, '#cfcfcf');
    if (R.left <= 0) { const bonus = Math.round((5 + size * 3) * tool.yield); inv.add('stone', bonus); feats.bump('rocks'); R.at = Date.now(); audio.boom(); endWork(`🪨 A rocha racha: +${bonus} pedra. Ela se refaz com os turnos.`, '#cfcfcf'); }
  } else if (w.kind === 'skin') {
    const e = w.target as { type: EnemyType; def: { name: string }; skinned?: boolean; corpse?: number; t: number }; const S = SKIN[e.type]!;
    w.prog += tool.power; audio.slash?.();
    for (let i = 0; i < 6; i++) particles.spawn(px, gy0 + 0.25, pz, { vx: (Math.random() - 0.5) * 1.2, vy: 0.4 + Math.random(), vz: (Math.random() - 0.5) * 1.2, life: 0.5, s0: 0.1, s1: 0.03, c0: 0x9a1a1a, c1: 0x5a0a0a, a: 0.9, g: 6 });
    if (w.prog >= S.need) {
      e.skinned = true; e.corpse = e.t + 1.6; feats.bump('skins'); // o que sobra afunda na terra
      const got: string[] = [];
      if (S.special) { inv.add(S.special, 1); got.push(`1 ${ITEMS_TBL[S.special].name}`); }
      const h = Math.round(rnd(S.hide[0], S.hide[1]) * tool.yield), m = Math.round(rnd(S.meat[0], S.meat[1]) * tool.yield);
      // couro fino: só sai inteiro com faca boa; faca rústica às vezes rasga a pele
      let hide = h; if (tool.tier <= 1 && hide > 0 && Math.random() < 0.35) { hide--; game.logMsg('🔪 A faca de sílex rasgou parte da pele.', '#d0907a'); }
      if (hide > 0 && tool.tier >= 2 && Math.random() < tool.luck + (tool.tier >= 3 ? 0.2 : 0)) { inv.add('hide_f', 1); feats.bump('hide_f'); got.push('1 Couro fino'); hide--; }
      if (hide > 0) { inv.add('hide', hide, true); got.push(`${hide} Couro`); } if (m > 0) { inv.add('meat', m, true); got.push(`${m} Carne crua`); }
      if (Math.random() < 0.25) { inv.add('claw', 1, true); got.push('1 Garra'); }
      endWork(`🔪 Você esfolou ${e.def.name}: ${got.join(', ') || 'nada aproveitável'}.`, '#e0b080');
    }
  } else {
    const p = w.target as (typeof city.props)[number], H = HERBS[p.variant ?? 0]; w.prog += tool.power;
    for (let i = 0; i < 5; i++) particles.spawn(px, gy0 + 0.35, pz, { vx: (Math.random() - 0.5) * 1, vy: 0.5 + Math.random(), vz: (Math.random() - 0.5) * 1, life: 0.7, s0: 0.08, s1: 0.02, c0: 0xc8f0c0, c1: 0x5a9a4a, a: 0.9, g: 3 });
    if (w.prog >= H.need) {
      const n = Math.max(1, Math.round(rnd(1, 2) * tool.yield)); inv.add(H.id, n, true); feats.bump('herbs', n); if (H.id === 'herb_m') feats.bump('herb_m'); let msg = `✂ +${n} ${H.name}`;
      if (H.tier < 3 && tool.tier >= 3 && Math.random() < tool.luck * 0.25) { inv.add('herb_m', 1, true); feats.bump('herb_m'); msg += ' · e uma Flor-de-Marghar escondida entre as folhas!'; }
      objs.removeProp(p); (p as { gone?: boolean }).gone = true; picked.push({ gx: p.gx, gy: p.gy, at: Date.now() }); savePicked();
      endWork(msg, '#9ad0a0');
    }
  }
}
(window as unknown as { __work: unknown }).__work = { start: (k: WorkKind, tg: object, x: number, z: number) => startWork(k, tg, x, z), get w() { return work; } };
/* ervas colhidas voltam com os turnos (a raiz fica) */
const picked: { gx: number; gy: number; at: number }[] = (() => { try { return JSON.parse(localStorage.getItem('karmika.picked.v1') || '[]'); } catch { return []; } })();
const savePicked = () => { try { localStorage.setItem('karmika.picked.v1', JSON.stringify(picked)); } catch { /* */ } };
const herbAt = (gx: number, gy: number) => (tileIdx.get(gy * 1000 + gx) ?? []).find((q) => q.kind === 'herb');
for (const pk of picked) { const p = herbAt(pk.gx, pk.gy); if (p) { (p as { gone?: boolean }).gone = true; objs.removeProp(p); } }
function updatePicked() { const now = Date.now(); for (let i = picked.length - 1; i >= 0; i--) if (now - picked[i].at > TURN_MS * 2) { const p = herbAt(picked[i].gx, picked[i].gy); picked.splice(i, 1); if (p) { (p as { gone?: boolean }).gone = false; objs.removeProp(p); (p as { gone?: boolean }).gone = false; const i2 = city.props.indexOf(p); if (i2 >= 0) city.props.splice(i2, 1); objs.addProp(p); } } savePicked(); }
/* brilho discreto sobre as ervas próximas: o olho acha a planta no mato sem poluir a tela */
let herbGlowT = 0;
function herbSparkle(dt: number) { herbGlowT -= dt; if (herbGlowT > 0 || inside) return; herbGlowT = 0.45; const gx = Math.floor(state.fx), gy = Math.floor(state.fy);
  for (const p of nearProps(gx, gy, ['herb'], 9)) { if (Math.random() > 0.5) continue; const x = (p.gx + 0.5) * T + (Math.random() - 0.5) * 0.6, z = (p.gy + 0.5) * T + (Math.random() - 0.5) * 0.6; const c = [0xdfffe0, 0xffd27a, 0xff6a7a, 0x9ad7ff][p.variant ?? 0];
    particles.spawn(x, heightAt(x, z) + 0.5, z, { vy: 0.35, life: 1.1, s0: 0.12, s1: 0.02, c0: 0xffffff, c1: c, a: 0.85, flit: 1 }); } }
function interact() { if (work) { endWork('Você para o trabalho.'); return; } const i = findInter(); if (i) i.act(); }
// árvores cortadas em sessões anteriores: tira a original do mundo e deixa o rebrote cuidar
for (const r of regrow) { const p = city.props.find((q) => q.kind === 'tree' && q.gx === r.gx && q.gy === r.gy); if (p) { objs.removeProp(p); city.map[r.gy][r.gx] = 'grass'; } r.prop = undefined; r.stage = -1; }
let hintT = 0, regrowT = 1, stamWarnT = 0;

/* vagalumes e fagulhas: raros no mundo (poupam o hardware), um pouco mais nas matas e pântanos, muitos perto das terras élficas */
let elfK = 0, forestK = 0, qmarkT = 0, featT = 0;
function featKill(t: EnemyType, e: { def: { lvl?: number; name: string } }) {
  feats.bump('kills'); if (t === 'rat') feats.bump('k_rat'); if (t === 'wolf' || t === 'frostwolf') feats.bump('k_wolves'); if (t === 'imp') feats.bump('k_imp'); if (t === 'skeleton' || t === 'zombie' || t === 'ghoul') feats.bump('k_undead'); if (t === 'werewolf') feats.bump('k_werewolf');
  if (t === 'prince' || t === 'tormentor' || t === 'treant' || t === 'werewolf') feats.bump('elites'); if (e.def.name === 'Bispo Caído' || e.def.name === 'Sacerdote Maldito') feats.bump('k_boss_cat');
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
  for (const e of game.enemies.list) { const ee = e as typeof e & { quest?: boolean; qring?: THREE.Mesh }; ee.quest = want.has(e.type) && e.alive; if (ee.qring) ee.qring.visible = ee.quest; } }
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
  poolScanT -= dt; if (poolScanT <= 0) { poolScanT = 1.5; poolList = []; scene.traverse((o) => { const l = o as THREE.PointLight; if (l.isPointLight && l !== lantern && !(l.userData as { keep?: boolean }).keep) poolList.push(l);
      /* sombra só para o que tem tamanho de fazer sombra: capim, flor, pedrinha e vela não entram no mapa de sombras (eram milhares) */
      const m = o as THREE.Mesh; if (m.isMesh && m.castShadow && !(m.userData as { shadowChecked?: boolean }).shadowChecked) { (m.userData as { shadowChecked?: boolean }).shadowChecked = true; const g = m.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); const sc = Math.max(m.scale.x, m.scale.y, m.scale.z); if ((g.boundingSphere?.radius ?? 1) * sc < 0.28 && !(m as unknown as { isSkinnedMesh?: boolean }).isSkinnedMesh) m.castShadow = false; } }); }
  poolT -= dt; if (poolT > 0) return; poolT = 0.2;
  const cxp = camX, czp = camZ, v = new THREE.Vector3();
  const scored = poolList.map((l) => { l.getWorldPosition(v); let up = true; for (let p: THREE.Object3D | null = l.parent; p; p = p.parent) if (!p.visible) { up = false; break; } return { l, d: up ? Math.hypot(v.x - cxp, v.z - czp) - l.intensity * 0.05 : 1e9 }; }).sort((a, b) => a.d - b.d);
  scored.forEach((e, i) => { const on = i < LUZES_ATIVAS; if (e.l.visible !== on) e.l.visible = on; });
}
function frame() {
  if (bootFrames < 12 && ++bootFrames === 12) hideBoot(); // o mundo já desenhou alguns quadros de verdade: pode tirar a abertura
  try { frameBody(); } catch (e) { kshow('ERRO no frame: ' + ((e as Error).stack || e)); return; }
  requestAnimationFrame(frame);
}
const __BUILD__ = '20261019-2340';
let fpsN = 0, fpsT = 0, poiTick = -1;
function frameBody() {
  { fpsN++; const nowMs = performance.now(); if (nowMs - fpsT > 1000) { const v = document.getElementById('ver'); if (v) v.textContent = `${fpsN} fps · ${game.dbg().en.length} inimigos ativos · build ${__BUILD__}`; fpsN = 0; fpsT = nowMs; } }
  const rawDt = Math.min(0.05, clock.getDelta());
  if (limiar.active) { limiar.frame(rawDt, renderer.domElement.width, renderer.domElement.height); bloom.strength = 0.22 * opts.bloom; renderer.info.reset(); composer.render(); return; } // o mundo espera lá embaixo
  const dt = rawDt * game.timeScale() * (cine ? 0 : 1) * (dlg.isOpen || document.getElementById('create')!.style.display === 'grid' ? 0 : 1) /* mundo vivo: janelas não pausam */;
  t += dt;
  nightTarget = nightOverride ?? nightAt(gameHour());
  (window as unknown as { __night?: number }).__night = state.night;
  state.night += (nightTarget - state.night) * Math.min(1, dt * 0.8);
  const night = state.night, day = 1 - night;

  /* movimento */
  /* água: entra andando até a cintura (lento, empurrando a água); mais fundo que isso, nada */
  const depthNow = inside ? 0 : WL - heightAt(state.fx * T, state.fy * T);
  const swimming = !inside && depthNow > 1.25; swimmingNow = swimming; hero.swim = swimming;
  dual.clipFor = scene; dual.fineClip = inside ? [] : waterClip; // a linha d'água corta os corpos (a água não escreve profundidade)
  const wade = !inside && !swimming && depthNow > 0.04 ? Math.min(1, depthNow / 1.0) : 0;
  updateFishing(dt, t); updateWork(); herbSparkle(dt); updateQuestRings(dt); featsTick(dt);
  const sp = RACES[state.race].speed * game.st.move * game.buffMove * (combatMode ? 1 : 1.2) * (riding && mount ? mount.kind.speed : 1) * (game.st.god ? 4.2 : 1) * (swimming ? 0.5 : 1) * (1 - 0.45 * wade);
  if (game.st.lvl !== lastLvl) { lastLvl = game.st.lvl; refreshLocks(kitRace(), lastLvl, (k) => tree.rank(k)); game.logMsg('✨ +1 ponto de magia — abra a Árvore Kármica (K) para gastar.', '#ffe08a'); }
  dockEl.querySelector('[data-d="skills"]')?.classList.toggle('pulse', tree.available() > 0 && !skillsOpen);
  if (game.hurtNow()) setCombat(true);
  if (((t * 2) | 0) !== poiTick) { poiTick = (t * 2) | 0; for (const p of city.pois) if (Math.hypot(p.x - state.fx, p.y - state.fy) < 4) quests.onVisit(p.name); }
  let ix = 0, iy = 0;
  if (keys.has('w') || keys.has('arrowup')) iy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) iy += 1;
  if (keys.has('a') || keys.has('arrowleft')) ix -= 1;
  if (keys.has('d') || keys.has('arrowright')) ix += 1;
  // fôlego: base por origem/caminho (guerreiros, lobisomens e vampiros muito; elfos mais; humanos/anões menos; tecnocratas e bruxos menos) + 4 por ponto de vitalidade
  const STAM_BASE: Record<string, number> = { human: 100, dwarf: 85, elf: 125 };
  game.st.stamMax = Math.round((profile ? STAM_BASE[profile.origin] ?? 100 : 100) * (state.race === 'technocrat' ? 0.7 : state.race === 'nordic' ? 1.3 : 1) + (game.st.attrs?.vit ?? 0) * 4);
  if (outOfBreath && game.st.stam >= game.st.stamMax * 0.25) outOfBreath = false;
  const wantRun = runningNow() && (ix || iy || state.path.length > 0);
  if (wantRun && game.st.stam > 0 && !game.st.god) game.st.stam = Math.max(0, game.st.stam - dt * 9);
  if (game.st.stam <= 0.5 && wantRun && !game.st.god) { outOfBreath = true; if (!stamWarnT) { stamWarnT = 2; game.logMsg('😮‍💨 Sem fôlego — andando até recuperar.', '#ffd24a'); } }
  if (stamWarnT > 0) stamWarnT -= dt;
  const run = runningNow() && (game.st.stam > 0.5 || game.st.god) ? 1.5 : 1;
  game.setMoving(!!(ix || iy));
  if (sitting && (ix || iy || hero.acting)) { sitting = null; }
  const forced = !!hero.actName && ['slam', 'bash', 'combo1', 'combo2', 'combo3', 'combo4', 'cleave1', 'cleave2', 'cleave3', 'cleave4', 'rush', 'quake', 'charge', 'jet', 'throw'].includes(hero.actName);
  const actSlow = dashT > 0 ? 1 : game.flaming ? 0.75 : forced ? 0 : hero.acting ? 0.3 : hero.guard ? 0.45 : 1;
  let gdx = 0, gdy = 0;
  if (ix || iy) {
    state.path = []; marker.visible = false;
    gdx = ix * Math.cos(az) - iy * -Math.sin(az); gdy = -ix * Math.sin(az) - iy * -Math.cos(az);
    const len = Math.hypot(gdx, gdy); gdx /= len; gdy /= len;
  } else if (lmbHold && performance.now() - lmbHold > 260 && !game.menuOpen && !cine && (holdT -= dt) <= 0) { holdT = 0.18; planTo(mouse.x / T, mouse.z / T, false, 5000); if (state.path.length) [gdx, gdy] = followPath(dt); }
  else if (state.path.length) { [gdx, gdy] = followPath(dt); }
  state.moving = !!(gdx || gdy);
  if (keys.has(' ') && dashCd <= 0 && !hero.acting) { const f = hero.facing; startDash(state.moving ? gdx : Math.sin(f), state.moving ? gdy : Math.cos(f)); }
  dashCd -= dt;
  let boost = 1;
  if (dashT > 0) { dashT -= dt; boost = 3.2; gdx = dx0; gdy = dy0; state.moving = true; }
  vel += ((state.moving ? 1 : 0) - vel) * Math.min(1, dt * (state.moving ? 14 : 18));
  if (state.moving || vel > 0.02) {
    const stepL = sp * run * boost * vel * actSlow * dt; moveSlide(gdx * stepL, gdy * stepL, dt, state.moving);
  }
  const leaping = hero.actName === 'slam' || hero.actName === 'quake';
  if (leap && leaping) { // salto marcado: voa em arco do ponto de partida ao ponto marcado
    const p = hero.actP, k = THREE.MathUtils.smoothstep(p, 0.2, 0.66); state.fx = (leap.x0 + (leap.x1 - leap.x0) * k) / T; state.fy = (leap.z0 + (leap.z1 - leap.z0) * k) / T;
  } else if (leap) leap = null;
  if (forced && hero.stepVel !== 0 && !(leap && leaping)) { // avanços/recuos dos golpes (m/s, na direção em que o herói olha)
    const fy = hero.facing; const sv = hero.stepVel / T;
    const tg = game.target(heroPos, fy), dTg = tg ? Math.hypot(tg.x - state.fx * T, tg.z - state.fy * T) : 99;
    if (!(sv > 0 && dTg < 1.4)) {
      const svv = sv > 0 && dTg > 2.2 && dTg < 9 ? sv * 2.3 : sv; // fecha a distância até o alvo // não atravessa o alvo
      const nx = state.fx + Math.sin(fy) * svv * dt, ny = state.fy + Math.cos(fy) * svv * dt;
      if (free(nx, state.fy)) state.fx = nx; if (free(state.fx, ny)) state.fy = ny;
    }
  }
  if (!inside) { const tx = Math.floor(state.fx), ty = Math.floor(state.fy), rp = rampartAt(tx, ty); if (onWall && !rp) onWall = false; else if (!onWall && rp && heroY > rp.top - 1.5) onWall = true; } else onWall = false;
  const wallTop = onWall ? rampartAt(Math.floor(state.fx), Math.floor(state.fy))?.top ?? null : null;
  const gH = inside ? 0 : wallTop !== null ? wallTop + 0.08 : heroGround(state.fx * T, state.fy * T), tgtY = swimming ? WL - (state.moving ? 0.62 : 1.05) + Math.sin(t * 2.4) * 0.05 : gH + (sitting ? -0.28 : 0); /* nadando: água no peito; andando: pés no leito (até a cintura) */
  heroY += (tgtY - heroY) * Math.min(1, dt * (swimming ? 6 : 18) + (dt > 0 ? 0 : 1));
  heroPos.set(state.fx * T, heroY, state.fy * T);
  hero.root.position.copy(heroPos); if (riding && mount) hero.root.position.y += mount.seatY() - 0.62;
  plane.constant = -heroY;
  if (!inside) { if (!cine) objs.setRad(Math.min(5, Math.max(2, Math.ceil(Math.hypot(zoom * innerWidth / innerHeight, zoom * 2.2) / 2 / 40 + 0.7)))); /* raio de chunks segue o zoom e a tela: nada de vazio nas bordas */ objs.update(camX, camZ); } else { inside.int.flicker(t, state.fx * T - IX, state.fy * T - IZ); if (state.fy * T - IZ > inside.int.D + 0.5) exitHouse(); }
  const mps = Math.max(sp * T * run * boost * vel * actSlow * (state.moving || vel > 0.02 ? 1 : 0), Math.abs(forced ? hero.stepVel : 0));
  const aiming = hero.acting;
  if (castQ) { if (performance.now() > castQ.until || game.st.dead) castQ = null; else castAt(castQ.slot, castQ.at); }
  if (lockYaw !== null && !hero.acting) lockYaw = null;
  { /* o herói encara o golpe do começo ao fim: a direção é decidida quando o gesto começa e não fica girando atrás do mouse */
    const an = hero.acting ? hero.actName : null;
    if (an && an !== 'dash' && an !== 'hit' && an !== 'dodge' && (an !== lastActN || hero.actP + 0.15 < lastActP) && !lockFresh) lockYaw = aimYaw();
    lockFresh = false; lastActN = an; lastActP = hero.actP; }
  if ((aimSlot || guardCone) && (dlg.isOpen || game.menuOpen || game.st.dead)) { cancelAim(); guardCone = false; aim.hide(); }
  const aimNow = aim.active ? aim.update(dt, state.fx * T, state.fy * T, mouse.x, mouse.z, (x, z) => inside ? 0 : heightAt(x, z)) : null;
  const mouseYaw = Math.atan2(mouse.x - state.fx * T, mouse.z - state.fy * T);
  if (sitting) { state.fx = sitting.x; state.fy = sitting.y; game.st.hp = Math.min(game.st.hpMax, game.st.hp + dt * 6); }
  if (wade > 0.15 && state.moving) { wadeAcc += dt; if (wadeAcc > 0.09) { wadeAcc = 0; for (let i = 0; i < 2; i++) { const a = Math.random() * 6.283; particles.spawn(heroPos.x + Math.cos(a) * 0.4, WL + 0.03, heroPos.z + Math.sin(a) * 0.4, { vx: Math.cos(a) * 0.8, vy: 0.9 + Math.random(), vz: Math.sin(a) * 0.8, life: 0.5, s0: 0.18, s1: 0.05, c0: 0xe8f4ff, c1: 0x9ac8e8, a: 0.7, g: 6 }); } } }
  if (swimming) { swimAcc += dt; if (swimAcc > (state.moving ? 0.12 : 0.45)) { swimAcc = 0; for (let i = 0; i < 3; i++) { const a = Math.random() * 6.283; particles.spawn(heroPos.x + Math.cos(a) * 0.5, WL + 0.03, heroPos.z + Math.sin(a) * 0.5, { vx: Math.cos(a) * 0.8, vy: 0.05, vz: Math.sin(a) * 0.8, life: 0.9, s0: 0.18, s1: 0.5, c0: 0xdff4ff, c1: 0x9cd0ff, a: 0.5, drag: 1.5 }); } } }
  hero.update(dt, t, swimming ? Math.min(mps, 2.2) : mps, dashT > 0 ? Math.atan2(dx0, dy0) : lockYaw !== null && aiming ? lockYaw : aiming ? aimYaw() : aimNow ? aimNow.yaw : hero.guard ? mouseYaw : fishing ? Math.atan2(fishing.at.x - state.fx * T, fishing.at.z - state.fy * T) : work ? Math.atan2(work.x - state.fx * T, work.z - state.fy * T) : sitting ? sitting.yaw : state.moving ? Math.atan2(gdx, gdy) : combatMode ? nearYaw() : null);
  skinTick?.(); // copia a pose procedural para o modelo do artista
  netMps = swimming ? Math.min(mps, 2.2) : mps; net.update(dt, t);
  updateFacSigil(t);
  updateXray(dt); updateEnvelopes(t);
  if (isPremium()) { const hp = hero.root.position, a = t * 0.9; blessRune.visible = !inside; blessRune.position.set(hp.x + Math.cos(a) * 0.62, hp.y + 0.28 + Math.sin(t * 2) * 0.04, hp.z + Math.sin(a) * 0.62); } else blessRune.visible = false;
  updateCompanions(dt, t, hero.root.rotation.y, mps); updatePortal(dt, t); updateStamRing(dt); updateBishop(dt); dgs.update(dt); updateClickMarks(dt); updateSpirit(dt, t); updateBlood(dt, t); updateMarks(dt, t);
  regrowT -= dt; if (regrowT <= 0) { regrowT = 10; updateRegrow(); updatePicked(); }
  game.update(dt, heroPos, state.karma, RACES[state.race].label, audio.muted);
  if (rmb && !game.menuOpen && !dlg.isOpen) game.attack(aimYaw(), heroPosNow());
  updateGuide(dt); updateInstinct(dt); updateCaravans(dt); updateEventos(dt); updateSecrets(dt); build.update(mouse.x, mouse.z);
  if (bubbleT > 0) { bubbleT -= dt; if (bubbleT <= 0) bubbleEl.style.display = 'none'; else { const r = canvas.getBoundingClientRect(); const v = new THREE.Vector3(heroPos.x, heroPos.y + 2.4, heroPos.z).project(camera); bubbleEl.style.left = r.left + (v.x * 0.5 + 0.5) * r.width + 'px'; bubbleEl.style.top = r.top + (-v.y * 0.5 + 0.5) * r.height + 'px'; } }
  bannerT -= dt; if (bannerT <= 0) { bannerT = 0.5; updateBanner(); }
  qmT -= dt; if (qmT <= 0) { qmT = 0.7; updateQuestMarks(); }
  mmT -= dt; if (mmT <= 0) { mmT = 0.1; drawMini(); if (bigOpen) drawBig(); (document.getElementById('zone') as HTMLElement).textContent = `${zoneName()} · ${turnName()} ${Math.floor(gameHour())}h`; }
  hintT -= dt; if (hintT <= 0) { hintT = 0.12; const it = sitting ? null : findInter(); hintEl.style.display = it ? 'block' : 'none'; if (it) hintEl.textContent = it.label; }
  if (hintEl.style.display !== 'none') { const r = canvas.getBoundingClientRect(); const v = new THREE.Vector3(heroPos.x, heroPos.y + 2.1, heroPos.z).project(camera); hintEl.style.left = r.left + (v.x * 0.5 + 0.5) * r.width + 'px'; hintEl.style.top = r.top + (-v.y * 0.5 + 0.5) * r.height + 'px'; }
  lantern.position.set(heroPos.x, 3.2, heroPos.z);
  lantern.intensity = mix(5, 55, night);

  /* câmera com zoom suave e lento */
  zoom += (zoomTarget - zoom) * Math.min(1, dt * 2.2);
  applyZoom();
  if (CAM_FREE && keys.has('q')) azT += dt * 1.6;
  if (CAM_FREE && keys.has('e') && performance.now() - eDown > 230) { azT -= dt * 1.6; eRot = true; }
  az += (azT - az) * Math.min(1, dt * 6);
  pitch += (pitchT - pitch) * Math.min(1, dt * 6);
  camDir.set(Math.sin(az) * Math.cos(pitch), Math.sin(pitch), Math.cos(az) * Math.cos(pitch)).multiplyScalar(camDist());
  leadX += ((state.moving ? gdx * 2.2 : 0) * T * 0.5 - leadX) * Math.min(1, dt * 2.5);
  leadZ += ((state.moving ? gdy * 2.2 : 0) * T * 0.5 - leadZ) * Math.min(1, dt * 2.5);
  if (!updateCine(rawDt)) {
  camX += (heroPos.x + leadX - camX) * Math.min(1, dt * 6);
  camZ += (heroPos.z + leadZ - camZ) * Math.min(1, dt * 6);
  camY += (heroY - camY) * Math.min(1, dt * 5);
  }
  updateDoors(rawDt);
  for (const vo of vistaObjs) { vo.eye.rotation.y += rawDt * 1.2; vo.eye.position.y = 2.3 + Math.sin(performance.now() / 600) * 0.08; (vo.ring.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.2 * Math.sin(performance.now() / 400); }
  if (Math.floor(performance.now() / 500) !== cineTick) { cineTick = Math.floor(performance.now() / 500); checkCineTriggers(); }
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
  if (performance.now() - gChkT > 1000) { gChkT = performance.now(); try { gCur = gForce !== undefined ? gForce : (globalNow()?.id ?? null); } catch { gCur = null; } const sd = globalSide(gCur); game.st.outMul = sd > 0 ? 1.2 : 1; game.st.takenMul = sd > 0 ? 0.88 : sd < 0 ? 1.1 : 1; }
  luaK += ((gCur === 'lua' && !inside?.dg ? 1 : 0) - luaK) * Math.min(1, rawDt * 0.35);
  aurK += ((gCur === 'aurora' && !inside?.dg ? 1 : 0) - aurK) * Math.min(1, rawDt * 0.35);
  scene.background = (scene.background as THREE.Color).copy(nightC.sky).lerp(dayC.sky, day).lerp(LUA_C.sky, luaK * 0.85).lerp(AUR_C.sky, aurK * 0.35);
  (scene.fog as THREE.FogExp2).color.copy(nightC.fog).lerp(dayC.fog, day).lerp(LUA_C.fog, luaK * 0.8).lerp(AUR_C.fog, aurK * 0.4);
  (scene.fog as THREE.FogExp2).density = mix(0.012, 0.0022, day) * (cine ? 0.35 : 1) * (1 + luaK * 0.5);
  curseNow += ((inside ? 0 : curseK()) - curseNow) * Math.min(1, dt * 1.5); // (sem névoa extra: a região tem a mesma claridade do resto do mundo)
  hemi.color.copy(hemiNightSky).lerp(hemiDaySky, day).lerp(LUA_C.hemi, luaK * 0.75).lerp(AUR_C.hemi, aurK * 0.4);
  hemi.groundColor.copy(hemiNightGround).lerp(hemiDayGround, day).lerp(LUA_C.ground, luaK * 0.6);
  hemi.intensity = mix(0.55, 1.12, day) + (cine ? 0.6 * (1 - day) : 0) + luaK * 0.35 + aurK * 0.12;
  sun.color.copy(sunNight).lerp(sunDay, day).lerp(LUA_C.sun, luaK * 0.85).lerp(AUR_C.sun, aurK * 0.5);
  sun.intensity = mix(0.45, 2.4, day) + (cine ? 0.9 * (1 - day) : 0) + luaK * 0.6 + aurK * 0.15; // nas cinemáticas a paisagem se acende
  renderer.toneMappingExposure = mix(0.8, 0.96, day); finish.uniforms.uVig.value = mix(0.6, 0.38, day * (inside?.dg ? 0 : 1));
  { const u = finish.uniforms, inD = inside?.dg ? 1 : 0, dayW = day * (1 - inD);
    (u.uMul.value as THREE.Vector3).set(mix(0.84, 1.07, dayW), mix(0.95, 1.0, dayW), mix(1.16, 0.88, dayW)).lerp(LUA_MUL, luaK).lerp(AUR_MUL, aurK * 0.8);
    (u.uLift.value as THREE.Vector3).set(mix(0, 0.012, dayW), mix(0.004, 0.006, dayW), mix(0.03, 0, dayW)).lerp(LUA_LIFT, luaK).lerp(AUR_LIFT, aurK);
    u.uSat.value = mix(0.86, 1.04, dayW) + luaK * 0.12 + aurK * 0.06; }
  audio.choir(aurK * (inside ? 0.35 : 1), rawDt); audio.blood(luaK * (inside ? 0.4 : 1), rawDt);
  if (inside?.dg) { sun.intensity = 0.5; hemi.intensity = 0.78; (scene.fog as THREE.FogExp2).density = 0.0035; lantern.intensity = 42; } // debaixo da terra: só as tochas, os cristais e a lava iluminam
  { // sombra estável: o alvo do sol anda em passos de 1 texel do mapa de sombras (acaba com o "formigamento" das sombras)
    const dir = new THREE.Vector3(-18, 28, 10).normalize(), lr = new THREE.Vector3(0, 1, 0).cross(dir).normalize(), lu = dir.clone().cross(lr), tex = 44 / 2048 * 2;
    const a = Math.round(heroPos.dot(lr) / tex) * tex, b = Math.round(heroPos.dot(lu) / tex) * tex, c = heroPos.dot(dir);
    sun.target.position.set(0, 0, 0).addScaledVector(lr, a).addScaledVector(lu, b).addScaledVector(dir, c);
    sun.position.copy(sun.target.position).addScaledVector(dir, 40);
  }
  const fl = mix(1.0, 0.07, day); // de dia as tochas quase não iluminam (o sol manda)
  (objs.windows.color as THREE.Color).setHex(day > 0.6 ? 0x6b5a40 : 0xffc266); setVitraisDay(day);

  windU.value = t;
  waterU.uLight.value = mix(0.3, 1, day);
  const gust = THREE.MathUtils.clamp(0.45 + 0.4 * Math.sin(t * 0.37) * Math.sin(t * 0.11 + 1.3) + 0.25 * Math.sin(t * 1.3 + Math.sin(t * 0.21) * 3), 0, 1);
  gustU.value = Math.min(1, gust + aurK * 0.25); /* na Aurora corre uma brisa a mais pelo capim */
  const WDX = 0.86, WDZ = 0.5; // direção do vento
  particles.wind.x = WDX * (0.4 + gust * 3.2); particles.wind.z = WDZ * (0.4 + gust * 3.2);
  hero.setNight(night); hero.setWind(gust);
  if (!inside) npcSys.update(dt, t, heroPos, night, gust); else for (const n of npcSys.npcs) n.el.style.display = 'none';
  // raios de luz (lua à noite, sol dourado de dia)
  const shaftCol = new THREE.Color(0x7f98ff).lerp(new THREE.Color(0xffd9a0), day);
  void shaftCol;
  { const zz = zoneW(Math.floor(state.fx), Math.floor(state.fy)); audio.update(dt, { night, gust, fireDist: inside ? 3 : objs.torches.reduce((m2, tc) => Math.min(m2, tc.pos.distanceTo(heroPos)), 1e3), waterDist: inside ? 99 : fountainPos.distanceTo(heroPos), riverDist: inside ? 99 : Math.max(0, waterSD(heroPos.x, heroPos.z)), forest: zz.forest, snow: zz.snow, inside: !!inside }); }
  { // jatos da fonte: de cada bica cai água em arco; do topo sobe um filete e cai em cortina
    const fp = objs.fountainPos();
    if (fp && fp.distanceTo(heroPos) < 55) {
      const R2 = FOUNTAIN.rad;
      if (Math.random() < 0.9) { const a = Math.random() * 6.283; particles.spawn(fp.x, fp.y + FOUNTAIN.top, fp.z, { vx: Math.cos(a) * 0.9, vy: 3.3 + Math.random() * 0.8, vz: Math.sin(a) * 0.9, life: 1.0, s0: 0.22, s1: 0.14, c0: 0xcfeeff, c1: 0x6fb8ff, a: 0.9, drag: 0.1, g: 9 }); }
      for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.283 + 0.78; if (Math.random() < 0.8) particles.spawn(fp.x + Math.cos(a) * 1.0, fp.y + FOUNTAIN.bowl - 0.3, fp.z + Math.sin(a) * 1.0, { vx: Math.cos(a) * 1.6, vy: 0.8, vz: Math.sin(a) * 1.6, life: 0.7, s0: 0.2, s1: 0.12, c0: 0xe0f4ff, c1: 0x6fb8ff, a: 0.85, drag: 0.2, g: 9 }); }
      if (Math.random() < 0.7) { const a = Math.random() * 6.283; particles.spawn(fp.x + Math.cos(a) * 0.95, fp.y + FOUNTAIN.bowl - 0.15, fp.z + Math.sin(a) * 0.95, { vx: Math.cos(a) * 0.4, vy: 0, vz: Math.sin(a) * 0.4, life: 0.7, s0: 0.18, s1: 0.12, c0: 0xe0f4ff, c1: 0x6fb8ff, a: 0.7, drag: 0.1, g: 9 }); }
      if (Math.random() < 0.5) { const a = Math.random() * 6.283, rr = 0.6 + Math.random() * (R2 - 1.2); particles.spawn(fp.x + Math.cos(a) * rr, fp.y + FOUNTAIN.rim, fp.z + Math.sin(a) * rr, { vx: 0, vy: 0.5, vz: 0, life: 0.9, s0: 0.5, s1: 1.1, c0: 0xdff4ff, c1: 0xbfe0ff, a: 0.18, drag: 1 }); }
    }
  }
  for (const sm of objs.smokers) if (Math.random() < 0.25) particles.spawn(sm.x, sm.y, sm.z, { vx: 0.5, vy: 0.9, vz: 0.1, life: 2.4, s0: 0.6, s1: 2.2, c0: 0x8a8a96, c1: 0x30303c, a: 0.22, drag: 0.4 });
  /* relíquias dos caminhantes: runas pulsam; as já marcadas ganham aura dourada e fagulhas */
  for (const rl of objs.relics) {
    const nm = relicNameAt(rl.gx, rl.gy), known = !!nm && knowsRelic(nm), k = 0.5 + 0.5 * Math.sin(t * 2.2 + rl.seed);
    /* não marcada: chamado dourado no chão, pedra lisa. Marcada: as runas kármicas se gravam na pedra em azul e fica uma aura azul pequena */
    (rl.runes.material as THREE.MeshBasicMaterial).opacity = known ? 0.8 + 0.2 * k : 0.04;
    (rl.ring.material as THREE.MeshBasicMaterial).color.setHex(known ? 0x5aa8ff : 0xffc83a); (rl.ring.material as THREE.MeshBasicMaterial).opacity = known ? 0.35 + 0.2 * k : 0.55 + 0.4 * k;
    rl.ring.scale.setScalar(known ? 0.72 + 0.04 * k : 1.0 + 0.12 * k); rl.ring.rotation.y = t * (known ? 0.25 : 0.5);
    if (Math.random() < dt * (known ? 4 : 5) && rl.pos.distanceTo(heroPos) < 50) { const a = Math.random() * 6.283, rr = known ? 0.5 + Math.random() * 0.4 : 0.8 + Math.random() * 1.2; particles.spawn(rl.pos.x + Math.cos(a) * rr, rl.pos.y - (known ? 0.6 : 1.4), rl.pos.z + Math.sin(a) * rr, known ? { vy: 0.4 + Math.random() * 0.5, life: 1.4, s0: 0.1, s1: 0.02, c0: 0xd8f0ff, c1: 0x4a9aff, a: 0.9 } : { vy: 0.8 + Math.random() * 0.8, life: 1.6, s0: 0.14, s1: 0.02, c0: 0xfff0bd, c1: 0xffd24a, a: 1 }); }
  }
  /* tochas, chamas, brasas */
  const litSources: { pos: THREE.Vector3; r: number }[] = [];
  for (const tc of objs.torches) {
    const f = 1 + Math.sin(t * 1.3 + tc.seed) * 0.018 + Math.sin(t * 2.9 + tc.seed * 1.7) * 0.012;
    tc.light.intensity = tc.base * f * fl;
    { const fk = 0.5 + 0.5 * Math.sin(t * 9 + tc.seed) * Math.sin(t * 3.7 + tc.seed * 2.1); tc.flame.scale.set(0.9 + fk * 0.15, 0.85 + fk * 0.35, 0.9 + fk * 0.15); tc.flame.rotation.y = t * 0.8 + tc.seed; (tc.flame.material as THREE.MeshBasicMaterial).color.setHex(fk > 0.75 ? 0xfff0a0 : fk > 0.45 ? 0xffc040 : fk > 0.2 ? 0xff8a20 : 0xff5a10); } // a chama vive no pavio: pulsa e muda entre amarelo e vermelho
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
  eyeEl.classList.toggle('full', state.karma >= 100);
  { eyeSys.update(rawDt, eyeGaze(), hero.acting, state.karma, !profile?.eye, night); }
  globes.update(dt, game.st.hp, game.st.hpMax, game.st.mp, game.st.mpMax);
  if ((fpsN & 15) === 0) checkAwakening();
  const full = state.karma >= 100;
  if (full !== wasFull) { wasFull = full; hero.setAura(full); }
  if (full && Math.random() < 0.7) particles.spawn(heroPos.x + (Math.random() - 0.5) * 0.6, 0.2, heroPos.z + (Math.random() - 0.5) * 0.6, { vy: 1.4 + Math.random(), life: 1.2, s0: 0.9, s1: 0.1, c0: 0xfff0bd, c1: 0xf2b04a, a: 0.9 });
  if (dashT > 0) for (let i = 0; i < 3; i++) particles.spawn(heroPos.x, 0.3 + Math.random() * 1.4, heroPos.z, { vx: (Math.random() - 0.5) * 0.6, vy: 0.2, vz: (Math.random() - 0.5) * 0.6, life: 0.35, s0: 1.4, s1: 0.2, c0: 0xcfe0ff, c1: 0x6a4aff, a: 0.5, drag: 2 });
  lightPool(rawDt);
  atmos.update(rawDt, t, heroPos, aurK, luaK, gust, (x, z) => heightAt(x, z), !!inside);
  if (!inside) craftHall?.update(dt, heroPos);
  particles.update(dt);

  bloom.strength = mix(0.07, 0.03, day) * opts.bloom;
  renderer.info.reset();
  composer.render();
  if (!shown) { shown = true; document.body.classList.add('ready'); }
}
(document.getElementById('who') as HTMLElement).textContent = RACES[state.race].label;
frame();
(window as unknown as { __THREE: unknown }).__THREE = THREE;

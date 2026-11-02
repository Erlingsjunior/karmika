/* A FESTA DA CIDADE (alinhamento kármico): convite, banquete, bardos, falas, brindes, alegria e a festa em grupo. Saiu do main.ts (02/11). */
import * as THREE from 'three';
import { type Hero3D, createCharacter } from '../characters';
import { questCat } from '../quests';
import { confirmBox } from '../windows';
import { DEED_OF, FESTA_FALA } from '../dados/festa';
import { TILE_M as T } from '@karmika/shared';
import { heightAt } from '../world';
import { ramp as toonRamp } from '../toon3d';
import { songById, DEFAULT_SETLIST, STYLE_INFO, type FestaSong, SONGS } from '../festa-musica';
import { FEASTS } from '../festim';
import { type Step } from '../dialog';
import type { FestaCtx } from '../main';

export type FestaOpts = { min: number; music: boolean; meats: string[]; brews: string[]; guild?: boolean; songs?: string[]; /** convidado: a festa é de outro jogador (sem cardápio nem recompensa; só a festa, a música e a alegria) */ guest?: string; hostId?: number; song?: string };
export function createFesta(K: FestaCtx) {
let festa: { t0: number; g: THREE.Group; fw: number; talk: number; x: number; z: number; st: string; bards: { h: Hero3D; inst: string; ph: number }[]; crowd: { n: (typeof K.npcSys.npcs)[number]; ox: number; oz: number; or: number }[]; deeds: string[]; ballad: string[]; bl: number; refPh: number; coroOn: boolean; done: boolean; len?: number; paid?: FestaOpts } | null = null;
/** a missão da história que te leva embora deste lugar (dada por alguém daqui, para entregar ou visitar outro lugar) */
function leavingQuest(stName: string) { for (const id of Object.keys(K.quests.q.active)) { const d = K.quests.def(id); if (!d || questCat(d) !== 'story') continue; if (K.npcHome(d.giver)?.name !== stName) continue;
    const far = (d.turnin && K.npcHome(d.turnin)?.name && K.npcHome(d.turnin)!.name !== stName) || d.objs.some((o) => o.kind === 'visit' && o.poi !== stName && K.city.settlements.some((q) => q.name === o.poi)); if (far) return d; } return null; }
/* a festa de despedida acontece em TODO lugar onde você é amado (Amigo ou mais; em Karmika basta Conhecido), uma vez por lugar, quando uma missão te leva embora */
/** o painel do alinhamento diz, sem segredo, como está a festa do lugar onde você está (Erling, 26/10: "o Garrick não me fez o convite") */
function festaStatus() { const st = K.hereSettle(); if (!st) return '📍 Você está fora de qualquer vila ou cidade agora.'; const nm = st.name, v = K.align.get('vila', nm), need = nm === 'Karmika' ? 10 : 30, t = K.align.tier('vila', nm), lq = leavingQuest(nm), ok = (b: boolean) => b ? '✔' : '✖';
  const counted = K.quests.q.done.filter((id) => K.align.flag('q:' + id)).length;
  if (K.align.flag('festa_' + nm)) return `📍 <b>${nm}</b>: <span style="color:${t.col}">${t.name} (${Math.round(v)})</span> · 🎉 a festa de despedida daqui já aconteceu.`;
  return `📍 <b>${nm}</b>: <span style="color:${t.col}">${t.name} (${v > 0 ? '+' : ''}${Math.round(v)})</span> · ${counted}/${K.quests.q.done.length} missões feitas já contaram<br>🎉 Festa de despedida: ${ok(v >= need)} alinhamento ${need}+ · ${ok(!!lq)} ${lq ? `“${lq.name}” te leva embora` : 'nenhuma missão da história dada aqui te leva para outro lugar'}${v >= need && lq ? ' · <b>pronta: o convite chega em instantes</b>' : ''}`; }
let festaAsked = '';
function festaOffer(stName = K.hereSettle()?.name ?? '') { if (!stName || K.align.flag('festa_' + stName) || festa || festaAsked === stName) return false; const v = K.align.get('vila', stName); if (v < (stName === 'Karmika' ? 10 : 30)) return false;
  const d = leavingQuest(stName); if (!d) return false; festaAsked = stName; const host = d.giver;
  confirmBox(`<b>${host}:</b> “Soubemos que você vai partir. ${stName} inteira quer te dar uma <b>festa de despedida</b> — um anão de Brasaforja até trouxe uma carroça de cerveja. Você aceita?”<br><small>Alinhamento com ${stName}: ${K.align.tier('vila', stName).name}</small>`, '🎉 Aceitar a festa', () => festaFade([`A notícia correu de casa em casa: ${K.profile?.name || 'o caminhante'} vai partir.`, `Ao cair da tarde, a praça de ${stName} se encheu de gente, de música e de cheiro de churrasco.`], () => startFesta(stName)), { keep: true, onNo: () => K.game.logMsg(`🎉 A festa fica de pé: fale com ${host} quando quiser aceitar.`, '#ffe08a') });
  return true; }
/** a tela esmaece, as palavras aparecem, e a tela abre de novo (a festa começando, ou o dia seguinte) */
function festaFade(lines: string[], mid: () => void, after?: () => void) { const d = document.createElement('div'); d.id = 'fadefx'; d.innerHTML = lines.map((l, i) => `<p style="animation-delay:${0.9 + i * 1.6}s">${l}</p>`).join(''); document.body.appendChild(d);
  requestAnimationFrame(() => d.classList.add('on')); const hold = 900 + lines.length * 1600 + 1600;
  setTimeout(() => { try { mid(); } catch (e) { console.error(e); } }, hold - 400); setTimeout(() => { d.classList.remove('on'); d.classList.add('off'); }, hold); setTimeout(() => { d.remove(); after?.(); }, hold + 1600); }
/** os feitos do herói contados pelo povo e cantados pelo bardo (do que o jogo sabe de verdade: missões, abates, nível, alma) */
function festaDeeds(stName: string) { const nm = K.profile?.name || 'o caminhante', out: string[] = [];
  for (const id of K.quests.q.done) { const d = K.quests.def(id); if (!d || id.startsWith('b_')) continue; const home = K.npcHome(d.turnin ?? d.giver)?.name; if (home !== stName) continue; out.push(DEED_OF[id] ? `Eu vi! ${nm} ${DEED_OF[id]}!` : `Lembra de “${d.name}”? Foi ${nm} quem resolveu, e sem pedir nada em troca.`); }
  out.push(`${K.game.st.kills} bichos no chão. Eu contei, eu contei!`, `Nível ${K.game.st.lvl} e ainda com cara de quem acordou ontem!`, K.state.karma >= 100 ? `Alma boa, essa. O Olho de Marghar sorri para ${nm}.` : K.state.karma <= -100 ? `Tem sombra nesse olhar… mas aqui ninguém esquece o que ${nm} fez pela vila.` : `Nem santo nem demônio: gente da gente, ${nm}.`);
  return out; }
function festaBallad(stName: string) { const nm = K.profile?.name || 'o caminhante', d = K.quests.q.done.map((id) => DEED_OF[id]).filter(Boolean) as string[];
  return [`♪ Lá do vale de ${stName} veio ${nm}, de espada na mão ♪`, `♪ ${K.game.st.kills} bestas derrubou, sem tremer o coração ♪`, `♪ ${d[0] ? d[0].charAt(0).toUpperCase() + d[0].slice(1) : 'Ninguém viu medo nos seus olhos'}, e a vila inteira viu ♪`, `♪ ${d[1] ? d[1].charAt(0).toUpperCase() + d[1].slice(1) : 'Nem lobo nem morto o fez fugir'}, e o povo aplaudiu ♪`,
    `♪ Encham as canecas, batam os pés no chão ♪`, `♪ Que o Olho guie ${nm} por cada nova estação ♪`, `♪ Bebam todos, bebam já: ${nm} vai partir ♪`, `♪ Mas em ${stName} há sempre um lugar à mesa para ${nm} ♪`]; }
function startFesta(stName = 'Karmika', paid?: FestaOpts) { const stS = K.city.settlements.find((q) => q.name === stName); const fo = K.city.props.filter((p) => p.kind === 'fountain' && stS && Math.hypot(p.gx - stS.x, p.gy - stS.y) < stS.radius + 4).sort((a, b) => (a.variant ?? 0) - (b.variant ?? 0))[0]; if (!fo) return; if (!paid) { K.align.setFlag('festa_' + stName, 1); if (stName === 'Karmika') K.align.setFlag('festa_karmika', 1); }
  const cx = (fo.gx + fo.w / 2) * T, cz = (fo.gy + fo.h / 2) * T, y0 = heightAt(cx, cz), g = new THREE.Group(); g.position.set(cx, y0, cz); K.scene.add(g);
  const tm = (c: number, e = 0) => new THREE.MeshToonMaterial({ color: c, gradientMap: toonRamp, emissive: e ? new THREE.Color(c).multiplyScalar(e) : undefined }), M = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, ry = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = true; g.add(o); return o; };
  const R = 9, N = 10, pole = tm(0x6a4a2a), cols = [0xd84a3a, 0xe8c040, 0x3a7ad8, 0x4ab05a, 0xe8e0d0, 0xa050c0];
  const pts: THREE.Vector3[] = []; for (let i = 0; i < N; i++) { const a = i / N * 6.283, x = Math.cos(a) * R, z = Math.sin(a) * R; M(new THREE.CylinderGeometry(0.07, 0.09, 3.6, 6), pole, x, 1.8, z); M(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd080 }), x, 3.7, z); pts.push(new THREE.Vector3(x, 3.4, z)); }
  /* bandeirinhas: de poste em poste e de cada poste até o mastro no meio (acima da fonte) */
  const flag = new THREE.BufferGeometry(); flag.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.14, 0, 0, 0.14, 0, 0, 0, -0.34, 0]), 3)); flag.computeVertexNormals();
  const string = (a: THREE.Vector3, b: THREE.Vector3, sag: number) => { const n = Math.max(4, Math.round(a.distanceTo(b) / 0.42)); for (let i = 1; i < n; i++) { const t = i / n, p = a.clone().lerp(b, t); p.y -= Math.sin(t * Math.PI) * sag; const f = new THREE.Mesh(flag, new THREE.MeshBasicMaterial({ color: cols[(i + n) % cols.length], side: THREE.DoubleSide })); f.position.copy(p); f.lookAt(p.x + (b.z - a.z), p.y, p.z - (b.x - a.x)); g.add(f); } };
  const top = new THREE.Vector3(0, 6.2, 0); M(new THREE.CylinderGeometry(0.08, 0.1, 6.4, 6), pole, 0, 3.2, -0.01).visible = false;
  for (let i = 0; i < N; i++) { string(pts[i], pts[(i + 1) % N], 0.5); if (i % 2 === 0) string(pts[i], top, 0.9); }
  /* a carroça do anão: estrado, rodas, barris e o toldo listrado com a placa */
  { const c = new THREE.Group(); c.position.set(R - 2.4, 0, 2.6); c.rotation.y = -Math.PI / 2 + 0.3; g.add(c); const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, rx = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); o.castShadow = true; c.add(o); return o; };
    const wd = tm(0x7a5434); add(new THREE.BoxGeometry(2.6, 0.18, 1.5), wd, 0, 0.75, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 14), tm(0x4a2e18), sx * 0.9, 0.42, sz * 0.82, Math.PI / 2);
    for (let i = 0; i < 3; i++) { add(new THREE.CylinderGeometry(0.32, 0.32, 0.75, 12), tm(0x8a5a2a), -0.8 + i * 0.8, 1.22, 0); for (const yy of [-0.25, 0.25]) add(new THREE.TorusGeometry(0.33, 0.03, 4, 14), tm(0x3a3a40), -0.8 + i * 0.8, 1.22 + yy, 0, Math.PI / 2); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 5), wd, sx * 1.25, 1.65, sz * 0.7);
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 16; const cg = cv.getContext('2d')!; for (let i = 0; i < 8; i++) { cg.fillStyle = i % 2 ? '#e8d8b0' : '#b8302a'; cg.fillRect(i * 8, 0, 8, 16); } const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    add(new THREE.BoxGeometry(2.8, 0.06, 1.7), new THREE.MeshToonMaterial({ map: tx, gradientMap: toonRamp }), 0, 2.56, 0, 0, 0.08);
    const sc = document.createElement('canvas'); sc.width = 256; sc.height = 48; const sg = sc.getContext('2d')!; sg.fillStyle = '#2a1a10'; sg.fillRect(0, 0, 256, 48); sg.fillStyle = '#ffd890'; sg.font = 'bold 26px Georgia'; sg.textAlign = 'center'; sg.fillText(paid ? 'Festa de Brasaforja' : 'Cerveja de Brasaforja', 128, 33); const st2 = new THREE.CanvasTexture(sc); st2.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.34), new THREE.MeshBasicMaterial({ map: st2 })); sign.position.set(0, 2.25, 0.86); c.add(sign); }
  /* o churrasco: fogueira, espeto com carne, mesas compridas com canecas */
  M(new THREE.CylinderGeometry(0.7, 0.8, 0.2, 10), tm(0x5a5650), -R + 2.4, 0.1, 2.4); M(new THREE.ConeGeometry(0.4, 0.7, 6), new THREE.MeshBasicMaterial({ color: 0xff8a2a }), -R + 2.4, 0.5, 2.4);
  for (const sz of [-0.6, 0.6]) M(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 5), pole, -R + 2.4, 0.7, 2.4 + sz); M(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 5), tm(0x3a3a40), -R + 2.4, 1.35, 2.4).rotation.x = Math.PI / 2; M(new THREE.SphereGeometry(0.3, 10, 8), tm(0x9a4a2a), -R + 2.4, 1.3, 2.4).scale.set(1, 0.7, 1.6);
  for (const [x, z, ry] of [[-3.2, R - 2.2, 0], [3.2, R - 2.2, 0]] as const) { M(new THREE.BoxGeometry(3.2, 0.1, 0.9), tm(0x8a6a44), x, 0.82, z, ry); for (const sx of [-1.4, 1.4]) M(new THREE.BoxGeometry(0.1, 0.8, 0.8), pole, x + sx, 0.4, z, ry); for (let i = 0; i < 4; i++) M(new THREE.CylinderGeometry(0.07, 0.06, 0.16, 8), tm(0xc8a050), x - 1.2 + i * 0.8, 0.95, z + 0.15, ry); }
  /* o palco dos artistas: tablado com degraus, toldo vermelho e dourado, e três músicos — alaúde, tambor e flauta — com o Bardo à frente */
  const stage = new THREE.Group(); stage.position.set(0, 0, -R + 1.6); g.add(stage); { const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; stage.add(o); return o; };
    const wd = tm(0x8a5a32), wd2 = tm(0x5a3a20); add(new THREE.BoxGeometry(6, 0.6, 3), wd, 0, 0.3, 0); for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(1.6, 0.2, 0.4), wd2, 0, 0.1 + i * 0.2, 1.7 - i * 0.2).scale.y = 1;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.CylinderGeometry(0.09, 0.1, 3.2, 6), wd2, sx * 2.8, 2.2, sz * 1.3);
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 16; const cg = cv.getContext('2d')!; for (let i = 0; i < 8; i++) { cg.fillStyle = i % 2 ? '#d9b45a' : '#9a2a2a'; cg.fillRect(i * 8, 0, 8, 16); } const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = THREE.RepeatWrapping; tx.repeat.set(2, 1);
    add(new THREE.BoxGeometry(6.2, 0.08, 3.2), new THREE.MeshToonMaterial({ map: tx, gradientMap: toonRamp }), 0, 3.85, 0); for (let i = 0; i < 9; i++) add(new THREE.ConeGeometry(0.33, 0.5, 3), new THREE.MeshToonMaterial({ color: i % 2 ? 0xd9b45a : 0x9a2a2a, gradientMap: toonRamp }), -2.8 + i * 0.7, 3.55, 1.6).rotation.x = Math.PI;
    for (const sx of [-1, 1]) { add(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd080 }), sx * 2.8, 3.6, 1.3); } }
  const bards: { h: Hero3D; inst: string; ph: number }[] = [];
  if (paid && !paid.music) stage.visible = false; /* sem música contratada: sem palco e sem bardos */
  for (const [i, [, tint, inst]] of (paid && !paid.music ? [] : [['Bardo Eirik', 0x6a2a6a, 'alaude'], ['Tamborileira Sigrun', 0x2a5a3a, 'tambor'], ['Flautista Ove', 0x7a5a2a, 'flauta']] as const).entries()) {
    const h = createCharacter('nordic', { static: true, civil: 'human', cloth: tint }); h.root.scale.setScalar(1); h.root.position.set(-1.6 + i * 1.6 + (i === 0 ? 0 : 0), 0.6, 0.2 - (i === 0 ? -0.6 : 0)); h.root.rotation.y = 0; stage.add(h.root);
    const im = new THREE.Group(); if (inst === 'alaude') { const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), tm(0x9a6a2a)); body.scale.set(1, 1.3, 0.5); im.add(body); const neck = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.04), tm(0x5a3a1a)); neck.position.set(0.25, 0.25, 0); neck.rotation.z = -0.9; im.add(neck); im.position.set(0.05, 1.05, 0.28); im.rotation.z = 0.5; }
    else if (inst === 'tambor') { const dr = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16), tm(0xe8dcc0)); dr.rotation.x = Math.PI / 2 - 0.3; im.add(dr); im.position.set(0, 1.1, 0.32); }
    else { const fl = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6), tm(0x8a6a3a)); fl.rotation.z = Math.PI / 2; im.add(fl); im.position.set(0.12, 1.45, 0.25); }
    h.root.add(im); bards.push({ h, inst, ph: i * 1.3 }); }
  /* o povo da vila vem para a praça: em roda, de frente para o palco e para a fonte (volta para casa quando a festa acaba) */
  const crowd: { n: (typeof K.npcSys.npcs)[number]; ox: number; oz: number; or: number }[] = [];
  { const mine = K.npcSys.npcs.filter((n) => !n.def.route && K.settleAt(n.def.x / T, n.def.z / T, 6)?.name === stName).slice(0, 18); for (const n of mine) K.npcSys.ensure(n);
    const fr = Math.max(fo.w, fo.h) * T * 0.5 + 2.0; mine.forEach((n, i) => { crowd.push({ n, ox: n.def.x, oz: n.def.z, or: n.def.radius }); const a = (i / Math.max(1, mine.length)) * 6.283 + 0.3, rr = fr + (i % 3) * 1.0; /* em volta da fonte, nunca dentro */ n.def.x = cx + Math.cos(a) * rr; n.def.z = cz + Math.sin(a) * rr; n.def.radius = 0.6; n.target = null; n.wait = 0; }); }
  K.nightOverride = 1; K.nightTarget = 1; /* a festa é de noite: lanternas, fogos e brindes */
  { const L1 = new THREE.PointLight(0xffb060, 30, 26, 1.6); L1.position.set(0, 4.5, 0); g.add(L1); const L2 = new THREE.PointLight(0xff8a50, 18, 16, 1.6); L2.position.set(0, 3, -R + 2); g.add(L2); } /* duas luzes só (desempenho) */
  festa = { t0: performance.now(), g, fw: 0, talk: 0, x: cx, z: cz, st: stName, bards, crowd, deeds: festaDeeds(stName), ballad: festaBallad(stName), bl: 0, refPh: -1, coroOn: false, done: false, len: paid ? paid.min * 60000 : FESTA_LEN, paid };
  festaGuests.clear(); giveJoy();
  if (paid?.guest) { if (paid.music) { const L = (paid.songs ?? []).map(songById); K.audio.festaStart(L.length ? L : undefined); const cur = paid.song ? songById(paid.song) : null; if (cur && L.length) K.audio.festaPlay(cur); }
    K.game.logMsg(`🎉 Você entrou na festa de ${paid.guest} na praça de ${stName}. ✨ Aura de Alegria: +10% em tudo por 1 turno.`, '#ffe08a'); return; }
  festaBroadcast();
  if (paid) { const menu = [...paid.meats, ...paid.brews]; for (const k of menu) K.inv.add(k, 2, true); if (paid.music) K.audio.festaStart((paid.songs?.length ? paid.songs : DEFAULT_SETLIST).map(songById));
    K.game.logMsg(`🎉 Os anões de Brasaforja armaram a sua festa na praça de ${paid.guild ? stName + ' (salão da guilda)' : stName}: ${paid.min} min${paid.music ? ', com música' : ''}.`, '#ffe08a');
    if (menu.length) K.game.logMsg(`🍖 Na mesa: ${menu.map((k) => FEASTS[k]?.name ?? k).join(', ')}. Duas porções de cada são suas.`, '#ffd27a'); return; }
  K.inv.add('beer', 2); K.inv.add('skewer', 2); K.game.gainXp(Math.round(K.game.xpNeed() * 0.25)); K.addKarma(2); K.align.add('vila', stName, 10, 'a festa de despedida');
  K.audio.festaStart(); K.game.logMsg('✨ Aura de Alegria: +10% em tudo por 1 turno (30 min).', '#ffe08a'); K.game.logMsg(`🎉 A festa de despedida começa na praça de ${stName}! Cerveja do anão, churrasco e fogos por tudo o que você fez.`, '#ffe08a'); K.game.logMsg('🍺 Ganhou 2× Cerveja de Karmika e 2× Espetinho de javali. +2 de karma.', '#ffe08a'); }
var FESTA_LEN = 240000; /* 4 minutos (despedida) */
const say2 = (n: (typeof K.npcSys.npcs)[number], line: string, secs = 4.5) => { const q = n as unknown as { bark?: string; barkT?: number }; q.bark = line; q.barkT = secs; };
function festaTick() { if (!festa || festa.done) return; const F = festa, el = performance.now() - F.t0, nm = K.profile?.name || 'caminhante';
  if (Math.hypot(K.heroPos.x - F.x, K.heroPos.z - F.z) < 80) {
    if (Math.random() < 0.55) K.evFx('firework', F.x + (Math.random() - 0.5) * 34, heightAt(F.x, F.z) + 14 + Math.random() * 12, F.z + (Math.random() - 0.5) * 34); if (Math.random() < 0.25) K.audio.boom();
    /* o coro: quando a música vira coro, a roda inteira canta o seu nome */
    const coro = K.audio.festaPart === 'coro'; if (coro && !F.coroOn) { F.coroOn = true; const L = [`${nm} é um bom companheirooo!`, `${nm} é um bom companheirooo!`, `${nm} é um bom companheirooo!`, 'Ninguém pode negaaar!'];
      F.crowd.forEach((c, i) => { setTimeout(() => say2(c.n, L[Math.min(3, Math.floor(i / Math.max(1, F.crowd.length / 4)))] + ' 🍺', 3.6), i * 220); });
      L.forEach((l, i) => setTimeout(() => { const c = F.crowd[i % Math.max(1, F.crowd.length)]; if (c) say2(c.n, l + ' 🍺', 3); }, i * 3000)); }
    if (!coro) F.coroOn = false;
    /* o bardo canta a balada dos seus feitos; o povo conta as suas histórias */
    const sgL = K.audio.festaSong && K.audio.festaSong.style !== 'giga' ? K.audio.festaSong : null; /* 28/10: o repertório — o bardo canta o verso, a praça canta o refrão */
    if (sgL && K.audio.festaPart === 'refrao' && F.refPh !== K.audio.festaPhrase) { F.refPh = K.audio.festaPhrase; F.crowd.forEach((c, i) => setTimeout(() => say2(c.n, sgL.refrao, 3.4), i * 120)); }
    F.talk -= 1; if (F.talk <= 0) { F.talk = 4; const bard = F.bards[0]; if (!coro && bard) { const line = sgL ? (K.audio.festaPart === 'verso' ? '🎤 ' + sgL.verso[F.bl++ % sgL.verso.length] : '') : F.ballad[F.bl++ % F.ballad.length]; if (line) K.game.dmgText(new THREE.Vector3().setFromMatrixPosition(bard.h.root.matrixWorld).setY(heightAt(F.x, F.z) + 3.4), line, false, '#ffe08a'); }
      const c = F.crowd[Math.floor(Math.random() * F.crowd.length)]; if (c && !coro && K.audio.festaPart !== 'refrao') say2(c.n, Math.random() < 0.6 ? F.deeds[Math.floor(Math.random() * F.deeds.length)] : ['À saúde de ' + nm + '!', 'Mais cerveja aqui! O anão trouxe barril para a vila inteira!', F.paid?.meats.length ? `Essa ${FEASTS[F.paid.meats[Math.floor(Math.random() * F.paid.meats.length)]]?.name ?? 'carne'} está divina!` : 'Essa carne está divina!', F.paid?.brews.length ? `Mais uma ${FEASTS[F.paid.brews[Math.floor(Math.random() * F.paid.brews.length)]]?.name ?? 'cerveja'}, anão!` : 'Saúde!', 'Que o caminho seja leve, ' + nm + '!', 'Dança, ' + nm + '! Hoje a festa é sua!'][Math.floor(Math.random() * 5)]); }
    /* o povo bebe e dança: de vez em quando cada um ergue a caneca */
    for (const c of F.crowd) if (Math.random() < 0.08 && !c.n.hero.acting) c.n.hero.act('drink');
  }
  if (el > (F.len ?? FESTA_LEN)) { F.done = true; festaFade(['A música foi morrendo devagar, uma lanterna de cada vez.', 'A noite passou, o dia passou, e mais uma noite.', 'No alvorecer, com a cabeça ainda girando e o coração cheio, você está pronto para seguir caminhando.'], () => festaEnd()); } }
/* bardos tocando: o corpo balança no ritmo (no quadro) */
const NOTE_TEX = ['♪', '♫', '♩', '♬'].map((ch, i) => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; g.font = 'bold 50px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#000'; g.shadowBlur = 6; g.fillStyle = ['#ffe08a', '#ffffff', '#ffb0d0', '#9ad7ff'][i]; g.fillText(ch, 32, 34); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx; });
const notes: { s: THREE.Sprite; v: THREE.Vector3; life: number; ph: number }[] = [];
const festaCd = document.createElement('div'); festaCd.id = 'festacd'; document.body.appendChild(festaCd); let festaCdTxt = '';
function festaAnim(dt: number, t: number) { if (!festa) { if (festaCdTxt) { festaCdTxt = ''; festaCd.style.display = 'none'; } return; }
  { const left = Math.max(0, (festa.len ?? FESTA_LEN) - (performance.now() - festa.t0)), m = Math.floor(left / 60000), sec = Math.floor((left % 60000) / 1000), sg = K.audio.festaSong, tx = `🎉 ${festa.paid?.guest ? 'Festa de ' + festa.paid.guest : festa.paid ? 'Festa dos anões' : 'Festa de despedida'} em ${festa.st} · ${m}:${String(sec).padStart(2, '0')}${festaGuests.size ? ` · 👥 ${festaGuests.size + 1}` : ''}`; if (tx + (sg?.id ?? '') !== festaCdTxt) { if (!festaCd.firstChild) festaCd.innerHTML = '<span></span><small></small><button data-req>🎶 Pedir música</button>'; const [sp, sm, bt] = festaCd.children as unknown as HTMLElement[]; festaCdTxt = tx + (sg?.id ?? ''); sp.textContent = tx; sm.innerHTML = sg ? `${STYLE_INFO[sg.style].icon} Tocando agora: <b>${sg.title}</b>` : ''; sm.style.display = sg ? '' : 'none'; bt.style.display = !festa.paid?.guest && festa.paid?.music !== false ? '' : 'none'; festaCd.style.display = 'block'; } /* (o texto troca, o botão fica: recriar a cada segundo engolia o clique) */ } /* notas musicais subindo do palco para o céu */
  if (Math.random() < dt * 5) { const b = festa.bards[Math.floor(Math.random() * festa.bards.length)]; if (b) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: NOTE_TEX[Math.floor(Math.random() * 4)], transparent: true, depthWrite: false })); const wp = new THREE.Vector3().setFromMatrixPosition(b.h.root.matrixWorld); sp.position.set(wp.x + (Math.random() - 0.5) * 0.6, wp.y + 2.1, wp.z); sp.scale.setScalar(0.55 + Math.random() * 0.3); K.scene.add(sp); notes.push({ s: sp, v: new THREE.Vector3((Math.random() - 0.5) * 0.6, 1.1 + Math.random() * 0.6, (Math.random() - 0.5) * 0.6), life: 4.5, ph: Math.random() * 6 }); } }
  for (let i = notes.length - 1; i >= 0; i--) { const q = notes[i]; q.life -= dt; q.ph += dt * 3; q.s.position.addScaledVector(q.v, dt); q.s.position.x += Math.sin(q.ph) * dt * 0.5; (q.s.material as THREE.SpriteMaterial).opacity = Math.min(1, q.life / 1.5); if (q.life <= 0) { K.scene.remove(q.s); (q.s.material as THREE.SpriteMaterial).dispose(); notes.splice(i, 1); } } for (const b of festa.bards) { b.ph += dt; b.h.update(dt, t, 0, null); b.h.root.position.y = 0.6 + Math.abs(Math.sin(b.ph * 5.2)) * 0.05; b.h.root.rotation.y = Math.sin(b.ph * 1.3) * 0.25; } }
/* conversar na festa (Erling, 25/10): o povo agradece, conversa sobre o que você fez e brinda com você */
const toasted = new Set<string>();
function festaTalk(n: (typeof K.npcSys.npcs)[number]) { if (!festa) return; const nm = n.def.name, me = K.profile?.name || 'caminhante', deed = festa.deeds[Math.floor(Math.random() * Math.max(1, festa.deeds.length - 3))] ?? '';
  const own = FESTA_FALA[nm] ?? [`Obrigado por tudo, ${me}. A vila dorme melhor por sua causa.`, `${deed || 'A gente viu tudo o que você fez.'}`.replace(/^Eu vi! /, 'Eu vi com estes olhos: ')];
  const steps: Step[] = [own[0], { r: [
    { t: '🍻 Um brinde! A Karmika e a todos vocês!', a: `À sua saúde, ${me}! Que a estrada seja leve e a caneca nunca vazia! 🍻`, flag: 'brinde' },
    { t: 'Vou sentir falta de vocês.', a: `E nós de você. ${own[1] ?? ''} Agora brinda comigo, vai! 🍻`, flag: 'brinde' },
    { t: 'Conta de novo aquela história.', a: `${deed.replace(/^Eu vi! /, '') || 'Você não lembra? A vila inteira lembra.'} E todo mundo aplaudiu! Brinda comigo! 🍻`, flag: 'brinde' } ] }];
  let pr: string | null = null; try { pr = K.portraitOf(nm, (K.npcSys.ensure(n), n.hero.root)); } catch { pr = null; }
  K.openDlg({ name: nm, role: `${n.def.role} · na festa`, portrait: pr, text: '', choices: [], onAccept: () => {}, onTurnIn: () => {}, meet: { quest: { id: 'festa', name: '🎉 A festa de despedida', giver: nm, objs: [], lvl: 1, xp: 0, gold: 0, text: '' } as never, steps, onEnd: () => festaToast(n) } }); }
function festaToast(n: (typeof K.npcSys.npcs)[number]) { if (!festa) return; const nm = n.def.name;
  if (!K.hero.acting) K.hero.act('drink'); n.hero.act('drink'); K.audio.equip('jewel'); setTimeout(() => K.audio.equip('metal'), 120);
  const p = n.pos.clone().lerp(K.heroPos, 0.5); for (let i = 0; i < 16; i++) K.particles.spawn(p.x, p.y + 1.6, p.z, { vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 1.5, vz: (Math.random() - 0.5) * 2, life: 0.7, s0: 0.2, s1: 0.04, c0: 0xffe8a0, c1: 0xd8a040, a: 1 });
  say2(n, `À saúde de ${K.profile?.name || 'caminhante'}! 🍻`, 3.5);
  if (!toasted.has(nm)) { toasted.add(nm); K.align.add('vila', festa.st, 1); K.game.logMsg(`🍻 Você brindou com ${nm}. (+1 com ${festa.st})`, '#ffe08a'); } else K.game.logMsg(`🍻 Mais um brinde com ${nm}!`, '#e8d8b0'); }
function festaEnd() { if (!festa) return; if (!festa.paid?.guest) K.netRef?.x('x:festaEnd', {}); festaGuests.clear(); for (const q of notes) K.scene.remove(q.s); notes.length = 0; for (const c of festa.crowd) { c.n.def.x = c.ox; c.n.def.z = c.oz; c.n.def.radius = c.or; c.n.target = null; } K.scene.remove(festa.g); festa = null; K.game.st.hp = K.game.st.hpMax; K.game.st.mp = K.game.st.mpMax; K.nightOverride = 0.3; K.nightTarget = 0.3; /* o alvorecer do dia seguinte */ setTimeout(() => { K.nightOverride = null; }, 90000); K.game.logMsg('🌅 Alvorecer. Descansado depois da festa: vida e magia cheias. A estrada espera.', '#ffe08a'); }

/* ---------- A FESTA EM GRUPO (28/10, Erling): "se eu estiver em party todos participam; quem chegar perto e clicar em mim ou
   em quem estiver participando pede para entrar, e nós permitimos; aura de alegria que dura 1 turno, +10% de tudo" ----------
   Quem dá a festa avisa a sala (x:festa) a cada 8 s: lugar, tempo que falta, repertório, a música de agora e os convidados.
   Os companheiros de GRUPO entram sozinhos (perto da praça na hora, ou quando chegarem lá). Os outros pedem (x:festaAsk) e
   o anfitrião aceita ou não (x:festaOk). A Aura de Alegria (+10% em vida, vigor, dano, defesa, crítico, velocidade, XP e
   ouro; dentro do teto de ±30% dos bônus de situação) dura 1 turno = 30 min reais, e fica gravada (sobrevive a recarregar). */
const festaGuests = new Set<number>();
const festasNet = new Map<number, { st: string; host: string; guests: number[]; left: number; songs: string[]; song?: string; music: boolean; at: number }>();
let festaInvite: { hostId: number; host: string; st: string } | null = null, festaAskT = 0;
const JOY_KEY = 'karmika.alegria.v1', JOY_MS = 30 * 60000;
function joyUntil() { return (K.game.st as unknown as { joy?: number }).joy ?? 0; }
function giveJoy() { const u = Date.now() + JOY_MS; (K.game.st as unknown as { joy?: number }).joy = u; try { localStorage.setItem(JOY_KEY, String(u)); } catch { /* */ } (K.game.st as unknown as { recalc?: (() => void) | null }).recalc?.(); setTimeout(() => (K.game.st as unknown as { recalc?: (() => void) | null }).recalc?.(), JOY_MS + 500); }
{ let u = 0; try { u = +(localStorage.getItem(JOY_KEY) || 0); } catch { /* */ } if (u > Date.now()) { (K.game.st as unknown as { joy?: number }).joy = u; setTimeout(() => (K.game.st as unknown as { recalc?: (() => void) | null }).recalc?.(), 50); setTimeout(() => (K.game.st as unknown as { recalc?: (() => void) | null }).recalc?.(), u - Date.now() + 500); } }
function festaBroadcast() { const F = festa; if (!F || F.done || F.paid?.guest || K.net.state !== 'on') return; const left = Math.max(0, (F.len ?? FESTA_LEN) - (performance.now() - F.t0));
  K.net.x('x:festa', { st: F.st, host: K.profile?.name || 'Caminhante', left: Math.round(left), guests: [...festaGuests], songs: F.paid?.songs ?? [], song: K.audio.festaSong?.id ?? '', music: F.paid ? F.paid.music : true }); }
setInterval(festaBroadcast, 8000);
K.audio.onFestaSong = (sg: FestaSong) => { if (!festa) return; if (sg.style !== 'giga') K.game.logMsg(`🎶 Os bardos atacam: “${sg.title}” (${STYLE_INFO[sg.style].name}).`, STYLE_INFO[sg.style].col); festaBroadcast(); };
const festaJoin = (hostId: number, m: { st: string; host: string; left: number; songs: string[]; song?: string; music: boolean }) => { if (festa) return; festaInvite = null;
  festaFade([`${m.host} abriu a roda para você.`, `A praça de ${m.st} ferve: bandeirinhas, churrasco e os bardos no palco.`], () => startFesta(m.st, { min: Math.max(1, m.left / 60000), music: m.music, meats: [], brews: [], songs: m.songs, song: m.song, guest: m.host, hostId })); };
const nearSt = (st: string) => !K.inside && K.hereSettle()?.name === st;
K.net.onX('x:festa', (from, m) => { const d = { st: String(m.st), host: String(m.host), guests: (m.guests as number[]) ?? [], left: +(m.left as number) || 0, songs: (m.songs as string[]) ?? [], song: (m.song as string) || undefined, music: m.music !== false, at: Date.now() }; festasNet.set(from, d);
  /* já sou convidado: acompanho a música do anfitrião */
  if (festa?.paid?.guest && festa.paid.hostId === from && d.song && K.audio.festaSong?.id !== d.song) K.audio.festaPlay(songById(d.song));
  const mate = !!K.net.party && K.net.party.members.includes(from) && from !== K.net.myId; if (!mate || festa || d.left < 20000) return;
  if (nearSt(d.st)) festaJoin(from, d); else if (festaInvite?.hostId !== from) { festaInvite = { hostId: from, host: d.host, st: d.st }; K.game.logMsg(`🎉 ${d.host}, do seu grupo, está dando uma festa na praça de ${d.st}. Vá até lá: você entra sozinho.`, '#ffe08a'); } });
K.net.onX('x:festaEnd', (from) => { festasNet.delete(from); if (festaInvite?.hostId === from) festaInvite = null; if (festa?.paid?.guest && festa.paid.hostId === from) festa.len = Math.min(festa.len ?? 0, performance.now() - festa.t0 + 3000); });
K.net.onX('x:festaAsk', (from, m) => { if (m.to !== K.net.myId || !festa || festa.done || festa.paid?.guest) return; const nm = K.net.nameOf(from); K.audio.chime();
  confirmBox(`🎉 <b>${nm}</b> chegou perto da festa e pede para entrar na roda.`, '✔ Pode entrar', () => { festaGuests.add(from); K.net.x('x:festaOk', { to: from }); festaBroadcast(); K.game.logMsg(`🎉 ${nm} entrou na festa.`, '#ffe08a'); }, { onNo: () => { K.net.x('x:festaNo', { to: from }); } }); });
K.net.onX('x:festaOk', (from, m) => { if (m.to !== K.net.myId) return; const d = festasNet.get(from); if (d) festaJoin(from, d); });
K.net.onX('x:festaNo', (from, m) => { if (m.to !== K.net.myId) return; K.game.logMsg(`🎉 ${K.net.nameOf(from)} preferiu manter a festa só com os de casa desta vez.`, '#c8b890'); });
/** clique (sem Ctrl) num jogador que está numa festa: pedir para entrar (o pedido vai sempre para o anfitrião) */
function festaHostOf(id: number) { const now = Date.now(); for (const [h, d] of festasNet) { if (now - d.at > 20000) { festasNet.delete(h); continue; } if (h === id || d.guests.includes(id)) return h; } return 0; }
function festaAskJoin(id: number) { const h = festaHostOf(id); if (!h || festa) return false; const d = festasNet.get(h)!;
  if (!nearSt(d.st)) { K.game.logMsg(`🎉 Chegue mais perto da praça de ${d.st} para pedir para entrar na festa.`, '#c8b890'); return true; }
  if (performance.now() < festaAskT) { K.game.logMsg('🎉 O pedido já foi; espere a resposta.', '#c8b890'); return true; }
  confirmBox(`🎉 ${h === id ? `<b>${d.host}</b> está dando uma festa.` : `<b>${K.net.nameOf(id)}</b> está na festa de <b>${d.host}</b>.`}<br>Pedir para entrar na roda?<br><small>Quem entra ganha a ✨ Aura de Alegria: +10% em tudo por 1 turno.</small>`, '🎉 Pedir para entrar', () => { festaAskT = performance.now() + 30000; K.net.x('x:festaAsk', { to: h }); K.game.logMsg(`🎉 Pedido enviado a ${d.host}.`, '#ffe08a'); });
  return true; }
/* o convite do grupo vale quando você chega à praça */
setInterval(() => { if (!festaInvite || festa) return; const d = festasNet.get(festaInvite.hostId); if (!d || Date.now() - d.at > 20000) { festaInvite = null; return; } if (nearSt(d.st)) festaJoin(festaInvite.hostId, d); }, 1500);
/* pedir música: o anfitrião escolhe, os bardos tocam na hora (e os convidados ouvem a mesma) */
festaCd.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('[data-req]') || !festa) return; K.audio.click?.();
  const draw = () => { const cur = K.audio.festaSong?.id; K.dwarfEl.innerHTML = `<div class="pn relpn" style="width:min(520px,94vw);height:min(600px,78vh);overflow:auto"><h2>🎶 Pedir uma música aos bardos <button data-x>✕</button></h2><p style="color:#c8b890;font-size:13px;margin:4px 0 8px">Eirik, Sigrun e Ove tocam qualquer estilo — no alaúde, no tambor e na flauta. A música pedida começa na hora (e quem está na sua festa ouve a mesma).</p><div style="display:grid;gap:5px">${SONGS.map((sg) => { const si = STYLE_INFO[sg.style]; return `<button data-play="${sg.id}" style="text-align:left;padding:7px 9px;font:13px Georgia;color:${sg.id === cur ? '#1a1008' : '#ffe0a0'};background:${sg.id === cur ? '#e0b048' : 'rgba(20,14,10,.8)'};border:1px solid #5a4630;border-radius:3px">${si.icon} <b>${sg.title}</b> <small style="color:${sg.id === cur ? '#3a2410' : si.col}">· ${si.name} · ${sg.bpm} bpm</small></button>`; }).join('')}</div></div>`; K.dwarfEl.style.display = 'flex'; };
  draw(); K.dwarfEl.onclick = (ev) => { const t = ev.target as HTMLElement; if (t === K.dwarfEl || t.closest('[data-x]')) { K.dwarfEl.style.display = 'none'; return; } const b = t.closest('[data-play]') as HTMLElement | null; if (!b) return; K.audio.festaPlay(songById(b.dataset.play!)); draw(); }; });
/* a aura de alegria: notinhas e confetes girando em volta do herói enquanto dura */
const joyAura = new THREE.Group(); joyAura.visible = false; K.scene.add(joyAura);
{ const CONF = ['#ffd24a', '#ff7aa8', '#7ad7ff', '#9aff7a'].map((c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 32; const g2 = cv.getContext('2d')!; g2.fillStyle = c; g2.shadowColor = c; g2.shadowBlur = 8; g2.beginPath(); g2.arc(16, 16, 6, 0, 6.3); g2.fill(); const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx; });
  for (let i = 0; i < 8; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: i % 2 ? NOTE_TEX[i % 4] : CONF[(i >> 1) % 4], transparent: true, depthWrite: false, opacity: 0.85 })); sp.scale.setScalar(i % 2 ? 0.42 : 0.22); sp.userData.a = i / 8 * 6.283; joyAura.add(sp); } }
  return { startFesta, leavingQuest, get festa() { return festa; }, festaStatus, get festaAsked() { return festaAsked; }, set festaAsked(v: typeof festaAsked) { festaAsked = v; }, festaOffer, festaTick, joyUntil, joyAura, festaTalk, festaFade, festasNet, festaAskJoin, festaAnim };
}

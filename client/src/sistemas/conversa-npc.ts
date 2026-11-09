/* CONVERSA COM NPC: o retrato (cabeça 3D renderizada e guardada), missões para entregar e novas, comércio, a forja de elite. Saiu do main.ts (02/11). */
import * as THREE from 'three';
import { SHOP_OF, ELITE_FORGE } from '../dados/npcs-dados';
import { type Choice } from '../dialog';
import { type Fac, myFac } from '../faccoes';
import { ECOS, FRIO } from '../falas';
import { eyeSees } from '../surrender';
import { TILE_M as T } from '@karmika/shared';
import { ITEMS as ITEMS_TBL } from '../inventory';
import { genGear } from '../loot';
import type { ConversaNpcCtx } from '../main';

export function createConversaNpc(K: ConversaNpcCtx) {
/* retrato do NPC: renderiza a cabeça do modelo 3D uma vez e guarda como imagem */
const portraits = new Map<string, string>();
let portraitYaw = 0.42; /* a criação de personagem gira o retrato (02/11) */
function portraitOf(name: string, root: THREE.Object3D, full = false): string {
  const c = portraits.get(name); if (c) return c;
  const w = full ? 300 : 64, h = full ? 480 : 72, rt = new THREE.WebGLRenderTarget(w, h);
  const ps = new THREE.Scene(); ps.background = new THREE.Color(0x14101a);
  ps.add(new THREE.HemisphereLight(0xfff4e0, 0x3a2a30, full ? 2.3 : 1.3)); const dl = new THREE.DirectionalLight(0xffffff, full ? 2.6 : 1.7); dl.position.set(1.2, 2.2, 2.4); ps.add(dl);
  const parent = root.parent, pos = root.position.clone(), rot = root.rotation.clone(), vis = root.visible;
  ps.add(root); root.position.set(0, 0, 0); root.rotation.set(0, portraitYaw, 0); root.visible = true; (root.userData.hideProc as (() => void) | undefined)?.(); root.updateMatrixWorld(true);
  const xr: THREE.Object3D[] = []; root.traverse((o) => { const mt = (o as THREE.Mesh).material as THREE.Material | undefined; if (o.visible && (o.userData.xray || (mt && !Array.isArray(mt) && mt.depthTest === false))) { xr.push(o); o.visible = false; } }); // a silhueta azul (atrás das casas) não entra no retrato
  if (full && K.peleSys.creating && K.peleSys.skinModel && root === K.hero.root) { /* 02/11: na criação só o modelo do artista aparece (o martelo do anão tapava o corpo) */ const inSkin = new Set<THREE.Object3D>(); K.peleSys.skinModel.traverse((o) => inSkin.add(o)); root.traverse((o) => { if ((o as THREE.Mesh).isMesh && o.visible && !inSkin.has(o)) { xr.push(o); o.visible = false; } }); }
  /* 07/11 (Erling: "troquei de item e ele ficou mais baixo"): o enquadramento usava a caixa do modelo inteiro, e a arma/escudo/elmo mudavam a caixa.
     Agora, quando há esqueleto, mede pela cabeça: o retrato fica igual com qualquer equipamento */
  let headY = -1; root.traverse((o) => { if (headY < 0 && (o as THREE.Bone).isBone && /head/i.test(o.name) && !/end|top/i.test(o.name)) headY = o.getWorldPosition(new THREE.Vector3()).y; });
  const box = new THREE.Box3().setFromObject(root), top = headY > 0.5 ? headY + 0.2 : Math.min(box.max.y, 1.97 * (root.scale.y || 1)) /* a antena do reator do tecnocrata passava da cabeça e o retrato mirava nela */, cy = full ? top * 0.52 : top - 0.26, dist = full ? top * 1.45 + 0.45 : 1.15;
  const cam = new THREE.PerspectiveCamera(full ? 34 : 30, w / h, 0.05, 30); cam.position.set(full ? 0.3 : 0.12, cy + (full ? 0.15 : 0.08), dist); cam.lookAt(0, cy - 0.02, 0); cam.layers.enableAll();
  const bgc = new THREE.Color(); K.renderer.getClearColor(bgc); const alpha = K.renderer.getClearAlpha(), sm = K.renderer.shadowMap.autoUpdate;
  K.renderer.shadowMap.autoUpdate = false; K.renderer.setRenderTarget(rt); K.renderer.setClearColor(0x14101a, 1); K.renderer.clear(); K.renderer.render(ps, cam);
  const px = new Uint8Array(w * h * 4); K.renderer.readRenderTargetPixels(rt, 0, 0, w, h, px);
  K.renderer.setRenderTarget(null); K.renderer.setClearColor(bgc, alpha); K.renderer.shadowMap.autoUpdate = sm; rt.dispose();
  for (const o of xr) o.visible = true;
  ps.remove(root); if (parent) parent.add(root); root.position.copy(pos); root.rotation.copy(rot); root.visible = vis;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d')!, im = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const si = ((h - 1 - y) * w + x) * 4, di = (y * w + x) * 4; im.data[di] = px[si]; im.data[di + 1] = px[si + 1]; im.data[di + 2] = px[si + 2]; im.data[di + 3] = 255; }
  g.putImageData(im, 0, 0); const url = cv.toDataURL(); if (root.userData.hideProc || full) portraits.set(name, url); /* 09/11: sem o modelo de arte encaixado ainda, não guarda — na próxima conversa fotografa de novo, já com ele */ return url;
}
/* conversa com um NPC: missões para entregar, missões novas, comércio, quadro, conversa */
function talkTo(n: (typeof K.npcSys.npcs)[number]) {
  const nm = n.def.name, shopId = SHOP_OF[nm] ?? K.SHOP_BY_NAME.get(nm) ?? null;
  { /* encontro de missão (24/10): quem a missão mandou procurar tem conversa própria; no fim, o objetivo conta */
    const mq = Object.keys(K.quests.q.active).map((id) => K.quests.def(id)).find((d) => !!d?.meet?.[nm] && d.objs.some((o, i) => o.kind === 'talk' && o.npc === nm && K.quests.objProg(d, i) < 1));
    if (mq) { let pr: string | null = null; try { pr = portraitOf(nm, (K.npcSys.ensure(n), n.hero.root)); } catch { pr = null; }
      K.openDlg({ name: nm, role: n.def.role, portrait: pr, text: '', choices: [], onAccept: () => {}, onTurnIn: () => {}, meet: { quest: mq, steps: mq.meet![nm], onEnd: () => { K.quests.onTalk(nm); setTimeout(() => { if (K.quests.turnins(nm).length) talkTo(n); }, 200); } } }); return; } }
  if (K.festaSys.festa && !K.festaSys.festa.done && K.festaSys.festa.crowd.some((c) => c.n === n)) { K.festaTalk(n); return; }
  K.quests.onTalk(nm); /* conversar conta antes de listar as entregas */
  const ti = K.quests.turnins(nm), of = K.quests.offers(nm);
  const choices: Choice[] = [];
  for (const d of ti) choices.push({ kind: 'turnin', label: `Entregar: ${d.name}`, hint: `${d.xp} XP · ${d.gold} 🪙`, quest: d });
  /* dois momentos (Erling, 25/10): quem chega com missão pronta primeiro ENTREGA; só depois da entrega a pessoa conta a missão nova (o diálogo reabre sozinho) */
  if (!ti.length) for (const d of of) choices.push({ kind: 'quest', label: d.name, hint: `Nv ${d.lvl}`, quest: d });
  if (shopId === 'estabulo' && !K.quests.q.done.includes('o01')) { /* estábulo fechado até libertar os cavalos */ }
  else if (shopId === 'tec_fio' || shopId === 'tec_desf') { const sf: Fac = shopId === 'tec_fio' ? 'fio' : 'desf', mf = myFac(); /* qualquer um compra; só veste quem jurou o lado, no nível 30 */
    choices.push({ kind: 'shop', label: `Comerciar com ${nm}`, hint: mf === sf ? 'peças com brasão' : 'só para guardar ou vender', cb: () => { K.inv.openShop(shopId); if (mf !== sf) K.game.logMsg(sf === 'fio' ? `🧵 ${nm}: “Vendo a quem paga. Vestir o fio é outra história: só quem jura.”` : `✂ ${nm}: “Leve. Mas o manto só cai bem em quem já cortou o fio.”`, '#c8b890'); } }); }
  else if (shopId) choices.push({ kind: 'shop', label: `Comerciar com ${nm}`, cb: () => { if (shopId === 'latao') K.prepLatao(); K.inv.openShop(shopId, SHOP_OF[nm] ? undefined : `${nm}, ${n.def.role}`); const k = K.shopLeanK(shopId);
    if (k > 1) K.game.logMsg(`${nm} olha você de cima a baixo. Para gente como você, o preço é outro (+${Math.round((k - 1) * 100)}%).`, '#c8a090'); else if (k < 1) K.game.logMsg(`${nm} sorri: “Para você, um desconto.” (−${Math.round((1 - k) * 100)}%)`, '#a8d0a0'); } });
  if (nm === 'Elowen' || nm === 'Elowen do Porto') choices.push({ kind: 'custom', label: 'Abrir o Shop', hint: 'Premium e brasões', cb: () => { K.dlg.close(); K.loja.toggle('prem'); } });
  if (nm === 'Mestre-Forjador Brokki') choices.push({ kind: 'custom', label: 'Forja de Elite', hint: 'peças lendárias', cb: () => eliteForge(n) });
  { /* a festa também é um assunto de conversa: quem fechou o convite (ou clicou fora dele) ainda pode aceitar falando com quem deu a missão */
    const stF = K.hereSettle()?.name ?? '', dF = stF && !K.festaSys.festa && !K.align.flag('festa_' + stF) && K.align.get('vila', stF) >= (stF === 'Karmika' ? 100 : 300) ? K.leavingQuest(stF) : null;
    if (dF && dF.giver === nm) choices.push({ kind: 'custom', label: '🎉 Aceitar a festa de despedida', hint: `${stF} quer se despedir de você`, cb: () => { K.dlg.close(); K.festaSys.festaAsked = stF; K.festaFade([`A notícia correu de casa em casa: ${K.profile?.name || 'o caminhante'} vai partir.`, `Ao cair da tarde, a praça de ${stF} se encheu de gente, de música e de cheiro de churrasco.`], () => K.startFesta(stF)); } }); }
  /* 05/11: o Prefeito vende a Licença de Guilda de Karmika — nível base 45, 1 Lágrima de Marghar e a party de 3 no salão (a tela confere tudo) */
  if (nm === 'Prefeito Corvin Aldmar' && !K.social.guild) choices.push({ kind: 'custom', label: 'Fundar uma guilda', hint: 'Licença de Guilda: nível 45 · Lágrima de Marghar · party de 3', cb: () => { K.dlg.close(); K.social.startFounding(); } });
  /* 06/11: o Livro de Guildas fica nas bibliotecas e com o Prefeito */
  if (nm === 'Prefeito Corvin Aldmar' || /Bibliotec|Cronista/i.test(n.def.role ?? '')) choices.push({ kind: 'custom', label: '📖 Ler o Livro de Guildas', hint: 'todas as guildas de Karmika', cb: () => { K.dlg.close(); K.social.openBook(); } });
  if (nm === 'Garrick') choices.push({ kind: 'board', label: 'Quadro de Missões', hint: 'contratos', cb: () => K.quests.openBoard() });
  if (nm === 'Hrefna') { if (K.game.st.lvl >= 20 && (!K.profile?.path || K.profile.path === 'humano')) choices.push({ kind: 'custom', label: K.profile?.path === 'humano' ? 'Ler o meu caminho de novo' : 'Ler o meu caminho', hint: 'doze perguntas', cb: () => { K.dlg.close(); K.vid.open(); } }); else if (K.game.st.lvl < 30) choices.push({ kind: 'talk', label: 'Ler o meu caminho', hint: 'nível 30', cb: () => K.dlg.setText('Ainda não. A sua alma ainda está se formando. Volte no nível 30, e eu leio o que a Deusa vê.') }); }
  choices.push({ kind: 'talk', label: 'Conversar', cb: () => K.dlg.setText(K.npcSys.talk(n)) });
  choices.push({ kind: 'close', label: 'Até logo' });
  K.quests.onTalk(nm);
  let portrait: string | null = null; try { portrait = portraitOf(nm, (K.npcSys.ensure(n), n.hero.root)); } catch { portrait = null; }
  const eco = (() => { if (ti.length || of.length) return null; for (const m of K.soul.s.marks ?? []) { const t = ECOS[m]?.[nm], key = `eco:${m}:${nm}`; if (t && !K.hasMark(key)) { (K.soul.s.marks ??= []).push(key); K.soul.save(); return t; } } return null; })();
  const frio = (() => { const L = K.soulLean(); if (!L || ti.length || of.length || eco) return null; const f = FRIO[L]; return f.quem.includes(nm) && Math.random() < 0.5 ? f.falas[Math.floor(Math.random() * f.falas.length)] : null; })();
  K.openDlg({ name: nm, role: n.def.role, portrait, text: (eco || frio) ? (eco || frio)!.replace(/\{nome\}/g, K.profile?.name || 'Caminhante') : ti.length ? 'Você voltou. Conseguiu?' : of.length ? (of[0].talk ? `${K.profile?.name ? K.profile.name + ', ' : ''}preciso falar com você.` : of[0].text) : (nm === 'Orm' && !K.quests.q.done.includes('o01') && K.quests.q.active['o01']) ? 'Enquanto o Torturador viver, nenhum cavalo sai daqui. A clareira fica no meio da floresta, a leste.' : n.def.lines[n.line], choices,
    onAccept: (d) => { K.quests.accept(d); K.game.logMsg(`${nm}: “Que Karmika guie seus passos.”`, '#f4e6b8'); },
    onTurnIn: (d, ci) => { const o = d.choice && ci !== undefined ? d.choice.opts[ci] : null; K.quests.turnIn(d);
      if (o) { K.applyReply({ t: '', luz: o.karma > 0 ? Math.ceil(o.karma / 2) : 0, sombra: o.karma < 0 ? Math.ceil(-o.karma / 2) : 0, flag: (o as { flag?: string }).flag }); K.addKarma(o.karma); K.game.logMsg(`${nm}: “${o.say}”`, '#f4e6b8'); setTimeout(() => eyeSees(o.karma >= 0 ? 'O Olho viu.' : 'O Olho guardou.', o.label, o.why, o.karma), 600); }
      else K.game.logMsg(`${nm}: “Bom trabalho.”`, '#f4e6b8');
      /* tem mais a contar? a conversa continua: a próxima missão é apresentada, não empurrada */
      if (!o) setTimeout(() => { if (!K.dlg.isOpen && (K.quests.offers(nm).length || K.quests.turnins(nm).length) && Math.hypot(n.pos.x - K.state.fx * T, n.pos.z - K.state.fy * T) < 8) talkTo(n); }, 450); },
    objProg: (d, i) => K.quests.objProg(d, i), objNeed: (d, i) => K.quests.objNeed(d, i) });
}
/** a Forja de Elite do Brokki: material de bicho elite + minério + ouro = peça lendária do seu nível */
function eliteForge(n: (typeof K.npcSys.npcs)[number]) {
  const has = (r: (typeof ELITE_FORGE)[number]) => r.need.every(([i, k]) => K.inv.count(i) >= k) && K.game.st.gold >= r.gold;
  const ch: Choice[] = ELITE_FORGE.map((r) => ({ kind: 'custom', label: `${has(r) ? '⚒' : '✗'} ${r.label}`, hint: `${r.need.map(([i, k]) => `${K.inv.count(i)}/${k} ${ITEMS_TBL[i]?.name ?? i}`).join(' · ')} · ${r.gold} 🪙`, cb: () => {
    if (!has(r)) { K.audio.error(); K.dlg.setText('Falta material. Bicho elite não se acha na esquina: procure os grandes, os que têm nome, os que mandam na matilha.'); return; }
    for (const [i, k] of r.need) K.inv.take(i, k); K.game.st.gold -= r.gold;
    const g = genGear(Math.max(5, K.game.st.lvl + 3), Math.random() < 0.25 ? 'epic' : 'legendary', r.slot); (g as { name: string }).name = r.label;
    if (!K.inv.addGear(g)) { for (const [i, k] of r.need) K.inv.add(i, k); K.game.st.gold += r.gold; K.dlg.setText('A mochila está cheia. Abra espaço e volte.'); return; }
    K.audio.hit(); setTimeout(() => K.audio.hit(), 280); setTimeout(() => K.audio.craftDone?.(), 700); K.dlg.setText(`${r.say} (${r.label} foi para a sua mochila.)`); K.game.logMsg(`⚒ Brokki forjou: ${r.label}.`, '#ffb060');
  } })) as Choice[];
  ch.push({ kind: 'close', label: 'Até logo' });
  let pr: string | null = null; try { pr = portraitOf(n.def.name, (K.npcSys.ensure(n), n.hero.root)); } catch { pr = null; }
  K.openDlg({ name: n.def.name, role: n.def.role, portrait: pr, text: 'Mostra o que você trouxe. Presa, couro, chifre, casco, cerne: material de elite. O resto eu tenho.', choices: ch, onAccept: () => {}, onTurnIn: () => {} });
}
  return { portraits, portraitOf, get portraitYaw() { return portraitYaw; }, set portraitYaw(v: typeof portraitYaw) { portraitYaw = v; }, eliteForge, talkTo };
}

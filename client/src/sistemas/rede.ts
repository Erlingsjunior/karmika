/* JOGAR JUNTO: os outros Caminhantes da sala no mundo (net.ts) e os monstros compartilhados (coop.ts). Saiu do main.ts (02/11). */
import { createNet } from '../net';
import { RACES } from '@karmika/shared';
import { myFac, FAC, crestURL, type Fac } from '../faccoes';
import * as THREE from 'three';
import { isPremium } from '../premium';
import { badge } from '../celebrate';
import { bandOf } from '../karma';
import { RARITY } from '../loot';
import { FEATS, CATS } from '../feats';
import { createCoop } from '../coop';
import { initMirror } from '../espelho';
import type { RedeCtx } from '../main';

export function createRede(K: RedeCtx) {
/* jogar junto: os outros Caminhantes da sala aparecem no mundo (cada um com o próprio save) */
const net = createNet({ scene: K.scene, camera: K.camera, canvas: K.canvas,
  look: () => ({ kind: K.kindOf(K.state.race), opts: K.profile ? { hair: K.profile.hair, skin: K.profile.skin, hairStyle: K.profile.hairStyle, beard: K.profile.beard, ears: K.profile.origin === 'elf' } : {}, gear: K.lastGear, skin: K.peleSys.netSkin, name: K.profile?.name || RACES[K.state.race].label, lvl: K.game.st.lvl, cls: (document.getElementById('who')?.textContent || '').trim() || 'Caminhante', karma: Math.round(K.state.karma), fac: myFac(), path: K.myPath(), lean: K.soulLean(), prem: isPremium() }),
  premRune: () => { const sp = K.makeBlessRune(); sp.visible = true; return sp; },
  st: () => { const p = K.hero.root.position; const zn = K.inside ? (K.inside.crypt ? `crypt:${K.inside.crypt}` : `in:${K.inside.prop.gx},${K.inside.prop.gy}`) : 'world';
    return { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), f: +K.hero.root.rotation.y.toFixed(3), m: +K.netMps.toFixed(2), zn, hp: Math.round(100 * K.game.st.hp / Math.max(1, K.game.st.hpMax)), ...(K.hero.combat ? { cb: 1 as const } : {}), ...(K.hero.guard ? { gd: 1 as const } : {}), ...(K.hero.riding ? { rd: 1 as const } : {}), ...(K.hero.kneel ? { kn: 1 as const } : {}), ...(K.pvpOn ? { ag: 1 as const } : {}) }; },
  chat: (name, text, w, p, lvl) => { const r = net.peers().find((q) => q.name === name && !q.me); const tag = lvl || r ? `Nv ${lvl ?? r?.lvl ?? '?'}${r?.cls ? ' · ' + r.cls : ''}` : undefined; K.chat.recv(name, text, p ? 'party' : w ? 'whisper' : 'local', w ? (K.profile?.name || '') : undefined, tag); }, /* 08/11: quem fala, com nível e classe; grupo tem canal próprio */
  sys: (text, color) => { K.game.logMsg(text, color); },
  joined: (name) => { // aviso de chegada: som, um selo na tela e, se a janela estiver em segundo plano, notificação do sistema
    K.audio.chime(); badge('✧', 'chegou ao mundo', name, 'join');
    try { if (!document.hasFocus() && 'Notification' in window) { const go = () => new Notification('Karmika', { body: `${name} entrou no mundo.` }); if (Notification.permission === 'granted') go(); else if (Notification.permission !== 'denied') Notification.requestPermission().then((p) => { if (p === 'granted') go(); }); } } catch { /* */ } },
  mail: (l) => { K.mail.receive(l as Parameters<typeof K.mail.receive>[0]); },
  posts: () => { K.quests.refreshBoard(); },
  connected: () => { K.mail.flush(); },
  /* 26/10 (Erling): a sala avisa 10 s antes de reiniciar ou atualizar; a tela esmaece, o Olho espera, e todo mundo volta sozinho */
  restart: (sec, why) => K.srvWait.countdown(sec, why === 'fechar' ? 'A sala vai fechar' : 'A sala vai reiniciar'),
  update: (sec, version) => K.srvWait.update(sec, version),
  waiting: (on) => { if (on) K.srvWait.wait('Esperando a sala voltar…'); else K.srvWait.done(); },
  partyInvite: (from, name, lvl, call) => coop.partyInvite(from, name, lvl, call),
  onCall: (id, name, fac, same, mine, n) => chamado(id, name, fac as Fac, same, mine, n),
  showProfile: (id, p) => coop.showProfile(id, p),
  profile: () => { // o que os outros veem ao abrir o meu perfil
    const k = Math.round(K.state.karma), align = bandOf(k).name;
    let portrait: string | null = null; try { K.portraits.delete('hero'); portrait = K.portraitOf('hero', K.hero.root, true); } catch { /* */ }
    const gear = Object.entries(K.inv.eq).filter(([, g]) => !!g).map(([slot, g]) => ({ slot, name: g!.name, rarity: RARITY[g!.rarity].name, icon: g!.icon, col: RARITY[g!.rarity].col }));
    const done = FEATS.filter((f) => K.feats.isDone(f.id)); const top = [...done].sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0) || b.goal - a.goal).slice(0, 6);
    const fac = myFac();
    return { name: K.profile?.name || RACES[K.state.race].label, lvl: K.game.st.lvl, cls: (document.getElementById('who')?.textContent || '').trim() || 'Caminhante', title: K.quests?.title ?? '', karma: k, align, fac: fac ? FAC[fac].name : null, portrait,
      gear, feats: top.map((f) => ({ name: f.name, desc: f.desc, icon: CATS[f.cat].icon })), featCount: done.length, featTotal: FEATS.length, kills: K.game.st.kills ?? 0, quests: K.quests.q.done.length, lives: K.soul.s.lives.map((l) => ({ name: l.name, race: K.originName(l.origin), cls: l.cls, lvl: l.lvl })) };
  },
});
/* 09/11: o espelho — drones, robôs, bichos, flechas e magias do herói aparecem para o grupo (meio transparentes); os bichos, para todos */
initMirror(K.scene, K.particles, net, () => K.inside ? (K.inside.crypt ? `crypt:${K.inside.crypt}` : `in:${K.inside.prop.gx},${K.inside.prop.gy}`) : 'world');
K.netRef = net;
/* ---------- 09/11 O CHAMADO DA BANDEIRA (Erling): botão do meio do mouse = cumprimento da facção. O brasão sobe sobre a cabeça de quem chamou
   e todos por perto veem; os da mesma bandeira (e os neutros) ouvem a trompa e recebem convite de grupo (o servidor manda, inclusive a grupos
   inteiros). Recarga de 10 minutos, conferida no servidor e mostrada aqui. ---------- */
const CALL_CD = 10 * 60 * 1000; let lastCall = 0; const crestTex = new Map<string, THREE.Texture>();
function crest(f: Fac) { let t = crestTex.get(f); if (!t) { const im = new Image(); im.src = crestURL(f); t = new THREE.Texture(im); t.colorSpace = THREE.SRGBColorSpace; im.onload = () => { t!.needsUpdate = true; }; crestTex.set(f, t); } return t; }
function crestOver(root: THREE.Object3D, f: Fac) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: crest(f), transparent: true, depthWrite: false, opacity: 0 })); sp.position.set(0, 3.1, 0); sp.scale.setScalar(0.01); sp.renderOrder = 20; root.add(sp);
  const t0 = performance.now(); const tick = () => { const t = (performance.now() - t0) / 1000; if (t > 6) { root.remove(sp); sp.material.dispose(); return; }
    const k = Math.min(1, t * 3), fade = t > 5 ? 6 - t : 1; sp.scale.setScalar(0.9 * k + 0.08 * Math.sin(t * 5)); sp.position.y = 3.0 + 0.18 * k + 0.05 * Math.sin(t * 2.2); (sp.material as THREE.SpriteMaterial).opacity = 0.95 * k * fade; requestAnimationFrame(tick); };
  tick();
}
function chamado(id: number, name: string, fac: Fac, same: boolean, mine: boolean, n: number) {
  const root = mine ? K.hero.root : net.remotes().find((r) => r.id === id)?.root; if (root) crestOver(root, fac);
  if (same || mine) K.audio.horn(fac);
  if (mine) { lastCall = performance.now(); K.game.logMsg(n ? `⚑ ${FAC[fac].name}: “${FAC[fac].motto}.” ${n} ${n === 1 ? 'caminhante atendeu ao seu chamado' : 'caminhantes receberam o seu chamado'}.` : `⚑ ${FAC[fac].name}: “${FAC[fac].motto}.” Ninguém da bandeira por perto.`, fac === 'fio' ? '#d9b45a' : '#e0303a'); }
  else if (same) K.game.logMsg(`⚑ ${name} ergueu o brasão de ${FAC[fac].name} aqui perto.`, fac === 'fio' ? '#d9b45a' : '#e0303a');
}
K.canvas.addEventListener('pointerdown', (e) => { if (e.button !== 1) return; e.preventDefault();
  const f = myFac(); if (!f) { K.game.logMsg('⚑ O Chamado da Bandeira é só de quem jurou uma bandeira (nível 20, com a classe).', '#c8d8f0'); return; }
  if (net.state !== 'on') { K.game.logMsg('⚑ O Chamado só ecoa numa sala com outros caminhantes.', '#c8d8f0'); crestOver(K.hero.root, f); K.audio.horn(f); return; }
  const left = CALL_CD - (performance.now() - lastCall); if (lastCall && left > 0) { K.game.logMsg(`⚑ O Chamado descansa por mais ${Math.ceil(left / 60000)} min.`, '#c8d8f0'); return; }
  net.call(); });
K.canvas.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });
/* jogar junto, etapa 2: os monstros do mundo são os mesmos para todos da sala (quem luta com o bicho conduz; golpes e mortes vão para todos) */
{ const inParty = (id: number) => !!net.party && net.party.members.includes(id) && id !== net.myId;
  /* 11/11 (Erling: "masmorra e raide usam os dois multiplicadores"): antes só contava companheiro no mundo aberto; dentro de masmorra o grupo valia 1. Agora conta quem está no MESMO lugar que você (o boneco dele só fica visível aí) e perto. */
  const partyNear = () => { if (!net.party) return 1; const p = K.hero.root.position; let n = 1; for (const r of net.remotes()) if (inParty(r.id) && (r as { root?: { visible: boolean } }).root?.visible && r.pos.distanceTo(p) < 45) n++; return n; };
  K.game.setNet({ myId: () => net.myId, hit: (id, n) => net.x('x:hit', { e: id, n }), die: (id) => net.x('x:die', { e: id }), cast: (id, x, z, i) => net.x('x:cast', { e: id, x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, i }) }, partyNear);
  /* 06/11: runas que curam o aliado — o companheiro de grupo mais ferido a até 10 m recebe a cura (só companheiros, nunca estranhos) */
  let rhAt = 0; K.game.setAllyHeal((pct) => { const t = performance.now(); if (t - rhAt < 1200) return false; if (!net.party || net.state !== 'on') return false; const p = K.hero.root.position; let best: { id: number; d: number } | null = null; for (const r of net.remotes()) { if (!inParty(r.id)) continue; const d = r.pos.distanceTo(p); if (d < 10 && (!best || d < best.d)) best = { id: r.id, d }; } if (!best) return false; rhAt = t; net.x('x:rh', { to: best.id, pct: Math.min(0.2, pct) }); return true; });
  /* 07/11 (Erling: "cura em massa, cura que pula de um para o outro, aumentar defesa e ataque do grupo"): a cura que o herói faz chega nos
     companheiros de grupo perto (em massa) ou pula de um para o outro (runa do Labirinto na cura: 95%, 80%, 65%); e as auras de grupo */
  K.game.setGroupHeal((v, r, chain) => { if (!net.party || net.state !== 'on') return 0; const p = K.hero.root.position; const mates = net.remotes().filter((q) => inParty(q.id) && q.pos.distanceTo(p) < (chain ? r + 8 : r));
    if (!mates.length) return 0;
    if (!chain) { for (const q of mates) { net.x('x:gh', { to: q.id, v: Math.round(v) }); K.game.beam(p.clone().setY(p.y + 1.3), q.pos.clone().setY(q.pos.y + 1.3), 0x9affb0); } return mates.length; }
    let from = p.clone(), k = 1, n = 0; const left = [...mates]; while (left.length && n < 3) { left.sort((a, b) => a.pos.distanceTo(from) - b.pos.distanceTo(from)); const q = left.shift()!; if (q.pos.distanceTo(from) > 9) break;
      net.x('x:gh', { to: q.id, v: Math.round(v * k) }); K.game.beam(from.clone().setY(from.y + 1.3), q.pos.clone().setY(q.pos.y + 1.3), 0xb0ffc0); from = q.pos.clone(); k -= 0.15; n++; }
    return n; });
  net.onX('x:gh', (from, m) => { if (m.to !== net.myId || !inParty(from)) return; K.game.healAbs(Math.max(0, Number(m.v) || 0), net.nameOf(from)); });
  setInterval(() => { if (!net.party || net.state !== 'on') return; const a = K.game.groupAuraOut(); if (a.def <= 0 && a.dmg <= 0) return; net.x('x:aura', { d: a.def, a: a.dmg }); }, 2500);
  net.onX('x:aura', (from, m) => { if (!inParty(from)) return; const q = net.remotes().find((r) => r.id === from); if (!q || q.pos.distanceTo(K.hero.root.position) > 14) return; K.game.groupAuraIn(Math.max(0, Number(m.d) || 0), Math.max(0, Number(m.a) || 0)); });
  net.onX('x:rh', (from, m) => { if (m.to !== net.myId || !inParty(from) || K.game.st.dead) return; K.game.healFrom(Number(m.pct) || 0, net.nameOf(from)); });
  net.onX('x:mob', (from, m) => K.game.enemies.netIn(from, m.l as (number | string)[][]));
  net.onX('x:hit', (_f, m) => K.game.enemies.netHit(String(m.e), m.n as number));
  net.onX('x:cast', (_f, m) => { if (!K.inside || K.inside.crypt || K.inside.dg) K.game.enemies.netCast(String(m.e), m.x as number, m.z as number, m.i as number); });
  net.onX('x:die', (from, m) => { const e = K.game.enemies.netDie(String(m.e)); // companheiro de grupo perto: a morte conta para mim também (XP, missão, meu saque)
    if (e && inParty(from) && !K.inside && !K.game.st.dead && Math.hypot(e.pos.x - K.hero.root.position.x, e.pos.z - K.hero.root.position.z) < 45) K.game.sharedKill(e); });
  /* missões do grupo: o que eu pego aparece para os companheiros (com "Pegar também") */
  K.quests.setOnAccept((d) => { if (net.state === 'on' && net.party && d.giver !== 'O Olho') net.x('x:pq', { d }); });
  /* masmorra em grupo: quem chega pede o estado; quem já está dentro conta o que caiu e se o portão abriu */
  net.onX('x:dgin', (from, m) => { if (inParty(from) && !K.inside && !K.game.st.dead) { const en = K.dgs.entrances.find((e) => e.d.id === m.id); if (en) coop.ask('⚔ Masmorra do grupo', `${net.nameOf(from)} entrou em ${en.d.name}. Seguir o grupo para dentro?`, 'Seguir', (ok) => { if (ok) K.enterDungeon(en); }, 40); } /* 08/11: party dentro das dungeons — quem está fora é chamado */
    if (!inParty(from) || !K.inside?.dg || K.inside.dg !== m.id || m.inst !== K.dgInst()) return; const sn = K.dgs.snapshot(); if (sn) net.x('x:dgsnap', { to: from, ...sn }); K.game.logMsg(`⚔ ${net.nameOf(from)} entrou na masmorra.`, '#ffd27a'); });
  net.onX('x:dgsnap', (from, m) => { if (m.to !== net.myId || !inParty(from)) return; K.dgs.applySnapshot(m as never); });
  net.onX('x:dgwin', (from, m) => { if (inParty(from)) K.game.logMsg(`🏆 ${net.nameOf(from)} e o grupo venceram ${K.dgs.entrances.find((e) => e.d.id === m.id)?.d.name ?? 'a masmorra'}!`, '#ffd24a'); });
  net.onX('x:pq', (from, m) => { if (!inParty(from)) return; const d = m.d as Parameters<typeof K.quests.accept>[0], nm = net.nameOf(from); coop.questShare(nm, d, K.quests.shareState(d), () => K.quests.accept(d, nm)); });
  setInterval(() => { K.pvp.tick(); }, 500);
  setInterval(() => { if (net.state !== 'on' || (K.inside && !K.inside.crypt && !K.inside.dg)) return; const l = K.game.enemies.netOut(); if (l.length) net.x('x:mob', { l }); }, 100); }
const coop = createCoop(net, { friend: (n) => K.social.friendChar(n), guildInvite: (n) => K.social.inviteGuild(n), inGuild: () => !!K.social.guild, pvpToggle: () => K.pvp.toggle(), pvpOn: () => K.pvpOn, toMenu: () => K.inicio.open(), mailTo: (n) => K.mail.compose(n), duel: (id) => K.pvp.challenge(id), whisperTo: (n) => K.chat.whisperTo(n), myHp: () => Math.round(100 * K.game.st.hp / Math.max(1, K.game.st.hpMax)) });
  return { coop, net };
}

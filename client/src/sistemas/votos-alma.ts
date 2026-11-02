/* JURAMENTOS DE ROLEPLAY e a ALMA PELAS PALAVRAS: oferecer e quebrar o voto, a vigília da Morte que Anda, o título do voto mantido, as marcas e as respostas que pesam. Saiu do main.ts (02/11). */
import { VOWS, VOW_FOR } from '../dados/votos';
import { eyeSees } from '../surrender';
import { type Reply } from '../dialog';
import type { VotosAlmaCtx } from '../main';

export function createVotosAlma(K: VotosAlmaCtx) {
/* ---------- Juramentos de roleplay (24/10): ao entrar na classe, o herói pode jurar um voto que o jogo vigia.
   Manter: Bênção do Voto (+5% de XP) e, depois de 3 horas de jogo fiel, o título. Quebrar: perde a bênção, −6 de karma,
   o nome fica manchado e os NPCs comentam. Não é obrigatório: é roleplay com peso. ---------- */
function vowKept() { return !!K.vow && !K.vow.broken; }
function breakVow(id: string) { if (!K.vow || K.vow.broken || K.vow.id !== id) return; K.vow.broken = true; K.saveVow(); K.addKarma(-(6)); (K.soul.s.marks ??= []).push('voto_quebrado'); K.soul.s.sombra = (K.soul.s.sombra ?? 0) + 3; K.soul.save(); K.game.st.xpMul = Math.max(1, K.game.st.xpMul - 0.05);
  K.game.logMsg(`⛓ Você quebrou o ${VOWS[id].name}. ${VOWS[id].why} A bênção se apaga, e o seu nome fica manchado.`, '#ff8a7a'); setTimeout(() => eyeSees('O Olho guardou.', `Quebrou o voto: “${VOWS[id].text}”`, `${VOWS[id].why} Ninguém obrigou você a jurar. Por isso pesa.`, -6), 500); }
function offerVow(path: string) {
  const ids = VOW_FOR[path] ?? Object.keys(VOWS);
  K.openDlg({ name: 'O Olho', role: 'Marghar vê', portrait: null, text: 'Todo caminho começa com uma palavra. Se quiser, jure um voto. O jogo não esquece: manter dá bênção; quebrar mancha o nome.',
    choices: [...ids.map((id) => ({ kind: 'custom' as const, label: `“${VOWS[id].text}”`, hint: VOWS[id].name, cb: () => { K.vow = { id, secs: 0, broken: false, titled: false }; K.saveVow(); K.game.st.xpMul += 0.05; K.game.logMsg(`✦ Você jurou: “${VOWS[id].text}” Bênção do Voto: +5% de XP enquanto mantiver.`, '#ffe08a'); } })),
      { kind: 'close' as const, label: 'Não juro nada. Minha palavra é minha.' }], onAccept: () => {}, onTurnIn: () => {} });
}
/* Voto contra a Morte que Anda: quem esteve a menos de 12 m de um morto-vivo que o caçava e agora está a mais de 35 m dele, com ele vivo, fugiu */
const UNDEAD = new Set(['zombie', 'skeleton', 'ghoul', 'bishop']); const undeadNear = new Map<object, number>();
setInterval(() => { if (!K.vow || K.vow.broken || K.vow.id !== 'mortos' || K.cinemaSys.cine || K.game.st.dead) { undeadNear.clear(); return; } const hp = K.heroPosNow(), now = performance.now();
  for (const e of K.game.enemies.list) { if (!UNDEAD.has(e.type) || !e.alive) { undeadNear.delete(e); continue; } const d = Math.hypot(e.pos.x - hp.x, e.pos.z - hp.z);
    if (d < 12 && e.state === 'chase') undeadNear.set(e, now); const t0 = undeadNear.get(e); if (t0 !== undefined && now - t0 < 60000 && d > 35) { undeadNear.clear(); breakVow('mortos'); return; } if (t0 !== undefined && now - t0 >= 60000) undeadNear.delete(e); } }, 1000);
setInterval(() => { if (!K.vow || K.vow.broken || K.vow.titled || K.cinemaSys.cine) return; K.vow.secs += 5; if (K.vow.secs >= 3 * 3600) { K.vow.titled = true; const T = { mortos: 'Inabalável', inocente: 'Mãos Limpas', verdade: 'Palavra de Ferro', misericordia: 'O Misericordioso' }[K.vow.id] ?? 'Fiel ao Voto'; K.quests.q.title = T; if (K.profile) { K.profile.title = T; localStorage.setItem('karmika.char.v1', JSON.stringify(K.profile)); } K.game.logMsg(`🏅 Três horas fiel ao voto. Título: ${T}.`, '#ffe08a'); } K.saveVow(); }, 5000);
function hasMark(m: string) { return (K.soul.s.marks ?? []).includes(m); }
function applyReply(r: Reply) {
  const before = K.soulLean();
  if (r.luz) K.soul.s.luz = (K.soul.s.luz ?? 0) + r.luz; if (r.sombra) K.soul.s.sombra = (K.soul.s.sombra ?? 0) + r.sombra;
  if (r.karma && r.karma > 0 && ((K.isWarrior() && K.game.fury().v > 0.8) || (K.kitRace() === 'pal' && K.game.doubt().v > 0.8) || (K.game.need3()?.v ?? 0) > 0.8)) { K.game.logMsg('🪓 A loucura da batalha fala mais alto: o bem que você quis fazer não pesou na alma. Faça o ritual de calmaria.', '#ff8a6a'); r = { ...r, karma: 0 }; }
  if (r.karma) K.addKarma(r.karma);
  if (r.flag && !hasMark(r.flag)) (K.soul.s.marks ??= []).push(r.flag);
  if (r.flag?.startsWith('mentiu')) breakVow('verdade');
  K.soul.save(); const after = K.soulLean();
  if (after !== before) setTimeout(() => K.game.logMsg(after === 'luz' ? '☀ Algo em você se aquece. Há portas que agora se abrem para quem é como você.' : after === 'sombra' ? '☾ Algo em você esfria. Gente de outra espécie começa a reparar em você.' : '⚖ A sua alma volta ao meio do caminho.', after === 'luz' ? '#ffe9a8' : after === 'sombra' ? '#b9a0ff' : '#c8c0b0'), 900);
}
  return { offerVow, vowKept, applyReply, hasMark, breakVow };
}

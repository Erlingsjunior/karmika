/* O OLHO DE MARGHAR: o globo de vida/recurso, o despertar no nível 15, o menu do Olho no centro da barra, atos heroicos e lágrimas; quem está online. Saiu do main.ts (02/11). */
import { createGlobes, createEye, playAwakening } from '../hud';
import { RACES } from '@karmika/shared';
import { PATH_NAME, bandOf, NATURE, CHAOS, MADNESS, type Madness, strainOf } from '../karma';
import { type Outcast, OUTCAST_NAME } from '../rituais';
import type { OlhoCtx } from '../main';

export function createOlho(K: OlhoCtx) {
const globes = createGlobes(), eyeSys = createEye();
/** ato heroico: o Olho Kármico enche e transborda numa lágrima; karma sobe */
/* nível 15: o Olho desperta uma vez; o centro da barra vira o menu do Olho */
let awakening = false;
const crestEl = document.getElementById('crest') as HTMLElement, olhoEl = document.createElement('div'); olhoEl.id = 'olho'; document.body.appendChild(olhoEl);
function checkAwakening() {
  if (awakening || !K.profile || K.profile.eye || K.game.st.lvl < 15) { crestEl.classList.toggle('awake', !!K.profile?.eye); return; }
  awakening = true; K.game.logMsg('👁 Algo desperta...', '#ffe08a'); const bornTear = !K.soul.s.born; K.soul.s.born = true; K.soul.save(); // marca já: recarregar no meio da animação não dá uma 2ª lágrima
  const sealedNow = K.compendium.unseal(); const owed = sealedNow.reduce((a, e) => a + e.delta, 0);
  playAwakening(K.profile.name || RACES[K.state.race].label, sealedNow, () => { K.feats.max('eye', 1); if (bornTear) { setTimeout(() => { giveTear('💧 Marghar se emociona: você acaba de nascer para o karma. Uma Lágrima do Olho é sua. Guarde para a morte, troque por Premium ou venda.'); dispatchEvent(new CustomEvent('karmika:burst', { detail: { c0: 0xffffff, c1: 0x9ad7ff, n: 90 } })); }, 1800); } K.addKarma(owed); if (owed) K.game.logMsg(`👁 O Olho cobra o que guardou: karma ${owed > 0 ? '+' : ''}${owed}.`, owed > 0 ? '#9ad7ff' : '#ff8a7a'); K.profile!.eye = true; localStorage.setItem('karmika.char.v1', JSON.stringify(K.profile)); awakening = false; crestEl.classList.add('awake'); heroicAct('O Olho Kármico despertou', false); }); // a Lágrima do despertar já é a do nascimento (antes vinham duas)
}
function renderOlho() {
  const k = Math.round(K.state.karma), title = K.quests.title || 'Aprendiz';
  olhoEl.innerHTML = `<div class="pn olhopn"><h2>👁 Olho Kármico <button data-x>✕</button></h2>
    <div class="cols"><div class="col"><h3>Sua alma</h3><p><b>${K.profile?.name ?? ''}</b> · ${K.profile?.origin === 'dwarf' ? 'Anão' : K.profile?.origin === 'elf' ? 'Elfo' : 'Humano'}${(() => { const p = K.myPath(); return p ? ' · ' + (PATH_NAME[p] ?? p) : ' · sem caminho ainda'; })()} · <b>${title}</b></p><p>Alinhamento agora: <b>${k > 0 ? '+' : ''}${k}</b> · ${bandOf(k).name} <small>(de −1000 a +1000)</small></p>${(() => { const p = K.myPath(), nat = p ? NATURE[p] : 0; if (p && CHAOS[p]) { const mz = K.soul.s.madness ? MADNESS[K.soul.s.madness as Madness] : null; return `<p>${PATH_NAME[p]}: sem lado, alinhamento de −250 a +250.${mz ? ` · <b style="color:${mz.col}">${mz.name}</b>` : ''}</p><small>${mz ? mz.line + ' Só o Ritual de Realinhamento tira a loucura.' : `Nos extremos (±200) vem a loucura kármica: ${CHAOS[p].neg === 'berserker' ? 'Berserker na sombra, Ermitão na luz' : 'Cientista Louco na sombra, Acadêmico Recluso na luz'}.`}</small>`; }
      if (!nat) return '<small>Sem caminho, você não tem natureza kármica: nenhuma fraqueza por alinhamento.</small>'; const sk = strainOf(K.state.karma, p, !!K.soul.s.outcast), oc = K.soul.s.outcast as Outcast | undefined; return `<p>Natureza do ${PATH_NAME[p!]}: <b>${nat > 0 ? '+' : ''}${nat}</b>${oc ? ` · <b style="color:${oc === 'renegado' ? '#ffe08a' : '#b89aff'}">${OUTCAST_NAME[oc]}</b> (casa: ${oc === 'renegado' ? 'a luz' : 'a sombra'})` : ''}${sk > 0 ? ` · <b style="color:#ff9a6a">fraqueza kármica ${Math.round(sk * 100)}%</b>` : ' · em casa'}</p>`; })()}<p>Karma acumulado nesta vida: <b style="color:#ffe08a">☀ ${Math.round(K.soul.s.luzT ?? 0)}</b> de luz · <b style="color:#b89aff">☾ ${Math.round(K.soul.s.sombraT ?? 0)}</b> de sombra</p><small>O alinhamento é para onde a sua alma pende hoje: é o que o mundo lê. Cada caminho tem uma natureza; perto do zero a alma sofre (fraqueza kármica). O zero é uma parede: só o ritual da classe atravessa, e quem atravessa vira Renegado (da sombra para a luz) ou Desgarrado (da luz para a sombra), sem ficar mais fraco. Luz e sombra são posições, não bem e mal. O acumulado não tem teto: sobe a cada ato até você desencarnar, e então fica escrito na sua vida passada.</small>
      <h3>Ascensão</h3><p>Nível ${K.game.st.lvl}. No nível 100 você escolhe duas especializações; 200 e 300 abrem fusões e a forma final.</p><small>As escolas ficam em Askavik, a cidade média. Quando as estradas estiverem abertas, uma missão o levará até lá.</small></div>
    <div class="col"><h3>Atos</h3>${K.quests.q.done.length ? `<p>${K.quests.q.done.length} missões concluídas</p>` : '<p>Nenhuma missão concluída ainda.</p>'}<p>${K.game.st.kills} abates</p><small>Matar outros jogadores e abandonar inocentes pesa para a sombra; proteger a vila e libertar bestas pesa para a luz. O Olho lembra de tudo.</small></div></div>
    <small class="ft">Esc fecha</small></div>`;
  olhoEl.style.display = 'flex';
}
let olhoOpen = false;
function toggleOlho(on?: boolean) { olhoOpen = on ?? !olhoOpen; if (olhoOpen) renderOlho(); else olhoEl.style.display = 'none'; }
olhoEl.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-x]') || t === olhoEl) toggleOlho(false); });
document.getElementById('sigil')?.addEventListener('click', () => { if (K.profile?.eye) toggleOlho(); else K.game.logMsg(`O Olho ainda dorme. Ele desperta no nível 15 (você está no ${K.game.st.lvl}).`, '#b9c6e0'); });
function heroicAct(why: string, tear = true) { K.feats.bump('heroic'); eyeSys.heroic(); K.addKarma(25); K.game.logMsg(`👁 ${why} — o Olho Kármico transborda.`, '#ffe08a');
  /* o Olho dormindo (antes do nível 15) não chora: o ato fica guardado no Compêndio, mas não vira Lágrima */
  if (!tear) return;
  if (!K.profile?.eye) { K.game.logMsg('👁 O Olho ainda dorme: este ato fica guardado, mas só o Olho aberto chora Lágrimas (nível 15).', '#b9c6e0'); return; }
  giveTear('💧 Uma Lágrima do Olho cai na sua mão. Guardada, ela paga uma volta da alma sem penalidade; também vale ouro e Premium.'); }
function giveTear(msg: string) { K.inv.add('lagrima', 1, true); K.game.logMsg(msg, '#9ad7ff'); K.audio.chime(); }
function updateWho() {
  const who = document.getElementById('who'), lbl = document.getElementById('lbl'); if (!who || !lbl) return;
  who.textContent = K.profile ? K.profile.name : RACES[K.state.race].label;
  lbl.textContent = K.profile ? `${K.profile.title || (K.profile.origin === 'human' ? 'Humano' : K.profile.origin === 'dwarf' ? 'Anão' : 'Elfo') + ' · Aprendiz'}` : 'Olho Karmika';
}
updateWho();
  return { updateWho, heroicAct, crestEl, get olhoOpen() { return olhoOpen; }, toggleOlho, globes, eyeSys, checkAwakening };
}

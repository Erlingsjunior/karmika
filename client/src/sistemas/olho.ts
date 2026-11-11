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
/* 11/11 (Erling: "melhorar e muito a tela do Olho Kármico"): o Olho grande e vivo no alto, a régua da alma de −1000 a +1000 com a sua posição e a
   natureza do caminho marcadas, cartões com o que foi acumulado e feito, e os últimos atos que o Olho viu. Nada do texto antigo saiu: ficou em blocos. */
function renderOlho() {
  const k = Math.round(K.state.karma), title = K.quests.title || 'Aprendiz', p = K.myPath(), nat = p ? NATURE[p] : 0, band = bandOf(k);
  const luz = Math.round(K.soul.s.luzT ?? 0), som = Math.round(K.soul.s.sombraT ?? 0), raca = K.profile?.origin === 'dwarf' ? 'Anão' : K.profile?.origin === 'elf' ? 'Elfo' : 'Humano';
  const pos = (v: number) => Math.max(0, Math.min(100, (v + 1000) / 20)), col = k > 60 ? '#ffe08a' : k < -60 ? '#b89aff' : '#d9c8a8';
  const atos = [...K.compendium.list()].filter((e) => !e.sealed).slice(-6).reverse();
  const chaos = p && CHAOS[p] ? CHAOS[p] : null, mz = chaos && K.soul.s.madness ? MADNESS[K.soul.s.madness as Madness] : null;
  const sk = p && nat ? strainOf(K.state.karma, p, !!K.soul.s.outcast) : 0, oc = K.soul.s.outcast as Outcast | undefined;
  const natureza = chaos ? `<b>${PATH_NAME[p!]}</b>: sem lado, alinhamento de −250 a +250.${mz ? ` <b style="color:${mz.col}">${mz.name}</b>` : ''}<small>${mz ? mz.line + ' Só o Ritual de Realinhamento tira a loucura.' : `Nos extremos (±200) vem a loucura kármica: ${chaos.neg === 'berserker' ? 'Berserker na sombra, Ermitão na luz' : 'Cientista Louco na sombra, Acadêmico Recluso na luz'}.`}</small>`
    : !nat ? 'Sem caminho, você não tem natureza kármica: nenhuma fraqueza por alinhamento.'
    : `Natureza do <b>${PATH_NAME[p!]}</b>: <b>${nat > 0 ? '+' : ''}${nat}</b>${oc ? ` · <b style="color:${oc === 'renegado' ? '#ffe08a' : '#b89aff'}">${OUTCAST_NAME[oc]}</b> (casa: ${oc === 'renegado' ? 'a luz' : 'a sombra'})` : ''}<div class="okbar ${sk > 0 ? 'bad' : ''}"><i style="width:${Math.round(sk * 100)}%"></i><span>${sk > 0 ? `fraqueza kármica ${Math.round(sk * 100)}%` : 'em casa: nenhuma fraqueza'}</span></div>`;
  olhoEl.innerHTML = `<div class="pn olhopn ok2"><h2>Olho Kármico <button data-x>✕</button></h2>
    <div class="okhero">
      <svg class="okeye" viewBox="20 30 260 160"><defs><clipPath id="okC"><polygon points="60,110 143,54 157,54 240,110 157,166 143,166"/></clipPath><radialGradient id="okG" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6d6"/><stop offset=".55" stop-color="${k < -60 ? '#a878ff' : '#f2b04a'}"/><stop offset="1" stop-color="${k < -60 ? '#2a1450' : '#7a4a10'}"/></radialGradient></defs>
        <polygon points="60,110 143,54 157,54 240,110 157,166 143,166" fill="#0b0810"/><g clip-path="url(#okC)"><ellipse class="okiris" cx="150" cy="110" rx="46" ry="46" fill="url(#okG)"/><polygon class="okpup" points="150,86 174,110 150,134 126,110" fill="#0b0810"/><ellipse cx="136" cy="96" rx="8" ry="5" fill="rgba(255,255,255,.7)"/></g>
        <g fill="none" stroke="#d9a24f" stroke-width="14" stroke-linejoin="bevel"><path d="M144 40 L40 110 L144 180"/><path d="M40 40 L40 180"/><path d="M156 40 L260 110 L156 180"/><path d="M260 40 L260 180"/></g></svg>
      <div class="okwho"><b>${K.profile?.name ?? ''}</b><span>${raca}${p ? ' · ' + (PATH_NAME[p] ?? p) : ' · sem caminho ainda'} · ${title}</span>
        <div class="okk" style="color:${col}">${k > 0 ? '+' : ''}${k}<em>${band.name}</em></div><small>Marghar não julga. Ele vê, e guarda.</small></div>
    </div>
    <div class="okscale" title="Para onde a sua alma pende hoje: é o que o mundo lê."><div class="oktrack">${chaos ? '<i class="okzone" style="left:37.5%;width:25%" title="A faixa do seu caminho: −250 a +250"></i>' : ''}${nat ? `<i class="oknat" style="left:${pos(nat)}%" title="Natureza do seu caminho: ${nat > 0 ? '+' : ''}${nat}"></i>` : ''}<i class="okzero"></i><i class="okme" style="left:${pos(k)}%"></i></div>
      <div class="oklab"><span>☾ Trevas −1000</span><span>Sombrio</span><span>Neutro</span><span>Luminoso</span><span>Radiante +1000 ☀</span></div></div>
    <div class="okcards">
      <div class="okc luz"><small>☀ Luz acumulada nesta vida</small><b>${luz}</b></div>
      <div class="okc som"><small>☾ Sombra acumulada nesta vida</small><b>${som}</b></div>
      <div class="okc"><small>Missões concluídas</small><b>${K.quests.q.done.length}</b></div>
      <div class="okc"><small>Abates</small><b>${K.game.st.kills}</b></div>
      <div class="okc"><small>Decisões no Compêndio</small><b>${K.compendium.list().length}</b></div>
      <div class="okc"><small>Nível</small><b>${K.game.st.lvl}</b></div>
    </div>
    <div class="okcols"><div class="okcol"><h3>Natureza</h3><div class="okbox">${natureza}</div>
        <h3>Como o Olho lê você</h3><div class="okbox"><small>O alinhamento é para onde a sua alma pende hoje. Cada caminho tem uma natureza; perto do zero a alma sofre (fraqueza kármica). O zero é uma parede: só o ritual da classe atravessa, e quem atravessa vira Renegado (da sombra para a luz) ou Desgarrado (da luz para a sombra), sem ficar mais fraco. Luz e sombra são posições, não bem e mal. O acumulado não tem teto: sobe a cada ato até você desencarnar, e então fica escrito na sua vida passada.</small></div>
        <h3>Ascensão</h3><div class="okbox">Nível ${K.game.st.lvl}. No nível 100 você escolhe duas especializações; 200 e 300 abrem fusões e a forma final.<small>As escolas ficam em Askavik, a cidade média. Quando as estradas estiverem abertas, uma missão o levará até lá.</small></div></div>
      <div class="okcol"><h3>O que o Olho viu por último</h3>${atos.length ? `<div class="okacts">${atos.map((e) => `<div class="oka"><b class="${e.delta > 0 ? 'l' : e.delta < 0 ? 's' : ''}">${e.delta > 0 ? '+' : ''}${e.delta}</b><div><span>${e.title}</span><small>${e.what}${e.where ? ' · ' + e.where : ''}</small></div></div>`).join('')}</div>` : '<div class="okbox">Nenhuma decisão gravada ainda. Toda escolha que pesa fica aqui para sempre.</div>'}
        <h3>O que pesa</h3><div class="okbox"><small>Matar outros jogadores e abandonar inocentes pesa para a sombra; proteger a vila e libertar bestas pesa para a luz. O Olho lembra de tudo.</small></div></div></div>
    <small class="ft">O registro completo fica no Compêndio do Karma (U) · Esc fecha</small></div>`;
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

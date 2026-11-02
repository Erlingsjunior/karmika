/* EVENTOS VIVOS NA TELA: o resultado do evento, o aviso de evento por perto (faixa que entra pela direita) e a atualização dos eventos. Saiu do main.ts (02/11). */
import { type EvResult, globalNext, globalNow, G_FX } from '../eventos';
import { eyeSees } from '../surrender';
import { confirmBox } from '../windows';
import type { EventosUiCtx } from '../main';

export function createEventosUi(K: EventosUiCtx) {
function showEvResult(r: EvResult) { K.gevNote((h) => { h.evs++; }); { const st = K.hereSettle(); if (st && r.won) K.align.add('vila', st.name, r.lean === 'luz' ? 5 : r.lean === 'sombra' ? -5 : 2, r.name); }
  K.addKarma(r.karma); K.game.gainXp(r.xp); K.game.st.gold += r.gold;
  if (r.karma) K.applyReply({ t: '', luz: r.karma > 0 ? Math.ceil(r.karma / 3) : 0, sombra: r.karma < 0 ? Math.ceil(-r.karma / 3) : 0, flag: r.flag });
  const k = r.karma, kc = k > 0 ? '#ffe08a' : k < 0 ? '#c98aff' : '#b9c6e0';
  K.evResEl.innerHTML = `<div class="evp ${r.lean}"><small>RESPOSTA KÁRMICA</small><h3>${r.icon} ${r.name}</h3><p class="evs">${r.won ? 'Decidido' : 'O tempo acabou'} · você: <b>${r.side}</b></p>${r.lines.map((l) => `<p>${l}</p>`).join('')}
    <div class="evk"><span style="color:${kc}">${k > 0 ? '☀ +' : k < 0 ? '☾ ' : ''}${k} karma</span><span>✨ +${r.xp} XP</span><span>🪙 +${r.gold}</span></div><button data-ok>O Olho viu.</button></div>`;
  K.evResEl.style.display = 'flex'; K.audio.click?.(); evPendingEye = k ? () => eyeSees(k > 0 ? 'O Olho viu.' : 'O Olho guardou.', r.side, r.lines[0], k) : null;
}
/** o Olho registra no Compêndio só depois que você fecha a resposta (uma janela de cada vez) */
let evPendingEye: (() => void) | null = null;
K.evResEl.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-ok]') || e.target === K.evResEl) { K.evResEl.style.display = 'none'; const f = evPendingEye; evPendingEye = null; if (f) setTimeout(f, 250); } });
let evUiT = 0, lastGlobal: string | null = null, evCard = '';
K.quests.setExtraTop(() => evCard);
/* aviso de evento por perto: uma faixa animada que entra pela DIREITA da tela (o diário fica à esquerda).
   Clicar = pegar a missão: a bússola passa a levar até lá. Chegando, o arauto conta e você escolhe o lado (isso é aceitar). */
const evNearEl = document.createElement('div'); evNearEl.id = 'evnear'; document.body.appendChild(evNearEl);
const evNearShown = new Set<string>(); let evNearKey: string | null = null, evNearT = 0;
evNearEl.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('[data-k]') as HTMLElement | null; if (!b) return; e.stopPropagation(); K.audio.click?.();
  if (b.dataset.x) { evNearEl.classList.remove('on'); evNearKey = null; return; }
  K.eventos.track(b.dataset.k!); K.guiaSys.pinT = null; evNearEl.classList.add('took'); K.game.logMsg('🧭 Evento seguido: a bússola aponta para lá. Chegando, fale com o arauto.', '#ffb060');
  { const sto = K.eventos.story(b.dataset.k!); if (sto) { const txt = `${sto.blurb ? sto.blurb + '\n\n' : ''}Um mensageiro corre até você, sem fôlego: “Procure ${sto.name}, ${sto.role ? sto.role.toLowerCase() + ', ' : ''}em ${sto.site}. Foi ${sto.name.split(' ')[0]} que me mandou.”${sto.lines.length ? `\n\nE repete o recado como ouviu: “${sto.lines.join(' ')}”` : ''}`;
    setTimeout(() => K.openDlg({ name: sto.name, role: `recado · ${sto.site}`, portrait: null, text: txt, choices: [{ kind: 'custom', label: 'Estou indo.', hint: 'a bússola aponta para lá', cb: () => K.dlg.close() }], onAccept: () => {}, onTurnIn: () => {} }), 350); } } setTimeout(() => { evNearEl.classList.remove('on', 'took'); evNearKey = null; }, 1600); });
document.getElementById('quests')?.addEventListener('click', (e) => { const x = (e.target as HTMLElement).closest('[data-evx]') as HTMLElement | null; if (!x) return; e.stopPropagation(); const k = x.dataset.evx!; confirmBox('Abandonar este evento? Você sai do lado que escolheu e a bússola para de apontar.', 'Abandonar', () => { K.eventos.leave(k); evCard = ''; K.quests.render(); }); }, true);
function updateEvNear(h0: { x: number; y: number }) {
  if (K.inside || K.dlg.isOpen) { evNearEl.classList.remove('on'); return; }
  const tk = K.eventos.tracking(); const list = K.eventos.nearby(h0, 300).filter((e) => !e.joined && !e.asked && e.key !== tk?.key && Math.abs(e.lvl - K.game.st.lvl) <= 5); /* só avisa do que está perto (até 300 m) e do seu nível (±5) */
  if (evNearKey) { evNearT -= 0.25; const cur = list.find((e) => e.key === evNearKey); if (!cur || evNearT <= 0) { evNearEl.classList.remove('on'); evNearKey = null; } else { const m = evNearEl.querySelector('.d'); if (m) m.textContent = `${Math.round(cur.d)} m · ⌛ ${Math.max(1, Math.ceil(cur.left / 60))} min`; } return; }
  const nx = list.find((e) => !evNearShown.has(e.key)); if (!nx) return;
  evNearShown.add(nx.key); evNearKey = nx.key; evNearT = 16;
  evNearEl.style.setProperty('--c', nx.color);
  evNearEl.innerHTML = `<small>ACONTECENDO POR PERTO</small><b>${nx.icon} ${nx.name}</b><p>${nx.text}</p><span class="w">${nx.site} · <i class="d">${Math.round(nx.d)} m · ⌛ ${Math.max(1, Math.ceil(nx.left / 60))} min</i></span><span class="w rw">Nv ${nx.lvl} · ~${Math.round(K.game.xpNeed() * 0.3)} XP · ~${30 + K.game.st.lvl * 3} 🪙 · karma ao vencer</span><div class="r"><button data-k="${nx.key}">🧭 Pegar a missão</button><button data-k="${nx.key}" data-x="1" class="x">Agora não</button></div>`;
  evNearEl.classList.remove('on'); void evNearEl.offsetWidth; evNearEl.classList.add('on'); K.audio.chime?.();
}
setTimeout(() => { const nx = globalNext(); if (nx && !globalNow()) { const d = new Date(nx.start); K.game.logMsg(`${nx.icon} Próximo evento global: ${nx.name}, hoje/amanhã às ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} (o horário muda a cada dia).`, nx.color); } }, 6000);
function updateEventos(dt: number) { K.eventos.update(dt, K.t); evUiT -= dt; if (evUiT > 0) return; evUiT = 0.25;
  const h0 = K.hereT(), html = K.inside ? '' : K.eventos.tracker(h0); K.evTrkEl.style.display = 'none';
  /* o evento vira missão: cartão laranja no topo do diário, com os entregáveis e o tempo */
  const card = html ? `<div class="q c-ev track evq">${html}</div>` : ''; if (card !== evCard) { evCard = card; K.quests.renderExtra(); }
  updateEvNear(h0);
  const g = globalNow(), opK = K.gOpen(); /* o anúncio grande só na ABERTURA; depois o evento mora na barra de efeitos */ K.evBanEl.style.display = g && !K.inside && opK > 0.01 ? 'block' : 'none'; K.evBanEl.style.opacity = String(Math.min(1, opK * 1.4)); if (g && opK > 0.01) { const left = Math.max(1, Math.ceil((g.end - Date.now()) / 60000)); const fx = K.globalSideText(g.id); K.evBanEl.innerHTML = `<b style="color:${g.color}">${g.icon} ${g.name} <i>· mais ${left} min</i></b><small>${g.text}</small><span class="evfx">${(G_FX[g.id as 'lua'] ?? []).slice(0, 3).map((f) => `<em>${f.icon} ${f.t}</em>`).join('')}</span>${fx ? `<small style="color:${K.globalSide(g.id) > 0 ? '#9aff9a' : '#ff9a8a'}">${fx}</small>` : ''}`; }
  if (g?.id !== lastGlobal) { if (g) { K.game.logMsg(`${g.icon} ${g.name} começou no mundo inteiro. ${g.text}`, g.color); for (const f of G_FX[g.id as 'lua'] ?? []) K.game.logMsg(`   ${f.icon} ${f.t}`, g.color); K.game.logMsg('   (clique no contador embaixo do mapa para ver tudo de novo)', '#a8987a'); } lastGlobal = g?.id ?? null; } }
  return { showEvResult, updateEventos };
}

import { G } from './genero';
/** Diálogo com NPC: modal com retrato, falas e opções (missões, entrega, comércio, quadro). */
import type { QuestDef } from './quests';
import { objText } from './quests';
import { ITEMS } from './inventory';

/* ---------- conversa (24/10): falas ao pegar e ao entregar a missão, com respostas do jogador ----------
   Um passo é: uma fala do NPC (texto), uma fala do herói ({ me }), a fala de outro personagem ({ who, t }) ou uma escolha ({ r: respostas }).
   Cada resposta pode mexer na inclinação da alma (luz/sombra), no karma, deixar uma marca (flag) que outros NPCs lembram, e ter a réplica do NPC (a). */
export interface Reply { t: string; a?: string | string[]; luz?: number; sombra?: number; karma?: number; flag?: string; /** só aparece se a alma pende para cá */ need?: 'luz' | 'sombra' }
export type Step = string | { me: string } | { who: string; t: string } | { r: Reply[]; q?: string };
export interface Choice { kind: 'quest' | 'turnin' | 'shop' | 'board' | 'talk' | 'close' | 'custom'; label: string; hint?: string; quest?: QuestDef; cb?: () => void }
export interface DialogOpts { name: string; role: string; portrait: string | null; text: string; choices: Choice[]; onAccept(d: QuestDef): void; onTurnIn(d: QuestDef, choice?: number): void; /** o nome do herói (nas falas dele) */ me?: string; /** a alma pende para onde (filtra respostas com need) */ lean?: () => 'luz' | 'sombra' | null; onReply?(r: Reply, d: QuestDef, phase: 'talk' | 'done'): void; objProg?(d: QuestDef, i: number): number; objNeed?(d: QuestDef, i: number): number; /** encontro de missão: a conversa com quem a missão mandou procurar (sem cartão; no fim, conta o objetivo) */ meet?: { quest: QuestDef; steps: Step[]; onEnd(): void } }

export function createDialog() {
  const el = document.createElement('div'); el.id = 'dlg'; document.body.appendChild(el);
  /* a janela se arrasta pelo cabeçalho (retrato e nome) e lembra onde ficou; duplo clique volta ao lugar padrão.
     O deslocamento vai no contêiner (#dlg, sem zoom), então funciona igual em qualquer "Tamanho da interface". */
  let off = { x: 0, y: 0 }; try { off = { ...off, ...JSON.parse(localStorage.getItem('karmika.ui.dlg') || '{}') }; } catch { /* */ }
  const placeOff = () => { const dp = el.querySelector('.dp') as HTMLElement | null; if (dp) { el.style.transform = 'none'; const r = dp.getBoundingClientRect();
      off.x = Math.max(-r.left + 0, Math.min(innerWidth - r.right, off.x)); off.y = Math.max(-r.top, Math.min(innerHeight - r.top - 60, off.y)); }
    el.style.transform = `translate(${off.x}px, ${off.y}px)`; };
  let dragD: { x: number; y: number; ox: number; oy: number } | null = null;
  el.addEventListener('pointerdown', (e) => { const t = e.target as HTMLElement; if (!t.closest('.dh') || t.closest('button')) return; dragD = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y }; el.setPointerCapture(e.pointerId); e.preventDefault(); });
  el.addEventListener('pointermove', (e) => { if (!dragD) return; off = { x: dragD.ox + e.clientX - dragD.x, y: dragD.oy + e.clientY - dragD.y }; el.style.transform = `translate(${off.x}px, ${off.y}px)`; });
  let justDragged = 0; el.addEventListener('click', (e) => { if (performance.now() - justDragged < 250) { e.stopImmediatePropagation(); e.preventDefault(); } }, true); // soltar o arrasto não fecha a janela
  const endD = () => { if (!dragD) return; dragD = null; justDragged = performance.now(); placeOff(); try { localStorage.setItem('karmika.ui.dlg', JSON.stringify(off)); } catch { /* */ } };
  el.addEventListener('pointerup', endD); el.addEventListener('pointercancel', endD);
  el.addEventListener('dblclick', (e) => { if (!(e.target as HTMLElement).closest('.dh')) return; off = { x: 0, y: 0 }; placeOff(); try { localStorage.setItem('karmika.ui.dlg', JSON.stringify(off)); } catch { /* */ } });
  let cur: DialogOpts | null = null, view: { quest: QuestDef; mode: 'offer' | 'turnin' | 'meet'; conv?: { steps: Step[]; i: number; log: { who: string; t: string; me?: boolean }[]; shown: number } } | null = null;
  let typeT = 0;
  const esc = (s: string) => G(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
  function render() {
    if (!cur) { el.style.display = 'none'; return; }
    const o = cur;
    const head = `<div class="dh"><div class="pf">${o.portrait ? `<img src="${o.portrait}" alt="">` : `<span>${esc(o.name[0])}</span>`}</div><div><b>${esc(o.name)}</b><small>${esc(o.role)}</small></div><button class="x" data-close>✕</button></div>`;
    let body: string;
    if (view && view.conv) { // conversa: o que já foi dito (apagado) e a fala atual, letra por letra
      const cv = view.conv, st = cv.steps[cv.i], last = cv.log[cv.log.length - 1];
      const hist = cv.log.slice(-5, -1).map((l) => `<p class="ln old${l.me ? ' me' : ''}"><b>${esc(l.who)}</b> ${esc(l.t)}</p>`).join('');
      const curL = last ? `<p class="ln now${last.me ? ' me' : ''}"><b>${esc(last.who)}</b> <span data-type>${esc(last.t.slice(0, cv.shown))}</span></p>` : '';
      const typing = !!last && cv.shown < last.t.length;
      let act = '';
      if (!typing) {
        if (st && typeof st === 'object' && 'r' in st) { const lean = o.lean?.() ?? null; const rs = st.r.filter((r) => !r.need || r.need === lean);
          act = `${st.q ? `<p class="ask">${esc(st.q)}</p>` : ''}<div class="reps">${rs.map((r) => `<button class="rep" data-rep="${st.r.indexOf(r)}">${esc(nm(r.t))}</button>`).join('')}</div>`; }
        else act = `<div class="btns"><button class="ok" data-next>${st === undefined ? (view.mode === 'offer' ? 'Ver a missão ▸' : view.mode === 'meet' ? 'Até logo ▸' : 'Receber a recompensa ▸') : 'Continuar ▸'}</button></div>`;
      }
      body = `<div class="conv"><h3>📜 ${esc(view.quest.name)}</h3>${hist}${curL}${act}</div>`;
    } else if (view) {
      const d = view.quest, prog = (i: number) => o.objProg ? o.objProg(d, i) : 0, need = (i: number) => o.objNeed ? o.objNeed(d, i) : 1;
      body = `<div class="qd"><h3>📜 ${esc(d.name)} <small>Nv ${d.lvl}${d.chain ? ' · ' + esc(d.chain) : ' · Quadro'}</small></h3><p class="say">“${esc(d.text)}”</p>
        <div class="objs"><h4>Objetivos</h4>${d.objs.map((ob, i) => `<i>${view!.mode === 'turnin' || prog(i) >= need(i) ? '✔' : '•'} ${esc(objText(ob))}${view!.mode === 'offer' ? '' : ` <em>${prog(i)}/${need(i)}</em>`}</i>`).join('')}</div>
        <div class="rew"><h4>Recompensa</h4><i>✨ ${d.xp} XP</i><i>🪙 ${d.gold} ouro</i>${(d.items ?? []).map(([it, n]) => `<i>🎒 ${n}× ${esc(ITEMS[it]?.name ?? it)}</i>`).join('')}${d.gear ? `<i>⚔ ${d.gear} equipamento${d.gear > 1 ? 's' : ''} (≥ Raro)</i>` : ''}${d.title ? `<i>🏅 Título: ${esc(d.title)}</i>` : ''}</div>
        <div class="btns">${view.mode === 'offer' ? `<button class="ok" data-accept>Aceitar missão</button><button data-back>Agora não</button>` : (d.choice ? `<div class="qchoice"><p>${esc(d.choice.q)}</p>${d.choice.opts.map((c, i) => `<button class="ok" data-qc="${i}">${esc(c.label)}</button>`).join('')}</div>` : `<button class="ok" data-turnin>Entregar</button>`) + `<button data-back>Voltar</button>`}</div></div>`;
    } else {
      body = `<p class="say">“${esc(o.text)}”</p><div class="ch">${o.choices.map((c, i) => `<button class="c ${c.kind}" data-i="${i}"><span>${esc(c.label)}</span>${c.hint ? `<small>${esc(c.hint)}</small>` : ''}</button>`).join('')}</div>`;
    }
    el.innerHTML = `<div class="dp">${head}${body}<div class="ft">Esc fecha</div></div>`;
    { const cv = el.querySelector('.conv') as HTMLElement | null; if (cv) cv.scrollTop = cv.scrollHeight; }
    el.style.display = 'flex'; requestAnimationFrame(placeOff);
  }
  const nm = (t: string) => G(t.replace(/\{nome\}/g, cur?.me || 'Caminhante'));
  const who = (st: Step): { who: string; t: string; me?: boolean } | null => typeof st === 'string' ? { who: cur!.name, t: nm(st) } : 'me' in st ? { who: cur!.me || 'Você', t: nm(st.me), me: true } : 'who' in st ? { who: st.who, t: nm(st.t) } : null;
  /** avança a conversa até a próxima fala (ou escolha); no fim, mostra o cartão da missão */
  function step() { if (!view?.conv) return; const cv = view.conv;
    if (cv.i >= cv.steps.length) { if (view.mode === 'meet') { const f = cur?.meet?.onEnd; close(); f?.(); return; } view.conv = undefined; render(); return; }
    const l = who(cv.steps[cv.i]); if (l) { cv.log.push(l); cv.shown = 0; cv.i++; typeOn(); } render(); }
  function typeOn() { clearInterval(typeT); const t0 = performance.now(); typeT = window.setInterval(() => { const cv = view?.conv, l = cv?.log[cv.log.length - 1]; if (!cv || !l) { clearInterval(typeT); return; } cv.shown = Math.min(l.t.length, Math.floor((performance.now() - t0) / 1000 * 70)); /* 70 letras por segundo, pelo relógio (não trava se o quadro pesar) */ if (cv.shown >= l.t.length) { clearInterval(typeT); render(); return; } const sp = el.querySelector('[data-type]'); if (sp) sp.textContent = l.t.slice(0, cv.shown); const cvE = el.querySelector('.conv') as HTMLElement | null; if (cvE) cvE.scrollTop = cvE.scrollHeight; }, 16); }
  function startConv(q: QuestDef, mode: 'offer' | 'turnin') { const steps = mode === 'offer' ? q.talk : q.done; view = { quest: q, mode }; if (steps?.length) { view.conv = { steps: [...steps], i: 0, log: [], shown: 0 }; step(); } else render(); }
  el.addEventListener('click', (e) => {
    const t = e.target as HTMLElement; if (!cur) return;
    if (view?.conv) { const cv = view.conv, l = cv.log[cv.log.length - 1];
      if (t.closest('.ln.now') && l && cv.shown < l.t.length) { cv.shown = l.t.length; clearInterval(typeT); render(); return; } // clicar na fala: mostra inteira
      if (t.closest('[data-next]')) { step(); return; }
      const rb = t.closest('[data-rep]') as HTMLElement | null; if (rb) { const st = cv.steps[cv.i] as { r: Reply[] }, r = st.r[+rb.dataset.rep!]; cv.i++;
        const ans = r.a === undefined ? [] : Array.isArray(r.a) ? r.a : [r.a]; cv.steps.splice(cv.i, 0, { me: r.t }, ...ans); cur.onReply?.(r, view.quest, view.mode === 'turnin' ? 'done' : 'talk'); step(); return; } }
    if (t.closest('[data-close]') || t === el) { close(); return; }
    if (t.closest('[data-back]')) { view = null; render(); return; }
    if (t.closest('[data-accept]') && view) { const d = view.quest; cur.onAccept(d); close(); return; }
    if (t.closest('[data-turnin]') && view) { const d = view.quest; cur.onTurnIn(d); close(); return; }
    { const qc = t.closest('[data-qc]') as HTMLElement | null; if (qc && view) { const d = view.quest; cur.onTurnIn(d, +qc.dataset.qc!); close(); return; } }
    const b = t.closest('[data-i]') as HTMLElement | null; if (!b) return;
    const c = cur.choices[+b.dataset.i!]; if (!c) return;
    if (c.kind === 'quest' && c.quest) { startConv(c.quest, 'offer'); return; }
    if (c.kind === 'turnin' && c.quest) { startConv(c.quest, 'turnin'); return; }
    if (c.kind === 'close') { close(); return; }
    if (c.kind === 'talk') { c.cb?.(); render(); return; }
    close(); c.cb?.();
  });
  function open(o: DialogOpts) { cur = o; view = null; if (o.meet) { view = { quest: o.meet.quest, mode: 'meet', conv: { steps: [...o.meet.steps], i: 0, log: [], shown: 0 } }; step(); return; } render(); }
  function close() { clearInterval(typeT); cur = null; view = null; render(); }
  function setText(t: string) { if (cur) { cur.text = t; render(); } }
  return { open, close, setText, get isOpen() { return !!cur; } };
}

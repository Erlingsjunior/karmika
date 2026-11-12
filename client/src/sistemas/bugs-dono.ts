/* RELATAR BUG E O PAINEL DO DONO (03/11, Erling: "um ícone abaixo do mapa com o desenho de um inseto, tooltip Reportar um bug: a pessoa
   coloca um print e explica o bug, eu recebo isso na minha tela. Cada bug terá um número de id específico; eu faço as branches com esses
   números e vou atacando os bugs." / "uma tela onde posso ver jogadores online, o que estão fazendo, enviar mensagens no jogo").
   - O inseto 🐞 embaixo do minimapa (ou F10): print da tela já anexado, outra imagem (arquivo ou Ctrl+V), categoria e a explicação.
     Junto vai sozinho: onde o herói está (tile e região), nível, classe, modo de desenho, FPS e a versão. A sala devolve o número
     (KB-0001…). Sem sala, o relatório espera guardado nesta máquina e sai quando entrar.
   - O dono entra com /dono CHAVE (a chave está em dono-chave.txt, ao lado dos dados da sala, e aparece no log da sala ao abrir).
     O painel (a coroa embaixo do minimapa, ou F11): quem está online e o que está fazendo, mensagem para um ou para todos, e a caixa de
     bugs com print, contexto, estado (novo, vendo, corrigido, não é bug) e uma resposta que chega para quem relatou. */
import { admSenha, onAdm } from './admin';
import type { Net } from '../net';

export interface BugCtx {
  net(): Net | null;
  /** o quadro do jogo como JPEG (dataURL), tirado logo depois do próximo desenho */
  shot(): Promise<string | null>;
  /** o que vai junto com o relatório */
  info(): Record<string, string | number | boolean>;
  /** o que o jogador está fazendo agora (para o painel do dono) */
  doing(): Record<string, string | number>;
  log(text: string, col?: string): void;
}

const QK = 'karmika.bugq', OK = 'karmika.dono', MK = 'karmika.bugs.mine';
const CATS: [string, string][] = [['visual', 'Visual (algo estranho na tela)'], ['travou', 'Travou ou ficou lento'], ['preso', 'Personagem preso / não anda'], ['missao', 'Missão'], ['combate', 'Combate e skills'], ['interface', 'Janelas e botões'], ['item', 'Itens, loja, inventário'], ['outro', 'Outro']];
const ST: Record<string, [string, string]> = { novo: ['Novo', '#ffcf6a'], vendo: ['Vendo', '#7ac8ff'], corrigido: ['Corrigido', '#7ae09a'], 'nao-e-bug': ['Não é bug', '#a89a88'] };
const esc = (t: unknown) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const when = (t: number) => { const d = new Date(t); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const ago = (t: number) => { const s = Math.max(0, Math.round((Date.now() - t) / 1000)); return s < 60 ? `${s} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.round(s / 3600)} h`; };
const load = <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : d; } catch { return d; } };
const keep = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* cheio: o relatório vai sem guardar */ } };
/** encolhe uma imagem (dataURL) para no máximo `w` de largura, em JPEG */
function shrink(url: string, w = 1280, q = 0.8): Promise<string> {
  return new Promise((res) => { const im = new Image(); im.onload = () => { const k = Math.min(1, w / im.width), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q)); }; im.onerror = () => res(''); im.src = url; });
}

const CSS = `
#btns button[data-b="bug"] svg, #btns button[data-b="dono"] svg { width: 22px; height: 22px; }
#btns button[data-b="dono"] { display: none; } body.kdono #btns button[data-b="dono"] { display: inline-grid; }
.kbug, .kdono-w { position: fixed; inset: 0; z-index: 9500; display: none; align-items: center; justify-content: center; background: rgba(0,0,0,.45); }
.kbug.on, .kdono-w.on { display: flex; }
.kbug .pn { width: min(620px, calc(94vw / var(--ui))); max-height: calc(90vh / var(--ui)); display: flex; flex-direction: column; gap: 10px; padding: 16px 20px; overflow: auto; }
.kbug h2, .kdono-w h2 { display: flex; align-items: center; gap: 10px; margin: 0; font: 700 18px Cinzel, serif; color: #f0d890; } .kbug h2 small, .kdono-w h2 small { flex: 1; font: italic 12px Georgia, serif; color: #a8987a; }
.kbug h2 button, .kdono-w h2 button { background: none; border: 1px solid #5a4a30; color: #c8b890; width: 30px; height: 30px; cursor: pointer; }
.kbug label { font: 600 12px Georgia, serif; color: #d8c8a0; display: flex; flex-direction: column; gap: 4px; }
.kbug select, .kbug input[type=text], .kbug textarea, .kdono-w textarea, .kdono-w input[type=text] { background: #120c08; color: #f0e6cc; border: 1px solid #5a4a30; border-radius: 3px; padding: 7px 9px; font: 13px Georgia, serif; }
.kbug textarea { min-height: 110px; resize: vertical; }
.kbug .shots { display: flex; gap: 10px; flex-wrap: wrap; } .kbug .shot { position: relative; width: 200px; border: 1px solid #5a4a30; border-radius: 3px; overflow: hidden; background: #0a0705; }
.kbug .shot img { display: block; width: 100%; } .kbug .shot span { position: absolute; left: 6px; top: 4px; font: 11px Georgia, serif; color: #ffe08a; text-shadow: 0 1px 2px #000; }
.kbug .shot button { position: absolute; right: 4px; top: 4px; background: #1a120a; border: 1px solid #5a4a30; color: #e8c890; cursor: pointer; font-size: 11px; }
.kbug .add { width: 200px; min-height: 110px; border: 1px dashed #6a5a40; border-radius: 3px; display: grid; place-items: center; text-align: center; color: #a8987a; font: 12px Georgia, serif; cursor: pointer; padding: 8px; }
.kbug .ctx { font: 11px Georgia, serif; color: #a8987a; line-height: 1.45; }
.kbug .row { display: flex; gap: 10px; justify-content: flex-end; align-items: center; } .kbug .row .note { flex: 1; font: italic 12px Georgia, serif; color: #c8b890; }
.kbug button.go, .kdono-w button.go { background: linear-gradient(#a8823a, #6a4a1a); border: 1px solid #e0b45a; color: #fff4d0; font: 700 13px Cinzel, serif; padding: 8px 16px; cursor: pointer; border-radius: 3px; }
.kbug button.go:disabled { opacity: .5; cursor: default; }
.kbug .mine { border-top: 1px solid #3a2c1a; padding-top: 8px; font: 12px Georgia, serif; color: #c8b890; } .kbug .mine div { display: flex; gap: 8px; padding: 2px 0; } .kbug .mine b { color: #f0d890; min-width: 66px; }
.kst { font: 700 10.5px Cinzel, serif; letter-spacing: .06em; padding: 1px 6px; border-radius: 9px; border: 1px solid currentColor; white-space: nowrap; }
.kdono-w .pn { width: min(1180px, calc(96vw / var(--ui))); height: min(780px, calc(90vh / var(--ui))); display: flex; flex-direction: column; padding: 14px 18px; gap: 10px; overflow: hidden; }
.kdono-w nav { display: flex; gap: 4px; border-bottom: 1px solid #3a2c1a; } .kdono-w nav button { background: #1a120a; border: 1px solid #3a2c1a; border-bottom: none; color: #c8b890; padding: 7px 14px; font: 700 12px Cinzel, serif; cursor: pointer; }
.kdono-w nav button.on { background: #2a1e12; color: #f0d890; border-color: #8a6a3a; }
.kdono-w .body { flex: 1; min-height: 0; display: flex; gap: 12px; }
.kdono-w .list { flex: 1; min-width: 0; overflow: auto; scrollbar-gutter: stable; }
.kdono-w table { width: 100%; border-collapse: collapse; font: 12.5px Georgia, serif; color: #e8dcc0; } .kdono-w th { text-align: left; font: 700 11px Cinzel, serif; color: #a8987a; padding: 6px; border-bottom: 1px solid #3a2c1a; position: sticky; top: 0; background: #17110b; }
.kdono-w td { padding: 6px; border-bottom: 1px solid #241a10; vertical-align: top; } .kdono-w tr.pick { cursor: pointer; } .kdono-w tr.pick:hover td { background: #22180e; } .kdono-w tr.sel td { background: #2c2012; }
.kdono-w td small { color: #a8987a; display: block; }
.kdono-w td button { background: #1a120a; border: 1px solid #5a4a30; color: #e8c890; cursor: pointer; font-size: 11px; padding: 3px 8px; }
.kdono-w .det { width: 46%; min-width: 0; overflow: auto; border-left: 1px solid #3a2c1a; padding-left: 12px; font: 13px Georgia, serif; color: #e8dcc0; display: flex; flex-direction: column; gap: 8px; }
.kdono-w .det h3 { margin: 0; font: 700 15px Cinzel, serif; color: #f0d890; } .kdono-w .det img { width: 100%; border: 1px solid #5a4a30; cursor: zoom-in; }
.kdono-w .det pre { white-space: pre-wrap; font: 13px Georgia, serif; margin: 0; background: #120c08; padding: 8px; border: 1px solid #3a2c1a; }
.kdono-w .det .ctx { font: 11.5px Georgia, serif; color: #a8987a; display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; }
.kdono-w .det .sts { display: flex; gap: 6px; flex-wrap: wrap; } .kdono-w .det .sts button { background: #1a120a; border: 1px solid #5a4a30; color: #c8b890; padding: 4px 10px; cursor: pointer; font: 700 11px Cinzel, serif; } .kdono-w .det .sts button.on { color: #120c08; background: var(--c); border-color: var(--c); }
.kdono-w .say { display: flex; flex-direction: column; gap: 8px; max-width: 640px; font: 13px Georgia, serif; color: #d8c8a0; } .kdono-w .say textarea { min-height: 90px; }
.kdono-w .filt { display: flex; gap: 6px; margin-bottom: 6px; } .kdono-w .filt button { background: #1a120a; border: 1px solid #3a2c1a; color: #a8987a; padding: 3px 9px; cursor: pointer; font: 11px Georgia, serif; } .kdono-w .filt button.on { color: #f0d890; border-color: #8a6a3a; }
.ksay { position: fixed; left: 50%; top: 18%; transform: translateX(-50%); z-index: 9600; width: min(560px, 90vw); background: linear-gradient(#2a1e12, #160f09); border: 1px solid #e0b45a; box-shadow: 0 0 40px rgba(224,180,90,.3), 0 10px 40px #000; padding: 16px 20px; text-align: center; color: #f0e6cc; font: 14px Georgia, serif; border-radius: 4px; }
.ksay small { display: block; font: 700 11px Cinzel, serif; letter-spacing: .14em; color: #e0b45a; margin-bottom: 6px; } .ksay button { margin-top: 10px; background: #1a120a; border: 1px solid #8a6a3a; color: #f0d890; padding: 5px 16px; cursor: pointer; font: 700 12px Cinzel, serif; }
.kzoom { position: fixed; inset: 0; z-index: 9700; background: rgba(0,0,0,.85); display: flex; align-items: center; justify-content: center; cursor: zoom-out; } .kzoom img { max-width: 96vw; max-height: 94vh; }
`;
const BUG_SVG = '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="19" rx="7" ry="9" fill="#b3202f" stroke="#3a1008" stroke-width="1.4"/><path d="M16 10v18" stroke="#3a1008" stroke-width="1.3"/><circle cx="16" cy="9" r="3.6" fill="#2a1a10" stroke="#e8c890" stroke-width="1"/><path d="M13 6l-2-3M19 6l2-3M9 15l-4-2M9 20H4M10 25l-4 3M23 15l4-2M23 20h5M22 25l4 3" stroke="#e8c890" stroke-width="1.5" stroke-linecap="round"/><circle cx="13" cy="16" r="1.4" fill="#1a0a04"/><circle cx="19" cy="21" r="1.4" fill="#1a0a04"/><circle cx="13.5" cy="23" r="1.1" fill="#1a0a04"/></svg>';
const CROWN_SVG = '<svg viewBox="0 0 32 32"><path d="M5 23L4 10l7 6 5-9 5 9 7-6-1 13z" fill="#ffd24a" stroke="#7a4a10" stroke-width="1.4" stroke-linejoin="round"/><rect x="5" y="23" width="22" height="4" fill="#e0b040" stroke="#7a4a10" stroke-width="1.2"/></svg>';

type BugMeta = { id: string; n: number; at: number; by: { name: string; lvl: number; cls: string }; cat: string; title: string; status: string; note: string; img: boolean; img2: boolean; ctx: Record<string, unknown> };
type Det = { bug: BugMeta & { text: string; hist: { at: number; status: string; note: string }[] }; img: string | null; img2: string | null };
type Pl = { id: number; name: string; host: boolean; owner: boolean; lvl: number; cls: string; st: { x: number; z: number; zn: string; hp?: number; cb?: 1; rd?: 1 } | null; doing: Record<string, string | number> | null; since: number; lastAct: { a: string; at: number } | null; party: number };

export function createBugsDono(K: BugCtx) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  /* os dois botões embaixo do minimapa */
  const btns = document.getElementById('btns');
  const bugBtn = document.createElement('button'); bugBtn.dataset.b = 'bug'; bugBtn.title = 'Reportar um bug (F10)'; bugBtn.innerHTML = BUG_SVG;
  const donoBtn = document.createElement('button'); donoBtn.dataset.b = 'dono'; donoBtn.title = 'Painel do dono (F11)'; donoBtn.innerHTML = CROWN_SVG;
  btns?.appendChild(bugBtn); btns?.appendChild(donoBtn);
  bugBtn.addEventListener('click', (e) => { e.stopPropagation(); openReport(); });
  donoBtn.addEventListener('click', (e) => { e.stopPropagation(); openPanel(); });

  /* ================= o relatório ================= */
  const rep = document.createElement('div'); rep.className = 'kbug'; document.body.appendChild(rep);
  let shot1: string | null = null, shot2: string | null = null, sending = false, mine: { id: string; title: string; status: string; note: string; at: number }[] = load(MK, []);
  function repHtml() {
    const q = load<unknown[]>(QK, []); const inf = K.info();
    rep.innerHTML = `<div class="pn"><h2>🐞 Reportar um bug<small>obrigado por ajudar a deixar Karmika melhor</small><button data-x>✕</button></h2>
      <label>O que aconteceu?<select data-cat>${CATS.map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select></label>
      <label>Resumo (uma linha)<input type="text" data-title maxlength="90" placeholder="Ex.: o personagem fica preso na grama perto da fonte"></label>
      <label>Explique o bug: o que você fez, o que esperava e o que aconteceu<textarea data-text maxlength="4000" placeholder="Passo a passo ajuda muito: 1) fui até… 2) cliquei em… 3) aconteceu…"></textarea></label>
      <div class="shots">${shot1 ? `<div class="shot"><span>print da tela</span><button data-rm="1">tirar</button><img src="${shot1}" alt=""></div>` : `<div class="add" data-reshot>📷 Tirar print da tela de novo</div>`}
        ${shot2 ? `<div class="shot"><span>sua imagem</span><button data-rm="2">tirar</button><img src="${shot2}" alt=""></div>` : `<div class="add" data-pick>➕ Anexar outra imagem<br><small>clique para escolher, ou cole com Ctrl+V</small></div>`}</div>
      <input type="file" accept="image/*" data-file hidden>
      <div class="ctx">Vai junto, sozinho: ${esc(`tile ${inf.tx}, ${inf.ty} · ${inf.reg} · nível ${inf.lvl} ${inf.cls} · ${inf.rend} · ${inf.fps} fps · versão ${inf.build}`)}.</div>
      <div class="row"><span class="note">${K.net()?.state === 'on' ? 'Você recebe o número do relatório na hora.' : 'Você não está numa sala agora: o relatório fica guardado e sai sozinho quando entrar no servidor.'}${q.length ? ` (${q.length} esperando para sair)` : ''}</span><button class="go" data-send>Enviar relatório</button></div>
      ${mine.length ? `<div class="mine"><b style="min-width:0">Seus relatórios</b>${mine.slice(-8).reverse().map((b) => `<div><b>${esc(b.id)}</b><span class="kst" style="color:${(ST[b.status] ?? ST.novo)[1]}">${(ST[b.status] ?? ST.novo)[0]}</span><span>${esc(b.title)}${b.note ? ` — <i>${esc(b.note)}</i>` : ''}</span></div>`).join('')}</div>` : ''}
    </div>`;
  }
  async function openReport() {
    shot1 = null; shot2 = null; try { const u = await K.shot(); shot1 = u ? await shrink(u) : null; } catch { shot1 = null; }
    repHtml(); rep.classList.add('on'); (rep.querySelector('[data-text]') as HTMLTextAreaElement | null)?.focus();
    const n = K.net(); if (n?.state === 'on') n.raw({ t: 'bug:mine' });
  }
  const closeReport = () => rep.classList.remove('on');
  const keepFields = () => { const g = (s: string) => (rep.querySelector(s) as HTMLInputElement | null)?.value ?? ''; return { cat: g('[data-cat]'), title: g('[data-title]'), text: g('[data-text]') }; };
  const putFields = (f: { cat: string; title: string; text: string }) => { const s = (q: string, v: string) => { const e = rep.querySelector(q) as HTMLInputElement | null; if (e) e.value = v; }; s('[data-cat]', f.cat || 'visual'); s('[data-title]', f.title); s('[data-text]', f.text); };
  const reRender = () => { const f = keepFields(); repHtml(); putFields(f); };
  const takeFile = (file: File | null | undefined) => { if (!file || !/^image\//.test(file.type)) return; const r = new FileReader(); r.onload = async () => { shot2 = await shrink(String(r.result), 1600, 0.85); reRender(); }; r.readAsDataURL(file); };
  rep.addEventListener('click', async (e) => { const t = e.target as HTMLElement;
    if (t === rep || t.closest('[data-x]')) { closeReport(); return; }
    const rm = (t.closest('[data-rm]') as HTMLElement | null)?.dataset.rm; if (rm) { if (rm === '1') shot1 = null; else shot2 = null; reRender(); return; }
    if (t.closest('[data-reshot]')) { const f = keepFields(); rep.classList.remove('on'); try { const u = await K.shot(); shot1 = u ? await shrink(u) : null; } catch { /* */ } repHtml(); putFields(f); rep.classList.add('on'); return; }
    if (t.closest('[data-pick]')) { (rep.querySelector('[data-file]') as HTMLInputElement | null)?.click(); return; }
    if (t.closest('[data-send]') && !sending) send(); });
  rep.addEventListener('change', (e) => { const t = e.target as HTMLInputElement; if (t.matches('[data-file]')) takeFile(t.files?.[0]); });
  rep.addEventListener('paste', (e) => { const it = Array.from(e.clipboardData?.items ?? []).find((x) => x.type.startsWith("image/")); if (it) { e.preventDefault(); takeFile(it.getAsFile()); } });
  rep.addEventListener('keydown', (e) => e.stopPropagation()); /* digitar aqui não anda com o herói */
  function send() {
    const f = keepFields(); if (f.text.trim().length < 4) { (rep.querySelector('[data-text]') as HTMLTextAreaElement | null)?.focus(); K.log('🐞 Conte um pouco do que aconteceu para mandar o relatório.', '#ffb08a'); return; }
    const ref = 'r' + Date.now().toString(36);
    const m = { t: 'bug:new', ref, cat: f.cat, title: f.title.trim(), text: f.text.trim(), ctx: K.info(), img: shot1, img2: shot2 };
    const n = K.net();
    if (n?.state === 'on' && n.raw(m)) { sending = true; (rep.querySelector('[data-send]') as HTMLButtonElement | null)?.setAttribute('disabled', ''); setTimeout(() => { if (sending) { sending = false; K.log('🐞 A sala não respondeu: o relatório ficou guardado e sai na próxima vez.', '#ffb08a'); queue(m); closeReport(); } }, 15000); }
    else { queue(m); K.log('🐞 Relatório guardado: ele sai sozinho quando você entrar no servidor.', '#ffd88a'); closeReport(); }
  }
  /* guarda sem as imagens se não couber */
  function queue(m: Record<string, unknown>) { const q = load<Record<string, unknown>[]>(QK, []); q.push(m); try { localStorage.setItem(QK, JSON.stringify(q.slice(-10))); } catch { q[q.length - 1] = { ...m, img: null, img2: null }; keep(QK, q.slice(-10)); } }
  /* a fila sai quando a sala estiver ligada */
  setInterval(() => { const n = K.net(); if (n?.state !== 'on') return; const q = load<Record<string, unknown>[]>(QK, []); if (!q.length) return; for (const m of q) n.raw(m); keep(QK, []); }, 5000);

  /* ================= o painel do dono ================= */
  const pan = document.createElement('div'); pan.className = 'kdono-w'; document.body.appendChild(pan);
  let isOwner = false, tab: 'jog' | 'bugs' | 'aviso' = 'bugs', bugs: BugMeta[] = [], players: Pl[] = [], sel: string | null = null, det: Det | null = null, filt = 'abertos', toId = 0;
  const own = () => isOwner;
  function setOwner(on: boolean) { isOwner = on; document.body.classList.toggle('kdono', on); }
  function hello() { const k = load<string>(OK, ''), ps = admSenha(); const n = K.net(); if ((k || ps) && n?.state === 'on') n.raw({ t: 'adm:hello', key: k, pass: ps }); } /* 12/11: a senha do /adm também abre o painel (a sala confere) */
  onAdm((on) => { if (on) { wire(); hello(); } else setOwner(false); });
  function openPanel() { if (!own()) { K.log('👑 O painel é só do dono da sala. No chat: /dono CHAVE (a chave está no log da sala e em dono-chave.txt).', '#ffd88a'); return; } pan.classList.add('on'); K.net()?.raw({ t: 'adm:players' }); K.net()?.raw({ t: 'adm:bugs' }); panHtml(); }
  const closePanel = () => pan.classList.remove('on');
  const shown = () => bugs.filter((b) => filt === 'todos' || (filt === 'abertos' ? b.status === 'novo' || b.status === 'vendo' : b.status === filt)).slice().reverse();
  function doingTxt(p: Pl) { const d = p.doing || {}; const bits: string[] = []; if (d.act) bits.push(String(d.act)); if (d.reg) bits.push(String(d.reg)); if (d.q) bits.push(`missão: ${d.q}`); if (p.lastAct && Date.now() - p.lastAct.at < 15000) bits.push(`golpe ${p.lastAct.a}`); return bits.join(' · ') || '—'; }
  function panHtml() { panHtmlInto(pan); }
  function panHtmlInto(target: HTMLElement) {
    const cnt = { novo: bugs.filter((b) => b.status === 'novo').length };
    let body = '';
    if (tab === 'jog') body = `<div class="list"><table><tr><th>Jogador</th><th>Nível · classe</th><th>Onde e o que está fazendo</th><th>Vida</th><th>Online há</th><th></th></tr>${players.map((p) => `<tr><td><b>${esc(p.name)}</b>${p.host ? ' <small>anfitrião</small>' : ''}${p.owner ? ' <small>dono</small>' : ''}</td><td>${p.lvl} · ${esc(p.cls)}</td><td>${esc(doingTxt(p))}<small>${p.st ? `x ${Math.round(p.st.x)} · z ${Math.round(p.st.z)}${p.st.zn && p.st.zn !== 'rua' && p.st.zn !== 'world' ? ` · dentro: ${esc(p.st.zn)}` : ''}` : ''}${p.doing?.fps ? ` · ${p.doing.fps} fps` : ''}${p.doing?.rend ? ` · ${esc(p.doing.rend)}` : ''}</small></td><td>${p.st?.hp ?? '—'}${p.st?.cb ? ' ⚔' : ''}${p.st?.rd ? ' 🐎' : ''}</td><td>${ago(p.since)}</td><td><button data-to="${p.id}">✉ Mensagem</button></td></tr>`).join('') || '<tr><td colspan="6">Ninguém na sala agora.</td></tr>'}</table></div>`;
    else if (tab === 'bugs') body = `<div class="list"><div class="filt">${[['abertos', 'Abertos'], ['novo', 'Novos'], ['vendo', 'Vendo'], ['corrigido', 'Corrigidos'], ['nao-e-bug', 'Não é bug'], ['todos', 'Todos']].map(([k, n]) => `<button data-f="${k}" class="${filt === k ? 'on' : ''}">${n}</button>`).join('')}</div>
        <table><tr><th>ID</th><th>Estado</th><th>Resumo</th><th>Quem</th><th>Quando</th></tr>${shown().map((b) => `<tr class="pick ${sel === b.id ? 'sel' : ''}" data-bug="${b.id}"><td><b>${b.id}</b></td><td><span class="kst" style="color:${(ST[b.status] ?? ST.novo)[1]}">${(ST[b.status] ?? ST.novo)[0]}</span></td><td>${esc(b.title)}<small>${esc((CATS.find(([k]) => k === b.cat) ?? ['', b.cat])[1])}${b.img || b.img2 ? ' · 📷' : ''}</small></td><td>${esc(b.by.name)}<small>nv ${b.by.lvl} ${esc(b.by.cls)}</small></td><td>${when(b.at)}</td></tr>`).join('') || '<tr><td colspan="5">Nenhum bug aqui.</td></tr>'}</table></div>
      <div class="det">${det && det.bug.id === sel ? detHtml() : '<p style="color:#a8987a">Clique num bug para ver o print, o texto e onde o jogador estava.</p>'}</div>`;
    else body = `<div class="say"><p>Mensagem que aparece no meio da tela de quem está na sala, como <b>“Mensagem do Criador de Karmika”</b>.</p>
      <label>Para<select data-sayto><option value="0">Todos na sala</option>${players.map((p) => `<option value="${p.id}" ${toId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
      <textarea data-saytext maxlength="500" placeholder="Ex.: o servidor reinicia em 5 minutos para a atualização."></textarea><div><button class="go" data-say>Enviar</button></div></div>`;
    target.innerHTML = `<div class="pn"><h2>👑 Painel do dono<small>${players.length} na sala · ${cnt.novo} bug(s) novo(s)</small><button data-r title="Atualizar">⟳</button><button data-x>✕</button></h2>
      <nav><button data-tab="bugs" class="${tab === 'bugs' ? 'on' : ''}">🐞 Bugs (${bugs.length})</button><button data-tab="jog" class="${tab === 'jog' ? 'on' : ''}">👥 Jogadores online (${players.length})</button><button data-tab="aviso" class="${tab === 'aviso' ? 'on' : ''}">✉ Mensagem</button></nav>
      <div class="body">${body}</div></div>`;
  }
  function detHtml() {
    const b = det!.bug, c = b.ctx || {};
    const CL: [string, string][] = [['tx', 'Tile X'], ['ty', 'Tile Y'], ['reg', 'Região'], ['inside', 'Dentro de'], ['lvl', 'Nível'], ['cls', 'Classe'], ['race', 'Raça'], ['rend', 'Desenho'], ['fps', 'FPS'], ['pix', 'Modo'], ['build', 'Versão'], ['q', 'Missão'], ['res', 'Tela'], ['ua', 'Navegador']];
    return `<h3>${b.id} · ${esc(b.title)}</h3><div style="color:#a8987a;font-size:12px">${esc(b.by.name)} (nv ${b.by.lvl} ${esc(b.by.cls)}) · ${when(b.at)} · branch: <b style="color:#f0d890">bug/${b.id}</b> <button data-copy="bug/${b.id}">copiar</button></div>
      <pre>${esc(b.text)}</pre>
      ${det!.img ? `<img src="${det!.img}" alt="" data-zoom>` : ''}${det!.img2 ? `<img src="${det!.img2}" alt="" data-zoom>` : ''}
      <div class="ctx">${CL.filter(([k]) => c[k] !== undefined && c[k] !== '').map(([k, n]) => `<span>${n}</span><span>${esc(c[k])}</span>`).join('')}</div>
      <div class="sts">${Object.entries(ST).map(([k, [n, col]]) => `<button data-st="${k}" class="${b.status === k ? 'on' : ''}" style="--c:${col}">${n}</button>`).join('')}</div>
      <textarea data-note maxlength="600" placeholder="Resposta para ${esc(b.by.name)} (chega no jogo dele): ex. corrigido na versão de hoje, obrigado!">${esc(b.note || '')}</textarea>
      <div><button class="go" data-savenote>Salvar e avisar ${esc(b.by.name)}</button></div>
      ${b.hist?.length ? `<div style="font-size:11.5px;color:#a8987a">${b.hist.map((h) => `${when(h.at)} — ${(ST[h.status] ?? ST.novo)[0]}${h.note ? `: ${esc(h.note)}` : ''}`).join('<br>')}</div>` : ''}`;
  }
  pan.addEventListener('click', (e) => { const t = e.target as HTMLElement; const n = K.net();
    if (t === pan || t.closest('[data-x]')) { closePanel(); return; }
    if (t.closest('[data-r]')) { n?.raw({ t: 'adm:players' }); n?.raw({ t: 'adm:bugs' }); return; }
    const tb = (t.closest('[data-tab]') as HTMLElement | null)?.dataset.tab; if (tb) { tab = tb as typeof tab; panHtml(); if (tab === 'jog') n?.raw({ t: 'adm:players' }); return; }
    const f = (t.closest('[data-f]') as HTMLElement | null)?.dataset.f; if (f) { filt = f; panHtml(); return; }
    const z = t.closest('[data-zoom]') as HTMLImageElement | null; if (z) { const d = document.createElement('div'); d.className = 'kzoom'; d.innerHTML = `<img src="${z.src}" alt="">`; d.onclick = () => d.remove(); document.body.appendChild(d); return; }
    const cp = (t.closest('[data-copy]') as HTMLElement | null)?.dataset.copy; if (cp) { void navigator.clipboard?.writeText(cp).then(() => K.log(`📋 ${cp} copiado.`, '#c8d8f0'), () => { /* */ }); return; }
    const bg = (t.closest('[data-bug]') as HTMLElement | null)?.dataset.bug; if (bg) { sel = bg; det = null; panHtml(); n?.raw({ t: 'adm:bug', id: bg }); return; }
    const s2 = (t.closest('[data-st]') as HTMLElement | null)?.dataset.st; if (s2 && sel) { n?.raw({ t: 'adm:set', id: sel, status: s2 }); return; }
    if (t.closest('[data-savenote]') && sel) { const note = (pan.querySelector('[data-note]') as HTMLTextAreaElement | null)?.value ?? ''; n?.raw({ t: 'adm:set', id: sel, status: det?.bug.status ?? 'vendo', note }); K.log(`👑 Resposta salva no ${sel}.`, '#ffd88a'); return; }
    const to = (t.closest('[data-to]') as HTMLElement | null)?.dataset.to; if (to) { toId = +to; tab = 'aviso'; panHtml(); (pan.querySelector('[data-saytext]') as HTMLTextAreaElement | null)?.focus(); return; }
    if (t.closest('[data-say]')) { const text = (pan.querySelector('[data-saytext]') as HTMLTextAreaElement | null)?.value.trim() ?? ''; const who = +((pan.querySelector('[data-sayto]') as HTMLSelectElement | null)?.value ?? 0); if (!text) return; n?.raw({ t: 'adm:say', to: who || 0, text }); K.log(`👑 Mensagem enviada${who ? '' : ' para todos'}.`, '#ffd88a'); (pan.querySelector('[data-saytext]') as HTMLTextAreaElement).value = ''; return; } });
  pan.addEventListener('keydown', (e) => e.stopPropagation());
  /* com o painel aberto na aba de jogadores, a lista se atualiza sozinha */
  setInterval(() => { if (pan.classList.contains('on') && tab === 'jog') K.net()?.raw({ t: 'adm:players' }); }, 3000);

  /* ================= mensagens da sala ================= */
  let wired: Net | null = null;
  function wire() { const n = K.net(); if (!n || n === wired) return; wired = n;
    n.on('bug:ok', (m) => { sending = false; const id = String(m.id); const f = keepFields(); mine.push({ id, title: f.title || f.text.split('\n')[0].slice(0, 90), status: 'novo', note: '', at: Date.now() }); keep(MK, mine.slice(-40)); if (rep.classList.contains('on')) closeReport(); K.log(`🐞 Relatório ${id} enviado. Obrigado! Você é avisado quando ele andar.`, '#9ae0a0'); });
    n.on('bug:mine', (m) => { mine = ((m.list as typeof mine) ?? []).slice(-40); keep(MK, mine); if (rep.classList.contains('on')) reRender(); });
    n.on('bug:upd', (m) => { const id = String(m.id), stt = String(m.status); const x = mine.find((b) => b.id === id); if (x) { x.status = stt; x.note = String(m.note ?? ''); keep(MK, mine); } K.log(`🐞 ${id} (${String(m.title ?? '')}): ${(ST[stt] ?? ST.novo)[0]}${m.note ? ` — ${String(m.note)}` : ''}`, (ST[stt] ?? ST.novo)[1]); });
    n.on('say', (m) => { const d = document.createElement('div'); d.className = 'ksay'; d.innerHTML = `<small>✉ ${esc(m.from ?? 'Criador de Karmika')}</small>${esc(m.text)}<br><button>Entendi</button>`; d.querySelector('button')!.onclick = () => d.remove(); document.body.appendChild(d); setTimeout(() => d.remove(), 30000); K.log(`✉ ${String(m.from ?? 'Criador de Karmika')}: ${String(m.text)}`, '#ffd88a'); });
    n.on('adm:ok', (m) => { setOwner(true); bugs = (m.bugs as BugMeta[]) ?? []; players = (m.players as Pl[]) ?? []; const nv = bugs.filter((b) => b.status === 'novo').length; K.log(`👑 Painel do dono liberado (coroa embaixo do mapa, ou F9).${nv ? ` ${nv} bug(s) novo(s).` : ''}`, '#ffd88a'); if (pan.classList.contains('on')) panHtml(); });
    n.on('adm:no', () => { setOwner(false); try { localStorage.removeItem(OK); } catch { /* */ } K.log('👑 Chave do dono errada para esta sala.', '#ff9a8a'); });
    n.on('adm:players', (m) => { players = (m.list as Pl[]) ?? []; if (!pan.classList.contains('on')) return;
      /* só a lista muda (o painel inteiro redesenhado a cada 3 s perdia o clique e piscava) */
      if (tab === 'jog') { const L = pan.querySelector('.list'); const tmp = document.createElement('div'); const keepTab = tab; panHtmlInto(tmp); const nl = tmp.querySelector('.list'); if (L && nl) L.innerHTML = nl.innerHTML; tab = keepTab; }
      const sm = pan.querySelector('h2 small'); if (sm) sm.textContent = `${players.length} na sala · ${bugs.filter((b) => b.status === 'novo').length} bug(s) novo(s)`; });
    n.on('adm:bugs', (m) => { bugs = (m.list as BugMeta[]) ?? []; if (pan.classList.contains('on')) panHtml(); });
    n.on('adm:bugnew', (m) => { const b = m.bug as BugMeta; bugs.push(b); K.log(`👑 Bug novo: ${b.id} de ${b.by.name} — ${b.title}`, '#ffcf6a'); if (pan.classList.contains('on')) panHtml(); });
    n.on('adm:bugupd', (m) => { const b = m.bug as BugMeta; const i = bugs.findIndex((x) => x.id === b.id); if (i >= 0) bugs[i] = b; if (det && det.bug.id === b.id) det.bug = { ...det.bug, ...b, hist: [...det.bug.hist, { at: Date.now(), status: b.status, note: b.note }] }; if (pan.classList.contains('on')) panHtml(); });
    n.on('adm:bug', (m) => { det = { bug: m.bug as Det['bug'], img: (m.img as string) ?? null, img2: (m.img2 as string) ?? null }; if (pan.classList.contains('on')) panHtml(); });
  }
  /* a cada 5 s: liga os ouvidos na sala nova, entra no painel se tiver a chave, e conta para a sala o que o herói está fazendo */
  let helloFor: Net | null = null;
  setInterval(() => { wire(); const n = K.net(); if (n?.state !== 'on') { helloFor = null; return; } if (helloFor !== n) { helloFor = n; hello(); }
    try { n.raw({ t: 'doing', w: K.doing() }); } catch { /* */ } }, 5000);

  addEventListener('keydown', (e) => { const tg = e.target as HTMLElement | null; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
    if (e.key === 'F10') { e.preventDefault(); if (rep.classList.contains('on')) closeReport(); else void openReport(); }
    if (e.key === 'F11' && own()) { e.preventDefault(); if (pan.classList.contains('on')) closePanel(); else openPanel(); }
    if (e.key === 'Escape') { if (rep.classList.contains('on')) closeReport(); if (pan.classList.contains('on')) closePanel(); } });

  return {
    open: openReport, panel: openPanel,
    /** /dono CHAVE (chat) */
    command(cmd: string, a: string[]): string | null {
      if (cmd !== 'dono') return null; const k = a.join('').trim(); if (!k) return own() ? '👑 Você já está no painel do dono (F11).' : '👑 Uso: /dono CHAVE (está no log da sala e em dono-chave.txt).';
      keep(OK, k.toUpperCase()); const n = K.net(); if (n?.state === 'on') { wire(); n.raw({ t: 'adm:hello', key: k.toUpperCase() }); return '👑 Conferindo a chave com a sala…'; } return '👑 Chave guardada: o painel abre quando você entrar na sala.';
    },
  };
}

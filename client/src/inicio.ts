import { runaSvg } from './runas';
/* Tela de boas-vindas e os 3 espaços de personagem.
   Fluxo: abrir o jogo → "Encontrar servidor" (convite), "Abrir meu servidor" (app) ou "Jogar sozinho"
          → escolher um dos 3 personagens (ou criar um novo) → entrar no mundo.
   Os personagens ficam NESTA máquina. O personagem ativo vive nas chaves "karmika.*" de sempre;
   os outros ficam guardados inteiros em "karmika.slot.N". Trocar de personagem = guardar o atual, carregar o outro e recarregar. */
import { parseInvite, probeRoom, passFor, savePass } from './net';

export interface SlotMeta { name: string; lvl: number; cls: string; origin: string; sex: string; pic: string | null; server: string | null; t: number }
interface Slots { active: number; meta: (SlotMeta | null)[]; servers: string[] }

/** chaves que são da máquina (opções, janelas, premium, rede), não do personagem */
const GLOBAL = ['karmika.slots', 'karmika.slot.', 'karmika.opts', 'karmika.pix', 'karmika.music', 'karmika.shadows', 'karmika.mapsize', 'karmika.minisize', 'karmika.minizoom', 'karmika.minipos', 'karmika.artskin', 'karmika.rows', 'karmika.ui.', 'karmika.win.', 'karmika.coop.', 'karmika.run', 'karmika.showHelm', 'karmika.acc', 'karmika.premium', 'karmika.barlock'];
const isChar = (k: string) => k.startsWith('karmika.') && !GLOBAL.some((g) => k === g || k.startsWith(g));
const NSLOT = 3;
const BOOT = 'karmika.boot';

function read(): Slots {
  let s: Slots | null = null; try { s = JSON.parse(localStorage.getItem('karmika.slots') || 'null'); } catch { s = null; }
  if (!s) { // primeira vez com espaços: o personagem que já existe vira o espaço 1
    s = { active: 0, meta: [null, null, null], servers: [] };
    try { const p = JSON.parse(localStorage.getItem('karmika.char.v1') || 'null'); if (p) s.meta[0] = { name: p.name, lvl: 1, cls: '', origin: p.origin, sex: p.sex ?? 'm', pic: null, server: null, t: Date.now() }; } catch { /* */ }
    write(s);
  }
  while (s.meta.length < NSLOT) s.meta.push(null); s.servers ??= [];
  if ((s as Slots & { picv?: number }).picv !== 3) { for (const m of s.meta) if (m) m.pic = null; (s as Slots & { picv?: number }).picv = 3; write(s); } // retratos tirados pela versão antiga (escuros/errados): refaz ao jogar
  if (!s.meta[s.active]) { try { const p = JSON.parse(localStorage.getItem('karmika.char.v1') || 'null'); if (p) { s.meta[s.active] = { name: p.name, lvl: 1, cls: '', origin: p.origin, sex: p.sex ?? 'm', pic: null, server: null, t: Date.now() }; write(s); } } catch { /* */ } }
  return s;
}
function write(s: Slots) { try { localStorage.setItem('karmika.slots', JSON.stringify(s)); } catch { /* */ } }
function charKeys() { const out: string[] = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; if (isChar(k)) out.push(k); } return out; }

/** guarda o personagem ativo no seu espaço e carrega o espaço i (vazio = criação). Precisa recarregar a página depois. */
function swapTo(i: number) {
  const s = read(); if (i === s.active) return;
  const blob: Record<string, string> = {}; for (const k of charKeys()) blob[k] = localStorage.getItem(k)!;
  try { localStorage.setItem(`karmika.slot.${s.active}`, JSON.stringify(blob)); } catch { alert('Sem espaço para guardar o personagem atual.'); return false; }
  for (const k of charKeys()) localStorage.removeItem(k);
  let next: Record<string, string> = {}; try { next = JSON.parse(localStorage.getItem(`karmika.slot.${i}`) || '{}'); } catch { /* */ }
  for (const [k, v] of Object.entries(next)) localStorage.setItem(k, v);
  localStorage.removeItem(`karmika.slot.${i}`);
  s.active = i; write(s); return true;
}

/** depois de apagar o personagem ativo: nada mais escreve as chaves dele nesta página (o jogo atrás da tela salva sozinho) */
const rawSetItem = Storage.prototype.setItem;
const rawSet = (k: string, v: string) => rawSetItem.call(localStorage, k, v);
function lockChar() { Storage.prototype.setItem = function (this: Storage, k: string, v: string) { if (this === localStorage && isChar(k)) return; rawSetItem.call(this, k, v); }; }
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
interface Desk { host(o?: { port?: number; password?: string }): Promise<{ port: number; code: string; publicIp: string | null; cgnat: boolean | null; upnp: { ok: boolean } }>; update?(inv: string): Promise<{ ok: boolean; same?: boolean; updated?: boolean; why?: string; files?: number; bytes?: number }>; onUpdate?(cb: (p: { got: number; total: number; file: string; n: number }) => void): () => void; servers?(): Promise<Room[]> }
/** sala anunciada (neste PC ou na rede local) */
interface Room { host: string; port: number; code: string; name: string; players: number; max: number; pass: boolean }

/** procura salas: no app, pelo anúncio na rede local; no navegador, pergunta às portas deste PC */
async function scanRooms(desk: Desk | null): Promise<Room[]> {
  if (desk?.servers) { try { return await desk.servers(); } catch { /* */ } }
  const out: Room[] = [];
  await Promise.all([7777, 7778, 7779, 7790, 7791, 7792].map(async (port) => { try { const c = new AbortController(); const t = setTimeout(() => c.abort(), 900);
    const r = await fetch(`http://127.0.0.1:${port}/karmika/info`, { signal: c.signal }); clearTimeout(t); const m = await r.json(); if (m.karmika === 1) out.push({ host: '127.0.0.1', port: m.port, code: m.code, name: m.name, players: m.players, max: m.max, pass: !!m.pass }); } catch { /* nada nessa porta */ } }));
  return out;
}
export function createInicio(o: { hasChar(): boolean; desk: Desk | null; onPlay(server: string | null, isNew: boolean): void; /** dados frescos do personagem ativo (nível, classe e retrato tirado do modelo que está carregado) */ fresh(): Promise<Partial<SlotMeta> | null>; /** o servidor escolhido (o hub de amigos liga já no menu) */ onServer?(s: string): void; /** abre amigos e conversas */ social?(): void }) {
  let boot: { server: string | null } | null = null;
  let rooms: Room[] = [], scanning = true;
  const roomInv = (r: Room) => `karmika://${r.host}:${r.port}/${r.code}`;
  function roomsHtml() { if (!rooms.length) return `<em class="in-mut">${scanning ? 'Procurando…' : 'Nenhuma sala aberta neste PC ou na sua rede. De fora, peça o convite ao anfitrião.'}</em>`;
    return rooms.map((r) => `<a class="in-room" data-room="${esc(roomInv(r))}" data-rp="${r.pass ? 1 : 0}"><b>${esc(r.name)}</b><span>${r.players}/${r.max} ${r.pass ? '🔒' : ''}</span><small>${esc(r.host === '127.0.0.1' ? 'neste PC' : r.host)} · ${esc(r.code)}</small></a>`).join(''); }
  setInterval(async () => { if (!isOpen || step !== 'find') { scanning = true; return; } rooms = await scanRooms(o.desk); scanning = false; const box = el.querySelector('[data-rooms]'); if (box) box.innerHTML = roomsHtml(); }, 2000);
  try { boot = JSON.parse(sessionStorage.getItem(BOOT) || 'null'); } catch { boot = null; }
  sessionStorage.removeItem(BOOT);
  if (!boot && /[?&]play\b/.test(location.search)) boot = { server: null }; // atalho de desenvolvimento: ?play entra direto
  const el = document.createElement('div'); el.id = 'inicio'; document.body.appendChild(el);
  /* runas de Karmika na moldura da tela: cada uma acorda (brilha e cresce) uma de cada vez, devagar */
  const runesHtml = (() => { const pts: [number, number][] = []; const H = 11, V = 5;
    for (let i = 0; i < H; i++) pts.push([4 + i * 92 / (H - 1), 4]); for (let i = 1; i <= V; i++) pts.push([96, 4 + i * 92 / (V + 1)]);
    for (let i = H - 1; i >= 0; i--) pts.push([4 + i * 92 / (H - 1), 96]); for (let i = V; i >= 1; i--) pts.push([4, 4 + i * 92 / (V + 1)]);
    const step = 1.3, cyc = pts.length * step;
    return `<div class="in-runes">${pts.map(([x, y], i) => `<i style="left:${x}%;top:${y}%;animation-duration:${cyc}s;animation-delay:${(i * step - cyc).toFixed(2)}s">${runaSvg(i * 5)}</i>`).join('')}</div>`; })();
  let hostPass = '', draftInv = '', draftPass = '';
  let step: 'home' | 'find' | 'host' | 'chars' | 'upd' = 'home', upd = { got: 0, total: 0, file: '', n: 0 }, server: string | null = null, err = '', busy = false, hostInv = '';
  let isOpen = !boot;
  let delAsk: number | null = null, delErr = ''; // confirmação de apagar DENTRO da tela (o app de desktop não tem prompt())

  function render() {
    if (!isOpen) { el.style.display = 'none'; return; }
    el.style.display = 'flex'; const s = read();
    const head = `<div class="in-logo"><h1>KARMIKA</h1><p>Toda escolha importa. Você já fez a sua.</p></div>`;
    let body = '';
    if (step === 'home') body = `<div class="in-menu">
        <button data-i="find" class="big">✧ Encontrar servidor<small>entrar no mundo de outro Caminhante com o convite</small></button>
        ${o.desk ? `<button data-i="host">⚑ Abrir meu servidor<small>esta máquina vira o mundo; mande o convite para os amigos</small></button>` : ''}
        <button data-i="solo">☾ Jogar sozinho<small>sem servidor, só você e o Olho</small></button></div>`;
    if (step === 'find') body = `<div class="in-box"><h2>Encontrar servidor</h2><p>Cole o convite que o anfitrião mandou:</p>
        <div class="in-row"><input data-v="inv" placeholder="karmika://IP:7777/CÓDIGO" value="${esc(draftInv || s.servers[0] || '')}" spellcheck="false"></div>
        <div class="in-row" style="margin-top:8px"><input data-v="pass" type="password" placeholder="Senha (só se a sala tiver)" value="${esc(draftPass || passFor(draftInv || s.servers[0] || ''))}"><button data-i="go" class="gold">Continuar</button></div>
        <div class="in-recent in-rooms"><small>Salas abertas agora (neste PC e na sua rede)</small><div data-rooms>${roomsHtml()}</div></div>
        ${s.servers.length ? `<div class="in-recent"><small>Servidores recentes</small>${s.servers.map((v) => `<a data-r="${esc(v)}">${esc(v)}</a>`).join('')}</div>` : ''}
        ${err ? `<p class="in-err">✖ ${esc(err)}</p>` : ''}<button data-i="back" class="lnk">← voltar</button></div>`;
    if (step === 'host') body = `<div class="in-box"><h2>Abrir meu servidor</h2>${!hostInv && !busy ? `<p>Esta máquina vira o mundo. Se quiser, coloque uma senha: só entra quem tiver o convite <b>e</b> a senha.</p><div class="in-row"><input data-v="hpass" type="password" placeholder="Senha da sala (opcional)"><button data-i="hostopen" class="gold">Abrir a sala</button></div>` : hostInv ? `<p class="in-ok">✔ Sala aberta. Mande este convite para quem vai jogar com você:</p><code>${esc(hostInv)}</code>
        <p class="in-mut">Detalhes (CGNAT, Tailscale, rede de casa) ficam no painel <b>Jogar junto</b> (F4) dentro do jogo.</p><button data-i="hostgo" class="gold">Escolher personagem →</button>`
        : `<p>Abrindo a sala e testando o seu roteador…</p>`}${hostPass ? '<p class="in-mut">🔒 Sala com senha: mande a senha junto com o convite.</p>' : ''}${err ? `<p class="in-err">✖ ${esc(err)}</p>` : ''}<button data-i="back" class="lnk">← voltar</button></div>`;
    if (step === 'upd') { const k = upd.total ? upd.got / upd.total : 0; body = `<div class="in-box"><h2>Atualizando Karmika</h2><p>O servidor tem uma versão mais nova do jogo. Baixando só o que mudou${upd.n ? ` (${upd.n} arquivo${upd.n > 1 ? 's' : ''})` : ''}…</p>
        <div class="in-bar"><i style="width:${(k * 100).toFixed(1)}%"></i><span>${upd.total ? `${(upd.got / 1048576).toFixed(1)} / ${(upd.total / 1048576).toFixed(1)} MB` : 'conferindo versões…'}</span></div><p class="in-mut">${esc(upd.file)}</p></div>`; }
    if (step === 'chars') refreshActive();
    if (step === 'chars' && server) o.onServer?.(server);
    if (step === 'chars') body = `<div class="in-chars"><h2>${server ? `Servidor <b>${esc(server.replace(/^karmika:\/\//, ''))}</b>` : 'Jogar sozinho'}</h2><p class="in-mut">Escolha o seu Caminhante (até ${NSLOT} por máquina).</p><div class="in-slots">${s.meta.map((m, i) => m ? `
        <div class="in-slot ${i === s.active ? 'act' : ''}" data-s="${i}"><div class="in-pic">${(m.origin ?? 'human') === 'human' ? `<img src="/img/racas/human_${m.sex === 'f' ? 'f' : 'm'}.jpg" alt="">` : m.pic ? `<img src="${m.pic}" alt="">` : `<span>${m.origin === 'dwarf' ? '⚒' : m.origin === 'elf' ? '❦' : '⚔'}</span>`}</div>
          <b>${esc(m.name)}</b><small>Nível ${m.lvl}${m.cls ? ' · ' + esc(m.cls) : ''}</small><em>${m.origin === 'dwarf' ? 'Anão' : m.origin === 'elf' ? 'Elfo' : 'Humano'} · ${m.sex === 'm' ? 'Homem' : 'Mulher'}</em>
          <button data-play="${i}" class="gold">Entrar</button><button data-del="${i}" class="in-del" title="Apagar este personagem">🗑 Apagar</button></div>`
        : `<div class="in-slot empty" data-new="${i}"><div class="in-pic"><span>+</span></div><b>Espaço livre</b><small>Criar novo personagem</small><button data-new="${i}">Criar</button></div>`).join('')}</div>
        <button data-i="back" class="lnk">← voltar</button></div>`;
    if (step === 'chars' && delAsk !== null && s.meta[delAsk]) { const m = s.meta[delAsk]!; body += `<div class="in-ask"><div class="in-box"><h2>Apagar ${esc(m.name)}?</h2>
        <p>Nível ${m.lvl}${m.cls ? ' · ' + esc(m.cls) : ''}. Isso apaga o personagem <b>para sempre</b>: itens, missões, karma e vidas passadas. Não tem volta.</p>
        <p class="in-mut">Para confirmar, digite o nome: <b>${esc(m.name)}</b></p>
        <div class="in-row"><input data-v="delname" placeholder="${esc(m.name)}" spellcheck="false" autocomplete="off"><button data-i="delok" class="in-delok">Apagar para sempre</button></div>
        ${delErr ? `<p class="in-err">✖ ${esc(delErr)}</p>` : ''}<button data-i="delno" class="lnk">← não, voltar</button></div></div>`; }
    el.innerHTML = `${runesHtml}<div class="in-wrap">${head}${body}<div class="in-ft">Karmika · versão de desenvolvimento · devs e beta testers</div></div>`;
  }
  let refreshing = false, refreshedPic = false;
  /** o card do personagem ativo ganha retrato, nível e classe de verdade (o modelo dele já está carregado atrás da tela) */
  function refreshActive() { const s = read(), m = s.meta[s.active]; if (!m || refreshing || (refreshedPic && m.pic)) return; refreshing = true;
    o.fresh().then((f) => { refreshing = false; if (!f) return; const s2 = read(), m2 = s2.meta[s2.active]; if (!m2) return; s2.meta[s2.active] = { ...m2, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v !== null && v !== undefined && v !== '')) } as SlotMeta; write(s2); if (f.pic) refreshedPic = true; if (isOpen && step === 'chars') render(); }).catch(() => { refreshing = false; }); }
  addEventListener('karmika:skinready', () => { refreshedPic = false; if (isOpen && step === 'chars') refreshActive(); });
  function remember(v: string) { const s = read(); s.servers = [v, ...s.servers.filter((x) => x !== v)].slice(0, 5); write(s); }
  function play(i: number, isNew: boolean) {
    const s = read();
    if (i !== s.active) { if (!swapTo(i)) return; lockChar(); /* cada personagem é um universo: o jogo do personagem antigo, ainda rodando atrás da tela, salvava karma, alma e o resto por cima do novo na hora de recarregar */ sessionStorage.setItem(BOOT, JSON.stringify({ server })); location.reload(); return; }
    if (isNew && o.hasChar()) { // espaço ativo, mas pediu novo? não acontece: o ativo sempre é o que tem personagem
      return; }
    isOpen = false; render(); o.onPlay(server, !o.hasChar());
  }
  el.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    const rm = t.closest('[data-room]') as HTMLElement | null; if (rm) { const v = rm.dataset.room!, pw = passFor(v); (el.querySelector('[data-v="inv"]') as HTMLInputElement).value = v; const pin = el.querySelector('[data-v="pass"]') as HTMLInputElement; pin.value = pw;
      if (rm.dataset.rp === '1' && !pw) { err = ''; pin.focus(); pin.placeholder = 'Esta sala tem senha: digite e clique em Continuar'; return; } (el.querySelector('[data-i="go"]') as HTMLElement).click(); return; } // clicou numa sala da lista: entra direto (ou pede a senha)
    const r = (t.closest('[data-r]') as HTMLElement | null)?.dataset.r; if (r) { (el.querySelector('[data-v="inv"]') as HTMLInputElement).value = r; (el.querySelector('[data-v="pass"]') as HTMLInputElement).value = passFor(r); return; }
    const pl = (t.closest('[data-play]') as HTMLElement | null)?.dataset.play; if (pl !== undefined) { play(+pl, false); return; }
    const nw = (t.closest('[data-new]') as HTMLElement | null)?.dataset.new; if (nw !== undefined) { play(+nw, true); return; }
    const del = (t.closest('[data-del]') as HTMLElement | null)?.dataset.del;
    if (del !== undefined) { if (!read().meta[+del]) return; delAsk = +del; delErr = ''; render(); (el.querySelector('[data-v="delname"]') as HTMLInputElement)?.focus(); return; }
    const a = (t.closest('[data-i]') as HTMLElement | null)?.dataset.i; if (!a || busy) return;
    err = '';
    if (a === 'delno') { delAsk = null; render(); return; }
    if (a === 'delok') { const s = read(), i = delAsk, m = i === null ? null : s.meta[i]; if (i === null || !m) { delAsk = null; render(); return; }
      const typed = (el.querySelector('[data-v="delname"]') as HTMLInputElement).value.trim();
      if (typed.toLowerCase() !== m.name.trim().toLowerCase()) { delErr = 'O nome não confere.'; render(); (el.querySelector('[data-v="delname"]') as HTMLInputElement)?.focus(); return; }
      delAsk = null; s.meta[i] = null;
      if (i === s.active) { // o personagem ativo está carregado atrás desta tela e salva sozinho (a cada poucos segundos e ao recarregar): tranca as chaves dele antes de apagar
        lockChar(); for (const k of charKeys()) localStorage.removeItem(k);
        const free = s.meta.findIndex((x, j) => x && j !== i); if (free >= 0) { // ativa outro que exista, para não deixar o jogo sem personagem
          let next: Record<string, string> = {}; try { next = JSON.parse(localStorage.getItem(`karmika.slot.${free}`) || '{}'); } catch { /* */ }
          for (const [k, v] of Object.entries(next)) rawSet(k, v); localStorage.removeItem(`karmika.slot.${free}`); s.active = free; }
        write(s); sessionStorage.setItem(BOOT, JSON.stringify({ server, pick: true })); location.reload(); return; }
      localStorage.removeItem(`karmika.slot.${i}`); write(s); render(); return; }
    if (a === 'back') { step = step === 'chars' && server && hostInv ? 'host' : 'home'; render(); return; }
    if (a === 'find') { step = 'find'; render(); (el.querySelector('[data-v="inv"]') as HTMLInputElement)?.focus(); return; }
    if (a === 'social') { o.social?.(); return; }
    if (a === 'solo') { server = null; step = 'chars'; render(); return; }
    if (a === 'go') { const v = (el.querySelector('[data-v="inv"]') as HTMLInputElement).value.trim(); const pv = parseInvite(v); if (!pv) { err = 'Convite inválido. O formato é karmika://IP:7777/CÓDIGO'; render(); return; }
      if (!/[.:]/.test(pv.host) && pv.host.toLowerCase() !== 'localhost') { err = `"${pv.host}" não é um endereço. Troque pelo número do computador da sala: no mesmo PC use 127.0.0.1 (karmika://127.0.0.1:${pv.port}/${pv.code}). Ou clique numa sala da lista acima.`; render(); return; }
      const pw = (el.querySelector('[data-v="pass"]') as HTMLInputElement).value; draftInv = v; draftPass = pw;
      busy = true; const pr = await probeRoom(v, pw); busy = false; if (!pr.ok) { err = pr.why || 'Não deu para entrar.'; render(); if (pr.pass) (el.querySelector('[data-v="pass"]') as HTMLInputElement)?.focus(); return; }
      savePass(v, pw); server = v; remember(v);
      if (o.desk?.update) { // o servidor entrega o jogo: se a minha versão for velha, baixa o que mudou e recarrega
        step = 'upd'; upd = { got: 0, total: 0, file: '', n: 0 }; render(); busy = true;
        const off = o.desk.onUpdate?.((p) => { upd = p; if (step === 'upd') render(); });
        const r: { ok: boolean; updated?: boolean; why?: string } = await o.desk.update(v).catch((x) => ({ ok: false, why: String(x) })); off?.(); busy = false;
        if (r.ok && r.updated) { sessionStorage.setItem(BOOT, JSON.stringify({ server, pick: true })); location.reload(); return; }
        if (!r.ok) { err = `Não deu para atualizar o jogo: ${r.why}`; step = 'find'; render(); return; } }
      step = 'chars'; render(); return; }
    if (a === 'host' && o.desk) { step = 'host'; hostInv = ''; render(); return; }
    if (a === 'hostopen' && o.desk) { hostPass = (el.querySelector('[data-v="hpass"]') as HTMLInputElement).value; busy = true; render();
      try { const h = await o.desk.host({ port: 7777, password: hostPass }); hostInv = `karmika://${h.publicIp && !h.cgnat ? h.publicIp : '127.0.0.1'}:${h.port}/${h.code}`; server = `karmika://127.0.0.1:${h.port}/${h.code}`; savePass(server, hostPass); }
      catch (x) { err = /EADDRINUSE/.test(String(x)) ? 'A porta 7777 já está em uso (outra sala aberta?).' : 'Não deu para abrir: ' + String((x as Error)?.message || x); }
      busy = false; render(); return; }
    if (a === 'hostgo') { step = 'chars'; render(); return; }
  });
  el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && (e.target as HTMLElement).matches('[data-v="inv"], [data-v="pass"]')) (el.querySelector('[data-i="go"]') as HTMLElement)?.click();
    if (e.key === 'Enter' && (e.target as HTMLElement).matches('[data-v="delname"]')) (el.querySelector('[data-i="delok"]') as HTMLElement)?.click(); if (e.key === 'Escape' && delAsk !== null) { delAsk = null; render(); } });

  // voltou de uma troca de personagem: entra direto (ou cria), já com o servidor escolhido
  if (boot) { server = boot.server; const pick = (boot as { pick?: boolean }).pick; if (pick) { isOpen = true; step = 'chars'; render(); } else setTimeout(() => o.onPlay(server, !o.hasChar()), 0); }
  else render();

  return {
    get isOpen() { return isOpen; },
    /** atualiza o card do personagem ativo (nome, nível, classe, retrato) */
    saveMeta(m: Omit<SlotMeta, 't'>) { const s = read(), old = s.meta[s.active]; s.meta[s.active] = { ...m, pic: m.pic ?? old?.pic ?? null, server: m.server ?? old?.server ?? null, t: Date.now() }; write(s); },
    open() { isOpen = true; step = 'home'; render(); },
    /** volta da criação de personagem para a escolha dos 3 espaços */
    openChars(sv: string | null) { server = sv; isOpen = true; step = 'chars'; render(); },
  };
}

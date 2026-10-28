/** Chat do jogo: canais Local / Global / Sistema, histórico, balão de fala sobre o herói. Pronto para receber o servidor (send/recv). */
export type Channel = 'local' | 'global' | 'sys' | 'whisper';
export interface ChatMsg { ch: Channel; from: string; text: string; t: number; to?: string }

export function createChat(ctx: { me(): string; onSay?(text: string, ch: Channel, to?: string): void; command?(cmd: string, args: string[]): string | null }) {
  const el = document.createElement('div'); el.id = 'chat';
  el.innerHTML = `<div class="tabs"><button data-t="all" class="on">Tudo</button><button data-t="local">Local</button><button data-t="global">Global</button><button data-t="sys">Sistema</button><button data-t="whisper">Sussurros</button><span class="hint">⠿ arraste · Enter: falar</span></div><div class="msgs"></div><div class="in"><span class="ch">Local</span><input maxlength="160" placeholder="Enter fala · /g global · /l local · /w nome msg"></div><div class="rz" title="Arraste para redimensionar">⤡</div>`;
  document.body.appendChild(el);
  // posição e tamanho ajustáveis (arraste pela barra de abas; canto inferior direito redimensiona); salvos
  /* o chat é escalado pelo "Tamanho da interface" (transform: scale). Tudo o que se salva é em pixels SEM escala (offsetWidth/Height):
     antes se salvava o tamanho já escalado, e a cada arrasto o chat crescia 33% no Quad HD até tomar a tela. */
  const msgsEl = el.querySelector('.msgs') as HTMLElement;
  const uiK = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui')) || 1;
  const W0 = 320, H0 = 120, clampW = (w: number) => Math.max(240, Math.min(560, w)), clampH = (h: number) => Math.max(60, Math.min(320, h));
  let pos: { x: number; y: number } | null = null; // canto de cima-esquerda na tela (null = preso embaixo, à esquerda)
  function place() {
    const k = uiK(), w = el.offsetWidth * k, h = el.offsetHeight * k;
    if (!pos) { el.style.left = ''; el.style.top = ''; el.style.bottom = ''; el.style.transformOrigin = '0 100%'; return; }
    pos.x = Math.max(0, Math.min(innerWidth - Math.min(w, innerWidth), pos.x)); pos.y = Math.max(0, Math.min(innerHeight - Math.min(h, innerHeight), pos.y));
    el.style.transformOrigin = '0 0'; el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px'; el.style.bottom = 'auto';
  }
  try { const p = JSON.parse(localStorage.getItem('karmika.ui.chat2') || 'null'); if (p) { el.style.width = clampW(p.w) + 'px'; msgsEl.style.height = clampH(p.h) + 'px'; pos = p.x == null ? null : { x: p.x, y: p.y }; } } catch { /* */ }
  localStorage.removeItem('karmika.ui.chat'); // o formato antigo guardava medidas escaladas: descartado
  requestAnimationFrame(place); addEventListener('resize', () => requestAnimationFrame(place));
  let drag: { dx: number; dy: number } | null = null, rz: { x: number; y: number; w: number; h: number } | null = null;
  const saveUI = () => { try { localStorage.setItem('karmika.ui.chat2', JSON.stringify({ x: pos?.x ?? null, y: pos?.y ?? null, w: el.offsetWidth, h: msgsEl.offsetHeight })); } catch { /* */ } };
  el.addEventListener('dblclick', (e) => { const t = e.target as HTMLElement; if (!t.closest('.tabs') || t.closest('button')) return; pos = null; el.style.width = W0 + 'px'; msgsEl.style.height = H0 + 'px'; place(); saveUI(); }); // duplo clique na barra: volta ao lugar
  el.addEventListener('pointerdown', (e) => { const t = e.target as HTMLElement; if (t.closest('.rz')) { rz = { x: e.clientX, y: e.clientY, w: el.offsetWidth, h: msgsEl.offsetHeight }; el.setPointerCapture(e.pointerId); e.preventDefault(); return; } if (t.closest('.tabs') && !t.closest('button')) { const r = el.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }; if (!pos) { pos = { x: r.left, y: r.top }; place(); } el.setPointerCapture(e.pointerId); e.preventDefault(); } });
  el.addEventListener('pointermove', (e) => { if (drag) { pos = { x: e.clientX - drag.dx, y: e.clientY - drag.dy }; place(); } else if (rz) { const k = uiK(); el.style.width = clampW(rz.w + (e.clientX - rz.x) / k) + 'px'; msgsEl.style.height = clampH(rz.h + (e.clientY - rz.y) / k) + 'px'; place(); el.classList.add('open'); } });
  el.addEventListener('pointerup', () => { if (drag || rz) { drag = null; rz = null; saveUI(); if (!el.contains(document.activeElement)) el.classList.remove('open'); } });
  el.addEventListener('mouseenter', () => el.classList.remove('dim')); el.addEventListener('mouseleave', () => { if (!el.classList.contains('open')) el.classList.add('dim'); });
  const msgs = el.querySelector('.msgs') as HTMLElement, input = el.querySelector('input') as HTMLInputElement, chLab = el.querySelector('.in .ch') as HTMLElement;
  let tab: 'all' | Channel = 'all', ch: Channel = 'local', hist: ChatMsg[] = [];
  try { hist = JSON.parse(localStorage.getItem('karmika.chat.v1') || '[]'); } catch { hist = []; }
  const COL: Record<Channel, string> = { local: '#e8dcc0', global: '#9ad7ff', sys: '#ffe08a', whisper: '#e0a0ff' };
  const PRE: Record<Channel, string> = { local: '', global: '[G] ', sys: '✦ ', whisper: '[Sussurro] ' };
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
  function render() {
    const list = hist.filter((m) => tab === 'all' || m.ch === tab).slice(-60);
    msgs.innerHTML = list.map((m) => `<div style="color:${COL[m.ch]}"><small>${new Date(m.t).toTimeString().slice(0, 5)}</small> ${PRE[m.ch]}${m.ch === 'sys' ? '' : m.ch === 'whisper' && m.to ? `<b>${esc(m.from)} → ${esc(m.to)}:</b> ` : `<b>${esc(m.from)}:</b> `}${esc(m.text)}</div>`).join('');
    msgs.scrollTop = msgs.scrollHeight;
  }
  function push(m: ChatMsg, quiet = false) { hist.push(m); if (hist.length > 200) hist.shift(); try { localStorage.setItem('karmika.chat.v1', JSON.stringify(hist.slice(-120))); } catch { /* */ } render(); if (quiet) return; el.classList.add('new'); el.classList.remove('dim'); setTimeout(() => { el.classList.remove('new'); if (!el.classList.contains('open') && !el.matches(':hover')) el.classList.add('dim'); }, 6000); }
  /** mensagem de sistema (missões, eventos) */
  const sys = (text: string) => push({ ch: 'sys', from: '', text, t: Date.now() });
  /** mensagem recebida de outro jogador (servidor) */
  const recv = (from: string, text: string, c: Channel, to?: string) => push({ ch: c, from, text, t: Date.now(), to });
  let lastWhisper: string | null = null;
  function say(text: string) {
    let c = ch; let t = text.trim(); if (!t) return;
    if (t.startsWith('/w ') || t.startsWith('/s ')) { const m = t.slice(3).match(/^(\S+)\s+([\s\S]+)$/); if (!m) { sys('Uso: /w nome mensagem'); return; } lastWhisper = m[1]; push({ ch: 'whisper', from: ctx.me(), to: m[1], text: m[2], t: Date.now() }); ctx.onSay?.(m[2], 'whisper', m[1]); return; }
    if (t.startsWith('/') && ctx.command) { const [cmd, ...args] = t.slice(1).split(/\s+/); const out = ctx.command(cmd.toLowerCase(), args); if (out !== null) { sys(out); return; } }
    if (t.startsWith('/r ')) { if (!lastWhisper) { sys('Ninguém para responder ainda.'); return; } t = `/w ${lastWhisper} ${t.slice(3)}`; say(t); return; }
    if (t.startsWith('/g ')) { c = 'global'; t = t.slice(3); } else if (t.startsWith('/l ')) { c = 'local'; t = t.slice(3); } else if (t === '/g') { ch = 'global'; chLab.textContent = 'Global'; return; } else if (t === '/l') { ch = 'local'; chLab.textContent = 'Local'; return; }
    push({ ch: c, from: ctx.me(), text: t, t: Date.now() }); ctx.onSay?.(t, c);
  }
  el.querySelector('.tabs')!.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (!b) return; tab = b.dataset.t as typeof tab; el.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b)); render(); });
  input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { say(input.value); input.value = ''; close(); } else if (e.key === 'Escape') { input.value = ''; close(); } });
  input.addEventListener('keyup', (e) => e.stopPropagation());
  function open() { el.classList.add('open'); el.classList.remove('dim'); input.focus(); }
  function close() { el.classList.remove('open'); input.blur(); setTimeout(() => { if (!el.classList.contains('open') && !el.matches(':hover')) el.classList.add('dim'); }, 2500); }
  render(); el.classList.add('dim');
  /** abre o chat já com "/w nome " (menu do jogador → mensagem privada) */
  function whisperTo(name: string) { open(); input.value = `/w ${name.includes(' ') ? name.replace(/\s+/g, '_') : name} `; input.setSelectionRange(input.value.length, input.value.length); }
  /** 28/10: os acontecimentos do jogo (o registro ao lado) também ficam guardados na aba Sistema, sem acender o chat */
  const sysLog = (text: string) => push({ ch: 'sys', from: '', text, t: Date.now() }, true);
  return { open, close, say, sys, sysLog, recv, whisperTo, get isOpen() { return el.classList.contains('open'); } };
}

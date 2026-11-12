/* O OLHO DO CLAUDE (12/11, Erling: "não dá para criar um código onde eu posso ligar você dentro do jogo e você me ver jogando? um símbolo que eu ligo e
   você vai avaliando o jogo em tempo real: IA, gráficos, comportamento de batalha").
   Ver ao vivo não dá; o que dá é uma CAIXA-PRETA. O botão ✳ (canto de baixo, à direita) liga a gravação. Enquanto ligada, o jogo anota sozinho:
   - a cada 4 s: onde o herói está, vida, nível, quadros por segundo, se está em luta, e o que cada bicho e cada soldado por perto está FAZENDO
     (tipo, estado, vida, distância), para avaliar a IA e a batalha;
   - a cada 20 s: uma foto pequena da tela (640 px), para avaliar os gráficos;
   - tudo o que o jogo escreveu no registro (golpes, falas, avisos);
   - o relatório de desempenho inteiro (/travadas) a cada minuto e no fim;
   - as FRASES que o jogador escreve no chat (o que ele está vendo), com lugar e foto;
   - os BLOQUEIOS: o herói tentando andar sem sair do lugar por 2 s ou mais, com lugar e foto.
   Desligar baixa um arquivo só (karmika-olho-AAAA-MM-DD-HHMM.json). Fechar o jogo sem desligar guarda a gravação: ela é baixada no primeiro clique da próxima sessão. Mandando esse arquivo na conversa, o Claude lê a sessão inteira.
   Custo: uma amostra leve a cada 4 s e uma foto a cada 20 s; nada roda com o botão desligado. */
export interface OlhoCtx {
  /** foto da tela (JPEG em data URL), tirada logo depois do desenho */ shot(): Promise<string | null>; perf(): string; build: string;
  info(): { x: number; y: number; reg: string; lvl: number; hp: number; hpMax: number; fps: number; rend: string; combate: boolean; dentro: string; classe: string };
  /** os bichos acordados a até 40 m */ bichos(): { tipo: string; nome: string; nivel: number; estado: string; vida: number; d: number }[];
  /** gente por perto (até 30 m): quem é e se está lutando */ gente(): { nome: string; papel: string; d: number; lutando: boolean }[];
  log(t: string, c?: string): void;
  /** o jogador está tentando andar agora (tecla apertada ou caminho de clique em andamento) */ querendoAndar?(): boolean;
}
export function createOlhoClaude(K: OlhoCtx) {
  let on = false, t0 = 0, tA: ReturnType<typeof setInterval> | null = null, tF: ReturnType<typeof setInterval> | null = null, tP: ReturnType<typeof setInterval> | null = null, obs: MutationObserver | null = null;
  let D: { build: string; inicio: string; tela: string; amostras: unknown[]; fotos: { t: number; jpg: string; por?: string }[]; registro: { t: number; txt: string }[]; desempenho: { t: number; txt: string }[];
    /** 12/11 (Erling: "pegue minhas frases ditas no jogo: eu falo no chat o que estou vendo e você capta") o que o jogador escreveu no chat, com hora, lugar e foto */ falas: { t: number; txt: string; canal: string; x: number; y: number; reg: string }[];
    /** 12/11 (Erling: "pegue bloqueio de personagem, coisa que ele não consegue subir, de onde não consegue sair") o herói tentando andar sem sair do lugar */ presos: { t: number; x: number; y: number; reg: string; dentro: string; segundos: number }[] } | null = null;
  /* PRESO: a cada meio segundo, se o jogador está tentando andar (tecla ou clique) e o herói andou menos de 0,3 casa (60 cm) em 2 s, é um bloqueio.
     Anota o lugar e tira uma foto; enquanto continuar preso no mesmo ponto, só aumenta os segundos (não repete a anotação). */
  let pAnt: { x: number; y: number; t: number } | null = null, presoAgora: { x: number; y: number; reg: string; dentro: string; segundos: number; t: number } | null = null, tPreso: ReturnType<typeof setInterval> | null = null;
  function vigiaPreso() { if (!D || !K.querendoAndar) return; let i; try { i = K.info(); } catch { return; } const agora = performance.now();
    if (!K.querendoAndar()) { pAnt = null; presoAgora = null; return; } if (!pAnt) { pAnt = { x: i.x, y: i.y, t: agora }; return; }
    const andou = Math.hypot(i.x - pAnt.x, i.y - pAnt.y); if (andou > 0.3) { pAnt = { x: i.x, y: i.y, t: agora }; presoAgora = null; return; }
    const seg = (agora - pAnt.t) / 1000; if (seg < 2) return;
    if (!presoAgora) { presoAgora = { t: sec(), x: Math.round(i.x * 10) / 10, y: Math.round(i.y * 10) / 10, reg: i.reg, dentro: i.dentro, segundos: Math.round(seg) }; D.presos.push(presoAgora); void foto('preso'); K.log('✳ Olho do Claude anotou: o herói está tentando andar e não sai do lugar.', '#ff9a6a'); } else presoAgora.segundos = Math.round(seg); }
  /** o que o jogador escreveu no chat entra na gravação, com lugar e uma foto do momento */
  function fala(txt: string, canal = '') { if (!on || !D || !txt.trim()) return; let i = { x: 0, y: 0, reg: '?' }; try { i = K.info(); } catch { /* */ } D.falas.push({ t: sec(), txt: txt.slice(0, 500), canal, x: Math.round(i.x * 10) / 10, y: Math.round(i.y * 10) / 10, reg: i.reg }); void foto('fala'); }
  const sec = () => Math.round((performance.now() - t0) / 100) / 10;
  const btn = document.createElement('button'); btn.id = 'olhoclaude'; btn.title = 'Olho do Claude: grava a sessão (IA, batalha, gráficos, desempenho) num arquivo para o Claude ler. Clique para ligar.';
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><g stroke="currentColor" stroke-width="2.4" stroke-linecap="round">' + Array.from({ length: 6 }, (_, i) => { const a = (i * Math.PI) / 6, x = Math.cos(a) * 9, y = Math.sin(a) * 9; return `<line x1="${(12 - x).toFixed(1)}" y1="${(12 - y).toFixed(1)}" x2="${(12 + x).toFixed(1)}" y2="${(12 + y).toFixed(1)}"/>`; }).join('') + '</g></svg><i></i>';
  const css = document.createElement('style'); css.textContent = '#olhoclaude{position:fixed;right:14px;bottom:200px;width:38px;height:38px;border-radius:50%;border:1px solid #b8924a;background:radial-gradient(circle at 40% 35%,#3a2a14,#140e08);color:#d9895a;display:grid;place-items:center;cursor:pointer;z-index:7;opacity:.55}#olhoclaude:hover{opacity:1}#olhoclaude.on{opacity:1;color:#ff9a6a;border-color:#ff9a6a;box-shadow:0 0 12px rgba(255,140,90,.7)}#olhoclaude.on svg{animation:olhogira 6s linear infinite}#olhoclaude i{position:absolute;right:-3px;top:-3px;width:10px;height:10px;border-radius:50%;background:#ff4a3a;display:none}#olhoclaude.on i{display:block;animation:olhopisca 1s ease-in-out infinite}@keyframes olhogira{to{transform:rotate(360deg)}}@keyframes olhopisca{50%{opacity:.25}}body:not(.ready) #olhoclaude,body:not(.kadm) #olhoclaude{display:none}';
  document.head.appendChild(css); document.body.appendChild(btn);
  /** a foto encolhe para 640 px de largura: 30 fotos cabem em menos de 2 MB */
  const small = (u: string) => new Promise<string>((res) => { const im = new Image(); im.onload = () => { const w = 640, h = Math.round((im.height / im.width) * w), c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d')!.drawImage(im, 0, 0, w, h); res(c.toDataURL('image/jpeg', 0.6)); }; im.onerror = () => res(''); im.src = u; });
  function amostra() { if (!D) return; try { const i = K.info(); D.amostras.push({ t: sec(), ...i, x: Math.round(i.x * 10) / 10, y: Math.round(i.y * 10) / 10, bichos: K.bichos().slice(0, 14), gente: K.gente().slice(0, 12) }); } catch (e) { D.registro.push({ t: sec(), txt: 'erro na amostra: ' + String(e).slice(0, 120) }); } }
  async function foto(por = '') { if (!D || D.fotos.length >= 90) return; const tt = sec(), u = await K.shot(); if (!u || !D) return; const s = await small(u); if (s && D) D.fotos.push(por ? { t: tt, jpg: s, por } : { t: tt, jpg: s }); }
  function start() { on = true; t0 = performance.now(); D = { build: K.build, inicio: new Date().toISOString(), tela: `${innerWidth}x${innerHeight}`, amostras: [], fotos: [], registro: [], desempenho: [], falas: [], presos: [] }; pAnt = null; presoAgora = null; tPreso = setInterval(vigiaPreso, 500);
    btn.classList.add('on'); btn.title = 'Olho do Claude LIGADO: gravando. Clique para desligar e baixar o arquivo.';
    const lg = document.getElementById('log'); if (lg) { obs = new MutationObserver((ms) => { for (const m of ms) m.addedNodes.forEach((n) => { const tx = (n as HTMLElement).textContent?.trim(); if (tx && D && D.registro.length < 4000) D.registro.push({ t: sec(), txt: tx.slice(0, 240) }); }); }); obs.observe(lg, { childList: true }); }
    amostra(); void foto(); tA = setInterval(amostra, 4000); tF = setInterval(() => void foto(), 20000); tP = setInterval(() => { if (D) D.desempenho.push({ t: sec(), txt: K.perf() }); }, 60000);
    K.log('✳ Olho do Claude ligado. Tudo o que você ESCREVER NO CHAT entra na gravação com o lugar e uma foto: diga o que está vendo. Bloqueios do herói também são anotados. Clique de novo no ✳ para parar e baixar o arquivo.', '#ff9a6a'); }
  function stop() { on = false; btn.classList.remove('on'); btn.title = 'Olho do Claude: grava a sessão num arquivo para o Claude ler. Clique para ligar.'; for (const t of [tA, tF, tP, tPreso]) if (t) clearInterval(t); tA = tF = tP = tPreso = null; obs?.disconnect(); obs = null; if (!D) return;
    D.desempenho.push({ t: sec(), txt: K.perf() }); const d = new Date(), p2 = (n: number) => String(n).padStart(2, '0'), nome = `karmika-olho-${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}.json`;
    baixa(JSON.stringify({ ...D, duracao_s: sec() }), nome); try { localStorage.removeItem(PEND); } catch { /* */ }
    K.log(`✳ Olho do Claude desligado. Arquivo baixado: ${nome} (${D.amostras.length} amostras, ${D.fotos.length} fotos, ${D.falas.length} falas suas, ${D.presos.length} bloqueios). Mande esse arquivo na conversa com o Claude.`, '#ff9a6a'); D = null; }
  /* 12/11 (Erling: "deixei gravando, joguei, saí do jogo e nenhum arquivo foi gerado"): quem fecha o jogo sem desligar não perde a gravação. Ela é
     guardada no navegador a cada 15 s e na hora de sair (as fotos mais novas, até 12, para caber). Na próxima vez que o jogo abrir, o ✳ aparece aceso
     com um ponto e o primeiro clique BAIXA a gravação guardada. */
  const PEND = 'karmika.olho.pendente';
  const guarda = () => { if (!on || !D) return; const c = { ...D, duracao_s: sec(), fotos: D.fotos.slice(-12), desempenho: [...D.desempenho.slice(-2), { t: sec(), txt: (() => { try { return K.perf(); } catch { return ''; } })() }], incompleta: 'o jogo foi fechado com a gravação ligada' };
    for (const n of [12, 6, 2, 0]) { try { localStorage.setItem(PEND, JSON.stringify({ ...c, fotos: c.fotos.slice(-n || c.fotos.length).slice(0, n) })); return; } catch { /* não coube: tenta com menos fotos */ } } };
  setInterval(guarda, 15000); addEventListener('beforeunload', guarda); addEventListener('pagehide', guarda);
  const baixa = (txt: string, nome: string) => { const blob = new Blob([txt], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); };
  let pend: string | null = null; try { pend = localStorage.getItem(PEND); } catch { /* */ }
  if (pend) { btn.classList.add('on'); btn.title = 'Há uma gravação da sessão anterior guardada. Clique para BAIXAR o arquivo.'; setTimeout(() => K.log('✳ Olho do Claude: a gravação da sessão anterior ficou guardada. Clique no ✳ (à direita, embaixo) para baixar o arquivo.', '#ff9a6a'), 6000); }
  btn.addEventListener('click', (e) => { e.stopPropagation();
    if (pend) { const d = new Date(), p2 = (n: number) => String(n).padStart(2, '0'), nome = `karmika-olho-anterior-${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}.json`; baixa(pend, nome); pend = null; try { localStorage.removeItem(PEND); } catch { /* */ } btn.classList.remove('on'); btn.title = 'Olho do Claude: grava a sessão num arquivo para o Claude ler. Clique para ligar.'; K.log(`✳ Gravação anterior baixada: ${nome}. Mande esse arquivo na conversa com o Claude. Clique de novo no ✳ para começar outra.`, '#ff9a6a'); return; }
    if (on) stop(); else start(); });
  return { get on() { return on; }, start, stop, fala, dados: () => D };
}

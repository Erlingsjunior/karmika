/* PÁGINA DE OPÇÕES (gráficos, som e jogo, ao vivo) e ACESSIBILIDADE (escala do texto). Saiu do main.ts (02/11). */
import { LANG, LANGS, setLang, type Lang } from '../i18n';
import { uiFitMax, uiBase } from '../main';
import * as THREE from 'three';
import { charShadow } from '../characters';
import { installTitleTips } from '../dicas';
import type { OpcoesCtx, Opts } from '../main';
import { gpuState } from '../gpu/tags';
import { ACOES, teclaDe, nomeTecla, ouvirTecla, trocarTecla, teclasPadrao, teclasMudadas } from './teclas';
import { CONTROLE_AJUDA, controleNome } from './controle';
import { relabelBar } from '../kits';

export function createOpcoes(K: OpcoesCtx) {
/* ---------- página de opções: gráficos, som e jogo, tudo ao vivo ---------- */
function applyOpts(k?: keyof Opts) {
  K.saveOpts();
  if (!k || k === 'pix' || k === 'wratio' || k === 'ui' || k === 'uis' || k === 'res' || k === 'gfx') K.applyGfx(); /* 03/11: o estilo do gráfico decide o pixel e o detalhe (Moderno = resolução cheia) */
  if (!k || k === 'shadows') { K.renderer.shadowMap.enabled = K.opts.shadows; K.scene.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined; if (!m) return; for (const mm of Array.isArray(m) ? m : [m]) mm.needsUpdate = true; }); }
  if (!k || k === 'charShadows') { charShadow.on = K.opts.charShadows; const setCast = (root: THREE.Object3D) => root.traverse((o) => { const m = o as THREE.Mesh; if (m.userData.blob) { m.visible = !K.opts.charShadows; return; } if (m.isMesh && !(m as unknown as { isSprite?: boolean }).isSprite && (m.material as THREE.Material)?.type !== 'MeshBasicMaterial') m.castShadow = K.opts.charShadows; }); setCast(K.hero.root); for (const n of K.npcSys.npcs) setCast(n.hero.root); }
  if (!k || k === 'shadowRes') { K.sun.shadow.mapSize.set(K.opts.shadowRes, K.opts.shadowRes); if (K.sun.shadow.map && !gpuState.on) { K.sun.shadow.map.dispose(); (K.sun.shadow as unknown as { map: null }).map = null; } }
  if (!k || k === 'particles') K.particles.density = K.opts.particles;
  if (!k || k === 'master' || k === 'music' || k === 'sfx' || k === 'amb') K.audio.setVolumes(K.opts.master, K.opts.music, K.opts.sfx, K.opts.amb);
  if (!k || k === 'sndq' || k === 'mono' || k === 'night' || k === 'bgmute') K.audio.setSound({ q: K.opts.sndq, mono: K.opts.mono, night: K.opts.night, bgMute: K.opts.bgmute });
  if (!k || k === 'dmgText') document.body.classList.toggle('nodmg', !K.opts.dmgText);
  if (!k || k === 'txt' || k === 'chat' || k === 'uis' || k === 'ui') applyTextScale();
  if (!k || k === 'fps') { const v = document.getElementById('ver'); if (v) v.style.display = K.opts.fps ? '' : 'none'; }
}
/* ---------- Acessibilidade (Erling, 23/10: "os textos estão extremamente pequenos; muita gente tem problema de visão").
   O tamanho do texto multiplica TODAS as fontes em px das folhas de estilo do jogo (sem esticar janelas e ícones);
   o chat tem o seu próprio multiplicador por cima. A dica dos itens também acompanha o tamanho da interface. ---------- */
const FS0 = new WeakMap<CSSStyleRule, number>();
installTitleTips();
function applyTextScale() {
  const walk = (rules: CSSRuleList) => { for (const r of Array.from(rules)) {
    if ((r as CSSGroupingRule).cssRules && !(r as CSSStyleRule).style) { walk((r as CSSGroupingRule).cssRules); continue; }
    const sr = r as CSSStyleRule; if (!sr.style) continue; let px = FS0.get(sr);
    if (px === undefined) { const f = sr.style.fontSize; if (!f || !f.endsWith('px')) continue; px = parseFloat(f); if (!(px > 0)) continue; FS0.set(sr, px); }
    const sel = sr.selectorText || '', tipK = /#tip\b|#tip2\b|#tt\b/.test(sel) ? K.uiScale() : 1;
    sr.style.fontSize = (px * K.opts.txt * tipK * (/#chat\b/.test(sel) ? K.opts.chat : 1)).toFixed(2) + 'px'; } };
  for (const sh of Array.from(document.styleSheets)) { try { walk(sh.cssRules); } catch { /* folha de fora (fontes): não dá para ler, e não precisa */ } }
  for (const id of ['tip', 'tip2', 'tt']) { const t = document.getElementById(id); if (t) t.style.maxWidth = `${Math.round(270 * K.opts.txt * K.uiScale())}px`; }
}
setTimeout(applyTextScale, 0); setTimeout(applyTextScale, 2500); // depois dos estilos que os módulos criam
/* 12/11 (Erling: "faça o item um e turbine o game"): TRADUTOR DE VÍDEO, só no aplicativo. O Chromium traduz o desenho do jogo para o DirectX 11 no Windows;
   aqui dá para trocar por OpenGL, Vulkan ou DirectX 12 e comparar as travadas. Vale ao reabrir o aplicativo; se a escolha não abrir, ele volta sozinho. */
type DeskVideo = { video?(): Promise<{ angle: string; voltou: string }>; setVideo?(v: string): Promise<boolean>; videoOk?(): Promise<boolean>; relaunch?(): Promise<boolean> };
const deskV = (window as unknown as { karmikaDesktop?: DeskVideo }).karmikaDesktop ?? null;
let video: { angle: string; voltou: string } | null = null, videoNovo: string | null = null;
if (deskV?.video) { void deskV.video().then((v) => { video = v; }).catch(() => { /* aplicativo antigo */ });
  const t = setInterval(() => { if (document.body.classList.contains('ready')) { clearInterval(t); setTimeout(() => void deskV.videoOk?.(), 4000); } }, 1000); /* o jogo abriu e desenhou: a escolha deixa de estar "em teste" */ }
/** o nome que a placa de vídeo dá a si mesma (mostra qual tradutor está valendo de verdade) */
const placaNome = () => { try { const g = (K.renderer as unknown as { getContext?(): WebGLRenderingContext }).getContext?.(); const e = g?.getExtension('WEBGL_debug_renderer_info'); return g && e ? String(g.getParameter(e.UNMASKED_RENDERER_WEBGL)) : ''; } catch { return ''; } };
/* 12/11 (Erling: "combinações que possam melhorar o desempenho"): perfis prontos de resolução + pixel + cenário, com a conta de pixels à mostra */
const PERFIS: Record<string, { n: string; res: number; pix: number; wratio: number; d: string }> = {
  leve: { n: 'Leve', res: 900, pix: 2, wratio: 2, d: 'notebook sem placa de vídeo' },
  padrao: { n: 'Padrão', res: 1080, pix: 2, wratio: 2, d: 'o visual de sempre' },
  nitido: { n: 'Nítido', res: 900, pix: 1, wratio: 2, d: 'personagens em 1600×900, cenário na metade' },
  maximo: { n: 'Máximo', res: 1080, pix: 1, wratio: 1, d: 'tudo no pixel mais fino (pesado)' } };
const tamAgora = () => { try { const c = K.renderer.domElement, r = K.dual.ratio || 1; return `personagens ${c.width}×${c.height} · cenário ${Math.floor(c.width / r)}×${Math.floor(c.height / r)}`; } catch { return ''; } };
function renderOptions() {
  const el = document.getElementById('p-opt'); if (!el) return;
  const seg = (k: keyof Opts, vals: [string | number | boolean, string][], off = false) => `<div class="seg"${off ? ' style="opacity:.35;pointer-events:none" title="O Moderno já usa o máximo"' : ''}>${vals.map(([v, n]) => `<button data-ok="${k}" data-ov="${v}"${off ? ' disabled' : ''} class="${K.opts[k] === v && !off ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  const mod = K.opts.gfx === 1, offTxt = mod ? ' <b style="color:#d9a24f">Desligado no Moderno: ele já usa o máximo.</b>' : '';
  const rng = (k: keyof Opts, min: number, max: number, step: number, fmt: (v: number) => string) => `<div class="rng"><input type="range" data-or="${k}" min="${min}" max="${max}" step="${step}" value="${K.opts[k]}"><b>${fmt(K.opts[k] as number)}</b></div>`;
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  el.innerHTML = `<h2>Opções</h2>
    <h3>Idioma</h3>
    <div class="stat"><span>Idioma do jogo <small>Language · Idioma · Valoda. Os textos novos já saem traduzidos; o resto do jogo vai sendo traduzido aos poucos. O jogo recarrega ao trocar</small></span><div class="seg">${LANGS.map((l) => `<button data-lang="${l.id}" class="${LANG === l.id ? 'on' : ''}">${l.name}</button>`).join('')}</div></div>
    <h3>Acessibilidade</h3>
    <div class="stat"><span>Tamanho do texto <small>Todos os textos do jogo: mochila, dicas dos itens, missões, diálogos, menus</small></span>${seg('txt', [1, 1.15, 1.3, 1.5, 1.75, 2].map((v) => [v, pct(v)] as [number, string]))}</div>
    <div class="stat"><span>Texto do chat <small>Por cima do tamanho do texto: só a caixa de conversa</small></span>${seg('chat', [1, 1.25, 1.5, 1.75, 2, 2.5].map((v) => [v, pct(v)] as [number, string]))}</div>
    <h3>Tela</h3>
    <div class="stat"><span>Tamanho da interface <small>Janelas, ícones e texto juntos. Acompanha o seu monitor sozinho (Full HD, Quad HD, 4K). 1,00 é o padrão; só aparecem os tamanhos que cabem nesta tela</small></span>${seg('uis', [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.5, 2].filter((v, i) => i === 0 || uiBase() * v <= uiFitMax() + 0.001 || K.opts.uis === v).map((v) => [v, v.toFixed(2).replace('.', ',')] as [number, string]))}</div>
    <div class="stat"><span>Resolução do mundo <small>Full HD: mesmo visual e o mesmo FPS em qualquer monitor · Quad HD: mais nítido · Nativa: todos os pixels (mais pesado)${offTxt}</small></span>${seg('res', [[720, '720p'], [900, '900p'], [1080, 'Full HD'], [1440, 'Quad HD'], [0, 'Nativa']], mod)}</div>
    <div class="stat"><span>Perfis prontos <small>Um clique ajusta 'Resolução do mundo', 'Tamanho do pixel' e 'Detalhe do cenário' de uma vez; depois dá para mexer em cada um. ${Object.values(PERFIS).map((q) => `${q.n}: ${q.d}`).join(' · ')}. Agora: <b>${tamAgora()}</b>${offTxt}</small></span><div class="seg"${mod ? ' style="opacity:.35;pointer-events:none"' : ''}>${Object.entries(PERFIS).map(([id, q]) => `<button data-act="perfil" data-p="${id}" class="${!mod && K.opts.res === q.res && K.opts.pix === q.pix && K.opts.wratio === q.wratio ? 'on' : ''}">${q.n}</button>`).join('')}</div></div>
    <h3>Gráficos</h3>
    <div class="stat"><span>Estilo do gráfico <small>Pixel: o visual de pixel art do Karmika · Moderno: resolução nativa do monitor (ignora 'Resolução do mundo' e 'Tamanho do pixel'), cor sem degrau de 16 bits, luz em degradê nos modelos, sombra com o dobro de detalhe e borda macia, brilho largo e borda alisada (mais pesado). Dá para trocar quando quiser.</small></span>${seg('gfx', [[0, 'Pixel'], [1, 'Moderno']])}</div>
    <div class="stat"><span>Renderizador <small>WebGPU: o motor gráfico novo dos navegadores (mais rápido nas placas de vídeo de hoje) · WebGL: o de sempre, roda em qualquer PC · Automático: o WebGL enquanto o WebGPU do Karmika está em teste (no WebGPU o jogo ainda engasga ao andar pelo mundo, quando um bloco novo entra na tela). Se o WebGPU não abrir, o jogo volta sozinho para o WebGL. Agora: <b>${gpuState.on ? 'WebGPU' : 'WebGL'}</b>${gpuState.why ? ` (${gpuState.why})` : ''}${(K.opts.rend === 1) !== gpuState.on && !(K.opts.rend === 1 && gpuState.why) ? ' · <b style="color:#ffd27a">vale ao reabrir o jogo</b> <button data-act="reopen" style="margin-left:4px">Reabrir agora</button>' : ''}</small></span>${seg('rend', [[0, 'Automático'], [1, 'WebGPU (teste)'], [2, 'WebGL']])}</div>
${deskV?.setVideo && video ? `    <div class="stat"><span>Tradutor de vídeo <small>Só no aplicativo. O jogo desenha através de um tradutor entre ele e a placa de vídeo. O Automático usa o DirectX 11, que monta cada efeito na primeira vez que ele aparece (suspeita das travadas). Troque, reabra e compare. Se a escolha não abrir, o aplicativo volta sozinho para o Automático. Placa agora: <b>${placaNome() || 'não informada'}</b>${video.voltou ? ` · <b style="color:#ff9a6a">${video.voltou} não abriu neste PC e foi desfeito</b>` : ''}${videoNovo !== null && videoNovo !== video.angle ? ' · <b style="color:#ffd27a">vale ao reabrir o aplicativo</b> <button data-act="relaunch" style="margin-left:4px">Reabrir agora</button>' : ''}</small></span><div class="seg">${([['', 'Automático'], ['gl', 'OpenGL'], ['vulkan', 'Vulkan'], ['d3d12', 'DirectX 12']] as [string, string][]).map(([v, n]) => `<button data-act="video" data-p="${v}" class="${(videoNovo ?? video!.angle) === v ? 'on' : ''}">${n}</button>`).join('')}</div></div>\n` : ''}    <div class="stat"><span>Tamanho do pixel <small>1 = o mais fino (cada pixel do jogo é um pixel da tela, pesado) · 2 = fino · 3 = médio · 4 = pixel grosso, para PC fraco (leve)${offTxt}</small></span>${seg('pix', [[1, '1'], [2, '2'], [3, '3'], [4, '4']], mod)}</div>
    <div class="stat"><span>Detalhe do cenário <small>O chão, as casas e as árvores podem ter o pixel maior que o dos personagens. Igual: mesmo pixel (mais pesado) · Um terço: cenário bem grosso (mais leve)${offTxt}${!mod && gpuState.on ? ' <b style="color:#d9a24f">Desligado no WebGPU: lá o cenário usa sempre o mesmo pixel dos personagens. Funciona no WebGL (Renderizador: Automático).</b>' : ''}</small></span>${seg('wratio', [[1, 'Igual'], [1.5, 'Dois terços'], [2, 'Metade'], [3, 'Um terço']], mod || gpuState.on)}</div>
    <div class="stat"><span>Sombras</span>${seg('shadows', [[true, 'Ligadas'], [false, 'Desligadas']])}</div>
    <div class="stat"><span>Sombras dos personagens <small>caras: dobram o custo de cada personagem; desligadas, fica só uma sombra leve no pé</small></span>${seg('charShadows', [[true, 'Ligadas'], [false, 'Desligadas']])}</div>
    <div class="stat"><span>Qualidade das sombras</span>${seg('shadowRes', [[512, 'Baixa'], [1024, 'Média'], [2048, 'Alta']])}</div>
    <div class="stat"><span>Brilho (bloom)</span>${rng('bloom', 0, 2, 0.1, pct)}</div>
    <div class="stat"><span>Partículas e efeitos</span>${rng('particles', 0.2, 1.5, 0.1, pct)}</div>
    <div class="stat"><span>Números de dano</span>${seg('dmgText', [[true, 'Mostrar'], [false, 'Esconder']])}</div>
    <div class="stat"><span>Contador de FPS <small>mostra também onde o tempo do quadro vai: CPU (lógica e desenho) e GPU</small></span>${seg('fps', [[true, 'Mostrar'], [false, 'Esconder']])}</div>
    <div class="stat"><span>Limite de FPS <small>no app do Karmika o jogo passa da taxa do monitor; no navegador o limite é sempre o monitor</small></span>${seg('cap', [[60, '60'], [144, '144'], [240, '240'], [0, 'Sem limite']])}</div>
    <div class="stat"><span>Ajuste automático <small>Ligado: se o FPS cair abaixo de 45, o jogo baixa um pouco a resolução e as sombras sozinho, e volta quando folgar. Desligado: fica exatamente como você escolheu acima</small></span>${seg('auto', [[true, 'Ligado'], [false, 'Desligado']])}</div>
    <h3>Jogo</h3>

    <div class="stat"><span>Zoom</span><div class="seg"><button data-act="zoom">Padrão</button><span class="hint3">roda do mouse: 5 m a 22 m</span></div></div>
    <div class="stat"><span>Janelas (chat, missões, grupo)</span><div class="seg"><button data-act="ui">Posições padrão</button></div></div>
    <div class="stat"><span>Restaurar</span><div class="seg"><button data-act="reset">Opções padrão</button></div></div>`;
  const som = document.getElementById('p-som');
  if (som) som.innerHTML = `<h2>Som</h2>
    <h3>Volume</h3>
    <div class="stat"><span>Volume geral <small>Acima de 100% o jogo reforça o som (bom para notebook). O: mudo</small></span>${rng('master', 0, 1.5, 0.05, pct)}</div>
    <div class="stat"><span>Música <small>P: liga/desliga</small></span>${rng('music', 0, 1, 0.05, pct)}</div>
    <div class="stat"><span>Efeitos <small>golpes, magias, passos</small></span>${rng('sfx', 0, 1, 0.05, pct)}</div>
    <div class="stat"><span>Ambiente <small>vento, fauna, água, fogo</small></span>${rng('amb', 0, 1, 0.05, pct)}</div>
    <h3>Qualidade</h3>
    <div class="stat"><span>Qualidade do som <small>Leve: som mais simples, gasta menos do PC (vale ao reabrir o jogo) · Padrão · Alta: com ambiência, um eco curto de vale e de salão nos golpes, nas magias e na música</small></span>${seg('sndq', [[0, 'Leve'], [1, 'Padrão'], [2, 'Alta']])}</div>
    <div class="stat"><span>Saída <small>Estéreo: o som vem do lado em que a coisa acontece · Mono: tudo igual nos dois lados (um fone só, ou caixa única)</small></span>${seg('mono', [[false, 'Estéreo'], [true, 'Mono']])}</div>
    <div class="stat"><span>Modo noite <small>Deixa os sons altos mais baixos e os baixos mais audíveis, para jogar sem acordar ninguém</small></span>${seg('night', [[false, 'Desligado'], [true, 'Ligado']])}</div>
    <div class="stat"><span>Com o jogo em segundo plano <small>Quando você troca de janela</small></span>${seg('bgmute', [[false, 'Continua tocando'], [true, 'Fica mudo']])}</div>`;
  const ctl = document.getElementById('p-ctl');
  if (ctl) ctl.innerHTML = `<h2>Controles</h2>
    <div class="seg" style="justify-content:flex-start;max-width:none;margin:4px 0 8px"><button data-ctab="0" class="${ctab === 0 ? 'on' : ''}">⌨ Teclado</button><button data-ctab="1" class="${ctab === 1 ? 'on' : ''}">🎮 Joystick</button></div>
    ${ctab === 0 ? `<div class="stat"><span>Clique numa tecla e aperte a nova <small>Esc cancela. Se a tecla já for de outra ação, as duas trocam de lugar. Os números da barra de magias mostram a tecla nova</small></span><div class="seg"><button data-act="keysdef">Teclas padrão${teclasMudadas() ? ` (${teclasMudadas()} trocada${teclasMudadas() > 1 ? 's' : ''})` : ''}</button></div></div>
    ${[...new Set(ACOES.map((a) => a.grupo))].map((g) => `<h3>${g}</h3><div class="keys" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 28px;margin-top:8px">${ACOES.filter((a) => a.grupo === g).map((a) => `<label style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span>${a.nome}</span><span class="seg"><button data-key="${a.id}" style="min-width:72px;text-align:center${teclaDe(a.id) !== a.def ? ';color:#ffd24a' : ''}">${nomeTecla(teclaDe(a.id))}</button></span></label>`).join('')}</div>`).join('')}`
    : `<div class="stat"><span>${controleNome() ? 'Ligado: ' + controleNome() : 'Nenhum controle ligado'} <small>Ligue um controle (Xbox, PlayStation ou parecido) e aperte um botão: ele entra sozinho. As janelas e os menus ainda pedem o mouse</small></span></div>
    <h3>Botões</h3><div style="display:grid;grid-template-columns:auto 1fr;gap:8px 24px;margin-top:10px">${CONTROLE_AJUDA.map(([a, b]) => `<b style="color:#f0e2c0;font-weight:600">${a}</b><span>${b}</span>`).join('')}</div>`}`;
}
let ctab = 0;
const onClick = (e: Event) => { { const tb = (e.target as HTMLElement).closest('button[data-ctab]') as HTMLElement | null; if (tb) { ctab = Number(tb.dataset.ctab); renderOptions(); K.audio.click(); return; } } const lb = (e.target as HTMLElement).closest('button[data-lang]') as HTMLElement | null; if (lb) { const l = lb.dataset.lang as Lang; if (l !== LANG) setLang(l); return; }
  const b = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (!b) return;
  if (b.dataset.ok) { const k = b.dataset.ok as keyof Opts, raw = b.dataset.ov!; (K.opts as unknown as Record<string, unknown>)[k] = raw === 'true' ? true : raw === 'false' ? false : Number(raw); applyOpts(k); renderOptions(); K.audio.click(); return; }
  if (b.dataset.key) { const id = b.dataset.key; b.textContent = 'aperte…'; b.classList.add('on'); ouvirTecla((k) => { if (k) { trocarTecla(id, k); relabelBar(); K.audio.click(); } renderOptions(); }); return; }
  const a = b.dataset.act;
  if (a === 'keysdef') { teclasPadrao(); relabelBar(); renderOptions(); K.audio.click(); return; }
  if (a === 'reopen') { location.reload(); return; }
  if (a === 'perfil') { const q = PERFIS[b.dataset.p ?? '']; if (q) { K.opts.res = q.res; K.opts.pix = q.pix; K.opts.wratio = q.wratio; applyOpts(); renderOptions(); K.audio.click(); } return; }
  if (a === 'video') { videoNovo = b.dataset.p ?? ''; void deskV?.setVideo?.(videoNovo); renderOptions(); K.audio.click(); return; }
  if (a === 'relaunch') { void deskV?.relaunch?.(); return; }

  if (a === 'zoom') { K.zoomTarget = 17; }
  if (a === 'ui') { localStorage.removeItem('karmika.ui.chat'); localStorage.removeItem('karmika.ui.quests'); localStorage.removeItem('karmika.ui.party'); K.game.logMsg('Posições das janelas restauradas (recarregue com F5).', '#b9c6e0'); }
  if (a === 'reset') { Object.assign(K.opts, K.OPT_DEF); applyOpts(); renderOptions(); }
};
const onInput = (e: Event) => { const i = e.target as HTMLInputElement; if (!i.dataset.or) return; const k = i.dataset.or as keyof Opts; (K.opts as unknown as Record<string, unknown>)[k] = Number(i.value); applyOpts(k); const b = i.nextElementSibling as HTMLElement | null; if (b) b.textContent = `${Math.round(Number(i.value) * 100)}%`; };
for (const id of ['p-opt', 'p-som', 'p-ctl']) { document.getElementById(id)?.addEventListener('click', onClick); document.getElementById(id)?.addEventListener('input', onInput); }
addEventListener('karmika:controle', () => renderOptions());
setTimeout(() => { renderOptions(); applyOpts(); K.applyArtSkin(); }, 0);
  return {  };
}

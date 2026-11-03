/* PÁGINA DE OPÇÕES (gráficos, som e jogo, ao vivo) e ACESSIBILIDADE (escala do texto). Saiu do main.ts (02/11). */
import * as THREE from 'three';
import { charShadow } from '../characters';
import { installTitleTips } from '../dicas';
import type { OpcoesCtx, Opts } from '../main';

export function createOpcoes(K: OpcoesCtx) {
/* ---------- página de opções: gráficos, som e jogo, tudo ao vivo ---------- */
function applyOpts(k?: keyof Opts) {
  K.saveOpts();
  if (!k || k === 'pix' || k === 'wratio' || k === 'ui' || k === 'uis' || k === 'res' || k === 'gfx') K.applyGfx(); /* 03/11: o estilo do gráfico decide o pixel e o detalhe (Moderno = resolução cheia) */
  if (!k || k === 'shadows') { K.renderer.shadowMap.enabled = K.opts.shadows; K.scene.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined; if (!m) return; for (const mm of Array.isArray(m) ? m : [m]) mm.needsUpdate = true; }); }
  if (!k || k === 'charShadows') { charShadow.on = K.opts.charShadows; const setCast = (root: THREE.Object3D) => root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !(m as unknown as { isSprite?: boolean }).isSprite && (m.material as THREE.Material)?.type !== 'MeshBasicMaterial') m.castShadow = K.opts.charShadows; }); setCast(K.hero.root); for (const n of K.npcSys.npcs) setCast(n.hero.root); }
  if (!k || k === 'shadowRes') { K.sun.shadow.mapSize.set(K.opts.shadowRes, K.opts.shadowRes); if (K.sun.shadow.map) { K.sun.shadow.map.dispose(); (K.sun.shadow as unknown as { map: null }).map = null; } }
  if (!k || k === 'particles') K.particles.density = K.opts.particles;
  if (!k || k === 'master' || k === 'music' || k === 'sfx' || k === 'amb') K.audio.setVolumes(K.opts.master, K.opts.music, K.opts.sfx, K.opts.amb);
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
function renderOptions() {
  const el = document.getElementById('p-opt'); if (!el) return;
  const seg = (k: keyof Opts, vals: [string | number | boolean, string][]) => `<div class="seg">${vals.map(([v, n]) => `<button data-ok="${k}" data-ov="${v}" class="${K.opts[k] === v ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  const rng = (k: keyof Opts, min: number, max: number, step: number, fmt: (v: number) => string) => `<div class="rng"><input type="range" data-or="${k}" min="${min}" max="${max}" step="${step}" value="${K.opts[k]}"><b>${fmt(K.opts[k] as number)}</b></div>`;
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  el.innerHTML = `<h2>Opções</h2>
    <h3>Acessibilidade</h3>
    <div class="stat"><span>Tamanho do texto <small>Todos os textos do jogo: mochila, dicas dos itens, missões, diálogos, menus</small></span>${seg('txt', [1, 1.15, 1.3, 1.5, 1.75, 2].map((v) => [v, pct(v)] as [number, string]))}</div>
    <div class="stat"><span>Texto do chat <small>Por cima do tamanho do texto: só a caixa de conversa</small></span>${seg('chat', [1, 1.25, 1.5, 1.75, 2, 2.5].map((v) => [v, pct(v)] as [number, string]))}</div>
    <h3>Tela</h3>
    <div class="stat"><span>Tamanho da interface <small>Janelas, ícones e texto juntos. Acompanha o seu monitor sozinho (Full HD, Quad HD, 4K). 1,00 é o padrão</small></span>${seg('uis', [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.5, 2].map((v) => [v, v.toFixed(2).replace('.', ',')] as [number, string]))}</div>
    <div class="stat"><span>Resolução do mundo <small>Full HD: mesmo visual e o mesmo FPS em qualquer monitor · Quad HD: mais nítido · Nativa: todos os pixels (mais pesado)</small></span>${seg('res', [[720, '720p'], [1080, 'Full HD'], [1440, 'Quad HD'], [0, 'Nativa']])}</div>
    <h3>Gráficos</h3>
    <div class="stat"><span>Estilo do gráfico <small>Pixel: o visual de pixel art do Karmika · Moderno: resolução cheia, cores sem degrau, brilho e sombras suaves (mais pesado). Dá para trocar quando quiser.</small></span>${seg('gfx', [[0, 'Pixel'], [1, 'Moderno']])}</div>
    <div class="stat"><span>Tamanho do pixel <small>1 = nítido (pesado) · 4 = pixel grosso (leve)</small></span>${seg('pix', [[1, '1'], [2, '2'], [3, '3'], [4, '4']])}</div>
    <div class="stat"><span>Detalhe do cenário <small>cenário em 1/N da resolução dos personagens</small></span>${seg('wratio', [[1, 'Igual'], [1.5, 'Dois terços'], [2, 'Metade'], [3, 'Um terço']])}</div>
    <div class="stat"><span>Sombras</span>${seg('shadows', [[true, 'Ligadas'], [false, 'Desligadas']])}</div>
    <div class="stat"><span>Sombras dos personagens <small>caras: dobram o custo de cada personagem; a mancha no pé fica</small></span>${seg('charShadows', [[true, 'Ligadas'], [false, 'Desligadas']])}</div>
    <div class="stat"><span>Qualidade das sombras</span>${seg('shadowRes', [[512, 'Baixa'], [1024, 'Média'], [2048, 'Alta']])}</div>
    <div class="stat"><span>Brilho (bloom)</span>${rng('bloom', 0, 2, 0.1, pct)}</div>
    <div class="stat"><span>Partículas e efeitos</span>${rng('particles', 0.2, 1.5, 0.1, pct)}</div>
    <div class="stat"><span>Números de dano</span>${seg('dmgText', [[true, 'Mostrar'], [false, 'Esconder']])}</div>
    <div class="stat"><span>Contador de FPS <small>mostra também onde o tempo do quadro vai: CPU (lógica e desenho) e GPU</small></span>${seg('fps', [[true, 'Mostrar'], [false, 'Esconder']])}</div>
    <div class="stat"><span>Limite de FPS <small>no app do Karmika o jogo passa da taxa do monitor; no navegador o limite é sempre o monitor</small></span>${seg('cap', [[60, '60'], [144, '144'], [240, '240'], [0, 'Sem limite']])}</div>
    <h3>Som</h3>
    <div class="stat"><span>Volume geral <small>O: mudo</small></span>${rng('master', 0, 1, 0.05, pct)}</div>
    <div class="stat"><span>Música <small>P: liga/desliga</small></span>${rng('music', 0, 1, 0.05, pct)}</div>
    <div class="stat"><span>Efeitos (golpes, magias, passos)</span>${rng('sfx', 0, 1, 0.05, pct)}</div>
    <div class="stat"><span>Ambiente (vento, fauna, água, fogo)</span>${rng('amb', 0, 1, 0.05, pct)}</div>
    <h3>Jogo</h3>
    <div class="stat"><span>Dia / noite</span><div class="seg"><button data-act="night">Alternar (N)</button></div></div>
    <div class="stat"><span>Zoom</span><div class="seg"><button data-act="zoom">Padrão</button><span class="hint3">roda do mouse: 5 m a 22 m</span></div></div>
    <div class="stat"><span>Janelas (chat, missões)</span><div class="seg"><button data-act="ui">Posições padrão</button></div></div>
    <div class="stat"><span>Restaurar</span><div class="seg"><button data-act="reset">Opções padrão</button></div></div>`;
}
document.getElementById('p-opt')?.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (!b) return;
  if (b.dataset.ok) { const k = b.dataset.ok as keyof Opts, raw = b.dataset.ov!; (K.opts as unknown as Record<string, unknown>)[k] = raw === 'true' ? true : raw === 'false' ? false : Number(raw); applyOpts(k); renderOptions(); K.audio.click(); return; }
  const a = b.dataset.act;
  if (a === 'night') window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
  if (a === 'zoom') { K.zoomTarget = 17; }
  if (a === 'ui') { localStorage.removeItem('karmika.ui.chat'); localStorage.removeItem('karmika.ui.quests'); K.game.logMsg('Posições das janelas restauradas (recarregue com F5).', '#b9c6e0'); }
  if (a === 'reset') { Object.assign(K.opts, K.OPT_DEF); applyOpts(); renderOptions(); }
});
document.getElementById('p-opt')?.addEventListener('input', (e) => { const i = e.target as HTMLInputElement; if (!i.dataset.or) return; const k = i.dataset.or as keyof Opts; (K.opts as unknown as Record<string, unknown>)[k] = Number(i.value); applyOpts(k); const b = i.nextElementSibling as HTMLElement | null; if (b) b.textContent = `${Math.round(Number(i.value) * 100)}%`; });
setTimeout(() => { renderOptions(); applyOpts(); K.applyArtSkin(); }, 0);
  return {  };
}

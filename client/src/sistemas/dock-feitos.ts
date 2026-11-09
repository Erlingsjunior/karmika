/* DOCK DE JANELAS (canto inferior direito) e as janelas de MAGIAS e FEITOS: os botões, os ícones, o aviso de feito conquistado. Saiu do main.ts (02/11). */
import { ownRuneText } from '../runas-elfo';
import { DOCK_ICONS } from '../ui/icones';
import { type Feat, CATS, createFeats, FEATS } from '../feats';
import { floatWin, movable, MV_GRIP } from '../windows';
import { renderTalents } from './talentos-ui';
import { runeSlots } from './runas-ui';
import { renderPassives, renderCompendium, runeTextFor } from './passivas-ui';
import type { DockFeitosCtx } from '../main';

export function createDockFeitos(K: DockFeitosCtx) {
/* ---------- dock de janelas (canto inferior direito): mochila, personagem, magias, missões, feitos, mapa ---------- */
const dockEl = document.createElement('div'); dockEl.id = 'dock';
/* dock em quadradinhos, embaixo do chat (canto inferior esquerdo): um quadrado para cada janela do jogo */
const DOCK: [string, string, string][] = [['inv', 'Mochila', 'I'], ['char', 'Personagem', 'C'], ['skills', 'Árvore Kármica (magias)', 'K'], ['quests', 'Missões', 'J'], ['feats', 'Conquistas — Inscrições de Marghar', 'L'], ['karma', 'Compêndio do Karma', 'U'], ['prof', 'Profissões', 'Y'], ['loja', 'Shop — Premium e brasões', 'T'], ['map', 'Mapa', 'M'], ['stable', 'Estábulo e Companheiros — pets e montarias', 'X'], ['coop', 'Jogar junto — abrir sala ou entrar com convite', '⇧F4'], ['social', 'Amigos, conversas e guilda', 'F9'], ['opts', 'Opções e configurações', 'Esc']];
dockEl.innerHTML = DOCK.map(([d, t, k]) => `<button data-d="${d}" title="${t} (${k})">${DOCK_ICONS[d] ?? ''}<small>${k}</small></button>`).join('');
dockEl.insertAdjacentHTML('beforeend', MV_GRIP('r')); document.body.appendChild(dockEl); movable(dockEl, 'dock');
const skillsEl = document.createElement('div'); skillsEl.id = 'skillsw'; skillsEl.className = 'modalw'; document.body.appendChild(skillsEl);
const featsEl = document.createElement('div'); featsEl.id = 'featsw'; featsEl.className = 'modalw'; document.body.appendChild(featsEl);
/* Inscrições de Marghar (conquistas): aviso dourado no alto da tela quando uma se grava */
const featToast = (f: Feat) => { const d = document.createElement('div'); d.className = 'feattoast'; d.innerHTML = `<i>${CATS[f.cat].icon}</i><div><small>Inscrição de Marghar</small><b>${f.name}</b><span>${f.desc}</span></div>`; document.body.appendChild(d); requestAnimationFrame(() => d.classList.add('on')); setTimeout(() => d.classList.remove('on'), 5200); setTimeout(() => d.remove(), 6200); try { K.audio.chime(); } catch { /* */ } };
const feats = createFeats({ xp: (f) => K.game.gainXp(Math.max(5, Math.round(K.game.xpNeed() * f))), gold: (n) => { K.game.st.gold += n; }, toast: (f) => { featToast(f); K.game.logMsg(`🏅 Inscrição de Marghar: ${f.name}`, '#ffe08a'); } });
(window as unknown as { __feats: unknown }).__feats = feats;
floatWin(skillsEl, 'skills', { left: '22vw', top: '5vh' }); floatWin(featsEl, 'feats', { left: '30vw', top: '8vh' });
setTimeout(() => { const ql = document.getElementById('qlog'); if (ql) floatWin(ql, 'qlog', { left: '34vw', top: '9vh' }); }, 0);
let skillsOpen = false, featsOpen = false;
let skView: 'mag' | 'tal' | 'pas' | 'comp' = 'mag'; const talSel = { id: null as string | null };
/** as abas no alto da janela: Magias (a Árvore Kármica) e Talentos (a constelação de atributos e passivas) */
function skTabs() { const h = skillsEl.querySelector('h2'); if (!h) return; const d = document.createElement('div'); d.className = 'ktabs sktabs';
  const bt = (v: 'mag' | 'tal' | 'pas' | 'comp', t: string, n: number) => `<button data-skv="${v}" class="${skView === v ? 'on' : ''}">${t}${n ? ` <i>${n} livre${n === 1 ? '' : 's'}</i>` : ''}</button>`;
  d.innerHTML = bt('mag', '🌳 Habilidades', K.tree.available()) + bt('pas', '✦ Passivas', 0) + bt('tal', '✧ Talentos', K.talents.avail()) + bt('comp', '📖 Compêndio', 0); h.after(d);
  d.querySelectorAll<HTMLButtonElement>('[data-skv]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); skView = b.dataset.skv as 'mag' | 'tal' | 'pas' | 'comp'; renderSkills(); })); }
function renderSkills() {
  if (skView === 'pas' || skView === 'comp') { const ctx = { kit: skView === 'pas' ? K.passKit() : K.compKit(), skills: K.kitSkills(), rank: (id: string) => K.tree.rank(id), avail: () => K.tree.available(), lvl: K.game.st.lvl, title: K.compTitle(), sfx: () => K.audio.rune(0), log: (t: string, c?: string) => K.game.logMsg(t, c), rerender: renderSkills, recalc: () => { K.game.st.recalc?.(); K.applyKitAll(); /* 05/11: a barra redesenha com os selos das passivas */ } };
    if (skView === 'pas') renderPassives(skillsEl, ctx); else renderCompendium(skillsEl, ctx); skTabs(); return; }
  if (skView === 'tal') { renderTalents(skillsEl, K.talents, K.talentKit(), (() => { try { return K.game.classInfo.lvl; } catch { return 1; } })(), talSel, () => { K.audio.rune(0); renderSkills(); }); skTabs(); return; }
  K.tree.migrate();
  K.tree.render(skillsEl, K.treeSel, (id) => { K.treeSel = id; renderSkills(); }, (id) => { const r0 = K.tree.rank(id); if (K.tree.invest(id)) { const r1 = K.tree.rank(id); K.audio.rune([3, 6, 10].includes(r1) && r1 > r0 ? 1 : 0); K.applyKitAll(); renderSkills(); } });
  { /* 04/11 (Erling: "não acho que precisamos do aviso do instinto na tela de skills"): o cartão do Instinto saiu desta tela (continua na tecla F e no botão da barra) */ const top = false ? skillsEl.querySelector('.tree-top') : null; if (top) { const I = K.myInstinct(), d = document.createElement('div'); d.className = 'instcard' + (K.instintoSys.instinctOn ? ' on' : ''); d.style.setProperty('--ic', I.css);
    d.innerHTML = `<i>✧</i><div><b>${I.name}</b><small>Passiva de classe · ${K.instintoSys.instinctOn ? 'ligada' : 'desligada'} · tecla F</small><p>${I.desc} Com ela ligada você vê rastros, espíritos, dispositivos perdidos e esconderijos que ninguém mais vê; desligada, só a ameaça de verdade te acorda.</p></div><button data-inst>${K.instintoSys.instinctOn ? 'Desligar' : 'Ligar'}</button>`;
    top.after(d); d.querySelector('[data-inst]')!.addEventListener('click', (e) => { e.stopPropagation(); K.toggleInstinct(); renderSkills(); }); } }
  runeSlots(skillsEl, { id: K.treeSel ?? 'combo', kit: K.kitRace(), rank: K.tree.rank(K.treeSel ?? 'combo'), txt: (() => { const sk = K.kitSkills().find((q) => q.id === (K.treeSel ?? 'combo')); return sk ? ownRuneText(K.kitRace(), sk.id) ?? runeTextFor(K.compKit(), sk) : null; })(), /* 06/11: o Elfo mostra o efeito próprio que o jogo aplica */ inv: K.inv, game: K.game, sfx: () => K.audio.rune(1), rerender: renderSkills });
  skTabs();
  skillsEl.style.display = 'flex';
}
let featTab: keyof typeof CATS | null = null;
function renderFeats() {
  const done = K.quests.q.done.length, titles = K.quests.title ? [K.quests.title] : [];
  const cats = Object.keys(CATS) as (keyof typeof CATS)[]; if (!featTab) featTab = cats[0];
  const tot = feats.doneCount(), all = FEATS.length, pct = Math.round(tot / all * 100);
  const stat = (v: string | number, l: string) => `<div class="fs"><b>${v}</b><small>${l}</small></div>`;
  const cnt = (c: keyof typeof CATS) => [FEATS.filter((f) => f.cat === c && feats.isDone(f.id)).length, FEATS.filter((f) => f.cat === c).length];
  const list = FEATS.filter((f) => f.cat === featTab).map((f) => ({ f, ok: feats.isDone(f.id), v: Math.min(f.goal, feats.count(f.key)) })).sort((x, y) => Number(y.ok) - Number(x.ok) || y.v / y.f.goal - x.v / x.f.goal);
  featsEl.innerHTML = `<div class="pn ftpn2"><h2>🏅 Inscrições de Marghar <button data-x>✕</button></h2>
    <div class="ft-top"><div class="ft-ring" style="--p:${pct}"><div><b>${tot}</b><small>de ${all}</small></div></div>
      <div class="ft-side"><p class="ftlore">Em cada relíquia há linhas de runas que mudam sozinhas: os feitos de quem passou por ali. Não pesam na balança — são memória. E atravessam a Ampulheta: quem desencarna perde o nome e o ouro, mas não as Inscrições.</p>
        <div class="ft-stats">${stat(K.game.st.lvl, 'nível')}${stat(K.game.st.kills, 'abates')}${stat(done, 'missões')}${stat(`${K.relicsKnown.size}/${K.city.relics.length}`, 'relíquias')}${stat(K.build.built.length, 'construções')}${stat(Math.round(K.state.karma), 'karma')}${stat(titles.length ? titles.join(', ') : '—', 'título')}${stat(K.profile?.eye ? 'aberto' : 'dormindo', 'Olho')}</div></div></div>
    <div class="ft-tabs">${cats.map((c) => { const [d, n] = cnt(c); return `<button data-ft="${c}" class="${c === featTab ? 'on' : ''}"><i>${CATS[c].icon}</i><span>${CATS[c].name}</span><small>${d}/${n}</small><u><em style="width:${n ? d / n * 100 : 0}%"></em></u></button>`; }).join('')}</div>
    <p class="ft-cl">${CATS[featTab].lore}</p>
    <div class="ft-grid">${list.map(({ f, ok, v }) => { const p = Math.round(v / f.goal * 100); return `<div class="ft-card ${ok ? 'ok' : v > 0 ? 'go' : 'off'}"><div class="ft-medal" style="--p:${ok ? 100 : p}"><i>${ok ? '✦' : CATS[f.cat].icon}</i></div>
      <div class="ft-tx"><b>${f.name}</b><small>${f.desc}</small>${ok ? '<em class="okt">inscrita</em>' : f.goal > 1 ? `<em>${v}/${f.goal}</em>` : '<em>ainda não</em>'}</div></div>`; }).join('')}</div>
    <small class="ft">Esc fecha</small></div>`;
  featsEl.style.display = 'flex';
}
featsEl.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('[data-ft]') as HTMLElement | null; if (b) { featTab = b.dataset.ft as keyof typeof CATS; renderFeats(); } });
function toggleSkills(on?: boolean) { skillsOpen = on ?? !skillsOpen; if (skillsOpen) renderSkills(); else skillsEl.style.display = 'none'; }
function toggleFeats(on?: boolean) { featsOpen = on ?? !featsOpen; if (featsOpen) renderFeats(); else featsEl.style.display = 'none'; }
for (const [el, fn] of [[skillsEl, toggleSkills], [featsEl, toggleFeats]] as [HTMLElement, (on?: boolean) => void][]) el.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-x]') || t === el) fn(false); });
dockEl.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (!b) return; K.keys.clear(); const d = b.dataset.d; if (d === 'inv') K.inv.toggle(); else if (d === 'char') K.inv.toggleChar(); else if (d === 'skills') toggleSkills(); else if (d === 'quests') K.quests.toggleLog(); else if (d === 'feats') toggleFeats(); else if (d === 'map') K.toggleBigMap(); else if (d === 'prof') K.profs.toggle(); else if (d === 'loja') K.loja.toggle(); else if (d === 'karma') K.compendium.toggle(); else if (d === 'coop') K.coop.toggle(); else if (d === 'stable') K.stable.toggle(); else if (d === 'social') K.social.toggle(); else if (d === 'opts') { K.game.toggleMenu(true); (document.querySelector('#menu [data-p="p-opt"]') as HTMLElement | null)?.click(); } });
  return { feats, dockEl, get skillsOpen() { return skillsOpen; }, get featsOpen() { return featsOpen; }, toggleSkills, toggleFeats };
}

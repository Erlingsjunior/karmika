/* ALINHAMENTO KÁRMICO (Erling, 25/10): "o que os outros jogos chamam de reputação, no nosso é o alinhamento kármico com o lugar".
   Cada vila e cidade, cada região e cada facção guarda o quanto a sua alma combina com ela (−100 a +100).
   - Sobe: missões dadas por gente do lugar (+6 história, +3 as outras), bichos derrubados perto das casas (+0,25), eventos vencidos
     do lado da luz no lugar (+5). A região sobe junto, mais devagar. A facção a que você jurou sobe +1 a cada missão (a outra cai −1).
   - Desce: comer gente no lugar (−20), sangue de gente nas ruas, eventos vencidos do lado da sombra (−5).
   - Faz diferença: preço nas lojas do lugar (até −12% para quem é Lenda Viva, até +25% para quem é Odiado), o jeito que o povo fala com
     você e a recepção quando você volta. */
import { floatWin } from './windows';

export interface AlignTier { min: number; name: string; col: string; price: number }
export const TIERS: AlignTier[] = [
  { min: -101, name: 'Odiado', col: '#c03a3a', price: 1.25 }, { min: -60, name: 'Hostil', col: '#e06a4a', price: 1.15 },
  { min: -25, name: 'Desconfiado', col: '#d8a060', price: 1.05 }, { min: -5, name: 'Neutro', col: '#b8a888', price: 1 },
  { min: 10, name: 'Conhecido', col: '#c8d890', price: 1 }, { min: 30, name: 'Amigo', col: '#8ad08a', price: 0.95 },
  { min: 60, name: 'Honrado', col: '#6ab4ff', price: 0.92 }, { min: 85, name: 'Lenda Viva', col: '#ffd24a', price: 0.88 },
];
export const tierOf = (v: number) => { let t = TIERS[0]; for (const x of TIERS) if (v >= x.min) t = x; return t; };
type Kind = 'vila' | 'regiao' | 'faccao';
interface St { v: Record<string, number>; seen: Record<string, number>; flags: Record<string, number> }
const KEY = 'karmika.align.v1';
export function createAlign(ctx: { places(): { name: string; kind: 'city' | 'village' }[]; regions(): string[]; factions(): { id: string; name: string }[]; myFac(): string | null; log(t: string, c?: string): void; /** uma linha sobre o lugar onde você está agora (festa, por que sim, por que não) */ status?(): string }) {
  let S: St = { v: {}, seen: {}, flags: {} }; try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o?.v) S = { ...S, ...o }; } catch { /* */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* */ } };
  const k = (kind: Kind, name: string) => `${kind}:${name}`;
  const get = (kind: Kind, name: string) => S.v[k(kind, name)] ?? 0;
  /** muda e avisa quando passa de faixa */
  function add(kind: Kind, name: string, dv: number, why?: string, quiet = false) { if (!name || !dv) return; const key = k(kind, name), a = S.v[key] ?? 0, b = Math.max(-100, Math.min(100, a + dv)); S.v[key] = b;
    const ta = tierOf(a), tb = tierOf(b); if (ta !== tb && !quiet) ctx.log(`${b > a ? '▲' : '▼'} Alinhamento Kármico com ${name}: agora ${tb.name}${why ? ` (${why})` : ''}.`, tb.col); save(); if (open) render(); }
  /* ---------- a janela ---------- */
  const el = document.createElement('div'); el.id = 'alignw'; el.className = 'modalw'; document.body.appendChild(el); setTimeout(() => floatWin(el, 'align', { left: '30vw', top: '8vh' }), 0);
  let open = false, tab: Kind = 'vila';
  const row = (name: string, v: number, sub = '') => { const t = tierOf(v), pct = (v + 100) / 2; return `<div class="alr"><div class="alh"><b>${name}</b><span style="color:${t.col}">${t.name}</span><em>${v > 0 ? '+' : ''}${Math.round(v)}</em></div><div class="albar"><i style="left:50%;width:0"></i><u style="left:${Math.min(50, pct)}%;width:${Math.abs(pct - 50)}%;background:${t.col}"></u></div>${sub ? `<small>${sub}</small>` : ''}</div>`; };
  function render() { if (!open) { el.style.display = 'none'; return; }
    let body = '';
    if (tab === 'vila') { const P = ctx.places().slice().sort((a, b) => get('vila', b.name) - get('vila', a.name) || a.name.localeCompare(b.name)); body = P.map((p) => { const v = get('vila', p.name), t = tierOf(v); return row(`${p.kind === 'city' ? '🏰' : '🏘'} ${p.name}`, v, t.price !== 1 ? `Lojas daqui: ${t.price < 1 ? '−' : '+'}${Math.round(Math.abs(1 - t.price) * 100)}%` : S.seen[p.name] ? '' : 'Ainda não te conhecem.'); }).join(''); }
    else if (tab === 'regiao') body = ctx.regions().slice().sort((a, b) => get('regiao', b) - get('regiao', a)).map((r) => row(`⛰ ${r}`, get('regiao', r))).join('');
    else body = ctx.factions().map((f) => row(`⚑ ${f.name}`, get('faccao', f.id), ctx.myFac() === f.id ? 'Você jurou por ela: cada missão feita soma +1.' : ctx.myFac() ? 'A outra bandeira: cada missão sua pesa −1 aqui.' : 'Sem juramento ainda.')).join('');
    el.innerHTML = `<div class="pn alpn"><h2>Alinhamento Kármico <button data-x title="Fechar">✕</button></h2><p class="aldesc">O que outros chamam de reputação, em Karmika é o quanto a sua alma combina com o lugar. Missões, ajuda e sangue mudam isso.</p>
      ${ctx.status ? `<div class="alnow">${ctx.status()}</div>` : ''}<div class="altabs">${(([['vila', '🏘 Vilas e cidades'], ['regiao', '⛰ Regiões'], ['faccao', '⚑ Facções']]) as [Kind, string][]).map(([kk, t]) => `<button data-tab="${kk}" class="${tab === kk ? 'on' : ''}">${t}</button>`).join('')}</div>
      <div class="allist">${body}</div><div class="altiers">${TIERS.map((t) => `<span style="color:${t.col}">${t.name}</span>`).join(' · ')}</div></div>`;
    el.style.display = 'flex'; }
  el.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-x]')) { toggle(false); return; } const b = t.closest('[data-tab]') as HTMLElement | null; if (b) { tab = b.dataset.tab as Kind; render(); } });
  function toggle(on = !open) { open = on; render(); }
  /** os lugares por onde você passou (ou que já te conhecem), para a tela do personagem */
  function visitedHtml() { const P = ctx.places().filter((p) => S.seen[p.name] || S.v[k('vila', p.name)]); const R = ctx.regions().filter((r) => S.v[k('regiao', r)]); const F = ctx.factions().filter((f) => S.v[k('faccao', f.id)] || ctx.myFac() === f.id);
    const sec = (t: string, rows: string) => rows ? `<h4>${t}</h4>${rows}` : '';
    return (sec('Vilas e cidades', P.sort((a, b) => get('vila', b.name) - get('vila', a.name)).map((p) => row(`${p.kind === 'city' ? '🏰' : '🏘'} ${p.name}`, get('vila', p.name))).join('')) + sec('Regiões', R.map((r) => row(`⛰ ${r}`, get('regiao', r))).join('')) + sec('Facções', F.map((f) => row(`⚑ ${f.name}`, get('faccao', f.id))).join(''))) || '<p class="alsd">Você ainda não passou por nenhum lugar que te conheça.</p>'; }
  return { visitedHtml, get, places: () => ctx.places(), add, toggle, get isOpen() { return open; }, tier: (kind: Kind, name: string) => tierOf(get(kind, name)),
    /** chegou na vila: guarda a hora (para saber se é volta) e devolve há quanto tempo não vinha (ms) */
    arrive(name: string) { const now = Date.now(), last = S.seen[name] ?? 0; S.seen[name] = now; save(); return last ? now - last : -1; },
    flag: (f: string) => S.flags[f] ?? 0, setFlag(f: string, v = 1) { S.flags[f] = v; save(); } };
}

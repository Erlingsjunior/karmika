/* 06/11 (Erling: "página da guilda: boas-vindas, missões, níveis I a V"): a aba "Visão" da guilda.
   Os números (glória, vagas, cofre, imposto, missões do dia) vêm do servidor (desktop/src/guilda-nivel.cjs);
   aqui ficam os textos do que cada nível libera e o desenho da página. Quem fala com o servidor é o social.ts. */

export interface GMission { kind: string; name: string; text: string; need: number; n: number; xp: number; done: number }
export interface GLevelView { lvl?: number; xp?: number; need?: number; prevNeed?: number; max?: boolean; cap?: number; cofre?: number; debt?: number; tax?: number; miss?: { day: string; list: GMission[] } | null; welcome?: string; signed?: { name: string }[] }

export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
/** o que cada nível libera (documento de 05/11). "on" diz se já existe no jogo; o resto aparece como "em breve" */
export const LEVELS: { lvl: number; cap: string; perks: { t: string; on?: boolean }[] }[] = [
  { lvl: 1, cap: '20 vagas', perks: [{ t: 'Mensagem do dia e de boas-vindas', on: true }, { t: 'Chat da guilda (/guilda)', on: true }, { t: 'Convite e expulsão', on: true }, { t: 'Terreno com salão e estandarte', on: true }, { t: 'Mercado só dos membros', on: true }] },
  { lvl: 2, cap: '+15 vagas', perks: [{ t: 'Baú da guilda' }, { t: 'Patentes da guilda', on: true }, { t: 'Símbolo e bandeira', on: true }] },
  { lvl: 3, cap: '+15 vagas', perks: [{ t: 'Símbolo e patente ao lado do nome' }, { t: 'Casa da guilda: sala de armas, sala de profissões e loja da guilda' }] },
  { lvl: 4, cap: '—', perks: [{ t: 'Castelo da guilda e muros' }] },
  { lvl: 5, cap: '—', perks: [{ t: 'Vila da guilda: terreno grande, murado, com casas, comércios, ruas e rota de caravana' }, { t: 'A vila cobra imposto dos moradores (e paga o dobro ao jogo)' }] },
];
const KIND_ICON: Record<string, string> = { kill: '⚔', elite: '👑', quest: '📜', cofre: '🪙', gather: '⛏' };

const esc = (t: string) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const fmt = (n: number) => Math.round(n).toLocaleString('pt-BR');

/** a página: nível e glória, cofre e imposto, missões do dia, boas-vindas e a escada de níveis */
export function overviewHtml(g: GLevelView, rk: number, gold: number): string {
  const L = g.lvl ?? 1, xp = g.xp ?? 0, lo = g.prevNeed ?? 0, hi = g.need ?? 0, pct = g.max ? 100 : Math.max(0, Math.min(100, ((xp - lo) / Math.max(1, hi - lo)) * 100));
  const miss = g.miss?.list ?? [];
  const lvlBox = `<div class="gvlvl"><div class="gvemb"><b>${ROMAN[L]}</b><small>nível</small></div><div class="gvbar"><div class="gvbt"><b>Glória</b><span>${g.max ? `${fmt(xp)} · nível máximo` : `${fmt(xp)} / ${fmt(hi)} para o nível ${ROMAN[L + 1]}`}</span></div><div class="gvtrack"><i style="width:${pct.toFixed(1)}%"></i></div>
      <small>Glória vem das missões do dia e das doações ao cofre (10 de ouro = 1 de glória). Vagas: <b>${g.cap ?? 20}</b>.</small></div></div>`;
  const debt = g.debt ?? 0;
  const cofre = `<div class="gvcof ${debt ? 'debt' : ''}"><div><span>🪙 Cofre</span><b>${fmt(g.cofre ?? 0)}</b></div><div><span>⚖ Imposto do dia</span><b>${fmt(g.tax ?? 0)}</b></div>${debt ? `<div><span>⚠ Dívida</span><b>${fmt(debt)}</b></div>` : ''}
      <div class="gvgive"><input data-v="gdon" type="number" min="1" max="${gold}" placeholder="ouro" title="Você tem ${fmt(gold)} de ouro"><button data-a="gdonate" class="gold">Doar</button></div>
      <small>${debt ? 'Com dívida a guilda não sobe de nível: as doações pagam a dívida primeiro.' : 'O Prefeito recolhe o imposto do cofre à meia-noite. Quanto maior a guilda, maior o imposto.'}</small></div>`;
  const missH = `<h4>Missões do dia <small>todos os membros somam · viram à meia-noite</small></h4><div class="gvmis">${miss.map((q) => { const p = Math.min(100, (q.n / Math.max(1, q.need)) * 100);
    return `<div class="gvm ${q.done ? 'done' : ''}"><i>${KIND_ICON[q.kind] ?? '•'}</i><div><b>${esc(q.name)}</b><small>${esc(q.text)}</small><div class="gvtrack"><i style="width:${p.toFixed(1)}%"></i></div></div><span>${q.done ? '✔ cumprida' : `${fmt(q.n)} / ${fmt(q.need)}`}<em>+${fmt(q.xp)} glória</em></span></div>`; }).join('') || '<p class="somut">As missões chegam com o próximo recado do servidor.</p>'}</div>`;
  const wel = `<h4>Boas-vindas ${rk >= 2 ? '<button class="ghost" data-a="gwelcome">editar</button>' : ''}</h4><div class="gvwel">${esc(g.welcome || 'Sem mensagem de boas-vindas ainda.').replace(/\n/g, '<br>')}</div><small class="somut">Quem entra na guilda lê isto ao chegar.</small>`;
  const ladder = `<h4>Níveis da guilda</h4><div class="gvlad">${LEVELS.map((v) => `<div class="gvl ${v.lvl <= L ? 'on' : ''} ${v.lvl === L ? 'cur' : ''}"><b>${ROMAN[v.lvl]}</b><div><small>${v.cap}</small><ul>${v.perks.map((p) => `<li>${v.lvl <= L ? (p.on ? '✔' : '⏳') : '🔒'} ${esc(p.t)}${p.on ? '' : ' <em>em breve</em>'}</li>`).join('')}</ul></div></div>`).join('')}</div>`;
  const founders = g.signed?.length ? `<p class="somut">Fundadores: ${g.signed.map((s) => esc(s.name)).join(', ')}.</p>` : '';
  return `<div class="gview">${lvlBox}${cofre}${missH}${wel}${ladder}${founders}</div>`;
}

/** a carta de boas-vindas para quem acabou de entrar */
export const welcomeHtml = (name: string, text: string) => `<div class="gfnd gwelc"><h4>⚑ Bem-vindo à ${esc(name)}</h4><div class="gvwel">${esc(text || 'Leia a mensagem do dia e diga oi no chat.').replace(/\n/g, '<br>')}</div><div class="sorow"><button data-a="gwelok" class="gold">Entendi</button></div></div>`;

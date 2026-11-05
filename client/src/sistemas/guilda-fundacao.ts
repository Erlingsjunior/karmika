/* 05/11 (Erling): a FUNDAÇÃO de guilda nova. Sai a missão do Escrivão e a taxa de 500 de ouro; entra:
   - 1 Lágrima de Marghar, levada pelo líder da party;
   - uma party de 3, todos juntos no salão do Prefeito de Lumenhal;
   - o líder escreve o NOME (que nunca muda) e escolhe a bandeira e o ícone (que mudam depois);
   - os outros dois ASSINAM o documento na tela deles. Só com as três assinaturas a guilda nasce e entra no Livro de Guildas.
   Aqui ficam o desenho da bandeira, o formulário, o documento e a tela de assinatura; quem fala com o servidor é o social.ts. */

export interface GFlag { pat: string; c1: string; c2: string }
export const FLAG_PATS: { id: string; name: string }[] = [
  { id: 'liso', name: 'Lisa' }, { id: 'faixa', name: 'Faixa' }, { id: 'cruz', name: 'Cruz' },
  { id: 'diagonal', name: 'Banda' }, { id: 'chevron', name: 'Asna' }, { id: 'quartel', name: 'Quartéis' },
];
export const GUILD_ICONS = ['⚔', '🛡', '🏹', '🔥', '❄', '⚡', '🌙', '☀', '🐺', '🦅', '🐉', '💀', '🌿', '⚒', '📜', '👁'];
export const FOUND_NEAR_M = 14;
/** nível BASE pedido para fundar (Erling, 05/11) */
export const FOUND_LVL = 45; /* "todos juntos no salão": os três a menos de 14 m um do outro */

const esc = (t: string) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** o fundo CSS de cada desenho de bandeira (heráldica simples: duas cores) */
export function flagBg(f: GFlag | null | undefined, fallback = '#b8924a'): string {
  const a = f?.c1 ?? fallback, b = f?.c2 ?? '#2a1a10';
  switch (f?.pat) {
    case 'faixa': return `linear-gradient(${a} 0 34%, ${b} 34% 66%, ${a} 66%)`;
    case 'cruz': return `linear-gradient(90deg, transparent 38%, ${b} 38% 62%, transparent 62%), linear-gradient(transparent 32%, ${b} 32% 52%, transparent 52%), ${a}`;
    case 'diagonal': return `linear-gradient(135deg, ${a} 0 40%, ${b} 40% 60%, ${a} 60%)`;
    case 'chevron': return `linear-gradient(to bottom right, transparent 49%, ${b} 50% 64%, transparent 65%) left / 50% 100% no-repeat, linear-gradient(to bottom left, transparent 49%, ${b} 50% 64%, transparent 65%) right / 50% 100% no-repeat, ${a}`;
    case 'quartel': return `conic-gradient(${a} 0 25%, ${b} 0 50%, ${a} 0 75%, ${b} 0)`;
    default: return a;
  }
}
/** o estandarte pequeno (cabeçalho da guilda, lista do Livro) */
export const bannerHtml = (f: GFlag | null | undefined, icon: string | null | undefined, col: string, big = false) =>
  `<span class="gfban${big ? ' big' : ''}" style="--gb:${flagBg(f, col)};--gc:${f?.c1 ?? col}"><i>${esc(icon || '⚔')}</i></span>`;

export interface FoundDraft { name: string; tag: string; flag: GFlag; icon: string }
export interface FoundCheck { lvl: number; tear: boolean; party: { name: string; near: boolean }[]; leader: boolean; inParty: boolean }

/** os requisitos com ✔ ou ✘, um por linha, para o jogador ver o que falta antes de tentar */
export function reqList(c: FoundCheck): { ok: boolean; html: string }[] {
  const others = c.party.length, near = c.party.filter((p) => p.near).length;
  return [
    { ok: c.lvl >= FOUND_LVL, html: `<b>Nível base ${FOUND_LVL}</b> ou mais ${c.lvl >= FOUND_LVL ? '' : `<small>você está no ${c.lvl}</small>`}` },
    { ok: c.tear, html: `<b>1 Lágrima de Marghar</b> na bolsa <small>${c.tear ? 'ela é entregue ao Prefeito quando a guilda nascer' : 'cai de Marghar, ou se compra no Quadro e no leilão'}</small>` },
    { ok: c.inParty && c.leader && others >= 2, html: `<b>Party de 3</b>, com você na liderança ${!c.inParty ? '<small>você não está numa party</small>' : !c.leader ? '<small>só o líder da party funda</small>' : others < 2 ? `<small>faltam ${2 - others}</small>` : ''}` },
    { ok: others >= 2 && near >= 2, html: `<b>Os três no salão</b>, a menos de ${FOUND_NEAR_M} m ${others ? `<small>${c.party.map((p) => `${esc(p.name)} ${p.near ? '✔' : '✘ longe'}`).join(' · ')}</small>` : ''}` },
  ];
}

/** o formulário do líder: nome, sigla, bandeira, ícone e o documento que os outros vão assinar */
export function foundFormHtml(d: FoundDraft, c: FoundCheck, status: { name: string; ok: boolean }[] | null, leaderName: string): string {
  const req = reqList(c), ready = req.every((r) => r.ok); /* o nome e a sigla são conferidos no clique (o campo muda sem redesenhar a tela) */
  const sign = status ?? c.party.slice(0, 2).map((p) => ({ name: p.name, ok: false }));
  return `<div class="gfnd">
    <h4>Licença de Guilda de Karmika</h4>
    <p class="somut">O Prefeito Corvin Aldmar abre o Livro de Guildas de Lumenhal. Preencha, peça as assinaturas e os três assinam juntos.</p>
    <ul class="gfreq">${req.map((r) => `<li class="${r.ok ? 'ok' : ''}"><i>${r.ok ? '✔' : '✘'}</i><span>${r.html}</span></li>`).join('')}</ul>
    <div class="gfgrid">
      <div class="gfcol">
        <label>Nome da guilda <input data-v="gname" maxlength="28" placeholder="Ex.: Os Filhos do Vale" value="${esc(d.name)}"></label>
        <p class="gfwarn">⚠ O nome <b>nunca</b> muda depois de assinado. A bandeira e o ícone mudam quando o líder quiser.</p>
        <label>Sigla (2 a 4 letras) <input data-v="gtag" maxlength="4" placeholder="FDV" value="${esc(d.tag)}"></label>
        <div class="gflbl">Desenho da bandeira</div>
        <div class="gfpats">${FLAG_PATS.map((p) => `<button data-gpat="${p.id}" class="${d.flag.pat === p.id ? 'on' : ''}" title="${p.name}"><span style="background:${flagBg({ ...d.flag, pat: p.id })}"></span>${p.name}</button>`).join('')}</div>
        <div class="gfcols"><label>Cor do campo <input data-v="gc1" type="color" value="${d.flag.c1}"></label><label>Cor da peça <input data-v="gc2" type="color" value="${d.flag.c2}"></label></div>
        <div class="gflbl">Ícone</div>
        <div class="gficons">${GUILD_ICONS.map((i) => `<button data-gicon="${i}" class="${d.icon === i ? 'on' : ''}">${i}</button>`).join('')}</div>
      </div>
      <div class="gfdoc">${docHtml(d, leaderName, sign)}</div>
    </div>
    <div class="sorow">${status ? `<button class="ghost" disabled>⏳ Esperando as assinaturas…</button>` : `<button data-a="gpropose" class="gold" ${ready ? '' : 'disabled'} title="${ready ? '' : 'Falta cumprir os requisitos acima'}">✒ Pedir as assinaturas</button>`}<button data-a="gcancel" class="ghost">Agora não</button></div>
  </div>`;
}

/** o documento em si: o mesmo para o líder (com o estado das assinaturas) e para quem assina */
export function docHtml(d: { name: string; tag: string; flag: GFlag; icon: string }, leader: string, signers: { name: string; ok: boolean }[]): string {
  const day = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `<div class="gfpaper">
    ${bannerHtml(d.flag, d.icon, d.flag.c1, true)}
    <div class="gfdt">Livro de Guildas de Karmika</div>
    <div class="gfdn">${esc(d.name.trim() || 'Nome da guilda')} <em>[${esc(d.tag.trim().toUpperCase() || '—')}]</em></div>
    <p>Diante do Prefeito de Lumenhal, os abaixo-assinados fundam esta guilda e juram por ela. O nome fica escrito no Livro para sempre.</p>
    <div class="gfsig"><span>✒ ${esc(leader)}</span><small>líder · assina ao pedir</small></div>
    ${signers.map((s) => `<div class="gfsig ${s.ok ? 'ok' : ''}"><span>${s.ok ? '✒ ' + esc(s.name) : '…………………'}</span><small>${esc(s.name)} · ${s.ok ? 'assinou' : 'falta assinar'}</small></div>`).join('')}
    <div class="gfday">Lumenhal, ${day}</div>
  </div>`;
}

/** a tela de quem foi chamado a assinar */
export function signHtml(r: { name: string; tag: string; flag: GFlag; icon: string; leader: string; signers: string[] }, me: string): string {
  return `<div class="gfnd"><h4>Um documento para assinar</h4>
    <p class="somut"><b>${esc(r.leader)}</b> está fundando uma guilda e quer você entre os fundadores. Assinando, você entra nela como membro.</p>
    <div class="gfdoc solo">${docHtml(r, r.leader, r.signers.map((n) => ({ name: n, ok: false })))}</div>
    <div class="sorow"><button data-a="gsign" class="gold">✒ Assinar como ${esc(me)}</button><button data-a="gnosign" class="ghost">Recusar</button></div></div>`;
}

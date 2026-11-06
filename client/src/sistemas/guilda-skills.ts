/* 06/11 (Erling: "skills da guilda para irem abrindo conforme ela avança"): AS HABILIDADES DA GUILDA.
   A guilda ganha pontos a cada nível (I 2 · II 5 · III 8 · IV 11 · V 14) e o LÍDER escolhe onde pôr. Cada habilidade abre num nível e tem
   graus. As de corpo (vida, dano, armadura...) valem para todos os membros e entram nas contas do personagem pelo mesmo caminho dos
   talentos (main.ts → inventory.recalc). As de guilda (imposto, glória, missões, vagas) valem no servidor (desktop/src/guilda-nivel.cjs). */

export interface GSkill { id: string; name: string; icon: string; lvl: number; max: number; /** o que cada grau dá, em texto */ per: string; desc: string; /** stat do personagem (mesmas chaves dos talentos) e quanto por grau */ stat?: [string, number] }
export const GSKILLS: GSkill[] = [
  { id: 'estandarte', name: 'Estandarte Firme', icon: '🚩', lvl: 1, max: 3, per: '+2% de vida máxima', desc: 'Quem anda sob a mesma bandeira cai mais devagar.', stat: ['hp', 2] },
  { id: 'fogueira', name: 'Fogueira do Salão', icon: '🔥', lvl: 1, max: 3, per: '+0,3 de vida por segundo', desc: 'O calor do salão vai junto na estrada.', stat: ['regen', 0.3] },
  { id: 'dizimo', name: 'Dízimo Justo', icon: '⚖', lvl: 1, max: 3, per: '+15% de glória do dízimo', desc: 'O dízimo continua 4% do seu XP, mas rende mais glória para a guilda.' },
  { id: 'laminas', name: 'Lâminas Irmãs', icon: '⚔', lvl: 2, max: 3, per: '+2% de dano', desc: 'Treino no pátio da guilda, todo dia, até a mão doer.', stat: ['dmg', 2] },
  { id: 'prefeito', name: 'Amigos do Prefeito', icon: '🏛', lvl: 2, max: 3, per: '−10% no imposto do dia', desc: 'Corvin Aldmar gosta de quem paga em dia.' },
  { id: 'estrada', name: 'Estrada Conhecida', icon: '🥾', lvl: 2, max: 2, per: '+2% de velocidade', desc: 'Os membros trocam atalhos no chat.', stat: ['move', 2] },
  { id: 'muralha', name: 'Muralha de Escudos', icon: '🛡', lvl: 3, max: 3, per: '+15 de armadura', desc: 'Ombro com ombro, ninguém passa.', stat: ['arm', 15] },
  { id: 'olho', name: 'Olho do Caçador', icon: '🎯', lvl: 3, max: 3, per: '+1% de crítico', desc: 'A guilda aprende onde a fera é mole.', stat: ['crit', 1] },
  { id: 'mutirao', name: 'Mutirão', icon: '🤝', lvl: 3, max: 3, per: '+20% de avanço nas missões da guilda', desc: 'Cada mão conta mais quando todos puxam juntos.' },
  { id: 'quartel', name: 'Disciplina de Quartel', icon: '⏳', lvl: 4, max: 3, per: '−3% de recarga das habilidades', desc: 'Ordem, rotina e golpe na hora certa.', stat: ['cdr', 3] },
  { id: 'juramento', name: 'Juramento de Sangue', icon: '🩸', lvl: 4, max: 2, per: '+1% de roubo de vida', desc: 'O sangue derramado pela guilda volta para quem luta.', stat: ['leech', 1] },
  { id: 'sabedoria', name: 'Sabedoria dos Antigos', icon: '📜', lvl: 4, max: 3, per: '+3% de geração do recurso', desc: 'Os velhos da guilda ensinam a respirar no meio da luta.', stat: ['gen', 3] },
  { id: 'coracao', name: 'Coração da Vila', icon: '💛', lvl: 5, max: 3, per: '+3% de vida e +1% de dano', desc: 'A vila inteira reza por quem sai para lutar.', stat: ['hp', 3] },
  { id: 'lenda', name: 'Lenda Viva', icon: '👑', lvl: 5, max: 2, per: '+10 vagas na guilda', desc: 'Todo mundo quer entrar para a guilda das canções.' },
];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
const esc = (t: string) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/* o que a guilda do personagem dá ao corpo dele (atualizado quando chega a guilda do servidor) */
let cur: Record<string, number> = {};
export function setGuildSkills(s: Record<string, number> | null | undefined) { cur = { ...(s ?? {}) }; }
/** os bônus de corpo da guilda, nas chaves dos talentos (hp %, dmg %, arm, crit %, regen, move %, cdr %, leech %, gen %) */
export function guildStats(): Record<string, number> {
  const o: Record<string, number> = {};
  for (const s of GSKILLS) { const r = cur[s.id] ?? 0; if (!r || !s.stat) continue; o[s.stat[0]] = (o[s.stat[0]] ?? 0) + s.stat[1] * r; }
  const cz = cur.coracao ?? 0; if (cz) o.dmg = (o.dmg ?? 0) + cz; /* Coração da Vila também dá +1% de dano por grau */
  return o;
}

/** a aba Habilidades: os pontos livres, e cada habilidade com graus, nível que abre e o botão do líder */
export function skillsHtml(lvl: number, skills: Record<string, number>, points: number, leader: boolean): string {
  const rows = [1, 2, 3, 4, 5].map((L) => `<div class="gsk-tier ${L <= lvl ? 'on' : ''}"><div class="gsk-lv">${ROMAN[L]}<small>${L <= lvl ? 'aberto' : '🔒'}</small></div><div class="gsk-row">${GSKILLS.filter((s) => s.lvl === L).map((s) => { const r = skills[s.id] ?? 0, lock = L > lvl, full = r >= s.max;
    return `<div class="gsk ${lock ? 'lock' : ''} ${r ? 'has' : ''}" title="${esc(s.desc)}"><i>${s.icon}</i><div><b>${esc(s.name)}</b><small>${esc(s.per)} por grau</small><span class="gsk-pips">${Array.from({ length: s.max }, (_, k) => `<em class="${k < r ? 'on' : ''}"></em>`).join('')}</span></div>${leader && !lock && !full ? `<button data-gsk="${s.id}" data-gskn="${esc(s.name)}" ${points > 0 ? '' : 'disabled title="Sem pontos livres: suba o nível da guilda"'}>+1</button>` : full ? '<span class="gsk-max">máx.</span>' : ''}</div>`; }).join('')}</div></div>`).join('');
  return `<div class="gview"><div class="gsk-hd"><b>${points}</b> ponto${points === 1 ? '' : 's'} livre${points === 1 ? '' : 's'}<small>${leader ? 'Você é o líder: escolha onde pôr. Não dá para tirar depois.' : 'Só o líder distribui. Os bônus valem para todos os membros.'} Cada nível da guilda dá mais pontos (I 2 · II 5 · III 8 · IV 11 · V 14).</small></div>${rows}</div>`;
}

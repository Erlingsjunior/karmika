/* ---------- Posturas de batalha (Erling, 25/10): "no canto de cima da barra, do lado direito, onde hoje não tem nada: o Instinto e as
   posturas — tanque, ataque ou cura, usando com mais foco as magias do caminho escolhido, mudando a postura do personagem. Uma para cada
   caminho que já criamos, e elas vão abrindo com o tempo, conforme a classe evolui, em missões específicas de postura."
   - Cada caminho tem 3 posturas. A primeira vem com o caminho; as outras duas abrem em missões do mestre (níveis 33 e 37).
   - Quem ainda não escolheu caminho (humano, elfo, anão) tem as posturas do povo: Equilíbrio, e depois Guarda Alta, Mãos de Campo e
     Fúria Teimosa, ensinadas por gente da vila (níveis 8, 14 e 20).
   - Ao pegar a missão, a postura fica liberada para treino; ao entregar, é sua para sempre.
   - Trocar de postura leva 1 segundo de recarga e mostra a mudança no herói (anel, brilho e o nome sobre a cabeça). Tecla V troca para a próxima. ---------- */
import type { QuestDef } from './quests';
import type { PathId } from './vidente';

export type StanceRole = 'bal' | 'atk' | 'tank' | 'heal' | 'speed' | 'leech';
export interface StanceEff { dmg?: number; def?: number; heal?: number; regen?: number; move?: number; crit?: number; leech?: number }
export interface Stance { id: string; name: string; role: StanceRole; col: string; tip: string; eff: StanceEff; quest?: string }

const ROLE_EFF: Record<StanceRole, StanceEff> = {
  bal: {},
  atk: { dmg: 0.15, def: -0.08 },
  tank: { def: 0.22, dmg: -0.12 },
  heal: { heal: 0.35, regen: 1, dmg: -0.12 },
  speed: { move: 0.14, crit: 0.06, def: -0.06 },
  leech: { leech: 0.06, heal: 0.15, dmg: -0.05 },
};
export const ROLE_NAME: Record<StanceRole, string> = { bal: 'Equilíbrio', atk: 'Ataque', tank: 'Tanque', heal: 'Cura', speed: 'Velocidade', leech: 'Roubo de vida' };
const effTxt = (e: StanceEff) => [e.dmg ? `${e.dmg > 0 ? '+' : ''}${Math.round(e.dmg * 100)}% de dano` : '', e.def ? `${e.def > 0 ? '+' : ''}${Math.round(e.def * 100)}% de defesa` : '', e.heal ? `+${Math.round(e.heal * 100)}% de cura` : '', e.regen ? `vida volta ${e.regen + 1}× mais rápido` : '', e.move ? `+${Math.round(e.move * 100)}% de velocidade` : '', e.crit ? `+${Math.round(e.crit * 100)}% de crítico` : '', e.leech ? `+${Math.round(e.leech * 100)}% de roubo de vida` : ''].filter(Boolean).join(' · ') || 'sem bônus nem penalidade: o corpo pronto para tudo';

/** [id, nome, papel, cor, frase] — a primeira é a de entrada; as outras abrem nas missões */
type Row = [string, string, StanceRole, string, string];
const SETS: Record<PathId | 'povo', Row[]> = {
  povo: [['eq', 'Equilíbrio', 'bal', '#d8c8a0', 'Pés firmes, olhos abertos. Nem ataque nem defesa: o que vier.'],
    ['guarda', 'Guarda Alta', 'tank', '#8ab8e8', 'O escudo (ou o braço) sobe, o corpo fecha. Quem vem, apanha no ferro.'],
    ['campo', 'Mãos de Campo', 'heal', '#7aff9a', 'Respira fundo entre os golpes, aperta a atadura, segue de pé. Gente do campo não cai fácil.'],
    ['teimosa', 'Fúria Teimosa', 'atk', '#ff9a5a', 'Dentes cerrados e nada de recuar. Bate mais forte, apanha mais.']],
  gue: [['berserker', 'Berserker', 'atk', '#ff6a4a', 'O sangue esquenta e o machado pesa menos. Odin ama quem avança.'],
    ['guardiao', 'Guardião do Escudo', 'tank', '#9ad7ff', 'A muralha de escudos: ninguém passa enquanto você estiver de pé.'],
    ['skald', 'Skald', 'heal', '#ffe08a', 'O canto dos antigos fecha as feridas no meio da batalha.']],
  pal: [['vinganca', 'Vingança', 'atk', '#ffd24a', 'A luz que corta: cada golpe é um julgamento.'],
    ['bastiao', 'Bastião', 'tank', '#fff0c0', 'Fé feita de ferro. O paladino fica entre o mal e os inocentes.'],
    ['graca', 'Graça', 'heal', '#bfffd0', 'A mão que ergue a espada é a mesma que cura. Auréon não abandona os seus.']],
  tec: [['artilharia', 'Artilharia', 'atk', '#6ae0ff', 'Mira calibrada e baterias no máximo. A esfera ATACA: dispara, busca itens e ajuda no combate.'],
    ['blindagem', 'Blindagem', 'tank', '#9aa4b4', 'Placas travadas. A esfera DEFENDE: fica colada em você, joga gás curativo em você e, à toa, refaz uma casca de escudos em volta. Não ataca.'],
    ['engenharia', 'Engenharia de Campo', 'heal', '#7affd0', 'Auxílio de grupo. A esfera joga gás curativo em quem estiver perto, leva as torres até a marca e pega itens. Não ataca.']],
  vam: [['cacada', 'Caçada Noturna', 'speed', '#c84a6a', 'Rápido como a sombra que ninguém vê chegar.'],
    ['sangueantigo', 'Sangue Antigo', 'leech', '#8a0a1a', 'Cada ferida aberta é um gole. O Conde ensinou a beber sem pressa.'],
    ['furiarubra', 'Fúria Rubra', 'atk', '#ff3a4a', 'A sede vence a razão. Bate como um animal faminto.']],
  lob: [['furialua', 'Fúria da Lua', 'atk', '#ff8a4a', 'A besta à flor da pele: garras e dentes primeiro.'],
    ['pelevelha', 'Pele Velha', 'tank', '#a08060', 'O couro grosso dos anciões da matilha: aguenta o que vier.'],
    ['matilha', 'Matilha', 'heal', '#c8e8a0', 'Lamber as feridas entre um bote e outro. A matilha cuida de si.']],
  cac: [['prata', 'Prata', 'atk', '#e8f0ff', 'Lâmina de prata e ódio frio contra o que não devia existir.'],
    ['emboscada', 'Emboscada', 'speed', '#8ad0a0', 'Pés leves, olho na presa: o caçador escolhe quando aparecer.'],
    ['vigilia', 'Vigília', 'tank', '#b0b8c8', 'A noite inteira de pé, a besta inteira em cima. O caçador não cai.']],
  mag: [['tempestade', 'Tempestade', 'atk', '#8ab0ff', 'O ar cheira a raio. Tudo o que você lança pesa mais.'],
    ['egide', 'Égide', 'tank', '#c8d8ff', 'Um véu de força em volta do corpo: o mago também sabe aguentar.'],
    ['fonte', 'Fonte', 'heal', '#9affea', 'A magia volta para dentro e fecha o que o mundo abriu.']],
  bru: [['praga', 'Praga', 'atk', '#9aff4a', 'O pacto cobra caro, mas o que ele dá queima.'],
    ['pactosangue', 'Pacto de Sangue', 'leech', '#a01a3a', 'O que o inimigo perde, você ganha. É só um negócio.'],
    ['circulo', 'Círculo de Proteção', 'tank', '#b08ae8', 'O círculo de sal e sombra que nenhum golpe atravessa inteiro.']],
};
const MENTOR: Record<PathId, string> = { gue: 'Thorgrim Mão-de-Ferro', pal: 'Grão-Mestre Cassius', cac: 'Mestra Ilsa Van Rhal', tec: 'Arquiteta Ylva', vam: 'Conde Vladislav III', lob: 'Ulfrun, a Mãe-Alfa', mag: 'Arquimago Aurelian Vesk', bru: 'Malgrath, Senhor dos Pactos' };
/** quem ensina as posturas do povo, e em que nível */
const POVO_TEACH: Record<string, [string, number, string[]]> = {
  guarda: ['Garrick', 8, ['Você bate bem. Agora aprenda a apanhar.', 'Levante o braço, feche o corpo, deixe o golpe morrer no ferro. Guarda Alta.', 'Lute assim até isso virar costume. Volte quando o braço doer menos.']],
  campo: ['Morwen', 14, ['Ninguém lá fora vai te curar. Então aprenda a se curar no meio da briga.', 'Respire entre um golpe e outro. Aperte a atadura sem parar de olhar o bicho. Mãos de Campo.', 'Lute assim e volte para me mostrar que ainda está inteiro.']],
  teimosa: ['Garrick', 20, ['Tem hora que defender não adianta. Tem hora que é você ou ele.', 'Dentes cerrados, nada de recuar. Fúria Teimosa. Você bate mais forte e apanha mais, então escolha bem a hora.', 'Vá. Lute assim até entender o preço.']],
};

function mk(set: PathId | 'povo'): Stance[] {
  return SETS[set].map(([id, name, role, col, line], i) => ({ id: `${set}_${id}`, name, role, col, eff: ROLE_EFF[role], tip: `${line}\n${ROLE_NAME[role]}: ${effTxt(ROLE_EFF[role])}`, quest: i === 0 ? undefined : `st_${set}_${id}` }));
}
export const STANCES: Record<PathId | 'povo', Stance[]> = Object.fromEntries((Object.keys(SETS) as (PathId | 'povo')[]).map((k) => [k, mk(k)])) as Record<PathId | 'povo', Stance[]>;

/** as missões que ensinam cada postura (entram no mesmo diário; são azuis) */
export const STANCE_QUESTS: QuestDef[] = (() => {
  const out: QuestDef[] = [];
  for (const [set, list] of Object.entries(STANCES) as [PathId | 'povo', Stance[]][]) list.forEach((s, i) => {
    if (!s.quest) return; const short = s.id.slice(set.length + 1);
    if (set === 'povo') { const [giver, lvl, talk] = POVO_TEACH[short]; out.push({ id: s.quest, chain: 'Posturas', name: `Postura: ${s.name}`, lvl, giver, xp: 0, gold: 15 + lvl * 2, text: `${giver} ensina a postura ${s.name}. Escolha-a na barra de posturas (acima das magias, à direita, ou tecla V) e vença ${6 + lvl / 2 | 0} inimigos lutando assim.`, objs: [{ kind: 'stance', id: s.id, name: s.name, n: 6 + (lvl / 2 | 0) }], talk, done: ['Isso. Agora é seu. Ninguém tira.'] }); return; }
    const lvl = i === 1 ? 33 : 37, m = MENTOR[set as PathId];
    out.push({ id: s.quest, chain: 'Posturas', name: `Postura: ${s.name}`, lvl, giver: m, req: `v_${set}`, xp: 0, gold: 60 + lvl * 3, gear: 1, text: `${m} ensina a postura ${s.name}. Escolha-a na barra de posturas (acima das magias, à direita, ou tecla V) e vença ${i === 1 ? 15 : 20} inimigos lutando assim.`, objs: [{ kind: 'stance', id: s.id, name: s.name, n: i === 1 ? 15 : 20 }],
      talk: [s.tip.split('\n')[0], `Isto se chama ${s.name}. Não se aprende ouvindo: aprende-se lutando.`, 'Vá. Volte quando o corpo souber sozinho.'], done: [`O corpo já sabe. A ${s.name} é sua.`] });
  });
  return out;
})();

export interface StanceCtx { path(): PathId | null; isDone(qid: string): boolean; isActive(qid: string): boolean; apply(e: StanceEff): void; onChange(s: Stance, first: boolean): void; log(t: string, c?: string): void }
export function createStances(ctx: StanceCtx) {
  let cur: string | null = null; try { cur = localStorage.getItem('karmika.stance'); } catch { /* */ }
  let cdUntil = 0;
  const setKey = (): PathId | 'povo' => ctx.path() ?? 'povo';
  const list = () => STANCES[setKey()];
  /** liberada: a primeira do caminho, as que já foram entregues, e a da missão que você está fazendo (treino) */
  const open = (s: Stance) => !s.quest || ctx.isDone(s.quest) || ctx.isActive(s.quest);
  function current(): Stance { const L = list(); const s = L.find((x) => x.id === cur && open(x)); return s ?? L[0]; }
  let applied = '';
  function sync() { const s = current(); if (s.id !== applied) { const first = applied === ''; applied = s.id; ctx.apply(s.eff); if (!first) ctx.onChange(s, false); } }
  function pick(id: string): boolean { const s = list().find((x) => x.id === id); if (!s) return false;
    if (!open(s)) { ctx.log(`🔒 ${s.name}: ${s.quest ? 'abre numa missão de postura' : ''}.`, '#c8b890'); return false; }
    if (performance.now() < cdUntil) return false; if (current().id === s.id) return false;
    cdUntil = performance.now() + 1000; cur = s.id; try { localStorage.setItem('karmika.stance', cur); } catch { /* */ } sync(); return true; }
  function cycle() { const L = list().filter(open); if (L.length < 2) { ctx.log('Você só conhece uma postura por enquanto. As outras se aprendem em missões.', '#c8b890'); return; } const i = L.findIndex((x) => x.id === current().id); pick(L[(i + 1) % L.length].id); }
  return { list, open, current, pick, cycle, sync, setKey };
}

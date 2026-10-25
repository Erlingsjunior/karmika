/* ---------- Eventos vivos (Erling, 24/10: "eventos vivos no mapa: regionais e globais; coisas acontecendo que deixam o mundo vivo").
   Cada região do mapa, de tempos em tempos (o relógio de verdade decide, então todo mundo vê o mesmo), ganha um acontecimento:
   uma patrulha atacada por lobisomens na lua cheia, um círculo de bruxos e paladinos negros invocando sobre uma vila, uma procissão
   da Luz purificando um lugar de karma ruim, caçadores malditos acabando com a mata, uma festa sendo preparada, um casamento sem padre,
   uma vila sitiada. Quem passa perto vê o símbolo no mapa e no minimapa; lá sempre tem alguém (o arauto) que conta a história e pergunta
   de que lado você fica. Aceitou: o evento passa a valer para você (os do outro lado viram seus inimigos, os do seu lado seus aliados).
   Não aceitou: você só vê o movimento e passa reto — ninguém de lá te ataca.
   Dura até 15 minutos. No fim (ou quando se decide antes) chega a RESPOSTA KÁRMICA: o que você fez, de que lado, quanto pesou, e o XP
   de ter lutado. Os globais (Lua de Sangue, Romaria de Auréon) mudam o mundo inteiro por um tempo. ---------- */
import * as THREE from 'three';
import { createCharacter, type Hero3D, type Kind } from './characters';
import { fine } from './dual3d';
import { std, plankTex, woodTex } from './toon3d';
import type { EnemyType } from './world';
import type { Step, Reply } from './dialog';
import type { Foe } from './enemies';

const T = 2;
export type EvSide = 'A' | 'B';
type V2 = { x: number; y: number };
/** um bicho/gente do evento (é um inimigo do enemies.ts com alguns campos a mais) */
interface Unit { alive: boolean; pos: THREE.Vector3; hp: number; hpMax: number; home: THREE.Vector2; state: string; t: number; def: { aggro: number; name: string; passive?: boolean }; ally?: boolean; foe?: Foe; evFac?: EvSide; type: EnemyType }
interface Site { x: number; y: number; name: string; region: number }
interface Look { name: string; role: string; kind: Kind; civil?: 'human' | 'elf'; tint: number; weapon?: string; shield?: string }
type Prop = 'crate' | 'music' | 'fireworks' | 'lantern' | 'pillar' | 'altar' | 'barrel' | 'chest' | 'gifts' | 'trap';
interface Task { id: string; label: string; kind: 'device' | 'deliver'; prop?: Prop; at?: [number, number][]; item?: string; n: number; channel?: number;
  /** quem pode fazer (ex.: só tecnocrata monta a máquina) */ need?: (c: EvCtx) => boolean; needTxt?: string; done?: string; after?: Prop; /** só aparece com o Instinto ligado */ hidden?: boolean }
interface SideDef { label: string; lean: 'luz' | 'sombra'; karma: number; kills: number; tasks?: Task[]; gate?: (c: EvCtx) => boolean; win: string; lose: string; flag: string }
interface Wave { at: number; fac: EvSide; units: [EnemyType, number, string?][]; from?: number }
interface Tpl {
  id: string; name: string; icon: string; site: 'village' | 'road' | 'forest'; when?: 'night' | 'day'; weight: number; color: string;
  herald: Look; intro: (s: Site, c: EvCtx) => Step[];
  /** falas de quem está no evento, em balões, de tempos em tempos */ chatter?: string[];
  facs?: { A: string; B: string }; waves?: Wave[]; sides: Partial<Record<EvSide, SideDef>>;
  /** medidor do evento (ritual, purificação…) */ meter?: { label: string; rate: number; side: EvSide; /** quem faz o medidor andar */ by: EvSide };
  /** gente sem luta que deixa o lugar vivo (aldeões, noivos, convidados, procissão) */ extras?: Look[]; path?: boolean;
  finale?: 'fireworks' | 'petals' | 'holy' | 'dark';
}
export interface EvResult { name: string; icon: string; side: string; lean: 'luz' | 'sombra'; won: boolean; karma: number; xp: number; gold: number; lines: string[]; flag?: string; kills: number }
export interface EvCtx {
  scene: THREE.Scene; heightAt(x: number, z: number): number; hero(): THREE.Vector3; inside(): boolean; lvl(): number; night(): number;
  path(): string | null; elf(): boolean; /** o Instinto de classe está ligado */ instinct(): boolean; lean(): 'luz' | 'sombra' | null; xpNeedAt(l: number): number;
  spawn(type: EnemyType, x: number, z: number, o: { name?: string; lvl: number; tag: string; aggro: number; hpMul: number }): Unit;
  clearTag(tag: string): void; hurtBy(e: Unit, n: number, from: THREE.Vector3): void;
  region(tx: number, ty: number): { id: number; name: string; lo: number; hi: number };
  fx(kind: 'firework' | 'petal' | 'holy' | 'dark' | 'smoke', x: number, y: number, z: number): void;
  bubble(x: number, y: number, z: number, t: string): void; log(t: string, c?: string): void;
  project(p: THREE.Vector3): { x: number; y: number } | null;
  converse(o: { name: string; role: string; title: string; steps: Step[]; onPick(r: Reply | null): void }): void;
  count(item: string): number; take(item: string, n: number): boolean; act(a: string): void; result(r: EvResult): void;
}

/* ================= os acontecimentos ================= */
const PICK = (r: string[]) => r[Math.floor(Math.random() * r.length)];
const TPL: Tpl[] = [
  { id: 'patrulha', name: 'Patrulha sob a Lua Cheia', icon: '🐺', site: 'road', when: 'night', weight: 3, color: '#ff8a5a', path: true,
    herald: { name: 'Sargento Bjarne', role: 'Patrulha das Estradas', kind: 'nordic', tint: 0x5a6a8a, weapon: 'Espada Longa', shield: 'Escudo Nórdico' },
    facs: { A: 'Patrulha das Estradas', B: 'Matilha da Lua' },
    waves: [{ at: 0, fac: 'A', units: [['soldier', 3]] }, { at: 0, fac: 'B', units: [['werewolf', 2, 'Lobisomem da Lua Cheia']], from: 18 }, { at: 150, fac: 'B', units: [['werewolf', 2, 'Lobisomem da Lua Cheia']], from: 22 }, { at: 330, fac: 'A', units: [['soldier', 2]] }, { at: 420, fac: 'B', units: [['werewolf', 3, 'Lobisomem da Lua Cheia']], from: 22 }],
    chatter: ['Formação! Escudos para fora!', 'Eles vêm pela mata!', 'Não deixem ninguém sozinho!', 'Auuuuu!'],
    intro: (s) => [
      `Você aí! Viajante! Estamos patrulhando a estrada perto de ${s.name} e a lua subiu cheia demais.`,
      'Eu ouvi uivo de três lados. Não é lobo comum. Lobo comum não anda em pé.',
      { r: [
        { t: 'Fico com vocês. Ninguém cai nesta estrada hoje.', a: 'Então fique perto dos escudos. E mire no peito, que a cabeça deles é dura.', flag: 'ev:A' },
        { t: '(Você sente a lua no sangue.) A matilha está me chamando.', a: '…Você não é viajante coisa nenhuma. Homens! ESCUDOS!', flag: 'ev:B', need: undefined },
        { t: 'Não é a minha briga.', a: 'Então saia da estrada. E reze para eles não sentirem o seu cheiro.', flag: 'ev:none' } ] },
    ],
    sides: {
      A: { label: 'Defender a patrulha', lean: 'luz', karma: 6, kills: 4, win: 'A patrulha voltou inteira para o quartel. O sargento contou o seu nome no relatório.', lose: 'A patrulha caiu na estrada. Os escudos ficaram no chão até o amanhecer.', flag: 'ev_patrulha_salva' },
      B: { label: 'Correr com a matilha', lean: 'sombra', karma: -7, kills: 3, gate: (c) => c.path() === 'lob' || c.lean() === 'sombra', win: 'A matilha uivou o seu nome. Na estrada ficaram escudos, e um silêncio.', lose: 'A patrulha resistiu. Os uivos sumiram na mata, menos um.', flag: 'ev_patrulha_caiu' } } },

  { id: 'ritual', name: 'O Círculo de Invocação', icon: '🜏', site: 'village', when: 'night', weight: 2, color: '#b06aff',
    herald: { name: 'Irmã Odila', role: 'Guardiã da Capela', kind: 'nordic', civil: 'human', tint: 0xd8c89a },
    facs: { A: 'Guarda e fiéis', B: 'O Círculo' },
    waves: [{ at: 0, fac: 'B', units: [['cultist', 2], ['darkpal', 1], ['vampire', 1]], from: 12 }, { at: 0, fac: 'A', units: [['soldier', 2, 'Guarda da Vila']] }, { at: 240, fac: 'B', units: [['cultist', 1], ['vampire', 2]], from: 20 }, { at: 400, fac: 'A', units: [['templar', 2]] }],
    meter: { label: 'Invocação', rate: 1 / 600, side: 'B', by: 'B' },
    chatter: ['Ab inferis, karma nostrum…', 'O sangue da vila é nosso!', 'Pela Corte!', 'Não deixem que acendam os pilares!'],
    intro: (s) => [
      `Graças ao Olho, alguém de fora! Olhe ali, no meio de ${s.name}.`,
      'Bruxos do Vale, crias do Conde e um paladino negro. Acenderam três pilares e cantam desde o pôr do sol. Querem virar o karma da vila do avesso: quando a invocação fechar, aqui só vai nascer desgraça por uma geração.',
      'Os guardas não dão conta sozinhos. Se alguém derrubar os pilares, o círculo se desfaz.',
      { r: [
        { t: 'Vou derrubar os pilares. A vila não paga pelo que não fez.', a: 'Que o Olho veja você. Os pilares primeiro, os bruxos depois!', flag: 'ev:A' },
        { t: '(Você se aproxima do círculo.) O que eles oferecem a quem ajudar?', a: '…Você está falando sério? Guardas! Esse aí é deles!', flag: 'ev:B' },
        { t: 'Melhor não me meter.', a: 'Então reze. Rezar também ajuda, dizem.', flag: 'ev:none' } ] },
    ],
    sides: {
      A: { label: 'Romper o círculo', lean: 'luz', karma: 8, kills: 3, tasks: [{ id: 'pilares', label: 'Derrubar os pilares do círculo', kind: 'device', prop: 'pillar', at: [[-5, -2], [4, -4], [1, 5]], n: 3, channel: 3, done: 'O pilar racha e a luz roxa se apaga.' }],
        win: 'O círculo se desfez. Ao amanhecer, as crianças de {vila} brincaram na praça como se nada fosse. A Irmã Odila acendeu uma vela com o seu nome.', lose: 'A invocação fechou. {vila} acordou mais cinza, e ninguém lembra por quê.', flag: 'ev_ritual_rompido' },
      B: { label: 'Proteger a invocação', lean: 'sombra', karma: -9, kills: 3, gate: (c) => c.lean() === 'sombra' || ['bru', 'vam'].includes(c.path() ?? ''), win: 'A invocação fechou com o seu sangue no círculo. {vila} vai pagar por uma geração. O Vale lembra de quem ajudou.', lose: 'Os pilares caíram. O círculo fugiu pela mata e deixou você para trás.', flag: 'ev_ritual_fechado' } },
    finale: 'dark' },

  { id: 'procissao', name: 'A Romaria da Aurora', icon: '☀', site: 'village', weight: 2, color: '#ffe08a', path: true,
    herald: { name: 'Frei Anselmo', role: 'Romaria de Auréon', kind: 'nordic', civil: 'human', tint: 0xf0e6c8 },
    facs: { A: 'Romaria de Auréon', B: 'Os Corrompidos' },
    waves: [{ at: 0, fac: 'A', units: [['templar', 2], ['pilgrim', 2]] }, { at: 60, fac: 'B', units: [['ghoul', 2], ['zombie', 1]], from: 20 }, { at: 260, fac: 'B', units: [['darkpal', 1], ['ghoul', 2]], from: 22 }, { at: 460, fac: 'B', units: [['zombie', 3]], from: 22 }],
    meter: { label: 'Purificação', rate: 1 / 540, side: 'A', by: 'A' },
    chatter: ['Auréon, acende o que se apagou.', 'Passo a passo. Ninguém fica para trás.', 'Lá vêm eles! Protejam o estandarte!', 'Que a aurora lave esta terra.'],
    intro: (s) => [
      `A paz de Auréon, caminhante. Somos a Romaria da Aurora: paladinos, magos do Pináculo, elfos de Lithendel e gente simples de fé.`,
      `O karma de ${s.name} está podre. Morte demais, mentira demais. Vamos atravessar a vila de ponta a ponta, rezando, até a terra respirar.`,
      'Os mortos não gostam de reza. Eles vão vir.',
      { r: [
        { t: 'Caminho com vocês. Ninguém toca no estandarte.', a: 'Que a aurora te encontre de pé.', flag: 'ev:A' },
        { t: 'Romeiros andando no escuro… alvo fácil. (Atacar a romaria.)', a: 'Então você é um dos corrompidos. Irmãos, escudos!', flag: 'ev:B' },
        { t: 'Boa caminhada. Eu sigo o meu caminho.', a: 'Que o seu caminho também ache a aurora.', flag: 'ev:none' } ] },
    ],
    sides: {
      A: { label: 'Escoltar a romaria', lean: 'luz', karma: 7, kills: 4, win: 'A romaria chegou ao fim da vila cantando. Dizem que em {vila} o poço voltou a dar água doce.', lose: 'A romaria se dispersou. O estandarte ficou no barro.', flag: 'ev_romaria' },
      B: { label: 'Atacar a romaria', lean: 'sombra', karma: -8, kills: 3, gate: (c) => c.lean() === 'sombra' || ['bru', 'vam', 'lob'].includes(c.path() ?? ''), win: 'A romaria não chegou ao fim. {vila} continua escura, e você ajudou a apagar.', lose: 'A romaria passou por cima de você, cantando.', flag: 'ev_romaria_atacada' } },
    finale: 'holy' },

  { id: 'cacadores', name: 'Caçadores Malditos', icon: '🏹', site: 'forest', weight: 2, color: '#9ad07a',
    herald: { name: 'Lenna das Folhas', role: 'Guardiã da Mata', kind: 'nordic', civil: 'elf', tint: 0x4a7a4a },
    facs: { A: 'A Mata', B: 'Caçadores Malditos' },
    waves: [{ at: 0, fac: 'A', units: [['deer', 6, 'Cervo da Mata']] }, { at: 0, fac: 'B', units: [['hunter', 3]], from: 14 }, { at: 300, fac: 'B', units: [['hunter', 2]], from: 18 }, { at: 200, fac: 'A', units: [['deer', 3, 'Cervo da Mata']] }],
    chatter: ['Mais um! Couro bom!', 'A mata é grande, ninguém vai sentir falta.', 'Ali, no meio das samambaias!'],
    intro: (s) => [
      'Shhh. Escute. Não tem passarinho. A mata só fica assim quando alguém mata mais do que come.',
      'E não são só as flechas. Eles enterraram armadilhas de ferro debaixo das folhas. Ninguém vê. Só quem sente a mata, quem liga o instinto, acha.',
      `Caçadores de fora, perto de ${s.name}. Pagos por um curtidor de Askavik. Matam corça prenhe, filhote, tudo. Em um mês não sobra cervo nesta mata.`,
      { r: [
        { t: 'Eu caço quem caça demais.', a: 'A mata agradece. Eles se escondem nas samambaias: siga o barulho de arco.', flag: 'ev:A' },
        { t: 'Couro bom é couro bom. (Caçar com eles.)', a: '…A mata vai lembrar do seu cheiro. E não vai ser com carinho.', flag: 'ev:B' },
        { t: 'Não tenho nada com isso.', a: 'Tem. Todo mundo tem. Só que alguns demoram a saber.', flag: 'ev:none' } ] },
    ],
    sides: {
      A: { label: 'Defender a mata', lean: 'luz', karma: 6, kills: 4, tasks: [{ id: 'armadilhas', label: 'Desarmar as armadilhas escondidas (Instinto ligado)', kind: 'device', prop: 'trap', hidden: true, at: [[-9, 6], [8, 8], [2, -10]], n: 3, channel: 2, done: 'Clac. A mandíbula de ferro fecha no vazio.' }], win: 'Os caçadores fugiram sem o couro. Na primavera, a mata perto de {vila} teve filhotes de novo. Os elfos dizem que a floresta guarda o seu nome.', lose: 'Os caçadores levaram o que quiseram. A mata ficou muda.', flag: 'ev_mata_defendida' },
      B: { label: 'Caçar com os malditos', lean: 'sombra', karma: -6, kills: 4, win: 'Você encheu a bolsa de couro. A mata perto de {vila} vai demorar anos para cantar de novo.', lose: 'A guardiã da mata espantou a caça. Você saiu com as mãos vazias e o nome sujo.', flag: 'ev_mata_cacada' } } },

  { id: 'festa', name: 'Preparativos da Festa', icon: '🎉', site: 'village', when: 'day', weight: 2, color: '#ffd24a',
    herald: { name: 'Dona Hilde', role: 'Organizadora da Festa', kind: 'nordic', civil: 'human', tint: 0xc86a4a },
    extras: [{ name: 'Aldeão', role: 'festa', kind: 'nordic', civil: 'human', tint: 0x8a6a4a }, { name: 'Aldeã', role: 'festa', kind: 'nordic', civil: 'human', tint: 0x6a8a5a }, { name: 'Menino', role: 'festa', kind: 'nordic', civil: 'human', tint: 0x4a6a9a }],
    chatter: ['Mais uma tábua aqui!', 'Quem sabe montar essas caixas da Academia?', 'Vai ter dança até de manhã!', 'Cadê a pedra do palco?'],
    intro: (s) => [
      `Ai, que bom, mais duas mãos! Hoje à noite é a festa da colheita de ${s.name} e está tudo atrasado.`,
      'Falta madeira para o palco, pedra para a fogueira grande, lanterna para pendurar… e a Academia mandou umas caixas com uma máquina de música e fogos que tocam e explodem sozinhos. Só que ninguém aqui sabe montar!',
      { r: [
        { t: 'Conte comigo. Do que a senhora precisa primeiro?', a: 'Madeira e pedra! E se você souber montar engenhoca, as caixas estão ali no canto.', flag: 'ev:A' },
        { t: '(Você olha para o barril de hidromel da festa.) Posso… ajudar a vigiar o barril.', a: 'Ah, que gentileza! Fica ali do lado mesmo.', flag: 'ev:B' },
        { t: 'Hoje não posso, senhora.', a: 'Passe à noite, então! Festa boa tem gente de fora.', flag: 'ev:none' } ] },
    ],
    sides: {
      A: { label: 'Ajudar a preparar a festa', lean: 'luz', karma: 4, kills: 0, tasks: [
        { id: 'madeira', label: 'Levar madeira para o palco', kind: 'deliver', item: 'wood', n: 6 },
        { id: 'pedra', label: 'Levar pedras para a fogueira', kind: 'deliver', item: 'stone', n: 4 },
        { id: 'lanternas', label: 'Pendurar as lanternas', kind: 'device', prop: 'lantern', at: [[-6, 3], [6, 3], [0, -6]], n: 3, channel: 2, done: 'A lanterna acende, amarelinha.' },
        { id: 'maquina', label: 'Montar a máquina de música (tecnocrata)', kind: 'device', prop: 'crate', after: 'music', at: [[4, -3]], n: 1, channel: 4, need: (c) => c.path() === 'tec', needTxt: 'Só quem estudou na Academia sabe montar isso.', done: 'A máquina tosse vapor e começa a tocar uma valsa torta. As crianças correm para dançar.' },
        { id: 'fogos', label: 'Armar os fogos automáticos (tecnocrata)', kind: 'device', prop: 'crate', after: 'fireworks', at: [[-4, -4]], n: 1, channel: 4, need: (c) => c.path() === 'tec', needTxt: 'Os fogos da Academia explodem na mão de quem não sabe.', done: 'Os tubos apontam para o céu, com o pavio de relógio armado.' } ],
        win: 'A festa de {vila} foi a melhor em anos. {fogos}Dona Hilde guardou para você o primeiro pedaço do bolo de mel.', lose: 'A festa aconteceu meio torta, sem palco e sem música. Ainda assim, dançaram.', flag: 'ev_festa' },
      B: { label: 'Roubar o hidromel da festa', lean: 'sombra', karma: -3, kills: 0, tasks: [{ id: 'barril', label: 'Levar o barril de hidromel sem ninguém ver', kind: 'device', prop: 'barrel', at: [[5, 5]], n: 1, channel: 5, done: 'O barril é seu. A festa vai ser seca.' }],
        win: 'A festa de {vila} ficou sem hidromel. Dona Hilde chorou atrás da barraca. Você vendeu o barril em outra vila.', lose: 'Alguém viu você perto do barril. Melhor não voltar a {vila} tão cedo.', flag: 'ev_festa_roubada' } },
    finale: 'fireworks' },

  { id: 'casamento', name: 'O Casamento Sem Padre', icon: '💍', site: 'village', when: 'day', weight: 2, color: '#ffb0d0',
    herald: { name: 'Mãe da Noiva', role: 'Casamento em festa', kind: 'nordic', civil: 'human', tint: 0x9a5a7a },
    extras: [{ name: 'Ingrid, a noiva', role: 'noiva', kind: 'nordic', civil: 'human', tint: 0xf4ecd8 }, { name: 'Tomas, o noivo', role: 'noivo', kind: 'nordic', civil: 'human', tint: 0x3a3a4a }, { name: 'Convidado', role: 'convidado', kind: 'nordic', civil: 'human', tint: 0x6a4a3a }, { name: 'Convidada', role: 'convidada', kind: 'nordic', civil: 'elf', tint: 0x6a8aa0 }],
    facs: { A: 'Convidados', B: 'Salteadores' },
    waves: [{ at: 0, fac: 'B', units: [['hunter', 3, 'Salteador da Estrada']], from: 26 }],
    chatter: ['Cadê o padre?!', 'O bolo vai derreter…', 'Ingrid, não chora, estraga a pintura!', 'Dizem que salteadores levaram o padre na estrada.'],
    intro: (s, c) => [
      `Ai, meu Olho, um rosto novo! Você não viu um padre por aí? Baixinho, careca, de batina marrom?`,
      `A minha Ingrid casa hoje em ${s.name}. Está tudo pronto: flores, bolo, o noivo suando. E o padre sumiu na estrada! Dizem que salteadores pegaram ele.`,
      ...((c.path() === 'pal' || c.path() === 'mag' || c.elf()) ? ['…Espera. Você é ' + (c.path() === 'pal' ? 'paladino' : c.path() === 'mag' ? 'mago do Pináculo' : 'elfo') + '? Vocês podem casar gente, não podem?'] as Step[] : []),
      { r: [
        ...((c.path() === 'pal' || c.path() === 'mag' || c.elf()) ? [{ t: 'Posso, sim. Eu caso os dois.', a: 'AI, OLHO! Ingrid! Tomas! Arrumem-se!', flag: 'ev:A:celebrar' }] : []),
        { t: 'Vou buscar o padre. Salteador nenhum estraga um casamento.', a: 'Eles foram para a mata, do outro lado da vila. Traga ele inteiro, por favor!', flag: 'ev:A' },
        { t: '(Você olha para a mesa dos presentes.) Que mesa bonita…', a: 'Não é? Toda a vila trouxe alguma coisa. Fique à vontade!', flag: 'ev:B' },
        { t: 'Que dê tudo certo. Tenho pressa.', a: 'Ah. Tá. Obrigada mesmo assim…', flag: 'ev:none' } ] },
    ],
    sides: {
      A: { label: 'Salvar o casamento', lean: 'luz', karma: 5, kills: 3, tasks: [{ id: 'altar', label: 'Celebrar o casamento no altar', kind: 'device', prop: 'altar', at: [[0, -4]], n: 1, channel: 4, done: 'Os noivos dizem sim. A vila inteira grita.' }],
        win: 'Ingrid e Tomas se casaram debaixo do arco de flores. {vila} vai contar por anos do dia em que um estranho salvou o casamento.', lose: 'Não houve casamento hoje. O bolo foi dividido em silêncio.', flag: 'ev_casamento' },
      B: { label: 'Roubar os presentes', lean: 'sombra', karma: -5, kills: 0, tasks: [{ id: 'presentes', label: 'Esvaziar a mesa de presentes', kind: 'device', prop: 'gifts', at: [[5, -1]], n: 1, channel: 4, done: 'Prata, linho, um relógio de bolso. Tudo seu.' }],
        win: 'Os noivos casaram sem um presente sequer. A mãe da noiva jura que vai descobrir quem foi.', lose: 'Alguém gritou "ladrão!" e você saiu correndo de mãos vazias.', flag: 'ev_casamento_roubado' } },
    finale: 'petals' },

  { id: 'sitio', name: 'Vila Sitiada', icon: '⚔', site: 'village', weight: 2, color: '#ff6a5a',
    herald: { name: 'Capitã Runa', role: 'Guarda da Vila', kind: 'nordic', tint: 0x6a5a4a, weapon: 'Espada Longa', shield: 'Escudo Redondo' },
    facs: { A: 'Guarda da Vila', B: 'Os Invasores' },
    waves: [{ at: 0, fac: 'A', units: [['soldier', 3, 'Guarda da Vila']] }, { at: 20, fac: 'B', units: [['ghoul', 2], ['skeleton', 2]], from: 24 }, { at: 200, fac: 'B', units: [['werewolf', 1], ['ghoul', 2]], from: 24 }, { at: 380, fac: 'B', units: [['skeleton', 3], ['darkpal', 1]], from: 24 }],
    chatter: ['Fechem as portas!', 'Eles vêm pelo campo!', 'Segurem a praça!', 'Ninguém foge, ninguém!'],
    intro: (s) => [
      `Você sabe usar isso aí? Ótimo. ${s.name} vai ser atacada. Os batedores viram mortos e lobos descendo do morro.`,
      'Tenho três guardas e uma vila cheia de gente. Preciso de mais um braço na praça.',
      { r: [
        { t: 'Conte comigo, capitã.', a: 'Fique na praça. Quando eles chegarem, não recue.', flag: 'ev:A' },
        { t: 'No meio da confusão, ninguém vai notar umas casas vazias…', a: 'O que você disse? …Guardas, de olho nesse aí!', flag: 'ev:B' },
        { t: 'Boa sorte, capitã.', a: 'Sorte é para quem tem tempo.', flag: 'ev:none' } ] },
    ],
    sides: {
      A: { label: 'Defender a vila', lean: 'luz', karma: 6, kills: 5, win: '{vila} resistiu. A capitã Runa mandou gravar o seu nome na pedra da praça, embaixo do dos guardas.', lose: '{vila} queimou em parte. Os guardas fizeram o que puderam.', flag: 'ev_vila_defendida' },
      B: { label: 'Saquear as casas', lean: 'sombra', karma: -7, kills: 0, tasks: [{ id: 'baus', label: 'Esvaziar os baús das casas', kind: 'device', prop: 'chest', at: [[-7, 4], [7, -5], [3, 8]], n: 3, channel: 3, done: 'Moedas, prata, um anel de família.' }],
        win: 'Enquanto {vila} lutava pela vida, você esvaziou as casas. Os aldeões vão passar o inverno sem as economias.', lose: 'A guarda pegou você no meio do saque. Você fugiu com quase nada.', flag: 'ev_vila_saqueada' } } },
];

/* ================= os objetos de cena ================= */
const glowTex = (c: string) => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d')!, gr = g.createRadialGradient(32, 32, 1, 32, 32, 31); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; };
const GLOW = { purple: glowTex('rgba(190,90,255,.95)'), warm: glowTex('rgba(255,210,120,.95)'), gold: glowTex('rgba(255,240,170,.95)') };
function sprite(tex: THREE.Texture, s: number, add = true) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false })); m.scale.setScalar(s); return m; }
function buildProp(kind: Prop): { g: THREE.Group; glow?: THREE.Sprite } {
  const g = new THREE.Group(), wood = std(0xffffff, { map: plankTex(0x7a5232) }), dark = std(0xffffff, { map: woodTex(0x3a2414) }), brass = std(0xd9a441), iron = std(0x34363c);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  let glow: THREE.Sprite | undefined;
  if (kind === 'crate') { add(new THREE.BoxGeometry(0.9, 0.7, 0.7), wood, 0, 0.35, 0); for (const y of [0.12, 0.58]) add(new THREE.BoxGeometry(0.93, 0.06, 0.73), brass, 0, y, 0); add(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 10).rotateX(Math.PI / 2), brass, 0, 0.36, 0.36); add(new THREE.BoxGeometry(0.6, 0.45, 0.5), wood, 0.2, 0.92, -0.05).rotation.y = 0.4; }
  else if (kind === 'music') { add(new THREE.CylinderGeometry(0.35, 0.4, 0.9, 12), wood, 0, 0.45, 0); add(new THREE.CylinderGeometry(0.06, 0.45, 0.8, 12, 1, true), brass, 0.2, 1.35, 0.15).rotation.z = -0.6; for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(0.05, 0.05, 0.6 + i * 0.12, 6), brass, -0.25 + i * 0.12, 1.1 + i * 0.06, -0.2); glow = sprite(GLOW.warm, 1.4); glow.position.set(0, 1.0, 0); g.add(glow); }
  else if (kind === 'fireworks') { add(new THREE.BoxGeometry(1.0, 0.25, 0.6), dark, 0, 0.12, 0); for (let i = 0; i < 6; i++) { const tb = add(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 7), i % 2 ? std(0xc03a2a) : std(0x2a5ac0), -0.38 + (i % 3) * 0.38, 0.5, -0.12 + Math.floor(i / 3) * 0.24); tb.rotation.x = -0.25; } }
  else if (kind === 'lantern') { add(new THREE.CylinderGeometry(0.05, 0.06, 2.4, 6), dark, 0, 1.2, 0); add(new THREE.BoxGeometry(0.5, 0.05, 0.05), dark, 0.22, 2.35, 0); add(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0x5a3a20 }), 0.45, 2.15, 0); glow = sprite(GLOW.warm, 0.01); glow.position.set(0.45, 2.15, 0); g.add(glow); }
  else if (kind === 'pillar') { const ob = add(new THREE.CylinderGeometry(0.18, 0.32, 2.4, 5), std(0x2a2232), 0, 1.2, 0); ob.userData.pillar = true; add(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: 0xc080ff }), 0, 2.6, 0); glow = sprite(GLOW.purple, 2.4); glow.position.set(0, 2.4, 0); g.add(glow); }
  else if (kind === 'altar') { add(new THREE.BoxGeometry(1.2, 0.8, 0.6), std(0xe8e0d0), 0, 0.4, 0); const arc = add(new THREE.TorusGeometry(1.4, 0.07, 6, 18, Math.PI), dark, 0, 0.1, -0.2); void arc;
    for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI; add(new THREE.SphereGeometry(0.12, 6, 5), std([0xff8ab0, 0xffffff, 0xffd0e0, 0xff6a8a][i % 4]), Math.cos(a) * 1.4, 0.1 + Math.sin(a) * 1.4, -0.2); } }
  else if (kind === 'barrel') { add(new THREE.CylinderGeometry(0.42, 0.42, 0.95, 12), wood, 0, 0.48, 0); for (const y of [0.15, 0.48, 0.8]) add(new THREE.TorusGeometry(0.43, 0.025, 4, 14).rotateX(Math.PI / 2), iron, 0, y, 0); add(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6).rotateZ(Math.PI / 2), brass, 0.45, 0.25, 0); }
  else if (kind === 'chest') { add(new THREE.BoxGeometry(0.9, 0.5, 0.55), wood, 0, 0.25, 0); add(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 10, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), wood, 0, 0.5, 0); add(new THREE.BoxGeometry(0.12, 0.16, 0.04), brass, 0, 0.5, 0.29); }
  else if (kind === 'trap') { add(new THREE.TorusGeometry(0.4, 0.05, 4, 16).rotateX(Math.PI / 2), iron, 0, 0.06, 0); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; const tth = add(new THREE.ConeGeometry(0.04, 0.16, 4), iron, Math.cos(a) * 0.38, 0.14, Math.sin(a) * 0.38); tth.rotation.z = Math.cos(a) * 0.5; tth.rotation.x = -Math.sin(a) * 0.5; } add(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 10), brass, 0, 0.04, 0); glow = sprite(GLOW.warm, 1.6); glow.position.set(0, 0.3, 0); g.add(glow); }
  else if (kind === 'gifts') { add(new THREE.BoxGeometry(1.6, 0.08, 0.8), wood, 0, 0.8, 0); for (const sx of [-0.7, 0.7]) for (const sz of [-0.3, 0.3]) add(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 5), dark, sx, 0.4, sz);
    const cols = [0xc03a4a, 0x3a6ac0, 0xe0b048, 0x5aa05a, 0xf0f0f0]; for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(0.28, 0.2 + (i % 3) * 0.06, 0.24), std(cols[i % cols.length]), -0.55 + i * 0.22, 0.95 + (i % 3) * 0.03, (i % 2 ? 0.15 : -0.15)); }
  return { g, glow };
}
/** o círculo riscado no chão do ritual: runas que acendem conforme a invocação */
function ritualCircle(): { g: THREE.Mesh; set(k: number, t: number): void } {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d')!; c.strokeStyle = 'rgba(210,150,255,1)'; c.lineWidth = 5; c.beginPath(); c.arc(128, 128, 118, 0, 6.283); c.stroke(); c.lineWidth = 3; c.beginPath(); c.arc(128, 128, 92, 0, 6.283); c.stroke();
  c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; const x = 128 + Math.cos(a) * 92, y = 128 + Math.sin(a) * 92; if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.closePath(); c.stroke();
  c.font = 'bold 18px serif'; c.fillStyle = 'rgba(220,170,255,1)'; for (let i = 0; i < 12; i++) { c.save(); c.translate(128, 128); c.rotate(i * Math.PI / 6); c.fillText('ᚱᚦᛟᚾᛉᛞ'[i % 6], -5, -100); c.restore(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  return { g: m, set(k, tt) { (m.material as THREE.MeshBasicMaterial).opacity = 0.25 + k * 0.6 + Math.sin(tt * 3) * 0.06; m.rotation.y = tt * 0.08; } };
}

/* ================= a lógica ================= */
const WIN = 20 * 60, LIVE = 15 * 60; // a cada 20 min uma janela; o evento vive 15
const nightAt = (ms: number) => { const h = (((ms % (3 * 3600 * 1000)) / (3 * 3600 * 1000)) * 24 + 8) % 24; return h >= 7 && h < 17 ? 0 : h >= 19 || h < 5 ? 1 : h < 19 ? (h - 17) / 2 : 1 - (h - 5) / 2; };
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** os acontecimentos que mudam o mundo inteiro por um tempo.
    Erling, 24/10: "horários marcados fazem jogadores ocupados perderem eventos" — então eles ANDAM: um marco a cada 11h17min
    (alternando Lua e Aurora), e o global começa na primeira noite (Lua) ou no primeiro dia (Aurora) depois do marco.
    Como 2 × 11h17 = 22h34, cada um cai cerca de 1h26 mais cedo a cada dia: em uma semana passa por todas as horas. */
const G_STEP = (11 * 60 + 17) * 60 * 1000, G_BASE = 1792000000000 + 37 * 60 * 1000, G_LEN = { lua: 80 * 60 * 1000, aurora: 90 * 60 * 1000 };
const G_INFO = {
  lua: { id: 'lua', name: 'Lua de Sangue', icon: '🌕', text: 'A lua cheia sangra no céu. Patrulhas são atacadas em todas as estradas e os lobisomens ficam mais fortes e vêm em maior número. Para quem tem o Faro da Lua ligado: +15% de XP.', color: '#ff6a5a' },
  aurora: { id: 'aurora', name: 'Dia da Aurora', icon: '☀', text: 'É o dia santo de Auréon: romarias atravessam as vilas de karma ruim, e todo ato de luz nos eventos vale 50% a mais de karma.', color: '#ffe08a' },
};
const gCache = new Map<number, { start: number; end: number; kind: 'lua' | 'aurora' }>();
function gWindow(k: number) { let w = gCache.get(k); if (w) return w; const kind = (k % 2 === 0 ? 'lua' : 'aurora') as 'lua' | 'aurora', t0 = G_BASE + k * G_STEP; let st = t0;
  for (let m = 0; m < 240; m++) { const tt = t0 + m * 60000, n = nightAt(tt); if (kind === 'lua' ? n > 0.5 : n < 0.01) { st = tt; break; } }
  w = { start: st, end: st + G_LEN[kind], kind }; gCache.set(k, w); return w; }
export function globalNow(ms = Date.now()) { const k = Math.floor((ms - G_BASE) / G_STEP); for (const kk of [k, k - 1]) { const w = gWindow(kk); if (ms >= w.start && ms < w.end) return { ...G_INFO[w.kind], end: w.end }; } return null; }
/** quando vem o próximo (para o mapa e para quem quiser se programar) */
export function globalNext(ms = Date.now()) { const k = Math.floor((ms - G_BASE) / G_STEP); for (let kk = k - 1; kk < k + 4; kk++) { const w = gWindow(kk); if (w.start > ms) return { ...G_INFO[w.kind], start: w.start }; } return null; }

interface Live { key: string; tpl: Tpl; site: Site; start: number; end: number; lvl: number;
  // estado local (quem está aqui)
  spawned: boolean; units: Unit[]; waveDone: Set<number>; herald: Hero3D | null; heraldEl: HTMLElement | null; extras: Hero3D[]; props: { kind: Prop; task?: string; i?: number; g: THREE.Group; glow?: THREE.Sprite; done?: boolean; x: number; z: number; hidden?: boolean }[]; circle?: ReturnType<typeof ritualCircle>;
  meter: number; side: EvSide | null; joined: boolean; celebrate?: boolean; kills: number; tasks: Record<string, number>; over: boolean; chatT: number; pathS: number; finT: number; asked?: boolean }

export function createEvents(ctx: EvCtx, world: { sitesVillage: Site[]; sitesRoad: Site[]; sitesForest: Site[]; roadPaths: { x: number; y: number }[][] }) {
  const lives = new Map<string, Live>();
  const SAVE = 'karmika.eventos.v1'; let seen: string[] = []; try { seen = JSON.parse(localStorage.getItem(SAVE) || '[]'); } catch { /* */ }
  const markSeen = (k: string) => { seen.push(k); seen = seen.slice(-60); try { localStorage.setItem(SAVE, JSON.stringify(seen)); } catch { /* */ } };
  const regions = [...new Set([...world.sitesVillage, ...world.sitesRoad, ...world.sitesForest].map((s) => s.region))];
  let channel: { live: Live; prop: Live['props'][number]; task: Task; t: number; start: THREE.Vector3 } | null = null;

  /** quais eventos existem agora (o relógio decide; todo mundo vê os mesmos) */
  function schedule(now = Date.now()): { key: string; tpl: Tpl; site: Site; start: number; end: number }[] {
    const w = Math.floor(now / 1000 / WIN), start = w * WIN * 1000, end = start + LIVE * 1000; if (now > end) return [];
    const g = globalNow(start), night = nightAt(start) > 0.5, out: ReturnType<typeof schedule> = [];
    for (const rid of regions) {
      const h = hash(w * 131 + rid * 977); if (h > (g ? 0.85 : 0.62)) continue;
      const ok = TPL.filter((t) => (t.when === 'night' ? night : t.when === 'day' ? !night : true) && (t.site === 'village' ? world.sitesVillage : t.site === 'road' ? world.sitesRoad : world.sitesForest).some((s) => s.region === rid));
      if (!ok.length) continue;
      const wt = (t: Tpl) => t.weight * (g?.id === 'lua' && t.id === 'patrulha' ? 6 : g?.id === 'aurora' && t.id === 'procissao' ? 6 : 1);
      let r = hash(w * 71 + rid * 13) * ok.reduce((a, t) => a + wt(t), 0), tpl = ok[0]; for (const t of ok) { r -= wt(t); if (r <= 0) { tpl = t; break; } }
      const pool = (tpl.site === 'village' ? world.sitesVillage : tpl.site === 'road' ? world.sitesRoad : world.sitesForest).filter((s) => s.region === rid);
      const site = pool[Math.floor(hash(w * 37 + rid * 7) * pool.length)];
      out.push({ key: `${w}:${rid}`, tpl, site, start, end });
    }
    return out;
  }
  const sitePos = (s: Site) => ({ x: (s.x + 0.5) * T, z: (s.y + 0.5) * T });
  const posAt = (L: Live, dx: number, dz: number) => { const p = sitePos(L.site); return { x: p.x + dx, z: p.z + dz }; };
  /** o caminho da romaria/patrulha: a estrada mais perto do lugar, uns 50 m para cada lado */
  const pathOf = (() => { const cache = new Map<string, { x: number; z: number }[]>(); return (L: Live) => { let p = cache.get(L.key); if (p) return p; const c = sitePos(L.site); let best: { x: number; y: number }[] | null = null, bi = 0, bd = 1e9;
    for (const rp of world.roadPaths) for (let i = 0; i < rp.length; i++) { const d = Math.hypot((rp[i].x + 0.5) * T - c.x, (rp[i].y + 0.5) * T - c.z); if (d < bd) { bd = d; best = rp; bi = i; } }
    p = best && bd < 40 ? best.slice(Math.max(0, bi - 12), bi + 12).map((q) => ({ x: (q.x + 0.5) * T, z: (q.y + 0.5) * T })) : [{ x: c.x - 20, z: c.z }, { x: c.x + 20, z: c.z }]; cache.set(L.key, p); return p; }; })();

  function addActor(L: Live, look: Look, x: number, z: number): Hero3D { const h = createCharacter(look.kind, { static: true, civil: look.civil, cloth: look.civil ? look.tint : undefined });
    const tint = new THREE.Color(look.tint); h.root.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; m.castShadow = false; const ms = Array.isArray(m.material) ? m.material : [m.material]; const out = ms.map((mt) => { const t = mt as THREE.MeshToonMaterial; if (!t.color || t.side === THREE.BackSide || (t as unknown as THREE.MeshBasicMaterial).isMeshBasicMaterial) return mt; const c = t.clone(); c.color.lerp(tint, 0.4); return c; }); m.material = out.length === 1 ? out[0] : out; });
    try { if (look.weapon || look.shield) h.setGear({ weapon: look.weapon ? { base: look.weapon, rarity: 'common' } : null, shield: look.shield ? { base: look.shield, rarity: 'common', seed: 3 } : null }); } catch { /* */ }
    h.root.position.set(x, ctx.heightAt(x, z), z); ctx.scene.add(h.root); void L; return h; }

  function activate(L: Live) {
    if (L.spawned) return; L.spawned = true; const p = sitePos(L.site);
    L.herald = addActor(L, L.tpl.herald, p.x + 2, p.z + 2.5);
    const el = document.createElement('div'); el.className = 'npc evh'; el.innerHTML = `<i class="qm">!</i><b>${L.tpl.herald.name}</b><small>${L.tpl.herald.role}</small>`; document.body.appendChild(el); L.heraldEl = el;
    (L.tpl.extras ?? []).forEach((lk, i) => { const a = (i / Math.max(1, L.tpl.extras!.length)) * 6.283 + 0.6; L.extras.push(addActor(L, lk, p.x + Math.cos(a) * 3.5, p.z + Math.sin(a) * 3.5)); });
    if (L.tpl.id === 'ritual') { L.circle = ritualCircle(); L.circle.g.position.set(p.x, ctx.heightAt(p.x, p.z) + 0.06, p.z); ctx.scene.add(fine(L.circle.g)); }
    for (const sd of Object.values(L.tpl.sides)) for (const tk of sd?.tasks ?? []) if (tk.kind === 'device') tk.at!.forEach(([dx, dz], i) => { const b = buildProp(tk.prop!), q = posAt(L, dx, dz); b.g.position.set(q.x, ctx.heightAt(q.x, q.z), q.z); b.g.rotation.y = Math.atan2(p.x - q.x, p.z - q.z); ctx.scene.add(b.g); if (tk.hidden) b.g.visible = false; L.props.push({ kind: tk.prop!, task: tk.id, i, g: b.g, glow: b.glow, x: q.x, z: q.z, hidden: tk.hidden }); });
  }
  function deactivate(L: Live) {
    if (!L.spawned) return; L.spawned = false; ctx.clearTag('ev:' + L.key); L.units = []; L.waveDone.clear();
    if (L.herald) ctx.scene.remove(L.herald.root); L.herald = null; L.heraldEl?.remove(); L.heraldEl = null; for (const h of L.extras) ctx.scene.remove(h.root); L.extras = [];
    for (const pr of L.props) ctx.scene.remove(pr.g); L.props = []; if (L.circle) ctx.scene.remove(L.circle.g); L.circle = undefined;
  }
  function spawnWave(L: Live, wv: Wave, idx: number) {
    if (L.waveDone.has(idx)) return; L.waveDone.add(idx); const p = sitePos(L.site), lv = L.lvl;
    const ang = hash(idx * 11 + L.start) * 6.283; let k = 0;
    const luaN = globalNow()?.id === 'lua'; for (const [type, n0, nm] of wv.units) for (let i = 0, n = n0 + (luaN && type === 'werewolf' ? 1 : 0); i < n; i++, k++) { // na Lua de Sangue vem um lobisomem a mais em cada onda
      const r = wv.from ?? 3 + (k % 3), a = wv.from ? ang + (k - 2) * 0.35 : k * 1.9, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      const lua = globalNow()?.id === 'lua' && type === 'werewolf'; const e = ctx.spawn(type, x, z, { name: nm, lvl: lv + (type === 'werewolf' || type === 'darkpal' ? 1 : 0) + (lua ? 2 : 0), tag: 'ev:' + L.key, aggro: 0, hpMul: type === 'deer' ? 1 : lua ? 1.45 : 1.1 }); e.evFac = wv.fac; if (type === 'deer') e.def.passive = true;
      if (wv.from) e.home.set(p.x + Math.cos(a) * 3, p.z + Math.sin(a) * 3); // vêm de fora para o meio
      L.units.push(e); }
    hostility(L);
  }
  /** de que lado cada um está, para você */
  function hostility(L: Live) { for (const u of L.units) { if (!L.joined || !L.side) { u.def.aggro = 0; u.ally = false; continue; } const mine = u.evFac === L.side; u.ally = mine; u.def.aggro = mine || u.type === 'deer' ? 0 : 18; } }
  /** quem briga com quem (o mais perto do outro lado) */
  function pairUp(L: Live) {
    const A = L.units.filter((u) => u.alive && u.evFac === 'A' && u.type !== 'deer'), B = L.units.filter((u) => u.alive && u.evFac === 'B');
    const deerOnly = L.tpl.id === 'cacadores';
    for (const u of [...A, ...B]) { const pool = u.evFac === 'A' ? B : deerOnly ? L.units.filter((d) => d.alive && d.type === 'deer') : A; let best: Unit | null = null, bd = 1e9;
      for (const o of pool) { const d = o.pos.distanceTo(u.pos); if (d < bd) { bd = d; best = o; } }
      if (best && bd < 45) { const tgt = best; u.foe = { pos: tgt.pos, alive: () => tgt.alive, hit: (n) => { if (tgt.alive) ctx.hurtBy(tgt, Math.max(1, Math.round(n * (tgt.type === 'deer' ? 3 : 0.32))), u.pos); } }; } else u.foe = undefined; }
  }
  const sideDef = (L: Live) => (L.side ? L.tpl.sides[L.side] : undefined);
  const killsOf = (L: Live) => L.kills;
  function tasksDone(L: Live) { const sd = sideDef(L); if (!sd) return false; return (sd.tasks ?? []).every((tk) => (L.tasks[tk.id] ?? 0) >= tk.n || (tk.need && !tk.need(ctx))); }
  function complete(L: Live) { const sd = sideDef(L); if (!sd) return false; return killsOf(L) >= sd.kills && tasksDone(L) && (!L.tpl.meter || (L.tpl.meter.side === L.side ? L.meter >= 1 : L.meter < 1)); }
  function contribution(L: Live) { const sd = sideDef(L); if (!sd) return 0; const parts: number[] = []; if (sd.kills) parts.push(Math.min(1, L.kills / sd.kills)); for (const tk of sd.tasks ?? []) { if (tk.need && !tk.need(ctx)) continue; parts.push(Math.min(1, (L.tasks[tk.id] ?? 0) / tk.n)); } if (L.celebrate) parts.push(1); return parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 1; }

  function finish(L: Live, reason: 'done' | 'time' | 'fail') {
    if (L.over) return; L.over = true; markSeen(L.key);
    if (!L.joined || !L.side) { deactivate(L); return; }
    const sd = sideDef(L)!, won = reason === 'done', c = contribution(L), vila = L.site.name;
    const aurora = globalNow()?.id === 'aurora' && sd.karma > 0, karma = Math.round(sd.karma * (won ? 1 : 0.4 * c) * (aurora ? 1.5 : 1)), lv = Math.max(1, ctx.lvl()), xp = Math.round(ctx.xpNeedAt(lv) * (won ? 0.3 : 0.08 + 0.14 * c)), gold = Math.round((won ? 30 : 8) + lv * (won ? 3 : 1) + (sd.lean === 'sombra' && won ? lv * 4 : 0));
    const fogos = L.props.some((p) => p.kind === 'fireworks') ? 'À meia-noite os fogos da Academia pintaram o céu de vermelho e azul. ' : '';
    const lines = [(won ? sd.win : sd.lose).replace(/\{vila\}/g, vila).replace('{fogos}', fogos)];
    if (sd.kills) lines.push(`Você derrubou ${L.kills} ${L.kills === 1 ? 'inimigo' : 'inimigos'} do lado contrário.`);
    for (const tk of sd.tasks ?? []) if (!(tk.need && !tk.need(ctx))) lines.push(`${(L.tasks[tk.id] ?? 0) >= tk.n ? '✔' : '✗'} ${tk.label}`);
    if (L.celebrate) lines.push('✔ Você celebrou o casamento.');
    if (aurora) lines.push('☀ Dia da Aurora: o seu ato de luz pesou 50% a mais.');
    ctx.result({ name: L.tpl.name, icon: L.tpl.icon, side: sd.label, lean: sd.lean, won, karma, xp, gold, lines, flag: won ? sd.flag : undefined, kills: L.kills });
    // o lado vencido se dispersa; a festa/a luz/a sombra do final
    if (won) { for (const u of L.units) if (u.alive && u.evFac !== L.side && u.type !== 'deer') { u.foe = undefined; u.def.aggro = 0; u.state = 'flee'; u.t = 0; } setTimeout(() => ctx.clearTag('ev:' + L.key), 6000);
      if (L.tpl.finale) L.finT = 22; }
    setTimeout(() => deactivate(L), won && L.tpl.finale ? 26000 : 8000);
  }

  function talk(L: Live) {
    const steps = L.tpl.intro(L.site, ctx).map((st) => { if (typeof st === 'object' && 'r' in st) return { ...st, r: st.r.filter((r) => { const f = r.flag ?? ''; if (f.startsWith('ev:B') && L.tpl.sides.B?.gate && !L.tpl.sides.B.gate(ctx)) return false; if (f.startsWith('ev:A') && L.tpl.sides.A?.gate && !L.tpl.sides.A.gate(ctx)) return false; if (f.startsWith('ev:B') && !L.tpl.sides.B) return false; return true; }) }; return st; });
    if (L.joined) { const sd = sideDef(L)!; ctx.log(`${L.tpl.herald.name}: “${L.side === 'A' ? 'Rápido, ainda dá tempo!' : 'Você de novo…'}” (${sd.label})`, L.tpl.color); deliver(L); return; }
    ctx.converse({ name: L.tpl.herald.name, role: L.tpl.herald.role, title: `${L.tpl.icon} ${L.tpl.name}`, steps, onPick: (r) => {
      const f = r?.flag ?? 'ev:none'; if (f === 'ev:none') { ctx.log(`Você deixa ${L.tpl.name.toLowerCase()} para quem quiser. O evento segue sem você.`, '#b9c6e0'); L.asked = true; return; }
      L.side = f.startsWith('ev:A') ? 'A' : 'B'; L.joined = true; if (f === 'ev:A:celebrar') L.tasks['altar_perm'] = 1; hostility(L);
      const sd = sideDef(L)!; ctx.log(`${L.tpl.icon} Evento: ${L.tpl.name} — você escolheu: ${sd.label}.`, L.tpl.color); } });
  }
  /** entregar o que a festa pede (madeira, pedra) */
  function deliver(L: Live) { const sd = sideDef(L); if (!sd) return; for (const tk of sd.tasks ?? []) if (tk.kind === 'deliver') { const have = ctx.count(tk.item!), left = tk.n - (L.tasks[tk.id] ?? 0), give = Math.min(have, left); if (give > 0 && ctx.take(tk.item!, give)) { L.tasks[tk.id] = (L.tasks[tk.id] ?? 0) + give; ctx.log(`📦 Você entrega ${give}× ${tk.item === 'wood' ? 'madeira' : tk.item === 'stone' ? 'pedra' : tk.item}. (${L.tasks[tk.id]}/${tk.n})`, '#ffd24a'); } } }

  let acc = 0, chk = 0;
  function update(dt: number, t: number) {
    const now = Date.now(), hp = ctx.hero(), inside = ctx.inside();
    chk -= dt; if (chk <= 0) { chk = 1;
      const sch = schedule(now), keys = new Set(sch.map((s) => s.key));
      for (const s of sch) if (!lives.has(s.key) && !seen.includes(s.key)) { const reg = ctx.region(s.site.x, s.site.y), lv = Math.max(reg.lo + 2, Math.min(Math.max(ctx.lvl(), reg.lo), reg.hi + 3)); lives.set(s.key, { ...s, lvl: lv, spawned: false, units: [], waveDone: new Set(), herald: null, heraldEl: null, extras: [], props: [], meter: 0, side: null, joined: false, kills: 0, tasks: {}, over: false, chatT: 3, pathS: 0, finT: 0 }); }
      for (const [k, L] of lives) { const gone = k.startsWith('dev:') ? now > L.end : !keys.has(k); if (gone && !L.over) finish(L, 'time'); else if (gone && L.over && !L.spawned) lives.delete(k); }
    }
    for (const L of lives.values()) {
      const p = sitePos(L.site), dH = Math.hypot(p.x - hp.x, p.z - hp.z), el = (now - L.start) / 1000;
      if (L.over) { if (L.finT > 0 && L.spawned) { L.finT -= dt; finale(L, t, dt); } continue; }
      if (inside || dH > 170) { if (L.spawned && (!L.joined || dH > 260)) deactivate(L); continue; }
      if (!L.spawned) activate(L);
      // as ondas que já deviam ter chegado (quem chega tarde pega o evento andando)
      (L.tpl.waves ?? []).forEach((wv, i) => { if (el >= wv.at && !L.waveDone.has(i)) { const later = (L.tpl.waves ?? []).some((w2, j) => j > i && w2.fac === wv.fac && el >= w2.at); if (!later || wv.at === 0) spawnWave(L, wv, i); else L.waveDone.add(i); } });
      acc += dt; if (acc > 0.5) { acc = 0; pairUp(L); }
      // medidor: invocação sobe enquanto há bruxos vivos e pilares de pé; purificação anda enquanto a romaria vive e não há corrompido perto
      if (L.tpl.meter) { const m = L.tpl.meter, by = L.units.filter((u) => u.alive && u.evFac === m.by && u.type !== 'deer'), foes = L.units.filter((u) => u.alive && u.evFac !== m.by && u.type !== 'deer');
        const pillarsUp = L.props.filter((q) => q.kind === 'pillar' && !q.done).length;
        const rate = m.rate * (L.tpl.id === 'ritual' ? (by.length ? 1 : 0) * (0.34 + 0.22 * pillarsUp) : by.length ? (foes.some((f) => by.some((b) => b.pos.distanceTo(f.pos) < 9)) ? 0.25 : 1) : 0);
        L.meter = Math.min(1, L.meter + rate * dt * 1.8); if (L.circle) L.circle.set(L.meter, t);
        if (L.tpl.path && L.tpl.id === 'procissao') walkPath(L, L.meter, by); }
      if (L.tpl.path && L.tpl.id === 'patrulha') { const sold = L.units.filter((u) => u.alive && u.evFac === 'A'); L.pathS = (L.pathS + dt * 0.006) % 1; walkPath(L, 0.5 + Math.sin(L.pathS * 6.283) * 0.45, sold); }
      // herói do evento, aldeões e falas
      if (L.herald) { const h = L.herald, hx = p.x + 2, hz = p.z + 2.5; h.root.position.set(hx, ctx.heightAt(hx, hz), hz); const dd = Math.hypot(hp.x - hx, hp.z - hz); h.root.rotation.y = dd < 9 ? Math.atan2(hp.x - hx, hp.z - hz) : 0.4; h.update(dt, t, 0, null);
        if (L.heraldEl) { const sp = ctx.project(new THREE.Vector3(hx, h.root.position.y + 2.35, hz)); const show = !!sp && dd < 30; L.heraldEl.style.display = show ? 'block' : 'none'; if (sp && show) { L.heraldEl.style.left = sp.x + 'px'; L.heraldEl.style.top = sp.y + 'px'; } L.heraldEl.classList.toggle('joined', L.joined); }
        if (!L.joined && !L.asked && dd < 26 && !L.chatT) { /* */ } }
      L.extras.forEach((h, i) => { const a = t * 0.15 + i * 1.7, r = 3.5 + Math.sin(t * 0.3 + i) * 0.6, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r; const ox = h.root.position.x, oz = h.root.position.z; h.root.position.set(x, ctx.heightAt(x, z), z); const mv = Math.hypot(x - ox, z - oz) / Math.max(dt, 1e-3); h.root.rotation.y = Math.atan2(x - ox, z - oz); h.update(dt, t, Math.min(mv, 1.4), null); });
      L.chatT -= dt; if (L.chatT <= 0) { L.chatT = 9 + Math.random() * 8; const talkers = [...L.units.filter((u) => u.alive && u.type !== 'deer' && u.type !== 'werewolf'), ...(L.herald ? [{ pos: L.herald.root.position } as Unit] : [])]; const who = talkers[Math.floor(Math.random() * talkers.length)]; if (who && L.tpl.chatter && dH < 45) ctx.bubble(who.pos.x, who.pos.y + 2.6, who.pos.z, PICK(L.tpl.chatter)); }
      // objetos: lanternas acendem, pilares caídos tombam
      for (const pr of L.props) { if (pr.hidden) pr.g.visible = !pr.done && ctx.instinct() && L.joined; if (pr.kind === 'lantern' && pr.glow) pr.glow.scale.setScalar(pr.done ? 1.6 + Math.sin(t * 7 + pr.x) * 0.1 : 0.01); if (pr.kind === 'pillar' && pr.glow) pr.glow.scale.setScalar(pr.done ? 0.01 : 2.2 + Math.sin(t * 3 + pr.x) * 0.3); if (pr.kind === 'music' && pr.glow) { pr.g.rotation.y += dt * 0.6; if (Math.random() < dt * 2) ctx.fx('holy', pr.x, ctx.heightAt(pr.x, pr.z) + 1.8, pr.z); } }
      if (L.tpl.id === 'ritual' && Math.random() < dt * (1 + L.meter * 4)) ctx.fx('dark', p.x + (Math.random() - 0.5) * 8, ctx.heightAt(p.x, p.z) + 0.3, p.z + (Math.random() - 0.5) * 8);
      // canalizar uma tarefa (E)
      if (channel && channel.live === L) { channel.t += dt; if (hp.distanceTo(channel.start) > 1.3) { ctx.log('Você se mexeu e perdeu o que estava fazendo.', '#ff9a8a'); channel = null; }
        else if (channel.t >= (channel.task.channel ?? 3)) { const { prop, task } = channel; channel = null; prop.done = true; L.tasks[task.id] = (L.tasks[task.id] ?? 0) + 1; if (task.done) ctx.bubble(prop.x, ctx.heightAt(prop.x, prop.z) + 2.4, prop.z, task.done);
          if (task.after) { ctx.scene.remove(prop.g); const b = buildProp(task.after); b.g.position.copy(prop.g.position); ctx.scene.add(b.g); prop.g = b.g; prop.glow = b.glow; prop.kind = task.after; }
          if (prop.kind === 'pillar') { prop.g.rotation.z = 1.35; prop.g.position.y -= 0.2; ctx.fx('holy', prop.x, ctx.heightAt(prop.x, prop.z) + 1, prop.z); }
          if (task.id === 'altar') { L.celebrate = true; L.finT = 0; for (let i = 0; i < 30; i++) ctx.fx('petal', prop.x + (Math.random() - 0.5) * 4, ctx.heightAt(prop.x, prop.z) + 3 + Math.random() * 2, prop.z + (Math.random() - 0.5) * 4); }
          if (prop.kind === 'barrel' || prop.kind === 'gifts' || prop.kind === 'chest') { prop.g.visible = false; } } }
      // fim: decidido, ou o tempo acabou, ou a invocação fechou sem você querer
      if (L.joined && complete(L)) finish(L, 'done');
      else if (L.joined && L.tpl.meter && L.tpl.meter.side !== L.side && L.meter >= 1) finish(L, 'fail');
      else if (L.joined && L.tpl.id === 'cacadores' && L.side === 'A' && !L.units.some((u) => u.alive && u.type === 'deer') && L.waveDone.size >= 4) finish(L, 'fail');
    }
  }
  /** faz a romaria/patrulha andar pela estrada (o 'home' de cada um anda; eles vão atrás) */
  function walkPath(L: Live, k: number, who: Unit[]) { const pts = pathOf(L); const f = Math.max(0, Math.min(0.999, k)) * (pts.length - 1), i = Math.floor(f), a = pts[i], b = pts[i + 1] ?? a, u = f - i, cx = a.x + (b.x - a.x) * u, cz = a.z + (b.z - a.z) * u;
    who.forEach((m, j) => { const ox = ((j % 2) ? 1 : -1) * 1.2, oz = -Math.floor(j / 2) * 1.6; m.home.set(cx + ox, cz + oz); if (m.state === 'idle' && Math.hypot(m.pos.x - m.home.x, m.pos.z - m.home.y) > 1.5) { m.state = 'return'; m.t = 0; } });
    if (L.herald && L.tpl.id === 'procissao') { /* o frei vai na frente */ } }
  function finale(L: Live, t: number, dt: number) { const p = sitePos(L.site), y = ctx.heightAt(p.x, p.z), f = L.tpl.finale;
    if (f === 'fireworks' && Math.random() < dt * 2.2) ctx.fx('firework', p.x + (Math.random() - 0.5) * 16, y + 12 + Math.random() * 8, p.z + (Math.random() - 0.5) * 16);
    if (f === 'petals' && Math.random() < dt * 6) ctx.fx('petal', p.x + (Math.random() - 0.5) * 8, y + 4 + Math.random() * 2, p.z + (Math.random() - 0.5) * 8);
    if (f === 'holy' && Math.random() < dt * 5) ctx.fx('holy', p.x + (Math.random() - 0.5) * 14, y + 0.4, p.z + (Math.random() - 0.5) * 14);
    if (f === 'dark' && Math.random() < dt * 5) ctx.fx('dark', p.x + (Math.random() - 0.5) * 10, y + 0.4, p.z + (Math.random() - 0.5) * 10);
    for (const h of L.extras) { h.update(dt, t, 0, null); if (Math.random() < dt * 0.5) h.act('skyraise', true); } }

  /** o E perto do arauto ou de um objeto do evento */
  function interact(hx: number, hz: number): { d: number; label: string; act: () => void } | null {
    let best: { d: number; label: string; act: () => void } | null = null; const put = (d: number, label: string, act: () => void) => { if (!best || d < best.d) best = { d, label, act }; };
    for (const L of lives.values()) { if (!L.spawned || L.over) continue; const p = sitePos(L.site);
      if (L.herald) { const d = Math.hypot(p.x + 2 - hx, p.z + 2.5 - hz); if (d < 3.4) put(d, L.joined ? `E — ${L.tpl.herald.name}${sideDef(L)?.tasks?.some((x) => x.kind === 'deliver') ? ' (entregar)' : ''}` : `E — ${L.tpl.icon} ${L.tpl.herald.name}: o que está acontecendo?`, () => talk(L)); }
      if (!L.joined || !L.side) continue; const sd = sideDef(L)!;
      for (const pr of L.props) { if (pr.done) continue; const tk = (sd.tasks ?? []).find((x) => x.id === pr.task); if (!tk) continue; const d = Math.hypot(pr.x - hx, pr.z - hz); if (d > 2.8) continue;
        if (tk.id === 'altar' && !L.tasks['altar_perm'] && !L.tasks['padre']) { put(d, 'O altar espera um celebrante… (resgate o padre, ou volte como paladino, mago ou elfo)', () => {}); continue; }
        if (tk.hidden && !ctx.instinct()) continue;
        if (tk.need && !tk.need(ctx)) { put(d, `🔒 ${tk.label} — ${tk.needTxt ?? ''}`, () => ctx.log(tk.needTxt ?? 'Você não sabe fazer isso.', '#ff9a8a')); continue; }
        put(d, `E — ${tk.label}`, () => { channel = { live: L, prop: pr, task: tk, t: 0, start: ctx.hero().clone() }; ctx.act(tk.prop === 'pillar' ? 'cleave1' : 'chop'); ctx.log(`⏳ ${tk.label}… (fique parado)`, '#ffd24a'); }); } }
    return best;
  }
  /** você derrubou alguém do evento */
  function onKill(e: Unit & { tag?: string }) { if (!e.tag?.startsWith('ev:')) return; const L = lives.get(e.tag.slice(3)); if (!L || !L.joined || L.over) return;
    if (L.tpl.id === 'cacadores' && L.side === 'B') { if (e.type === 'deer') L.kills++; return; }
    if (e.evFac && e.evFac !== L.side) { L.kills++; if (L.tpl.id === 'casamento' && L.units.filter((u) => u.evFac === 'B' && u.alive).length === 0 && !L.tasks['padre']) { L.tasks['padre'] = 1; ctx.log('⛪ O padre, amarrado atrás das árvores, sai cambaleando: “Graças ao Olho! Me leve ao altar, rápido!”', '#ffb0d0'); } } }

  /** marcas para o mapa e o minimapa (só o que está perto, ou o que você aceitou) */
  function mapMarks(heroT: V2): { x: number; y: number; r: number; icon: string; color: string; name: string; sub: string; mine: boolean }[] {
    const out: ReturnType<typeof mapMarks> = []; const now = Date.now();
    for (const s of schedule(now)) { if (seen.includes(s.key)) continue; const d = Math.hypot(s.site.x - heroT.x, s.site.y - heroT.y), L = lives.get(s.key); if (d > 190 && !L?.joined) continue;
      const left = Math.max(0, Math.ceil((s.end - now) / 60000)); out.push({ x: s.site.x, y: s.site.y, r: 14, icon: s.tpl.icon, color: s.tpl.color, name: s.tpl.name, sub: `${s.site.name} · ${L?.joined ? 'você está nele · ' : ''}termina em ~${left} min`, mine: !!L?.joined }); }
    return out;
  }
  /** o painel do evento perto de você */
  function tracker(heroT: V2): string { let best: Live | null = null, bd = 1e9; for (const L of lives.values()) { if (L.over) continue; const d = Math.hypot(L.site.x - heroT.x, L.site.y - heroT.y); if ((L.joined && d < 140) || d < 60) { const sc = d - (L.joined ? 1000 : 0); if (sc < bd) { bd = sc; best = L; } } } if (!best) return '';
    const L = best, left = Math.max(0, (L.end - Date.now()) / 1000), mm = `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`, sd = sideDef(L);
    const row = (lab: string, k: number, txt: string) => `<div class="er"><span>${lab}</span><i><b style="width:${Math.round(Math.min(1, k) * 100)}%"></b></i><em>${txt}</em></div>`;
    let body = '';
    if (!L.joined) body = `<p class="eh">${L.asked ? 'Você ficou de fora. O evento segue sem você.' : `Fale com <b>${L.tpl.herald.name}</b> para saber o que está acontecendo.`}</p>`;
    else if (sd) { body = `<p class="es ${sd.lean}">${sd.label}</p>`; if (sd.kills) body += row(`Derrubar: ${L.side === 'A' ? L.tpl.facs?.B ?? 'inimigos' : L.tpl.id === 'cacadores' ? 'cervos' : L.tpl.facs?.A ?? 'inimigos'}`, L.kills / sd.kills, `${Math.min(L.kills, sd.kills)}/${sd.kills}`);
      for (const tk of sd.tasks ?? []) { if (tk.need && !tk.need(ctx)) { body += `<div class="er lock"><span>🔒 ${tk.label}</span></div>`; continue; } const v = L.tasks[tk.id] ?? 0; body += row(tk.label, v / tk.n, `${Math.min(v, tk.n)}/${tk.n}`); }
      if (L.tpl.id === 'casamento' && L.side === 'A' && !L.tasks['altar_perm']) body += row('Resgatar o padre dos salteadores', L.tasks['padre'] ? 1 : 0, L.tasks['padre'] ? '✔' : '…'); }
    if (L.tpl.meter) body += row(L.tpl.meter.label, L.meter, `${Math.round(L.meter * 100)}%`);
    if (channel?.live === L) body += row(`⏳ ${channel.task.label}`, channel.t / (channel.task.channel ?? 3), '');
    return `<div class="et" style="--c:${L.tpl.color}"><b>${L.tpl.icon} ${L.tpl.name}</b><small>${L.site.name} · ${mm}</small></div>${body}`; }
  /** (dev) força um evento aqui */
  function devForce(id: string, site?: Site) { const tpl = TPL.find((q) => q.id === id); if (!tpl) return null; const hp = ctx.hero(), s = site ?? { x: Math.floor(hp.x / T) + 6, y: Math.floor(hp.z / T), name: 'aqui', region: ctx.region(Math.floor(hp.x / T), Math.floor(hp.z / T)).id }; const now = Date.now(), key = 'dev:' + id + ':' + now;
    lives.set(key, { key, tpl, site: s, start: now, end: now + LIVE * 1000, lvl: Math.max(5, ctx.lvl()), spawned: false, units: [], waveDone: new Set(), herald: null, heraldEl: null, extras: [], props: [], meter: 0, side: null, joined: false, kills: 0, tasks: {}, over: false, chatT: 3, pathS: 0, finT: 0 }); return key; }
  return { update, interact, onKill, mapMarks, tracker, schedule, devForce, lives, TPL };
}

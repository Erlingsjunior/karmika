/* ---------- Rituais de travessia, Renegados e Desgarrados (Erling, 27/10/2026) ----------
   Cada caminho tem uma natureza (karma.ts). A alma pode se afastar dela até o neutro, e ali ela sofre: é a beira do precipício
   kármico. O zero é uma parede: não se passa para o outro lado andando. No zero o Olho abre o ritual da classe:
   - quem é da luz faz o RITUAL DA QUEDA: grita, uma explosão negra apaga a luz e a alma cai para −50;
   - quem é da sombra faz o RITUAL DO RENASCIMENTO: explode em luz, o karma se limpa e a alma sobe para +50.
   Quem atravessa vira uma ABERRAÇÃO KÁRMICA: RENEGADO (da sombra para a luz: vampiros, bruxos e lobisomens renegados) ou
   DESGARRADO (da luz para a sombra: paladinos, magos, caçadores… que largaram a luz). Não ficam mais fracos por isso:
   a nova posição vira a sua casa. Ganham uma Lágrima do Olho e passam a ver as missões do seu clã, que os mesmos NPCs
   das cidades dão só para eles. O caminho de volta existe: no zero de novo, o ritual do RETORNO devolve a alma à natureza. */
import type { QuestDef } from './quests';

export type Outcast = 'renegado' | 'desgarrado';
export const OUTCAST_NAME: Record<Outcast, string> = { renegado: 'Renegado', desgarrado: 'Desgarrado' };

/** o ritual de cada caminho: o que se faz para atravessar (difícil de propósito: no zero a alma está no fundo da fraqueza) */
const RIT: Record<string, { fall: boolean; name: string; text: string; objs: QuestDef['objs']; lvl: number }> = {
  pal: { fall: true, lvl: 34, name: 'A Queda do Paladino', text: 'A fé já não segura você. Para cair de vez, desça à Catedral Abandonada, derrube os templários que ainda guardam a estrada de Auréon e enfrente o Paladino Negro que caiu antes de você. Ele sabe o caminho.', objs: [{ kind: 'kill', type: 'templar', n: 6 }, { kind: 'kill', type: 'darkpal', n: 1 }, { kind: 'visit', poi: 'Catedral Abandonada' }] },
  mag: { fall: true, lvl: 34, name: 'A Queda do Mago', text: 'Os livros não respondem mais. Vá ao Pináculo de Marfim, deixe que a Fada Rainha leia a sua alma e quebre os selos da Grande Biblioteca com as próprias mãos.', objs: [{ kind: 'kill', type: 'fairyqueen', n: 1 }, { kind: 'visit', poi: 'Pináculo de Marfim' }, { kind: 'visit', poi: 'Grande Biblioteca' }] },
  cac: { fall: true, lvl: 34, name: 'A Queda do Caçador', text: 'Você caçou monstros até virar um. Encare os Inquisidores que vão vir atrás de você e entre no Vale da Desgraça sem a prata.', objs: [{ kind: 'kill', type: 'inquisitor', n: 3 }, { kind: 'kill', type: 'hellhound', n: 5 }, { kind: 'visit', poi: 'Vale da Desgraça' }] },
  gue: { fall: true, lvl: 34, name: 'A Queda do Guerreiro', text: 'Odin não olha mais para você. Suba à Fortaleza de Odin, quebre o escudo diante do salão e lute com os mortos do Fiorde que juraram o mesmo que você.', objs: [{ kind: 'kill', type: 'draugr_bers', n: 6 }, { kind: 'kill', type: 'jotun', n: 1 }, { kind: 'visit', poi: 'Fortaleza de Odin' }] },
  tec: { fall: true, lvl: 34, name: 'A Queda do Tecnocrata', text: 'A Companhia mede tudo, menos o que você perdeu. Vá à Ferrugem, desligue o Colosso de Ferro e os autômatos que ainda obedecem às ordens.', objs: [{ kind: 'kill', type: 'automaton', n: 8 }, { kind: 'kill', type: 'colossus', n: 1 }, { kind: 'visit', poi: 'Ferrugem' }] },
  vam: { fall: false, lvl: 34, name: 'O Renascimento do Vampiro', text: 'A sede ainda chama, mas você não responde. Volte ao Castelo da Colina Vampírica, derrube os capangas do Conde e o demônio que se banqueteia lá dentro. Só então o sangue se cala.', objs: [{ kind: 'kill', type: 'thrall', n: 6 }, { kind: 'kill', type: 'glutton', n: 1 }, { kind: 'visit', poi: 'Castelo da Colina Vampírica' }] },
  bru: { fall: false, lvl: 34, name: 'O Renascimento do Bruxo', text: 'Para sair do pacto é preciso pagar o pacto. Derrube os pactários quebrados e o Senhor do Suplício que cobra as dívidas no Vale da Desgraça.', objs: [{ kind: 'kill', type: 'pactbroken', n: 3 }, { kind: 'kill', type: 'suplicio', n: 1 }, { kind: 'visit', poi: 'Vale da Desgraça' }] },
  lob: { fall: false, lvl: 34, name: 'O Renascimento do Lobisomem', text: 'A Besta não sai sozinha. Vá à Árvore-Mãe do Uivo, derrube os lobisomens que ainda uivam por você e o Lobo-Rei que manda na alcateia.', objs: [{ kind: 'kill', type: 'werewolf', n: 6 }, { kind: 'kill', type: 'alpha', n: 1 }, { kind: 'visit', poi: 'Árvore-Mãe do Uivo' }] },
};
/** o ritual que se abre no zero: `back` = a aberração voltando para a natureza do caminho */
export function ritualFor(path: string, back: boolean): QuestDef | null {
  const r = RIT[path]; if (!r) return null; const fall = back ? !r.fall : r.fall;
  const name = back ? (fall ? 'A Volta à Sombra' : 'A Volta à Luz') + ` (${r.name.split(' do ')[1] ?? path})` : r.name;
  const text = back ? `Você atravessou uma vez e agora está no zero de novo. O caminho de volta à sua natureza é o mesmo chão, ao contrário: ${r.text.charAt(0).toLowerCase()}${r.text.slice(1)}` : r.text;
  return { id: (back ? 'ret_' : 'rit_') + path, name, lvl: r.lvl, giver: 'O Olho', turnin: 'O Olho', text: `${text}\nVocê está no fundo da fraqueza kármica: vá preparado.`, objs: r.objs, xp: 2400, gold: 0 } as QuestDef;
}
export const ritualIsFall = (path: string, back: boolean) => { const r = RIT[path]; return r ? (back ? !r.fall : r.fall) : false; };

/* as missões do clã: os mesmos NPCs das cidades, mas só quem é Renegado ou Desgarrado as vê */
const O = (id: string, outcast: Outcast, giver: string, lvl: number, name: string, text: string, objs: QuestDef['objs'], talk: string[], done: string): QuestDef =>
  ({ id, chain: outcast === 'renegado' ? 'Os Renegados' : 'Os Desgarrados', outcast, name, lvl, giver, text, objs, xp: 600 + lvl * 25, gold: 40 + lvl * 3, gear: 1, talk, done: [done] } as QuestDef);
export const OUTCAST_QUESTS: QuestDef[] = [
  O('ren01', 'renegado', 'Eldrin', 32, 'Os que voltaram', 'Há outros como você. Os Renegados se reconhecem pelo silêncio: ninguém confia neles de nenhum dos lados. Vá ao Cemitério Esquecido e enterre de novo os mortos que o seu antigo lado levantou.', [{ kind: 'kill', type: 'skeleton', n: 10 }, { kind: 'kill', type: 'necro', n: 1 }],
    ['Eu sei o que você era. O Olho também sabe.', 'Quem volta da sombra carrega a sombra no bolso por um tempo. Os Renegados se ajudam porque mais ninguém ajuda.'], 'Os mortos dormem. Um a menos no débito que você carrega.'),
  O('ren02', 'renegado', 'Morwen', 34, 'O antídoto do sangue', 'O sangue antigo ainda chama nas noites de lua. Traga presas e pó de fada: faço um tônico que cala a sede por uma estação. Os Renegados precisam dele mais do que eu.', [{ kind: 'kill', type: 'vampire', n: 6 }, { kind: 'collect', item: 'dust', n: 4 }],
    ['Senta. Não, não vou contar a ninguém o que você foi.', 'Os vampiros renegados vêm aqui às escondidas pelo tônico. Ajude a fazer mais.'], 'Aqui. Leve um frasco e deixe os outros com os Renegados da estrada.'),
  O('ren03', 'renegado', 'Garrick', 36, 'Provar na lâmina', 'A guarda não confia em quem já foi da sombra. Mostre de que lado você está agora: o Negociante de Gente leva reféns pelas estradas do sul.', [{ kind: 'kill', type: 'slaver', n: 3 }, { kind: 'kill', type: 'bandit', n: 8 }],
    ['Os soldados cospem quando você passa. Eu não. Ainda.', 'Solte os reféns que aquele negociante arrasta. Aí a gente conversa.'], 'Os reféns voltaram para casa contando de você. Isso pesa mais do que qualquer juramento.'),
  O('ren04', 'renegado', 'Orm', 38, 'A taverna dos que voltaram', 'Os Renegados se encontram nos fundos da minha estalagem. Um deles foi caçado por um Inquisidor que não acredita em arrependimento. Faça o Inquisidor desistir.', [{ kind: 'kill', type: 'inquisitor', n: 2 }],
    ['Fala baixo. Os fundos são para gente como você.', 'Um Inquisidor anda farejando a mesa deles. Ele não entende que alma pode mudar de lado.'], 'A mesa dos fundos brinda a você hoje. Bebida por minha conta.'),
  O('des01', 'desgarrado', 'Eldrin', 32, 'Os que caíram', 'Os Desgarrados não têm templo, mas têm memória. Desça ao Mausoléu do Bispo e traga o que os primeiros caídos deixaram lá embaixo.', [{ kind: 'visit', poi: 'Mausoléu do Bispo' }, { kind: 'kill', type: 'skel_arch', n: 8 }],
    ['A luz deixou você e você deixou a luz. Não precisa me explicar.', 'Os Desgarrados guardam a história dos que caíram antes. Lá embaixo há nomes que você vai querer ler.'], 'Esses nomes são seus irmãos agora. Que a queda tenha sentido.'),
  O('des02', 'desgarrado', 'Morwen', 34, 'Cinzas da antiga fé', 'Os templários perseguem quem largou a luz. Traga as insígnias deles e eu faço delas um amuleto que esconde o que você foi.', [{ kind: 'kill', type: 'templar', n: 6 }, { kind: 'collect', item: 'gem', n: 1 }],
    ['Quem largou a luz chama atenção dos dois lados.', 'Com as insígnias dos templários eu escondo a marca que a queda deixou.'], 'Pronto. Agora a marca fica debaixo da pele, e só o Olho vê.'),
  O('des03', 'desgarrado', 'Thorin', 36, 'Negócio na sombra', 'Os Desgarrados compram e vendem o que a Igreja proíbe. Um carregamento parou no Vale da Desgraça, cercado de cães do inferno. Busque.', [{ kind: 'kill', type: 'hellhound', n: 6 }, { kind: 'visit', poi: 'Vale da Desgraça' }],
    ['Negócio é negócio. Não pergunto de onde você veio.', 'Os seus novos amigos têm uma carga presa no Vale. Traga e a sua parte é generosa.'], 'Carga em dia. Os Desgarrados vão lembrar do seu nome.'),
  O('des04', 'desgarrado', 'Corwin', 38, 'A fera que escolheu você', 'Quem cai ganha olhos novos. No Covil dos Lobos há um Lobo-Rei que só respeita quem já esteve do outro lado. Vença-o e ele deixa você passar entre os dele.', [{ kind: 'kill', type: 'alpha', n: 1 }, { kind: 'kill', type: 'wolf', n: 8 }],
    ['Os bichos sentem a queda. Eles chegam mais perto de você agora.', 'O Lobo-Rei não obedece a ninguém da luz. Talvez obedeça a você.'], 'Ouviu? Os lobos uivaram o seu nome. Isso é raro.'),
];

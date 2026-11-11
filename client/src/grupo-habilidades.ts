/* HABILIDADES DE GRUPO (11/11, Erling: "crie pelo menos 4 ou 5 habilidades de grupo para cada classe, ou até seis, divididas duas para cada caminho de
   talento; nem tudo precisa curar: algumas dão ataque, outras defesa, outras curam, outras dão velocidade"). Nada foi substituído: são 66 a mais.
   ESTADO: só a LISTA (nome, caminho, tipo, alvo, números). Ainda NÃO estão ligadas ao jogo: falta aprender (pela árvore de talentos), lançar e o efeito
   em grupo. Os números seguem o orçamento de poder (claude/equilibrio-e-grupo-11-11.md): bônus de grupo pequenos, que somam com rendimento decrescente. */
import type { KitKey } from './kits';
/** o símbolo gravado na runa de pedra */
export type GTipo = 'cura' | 'defesa' | 'forca' | 'veloc' | 'olho' | 'chama';
/** para quem vai: um aliado (o do arquétipo da trava), o grupo todo perto, uma área no chão, ou uma torre/robô que anda até o arquétipo */
export type GAlvo = 'aliado' | 'grupo' | 'area' | 'torre';
export interface GEff { /** dano */ dmg?: number; /** dano recebido a menos */ def?: number; /** crítico */ crit?: number; /** ritmo de ataque */ haste?: number; /** velocidade de andar */ move?: number;
  /** cura na hora (fração da vida) */ heal?: number; /** cura por segundo */ regen?: number; /** escudo que absorve (fração da vida) */ shield?: number; /** roubo de vida */ leech?: number;
  /** quebra de guarda */ guard?: number; /** acerto no d20 */ acc?: number; /** esquiva */ dodge?: number; /** parte do dano do aliado que vem para você */ redirect?: number;
  /** tira maldição, veneno, medo e lentidão */ cleanse?: boolean; /** ergue um caído com esta fração da vida */ revive?: number; /** inimigos batem menos */ weaken?: number; /** custo em vida de quem lança */ cost?: number }
export interface GSkill { id: string; kit: KitKey; /** caminho da árvore de talentos (0, 1 ou 2) */ branch: 0 | 1 | 2; name: string; tipo: GTipo; alvo: GAlvo; /** duração em s */ dur: number; /** recarga em s */ cd: number; eff: GEff; tip: string }
const G = (kit: KitKey, branch: 0 | 1 | 2, id: string, name: string, tipo: GTipo, alvo: GAlvo, dur: number, cd: number, eff: GEff, tip: string): GSkill => ({ id: `g_${id}`, kit, branch, name, tipo, alvo, dur, cd, eff, tip });
export const GRUPO_SKILLS: GSkill[] = [
  /* HUMANO: Armas do Povo · Defesa · Comunidade */
  G('human', 0, 'estandarte', 'Estandarte da Milícia', 'forca', 'area', 12, 30, { dmg: 0.12 }, 'Finca o estandarte da vila: quem é do grupo e está a 10 m bate 12% mais forte.'),
  G('human', 0, 'amolar', 'Pedra de Amolar', 'forca', 'grupo', 10, 25, { crit: 0.1 }, 'Passa a pedra de amolar de mão em mão: o grupo ganha 10% de crítico.'),
  G('human', 1, 'vizinhos', 'Parede de Vizinhos', 'defesa', 'aliado', 8, 20, { def: 0.25 }, 'Põe o ombro ao lado de um companheiro: ele recebe 25% menos dano.'),
  G('human', 1, 'mutirao', 'Mutirão', 'defesa', 'grupo', 8, 30, { def: 0.12 }, 'Todo mundo fecha a fileira: o grupo recebe 12% menos dano.'),
  G('human', 2, 'sopa', 'Sopa da Vila', 'cura', 'grupo', 6, 30, { regen: 0.03 }, 'Reparte a sopa quente do caldeirão: o grupo cura 3% da vida por segundo.'),
  G('human', 2, 'mensageiro', 'Corrida do Mensageiro', 'veloc', 'grupo', 6, 25, { move: 0.2 }, 'Grita a ordem de correr: o grupo anda 20% mais rápido.'),
  /* GUERREIRO NÓRDICO: Berserker · Guardião do Escudo · Skald */
  G('nordic', 0, 'sanguequente', 'Sangue Quente', 'forca', 'aliado', 8, 20, { dmg: 0.2 }, 'Bate o punho no peito do companheiro: ele bate 20% mais forte.'),
  G('nordic', 0, 'uivobatalha', 'Uivo de Batalha', 'veloc', 'grupo', 8, 30, { haste: 0.15 }, 'O uivo dos que não temem morrer: o grupo ataca 15% mais rápido.'),
  G('nordic', 1, 'juramento', 'Juramento de Escudo', 'defesa', 'aliado', 10, 30, { redirect: 0.3 }, 'Jura o escudo a um companheiro: 30% do dano que ele levaria vem para você.'),
  G('nordic', 1, 'circuloescudos', 'Círculo de Escudos', 'defesa', 'grupo', 6, 30, { def: 0.15 }, 'Manda fechar o círculo: o grupo recebe 15% menos dano.'),
  G('nordic', 2, 'cantoskald', 'Canto do Skald', 'forca', 'grupo', 12, 35, { dmg: 0.1, acc: 2 }, 'Canta os feitos dos antigos: o grupo bate 10% mais forte e acerta mais (+2 no dado).'),
  G('nordic', 2, 'sagacaidos', 'Saga dos Caídos', 'chama', 'grupo', 1, 40, { cleanse: true }, 'Lembra quem caiu de pé: o medo e a lentidão saem do grupo, e o fôlego volta.'),
  /* ANÃO: Quebra-Montanhas · Guardião do Salão · Ferreiro Rúnico */
  G('dwarf', 0, 'martelo', 'Martelo Emprestado', 'forca', 'aliado', 8, 20, { dmg: 0.25 }, 'Empresta o peso do martelo: os golpes do companheiro saem 25% mais fortes.'),
  G('dwarf', 0, 'bradomina', 'Brado da Mina', 'forca', 'grupo', 8, 30, { guard: 0.3 }, 'O grito de quem racha pedra: o grupo quebra a guarda 30% mais rápido.'),
  G('dwarf', 1, 'muralhaviva', 'Muralha Viva', 'defesa', 'aliado', 8, 25, { def: 0.3 }, 'Planta os pés na frente de um companheiro: ele recebe 30% menos dano, e os inimigos perto vêm atrás de você.'),
  /* 11/11: era "Portão do Salão" (defesa); a trava de equilíbrio acusou que o anão só tinha força e defesa */
  G('dwarf', 1, 'caneca', 'Caneca do Clã', 'cura', 'grupo', 6, 30, { regen: 0.03 }, 'Passa a caneca de hidromel do salão de mão em mão: o grupo cura 3% da vida por segundo.'),
  G('dwarf', 2, 'runaafiar', 'Runa de Afiar', 'forca', 'grupo', 20, 40, { dmg: 0.08 }, 'Grava a runa do fio nas armas do grupo: +8% de dano por bastante tempo.'),
  G('dwarf', 2, 'runatempera', 'Runa de Têmpera', 'defesa', 'grupo', 20, 40, { def: 0.1 }, 'Grava a runa da têmpera nas armaduras do grupo: 10% menos dano por bastante tempo.'),
  /* ELFO: Olho de Falcão · Dança do Vento · Espírito da Mata */
  G('elf', 0, 'olhoemprestado', 'Olho Emprestado', 'olho', 'grupo', 10, 30, { crit: 0.1 }, 'O grupo passa a ver com os olhos do falcão: +10% de crítico, e o que está escondido aparece.'),
  G('elf', 0, 'sinaleira', 'Flecha Sinaleira', 'olho', 'area', 8, 25, { acc: 2 }, 'A flecha de pena branca marca o alvo: o grupo acerta mais nele (+2 no dado).'),
  G('elf', 1, 'ventofavor', 'Vento a Favor', 'veloc', 'grupo', 8, 25, { move: 0.2 }, 'Chama o vento pelas costas: o grupo anda 20% mais rápido.'),
  G('elf', 1, 'passofolha', 'Passo de Folha', 'veloc', 'aliado', 8, 20, { dodge: 0.2 }, 'O companheiro fica leve como folha: +20% de esquiva.'),
  G('elf', 2, 'chuvaseiva', 'Chuva de Seiva', 'cura', 'area', 4, 30, { regen: 0.045 }, 'Marca o chão: uma chuva fina de seiva cura quem é do grupo (18% da vida em 4 s).'),
  G('elf', 2, 'abracoraiz', 'Abraço da Raiz', 'cura', 'aliado', 1, 20, { heal: 0.25, cleanse: true }, 'Raízes claras envolvem o companheiro: cura 25% da vida e tira o veneno.'),
  /* TECNOCRATA: Artilheiro · Engenheiro de Cerco · Granadeiro */
  G('tecno', 0, 'droneartilheiro', 'Drone Artilheiro', 'forca', 'torre', 12, 30, { dmg: 0.15 }, 'Um drone armado segue o companheiro e atira no alvo dele: é como 15% a mais de dano.'),
  G('tecno', 0, 'perfurante', 'Munição Perfurante', 'forca', 'grupo', 8, 30, { guard: 0.3 }, 'Distribui cartuchos de ponta dura: o grupo quebra a guarda 30% mais rápido.'),
  G('tecno', 1, 'torreescudo', 'Torre de Escudo', 'defesa', 'torre', 12, 35, { def: 0.25 }, 'A torre anda sobre pernas de latão até o companheiro e abre um escudo de favos: 25% menos dano.'),
  G('tecno', 1, 'roboguardiao', 'Robô Guardião', 'defesa', 'torre', 10, 40, { redirect: 0.4 }, 'Um robô de proteção se põe na frente do companheiro e toma 40% dos golpes por ele.'),
  G('tecno', 2, 'torrecura', 'Torre de Cura', 'cura', 'torre', 10, 35, { regen: 0.04 }, 'A torre borrifa vapor medicinal em volta: o grupo perto cura 4% da vida por segundo.'),
  G('tecno', 2, 'estimulo', 'Granada de Estímulo', 'veloc', 'area', 8, 30, { move: 0.15, haste: 0.15 }, 'Marca o chão: a granada estoura num gás azul. Quem é do grupo anda e ataca 15% mais rápido.'),
  /* PALADINO: Vingança · Bastião · Graça */
  G('pal', 0, 'gloria', 'Glória', 'forca', 'grupo', 12, 35, { dmg: 0.1, crit: 0.05 }, 'A glória de Auréon desce sobre o grupo: mais força e mais destreza (+10% de dano, +5% de crítico).'),
  G('pal', 0, 'espadaconsagrada', 'Espada Consagrada', 'forca', 'aliado', 8, 20, { dmg: 0.2 }, 'Consagra a arma do companheiro: os golpes dele viram luz e batem 20% mais forte.'),
  G('pal', 1, 'bencaoprotecao', 'Bênção de Proteção', 'defesa', 'aliado', 8, 20, { def: 0.3 }, 'Põe a mão no ombro do companheiro: ele recebe 30% menos dano.'),
  G('pal', 1, 'devocao', 'Aura de Devoção', 'defesa', 'grupo', 20, 45, { def: 0.12 }, 'Uma luz dourada cerca o grupo: 12% menos dano enquanto ficarem perto de você.'),
  G('pal', 2, 'luzcura', 'Luz que Cura', 'cura', 'aliado', 1, 15, { heal: 0.3 }, 'Estende a mão: a luz fecha as feridas do companheiro (30% da vida).'),
  G('pal', 2, 'luzlevanta', 'Luz que Levanta', 'cura', 'aliado', 1, 120, { revive: 0.3 }, 'Ajoelha ao lado do caído e reza: ele se levanta com 30% da vida. Recarga longa.'),
  /* VAMPIRO: Caçada Noturna · Sangue Antigo · Fúria Rubra */
  G('vam', 0, 'olhosnoite', 'Olhos da Noite', 'olho', 'grupo', 10, 30, { crit: 0.1 }, 'O grupo enxerga como quem caça no escuro: +10% de crítico, e o que está escondido aparece.'),
  G('vam', 0, 'rastro', 'Rastro de Sangue', 'veloc', 'grupo', 8, 25, { move: 0.15 }, 'O cheiro do sangue puxa o grupo: +15% de velocidade.'),
  G('vam', 1, 'calice', 'Cálice Partilhado', 'cura', 'aliado', 1, 20, { heal: 0.25, cost: 0.15 }, 'Abre o pulso e dá de beber: você perde 15% da vida e o companheiro cura 25%.'),
  G('vam', 1, 'sedepartilhada', 'Sede Partilhada', 'forca', 'grupo', 10, 35, { leech: 0.05 }, 'A sede passa para o grupo: cada golpe devolve 5% do dano como vida.'),
  G('vam', 2, 'frenesirubro', 'Frenesi Rubro', 'veloc', 'grupo', 8, 30, { haste: 0.15 }, 'O sangue acelera: o grupo ataca 15% mais rápido.'),
  G('vam', 2, 'sanguefervente', 'Sangue Fervente', 'forca', 'aliado', 8, 20, { dmg: 0.2 }, 'Ferve o sangue do companheiro: ele bate 20% mais forte, e sente o calor.'),
  /* LOBISOMEM: Fúria da Lua · Pele Velha · Matilha */
  G('lob', 0, 'uivocaca', 'Uivo de Caça', 'forca', 'grupo', 8, 30, { dmg: 0.12 }, 'O uivo que abre a caçada: o grupo bate 12% mais forte.'),
  G('lob', 0, 'cheirosangue', 'Cheiro de Sangue', 'olho', 'grupo', 10, 30, { crit: 0.1 }, 'A matilha fareja o ferido: o grupo vê os inimigos machucados e ganha 10% de crítico.'),
  G('lob', 1, 'guardaninhada', 'Guarda da Ninhada', 'defesa', 'aliado', 6, 25, { redirect: 0.5 }, 'Salta até o companheiro ferido e se põe por cima: metade dos golpes nele vem para você.'),
  G('lob', 1, 'pelo', 'Pelo Eriçado', 'defesa', 'grupo', 8, 30, { def: 0.12 }, 'A matilha encosta ombro com ombro: o grupo recebe 12% menos dano.'),
  G('lob', 2, 'corrermatilha', 'Correr com a Matilha', 'veloc', 'grupo', 8, 25, { move: 0.2 }, 'Todos correm como um só: +20% de velocidade.'),
  G('lob', 2, 'lamber', 'Lamber Feridas', 'cura', 'aliado', 5, 20, { regen: 0.04 }, 'Cuida do companheiro como de um filhote: ele cura 4% da vida por segundo.'),
  /* MAGO: Tempestade · Égide · Fonte */
  G('mag', 0, 'armaencantada', 'Arma Encantada', 'forca', 'aliado', 12, 25, { dmg: 0.15 }, 'Escreve uma sílaba na arma do companheiro: os golpes dele levam raio, fogo ou gelo (+15% de dano).'),
  G('mag', 0, 'ventocauda', 'Vento em Cauda', 'veloc', 'grupo', 8, 25, { move: 0.15 }, 'Uma rajada pelas costas: o grupo anda 15% mais rápido.'),
  G('mag', 1, 'escudorunas', 'Escudo de Runas', 'defesa', 'aliado', 10, 25, { shield: 0.2 }, 'Um anel de runas gira em volta do companheiro e absorve dano (20% da vida dele).'),
  G('mag', 1, 'cupula', 'Cúpula Arcana', 'defesa', 'area', 6, 40, { def: 0.2 }, 'Marca o chão: uma cúpula azul. Quem é do grupo e está dentro recebe 20% menos dano.'),
  G('mag', 2, 'restauracao', 'Círculo de Restauração', 'cura', 'area', 6, 30, { regen: 0.05 }, 'Marca o chão: um círculo de luz clara. Quem é do grupo e pisa nele cura 5% da vida por segundo.'),
  G('mag', 2, 'fontearcana', 'Fonte Arcana', 'chama', 'grupo', 10, 40, { haste: 0.1, cleanse: true }, 'Abre a fonte: as maldições saem do grupo e as recargas correm mais depressa.'),
  /* BRUXO: Praga · Pacto de Sangue · Círculo. A cura do bruxo é amaldiçoada: vem da vida do inimigo, ou da dele mesmo. */
  G('bru', 0, 'sanguessuga', 'Maldição da Sanguessuga', 'cura', 'area', 8, 25, { leech: 0.08 }, 'Amaldiçoa os inimigos da área: quem é do grupo e bate neles recebe de volta 8% do dano como vida.'),
  G('bru', 0, 'pragafraca', 'Praga Enfraquecedora', 'defesa', 'area', 8, 30, { weaken: 0.15 }, 'Marca o chão: os inimigos dentro apodrecem por dentro e batem 15% mais fraco.'),
  G('bru', 1, 'pactopartilhado', 'Pacto Partilhado', 'cura', 'aliado', 1, 20, { heal: 0.3, cost: 0.15 }, 'Paga com o próprio sangue: você perde 15% da vida e o companheiro cura 30%.'),
  G('bru', 1, 'precosangue', 'Preço de Sangue', 'forca', 'aliado', 8, 25, { dmg: 0.2, cost: 0.08 }, 'Assina pelo companheiro: ele bate 20% mais forte, e você paga 8% da vida.'),
  G('bru', 2, 'circuloprofano', 'Círculo Profano', 'forca', 'area', 10, 35, { dmg: 0.12 }, 'Risca o círculo no chão: quem é do grupo e está dentro bate 12% mais forte.'),
  G('bru', 2, 'veusombras', 'Véu de Sombras', 'olho', 'grupo', 6, 30, { dodge: 0.15 }, 'A sombra cobre o grupo: os golpes passam por onde vocês não estão (+15% de esquiva).'),
  /* CAÇADOR DE DEMÔNIOS: Prata · Emboscada · Vigília */
  G('cac', 0, 'benzidas', 'Lâminas Benzidas', 'forca', 'grupo', 12, 35, { dmg: 0.08 }, 'Passa água benta nas armas do grupo: +8% de dano, e o dobro contra mortos-vivos e demônios.'),
  G('cac', 0, 'redeprata', 'Rede de Prata', 'forca', 'area', 6, 30, { guard: 0.5 }, 'Marca o chão: a rede de prata prende quem estiver ali, e a guarda deles quebra 50% mais rápido.'),
  G('cac', 1, 'sinalemboscada', 'Sinal de Emboscada', 'forca', 'grupo', 6, 30, { crit: 0.25 }, 'Dois dedos erguidos e um corte no ar: o próximo golpe de cada um do grupo tem +25% de crítico.'),
  G('cac', 1, 'fumaca', 'Fumaça de Ervas', 'veloc', 'area', 6, 30, { dodge: 0.15 }, 'Marca o chão: uma fumaça de ervas amargas. Quem é do grupo e está dentro ganha 15% de esquiva.'),
  G('cac', 2, 'vigiliapartilhada', 'Vigília Partilhada', 'olho', 'grupo', 10, 30, { crit: 0.1 }, 'O olho de Aravel abre para todos: +10% de crítico, e o que está escondido aparece.'),
  G('cac', 2, 'cantil', 'Água Benta no Cantil', 'chama', 'grupo', 1, 40, { heal: 0.1, cleanse: true }, 'Passa o cantil: as maldições saem do grupo e cada um cura 10% da vida.'),
];
/** as habilidades de grupo de uma classe, por caminho */
export const grupoDe = (kit: KitKey) => GRUPO_SKILLS.filter((s) => s.kit === kit);

/* AS CAPELAS DE AURÉON NAS VILAS HUMANAS (09/11, Erling: "o paladino tem a Abadia como líder-mãe, mas todas as vilas têm igrejas e pessoas que
   precisam de ajuda; o paladino é antes de tudo um andarilho do bem que segue o seu rumo pelo mundo livrando-o do mal"). world.ts põe a capela e o
   clérigo em cada vila daqui; andarilho.ts faz a cadeia do paladino passar por elas. [vila, clérigo, o mal que aflige, o bicho que o paladino enfrenta] */
import type { EnemyType } from './world';
export const CHAPELS: [string, string, string, EnemyType][] = [
  ['Vestheim', 'Irmã Brígida', 'Os javalis do pântano entraram no cemitério da capela e reviram as covas. As mães não deixam as crianças rezarem lá.', 'boar'],
  ['Lundr', 'Irmão Anselmo', 'Os lobos sabem contar: contam os sinos e vêm na hora da última reza. Três fiéis feridos este mês.', 'wolf'],
  ['Skógar', 'Irmã Clemência', 'Um caçador voltou da mata com a mão podre e jura que foi um morto que o mordeu. Agora são vários mortos.', 'zombie'],
  ['Myrbakki', 'Irmão Cosme', 'A turfa queima de dentro, e do fogo saem diabretes que roubam as velas do altar.', 'imp'],
  ['Steinfoss', 'Irmão Teodoro', 'A Garganta ecoa à noite. Ontem o eco respondeu com os ossos de quem caiu nela.', 'skeleton'],
  ['Grenivik', 'Irmã Felícia', 'Carniçais desenterraram os pais de metade da vila. Ninguém aqui dorme sem a vela acesa.', 'ghoul'],
  ['Vatnaholt', 'Irmão Matias', 'Salteadores cobram pedágio na porta da capela. Dizem que é “dízimo”.', 'bandit'],
  ['Brekkuvik', 'Irmã Teresa', 'As aranhas teceram a porta da capela inteira numa noite. Quem tentou abrir não saiu.', 'spider'],
  ['Dalborg', 'Irmão Inácio', 'Última vila antes da selva: os licantropos jovens testam a cerca toda lua cheia. A Mãe-Alfa diz que não mandou.', 'werewolf'],
  ['Vindholt', 'Irmã Rosana', 'Os ventos do mar trazem afogados que andam. Eles batem na porta da capela pedindo para entrar.', 'drowner'],
];

/* A FAUNA DE KARMIKA (17/11, Erling: "fauna tem que fazer": aves, peixes, coelhos, corujas, cachorros).
   Bichos de cenário: não lutam, não dão saque, não têm colisão. Existem só em volta de quem joga e somem quando ficam longe.
   Este arquivo diz QUEM vive ONDE e QUANTOS. Os modelos estão em modelos.ts e o comportamento em index.ts. */
import type { Biome } from '../world';

/** as aves de cada paisagem: cor do corpo, cor da asa e o tamanho */
export interface Ave { nome: string; corpo: number; asa: number; tam: number }
export const AVES: Record<string, Ave> = {
  pardal: { nome: 'pardal', corpo: 0x8a6a4a, asa: 0x5a4030, tam: 1.6 },
  azulao: { nome: 'azulão', corpo: 0x3a6ad0, asa: 0x24408a, tam: 1.6 },
  gaivota: { nome: 'gaivota', corpo: 0xf2f2f0, asa: 0xb8bcc4, tam: 2.2 },
  corvo: { nome: 'corvo', corpo: 0x16141a, asa: 0x0c0a10, tam: 2.0 },
  tordo: { nome: 'tordo-da-neve', corpo: 0xe8eef4, asa: 0xa8b4c4, tam: 1.7 },
  arara: { nome: 'arara', corpo: 0xd03a2a, asa: 0x2a5ad0, tam: 2.1 },
  beijaflor: { nome: 'beija-flor encantado', corpo: 0x9a6aff, asa: 0x5ae0d0, tam: 1.2 },
};
/** quais aves voam em cada paisagem */
export const AVES_DE: Record<Biome, string[]> = {
  meadow: ['pardal', 'azulao'], forest: ['azulao', 'pardal'], swamp: ['corvo', 'pardal'], snow: ['tordo'], ruins: ['corvo'], rock: ['corvo', 'pardal'],
  volcanic: ['corvo'], enchanted: ['beijaflor', 'azulao'], blight: ['corvo'], jungle: ['arara', 'azulao'], coast: ['gaivota'],
};
/** onde há coelho, e de que cor (a lebre da neve é branca) */
export const COELHO_DE: Partial<Record<Biome, number>> = { meadow: 0xa08060, forest: 0x8a6a4a, snow: 0xf0f2f4, enchanted: 0xd8c8ff, coast: 0xb09070 };
/** onde a coruja pousa à noite */
export const CORUJA_EM: Biome[] = ['forest', 'meadow', 'enchanted', 'snow', 'swamp', 'jungle'];
/** pelagens dos cachorros de vila */
export const PELAGENS = [0xa87848, 0x3a2a20, 0xe0d0b0, 0x6a6a6a, 0xc09a60, 0x1c1a1a];

/** quantos de cada bicho existem, no máximo, em volta de quem joga */
export const LIMITE = { bandos: 2, noChao: 3, coelhos: 3, corujas: 2, caes: 2 };
/** a que distância eles nascem e a partir de onde somem (m) */
export const NASCE = 34, SOME = 62;
/** o coelho e a ave no chão fogem quando o herói chega a esta distância (m) */
export const SUSTO = 5.5;

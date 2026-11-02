/* Juramentos de roleplay (24/10): os votos que o herói pode jurar ao entrar na classe, e quais cada caminho oferece. Saiu do main.ts (02/11). */
export const VOWS: Record<string, { name: string; text: string; why: string }> = {
  mortos: { name: 'Voto contra a Morte que Anda', text: 'Nunca fugirei de um morto-vivo.', why: 'Você fugiu de um morto-vivo que o caçava.' },
  inocente: { name: 'Voto do Sangue Limpo', text: 'Nunca derramarei sangue inocente.', why: 'Você matou uma criatura que não fazia mal a ninguém.' },
  verdade: { name: 'Voto da Palavra', text: 'Nunca mentirei.', why: 'Você mentiu, e a mentira ficou registrada.' },
  misericordia: { name: 'Voto da Misericórdia', text: 'Nunca matarei quem se render.', why: 'Você matou quem tinha se rendido.' },
};
export const VOW_FOR: Record<string, string[]> = { pal: ['mortos', 'misericordia', 'verdade'], cac: ['mortos', 'inocente', 'verdade'], gue: ['mortos', 'misericordia', 'verdade'], vam: ['inocente', 'misericordia', 'verdade'], lob: ['inocente', 'misericordia', 'verdade'], mag: ['verdade', 'inocente', 'misericordia'], bru: ['verdade', 'misericordia', 'inocente'], tec: ['verdade', 'inocente', 'misericordia'] };

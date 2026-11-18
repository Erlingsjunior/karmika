/* O PULO DA MONTARIA (12/11, Erling: "montarias pulam com a barra e não dão dash; elas podem pular pequenos rios e canais").
   Montado, a barra de espaço não é esquiva: é um salto para a frente. No ar o cavalo não nada nem derruba o cavaleiro, então um riacho ou um canal
   estreito fica para trás. Se o salto termina em água funda, vale a regra de sempre (o cavaleiro desmonta e nada). */
export const PULO_DUR = 0.55, PULO_ALT = 1.7;
export const pulo = { /** segundos de salto que ainda restam */ t: 0 };

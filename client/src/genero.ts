/* Gênero do herói no texto (25/10/2026, Erling): "o herói é masculino; na dúvida, masculino".
   Toda fala que se dirige ao herói escreve as duas formas assim: {o|a}, {recém-chegado|recém-chegada}, {Volte inteiro|Volte inteira}.
   A primeira forma é a masculina (padrão); a segunda só aparece quando o jogador escolheu mulher. */
let sexOf: () => 'm' | 'f' = () => 'm';
export function setHeroSex(f: () => string | undefined | null) { sexOf = () => (f() === 'f' ? 'f' : 'm'); }
export function heroSex() { return sexOf(); }
/** troca cada {masc|fem} pela forma do herói atual */
export function G(s: string): string { if (!s || s.indexOf('{') < 0) return s; const f = sexOf() === 'f'; return s.replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_m, a: string, b: string) => (f ? b : a)); }

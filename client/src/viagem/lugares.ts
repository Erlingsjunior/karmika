/* LUGARES ENCONTRADOS E VIAGEM PELO MAPA (fila de 13/11, Erling: "maravilhas, lugares e relíquias já encontrados uma vez podem ser visitados
   direto pelo mapa; cada tipo com uma cor e um símbolo; no modo Deus, todos liberados").
   Aqui fica só a memória do que o jogador já encontrou e a cor de cada tipo. As pedras de runa já tinham a sua viagem (o mapa as mostra em azul);
   as Fontes da Visão usam a lista de fontes já vistas que o jogo guarda. */
const KEY = 'karmika.lugares.v1';
let vistos = new Set<string>(); try { vistos = new Set(JSON.parse(localStorage.getItem(KEY) || '[]') as string[]); } catch { /* */ }
/** o herói chegou a este lugar: fica lembrado. Devolve true se era novo. */
export function encontrou(nome: string): boolean { if (vistos.has(nome)) return false; vistos.add(nome); try { localStorage.setItem(KEY, JSON.stringify([...vistos])); } catch { /* */ } return true; }
export const jaEncontrou = (nome: string) => vistos.has(nome);
export type TipoLugar = 'maravilha' | 'lugar' | 'masmorra' | 'fonte';
/** a cor do anel de cada tipo no mapa quando dá para viajar até ele (as pedras de runa são azuis, como já eram) */
export const COR_VIAGEM: Record<TipoLugar, string> = { maravilha: '#ffd24a', lugar: '#7ae08a', masmorra: '#ff8a6a', fonte: '#6ad8ff' };
export const NOME_TIPO: Record<TipoLugar, string> = { maravilha: 'Maravilha', lugar: 'Lugar', masmorra: 'Masmorra', fonte: 'Fonte da Visão' };
/** a que distância (em casas) o lugar conta como encontrado */
export const RAIO_ENCONTRO = 12;

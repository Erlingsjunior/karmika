/* ---------- A alma: Fio da Vida, desencarne e reencarnação (Erling, 23/10) ----------
   - Fio da Vida: 3 fôlegos. Morrer com fôlego é uma QUEDA (volta na fonte, como sempre) e gasta um.
     Um fôlego volta a cada dia real. Antes do nível 20 (o Olho ainda dorme) o Fio não se desgasta.
   - Sem fôlego, a alma DESENCARNA e escolhe:
       1. Mesmo corpo: volta igual, devendo uma Dívida Kármica de XP (2 níveis). Metade do XP ganho paga a dívida.
       2. Reencarnar: nova raça e aparência, mesmo nível, mochila, ouro, cofre e missões; volta SEM classe.
          Escolher a mesma classe de novo dá 4× XP de classe até o nível de classe antigo (chega lá em ~25% do tempo).
          Magias e atributos voltam para redistribuir.
       3. Lágrima do Olho: volta sem penalidade, no lugar sagrado da classe. Lágrimas caem dos atos heroicos.
   - O karma é da alma: atravessa todas as vidas. As vidas passadas ficam escritas. */

export type Life = { name: string; origin: string; cls: string; clsLvl: number; lvl: number; karma: number; /** karma acumulado naquela vida */ luz?: number; sombra?: number; end: 'corpo' | 'reencarne' | 'lagrima'; at: number };
export type Soul = { breaths: number; regenAt: number; tears: number; debt: number; catchup: { cls: string; until: number } | null; karma: number; /** karma acumulado sem teto desta vida (zera ao desencarnar) */ luzT?: number; sombraT?: number; /** a natureza do caminho já foi aplicada (27/10) */ natSet?: string; /** atravessou o zero pelo ritual (27/10) */ outcast?: 'renegado' | 'desgarrado' | null; lives: Life[]; pending?: 'choose' | 'reborn' | null; /** já ganhou a Lágrima do nascimento (nível 20, o Olho abre) */ born?: boolean;
  /** inclinação da alma pelas palavras (24/10): luz = compaixão, honra, verdade; sombra = cobiça, crueldade, mentira. Atravessa as vidas */ luz?: number; sombra?: number;
  /** marcas que o mundo lembra (respostas, promessas, mentiras): os NPCs comentam */ marks?: string[] };

const KEY = 'karmika.soul.v1';
export const MAX_BREATHS = 3, MAX_TEARS = 3, FRAY_LVL = 20, CATCHUP_MUL = 4, DEBT_SHARE = 0.5;
const DAY = 86_400_000;
/** classes de raça (antes da Vidente): reencarnar numa raça diferente ainda conta como "a mesma classe" */
export const BASE_CLASSES = ['Humano', 'Anão', 'Elfo'];

export function createSoul() {
  const fresh = (): Soul => ({ breaths: MAX_BREATHS, regenAt: Date.now(), tears: 0, debt: 0, catchup: null, karma: 0, lives: [] });
  let s: Soul = fresh();
  try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o) s = { ...fresh(), ...o }; } catch { /* */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* */ } };
  /** fôlegos voltam com o tempo real: um por dia, até 3 */
  function regen() {
    if (s.breaths >= MAX_BREATHS) { s.regenAt = Date.now(); return; }
    const n = Math.floor((Date.now() - s.regenAt) / DAY); if (n <= 0) return;
    s.breaths = Math.min(MAX_BREATHS, s.breaths + n); s.regenAt += n * DAY; if (s.breaths >= MAX_BREATHS) s.regenAt = Date.now(); save();
  }
  regen();
  const sameClass = (a: string, b: string) => a === b || (BASE_CLASSES.includes(a) && BASE_CLASSES.includes(b));
  return {
    get s() { return s; }, save, regen, sameClass,
    reset() { s = fresh(); save(); },
    /** horas até o próximo fôlego (para o texto) */
    nextBreathH() { return s.breaths >= MAX_BREATHS ? 0 : Math.max(1, Math.ceil((s.regenAt + DAY - Date.now()) / 3_600_000)); },
    addTear() { if (s.tears >= MAX_TEARS) return false; s.tears++; save(); return true; },
    /** XP que entra: a dívida come metade até zerar; a classe ganha 4× enquanto estiver abaixo do nível da vida passada */
    filter(n: number, c: { name: string; lvl: number }) {
      let paid = 0;
      if (s.debt > 0) { paid = Math.min(s.debt, Math.round(n * DEBT_SHARE)); s.debt -= paid; }
      let cmul = 1, echoDone = false;
      if (s.catchup && sameClass(c.name, s.catchup.cls)) { if (c.lvl < s.catchup.until) cmul = CATCHUP_MUL; else { s.catchup = null; echoDone = true; } }
      if (paid || echoDone) save();
      return { n: n - paid, paid, cmul, debtLeft: s.debt, echoDone };
    },
  };
}
export type SoulSys = ReturnType<typeof createSoul>;

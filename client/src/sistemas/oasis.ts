/* O OÁSIS DA MIRAGEM (02/11, Erling: "um gênio da ilusão que engana os que passam dizendo que podem beber, mas lhes entrega areia
   para morrerem; um elite escondido no lago").
   Quem chega à beira do lago com o Gênio vivo (escondido na água) ouve a voz dele oferecendo de beber:
   - beber: a boca se enche de areia (dano pesado e lentidão), e Sheitã sobe rindo;
   - recusar: ele sobe do mesmo jeito, ofendido.
   A oferta volta a cada nova chegada (depois de se afastar 30 m). A missão é a do Cameleiro de Vindholt (quests.ts, "O Gênio do Lago"). */
import type * as THREE from 'three';
import { WILD } from '../world';
import { TILE_M as T } from '@karmika/shared';

export interface OasisCtx {
  /** o jogo (bichos, vida do herói, mensagens) */
  readonly game: { enemies: { list: { type: string; alive: boolean; pos: THREE.Vector3; state: string; t: number }[] }; st: { hp: number; hpMax: number; dead?: boolean }; logMsg(t: string, c?: string): void; dmgText(p: THREE.Vector3, t: string, big?: boolean, col?: string): void; slow?(k: number, sec: number): void };
  readonly heroPos: () => THREE.Vector3;
  readonly openDlg: (o: { name: string; role: string; portrait: null; text: string; choices: ({ kind: 'custom'; label: string; hint?: string; cb: () => void } | { kind: 'close'; label: string })[]; onAccept: () => void; onTurnIn: () => void }) => void;
  /** dentro de casa/masmorra/cena: não oferece nada */
  readonly busy: () => boolean;
  readonly shake?: (k: number) => void;
}

export function createOasis(K: OasisCtx) {
  const O = WILD.find((w) => w.kind === 'oasis'); if (!O) return { tick() { /* */ } };
  const cx = O.x * T, cz = O.y * T, R = ((O.lake ?? 6) + 5) * T; // a voz chega na beira (11 casas do centro)
  let offered = false;
  const djinn = () => K.game.enemies.list.find((e) => e.type === 'djinn' && e.alive && Math.hypot(e.pos.x - cx, e.pos.z - cz) < 30);
  function wake(e: NonNullable<ReturnType<typeof djinn>>) { (e as unknown as { woke: boolean }).woke = true; if (e.state !== 'idle') { e.state = 'idle'; e.t = 0; } /* no 'idle' o bicho de tocaia sai da água e já parte para cima (enemies.ts) */ setTimeout(() => { (e as unknown as { woke: boolean }).woke = false; }, 20000); }
  function tick() {
    if (K.busy() || K.game.st.dead) return; const h = K.heroPos(), d = Math.hypot(h.x - cx, h.z - cz);
    if (d > R * 2.7) { offered = false; return; } if (offered || d > R) return;
    const e = djinn(); if (!e || (e as unknown as { hid?: boolean }).hid === false) return; offered = true;
    K.openDlg({ name: 'Uma voz na água', role: 'Oásis da Miragem', portrait: null,
      text: 'Viajante… você atravessou a areia inteira. Os lábios rachados, a garganta de couro. Ajoelhe-se na beira e beba. A água é doce, é fria, é sua. De graça. Eu insisto.',
      choices: [
        { kind: 'custom', label: 'Ajoelhar e beber', hint: 'a água parece mesmo fresca…', cb: () => {
          const st = K.game.st, dmg = Math.round(st.hpMax * 0.35); st.hp = Math.max(1, st.hp - dmg); K.shake?.(0.5); K.game.slow?.(0.5, 6);
          K.game.dmgText(h.clone().setY(h.y + 2.4), `−${dmg} AREIA`, true, '#d8b070');
          K.game.logMsg('🏜 Não era água. A boca se enche de areia quente, a garganta fecha, os olhos ardem. Do fundo do lago, alguém ri.', '#d8b070');
          K.game.logMsg('“Bebeu tudo, como os outros. Agora fique… para sempre, como eles.” — Sheitã, o Gênio da Ilusão', '#6ad8ff'); wake(e); } },
        { kind: 'custom', label: '“Não bebo do que não vejo o fundo.”', hint: 'recusar', cb: () => {
          K.game.logMsg('“Desconfiado… Os desconfiados morrem devagar. Eu prefiro depressa.” — Sheitã sobe do lago, feito de água e areia.', '#6ad8ff'); wake(e); } },
        { kind: 'close', label: 'Afastar-se da margem em silêncio.' },
      ], onAccept: () => { /* */ }, onTurnIn: () => { /* */ } });
  }
  return { tick };
}

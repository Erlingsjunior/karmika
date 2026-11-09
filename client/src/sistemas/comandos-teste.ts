/* COMANDOS DE TESTE DO BETA (chat): /morrer, /folegos, /lagrimas, /nivel, /classe, /aprender, /arma, /pele, /ir e os outros. Saiu do main.ts (02/11). */
import { addHonor, honor } from './honra';
import { ITEMS as ITEMS_TBL } from '../inventory';
import { BASES, genGear } from '../loot';
import { MAX_BREATHS, FRAY_LVL } from '../soul';
import { PATHS } from '../vidente';
import { KITS, refreshLocks } from '../kits';
import { TILE_M as T } from '@karmika/shared';
import type { ComandosTesteCtx } from '../main';

export function createComandosTeste(K: ComandosTesteCtx) {
/* comandos de teste do beta (chat): /morrer, /folegos N, /lagrimas N, /nivel N, /ajuda */
const BETA_TOOLS = true;
function betaCommand(cmd: string, a: string[]): string | null {
  /* /obra: adianta 25% da obra (teste, Erling 28/10) — /obra 50 adianta 50% */
  if (cmd === 'obra') { const pc = Math.max(1, Math.min(100, Number(a[0]) || 25)); return K.obras.advance(pc / 100) ? `🏗 (teste) +${pc}% de obra: ${Math.round((K.obras.home!.done / K.obras.home!.work) * 100)}% pronta.` : '🏗 Você não tem obra em andamento.'; }
  /* EMOTES (28/10, Erling): /dance faz o personagem dançar (até você andar); /beber, uma caneca de cerveja na mão. Os outros jogadores veem. */
  if (cmd === 'dance' || cmd === 'dancar' || cmd === 'dançar' || cmd === 'danca' || cmd === 'dança') { if (K.inside && !K.inside.prop) return '💃 Aqui não dá para dançar.'; K.emote.dance = true; K.emote.x = K.state.fx; K.emote.y = K.state.fy; K.hero.stopAct?.(); return '💃 Você começa a dançar. (ande para parar)'; }
  if (cmd === 'beber' || cmd === 'brinde' || cmd === 'cerveja' || cmd === 'drink') { K.emote.dance = false; K.hero.stopAct?.(); K.hero.drinkProp = 'mug'; K.hero.act('drink', true); K.netRef?.act('drink'); K.audio.gulp(); setTimeout(() => K.audio.gulp(), 380); return '🍺 Você vira uma caneca de cerveja. Saúde!'; }
  if (!BETA_TOOLS) return null; const n = Math.round(Number(a[0]));
  if (cmd === 'ajuda' || cmd === 'help') return 'Gestos: /dance · /beber. Teste (beta): /classe <vam|lob|mag|bru|pal|cac|tec> (vira a classe) · /pele <id|auto> (modelo do Herik) · /armas [rara|epica] (todas as armas e escudos) · /tabuas /prego /madeira /pedra /corda /galho (+1000) · /gold (+10.000) · /morrer · /folegos 0-3 · /lagrimas 0-3 · /nivel 1-150 · /limiar (abre o Limiar sem morrer) · /masmorra [nome] (vai até a entrada) · /guerreiro (vira guerreiro do Norte) · /ir <NPC ou lugar> (ex.: /ir hrefna)';
  { const MAT: Record<string, string> = { prego: 'nail', pregos: 'nail', madeira: 'wood', tabua: 'plank', tabuas: 'plank', 'tábuas': 'plank', pedra: 'stone', pedras: 'stone', corda: 'rope', cordas: 'rope', galho: 'stick', galhos: 'stick' };
    if (MAT[cmd]) { const id = MAT[cmd], q = n > 0 ? n : 1000; K.inv.grant(id, q); return `🧪 (teste) +${q} ${ITEMS_TBL[id]?.icon ?? ''} ${ITEMS_TBL[id]?.name ?? id}.`; }
    /* /armas: uma de cada arma e escudo na mochila (teste de visual, Erling 01/11); /armas rara, /armas epica… escolhe a raridade; o baú recebe o que não couber */
    /* /equipar [rara|epica|lendaria]: um conjunto inteiro do seu nível vestido (teste de equilíbrio, 07/11) */
    if (cmd === 'equipar' || cmd === 'conjunto') { const rr = ({ magica: 'magic', rara: 'rare', epica: 'epic', épica: 'epic', lendaria: 'legendary', lendária: 'legendary' } as Record<string, string>)[a[0] ?? ''] ?? 'rare'; let n = 0; K.inv.wipeGear?.();
      for (const sl of ['weapon', 'shield', 'helm', 'armor', 'boots', 'ring', 'ring2', 'amulet', 'earring', 'earring2', 'shoulders', 'cape'] as const) { const g = genGear(Math.max(1, K.game.st.lvl), rr as never, sl === 'ring2' ? 'ring' : sl === 'earring2' ? 'earring' : sl); (g as { slot: string }).slot = sl === 'ring2' ? 'ring' : sl === 'earring2' ? 'earring' : sl; if (K.inv.addGear(g)) { K.inv.equipGear(g.uid); n++; } }
      K.inv.recalc?.(); return `🧪 (teste) ${n} peças ${rr} do nível ${K.game.st.lvl} vestidas.`; }
    if (cmd === 'armas' || cmd === 'arsenal') { const rr = ({ magica: 'magic', mágica: 'magic', rara: 'rare', epica: 'epic', épica: 'epic', lendaria: 'legendary', lendária: 'legendary' } as Record<string, string>)[a[0] ?? ''] ?? 'normal'; let n = 0, over = 0;
      for (const sl of ['weapon', 'shield'] as const) for (const b of BASES[sl]) { const g = genGear(Math.max(1, K.game.st.lvl), rr as never, sl, b.n); if (K.inv.addGear(g)) n++; else over++; }
      return `🧪 (teste) ${n} peças na mochila${over ? ` (+${over} não couberam: esvazie a mochila e repita)` : ''}.`; }
    /* /arma <nome>: cria e veste a arma (teste, 02/11) — /arma Florete, /arma Besta de Mão, /arma Kunai, /arma Garras de Ferro */
    if (cmd === 'arma') { const nm = a.join(' ').trim().toLowerCase(); const b = BASES.weapon.find((x) => x.n.toLowerCase() === nm) ?? BASES.weapon.find((x) => x.n.toLowerCase().startsWith(nm)); if (!b) return `Não conheço "${nm}". Tenho: ${BASES.weapon.map((x) => x.n).join(', ')}`;
      const g = genGear(Math.max(1, K.game.st.lvl), 'rare' as never, 'weapon', b.n); if (!K.inv.addGear(g)) return '🎒 Mochila cheia.'; const logs: string[] = []; const lm0 = K.game.logMsg; (K.game as unknown as { logMsg: (t: string, c?: string) => void }).logMsg = (t: string, c?: string) => { logs.push(t); lm0(t, c); }; try { K.inv.equipGear(g.uid); } finally { (K.game as unknown as { logMsg: typeof lm0 }).logMsg = lm0; } const EQ = K.inv.eq as Record<string, { uid?: number } | undefined>, inL = EQ.shield?.uid === g.uid; const why = EQ.weapon?.uid === g.uid || inL ? '' : ` — não vestiu: ${(g.only && !K.walksPath(g.only)) ? 'caminho não liberado (' + g.only + ', path=' + (K.profile?.path ?? '—') + ')' : 'regra da classe ' + K.kitRace() + ' · ' + logs.join(' | ')}`; return `🧪 (teste) ${b.n}${why || (inL ? ' na mão esquerda.' : ' na mão.')}`; }
    if (cmd === 'gold' || cmd === 'ouro') { const q = n > 0 ? n : 10000; K.game.st.gold += q; return `🧪 (teste) +${q} 🪙 ouro.`; } }
  if (cmd === 'som') { const r = `🔊 ${K.audio.whatPlays()} · lua=${K.luaK.toFixed(2)} aurora=${K.aurK.toFixed(2)} global=${K.gCur ?? '—'}`; console.log(r); return r; }
  if (cmd === 'perf') { const r = K.perfReport(); console.log(r); return r; }
  if (cmd === 'morrer') { if (K.game.st.dead) return 'Você já caiu.'; K.game.st.hp = 1; K.game.damage(99999, K.hero.root.position); return `☠ Você caiu de propósito. Fôlegos antes da queda: ${K.soul.s.breaths}/${MAX_BREATHS}${K.game.st.lvl < FRAY_LVL ? ` (antes do nível ${FRAY_LVL}, com o Olho ainda dormindo, o Fio não se gasta: use /nivel ${FRAY_LVL})` : ''}.`; }
  if (cmd === 'folegos' || cmd === 'fôlegos') { if (!(n >= 0 && n <= MAX_BREATHS)) return `Uso: /folegos 0-${MAX_BREATHS}`; K.soul.s.breaths = n; K.soul.s.regenAt = Date.now(); K.soul.save(); return `🕯 Fio da Vida: ${n}/${MAX_BREATHS}.`; }
  if (cmd === 'lagrimas' || cmd === 'lágrimas') { if (!(n >= 0 && n <= 9)) return 'Uso: /lagrimas 0-9'; const c = K.inv.count('lagrima'); if (n > c) K.inv.add('lagrima', n - c, true); else if (n < c) K.inv.take('lagrima', c - n); return `💧 Lágrimas do Olho na mochila: ${n}.`; }
  if (cmd === 'pele') { /* 01/11: veste qualquer modelo do Herik para teste (/pele vampiro_m, /pele mago_h, /pele auto para voltar à regra) */
    const id = (a[0] ?? '').trim(); if (!id || id === 'auto') { K.peleSys.forcedSkin = null; K.peleSys.skinKey = ''; K.applyArtSkin(); return 'Pele pela regra do jogo.'; } if (!K.ART_SET.has(id)) return `Não existe "${id}". Tenho: ${[...K.ART_SET].join(', ')}`; K.peleSys.forcedSkin = id; K.peleSys.skinKey = ''; K.applyArtSkin(); return `Pele: ${id}.`; }
  /* 02/11 (Erling: "quando eu mudo de classe preciso que zerem todos os pontos de força, vitalidade, destreza… e todos os pontos de skills"):
     nos comandos de teste a troca é limpa — atributos voltam para a bolsa de pontos, a Árvore inteira é zerada (pontos livres) e só
     a classe nova aparece (o histórico de classes do teste é apagado) */
  const cleanSwitch = () => { const n = K.inv.respec?.() ?? 0; (K.game as unknown as { clearClassPast?: () => void }).clearClassPast?.();
    K.tree.wipe(); K.tree.setView(null); K.applyKitAll(); return ` Atributos zerados (${n} pontos de volta) e Árvore zerada: ${K.tree.available()} pontos livres em K.`; };
  /* /classe <vam|lob|mag|bru|pal|cac|tec|hum>: vira a classe na hora (teste, 02/11) — para provar as magias e poses de cada caminho sem fazer a missão */
  /* 08/11: /honra N dá N pontos de Honra Kármica (teste das lojas de honra) */
  if (cmd === 'honra') { const n = Math.max(1, Math.min(5000, Math.round(Number(a[0]) || 100))); addHonor(n, 'teste'); return `🏅 (teste) +${n} de Honra Kármica (${honor()} no total).`; }
  if (cmd === 'classe' || cmd === 'class') { const id = (a[0] ?? '').toLowerCase(); const p = PATHS.find((x) => x.id === id || x.cls.toLowerCase().startsWith(id)); if (!p) return `Uso: /classe ${PATHS.map((x) => x.id).join('|')}`; if (K.profile) { K.profile.path = p.id; try { localStorage.setItem('karmika.char.v1', JSON.stringify(K.profile)); } catch { /* */ } } try { if (!K.quests.q.done.includes('v_' + p.id)) K.quests.q.done.push('v_' + p.id); } catch { /* */ } /* as armas do caminho (only) ficam liberadas como para quem fez a missão */ if (K.game.st.lvl < 20) { const d = 20 - K.game.st.lvl; K.game.st.lvl = 20; K.game.st.xp = 0; K.game.st.points += d * 3; K.game.st.recalc?.(); } K.takeClass(p); return `🧪 (teste) classe: ${p.cls}.` + cleanSwitch(); }
  /* /aprender: investe 1 ponto em cada magia da classe que já pode (teste, 02/11) — para ver todas as poses e magias de uma vez */
  if (cmd === 'aprender' || cmd === 'learn') { let n = 0; for (let pass = 0; pass < 3; pass++) for (const d of KITS[K.kitRace()] ?? []) if (!K.tree.has(d.id) && K.tree.invest(d.id)) n++; K.applyKitAll(); refreshLocks(K.kitRace(), K.game.st.lvl, (k) => K.tree.rank(k)); return `🧪 (teste) ${n} magias aprendidas (pontos: ${K.tree.available()}).`; }
  if (cmd === 'nivel' || cmd === 'nível') { if (!(n >= 1 && n <= 150)) return 'Uso: /nivel 1-150'; const d = n - K.game.st.lvl; K.game.st.lvl = n; K.game.st.xp = 0; if (d > 0) K.game.st.points += d * 3; K.game.st.recalc?.(); K.game.st.hp = K.game.st.hpMax; K.inv.save?.();
    if (n < FRAY_LVL && K.profile?.eye) { K.profile.eye = false; localStorage.setItem('karmika.char.v1', JSON.stringify(K.profile)); K.crestEl.classList.remove('awake'); return `★ Nível ${n} (teste). O Olho voltou a dormir: ele abre de novo no nível ${FRAY_LVL}.`; }
    return `★ Nível ${n} (teste).${n >= FRAY_LVL && !K.profile?.eye ? ' O Olho vai abrir.' : ''}`; }
  if (cmd === 'masmorra' || cmd === 'masmorras') { const id = (a[0] || '').toLowerCase(), L = K.dgs.entrances, nm = (e: (typeof L)[number]) => e.d.name.toLowerCase(), en = L.find((e) => e.d.id === id) ?? (id.length > 2 ? L.find((e) => nm(e).split(/[\s,'-]+/).some((w) => w.startsWith(id))) ?? L.find((e) => nm(e).includes(id)) : undefined); /* 04/11: 'uivo' achava 'Arq-uivo' — agora a palavra que começa com o termo vem antes */
    if (!id || !en) return 'Masmorras: ' + K.dgs.entrances.map((e) => `${e.d.id} (${e.lvl[0]}–${e.lvl[1]})`).join(' · ') + ' — use /masmorra <nome> para ir até a entrada.';
    if (K.inside) return 'Saia do interior primeiro.'; K.state.fx = en.x + 0.5; K.state.fy = en.y + 3; return `🕳 Você está na entrada de ${en.d.name} (nível ${en.lvl[0]}–${en.lvl[1]}). Aperte E para entrar.`; }
  if (cmd === 'ir') { const q = a.join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''), nz = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!q) return 'Uso: /ir <NPC ou lugar> — ex.: /ir hrefna · /ir askavik · /ir brasaforja'; if (K.inside) return 'Saia do interior primeiro.';
    const n = K.npcSys.npcs.find((v) => nz(v.def.name).includes(q)); if (n) { K.state.fx = n.pos.x / T; K.state.fy = n.pos.z / T + 1.2; return `🧭 Você está ao lado de ${n.def.name}. Aperte E para conversar.`; }
    if (q.startsWith('cais ')) { const dk = (K.city.docks ?? []).find((v) => nz(v.name).includes(q.slice(5))); if (dk) { K.state.fx = dk.x + 0.5; K.state.fy = dk.y + 0.5; return `⚓ Você está no cais de ${dk.name}.`; } }
    const p = K.city.settlements.find((v) => nz(v.name).includes(q)) ?? K.city.pois.find((v) => nz(v.name).includes(q)); if (p) { K.state.fx = p.x + 0.5; K.state.fy = p.y + 2; return `🧭 Você chegou a ${p.name}.`; }
    return `Não achei “${a.join(' ')}”.`; }
  /* 29/10 (Erling): /guerreiro, /paladino, /cacador, /tecnocrata, /vampiro, /lobisomem, /mago, /bruxo — teste: sobe para o
     nível 30 se precisar e faz a mudança de classe de verdade (como a prova do mestre): a Árvore ganha a aba da classe nova */
  { const nz = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); const P = PATHS.find((q) => nz(q.name).split(' ')[0] === nz(cmd) || q.id === nz(cmd));
    if (P && cmd !== 'ir') { if (!K.profile) return 'Agora não.'; let ci = { name: 'Humano' }; try { ci = K.game.classInfo; } catch { /* */ } if (ci.name === P.cls) return `Você já é ${P.cls}.`;
      if (K.game.st.lvl < 20) { const d = 20 - K.game.st.lvl; K.game.st.lvl = 20; K.game.st.xp = 0; K.game.st.points += d * 3; K.game.st.recalc?.(); K.game.st.hp = K.game.st.hpMax; K.inv.save?.(); }
      K.profile.path = P.id as never; localStorage.setItem('karmika.char.v1', JSON.stringify(K.profile)); K.quests.markDone('v_' + P.id); K.applyArtSkin(); K.takeClass(P); const cs = cleanSwitch();
      return `⚔ (teste) Você agora é ${P.cls} (nível ${K.game.st.lvl}).${cs}`; } }
  if (cmd === 'limiar') { if (!K.profile || K.limiar.active) return 'Agora não.'; K.soul.s.pending = 'choose'; K.soul.save(); K.unbind(); return '👁 A alma sobe ao Limiar (teste).'; }
  return null;
}
  return { betaCommand };
}

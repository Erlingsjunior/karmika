/* TRAVA AUTOMÁTICA DE EQUILÍBRIO (11/11). Roda antes do build (npm run build) e sozinha (npm run equilibrio).
   Confere as regras de claude/equilibrio-e-grupo-11-11.md contra o código de verdade (src/dados-rpg.ts e src/grupo-habilidades.ts).
   Se uma mudança tirar qualquer número da faixa combinada com o Erling, o script falha e diz qual.
   O que ele NÃO faz ainda: simular cada classe com as magias de verdade (a simulação de 07/11 não está no repositório). */
import ts from 'typescript';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)), tmp = mkdtempSync(join(tmpdir(), 'karmika-eq-'));
async function load(rel) { const src = readFileSync(join(here, '..', 'src', rel), 'utf8'); const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: false, importsNotUsedAsValues: 0 } }).outputText; const f = join(tmp, rel.replace(/[\/.]/g, '_') + '.mjs'); writeFileSync(f, out); return import(pathToFileURL(f).href); }
const D = await load('dados-rpg.ts'), G = await load('grupo-habilidades.ts');
const fails = []; let n = 0;
const ok = (cond, msg) => { n++; if (!cond) fails.push(msg); };
const near = (a, b, e = 0.006) => Math.abs(a - b) <= e;

/* 1. diferença de nível (sozinho) */
{ const T = { 4: [1.35, 1.30], 5: [1.65, 1.55], 6: [2.0, 1.85], 7: [2.5, 2.2], 8: [3.2, 2.6] };
  for (const [dl, [hp, dm]] of Object.entries(T)) { const m = D.monMult(+dl, 1); ok(near(m.hp, hp) && near(m.dmg, dm), `nível +${dl}: esperado vida ×${hp} golpe ×${dm}, veio ×${m.hp} ×${m.dmg}`); }
  for (const dl of [-20, -8, -4, -1, 0]) { const m = D.monMult(dl, 1); ok(m.hp === 1 && m.dmg === 1, `nível ${dl}: para baixo tem que travar em ×1 (veio ×${m.hp} ×${m.dmg})`); }
  ok(D.monMult(3, 1).hp <= 1.13 && D.monMult(3, 1).dmg <= 1.11, 'até +3 o multiplicador tem que ser baixo (≤ ×1,12 e ×1,10)');
  ok(D.monMult(12, 1).hp === D.monMult(8, 1).hp, 'acima de +8 não cresce mais');
  for (let dl = -5; dl < 12; dl++) ok(D.monMult(dl + 1, 1).hp >= D.monMult(dl, 1).hp && D.monMult(dl + 1, 1).dmg >= D.monMult(dl, 1).dmg, `nível: o multiplicador não pode cair de ${dl} para ${dl + 1}`); }
/* 2. grupo de 1 a 8 */
{ const HP = [1, 1.7, 2.4, 3.1, 3.8, 4.5, 5.2, 5.9], DM = [1, 1.10, 1.18, 1.26, 1.33, 1.40, 1.46, 1.52], XP = [1, 1.15, 1.30, 1.45, 1.60, 1.75, 1.90, 2.05], IT = [1, 1.10, 1.20, 1.30, 1.40, 1.50, 1.60, 1.70];
  for (let g = 1; g <= 8; g++) { const m = D.monMult(0, g), p = D.grupoPremio(g); ok(near(m.hp, HP[g - 1]) && near(m.dmg, DM[g - 1]), `grupo de ${g}: esperado vida ×${HP[g - 1]} golpe ×${DM[g - 1]}, veio ×${m.hp} ×${m.dmg}`); ok(near(p.xp, XP[g - 1]) && near(p.item, IT[g - 1]), `grupo de ${g}: prêmio esperado ×${XP[g - 1]} e ×${IT[g - 1]}, veio ×${p.xp} e ×${p.item}`); }
  ok(D.monMult(0, 20).hp === D.monMult(0, 8).hp, 'grupo acima de 8 conta como 8'); }
/* 3. teto do produto nível × grupo */
for (let dl = 0; dl <= 10; dl++) for (let g = 1; g <= 8; g++) { const m = D.monMult(dl, g); ok(m.hp <= 12 && m.dmg <= 3.5, `teto estourado em +${dl} com ${g}: ×${m.hp} ×${m.dmg}`); }
ok(D.monMult(8, 8).hp === 12 && D.monMult(8, 8).dmg === 3.5, 'no pior caso (+8, grupo de 8) tem que bater no teto ×12 e ×3,5');
/* 4. habilidades de grupo: 6 por classe, 2 por caminho, e nenhum bônus fora do orçamento */
{ const KITS = ['human', 'nordic', 'dwarf', 'elf', 'tecno', 'pal', 'vam', 'lob', 'mag', 'bru', 'cac'], L = G.GRUPO_SKILLS, ids = new Set();
  ok(L.length === 66, `são 66 habilidades de grupo, vieram ${L.length}`);
  for (const k of KITS) { const m = L.filter((s) => s.kit === k); ok(m.length === 6, `${k}: 6 habilidades de grupo, vieram ${m.length}`); for (const b of [0, 1, 2]) ok(m.filter((s) => s.branch === b).length === 2, `${k}: 2 por caminho (caminho ${b})`); ok(new Set(m.map((s) => s.tipo)).size >= 3, `${k}: pelo menos 3 tipos diferentes (nem tudo cura)`); }
  const MAX = { dmg: 0.25, def: 0.30, crit: 0.25, haste: 0.15, move: 0.20, heal: 0.30, regen: 0.05, shield: 0.20, leech: 0.08, guard: 0.5, dodge: 0.20, redirect: 0.5, weaken: 0.15, revive: 0.3, cost: 0.15 };
  for (const s of L) { ok(!ids.has(s.id), `id repetido: ${s.id}`); ids.add(s.id); ok(s.cd >= 15, `${s.name}: recarga curta demais (${s.cd} s)`); ok(s.dur <= 20, `${s.name}: duração longa demais (${s.dur} s)`);
    for (const [k, v] of Object.entries(s.eff)) if (typeof v === 'number' && MAX[k] !== undefined) ok(v <= MAX[k] + 1e-9, `${s.name}: ${k} ${v} passa do teto ${MAX[k]}`);
    /* bônus de grupo inteiro (não de um aliado só) é menor */ if (s.alvo === 'grupo') { ok((s.eff.dmg ?? 0) <= 0.12 + 1e-9, `${s.name}: dano de grupo acima de 12%`); ok((s.eff.def ?? 0) <= 0.15 + 1e-9, `${s.name}: defesa de grupo acima de 15%`); }
    ok(s.dur <= 1 || s.dur / s.cd <= 0.55, `${s.name}: fica ativa mais de 55% do tempo (${s.dur}/${s.cd})`); } }
/* 5. o tanque no grupo de 8: sem apoio cai; com proteção no teto e curador, aguenta (herói de referência de regras-matematicas-07-11.md) */
{ const REF = [{ L: 40, hp: 1202, def: 0.40, hit: 182 }, { L: 100, hp: 2704, def: 0.38, hit: 467 }, { L: 150, hp: 4955, def: 0.40, hit: 918 }], ELITE = 1.4, CD = 1.9;
  for (const r of REF) { const hit = r.hit * ELITE * D.monMult(0, 8).dmg * (1 - r.def), semApoio = r.hp / hit * CD;
    const comProt = hit * (1 - 0.6), cura = r.hp * 0.04 * CD, liquido = comProt - cura, comApoio = liquido <= 0 ? Infinity : r.hp / liquido * CD;
    ok(semApoio < 25, `nível ${r.L}: tanque SEM apoio contra elite em grupo de 8 aguenta ${semApoio.toFixed(0)} s (tinha que cair em menos de 25 s)`);
    ok(comApoio > 60, `nível ${r.L}: tanque COM proteção e curador aguenta ${comApoio === Infinity ? 'sem cair' : comApoio.toFixed(0) + ' s'} (tinha que passar de 60 s)`);
    ok(semApoio > 5, `nível ${r.L}: tanque sem apoio cai em ${semApoio.toFixed(1)} s (rápido demais: menos de 5 s não dá tempo de reagir)`); } }
/* 6. dados: o 1 e o 20 valem em qualquer nível */
{ for (const [cd, acc] of [[5, 40], [40, 5], [20, 20]]) { const nd = D.needOf(cd, acc, 2, 12); ok(nd >= 2 && nd <= 12, `d20: a faixa de acerto saiu de 2..12 (cd ${cd}, acerto ${acc}: ${nd})`); }
  ok(D.monCD(40, false, 8) - D.monCD(40, false, 3) === 5 && D.monCD(40, false, 4) - D.monCD(40, false, 3) === 1, 'acerto: −1 em +4 e −5 em +8'); }

if (fails.length) { console.error(`\n✗ EQUILÍBRIO: ${fails.length} de ${n} regras fora da faixa:\n` + fails.map((f) => '  · ' + f).join('\n') + '\n'); process.exit(1); }
console.log(`✓ equilíbrio: ${n} regras conferidas, todas dentro da faixa`);

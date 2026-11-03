/* 03/11: prepara os modelos de cenário do Herik para o jogo.
   - Cada folha da Tripo tem UMA textura, mas cada .glb trazia uma cópia inteira dela (146 arquivos, 21 texturas).
     Aqui a textura sai do .glb e vira um .jpg único em public/models/cenario/tex/, que o jogo carrega uma vez só.
   - Textura reduzida: 1024 para casas, muralha, fonte e carroças; 512 para árvores, pedras, armas e props; 256 para plantas.
   - Vegetação pesada é simplificada (meshopt) para até ~2.500 triângulos por planta/pedra e ~4.000 por árvore.
   Uso (fora do repo, com as dependências): node cenario-herik.mjs <pasta_assets_do_herik> <client/public/models/cenario> */
import { NodeIO } from '@gltf-transform/core';
import { weld, simplify, prune, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const [SRC, OUT] = process.argv.slice(2);
const list = JSON.parse(fs.readFileSync(path.join(SRC, 'assets.json'), 'utf8'));
const io = new NodeIO();
await MeshoptSimplifier.ready;
fs.mkdirSync(path.join(OUT, 'tex'), { recursive: true });
const texOf = new Map(), out = [];
/* 03/11 (Erling: "se a vegetação ficar muito carregada, densidade de pixels para menos"): vegetação com textura menor = menos ruído na tela */
const texSize = (pasta) => /plantas/.test(pasta) ? 256 : /arvores|rochas|armas|props\/(vila|forja|porto|biblioteca)/.test(pasta) ? 512 : 1024;
const triCap = (pasta) => /arvores/.test(pasta) ? 4000 : /plantas|rochas/.test(pasta) ? 2500 : Infinity;
const countTris = (doc) => doc.getRoot().listMeshes().reduce((a, m) => a + m.listPrimitives().reduce((b, p) => b + (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3, 0), 0);
for (const e of list) {
  const src = path.join(SRC, e.arquivo); if (!fs.existsSync(src)) { console.log('falta', e.arquivo); continue; }
  const doc = await io.read(src);
  let tex = null;
  for (const t of doc.getRoot().listTextures()) {
    const img = t.getImage(); const h = crypto.createHash('md5').update(img).digest('hex').slice(0, 10);
    if (!texOf.has(h)) { const S = texSize(e.pasta); await sharp(Buffer.from(img)).resize(S, S, { fit: 'fill' }).jpeg({ quality: 86 }).toFile(path.join(OUT, 'tex', h + '.jpg')); texOf.set(h, S); }
    else texOf.set(h, Math.max(texOf.get(h), texSize(e.pasta)));
    tex = h + '.jpg'; t.dispose();
  }
  const t0 = countTris(doc), cap = triCap(e.pasta);
  if (t0 > cap) await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: cap / t0, error: 0.02 }));
  await doc.transform(dedup(), prune({ keepAttributes: true }));
  const dst = path.join(OUT, e.pasta, e.id + '.glb'); fs.mkdirSync(path.dirname(dst), { recursive: true }); await io.write(dst, doc);
  out.push({ id: e.id, pasta: e.pasta, glb: `${e.pasta}/${e.id}.glb`, tex, tris: Math.round(countTris(doc)), tris0: e.tris, size: e.medidas_m });
}
fs.writeFileSync(path.join(OUT, 'cenario.json'), JSON.stringify(out));
const kb = (p) => fs.readdirSync(p, { recursive: true }).reduce((a, f) => { const q = path.join(p, f); return fs.statSync(q).isFile() ? a + fs.statSync(q).size : a; }, 0) / 1024;
console.log(`${out.length} modelos, ${texOf.size} texturas, ${(kb(OUT) / 1024).toFixed(1)} MB`);

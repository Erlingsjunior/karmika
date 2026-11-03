/* montarias do Herik: copia com a textura em 1024 (o esqueleto e a malha ficam como vieram) */
import { NodeIO } from '@gltf-transform/core'; import sharp from 'sharp'; import fs from 'fs'; import path from 'path';
const [SRC, OUT] = process.argv.slice(2); const io = new NodeIO(); fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(SRC).filter((f) => f.endsWith('.glb'))) { const doc = await io.read(path.join(SRC, f));
  for (const t of doc.getRoot().listTextures()) { const b = await sharp(Buffer.from(t.getImage())).resize(1024, 1024, { fit: 'fill' }).jpeg({ quality: 86 }).toBuffer(); t.setImage(new Uint8Array(b)).setMimeType('image/jpeg'); }
  await io.write(path.join(OUT, f), doc); console.log(f, (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0), 'KB', doc.getRoot().listSkins().length, 'skins', doc.getRoot().listSkins()[0]?.listJoints().map((j) => j.getName()).join(',')); }

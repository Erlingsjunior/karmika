// monta o instalador com uma versão nova a cada vez (10/11, Erling: "a versão não muda, está sempre 0.1.0").
// Versão = ANO.MÊSDIA.HORAMINUTO do momento da montagem (ex.: 26.1110.2145 = 10/11/2026 às 21:45).
// O número vai só para o instalador e para o app; o package.json não é mexido (o git pull continua limpo).
import { spawnSync } from 'node:child_process';
const d = new Date(), p = (n) => String(n).padStart(2, '0');
const version = `${d.getFullYear() % 100}.${d.getMonth() + 1}${p(d.getDate())}.${Number(p(d.getHours()) + p(d.getMinutes()))}`;
const alvo = process.argv[2] === 'mac' ? ['--mac', 'dmg', 'zip'] : ['--win', 'nsis'];
console.log(`Karmika ${version}`);
const r = spawnSync('electron-builder', [...alvo, `-c.extraMetadata.version=${version}`], { stdio: 'inherit', shell: true });
if (r.status === 0) console.log(`\nPronto: Karmika ${version} em desktop/release`);
process.exit(r.status ?? 1);

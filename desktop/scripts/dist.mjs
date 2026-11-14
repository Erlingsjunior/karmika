// monta o instalador com uma versão nova a cada vez (10/11, Erling: "a versão não muda, está sempre 0.1.0").
// Versão = ANO.MÊSDIA.HORAMINUTO do momento da montagem (ex.: 26.1110.2145 = 10/11/2026 às 21:45).
// O número vai só para o instalador e para o app; o package.json não é mexido (o git pull continua limpo).
import { spawnSync } from 'node:child_process';
const d = new Date(), p = (n) => String(n).padStart(2, '0');
const version = `${d.getFullYear() % 100}.${d.getMonth() + 1}${p(d.getDate())}.${Number(p(d.getHours()) + p(d.getMinutes()))}`;
/* 14/11: 'linux' monta o AppImage e o tar.gz (CachyOS, SteamOS, Bazzite, Ubuntu…). O AppImage só se monta em Linux ou macOS; no Windows, use o WSL. */
const alvo = process.argv[2] === 'mac' ? ['--mac', 'dmg', 'zip'] : process.argv[2] === 'linux' ? ['--linux', 'AppImage', 'tar.gz'] : ['--win', 'nsis'];
console.log(`Karmika ${version}`);
/* no Linux o electron-builder 26 quebra no fim se não houver endereço de atualização; damos um genérico (o jogo não se atualiza sozinho por ele) */
const extra = process.argv[2] === 'linux' ? ['-c.linux.publish.provider=generic', '-c.linux.publish.url=https://karmikaonline.com/baixar'] : [];
const r = spawnSync('electron-builder', [...alvo, ...extra, '--publish', 'never', `-c.extraMetadata.version=${version}`], { stdio: 'inherit', shell: true });
if (r.status === 0) console.log(`\nPronto: Karmika ${version} em desktop/release`);
process.exit(r.status ?? 1);

// carimbo da compilação: o app compara este carimbo para saber se o jogo baixado do servidor é mais novo que o instalado
import { writeFileSync } from 'node:fs';
writeFileSync('dist/karmika-manifest.json', JSON.stringify({ built: Date.now() }));
console.log('carimbo do jogo gravado em dist/karmika-manifest.json');

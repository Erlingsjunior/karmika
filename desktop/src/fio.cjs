/* O FIO: a ligação do servidor de uma casa parceira com o núcleo KARMIKA (o Tear, desktop/src/tear.cjs). 12/11, Erling: "o núcleo de informação
   que transita entre o servidor deles e o nosso núcleo não precisa ser visto, são dados... o próprio jogo tem link com o nosso sistema...
   quando mandarmos mensagens vai para todos os servers que estão com o game profissional parceiro instalado".

   Liga sozinho, some sem atrapalhar e volta sozinho: se o Tear estiver fora do ar a sala continua funcionando normalmente; o Fio tenta de novo
   (2 s, 4 s... até 1 min) e, ao voltar, recebe o que perdeu. As cartas do Guardião escritas com o Fio caído esperam na fila. */
const WebSocket = require('ws');

function startFio(o) {
  const log = o.log || (() => { /* */ }); let ws = null, vivo = false, parado = false, espera = 2000, tPulso = null, tVolta = null, casa = null; const fila = [];
  const manda = (m) => { try { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(m)); return true; } } catch { /* */ } return false; };
  const pulso = () => { try { manda({ t: 'pulso', ...o.resumo() }); } catch (e) { log('o pulso falhou:', e.message); } };
  function liga() { if (parado) return; let s; try { s = new WebSocket(o.url, { handshakeTimeout: 10000 }); } catch (e) { log('endereço do Tear inválido:', e.message); return; } ws = s;
    s.on('open', () => { manda({ t: 'ola', chave: o.chave, edicao: o.edicao || 'parceiro' }); });
    s.on('message', (raw) => { let m; try { m = JSON.parse(String(raw)); } catch { return; } if (!m || typeof m !== 'object') return;
      switch (m.t) {
        case 'bemvindo': vivo = true; espera = 2000; casa = { nome: String(m.casa || ''), nivel: String(m.nivel || ''), comissao: Number(m.comissao) || 0 }; log(`Fio ligado ao Tear · ${casa.nome}`); pulso(); clearInterval(tPulso); tPulso = setInterval(pulso, 30000); while (fila.length && manda(fila[0])) fila.shift(); break;
        case 'recusado': log('o Tear recusou a ligação:', String(m.porque || '')); parado = true; break; /* chave errada ou parceria encerrada: não insiste */
        case 'aviso': { const a = { seq: Number(m.seq) || 0, tipo: m.tipo === 'evento' ? 'evento' : 'aviso', titulo: String(m.titulo || '').slice(0, 80), texto: String(m.texto || '').slice(0, 600), quando: Number(m.quando) || Date.now() }; try { o.aoAviso(a); } catch (e) { log('aviso não entregue:', e.message); } manda({ t: 'visto', seq: a.seq }); break; }
      } });
    s.on('close', () => { if (ws !== s) return; if (vivo) log('o Fio caiu; a sala segue normalmente'); vivo = false; clearInterval(tPulso); if (parado) return; clearTimeout(tVolta); tVolta = setTimeout(liga, espera); espera = Math.min(60000, espera * 2); });
    s.on('error', () => { /* o close cuida */ }); }
  liga();
  return { /** carta do Guardião do Reino para a central */ carta(texto, de) { const m = { t: 'carta', texto: String(texto || '').slice(0, 1200), de: String(de || '').slice(0, 40) }; if (!m.texto.trim()) return false; if (!manda(m)) { if (fila.length < 50) fila.push(m); return false; } return true; },
    /** 12/11: inscrição de uma guilda da casa no Campeonato de Guildas */ inscricao(r) { const m = { t: 'inscricao', gid: Number(r.gid) || 0, guilda: String(r.guilda || '').slice(0, 40), tag: String(r.tag || '').slice(0, 6), nivel: Number(r.nivel) || 1, membros: Number(r.membros) || 0, por: String(r.por || '').slice(0, 40), cargo: String(r.cargo || '').slice(0, 12), resp: String(r.resp || '').slice(0, 60), contato: String(r.contato || '').slice(0, 80), at: Number(r.at) || Date.now() }; if (!manda(m)) { if (fila.length < 50) fila.push(m); return false; } return true; },
    estado() { return { ligado: vivo, casa, naFila: fila.length, recusado: parado && !vivo }; }, pulso,
    stop() { parado = true; clearInterval(tPulso); clearTimeout(tVolta); try { ws && ws.close(1000); } catch { /* */ } } };
}
module.exports = { startFio };

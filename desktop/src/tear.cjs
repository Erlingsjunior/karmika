/* O TEAR A VAPOR: o núcleo KARMIKA e o centro de comando (12/11, Erling: "precisamos de um centro de comando, o tear a vapor, onde eu fico
   olhando tudo, mandando mensagem, posso ver num mapa mundial onde os servidores estão ligados e funcionando, recebemos mensagens de parceiros...
   o local headquarters que vemos tudo dos parceiros").

   Duas portas, de propósito:
     · a do FIO (padrão 7790) é a que vai para a internet: nela os servidores das casas parceiras se ligam (WebSocket em /fio) com a chave da casa;
     · a do PAINEL (padrão 7791) só responde neste computador (127.0.0.1): é o centro de comando, aberto no navegador, com a senha de administrador.
   Assim, mesmo com o Fio publicado por um túnel, o painel não sai de casa.

   O que sobe pelo Fio: quem é a casa (olá), o pulso do reino (jogadores, maiores níveis, guildas, versão) e as cartas do Guardião do Reino.
   O que desce: avisos e eventos da central. Casa desligada recebe o que perdeu quando voltar.

   node desktop/src/tear.cjs [--fio 7790] [--painel 7791] [--dados arquivo.json]        (pnpm tear) */
const { WebSocketServer } = require('ws');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

/* a mesma senha de administrador do jogo; aqui só o resumo dela (client/src/admin.ts) */
const ADM = 'de51ccea6a0e2ed64af31c9531a6410a54932cb8b3dd477fd5cc24d844abecca';
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const igual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const limpa = (v, n) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const num = (v, lo, hi, d = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
const NIVEIS = { estalagem: { nome: 'Estalagem', comissao: 20 }, salao: { nome: 'Salão de Guilda', comissao: 25 }, cidadela: { nome: 'Cidadela', comissao: 30 } };
const SEDE = { nome: 'D2 Studio', cidade: 'Araras, SP', lat: -22.36, lon: -47.38 };

function startTear(opts = {}) {
  const ADMH = opts.admHash || ADM; /* os testes entram com outra senha, sem conhecer a de verdade */
  const portaFio = opts.fio || 7790, portaPainel = opts.painel || 7791, log = opts.log || ((...a) => console.log('[tear]', ...a));
  const arq = opts.dados || path.join(__dirname, '..', 'tear-dados.json');
  /** casas: { id, nome, cidade, pais, lat, lon, nivel, chave (resumo), criada, revogada?, visto (último aviso entregue), ultimo: {pulso}, vistoEm } */
  let D = { casas: [], avisos: [], cartas: [], seq: 1, cid: 1, kid: 1 };
  try { D = { ...D, ...JSON.parse(fs.readFileSync(arq, 'utf8')) }; } catch { /* primeira vez */ }
  let sujo = false; const grava = () => { sujo = true; };
  const flush = () => { if (!sujo) return; sujo = false; try { fs.writeFileSync(arq + '.tmp', JSON.stringify(D)); fs.renameSync(arq + '.tmp', arq); } catch (e) { log('não gravou os dados:', e.message); } };
  const tGrava = setInterval(flush, 3000); tGrava.unref();
  /** casa id → ligação viva */
  const vivos = new Map();
  const casa = (id) => D.casas.find((c) => c.id === id);
  const manda = (ws, m) => { try { if (ws.readyState === 1) ws.send(JSON.stringify(m)); } catch { /* */ } };
  /* entrega a uma casa os avisos que ela ainda não viu (os dela e os gerais), no máximo os 50 mais novos */
  function entrega(c) { const ws = vivos.get(c.id); if (!ws) return; const falta = D.avisos.filter((a) => a.seq > (c.visto || 0) && (a.para === 'todas' || a.para === c.id)).slice(-50); for (const a of falta) manda(ws, { t: 'aviso', seq: a.seq, tipo: a.tipo, titulo: a.titulo, texto: a.texto, quando: a.quando }); }

  /* ---------- o Fio: as casas se ligam aqui ---------- */
  const webFio = http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('KARMIKA: o Tear está de pé.'); });
  const wss = new WebSocketServer({ server: webFio, path: '/fio', maxPayload: 64 * 1024 });
  wss.on('connection', (ws, req) => {
    let c = null, msgs = 0; const ip = String(req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '');
    const semOla = setTimeout(() => { if (!c) ws.close(4001, 'sem olá'); }, 8000);
    const janela = setInterval(() => { msgs = 0; }, 10000);
    ws.on('message', (raw) => {
      if (++msgs > 60) { ws.close(4008, 'mensagens demais'); return; }
      let m; try { m = JSON.parse(String(raw)); } catch { return; } if (!m || typeof m !== 'object') return;
      if (!c) {
        if (m.t !== 'ola') return; const h = sha('karmika-fio:' + String(m.chave || ''));
        const achou = D.casas.find((x) => !x.revogada && igual(x.chave, h));
        if (!achou) { manda(ws, { t: 'recusado', porque: 'chave desconhecida ou revogada' }); ws.close(4003, 'chave'); log(`ligação recusada de ${ip}: chave desconhecida`); return; }
        const velho = vivos.get(achou.id); if (velho && velho !== ws) { try { velho.close(4009, 'outra ligação da mesma casa'); } catch { /* */ } }
        c = achou; clearTimeout(semOla); vivos.set(c.id, ws); c.vistoEm = Date.now(); c.desde = Date.now(); c.ip = ip; c.edicao = limpa(m.edicao, 40); grava();
        manda(ws, { t: 'bemvindo', casa: c.nome, nivel: c.nivel, comissao: NIVEIS[c.nivel]?.comissao ?? 0 }); log(`${c.nome} (${c.cidade}) ligou o Fio`); entrega(c); return;
      }
      c.vistoEm = Date.now();
      switch (m.t) {
        case 'pulso': { const top = Array.isArray(m.top) ? m.top.slice(0, 10).map((p) => ({ nome: limpa(p?.nome, 24), nivel: num(p?.nivel, 1, 999, 1), classe: limpa(p?.classe, 24) })) : [];
          const guildas = Array.isArray(m.guildas) ? m.guildas.slice(0, 20).map((g) => ({ nome: limpa(g?.nome, 40), tag: limpa(g?.tag, 6), membros: num(g?.membros, 0, 9999), nivel: num(g?.nivel, 0, 999) })) : [];
          c.ultimo = { jogadores: num(m.jogadores, 0, 9999), contas: num(m.contas, 0, 999999), personagens: num(m.personagens, 0, 999999), top, guildas, versao: limpa(m.versao, 40), sala: limpa(m.sala, 60), quando: Date.now() };
          c.pico = Math.max(c.pico || 0, c.ultimo.jogadores); grava(); break; }
        case 'carta': { const texto = limpa(m.texto, 1200); if (!texto) break; D.cartas.push({ id: D.kid++, casa: c.id, de: limpa(m.de, 40) || 'Guardião do Reino', texto, quando: Date.now(), lida: false }); if (D.cartas.length > 2000) D.cartas.splice(0, D.cartas.length - 2000); grava(); manda(ws, { t: 'recebida' }); log(`carta de ${c.nome}: ${texto.slice(0, 80)}`); break; }
        case 'visto': { const s = num(m.seq, 0, 1e12); if (s > (c.visto || 0)) { c.visto = s; grava(); } break; }
      }
    });
    ws.on('close', () => { clearTimeout(semOla); clearInterval(janela); if (c && vivos.get(c.id) === ws) { vivos.delete(c.id); c.caiu = Date.now(); grava(); log(`${c.nome} soltou o Fio`); } });
    ws.on('error', () => { /* o close cuida */ });
  });
  /* quem some sem avisar: sem sinal há mais de 90 s, a ligação é derrubada */
  const tVivo = setInterval(() => { const now = Date.now(); for (const [id, ws] of vivos) { const c = casa(id); if (!c || now - (c.vistoEm || 0) > 90000) { try { ws.terminate(); } catch { /* */ } } else { try { ws.ping(); } catch { /* */ } } } }, 20000); tVivo.unref();

  /* ---------- o painel: só neste computador ---------- */
  const sess = new Map(); /* token → validade */
  const painelHtml = () => fs.readFileSync(path.join(__dirname, 'tear-painel.html'), 'utf8');
  const mapa = fs.readFileSync(path.join(__dirname, 'tear-mapa.json'), 'utf8');
  let tentativas = 0; setInterval(() => { tentativas = 0; }, 60000).unref();
  const corpo = (req) => new Promise((ok) => { let s = ''; req.on('data', (d) => { s += d; if (s.length > 65536) req.destroy(); }); req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch { ok({}); } }); });
  const dentro = (req) => { const m = /(?:^|;\s*)tear=([a-f0-9]{48})/.exec(String(req.headers.cookie || '')); const v = m && sess.get(m[1]); return !!v && v > Date.now(); };
  const estado = () => { const now = Date.now();
    return { sede: SEDE, niveis: NIVEIS, agora: now,
      casas: D.casas.map((c) => ({ id: c.id, nome: c.nome, cidade: c.cidade, pais: c.pais, lat: c.lat, lon: c.lon, nivel: c.nivel, criada: c.criada, revogada: !!c.revogada, online: vivos.has(c.id), desde: c.desde || 0, caiu: c.caiu || 0, vistoEm: c.vistoEm || 0, pico: c.pico || 0, edicao: c.edicao || '', pendentes: D.avisos.filter((a) => a.seq > (c.visto || 0) && (a.para === 'todas' || a.para === c.id)).length, ultimo: c.ultimo || null })),
      cartas: D.cartas.slice(-200).reverse(), avisos: D.avisos.slice(-100).reverse() }; };
  const webPainel = http.createServer(async (req, res) => {
    const u = new URL(req.url || '/', 'http://x'), json = (code, o) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
    /* só páginas abertas neste próprio painel podem mandar ordens (um site qualquer aberto no mesmo navegador não pode) */
    if (req.method === 'POST') { const o = String(req.headers.origin || ''); if (o && !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(o)) return json(403, { erro: 'origem' }); }
    if (u.pathname === '/' && req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(painelHtml()); return; }
    /* 12/11: o mapa do jogo e os terrenos de guilda reservados (tirados do próprio jogo; ver nucleo-e-servidores-parceiros no projeto) */
    if (u.pathname === '/mundo.webp') { try { const img = fs.readFileSync(path.join(__dirname, 'tear-mundo.webp')); res.writeHead(200, { 'Content-Type': 'image/webp', 'Cache-Control': 'max-age=3600' }); res.end(img); } catch { res.writeHead(404); res.end(); } return; }
    if (u.pathname === '/terrenos.json') { try { const t = fs.readFileSync(path.join(__dirname, 'tear-terrenos.json'), 'utf8'); res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=3600' }); res.end(t); } catch { res.writeHead(404); res.end('{}'); } return; }
    if (u.pathname === '/mapa.json') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=86400' }); res.end(mapa); return; }
    if (u.pathname === '/api/entrar' && req.method === 'POST') { if (++tentativas > 8) return json(429, { erro: 'muitas tentativas; espere um minuto' }); const b = await corpo(req);
      if (!igual(sha('karmika:' + String(b.senha || '')), ADMH)) return json(401, { erro: 'senha' });
      const tok = crypto.randomBytes(24).toString('hex'); sess.set(tok, Date.now() + 12 * 3600e3); res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': `tear=${tok}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200` }); res.end('{"ok":true}'); return; }
    if (!u.pathname.startsWith('/api/')) { res.writeHead(404); res.end(); return; }
    if (!dentro(req)) return json(401, { erro: 'entrar' });
    if (u.pathname === '/api/estado') return json(200, estado());
    if (req.method !== 'POST') return json(405, { erro: 'método' });
    const b = await corpo(req);
    switch (u.pathname) {
      case '/api/casa': { const nome = limpa(b.nome, 60), nivel = NIVEIS[b.nivel] ? b.nivel : 'estalagem'; if (!nome) return json(400, { erro: 'nome' });
        const chave = crypto.randomBytes(20).toString('hex'); /* a chave aparece uma vez só, aqui; no arquivo fica o resumo */
        const c = { id: D.cid++, nome, cidade: limpa(b.cidade, 60), pais: limpa(b.pais, 40) || 'Brasil', lat: num(b.lat, -90, 90), lon: num(b.lon, -180, 180), nivel, chave: sha('karmika-fio:' + chave), criada: Date.now(), visto: D.seq - 1 };
        D.casas.push(c); grava(); flush(); log(`casa registrada: ${nome}`); return json(200, { ok: true, id: c.id, chave }); }
      case '/api/casa/editar': { const c = casa(Number(b.id)); if (!c) return json(404, { erro: 'casa' }); if (b.nome) c.nome = limpa(b.nome, 60); if (b.cidade !== undefined) c.cidade = limpa(b.cidade, 60); if (b.pais) c.pais = limpa(b.pais, 40); if (NIVEIS[b.nivel]) c.nivel = b.nivel; if (b.lat !== undefined) c.lat = num(b.lat, -90, 90); if (b.lon !== undefined) c.lon = num(b.lon, -180, 180); grava(); return json(200, { ok: true }); }
      case '/api/casa/revogar': { const c = casa(Number(b.id)); if (!c) return json(404, { erro: 'casa' }); c.revogada = b.volta ? undefined : Date.now(); const ws = vivos.get(c.id); if (ws && c.revogada) { manda(ws, { t: 'recusado', porque: 'parceria encerrada' }); try { ws.close(4003, 'revogada'); } catch { /* */ } } grava(); log(`${c.nome}: ${c.revogada ? 'chave revogada' : 'chave reativada'}`); return json(200, { ok: true }); }
      case '/api/casa/chave': { const c = casa(Number(b.id)); if (!c) return json(404, { erro: 'casa' }); const chave = crypto.randomBytes(20).toString('hex'); c.chave = sha('karmika-fio:' + chave); const ws = vivos.get(c.id); if (ws) { try { ws.close(4003, 'chave trocada'); } catch { /* */ } } grava(); flush(); return json(200, { ok: true, chave }); }
      case '/api/aviso': { const texto = limpa(b.texto, 600); if (!texto) return json(400, { erro: 'texto' }); const para = b.para === 'todas' ? 'todas' : Number(b.para); if (para !== 'todas' && !casa(para)) return json(404, { erro: 'casa' });
        const a = { seq: D.seq++, tipo: b.tipo === 'evento' ? 'evento' : 'aviso', titulo: limpa(b.titulo, 80), texto, para, quando: Date.now() }; D.avisos.push(a); if (D.avisos.length > 2000) D.avisos.splice(0, D.avisos.length - 2000); grava();
        let agora = 0; for (const c of D.casas) if (!c.revogada && (para === 'todas' || para === c.id) && vivos.has(c.id)) { entrega(c); agora++; }
        log(`${a.tipo} para ${para === 'todas' ? 'todas as casas' : casa(para).nome}: ${texto.slice(0, 80)}`); return json(200, { ok: true, seq: a.seq, agora }); }
      case '/api/carta/lida': { const k = D.cartas.find((x) => x.id === Number(b.id)); if (k) { k.lida = b.lida !== false; grava(); } return json(200, { ok: true }); }
    }
    return json(404, { erro: 'rota' });
  });

  return new Promise((ok, falha) => {
    webFio.on('error', falha); webPainel.on('error', falha);
    webFio.listen(portaFio, '0.0.0.0', () => webPainel.listen(portaPainel, '127.0.0.1', () => {
      log(`o Fio escuta na porta ${portaFio} (as casas ligam em ws://ESTE-ENDEREÇO:${portaFio}/fio)`); log(`centro de comando: http://127.0.0.1:${portaPainel}  (só neste computador)`);
      ok({ portaFio, portaPainel, stop() { clearInterval(tGrava); clearInterval(tVivo); flush(); for (const ws of vivos.values()) { try { ws.close(1001); } catch { /* */ } } wss.close(); webFio.close(); webPainel.close(); } });
    }));
  });
}

module.exports = { startTear };

if (require.main === module) {
  const args = process.argv.slice(2), flag = (n) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : undefined; };
  startTear({ fio: Number(flag('fio')) || undefined, painel: Number(flag('painel')) || undefined, dados: flag('dados') }).then((t) => {
    const fim = () => { t.stop(); process.exit(0); }; process.on('SIGINT', fim); process.on('SIGTERM', fim);
  }).catch((e) => { console.error('O Tear não subiu:', e.message); process.exit(1); });
}

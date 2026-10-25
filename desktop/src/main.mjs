/* Karmika — app de desktop (Electron).
   - Roda o jogo numa janela própria, forçando a placa de vídeo de alto desempenho (a RTX do notebook, não a integrada).
   - "Abrir servidor": liga a sala de jogo nesta máquina, tenta abrir a porta no roteador (UPnP), descobre o IP público
     e avisa se a operadora usa CGNAT (aí ninguém de fora alcança; o plano B é o Tailscale). */
import { app, BrowserWindow, ipcMain, protocol, net, shell, clipboard } from 'electron';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { upnpNat } from '@achingbrain/nat-port-mapper';
import fs from 'node:fs';
import dgram from 'node:dgram';
import serverMod from './server.cjs';

const { startServer, gameManifest, DISCOVERY_PORT } = serverMod;
/* ---- salas abertas na rede local: cada servidor anuncia a cada 2 s; aqui guardamos o que ouvimos nos últimos 7 s ---- */
const seen = new Map();
try { const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true }); sock.on('error', (e) => console.log('[karmika] descoberta de salas desligada:', e.message));
  sock.on('message', (buf, from) => { try { const m = JSON.parse(String(buf)); if (m.karmika !== 1 || !m.code) return; const host = from.address === '127.0.0.1' || lanAddresses().includes(from.address) ? '127.0.0.1' : from.address; seen.set(`${host}:${m.port}`, { ...m, host, at: Date.now() }); } catch { /* não é de Karmika */ } });
  sock.bind(DISCOVERY_PORT); } catch (e) { console.log('[karmika] sem descoberta de salas:', e.message); }
console.log('[karmika] app iniciando');

// ---- placa de vídeo: notebook com RTX usa a dedicada; nada de lista negra de GPU nem freio em segundo plano
app.commandLine.appendSwitch('force_high_performance_gpu');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

const DEV = !!process.env.KARMIKA_DEV;
/** pasta do jogo compilado: dentro do instalador fica em resources/game; rodando do código, em client/dist */
const BUNDLED = app.isPackaged ? path.join(process.resourcesPath, 'game') : path.join(__dirname, '..', '..', 'client', 'dist');
/* jogo baixado do servidor fica em <dados do app>/game; vale o mais novo entre ele e o que veio no instalador */
const CACHE = () => path.join(app.getPath('userData'), 'game');
const builtOf = (dir) => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'karmika-manifest.json'), 'utf8')).built || 0; } catch { return 0; } };
let GAME_DIR = BUNDLED;
function pickGameDir() { const c = CACHE(); GAME_DIR = fs.existsSync(path.join(c, 'index.html')) && builtOf(c) > builtOf(BUNDLED) ? c : BUNDLED; console.log('[karmika] jogo em', GAME_DIR); }

// o jogo pede arquivos como "/models/..." — servimos tudo por app://karmika/ para os caminhos absolutos funcionarem
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

let win = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 1100, minHeight: 640, backgroundColor: '#000000', title: 'Karmika', autoHideMenuBar: true, show: false,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false, spellcheck: false },
  });
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.key === 'F12' && (DEV || input.control)) win.webContents.toggleDevTools();
  });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.loadURL(DEV ? 'http://localhost:5173/' : 'app://karmika/index.html');
  // autoteste (só para quem desenvolve): KARMIKA_SELFTEST=pasta [KARMIKA_SELFTEST_JS=código] → roda o código na página, tira fotos e fecha
  if (process.env.KARMIKA_SELFTEST) win.webContents.once('did-finish-load', () => setTimeout(async () => {
    const out = process.env.KARMIKA_SELFTEST; const shot = async (n) => fs.writeFileSync(path.join(out, n), (await win.webContents.capturePage()).toPNG());
    try { const r = await win.webContents.executeJavaScript(process.env.KARMIKA_SELFTEST_JS || 'window.karmikaDesktop.host({port:7788}).then(h=>JSON.stringify(h))'); fs.writeFileSync(path.join(out, 'result.txt'), String(r)); } catch (e) { fs.writeFileSync(path.join(out, 'result.txt'), 'ERRO ' + e); }
    setTimeout(() => shot('shot1.png'), 4000); setTimeout(async () => { await shot('shot2.png'); fs.writeFileSync(path.join(out, 'gamedir.txt'), GAME_DIR); app.quit(); }, 40000);
  }, 20000));
}

// ---------------- sala de jogo ----------------
let room = null; // { port, code, stop, players }
let gateway = null;

function lanAddresses() {
  const out = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) for (const a of list || []) {
    if (a.family !== 'IPv4' || a.internal) continue;
    const tailscale = a.address.startsWith('100.') && Number(a.address.split('.')[1]) >= 64 && Number(a.address.split('.')[1]) <= 127;
    out.push({ ip: a.address, name, kind: tailscale ? 'tailscale' : /radmin/i.test(name) ? 'radmin' : 'lan' });
  }
  return out;
}
const isPrivate = (ip) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|127\.)/.test(ip || '');

async function publicIp() {
  for (const u of ['https://api.ipify.org', 'https://ipv4.icanhazip.com', 'https://checkip.amazonaws.com']) {
    try { const r = await net.fetch(u, { signal: AbortSignal.timeout(5000) }); const t = (await r.text()).trim(); if (/^\d+\.\d+\.\d+\.\d+$/.test(t)) return t; } catch { /* tenta o próximo */ }
  }
  return null;
}

/** tenta abrir a porta no roteador (UPnP). Devolve o IP externo que o roteador enxerga, ou null */
async function openRouterPort(port) {
  const lan = lanAddresses().find((a) => a.kind === 'lan');
  if (!lan) return { ok: false, why: 'sem rede local' };
  try {
    const client = upnpNat({ description: 'Karmika', ttl: 7200 * 1000, keepAlive: true });
    for await (const gw of client.findGateways({ signal: AbortSignal.timeout(7000) })) {
      try {
        await gw.map(port, lan.ip, { protocol: 'tcp', description: 'Karmika' });
        const ext = await gw.externalIp().catch(() => null);
        gateway = gw;
        return { ok: true, external: ext };
      } catch (e) { try { await gw.stop(); } catch { /* */ } return { ok: false, why: 'o roteador recusou: ' + (e?.message || e) }; }
    }
    return { ok: false, why: 'roteador sem UPnP (ou desligado)' };
  } catch (e) { return { ok: false, why: String(e?.message || e) }; }
}

ipcMain.handle('host:start', async (_e, opts = {}) => {
  if (room) return roomInfo();
  const port = Number(opts.port) || 7777;
  room = await startServer({ port, code: opts.code, world: opts.world, gameDir: GAME_DIR, password: opts.password || '', dataFile: path.join(app.getPath('userData'), 'sala-dados.json'), log: (...a) => { console.log('[sala]', ...a); win?.webContents.send('host:log', a.join(' ')); } });
  const [pub, upnp] = await Promise.all([publicIp(), openRouterPort(port)]);
  room.pub = pub; room.upnp = upnp; room.pass = opts.password || '';
  // CGNAT: o roteador recebe um IP privado da operadora (ou diferente do IP público) → ninguém de fora alcança esta máquina
  room.cgnat = upnp.ok && upnp.external ? (isPrivate(upnp.external) || (pub && upnp.external !== pub)) : null;
  return roomInfo();
});
function roomInfo() {
  if (!room) return null;
  return { port: room.port, code: room.code, pass: !!room.pass, publicIp: room.pub, upnp: room.upnp, cgnat: room.cgnat, lan: lanAddresses(), players: room.players() };
}
ipcMain.handle('host:info', () => roomInfo());
ipcMain.handle('net:servers', () => { const now = Date.now(); for (const [k, v] of seen) if (now - v.at > 7000) seen.delete(k); return [...seen.values()].map(({ at, ...v }) => v); });
ipcMain.handle('host:stop', async () => {
  if (!room) return true;
  try { await room.stop(); } catch { /* */ }
  room = null;
  if (gateway) { try { await gateway.unmap(7777); await gateway.stop(); } catch { /* */ } gateway = null; }
  return true;
});
ipcMain.handle('app:gpu', async () => {
  try { const g = await app.getGPUInfo('complete'); const d = g?.gpuDevice?.find((x) => x.active) ?? g?.gpuDevice?.[0]; return { renderer: g?.auxAttributes?.glRenderer || null, vendor: d?.vendorString || null, device: d?.deviceString || null }; } catch { return null; }
});
ipcMain.handle('app:copy', (_e, text) => { clipboard.writeText(String(text)); return true; });
/* ---- atualização pelo servidor: compara as versões e baixa só os arquivos que mudaram ---- */
let localMan = null; // { dir, man } em memória (calcular o hash de tudo leva um instante)
function myManifest() { if (!localMan || localMan.dir !== GAME_DIR) localMan = { dir: GAME_DIR, man: gameManifest(GAME_DIR) }; return localMan.man; }
ipcMain.handle('game:update', async (_e, inv) => {
  const m = String(inv || '').trim().replace(/^karmika:\/\//i, '').match(/^([a-z0-9.\-]+)(?::(\d+))?/i); if (!m) return { ok: false, why: 'convite inválido' };
  const base = `http://${m[1]}:${m[2] || 7777}/karmika`;
  let remote; try { const r = await net.fetch(`${base}/manifest.json`, { signal: AbortSignal.timeout(8000) }); if (!r.ok) return { ok: true, same: true, why: 'o servidor não entrega o jogo' }; remote = await r.json(); } catch (e) { return { ok: true, same: true, why: 'sem resposta do servidor de arquivos' }; }
  const mine = myManifest(); if (mine && mine.version === remote.version) return { ok: true, same: true, version: remote.version };
  const send = (p) => win?.webContents.send('game:progress', p);
  const tmp = path.join(app.getPath('userData'), 'game-next'); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
  const list = Object.entries(remote.files); const need = list.filter(([rel, f]) => !(mine && mine.files[rel] && mine.files[rel].hash === f.hash));
  const total = need.reduce((a, [, f]) => a + f.size, 0); let got = 0;
  try {
    for (const [rel, f] of list) { // primeiro copia o que não mudou
      if (rel.includes('..') || path.isAbsolute(rel)) continue;
      const dst = path.join(tmp, rel); fs.mkdirSync(path.dirname(dst), { recursive: true });
      if (mine && mine.files[rel] && mine.files[rel].hash === f.hash) fs.copyFileSync(path.join(GAME_DIR, rel), dst);
    }
    let i = 0; const worker = async () => { while (i < need.length) { const [rel, f] = need[i++]; if (rel.includes('..') || path.isAbsolute(rel)) continue;
      const r = await net.fetch(`${base}/files/${rel.split('/').map(encodeURIComponent).join('/')}`); if (!r.ok) throw new Error('falhou ' + rel);
      const buf = Buffer.from(await r.arrayBuffer()); fs.writeFileSync(path.join(tmp, rel), buf); got += f.size; send({ got, total, file: rel, n: need.length }); } };
    await Promise.all([worker(), worker(), worker(), worker()]);
    fs.writeFileSync(path.join(tmp, 'karmika-manifest.json'), JSON.stringify({ built: remote.built || Date.now(), version: remote.version }));
    const c = CACHE(); fs.rmSync(c, { recursive: true, force: true }); fs.renameSync(tmp, c); localMan = null; GAME_DIR = c;
    return { ok: true, updated: true, version: remote.version, files: need.length, bytes: total };
  } catch (e) { fs.rmSync(tmp, { recursive: true, force: true }); return { ok: false, why: String(e?.message || e) }; }
});
ipcMain.handle('app:open', (_e, url) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return true; });

app.whenReady().then(() => {
  pickGameDir();
  console.log('[karmika] pronto, abrindo janela');
  protocol.handle('app', (req) => {
    const u = new URL(req.url);
    let rel = decodeURIComponent(u.pathname); if (rel === '/' || rel === '') rel = '/index.html';
    const file = path.normalize(path.join(GAME_DIR, rel));
    if (!file.startsWith(GAME_DIR)) return new Response('nao', { status: 403 });
    if (!fs.existsSync(file)) return new Response('', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
});
app.on('window-all-closed', async () => { if (room) { try { await room.stop(); } catch { /* */ } } if (gateway) { try { await gateway.stop(); } catch { /* */ } } app.quit(); });

/* Inscrição no beta: cada inscrito vira um arquivo JSON no Vercel Blob (loja privada "karmika-beta", pasta beta/).
   Para ver a lista: painel da Vercel → Storage → karmika-beta. */
import { put } from '@vercel/blob';

const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'método' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  if (b.site) return res.status(200).json({ ok: true }); /* robô preencheu o campo escondido */
  const email = clean(b.email, 120).toLowerCase(), nome = clean(b.nome, 60);
  if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !b.ok) return res.status(400).json({ error: 'dados' });
  const row = { nome, email, discord: clean(b.discord, 60), caminho: clean(b.caminho, 40), pc: clean(b.pc, 120), embaixador: !!b.embaixador, quando: new Date().toISOString(), pais: req.headers['x-vercel-ip-country'] || '' };
  if (!process.env.BLOB_READ_WRITE_TOKEN) { console.error('beta: falta ligar a loja Blob karmika-beta ao projeto'); return res.status(503).json({ error: 'loja' }); }
  try {
    await put(`beta/${row.quando.slice(0, 10)}-${email.replace(/[^a-z0-9]/g, '_')}.json`, JSON.stringify(row), { access: 'private', contentType: 'application/json', addRandomSuffix: true });
    return res.status(200).json({ ok: true });
  } catch (e) { console.error('beta', e); return res.status(500).json({ error: 'gravar' }); }
}

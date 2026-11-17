/* A FAUNA EM VOLTA DE QUEM JOGA: bandos que cruzam o céu, aves que ciscam e levantam voo, coelhos que fogem, peixes que saltam,
   corujas nas árvores à noite e cachorros nas vilas. Regras e números em dados.ts; modelos em modelos.ts. */
import * as THREE from 'three';
import { TILE_M as T } from '@karmika/shared';
import { AVES, AVES_DE, COELHO_DE, CORUJA_EM, PELAGENS, LIMITE, NASCE, SOME, SUSTO } from './dados';
import { ave, coelho, cao, coruja, peixe, type Bicho } from './modelos';
import type { Biome } from '../world';

export interface FaunaCtx { scene: THREE.Scene; heroi(): { x: number; z: number }; noite(): number; chao(x: number, z: number): number; agua(): number; piso(tx: number, ty: number): string | undefined; bioma(tx: number, ty: number): Biome;
  /** a vila em que o ponto está (centro em casas e raio), ou null */ vila(tx: number, ty: number): { x: number; y: number; radius: number } | null; /** árvores perto, em casas do mapa */ arvores(tx: number, ty: number, r: number): { x: number; y: number; alt: number }[];
  /** respingo na água (o jogo já tem partículas) */ respingo?(x: number, y: number, z: number): void; parado(): boolean }

type Vivo = { b: Bicho; tipo: 'bando' | 'chao' | 'coelho' | 'coruja' | 'cao' | 'peixe'; x: number; z: number; y: number; vx: number; vz: number; t: number; est: number; fase: number; alvo?: { x: number; z: number }; irmaos?: Vivo[]; dx?: number; dz?: number; dy?: number };
const rnd = (a: number, b: number) => a + Math.random() * (b - a), pega = <X>(L: X[]) => L[(Math.random() * L.length) | 0];

export function createFauna(K: FaunaCtx) {
  const L: Vivo[] = []; let relogio = 0, tArv = 0, proxima = 0;
  const firme = (x: number, z: number) => { const p = K.piso(Math.floor(x / T), Math.floor(z / T)); return (p === 'grass' || p === 'road' || p === 'plaza') && K.chao(x, z) > K.agua() + 0.15; };
  const naAgua = (x: number, z: number) => K.piso(Math.floor(x / T), Math.floor(z / T)) === 'water' || K.chao(x, z) < K.agua() - 0.25;
  const conta = (t: Vivo['tipo']) => L.reduce((n, v) => n + (v.tipo === t ? 1 : 0), 0);
  const poe = (b: Bicho, tipo: Vivo['tipo'], x: number, z: number, y: number): Vivo => { const v: Vivo = { b, tipo, x, z, y, vx: 0, vz: 0, t: 0, est: 0, fase: Math.random() * 6.28 }; b.g.position.set(x, y, z); K.scene.add(b.g); L.push(v); return v; };
  const tira = (v: Vivo) => { K.scene.remove(v.b.g); const i = L.indexOf(v); if (i >= 0) L.splice(i, 1); };
  const longe = (v: Vivo, h: { x: number; z: number }) => Math.hypot(v.x - h.x, v.z - h.z);
  const olha = (v: Vivo, dx: number, dz: number, dt: number) => { if (Math.abs(dx) + Math.abs(dz) < 1e-4) return; const al = Math.atan2(dx, dz); let d = al - v.b.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); v.b.g.rotation.y += d * Math.min(1, dt * 8); };

  /** a cada segundo: quem falta nasce (um por vez), quem ficou longe some */
  function povoa(h: { x: number; z: number }) { const tx = Math.floor(h.x / T), ty = Math.floor(h.z / T), bio = K.bioma(tx, ty), noite = K.noite(), dia = noite < 0.45;
    for (const v of [...L]) if (longe(v, h) > SOME || (v.tipo === 'coruja' && noite < 0.3) || ((v.tipo === 'bando' || v.tipo === 'chao') && noite > 0.7 && v.est !== 2)) tira(v);
    const a = Math.random() * 6.283, px = h.x + Math.cos(a) * NASCE, pz = h.z + Math.sin(a) * NASCE;
    /* bando cruzando o céu: nasce de um lado e atravessa por cima de quem joga */
    if (dia && L.filter((v) => v.tipo === 'bando' && !v.irmaos).length < LIMITE.bandos && Math.random() < 0.3) { const esp = AVES[pega(AVES_DE[bio])], n = 3 + ((Math.random() * 4) | 0), alt = K.chao(h.x, h.z) + rnd(9, 15), dir = a + Math.PI + rnd(-0.5, 0.5), vel = rnd(7, 10);
      const chefe = poe(ave(esp.corpo, esp.asa, esp.tam), 'bando', px, pz, alt); chefe.vx = Math.sin(dir) * vel; chefe.vz = Math.cos(dir) * vel;
      for (let i = 1; i < n; i++) { const lado = i % 2 ? 1 : -1, k = Math.ceil(i / 2), q = poe(ave(esp.corpo, esp.asa, esp.tam), 'bando', px, pz, alt); q.irmaos = [chefe]; q.dx = lado * k * 1.1; q.dz = -k * 1.3; q.dy = rnd(-0.3, 0.3); } }
    /* aves ciscando no chão */
    if (dia && conta('chao') < LIMITE.noChao && Math.random() < 0.35 && firme(px, pz)) { const esp = AVES[pega(AVES_DE[bio])]; poe(ave(esp.corpo, esp.asa, esp.tam * 0.9), 'chao', px, pz, K.chao(px, pz) + 0.08); }
    /* coelhos */
    { const cor = COELHO_DE[bio]; if (cor !== undefined && noite < 0.8 && conta('coelho') < LIMITE.coelhos && Math.random() < 0.4 && firme(px, pz) && !K.vila(Math.floor(px / T), Math.floor(pz / T))) poe(coelho(cor), 'coelho', px, pz, K.chao(px, pz)); }
    /* peixes saltando: só onde há água perto */
    if (conta('peixe') < 2 && Math.random() < 0.5) { const r = rnd(8, 24), qx = h.x + Math.cos(a) * r, qz = h.z + Math.sin(a) * r; if (naAgua(qx, qz) && naAgua(qx + 2, qz) && naAgua(qx - 2, qz) && naAgua(qx, qz + 2) && naAgua(qx, qz - 2)) { const v = poe(peixe(pega([0x8aa0b0, 0xc0a060, 0x6a8a9a, 0xd08a5a])), 'peixe', qx, qz, K.agua()); const d2 = Math.random() * 6.283; v.vx = Math.sin(d2) * 1.6; v.vz = Math.cos(d2) * 1.6; v.b.g.rotation.y = d2; K.respingo?.(qx, K.agua(), qz); } }
    /* corujas: à noite, no alto de uma árvore perto */
    if (noite > 0.55 && CORUJA_EM.includes(bio) && conta('coruja') < LIMITE.corujas && relogio > tArv) { tArv = relogio + 6; const A = K.arvores(tx, ty, 16).filter((q) => { const d = Math.hypot(q.x * T - h.x, q.y * T - h.z); return d > 8 && !L.some((v) => v.tipo === 'coruja' && Math.hypot(v.x - q.x * T, v.z - q.y * T) < 3); });
      if (A.length) { const q = pega(A), x = (q.x + 0.5) * T, z = (q.y + 0.5) * T; poe(coruja(), 'coruja', x, z, K.chao(x, z) + q.alt * 0.62); } }
    /* cachorros: só dentro de vila */
    { const vl = K.vila(tx, ty); if (vl && conta('cao') < LIMITE.caes && Math.random() < 0.5) { const r = rnd(10, 20), qx = h.x + Math.cos(a) * r, qz = h.z + Math.sin(a) * r; if (firme(qx, qz) && K.vila(Math.floor(qx / T), Math.floor(qz / T))) { const v = poe(cao(pega(PELAGENS)), 'cao', qx, qz, K.chao(qx, qz)); v.b.g.scale.setScalar(rnd(0.85, 1.15)); } } }
  }

  function tick(dt: number) { if (K.parado()) return; const h = K.heroi(); relogio += dt; if (relogio >= proxima) { proxima = relogio + 1; povoa(h); }
    for (const v of [...L]) { v.t += dt; const g = v.b.g, d = longe(v, h);
      if (v.tipo === 'bando') { if (v.irmaos) { const c = v.irmaos[0]; if (!L.includes(c)) { tira(v); continue; } const ry = c.b.g.rotation.y, s = Math.sin(ry), co = Math.cos(ry); v.x = c.x + v.dx! * co + v.dz! * s; v.z = c.z - v.dx! * s + v.dz! * co; v.y = c.y + v.dy! + Math.sin(v.t * 1.7 + v.fase) * 0.25; g.rotation.y = ry; }
        else { v.x += v.vx * dt; v.z += v.vz * dt; v.y += Math.sin(v.t * 0.6 + v.fase) * 0.3 * dt; g.rotation.y = Math.atan2(v.vx, v.vz); }
        const bate = Math.sin(v.t * 13 + v.fase) * 0.9; v.b.p.e.rotation.z = bate; v.b.p.d.rotation.z = -bate; }
      else if (v.tipo === 'chao') { /* 0 cisca · 2 levanta voo */
        if (v.est === 0) { if (d < SUSTO) { v.est = 2; const fx = v.x - h.x, fz = v.z - h.z, m = Math.hypot(fx, fz) || 1; v.vx = fx / m * 7; v.vz = fz / m * 7; }
          else { if (v.t > 1.2) { v.t = 0; if (Math.random() < 0.5) { const an = Math.random() * 6.283, nx = v.x + Math.sin(an) * 0.6, nz = v.z + Math.cos(an) * 0.6; if (firme(nx, nz)) { v.x = nx; v.z = nz; v.y = K.chao(nx, nz) + 0.08; g.rotation.y = an; } } } g.rotation.x = Math.max(0, Math.sin(v.t * 9)) * 0.5; v.b.p.e.rotation.z = -1.2; v.b.p.d.rotation.z = 1.2; } }
        else { g.rotation.x = -0.25; v.x += v.vx * dt; v.z += v.vz * dt; v.y += 4.2 * dt; g.rotation.y = Math.atan2(v.vx, v.vz); const bate = Math.sin(v.t * 22) * 1.0; v.b.p.e.rotation.z = bate; v.b.p.d.rotation.z = -bate; } }
      else if (v.tipo === 'coelho') { /* 0 parado · 1 passeia · 2 foge */
        if (d < SUSTO && v.est !== 2) { v.est = 2; v.t = 0; }
        if (v.est === 0) { v.b.p.o1.rotation.x = Math.sin(v.t * 2 + v.fase) * 0.12; v.b.p.o2.rotation.x = Math.sin(v.t * 2.3) * 0.12; if (v.t > 2.5) { v.t = 0; v.est = 1; const an = Math.random() * 6.283; v.vx = Math.sin(an) * 1.6; v.vz = Math.cos(an) * 1.6; } }
        else { if (v.est === 2) { const fx = v.x - h.x, fz = v.z - h.z, m = Math.hypot(fx, fz) || 1; v.vx = fx / m * 6.5; v.vz = fz / m * 6.5; }
          const nx = v.x + v.vx * dt, nz = v.z + v.vz * dt; if (firme(nx, nz)) { v.x = nx; v.z = nz; } else { const an = Math.random() * 6.283, s = Math.hypot(v.vx, v.vz); v.vx = Math.sin(an) * s; v.vz = Math.cos(an) * s; }
          olha(v, v.vx, v.vz, dt); const pulo = Math.abs(Math.sin(v.t * (v.est === 2 ? 11 : 6))); v.y = K.chao(v.x, v.z) + pulo * (v.est === 2 ? 0.32 : 0.16); v.b.p.corpo.rotation.x = -pulo * 0.25;
          if (v.est === 1 && v.t > 1.6) { v.est = 0; v.t = 0; v.y = K.chao(v.x, v.z); v.b.p.corpo.rotation.x = 0; } if (v.est === 2 && d > 16) { v.est = 0; v.t = 0; v.y = K.chao(v.x, v.z); v.b.p.corpo.rotation.x = 0; } } }
      else if (v.tipo === 'peixe') { /* salta num arco de 0,9 s e some */ const k = v.t / 0.9; if (k >= 1) { K.respingo?.(v.x, K.agua(), v.z); tira(v); continue; } v.x += v.vx * dt; v.z += v.vz * dt; v.y = K.agua() - 0.1 + Math.sin(k * Math.PI) * 0.75; g.rotation.x = (k - 0.5) * 2.2; }
      else if (v.tipo === 'coruja') { /* gira a cabeça para quem passa; de vez em quando, pisca devagar para o outro lado */ const al = Math.atan2(h.x - v.x, h.z - v.z) + (Math.sin(v.t * 0.23 + v.fase) > 0.75 ? 1.4 : 0); let dd = al - v.b.p.cab.rotation.y; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); v.b.p.cab.rotation.y += dd * Math.min(1, dt * 2.5); g.scale.y = 1 + Math.sin(v.t * 1.4 + v.fase) * 0.025; }
      else if (v.tipo === 'cao') { /* 0 parado · 1 anda · 3 segue o herói · 4 senta */
        const anda = (vel: number) => { const nx = v.x + v.vx * dt, nz = v.z + v.vz * dt; if (firme(nx, nz)) { v.x = nx; v.z = nz; v.y = K.chao(nx, nz); } else { v.est = 0; v.t = 0; } olha(v, v.vx, v.vz, dt); const s = Math.sin(v.t * vel) * 0.7; v.b.p.p0.rotation.x = s; v.b.p.p3.rotation.x = s; v.b.p.p1.rotation.x = -s; v.b.p.p2.rotation.x = -s; };
        const para = () => { for (const k of ['p0', 'p1', 'p2', 'p3']) v.b.p[k].rotation.x *= 0.8; };
        v.b.p.rabo.rotation.y = Math.sin(v.t * (d < 6 ? 16 : 5)) * (d < 6 ? 0.8 : 0.3);
        if (v.est === 0) { para(); v.b.p.cab.rotation.y = Math.sin(v.t * 0.8 + v.fase) * 0.5; if (d < 7 && d > 2.2 && Math.random() < dt * 0.6) { v.est = 3; v.t = 0; } else if (v.t > 3) { v.t = 0; v.est = 1; const an = Math.random() * 6.283; v.vx = Math.sin(an) * 1.5; v.vz = Math.cos(an) * 1.5; } }
        else if (v.est === 1) { anda(9); if (v.t > 2.6) { v.est = 0; v.t = 0; } }
        else if (v.est === 3) { const fx = h.x - v.x, fz = h.z - v.z, m = Math.hypot(fx, fz) || 1; if (m < 1.9) { v.est = 4; v.t = 0; } else if (m > 14 || v.t > 14) { v.est = 0; v.t = 0; } else { v.vx = fx / m * 3.4; v.vz = fz / m * 3.4; anda(14); } }
        else { para(); olha(v, h.x - v.x, h.z - v.z, dt); g.rotation.x = -0.32; v.b.p.cab.rotation.y = 0; if (d > 3.2 || v.t > 9) { g.rotation.x = 0; v.est = d > 3.2 && v.t < 9 ? 3 : 0; v.t = 0; } } }
      g.position.set(v.x, v.y, v.z); }
  }
  return { tick, get vivos() { return L; } };
}

/* 08/11 O CÉU: dia e noite de verdade (Erling: "efeitos especiais bem detalhados: névoa, dia e noite… sem quebrar FPS, WebGL e WebGPU").
   - O SOL ANDA: nasce a leste às 6h, culmina ao meio-dia, se põe a oeste às 18h; à noite quem ilumina é a LUA, baixa, azulada, do outro lado.
   - A PALETA DO DIA tem sete momentos (madrugada, aurora, manhã, meio-dia, tarde, poente, noite) para o céu, a névoa, o sol e a luz do ambiente,
     interpolados pela hora do jogo — o nascer é rosado e laranja, o poente é cobre e vinho, a noite é azul de luar.
   - A NÉVOA RASTEIRA segue o herói: lençóis de névoa (sprites, baratos nos dois renderizadores) que aparecem conforme o bioma e a hora —
     forte no pântano e na madrugada, leve no campo ao meio-dia, cinza-escura no vulcão, gelada na neve. */
import * as THREE from 'three';
import type { Biome } from '../world';

export interface SkyKey { h: number; sky: number; fog: number; sun: number; hemi: number; ground: number; sunI: number; fogD: number }
const K: SkyKey[] = [
  { h: 0, sky: 0x050814, fog: 0x070a18, sun: 0x6a88d0, hemi: 0x4668b0, ground: 0x1a2030, sunI: 0.8, fogD: 0.012 },
  { h: 4.5, sky: 0x0a0c20, fog: 0x0e1024, sun: 0x7a90d0, hemi: 0x5070b0, ground: 0x202436, sunI: 0.85, fogD: 0.0125 },
  { h: 6.0, sky: 0x7a5a78, fog: 0xa07a80, sun: 0xff9a60, hemi: 0xd0a0b0, ground: 0x4a3a40, sunI: 1.3, fogD: 0.0105 }, /* a aurora: céu rosado, névoa cor de pêssego */
  { h: 7.2, sky: 0xd8a888, fog: 0xe0b89a, sun: 0xffc080, hemi: 0xf0d0c0, ground: 0x6a5a48, sunI: 1.9, fogD: 0.0065 },
  { h: 9.0, sky: 0x9bbad8, fog: 0xa8c0d8, sun: 0xffe0b0, hemi: 0xf4e6cc, ground: 0x4a5a40, sunI: 2.3, fogD: 0.0032 },
  { h: 12.5, sky: 0x9bbad8, fog: 0x9bbad8, sun: 0xfff2d8, hemi: 0xf8f0e0, ground: 0x506048, sunI: 2.45, fogD: 0.0022 },
  { h: 16.0, sky: 0xa8b8d0, fog: 0xb0b8c8, sun: 0xffe0a8, hemi: 0xf4e0c8, ground: 0x4e5844, sunI: 2.2, fogD: 0.0030 },
  { h: 17.6, sky: 0xd09070, fog: 0xd8a080, sun: 0xffa050, hemi: 0xf0c0a0, ground: 0x5a4a3c, sunI: 1.8, fogD: 0.0055 }, /* o poente: cobre */
  { h: 18.8, sky: 0x6a3a4a, fog: 0x7a4a52, sun: 0xff7a40, hemi: 0xb08090, ground: 0x3a2a30, sunI: 1.2, fogD: 0.0085 }, /* vinho e brasa */
  { h: 20.0, sky: 0x0c0c22, fog: 0x101226, sun: 0x7a90d0, hemi: 0x5070b0, ground: 0x202436, sunI: 0.85, fogD: 0.012 },
  { h: 24, sky: 0x050814, fog: 0x070a18, sun: 0x6a88d0, hemi: 0x4668b0, ground: 0x1a2030, sunI: 0.8, fogD: 0.012 },
];
const cA = new THREE.Color(), cB = new THREE.Color();
export interface SkyNow { sky: THREE.Color; fog: THREE.Color; sun: THREE.Color; hemi: THREE.Color; ground: THREE.Color; sunI: number; fogD: number; /** 0 noite … 1 dia (pela luz) */ day: number }
const out: SkyNow = { sky: new THREE.Color(), fog: new THREE.Color(), sun: new THREE.Color(), hemi: new THREE.Color(), ground: new THREE.Color(), sunI: 1, fogD: 0.01, day: 1 };
const sm = (x: number) => x * x * (3 - 2 * x);
export function skyAt(h: number): SkyNow {
  h = ((h % 24) + 24) % 24; let i = 0; while (i < K.length - 2 && K[i + 1].h <= h) i++; const a = K[i], b = K[i + 1], u = sm(Math.max(0, Math.min(1, (h - a.h) / (b.h - a.h))));
  const mix = (ka: number, kb: number, dst: THREE.Color) => dst.copy(cA.setHex(ka)).lerp(cB.setHex(kb), u);
  mix(a.sky, b.sky, out.sky); mix(a.fog, b.fog, out.fog); mix(a.sun, b.sun, out.sun); mix(a.hemi, b.hemi, out.hemi); mix(a.ground, b.ground, out.ground);
  out.sunI = a.sunI + (b.sunI - a.sunI) * u; out.fogD = a.fogD + (b.fogD - a.fogD) * u; out.day = Math.max(0, Math.min(1, (out.sunI - 0.8) / 1.65)); return out;
}
/** direção de onde vem a luz principal: o sol de dia (leste → oeste), a lua de noite (baixa, do sudoeste) */
const dirV = new THREE.Vector3(), moon = new THREE.Vector3(-14, 22, -9).normalize(), sunV = new THREE.Vector3();
export function lightDirAt(h: number): THREE.Vector3 {
  h = ((h % 24) + 24) % 24; const t = (h - 6) / 12; /* 0 = nascer, 1 = poente */
  const el = Math.sin(Math.max(0, Math.min(1, t)) * Math.PI), az = (t - 0.5) * Math.PI * 0.9; /* elevação e azimute (leste = +x) */
  sunV.set(Math.sin(az) * -1, 0.28 + el * 0.95, 0.42 - el * 0.2).normalize(); /* nunca rasteiro demais: a sombra ficaria quilométrica */
  const dayK = h < 5.5 || h > 19.5 ? 0 : h < 7 ? (h - 5.5) / 1.5 : h > 18 ? (19.5 - h) / 1.5 : 1;
  return dirV.copy(moon).lerp(sunV, sm(dayK)).normalize();
}

/* ---------- a névoa rasteira do mundo ---------- */
const MIST_BIOME: Record<Biome, [number, number]> = { /* [força, cor] */
  meadow: [0.35, 0xdfe6ee], forest: [0.6, 0xc8d8d0], swamp: [1.0, 0xaab89a], snow: [0.55, 0xe8f0fa], ruins: [0.5, 0xc8c0b0], rock: [0.3, 0xd0d0d0],
  volcanic: [0.7, 0x4a3a36], enchanted: [0.6, 0xb8a8e0], blight: [0.9, 0x8a7a90], jungle: [0.7, 0xb8d0a8], coast: [0.4, 0xe0e8f0] };
export function createWorldMist(scene: THREE.Scene, radial: THREE.Texture, biomeAt: (x: number, z: number) => Biome, heightAt: (x: number, z: number) => number, n = 22) {
  const g = new THREE.Group(); g.name = 'mist'; scene.add(g);
  const items = Array.from({ length: n }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial, transparent: true, depthWrite: false, opacity: 0, fog: true })); s.raycast = () => {}; s.frustumCulled = false; g.add(s); return { s, ox: 0, oz: 0, sc: 9 + (i % 5) * 2.4, ph: i * 1.37, sp: 0.04 + (i % 4) * 0.012, a: 0 }; });
  let placed = false; const tmp = new THREE.Color(), base = new THREE.Color();
  function place(it: (typeof items)[number], hx: number, hz: number) { const a = Math.random() * 6.283, d = 8 + Math.random() * 30; it.ox = hx + Math.cos(a) * d; it.oz = hz + Math.sin(a) * d; }
  return { group: g, update(t: number, dt: number, hero: THREE.Vector3, hour: number, inside: boolean, fogCol: THREE.Color, wind: number) {
    if (!placed) { placed = true; for (const it of items) place(it, hero.x, hero.z); }
    /* a hora: forte de madrugada (4–7h), média à noite, quase nada ao meio-dia */
    const hk = hour >= 4 && hour < 7.5 ? 1 : hour >= 7.5 && hour < 10 ? 1 - (hour - 7.5) / 2.5 * 0.8 : hour >= 10 && hour < 17 ? 0.2 : hour >= 17 && hour < 20 ? 0.2 + (hour - 17) / 3 * 0.4 : 0.6;
    for (const it of items) { const dx = it.ox - hero.x, dz = it.oz - hero.z; if (dx * dx + dz * dz > 42 * 42) place(it, hero.x, hero.z);
      const x = it.ox + Math.sin(t * it.sp * (1 + wind) + it.ph) * (3 + wind * 3), z = it.oz + Math.cos(t * it.sp * 0.7 + it.ph) * 2; const b = biomeAt(x, z), [bk, bc] = MIST_BIOME[b] ?? [0.3, 0xd0d8e0];
      const dh = Math.hypot(x - hero.x, z - hero.z), near = Math.max(0, Math.min(1, (dh - 5) / 6)); /* some em volta do herói, para não tapar a luta */
      const want = inside ? 0 : 0.22 * bk * hk * near; it.a += (want - it.a) * Math.min(1, dt * 0.8);
      const m = it.s.material as THREE.SpriteMaterial; m.opacity = it.a; if (it.a > 0.005) { it.s.position.set(x, heightAt(x, z) + 0.9 + Math.sin(t * 0.3 + it.ph) * 0.25, z); it.s.scale.set(it.sc * 1.6, it.sc * 0.55, 1); base.setHex(bc); m.color.copy(base).lerp(tmp.copy(fogCol), 0.45); it.s.visible = true; } else it.s.visible = false; } } };
}

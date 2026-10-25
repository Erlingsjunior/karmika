/** Som 100% procedural (WebAudio), sem arquivos: ambiente (vento baixo, pássaros, grilos, corujas, uivos, água, fogo),
 *  passos por terreno, golpes/magias, moedas e uma trilha ambiente gerada (pentatônica, pads + melodia esparsa). */
export type Surface = 'dirt' | 'stone' | 'grass' | 'snow' | 'water' | 'wood';
export type SpellKind = 'fire' | 'ice' | 'arcane' | 'shock' | 'earth' | 'holy';

export class AudioEngine {
  private ctx?: AudioContext;
  private master!: GainNode; private amb!: GainNode; private sfx!: GainNode; private mus!: GainNode;
  private noise!: AudioBuffer;
  private windLo!: GainNode; private windHi!: GainNode; private windHiF!: BiquadFilterNode;
  private fireG!: GainNode; private waterG!: GainNode; private riverG!: GainNode;
  muted = false; music = localStorage.getItem('karmika.music') !== '0';
  private musicT = 0; private nextNote = 2; private pads: { o: OscillatorNode; g: GainNode }[] = []; private key = 0;

  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.2; comp.connect(ctx.destination);
    this.master = ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(comp);
    this.amb = ctx.createGain(); this.amb.gain.value = 1; this.amb.connect(this.master);
    this.sfx = ctx.createGain(); this.sfx.gain.value = 1; this.sfx.connect(this.master);
    this.mus = ctx.createGain(); this.mus.gain.value = this.music ? 0.09 * this.vol.music : 0; this.mus.connect(this.master);
    this.master.gain.value = 0.5 * this.vol.master; this.sfx.gain.value = this.vol.sfx; this.amb.gain.value = this.vol.amb;
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    let b = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b = (b + 0.02 * w) / 1.02; d[i] = w * 0.6 + b * 8; } // ruído rosado
    const loop = (type: BiquadFilterType, f: number, q: number, dest: GainNode = this.amb) => {
      const s = ctx.createBufferSource(); s.buffer = this.noise; s.loop = true;
      const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
      const g = ctx.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(dest); s.start();
      return { fl, g };
    };
    this.windLo = loop('lowpass', 160, 0.5).g;
    const wh = loop('bandpass', 700, 2.5); this.windHi = wh.g; this.windHiF = wh.fl;
    this.fireG = loop('lowpass', 400, 0.6).g;
    this.waterG = loop('bandpass', 1500, 0.9).g;
    this.riverG = loop('bandpass', 900, 0.5).g;
    // pads da trilha: duas vozes em quinta, bem baixas, com tremolo lento
    for (const [f, det] of [[73.4, 0], [110, 3]] as [number, number][]) {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = det;
      const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 420;
      const g = ctx.createGain(); g.gain.value = 0.0; o.connect(fl); fl.connect(g); g.connect(this.mus); o.start(); this.pads.push({ o, g });
    }
  }

  /** volumes das opções (0..1): geral, música, efeitos, ambiente */
  private vol = { master: 1, music: 1, sfx: 1, amb: 1 };
  setVolumes(master: number, music: number, sfx: number, amb: number) { this.vol = { master, music, sfx, amb }; if (!this.ctx) return; const now = this.ctx.currentTime; this.master.gain.setTargetAtTime(this.muted ? 0 : 0.5 * master, now, 0.05); this.sfx.gain.setTargetAtTime(sfx, now, 0.05); this.amb.gain.setTargetAtTime(amb, now, 0.05); this.mus.gain.setTargetAtTime(this.music ? 0.09 * music : 0, now, 0.3); }
  toggleMute() { this.muted = !this.muted; if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.5 * this.vol.master, this.ctx.currentTime, 0.05); return this.muted; }
  toggleMusic() { this.music = !this.music; localStorage.setItem('karmika.music', this.music ? '1' : '0'); if (this.ctx) this.mus.gain.setTargetAtTime(this.music ? 0.09 * this.vol.music : 0, this.ctx.currentTime, 0.5); return this.music; }

  /* ---------- blocos básicos ---------- */
  private burst(type: BiquadFilterType, f: number, q: number, dur: number, vol: number, rate = 1, dest: GainNode = this.sfx, pan = 0, attack = 0.004) {
    const ctx = this.ctx!; const now = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = rate;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vol, now + attack); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    s.connect(fl); fl.connect(g); g.connect(p); p.connect(dest); s.start(now, Math.random() * 1.5, dur + 0.05);
    return fl;
  }
  private tone(f0: number, f1: number, dur: number, vol: number, type: OscillatorType = 'sine', delay = 0, dest: GainNode = this.sfx, pan = 0, attack = 0.01) {
    const ctx = this.ctx!; const now = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, now); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), now + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vol, now + attack); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    o.connect(g); g.connect(p); p.connect(dest); o.start(now); o.stop(now + dur + 0.05);
    return o;
  }
  /** nota "dedilhada" (decai rápido, com um pouco de harmônicos) para a melodia */
  private pluck(f: number, dur: number, vol: number, delay = 0, pan = 0) {
    this.tone(f, f, dur, vol, 'triangle', delay, this.mus, pan, 0.006); this.tone(f * 2, f * 2, dur * 0.5, vol * 0.25, 'sine', delay, this.mus, pan, 0.004);
  }
  /** metal: várias senóides inarmônicas curtas (sino/aço) */
  private metal(base: number, dur: number, vol: number, delay = 0) { for (const k of [1, 1.47, 2.09, 2.9]) this.tone(base * k * (0.98 + Math.random() * 0.04), base * k, dur / (k * 0.7), vol / k, 'sine', delay); }

  /* ---------- passos ---------- */
  /** passos: graves e macios (nada de chiado agudo), mais baixos que o resto; ataque lento para não "estalar" */
  step(surface: Surface, run: boolean) {
    if (!this.ctx) return;
    const v = (run ? 0.75 : 0.55) * 0.42, r = 0.9 + Math.random() * 0.2, A = 0.014;
    switch (surface) {
      case 'stone': this.burst('lowpass', 950 * r, 0.7, 0.06, 0.07 * v, 1, this.sfx, 0, A); this.tone(120 * r, 80, 0.07, 0.035 * v, 'sine', 0, this.sfx, 0, 0.006); break;
      case 'grass': this.burst('lowpass', 650 * r, 0.5, 0.12, 0.05 * v, 0.8, this.sfx, 0, 0.025); this.tone(62 * r, 45, 0.09, 0.03 * v, 'sine', 0, this.sfx, 0, 0.01); break;
      case 'snow': this.burst('lowpass', 1100 * r, 0.8, 0.15, 0.06 * v, 0.7, this.sfx, 0, 0.02); this.tone(70 * r, 50, 0.08, 0.025 * v, 'sine', 0, this.sfx, 0, 0.01); break;
      case 'water': this.burst('lowpass', 900 * r, 0.6, 0.2, 0.07 * v, 0.8, this.sfx, 0, 0.03); break;
      case 'wood': this.burst('lowpass', 600 * r, 0.9, 0.08, 0.08 * v, 1, this.sfx, 0, A); this.tone(150 * r, 95, 0.09, 0.04 * v, 'sine', 0, this.sfx, 0, 0.006); break;
      default: this.burst('lowpass', 520 * r, 0.7, 0.1, 0.08 * v, r, this.sfx, 0, 0.02); this.tone(80 * r, 55, 0.09, 0.045 * v, 'sine', 0, this.sfx, 0, 0.008);
    }
  }

  /* ---------- combate ---------- */
  swing() { if (!this.ctx) return; const c = this.ctx.currentTime; const f = this.burst('bandpass', 700, 1.4, 0.32, 0.1, 0.9); f.frequency.setValueAtTime(380, c); f.frequency.exponentialRampToValueAtTime(1500, c + 0.14); f.frequency.exponentialRampToValueAtTime(520, c + 0.3); /* lâmina pesada cortando o ar */ }
  hit() { if (!this.ctx) return; this.metal(1700 + Math.random() * 400, 0.18, 0.05); this.burst('bandpass', 2500, 2, 0.05, 0.1); this.burst('lowpass', 500, 0.8, 0.12, 0.12); this.tone(160, 60, 0.14, 0.1); }
  /** lâmina cortando carne: mordida aguda do fio + rasgo úmido descendo + baque do corpo — nada de metal batendo */
  slash(crit = false) {
    if (!this.ctx) return; const c = this.ctx.currentTime, k = crit ? 1.35 : 1;
    this.burst('highpass', 4200, 0.7, 0.05, 0.1 * k, 1.1, this.sfx, 0, 0.001);
    const r = this.burst('bandpass', 1800, 1.6, 0.16, 0.13 * k, 0.9); r.frequency.setValueAtTime(1800, c); r.frequency.exponentialRampToValueAtTime(420, c + 0.15);
    this.burst('lowpass', 360, 0.8, 0.16, 0.17 * k, 0.8); this.tone(105, 48, 0.14, 0.09 * k);
    if (crit) { const r2 = this.burst('bandpass', 900, 2, 0.22, 0.08, 0.7); r2.frequency.exponentialRampToValueAtTime(260, c + 0.2); }
  }
  /** aparo: lâmina contra lâmina — anel metálico curto e faísca */
  parry() { if (!this.ctx) return; this.metal(2300 + Math.random() * 300, 0.42, 0.07); this.metal(3400, 0.25, 0.035); this.burst('highpass', 5000, 1.2, 0.06, 0.08, 1, this.sfx, 0, 0.001); this.burst('lowpass', 500, 0.8, 0.08, 0.06); }
  /** escudo de madeira e couro absorvendo o golpe: baque grave, estalo de tábua, só um toque do aro de ferro */
  block() { if (!this.ctx) return; this.burst('lowpass', 280, 0.9, 0.2, 0.2); this.burst('bandpass', 750, 1.4, 0.07, 0.11, 1, this.sfx, 0, 0.001); this.tone(85, 45, 0.18, 0.12); this.metal(1100, 0.12, 0.018); }
  /** hino das cinemáticas: coro grave em menor, acordes longos que se abrem devagar (sobe a trilha, abafa o resto) */
  hymn(sec: number, mood: 'dark' | 'bright' = 'dark') {
    if (!this.ctx) return;
    const prog = mood === 'dark' ? [[110, 130.8, 164.8], [98, 123.5, 146.8], [87.3, 110, 130.8], [82.4, 103.8, 123.5], [110, 130.8, 164.8]] : [[130.8, 164.8, 196], [146.8, 185, 220], [110, 138.6, 164.8], [130.8, 164.8, 196]];
    const step = sec / prog.length;
    prog.forEach((ch, i) => { for (const [k, f] of ch.entries()) { for (const oct of [1, 2]) this.tone(f * oct, f * oct * 1.002, step * 1.25, (oct === 1 ? 0.028 : 0.014) * (k === 0 ? 1.3 : 1), oct === 1 ? 'triangle' : 'sine', i * step, this.sfx, (k - 1) * 0.35, step * 0.45); } });
    for (let i = 0; i < Math.floor(sec / 3); i++) this.tone(659 + (i % 3) * 110, 660 + (i % 3) * 110, 2.4, 0.008, 'sine', 1.5 + i * 3, this.sfx, (i % 2 ? 0.5 : -0.5), 0.6);
  }
  /** golpe em carne: surdo, sem metal */
  thud() { if (!this.ctx) return; this.burst('lowpass', 600, 0.9, 0.11, 0.14); this.tone(120, 50, 0.13, 0.1); }
  cast() { this.spell('arcane'); }
  spell(kind: SpellKind) {
    if (!this.ctx) return;
    switch (kind) {
      case 'fire': { const f = this.burst('lowpass', 900, 0.7, 0.55, 0.14, 0.9); f.frequency.exponentialRampToValueAtTime(2800, this.ctx.currentTime + 0.3); for (let i = 0; i < 5; i++) this.burst('highpass', 2500 + Math.random() * 2000, 1.5, 0.02, 0.05, 1, this.sfx, (Math.random() - 0.5), 0.001); break; }
      case 'ice': for (let i = 0; i < 5; i++) this.tone(1800 + i * 330 + Math.random() * 120, 2400 + i * 300, 0.35, 0.025, 'sine', i * 0.04, this.sfx, (i - 2) * 0.2); this.burst('highpass', 5000, 1.2, 0.4, 0.04); break;
      case 'shock': this.tone(110, 95, 0.25, 0.06, 'sawtooth'); for (let i = 0; i < 6; i++) this.burst('bandpass', 3000 + Math.random() * 3000, 6, 0.02, 0.07, 1, this.sfx, 0, 0.001); break;
      case 'earth': this.burst('lowpass', 220, 0.8, 0.5, 0.2); this.tone(70, 35, 0.5, 0.12); this.burst('bandpass', 1400, 1, 0.2, 0.06, 0.7); break;
      case 'holy': for (const [f, d] of [[523, 0], [659, 0.08], [784, 0.16], [1047, 0.26]] as [number, number][]) this.tone(f, f, 0.9, 0.035, 'sine', d, this.sfx, (d - 0.13) * 2); this.burst('highpass', 4000, 0.7, 0.6, 0.02); break;
      default: this.tone(320, 760, 0.35, 0.04, 'sine'); this.tone(480, 1140, 0.3, 0.025, 'triangle', 0.05); this.burst('highpass', 3000, 0.7, 0.3, 0.025);
    }
  }
  boom() { if (!this.ctx) return; this.burst('lowpass', 420, 0.8, 0.45, 0.16); this.tone(90, 32, 0.5, 0.14); this.burst('bandpass', 1800, 1, 0.12, 0.06); }
  heal() { this.spell('holy'); }
  hurt() { if (!this.ctx) return; this.burst('lowpass', 700, 0.8, 0.12, 0.12); this.tone(120, 70, 0.16, 0.08); }
  dash() { if (!this.ctx) return; const f = this.burst('bandpass', 1200, 0.9, 0.3, 0.14, 1.3); f.frequency.exponentialRampToValueAtTime(3200, this.ctx.currentTime + 0.2); }
  chime() { if (!this.ctx) return; this.tone(660, 660, 0.9, 0.06); this.tone(990, 990, 1.1, 0.045, 'sine', 0.08); this.tone(1320, 1320, 1.2, 0.03, 'sine', 0.16); }
  /** ponto na Árvore Kármica: uma pedra rúnica grave que ressoa (sem sininho). tier > 0 = a magia evoluiu: o acorde abre em quinta */
  rune(tier = 0) { if (!this.ctx) return;
    this.burst('lowpass', 220, 1.2, 0.18, 0.16, 1, this.sfx, 0, 0.002); // a batida da pedra
    this.tone(98, 96, 1.6, 0.07, 'sine', 0, this.sfx, 0, 0.004); this.tone(147, 145, 1.3, 0.035, 'triangle', 0.02, this.sfx, 0, 0.01); this.tone(196, 194, 1.1, 0.02, 'sine', 0.04, this.sfx, 0, 0.02);
    if (tier > 0) { this.tone(294, 292, 1.8, 0.025, 'sine', 0.22, this.sfx, -0.3, 0.12); this.tone(392, 390, 2.0, 0.02, 'sine', 0.3, this.sfx, 0.3, 0.16); this.burst('bandpass', 900, 0.8, 1.1, 0.012, 1, this.sfx, 0, 0.3); } }
  /* ---------- interface ---------- */
  /** moedas: pinguinhos metálicos agudos, levemente desafinados */
  coins(n = 3) { if (!this.ctx) return; for (let i = 0; i < n; i++) { const f = 2600 + Math.random() * 1400; this.tone(f, f * 0.98, 0.09, 0.035, 'sine', i * 0.045 + Math.random() * 0.02, this.sfx, (Math.random() - 0.5) * 0.6, 0.002); this.tone(f * 1.5, f * 1.5, 0.05, 0.015, 'sine', i * 0.045, this.sfx, 0, 0.002); } }
  /** som de bancada, um golpe por chamada: martelo na bigorna, serrote, bolha no caldeirão, chiado na panela, agulha */
  work(kind: 'hammer' | 'saw' | 'brew' | 'cook' | 'sew' | 'carve') {
    if (!this.ctx) return; const r = 0.9 + Math.random() * 0.2;
    if (kind === 'hammer') { this.metal(1500 * r, 0.32, 0.05); this.burst('lowpass', 500, 0.8, 0.08, 0.1); }
    else if (kind === 'saw') { this.burst('bandpass', 2400 * r, 4, 0.22, 0.07, 1.4); this.burst('bandpass', 1700 * r, 3, 0.2, 0.05, 0.8, this.sfx, 0, 0.08); }
    else if (kind === 'brew') { for (let i = 0; i < 3; i++) this.tone(300 * r + i * 90, 700 * r + i * 120, 0.09, 0.025, 'sine', i * 0.07); }
    else if (kind === 'cook') { this.burst('highpass', 3500, 0.7, 0.4, 0.05, 1.2, this.sfx, 0, 0.03); }
    else if (kind === 'sew') { this.burst('bandpass', 4200 * r, 6, 0.04, 0.05); this.burst('bandpass', 3600 * r, 6, 0.04, 0.04, 1, this.sfx, 0, 0.004); }
    else { this.burst('bandpass', 900 * r, 2, 0.1, 0.09); }
  }
  /** um item pronto na bancada: brilho curto */
  craftDone() { if (!this.ctx) return; this.tone(880, 880, 0.35, 0.05, 'triangle'); this.tone(1320, 1320, 0.5, 0.035, 'sine', 0.06); }
  /* ---------- o Limiar: um coro baixo e parado, sem melodia (o mundo fica em silêncio lá embaixo) ---------- */
  private limiarPad: { os: OscillatorNode[]; g: GainNode; lfo: OscillatorNode } | null = null;
  celestial(on: boolean) {
    if (!this.ctx) return; const ctx = this.ctx, now = ctx.currentTime;
    this.amb.gain.setTargetAtTime(on ? 0 : this.vol.amb, now, 0.8); this.mus.gain.setTargetAtTime(on || !this.music ? 0 : 0.09 * this.vol.music, now, 0.8);
    if (on && !this.limiarPad) {
      const g = ctx.createGain(); g.gain.value = 0; const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 900; fl.Q.value = 0.4;
      g.connect(this.master); fl.connect(g);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 380; lfo.connect(lg); lg.connect(fl.frequency); lfo.start();
      const os = [73.4, 110, 146.8, 220, 277.2, 329.6].map((f, i) => { const o = ctx.createOscillator(); o.type = i < 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (i % 2 ? 1 : -1) * (4 + i * 1.5);
        const og = ctx.createGain(); og.gain.value = [0.5, 0.35, 0.22, 0.14, 0.08, 0.06][i]; o.connect(og); og.connect(fl); o.start(); return o; });
      g.gain.setTargetAtTime(0.16, now, 2.5); this.limiarPad = { os, g, lfo };
    } else if (!on && this.limiarPad) { const lp = this.limiarPad; this.limiarPad = null; lp.g.gain.setTargetAtTime(0, now, 0.9); setTimeout(() => { for (const o of lp.os) o.stop(); lp.lfo.stop(); }, 4000); }
  }
  /** sino fundo do Limiar (fala de um Essencial, a escolha) */
  bell(f = 196, vol = 0.07) { if (!this.ctx) return; this.tone(f, f * 0.995, 4.5, vol, 'sine', 0, this.sfx, 0, 0.005); this.tone(f * 2.76, f * 2.75, 2.2, vol * 0.35, 'sine', 0, this.sfx, 0, 0.004); this.tone(f * 5.4, f * 5.38, 1.1, vol * 0.12, 'sine', 0, this.sfx, 0, 0.003); }
  /** a faísca da alma subindo: um zumbido que vibra e dispara para o agudo */
  soulRise(delay = 0, hum = 2.4) { if (!this.ctx) return; if (hum > 0) { this.tone(196, 247, hum + 0.1, 0.035, 'sine', delay, this.sfx, 0, 0.8); this.tone(392, 494, hum, 0.012, 'triangle', delay + hum * 0.5, this.sfx, 0, 0.4); } this.tone(330, 2600, 0.9, 0.05, 'sine', delay + hum, this.sfx, 0, 0.02); this.tone(660, 5200, 0.8, 0.02, 'triangle', delay + hum + 0.02, this.sfx, 0, 0.02); }
  error() { if (!this.ctx) return; this.tone(220, 180, 0.12, 0.05, 'square'); this.tone(180, 150, 0.16, 0.04, 'square', 0.12); }
  click() { if (!this.ctx) return; this.burst('bandpass', 1800, 3, 0.03, 0.05); }
  pickup() { if (!this.ctx) return; this.tone(880, 1320, 0.08, 0.04, 'triangle'); this.tone(1320, 1760, 0.1, 0.03, 'sine', 0.06); }
  levelup() { if (!this.ctx) return; for (const [f, d] of [[392, 0], [523, 0.12], [659, 0.24], [784, 0.36], [1047, 0.5]] as [number, number][]) this.tone(f, f, 0.8, 0.05, 'triangle', d); this.burst('highpass', 3000, 0.7, 1.2, 0.03); }

  /* ---------- natureza ---------- */
  private accentAt = 0;
  private canAccent(now: number, gap: number) { if (now < this.accentAt) return false; this.accentAt = now + gap; return true; }
  private bird(vol: number) { const pan = (Math.random() - 0.5) * 1.4, base = 1800 + Math.random() * 1800, n = 2 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) { const f = base * (0.9 + Math.random() * 0.3); this.tone(f, f * (Math.random() < 0.5 ? 1.6 : 0.7), 0.06 + Math.random() * 0.08, vol, 'sine', i * (0.09 + Math.random() * 0.08), this.amb, pan, 0.004); } }
  private cricket(vol: number) { const pan = (Math.random() - 0.5) * 1.6, f = 4000 + Math.random() * 800; for (let i = 0; i < 6; i++) this.tone(f, f, 0.03, vol, 'sine', i * 0.055, this.amb, pan, 0.003); }
  private owl(vol: number) { const pan = (Math.random() - 0.5); this.tone(420, 380, 0.35, vol, 'sine', 0, this.amb, pan, 0.05); this.tone(440, 360, 0.55, vol * 0.9, 'sine', 0.55, this.amb, pan, 0.05); }
  private howl(vol: number) { const pan = (Math.random() - 0.5) * 1.6; const o = this.tone(380, 620, 1.1, vol, 'sine', 0, this.amb, pan, 0.25); const ctx = this.ctx!; o.frequency.setValueAtTime(620, ctx.currentTime + 1.1); o.frequency.exponentialRampToValueAtTime(340, ctx.currentTime + 2.6); const o2 = this.tone(760, 1240, 1.0, vol * 0.3, 'triangle', 0.05, this.amb, pan, 0.3); o2.frequency.setValueAtTime(1240, ctx.currentTime + 1.05); o2.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 2.4); }

  /** sons ambientes esparsos: camadas que entram e saem, nunca tudo ao mesmo tempo */
  update(dt: number, p: { night: number; gust: number; fireDist: number; waterDist: number; riverDist?: number; forest?: number; snow?: number; inside?: boolean }) {
    const ctx = this.ctx; if (!ctx) return;
    const now = ctx.currentTime, day = 1 - p.night, inside = p.inside ? 0.25 : 1;
    // vento: bem mais baixo que antes; um sopro grave constante e um assobio só nas rajadas fortes
    const w = Math.max(0, p.gust - 0.5) / 0.5;
    this.windLo.gain.setTargetAtTime((0.006 + w * 0.01 + (p.snow ?? 0) * 0.008) * inside, now, 1.5);
    this.windHiF.frequency.setTargetAtTime(500 + w * 500, now, 1);
    this.windHi.gain.setTargetAtTime(w * w * 0.006 * inside, now, 1.2);
    // fogo: ronco baixo perto; estalos secos
    const prox = Math.max(0, 1 - p.fireDist / 9);
    this.fireG.gain.setTargetAtTime(0.04 * prox * prox, now, 0.5);
    if (prox > 0.15 && Math.random() < dt * prox * 2.2) this.burst('highpass', 1800 + Math.random() * 2500, 2, 0.012 + Math.random() * 0.02, 0.06 * prox, 1, this.amb, (Math.random() - 0.5) * 0.4, 0.001);
    // água: fonte perto e rio
    this.waterG.gain.setTargetAtTime(0.045 * Math.max(0, 1 - p.waterDist / 9) ** 2, now, 0.6);
    this.riverG.gain.setTargetAtTime(0.03 * Math.max(0, 1 - (p.riverDist ?? 99) / 14) ** 2 * inside, now, 0.8);
    // natureza
    if (!p.inside) {
      if (day > 0.4 && Math.random() < dt * 0.22 * (0.6 + (p.forest ?? 0)) && this.canAccent(now, 2.5)) this.bird(0.012 * day);
      if (p.night > 0.4 && Math.random() < dt * 0.35 && this.canAccent(now, 1.2)) this.cricket(0.004 * p.night);
      if (p.night > 0.6 && Math.random() < dt * 0.03 && this.canAccent(now, 12)) this.owl(0.02);
      if (p.night > 0.5 && Math.random() < dt * 0.012 * (0.5 + (p.forest ?? 0) + (p.snow ?? 0) * 1.5) && this.canAccent(now, 25)) this.howl(0.03);
    }
    this.tickMusic(dt, p.night, !!p.inside);
  }

  /* ---------- trilha ambiente gerada ---------- */
  private tickMusic(dt: number, night: number, inside: boolean) {
    if (!this.music) return;
    this.musicT += dt; const now = this.ctx!.currentTime;
    // pads respiram devagar; mais escuros à noite e dentro das criptas
    const breathe = 0.5 + 0.5 * Math.sin(this.musicT * 0.11);
    this.pads[0].g.gain.setTargetAtTime(0.12 + 0.08 * breathe, now, 2); this.pads[1].g.gain.setTargetAtTime((0.06 + 0.06 * (1 - breathe)) * (inside ? 0.5 : 1), now, 2);
    // a cada ~2–6 s uma nota da escala pentatônica menor (ré), às vezes um pequeno motivo de 2–3 notas
    this.nextNote -= dt; if (this.nextNote > 0) return;
    this.nextNote = 2 + Math.random() * 4 + night * 2;
    const scale = night > 0.5 ? [0, 3, 5, 7, 10, 12, 15] : [0, 2, 4, 7, 9, 12, 14]; // menor pentatônica à noite, maior pentatônica de dia
    const root = 146.8 * (inside ? 0.5 : 1); const n = Math.random() < 0.35 ? 3 : Math.random() < 0.5 ? 2 : 1;
    let deg = Math.floor(Math.random() * scale.length);
    for (let i = 0; i < n; i++) { const f = root * Math.pow(2, scale[deg] / 12) * (Math.random() < 0.3 ? 2 : 1); this.pluck(f, 1.6 + Math.random(), 0.09, i * (0.35 + Math.random() * 0.2), (Math.random() - 0.5) * 0.8); deg = Math.max(0, Math.min(scale.length - 1, deg + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2)))); }
    void this.key;
  }
}

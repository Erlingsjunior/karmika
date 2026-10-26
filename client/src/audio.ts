/** Som 100% procedural (WebAudio), sem arquivos: ambiente (vento baixo, pássaros, grilos, corujas, uivos, água, fogo),
 *  passos por terreno, golpes/magias, moedas e uma trilha ambiente gerada (pentatônica, pads + melodia esparsa). */
export type Surface = 'dirt' | 'stone' | 'grass' | 'snow' | 'water' | 'wood' | 'sand' | 'mud';
export type Mood = 'explore' | 'town' | 'dungeon' | 'evil' | 'elite' | 'boss';
export type SpellKind = 'fire' | 'ice' | 'arcane' | 'shock' | 'earth' | 'holy';

export class AudioEngine {
  private ctx?: AudioContext;
  private master!: GainNode; private amb!: GainNode; private sfx!: GainNode; private mus!: GainNode;
  private noise!: AudioBuffer;
  private windLo!: GainNode; private windHi!: GainNode; private windHiF!: BiquadFilterNode;
  private fireG!: GainNode; private waterG!: GainNode; private riverG!: GainNode; private riverLo!: GainNode;
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
    this.riverG = loop('bandpass', 900, 0.5).g; this.riverLo = loop('lowpass', 320, 0.7).g;
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

  /* ---------- passos (refeitos 25/10): calcanhar + ponta, textura de cada chão, variação a cada passo ---------- */
  private grains(n: number, span: number, f0: number, f1: number, vol: number, q = 1.2) { const ctx = this.ctx!; for (let i = 0; i < n; i++) { const d = Math.random() * span; const s = ctx.createBufferSource(); s.buffer = this.noise; const fl = ctx.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f0 + Math.random() * (f1 - f0); fl.Q.value = q; const g = ctx.createGain(); const t0 = ctx.currentTime + d; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol * (0.5 + Math.random() * 0.5), t0 + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.012 + Math.random() * 0.02); s.connect(fl); fl.connect(g); g.connect(this.sfx); s.start(t0, Math.random() * 1.5, 0.05); } }
  private stepSide = 1;
  step(surface: Surface, run: boolean) {
    if (!this.ctx) return;
    const v = (run ? 1 : 0.72) * 0.5, r = 0.88 + Math.random() * 0.24, pan = (this.stepSide = -this.stepSide) * 0.08, toe = run ? 0.035 : 0.055;
    const thump = (f: number, vol: number, dly = 0) => this.tone(f * r, f * 0.62 * r, 0.09, vol * v, 'sine', dly, this.sfx, pan, 0.004);
    switch (surface) {
      case 'stone': // pedra/piso de praça: estalo seco do salto, o bico raspando, um grão de areia
        this.burst('bandpass', 2300 * r, 1.4, 0.035, 0.07 * v, 1, this.sfx, pan, 0.001); thump(150, 0.05); this.burst('bandpass', 3200 * r, 1.8, 0.025, 0.035 * v, 1.1, this.sfx, pan, 0.001); this.burst('lowpass', 900 * r, 0.7, 0.05, 0.03 * v, 1, this.sfx, pan, 0.003); if (Math.random() < 0.3) this.grains(2, 0.05, 4000, 6500, 0.012 * v); break;
      case 'grass': // grama: folhas roçando (ataque lento) e um baque abafado de terra fofa
        { const f = this.burst('bandpass', 2600 * r, 0.7, 0.16, 0.035 * v, 0.9, this.sfx, pan, 0.03); f.frequency.exponentialRampToValueAtTime(1500, this.ctx.currentTime + 0.15); thump(70, 0.045); this.grains(3, 0.09, 2500, 4500, 0.008 * v, 0.8); } break;
      case 'sand': // areia: um chiado granulado que afunda, sem baque
        this.grains(9, 0.11, 1800, 4200, 0.022 * v, 0.9); this.burst('lowpass', 1300 * r, 0.6, 0.14, 0.035 * v, 0.7, this.sfx, pan, 0.02); thump(60, 0.02); break;
      case 'snow': // neve: crec-crec comprimido
        this.grains(7, 0.08, 900, 2200, 0.03 * v, 2.5); this.burst('lowpass', 1100 * r, 0.8, 0.12, 0.04 * v, 0.7, this.sfx, pan, 0.015); thump(65, 0.025); break;
      case 'mud': // lama: sucção molhada
        { const f = this.burst('bandpass', 500 * r, 2.5, 0.18, 0.06 * v, 0.6, this.sfx, pan, 0.02); f.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 0.16); thump(55, 0.04); } break;
      case 'water': // água rasa: splash e bolhas
        this.burst('bandpass', 1300 * r, 0.8, 0.22, 0.07 * v, 0.8, this.sfx, pan, 0.006); for (let i = 0; i < 3; i++) { const f = 500 + Math.random() * 700; this.tone(f, f * 1.8, 0.05, 0.012 * v, 'sine', 0.04 + i * 0.05 + Math.random() * 0.03, this.sfx, pan, 0.003); } break;
      case 'wood': // assoalho: batida oca (a tábua ressoa) e, às vezes, um rangido
        this.burst('bandpass', 1500 * r, 2, 0.03, 0.05 * v, 1, this.sfx, pan, 0.001); this.tone(190 * r, 160 * r, 0.12, 0.05 * v, 'triangle', 0, this.sfx, pan, 0.003); this.tone(290 * r, 250 * r, 0.08, 0.02 * v, 'sine', 0, this.sfx, pan, 0.003); thump(110, 0.04, toe);
        if (Math.random() < 0.08) { const o = this.tone(420 * r, 380 * r, 0.25, 0.008, 'sawtooth', 0.05, this.sfx, pan, 0.05); void o; } break;
      default: // terra batida: baque e pedrisco
        this.burst('lowpass', 700 * r, 0.7, 0.08, 0.06 * v, r, this.sfx, pan, 0.006); thump(85, 0.05); this.grains(3, 0.05, 2200, 4000, 0.014 * v);
    }
    if (run && Math.random() < 0.5) this.burst('bandpass', 1900, 0.7, 0.12, 0.012, 1, this.sfx, -pan, 0.04); // a roupa e o equipamento balançando na corrida
  }

  /* ---------- a voz do herói: esforço, dor e defesa (só às vezes) ---------- */
  voice: 'm' | 'f' = 'm'; private voiceAt = 0;
  private vocal(f0: number, f1: number, dur: number, vol: number, formants: [number, number, number][], breath = 0.3) {
    const ctx = this.ctx!, now = ctx.currentTime, o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, now); o.frequency.exponentialRampToValueAtTime(f1, now + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vol, now + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, now + dur); g.connect(this.sfx);
    for (const [f, q, a] of formants) { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * (this.voice === 'f' ? 1.17 : 1); bp.Q.value = q; const ag = ctx.createGain(); ag.gain.value = a; o.connect(bp); bp.connect(ag); ag.connect(g); }
    o.start(now); o.stop(now + dur + 0.05); if (breath) this.burst('bandpass', 1800, 0.6, dur * 0.9, vol * breath, 1, this.sfx, 0, 0.01);
  }
  /** kind: atk = "rá!", heavy = "hyaah!", hurt = "unh", block = "hmf" */
  effort(kind: 'atk' | 'heavy' | 'hurt' | 'block', force = false) {
    if (!this.ctx) return; const now = this.ctx.currentTime; const ch = { atk: 0.2, heavy: 0.55, hurt: 0.32, block: 0.25 }[kind];
    if (!force && (now < this.voiceAt || Math.random() > ch)) return; this.voiceAt = now + (kind === 'hurt' ? 1.3 : 1.9);
    const p = (this.voice === 'f' ? 230 : 128) * (0.94 + Math.random() * 0.12);
    if (kind === 'atk') this.vocal(p * 1.15, p * 0.8, 0.17, 0.11, [[760, 6, 1], [1250, 8, 0.6], [2600, 10, 0.2]], 0.35);
    else if (kind === 'heavy') this.vocal(p * 1.3, p * 0.75, 0.32, 0.12, [[820, 6, 1], [1300, 8, 0.55], [2700, 10, 0.2]], 0.4);
    else if (kind === 'hurt') this.vocal(p * 1.05, p * 0.7, 0.24, 0.1, [[520, 7, 1], [960, 8, 0.45], [2400, 10, 0.12]], 0.25);
    else this.vocal(p * 0.95, p * 0.8, 0.14, 0.08, [[380, 6, 1], [900, 8, 0.25]], 0.45);
  }

  /* ---------- combate ---------- */
  swing() { if (!this.ctx) return; this.effort('atk'); const c = this.ctx.currentTime, k = 0.85 + Math.random() * 0.3; const f = this.burst('bandpass', 700 * k, 1.4, 0.32, 0.1, 0.9 * k); f.frequency.setValueAtTime(380, c); f.frequency.exponentialRampToValueAtTime(1500, c + 0.14); f.frequency.exponentialRampToValueAtTime(520, c + 0.3); /* lâmina pesada cortando o ar */ }
  hit() { if (!this.ctx) return; this.metal(1700 + Math.random() * 400, 0.18, 0.05); this.burst('bandpass', 2500, 2, 0.05, 0.1); this.burst('lowpass', 500, 0.8, 0.12, 0.12); this.tone(160, 60, 0.14, 0.1); }
  /** lâmina cortando carne: mordida aguda do fio + rasgo úmido descendo + baque do corpo — nada de metal batendo */
  slash(crit = false) {
    if (!this.ctx) return; if (crit) this.effort('heavy'); const c = this.ctx.currentTime, k = crit ? 1.35 : 1;
    this.burst('highpass', 4200, 0.7, 0.05, 0.1 * k, 1.1, this.sfx, 0, 0.001);
    const r = this.burst('bandpass', 1800, 1.6, 0.16, 0.13 * k, 0.9); r.frequency.setValueAtTime(1800, c); r.frequency.exponentialRampToValueAtTime(420, c + 0.15);
    this.burst('lowpass', 360, 0.8, 0.16, 0.17 * k, 0.8); this.tone(105, 48, 0.14, 0.09 * k);
    if (crit) { const r2 = this.burst('bandpass', 900, 2, 0.22, 0.08, 0.7); r2.frequency.exponentialRampToValueAtTime(260, c + 0.2); }
  }
  /** aparo: lâmina contra lâmina — anel metálico curto e faísca */
  parry() { if (!this.ctx) return; this.effort('block'); this.metal(2300 + Math.random() * 300, 0.42, 0.07); this.metal(3400, 0.25, 0.035); this.burst('highpass', 5000, 1.2, 0.06, 0.08, 1, this.sfx, 0, 0.001); this.burst('lowpass', 500, 0.8, 0.08, 0.06); }
  /** escudo de madeira e couro absorvendo o golpe: baque grave, estalo de tábua, só um toque do aro de ferro */
  block() { if (!this.ctx) return; this.effort('block'); this.burst('lowpass', 280, 0.9, 0.2, 0.2); this.burst('bandpass', 750, 1.4, 0.07, 0.11, 1, this.sfx, 0, 0.001); this.tone(85, 45, 0.18, 0.12); this.metal(1100, 0.12, 0.018); }
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
    if (!this.ctx) return; { const c = this.ctx.currentTime, f = this.burst('bandpass', 400, 1.2, 0.45, 0.05, 1, this.sfx, 0, 0.12); f.frequency.exponentialRampToValueAtTime(2400, c + 0.4); } // o ar sendo puxado antes da magia sair
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
  /** usar item (25/10, Erling: "não vejo animação nem barulho ao trocar item"): gole, mastigar, vestir pano/couro, encaixar metal, trocar ferramenta */
  gulp() { if (!this.ctx) return; for (let i = 0; i < 3; i++) { const d = i * 0.22; this.tone(220 + Math.random() * 40, 120, 0.12, 0.05, 'sine', d); setTimeout(() => this.burst('lowpass', 500, 2, 0.08, 0.05), d * 1000); } this.tone(880, 1200, 0.05, 0.02, 'sine', 0.7); }
  chew() { if (!this.ctx) return; for (let i = 0; i < 4; i++) setTimeout(() => { this.burst('bandpass', 1400 + Math.random() * 900, 1.6, 0.06, 0.06); this.burst('lowpass', 300, 1, 0.05, 0.04); }, i * 160 + Math.random() * 40); }
  equip(kind: 'metal' | 'cloth' | 'leather' | 'jewel' | 'tool') { if (!this.ctx) return;
    if (kind === 'cloth') { this.burst('bandpass', 2400, 0.7, 0.22, 0.06); setTimeout(() => this.burst('bandpass', 1800, 0.8, 0.16, 0.05), 140); }
    else if (kind === 'leather') { this.burst('lowpass', 900, 1.2, 0.12, 0.08); setTimeout(() => this.burst('bandpass', 1300, 2, 0.06, 0.06), 120); this.tone(160, 120, 0.06, 0.04, 'triangle', 0.18); }
    else if (kind === 'jewel') { this.tone(2400, 2400, 0.4, 0.04, 'sine'); this.tone(3600, 3600, 0.5, 0.025, 'sine', 0.06); }
    else if (kind === 'tool') { this.burst('lowpass', 700, 1.4, 0.08, 0.08); this.metal(520, 0.25, 0.05, 0.05); }
    else { this.burst('bandpass', 1600, 1.2, 0.06, 0.07); this.metal(380 + Math.random() * 80, 0.45, 0.08, 0.02); this.metal(900, 0.25, 0.03, 0.12); } }
  hurt() { if (!this.ctx) return; this.effort('hurt'); this.burst('lowpass', 700, 0.8, 0.12, 0.12); this.tone(120, 70, 0.16, 0.08); }
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
  /** trocar uma peça de equipamento: couro raspando, a fivela batendo e o metal assentando */
  swap() { if (!this.ctx) return; const f = this.burst('bandpass', 1400, 1.2, 0.18, 0.09, 1.1); f.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.16); this.metal(2100, 0.16, 0.035, 0.16); this.burst('lowpass', 380, 0.8, 0.09, 0.08, 1, this.sfx, 0, 0.002); this.metal(1500, 0.3, 0.03, 0.34); }
  /** Instinto ligado (25/10): um baque grave, o ar sendo puxado (a lente abrindo), dois toques de alerta e o coração batendo duas vezes.
   *  Desligado: o mesmo ar soltando, descendo. */
  instinct(on: boolean) { if (!this.ctx) return;
    if (on) { this.tone(78, 42, 0.55, 0.16, 'sine'); const f = this.burst('bandpass', 380, 1.1, 0.7, 0.09, 1, this.sfx, 0, 0.25); f.frequency.exponentialRampToValueAtTime(2600, this.ctx.currentTime + 0.65);
      this.tone(988, 988, 0.5, 0.035, 'sine', 0.42); this.tone(1480, 1480, 0.7, 0.03, 'sine', 0.58); this.tone(1976, 1976, 0.9, 0.012, 'triangle', 0.58);
      this.tone(64, 40, 0.16, 0.12, 'sine', 0.95); this.tone(60, 38, 0.18, 0.09, 'sine', 1.2); }
    else { const f = this.burst('bandpass', 1800, 1.1, 0.45, 0.05, 1); f.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.42); this.tone(660, 330, 0.35, 0.025, 'sine'); } }
  /** guincho de ratazana (o Instinto ouve os ninhos): v = 0..1, mais alto quanto mais perto */
  squeak(v = 1) { if (!this.ctx) return; const k = Math.max(0.05, Math.min(1, v)), n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) { const f = 2400 + Math.random() * 1400, d = i * (0.07 + Math.random() * 0.05); this.tone(f, f * (1.25 + Math.random() * 0.3), 0.06 + Math.random() * 0.04, 0.03 * k, 'square', d); this.tone(f * 1.5, f * 1.1, 0.05, 0.015 * k, 'sine', d + 0.02); }
    this.burst('highpass', 4200, 2, 0.12, 0.012 * k); }
  click() { if (!this.ctx) return; this.burst('bandpass', 1800, 3, 0.03, 0.05); }
  pickup() { if (!this.ctx) return; this.tone(880, 1320, 0.08, 0.04, 'triangle'); this.tone(1320, 1760, 0.1, 0.03, 'sine', 0.06); }
  levelup() { if (!this.ctx) return; for (const [f, d] of [[392, 0], [523, 0.12], [659, 0.24], [784, 0.36], [1047, 0.5]] as [number, number][]) this.tone(f, f, 0.8, 0.05, 'triangle', d); this.burst('highpass', 3000, 0.7, 1.2, 0.03); }

  /* ---------- natureza ---------- */
  private accentAt = 0;
  private canAccent(now: number, gap: number) { if (now < this.accentAt) return false; this.accentAt = now + gap; return true; }
  /** cinco cantos diferentes: trinado, gorjeio, cuco, assobio subindo e o pica-pau */
  private birdSong(vol: number, forest: number) { const pan = (Math.random() - 0.5) * 1.6, sp = Math.floor(Math.random() * (forest > 0.4 ? 5 : 4));
    if (sp === 0) { const f = 3200 + Math.random() * 1200; for (let i = 0; i < 10; i++) this.tone(f * (1 + (i % 2) * 0.08), f, 0.035, vol * 0.8, 'sine', i * 0.045, this.amb, pan, 0.003); }
    else if (sp === 1) this.bird(vol);
    else if (sp === 2) { const f = 620 + Math.random() * 60; this.tone(f, f, 0.22, vol * 1.3, 'sine', 0, this.amb, pan, 0.02); this.tone(f * 0.8, f * 0.8, 0.3, vol * 1.3, 'sine', 0.3, this.amb, pan, 0.02); }
    else if (sp === 3) { const f = 1800 + Math.random() * 600; this.tone(f, f * 1.6, 0.3, vol, 'sine', 0, this.amb, pan, 0.03); this.tone(f * 1.6, f * 1.2, 0.18, vol * 0.8, 'sine', 0.32, this.amb, pan, 0.01); }
    else { for (let i = 0; i < 12; i++) this.burst('bandpass', 1900, 4, 0.02, vol * 1.6, 1, this.amb, pan, 0.001); for (let i = 0; i < 12; i++) this.tone(1100, 900, 0.02, vol * 0.6, 'triangle', i * 0.05, this.amb, pan, 0.001); } }
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
    this.windLo.gain.setTargetAtTime((0.0022 + w * 0.004 + (p.snow ?? 0) * 0.004) * inside, now, 1.5); /* Erling: o vento ainda incomodava — agora é só um fundo */
    this.windHiF.frequency.setTargetAtTime(500 + w * 500, now, 1);
    this.windHi.gain.setTargetAtTime(w * w * w * 0.0025 * inside, now, 1.2);
    // fogo: ronco baixo perto; estalos secos
    const prox = Math.max(0, 1 - p.fireDist / 9);
    this.fireG.gain.setTargetAtTime(0.04 * prox * prox, now, 0.5);
    if (prox > 0.15 && Math.random() < dt * prox * 2.2) this.burst('highpass', 1800 + Math.random() * 2500, 2, 0.012 + Math.random() * 0.02, 0.06 * prox, 1, this.amb, (Math.random() - 0.5) * 0.4, 0.001);
    // água: fonte perto e rio
    this.waterG.gain.setTargetAtTime(0.045 * Math.max(0, 1 - p.waterDist / 9) ** 2, now, 0.6);
    this.riverG.gain.setTargetAtTime(0.03 * Math.max(0, 1 - (p.riverDist ?? 99) / 14) ** 2 * inside, now, 0.8);
    { const rk = Math.max(0, 1 - (p.riverDist ?? 99) / 18) ** 2 * inside; this.riverLo.gain.setTargetAtTime(0.05 * rk, now, 0.8); /* o rio corre: grave constante e gotas/borbulhas soltas */
      if (rk > 0.05 && Math.random() < dt * 6 * rk) { const f = 600 + Math.random() * 1400; this.tone(f, f * (1.4 + Math.random()), 0.04 + Math.random() * 0.05, 0.01 * rk, 'sine', 0, this.amb, (Math.random() - 0.5) * 1.2, 0.003); } }
    if (p.inside && this.mood === 'dungeon' && Math.random() < dt * 0.25) { const f = 900 + Math.random() * 900; this.tone(f, f * 0.6, 0.12, 0.02, 'sine', 0, this.amb, (Math.random() - 0.5) * 1.4, 0.002); this.tone(f * 0.5, f * 0.45, 0.6, 0.006, 'sine', 0.12, this.amb, 0, 0.01); } // gota pingando na masmorra
    // natureza
    if (!p.inside) {
      if (day > 0.4 && Math.random() < dt * 0.3 * (0.6 + (p.forest ?? 0)) && this.canAccent(now, 1.8)) this.birdSong(0.012 * day, p.forest ?? 0);
      if (p.night > 0.4 && Math.random() < dt * 0.35 && this.canAccent(now, 1.2)) this.cricket(0.004 * p.night);
      if (p.night > 0.6 && Math.random() < dt * 0.03 && this.canAccent(now, 12)) this.owl(0.02);
      if (p.night > 0.5 && Math.random() < dt * 0.012 * (0.5 + (p.forest ?? 0) + (p.snow ?? 0) * 1.5) && this.canAccent(now, 25)) this.howl(0.03);
    }
    this.tickMusic(dt, p.night, !!p.inside);
  }

  /* ---------- trilha ambiente gerada ---------- */
  /** o clima da trilha: explorar, vila, masmorra, lugar maligno, luta com elite, chefe */
  mood: Mood = 'explore'; private beat = 0; private beatN = 0;
  setMood(m: Mood) { if (m === this.mood) return; this.mood = m; this.nextNote = 0.3; this.beat = 0; }
  private drum(f: number, vol: number, dly = 0, noise = 0.6) { this.tone(f, f * 0.45, 0.28, vol, 'sine', dly, this.mus, 0, 0.003); this.burst('lowpass', 900, 0.8, 0.09, vol * noise, 1, this.mus, 0, 0.002); }
  private tickMusic(dt: number, night: number, inside: boolean) {
    if (!this.music) return;
    { const M = this.mood, now0 = this.ctx!.currentTime;
      const ROOT: Record<Mood, [number, number]> = { explore: [73.4, 110], town: [98, 146.8], dungeon: [55, 77.8], evil: [51.9, 73.4], elite: [65.4, 98], boss: [55, 82.4] };
      this.pads[0].o.frequency.setTargetAtTime(ROOT[M][0], now0, 1.5); this.pads[1].o.frequency.setTargetAtTime(ROOT[M][1], now0, 1.5);
      if (M === 'elite' || M === 'boss') { // tambores de guerra e um riff em menor harmônica
        this.musicT += dt; const bpm = M === 'boss' ? 148 : 118, spb = 60 / bpm; this.beat -= dt; this.pads[0].g.gain.setTargetAtTime(0.16, now0, 0.5); this.pads[1].g.gain.setTargetAtTime(0.12, now0, 0.5);
        if (this.beat <= 0) { this.beat += spb / 2; const b = this.beatN++ % 16, root = M === 'boss' ? 110 : 130.8, sc = [0, 2, 3, 5, 7, 8, 11, 12];
          if (b % 4 === 0) this.drum(62, 0.5); if (b % 8 === 6 || (M === 'boss' && b % 4 === 3)) this.drum(98, 0.28, 0, 0.9); if (b % 2 === 1) this.burst('highpass', 6000, 0.7, 0.03, 0.04, 1, this.mus, 0.2, 0.001);
          if (M === 'boss' && b === 15) for (let i = 0; i < 3; i++) this.drum(120 - i * 18, 0.25, i * spb / 6);
          const riff = M === 'boss' ? [0, 0, 3, 0, 5, 0, 6, 7, 0, 0, 3, 0, 8, 7, 5, 3] : [0, -1, 3, -1, 5, -1, 3, 2, 0, -1, 3, -1, 7, 5, 3, 2];
          const dg = riff[b]; if (dg >= 0) { const f = root * Math.pow(2, sc[Math.min(7, dg)] / 12); this.tone(f, f, spb * 0.45, M === 'boss' ? 0.07 : 0.06, 'sawtooth', 0, this.mus, 0, 0.005); this.tone(f / 2, f / 2, spb * 0.45, 0.05, 'triangle', 0, this.mus, 0, 0.005); }
          if (M === 'boss' && b % 8 === 0) for (const k of [0, 3, 7]) { const f = root * 2 * Math.pow(2, k / 12); this.tone(f, f * 0.99, spb * 2.5, 0.025, 'sawtooth', 0, this.mus, (k - 3) * 0.1, 0.03); } }
        return; }
      if (M === 'dungeon' || M === 'evil') { // drone grave, notas raras na escala frígia, um gongo distante
        this.musicT += dt; this.pads[0].g.gain.setTargetAtTime(0.18, now0, 2); this.pads[1].g.gain.setTargetAtTime(0.06 + 0.05 * Math.sin(this.musicT * (M === 'evil' ? 2.2 : 0.2)) ** 2, now0, 0.4);
        this.nextNote -= dt; if (this.nextNote > 0) return; this.nextNote = 4 + Math.random() * 5;
        const sc = M === 'evil' ? [0, 1, 4, 5, 6, 8, 11] : [0, 1, 3, 5, 7, 8, 10], root = M === 'evil' ? 103.8 : 110;
        const f = root * Math.pow(2, sc[Math.floor(Math.random() * sc.length)] / 12) * (Math.random() < 0.3 ? 2 : 1); this.tone(f, f * 0.998, 3.5, 0.05, 'triangle', 0, this.mus, (Math.random() - 0.5) * 0.8, 0.4);
        if (Math.random() < 0.35) { const g = M === 'evil' ? 61.7 : 55; this.tone(g, g * 0.97, 5, 0.09, 'sine', 0.5, this.mus, 0, 0.005); this.tone(g * 2.76, g * 2.7, 3, 0.02, 'sine', 0.5, this.mus, 0, 0.005); }
        return; }
      if (M === 'town') { // vila: alaúde alegre em pentatônica maior, motivos mais frequentes
        this.musicT += dt; this.nextNote -= dt; this.pads[0].g.gain.setTargetAtTime(0.1, now0, 2); this.pads[1].g.gain.setTargetAtTime(0.08, now0, 2); if (this.nextNote > 0) return; this.nextNote = 1.4 + Math.random() * 2.2;
        const sc = [0, 2, 4, 7, 9, 12, 14, 16], root = 196 * (night > 0.5 ? 0.75 : 1); let deg = Math.floor(Math.random() * 5);
        for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) { const f = root * Math.pow(2, sc[deg] / 12); this.pluck(f, 1.0, 0.08, i * 0.24, (Math.random() - 0.5) * 0.6); deg = Math.max(0, Math.min(7, deg + (Math.random() < 0.55 ? 1 : -1))); }
        if (Math.random() < 0.4) this.pluck(root / 2, 1.8, 0.07, 0, 0); return; } }
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

  /* ---------- coro distante (Dia da Aurora) e o pulso surdo da Lua de Sangue ---------- */
  private choirV: { root: GainNode; voices: { o: OscillatorNode; o2: OscillatorNode; g: GainNode }[]; lfo: OscillatorNode; t: number; ch: number } | null = null;
  private bloodV: { g: GainNode; os: OscillatorNode[]; t: number } | null = null;
  /** k 0..1: quanto do coro se ouve. Vozes em "aah" (formantes) por trás de um eco longo e de um filtro, como se viesse de longe, de uma igreja no alto do vale */
  choir(k: number, dt: number) {
    const ctx = this.ctx; if (!ctx) return; const now = ctx.currentTime;
    if (k > 0.01 && !this.choirV) {
      const root = ctx.createGain(); root.gain.value = 0;
      const far = ctx.createBiquadFilter(); far.type = 'lowpass'; far.frequency.value = 2400; far.Q.value = 0.3;
      const dl = ctx.createDelay(1.5); dl.delayTime.value = 0.41; const fb = ctx.createGain(); fb.gain.value = 0.55; const dlF = ctx.createBiquadFilter(); dlF.type = 'lowpass'; dlF.frequency.value = 1600;
      const dl2 = ctx.createDelay(1.5); dl2.delayTime.value = 0.67; const fb2 = ctx.createGain(); fb2.gain.value = 0.45;
      root.connect(far); far.connect(this.master); far.connect(dl); dl.connect(dlF); dlF.connect(fb); fb.connect(dl); dlF.connect(this.master);
      far.connect(dl2); dl2.connect(fb2); fb2.connect(dl2); dl2.connect(this.master);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 5.2; lfo.start();
      const voices: { o: OscillatorNode; o2: OscillatorNode; g: GainNode }[] = [];
      for (let i = 0; i < 4; i++) {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.detune.value = 7 + i * 2; o.detune.value = -5 - i;
        const vib = ctx.createGain(); vib.gain.value = 5 + i; lfo.connect(vib); vib.connect(o.detune); vib.connect(o2.detune);
        const g = ctx.createGain(); g.gain.value = 0; const mix = ctx.createGain(); mix.gain.value = 0.5; o.connect(mix); o2.connect(mix);
        for (const [f, q, a] of [[800, 9, 1], [1150, 10, 0.55], [2900, 12, 0.18]] as [number, number, number][]) { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * (i > 1 ? 1.08 : 1); bp.Q.value = q; const ag = ctx.createGain(); ag.gain.value = a; mix.connect(bp); bp.connect(ag); ag.connect(g); }
        g.connect(root); o.start(); o2.start(); voices.push({ o, o2, g });
      }
      this.choirV = { root, voices, lfo, t: 0, ch: -1 };
    }
    const cv = this.choirV; if (!cv) return;
    cv.root.gain.setTargetAtTime(k * 0.22 * (this.music ? 1 : 0.6), now, 2.5);
    if (k <= 0.01) { if (cv.root.gain.value < 0.002) { for (const v of cv.voices) { v.o.stop(); v.o2.stop(); } cv.lfo.stop(); this.choirV = null; } return; }
    cv.t -= dt; if (cv.t > 0) return; cv.t = 6 + Math.random() * 3;
    /* progressão lenta e luminosa (Ré maior): I, IV, vi, V, I sus */
    const prog = [[146.8, 220, 293.7, 370], [196, 246.9, 293.7, 392], [123.5, 246.9, 293.7, 370], [110, 220, 277.2, 330], [146.8, 220, 293.7, 440]];
    cv.ch = (cv.ch + 1) % prog.length; const ch = prog[cv.ch];
    cv.voices.forEach((v, i) => { const f = ch[i]; v.o.frequency.setTargetAtTime(f, now, 0.9); v.o2.frequency.setTargetAtTime(f, now, 0.9); v.g.gain.cancelScheduledValues(now); v.g.gain.setTargetAtTime(0.0, now, 0.6); v.g.gain.setTargetAtTime([0.9, 0.7, 0.6, 0.45][i], now + 0.7, 1.4); });
  }
  /** k 0..1: um pulso grave como um coração gigante e um zumbido baixo, sob a Lua de Sangue */
  blood(k: number, dt: number) {
    const ctx = this.ctx; if (!ctx) return; const now = ctx.currentTime;
    if (k > 0.01 && !this.bloodV) { const g = ctx.createGain(); g.gain.value = 0; const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 260; g.connect(this.master); fl.connect(g);
      const os = [55, 58.3, 82.4].map((f, i) => { const o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sawtooth'; o.frequency.value = f; const og = ctx.createGain(); og.gain.value = [0.5, 0.35, 0.2][i]; o.connect(og); og.connect(fl); o.start(); return o; });
      this.bloodV = { g, os, t: 1 }; }
    const bv = this.bloodV; if (!bv) return;
    bv.g.gain.setTargetAtTime(k * 0.05, now, 2);
    if (k <= 0.01) { if (bv.g.gain.value < 0.001) { for (const o of bv.os) o.stop(); this.bloodV = null; } return; }
    bv.t -= dt; if (bv.t <= 0) { bv.t = 1.7 + Math.random() * 0.4; this.tone(62, 38, 0.22, 0.07 * k, 'sine', 0, this.amb, 0, 0.005); this.tone(58, 36, 0.26, 0.05 * k, 'sine', 0.24, this.amb, 0, 0.005); }
  }
}

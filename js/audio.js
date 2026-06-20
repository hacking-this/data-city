/* =====================================================================
   SYNTHWAVE — a self-contained Web Audio synthwave engine.
   No files, no libraries: drums + bass + arp + pad are synthesized live
   from oscillators, and an AnalyserNode exposes real frequency levels so
   the city can react to the ACTUAL audio (not a fake timer).
   ===================================================================== */

class SynthwaveAudio {
  constructor() {
    this.ctx = null;
    this.playing = false;
    this.bpm = 112;
    this.master = null;
    this.analyser = null;
    this.freq = null;          // Uint8Array of frequency bins
    this.bassAvg = 0;          // running average for beat detection
    this.levels = { bass: 0, mid: 0, treble: 0, level: 0, beat: 0 };

    // i - VI - III - VII in A minor: Am, F, C, G (classic uplifting synthwave)
    // each chord = [root, third, fifth] in Hz (low octave for bass refs)
    this.prog = [
      { root: 110.00, tones: [220.00, 261.63, 329.63] }, // Am  (A C E)
      { root: 87.31,  tones: [174.61, 220.00, 261.63] }, // F   (F A C)
      { root: 130.81, tones: [261.63, 329.63, 392.00] }, // C   (C E G)
      { root: 98.00,  tones: [196.00, 246.94, 293.66] }, // G   (G B D)
    ];

    this._timer = null;
    this.nextNoteTime = 0;
    this.step = 0;             // 16th-note step within the loop (0..63)
  }

  // Must be called from a user gesture (autoplay policy).
  start(volume = 0.16) {
    if (this.playing) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    if (!this.ctx) this._build(AC);
    this.ctx.resume();
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.master.gain.exponentialRampToValueAtTime(volume, this.ctx.currentTime + 1.2);
    this.playing = true;
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.06;
    this._scheduler();
    return true;
  }

  stop() {
    if (!this.playing || !this.ctx) return;
    this.playing = false;
    clearTimeout(this._timer);
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  }

  setVolume(v) {
    if (!this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.linearRampToValueAtTime(Math.max(0.0001, v), t + 0.1);
  }

  _build(AC) {
    const ctx = new AC();
    this.ctx = ctx;

    // master chain: gain -> soft compressor -> analyser -> destination
    this.master = ctx.createGain();
    this.master.gain.value = 0.0001;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 24;
    comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.25;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.78;
    this.freq = new Uint8Array(this.analyser.frequencyBinCount);

    // a shared delay (synthwave "wet" tail) for arp/lead
    this.delay = ctx.createDelay(1.0);
    this.delay.delayTime.value = 60 / this.bpm * 0.75; // dotted-eighth-ish
    this.delayFb = ctx.createGain(); this.delayFb.gain.value = 0.34;
    this.delayMix = ctx.createGain(); this.delayMix.gain.value = 0.5;
    this.delay.connect(this.delayFb); this.delayFb.connect(this.delay);
    this.delay.connect(this.delayMix); this.delayMix.connect(this.master);

    this.master.connect(comp); comp.connect(this.analyser); this.analyser.connect(ctx.destination);
  }

  /* ---- lookahead scheduler (the standard Web Audio metronome) ------- */
  _scheduler() {
    if (!this.playing) return;
    const sixteenth = 60 / this.bpm / 4;
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this._scheduleStep(this.step, this.nextNoteTime);
      this.nextNoteTime += sixteenth;
      this.step = (this.step + 1) % 64; // 4 bars x 16 steps
    }
    this._timer = setTimeout(() => this._scheduler(), 25);
  }

  _scheduleStep(step, time) {
    const bar = Math.floor(step / 16);
    const inBar = step % 16;        // 0..15 sixteenths
    const chord = this.prog[bar];

    // --- drums ---
    if (inBar % 4 === 0) this._kick(time);                 // 4-on-the-floor
    if (inBar === 4 || inBar === 12) this._snare(time);    // backbeat
    if (inBar % 2 === 0) this._hat(time, inBar % 4 === 2); // 8th hats, open-ish offbeat

    // --- bass: driving eighths, root with an octave lift ---
    if (inBar % 2 === 0) {
      const oct = (inBar % 8 === 4) ? 2 : 1;
      this._bass(chord.root * oct, time, sixteenthDur(this.bpm) * 1.8);
    }

    // --- arp: 16th arpeggio cycling chord tones (with delay tail) ---
    const arpTone = chord.tones[(step) % chord.tones.length] * 2; // up an octave
    this._arp(arpTone, time, sixteenthDur(this.bpm) * 0.9);

    // --- pad: sustain a chord at the top of each bar ---
    if (inBar === 0) this._pad(chord.tones, time, 60 / this.bpm * 3.6);
  }

  /* ---- instruments ---- */
  _env(node, time, a, d, peak, sus) {
    const g = node.gain;
    g.cancelScheduledValues(time);
    g.setValueAtTime(0.0001, time);
    g.exponentialRampToValueAtTime(peak, time + a);
    g.exponentialRampToValueAtTime(Math.max(0.0001, sus), time + a + d);
  }

  _kick(time) {
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150, time);
    o.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    g.gain.setValueAtTime(0.9, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.26);
    o.connect(g); g.connect(this.master);
    o.start(time); o.stop(time + 0.3);
  }

  _snare(time) {
    const noise = this._noise(0.2);
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.5, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
    noise.connect(bp); bp.connect(g); g.connect(this.master);
    noise.start(time); noise.stop(time + 0.2);
  }

  _hat(time, open) {
    const noise = this._noise(open ? 0.12 : 0.05);
    const hp = this.ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(open ? 0.18 : 0.12, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + (open ? 0.12 : 0.05));
    noise.connect(hp); hp.connect(g); g.connect(this.master);
    noise.start(time); noise.stop(time + 0.14);
  }

  _bass(freq, time, dur) {
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 600; lp.Q.value = 6;
    o.type = "sawtooth"; o.frequency.value = freq;
    this._env(g, time, 0.008, dur, 0.34, 0.0001);
    o.connect(lp); lp.connect(g); g.connect(this.master);
    o.start(time); o.stop(time + dur + 0.05);
  }

  _arp(freq, time, dur) {
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = "square"; o.frequency.value = freq;
    this._env(g, time, 0.005, dur, 0.12, 0.0001);
    o.connect(g); g.connect(this.master); g.connect(this.delay);
    o.start(time); o.stop(time + dur + 0.05);
  }

  _pad(tones, time, dur) {
    tones.forEach((f) => {
      [-0.18, 0.18].forEach((det) => {  // detuned pair per tone = lush
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
        const lp = this.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1600;
        o.type = "sawtooth"; o.frequency.value = f; o.detune.value = det * 100;
        this._env(g, time, 0.5, dur, 0.05, 0.0001);
        o.connect(lp); lp.connect(g); g.connect(this.master);
        o.start(time); o.stop(time + dur + 0.1);
      });
    });
  }

  _noise(dur) {
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, Math.ceil(sr * dur), sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    return src;
  }

  /* ---- analysis: real levels for the visualizer ---- */
  getLevels() {
    if (!this.analyser || !this.playing) {
      // ease back to silence-ish
      this.levels.bass *= 0.9; this.levels.mid *= 0.9; this.levels.treble *= 0.9;
      this.levels.level *= 0.9; this.levels.beat *= 0.8;
      return this.levels;
    }
    this.analyser.getByteFrequencyData(this.freq);
    const f = this.freq, n = f.length;
    const band = (lo, hi) => { let s = 0; for (let i = lo; i < hi; i++) s += f[i]; return s / (hi - lo) / 255; };
    const bass = band(1, 8);
    const mid = band(16, 64);
    const treble = band(90, 220);
    let sum = 0; for (let i = 0; i < n; i++) sum += f[i];
    const level = sum / n / 255;

    // beat = positive bass transient vs running average
    const prev = this.bassAvg;
    this.bassAvg = this.bassAvg * 0.92 + bass * 0.08;
    const transient = Math.max(0, bass - prev * 1.25);
    this.levels.beat = Math.max(this.levels.beat * 0.82, Math.min(1, transient * 6));

    this.levels.bass = bass;
    this.levels.mid = mid;
    this.levels.treble = treble;
    this.levels.level = level;
    return this.levels;
  }
}

function sixteenthDur(bpm) { return 60 / bpm / 4; }

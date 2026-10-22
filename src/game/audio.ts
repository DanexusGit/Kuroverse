// Procedural WebAudio SFX — no assets, low latency, throttled.
type Ctx = AudioContext;

class AudioBus {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private comp: DynamicsCompressorNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private budget: Record<string, number> = {};
  private voices = 0;
  private voicesT = 0;
  enabled = true;

  init() {
    if (this.ctx) return;
    const AC: typeof AudioContext =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.34;
      this.comp = this.ctx.createDynamicsCompressor();
      this.comp.threshold.value = -16;
      this.comp.knee.value = 22;
      this.comp.ratio.value = 12;
      this.comp.attack.value = 0.003;
      this.comp.release.value = 0.22;
      this.comp.connect(this.master);
      this.master.connect(this.ctx.destination);

      const len = Math.floor(this.ctx.sampleRate * 0.7);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    } catch {
      this.ctx = null;
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (this.master) this.master.gain.value = v ? 0.34 : 0;
  }

  private allow(key: string, ms: number) {
    const now = performance.now();
    if ((this.budget[key] ?? -1e9) + ms > now) return false;
    this.budget[key] = now;
    return true;
  }

  /** voice limiter: heavy fire rates would otherwise spawn hundreds of nodes/sec */
  private slot() {
    const now = performance.now();
    if (now - this.voicesT > 250) { this.voicesT = now; this.voices = 0; }
    return ++this.voices <= 26;
  }

  private tone(
    type: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    gain: number,
    delay = 0,
    detune = 0,
  ) {
    if (!this.ctx || !this.comp || !this.enabled || !this.slot()) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(Math.max(20, f0), t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.comp);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  private noise(
    dur: number,
    gain: number,
    filter: BiquadFilterType,
    f0: number,
    f1: number,
    delay = 0,
    q = 1,
  ) {
    if (!this.ctx || !this.comp || !this.noiseBuf || !this.enabled || !this.slot()) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bq = this.ctx.createBiquadFilter();
    bq.type = filter;
    bq.Q.value = q;
    bq.frequency.setValueAtTime(f0, t);
    bq.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bq);
    bq.connect(g);
    g.connect(this.comp);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  shot(kind: string) {
    if (!this.allow("shot" + kind, 22)) return;
    switch (kind) {
      case "pulse":
        this.tone("square", 880, 220, 0.075, 0.11);
        this.noise(0.05, 0.09, "highpass", 2400, 900);
        break;
      case "smg":
        this.tone("square", 660, 210, 0.05, 0.075);
        this.noise(0.04, 0.07, "bandpass", 1800, 700, 0, 1.6);
        break;
      case "scatter":
        this.noise(0.2, 0.3, "lowpass", 2200, 260);
        this.tone("sawtooth", 220, 60, 0.16, 0.16);
        break;
      case "rail":
        this.tone("sawtooth", 1800, 130, 0.28, 0.15);
        this.noise(0.3, 0.16, "highpass", 400, 3200);
        this.tone("sine", 90, 40, 0.3, 0.2, 0.02);
        break;
      case "rocket":
        this.noise(0.34, 0.2, "lowpass", 900, 120);
        this.tone("sawtooth", 160, 50, 0.25, 0.13);
        break;
      case "tesla":
        this.tone("square", 1400, 300, 0.09, 0.09);
        this.noise(0.12, 0.11, "bandpass", 2600, 900, 0, 6);
        break;
      default:
        this.tone("square", 700, 200, 0.06, 0.1);
    }
  }

  hit() {
    if (!this.allow("hit", 20)) return;
    this.noise(0.05, 0.07, "bandpass", 3000, 1100, 0, 2);
  }

  kill() {
    if (!this.allow("kill", 28)) return;
    this.tone("triangle", 400, 90, 0.16, 0.14);
    this.noise(0.16, 0.16, "lowpass", 2600, 320);
  }

  explode() {
    if (!this.allow("explode", 45)) return;
    this.noise(0.5, 0.34, "lowpass", 1600, 90);
    this.tone("sine", 130, 32, 0.42, 0.26);
    this.tone("sawtooth", 300, 60, 0.2, 0.1);
  }

  hurt() {
    this.tone("sawtooth", 320, 70, 0.24, 0.2);
    this.noise(0.2, 0.14, "bandpass", 700, 200, 0, 3);
  }

  dash() {
    this.noise(0.22, 0.14, "bandpass", 500, 3400, 0, 3.4);
    this.tone("sine", 520, 1250, 0.14, 0.07);
  }

  pickup() {
    this.tone("triangle", 620, 1240, 0.1, 0.11);
    this.tone("sine", 1240, 1860, 0.13, 0.07, 0.06);
  }

  wave(n: number) {
    const base = 220 + Math.min(n, 12) * 8;
    this.tone("sawtooth", base, base * 1.5, 0.3, 0.1, 0);
    this.tone("sawtooth", base * 1.5, base * 2, 0.34, 0.09, 0.12);
    this.noise(0.5, 0.08, "highpass", 400, 2600, 0.02);
  }

  bossWarn() {
    this.tone("sawtooth", 90, 62, 1.1, 0.24);
    this.tone("square", 45, 32, 1.3, 0.16, 0.1);
    this.noise(1.0, 0.1, "lowpass", 240, 60);
  }

  ui() {
    if (!this.allow("ui", 40)) return;
    this.tone("square", 900, 1500, 0.05, 0.05);
  }

  levelUp() {
    [0, 0.08, 0.16, 0.26].forEach((d, i) =>
      this.tone("triangle", 520 * (1 + i * 0.28), 900 * (1 + i * 0.2), 0.2, 0.1, d),
    );
  }

  gameOver() {
    this.tone("sawtooth", 400, 50, 1.1, 0.2);
    this.noise(1.2, 0.16, "lowpass", 1200, 70);
    this.tone("sine", 120, 40, 1.4, 0.18, 0.1);
  }
}

export const sfx = new AudioBus();

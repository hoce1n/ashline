export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  muted = false;

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 0.7;
      this.sfx.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.applyMute();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyMute();
  }

  private applyMute() {
    if (!this.master || !this.ctx) return;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.02);
  }

  private env(duration: number, peak = 0.2) {
    if (!this.ctx || !this.sfx) return null;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    g.connect(this.sfx);
    return { g, t };
  }

  private noise(duration: number) {
    if (!this.ctx) return null;
    const n = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  jump() {
    if (!this.ctx || !this.sfx) return;
    const e = this.env(0.14, 0.12);
    if (!e) return;
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420 + Math.random() * 30, e.t);
    osc.frequency.exponentialRampToValueAtTime(180, e.t + 0.12);
    osc.connect(e.g);
    osc.start(e.t);
    osc.stop(e.t + 0.14);
  }

  land() {
    if (!this.ctx || !this.sfx) return;
    const e = this.env(0.12, 0.16);
    if (!e) return;
    const src = this.noise(0.12);
    if (!src) return;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 420;
    src.connect(f);
    f.connect(e.g);
    src.start(e.t);
  }

  slide() {
    if (!this.ctx || !this.sfx) return;
    const e = this.env(0.22, 0.08);
    if (!e) return;
    const src = this.noise(0.22);
    if (!src) return;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(900, e.t);
    f.frequency.exponentialRampToValueAtTime(280, e.t + 0.2);
    src.connect(f);
    f.connect(e.g);
    src.start(e.t);
  }

  coin() {
    if (!this.ctx || !this.sfx) return;
    const e = this.env(0.16, 0.1);
    if (!e) return;
    const a = this.ctx.createOscillator();
    const b = this.ctx.createOscillator();
    a.type = "sine";
    b.type = "sine";
    const det = 1 + (Math.random() * 2 - 1) * 0.03;
    a.frequency.setValueAtTime(880 * det, e.t);
    b.frequency.setValueAtTime(1320 * det, e.t);
    a.connect(e.g);
    b.connect(e.g);
    a.start(e.t);
    b.start(e.t);
    a.stop(e.t + 0.16);
    b.stop(e.t + 0.16);
  }

  hit() {
    if (!this.ctx || !this.sfx) return;
    const e = this.env(0.28, 0.22);
    if (!e) return;
    const src = this.noise(0.28);
    const osc = this.ctx.createOscillator();
    if (!src) return;
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, e.t);
    osc.frequency.exponentialRampToValueAtTime(40, e.t + 0.24);
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 700;
    src.connect(f);
    f.connect(e.g);
    osc.connect(e.g);
    src.start(e.t);
    osc.start(e.t);
    osc.stop(e.t + 0.28);
  }

  combo() {
    if (!this.ctx || !this.sfx) return;
    const e = this.env(0.18, 0.09);
    if (!e) return;
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(523, e.t);
    osc.frequency.setValueAtTime(784, e.t + 0.06);
    osc.connect(e.g);
    osc.start(e.t);
    osc.stop(e.t + 0.18);
  }

  foot() {
    if (!this.ctx || !this.sfx) return;
    const e = this.env(0.05, 0.04);
    if (!e) return;
    const src = this.noise(0.05);
    if (!src) return;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 280 + Math.random() * 80;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    src.connect(f);
    f.connect(e.g);
    src.start(e.t);
  }
}

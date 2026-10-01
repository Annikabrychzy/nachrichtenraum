export class AudioEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.noiseBuffer = null;
  }

  async start() {
    if (!this.context) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      this.context = new Context({ latencyHint: "interactive" });
      this.master = this.context.createGain();
      this.master.gain.value = 0.52;
      this.master.connect(this.context.destination);
      this.noiseBuffer = this.createNoiseBuffer();
    }
    if (this.context.state === "suspended") await this.context.resume();
  }

  createNoiseBuffer() {
    const length = Math.floor(this.context.sampleRate * 0.24);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    return buffer;
  }

  outputAt(position) {
    if (!this.context || !position || !this.context.createPanner) return this.master;
    const panner = this.context.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 1.6;
    panner.maxDistance = 14;
    panner.rolloffFactor = 0.85;
    panner.positionX.value = position.x;
    panner.positionY.value = position.y;
    panner.positionZ.value = position.z;
    panner.connect(this.master);
    return panner;
  }

  tone({ frequency, duration = 0.18, gain = 0.13, type = "sine", delay = 0, pitch = 1, output }) {
    if (!this.context || this.context.state !== "running") return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const volume = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency * pitch, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * pitch * 1.04, start + Math.min(0.05, duration * 0.45));
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(volume);
    volume.connect(output || this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.06);
  }

  plop(pitch = 1, position) {
    if (pitch >= 1.42) this.push(pitch, position);
    else if (pitch >= 1.08) this.meme(pitch, position);
    else this.news(pitch, position);
  }

  news(pitch = 1, position) {
    if (!this.context || this.context.state !== "running") return;
    const output = this.outputAt(position);
    this.tone({ frequency: 146, duration: 0.34, gain: 0.22, type: "sawtooth", pitch, output });
    this.tone({ frequency: 220, duration: 0.26, gain: 0.12, type: "sine", delay: 0.045, pitch, output });
    this.tone({ frequency: 82, duration: 0.42, gain: 0.085, type: "sine", delay: 0.02, pitch, output });
  }

  meme(pitch = 1, position) {
    if (!this.context || this.context.state !== "running") return;
    const output = this.outputAt(position);
    const sets = [[523, 659, 784, 1046], [587, 740, 988, 1175], [659, 880, 1108, 1318], [494, 740, 988, 1480]];
    const notes = sets[Math.floor(Math.random() * sets.length)];
    notes.forEach((frequency, index) => this.tone({ frequency, duration: 0.2, gain: 0.22, type: "triangle", delay: index * 0.04, pitch, output }));
    this.tone({ frequency: notes.at(-1) * 1.25, duration: 0.16, gain: 0.16, type: "sine", delay: 0.2, pitch, output });
    this.tone({ frequency: 180, duration: 0.12, gain: 0.08, type: "square", delay: 0.03, pitch: 1, output });
  }

  push(pitch = 1, position) {
    if (!this.context || this.context.state !== "running") return;
    const output = this.outputAt(position);
    this.tone({ frequency: 1480, duration: 0.13, gain: 0.24, type: "sine", pitch, output });
    this.tone({ frequency: 1975, duration: 0.17, gain: 0.18, type: "sine", delay: 0.075, pitch, output });
    this.tone({ frequency: 2960, duration: 0.09, gain: 0.09, type: "sine", delay: 0.15, pitch, output });
  }

  calm() {
    if (!this.context || this.context.state !== "running") return;
    const output = this.master;
    const notes = [261.63, 329.63, 392.0, 523.25];
    notes.forEach((frequency, index) => this.tone({ frequency, duration: 2.1, gain: 0.075, type: "sine", delay: index * 0.55, output }));
    this.tone({ frequency: 783.99, duration: 0.42, gain: 0.048, type: "triangle", delay: 2.35, output });
    this.tone({ frequency: 659.25, duration: 0.55, gain: 0.042, type: "triangle", delay: 3.05, output });
    // Two soft high notes make a calm bird-like call between the piano tones.
    this.tone({ frequency: 1660, duration: 0.13, gain: 0.028, type: "sine", delay: 3.7, output });
    this.tone({ frequency: 2050, duration: 0.11, gain: 0.022, type: "sine", delay: 3.87, output });
  }

  close(pitch = 1, position) {
    if (!this.context || this.context.state !== "running" || !this.noiseBuffer) return;
    const now = this.context.currentTime;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1450 * pitch, now);
    filter.frequency.exponentialRampToValueAtTime(230 * pitch, now + 0.2);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputAt(position));
    source.start(now);
  }

  updateListener(position, forward, up) {
    if (!this.context) return;
    const listener = this.context.listener;
    if (listener.positionX) {
      listener.positionX.value = position.x;
      listener.positionY.value = position.y;
      listener.positionZ.value = position.z;
      listener.forwardX.value = forward.x;
      listener.forwardY.value = forward.y;
      listener.forwardZ.value = forward.z;
      listener.upX.value = up.x;
      listener.upY.value = up.y;
      listener.upZ.value = up.z;
    }
  }

  async suspend() {
    if (this.context?.state === "running") await this.context.suspend();
  }

  async resume() {
    if (this.context?.state === "suspended") await this.context.resume();
  }

  get state() {
    return this.context?.state || "unavailable";
  }
}

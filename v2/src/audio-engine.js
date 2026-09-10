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
      this.master.gain.value = 0.34;
      this.master.connect(this.context.destination);
      this.noiseBuffer = this.createNoiseBuffer();
    }
    if (this.context.state === "suspended") await this.context.resume();
  }

  createNoiseBuffer() {
    const length = Math.floor(this.context.sampleRate * 0.24);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    }
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

  plop(pitch = 1, position) {
    this.notify(pitch, position);
  }

  notify(pitch = 1, position) {
    if (!this.context || this.context.state !== "running") return;
    const now = this.context.currentTime;
    const output = this.outputAt(position);
    const notes = [880, 1174];
    notes.forEach((frequency, index) => {
      const start = now + index * 0.055;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency * pitch, start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.08 * pitch, start + 0.035);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.15, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      oscillator.connect(gain);
      gain.connect(output);
      oscillator.start(start);
      oscillator.stop(start + 0.18);
    });
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
    gain.gain.setValueAtTime(0.12, now);
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

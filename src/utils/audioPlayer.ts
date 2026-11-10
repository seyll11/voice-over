/**
 * Audio Engine with Web Audio API, real-time waveform analyzer,
 * speed control, and ambient background music generator.
 */

class AmbientSoundGenerator {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private gainNode: GainNode | null = null;
  private intervalId: any = null;
  private type: 'lofi' | 'cinematic' | 'nature' | 'none' = 'none';

  public init(context: AudioContext) {
    this.ctx = context;
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.1);
    }
  }

  public play(type: 'lofi' | 'cinematic' | 'nature') {
    if (!this.ctx) return;
    this.stop();
    this.type = type;
    this.isPlaying = true;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.12, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    if (type === 'cinematic') {
      this.playCinematicPad();
    } else if (type === 'lofi') {
      this.playLofiChords();
    } else if (type === 'nature') {
      this.playNatureNoise();
    }
  }

  private playCinematicPad() {
    if (!this.ctx || !this.gainNode) return;
    const freqs = [130.81, 196.0, 261.63, 329.63]; // C3, G3, C4, E4
    freqs.forEach((f) => {
      if (!this.ctx || !this.gainNode) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);
      osc.connect(filter);
      filter.connect(this.gainNode);
      osc.start();
    });
  }

  private playLofiChords() {
    if (!this.ctx || !this.gainNode) return;
    // Chords: Dm7 -> G7 -> Cmaj7 -> Am7
    const chords = [
      [146.83, 220.0, 261.63, 329.63],
      [196.0, 246.94, 293.66, 349.23],
      [130.81, 196.0, 246.94, 329.63],
      [220.0, 261.63, 329.63, 392.0],
    ];
    let chordIdx = 0;

    const playChord = () => {
      if (!this.isPlaying || !this.ctx || !this.gainNode) return;
      const current = chords[chordIdx % chords.length];
      chordIdx++;

      current.forEach((freq) => {
        if (!this.ctx || !this.gainNode) return;
        const osc = this.ctx.createOscillator();
        const chordGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, this.ctx.currentTime);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        chordGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        chordGain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 0.4);
        chordGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 3.8);

        osc.connect(filter);
        filter.connect(chordGain);
        chordGain.connect(this.gainNode);

        osc.start();
        osc.stop(this.ctx.currentTime + 4.0);
      });
    };

    playChord();
    this.intervalId = setInterval(playChord, 3600);
  }

  private playNatureNoise() {
    if (!this.ctx || !this.gainNode) return;
    // Pink noise generator for gentle rain/wind ambience
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    whiteNoise.start();
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.disconnect();
      } catch {}
      this.gainNode = null;
    }
  }
}

export class StudioAudioEngine {
  private static instance: StudioAudioEngine;
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private bgmGenerator: AmbientSoundGenerator = new AmbientSoundGenerator();

  private onTimeUpdateCallback: ((current: number, total: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private isInitialized = false;

  public static getInstance(): StudioAudioEngine {
    if (!StudioAudioEngine.instance) {
      StudioAudioEngine.instance = new StudioAudioEngine();
    }
    return StudioAudioEngine.instance;
  }

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.bgmGenerator.init(this.audioCtx);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setAudioSource(base64OrUrl: string, mimeType = 'audio/wav') {
    this.initContext();
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';

      if (this.audioCtx && this.analyserNode) {
        this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
        this.sourceNode.connect(this.analyserNode);
        this.analyserNode.connect(this.audioCtx.destination);
      }

      this.audioElement.ontimeupdate = () => {
        if (this.onTimeUpdateCallback && this.audioElement) {
          this.onTimeUpdateCallback(this.audioElement.currentTime, this.audioElement.duration || 0);
        }
      };

      this.audioElement.onended = () => {
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      };
    }

    const src = base64OrUrl.startsWith('data:') || base64OrUrl.startsWith('http') || base64OrUrl.startsWith('blob:')
      ? base64OrUrl
      : `data:${mimeType};base64,${base64OrUrl}`;

    this.audioElement.src = src;
    this.audioElement.load();
  }

  public async play() {
    this.initContext();
    if (this.audioElement) {
      return this.audioElement.play();
    }
  }

  public pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  public seek(seconds: number) {
    if (this.audioElement && Number.isFinite(seconds)) {
      this.audioElement.currentTime = seconds;
    }
  }

  public setSpeed(speed: number) {
    if (this.audioElement) {
      this.audioElement.playbackRate = speed;
    }
  }

  public setVolume(vol: number) {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, vol));
    }
  }

  public setBgm(type: 'lofi' | 'cinematic' | 'nature' | 'none', volume = 0.15) {
    this.initContext();
    if (type === 'none') {
      this.bgmGenerator.stop();
    } else {
      this.bgmGenerator.play(type);
      this.bgmGenerator.setVolume(volume);
    }
  }

  public setBgmVolume(volume: number) {
    this.bgmGenerator.setVolume(volume);
  }

  public stopBgm() {
    this.bgmGenerator.stop();
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(0);
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public getWaveformData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(0);
    const dataArray = new Uint8Array(this.analyserNode.fftSize);
    this.analyserNode.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  public onTimeUpdate(cb: (current: number, total: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  public onEnded(cb: () => void) {
    this.onEndedCallback = cb;
  }

  public getDuration(): number {
    return this.audioElement?.duration || 0;
  }

  public getCurrentTime(): number {
    return this.audioElement?.currentTime || 0;
  }
}

/**
 * Helper to download base64 audio as a WAV file
 */
export const downloadAudioFile = (base64Data: string, filename = 'suara-ai-voiceover.wav', mimeType = 'audio/wav') => {
  try {
    const rawData = atob(base64Data);
    const bytes = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      bytes[i] = rawData.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Gagal mengunduh file audio:', err);
  }
};

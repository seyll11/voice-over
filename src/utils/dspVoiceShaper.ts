/**
 * Studio-grade WAV PCM Pitch, Speed & Formant Shaper (WSOLA Time-Stretch + Cubic Resampling + Biquad EQ)
 * Ensures distinct, consistent character voices (Male, Female, Child, Elder, Cartoon, Vintage)
 * on standard 24kHz 16-bit mono WAV buffers returned by Gemini TTS.
 */

export interface VoiceDspProfile {
  pitchRatio: number; // < 1.0 lowers pitch (Male/Elder), > 1.0 raises pitch (Child/Cartoon)
  speedFactor?: number; // < 1.0 slower (Elder/Calm), > 1.0 faster (Upbeat/Child)
  bassBoostDb?: number; // Low-shelf warmth for male/baritone voices
  presenceBoostDb?: number; // High-mid clarity for child/bright voices
  highPassHz?: number; // Clean rumble cut
  bandpassRadio?: boolean; // Classic vintage radio filter
}

/**
 * WSOLA (Waveform Similarity Overlap-Add) time-stretching preserves natural vocal pitch
 * before resampling shifts pitch without changing speaking tempo.
 */
function wsolaTimeStretch(samples: Float32Array, stretchFactor: number, sampleRate: number): Float32Array {
  if (Math.abs(stretchFactor - 1.0) < 0.015 || samples.length < 2048) {
    return samples;
  }

  const winSize = Math.round(sampleRate * 0.04); // 40ms frame (960 samples @ 24kHz)
  const hopOut = Math.floor(winSize / 2); // 50% overlap (480 samples)
  const hopIn = hopOut / stretchFactor;
  const searchRadius = Math.round(sampleRate * 0.008); // +/- 8ms alignment window

  const outLen = Math.max(winSize, Math.round(samples.length * stretchFactor));
  const out = new Float32Array(outLen);
  const norm = new Float32Array(outLen);

  // Precompute Hann window
  const hann = new Float32Array(winSize);
  for (let i = 0; i < winSize; i++) {
    hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (winSize - 1)));
  }

  let outPos = 0;
  let frameIndex = 0;

  while (outPos + winSize < outLen) {
    const nominalInPos = Math.round(frameIndex * hopIn);
    if (nominalInPos >= samples.length - winSize) break;

    let bestOffset = 0;

    if (frameIndex > 0 && outPos > 0) {
      // Match first half of candidate frame against already-written overlap tail in `out`
      let bestCorr = -Infinity;
      const minOff = Math.max(-searchRadius, -nominalInPos);
      const maxOff = Math.min(searchRadius, samples.length - winSize - nominalInPos);

      // Coarse search (step 2) for low latency
      for (let off = minOff; off <= maxOff; off += 2) {
        let dot = 0;
        let energyA = 0;
        let energyB = 0;
        const candStart = nominalInPos + off;
        for (let i = 0; i < hopOut; i += 2) {
          const a = out[outPos + i];
          const b = samples[candStart + i];
          dot += a * b;
          energyA += a * a;
          energyB += b * b;
        }
        const denom = Math.sqrt(energyA * energyB) + 1e-8;
        const score = dot / denom;
        if (score > bestCorr) {
          bestCorr = score;
          bestOffset = off;
        }
      }
    }

    const inStart = Math.max(0, Math.min(samples.length - winSize, nominalInPos + bestOffset));
    for (let i = 0; i < winSize; i++) {
      const w = hann[i];
      out[outPos + i] += samples[inStart + i] * w;
      norm[outPos + i] += w;
    }

    outPos += hopOut;
    frameIndex++;
  }

  for (let i = 0; i < outLen; i++) {
    if (norm[i] > 1e-4) {
      out[i] /= norm[i];
    }
  }

  return out;
}

/**
 * Cubic Hermite resampling cleanly shifts pitch by reading at `rateRatio` step
 */
function cubicResample(samples: Float32Array, rateRatio: number): Float32Array {
  if (Math.abs(rateRatio - 1.0) < 0.01) return samples;
  const outLen = Math.max(1, Math.round(samples.length / rateRatio));
  const out = new Float32Array(outLen);

  for (let i = 0; i < outLen; i++) {
    const pos = i * rateRatio;
    const idx = Math.floor(pos);
    const t = pos - idx;

    const xm1 = samples[Math.max(0, idx - 1)];
    const x0 = samples[Math.min(samples.length - 1, idx)];
    const x1 = samples[Math.min(samples.length - 1, idx + 1)];
    const x2 = samples[Math.min(samples.length - 1, idx + 2)];

    const c0 = x0;
    const c1 = 0.5 * (x1 - xm1);
    const c2 = xm1 - 2.5 * x0 + 2 * x1 - 0.5 * x2;
    const c3 = 0.5 * (x2 - xm1) + 1.5 * (x0 - x1);

    out[i] = ((c3 * t + c2) * t + c1) * t + c0;
  }

  return out;
}

function applyBiquad(
  samples: Float32Array,
  b0: number,
  b1: number,
  b2: number,
  a0: number,
  a1: number,
  a2: number
): Float32Array {
  const out = new Float32Array(samples.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const nb0 = b0 / a0, nb1 = b1 / a0, nb2 = b2 / a0;
  const na1 = a1 / a0, na2 = a2 / a0;

  for (let i = 0; i < samples.length; i++) {
    const x = samples[i];
    const y = nb0 * x + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    out[i] = y;
  }
  return out;
}

function lowShelfFilter(samples: Float32Array, sampleRate: number, freq: number, gainDb: number): Float32Array {
  if (!gainDb) return samples;
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const alpha = (Math.sin(w0) / 2) * Math.sqrt((A + 1 / A) * (1 / 0.9 - 1) + 2);
  const cosw0 = Math.cos(w0);
  const twoSqrtAAlpha = 2 * Math.sqrt(A) * alpha;

  return applyBiquad(
    samples,
    A * (A + 1 - (A - 1) * cosw0 + twoSqrtAAlpha),
    2 * A * (A - 1 - (A + 1) * cosw0),
    A * (A + 1 - (A - 1) * cosw0 - twoSqrtAAlpha),
    A + 1 + (A - 1) * cosw0 + twoSqrtAAlpha,
    -2 * (A - 1 + (A + 1) * cosw0),
    A + 1 + (A - 1) * cosw0 - twoSqrtAAlpha
  );
}

function highShelfFilter(samples: Float32Array, sampleRate: number, freq: number, gainDb: number): Float32Array {
  if (!gainDb) return samples;
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const alpha = (Math.sin(w0) / 2) * Math.sqrt((A + 1 / A) * (1 / 0.9 - 1) + 2);
  const cosw0 = Math.cos(w0);
  const twoSqrtAAlpha = 2 * Math.sqrt(A) * alpha;

  return applyBiquad(
    samples,
    A * (A + 1 + (A - 1) * cosw0 + twoSqrtAAlpha),
    -2 * A * (A - 1 + (A + 1) * cosw0),
    A * (A + 1 + (A - 1) * cosw0 - twoSqrtAAlpha),
    A + 1 - (A - 1) * cosw0 + twoSqrtAAlpha,
    2 * (A - 1 - (A + 1) * cosw0),
    A + 1 - (A - 1) * cosw0 - twoSqrtAAlpha
  );
}

function highPassFilter(samples: Float32Array, sampleRate: number, freq: number): Float32Array {
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const alpha = Math.sin(w0) / (2 * 0.707);
  const cosw0 = Math.cos(w0);
  return applyBiquad(
    samples,
    (1 + cosw0) / 2,
    -(1 + cosw0),
    (1 + cosw0) / 2,
    1 + alpha,
    -2 * cosw0,
    1 - alpha
  );
}

function lowPassFilter(samples: Float32Array, sampleRate: number, freq: number): Float32Array {
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const alpha = Math.sin(w0) / (2 * 0.707);
  const cosw0 = Math.cos(w0);
  return applyBiquad(
    samples,
    (1 - cosw0) / 2,
    1 - cosw0,
    (1 - cosw0) / 2,
    1 + alpha,
    -2 * cosw0,
    1 - alpha
  );
}

/**
 * Processes a complete RIFF WAV buffer (16-bit PCM) using the character's DSP profile.
 * Returns a valid RIFF WAV buffer with updated chunk sizes.
 */
export function shapeWavWithProfile(wavBuffer: Buffer, profile: VoiceDspProfile): Buffer {
  if (wavBuffer.length <= 44) return wavBuffer;

  const pitchRatio = Math.max(0.55, Math.min(1.85, profile.pitchRatio || 1.0));
  const speedFactor = Math.max(0.75, Math.min(1.35, profile.speedFactor || 1.0));

  const needsPitchOrSpeed =
    Math.abs(pitchRatio - 1.0) >= 0.015 || Math.abs(speedFactor - 1.0) >= 0.015;
  const needsEq =
    Boolean(profile.bassBoostDb) ||
    Boolean(profile.presenceBoostDb) ||
    Boolean(profile.highPassHz) ||
    Boolean(profile.bandpassRadio);

  if (!needsPitchOrSpeed && !needsEq) {
    return wavBuffer;
  }

  // Verify RIFF/WAVE header & extract sample rate (offset 24, UInt32LE)
  const riff = wavBuffer.subarray(0, 4).toString('ascii');
  if (riff !== 'RIFF') return wavBuffer;

  const sampleRate = wavBuffer.readUInt32LE(24) || 24000;
  const pcmByteLen = wavBuffer.length - 44;
  const numSamples = Math.floor(pcmByteLen / 2);

  let floatSamples: Float32Array = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    floatSamples[i] = wavBuffer.readInt16LE(44 + i * 2) / 32768;
  }

  // 1. Time-stretch & resample for independent pitch + speed control
  if (needsPitchOrSpeed) {
    const stretchFactor = pitchRatio / speedFactor;
    const stretched = wsolaTimeStretch(floatSamples, stretchFactor, sampleRate);
    floatSamples = cubicResample(stretched, pitchRatio);
  }

  // 2. Character EQ shaping
  if (profile.highPassHz && profile.highPassHz > 20) {
    floatSamples = highPassFilter(floatSamples, sampleRate, profile.highPassHz);
  }
  if (profile.bassBoostDb) {
    floatSamples = lowShelfFilter(floatSamples, sampleRate, 180, profile.bassBoostDb);
  }
  if (profile.presenceBoostDb) {
    floatSamples = highShelfFilter(floatSamples, sampleRate, 2600, profile.presenceBoostDb);
  }
  if (profile.bandpassRadio) {
    floatSamples = highPassFilter(floatSamples, sampleRate, 360);
    floatSamples = lowPassFilter(floatSamples, sampleRate, 3200);
  }

  // 3. Soft-normalize to prevent clipping and preserve consistent loudness across voices
  let peak = 0;
  for (let i = 0; i < floatSamples.length; i++) {
    const abs = Math.abs(floatSamples[i]);
    if (abs > peak) peak = abs;
  }
  const targetPeak = 0.88;
  const normGain = peak > 0.05 ? Math.min(2.2, targetPeak / peak) : 1.0;

  const outPcm = Buffer.alloc(floatSamples.length * 2);
  for (let i = 0; i < floatSamples.length; i++) {
    // Soft tanh limiter on extreme peaks
    const val = Math.tanh(floatSamples[i] * normGain);
    const int16 = Math.max(-32768, Math.min(32767, Math.round(val * 32767)));
    outPcm.writeInt16LE(int16, i * 2);
  }

  const header = Buffer.from(wavBuffer.subarray(0, 44));
  header.writeUInt32LE(36 + outPcm.length, 4);
  header.writeUInt32LE(outPcm.length, 40);
  return Buffer.concat([header, outPcm]);
}

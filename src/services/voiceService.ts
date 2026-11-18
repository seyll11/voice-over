import { VoiceId, TtsModelId } from '../types';
import { VOICES } from '../data/voices';

export interface GenerateVoiceOverParams {
  text: string;
  voice: VoiceId;
  style: string;
  mode?: 'single' | 'dialogue';
  model?: TtsModelId;
  dialogueParts?: Array<{
    speaker: string;
    text: string;
    style?: string;
    voice?: VoiceId;
  }>;
}

export interface EnhanceScriptParams {
  script: string;
  goal: string;
  targetLanguage?: string;
}

export interface GenerateScriptIdeaParams {
  topic: string;
  category: string;
  durationSeconds?: number;
}

const parseApiError = (raw: any, fallback: string): string => {
  if (!raw) return fallback;
  const target = raw.error || raw.message || raw;
  if (typeof target === 'string') {
    try {
      const parsed = JSON.parse(target);
      if (parsed?.error?.message) return parsed.error.message;
    } catch {}
    return target;
  }
  if (typeof target === 'object' && target?.message) {
    return target.message;
  }
  return fallback;
};

export const generateVoiceOver = async (params: GenerateVoiceOverParams) => {
  let response: Response;
  try {
    response = await fetch('/api/generate-voiceover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
  } catch {
    throw new Error(
      'Failed to fetch: Server tidak merespons atau naskah terlalu panjang sehingga koneksi terputus (timeout). Jika Anda menggunakan Render (Free Tier), server butuh sekitar 30-50 detik untuk bangun (cold start). Silakan coba lagi atau gunakan tombol "Tes Cepat Browser" di bawah.'
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(parseApiError(errorData, `Server error (${response.status})`));
  }

  return response.json() as Promise<{
    audioBase64: string;
    mimeType: string;
    model: string;
    voice: string;
  }>;
};

export const enhanceScript = async (params: EnhanceScriptParams) => {
  const response = await fetch('/api/enhance-script', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(parseApiError(errorData, `Gagal mengoptimasi naskah (${response.status})`));
  }

  return response.json() as Promise<{
    enhancedScript: string;
    ssmlOrCues?: string;
    wordCount: number;
    estimatedDurationSeconds: number;
    recommendedVoice: VoiceId;
    recommendedStyle: string;
    directorNotes: string[];
  }>;
};

export const generateScriptIdea = async (params: GenerateScriptIdeaParams) => {
  const response = await fetch('/api/generate-script-idea', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(parseApiError(errorData, `Gagal membuat ide skrip (${response.status})`));
  }

  return response.json() as Promise<{
    title: string;
    script: string;
    category: string;
    estimatedDurationSeconds: number;
    recommendedVoice: VoiceId;
    recommendedStyle: string;
    keyHighlight: string;
  }>;
};

export const checkServerHealth = async () => {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) return { ok: false, hasApiKey: false };
    const data = await response.json();
    return { ok: true, hasApiKey: data.hasApiKey };
  } catch {
    return { ok: false, hasApiKey: false };
  }
};

/**
 * Inspect how many Indonesian/Malay system voices the user's browser exposes
 */
export function getBrowserVoiceDiagnostics(): {
  totalIndonesian: number;
  hasLocalPitchSupport: boolean;
  hasSeparateMaleFemale: boolean;
} {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { totalIndonesian: 0, hasLocalPitchSupport: false, hasSeparateMaleFemale: false };
  }
  const voices = window.speechSynthesis.getVoices();
  const idVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('id'));
  const hasLocalPitchSupport = idVoices.some((v) => v.localService);
  const maleKeywords = ['ardi', 'andika', 'male', 'pria'];
  const femaleKeywords = ['gadis', 'damayanti', 'siti', 'female', 'wanita'];
  const hasMale = idVoices.some((v) => maleKeywords.some((k) => v.name.toLowerCase().includes(k)));
  const hasFemale = idVoices.some((v) => femaleKeywords.some((k) => v.name.toLowerCase().includes(k)));
  return {
    totalIndonesian: idVoices.length,
    hasLocalPitchSupport,
    hasSeparateMaleFemale: hasMale && hasFemale,
  };
}

/**
 * Pick the best system voice for browser preview by matching language, gender & local pitch support
 */
function pickBrowserVoiceForCharacter(
  voices: SpeechSynthesisVoice[],
  targetLang: string,
  gender?: 'male' | 'female',
  voiceId?: VoiceId
): SpeechSynthesisVoice | undefined {
  const langPrefix = targetLang.substring(0, 2).toLowerCase();
  const matchingLang = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
  const pool = matchingLang.length > 0 ? matchingLang : voices;

  if (pool.length === 0) return undefined;

  const maleKeywords = ['ardi', 'andika', 'male', 'pria', 'david', 'mark', 'daniel', 'george', 'alex', 'rishi'];
  const femaleKeywords = ['gadis', 'female', 'wanita', 'zira', 'hazel', 'samantha', 'siti', 'damayanti'];

  if (gender === 'male') {
    const maleMatch = pool.find((v) =>
      maleKeywords.some((kw) => v.name.toLowerCase().includes(kw))
    );
    if (maleMatch) return maleMatch;
  } else if (gender === 'female') {
    const femaleMatch = pool.find((v) =>
      femaleKeywords.some((kw) => v.name.toLowerCase().includes(kw))
    );
    if (femaleMatch) return femaleMatch;
  }

  // Prefer localService voices when available because remote Google voices ignore utterance.pitch
  const localVoices = pool.filter((v) => v.localService);
  if (localVoices.length > 0) {
    if (voiceId) {
      const idx = VOICES.findIndex((v) => v.id === voiceId);
      if (idx >= 0) return localVoices[idx % localVoices.length];
    }
    return localVoices[0];
  }

  return pool[0];
}

/**
 * Client-side Web Speech API browser preview fallback with per-character differentiation
 */
export const speakWithBrowser = (
  text: string,
  options?: {
    lang?: string;
    rate?: number;
    pitch?: number;
    voiceId?: VoiceId;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): { stop: () => void } => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    throw new Error('Browser ini tidak mendukung Web Speech API.');
  }

  window.speechSynthesis.cancel();

  const cleanText = text
    .replace(/<[^>]+>/g, '')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\|[^|]+\|/g, '')
    .trim();

  if (!cleanText) {
    return { stop: () => {} };
  }

  const profile = options?.voiceId ? VOICES.find((v) => v.id === options.voiceId) : undefined;
  const resolvedPitch = options?.pitch ?? profile?.previewPitch ?? 1.0;
  const resolvedRate = options?.rate ?? profile?.previewRate ?? 1.0;

  const chunks = cleanText.match(/[^.!?\n]+[.!?\n]*/g) || [cleanText];
  const targetLang = options?.lang || 'id-ID';

  let currentChunkIndex = 0;
  let isCancelled = false;

  const speakNext = () => {
    if (isCancelled || currentChunkIndex >= chunks.length) {
      if (options?.onEnd && !isCancelled) options.onEnd();
      return;
    }

    const currentText = chunks[currentChunkIndex].trim();
    currentChunkIndex++;

    if (!currentText) {
      speakNext();
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = pickBrowserVoiceForCharacter(
      voices,
      targetLang,
      profile?.gender,
      options?.voiceId
    );

    const utterance = new SpeechSynthesisUtterance(currentText);
    utterance.lang = matchedVoice?.lang || targetLang;
    utterance.rate = resolvedRate;
    utterance.pitch = resolvedPitch;
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      speakNext();
    };

    utterance.onerror = (e) => {
      if (!isCancelled && options?.onError) {
        options.onError(e);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  speakNext();

  return {
    stop: () => {
      isCancelled = true;
      window.speechSynthesis.cancel();
    },
  };
};

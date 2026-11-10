import { VoiceId, DialogueLine } from '../types';

export interface GenerateVoiceOverParams {
  text: string;
  voice: VoiceId;
  style: string;
  mode?: 'single' | 'dialogue';
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
  const response = await fetch('/api/generate-voiceover', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

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
 * Client-side Web Speech API browser preview fallback
 */
export const speakWithBrowser = (
  text: string,
  options?: {
    lang?: string;
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): { stop: () => void } => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    throw new Error('Browser ini tidak mendukung Web Speech API.');
  }

  window.speechSynthesis.cancel();

  // Strip directional cues like <breath>, [jeda]
  const cleanText = text
    .replace(/<[^>]+>/g, '')
    .replace(/\[[^\]]+\]/g, '')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = options?.lang || 'id-ID';
  utterance.rate = options?.rate || 1.0;
  utterance.pitch = options?.pitch || 1.0;

  // Attempt to select an Indonesian or English voice if available in system
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) => v.lang.startsWith(utterance.lang.substring(0, 2)));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (options?.onEnd) utterance.onend = options.onEnd;
  if (options?.onError) utterance.onerror = options.onError;

  window.speechSynthesis.speak(utterance);

  return {
    stop: () => window.speechSynthesis.cancel(),
  };
};

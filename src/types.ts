import type { VoiceDspProfile } from './utils/dspVoiceShaper';

export type VoiceId =
  | 'Kore'
  | 'Zephyr'
  | 'Leda'
  | 'Despina'
  | 'Vindemiatrix'
  | 'Fenrir'
  | 'Charon'
  | 'Orus'
  | 'Puck'
  | 'Sulafat'
  | 'Gacrux'
  | 'Bimo'
  | 'Caca'
  | 'Raka'
  | 'Tupai'
  | 'RadioKlasik';

export type VoiceCategory = 'female' | 'male' | 'child' | 'character';

export type TtsModelId = 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts';

export interface VoiceProfile {
  id: VoiceId;
  name: string;
  category: VoiceCategory;
  gender: 'female' | 'male';
  geminiVoice: string;
  badge: string;
  timbre: string;
  description: string;
  acousticAnchor: string;
  dspProfile: VoiceDspProfile;
  recommendedFor: string[];
  avatarColor: string;
  previewPitch: number;
  previewRate: number;
}

export interface VoiceStylePreset {
  id: string;
  label: string;
  description: string;
  prompt: string;
  icon: string;
}

export interface DialogueLine {
  id: string;
  speaker: string;
  voice: VoiceId;
  text: string;
  style: string;
}

export interface VoiceOverTake {
  id: string;
  title: string;
  script: string;
  voice: string;
  style: string;
  mode: 'single' | 'dialogue';
  createdAt: number;
  audioBase64: string;
  mimeType: string;
  durationSeconds?: number;
}

export interface ScriptTemplate {
  id: string;
  title: string;
  category: 'commercial' | 'storytelling' | 'news' | 'tutorial' | 'podcast';
  voice: VoiceId;
  style: string;
  text: string;
}

export interface UserStudioProfile {
  uid: string;
  displayName: string;
  preferredVoice: VoiceId;
  voiceLocked: boolean;
  lockedStyle?: string;
  preferredModel: TtsModelId;
}

export interface VoicePreset {
  id: string;
  ownerId: string;
  name: string;
  voiceId: VoiceId;
  stylePrompt: string;
  model: TtsModelId;
}

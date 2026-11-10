export type VoiceId = 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon';

export interface VoiceProfile {
  id: VoiceId;
  name: string;
  gender: 'female' | 'male';
  badge: string;
  description: string;
  recommendedFor: string[];
  avatarColor: string;
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

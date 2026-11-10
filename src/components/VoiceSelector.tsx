import React, { useState } from 'react';
import { VoiceId, VoiceProfile } from '../types';
import { VOICES } from '../data/voices';
import { Play, Square, Sparkles, Check, Volume2 } from 'lucide-react';
import { speakWithBrowser } from '../services/voiceService';

interface VoiceSelectorProps {
  selectedVoice: VoiceId;
  onSelectVoice: (id: VoiceId) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
}) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<VoiceId | null>(null);
  const [stopFn, setStopFn] = useState<(() => void) | null>(null);

  const sampleGreetings: Record<VoiceId, string> = {
    Kore: 'Halo! Saya Kore. Suara saya hangat dan tenang, siap menghidupkan naskah cerita dan edukasi Anda.',
    Puck: 'Hai semuanya! Saya Puck. Suara saya bersemangat dan ceria, sangat cocok untuk iklan dan konten media sosial!',
    Fenrir: 'Selamat datang. Saya Fenrir. Karakter suara saya berat dan berwibawa, ideal untuk berita serta audio sinematik.',
    Zephyr: 'Salam hangat. Saya Zephyr. Saya membawakan artikulasi yang jernih dan profesional untuk tutorial serta panduan.',
    Charon: 'Salam. Saya Charon. Nada bicara saya dalam, teduh, dan penuh penghayatan untuk renungan serta refleksi mendalam.',
  };

  const handlePreviewVoice = (voice: VoiceProfile, e: React.MouseEvent) => {
    e.stopPropagation();

    if (playingVoiceId === voice.id) {
      if (stopFn) stopFn();
      setPlayingVoiceId(null);
      return;
    }

    if (stopFn) {
      stopFn();
    }

    try {
      const pitch = voice.gender === 'female' ? 1.15 : 0.9;
      const rate = voice.id === 'Puck' ? 1.08 : voice.id === 'Charon' ? 0.92 : 1.0;

      const player = speakWithBrowser(sampleGreetings[voice.id], {
        lang: 'id-ID',
        pitch,
        rate,
        onEnd: () => setPlayingVoiceId(null),
        onError: () => setPlayingVoiceId(null),
      });

      setStopFn(() => player.stop);
      setPlayingVoiceId(voice.id);
    } catch {
      setPlayingVoiceId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span>1. Pilih Karakter Suara AI</span>
          <span className="text-xs text-slate-400 font-normal">({VOICES.length} Model Karakter Suara)</span>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {VOICES.map((v) => {
          const isSelected = selectedVoice === v.id;
          const isPreviewing = playingVoiceId === v.id;

          return (
            <div
              key={v.id}
              onClick={() => onSelectVoice(v.id)}
              className={`group relative rounded-xl p-3.5 cursor-pointer transition-all border text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white shadow">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${v.avatarColor} flex items-center justify-center text-slate-950 font-bold text-sm shadow-sm`}
                  >
                    {v.name.substring(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white tracking-tight">{v.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {v.gender === 'female' ? 'Wanita' : 'Pria'}
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-medium">{v.badge}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {v.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[100px]">
                  {v.recommendedFor[0]}
                </span>
                <button
                  type="button"
                  onClick={(e) => handlePreviewVoice(v, e)}
                  className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded transition-colors ${
                    isPreviewing
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Dengarkan Contoh Suara"
                >
                  {isPreviewing ? (
                    <>
                      <Square className="w-2.5 h-2.5 fill-current" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-2.5 h-2.5 text-indigo-400" />
                      <span>Tes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

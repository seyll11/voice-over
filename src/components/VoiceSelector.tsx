import React, { useState, useEffect } from 'react';
import { VoiceId, VoiceProfile, VoicePreset, VoiceCategory } from '../types';
import { VOICES } from '../data/voices';
import {
  Square,
  Check,
  Volume2,
  Lock,
  Unlock,
  BookmarkPlus,
  Trash2,
  Info,
} from 'lucide-react';
import { speakWithBrowser, getBrowserVoiceDiagnostics } from '../services/voiceService';

interface VoiceSelectorProps {
  selectedVoice: VoiceId;
  onSelectVoice: (id: VoiceId) => void;
  voiceLocked: boolean;
  onToggleLock: () => void;
  voicePresets?: VoicePreset[];
  onSavePreset?: (name: string) => Promise<void>;
  onApplyPreset?: (preset: VoicePreset) => void;
  onDeletePreset?: (id: string) => Promise<void>;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  voiceLocked,
  onToggleLock,
  voicePresets = [],
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
}) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<VoiceId | null>(null);
  const [stopFn, setStopFn] = useState<(() => void) | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | VoiceCategory>('all');
  const [showPresetForm, setShowPresetForm] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);
  const [browserDiag, setBrowserDiag] = useState(() => getBrowserVoiceDiagnostics());

  useEffect(() => {
    const refresh = () => setBrowserDiag(getBrowserVoiceDiagnostics());
    refresh();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', refresh);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', refresh);
    }
  }, []);

  const filteredVoices = VOICES.filter((v) =>
    categoryFilter === 'all' ? true : v.category === categoryFilter
  );

  const countByCat = {
    all: VOICES.length,
    female: VOICES.filter((v) => v.category === 'female').length,
    male: VOICES.filter((v) => v.category === 'male').length,
    child: VOICES.filter((v) => v.category === 'child').length,
    character: VOICES.filter((v) => v.category === 'character').length,
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
      const greeting = `Halo, saya ${voice.name}. ${voice.badge}.`;
      const player = speakWithBrowser(greeting, {
        lang: 'id-ID',
        voiceId: voice.id,
        pitch: voice.previewPitch,
        rate: voice.previewRate,
        onEnd: () => setPlayingVoiceId(null),
        onError: () => setPlayingVoiceId(null),
      });

      setStopFn(() => player.stop);
      setPlayingVoiceId(voice.id);
    } catch {
      setPlayingVoiceId(null);
    }
  };

  const handleCreatePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim() || !onSavePreset) return;
    setSavingPreset(true);
    try {
      await onSavePreset(presetName.trim());
      setPresetName('');
      setShowPresetForm(false);
    } finally {
      setSavingPreset(false);
    }
  };

  const formatPitchTag = (pitchRatio: number, isRadio?: boolean) => {
    if (isRadio) return 'Efek Radio Vintage';
    const pct = Math.round((pitchRatio - 1) * 100);
    if (pct > 3) return `Nada +${pct}%`;
    if (pct < -3) return `Nada ${pct}%`;
    return 'Nada Natural';
  };

  return (
    <div className="space-y-4">
      {/* Header & Voice Lock Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">
            1. Pilih Karakter Suara AI ({VOICES.length} Pilihan: Wanita, Pria, Anak-anak &amp; Karakter)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Setiap karakter dibentuk oleh mesin AI + pengatur frekuensi vokal studio sehingga suaranya benar-benar beragam dan tetap konsisten.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800">
            {[
              { id: 'all', label: `Semua (${countByCat.all})` },
              { id: 'female', label: `Wanita (${countByCat.female})` },
              { id: 'male', label: `Pria (${countByCat.male})` },
              { id: 'child', label: `Anak & Remaja (${countByCat.child})` },
              { id: 'character', label: `Karakter (${countByCat.character})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  categoryFilter === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Voice Consistency Lock */}
          <button
            type="button"
            onClick={onToggleLock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
              voiceLocked
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Kunci suara agar tidak berubah otomatis saat memakai template atau AI Script Doctor"
          >
            {voiceLocked ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Terkunci ({selectedVoice})</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-slate-400" />
                <span>Kunci Suara</span>
              </>
            )}
          </button>

          {onSavePreset && (
            <button
              type="button"
              onClick={() => setShowPresetForm(!showPresetForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-colors whitespace-nowrap"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Simpan Preset</span>
            </button>
          )}
        </div>
      </div>

      {/* Honest Browser Preview Diagnostic Note when browser only exposes 1 online voice */}
      {!browserDiag.hasLocalPitchSupport && !browserDiag.hasSeparateMaleFemale && (
        <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Info Penting:</strong> Tombol <strong>"Tes"</strong> di kartu memakai suara bawaan browser Anda (yang sering hanya menyediakan 1 suara Indonesia). Untuk mendengar suara asli <strong>Pria Berat, Wanita, Anak-anak, Kakek, atau Kartun</strong> yang sebenarnya, pilih karakter di bawah lalu klik tombol <strong>"Generate Voice Over"</strong>.
          </p>
        </div>
      )}

      {/* Save Custom Consistent Preset Form */}
      {showPresetForm && (
        <form
          onSubmit={handleCreatePreset}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 flex flex-wrap items-center gap-2.5"
        >
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder={`Nama preset (misal: Suara ${selectedVoice} Saya)`}
            maxLength={80}
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={savingPreset || !presetName.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
          >
            {savingPreset ? 'Menyimpan...' : 'Simpan ke Akun'}
          </button>
        </form>
      )}

      {/* Saved User Presets Strip */}
      {voicePresets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400">Preset Tersimpan:</span>
          {voicePresets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs"
            >
              <button
                type="button"
                onClick={() => onApplyPreset?.(preset)}
                className="text-indigo-300 hover:text-white font-medium transition-colors"
              >
                {preset.name} ({preset.voiceId})
              </button>
              {onDeletePreset && (
                <button
                  type="button"
                  onClick={() => onDeletePreset(preset.id)}
                  className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                  title="Hapus preset"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Voice Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredVoices.map((v) => {
          const isSelected = selectedVoice === v.id;
          const isPreviewing = playingVoiceId === v.id;

          return (
            <div
              key={v.id}
              onClick={() => onSelectVoice(v.id)}
              className={`group relative rounded-xl p-3.5 cursor-pointer transition-all border text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${v.avatarColor} flex items-center justify-center text-slate-950 font-bold text-sm shrink-0`}
                  >
                    {v.name.substring(0, 1)}
                  </div>
                  <div className="min-w-0 pr-5">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-white truncate">
                      <span>{v.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {v.timbre} · {formatPitchTag(v.dspProfile.pitchRatio, v.dspProfile.bandpassRadio)}
                    </p>
                  </div>
                </div>

                <p className="text-xs font-medium text-indigo-300 mb-1">{v.badge}</p>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {v.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 truncate">
                  {v.recommendedFor[0]}
                </span>
                <button
                  type="button"
                  onClick={(e) => handlePreviewVoice(v, e)}
                  className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors shrink-0 ${
                    isPreviewing
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Dengarkan Pratinjau Browser"
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

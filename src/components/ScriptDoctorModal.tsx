import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, Wand2, X, RefreshCw, AlertCircle } from 'lucide-react';
import { enhanceScript } from '../services/voiceService';
import { VoiceId } from '../types';

interface ScriptDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalScript: string;
  onApplyEnhanced: (newScript: string, recommendedVoice?: VoiceId, recommendedStyle?: string) => void;
}

export const ScriptDoctorModal: React.FC<ScriptDoctorModalProps> = ({
  isOpen,
  onClose,
  originalScript,
  onApplyEnhanced,
}) => {
  const [goal, setGoal] = useState<'natural' | 'commercial' | 'storytelling' | 'cues'>('natural');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    enhancedScript: string;
    ssmlOrCues?: string;
    wordCount: number;
    estimatedDurationSeconds: number;
    recommendedVoice: VoiceId;
    recommendedStyle: string;
    directorNotes: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEnhance = async (selectedGoal = goal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await enhanceScript({
        script: originalScript,
        goal: selectedGoal,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memproses AI Script Doctor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApplyEnhanced(result.enhancedScript, result.recommendedVoice, result.recommendedStyle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Voice Over Script Doctor</h3>
              <p className="text-xs text-slate-400">
                Poles diksi, intonasi, dan ritme naskah Anda agar terdengar memukau saat dibacakan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Goal Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Pilih Tujuan Optimasi:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'natural', label: 'Alami & Mengalir' },
                { id: 'commercial', label: 'Iklan & Hook Kuat' },
                { id: 'storytelling', label: 'Sinematik / Cerita' },
                { id: 'cues', label: 'Tambah Jeda & Cues' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setGoal(item.id as any);
                    handleEnhance(item.id as any);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-colors ${
                    goal === item.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Comparison View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Original */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Naskah Asli Anda
              </span>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {originalScript}
              </p>
            </div>

            {/* Enhanced */}
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block">
                  Hasil Optimasi AI Doctor
                </span>
                {result && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    ~{result.estimatedDurationSeconds}s
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="h-40 flex flex-col items-center justify-center text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                  <span className="text-xs text-slate-400">Sedang memoles naskah Anda...</span>
                </div>
              ) : result ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {result.enhancedScript}
                  </p>
                  {result.directorNotes && result.directorNotes.length > 0 && (
                    <div className="pt-2 border-t border-indigo-500/20 text-[11px] text-indigo-300">
                      <strong>Catatan Sutradara:</strong>
                      <ul className="list-disc list-inside mt-0.5 text-slate-400">
                        {result.directorNotes.map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center p-3 text-slate-500 space-y-2">
                  <Wand2 className="w-6 h-6 text-slate-600" />
                  <p className="text-xs">Klik salah satu tujuan di atas untuk melihat versi polesan AI.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleEnhance()}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerasi Ulang</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!result || isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan ke Editor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

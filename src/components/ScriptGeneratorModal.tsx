import React, { useState } from 'react';
import { Wand2, X, Sparkles, Check, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { generateScriptIdea } from '../services/voiceService';
import { VoiceId } from '../types';

interface ScriptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScript: (script: string, voice?: VoiceId, style?: string) => void;
}

export const ScriptGeneratorModal: React.FC<ScriptGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyScript,
}) => {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState<'commercial' | 'storytelling' | 'news' | 'tutorial' | 'podcast'>('commercial');
  const [duration, setDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<{
    title: string;
    script: string;
    category: string;
    estimatedDurationSeconds: number;
    recommendedVoice: VoiceId;
    recommendedStyle: string;
    keyHighlight: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await generateScriptIdea({
        topic: topic.trim(),
        category,
        durationSeconds: duration,
      });
      setGeneratedData(data);
    } catch (err: any) {
      setError(err.message || 'Gagal membuat naskah.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedData) return;
    onApplyScript(
      generatedData.script,
      generatedData.recommendedVoice,
      generatedData.recommendedStyle
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Buat Naskah Voice Over Otomatis</h3>
              <p className="text-xs text-slate-400">
                Cukup ketik ide atau topik, AI akan menyusun naskah yang siap dibacakan.
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

        {/* Form Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          <form onSubmit={handleGenerate} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Topik atau Ide Voice Over:
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Contoh: Promo diskon 50% kafe kopi kekinian untuk hari kemerdekaan..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 placeholder-slate-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Kategori Naskah:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="commercial">Iklan / Promosi (Commercial)</option>
                  <option value="storytelling">Cerita & Sinematik (Storytelling)</option>
                  <option value="news">Berita Resmi (News / Formal)</option>
                  <option value="tutorial">Panduan & Edukasi (Tutorial)</option>
                  <option value="podcast">Podcast & Obrolan Santai</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Target Durasi:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[15, 30, 60].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`py-2 rounded-xl text-xs font-medium border text-center transition-colors ${
                        duration === d
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                      }`}
                    >
                      {d} detik
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !topic.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sedang Menulis Naskah...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Naskah Sekarang</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Result preview */}
          {generatedData && (
            <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{generatedData.title}</span>
                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  ~{generatedData.estimatedDurationSeconds} detik
                </span>
              </div>

              <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                {generatedData.script}
              </p>

              <div className="text-[11px] text-slate-400 flex items-center gap-3">
                <span>Rekomendasi Suara: <strong className="text-indigo-300">{generatedData.recommendedVoice}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {generatedData && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-2">
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Gunakan Naskah Ini</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

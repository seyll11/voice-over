import React from 'react';
import { VoiceOverTake } from '../types';
import { downloadAudioFile } from '../utils/audioPlayer';
import { X, Play, Download, Trash2, Clock, Check, Disc3 } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  takes: VoiceOverTake[];
  onSelectTake: (take: VoiceOverTake) => void;
  onDeleteTake: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  takes,
  onSelectTake,
  onDeleteTake,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + d.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Riwayat Rekaman Studio</h3>
            <p className="text-xs text-slate-400">
              {takes.length} take audio tersimpan di sesi browser Anda
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {takes.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
              <Disc3 className="w-8 h-8 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">Belum ada riwayat voice over</p>
              <p className="text-xs text-slate-500">
                Setiap voice over yang Anda generate akan otomatis tersimpan di sini.
              </p>
            </div>
          ) : (
            takes.map((take) => (
              <div
                key={take.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-indigo-400">{take.voice}</span>
                    <span className="text-[10px] text-slate-500">•</span>
                    <span className="text-[10px] text-slate-400">{formatDate(take.createdAt)}</span>
                  </div>
                  <button
                    onClick={() => onDeleteTake(take.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded"
                    title="Hapus take ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  "{take.script}"
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTake(take);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Muat ke Deck</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      downloadAudioFile(
                        take.audioBase64,
                        `take_${take.voice.toLowerCase()}_${take.id}.wav`,
                        take.mimeType
                      )
                    }
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title="Unduh File WAV"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {takes.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
            >
              Hapus Semua Riwayat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

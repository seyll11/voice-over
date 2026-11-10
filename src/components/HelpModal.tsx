import React from 'react';
import { X, CheckCircle2, Mic, Sparkles, Volume2, Download, Wand2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Panduan Studio Voice Over</h3>
              <p className="text-xs text-slate-400">
                Cara mudah mengubah naskah Anda menjadi audio narasi alami.
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

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200">
            <strong className="block text-sm text-white mb-1">
              "Apakah kamu bisa membuat saya sebuah voice over jika saya mengirimkan skripnya?"
            </strong>
            <p>
              <strong>Tentu saja bisa!</strong> Aplikasi SuaraAI Studio ini dibuat khusus untuk memproses skrip apa pun yang Anda kirimkan menjadi voice over bersuara natural, ekspresif, dan berkualitas studio secara instan.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white text-sm">Langkah-langkah Praktis:</h4>

            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 font-bold text-xs shrink-0 mt-0.5 border border-indigo-500/40">
                1
              </span>
              <div>
                <strong className="text-slate-100 block">Tempelkan Skrip Anda</strong>
                Ketik atau salin naskah Anda ke dalam kotak naskah. Anda juga bisa menekan tombol <em>"Tuliskan Skrip Otomatis"</em> jika belum memiliki naskah siap pakai.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 font-bold text-xs shrink-0 mt-0.5 border border-indigo-500/40">
                2
              </span>
              <div>
                <strong className="text-slate-100 block">Pilih Karakter Suara AI</strong>
                Tersedia 5 pilihan suara: <strong>Kore</strong> (wanita hangat), <strong>Puck</strong> (pria energetik), <strong>Fenrir</strong> (pria berat otoritatif), <strong>Zephyr</strong> (wanita artikulatif), dan <strong>Charon</strong> (pria sinematik). Klik tombol "Tes" untuk mendengar cuplikannya.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 font-bold text-xs shrink-0 mt-0.5 border border-indigo-500/40">
                3
              </span>
              <div>
                <strong className="text-slate-100 block">Poles Ritme & Tambahkan Emosi</strong>
                Gunakan fitur <strong>AI Script Doctor</strong> untuk memoles jeda dan intonasi. Anda juga bisa menyisipkan tag seperti <code>&lt;breath&gt;</code> untuk tarikan napas atau <code>...</code> untuk jeda hening.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 font-bold text-xs shrink-0 mt-0.5 border border-indigo-500/40">
                4
              </span>
              <div>
                <strong className="text-slate-100 block">Generate & Unduh Master WAV</strong>
                Klik tombol <strong>"Generate Voice Over"</strong>. Putar hasilnya, atur kecepatan, tambahkan musik latar (BGM), lalu unduh file WAV untuk dipakai di video TikTok, YouTube, presentasi, atau podcast Anda!
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
          >
            Mengerti, Mulai Buat Voice Over
          </button>
        </div>
      </div>
    </div>
  );
};

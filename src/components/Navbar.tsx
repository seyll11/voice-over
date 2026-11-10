import React, { useState } from 'react';
import { Mic, Waves, History, Sparkles, Volume2, HelpCircle, Share2, Check, FolderDown } from 'lucide-react';

interface NavbarProps {
  onOpenHistory: () => void;
  onOpenHelp: () => void;
  onOpenExport: () => void;
  historyCount: number;
  hasApiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHistory,
  onOpenHelp,
  onOpenExport,
  historyCount,
  hasApiKey,
}) => {
  const [copied, setCopied] = useState(false);
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Mic className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white font-mono">SuaraAI</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Studio Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">AI Voice Over & Audio Synthesizer</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <Waves className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Gemini 3.8 Flash TTS</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </div>

          <button
            type="button"
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-xs font-semibold text-emerald-200 transition-colors shadow-sm"
            title="Unduh Source Code Project (.ZIP) untuk VS Code"
          >
            <FolderDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Unduh ZIP</span>
          </button>

          <button
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold text-indigo-200 transition-colors"
            title="Salin Link Website"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-indigo-300" />
                <span>Salin Link</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-200 transition-colors"
            title="Panduan Pembuatan Voice Over"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Panduan</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-200 transition-colors"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Riwayat</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

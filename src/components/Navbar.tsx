import React, { useState } from 'react';
import {
  Mic,
  History,
  HelpCircle,
  Share2,
  Check,
  FolderDown,
  LogOut,
  LogIn,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
}) => {
  const [copied, setCopied] = useState(false);
  const { user, logout, exitGuestMode } = useAuth();

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Mode Tamu';

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white">
            <Mic className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            SuaraAI Studio
          </span>
        </div>

        {/* Navigation & Utility Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto">
          <button
            type="button"
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-xs font-semibold text-emerald-200 transition-colors whitespace-nowrap shrink-0"
            title="Unduh Source Code Project (.ZIP) untuk VS Code"
          >
            <FolderDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Unduh ZIP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
            title="Salin Link Website"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 hidden sm:inline">Tersalin</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden md:inline">Salin Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Panduan</span>
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>Riwayat</span>
            {historyCount > 0 && (
              <span className="text-indigo-300 font-mono text-[11px]">({historyCount})</span>
            )}
          </button>

          {/* Account Menu */}
          <div className="h-5 w-px bg-slate-800 mx-0.5 shrink-0" />

          {user ? (
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-300 px-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-indigo-400" />
                )}
                <span className="max-w-[110px] truncate font-medium">{displayName}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-medium text-rose-200 transition-colors whitespace-nowrap shrink-0"
                title="Keluar dari Akun"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={exitGuestMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk / Daftar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

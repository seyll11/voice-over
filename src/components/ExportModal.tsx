import React, { useState } from 'react';
import {
  X,
  FolderDown,
  FileCode,
  Check,
  Copy,
  Terminal,
  Key,
  Play,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { downloadProjectZip } from '../utils/downloadProjectZip';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'download' | 'preview'>('download');
  const [selectedFile, setSelectedFile] = useState<string>('package.json');
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    setErrorMsg(null);
    try {
      await downloadProjectZip((status) => setDownloadStatus(status));
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengunduh berkas ZIP.');
    } finally {
      setIsDownloading(false);
      setDownloadStatus('');
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const loadFilePreview = async (fileName: string) => {
    setSelectedFile(fileName);
    setIsLoadingFile(true);
    try {
      const res = await fetch('/api/project-files');
      const data = await res.json();
      setFileContent(data.files?.[fileName] || '// File tidak ditemukan');
    } catch {
      setFileContent('// Gagal memuat file');
    } finally {
      setIsLoadingFile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Unduh Source Code untuk VS Code</h3>
              <p className="text-xs text-slate-400">
                Pindahkan seluruh aplikasi SuaraAI Studio ke komputer lokal Anda
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 px-5 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('download')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'download'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderDown className="w-4 h-4" />
            <span>Unduh Arsip ZIP</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('preview');
              if (!fileContent) loadFilePreview('package.json');
            }}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'preview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Salin Berkas Individual</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'download' ? (
            <div className="space-y-4">
              {/* Primary Download Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/40 text-center space-y-3 shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                  <FolderDown className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">suara-ai-voiceover.zip</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Berisi seluruh kode frontend React, backend Express, komponen studio, TypeScript config, dan panduan instalasi lengkap.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 scale-100 active:scale-95"
                  >
                    {isDownloading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{downloadStatus || 'Sedang Mengunduh ZIP...'}</span>
                      </>
                    ) : (
                      <>
                        <FolderDown className="w-4 h-4" />
                        <span>Unduh File ZIP Sekarang</span>
                      </>
                    )}
                  </button>

                  <a
                    href="/suara-ai-voiceover.zip"
                    download="suara-ai-voiceover.zip"
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                    title="Unduh langsung via file statis tanpa JavaScript"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>Link Unduh Langsung</span>
                  </a>
                </div>
              </div>

              {/* Step-by-step Setup Guide */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>3 Langkah Cepat Menjalankan di VS Code:</span>
                </h4>

                <div className="space-y-2 text-xs">
                  {/* Step 1 */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">1. Install Dependensi</span>
                      <button
                        onClick={() => copyText('npm install', 'npm')}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'npm' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Salin</span>
                      </button>
                    </div>
                    <code className="block p-2 rounded bg-slate-900 text-indigo-300 font-mono text-[11px]">
                      npm install
                    </code>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">2. Buat File .env (API Key Gemini)</span>
                      <button
                        onClick={() => copyText('GEMINI_API_KEY="AIzaSy..."\nPORT=3000', 'env')}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'env' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Salin</span>
                      </button>
                    </div>
                    <code className="block p-2 rounded bg-slate-900 text-indigo-300 font-mono text-[11px] leading-relaxed">
                      GEMINI_API_KEY="MASUKKAN_API_KEY_ANDA"<br />
                      PORT=3000
                    </code>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">3. Jalankan Server Dev</span>
                      <button
                        onClick={() => copyText('npm run dev', 'run')}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'run' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Salin</span>
                      </button>
                    </div>
                    <code className="block p-2 rounded bg-slate-900 text-emerald-300 font-mono text-[11px]">
                      npm run dev
                    </code>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Buka browser di <strong className="text-white">http://localhost:3000</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* File Preview & Raw Code Copy Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <select
                  value={selectedFile}
                  onChange={(e) => loadFilePreview(e.target.value)}
                  className="bg-slate-950 text-xs text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="package.json">package.json</option>
                  <option value="server.ts">server.ts</option>
                  <option value="src/App.tsx">src/App.tsx</option>
                  <option value="src/types.ts">src/types.ts</option>
                  <option value="src/services/voiceService.ts">src/services/voiceService.ts</option>
                  <option value="src/utils/audioPlayer.ts">src/utils/audioPlayer.ts</option>
                  <option value="src/data/voices.ts">src/data/voices.ts</option>
                  <option value="vite.config.ts">vite.config.ts</option>
                  <option value="README.md">README.md</option>
                </select>

                <button
                  type="button"
                  onClick={() => copyText(fileContent, 'file')}
                  disabled={!fileContent || isLoadingFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold border border-indigo-500/40 transition-colors"
                >
                  {copiedKey === 'file' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Kode Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Semua Kode ({selectedFile})</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-3 max-h-72 overflow-y-auto">
                {isLoadingFile ? (
                  <div className="h-40 flex items-center justify-center text-xs text-slate-400 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Memuat berkas...</span>
                  </div>
                ) : (
                  <pre className="text-[11px] font-mono text-slate-300 whitespace-pre leading-relaxed">
                    {fileContent}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Format: Standard ZIP Archive (Compatible Windows, Mac, Linux)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

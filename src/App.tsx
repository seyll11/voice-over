/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VoiceId, DialogueLine, VoiceOverTake, ScriptTemplate } from './types';
import { STYLE_PRESETS } from './data/voices';
import { Navbar } from './components/Navbar';
import { VoiceSelector } from './components/VoiceSelector';
import { StyleSelector } from './components/StyleSelector';
import { ScriptEditor } from './components/ScriptEditor';
import { DialogueEditor } from './components/DialogueEditor';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { ScriptDoctorModal } from './components/ScriptDoctorModal';
import { ScriptGeneratorModal } from './components/ScriptGeneratorModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { HelpModal } from './components/HelpModal';
import { ExportModal } from './components/ExportModal';
import { generateVoiceOver, checkServerHealth, speakWithBrowser } from './services/voiceService';
import {
  Mic,
  Sparkles,
  Users,
  Radio,
  Play,
  Volume2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Wand2,
  FolderDown,
} from 'lucide-react';

export default function App() {
  // App state
  const [mode, setMode] = useState<'single' | 'dialogue'>('single');
  const [script, setScript] = useState<string>(
    'Halo! Tentu saja saya bisa membuatkan voice over profesional dari skrip Anda. Silakan ganti naskah ini dengan teks Anda sendiri, pilih karakter suara di atas, lalu klik tombol Generate Voice Over di bawah untuk mendengarkan hasilnya!'
  );
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>('Kore');
  const [selectedStyle, setSelectedStyle] = useState<string>(STYLE_PRESETS[0].prompt);

  // Dialogue mode state
  const [speaker1Voice, setSpeaker1Voice] = useState<VoiceId>('Puck');
  const [speaker2Voice, setSpeaker2Voice] = useState<VoiceId>('Kore');
  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>([
    {
      id: '1',
      speaker: 'Pembicara 1',
      voice: 'Puck',
      text: 'Halo teman-teman! Selamat datang kembali di episode spesial podcast kita hari ini. <breath>',
      style: 'Enthusiastic and energetic host',
    },
    {
      id: '2',
      speaker: 'Pembicara 2',
      voice: 'Kore',
      text: 'Halo semuanya! |yeah| Hari ini kita bakal bahas rahasia membuat voice over memukau dengan bantuan AI.',
      style: 'Warm and friendly co-host',
    },
    {
      id: '3',
      speaker: 'Pembicara 1',
      voice: 'Puck',
      text: 'Betul sekali! Teknologi sekarang bikin proses rekaman jadi jauh lebih cepat dan hemat waktu.',
      style: 'Excited and encouraging',
    },
  ]);

  // Player & Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [currentMime, setCurrentMime] = useState<string>('audio/wav');
  const [currentVoiceName, setCurrentVoiceName] = useState<string>('Kore');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals state
  const [isDoctorOpen, setIsDoctorOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Health / API status
  const [hasApiKey, setHasApiKey] = useState(true);

  // History takes
  const [takes, setTakes] = useState<VoiceOverTake[]>(() => {
    try {
      const saved = localStorage.getItem('suara_ai_takes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save takes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('suara_ai_takes', JSON.stringify(takes));
    } catch (e) {
      console.warn('LocalStorage limit reached', e);
    }
  }, [takes]);

  // Check health on load
  useEffect(() => {
    checkServerHealth().then((res) => {
      setHasApiKey(res.hasApiKey);
    });
  }, []);

  // Handle Voice Over Generation
  const handleGenerate = async () => {
    const textToSpeak = mode === 'single' ? script.trim() : dialogueLines.map((l) => `${l.speaker}: ${l.text}`).join('\n');
    if (!textToSpeak) {
      setErrorMessage('Naskah teks wajib diisi sebelum membuat voice over.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessToast(null);

    try {
      const response = await generateVoiceOver({
        text: mode === 'single' ? script : '',
        voice: selectedVoice,
        style: selectedStyle,
        mode,
        dialogueParts:
          mode === 'dialogue'
            ? dialogueLines.map((line) => ({
                speaker: line.speaker,
                text: line.text,
                style: line.style,
                voice: line.voice,
              }))
            : undefined,
      });

      setCurrentAudio(response.audioBase64);
      setCurrentMime(response.mimeType || 'audio/wav');
      setCurrentVoiceName(response.voice || selectedVoice);

      // Save take to history
      const newTake: VoiceOverTake = {
        id: Math.random().toString(36).substring(7),
        title: mode === 'single' ? script.substring(0, 32) + '...' : 'Dialog Dua Karakter',
        script: mode === 'single' ? script : dialogueLines.map((l) => `${l.speaker}: ${l.text}`).join(' | '),
        voice: response.voice || selectedVoice,
        style: selectedStyle,
        mode,
        createdAt: Date.now(),
        audioBase64: response.audioBase64,
        mimeType: response.mimeType || 'audio/wav',
      };
      setTakes((prev) => [newTake, ...prev.slice(0, 19)]); // keep latest 20
      setSuccessToast('Voice over berhasil dibuat dengan sukses!');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Failed to generate audio:', err);
      setErrorMessage(
        err.message || 'Gagal membuat voice over. Silakan periksa koneksi dan coba lagi.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Browser speech preview
  const handleBrowserPreview = () => {
    const textToSpeak = mode === 'single' ? script : dialogueLines.map((l) => l.text).join('. ');
    if (!textToSpeak.trim()) return;

    try {
      speakWithBrowser(textToSpeak, {
        lang: 'id-ID',
        rate: selectedVoice === 'Puck' ? 1.05 : 0.98,
        pitch: selectedVoice === 'Kore' || selectedVoice === 'Zephyr' ? 1.15 : 0.9,
      });
      setSuccessToast('Memutar pratinjau browser instan...');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      setErrorMessage('Browser ini tidak mendukung Web Speech API.');
    }
  };

  const handleApplyTemplate = (template: ScriptTemplate) => {
    setScript(template.text);
    setSelectedVoice(template.voice);
    setSelectedStyle(template.style);
    setMode('single');
  };

  const handleApplyDoctor = (newScript: string, recVoice?: VoiceId, recStyle?: string) => {
    setScript(newScript);
    if (recVoice) setSelectedVoice(recVoice);
    if (recStyle) setSelectedStyle(recStyle);
    setSuccessToast('Naskah berhasil dipoles oleh AI Script Doctor!');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleApplyGeneratedScript = (newScript: string, recVoice?: VoiceId, recStyle?: string) => {
    setScript(newScript);
    if (recVoice) setSelectedVoice(recVoice);
    if (recStyle) setSelectedStyle(recStyle);
    setMode('single');
    setSuccessToast('Naskah baru siap dibacakan!');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSelectTake = (take: VoiceOverTake) => {
    setCurrentAudio(take.audioBase64);
    setCurrentMime(take.mimeType);
    setCurrentVoiceName(take.voice);
    if (take.mode === 'single') {
      setScript(take.script);
      setMode('single');
    }
    setSuccessToast(`Memuat take rekaman "${take.voice}" ke deck audio.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleDeleteTake = (id: string) => {
    setTakes((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearTakes = () => {
    if (window.confirm('Hapus seluruh riwayat rekaman tersimpan?')) {
      setTakes([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        historyCount={takes.length}
        hasApiKey={hasApiKey}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Answer Banner & Welcome Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-8 -top-8 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bisa Banget! Kirimkan Skrip Anda</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Studio Pembuatan Voice Over AI Cerdas
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Ketik atau tempelkan skrip naskah Anda di bawah ini, pilih karakter suara (Pria/Wanita), atur gaya emosi bicara, lalu klik <strong>Generate Voice Over</strong>. Narasi audio jernih dan berkarakter siap diunduh dalam sekejap!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsExportOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors flex items-center gap-1.5"
                title="Unduh seluruh project source code ke VS Code"
              >
                <FolderDown className="w-4 h-4 text-emerald-400" />
                <span>Unduh ZIP (VS Code)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
              >
                Lihat Panduan
              </button>
              <button
                type="button"
                onClick={() => setIsGeneratorOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Buat Skrip Baru</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'single'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Narasi Tunggal (Single Speaker)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('dialogue')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'dialogue'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Dialog Podcast 2 Pembicara (Multi-Speaker)</span>
            </button>
          </div>
        </div>

        {/* Studio Workspace Content */}
        <div className="space-y-6">
          {mode === 'single' ? (
            <>
              {/* Voice Picker */}
              <VoiceSelector
                selectedVoice={selectedVoice}
                onSelectVoice={setSelectedVoice}
              />

              {/* Style Presets */}
              <StyleSelector
                selectedPrompt={selectedStyle}
                onChangeStyle={setSelectedStyle}
              />

              {/* Script Editor Area */}
              <ScriptEditor
                script={script}
                onChangeScript={setScript}
                onApplyTemplate={handleApplyTemplate}
                onOpenDoctor={() => setIsDoctorOpen(true)}
                onOpenGenerator={() => setIsGeneratorOpen(true)}
              />
            </>
          ) : (
            <DialogueEditor
              dialogueLines={dialogueLines}
              onChangeLines={setDialogueLines}
              speaker1Voice={speaker1Voice}
              speaker2Voice={speaker2Voice}
              onChangeSpeaker1Voice={setSpeaker1Voice}
              onChangeSpeaker2Voice={setSpeaker2Voice}
            />
          )}

          {/* Error & Toast Notifications */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-rose-200 text-xs"
              >
                Tutup
              </button>
            </div>
          )}

          {successToast && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Action Trigger Buttons */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                Engine: <strong className="text-slate-200">{mode === 'single' ? 'gemini-3.8-flash-lite-tts' : 'gemini-3.8-flash-tts'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleBrowserPreview}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-colors flex items-center gap-1.5"
                title="Dengarkan pengucapan instan via synthesizer browser tanpa jeda"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tes Cepat Browser</span>
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 scale-100 active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang Meracik Suara Audio...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-cyan-300" />
                    <span>Generate Voice Over Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Studio Audio Master Deck */}
          <div className="pt-2">
            <AudioPlayerBar
              audioBase64={currentAudio}
              mimeType={currentMime}
              voiceName={currentVoiceName}
              scriptText={mode === 'single' ? script : 'Dialogue Take'}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </main>

      {/* Modals & Drawers */}
      <ScriptDoctorModal
        isOpen={isDoctorOpen}
        onClose={() => setIsDoctorOpen(false)}
        originalScript={script}
        onApplyEnhanced={handleApplyDoctor}
      />

      <ScriptGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onApplyScript={handleApplyGeneratedScript}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        takes={takes}
        onSelectTake={handleSelectTake}
        onDeleteTake={handleDeleteTake}
        onClearAll={handleClearTakes}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}

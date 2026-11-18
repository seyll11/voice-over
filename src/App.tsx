/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  VoiceId,
  TtsModelId,
  DialogueLine,
  VoiceOverTake,
  ScriptTemplate,
  VoicePreset,
} from './types';
import { STYLE_PRESETS, normalizeVoiceId } from './data/voices';
import { useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';
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
  Users,
  Radio,
  Volume2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Wand2,
  FolderDown,
  Square,
  Lock,
  MailCheck,
} from 'lucide-react';

export default function App() {
  const {
    user,
    authLoading,
    isGuest,
    studioProfile,
    voicePresets,
    resendVerificationEmail,
    refreshUserStatus,
    saveStudioPreferences,
    saveVoicePreset,
    removeVoicePreset,
  } = useAuth();

  // App state
  const [mode, setMode] = useState<'single' | 'dialogue'>('single');
  const [script, setScript] = useState<string>(
    'Halo! Tentu saja saya bisa membuatkan voice over profesional dari skrip Anda. Silakan ganti naskah ini dengan teks Anda sendiri, pilih karakter suara di atas, lalu klik tombol Generate Voice Over di bawah untuk mendengarkan hasilnya!'
  );
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>(() => {
    return normalizeVoiceId(localStorage.getItem('suara_ai_locked_voice'));
  });
  const [selectedStyle, setSelectedStyle] = useState<string>(() => {
    return localStorage.getItem('suara_ai_locked_style') || STYLE_PRESETS[0].prompt;
  });
  const [voiceLocked, setVoiceLocked] = useState<boolean>(() => {
    return localStorage.getItem('suara_ai_voice_locked') === 'true';
  });
  const [selectedModel, setSelectedModel] = useState<TtsModelId>('gemini-3.8-flash-lite-tts');

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
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState(false);
  const [browserStopFn, setBrowserStopFn] = useState<(() => void) | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  // Health / API status
  const [hasApiKey, setHasApiKey] = useState(true);

  // History takes (scoped per user uid or guest)
  const storageKey = user ? `suara_ai_takes_${user.uid}` : 'suara_ai_takes_guest';
  const [takes, setTakes] = useState<VoiceOverTake[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey) || localStorage.getItem('suara_ai_takes');
      setTakes(saved ? JSON.parse(saved) : []);
    } catch {
      setTakes([]);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(takes));
    } catch (e) {
      console.warn('LocalStorage limit reached', e);
    }
  }, [takes, storageKey]);

  // Hydrate studio voice consistency settings from Firestore when user profile loads
  useEffect(() => {
    if (studioProfile) {
      setSelectedVoice(normalizeVoiceId(studioProfile.preferredVoice));
      setVoiceLocked(studioProfile.voiceLocked);
      if (studioProfile.lockedStyle) {
        setSelectedStyle(studioProfile.lockedStyle);
      }
      setSelectedModel(studioProfile.preferredModel);
    }
  }, [studioProfile]);

  // Check health on load
  useEffect(() => {
    checkServerHealth().then((res) => {
      setHasApiKey(res.hasApiKey);
    });
  }, []);

  const persistVoicePrefs = (
    nextVoice: VoiceId,
    nextLocked: boolean,
    nextStyle: string,
    nextModel: TtsModelId
  ) => {
    localStorage.setItem('suara_ai_locked_voice', nextVoice);
    localStorage.setItem('suara_ai_voice_locked', String(nextLocked));
    localStorage.setItem('suara_ai_locked_style', nextStyle);

    if (user && user.emailVerified) {
      saveStudioPreferences({
        preferredVoice: nextVoice,
        voiceLocked: nextLocked,
        lockedStyle: nextStyle,
        preferredModel: nextModel,
      }).catch((err) => console.warn('Sync preference error:', err));
    }
  };

  const handleSelectVoice = (voiceId: VoiceId) => {
    setSelectedVoice(voiceId);
    persistVoicePrefs(voiceId, voiceLocked, selectedStyle, selectedModel);
  };

  const handleToggleLock = () => {
    const nextLocked = !voiceLocked;
    setVoiceLocked(nextLocked);
    persistVoicePrefs(selectedVoice, nextLocked, selectedStyle, selectedModel);
    setSuccessToast(
      nextLocked
        ? `Karakter suara "${selectedVoice}" dikunci! Suara tidak akan berubah otomatis.`
        : 'Kunci suara dibuka. Anda bebas berganti karakter kapan saja.'
    );
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleChangeStyle = (nextStyle: string) => {
    setSelectedStyle(nextStyle);
    persistVoicePrefs(selectedVoice, voiceLocked, nextStyle, selectedModel);
  };

  const handleChangeModel = (nextModel: TtsModelId) => {
    setSelectedModel(nextModel);
    persistVoicePrefs(selectedVoice, voiceLocked, selectedStyle, nextModel);
  };

  const handleSavePreset = async (name: string) => {
    await saveVoicePreset({
      name,
      voiceId: selectedVoice,
      stylePrompt: selectedStyle,
      model: selectedModel,
    });
    setSuccessToast(`Preset "${name}" berhasil disimpan ke akun Anda!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleApplyPreset = (preset: VoicePreset) => {
    setSelectedVoice(preset.voiceId);
    setSelectedStyle(preset.stylePrompt);
    setSelectedModel(preset.model);
    setVoiceLocked(true);
    persistVoicePrefs(preset.voiceId, true, preset.stylePrompt, preset.model);
    setSuccessToast(`Memuat & mengunci preset "${preset.name}" (${preset.voiceId}).`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Handle Voice Over Generation
  const handleGenerate = async () => {
    const textToSpeak =
      mode === 'single'
        ? script.trim()
        : dialogueLines.map((l) => `${l.speaker}: ${l.text}`).join('\n');
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
        model: selectedModel,
        dialogueParts:
          mode === 'dialogue'
            ? dialogueLines.map((line) => ({
                speaker: line.speaker,
                text: line.text,
                style: line.style,
                voice: line.speaker === 'Pembicara 1' ? speaker1Voice : speaker2Voice,
              }))
            : undefined,
      });

      setCurrentAudio(response.audioBase64);
      setCurrentMime(response.mimeType || 'audio/wav');
      setCurrentVoiceName(response.voice || selectedVoice);

      const newTake: VoiceOverTake = {
        id: Math.random().toString(36).substring(7),
        title: mode === 'single' ? script.substring(0, 32) + '...' : 'Dialog Dua Karakter',
        script:
          mode === 'single'
            ? script
            : dialogueLines.map((l) => `${l.speaker}: ${l.text}`).join(' | '),
        voice: response.voice || selectedVoice,
        style: selectedStyle,
        mode,
        createdAt: Date.now(),
        audioBase64: response.audioBase64,
        mimeType: response.mimeType || 'audio/wav',
      };
      setTakes((prev) => [newTake, ...prev.slice(0, 19)]);
      setSuccessToast(`Voice over karakter "${response.voice}" berhasil dibuat!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Failed to generate audio:', err);
      const rawMsg = err.message || '';
      if (
        rawMsg.includes('Quota exceeded') ||
        rawMsg.includes('limit: 10') ||
        rawMsg.includes('rate-limits')
      ) {
        setErrorMessage(
          'Batas Kuota Akun Google Gratis Terpenuhi (10/hari). Klik "Beralih ke Suara Browser" untuk melanjutkan tanpa batas kuota, atau tambahkan API Key cadangan.'
        );
      } else if (
        rawMsg.includes('Failed to fetch') ||
        rawMsg.includes('NetworkError') ||
        rawMsg.includes('Load failed')
      ) {
        setErrorMessage(
          'Gagal Terhubung (Failed to fetch): Kemungkinan server Render sedang bangun (tunggu 30-45 detik lalu coba lagi) atau naskah terlalu panjang. Gunakan "Beralih ke Suara Browser" untuk hasil instan.'
        );
      } else {
        setErrorMessage(
          err.message || 'Gagal membuat voice over. Silakan periksa koneksi dan coba lagi.'
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Browser speech preview (Unlimited free on-device TTS)
  const handleBrowserPreview = () => {
    if (isBrowserSpeaking && browserStopFn) {
      browserStopFn();
      setIsBrowserSpeaking(false);
      setBrowserStopFn(null);
      setSuccessToast('Suara browser dihentikan.');
      setTimeout(() => setSuccessToast(null), 2000);
      return;
    }

    const textToSpeak =
      mode === 'single' ? script : dialogueLines.map((l) => l.text).join('. ');
    if (!textToSpeak.trim()) return;

    try {
      setIsBrowserSpeaking(true);
      const player = speakWithBrowser(textToSpeak, {
        lang: 'id-ID',
        voiceId: selectedVoice,
        onEnd: () => {
          setIsBrowserSpeaking(false);
          setBrowserStopFn(null);
        },
        onError: () => {
          setIsBrowserSpeaking(false);
          setBrowserStopFn(null);
        },
      });
      setBrowserStopFn(() => player.stop);
      setSuccessToast(`Memutar pratinjau browser dengan profil nada "${selectedVoice}"...`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch {
      setIsBrowserSpeaking(false);
      setErrorMessage('Browser ini tidak mendukung Web Speech API.');
    }
  };

  // Respect Voice Lock so templates/Script Doctor NEVER silently switch the user's voice!
  const handleApplyTemplate = (template: ScriptTemplate) => {
    setScript(template.text);
    if (!voiceLocked) {
      setSelectedVoice(template.voice);
      setSelectedStyle(template.style);
      persistVoicePrefs(template.voice, false, template.style, selectedModel);
    }
    setMode('single');
  };

  const handleApplyDoctor = (newScript: string, recVoice?: VoiceId, recStyle?: string) => {
    setScript(newScript);
    if (!voiceLocked) {
      const nextVoice = recVoice || selectedVoice;
      const nextStyle = recStyle || selectedStyle;
      if (recVoice) setSelectedVoice(recVoice);
      if (recStyle) setSelectedStyle(recStyle);
      persistVoicePrefs(nextVoice, false, nextStyle, selectedModel);
    }
    setSuccessToast(
      voiceLocked
        ? `Naskah dipoles! Karakter suara tetap terkunci pada "${selectedVoice}".`
        : 'Naskah berhasil dipoles oleh AI Script Doctor!'
    );
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleApplyGeneratedScript = (
    newScript: string,
    recVoice?: VoiceId,
    recStyle?: string
  ) => {
    setScript(newScript);
    if (!voiceLocked) {
      const nextVoice = recVoice || selectedVoice;
      const nextStyle = recStyle || selectedStyle;
      if (recVoice) setSelectedVoice(recVoice);
      if (recStyle) setSelectedStyle(recStyle);
      persistVoicePrefs(nextVoice, false, nextStyle, selectedModel);
    }
    setMode('single');
    setSuccessToast(
      voiceLocked
        ? `Naskah baru siap! Suara tetap terkunci pada "${selectedVoice}".`
        : 'Naskah baru siap dibacakan!'
    );
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
    setSuccessToast(`Memuat rekaman "${take.voice}" ke pemutar audio.`);
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

  // Auth Gate
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          <span>Memuat Studio SuaraAI...</span>
        </div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <AuthPage />;
  }

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
        {/* Email Verification Reminder Banner for Email/Password accounts */}
        {user && !user.emailVerified && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <MailCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Verifikasi Email Anda untuk Sinkronisasi Cloud</p>
                <p className="text-amber-300/80 mt-0.5">
                  Kami telah mengirim tautan verifikasi ke <strong>{user.email}</strong>.{' '}
                  {verificationNotice && <span className="text-emerald-300">{verificationNotice}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  await resendVerificationEmail();
                  setVerificationNotice('Email verifikasi baru dikirim!');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium whitespace-nowrap"
              >
                Kirim Ulang Email
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await refreshUserStatus();
                  setVerificationNotice(
                    ok ? 'Email terverifikasi!' : 'Belum terverifikasi, silakan cek kotak masuk/spam.'
                  );
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold whitespace-nowrap"
              >
                Cek Status
              </button>
            </div>
          </div>
        )}

        {/* Studio Overview Banner */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <p className="text-xs font-medium text-indigo-400">
                {user ? `Selamat datang, ${user.displayName || user.email}` : 'Mode Tamu (Penyimpanan Lokal)'}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-balance">
                Studio Pembuatan Voice Over AI Konsisten
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Pilih dari <strong>16 karakter suara studio</strong> yang berbeda, aktifkan <strong>Kunci Suara</strong> agar warna suara Anda tidak berubah-ubah, lalu klik Generate Voice Over.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsExportOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <FolderDown className="w-4 h-4 text-emerald-400" />
                <span>Unduh ZIP</span>
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
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Buat Skrip Baru</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'single'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Narasi Tunggal</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('dialogue')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'dialogue'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Dialog 2 Pembicara</span>
            </button>
          </div>

          {voiceLocked && mode === 'single' && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-300">
              <Lock className="w-3.5 h-3.5" />
              <span>Karakter Suara Terkunci: <strong>{selectedVoice}</strong></span>
            </div>
          )}
        </div>

        {/* Studio Workspace Content */}
        <div className="space-y-6">
          {mode === 'single' ? (
            <>
              <VoiceSelector
                selectedVoice={selectedVoice}
                onSelectVoice={handleSelectVoice}
                voiceLocked={voiceLocked}
                onToggleLock={handleToggleLock}
                voicePresets={voicePresets}
                onSavePreset={user && user.emailVerified ? handleSavePreset : undefined}
                onApplyPreset={handleApplyPreset}
                onDeletePreset={user && user.emailVerified ? removeVoicePreset : undefined}
              />

              <StyleSelector
                selectedPrompt={selectedStyle}
                onChangeStyle={handleChangeStyle}
              />

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
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleBrowserPreview}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3 text-indigo-400" />
                  <span>Beralih ke Suara Browser</span>
                </button>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-200 text-xs px-1.5 py-1"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}

          {successToast && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Action Trigger Bar + Engine Selector */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                <span>Mesin Suara:</span>
              </div>
              {mode === 'single' ? (
                <select
                  value={selectedModel}
                  onChange={(e) => handleChangeModel(e.target.value as TtsModelId)}
                  className="bg-slate-950 text-xs text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="gemini-3.8-flash-lite-tts">
                    Flash Lite TTS (Cepat &amp; Efisien)
                  </option>
                  <option value="gemini-3.8-flash-tts">
                    Flash TTS Pro (Karakter Tajam &amp; Stabil)
                  </option>
                </select>
              ) : (
                <strong className="text-slate-200">gemini-3.8-flash-tts (Dual Speaker)</strong>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleBrowserPreview}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  isBrowserSpeaking
                    ? 'bg-rose-600/30 text-rose-200 border-rose-500/50 hover:bg-rose-600/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Dengarkan pembacaan naskah langsung dari browser (Bebas Kuota Google)"
              >
                {isBrowserSpeaking ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
                    <span>Hentikan Suara Browser</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tes Cepat Browser</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang Meracik Suara Audio...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Generate Voice Over ({selectedVoice})</span>
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

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
}

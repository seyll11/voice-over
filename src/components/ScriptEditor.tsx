import React, { useRef } from 'react';
import { SCRIPT_TEMPLATES } from '../data/voices';
import { VoiceId, ScriptTemplate } from '../types';
import {
  FileText,
  Clock,
  Sparkles,
  Wand2,
  Trash2,
  PlusCircle,
  Copy,
  Check,
  Quote,
} from 'lucide-react';

interface ScriptEditorProps {
  script: string;
  onChangeScript: (val: string) => void;
  onApplyTemplate: (template: ScriptTemplate) => void;
  onOpenDoctor: () => void;
  onOpenGenerator: () => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script,
  onChangeScript,
  onApplyTemplate,
  onOpenDoctor,
  onOpenGenerator,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Stats calculation
  const trimmed = script.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = script.length;
  // Natural voiceover rate is approx 130-150 words per minute (2.2 - 2.5 words/sec)
  const estimatedSeconds = Math.max(1, Math.round(wordCount / 2.3));

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs} detik`;
  };

  // Helper to insert vocal tags at current cursor position
  const insertTag = (tag: string) => {
    if (!textareaRef.current) {
      onChangeScript(script + ' ' + tag);
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const textBefore = script.substring(0, start);
    const textAfter = script.substring(end);
    const newText = textBefore + tag + textAfter;
    onChangeScript(newText);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 10);
  };

  const handleCopy = () => {
    if (!script) return;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span>3. Masukkan Naskah / Skrip Voice Over</span>
          <span className="text-xs text-indigo-400 font-normal">
            (Tempelkan atau ketik naskah Anda di sini)
          </span>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenGenerator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-medium shadow-sm transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Tuliskan Skrip Otomatis</span>
          </button>

          <button
            type="button"
            onClick={onOpenDoctor}
            disabled={!trimmed}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              trimmed
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30'
                : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
            title="Optimalkan ritme dan tanda jeda skrip dengan AI Script Doctor"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Script Doctor</span>
          </button>
        </div>
      </div>

      {/* Template quick pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-slate-500 text-[11px] whitespace-nowrap flex items-center gap-1 pr-1">
          <Quote className="w-3 h-3" />
          Contoh Skrip:
        </span>
        {SCRIPT_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            type="button"
            onClick={() => onApplyTemplate(tmpl)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-[11px] transition-colors flex items-center gap-1"
          >
            <span>{tmpl.title}</span>
          </button>
        ))}
      </div>

      {/* Editor Box */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all overflow-hidden flex flex-col">
        {/* Vocal cue helper bar */}
        <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Petunjuk Ekspresi Vokal:</span>
            <button
              type="button"
              onClick={() => insertTag('<breath> ')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700/60 transition-colors"
              title="Sisipkan jeda tarikan napas alami"
            >
              + &lt;breath&gt;
            </button>
            <button
              type="button"
              onClick={() => insertTag('<laugh> ')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700/60 transition-colors"
              title="Sisipkan ekspresi tawa santai"
            >
              + &lt;laugh&gt;
            </button>
            <button
              type="button"
              onClick={() => insertTag(' ... ')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700/60 transition-colors"
              title="Sisipkan tanda jeda bicara sejenak"
            >
              + [Jeda ...]
            </button>
            <button
              type="button"
              onClick={() => insertTag('|mhm| ')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700/60 transition-colors"
              title="Sisipkan vokal persetujuan santai"
            >
              + |mhm|
            </button>
            <button
              type="button"
              onClick={() => insertTag('|yeah| ')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700/60 transition-colors"
              title="Sisipkan backchanneling santai"
            >
              + |yeah|
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!script}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Salin Teks Skrip"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => onChangeScript('')}
              disabled={!script}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              title="Hapus / Kosongkan Naskah"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={script}
          onChange={(e) => onChangeScript(e.target.value)}
          placeholder="Tuliskan atau tempelkan skrip voice over Anda di sini...&#10;&#10;Contoh:&#10;Selamat datang di SuaraAI Studio! Di sini naskah Anda akan langsung disulap menjadi audio narasi jernih dan berkarakter dalam hitungan detik. Coba dengarkan sekarang..."
          rows={6}
          className="w-full p-4 bg-transparent text-slate-100 placeholder-slate-500 text-base leading-relaxed outline-none resize-y min-h-[160px] font-sans"
        />

        {/* Status / Counters Footer */}
        <div className="px-4 py-2.5 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <strong className="text-slate-200 font-mono">{wordCount}</strong> kata
            </span>
            <span className="text-slate-500">•</span>
            <span>
              <strong className="text-slate-200 font-mono">{charCount}</strong> karakter
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-indigo-400 bg-indigo-950/40 px-2.5 py-1 rounded-md border border-indigo-500/20">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Estimasi Durasi:</span>
              <strong className="font-mono text-indigo-200">{formatDuration(estimatedSeconds)}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

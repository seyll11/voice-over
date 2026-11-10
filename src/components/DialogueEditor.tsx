import React from 'react';
import { VoiceId, DialogueLine } from '../types';
import { VOICES } from '../data/voices';
import { Plus, Trash2, Users, MessageSquare } from 'lucide-react';

interface DialogueEditorProps {
  dialogueLines: DialogueLine[];
  onChangeLines: (lines: DialogueLine[]) => void;
  speaker1Voice: VoiceId;
  speaker2Voice: VoiceId;
  onChangeSpeaker1Voice: (v: VoiceId) => void;
  onChangeSpeaker2Voice: (v: VoiceId) => void;
}

export const DialogueEditor: React.FC<DialogueEditorProps> = ({
  dialogueLines,
  onChangeLines,
  speaker1Voice,
  speaker2Voice,
  onChangeSpeaker1Voice,
  onChangeSpeaker2Voice,
}) => {
  const addLine = (speaker: 'Pembicara 1' | 'Pembicara 2') => {
    const newLine: DialogueLine = {
      id: Math.random().toString(36).substring(7),
      speaker,
      voice: speaker === 'Pembicara 1' ? speaker1Voice : speaker2Voice,
      text: '',
      style: speaker === 'Pembicara 1' ? 'Enthusiastic and bright' : 'Curious and responsive',
    };
    onChangeLines([...dialogueLines, newLine]);
  };

  const updateLineText = (index: number, text: string) => {
    const updated = [...dialogueLines];
    updated[index].text = text;
    onChangeLines(updated);
  };

  const removeLine = (index: number) => {
    const updated = dialogueLines.filter((_, i) => i !== index);
    onChangeLines(updated);
  };

  const toggleSpeaker = (index: number) => {
    const updated = [...dialogueLines];
    const current = updated[index].speaker;
    const next = current === 'Pembicara 1' ? 'Pembicara 2' : 'Pembicara 1';
    updated[index].speaker = next;
    updated[index].voice = next === 'Pembicara 1' ? speaker1Voice : speaker2Voice;
    onChangeLines(updated);
  };

  return (
    <div className="space-y-4">
      {/* Speaker Roles Configuration */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Users className="w-4 h-4 text-indigo-400" />
          <span>Konfigurasi Karakter Dua Pembicara (Dual-Speaker Podcast)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-400 block">Pembicara 1 (Host / Utama)</span>
              <span className="text-[11px] text-slate-400">Suara: {speaker1Voice}</span>
            </div>
            <select
              value={speaker1Voice}
              onChange={(e) => onChangeSpeaker1Voice(e.target.value as VoiceId)}
              className="bg-slate-900 text-xs text-slate-200 px-2.5 py-1.5 rounded border border-slate-700 outline-none focus:border-indigo-500"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.gender === 'female' ? 'Wanita' : 'Pria'})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-cyan-400 block">Pembicara 2 (Bintang Tamu / Co-Host)</span>
              <span className="text-[11px] text-slate-400">Suara: {speaker2Voice}</span>
            </div>
            <select
              value={speaker2Voice}
              onChange={(e) => onChangeSpeaker2Voice(e.target.value as VoiceId)}
              className="bg-slate-900 text-xs text-slate-200 px-2.5 py-1.5 rounded border border-slate-700 outline-none focus:border-cyan-500"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.gender === 'female' ? 'Wanita' : 'Pria'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dialogue Lines */}
      <div className="space-y-2.5">
        <label className="text-sm font-semibold text-slate-200 flex items-center justify-between">
          <span>Baris Percakapan ({dialogueLines.length} Giliran)</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addLine('Pembicara 1')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Pembicara 1</span>
            </button>
            <button
              type="button"
              onClick={() => addLine('Pembicara 2')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/30 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Pembicara 2</span>
            </button>
          </div>
        </label>

        {dialogueLines.map((line, idx) => {
          const isSpk1 = line.speaker === 'Pembicara 1';
          return (
            <div
              key={line.id || idx}
              className={`p-3.5 rounded-xl border transition-all ${
                isSpk1
                  ? 'bg-indigo-950/20 border-indigo-500/30'
                  : 'bg-cyan-950/20 border-cyan-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => toggleSpeaker(idx)}
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-colors ${
                    isSpk1
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                  }`}
                  title="Klik untuk menukar pembicara"
                >
                  {line.speaker} ({isSpk1 ? speaker1Voice : speaker2Voice}) • Ganti
                </button>

                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                  title="Hapus baris ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                value={line.text}
                onChange={(e) => updateLineText(idx, e.target.value)}
                placeholder={
                  isSpk1
                    ? 'Halo semuanya, selamat datang kembali di podcast kami...'
                    : 'Halo! Wah, tema kita hari ini seru banget ya...'
                }
                rows={2}
                className="w-full p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 outline-none"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { STYLE_PRESETS } from '../data/voices';
import { VoiceStylePreset } from '../types';
import { Sliders, Sparkles, MessageSquare, Radio, BookOpen, Moon, Edit3 } from 'lucide-react';

interface StyleSelectorProps {
  selectedPrompt: string;
  onChangeStyle: (prompt: string) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedPrompt,
  onChangeStyle,
}) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customText, setCustomText] = useState('');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare':
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'Radio':
        return <Radio className="w-4 h-4 text-emerald-400" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-rose-400" />;
      case 'Moon':
        return <Moon className="w-4 h-4 text-purple-400" />;
      default:
        return <Sliders className="w-4 h-4 text-indigo-400" />;
    }
  };

  const handleSelectPreset = (preset: VoiceStylePreset) => {
    setIsCustom(false);
    onChangeStyle(preset.prompt);
  };

  const handleCustomChange = (val: string) => {
    setCustomText(val);
    onChangeStyle(val);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span>2. Atur Gaya & Emosi Narasi</span>
          <span className="text-xs text-slate-400 font-normal">(Nada suara yang diinginkan)</span>
        </label>
        <button
          type="button"
          onClick={() => {
            const nextCustom = !isCustom;
            setIsCustom(nextCustom);
            if (nextCustom && !customText) {
              setCustomText(selectedPrompt);
            }
          }}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
            isCustom
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/60'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isCustom ? 'Mode Preset' : 'Kustom Prompt'}</span>
        </button>
      </div>

      {!isCustom ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {STYLE_PRESETS.map((preset) => {
            const isSelected = selectedPrompt === preset.prompt;
            return (
              <button
                type="button"
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/50 hover:bg-slate-800/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
                    {getIcon(preset.icon)}
                  </div>
                  <span className="text-xs font-semibold leading-tight">{preset.label}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-indigo-500/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-medium text-indigo-300">Instruksi Pengarah Audio Kustom (Speech Metadata Prompt):</span>
            <span className="text-slate-500">Bahasa Indonesia atau Inggris</span>
          </div>
          <input
            type="text"
            value={customText}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="Contoh: Suara berbisik lembut, santai dengan intonasi ramah pembawa acara radio malam..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors"
          />
          <p className="text-[11px] text-slate-400">
            Tips: Sebutkan tempo (cepat/lambat), emosi (antusias, tenang, tegang), dan persona penyampai.
          </p>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { StudioAudioEngine, downloadAudioFile } from '../utils/audioPlayer';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  Volume2,
  VolumeX,
  Music,
  Check,
  Disc3,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface AudioPlayerBarProps {
  audioBase64: string | null;
  mimeType: string;
  voiceName: string;
  scriptText: string;
  isGenerating: boolean;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  audioBase64,
  mimeType,
  voiceName,
  scriptText,
  isGenerating,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [bgmType, setBgmType] = useState<'none' | 'lofi' | 'cinematic' | 'nature'>('none');
  const [bgmVolume, setBgmVolume] = useState(0.15);
  const [showBgmMenu, setShowBgmMenu] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioEngine = useRef(StudioAudioEngine.getInstance()).current;

  // Load new audio source when audioBase64 changes
  useEffect(() => {
    if (audioBase64) {
      audioEngine.setAudioSource(audioBase64, mimeType);
      setIsPlaying(false);
      setCurrentTime(0);

      // Auto play once generated
      const timer = setTimeout(() => {
        audioEngine.play().then(() => setIsPlaying(true)).catch(() => {});
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [audioBase64, mimeType]);

  // Audio engine listeners
  useEffect(() => {
    audioEngine.onTimeUpdate((curr, total) => {
      setCurrentTime(curr);
      if (total > 0 && !isNaN(total)) {
        setDuration(total);
      }
    });

    audioEngine.onEnded(() => {
      setIsPlaying(false);
      audioEngine.stopBgm();
    });
  }, []);

  // Handle BGM changes
  useEffect(() => {
    if (isPlaying && bgmType !== 'none') {
      audioEngine.setBgm(bgmType, bgmVolume);
    } else {
      audioEngine.stopBgm();
    }
  }, [isPlaying, bgmType, bgmVolume]);

  // Real-time canvas waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const freqData = audioEngine.getFrequencyData();
      const hasAudio = freqData.length > 0 && isPlaying;

      const barCount = 48;
      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;
        if (hasAudio) {
          const dataIdx = Math.floor((i / barCount) * (freqData.length / 2));
          const val = freqData[dataIdx] || 0;
          barHeight = Math.max(4, (val / 255) * (height - 6));
        } else {
          // Idle gentle wave
          const time = Date.now() / 350;
          barHeight = Math.sin(time + i * 0.2) * 3 + 6;
        }

        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#38bdf8'); // cyan
        gradient.addColorStop(1, '#6366f1'); // indigo

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = async () => {
    if (!audioBase64) return;
    if (isPlaying) {
      audioEngine.pause();
      audioEngine.stopBgm();
      setIsPlaying(false);
    } else {
      try {
        await audioEngine.play();
        setIsPlaying(true);
        if (bgmType !== 'none') {
          audioEngine.setBgm(bgmType, bgmVolume);
        }
      } catch (err) {
        console.error('Audio play error:', err);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    audioEngine.seek(val);
  };

  const handleReplay5 = () => {
    const next = Math.max(0, currentTime - 5);
    audioEngine.seek(next);
    setCurrentTime(next);
  };

  const handleForward5 = () => {
    const next = Math.min(duration || 0, currentTime + 5);
    audioEngine.seek(next);
    setCurrentTime(next);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    audioEngine.setSpeed(newSpeed);
  };

  const handleDownload = () => {
    if (!audioBase64) return;
    const cleanTitle = scriptText
      ? scriptText.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      : 'voiceover';
    downloadAudioFile(audioBase64, `suara_ai_${voiceName.toLowerCase()}_${cleanTitle}.wav`, mimeType);
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!audioBase64 && !isGenerating) {
    return (
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-slate-800/80 text-slate-500 mx-auto flex items-center justify-center">
          <Disc3 className="w-5 h-5 animate-spin-slow" />
        </div>
        <p className="text-sm font-medium text-slate-300">Belum ada audio yang digenerate</p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Tulis naskah Anda di atas, pilih karakter suara, lalu klik tombol "Generate Voice Over" untuk mendengarkan hasil rekaman studio AI.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl p-4 sm:p-5 space-y-4">
      {/* Top Deck Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Master Deck Output
            </h4>
            <p className="text-[11px] text-slate-400">
              Karakter: <strong className="text-indigo-400">{voiceName}</strong> • Format: 24kHz WAV Studio Master
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Ambient BGM Mixer Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBgmMenu(!showBgmMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                bgmType !== 'none'
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>BGM: {bgmType === 'none' ? 'Tanpa Musik' : bgmType}</span>
            </button>

            {showBgmMenu && (
              <div className="absolute right-0 top-9 w-60 p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-20 space-y-3">
                <div className="text-xs font-semibold text-slate-200">Musik Latar Ambience:</div>
                <div className="space-y-1">
                  {[
                    { id: 'none', label: 'Tanpa Musik' },
                    { id: 'lofi', label: 'Lofi Chill Chords' },
                    { id: 'cinematic', label: 'Cinematic Ambient Pad' },
                    { id: 'nature', label: 'Suara Hujan & Alam' },
                  ].map((bgm) => (
                    <button
                      key={bgm.id}
                      onClick={() => {
                        setBgmType(bgm.id as any);
                        setShowBgmMenu(false);
                      }}
                      className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                        bgmType === bgm.id
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{bgm.label}</span>
                      {bgmType === bgm.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>

                {bgmType !== 'none' && (
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Volume Musik Latar:</span>
                      <span>{Math.round(bgmVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.4"
                      step="0.01"
                      value={bgmVolume}
                      onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 h-1 bg-slate-800 rounded"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Download Audio */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={!audioBase64}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
            title="Unduh File Audio WAV Kualitas Studio"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh WAV</span>
          </button>
        </div>
      </div>

      {/* Visualizer & Scrub Bar */}
      <div className="space-y-2">
        <div className="relative w-full h-14 bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={600}
            height={56}
            className="w-full h-full block"
          />
        </div>

        {/* Scrubber Progress Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            disabled={!audioBase64}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Main Controller Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReplay5}
            disabled={!audioBase64}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-50 transition-colors"
            title="Mundur 5 Detik"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            disabled={!audioBase64 || isGenerating}
            className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all scale-100 active:scale-95"
            title={isPlaying ? 'Pause' : 'Putar Audio'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleForward5}
            disabled={!audioBase64}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-50 transition-colors"
            title="Maju 5 Detik"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Multiplier Chips */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          {[0.75, 1.0, 1.25, 1.5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSpeedChange(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                speed === s
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

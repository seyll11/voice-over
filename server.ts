import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { shapeWavWithProfile, VoiceDspProfile } from './src/utils/dspVoiceShaper.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Enable CORS for all origins, methods, and headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

interface ServerVoiceMeta {
  geminiVoice: string;
  anchor: string;
  dsp: VoiceDspProfile;
}

const SERVER_VOICES: Record<string, ServerVoiceMeta> = {
  // Wanita
  Kore: {
    geminiVoice: 'Kore',
    anchor: 'Consistent warm firm mid-alto adult female narrator with steady breath control',
    dsp: { pitchRatio: 1.0, speedFactor: 1.0 },
  },
  Zephyr: {
    geminiVoice: 'Zephyr',
    anchor: 'Consistent bright articulate corporate adult female speaker with crisp diction',
    dsp: { pitchRatio: 1.05, speedFactor: 1.01, presenceBoostDb: 1.5 },
  },
  Leda: {
    geminiVoice: 'Leda',
    anchor: 'Consistent youthful lively young-adult female voice with bright energetic intonation',
    dsp: { pitchRatio: 1.13, speedFactor: 1.04, presenceBoostDb: 2.0 },
  },
  Despina: {
    geminiVoice: 'Despina',
    anchor: 'Consistent silky soft intimate female voice with calm gentle articulation',
    dsp: { pitchRatio: 1.02, speedFactor: 0.94, bassBoostDb: 1.0 },
  },
  Vindemiatrix: {
    geminiVoice: 'Vindemiatrix',
    anchor: 'Consistent mature gentle refined adult woman narrator with poised elegance',
    dsp: { pitchRatio: 0.94, speedFactor: 0.96, bassBoostDb: 2.0 },
  },

  // Pria / Laki-laki
  Fenrir: {
    geminiVoice: 'Fenrir',
    anchor: 'Consistent deep resonant authoritative adult male baritone voice with strong chest projection',
    dsp: { pitchRatio: 0.76, speedFactor: 0.98, bassBoostDb: 4.5 },
  },
  Charon: {
    geminiVoice: 'Charon',
    anchor: 'Consistent very low-register calm grounded adult male bass narrator with steady depth',
    dsp: { pitchRatio: 0.71, speedFactor: 0.94, bassBoostDb: 5.0 },
  },
  Orus: {
    geminiVoice: 'Orus',
    anchor: 'Consistent firm steady mid-low male executive news anchor with disciplined pacing',
    dsp: { pitchRatio: 0.82, speedFactor: 1.0, bassBoostDb: 2.5 },
  },
  Puck: {
    geminiVoice: 'Puck',
    anchor: 'Consistent upbeat lively energetic young adult male speaker with crisp punch',
    dsp: { pitchRatio: 0.88, speedFactor: 1.04, bassBoostDb: 1.5, presenceBoostDb: 1.5 },
  },
  Sulafat: {
    geminiVoice: 'Sulafat',
    anchor: 'Consistent warm friendly comforting adult male narrator with natural conversational smile',
    dsp: { pitchRatio: 0.84, speedFactor: 0.98, bassBoostDb: 2.5 },
  },
  Gacrux: {
    geminiVoice: 'Gacrux',
    anchor: 'Consistent elderly wise grandfatherly male storyteller with slow measured warm rasp',
    dsp: { pitchRatio: 0.77, speedFactor: 0.9, bassBoostDb: 3.5 },
  },

  // Anak-anak & Remaja
  Bimo: {
    geminiVoice: 'Puck',
    anchor: 'Consistent cheerful 8-year-old boy child voice with playful innocent enthusiasm',
    dsp: { pitchRatio: 1.38, speedFactor: 1.04, presenceBoostDb: 3.0, highPassHz: 110 },
  },
  Caca: {
    geminiVoice: 'Leda',
    anchor: 'Consistent sweet expressive 7-year-old little girl child voice with bright innocent tone',
    dsp: { pitchRatio: 1.46, speedFactor: 1.03, presenceBoostDb: 3.5, highPassHz: 120 },
  },
  Raka: {
    geminiVoice: 'Sadachbia',
    anchor: 'Consistent energetic teenage student male voice around 15 years old with lively rhythm',
    dsp: { pitchRatio: 1.15, speedFactor: 1.04, presenceBoostDb: 2.0 },
  },

  // Karakter Unik
  Tupai: {
    geminiVoice: 'Puck',
    anchor: 'Consistent playful comedic cartoon mascot voice with snappy animated energy',
    dsp: { pitchRatio: 1.62, speedFactor: 1.06, presenceBoostDb: 4.0, highPassHz: 140 },
  },
  RadioKlasik: {
    geminiVoice: 'Algenib',
    anchor: 'Consistent crisp retro 1980s male radio broadcaster with textured announcer cadence',
    dsp: { pitchRatio: 0.83, speedFactor: 1.0, bandpassRadio: true },
  },

  // Backward-compatible aliases for earlier saved presets
  Aoede: {
    geminiVoice: 'Aoede',
    anchor: 'Consistent breezy easygoing conversational female voice with relaxed warmth',
    dsp: { pitchRatio: 1.04, speedFactor: 1.0 },
  },
  Callirrhoe: {
    geminiVoice: 'Callirrhoe',
    anchor: 'Consistent smooth friendly female host with welcoming steady flow',
    dsp: { pitchRatio: 1.0, speedFactor: 0.98 },
  },
  Algenib: {
    geminiVoice: 'Algenib',
    anchor: 'Consistent gravelly textured mature male storyteller',
    dsp: { pitchRatio: 0.8, speedFactor: 0.96, bassBoostDb: 3.5 },
  },
  Achernar: {
    geminiVoice: 'Achernar',
    anchor: 'Consistent soft-spoken soothing calm female guide',
    dsp: { pitchRatio: 1.0, speedFactor: 0.92 },
  },
  Sadachbia: {
    geminiVoice: 'Sadachbia',
    anchor: 'Consistent lively enthusiastic male commentator',
    dsp: { pitchRatio: 0.9, speedFactor: 1.05, presenceBoostDb: 1.5 },
  },
};

const VALID_VOICE_NAMES = Object.keys(SERVER_VOICES);

// Stitch multiple 24kHz mono 16-bit WAV clips cleanly by stripping 44-byte RIFF headers after the first
function stitchWavBuffers(wavBuffers: Buffer[]): Buffer {
  if (wavBuffers.length === 1) return wavBuffers[0];
  const first = wavBuffers[0];
  if (first.length < 44) return Buffer.concat(wavBuffers);

  const pcmParts: Buffer[] = [first.subarray(44)];
  for (let i = 1; i < wavBuffers.length; i++) {
    const buf = wavBuffers[i];
    if (buf.length > 44) {
      pcmParts.push(buf.subarray(44));
    }
  }

  const totalPcm = Buffer.concat(pcmParts);
  const header = Buffer.from(first.subarray(0, 44));
  header.writeUInt32LE(36 + totalPcm.length, 4);
  header.writeUInt32LE(totalPcm.length, 40);
  return Buffer.concat([header, totalPcm]);
}

function splitTextIntoChunks(rawText: string, maxChars = 1400): string[] {
  const clean = rawText.trim();
  if (clean.length <= maxChars) return [clean];

  const sentences = clean.match(/[^.!?\n]+[.!?\n]*/g) || [clean];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length > maxChars && current.trim().length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = (current + ' ' + sentence).trim();
    }
  }
  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }
  return chunks;
}

const getGeminiClient = (apiVersion: 'v1alpha' | 'v1beta' = 'v1alpha', keyOverride?: string) => {
  const rawKey = keyOverride || process.env.GEMINI_API_KEY || '';
  const firstKey = rawKey.split(/[,;\n]+/).map((k) => k.trim()).filter(Boolean)[0];
  if (!firstKey) {
    throw new Error('GEMINI_API_KEY belum disetel. Silakan tambahkan di Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey: firstKey,
    httpOptions: {
      apiVersion,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const audioCache = new Map<string, { audioBase64: string; mimeType: string; model: string; voice: string }>();

async function runWithKeyRotation<T>(
  fn: (ai: GoogleGenAI, key: string, index: number) => Promise<T>,
  apiVersion: 'v1alpha' | 'v1beta' = 'v1alpha'
): Promise<T> {
  const raw = process.env.GEMINI_API_KEY || '';
  const keys = raw.split(/[,;\n]+/).map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    throw new Error('GEMINI_API_KEY belum disetel. Silakan tambahkan di Settings > Secrets.');
  }

  let lastError: any = null;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        apiVersion,
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });

    try {
      return await fn(ai, key, i);
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err || '');
      const isQuota =
        msg.includes('Quota exceeded') ||
        msg.includes('limit: 10') ||
        msg.includes('rate-limits') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('429');

      if (isQuota && i < keys.length - 1) {
        console.warn(`[Key Rotation] Kuota Key #${i + 1} habis. Beralih otomatis ke Key #${i + 2}...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/download-zip', (req: Request, res: Response) => {
  const zipPath = path.resolve(process.cwd(), 'suara-ai-voiceover.zip');
  res.download(zipPath, 'suara-ai-voiceover.zip', (err) => {
    if (err) {
      console.error('Error downloading zip:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Gagal mengunduh file zip proyek.' });
      }
    }
  });
});

app.get('/api/project-zip-base64', (req: Request, res: Response) => {
  try {
    const zipPath = path.resolve(process.cwd(), 'suara-ai-voiceover.zip');
    if (!fs.existsSync(zipPath)) {
      res.status(404).json({ error: 'File zip tidak ditemukan' });
      return;
    }
    const buffer = fs.readFileSync(zipPath);
    res.json({
      base64: buffer.toString('base64'),
      filename: 'suara-ai-voiceover.zip',
      size: buffer.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/project-files', (req: Request, res: Response) => {
  try {
    const baseDir = process.cwd();
    const filesToInclude = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'server.ts',
      'index.html',
      'metadata.json',
      'README.md',
      '.env.example',
      '.gitignore',
      'firebase-applet-config.json',
      'firebase-blueprint.json',
      'firestore.rules',
      'src/App.tsx',
      'src/main.tsx',
      'src/index.css',
      'src/types.ts',
      'src/firebase.ts',
      'src/contexts/AuthContext.tsx',
      'src/data/voices.ts',
      'src/services/voiceService.ts',
      'src/utils/audioPlayer.ts',
      'src/utils/dspVoiceShaper.ts',
      'src/utils/downloadProjectZip.ts',
      'src/components/AuthPage.tsx',
      'src/components/ErrorBoundary.tsx',
      'src/components/Navbar.tsx',
      'src/components/VoiceSelector.tsx',
      'src/components/StyleSelector.tsx',
      'src/components/ScriptEditor.tsx',
      'src/components/DialogueEditor.tsx',
      'src/components/AudioPlayerBar.tsx',
      'src/components/ScriptDoctorModal.tsx',
      'src/components/ScriptGeneratorModal.tsx',
      'src/components/HistoryDrawer.tsx',
      'src/components/HelpModal.tsx',
      'src/components/ExportModal.tsx',
    ];

    const result: Record<string, string> = {};
    for (const relPath of filesToInclude) {
      const fullPath = path.resolve(baseDir, relPath);
      if (fs.existsSync(fullPath)) {
        result[relPath] = fs.readFileSync(fullPath, 'utf8');
      }
    }

    res.json({ files: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Voice Over Generation Endpoint
app.post('/api/generate-voiceover', async (req: Request, res: Response) => {
  try {
    const {
      text,
      voice = 'Kore',
      style = 'Natural, clear and engaging narrator',
      mode = 'single',
      model: requestedModel = 'gemini-3.8-flash-lite-tts',
      dialogueParts,
    } = req.body;

    if (!text && (!dialogueParts || dialogueParts.length === 0)) {
      res.status(400).json({ error: 'Naskah teks wajib diisi.' });
      return;
    }

    const chosenVoiceId = SERVER_VOICES[voice] ? voice : 'Kore';
    const voiceMeta = SERVER_VOICES[chosenVoiceId];
    const chosenModel =
      requestedModel === 'gemini-3.8-flash-tts' ? 'gemini-3.8-flash-tts' : 'gemini-3.8-flash-lite-tts';

    const cacheKey =
      mode === 'single'
        ? `v2_${mode}_${chosenModel}_${chosenVoiceId}_${style}_${String(text || '').trim()}`
        : `v2_${mode}_${JSON.stringify(dialogueParts)}`;

    if (audioCache.has(cacheKey)) {
      console.log('[Audio Cache HIT] Melayani audio tersimpan tanpa membuang kuota.');
      res.json(audioCache.get(cacheKey));
      return;
    }

    if (mode === 'dialogue' && Array.isArray(dialogueParts) && dialogueParts.length >= 2) {
      const speaker1 = dialogueParts[0]?.speaker || 'Pembicara 1';
      const speaker2 = dialogueParts.find((p: any) => p.speaker !== speaker1)?.speaker || 'Pembicara 2';
      const voiceId1 = SERVER_VOICES[dialogueParts[0]?.voice] ? dialogueParts[0].voice : 'Puck';
      const voiceId2 = SERVER_VOICES[
        dialogueParts.find((p: any) => p.speaker === speaker2)?.voice
      ]
        ? dialogueParts.find((p: any) => p.speaker === speaker2).voice
        : 'Kore';

      const meta1 = SERVER_VOICES[voiceId1];
      const meta2 = SERVER_VOICES[voiceId2];

      const contentsParts = dialogueParts.map((part: { speaker: string; text: string; style?: string }) => {
        const meta = part.speaker === speaker1 ? meta1 : meta2;
        return {
          text: `${part.speaker}: ${part.text}`,
          speechMetadata: {
            speaker: part.speaker,
            style: `${meta.anchor}. ${part.style || 'Natural conversational tone'}`,
          },
        };
      });

      const output = await runWithKeyRotation(async (ai) => {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [
            {
              role: 'user',
              parts: contentsParts,
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                  {
                    speaker: speaker1,
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: meta1.geminiVoice },
                    },
                  },
                  {
                    speaker: speaker2,
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: meta2.geminiVoice },
                    },
                  },
                ],
              },
            },
          },
        });

        const audioPart = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (!audioPart || !audioPart.data) {
          throw new Error('Tidak ada data audio yang dihasilkan dari model.');
        }

        return {
          audioBase64: audioPart.data,
          mimeType: audioPart.mimeType || 'audio/wav',
          model: 'gemini-3.8-flash-tts',
          voice: `${voiceId1} & ${voiceId2}`,
        };
      }, 'v1alpha');

      audioCache.set(cacheKey, output);
      res.json(output);
      return;
    }

    // Single Speaker TTS: combine Gemini Voice Persona + WSOLA Pitch & Formant Shaper
    const anchoredStyle = `${voiceMeta.anchor}. Delivery style: ${
      String(style).trim() || 'Clear natural professional speaker'
    }. Maintain identical vocal timbre and pitch throughout.`;

    const rawCleanText = String(text).trim();
    const chunks = splitTextIntoChunks(rawCleanText, 1400).slice(0, 4);

    const wavBuffers: Buffer[] = [];
    let resolvedMime = 'audio/wav';

    for (const chunkText of chunks) {
      const chunkResult = await runWithKeyRotation(async (ai) => {
        const response = await ai.models.generateContent({
          model: chosenModel,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: chunkText,
                  speechMetadata: {
                    style: anchoredStyle,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceMeta.geminiVoice },
              },
            },
          },
        });

        const audioPart = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (!audioPart || !audioPart.data) {
          throw new Error('Tidak ada data audio yang diterima dari model.');
        }

        return {
          data: audioPart.data,
          mimeType: audioPart.mimeType || 'audio/wav',
        };
      }, 'v1alpha');

      resolvedMime = chunkResult.mimeType;
      wavBuffers.push(Buffer.from(chunkResult.data, 'base64'));
    }

    const stitchedWav = stitchWavBuffers(wavBuffers);
    // Apply WSOLA pitch/formant/EQ character shaping so Male, Female, Child, Elder, and Cartoon voices are unmistakably distinct!
    const shapedWav = shapeWavWithProfile(stitchedWav, voiceMeta.dsp);

    const output = {
      audioBase64: shapedWav.toString('base64'),
      mimeType: resolvedMime,
      model: chosenModel,
      voice: chosenVoiceId,
    };

    audioCache.set(cacheKey, output);
    res.json(output);
  } catch (error: any) {
    console.error('Error generating voiceover:', error);
    res.status(500).json({
      error: error.message || 'Gagal menghasilkan voice over.',
    });
  }
});

// Script Doctor / Enhancement Endpoint
app.post('/api/enhance-script', async (req: Request, res: Response) => {
  try {
    const { script, goal = 'enhance', targetLanguage = 'id' } = req.body;
    if (!script || !script.trim()) {
      res.status(400).json({ error: 'Naskah teks wajib diisi.' });
      return;
    }

    const ai = getGeminiClient('v1beta');

    const systemPrompt = `Anda adalah seorang Audio Director & Voice Over Script Doctor kelas dunia.
Tugas Anda adalah memoles dan mengoptimalkan naskah/skrip voice over agar terdengar sangat alami saat dibacakan, memiliki ritme, intonasi yang pas, tanda jeda narasi, dan petunjuk ekspresi vokal.

Tujuan optimasi yang dipilih pengguna: "${goal}".
Bahasa utama: "${targetLanguage === 'en' ? 'Inggris' : 'Indonesia'}".
Pilihan suara yang tersedia: ${VALID_VOICE_NAMES.join(', ')}.

Kembalikan respons murni JSON dengan format:
{
  "enhancedScript": "Naskah yang sudah dipoles rapi, enak dibaca dan natural untuk voice over",
  "ssmlOrCues": "Versi naskah dengan petunjuk vokal seperti <breath>, <laugh>, atau jeda [jeda 1 detik] jika diperlukan",
  "wordCount": 120,
  "estimatedDurationSeconds": 45,
  "recommendedVoice": "Kore",
  "recommendedStyle": "Deskripsi gaya bicara untuk prompt audio",
  "directorNotes": ["Catatan penting 1 mengenai penekanan kata", "Catatan 2 mengenai tempo"]
}`;

    const prompt = `Berikut naskah asli dari pengguna:
"""
${script}
"""

Tolong optimalkan naskah ini agar menjadi voice over yang memikat, natural, dan profesional sesuai tujuan "${goal}".`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });
    } catch {
      await new Promise((r) => setTimeout(r, 600));
      response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });
    }

    const rawText = response.text || '{}';
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = {
        enhancedScript: rawText,
        wordCount: script.split(/\s+/).length,
        estimatedDurationSeconds: Math.ceil(script.split(/\s+/).length / 2.5),
        recommendedVoice: 'Kore',
        recommendedStyle: 'Warm and natural',
        directorNotes: ['Naskah telah siap dibacakan.'],
      };
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error enhancing script:', error);
    res.status(500).json({
      error: error.message || 'Gagal memoles naskah.',
    });
  }
});

// Script Generation from Topic / Idea
app.post('/api/generate-script-idea', async (req: Request, res: Response) => {
  try {
    const { topic, category = 'commercial', durationSeconds = 30 } = req.body;
    if (!topic || !topic.trim()) {
      res.status(400).json({ error: 'Topik skrip wajib diisi.' });
      return;
    }

    const ai = getGeminiClient('v1beta');
    const targetWords = Math.round((Number(durationSeconds) || 30) * 2.3);

    const systemPrompt = `Anda adalah penulis skrip naskah Voice Over profesional.
Buat skrip voice over dalam Bahasa Indonesia (kecuali jika topik berbahasa Inggris) dengan durasi sekitar ${durationSeconds} detik (kurang lebih ${targetWords} kata).
Kategori: ${category} (commercial/iklan, storytelling/cerita, news/berita, tutorial/edukasi, podcast).
Pilihan suara yang tersedia: ${VALID_VOICE_NAMES.join(', ')}.

Format output JSON murni:
{
  "title": "Judul Skrip",
  "script": "Isi teks skrip voice over",
  "category": "${category}",
  "estimatedDurationSeconds": ${durationSeconds},
  "recommendedVoice": "Kore",
  "recommendedStyle": "Deskripsi nada dan emosi pembacaan",
  "keyHighlight": "Kalimat kunci penutup / call to action"
}`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Buatkan skrip voice over menarik tentang topik: "${topic}".`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });
    } catch {
      await new Promise((r) => setTimeout(r, 600));
      response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Buatkan skrip voice over menarik tentang topik: "${topic}".`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });
    }

    const rawText = response.text || '{}';
    const data = JSON.parse(rawText);
    res.json(data);
  } catch (error: any) {
    console.error('Error generating script idea:', error);
    res.status(500).json({
      error: error.message || 'Gagal membuat ide skrip.',
    });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SuaraAI Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

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

// Server-side Gemini client with User-Agent telemetry
const getGeminiClient = (apiVersion: 'v1alpha' | 'v1beta' = 'v1alpha') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum disetel. Silakan tambahkan di Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      apiVersion,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health and capability check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

import fs from 'fs';

// Download Project ZIP endpoint for VS Code transfer
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

// JSON Base64 ZIP endpoint to bypass iframe download restrictions
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

// Project source files endpoint for in-browser client JSZip packaging
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
      'src/App.tsx',
      'src/main.tsx',
      'src/index.css',
      'src/types.ts',
      'src/data/voices.ts',
      'src/services/voiceService.ts',
      'src/utils/audioPlayer.ts',
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
    const { text, voice = 'Kore', style = 'Natural, clear and engaging narrator', mode = 'single', dialogueParts } = req.body;

    if (!text && (!dialogueParts || dialogueParts.length === 0)) {
      res.status(400).json({ error: 'Naskah teks wajib diisi.' });
      return;
    }

    const ai = getGeminiClient();

    // Valid prebuilt voice names: Puck, Charon, Kore, Fenrir, Zephyr
    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const chosenVoice = validVoices.includes(voice) ? voice : 'Kore';

    if (mode === 'dialogue' && Array.isArray(dialogueParts) && dialogueParts.length >= 2) {
      // Dual-speaker dialogue with gemini-3.8-flash-tts
      const speaker1 = dialogueParts[0]?.speaker || 'Speaker1';
      const speaker2 = dialogueParts[1]?.speaker || 'Speaker2';
      const voice1 = validVoices.includes(dialogueParts[0]?.voice) ? dialogueParts[0].voice : 'Puck';
      const voice2 = validVoices.includes(dialogueParts[1]?.voice) ? dialogueParts[1].voice : 'Kore';

      const contentsParts = dialogueParts.map((part: { speaker: string; text: string; style?: string }) => ({
        text: `${part.speaker}: ${part.text}`,
        speechMetadata: {
          speaker: part.speaker,
          style: part.style || 'Natural conversational tone',
        },
      }));

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
                    prebuiltVoiceConfig: { voiceName: voice1 },
                  },
                },
                {
                  speaker: speaker2,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice2 },
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

      res.json({
        audioBase64: audioPart.data,
        mimeType: audioPart.mimeType || 'audio/wav',
        model: 'gemini-3.8-flash-tts',
        voice: `${voice1} & ${voice2}`,
      });
      return;
    }

    // Single Speaker TTS with gemini-3.8-flash-lite-tts
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: String(text).trim(),
              speechMetadata: {
                style: String(style).trim() || 'Clear, natural professional speaker',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!audioPart || !audioPart.data) {
      throw new Error('Tidak ada data audio yang diterima dari model.');
    }

    res.json({
      audioBase64: audioPart.data,
      mimeType: audioPart.mimeType || 'audio/wav',
      model: 'gemini-3.8-flash-lite-tts',
      voice: chosenVoice,
    });
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
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });
    } catch (apiErr: any) {
      // Retry once after 600ms
      await new Promise((r) => setTimeout(r, 600));
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
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
        model: 'gemini-3.8-flash',
        contents: `Buatkan skrip voice over menarik tentang topik: "${topic}".`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });
    } catch (apiErr: any) {
      await new Promise((r) => setTimeout(r, 600));
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
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

# SuaraAI - AI Voice Over Studio Pro

Aplikasi web studio voice over otomatis berbasis AI menggunakan model generasi audio Google Gemini (`gemini-3.8-flash-lite-tts` dan `gemini-3.8-flash-tts`). Mengubah naskah/skrip menjadi audio narasi alami, jernih, dan berkarakter (WAV 24kHz Studio Master).

---

## 🚀 Fitur Utama

- 🎙️ **5 Model Karakter Suara AI:**
  - `Kore` (Wanita: Hangat, Tenang, Ramah - Audiobook & Narasi)
  - `Puck` (Pria: Energetik, Ceria, Dinamis - Iklan TikTok/Reels)
  - `Fenrir` (Pria: Berat, Karismatik, Berwibawa - Berita & Trailer)
  - `Zephyr` (Wanita: Jelas, Artikulatif, Formal - Edukasi & Tutorial)
  - `Charon` (Pria: Dewasa, Elegan, Puitis - Meditasi & Sinematik)
- 🎭 **Preset Gaya & Emosi Narasi:** Alami, Iklan Ceria, Berita Formal, Sinematik, Meditasi, serta Kustom Prompt Pengarah Suara.
- 👥 **Mode Percakapan Dua Karakter (Dual-Speaker Podcast):** Mendukung dialog 2 pembicara dengan pembagian giliran dialog interaktif.
- 🩺 **AI Script Doctor:** Memoles tata bahasa, ritme, intonasi, serta menyisipkan petunjuk vokal seperti `<breath>`, `<laugh>`, dan jeda hening `...`.
- ✍️ **AI Script Generator:** Buat naskah otomatis hanya dengan mengetikkan ide/topik.
- 🎚️ **Master Deck Audio Player:** Dilengkapi visualisasi gelombang frekuensi real-time, pengatur tempo (0.75x - 1.5x), mixer musik latar (Lofi, Cinematic, Nature), dan unduh file WAV.

---

## 💻 Panduan Menjalankan di VS Code

### 1. Ekstrak File ZIP
Ekstrak file zip ini ke folder pilihan Anda di komputer, lalu buka folder tersebut menggunakan **Visual Studio Code** (`File` > `Open Folder...`).

### 2. Instalasi Dependensi
Buka Terminal di VS Code (`Ctrl + \`` atau `Terminal > New Terminal`), lalu jalankan:

```bash
npm install
```

### 3. Konfigurasi API Key Gemini
Buat file bernama `.env` di direktori utama (sejajar dengan `package.json`), lalu masukkan API Key Google Gemini Anda:

```env
GEMINI_API_KEY="MASUKKAN_API_KEY_GEMINI_ANDA_DI_SINI"
PORT=3000
```

> **Catatan:** Jika belum memiliki API Key, Anda bisa mendapatkannya secara gratis melalui [Google AI Studio](https://aistudio.google.com/).

### 4. Jalankan Aplikasi
Jalankan server pengembangan dengan perintah:

```bash
npm run dev
```

Buka browser Anda dan akses:
👉 `http://localhost:3000`

---

## 📁 Struktur Direktori

```text
├── .env.example              # Contoh konfigurasi environment
├── package.json              # Daftar dependensi dan scripts
├── server.ts                 # Backend Express & proxy API Gemini TTS
├── vite.config.ts            # Konfigurasi Vite & Tailwind CSS
├── tsconfig.json             # Konfigurasi TypeScript
├── index.html                # Entry point HTML
└── src/
    ├── main.tsx              # React mounting
    ├── App.tsx               # Komponen utama studio
    ├── index.css             # Konfigurasi Tailwind CSS & font
    ├── types.ts              # TypeScript interface & types
    ├── data/
    │   └── voices.ts         # Profil karakter suara & preset gaya
    ├── services/
    │   └── voiceService.ts   # Klien API TTS & browser fallback
    ├── utils/
    │   └── audioPlayer.ts    # Web Audio Engine, BGM synth, & visualizer
    └── components/
        ├── Navbar.tsx
        ├── VoiceSelector.tsx
        ├── StyleSelector.tsx
        ├── ScriptEditor.tsx
        ├── DialogueEditor.tsx
        ├── AudioPlayerBar.tsx
        ├── ScriptDoctorModal.tsx
        ├── ScriptGeneratorModal.tsx
        ├── HistoryDrawer.tsx
        └── HelpModal.tsx
```

---

## 🛠️ Lisensi & Hak Cipta
Dibuat dengan bantuan Google AI Studio & Google Gemini API.

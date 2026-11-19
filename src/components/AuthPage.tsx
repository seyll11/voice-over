import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Mic,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Waves,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, enterGuestMode } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const mapAuthError = (err: any): string => {
    const code = err?.code || '';
    const msg = String(err?.message || '');

    if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
      return 'Login Email & Kata Sandi belum diaktifkan di Firebase Console proyek ini. Silakan klik tombol "Masuk dengan Google" di bawah (langsung aktif), atau aktifkan provider Email/Password di Firebase Console > Authentication > Sign-in method.';
    }
    if (code === 'auth/unauthorized-domain') {
      return `Domain "${window.location.hostname}" belum diizinkan oleh Firebase Authentication. Tambahkan domain ini di Firebase Console > Authentication > Settings > Authorized domains, lalu muat ulang halaman.`;
    }
    if (code === 'auth/email-already-in-use') {
      return 'Email ini sudah terdaftar. Silakan pindah ke tab "Masuk" untuk login.';
    }
    if (code === 'auth/invalid-email') {
      return 'Format alamat email tidak valid.';
    }
    if (code === 'auth/weak-password') {
      return 'Kata sandi minimal harus terdiri dari 6 karakter.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Email atau kata sandi salah. Periksa kembali data Anda.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Jendela login Google ditutup sebelum proses selesai.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat lalu coba lagi.';
    }
    return msg || 'Terjadi kesalahan saat memproses akun Anda.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }

    if (tab === 'register') {
      if (!name.trim()) {
        setError('Nama lengkap wajib diisi untuk mendaftar.');
        return;
      }
      if (password.length < 6) {
        setError('Kata sandi minimal 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Konfirmasi kata sandi tidak cocok.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (tab === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(name, email, password);
        setInfoMessage('Akun berhasil dibuat! Silakan cek kotak masuk email Anda untuk verifikasi.');
      }
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* Left Brand & Studio Value Column */}
      <div className="lg:w-5/12 xl:w-1/2 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 p-8 sm:p-12 lg:p-16 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">SuaraAI Studio</span>
              <p className="text-xs text-slate-400">Studio Narasi & Voice Over AI</p>
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight text-balance">
              Buat Voice Over Profesional dengan Karakter Suara Konsisten
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Masuk ke akun studio Anda untuk menyimpan pengaturan kunci suara favorit, mengakses 16 karakter suara AI pria dan wanita yang berbeda, serta menyinkronkan proyek narasi Anda.
            </p>
          </div>

          <div className="space-y-4 pt-2 max-w-md">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <Waves className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">16 Karakter Suara Beragam</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pilihan suara wanita dan pria mulai dari nada ceria iklan, berita formal, hingga dokumenter berat berwibawa.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Kunci Konsistensi Suara (Voice Lock)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Kunci karakter suara dan gaya bicara Anda agar tidak berubah-ubah saat membuat naskah atau mengganti template.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 pt-8 hidden lg:block">
          SuaraAI Studio · Audio Master 24kHz WAV
        </p>
      </div>

      {/* Right Authentication Form Column */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          {/* Segmented Mode Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                tab === 'login'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                tab === 'register'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Buat Akun Baru
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">
                {tab === 'login' ? 'Selamat Datang Kembali' : 'Daftarkan Akun Studio'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {tab === 'login'
                  ? 'Masuk untuk mengakses studio suara dan preset tersimpan Anda.'
                  : 'Buat akun gratis untuk menyimpan preset dan kunci konsistensi suara.'}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{infoMessage}</span>
              </div>
            )}

            {/* Instant Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 transition-colors disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>Masuk Instan dengan Google</span>
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-800" />
              <span className="shrink-0 px-3 text-xs text-slate-500">atau gunakan email</span>
              <div className="flex-grow border-t border-slate-800" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'register' && (
                <div className="space-y-1.5">
                  <label htmlFor="auth-name" className="block text-xs font-medium text-slate-300">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Waldo Siahaan"
                      maxLength={80}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="auth-email" className="block text-xs font-medium text-slate-300">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="auth-password" className="block text-xs font-medium text-slate-300">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {tab === 'register' && (
                <div className="space-y-1.5">
                  <label htmlFor="auth-confirm" className="block text-xs font-medium text-slate-300">
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-confirm"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <span>
                  {isSubmitting
                    ? 'Memproses...'
                    : tab === 'login'
                    ? 'Masuk ke Studio'
                    : 'Buat Akun Sekarang'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={enterGuestMode}
              className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 transition-colors"
            >
              Atau lanjutkan sementara tanpa akun (Mode Tamu)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

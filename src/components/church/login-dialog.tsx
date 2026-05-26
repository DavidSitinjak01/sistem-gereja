'use client';

import { useState, useEffect } from 'react';
import { Cross, Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth';

export default function LoginDialog() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [churchName, setChurchName] = useState('Sistem Gereja');
  const [churchLogo, setChurchLogo] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);

  // Load church branding on mount
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const res = await fetch('/api/settings?includeLogo=true');
        if (!res.ok) return;
        const data = await res.json();
        if (data.churchName) {
          setChurchName(data.churchName);
          document.title = data.churchName;
        }
        if (data.logo) {
          setChurchLogo(data.logo);
          // Update favicon on login page too
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (link) link.href = data.logo;
          const appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
          if (appleLink) appleLink.href = data.logo;
        }
      } catch {
        // Ignore
      }
    };
    loadBranding();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login gagal');
        return;
      }

      login({
        id: data.id,
        name: data.name,
        username: data.username,
        role: data.role,
        servantNo: data.servantNo,
      });
    } catch {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  // Logo component
  const LoginLogo = ({ size }: { size: 'sm' | 'lg' }) => {
    const sizeClasses = size === 'lg' ? 'w-16 h-16' : 'w-9 h-9';

    if (churchLogo) {
      return (
        <img
          src={churchLogo}
          alt={churchName}
          className={`${sizeClasses} rounded-2xl object-contain`}
        />
      );
    }

    return (
      <div className={`${sizeClasses} rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center ${size === 'lg' ? 'shadow-lg' : 'shadow-sm'}`}>
        <Cross className={size === 'lg' ? 'h-8 w-8' : 'h-5 w-5'} style={{ color: 'white' }} />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center h-14 px-4 gap-3">
          <LoginLogo size="sm" />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-amber-900 leading-tight">{churchName}</h1>
            <p className="text-[10px] sm:text-xs text-amber-600 leading-tight">Manajemen Gereja Digital</p>
          </div>
        </div>
      </header>

      {/* Login Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-amber-100 p-8">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4">
                <LoginLogo size="lg" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Selamat Datang</h2>
              <p className="text-sm text-gray-500 mt-1">Silakan masuk untuk melanjutkan</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="mt-1.5"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white h-11 text-base font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" /> Masuk
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 text-center">
                Default login: <span className="font-mono font-bold">admin</span> / <span className="font-mono font-bold">admin123</span>
              </p>
              <p className="text-[10px] text-amber-500 text-center mt-1">
                Segera ubah password setelah login pertama
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 mt-auto">
        <div className="px-4 py-3 text-center text-xs text-gray-400">
          &copy; 2026 {churchName} &mdash; Dibuat dengan &#10084; untuk pelayanan
        </div>
      </footer>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Church } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import LoginDialog from '@/components/church/login-dialog';

const ChurchApp = dynamic(() => import('@/components/church/church-app'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center h-14 px-3 sm:px-4 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-sm">
              <Church className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-purple-900 leading-tight">Sistem Gereja</h1>
              <p className="text-[10px] sm:text-xs text-purple-600 leading-tight hidden sm:block">Manajemen Gereja Digital</p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Memuat aplikasi...</p>
        </div>
      </main>
      <footer className="border-t bg-white mt-auto">
        <div className="px-4 py-3 text-center text-xs text-gray-400">
          &copy; 2026 Sistem Gereja
        </div>
      </footer>
    </div>
  ),
});

export default function ClientPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const hydrate = useAuthStore((s) => s.hydrate);

  // Hydrate auth state from localStorage on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Load church settings for dynamic title & favicon — runs on EVERY page load
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const res = await fetch('/api/settings?includeLogo=true');
        if (!res.ok) return;
        const data = await res.json();

        // Update page title
        if (data.churchName) {
          document.title = data.churchName;
        }

        // Force favicon refresh by removing ALL existing favicon links
        // and creating new ones with a NEW URL path + cache-busting
        // This is the only reliable way to force browsers to refresh favicons
        const faviconUrl = `/api/church-favicon?t=${Date.now()}`;

        // Remove ALL existing icon links
        const existingIcons = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
        existingIcons.forEach(el => el.remove());

        // Create new icon link (rel="icon")
        const newIcon = document.createElement('link');
        newIcon.rel = 'icon';
        newIcon.type = 'image/png';
        newIcon.href = faviconUrl;
        document.head.appendChild(newIcon);

        // Create new apple-touch-icon link
        const newAppleIcon = document.createElement('link');
        newAppleIcon.rel = 'apple-touch-icon';
        newAppleIcon.href = faviconUrl;
        document.head.appendChild(newAppleIcon);

        // Also create a shortcut icon (some browsers prefer this)
        const newShortcut = document.createElement('link');
        newShortcut.rel = 'shortcut icon';
        newShortcut.type = 'image/png';
        newShortcut.href = faviconUrl;
        document.head.appendChild(newShortcut);
      } catch {
        // Ignore branding errors
      }
    };

    loadBranding();
  }, [isAuthenticated]);

  // While hydrating auth state, show loading spinner — NOT the login page
  if (isHydrating) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-violet-50">
        <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="flex items-center h-14 px-4 gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-sm">
              <Church className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-purple-900 leading-tight">GKKD Tamariska</h1>
              <p className="text-[10px] sm:text-xs text-purple-600 leading-tight hidden sm:block">Manajemen Gereja Digital</p>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Memuat sesi...</p>
          </div>
        </main>
        <footer className="border-t bg-white/80 mt-auto">
          <div className="px-4 py-3 text-center text-xs text-gray-400">
            &copy; 2026 GKKD Tamariska &mdash; Dibuat dengan &#10084; untuk pelayanan
          </div>
        </footer>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginDialog />;
  }

  return <ChurchApp />;
}

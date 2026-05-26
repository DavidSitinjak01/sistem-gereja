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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-sm">
              <Church className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-amber-900 leading-tight">Sistem Gereja</h1>
              <p className="text-[10px] sm:text-xs text-amber-600 leading-tight hidden sm:block">Manajemen Gereja Digital</p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
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

  // Clean up any stale persisted auth data from previous version
  useEffect(() => {
    try {
      localStorage.removeItem('church-auth');
    } catch {
      // Ignore
    }
  }, []);

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

        // Update favicon with cache-busting timestamp
        // Always use a unique timestamp to force browser to re-fetch
        const cacheBuster = `?t=${Date.now()}`;
        const faviconUrl = `/api/favicon${cacheBuster}`;

        const iconLinks = document.querySelectorAll("link[rel*='icon']") as NodeListOf<HTMLLinkElement>;
        iconLinks.forEach(link => {
          link.href = faviconUrl;
        });

        const appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
        if (appleLink) {
          appleLink.href = faviconUrl;
        }
      } catch {
        // Ignore branding errors
      }
    };

    loadBranding();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginDialog />;
  }

  return <ChurchApp />;
}

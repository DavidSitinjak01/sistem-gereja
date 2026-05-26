'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth';
import LoginDialog from '@/components/church/login-dialog';

const ChurchApp = dynamic(() => import('@/components/church/church-app'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-violet-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Memuat aplikasi...</p>
      </div>
    </div>
  ),
});

export default function ClientPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Register service worker for PWA installability
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed — PWA install won't be available
      });
    }
  }, []);

  // Load church settings for dynamic title & favicon
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

        // Force favicon refresh with cache-busting
        const t = Date.now();
        const faviconUrl = `/api/church-favicon?size=32&t=${t}`;
        const appleIconUrl = `/api/church-icon/192?t=${t}`;

        // Remove ALL existing icon links
        const existingIcons = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
        existingIcons.forEach(el => el.remove());

        // Create new icon links
        const newIcon = document.createElement('link');
        newIcon.rel = 'icon';
        newIcon.type = 'image/png';
        newIcon.href = faviconUrl;
        document.head.appendChild(newIcon);

        const newAppleIcon = document.createElement('link');
        newAppleIcon.rel = 'apple-touch-icon';
        newAppleIcon.href = appleIconUrl;
        document.head.appendChild(newAppleIcon);

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

  if (!isAuthenticated) {
    return <LoginDialog />;
  }

  return <ChurchApp />;
}

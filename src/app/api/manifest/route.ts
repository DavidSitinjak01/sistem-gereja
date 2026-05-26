import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/manifest — Dynamic PWA manifest
export async function GET() {
  try {
    const settings = await db.churchSetting.findUnique({
      where: { id: 'default' },
      select: { churchName: true },
    });

    const appName = settings?.churchName || 'Sistem Gereja';

    const manifest = {
      name: appName,
      short_name: appName,
      description: `Sistem manajemen ${appName}`,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#b45309',
      orientation: 'any',
      icons: [
        {
          src: '/api/favicon',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/api/favicon',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[MANIFEST]', error);
    // Fallback manifest
    const manifest = {
      name: 'Sistem Gereja',
      short_name: 'Sistem Gereja',
      description: 'Sistem manajemen gereja digital',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#b45309',
      icons: [
        {
          src: '/api/favicon',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }
}

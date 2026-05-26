import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';

// GET /api/manifest — Dynamic PWA manifest using church logo as icon
export async function GET() {
  try {
    await ensureDbSetup();

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
      theme_color: '#7c3aed',
      orientation: 'any',
      icons: [
        {
          src: '/api/church-icon/192',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/api/church-icon/512',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
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
      theme_color: '#7c3aed',
      icons: [
        {
          src: '/api/church-icon/192',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/api/church-icon/512',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
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

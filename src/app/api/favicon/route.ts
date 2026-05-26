import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';
import sharp from 'sharp';

// GET /api/favicon — Dynamic favicon from church logo (properly resized)
// Uses no-store to prevent aggressive browser caching of favicons
export async function GET(request: NextRequest) {
  try {
    await ensureDbSetup();

    const settings = await db.churchSetting.findUnique({
      where: { id: 'default' },
      select: { logo: true, updatedAt: true },
    });

    // ETag based on updatedAt timestamp for cache validation
    const etag = settings?.updatedAt
      ? `"fav-${settings.updatedAt.getTime()}"`
      : '"fav-default"';

    // Check If-None-Match for 304 response
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    // Cache headers: no-store to prevent browser favicon caching issues
    // Browsers are notoriously aggressive about caching favicons
    const cacheHeaders = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': etag,
    };

    if (settings?.logo) {
      // Extract the base64 data and content type
      const matches = settings.logo.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // Resize to proper favicon size (32x32) using sharp
        try {
          const resizedBuffer = await sharp(buffer)
            .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();

          return new NextResponse(resizedBuffer, {
            headers: {
              'Content-Type': 'image/png',
              ...cacheHeaders,
            },
          });
        } catch {
          // If sharp fails, return original image
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'image/png',
              ...cacheHeaders,
            },
          });
        }
      }
    }

    // Fallback: return a simple SVG cross icon
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#b45309"/>
      <path d="M50 20 L50 80 M30 50 L70 50" stroke="white" stroke-width="12" stroke-linecap="round"/>
    </svg>`;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        ...cacheHeaders,
      },
    });
  } catch (error) {
    console.error('[FAVICON]', error);
    // Return fallback on error
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#b45309"/>
      <path d="M50 20 L50 80 M30 50 L70 50" stroke="white" stroke-width="12" stroke-linecap="round"/>
    </svg>`;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

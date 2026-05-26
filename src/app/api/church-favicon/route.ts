import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';
import sharp from 'sharp';

// GET /api/church-favicon — Dynamic favicon from church logo
// Uses a different URL path than the old /api/favicon to bypass browser cache
export async function GET(request: NextRequest) {
  try {
    await ensureDbSetup();

    const settings = await db.churchSetting.findUnique({
      where: { id: 'default' },
      select: { logo: true, updatedAt: true },
    });

    // ETag based on updatedAt timestamp
    const etag = settings?.updatedAt
      ? `"cf-${settings.updatedAt.getTime()}"`
      : '"cf-default"';

    // Check If-None-Match for 304 response
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    // No-store headers to prevent aggressive browser favicon caching
    const noCacheHeaders = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': etag,
      'Vary': '*',
    };

    if (settings?.logo) {
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
              ...noCacheHeaders,
            },
          });
        } catch {
          // If sharp fails, return original image
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'image/png',
              ...noCacheHeaders,
            },
          });
        }
      }
    }

    // Fallback: SVG cross icon
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#b45309"/>
      <path d="M50 20 L50 80 M30 50 L70 50" stroke="white" stroke-width="12" stroke-linecap="round"/>
    </svg>`;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        ...noCacheHeaders,
      },
    });
  } catch (error) {
    console.error('[CHURCH_FAVICON]', error);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#b45309"/>
      <path d="M50 20 L50 80 M30 50 L70 50" stroke="white" stroke-width="12" stroke-linecap="round"/>
    </svg>`;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

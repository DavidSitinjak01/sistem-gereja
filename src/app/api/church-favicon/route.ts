import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';
import sharp from 'sharp';

// GET /api/church-favicon — Dynamic favicon/icon from church logo
// Supports ?size= parameter: 32 (default, favicon), 192, 512 (PWA)
export async function GET(request: NextRequest) {
  try {
    await ensureDbSetup();

    const settings = await db.churchSetting.findUnique({
      where: { id: 'default' },
      select: { logo: true, updatedAt: true },
    });

    // Determine requested size
    const sizeParam = request.nextUrl.searchParams.get('size');
    const size = sizeParam ? parseInt(sizeParam, 10) : 32;
    const validSize = [32, 192, 512].includes(size) ? size : 32;

    // ETag based on updatedAt timestamp + size
    const etag = settings?.updatedAt
      ? `"cf-${settings.updatedAt.getTime()}-${validSize}"`
      : `"cf-default-${validSize}"`;

    // Check If-None-Match for 304 response
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    // Cache headers — short cache for dynamic icons
    const cacheHeaders = {
      'Cache-Control': validSize === 32
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=3600, s-maxage=3600',
      'ETag': etag,
      'Vary': '*',
    };

    if (settings?.logo) {
      const matches = settings.logo.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        try {
          const resizedBuffer = await sharp(buffer)
            .resize(validSize, validSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
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
              'Content-Type': matches[1] || 'image/png',
              ...cacheHeaders,
            },
          });
        }
      }
    }

    // Fallback: SVG cross icon scaled to requested size
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#7c3aed"/>
      <path d="M50 20 L50 80 M30 50 L70 50" stroke="white" stroke-width="12" stroke-linecap="round"/>
    </svg>`;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        ...cacheHeaders,
      },
    });
  } catch (error) {
    console.error('[CHURCH_FAVICON]', error);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#7c3aed"/>
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

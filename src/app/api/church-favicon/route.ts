import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';
import sharp from 'sharp';

// Pre-built fallback PNG icons (purple square with white cross)
function getFallbackPng(size: number): Buffer {
  // Create a simple PNG programmatically using sharp
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#7c3aed"/>
    <path d="M${size*0.5} ${size*0.2} L${size*0.5} ${size*0.8} M${size*0.3} ${size*0.5} L${size*0.7} ${size*0.5}" stroke="white" stroke-width="${Math.round(size*0.12)}" stroke-linecap="round"/>
  </svg>`;

  return Buffer.from(svg);
}

// GET /api/church-favicon — Dynamic favicon/icon from church logo
// Path-based size: /api/church-favicon/192 or /api/church-favicon/512
// Query-based size: ?size=192
export async function GET(request: NextRequest) {
  // Determine size from path or query
  const url = request.nextUrl;
  const pathParts = url.pathname.split('/').filter(Boolean);
  const pathSize = pathParts.length > 2 ? parseInt(pathParts[2], 10) : 0;
  const querySize = url.searchParams.get('size');
  const rawSize = pathSize || (querySize ? parseInt(querySize, 10) : 32);
  const validSize = [32, 192, 512].includes(rawSize) ? rawSize : 32;

  try {
    await ensureDbSetup();

    const settings = await db.churchSetting.findUnique({
      where: { id: 'default' },
      select: { logo: true, updatedAt: true },
    });

    // ETag based on updatedAt timestamp + size
    const etag = settings?.updatedAt
      ? `"cf-${settings.updatedAt.getTime()}-${validSize}"`
      : `"cf-default-${validSize}"`;

    // Check If-None-Match for 304 response
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    // Cache headers
    const cacheHeaders = {
      'Cache-Control': validSize === 32
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=3600, s-maxage=3600',
      'ETag': etag,
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
          // If sharp resize fails, return original image
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'image/png',
              ...cacheHeaders,
            },
          });
        }
      }
    }

    // Fallback: Generate PNG icon using sharp from SVG
    try {
      const fallbackSvg = getFallbackPng(validSize);
      const fallbackBuffer = await sharp(fallbackSvg)
        .resize(validSize, validSize)
        .png()
        .toBuffer();

      return new NextResponse(fallbackBuffer, {
        headers: {
          'Content-Type': 'image/png',
          ...cacheHeaders,
        },
      });
    } catch {
      // Last resort: return SVG
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
    }
  } catch (error) {
    console.error('[CHURCH_FAVICON]', error);

    // Fallback: Generate PNG icon
    try {
      const fallbackSvg = getFallbackPng(validSize);
      const fallbackBuffer = await sharp(fallbackSvg)
        .resize(validSize, validSize)
        .png()
        .toBuffer();

      return new NextResponse(fallbackBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=60',
        },
      });
    } catch {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#7c3aed"/>
        <path d="M50 20 L50 80 M30 50 L70 50" stroke="white" stroke-width="12" stroke-linecap="round"/>
      </svg>`;

      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache',
        },
      });
    }
  }
}

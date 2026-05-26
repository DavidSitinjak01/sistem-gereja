import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';
import sharp from 'sharp';

// GET /api/favicon — Dynamic favicon from church logo (properly resized)
export async function GET(request: NextRequest) {
  try {
    await ensureDbSetup();

    const settings = await db.churchSetting.findUnique({
      where: { id: 'default' },
      select: { logo: true, updatedAt: true },
    });

    // Check if client sends If-None-Match (cache validation)
    const ifNoneMatch = request.headers.get('if-none-match');
    const etag = settings?.updatedAt
      ? `"favicon-${settings.updatedAt.getTime()}"`
      : '"favicon-default"';

    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

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
              'Cache-Control': 'public, max-age=300, must-revalidate',
              'ETag': etag,
            },
          });
        } catch {
          // If sharp fails, return original image
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=300, must-revalidate',
              'ETag': etag,
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
        'Cache-Control': 'public, max-age=300, must-revalidate',
        'ETag': '"favicon-default"',
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
        'Cache-Control': 'public, max-age=60',
      },
    });
  }
}

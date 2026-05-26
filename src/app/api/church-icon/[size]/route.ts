import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';
import sharp from 'sharp';

// GET /api/church-icon/[size] — PWA icon with path-based size
// Used by manifest for reliable icon URLs without query params
// Supports: /api/church-icon/192, /api/church-icon/512

function getFallbackSvg(size: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#7c3aed"/>
    <path d="M${size*0.5} ${size*0.2} L${size*0.5} ${size*0.8} M${size*0.3} ${size*0.5} L${size*0.7} ${size*0.5}" stroke="white" stroke-width="${Math.round(size*0.12)}" stroke-linecap="round"/>
  </svg>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeStr } = await params;
  const size = parseInt(sizeStr, 10);
  const validSize = [192, 512].includes(size) ? size : 192;

  try {
    await ensureDbSetup();

    const settings = await db.churchSetting.findUnique({
      where: { id: 'default' },
      select: { logo: true, updatedAt: true },
    });

    const etag = settings?.updatedAt
      ? `"ci-${settings.updatedAt.getTime()}-${validSize}"`
      : `"ci-default-${validSize}"`;

    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    const headers = {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'ETag': etag,
    };

    // If church has a logo, resize it
    if (settings?.logo) {
      const matches = settings.logo.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const buffer = Buffer.from(matches[2], 'base64');
        try {
          const resized = await sharp(buffer)
            .resize(validSize, validSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();

          return new NextResponse(resized, { headers });
        } catch {
          // sharp failed, return original
          return new NextResponse(buffer, { headers });
        }
      }
    }

    // Fallback: generate PNG from SVG
    const svg = getFallbackSvg(validSize);
    try {
      const png = await sharp(Buffer.from(svg))
        .resize(validSize, validSize)
        .png()
        .toBuffer();
      return new NextResponse(png, { headers });
    } catch {
      return new NextResponse(svg, {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=60' },
      });
    }
  } catch {
    // Database error — return fallback PNG
    const svg = getFallbackSvg(validSize);
    try {
      const png = await sharp(Buffer.from(svg))
        .resize(validSize, validSize)
        .png()
        .toBuffer();
      return new NextResponse(png, {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=60' },
      });
    } catch {
      return new NextResponse(svg, {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=60' },
      });
    }
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/favicon — Dynamic favicon from church logo
export async function GET() {
  try {
    const settings = await db.churchSetting.findUnique({
      where: { id: 'default' },
      select: { logo: true },
    });

    if (settings?.logo) {
      // Extract the base64 data and content type
      const matches = settings.logo.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
          },
        });
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
        'Cache-Control': 'public, max-age=3600',
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

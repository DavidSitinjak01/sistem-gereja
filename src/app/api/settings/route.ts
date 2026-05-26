import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/settings - Get church settings (without logo for performance)
export async function GET(request: NextRequest) {
  try {
    let settings = await db.churchSetting.findUnique({
      where: { id: 'default' },
    });

    // Create default settings if not exist
    if (!settings) {
      settings = await db.churchSetting.create({
        data: { id: 'default' },
      });
    }

    // Check if client wants logo included (for favicon/manifest)
    const includeLogo = request.nextUrl.searchParams.get('includeLogo') === 'true';

    if (!includeLogo && settings.logo) {
      // Return without logo data for normal requests (save bandwidth)
      const { logo, ...rest } = settings;
      return NextResponse.json({ ...rest, hasLogo: true });
    }

    return NextResponse.json({
      ...settings,
      hasLogo: !!settings.logo,
    });
  } catch (error) {
    console.error('[SETTINGS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings.' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update church settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { churchName, logo, province, regency, district, village, pastor, treasurer, secretary } = body as {
      churchName?: string;
      logo?: string;
      province?: string;
      regency?: string;
      district?: string;
      village?: string;
      pastor?: string;
      treasurer?: string;
      secretary?: string;
    };

    // Validate logo size (max 2MB base64)
    if (logo && logo.length > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Logo terlalu besar. Maksimal 2MB.' },
        { status: 400 }
      );
    }

    // Upsert: create if not exists, update if exists
    const settings = await db.churchSetting.upsert({
      where: { id: 'default' },
      update: {
        ...(churchName !== undefined && { churchName }),
        ...(logo !== undefined && { logo: logo || null }),
        ...(province !== undefined && { province: province || null }),
        ...(regency !== undefined && { regency: regency || null }),
        ...(district !== undefined && { district: district || null }),
        ...(village !== undefined && { village: village || null }),
        ...(pastor !== undefined && { pastor: pastor || null }),
        ...(treasurer !== undefined && { treasurer: treasurer || null }),
        ...(secretary !== undefined && { secretary: secretary || null }),
      },
      create: {
        id: 'default',
        churchName: churchName || 'Gereja',
        logo: logo || null,
        province: province || null,
        regency: regency || null,
        district: district || null,
        village: village || null,
        pastor: pastor || null,
        treasurer: treasurer || null,
        secretary: secretary || null,
      },
    });

    return NextResponse.json({
      ...settings,
      hasLogo: !!settings.logo,
    });
  } catch (error) {
    console.error('[SETTINGS_PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update settings.' },
      { status: 500 }
    );
  }
}

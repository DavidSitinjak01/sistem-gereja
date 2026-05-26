import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/settings - Get church settings
export async function GET() {
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

    return NextResponse.json(settings);
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
    const { churchName, province, regency, district, village, pastor, treasurer, secretary } = body as {
      churchName?: string;
      province?: string;
      regency?: string;
      district?: string;
      village?: string;
      pastor?: string;
      treasurer?: string;
      secretary?: string;
    };

    // Upsert: create if not exists, update if exists
    const settings = await db.churchSetting.upsert({
      where: { id: 'default' },
      update: {
        ...(churchName !== undefined && { churchName }),
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
        province: province || null,
        regency: regency || null,
        district: district || null,
        village: village || null,
        pastor: pastor || null,
        treasurer: treasurer || null,
        secretary: secretary || null,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('[SETTINGS_PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update settings.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash, randomBytes } from 'crypto';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

export async function GET() {
  try {
    const results: string[] = [];

    // 1. Ensure ChurchSetting exists
    try {
      const existingSetting = await db.churchSetting.findUnique({
        where: { id: 'default' },
      });

      if (!existingSetting) {
        await db.churchSetting.create({
          data: {
            id: 'default',
            churchName: 'Gereja',
          },
        });
        results.push('✅ ChurchSetting created');
      } else {
        results.push('⏭️ ChurchSetting already exists');
      }
    } catch (e) {
      results.push(`⚠️ ChurchSetting: ${e instanceof Error ? e.message.substring(0, 200) : 'error'}`);
    }

    // 2. Ensure Admin user exists
    try {
      const existingAdmin = await db.user.findUnique({
        where: { username: 'admin' },
      });

      if (!existingAdmin) {
        await db.user.create({
          data: {
            name: 'Administrator',
            username: 'admin',
            password: hashPassword('admin123'),
            role: 'ADMIN',
            active: true,
          },
        });
        results.push('✅ Admin user created');
      } else {
        results.push('⏭️ Admin user already exists');
      }
    } catch (e) {
      results.push(`⚠️ Admin user: ${e instanceof Error ? e.message.substring(0, 200) : 'error'}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Setup complete!',
      details: results,
      login: {
        username: 'admin',
        password: 'admin123',
        note: 'Please change the password after first login!',
      },
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Setup failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

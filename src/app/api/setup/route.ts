import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash, randomBytes } from 'crypto';
import { execSync } from 'child_process';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

export async function GET() {
  try {
    const results: string[] = [];

    // 1. Push schema to database (create tables if not exist)
    try {
      execSync('npx prisma db push --skip-generate --accept-data-loss', {
        stdio: 'pipe',
        timeout: 60000,
        env: {
          ...process.env,
          NODE_ENV: 'production',
        },
      });
      results.push('✅ Database schema pushed successfully');
    } catch (schemaError) {
      const errMsg = schemaError instanceof Error ? schemaError.message : 'Unknown error';
      // If tables already exist, prisma db push might still report success
      if (errMsg.includes('already exists') || errMsg.includes('no changes')) {
        results.push('⏭️ Database schema already up to date');
      } else {
        results.push(`⚠️ Schema push warning: ${errMsg.substring(0, 200)}`);
      }
    }

    // 2. Ensure ChurchSetting exists
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
      results.push(`⚠️ ChurchSetting: ${e instanceof Error ? e.message.substring(0, 100) : 'error'}`);
    }

    // 3. Ensure Admin user exists
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
      results.push(`⚠️ Admin user: ${e instanceof Error ? e.message.substring(0, 100) : 'error'}`);
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

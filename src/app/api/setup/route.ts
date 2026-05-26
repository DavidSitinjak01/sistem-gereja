import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

// Create tables using raw SQL (works with any PostgreSQL)
const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS "Member" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "gender" TEXT,
  "occupation" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "maritalStatus" TEXT,
  "membershipStatus" TEXT NOT NULL DEFAULT 'AKTIF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Service" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "dayOfWeek" TEXT,
  "time" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ChurchEvent" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "location" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Finance" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "description" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Attendance" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "serviceId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "memberCount" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Song" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "artist" TEXT,
  "category" TEXT,
  "lyrics" TEXT,
  "chord" TEXT,
  "songNumber" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "WeeklySong" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "songId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "weekDate" TIMESTAMP(3) NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 1,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ChurchSetting" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
  "churchName" TEXT NOT NULL DEFAULT 'Gereja',
  "logo" TEXT,
  "province" TEXT,
  "regency" TEXT,
  "district" TEXT,
  "village" TEXT,
  "pastor" TEXT,
  "treasurer" TEXT,
  "secretary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'PELAYAN',
  "servantNo" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign keys only if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Attendance_serviceId_fkey') THEN
    ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WeeklySong_songId_fkey') THEN
    ALTER TABLE "WeeklySong" ADD CONSTRAINT "WeeklySong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WeeklySong_serviceId_fkey') THEN
    ALTER TABLE "WeeklySong" ADD CONSTRAINT "WeeklySong_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Create index on User.username if not exists
CREATE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
`;

export async function GET() {
  const prisma = new PrismaClient();
  try {
    const results: string[] = [];

    // 1. Create all tables
    try {
      await prisma.$executeRawUnsafe(CREATE_TABLES_SQL);
      results.push('✅ Database tables created/verified');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      // Tables might already exist, that's OK
      if (msg.includes('already exists')) {
        results.push('⏭️ Tables already exist');
      } else {
        results.push(`⚠️ Table creation: ${msg.substring(0, 300)}`);
      }
    }

    // 2. Ensure ChurchSetting exists
    try {
      const existingSetting = await prisma.churchSetting.findUnique({
        where: { id: 'default' },
      });

      if (!existingSetting) {
        await prisma.churchSetting.create({
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

    // 3. Ensure Admin user exists
    try {
      const existingAdmin = await prisma.user.findUnique({
        where: { username: 'admin' },
      });

      if (!existingAdmin) {
        await prisma.user.create({
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
  } finally {
    await prisma.$disconnect();
  }
}

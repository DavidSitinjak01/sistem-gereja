import { PrismaClient } from '@prisma/client';
import { hashPassword } from './auth-utils';

/**
 * Database auto-setup module.
 * Ensures all required tables exist and seeds the admin user + default settings.
 * Uses a global promise so setup only runs once per serverless function cold start.
 */

const globalForSetup = globalThis as unknown as {
  dbSetupPromise: Promise<boolean> | undefined;
};

// Individual CREATE TABLE statements (more reliable with Supabase pgBouncer than multi-statement)
const CREATE_TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Member" (
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
  )`,

  `CREATE TABLE IF NOT EXISTS "Service" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "dayOfWeek" TEXT,
    "time" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "ChurchEvent" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "Finance" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "serviceId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "Song" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "category" TEXT,
    "lyrics" TEXT,
    "chord" TEXT,
    "songNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "WeeklySong" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "songId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "weekDate" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "ChurchSetting" (
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
  )`,

  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PELAYAN',
    "servantNo" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

const FOREIGN_KEY_STATEMENTS = [
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Attendance_serviceId_fkey') THEN
      ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WeeklySong_songId_fkey') THEN
      ALTER TABLE "WeeklySong" ADD CONSTRAINT "WeeklySong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WeeklySong_serviceId_fkey') THEN
      ALTER TABLE "WeeklySong" ADD CONSTRAINT "WeeklySong_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
];

const INDEX_STATEMENTS = [
  `CREATE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`,
];

/**
 * Ensures the database is set up with all required tables and seed data.
 * Uses a global promise so it only runs once per serverless function cold start.
 * Returns true if setup was successful, false if it failed.
 */
export async function ensureDbSetup(): Promise<boolean> {
  if (!globalForSetup.dbSetupPromise) {
    globalForSetup.dbSetupPromise = performSetup();
  }
  return globalForSetup.dbSetupPromise;
}

/**
 * Check if setup has been completed (useful for avoiding redundant calls).
 */
export function isDbReady(): boolean {
  return globalForSetup.dbSetupPromise !== undefined;
}

async function performSetup(): Promise<boolean> {
  // Use a separate PrismaClient to avoid any circular dependency with the extended client
  const prisma = new PrismaClient();
  try {
    console.log('[DB_SETUP] Starting database setup...');

    // 1. Create all tables (individual statements for pgBouncer compatibility)
    for (const sql of CREATE_TABLE_STATEMENTS) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        if (!msg.includes('already exists')) {
          console.warn('[DB_SETUP] Table creation warning:', msg.substring(0, 200));
        }
      }
    }

    // 2. Add foreign keys
    for (const sql of FOREIGN_KEY_STATEMENTS) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        if (!msg.includes('already exists')) {
          console.warn('[DB_SETUP] Foreign key warning:', msg.substring(0, 200));
        }
      }
    }

    // 3. Create indexes
    for (const sql of INDEX_STATEMENTS) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        if (!msg.includes('already exists')) {
          console.warn('[DB_SETUP] Index creation warning:', msg.substring(0, 200));
        }
      }
    }

    // 4. Seed default church settings if not exist
    try {
      const existingSetting = await prisma.churchSetting.findUnique({
        where: { id: 'default' },
      });
      if (!existingSetting) {
        await prisma.churchSetting.create({
          data: { id: 'default', churchName: 'Gereja' },
        });
        console.log('[DB_SETUP] Default church settings created');
      }
    } catch (e) {
      console.warn('[DB_SETUP] ChurchSetting seed warning:', e instanceof Error ? e.message.substring(0, 200) : 'error');
    }

    // 5. Seed admin user if not exist
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
        console.log('[DB_SETUP] Admin user created');
      }
    } catch (e) {
      console.warn('[DB_SETUP] Admin user seed warning:', e instanceof Error ? e.message.substring(0, 200) : 'error');
    }

    console.log('[DB_SETUP] Database setup complete');
    return true;
  } catch (error) {
    console.error('[DB_SETUP] Setup failed:', error);
    // Reset the promise so it can be retried on next request
    globalForSetup.dbSetupPromise = undefined;
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

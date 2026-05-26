import { PrismaClient } from '@prisma/client';
import { hashPassword } from './auth-utils';

/**
 * Database auto-setup module.
 * Ensures all required tables exist and seeds the admin user + default settings.
 * Uses a global promise so setup only runs once per serverless function cold start.
 *
 * IMPORTANT: Vercel serverless functions don't support IPv6 outbound connections.
 * Supabase direct connections (db.XXXX.supabase.co) resolve to IPv6 only.
 * This module automatically detects direct Supabase URLs and converts them to
 * the pooler URL (IPv4) which Vercel can reach.
 */

const globalForSetup = globalThis as unknown as {
  dbSetupPromise: Promise<boolean> | undefined;
};

/**
 * Converts a Supabase direct connection URL to a pooler URL.
 * Direct: postgresql://postgres:PASS@db.XXXX.supabase.co:5432/postgres
 * Pooler: postgresql://postgres.XXXX:PASS@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
 *
 * If the URL is not a Supabase direct URL, returns it unchanged.
 */
function convertToPoolerUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Match Supabase direct connection pattern: db.XXXX.supabase.co
    const match = parsed.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
    if (!match) return url;

    const projectId = match[1];
    const password = parsed.password;
    const database = parsed.pathname.slice(1) || 'postgres';

    // Determine region - default to ap-southeast-1 (Singapore)
    // Common regions: us-east-1, us-east-2, us-west-1, eu-west-1, eu-central-1, ap-southeast-1, ap-northeast-1
    const region = process.env.SUPABASE_REGION || 'ap-southeast-1';

    const poolerUrl = `postgresql://postgres.${projectId}:${password}@aws-0-${region}.pooler.supabase.com:6543/${database}?pgbouncer=true&connection_limit=1`;

    console.log(`[DB_SETUP] Auto-converted direct Supabase URL to pooler URL for Vercel compatibility`);
    console.log(`[DB_SETUP] Project ID: ${projectId}, Region: ${region}`);

    return poolerUrl;
  } catch {
    console.warn('[DB_SETUP] Could not parse DATABASE_URL, using as-is');
    return url;
  }
}

/**
 * Gets the appropriate database URL for Vercel deployment.
 * If using Supabase direct connection (IPv6), converts to pooler (IPv4).
 */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return '';
  return convertToPoolerUrl(url);
}

// Individual CREATE TABLE statements
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

// Simplified foreign key statements (no DO $$ blocks - better PgBouncer compatibility)
// We just try to add them and ignore "already exists" errors
const FOREIGN_KEY_STATEMENTS = [
  `ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "WeeklySong" ADD CONSTRAINT "WeeklySong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "WeeklySong" ADD CONSTRAINT "WeeklySong_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
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

/**
 * Get the effective database URL, converting Supabase direct to pooler if needed.
 * Also exported for use by db.ts and health endpoint.
 */
export function getEffectiveDatabaseUrl(): string {
  return getDatabaseUrl();
}

async function performSetup(): Promise<boolean> {
  const effectiveUrl = getDatabaseUrl();

  // Create PrismaClient with the effective URL (pooler if needed)
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: effectiveUrl,
      },
    },
  });

  try {
    console.log('[DB_SETUP] Starting database setup...');

    // First, ensure pgcrypto extension is available for gen_random_uuid()
    try {
      await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.warn('[DB_SETUP] pgcrypto extension warning:', msg.substring(0, 200));
    }

    // 1. Create all tables
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

    // 2. Add foreign keys (ignore "already exists" errors)
    for (const sql of FOREIGN_KEY_STATEMENTS) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        if (!msg.includes('already exists') && !msg.includes('42710')) {
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

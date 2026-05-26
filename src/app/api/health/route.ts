import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ensureDbSetup } from '@/lib/db-setup';

// GET /api/health — Diagnostic endpoint to check database connection and setup
export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    steps: [] as Array<{ step: string; status: string; detail?: string }>,
  };

  // Step 1: Check if DATABASE_URL is set
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    diagnostics.steps.push({ step: 'DATABASE_URL check', status: 'FAIL', detail: 'DATABASE_URL is not set' });
    return NextResponse.json(diagnostics, { status: 500 });
  }

  // Mask the password in the URL for security
  let maskedUrl = dbUrl;
  try {
    const urlObj = new URL(dbUrl);
    if (urlObj.password) {
      urlObj.password = '***';
      maskedUrl = urlObj.toString();
    }
  } catch {
    maskedUrl = 'Invalid URL format';
  }

  diagnostics.steps.push({ step: 'DATABASE_URL check', status: 'OK', detail: `URL: ${maskedUrl}` });

  // Step 2: Test database connection
  const testPrisma = new PrismaClient();
  try {
    await testPrisma.$queryRaw`SELECT 1 as test`;
    diagnostics.steps.push({ step: 'Database connection', status: 'OK', detail: 'Successfully connected to database' });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error';
    diagnostics.steps.push({ step: 'Database connection', status: 'FAIL', detail: errMsg.substring(0, 500) });
    await testPrisma.$disconnect();
    return NextResponse.json(diagnostics, { status: 500 });
  }

  // Step 3: Check if tables exist
  try {
    const tables = await testPrisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    const tableNames = tables.map(t => t.tablename);
    const requiredTables = ['User', 'ChurchSetting', 'Member', 'Service', 'ChurchEvent', 'Finance', 'Attendance', 'Song', 'WeeklySong'];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));

    if (missingTables.length > 0) {
      diagnostics.steps.push({
        step: 'Tables check',
        status: 'MISSING',
        detail: `Missing tables: ${missingTables.join(', ')}. Existing: ${tableNames.join(', ') || 'none'}`,
      });

      // Run auto-setup
      const setupResult = await ensureDbSetup();
      diagnostics.steps.push({
        step: 'Auto setup',
        status: setupResult ? 'OK' : 'FAIL',
        detail: setupResult ? 'Tables created and seeded successfully' : 'Setup failed - check server logs',
      });
    } else {
      diagnostics.steps.push({
        step: 'Tables check',
        status: 'OK',
        detail: `All ${requiredTables.length} required tables exist`,
      });
    }
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error';
    diagnostics.steps.push({ step: 'Tables check', status: 'FAIL', detail: errMsg.substring(0, 500) });

    const setupResult = await ensureDbSetup();
    diagnostics.steps.push({
      step: 'Auto setup',
      status: setupResult ? 'OK' : 'FAIL',
      detail: setupResult ? 'Tables created and seeded successfully' : 'Setup failed',
    });
  }

  // Step 4: Check admin user
  try {
    const adminUser = await testPrisma.user.findUnique({ where: { username: 'admin' } });
    diagnostics.steps.push({
      step: 'Admin user check',
      status: adminUser ? 'OK' : 'MISSING',
      detail: adminUser ? 'Admin user exists' : 'Admin user not found',
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error';
    diagnostics.steps.push({ step: 'Admin user check', status: 'FAIL', detail: errMsg.substring(0, 300) });
  }

  await testPrisma.$disconnect();

  const allOk = diagnostics.steps.every((s: { status: string }) => s.status === 'OK' || s.status === 'MISSING');
  return NextResponse.json(diagnostics, { status: allOk ? 200 : 500 });
}
